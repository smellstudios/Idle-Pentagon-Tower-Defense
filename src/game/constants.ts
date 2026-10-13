/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CardDef, LabResearchDef, MilestoneDef, MissionDef, RarityConfig, RarityTier, RareDropType, ActiveSynergyCard, ActiveRareDrop, Upgrade, GameState } from '../types';
import { computeTechBonuses } from './techTree';
import { formatCurrency } from '../utils/format';

export const GAME_WIDTH = 450; // Logical width
export const GAME_HEIGHT = 810; // Logical height (Portrait oriented)

export const PLAYER_RADIUS = 12;
export const SPAWN_MARGIN = 30;

// Rarity Tiers Configuration
export const RARITY_CONFIGS: Record<RarityTier, RarityConfig> = {
  common: {
    tier: 'common',
    name: 'Common',
    colorHex: '#9ca3af', // Gray-400
    effectMultiplier: 1.0,
    dropChancePercent: 40,
  },
  uncommon: {
    tier: 'uncommon',
    name: 'Uncommon',
    colorHex: '#22c55e', // Green-500
    effectMultiplier: 1.2,
    dropChancePercent: 30,
  },
  rare: {
    tier: 'rare',
    name: 'Rare',
    colorHex: '#3b82f6', // Blue-500
    effectMultiplier: 1.5,
    dropChancePercent: 20,
  },
  epic: {
    tier: 'epic',
    name: 'Epic',
    colorHex: '#a855f7', // Purple-500
    effectMultiplier: 2.0,
    dropChancePercent: 8,
  },
  legendary: {
    tier: 'legendary',
    name: 'Legendary',
    colorHex: '#eab308', // Gold-500
    effectMultiplier: 3.0,
    dropChancePercent: 2,
  },
};

export const RARE_DROPS_DEFINITIONS = [
  {
    id: 'double_shot' as RareDropType,
    name: 'Double Shot',
    icon: 'drop_double_shot',
    description: 'Auto-fire shots split into two distinct angled projectiles.',
  },
  {
    id: 'piercing' as RareDropType,
    name: 'Piercing',
    icon: 'drop_piercing',
    description: 'Laser bolts penetrate through all targets without dissipating.',
  },
  {
    id: 'rapid_fire' as RareDropType,
    name: 'Octo-Strike',
    icon: 'drop_rapid_fire',
    description: 'Discharges a 360° radial barrage of 8 projectiles simultaneously.',
  },
  {
    id: 'flow_of_calamity' as RareDropType,
    name: 'Flow of Calamity',
    icon: 'drop_flow_of_calamity',
    description: 'Enemies hit spiral into chaotic RNG calamity cascades (double damage, poison clouds, armor shred, stuns).',
  },
  {
    id: 'lightning_chain' as RareDropType,
    name: 'Lightning Chain',
    icon: 'drop_lightning_chain',
    description: 'Defeated foes discharge chain lightning to 3 nearby enemies.',
  },
  {
    id: 'poison' as RareDropType,
    name: 'Poison',
    icon: 'drop_poison',
    description: 'Enemies take 5% Max HP/sec stackable poison damage for 10s.',
  },
  {
    id: 'rockets' as RareDropType,
    name: 'Rockets Barrage',
    icon: 'drop_rockets',
    description: '7% chance per projectile shot to launch 5 micro-rockets that seek foes and explode in an area of effect.',
  },
  {
    id: 'laser_sweep' as RareDropType,
    name: 'Laser Arc Sweep',
    icon: 'drop_laser_sweep',
    description: 'Every 5 seconds, discharges a high-energy laser beam that sweeps a 40° arc, cleaving all enemies in its path.',
  },
  {
    id: 'mortar_strike' as RareDropType,
    name: 'Mortar Strike',
    icon: 'drop_mortar_strike',
    description: 'Every 8 seconds, projects an orbital targeting field and drops a high-explosive mortar shell dealing massive AOE damage.',
  },
  {
    id: 'poison_linger' as RareDropType,
    name: 'Poison Linger',
    icon: 'drop_poison_linger',
    description: '3% chance for bullets to leave a lingering poison cloud on collision, dealing damage over time to anyone inside.',
  },
  {
    id: 'decaying_plague' as RareDropType,
    name: 'Decaying Plague',
    icon: 'drop_decaying_plague',
    description: 'Bullets apply decaying plague. Intensity increases with hits (max 5). Spreads to 3 nearby enemies automatically.',
  },
  {
    id: 'shrapnel_rainfall' as RareDropType,
    name: 'Shrapnel Rainfall',
    icon: 'drop_shrapnel_rainfall',
    description: '8.5% chance for bullets to explode into a rainfall of shrapnel on hit, causing massive radius damage and bleed.',
  },
];

export const INITIAL_PLAYER_STATS = {
  hp: 15,
  damage: 12,
  fireRate: 0.9,
  critChance: 0.02,
  critMultiplier: 1.4,
  defensePercent: 0,
  defenseAbsolute: 0,
  thornsPercent: 0,
  lifeStealPercent: 0,
  knockbackChance: 0,
  orbitingOrbs: 0,
};

// Base stats for geometric standard foes (calibrated for tangible per-wave progression)
export const ENEMY_BASE_STATS = {
  red_square: {
    baseHP: 14,
    baseContactDPS: 1.6,
    speed: 0.95,
    spawnWeight: 70,
  },
  orange_triangle: {
    baseHP: 18,
    baseContactDPS: 2.2,
    speed: 1.45,
    spawnWeight: 25,
  },
  big_square: {
    baseHP: 80,
    baseContactDPS: 3.5,
    speed: 0.55,
    spawnWeight: 10,
  },
  circle: {
    baseHP: 26,
    baseContactDPS: 1.8,
    speed: 1.1,
    spawnWeight: 18,
  },
  purple_pentagon: {
    baseHP: 36,
    baseContactDPS: 2.4,
    speed: 0.95,
    spawnWeight: 14,
  },
  gold_hexagon: {
    baseHP: 105,
    baseContactDPS: 3.2,
    speed: 0.65,
    spawnWeight: 8,
  },
  emerald_diamond: {
    baseHP: 30,
    baseContactDPS: 2.6,
    speed: 1.6,
    spawnWeight: 14,
  },
  crimson_octagon: {
    baseHP: 150,
    baseContactDPS: 4.5,
    speed: 0.48,
    spawnWeight: 6,
  },
  enraged_trapezium: {
    baseHP: 48,
    baseContactDPS: 3.0,
    speed: 0.9,
    spawnWeight: 10,
  },
  disruptor_emp: {
    baseHP: 55,
    baseContactDPS: 2.8,
    speed: 0.85,
    spawnWeight: 8,
  },
  reflector_prism: {
    baseHP: 60,
    baseContactDPS: 3.0,
    speed: 0.95,
    spawnWeight: 9,
  },
  splitter_cluster: {
    baseHP: 75,
    baseContactDPS: 2.8,
    speed: 0.7,
    spawnWeight: 8,
  },
  cluster_mini: {
    baseHP: 18,
    baseContactDPS: 1.2,
    speed: 1.65,
    spawnWeight: 0, // Only spawned via mitosis
  },
  phase_shifter: {
    baseHP: 50,
    baseContactDPS: 3.5,
    speed: 1.1,
    spawnWeight: 7,
  },
};

/**
 * Scaled enemy calculation based on Tier & Wave
 */
export function getTierDifficultyMultiplier(tier: number): number {
  // Tier 1: 1.0x
  // Tier 2: 1.8x
  // Tier 3: 3.5x
  // Tier 4: 8.0x
  // Tier 5: 18x
  // Scales exponentially to support "all tiers" accurately
  if (tier <= 1) return 1.0;
  return Number((Math.pow(2.2, tier - 1) * Math.pow(0.95, tier - 1)).toFixed(2));
}

/**
 * Minimal Tier Cash Multiplier: +5% (+0.05) cash per tier (e.g. Tier 1 = 1.00x, Tier 2 = 1.05x, Tier 3 = 1.10x)
 */
export function getTierCashMultiplier(tier: number): number {
  const t = Math.max(1, tier || 1);
  return Number((1 + (t - 1) * 0.05).toFixed(2));
}

/**
 * Checks if a specific Tier is unlocked based on highest wave reached on the previous tier.
 * Tier 1 is always unlocked.
 * Tier N requires reaching Wave 100 on Tier (N - 1).
 */
export function isTierUnlocked(
  tier: number,
  highestWavePerTier: Record<number, number> = {},
  highestWaveEver: number = 0
): boolean {
  if (tier <= 1) return true;
  const prevTierBest = highestWavePerTier[tier - 1] || 0;
  if (prevTierBest >= 100) return true;
  if (tier === 2 && (highestWaveEver >= 100 || (highestWavePerTier[1] || 0) >= 100)) return true;
  if (highestWaveEver >= 100 * (tier - 1)) return true;
  return false;
}

export function getMaxUnlockedTier(
  highestWavePerTier: Record<number, number> = {},
  highestWaveEver: number = 0
): number {
  let maxTier = 1;
  for (let t = 2; t <= 12; t++) {
    if (isTierUnlocked(t, highestWavePerTier, highestWaveEver)) {
      maxTier = t;
    } else {
      break;
    }
  }
  return maxTier;
}

export function getTierUnlockRequirement(tier: number): string {
  if (tier <= 1) return 'Unlocked by default';
  return `Reach Wave 100 on Tier ${tier - 1}`;
}

export interface PlayerCombatStatsSummary {
  damage?: number;
  fireRate?: number;
  critChance?: number;
  critMultiplier?: number;
  attackRadius?: number;
  multishotChance?: number;
  rapidFireChance?: number;
  defensePercent?: number;
  defenseAbsolute?: number;
  thornsPercent?: number;
  hpRegen?: number;
  lifeStealPercent?: number;
  knockbackChance?: number;
  orbitingOrbs?: number;
  bossDamageMult?: number;
  eliteDamageMult?: number;
  armorPierce?: number;
  spawnRateMult?: number;
  effectiveMaxHp?: number;
  dps?: number;
}

export interface StageProgressionInfo {
  stage: 1 | 2 | 3 | 4;
  factor: number;
  name: string;
  waveRange: string;
  themeColor: string;
}

/**
 * Four-Stage Progression Model for Calamity Waves:
 * Replaces the flat 3.2x enemy scaling with the calibrated 4-stage progression:
 * - Stage 1 (Waves 1-25):  0.8x scaling (Warmup & Recon)
 * - Stage 2 (Waves 26-50): 2.0x scaling (Assault Escalation)
 * - Stage 3 (Waves 51-75): 3.2x scaling (Calamity Swarm)
 * - Stage 4 (Waves 76+):   4.0x scaling (Apex Overdrive)
 */
export function getStageScaling(wave: number): StageProgressionInfo {
  const w = Math.max(1, wave);
  if (w <= 25) {
    return { stage: 1, factor: 0.8, name: 'Warmup & Recon', waveRange: '1 - 25', themeColor: '#38bdf8' };
  } else if (w <= 50) {
    return { stage: 2, factor: 2.0, name: 'Assault Escalation', waveRange: '26 - 50', themeColor: '#facc15' };
  } else if (w <= 75) {
    return { stage: 3, factor: 3.2, name: 'Calamity Swarm', waveRange: '51 - 75', themeColor: '#f97316' };
  } else {
    return { stage: 4, factor: 4.0, name: 'Apex Overdrive', waveRange: '76+', themeColor: '#ef4444' };
  }
}

/**
 * Piecewise continuous compounding enemy stat multiplier across the four stages.
 * Replaces flat 3.2x scaling with the continuous 4-stage progression (0.8x -> 2.0x -> 3.2x -> 4.0x).
 */
export function calculateFourStageMultiplier(wave: number, baseRate: number = 0.035): number {
  const w = Math.max(1, wave);
  let integratedExponent = 0;

  // Stage 1 (Waves 1-25): 0.8x scaling factor
  const s1Waves = Math.min(24, Math.max(0, w - 1));
  integratedExponent += s1Waves * 0.8 * baseRate;

  // Stage 2 (Waves 26-50): 2.0x scaling factor
  if (w > 25) {
    const s2Waves = Math.min(25, w - 25);
    integratedExponent += s2Waves * 2.0 * baseRate;
  }

  // Stage 3 (Waves 51-75): 3.2x scaling factor
  if (w > 50) {
    const s3Waves = Math.min(25, w - 50);
    integratedExponent += s3Waves * 3.2 * baseRate;
  }

  // Stage 4 (Waves 76+): 4.0x scaling factor
  // S3->S4 boundary fix (Option B preferred): Add 1 Stage-3 growth step (3.2 * baseRate) at the S3->S4 boundary 
  // so wave 75 to 76 produces a smooth, continuous step-up (~12.8%) matching S2->S3 behavior rather than a dip or plateau.
  if (w > 75) {
    const boundaryStep = 3.2 * baseRate;
    const s4Waves = w - 75;
    integratedExponent += boundaryStep + s4Waves * 4.0 * baseRate;
  }

  return Math.exp(integratedExponent);
}

export function getEnemyWaveStats(
  type: string,
  wave: number,
  tier: number = 1,
  playerStats?: PlayerCombatStatsSummary
): { hp: number; dps: number } {
  // Harder tiers scale exponentially to support all tiers accurately
  const tierHpMult = Math.pow(1.50 + (tier - 1) * 0.15, tier - 1);
  const tierDpsMult = Math.pow(1.30 + (tier - 1) * 0.12, tier - 1);

  // Four-Stage Compounding Progression (0.8x, 2.0x, 3.2x, 4.0x)
  const stageHpMult = calculateFourStageMultiplier(wave, 0.035);
  const hpMultiplier = stageHpMult * tierHpMult;

  // Contact DPS scaling modulated by the current stage progression factor
  const stageInfo = getStageScaling(wave);
  const stageDpsMult = calculateFourStageMultiplier(wave, 0.022);
  const dpsMultiplier = stageDpsMult * tierDpsMult;

  // Dynamic player stat scaling:
  const baseBaselineDps = 16.5;
  const effectivePlayerDps = playerStats?.dps ?? (
    ((playerStats?.damage ?? 15) * (playerStats?.fireRate ?? 1.0)) *
    (1 + (playerStats?.critChance ?? 0.05) * ((playerStats?.critMultiplier ?? 1.5) - 1))
  );
  const effectiveMaxHp = playerStats?.effectiveMaxHp ?? 100;
  const playerHpRatio = Math.max(1.0, effectiveMaxHp / 100);
  const playerDefAbs = playerStats?.defenseAbsolute ?? 0;

  if (type === 'boss') {
    const baseBossHP = 280;
    const baseBossDPS = 3.2;

    // Boss scales with player DPS to guarantee a tense 6 - 14 second encounter
    const bossTimeToKillTargetSec = 6.0 + Math.min(8.0, (wave - 1) * 0.25);
    const playerDpsBonus = Math.max(0, (effectivePlayerDps - baseBaselineDps)) * bossTimeToKillTargetSec * Math.pow(1.08, tier - 1);

    // Boss DPS scales with player HP and defense so it can overcome defense barriers
    const playerDefensePenetration = Math.max(0, playerDefAbs * 0.60);
    const bossDpsScale = (baseBossDPS * dpsMultiplier) * Math.pow(playerHpRatio, 0.32) + playerDefensePenetration;

    return {
      hp: Math.round(baseBossHP * hpMultiplier + playerDpsBonus),
      dps: Number(bossDpsScale.toFixed(2)),
    };
  }

  const base = ENEMY_BASE_STATS[type as keyof typeof ENEMY_BASE_STATS] || ENEMY_BASE_STATS.red_square;

  // Regular wave foes take proportional chunk of player damage based on archetype weight
  const foeWeight = base.baseHP / 14;
  const wavePlayerHpBonus = Math.max(0, (effectivePlayerDps - baseBaselineDps)) * 0.15 * foeWeight * Math.pow(1.04, tier - 1);
  const foeDefensePenetration = Math.max(0, playerDefAbs * 0.20);
  const foeDpsScale = (base.baseContactDPS * dpsMultiplier) * Math.pow(playerHpRatio, 0.20) + foeDefensePenetration;

  return {
    hp: Math.max(1, Math.round(base.baseHP * hpMultiplier + wavePlayerHpBonus)),
    dps: Number(foeDpsScale.toFixed(2)),
  };
}

/**
 * Rebalanced Prestige Coins (Cosmic Shards) calculation:
 * Scales strictly with WAVE DIFFICULTY across the four stages and Tier, NOT credits/cash.
 * - Stage 1 (Waves 1-25):  Base difficulty weight (0.8x)
 * - Stage 2 (Waves 26-50): Escalation weight (2.0x)
 * - Stage 3 (Waves 51-75): Calamity weight (3.2x)
 * - Stage 4 (Waves 76+):   Apex Overdrive weight (4.0x)
 * Plus milestone bonuses for every Boss encounter defeated and exponential Tier combat scaling.
 */
export function calculateAscensionShards(highestWave: number, shardMultiplier: number = 1.0, tier: number = 1): number {
  if (highestWave <= 0) return 0;
  
  let difficultyPoints = 0;

  // Cadet assistance reserve buffer: guarantees that even dying on waves 1 to 4 awards 12–16 shards,
  // ensuring new players can afford at least 1-2 permanent meta lab upgrades after their very first run
  // (e.g. Fortress Health cost: 8, HP Regen cost: 8, Damage cost: 10, Defense Absolute cost: 10).
  const starterBuffer = 12;
  difficultyPoints += starterBuffer;
  
  // Stage 1 (1 - 25): 1.4x difficulty weight
  const w1 = Math.min(25, highestWave);
  difficultyPoints += w1 * 1.4; // up to 35 pts at wave 25

  // Stage 2 (26 - 50): 2.4x difficulty weight
  if (highestWave > 25) {
    const w2 = Math.min(25, highestWave - 25);
    difficultyPoints += w2 * 2.4; // +60 pts (total 107 at wave 50)
  }

  // Stage 3 (51 - 75): 3.6x difficulty weight
  if (highestWave > 50) {
    const w3 = Math.min(25, highestWave - 50);
    difficultyPoints += w3 * 3.6; // +90 pts (total 197 at wave 75)
  }

  // Stage 4 (76+): 4.5x difficulty weight
  if (highestWave > 75) {
    const w4 = Math.min(25, highestWave - 75);
    difficultyPoints += w4 * 4.5; // +112.5 pts at wave 100 (total 310 at wave 100)
  }

  // Endgame Deep Runs (101+): Super-linear scaling for deep sector pushes (150, 200, 300+)
  if (highestWave > 100) {
    const deepWaves = highestWave - 100;
    // Super-linear depth acceleration ensures deep runs continue scaling rewardingly
    difficultyPoints += deepWaves * 6.0 + Math.pow(deepWaves / 10, 1.4) * 18;
  }

  // Boss milestone rewards (Every 10 waves features a unique geometric boss encounter awarding bonus shards)
  const bossesCleared = Math.floor(highestWave / 10);
  const bossBonus = bossesCleared * 15.0;

  // Tier difficulty scaling (multiplies by tier difficulty factor, not cash)
  const tierDifficultyMult = Math.pow(1.5, Math.max(0, (tier || 1) - 1));

  const totalShards = Math.round((difficultyPoints + bossBonus) * tierDifficultyMult * shardMultiplier);
  return Math.max(12, totalShards);
}

