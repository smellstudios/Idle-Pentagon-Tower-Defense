/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { create } from 'zustand';
import { 
  GameState, 
  Upgrade, 
  AscensionSummaryData, 
  GameSettings, 
  ActiveRareDrop, 
  ActiveSynergyCard, 
  RareDropProgress,
  RareDropType,
  FireProtocolType 
} from '../types';
import { 
  UPGRADES_CONFIG, 
  WORKSHOP_CONFIG, 
  calculateWorkshopCost, 
  ATTACK_RADIUS_CONFIG, 
  INITIAL_PLAYER_STATS, 
  CARDS_CONFIG, 
  LAB_RESEARCH_CONFIG, 
  calculateAscensionShards,
  calculateDeathCashReserve,
  getCardRequiredExp,
  RARE_DROPS_DEFINITIONS,
  LAB_SLOT_GEM_COSTS,
  MAX_LAB_SLOTS,
  CARD_PACK_GEM_COST,
  CARD_SLOT_GEM_COSTS,
  getMaxGameSpeed,
  MIN_GAME_SPEED
} from '../game/constants';
import { 
  TECH_TREE_NODES, 
  canUnlockTechNode, 
  computeTechBonuses 
} from '../game/techTree';
import { 
  loadProgression, 
  saveFullProgression, 
  clearProgressionStorage, 
  getDefaultProgression 
} from '../game/storage';
import { soundEngine } from '../game/sound';

export interface GameStoreState extends GameState {
  upgrades: Upgrade[];
  
  // High-performance batched state updater
  batchUpdateState: (partial: Partial<GameState>) => void;
  
  // Game Actions
  buyUpgrade: (upgradeId: string) => void;
  buyPermanentUpgrade: (configId: string, amount?: number) => void;
  drawCardPack: () => any | null;
  drawMultipleCardPacks: (count: number) => any[] | null;
  levelUpCard: (cardId: string) => boolean;
  levelUpAllCards: () => boolean;
  toggleEquipCard: (cardId: string) => void;
  unlockCardSlot: () => void;
  startLabResearch: (slotIndex: number, researchId: string) => void;
  rushLabResearch: (slotIndex: number) => void;
  collectCompletedLab: (slotIndex: number) => void;
  buyLabAttribute: (researchId: string, currency: 'shards' | 'gems' | 'cells') => boolean;
  convertCurrencyToCells: (fromCurrency: 'shards' | 'gems', amount: number) => boolean;
  unlockLabSlot: () => boolean;
  synthesizeSkill: (skillId: RareDropType, currency: 'shards' | 'gems' | 'cells') => boolean;
  upgradeSkill: (skillId: RareDropType, currency: 'shards' | 'gems' | 'copies') => boolean;
  toggleEquipSkill: (skillId: RareDropType) => void;
  expandSynergySlots: () => boolean;
  claimMissionReward: (missionId: string) => void;
  claimAllMissions: () => void;
  claimMilestone: (tier: number, wave: number) => void;
  claimAllMilestones: (tier?: number) => void;
  equipRareDrop: (item: ActiveRareDrop | ActiveSynergyCard) => void;
  dismissDropModal: () => void;
  setBulkBuyMode: (mode: 'x1' | 'x10' | 'xMax') => void;
  setGameSpeed: (speed: number) => void;
  updateSettings: (newSettings: Partial<GameSettings>) => void;
  handlePlayerDeath: (summary: AscensionSummaryData) => void;
  respawnAndReset: () => { baseHealth: number };
  softResetAndAscend: () => AscensionSummaryData;
  unlockTechNode: (nodeId: string) => { success: boolean; reason?: string };
  resetAllData: () => void;
  setFireProtocol: (protocol: FireProtocolType) => void;
}

const initialProgression = loadProgression();

