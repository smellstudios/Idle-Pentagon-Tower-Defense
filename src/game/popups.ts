/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Container, Graphics, Text } from 'pixi.js';
import { POPUP_CONFIG } from './constants';
import { formatCurrency } from '../utils/format';

export type PopupType = 'damage' | 'critical' | 'player_damage' | 'stardust' | 'shard' | 'text';
export type PopupDensity = 'off' | 'low' | 'medium' | 'high';

export interface PopupSpawnOptions {
  x: number;
  y: number;
  text: string;
  type: PopupType;
  isCrit?: boolean;
  bonusLabel?: string;
  multiplier?: number;
  durationMs?: number;
  useLegacyFormat?: boolean;
}

export class ImpactSpark {
  public graphics: Graphics;
  public active: boolean = false;
  public x: number = 0;
  public y: number = 0;
  public color: number = 0x22c55e;
  public elapsedMs: number = 0;
  public durationMs: number = 260;

  constructor(parent: Container) {
    this.graphics = new Graphics();
    this.graphics.visible = false;
    parent.addChild(this.graphics);
  }

  public init(x: number, y: number, color: number) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.elapsedMs = 0;
    this.active = true;
    this.graphics.visible = true;
  }

  public update(deltaMs: number): boolean {
    if (!this.active) return false;
    this.elapsedMs += deltaMs;
    const t = Math.min(1, this.elapsedMs / this.durationMs);

    this.graphics.clear();
    const radius = 3 + t * 22;
    const alpha = 1 - t;
    const strokeWidth = 3.5 * (1 - t);

    // Flash ring
    this.graphics
      .circle(this.x, this.y, radius)
      .stroke({ color: this.color, width: strokeWidth, alpha });

    // 4 expanding spark particles
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + t * 0.6;
      const sparkDist = radius * 1.25;
      const sx = this.x + Math.cos(angle) * sparkDist;
      const sy = this.y + Math.sin(angle) * sparkDist;
      this.graphics.circle(sx, sy, Math.max(0.5, 2 * (1 - t))).fill({ color: 0xffffff, alpha });
    }

    if (t >= 1) {
      this.active = false;
      this.graphics.visible = false;
      return false;
    }
    return true;
  }
}

export class PopupItem {
  public container: Container;
  public bgGraphics: Graphics;
  public textSprite: Text;
  public active: boolean = false;
  public type: PopupType = 'damage';
  public startX: number = 0;
  public startY: number = 0;
  public jitterX: number = 0;
  public driftX: number = 0;
  public elapsedMs: number = 0;
  public durationMs: number = 600;
  public floatDist: number = 36;
  public baseScale: number = 1.0;
  public numericValue: number = 0;
  public cashValue: number = 0;
  public shardValue: number = 0;
  public isCritCash: boolean = false;
  public bonusLabel: string = '';
  public hitCount: number = 1;
  public baseText: string = '';
  public useLegacyFormat: boolean = false;
  public onImpact?: (x: number, y: number, type: PopupType, amount: number) => void;
  public onMultiImpact?: (x: number, y: number, cash: number, shards: number) => void;

