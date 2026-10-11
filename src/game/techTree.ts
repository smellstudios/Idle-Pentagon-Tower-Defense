/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface TechNode {
  id: string;
  branch: 'firepower' | 'fortification' | 'efficiency' | 'ascension_mastery';
  branchIndex: number; // 1 to 12 or 1 to 10
  name: string;
  description: string;
  cost: number; // Cosmic Shards
  statType: 
    | 'damage_percent'
    | 'fire_rate_percent'
    | 'crit_chance_flat'
    | 'crit_mult_flat'
    | 'health_percent'
    | 'damage_reduction_percent'
    | 'hp_regen_flat'
    | 'boss_damage_reduction'
    | 'stardust_multiplier'
    | 'upgrade_cost_discount'
    | 'shard_gain_multiplier'
    | 'starting_wave_bonus'
    | 'rare_shard_chance_boost'
    | 'starting_cash_boost'
    | 'auto_battle_speed_mult';
  value: number; // e.g., 0.10 for +10%
  isCapstone?: boolean;
  requiredOtherBranchNodes?: number; // Capstone requirement
}

// Cost pacing discipline:
// First 10 nodes across all branches follow closely-matched, smooth curve:
// 2, 4, 7, 11, 16, 22, 30, 40, 52, 68
// Nodes 11 & 12 (capstones in 12-node branches): 90, 120 (bounded growth, no unbounded runaway)
const STANDARD_10_COSTS = [2, 4, 7, 11, 16, 22, 30, 40, 52, 68];
const CAPSTONE_COSTS = [90, 120];

export const TECH_TREE_BRANCHES: {
  id: TechNode['branch'];
  name: string;
  focus: string;
  nodeCount: number;
}[] = [
  { id: 'firepower', name: 'Firepower', focus: 'Tower damage, fire rate & crits', nodeCount: 12 },
  { id: 'fortification', name: 'Fortification', focus: 'Tower health, armor & boss survivability', nodeCount: 12 },
  { id: 'efficiency', name: 'Efficiency', focus: 'Stardust yield & upgrade cost reduction', nodeCount: 10 },
  { id: 'ascension_mastery', name: 'Ascension Mastery', focus: 'Cosmic Shard yields & wave headstarts', nodeCount: 10 },
];

