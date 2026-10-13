/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { openDB, IDBPDatabase } from 'idb';
import { GameSettings, LifetimeStats, MissionDef, MilestoneDef, PlayerCard, ActiveLabSlot } from '../types';
import { INITIAL_MISSIONS, INITIAL_MILESTONES } from './constants';

const DB_NAME = 'PixelPentagonsDB';
const DB_VERSION = 1;
const STORE_NAME = 'progressionStore';
const SAVE_KEY = 'main_save';
const STORAGE_KEY = 'pixel_pentagons_full_save_data_v6';

export interface SavedProgression {
  cash: number;
  cosmicShards: number;
  gems: number;
  cells: number;
  tournamentStones: number;
  tier: number;
  currentWave: number;
  highestWaveThisRun: number;
  highestWaveEver: number;
  ascensionCount: number;
  gameSpeed: number;
  fireProtocol?: 'standard' | 'gatling' | 'plasma_beam' | 'calamity_shell' | 'singularity_vortex';

  workshopUpgrades: Record<string, number>;
  unlockedTechNodes?: string[];
  upgradeLevels: Record<string, number>;

  cards: Record<string, PlayerCard>;
  maxCardSlots: number;
  equippedCardIds: string[];

  labSlotsCount: number;
  labSlots: ActiveLabSlot[];
  labResearchLevels: Record<string, number>;

  missions: MissionDef[];
  weeklyMissionProgress: number;
  milestones: MilestoneDef[];

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

  // Rare Drops & Synergy Persistence
  synergySlots?: number;
  rareDropCollection?: Record<string, any>;

  settings: GameSettings;
  stats: LifetimeStats;
  lastSaveTime: number;
}

export function generatePlayerId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'PENT-';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export function getDefaultProgression(): SavedProgression {
  const initialCards: Record<string, PlayerCard> = {};

  return {
    cash: 40,
    cosmicShards: 0,
    gems: 50, // Starting gift gems
    cells: 0,
    tournamentStones: 0,
    tier: 1,
    currentWave: 1,
    highestWaveThisRun: 1,
    highestWaveEver: 1,
    ascensionCount: 0,
    gameSpeed: 1.0,
    fireProtocol: 'standard',

    workshopUpgrades: {},
    unlockedTechNodes: [],
    upgradeLevels: {},

    cards: initialCards,
    maxCardSlots: 1,
    equippedCardIds: [],

    labSlotsCount: 1,
    labSlots: [{ researchId: null, targetLevel: 0, startTime: 0, endTime: 0, isCompleted: false }],
    labResearchLevels: {},

    missions: INITIAL_MISSIONS,
    weeklyMissionProgress: 0,
    milestones: INITIAL_MILESTONES,

    unlockedSystems: {
      cards: false,
      missions: false,
      tournaments: false,
      events: false,
      labs: false,
      tier2: false,
      advancedAttack: false,
      advancedDefense: false,
    },

    synergySlots: 1,
    rareDropCollection: {},

    settings: {
      pauseInMenus: true,
      targetFps: 60,
      showCashPopups: true,
      showShardPopups: true,
      showDamageNumbers: true,
      soundMuted: false,
      bgmMuted: false,
      highPerformanceMode: false,
      adaptivePerformanceMode: true,
      showPerformanceHud: false,
      showFpsCounter: false,
      autoLevelUpCards: false,
    },

    stats: {
      playerId: generatePlayerId(),
      gameStartDate: Date.now(),
      lifetimeCash: 0,
      lifetimeCosmicShards: 0,
      lifetimeGems: 50,
      totalDamageDealt: 0,
      totalEnemiesSlain: 0,
      totalBossesSlain: 0,
      totalRunsStarted: 0,
      highestWavePerTier: { 1: 1 },
      totalPlaytimeSeconds: 0,
    },

    lastSaveTime: Date.now(),
  };
}

// In-memory hot cache to avoid blocking synchronous lookups
let memoryCache: SavedProgression | null = null;
let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise && typeof window !== 'undefined' && 'indexedDB' in window) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    }).catch(err => {
      console.warn('IndexedDB initialization failed, falling back to localStorage:', err);
      return null as any;
    });
  }
  return dbPromise!;
}

/**
 * Synchronously loads initial progression for immediate startup.
 * Checks memory cache first, then localStorage cache.
 */
