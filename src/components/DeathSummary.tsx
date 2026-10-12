/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, 
  Hammer, 
  Layers, 
  Hexagon, 
  FlaskConical, 
  ShoppingCart, 
  Sparkles, 
  Trophy, 
  Calendar, 
  Settings, 
  ListChecks, 
  BookOpen,
  ChevronLeft, 
  ChevronRight, 
  Shield, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Lock, 
  Plus, 
  RotateCcw,
  Sparkle,
  Target,
  Coins,
  Scale,
  ShieldAlert,
  FastForward,
  Radio,
  HeartPulse,
  Heart,
  HeartPlus,
  ToolCase,
  Banknote,
  HandCoins,
} from 'lucide-react';
import { GameState, CardDef, LabResearchDef, MilestoneDef, MissionDef } from '../types';
import { useGameStore } from '../store/gameStore';
import { 
  WORKSHOP_CONFIG, 
  calculateWorkshopCost,
  CARDS_CONFIG, 
  LAB_RESEARCH_CONFIG,
  calculateDeathCashReserve,
  getCardRequiredExp,
  getTierDifficultyMultiplier,
  getTierCashMultiplier,
  isTierUnlocked,
  getMaxUnlockedTier,
  getTierUnlockRequirement,
  CARD_PACK_GEM_COST,
  CARD_SLOT_GEM_COSTS
} from '../game/constants';
import { soundEngine } from '../game/sound';
import { EncyclopediaModal } from './EncyclopediaModal';
import { CardGachaModal } from './CardGachaModal';
import { MissionsMilestonesModal } from './MissionsMilestonesModal';
import { MilestonesPanel } from './MilestonesPanel';
import { MilestonesModal } from './MilestonesModal';
import { CardIcon, getRarityColor, getEquippedCardStyle } from './Icons';
import { LabPanel } from './LabPanel';
import { WorkshopPanel } from './WorkshopPanel';
import { PlayerPentagonIcon } from './icons/PlayerPentagonIcon';

const TIER_NAMES = [
  'Orbital Station', 'Asteroid Belt', 'Deep Nebula', 'Void Rift', 
  'Celestial Core', 'Quantum Horizon', 'Plasma Core', 'Supernova Zenith',
  'Dark Matter Sea', 'Event Horizon', 'Hyperdimension', 'Omega Singularity'
];

interface Props {
  gameState: GameState;
  onRespawn: () => void;
  onBuyWorkshopUpgrade: (id: string, amount?: number) => void;
  onDrawCardPack: () => any;
  onToggleEquipCard: (id: string) => void;
  onLevelUpCard?: (id: string) => boolean;
  onUnlockCardSlot: () => void;
  onStartLabResearch: (slotIndex: number, researchId: string) => void;
  onRushLabResearch: (slotIndex: number) => void;
  onCollectLab: (slotIndex: number) => void;
  onBuyLabAttribute?: (researchId: string, currency: 'shards' | 'gems' | 'cells') => boolean;
  onConvertCurrencyToCells?: (fromCurrency: 'shards' | 'gems', amount: number) => boolean;
  onUnlockLabSlot?: () => boolean;
  onOpenCompendium?: () => void;
  onClaimMission: (id: string) => void;
  onClaimAllMissions?: () => void;
  onClaimMilestone: (tier: number, wave: number) => void;
  onClaimAllMilestones?: (tier?: number) => void;
  onOpenSettings?: () => void;
  onSetTier?: (tier: number) => void;
  onOpenTechTree?: () => void;
}

