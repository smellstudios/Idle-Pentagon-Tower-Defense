/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Graphics } from 'pixi.js';

export interface Entity {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  graphics: Graphics;
  type?: string;
  speed?: number;
  dps?: number;
  radius: number;
  rotation: number;
  angularVelocity: number;
  poisonTimer?: number;
  poisonDps?: number;
  calamityEvents?: string[];
  isPiercing?: boolean;
  orbitAngle?: number;
  orbitRadius?: number;
  orbitDirection?: number;
  orbitSpeed?: number;
  shootRange?: number;
  shootCooldownMs?: number;
  lastEnemyShotTime?: number;
  isOrbiting?: boolean;
  isAllied?: boolean;
  alliedTimer?: number;
  bouncesLeft?: number;
  isLightning?: boolean;
  blinkTimerMs?: number;
  hasShieldAura?: boolean;
  zigzagOffset?: number;
  drawnType?: string;
  lifeMs?: number;
  lastOrbHitTime?: number;
  stunTimer?: number;
  decayStacks?: number;
  decayTimer?: number;
  bleedTimer?: number;
  bleedFrame?: number; // Added for 5-frame animation
  smellyAuraTimer?: number; // Added for aura animation
  isDecayBullet?: boolean;
  isShrapnelBullet?: boolean;
  hasPoison?: boolean;
  // New Shape Modifiers & Variants:
  isShielded?: boolean;
  shieldHp?: number;
  maxShieldHp?: number;
  resistantAilment?: 'poison' | 'decay' | 'shock' | 'freeze' | 'bleed';
  isGolden?: boolean;
  goldSparkleTimer?: number;
  // Enrage Shape:
  isEnraged?: boolean;
  hasBalloon?: boolean;
  smokeTimer?: number;
  // Phase Shifter Shape:
  isPhased?: boolean;
  phaseTimerMs?: number;
  phaseCycleMs?: number;
  // Disruptor EMP Shape:
  empAuraRadius?: number;
  // Reflector Prism Shape:
  isDeflector?: boolean;
  // Splitter Cluster Shape:
  isSplitter?: boolean;
  // Spotlight Ultimate Weapon:
  isSpotlit?: boolean;
  spotlightMultiplier?: number;
}

export interface AscensionSummaryData {
  waveReached: number;
  enemiesDefeated: number;
  totalShardsEarned: number;
  baseShards?: number;
  techBonusShards?: number;
  enemiesBonusShards?: number;
  bossesBonusShards?: number;
  recordBonusShards?: number;
  cashEarnedThisRun?: number;
  highestWaveEver?: number;
  newRecord?: boolean;
  ascensionCount?: number;
  reservedCashGained?: number;
  loansharkMultiplier?: number;
}

export interface ActiveBossInfo {
  hp: number;
  maxHp: number;
  name: string;
  wave: number;
}

export interface CardDef {
  id: string;
  name: string;
  description: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic';
  category?: 'Attack' | 'Defense' | 'Utility';
  effectType: 
    | 'damage' 
    | 'health' 
    | 'defense_absolute' 
    | 'thorns' 
    | 'cash' 
    | 'shards' 
    | 'speed' 
    | 'orbs' 
    | 'enemy_balance' 
    | 'loanshark_mult'
    | 'range'
    | 'fire_rate'
    | 'cash_per_wave'
    | 'hp_regen'
    | 'crit_chance'
    | 'crit_multiplier'
    | 'life_steal'
    | 'knockback_chance'
    | 'orbital_totem'
    | 'toxic_drone'
    | 'gravity_anchor'
    | 'energy_beacon'
    | 'shredder_field'
    | 'friendly_fire'
    | 'crit_share'
    | 'uno_reverse'
    | 'singularity_core'
    | 'quantum_barrier'
    | 'wave_skip'
    | 'interest'
    | 'berserker_damage'
    | 'lucky_strike'
    | 'death_defy'
    | 'scrounger_mult'
    | 'defense_percent'
    | 'super_tower_mult'
    | 'link_multiplier'
    | 'plasma_block'
    | 'boss_damage'
    | 'elite_damage'
    | 'free_upgrade'
    | 'recovery_amount'
    | 'spawn_rate'
    | 'exp_boost'
    | 'armor_pierce'
    | 'slow_aura'
    | 'gold_bot'
    | 'shard_bot'
    | 'skill_card'
    | 'recovery_package_chance'
    | 'land_mine_stun'
    | 'nuke_damage'
    | 'ultimate_crit'
    | 'aoe_radius';
  baseValue: number;
  valuePerLevel: number;
  icon: string;
  unlockTier?: number;
  unlockWave?: number;
}

