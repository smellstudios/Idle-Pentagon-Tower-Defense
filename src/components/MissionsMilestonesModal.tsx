/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, MissionDef } from '../types';
import { 
  X, Lock, Target, Sparkles, CheckCircle2, Shield, 
  Skull, Flame, Coins, Gem, Zap, Search, LayoutGrid,
  List, Filter, Award, ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { soundEngine } from '../game/sound';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onClaimMission: (id: string) => void;
  onClaimAllMissions?: () => void;
  onClaimMilestone?: (tier: number, wave: number) => void;
  onClaimAllMilestones?: (tier?: number) => void;
  defaultTab?: 'missions' | 'milestones';
  initialTier?: number;
}

type MissionCategory = 'all' | 'ready' | 'combat' | 'survival' | 'economy' | 'defense' | 'completed';

interface CategoryConfig {
  id: MissionCategory;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ReactNode;
  badgeColor: string;
  accentColor: string;
}

export const MissionsMilestonesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  gameState,
  onClaimMission,
  onClaimAllMissions,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<MissionCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');

  const isMissionsUnlocked = Boolean(gameState.unlockedSystems?.missions || (gameState.highestWaveEver || 0) >= 30);

  // Helper to determine mission category
  const getMissionCategory = (m: MissionDef): 'combat' | 'survival' | 'economy' | 'defense' => {
    if (m.type === 'kills' || m.type === 'boss_kills') return 'combat';
    if (m.type === 'waves') return 'survival';
    if (m.type === 'cash_earned') return 'economy';
    if (m.type === 'thorns_damage') return 'defense';
    return 'combat';
  };

  const getMissionIcon = (type: string, title: string) => {
    const t = title.toLowerCase();
    if (t.includes('slay') || t.includes('kill') || t.includes('destroy') || type === 'kills') {
      return <Skull className="w-4 h-4 text-rose-400" />;
    }
    if (t.includes('boss') || t.includes('goliath') || type === 'boss_kills') {
      return <Flame className="w-4 h-4 text-amber-400" />;
    }
    if (t.includes('cash') || t.includes('earn') || type === 'cash_earned') {
      return <Coins className="w-4 h-4 text-emerald-400" />;
    }
    if (t.includes('survive') || t.includes('wave') || type === 'waves') {
      return <Shield className="w-4 h-4 text-sky-400" />;
    }
    if (t.includes('thorns') || t.includes('reflect') || type === 'thorns_damage') {
      return <Zap className="w-4 h-4 text-purple-400" />;
    }
    return <Target className="w-4 h-4 text-sky-400" />;
  };

  // Category definitions
  const categories: CategoryConfig[] = useMemo(() => [
    {
      id: 'all',
      label: 'All Contracts',
      shortLabel: 'All',
      description: 'Overview of all active and completed sector contracts.',
      icon: <Target className="w-3.5 h-3.5" />,
      badgeColor: 'bg-zinc-800 text-zinc-300',
      accentColor: 'border-white/10',
    },
    {
      id: 'ready',
      label: 'Ready to Claim',
      shortLabel: 'Ready',
      description: 'Completed operations awaiting reward extraction.',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-400" />,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      accentColor: 'border-emerald-500/40',
    },
    {
      id: 'combat',
      label: 'Combat Ops',
      shortLabel: 'Combat',
      description: 'Enemy eradication and sector boss elimination contracts.',
      icon: <Skull className="w-3.5 h-3.5 text-rose-400" />,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
      accentColor: 'border-rose-500/30',
    },
    {
      id: 'survival',
      label: 'Wave Survival',
      shortLabel: 'Survival',
      description: 'Defensive endurance and marathon wave completion goals.',
      icon: <Shield className="w-3.5 h-3.5 text-sky-400" />,
      badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
      accentColor: 'border-sky-500/30',
    },
    {
      id: 'economy',
      label: 'Economy Harvest',
      shortLabel: 'Economy',
      description: 'In-combat cash generation and currency accumulation.',
      icon: <Coins className="w-3.5 h-3.5 text-emerald-400" />,
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
      accentColor: 'border-emerald-500/30',
    },
    {
      id: 'defense',
      label: 'Hull Defense',
      shortLabel: 'Defense',
      description: 'Reactive armor, thorns damage reflection, and barrier tests.',
      icon: <Zap className="w-3.5 h-3.5 text-purple-400" />,
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
      accentColor: 'border-purple-500/30',
    },
    {
      id: 'completed',
      label: 'Completed',
      shortLabel: 'Claimed',
      description: 'Archived records of collected daily operations.',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />,
      badgeColor: 'bg-zinc-800/80 text-zinc-400',
      accentColor: 'border-zinc-800',
    },
  ], []);

  const allMissions = gameState.missions || [];

  // Categorized counts
  const categoryCounts = useMemo(() => {
    const counts: Record<MissionCategory, number> = {
      all: allMissions.length,
      ready: allMissions.filter(m => m.current >= m.target && !m.isClaimed).length,
      combat: allMissions.filter(m => getMissionCategory(m) === 'combat').length,
      survival: allMissions.filter(m => getMissionCategory(m) === 'survival').length,
      economy: allMissions.filter(m => getMissionCategory(m) === 'economy').length,
      defense: allMissions.filter(m => getMissionCategory(m) === 'defense').length,
      completed: allMissions.filter(m => m.isClaimed).length,
    };
    return counts;
  }, [allMissions]);

  // Filtered missions based on Category & Search
  const filteredMissions = useMemo(() => {
    return allMissions.filter(m => {
      // Category filter
      if (selectedCategory === 'ready') {
        if (!(m.current >= m.target && !m.isClaimed)) return false;
      } else if (selectedCategory === 'completed') {
        if (!m.isClaimed) return false;
      } else if (selectedCategory !== 'all') {
        if (getMissionCategory(m) !== selectedCategory) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = m.title.toLowerCase().includes(q);
        const matchesDesc = m.description.toLowerCase().includes(q);
        const matchesType = m.type.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesType) return false;
      }

      return true;
    });
  }, [allMissions, selectedCategory, searchQuery]);

  // Overall claimable stats
  const readyMissions = useMemo(() => {
    return allMissions.filter(m => m.current >= m.target && !m.isClaimed);
  }, [allMissions]);

  const claimableShards = readyMissions.reduce((acc, m) => acc + (m.rewardShards || 0), 0);
  const claimableGems = readyMissions.reduce((acc, m) => acc + (m.rewardGems || 0), 0);

  const handleClaimAll = () => {
    if (readyMissions.length === 0) return;
    soundEngine.playUpgradeSuccess();
    if (onClaimAllMissions) {
      onClaimAllMissions();
    } else {
      readyMissions.forEach(m => onClaimMission(m.id));
    }
  };

  const handleClaimSingle = (id: string) => {
    soundEngine.playUpgradeSuccess();
    onClaimMission(id);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-lg">
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="bg-zinc-950 border border-white/10 w-full max-w-5xl rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[94vh] sm:max-h-[90vh] overflow-hidden"
        >
          {/* Top Header Bar */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-teal-500/20 border border-sky-500/30 text-sky-300 shadow-inner flex items-center justify-center shrink-0">
                <Target className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-mono font-black text-white tracking-wider uppercase">
                    DAILY MISSIONS & CONTRACTS
                  </h2>
                  {categoryCounts.ready > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 font-mono text-[9px] font-black animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                      {categoryCounts.ready} CLAIMABLE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Categorized tactical assignments. Fulfill objectives to earn Cosmic Shards and Gems.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Claimable Balances Summary */}
              {readyMissions.length > 0 && (
                <button
                  onClick={handleClaimAll}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-mono font-black text-[10.5px] uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.35)] cursor-pointer active:scale-95 hover:brightness-110"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>CLAIM ALL (+✦{claimableShards} +💎{claimableGems})</span>
                </button>
              )}

              {/* Currency Display */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold shadow-inner">
                  <span className="text-purple-400 font-black">✦</span>
                  <span>{formatCurrency(gameState.cosmicShards, gameState.settings?.useLegacyCurrencyFormat)}</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-300 font-mono text-xs font-bold shadow-inner">
                  <Gem className="w-3.5 h-3.5 text-sky-400" />
                  <span>{formatCurrency(gameState.gems, gameState.settings?.useLegacyCurrencyFormat)}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-white/10 cursor-pointer active:scale-95"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Locked State Warning */}
          {!isMissionsUnlocked ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4 bg-zinc-950/90">
              <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-500 shadow-xl relative overflow-hidden">
                <Lock className="w-8 h-8 text-zinc-500 animate-pulse" />
              </div>
              <div>
                <h3 className="text-sm font-mono font-black text-white uppercase tracking-widest">
                  TACTICAL CONTRACTS LOCKED
                </h3>
                <p className="text-xs text-zinc-400 max-w-sm mt-2 leading-relaxed font-mono">
                  Defeat enemies and conquer past <span className="text-sky-400 font-bold">Wave 30</span> in Tier 1 to unlock daily missions, categorized operations, and weekly challenge rewards.
                </p>
              </div>
              <div className="w-full max-w-xs bg-zinc-900/80 p-4 rounded-xl border border-white/10 text-left space-y-2">
                <div className="flex justify-between items-center text-[9px] font-mono font-bold text-zinc-400">
                  <span>CURRENT PROGRESS</span>
                  <span className="text-sky-400 font-black">{gameState.highestWaveEver || 0} / 30 WAVE</span>
                </div>
                <div className="w-full bg-zinc-950 h-2 rounded-full overflow-hidden border border-white/5">
                  <div
                    className="bg-gradient-to-r from-sky-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ((gameState.highestWaveEver || 0) / 30) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Category Filter Pills & Search Navigation Bar */}
              <div className="px-3 sm:px-4 py-2.5 bg-zinc-900/60 border-b border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar scroll-smooth">
                  {categories.map(cat => {
                    const count = categoryCounts[cat.id];
                    const isSelected = selectedCategory === cat.id;
                    const isReadyCategory = cat.id === 'ready';

                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          soundEngine.playTabSwitch();
                          setSelectedCategory(cat.id);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 border select-none ${
                          isSelected
                            ? isReadyCategory
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                              : 'bg-sky-500/20 text-sky-200 border-sky-400/80 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                            : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-white/5 hover:border-white/15'
                        }`}
                      >
                        <span className="shrink-0">{cat.icon}</span>
                        <span>{cat.shortLabel}</span>
                        <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-black leading-none ${
                          isSelected
                            ? isReadyCategory
                              ? 'bg-black text-emerald-300'
                              : 'bg-sky-400/30 text-sky-100'
                            : isReadyCategory && count > 0
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 animate-pulse'
                            : 'bg-zinc-800 text-zinc-500'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Utilities: Search & View Toggle */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1 sm:w-44">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter contracts..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-1 bg-zinc-950 border border-white/10 rounded-xl text-[10.5px] font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-500/60 transition-colors"
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

                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl p-0.5 shrink-0">
                    <button
                      onClick={() => setViewMode('grid')}
                      title="Grid Cards View"
                      className={`p-1 rounded-lg transition-colors ${
                        viewMode === 'grid' ? 'bg-zinc-800 text-sky-400' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setViewMode('compact')}
                      title="Compact List View"
                      className={`p-1 rounded-lg transition-colors ${
                        viewMode === 'compact' ? 'bg-zinc-800 text-sky-400' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 bg-zinc-950/80 custom-scrollbar">
                {/* Weekly Challenge Matrix Compact Banner */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-gradient-to-r from-sky-950/40 via-zinc-900/60 to-zinc-950 border border-sky-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-sm relative overflow-hidden">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-sky-500/20 border border-sky-500/30 text-sky-300 shrink-0">
                      <Award className="w-4 h-4 text-sky-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[8.5px] font-mono font-bold text-sky-400 uppercase tracking-widest">
                          TACTICAL OPS MATRIX
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500">
                          (+15% per contract)
                        </span>
                      </div>
                      <h4 className="text-xs font-mono font-black text-white uppercase">
                        Weekly Challenge Synthesis: <span className="text-sky-300">{gameState.weeklyMissionProgress || 0}%</span>
                      </h4>
                    </div>
                  </div>

                  <div className="w-full sm:w-64 space-y-1 shrink-0">
                    <div className="flex justify-between text-[8.5px] font-mono font-bold">
                      <span className="text-zinc-400">STATUS</span>
                      <span className="text-sky-300 font-bold">{gameState.weeklyMissionProgress || 0}% / 100%</span>
                    </div>
                    <div className="w-full h-2 bg-black/80 rounded-full overflow-hidden border border-white/10 p-[0.5px]">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(56,189,248,0.5)]"
                        style={{ width: `${gameState.weeklyMissionProgress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Mobile Quick Claim All Bar */}
                {readyMissions.length > 0 && (
                  <div className="flex md:hidden items-center justify-between p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl">
                    <div className="text-[10px] font-mono font-bold text-emerald-300">
                      <span>{readyMissions.length} Contracts Ready</span>
                      <div className="text-[8.5px] text-emerald-400/80">+✦ {claimableShards} Cosmic Shards | +💎 {claimableGems} Gems</div>
                    </div>
                    <button
                      onClick={handleClaimAll}
                      className="px-3 py-1.5 rounded-lg bg-emerald-400 text-black font-mono font-black text-[10px] uppercase tracking-wider active:scale-95 shadow-md flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Claim All</span>
                    </button>
                  </div>
                )}

                {/* Section Header & Subtitle */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-[10px] font-mono font-black text-zinc-300 uppercase tracking-wider">
                      {selectedCategory === 'all'
                        ? `All Contracts (${filteredMissions.length})`
                        : `${categories.find(c => c.id === selectedCategory)?.label} (${filteredMissions.length})`}
                    </span>
                    {searchQuery && (
                      <span className="text-[9px] font-mono text-zinc-500">
                        matching &quot;{searchQuery}&quot;
                      </span>
                    )}
                  </div>

                  <span className="text-[9px] font-mono text-zinc-500">
                    {filteredMissions.filter(m => m.isClaimed).length} Completed / {filteredMissions.length} Total
                  </span>
                </div>

                {/* Empty State */}
                {filteredMissions.length === 0 && (
                  <div className="py-12 px-4 text-center rounded-2xl bg-zinc-900/30 border border-white/5 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-zinc-600 mx-auto" />
                    <p className="text-xs font-mono font-black text-zinc-400 uppercase">
                      No Contracts Found
                    </p>
                    <p className="text-[10px] font-mono text-zinc-500 max-w-xs mx-auto">
                      {selectedCategory === 'ready'
                        ? 'All ready rewards have been collected! Check other categories or battle waves to make progress.'
                        : 'No active mission matches the current category or search filters.'}
                    </p>
                    {selectedCategory !== 'all' && (
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className="mt-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-sky-400 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer"
                      >
                        View All Contracts
                      </button>
                    )}
                  </div>
                )}

                {/* Grid View Mode */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
                    {filteredMissions.map(m => {
                      const isReady = m.current >= m.target;
                      const isClaimable = isReady && !m.isClaimed;
                      const percent = Math.min(100, (m.current / m.target) * 100);
                      const cat = getMissionCategory(m);

                      return (
                        <div
                          key={m.id}
                          className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 transition-all duration-200 relative select-none ${
                            m.isClaimed
                              ? 'bg-zinc-950/40 border-white/5 opacity-55'
                              : isClaimable
                              ? 'bg-gradient-to-b from-emerald-950/40 via-zinc-900/90 to-zinc-950 border-emerald-500/60 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                              : 'bg-zinc-900/70 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {/* Top Card Row */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`p-2 rounded-xl border flex items-center justify-center shrink-0 ${
                                m.isClaimed
                                  ? 'bg-zinc-900 border-white/5 text-zinc-500'
                                  : isClaimable
                                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-inner'
                                  : 'bg-zinc-900 border-white/10 text-zinc-400'
                              }`}>
                                {getMissionIcon(m.type, m.title)}
                              </div>
                              <div>
                                <span className="text-[8px] font-mono font-bold text-sky-400/90 uppercase tracking-widest block">
                                  {cat.toUpperCase()} CONTRACT
                                </span>
                                <h4 className={`text-xs font-mono font-black uppercase leading-tight ${m.isClaimed ? 'text-zinc-500' : 'text-white'}`}>
                                  {m.title}
                                </h4>
                              </div>
                            </div>

                            <div className="shrink-0">
                              {m.isClaimed ? (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-900 text-zinc-500 border border-zinc-800 text-[8px] font-mono font-bold uppercase">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-zinc-500" />
                                  Claimed
                                </span>
                              ) : isClaimable ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[8px] font-mono font-black uppercase animate-pulse">
                                  READY
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {/* Description */}
                          <p className="text-[9.5px] text-zinc-400 font-mono leading-relaxed">
                            {m.description}
                          </p>

                          {/* Progress Indicator */}
                          {!m.isClaimed && (
                            <div className="space-y-1">
                              <div className="flex justify-between items-center text-[8.5px] font-mono font-bold">
                                <span className="text-zinc-500">GOAL PROGRESS</span>
                                <span className={isReady ? 'text-emerald-400 font-black' : 'text-zinc-400'}>
                                  {formatCurrency(m.current, gameState.settings?.useLegacyCurrencyFormat)} / {formatCurrency(m.target, gameState.settings?.useLegacyCurrencyFormat)} ({Math.round(percent)}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden border border-white/10 relative p-[0.5px]">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isReady
                                      ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                                      : 'bg-gradient-to-r from-sky-500 to-cyan-400'
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Reward Payout */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-white/5 text-[9px] font-mono">
                            <span className="text-zinc-500 uppercase font-bold text-[7.5px]">PAYOUT:</span>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 font-bold text-[8.5px]">
                                +✦ {m.rewardShards}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-300 font-bold text-[8.5px]">
                                +💎 {m.rewardGems}
                              </span>
                            </div>
                          </div>

                          {/* Card Action Button */}
                          <button
                            disabled={!isClaimable}
                            onClick={() => handleClaimSingle(m.id)}
                            className={`w-full py-2 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer select-none text-center ${
                              m.isClaimed
                                ? 'bg-zinc-900/60 text-zinc-600 border border-transparent cursor-not-allowed'
                                : isClaimable
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black border border-emerald-400 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.35)] active:scale-95'
                                : 'bg-zinc-900/60 text-zinc-500 border border-white/5 cursor-not-allowed'
                            }`}
                          >
                            {m.isClaimed ? '✓ Completed' : isClaimable ? 'Claim Payout' : 'In Progress'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Compact List View Mode (Zero-Scroll Friendly) */}
                {viewMode === 'compact' && (
                  <div className="space-y-1.5">
                    {filteredMissions.map(m => {
                      const isReady = m.current >= m.target;
                      const isClaimable = isReady && !m.isClaimed;
                      const percent = Math.min(100, (m.current / m.target) * 100);
                      const cat = getMissionCategory(m);

                      return (
                        <div
                          key={m.id}
                          className={`rounded-xl border px-3 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 transition-all select-none ${
                            m.isClaimed
                              ? 'bg-zinc-950/40 border-white/5 opacity-50'
                              : isClaimable
                              ? 'bg-gradient-to-r from-emerald-950/40 via-zinc-900/90 to-zinc-950 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
                              : 'bg-zinc-900/60 border-white/10 hover:border-white/20'
                          }`}
                        >
                          {/* Left: Icon & Title */}
                          <div className="flex items-center gap-2.5 min-w-[160px] sm:min-w-[220px] max-w-sm">
                            <div className="p-1.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-400 shrink-0">
                              {getMissionIcon(m.type, m.title)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[7.5px] font-mono font-bold text-sky-400 uppercase tracking-widest shrink-0">
                                  {cat}
                                </span>
                                <h4 className={`text-[11px] font-mono font-black uppercase break-words leading-tight ${m.isClaimed ? 'text-zinc-500' : 'text-white'}`}>
                                  {m.title}
                                </h4>
                              </div>
                              <p className="text-[8.5px] text-zinc-400 font-mono leading-tight mt-0.5 break-words">
                                {m.description}
                              </p>
                            </div>
                          </div>

                          {/* Center: Inline Progress Bar */}
                          <div className="flex-1 max-w-xs space-y-1">
                            <div className="flex justify-between items-center text-[8px] font-mono">
                              <span className="text-zinc-500">Progress</span>
                              <span className={isReady ? 'text-emerald-400 font-bold' : 'text-zinc-400'}>
                                {formatCurrency(m.current, gameState.settings?.useLegacyCurrencyFormat)} / {formatCurrency(m.target, gameState.settings?.useLegacyCurrencyFormat)}
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-black/80 rounded-full overflow-hidden border border-white/10 p-[0.5px]">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  isReady ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-sky-500'
                                }`}
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>

                          {/* Right: Rewards & Action */}
                          <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0">
                            <div className="flex items-center gap-1 text-[8.5px] font-mono">
                              <span className="px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 font-bold">
                                +✦{m.rewardShards}
                              </span>
                              <span className="px-1.5 py-0.5 rounded bg-sky-950/60 border border-sky-500/30 text-sky-300 font-bold">
                                +💎{m.rewardGems}
                              </span>
                            </div>

                            <button
                              disabled={!isClaimable}
                              onClick={() => handleClaimSingle(m.id)}
                              className={`px-3 py-1.5 rounded-lg font-mono text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                                m.isClaimed
                                  ? 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                                  : isClaimable
                                  ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black shadow-md hover:brightness-110 active:scale-95'
                                  : 'bg-zinc-900 text-zinc-500 cursor-not-allowed border border-white/5'
                              }`}
                            >
                              {m.isClaimed ? 'Claimed' : isClaimable ? 'Claim' : `${Math.round(percent)}%`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
