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
  public color: number = 0x34d399;
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
    const radius = 3 + t * 24;
    const alpha = 1 - t;
    const strokeWidth = 3 * (1 - t);

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
  public durationMs: number = 1800;
  public floatDist: number = 38;
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
        fontFamily: '"JetBrains Mono", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace',
        fontSize: 10,
        fontWeight: '800',
        fill: 0xffffff,
        stroke: { color: 0x000000, width: 2.8, join: 'round' },
      },
    });
    this.textSprite.roundPixels = true;
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

    // Generous lingering lifecycles (1.4s to 1.8s) for maximum combat readability
    if (options.durationMs) {
      this.durationMs = options.durationMs;
    } else if (this.type === 'stardust' || this.type === 'shard') {
      this.durationMs = POPUP_CONFIG.cashDurationMs;
    } else if (this.type === 'player_damage') {
      this.durationMs = POPUP_CONFIG.playerDamageDurationMs;
    } else if (this.type === 'text') {
      this.durationMs = POPUP_CONFIG.statusDurationMs;
    } else if (this.type === 'critical') {
      this.durationMs = POPUP_CONFIG.damageDurationMs + 200;
    } else {
      this.durationMs = POPUP_CONFIG.damageDurationMs;
    }

    // Buoyant float distances
    if (this.type === 'critical') {
      this.floatDist = POPUP_CONFIG.floatDistance + 6;
    } else if (this.type === 'stardust' || this.type === 'shard') {
      this.floatDist = 38;
    } else if (this.type === 'player_damage') {
      this.floatDist = 34;
    } else if (this.type === 'text') {
      this.floatDist = 32;
    } else {
      this.floatDist = POPUP_CONFIG.floatDistance;
    }

    this.container.rotation = 0;

    // Minimal horizontal jitter so text remains anchored and readable
    if (options.type === 'stardust' || options.type === 'shard') {
      this.jitterX = (Math.random() - 0.5) * 8;
      this.driftX = 0;
    } else if (options.type === 'player_damage') {
      this.jitterX = (Math.random() - 0.5) * 6;
      this.driftX = 0;
    } else if (options.type === 'text') {
      this.jitterX = 0;
      this.driftX = 0;
    } else {
      this.jitterX = -8 - Math.random() * 8;
      this.driftX = -16 - Math.random() * 12;
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

    // Reset elapsedMs partially so player has full ~1.6s remaining window to read the combined total
    this.elapsedMs = Math.min(this.elapsedMs, 200);
    this.refreshVisuals();
    this.container.scale.set(this.baseScale * 1.25);
  }

  public refreshVisuals(manualText?: string) {
    this.bgGraphics.clear();

    if (this.type === 'stardust' || this.type === 'shard') {
      let displayText = '';
      if (this.cashValue > 0) displayText += `+$${formatCurrency(this.cashValue, this.useLegacyFormat)}`;
      if (this.shardValue > 0) {
        if (displayText) displayText += ' ';
        displayText += `+${this.shardValue} 💠`;
      }
      if (this.isCritCash && this.cashValue > 0 && this.shardValue === 0) {
        displayText += ' CRIT!';
      }
      if (this.bonusLabel && this.cashValue > 0 && this.shardValue === 0 && !this.isCritCash) {
        displayText += ` ${this.bonusLabel}`;
      }

      this.textSprite.text = displayText || manualText || '';
      this.textSprite.style.fontSize = 11;

      // Minimalist crisp typography with high-contrast outlines (no chunky pill backgrounds)
      if (this.shardValue > 0 && this.cashValue > 0) {
        // Dual Currency
        this.textSprite.style.fill = 0xfef08a; // Golden Yellow
        this.textSprite.style.stroke = { color: 0x451a03, width: 3.0 };
      } else if (this.shardValue > 0) {
        // Shards alone
        this.textSprite.style.fill = POPUP_CONFIG.colors.shard; // Electric Amethyst
        this.textSprite.style.stroke = { color: POPUP_CONFIG.colors.shardStroke, width: 2.8 };
      } else {
        // Cash alone
        if (this.isCritCash) {
          this.textSprite.style.fill = POPUP_CONFIG.colors.crit;
          this.textSprite.style.stroke = { color: POPUP_CONFIG.colors.critStroke, width: 3.0 };
        } else {
          this.textSprite.style.fill = POPUP_CONFIG.colors.cash; // Mint Emerald
          this.textSprite.style.stroke = { color: POPUP_CONFIG.colors.cashStroke, width: 2.8 };
        }
      }
      this.baseScale = 1.05;
    } else if (this.type === 'player_damage') {
      const formatted = formatCurrency(Math.max(0.1, Math.round(this.numericValue * 10) / 10));
      this.textSprite.text = `-${formatted} HP`;
      this.textSprite.style.fontSize = 11;
      this.textSprite.style.fill = POPUP_CONFIG.colors.playerDamage;
      this.textSprite.style.stroke = { color: POPUP_CONFIG.colors.playerDamageStroke, width: 3.0 };
      this.baseScale = 1.1;
    } else if (this.type === 'critical') {
      this.textSprite.text = manualText || '';
      this.textSprite.style.fontSize = 11;
      this.textSprite.style.fill = POPUP_CONFIG.colors.crit;
      this.textSprite.style.stroke = { color: POPUP_CONFIG.colors.critStroke, width: 3.0 };
      this.baseScale = 1.1;
    } else if (this.type === 'text') {
      const rawText = manualText || this.baseText || '';
      this.textSprite.text = rawText;
      this.textSprite.style.fontSize = 10;
      this.applyAilmentTheme(rawText);
      this.baseScale = 1.05;
    } else {
      this.textSprite.text = manualText || '';
      this.textSprite.style.fontSize = 9;
      this.textSprite.style.fill = POPUP_CONFIG.colors.damage;
      this.textSprite.style.stroke = { color: POPUP_CONFIG.colors.damageStroke, width: 2.5 };
      this.baseScale = 1.0;
    }
  }

  private applyAilmentTheme(text: string) {
    const upper = text.toUpperCase();
    if (upper.includes('POISON') || upper.includes('TOXIC') || upper.includes('SWAMP') || upper.includes('MIASMA')) {
      this.textSprite.style.fill = 0x22c55e; // Biohazard Lime
      this.textSprite.style.stroke = { color: 0x052e16, width: 2.8 };
    } else if (upper.includes('DECAY')) {
      this.textSprite.style.fill = 0x4ade80; // Toxic Green
      this.textSprite.style.stroke = { color: 0x052e16, width: 2.8 };
    } else if (upper.includes('SHRAPNEL') || upper.includes('BLEED') || upper.includes('GORE')) {
      this.textSprite.style.fill = 0xf43f5e; // Crimson Gore
      this.textSprite.style.stroke = { color: 0x4c0519, width: 2.8 };
    } else if (upper.includes('CHAIN') || upper.includes('LIGHTNING') || upper.includes('ZAP') || upper.includes('EMP')) {
      this.textSprite.style.fill = 0x22d3ee; // Cyber Cyan
      this.textSprite.style.stroke = { color: 0x083344, width: 2.8 };
    } else if (upper.includes('SHIELD') || upper.includes('BLOCK') || upper.includes('DEFLECT')) {
      this.textSprite.style.fill = 0x38bdf8; // Sky Blue
      this.textSprite.style.stroke = { color: 0x082f49, width: 2.8 };
    } else if (upper.includes('CALAMITY') || upper.includes('VOID') || upper.includes('PHAS') || upper.includes('BLINK')) {
      this.textSprite.style.fill = 0xc084fc; // Cosmic Purple
      this.textSprite.style.stroke = { color: 0x3b0764, width: 2.8 };
    } else if (upper.includes('GOLD') || upper.includes('BOUNTY') || upper.includes('LUCKY') || upper.includes('INTEREST')) {
      this.textSprite.style.fill = 0xfacc15; // Golden Amber
      this.textSprite.style.stroke = { color: 0x451a03, width: 2.8 };
    } else if (upper.includes('CELL') || upper.includes('FUEL') || upper.includes('BIO')) {
      this.textSprite.style.fill = 0x14b8a6; // Teal Cell
      this.textSprite.style.stroke = { color: 0x042f2e, width: 2.8 };
    } else if (upper.includes('HEAL') || upper.includes('RECOVERY') || upper.includes('LIFE')) {
      this.textSprite.style.fill = 0x10b981; // Vital Emerald
      this.textSprite.style.stroke = { color: 0x064e3b, width: 2.8 };
    } else {
      this.textSprite.style.fill = 0xf8fafc;
      this.textSprite.style.stroke = { color: 0x0f172a, width: 2.8 };
    }
  }

  public aggregateDamage(addedDamage: number, isCrit: boolean = false) {
    this.numericValue += addedDamage;
    const formatted = formatCurrency(Math.max(1, Math.round(this.numericValue * 10) / 10));
    this.textSprite.text = isCrit || this.type === 'critical' ? `CRIT ${formatted}` : formatted;
    if (isCrit && this.type !== 'critical') {
      this.type = 'critical';
      this.textSprite.style.fill = POPUP_CONFIG.colors.crit;
      this.textSprite.style.stroke = { color: POPUP_CONFIG.colors.critStroke, width: 3.0 };
      this.baseScale = 1.15;
    }
    // Refresh reading timer so accumulated numbers remain on screen
    this.elapsedMs = Math.min(this.elapsedMs, 180);
    this.container.scale.set(this.baseScale * 1.22);
  }

  public aggregatePlayerDamage(addedDamage: number) {
    this.numericValue += addedDamage;
    this.refreshVisuals();
    this.elapsedMs = Math.min(this.elapsedMs, 200);
    this.container.scale.set(this.baseScale * 1.25);
  }

  public aggregateText(newText: string, colorHex?: number) {
    this.hitCount++;
    if (!this.baseText) {
      this.baseText = newText;
    } else if (newText.length > this.baseText.length) {
      this.baseText = newText;
    }

    // Smart stacked badges: e.g. "☣️ POISON LINGER (x3)"
    this.textSprite.text = `${this.baseText} (x${this.hitCount})`;
    if (colorHex !== undefined) {
      this.textSprite.style.fill = colorHex;
      this.textSprite.style.stroke = { color: 0x020617, width: 2.8 };
    } else {
      this.applyAilmentTheme(this.baseText);
    }

    // Refresh linger duration so player can see the stacked hit count
    this.elapsedMs = Math.min(this.elapsedMs, 200);
    this.container.scale.set(this.baseScale * 1.25);
  }

  public update(deltaMs: number): boolean {
    if (!this.active) return false;

    this.elapsedMs += deltaMs;
    const progress = Math.min(1, this.elapsedMs / this.durationMs);

    // Smooth cubic ease-out upward glide
    const easeOutCubic = 1 - Math.pow(1 - progress, 3);
    this.container.y = this.startY - easeOutCubic * this.floatDist;
    this.container.x = this.startX + this.jitterX + (this.driftX !== 0 ? easeOutCubic * this.driftX : 0);
    this.container.rotation = 0;

    // Elastic pop scale during first 140ms
    if (this.elapsedMs < 140) {
      const popT = this.elapsedMs / 140;
      const popIntensity = (this.type === 'critical' || this.type === 'player_damage') ? 0.30 : 0.22;
      const popScale = 1 + Math.sin(popT * Math.PI) * popIntensity;
      this.container.scale.set(this.baseScale * popScale);
    } else {
      this.container.scale.set(this.baseScale);
    }

    // Extended high-readability curve (1.4s to 1.8s)
    // 100% full solid opacity during the first 65% of lifecycle (~1.1s)
    // Smooth quadratic ease-out fade in the final 35% of life
    if (progress > 0.65) {
      const fadeProgress = (progress - 0.65) / 0.35;
      this.container.alpha = Math.max(0, 1 - fadeProgress * fadeProgress);
    } else {
      this.container.alpha = 1.0;
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
  public density: PopupDensity = 'high';
  public onCurrencyImpact?: (type: PopupType, amount: number) => void;

  constructor(parent: Container, initialCapacity: number = 120) {
    this.rootContainer = new Container();
    parent.addChild(this.rootContainer);

    for (let i = 0; i < initialCapacity; i++) {
      const item = new PopupItem();
      item.onImpact = (x, y, type, amount) => this.spawnImpact(x, y, type === 'stardust' ? 0x34d399 : 0xc084fc, type, amount);
      item.onMultiImpact = (x, y, cash, shards) => {
        if (cash > 0) this.spawnImpact(x, y, 0x34d399, 'stardust', cash);
        if (shards > 0) this.spawnImpact(x, y, 0xc084fc, 'shard', shards);
      };
      this.rootContainer.addChild(item.container);
      this.pool.push(item);
    }

    for (let i = 0; i < 20; i++) {
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
    newItem.onImpact = (x, y, type, amount) => this.spawnImpact(x, y, type === 'stardust' ? 0x34d399 : 0xc084fc, type, amount);
    this.rootContainer.addChild(newItem.container);
    this.pool.push(newItem);
    return newItem;
  }

  public formatNumber(value: number, useLegacyFormat: boolean = false): string {
    return formatCurrency(value, useLegacyFormat);
  }

  public spawnText(x: number, y: number, text: string, colorHex?: number): PopupItem | null {
    if (this.density === 'off') return null;

    const cleanNewText = text.replace(/\s*\(x\d+\)$/, '');

    // 1. Search for matching or nearby active status popup to aggregate into stacked multiplier
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const active = this.activeItems[i];
      if (active.active && active.type === 'text' && active.elapsedMs < 1200) {
        const dx = active.startX - x;
        const dy = active.startY - y;
        const distSq = dx * dx + dy * dy;

        const cleanExistingBase = active.baseText ? active.baseText.replace(/\s*\(x\d+\)$/, '') : active.textSprite.text.replace(/\s*\(x\d+\)$/, '');

        // If same ailment within 48px or adjacent status within 28px
        if (distSq < 48 * 48 && (cleanExistingBase === cleanNewText || distSq < 28 * 28)) {
          active.aggregateText(cleanNewText, colorHex);
          return active;
        }
      }
    }

    // 2. Limit total active status popups on screen to maintain clean combat visual hierarchy (max 8)
    const activeTextItems = this.activeItems.filter(item => item.active && item.type === 'text');
    if (activeTextItems.length >= 8) {
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

    // Stagger vertically to avoid overlap if close to existing text
    let offsetY = -10;
    for (const active of activeTextItems) {
      if (active.elapsedMs < 600) {
        if (Math.abs(active.startX - x) < 36 && Math.abs(active.startY - (y + offsetY)) < 18) {
          offsetY -= 15;
        }
      }
    }

    const item = this.getNextAvailable();
    item.init({
      x,
      y: y + offsetY,
      text: cleanNewText,
      type: 'text',
      isCrit: true,
      durationMs: POPUP_CONFIG.statusDurationMs,
    });
    if (colorHex !== undefined) {
      item.textSprite.style.fill = colorHex;
      item.textSprite.style.stroke = { color: 0x020617, width: 2.8 };
    }
    item.baseText = cleanNewText;
    item.hitCount = 1;
    this.activeItems.push(item);
    this.frameSpawnCount++;
    return item;
  }

  public spawnDamage(x: number, y: number, damage: number, isCrit: boolean = false, multiplier: number = 1.5): PopupItem | null {
    if (this.density === 'off') return null;

    // 1. Search for a nearby active damage popup to aggregate into (within 48px, elapsedMs < 1000)
    let closestItem: PopupItem | null = null;
    let closestDistSq = 48 * 48;

    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const existing = this.activeItems[i];
      if (existing.active && (existing.type === 'damage' || existing.type === 'critical') && existing.elapsedMs < 1000) {
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

    // 2. Count current active damage popups (limit to 12 max active on screen)
    const activeDamageItems = this.activeItems.filter(
      item => item.active && (item.type === 'damage' || item.type === 'critical')
    );

    if (activeDamageItems.length >= 12) {
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
      durationMs: isCrit ? POPUP_CONFIG.damageDurationMs + 200 : POPUP_CONFIG.damageDurationMs,
    }, damage);

    this.activeItems.push(item);
    this.frameSpawnCount++;
    return item;
  }

  public spawnPlayerDamage(x: number, y: number, damage: number): PopupItem | null {
    if (this.density === 'off' || damage <= 0) return null;

    // Aggregate into recent player damage popup within 40px & 1100ms
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const existing = this.activeItems[i];
      if (existing.active && existing.type === 'player_damage' && existing.elapsedMs < 1100) {
        const dx = existing.startX - x;
        const dy = existing.startY - y;
        if (dx * dx + dy * dy < 40 * 40) {
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
      durationMs: POPUP_CONFIG.playerDamageDurationMs,
    }, damage);

    this.activeItems.push(item);
    this.frameSpawnCount++;
    return item;
  }

  public spawnStardust(x: number, y: number, amount: number, isCritDrop: boolean = false, useLegacyFormat: boolean = false, bonusLabel?: string): PopupItem | null {
    if (this.density === 'off') return null;

    // Merge logic: check for nearby currency popups within 36px in active floating phase (up to 1200ms)
    for (const active of this.activeItems) {
      if (active.active && (active.type === 'stardust' || active.type === 'shard') && active.elapsedMs < 1200) {
        const distSq = Math.pow(active.startX - x, 2) + Math.pow(active.startY - y, 2);
        if (distSq < 36 * 36) {
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
      y: y + 6,
      text,
      type: 'stardust',
      isCrit: isCritDrop,
      bonusLabel,
      useLegacyFormat,
      durationMs: POPUP_CONFIG.cashDurationMs,
    }, amount);

    this.activeItems.push(item);
    return item;
  }

  public spawnCash(x: number, y: number, amount: number, isCritDrop: boolean = false, useLegacyFormat: boolean = false, bonusLabel?: string): PopupItem | null {
    return this.spawnStardust(x, y, amount, isCritDrop, useLegacyFormat, bonusLabel);
  }

  public spawnShard(x: number, y: number, amount: number = 1, bonusLabel?: string): PopupItem | null {
    if (this.density === 'off') return null;

    // Merge logic: check for nearby currency popups within 36px in active floating phase
    for (const active of this.activeItems) {
      if (active.active && (active.type === 'stardust' || active.type === 'shard') && active.elapsedMs < 1200) {
        const distSq = Math.pow(active.startX - x, 2) + Math.pow(active.startY - y, 2);
        if (distSq < 36 * 36) {
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
      y: y - 20,
      text,
      type: 'shard',
      bonusLabel,
      durationMs: POPUP_CONFIG.cashDurationMs,
    }, amount);

    this.activeItems.push(item);
    return item;
  }

  public flushPendingCurrency() {
    // Deliver pending currency callbacks without prematurely destroying on-screen visual animations
    for (let i = this.activeItems.length - 1; i >= 0; i--) {
      const item = this.activeItems[i];
      if (item.active && (item.type === 'stardust' || item.type === 'shard')) {
        if (this.onCurrencyImpact && item.numericValue > 0) {
          this.onCurrencyImpact(item.type, item.numericValue);
        }
      }
    }
  }

  public update(deltaMs: number) {
    // Smooth 60 FPS continuous update with delta clamping
    const stepMs = Math.min(deltaMs, 50);

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