export const useGameStore = create<GameStoreState>((set, get) => ({
  // Currencies (Credits & Gold Coins)
  cash: initialProgression.cash,
  cosmicShards: initialProgression.cosmicShards,
  gems: initialProgression.gems,
  cells: initialProgression.cells,
  tournamentStones: initialProgression.tournamentStones,

  // Progression & Waves
  tier: initialProgression.tier || 1,
  wave: initialProgression.currentWave || 1,
  highestWaveThisRun: initialProgression.highestWaveThisRun || 1,
  highestWaveEver: initialProgression.highestWaveEver || 1,
  ascensionCount: initialProgression.ascensionCount || 0,
  gameSpeed: initialProgression.gameSpeed !== undefined 
    ? Math.max(MIN_GAME_SPEED, Math.min(getMaxGameSpeed(initialProgression.labResearchLevels), initialProgression.gameSpeed)) 
    : 1.0,
  fireProtocol: initialProgression.fireProtocol || 'standard',

  // Workshop & Equipment levels
  workshopUpgrades: initialProgression.workshopUpgrades || {},
  unlockedTechNodes: initialProgression.unlockedTechNodes || [],
  upgrades: UPGRADES_CONFIG.map(config => ({
    ...config,
    level: initialProgression.upgradeLevels[config.id] || 0,
  })),

  // Cards
  cards: initialProgression.cards || {},
  maxCardSlots: initialProgression.maxCardSlots || 1,
  equippedCardIds: initialProgression.equippedCardIds || [],

  // Labs
  labSlotsCount: initialProgression.labSlotsCount || 1,
  labSlots: initialProgression.labSlots || [{ researchId: null, targetLevel: 0, startTime: 0, endTime: 0, isCompleted: false }],
  labResearchLevels: initialProgression.labResearchLevels || {},
  labQueue: [],

  // Missions & Milestones
  missions: initialProgression.missions || [],
  weeklyMissionProgress: initialProgression.weeklyMissionProgress || 0,
  milestones: initialProgression.milestones || [],
  unlockedSystems: initialProgression.unlockedSystems || {
    cards: false,
    missions: false,
    tournaments: false,
    events: false,
    labs: false,
    tier2: false,
    advancedAttack: false,
    advancedDefense: false,
  },

  // Combat State
  waveProgress: 0,
  enemiesRemaining: 0,
  totalEnemiesInWave: 10,
  isWaveActive: true,
  playerHp: INITIAL_PLAYER_STATS.hp,
  playerMaxHp: INITIAL_PLAYER_STATS.hp,
  activeBoss: null,
  orbitingOrbsCount: 0,

  // Technical & Settings
  settings: initialProgression.settings,
  stats: initialProgression.stats,
  lastOfflineTime: initialProgression.lastSaveTime,
  bulkBuyMode: 'x1',
  isDead: true,
  deathSummary: null,

  // Combat Visual Settings
  attackRadius: ATTACK_RADIUS_CONFIG.default,
  showAttackRadius: true,
  popupDensity: 'high',
  pulseOnEnemyEnter: true,
  isPlayerIdle: true,
  enemiesInRangeCount: 0,

  // Rare Drops & Synergy Mechanics
  activeRareDrops: [],
  synergySlots: initialProgression.synergySlots || 1,
  rareDropCollection: initialProgression.rareDropCollection || {},
  activeSynergyCards: [],
  latestAcquiredDrop: null,

  // Throttled decoupled batch updater (called from game ticker)
  batchUpdateState: (partial: Partial<GameState>) => {
    set(state => {
      // Check if player max HP needs recalculation on relevant changes
      return { ...state, ...partial };
    });
  },

  buyUpgrade: (upgradeId: string) => {
    const state = get();
    const upgrade = state.upgrades.find(u => u.id === upgradeId);
    if (!upgrade) return;

    if (upgrade.maxLevel !== undefined && upgrade.level >= upgrade.maxLevel) {
      return;
    }

    let buyCount = 1;
    if (state.bulkBuyMode === 'x10') buyCount = 10;
    if (upgrade.maxLevel !== undefined) {
      buyCount = Math.min(buyCount, upgrade.maxLevel - upgrade.level);
    }

    let cost = 0;
    if (state.bulkBuyMode === 'xMax') {
      let count = 0;
      let totalCost = 0;
      let current = upgrade.level;
      while (true) {
        if (upgrade.maxLevel !== undefined && current >= upgrade.maxLevel) break;
        const nextCost = Math.round(upgrade.baseCost * Math.pow(upgrade.costGrowth, current));
        if (totalCost + nextCost <= state.cash) {
          totalCost += nextCost;
          count++;
          current++;
        } else {
          break;
        }
      }
      buyCount = count;
      cost = totalCost;
    } else {
      let totalCost = 0;
      let current = upgrade.level;
      const actualAmount = upgrade.maxLevel !== undefined 
        ? Math.min(buyCount, Math.max(0, upgrade.maxLevel - upgrade.level)) 
        : buyCount;
      for (let i = 0; i < actualAmount; i++) {
        totalCost += upgrade.baseCost * Math.pow(upgrade.costGrowth, current);
        current++;
      }
      cost = Math.max(1, Math.round(totalCost));
    }

    if (buyCount > 0 && state.cash >= cost) {
      soundEngine.playUpgradeSuccess();
      const newCash = state.cash - cost;
      const newUpgrades = state.upgrades.map(u => (u.id === upgradeId ? { ...u, level: u.level + buyCount } : u));
      
      // Recalculate Max HP if health was upgraded
      const healthUpg = newUpgrades.find(u => u.id === 'health_max');
      const permHpBonus = (state.workshopUpgrades?.['perm_base_hp'] || 0) * 20.0;
      const cardHpBonus = state.equippedCardIds?.includes('card_health_plating') ? 1.4 : 1.0;
      const baseHealth = (healthUpg?.baseValue || 20) + permHpBonus + (healthUpg?.level || 0) * (healthUpg?.increment || 3);
      const maxHp = Math.round(baseHealth * cardHpBonus);

      set({
        cash: newCash,
        upgrades: newUpgrades,
        playerMaxHp: maxHp,
        playerHp: state.isDead ? 0 : Math.min(maxHp, state.playerHp),
      });
    }
  },

  buyPermanentUpgrade: (configId: string, amount: number = 1) => {
    const state = get();
    if (configId.startsWith('unlock_meta_')) {
      const currentLevel = state.workshopUpgrades?.[configId] || 0;
      const cost = currentLevel === 0 ? 50 : currentLevel === 1 ? 250 : 1000;
      if (state.cosmicShards >= cost) {
        soundEngine.playUpgradeSuccess();
        const newShards = state.cosmicShards - cost;
        const newLevel = currentLevel + 1;
        const updatedUpgrades = {
          ...state.workshopUpgrades,
          [configId]: newLevel,
        };
        set({
          cosmicShards: newShards,
          workshopUpgrades: updatedUpgrades,
        });
        saveFullProgression({
          cash: state.cash,
          cosmicShards: newShards,
          gems: state.gems,
          cells: state.cells,
          tournamentStones: state.tournamentStones,
          tier: state.tier,
          currentWave: state.wave,
          highestWaveThisRun: state.highestWaveThisRun,
          highestWaveEver: state.highestWaveEver,
          ascensionCount: state.ascensionCount,
          gameSpeed: state.gameSpeed,
          workshopUpgrades: updatedUpgrades,
          unlockedTechNodes: state.unlockedTechNodes || [],
          upgradeLevels: {},
          cards: state.cards,
          maxCardSlots: state.maxCardSlots,
          equippedCardIds: state.equippedCardIds,
          labSlotsCount: state.labSlotsCount,
          labSlots: state.labSlots,
          labResearchLevels: state.labResearchLevels,
          missions: state.missions,
          milestones: state.milestones,
          unlockedSystems: state.unlockedSystems,
          settings: state.settings,
          stats: state.stats,
        });
      }
      return;
    }

    const config = WORKSHOP_CONFIG.find(c => c.id === configId);
    if (!config) return;

    const currentLevel = state.workshopUpgrades?.[configId] || 0;
    const requestedAmount = Math.max(1, amount);
    let levelsToBuy = 0;
    let totalCost = 0;

    for (let i = 0; i < requestedAmount; i++) {
      const stepCost = calculateWorkshopCost(config, currentLevel + i);
      if (totalCost + stepCost <= state.cosmicShards) {
        totalCost += stepCost;
        levelsToBuy++;
      } else {
        break;
      }
    }

    if (levelsToBuy > 0 && totalCost > 0) {
      soundEngine.playUpgradeSuccess();
      const newShards = state.cosmicShards - totalCost;
      const newLevel = currentLevel + levelsToBuy;
      const updatedUpgrades = {
        ...state.workshopUpgrades,
        [configId]: newLevel,
      };

      // Recalculate base health if upgrading perm_base_hp
      const healthUpg = state.upgrades.find(u => u.id === 'health_max');
      const permHpBonus = (updatedUpgrades['perm_base_hp'] || 0) * 15.0;
      const techBonuses = computeTechBonuses(state.unlockedTechNodes || []);
      const cardHpBonus = state.equippedCardIds?.includes('card_health_plating') ? 1.4 : 1.0;
      const baseHealth = Math.round(((healthUpg?.baseValue || 15) + permHpBonus + (healthUpg?.level || 0) * (healthUpg?.increment || 3)) * cardHpBonus * techBonuses.healthMultiplier);

      // Recalculate death summary reserved cash if upgrading perm_starting_cash
      let updatedDeathSummary = state.deathSummary;
      if (updatedDeathSummary && (configId === 'perm_starting_cash' || configId === 'perm_base_damage')) {
        let loansharkMultiplier = 1.0;
        const isLoansharkEquipped = state.equippedCardIds?.includes('card_loanshark');
        if (isLoansharkEquipped) {
          const cardObj = state.cards?.['card_loanshark'];
          const cardLevel = cardObj?.level || 1;
          loansharkMultiplier = 1.25 + (cardLevel - 1) * 0.35;
        }
        const workshopStartingCashLevel = updatedUpgrades['perm_starting_cash'] || 0;
        const labDeathReserveLevel = state.labResearchLevels?.['lab_death_reserve'] || 0;
        const isFirstDeath = (state.ascensionCount || 0) <= 1;
        const newReserved = calculateDeathCashReserve(
          Math.max(state.highestWaveEver, updatedDeathSummary.waveReached),
          workshopStartingCashLevel,
          labDeathReserveLevel,
          loansharkMultiplier,
          isFirstDeath,
          updatedDeathSummary.waveReached,
          techBonuses.startingCashBonus
        );
        updatedDeathSummary = {
          ...updatedDeathSummary,
          reservedCashGained: newReserved,
        };
      }

      set({
        cosmicShards: newShards,
        workshopUpgrades: updatedUpgrades,
        playerMaxHp: baseHealth,
        playerHp: state.isDead ? 0 : Math.min(baseHealth, state.playerHp),
        deathSummary: updatedDeathSummary,
      });

      saveFullProgression({
        cash: state.cash,
        cosmicShards: newShards,
        gems: state.gems,
        cells: state.cells,
        tournamentStones: state.tournamentStones,
        tier: state.tier,
        currentWave: state.wave,
        highestWaveThisRun: state.highestWaveThisRun,
        highestWaveEver: state.highestWaveEver,
        ascensionCount: state.ascensionCount,
        gameSpeed: state.gameSpeed,
        workshopUpgrades: updatedUpgrades,
        unlockedTechNodes: state.unlockedTechNodes || [],
        upgradeLevels: {},
        cards: state.cards,
        maxCardSlots: state.maxCardSlots,
        equippedCardIds: state.equippedCardIds,
        labSlotsCount: state.labSlotsCount,
        labSlots: state.labSlots,
        labResearchLevels: state.labResearchLevels,
        missions: state.missions,
        milestones: state.milestones,
        unlockedSystems: state.unlockedSystems,
        settings: state.settings,
        stats: state.stats,
      });
    }
  },

  drawCardPack: () => {
    const state = get();
    const PACK_COST_GEMS = CARD_PACK_GEM_COST;
    if (state.gems < PACK_COST_GEMS) return null;

    soundEngine.playUpgradeSuccess();
    const newGems = state.gems - PACK_COST_GEMS;

    // Filter out cards that are already maxed or locked by milestone
    const unlockedUnmaxedCards = CARDS_CONFIG.filter(c => {
      if (c.unlockTier && c.unlockWave) {
        const highest = state.stats?.highestWavePerTier?.[c.unlockTier] || 0;
        if (highest < c.unlockWave) return false;
      }
      const cardState = state.cards[c.id];
      if (cardState && cardState.level >= 7) return false;
      return true;
    });

    if (unlockedUnmaxedCards.length === 0) {
      return null;
    }

    const commons = unlockedUnmaxedCards.filter(c => c.rarity === 'common');
    const uncommons = unlockedUnmaxedCards.filter(c => c.rarity === 'uncommon');
    const rares = unlockedUnmaxedCards.filter(c => c.rarity === 'rare');
    const epics = unlockedUnmaxedCards.filter(c => c.rarity === 'epic');

    // Weighted rarity selection based on available unmaxed cards:
    // Once all Common cards are maxed, chance to pull Rare jumps to 97%, and Epic to 3%.
    const rand = Math.random() * 100;
    let targetRarity: 'common' | 'uncommon' | 'rare' | 'epic' = 'common';

    if (commons.length === 0) {
      if (uncommons.length === 0 && rares.length === 0) {
        targetRarity = 'epic';
      } else {
        if (rand < 3) {
          targetRarity = 'epic';
        } else if (uncommons.length > 0 && rand < 33) {
          targetRarity = 'uncommon';
        } else {
          targetRarity = 'rare';
        }
      }
    } else {
      if (rand < 5) targetRarity = 'epic';
      else if (rand < 18) targetRarity = 'rare';
      else if (rand < 48) targetRarity = 'uncommon';
      else targetRarity = 'common';
    }

    let eligible = unlockedUnmaxedCards.filter(c => c.rarity === targetRarity);
    if (eligible.length === 0) {
      eligible = unlockedUnmaxedCards;
    }

    const randomCardDef = eligible[Math.floor(Math.random() * eligible.length)];
    const existing = state.cards[randomCardDef.id];

    let newLevel = existing ? existing.level : 1;
    // If card was already owned, add +1 duplicate (EXP)
    let newDupes = existing ? existing.duplicates + 1 : 0;
    const reqExp = getCardRequiredExp(newLevel);

    const nextCards = {
      ...state.cards,
      [randomCardDef.id]: {
        id: randomCardDef.id,
        level: newLevel,
        duplicates: newDupes,
        isEquipped: existing?.isEquipped || false,
      },
    };

    if (state.settings.autoLevelUpCards) {
      Object.keys(nextCards).forEach(cardId => {
        let card = { ...nextCards[cardId] };
        while (true) {
          const reqExp = getCardRequiredExp(card.level);
          if (card.duplicates >= reqExp) {
            card.level += 1;
            card.duplicates -= reqExp;
          } else {
            break;
          }
        }
        nextCards[cardId] = card;
      });
    }

    const finalCard = nextCards[randomCardDef.id];
    const finalReqExp = getCardRequiredExp(finalCard.level);

    // Skill Matrix Card Integration: pulling a skill card grants and overclocks the active skill!
    let updatedCollection = { ...state.rareDropCollection };
    let updatedActive = [...state.activeRareDrops];
    let updatedSynergySlots = state.synergySlots || 1;

    const skillCardMap: Record<string, RareDropType | 'synergy'> = {
      card_skill_double_shot: 'double_shot',
      card_skill_piercing: 'piercing',
      card_skill_rapid_fire: 'rapid_fire',
      card_skill_calamity: 'flow_of_calamity',
      card_skill_lightning: 'lightning_chain',
      card_skill_poison: 'poison',
      card_skill_synergy: 'synergy',
    };

    const matchedSkill = skillCardMap[randomCardDef.id];
    if (matchedSkill) {
      if (matchedSkill === 'synergy') {
        updatedSynergySlots = Math.min(5, (state.synergySlots || 1) + 1);
      } else {
        const skillId = matchedSkill as RareDropType;
        const currentProgress = updatedCollection[skillId] || {
          id: skillId,
          level: 0,
          copies: 0,
          highestRaritySeen: 'rare',
        };
        const nextSkillLevel = Math.max(1, currentProgress.level);
        updatedCollection[skillId] = {
          ...currentProgress,
          level: nextSkillLevel,
          copies: currentProgress.copies + 1,
          highestRaritySeen: currentProgress.highestRaritySeen || 'rare',
        };

        if (!updatedActive.some(d => d.id === skillId) && updatedActive.length < updatedSynergySlots) {
          const rareDef = RARE_DROPS_DEFINITIONS.find(d => d.id === skillId);
          if (rareDef) {
            updatedActive.push({
              id: skillId,
              instanceId: `skill_${skillId}_${Date.now()}`,
              name: rareDef.name,
              rarity: 'rare',
              level: nextSkillLevel,
              effectMultiplier: 1.5 + (nextSkillLevel - 1) * 0.15,
              description: rareDef.description,
              icon: rareDef.icon,
            });
          }
        }
      }
    }

    set({
      gems: newGems,
      cards: nextCards,
      rareDropCollection: updatedCollection,
      activeRareDrops: updatedActive,
      synergySlots: updatedSynergySlots,
    });

    return {
      cardDef: randomCardDef,
      level: finalCard.level,
      duplicates: finalCard.duplicates,
      reqDupes: finalReqExp,
    };
  },

  drawMultipleCardPacks: (count: number) => {
    const state = get();
    const PACK_COST_GEMS = CARD_PACK_GEM_COST;
    const totalCost = PACK_COST_GEMS * count;
    if (state.gems < totalCost) return null;

    soundEngine.playUpgradeSuccess();
    const newGems = state.gems - totalCost;

    const nextCards = { ...state.cards };
    const updatedCollection = { ...state.rareDropCollection };
    const updatedActive = [...state.activeRareDrops];
    let updatedSynergySlots = state.synergySlots || 1;

    const results: any[] = [];

    const skillCardMap: Record<string, RareDropType | 'synergy'> = {
      card_skill_double_shot: 'double_shot',
      card_skill_piercing: 'piercing',
      card_skill_rapid_fire: 'rapid_fire',
      card_skill_calamity: 'flow_of_calamity',
      card_skill_lightning: 'lightning_chain',
      card_skill_poison: 'poison',
      card_skill_synergy: 'synergy',
    };

    for (let idx = 0; idx < count; idx++) {
      // Filter out cards that are already maxed or locked by milestone
      const unlockedUnmaxedCards = CARDS_CONFIG.filter(c => {
        if (c.unlockTier && c.unlockWave) {
          const highest = state.stats?.highestWavePerTier?.[c.unlockTier] || 0;
          if (highest < c.unlockWave) return false;
        }
        const cardState = nextCards[c.id];
        if (cardState && cardState.level >= 7) return false;
        return true;
      });

      if (unlockedUnmaxedCards.length === 0) {
        break; // Stop pulling if all cards are maxed
      }

      const commons = unlockedUnmaxedCards.filter(c => c.rarity === 'common');
      const uncommons = unlockedUnmaxedCards.filter(c => c.rarity === 'uncommon');
      const rares = unlockedUnmaxedCards.filter(c => c.rarity === 'rare');
      const epics = unlockedUnmaxedCards.filter(c => c.rarity === 'epic');

      // Weighted rarity selection based on available unmaxed cards:
      // Once all Common cards are maxed, chance to pull Rare jumps to 97%, and Epic to 3%.
      const rand = Math.random() * 100;
      let targetRarity: 'common' | 'uncommon' | 'rare' | 'epic' = 'common';

      if (commons.length === 0) {
        if (uncommons.length === 0 && rares.length === 0) {
          targetRarity = 'epic';
        } else {
          if (rand < 3) {
            targetRarity = 'epic';
          } else if (uncommons.length > 0 && rand < 33) {
            targetRarity = 'uncommon';
          } else {
            targetRarity = 'rare';
          }
        }
      } else {
        if (rand < 5) targetRarity = 'epic';
        else if (rand < 18) targetRarity = 'rare';
        else if (rand < 48) targetRarity = 'uncommon';
        else targetRarity = 'common';
      }

      let eligible = unlockedUnmaxedCards.filter(c => c.rarity === targetRarity);
      if (eligible.length === 0) {
        eligible = unlockedUnmaxedCards;
      }

      const randomCardDef = eligible[Math.floor(Math.random() * eligible.length)];
      const existing = nextCards[randomCardDef.id];

      const newLevel = existing ? existing.level : 1;
      const newDupes = existing ? existing.duplicates + 1 : 0;
      const reqExp = getCardRequiredExp(newLevel);

      nextCards[randomCardDef.id] = {
        id: randomCardDef.id,
        level: newLevel,
        duplicates: newDupes,
        isEquipped: existing?.isEquipped || false,
      };

      const matchedSkill = skillCardMap[randomCardDef.id];
      if (matchedSkill) {
        if (matchedSkill === 'synergy') {
          updatedSynergySlots = Math.min(5, (updatedSynergySlots || 1) + 1);
        } else {
          const skillId = matchedSkill as RareDropType;
          const currentProgress = updatedCollection[skillId] || {
            id: skillId,
            level: 0,
            copies: 0,
            highestRaritySeen: 'rare',
          };
          const nextSkillLevel = Math.max(1, currentProgress.level);
          updatedCollection[skillId] = {
            ...currentProgress,
            level: nextSkillLevel,
            copies: currentProgress.copies + 1,
            highestRaritySeen: currentProgress.highestRaritySeen || 'rare',
          };

          if (!updatedActive.some(d => d.id === skillId) && updatedActive.length < updatedSynergySlots) {
            const rareDef = RARE_DROPS_DEFINITIONS.find(d => d.id === skillId);
            if (rareDef) {
              updatedActive.push({
                id: skillId,
                instanceId: `skill_${skillId}_${Date.now()}_${idx}`,
                name: rareDef.name,
                rarity: 'rare',
                level: nextSkillLevel,
                effectMultiplier: 1.5 + (nextSkillLevel - 1) * 0.15,
                description: rareDef.description,
                icon: rareDef.icon,
              });
            }
          }
        }
      }

      results.push({
        cardDef: randomCardDef,
        level: newLevel,
        duplicates: newDupes,
        reqDupes: reqExp,
      });
    }

    if (state.settings.autoLevelUpCards) {
      Object.keys(nextCards).forEach(cardId => {
        let card = { ...nextCards[cardId] };
        while (true) {
          const reqExp = getCardRequiredExp(card.level);
          if (card.duplicates >= reqExp) {
            card.level += 1;
            card.duplicates -= reqExp;
          } else {
            break;
          }
        }
        nextCards[cardId] = card;
      });

      results.forEach(res => {
        const finalCard = nextCards[res.cardDef.id];
        if (finalCard) {
          res.level = finalCard.level;
          res.duplicates = finalCard.duplicates;
          res.reqDupes = getCardRequiredExp(finalCard.level);
        }
      });
    }

    set({
      gems: newGems,
      cards: nextCards,
      rareDropCollection: updatedCollection,
      activeRareDrops: updatedActive,
      synergySlots: updatedSynergySlots,
    });

    return results;
  },

  levelUpCard: (cardId: string) => {
    const state = get();
    const existing = state.cards[cardId];
    if (!existing) return false;

    const reqExp = getCardRequiredExp(existing.level);
    if (existing.duplicates < reqExp) return false;

    soundEngine.playUpgradeSuccess();
    const newLevel = existing.level + 1;
    const remainingExp = existing.duplicates - reqExp;

    const nextCards = {
      ...state.cards,
      [cardId]: {
        ...existing,
        level: newLevel,
        duplicates: remainingExp,
      },
    };

    set({ cards: nextCards });
    return true;
  },

  levelUpAllCards: () => {
    const state = get();
    let hasAnyUpgraded = false;
    const nextCards = { ...state.cards };

    Object.keys(nextCards).forEach(cardId => {
      let card = { ...nextCards[cardId] };
      let upgradedThisCard = false;
      while (true) {
        const reqExp = getCardRequiredExp(card.level);
        if (card.duplicates >= reqExp) {
          card.level += 1;
          card.duplicates -= reqExp;
          upgradedThisCard = true;
          hasAnyUpgraded = true;
        } else {
          break;
        }
      }
      if (upgradedThisCard) {
        nextCards[cardId] = card;
      }
    });

    if (hasAnyUpgraded) {
      soundEngine.playUpgradeSuccess();
      set({ cards: nextCards });
    }
    return hasAnyUpgraded;
  },

  toggleEquipCard: (cardId: string) => {
    const state = get();
    soundEngine.playTabSwitch();
    const isEquipped = state.equippedCardIds.includes(cardId);
    if (isEquipped) {
      const nextEquipped = state.equippedCardIds.filter(id => id !== cardId);
      set({ equippedCardIds: nextEquipped });
    } else {
      if (state.equippedCardIds.length >= state.maxCardSlots) return;
      const nextEquipped = [...state.equippedCardIds, cardId];
      set({ equippedCardIds: nextEquipped });
    }
  },

  unlockCardSlot: () => {
    const state = get();
    const currentSlots = state.maxCardSlots;
    const cost = CARD_SLOT_GEM_COSTS[currentSlots - 1] || 1000;

    if (state.gems >= cost && currentSlots < 8) {
      soundEngine.playUpgradeSuccess();
      set({
        gems: state.gems - cost,
        maxCardSlots: currentSlots + 1,
      });
    }
  },

  startLabResearch: (slotIndex: number, researchId: string) => {
    const state = get();
    const def = LAB_RESEARCH_CONFIG.find(r => r.id === researchId);
    if (!def) return;

    const currentLevel = state.labResearchLevels[researchId] || 0;
    if (currentLevel >= def.maxLevel) return;

    const costCells = Math.round(def.baseCostCells * Math.pow(def.costGrowth, currentLevel));
    if (state.cells < costCells) return;

    const durationSeconds = Math.round(def.baseDurationSeconds * Math.pow(def.durationGrowth, currentLevel));
    const startTime = Date.now();
    const endTime = startTime + durationSeconds * 1000;

    soundEngine.playUpgradeSuccess();
    const updatedSlots = [...state.labSlots];
    updatedSlots[slotIndex] = {
      researchId,
      targetLevel: currentLevel + 1,
      startTime,
      endTime,
      isCompleted: false,
    };

    set({
      cells: state.cells - costCells,
      labSlots: updatedSlots,
    });
  },

  rushLabResearch: (slotIndex: number) => {
    const state = get();
    const slot = state.labSlots[slotIndex];
    if (!slot || !slot.researchId || slot.isCompleted) return;

    const RUSH_GEMS = 15;
    if (state.gems < RUSH_GEMS) return;

    soundEngine.playUpgradeSuccess();
    const updatedSlots = [...state.labSlots];
    updatedSlots[slotIndex] = { ...slot, isCompleted: true, endTime: Date.now() };

    const updatedLevels = {
      ...state.labResearchLevels,
      [slot.researchId]: slot.targetLevel,
    };

    set({
      gems: state.gems - RUSH_GEMS,
      labSlots: updatedSlots,
      labResearchLevels: updatedLevels,
    });
  },

  collectCompletedLab: (slotIndex: number) => {
    const state = get();
    const slot = state.labSlots[slotIndex];
    let updatedCollection = { ...state.rareDropCollection };
    let updatedActive = [...state.activeRareDrops];
    let updatedSynergySlots = state.synergySlots || 1;

    if (slot && slot.researchId) {
      const def = LAB_RESEARCH_CONFIG.find(r => r.id === slot.researchId);
      if (def && def.skillId) {
        if (def.skillId === 'synergy_card_matrix') {
          updatedSynergySlots = Math.min(5, (state.synergySlots || 1) + 1);
        } else {
          const skillId = def.skillId as RareDropType;
          const current = updatedCollection[skillId] || { id: skillId, level: 0, copies: 0, highestRaritySeen: 'rare' };
          const lvl = slot.targetLevel || current.level || 1;
          updatedCollection[skillId] = {
            ...current,
            level: lvl,
            highestRaritySeen: current.highestRaritySeen || 'rare',
          };
          if (!updatedActive.some(d => d.id === skillId) && updatedActive.length < updatedSynergySlots) {
            const rareDef = RARE_DROPS_DEFINITIONS.find(d => d.id === skillId);
            if (rareDef) {
              updatedActive.push({
                id: skillId,
                instanceId: `skill_${skillId}_${Date.now()}`,
                name: rareDef.name,
                rarity: 'rare',
                level: lvl,
                effectMultiplier: 1.5 + (lvl - 1) * 0.15,
                description: rareDef.description,
                icon: rareDef.icon,
              });
            }
          }
        }
      }
    }

    const updatedSlots = [...state.labSlots];
    updatedSlots[slotIndex] = { researchId: null, targetLevel: 0, startTime: 0, endTime: 0, isCompleted: false };
    
    const updatedLevels = {
      ...state.labResearchLevels,
      ...(slot && slot.researchId ? { [slot.researchId]: slot.targetLevel } : {}),
    };

    set({
      labSlots: updatedSlots,
      labResearchLevels: updatedLevels,
      rareDropCollection: updatedCollection,
      activeRareDrops: updatedActive,
      synergySlots: updatedSynergySlots,
    });
  },

  buyLabAttribute: (researchId: string, currency: 'shards' | 'gems' | 'cells') => {
    const state = get();
    const def = LAB_RESEARCH_CONFIG.find(r => r.id === researchId);
    if (!def) return false;

    const currentLevel = state.labResearchLevels[researchId] || 0;
    if (currentLevel >= def.maxLevel) return false;

    const shardCost = Math.round((def.baseCostShards || 30) * Math.pow(def.costShardsGrowth || 1.35, currentLevel));
    const gemCost = def.instantGemsCost || 10;
    const cellCost = Math.round(def.baseCostCells * Math.pow(def.costGrowth, currentLevel));

    let updatedShards = state.cosmicShards;
    let updatedGems = state.gems;
    let updatedCells = state.cells;

    if (currency === 'shards') {
      if (state.cosmicShards < shardCost) return false;
      updatedShards -= shardCost;
    } else if (currency === 'gems') {
      if (state.gems < gemCost) return false;
      updatedGems -= gemCost;
    } else if (currency === 'cells') {
      if (state.cells < cellCost) return false;
      updatedCells -= cellCost;
    }

    soundEngine.playUpgradeSuccess();
    const newLevel = currentLevel + 1;
    const updatedLevels = {
      ...state.labResearchLevels,
      [researchId]: newLevel,
    };

    let updatedCollection = { ...state.rareDropCollection };
    let updatedActiveDrops = [...state.activeRareDrops];
    let updatedSynergySlots = state.synergySlots || 1;

    if (def.skillId) {
      if (def.skillId === 'synergy_card_matrix') {
        updatedSynergySlots = Math.min(5, (state.synergySlots || 1) + 1);
      } else {
        const skillId = def.skillId as RareDropType;
        const existing = updatedCollection[skillId] || {
          id: skillId,
          level: 0,
          copies: 0,
          highestRaritySeen: 'rare',
        };
        updatedCollection[skillId] = {
          ...existing,
          level: Math.max(existing.level, newLevel),
          highestRaritySeen: existing.highestRaritySeen || 'rare',
        };

        if (!updatedActiveDrops.some(d => d.id === skillId) && updatedActiveDrops.length < updatedSynergySlots) {
          const rareDef = RARE_DROPS_DEFINITIONS.find(d => d.id === skillId);
          if (rareDef) {
            updatedActiveDrops.push({
              id: skillId,
              instanceId: `skill_${skillId}_${Date.now()}`,
              name: rareDef.name,
              rarity: 'rare',
              level: newLevel,
              effectMultiplier: 1.5 + (newLevel - 1) * 0.15,
              description: rareDef.description,
              icon: rareDef.icon,
            });
          }
        } else {
          const idx = updatedActiveDrops.findIndex(d => d.id === skillId);
          if (idx >= 0) {
            updatedActiveDrops[idx] = {
              ...updatedActiveDrops[idx],
              level: newLevel,
              effectMultiplier: 1.5 + (newLevel - 1) * 0.15,
            };
          }
        }
      }
    }

    set({
      cosmicShards: updatedShards,
      gems: updatedGems,
      cells: updatedCells,
      labResearchLevels: updatedLevels,
      rareDropCollection: updatedCollection,
      activeRareDrops: updatedActiveDrops,
      synergySlots: updatedSynergySlots,
    });
    return true;
  },

  convertCurrencyToCells: (fromCurrency: 'shards' | 'gems', amount: number) => {
    const state = get();
    if (fromCurrency === 'shards') {
      if (state.cosmicShards < amount) return false;
      const cellsGained = Math.round(amount * 2.5);
      soundEngine.playUpgradeSuccess();
      set({
        cosmicShards: state.cosmicShards - amount,
        cells: state.cells + cellsGained,
      });
      return true;
    } else {
      if (state.gems < amount) return false;
      const cellsGained = Math.round(amount * 20);
      soundEngine.playUpgradeSuccess();
      set({
        gems: state.gems - amount,
        cells: state.cells + cellsGained,
      });
      return true;
    }
  },

  unlockLabSlot: () => {
    const state = get();
    const currentSlots = state.labSlots.length;
    if (currentSlots >= MAX_LAB_SLOTS) return false;
    const cost = LAB_SLOT_GEM_COSTS[currentSlots] || 250;
    if (state.gems < cost) return false;

    soundEngine.playUpgradeSuccess();
    const newSlots = [
      ...state.labSlots,
      { researchId: null, targetLevel: 0, startTime: 0, endTime: 0, isCompleted: false },
    ];
    set({
      gems: state.gems - cost,
      labSlotsCount: newSlots.length,
      labSlots: newSlots,
    });
    return true;
  },

  synthesizeSkill: (skillId: RareDropType, currency: 'shards' | 'gems' | 'cells') => {
    const state = get();
    const SHARD_COST = 40;
    const GEM_COST = 12;
    const CELL_COST = 60;

    let updatedShards = state.cosmicShards;
    let updatedGems = state.gems;
    let updatedCells = state.cells;

    if (currency === 'shards') {
      if (state.cosmicShards < SHARD_COST) return false;
      updatedShards -= SHARD_COST;
    } else if (currency === 'gems') {
      if (state.gems < GEM_COST) return false;
      updatedGems -= GEM_COST;
    } else if (currency === 'cells') {
      if (state.cells < CELL_COST) return false;
      updatedCells -= CELL_COST;
    }

    soundEngine.playUpgradeSuccess();
    const existing = state.rareDropCollection[skillId] || {
      id: skillId,
      level: 0,
      copies: 0,
      highestRaritySeen: 'rare',
    };
    const newLevel = Math.max(1, existing.level);
    const updatedCollection = {
      ...state.rareDropCollection,
      [skillId]: {
        ...existing,
        level: newLevel,
        copies: existing.copies + 1,
        highestRaritySeen: existing.highestRaritySeen || 'rare',
      },
    };

    const updatedActive = [...state.activeRareDrops];
    if (!updatedActive.some(d => d.id === skillId) && updatedActive.length < state.synergySlots) {
      const rareDef = RARE_DROPS_DEFINITIONS.find(d => d.id === skillId);
      if (rareDef) {
        updatedActive.push({
          id: skillId,
          instanceId: `skill_${skillId}_${Date.now()}`,
          name: rareDef.name,
          rarity: 'rare',
          level: newLevel,
          effectMultiplier: 1.5 + (newLevel - 1) * 0.15,
          description: rareDef.description,
          icon: rareDef.icon,
        });
      }
    }

    set({
      cosmicShards: updatedShards,
      gems: updatedGems,
      cells: updatedCells,
      rareDropCollection: updatedCollection,
      activeRareDrops: updatedActive,
    });
    return true;
  },

  upgradeSkill: (skillId: RareDropType, currency: 'shards' | 'gems' | 'copies') => {
    const state = get();
    const progress = state.rareDropCollection[skillId];
    if (!progress || progress.level >= 15) return false;

    let updatedShards = state.cosmicShards;
    let updatedGems = state.gems;
    let newCopies = progress.copies;

    if (currency === 'copies') {
      if (progress.copies < 3) return false;
      newCopies -= 3;
    } else if (currency === 'shards') {
      const cost = Math.round(25 * Math.pow(1.25, progress.level));
      if (state.cosmicShards < cost) return false;
      updatedShards -= cost;
    } else if (currency === 'gems') {
      const cost = 10;
      if (state.gems < cost) return false;
      updatedGems -= cost;
    }

    soundEngine.playUpgradeSuccess();
    const newLevel = progress.level + 1;
    const updatedCollection = {
      ...state.rareDropCollection,
      [skillId]: {
        ...progress,
        level: newLevel,
        copies: newCopies,
      },
    };

    const updatedActive = state.activeRareDrops.map(d =>
      d.id === skillId
        ? { ...d, level: newLevel, effectMultiplier: 1.5 + (newLevel - 1) * 0.15 }
        : d
    );

    set({
      cosmicShards: updatedShards,
      gems: updatedGems,
      rareDropCollection: updatedCollection,
      activeRareDrops: updatedActive,
    });
    return true;
  },

  toggleEquipSkill: (skillId: RareDropType) => {
    const state = get();
    soundEngine.playTabSwitch();
    const isEquipped = state.activeRareDrops.some(d => d.id === skillId);
    if (isEquipped) {
      set({ activeRareDrops: state.activeRareDrops.filter(d => d.id !== skillId) });
    } else {
      if (state.activeRareDrops.length >= state.synergySlots) return;
      const progress = state.rareDropCollection[skillId];
      const rareDef = RARE_DROPS_DEFINITIONS.find(d => d.id === skillId);
      if (!rareDef) return;
      const level = progress?.level || 1;
      const newDrop: ActiveRareDrop = {
        id: skillId,
        instanceId: `skill_${skillId}_${Date.now()}`,
        name: rareDef.name,
        rarity: progress?.highestRaritySeen || 'rare',
        level,
        effectMultiplier: 1.5 + (level - 1) * 0.15,
        description: rareDef.description,
        icon: rareDef.icon,
      };
      set({ activeRareDrops: [...state.activeRareDrops, newDrop] });
    }
  },

  expandSynergySlots: () => {
    const state = get();
    if (state.synergySlots >= 5) return false;
    const cost = state.synergySlots === 1 ? 40 : state.synergySlots === 2 ? 80 : state.synergySlots === 3 ? 150 : 300;
    if (state.cosmicShards < cost) return false;

    soundEngine.playUpgradeSuccess();
    set({
      cosmicShards: state.cosmicShards - cost,
      synergySlots: state.synergySlots + 1,
    });
    return true;
  },

  claimMissionReward: (missionId: string) => {
    const state = get();
    const isMissionsUnlocked = Boolean(state.unlockedSystems?.missions || (state.highestWaveEver || 0) >= 30);
    if (!isMissionsUnlocked) return;

    const mission = state.missions.find(m => m.id === missionId);
    if (!mission || mission.isClaimed || mission.current < mission.target) return;

    soundEngine.playUpgradeSuccess();
    set({
      cosmicShards: state.cosmicShards + mission.rewardShards,
      gems: state.gems + mission.rewardGems,
      weeklyMissionProgress: Math.min(100, state.weeklyMissionProgress + 15),
      missions: state.missions.map(m => (m.id === missionId ? { ...m, isClaimed: true } : m)),
    });
  },

  claimAllMissions: () => {
    const state = get();
    const isMissionsUnlocked = Boolean(state.unlockedSystems?.missions || (state.highestWaveEver || 0) >= 30);
    if (!isMissionsUnlocked) return;

    const readyMissions = state.missions.filter(m => !m.isClaimed && m.current >= m.target);
    if (readyMissions.length === 0) return;

    soundEngine.playUpgradeSuccess();
    let addGems = 0;
    let addShards = 0;
    const claimedIds = new Set(readyMissions.map(m => m.id));

    readyMissions.forEach(m => {
      addGems += m.rewardGems;
      addShards += m.rewardShards;
    });

    set({
      gems: state.gems + addGems,
      cosmicShards: state.cosmicShards + addShards,
      weeklyMissionProgress: Math.min(100, state.weeklyMissionProgress + readyMissions.length * 15),
      missions: state.missions.map(m => (claimedIds.has(m.id) ? { ...m, isClaimed: true } : m)),
    });
  },

  claimMilestone: (tier: number, wave: number) => {
    const state = get();
    const milestone = state.milestones.find(m => m.tier === tier && m.wave === wave);
    if (!milestone || milestone.isClaimed) return;

    soundEngine.playUpgradeSuccess();
    let addGems = 0;
    let addShards = 0;

    if (milestone.rewardType === 'gems') addGems = milestone.rewardAmount;
    if (milestone.rewardType === 'shards') addShards = milestone.rewardAmount;
    if (milestone.rewardType === 'unlock_system') addGems = milestone.rewardAmount;

    const updatedSystems = { ...state.unlockedSystems };
    if (tier === 1 && wave === 15) updatedSystems.cards = true;
    if (tier === 1 && wave === 30) updatedSystems.missions = true;
    if (tier === 1 && wave === 60) updatedSystems.tournaments = true;
    if (tier === 1 && wave === 70) updatedSystems.events = true;
    if (tier === 1 && wave === 100) {
      updatedSystems.labs = true;
      updatedSystems.tier2 = true;
    }

    set({
      gems: state.gems + addGems,
      cosmicShards: state.cosmicShards + addShards,
      unlockedSystems: updatedSystems,
      milestones: state.milestones.map(m => (m.tier === tier && m.wave === wave ? { ...m, isClaimed: true } : m)),
    });
  },

  claimAllMilestones: (tier?: number) => {
    const state = get();
    const readyMilestones = state.milestones.filter(m => {
      if (m.isClaimed) return false;
      if (tier !== undefined && m.tier !== tier) return false;
      const highest = state.stats?.highestWavePerTier?.[m.tier] || 0;
      return highest >= m.wave;
    });

    if (readyMilestones.length === 0) return;

    soundEngine.playUpgradeSuccess();
    let addGems = 0;
    let addShards = 0;
    const updatedSystems = { ...state.unlockedSystems };
    const claimedKeys = new Set(readyMilestones.map(m => `${m.tier}-${m.wave}`));

    readyMilestones.forEach(m => {
      if (m.rewardType === 'gems') addGems += m.rewardAmount;
      if (m.rewardType === 'shards') addShards += m.rewardAmount;
      if (m.rewardType === 'unlock_system') addGems += m.rewardAmount;
      if (m.tier === 1 && m.wave === 15) updatedSystems.cards = true;
      if (m.tier === 1 && m.wave === 30) updatedSystems.missions = true;
      if (m.tier === 1 && m.wave === 60) updatedSystems.tournaments = true;
      if (m.tier === 1 && m.wave === 70) updatedSystems.events = true;
      if (m.tier === 1 && m.wave === 100) {
        updatedSystems.labs = true;
        updatedSystems.tier2 = true;
      }
    });

    set({
      gems: state.gems + addGems,
      cosmicShards: state.cosmicShards + addShards,
      unlockedSystems: updatedSystems,
      milestones: state.milestones.map(m => (claimedKeys.has(`${m.tier}-${m.wave}`) ? { ...m, isClaimed: true } : m)),
    });
  },

  equipRareDrop: (item: ActiveRareDrop | ActiveSynergyCard) => {
    const state = get();
    const active = [...state.activeRareDrops];
    const existingIdx = active.findIndex(d => d.id === item.id);
    if (existingIdx >= 0) {
      active[existingIdx] = item as ActiveRareDrop;
    } else if (active.length < state.synergySlots) {
      active.push(item as ActiveRareDrop);
    } else {
      active[0] = item as ActiveRareDrop;
    }
    set({
      activeRareDrops: active,
      latestAcquiredDrop: null,
    });
  },

  dismissDropModal: () => {
    set({ latestAcquiredDrop: null });
  },

  setBulkBuyMode: (mode: 'x1' | 'x10' | 'xMax') => {
    set({ bulkBuyMode: mode });
  },

  setGameSpeed: (speed: number) => {
    const state = get();
    const maxSpeed = getMaxGameSpeed(state.labResearchLevels);
    const clampedSpeed = Math.max(MIN_GAME_SPEED, Math.min(maxSpeed, Math.round(speed * 10) / 10));
    set({ gameSpeed: clampedSpeed });
  },

  updateSettings: (newSettings: Partial<GameSettings>) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  handlePlayerDeath: (summary: AscensionSummaryData) => {
    const state = get();
    soundEngine.playAscension();

    const techBonuses = computeTechBonuses(state.unlockedTechNodes || []);
    const rawShards = calculateAscensionShards(summary.waveReached, 1.0, state.tier || 1);
    
    // Performance bonuses from run:
    const enemiesBonusShards = Math.floor((summary.enemiesDefeated || 0) / 10); // +1 shard per 10 hostiles neutralized
    const bossesBonusShards = Math.floor(summary.waveReached / 5) * 6; // +6 shards per boss neutralized
    const recordBonusShards = summary.newRecord ? 15 : 0; // +15 shards record breaker milestone
    const subtotalRaw = rawShards + enemiesBonusShards + bossesBonusShards + recordBonusShards;
    const shardsEarned = Math.round(subtotalRaw * techBonuses.cosmicShardGainMultiplier);
    const techBonusShards = shardsEarned - subtotalRaw;
    
    // Check for Loanshark Card (Epic: 1.25x base + 0.35x per level)
    let loansharkMultiplier = 1.0;
    const isLoansharkEquipped = state.equippedCardIds?.includes('card_loanshark');
    if (isLoansharkEquipped) {
      const cardObj = state.cards?.['card_loanshark'];
      const cardLevel = cardObj?.level || 1;
      loansharkMultiplier = 1.25 + (cardLevel - 1) * 0.35;
    }

    const workshopStartingCashLevel = state.workshopUpgrades?.['perm_starting_cash'] || 0;
    const labDeathReserveLevel = state.labResearchLevels?.['lab_death_reserve'] || 0;
    const isFirstDeath = (state.ascensionCount || 0) === 0;

    const reservedCash = calculateDeathCashReserve(
      Math.max(state.highestWaveEver, summary.waveReached),
      workshopStartingCashLevel,
      labDeathReserveLevel,
      loansharkMultiplier,
      isFirstDeath,
      summary.waveReached,
      techBonuses.startingCashBonus
    );

    const nextState = {
      isDead: true,
      cosmicShards: state.cosmicShards + shardsEarned,
      ascensionCount: state.ascensionCount + 1,
      deathSummary: {
        ...summary,
        totalShardsEarned: shardsEarned,
        baseShards: rawShards,
        enemiesBonusShards,
        bossesBonusShards,
        recordBonusShards,
        techBonusShards,
        reservedCashGained: reservedCash,
        loansharkMultiplier: isLoansharkEquipped ? loansharkMultiplier : undefined,
      },
      stats: {
        ...state.stats,
        totalAscensions: (state.stats?.totalAscensions || 0) + 1,
        lifetimeCosmicShards: (state.stats?.lifetimeCosmicShards || 0) + shardsEarned,
        highestWavePerTier: {
          ...(state.stats?.highestWavePerTier || {}),
          [state.tier]: Math.max(state.stats?.highestWavePerTier?.[state.tier] || 0, summary.waveReached),
        },
      },
    };

    set(nextState);

    // Save progression asynchronously
    saveFullProgression({
      cash: reservedCash,
      cosmicShards: state.cosmicShards + shardsEarned,
      gems: state.gems,
      cells: state.cells,
      tournamentStones: state.tournamentStones,
      tier: state.tier,
      currentWave: 1,
      highestWaveThisRun: state.highestWaveThisRun,
      highestWaveEver: state.highestWaveEver,
      ascensionCount: state.ascensionCount + 1,
      gameSpeed: state.gameSpeed,
      workshopUpgrades: state.workshopUpgrades,
      unlockedTechNodes: state.unlockedTechNodes || [],
      upgradeLevels: {},
      cards: state.cards,
      maxCardSlots: state.maxCardSlots,
      equippedCardIds: state.equippedCardIds,
      labSlotsCount: state.labSlotsCount,
      labSlots: state.labSlots,
      labResearchLevels: state.labResearchLevels,
      missions: state.missions,
      milestones: state.milestones,
      unlockedSystems: state.unlockedSystems,
      settings: state.settings,
      stats: nextState.stats,
    });
  },

  softResetAndAscend: () => {
    const state = get();
    soundEngine.playAscension();

    const techBonuses = computeTechBonuses(state.unlockedTechNodes || []);
    const waveReached = Math.max(state.wave, state.highestWaveThisRun || 1);
    const rawShards = calculateAscensionShards(waveReached, 1.0, state.tier || 1);
    const totalShards = Math.round(rawShards * techBonuses.cosmicShardGainMultiplier);
    const techBonusShards = totalShards - rawShards;

    let loansharkMultiplier = 1.0;
    const isLoansharkEquipped = state.equippedCardIds?.includes('card_loanshark');
    if (isLoansharkEquipped) {
      const cardObj = state.cards?.['card_loanshark'];
      const cardLevel = cardObj?.level || 1;
      loansharkMultiplier = 1.25 + (cardLevel - 1) * 0.35;
    }

    const workshopStartingCashLevel = state.workshopUpgrades?.['perm_starting_cash'] || 0;
    const labDeathReserveLevel = state.labResearchLevels?.['lab_death_reserve'] || 0;
    const isFirstDeath = (state.ascensionCount || 0) === 0;

    const startingCash = calculateDeathCashReserve(
      Math.max(state.highestWaveEver, waveReached),
      workshopStartingCashLevel,
      labDeathReserveLevel,
      loansharkMultiplier,
      isFirstDeath,
      waveReached,
      techBonuses.startingCashBonus
    );

    const summary: AscensionSummaryData = {
      waveReached,
      enemiesDefeated: state.stats?.totalEnemiesSlain || 0,
      totalShardsEarned: totalShards,
      baseShards: rawShards,
      techBonusShards,
      reservedCashGained: startingCash,
      loansharkMultiplier: isLoansharkEquipped ? loansharkMultiplier : undefined,
    };

    const resetUpgrades = state.upgrades.map(u => ({ ...u, level: 0 }));
    const healthUpg = resetUpgrades.find(u => u.id === 'health_max');
    const permHpBonus = (state.workshopUpgrades?.['perm_base_hp'] || 0) * 15.0;
    const cardHpBonus = state.equippedCardIds?.includes('card_health_plating') ? 1.4 : 1.0;
    const baseHealth = Math.round(((healthUpg?.baseValue || 15) + permHpBonus) * cardHpBonus * techBonuses.healthMultiplier);
    const startWave = Math.max(1, 1 + techBonuses.startingWaveBonus);

    const newShards = state.cosmicShards + totalShards;
    const newAscensionCount = (state.ascensionCount || 0) + 1;

    set({
      cash: startingCash,
      cosmicShards: newShards,
      ascensionCount: newAscensionCount,
      wave: startWave,
      highestWaveThisRun: startWave,
      highestWaveEver: Math.max(state.highestWaveEver, waveReached),
      isDead: false,
      deathSummary: summary,
      fireProtocol: 'standard',
      latestAcquiredDrop: null,
      playerHp: baseHealth,
      playerMaxHp: baseHealth,
      isWaveActive: true,
      enemiesRemaining: 0,
      waveProgress: 0,
      orbitingOrbsCount: 0,
      activeBoss: null,
      activeRareDrops: [],
      activeSynergyCards: [],
      upgrades: resetUpgrades,
      stats: {
        ...state.stats,
        totalAscensions: (state.stats?.totalAscensions || 0) + 1,
        lifetimeCosmicShards: (state.stats?.lifetimeCosmicShards || 0) + totalShards,
        highestWavePerTier: {
          ...(state.stats?.highestWavePerTier || {}),
          [state.tier]: Math.max(state.stats?.highestWavePerTier?.[state.tier] || 0, waveReached),
        },
      },
    });

    saveFullProgression({
      cash: startingCash,
      cosmicShards: newShards,
      gems: state.gems,
      cells: state.cells,
      tournamentStones: state.tournamentStones,
      tier: state.tier,
      currentWave: startWave,
      highestWaveThisRun: startWave,
      highestWaveEver: Math.max(state.highestWaveEver, waveReached),
      ascensionCount: newAscensionCount,
      gameSpeed: state.gameSpeed,
      workshopUpgrades: state.workshopUpgrades,
      unlockedTechNodes: state.unlockedTechNodes || [],
      upgradeLevels: {},
      cards: state.cards,
      maxCardSlots: state.maxCardSlots,
      equippedCardIds: state.equippedCardIds,
      labSlotsCount: state.labSlotsCount,
      labSlots: state.labSlots,
      labResearchLevels: state.labResearchLevels,
      missions: state.missions,
      milestones: state.milestones,
      unlockedSystems: state.unlockedSystems,
      settings: state.settings,
      stats: {
        ...state.stats,
        totalAscensions: (state.stats?.totalAscensions || 0) + 1,
        lifetimeCosmicShards: (state.stats?.lifetimeCosmicShards || 0) + totalShards,
        highestWavePerTier: {
          ...(state.stats?.highestWavePerTier || {}),
          [state.tier]: Math.max(state.stats?.highestWavePerTier?.[state.tier] || 0, waveReached),
        },
      },
    });

    return summary;
  },

  unlockTechNode: (nodeId: string) => {
    const state = get();
    const node = TECH_TREE_NODES.find(n => n.id === nodeId);
    if (!node) return { success: false, reason: 'Node not found' };

    const check = canUnlockTechNode(nodeId, state.unlockedTechNodes || []);
    if (!check.canUnlock) {
      return { success: false, reason: check.reason };
    }

    if (state.cosmicShards < node.cost) {
      return { success: false, reason: `Need ${node.cost} Cosmic Shards (Have ${state.cosmicShards})` };
    }

    soundEngine.playTechUnlock();
    const newShards = state.cosmicShards - node.cost;
    const newUnlocked = [...(state.unlockedTechNodes || []), nodeId];

    const bonuses = computeTechBonuses(newUnlocked);
    const healthUpg = state.upgrades.find(u => u.id === 'health_max');
    const permHpBonus = (state.workshopUpgrades?.['perm_base_hp'] || 0) * 15.0;
    const cardHpBonus = state.equippedCardIds?.includes('card_health_plating') ? 1.4 : 1.0;
    const baseHealth = Math.round(((healthUpg?.baseValue || 15) + permHpBonus + (healthUpg?.level || 0) * (healthUpg?.increment || 3)) * cardHpBonus * bonuses.healthMultiplier);

    set({
      cosmicShards: newShards,
      unlockedTechNodes: newUnlocked,
      playerMaxHp: baseHealth,
      playerHp: state.isDead ? 0 : Math.min(baseHealth, state.playerHp),
    });

    const upgradeLevels: Record<string, number> = {};
    state.upgrades.forEach(u => {
      upgradeLevels[u.id] = u.level;
    });

    saveFullProgression({
      cash: state.cash,
      cosmicShards: newShards,
      gems: state.gems,
      cells: state.cells,
      tournamentStones: state.tournamentStones,
      tier: state.tier,
      currentWave: state.wave,
      highestWaveThisRun: state.highestWaveThisRun,
      highestWaveEver: state.highestWaveEver,
      ascensionCount: state.ascensionCount,
      gameSpeed: state.gameSpeed,
      workshopUpgrades: state.workshopUpgrades,
      unlockedTechNodes: newUnlocked,
      upgradeLevels,
      cards: state.cards,
      maxCardSlots: state.maxCardSlots,
      equippedCardIds: state.equippedCardIds,
      labSlotsCount: state.labSlotsCount,
      labSlots: state.labSlots,
      labResearchLevels: state.labResearchLevels,
      missions: state.missions,
      milestones: state.milestones,
      unlockedSystems: state.unlockedSystems,
      settings: state.settings,
      stats: state.stats,
    });

    return { success: true };
  },

  respawnAndReset: () => {
    const state = get();
    const techBonuses = computeTechBonuses(state.unlockedTechNodes || []);
    
    // Resolve starting cash taking newly bought workshop upgrades into account
    let loansharkMultiplier = 1.0;
    const isLoansharkEquipped = state.equippedCardIds?.includes('card_loanshark');
    if (isLoansharkEquipped) {
      const cardObj = state.cards?.['card_loanshark'];
      const cardLevel = cardObj?.level || 1;
      loansharkMultiplier = 1.25 + (cardLevel - 1) * 0.35;
    }
    const workshopStartingCashLevel = state.workshopUpgrades?.['perm_starting_cash'] || 0;
    const labDeathReserveLevel = state.labResearchLevels?.['lab_death_reserve'] || 0;
    const isFirstDeath = (state.ascensionCount || 0) <= 1;
    const computedStartingCash = calculateDeathCashReserve(
      Math.max(state.highestWaveEver, state.deathSummary?.waveReached || state.wave || 1),
      workshopStartingCashLevel,
      labDeathReserveLevel,
      loansharkMultiplier,
      isFirstDeath,
      state.deathSummary?.waveReached || state.wave || 1,
      techBonuses.startingCashBonus
    );
    const startingCash = Math.max(state.deathSummary?.reservedCashGained || 0, computedStartingCash);
    
    // Reset in-run upgrades
    const resetUpgrades = state.upgrades.map(u => ({ ...u, level: 0 }));
    const healthUpg = resetUpgrades.find(u => u.id === 'health_max');
    const permHpBonus = (state.workshopUpgrades?.['perm_base_hp'] || 0) * 15.0; // Reduced from 20.0
    const cardHpBonus = state.equippedCardIds?.includes('card_health_plating') ? 1.4 : 1.0;
    const baseHealth = Math.round(((healthUpg?.baseValue || 15) + permHpBonus) * cardHpBonus * techBonuses.healthMultiplier);
    const startWave = Math.max(1, 1 + techBonuses.startingWaveBonus);

    set({
      cash: startingCash,
      wave: startWave,
      highestWaveThisRun: startWave,
      isDead: false,
      deathSummary: null,
      fireProtocol: 'standard',
      latestAcquiredDrop: null,
      playerHp: baseHealth,
      playerMaxHp: baseHealth,
      isWaveActive: true,
      enemiesRemaining: 0,
      waveProgress: 0,
      orbitingOrbsCount: 0,
      activeBoss: null,
      activeRareDrops: [],
      activeSynergyCards: [],
      upgrades: resetUpgrades,
      stats: {
        ...state.stats,
        totalRunsStarted: (state.stats?.totalRunsStarted || 0) + 1,
      },
    });

    saveFullProgression({
      cash: startingCash,
      cosmicShards: state.cosmicShards,
      gems: state.gems,
      cells: state.cells,
      tournamentStones: state.tournamentStones,
      tier: state.tier,
      currentWave: startWave,
      highestWaveThisRun: startWave,
      highestWaveEver: state.highestWaveEver,
      ascensionCount: state.ascensionCount,
      gameSpeed: state.gameSpeed,
      workshopUpgrades: state.workshopUpgrades,
      unlockedTechNodes: state.unlockedTechNodes || [],
      upgradeLevels: {},
      cards: state.cards,
      maxCardSlots: state.maxCardSlots,
      equippedCardIds: state.equippedCardIds,
      labSlotsCount: state.labSlotsCount,
      labSlots: state.labSlots,
      labResearchLevels: state.labResearchLevels,
      missions: state.missions,
      milestones: state.milestones,
      unlockedSystems: state.unlockedSystems,
      fireProtocol: 'standard',
      settings: state.settings,
      stats: state.stats,
    });

    return { baseHealth };
  },

  setFireProtocol: (protocol: FireProtocolType) => {
    set({ fireProtocol: protocol });
    const state = get();
    const upgradeLevels: Record<string, number> = {};
    state.upgrades.forEach(u => {
      upgradeLevels[u.id] = u.level;
    });
    saveFullProgression({
      cash: state.cash,
      cosmicShards: state.cosmicShards,
      gems: state.gems,
      cells: state.cells,
      tournamentStones: state.tournamentStones,
      tier: state.tier,
      currentWave: state.wave,
      highestWaveThisRun: state.highestWaveThisRun,
      highestWaveEver: state.highestWaveEver,
      ascensionCount: state.ascensionCount,
      gameSpeed: state.gameSpeed,
      workshopUpgrades: state.workshopUpgrades,
      upgradeLevels,
      cards: state.cards,
      maxCardSlots: state.maxCardSlots,
      equippedCardIds: state.equippedCardIds,
      labSlotsCount: state.labSlotsCount,
      labSlots: state.labSlots,
      labResearchLevels: state.labResearchLevels,
      missions: state.missions,
      milestones: state.milestones,
      unlockedSystems: state.unlockedSystems,
      settings: state.settings,
      stats: state.stats,
      fireProtocol: protocol,
    });
  },

  resetAllData: () => {
    clearProgressionStorage();
    const defaultData = getDefaultProgression();
    const resetUpgrades = UPGRADES_CONFIG.map(config => ({ ...config, level: 0 }));

    set({
      ...defaultData,
      upgrades: resetUpgrades,
      wave: 1,
      highestWaveThisRun: 1,
      cash: 0,
      cosmicShards: 0,
      gems: defaultData.gems,
      cells: 0,
      tournamentStones: 0,
      tier: 1,
      playerHp: INITIAL_PLAYER_STATS.hp,
      playerMaxHp: INITIAL_PLAYER_STATS.hp,
      isDead: false,
      deathSummary: null,
      isWaveActive: true,
      enemiesRemaining: 0,
      activeBoss: null,
      cards: {},
      equippedCardIds: [],
      workshopUpgrades: {},
      activeRareDrops: [],
      activeSynergyCards: [],
      latestAcquiredDrop: null,
    });
  },
}));