  constructor() {
    this.container = new Container();
    this.bgGraphics = new Graphics();
    this.textSprite = new Text({
      text: '',
      style: {
        fontFamily: 'monospace, "Courier New", Courier, sans-serif',
        fontSize: 9,
        fontWeight: 'bold',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2 },
      },
    });
    this.textSprite.anchor.set(0.5, 0.5);
    this.container.addChild(this.bgGraphics);
    this.container.addChild(this.textSprite);
    this.container.visible = false;
  }

  public init(options: PopupSpawnOptions, initialNumeric: number = 0) {
    this.active = true;
    this.type = options.type;
    this.startX = options.x;
    this.startY = options.y;
    this.elapsedMs = 0;
    this.numericValue = initialNumeric;
    
    this.cashValue = 0;
    this.shardValue = 0;
    this.isCritCash = options.isCrit || false;
    this.bonusLabel = options.bonusLabel || '';
    this.hitCount = 1;
    this.baseText = options.text || '';
    this.useLegacyFormat = options.useLegacyFormat || false;

    if (this.type === 'stardust') this.cashValue = initialNumeric;
    if (this.type === 'shard') this.shardValue = initialNumeric;

    this.durationMs = options.durationMs || (options.type === 'stardust' ? POPUP_CONFIG.cashDurationMs : options.type === 'shard' ? POPUP_CONFIG.cashDurationMs : options.type === 'player_damage' ? 900 : POPUP_CONFIG.damageDurationMs);
    this.floatDist = options.type === 'critical' ? POPUP_CONFIG.floatDistance + 8 : (options.type === 'stardust' || options.type === 'shard' || options.type === 'player_damage' ? 28 : POPUP_CONFIG.floatDistance);
    this.container.rotation = 0;

    // Divergent trajectories for damage popups
    if (options.type === 'stardust' || options.type === 'shard') {
      this.jitterX = options.type === 'stardust' ? -12 + (Math.random() * 8) : 12 - (Math.random() * 8);
      this.driftX = 0;
    } else if (options.type === 'player_damage') {
      this.jitterX = (Math.random() - 0.5) * 6;
      this.driftX = 0;
    } else if (options.type === 'text') {
      this.jitterX = 0;
      this.driftX = 0;
      this.floatDist = 28;
    } else {
      this.jitterX = -10 - Math.random() * 8;
      this.driftX = -24 - Math.random() * 16;
    }

    this.refreshVisuals(options.text);

    this.container.x = this.startX + this.jitterX;
    this.container.y = this.startY;
    this.container.alpha = 1;
    this.container.scale.set(this.baseScale);
    this.container.visible = true;
  }

  public mergeCurrency(type: PopupType, amount: number, isCrit: boolean = false) {
    if (type === 'stardust') {
      this.cashValue += amount;
      this.numericValue = this.cashValue;
      if (isCrit) this.isCritCash = true;
    } else if (type === 'shard') {
      this.shardValue += amount;
      this.numericValue = this.shardValue;
    }

    // Reset stay duration partially to allow reading
    this.elapsedMs = Math.min(this.elapsedMs, 150);
    this.refreshVisuals();
  }

  private refreshVisuals(manualText?: string) {
    this.bgGraphics.clear();

    if (this.type === 'stardust' || this.type === 'shard') {
      let displayText = "";
      if (this.cashValue > 0) displayText += `+$${formatCurrency(this.cashValue, this.useLegacyFormat)}`;
      if (this.shardValue > 0) {
        if (displayText) displayText += " ";
        displayText += `+${this.shardValue} 💠`;
      }
      if (this.isCritCash && this.cashValue > 0 && this.shardValue === 0) {
        displayText += " CRIT!";
      }
      if (this.bonusLabel && this.cashValue > 0 && this.shardValue === 0 && !this.isCritCash) {
        displayText += ` ${this.bonusLabel}`;
      }

      this.textSprite.text = displayText || manualText || '';
      this.textSprite.style.fontSize = 10;
      
      // Determine style based on mix
      if (this.shardValue > 0 && this.cashValue > 0) {
        this.textSprite.style.fill = 0xfef08a; // Light yellow mix
        this.textSprite.style.stroke = { color: 0x422006, width: 2 };
        
        const badgeWidth = Math.max(50, this.textSprite.text.length * 8 + 12);
        this.bgGraphics
          .roundRect(-badgeWidth / 2, -10, badgeWidth, 20, 10)
          .fill({ color: 0x1c1917, alpha: 0.9 })
          .stroke({ color: 0xca8a04, width: 1.5 });
      } else if (this.shardValue > 0) {
        this.textSprite.style.fill = 0xf3e8ff;
        this.textSprite.style.stroke = { color: 0x581c87, width: 2 };
        const badgeWidth = Math.max(48, this.textSprite.text.length * 8 + 10);
        this.bgGraphics
          .roundRect(-badgeWidth / 2, -10, badgeWidth, 20, 10)
          .fill({ color: 0x2e1065, alpha: 0.88 })
          .stroke({ color: 0xa855f7, width: 1.5 });
      } else {
        this.textSprite.style.fill = 0xa7f3d0;
        this.textSprite.style.stroke = { color: 0x064e3b, width: 2 };
        const badgeWidth = Math.max(40, this.textSprite.text.length * 7.5 + 10);
        this.bgGraphics
          .roundRect(-badgeWidth / 2, -10, badgeWidth, 20, 10)
          .fill({ color: 0x022c22, alpha: 0.88 })
          .stroke({ color: 0x10b981, width: 1.5 });
      }
      this.baseScale = 1.1;
    } else if (this.type === 'player_damage') {
      const formatted = formatCurrency(Math.max(0.1, Math.round(this.numericValue * 10) / 10));
      this.textSprite.text = `-${formatted}`;
      this.textSprite.style.fontSize = 11;
      this.textSprite.style.fill = 0xff4d4f; // Danger Crimson
      this.textSprite.style.stroke = { color: 0x450a0a, width: 2.5 };
      const badgeWidth = Math.max(38, this.textSprite.text.length * 7.5 + 12);
      this.bgGraphics
        .roundRect(-badgeWidth / 2, -10, badgeWidth, 20, 6)
        .fill({ color: 0x450a0a, alpha: 0.9 })
        .stroke({ color: 0xef4444, width: 1.5 });
      this.baseScale = 1.15;
    } else if (this.type === 'critical') {
      this.textSprite.text = manualText || "";
      this.textSprite.style.fontSize = 11;
      this.textSprite.style.fill = POPUP_CONFIG.colors.crit;
      this.textSprite.style.stroke = { color: POPUP_CONFIG.colors.critStroke, width: 2.5 };
      this.baseScale = 1.15;
    } else if (this.type === 'text') {
      this.textSprite.text = manualText || "";
      this.textSprite.style.fontSize = 10;
      this.textSprite.style.fill = 0xffffff;
      this.textSprite.style.stroke = { color: 0x000000, width: 2.5 };
      this.baseScale = 1.1;
    } else {
      this.textSprite.text = manualText || "";
      this.textSprite.style.fontSize = 9;
      this.textSprite.style.fill = POPUP_CONFIG.colors.damage;
      this.textSprite.style.stroke = { color: POPUP_CONFIG.colors.damageStroke, width: 2 };
      this.baseScale = 1.0;
    }
  }

  public aggregateDamage(addedDamage: number, isCrit: boolean = false) {
    this.numericValue += addedDamage;
    const formatted = formatCurrency(Math.max(1, Math.round(this.numericValue * 10) / 10));
    this.textSprite.text = isCrit || this.type === 'critical' ? `CRIT ${formatted}` : formatted;
    if (isCrit && this.type !== 'critical') {
      this.type = 'critical';
      this.textSprite.style.fill = POPUP_CONFIG.colors.crit;
      this.textSprite.style.stroke = { color: POPUP_CONFIG.colors.critStroke, width: 2.5 };
      this.baseScale = 1.2;
    }
    // Maintain visibility and reset progress slightly so continuous damage sums smoothly
    this.elapsedMs = Math.min(this.elapsedMs, 80);
    this.container.scale.set(this.baseScale * 1.25);
  }

  public aggregatePlayerDamage(addedDamage: number) {
    this.numericValue += addedDamage;
    this.refreshVisuals();
    this.elapsedMs = Math.min(this.elapsedMs, 100);
    this.container.scale.set(this.baseScale * 1.2);
  }

  public aggregateText(newText: string, colorHex?: number) {
    this.hitCount++;
    if (!this.baseText) {
      this.baseText = newText;
    } else if (newText.length > this.baseText.length) {
      this.baseText = newText;
    }
    this.textSprite.text = `${this.baseText} (x${this.hitCount})`;
    if (colorHex !== undefined) {
      this.textSprite.style.fill = colorHex;
    }
    this.elapsedMs = Math.min(this.elapsedMs, 100);
    this.container.scale.set(this.baseScale * 1.25);
  }

  public update(deltaMs: number): boolean {
    if (!this.active) return false;

    this.elapsedMs += deltaMs;
    const progress = Math.min(1, this.elapsedMs / this.durationMs);

    // CLEAN FLOAT & FADE ANIMATION FOR CASH, COSMIC SHARDS & PLAYER DAMAGE
    if (this.type === 'stardust' || this.type === 'shard' || this.type === 'player_damage') {
      const floatDist = 28; // ~0.3 inches
      const easeOutQuad = 1 - (1 - progress) * (1 - progress);

      this.container.x = this.startX + this.jitterX;
      this.container.y = this.startY - easeOutQuad * floatDist;
      this.container.rotation = 0;

      // Pop scale effect during first 150ms
      if (this.elapsedMs < 150) {
        const popT = this.elapsedMs / 150;
        const popScale = 1 + Math.sin(popT * Math.PI) * (this.type === 'player_damage' ? 0.35 : 0.22);
        this.container.scale.set(this.baseScale * popScale);
      } else {
        this.container.scale.set(this.baseScale);
      }

      // Smooth fade out in the second half of popup lifecycle
      if (progress > 0.5) {
        const fadeProgress = (progress - 0.5) / 0.5;
        this.container.alpha = Math.max(0, 1 - fadeProgress);
      } else {
        this.container.alpha = 1.0;
      }

      if (progress >= 1) {
        this.reset();
        return false;
      }
      return true;
    }

    // Standard floating damage numbers
    const easeOutQuad = 1 - (1 - progress) * (1 - progress);
    this.container.y = this.startY - easeOutQuad * this.floatDist;
    this.container.x = this.startX + this.jitterX + easeOutQuad * this.driftX + Math.sin(progress * Math.PI * 2) * 1.5;

    if (this.elapsedMs < 140) {
      const popT = this.elapsedMs / 140;
      const popScale = 1 + Math.sin(popT * Math.PI) * 0.28;
      this.container.scale.set(this.baseScale * popScale);
    } else {
      this.container.scale.set(this.baseScale);
    }

    if (progress > 0.55) {
      const fadeProgress = (progress - 0.55) / 0.45;
      this.container.alpha = Math.max(0, 1 - fadeProgress);
    } else {
      this.container.alpha = 1;
    }

    if (progress >= 1) {
      this.reset();
      return false;
    }

    return true;
  }

  public reset() {
    this.active = false;
    this.container.visible = false;
    this.container.alpha = 1;
    this.container.scale.set(1);
    this.container.rotation = 0;
    this.bgGraphics.clear();
    this.textSprite.text = '';
    this.elapsedMs = 0;
    this.numericValue = 0;
    this.cashValue = 0;
    this.shardValue = 0;
    this.isCritCash = false;
    this.bonusLabel = '';
    this.hitCount = 1;
    this.baseText = '';
    this.useLegacyFormat = false;
    this.baseScale = 1.0;
  }
}

