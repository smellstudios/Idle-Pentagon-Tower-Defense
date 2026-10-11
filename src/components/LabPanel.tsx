/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  FlaskConical, 
  Atom, 
  Zap, 
  Shield, 
  Sparkles, 
  Cpu, 
  Layers, 
  Flame, 
  FastForward, 
  Coins, 
  Check, 
  Lock, 
  Plus, 
  ArrowRightLeft,
  Crosshair,
  ShieldAlert,
  Search,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  Radio,
  Timer,
  Rocket,
  Bomb,
  Waves,
  TrendingUp,
  Dna,
  Sword,
  Heart,
  ToolCase,
  Gem,
  AlertCircle
} from 'lucide-react';
import { GameState, LabResearchDef } from '../types';
import { LAB_RESEARCH_CONFIG, LAB_SLOT_GEM_COSTS, MAX_LAB_SLOTS } from '../game/constants';
import { soundEngine } from '../game/sound';
import { formatCurrency } from '../utils/format';

interface Props {
  gameState: GameState;
  onStartLabResearch: (slotIndex: number, researchId: string) => void;
  onRushLabResearch: (slotIndex: number) => void;
  onCollectLab: (slotIndex: number) => void;
  onBuyLabAttribute: (researchId: string, currency: 'shards' | 'gems' | 'cells') => boolean;
  onConvertCurrencyToCells: (fromCurrency: 'shards' | 'gems', amount: number) => boolean;
  onUnlockLabSlot: () => boolean;
}

type ResearchCategory = 'All' | 'Skills' | 'Attack' | 'Defense' | 'Utility';
type StatusFilter = 'all' | 'affordable' | 'running' | 'maxed';