export interface BossArchetypeConfig {
  id: string;
  name: string;
  title: string;
  colorHex: string;
  colorInt: number;
  sides: number;
  speed: number;
  hasShield: boolean;
  signatureAbility: string;
}

export function getBossArchetype(wave: number): BossArchetypeConfig {
  const bossCycle = Math.floor(wave / 10) % 5;
  const hasShield = wave >= 50;
  
  switch (bossCycle) {
    case 1:
      return {
        id: 'apex_decagon',
        name: 'Apex Decagon',
        title: 'The Iron Citadel',
        colorHex: '#f59e0b',
        colorInt: 0xf59e0b,
        sides: 10,
        speed: 0.42,
        hasShield,
        signatureAbility: 'Citadel Armor: Heavy mass & rotating barrier plates',
      };
    case 2:
      return {
        id: 'pulsar_star',
        name: 'Pulsar Star',
        title: 'The Supernova',
        colorHex: '#f43f5e',
        colorInt: 0xf43f5e,
        sides: 8,
        speed: 0.48,
        hasShield,
        signatureAbility: 'Pulsar Volley: Rhythmic 8-way radial projectile rings',
      };
    case 3:
      return {
        id: 'vortex_hexagon',
        name: 'Vortex Hexagon',
        title: 'The Graviton',
        colorHex: '#a855f7',
        colorInt: 0xa855f7,
        sides: 6,
        speed: 0.44,
        hasShield,
        signatureAbility: 'Graviton Singularity: Battlefield momentum warp & swarm surge',
      };
    case 4:
      return {
        id: 'prism_colossus',
        name: 'Prism Colossus',
        title: 'The Refractor',
        colorHex: '#06b6d4',
        colorInt: 0x06b6d4,
        sides: 4,
        speed: 0.46,
        hasShield,
        signatureAbility: 'Prismatic Sweep: Sweeping laser beams & orbital shard drones',
      };
    case 0:
    default:
      return {
        id: 'hyper_tesseract',
        name: 'Hyper-Tesseract',
        title: 'The Void Sovereign',
        colorHex: '#8b5cf6',
        colorInt: 0x8b5cf6,
        sides: 4,
        speed: 0.50,
        hasShield, // Always true since wave >= 50
        signatureAbility: 'Harmonic Phase Shield & Hyperspace Void Leap',
      };
  }
}

export const SHARD_BOUNTY_BY_SHAPE: Record<string, number> = {
  orange_triangle: 1,
  circle: 1,
  purple_pentagon: 2,
  emerald_diamond: 2,
  big_square: 3,
  enraged_trapezium: 2,
  gold_hexagon: 4,
  disruptor_emp: 3,
  reflector_prism: 3,
  splitter_cluster: 3,
  cluster_mini: 1,
  crimson_octagon: 5,
  phase_shifter: 4,
  boss: 12,
};

export const WAVE_CONFIG = {
  getEnemiesForWave: (wave: number, tier: number = 1): number => {
    const isBoss = wave % 10 === 0;
    if (isBoss) {
      // Boss waves: 1 Boss + escort adds (3 at wave 10, up to 10 max)
      return 1 + Math.min(10, Math.floor(wave / 10) * 2 + 1);
    }
    const isElite = wave % 10 === 5;
    if (isElite) {
      // Elite waves: 3 champions + lighter vanguard
      return Math.min(22, 6 + (wave - 1) * 1.5);
    }
    // Standard waves: 8 foes at Wave 1, scaling gradually (+2 every wave) up to 30 max
    return Math.min(30, 8 + (wave - 1) * 2);
  },
  isBossWave: (wave: number) => wave % 10 === 0,
  isEliteWave: (wave: number) => wave % 10 === 5,
  enemiesPerWave: 10, // Backwards compatibility fallback
};

export const ATTACK_RADIUS_CONFIG = {
  name: 'playerAttackRadius',
  default: 110,
  min: 40,
  max: 200,
};

export const POPUP_CONFIG = {
  damageDurationMs: 1400,
  cashDurationMs: 1800,
  statusDurationMs: 1800,
  playerDamageDurationMs: 1800,
  floatDistance: 40,
  maxPerFrame: {
    off: 0,
    low: 2,
    medium: 4,
    high: 8,
  },
  colors: {
    damage: 0xffffff,
    damageStroke: 0x0f172a,
    crit: 0xfacc15,
    critStroke: 0x451a03,
    cash: 0x34d399,
    cashStroke: 0x022c22,
    shard: 0xc084fc,
    shardStroke: 0x3b0764,
    playerDamage: 0xef4444,
    playerDamageStroke: 0x450a0a,
  },
};

export const PHYSICS_CONFIG = {
  playerRadius: PLAYER_RADIUS,
  enemyRadii: {
    red_square: 4.5,
    orange_triangle: 5.0,
    big_square: 7.0,
    circle: 5.0,
    purple_pentagon: 6.0,
    gold_hexagon: 7.5,
    emerald_diamond: 5.0,
    crimson_octagon: 8.5,
    enraged_trapezium: 6.5,
    disruptor_emp: 6.5,
    reflector_prism: 6.0,
    splitter_cluster: 7.0,
    cluster_mini: 4.0,
    phase_shifter: 6.0,
    boss: 14.0,
    default: 5.0,
  },
  separationStrength: 0.45,
  angularDamping: 0.92,
  playerAngularDamping: 0.90,
};

/**
 * IN-RUN TOWER UPGRADES (Purchased with In-Run CASH ($), resets upon new run)
 */
export const UPGRADES_CONFIG = [
  // --- ATTACK GROUP ---
  {
    id: 'damage_flat',
    name: 'Tower Damage',
    group: 'Damage' as const,
    unlockTier: 0,
    baseValue: 12,
    increment: 2.5,
    costGrowth: 1.15,
    baseCost: 10,
    maxLevel: 5000,
    unit: 'DMG',
    description: '+2.5 Projectile Damage per level',
  },
  {
    id: 'shoot_speed',
    name: 'Attack Speed',
    group: 'Damage' as const,
    unlockTier: 0,
    baseValue: 0.9,
    increment: 0.12,
    costGrowth: 1.16,
    baseCost: 12,
    maxLevel: 500,
    unit: '/s',
    description: '+0.12 Laser shots per second',
  },
  {
    id: 'crit_chance',
    name: 'Critical Chance',
    group: 'Damage' as const,
    unlockTier: 1,
    baseValue: 0.05,
    increment: 0.01,
    costGrowth: 1.18,
    baseCost: 18,
    maxLevel: 650,
    unit: '%',
    description: '+1.0% Critical Strike Chance',
  },
  {
    id: 'crit_multiplier',
    name: 'Critical Multiplier',
    group: 'Damage' as const,
    unlockTier: 1,
    baseValue: 1.5,
    increment: 0.20,
    costGrowth: 1.18,
    baseCost: 20,
    maxLevel: 1000,
    unit: 'x',
    description: '+0.20x Critical Strike Damage',
  },
  {
    id: 'attack_radius',
    name: 'Range',
    group: 'Damage' as const,
    unlockTier: 1,
    baseValue: 110,
    increment: 2.5,
    costGrowth: 1.18,
    baseCost: 30,
    maxLevel: 300,
    unit: 'px',
    description: '+2.5px Laser firing range',
  },
  {
    id: 'multishot_chance',
    name: 'Multishot Chance',
    group: 'Damage' as const,
    unlockTier: 1,
    baseValue: 0,
    increment: 0.03,
    costGrowth: 1.21,
    baseCost: 45,
    maxLevel: 300,
    unit: '%',
    description: '+3% Chance to fire multiple simultaneous laser bolts',
  },
  {
    id: 'rapid_fire_chance',
    name: 'Burst Salvo',
    group: 'Damage' as const,
    unlockTier: 2,
    baseValue: 0,
    increment: 0.02,
    costGrowth: 1.23,
    baseCost: 50,
    maxLevel: 300,
    unit: '%',
    description: '+2% Chance to trigger a rapid follow-up shot',
  },
  {
    id: 'bounce_shot_chance',
    name: 'Bounce Shot',
    group: 'Damage' as const,
    unlockTier: 2,
    baseValue: 0,
    increment: 0.025,
    costGrowth: 1.25,
    baseCost: 60,
    maxLevel: 300,
    unit: '%',
    description: '+2.5% Chance for lasers to ricochet to secondary foes',
  },
  {
    id: 'boss_damage',
    name: 'Boss Buster',
    group: 'Damage' as const,
    unlockTier: 2,
    baseValue: 1.0,
    increment: 0.05,
    costGrowth: 1.24,
    baseCost: 75,
    maxLevel: 200,
    unit: 'x',
    description: '+5% Bonus damage dealt to Boss Shapes and Elites',
  },
  {
    id: 'armor_pierce',
    name: 'Armor Pierce',
    group: 'Damage' as const,
    unlockTier: 3,
    baseValue: 0,
    increment: 0.02,
    costGrowth: 1.26,
    baseCost: 90,
    maxLevel: 50,
    unit: '%',
    description: '+2% Armor Penetration against armored foes and bosses',
  },

  // --- DEFENSE GROUP ---
  {
    id: 'health_max',
    name: 'Fortress Health',
    group: 'Health' as const,
    unlockTier: 0,
    baseValue: 15,
    increment: 3,
    costGrowth: 1.15,
    baseCost: 10,
    maxLevel: 5000,
    unit: 'HP',
    description: '+3 Maximum Tower HP',
  },
  {
    id: 'hp_regen',
    name: 'Health Regen',
    group: 'Health' as const,
    unlockTier: 0,
    baseValue: 0,
    increment: 0.25,
    costGrowth: 1.16,
    baseCost: 12,
    maxLevel: 2000,
    unit: 'HP/s',
    description: '+0.25 HP restored per second',
  },
  {
    id: 'defense_percent',
    name: 'Defense %',
    group: 'Health' as const,
    unlockTier: 1,
    baseValue: 0,
    increment: 0.01,
    costGrowth: 1.18,
    baseCost: 25,
    maxLevel: 170,
    unit: '%',
    description: '+1.0% Incoming damage reduction',
  },
  {
    id: 'defense_absolute',
    name: 'Defense Absolute',
    group: 'Health' as const,
    unlockTier: 1,
    baseValue: 0,
    increment: 1.5,
    costGrowth: 1.25,
    baseCost: 45,
    maxLevel: 2500,
    unit: 'Flat',
    description: 'Flat damage subtracted after Defense % (Core Turtle Stat)',
  },
  {
    id: 'thorns_percent',
    name: 'Thorn Damage',
    group: 'Health' as const,
    unlockTier: 2,
    baseValue: 0,
    increment: 0.05,
    costGrowth: 1.21,
    baseCost: 40,
    maxLevel: 1000,
    unit: '%',
    description: 'Reflects % enemy max HP upon contact (Breakpoints: 17%, 21%, 26%, 34%)',
  },
  {
    id: 'life_steal',
    name: 'Life Steal',
    group: 'Health' as const,
    unlockTier: 2,
    baseValue: 0,
    increment: 0.01,
    costGrowth: 1.23,
    baseCost: 50,
    maxLevel: 100,
    unit: '%',
    description: '+1% of projectile damage dealt returned as health',
  },
  {
    id: 'knockback_chance',
    name: 'Knockback',
    group: 'Health' as const,
    unlockTier: 3,
    baseValue: 0,
    increment: 0.03,
    costGrowth: 1.21,
    baseCost: 45,
    maxLevel: 250,
    unit: '%',
    description: '+3% Chance for projectiles to push back attackers',
  },
  {
    id: 'plasma_barrier_chance',
    name: 'Plasma Deflection',
    group: 'Health' as const,
    unlockTier: 3,
    baseValue: 0,
    increment: 0.015,
    costGrowth: 1.27,
    baseCost: 80,
    maxLevel: 40,
    unit: '%',
    description: '+1.5% Chance to fully deflect and nullify incoming enemy hits',
  },
  {
    id: 'orbiting_orbs',
    name: 'Orbiting Orbs',
    group: 'Health' as const,
    unlockTier: 3,
    baseValue: 0,
    increment: 1,
    costGrowth: 1.58,
    baseCost: 100,
    maxLevel: 12,
    unit: 'Orbs',
    description: 'Summons energy orbs orbiting the Pentagon that instantly vaporize normal enemies',
  },

  // --- UTILITY GROUP ---
  {
    id: 'cash_bonus',
    name: 'Cash Bonus',
    group: 'Utility' as const,
    unlockTier: 0,
    baseValue: 1.0,
    increment: 0.10,
    costGrowth: 1.18,
    baseCost: 15,
    maxLevel: 2500,
    unit: 'x',
    description: '+10% In-run Cash earned from enemy kills',
  },
  {
    id: 'cash_per_wave',
    name: 'Orbital Supply Drop',
    group: 'Utility' as const,
    unlockTier: 0,
    baseValue: 1.0,
    increment: 0.15,
    costGrowth: 1.18,
    baseCost: 20,
    maxLevel: 1000,
    unit: 'x',
    description: 'Tactical orbital crate dropped after every wave (+15% crate value/lvl, scales dynamically with wave depth & tier)',
  },
  {
    id: 'shards_per_kill',
    name: 'Cosmic Shards Yield',
    group: 'Utility' as const,
    unlockTier: 1,
    baseValue: 1.0,
    increment: 0.05,
    costGrowth: 1.22,
    baseCost: 45,
    maxLevel: 500,
    unit: 'x',
    description: '+5% Cosmic Shards harvested for permanent upgrades',
  },
  {
    id: 'shards_per_wave',
    name: 'Shards Per Wave',
    group: 'Utility' as const,
    unlockTier: 1,
    baseValue: 0,
    increment: 1,
    costGrowth: 1.28,
    baseCost: 60,
    maxLevel: 200,
    unit: '✦',
    description: '+1 Cosmic Shard earned on wave milestone completion',
  },
  {
    id: 'free_upgrade_chance',
    name: 'Free Upgrade Chance',
    group: 'Utility' as const,
    unlockTier: 2,
    baseValue: 0,
    increment: 0.02,
    costGrowth: 1.23,
    baseCost: 60,
    maxLevel: 75,
    unit: '%',
    description: '+2% Chance to receive a free random stat upgrade each wave',
  },
  {
    id: 'interest_rate',
    name: 'Wave Interest',
    group: 'Utility' as const,
    unlockTier: 3,
    baseValue: 0,
    increment: 0.01,
    costGrowth: 1.29,
    baseCost: 95,
    maxLevel: 25,
    unit: '%',
    description: '+1% Interest earned per wave on unspent Cash (up to $500/wave cap)',
  },
];

/**
 * PERMANENT WORKSHOP META-UPGRADES (Purchased with COSMIC SHARDS, persists across all runs)
 */
