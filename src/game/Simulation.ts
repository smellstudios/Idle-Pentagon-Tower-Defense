/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Graphics } from 'pixi.js';
import { GameState, Upgrade, LifetimeStats, Entity } from '../types';
import { Renderer } from './Renderer';
import { 
  GAME_WIDTH, 
  GAME_HEIGHT, 
  ENEMY_BASE_STATS, 
  getEnemyWaveStats,
  getTierDifficultyMultiplier,
  getTierCashMultiplier, 
  WAVE_CONFIG, 
  ATTACK_RADIUS_CONFIG, 
  PHYSICS_CONFIG,
  CARDS_CONFIG,
  rollBossRareDrop,
  calculatePlayerCombatStats,
  PlayerCombatStats,
  getBossArchetype,
} from './constants';
import { PopupManager } from './popups';
import { soundEngine } from './sound';
import { SpatialGrid } from './SpatialGrid';

export class Simulation {
  private renderer: Renderer;
  private state: GameState;
  private upgrades: Upgrade[];
  private isHandlingDeath: boolean = false;

  private enemies: Entity[] = [];
  private projectiles: Entity[] = [];
  private enemyProjectiles: Entity[] = [];
  
  // Object Pools to eliminate GC allocation spikes during combat
  private projectilePool: Entity[] = [];
  private enemyProjectilePool: Entity[] = [];
  private enemyPools: Map<string, Entity[]> = new Map();
  private spatialGrid: SpatialGrid = new SpatialGrid(60);

  public popupManager: PopupManager;
  public onRareDropAcquired?: (item: any, type: 'drop' | 'synergy') => void;

  private shotTimer: number = 0;
  private spawnTimer: number = 0;
  private damageTickTimer: number = 0;
  private orbAngle: number = 0;
  public enemiesDefeatedInRun: number = 0;
  public cashEarnedInRun: number = 0;

  // Bullet 30 FPS Throttling
  private bulletAccDelta: number = 0;
  private enemyBulletAccDelta: number = 0;

  // Frame-synced Burst Salvo timer (replaces GC-prone setTimeout)
  private rapidFirePending: number = 0;
  private rapidFireDelayMs: number = 0;

  // Card Orbiting Entities Timers
  private simTime: number = 0;
  private droneTickTimer: number = 0;
  private beaconPulseTimer: number = 0;
  private energyBeaconActiveTime: number = 0;
  private shredderTickTimer: number = 0;
  private unoReverseHits: number = 0;
  private singularityTimer: number = 0;
  private activeSingularity: { x: number; y: number; duration: number; level: number } | null = null;
  private quantumBarrierCooldownMs: number = 0;

  // Cool Skills: Rockets, Laser Sweep, Mortar Strike, Deflections
  private activeRockets: Array<{
    x: number;
    y: number;
    angle: number;
    speed: number;
    damage: number;
    blastRadius: number;
    lifeMs: number;
    trail: Array<{ x: number; y: number; alpha: number }>;
  }> = [];
  private laserSweepCooldownTimer: number = 0;
  private activeLaserSweep: {
    active: boolean;
    progress: number;
    durationMs: number;
    startAngle: number;
    endAngle: number;
    currentAngle: number;
    radius: number;
    damage: number;
    hitEnemies: Set<Entity>;
  } | null = null;
  private mortarCooldownTimer: number = 0;
  private activeMortarStrikes: Array<{
    x: number;
    y: number;
    radius: number;
    timerMs: number;
    maxTimerMs: number;
    damage: number;
  }> = [];
  private activeExplosions: Array<{
    x: number;
    y: number;
    radius: number;
    maxRadius: number;
    color: number;
    alpha: number;
    lifeMs: number;
    maxLifeMs: number;
  }> = [];
  private landMines: Array<{ x: number; y: number; radius: number; lifeMs: number }> = [];
  private landMineSpawnTimer: number = 0;
  private nukeFiredThisWave: boolean = false;
  private activeDeflections: Array<{
    x: number;
    y: number;
    radius: number;
    alpha: number;
    lifeMs: number;
    maxLifeMs: number;
  }> = [];
  private activeLightningArcs: Array<{
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    alpha: number;
    lifeMs: number;
    maxLifeMs: number;
    color?: number;
  }> = [];
  private activePoisonClouds: Array<{
    x: number;
    y: number;
    radius: number;
    lifeMs: number;
    maxLifeMs: number;
    damage: number;
  }> = [];
  private activeShrapnelRainfalls: Array<{
    x: number;
    y: number;
    radius: number;
    lifeMs: number;
    maxLifeMs: number;
    damage: number;
  }> = [];

  // Custom Weapons / Fire Protocols state
  private plasmaBeamSoundTimer: number = 0;
  private activePlasmaBeamTarget: Entity | null = null;

  // Ultimate Weapons Timers & State
  private smartMissileTimer: number = 0;
  private deathWaveTimer: number = 0;
  private poisonSwampTimer: number = 0;
  private goldenTowerTimer: number = 0;
  private spotlightAngle: number = 0;
  private innerLandmineSpawnTimer: number = 0;

  // React state update throttling to avoid 60-300Hz React component re-rendering
  private lastWaveProgressPercent: number = -1;
  private lastProgressUpdateTime: number = 0;
  private uiBatchTimer: number = 0;
  private readonly UI_BATCH_INTERVAL_MS: number = 50; // Faster UI updates (approx 3 frames at 60fps)
  private lastSyncedCash: number | undefined;
  private lastSyncedShards: number | undefined;
  private lastSyncedCells: number | undefined;
  private lastOnStateUpdate?: (updatedState: Partial<GameState>) => void;
  private pendingStateUpdate: Partial<GameState> = {};

  // Visual & Physics states
  private playerRotation: number = 0;
  private playerAngularVelocity: number = 0;
  private pulseTimer: number = 0;
  private prevEnemiesInRangeCount: number = 0;
  private waveTimeElapsed: number = 0;
  private waveEnemiesTotal: number = 8;
  private waveEnemiesSpawned: number = 0;
  private waveEnemiesDefeated: number = 0;
  private isIntermission: boolean = false;
  private intermissionTimer: number = 0;

  private get waveDurationMs(): number {
    const tier = this.state.tier || 1;
    // Tier 1: 22s, Tier 2: 18s, Tier 3: 14s
    return Math.max(10000, 22000 - (tier - 1) * 4000);
  }

  // Personality: Eye Roll state timers
  private eyeRollTimer: number = 0;
  private readonly eyeRollDuration: number = 700;
  private nextEyeRollCooldown: number = 7000 + Math.random() * 8000;
      
  constructor(renderer: Renderer, initialState: GameState, upgrades: Upgrade[]) {
    this.renderer = renderer;
    this.state = initialState;
    this.upgrades = upgrades;
    this.popupManager = new PopupManager(this.renderer.popupContainer, 80);
    this.popupManager.onCurrencyImpact = (type, amount) => {
      // Popups are now purely visual. 
      // Currency is credited instantly on spawn to prevent drops from being lost 
      // when the screen clears or the player dies before they impact.
    };
    this.prewarmPools();
  }

  private prewarmPools() {
    // 1. Pre-warm Projectile Pool (120 units)
    for (let i = 0; i < 120; i++) {
      const graphics = new Graphics();
      // Remastered clean "-" dash bullet (8.5px length, 2.0px width)
      graphics
        .roundRect(-1.0, -4.25, 2.0, 8.5, 0.75)
        .fill(0x38bdf8);
      graphics.roundRect(-0.5, -3.25, 1.0, 6.5, 0.5).fill(0xffffff);
      graphics.visible = false;
      this.renderer.projectileContainer.addChild(graphics);
      this.projectilePool.push({
        x: 0,
        y: 0,
        hp: 1,
        maxHp: 1,
        graphics,
        speed: 4.8,
        radius: 2.5,
        rotation: 0,
        angularVelocity: 0,
      });
    }

    // 2. Pre-warm Enemy Projectile Pool (60 units)
    for (let i = 0; i < 60; i++) {
      const graphics = new Graphics();
      graphics.circle(0, 0, 3).fill(0xef4444).stroke({ color: 0xffffff, width: 0.75 });
      graphics.visible = false;
      this.renderer.projectileContainer.addChild(graphics);
      this.enemyProjectilePool.push({
        x: 0,
        y: 0,
        hp: 1,
        maxHp: 1,
        graphics,
        speed: 2.2,
        radius: 3,
        rotation: 0,
        angularVelocity: 0,
      });
    }
  }