export const TECH_TREE_NODES: TechNode[] = [
  // ==========================================
  // BRANCH 1: FIREPOWER (12 Nodes)
  // ==========================================
  {
    id: 'fp_1',
    branch: 'firepower',
    branchIndex: 1,
    name: 'Tuned Emitters',
    description: '+12% Tower Projectile Damage',
    cost: STANDARD_10_COSTS[0],
    statType: 'damage_percent',
    value: 0.12,
  },
  {
    id: 'fp_2',
    branch: 'firepower',
    branchIndex: 2,
    name: 'Rapid Cycle I',
    description: '+10% Tower Auto-Fire Rate',
    cost: STANDARD_10_COSTS[1],
    statType: 'fire_rate_percent',
    value: 0.10,
  },
  {
    id: 'fp_3',
    branch: 'firepower',
    branchIndex: 3,
    name: 'Focused Lens',
    description: '+4% Projectile Critical Strike Chance',
    cost: STANDARD_10_COSTS[2],
    statType: 'crit_chance_flat',
    value: 0.04,
  },
  {
    id: 'fp_4',
    branch: 'firepower',
    branchIndex: 4,
    name: 'Supercharged Core',
    description: '+15% Tower Projectile Damage',
    cost: STANDARD_10_COSTS[3],
    statType: 'damage_percent',
    value: 0.15,
  },
  {
    id: 'fp_5',
    branch: 'firepower',
    branchIndex: 5,
    name: 'Heavy Impact',
    description: '+0.30x Critical Strike Multiplier',
    cost: STANDARD_10_COSTS[4],
    statType: 'crit_mult_flat',
    value: 0.30,
  },
  {
    id: 'fp_6',
    branch: 'firepower',
    branchIndex: 6,
    name: 'Rapid Cycle II',
    description: '+12% Tower Auto-Fire Rate',
    cost: STANDARD_10_COSTS[5],
    statType: 'fire_rate_percent',
    value: 0.12,
  },
  {
    id: 'fp_7',
    branch: 'firepower',
    branchIndex: 7,
    name: 'Plasma Compression',
    description: '+20% Tower Projectile Damage',
    cost: STANDARD_10_COSTS[6],
    statType: 'damage_percent',
    value: 0.20,
  },
  {
    id: 'fp_8',
    branch: 'firepower',
    branchIndex: 8,
    name: 'Precision Optics',
    description: '+5% Critical Strike Chance',
    cost: STANDARD_10_COSTS[7],
    statType: 'crit_chance_flat',
    value: 0.05,
  },
  {
    id: 'fp_9',
    branch: 'firepower',
    branchIndex: 9,
    name: 'Thermal Velocity',
    description: '+15% Tower Auto-Fire Rate',
    cost: STANDARD_10_COSTS[8],
    statType: 'fire_rate_percent',
    value: 0.15,
  },
  {
    id: 'fp_10',
    branch: 'firepower',
    branchIndex: 10,
    name: 'Devastation Beam',
    description: '+0.45x Critical Strike Multiplier',
    cost: STANDARD_10_COSTS[9],
    statType: 'crit_mult_flat',
    value: 0.45,
  },
  {
    id: 'fp_11',
    branch: 'firepower',
    branchIndex: 11,
    name: 'Annihilation Catalyst',
    description: '+30% Tower Projectile Damage',
    cost: CAPSTONE_COSTS[0],
    statType: 'damage_percent',
    value: 0.30,
  },
  {
    id: 'fp_12',
    branch: 'firepower',
    branchIndex: 12,
    name: 'Apex Fortress Battery',
    description: '+40% Tower Damage & +15% Fire Rate Capstone (Requires 8 nodes in other branches)',
    cost: CAPSTONE_COSTS[1],
    statType: 'damage_percent',
    value: 0.40,
    isCapstone: true,
    requiredOtherBranchNodes: 8,
  },

  // ==========================================
  // BRANCH 2: FORTIFICATION (12 Nodes)
  // ==========================================
  {
    id: 'fort_1',
    branch: 'fortification',
    branchIndex: 1,
    name: 'Reinforced Bulkhead',
    description: '+15% Tower Max Health',
    cost: STANDARD_10_COSTS[0],
    statType: 'health_percent',
    value: 0.15,
  },
  {
    id: 'fort_2',
    branch: 'fortification',
    branchIndex: 2,
    name: 'Ablative Plating I',
    description: '+3% Passive Damage Reduction',
    cost: STANDARD_10_COSTS[1],
    statType: 'damage_reduction_percent',
    value: 0.03,
  },
  {
    id: 'fort_3',
    branch: 'fortification',
    branchIndex: 3,
    name: 'Nanite Repair Siphon',
    description: '+0.4 HP/sec Passive Regeneration',
    cost: STANDARD_10_COSTS[2],
    statType: 'hp_regen_flat',
    value: 0.4,
  },
  {
    id: 'fort_4',
    branch: 'fortification',
    branchIndex: 4,
    name: 'Kinetic Dampeners',
    description: '+20% Tower Max Health',
    cost: STANDARD_10_COSTS[3],
    statType: 'health_percent',
    value: 0.20,
  },
  {
    id: 'fort_5',
    branch: 'fortification',
    branchIndex: 5,
    name: 'Titan Bastion I',
    description: '+8% Damage Reduction against Bosses',
    cost: STANDARD_10_COSTS[4],
    statType: 'boss_damage_reduction',
    value: 0.08,
  },
  {
    id: 'fort_6',
    branch: 'fortification',
    branchIndex: 6,
    name: 'Ablative Plating II',
    description: '+4% Passive Damage Reduction',
    cost: STANDARD_10_COSTS[5],
    statType: 'damage_reduction_percent',
    value: 0.04,
  },
  {
    id: 'fort_7',
    branch: 'fortification',
    branchIndex: 7,
    name: 'Advanced Nanite Grid',
    description: '+0.8 HP/sec Passive Regeneration',
    cost: STANDARD_10_COSTS[6],
    statType: 'hp_regen_flat',
    value: 0.8,
  },
  {
    id: 'fort_8',
    branch: 'fortification',
    branchIndex: 8,
    name: 'Hardened Aegis',
    description: '+25% Tower Max Health',
    cost: STANDARD_10_COSTS[7],
    statType: 'health_percent',
    value: 0.25,
  },
  {
    id: 'fort_9',
    branch: 'fortification',
    branchIndex: 9,
    name: 'Titan Bastion II',
    description: '+12% Damage Reduction against Bosses',
    cost: STANDARD_10_COSTS[8],
    statType: 'boss_damage_reduction',
    value: 0.12,
  },
  {
    id: 'fort_10',
    branch: 'fortification',
    branchIndex: 10,
    name: 'Composite Armor Matrix',
    description: '+5% Passive Damage Reduction',
    cost: STANDARD_10_COSTS[9],
    statType: 'damage_reduction_percent',
    value: 0.05,
  },
  {
    id: 'fort_11',
    branch: 'fortification',
    branchIndex: 11,
    name: 'Perpetual Cell',
    description: '+35% Tower Max Health & +1.5 HP/sec Regen',
    cost: CAPSTONE_COSTS[0],
    statType: 'health_percent',
    value: 0.35,
  },
  {
    id: 'fort_12',
    branch: 'fortification',
    branchIndex: 12,
    name: 'Impervious Citadel',
    description: '+10% Overall Damage Reduction Capstone (Requires 8 nodes in other branches)',
    cost: CAPSTONE_COSTS[1],
    statType: 'damage_reduction_percent',
    value: 0.10,
    isCapstone: true,
    requiredOtherBranchNodes: 8,
  },

  // ==========================================
  // BRANCH 3: EFFICIENCY (10 Nodes)
  // ==========================================
  {
    id: 'eff_1',
    branch: 'efficiency',
    branchIndex: 1,
    name: 'Stardust Harvester',
    description: '+15% Stardust Earned from Enemies',
    cost: STANDARD_10_COSTS[0],
    statType: 'stardust_multiplier',
    value: 0.15,
  },
  {
    id: 'eff_2',
    branch: 'efficiency',
    branchIndex: 2,
    name: 'Galactic Cash Vault I',
    description: '+$50 Starting Cash on every run & soft-reset',
    cost: STANDARD_10_COSTS[1],
    statType: 'starting_cash_boost',
    value: 50,
  },
  {
    id: 'eff_3',
    branch: 'efficiency',
    branchIndex: 3,
    name: 'Deep Matter Siphon',
    description: '+20% Stardust Earned from Enemies',
    cost: STANDARD_10_COSTS[2],
    statType: 'stardust_multiplier',
    value: 0.20,
  },
  {
    id: 'eff_4',
    branch: 'efficiency',
    branchIndex: 4,
    name: 'Material Recycler',
    description: '-5% In-Run Tower Upgrade Costs',
    cost: STANDARD_10_COSTS[3],
    statType: 'upgrade_cost_discount',
    value: 0.05,
  },
  {
    id: 'eff_5',
    branch: 'efficiency',
    branchIndex: 5,
    name: 'Cosmic Magnetism',
    description: '+25% Stardust Earned from Bosses & Waves',
    cost: STANDARD_10_COSTS[4],
    statType: 'stardust_multiplier',
    value: 0.25,
  },
  {
    id: 'eff_6',
    branch: 'efficiency',
    branchIndex: 6,
    name: 'Galactic Cash Vault II',
    description: '+$150 Starting Cash on every run & soft-reset',
    cost: STANDARD_10_COSTS[5],
    statType: 'starting_cash_boost',
    value: 150,
  },
  {
    id: 'eff_7',
    branch: 'efficiency',
    branchIndex: 7,
    name: 'High-Density Extraction',
    description: '+30% Stardust Earned from Enemies',
    cost: STANDARD_10_COSTS[6],
    statType: 'stardust_multiplier',
    value: 0.30,
  },
  {
    id: 'eff_8',
    branch: 'efficiency',
    branchIndex: 8,
    name: 'Galactic Cash Vault III',
    description: '+$350 Starting Cash on every run & soft-reset',
    cost: STANDARD_10_COSTS[7],
    statType: 'starting_cash_boost',
    value: 350,
  },
  {
    id: 'eff_9',
    branch: 'efficiency',
    branchIndex: 9,
    name: 'Supercluster Siphon',
    description: '+40% Stardust Earned Overall',
    cost: STANDARD_10_COSTS[8],
    statType: 'stardust_multiplier',
    value: 0.40,
  },
  {
    id: 'eff_10',
    branch: 'efficiency',
    branchIndex: 10,
    name: 'Singularity Forge',
    description: '+50% Stardust, +$500 Starting Cash & -8% Upgrade Costs Capstone (Requires 8 nodes in other branches)',
    cost: STANDARD_10_COSTS[9] + 20, // 88 shards
    statType: 'stardust_multiplier',
    value: 0.50,
    isCapstone: true,
    requiredOtherBranchNodes: 8,
  },

  // ==========================================
  // BRANCH 4: ASCENSION MASTERY (10 Nodes)
  // ==========================================
  {
    id: 'asc_1',
    branch: 'ascension_mastery',
    branchIndex: 1,
    name: 'Cosmic Attunement I',
    description: '+10% Cosmic Shards gained upon Ascension',
    cost: STANDARD_10_COSTS[0],
    statType: 'shard_gain_multiplier',
    value: 0.10,
  },
  {
    id: 'asc_2',
    branch: 'ascension_mastery',
    branchIndex: 2,
    name: 'Dimensional Leap I',
    description: 'Start new runs directly at Wave 3 (with starting Stardust)',
    cost: STANDARD_10_COSTS[1],
    statType: 'starting_wave_bonus',
    value: 2, // +2 waves (starts at wave 3)
  },
  {
    id: 'asc_3',
    branch: 'ascension_mastery',
    branchIndex: 3,
    name: 'Chrono Accelerator I',
    description: '+0.5x Max Auto-Battle & Game Simulation Speed Multiplier',
    cost: STANDARD_10_COSTS[2],
    statType: 'auto_battle_speed_mult',
    value: 0.5,
  },
  {
    id: 'asc_4',
    branch: 'ascension_mastery',
    branchIndex: 4,
    name: 'Cosmic Attunement II',
    description: '+15% Cosmic Shards gained upon Ascension',
    cost: STANDARD_10_COSTS[3],
    statType: 'shard_gain_multiplier',
    value: 0.15,
  },
  {
    id: 'asc_5',
    branch: 'ascension_mastery',
    branchIndex: 5,
    name: 'Dimensional Leap II',
    description: 'Start new runs +3 further waves ahead (total +5)',
    cost: STANDARD_10_COSTS[4],
    statType: 'starting_wave_bonus',
    value: 3,
  },
  {
    id: 'asc_6',
    branch: 'ascension_mastery',
    branchIndex: 6,
    name: 'Deep Void Resonance',
    description: '+20% Cosmic Shards gained upon Ascension',
    cost: STANDARD_10_COSTS[5],
    statType: 'shard_gain_multiplier',
    value: 0.20,
  },
  {
    id: 'asc_7',
    branch: 'ascension_mastery',
    branchIndex: 7,
    name: 'Chrono Accelerator II',
    description: '+1.0x Max Auto-Battle & Game Simulation Speed Multiplier',
    cost: STANDARD_10_COSTS[6],
    statType: 'auto_battle_speed_mult',
    value: 1.0,
  },
  {
    id: 'asc_8',
    branch: 'ascension_mastery',
    branchIndex: 8,
    name: 'Dimensional Leap III',
    description: 'Start new runs +5 further waves ahead (total +10)',
    cost: STANDARD_10_COSTS[7],
    statType: 'starting_wave_bonus',
    value: 5,
  },
  {
    id: 'asc_9',
    branch: 'ascension_mastery',
    branchIndex: 9,
    name: 'Transcendence Spark',
    description: '+25% Cosmic Shards gained upon Ascension',
    cost: STANDARD_10_COSTS[8],
    statType: 'shard_gain_multiplier',
    value: 0.25,
  },
  {
    id: 'asc_10',
    branch: 'ascension_mastery',
    branchIndex: 10,
    name: 'Ascendant Sovereignty',
    description: '+35% Shards & Start at Wave 15 Capstone (Requires 8 nodes in other branches)',
    cost: STANDARD_10_COSTS[9] + 20, // 88 shards
    statType: 'shard_gain_multiplier',
    value: 0.35,
    isCapstone: true,
    requiredOtherBranchNodes: 8,
  },
];