export const WORKSHOP_CONFIG = [
  // --- ATTACK ---
  {
    id: 'perm_base_damage',
    name: 'Damage',
    category: 'Attack' as const,
    unlockTier: 0,
    baseCost: 10,
    costGrowth: 1.35,
    increment: 3.0,
    statName: 'Damage',
    unit: 'DMG',
    description: 'Permanently increases starting projectile damage (+3.0 DMG per level).',
  },
  {
    id: 'perm_attack_speed',
    name: 'Attack Speed',
    category: 'Attack' as const,
    unlockTier: 0,
    baseCost: 15,
    costGrowth: 1.40,
    increment: 0.05,
    statName: 'Attack Speed',
    unit: '/s',
    description: 'Permanently increases starting laser fire rate (+0.05 shots/s per level).',
  },
  {
    id: 'perm_crit_chance',
    name: 'Critical Chance',
    category: 'Attack' as const,
    unlockTier: 1,
    baseCost: 15,
    costGrowth: 1.45,
    increment: 0.02,
    statName: 'Critical Chance',
    unit: '%',
    description: 'Permanently increases starting critical strike chance (+2.0% per level).',
  },
  {
    id: 'perm_crit_multiplier',
    name: 'Critical Factor',
    category: 'Attack' as const,
    unlockTier: 2,
    baseCost: 25,
    costGrowth: 1.45,
    increment: 0.10,
    statName: 'Critical Factor',
    unit: 'x',
    description: 'Permanently amplifies critical strike damage multiplier (+0.10x per level).',
  },
  {
    id: 'perm_range',
    name: 'Range',
    category: 'Attack' as const,
    unlockTier: 1,
    baseCost: 20,
    costGrowth: 1.35,
    increment: 2.5,
    statName: 'Range',
    unit: 'px',
    description: 'Permanently increases baseline laser firing perimeter (+2.5px per level).',
  },
  {
    id: 'perm_multishot_chance',
    name: 'Multishot Chance',
    category: 'Attack' as const,
    unlockTier: 1,
    baseCost: 30,
    costGrowth: 1.42,
    increment: 0.02,
    statName: 'Multishot Chance',
    unit: '%',
    description: 'Permanently grants starting chance to fire multiple simultaneous laser bolts (+2.0% per level).',
  },
  {
    id: 'perm_rapid_fire_chance',
    name: 'Burst Salvo',
    category: 'Attack' as const,
    unlockTier: 2,
    baseCost: 35,
    costGrowth: 1.44,
    increment: 0.015,
    statName: 'Burst Salvo',
    unit: '%',
    description: 'Permanently grants starting chance to trigger rapid follow-up shots (+1.5% per level).',
  },
  {
    id: 'perm_bounce_shot_chance',
    name: 'Bounce Shot',
    category: 'Attack' as const,
    unlockTier: 2,
    baseCost: 40,
    costGrowth: 1.45,
    increment: 0.02,
    statName: 'Bounce Shot',
    unit: '%',
    description: 'Permanently grants starting chance for lasers to ricochet to secondary foes (+2.0% per level).',
  },
  {
    id: 'perm_boss_damage',
    name: 'Boss Buster',
    category: 'Attack' as const,
    unlockTier: 2,
    baseCost: 45,
    costGrowth: 1.46,
    increment: 0.05,
    statName: 'Boss Buster',
    unit: 'x',
    description: 'Permanently increases damage dealt against Bosses & Elites (+5.0% per level).',
  },
  {
    id: 'perm_elite_slayer',
    name: 'Elite Hunter',
    category: 'Attack' as const,
    unlockTier: 2,
    baseCost: 35,
    costGrowth: 1.45,
    increment: 0.06,
    statName: 'Elite Hunter',
    unit: '%',
    description: 'Permanently increases weapon damage dealt to Elite hostiles like Triangles and Big Squares (+6.0% per level).',
  },
  {
    id: 'perm_critical_surge',
    name: 'Critical Surge',
    category: 'Attack' as const,
    unlockTier: 3,
    baseCost: 55,
    costGrowth: 1.48,
    increment: 0.08,
    statName: 'Crit Surge',
    unit: 'x',
    description: 'Permanently boosts high-energy critical overload damage multiplier (+0.08x per level).',
  },
  {
    id: 'perm_armor_pierce',
    name: 'Armor Pierce',
    category: 'Attack' as const,
    unlockTier: 3,
    baseCost: 55,
    costGrowth: 1.48,
    increment: 0.02,
    statName: 'Armor Pierce',
    unit: '%',
    description: 'Permanently grants starting Armor Penetration against armored foes (+2.0% per level).',
  },

  // --- DEFENSE ---
  {
    id: 'perm_base_hp',
    name: 'Fortress Health',
    category: 'Defense' as const,
    unlockTier: 0,
    baseCost: 8,
    costGrowth: 1.30,
    increment: 20.0,
    statName: 'Fortress Health',
    unit: 'HP',
    description: 'Permanently increases starting max fortress health (+20.0 HP per level).',
  },
  {
    id: 'perm_hp_regen',
    name: 'Health Regen',
    category: 'Defense' as const,
    unlockTier: 0,
    baseCost: 8,
    costGrowth: 1.35,
    increment: 0.5,
    statName: 'Health Regen',
    unit: 'HP/s',
    description: 'Permanently increases starting baseline HP regen (+0.5 HP/s per level).',
  },
  {
    id: 'perm_defense_percent',
    name: 'Defense %',
    category: 'Defense' as const,
    unlockTier: 2,
    baseCost: 30,
    costGrowth: 1.45,
    increment: 0.01,
    statName: 'Defense %',
    unit: '%',
    description: 'Permanently increases baseline incoming damage reduction (+1.0% per level).',
  },
  {
    id: 'perm_defense_absolute',
    name: 'Defense Absolute',
    category: 'Defense' as const,
    unlockTier: 0,
    baseCost: 10,
    costGrowth: 1.32,
    increment: 2.0,
    statName: 'Defense Absolute',
    unit: 'Flat',
    description: 'Permanently subtracts flat damage from every attacker hit (+2.0 per level).',
  },
  {
    id: 'perm_thorns',
    name: 'Thorn Damage',
    category: 'Defense' as const,
    unlockTier: 1,
    baseCost: 15,
    costGrowth: 1.40,
    increment: 0.05,
    statName: 'Thorn Damage',
    unit: '%',
    description: 'Permanently increases starting Thorn reflection damage (+5% per level).',
  },
  {
    id: 'perm_recovery_package',
    name: 'Recovery Drone',
    category: 'Defense' as const,
    unlockTier: 2,
    baseCost: 35,
    costGrowth: 1.44,
    increment: 0.02,
    statName: 'Recovery Drone',
    unit: '%',
    description: 'Tactical end-of-wave repair drone has a chance to restore 15% Max HP (+2.0% chance per level).',
  },
  {
    id: 'perm_life_steal',
    name: 'Life Steal',
    category: 'Defense' as const,
    unlockTier: 2,
    baseCost: 35,
    costGrowth: 1.44,
    increment: 0.005,
    statName: 'Life Steal',
    unit: '%',
    description: 'Permanently converts a percentage of projectile damage to health (+0.5% per level).',
  },
  {
    id: 'perm_knockback_chance',
    name: 'Knockback',
    category: 'Defense' as const,
    unlockTier: 2,
    baseCost: 30,
    costGrowth: 1.42,
    increment: 0.02,
    statName: 'Knockback',
    unit: '%',
    description: 'Permanently increases projectile knockback impact chance (+2.0% per level).',
  },
  {
    id: 'perm_barrier_overcharge',
    name: 'Shield Overcharge',
    category: 'Defense' as const,
    unlockTier: 3,
    baseCost: 60,
    costGrowth: 1.50,
    increment: 3.0,
    statName: 'Overcharge Plating',
    unit: 'Flat',
    description: 'Kinetic plating absorbs additional flat incoming damage when hull HP is above 50% (+3.0 per level).',
  },
  {
    id: 'perm_plasma_barrier_chance',
    name: 'Plasma Deflection',
    category: 'Defense' as const,
    unlockTier: 3,
    baseCost: 50,
    costGrowth: 1.46,
    increment: 0.01,
    statName: 'Plasma Deflection',
    unit: '%',
    description: 'Permanently grants chance to completely deflect and negate incoming enemy hits (+1.0% per level).',
  },
  {
    id: 'perm_orbiting_orbs',
    name: 'Orbiting Orbs',
    category: 'Defense' as const,
    unlockTier: 3,
    baseCost: 65,
    costGrowth: 1.55,
    increment: 1,
    statName: 'Orbiting Orbs',
    unit: 'Orbs',
    description: 'Permanently grants starting orbiting energy defense orbs that vaporize regular enemies (+1 orb per level).',
  },

  // --- UTILITY ---
  {
    id: 'perm_cash_mult',
    name: 'Cash Bonus',
    category: 'Utility' as const,
    unlockTier: 1,
    baseCost: 15,
    costGrowth: 1.35,
    increment: 0.10,
    statName: 'Cash Bonus',
    unit: '%',
    description: 'Permanently boosts in-run cash harvested from enemy kills (+10% per level).',
  },
  {
    id: 'perm_supply_drop',
    name: 'Orbital Supply Drop',
    category: 'Utility' as const,
    unlockTier: 1,
    baseCost: 20,
    costGrowth: 1.38,
    increment: 0.12,
    statName: 'Orbital Supply Drop',
    unit: '%',
    description: 'Permanently amplifies all end-of-wave Orbital Supply Drop shipments (+12% per level).',
  },
  {
    id: 'perm_shards_yield',
    name: 'Cosmic Shards Yield',
    category: 'Utility' as const,
    unlockTier: 0,
    baseCost: 12,
    costGrowth: 1.40,
    increment: 0.15,
    statName: 'Cosmic Shards Yield',
    unit: '%',
    description: 'Permanently boosts Cosmic Shards earned from all sources (+15% per level).',
  },
  {
    id: 'perm_shards_per_wave',
    name: 'Shards Per Wave',
    category: 'Utility' as const,
    unlockTier: 1,
    baseCost: 25,
    costGrowth: 1.40,
    increment: 1,
    statName: 'Shards Per Wave',
    unit: '✦',
    description: 'Permanently awards extra Cosmic Shards upon completing wave milestones (+1 Shard per level).',
  },
  {
    id: 'perm_free_upgrade_chance',
    name: 'Free Upgrade Chance',
    category: 'Utility' as const,
    unlockTier: 2,
    baseCost: 35,
    costGrowth: 1.45,
    increment: 0.015,
    statName: 'Free Upgrade Chance',
    unit: '%',
    description: 'Permanently grants a +1.5% chance per level to earn a free random stat upgrade each wave.',
  },
  {
    id: 'perm_interest_rate',
    name: 'Wave Interest',
    category: 'Utility' as const,
    unlockTier: 2,
    baseCost: 40,
    costGrowth: 1.44,
    increment: 0.005,
    statName: 'Wave Interest',
    unit: '%',
    description: 'Permanently earns compound interest on unspent cash after every wave (+0.5% per level).',
  },
  {
    id: 'perm_starting_cash',
    name: 'Starting Cash',
    category: 'Utility' as const,
    unlockTier: 0,
    baseCost: 10,
    costGrowth: 1.30,
    increment: 25,
    statName: 'Starting Cash',
    unit: '$',
    description: 'Begin every fresh run with extra in-run Cash reserves (+$25 per level).',
  },
  {
    id: 'perm_cell_extractor',
    name: 'Cell Extractor',
    category: 'Utility' as const,
    unlockTier: 2,
    baseCost: 40,
    costGrowth: 1.45,
    increment: 0.10,
    statName: 'Cell Extraction',
    unit: '%',
    description: 'Permanently increases chance to harvest bonus Research Cells from Sector Boss eliminations (+10% per level).',
  },
  {
    id: 'perm_gem_extractor',
    name: 'Gem Mining Drill',
    category: 'Utility' as const,
    unlockTier: 3,
    baseCost: 75,
    costGrowth: 1.55,
    increment: 0.05,
    statName: 'Gem Mining',
    unit: '%',
    description: 'Wave milestone completions have a chance to excavate +2 bonus Gems (+5.0% chance per level).',
  },

  // --- ULTIMATE WEAPONS ---
  {
    id: 'perm_chrono_field',
    name: 'Chrono Field',
    category: 'Ultimate Weapons' as const,
    unlockTier: 0,
    baseCost: 100,
    costGrowth: 1.80,
    increment: 0.10,
    statName: 'Slow Field',
    unit: '%',
    description: 'Creates a cosmic temporal distortion field slowing all enemies by 10% per level.',
  },
  {
    id: 'perm_golden_tower',
    name: 'Golden Tower',
    category: 'Ultimate Weapons' as const,
    unlockTier: 0,
    baseCost: 120,
    costGrowth: 1.85,
    increment: 0.25,
    statName: 'Golden Aura',
    unit: '%',
    description: 'Periodically activates a golden pulse multiplying cash & cosmic shard income.',
  },
  {
    id: 'perm_chain_lightning',
    name: 'Chain Lightning',
    category: 'Ultimate Weapons' as const,
    unlockTier: 1,
    baseCost: 140,
    costGrowth: 1.85,
    increment: 0.20,
    statName: 'Shock Voltage',
    unit: '%',
    description: 'Unleashes high-voltage electric arcs leaping between multiple targets for devastating shock damage (+20% damage & chain jump per level).',
  },
  {
    id: 'perm_death_ray',
    name: 'Death Ray',
    category: 'Ultimate Weapons' as const,
    unlockTier: 1,
    baseCost: 150,
    costGrowth: 1.90,
    increment: 1,
    statName: 'Orbital Ray',
    unit: 'Beam',
    description: 'Fires an orbital particle beam across the arena, vaporizing intersecting enemies.',
  },
  {
    id: 'perm_smart_missiles',
    name: 'Smart Missiles',
    category: 'Ultimate Weapons' as const,
    unlockTier: 2,
    baseCost: 175,
    costGrowth: 1.88,
    increment: 1,
    statName: 'Missile Salvo',
    unit: 'Salvo',
    description: 'Launches a barrage of self-guided micro-missiles that lock onto dangerous targets with high explosive blast radius (+1 missile per level).',
  },
  {
    id: 'perm_death_wave',
    name: 'Death Wave',
    category: 'Ultimate Weapons' as const,
    unlockTier: 2,
    baseCost: 200,
    costGrowth: 1.90,
    increment: 0.15,
    statName: 'Shockwave Pulse',
    unit: '%',
    description: 'Emits expanding cosmic shockwaves sweeping the battlefield, disintegrating enemies and boosting max HP per kill (+15% damage per level).',
  },
  {
    id: 'perm_poison_swamp',
    name: 'Poison Swamp',
    category: 'Ultimate Weapons' as const,
    unlockTier: 2,
    baseCost: 160,
    costGrowth: 1.85,
    increment: 0.15,
    statName: 'Acidic Corrosion',
    unit: '%',
    description: 'Deploys persistent pools of corrosive acid across the arena that shred enemy armor and inflict continuous damage (+15% damage & pool size per level).',
  },
  {
    id: 'perm_black_hole',
    name: 'Black Hole',
    category: 'Ultimate Weapons' as const,
    unlockTier: 2,
    baseCost: 200,
    costGrowth: 1.95,
    increment: 0.15,
    statName: 'Singularity Power',
    unit: '%',
    description: 'Generates a micro gravitational singularity that pulls and crushes enemies (+15% dmg & radius per level).',
  },
  {
    id: 'perm_spotlight',
    name: 'Spotlight',
    category: 'Ultimate Weapons' as const,
    unlockTier: 3,
    baseCost: 240,
    costGrowth: 1.92,
    increment: 0.25,
    statName: 'Beam Multiplier',
    unit: 'x',
    description: 'Projects focused high-energy searchlight cones from the fortress, multiplying all damage dealt to illuminated foes (+0.25x damage multiplier per level).',
  },
  {
    id: 'perm_inner_landmines',
    name: 'Inner Landmines',
    category: 'Ultimate Weapons' as const,
    unlockTier: 3,
    baseCost: 210,
    costGrowth: 1.88,
    increment: 1,
    statName: 'Mine Perimeter',
    unit: 'Mines',
    description: 'Deploys a defensive perimeter ring of heavy proximity landmines around the fortress that detonate on contact (+1 mine per level).',
  },
];

export function calculateWorkshopCost(config: typeof WORKSHOP_CONFIG[0], currentLevel: number): number {
  return Math.round(config.baseCost * Math.pow(config.costGrowth, currentLevel));
}

// Backward compatibility alias
export const PERMANENT_UPGRADES_CONFIG = WORKSHOP_CONFIG;
export const calculatePermanentUpgradeCost = calculateWorkshopCost;

/**
 * Returns duplicate EXP needed to level up a card.
 * Level 1 -> 3 EXP
 * Level 2 -> 5 EXP (+2)
 * Level 3 -> 7 EXP (+2)
 * Level 4 -> 9 EXP (+2)
 */
export function getCardRequiredExp(level: number): number {
  return 3 + (Math.max(1, level) - 1) * 2;
}

/**
 * CARDS ARSENAL CONFIG
 */