export function loadProgression(): SavedProgression {
  if (memoryCache) return memoryCache;

  const fallback = getDefaultProgression();

  if (typeof window === 'undefined' || !window.localStorage) {
    memoryCache = fallback;
    return fallback;
  }

  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (!rawData) {
      // Full reset: purge old version keys
      localStorage.removeItem('pixel_pentagons_full_save_data_v5');
      localStorage.removeItem('pixel_pentagons_full_save_data_v4');
      localStorage.removeItem('pixel_pentagons_full_save_data');
      localStorage.removeItem('pixel_pentagons_cosmic_shards');
      localStorage.removeItem('pixel_lab_unlocked');

      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
      memoryCache = fallback;
      return fallback;
    }

    const parsed = JSON.parse(rawData);

    // Merge milestones to preserve claimed status on existing ones while adding new ones
    const savedMilestones = parsed.milestones || [];
    const mergedMilestones = fallback.milestones.map(initial => {
      const saved = savedMilestones.find((m: any) => m.tier === initial.tier && m.wave === initial.wave);
      return saved ? { ...initial, isClaimed: saved.isClaimed } : initial;
    });

    // Merge missions to preserve progress/claimed status on existing ones while adding new ones
    const savedMissions = parsed.missions || [];
    const mergedMissions = fallback.missions.map(initial => {
      const saved = savedMissions.find((m: any) => m.id === initial.id);
      return saved ? { ...initial, current: saved.current, isClaimed: saved.isClaimed } : initial;
    });

    const loaded: SavedProgression = {
      ...fallback,
      ...parsed,
      settings: { ...fallback.settings, ...(parsed.settings || {}) },
      stats: { ...fallback.stats, ...(parsed.stats || {}) },
      unlockedSystems: { ...fallback.unlockedSystems, ...(parsed.unlockedSystems || {}) },
      cards: { ...fallback.cards, ...(parsed.cards || {}) },
      milestones: mergedMilestones,
      missions: mergedMissions,
      lastSaveTime: parsed.lastSaveTime || Date.now(),
    };

    memoryCache = loaded;
    return loaded;
  } catch (err) {
    console.warn('Failed to load full progression:', err);
    memoryCache = fallback;
    return fallback;
  }
}

/**
 * Asynchronously loads latest save from IndexedDB with zero main-thread hitching.
 */
export async function loadProgressionAsync(): Promise<SavedProgression> {
  const syncLoaded = loadProgression();
  try {
    const db = await getDB();
    if (db) {
      const stored = await db.get(STORE_NAME, SAVE_KEY);
      if (stored) {
        const fallback = getDefaultProgression();
        const savedMilestones = stored.milestones || [];
        const mergedMilestones = fallback.milestones.map(initial => {
          const saved = savedMilestones.find((m: any) => m.tier === initial.tier && m.wave === initial.wave);
          return saved ? { ...initial, isClaimed: saved.isClaimed } : initial;
        });

        const savedMissions = stored.missions || [];
        const mergedMissions = fallback.missions.map(initial => {
          const saved = savedMissions.find((m: any) => m.id === initial.id);
          return saved ? { ...initial, current: saved.current, isClaimed: saved.isClaimed } : initial;
        });

        const merged: SavedProgression = {
          ...fallback,
          ...stored,
          settings: { ...fallback.settings, ...(stored.settings || {}) },
          stats: { ...fallback.stats, ...(stored.stats || {}) },
          unlockedSystems: { ...fallback.unlockedSystems, ...(stored.unlockedSystems || {}) },
          cards: { ...fallback.cards, ...(stored.cards || {}) },
          milestones: mergedMilestones,
          missions: mergedMissions,
          lastSaveTime: stored.lastSaveTime || Date.now(),
        };
        memoryCache = merged;
        return merged;
      }
    }
  } catch (err) {
    console.warn('Async IndexedDB read error:', err);
  }
  return syncLoaded;
}

// Micro-batched async saving queue
let isSaveScheduled = false;
let pendingSaveData: Partial<SavedProgression> = {};

/**
 * Asynchronous, non-blocking save operation via idb.
 * Updates in-memory state immediately, then asynchronously commits to IndexedDB.
 */
export function saveFullProgression(data: Partial<SavedProgression>) {
  const current = memoryCache || loadProgression();
  const updated: SavedProgression = {
    ...current,
    ...data,
    lastSaveTime: Date.now(),
  };
  memoryCache = updated;
  pendingSaveData = { ...pendingSaveData, ...data };

  if (isSaveScheduled) return;
  isSaveScheduled = true;

  // Schedule async save on microtask queue
  Promise.resolve().then(async () => {
    isSaveScheduled = false;
    const toSave = memoryCache!;

    try {
      const db = await getDB();
      if (db) {
        await db.put(STORE_NAME, toSave, SAVE_KEY);
      }
    } catch (err) {
      console.warn('IndexedDB async save failed:', err);
    }

    // Sync to localStorage as lightweight backup
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      }
    } catch {
      // Ignore quota warnings
    }
  });
}

export async function clearProgressionStorage() {
  memoryCache = null;
  try {
    const db = await getDB();
    if (db) {
      await db.delete(STORE_NAME, SAVE_KEY);
    }
  } catch {
    // Ignore error
  }

  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem('pixel_pentagons_full_save_data_v6');
    localStorage.removeItem('pixel_pentagons_full_save_data_v5');
    localStorage.removeItem('pixel_pentagons_full_save_data_v4');
    localStorage.removeItem('pixel_pentagons_full_save_data');
    localStorage.removeItem('pixel_pentagons_cosmic_shards');
    localStorage.removeItem('pixel_lab_unlocked');
  }
}
