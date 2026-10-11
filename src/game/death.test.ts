/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateAscensionReward } from './ascension';
import { calculateAscensionShards, CARD_PACK_GEM_COST, CARD_SLOT_GEM_COSTS } from './constants';

export function runAscensionUnitTests(): { passed: boolean; results: string[] } {
  const results: string[] = [];
  let passed = true;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      results.push(` PASS: ${testName}`);
    } else {
      results.push(` FAIL: ${testName}`);
      passed = false;
    }
  }

  // Test 1: Base shards formula at Wave 1
  const shardsW1 = calculateAscensionShards(1, 1.0, 1);
  assert(shardsW1 >= 1, 'Wave 1 awards starting cosmic shard');

  // Test 2: Wave 25 awards difficulty-scaled prestige coins (Stage 1 completion + 5 bosses)
  const shardsW25 = calculateAscensionShards(25, 1.0, 1);
  assert(shardsW25 >= 30, 'Wave 25 awards difficulty-scaled prestige coins (>=30)');

  // Test 3: Wave 50 awards escalated prestige coins (Stage 2 completion + 10 bosses)
  const shardsW50 = calculateAscensionShards(50, 1.0, 1);
  assert(shardsW50 >= 90, 'Wave 50 awards escalated prestige coins (>=90)');

  // Test 4: Ascension reward object with multiplier
  const reward = calculateAscensionReward(25, 250, 1.5, 1);
  const expectedShards = calculateAscensionShards(25, 1.5, 1);
  assert(reward.totalShardsEarned === expectedShards, 'Ascension summary scales with shard multiplier');
  assert(reward.waveReached === 25, 'Wave reached matches 25');

  // Test 5: Death cosmic shards guarantee
  assert(calculateAscensionShards(1, 1.0, 1) >= 12, 'Dying on Wave 1 awards starter buffer (>=12 cosmic shards)');

  // Test 6: Premium Gem requirement for Cards
  assert(CARD_PACK_GEM_COST === 20, 'Card Booster Pack requires 20 Premium Gems');
  assert(CARD_SLOT_GEM_COSTS[0] === 25, 'Card slot 2 requires 25 Premium Gems');

  console.log('[Unit Tests: Ascension & Shards System]', results);
  return { passed, results };
}

if (typeof window !== 'undefined') {
  (window as unknown as { runAscensionUnitTests: typeof runAscensionUnitTests }).runAscensionUnitTests = runAscensionUnitTests;
}