export const DeathSummary: React.FC<Props> = ({
  gameState,
  onRespawn,
  onBuyWorkshopUpgrade,
  onDrawCardPack,
  onToggleEquipCard,
  onLevelUpCard,
  onUnlockCardSlot,
  onStartLabResearch,
  onRushLabResearch,
  onCollectLab,
  onBuyLabAttribute,
  onConvertCurrencyToCells,
  onUnlockLabSlot,
  onOpenCompendium,
  onClaimMission,
  onClaimAllMissions,
  onClaimMilestone,
  onClaimAllMilestones,
  onOpenSettings,
  onSetTier,
  onOpenTechTree,
}) => {
  const [activeTab, setActiveTab] = useState<'battle' | 'workshop' | 'cards' | 'milestones' | 'lab' | 'missions'>('battle');
  const [workshopCategory, setWorkshopCategory] = useState<'Attack' | 'Defense' | 'Utility' | 'Ultimate Weapons'>('Attack');
  const [cardCategory, setCardCategory] = useState<'All' | 'Attack' | 'Defense' | 'Utility'>('All');
  const [cardRarityFilter, setCardRarityFilter] = useState<'All' | 'common' | 'uncommon' | 'rare' | 'epic'>('All');
  const [cardSearch, setCardSearch] = useState('');
  const [cardSort, setCardSort] = useState<'rarity' | 'level' | 'name' | 'unlocked'>('rarity');
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isMilestonesOpen, setIsMilestonesOpen] = useState(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState(false);

  const isLabUnlocked = Boolean(gameState.unlockedSystems?.labs) || (gameState.highestWaveEver || 0) >= 30;
  const isCardsUnlocked = Boolean(gameState.unlockedSystems?.cards) || (gameState.highestWaveEver || 0) >= 15;
  const isMissionsUnlocked = Boolean(gameState.unlockedSystems?.missions) || (gameState.highestWaveEver || 0) >= 30;
  const [showLabUnlockPopup, setShowLabUnlockPopup] = useState(false);

  const drawMultipleCardPacks = useGameStore(state => state.drawMultipleCardPacks);
  const levelUpAllCards = useGameStore(state => state.levelUpAllCards);
  const updateSettings = useGameStore(state => state.updateSettings);

  const upgradableCount = Object.keys(gameState.cards || {}).reduce((acc, cardId) => {
    const card = gameState.cards[cardId];
    if (!card) return acc;
    const reqExp = getCardRequiredExp(card.level);
    return card.duplicates >= reqExp ? acc + 1 : acc;
  }, 0);

  const [gachaResult, setGachaResult] = useState<{
    isOpen: boolean;
    cardDef: CardDef | null;
    level: number;
    duplicates: number;
    reqDupes: number;
    pulledCards?: { cardDef: CardDef; level: number; duplicates: number; reqDupes: number }[];
  }>({
    isOpen: false,
    cardDef: null,
    level: 1,
    duplicates: 0,
    reqDupes: 2,
    pulledCards: undefined,
  });

  const handleDrawPack = () => {
    const res = onDrawCardPack();
    if (res && res.cardDef) {
      setGachaResult({
        isOpen: true,
        cardDef: res.cardDef,
        level: res.level,
        duplicates: res.duplicates,
        reqDupes: res.reqDupes,
        pulledCards: undefined,
      });
    }
  };

  const handleDrawMultiplePacks = (count: number) => {
    const results = drawMultipleCardPacks(count);
    if (results && results.length > 0) {
      // Find the highest rarity card drawn to showcase in the scroll reel
      const sorted = [...results].sort((a, b) => {
        const rarities = { epic: 4, rare: 3, uncommon: 2, common: 1 };
        return (rarities[b.cardDef.rarity as keyof typeof rarities] || 0) - (rarities[a.cardDef.rarity as keyof typeof rarities] || 0);
      });
      const bestCard = sorted[0];

      setGachaResult({
        isOpen: true,
        cardDef: bestCard.cardDef,
        level: bestCard.level,
        duplicates: bestCard.duplicates,
        reqDupes: bestCard.reqDupes,
        pulledCards: results,
      });
    }
  };
  
  React.useEffect(() => {
    if (isLabUnlocked && !localStorage.getItem('pixel_lab_unlocked')) {
      localStorage.setItem('pixel_lab_unlocked', 'true');
      setShowLabUnlockPopup(true);
      setTimeout(() => setShowLabUnlockPopup(false), 5000);
    }
  }, [isLabUnlocked]);

  if (!gameState.isDead) return null;

  const currentTier = gameState.tier || 1;
  const currentTierName = TIER_NAMES[currentTier - 1] || `Sector Tier ${currentTier}`;
  const bestTierRecord = gameState.stats?.highestWavePerTier?.[currentTier] || 0;
  const filteredWorkshop = WORKSHOP_CONFIG.filter(u => u.category === workshopCategory);

  const isLoansharkEquipped = gameState.equippedCardIds?.includes('card_loanshark');
  const loansharkCardObj = isLoansharkEquipped ? gameState.cards?.['card_loanshark'] : null;
  const loansharkMult = isLoansharkEquipped ? (1.25 + ((loansharkCardObj?.level || 1) - 1) * 0.15) : 1.0;
  const workshopStartingCashLevel = gameState.workshopUpgrades?.['perm_starting_cash'] || 0;
  const labDeathReserveLevel = gameState.labResearchLevels?.['lab_death_reserve'] || 0;

  const isFirstDeath = (gameState.ascensionCount || 0) <= 1;
  const currentReserve = gameState.deathSummary?.reservedCashGained ?? calculateDeathCashReserve(
    gameState.deathSummary?.waveReached || (gameState.stats?.highestWavePerTier?.[currentTier] || 1),
    workshopStartingCashLevel,
    labDeathReserveLevel,
    loansharkMult,
    isFirstDeath,
    gameState.deathSummary?.waveReached || 1
  );

  const readyMissions = isMissionsUnlocked
    ? (gameState.missions?.filter(m => m.current >= m.target && !m.isClaimed).length || 0)
    : 0;
  const readyMilestones = gameState.milestones?.filter(m => {
    if (m.tier !== currentTier || m.isClaimed) return false;
    const tierBest = Math.max(
      gameState.stats?.highestWavePerTier?.[m.tier] || 0,
      m.tier === 1 ? (gameState.highestWaveEver || 0) : 0
    );
    return tierBest >= m.wave;
  }).length || 0;

  const metaUnlockKey = `unlock_meta_${workshopCategory.toLowerCase().replace(/\s+/g, '')}`;
  const currentMetaUnlockLevel = gameState.workshopUpgrades?.[metaUnlockKey] || 0;
  const visibleWorkshopUpgrades = filteredWorkshop.filter(u => (u.unlockTier || 0) <= currentMetaUnlockLevel);
  const hasMoreMetaTiers = filteredWorkshop.some(u => (u.unlockTier || 0) > currentMetaUnlockLevel);
  const nextMetaUnlockCost = currentMetaUnlockLevel === 0 ? 50 : currentMetaUnlockLevel === 1 ? 250 : 1000;

  const currentTierUnlocked = isTierUnlocked(currentTier, gameState.stats?.highestWavePerTier, gameState.highestWaveEver);
  const maxUnlockedTier = getMaxUnlockedTier(gameState.stats?.highestWavePerTier, gameState.highestWaveEver);

  const affordableWorkshopCount = WORKSHOP_CONFIG.filter(u => {
    const lvl = gameState.workshopUpgrades?.[u.id] || 0;
    const cost = calculateWorkshopCost(u, lvl);
    return gameState.cosmicShards >= cost;
  }).length;

  const quickMetaConfigs = [
    WORKSHOP_CONFIG.find(w => w.id === 'perm_base_damage'),
    WORKSHOP_CONFIG.find(w => w.id === 'perm_base_hp'),
    WORKSHOP_CONFIG.find(w => w.id === 'perm_hp_regen'),
    WORKSHOP_CONFIG.find(w => w.id === 'perm_starting_cash'),
  ].filter(Boolean) as typeof WORKSHOP_CONFIG;

  const handleStartBattle = () => {
    if (!currentTierUnlocked) {
      soundEngine.playTabSwitch();
      if (onSetTier) onSetTier(maxUnlockedTier);
      return;
    }
    soundEngine.playPrestige();
    onRespawn();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0b071a] text-white select-none overflow-hidden font-sans">
      {/* 1. TOP HEADER CURRENCY STRIP */}
      <header className="px-4 py-2.5 bg-black/60 border-b border-purple-900/30 flex items-center justify-between z-20 backdrop-blur-md">
        <div className="flex items-center gap-2">
          {/* Cosmic Shards */}
          <div className="flex items-center gap-1.5 bg-purple-950/70 border border-purple-500/40 px-2.5 py-1 rounded-xl shadow-[0_0_10px_rgba(168,85,247,0.2)]">
            <span className="text-purple-400 font-mono text-xs font-black">✦</span>
            <span className="font-mono text-xs font-black text-white">
              {gameState.cosmicShards.toLocaleString()}
            </span>
          </div>

          {/* Premium Gems */}
          <div className="flex items-center gap-1.5 bg-sky-950/70 border border-sky-500/40 px-2.5 py-1 rounded-xl">
            <span className="text-sky-400 text-xs">💎</span>
            <span className="font-mono text-xs font-black text-sky-200">
              {gameState.gems.toLocaleString()}
            </span>
          </div>

          {/* Research Cells */}
          {gameState.cells > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-950/70 border border-amber-500/40 px-2.5 py-1 rounded-xl">
              <span className="text-amber-400 text-xs">🧪</span>
              <span className="font-mono text-xs font-black text-amber-200">
                {gameState.cells.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Quick Nav: Codex & Settings */}
        <div className="flex items-center gap-1.5">
          {onOpenTechTree && (
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                onOpenTechTree();
              }}
              title="Open Permanent Skill Tree"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/50 text-purple-200 text-xs font-mono font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.25)]"
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">SKILL TREE</span>
            </button>
          )}
          <button
            onClick={() => {
              soundEngine.playTabSwitch();
              setIsCodexOpen(true);
            }}
            title="Open Cosmic Codex"
            className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-purple-500/30 text-purple-300 transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
          </button>
          {onOpenCompendium && (
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                onOpenCompendium();
              }}
              title="Tactical Skills Matrix Forge"
              className="p-1.5 rounded-lg bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 text-amber-300 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          {onOpenSettings && (
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                onOpenSettings();
              }}
              title="Settings"
              className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 transition-all cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </header>

      {/* 2. SUBHEADER TAB TITLE */}
      <div className="py-2 bg-gradient-to-r from-purple-950/20 via-purple-900/40 to-purple-950/20 border-b border-purple-500/10 text-center">
        <h1 className="text-xs font-black tracking-widest text-purple-200 uppercase font-mono">
          {activeTab === 'battle' && 'TOWER HUB & BATTLE'}
          {activeTab === 'workshop' && 'WORKSHOP META-LAB'}
          {activeTab === 'cards' && (isCardsUnlocked ? 'CARDS ARSENAL' : '? • LOCKED')}
          {activeTab === 'milestones' && 'TIER MILESTONES'}
          {activeTab === 'lab' && (isLabUnlocked ? 'RESEARCH LABS' : '? • LOCKED')}
          {activeTab === 'missions' && (isMissionsUnlocked ? 'DAILY MISSIONS' : 'MISSIONS • LOCKED')}
        </h1>
      </div>

      
      {/* Lab Unlock Popup */}
      <AnimatePresence>
        {showLabUnlockPopup && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-20 right-4 bg-emerald-900/90 border border-emerald-500/50 p-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 max-w-[200px]"
          >
            <FlaskConical className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-white font-bold text-xs font-mono">Achievement!</h4>
              <p className="text-emerald-200 text-[10px]">Congrats! Check out the lab now.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. MAIN TAB CONTENT AREA */}
      <main className="flex-1 overflow-y-auto relative pb-20">
        {/* ======================================================== */}
        {/* TAB 1: BATTLE HUB - REDESIGNED & SIMPLIFIED */}
        {/* ======================================================== */}
        {activeTab === 'battle' && (
          <div className="flex flex-col items-center w-full px-3.5 py-3 max-w-lg mx-auto space-y-3 font-mono">
            {/* 1. Sleek Sector Status & Quick Actions Bar */}
            <div className="w-full bg-zinc-950/85 border border-white/10 rounded-2xl p-2.5 sm:p-3 flex flex-col xs:flex-row xs:items-center justify-between gap-2 shadow-sm">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${currentTierUnlocked ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500'}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] sm:text-xs font-black text-white tracking-wider uppercase leading-tight">
                      TIER {currentTier} • {currentTierName}
                    </span>
                  </div>
                  <div className="text-[9px] sm:text-[9.5px] text-zinc-400 flex items-center gap-1.5 flex-wrap mt-0.5 leading-tight">
                    <span>Best: <strong className="text-emerald-300">Wave {bestTierRecord}</strong></span>
                    <span>•</span>
                    <span>Diff: <strong className="text-purple-300">{getTierDifficultyMultiplier(currentTier)}x</strong></span>
                    <span>•</span>
                    <span>Cash: <strong className="text-emerald-300">+{((getTierCashMultiplier(currentTier) - 1) * 100).toFixed(0)}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Quick Jump Action Pills */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTabSwitch();
                    setIsMissionsOpen(true);
                  }}
                  title="Daily Missions & Contracts"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-950/60 hover:bg-sky-900/60 border border-sky-500/40 text-sky-300 text-[10px] font-bold transition-all cursor-pointer active:scale-95"
                >
                  <ListChecks className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Missions</span>
                  {readyMissions > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-black text-[8px] font-black animate-pulse">
                      {readyMissions}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTabSwitch();
                    setIsMilestonesOpen(true);
                  }}
                  title="Sector Milestones"
                  className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-950/60 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 text-[10px] font-bold transition-all cursor-pointer active:scale-95"
                >
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Milestones</span>
                  {readyMilestones > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-black text-[8px] font-black animate-pulse">
                      {readyMilestones}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 2. Hero Stage: Living Player Character with Expressive Eyes & Stats */}
            <div className="w-full bg-gradient-to-b from-zinc-950/95 via-purple-950/20 to-zinc-950/95 border border-purple-500/30 rounded-3xl p-4 shadow-[0_0_30px_rgba(168,85,247,0.1)] relative overflow-hidden flex flex-col items-center">
              {/* Subtle Sci-Fi Grid Backdrop */}
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1338_1px,transparent_1px),linear-gradient(to_bottom,#1f1338_1px,transparent_1px)] bg-[size:1.25rem_1.25rem] opacity-35 pointer-events-none" />

              {/* Central Character Stage */}
              <div className="relative flex items-center justify-center w-36 h-36 my-1">
                {/* Ambient Soft Emerald/Purple Core Glow */}
                <div className="absolute inset-2 rounded-full bg-emerald-500/15 blur-2xl animate-pulse pointer-events-none" />
                
                {/* Outer Rotating Tactical Gyro Ring */}
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
                  className="absolute inset-0 rounded-full border border-dashed border-emerald-500/25 pointer-events-none"
                />

                {/* Inner Counter-Rotating Orbit Track */}
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
                  className="absolute inset-3 rounded-full border border-purple-500/20 pointer-events-none"
                />

                {/* In-Game Player Pentagon with Eyes */}
                <motion.div
                  animate={{ y: [0, -3.5, 0] }}
                  transition={{ repeat: Infinity, duration: 3.2, ease: 'easeInOut' }}
                  className="relative z-10 cursor-pointer"
                  title="Your Tower: Emerald Pentagon"
                >
                  <PlayerPentagonIcon size={112} animateEyes={true} interactive={true} />
                </motion.div>
              </div>

              {/* Core Name & Identity */}
              <div className="text-center z-10 mt-1">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-mono text-xs font-black tracking-widest text-emerald-300 uppercase">
                    EMERALD SENTINEL CORE
                  </span>
                  <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-[9.5px] text-zinc-400 mt-0.5">
                  Interactive Defense Fortress • Tactical Targeting Ready
                </p>
              </div>

              {/* Core Combat Stat Pills Grid */}
              <div className="w-full grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-white/10 z-10">
                <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-1.5 text-center shadow-inner">
                  <div className="flex items-center justify-center gap-1 text-[8.5px] text-zinc-400 uppercase font-bold">
                    <Swords className="w-3 h-3 text-rose-400 shrink-0" />
                    <span>DMG</span>
                  </div>
                  <span className="text-xs font-black text-white mt-0.5 block">
                    +{((gameState.workshopUpgrades?.['perm_base_damage'] || 0) * 3.0).toFixed(0)}
                  </span>
                </div>

                <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-1.5 text-center shadow-inner">
                  <div className="flex items-center justify-center gap-1 text-[8.5px] text-zinc-400 uppercase font-bold">
                    <HeartPlus className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>HULL</span>
                  </div>
                  <span className="text-xs font-black text-white mt-0.5 block">
                    +{((gameState.workshopUpgrades?.['perm_base_hp'] || 0) * 20.0).toFixed(0)}
                  </span>
                </div>

                <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-1.5 text-center shadow-inner">
                  <div className="flex items-center justify-center gap-1 text-[8.5px] text-zinc-400 uppercase font-bold">
                    <HeartPulse className="w-3 h-3 text-teal-400 shrink-0" />
                    <span>REGEN</span>
                  </div>
                  <span className="text-xs font-black text-white mt-0.5 block">
                    +{((gameState.workshopUpgrades?.['perm_hp_regen'] || 0) * 0.5).toFixed(1)}/s
                  </span>
                </div>

                <div className="bg-zinc-900/80 border border-white/5 rounded-xl p-1.5 text-center shadow-inner">
                  <div className="flex items-center justify-center gap-1 text-[8.5px] text-zinc-400 uppercase font-bold">
                    <HandCoins className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>START $</span>
                  </div>
                  <span className="text-xs font-black text-white mt-0.5 block">
                    +${((gameState.workshopUpgrades?.['perm_starting_cash'] || 0) * 15.0).toFixed(0)}
                  </span>
                </div>
              </div>

              {/* Equipped Cards Strip (If Any) */}
              {gameState.equippedCardIds && gameState.equippedCardIds.length > 0 && (
                <div className="w-full flex items-center justify-center gap-1.5 mt-2.5 pt-2 border-t border-white/5 overflow-x-auto z-10 custom-scrollbar">
                  <span className="text-[9px] text-zinc-500 font-bold uppercase shrink-0">Cards:</span>
                  {gameState.equippedCardIds.map(id => {
                    const cardDef = CARDS_CONFIG.find(c => c.id === id);
                    if (!cardDef) return null;
                    const rCol = getRarityColor(cardDef.rarity);
                    return (
                      <div
                        key={id}
                        title={`${cardDef.name}: ${cardDef.description}`}
                        className={`flex items-center gap-1 px-2 py-0.5 rounded-lg ${rCol.bg} border ${rCol.border} ${rCol.text} text-[9px] font-bold shrink-0 shadow-sm transition-all hover:scale-105`}
                      >
                        <CardIcon icon={cardDef.icon} className={`w-2.5 h-2.5 ${rCol.text}`} />
                        <span className="whitespace-nowrap">{cardDef.name}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. Compact Last Run Debrief (Only when present) */}
            {gameState.deathSummary && (
              <div className="w-full bg-zinc-950/85 border border-white/10 rounded-2xl p-2.5 shadow-sm">
                <div className="flex items-center justify-between text-[10px] mb-1.5">
                  <span className="text-zinc-400 font-bold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    LAST RUN RECAP
                  </span>
                  <span className="text-emerald-400 font-black">
                    WAVE {gameState.deathSummary.waveReached}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-center text-[10px]">
                  <div className="bg-zinc-900/70 p-1.5 rounded-xl border border-white/5">
                    <span className="text-[8px] text-zinc-500 block uppercase">Slain</span>
                    <strong className="text-white">{gameState.deathSummary.enemiesDefeated}</strong>
                  </div>
                  <div className="bg-purple-950/40 p-1.5 rounded-xl border border-purple-500/30">
                    <span className="text-[8px] text-purple-300 block uppercase">Shards</span>
                    <strong className="text-purple-300 font-black">✦ {gameState.deathSummary.totalShardsEarned}</strong>
                  </div>
                  <div className="bg-emerald-950/40 p-1.5 rounded-xl border border-emerald-500/30">
                    <span className="text-[8px] text-emerald-400 block uppercase">Reserve</span>
                    <strong className="text-emerald-300 font-black">${(gameState.deathSummary.reservedCashGained ?? currentReserve).toLocaleString()}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Streamlined Quick Reinforce Shelf (Permanent Upgrades) */}
            <div className="w-full bg-zinc-950/90 border border-white/10 rounded-2xl p-3 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-[10.5px]">
                <div className="flex items-center gap-1.5">
                  <Hammer className="w-3.5 h-3.5 text-purple-400" />
                  <span className="font-black text-white uppercase tracking-wider">QUICK REINFORCE</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTabSwitch();
                    setActiveTab('workshop');
                  }}
                  className="text-[9.5px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <span>Open Workshop ({affordableWorkshopCount})</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>

              {/* 4 Compact Upgrade Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                {quickMetaConfigs.map(cfg => {
                  const currentLvl = gameState.workshopUpgrades?.[cfg.id] || 0;
                  const cost = calculateWorkshopCost(cfg, currentLvl);
                  const canAfford = gameState.cosmicShards >= cost;

                  let IconComp = Swords;
                  let iconColor = 'text-rose-400';
                  let shortName = 'BASE DAMAGE';
                  let statText = '';
                  if (cfg.id === 'perm_base_damage') {
                    IconComp = Swords;
                    iconColor = 'text-rose-400';
                    shortName = 'BASE DMG';
                    statText = `+${cfg.increment} DMG`;
                  } else if (cfg.id === 'perm_base_hp') {
                    IconComp = HeartPlus;
                    iconColor = 'text-emerald-400';
                    shortName = 'HULL HP';
                    statText = `+${cfg.increment} HP`;
                  } else if (cfg.id === 'perm_hp_regen') {
                    IconComp = HeartPulse;
                    iconColor = 'text-teal-400';
                    shortName = 'REGEN';
                    statText = `+${cfg.increment}/s`;
                  } else if (cfg.id === 'perm_starting_cash') {
                    IconComp = HandCoins;
                    iconColor = 'text-amber-400';
                    shortName = 'START $';
                    statText = `+$${cfg.increment}`;
                  }

                  return (
                    <button
                      key={cfg.id}
                      type="button"
                      disabled={!canAfford}
                      onClick={() => onBuyWorkshopUpgrade(cfg.id)}
                      className={`p-2 rounded-xl border text-left flex items-center justify-between gap-1 transition-all select-none ${
                        canAfford
                          ? 'bg-zinc-900/90 hover:bg-zinc-800 border-purple-500/40 hover:border-purple-400 cursor-pointer active:scale-95 shadow-sm'
                          : 'bg-zinc-900/40 border-white/5 opacity-55 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div className="p-1 rounded-lg bg-black/40 border border-white/5 shrink-0">
                          <IconComp className={`w-3.5 h-3.5 ${iconColor}`} strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="text-[9.5px] font-black text-white block uppercase leading-tight whitespace-nowrap">
                            {shortName}
                          </span>
                          <span className="text-[8.5px] text-zinc-400 block leading-tight whitespace-nowrap tabular-nums">
                            Lv.{currentLvl} • <strong className="text-emerald-400">{statText}</strong>
                          </span>
                        </div>
                      </div>

                      <span className={`text-[9px] font-black px-1.5 py-0.5 rounded shrink-0 border tabular-nums ${
                        canAfford
                          ? 'bg-purple-950/80 border-purple-500/50 text-purple-200'
                          : 'bg-zinc-800 border-zinc-700/40 text-zinc-500'
                      }`}>
                        ✦{cost}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Simplified Launch Command Module */}
            <div className="w-full bg-zinc-950/95 border border-purple-500/40 rounded-3xl p-3.5 space-y-2.5 shadow-xl mt-auto">
              {/* Sector Tier Selector Bar */}
              <div className={`p-2 rounded-2xl border flex items-center justify-between transition-all ${
                currentTierUnlocked ? 'bg-zinc-900/90 border-purple-500/30' : 'bg-rose-950/40 border-rose-500/50'
              }`}>
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTabSwitch();
                    const prevTier = currentTier <= 1 ? 12 : currentTier - 1;
                    if (onSetTier) onSetTier(prevTier);
                  }}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95 border border-white/10"
                  title="Previous Tier"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="text-center flex-1 min-w-0 px-2">
                  <div className="text-xs font-black text-white flex items-center justify-center gap-1.5 flex-wrap">
                    {currentTierUnlocked ? (
                      <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    )}
                    <span className="leading-tight">TIER {currentTier} • {currentTierName}</span>
                  </div>
                  <div className="text-[9px] text-zinc-400 mt-0.5 leading-tight">
                    {currentTierUnlocked ? (
                      <div className="flex items-center justify-center gap-1.5 flex-wrap">
                        <span>Diff: <strong className="text-purple-300">{getTierDifficultyMultiplier(currentTier)}x</strong></span>
                        <span>•</span>
                        <span>Cash: <strong className="text-emerald-300">+{((getTierCashMultiplier(currentTier) - 1) * 100).toFixed(0)}%</strong></span>
                        <span>•</span>
                        <span>Record: <strong className="text-amber-300">Wave {bestTierRecord}</strong></span>
                      </div>
                    ) : (
                      <span className="text-rose-300 font-bold block">
                        {getTierUnlockRequirement(currentTier)}
                      </span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playTabSwitch();
                    const nextTier = currentTier >= 12 ? 1 : currentTier + 1;
                    if (onSetTier) onSetTier(nextTier);
                  }}
                  className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer active:scale-95 border border-white/10"
                  title="Next Tier"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Guaranteed Starting Cash Reserve Bar */}
              <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[10.5px]">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-400" />
                  <span className="text-zinc-300 font-bold">Starting Cash Reserve:</span>
                </div>
                <div className="flex items-center gap-1.5 font-black text-emerald-300">
                  {isLoansharkEquipped && (
                    <span className="text-[8.5px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      x{loansharkMult.toFixed(2)}
                    </span>
                  )}
                  <span className="text-sm drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                    ${currentReserve.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Big High-Energy Launch Button */}
              <button
                type="button"
                onClick={handleStartBattle}
                className={`w-full py-3.5 rounded-2xl font-mono font-black text-base tracking-widest uppercase transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 shadow-lg relative overflow-hidden group ${
                  currentTierUnlocked
                    ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-black shadow-[0_0_25px_rgba(16,185,129,0.45)]'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-rose-500/50'
                }`}
              >
                <div className="absolute inset-0 bg-white/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                {currentTierUnlocked ? (
                  <>
                    <Swords className="w-5 h-5 text-black group-hover:rotate-12 transition-transform shrink-0" />
                    <span className="whitespace-nowrap">DEPLOY TO BATTLE</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-rose-400 shrink-0" />
                    <span className="text-[11px] leading-tight">TIER {currentTier} LOCKED • DEPLOY TIER {maxUnlockedTier}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: WORKSHOP META-LAB (Cosmic Shards) */}
        {/* ======================================================== */}
        {activeTab === 'workshop' && (
          <WorkshopPanel
            gameState={gameState}
            onBuyWorkshopUpgrade={onBuyWorkshopUpgrade}
            onOpenTechTree={onOpenTechTree}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 3: CARDS ARSENAL (REMASTERED CYBERNETIC DECK) */}
        {/* ======================================================== */}
        {activeTab === 'cards' && (
          !isCardsUnlocked ? (
            <div className="p-8 max-w-lg mx-auto flex flex-col items-center justify-center text-center space-y-6 my-6">
              <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-zinc-950/90 border-2 border-dashed border-purple-500/40 shadow-[0_0_30px_rgba(168,85,247,0.2)]">
                <span className="font-mono text-5xl font-black text-purple-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.8)]">
                  ?
                </span>
                <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-purple-950 border border-purple-500 text-purple-300">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-mono font-black text-white tracking-wider">
                  ?
                </h3>
                <p className="text-base font-mono font-bold text-purple-300 tracking-wide">
                  Unlocked at wave 15
                </p>
                <p className="text-xs font-mono text-zinc-400 max-w-xs leading-relaxed">
                  Survive and conquer Sector Wave 15 to discover the tactical Cards Arsenal, gacha booster reels, and custom loadout decks.
                </p>
              </div>

              {/* Wave Progress Bar */}
              <div className="w-full max-w-xs space-y-2 bg-zinc-950/80 p-4 rounded-2xl border border-purple-900/40 shadow-inner">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Survival Progress</span>
                  <span className="font-bold text-purple-300">
                    Wave {gameState.highestWaveEver || 1} / 15
                  </span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-3 border border-zinc-800 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round(((gameState.highestWaveEver || 1) / 15) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
          <div className="p-3 max-w-2xl mx-auto space-y-4">
            {/* Gacha Reel Booster Pack Machine */}
            <div className="relative p-4 rounded-3xl bg-gradient-to-r from-purple-950/90 via-zinc-900/95 to-sky-950/90 border border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.25)] overflow-hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-900/70 border border-purple-400/40 text-purple-300 font-mono text-[9px] font-bold uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
                  <span>Card Gacha Reel</span>
                </div>
                <h3 className="font-mono text-sm sm:text-base font-black text-white tracking-wide whitespace-nowrap">
                  CARD BOOSTER PACK
                </h3>
                <p className="text-[10.5px] font-mono text-zinc-300 leading-tight">
                  Roll the slot machine reel for rare cards & duplicates!
                </p>
              </div>

              <div className="flex flex-col xs:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <button
                  disabled={gameState.gems < CARD_PACK_GEM_COST}
                  onClick={handleDrawPack}
                  className={`px-4 py-3 rounded-2xl font-mono text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg whitespace-nowrap ${
                    gameState.gems >= CARD_PACK_GEM_COST
                      ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:from-sky-400 hover:to-blue-500 shadow-[0_0_15px_rgba(56,189,248,0.35)] hover:scale-105 active:scale-95'
                      : 'bg-zinc-800/90 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                  }`}
                >
                  <RotateCcw className="w-3.5 h-3.5 text-sky-300" />
                  <div className="flex items-center gap-1.5 font-mono font-black">
                    <span>PULL X1</span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-sky-400/30 text-sky-200">
                      <span className="text-sky-300 font-black text-[10px] leading-none">💎</span>
                      <span>{CARD_PACK_GEM_COST}</span>
                    </div>
                  </div>
                </button>

                <button
                  disabled={gameState.gems < CARD_PACK_GEM_COST * 10}
                  onClick={() => handleDrawMultiplePacks(10)}
                  className={`px-4 py-3 rounded-2xl font-mono text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg whitespace-nowrap ${
                    gameState.gems >= CARD_PACK_GEM_COST * 10
                      ? 'bg-gradient-to-r from-sky-400 via-indigo-500 to-purple-500 text-white shadow-[0_0_20px_rgba(56,189,248,0.5)] hover:scale-105 active:scale-95'
                      : 'bg-zinc-800/90 text-zinc-500 cursor-not-allowed border border-zinc-700/50'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin" />
                  <div className="flex items-center gap-1.5 font-mono font-black">
                    <span>PULL X10</span>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/40 border border-sky-400/30 text-sky-200">
                      <span className="text-sky-300 font-black text-[10px] leading-none">💎</span>
                      <span>{CARD_PACK_GEM_COST * 10}</span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Equipped Slots Grid (4 Vertical Card Frames in a Row) */}
            <div className="bg-zinc-950/95 p-3.5 rounded-3xl border border-purple-500/30 shadow-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Shield className="w-4 h-4 text-purple-400 shrink-0" />
                  <span className="text-xs font-mono font-black text-white tracking-wide whitespace-nowrap">
                    EQUIPPED CARD DOCK ({gameState.equippedCardIds.length}/{gameState.maxCardSlots})
                  </span>
                </div>

                {/* Purchase More Card Capacity Button */}
                {gameState.maxCardSlots < 8 && (() => {
                  const nextSlotCost = CARD_SLOT_GEM_COSTS[gameState.maxCardSlots - 1] || 1000;
                  const canAffordSlot = gameState.gems >= nextSlotCost;
                  return (
                    <button
                      onClick={onUnlockCardSlot}
                      disabled={!canAffordSlot}
                      className={`shrink-0 px-2.5 py-1.5 rounded-xl border font-mono text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                        canAffordSlot
                          ? 'bg-sky-950/90 border-sky-400/60 text-sky-200 hover:bg-sky-900 shadow-[0_0_12px_rgba(56,189,248,0.25)] active:scale-95'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      <Plus className="w-3 h-3 text-sky-400" />
                      <span>Buy Slot</span>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-900/60 text-sky-200 font-extrabold border border-sky-500/30">
                        <span className="text-sky-300 font-black text-[11px] leading-none">💎</span>
                        <span>{nextSlotCost}</span>
                      </div>
                    </button>
                  );
                })()}
              </div>

              {/* 4 Cards Per Row Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {Array.from({ length: gameState.maxCardSlots }).map((_, idx) => {
                  const cardId = gameState.equippedCardIds[idx];
                  const cardDef = cardId ? CARDS_CONFIG.find(c => c.id === cardId) : null;
                  const playerCard = cardId ? gameState.cards[cardId] : null;
                  const eqStyle = cardDef ? getEquippedCardStyle(cardDef.rarity) : null;

                  return (
                    <div
                      key={idx}
                      onClick={() => cardId && onToggleEquipCard(cardId)}
                      className={`min-h-[144px] rounded-2xl border-2 flex flex-col justify-between p-2.5 transition-all cursor-pointer relative overflow-hidden select-none group ${
                        cardDef && eqStyle
                          ? `${eqStyle.cardBg} ${eqStyle.borderClass} ${eqStyle.glow} ${eqStyle.ring} hover:scale-[1.03] shadow-lg`
                          : 'bg-zinc-950/70 border-dashed border-zinc-800/90 text-zinc-600 hover:border-zinc-700'
                      }`}
                    >
                      {cardDef && eqStyle ? (
                        <>
                          {/* Ambient soft glow aura */}
                          <div 
                            className="absolute -top-6 -right-6 w-24 h-24 rounded-full blur-2xl pointer-events-none opacity-50 group-hover:opacity-85 transition-opacity" 
                            style={{ backgroundColor: eqStyle.borderColor }}
                          />

                          {/* Top Header: Slot, Rarity Pill, Level */}
                          <div className="flex items-center justify-between text-[8.5px] font-mono font-bold z-10">
                            <span className={`${eqStyle.accentText} font-black drop-shadow-sm`}>SLOT #{idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-mono uppercase font-black border ${eqStyle.badge} shadow-sm`}>
                                {cardDef.rarity}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-black/50 text-amber-300 border border-amber-400/50 text-[7.5px] font-black shadow-sm">
                                Lv.{playerCard?.level || 1}
                              </span>
                            </div>
                          </div>

                          {/* Artwork container */}
                          <div className={`w-11 h-11 mx-auto my-1 rounded-xl border flex items-center justify-center shadow-md group-hover:scale-110 transition-transform relative z-10 ${eqStyle.artBg}`}>
                            <CardIcon icon={cardDef.icon} className="w-5 h-5 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]" />
                          </div>

                          {/* Card Name & Prompt */}
                          <div className="text-center space-y-0.5 px-0.5 z-10">
                            <span className={`text-[10.5px] font-mono font-black ${eqStyle.text} block leading-tight break-words drop-shadow-sm`}>
                              {cardDef.name}
                            </span>
                            <span className="text-[7.5px] font-mono text-rose-200/90 block uppercase font-bold tracking-wider group-hover:text-rose-100 transition-colors drop-shadow-sm">
                              Click to Unequip
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full gap-1.5 text-zinc-600 my-auto">
                          <Lock className="w-4 h-4 opacity-40" />
                          <span className="text-[9.5px] font-mono opacity-70">Slot #{idx + 1}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Deck Collection Grid (4 Columns of Real Collectible Cards) */}
            <div className="space-y-4">
              <div className="flex flex-col gap-3 p-3 bg-zinc-900/50 rounded-2xl border border-zinc-800/80">
                <div className="flex flex-wrap items-center justify-between gap-3 px-1 font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-zinc-200 tracking-wider">
                      DECK COLLECTION ({Object.keys(gameState.cards || {}).length}/{CARDS_CONFIG.length})
                    </span>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative flex-1 min-w-[180px] max-w-md group">
                    <BookOpen className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-500 group-focus-within:text-purple-400 transition-colors" />
                    <input 
                      type="text"
                      placeholder="Search card names..."
                      value={cardSearch}
                      onChange={(e) => setCardSearch(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 pl-8 pr-3 text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
                    />
                  </div>
                </div>

                {/* Filters Row */}
                <div className="flex flex-wrap items-center gap-4">
                  {/* Category Filter */}
                  <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-zinc-800/50">
                    {(['All', 'Attack', 'Defense', 'Utility'] as const).map(cat => (
                      <button
                        key={cat}
                        onClick={() => setCardCategory(cat)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1.5 ${
                          cardCategory === cat
                            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {cat === 'Attack' && <Swords className="w-3 h-3 text-amber-400" />}
                        {cat === 'Defense' && <Heart className="w-3 h-3 text-rose-400" />}
                        {cat === 'Utility' && <ToolCase className="w-3 h-3 text-teal-400" />}
                        <span>{cat}</span>
                      </button>
                    ))}
                  </div>

                  {/* Rarity Filter */}
                  <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-zinc-800/50">
                    {(['All', 'common', 'uncommon', 'rare', 'epic'] as const).map(rare => (
                      <button
                        key={rare}
                        onClick={() => setCardRarityFilter(rare)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all uppercase ${
                          cardRarityFilter === rare
                            ? 'bg-zinc-200 text-black shadow-lg'
                            : rare === 'All' ? 'text-zinc-500 hover:text-zinc-300' : getRarityColor(rare).text
                        }`}
                      >
                        {rare}
                      </button>
                    ))}
                  </div>

                  {/* Sort Controls */}
                  <div className="flex items-center gap-1.5 p-1 bg-black/40 rounded-xl border border-zinc-800/50">
                    {(['rarity', 'level', 'name', 'unlocked'] as const).map(sort => (
                      <button
                        key={sort}
                        onClick={() => setCardSort(sort)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all capitalize ${
                          cardSort === sort
                            ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                            : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        {sort}
                      </button>
                    ))}
                  </div>

                  {/* Action Divider for Desktop */}
                  <div className="hidden sm:block h-6 w-[1px] bg-zinc-800" />

                  {/* Level Up All Cards Button */}
                  <button
                    disabled={upgradableCount === 0}
                    onClick={() => {
                      if (levelUpAllCards) {
                        levelUpAllCards();
                      }
                    }}
                    className={`px-3 py-1.5 rounded-xl text-[10px] font-mono font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md ${
                      upgradableCount > 0
                        ? 'bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black hover:scale-105 active:scale-95 animate-pulse'
                        : 'bg-zinc-850 text-zinc-500 cursor-not-allowed border border-zinc-800/40'
                    }`}
                  >
                    <span>⚡ LEVEL UP ALL</span>
                    {upgradableCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full bg-black/80 text-amber-300 border border-amber-500/30 text-[9px] font-black leading-none">
                        {upgradableCount}
                      </span>
                    )}
                  </button>

                  {/* Auto Level Up Toggle Switch */}
                  <div className="flex items-center gap-2 px-3 py-1 bg-black/40 rounded-xl border border-zinc-800/50 font-mono text-[10px] text-zinc-300 select-none">
                    <span className="font-bold">AUTO LEVEL UP:</span>
                    <button
                      onClick={() => {
                        if (updateSettings) {
                          updateSettings({ autoLevelUpCards: !gameState.settings.autoLevelUpCards });
                        }
                      }}
                      className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        gameState.settings.autoLevelUpCards ? 'bg-purple-600' : 'bg-zinc-850'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          gameState.settings.autoLevelUpCards ? 'translate-x-3.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>

              {/* Grid in rows of 4 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[...CARDS_CONFIG]
                  .filter(def => {
                    const matchesCategory = cardCategory === 'All' || def.category === cardCategory;
                    const matchesRarity = cardRarityFilter === 'All' || def.rarity === cardRarityFilter;
                    const matchesSearch = def.name.toLowerCase().includes(cardSearch.toLowerCase());
                    return matchesCategory && matchesRarity && matchesSearch;
                  })
                  .sort((a, b) => {
                    if (cardSort === 'name') return a.name.localeCompare(b.name);
                    if (cardSort === 'rarity') {
                      const rarityMap = { common: 0, uncommon: 1, rare: 2, epic: 3 };
                      return rarityMap[b.rarity] - rarityMap[a.rarity];
                    }
                    if (cardSort === 'level') {
                      const lvlA = gameState.cards?.[a.id]?.level || 0;
                      const lvlB = gameState.cards?.[b.id]?.level || 0;
                      return lvlB - lvlA;
                    }
                    if (cardSort === 'unlocked') {
                      const unlA = gameState.cards?.[a.id] ? 1 : 0;
                      const unlB = gameState.cards?.[b.id] ? 1 : 0;
                      return unlB - unlA;
                    }
                    return 0;
                  })
                  .map(def => {
                  const playerCard = gameState.cards?.[def.id];
                  const isUnlocked = Boolean(playerCard);
                  const isEquipped = gameState.equippedCardIds.includes(def.id);
                  const level = playerCard?.level || 1;
                  const dupes = playerCard?.duplicates || 0;
                  const reqDupes = getCardRequiredExp(level);
                  const canLevelUp = dupes >= reqDupes;

                  if (!isUnlocked) {
                    return (
                      <div
                        key={def.id}
                        className="rounded-2xl border-2 border-zinc-800/80 bg-zinc-950/90 flex flex-col justify-between p-2.5 relative overflow-hidden opacity-60 min-h-[220px] font-mono select-none"
                      >
                        {/* Static Lock Noise Pattern */}
                        <div className="absolute inset-0 bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:8px_8px] opacity-10 pointer-events-none" />

                        {/* Top Header */}
                        <div className="flex items-center justify-between text-[8.5px] text-zinc-500 font-bold">
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3 text-purple-400/60" />
                            <span>LOCKED</span>
                          </span>
                          <span>#{def.id.slice(-2).toUpperCase()}</span>
                        </div>

                        {/* Center Encrypted Card Frame */}
                        <div className="w-full h-16 my-2 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex flex-col items-center justify-center text-zinc-600 gap-1">
                          <Lock className="w-5 h-5 text-zinc-500/50" />
                          <span className="text-[8px] text-zinc-500 font-mono">ENCRYPTED</span>
                        </div>

                        {/* Card Info */}
                        <div className="text-center space-y-1">
                          <span className="text-[10.5px] font-black text-zinc-400 block break-words leading-tight">
                            ??? {def.name}
                          </span>
                          <p className="text-[8.5px] text-zinc-600 leading-tight">
                            Pull Booster Pack to decrypt this card.
                          </p>
                        </div>

                        {/* Footer Status */}
                        <div className="mt-2 pt-2 border-t border-zinc-900 text-[8.5px] text-center text-zinc-600">
                          Gacha Pack Req.
                        </div>
                      </div>
                    );
                  }

                  const rCol = getRarityColor(def.rarity);
                  const eqStyle = getEquippedCardStyle(def.rarity);
                  return (
                    <div
                      key={def.id}
                      className={`rounded-2xl border-2 flex flex-col justify-between p-2.5 transition-all min-h-[225px] font-mono relative overflow-hidden select-none group shadow-lg ${
                        isEquipped
                          ? `${eqStyle.cardBg} ${eqStyle.borderClass} ${eqStyle.glow} ${eqStyle.ring} scale-[1.02]`
                          : canLevelUp
                          ? `border-amber-400/90 shadow-[0_0_20px_rgba(245,158,11,0.35)] bg-gradient-to-b ${rCol.from} via-zinc-950 ${rCol.to}`
                          : `${rCol.border} ${rCol.glow} bg-gradient-to-b ${rCol.from} via-zinc-950 ${rCol.to}`
                      }`}
                    >
                      {/* Ambient soft glow aura for equipped cards */}
                      {isEquipped && (
                        <div 
                          className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-2xl pointer-events-none opacity-45 group-hover:opacity-75 transition-opacity" 
                          style={{ backgroundColor: eqStyle.borderColor }}
                        />
                      )}

                      {/* Holographic Top Banner */}
                      <div className="flex items-center justify-between text-[8.5px] font-mono z-10">
                        <div className="flex items-center gap-1">
                          <span className={`px-1.5 py-0.5 rounded font-black tracking-wider uppercase ${
                            isEquipped
                              ? `${eqStyle.badge} ring-1 ring-white/60 text-white shadow-sm`
                              : 'bg-zinc-800 text-zinc-400'
                          }`}>
                            {isEquipped ? 'EQUIPPED' : 'CARD'}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded font-black uppercase border ${
                            isEquipped ? eqStyle.badge : rCol.badge
                          }`}>
                            {def.rarity}
                          </span>
                        </div>
                        <span className={`px-1.5 py-0.5 rounded font-black ${
                          canLevelUp
                            ? 'bg-amber-500 text-black animate-pulse'
                            : isEquipped
                            ? 'bg-black/50 text-amber-300 border border-amber-400/50 shadow-sm'
                            : `${rCol.text} ${rCol.bg} border ${rCol.border}`
                        }`}>
                          Lv. {level}
                        </span>
                      </div>

                      {/* Central Artwork Window */}
                      <div className={`w-full h-16 my-1.5 rounded-xl border flex items-center justify-center relative overflow-hidden shadow-inner group-hover:scale-105 transition-transform z-10 ${
                        isEquipped ? eqStyle.artBg : `bg-zinc-900/90 ${rCol.border}`
                      }`}>
                        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px] opacity-10 pointer-events-none" />
                        <CardIcon icon={def.icon} className={`w-7 h-7 drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] ${isEquipped ? eqStyle.accentText : rCol.text}`} />
                      </div>

                      {/* Card Name */}
                      <div className={`text-center font-black text-[11px] break-words leading-tight px-0.5 z-10 ${
                        isEquipped ? `${eqStyle.text} drop-shadow-sm` : 'text-white'
                      }`}>
                        {def.name}
                      </div>

                      {/* Description Box */}
                      <div className={`p-1.5 my-1 rounded-lg border text-[9px] leading-tight min-h-[38px] flex items-center justify-center text-center z-10 ${
                        isEquipped ? eqStyle.descBg : 'bg-zinc-950/80 border-white/5 text-zinc-300'
                      }`}>
                        {def.description}
                      </div>

                      {/* EXP Bar */}
                      <div className="space-y-0.5 mb-1.5">
                        <div className="flex items-center justify-between text-[8px] font-bold text-zinc-400">
                          <span>EXP</span>
                          <span className={canLevelUp ? 'text-amber-300 font-black' : 'text-purple-300'}>
                            {dupes}/{reqDupes}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              canLevelUp
                                ? 'bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse'
                                : 'bg-gradient-to-r from-purple-500 to-sky-400'
                            }`}
                            style={{ width: `${Math.min(100, (dupes / reqDupes) * 100)}%` }}
                          />
                        </div>
                      </div>

                      {/* Bottom Card Action Button */}
                      <div className="space-y-1">
                        {canLevelUp && onLevelUpCard && (
                          <button
                            onClick={() => onLevelUpCard(def.id)}
                            className="w-full py-1.5 rounded-xl text-[9.5px] font-black bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-black shadow-[0_0_12px_rgba(245,158,11,0.4)] cursor-pointer transition-all active:scale-95 animate-pulse flex items-center justify-center gap-1"
                          >
                            <span>⚡ LEVEL UP</span>
                          </button>
                        )}
                        <button
                          onClick={() => onToggleEquipCard(def.id)}
                          className={`w-full py-1.5 rounded-xl text-[9.5px] font-black transition-all cursor-pointer shadow-md ${
                            isEquipped
                              ? 'bg-rose-950/90 border border-rose-500/70 text-rose-200 hover:bg-rose-900 active:scale-95'
                              : 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_12px_rgba(168,85,247,0.3)] active:scale-95'
                          }`}
                        >
                          {isEquipped ? 'UNEQUIP' : 'EQUIP'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Gacha Reel Modal */}
            <CardGachaModal
              isOpen={gachaResult.isOpen}
              pulledCardDef={gachaResult.cardDef}
              pulledLevel={gachaResult.level}
              pulledDupes={gachaResult.duplicates}
              reqDupes={gachaResult.reqDupes}
              pulledCards={gachaResult.pulledCards}
              isEquipped={gachaResult.cardDef ? gameState.equippedCardIds.includes(gachaResult.cardDef.id) : false}
              onClose={() => setGachaResult(prev => ({ ...prev, isOpen: false }))}
              onEquipNow={(cardId) => onToggleEquipCard(cardId)}
            />
          </div>
          )
        )}

        {/* ======================================================== */}
        {/* TAB 4: MILESTONES */}
        {/* ======================================================== */}
        {activeTab === 'milestones' && (
          <div className="p-4 max-w-5xl mx-auto space-y-4">
            <MilestonesPanel
              gameState={gameState}
              onClaimMilestone={onClaimMilestone}
              onClaimAllMilestones={onClaimAllMilestones}
              initialTier={currentTier}
              onSetTier={onSetTier}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: RESEARCH LABS */}
        {/* ======================================================== */}
        {activeTab === 'lab' && (
          !isLabUnlocked ? (
            <div className="p-8 max-w-lg mx-auto flex flex-col items-center justify-center text-center space-y-6 my-6">
              <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-zinc-950/90 border-2 border-dashed border-teal-500/40 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                <span className="font-mono text-5xl font-black text-teal-400 drop-shadow-[0_0_15px_rgba(20,184,166,0.8)]">
                  ?
                </span>
                <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-teal-950 border border-teal-500 text-teal-300">
                  <Lock className="w-4 h-4" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-2xl font-mono font-black text-white tracking-wider">
                  ?
                </h3>
                <p className="text-base font-mono font-bold text-teal-300 tracking-wide">
                  Unlocked at wave 30
                </p>
                <p className="text-xs font-mono text-zinc-400 max-w-xs leading-relaxed">
                  Survive and conquer Sector Wave 30 to discover the Cybernetic Research Laboratory, unlock simultaneous research bars, and upgrade persistent overclock matrices.
                </p>
              </div>

              {/* Wave Progress Bar */}
              <div className="w-full max-w-xs space-y-2 bg-zinc-950/80 p-4 rounded-2xl border border-teal-900/40 shadow-inner">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-zinc-400">Sector Progress</span>
                  <span className="font-bold text-teal-300">
                    Wave {gameState.highestWaveEver || 1} / 30
                  </span>
                </div>
                <div className="w-full bg-zinc-900 rounded-full h-3 border border-zinc-800 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-teal-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round(((gameState.highestWaveEver || 1) / 30) * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 max-w-4xl mx-auto space-y-4">
              <LabPanel
                gameState={gameState}
                onStartLabResearch={onStartLabResearch}
                onRushLabResearch={onRushLabResearch}
                onCollectLab={onCollectLab}
                onBuyLabAttribute={onBuyLabAttribute || (() => false)}
                onConvertCurrencyToCells={onConvertCurrencyToCells || (() => false)}
                onUnlockLabSlot={onUnlockLabSlot || (() => false)}
              />
            </div>
          )
        )}

        {/* ======================================================== */}
        {/* TAB 6: MISSIONS */}
        {/* ======================================================== */}
        {activeTab === 'missions' && (
          <div className="p-4 max-w-5xl mx-auto space-y-5">
            {!isMissionsUnlocked ? (
              <div className="p-8 rounded-2xl bg-zinc-900/60 border border-zinc-800 text-center flex flex-col items-center justify-center space-y-4 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-zinc-800/80 border border-zinc-700 flex items-center justify-center text-zinc-400">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="font-mono text-base font-black text-white uppercase tracking-wider">
                  Daily Missions Locked
                </h3>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  Defend through <span className="text-amber-400 font-bold">Wave 30</span> in Tier 1 to unlock Daily Tactical Contracts, weekly challenges, and gem rewards.
                </p>
                <div className="w-full max-w-xs bg-zinc-950 rounded-full h-3 border border-zinc-800 overflow-hidden mt-1">
                  <div 
                    className="bg-amber-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.round(((gameState.highestWaveEver || 1) / 30) * 100))}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-zinc-400 font-extrabold block">
                  Requirement: Wave {gameState.highestWaveEver || 1} / 30
                </span>
              </div>
            ) : (
              <>
                {/* Header Banner */}
                <div className="text-center py-2 max-w-xl mx-auto">
                  <span className="text-xs font-mono font-black text-sky-400 tracking-widest uppercase">
                    // HQ STRATEGIC OPERATIONS //
                  </span>
                  <h2 className="text-2xl font-mono font-black text-white mt-1 tracking-tight">TACTICAL CONTRACTS</h2>
                  <p className="text-[11px] text-zinc-400 mt-1.5 leading-relaxed">
                    Fulfill high-priority combat missions inside tactical runs to earn premium payloads.
                  </p>
                </div>

                {/* Weekly Progress Bar */}
                <div className="bg-zinc-900/80 p-4 rounded-2xl border border-zinc-800/80 max-w-xl mx-auto shadow-inner relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />
                  <div className="flex justify-between items-center text-xs font-mono font-bold mb-2.5 z-10 relative">
                    <span className="text-zinc-300">WEEKLY CHALLENGE MILESTONE</span>
                    <span className="text-sky-400 bg-sky-950/60 px-2.5 py-0.5 rounded border border-sky-900/50 text-[10px] font-black">
                      {gameState.weeklyMissionProgress}% COMPLETE
                    </span>
                  </div>
                  <div className="w-full h-3 bg-black/80 rounded-full border border-zinc-800 overflow-hidden z-10 relative">
                    <div
                      className="h-full bg-gradient-to-r from-sky-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${gameState.weeklyMissionProgress}%` }}
                    />
                  </div>
                </div>

                {/* Missions Grid Rows of 4 */}
                <div className="space-y-3">
                  <span className="text-xs font-mono font-black text-zinc-400 tracking-wider block">
                    ACTIVE CONTRACT BOARD
                  </span>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {gameState.missions.map(m => {
                      const isReady = m.current >= m.target;
                      const progressPct = Math.min(100, Math.round((m.current / m.target) * 100));

                      return (
                        <div
                          key={m.id}
                          className={`min-h-[225px] border-2 rounded-2xl p-3.5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 hover:translate-y-[-3px] ${
                            m.isClaimed
                              ? 'bg-zinc-950/60 border-zinc-900/60 text-zinc-500 opacity-60'
                              : isReady
                              ? 'bg-gradient-to-b from-zinc-950 via-sky-950/10 to-zinc-950 border-sky-500 shadow-[0_4px_16px_rgba(14,165,233,0.15)] hover:shadow-[0_6px_22px_rgba(14,165,233,0.25)]'
                              : 'bg-gradient-to-b from-zinc-900/90 to-zinc-950/90 border-zinc-800 hover:border-zinc-700/80 hover:shadow-[0_4px_16px_rgba(255,255,255,0.02)]'
                          }`}
                        >
                          {/* Grid Background Effect inside the card */}
                          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:10px_10px] pointer-events-none" />

                          {/* Top Header Tag */}
                          <div className="flex items-center justify-between z-10">
                            <span className="text-[9px] font-mono font-extrabold bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 border border-zinc-700/30">
                              CONTRACT
                            </span>
                            {m.isClaimed ? (
                              <span className="text-[8px] font-mono font-black text-zinc-500 tracking-wider">
                                CLAIMED
                              </span>
                            ) : isReady ? (
                              <span className="text-[8px] font-mono font-black text-sky-400 tracking-wider animate-pulse flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" /> READY
                              </span>
                            ) : (
                              <span className="text-[8px] font-mono font-black text-zinc-400 tracking-wider flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-500" /> ACTIVE
                              </span>
                            )}
                          </div>

                          {/* Title & Description Panel */}
                          <div className="mt-2.5 z-10 flex-1 flex flex-col justify-start min-w-0 text-center">
                            <h4 className="font-mono text-xs font-black text-white uppercase tracking-tight break-words leading-tight">
                              {m.title}
                            </h4>
                            <p className="text-[10px] text-zinc-400 leading-relaxed mt-1 text-center min-h-[30px] px-1 break-words">
                              {m.description}
                            </p>
                          </div>

                          {/* EXP Progress Gauge */}
                          <div className="mt-2.5 z-10">
                            <div className="flex justify-between items-center text-[9px] font-mono font-extrabold text-zinc-400 mb-1">
                              <span>PROGRESS</span>
                              <span className={isReady ? "text-emerald-400" : "text-sky-300"}>
                                {m.current.toLocaleString()}/{m.target.toLocaleString()}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-black rounded-full border border-zinc-800/60 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isReady ? 'bg-emerald-400' : 'bg-sky-500'
                                }`}
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>

                          {/* Rewards Panel */}
                          <div className="mt-2.5 bg-zinc-900/90 py-1.5 px-2 rounded-xl border border-zinc-800/60 flex items-center justify-center gap-2 z-10">
                            <span className="text-[10px] font-mono text-purple-300 font-extrabold flex items-center gap-1">
                              ✦{m.rewardShards}
                            </span>
                            <span className="text-zinc-700 text-xs font-bold">•</span>
                            <span className="text-[10px] font-mono text-amber-400 font-extrabold flex items-center gap-1">
                              💎{m.rewardGems}
                            </span>
                          </div>

                          {/* Bottom Action Button */}
                          <div className="mt-3 z-10">
                            <button
                              disabled={!isReady || m.isClaimed}
                              onClick={() => onClaimMission(m.id)}
                              className={`w-full py-2 rounded-xl font-mono text-[10px] font-black transition-all cursor-pointer uppercase tracking-wider ${
                                m.isClaimed
                                  ? 'bg-zinc-900 text-zinc-600 border border-zinc-850 cursor-not-allowed'
                                  : isReady
                                  ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-md active:scale-95 border-b-2 border-emerald-700 font-extrabold'
                                  : 'bg-zinc-850/50 text-zinc-500 border border-zinc-800/40 cursor-not-allowed'
                              }`}
                            >
                              {m.isClaimed ? '✓ Claimed' : isReady ? 'Claim Reward' : 'In Progress'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* 4. BOTTOM FOOTER NAVIGATION DOCK */}
      <footer className="fixed bottom-0 left-0 right-0 h-16 bg-black/90 border-t border-purple-900/40 backdrop-blur-xl flex items-center justify-around px-2 z-30">
        <button
          onClick={() => {
            soundEngine.playTabSwitch();
            setActiveTab('battle');
          }}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition-all cursor-pointer ${
            activeTab === 'battle' ? 'text-purple-400 scale-105' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Swords className="w-5 h-5 shrink-0" />
          <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold mt-1 whitespace-nowrap">Battle</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playTabSwitch();
            setActiveTab('workshop');
          }}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition-all cursor-pointer ${
            activeTab === 'workshop' ? 'text-purple-400 scale-105' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Hammer className="w-5 h-5 shrink-0" />
          <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold mt-1 whitespace-nowrap">Workshop</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playTabSwitch();
            setActiveTab('cards');
          }}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition-all cursor-pointer ${
            activeTab === 'cards' ? 'text-purple-400 scale-105' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {isCardsUnlocked ? (
            <Layers className="w-5 h-5 shrink-0" />
          ) : (
            <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
              <span className="font-mono font-black text-base text-purple-400 leading-none">?</span>
              <Lock className="w-2.5 h-2.5 text-zinc-500 absolute -bottom-0.5 -right-1" />
            </div>
          )}
          <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold mt-1 whitespace-nowrap">
            {isCardsUnlocked ? 'Cards' : '?'}
          </span>
        </button>

        <button
          onClick={() => {
            soundEngine.playTabSwitch();
            setActiveTab('milestones');
          }}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition-all cursor-pointer ${
            activeTab === 'milestones' ? 'text-purple-400 scale-105' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Trophy className="w-5 h-5 shrink-0" />
          <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold mt-1 whitespace-nowrap">Milestones</span>
        </button>

        <button
          onClick={() => {
            soundEngine.playTabSwitch();
            setActiveTab('lab');
          }}
          title={isLabUnlocked ? "Cybernetic Research Labs" : "Locked: Reach Sector Wave 30 to Unlock"}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition-all cursor-pointer ${
            activeTab === 'lab' ? 'text-teal-400 scale-105' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {isLabUnlocked ? (
            <FlaskConical className="w-5 h-5 shrink-0" />
          ) : (
            <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
              <span className="font-mono font-black text-lg text-teal-400 drop-shadow-[0_0_8px_rgba(20,184,166,0.8)] leading-none">?</span>
              <Lock className="w-2.5 h-2.5 text-zinc-500 absolute -bottom-0.5 -right-1" />
            </div>
          )}
          <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold mt-1 whitespace-nowrap">
            {isLabUnlocked ? 'Lab' : '?'}
          </span>
        </button>

        <button
          onClick={() => {
            soundEngine.playTabSwitch();
            setActiveTab('missions');
          }}
          title={!isMissionsUnlocked ? 'Defend through Wave 30 in Tier 1 to unlock Daily Missions' : undefined}
          className={`flex flex-col items-center justify-center flex-1 min-w-0 py-1 transition-all cursor-pointer ${
            activeTab === 'missions' ? 'text-purple-400 scale-105' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          {isMissionsUnlocked ? (
            <ListChecks className="w-5 h-5 shrink-0" />
          ) : (
            <Lock className="w-5 h-5 text-zinc-500 shrink-0" />
          )}
          <span className="text-[8.5px] sm:text-[9.5px] font-mono font-bold mt-1 whitespace-nowrap">Missions</span>
        </button>
      </footer>

      {/* Encyclopedia Modal */}
      <EncyclopediaModal isOpen={isCodexOpen} onClose={() => setIsCodexOpen(false)} gameState={gameState} />

      {/* Remastered Milestones Modal */}
      <MilestonesModal
        isOpen={isMilestonesOpen}
        onClose={() => setIsMilestonesOpen(false)}
        gameState={gameState}
        onClaimMilestone={onClaimMilestone}
        onClaimAllMilestones={onClaimAllMilestones}
        initialTier={currentTier}
        onSetTier={onSetTier}
      />

      {/* Missions Modal */}
      <MissionsMilestonesModal
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
        gameState={gameState}
        onClaimMission={onClaimMission}
        onClaimAllMissions={onClaimAllMissions}
        onClaimMilestone={onClaimMilestone}
        onClaimAllMilestones={onClaimAllMilestones}
        defaultTab="missions"
      />
    </div>
  );
};
