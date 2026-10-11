/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { calculateAscensionShards } from './constants';
import { AscensionSummaryData } from '../types';

export function calculateAscensionReward(
  highestWaveThisRun: number,
  enemiesDefeated: number,
  shardMultiplier: number = 1.0,
  tier: number = 1
): AscensionSummaryData {
  const totalShardsEarned = calculateAscensionShards(highestWaveThisRun, shardMultiplier, tier);

  return {
    waveReached: highestWaveThisRun,
    enemiesDefeated,
    totalShardsEarned,
  };
}