export class PopupManager {
  public rootContainer: Container;
  private pool: PopupItem[] = [];
  private activeItems: PopupItem[] = [];
  private impactSparks: ImpactSpark[] = [];
  private frameSpawnCount: number = 0;
  private accumulatedDeltaMs: number = 0;
  private readonly STEP_30FPS_MS: number = 33.33; // 30 FPS update interval
  public density: PopupDensity = 'high';
  public onCurrencyImpact?: (type: PopupType, amount: number) => void;

  constructor(parent: Container, initialCapacity: number = 80) {
    this.rootContainer = new Container();
    parent.addChild(this.rootContainer);

    for (let i = 0; i < initialCapacity; i++) {
      const item = new PopupItem();
      item.onImpact = (x, y, type, amount) => this.spawnImpact(x, y, type === 'stardust' ? 0x22c55e : 0xa855f7, type, amount);
      item.onMultiImpact = (x, y, cash, shards) => {
        if (cash > 0) this.spawnImpact(x, y, 0x22c55e, 'stardust', cash);
        if (shards > 0) this.spawnImpact(x, y, 0xa855f7, 'shard', shards);
      };
      this.rootContainer.addChild(item.container);
      this.pool.push(item);
    }

    for (let i = 0; i < 15; i++) {
      this.impactSparks.push(new ImpactSpark(this.rootContainer));
    }
  }