export interface PlayerCard {
  id: string;
  level: number;
  duplicates: number; // Duplicates needed for next level
  isEquipped: boolean;
}

export interface LabResearchDef {
  id: string;
  name: string;
  category: 'Main' | 'Attack' | 'Defense' | 'Utility' | 'Skills';
  description: string;
  baseCostCells: number;
  costGrowth: number;
  baseDurationSeconds: number;
  durationGrowth: number;
  maxLevel: number;
  effectType: string;
  valuePerLevel: number;
  unit: string;
  baseCostShards?: number;
  costShardsGrowth?: number;
  instantGemsCost?: number;
  skillId?: RareDropType | 'synergy_card_matrix';
}

export interface ActiveLabSlot {
  researchId: string | null;
  targetLevel: number;
  startTime: number;
  endTime: number;
  isCompleted: boolean;
}

export interface MissionDef {
  id: string;
  title: string;
  description: string;
  target: number;
  current: number;
  rewardShards: number;
  rewardGems: number;
  isClaimed: boolean;
  type: 'kills' | 'waves' | 'cash_earned' | 'thorns_damage' | 'boss_kills';
}

export interface MilestoneDef {
  tier: number;
  wave: number;
  title: string;
  rewardType: 'gems' | 'shards' | 'unlock_system' | 'cards';
  rewardAmount: number;
  rewardLabel: string;
  isClaimed: boolean;
}

export interface LifetimeStats {
  playerId: string;
  gameStartDate: number;
  lifetimeCash: number;
  lifetimeCosmicShards: number;
  lifetimeGems: number;
  totalDamageDealt: number;
  totalEnemiesSlain: number;
  totalBossesSlain: number;
  totalRunsStarted: number;
  totalAscensions?: number;
  highestWavePerTier: Record<number, number>;
  totalPlaytimeSeconds: number;
}

export interface GameSettings {
  pauseInMenus: boolean;
  targetFps: 30 | 60 | 120;
  showCashPopups: boolean;
  showShardPopups: boolean;
  showDamageNumbers: boolean;
  soundMuted: boolean;
  bgmMuted: boolean;
  useLegacyCurrencyFormat?: boolean;
  highPerformanceMode?: boolean;
  showFpsCounter?: boolean;
  autoLevelUpCards?: boolean;
}

export type FireProtocolType = 'standard' | 'gatling' | 'plasma_beam' | 'calamity_shell' | 'singularity_vortex';

export interface GameState {
  // Currencies
  cash: number; // In-run currency ($)
  cosmicShards: number; // Permanent meta-progression currency (✦)
  gems: number; // Premium progression currency (💎)
  cells: number; // Research currency (🧪)
  tournamentStones: number; // Milestone/tournament tokens (▲)
  
  // Custom Combat Weapon Protocol (Endgame Chaos System)
  fireProtocol?: FireProtocolType;
  
  // Progression & Waves
  tier: number;
  wave: number;
  highestWaveThisRun: number;
  highestWaveEver: number;
  ascensionCount: number;
  gameSpeed: number; // 1.0, 1.5 (beginner max), up to 3.0x via Lab Overclock

  // Permanent Workshop Upgrades (id -> level)
  workshopUpgrades: Record<string, number>;

  // Permanent Skill Tree / Ascension Matrix
  unlockedTechNodes?: string[];

  // Cards System
  cards: Record<string, PlayerCard>;
  maxCardSlots: number;
  equippedCardIds: string[];