export const CARDS_CONFIG: CardDef[] = [
  {
    id: 'card_enemy_balance',
    name: 'Enemy Balance',
    description: '+50% Enemy spawn rate, but +80% (+30% per level) Cash & Cosmic Shards harvested from all kills.',
    rarity: 'rare',
    category: 'Utility',
    effectType: 'enemy_balance',
    baseValue: 0.80,
    valuePerLevel: 0.30,
    icon: 'Scale',
  },
  {
    id: 'card_health_plating',
    name: 'Health Plating',
    description: 'Reinforces tower hull, granting +40% (+30% per level) Maximum Health.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'health',
    baseValue: 0.40,
    valuePerLevel: 0.30,
    icon: 'Grip',
  },
  {
    id: 'card_cosmic_magnet',
    name: 'Cosmic Magnet',
    description: 'Attracts celestial energy, granting +35% (+25% per level) Cosmic Shards earned.',
    rarity: 'rare',
    category: 'Utility',
    effectType: 'shards',
    baseValue: 0.35,
    valuePerLevel: 0.25,
    icon: 'Magnet',
  },
  {
    id: 'card_laser_overcharge',
    name: 'Laser Overcharge',
    description: 'Amplifies all laser emitters, granting +30% (+25% per level) Projectile Damage.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'damage',
    baseValue: 0.30,
    valuePerLevel: 0.25,
    icon: 'Bolt',
  },
  {
    id: 'card_defense_matrix',
    name: 'Defense Matrix',
    description: 'Projects a hard-light barrier granting +20 (+15 per level) Defense Absolute.',
    rarity: 'rare',
    category: 'Defense',
    effectType: 'defense_absolute',
    baseValue: 20,
    valuePerLevel: 15,
    icon: 'ShieldCheck',
  },
  {
    id: 'card_extra_orb',
    name: 'Extra Energy Orb',
    description: 'Summons Orbiting Energy Orbs protecting the Pentagon (+1 Orb every level).',
    rarity: 'epic',
    category: 'Defense',
    effectType: 'orbs',
    baseValue: 1,
    valuePerLevel: 1,
    icon: 'Orbit',
  },
  {
    id: 'card_fast_forward',
    name: 'Fast Forward',
    description: 'Accelerates game speed by +0.5x (+0.50x per level) while active.',
    rarity: 'rare',
    category: 'Utility',
    effectType: 'speed',
    baseValue: 0.5,
    valuePerLevel: 0.50,
    icon: 'FastForward',
  },
  {
    id: 'card_loanshark',
    name: 'Loanshark Card',
    description: 'Get back 1.25x (+0.35x per level) more cash reserve upon dying.',
    rarity: 'epic',
    category: 'Utility',
    effectType: 'loanshark_mult',
    baseValue: 1.25,
    valuePerLevel: 0.35,
    icon: 'Coins',
  },
  {
    id: 'card_radar_booster',
    name: 'Radar Booster',
    description: 'Extends target acquisition sensors, granting +15 (+5 per level) Attack Range.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'range',
    baseValue: 15,
    valuePerLevel: 5,
    icon: 'Scan',
  },
  {
    id: 'card_rapid_trigger',
    name: 'Rapid Trigger',
    description: 'Calibrates laser capacitors, granting +0.25 (+0.10 per level) Attack Speed.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'fire_rate',
    baseValue: 0.25,
    valuePerLevel: 0.10,
    icon: 'Timer',
  },
  {
    id: 'card_scavenger_drone',
    name: 'Scavenger Drone',
    description: 'Deploys an autonomous retriever, granting +$25 (+$15 per level) Cash per wave cleared.',
    rarity: 'common',
    category: 'Utility',
    effectType: 'cash_per_wave',
    baseValue: 25,
    valuePerLevel: 15,
    icon: 'Coins',
  },
  {
    id: 'card_nanite_repair',
    name: 'Nanite Repair',
    description: 'Injects micro-repair bots, granting +2.0 (+1.0 per level) HP Regeneration/sec.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'hp_regen',
    baseValue: 2.0,
    valuePerLevel: 1.0,
    icon: 'Dna',
  },
  {
    id: 'card_spiked_hull',
    name: 'Spiked Hull',
    description: 'Electrifies outer hull plating, returning 15% (+5% per level) Thorns Damage to attackers.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'thorns',
    baseValue: 0.15,
    valuePerLevel: 0.05,
    icon: 'Bolt',
  },
  {
    id: 'card_orbital_totem',
    name: 'Orbital Totem',
    description: 'Orbits the tower. Projectiles passing near its field have a 30% (+5% per level) chance to split into 2 bolts.',
    rarity: 'uncommon',
    category: 'Attack',
    effectType: 'orbital_totem',
    baseValue: 0.30,
    valuePerLevel: 0.05,
    icon: 'Infinity',
  },
  {
    id: 'card_toxic_drone',
    name: 'Toxic Drone',
    description: 'Deploys a roaming bio-drone with a toxic aura, dealing 1.0% (+0.25% per level) Max HP/sec to nearby foes.',
    rarity: 'uncommon',
    category: 'Attack',
    effectType: 'toxic_drone',
    baseValue: 0.01,
    valuePerLevel: 0.0025,
    icon: 'Biohazard',
  },
  {
    id: 'card_gravity_anchor',
    name: 'Gravity Anchor',
    description: 'Deploys an orbital gravity field that slows enemy movement speed by 25% (+5% per level) in its radius.',
    rarity: 'uncommon',
    category: 'Utility',
    effectType: 'gravity_anchor',
    baseValue: 0.25,
    valuePerLevel: 0.05,
    icon: 'Orbit',
  },
  {
    id: 'card_energy_beacon',
    name: 'Energy Beacon',
    description: 'Orbits nearby and periodically pulses, granting +15% (+5% per level) Attack Speed and Crit Chance for 3s.',
    rarity: 'uncommon',
    category: 'Attack',
    effectType: 'energy_beacon',
    baseValue: 0.15,
    valuePerLevel: 0.05,
    icon: 'Activity',
  },
  {
    id: 'card_shredder_field',
    name: 'Shredder Field',
    description: 'Orbits with a buzz-saw field, shredding 15% (+5% per level) of enemy armor on contact.',
    rarity: 'uncommon',
    category: 'Attack',
    effectType: 'shredder_field',
    baseValue: 0.15,
    valuePerLevel: 0.05,
    icon: 'Fan',
  },
  {
    id: 'card_friendly_fire',
    name: 'Friendly Fire',
    description: '7.5% (+2.5% per level) chance when killing a shape to convert it into an allied minion fighting for 15s (max 6 active).',
    rarity: 'epic',
    category: 'Attack',
    effectType: 'friendly_fire',
    baseValue: 0.075,
    valuePerLevel: 0.025,
    icon: 'Skull',
  },
  {
    id: 'card_crit_share',
    name: 'Crit Share',
    description: 'Critical hits have an 8.5% (+2.5% per level) chance to spread to up to 3 nearby enemy shapes, dealing 75% of the original critical damage to each.',
    rarity: 'epic',
    category: 'Attack',
    effectType: 'crit_share',
    baseValue: 0.085,
    valuePerLevel: 0.025,
    icon: 'CloudLightning',
  },
  {
    id: 'card_uno_reverse',
    name: 'Uno Reverse',
    description: '9% (+3% per level) chance to deflect enemy shots. Taking hits builds momentum bar (20 hits) to unleash an AOE blast.',
    rarity: 'epic',
    category: 'Defense',
    effectType: 'uno_reverse',
    baseValue: 0.09,
    valuePerLevel: 0.03,
    icon: 'Recycle',
  },
  {
    id: 'card_singularity_core',
    name: 'Singularity Core',
    description: 'Every 10 seconds, creates a gravitational black hole at the densest shape cluster that pulls enemies in and crushes them for 15% (+5% per level) Max HP over 3s.',
    rarity: 'epic',
    category: 'Attack',
    effectType: 'singularity_core',
    baseValue: 0.15,
    valuePerLevel: 0.05,
    icon: 'Atom',
  },
  {
    id: 'card_quantum_barrier',
    name: 'Quantum Barrier',
    description: '12% (+3% per level) chance to completely phase out and negate incoming damage, emitting a radial energy shockwave.',
    rarity: 'epic',
    category: 'Defense',
    effectType: 'quantum_barrier',
    baseValue: 0.12,
    valuePerLevel: 0.03,
    icon: 'Infinity',
  },
  {
    id: 'card_lightweight_alloy',
    name: 'Lightweight Alloy',
    description: 'A lighter frame allowing for quick structural reinforcement, granting +15% (+5% per level) Maximum Health.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'health',
    baseValue: 0.15,
    valuePerLevel: 0.05,
    icon: 'Plus',
  },
  {
    id: 'card_reinforced_frame',
    name: 'Reinforced Frame',
    description: 'Bolsters the tower core with extra struts, granting +10% (+8% per level) Maximum Health.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'health',
    baseValue: 0.10,
    valuePerLevel: 0.08,
    icon: 'Hammer',
  },
  {
    id: 'card_tungsten_bolts',
    name: 'Tungsten Bolts',
    description: 'Heavy metal projectiles that hit harder, granting +15% (+5% per level) Projectile Damage.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'damage',
    baseValue: 0.15,
    valuePerLevel: 0.05,
    icon: 'Rocket',
  },
  {
    id: 'card_serrated_projectiles',
    name: 'Serrated Projectiles',
    description: 'Jagged edges that tear through foes, granting +10% (+8% per level) Projectile Damage.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'damage',
    baseValue: 0.10,
    valuePerLevel: 0.08,
    icon: 'Fan',
  },
  {
    id: 'card_overdrive_circuit',
    name: 'Overdrive Circuit',
    description: 'Forces energy into firing capacitors, granting +0.10 (+0.05 per level) Attack Speed.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'fire_rate',
    baseValue: 0.10,
    valuePerLevel: 0.05,
    icon: 'Cpu',
  },
  {
    id: 'card_rapid_reloader',
    name: 'Rapid Reloader',
    description: 'Optimized reload sequences, granting +0.08 (+0.04 per level) Attack Speed.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'fire_rate',
    baseValue: 0.08,
    valuePerLevel: 0.04,
    icon: 'RefreshCcw',
  },
  {
    id: 'card_extended_barrel',
    name: 'Extended Barrel',
    description: 'Longer focal paths for lasers, granting +8 (+4 per level) Attack Range.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'range',
    baseValue: 8,
    valuePerLevel: 4,
    icon: 'Cylinder',
  },
  {
    id: 'card_long_range_sensors',
    name: 'Long-Range Sensors',
    description: 'Improved targeting hardware, granting +5 (+6 per level) Attack Range.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'range',
    baseValue: 5,
    valuePerLevel: 6,
    icon: 'Search',
  },
  {
    id: 'card_lead_shielding',
    name: 'Lead Shielding',
    description: 'Dense plating that absorbs minor impacts, granting +5 (+3 per level) Defense Absolute.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'defense_absolute',
    baseValue: 5,
    valuePerLevel: 3,
    icon: 'Box',
  },
  {
    id: 'card_ablative_armor',
    name: 'Ablative Armor',
    description: 'Layered armor that sheds upon impact, granting +8 (+2 per level) Defense Absolute.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'defense_absolute',
    baseValue: 8,
    valuePerLevel: 2,
    icon: 'ShieldCheck',
  },
  {
    id: 'card_razor_wire',
    name: 'Razor Wire',
    description: 'Sharp filaments on the outer hull, granting +5% (+2% per level) Thorns Damage.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'thorns',
    baseValue: 0.05,
    valuePerLevel: 0.02,
    icon: 'Flame',
  },
  {
    id: 'card_reactive_thorns',
    name: 'Reactive Thorns',
    description: 'Proximity-detonated hull spikes, granting +3% (+3% per level) Thorns Damage.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'thorns',
    baseValue: 0.03,
    valuePerLevel: 0.03,
    icon: 'Bolt',
  },
  {
    id: 'card_vampiric_core',
    name: 'Vampiric Core',
    description: 'Siphons energy from damaged foes, granting +1.0% (+0.5% per level) Life Steal.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'life_steal',
    baseValue: 0.01,
    valuePerLevel: 0.005,
    icon: 'Battery',
  },
  {
    id: 'card_leeching_beam',
    name: 'Leeching Beam',
    description: 'Converts target essence into hull integrity, granting +0.5% (+1.0% per level) Life Steal.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'life_steal',
    baseValue: 0.005,
    valuePerLevel: 0.01,
    icon: 'Thermometer',
  },
  {
    id: 'card_concussive_blast',
    name: 'Concussive Blast',
    description: 'High-impact projectiles that push back foes, granting +5% (+2% per level) Knockback Chance.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'knockback_chance',
    baseValue: 0.05,
    valuePerLevel: 0.02,
    icon: 'Move',
  },
  {
    id: 'card_repelling_pulse',
    name: 'Repelling Pulse',
    description: 'Radiates a minor kinetic field, granting +3% (+3% per level) Knockback Chance.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'knockback_chance',
    baseValue: 0.03,
    valuePerLevel: 0.03,
    icon: 'Send',
  },
  {
    id: 'card_precision_lenses',
    name: 'Precision Lenses',
    description: 'Micro-calibrated optics for better hits, granting +2.0% (+1.0% per level) Critical Chance.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'crit_chance',
    baseValue: 0.02,
    valuePerLevel: 0.01,
    icon: 'Microscope',
  },
  {
    id: 'card_critical_focus',
    name: 'Critical Focus',
    description: 'Concentrated fire on weak points, granting +1.0% (+2.0% per level) Critical Chance.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'crit_chance',
    baseValue: 0.01,
    valuePerLevel: 0.02,
    icon: 'Crosshair',
  },
  {
    id: 'card_heavy_impact',
    name: 'Heavy Impact',
    description: 'Crushing blows that deal more when they crit, granting +0.10x (+0.05x per level) Critical Multiplier.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'crit_multiplier',
    baseValue: 0.10,
    valuePerLevel: 0.05,
    icon: 'Hammer',
  },
  {
    id: 'card_brutal_finish',
    name: 'Brutal Finish',
    description: 'Lethal follow-through on critical strikes, granting +0.05x (+0.10x per level) Critical Multiplier.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'crit_multiplier',
    baseValue: 0.05,
    valuePerLevel: 0.10,
    icon: 'Skull',
  },
  {
    id: 'card_wave_skip',
    name: 'Wave Skip',
    description: '5% (+2% per level) chance after clearing a wave to instantly skip to the next wave, receiving all rewards.',
    rarity: 'uncommon',
    category: 'Utility',
    effectType: 'wave_skip',
    baseValue: 0.05,
    valuePerLevel: 0.02,
    icon: 'Waves',
  },
  {
    id: 'card_compound_interest',
    name: 'Compound Interest',
    description: 'Invests your current cash reserves, granting 1.5% (+0.5% per level) interest at the end of every wave.',
    rarity: 'uncommon',
    category: 'Utility',
    effectType: 'interest',
    baseValue: 0.015,
    valuePerLevel: 0.005,
    icon: 'TrendingUp',
  },
  {
    id: 'card_berserker_rage',
    name: 'Berserker Rage',
    description: 'Damage increases as your hull is compromised. +0.5% (+0.25% per level) Damage for every 1% of missing health.',
    rarity: 'uncommon',
    category: 'Attack',
    effectType: 'berserker_damage',
    baseValue: 0.005,
    valuePerLevel: 0.0025,
    icon: 'Flame',
  },
  {
    id: 'card_lucky_strike',
    name: 'Lucky Strike',
    description: 'Hyper-critical alignment. 5% (+2% per level) chance to deal 10x total damage on any hit.',
    rarity: 'uncommon',
    category: 'Attack',
    effectType: 'lucky_strike',
    baseValue: 0.05,
    valuePerLevel: 0.02,
    icon: 'Sparkles',
  },
  {
    id: 'card_death_defy',
    name: 'Death Defy',
    description: 'Ancient survival protocols. 10% (+5% per level) chance to survive any lethal blow with 1 HP remaining.',
    rarity: 'uncommon',
    category: 'Defense',
    effectType: 'death_defy',
    baseValue: 0.10,
    valuePerLevel: 0.05,
    icon: 'HeartPulse',
  },
  {
    id: 'card_scrounger_protocol',
    name: 'Scrounger Protocol',
    description: 'Strips structural integrity for utility. +15% (+10% per level) Cash Yield, but permanently reduces Max HP by 10%.',
    rarity: 'uncommon',
    category: 'Utility',
    effectType: 'scrounger_mult',
    baseValue: 0.15,
    valuePerLevel: 0.10,
    icon: 'Pickaxe',
  },
  {
    id: 'card_fortress_armor',
    name: 'Fortress Armor',
    description: 'Advanced composite plating, granting +2.5% (+1.5% per level) Defense % damage reduction.',
    rarity: 'uncommon',
    category: 'Defense',
    effectType: 'defense_percent',
    baseValue: 0.025,
    valuePerLevel: 0.015,
    icon: 'Shield',
  },
  {
    id: 'card_super_tower',
    name: 'Super Tower',
    description: 'Synchronizes all systems, granting +10% (+5% per level) boost to both Attack Range and Projectile Damage.',
    rarity: 'uncommon',
    category: 'Utility',
    effectType: 'super_tower_mult',
    baseValue: 0.10,
    valuePerLevel: 0.05,
    icon: 'Bolt',
  },
  {
    id: 'card_cosmic_link',
    name: 'Cosmic Link',
    description: 'Harmonizes celestial energies, granting +10% (+5% per level) boost to both Cash and Shards harvested.',
    rarity: 'uncommon',
    category: 'Utility',
    effectType: 'link_multiplier',
    baseValue: 0.10,
    valuePerLevel: 0.05,
    icon: 'Infinity',
  },
  {
    id: 'card_plasma_shield',
    name: 'Plasma Shield',
    description: 'High-energy barrier with a 10% (+5% per level) chance to completely negate any incoming enemy attack.',
    rarity: 'uncommon',
    category: 'Defense',
    effectType: 'plasma_block',
    baseValue: 0.10,
    valuePerLevel: 0.05,
    icon: 'Zap',
  },
  {
    id: 'card_recovery_kit',
    name: 'Recovery Kit',
    description: 'Self-repair protocols restore +5 (+5 per level) HP to the tower hull at the end of every wave.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'recovery_amount',
    baseValue: 5,
    valuePerLevel: 5,
    icon: 'Activity',
  },
  {
    id: 'card_free_upgrade',
    name: 'Free Upgrade',
    description: 'Advanced AI logistics have a 5% (+2% per level) chance to grant a massive cash refund after any wave.',
    rarity: 'common',
    category: 'Utility',
    effectType: 'free_upgrade',
    baseValue: 0.05,
    valuePerLevel: 0.02,
    icon: 'Box',
  },
  {
    id: 'card_boss_slayer',
    name: 'Boss Slayer',
    description: 'Specialized high-impact rounds deal +10% (+5% per level) additional damage to Sector Bosses.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'boss_damage',
    baseValue: 0.10,
    valuePerLevel: 0.05,
    icon: 'Trophy',
  },
  {
    id: 'card_elite_hunter',
    name: 'Elite Hunter',
    description: 'Targeting sensors optimized for Elite units, dealing +10% (+5% per level) damage to Triangles and Squares.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'elite_damage',
    baseValue: 0.10,
    valuePerLevel: 0.05,
    icon: 'Crosshair',
  },
  {
    id: 'card_spawn_beacon',
    name: 'Spawn Beacon',
    description: 'Emits a lure signal that makes enemies spawn 5% (+5% per level) faster, increasing cash flow speed.',
    rarity: 'common',
    category: 'Utility',
    effectType: 'spawn_rate',
    baseValue: 0.05,
    valuePerLevel: 0.05,
    icon: 'Waves',
  },
  {
    id: 'card_armor_pierce',
    name: 'Armor Pierce',
    description: 'Tungsten-tipped bolts ignore a portion of enemy resistance, granting +3% (+2% per level) effective damage.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'armor_pierce',
    baseValue: 0.03,
    valuePerLevel: 0.02,
    icon: 'Pickaxe',
  },
  {
    id: 'card_optical_focus',
    name: 'Optical Focus',
    description: 'High-precision lenses extend the primary attack radius by +5 (+5 per level) units.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'range',
    baseValue: 5,
    valuePerLevel: 5,
    icon: 'Search',
  },
  {
    id: 'card_cooling_vent',
    name: 'Cooling Vent',
    description: 'Prevents barrel overheating, increasing attack speed by +3% (+2% per level).',
    rarity: 'common',
    category: 'Attack',
    effectType: 'fire_rate',
    baseValue: 0.03,
    valuePerLevel: 0.02,
    icon: 'Fan',
  },
  {
    id: 'card_hull_reinforcement',
    name: 'Hull Reinforcement',
    description: 'Extra titanium layering increases total Tower Max HP by +5% (+5% per level).',
    rarity: 'common',
    category: 'Defense',
    effectType: 'health',
    baseValue: 0.05,
    valuePerLevel: 0.05,
    icon: 'Hammer',
  },
  {
    id: 'card_impact_damper',
    name: 'Impact Damper',
    description: 'Specialized shock absorbers reduce incoming damage by an absolute +5 (+3 per level) points.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'defense_absolute',
    baseValue: 5,
    valuePerLevel: 3,
    icon: 'ShieldCheck',
  },
  {
    id: 'card_crit_stabilizer',
    name: 'Crit Stabilizer',
    description: 'Harmonizes weapon frequency to increase Critical Strike chance by +2% (+1% per level).',
    rarity: 'common',
    category: 'Attack',
    effectType: 'crit_chance',
    baseValue: 0.02,
    valuePerLevel: 0.01,
    icon: 'Target',
  },
  {
    id: 'card_shard_finder',
    name: 'Shard Finder',
    description: 'Sub-space scanners increase the yield of Cosmic Shards from all sources by +5% (+5% per level).',
    rarity: 'common',
    category: 'Utility',
    effectType: 'shards',
    baseValue: 0.05,
    valuePerLevel: 0.05,
    icon: 'Sparkles',
  },
  {
    id: 'card_gold_bot',
    name: 'Gold Bot',
    description: 'Autonomous mining drone follows the tower, granting a +15% (+10% per level) boost to all Cash earned.',
    rarity: 'uncommon',
    category: 'Utility',
    effectType: 'gold_bot',
    baseValue: 0.15,
    valuePerLevel: 0.10,
    icon: 'Cpu',
  },
  {
    id: 'card_shard_bot',
    name: 'Shard Bot',
    description: 'Specialized extraction drone increases Cosmic Shard yield by +15% (+10% per level).',
    rarity: 'uncommon',
    category: 'Utility',
    effectType: 'shard_bot',
    baseValue: 0.15,
    valuePerLevel: 0.10,
    icon: 'Atom',
  },
  {
    id: 'card_tactical_shield',
    name: 'Tactical Shield',
    description: 'Reactive shielding provides a direct +5% (+3% per level) boost to Defense % damage reduction.',
    rarity: 'uncommon',
    category: 'Defense',
    effectType: 'defense_percent',
    baseValue: 0.05,
    valuePerLevel: 0.03,
    icon: 'Shield',
  },
  {
    id: 'card_energy_siphon',
    name: 'Energy Siphon',
    description: 'Absorbs energy from fallen foes, granting +2% (+1% per level) Life Steal on all hits.',
    rarity: 'uncommon',
    category: 'Defense',
    effectType: 'life_steal',
    baseValue: 0.02,
    valuePerLevel: 0.01,
    icon: 'Battery',
  },
  {
    id: 'card_nano_repair',
    name: 'Nano Repair',
    description: 'Advanced nanobots constantly mend the hull, increasing HP Regeneration by +10 (+10 per level).',
    rarity: 'common',
    category: 'Defense',
    effectType: 'hp_regen',
    baseValue: 10,
    valuePerLevel: 10,
    icon: 'Activity',
  },
  {
    id: 'card_velocity_field',
    name: 'Velocity Field',
    description: 'Accelerates all friendly projectiles, increasing Damage by +5% (+3% per level).',
    rarity: 'common',
    category: 'Attack',
    effectType: 'damage',
    baseValue: 0.05,
    valuePerLevel: 0.03,
    icon: 'Rocket',
  },
  {
    id: 'card_shockwave',
    name: 'Shockwave',
    description: 'Projectiles release a kinetic pulse, increasing Knockback Chance by +5% (+2% per level).',
    rarity: 'common',
    category: 'Attack',
    effectType: 'knockback_chance',
    baseValue: 0.05,
    valuePerLevel: 0.02,
    icon: 'Send',
  },
  {
    id: 'card_thorns_plating',
    name: 'Thorns Plating',
    description: 'Electrified spikes return 10% (+5% per level) of incoming contact damage back to attackers.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'thorns',
    baseValue: 0.10,
    valuePerLevel: 0.05,
    icon: 'Flame',
  },
  {
    id: 'card_exp_booster',
    name: 'EXP Booster',
    description: 'Optimizes combat data collection, granting a +5% (+5% per level) bonus to in-run Cash scaling.',
    rarity: 'common',
    category: 'Utility',
    effectType: 'cash',
    baseValue: 0.05,
    valuePerLevel: 0.05,
    icon: 'Trophy',
  },
  {
    id: 'card_energy_cell',
    name: 'Energy Cell',
    description: 'A high-capacity cell providing +15 (+10 per level) Flat Max HP increase.',
    rarity: 'common',
    category: 'Defense',
    effectType: 'health',
    baseValue: 0.15,
    valuePerLevel: 0.10,
    icon: 'Battery',
  },
  {
    id: 'card_focal_lens',
    name: 'Focal Lens',
    description: 'Refines laser beams to extend Attack Range by +12 (+6 per level) units.',
    rarity: 'common',
    category: 'Attack',
    effectType: 'range',
    baseValue: 12,
    valuePerLevel: 6,
    icon: 'Search',
  },
  {
    id: 'card_target_analyzer',
    name: 'Target Analyzer',
    description: 'Real-time telemetry increases Critical Strike chance by +3% (+2% per level).',
    rarity: 'common',
    category: 'Attack',
    effectType: 'crit_chance',
    baseValue: 0.03,
    valuePerLevel: 0.02,
    icon: 'Target',
  },
  {
    id: 'card_lethal_precision',
    name: 'Lethal Precision',
    description: 'Focuses fire on internal components, increasing Critical Multiplier by +0.15x (+0.10x per level).',
    rarity: 'common',
    category: 'Attack',
    effectType: 'crit_multiplier',
    baseValue: 0.15,
    valuePerLevel: 0.10,
    icon: 'Crosshair',
  },
  {
    id: 'card_cash_magnet_common',
    name: 'Cash Magnet',
    description: 'Ionic pull field increases all Cash rewards by +10% (+5% per level).',
    rarity: 'common',
    category: 'Utility',
    effectType: 'cash',
    baseValue: 0.10,
    valuePerLevel: 0.05,
    icon: 'Magnet',
  },
  {
    id: 'card_shard_magnet_common',
    name: 'Shard Magnet',
    description: 'Sub-space resonance increases Cosmic Shard yield by +10% (+5% per level).',
    rarity: 'common',
    category: 'Utility',
    effectType: 'shards',
    baseValue: 0.10,
    valuePerLevel: 0.05,
    icon: 'Zap',
  },
  {
    id: 'card_speed_booster',
    name: 'Speed Booster',
    description: 'Overclocks the simulation engine, granting +5% (+5% per level) Game Speed.',
    rarity: 'common',
    category: 'Utility',
    effectType: 'speed',
    baseValue: 0.05,
    valuePerLevel: 0.05,
    icon: 'FastForward',
  },
  {
    id: 'card_gravity_well',
    name: 'Gravity Well',
    description: 'Intense gravitational field increases Projectile Knockback by +15% (+10% per level).',
    rarity: 'uncommon',
    category: 'Attack',
    effectType: 'knockback_chance',
    baseValue: 0.15,
    valuePerLevel: 0.10,
    icon: 'Orbit',
  },
  {
    id: 'card_stardust_magnet',
    name: 'Stardust Magnet',
    description: 'Harmonic sensors increase both Cash and Shards by +8% (+4% per level).',
    rarity: 'uncommon',
    category: 'Utility',
    effectType: 'link_multiplier',
    baseValue: 0.08,
    valuePerLevel: 0.04,
    icon: 'Sparkles',
  },
  {
    id: 'card_plasma_core_v2',
    name: 'Plasma Core',
    description: 'Advanced core geometry increases Projectile Damage by +20% (+15% per level).',
    rarity: 'uncommon',
    category: 'Attack',
    effectType: 'damage',
    baseValue: 0.20,
    valuePerLevel: 0.15,
    icon: 'Atom',
  },
  {
    id: 'card_skill_double_shot',
    name: 'Double Shot Matrix',
    description: 'Tactical Card: Imprints Double Shot skill. Tower auto-fire splits into dual projectiles.',
    rarity: 'rare',
    category: 'Attack',
    effectType: 'skill_card',
    baseValue: 0.20,
    valuePerLevel: 0.10,
    icon: 'Zap',
  },
  {
    id: 'card_skill_piercing',
    name: 'Piercing Beam Matrix',
    description: 'Tactical Card: Imprints Piercing skill. Laser projectiles penetrate all targets.',
    rarity: 'rare',
    category: 'Attack',
    effectType: 'skill_card',
    baseValue: 0.20,
    valuePerLevel: 0.10,
    icon: 'Crosshair',
  },
  {
    id: 'card_skill_rapid_fire',
    name: 'Octo-Strike Matrix',
    description: 'Tactical Card: Imprints Octo-Strike skill. Discharges a 360° radial barrage of 8 projectiles simultaneously.',
    rarity: 'rare',
    category: 'Attack',
    effectType: 'skill_card',
    baseValue: 0.20,
    valuePerLevel: 0.10,
    icon: 'Flame',
  },
  {
    id: 'card_skill_calamity',
    name: 'Calamity Singularity',
    description: 'Tactical Card: Imprints Flow of Calamity. Hits trigger chaotic calamity cascade effects.',
    rarity: 'epic',
    category: 'Attack',
    effectType: 'skill_card',
    baseValue: 0.30,
    valuePerLevel: 0.15,
    icon: 'Sparkles',
  },
  {
    id: 'card_skill_lightning',
    name: 'Lightning Dynamo',
    description: 'Tactical Card: Imprints Lightning Chain. Foes trigger chain lightning arcs on death.',
    rarity: 'rare',
    category: 'Attack',
    effectType: 'skill_card',
    baseValue: 0.25,
    valuePerLevel: 0.15,
    icon: 'Zap',
  },
  {
    id: 'card_skill_poison',
    name: 'Venomous Nanites',
    description: 'Tactical Card: Imprints Poison. Inflicts stackable 5% Max HP/sec corrosion ticks.',
    rarity: 'rare',
    category: 'Attack',
    effectType: 'skill_card',
    baseValue: 0.20,
    valuePerLevel: 0.10,
    icon: 'ShieldAlert',
  },
  {
    id: 'card_skill_synergy',
    name: 'Synergy Expansion Core',
    description: 'Tactical Card: Expands active Rare Drop / Skill Synergy slots and boosts global drop effectiveness.',
    rarity: 'epic',
    category: 'Utility',
    effectType: 'skill_card',
    baseValue: 1.0,
    valuePerLevel: 1.0,
    icon: 'Layers',
  },
  {
    id: 'card_skill_rockets',
    name: 'Micro-Rocket Pods',
    description: 'Tactical Card: Imprints Rockets skill. 7% chance on shot to unleash 5 homing explosive micro-rockets (+20% rocket AOE damage/lvl).',
    rarity: 'rare',
    category: 'Attack',
    effectType: 'skill_card',
    baseValue: 0.20,
    valuePerLevel: 0.15,
    icon: 'Rocket',
  },
  {
    id: 'card_skill_laser_sweep',
    name: 'Prismatic Laser Sweep',
    description: 'Tactical Card: Imprints Laser Sweep skill. Every 5s fires a sweeping 40° arc beam that cleaves all intersecting targets.',
    rarity: 'rare',
    category: 'Attack',
    effectType: 'skill_card',
    baseValue: 0.25,
    valuePerLevel: 0.15,
    icon: 'Zap',
  },
  {
    id: 'card_skill_mortar_strike',
    name: 'Orbital Mortar Battery',
    description: 'Tactical Card: Imprints Mortar Strike. Every 8s paints an orbital targeting zone and drops a high-explosive artillery shell.',
    rarity: 'epic',
    category: 'Attack',
    effectType: 'skill_card',
    baseValue: 0.30,
    valuePerLevel: 0.20,
    icon: 'Target',
  },
  {
    id: 'card_recovery_package',
    name: 'Recovery Package Chance',
    description: 'Grants 10% (+4% per level) chance to recover +10% max HP at the end of each wave. [Unlocks at Tier 2, Wave 750]',
    rarity: 'rare',
    category: 'Defense',
    effectType: 'recovery_package_chance',
    baseValue: 0.10,
    valuePerLevel: 0.04,
    icon: 'Activity',
    unlockTier: 2,
    unlockWave: 750,
  },
  {
    id: 'card_land_mine_stun',
    name: 'Land Mine Stun',
    description: 'Landmines have a 15% (+5% per level) chance to stun affected enemies for 2.5 seconds. [Unlocks at Tier 7, Wave 250]',
    rarity: 'rare',
    category: 'Defense',
    effectType: 'land_mine_stun',
    baseValue: 0.15,
    valuePerLevel: 0.05,
    icon: 'ShieldAlert',
    unlockTier: 7,
    unlockWave: 250,
  },
  {
    id: 'card_nuke',
    name: 'Nuke',
    description: 'Fires a tactical nuke once per wave dealing 500% (+150% per level) damage to all enemies. [Unlocks at Tier 11, Wave 10]',
    rarity: 'epic',
    category: 'Attack',
    effectType: 'nuke_damage',
    baseValue: 5.0,
    valuePerLevel: 1.5,
    icon: 'Biohazard',
    unlockTier: 11,
    unlockWave: 10,
  },
  {
    id: 'card_ultimate_crit',
    name: 'Ultimate Crit',
    description: 'Grants +10% (+3% per level) chance for Ultimate Weapons to critically strike for 2.0x damage. [Unlocks at Tier 14, Wave 50]',
    rarity: 'epic',
    category: 'Attack',
    effectType: 'ultimate_crit',
    baseValue: 0.10,
    valuePerLevel: 0.03,
    icon: 'Sparkles',
    unlockTier: 14,
    unlockWave: 50,
  },
  {
    id: 'card_area_of_effect',
    name: 'Area of Effect',
    description: 'Increases the blast radius of all explosive impacts and area of effect triggers by +20% (+10% per level). [Unlocks at Tier 20, Wave 80]',
    rarity: 'epic',
    category: 'Attack',
    effectType: 'aoe_radius',
    baseValue: 0.20,
    valuePerLevel: 0.10,
    icon: 'Search',
    unlockTier: 20,
    unlockWave: 80,
  },
];

