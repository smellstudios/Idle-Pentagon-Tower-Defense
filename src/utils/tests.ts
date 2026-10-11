/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Upgrade } from '../types';

const calculateUpgradeCost = (upgrade: Upgrade, level: number, amount: number) => {
  let totalCost = 0;
  let current = level;
  for (let i = 0; i < amount; i++) {
    totalCost += upgrade.baseCost * Math.pow(upgrade.costGrowth, current);
    current++;
  }
  return totalCost;
};

const calculateMaxAffordable = (upgrade: Upgrade, stardust: number) => {
  let count = 0;
  let currentLevel = upgrade.level;
  let remainingDust = stardust;
  
  while (true) {
    const cost = upgrade.baseCost * Math.pow(upgrade.costGrowth, currentLevel);
    if (remainingDust >= cost && count < 1000) {
      remainingDust -= cost;
      count++;
      currentLevel++;
    } else {
      break;
    }
  }
  return count;
};

// Simple manual "test" log to verify logic
export const runUpgradeTests = () => {
  const testUpgrade: Upgrade = {
    id: 'test',
    name: 'Test',
    group: 'Damage',
    level: 0,
    baseValue: 10,
    increment: 1,
    costGrowth: 1.10,
    baseCost: 10,
    description: 'Test upgrade',
  };

  console.log('--- Upgrade Math Tests ---');
  
  // Test x1 cost
  const cost1 = calculateUpgradeCost(testUpgrade, 0, 1);
  console.log('Cost x1 at Lv 0:', cost1, 'Expected: 10');

  // Test x2 cost (Lv 0 and Lv 1)
  const cost2 = calculateUpgradeCost(testUpgrade, 0, 2);
  const manualCost2 = 10 + 10 * 1.1; // 10 + 11 = 21
  console.log('Cost x2 at Lv 0:', cost2, 'Expected:', manualCost2);

  // Test max affordable
  const max1 = calculateMaxAffordable(testUpgrade, 100);
  console.log('Max affordable with 100 Stardust at Lv 0:', max1);
  
  const totalCostMax = calculateUpgradeCost(testUpgrade, 0, max1);
  console.log('Total cost for', max1, 'levels:', totalCostMax);
};