  public update(delta: number, currentTime: number, onStateUpdate: (state: Partial<GameState>) => void) {
    if (this.state.isDead) return;

    this.lastOnStateUpdate = onStateUpdate;

    // Apply Game Speed modifier (0x paused, 0.5x slow-mo, 1x normal, up to 3.0x from Labs)
    const speedMultiplier = this.state.gameSpeed !== undefined ? this.state.gameSpeed : 1.0;
    if (speedMultiplier === 0) {
      // 0x: Game is paused. Freeze combat simulation, entities, and wave progression.
      return;
    }

    const speedCardBonus = this.getEquippedCardEffect('speed') || 0;
    const effectiveDelta = delta * (speedMultiplier + speedCardBonus);
    const deltaMs = effectiveDelta * 16.67;
    const playerStats = this.getPlayerCombatStats();
    const effectiveRadius = playerStats.attackRadius;
    const r2 = effectiveRadius * effectiveRadius;

    const stateUpdate = this.pendingStateUpdate;
    const initialCash = this.state.cash || 0;
    const initialShards = this.state.cosmicShards || 0;
    const initialCells = this.state.cells || 0;

    if (this.state.attackRadius !== effectiveRadius) {
      this.pendingStateUpdate.attackRadius = effectiveRadius;
    }

    if (this.state.effectiveMaxHp !== playerStats.effectiveMaxHp) {
      this.state.effectiveMaxHp = playerStats.effectiveMaxHp;
      this.pendingStateUpdate.effectiveMaxHp = playerStats.effectiveMaxHp;
    }

    // 0. Update Popups
    this.popupManager.beginFrame();
    this.popupManager.setDensity(this.state.popupDensity || 'high');
    this.popupManager.update(deltaMs);

    // 1. Attack Radius & In-Range Detection
    let inRangeCount = 0;
    const targetsInRange: Entity[] = [];

    for (const enemy of this.enemies) {
      if (enemy.hp <= 0) continue;
      const dx = enemy.x - GAME_WIDTH / 2;
      const dy = enemy.y - GAME_HEIGHT / 2;
      const distSq = dx * dx + dy * dy;
      // Normal range check or orbiter engagement check
      const isTargetable = distSq <= r2 || (enemy.type === 'circle' && enemy.isOrbiting && distSq <= (effectiveRadius + 12) * (effectiveRadius + 12));
      if (isTargetable) {
        inRangeCount++;
        (enemy as any)._distSq = distSq;
        targetsInRange.push(enemy);
      }
    }

    // Sort by distance to center using cached distSq (eliminates redundant Math.pow during sort)
    targetsInRange.sort((a, b) => (a as any)._distSq - (b as any)._distSq);

    const isIdle = inRangeCount === 0;
    if (this.state.isPlayerIdle !== isIdle || this.state.enemiesInRangeCount !== inRangeCount) {
      stateUpdate.isPlayerIdle = isIdle;
      stateUpdate.enemiesInRangeCount = inRangeCount;
    }

    // Radar pulse trigger when enemy enters range
    if (inRangeCount > 0 && this.prevEnemiesInRangeCount === 0 && (this.state.pulseOnEnemyEnter ?? true)) {
      this.pulseTimer = 400;
    }
    this.prevEnemiesInRangeCount = inRangeCount;

    if (this.pulseTimer > 0) {
      this.pulseTimer = Math.max(0, this.pulseTimer - deltaMs);
    }
    const pulseProgress = this.pulseTimer > 0 ? (1 - this.pulseTimer / 400) : 0;
    this.renderer.drawAttackRadius(effectiveRadius, this.state.showAttackRadius ?? true, pulseProgress);

    // 2. Orbiting Energy Orbs Update
    const orbCount = playerStats.orbitingOrbs;
    if (orbCount > 0) {
      const orbSpeed = 0.04 * (1 + (this.state.labResearchLevels?.['lab_orb_speed'] || 0) * 0.20);
      this.orbAngle += orbSpeed * effectiveDelta;
      this.renderer.drawOrbitingOrbs(orbCount, this.orbAngle, 36);

      // Check collision between Orbs and Enemies
      this.checkOrbCollisions(orbCount, this.orbAngle, 36, onStateUpdate);
    } else {
      this.renderer.drawOrbitingOrbs(0, 0);
    }

    // 2.5. Card Orbiting Entities & Auras Update
    this.updateCardEntities(deltaMs, onStateUpdate);

    // 2.6. Active Combat Skills Update (Rockets, Laser Sweep, Mortar Strike, AOE Explosions & Deflections)
    this.updateSpecialSkills(deltaMs, effectiveDelta, playerStats, onStateUpdate);
    this.updateAilmentZones(deltaMs, playerStats);

    // Process pending Burst Salvo volley
    if (this.rapidFirePending > 0) {
      this.rapidFireDelayMs -= deltaMs;
      if (this.rapidFireDelayMs <= 0) {
        if (targetsInRange.length > 0 && !this.state.isDead) {
          this.fireProjectile(targetsInRange[0], playerStats);
        }
        this.rapidFirePending--;
        this.rapidFireDelayMs = 90;
      }
    }

    if (this.plasmaBeamSoundTimer > 0) {
      this.plasmaBeamSoundTimer -= deltaMs;
    }

    // 3. Player Auto-fire & Specialty Chaos Protocols
    const protocol = this.state.fireProtocol || 'standard';

    if (protocol === 'plasma_beam') {
      if (targetsInRange.length > 0 && !this.state.isDead) {
        const target = targetsInRange[0];
        this.activePlasmaBeamTarget = target;
        
        // Continuous Plasma Beam damage
        const damagePerSec = playerStats.damage * Math.max(0.1, playerStats.fireRate) * 1.6;
        let damage = damagePerSec * (deltaMs / 1000);
        
        if (target.type === 'boss') {
          damage *= (playerStats.bossDamageMult || 1.0);
        } else if (target.type === 'big_square' || target.type === 'orange_triangle') {
          damage *= (playerStats.eliteDamageMult || 1.0);
        }
        
        target.hp -= damage;
        
        // Render Crackling High-Voltage Plasma Arc Stream
        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2;
        const tx = target.x;
        const ty = target.y;
        
        // Main Core Pink/Magenta Beam
        this.spawnLightningZap(cx, cy, tx, ty, 0xd946ef);
        
        // Secondary Cyan Jitter Aura
        const mx = (cx + tx) / 2 + (Math.random() - 0.5) * 24;
        const my = (cy + ty) / 2 + (Math.random() - 0.5) * 24;
        this.spawnLightningZap(cx, cy, mx, my, 0x06b6d4);
        this.spawnLightningZap(mx, my, tx, ty, 0x06b6d4);
        
        // Tick explosion burst and sound trigger (throttled to 120ms)
        if (this.plasmaBeamSoundTimer <= 0) {
          this.plasmaBeamSoundTimer = 120;
          this.spawnExplosion(tx, ty, 30, 0xd946ef);
          this.spatialGrid.queryRadius(tx, ty, 30, (e) => {
            if (e.hp <= 0 || e.isAllied || e === target) return;
            const splashDmg = playerStats.damage * 0.50;
            e.hp -= splashDmg;
            this.popupManager.spawnDamage(e.x, e.y, splashDmg, false, playerStats.critMultiplier);
          });
          soundEngine.playZap();
        }
      } else {
        this.activePlasmaBeamTarget = null;
      }
    } else {
      this.activePlasmaBeamTarget = null;
      const fireIntervalMs = 1000 / Math.max(0.1, playerStats.fireRate) / (protocol === 'gatling' ? 5.5 : 1);
      this.shotTimer += deltaMs;

      if (targetsInRange.length > 0 && !this.state.isDead) {
        if (this.shotTimer >= fireIntervalMs) {
          this.shotTimer = Math.min(this.shotTimer - fireIntervalMs, fireIntervalMs * 0.5);

          // Primary Shot
          this.fireProjectile(targetsInRange[0], playerStats);

          // Multishot Chance (only triggers for standard and gatling to focus projectile volume there)
          if ((protocol === 'standard' || protocol === 'gatling') && playerStats.multishotChance > 0 && Math.random() < playerStats.multishotChance) {
            if (targetsInRange.length > 1) {
              this.fireProjectile(targetsInRange[1], playerStats);
            }
            if (targetsInRange.length > 2 && Math.random() < 0.5) {
              this.fireProjectile(targetsInRange[2], playerStats);
            }
          }

          // Burst Salvo (standard shooting only)
          if (protocol === 'standard' && playerStats.rapidFireChance > 0 && Math.random() < playerStats.rapidFireChance) {
            this.rapidFirePending = 1;
            this.rapidFireDelayMs = 90;
          }
        }
      } else {
        this.shotTimer = Math.min(this.shotTimer, fireIntervalMs);
      }
    }

    // 4. Spawning & Wave Progression (Structured Wave Mechanics)
    if (this.isIntermission) {
      this.intermissionTimer -= deltaMs;
      if (this.intermissionTimer <= 0) {
        this.isIntermission = false;
        this.startWave();
        stateUpdate.isWaveActive = true;
        stateUpdate.wave = this.state.wave;
        stateUpdate.totalEnemiesInWave = this.waveEnemiesTotal;
        stateUpdate.enemiesRemaining = this.waveEnemiesTotal;
        stateUpdate.waveProgress = 0;
      }
    } else if (this.state.isWaveActive) {
      this.waveTimeElapsed += deltaMs;
      this.spawnTimer += deltaMs;
      
      const isBossWave = WAVE_CONFIG.isBossWave(this.state.wave);
      const enemyBalanceCard = this.getEquippedCardEffect('enemy_balance');
      
      const tier = this.state.tier || 1;
      const tierSpawnFactor = Math.pow(0.85, tier - 1);
      // Spawn interval smoothly scales: 1300ms down to 650ms based on wave
      const baseSpawnInterval = Math.max(650, (enemyBalanceCard ? 750 : 1300) - Math.min(600, this.state.wave * 20)) * tierSpawnFactor * (playerStats.spawnRateMult || 1.0);

      // Boss Wave Spawning: Spawn Boss first with fanfare, then escort minions
      if (isBossWave) {
        if (this.waveEnemiesSpawned === 0) {
          this.spawnEnemy(true);
          this.waveEnemiesSpawned++;
          this.spawnTimer = 0;
          const arch = getBossArchetype(this.state.wave);
          this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 86, `⚠️ ${arch.name.toUpperCase()} ⚠️`, arch.colorInt);
          this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 68, arch.title.toUpperCase(), 0xffffff);
          if (this.state.wave >= 50) {
            this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 50, '🛡️ HARMONIC OVERSHIELD ONLINE', 0x38bdf8);
          }
          soundEngine.playBossSpawn();
        } else if (this.waveEnemiesSpawned < this.waveEnemiesTotal && this.spawnTimer > baseSpawnInterval * 1.25) {
          this.spawnEnemy(false);
          this.waveEnemiesSpawned++;
          this.spawnTimer = 0;
        }
      } else {
        // Regular enemy spawning up to wave quota
        if (this.waveEnemiesSpawned < this.waveEnemiesTotal && this.spawnTimer > baseSpawnInterval) {
          this.spawnEnemy(false);
          this.waveEnemiesSpawned++;
          this.spawnTimer = 0;
        }
      }

      // Check living enemies count and update real-time progress
      const livingFoes = this.enemies.filter(e => !e.isAllied && e.hp > 0).length;
      const foesRemaining = (this.waveEnemiesTotal - this.waveEnemiesSpawned) + livingFoes;
      this.state.enemiesRemaining = Math.max(0, foesRemaining);
      const defeatedFoes = Math.max(0, this.waveEnemiesTotal - foesRemaining);
      this.state.waveProgress = Math.max(0, Math.min(1.0, defeatedFoes / Math.max(1, this.waveEnemiesTotal)));

      // Wave completed when all scheduled enemies are spawned and all living foes are defeated
      // (or safety timeout of 45 seconds to prevent rare softlocks)
      const allSpawned = this.waveEnemiesSpawned >= this.waveEnemiesTotal;
      const allDefeated = allSpawned && livingFoes === 0;
      const timedOut = this.waveTimeElapsed >= 45000;

      if (allDefeated || timedOut) {
        this.completeWave((partial) => Object.assign(stateUpdate, partial), false);
      }

      // NUKE CARD: Fires once per wave after 5.5s (5500ms) of active wave time
      const nukeCard = this.state.cards?.['card_nuke'];
      if (nukeCard && nukeCard.isEquipped && !this.nukeFiredThisWave && this.waveTimeElapsed >= 5500) {
        this.nukeFiredThisWave = true;
        const playerStats = this.getPlayerCombatStats();
        const mult = 5.0 + (nukeCard.level - 1) * 1.5;
        const nukeDamage = playerStats.damage * mult;

        const px = GAME_WIDTH / 2;
        const py = GAME_HEIGHT / 2;
        this.popupManager.spawnText(px, py - 60, '☢️ TACTICAL NUKE DETONATED! ☢️', 0xef4444);
        soundEngine.playMortarExplosion();

        this.spawnExplosion(px, py, 180, 0xef4444);

        this.enemies.forEach(enemy => {
          if (enemy.hp <= 0 || enemy.isAllied) return;
          enemy.hp -= nukeDamage;
          this.popupManager.spawnDamage(enemy.x, enemy.y, nukeDamage, true, 3.0);

          const ndx = enemy.x - px;
          const ndy = enemy.y - py;
          const ndist = Math.max(1, Math.sqrt(ndx * ndx + ndy * ndy));
          if (enemy.type !== 'boss') {
            enemy.x += (ndx / ndist) * 120;
            enemy.y += (ndy / ndist) * 120;
          }
        });
      }
    } else {
      // Auto-start next wave if clean
      if (!this.state.isWaveActive) {
        this.startWave();
        stateUpdate.isWaveActive = true;
        stateUpdate.enemiesRemaining = this.state.enemiesRemaining;
        stateUpdate.totalEnemiesInWave = this.state.totalEnemiesInWave;
      }
    }

    // 5. Move Entities & Rotations
    this.updateEnemies(effectiveDelta, currentTime, isIdle, (partial) => Object.assign(stateUpdate, partial));
    
    // Fast Broadphase Spatial Grid Populate for O(1) collision queries
    this.spatialGrid.populate(this.enemies);

    // 30 FPS Optimized Projectile Step Updates
    this.bulletAccDelta += effectiveDelta;
    if (this.bulletAccDelta >= 1.9 || this.projectiles.length > 50) {
      this.updateProjectiles(this.bulletAccDelta, playerStats, (partial) => Object.assign(stateUpdate, partial));
      this.bulletAccDelta = 0;
    }

    this.enemyBulletAccDelta += effectiveDelta;
    if (this.enemyBulletAccDelta >= 1.9 || this.enemyProjectiles.length > 30) {
      this.updateEnemyProjectiles(this.enemyBulletAccDelta, (partial) => Object.assign(stateUpdate, partial));
      this.enemyBulletAccDelta = 0;
    }

    // 6. Tick Damage & HP Regeneration (Deliberate 800ms cadence: optimizes performance, fixes lag, and renders damage popups)
    this.damageTickTimer += deltaMs;
    const DAMAGE_TICK_MS = 800; // 0.8s attack tick cadence
    if (this.damageTickTimer >= DAMAGE_TICK_MS) {
      const ticks = Math.min(4, Math.floor(this.damageTickTimer / DAMAGE_TICK_MS));
      this.damageTickTimer -= ticks * DAMAGE_TICK_MS;

      const tickFraction = ticks * 0.8; // seconds accounted for in this tick

      let totalNetContactDamage = 0;
      let hasBossContact = false;

      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        const dx = enemy.x - GAME_WIDTH / 2;
        const dy = enemy.y - GAME_HEIGHT / 2;
        const limit = PHYSICS_CONFIG.playerRadius + enemy.radius + 3;
        if (dx * dx + dy * dy <= limit * limit) {
          const rawDps = enemy.dps || 0;
          if (enemy.type === 'boss') hasBossContact = true;

          // Per-enemy Defense % and Defense Absolute mitigation (Rule 5)
          const cappedDefPercent = Math.min(0.90, Math.max(0, playerStats.defensePercent || 0));
          const mitigatedDps = rawDps * (1 - cappedDefPercent);
          // Anti-immortality safeguard: Guaranteed minimum 8% raw contact damage floor
          const minDpsFloor = rawDps * 0.08;
          const netEnemyDamagePerSec = Math.max(minDpsFloor, mitigatedDps - (playerStats.defenseAbsolute || 0));
          totalNetContactDamage += netEnemyDamagePerSec * tickFraction;

          // THORN DAMAGE CALCULATION:
          // Deals percentage of enemy's max HP back to the attacker upon contact.
          // Bosses receive 50% reduced Thorn damage.
          if (playerStats.thornsPercent > 0) {
            const bossResistance = enemy.type === 'boss' ? 0.5 : 1.0;
            const thornDamage = enemy.maxHp * playerStats.thornsPercent * bossResistance * tickFraction;
            enemy.hp -= thornDamage;
            this.popupManager.spawnDamage(enemy.x, enemy.y, thornDamage, false, 1.0);
            enemy.angularVelocity += (Math.random() - 0.5) * 0.25;

            // Trigger thorns damage mission update
            if (this.lastOnStateUpdate) {
              this.updateKillMissions(false, 0, this.lastOnStateUpdate, thornDamage);
            }
          }
        }
      }

      if (totalNetContactDamage > 0) {
        if (this.checkQuantumBarrier()) {
          totalNetContactDamage = 0;
          this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 25, '🛡️ BARRIER ABSORB!', 0x38bdf8);
        } else {
          this.registerPlayerHit();
          soundEngine.playHitPlayer();
        }
      }

      // Apply net contact damage to player HP directly
      if (totalNetContactDamage > 0) {
        this.state.playerHp = Math.max(0, this.state.playerHp - totalNetContactDamage);
        
        // POPUP: Spawn distinct player damage popup right above player shape
        this.popupManager.spawnPlayerDamage(
          GAME_WIDTH / 2 + (Math.random() - 0.5) * 6,
          GAME_HEIGHT / 2 - 16,
          totalNetContactDamage
        );

        if (this.state.playerHp <= 0) {
          if (this.isHandlingDeath) return;
          this.isHandlingDeath = true;
          this.state.isDead = true;
          this.state.playerHp = 0;
          this.state.isWaveActive = false;
          stateUpdate.playerHp = 0;
          stateUpdate.isDead = true;
          stateUpdate.isWaveActive = false;
          stateUpdate.wave = this.state.wave;
          stateUpdate.tier = this.state.tier;
          stateUpdate.enemiesRemaining = 0;
          stateUpdate.activeBoss = null;
          this.clearAllEntities();
          this.damageTickTimer = 0;
          this.pendingStateUpdate = {};
          onStateUpdate(stateUpdate);
          return;
        }
        stateUpdate.playerHp = Number(this.state.playerHp.toFixed(2));
      }
    }

    // CONTINUOUS HP REGENERATION: Ticks smoothly every frame regardless of enemy activity or damage
    if (playerStats.hpRegen > 0 && this.state.playerHp > 0 && !this.state.isDead && !this.isHandlingDeath && this.state.playerHp < playerStats.effectiveMaxHp) {
      const regenAmount = playerStats.hpRegen * (deltaMs / 1000);
      const newRegenHp = Math.min(playerStats.effectiveMaxHp, this.state.playerHp + regenAmount);
      if (newRegenHp !== this.state.playerHp) {
        this.state.playerHp = newRegenHp;
        stateUpdate.playerHp = Number(this.state.playerHp.toFixed(2));
      }
    }

    // 7. Active Boss Detection & Real-time Health Tracking
    const bossEntity = this.enemies.find(e => e.type === 'boss');
    if (bossEntity && bossEntity.hp > 0) {
      const arch = (bossEntity as any).bossArchetype || getBossArchetype(this.state.wave);
      if (
        !this.state.activeBoss ||
        this.state.activeBoss.hp !== bossEntity.hp ||
        this.state.activeBoss.maxHp !== bossEntity.maxHp ||
        this.state.activeBoss.shieldHp !== bossEntity.shieldHp
      ) {
        stateUpdate.activeBoss = {
          hp: Math.max(0, bossEntity.hp),
          maxHp: bossEntity.maxHp,
          name: arch.name,
          title: arch.title,
          wave: this.state.wave,
          shieldHp: bossEntity.shieldHp,
          maxShieldHp: bossEntity.maxShieldHp,
          colorHex: arch.colorHex,
          archetype: arch.id,
        };
      }
    } else if (this.state.activeBoss !== null) {
      stateUpdate.activeBoss = null;
    }

    // 8. Update Wave Progress indicator (throttled to avoid 60-300Hz React re-render thrashing)
    const progress = Math.max(0, Math.min(1, this.waveTimeElapsed / this.waveDurationMs));
    const currentPercent = Math.round(progress * 100);
    if (
      currentPercent !== this.lastWaveProgressPercent &&
      (currentTime - this.lastProgressUpdateTime >= 100 || progress === 0 || progress === 1)
    ) {
      this.lastWaveProgressPercent = currentPercent;
      this.lastProgressUpdateTime = currentTime;
      stateUpdate.waveProgress = progress;
    }

    // 9. Update Player Eye Personality (Eye Roll RNG & Closest Enemy Eye Tracking)
    if (this.eyeRollTimer > 0) {
      this.eyeRollTimer -= deltaMs;
    } else {
      this.nextEyeRollCooldown -= deltaMs;
      if (this.nextEyeRollCooldown <= 0) {
        if (Math.random() < 0.3) {
          this.eyeRollTimer = this.eyeRollDuration;
        }
        this.nextEyeRollCooldown = 6000 + Math.random() * 8000;
      }
    }

    let closestEnemyAngle: number | null = null;
    if (targetsInRange.length > 0) {
      const closest = targetsInRange[0];
      closestEnemyAngle = Math.atan2(closest.y - GAME_HEIGHT / 2, closest.x - GAME_WIDTH / 2);
    } else if (this.enemies.length > 0) {
      let minDistanceSq = Infinity;
      const px = GAME_WIDTH / 2;
      const py = GAME_HEIGHT / 2;
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (enemy.hp > 0) {
          const dx = enemy.x - px;
          const dy = enemy.y - py;
          const dSq = dx * dx + dy * dy;
          if (dSq < minDistanceSq) {
            minDistanceSq = dSq;
            closestEnemyAngle = Math.atan2(dy, dx);
          }
        }
      }
    }

    let eyeRollAngle: number | null = null;
    if (this.eyeRollTimer > 0) {
      const rollProgress = 1 - (this.eyeRollTimer / this.eyeRollDuration);
      eyeRollAngle = rollProgress * Math.PI * 4; // 2 full 360-degree spins
    }

    this.renderer.drawPlayer(closestEnemyAngle, eyeRollAngle, this.state.isDead);

    if (this.state.cash !== initialCash) {
      this.pendingStateUpdate.cash = this.state.cash;
    }
    if (this.state.cosmicShards !== initialShards) {
      this.pendingStateUpdate.cosmicShards = this.state.cosmicShards;
    }
    if (this.state.cells !== initialCells) {
      this.pendingStateUpdate.cells = this.state.cells;
    }

    const isCriticalUpdate = Boolean(
      this.pendingStateUpdate.isDead ||
      this.pendingStateUpdate.wave !== undefined ||
      this.pendingStateUpdate.tier !== undefined ||
      this.pendingStateUpdate.isWaveActive !== undefined ||
      this.pendingStateUpdate.activeBoss !== undefined ||
      this.pendingStateUpdate.latestAcquiredDrop !== undefined
    );

    this.uiBatchTimer += deltaMs;
    if (Object.keys(this.pendingStateUpdate).length > 0) {
      if (isCriticalUpdate || this.uiBatchTimer >= this.UI_BATCH_INTERVAL_MS) {
        this.uiBatchTimer = 0;
        this.lastSyncedCash = this.state.cash;
        this.lastSyncedShards = this.state.cosmicShards;
        this.lastSyncedCells = this.state.cells;
        onStateUpdate({ ...this.pendingStateUpdate });
        this.pendingStateUpdate = {};
      }
    }
  }

  private checkOrbCollisions(orbCount: number, orbAngle: number, orbRadius: number, onStateUpdate: (state: Partial<GameState>) => void) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const orbHitRadius = 7.0;

    for (let i = 0; i < orbCount; i++) {
      const angle = orbAngle + (i * (Math.PI * 2 / orbCount));
      const ox = cx + Math.cos(angle) * orbRadius;
      const oy = cy + Math.sin(angle) * orbRadius;

      // Efficient Spatial Grid broadphase query around orb
      this.spatialGrid.queryRadius(ox, oy, orbHitRadius + 4, (enemy) => {
        const now = Date.now();
        if (enemy.lastOrbHitTime && now - enemy.lastOrbHitTime < 500) {
          return;
        }
        enemy.lastOrbHitTime = now;

        // Kinetic recoil / pushback away from orb
        const kdx = enemy.x - ox;
        const kdy = enemy.y - oy;
        const kdist = Math.sqrt(kdx * kdx + kdy * kdy) || 1;
        if (enemy.type !== 'boss') {
          enemy.x += (kdx / kdist) * 14;
          enemy.y += (kdy / kdist) * 14;
        }

        if (enemy.type === 'boss') {
          // Orbs deal massive chunk damage to bosses rather than instant kill
          const chunkDamage = enemy.maxHp * 0.035; // Nerfed from 0.08
          enemy.hp -= chunkDamage;
          this.popupManager.spawnDamage(enemy.x, enemy.y, chunkDamage, true, 2.0);
        } else {
          // Vaporize regular enemy
          const chunkDamage = enemy.maxHp * 0.35; // Nerfed from instant vaporization
          enemy.hp -= chunkDamage;
          this.popupManager.spawnDamage(enemy.x, enemy.y, chunkDamage, true, 3.0);
        }
        soundEngine.playOrbitalBlock();
        enemy.angularVelocity += 0.3;
      });
    }
  }

  private updateCardEntities(deltaMs: number, onStateUpdate: (state: Partial<GameState>) => void) {
    const playerX = GAME_WIDTH / 2;
    const playerY = GAME_HEIGHT / 2;
    const delta = deltaMs / 16.666;
    this.simTime += deltaMs * 0.001;

    const entitiesToDraw: Array<{
      type: 'orbital_totem' | 'toxic_drone' | 'gravity_anchor' | 'energy_beacon' | 'shredder_field' | 'singularity_core' | 'land_mine';
      x: number;
      y: number;
      angle: number;
      radius: number;
      level: number;
    }> = [];

    // 1. ORBITAL TOTEM
    const totemCard = this.state.cards?.['card_orbital_totem'];
    if (totemCard && totemCard.isEquipped) {
      const angle = this.simTime * 0.8;
      const totemX = playerX + Math.cos(angle) * 115;
      const totemY = playerY + Math.sin(angle) * 115;
      entitiesToDraw.push({
        type: 'orbital_totem',
        x: totemX,
        y: totemY,
        angle,
        radius: 28,
        level: totemCard.level,
      });
    }

    // 2. TOXIC DRONE
    const droneCard = this.state.cards?.['card_toxic_drone'];
    if (droneCard && droneCard.isEquipped) {
      const angle = this.simTime * 1.1;
      const droneX = playerX + Math.cos(angle) * 155;
      const droneY = playerY + Math.sin(angle) * 155;
      const auraRadius = 55;
      const toxicPercent = 0.01 + (droneCard.level - 1) * 0.0025; // 1% + 0.25%/lvl

      this.droneTickTimer += deltaMs;
      if (this.droneTickTimer >= 250) {
        this.droneTickTimer = 0;
        this.spatialGrid.queryRadius(droneX, droneY, auraRadius, (enemy) => {
          if (enemy.hp <= 0) return;
          const tickDmg = Math.max(1, Math.round(enemy.maxHp * toxicPercent * 0.25));
          enemy.hp -= tickDmg;
          this.popupManager.spawnDamage(enemy.x, enemy.y, tickDmg, false, 0.7);
        });
      }

      entitiesToDraw.push({
        type: 'toxic_drone',
        x: droneX,
        y: droneY,
        angle,
        radius: auraRadius,
        level: droneCard.level,
      });
    }

    // 3. GRAVITY ANCHOR
    const anchorCard = this.state.cards?.['card_gravity_anchor'];
    if (anchorCard && anchorCard.isEquipped) {
      const angle = -this.simTime * 0.6;
      const anchorX = playerX + Math.cos(angle) * 185;
      const anchorY = playerY + Math.sin(angle) * 185;
      const gravityRadius = 70;
      const slowFactor = 1 - Math.min(0.7, 0.25 + (anchorCard.level - 1) * 0.05);

      this.spatialGrid.queryRadius(anchorX, anchorY, gravityRadius, (enemy) => {
        if (enemy.hp <= 0) return;
        enemy.speed = Math.max(0.2, (enemy.speed || 1) * slowFactor);
      });

      entitiesToDraw.push({
        type: 'gravity_anchor',
        x: anchorX,
        y: anchorY,
        angle,
        radius: gravityRadius,
        level: anchorCard.level,
      });
    }

    // 4. ENERGY BEACON
    const beaconCard = this.state.cards?.['card_energy_beacon'];
    if (beaconCard && beaconCard.isEquipped) {
      const angle = this.simTime * 1.3;
      const beaconX = playerX + Math.cos(angle) * 135;
      const beaconY = playerY + Math.sin(angle) * 135;

      this.beaconPulseTimer += deltaMs;
      if (this.beaconPulseTimer >= 4000) {
        this.beaconPulseTimer = 0;
        this.energyBeaconActiveTime = 3000;
        this.popupManager.spawnText(playerX, playerY - 30, 'BEACON OVERCHARGE!', 0xf59e0b);
      }
      if (this.energyBeaconActiveTime > 0) {
        this.energyBeaconActiveTime = Math.max(0, this.energyBeaconActiveTime - deltaMs);
      }

      entitiesToDraw.push({
        type: 'energy_beacon',
        x: beaconX,
        y: beaconY,
        angle,
        radius: 35,
        level: beaconCard.level,
      });
    }

    // 5. SHREDDER FIELD
    const shredderCard = this.state.cards?.['card_shredder_field'];
    if (shredderCard && shredderCard.isEquipped) {
      const angle = -this.simTime * 2.0;
      const shredderX = playerX + Math.cos(angle) * 95;
      const shredderY = playerY + Math.sin(angle) * 95;
      const fieldRadius = 40;
      const shredPercent = 0.15 + (shredderCard.level - 1) * 0.05;

      this.shredderTickTimer += deltaMs;
      if (this.shredderTickTimer >= 180) {
        this.shredderTickTimer = 0;
        this.spatialGrid.queryRadius(shredderX, shredderY, fieldRadius, (enemy) => {
          if (enemy.hp <= 0) return;
          const shredDmg = Math.max(2, Math.round(enemy.maxHp * shredPercent * 0.2));
          enemy.hp -= shredDmg;
          this.popupManager.spawnDamage(enemy.x, enemy.y, shredDmg, false, 0.9);
        });
      }

      entitiesToDraw.push({
        type: 'shredder_field',
        x: shredderX,
        y: shredderY,
        angle,
        radius: fieldRadius,
        level: shredderCard.level,
      });
    }

    // Decay Quantum Barrier internal cooldown buffer
    if (this.quantumBarrierCooldownMs > 0) {
      this.quantumBarrierCooldownMs -= deltaMs;
    }

    // 6. SINGULARITY CORE
    const singCard = this.state.cards?.['card_singularity_core'];
    if (singCard && singCard.isEquipped) {
      this.singularityTimer += deltaMs;

      // Spawn new singularity every 10s if none active
      if (this.singularityTimer >= 10000 && !this.activeSingularity) {
        this.singularityTimer = 0;

        let bestX = playerX + (Math.random() - 0.5) * 160;
        let bestY = playerY + (Math.random() - 0.5) * 160;
        let maxCount = -1;

        for (let i = 0; i < this.enemies.length; i++) {
          const e = this.enemies[i];
          if (e.hp <= 0 || e.isAllied) continue;
          let count = 0;
          this.spatialGrid.queryRadius(e.x, e.y, 140, (near) => {
            if (near.hp > 0 && !near.isAllied) count++;
          });
          if (count > maxCount) {
            maxCount = count;
            bestX = e.x;
            bestY = e.y;
          }
        }

        this.activeSingularity = {
          x: bestX,
          y: bestY,
          duration: 3500,
          level: singCard.level,
        };
        this.popupManager.spawnText(bestX, bestY, '🌀 SINGULARITY!', 0xa855f7);
        // soundEngine.playEnemyPop(true);
      }

      if (this.activeSingularity) {
        this.activeSingularity.duration -= deltaMs;
        const sing = this.activeSingularity;
        const singRadius = 140;
        const crushPercent = 0.15 + (singCard.level - 1) * 0.05;
        const playerStats = this.getPlayerCombatStats();

        // Gravitational pull & smooth total 3.5s crush damage tick
        this.spatialGrid.queryRadius(sing.x, sing.y, singRadius, (enemy) => {
          if (enemy.hp <= 0 || enemy.isAllied) return;
          const dx = sing.x - enemy.x;
          const dy = sing.y - enemy.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const pullSpeed = enemy.type === 'boss' ? 1.0 : 2.8;
          if (dist > 5) {
            enemy.x += (dx / dist) * pullSpeed * delta;
            enemy.y += (dy / dist) * pullSpeed * delta;
          }
          // Exactly 15% (+5%/lvl) of Max HP over full 3.5s duration
          let tickDmg = enemy.maxHp * crushPercent * (deltaMs / 3500);
          if (enemy.type === 'boss') {
            // Cap boss crushing tick to a max relative to player attack power
            tickDmg = Math.min(tickDmg, playerStats.damage * 4.0 * (deltaMs / 1000));
          }
          enemy.hp -= tickDmg;
          if (Math.random() < 0.08) {
            this.popupManager.spawnDamage(enemy.x, enemy.y, Math.max(1, Math.round(tickDmg * 15)), false, 0.8);
          }
        });

        entitiesToDraw.push({
          type: 'singularity_core',
          x: sing.x,
          y: sing.y,
          angle: this.simTime * 3.0,
          radius: singRadius,
          level: singCard.level,
        });

        if (this.activeSingularity.duration <= 0) {
          this.activeSingularity = null;
        }
      }
    }

    // LAND MINES SPARK & DETONATE
    const landMineCard = this.state.cards?.['card_land_mine_stun'];
    if (landMineCard && landMineCard.isEquipped) {
      this.landMineSpawnTimer += deltaMs;
      if (this.landMineSpawnTimer >= 10000 && this.landMines.length < 5) {
        this.landMineSpawnTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        const radius = 55 + Math.random() * 75;
        const lx = playerX + Math.cos(angle) * radius;
        const ly = playerY + Math.sin(angle) * radius;
        this.landMines.push({
          x: lx,
          y: ly,
          radius: 12,
          lifeMs: 25000,
        });
        this.popupManager.spawnText(lx, ly, '💥 LAND MINE PLANTED!', 0xfacc15);
      }
    }

    // Process active landmines
    for (let idx = this.landMines.length - 1; idx >= 0; idx--) {
      const mine = this.landMines[idx];
      mine.lifeMs -= deltaMs;

      let detonated = false;
      this.spatialGrid.queryRadius(mine.x, mine.y, mine.radius + 15, (enemy) => {
        if (detonated || enemy.hp <= 0 || enemy.isAllied) return;
        detonated = true;
      });

      if (detonated) {
        soundEngine.playRocketExplosion();
        this.spawnExplosion(mine.x, mine.y, 40, 0xfacc15);

        const playerStats = this.getPlayerCombatStats();
        const baseDamage = playerStats.damage * 2.5;
        const stunChance = 0.15 + (landMineCard ? (landMineCard.level - 1) * 0.05 : 0);

        this.spatialGrid.queryRadius(mine.x, mine.y, 40, (enemy) => {
          if (enemy.hp <= 0 || enemy.isAllied) return;
          enemy.hp -= baseDamage;
          this.popupManager.spawnDamage(enemy.x, enemy.y, baseDamage, true, 1.5);

          const mdx = enemy.x - mine.x;
          const mdy = enemy.y - mine.y;
          const mdist = Math.sqrt(mdx * mdx + mdy * mdy) || 1;
          if (enemy.type !== 'boss') {
            enemy.x += (mdx / mdist) * 35;
            enemy.y += (mdy / mdist) * 35;
          }

          if (Math.random() < stunChance) {
            enemy.stunTimer = 2500;
            this.popupManager.spawnText(enemy.x, enemy.y - 20, '⚡ STUNNED!', 0x38bdf8);
          }
        });

        this.landMines.splice(idx, 1);
      } else if (mine.lifeMs <= 0) {
        this.landMines.splice(idx, 1);
      } else {
        entitiesToDraw.push({
          type: 'land_mine',
          x: mine.x,
          y: mine.y,
          angle: 0,
          radius: mine.radius,
          level: landMineCard?.level || 1,
        });
      }
    }

    this.renderer.drawCardEntities(entitiesToDraw);
    
    // Draw Uno Reverse momentum bar if active
    this.renderer.drawUnoReverseBar(this.unoReverseHits, 20);
  }

  private checkQuantumBarrier(): boolean {
    const qbCard = this.state.cards?.['card_quantum_barrier'];
    if (!qbCard || !qbCard.isEquipped) return false;
    if (this.quantumBarrierCooldownMs > 0) return false;

    const chance = 0.12 + (qbCard.level - 1) * 0.03;
    if (Math.random() < chance) {
      this.quantumBarrierCooldownMs = 400; // 400ms buffer between discrete attack phase negations
      const px = GAME_WIDTH / 2;
      const py = GAME_HEIGHT / 2;
      this.popupManager.spawnText(px, py - 35, '✨ PHASED!', 0x38bdf8);
      soundEngine.playTechUnlock();

      const stats = this.getPlayerCombatStats();
      const waveDmg = stats.damage * 2.0;
      this.spatialGrid.queryRadius(px, py, 160, (enemy) => {
        if (enemy.hp <= 0 || enemy.isAllied) return;
        enemy.hp -= waveDmg;
        this.popupManager.spawnDamage(enemy.x, enemy.y, waveDmg, false, 1.2);
        const dx = enemy.x - px;
        const dy = enemy.y - py;
        const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
        if (enemy.type !== 'boss') {
          enemy.x += (dx / dist) * 30;
          enemy.y += (dy / dist) * 30;
        }
      });

      return true;
    }
    return false;
  }

  private registerPlayerHit() {
    const unoCard = this.state.cards?.['card_uno_reverse'];
    if (!unoCard || !unoCard.isEquipped) return;

    this.unoReverseHits = (this.unoReverseHits || 0) + 1;
    if (this.unoReverseHits >= 20) {
      this.unoReverseHits = 0;
      this.triggerUnoReverseBlast(unoCard.level);
    }
  }

  private triggerUnoReverseBlast(cardLevel: number) {
    const playerX = GAME_WIDTH / 2;
    const playerY = GAME_HEIGHT / 2;
    const blastRadius = 250;
    const playerStats = this.getPlayerCombatStats();
    const blastDmg = playerStats.damage * (3.0 + (cardLevel - 1) * 1.0);

    // soundEngine.playEnemyPop(true);
    this.popupManager.spawnText(playerX, playerY - 40, '💥 UNO REVERSE BLAST!', 0xfacc15);

    this.spatialGrid.queryRadius(playerX, playerY, blastRadius, (enemy) => {
      if (enemy.hp <= 0 || enemy.isAllied) return;
      enemy.hp -= blastDmg;
      this.popupManager.spawnDamage(enemy.x, enemy.y, blastDmg, true, 2.5);

      // Explosive Knockback
      const dx = enemy.x - playerX;
      const dy = enemy.y - playerY;
      const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
      if (enemy.type !== 'boss') {
        enemy.x += (dx / dist) * 55;
        enemy.y += (dy / dist) * 55;
      }
    });
  }

  public spawnExplosion(x: number, y: number, maxRadius: number, color: number = 0xf97316) {
    this.activeExplosions.push({
      x,
      y,
      radius: 4,
      maxRadius,
      color,
      alpha: 1.0,
      lifeMs: 350,
      maxLifeMs: 350,
    });
  }

  public spawnDeflection(x: number, y: number) {
    this.activeDeflections.push({
      x,
      y,
      radius: 8,
      alpha: 1.0,
      lifeMs: 250,
      maxLifeMs: 250,
    });
  }

  public spawnLightningZap(x1: number, y1: number, x2: number, y2: number, color: number = 0x38bdf8) {
    this.activeLightningArcs.push({
      x1,
      y1,
      x2,
      y2,
      alpha: 1.0,
      lifeMs: 180,
      maxLifeMs: 180,
      color,
    });
  }

  public launchRocketsBarrage(baseAngle: number, damage: number) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    soundEngine.playRocketLaunch();

    // 5 micro-rockets in a fanned spread
    for (let i = 0; i < 5; i++) {
      const spreadAngle = baseAngle + (i - 2) * 0.22 + (Math.random() - 0.5) * 0.12;
      this.activeRockets.push({
        x: cx,
        y: cy,
        angle: spreadAngle,
        speed: 3.8 + Math.random() * 0.8,
        damage,
        blastRadius: 55,
        lifeMs: 2400,
        trail: [],
      });
    }
  }

  private updateRockets(deltaMs: number, effectiveDelta: number, stats: ReturnType<Simulation['getPlayerCombatStats']>) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    for (let i = this.activeRockets.length - 1; i >= 0; i--) {
      const rocket = this.activeRockets[i];
      rocket.lifeMs -= deltaMs;

      // Update rocket exhaust trail
      rocket.trail.push({ x: rocket.x, y: rocket.y, alpha: 1.0 });
      for (let t = rocket.trail.length - 1; t >= 0; t--) {
        rocket.trail[t].alpha -= deltaMs * 0.006;
        if (rocket.trail[t].alpha <= 0) {
          rocket.trail.splice(t, 1);
        }
      }

      // Smooth Homing AI: Lock onto nearest living enemy
      let nearestTarget: Entity | null = null;
      let minDistanceSq = 350 * 350;

      for (let j = 0; j < this.enemies.length; j++) {
        const enemy = this.enemies[j];
        if (enemy.hp > 0 && !enemy.isAllied) {
          const dx = enemy.x - rocket.x;
          const dy = enemy.y - rocket.y;
          const dSq = dx * dx + dy * dy;
          if (dSq < minDistanceSq) {
            minDistanceSq = dSq;
            nearestTarget = enemy;
          }
        }
      }

      if (nearestTarget) {
        const targetAngle = Math.atan2(nearestTarget.y - rocket.y, nearestTarget.x - rocket.x);
        let angleDiff = targetAngle - rocket.angle;
        // Normalize angle difference to [-PI, PI]
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        const turnSpeed = 0.12 * effectiveDelta;
        rocket.angle += Math.max(-turnSpeed, Math.min(turnSpeed, angleDiff));
      }

      // Accelerate speed over time
      rocket.speed = Math.min(8.0, rocket.speed + 0.12 * effectiveDelta);
      rocket.x += Math.cos(rocket.angle) * rocket.speed * effectiveDelta;
      rocket.y += Math.sin(rocket.angle) * rocket.speed * effectiveDelta;

      // Check proximity collision with enemies
      let hasDetonated = false;
      this.spatialGrid.queryRadius(rocket.x, rocket.y, 14, (enemy) => {
        if (enemy.hp > 0 && !enemy.isAllied) {
          hasDetonated = true;
        }
      });

      if (hasDetonated || rocket.lifeMs <= 0) {
        soundEngine.playRocketExplosion();

        // Check active power-up synergies for rockets
        const hasPoison = Boolean(this.state.activeRareDrops?.some(d => d.id === 'poison') || (this.state.labResearchLevels?.['lab_skill_poison'] || 0) > 0);
        const hasChain = Boolean(this.state.activeRareDrops?.some(d => d.id === 'lightning_chain') || (this.state.labResearchLevels?.['lab_skill_lightning'] || 0) > 0);

        // AREA OF EFFECT CARD
        const aoeCard = this.state.cards?.['card_area_of_effect'];
        const aoeMult = (aoeCard && aoeCard.isEquipped) ? (1 + 0.20 + (aoeCard.level - 1) * 0.10) : 1.0;

        const baseBlastRadius = hasPoison ? rocket.blastRadius * 1.30 : rocket.blastRadius;
        const effectiveBlastRadius = baseBlastRadius * aoeMult;
        this.spawnExplosion(rocket.x, rocket.y, effectiveBlastRadius, hasPoison ? 0x10b981 : 0xf97316);

        // ULTIMATE CRIT CARD
        const ultCritCard = this.state.cards?.['card_ultimate_crit'];
        let ultCritMult = 1.0;
        let ultIsCrit = false;
        if (ultCritCard && ultCritCard.isEquipped) {
          const ultChance = 0.10 + (ultCritCard.level - 1) * 0.03;
          if (Math.random() < ultChance) {
            ultCritMult = 2.0;
            ultIsCrit = true;
          }
        }

        let hitCount = 0;
        let toxicSynergyTriggered = false;

        // AOE Damage
        this.spatialGrid.queryRadius(rocket.x, rocket.y, effectiveBlastRadius, (enemy) => {
          if (enemy.hp <= 0 || enemy.isAllied) return;
          hitCount++;
          let finalDamage = rocket.damage * (enemy.type === 'boss' ? stats.bossDamageMult : 1.0);
          if (ultIsCrit) {
            finalDamage *= ultCritMult;
          }
          enemy.hp -= finalDamage;
          this.popupManager.spawnDamage(enemy.x, enemy.y, finalDamage, true, ultIsCrit ? stats.critMultiplier * 2.0 : stats.critMultiplier);

          // Pushback away from blast center
          const bdx = enemy.x - rocket.x;
          const bdy = enemy.y - rocket.y;
          const bdist = Math.max(1, Math.sqrt(bdx * bdx + bdy * bdy));
          if (enemy.type !== 'boss') {
            enemy.x += (bdx / bdist) * 22;
            enemy.y += (bdy / bdist) * 22;
          }

          // Toxic Detonation synergy
          if (hasPoison) {
            enemy.poisonTimer = 10000;
            const poisonDmg = Math.max(2, Math.round(enemy.maxHp * 0.08));
            enemy.hp -= poisonDmg;
            this.popupManager.spawnDamage(enemy.x, enemy.y, poisonDmg, false, 1.0);
            toxicSynergyTriggered = true;
          }
        });

        // Shock Barrage synergy
        if (hasChain && hitCount > 0) {
          let chainTargets = 0;
          this.spatialGrid.queryRadius(rocket.x, rocket.y, 160, (other) => {
            if (other.hp > 0 && !other.isAllied && chainTargets < 4) {
              const shockDmg = Math.max(1, Math.round(rocket.damage * 0.45));
              other.hp -= shockDmg;
              this.popupManager.spawnDamage(other.x, other.y, shockDmg, false, 1.0);
              this.spawnLightningZap(rocket.x, rocket.y, other.x, other.y, 0x38bdf8);
              soundEngine.playZap();
              chainTargets++;
            }
          });
          this.popupManager.spawnText(rocket.x, rocket.y - 24, '⚡ SHOCK BARRAGE!', 0x38bdf8);
        }

        if (ultIsCrit) {
          this.popupManager.spawnText(rocket.x, rocket.y - 32, '💥 ULTIMATE CRIT!', 0xf59e0b);
        }

        if (toxicSynergyTriggered) {
          this.popupManager.spawnText(rocket.x, rocket.y - 10, '☣️ TOXIC DETONATION!', 0x10b981);
        } else if (!hasChain) {
          this.popupManager.spawnText(rocket.x, rocket.y - 12, '🚀 ROCKET AOE', 0xf97316);
        }

        this.activeRockets.splice(i, 1);
      }
    }
  }

  private updateLaserSweep(deltaMs: number, effectiveDelta: number, stats: ReturnType<Simulation['getPlayerCombatStats']>) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const laserDrop = this.state.activeRareDrops?.find(d => d.id === 'laser_sweep');
    const labLaserLvl = this.state.labResearchLevels?.['lab_skill_laser_sweep'] || 0;
    const laserCard = this.state.cards?.['card_skill_laser_sweep'];
    const hasLaser = Boolean(laserDrop || labLaserLvl > 0 || (laserCard && laserCard.isEquipped));

    if (hasLaser) {
      this.laserSweepCooldownTimer += deltaMs;
      // Activates every 5 seconds (5000ms)
      if (this.laserSweepCooldownTimer >= 5000) {
        this.laserSweepCooldownTimer = 0;

        // Find primary target direction
        let targetAngle = 0;
        let minDistanceSq = Infinity;
        for (let i = 0; i < this.enemies.length; i++) {
          const enemy = this.enemies[i];
          if (enemy.hp > 0 && !enemy.isAllied) {
            const dx = enemy.x - cx;
            const dy = enemy.y - cy;
            const dSq = dx * dx + dy * dy;
            if (dSq < minDistanceSq) {
              minDistanceSq = dSq;
              targetAngle = Math.atan2(dy, dx);
            }
          }
        }

        // 40 degree arc sweep (like a ")" shape)
        const arcSpan = (40 * Math.PI) / 180;
        const startAngle = targetAngle - arcSpan / 2;
        const endAngle = targetAngle + arcSpan / 2;
        const laserMult = laserDrop ? laserDrop.effectMultiplier : (1 + labLaserLvl * 0.20 + (laserCard && laserCard.isEquipped ? (laserCard.level - 1) * 0.15 : 0));

        // Check active power-up synergies for Laser Sweep
        const hasDoubleShot = Boolean(this.state.activeRareDrops?.some(d => d.id === 'double_shot'));
        const hasPiercing = Boolean(this.state.activeRareDrops?.some(d => d.id === 'piercing'));
        const radiusMultiplier = (hasDoubleShot || hasPiercing) ? 1.55 : 1.35;
        const damageBonus = (hasDoubleShot || hasPiercing) ? 1.25 : 1.0;

        // Sweep SFX
        soundEngine.playLaserSweep();

        this.activeLaserSweep = {
          active: true,
          progress: 0,
          durationMs: (hasDoubleShot || hasPiercing) ? 550 : 450,
          startAngle,
          endAngle,
          currentAngle: startAngle,
          radius: stats.attackRadius * radiusMultiplier,
          damage: stats.damage * (2.8 * laserMult * damageBonus),
          hitEnemies: new Set<Entity>(),
        };
      }
    }

    // Process Active Laser Sweep
    if (this.activeLaserSweep && this.activeLaserSweep.active) {
      const ls = this.activeLaserSweep;
      ls.progress += deltaMs / ls.durationMs;
      ls.currentAngle = ls.startAngle + (ls.endAngle - ls.startAngle) * ls.progress;

      const hasPoison = Boolean(this.state.activeRareDrops?.some(d => d.id === 'poison') || (this.state.labResearchLevels?.['lab_skill_poison'] || 0) > 0);
      const hasChain = Boolean(this.state.activeRareDrops?.some(d => d.id === 'lightning_chain') || (this.state.labResearchLevels?.['lab_skill_lightning'] || 0) > 0);

      // Continuous angular slice check against all enemies within radius
      const beamAngle = ls.currentAngle;
      for (let i = 0; i < this.enemies.length; i++) {
        const enemy = this.enemies[i];
        if (enemy.hp <= 0 || enemy.isAllied || ls.hitEnemies.has(enemy)) continue;

        const dx = enemy.x - cx;
        const dy = enemy.y - cy;
        const distSq = dx * dx + dy * dy;

        if (distSq <= ls.radius * ls.radius) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - beamAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);

          // If enemy intersects the sweeping laser beam segment
          if (diff < 0.18) {
            ls.hitEnemies.add(enemy);
            const beamDamage = ls.damage * (enemy.type === 'boss' ? stats.bossDamageMult : 1.0);
            enemy.hp -= beamDamage;
            this.popupManager.spawnDamage(enemy.x, enemy.y, beamDamage, true, stats.critMultiplier);
            this.spawnExplosion(enemy.x, enemy.y, 16, 0x06b6d4);

            // Laser + Poison synergy
            if (hasPoison) {
              enemy.poisonTimer = 10000;
              this.popupManager.spawnText(enemy.x, enemy.y - 12, '☣️ TOXIC BEAM', 0x10b981);
            }

            // Laser + Lightning Chain synergy (Prismatic Zap)
            if (hasChain) {
              let arcCount = 0;
              this.spatialGrid.queryRadius(enemy.x, enemy.y, 120, (other) => {
                if (other !== enemy && other.hp > 0 && !other.isAllied && arcCount < 2) {
                  const arcDmg = Math.round(beamDamage * 0.40);
                  other.hp -= arcDmg;
                  this.popupManager.spawnDamage(other.x, other.y, arcDmg, false, 1.0);
                  this.spawnLightningZap(enemy.x, enemy.y, other.x, other.y, 0x00f5ff);
                  soundEngine.playZap();
                  arcCount++;
                }
              });
              this.popupManager.spawnText(enemy.x, enemy.y - 22, '⚡ PRISMATIC ZAP!', 0x00f5ff);
            }
          }
        }
      }

      if (ls.progress >= 1.0) {
        this.activeLaserSweep = null;
      }
    }
  }

  private updateMortarStrikes(deltaMs: number, stats: ReturnType<Simulation['getPlayerCombatStats']>) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    const mortarDrop = this.state.activeRareDrops?.find(d => d.id === 'mortar_strike');
    const labMortarLvl = this.state.labResearchLevels?.['lab_skill_mortar_strike'] || 0;
    const mortarCard = this.state.cards?.['card_skill_mortar_strike'];
    const hasMortar = Boolean(mortarDrop || labMortarLvl > 0 || (mortarCard && mortarCard.isEquipped));

    if (hasMortar) {
      this.mortarCooldownTimer += deltaMs;
      // Activates every 8 seconds (8000ms)
      if (this.mortarCooldownTimer >= 8000) {
        this.mortarCooldownTimer = 0;

        // Find tactical target location: densest enemy group or random enemy
        let targetX = cx + (Math.random() - 0.5) * 260;
        let targetY = cy + (Math.random() - 0.5) * 260;

        const livingEnemies = this.enemies.filter(e => e.hp > 0 && !e.isAllied);
        if (livingEnemies.length > 0) {
          let bestEnemy = livingEnemies[0];
          let maxNearby = -1;

          for (const candidate of livingEnemies) {
            let nearbyCount = 0;
            for (const other of livingEnemies) {
              const dx = other.x - candidate.x;
              const dy = other.y - candidate.y;
              if (dx * dx + dy * dy <= 100 * 100) nearbyCount++;
            }
            if (nearbyCount > maxNearby) {
              maxNearby = nearbyCount;
              bestEnemy = candidate;
            }
          }
          targetX = bestEnemy.x + (Math.random() - 0.5) * 15;
          targetY = bestEnemy.y + (Math.random() - 0.5) * 15;
        }

        const mortarMult = mortarDrop ? mortarDrop.effectMultiplier : (1 + labMortarLvl * 0.25 + (mortarCard && mortarCard.isEquipped ? (mortarCard.level - 1) * 0.20 : 0));
        
        this.activeMortarStrikes.push({
          x: targetX,
          y: targetY,
          radius: 75,
          timerMs: 1200,
          maxTimerMs: 1200,
          damage: stats.damage * (5.5 * mortarMult),
        });
      }
    }

    // Process Active Mortar Targeting fields & Explosions
    for (let i = this.activeMortarStrikes.length - 1; i >= 0; i--) {
      const strike = this.activeMortarStrikes[i];
      strike.timerMs -= deltaMs;

      if (strike.timerMs <= 0) {
        soundEngine.playMortarExplosion();

        const hasPoison = Boolean(this.state.activeRareDrops?.some(d => d.id === 'poison') || (this.state.labResearchLevels?.['lab_skill_poison'] || 0) > 0);
        const hasChain = Boolean(this.state.activeRareDrops?.some(d => d.id === 'lightning_chain') || (this.state.labResearchLevels?.['lab_skill_lightning'] || 0) > 0);
        const hasCalamity = Boolean(this.state.activeRareDrops?.some(d => d.id === 'flow_of_calamity') || (this.state.labResearchLevels?.['lab_skill_calamity'] || 0) > 0);

        // AREA OF EFFECT CARD
        const aoeCard = this.state.cards?.['card_area_of_effect'];
        const aoeMult = (aoeCard && aoeCard.isEquipped) ? (1 + 0.20 + (aoeCard.level - 1) * 0.10) : 1.0;
        const effectiveRadius = strike.radius * aoeMult;

        this.spawnExplosion(strike.x, strike.y, effectiveRadius * 1.35, hasPoison ? 0x10b981 : (hasChain ? 0x38bdf8 : 0xef4444));

        // ULTIMATE CRIT CARD
        const ultCritCard = this.state.cards?.['card_ultimate_crit'];
        let ultCritMult = 1.0;
        let ultIsCrit = false;
        if (ultCritCard && ultCritCard.isEquipped) {
          const ultChance = 0.10 + (ultCritCard.level - 1) * 0.03;
          if (Math.random() < ultChance) {
            ultCritMult = 2.0;
            ultIsCrit = true;
          }
        }

        let hitCount = 0;

        // Heavy AOE Mortar Shell detonation
        this.spatialGrid.queryRadius(strike.x, strike.y, effectiveRadius, (enemy) => {
          if (enemy.hp <= 0 || enemy.isAllied) return;
          hitCount++;
          let finalDamage = strike.damage * (enemy.type === 'boss' ? stats.bossDamageMult : 1.0);
          if (ultIsCrit) {
            finalDamage *= ultCritMult;
          }
          enemy.hp -= finalDamage;
          this.popupManager.spawnDamage(enemy.x, enemy.y, finalDamage, true, ultIsCrit ? stats.critMultiplier * 1.4 * 2.0 : stats.critMultiplier * 1.4);

          // Strong outward blast wave knockback
          const dx = enemy.x - strike.x;
          const dy = enemy.y - strike.y;
          const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));
          if (enemy.type !== 'boss') {
            enemy.x += (dx / dist) * 44;
            enemy.y += (dy / dist) * 44;
          }

          // Mortar + Poison synergy
          if (hasPoison) {
            enemy.poisonTimer = 10000;
            const poisonDmg = Math.max(4, Math.round(enemy.maxHp * 0.12));
            enemy.hp -= poisonDmg;
            this.popupManager.spawnDamage(enemy.x, enemy.y, poisonDmg, false, 1.0);
          }

          // Mortar + Calamity Nova synergy
          if (hasCalamity) {
            enemy.speed = (enemy.speed || 1) * 0.45;
            const extraCalamityHit = Math.round(finalDamage * 0.5);
            enemy.hp -= extraCalamityHit;
            this.popupManager.spawnDamage(enemy.x, enemy.y, extraCalamityHit, true, 1.5);
          }
        });

        if (ultIsCrit) {
          this.popupManager.spawnText(strike.x, strike.y - 45, '💥 ULTIMATE CRIT!', 0xf59e0b);
        }

        // Mortar + Lightning Chain synergy (Electrified Mortar)
        if (hasChain && hitCount > 0) {
          let chainTargets = 0;
          this.spatialGrid.queryRadius(strike.x, strike.y, 180, (other) => {
            if (other.hp > 0 && !other.isAllied && chainTargets < 5) {
              const shockDmg = Math.max(1, Math.round(strike.damage * 0.35));
              other.hp -= shockDmg;
              this.popupManager.spawnDamage(other.x, other.y, shockDmg, false, 1.0);
              this.spawnLightningZap(strike.x, strike.y, other.x, other.y, 0xfacc15);
              soundEngine.playZap();
              chainTargets++;
            }
          });
          this.popupManager.spawnText(strike.x, strike.y - 35, '⚡ ELECTRIFIED MORTAR!', 0xfacc15);
        } else if (hasCalamity) {
          this.popupManager.spawnText(strike.x, strike.y - 25, '🌀 CALAMITY NOVA!', 0xa855f7);
        } else if (hasPoison) {
          this.popupManager.spawnText(strike.x, strike.y - 25, '☣️ TOXIC FALLOUT!', 0x10b981);
        } else {
          this.popupManager.spawnText(strike.x, strike.y - 25, '💥 MORTAR STRIKE!', 0xef4444);
        }

        this.activeMortarStrikes.splice(i, 1);
      }
    }
  }

  private updateExplosionsAndDeflections(deltaMs: number) {
    // 1. Explosions
    for (let i = this.activeExplosions.length - 1; i >= 0; i--) {
      const exp = this.activeExplosions[i];
      exp.lifeMs -= deltaMs;
      const progress = 1 - (exp.lifeMs / exp.maxLifeMs);
      exp.radius = exp.maxRadius * Math.sin(progress * Math.PI * 0.5);
      exp.alpha = 1 - progress;

      if (exp.lifeMs <= 0) {
        this.activeExplosions.splice(i, 1);
      }
    }

    // 2. Deflections
    for (let i = this.activeDeflections.length - 1; i >= 0; i--) {
      const def = this.activeDeflections[i];
      def.lifeMs -= deltaMs;
      const progress = 1 - (def.lifeMs / def.maxLifeMs);
      def.radius = 8 + 16 * progress;
      def.alpha = 1 - progress;

      if (def.lifeMs <= 0) {
        this.activeDeflections.splice(i, 1);
      }
    }

    // 3. Lightning Electric Arcs
    for (let i = this.activeLightningArcs.length - 1; i >= 0; i--) {
      const arc = this.activeLightningArcs[i];
      arc.lifeMs -= deltaMs;
      arc.alpha = Math.max(0, arc.lifeMs / arc.maxLifeMs);
      if (arc.lifeMs <= 0) {
        this.activeLightningArcs.splice(i, 1);
      }
    }
  }

  private updateAilmentZones(deltaMs: number, stats: ReturnType<Simulation['getPlayerCombatStats']>) {
    // 1. Poison Clouds
    for (let i = this.activePoisonClouds.length - 1; i >= 0; i--) {
      const cloud = this.activePoisonClouds[i];
      cloud.lifeMs -= deltaMs;
      if (cloud.lifeMs <= 0) {
        this.activePoisonClouds.splice(i, 1);
        continue;
      }
      this.spatialGrid.queryRadius(cloud.x, cloud.y, cloud.radius, (enemy) => {
        if (enemy.hp <= 0 || enemy.isAllied) return;
        const cloudDmg = cloud.damage * (deltaMs / 1000);
        enemy.hp -= cloudDmg;
        if (Math.random() < 0.04) {
          this.popupManager.spawnDamage(enemy.x, enemy.y, cloudDmg, false, 1.0);
        }
      });
    }

    // 2. Shrapnel Rainfall
    for (let i = this.activeShrapnelRainfalls.length - 1; i >= 0; i--) {
      const rainfall = this.activeShrapnelRainfalls[i];
      rainfall.lifeMs -= deltaMs;
      if (rainfall.lifeMs <= 0) {
        this.activeShrapnelRainfalls.splice(i, 1);
        continue;
      }
      this.spatialGrid.queryRadius(rainfall.x, rainfall.y, rainfall.radius, (enemy) => {
        if (enemy.hp <= 0 || enemy.isAllied) return;
        const rainDmg = rainfall.damage * (deltaMs / 1000);
        enemy.hp -= rainDmg;
        enemy.bleedTimer = 3000; // 3 second bleed
        if (Math.random() < 0.08) {
          this.popupManager.spawnDamage(enemy.x, enemy.y, rainDmg, false, 1.2);
        }
      });
    }
  }

  private updateUltimateWeapons(
    deltaMs: number,
    effectiveDelta: number,
    stats: ReturnType<Simulation['getPlayerCombatStats']>,
    onStateUpdate: (state: Partial<GameState>) => void
  ) {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;
    const upgrades = this.state.workshopUpgrades || {};
    const labs = this.state.labResearchLevels || {};

    // 1. SMART MISSILES
    const smartMissilesLvl = upgrades['perm_smart_missiles'] || 0;
    if (smartMissilesLvl > 0 && !this.state.isDead && this.state.isWaveActive) {
      this.smartMissileTimer += deltaMs;
      const interval = Math.max(2500, 5000 - smartMissilesLvl * 200);
      if (this.smartMissileTimer >= interval) {
        this.smartMissileTimer = 0;
        const count = 2 + smartMissilesLvl;
        const labMult = 1.0 + (labs['lab_uw_smart_missiles'] || 0) * 0.20;
        const missileDmg = stats.damage * 4.5 * labMult;

        const livingEnemies = this.enemies.filter(e => e.hp > 0 && !e.isAllied);
        if (livingEnemies.length > 0) {
          livingEnemies.sort((a, b) => b.hp - a.hp); // Target beefiest enemies
          for (let k = 0; k < Math.min(count, livingEnemies.length); k++) {
            const target = livingEnemies[k % livingEnemies.length];
            const angle = Math.atan2(target.y - cy, target.x - cx) + (Math.random() - 0.5) * 0.4;
            this.activeRockets.push({
              x: cx,
              y: cy,
              angle,
              speed: 4.8 + Math.random() * 1.5,
              damage: missileDmg,
              blastRadius: 40 + smartMissilesLvl * 2,
              lifeMs: 4000,
              trail: [],
            });
          }
          this.popupManager.spawnText(cx, cy - 35, `🚀 SMART MISSILES x${Math.min(count, livingEnemies.length)}`, 0x06b6d4);
          soundEngine.playRocketExplosion();
        }
      }
    }

    // 2. DEATH WAVE
    const deathWaveLvl = upgrades['perm_death_wave'] || 0;
    if (deathWaveLvl > 0 && !this.state.isDead && this.state.isWaveActive) {
      this.deathWaveTimer += deltaMs;
      const interval = Math.max(8000, 15000 - deathWaveLvl * 500);
      if (this.deathWaveTimer >= interval) {
        this.deathWaveTimer = 0;
        const labMult = 1.0 + (labs['lab_uw_death_wave'] || 0) * 0.25;
        const waveDmg = stats.damage * 8.0 * (1 + deathWaveLvl * 0.3) * labMult;

        this.spawnExplosion(cx, cy, 260, 0xd946ef);
        soundEngine.playLaserSweep();
        this.popupManager.spawnText(cx, cy - 45, '💀 DEATH WAVE!', 0xd946ef);

        let kills = 0;
        this.spatialGrid.queryRadius(cx, cy, 280, (enemy) => {
          if (enemy.hp <= 0 || enemy.isAllied) return;
          enemy.hp -= waveDmg;
          this.popupManager.spawnDamage(enemy.x, enemy.y, waveDmg, true, stats.critMultiplier);
          if (enemy.hp <= 0) {
            kills++;
          }
        });

        if (kills > 0) {
          const hpBonus = kills * (1 + (labs['lab_uw_death_wave'] || 0));
          this.state.playerMaxHp = (this.state.playerMaxHp || stats.effectiveMaxHp) + hpBonus;
          this.state.playerHp = Math.min(this.state.playerMaxHp, this.state.playerHp + hpBonus);
          this.popupManager.spawnText(cx, cy - 25, `+${hpBonus} MAX HP GAINED`, 0x10b981);
          onStateUpdate({ playerMaxHp: this.state.playerMaxHp, playerHp: this.state.playerHp });
        }
      }
    }

    // 3. POISON SWAMP
    const poisonSwampLvl = upgrades['perm_poison_swamp'] || 0;
    if (poisonSwampLvl > 0 && !this.state.isDead && this.state.isWaveActive) {
      this.poisonSwampTimer += deltaMs;
      const interval = Math.max(3500, 6000 - poisonSwampLvl * 300);
      if (this.poisonSwampTimer >= interval) {
        this.poisonSwampTimer = 0;
        const labMult = 1.0 + (labs['lab_uw_poison_swamp'] || 0) * 0.20;
        const swampDmg = stats.damage * 1.5 * (1 + poisonSwampLvl * 0.25) * labMult;

        const living = this.enemies.filter(e => e.hp > 0 && !e.isAllied);
        if (living.length > 0) {
          const pick = living[Math.floor(Math.random() * living.length)];
          this.activePoisonClouds.push({
            x: pick.x,
            y: pick.y,
            radius: 65 + poisonSwampLvl * 5,
            lifeMs: 6000,
            maxLifeMs: 6000,
            damage: swampDmg,
          });
          this.popupManager.spawnText(pick.x, pick.y - 20, '☣️ POISON SWAMP', 0x10b981);
        }
      }
    }

    // 4. SPOTLIGHT
    const spotlightLvl = upgrades['perm_spotlight'] || 0;
    if (spotlightLvl > 0 && !this.state.isDead) {
      this.spotlightAngle += 0.015 * effectiveDelta;
      const labMult = 1.0 + (labs['lab_uw_spotlight'] || 0) * 0.20;
      const damageMult = (1.5 + spotlightLvl * 0.25) * labMult;
      const coneSpan = (45 * Math.PI) / 180;
      const maxDist = stats.attackRadius * 1.6;

      for (const enemy of this.enemies) {
        if (enemy.hp <= 0 || enemy.isAllied) continue;
        const dx = enemy.x - cx;
        const dy = enemy.y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= maxDist) {
          const enemyAngle = Math.atan2(dy, dx);
          let diff = Math.abs(enemyAngle - this.spotlightAngle);
          while (diff > Math.PI) diff = Math.abs(diff - Math.PI * 2);
          if (diff <= coneSpan / 2) {
            enemy.isSpotlit = true;
            enemy.spotlightMultiplier = damageMult;
          } else {
            enemy.isSpotlit = false;
            enemy.spotlightMultiplier = 1.0;
          }
        }
      }
    }

    // 5. INNER LANDMINES
    const landminesLvl = upgrades['perm_inner_landmines'] || 0;
    if (landminesLvl > 0 && !this.state.isDead) {
      this.innerLandmineSpawnTimer += deltaMs;
      const targetMines = Math.min(8, 3 + landminesLvl);
      if (this.innerLandmineSpawnTimer >= 3000 && this.landMines.length < targetMines) {
        this.innerLandmineSpawnTimer = 0;
        const angle = Math.random() * Math.PI * 2;
        const dist = 60 + Math.random() * 20;
        this.landMines.push({
          x: cx + Math.cos(angle) * dist,
          y: cy + Math.sin(angle) * dist,
          radius: 12,
          lifeMs: 40000,
        });
      }

      // Check landmine detonations
      const labMult = 1.0 + (labs['lab_uw_inner_landmines'] || 0) * 0.25;
      const mineDmg = stats.damage * 6.0 * (1 + landminesLvl * 0.35) * labMult;

      for (let i = this.landMines.length - 1; i >= 0; i--) {
        const mine = this.landMines[i];
        mine.lifeMs -= deltaMs;
        let detonated = false;

        this.spatialGrid.queryRadius(mine.x, mine.y, 22, (enemy) => {
          if (enemy.hp > 0 && !enemy.isAllied) {
            detonated = true;
          }
        });

        if (detonated || mine.lifeMs <= 0) {
          if (detonated) {
            this.spawnExplosion(mine.x, mine.y, 55, 0xf97316);
            soundEngine.playRocketExplosion();
            this.popupManager.spawnText(mine.x, mine.y - 15, '💣 LANDMINE DETONATED!', 0xf97316);

            this.spatialGrid.queryRadius(mine.x, mine.y, 55, (enemy) => {
              if (enemy.hp <= 0 || enemy.isAllied) return;
              enemy.hp -= mineDmg;
              this.popupManager.spawnDamage(enemy.x, enemy.y, mineDmg, true, stats.critMultiplier);
            });
          }
          this.landMines.splice(i, 1);
        }
      }
    }
  }

  private updateSpecialSkills(
    deltaMs: number,
    effectiveDelta: number,
    stats: ReturnType<Simulation['getPlayerCombatStats']>,
    onStateUpdate: (state: Partial<GameState>) => void
  ) {
    this.updateRockets(deltaMs, effectiveDelta, stats);
    this.updateLaserSweep(deltaMs, effectiveDelta, stats);
    this.updateMortarStrikes(deltaMs, stats);
    this.updateExplosionsAndDeflections(deltaMs);
    this.updateAilmentZones(deltaMs, stats);
    this.updateUltimateWeapons(deltaMs, effectiveDelta, stats, onStateUpdate);

    // Render all special combat VFX
    this.renderer.drawSpecialCombatEffects({
      rockets: this.activeRockets.map(r => ({
        x: r.x,
        y: r.y,
        angle: r.angle,
        trail: r.trail,
      })),
      explosions: this.activeExplosions.map(e => ({
        x: e.x,
        y: e.y,
        radius: e.radius,
        maxRadius: e.maxRadius,
        color: e.color,
        alpha: e.alpha,
      })),
      laserSweep: this.activeLaserSweep ? {
        active: this.activeLaserSweep.active,
        currentAngle: this.activeLaserSweep.currentAngle,
        startAngle: this.activeLaserSweep.startAngle,
        endAngle: this.activeLaserSweep.endAngle,
        radius: this.activeLaserSweep.radius,
        progress: this.activeLaserSweep.progress,
      } : null,
      mortars: this.activeMortarStrikes.map(m => ({
        x: m.x,
        y: m.y,
        radius: m.radius,
        progress: m.timerMs / m.maxTimerMs,
        isLanding: m.timerMs <= 200,
      })),
      deflections: this.activeDeflections.map(d => ({
        x: d.x,
        y: d.y,
        radius: d.radius,
        alpha: d.alpha,
      })),
      lightningArcs: this.activeLightningArcs.map(a => ({
        x1: a.x1,
        y1: a.y1,
        x2: a.x2,
        y2: a.y2,
        alpha: a.alpha,
        color: a.color,
      })),
      poisonClouds: this.activePoisonClouds,
      shrapnelRainfalls: this.activeShrapnelRainfalls,
    });

    this.renderer.drawEnemyAilments(this.enemies);
  }

  private startWave() {
    const wave = this.state.wave || 1;
    const tier = this.state.tier || 1;
    this.waveEnemiesTotal = WAVE_CONFIG.getEnemiesForWave(wave, tier);
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesDefeated = 0;
    this.state.totalEnemiesInWave = this.waveEnemiesTotal;
    this.state.enemiesRemaining = this.waveEnemiesTotal;
    this.state.waveProgress = 0;
    this.waveTimeElapsed = 0;
    this.spawnTimer = 0;
    this.state.isWaveActive = true;
    this.isIntermission = false;
    this.intermissionTimer = 0;
    this.nukeFiredThisWave = false;
  }

  private spawnEnemy(isBoss: boolean = false) {
    const wave = this.state.wave;
    const tier = this.state.tier || 1;
    const type = isBoss ? 'boss' : this.getRandomEnemyType(wave);

    const side = Math.floor(Math.random() * 4);
    const margin = 20;
    let x = 0, y = 0;
    if (side === 0) { x = Math.random() * GAME_WIDTH; y = -margin; }
    if (side === 1) { x = GAME_WIDTH + margin; y = Math.random() * GAME_HEIGHT; }
    if (side === 2) { x = Math.random() * GAME_WIDTH; y = GAME_HEIGHT + margin; }
    if (side === 3) { x = -margin; y = Math.random() * GAME_HEIGHT; }

    this.createEnemyEntity(x, y, type, wave, tier);
    
  }

  public createEnemyEntity(x: number, y: number, type: string, wave: number = this.state.wave, tier: number = this.state.tier || 1): Entity {
    const playerStats = this.getPlayerCombatStats();
    const stats = getEnemyWaveStats(type, wave, tier, playerStats);
    const hp = stats.hp;
    const dps = stats.dps;

    let speed = 1.0;
    let color = 0xef4444;
    let radius = PHYSICS_CONFIG.enemyRadii[type as keyof typeof PHYSICS_CONFIG.enemyRadii] || PHYSICS_CONFIG.enemyRadii.default;

    let bossArchetype: any = null;
    if (type === 'boss') {
      bossArchetype = getBossArchetype(wave);
      speed = bossArchetype.speed;
      color = bossArchetype.colorInt;
      radius = PHYSICS_CONFIG.enemyRadii.boss;
    } else if (type === 'orange_triangle') {
      speed = ENEMY_BASE_STATS.orange_triangle.speed;
      color = 0xf97316; // Orange
    } else if (type === 'big_square') {
      speed = ENEMY_BASE_STATS.big_square.speed;
      color = 0x3b82f6; // Heavy Blue
    } else if (type === 'circle') {
      speed = ENEMY_BASE_STATS.circle.speed;
      color = 0x10b981; // Teal
    } else if (type === 'purple_pentagon') {
      speed = ENEMY_BASE_STATS.purple_pentagon.speed;
      color = 0xa855f7; // Void Purple
    } else if (type === 'gold_hexagon') {
      speed = ENEMY_BASE_STATS.gold_hexagon.speed;
      color = 0xeab308; // Bastion Gold
    } else if (type === 'emerald_diamond') {
      speed = ENEMY_BASE_STATS.emerald_diamond.speed;
      color = 0x10b981; // Emerald Mint
    } else if (type === 'crimson_octagon') {
      speed = ENEMY_BASE_STATS.crimson_octagon.speed;
      color = 0xdc2626; // Crimson Red
    } else if (type === 'enraged_trapezium') {
      speed = ENEMY_BASE_STATS.enraged_trapezium.speed;
      color = 0xf97316; // Orange base
    } else if (type === 'disruptor_emp') {
      speed = ENEMY_BASE_STATS.disruptor_emp.speed;
      color = 0x06b6d4; // Cyan Ion
    } else if (type === 'reflector_prism') {
      speed = ENEMY_BASE_STATS.reflector_prism.speed;
      color = 0x38bdf8; // Diamond Sky
    } else if (type === 'splitter_cluster') {
      speed = ENEMY_BASE_STATS.splitter_cluster.speed;
      color = 0x10b981; // Emerald Cluster
    } else if (type === 'cluster_mini') {
      speed = ENEMY_BASE_STATS.cluster_mini.speed;
      color = 0x34d399; // Mint Shard
    } else if (type === 'phase_shifter') {
      speed = ENEMY_BASE_STATS.phase_shifter.speed;
      color = 0x8b5cf6; // Void Violet
    } else {
      speed = ENEMY_BASE_STATS.red_square.speed;
      color = 0xef4444; // Red
    }

    // --- VARIANT ROLLS ---
    // 1. Golden Shapes (Rare loot variant, 0.02% for boss, 0.8% for regular wave >= 4)
    let isGolden = false;
    if (type === 'boss') {
      isGolden = Math.random() < 0.0002; // 0.02% chance for Golden Boss!
    } else if (wave >= 4) {
      isGolden = Math.random() < 0.008; // 0.8% chance
    }

    // 2. Shielded Shapes:
    // Bosses strictly DO NOT have shields until wave 50!
    let isShielded = false;
    let maxShieldHp: number | undefined = undefined;
    let shieldHp: number | undefined = undefined;
    if (type === 'boss') {
      if (wave >= 50) {
        isShielded = true;
        maxShieldHp = Math.round(hp * 0.45);
        shieldHp = maxShieldHp;
      }
    } else if (!isGolden && wave >= 15) {
      if (Math.random() < 0.10) {
        isShielded = true;
        maxShieldHp = Math.round(hp * 0.40);
        shieldHp = maxShieldHp;
      }
    }

    // 3. Ailment-Resistant Shapes (Innate immunity to one ailment, wave >= 8)
    let resistantAilment: 'poison' | 'decay' | 'shock' | 'freeze' | 'bleed' | undefined = undefined;
    if (wave >= 8 && Math.random() < 0.14) {
      const ailments: ('poison' | 'decay' | 'shock' | 'freeze' | 'bleed')[] = ['poison', 'decay', 'shock', 'freeze', 'bleed'];
      resistantAilment = ailments[Math.floor(Math.random() * ailments.length)];
    }

    let finalHp = hp;
    let finalRadius = radius;
    if (isGolden) {
      finalRadius *= 1.25;
      finalHp = Math.round(hp * 2.0);
    }

    // Check pool first to reuse graphics and avoid GC allocation
    const poolKey = type === 'boss' ? `boss_${bossArchetype?.id || 'default'}` : type;
    let pool = this.enemyPools.get(poolKey);
    if (!pool) {
      pool = [];
      this.enemyPools.set(poolKey, pool);
    }

    let enemy = pool.pop();
    if (enemy) {
      enemy.x = x;
      enemy.y = y;
      enemy.hp = finalHp;
      enemy.maxHp = finalHp;
      enemy.speed = speed;
      enemy.dps = dps;
      enemy.radius = finalRadius;
      enemy.rotation = Math.random() * Math.PI * 2;
      enemy.angularVelocity = (Math.random() - 0.5) * 0.04;
      enemy.poisonTimer = undefined;
      enemy.poisonDps = undefined;
      enemy.decayStacks = undefined;
      enemy.decayTimer = undefined;
      enemy.bleedTimer = undefined;
      enemy.blinkTimerMs = type === 'purple_pentagon' ? 2600 + Math.random() * 800 : undefined;
      enemy.isOrbiting = false;
      enemy.orbitAngle = undefined;
      enemy.orbitRadius = undefined;
      (enemy as any).spiralInwardOffset = 0;
      (enemy as any).bossArchetype = bossArchetype;
      (enemy as any).bossAbilityTimer = 0;
      enemy.orbitDirection = type === 'circle' ? (Math.random() < 0.5 ? 1 : -1) : undefined;
      enemy.orbitSpeed = type === 'circle' ? (0.013 + Math.random() * 0.003) : undefined;
      enemy.shootRange = type === 'circle' ? 210 : undefined;
      enemy.shootCooldownMs = type === 'circle' ? (1500 + Math.random() * 400) : undefined;
      enemy.lastEnemyShotTime = undefined;
      enemy.isAllied = false;
      enemy.alliedTimer = undefined;
      
      // Variants & Types
      enemy.isGolden = isGolden;
      enemy.isShielded = isShielded;
      enemy.maxShieldHp = maxShieldHp;
      enemy.shieldHp = shieldHp;
      enemy.resistantAilment = resistantAilment;
      enemy.hasBalloon = type === 'enraged_trapezium';
      enemy.isEnraged = false;
      enemy.empAuraRadius = type === 'disruptor_emp' ? 85 : undefined;
      enemy.isDeflector = type === 'reflector_prism';
      enemy.isSplitter = type === 'splitter_cluster';
      enemy.isPhased = false;
      enemy.phaseTimerMs = type === 'phase_shifter' ? (3000 + Math.random() * 1000) : undefined;

      enemy.graphics.tint = isGolden ? 0xfacc15 : 0xffffff;
      enemy.graphics.visible = true;
      enemy.graphics.alpha = 1.0;
      enemy.graphics.x = x;
      enemy.graphics.y = y;
      enemy.graphics.rotation = enemy.rotation;
      this.enemies.push(enemy);
      return enemy;
    }

    const graphics = new Graphics();

    if (type === 'boss') {
      const arch = bossArchetype || getBossArchetype(wave);
      if (arch.id === 'apex_decagon') {
        // Apex Decagon (10-sided fortress titan with heavy armor rim)
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < 10; i++) {
          const a = (i / 10) * Math.PI * 2;
          pts.push({ x: Math.cos(a) * 16, y: Math.sin(a) * 16 });
        }
        graphics.poly(pts).fill(arch.colorInt).stroke({ color: 0xffedd5, width: 2.5, alpha: 0.95 });
        graphics.circle(0, 0, 9).stroke({ color: 0xf59e0b, width: 2, alpha: 0.85 });
        graphics.circle(0, 0, 4).fill(0xffffff);
      } else if (arch.id === 'pulsar_star') {
        // Pulsar Star (8-pointed radiant nova star)
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < 16; i++) {
          const r = i % 2 === 0 ? 17 : 8;
          const a = (i / 16) * Math.PI * 2;
          pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
        }
        graphics.poly(pts).fill(arch.colorInt).stroke({ color: 0xfecdd3, width: 2.2, alpha: 0.95 });
        graphics.circle(0, 0, 6).fill(0xffffff).stroke({ color: 0xf43f5e, width: 1.5 });
      } else if (arch.id === 'vortex_hexagon') {
        // Vortex Hexagon (6-sided graviton titan with internal spiral)
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2;
          pts.push({ x: Math.cos(a) * 16, y: Math.sin(a) * 16 });
        }
        graphics.poly(pts).fill(arch.colorInt).stroke({ color: 0xe9d5ff, width: 2.5, alpha: 0.95 });
        graphics.circle(0, 0, 8).stroke({ color: 0xd8b4fe, width: 1.8, alpha: 0.8 });
        graphics.circle(0, 0, 3).fill(0x1e1b4b);
      } else if (arch.id === 'prism_colossus') {
        // Prism Colossus (faceted crystal diamond with cyan light rays)
        const pts = [
          { x: 0, y: -18 },
          { x: 13, y: 0 },
          { x: 0, y: 18 },
          { x: -13, y: 0 }
        ];
        graphics.poly(pts).fill(arch.colorInt).stroke({ color: 0xcffafe, width: 2.5, alpha: 0.95 });
        graphics.moveTo(0, -18).lineTo(0, 18).stroke({ color: 0xffffff, width: 1.8, alpha: 0.8 });
        graphics.moveTo(-13, 0).lineTo(13, 0).stroke({ color: 0xffffff, width: 1.8, alpha: 0.8 });
      } else {
        // Hyper-Tesseract (4D nested square projection with void core)
        graphics.rect(-13, -13, 26, 26).fill(arch.colorInt).stroke({ color: 0xe9d5ff, width: 2.5, alpha: 0.95 });
        graphics.rect(-7, -7, 14, 14).stroke({ color: 0x38bdf8, width: 1.8, alpha: 0.85 });
        graphics.circle(0, 0, 3).fill(0xffffff);
      }
    } else if (type === 'purple_pentagon') {
      const pts = [];
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        pts.push({ x: Math.cos(a) * 6.5, y: Math.sin(a) * 6.5 });
      }
      graphics.poly(pts).fill(color).stroke({ color: 0xe9d5ff, width: 1.2, alpha: 0.85 });
    } else if (type === 'gold_hexagon') {
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        pts.push({ x: Math.cos(a) * 7.5, y: Math.sin(a) * 7.5 });
      }
      graphics.poly(pts).fill(color).stroke({ color: 0xfef08a, width: 1.5, alpha: 0.9 });
    } else if (type === 'emerald_diamond') {
      graphics.poly([{ x: 0, y: -7.5 }, { x: 4.5, y: 0 }, { x: 0, y: 7.5 }, { x: -4.5, y: 0 }]).fill(color).stroke({ color: 0x6ee7b7, width: 1.2, alpha: 0.85 });
    } else if (type === 'crimson_octagon') {
      const pts = [];
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        pts.push({ x: Math.cos(a) * 8.5, y: Math.sin(a) * 8.5 });
      }
      graphics.poly(pts).fill(color).stroke({ color: 0xfca5a5, width: 1.5, alpha: 0.9 });
    } else if (type === 'enraged_trapezium') {
      // Isosceles Trapezium: Top width 7, Bottom width 13, Height 10
      graphics.poly([
        { x: -3.5, y: -5 },
        { x: 3.5, y: -5 },
        { x: 6.5, y: 5 },
        { x: -6.5, y: 5 }
      ]).fill(color).stroke({ color: 0xfdba74, width: 1.5, alpha: 0.9 });
    } else if (type === 'disruptor_emp') {
      // Jagged 10-point ion sawtooth star
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 6.5 : 3.8;
        const a = (i / 10) * Math.PI * 2;
        pts.push({ x: Math.cos(a) * r, y: Math.sin(a) * r });
      }
      graphics.poly(pts).fill(color).stroke({ color: 0x67e8f9, width: 1.2, alpha: 0.9 });
      graphics.circle(0, 0, 2.5).fill(0xffffff);
    } else if (type === 'reflector_prism') {
      // Faceted diamond prism
      graphics.poly([
        { x: 0, y: -6.5 },
        { x: 5.5, y: -2 },
        { x: 0, y: 6.5 },
        { x: -5.5, y: -2 }
      ]).fill(color).stroke({ color: 0xe0f2fe, width: 1.5, alpha: 0.95 });
      // Internal facet reflection cross
      graphics.moveTo(0, -6.5).lineTo(0, 6.5).stroke({ color: 0xffffff, width: 1, alpha: 0.7 });
      graphics.moveTo(-5.5, -2).lineTo(5.5, -2).stroke({ color: 0xffffff, width: 1, alpha: 0.7 });
    } else if (type === 'splitter_cluster') {
      // Segmented matrix heptagon (7 sides)
      const pts = [];
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2 - Math.PI / 2;
        pts.push({ x: Math.cos(a) * 7.0, y: Math.sin(a) * 7.0 });
      }
      graphics.poly(pts).fill(color).stroke({ color: 0x6ee7b7, width: 1.5, alpha: 0.9 });
      // Internal fracture lines
      graphics.moveTo(0, 0).lineTo(0, -7.0).stroke({ color: 0xa7f3d0, width: 1, alpha: 0.6 });
      graphics.moveTo(0, 0).lineTo(6.0, 3.5).stroke({ color: 0xa7f3d0, width: 1, alpha: 0.6 });
      graphics.moveTo(0, 0).lineTo(-6.0, 3.5).stroke({ color: 0xa7f3d0, width: 1, alpha: 0.6 });
    } else if (type === 'cluster_mini') {
      // Mini emerald shard
      graphics.poly([
        { x: 0, y: -4 },
        { x: 3.5, y: 3.5 },
        { x: -3.5, y: 3.5 }
      ]).fill(color).stroke({ color: 0xa7f3d0, width: 1, alpha: 0.9 });
    } else if (type === 'phase_shifter') {
      // Tachyon 9-pointed quantum star with void aperture
      const pts = [];
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        pts.push({ x: Math.cos(a) * 6.0, y: Math.sin(a) * 6.0 });
      }
      graphics.poly(pts).fill(color).stroke({ color: 0xd8b4fe, width: 1.4, alpha: 0.9 });
      graphics.circle(0, 0, 2.5).fill(0x2e1065);
    } else if (type === 'orange_triangle') {
      graphics.poly([{ x: 0, y: -6 }, { x: 5.5, y: 5 }, { x: -5.5, y: 5 }]).fill(color).stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
    } else if (type === 'circle') {
      graphics.circle(0, 0, 5).fill(color).stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
    } else {
      const size = type === 'big_square' ? 12 : 8;
      graphics.rect(-size / 2, -size / 2, size, size).fill(color).stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
    }

    this.renderer.enemyContainer.addChild(graphics);
    const newEnemy: Entity = {
      x,
      y,
      hp: finalHp,
      maxHp: finalHp,
      graphics,
      type,
      speed,
      dps,
      radius: finalRadius,
      rotation: Math.random() * Math.PI * 2,
      angularVelocity: (Math.random() - 0.5) * 0.04,
      blinkTimerMs: type === 'purple_pentagon' ? 2600 + Math.random() * 800 : undefined,
      orbitRadius: undefined,
      spiralInwardOffset: 0,
      bossArchetype,
      bossAbilityTimer: 0,
      orbitDirection: type === 'circle' ? (Math.random() < 0.5 ? 1 : -1) : undefined,
      orbitSpeed: type === 'circle' ? (0.013 + Math.random() * 0.003) : undefined,
      shootRange: type === 'circle' ? 210 : undefined,
      shootCooldownMs: type === 'circle' ? (1500 + Math.random() * 400) : undefined,
      isGolden,
      isShielded,
      maxShieldHp,
      shieldHp,
      resistantAilment,
      hasBalloon: type === 'enraged_trapezium',
      isEnraged: false,
      empAuraRadius: type === 'disruptor_emp' ? 85 : undefined,
      isDeflector: type === 'reflector_prism',
      isSplitter: type === 'splitter_cluster',
      isPhased: false,
      phaseTimerMs: type === 'phase_shifter' ? (3000 + Math.random() * 1000) : undefined,
    };
    if (isGolden) {
      graphics.tint = 0xfacc15;
    }
    this.enemies.push(newEnemy);
    return newEnemy;
  }

  private getRandomEnemyType(wave: number): string {
    if (wave <= 2) return 'red_square';

    const triangleWeight = wave >= 3 ? Math.min(30, 15 + wave * 2) : 0;
    const circleWeight = wave >= 6 ? Math.min(25, 12 + wave) : 0;
    const pentagonWeight = wave >= 8 ? Math.min(22, 10 + wave) : 0;
    const tankWeight = wave >= 11 ? Math.min(20, 8 + Math.floor(wave / 2)) : 0;
    const diamondWeight = wave >= 12 ? Math.min(18, 8 + Math.floor(wave / 2)) : 0;
    const enragedWeight = wave >= 14 ? Math.min(18, 8 + Math.floor(wave / 2)) : 0;
    const hexagonWeight = wave >= 16 ? Math.min(16, 6 + Math.floor(wave / 3)) : 0;
    const disruptorWeight = wave >= 18 ? Math.min(14, 5 + Math.floor(wave / 3)) : 0;
    const reflectorWeight = wave >= 20 ? Math.min(14, 5 + Math.floor(wave / 3)) : 0;
    const splitterWeight = wave >= 22 ? Math.min(14, 5 + Math.floor(wave / 3)) : 0;
    const octagonWeight = wave >= 25 ? Math.min(12, 4 + Math.floor(wave / 4)) : 0;
    const phaseWeight = wave >= 28 ? Math.min(12, 4 + Math.floor(wave / 4)) : 0;

    const baseRedWeight = Math.max(25, 60 - wave);
    const total = baseRedWeight + triangleWeight + circleWeight + pentagonWeight +
                  tankWeight + diamondWeight + enragedWeight + hexagonWeight +
                  disruptorWeight + reflectorWeight + splitterWeight + octagonWeight + phaseWeight;
    let roll = Math.random() * total;

    if (roll < phaseWeight) return 'phase_shifter';
    roll -= phaseWeight;
    if (roll < octagonWeight) return 'crimson_octagon';
    roll -= octagonWeight;
    if (roll < splitterWeight) return 'splitter_cluster';
    roll -= splitterWeight;
    if (roll < reflectorWeight) return 'reflector_prism';
    roll -= reflectorWeight;
    if (roll < disruptorWeight) return 'disruptor_emp';
    roll -= disruptorWeight;
    if (roll < hexagonWeight) return 'gold_hexagon';
    roll -= hexagonWeight;
    if (roll < enragedWeight) return 'enraged_trapezium';
    roll -= enragedWeight;
    if (roll < diamondWeight) return 'emerald_diamond';
    roll -= diamondWeight;
    if (roll < tankWeight) return 'big_square';
    roll -= tankWeight;
    if (roll < pentagonWeight) return 'purple_pentagon';
    roll -= pentagonWeight;
    if (roll < circleWeight) return 'circle';
    roll -= circleWeight;
    if (roll < triangleWeight) return 'orange_triangle';
    return 'red_square';
  }

  private fireEnemyProjectile(enemy: Entity) {
    const playerX = GAME_WIDTH / 2;
    const playerY = GAME_HEIGHT / 2;
    const dx = playerX - enemy.x;
    const dy = playerY - enemy.y;
    const angle = Math.atan2(dy, dx);

    let p = this.enemyProjectilePool.pop();
    if (!p) {
      const graphics = new Graphics();
      // MENACING ENEMY BULLET (Spiky Diamond)
      graphics
        .poly([
          { x: 0, y: -6 },
          { x: 3, y: 0 },
          { x: 0, y: 6 },
          { x: -3, y: 0 },
        ])
        .fill(0xef4444) // Crimson core
        .stroke({ color: 0xffffff, width: 1.0, alpha: 0.8 });
      
      // Evil Glow
      graphics
        .circle(0, 0, 4)
        .fill({ color: 0xef4444, alpha: 0.3 });

      this.renderer.projectileContainer.addChild(graphics);

      p = {
        x: enemy.x,
        y: enemy.y,
        hp: 1,
        maxHp: 1,
        graphics,
        speed: 2.2,
        dps: angle,
        radius: 3,
        rotation: 0,
        angularVelocity: 0,
      };
    } else {
      p.x = enemy.x;
      p.y = enemy.y;
      p.hp = 1;
      p.maxHp = 1;
      p.speed = 2.2;
      p.dps = angle;
      p.graphics.visible = true;
      p.graphics.x = enemy.x;
      p.graphics.y = enemy.y;
    }

    this.enemyProjectiles.push(p);
  }

  private fireEnemyRadialProjectile(x: number, y: number, angle: number, speed: number = 2.2) {
    let p = this.enemyProjectilePool.pop();
    if (!p) {
      const graphics = new Graphics();
      graphics
        .poly([
          { x: 0, y: -6 },
          { x: 3, y: 0 },
          { x: 0, y: 6 },
          { x: -3, y: 0 },
        ])
        .fill(0xf43f5e)
        .stroke({ color: 0xffffff, width: 1.0, alpha: 0.8 });
      graphics.circle(0, 0, 4).fill({ color: 0xf43f5e, alpha: 0.3 });
      this.renderer.projectileContainer.addChild(graphics);

      p = {
        x,
        y,
        hp: 1,
        maxHp: 1,
        graphics,
        speed,
        dps: angle,
        radius: 3,
        rotation: 0,
        angularVelocity: 0,
      };
    } else {
      p.x = x;
      p.y = y;
      p.hp = 1;
      p.maxHp = 1;
      p.speed = speed;
      p.dps = angle;
      p.graphics.visible = true;
      p.graphics.x = x;
      p.graphics.y = y;
    }
    this.enemyProjectiles.push(p);
  }

  private updateEnemyProjectiles(delta: number, onStateUpdate: (state: Partial<GameState>) => void) {
    const playerX = GAME_WIDTH / 2;
    const playerY = GAME_HEIGHT / 2;
    const playerRadius = PHYSICS_CONFIG.playerRadius;
    const playerStats = this.getPlayerCombatStats();

    for (let i = this.enemyProjectiles.length - 1; i >= 0; i--) {
      const p = this.enemyProjectiles[i];
      const angle = p.dps || 0;
      const prevX = p.x;
      const prevY = p.y;
      p.x += Math.cos(angle) * (p.speed || 2.2) * delta;
      p.y += Math.sin(angle) * (p.speed || 2.2) * delta;

      p.graphics.x = p.x;
      p.graphics.y = p.y;

      // ORBITAL PROJECTILE BLOCK: Check collision against player's active rotating orbs
      const orbCount = playerStats.orbitingOrbs;
      if (orbCount > 0) {
        let blockedByOrb = false;
        const orbHitRadius = 14;
        for (let k = 0; k < orbCount; k++) {
          const orbA = this.orbAngle + (k * (Math.PI * 2 / orbCount));
          const ox = playerX + Math.cos(orbA) * 36;
          const oy = playerY + Math.sin(orbA) * 36;
          const odx = p.x - ox;
          const ody = p.y - oy;
          if (odx * odx + ody * ody <= orbHitRadius * orbHitRadius) {
            soundEngine.playOrbitalBlock();
            this.popupManager.spawnText(ox, oy, '⛨ BLOCKED', 0x38bdf8);
            this.spawnDeflection(ox, oy);
            p.graphics.visible = false;
            this.enemyProjectilePool.push(p);
            this.enemyProjectiles.splice(i, 1);
            blockedByOrb = true;
            break;
          }
        }
        if (blockedByOrb) continue;
      }

      // Swept line segment continuous collision detection against player
      const vx = p.x - prevX;
      const vy = p.y - prevY;
      const segLenSq = vx * vx + vy * vy;
      let t = 0;
      if (segLenSq > 0.0001) {
        t = ((playerX - prevX) * vx + (playerY - prevY) * vy) / segLenSq;
        t = Math.max(0, Math.min(1, t));
      }
      const cx = prevX + t * vx;
      const cy = prevY + t * vy;
      const dx = playerX - cx;
      const dy = playerY - cy;
      const distSq = dx * dx + dy * dy;
      const hitRadius = playerRadius + p.radius;

      if (distSq <= hitRadius * hitRadius) {
        // UNO REVERSE CARD: 9% (+3% per level) chance to deflect enemy projectiles
        const unoCard = this.state.cards?.['card_uno_reverse'];
        if (unoCard && unoCard.isEquipped) {
          const deflectChance = 0.09 + (unoCard.level - 1) * 0.03;
          if (Math.random() < deflectChance) {
            this.popupManager.spawnText(p.x, p.y, '↺ DEFLECTED!', 0x38bdf8);
            // Deflect enemy projectile: convert into player projectile flying opposite direction
            p.graphics.visible = false;
            this.enemyProjectilePool.push(p);
            this.enemyProjectiles.splice(i, 1);

            // Spawn player bullet flying outward
            const reverseAngle = (p.dps || 0) + Math.PI + (Math.random() - 0.5) * 0.3;
            let playerP = this.projectilePool.pop();
            if (playerP) {
              playerP.x = cx;
              playerP.y = cy;
              playerP.hp = 1;
              playerP.speed = 6.5;
              playerP.dps = reverseAngle;
              playerP.graphics.visible = true;
              playerP.graphics.x = cx;
              playerP.graphics.y = cy;
              this.projectiles.push(playerP);
            }
            continue;
          }
        }

        if (this.checkQuantumBarrier()) {
          p.graphics.visible = false;
          this.enemyProjectilePool.push(p);
          this.enemyProjectiles.splice(i, 1);
          continue;
        }

        this.registerPlayerHit();

        // PLASMA SHIELD CARD & PLASMA DEFLECTION UPGRADE: chance to block/deflect any hit
        const blockChance = (this.getEquippedCardEffect('plasma_block') || 0) + (playerStats.plasmaBarrierChance || 0);
        if (blockChance > 0 && Math.random() < blockChance) {
          this.popupManager.spawnText(playerX, playerY - 30, '🛡️ DEFLECTED!', 0x38bdf8);
          p.graphics.visible = false;
          this.enemyProjectilePool.push(p);
          this.enemyProjectiles.splice(i, 1);
          continue;
        }

        const rawDps = 2.0;
        const wave = this.state.wave;
        const tier = this.state.tier || 1;
        
        // Accurate scaling for projectiles across all tiers
        const tierDpsMult = Math.pow(1.25 + (tier - 1) * 0.10, tier - 1);
        const waveDpsMult = 1 + (wave - 1) * (0.10 + (tier - 1) * 0.03);
        const finalRawDamage = rawDps * waveDpsMult * tierDpsMult;
        
        const cappedDefPercent = Math.min(0.90, Math.max(0, playerStats.defensePercent || 0));
        const mitigatedDps = finalRawDamage * (1 - cappedDefPercent);
        const minDamageFloor = Math.max(0.5, finalRawDamage * 0.08);
        const netDamage = Math.max(minDamageFloor, Number((mitigatedDps - (playerStats.defenseAbsolute || 0)).toFixed(2)));

        const newHp = Math.max(0, this.state.playerHp - netDamage);
        this.state.playerHp = Number(newHp.toFixed(2));
        
        this.popupManager.spawnPlayerDamage(playerX + (Math.random() - 0.5) * 8, playerY - 16, netDamage);
        soundEngine.playHitPlayer();

        p.graphics.visible = false;
        this.enemyProjectilePool.push(p);
        this.enemyProjectiles.splice(i, 1);

        if (this.state.playerHp <= 0) {
          // DEATH DEFY CARD: 10% (+5% per level) chance to survive lethal
          const defyChance = this.getEquippedCardEffect('death_defy') || 0;
          if (defyChance > 0 && Math.random() < defyChance) {
            this.state.playerHp = 1;
            this.popupManager.spawnText(playerX, playerY - 40, '✨ DEATH DEFIED!', 0xec4899);
            soundEngine.playHeal();
            onStateUpdate({ playerHp: 1 });
            continue;
          }

          if (this.isHandlingDeath) return;
          this.isHandlingDeath = true;
          this.state.isDead = true;
          this.state.playerHp = 0;
          this.state.isWaveActive = false;
          const stateUpdate: Partial<GameState> = {
            playerHp: 0,
            isDead: true,
            isWaveActive: false,
            wave: this.state.wave,
            tier: this.state.tier,
            enemiesRemaining: 0,
            activeBoss: null,
          };
          this.clearAllEntities();
          this.pendingStateUpdate = {};
          onStateUpdate(stateUpdate);
          return;
        } else {
          onStateUpdate({ playerHp: this.state.playerHp });
        }
        continue;
      }

      if (p.x < -50 || p.x > GAME_WIDTH + 50 || p.y < -50 || p.y > GAME_HEIGHT + 50) {
        p.graphics.visible = false;
        this.enemyProjectilePool.push(p);
        this.enemyProjectiles.splice(i, 1);
      }
    }
  }

  private fireProjectile(target: Entity, stats: ReturnType<Simulation['getPlayerCombatStats']>) {
    const playerX = GAME_WIDTH / 2;
    const playerY = GAME_HEIGHT / 2;
    let dx = target.x - playerX;
    let dy = target.y - playerY;
    let baseAngle = Math.atan2(dy, dx);

    // Advanced lead prediction for orbiting circle enemies
    if (target.type === 'circle' && target.isOrbiting && target.orbitAngle !== undefined) {
      const dist = Math.sqrt(dx * dx + dy * dy);
      const bulletSpeed = 5.5;
      const ticksToTarget = dist / bulletSpeed;
      const dir = target.orbitDirection || 1;
      const orbSpd = target.orbitSpeed || 0.014;
      const predictedOrbitAngle = target.orbitAngle + (dir * orbSpd) * ticksToTarget;
      const r = target.orbitRadius || dist;
      const futureX = playerX + Math.cos(predictedOrbitAngle) * r;
      const futureY = playerY + Math.sin(predictedOrbitAngle) * r;
      baseAngle = Math.atan2(futureY - playerY, futureX - playerX);
    }

    const hasDoubleShot = this.state.activeRareDrops?.some(d => d.id === 'double_shot') || (this.state.labResearchLevels?.['lab_skill_double_shot'] || 0) > 0;
    const hasPiercing = this.state.activeRareDrops?.some(d => d.id === 'piercing') || (this.state.labResearchLevels?.['lab_skill_piercing'] || 0) > 0;
    
    const labOctoLvl = this.state.labResearchLevels?.['lab_skill_rapid_fire'] || 0;
    const octoCard = this.state.cards?.['card_skill_rapid_fire'];
    const octoDrop = this.state.activeRareDrops?.find(d => d.id === 'rapid_fire');
    const hasOcto = Boolean(octoDrop || labOctoLvl > 0 || (octoCard && octoCard.isEquipped));
    const hasDecay = this.state.activeRareDrops?.some(d => d.id === 'decaying_plague');
    const hasShrapnel = this.state.activeRareDrops?.some(d => d.id === 'shrapnel_rainfall');
    const hasPoison = Boolean(this.state.activeRareDrops?.some(d => d.id === 'poison') || (this.state.labResearchLevels?.['lab_skill_poison'] || 0) > 0);

    let angles: number[] = [];

    if (hasOcto) {
      // OCTO-STRIKE: 8 radial directions
      for (let i = 0; i < 8; i++) {
        angles.push((i * Math.PI * 2) / 8);
      }
    } else {
      angles = hasDoubleShot ? [baseAngle - 0.12, baseAngle + 0.12] : [baseAngle];
    }

    // ORBITAL TOTEM CARD: 30% (+5% per level) chance to split player projectile into 2
    const totemCard = this.state.cards?.['card_orbital_totem'];
    if (totemCard && totemCard.isEquipped) {
      const totemChance = 0.30 + (totemCard.level - 1) * 0.05;
      if (Math.random() < totemChance) {
        const splitAngles: number[] = [];
        angles.forEach((a) => {
          splitAngles.push(a - 0.15, a + 0.15);
        });
        angles = splitAngles;
      }
    }

    angles.forEach((angle) => {
      const protocol = this.state.fireProtocol || 'standard';
      const finalAngle = protocol === 'gatling' ? (angle + (Math.random() - 0.5) * 0.38) : angle;

      let p = this.projectilePool.pop();
      if (!p) {
        const graphics = new Graphics();
        this.renderer.projectileContainer.addChild(graphics);

        p = {
          x: playerX,
          y: playerY,
          hp: (protocol === 'singularity_vortex' || hasPiercing) ? 99 : 1,
          maxHp: (protocol === 'singularity_vortex' || hasPiercing) ? 99 : 1,
          graphics,
          speed: protocol === 'gatling' ? 8.5 : (protocol === 'calamity_shell' ? 3.2 : (protocol === 'singularity_vortex' ? 2.4 : 5.5)),
          dps: finalAngle,
          radius: protocol === 'calamity_shell' ? 9.0 : (protocol === 'singularity_vortex' ? 12.0 : (protocol === 'gatling' ? 2.0 : 2.5)),
          rotation: finalAngle + Math.PI / 2,
          angularVelocity: 0,
          isPiercing: (protocol === 'singularity_vortex' || hasPiercing),
          bouncesLeft: 0,
          isLightning: false,
          type: protocol,
          lifeMs: protocol === 'singularity_vortex' ? 3500 : undefined,
          isDecayBullet: hasDecay,
          isShrapnelBullet: hasShrapnel && (Math.random() < 0.085),
          hasPoison,
        };
      } else {
        p.x = playerX;
        p.y = playerY;
        p.hp = (protocol === 'singularity_vortex' || hasPiercing) ? 99 : 1;
        p.maxHp = (protocol === 'singularity_vortex' || hasPiercing) ? 99 : 1;
        p.speed = protocol === 'gatling' ? 8.5 : (protocol === 'calamity_shell' ? 3.2 : (protocol === 'singularity_vortex' ? 2.4 : 5.5));
        p.dps = finalAngle;
        p.radius = protocol === 'calamity_shell' ? 9.0 : (protocol === 'singularity_vortex' ? 12.0 : (protocol === 'gatling' ? 2.0 : 2.5));
        p.isPiercing = (protocol === 'singularity_vortex' || hasPiercing);
        p.bouncesLeft = 0;
        p.isLightning = false;
        p.type = protocol;
        p.lifeMs = protocol === 'singularity_vortex' ? 3500 : undefined;
        p.isDecayBullet = hasDecay;
        p.isShrapnelBullet = hasShrapnel && (Math.random() < 0.085);
        p.hasPoison = hasPoison;
        p.graphics.visible = true;
        p.graphics.x = playerX;
        p.graphics.y = playerY;
        p.graphics.rotation = finalAngle + Math.PI / 2;
      }

      // Dynamic Cache-Based Weapon Rendering (to avoid recreating Graphics elements)
      const pProtocol = p.type || 'standard';
      
      // MERGED VISUAL TYPE
      let visualType = pProtocol;
      if (p.isDecayBullet) visualType += '_decay';
      if (p.isShrapnelBullet) visualType += '_shrapnel';
      if (p.hasPoison) visualType += '_poison';

      if (p.drawnType !== visualType) {
        p.graphics.clear();
        p.drawnType = visualType;

        // Base bullet drawing if no specialized overlay dominates
        const isSpecialized = p.isDecayBullet || p.isShrapnelBullet || p.hasPoison;

        // 1. Draw Poison Spray (Bottom layer)
        if (p.hasPoison) {
          for (let i = 0; i < 3; i++) {
            p.graphics
              .circle(0, 5 + i * 4, p.radius * (1.2 - i * 0.3))
              .fill({ color: 0x22c55e, alpha: 0.4 - i * 0.1 });
          }
        }

        // 2. Draw Decay Bullet (Orange Skull Aura)
        if (p.isDecayBullet) {
          p.graphics
            .circle(0, 0, p.radius * 2.2)
            .fill({ color: 0xf97316, alpha: 0.15 })
            .stroke({ color: 0xf97316, width: 1, alpha: 0.3 });
          
          // Simplified Skull
          p.graphics
            .circle(0, -2, p.radius * 1.1) // Head
            .fill(0xf97316)
            .rect(-p.radius * 0.6, p.radius * 0.2, p.radius * 1.2, p.radius * 0.6) // Jaw
            .fill(0xf97316);
          
          // Small eyes
          p.graphics
            .circle(-p.radius * 0.4, -p.radius * 0.4, p.radius * 0.3)
            .fill(0x000000)
            .circle(p.radius * 0.4, -p.radius * 0.4, p.radius * 0.3)
            .fill(0x000000);
        }

        // 3. Draw Shrapnel Bullet (Sharp Glass)
        if (p.isShrapnelBullet) {
          p.graphics
            .moveTo(0, -p.radius * 2)
            .lineTo(p.radius * 1.5, p.radius * 1.5)
            .lineTo(-p.radius * 1.5, p.radius * 1.5)
            .closePath()
            .fill({ color: 0xffffff, alpha: 0.9 })
            .stroke({ color: 0x94a3b8, width: 2 });
        }

        // 4. Default / Mixed Bullet Core
        if (!isSpecialized || (p.isDecayBullet && p.isShrapnelBullet)) {
          if (pProtocol === 'gatling') {
            // HIGH-VELOCITY NEEDLE (Gatling)
            p.graphics
              .moveTo(0, -8)
              .lineTo(1.5, 2)
              .lineTo(-1.5, 2)
              .closePath()
              .fill(0xfacc15) // Amber Core
              .stroke({ color: 0xf59e0b, width: 1 });
            
            // Kinetic energy trail
            p.graphics
              .rect(-0.75, 2, 1.5, 6)
              .fill({ color: 0xfef3c7, alpha: 0.4 });

          } else if (pProtocol === 'calamity_shell') {
            // HEAVY EXPLOSIVE CANISTER (Calamity)
            p.graphics
              .roundRect(-5, -10, 10, 20, 3)
              .fill(0x7e22ce) // Purple Heavy Metal
              .stroke({ color: 0xea580c, width: 2 });
            
            // Molten Core Glow
            p.graphics
              .circle(0, 0, 4)
              .fill(0xf97316);
            
            // Spiky fins
            p.graphics
              .poly([{ x: -5, y: 5 }, { x: -9, y: 12 }, { x: -5, y: 10 }])
              .fill(0xef4444)
              .poly([{ x: 5, y: 5 }, { x: 9, y: 12 }, { x: 5, y: 10 }])
              .fill(0xef4444);

          } else if (pProtocol === 'singularity_vortex') {
            // EVENT HORIZON (Singularity)
            // Outer distortion ring
            p.graphics
              .circle(0, 0, 14)
              .fill({ color: 0xec4899, alpha: 0.1 });
            
            // Accretion disk
            p.graphics
              .circle(0, 0, 11)
              .stroke({ color: 0xa855f7, width: 3, alpha: 0.8 });
            
            // The Singularity (Black Center)
            p.graphics
              .circle(0, 0, 7)
              .fill(0x000000)
              .stroke({ color: 0xffffff, width: 0.5, alpha: 0.4 });

          } else if (pProtocol === 'calamity_bomblet') {
            // VOLATILE EMBER (Bomblet)
            p.graphics
              .circle(0, 0, 5)
              .fill(0xea580c)
              .stroke({ color: 0xfacc15, width: 1.5 });
            
            p.graphics
              .circle(0, 0, 2)
              .fill(0xffffff);

          } else {
            // REMASTERED BASIC " - " DASH BULLET (Clean, crisp, sleek laser tracer dash)
            const dashColor = hasPiercing ? 0x22d3ee : 0x38bdf8;

            // Outer razor-sharp laser dash (8.5px length, 2.0px width)
            p.graphics
              .roundRect(-1.0, -4.25, 2.0, 8.5, 0.75)
              .fill(dashColor);

            // Inner high-visibility core dash line
            p.graphics
              .roundRect(-0.5, -3.25, 1.0, 6.5, 0.5)
              .fill(0xffffff);
          }
        }
      }

      this.projectiles.push(p);

      // ROCKETS SKILL (7% chance on standard projectile launch)
      const rocketsDrop = this.state.activeRareDrops?.find(d => d.id === 'rockets');
      const labRocketsLvl = this.state.labResearchLevels?.['lab_skill_rockets'] || 0;
      const rocketsCard = this.state.cards?.['card_skill_rockets'];
      const hasRockets = Boolean(rocketsDrop || labRocketsLvl > 0 || (rocketsCard && rocketsCard.isEquipped));
      if (hasRockets && Math.random() < 0.07) {
        const rMult = rocketsDrop ? rocketsDrop.effectMultiplier : (1 + labRocketsLvl * 0.20 + (rocketsCard && rocketsCard.isEquipped ? (rocketsCard.level - 1) * 0.15 : 0));
        this.launchRocketsBarrage(finalAngle, stats.damage * (1.8 * rMult));
      }
    });

    this.playerAngularVelocity += (Math.random() - 0.5) * 0.05;

    // Trigger domain-appropriate audio triggers
    const protocol = this.state.fireProtocol || 'standard';
    if (protocol === 'gatling') {
      if (this.plasmaBeamSoundTimer <= 0) {
        this.plasmaBeamSoundTimer = 65;
        soundEngine.playZap();
      }
    } else if (protocol === 'calamity_shell') {
      soundEngine.playRocketLaunch();
    } else if (protocol === 'singularity_vortex') {
      soundEngine.playRocketLaunch();
    } else if (protocol !== 'plasma_beam') {
      // Custom Ailment Sound Overrides
      if (hasDecay) {
        soundEngine.playDecayShoot();
      } else if (hasShrapnel) {
        soundEngine.playShrapnelShoot();
      } else if (hasPoison) {
        soundEngine.playPoisonShoot();
      } else {
        soundEngine.playShoot();
      }
    }
  }

  private updateEnemies(delta: number, currentTime: number, isIdle: boolean, onStateUpdate: (state: Partial<GameState>) => void) {
    const playerX = GAME_WIDTH / 2;
    const playerY = GAME_HEIGHT / 2;
    const playerRadius = PHYSICS_CONFIG.playerRadius;
    const playerStats = this.getPlayerCombatStats();

    // 1. Move toward fortress center / orbit
    for (let i = 0; i < this.enemies.length; i++) {
      const enemy = this.enemies[i];

      // Handle stun timer decrement and freeze movement/rotation
      if (enemy.stunTimer !== undefined && enemy.stunTimer > 0) {
        enemy.stunTimer -= delta * 16.666;
        enemy.angularVelocity = 0;
        continue;
      }

      const dx = playerX - enemy.x;
      const dy = playerY - enemy.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (enemy.isAllied) {
        // TURNED FRIENDLY MINION AI: hunt closest non-allied enemy & decay lifetime (max 15s)
        enemy.alliedTimer = (enemy.alliedTimer ?? 15) - delta * 0.0166;
        if (enemy.alliedTimer <= 0) {
          enemy.hp = 0;
        }

        let nearestTarget: Entity | null = null;
        let nearestDist = 999999;
        for (let j = 0; j < this.enemies.length; j++) {
          const other = this.enemies[j];
          if (other !== enemy && !other.isAllied && other.hp > 0) {
            const tdx = other.x - enemy.x;
            const tdy = other.y - enemy.y;
            const tdist = tdx * tdx + tdy * tdy;
            if (tdist < nearestDist) {
              nearestDist = tdist;
              nearestTarget = other;
            }
          }
        }

        if (nearestTarget) {
          const tdx = nearestTarget.x - enemy.x;
          const tdy = nearestTarget.y - enemy.y;
          const tdist = Math.sqrt(tdx * tdx + tdy * tdy);
          const minHit = enemy.radius + nearestTarget.radius + 2;
          if (tdist > minHit) {
            enemy.x += (tdx / tdist) * (enemy.speed || 1) * 1.8 * delta;
            enemy.y += (tdy / tdist) * (enemy.speed || 1) * 1.8 * delta;
          } else {
            // Melee contact damage
            const dps = enemy.maxHp * 0.45 * delta * 0.05;
            nearestTarget.hp -= dps;
            enemy.hp -= nearestTarget.maxHp * 0.15 * delta * 0.05;
            if (Math.random() < 0.15) {
              this.popupManager.spawnDamage(nearestTarget.x, nearestTarget.y, dps, false, 1.0);
            }
          }
        } else {
          // Orbit around player
          enemy.orbitAngle = (enemy.orbitAngle || 0) + 0.015 * delta;
          enemy.x = playerX + Math.cos(enemy.orbitAngle) * (playerRadius + 60);
          enemy.y = playerY + Math.sin(enemy.orbitAngle) * (playerRadius + 60);
        }
        continue;
      }

      if (enemy.type === 'circle') {
        // FULL REWORK: Orbit radius dynamically anchored inside player weapon attack range
        // Seamlessly adapts when the player upgrades weapon attack range!
        const playerAttackRadius = playerStats.attackRadius || ATTACK_RADIUS_CONFIG.default;
        const maxAllowedOrbit = Math.max(playerRadius + 42, playerAttackRadius - 22);
        const dynamicBaseOrbit = Math.max(playerRadius + 42, Math.min(playerAttackRadius * 0.72, maxAllowedOrbit));

        // Progressive continuous inward spiral over time (down to player fortress clearance ring)
        (enemy as any).spiralInwardOffset = Math.min(
          dynamicBaseOrbit - (playerRadius + 28),
          ((enemy as any).spiralInwardOffset || 0) + 0.03 * delta
        );
        const effectiveOrbitRadius = Math.max(playerRadius + 28, dynamicBaseOrbit - (enemy as any).spiralInwardOffset);

        const myShootRange = Math.max(effectiveOrbitRadius + 40, 180);
        const myCooldown = enemy.shootCooldownMs || 1600;
        const myDirection = enemy.orbitDirection || 1;
        const myOrbitSpeed = enemy.orbitSpeed || 0.014;

        // 1. Independent Shooting Behavior (fires whenever in range)
        if (dist <= myShootRange) {
          const lastShot = enemy.lastEnemyShotTime;
          if (lastShot === undefined) {
            // Initial lock-on delay (450ms) as shooter enters engagement range
            enemy.lastEnemyShotTime = currentTime - myCooldown + 450;
          } else if (currentTime - lastShot >= myCooldown) {
            enemy.lastEnemyShotTime = currentTime;
            this.fireEnemyProjectile(enemy);
          }
        }

        // 2. Dynamic Orbiting Movement & Inward Spiral Positioning
        if (!enemy.isOrbiting && dist <= effectiveOrbitRadius + 15) {
          enemy.isOrbiting = true;
          enemy.orbitAngle = Math.atan2(enemy.y - playerY, enemy.x - playerX);
        }

        if (enemy.isOrbiting) {
          if (enemy.orbitAngle === undefined) {
            enemy.orbitAngle = Math.atan2(enemy.y - playerY, enemy.x - playerX);
          }
          enemy.orbitAngle += myDirection * myOrbitSpeed * delta;

          // Smooth radial easing towards dynamically shrinking orbit distance
          const smoothR = dist + (effectiveOrbitRadius - dist) * Math.min(1, 0.08 * delta);
          enemy.x = playerX + Math.cos(enemy.orbitAngle) * smoothR;
          enemy.y = playerY + Math.sin(enemy.orbitAngle) * smoothR;
          enemy.rotation = enemy.orbitAngle + Math.PI; // Face fortress center
        } else {
          // Approach towards standoff orbit distance
          if (dist > effectiveOrbitRadius) {
            enemy.x += (dx / dist) * (enemy.speed || 1.1) * delta;
            enemy.y += (dy / dist) * (enemy.speed || 1.1) * delta;
            enemy.rotation = Math.atan2(-dy, -dx);
          }
        }
      } else if (enemy.type === 'purple_pentagon') {
        // Void Weaver: Teleport Blink burst forward every 2.8s
        enemy.blinkTimerMs = (enemy.blinkTimerMs ?? 2800) - delta * 16.66;
        if (enemy.blinkTimerMs <= 0) {
          enemy.blinkTimerMs = 2600 + Math.random() * 800;
          if (dist > playerRadius + enemy.radius + 20) {
            enemy.x += (dx / dist) * 48;
            enemy.y += (dy / dist) * 48;
            this.spawnExplosion(enemy.x, enemy.y, 20, 0xa855f7);
            this.popupManager.spawnText(enemy.x, enemy.y - 12, '🌀 BLINK', 0xc084fc);
          }
        }
        if (dist > playerRadius + enemy.radius) {
          enemy.x += (dx / dist) * (enemy.speed || 1.0) * delta;
          enemy.y += (dy / dist) * (enemy.speed || 1.0) * delta;
        }
      } else if (enemy.type === 'emerald_diamond') {
        // Emerald Diamond Rusher: Moves at high speed in a sine wave zig-zag
        if (dist > playerRadius + enemy.radius) {
          const perpX = -dy / dist;
          const perpY = dx / dist;
          const zigzag = Math.sin(currentTime * 0.009 + enemy.x * 0.1) * 2.2 * delta;
          enemy.x += (dx / dist) * (enemy.speed || 2.2) * delta + perpX * zigzag;
          enemy.y += (dy / dist) * (enemy.speed || 2.2) * delta + perpY * zigzag;
        }
      } else if (enemy.type === 'gold_hexagon') {
        // Bastion Commander: Protects nearby shape allies within 120px
        if (dist > playerRadius + enemy.radius) {
          enemy.x += (dx / dist) * (enemy.speed || 0.7) * delta;
          enemy.y += (dy / dist) * (enemy.speed || 0.7) * delta;
        }
        this.spatialGrid.queryRadius(enemy.x, enemy.y, 120, (near) => {
          if (near !== enemy && !near.isAllied && near.hp > 0) {
            near.hasShieldAura = true;
          }
        });
      } else if (enemy.type === 'phase_shifter') {
        // Quantum Phase Shifter: Periodically enters intangibility phase every 3.5s
        enemy.phaseTimerMs = (enemy.phaseTimerMs ?? 3500) - delta * 16.666;
        if (enemy.phaseTimerMs <= 0) {
          if (!enemy.isPhased) {
            enemy.isPhased = true;
            enemy.phaseTimerMs = 1500; // Intangible for 1.5s
            enemy.graphics.alpha = 0.35;
            this.popupManager.spawnText(enemy.x, enemy.y - 12, '🟣 PHASING', 0xa855f7);
          } else {
            enemy.isPhased = false;
            enemy.phaseTimerMs = 3500;
            enemy.graphics.alpha = 1.0;
            this.popupManager.spawnText(enemy.x, enemy.y - 12, '🟣 MATERIALIZED', 0xa855f7);
          }
        }
        if (dist > playerRadius + enemy.radius) {
          enemy.x += (dx / dist) * (enemy.speed || 0.95) * delta;
          enemy.y += (dy / dist) * (enemy.speed || 0.95) * delta;
        }
      } else if (enemy.type === 'boss') {
        // UNIQUE BOSS BEHAVIORS & ESCALATING ATTACKS
        const arch = (enemy as any).bossArchetype || getBossArchetype(this.state.wave);

        if (dist > playerRadius + enemy.radius) {
          enemy.x += (dx / dist) * (enemy.speed || 0.45) * delta;
          enemy.y += (dy / dist) * (enemy.speed || 0.45) * delta;
          enemy.rotation += 0.015 * delta;
        }

        // Signature Boss Abilities
        (enemy as any).bossAbilityTimer = ((enemy as any).bossAbilityTimer || 0) + delta * 16.666;

        if (arch.id === 'pulsar_star' && (enemy as any).bossAbilityTimer >= 3600) {
          (enemy as any).bossAbilityTimer = 0;
          this.popupManager.spawnText(enemy.x, enemy.y - 20, '⭐ PULSAR RING!', 0xf43f5e);
          soundEngine.playCrit();
          for (let pIdx = 0; pIdx < 8; pIdx++) {
            const angle = (pIdx / 8) * Math.PI * 2;
            this.fireEnemyRadialProjectile(enemy.x, enemy.y, angle, 1.8);
          }
        } else if (arch.id === 'hyper_tesseract' && (enemy as any).bossAbilityTimer >= 4000) {
          (enemy as any).bossAbilityTimer = 0;
          if (dist > playerRadius + enemy.radius + 35) {
            enemy.x += (dx / dist) * 35;
            enemy.y += (dy / dist) * 35;
            this.spawnExplosion(enemy.x, enemy.y, 24, 0x8b5cf6);
            this.popupManager.spawnText(enemy.x, enemy.y - 20, '🌀 VOID LEAP!', 0xa855f7);
            soundEngine.playZap();
            // Spiral dart
            const aimAngle = Math.atan2(playerY - enemy.y, playerX - enemy.x);
            this.fireEnemyRadialProjectile(enemy.x, enemy.y, aimAngle, 2.5);
          }
        } else if (arch.id === 'prism_colossus' && (enemy as any).bossAbilityTimer >= 3800) {
          (enemy as any).bossAbilityTimer = 0;
          this.popupManager.spawnText(enemy.x, enemy.y - 20, '💎 PRISM DARTS!', 0x06b6d4);
          const aimAngle = Math.atan2(playerY - enemy.y, playerX - enemy.x);
          this.fireEnemyRadialProjectile(enemy.x, enemy.y, aimAngle - 0.28, 2.2);
          this.fireEnemyRadialProjectile(enemy.x, enemy.y, aimAngle + 0.28, 2.2);
        } else if (arch.id === 'vortex_hexagon' && (enemy as any).bossAbilityTimer >= 4200) {
          (enemy as any).bossAbilityTimer = 0;
          this.popupManager.spawnText(enemy.x, enemy.y - 20, '🌀 GRAVITON PULSE!', 0xa855f7);
          soundEngine.playOrbitalBlock();
          for (let mIdx = 0; mIdx < this.enemies.length; mIdx++) {
            const other = this.enemies[mIdx];
            if (other !== enemy && other.hp > 0 && !other.isAllied) {
              const odx = playerX - other.x;
              const ody = playerY - other.y;
              const odist = Math.hypot(odx, ody);
              if (odist > 50) {
                other.x += (odx / odist) * 14;
                other.y += (ody / odist) * 14;
              }
            }
          }
        }
      } else {
        if (dist > playerRadius + enemy.radius) {
          enemy.x += (dx / dist) * (enemy.speed || 1) * delta;
          enemy.y += (dy / dist) * (enemy.speed || 1) * delta;
        }
      }
    }

    // 2. High-performance Separation & rotation
    const enemyCount = this.enemies.length;
    for (let i = 0; i < enemyCount; i++) {
      const eA = this.enemies[i];
      if (eA.isOrbiting) continue;
      let neighborsChecked = 0;
      for (let j = i + 1; j < enemyCount; j++) {
        const eB = this.enemies[j];
        if (eB.isOrbiting) continue;
        const dx = eB.x - eA.x;
        const dy = eB.y - eA.y;
        const minDist = eA.radius + eB.radius;
        // Fast AABB rejection before multiplication
        if (Math.abs(dx) >= minDist || Math.abs(dy) >= minDist) continue;
        const distSq = dx * dx + dy * dy;

        if (distSq < minDist * minDist && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = (minDist - dist) * PHYSICS_CONFIG.separationStrength;

          eA.x -= nx * overlap * 0.5;
          eA.y -= ny * overlap * 0.5;
          eB.x += nx * overlap * 0.5;
          eB.y += ny * overlap * 0.5;

          neighborsChecked++;
          if (neighborsChecked >= 6) break; // Capped per-frame impulse resolution for smooth 120+ FPS
        }
      }
    }

    // 3. Update rotations & handle enemy defeat
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];

      enemy.rotation += enemy.angularVelocity * delta;
      enemy.angularVelocity *= Math.pow(PHYSICS_CONFIG.angularDamping, delta);
      
      // Handle Ailments (Poison, Decay, Bleed)
      const dMs = delta * 16.666;
      if (enemy.poisonTimer && enemy.poisonTimer > 0) {
        if (enemy.resistantAilment === 'poison') {
          enemy.poisonTimer = 0;
        } else {
          enemy.poisonTimer -= dMs;
          const poisonDmg = (enemy.maxHp * 0.05 * (this.state.gameSpeed !== undefined ? this.state.gameSpeed : 1)) * (dMs / 1000);
          enemy.hp -= poisonDmg;
        }
      }

      if (enemy.decayStacks && enemy.decayStacks > 0) {
        if (enemy.resistantAilment === 'decay') {
          enemy.decayStacks = 0;
        } else {
          enemy.decayTimer = (enemy.decayTimer || 0) + dMs;
          const decayDmg = (enemy.maxHp * 0.02 * enemy.decayStacks) * (dMs / 1000);
          enemy.hp -= decayDmg;
          
          if (enemy.decayTimer > 1500) {
            enemy.decayTimer = 0;
            let spreadCount = 0;
            this.spatialGrid.queryRadius(enemy.x, enemy.y, 90, (other) => {
              if (other !== enemy && other.hp > 0 && !other.isAllied && spreadCount < 3 && !other.decayStacks && other.resistantAilment !== 'decay') {
                other.decayStacks = enemy.decayStacks;
                other.decayTimer = 0;
                spreadCount++;
                // Spread visual
                this.activeLightningArcs.push({
                  x1: enemy.x, y1: enemy.y,
                  x2: other.x, y2: other.y,
                  alpha: 0.8,
                  color: 0xf97316,
                  lifeMs: 400,
                  maxLifeMs: 400
                });
              }
            });
          }
        }
      }

      if (enemy.bleedTimer && enemy.bleedTimer > 0) {
        if (enemy.resistantAilment === 'bleed') {
          enemy.bleedTimer = 0;
        } else {
          enemy.bleedTimer -= dMs;
          enemy.bleedFrame = ((enemy.bleedFrame || 0) + 1) % 5;
          const bleedDmg = (enemy.maxHp * 0.03) * (dMs / 1000);
          enemy.hp -= bleedDmg;
        }
      }

      enemy.graphics.x = enemy.x;
      enemy.graphics.y = enemy.y;
      enemy.graphics.rotation = enemy.rotation;

      if (enemy.hp <= 0) {
        // FRIENDLY FIRE CARD: 7.5% (+2.5% per level) chance to turn killed shape into allied minion (max 6 active)
        if (!enemy.isAllied && enemy.type !== 'boss') {
          const ffCard = this.state.cards?.['card_friendly_fire'];
          if (ffCard && ffCard.isEquipped) {
            const activeAllies = this.enemies.filter(e => e.isAllied && e.hp > 0).length;
            if (activeAllies < 6) {
              const convertChance = 0.075 + (ffCard.level - 1) * 0.025;
              if (Math.random() < convertChance) {
                enemy.isAllied = true;
                enemy.alliedTimer = 15;
                enemy.hp = enemy.maxHp;
                enemy.graphics.tint = 0x22c55e;
                this.popupManager.spawnText(enemy.x, enemy.y, '💀 TURNED!', 0x22c55e);
                soundEngine.playTechUnlock();
                continue;
              }
            }
          }
        }

        // On-Death Special Mechanics
        if (enemy.type === 'crimson_octagon' && !enemy.isAllied) {
          this.popupManager.spawnText(enemy.x, enemy.y, '💥 SPLIT!', 0xef4444);
          this.createEnemyEntity(enemy.x + 10, enemy.y + 10, 'orange_triangle', this.state.wave, this.state.tier);
          this.createEnemyEntity(enemy.x - 10, enemy.y - 10, 'orange_triangle', this.state.wave, this.state.tier);
        } else if (enemy.type === 'splitter_cluster' && !enemy.isAllied) {
          // Mitosis split into 2-3 cluster minis
          this.popupManager.spawnText(enemy.x, enemy.y, '🟢 MITOSIS!', 0x10b981);
          this.spawnExplosion(enemy.x, enemy.y, 25, 0x10b981);
          const miniCount = Math.random() < 0.5 ? 2 : 3;
          for (let m = 0; m < miniCount; m++) {
            const angle = (m * Math.PI * 2) / miniCount;
            const offsetX = Math.cos(angle) * 12;
            const offsetY = Math.sin(angle) * 12;
            this.createEnemyEntity(enemy.x + offsetX, enemy.y + offsetY, 'cluster_mini', this.state.wave, this.state.tier);
          }
        } else if (enemy.type === 'disruptor_emp' && !enemy.isAllied) {
          // EMP Overload Discharge: Slows all surrounding enemies by 20% for 2.5s
          this.popupManager.spawnText(enemy.x, enemy.y, '⚡ EMP DISCHARGE!', 0x06b6d4);
          this.spawnExplosion(enemy.x, enemy.y, 45, 0x06b6d4);
          this.spatialGrid.queryRadius(enemy.x, enemy.y, 140, (other) => {
            if (other !== enemy && other.hp > 0 && !other.isAllied) {
              other.speed = Math.max(0.35, (other.speed || 1) * 0.8);
            }
          });
        }

        // Golden Shape Rewards
        if (enemy.isGolden) {
          const isBossShape = enemy.type === 'boss';
          const gemsGained = isBossShape ? Math.floor(Math.random() * 26) + 25 : Math.floor(Math.random() * 6) + 3;
          const shardsGained = isBossShape ? 100 : Math.floor(Math.random() * 21) + 15;
          
          this.state.gems = (this.state.gems || 0) + gemsGained;
          this.state.cosmicShards = (this.state.cosmicShards || 0) + shardsGained;
          this.lastSyncedShards = this.state.cosmicShards;

          const isLabUnlocked = Boolean(this.state.unlockedSystems?.labs || (this.state.highestWaveEver || 0) >= 30);
          if (isLabUnlocked) {
            const cellsGained = isBossShape ? 3 : 1;
            this.state.cells = (this.state.cells || 0) + cellsGained;
            this.lastSyncedCells = this.state.cells;
          }
          
          this.popupManager.spawnText(enemy.x, enemy.y - 20, '✨👑 GOLDEN BOUNTY! ✨', 0xfacc15);
          this.popupManager.spawnText(enemy.x, enemy.y - 32, `💎 +${gemsGained} GEMS! 💫 +${shardsGained} SHARDS`, 0x38bdf8);
          soundEngine.playLevelUp();
        }

        enemy.graphics.visible = false;
        enemy.graphics.tint = 0xffffff;
        let pool = this.enemyPools.get(enemy.type);
        if (!pool) {
          pool = [];
          this.enemyPools.set(enemy.type, pool);
        }
        pool.push(enemy);
        this.enemies.splice(i, 1);
        this.enemiesDefeatedInRun++;
        this.waveEnemiesDefeated++;

        // REBALANCED PROGRESSION CURRENCY GAIN SYSTEM:
        // Calibrated with four-stage progression to hit framework playtesting targets:
        // Target: Wave 25 = ~1k cumulative cash, Wave 50 = ~10k cumulative cash, Wave 100 = ~100k+ cumulative cash
        const isBoss = enemy.type === 'boss';
        const wave = this.state.wave || 1;

        // Stage-based enemy kill bounties
        let waveDropScale = 1.0;
        if (wave <= 25) {
          // Stage 1 (Waves 1-25): $1 per kill early, smoothly scaling
          waveDropScale = 0.58 + (wave - 1) * 0.030;
        } else if (wave <= 50) {
          // Stage 2 (Waves 26-50): Escalating from ~$2 to ~$8 per kill
          waveDropScale = 1.30 + (wave - 25) * 0.25;
        } else {
          // Stage 3 & 4 (Waves 51+): Scaling into deep sectors ~$10 to ~$45+ per kill
          waveDropScale = 7.55 + (wave - 50) * 0.68;
        }

        const tierRanges: Record<string, { min: number; max: number }> = {
          red_square: { min: 1, max: 1 },
          orange_triangle: { min: 1, max: 2 },
          circle: { min: 1, max: 2 },
          purple_pentagon: { min: 2, max: 3 },
          emerald_diamond: { min: 2, max: 3 },
          big_square: { min: 3, max: 4 },
          enraged_trapezium: { min: 2, max: 4 },
          gold_hexagon: { min: 3, max: 5 },
          disruptor_emp: { min: 3, max: 5 },
          reflector_prism: { min: 4, max: 6 },
          splitter_cluster: { min: 4, max: 6 },
          cluster_mini: { min: 1, max: 1 },
          crimson_octagon: { min: 5, max: 8 },
          phase_shifter: { min: 4, max: 7 },
          boss: {
            min: Math.max(10, Math.round(10 + wave * 0.9)),
            max: Math.max(16, Math.round(16 + wave * 1.3)),
          },
        };
        const range = tierRanges[enemy.type] || tierRanges.red_square;
        const rawBaseCash = Math.round((Math.floor(Math.random() * (range.max - range.min + 1)) + range.min) * waveDropScale);

        const levelMultiplier = 1.0;
        const tierCashMultiplier = getTierCashMultiplier(this.state.tier || 1);
        const globalMultiplier = 1.0;

        const cashBonusUpgObj = this.upgrades.find(u => u.id === 'cash_bonus');
        const cashBonusUpg = 1 + (cashBonusUpgObj?.level || 0) * (cashBonusUpgObj?.increment || 0.05);
        const permCashMult = 1 + (this.state.workshopUpgrades?.['perm_cash_mult'] || 0) * 0.08;
        
        const enemyBalanceVal = this.getEquippedCardEffect('enemy_balance');
        const cardCashMult = enemyBalanceVal !== null ? (1 + enemyBalanceVal) : 1.0;
        
        // SCROUNGER PROTOCOL CARD: +15% (+10% per level) Cash
        const scroungerMult = 1 + (this.getEquippedCardEffect('scrounger_mult') || 0);

        // COSMIC LINK CARD: +10% (+5% per level) Cash & Shards
        const linkMult = 1 + (this.getEquippedCardEffect('link_multiplier') || 0);

        // GOLD BOT & CASH BONUS CARDS:
        const goldBotMult = 1 + (this.getEquippedCardEffect('gold_bot') || 0);
        const genericCashMult = 1 + (this.getEquippedCardEffect('cash') || 0);

        let calculatedCash = rawBaseCash * levelMultiplier * tierCashMultiplier * globalMultiplier * cashBonusUpg * permCashMult * cardCashMult * scroungerMult * linkMult * goldBotMult * genericCashMult;

        // Golden enemies drop 3x Cash
        if (enemy.isGolden) {
          calculatedCash *= 3.0;
        }

        // Critical drop: 5% chance to award 1.5x cash drop
        const isCritDrop = Math.random() < 0.05;
        if (isCritDrop) {
          calculatedCash *= 1.5;
        }

        const totalCash = Math.max(1, Math.round(calculatedCash));
        this.cashEarnedInRun += totalCash;

        const totalCardMult = cardCashMult * scroungerMult * linkMult * goldBotMult * genericCashMult;
        const cashBonusLabel = totalCardMult > 1.1 ? 'BONUS' : '';

        const cashPopup = this.popupManager.spawnCash(enemy.x, enemy.y, totalCash, isCritDrop, this.state.settings?.useLegacyCurrencyFormat, cashBonusLabel);
        this.state.cash = (this.state.cash || 0) + totalCash;
        this.lastSyncedCash = this.state.cash;

        // PERMANENT COSMIC SHARDS DROP:
        const shardYieldUpg = 1 + (this.upgrades.find(u => u.id === 'shards_per_kill')?.level || 0) * 0.05;
        const permShardYield = 1 + (this.state.workshopUpgrades?.['perm_shards_yield'] || 0) * 0.15;
        const cardShardYield = 1 + (this.getEquippedCardEffect('shards') || 0);
        const shardBotMult = 1 + (this.getEquippedCardEffect('shard_bot') || 0);
        const enemyBalanceShardMult = enemyBalanceVal !== null ? (1 + enemyBalanceVal) : 1.0;
        const finalShardYieldMult = permShardYield * cardShardYield * linkMult * shardBotMult * enemyBalanceShardMult;
        
        // Rare drop chance for cosmic shards (especially bosses or wave 50+)
        if (isBoss || (this.state.wave >= 50 && Math.random() < 0.08)) {
          const shardsGained = Math.round((isBoss ? 2 : 1) * shardYieldUpg * finalShardYieldMult);
          const shardBonusLabel = finalShardYieldMult > 1.1 ? 'BONUS' : '';
          const shardPopup = this.popupManager.spawnShard(enemy.x, enemy.y, shardsGained, shardBonusLabel);
          this.state.cosmicShards = (this.state.cosmicShards || 0) + shardsGained;
          this.lastSyncedShards = this.state.cosmicShards;
        }

        // BIO CELL FUEL (🧪) DROP SYSTEM:
        // Gatekept behind Lab unlock (Wave 30+ or unlockedSystems.labs).
        // Killing bosses and rare enemies awards a minimal amount of Bio Cell Fuel to remain balanced.
        const isLabUnlockedForDrop = Boolean(this.state.unlockedSystems?.labs || (this.state.highestWaveEver || 0) >= 30);
        if (isLabUnlockedForDrop) {
          const RARE_ENEMY_TYPES = new Set([
            'purple_pentagon',
            'gold_hexagon',
            'emerald_diamond',
            'crimson_octagon',
            'enraged_trapezium',
            'disruptor_emp',
            'reflector_prism',
            'splitter_cluster',
            'phase_shifter',
            'big_square',
          ]);
          const isGoldenEnemy = Boolean(enemy.isGolden);
          const isRareEnemy = isGoldenEnemy || RARE_ENEMY_TYPES.has(enemy.type);

          let cellsGained = 0;
          if (isBoss) {
            // Bosses award 1 cell (or 2 if golden/lucky)
            let baseCells = isGoldenEnemy ? (Math.random() < 0.5 ? 3 : 2) : (Math.random() < 0.25 ? 2 : 1);
            const permCellBonus = (this.state.workshopUpgrades?.['perm_cell_extractor'] || 0) * 0.10;
            const labCellBonus = (this.state.labResearchLevels?.['lab_boss_cell_yield'] || 0) * 0.15;
            if (Math.random() < (permCellBonus + labCellBonus)) {
              baseCells += 1;
            }
            cellsGained = baseCells;
          } else if (isGoldenEnemy) {
            // Golden non-boss enemies award 1 cell
            cellsGained = 1;
          } else if (isRareEnemy) {
            // Rare enemies have a 30% chance to drop 1 cell (minimal gain)
            if (Math.random() < 0.30) {
              cellsGained = 1;
            }
          }

          if (cellsGained > 0) {
            this.state.cells = (this.state.cells || 0) + cellsGained;
            this.lastSyncedCells = this.state.cells;
            this.popupManager.spawnText(
              enemy.x,
              enemy.y - 28,
              `🧪 +${cellsGained} CELL${cellsGained > 1 ? 'S' : ''}`,
              0x14b8a6
            );
          }
        }

        // BOSS RARE DROP & SYNERGY CARD ROLL:
        if (isBoss) {
          const dropRoll = rollBossRareDrop(this.state.wave);
          if (dropRoll && this.onRareDropAcquired) {
            this.onRareDropAcquired(dropRoll.item, dropRoll.dropType);
          }

          // Clear any lingering non-allied foes so sector ends cleanly
          for (let k = this.enemies.length - 1; k >= 0; k--) {
            const foe = this.enemies[k];
            if (!foe.isAllied) {
              foe.graphics.visible = false;
              let pool = this.enemyPools.get(foe.type);
              if (!pool) {
                pool = [];
                this.enemyPools.set(foe.type, pool);
              }
              pool.push(foe);
              this.enemies.splice(k, 1);
            }
          }

          // Force wave to end immediately upon boss defeat!
          this.completeWave(onStateUpdate, true);
          return; // Stop processing further enemies/skills on this frame as wave state has been reset!
        }

        // LIGHTNING CHAIN SKILL (Active Drop or Lab Protocol):
        const chainDrop = this.state.activeRareDrops?.find(d => d.id === 'lightning_chain');
        const labLightningLvl = this.state.labResearchLevels?.['lab_skill_lightning'] || 0;
        const poisonDropOnKill = this.state.activeRareDrops?.find(d => d.id === 'poison');
        const labPoisonOnKill = this.state.labResearchLevels?.['lab_skill_poison'] || 0;
        const hasPoisonOnKill = Boolean(poisonDropOnKill || labPoisonOnKill > 0);

        if (chainDrop || labLightningLvl > 0) {
          const mult = chainDrop ? chainDrop.effectMultiplier : (1.0 + labLightningLvl * 0.15);
          let targets = 0;
          this.spatialGrid.queryRadius(enemy.x, enemy.y, 140, (other) => {
            if (other !== enemy && targets < 3 && other.hp > 0 && !other.isAllied) {
              const chainDmg = Math.max(1, Math.round((enemy.maxHp * 0.25) * mult));
              other.hp -= chainDmg;
              this.popupManager.spawnDamage(other.x, other.y, chainDmg, false, 1.0);
              this.spawnLightningZap(enemy.x, enemy.y, other.x, other.y, 0x00f5ff);
              soundEngine.playZap();

              // Toxic Conduction synergy (Lightning transfers poison)
              if (hasPoisonOnKill) {
                other.poisonTimer = 10000;
                other.poisonDps = Math.max(1, Math.round(other.maxHp * 0.05));
                this.popupManager.spawnText(other.x, other.y - 12, '☣️ TOXIC CONDUCTION!', 0x10b981);
              }

              targets++;
              if (targets >= 3) return true;
            }
          });
        }

        // Update missions progress
        this.updateKillMissions(isBoss, totalCash, onStateUpdate);

        if (!cashPopup) {
          onStateUpdate({
            cash: this.state.cash,
            cosmicShards: this.state.cosmicShards,
          });
        }
      }
    }

    // 4. Player Pentagon rotation
    this.playerRotation += this.playerAngularVelocity * delta;
    this.playerAngularVelocity *= Math.pow(PHYSICS_CONFIG.playerAngularDamping, delta);
    this.playerRotation += (0 - this.playerRotation) * 0.08 * delta;

    const idleWobble = isIdle ? Math.sin(currentTime * 0.003) * 0.05 : 0;
    this.renderer.playerGraphics.rotation = this.playerRotation + idleWobble;
  }

  private updateProjectiles(delta: number, stats: ReturnType<Simulation['getPlayerCombatStats']>, onStateUpdate: (state: Partial<GameState>) => void) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const angle = p.dps || 0;
      const prevX = p.x;
      const prevY = p.y;
      const speed = p.speed || 5.5;

      // EMP AURA INTERFERENCE: Projectiles passing through EMP aura suffer -30% speed
      let empSpeedMod = 1.0;
      this.spatialGrid.queryRadius(p.x, p.y, 85, (near) => {
        if (near.hp > 0 && !near.isAllied && (near.type === 'disruptor_emp' || near.empAuraRadius)) {
          empSpeedMod = 0.70;
        }
      });

      p.x += Math.cos(angle) * speed * empSpeedMod * delta;
      p.y += Math.sin(angle) * speed * empSpeedMod * delta;

      p.graphics.x = p.x;
      p.graphics.y = p.y;

      // Gravity Singularity vortex pulling & real-time damage ticking
      if (p.type === 'singularity_vortex') {
        this.spatialGrid.queryRadius(p.x, p.y, 110, (near) => {
          if (near.hp <= 0 || near.isAllied) return;
          const dx = p.x - near.x;
          const dy = p.y - near.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > 5) {
            const pullForce = (near.type === 'boss' ? 0.22 : 1.8) * delta;
            near.x += (dx / dist) * pullForce;
            near.y += (dy / dist) * pullForce;
          }
          const tickDamage = stats.damage * 0.15 * delta;
          near.hp -= tickDamage;

          if (Math.random() < 0.05) {
            this.spawnLightningZap(p.x, p.y, near.x, near.y, 0xa855f7);
          }
        });
      }

      const bulletHitRadius = (p.radius || 2.5) + 3;

      // Continuous Collision Detection (CCD) across full swept flight segment
      this.spatialGrid.querySegment(prevX, prevY, p.x, p.y, bulletHitRadius, (e, t) => {
        if (e.hp <= 0 || e.isAllied) return;

        // Exact impact position along trajectory
        const hitX = prevX + t * (p.x - prevX);
        const hitY = prevY + t * (p.y - prevY);

        // 1. PHASE SHIFTER INTANGIBILITY: Projectile passes harmlessly through phased enemy
        if (e.isPhased) {
          if (Math.random() < 0.2) {
            this.popupManager.spawnText(hitX, hitY - 14, '🌀 PHASED', 0xa855f7);
          }
          return;
        }

        // 2. REFLECTOR PRISM: 35% chance to deflect incoming kinetic bullet
        if (e.isDeflector || e.type === 'reflector_prism') {
          if (Math.random() < 0.35) {
            this.popupManager.spawnText(hitX, hitY - 14, '🛡️ DEFLECTED', 0x38bdf8);
            this.spawnLightningZap(hitX, hitY, hitX + (Math.random() - 0.5) * 40, hitY + (Math.random() - 0.5) * 40, 0x38bdf8);
            soundEngine.playZap();
            p.hp = 0;
            return;
          }
        }

        // 3. ENRAGED TRAPEZIUM: Popping the balloon triggers fury
        if (e.hasBalloon && e.type === 'enraged_trapezium') {
          e.hasBalloon = false;
          e.isEnraged = true;
          e.speed = (e.speed || 0.85) * 1.45;
          e.dps = (e.dps || 2.0) * 1.5;
          e.graphics.tint = 0xef4444;
          this.popupManager.spawnText(hitX, hitY - 20, '💥 POP! 😡 ENRAGED!', 0xef4444);
          this.spawnExplosion(hitX, hitY - 15, 20, 0xf43f5e);
          soundEngine.playDeath();
        }

        const isCrit = Math.random() < stats.critChance;
        let damage = stats.damage * (isCrit ? stats.critMultiplier : 1);

        // Custom Specialty Weapon Damage Adjustments
        if (p.type === 'gatling') {
          damage *= 0.25;
        } else if (p.type === 'calamity_shell') {
          damage *= 3.5;
        } else if (p.type === 'calamity_bomblet') {
          damage *= 0.8;
        }

        // BOSS & ELITE DAMAGE:
        if (e.type === 'boss') {
          damage *= (stats.bossDamageMult || 1.0);
        } else if (e.type === 'big_square' || e.type === 'orange_triangle') {
          damage *= (stats.eliteDamageMult || 1.0);
        }

        // LUCKY STRIKE CARD: 5% (+2% per level) chance to deal 10x damage
        const luckyStrikeChance = this.getEquippedCardEffect('lucky_strike') || 0;
        if (luckyStrikeChance > 0 && Math.random() < luckyStrikeChance) {
          damage *= 10;
          this.popupManager.spawnText(hitX, hitY - 20, '🍀 LUCKY STRIKE!', 0xfacc15);
        }

        // ARMOR MECHANIC: Bosses and Elites have armor
        let armor = 0;
        if (e.type === 'boss') armor = 10 + this.state.wave * 0.5;
        else if (e.type === 'big_square' || e.type === 'orange_triangle') armor = 2 + this.state.wave * 0.1;
        else if (e.isEnraged) armor = 6;

        // Apply Armor Pierce: reduces effective armor
        const effectiveArmor = Math.max(0, armor * (1 - (stats.armorPierce || 0)));
        damage = Math.max(1, damage - effectiveArmor);

        if (e.hasShieldAura) {
          damage *= 0.75; // Bastion Shield mitigation
        }

        // Spotlight Ultimate Weapon Amplification
        if (e.isSpotlit && e.spotlightMultiplier) {
          damage *= e.spotlightMultiplier;
        }

        // 4. SHIELDED SHAPE OVERSHIELD MITIGATION
        if (e.isShielded && e.shieldHp && e.shieldHp > 0) {
          const absorbed = Math.min(e.shieldHp, damage);
          e.shieldHp -= absorbed;
          damage -= absorbed;
          this.popupManager.spawnDamage(hitX, hitY - 10, absorbed, false, 1.0);
          this.spawnLightningZap(hitX, hitY, hitX + (Math.random() - 0.5) * 20, hitY + (Math.random() - 0.5) * 20, 0x38bdf8);
          if (e.shieldHp <= 0) {
            e.isShielded = false;
            e.shieldHp = 0;
            this.popupManager.spawnText(hitX, hitY - 18, '🛡️ SHIELD BROKEN!', 0x38bdf8);
            soundEngine.playZap();
          }
          if (damage <= 0) {
            p.hp = p.isPiercing ? p.hp : 0;
            return;
          }
        }

        e.hp -= damage;

        // CHAIN LIGHTNING ULTIMATE WEAPON:
        const chainLvl = this.state.workshopUpgrades?.['perm_chain_lightning'] || 0;
        if (chainLvl > 0 && Math.random() < 0.45 + chainLvl * 0.05) {
          const labMult = 1.0 + (this.state.labResearchLevels?.['lab_uw_chain_lightning'] || 0) * 0.20;
          const chainDmg = stats.damage * (0.8 + chainLvl * 0.15) * labMult;
          const maxTargets = 3 + chainLvl;
          let zapCount = 0;
          let prevX = hitX;
          let prevY = hitY;

          this.spatialGrid.queryRadius(hitX, hitY, 150, (other) => {
            if (other !== e && other.hp > 0 && !other.isAllied && zapCount < maxTargets) {
              other.hp -= chainDmg;
              this.popupManager.spawnDamage(other.x, other.y, chainDmg, false, stats.critMultiplier);
              this.spawnLightningZap(prevX, prevY, other.x, other.y, 0x00f5ff);
              prevX = other.x;
              prevY = other.y;
              zapCount++;
            }
          });

          if (zapCount > 0) {
            soundEngine.playZap();
            this.popupManager.spawnText(hitX, hitY - 20, `⚡ CHAIN LIGHTNING x${zapCount}`, 0x00f5ff);
          }
        }

        // ELECTRIC ZAP IMPACT VFX & SOUND:
        if (p.type === 'calamity_shell') {
          this.spawnExplosion(hitX, hitY, 75, 0xef4444);
          soundEngine.playMortarExplosion();
          
          this.spatialGrid.queryRadius(hitX, hitY, 75, (near) => {
            if (near.hp <= 0 || near.isAllied || near === e) return;
            const splashDmg = stats.damage * 1.5;
            near.hp -= splashDmg;
            this.popupManager.spawnDamage(near.x, near.y, splashDmg, true, stats.critMultiplier);
          });

          // Spawn 5 cluster bomblets blooming outward
          for (let k = 0; k < 5; k++) {
            const bombletAngle = (k * (Math.PI * 2) / 5) + Math.random() * 0.4;
            let bp = this.projectilePool.pop();
            if (!bp) {
              const bGraphics = new Graphics();
              this.renderer.projectileContainer.addChild(bGraphics);
              bp = {
                x: hitX,
                y: hitY,
                hp: 1,
                maxHp: 1,
                graphics: bGraphics,
                radius: 3.5,
                rotation: bombletAngle + Math.PI / 2,
                angularVelocity: 0,
                isPiercing: false,
                bouncesLeft: 0,
                isLightning: true,
                type: 'calamity_bomblet',
                drawnType: 'calamity_bomblet',
              };
            } else {
              bp.x = hitX;
              bp.y = hitY;
              bp.hp = 1;
              bp.maxHp = 1;
              bp.radius = 3.5;
              bp.isPiercing = false;
              bp.bouncesLeft = 0;
              bp.type = 'calamity_bomblet';
              bp.drawnType = 'calamity_bomblet';
              bp.graphics.visible = true;
              bp.graphics.x = hitX;
              bp.graphics.y = hitY;
              bp.graphics.rotation = bombletAngle + Math.PI / 2;
            }
            bp.speed = 5.0 + Math.random() * 1.5;
            bp.dps = bombletAngle;
            bp.graphics.clear();
            bp.graphics.circle(0, 0, 5).fill(0xea580c).stroke({ color: 0xfacc15, width: 1.0 });

            this.projectiles.push(bp);
          }
        } else if (p.type === 'calamity_bomblet') {
          this.spawnExplosion(hitX, hitY, 35, 0xea580c);
          soundEngine.playZap();
          this.spatialGrid.queryRadius(hitX, hitY, 35, (near) => {
            if (near.hp <= 0 || near.isAllied || near === e) return;
            const splashDmg = stats.damage * 0.80;
            near.hp -= splashDmg;
            this.popupManager.spawnDamage(near.x, near.y, splashDmg, false, stats.critMultiplier);
          });
        } else if (p.type !== 'singularity_vortex') {
          // Clean kinetic projectile impact sparks (no electric zap VFX)
          this.spawnExplosion(hitX, hitY, 5, p.isPiercing ? 0x22d3ee : 0x38bdf8);
        }

        // BOUNCING PROJECTILES / RICOCHET UPGRADE:
        const bounceChance = stats.bounceShotChance || 0;
        let didBounce = false;
        if (bounceChance > 0 && Math.random() < bounceChance && (p.bouncesLeft ?? 0) < 3) {
          const candidateEnemies = this.enemies.filter(foe => foe !== e && foe.hp > 0 && !foe.isAllied);
          if (candidateEnemies.length > 0) {
            const targetShape = candidateEnemies[Math.floor(Math.random() * candidateEnemies.length)];
            const bounceAngle = Math.atan2(targetShape.y - hitY, targetShape.x - hitX);
            p.dps = bounceAngle;
            p.x = hitX;
            p.y = hitY;
            p.graphics.x = hitX;
            p.graphics.y = hitY;
            p.graphics.rotation = bounceAngle + Math.PI / 2;
            p.bouncesLeft = (p.bouncesLeft || 0) + 1;
            p.hp = 1; // Keep projectile active to ricochet
            didBounce = true;
            this.popupManager.spawnText(hitX, hitY, '⚡ RICOCHET!', 0x38bdf8);
            this.spawnLightningZap(hitX, hitY, targetShape.x, targetShape.y, 0xfacc15);
            soundEngine.playZap();
          }
        }

        if (!didBounce) {
          p.hp = p.isPiercing ? p.hp : 0;
        }

        // LIFE STEAL:
        if (stats.lifeStealPercent > 0) {
          const healAmount = damage * stats.lifeStealPercent;
          const newHp = Math.min(stats.effectiveMaxHp, this.state.playerHp + healAmount);
          this.state.playerHp = Number(newHp.toFixed(2));
          onStateUpdate({ playerHp: this.state.playerHp });
        }

        // POISON LINGER:
        const poisonLingerDrop = this.state.activeRareDrops?.find(d => d.id === 'poison_linger');
        if (poisonLingerDrop && Math.random() < 0.03 && e.resistantAilment !== 'poison') {
          this.activePoisonClouds.push({
            x: hitX,
            y: hitY,
            radius: 55,
            lifeMs: 4000,
            maxLifeMs: 4000,
            damage: stats.damage * 0.5 * poisonLingerDrop.effectMultiplier
          });
          this.popupManager.spawnText(hitX, hitY - 15, '☣️ POISON LINGER', 0x22c55e);
        }

        // DECAYING PLAGUE:
        if (p.isDecayBullet) {
          if (e.resistantAilment === 'decay') {
            if (Math.random() < 0.25) this.popupManager.spawnText(hitX, hitY - 12, '🦠 IMMUNE', 0xf97316);
          } else {
            e.decayStacks = Math.min(5, (e.decayStacks || 0) + 1);
            e.decayTimer = 0;
            this.popupManager.spawnText(hitX, hitY - 10, `🦠 DECAY x${e.decayStacks}`, 0x4ade80);
          }
        }

        // SHRAPNEL RAINFALL:
        if (p.isShrapnelBullet) {
          if (e.resistantAilment === 'bleed') {
            if (Math.random() < 0.25) this.popupManager.spawnText(hitX, hitY - 12, '🩸 IMMUNE', 0xef4444);
          } else {
            this.activeShrapnelRainfalls.push({
              x: hitX,
              y: hitY,
              radius: 75,
              lifeMs: 3000,
              maxLifeMs: 3000,
              damage: stats.damage * 1.5
            });
            this.popupManager.spawnText(hitX, hitY - 20, '🩸 SHRAPNEL RAINFALL!', 0xef4444);
            soundEngine.playDeath();
          }
        }

        // KNOCKBACK & SUPER ARMOR:
        if (stats.knockbackChance > 0 && Math.random() < stats.knockbackChance) {
          if (e.type === 'boss' || e.isGolden) {
            if (Math.random() < 0.25) {
              this.popupManager.spawnText(hitX, hitY - 18, '🛡️ SUPER ARMOR', 0xfacc15);
            }
          } else if (e.resistantAilment === 'freeze') {
            if (Math.random() < 0.25) {
              this.popupManager.spawnText(hitX, hitY - 18, '🛡️ UNSTUNNABLE', 0x38bdf8);
            }
          } else {
            const pushDist = 14;
            e.x += Math.cos(angle) * pushDist;
            e.y += Math.sin(angle) * pushDist;
          }
        }

        // POISON SKILL (Active Drop or Lab Protocol):
        const poisonDrop = this.state.activeRareDrops?.find(d => d.id === 'poison');
        const labPoisonLvl = this.state.labResearchLevels?.['lab_skill_poison'] || 0;
        if (poisonDrop || labPoisonLvl > 0) {
          if (e.resistantAilment === 'poison') {
            if (Math.random() < 0.25) this.popupManager.spawnText(hitX, hitY - 14, '🧪 IMMUNE', 0x10b981);
          } else {
            const mult = poisonDrop ? poisonDrop.effectMultiplier : (1.0 + labPoisonLvl * 0.10);
            e.poisonTimer = 10000;
            e.poisonDps = Math.max(1, Math.round(e.maxHp * 0.05 * mult));
          }
        }

        // FLOW OF CALAMITY SKILL (Active Drop or Lab Protocol):
        const calamityDrop = this.state.activeRareDrops?.find(d => d.id === 'flow_of_calamity');
        const labCalamityLvl = this.state.labResearchLevels?.['lab_skill_calamity'] || 0;
        const calamityMult = calamityDrop ? calamityDrop.effectMultiplier : (labCalamityLvl > 0 ? (1.0 + labCalamityLvl * 0.15) : 0);
        if (calamityMult > 0 && Math.random() < 0.40 * calamityMult) {
          const activeDropsCount = (this.state.activeRareDrops?.length || 0);
          const events = activeDropsCount >= 2 
            ? ['double_dmg', 'cripple', 'poison_cloud', 'calamity_overload'] 
            : ['double_dmg', 'cripple', 'poison_cloud'];
          const ev = events[Math.floor(Math.random() * events.length)];

          if (ev === 'double_dmg') {
            e.hp -= damage; // Extra hit
            this.popupManager.spawnText(hitX, hitY, 'CALAMITY x2!', 0xef4444);
          } else if (ev === 'cripple') {
            if (e.isGolden || e.type === 'boss') {
              this.popupManager.spawnText(hitX, hitY, '🛡️ RESISTED', 0xfacc15);
            } else {
              e.speed = (e.speed || 1) * 0.4;
              this.popupManager.spawnText(hitX, hitY, 'SLOWED!', 0x8b5cf6);
            }
          } else if (ev === 'poison_cloud') {
            const cloudDmg = Math.max(2, Math.round(e.maxHp * 0.08));
            e.hp -= cloudDmg;
            this.popupManager.spawnDamage(hitX, hitY, cloudDmg, false, 1.0);
            this.popupManager.spawnText(hitX, hitY - 14, '☣️ CALAMITY MIASMA', 0x10b981);
          } else if (ev === 'calamity_overload') {
            const overloadDmg = Math.max(5, Math.round(e.maxHp * 0.15));
            e.hp -= overloadDmg;
            this.spawnExplosion(hitX, hitY, 50, 0xa855f7);
            let zaps = 0;
            this.spatialGrid.queryRadius(hitX, hitY, 150, (near) => {
              if (near !== e && near.hp > 0 && !near.isAllied && zaps < 3) {
                near.hp -= overloadDmg;
                this.spawnLightningZap(hitX, hitY, near.x, near.y, 0xa855f7);
                zaps++;
              }
            });
            soundEngine.playZap();
            this.popupManager.spawnText(hitX, hitY - 18, '🌀 CALAMITY OVERLOAD!', 0xa855f7);
          }
        }

        // Spawn Damage popup at exact contact coordinate
        this.popupManager.spawnDamage(hitX, hitY, damage, isCrit, stats.critMultiplier);
        e.angularVelocity += (Math.random() - 0.5) * 0.22;

        // CRIT SHARE CARD: 8.5% (+2.5% per level) chance on crit to deal crit damage to nearby enemies
        if (isCrit) {
          const critShareCard = this.state.cards?.['card_crit_share'];
          if (critShareCard && critShareCard.isEquipped) {
            const critShareChance = 0.085 + (critShareCard.level - 1) * 0.025;
            if (Math.random() < critShareChance) {
              this.popupManager.spawnText(hitX, hitY, '⚡ CRIT SHARE!', 0xfacc15);
              let chained = 0;
              this.spatialGrid.queryRadius(hitX, hitY, 130, (other) => {
                if (other !== e && other.hp > 0 && !other.isAllied && chained < 3) {
                  const shareDmg = damage * 0.75;
                  other.hp -= shareDmg;
                  this.popupManager.spawnDamage(other.x, other.y, shareDmg, true, stats.critMultiplier);
                  chained++;
                }
              });
            }
          }
        }
        
        // If not piercing, return true to stop swept segment query
        if (!p.isPiercing) return true;
      });

      if (p.type === 'singularity_vortex') {
        p.lifeMs = (p.lifeMs ?? 3500) - (delta * 16.66);
        if (p.lifeMs <= 0) {
          p.hp = 0;
        }
      }

      if (p.hp <= 0 || p.x < -20 || p.x > GAME_WIDTH + 20 || p.y < -20 || p.y > GAME_HEIGHT + 20) {
        if (p.type === 'singularity_vortex') {
          this.spawnExplosion(p.x, p.y, 125, 0xa855f7);
          soundEngine.playRocketExplosion();
          
          this.spatialGrid.queryRadius(p.x, p.y, 125, (near) => {
            if (near.hp <= 0 || near.isAllied) return;
            const implosionDamage = stats.damage * 4.0;
            near.hp -= implosionDamage;
            this.popupManager.spawnDamage(near.x, near.y, implosionDamage, true, stats.critMultiplier);
          });
        }
        p.graphics.visible = false;
        this.projectilePool.push(p);
        this.projectiles.splice(i, 1);
      }
    }
  }

  public completeWave(onStateUpdate: (state: Partial<GameState>) => void, forcedByBoss: boolean = false) {
    soundEngine.playWaveComplete();
    let nextWave = this.state.wave + 1;
    
    // WAVE SKIP CARD: 5% (+2% per level) chance to skip a wave
    const skipCard = this.state.cards?.['card_wave_skip'];
    let skipTriggered = false;
    if (skipCard && skipCard.isEquipped) {
      const skipChance = 0.05 + (skipCard.level - 1) * 0.02;
      if (Math.random() < skipChance) {
        nextWave += 1;
        skipTriggered = true;
      }
    }

    const supplyDrop = this.getWaveCompletionCashBonus(this.state.wave);
    const waveCashBonus = supplyDrop.amount;
    const waveShardsBonus = this.getWaveCompletionShardsBonus(this.state.wave);
    
    // COSMIC LINK CARD: +10% (+5% per level) boost to Cash and Shards harvested
    const linkCard = this.state.cards?.['card_cosmic_link'];
    const linkMult = (linkCard && linkCard.isEquipped) ? (1 + 0.10 + (linkCard.level - 1) * 0.05) : 1.0;
    
    const finalCash = Math.round(waveCashBonus * linkMult);
    const finalShards = Math.round(waveShardsBonus * linkMult);

    this.state.cash = (this.state.cash || 0) + finalCash;
    this.state.cosmicShards = (this.state.cosmicShards || 0) + finalShards;
    this.lastSyncedCash = this.state.cash;
    this.lastSyncedShards = this.state.cosmicShards;

    // Visual popups for wave completion rewards
    if (finalCash > 0) {
      if (supplyDrop.isJackpot) {
        this.popupManager.spawnText(
          GAME_WIDTH / 2,
          GAME_HEIGHT / 2 - 10,
          `📦✨ CRITICAL SUPPLY DROP! +$${finalCash.toLocaleString()}`,
          0xfacc15
        );
        this.spawnExplosion(GAME_WIDTH / 2, GAME_HEIGHT / 2, 35, 0xfacc15);
        soundEngine.playLevelUp();
      } else {
        const rewardLabel = forcedByBoss ? "👑 BOSS SUPPLY CRATE" : "📦 SUPPLY DROP";
        this.popupManager.spawnCash(GAME_WIDTH / 2, GAME_HEIGHT / 2, finalCash, false, this.state.settings?.useLegacyCurrencyFormat, rewardLabel);
      }
    }
    if (finalShards > 0) {
      this.popupManager.spawnShard(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 25, finalShards, forcedByBoss ? "BOSS CLEARED!" : "WAVE BONUS");
    }

    // COMPOUND INTEREST CARD & WAVE INTEREST UPGRADE: interest on unspent Cash every wave
    const interestCard = this.state.cards?.['card_compound_interest'];
    const cardInterestRate = (interestCard && interestCard.isEquipped) ? (0.015 + (interestCard.level - 1) * 0.005) : 0;
    const inRunInterestRate = (this.upgrades.find(u => u.id === 'interest_rate')?.level || 0) * 0.01;
    const permInterestRate = (this.state.workshopUpgrades?.['perm_interest_rate'] || 0) * 0.005;
    const totalInterestRate = cardInterestRate + inRunInterestRate + permInterestRate;
    if (totalInterestRate > 0) {
      const rawInterest = Math.floor(this.state.cash * totalInterestRate);
      // Interest capped smoothly based on current wave and lab research so it scales into mid-game
      const labInterestCapMult = 1 + (this.state.labResearchLevels?.['lab_interest_cap'] || 0) * 0.25;
      const waveCap = Math.max(5, Math.min(150 * labInterestCapMult, this.state.wave * 4 * labInterestCapMult));
      const cappedInterest = Math.min(waveCap, rawInterest);
      if (cappedInterest > 0) {
        this.state.cash += cappedInterest;
        this.lastSyncedCash = this.state.cash;
        this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, `+$${cappedInterest} INTEREST`, 0xfacc15);
      }
    }

    // RECOVERY CARD: Heal HP after wave
    const recoveryCard = this.state.cards?.['card_recovery_kit'];
    if (recoveryCard && recoveryCard.isEquipped) {
      const amount = 5 + (recoveryCard.level - 1) * 5;
      const combatStats = this.getPlayerCombatStats();
      this.state.playerHp = Math.min(combatStats.effectiveMaxHp, this.state.playerHp + amount);
      this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, `+${amount} RECOVERY`, 0x10b981);
    }

    // RECOVERY PACKAGE CHANCE CARD & WORKSHOP RECOVERY DRONE
    const recPkgCard = this.state.cards?.['card_recovery_package'];
    const permRecDrone = (this.state.workshopUpgrades?.['perm_recovery_package'] || 0) * 0.02;
    const hasRecoveryDrone = (recPkgCard && recPkgCard.isEquipped) || permRecDrone > 0;
    if (hasRecoveryDrone) {
      const combatStats = this.getPlayerCombatStats();
      const defPercent = combatStats.defensePercent || 0;
      // Soft-scaling multiplier: 10% base effectiveness up to 100% full payoff at 55% defense
      const softMultiplier = 0.10 + 0.90 * Math.min(1.0, defPercent / 0.55);

      const cardChance = (recPkgCard && recPkgCard.isEquipped) ? (0.10 + (recPkgCard.level - 1) * 0.04) : 0;
      const finalChance = (cardChance + permRecDrone) * softMultiplier;

      if (Math.random() < finalChance) {
        const labHealBoost = 1 + (this.state.labResearchLevels?.['lab_recovery_package'] || 0) * 0.20;
        const healAmt = Math.floor(combatStats.effectiveMaxHp * 0.15 * softMultiplier * labHealBoost);
        if (healAmt > 0) {
          this.state.playerHp = Math.min(combatStats.effectiveMaxHp, this.state.playerHp + healAmt);
          this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 120, `+${healAmt} RECOVERY DRONE!`, 0x22c55e);
        }
      }
    }

    // FREE UPGRADE CARD & IN-RUN / WORKSHOP FREE UPGRADE CHANCE
    const freeCard = this.state.cards?.['card_free_upgrade'];
    const cardFreeChance = (freeCard && freeCard.isEquipped) ? (0.05 + (freeCard.level - 1) * 0.02) : 0;
    const inRunFreeChance = (this.upgrades.find(u => u.id === 'free_upgrade_chance')?.level || 0) * 0.02;
    const permFreeChance = (this.state.workshopUpgrades?.['perm_free_upgrade_chance'] || 0) * 0.015;
    const totalFreeChance = cardFreeChance + inRunFreeChance + permFreeChance;
    if (totalFreeChance > 0 && Math.random() < totalFreeChance) {
      const eligibleUpgrades = this.upgrades.filter(u => u.level < u.maxLevel);
      if (eligibleUpgrades.length > 0) {
        const chosenUpg = eligibleUpgrades[Math.floor(Math.random() * eligibleUpgrades.length)];
        chosenUpg.level += 1;
        this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, `✨ FREE UPGRADE: ${chosenUpg.name}!`, 0x38bdf8);
        soundEngine.playLevelUp();
      } else {
        const bonus = 15 * this.state.wave;
        this.state.cash += bonus;
        this.lastSyncedCash = this.state.cash;
        this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 100, `+$${bonus} FREE BONUS!`, 0x38bdf8);
      }
    }

    if (skipTriggered) {
      this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, 'WAVE SKIPPED!', 0x38bdf8);
      soundEngine.playLevelUp();
    }

    this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 45, `✨ WAVE ${this.state.wave} CLEARED! ✨`, 0x38bdf8);

    // STAGE CLEAR MILESTONE BONUS (Waves 25, 50, 75, 100 Catch-up Rewards):
    const currentClearedWave = this.state.wave;
    let stageClearCash = 0;
    let stageClearShards = 0;
    let stageClearLabel = '';

    if (currentClearedWave === 25) {
      stageClearCash = 250;
      stageClearShards = 10;
      stageClearLabel = '🏆 STAGE 1 CLEAR BONUS! +$250 & +10 💫';
    } else if (currentClearedWave === 50) {
      stageClearCash = 2500;
      stageClearShards = 35;
      stageClearLabel = '🏆 STAGE 2 CLEAR BONUS! +$2,500 & +35 💫';
    } else if (currentClearedWave === 75) {
      stageClearCash = 25000;
      stageClearShards = 100;
      stageClearLabel = '🏆 STAGE 3 CLEAR BONUS! +$25,000 & +100 💫';
    } else if (currentClearedWave === 100) {
      stageClearCash = 250000;
      stageClearShards = 250;
      stageClearLabel = '👑 APEX STAGE CLEAR BONUS! +$250k & +250 💫';
    }

    if (stageClearCash > 0) {
      this.state.cash += stageClearCash;
      this.state.cosmicShards += stageClearShards;
      this.lastSyncedCash = this.state.cash;
      this.lastSyncedShards = this.state.cosmicShards;
      this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 110, stageClearLabel, 0xfacc15);
      soundEngine.playUpgradeSuccess();
    }

    // GEM MINING DRILL (Workshop Utility): Chance to excavate bonus Gems on wave clear
    const gemMiningChance = (this.state.workshopUpgrades?.['perm_gem_extractor'] || 0) * 0.05;
    if (gemMiningChance > 0 && Math.random() < gemMiningChance) {
      this.state.gems = (this.state.gems || 0) + 2;
      this.popupManager.spawnText(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 135, '💎 +2 GEMS EXCAVATED!', 0xa855f7);
      soundEngine.playLevelUp();
    }

    // Clear active boss reference
    this.state.activeBoss = null;

    const partialUpdate: Partial<GameState> = {
      activeBoss: null,
      isWaveActive: false,
      wave: nextWave,
      highestWaveThisRun: Math.max(this.state.highestWaveThisRun || 1, nextWave),
      highestWaveEver: Math.max(this.state.highestWaveEver || 1, nextWave),
      cash: this.state.cash,
      cosmicShards: this.state.cosmicShards,
      gems: this.state.gems,
    };

    // Update Lifetime stats
    const currentTier = this.state.tier || 1;
    const highestInTier = Math.max(this.state.stats?.highestWavePerTier?.[currentTier] || 0, nextWave);
    const updatedStats = {
      ...this.state.stats,
      highestWavePerTier: {
        ...(this.state.stats?.highestWavePerTier || {}),
        [currentTier]: highestInTier,
      },
      lifetimeCash: (this.state.stats?.lifetimeCash || 0) + waveCashBonus,
      lifetimeCosmicShards: (this.state.stats?.lifetimeCosmicShards || 0) + waveShardsBonus,
    } as any;
    partialUpdate.stats = updatedStats;

    // Check Milestone Unlocks & Missions
    this.checkWaveMissionsAndMilestones(nextWave, currentTier, partialUpdate);

    // Pacing intermission between waves (1.2s tactical breathing room)
    this.isIntermission = true;
    this.intermissionTimer = 1200;
    this.state.wave = nextWave;
    this.state.isWaveActive = false;
    this.waveTimeElapsed = 0;
    const nextWaveTotalEnemies = WAVE_CONFIG.getEnemiesForWave(nextWave, currentTier);
    this.waveEnemiesTotal = nextWaveTotalEnemies;
    this.waveEnemiesSpawned = 0;
    this.waveEnemiesDefeated = 0;
    this.state.totalEnemiesInWave = nextWaveTotalEnemies;
    this.state.enemiesRemaining = nextWaveTotalEnemies;
    this.state.waveProgress = 0;

    partialUpdate.isWaveActive = false;
    partialUpdate.wave = nextWave;
    partialUpdate.enemiesRemaining = nextWaveTotalEnemies;
    partialUpdate.totalEnemiesInWave = nextWaveTotalEnemies;
    partialUpdate.waveProgress = 0;

    onStateUpdate(partialUpdate);
  }

  public getPlayerCombatStats(): PlayerCombatStats {
    return calculatePlayerCombatStats(this.upgrades, this.state);
  }

  private getEquippedCardEffect(effectType: string): number | null {
    if (!this.state.equippedCardIds || this.state.equippedCardIds.length === 0) return null;
    let total = 0;
    let found = false;

    for (const cardId of this.state.equippedCardIds) {
      const cardDef = CARDS_CONFIG.find(c => c.id === cardId);
      const playerCard = this.state.cards?.[cardId];
      if (cardDef && cardDef.effectType === effectType && playerCard) {
        const value = cardDef.baseValue + (playerCard.level - 1) * cardDef.valuePerLevel;
        total += value;
        found = true;
      }
    }
    return found ? total : null;
  }

  private getWaveCompletionCashBonus(wave: number): { amount: number; isJackpot: boolean } {
    const tier = this.state.tier || 1;
    const tierCashMultiplier = getTierCashMultiplier(tier);
    const isBoss = WAVE_CONFIG.isBossWave(wave);

    // Calibrated four-stage wave progression crate:
    // Target metrics: Wave 25 cumulative ~1k cash, Wave 50 cumulative ~10k cash, Wave 100 cumulative ~100k+ cash
    let baseCrate = 0;
    if (wave <= 25) {
      // Stage 1 (Waves 1-25): Wave 1: ~$4, Wave 10: ~$13, Wave 25: ~$35
      baseCrate = 3.5 + wave * 0.62 + Math.pow(wave, 1.25) * 0.20;
    } else if (wave <= 50) {
      // Stage 2 (Waves 26-50): Wave 26: ~$37, Wave 50: ~$240
      const w2 = wave - 25;
      baseCrate = 30 + w2 * 6.2 + Math.pow(w2, 1.65) * 0.88;
    } else {
      // Stage 3 & 4 (Waves 51+): Wave 75: ~$1,000, Wave 100: ~$2,500
      const w3 = wave - 50;
      baseCrate = 340 + w3 * 16.0 + Math.pow(w3, 1.85) * 0.95;
    }

    const bossMultiplier = isBoss ? 1.5 : 1.0;

    // Orbital Supply Drop in-run upgrade: 1.0x base + 0.08x per level
    const supplyUpg = this.upgrades.find(u => u.id === 'cash_per_wave');
    const upgMult = (supplyUpg?.baseValue || 1.0) + (supplyUpg?.level || 0) * (supplyUpg?.increment || 0.08);

    // Permanent Workshop Orbital Supply Drop: +8% per level
    const permSupplyMult = 1.0 + (this.state.workshopUpgrades?.['perm_supply_drop'] || 0) * 0.08;

    // Lab Research: +10% per level
    const labSupplyMult = 1.0 + (this.state.labResearchLevels?.['lab_supply_drop'] || 0) * 0.10;

    // Card effects:
    const cardBonus = 1.0 + (this.getEquippedCardEffect('cash_per_wave') || 0);

    let rawTotal = baseCrate * bossMultiplier * upgMult * permSupplyMult * labSupplyMult * cardBonus * tierCashMultiplier;

    // Critical / Golden Supply Crate Chance (8% base + scaling with upgrade level)
    const jackpotChance = 0.08 + Math.min(0.12, (supplyUpg?.level || 0) * 0.001);
    const isJackpot = Math.random() < jackpotChance;
    if (isJackpot) {
      rawTotal *= 1.5;
    }

    return {
      amount: Math.max(1, Math.round(rawTotal)),
      isJackpot,
    };
  }

  private getWaveCompletionShardsBonus(wave: number): number {
    const upgBonus = this.upgrades.find(u => u.id === 'shards_per_wave')?.level || 0;
    const permShardsWave = this.state.workshopUpgrades?.['perm_shards_per_wave'] || 0;
    const milestoneBonus = (wave % 10 === 0) ? 2 : 0;
    return upgBonus + permShardsWave + milestoneBonus;
  }

  private updateKillMissions(isBoss: boolean, cashEarned: number, onStateUpdate: (state: Partial<GameState>) => void, thornsDamage: number = 0) {
    if (!this.state.missions) return;
    const updatedMissions = this.state.missions.map(m => {
      if (m.isClaimed) return m;
      if (m.type === 'kills') {
        return { ...m, current: Math.min(m.target, m.current + 1) };
      }
      if (m.type === 'boss_kills' && isBoss) {
        return { ...m, current: Math.min(m.target, m.current + 1) };
      }
      if (m.type === 'cash_earned') {
        return { ...m, current: Math.min(m.target, m.current + cashEarned) };
      }
      if (m.type === 'thorns_damage' && thornsDamage > 0) {
        return { ...m, current: Math.min(m.target, Math.round(m.current + thornsDamage)) };
      }
      return m;
    });
    onStateUpdate({ missions: updatedMissions });
  }

  private checkWaveMissionsAndMilestones(wave: number, tier: number, stateUpdate: Partial<GameState>) {
    // Update wave missions
    if (this.state.missions) {
      stateUpdate.missions = this.state.missions.map(m => {
        if (m.type === 'waves' && !m.isClaimed) {
          return { ...m, current: Math.min(m.target, m.current + 1) };
        }
        return m;
      });
    }

    // Check unlocks
    const currentUnlocks = { ...(this.state.unlockedSystems || { cards: false, missions: false, tournaments: false, events: false, labs: false, tier2: false, advancedAttack: false, advancedDefense: false }) };
    if (wave >= 30) currentUnlocks.labs = true;
    if (wave >= 15) currentUnlocks.cards = true;
    if (wave >= 45) currentUnlocks.missions = true;
    if (wave >= 60) currentUnlocks.tournaments = true;
    if (wave >= 70) currentUnlocks.events = true;
    if (wave >= 80) {
      currentUnlocks.tier2 = true;
      currentUnlocks.advancedAttack = true;
      currentUnlocks.advancedDefense = true;
    }
    stateUpdate.unlockedSystems = currentUnlocks;
  }

  public clearAllEntities() {
    for (const enemy of this.enemies) {
      enemy.graphics.visible = false;
      let pool = this.enemyPools.get(enemy.type);
      if (!pool) {
        pool = [];
        this.enemyPools.set(enemy.type, pool);
      }
      pool.push(enemy);
    }
    this.enemies = [];

    for (const projectile of this.projectiles) {
      projectile.graphics.visible = false;
      this.projectilePool.push(projectile);
    }
    this.projectiles = [];

    for (const enemyProj of this.enemyProjectiles) {
      enemyProj.graphics.visible = false;
      this.enemyProjectilePool.push(enemyProj);
    }
    this.enemyProjectiles = [];
    this.activeRockets = [];
    this.activeLaserSweep = null;
    this.activeMortarStrikes = [];
    this.activeExplosions = [];
    this.activeDeflections = [];
    this.landMines = [];
    this.landMineSpawnTimer = 0;
    this.nukeFiredThisWave = false;
    this.renderer.specialEffectsGraphics?.clear();
    this.popupManager.flushPendingCurrency();
    this.popupManager.clear();
    this.state.activeBoss = null;
  }

  public resetRun(maxHp: number, startWave: number = 1) {
    this.isHandlingDeath = false;
    this.clearAllEntities();
    this.enemiesDefeatedInRun = 0;
    this.cashEarnedInRun = 0;
    this.shotTimer = 0;
    this.laserSweepCooldownTimer = 0;
    this.mortarCooldownTimer = 0;
    this.spawnTimer = 0;
    this.damageTickTimer = 0;
    this.playerRotation = 0;
    this.playerAngularVelocity = 0;
    this.pendingStateUpdate = {};
    this.state.cash = 0;
    this.lastSyncedCash = 0;
    this.lastSyncedShards = this.state.cosmicShards;
    this.lastSyncedCells = this.state.cells;

    // Apply SCROUNGER PROTOCOL penalty: -10% Max HP
    const scroungerActive = this.state.equippedCardIds?.includes('card_scrounger_protocol');
    const adjustedMaxHp = scroungerActive ? (maxHp * 0.9) : maxHp;

    this.state.playerHp = adjustedMaxHp;
    this.state.playerMaxHp = adjustedMaxHp;
    this.state.isDead = false;
    this.state.isWaveActive = true;
    this.state.wave = startWave;
    this.state.activeBoss = null;
    this.startWave();
  }

  public triggerManualDeath(onStateUpdate: (state: Partial<GameState>) => void) {
    this.clearAllEntities();
    this.damageTickTimer = 0;
    this.state.isDead = true;
    this.state.playerHp = 0;
    this.state.isWaveActive = false;
    onStateUpdate({
      ...this.pendingStateUpdate,
      playerHp: 0,
      isDead: true,
      isWaveActive: false,
      activeBoss: null,
      wave: this.state.wave,
      tier: this.state.tier,
    });
    this.pendingStateUpdate = {};
  }

  public updateUpgrades(upgrades: Upgrade[]) {
    this.upgrades = upgrades;
  }

  public updateGameState(state: GameState) {
    // Process external cash changes (e.g. buying in-run upgrades or claiming rewards)
    if (this.lastSyncedCash !== undefined) {
      const externalCashDelta = state.cash - this.lastSyncedCash;
      if (externalCashDelta !== 0) {
        this.state.cash = Math.max(0, (this.state.cash || 0) + externalCashDelta);
      }
    } else {
      this.state.cash = state.cash;
    }
    this.lastSyncedCash = this.state.cash;

    // Process external cosmic shard changes
    if (state.isDead || state.cosmicShards !== this.lastSyncedShards) {
      this.state.cosmicShards = state.cosmicShards;
    }
    this.lastSyncedShards = this.state.cosmicShards;

    // Process external cell changes (e.g. lab research spending or conversions)
    if (this.lastSyncedCells !== undefined) {
      const externalCellsDelta = state.cells - this.lastSyncedCells;
      if (externalCellsDelta !== 0) {
        this.state.cells = Math.max(0, (this.state.cells || 0) + externalCellsDelta);
      }
    } else {
      this.state.cells = state.cells;
    }
    this.lastSyncedCells = this.state.cells;

    // Determine wave and death state safely without rapid regression loops
    const isNowDead = Boolean(state.isDead || this.state.isDead);
    const resolvedWave = state.isDead 
      ? (state.wave || 1) 
      : (state.wave === 1 ? 1 : Math.max(state.wave || 1, this.state.wave || 1));

    // Preserve real-time simulation state so async React re-renders never roll back enemy kill rewards, HP, or active wave status
    const realTimeCash = this.state.cash;
    const realTimeShards = this.state.cosmicShards;
    const realTimeCells = this.state.cells;
    const realTimeHp = isNowDead ? 0 : this.state.playerHp;
    const realTimeWaveActive = isNowDead ? false : this.state.isWaveActive;
    const realTimeEnemiesRemaining = isNowDead ? 0 : this.state.enemiesRemaining;
    const realTimeActiveBoss = isNowDead ? null : this.state.activeBoss;

    this.state = {
      ...state,
      isDead: isNowDead,
      cash: realTimeCash,
      cosmicShards: realTimeShards,
      cells: realTimeCells,
      playerHp: realTimeHp !== undefined ? realTimeHp : state.playerHp,
      wave: resolvedWave,
      isWaveActive: realTimeWaveActive !== undefined ? realTimeWaveActive : state.isWaveActive,
      enemiesRemaining: realTimeEnemiesRemaining !== undefined ? realTimeEnemiesRemaining : state.enemiesRemaining,
      activeBoss: realTimeActiveBoss !== undefined ? realTimeActiveBoss : state.activeBoss,
    };
  }

  public getEnemies(): Entity[] {
    return this.enemies;
  }

  public getProjectiles(): Entity[] {
    return this.projectiles;
  }

  public isEnemyInRange(enemy: { x: number; y: number }, radius: number = this.state.attackRadius || ATTACK_RADIUS_CONFIG.default): boolean {
    const dx = enemy.x - GAME_WIDTH / 2;
    const dy = enemy.y - GAME_HEIGHT / 2;
    return (dx * dx + dy * dy) <= radius * radius;
  }
}