/**
 * GAME SPEED CONFIGURATION & LIMITS
 * - Beginner base maximum speed: 1.5x
 * - Lab research "Game Speed Overclock" (lab_game_speed): +0.5x max speed per level
 * - Hard limit: 3.0x
 */
export const MIN_GAME_SPEED = 0.0;
export const BASE_MAX_GAME_SPEED = 1.5;
export const HARD_LIMIT_GAME_SPEED = 3.0;
export const SPEED_PER_LAB_LEVEL = 0.5;
export const ALL_SPEED_STEPS = [0.0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0];

export function getMaxGameSpeed(labResearchLevels: Record<string, number> = {}): number {
  const labLevel = labResearchLevels['lab_game_speed'] || 0;
  return Math.min(HARD_LIMIT_GAME_SPEED, BASE_MAX_GAME_SPEED + labLevel * SPEED_PER_LAB_LEVEL);
}

export function getAvailableGameSpeeds(labResearchLevels: Record<string, number> = {}): number[] {
  const maxSpeed = getMaxGameSpeed(labResearchLevels);
  return ALL_SPEED_STEPS.filter(s => s <= maxSpeed + 0.01);
}

/**
 * LAB RESEARCH CONFIG
 */
export const LAB_RESEARCH_CONFIG: LabResearchDef[] = [
  {
    id: 'lab_game_speed',
    name: 'Maximum Game Speed',
    category: 'Main',
    description: 'Increases maximum available game speed by +0.5x per level (up to 3.0x max). Premium high-cost research.',
    baseCostCells: 175, // Significantly more expensive than other projects (35-75 cells)
    costGrowth: 1.85,
    baseDurationSeconds: 150,
    durationGrowth: 1.6,
    maxLevel: 3, // Level 1: 2.0x, Level 2: 2.5x, Level 3: 3.0x (Hard limit)
    effectType: 'game_speed',
    valuePerLevel: 0.5,
    unit: 'x',
    baseCostShards: 140, // Much more expensive than other projects (25-60 shards)
    costShardsGrowth: 1.75,
    instantGemsCost: 25, // More expensive than other projects (8-15 gems)
  },
  {
    id: 'lab_death_reserve',
    name: 'Emergency Cash Reserve',
    category: 'Utility',
    description: 'Increases the guaranteed cash reserve granted upon death and respawn (+20% per level).',
    baseCostCells: 35,
    costGrowth: 1.35,
    baseDurationSeconds: 40,
    durationGrowth: 1.3,
    maxLevel: 25,
    effectType: 'death_reserve_mult',
    valuePerLevel: 0.20,
    unit: '%',
    baseCostShards: 25,
    costShardsGrowth: 1.3,
    instantGemsCost: 8,
  },
  {
    id: 'lab_defense_absolute',
    name: 'Defense Absolute Mastery',
    category: 'Defense',
    description: 'Multiplies all Defense Absolute by an additional percentage.',
    baseCostCells: 40,
    costGrowth: 1.4,
    baseDurationSeconds: 45,
    durationGrowth: 1.3,
    maxLevel: 20,
    effectType: 'defense_absolute_mult',
    valuePerLevel: 0.10,
    unit: '%',
    baseCostShards: 30,
    costShardsGrowth: 1.35,
    instantGemsCost: 10,
  },
  {
    id: 'lab_shards_bonus',
    name: 'Cosmic Shard Optimization',
    category: 'Utility',
    description: 'Improves permanent Cosmic Shard drop rates across all runs.',
    baseCostCells: 60,
    costGrowth: 1.45,
    baseDurationSeconds: 90,
    durationGrowth: 1.35,
    maxLevel: 25,
    effectType: 'shards_mult',
    valuePerLevel: 0.15,
    unit: '%',
    baseCostShards: 45,
    costShardsGrowth: 1.4,
    instantGemsCost: 12,
  },
  {
    id: 'lab_supply_drop',
    name: 'Orbital Supply Drop Optimization',
    category: 'Utility',
    description: 'Permanently enhances all Orbital Supply Drop shipments (+15% shipment yield per level).',
    baseCostCells: 50,
    costGrowth: 1.40,
    baseDurationSeconds: 60,
    durationGrowth: 1.35,
    maxLevel: 25,
    effectType: 'supply_drop_mult',
    valuePerLevel: 0.15,
    unit: '%',
    baseCostShards: 35,
    costShardsGrowth: 1.35,
    instantGemsCost: 10,
  },
  {
    id: 'lab_damage_boost',
    name: 'Particle Acceleration',
    category: 'Attack',
    description: 'Increases base tower damage multiplier.',
    baseCostCells: 45,
    costGrowth: 1.4,
    baseDurationSeconds: 50,
    durationGrowth: 1.3,
    maxLevel: 30,
    effectType: 'damage_mult',
    valuePerLevel: 0.08,
    unit: '%',
    baseCostShards: 30,
    costShardsGrowth: 1.35,
    instantGemsCost: 10,
  },
  {
    id: 'lab_orb_speed',
    name: 'Orb Velocity Field',
    category: 'Defense',
    description: 'Increases the rotation speed of Orbiting Energy Orbs.',
    baseCostCells: 75,
    costGrowth: 1.5,
    baseDurationSeconds: 120,
    durationGrowth: 1.4,
    maxLevel: 15,
    effectType: 'orb_speed',
    valuePerLevel: 0.20,
    unit: '%',
    baseCostShards: 50,
    costShardsGrowth: 1.4,
    instantGemsCost: 12,
  },
  {
    id: 'lab_elite_slayer',
    name: 'Elite Threat Neutralizer',
    category: 'Attack',
    description: 'Calibrates targeting matrices to deal bonus projectile damage to all Elite geometric hostiles.',
    baseCostCells: 55,
    costGrowth: 1.42,
    baseDurationSeconds: 80,
    durationGrowth: 1.35,
    maxLevel: 20,
    effectType: 'elite_damage_mult',
    valuePerLevel: 0.08,
    unit: '%',
    baseCostShards: 45,
    costShardsGrowth: 1.38,
    instantGemsCost: 12,
  },
  {
    id: 'lab_recovery_package',
    name: 'Emergency Hull Nanites',
    category: 'Defense',
    description: 'Overclocks Recovery Drone nanobots to restore higher percentages of Maximum Hull HP.',
    baseCostCells: 50,
    costGrowth: 1.40,
    baseDurationSeconds: 70,
    durationGrowth: 1.35,
    maxLevel: 15,
    effectType: 'recovery_package_heal',
    valuePerLevel: 0.20,
    unit: '%',
    baseCostShards: 40,
    costShardsGrowth: 1.36,
    instantGemsCost: 10,
  },
  {
    id: 'lab_defense_percent_boost',
    name: 'Hardened Energy Lattice',
    category: 'Defense',
    description: 'Increases the systemic effectiveness and absorption ceiling of Defense % armor.',
    baseCostCells: 65,
    costGrowth: 1.45,
    baseDurationSeconds: 90,
    durationGrowth: 1.38,
    maxLevel: 15,
    effectType: 'defense_percent_boost',
    valuePerLevel: 0.04,
    unit: '%',
    baseCostShards: 55,
    costShardsGrowth: 1.40,
    instantGemsCost: 14,
  },
  {
    id: 'lab_boss_cell_yield',
    name: 'Boss Salvage Protocol',
    category: 'Utility',
    description: 'Enhances sub-atomic salvage scanners to extract higher yields of Research Cells from Bosses.',
    baseCostCells: 70,
    costGrowth: 1.48,
    baseDurationSeconds: 100,
    durationGrowth: 1.40,
    maxLevel: 15,
    effectType: 'boss_cell_yield',
    valuePerLevel: 0.15,
    unit: '%',
    baseCostShards: 60,
    costShardsGrowth: 1.42,
    instantGemsCost: 15,
  },
  {
    id: 'lab_interest_cap',
    name: 'Galactic Banking Reserve',
    category: 'Utility',
    description: 'Increases the maximum end-of-wave Cash interest earning cap (+25% higher cap per level).',
    baseCostCells: 60,
    costGrowth: 1.40,
    baseDurationSeconds: 75,
    durationGrowth: 1.35,
    maxLevel: 10,
    effectType: 'interest_cap_mult',
    valuePerLevel: 0.25,
    unit: '%',
    baseCostShards: 50,
    costShardsGrowth: 1.35,
    instantGemsCost: 12,
  },
  // Skill Matrix Protocols (Alternative Skill Unlock & Overclock System)
  {
    id: 'lab_skill_double_shot',
    name: 'Double Shot Protocol',
    category: 'Skills',
    description: 'Synthesizes and enhances the Double Shot skill, splitting tower shots into twin angled projectiles (+10% split dmg/lvl).',
    baseCostCells: 40,
    costGrowth: 1.35,
    baseDurationSeconds: 45,
    durationGrowth: 1.3,
    maxLevel: 10,
    effectType: 'skill_double_shot',
    valuePerLevel: 0.10,
    unit: '%',
    baseCostShards: 35,
    costShardsGrowth: 1.3,
    instantGemsCost: 10,
    skillId: 'double_shot',
  },
  {
    id: 'lab_skill_piercing',
    name: 'Piercing Laser Calibration',
    category: 'Skills',
    description: 'Synthesizes and calibrates Piercing Laser projectiles, penetrating all geometric targets without dissipating (+12% beam power/lvl).',
    baseCostCells: 45,
    costGrowth: 1.35,
    baseDurationSeconds: 50,
    durationGrowth: 1.3,
    maxLevel: 10,
    effectType: 'skill_piercing',
    valuePerLevel: 0.12,
    unit: '%',
    baseCostShards: 40,
    costShardsGrowth: 1.3,
    instantGemsCost: 10,
    skillId: 'piercing',
  },
  {
    id: 'lab_skill_rapid_fire',
    name: 'Octo-Strike Protocol',
    category: 'Skills',
    description: 'Synthesizes the Octo-Strike protocol, triggering a 360° radial barrage of 8 projectiles simultaneously.',
    baseCostCells: 50,
    costGrowth: 1.35,
    baseDurationSeconds: 55,
    durationGrowth: 1.3,
    maxLevel: 10,
    effectType: 'skill_rapid_fire',
    valuePerLevel: 0.15,
    unit: '%',
    baseCostShards: 45,
    costShardsGrowth: 1.3,
    instantGemsCost: 12,
    skillId: 'rapid_fire',
  },
  {
    id: 'lab_skill_calamity',
    name: 'Flow of Calamity Catalyst',
    category: 'Skills',
    description: 'Synthesizes chaotic RNG calamity cascades (double damage, poison clouds, armor shred, stuns) on impacted targets.',
    baseCostCells: 65,
    costGrowth: 1.4,
    baseDurationSeconds: 70,
    durationGrowth: 1.35,
    maxLevel: 10,
    effectType: 'skill_calamity',
    valuePerLevel: 0.15,
    unit: '%',
    baseCostShards: 60,
    costShardsGrowth: 1.35,
    instantGemsCost: 15,
    skillId: 'flow_of_calamity',
  },
  {
    id: 'lab_skill_lightning',
    name: 'Lightning Chain Dynamo',
    category: 'Skills',
    description: 'Synthesizes Lightning Chain, discharging chain lightning to 3+ nearby enemies on enemy defeat (+15% arc dmg/lvl).',
    baseCostCells: 55,
    costGrowth: 1.35,
    baseDurationSeconds: 60,
    durationGrowth: 1.3,
    maxLevel: 10,
    effectType: 'skill_lightning',
    valuePerLevel: 0.15,
    unit: '%',
    baseCostShards: 50,
    costShardsGrowth: 1.3,
    instantGemsCost: 12,
    skillId: 'lightning_chain',
  },
  {
    id: 'lab_skill_poison',
    name: 'Venom Corrosion Core',
    category: 'Skills',
    description: 'Synthesizes Poison Nanites, infecting foes with stackable Max HP corrosion damage (+10% poison potency/lvl).',
    baseCostCells: 50,
    costGrowth: 1.35,
    baseDurationSeconds: 50,
    durationGrowth: 1.3,
    maxLevel: 10,
    effectType: 'skill_poison',
    valuePerLevel: 0.10,
    unit: '%',
    baseCostShards: 45,
    costShardsGrowth: 1.3,
    instantGemsCost: 10,
    skillId: 'poison',
  },
  {
    id: 'lab_skill_synergy_matrix',
    name: 'Synergy Matrix Expansion',
    category: 'Skills',
    description: 'Expands active tactical skill synergy capacity, unlocking an additional concurrent active skill slot (up to 5 max).',
    baseCostCells: 100,
    costGrowth: 1.75,
    baseDurationSeconds: 150,
    durationGrowth: 1.5,
    maxLevel: 4,
    effectType: 'skill_synergy_slots',
    valuePerLevel: 1,
    unit: ' Slots',
    baseCostShards: 75,
    costShardsGrowth: 1.5,
    instantGemsCost: 20,
    skillId: 'synergy_card_matrix',
  },
  {
    id: 'lab_skill_rockets',
    name: 'Micro-Rocket Barrage Protocol',
    category: 'Skills',
    description: 'Synthesizes Rocket Pods: 7% chance per projectile shot to unleash 5 homing micro-rockets that explode in an AOE blast (+20% rocket AOE damage/lvl).',
    baseCostCells: 65,
    costGrowth: 1.35,
    baseDurationSeconds: 70,
    durationGrowth: 1.3,
    maxLevel: 10,
    effectType: 'skill_rockets',
    valuePerLevel: 0.20,
    unit: '%',
    baseCostShards: 55,
    costShardsGrowth: 1.35,
    instantGemsCost: 14,
    skillId: 'rockets',
  },
  {
    id: 'lab_skill_laser_sweep',
    name: 'Prismatic Laser Sweep Protocol',
    category: 'Skills',
    description: 'Synthesizes Laser Arc Sweep: every 5 seconds, discharges a sweeping 40° arc beam that cleaves all intersecting enemies (+20% beam damage/lvl).',
    baseCostCells: 70,
    costGrowth: 1.35,
    baseDurationSeconds: 75,
    durationGrowth: 1.3,
    maxLevel: 10,
    effectType: 'skill_laser_sweep',
    valuePerLevel: 0.20,
    unit: '%',
    baseCostShards: 60,
    costShardsGrowth: 1.35,
    instantGemsCost: 15,
    skillId: 'laser_sweep',
  },
  {
    id: 'lab_skill_mortar_strike',
    name: 'Orbital Artillery Mortar Protocol',
    category: 'Skills',
    description: 'Synthesizes Orbital Mortar: every 8 seconds, projects a targeting reticle and drops a heavy high-explosive shell dealing devastating AOE damage (+25% blast dmg/lvl).',
    baseCostCells: 80,
    costGrowth: 1.4,
    baseDurationSeconds: 90,
    durationGrowth: 1.35,
    maxLevel: 10,
    effectType: 'skill_mortar_strike',
    valuePerLevel: 0.25,
    unit: '%',
    baseCostShards: 70,
    costShardsGrowth: 1.4,
    instantGemsCost: 18,
    skillId: 'mortar_strike',
  },
  // Ultimate Weapon Lab Overclocks
  {
    id: 'lab_uw_chain_lightning',
    name: 'Chain Lightning High-Voltage Calibration',
    category: 'Attack',
    description: 'Overclocks Chain Lightning, increasing electric jump arc damage and target jumping (+15% damage/lvl).',
    baseCostCells: 85,
    costGrowth: 1.40,
    baseDurationSeconds: 100,
    durationGrowth: 1.35,
    maxLevel: 20,
    effectType: 'uw_chain_lightning_mult',
    valuePerLevel: 0.15,
    unit: '%',
    baseCostShards: 75,
    costShardsGrowth: 1.40,
    instantGemsCost: 18,
  },
  {
    id: 'lab_uw_smart_missiles',
    name: 'Smart Missile Thermobaric Warheads',
    category: 'Attack',
    description: 'Increases Smart Missile blast radius and armor penetration damage (+20% damage/lvl).',
    baseCostCells: 90,
    costGrowth: 1.40,
    baseDurationSeconds: 110,
    durationGrowth: 1.35,
    maxLevel: 20,
    effectType: 'uw_smart_missiles_mult',
    valuePerLevel: 0.20,
    unit: '%',
    baseCostShards: 80,
    costShardsGrowth: 1.40,
    instantGemsCost: 20,
  },
  {
    id: 'lab_uw_death_wave',
    name: 'Death Wave Resonance Frequency',
    category: 'Attack',
    description: 'Amplifies Death Wave shockwave damage and permanent HP bonuses (+15% damage/lvl).',
    baseCostCells: 95,
    costGrowth: 1.42,
    baseDurationSeconds: 120,
    durationGrowth: 1.35,
    maxLevel: 20,
    effectType: 'uw_death_wave_mult',
    valuePerLevel: 0.15,
    unit: '%',
    baseCostShards: 85,
    costShardsGrowth: 1.42,
    instantGemsCost: 22,
  },
  {
    id: 'lab_uw_poison_swamp',
    name: 'Poison Swamp Corrosive Acid',
    category: 'Attack',
    description: 'Enhances Poison Swamp acidic pools with increased duration and corrosive DPS (+20% acid damage/lvl).',
    baseCostCells: 80,
    costGrowth: 1.38,
    baseDurationSeconds: 95,
    durationGrowth: 1.35,
    maxLevel: 20,
    effectType: 'uw_poison_swamp_mult',
    valuePerLevel: 0.20,
    unit: '%',
    baseCostShards: 70,
    costShardsGrowth: 1.38,
    instantGemsCost: 16,
  },
  {
    id: 'lab_uw_spotlight',
    name: 'Spotlight Lumens Amplification',
    category: 'Utility',
    description: 'Enhances the damage amplification multiplier of the fortress Spotlight (+0.15x damage/lvl).',
    baseCostCells: 100,
    costGrowth: 1.45,
    baseDurationSeconds: 130,
    durationGrowth: 1.35,
    maxLevel: 20,
    effectType: 'uw_spotlight_mult',
    valuePerLevel: 0.15,
    unit: 'x',
    baseCostShards: 90,
    costShardsGrowth: 1.45,
    instantGemsCost: 24,
  },
  {
    id: 'lab_uw_inner_landmines',
    name: 'Inner Landmine Blast Radius',
    category: 'Defense',
    description: 'Expands proximity detonation blast radius and shrapnel damage of Inner Landmines (+20% damage/lvl).',
    baseCostCells: 85,
    costGrowth: 1.40,
    baseDurationSeconds: 105,
    durationGrowth: 1.35,
    maxLevel: 20,
    effectType: 'uw_inner_landmines_mult',
    valuePerLevel: 0.20,
    unit: '%',
    baseCostShards: 75,
    costShardsGrowth: 1.40,
    instantGemsCost: 18,
  },
];

