/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { computeTechBonuses } from './techTree';
import { getEnemyWaveStats, WAVE_CONFIG } from './constants';
import { Upgrade } from '../types';

export interface OfflineProgressResult {
  elapsedSeconds: number;
  cappedSeconds: number;
  wavesCleared: number;
  startingWave: number;
  finalWave: number;
  stardustEarned: number;
  shardsEarned: number;
}

export function calculateOfflineProgression(
  lastSaveTime: number,
  currentWave: number,
  upgrades: Upgrade[],
  techTreeNodesUnlocked: string[],
  tier: number = 1,
  cardMultipliers: { cash: number; shards: number } = { cash: 1, shards: 1 }
): OfflineProgressResult | null {
  const now = Date.now();
  const elapsedMs = now - lastSaveTime;
  const elapsedSeconds = Math.floor(elapsedMs / 1000);

  // Minimum 60 seconds of offline time required to trigger offline gains
  if (elapsedSeconds < 60) {
    return null;
  }

  const MAX_OFFLINE_SECONDS = 8 * 60 * 60; // 8 hours cap
  const cappedSeconds = Math.min(elapsedSeconds, MAX_OFFLINE_SECONDS);

  const tech = computeTechBonuses(techTreeNodesUnlocked);
  const safeUpgrades = Array.isArray(upgrades) ? upgrades : [];

  // Calculate effective player DPS for simulation
  const flatDmg = (safeUpgrades.find(u => u.id === 'damage_flat')?.level || 0) * 1.5 + 5;
  const fireRate = (safeUpgrades.find(u => u.id === 'shoot_speed')?.level || 0) * 0.08 + 1.0;
  const critChance = Math.min(0.85, (safeUpgrades.find(u => u.id === 'crit_chance')?.level || 0) * 0.0015 + 0.05 + tech.critChanceBonus);
  const critMult = (safeUpgrades.find(u => u.id === 'crit_multiplier')?.level || 0) * 0.15 + 1.5 + tech.critMultiplierBonus;

  const totalDmgPerShot = flatDmg * (1 + critChance * (critMult - 1)) * tech.damageMultiplier;
  const playerDps = totalDmgPerShot * fireRate * tech.fireRateMultiplier;

  // Cash (Stardust) multiplier
  const stardustUpgMult = 1 + (safeUpgrades.find(u => u.id === 'cash_bonus')?.level || 0) * 0.05;
  const totalStardustMult = stardustUpgMult * tech.stardustMultiplier * cardMultipliers.cash;
  const stardustPerWave = (safeUpgrades.find(u => u.id === 'cash_per_wave')?.level || 0) * 1; 

  const shardYieldMult = (1 + (safeUpgrades.find(u => u.id === 'shards_per_kill')?.level || 0) * 0.05) * cardMultipliers.shards;

  let remainingTime = cappedSeconds;
  let simWave = currentWave;
  let totalStardust = 0;
  let totalShards = 0;
  let wavesCleared = 0;

  // Simulate waves
  while (remainingTime > 0 && wavesCleared < 500) {
    const isBoss = WAVE_CONFIG.isBossWave(simWave);
    const waveFoes = WAVE_CONFIG.getEnemiesForWave(simWave, tier);
    const regularHp = getEnemyWaveStats('red_square', simWave, tier).hp;
    const bossHp = isBoss ? getEnemyWaveStats('boss', simWave, tier).hp : regularHp;
    const totalWaveHp = isBoss ? regularHp * (waveFoes - 1) + bossHp : regularHp * waveFoes;

    // Time to clear this wave: HP / DPS + spacing buffer
    const timeToClear = Math.max(10, totalWaveHp / Math.max(1, playerDps) + 4);

    if (remainingTime < timeToClear) {
      // Partial wave progress stardust
      const partialRatio = remainingTime / timeToClear;
      totalStardust += Math.floor(5 * (1 + simWave * 0.04) * totalStardustMult * partialRatio);
      break;
    }

    // Cleared wave!
    remainingTime -= timeToClear;
    wavesCleared++;

    // Stardust (Cash) rewards - calibrated with rebalanced four-stage in-game drops
    let baseWaveCash = 15;
    if (simWave <= 25) {
      baseWaveCash = 10 + simWave * 1.5;
    } else if (simWave <= 50) {
      baseWaveCash = 47.5 + (simWave - 25) * 12.0;
    } else {
      baseWaveCash = 347.5 + (simWave - 50) * 45.0;
    }
    const killStardust = (isBoss ? baseWaveCash * 1.4 : baseWaveCash) * totalStardustMult;
    totalStardust += Math.floor(killStardust + stardustPerWave);

    // Past wave 50 rare cosmic shard drop check (5% chance per kill + tech bonus)
    if (simWave >= 50) {
      const rareChance = 0.05 + tech.rareShardChanceBoost;
      for (let i = 0; i < 10; i++) {
        if (Math.random() < rareChance) {
          totalShards += 1 * shardYieldMult;
        }
      }
    }

    simWave++;
  }

  return {
    elapsedSeconds,
    cappedSeconds,
    wavesCleared,
    startingWave: currentWave,
    finalWave: simWave,
    stardustEarned: totalStardust,
    shardsEarned: totalShards,
  };
}
