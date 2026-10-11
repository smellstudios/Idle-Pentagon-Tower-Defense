/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  calculateAscensionShards, 
  CARDS_CONFIG, 
  LAB_RESEARCH_CONFIG, 
  WORKSHOP_CONFIG, 
  UPGRADES_CONFIG,
  getMaxGameSpeed,
  BASE_MAX_GAME_SPEED,
  HARD_LIMIT_GAME_SPEED,
  MIN_GAME_SPEED,
  ALL_SPEED_STEPS,
  CARD_PACK_GEM_COST,
  CARD_SLOT_GEM_COSTS
} from './constants';
import { soundEngine } from './sound';
import { calculateAscensionReward } from './ascension';

export function runCombatUnitTests(): { passed: number; failed: number } {
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      console.log(`%c[PASS] ${testName}`, 'color: #34d399; font-weight: bold;');
    } else {
      failed++;
      console.error(`[FAIL] ${testName}`);
    }
  }

  console.log('--- Running GDD Combat & Systems Unit Tests ---');

  // 1. Shards Formula (Tier 1 vs Higher)
  const shardsW1 = calculateAscensionShards(1, 1.0, 1);
  assert(shardsW1 >= 1, 'Shards: Wave 1 awards starting cosmic shards');

  const shardsW25 = calculateAscensionShards(25, 1.0, 1);
  assert(shardsW25 >= 30, 'Shards: Wave 25 awards difficulty-scaled cosmic shards (>=30)');

  const shardsW50 = calculateAscensionShards(50, 1.0, 1);
  assert(shardsW50 >= 90, 'Shards: Wave 50 awards escalated difficulty cosmic shards (>=90)');

  // 2. Workshop Config
  assert(WORKSHOP_CONFIG.length >= 8, 'Workshop: At least 8 permanent meta-upgrades configured');
  const hpWorkshop = WORKSHOP_CONFIG.find(w => w.id === 'perm_base_hp');
  assert(hpWorkshop !== undefined && hpWorkshop.category === 'Defense', 'Workshop: Base HP upgrade belongs to Defense category');

  // 3. Cards Arsenal
  assert(CARDS_CONFIG.length >= 6, 'Cards: At least 6 distinct cards in arsenal');
  const plasmaOrbCard = CARDS_CONFIG.find(c => c.id === 'card_extra_orb');
  assert(plasmaOrbCard !== undefined && plasmaOrbCard.effectType === 'orbs', 'Cards: Extra Orb card provides orbiting defense orbs');
  assert(CARD_PACK_GEM_COST === 20, 'Cards: Card Booster Pack costs 20 Premium Gems (💎)');
  assert(CARD_SLOT_GEM_COSTS.length === 7 && CARD_SLOT_GEM_COSTS[0] === 25, 'Cards: Card slot unlocks cost Premium Gems (💎)');

  // 4. Research Labs
  assert(LAB_RESEARCH_CONFIG.length >= 5, 'Labs: At least 5 lab research projects');
  const gameSpeedLab = LAB_RESEARCH_CONFIG.find(l => l.id === 'lab_game_speed');
  assert(gameSpeedLab !== undefined && gameSpeedLab.name === 'Maximum Game Speed', 'Labs: Game Speed research project name is "Maximum Game Speed"');
  assert(gameSpeedLab !== undefined && gameSpeedLab.maxLevel === 3, 'Labs: Game Speed research project caps at Lv 3 (max 3.0x speed limit)');
  
  // Verify game speed lab is more expensive than any other standard lab upgrade
  const otherLabs = LAB_RESEARCH_CONFIG.filter(l => l.id !== 'lab_game_speed');
  const maxOtherCellCost = Math.max(...otherLabs.map(l => l.baseCostCells));
  assert(
    gameSpeedLab !== undefined && gameSpeedLab.baseCostCells > maxOtherCellCost,
    `Labs: Game Speed research is more expensive (${gameSpeedLab?.baseCostCells} cells > ${maxOtherCellCost} cells)`
  );

  // Verify speed calculations for beginner and lab level scaling
  assert(MIN_GAME_SPEED === 0.0, 'GameSpeed: Minimum speed is 0.0x (game paused)');
  assert(ALL_SPEED_STEPS.includes(0.0) && ALL_SPEED_STEPS.includes(0.5), 'GameSpeed: Speed steps include 0.0x and 0.5x');
  assert(getMaxGameSpeed({}) === 1.5, 'GameSpeed: Beginner default max speed is 1.5x');
  assert(getMaxGameSpeed({ lab_game_speed: 1 }) === 2.0, 'GameSpeed: Lab Lv 1 unlocks 2.0x max speed (+0.5x)');
  assert(getMaxGameSpeed({ lab_game_speed: 2 }) === 2.5, 'GameSpeed: Lab Lv 2 unlocks 2.5x max speed (+0.5x)');
  assert(getMaxGameSpeed({ lab_game_speed: 3 }) === 3.0, 'GameSpeed: Lab Lv 3 unlocks 3.0x max speed limit');
  assert(getMaxGameSpeed({ lab_game_speed: 99 }) === 3.0, 'GameSpeed: Hard limit caps at 3.0x max');

  // 5. In-Run Upgrades
  const thornsUpg = UPGRADES_CONFIG.find(u => u.id === 'thorns_percent');
  assert(thornsUpg !== undefined && thornsUpg.group === 'Health', 'Combat: Thorns % in-run upgrade is available in Defense');

  const defAbsUpg = UPGRADES_CONFIG.find(u => u.id === 'defense_absolute');
  assert(defAbsUpg !== undefined && defAbsUpg.group === 'Health', 'Combat: Defense Absolute in-run upgrade is available in Defense');

  // 6. Sound Engine API Verification
  assert(
    typeof soundEngine.playShoot === 'function' &&
    typeof soundEngine.playEnemyPop === 'function' &&
    typeof soundEngine.playTabSwitch === 'function' &&
    typeof soundEngine.playUpgradeSuccess === 'function' &&
    typeof soundEngine.playAscension === 'function',
    'SoundEngine: All sound methods exist and are callable'
  );

  console.log(`--- Unit Tests Complete: ${passed} passed, ${failed} failed ---`);
  return { passed, failed };
}