/**
 * MILESTONES CONFIG (Tier 1 to Tier 3)
 */
export const INITIAL_MILESTONES: MilestoneDef[] = [
  // Tier 1 Milestones (Cadet & Rookie Progression)
  { tier: 1, wave: 3, title: 'First Defense', rewardType: 'shards', rewardAmount: 10, rewardLabel: '10 Cosmic Shards', isClaimed: false },
  { tier: 1, wave: 5, title: 'First Boss Defeated', rewardType: 'gems', rewardAmount: 15, rewardLabel: '15 Gems', isClaimed: false },
  { tier: 1, wave: 10, title: 'Reach Wave 10', rewardType: 'shards', rewardAmount: 15, rewardLabel: '15 Cosmic Shards', isClaimed: false },
  { tier: 1, wave: 15, title: 'Unlock Cards Arsenal', rewardType: 'unlock_system', rewardAmount: 25, rewardLabel: 'Unlock Cards + 25 Gems', isClaimed: false },
  { tier: 1, wave: 20, title: 'Cadet Fortification', rewardType: 'shards', rewardAmount: 25, rewardLabel: '25 Cosmic Shards', isClaimed: false },
  { tier: 1, wave: 25, title: 'Reach Wave 25', rewardType: 'gems', rewardAmount: 30, rewardLabel: '30 Gems', isClaimed: false },
  { tier: 1, wave: 30, title: 'Unlock Daily Missions', rewardType: 'unlock_system', rewardAmount: 35, rewardLabel: 'Unlock Missions + 35 Gems', isClaimed: false },
  { tier: 1, wave: 40, title: 'Tactical Vanguard', rewardType: 'shards', rewardAmount: 45, rewardLabel: '45 Cosmic Shards', isClaimed: false },
  { tier: 1, wave: 50, title: 'Reach Wave 50', rewardType: 'shards', rewardAmount: 60, rewardLabel: '60 Cosmic Shards', isClaimed: false },
  { tier: 1, wave: 60, title: 'Unlock Tournaments', rewardType: 'unlock_system', rewardAmount: 50, rewardLabel: 'Unlock Tournaments + 50 Gems', isClaimed: false },
  { tier: 1, wave: 70, title: 'Unlock Events', rewardType: 'unlock_system', rewardAmount: 60, rewardLabel: 'Unlock Events + 60 Gems', isClaimed: false },
  { tier: 1, wave: 75, title: 'Sub-Sector Mastery', rewardType: 'gems', rewardAmount: 60, rewardLabel: '60 Gems', isClaimed: false },
  { tier: 1, wave: 85, title: 'Threshold Guardian', rewardType: 'shards', rewardAmount: 85, rewardLabel: '85 Cosmic Shards', isClaimed: false },
  { tier: 1, wave: 100, title: 'Unlock Tier 2 & Labs', rewardType: 'unlock_system', rewardAmount: 100, rewardLabel: 'Unlock Tier 2 + Research Labs + 100 Gems', isClaimed: false },
  { tier: 1, wave: 150, title: 'Outer Orbit Sentinel', rewardType: 'shards', rewardAmount: 150, rewardLabel: '150 Cosmic Shards', isClaimed: false },
  { tier: 1, wave: 200, title: 'Reach Wave 200', rewardType: 'shards', rewardAmount: 250, rewardLabel: '250 Cosmic Shards', isClaimed: false },
  { tier: 1, wave: 350, title: 'Reach Wave 350', rewardType: 'gems', rewardAmount: 150, rewardLabel: '150 Gems', isClaimed: false },
  { tier: 1, wave: 500, title: 'Reach Wave 500', rewardType: 'gems', rewardAmount: 200, rewardLabel: '200 Gems', isClaimed: false },
  { tier: 1, wave: 750, title: 'Cosmic Bastion', rewardType: 'shards', rewardAmount: 500, rewardLabel: '500 Cosmic Shards', isClaimed: false },
  { tier: 1, wave: 831, title: 'Reach Wave 831 Record', rewardType: 'gems', rewardAmount: 500, rewardLabel: '500 Gems + Master Badge', isClaimed: false },
  { tier: 1, wave: 1000, title: 'Reach Wave 1000', rewardType: 'shards', rewardAmount: 1000, rewardLabel: '1,000 Cosmic Shards', isClaimed: false },

  // Tier 2 Milestones (Mid-Game Veteran Sector)
  { tier: 2, wave: 10, title: 'T2: Establish Ground', rewardType: 'shards', rewardAmount: 50, rewardLabel: '50 Cosmic Shards', isClaimed: false },
  { tier: 2, wave: 20, title: 'T2: Kinetic Defense', rewardType: 'shards', rewardAmount: 75, rewardLabel: '75 Cosmic Shards', isClaimed: false },
  { tier: 2, wave: 25, title: 'T2: Breach Threshold', rewardType: 'gems', rewardAmount: 100, rewardLabel: '100 Gems', isClaimed: false },
  { tier: 2, wave: 35, title: 'T2: Sector Recon', rewardType: 'shards', rewardAmount: 120, rewardLabel: '120 Cosmic Shards', isClaimed: false },
  { tier: 2, wave: 50, title: 'T2: Solidify Defense', rewardType: 'shards', rewardAmount: 200, rewardLabel: '200 Cosmic Shards', isClaimed: false },
  { tier: 2, wave: 75, title: 'T2: Elite Incursion', rewardType: 'gems', rewardAmount: 150, rewardLabel: '150 Gems', isClaimed: false },
  { tier: 2, wave: 100, title: 'T2: Centuries of Waves', rewardType: 'gems', rewardAmount: 250, rewardLabel: '250 Gems + Unlock Tier 3', isClaimed: false },
  { tier: 2, wave: 125, title: 'T2: Deep Asteroid Trench', rewardType: 'shards', rewardAmount: 350, rewardLabel: '350 Cosmic Shards', isClaimed: false },
  { tier: 2, wave: 150, title: 'T2: Heavy Artillery Test', rewardType: 'gems', rewardAmount: 200, rewardLabel: '200 Gems', isClaimed: false },
  { tier: 2, wave: 200, title: 'T2: Unbreakable Fortress', rewardType: 'shards', rewardAmount: 800, rewardLabel: '800 Cosmic Shards', isClaimed: false },
  { tier: 2, wave: 250, title: 'T2: Void Leviathan', rewardType: 'gems', rewardAmount: 300, rewardLabel: '300 Gems', isClaimed: false },
  { tier: 2, wave: 300, title: 'T2: Godly Sector', rewardType: 'gems', rewardAmount: 400, rewardLabel: '400 Gems', isClaimed: false },
  { tier: 2, wave: 400, title: 'T2: Apex Dreadnought', rewardType: 'shards', rewardAmount: 1200, rewardLabel: '1,200 Cosmic Shards', isClaimed: false },
  { tier: 2, wave: 500, title: 'T2: Master Sector Conqueror', rewardType: 'gems', rewardAmount: 1000, rewardLabel: '1,000 Gems + T2 Crown', isClaimed: false },

  // Tier 3 Milestones (Nightmare Frontiers)
  { tier: 3, wave: 10, title: 'T3: Hardline Survivor', rewardType: 'shards', rewardAmount: 200, rewardLabel: '200 Cosmic Shards', isClaimed: false },
  { tier: 3, wave: 20, title: 'T3: Void Ingress', rewardType: 'shards', rewardAmount: 250, rewardLabel: '250 Cosmic Shards', isClaimed: false },
  { tier: 3, wave: 25, title: 'T3: Nightmare Breach', rewardType: 'gems', rewardAmount: 300, rewardLabel: '300 Gems', isClaimed: false },
  { tier: 3, wave: 35, title: 'T3: Pulsar Anomaly', rewardType: 'shards', rewardAmount: 400, rewardLabel: '400 Cosmic Shards', isClaimed: false },
  { tier: 3, wave: 50, title: 'T3: Unholy Sector Wave 50', rewardType: 'shards', rewardAmount: 1000, rewardLabel: '1,000 Cosmic Shards', isClaimed: false },
  { tier: 3, wave: 75, title: 'T3: Gravitational Front', rewardType: 'gems', rewardAmount: 600, rewardLabel: '600 Gems', isClaimed: false },
  { tier: 3, wave: 100, title: 'T3: Absolute Vanguard', rewardType: 'gems', rewardAmount: 1000, rewardLabel: '1,000 Gems + Unlock Tier 4', isClaimed: false },
  { tier: 3, wave: 150, title: 'T3: Singularity Breach', rewardType: 'shards', rewardAmount: 1500, rewardLabel: '1,500 Cosmic Shards', isClaimed: false },
  { tier: 3, wave: 200, title: 'T3: Paragon of Despair', rewardType: 'gems', rewardAmount: 2500, rewardLabel: '2,500 Gems + Cosmic Seal', isClaimed: false },
  { tier: 3, wave: 300, title: 'T3: Beyond the Horizon', rewardType: 'gems', rewardAmount: 3000, rewardLabel: '3,000 Gems', isClaimed: false },
  { tier: 3, wave: 500, title: 'T3: Supreme Void Monarch', rewardType: 'gems', rewardAmount: 5000, rewardLabel: '5,000 Gems + Void Sovereign', isClaimed: false },

  // Tier 4 Milestones
  { tier: 4, wave: 10, title: 'T4: Void Incursion', rewardType: 'shards', rewardAmount: 500, rewardLabel: '500 Cosmic Shards', isClaimed: false },
  { tier: 4, wave: 20, title: 'T4: Singularity Gate', rewardType: 'shards', rewardAmount: 750, rewardLabel: '750 Cosmic Shards', isClaimed: false },
  { tier: 4, wave: 25, title: 'T4: Singularity Survivor', rewardType: 'gems', rewardAmount: 500, rewardLabel: '500 Gems', isClaimed: false },
  { tier: 4, wave: 35, title: 'T4: Event Horizon', rewardType: 'shards', rewardAmount: 1000, rewardLabel: '1,000 Cosmic Shards', isClaimed: false },
  { tier: 4, wave: 50, title: 'T4: Apex Bastion', rewardType: 'shards', rewardAmount: 2500, rewardLabel: '2,500 Cosmic Shards', isClaimed: false },
  { tier: 4, wave: 75, title: 'T4: Dark Matter Wall', rewardType: 'gems', rewardAmount: 1500, rewardLabel: '1,500 Gems', isClaimed: false },
  { tier: 4, wave: 100, title: 'T4: Titan Dominator', rewardType: 'gems', rewardAmount: 2500, rewardLabel: '2,500 Gems + Unlock Tier 5', isClaimed: false },
  { tier: 4, wave: 150, title: 'T4: Hypernova Citadel', rewardType: 'shards', rewardAmount: 4000, rewardLabel: '4,000 Cosmic Shards', isClaimed: false },
  { tier: 4, wave: 200, title: 'T4: Stellar Conqueror', rewardType: 'gems', rewardAmount: 5000, rewardLabel: '5,000 Gems + T4 Crown', isClaimed: false },
  { tier: 4, wave: 300, title: 'T4: Cosmos Shatterer', rewardType: 'gems', rewardAmount: 7500, rewardLabel: '7,500 Gems', isClaimed: false },

  // Tier 5 Milestones
  { tier: 5, wave: 10, title: 'T5: Oblivion Gateway', rewardType: 'shards', rewardAmount: 1000, rewardLabel: '1,000 Cosmic Shards', isClaimed: false },
  { tier: 5, wave: 20, title: 'T5: Cosmic Abyss', rewardType: 'shards', rewardAmount: 1500, rewardLabel: '1,500 Cosmic Shards', isClaimed: false },
  { tier: 5, wave: 25, title: 'T5: Reality Breaker', rewardType: 'gems', rewardAmount: 1000, rewardLabel: '1,000 Gems', isClaimed: false },
  { tier: 5, wave: 35, title: 'T5: Chrono Fractures', rewardType: 'shards', rewardAmount: 2500, rewardLabel: '2,500 Cosmic Shards', isClaimed: false },
  { tier: 5, wave: 50, title: 'T5: Celestial Fortress', rewardType: 'shards', rewardAmount: 5000, rewardLabel: '5,000 Cosmic Shards', isClaimed: false },
  { tier: 5, wave: 75, title: 'T5: Absolute Empyrean', rewardType: 'gems', rewardAmount: 3500, rewardLabel: '3,500 Gems', isClaimed: false },
  { tier: 5, wave: 100, title: 'T5: Eternal Sovereign', rewardType: 'gems', rewardAmount: 5000, rewardLabel: '5,000 Gems', isClaimed: false },
  { tier: 5, wave: 150, title: 'T5: Multiversal Apex', rewardType: 'shards', rewardAmount: 10000, rewardLabel: '10,000 Cosmic Shards', isClaimed: false },
  { tier: 5, wave: 200, title: 'T5: Transcendent God', rewardType: 'gems', rewardAmount: 10000, rewardLabel: '10,000 Gems + Transcendent Crown', isClaimed: false },
];