// Helper to check prerequisite for purchasing a node
export function canUnlockTechNode(nodeId: string, unlockedIds: string[]): { canUnlock: boolean; reason?: string } {
  if (unlockedIds.includes(nodeId)) {
    return { canUnlock: false, reason: 'Already unlocked' };
  }

  const node = TECH_TREE_NODES.find(n => n.id === nodeId);
  if (!node) return { canUnlock: false, reason: 'Node not found' };

  // Rule 1: Requires previous node in own branch
  if (node.branchIndex > 1) {
    const prevNode = TECH_TREE_NODES.find(n => n.branch === node.branch && n.branchIndex === node.branchIndex - 1);
    if (prevNode && !unlockedIds.includes(prevNode.id)) {
      return { canUnlock: false, reason: `Requires ${prevNode.name} in ${node.branch.replace('_', ' ')}` };
    }
  }

  // Rule 2: Capstone nodes require minimum node count invested in other branches
  if (node.isCapstone && node.requiredOtherBranchNodes) {
    const otherBranchUnlockedCount = unlockedIds.filter(id => {
      const other = TECH_TREE_NODES.find(n => n.id === id);
      return other && other.branch !== node.branch;
    }).length;

    if (otherBranchUnlockedCount < node.requiredOtherBranchNodes) {
      return {
        canUnlock: false,
        reason: `Requires ${node.requiredOtherBranchNodes} nodes unlocked in other branches (have ${otherBranchUnlockedCount})`
      };
    }
  }

  return { canUnlock: true };
}

