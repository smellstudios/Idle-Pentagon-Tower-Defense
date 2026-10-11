/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { GameState, MilestoneDef } from '../types';
import { 
  Trophy, Sparkles, Gem, Lock, CheckCircle2, 
  Search, LayoutGrid, List, Filter, Key, ChevronRight, Zap
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { soundEngine } from '../game/sound';
import { getMilestoneVisual } from './icons/MilestoneIcons';
import { 
  getTierCashMultiplier, 
  getTierDifficultyMultiplier, 
  isTierUnlocked, 
  getTierUnlockRequirement 
} from '../game/constants';

interface Props {
  gameState: GameState;
  onClaimMilestone: (tier: number, wave: number) => void;
  onClaimAllMilestones?: (tier?: number) => void;
  initialTier?: number;
  onSetTier?: (tier: number) => void;
}

type MilestoneCategory = 'all' | 'ready' | 'unlocks' | 'shards' | 'gems' | 'early' | 'deep' | 'claimed';

interface MilestoneCategoryConfig {
  id: MilestoneCategory;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

export const MilestonesPanel: React.FC<Props> = ({
  gameState,
  onClaimMilestone,
  onClaimAllMilestones,
  initialTier = 1,
  onSetTier,
}) => {
  const [selectedTier, setSelectedTier] = useState<number>(initialTier || gameState.tier || 1);
  const [selectedCategory, setSelectedCategory] = useState<MilestoneCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const allMilestones: MilestoneDef[] = gameState.milestones || [];
  const highestWave = gameState.highestWaveEver || 1;

  // Tier info configurations for tiers 1-12
  const tierConfigs = useMemo(() => {
    const names = [
      'Orbital Station', 'Asteroid Belt', 'Deep Nebula', 'Void Rift', 
      'Celestial Core', 'Quantum Horizon', 'Plasma Core', 'Supernova Zenith',
      'Dark Matter Sea', 'Event Horizon', 'Hyperdimension', 'Omega Singularity'
    ];
    const descs = [
      'Baseline operations & tactical foundation',
      'Accelerated threats & fortified swarms',
      'Heavy armor titans & energy anomalies',
      'Extreme hostile compression & nightmare bosses',
      'Singularity endurance & cosmic transcendence',
      'Subatomic phase shifters & tachyon surges',
      'High-energy plasma shields & magnetic stormers',
      'Relativistic speed hostiles & pulsar blasts',
      'Gravitational collapse & dark energy matrices',
      'Spacetime distortions & hyper-dense matter',
      'Multi-dimensional apex warps & chaos entities',
      'The absolute peak of galactic combat'
    ];

    return Array.from({ length: 12 }, (_, i) => {
      const tierNum = i + 1;
      return {
        tier: tierNum,
        name: names[i] || `Sector Tier ${tierNum}`,
        cashMult: `${getTierCashMultiplier(tierNum)}x`,
        diffMult: `${getTierDifficultyMultiplier(tierNum)}x`,
        desc: descs[i] || `Advanced combat sector tier ${tierNum}`,
        isUnlocked: isTierUnlocked(tierNum, gameState.stats?.highestWavePerTier, gameState.highestWaveEver),
      };
    });
  }, [gameState.stats?.highestWavePerTier, gameState.highestWaveEver]);

  // Helper to categorize milestones
  const getMilestoneCategory = (m: MilestoneDef): ('unlocks' | 'shards' | 'gems') => {
    if (m.rewardType === 'unlock_system') return 'unlocks';
    if (m.rewardType === 'shards') return 'shards';
    return 'gems';
  };

  const categories: MilestoneCategoryConfig[] = [
    {
      id: 'all',
      label: 'All Milestones',
      shortLabel: 'All',
      icon: <Trophy className="w-3.5 h-3.5" />,
    },
    {
      id: 'ready',
      label: 'Ready to Claim',
      shortLabel: 'Ready',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'unlocks',
      label: 'System Unlocks',
      shortLabel: 'Unlocks',
      icon: <Key className="w-3.5 h-3.5 text-amber-400" />,
    },
    {
      id: 'shards',
      label: 'Cosmic Shards',
      shortLabel: '✦ Shards',
      icon: <Sparkles className="w-3.5 h-3.5 text-purple-400" />,
    },
    {
      id: 'gems',
      label: 'Gems Vault',
      shortLabel: '💎 Gems',
      icon: <Gem className="w-3.5 h-3.5 text-sky-400" />,
    },
    {
      id: 'early',
      label: 'Waves 1-50',
      shortLabel: 'W1-50',
      icon: <Zap className="w-3.5 h-3.5 text-teal-400" />,
    },
    {
      id: 'deep',
      label: 'Wave 100+ Endgame',
      shortLabel: 'W100+',
      icon: <Trophy className="w-3.5 h-3.5 text-rose-400" />,
    },
    {
      id: 'claimed',
      label: 'Claimed Archive',
      shortLabel: 'Claimed',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-zinc-500" />,
    },
  ];

  // Milestones in currently selected tier
  const tierMilestones = useMemo(() => {
    return allMilestones.filter(m => m.tier === selectedTier);
  }, [allMilestones, selectedTier]);

  // Counts per tier
  const tierStats = useMemo(() => {
    const stats: Record<number, { total: number; claimed: number; ready: number }> = {};
    for (let t = 1; t <= 12; t++) {
      const ms = allMilestones.filter(m => m.tier === t);
      const ready = ms.filter(m => highestWave >= m.wave && !m.isClaimed).length;
      const claimed = ms.filter(m => m.isClaimed).length;
      stats[t] = { total: ms.length, claimed, ready };
    }
    return stats;
  }, [allMilestones, highestWave]);

  // Category counts for selected tier
  const categoryCounts = useMemo(() => {
    const counts: Record<MilestoneCategory, number> = {
      all: tierMilestones.length,
      ready: tierMilestones.filter(m => highestWave >= m.wave && !m.isClaimed).length,
      unlocks: tierMilestones.filter(m => getMilestoneCategory(m) === 'unlocks').length,
      shards: tierMilestones.filter(m => getMilestoneCategory(m) === 'shards').length,
      gems: tierMilestones.filter(m => getMilestoneCategory(m) === 'gems').length,
      early: tierMilestones.filter(m => m.wave <= 50).length,
      deep: tierMilestones.filter(m => m.wave >= 100).length,
      claimed: tierMilestones.filter(m => m.isClaimed).length,
    };
    return counts;
  }, [tierMilestones, highestWave]);

  // Filtered milestones
  const filteredMilestones = useMemo(() => {
    return tierMilestones.filter(m => {
      const isReached = highestWave >= m.wave;

      // Category filter
      if (selectedCategory === 'ready') {
        if (!isReached || m.isClaimed) return false;
      } else if (selectedCategory === 'claimed') {
        if (!m.isClaimed) return false;
      } else if (selectedCategory === 'unlocks') {
        if (m.rewardType !== 'unlock_system') return false;
      } else if (selectedCategory === 'shards') {
        if (m.rewardType !== 'shards') return false;
      } else if (selectedCategory === 'gems') {
        if (m.rewardType !== 'gems') return false;
      } else if (selectedCategory === 'early') {
        if (m.wave > 50) return false;
      } else if (selectedCategory === 'deep') {
        if (m.wave < 100) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesLabel = m.rewardLabel.toLowerCase().includes(q);
        const matchesWave = `wave ${m.wave}`.includes(q) || `${m.wave}` === q;
        const matchesType = m.rewardType.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLabel && !matchesWave && !matchesType) return false;
      }

      return true;
    });
  }, [tierMilestones, highestWave, selectedCategory, searchQuery]);

  // Ready milestones in current tier
  const readyTierMilestones = useMemo(() => {
    return tierMilestones.filter(m => highestWave >= m.wave && !m.isClaimed);
  }, [tierMilestones, highestWave]);

  // Total ready milestones globally across all tiers
  const totalGlobalReadyCount = useMemo(() => {
    return allMilestones.filter(m => highestWave >= m.wave && !m.isClaimed).length;
  }, [allMilestones, highestWave]);

  // Pending rewards calculation for current tier
  const pendingTierRewards = useMemo(() => {
    let shards = 0;
    let gems = 0;
    readyTierMilestones.forEach(m => {
      if (m.rewardType === 'shards') shards += m.rewardAmount;
      if (m.rewardType === 'gems' || m.rewardType === 'unlock_system') gems += m.rewardAmount;
    });
    return { shards, gems };
  }, [readyTierMilestones]);

  const handleClaimSingle = (tier: number, wave: number) => {
    soundEngine.playUpgradeSuccess();
    onClaimMilestone(tier, wave);
  };

  const handleClaimAllTier = () => {
    if (readyTierMilestones.length === 0) return;
    soundEngine.playUpgradeSuccess();
    if (onClaimAllMilestones) {
      onClaimAllMilestones(selectedTier);
    } else {
      readyTierMilestones.forEach(m => onClaimMilestone(m.tier, m.wave));
    }
  };

  const currentTierData = tierConfigs.find(t => t.tier === selectedTier) || tierConfigs[0];
  const tierProgressPercent = tierMilestones.length > 0
    ? Math.round((tierMilestones.filter(m => m.isClaimed).length / tierMilestones.length) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* 1. Header & Tier Selector Bar */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-purple-950/40 via-zinc-900/80 to-zinc-950 border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 shadow-inner flex items-center justify-center shrink-0">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-mono font-black text-white uppercase tracking-wider">
                SECTOR MILESTONES
              </h3>
              {totalGlobalReadyCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[9px] font-black animate-pulse">
                  {totalGlobalReadyCount} READY
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 font-mono">
              Progress through wave thresholds to extract Cosmic Shards, Gems, and permanent system unlocks.
            </p>
          </div>
        </div>

        {/* Global / Tier Claim All Button */}
        {readyTierMilestones.length > 0 && (
          <button
            onClick={handleClaimAllTier}
            className="w-full md:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-mono font-black text-[11px] uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer active:scale-95 hover:brightness-110 flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>CLAIM TIER {selectedTier} ({readyTierMilestones.length})</span>
            {(pendingTierRewards.shards > 0 || pendingTierRewards.gems > 0) && (
              <span className="text-[9.5px] opacity-90">
                (+✦{pendingTierRewards.shards} +💎{pendingTierRewards.gems})
              </span>
            )}
          </button>
        )}
      </div>

      {/* 2. Tier Selection Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {tierConfigs.map(t => {
          const isSelected = selectedTier === t.tier;
          const stats = tierStats[t.tier] || { total: 0, claimed: 0, ready: 0 };

          return (
            <button
              key={t.tier}
              onClick={() => {
                soundEngine.playTabSwitch();
                setSelectedTier(t.tier);
                if (onSetTier && t.isUnlocked) onSetTier(t.tier);
              }}
              className={`flex-1 min-w-[145px] p-2.5 rounded-xl border font-mono text-left transition-all duration-200 cursor-pointer select-none relative ${
                isSelected
                  ? 'bg-gradient-to-b from-purple-950/70 via-zinc-900/90 to-zinc-950 border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                  : t.isUnlocked
                  ? 'bg-zinc-900/60 hover:bg-zinc-900/90 border-white/10 hover:border-white/20 text-zinc-400'
                  : 'bg-zinc-950/70 border-zinc-800/60 text-zinc-500 opacity-75'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[9.5px] font-black tracking-wider uppercase flex items-center gap-1 ${
                  isSelected ? 'text-purple-300' : t.isUnlocked ? 'text-zinc-300' : 'text-zinc-500'
                }`}>
                  {!t.isUnlocked && <Lock className="w-2.5 h-2.5 text-zinc-500" />}
                  TIER {t.tier}
                </span>
                <span className="text-[7.5px] font-bold px-1.5 py-0.2 rounded bg-black/50 text-emerald-400">
                  +${t.cashMult}
                </span>
              </div>

              <div className="mt-1 flex items-center justify-between text-[8.5px] gap-1">
                <span className="text-zinc-400 whitespace-nowrap tabular-nums">
                  {stats.claimed}/{stats.total} Claimed
                </span>
                {stats.ready > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/25 border border-emerald-400/60 text-emerald-300 text-[8px] font-black animate-pulse">
                    {stats.ready} READY
                  </span>
                )}
              </div>

              {/* Mini progress bar */}
              <div className="w-full bg-black/60 h-1 rounded-full overflow-hidden mt-1.5 border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isSelected ? 'bg-purple-400' : 'bg-zinc-600'
                  }`}
                  style={{ width: `${stats.total > 0 ? (stats.claimed / stats.total) * 100 : 0}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Category Filter Pills & Search Bar (Fixes Endless Scrolling) */}
      <div className="p-3 bg-zinc-900/60 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar scroll-smooth">
          {categories.map(cat => {
            const count = categoryCounts[cat.id];
            const isSelected = selectedCategory === cat.id;
            const isReady = cat.id === 'ready';

            return (
              <button
                key={cat.id}
                onClick={() => {
                  soundEngine.playTabSwitch();
                  setSelectedCategory(cat.id);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 border select-none ${
                  isSelected
                    ? isReady
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]'
                      : 'bg-purple-500/20 text-purple-200 border-purple-400/80 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-white/5 hover:border-white/15'
                }`}
              >
                <span className="shrink-0">{cat.icon}</span>
                <span>{cat.shortLabel}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-black leading-none ${
                  isSelected
                    ? isReady
                      ? 'bg-black text-emerald-300'
                      : 'bg-purple-400/30 text-purple-100'
                    : isReady && count > 0
                    ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 animate-pulse'
                    : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Layout View Toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter wave or unlock..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1 bg-zinc-950 border border-white/10 rounded-xl text-[10.5px] font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 text-xs"
              >
                ×
              </button>
            )}
          </div>

          <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl p-0.5 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              title="Grid Cards View"
              className={`p-1 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-zinc-800 text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              title="Compact List View"
              className={`p-1 rounded-lg transition-colors ${
                viewMode === 'compact' ? 'bg-zinc-800 text-purple-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Active Tier Progress Banner */}
      <div className="space-y-2">
        {!currentTierData.isUnlocked && (
          <div className="px-4 py-3 rounded-xl bg-rose-950/50 border border-rose-500/40 flex items-center justify-between text-xs font-mono text-rose-300">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-rose-900/60 border border-rose-500/50 text-rose-300">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-white block">TIER {selectedTier} IS LOCKED FOR BATTLE</span>
                <span className="text-[10px] text-rose-300/90">
                  {getTierUnlockRequirement(selectedTier)} • Previous Tier Record: Wave {gameState.stats?.highestWavePerTier?.[selectedTier - 1] || 0} / 100
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-1 rounded bg-rose-900/80 border border-rose-500/40 text-rose-200">
              Wave 100 Required
            </span>
          </div>
        )}

        <div className="px-4 py-2.5 rounded-xl bg-zinc-900/40 border border-white/5 flex flex-wrap items-center justify-between text-[10px] font-mono gap-2">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">BEST RECORD:</span>
            <span className="text-purple-300 font-bold">WAVE {gameState.stats?.highestWavePerTier?.[selectedTier] || 0}</span>
            <span className="text-zinc-600">|</span>
            <span className="text-emerald-400 font-bold">Cash +{((getTierCashMultiplier(selectedTier) - 1) * 100).toFixed(0)}% (x{getTierCashMultiplier(selectedTier)})</span>
            <span className="text-zinc-600">|</span>
            <span className="text-purple-400 font-bold">Diff x{getTierDifficultyMultiplier(selectedTier)}</span>
          </div>
          <div className="text-zinc-400">
            Tier Completion: <span className="text-white font-bold">{tierProgressPercent}%</span>
          </div>
        </div>
      </div>

      {/* 5. Empty State */}
      {filteredMilestones.length === 0 && (
        <div className="py-12 px-4 text-center rounded-2xl bg-zinc-900/30 border border-white/5 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs font-mono font-black text-zinc-400 uppercase">
            No Milestones Found
          </p>
          <p className="text-[10px] font-mono text-zinc-500 max-w-xs mx-auto">
            {selectedCategory === 'ready'
              ? 'No milestones awaiting claim in this category. Push deeper wave thresholds to conquer new sector records!'
              : 'No milestones match the selected category or search filter.'}
          </p>
          {selectedCategory !== 'all' && (
            <button
              onClick={() => setSelectedCategory('all')}
              className="mt-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-purple-400 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer"
            >
              View All Milestones
            </button>
          )}
        </div>
      )}

      {/* 6. Grid View Mode */}
      {viewMode === 'grid' && filteredMilestones.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredMilestones.map(m => {
            const isReached = highestWave >= m.wave;
            const isClaimable = isReached && !m.isClaimed;
            const visual = getMilestoneVisual(m);
            const IconComp = visual.icon;

            return (
              <div
                key={`${m.tier}-${m.wave}`}
                className={`border rounded-2xl p-3 flex flex-col justify-between relative overflow-hidden transition-all duration-200 select-none ${
                  m.isClaimed
                    ? 'bg-zinc-950/40 border-white/5 opacity-55 text-zinc-500'
                    : isClaimable
                    ? 'bg-gradient-to-b from-purple-950/40 via-zinc-900/90 to-zinc-950 border-purple-500/70 shadow-[0_0_18px_rgba(168,85,247,0.25)]'
                    : 'bg-zinc-900/70 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Wave Badge & Status */}
                <div className="flex items-center justify-between z-10">
                  <span className="text-[8.5px] font-mono font-extrabold bg-zinc-800 px-2 py-0.5 rounded text-zinc-300 border border-zinc-700/30">
                    WAVE {m.wave}
                  </span>
                  {m.isClaimed ? (
                    <span className="text-[8px] font-mono font-bold text-zinc-500 tracking-wider">
                      CLAIMED
                    </span>
                  ) : isClaimable ? (
                    <span className="text-[8px] font-mono font-black text-emerald-300 tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40 animate-pulse">
                      READY
                    </span>
                  ) : (
                    <span className="text-[8px] font-mono font-bold text-zinc-500 tracking-wider flex items-center gap-1">
                      <Lock className="w-2 h-2" /> LOCKED
                    </span>
                  )}
                </div>

                {/* Reward Artwork Box */}
                <div className={`h-14 my-2.5 rounded-xl border flex items-center justify-between px-3 relative overflow-hidden z-10 shrink-0 transition-all ${
                  m.isClaimed
                    ? 'bg-zinc-900/40 border-white/5 text-zinc-600'
                    : isClaimable
                    ? `${visual.bgColor} ${visual.borderColor} ${visual.glow}`
                    : 'bg-zinc-900/80 border-white/10 text-zinc-400'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg border ${
                      m.isClaimed
                        ? 'bg-zinc-900/60 border-white/5 text-zinc-600'
                        : `${visual.bgColor} ${visual.borderColor} ${visual.color}`
                    }`}>
                      <IconComp className={`w-5 h-5 ${m.isClaimed ? 'text-zinc-600' : visual.color}`} strokeWidth={2} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 font-mono shrink-0">
                    {m.rewardType === 'gems' ? (
                      <span className={`text-[11px] font-black ${m.isClaimed ? 'text-zinc-500' : 'text-sky-300'}`}>
                        +💎 {m.rewardAmount}
                      </span>
                    ) : m.rewardType === 'shards' ? (
                      <span className={`text-[11px] font-black ${m.isClaimed ? 'text-zinc-500' : 'text-purple-300'}`}>
                        +✦ {m.rewardAmount}
                      </span>
                    ) : (
                      <span className={`text-[9.5px] font-black px-1.5 py-0.5 rounded border ${
                        m.isClaimed 
                          ? 'bg-zinc-800 text-zinc-500 border-transparent' 
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}>
                        UNLOCK
                      </span>
                    )}
                  </div>
                </div>

                {/* Title & Reward Label */}
                <div className="text-center z-10 flex-1 flex flex-col justify-center min-w-0 px-0.5 space-y-1">
                  <h4 className={`font-mono text-xs font-black uppercase tracking-tight break-words leading-tight ${m.isClaimed ? 'text-zinc-500' : 'text-white'}`}>
                    {m.title}
                  </h4>
                  <p className="text-[9.5px] font-mono text-purple-300 font-bold leading-tight break-words">
                    {m.rewardLabel}
                  </p>
                </div>

                {/* Action Button */}
                <div className="mt-2.5 z-10 shrink-0">
                  <button
                    disabled={!isClaimable}
                    onClick={() => handleClaimSingle(m.tier, m.wave)}
                    className={`w-full py-2 rounded-xl font-mono text-[10px] font-black transition-all cursor-pointer uppercase tracking-wider ${
                      m.isClaimed
                        ? 'bg-zinc-900 text-zinc-600 border border-transparent cursor-not-allowed'
                        : isClaimable
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black border border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.3)] active:scale-95 font-extrabold'
                        : 'bg-zinc-850/50 text-zinc-500 border border-white/5 cursor-not-allowed'
                    }`}
                  >
                    {m.isClaimed ? '✓ Claimed' : isClaimable ? 'Claim Reward' : `Reach W${m.wave}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. Compact List View Mode (Zero-Scroll Friendly) */}
      {viewMode === 'compact' && filteredMilestones.length > 0 && (
        <div className="space-y-1.5">
          {filteredMilestones.map(m => {
            const isReached = highestWave >= m.wave;
            const isClaimable = isReached && !m.isClaimed;
            const visual = getMilestoneVisual(m);
            const IconComp = visual.icon;

            return (
              <div
                key={`${m.tier}-${m.wave}`}
                className={`rounded-xl border px-3 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 transition-all select-none ${
                  m.isClaimed
                    ? 'bg-zinc-950/40 border-white/5 opacity-50 text-zinc-500'
                    : isClaimable
                    ? 'bg-gradient-to-r from-purple-950/40 via-zinc-900/90 to-zinc-950 border-purple-500/60 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                    : 'bg-zinc-900/60 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left: Wave & Icon & Title */}
                <div className="flex items-center gap-2.5 min-w-[180px] flex-1">
                  <div className={`p-1.5 rounded-lg shrink-0 border ${
                    m.isClaimed
                      ? 'bg-zinc-900/60 border-white/5 text-zinc-600'
                      : `${visual.bgColor} ${visual.borderColor} ${visual.color}`
                  }`}>
                    <IconComp className={`w-4 h-4 ${m.isClaimed ? 'text-zinc-600' : visual.color}`} strokeWidth={2} />
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-800 border border-zinc-700/40 text-[9px] font-mono font-bold text-zinc-300 shrink-0">
                    W{m.wave}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className={`text-[11px] font-mono font-black uppercase break-words leading-tight ${m.isClaimed ? 'text-zinc-500' : 'text-white'}`}>
                      {m.title}
                    </h4>
                    <p className="text-[8.5px] text-purple-300 font-mono break-words font-bold mt-0.5">
                      {m.rewardLabel}
                    </p>
                  </div>
                </div>

                {/* Right: Reward Pill & Claim Button */}
                <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                  <div className="flex items-center gap-1 text-[8.5px] font-mono">
                    {m.rewardType === 'shards' ? (
                      <span className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 font-bold">
                        +✦ {m.rewardAmount}
                      </span>
                    ) : m.rewardType === 'gems' ? (
                      <span className="px-2 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-300 font-bold">
                        +💎 {m.rewardAmount}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-bold">
                        UNLOCK + 💎{m.rewardAmount}
                      </span>
                    )}
                  </div>

                  <button
                    disabled={!isClaimable}
                    onClick={() => handleClaimSingle(m.tier, m.wave)}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      m.isClaimed
                        ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                        : isClaimable
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md hover:brightness-110 active:scale-95'
                        : 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-white/5'
                    }`}
                  >
                    {m.isClaimed ? 'Claimed' : isClaimable ? 'Claim' : 'Locked'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