  public spawnImpact(x: number, y: number, color: number, type?: PopupType, amount?: number) {
    const spark = this.impactSparks.find(s => !s.active);
    if (spark) {
      spark.init(x, y, color);
    }
    if (type && amount && this.onCurrencyImpact) {
      this.onCurrencyImpact(type, amount);
    }
  }

  public beginFrame() {
    this.frameSpawnCount = 0;
  }

  public setDensity(density: PopupDensity) {
    this.density = density;
  }

  private getNextAvailable(): PopupItem {
    const item = this.pool.find(p => !p.active);
    if (item) return item;

    const newItem = new PopupItem();
    newItem.onImpact = (x, y, type, amount) => this.spawnImpact(x, y, type === 'stardust' ? 0x22c55e : 0xa855f7, type, amount);
    this.rootContainer.addChild(newItem.container);
    this.pool.push(newItem);
    return newItem;
  }

  public formatNumber(value: number, useLegacyFormat: boolean = false): string {
    return formatCurrency(value, useLegacyFormat);
  }

  public spawnText(x: number, y: number, text: string, colorHex: number = 0xef4444): PopupItem | null {
    if (this.density === 'off') return null;

    const cleanNewText = text.replace(/\s*\(x\d+\)$/, '');

    // 1. Search for matching or nearby active text popup to aggregate/refresh
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const active = this.activeItems[i];
      if (active.active && active.type === 'text' && active.elapsedMs < 550) {
        const dx = active.startX - x;
        const dy = active.startY - y;
        const distSq = dx * dx + dy * dy;

        const cleanExistingBase = active.baseText ? active.baseText.replace(/\s*\(x\d+\)$/, '') : active.textSprite.text.replace(/\s*\(x\d+\)$/, '');

        // If same ailment or nearby status within 40px
        if (distSq < 40 * 40 && (cleanExistingBase === cleanNewText || distSq < 22 * 22)) {
          active.aggregateText(cleanNewText, colorHex);
          return active;
        }
      }
    }