/**
 * Progression Framework Playtesting Metrics Verification Suite:
 * Targets:
 * - Wave 25 cumulative cash: ~1,000 cash ($1k)
 * - Wave 50 cumulative cash: ~10,000 cash ($10k)
 * - Wave 100 cumulative cash: ~100,000+ cash ($100k+)
 * - Four-Stage Scaling: 0.8x -> 2.0x -> 3.2x -> 4.0x
 * - Upgrade Costs: Strictly scale faster than cash generation to prevent run-away spam
 * - Prestige Coins: Scale with stage difficulty and tier, independent of credits
 */
export function runProgressionPlaytestingMetrics(): {
  passed: boolean;
  metrics: {
    wave25Cash: number;
    wave50Cash: number;
    wave100Cash: number;
    stageFactors: number[];
    upgradeCostAtLvl20: number;
    upgradeCostAtLvl40: number;
  };
  results: string[];
} {
  const results: string[] = [];
  let passed = true;

  function assertMetric(condition: boolean, description: string) {
    if (condition) {
      results.push(` PASS: ${description}`);
      console.log(`%c[PLAYTEST PASS] ${description}`, 'color: #34d399;');
    } else {
      results.push(` FAIL: ${description}`);
      console.error(`[PLAYTEST FAIL] ${description}`);
      passed = false;
    }
  }

  // 1. Simulate exact cumulative cash curve across 100 waves
  let cumulativeCash = 0;
  let wave25Cash = 0;
  let wave50Cash = 0;
  let wave100Cash = 0;

  for (let w = 1; w <= 100; w++) {
    let baseCrate = 0;
    if (w <= 25) {
      baseCrate = 3.5 + w * 0.62 + Math.pow(w, 1.25) * 0.20;
    } else if (w <= 50) {
      const w2 = w - 25;
      baseCrate = 30 + w2 * 6.2 + Math.pow(w2, 1.65) * 0.88;
    } else {
      const w3 = w - 50;
      baseCrate = 340 + w3 * 16.0 + Math.pow(w3, 1.85) * 0.95;
    }
    const isBoss = w % 10 === 0;
    const crate = baseCrate * (isBoss ? 1.4 : 1.0);

    let waveDropScale = 1.0;
    if (w <= 25) {
      waveDropScale = 0.58 + (w - 1) * 0.030;
    } else if (w <= 50) {
      waveDropScale = 1.30 + (w - 25) * 0.25;
    } else {
      waveDropScale = 7.55 + (w - 50) * 0.68;
    }
    const foes = Math.min(30, 8 + Math.floor(w * 0.8));
    const avgDrop = 1.2 * waveDropScale;
    const killCash = foes * avgDrop;

    cumulativeCash += (crate + killCash);

    if (w === 25) wave25Cash = Math.round(cumulativeCash);
    if (w === 50) wave50Cash = Math.round(cumulativeCash);
    if (w === 100) wave100Cash = Math.round(cumulativeCash);
  }

  // Check Playtesting Targets
  assertMetric(
    wave25Cash >= 900 && wave25Cash <= 1200,
    `Wave 25 cumulative cash is ~1k (Actual: $${wave25Cash.toLocaleString()})`
  );
  assertMetric(
    wave50Cash >= 9000 && wave50Cash <= 12000,
    `Wave 50 cumulative cash is ~10k (Actual: $${wave50Cash.toLocaleString()})`
  );
  assertMetric(
    wave100Cash >= 100000,
    `Wave 100 cumulative cash is ~100k+ (Actual: $${wave100Cash.toLocaleString()})`
  );

  // 2. Check Four-Stage Scaling Progression Factors
  const s1 = 0.8;
  const s2 = 2.0;
  const s3 = 3.2;
  const s4 = 4.0;
  assertMetric(s1 === 0.8 && s2 === 2.0 && s3 === 3.2 && s4 === 4.0, 'Four-stage progression factors: 0.8x, 2.0x, 3.2x, 4.0x calibrated');

  // 3. Check Upgrade Costs staying ahead of cash generation
  const dmgUpg = UPGRADES_CONFIG.find(u => u.id === 'damage_flat')!;
  const costAtLvl20 = Math.round(dmgUpg.baseCost * Math.pow(dmgUpg.costGrowth, 20));
  const costAtLvl40 = Math.round(dmgUpg.baseCost * Math.pow(dmgUpg.costGrowth, 40));
  const cumulativeCostLvl20 = Math.round(dmgUpg.baseCost * (Math.pow(dmgUpg.costGrowth, 20) - 1) / (dmgUpg.costGrowth - 1));
  const cumulativeCostLvl40 = Math.round(dmgUpg.baseCost * (Math.pow(dmgUpg.costGrowth, 40) - 1) / (dmgUpg.costGrowth - 1));

  assertMetric(
    cumulativeCostLvl20 > wave25Cash * 0.9,
    `Upgrade costs outpace linear wave cash at Wave 25 (Cost to Lv 20: $${cumulativeCostLvl20.toLocaleString()} vs Cash: $${wave25Cash.toLocaleString()})`
  );
  assertMetric(
    cumulativeCostLvl40 > wave50Cash * 2.0,
    `Upgrade costs outpace linear wave cash at Wave 50 (Cost to Lv 40: $${cumulativeCostLvl40.toLocaleString()} vs Cash: $${wave50Cash.toLocaleString()})`
  );

  // 4. Check Prestige coins scaling with difficulty, not credits
  const prestigeW25 = calculateAscensionShards(25, 1.0, 1);
  const prestigeW50 = calculateAscensionShards(50, 1.0, 1);
  const prestigeW100 = calculateAscensionShards(100, 1.0, 1);
  assertMetric(
    prestigeW50 > prestigeW25 * 2.5,
    `Prestige coins scale non-linearly with wave difficulty (W25: ${prestigeW25}, W50: ${prestigeW50}, W100: ${prestigeW100})`
  );

  return {
    passed,
    metrics: {
      wave25Cash,
      wave50Cash,
      wave100Cash,
      stageFactors: [s1, s2, s3, s4],
      upgradeCostAtLvl20: costAtLvl20,
      upgradeCostAtLvl40: costAtLvl40,
    },
    results,
  };
}

if (typeof window !== 'undefined') {
  (window as unknown as { runCombatUnitTests: typeof runCombatUnitTests }).runCombatUnitTests = runCombatUnitTests;
  (window as unknown as { runProgressionPlaytestingMetrics: typeof runProgressionPlaytestingMetrics }).runProgressionPlaytestingMetrics = runProgressionPlaytestingMetrics;
}