  // Labs System
  labSlotsCount: number;
  labSlots: ActiveLabSlot[];
  labResearchLevels: Record<string, number>;
  labQueue: { researchId: string; targetLevel: number }[];

  // Missions & Milestones
  missions: MissionDef[];
  weeklyMissionProgress: number; // 0 to 100
  milestones: MilestoneDef[];

  // Unlocked Systems (Progressive Reveal)
  unlockedSystems: {
    cards: boolean;
    missions: boolean;
    tournaments: boolean;
    events: boolean;
    labs: boolean;
    tier2: boolean;
    advancedAttack: boolean;
    advancedDefense: boolean;
  };

  // Wave Combat State
  waveProgress: number; // 0 to 1
  enemiesRemaining: number;
  totalEnemiesInWave: number;
  isWaveActive: boolean;
  playerHp: number;
  playerMaxHp: number;
  effectiveMaxHp?: number;
  activeBoss: ActiveBossInfo | null;
  orbitingOrbsCount: number;

  // Technical & Settings
  settings: GameSettings;
  stats: LifetimeStats;
  lastOfflineTime: number;
  bulkBuyMode: 'x1' | 'x10' | 'xMax';
  isDead: boolean;
  deathSummary: AscensionSummaryData | null;

  // Combat & Visual Configuration
  attackRadius: number;
  showAttackRadius: boolean;
  popupDensity: 'off' | 'low' | 'medium' | 'high';
  pulseOnEnemyEnter: boolean;
  isPlayerIdle: boolean;
  enemiesInRangeCount: number;

  // Rare Drops & Synergy System
  activeRareDrops: ActiveRareDrop[];
  synergySlots: number; // Default 1, up to 5 with Synergy Cards
  rareDropCollection: Record<string, RareDropProgress>; // Keyed by drop/card ID
  activeSynergyCards: ActiveSynergyCard[];
  latestAcquiredDrop: ActiveRareDrop | ActiveSynergyCard | null;
}

export type RarityTier = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export type RareDropType = 
  | 'double_shot'
  | 'piercing'
  | 'rapid_fire'
  | 'flow_of_calamity'
  | 'lightning_chain'
  | 'poison'
  | 'rockets'
  | 'laser_sweep'
  | 'mortar_strike'
  | 'poison_linger'
  | 'decaying_plague'
  | 'shrapnel_rainfall';

export interface RarityConfig {
  tier: RarityTier;
  name: string;
  colorHex: string;
  effectMultiplier: number;
  dropChancePercent: number;
}

export interface ActiveRareDrop {
  id: RareDropType;
  instanceId: string;
  name: string;
  rarity: RarityTier;
  level: number;
  effectMultiplier: number;
  description: string;
  icon: string;
}

export interface ActiveSynergyCard {
  id: string;
  instanceId: string;
  name: string;
  rarity: RarityTier;
  level: number;
  slotsGranted: number;
  globalBonusMult: number;
  description: string;
}

export interface RareDropProgress {
  id: string;
  level: number;
  copies: number; // 0..3 tracker for next level
  highestRaritySeen: RarityTier;
}

export interface Upgrade {
  id: string;
  name: string;
  group: 'Damage' | 'Health' | 'Utility';
  level: number;
  baseValue: number;
  increment: number;
  costGrowth: number;
  baseCost: number; // Cash cost
  maxLevel?: number;
  unlockTier?: number;
  description?: string;
  unit?: string;
}

export type EnemyType = 
  | 'red_square' 
  | 'orange_triangle' 
  | 'big_square' 
  | 'circle' 
  | 'purple_pentagon' 
  | 'gold_hexagon' 
  | 'emerald_diamond' 
  | 'crimson_octagon' 
  | 'enraged_trapezium'
  | 'disruptor_emp'
  | 'reflector_prism'
  | 'splitter_cluster'
  | 'cluster_mini'
  | 'phase_shifter'
  | 'boss';

export interface EnemyStats {
  id: EnemyType;
  name: string;
  hp: number;
  maxHp: number;
  dps: number;
  speed: number;
  type: string;
  isBoss: boolean;
}