export const LabPanel: React.FC<Props> = ({
  gameState,
  onStartLabResearch,
  onRushLabResearch,
  onCollectLab,
  onBuyLabAttribute,
  onConvertCurrencyToCells,
  onUnlockLabSlot,
}) => {
  const [activeCategory, setActiveCategory] = useState<ResearchCategory>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'compact'>('grid');
  const [exchangeMsg, setExchangeMsg] = useState<{ text: string; isError?: boolean } | null>(null);
  const [showSynthesizer, setShowSynthesizer] = useState(false);

  // Quick Synthesizer Conversion
  const handleConvert = (from: 'shards' | 'gems', amount: number) => {
    const success = onConvertCurrencyToCells(from, amount);
    if (success) {
      soundEngine.playUpgradeSuccess();
      const gained = from === 'shards' ? Math.round(amount * 2.5) : Math.round(amount * 20);
      setExchangeMsg({ text: `+${gained.toLocaleString()} Bio-Cells Synthesized!` });
      setTimeout(() => setExchangeMsg(null), 3000);
    } else {
      setExchangeMsg({ text: `Insufficient ${from === 'shards' ? 'Cosmic Shards' : 'Gems'}!`, isError: true });
      setTimeout(() => setExchangeMsg(null), 2500);
    }
  };

  // Icon Mapping
  const getProjectIcon = (def: LabResearchDef) => {
    switch (def.effectType) {
      case 'game_speed': return <FastForward className="w-4 h-4 text-emerald-400" />;
      case 'death_reserve_mult': return <Coins className="w-4 h-4 text-amber-400" />;
      case 'defense_absolute_mult': return <Shield className="w-4 h-4 text-sky-400" />;
      case 'shards_mult': return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'damage_mult': return <Atom className="w-4 h-4 text-rose-400" />;
      case 'orb_speed': return <Cpu className="w-4 h-4 text-cyan-400" />;
      case 'skill_double_shot': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'skill_piercing': return <Crosshair className="w-4 h-4 text-sky-400" />;
      case 'skill_rapid_fire': return <Flame className="w-4 h-4 text-orange-400" />;
      case 'skill_calamity': return <Sparkles className="w-4 h-4 text-violet-400" />;
      case 'skill_lightning': return <Zap className="w-4 h-4 text-yellow-400" />;
      case 'skill_poison': return <ShieldAlert className="w-4 h-4 text-emerald-400" />;
      case 'skill_synergy_slots': return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'skill_rockets': return <Rocket className="w-4 h-4 text-rose-400" />;
      case 'skill_laser_sweep': return <Waves className="w-4 h-4 text-cyan-400" />;
      case 'skill_mortar_strike': return <Bomb className="w-4 h-4 text-amber-400" />;
      default: return <FlaskConical className="w-4 h-4 text-teal-400" />;
    }
  };

  // Category Theme Colors
  const getCategoryTheme = (category: string) => {
    switch (category) {
      case 'Skills':
        return {
          badge: 'bg-teal-950/80 text-teal-300 border-teal-500/40',
          glow: 'from-teal-950/40 via-zinc-900 to-zinc-950',
          accent: 'text-teal-400',
        };
      case 'Attack':
        return {
          badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
          glow: 'from-rose-950/30 via-zinc-900 to-zinc-950',
          accent: 'text-rose-400',
        };
      case 'Defense':
        return {
          badge: 'bg-sky-950/80 text-sky-300 border-sky-500/40',
          glow: 'from-sky-950/30 via-zinc-900 to-zinc-950',
          accent: 'text-sky-400',
        };
      default:
        return {
          badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
          glow: 'from-amber-950/30 via-zinc-900 to-zinc-950',
          accent: 'text-amber-400',
        };
    }
  };

  const firstFreeSlotIndex = gameState.labSlots.findIndex(s => !s.researchId);
  const nextSlotCostGems = LAB_SLOT_GEM_COSTS[gameState.labSlots.length] || 250;
  const canUnlockMoreSlots = gameState.labSlots.length < MAX_LAB_SLOTS;
  const runningSlotsCount = gameState.labSlots.filter(s => s.researchId && !s.isCompleted).length;
  const completedSlotsCount = gameState.labSlots.filter(s => s.researchId && s.isCompleted).length;

  // Active Research IDs for fast lookup
  const activeResearchIds = useMemo(() => {
    return new Set(gameState.labSlots.filter(s => s.researchId).map(s => s.researchId as string));
  }, [gameState.labSlots]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<ResearchCategory, number> = {
      All: LAB_RESEARCH_CONFIG.length,
      Skills: LAB_RESEARCH_CONFIG.filter(p => p.category === 'Skills').length,
      Attack: LAB_RESEARCH_CONFIG.filter(p => p.category === 'Attack').length,
      Defense: LAB_RESEARCH_CONFIG.filter(p => p.category === 'Defense').length,
      Utility: LAB_RESEARCH_CONFIG.filter(p => p.category === 'Utility' || p.category === 'Main').length,
    };
    return counts;
  }, []);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    return LAB_RESEARCH_CONFIG.filter(p => {
      // Category Filter
      if (activeCategory === 'Skills' && p.category !== 'Skills') return false;
      if (activeCategory === 'Attack' && p.category !== 'Attack') return false;
      if (activeCategory === 'Defense' && p.category !== 'Defense') return false;
      if (activeCategory === 'Utility' && (p.category !== 'Utility' && p.category !== 'Main')) return false;

      const currentLevel = gameState.labResearchLevels[p.id] || 0;
      const isMax = currentLevel >= p.maxLevel;
      const isRunning = activeResearchIds.has(p.id);
      const cellCost = Math.round(p.baseCostCells * Math.pow(p.costGrowth, currentLevel));
      const shardCost = Math.round((p.baseCostShards || 30) * Math.pow(p.costShardsGrowth || 1.35, currentLevel));
      const canAfford = !isMax && (
        (gameState.cells >= cellCost && firstFreeSlotIndex !== -1) ||
        gameState.cosmicShards >= shardCost ||
        gameState.gems >= (p.instantGemsCost || 10)
      );

      // Status Filter
      if (statusFilter === 'affordable' && !canAfford) return false;
      if (statusFilter === 'running' && !isRunning) return false;
      if (statusFilter === 'maxed' && !isMax) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesDesc = p.description.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      return true;
    });
  }, [activeCategory, statusFilter, searchQuery, gameState.labResearchLevels, gameState.cells, gameState.cosmicShards, gameState.gems, firstFreeSlotIndex, activeResearchIds]);

  // Collect all completed slots
  const handleCollectAll = () => {
    gameState.labSlots.forEach((slot, idx) => {
      if (slot.researchId && slot.isCompleted) {
        onCollectLab(idx);
      }
    });
    soundEngine.playUpgradeSuccess();
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* 1. TOP BIO-REACTOR & SYNTHESIZER COMMAND HEADER */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-teal-950/60 via-zinc-900/90 to-zinc-950 border border-teal-500/30 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 relative overflow-hidden">
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-80 h-32 bg-teal-500/10 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 z-10">
          <div className="p-3 rounded-2xl bg-teal-950/90 border border-teal-500/50 text-teal-300 shadow-[0_0_20px_rgba(20,184,166,0.25)] shrink-0">
            <FlaskConical className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-mono text-sm sm:text-base font-black text-white uppercase tracking-wider">
                RESEARCH SYNTHESIS LAB
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-300 font-mono text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                <Dna className="w-3 h-3" />
                <span>CYBERNETIC MATRIX</span>
              </span>
            </div>
            <p className="text-[10.5px] text-zinc-400 font-mono mt-0.5">
              Earn Bio-Cell Fuel from defeating bosses & rare enemies in combat, or synthesize cells directly for research.
            </p>
          </div>
        </div>

        {/* Currency summary & quick exchange bar */}
        <div className="flex items-center gap-2 flex-wrap justify-end z-10 w-full md:w-auto">
          {/* Bio-Cells Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-950/70 to-zinc-900 border border-amber-500/40 text-amber-300 font-mono text-xs font-black flex items-center gap-1.5 shadow-inner">
            <span className="text-base leading-none">🧪</span>
            <span>{gameState.cells.toLocaleString()}</span>
            <span className="text-[9.5px] text-amber-400/70 uppercase">Cells</span>
          </div>

          {/* Cosmic Shards Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-950/70 to-zinc-900 border border-purple-500/40 text-purple-300 font-mono text-xs font-black flex items-center gap-1.5 shadow-inner">
            <span className="text-purple-400 font-black text-xs leading-none">✦</span>
            <span>{formatCurrency(gameState.cosmicShards, gameState.settings?.useLegacyCurrencyFormat)}</span>
          </div>

          {/* Gems Pill */}
          <div className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-950/70 to-zinc-900 border border-sky-500/40 text-sky-300 font-mono text-xs font-black flex items-center gap-1.5 shadow-inner">
            <Gem className="w-3.5 h-3.5 text-sky-400" />
            <span>{formatCurrency(gameState.gems, gameState.settings?.useLegacyCurrencyFormat)}</span>
          </div>

          {/* Synthesizer Drawer Toggle */}
          <button
            onClick={() => {
              soundEngine.playTabSwitch();
              setShowSynthesizer(!showSynthesizer);
            }}
            className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${
              showSynthesizer
                ? 'bg-teal-500 text-black border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.4)]'
                : 'bg-zinc-900 hover:bg-zinc-800 text-teal-300 border-teal-500/40 hover:border-teal-400'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{showSynthesizer ? 'Close Synthesizer' : 'Cell Synthesizer'}</span>
          </button>
        </div>
      </div>

      {/* Quick Alert Notification */}
      {exchangeMsg && (
        <div className={`p-2.5 rounded-xl font-mono text-xs font-bold text-center border shadow-md animate-fade-in flex items-center justify-center gap-2 ${
          exchangeMsg.isError
            ? 'bg-rose-950/90 border-rose-500/60 text-rose-200'
            : 'bg-teal-950/90 border-teal-500/60 text-teal-200'
        }`}>
          {exchangeMsg.isError ? <AlertCircle className="w-4 h-4 text-rose-400" /> : <CheckCircle2 className="w-4 h-4 text-teal-400" />}
          <span>{exchangeMsg.text}</span>
        </div>
      )}

      {/* 2. EXPANDABLE CELL BIO-REACTOR SYNTHESIZER */}
      {showSynthesizer && (
        <div className="p-4 rounded-2xl bg-zinc-950/90 border border-teal-500/40 shadow-xl space-y-3 animate-fade-in">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Dna className="w-4 h-4 text-teal-400" />
              <span className="font-mono text-xs font-black text-white uppercase tracking-wider">
                BIO-CELL SYNTHESIZER CONVERTER
              </span>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              Exchange meta currencies for instant Bio-Cell fuel
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {/* Shards 30 -> 75 Cells */}
            <button
              onClick={() => handleConvert('shards', 30)}
              disabled={gameState.cosmicShards < 30}
              className={`p-3 rounded-xl border font-mono text-center flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer group ${
                gameState.cosmicShards >= 30
                  ? 'bg-purple-950/60 border-purple-500/40 hover:bg-purple-900/60 hover:border-purple-400 text-purple-200 shadow-md active:scale-95'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider text-purple-300 font-bold">Standard Batch</span>
              <div className="flex items-center gap-1 text-xs font-black">
                <span className="text-purple-300">✦ 30</span>
                <ArrowRightLeft className="w-3 h-3 text-zinc-500 group-hover:text-purple-300 transition-colors" />
                <span className="text-amber-300">🧪 75</span>
              </div>
              <span className="text-[8.5px] text-zinc-400 font-mono">Convert Shards</span>
            </button>

            {/* Shards 100 -> 250 Cells */}
            <button
              onClick={() => handleConvert('shards', 100)}
              disabled={gameState.cosmicShards < 100}
              className={`p-3 rounded-xl border font-mono text-center flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer group ${
                gameState.cosmicShards >= 100
                  ? 'bg-purple-950/60 border-purple-500/40 hover:bg-purple-900/60 hover:border-purple-400 text-purple-200 shadow-md active:scale-95'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider text-purple-300 font-bold">Overclock Batch</span>
              <div className="flex items-center gap-1 text-xs font-black">
                <span className="text-purple-300">✦ 100</span>
                <ArrowRightLeft className="w-3 h-3 text-zinc-500 group-hover:text-purple-300 transition-colors" />
                <span className="text-amber-300">🧪 250</span>
              </div>
              <span className="text-[8.5px] text-zinc-400 font-mono">Convert Shards</span>
            </button>

            {/* Gems 15 -> 300 Cells */}
            <button
              onClick={() => handleConvert('gems', 15)}
              disabled={gameState.gems < 15}
              className={`p-3 rounded-xl border font-mono text-center flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer group ${
                gameState.gems >= 15
                  ? 'bg-sky-950/60 border-sky-500/40 hover:bg-sky-900/60 hover:border-sky-400 text-sky-200 shadow-md active:scale-95'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider text-sky-300 font-bold">Quantum Core</span>
              <div className="flex items-center gap-1 text-xs font-black">
                <span className="text-sky-300">💎 15</span>
                <ArrowRightLeft className="w-3 h-3 text-zinc-500 group-hover:text-sky-300 transition-colors" />
                <span className="text-amber-300">🧪 300</span>
              </div>
              <span className="text-[8.5px] text-zinc-400 font-mono">Convert Gems</span>
            </button>

            {/* Gems 50 -> 1100 Cells */}
            <button
              onClick={() => handleConvert('gems', 50)}
              disabled={gameState.gems < 50}
              className={`p-3 rounded-xl border font-mono text-center flex flex-col items-center justify-between gap-1.5 transition-all cursor-pointer group ${
                gameState.gems >= 50
                  ? 'bg-sky-950/60 border-sky-500/40 hover:bg-sky-900/60 hover:border-sky-400 text-sky-200 shadow-md active:scale-95'
                  : 'bg-zinc-900/50 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
              }`}
            >
              <span className="text-[9px] uppercase tracking-wider text-sky-300 font-bold">Titan Singularity</span>
              <div className="flex items-center gap-1 text-xs font-black">
                <span className="text-sky-300">💎 50</span>
                <ArrowRightLeft className="w-3 h-3 text-zinc-500 group-hover:text-sky-300 transition-colors" />
                <span className="text-amber-300">🧪 1,100</span>
              </div>
              <span className="text-[8.5px] text-zinc-400 font-mono">Convert Gems</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. ACTIVE RESEARCH INCUBATOR PODS / LAB BARS */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-black text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-teal-400 animate-pulse" />
              <span>LAB RESEARCH BARS ({gameState.labSlots.length}/{MAX_LAB_SLOTS})</span>
            </span>
            <span className="text-[9.5px] font-mono font-bold text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded-full border border-teal-500/40">
              {runningSlotsCount} RUNNING • {completedSlotsCount} READY
            </span>
          </div>

          <div className="flex items-center gap-2">
            {completedSlotsCount > 0 && (
              <button
                onClick={handleCollectAll}
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.35)] active:scale-95 animate-pulse flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>Collect All ({completedSlotsCount})</span>
              </button>
            )}

            {canUnlockMoreSlots && (
              <button
                onClick={() => {
                  const ok = onUnlockLabSlot();
                  if (ok) soundEngine.playUpgradeSuccess();
                }}
                disabled={gameState.gems < nextSlotCostGems}
                className={`px-3 py-1 rounded-xl border font-mono text-[10px] font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  gameState.gems >= nextSlotCostGems
                    ? 'bg-sky-950/90 border-sky-400/60 text-sky-200 hover:bg-sky-900 active:scale-95 shadow-[0_0_10px_rgba(56,189,248,0.25)]'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500 cursor-not-allowed opacity-60'
                }`}
                title={`Unlock simultaneous research bar #${gameState.labSlots.length + 1} with ${nextSlotCostGems} gems`}
              >
                <Plus className="w-3 h-3 text-sky-400" />
                <span>Buy Lab Bar #{gameState.labSlots.length + 1}</span>
                <span className="text-sky-300 font-black">💎 {nextSlotCostGems}</span>
              </button>
            )}
          </div>
        </div>

        {/* Incubator Pods / Lab Bars Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {gameState.labSlots.map((slot, idx) => {
            const def = slot.researchId ? LAB_RESEARCH_CONFIG.find(r => r.id === slot.researchId) : null;
            const timeLeft = Math.max(0, Math.ceil((slot.endTime - Date.now()) / 1000));
            const totalDuration = slot.endTime && slot.startTime ? Math.max(1, (slot.endTime - slot.startTime) / 1000) : 1;
            const elapsed = totalDuration - timeLeft;
            const progressPct = slot.isCompleted ? 100 : Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));

            return (
              <div
                key={idx}
                className={`rounded-2xl border p-3 flex flex-col justify-between relative overflow-hidden transition-all duration-200 ${
                  def
                    ? slot.isCompleted
                      ? 'bg-gradient-to-b from-emerald-950/40 via-zinc-900/90 to-zinc-950 border-emerald-500/60 shadow-[0_0_18px_rgba(16,185,129,0.2)]'
                      : 'bg-gradient-to-b from-teal-950/30 via-zinc-900/90 to-zinc-950 border-teal-500/40 shadow-[0_0_12px_rgba(20,184,166,0.15)]'
                    : 'bg-zinc-950/60 border-zinc-800/80 border-dashed text-zinc-500'
                }`}
              >
                {/* Top Pod Tag */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[8.5px] font-mono font-black text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                    <FlaskConical className="w-3 h-3 text-teal-400" />
                    <span>POD #{idx + 1}</span>
                  </span>

                  {def ? (
                    slot.isCompleted ? (
                      <span className="text-[8px] font-mono font-black text-emerald-300 tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40 animate-pulse">
                        READY
                      </span>
                    ) : (
                      <span className="text-[8px] font-mono font-bold text-teal-300 tracking-wider px-1.5 py-0.2 rounded bg-teal-950/80 border border-teal-500/30 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 animate-spin" />
                        <span>{timeLeft}s</span>
                      </span>
                    )
                  ) : (
                    <span className="text-[8px] font-mono font-bold text-zinc-500 tracking-wider">
                      IDLE
                    </span>
                  )}
                </div>

                {/* Content */}
                {def ? (
                  <div className="space-y-2 flex-1 flex flex-col justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-zinc-900 border border-teal-500/30 shrink-0">
                        {getProjectIcon(def)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-mono font-black text-white break-words leading-tight">
                          {def.name}
                        </h4>
                        <span className="text-[9px] font-mono text-teal-300 font-bold block mt-0.5">
                          Synthesizing Lv. {slot.targetLevel}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[8.5px] font-mono text-zinc-400">
                        <span>{slot.isCompleted ? 'Synthesis Complete' : `${Math.round(progressPct)}% Active`}</span>
                        <span>{slot.isCompleted ? '✓ 100%' : `${timeLeft}s left`}</span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-950 rounded-full border border-white/5 overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            slot.isCompleted
                              ? 'bg-gradient-to-r from-emerald-400 to-teal-300 animate-pulse'
                              : 'bg-gradient-to-r from-teal-500 to-cyan-400'
                          }`}
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-1">
                      {slot.isCompleted ? (
                        <button
                          onClick={() => onCollectLab(idx)}
                          className="w-full py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-mono text-[10px] font-black uppercase tracking-wider cursor-pointer shadow-md hover:brightness-110 active:scale-95 animate-pulse"
                        >
                          Collect Research
                        </button>
                      ) : (
                        <button
                          onClick={() => onRushLabResearch(idx)}
                          disabled={gameState.gems < 15}
                          className={`w-full py-1.5 rounded-xl border font-mono text-[9.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all cursor-pointer ${
                            gameState.gems >= 15
                              ? 'bg-sky-950/80 hover:bg-sky-900 border-sky-500/50 text-sky-200 active:scale-95 shadow-sm'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                          }`}
                        >
                          <span>Rush Instant</span>
                          <span className="text-sky-300 font-bold">💎 15</span>
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-4 text-center flex flex-col items-center justify-center gap-1.5 my-auto">
                    <FlaskConical className="w-5 h-5 text-zinc-600 opacity-60" />
                    <span className="text-[10px] font-mono text-zinc-500">Pod Idle</span>
                    <span className="text-[8.5px] font-mono text-zinc-600">Select protocol below to begin</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. CATEGORY TABS & ADVANCED SEARCH BAR */}
      <div className="p-3 bg-zinc-900/60 border border-white/10 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar scroll-smooth">
          {(['All', 'Skills', 'Attack', 'Defense', 'Utility'] as const).map(cat => {
            const count = categoryCounts[cat];
            const isSelected = activeCategory === cat;

            return (
              <button
                key={cat}
                onClick={() => {
                  soundEngine.playTabSwitch();
                  setActiveCategory(cat);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition-all duration-150 cursor-pointer whitespace-nowrap shrink-0 border select-none ${
                  isSelected
                    ? 'bg-teal-500/20 text-teal-200 border-teal-400/80 shadow-[0_0_12px_rgba(20,184,166,0.3)]'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-white/5 hover:border-white/15'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {cat === 'Skills' && <span>⚡</span>}
                  {cat === 'Attack' && <Sword className="w-3.5 h-3.5 text-amber-400" />}
                  {cat === 'Defense' && <Heart className="w-3.5 h-3.5 text-rose-400" />}
                  {cat === 'Utility' && <ToolCase className="w-3.5 h-3.5 text-teal-400" />}
                  {cat === 'All' && <span>🔬</span>}
                  <span>{cat}</span>
                </span>
                <span className={`px-1.5 py-0.2 rounded-full text-[8.5px] font-black leading-none ${
                  isSelected ? 'bg-teal-400/30 text-teal-100' : 'bg-zinc-800 text-zinc-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Status Filter & Layout Toggle */}
        <div className="flex items-center gap-2">
          {/* Status filter dropdown */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as StatusFilter)}
            className="bg-zinc-950 border border-white/10 text-zinc-300 rounded-xl px-2.5 py-1 text-[10px] font-mono focus:outline-none focus:border-teal-500/60"
          >
            <option value="all">All Status</option>
            <option value="affordable">Ready to Upgrade</option>
            <option value="running">In Pods</option>
            <option value="maxed">Max Level</option>
          </select>

          {/* Search Bar */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search protocols..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2.5 py-1 bg-zinc-950 border border-white/10 rounded-xl text-[10.5px] font-mono text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-teal-500/60 transition-colors"
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
                viewMode === 'grid' ? 'bg-zinc-800 text-teal-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('compact')}
              title="Compact Matrix View"
              className={`p-1 rounded-lg transition-colors ${
                viewMode === 'compact' ? 'bg-zinc-800 text-teal-400' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 5. EMPTY STATE */}
      {filteredProjects.length === 0 && (
        <div className="py-12 px-4 text-center rounded-2xl bg-zinc-900/30 border border-white/5 space-y-2">
          <FlaskConical className="w-8 h-8 text-zinc-600 mx-auto" />
          <p className="text-xs font-mono font-black text-zinc-400 uppercase">
            No Research Protocols Found
          </p>
          <p className="text-[10px] font-mono text-zinc-500 max-w-xs mx-auto">
            No research matches the current filter or search criteria.
          </p>
          {(activeCategory !== 'All' || statusFilter !== 'all' || searchQuery) && (
            <button
              onClick={() => {
                setActiveCategory('All');
                setStatusFilter('all');
                setSearchQuery('');
              }}
              className="mt-2 px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-teal-400 rounded-lg text-[10px] font-mono font-bold transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* 6. GRID VIEW: REDESIGNED BENTO PROTOCOL CARDS */}
      {viewMode === 'grid' && filteredProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredProjects.map(def => {
            const currentLevel = gameState.labResearchLevels[def.id] || 0;
            const isMax = currentLevel >= def.maxLevel;
            const isRunning = activeResearchIds.has(def.id);

            const cellCost = Math.round(def.baseCostCells * Math.pow(def.costGrowth, currentLevel));
            const shardCost = Math.round((def.baseCostShards || 30) * Math.pow(def.costShardsGrowth || 1.35, currentLevel));
            const gemCost = def.instantGemsCost || 10;
            const durationSec = Math.round(def.baseDurationSeconds * Math.pow(def.durationGrowth, currentLevel));

            const canAffordCells = gameState.cells >= cellCost && !isMax && firstFreeSlotIndex !== -1 && !isRunning;
            const canAffordShards = gameState.cosmicShards >= shardCost && !isMax && !isRunning;
            const canAffordGems = gameState.gems >= gemCost && !isMax && !isRunning;

            const currentValueStr = def.unit === ' Slots'
              ? `${currentLevel} Slots`
              : def.unit === 'x'
              ? `${(1.5 + currentLevel * def.valuePerLevel).toFixed(1)}x Max Speed`
              : `+${Math.round(currentLevel * def.valuePerLevel * 100)}%`;
            const nextValueStr = def.unit === ' Slots'
              ? `${currentLevel + 1} Slots`
              : def.unit === 'x'
              ? `${(1.5 + (currentLevel + 1) * def.valuePerLevel).toFixed(1)}x Max Speed`
              : `+${Math.round((currentLevel + 1) * def.valuePerLevel * 100)}%`;

            const theme = getCategoryTheme(def.category);

            return (
              <div
                key={def.id}
                className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col justify-between transition-all duration-200 relative overflow-hidden select-none ${
                  isMax
                    ? 'bg-zinc-950/60 border-amber-500/30 shadow-none'
                    : isRunning
                    ? 'bg-gradient-to-br from-teal-950/40 via-zinc-900 to-zinc-950 border-teal-500/60 shadow-[0_0_15px_rgba(20,184,166,0.15)]'
                    : `bg-gradient-to-br ${theme.glow} border-white/10 hover:border-white/20 shadow-md`
                }`}
              >
                {/* Card Header */}
                <div>
                  <div className="flex items-start justify-between gap-2.5 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/10 shadow-inner shrink-0">
                        {getProjectIcon(def)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-mono text-xs sm:text-sm font-black text-white leading-tight break-words">
                            {def.name}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded border ${theme.badge}`}>
                            {def.category}
                          </span>
                          {isRunning && (
                            <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.2 rounded bg-teal-500/20 border border-teal-500/40 text-teal-300 animate-pulse">
                              IN POD
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Level Pill */}
                    <div className="shrink-0 text-right">
                      {isMax ? (
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[9.5px] font-black uppercase tracking-wider">
                          MAX LV. {def.maxLevel}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-white/10 text-zinc-300 font-mono text-[9.5px] font-black">
                          Lv. {currentLevel} <span className="text-zinc-500">/ {def.maxLevel}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stat Impact Metrics Display */}
                  <div className="px-2.5 py-1.5 rounded-xl bg-zinc-950/80 border border-white/5 flex items-center justify-between text-[9.5px] font-mono my-2">
                    <span className="text-zinc-400">Effect Power:</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-zinc-300 font-bold">
                        {currentLevel > 0 
                          ? currentValueStr 
                          : def.unit === 'x' 
                          ? '1.5x (Beginner)' 
                          : '0%'}
                      </span>
                      {!isMax && (
                        <>
                          <span className="text-zinc-600">➔</span>
                          <span className="text-emerald-400 font-black">{nextValueStr}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Description Box with Clean Layout */}
                  <p className="text-[10px] font-mono text-zinc-400 leading-relaxed min-h-[32px] px-0.5">
                    {def.description}
                  </p>
                </div>

                {/* Card Action Footer */}
                <div className="pt-3 border-t border-white/10 mt-2">
                  {isMax ? (
                    <div className="w-full py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 font-mono text-[10px] font-black text-center uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Protocol Fully Mastered</span>
                    </div>
                  ) : isRunning ? (
                    <div className="w-full py-2 rounded-xl bg-teal-950/70 border border-teal-500/40 text-teal-300 font-mono text-[10px] font-black text-center uppercase tracking-wider flex items-center justify-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 animate-spin" />
                      <span>Synthesizing in Incubation Pod</span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[8px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                        <span>Standard Incubate</span>
                        <span>Quantum Overclock (Instant)</span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {/* Method 1: Timed Research with Cells */}
                        <button
                          onClick={() => {
                            if (firstFreeSlotIndex !== -1) {
                              soundEngine.playUpgradeSuccess();
                              onStartLabResearch(firstFreeSlotIndex, def.id);
                            }
                          }}
                          disabled={!canAffordCells}
                          className={`p-2 rounded-xl border font-mono text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                            canAffordCells
                              ? 'bg-amber-950/60 border-amber-500/40 text-amber-200 hover:bg-amber-900/80 active:scale-95 shadow-sm'
                              : 'bg-zinc-950 border-white/5 text-zinc-600 cursor-not-allowed opacity-50'
                          }`}
                          title={firstFreeSlotIndex === -1 ? 'No free incubator pods available' : `Incubate for ${durationSec}s`}
                        >
                          <span className="text-[7.5px] uppercase tracking-wider text-amber-400/80 font-black">Pod Incubate</span>
                          <div className="flex items-center gap-1 text-[10.5px] font-black text-amber-300 my-0.5">
                            <span>🧪</span>
                            <span>{cellCost.toLocaleString()}</span>
                          </div>
                          <span className="text-[8px] text-zinc-400">{durationSec}s timer</span>
                        </button>

                        {/* Method 2: Instant Shard Overclock */}
                        <button
                          onClick={() => {
                            const ok = onBuyLabAttribute(def.id, 'shards');
                            if (ok) soundEngine.playUpgradeSuccess();
                          }}
                          disabled={!canAffordShards}
                          className={`p-2 rounded-xl border font-mono text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                            canAffordShards
                              ? 'bg-purple-950/70 border-purple-500/50 text-purple-200 hover:bg-purple-900 active:scale-95 shadow-sm'
                              : 'bg-zinc-950 border-white/5 text-zinc-600 cursor-not-allowed opacity-50'
                          }`}
                          title="Instant Level Up with Cosmic Shards (No Pod Required)"
                        >
                          <span className="text-[7.5px] uppercase tracking-wider text-purple-300 font-black">Instant ✦</span>
                          <div className="flex items-center gap-1 text-[10.5px] font-black text-purple-300 my-0.5">
                            <span>✦</span>
                            <span>{shardCost.toLocaleString()}</span>
                          </div>
                          <span className="text-[8px] text-zinc-400">Shards</span>
                        </button>

                        {/* Method 3: Instant Gem Overclock */}
                        <button
                          onClick={() => {
                            const ok = onBuyLabAttribute(def.id, 'gems');
                            if (ok) soundEngine.playUpgradeSuccess();
                          }}
                          disabled={!canAffordGems}
                          className={`p-2 rounded-xl border font-mono text-center flex flex-col items-center justify-center transition-all cursor-pointer ${
                            canAffordGems
                              ? 'bg-sky-950/70 border-sky-500/50 text-sky-200 hover:bg-sky-900 active:scale-95 shadow-sm'
                              : 'bg-zinc-950 border-white/5 text-zinc-600 cursor-not-allowed opacity-50'
                          }`}
                          title="Instant Level Up with Gems (No Pod Required)"
                        >
                          <span className="text-[7.5px] uppercase tracking-wider text-sky-300 font-black">Instant 💎</span>
                          <div className="flex items-center gap-1 text-[10.5px] font-black text-sky-300 my-0.5">
                            <Gem className="w-3 h-3 text-sky-400" />
                            <span>{gemCost}</span>
                          </div>
                          <span className="text-[8px] text-zinc-400">Gems</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. COMPACT MATRIX ROW VIEW (ZERO-SCROLL FRIENDLY) */}
      {viewMode === 'compact' && filteredProjects.length > 0 && (
        <div className="space-y-1.5">
          {filteredProjects.map(def => {
            const currentLevel = gameState.labResearchLevels[def.id] || 0;
            const isMax = currentLevel >= def.maxLevel;
            const isRunning = activeResearchIds.has(def.id);

            const cellCost = Math.round(def.baseCostCells * Math.pow(def.costGrowth, currentLevel));
            const shardCost = Math.round((def.baseCostShards || 30) * Math.pow(def.costShardsGrowth || 1.35, currentLevel));
            const gemCost = def.instantGemsCost || 10;
            const durationSec = Math.round(def.baseDurationSeconds * Math.pow(def.durationGrowth, currentLevel));

            const canAffordCells = gameState.cells >= cellCost && !isMax && firstFreeSlotIndex !== -1 && !isRunning;
            const canAffordShards = gameState.cosmicShards >= shardCost && !isMax && !isRunning;
            const canAffordGems = gameState.gems >= gemCost && !isMax && !isRunning;

            const currentValueStr = def.unit === ' Slots'
              ? `${currentLevel} Slots`
              : `+${Math.round(currentLevel * def.valuePerLevel * 100)}%`;
            const nextValueStr = def.unit === ' Slots'
              ? `${currentLevel + 1} Slots`
              : `+${Math.round((currentLevel + 1) * def.valuePerLevel * 100)}%`;

            return (
              <div
                key={def.id}
                className={`rounded-xl border px-3 py-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 transition-all select-none ${
                  isMax
                    ? 'bg-zinc-950/60 border-amber-500/20 opacity-70'
                    : isRunning
                    ? 'bg-teal-950/30 border-teal-500/50'
                    : 'bg-zinc-900/70 border-white/10 hover:border-white/20'
                }`}
              >
                {/* Left: Info */}
                <div className="flex items-center gap-2.5 min-w-[200px] flex-1">
                  <div className="p-1.5 rounded-lg bg-zinc-950 border border-white/10 shrink-0">
                    {getProjectIcon(def)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-[11px] font-mono font-black text-white break-words leading-tight">
                        {def.name}
                      </h4>
                      <span className="text-[8px] font-mono px-1 rounded bg-zinc-800 text-zinc-400 shrink-0">
                        {isMax ? 'MAX' : `Lv.${currentLevel}/${def.maxLevel}`}
                      </span>
                    </div>
                    <p className="text-[8.5px] font-mono text-zinc-400 break-words leading-tight mt-0.5">
                      Effect: <strong className="text-teal-300">{currentLevel > 0 ? currentValueStr : '0%'}</strong>
                      {!isMax && <> ➔ <strong className="text-emerald-400">{nextValueStr}</strong></>}
                    </p>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
                  {isMax ? (
                    <span className="text-[9px] font-mono font-bold text-amber-400 px-2 py-1 rounded bg-amber-950/40 border border-amber-500/30">
                      ✓ Mastered
                    </span>
                  ) : isRunning ? (
                    <span className="text-[9px] font-mono font-bold text-teal-300 px-2 py-1 rounded bg-teal-950/60 border border-teal-500/40 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 animate-spin" /> In Pod
                    </span>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      {/* Cells */}
                      <button
                        onClick={() => {
                          if (firstFreeSlotIndex !== -1) {
                            soundEngine.playUpgradeSuccess();
                            onStartLabResearch(firstFreeSlotIndex, def.id);
                          }
                        }}
                        disabled={!canAffordCells}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[8.5px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
                          canAffordCells
                            ? 'bg-amber-950/80 border border-amber-500/40 text-amber-200 hover:bg-amber-900 active:scale-95'
                            : 'bg-zinc-950 border border-white/5 text-zinc-600 cursor-not-allowed opacity-40'
                        }`}
                        title={`Incubate with Cells (${durationSec}s)`}
                      >
                        <span>🧪 {cellCost.toLocaleString()}</span>
                      </button>

                      {/* Shards */}
                      <button
                        onClick={() => {
                          const ok = onBuyLabAttribute(def.id, 'shards');
                          if (ok) soundEngine.playUpgradeSuccess();
                        }}
                        disabled={!canAffordShards}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[8.5px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
                          canAffordShards
                            ? 'bg-purple-950/80 border border-purple-500/40 text-purple-200 hover:bg-purple-900 active:scale-95'
                            : 'bg-zinc-950 border border-white/5 text-zinc-600 cursor-not-allowed opacity-40'
                        }`}
                        title="Instant Upgrade with Cosmic Shards"
                      >
                        <span>✦ {shardCost.toLocaleString()}</span>
                      </button>

                      {/* Gems */}
                      <button
                        onClick={() => {
                          const ok = onBuyLabAttribute(def.id, 'gems');
                          if (ok) soundEngine.playUpgradeSuccess();
                        }}
                        disabled={!canAffordGems}
                        className={`px-2.5 py-1 rounded-lg font-mono text-[8.5px] font-black uppercase transition-all cursor-pointer flex items-center gap-1 ${
                          canAffordGems
                            ? 'bg-sky-950/80 border border-sky-500/40 text-sky-200 hover:bg-sky-900 active:scale-95'
                            : 'bg-zinc-950 border border-white/5 text-zinc-600 cursor-not-allowed opacity-40'
                        }`}
                        title="Instant Upgrade with Gems"
                      >
                        <span>💎 {gemCost}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
