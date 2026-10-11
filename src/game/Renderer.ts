/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Application, Graphics, Container } from 'pixi.js';
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_RADIUS } from './constants';

export class Renderer {
  public app: Application;
  public world: Container;
  public attackRadiusGraphics: Graphics;
  public orbsContainer: Container;
  public orbsGraphics: Graphics;
  public cardEntitiesGraphics: Graphics;
  public unoBarGraphics: Graphics;
  public specialEffectsGraphics: Graphics;
  public ailmentGraphics: Graphics;
  public playerGraphics: Container; // Container hosting static body, eyes, and dynamic pupils
  public enemyContainer: Container;
  public projectileContainer: Container;
  public popupContainer: Container;

  // Optimized Player Sub-elements (pre-rendered once to avoid rebuilding vertex buffers every frame)
  private playerBodyGraphics: Graphics;
  private playerEyesGraphics: Graphics;
  private playerPupilsGraphics: Graphics;
  private currentPupilX: number = 0;
  private currentPupilY: number = 0;

  // Radar render caching
  private lastDrawnRadius: number = -1;
  private lastShowGizmo: boolean = false;
  private lastPulseProgress: number = -1;

  // Orbs render caching
  private lastOrbCount: number = -1;
  private lastOrbRadius: number = -1;

  private isHighPerformance: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.app = new Application();
  }

  public async init(canvas: HTMLCanvasElement, highPerformanceMode: boolean = false) {
    this.isHighPerformance = highPerformanceMode;

    // Cap resolution to avoid 3x/4x Retina fill-rate performance bottlenecks
    const targetDpr = highPerformanceMode ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    await this.app.init({
      canvas,
      width: GAME_WIDTH,
      height: GAME_HEIGHT,
      backgroundColor: 0x0f0b1e, // Deep cosmic navy/purple
      resolution: targetDpr,
      autoDensity: true,
      antialias: false,
      roundPixels: true, // Enables fast GPU pixel snapping and batching
      autoStart: false, // Turn off Pixi's duplicate internal ticker; GameManager drives the loop
      powerPreference: 'high-performance',
    });

    this.world = new Container();
    this.app.stage.addChild(this.world);

    // 1. Attack radius background visual layer
    this.attackRadiusGraphics = new Graphics();
    this.world.addChild(this.attackRadiusGraphics);

    // 2. Entities layers
    this.enemyContainer = new Container();
    this.projectileContainer = new Container();
    this.world.addChild(this.enemyContainer);
    this.world.addChild(this.projectileContainer);

    // 3. Orbiting Orbs Container & Graphics Layer
    this.orbsContainer = new Container();
    this.orbsContainer.x = GAME_WIDTH / 2;
    this.orbsContainer.y = GAME_HEIGHT / 2;
    this.orbsGraphics = new Graphics();
    this.orbsContainer.addChild(this.orbsGraphics);
    this.world.addChild(this.orbsContainer);

    // 3.5. Card Orbiting Entities Graphics Layer
    this.cardEntitiesGraphics = new Graphics();
    this.world.addChild(this.cardEntitiesGraphics);

    // 3.6. Uno Reverse Momentum Bar Layer
    this.unoBarGraphics = new Graphics();
    this.world.addChild(this.unoBarGraphics);

    // 3.7. Special Effects Graphics Layer (Rockets, Laser Sweep, Mortar Reticles & Explosions, Deflections)
    this.specialEffectsGraphics = new Graphics();
    this.world.addChild(this.specialEffectsGraphics);

    // 3.8. Enemy Ailments Overlay Layer
    this.ailmentGraphics = new Graphics();
    this.world.addChild(this.ailmentGraphics);

    // 4. Player Layer (Structured Container with pre-baked geometry)
    this.playerGraphics = new Container();
    this.playerGraphics.x = GAME_WIDTH / 2;
    this.playerGraphics.y = GAME_HEIGHT / 2;

    this.playerBodyGraphics = new Graphics();
    this.playerEyesGraphics = new Graphics();
    this.playerPupilsGraphics = new Graphics();

    this.buildStaticPlayerGeometry();
    this.playerGraphics.addChild(this.playerBodyGraphics);
    this.playerGraphics.addChild(this.playerEyesGraphics);
    this.playerGraphics.addChild(this.playerPupilsGraphics);
    this.world.addChild(this.playerGraphics);

    // 5. Popups layer (above entities and player)
    this.popupContainer = new Container();
    this.world.addChild(this.popupContainer);
    
    this.world.x = 0;
    this.world.y = 0;
  }

  public setHighPerformanceMode(enabled: boolean) {
    if (this.isHighPerformance === enabled || !this.app.renderer) return;
    this.isHighPerformance = enabled;
    const targetDpr = enabled ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.app.renderer.resolution = targetDpr;
    this.app.renderer.resize(this.app.canvas.width / targetDpr, this.app.canvas.height / targetDpr);
  }

  private buildStaticPlayerGeometry() {
    const sides = 5;
    const radius = PLAYER_RADIUS;
    const points: {x: number, y: number}[] = [];
    for (let i = 0; i < sides; i++) {
      points.push({
        x: Math.cos((i / sides) * Math.PI * 2 - Math.PI / 2) * radius,
        y: Math.sin((i / sides) * Math.PI * 2 - Math.PI / 2) * radius
      });
    }

    // 1. Static Body & Shadow & Glow
    this.playerBodyGraphics.clear();
    this.playerBodyGraphics
      .ellipse(0, radius - 2, radius, 4)
      .fill({ color: 0x000000, alpha: 0.3 });

    this.playerBodyGraphics
      .poly(points)
      .fill(0x10b981)
      .stroke({ color: 0x064e3b, width: 1.5 });

    this.playerBodyGraphics
      .poly(points)
      .stroke({ color: 0x34d399, width: 3.5, alpha: 0.35 });

    // 2. Static White Sclera
    const leftEyeX = -4;
    const rightEyeX = 4;
    const eyeY = -2;

    this.playerEyesGraphics.clear();
    this.playerEyesGraphics
      .circle(leftEyeX, eyeY, 2.5)
      .circle(rightEyeX, eyeY, 2.5)
      .fill(0xffffff);

    // 3. Initial Dark Green Pupils
    this.playerPupilsGraphics.clear();
    this.playerPupilsGraphics
      .circle(leftEyeX, eyeY, 1.2)
      .circle(rightEyeX, eyeY, 1.2)
      .fill(0x064e3b);
  }

  public drawAttackRadius(radius: number, showGizmo: boolean = true, pulseProgress: number = 0) {
    if (!showGizmo) {
      if (this.attackRadiusGraphics.visible) {
        this.attackRadiusGraphics.visible = false;
        this.attackRadiusGraphics.clear();
        this.lastDrawnRadius = -1;
      }
      return;
    }

    this.attackRadiusGraphics.visible = true;

    // Cache hit: avoid regenerating WebGL buffers if nothing changed
    if (
      radius === this.lastDrawnRadius &&
      showGizmo === this.lastShowGizmo &&
      pulseProgress === this.lastPulseProgress &&
      pulseProgress === 0
    ) {
      return;
    }

    this.lastDrawnRadius = radius;
    this.lastShowGizmo = showGizmo;
    this.lastPulseProgress = pulseProgress;

    this.attackRadiusGraphics.clear();
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const baseAlpha = 0.035 + (pulseProgress > 0 ? (1 - pulseProgress) * 0.08 : 0);
    const strokeAlpha = 0.28 + (pulseProgress > 0 ? (1 - pulseProgress) * 0.45 : 0);

    // 1. Subtle inner ambient fill
    this.attackRadiusGraphics
      .circle(cx, cy, radius)
      .fill({ color: 0x38bdf8, alpha: baseAlpha })
      .stroke({ color: 0x38bdf8, width: 1, alpha: strokeAlpha });

    // 2. Crisp dashed perimeter arc rings
    const segments = 24;
    for (let i = 0; i < segments; i += 2) {
      const a1 = (i / segments) * Math.PI * 2;
      const a2 = ((i + 0.85) / segments) * Math.PI * 2;
      const x1 = cx + Math.cos(a1) * radius;
      const y1 = cy + Math.sin(a1) * radius;
      const x2 = cx + Math.cos(a2) * radius;
      const y2 = cy + Math.sin(a2) * radius;
      this.attackRadiusGraphics
        .moveTo(x1, y1)
        .lineTo(x2, y2)
        .stroke({ color: 0x7dd3fc, width: 1.5, alpha: 0.65 });
    }

    // 3. Four cardinal perimeter pip reticles (N, S, E, W)
    const pipLength = 4;
    const cardinals = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
    for (const angle of cardinals) {
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      this.attackRadiusGraphics
        .moveTo(cx + cosA * (radius - pipLength), cy + sinA * (radius - pipLength))
        .lineTo(cx + cosA * (radius + pipLength), cy + sinA * (radius + pipLength))
        .stroke({ color: 0x38bdf8, width: 1.5, alpha: 0.75 });
    }
  }

  public drawOrbitingOrbs(orbCount: number, orbAngle: number, orbRadius: number = 36) {
    if (orbCount <= 0) {
      this.orbsContainer.visible = false;
      this.lastOrbCount = 0;
      return;
    }

    this.orbsContainer.visible = true;

    // Fast GPU Rotation: update rotation matrix on container
    this.orbsContainer.rotation = orbAngle;

    // Only rebuild orb graphics if count or radius changed
    if (orbCount === this.lastOrbCount && orbRadius === this.lastOrbRadius) {
      return;
    }

    this.lastOrbCount = orbCount;
    this.lastOrbRadius = orbRadius;
    this.orbsGraphics.clear();

    // Orbit ring track centered at (0, 0) of orbsContainer
    this.orbsGraphics
      .circle(0, 0, orbRadius)
      .stroke({ color: 0x38bdf8, width: 0.75, alpha: 0.2 });

    for (let i = 0; i < orbCount; i++) {
      const angle = (i * (Math.PI * 2 / orbCount));
      const ox = Math.cos(angle) * orbRadius;
      const oy = Math.sin(angle) * orbRadius;

      // Glow halo
      this.orbsGraphics
        .circle(ox, oy, 6)
        .fill({ color: 0x06b6d4, alpha: 0.25 });

      // Core particle
      this.orbsGraphics
        .circle(ox, oy, 3.5)
        .fill(0x38bdf8)
        .stroke({ color: 0xffffff, width: 1 });
    }
  }

  public drawPlayer(targetAngle: number | null = null, eyeRollAngle: number | null = null, isDead: boolean = false) {
    if (isDead) {
      this.playerGraphics.visible = false;
      return;
    }

    this.playerGraphics.visible = true;

    // Calculate target pupil offsets
    let targetX = 0;
    let targetY = 0;

    if (eyeRollAngle !== null) {
      const rollRadius = 1.3;
      targetX = Math.cos(eyeRollAngle) * rollRadius;
      targetY = Math.sin(eyeRollAngle) * rollRadius;
      this.currentPupilX = targetX;
      this.currentPupilY = targetY;
    } else {
      if (targetAngle !== null) {
        const maxOffset = 1.4;
        targetX = Math.cos(targetAngle) * maxOffset;
        targetY = Math.sin(targetAngle) * maxOffset;
      }
      const lerpFactor = 0.2;
      this.currentPupilX += (targetX - this.currentPupilX) * lerpFactor;
      this.currentPupilY += (targetY - this.currentPupilY) * lerpFactor;
    }

    // Direct GPU coordinate translation instead of rebuilding geometry
    this.playerPupilsGraphics.x = this.currentPupilX;
    this.playerPupilsGraphics.y = this.currentPupilY;
  }

  public drawCardEntities(entities: Array<{
    type: 'orbital_totem' | 'toxic_drone' | 'gravity_anchor' | 'energy_beacon' | 'shredder_field' | 'singularity_core' | 'land_mine';
    x: number;
    y: number;
    angle: number;
    radius: number;
    level: number;
  }>) {
    this.cardEntitiesGraphics.clear();
    if (!entities || entities.length === 0) return;

    for (const ent of entities) {
      if (ent.type === 'orbital_totem') {
        // Orbit ring track to player
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, ent.radius)
          .stroke({ color: 0x38bdf8, width: 1, alpha: 0.35 })
          .circle(ent.x, ent.y, ent.radius)
          .fill({ color: 0x38bdf8, alpha: 0.08 });
        
        // Totem diamond core
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, 7)
          .fill(0x0284c7)
          .stroke({ color: 0xbae6fd, width: 1.5 });
      } else if (ent.type === 'toxic_drone') {
        // Biohazard aura
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, ent.radius)
          .fill({ color: 0x22c55e, alpha: 0.12 })
          .circle(ent.x, ent.y, ent.radius)
          .stroke({ color: 0x4ade80, width: 1, alpha: 0.4 });
        
        // Drone core
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, 6)
          .fill(0x16a34a)
          .stroke({ color: 0x86efac, width: 1.5 });
      } else if (ent.type === 'gravity_anchor') {
        // Gravity Field
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, ent.radius)
          .fill({ color: 0xa855f7, alpha: 0.10 })
          .circle(ent.x, ent.y, ent.radius)
          .stroke({ color: 0xc084fc, width: 1.2, alpha: 0.5 });
        
        // Anchor core
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, 8)
          .fill(0x7e22ce)
          .stroke({ color: 0xe9d5ff, width: 1.5 });
      } else if (ent.type === 'energy_beacon') {
        // Energy pulse field
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, ent.radius)
          .fill({ color: 0xf59e0b, alpha: 0.15 })
          .circle(ent.x, ent.y, ent.radius)
          .stroke({ color: 0xfcd34d, width: 1.2, alpha: 0.6 });
        
        // Beacon core
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, 7)
          .fill(0xd97706)
          .stroke({ color: 0xfef08a, width: 1.5 });
      } else if (ent.type === 'shredder_field') {
        // Shredder Buzz Field
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, ent.radius)
          .fill({ color: 0xef4444, alpha: 0.15 })
          .circle(ent.x, ent.y, ent.radius)
          .stroke({ color: 0xf87171, width: 1.5, alpha: 0.6 });
        
        // Saw blades
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, 7)
          .fill(0xb91c1c)
          .stroke({ color: 0xfca5a5, width: 1.5 });
      } else if (ent.type === 'singularity_core') {
        // Gravitational singularity event horizon
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, ent.radius)
          .fill({ color: 0x581c87, alpha: 0.25 })
          .circle(ent.x, ent.y, ent.radius * 0.6)
          .fill({ color: 0x3b0764, alpha: 0.45 })
          .circle(ent.x, ent.y, ent.radius)
          .stroke({ color: 0xd8b4fe, width: 2, alpha: 0.7 });

        // Core Singularity Black Hole
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, 10)
          .fill(0x0f172a)
          .stroke({ color: 0xc084fc, width: 2 });
      } else if (ent.type === 'land_mine') {
        // Outer warning track
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, ent.radius)
          .stroke({ color: 0xfacc15, width: 1.2, alpha: 0.65, alignment: 0.5 })
          .circle(ent.x, ent.y, ent.radius)
          .fill({ color: 0xfacc15, alpha: 0.1 });
        // Core blinking sensor
        const blinkColor = (Math.floor(Date.now() / 250) % 2 === 0) ? 0xef4444 : 0xfacc15;
        this.cardEntitiesGraphics
          .circle(ent.x, ent.y, 4)
          .fill(blinkColor);
      }
    }
  }

  public drawUnoReverseBar(hits: number, maxHits: number = 20) {
    this.unoBarGraphics.clear();
    if (hits <= 0) return;

    const barW = 36;
    const barH = 5;
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2 - 25;

    const ratio = Math.min(1, Math.max(0, hits / maxHits));
    const isFull = hits >= maxHits;

    // Background border/track
    this.unoBarGraphics
      .rect(cx - barW / 2, cy, barW, barH)
      .fill({ color: 0x0f172a, alpha: 0.85 })
      .stroke({ color: 0x475569, width: 1 });

    // Progress fill
    const fillColor = isFull ? 0xfacc15 : (ratio > 0.5 ? 0xf97316 : 0xef4444);
    if (ratio > 0) {
      this.unoBarGraphics
        .rect(cx - barW / 2 + 0.5, cy + 0.5, (barW - 1) * ratio, barH - 1)
        .fill(fillColor);
    }
  }

  /**
   * Draws dynamic combat VFX: Rockets, Laser Sweeps, Mortar Reticles/Explosions, and Shield Deflections.
   */
  public drawSpecialCombatEffects(params: {
    rockets: Array<{ x: number; y: number; angle: number; trail: Array<{ x: number; y: number; alpha: number }> }>;
    explosions: Array<{ x: number; y: number; radius: number; maxRadius: number; color: number; alpha: number }>;
    laserSweep: { active: boolean; currentAngle: number; startAngle: number; endAngle: number; radius: number; progress: number } | null;
    mortars: Array<{ x: number; y: number; radius: number; progress: number; isLanding: boolean }>;
    deflections: Array<{ x: number; y: number; radius: number; alpha: number }>;
    lightningArcs?: Array<{ x1: number; y1: number; x2: number; y2: number; alpha: number; color?: number }>;
    poisonClouds?: Array<{ x: number; y: number; radius: number; lifeMs: number; maxLifeMs: number }>;
    shrapnelRainfalls?: Array<{ x: number; y: number; radius: number; lifeMs: number; maxLifeMs: number }>;
  }) {
    this.specialEffectsGraphics.clear();
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    // 1. Mortar Ground Reticles
    for (const m of params.mortars) {
      const pulseAlpha = 0.3 + 0.5 * (1 - m.progress);
      
      // Outer warning radius
      this.specialEffectsGraphics
        .circle(m.x, m.y, m.radius)
        .stroke({ color: 0xef4444, width: 2, alpha: pulseAlpha })
        .fill({ color: 0xef4444, alpha: 0.12 * (1 - m.progress) });

      // Countdown inner ring
      const innerR = Math.max(4, m.radius * (1 - m.progress));
      this.specialEffectsGraphics
        .circle(m.x, m.y, innerR)
        .stroke({ color: 0xfbbf24, width: 1.5, alpha: 0.8 });

      // Holographic targeting crosshairs
      const crossSize = 14;
      this.specialEffectsGraphics
        .moveTo(m.x - crossSize, m.y)
        .lineTo(m.x + crossSize, m.y)
        .moveTo(m.x, m.y - crossSize)
        .lineTo(m.x, m.y + crossSize)
        .stroke({ color: 0xf87171, width: 1.5, alpha: pulseAlpha });
      
      // Center lock-on dot
      this.specialEffectsGraphics
        .circle(m.x, m.y, 3)
        .fill(0xffffff);
    }

    // 2. Rockets & Rocket Trails
    for (const r of params.rockets) {
      // Draw exhaust smoke / fire trail
      for (const t of r.trail) {
        const trailRadius = 2.5 + (1 - t.alpha) * 4.5;
        this.specialEffectsGraphics
          .circle(t.x, t.y, trailRadius * t.alpha)
          .fill({ color: 0xf97316, alpha: t.alpha * 0.5 }) // Smoke outer
          .circle(t.x, t.y, (trailRadius * 0.5) * t.alpha)
          .fill({ color: 0xfef08a, alpha: t.alpha * 0.8 }); // Fire inner
      }

      // Draw sleek micro-rocket body
      const angle = r.angle;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      
      const headX = r.x + cosA * 9;
      const headY = r.y + sinA * 9;
      const bodyBackX = r.x - cosA * 4;
      const bodyBackY = r.y - sinA * 4;
      
      // Side Fins
      const finAngle1 = angle + Math.PI * 0.8;
      const finAngle2 = angle - Math.PI * 0.8;
      
      this.specialEffectsGraphics
        .poly([
          { x: bodyBackX, y: bodyBackY },
          { x: bodyBackX + Math.cos(finAngle1) * 7, y: bodyBackY + Math.sin(finAngle1) * 7 },
          { x: r.x, y: r.y }
        ]).fill(0xef4444)
        .poly([
          { x: bodyBackX, y: bodyBackY },
          { x: bodyBackX + Math.cos(finAngle2) * 7, y: bodyBackY + Math.sin(finAngle2) * 7 },
          { x: r.x, y: r.y }
        ]).fill(0xef4444);

      // Main Rocket Body (Cylindrical)
      this.specialEffectsGraphics
        .moveTo(headX, headY)
        .lineTo(r.x + Math.cos(angle + Math.PI/2) * 2.5 - cosA * 4, r.y + Math.sin(angle + Math.PI/2) * 2.5 - sinA * 4)
        .lineTo(r.x - Math.cos(angle + Math.PI/2) * 2.5 - cosA * 4, r.y - Math.sin(angle + Math.PI/2) * 2.5 - sinA * 4)
        .closePath()
        .fill(0xd1d5db) // Metallic silver
        .stroke({ color: 0x4b5563, width: 1 });

      // Rocket nose cone
      this.specialEffectsGraphics
        .circle(headX, headY, 2.5)
        .fill(0xef4444);
      
      // Thruster Flare
      this.specialEffectsGraphics
        .circle(bodyBackX, bodyBackY, 3)
        .fill({ color: 0xfacc15, alpha: 0.8 });
    }

    // 3. Laser Sweep Arc Beam
    if (params.laserSweep && params.laserSweep.active) {
      const ls = params.laserSweep;
      const angle = ls.currentAngle;
      const endX = cx + Math.cos(angle) * ls.radius;
      const endY = cy + Math.sin(angle) * ls.radius;

      // Swept arc slice / sector glow trailing behind the beam (creating the curved ")" shape)
      const sweepProgress = ls.progress;
      const trailAngleSpan = (ls.endAngle - ls.startAngle) * Math.min(0.5, sweepProgress);
      const trailStartAngle = angle - trailAngleSpan;

      // Arc sweep trail fan
      this.specialEffectsGraphics
        .moveTo(cx, cy)
        .arc(cx, cy, ls.radius * 0.95, Math.min(trailStartAngle, angle), Math.max(trailStartAngle, angle))
        .lineTo(cx, cy)
        .fill({ color: 0x06b6d4, alpha: 0.18 });

      // Curved ")" arc perimeter slice cut line
      this.specialEffectsGraphics
        .arc(cx, cy, ls.radius * 0.95, Math.min(ls.startAngle, angle), Math.max(ls.startAngle, angle))
        .stroke({ color: 0x38bdf8, width: 2.5, alpha: 0.7 });

      // Outer laser bloom beam
      this.specialEffectsGraphics
        .moveTo(cx, cy)
        .lineTo(endX, endY)
        .stroke({ color: 0x00e5ff, width: 5, alpha: 0.45 });

      // Core razor-sharp neon beam
      this.specialEffectsGraphics
        .moveTo(cx, cy)
        .lineTo(endX, endY)
        .stroke({ color: 0xffffff, width: 2, alpha: 0.95 });

      // Beam origin energy flare
      this.specialEffectsGraphics
        .circle(cx, cy, 9)
        .fill({ color: 0x38bdf8, alpha: 0.6 })
        .circle(cx, cy, 5)
        .fill(0xffffff);

      // Beam tip impact spark
      this.specialEffectsGraphics
        .circle(endX, endY, 6)
        .fill({ color: 0x00f5ff, alpha: 0.8 })
        .circle(endX, endY, 3)
        .fill(0xffffff);
    }

    // 4. Concussive Explosions (Rockets, Mortars)
    for (const exp of params.explosions) {
      const radius = exp.radius;
      const alpha = exp.alpha;

      // Outer shockwave ring
      this.specialEffectsGraphics
        .circle(exp.x, exp.y, radius)
        .stroke({ color: exp.color, width: 2.5 * alpha, alpha });

      // Fiery inner blast core
      this.specialEffectsGraphics
        .circle(exp.x, exp.y, radius * 0.65)
        .fill({ color: exp.color, alpha: alpha * 0.35 })
        .circle(exp.x, exp.y, radius * 0.3)
        .fill({ color: 0xffffff, alpha: alpha * 0.6 });
    }

    // 5. Orbital Kinetic Shield Deflections
    for (const def of params.deflections) {
      this.specialEffectsGraphics
        .circle(def.x, def.y, def.radius)
        .stroke({ color: 0x38bdf8, width: 2, alpha: def.alpha })
        .circle(def.x, def.y, def.radius * 0.5)
        .fill({ color: 0x0284c7, alpha: def.alpha * 0.4 });
    }

    // 6. Lightning Zaps / Electric Arcs
    if (params.lightningArcs) {
      for (const arc of params.lightningArcs) {
        if (arc.alpha <= 0) continue;
        const col = arc.color ?? 0x38bdf8;
        const steps = 4;
        const dx = arc.x2 - arc.x1;
        const dy = arc.y2 - arc.y1;
        const len = Math.hypot(dx, dy) || 1;
        const perpX = -dy / len;
        const perpY = dx / len;

        this.specialEffectsGraphics.moveTo(arc.x1, arc.y1);
        for (let s = 1; s < steps; s++) {
          const frac = s / steps;
          const offset = (Math.sin(s * 3.7 + arc.x1) > 0 ? 1 : -1) * 7;
          const mx = arc.x1 + dx * frac + perpX * offset;
          const my = arc.y1 + dy * frac + perpY * offset;
          this.specialEffectsGraphics.lineTo(mx, my);
        }
        this.specialEffectsGraphics.lineTo(arc.x2, arc.y2);
        this.specialEffectsGraphics.stroke({ color: col, width: 2.5 * arc.alpha, alpha: arc.alpha });

        this.specialEffectsGraphics.moveTo(arc.x1, arc.y1);
        this.specialEffectsGraphics.lineTo(arc.x2, arc.y2);
        this.specialEffectsGraphics.stroke({ color: 0xffffff, width: 1.2 * arc.alpha, alpha: arc.alpha * 0.95 });
      }
    }

    // 7. Poison Linger Clouds
    if (params.poisonClouds) {
      for (const cloud of params.poisonClouds) {
        const progress = 1 - (cloud.lifeMs / cloud.maxLifeMs);
        const alpha = Math.min(0.6, (1 - progress) * 2);
        this.specialEffectsGraphics
          .circle(cloud.x, cloud.y, cloud.radius)
          .fill({ color: 0x22c55e, alpha: alpha * 0.25 })
          .circle(cloud.x, cloud.y, cloud.radius * 0.8)
          .fill({ color: 0x4ade80, alpha: alpha * 0.15 })
          .stroke({ color: 0x16a34a, width: 1.5, alpha: alpha * 0.6 });
        
        // Bubbling cloud particles (pseudo-random based on position)
        for (let i = 0; i < 4; i++) {
          const px = cloud.x + Math.sin(Date.now() * 0.003 + i * 1.5) * cloud.radius * 0.6;
          const py = cloud.y + Math.cos(Date.now() * 0.002 + i * 2.1) * cloud.radius * 0.5;
          this.specialEffectsGraphics.circle(px, py, 4).fill({ color: 0x22c55e, alpha: alpha * 0.8 });
        }
      }
    }

    // 8. Shrapnel Rainfall (Sharp Glass / Bleed Area)
    if (params.shrapnelRainfalls) {
      for (const rain of params.shrapnelRainfalls) {
        const progress = 1 - (rain.lifeMs / rain.maxLifeMs);
        const alpha = Math.min(0.7, (1 - progress) * 1.5);
        
        // Area perimeter (Jagged)
        this.specialEffectsGraphics
          .circle(rain.x, rain.y, rain.radius)
          .stroke({ color: 0xef4444, width: 1.5, alpha: alpha * 0.3 });

        // Sharp Glass Shards
        const shardCount = 8;
        for (let j = 0; j < shardCount; j++) {
           const time = Date.now() * 0.005 + j;
           const rx = rain.x + (Math.cos(time) * rain.radius * 0.7);
           const ry = rain.y + (Math.sin(time) * rain.radius * 0.7);
           
           // Draw a sharp triangle (Glass Shard)
           this.specialEffectsGraphics
             .poly([
               { x: rx, y: ry - 6 },
               { x: rx + 4, y: ry + 4 },
               { x: rx - 4, y: ry + 4 }
             ])
             .fill({ color: 0xffffff, alpha: alpha * 0.9 }) // White glass shine
             .stroke({ color: 0xef4444, width: 1, alpha: alpha });
        }

        // Jagged Rainfall streaks
        const streakCount = 14;
        for (let j = 0; j < streakCount; j++) {
           const rx = rain.x + (Math.sin(j * 4.5 + rain.x) * rain.radius * 0.9);
           const ry = rain.y + (Math.cos(j * 3.2 + rain.y) * rain.radius * 0.9);
           const streakLen = 12 + Math.sin(Date.now() * 0.01 + j) * 8;
           const streakAlpha = ((Math.sin(Date.now() * 0.015 + j) + 1) / 2) * alpha;
           
           this.specialEffectsGraphics
             .moveTo(rx, ry - streakLen)
             .lineTo(rx, ry)
             .stroke({ color: 0xef4444, width: 2, alpha: streakAlpha * 0.6 });
        }
      }
    }
  }

  public drawEnemyAilments(enemies: any[]) {
    this.ailmentGraphics.clear();
    const time = Date.now();

    for (const enemy of enemies) {
      if (enemy.hp <= 0) continue;

      // --- 1. SHIELDED SHAPES (Blue energy bubble & blue shield bar) ---
      if (enemy.isShielded && enemy.shieldHp && enemy.shieldHp > 0) {
        const shieldPct = Math.max(0, Math.min(1, enemy.shieldHp / (enemy.maxShieldHp || enemy.shieldHp)));
        const shieldRadius = enemy.radius + 6;
        const shieldPulse = Math.sin(time * 0.008) * 1.5;

        // Radiant blue shield bubble
        this.ailmentGraphics
          .circle(enemy.x, enemy.y, shieldRadius + shieldPulse)
          .stroke({ color: 0x38bdf8, width: 1.8, alpha: 0.85 })
          .fill({ color: 0x0284c7, alpha: 0.12 });

        // Rotating orbital shield nodes
        for (let s = 0; s < 3; s++) {
          const sAngle = (time * 0.003 + (s * (Math.PI * 2)) / 3) % (Math.PI * 2);
          const nx = enemy.x + Math.cos(sAngle) * (shieldRadius + shieldPulse);
          const ny = enemy.y + Math.sin(sAngle) * (shieldRadius + shieldPulse);
          this.ailmentGraphics.circle(nx, ny, 2).fill(0x7dd3fc);
        }

        // Dedicated Blue Shield Bar above enemy
        const barWidth = Math.max(16, enemy.radius * 2.4);
        const barHeight = 2.5;
        const barX = enemy.x - barWidth / 2;
        const barY = enemy.y - enemy.radius - 8;

        // Shield bar track background
        this.ailmentGraphics
          .rect(barX - 0.5, barY - 0.5, barWidth + 1, barHeight + 1)
          .fill(0x082f49);

        // Shield bar active fill
        if (shieldPct > 0) {
          this.ailmentGraphics
            .rect(barX, barY, barWidth * shieldPct, barHeight)
            .fill(0x38bdf8);
        }
      }

      // --- 2. AILMENT-RESISTANT SHAPES (Elemental Resistance Badge) ---
      if (enemy.resistantAilment) {
        const badgeY = enemy.y - enemy.radius - (enemy.isShielded ? 15 : 10);
        let badgeColor = 0x10b981; // default poison
        let borderCol = 0x6ee7b7;

        if (enemy.resistantAilment === 'shock') {
          badgeColor = 0x06b6d4;
          borderCol = 0x67e8f9;
        } else if (enemy.resistantAilment === 'freeze') {
          badgeColor = 0x3b82f6;
          borderCol = 0x93c5fd;
        } else if (enemy.resistantAilment === 'decay') {
          badgeColor = 0xf97316;
          borderCol = 0xfdba74;
        } else if (enemy.resistantAilment === 'bleed') {
          badgeColor = 0xef4444;
          borderCol = 0xfca5a5;
        }

        // Resistance Shield Badge Icon
        this.ailmentGraphics
          .poly([
            { x: enemy.x, y: badgeY - 4.5 },
            { x: enemy.x + 4, y: badgeY - 2 },
            { x: enemy.x + 3, y: badgeY + 3 },
            { x: enemy.x, y: badgeY + 5 },
            { x: enemy.x - 3, y: badgeY + 3 },
            { x: enemy.x - 4, y: badgeY - 2 }
          ])
          .fill({ color: badgeColor, alpha: 0.9 })
          .stroke({ color: borderCol, width: 1 });

        // Inner glowing core dot
        this.ailmentGraphics.circle(enemy.x, badgeY, 1.2).fill(0xffffff);
      }

      // --- 3. GOLDEN SHAPES (Super Armor, Radiance, Sparkling Gold Particles) ---
      if (enemy.isGolden) {
        const pulse = Math.sin(time * 0.007) * 2;
        // Radiant golden aura
        this.ailmentGraphics
          .circle(enemy.x, enemy.y, enemy.radius + 5 + pulse)
          .stroke({ color: 0xfacc15, width: 1.5, alpha: 0.8 })
          .fill({ color: 0xfef08a, alpha: 0.1 });

        // Crown glyph on top
        const crownY = enemy.y - enemy.radius - 8;
        this.ailmentGraphics
          .poly([
            { x: enemy.x - 5, y: crownY + 2 },
            { x: enemy.x - 6, y: crownY - 3 },
            { x: enemy.x - 2.5, y: crownY - 1 },
            { x: enemy.x, y: crownY - 5 },
            { x: enemy.x + 2.5, y: crownY - 1 },
            { x: enemy.x + 6, y: crownY - 3 },
            { x: enemy.x + 5, y: crownY + 2 },
          ])
          .fill(0xfacc15)
          .stroke({ color: 0xffffff, width: 0.8 });

        // Sparkling orbiting stars / glitter particles
        for (let g = 0; g < 4; g++) {
          const gAngle = (time * 0.004 + (g * Math.PI) / 2) % (Math.PI * 2);
          const gDist = enemy.radius + 8 + Math.sin(time * 0.01 + g) * 3;
          const px = enemy.x + Math.cos(gAngle) * gDist;
          const py = enemy.y + Math.sin(gAngle) * gDist;
          
          // 4-point sparkle cross
          this.ailmentGraphics
            .moveTo(px - 2.5, py).lineTo(px + 2.5, py)
            .moveTo(px, py - 2.5).lineTo(px, py + 2.5)
            .stroke({ color: 0xfffbeb, width: 1.2, alpha: 0.9 });
        }
      }

      // --- 4. ENRAGED TRAPEZIUM (Balloon & String or Rising Smoke / Steam) ---
      if (enemy.type === 'enraged_trapezium') {
        if (enemy.hasBalloon) {
          // Buoyant floating party balloon
          const sway = Math.sin(time * 0.006 + enemy.x * 0.05) * 3;
          const balloonX = enemy.x + sway;
          const balloonY = enemy.y - enemy.radius - 14;

          // String attached to top of trapezium
          this.ailmentGraphics
            .moveTo(enemy.x, enemy.y - enemy.radius)
            .lineTo(balloonX, balloonY + 5)
            .stroke({ color: 0xfca5a5, width: 1, alpha: 0.8 });

          // Balloon oval body & highlight
          this.ailmentGraphics
            .ellipse(balloonX, balloonY, 4.5, 5.5)
            .fill(0xec4899)
            .stroke({ color: 0xffffff, width: 1, alpha: 0.9 });
          // Highlight shine
          this.ailmentGraphics
            .circle(balloonX - 1.5, balloonY - 2, 1)
            .fill({ color: 0xffffff, alpha: 0.8 });
        } else if (enemy.isEnraged) {
          // Rising smoke & steam puffs billowing upward
          for (let sm = 0; sm < 3; sm++) {
            const smPhase = (time * 0.003 + sm * 1.5) % 3;
            const smY = enemy.y - enemy.radius - (smPhase * 6);
            const smX = enemy.x + (Math.sin(time * 0.008 + sm) * 4) + (sm === 1 ? -3 : 3);
            const smAlpha = Math.max(0, 1 - smPhase / 3);
            this.ailmentGraphics
              .circle(smX, smY, 2.5 + smPhase * 1.2)
              .fill({ color: 0x71717a, alpha: smAlpha * 0.6 });
          }

          // Fiery rage flash aura
          this.ailmentGraphics
            .circle(enemy.x, enemy.y, enemy.radius + 3 + Math.sin(time * 0.02) * 1.5)
            .stroke({ color: 0xef4444, width: 1.5, alpha: 0.7 });
        }
      }

      // --- 5. DISRUPTOR EMP (Pulsating EMP Aura Ring) ---
      if (enemy.type === 'disruptor_emp' || enemy.empAuraRadius) {
        const auraR = enemy.empAuraRadius || 80;
        const empPulse = Math.sin(time * 0.01) * 3;
        
        // Faint electromagnetic interference zone
        this.ailmentGraphics
          .circle(enemy.x, enemy.y, auraR + empPulse)
          .stroke({ color: 0x06b6d4, width: 1.2, alpha: 0.4 })
          .fill({ color: 0x0891b2, alpha: 0.05 });

        // Crackling electric ion arcs around EMP core
        for (let a = 0; a < 3; a++) {
          const aAngle = (time * 0.005 + a * 2.1) % (Math.PI * 2);
          const arcX = enemy.x + Math.cos(aAngle) * (enemy.radius + 3);
          const arcY = enemy.y + Math.sin(aAngle) * (enemy.radius + 3);
          const arcTargetX = arcX + (Math.random() - 0.5) * 8;
          const arcTargetY = arcY + (Math.random() - 0.5) * 8;
          this.ailmentGraphics
            .moveTo(arcX, arcY)
            .lineTo(arcTargetX, arcTargetY)
            .stroke({ color: 0x22d3ee, width: 1.2, alpha: 0.8 });
        }
      }

      // --- 6. PHASE SHIFTER (Quantum Shimmer & Intangible Ring) ---
      if (enemy.type === 'phase_shifter' || enemy.isPhased) {
        if (enemy.isPhased) {
          const phaseAlpha = 0.4 + Math.sin(time * 0.02) * 0.2;
          this.ailmentGraphics
            .circle(enemy.x, enemy.y, enemy.radius + 6)
            .stroke({ color: 0xa855f7, width: 1.5, alpha: phaseAlpha })
            .fill({ color: 0xc084fc, alpha: 0.15 });

          // Ethereal quantum trail ghosts
          this.ailmentGraphics
            .circle(enemy.x - 3, enemy.y, enemy.radius)
            .stroke({ color: 0x8b5cf6, width: 0.8, alpha: 0.25 });
        }
      }

      // --- 7. DECAYING PLAGUE - Orange Skull & Smelly Aura ---
      if (enemy.decayStacks && enemy.decayStacks > 0) {
        const auraAlpha = 0.2 + Math.sin(time * 0.005) * 0.1;
        const radius = enemy.radius + 12;
        
        // Smelly Aura (Green/Orange wafts)
        this.ailmentGraphics
          .circle(enemy.x, enemy.y, radius)
          .fill({ color: 0xf97316, alpha: auraAlpha * 0.3 });
        
        for (let i = 0; i < 3; i++) {
          const angle = (time * 0.002 + i * 2) % (Math.PI * 2);
          const dist = radius * 0.8;
          const waftX = enemy.x + Math.cos(angle) * dist;
          const waftY = enemy.y + Math.sin(angle) * dist - (Math.sin(time * 0.003 + i) * 5);
          this.ailmentGraphics.circle(waftX, waftY, 4).fill({ color: 0x4ade80, alpha: auraAlpha });
        }

        // Orange Skull Icon above enemy
        const skullY = enemy.y - enemy.radius - (enemy.isShielded ? 18 : 15);
        this.ailmentGraphics
          .circle(enemy.x, skullY, 5) // Head
          .fill(0xf97316)
          .rect(enemy.x - 2, skullY + 3, 4, 3) // Jaw
          .fill(0xf97316)
          // Eyes
          .circle(enemy.x - 1.5, skullY - 1, 1).fill(0x000000)
          .circle(enemy.x + 1.5, skullY - 1, 1).fill(0x000000);
      }

      // --- 8. SHRAPNEL / BLEED - Blood Drip (5 Frames) ---
      if (enemy.bleedTimer && enemy.bleedTimer > 0) {
        const frame = enemy.bleedFrame || 0;
        const dripY = enemy.y + enemy.radius * 0.5 + (frame * 2);
        const dripAlpha = 1 - (frame / 5);
        
        // Main blood spot
        this.ailmentGraphics
          .circle(enemy.x, enemy.y + enemy.radius * 0.3, 3)
          .fill({ color: 0xef4444, alpha: 0.8 });

        // Drip animation
        this.ailmentGraphics
          .circle(enemy.x + (Math.sin(enemy.x) * 5), dripY, 2)
          .fill({ color: 0xef4444, alpha: dripAlpha });
      }
    }
  }

  public resize(width: number, height: number) {
    if (!this.app || !this.app.renderer) return;
    this.app.renderer.resize(width, height);
    
    // Maintain logical coordinates centering
    const scale = Math.min(width / GAME_WIDTH, height / GAME_HEIGHT);
    this.world.scale.set(scale);
    this.world.x = (width - GAME_WIDTH * scale) / 2;
    this.world.y = (height - GAME_HEIGHT * scale) / 2;
  }

  public destroy() {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
    }
  }
}

