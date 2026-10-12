/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import { GameManager } from '../game/GameManager';
import { saveFullProgression } from '../game/storage';
import { calculateOfflineProgression } from '../game/offline';
import { CARDS_CONFIG } from '../game/constants';
import { GameState, Upgrade, AscensionSummaryData, GameSettings, ActiveRareDrop, ActiveSynergyCard } from '../types';

export function useGame() {
  const store = useGameStore();

  // Reference to PIXI game manager
  const gameManagerRef = useRef<GameManager | null>(null);

  // Sync refs to prevent stale closure access
  const stateRef = useRef(store);
  useEffect(() => {
    stateRef.current = store;
  }, [store]);

  // Synchronize store changes to PIXI simulation instance
  useEffect(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.updateState(store);
      gameManagerRef.current.updateUpgrades(store.upgrades);
    }
  }, [
    store.cash, 
    store.cosmicShards, 
    store.tier, 
    store.wave, 
    store.isDead, 
    store.gameSpeed,
    store.upgrades,
    store.workshopUpgrades,
    store.cards,
    store.equippedCardIds,
    store.labResearchLevels,
    store.unlockedTechNodes,
    store.fireProtocol,
    store.activeRareDrops,
  ]);

  // Periodic Auto-Save (Asynchronous, Non-Blocking via IndexedDB)
  useEffect(() => {
    const saveInterval = setInterval(() => {
      const s = stateRef.current;
      saveFullProgression({
        cash: s.cash,
        cosmicShards: s.cosmicShards,
        gems: s.gems,
        cells: s.cells,
        tournamentStones: s.tournamentStones,
        tier: s.tier,
        currentWave: s.isDead ? 1 : s.wave,
        highestWaveThisRun: s.highestWaveThisRun,
        highestWaveEver: s.highestWaveEver,
        ascensionCount: s.ascensionCount,
        gameSpeed: s.gameSpeed,
        workshopUpgrades: s.workshopUpgrades,
        upgradeLevels: s.upgrades.reduce((acc, u) => ({ ...acc, [u.id]: u.level }), {}),
        cards: s.cards,
        maxCardSlots: s.maxCardSlots,
        equippedCardIds: s.equippedCardIds,
        labSlotsCount: s.labSlotsCount,
        labSlots: s.labSlots,
        labResearchLevels: s.labResearchLevels,
        missions: s.missions,
        milestones: s.milestones,
        unlockedSystems: s.unlockedSystems,
        synergySlots: s.synergySlots,
        rareDropCollection: s.rareDropCollection,
        settings: s.settings,
        stats: s.stats,
      });
    }, 4000);

    return () => clearInterval(saveInterval);
  }, []);

  // Lab Research Real-Time Processing Timer
  useEffect(() => {
    const labTimer = setInterval(() => {
      const now = Date.now();
      const s = stateRef.current;
      let hasChange = false;
      const updatedSlots = s.labSlots.map(slot => {
        if (slot.researchId && !slot.isCompleted && now >= slot.endTime) {
          hasChange = true;
          return { ...slot, isCompleted: true };
        }
        return slot;
      });

      if (hasChange) {
        const updatedLevels = { ...s.labResearchLevels };
        updatedSlots.forEach(slot => {
          if (slot.isCompleted && slot.researchId) {
            updatedLevels[slot.researchId] = slot.targetLevel;
          }
        });

        store.batchUpdateState({
          labSlots: updatedSlots,
          labResearchLevels: updatedLevels,
        });
      }
    }, 1000);

    return () => clearInterval(labTimer);
  }, [store]);

  // Page Visibility API: Stop ticking when tab is backgrounded, compute offline progress upon resume
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab backgrounded: save timestamp and pause high-rate rendering
        const now = Date.now();
        stateRef.current.lastOfflineTime = now;
        saveFullProgression({ lastSaveTime: now });
      } else {
        // Tab resumed: calculate offline gains
        const s = stateRef.current;
        const lastTime = s.lastOfflineTime || Date.now();
        const unlockedTechIds = Object.keys(s.workshopUpgrades || {});
        
        // Calculate card multipliers for accurate offline gains
        const getCardEff = (type: string) => {
          let total = 0;
          if (!s.equippedCardIds) return 0;
          for (const id of s.equippedCardIds) {
            const def = CARDS_CONFIG.find(c => c.id === id);
            const p = s.cards?.[id];
            if (def && def.effectType === type && p) {
              total += def.baseValue + (p.level - 1) * def.valuePerLevel;
            }
          }
          return total;
        };
        const offlineCashMult = (1 + getCardEff('cash')) * (1 + getCardEff('gold_bot')) * (1 + getCardEff('scrounger_mult')) * (1 + getCardEff('link_multiplier')) * (1 + getCardEff('enemy_balance'));
        const offlineShardMult = (1 + getCardEff('shards')) * (1 + getCardEff('shard_bot')) * (1 + getCardEff('link_multiplier')) * (1 + getCardEff('enemy_balance'));

        const offlineResult = calculateOfflineProgression(
          lastTime,
          s.wave,
          s.upgrades,
          unlockedTechIds,
          s.tier || 1,
          { cash: offlineCashMult, shards: offlineShardMult }
        );

        if (offlineResult && offlineResult.wavesCleared > 0) {
          store.batchUpdateState({
            cosmicShards: s.cosmicShards + offlineResult.shardsEarned,
            wave: offlineResult.finalWave,
            highestWaveThisRun: Math.max(s.highestWaveThisRun, offlineResult.finalWave),
            highestWaveEver: Math.max(s.highestWaveEver, offlineResult.finalWave),
            lastOfflineTime: Date.now(),
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [store]);

  // Compatibility wrappers for existing UI components
  const gameState: GameState = {
    cash: store.cash,
    cosmicShards: store.cosmicShards,
    gems: store.gems,
    cells: store.cells,
    tournamentStones: store.tournamentStones,
    tier: store.tier,
    wave: store.wave,
    highestWaveThisRun: store.highestWaveThisRun,
    highestWaveEver: store.highestWaveEver,
    ascensionCount: store.ascensionCount,
    gameSpeed: store.gameSpeed,
    workshopUpgrades: store.workshopUpgrades,
    upgrades: store.upgrades,
    unlockedTechNodes: store.unlockedTechNodes,
    cards: store.cards,
    maxCardSlots: store.maxCardSlots,
    equippedCardIds: store.equippedCardIds,
    labSlotsCount: store.labSlotsCount,
    labSlots: store.labSlots,
    labResearchLevels: store.labResearchLevels,
    labQueue: store.labQueue,
    missions: store.missions,
    weeklyMissionProgress: store.weeklyMissionProgress,
    milestones: store.milestones,
    unlockedSystems: store.unlockedSystems,
    waveProgress: store.waveProgress,
    enemiesRemaining: store.enemiesRemaining,
    totalEnemiesInWave: store.totalEnemiesInWave,
    isWaveActive: store.isWaveActive,
    playerHp: store.playerHp,
    playerMaxHp: store.playerMaxHp,
    activeBoss: store.activeBoss,
    orbitingOrbsCount: store.orbitingOrbsCount,
    settings: store.settings,
    stats: store.stats,
    lastOfflineTime: store.lastOfflineTime,
    bulkBuyMode: store.bulkBuyMode,
    isDead: store.isDead,
    deathSummary: store.deathSummary,
    attackRadius: store.attackRadius,
    showAttackRadius: store.showAttackRadius,
    popupDensity: store.popupDensity,
    pulseOnEnemyEnter: store.pulseOnEnemyEnter,
    isPlayerIdle: store.isPlayerIdle,
    enemiesInRangeCount: store.enemiesInRangeCount,
    activeRareDrops: store.activeRareDrops,
    synergySlots: store.synergySlots,
    rareDropCollection: store.rareDropCollection,
    activeSynergyCards: store.activeSynergyCards,
    latestAcquiredDrop: store.latestAcquiredDrop,
  };

  const setGameState = useCallback((updater: Partial<GameState> | ((prev: GameState) => GameState)) => {
    if (typeof updater === 'function') {
      const next = updater(stateRef.current);
      store.batchUpdateState(next);
    } else {
      store.batchUpdateState(updater);
    }
  }, [store]);

  const respawnAndReset = useCallback(() => {
    const { baseHealth } = store.respawnAndReset();
    gameManagerRef.current?.resetRun(baseHealth, 1);
  }, [store]);

  const softResetAndAscend = useCallback(() => {
    const summary = store.softResetAndAscend();
    gameManagerRef.current?.resetRun(store.playerHp, store.wave);
    return summary;
  }, [store]);

  return {
    gameState,
    setGameState,
    upgrades: store.upgrades,
    gameManagerRef,
    buyUpgrade: store.buyUpgrade,
    buyPermanentUpgrade: store.buyPermanentUpgrade,
    unlockTechNode: store.unlockTechNode,
    softResetAndAscend,
    drawCardPack: store.drawCardPack,
    levelUpCard: store.levelUpCard,
    toggleEquipCard: store.toggleEquipCard,
    unlockCardSlot: store.unlockCardSlot,
    startLabResearch: store.startLabResearch,
    rushLabResearch: store.rushLabResearch,
    collectCompletedLab: store.collectCompletedLab,
    buyLabAttribute: store.buyLabAttribute,
    convertCurrencyToCells: store.convertCurrencyToCells,
    unlockLabSlot: store.unlockLabSlot,
    synthesizeSkill: store.synthesizeSkill,
    upgradeSkill: store.upgradeSkill,
    toggleEquipSkill: store.toggleEquipSkill,
    expandSynergySlots: store.expandSynergySlots,
    claimMissionReward: store.claimMissionReward,
    claimAllMissions: store.claimAllMissions,
    claimMilestone: store.claimMilestone,
    claimAllMilestones: store.claimAllMilestones,
    equipRareDrop: store.equipRareDrop,
    dismissDropModal: store.dismissDropModal,
    respawnAndReset,
    handlePlayerDeath: store.handlePlayerDeath,
    setBulkBuyMode: store.setBulkBuyMode,
    setGameSpeed: store.setGameSpeed,
    updateSettings: store.updateSettings,
    resetAllData: store.resetAllData,
  };
}
