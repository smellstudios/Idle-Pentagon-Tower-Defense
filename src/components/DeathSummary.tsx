/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Swords, 
  HeartPlus, 
  HeartPulse, 
  HandCoins, 
  ChevronLeft, 
  ChevronRight, 
  ShieldAlert, 
  RotateCcw,
  Sparkles,
  Trophy,
  Layers,
  Settings,
  BookOpen
} from 'lucide-react';
import { GameState } from '../types';
import { 
  WORKSHOP_CONFIG, 
  calculateWorkshopCost,
  calculateDeathCashReserve,
  isTierUnlocked,
  getMaxUnlockedTier
} from '../game/constants';
import { soundEngine } from '../game/sound';
import { formatCurrency } from '../utils/format';
import { EncyclopediaModal } from './EncyclopediaModal';

const TIER_NAMES = [
  'Orbital Station', 'Asteroid Belt', 'Deep Nebula', 'Void Rift', 
  'Celestial Core', 'Quantum Horizon', 'Plasma Core', 'Supernova Zenith',
  'Dark Matter Sea', 'Event Horizon', 'Hyperdimension', 'Omega Singularity'
];

interface Props {
  gameState: GameState;
  onRespawn: () => void;
  onBuyWorkshopUpgrade: (id: string, amount?: number) => void;
  onDrawCardPack?: () => any;
  onToggleEquipCard?: (id: string) => void;
  onLevelUpCard?: (id: string) => boolean;
  onUnlockCardSlot?: () => void;
  onStartLabResearch?: (slotIndex: number, researchId: string) => void;
  onRushLabResearch?: (slotIndex: number) => void;
  onCollectLab?: (slotIndex: number) => void;
  onBuyLabAttribute?: (researchId: string, currency: 'shards' | 'gems' | 'cells') => boolean;
  onConvertCurrencyToCells?: (fromCurrency: 'shards' | 'gems', amount: number) => boolean;
  onUnlockLabSlot?: () => boolean;
  onOpenCompendium?: () => void;
  onClaimMission?: (id: string) => void;
  onClaimAllMissions?: () => void;
  onClaimMilestone?: (tier: number, wave: number) => void;
  onClaimAllMilestones?: (tier?: number) => void;
  onOpenSettings?: () => void;
  onSetTier?: (tier: number) => void;
  onOpenTechTree?: () => void;
}