/**
 * INITIAL DAILY MISSIONS
 */
export const INITIAL_MISSIONS: MissionDef[] = [
  {
    id: 'mission_kills',
    title: 'Slay 150 Foes',
    description: 'Destroy standard or elite enemies in combat.',
    target: 150,
    current: 0,
    rewardShards: 15,
    rewardGems: 10,
    isClaimed: false,
    type: 'kills',
  },
  {
    id: 'mission_waves',
    title: 'Survive 30 Waves',
    description: 'Defend the fortress through 30 wave cycles.',
    target: 30,
    current: 0,
    rewardShards: 20,
    rewardGems: 15,
    isClaimed: false,
    type: 'waves',
  },
  {
    id: 'mission_cash',
    title: 'Earn $1,000 Cash',
    description: 'Harvest in-run cash during battles.',
    target: 1000,
    current: 0,
    rewardShards: 25,
    rewardGems: 10,
    isClaimed: false,
    type: 'cash_earned',
  },
  {
    id: 'mission_bosses',
    title: 'Eliminate 3 Bosses',
    description: 'Defeat wave bosses threatening your tower.',
    target: 3,
    current: 0,
    rewardShards: 30,
    rewardGems: 20,
    isClaimed: false,
    type: 'boss_kills',
  },
  {
    id: 'mission_thorns',
    title: 'Reflect 5,000 Thorn DMG',
    description: 'Electrify your hull and bounce damage back to melee attackers.',
    target: 5000,
    current: 0,
    rewardShards: 35,
    rewardGems: 15,
    isClaimed: false,
    type: 'thorns_damage',
  },
  {
    id: 'mission_kills_heavy',
    title: 'Sector Exterminator',
    description: 'Decimate a massive wave of 1,000 enemies.',
    target: 1000,
    current: 0,
    rewardShards: 80,
    rewardGems: 40,
    isClaimed: false,
    type: 'kills',
  },
  {
    id: 'mission_waves_marathon',
    title: 'Marathon Survivalist',
    description: 'Hold down the fort for 100 wave completions.',
    target: 100,
    current: 0,
    rewardShards: 100,
    rewardGems: 50,
    isClaimed: false,
    type: 'waves',
  },
  {
    id: 'mission_cash_tycoon',
    title: 'Cashflow Tycoon',
    description: 'Accumulate a massive cash total of $50,000 inside active runs.',
    target: 50000,
    current: 0,
    rewardShards: 90,
    rewardGems: 45,
    isClaimed: false,
    type: 'cash_earned',
  },
  {
    id: 'mission_bosses_slayer',
    title: 'Slayer of Goliath Units',
    description: 'Intercept and destroy 10 sector boss ships.',
    target: 10,
    current: 0,
    rewardShards: 120,
    rewardGems: 60,
    isClaimed: false,
    type: 'boss_kills',
  },
  {
    id: 'mission_thorns_reactive',
    title: 'Reactive Armor Shielding',
    description: 'Return a combined 30,000 damage to enemies through thorns reflection.',
    target: 30000,
    current: 0,
    rewardShards: 110,
    rewardGems: 55,
    isClaimed: false,
    type: 'thorns_damage',
  },
];

export function rollBossRareDrop(wave: number): { dropType: 'drop' | 'synergy'; item: any } | null {
  // Milestone waves: 100% guaranteed drop. Other boss waves: 35% drop chance.
  const isMilestone = wave === 5 || wave % 10 === 0;
  const roll = Math.random();
  if (!isMilestone && roll > 0.35) {
    return null; // Missed 35% roll on regular boss
  }

  // Roll Rarity Tier
  // Common (40%), Uncommon (30%), Rare (20%), Epic (8%), Legendary (2%)
  const rarityRoll = Math.random() * 100;
  let tier: RarityTier = 'common';
  if (rarityRoll < 2) tier = 'legendary';
  else if (rarityRoll < 10) tier = 'epic';
  else if (rarityRoll < 30) tier = 'rare';
  else if (rarityRoll < 60) tier = 'uncommon';
  else tier = 'common';

  const rarityConfig = RARITY_CONFIGS[tier];

  // 15% chance to drop a Synergy Card, 85% chance for a Rare Drop
  const isSynergy = Math.random() < 0.15;
  if (isSynergy) {
    const card: ActiveSynergyCard = {
      id: 'synergy_card_matrix',
      instanceId: `synergy_${Date.now()}_${Math.random()}`,
      name: `${rarityConfig.name} Synergy Matrix`,
      rarity: tier,
      level: 1,
      slotsGranted: 1,
      globalBonusMult: rarityConfig.effectMultiplier,
      description: `+1 Active Rare Drop Slot & +${Math.round((rarityConfig.effectMultiplier - 1) * 100)}% global drop power.`,
      icon: 'synergy_card_matrix',
    };
    return { dropType: 'synergy', item: card };
  } else {
    const randomDef = RARE_DROPS_DEFINITIONS[Math.floor(Math.random() * RARE_DROPS_DEFINITIONS.length)];
    const drop: ActiveRareDrop = {
      id: randomDef.id,
      instanceId: `drop_${Date.now()}_${Math.random()}`,
      name: `${rarityConfig.name} ${randomDef.name}`,
      rarity: tier,
      level: 1,
      effectMultiplier: rarityConfig.effectMultiplier,
      description: randomDef.description,
      icon: randomDef.icon,
    };
    return { dropType: 'drop', item: drop };
  }
}

/**
 * Calculates Death Cash Reserve based on base amount, wave scaling, workshop level, lab research level, and Loanshark Card.
 */
export interface PlayerCombatStats {
  damage: number;
  fireRate: number;
  critChance: number;
  critMultiplier: number;
  attackRadius: number;
  multishotChance: number;
  rapidFireChance: number;
  bounceShotChance: number;
  defensePercent: number;
  defenseAbsolute: number;
  thornsPercent: number;
  hpRegen: number;
  lifeStealPercent: number;
  knockbackChance: number;
  plasmaBarrierChance: number;
  orbitingOrbs: number;
  bossDamageMult: number;
  eliteDamageMult: number;
  armorPierce: number;
  spawnRateMult: number;
  effectiveMaxHp: number;
  dps: number;
}

export function calculatePlayerCombatStats(arg1: Upgrade[] | Partial<GameState>, arg2?: Partial<GameState> | Upgrade[]): PlayerCombatStats {
  // Support both (upgrades, state) and (state, upgrades) parameter ordering defensively
  let upgradesList: Upgrade[] = [];
  let state: Partial<GameState> = {};

  if (Array.isArray(arg1)) {
    upgradesList = arg1;
    state = (arg2 && !Array.isArray(arg2) ? arg2 : {}) as Partial<GameState>;
  } else if (Array.isArray(arg2)) {
    upgradesList = arg2;
    state = (arg1 || {}) as Partial<GameState>;
  } else {
    state = (arg1 || {}) as Partial<GameState>;
  }

  const safeUpgrades = Array.isArray(upgradesList) ? upgradesList : [];

  const getEquippedCardEffect = (effectType: string): number | null => {
    if (!state.equippedCardIds || state.equippedCardIds.length === 0) return null;
    let total = 0;
    let found = false;
    for (const cardId of state.equippedCardIds) {
      const cardDef = CARDS_CONFIG.find(c => c.id === cardId);
      const playerCard = state.cards?.[cardId];
      if (cardDef && cardDef.effectType === effectType && playerCard) {
        const value = cardDef.baseValue + (playerCard.level - 1) * cardDef.valuePerLevel;
        total += value;
        found = true;
      }
    }
    return found ? total : null;
  };

  // Attack
  const dmgUpg = safeUpgrades.find(u => u.id === 'damage_flat');
  const permDmg = (state.workshopUpgrades?.['perm_base_damage'] || 0) * 3.0;
  const cardDmg = 1 + (getEquippedCardEffect('damage') || 0);
  const labDmg = 1 + (state.labResearchLevels?.['lab_damage_boost'] || 0) * 0.08;

  // FIRST RUN ASSIST (True Noobs with 0 Prestiges & < Wave 30):
  // Temporary decaying damage/HP assist (+20% at wave 1, fading to +0% by wave 30, removed after 1st ascension)
  const isFirstRunNoob = (state.ascensionCount || state.stats?.totalAscensions || 0) === 0 && (state.highestWaveEver || 0) < 30;
  const currentWaveVal = state.wave || 1;
  const firstRunAssistMult = isFirstRunNoob ? Math.max(1.0, 1.20 - (currentWaveVal / 30) * 0.20) : 1.0;

  // Permanent Skill Tree Tech Bonuses
  const techBonuses = computeTechBonuses(state.unlockedTechNodes || []);

  const scroungerActive = state.equippedCardIds?.includes('card_scrounger_protocol');
  const healthCardMult = 1 + (getEquippedCardEffect('health') || 0);
  const healthUpg = safeUpgrades.find(u => u.id === 'health_max');
  const permHp = (state.workshopUpgrades?.['perm_base_hp'] || 0) * 15.0;
  const baseHealth = (healthUpg?.baseValue || 15) + permHp + (healthUpg?.level || 0) * (healthUpg?.increment || 3);
  const effectiveMaxHp = Math.round(baseHealth * healthCardMult * firstRunAssistMult * techBonuses.healthMultiplier * (scroungerActive ? 0.9 : 1.0));

  const hpPercent = (state.playerHp !== undefined ? state.playerHp : effectiveMaxHp) / Math.max(1, effectiveMaxHp);
  const missingHpFactor = Math.max(0, 1 - hpPercent);
  const berserkerRate = getEquippedCardEffect('berserker_damage') || 0;
  const berserkerMult = 1 + (missingHpFactor * 100 * berserkerRate);

  // SUPER TOWER CARD: +10% (+5% per level) boost to Range and Damage
  const superTowerMult = 1 + (getEquippedCardEffect('super_tower_mult') || 0);

  const rawDmg = ((dmgUpg?.baseValue || 15) + permDmg + (dmgUpg?.level || 0) * (dmgUpg?.increment || 2.5)) * cardDmg * labDmg * berserkerMult * superTowerMult * firstRunAssistMult * techBonuses.damageMultiplier;

  // BOSS & ELITE DAMAGE:
  const inRunBossDamage = (safeUpgrades.find(u => u.id === 'boss_damage')?.level || 0) * (safeUpgrades.find(u => u.id === 'boss_damage')?.increment || 0.05);
  const permBossDamage = (state.workshopUpgrades?.['perm_boss_damage'] || 0) * 0.05;
  const permEliteDamage = (state.workshopUpgrades?.['perm_elite_slayer'] || 0) * 0.06;
  const labEliteDamage = (state.labResearchLevels?.['lab_elite_slayer'] || 0) * 0.08;
  const bossDamageMult = 1 + inRunBossDamage + permBossDamage + (getEquippedCardEffect('boss_damage') || 0);
  const eliteDamageMult = 1 + inRunBossDamage + permBossDamage + permEliteDamage + labEliteDamage + (getEquippedCardEffect('elite_damage') || 0);
  const inRunArmorPierce = (safeUpgrades.find(u => u.id === 'armor_pierce')?.level || 0) * (safeUpgrades.find(u => u.id === 'armor_pierce')?.increment || 0.02);
  const permArmorPierce = (state.workshopUpgrades?.['perm_armor_pierce'] || 0) * 0.02;
  const armorPierce = Math.min(1.0, inRunArmorPierce + permArmorPierce + (getEquippedCardEffect('armor_pierce') || 0));

  const speedUpg = safeUpgrades.find(u => u.id === 'shoot_speed');
  const permSpeed = (state.workshopUpgrades?.['perm_attack_speed'] || 0) * 0.05;
  const cardFireRate = getEquippedCardEffect('fire_rate') || 0;

  // Permanent Fire Rate / Attack Speed from Tech Tree (e.g., Rapid Cycle, Thermal Velocity)
  const rawFireRate = ((speedUpg?.baseValue || 1.0) + permSpeed + (speedUpg?.level || 0) * (speedUpg?.increment || 0.08) + cardFireRate) * techBonuses.fireRateMultiplier;

  const critUpg = safeUpgrades.find(u => u.id === 'crit_chance');
  const permCrit = (state.workshopUpgrades?.['perm_crit_chance'] || 0) * 0.02;
  const cardCritChance = getEquippedCardEffect('crit_chance') || 0;
  const rawCritChance = ((critUpg?.baseValue || 0.05) + permCrit + (critUpg?.level || 0) * (critUpg?.increment || 0.0015) + cardCritChance) + techBonuses.critChanceBonus;

  const critMultUpg = safeUpgrades.find(u => u.id === 'crit_multiplier');
  const permCritMult = (state.workshopUpgrades?.['perm_crit_multiplier'] || 0) * 0.10;
  const permCritSurge = (state.workshopUpgrades?.['perm_critical_surge'] || 0) * 0.08;
  const cardCritMult = getEquippedCardEffect('crit_multiplier') || 0;
  const rawCritMult = (critMultUpg?.baseValue || 1.5) + permCritMult + permCritSurge + (critMultUpg?.level || 0) * (critMultUpg?.increment || 0.15) + cardCritMult + techBonuses.critMultiplierBonus;

  const radUpg = safeUpgrades.find(u => u.id === 'attack_radius');
  const permRad = (state.workshopUpgrades?.['perm_range'] || 0) * 2.5;
  const cardRadius = getEquippedCardEffect('range') || 0;
  const rawRadius = ((radUpg?.baseValue || 110) + permRad + cardRadius + (radUpg?.level || 0) * (radUpg?.increment || 2.5)) * superTowerMult;

  const inRunMultishot = (safeUpgrades.find(u => u.id === 'multishot_chance')?.level || 0) * 0.03;
  const permMultishot = (state.workshopUpgrades?.['perm_multishot_chance'] || 0) * 0.02;
  const multishotChance = inRunMultishot + permMultishot;

  const inRunRapidFire = (safeUpgrades.find(u => u.id === 'rapid_fire_chance')?.level || 0) * 0.02;
  const permRapidFire = (state.workshopUpgrades?.['perm_rapid_fire_chance'] || 0) * 0.015;
  const rapidFireChance = inRunRapidFire + permRapidFire;

  const bounceUpgObj = safeUpgrades.find(u => u.id === 'bounce_shot_chance');
  const inRunBounce = (bounceUpgObj?.level || 0) * (bounceUpgObj?.increment || 0.025);
  const permBounce = (state.workshopUpgrades?.['perm_bounce_shot_chance'] || 0) * 0.02;
  const bounceShotChance = inRunBounce + permBounce + (getEquippedCardEffect('bounce_shot_chance') || 0);

  // Defense & Turtle
  const defPercentUpg = safeUpgrades.find(u => u.id === 'defense_percent');
  const permDefPercent = (state.workshopUpgrades?.['perm_defense_percent'] || 0) * 0.01;
  const cardDefPercent = getEquippedCardEffect('defense_percent') || 0;
  const labDefPercentMult = 1 + (state.labResearchLevels?.['lab_defense_percent_boost'] || 0) * 0.04;
  const defPercent = Math.min(0.90, (((defPercentUpg?.level || 0) * (defPercentUpg?.increment || 0.005)) + permDefPercent + cardDefPercent + techBonuses.damageReductionPercent) * labDefPercentMult);

  const defAbsUpgObj = safeUpgrades.find(u => u.id === 'defense_absolute');
  const defAbsUpg = (defAbsUpgObj?.level || 0) * (defAbsUpgObj?.increment || 1.5);
  const permDefAbs = (state.workshopUpgrades?.['perm_defense_absolute'] || 0) * 2.0;
  const permBarrierOvercharge = (state.workshopUpgrades?.['perm_barrier_overcharge'] || 0) * 3.0;
  const cardDefAbs = getEquippedCardEffect('defense_absolute') || 0;
  const labDefAbsMult = 1 + (state.labResearchLevels?.['lab_defense_absolute'] || 0) * 0.10;
  const defenseAbsolute = (defAbsUpg + permDefAbs + permBarrierOvercharge + cardDefAbs) * labDefAbsMult;

  const thornsUpg = (safeUpgrades.find(u => u.id === 'thorns_percent')?.level || 0) * 0.05;
  const permThorns = (state.workshopUpgrades?.['perm_thorns'] || 0) * 0.05;
  const cardThorns = getEquippedCardEffect('thorns') || 0;
  const thornsPercent = thornsUpg + permThorns + cardThorns;

  const hpRegenUpg = (safeUpgrades.find(u => u.id === 'hp_regen')?.level || 0) * (safeUpgrades.find(u => u.id === 'hp_regen')?.increment || 0.25);
  const permHpRegen = (state.workshopUpgrades?.['perm_hp_regen'] || 0) * 0.5;
  const cardHpRegen = getEquippedCardEffect('hp_regen') || 0;
  const hpRegen = hpRegenUpg + permHpRegen + cardHpRegen + techBonuses.hpRegenBonus;

  const lifeStealUpg = (safeUpgrades.find(u => u.id === 'life_steal')?.level || 0) * 0.01;
  const permLifeSteal = (state.workshopUpgrades?.['perm_life_steal'] || 0) * 0.005;
  const cardLifeSteal = getEquippedCardEffect('life_steal') || 0;
  const lifeStealPercent = lifeStealUpg + permLifeSteal + cardLifeSteal;

  const knockbackUpg = (safeUpgrades.find(u => u.id === 'knockback_chance')?.level || 0) * 0.03;
  const permKnockback = (state.workshopUpgrades?.['perm_knockback_chance'] || 0) * 0.02;
  const cardKnockback = getEquippedCardEffect('knockback_chance') || 0;
  const knockbackChance = knockbackUpg + permKnockback + cardKnockback;

  const inRunPlasma = (safeUpgrades.find(u => u.id === 'plasma_barrier_chance')?.level || 0) * 0.015;
  const permPlasma = (state.workshopUpgrades?.['perm_plasma_barrier_chance'] || 0) * 0.01;
  const plasmaBarrierChance = inRunPlasma + permPlasma;

  const inRunOrbs = safeUpgrades.find(u => u.id === 'orbiting_orbs')?.level || 0;
  const permOrbs = state.workshopUpgrades?.['perm_orbiting_orbs'] || 0;
  const cardOrbs = getEquippedCardEffect('orbs') || 0;
  const orbitingOrbs = Math.min(6, inRunOrbs + permOrbs + cardOrbs);

  const finalCritChance = Math.min(0.85, rawCritChance);
  const calculatedDps = rawDmg * rawFireRate * (1 + finalCritChance * (rawCritMult - 1));

  return {
    damage: rawDmg,
    fireRate: rawFireRate,
    critChance: finalCritChance,
    critMultiplier: rawCritMult,
    attackRadius: rawRadius,
    multishotChance,
    rapidFireChance,
    bounceShotChance,
    defensePercent: defPercent,
    defenseAbsolute,
    thornsPercent,
    hpRegen,
    lifeStealPercent,
    knockbackChance,
    plasmaBarrierChance,
    orbitingOrbs,
    bossDamageMult,
    eliteDamageMult,
    armorPierce,
    spawnRateMult: 1 - (getEquippedCardEffect('spawn_rate') || 0),
    effectiveMaxHp,
    dps: calculatedDps,
  };
}