    // 2. Limit total active text popups on screen (max 6 active status text popups)
    const activeTextItems = this.activeItems.filter(item => item.active && item.type === 'text');
    if (activeTextItems.length >= 6) {
      let nearest: PopupItem | null = null;
      let minSq = Infinity;
      for (const item of activeTextItems) {
        const dx = item.startX - x;
        const dy = item.startY - y;
        const distSq = dx * dx + dy * dy;
        if (distSq < minSq) {
          minSq = distSq;
          nearest = item;
        }
      }
      if (nearest) {
        nearest.aggregateText(cleanNewText, colorHex);
        return nearest;
      }
    }

    let offsetY = -10;
    for (const active of activeTextItems) {
      if (active.elapsedMs < 350) {
        if (Math.abs(active.startX - x) < 36 && Math.abs(active.startY - (y + offsetY)) < 18) {
          offsetY -= 14;
        }
      }
    }

    const item = this.getNextAvailable();
    item.init({
      x,
      y: y + offsetY,
      text,
      type: 'text',
      isCrit: true,
      durationMs: 850,
    });
    item.textSprite.style.fill = colorHex;
    item.baseText = cleanNewText;
    item.hitCount = 1;
    this.activeItems.push(item);
    this.frameSpawnCount++;
    return item;
  }

  public spawnDamage(x: number, y: number, damage: number, isCrit: boolean = false, multiplier: number = 1.5): PopupItem | null {
    if (this.density === 'off') return null;

    // 1. Search for a nearby active damage popup to aggregate into (within 45px, elapsedMs < 500)
    let closestItem: PopupItem | null = null;
    let closestDistSq = 45 * 45; // 45px radius

    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const existing = this.activeItems[i];
      if (existing.active && (existing.type === 'damage' || existing.type === 'critical') && existing.elapsedMs < 500) {
        const dx = existing.startX - x;
        const dy = existing.startY - y;
        const distSq = dx * dx + dy * dy;
        if (distSq < closestDistSq) {
          closestDistSq = distSq;
          closestItem = existing;
        }
      }
    }

    if (closestItem) {
      closestItem.aggregateDamage(damage, isCrit);
      return closestItem;
    }

    // 2. Count current active damage popups
    const activeDamageItems = this.activeItems.filter(
      item => item.active && (item.type === 'damage' || item.type === 'critical')
    );

    // If active damage popups limit reached (e.g. 10 max active), aggregate into closest active damage popup on screen
    if (activeDamageItems.length >= 10) {
      let fallbackItem: PopupItem | null = null;
      let minSq = Infinity;
      for (const item of activeDamageItems) {
        const dx = item.startX - x;
        const dy = item.startY - y;
        const distSq = dx * dx + dy * dy;
        if (distSq < minSq) {
          minSq = distSq;
          fallbackItem = item;
        }
      }
      if (fallbackItem) {
        fallbackItem.aggregateDamage(damage, isCrit);
        return fallbackItem;
      }
    }

    const maxBudget = POPUP_CONFIG.maxPerFrame[this.density];
    if (this.frameSpawnCount >= maxBudget) {
      if (activeDamageItems.length > 0) {
        activeDamageItems[0].aggregateDamage(damage, isCrit);
        return activeDamageItems[0];
      }
      return null;
    }

    const item = this.getNextAvailable();
    const formattedDmg = formatCurrency(Math.max(1, Math.round(damage * 10) / 10));
    const text = isCrit ? `CRIT ${formattedDmg}` : formattedDmg;

    item.init({
      x,
      y: y - 8,
      text,
      type: isCrit ? 'critical' : 'damage',
      isCrit,
      multiplier,
    }, damage);

    this.activeItems.push(item);
    this.frameSpawnCount++;
    return item;
  }

  public spawnPlayerDamage(x: number, y: number, damage: number): PopupItem | null {
    if (this.density === 'off' || damage <= 0) return null;

    // Aggregate into recent player damage popup within 35px & 450ms
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const existing = this.activeItems[i];
      if (existing.active && existing.type === 'player_damage' && existing.elapsedMs < 450) {
        const dx = existing.startX - x;
        const dy = existing.startY - y;
        if (dx * dx + dy * dy < 35 * 35) {
          existing.aggregatePlayerDamage(damage);
          return existing;
        }
      }
    }

    const item = this.getNextAvailable();
    const formattedDmg = formatCurrency(Math.max(0.1, Math.round(damage * 10) / 10));
    item.init({
      x,
      y: y - 6,
      text: `-${formattedDmg}`,
      type: 'player_damage',
      durationMs: 850,
    }, damage);

    this.activeItems.push(item);
    this.frameSpawnCount++;
    return item;
  }

  public spawnStardust(x: number, y: number, amount: number, isCritDrop: boolean = false, useLegacyFormat: boolean = false, bonusLabel?: string): PopupItem | null {
    if (this.density === 'off') return null;

    // Merge logic: check for nearby currency popups in active floating phase
    for (const active of this.activeItems) {
      if (active.active && (active.type === 'stardust' || active.type === 'shard') && active.elapsedMs < 500) {
        const distSq = Math.pow(active.startX - x, 2) + Math.pow(active.startY - y, 2);
        if (distSq < 20 * 20) {
          active.mergeCurrency('stardust', amount, isCritDrop);
          return active;
        }
      }
    }

    const item = this.getNextAvailable();
    const formattedDust = formatCurrency(amount, useLegacyFormat);
    let text = isCritDrop ? `+$${formattedDust} CRIT!` : `+$${formattedDust}`;
    if (bonusLabel && !isCritDrop) text += ` ${bonusLabel}`;

    item.init({
      x,
      y: y + 8, // Offset cash slightly down
      text,
      type: 'stardust',
      isCrit: isCritDrop,
      bonusLabel,
      useLegacyFormat,
    }, amount);

    this.activeItems.push(item);
    return item;
  }

  public spawnCash(x: number, y: number, amount: number, isCritDrop: boolean = false, useLegacyFormat: boolean = false, bonusLabel?: string): PopupItem | null {
    return this.spawnStardust(x, y, amount, isCritDrop, useLegacyFormat, bonusLabel);
  }

  public spawnShard(x: number, y: number, amount: number = 1, bonusLabel?: string): PopupItem | null {
    if (this.density === 'off') return null;

    // Merge logic: check for nearby currency popups in active floating phase
    for (const active of this.activeItems) {
      if (active.active && (active.type === 'stardust' || active.type === 'shard') && active.elapsedMs < 500) {
        const distSq = Math.pow(active.startX - x, 2) + Math.pow(active.startY - y, 2);
        if (distSq < 20 * 20) {
          active.mergeCurrency('shard', amount);
          return active;
        }
      }
    }

    const item = this.getNextAvailable();
    let text = amount > 1 ? `+${amount} SHARDS 💠` : `+1 SHARD 💠`;
    if (bonusLabel) text = `+${amount} 💠 ${bonusLabel}`;

    item.init({
      x,
      y: y - 22, // Offset shard further up
      text,
      type: 'shard',
      bonusLabel,
    }, amount);

    this.activeItems.push(item);
    return item;
  }

  public flushPendingCurrency() {
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const item = this.activeItems[i];
      if (item.active && (item.type === 'stardust' || item.type === 'shard')) {
        if (this.onCurrencyImpact && item.numericValue > 0) {
          this.onCurrencyImpact(item.type, item.numericValue);
        }
        item.reset();
        this.activeItems.splice(i, 1);
      }
    }
  }

  public update(deltaMs: number) {
    this.accumulatedDeltaMs += deltaMs;
    // Cap accumulated delta to 150ms to prevent huge jumps
    if (this.accumulatedDeltaMs > 150) this.accumulatedDeltaMs = 150;

    if (this.accumulatedDeltaMs >= this.STEP_30FPS_MS) {
      const stepMs = this.accumulatedDeltaMs;
      this.accumulatedDeltaMs = 0;

      for (let i = this.activeItems.length - 1; i >= 0; i--) {
        const item = this.activeItems[i];
        const stillActive = item.update(stepMs);
        if (!stillActive) {
          this.activeItems.splice(i, 1);
        }
      }

      for (let i = this.impactSparks.length - 1; i >= 0; i--) {
        this.impactSparks[i].update(stepMs);
      }
    }
  }

  public clear() {
    for (const item of this.pool) {
      item.reset();
    }
    this.activeItems = [];
    this.frameSpawnCount = 0;
  }

  public getActiveCount(): number {
    return this.activeItems.length;
  }

  public getPoolSize(): number {
    return this.pool.length;
  }
}