export const DeathSummary: React.FC<Props> = ({
  gameState,
  onRespawn,
  onBuyWorkshopUpgrade,
  onOpenSettings,
  onSetTier,
  onOpenTechTree,
}) => {
  const [isCodexOpen, setIsCodexOpen] = useState(false);

  // Keyboard shortcut: Space or Enter to immediately Deploy Again
  useEffect(() => {
    if (!gameState.isDead) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
          return;
        }
        e.preventDefault();
        soundEngine.playPrestige();
        onRespawn();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState.isDead, onRespawn]);

  if (!gameState.isDead) return null;

  const currentTier = gameState.tier || 1;
  const currentTierName = TIER_NAMES[currentTier - 1] || `Sector Tier ${currentTier}`;
  const bestTierRecord = gameState.stats?.highestWavePerTier?.[currentTier] || gameState.highestWaveThisRun || 0;
  const waveReached = gameState.deathSummary?.waveReached || gameState.wave || 1;
  const isNewRecord = waveReached >= bestTierRecord && waveReached > 1;

  const maxUnlockedTier = getMaxUnlockedTier(gameState.stats?.highestWavePerTier, gameState.highestWaveEver);
  const currentTierUnlocked = isTierUnlocked(currentTier, gameState.stats?.highestWavePerTier, gameState.highestWaveEver);

  const workshopStartingCashLevel = gameState.workshopUpgrades?.['perm_starting_cash'] || 0;
  const labDeathReserveLevel = gameState.labResearchLevels?.['lab_death_reserve'] || 0;
  const isFirstDeath = (gameState.ascensionCount || 0) <= 1;

  const currentReserve = gameState.deathSummary?.reservedCashGained ?? calculateDeathCashReserve(
    waveReached,
    workshopStartingCashLevel,
    labDeathReserveLevel,
    1.0,
    isFirstDeath,
    waveReached
  );

  const shardsEarned = gameState.deathSummary?.totalShardsEarned ?? 0;
  const enemiesSlain = gameState.deathSummary?.enemiesDefeated ?? 0;
  const gemsEarned = gameState.deathSummary?.gemsEarned ?? 0;

  // Key Quick-Upgrade Workshop cards for instant progression before redeploying
  const quickUpgradeIds = [
    { id: 'perm_base_damage', name: 'Damage', icon: Swords, color: 'text-rose-400' },
    { id: 'perm_base_hp', name: 'Hull HP', icon: HeartPlus, color: 'text-emerald-400' },
    { id: 'perm_hp_regen', name: 'Regen', icon: HeartPulse, color: 'text-teal-400' },
    { id: 'perm_starting_cash', name: 'Start $', icon: HandCoins, color: 'text-amber-400' },
  ];

  const handleTierChange = (newTier: number) => {
    if (!onSetTier) return;
    if (newTier < 1 || newTier > maxUnlockedTier) return;
    soundEngine.playTabSwitch();
    onSetTier(newTier);
  };

  const handleDeployAgain = () => {
    if (!currentTierUnlocked && onSetTier) {
      onSetTier(maxUnlockedTier);
    }
    soundEngine.playPrestige();
    onRespawn();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none overflow-y-auto font-sans">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-gradient-to-b from-zinc-950 via-[#0a0518] to-zinc-950 border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Top Header: Failure Badge & Available Shards Strip */}
        <div className="px-4 py-3 bg-zinc-900/60 border-b border-purple-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-400">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-black font-mono tracking-wider text-rose-300 uppercase">
                Defense Breached
              </h2>
              <span className="text-[10px] text-zinc-400 font-mono">
                Mission Terminated
              </span>
            </div>
          </div>

          {/* Player Shard & Gem Balance */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-950/70 border border-purple-500/40 shadow-xs">
              <span className="text-purple-400 font-mono text-xs font-black">✦</span>
              <span className="text-white font-mono text-xs font-black">
                {gameState.cosmicShards.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-xl bg-sky-950/60 border border-sky-500/30">
              <span className="text-sky-400 text-xs">💎</span>
              <span className="text-sky-200 font-mono text-xs font-bold">
                {gameState.gems.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Central Run Debrief Stage */}
        <div className="p-4 sm:p-5 flex flex-col items-center text-center space-y-4">
          {/* Sector Tier Selector Strip */}
          <div className="flex items-center justify-between w-full bg-zinc-900/40 border border-white/5 rounded-xl px-3 py-1.5">
            <button
              type="button"
              onClick={() => handleTierChange(currentTier - 1)}
              disabled={currentTier <= 1}
              className="p-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Previous Sector Tier"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <div className="flex flex-col items-center">
              <span className="text-[10px] font-mono text-purple-400 font-black uppercase tracking-wider">
                TIER {currentTier}: {currentTierName}
              </span>
              <span className="text-[9.5px] text-zinc-400 font-mono">
                Sector Record: Wave {bestTierRecord}
              </span>
            </div>

            <button
              type="button"
              onClick={() => handleTierChange(currentTier + 1)}
              disabled={currentTier >= maxUnlockedTier}
              className="p-1 rounded-lg bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-all"
              title="Next Sector Tier"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Wave Reached Hero Display */}
          <div className="relative flex flex-col items-center justify-center py-2">
            <span className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
              Final Stand
            </span>
            <div className="flex items-baseline gap-1 my-0.5">
              <span className="text-3xl sm:text-4xl font-mono font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-200 via-white to-purple-300 tracking-tight">
                WAVE {waveReached}
              </span>
            </div>

            {isNewRecord && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 text-[10px] font-mono font-black mt-1 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
              >
                <Trophy className="w-3 h-3 text-emerald-400" />
                <span>NEW SECTOR RECORD!</span>
              </motion.div>
            )}
          </div>

          {/* 4-Stat Run Harvest KPI Grid */}
          <div className="w-full grid grid-cols-2 gap-2 text-left">
            {/* Shards Earned */}
            <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 flex flex-col justify-between">
              <span className="text-[9.5px] font-mono text-purple-300/80 font-bold uppercase flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Harvested Shards
              </span>
              <span className="text-base font-mono font-black text-white mt-1">
                +{shardsEarned.toLocaleString()} <span className="text-xs text-purple-400">✦</span>
              </span>
            </div>

            {/* Cash Reserve Banked */}
            <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 flex flex-col justify-between">
              <span className="text-[9.5px] font-mono text-emerald-300/80 font-bold uppercase flex items-center gap-1">
                <HandCoins className="w-3 h-3 text-emerald-400" />
                Reserve Banked
              </span>
              <span className="text-base font-mono font-black text-white mt-1">
                +${currentReserve.toLocaleString()}
              </span>
            </div>

            {/* Enemies Slain */}
            <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col justify-between">
              <span className="text-[9.5px] font-mono text-zinc-400 font-bold uppercase flex items-center gap-1">
                <Swords className="w-3 h-3 text-rose-400" />
                Enemies Slain
              </span>
              <span className="text-base font-mono font-black text-white mt-1">
                {enemiesSlain.toLocaleString()}
              </span>
            </div>

            {/* Gems Earned */}
            <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-500/20 flex flex-col justify-between">
              <span className="text-[9.5px] font-mono text-sky-300/80 font-bold uppercase flex items-center gap-1">
                <span>💎</span>
                Gems Found
              </span>
              <span className="text-base font-mono font-black text-white mt-1">
                +{gemsEarned.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Quick Permanent Workshop Upgrades Strip (Spend harvested shards right here!) */}
          <div className="w-full pt-1">
            <div className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-400 mb-1.5 px-0.5">
              <span>QUICK UPGRADE FORTRESS</span>
              <span className="text-purple-400">✦ {gameState.cosmicShards} available</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {quickUpgradeIds.map(qu => {
                const cfg = WORKSHOP_CONFIG.find(w => w.id === qu.id);
                if (!cfg) return null;
                const currentLevel = gameState.workshopUpgrades?.[qu.id] || 0;
                const cost = calculateWorkshopCost(cfg, currentLevel);
                const canAfford = gameState.cosmicShards >= cost;
                const Icon = qu.icon;

                return (
                  <button
                    key={qu.id}
                    type="button"
                    onClick={() => {
                      if (canAfford) {
                        onBuyWorkshopUpgrade(qu.id, 1);
                        soundEngine.playUpgradeSuccess();
                      }
                    }}
                    disabled={!canAfford}
                    className={`flex flex-col items-center justify-between p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      canAfford
                        ? 'bg-purple-950/40 border-purple-500/40 hover:bg-purple-900/50 hover:border-purple-400 active:scale-95 shadow-xs'
                        : 'bg-zinc-900/60 border-white/5 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${qu.color}`} />
                    <span className="text-[9px] font-mono font-bold text-zinc-300 mt-1 truncate max-w-full">
                      {qu.name}
                    </span>
                    <span className="text-[8.5px] font-mono text-zinc-400">
                      Lv.{currentLevel}
                    </span>
                    <span className={`text-[9px] font-mono font-black mt-1 ${canAfford ? 'text-purple-300' : 'text-zinc-500'}`}>
                      ✦{cost}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Primary Action: High-Contrast DEPLOY AGAIN Button */}
          <div className="w-full pt-2">
            <button
              type="button"
              onClick={handleDeployAgain}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 text-black font-mono font-black text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(16,185,129,0.6)] active:scale-98 cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4 text-black stroke-[3]" />
              <span>DEPLOY AGAIN</span>
              <span className="text-[10px] font-normal opacity-75 hidden sm:inline">(SPACE)</span>
            </button>
          </div>

          {/* Secondary Quick Nav Bar */}
          <div className="flex items-center justify-center gap-2 pt-1 select-none">
            {onOpenTechTree && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTabSwitch();
                  onOpenTechTree();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-purple-500/30 text-purple-300 hover:text-white text-[10px] font-mono font-bold transition-all cursor-pointer"
              >
                <Layers className="w-3 h-3 text-purple-400" />
                <span>SKILL TREE</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                setIsCodexOpen(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-[10px] font-mono font-bold transition-all cursor-pointer"
            >
              <BookOpen className="w-3 h-3 text-zinc-400" />
              <span>CODEX</span>
            </button>

            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTabSwitch();
                  onOpenSettings();
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 border border-white/10 text-zinc-300 hover:text-white text-[10px] font-mono font-bold transition-all cursor-pointer"
              >
                <Settings className="w-3 h-3 text-zinc-400" />
                <span>SETTINGS</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Codex Modal (If opened) */}
      <EncyclopediaModal 
        isOpen={isCodexOpen} 
        onClose={() => setIsCodexOpen(false)} 
        gameState={gameState} 
      />
    </div>
  );
};