/**
 * Universal Single-Source-of-Truth Live Effective Stat Evaluator.
 * Computes the player's true live effective value for any in-run upgrade ID,
 * aggregating base stat + run levels + permanent shard upgrades + cards + labs + tech bonuses.
 */
export function getLiveEffectiveUpgradeValue(
  upgradeId: string,
  upgrades: Upgrade[],
  state: Partial<GameState>,
  providedStats?: PlayerCombatStats
): number {
  const stats = providedStats || calculatePlayerCombatStats(upgrades, state);
  const upg = upgrades.find(u => u.id === upgradeId);
  const lvl = upg?.level || 0;

  const getCardEffect = (effectType: string): number => {
    if (!state.equippedCardIds || state.equippedCardIds.length === 0) return 0;
    let total = 0;
    for (const cardId of state.equippedCardIds) {
      const cardDef = CARDS_CONFIG.find(c => c.id === cardId);
      const playerCard = state.cards?.[cardId];
      if (cardDef && cardDef.effectType === effectType && playerCard) {
        total += cardDef.baseValue + (playerCard.level - 1) * cardDef.valuePerLevel;
      }
    }
    return total;
  };

  switch (upgradeId) {
    // Attack
    case 'damage_flat':
      return stats.damage;
    case 'shoot_speed':
      return stats.fireRate;
    case 'crit_chance':
      return stats.critChance;
    case 'crit_multiplier':
      return stats.critMultiplier;
    case 'attack_radius':
      return stats.attackRadius;
    case 'multishot_chance':
      return stats.multishotChance;
    case 'rapid_fire_chance':
      return stats.rapidFireChance;
    case 'bounce_shot_chance':
      return stats.bounceShotChance;
    case 'boss_damage':
      return stats.bossDamageMult;
    case 'armor_pierce':
      return stats.armorPierce;

    // Defense / Health
    case 'health_max':
      return stats.effectiveMaxHp;
    case 'hp_regen':
      return stats.hpRegen;
    case 'defense_percent':
      return stats.defensePercent;
    case 'defense_absolute':
      return stats.defenseAbsolute;
    case 'thorns_percent':
      return stats.thornsPercent;
    case 'life_steal':
      return stats.lifeStealPercent;
    case 'knockback_chance':
      return stats.knockbackChance;
    case 'plasma_barrier_chance':
      return stats.plasmaBarrierChance;
    case 'orbiting_orbs':
      return stats.orbitingOrbs;

    // Utility
    case 'cash_bonus': {
      const inRunBonus = (upg?.baseValue || 1.0) + lvl * (upg?.increment || 0.10);
      const permCash = (state.workshopUpgrades?.['perm_cash_bonus'] || 0) * 0.05;
      const cardCash = getCardEffect('cash');
      const tierMult = getTierCashMultiplier(state.tier || 1);
      return inRunBonus * (1 + permCash) * (1 + cardCash) * tierMult;
    }
    case 'cash_per_wave': {
      const inRunSupply = (upg?.baseValue || 1.0) + lvl * (upg?.increment || 0.15);
      const permSupply = (state.workshopUpgrades?.['perm_supply_drop'] || 0) * 0.08;
      const labSupply = (state.labResearchLevels?.['lab_supply_drop'] || 0) * 0.10;
      const cardSupply = getCardEffect('cash_per_wave');
      return inRunSupply * (1 + permSupply) * (1 + labSupply) * (1 + cardSupply);
    }
    case 'shards_per_kill': {
      const inRunShard = (upg?.baseValue || 1.0) + lvl * (upg?.increment || 0.05);
      const permShard = (state.workshopUpgrades?.['perm_shards_per_kill'] || 0) * 0.05;
      const cardShard = getCardEffect('shards');
      return inRunShard * (1 + permShard) * (1 + cardShard);
    }
    case 'shards_per_wave': {
      const inRunShardsWave = lvl * (upg?.increment || 1);
      const permShardsWave = (state.workshopUpgrades?.['perm_shards_per_wave'] || 0);
      return 1 + inRunShardsWave + permShardsWave;
    }
    case 'free_upgrade_chance': {
      const inRunFree = lvl * (upg?.increment || 0.02);
      const permFree = (state.workshopUpgrades?.['perm_free_upgrade_chance'] || 0) * 0.015;
      const cardFree = getCardEffect('free_upgrade_chance');
      return inRunFree + permFree + cardFree;
    }
    case 'interest_rate': {
      const inRunInterest = lvl * (upg?.increment || 0.01);
      const permInterest = (state.workshopUpgrades?.['perm_interest_rate'] || 0) * 0.005;
      const cardInterest = getCardEffect('compound_interest');
      return inRunInterest + permInterest + cardInterest;
    }

    default:
      return (upg?.baseValue || 0) + lvl * (upg?.increment || 1);
  }
}

/**
 * Universal Effective Delta Preview Calculator.
 * Calculates what an upgrade will become if +amount levels are purchased.
 */
export function getLiveEffectiveDelta(
  upgradeId: string,
  amount: number,
  upgrades: Upgrade[],
  state: Partial<GameState>,
  currentVal?: number
): { nextValue: number; delta: number } {
  const current = currentVal !== undefined ? currentVal : getLiveEffectiveUpgradeValue(upgradeId, upgrades, state);
  const simulatedUpgrades = upgrades.map(u => u.id === upgradeId ? { ...u, level: u.level + amount } : u);
  const nextValue = getLiveEffectiveUpgradeValue(upgradeId, simulatedUpgrades, state);
  const delta = nextValue - current;
  return { nextValue, delta };
}

/**
 * Universal Single-Source Formatter for Upgrade & Workshop Values.
 * Guarantees zero discrepancy in formatting across all cards, tiles, badges, and modals.
 */
export function formatUpgradeValue(upgradeId: string, val: number): string {
  if (
    upgradeId === 'crit_chance' ||
    upgradeId === 'perm_crit_chance' ||
    upgradeId === 'defense_percent' ||
    upgradeId === 'perm_defense_percent' ||
    upgradeId === 'thorns_percent' ||
    upgradeId === 'perm_thorns' ||
    upgradeId === 'life_steal' ||
    upgradeId === 'perm_life_steal' ||
    upgradeId === 'knockback_chance' ||
    upgradeId === 'perm_knockback_chance' ||
    upgradeId === 'multishot_chance' ||
    upgradeId === 'perm_multishot_chance' ||
    upgradeId === 'rapid_fire_chance' ||
    upgradeId === 'perm_rapid_fire_chance' ||
    upgradeId === 'bounce_shot_chance' ||
    upgradeId === 'perm_bounce_shot_chance' ||
    upgradeId === 'free_upgrade_chance' ||
    upgradeId === 'perm_free_upgrade_chance' ||
    upgradeId === 'plasma_barrier_chance' ||
    upgradeId === 'perm_plasma_barrier_chance' ||
    upgradeId === 'armor_pierce' ||
    upgradeId === 'perm_armor_pierce' ||
    upgradeId === 'interest_rate' ||
    upgradeId === 'perm_interest_rate' ||
    upgradeId === 'perm_recovery_package'
  ) {
    return `${(val * 100).toFixed(1)}%`;
  }
  if (
    upgradeId === 'crit_multiplier' ||
    upgradeId === 'perm_crit_multiplier' ||
    upgradeId === 'perm_critical_surge' ||
    upgradeId === 'cash_bonus' ||
    upgradeId === 'perm_cash_mult' ||
    upgradeId === 'shards_per_kill' ||
    upgradeId === 'perm_shards_yield' ||
    upgradeId === 'boss_damage' ||
    upgradeId === 'perm_boss_damage' ||
    upgradeId === 'cash_per_wave' ||
    upgradeId === 'perm_supply_drop'
  ) {
    return `x${val.toFixed(2)}`;
  }
  if (upgradeId === 'attack_radius' || upgradeId === 'perm_range') {
    return `${val.toFixed(0)}m`;
  }
  if (
    upgradeId === 'shoot_speed' ||
    upgradeId === 'perm_attack_speed' ||
    upgradeId === 'hp_regen' ||
    upgradeId === 'perm_hp_regen'
  ) {
    return `${val.toFixed(2)}/s`;
  }
  if (upgradeId === 'orbiting_orbs' || upgradeId === 'perm_orbiting_orbs') {
    return `${Math.round(val)} Orbs`;
  }
  if (upgradeId === 'shards_per_wave' || upgradeId === 'perm_shards_per_wave') {
    return `+${Math.round(val)} ✦`;
  }
  if (val >= 1000) {
    return formatCurrency(val);
  }
  if (val % 1 === 0) return val.toFixed(0);
  return val.toFixed(1);
}

/**
 * Mapping between Permanent Workshop Upgrade ID and corresponding combat stat upgrade ID.
 */
export const WORKSHOP_TO_UPGRADE_MAP: Record<string, string> = {
  perm_base_damage: 'damage_flat',
  perm_attack_speed: 'shoot_speed',
  perm_crit_chance: 'crit_chance',
  perm_crit_multiplier: 'crit_multiplier',
  perm_critical_surge: 'crit_multiplier',
  perm_range: 'attack_radius',
  perm_multishot_chance: 'multishot_chance',
  perm_rapid_fire_chance: 'rapid_fire_chance',
  perm_bounce_shot_chance: 'bounce_shot_chance',
  perm_boss_damage: 'boss_damage',
  perm_elite_slayer: 'boss_damage',
  perm_armor_pierce: 'armor_pierce',
  perm_base_hp: 'health_max',
  perm_hp_regen: 'hp_regen',
  perm_defense_percent: 'defense_percent',
  perm_defense_absolute: 'defense_absolute',
  perm_barrier_overcharge: 'defense_absolute',
  perm_thorns: 'thorns_percent',
  perm_life_steal: 'life_steal',
  perm_knockback_chance: 'knockback_chance',
  perm_plasma_barrier_chance: 'plasma_barrier_chance',
  perm_orbiting_orbs: 'orbiting_orbs',
  perm_cash_mult: 'cash_bonus',
  perm_supply_drop: 'cash_per_wave',
  perm_shards_per_wave: 'shards_per_wave',
  perm_shards_yield: 'shards_per_kill',
  perm_free_upgrade_chance: 'free_upgrade_chance',
  perm_interest_rate: 'interest_rate',
};

/**
 * Computes the player's TRUE live total effective stat value corresponding to any Workshop card,
 * as well as the simulated value if +levelsToBuy are purchased.
 */
export function getWorkshopLiveEffectiveValue(
  workshopId: string,
  upgrades: Upgrade[] | undefined,
  state: Partial<GameState>
): { totalValue: number; formattedTotal: string; isStatMapped: boolean; upgradeId?: string } {
  const safeUpgrades = (upgrades && upgrades.length > 0) 
    ? upgrades 
    : (state.upgrades && state.upgrades.length > 0)
    ? state.upgrades
    : UPGRADES_CONFIG.map(c => ({ ...c, level: 0 }));

  const mappedUpgradeId = WORKSHOP_TO_UPGRADE_MAP[workshopId];
  if (!mappedUpgradeId) {
    return {
      totalValue: 0,
      formattedTotal: '',
      isStatMapped: false,
    };
  }

  const totalValue = getLiveEffectiveUpgradeValue(mappedUpgradeId, safeUpgrades, state);
  const formattedTotal = formatUpgradeValue(mappedUpgradeId, totalValue);
  return {
    totalValue,
    formattedTotal,
    isStatMapped: true,
    upgradeId: mappedUpgradeId,
  };
}

/**
 * Calculates current and next total effective value when purchasing +levelsToBuy in the Workshop.
 */
export function getWorkshopLiveEffectiveDelta(
  workshopId: string,
  levelsToBuy: number,
  upgrades: Upgrade[] | undefined,
  state: Partial<GameState>
): {
  currentTotal: number;
  nextTotal: number;
  delta: number;
  formattedCurrentTotal: string;
  formattedNextTotal: string;
  formattedDelta: string;
  isStatMapped: boolean;
} {
  const safeUpgrades = (upgrades && upgrades.length > 0) 
    ? upgrades 
    : (state.upgrades && state.upgrades.length > 0)
    ? state.upgrades
    : UPGRADES_CONFIG.map(c => ({ ...c, level: 0 }));

  const mappedUpgradeId = WORKSHOP_TO_UPGRADE_MAP[workshopId];
  if (!mappedUpgradeId) {
    return {
      currentTotal: 0,
      nextTotal: 0,
      delta: 0,
      formattedCurrentTotal: '',
      formattedNextTotal: '',
      formattedDelta: '',
      isStatMapped: false,
    };
  }

  const currentTotal = getLiveEffectiveUpgradeValue(mappedUpgradeId, safeUpgrades, state);
  const currentLvl = state.workshopUpgrades?.[workshopId] || 0;
  const simulatedWorkshop = {
    ...(state.workshopUpgrades || {}),
    [workshopId]: currentLvl + levelsToBuy,
  };
  const simulatedState = {
    ...state,
    workshopUpgrades: simulatedWorkshop,
  };
  const nextTotal = getLiveEffectiveUpgradeValue(mappedUpgradeId, safeUpgrades, simulatedState);
  const delta = nextTotal - currentTotal;

  return {
    currentTotal,
    nextTotal,
    delta,
    formattedCurrentTotal: formatUpgradeValue(mappedUpgradeId, currentTotal),
    formattedNextTotal: formatUpgradeValue(mappedUpgradeId, nextTotal),
    formattedDelta: delta >= 0 ? `+${formatUpgradeValue(mappedUpgradeId, delta)}` : formatUpgradeValue(mappedUpgradeId, delta),
    isStatMapped: true,
  };
}

/**
 * Calculates Death Cash Reserve based on run progression and permanent upgrades.
 * - FIRST-DEATH LEEWAY (isFirstDeath = true): Generous one-time beginner cushion
 *   giving $35–$45 so the player can immediately afford 2–3 meaningful early upgrades!
 * - SUBSEQUENT RUNS: Fair, linear scaling based on waves cleared, damage dealt/enemies defeated,
 *   plus workshop starting cash and lab research multipliers.
 */
export function calculateDeathCashReserve(
  highestWaveEver: number,
  workshopStartingCashLevel: number = 0,
  labDeathReserveLevel: number = 0,
  loansharkMultiplier: number = 1.0,
  isFirstDeath: boolean = false,
  waveReached: number = 1,
  techStartingCashBonus: number = 0
): number {
  // 1. One-time Noob Leeway Bonus on First Death
  if (isFirstDeath) {
    const firstDeathBonus = 35 + Math.min(25, waveReached * 2) + techStartingCashBonus; // $37 - $60 for first death
    return Math.round(firstDeathBonus * loansharkMultiplier);
  }

  // 2. Regular Runs: Steady, balanced scaling based on run depth and lifetime peak
  // Base progress coins: every wave reached grants steady coin backing ($2.5 per wave)
  const effectiveWave = Math.max(waveReached, highestWaveEver);
  const waveCoinReward = Math.max(0, Math.floor(effectiveWave * 2.5));

  // Workshop Starting Cash upgrade (+$25 base per level) + Permanent Tech Tree Vault Boost
  const workshopBonus = workshopStartingCashLevel * 25 + techStartingCashBonus;

  const rawTotal = waveCoinReward + workshopBonus;

  // Lab Research multiplier (+15% per lab level)
  const labMultiplier = 1 + labDeathReserveLevel * 0.15;

  const finalCash = Math.round(rawTotal * labMultiplier * loansharkMultiplier);
  
  // Healthy progression scaling with generous ceiling for high-tier endless runs
  const maxCap = 5000;
  return Math.max(10, Math.min(maxCap, finalCash));
}

/**
 * Gem costs to unlock additional simultaneous Lab Research bars/slots.
 * Slot 1: Unlocked by default with Lab at Wave 30 (free)
 * Slot 2: 100 Gems
 * Slot 3: 250 Gems
 * Slot 4: 500 Gems
 * Slot 5: 1,000 Gems
 */
export const LAB_SLOT_GEM_COSTS: number[] = [0, 100, 250, 500, 1000];
export const MAX_LAB_SLOTS: number = 5;

/**
 * Gem costs for Cards Arsenal (💎 Premium Gems)
 * - Single Card Booster Pack: 20 Premium Gems (💎)
 * - 10x Card Booster Pack: 200 Premium Gems (💎)
 * - Card Capacity Slots (Slots 2..8): 25, 50, 100, 200, 400, 800, 1,500 Gems
 */
export const CARD_PACK_GEM_COST = 20;
export const CARD_SLOT_GEM_COSTS: number[] = [25, 50, 100, 200, 400, 800, 1500];