export interface TechBonuses {
  damageMultiplier: number;
  fireRateMultiplier: number;
  critChanceBonus: number;
  critMultiplierBonus: number;
  healthMultiplier: number;
  damageReductionPercent: number;
  hpRegenBonus: number;
  bossDamageReductionPercent: number;
  stardustMultiplier: number;
  upgradeDiscountMultiplier: number;
  cosmicShardGainMultiplier: number;
  startingWaveBonus: number;
  rareShardChanceBoost: number;
  startingCashBonus: number;
  gameSpeedBonus: number;
}

export function computeTechBonuses(unlockedIds: string[]): TechBonuses {
  const bonuses: TechBonuses = {
    damageMultiplier: 1.0,
    fireRateMultiplier: 1.0,
    critChanceBonus: 0,
    critMultiplierBonus: 0,
    healthMultiplier: 1.0,
    damageReductionPercent: 0,
    hpRegenBonus: 0,
    bossDamageReductionPercent: 0,
    stardustMultiplier: 1.0,
    upgradeDiscountMultiplier: 1.0,
    cosmicShardGainMultiplier: 1.0,
    startingWaveBonus: 0,
    rareShardChanceBoost: 0,
    startingCashBonus: 0,
    gameSpeedBonus: 0,
  };

  for (const id of unlockedIds) {
    const node = TECH_TREE_NODES.find(n => n.id === id);
    if (!node) continue;

    switch (node.statType) {
      case 'damage_percent':
        bonuses.damageMultiplier += node.value;
        break;
      case 'fire_rate_percent':
        bonuses.fireRateMultiplier += node.value;
        break;
      case 'crit_chance_flat':
        bonuses.critChanceBonus += node.value;
        break;
      case 'crit_mult_flat':
        bonuses.critMultiplierBonus += node.value;
        break;
      case 'health_percent':
        bonuses.healthMultiplier += node.value;
        break;
      case 'damage_reduction_percent':
        bonuses.damageReductionPercent += node.value;
        break;
      case 'hp_regen_flat':
        bonuses.hpRegenBonus += node.value;
        break;
      case 'boss_damage_reduction':
        bonuses.bossDamageReductionPercent += node.value;
        break;
      case 'stardust_multiplier':
        bonuses.stardustMultiplier += node.value;
        break;
      case 'upgrade_cost_discount':
        bonuses.upgradeDiscountMultiplier = Math.max(0.4, bonuses.upgradeDiscountMultiplier - node.value);
        break;
      case 'shard_gain_multiplier':
        bonuses.cosmicShardGainMultiplier += node.value;
        break;
      case 'starting_wave_bonus':
        bonuses.startingWaveBonus += node.value;
        break;
      case 'rare_shard_chance_boost':
        bonuses.rareShardChanceBoost += node.value;
        break;
      case 'starting_cash_boost':
        bonuses.startingCashBonus += node.value;
        break;
      case 'auto_battle_speed_mult':
        bonuses.gameSpeedBonus += node.value;
        break;
    }
  }

  // Cap damage reduction at 85% to keep integrity
  bonuses.damageReductionPercent = Math.min(0.85, bonuses.damageReductionPercent);
  bonuses.bossDamageReductionPercent = Math.min(0.85, bonuses.bossDamageReductionPercent);

  return bonuses;
}
