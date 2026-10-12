/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Swords, 
  Heart, 
  HeartPlus,
  ToolCase, 
  Sparkles, 
  Lock, 
  Unlock, 
  Search, 
  X, 
  Check, 
  ChevronRight, 
  Flame, 
  Gauge, 
  Crosshair, 
  Target, 
  Radio, 
  Layers, 
  Bolt, 
  RotateCcw, 
  Skull, 
  Atom, 
  ChevronsUp, 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  HeartPulse, 
  Hexagon, 
  Battery, 
  Dna, 
  Tornado, 
  Disc, 
  Orbit, 
  Banknote,
  Wallet,
  Coins, 
  CircleDollarSign,
  Rocket, 
  Sparkle, 
  RefreshCcw, 
  TrendingUp, 
  Scale, 
  Microscope, 
  Pickaxe, 
  Clock, 
  Timer,
  Trophy, 
  Crown,
  HandCoins,
  CloudLightning, 
  ScanLine, 
  Waves, 
  Biohazard, 
  Bomb,
  Filter,
  CheckCircle2,
  Info
} from 'lucide-react';
import {
  CosmicShardBonusIcon,
  CosmicShardsPerRoundIcon,
  StopwatchIcon,
} from './icons/CosmicShardIcons';
import { GameState } from '../types';
import { WORKSHOP_CONFIG, calculateWorkshopCost, calculatePlayerCombatStats } from '../game/constants';
import { formatCurrency } from '../utils/format';
import { soundEngine } from '../game/sound';

type WorkshopCategory = 'Attack' | 'Defense' | 'Utility' | 'Ultimate Weapons';
type BuyMode = 'x1' | 'x5' | 'x10' | 'max';

interface Props {
  gameState: GameState;
  onBuyWorkshopUpgrade: (id: string, amount?: number) => void;
  onOpenTechTree?: () => void;
  className?: string;
}

// Icon and color mapping for each workshop upgrade
const getUpgradeIcon = (id: string) => {
  switch (id) {
    // Attack
    case 'perm_base_damage':
      return { icon: Swords, color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-500/40', glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' };
    case 'perm_attack_speed':
      return { icon: Gauge, color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/40', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]' };
    case 'perm_crit_chance':
      return { icon: Crosshair, color: 'text-red-400', bg: 'bg-red-950/60', border: 'border-red-500/40', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]' };
    case 'perm_crit_multiplier':
      return { icon: Flame, color: 'text-orange-400', bg: 'bg-orange-950/60', border: 'border-orange-500/40', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]' };
    case 'perm_range':
      return { icon: Radio, color: 'text-yellow-400', bg: 'bg-yellow-950/60', border: 'border-yellow-500/40', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.3)]' };
    case 'perm_multishot_chance':
      return { icon: Layers, color: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-500/40', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' };
    case 'perm_rapid_fire_chance':
      return { icon: Bolt, color: 'text-amber-300', bg: 'bg-amber-950/60', border: 'border-amber-400/40', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.3)]' };
    case 'perm_bounce_shot_chance':
      return { icon: RotateCcw, color: 'text-sky-400', bg: 'bg-sky-950/60', border: 'border-sky-500/40', glow: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]' };
    case 'perm_boss_damage':
      return { icon: Skull, color: 'text-rose-500', bg: 'bg-rose-950/80', border: 'border-rose-500/50', glow: 'shadow-[0_0_14px_rgba(244,63,94,0.4)]' };
    case 'perm_elite_slayer':
      return { icon: Target, color: 'text-orange-400', bg: 'bg-orange-950/60', border: 'border-orange-500/40', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]' };
    case 'perm_critical_surge':
      return { icon: Atom, color: 'text-fuchsia-400', bg: 'bg-fuchsia-950/60', border: 'border-fuchsia-500/40', glow: 'shadow-[0_0_12px_rgba(217,70,239,0.3)]' };
    case 'perm_armor_pierce':
      return { icon: ChevronsUp, color: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-500/40', glow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]' };

    // Defense
    case 'perm_base_hp':
      return { icon: HeartPlus, color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-500/40', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]' };
    case 'perm_hp_regen':
      return { icon: HeartPulse, color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-500/40', glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' };
    case 'perm_defense_percent':
      return { icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-500/40', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]' };
    case 'perm_defense_absolute':
      return { icon: ShieldCheck, color: 'text-teal-300', bg: 'bg-teal-950/60', border: 'border-teal-400/40', glow: 'shadow-[0_0_12px_rgba(45,212,191,0.3)]' };
    case 'perm_thorns':
      return { icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/40', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]' };
    case 'perm_recovery_package':
      return { icon: Battery, color: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-500/40', glow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]' };
    case 'perm_life_steal':
      return { icon: Dna, color: 'text-red-400', bg: 'bg-red-950/60', border: 'border-red-500/40', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]' };
    case 'perm_knockback_chance':
      return { icon: Tornado, color: 'text-sky-400', bg: 'bg-sky-950/60', border: 'border-sky-500/40', glow: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]' };
    case 'perm_barrier_overcharge':
      return { icon: Atom, color: 'text-teal-300', bg: 'bg-teal-950/60', border: 'border-teal-400/40', glow: 'shadow-[0_0_12px_rgba(45,212,191,0.3)]' };
    case 'perm_plasma_barrier_chance':
      return { icon: Disc, color: 'text-indigo-400', bg: 'bg-indigo-950/60', border: 'border-indigo-500/40', glow: 'shadow-[0_0_12px_rgba(99,102,241,0.3)]' };
    case 'perm_orbiting_orbs':
      return { icon: Orbit, color: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-500/40', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' };

    // Utility
    case 'perm_cash_mult':
      return { icon: Banknote, color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-500/40', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]' };
    case 'perm_supply_drop':
      return { icon: Wallet, color: 'text-amber-400', bg: 'bg-amber-950/60', border: 'border-amber-500/40', glow: 'shadow-[0_0_12px_rgba(245,158,11,0.3)]' };
    case 'perm_shards_yield':
      return { icon: CosmicShardBonusIcon, color: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-500/40', glow: 'shadow-[0_0_16px_rgba(168,85,247,0.45)]' };
    case 'perm_shards_per_wave':
      return { icon: CosmicShardsPerRoundIcon, color: 'text-violet-400', bg: 'bg-violet-950/60', border: 'border-violet-500/40', glow: 'shadow-[0_0_16px_rgba(139,92,246,0.45)]' };
    case 'perm_free_upgrade_chance':
      return { icon: RefreshCcw, color: 'text-teal-400', bg: 'bg-teal-950/60', border: 'border-teal-500/40', glow: 'shadow-[0_0_12px_rgba(20,184,166,0.3)]' };
    case 'perm_interest_rate':
      return { icon: TrendingUp, color: 'text-emerald-400', bg: 'bg-emerald-950/60', border: 'border-emerald-500/40', glow: 'shadow-[0_0_12px_rgba(16,185,129,0.3)]' };
    case 'perm_starting_cash':
      return { icon: HandCoins, color: 'text-yellow-400', bg: 'bg-yellow-950/60', border: 'border-yellow-500/40', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.3)]' };
    case 'perm_cell_extractor':
      return { icon: Microscope, color: 'text-teal-300', bg: 'bg-teal-950/60', border: 'border-teal-400/40', glow: 'shadow-[0_0_12px_rgba(45,212,191,0.3)]' };
    case 'perm_gem_extractor':
      return { icon: Pickaxe, color: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-500/40', glow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]' };

    // Ultimate Weapons
    case 'perm_chrono_field':
      return { icon: StopwatchIcon, color: 'text-cyan-400', bg: 'bg-cyan-950/60', border: 'border-cyan-500/40', glow: 'shadow-[0_0_12px_rgba(6,182,212,0.3)]' };
    case 'perm_golden_tower':
      return { icon: Crown, color: 'text-amber-300', bg: 'bg-amber-950/70', border: 'border-amber-400/50', glow: 'shadow-[0_0_14px_rgba(251,191,36,0.4)]' };
    case 'perm_chain_lightning':
      return { icon: CloudLightning, color: 'text-sky-400', bg: 'bg-sky-950/60', border: 'border-sky-500/40', glow: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]' };
    case 'perm_death_ray':
      return { icon: ScanLine, color: 'text-rose-400', bg: 'bg-rose-950/60', border: 'border-rose-500/40', glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' };
    case 'perm_smart_missiles':
      return { icon: Rocket, color: 'text-orange-400', bg: 'bg-orange-950/60', border: 'border-orange-500/40', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.3)]' };
    case 'perm_death_wave':
      return { icon: Waves, color: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-500/40', glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' };
    case 'perm_poison_swamp':
      return { icon: Biohazard, color: 'text-lime-400', bg: 'bg-lime-950/60', border: 'border-lime-500/40', glow: 'shadow-[0_0_12px_rgba(163,230,53,0.3)]' };
    case 'perm_black_hole':
      return { icon: Disc, color: 'text-violet-400', bg: 'bg-violet-950/70', border: 'border-violet-500/50', glow: 'shadow-[0_0_14px_rgba(139,92,246,0.4)]' };
    case 'perm_spotlight':
      return { icon: Radio, color: 'text-yellow-300', bg: 'bg-yellow-950/60', border: 'border-yellow-400/40', glow: 'shadow-[0_0_12px_rgba(253,224,71,0.3)]' };
    case 'perm_inner_landmines':
      return { icon: Bomb, color: 'text-red-400', bg: 'bg-red-950/60', border: 'border-red-500/40', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.3)]' };

    default:
      return { icon: Sparkles, color: 'text-purple-400', bg: 'bg-purple-950/60', border: 'border-purple-500/40', glow: 'shadow-[0_0_10px_rgba(168,85,247,0.2)]' };
  }
};

export const WorkshopPanel: React.FC<Props> = ({
  gameState,
  onBuyWorkshopUpgrade,
  onOpenTechTree,
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState<WorkshopCategory>('Attack');
  const [buyMode, setBuyMode] = useState<BuyMode>('x1');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAffordableOnly, setShowAffordableOnly] = useState(false);
  const [showBonusSummary, setShowBonusSummary] = useState(false);

  // Meta unlock key & level
  const metaUnlockKey = `unlock_meta_${activeCategory.toLowerCase().replace(/\s+/g, '')}`;
  const currentMetaUnlockLevel = gameState.workshopUpgrades?.[metaUnlockKey] || 0;
  const nextMetaUnlockCost = currentMetaUnlockLevel === 0 ? 50 : currentMetaUnlockLevel === 1 ? 250 : 1000;

  // Filter upgrades for active category
  const categoryUpgrades = useMemo(() => {
    return WORKSHOP_CONFIG.filter(u => u.category === activeCategory);
  }, [activeCategory]);

  // Total levels invested across all workshop upgrades
  const totalWorkshopLevels = useMemo(() => {
    return WORKSHOP_CONFIG.reduce((acc, u) => acc + (gameState.workshopUpgrades?.[u.id] || 0), 0);
  }, [gameState.workshopUpgrades]);

  // Count affordable per category
  const affordableCounts = useMemo(() => {
    const counts: Record<WorkshopCategory, number> = {
      'Attack': 0,
      'Defense': 0,
      'Utility': 0,
      'Ultimate Weapons': 0,
    };
    WORKSHOP_CONFIG.forEach(u => {
      const uTier = u.unlockTier || 0;
      const key = `unlock_meta_${u.category.toLowerCase().replace(/\s+/g, '')}`;
      const tierLvl = gameState.workshopUpgrades?.[key] || 0;
      if (uTier <= tierLvl) {
        const lvl = gameState.workshopUpgrades?.[u.id] || 0;
        const cost = calculateWorkshopCost(u, lvl);
        if (gameState.cosmicShards >= cost) {
          counts[u.category]++;
        }
      }
    });
    return counts;
  }, [gameState.workshopUpgrades, gameState.cosmicShards]);

  // Formatter for bonus text
  const formatBonus = (level: number, increment: number, unit: string) => {
    const rawBonus = level * increment;
    if (unit === '%') {
      if (increment < 1) {
        return `+${(rawBonus * 100).toFixed(1)}%`;
      }
      return `+${rawBonus.toFixed(1)}%`;
    }
    if (unit === 'x') {
      return `+${rawBonus.toFixed(2)}x`;
    }
    if (unit === '$') {
      return `+$${rawBonus.toFixed(0)}`;
    }
    if (['HP', 'DMG', 'Flat', 'Orbs', '✦', 'Beam', 'Salvo', 'Mines'].includes(unit)) {
      return `+${rawBonus % 1 === 0 ? rawBonus.toString() : rawBonus.toFixed(1)} ${unit}`;
    }
    return `+${rawBonus.toFixed(1)} ${unit}`;
  };

  // Helper to compute multi-buy count & cost
  const computePurchaseDetails = (config: typeof WORKSHOP_CONFIG[0], currentLevel: number) => {
    const targetLevels = buyMode === 'x1' ? 1 : buyMode === 'x5' ? 5 : buyMode === 'x10' ? 10 : 1000;
    
    let levelsToBuy = 0;
    let totalCost = 0;

    for (let i = 0; i < targetLevels; i++) {
      const stepCost = calculateWorkshopCost(config, currentLevel + i);
      if (totalCost + stepCost <= gameState.cosmicShards) {
        totalCost += stepCost;
        levelsToBuy++;
      } else {
        break;
      }
    }

    if (levelsToBuy === 0) {
      const base1Cost = calculateWorkshopCost(config, currentLevel);
      return {
        levelsToBuy: 1,
        totalCost: base1Cost,
        canAfford: false,
      };
    }

    return {
      levelsToBuy,
      totalCost,
      canAfford: true,
    };
  };

  // Filtered upgrades based on search and afford toggles
  const filteredList = useMemo(() => {
    return categoryUpgrades.filter(u => {
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = u.name.toLowerCase().includes(query);
        const matchesDesc = u.description.toLowerCase().includes(query);
        const matchesStat = u.statName?.toLowerCase().includes(query);
        if (!matchesName && !matchesDesc && !matchesStat) return false;
      }

      if (showAffordableOnly) {
        const lvl = gameState.workshopUpgrades?.[u.id] || 0;
        const cost = calculateWorkshopCost(u, lvl);
        if (gameState.cosmicShards < cost) return false;
      }

      return true;
    });
  }, [categoryUpgrades, searchQuery, showAffordableOnly, gameState.workshopUpgrades, gameState.cosmicShards]);

  // Group into Unlocked vs Locked by Tier
  const unlockedUpgrades = filteredList.filter(u => (u.unlockTier || 0) <= currentMetaUnlockLevel);
  const lockedUpgrades = filteredList.filter(u => (u.unlockTier || 0) > currentMetaUnlockLevel);
  const hasMoreTiersToUnlock = categoryUpgrades.some(u => (u.unlockTier || 0) > currentMetaUnlockLevel);

  // Category theme styling
  const getCategoryTheme = (cat: WorkshopCategory) => {
    switch (cat) {
      case 'Attack':
        return {
          tabActive: 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] border-rose-400/50',
          accentText: 'text-rose-400',
          accentBg: 'bg-rose-950/40',
          accentBorder: 'border-rose-500/30',
          icon: Swords,
        };
      case 'Defense':
        return {
          tabActive: 'bg-emerald-600 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border-emerald-400/50',
          accentText: 'text-emerald-400',
          accentBg: 'bg-emerald-950/40',
          accentBorder: 'border-emerald-500/30',
          icon: Heart,
        };
      case 'Utility':
        return {
          tabActive: 'bg-teal-600 text-white shadow-[0_0_15px_rgba(20,184,166,0.4)] border-teal-400/50',
          accentText: 'text-teal-400',
          accentBg: 'bg-teal-950/40',
          accentBorder: 'border-teal-500/30',
          icon: ToolCase,
        };
      case 'Ultimate Weapons':
        return {
          tabActive: 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)] border-purple-400/50',
          accentText: 'text-purple-400',
          accentBg: 'bg-purple-950/40',
          accentBorder: 'border-purple-500/30',
          icon: Sparkles,
        };
    }
  };

  const activeTheme = getCategoryTheme(activeCategory);

  return (
    <div className={`p-2.5 sm:p-4 max-w-xl mx-auto space-y-3.5 select-none ${className}`}>
      {/* 1. CYBERNETIC WORKSHOP HERO BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-purple-950/40 to-zinc-950 border border-purple-500/30 p-3 sm:p-4 shadow-[0_4px_24px_rgba(0,0,0,0.6)]">
        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-fuchsia-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400 animate-pulse" />
                Permanent Meta-Lab
              </span>
              <span className="text-[10px] font-mono text-zinc-400">
                Lv. {totalWorkshopLevels} Invested
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-wider text-white font-mono flex items-center gap-1.5 drop-shadow-sm">
              <span>WORKSHOP UPGRADES</span>
            </h2>
            <p className="text-[11px] text-zinc-400 max-w-sm leading-tight">
              Purchases are permanent and persist across all sectors, deaths, and ascensions.
            </p>
          </div>

          {/* Shards Balance Pill & Tech Tree Shortcut */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center gap-2 shadow-[0_0_16px_rgba(168,85,247,0.25)]">
              <div className="w-6 h-6 rounded-lg bg-purple-900/80 border border-purple-400/50 flex items-center justify-center text-purple-300 font-black text-sm">
                ✦
              </div>
              <div className="flex flex-col">
                <span className="text-[8px] font-mono font-bold uppercase tracking-wider text-purple-300/80 leading-none">
                  Cosmic Shards
                </span>
                <span className="text-sm font-mono font-black text-white leading-tight">
                  {gameState.cosmicShards.toLocaleString()}
                </span>
              </div>
            </div>

            {onOpenTechTree && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTabSwitch();
                  onOpenTechTree();
                }}
                title="Open Tech Tree Matrix"
                className="px-2.5 py-2 rounded-xl bg-zinc-900/80 hover:bg-purple-950/70 border border-zinc-700 hover:border-purple-500/50 text-purple-300 hover:text-white transition-all text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer"
              >
                <span>Tech</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CATEGORY SELECTOR TABS */}
      <div className="grid grid-cols-4 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 gap-1 text-[11px] font-mono font-bold shadow-inner">
        {(['Attack', 'Defense', 'Utility', 'Ultimate Weapons'] as const).map(cat => {
          const theme = getCategoryTheme(cat);
          const IconComp = theme.icon;
          const isActive = activeCategory === cat;
          const affordCount = affordableCounts[cat];

          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveCategory(cat);
              }}
              className={`py-2 px-1 rounded-xl transition-all text-center cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-1.5 relative border ${
                isActive
                  ? theme.tabActive
                  : 'border-transparent text-zinc-400 hover:text-white hover:bg-zinc-800/60'
              }`}
            >
              <IconComp className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap text-[10px] sm:text-xs">
                {cat === 'Ultimate Weapons' ? 'Ultimate' : cat}
              </span>

              {/* Affordable counter badge */}
              {affordCount > 0 && (
                <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full leading-tight shrink-0 ${
                  isActive
                    ? 'bg-black/60 text-white'
                    : 'bg-purple-900/80 text-purple-200 border border-purple-500/40'
                }`}>
                  {affordCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 3. CONTROLS BAR: Multi-Buy Switcher & Search / Filter */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-zinc-900/60 p-2 rounded-xl border border-zinc-800/80 text-xs font-mono">
        {/* Multi-Buy Switcher */}
        <div className="flex items-center gap-1 bg-zinc-950/80 p-0.5 rounded-lg border border-zinc-800">
          <span className="text-[9px] font-bold text-zinc-500 px-1.5 uppercase hidden xs:inline">
            Buy:
          </span>
          {(['x1', 'x5', 'x10', 'max'] as const).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                setBuyMode(mode);
              }}
              className={`px-2 py-1 rounded-md text-[10px] font-black transition-all cursor-pointer uppercase ${
                buyMode === mode
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>

        {/* Search & Affordable Filter Toggle */}
        <div className="flex items-center gap-1.5 flex-1 justify-end min-w-[200px]">
          {/* Search box */}
          <div className="relative flex-1 max-w-[170px]">
            <Search className="w-3 h-3 text-zinc-500 absolute left-2 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Filter..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-6 pr-6 py-1 bg-zinc-950/90 border border-zinc-800 rounded-lg text-[10px] text-white placeholder-zinc-500 focus:outline-none focus:border-purple-500/60 font-mono"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-2 text-zinc-500 hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Affordable filter toggle button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playTabSwitch();
              setShowAffordableOnly(!showAffordableOnly);
            }}
            title="Filter by affordable upgrades"
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              showAffordableOnly
                ? 'bg-purple-900/60 border-purple-500/60 text-purple-200 shadow-[0_0_10px_rgba(168,85,247,0.25)]'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Filter className="w-3 h-3 text-purple-400" />
            <span className="hidden sm:inline">Afford</span>
          </button>

          {/* Bonus summary inspector toggle */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playTabSwitch();
              setShowBonusSummary(!showBonusSummary);
            }}
            title="Toggle current permanent bonuses matrix"
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
              showBonusSummary
                ? 'bg-zinc-800 border-zinc-600 text-white'
                : 'bg-zinc-950/80 border-zinc-800 text-zinc-400 hover:text-white'
            }`}
          >
            <Info className="w-3 h-3 text-teal-400" />
            <span className="hidden sm:inline">Stats</span>
          </button>
        </div>
      </div>

      {/* 4. OPTIONAL ACTIVE BONUSES DRAWER */}
      {showBonusSummary && (
        <div className="p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800/90 space-y-2 text-xs font-mono animate-in fade-in slide-in-from-top duration-150">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-purple-300 tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Active {activeCategory} Permanent Bonuses
            </span>
            <span className="text-[9px] text-zinc-500">Persists All Runs</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 pt-1">
            {categoryUpgrades
              .filter(u => (gameState.workshopUpgrades?.[u.id] || 0) > 0)
              .map(u => {
                const lvl = gameState.workshopUpgrades?.[u.id] || 0;
                return (
                  <div key={u.id} className="p-1.5 rounded-lg bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between text-[10px] gap-2">
                    <span className="text-zinc-400 min-w-0 leading-tight">{u.name}</span>
                    <span className="font-bold text-emerald-400 shrink-0 tabular-nums">
                      {formatBonus(lvl, u.increment, u.unit)}
                    </span>
                  </div>
                );
              })}
            {categoryUpgrades.every(u => (gameState.workshopUpgrades?.[u.id] || 0) === 0) && (
              <div className="col-span-2 text-center text-[10px] text-zinc-500 py-2">
                No upgrades purchased yet in {activeCategory}. Start investing below!
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. UNLOCKED UPGRADES LIST */}
      <div className="space-y-2">
        {unlockedUpgrades.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800/60 space-y-2">
            <div className="w-10 h-10 mx-auto rounded-xl bg-zinc-800/60 flex items-center justify-center text-zinc-500">
              <Filter className="w-5 h-5" />
            </div>
            <p className="text-xs font-mono text-zinc-400">
              No matching upgrades found for current search/filter.
            </p>
            {showAffordableOnly && (
              <button
                type="button"
                onClick={() => setShowAffordableOnly(false)}
                className="text-[11px] font-mono text-purple-400 underline hover:text-purple-300 cursor-pointer"
              >
                Disable "Affordable Only" filter
              </button>
            )}
          </div>
        ) : (
          unlockedUpgrades.map(cfg => {
            const level = gameState.workshopUpgrades?.[cfg.id] || 0;
            const visual = getUpgradeIcon(cfg.id);
            const IconComponent = visual.icon;
            const { levelsToBuy, totalCost, canAfford } = computePurchaseDetails(cfg, level);

            const currentBonusText = formatBonus(level, cfg.increment, cfg.unit);
            const nextBonusText = formatBonus(level + levelsToBuy, cfg.increment, cfg.unit);

            return (
              <div
                key={cfg.id}
                className={`p-3 rounded-2xl transition-all border flex items-center justify-between gap-3 relative overflow-hidden ${
                  canAfford
                    ? 'bg-zinc-900/80 border-purple-500/25 hover:border-purple-500/50 shadow-sm'
                    : 'bg-zinc-900/50 border-zinc-800/80 opacity-90'
                }`}
              >
                {/* Visual accent left strip */}
                <div className={`w-1 self-stretch rounded-full ${visual.bg} shrink-0`} />

                {/* Left: Custom Upgrade Icon Container */}
                <div className="relative shrink-0">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${visual.bg} ${visual.border} ${visual.glow} transition-transform`}>
                    <IconComponent className={`w-5 h-5 ${visual.color}`} strokeWidth={2} />
                  </div>
                  {level > 0 && (
                    <span className="absolute -bottom-1 -right-1 px-1 py-0.2 rounded-md bg-zinc-950 border border-zinc-700 text-[8px] font-mono font-black text-purple-300">
                      L{level}
                    </span>
                  )}
                </div>

                {/* Center: Info & Progression */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-mono font-bold text-xs text-white leading-tight">
                      {cfg.name}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-md bg-purple-950/70 text-[9px] font-mono font-bold text-purple-300 border border-purple-500/30">
                      Lv. {level}
                    </span>
                    {cfg.unlockTier !== undefined && cfg.unlockTier > 0 && (
                      <span className="px-1 py-0.2 rounded bg-zinc-800/80 text-[8px] font-mono text-zinc-400 border border-zinc-700">
                        T{cfg.unlockTier + 1}
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-zinc-400 mt-0.5 leading-snug break-words">
                    {cfg.description}
                  </p>

                  {/* Stat bonus evolution preview */}
                  <div className="flex items-center gap-1.5 text-[10px] font-mono mt-1 text-zinc-400">
                    <span className="text-zinc-400">Current:</span>
                    <span className="text-emerald-400 font-bold">{currentBonusText}</span>
                    <span className="text-zinc-600">➔</span>
                    <span className="text-purple-300 font-bold">{nextBonusText}</span>
                  </div>
                </div>

                {/* Right: Buy Button */}
                <button
                  type="button"
                  disabled={!canAfford}
                  onClick={() => onBuyWorkshopUpgrade(cfg.id, levelsToBuy)}
                  className={`px-3 py-2.5 rounded-xl font-mono shrink-0 transition-all flex flex-col items-center justify-center min-w-[76px] cursor-pointer active:scale-95 border ${
                    canAfford
                      ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 border-purple-400/50 text-white shadow-[0_0_14px_rgba(168,85,247,0.45)] hover:brightness-110'
                      : 'bg-zinc-800/80 border-zinc-700/60 text-zinc-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1 text-xs font-black leading-none">
                    <span className={canAfford ? "text-purple-200" : "text-zinc-500"}>✦</span>
                    <span>{totalCost.toLocaleString()}</span>
                  </div>
                  <span className={`text-[9px] font-bold mt-0.5 ${canAfford ? 'text-purple-100' : 'text-zinc-500'}`}>
                    +{levelsToBuy} {levelsToBuy > 1 ? 'Lvls' : 'Lvl'}
                  </span>
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* 6. NEXT TIER UNLOCK BANNER */}
      {hasMoreTiersToUnlock && (
        <div className="pt-2">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-950/60 via-zinc-900 to-zinc-950 border border-purple-500/40 relative overflow-hidden shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-900/60 border border-purple-400/40 flex items-center justify-center text-purple-300">
                  <Unlock className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-black text-white uppercase tracking-wider">
                    Unlock Next Protocol Tier (Tier {currentMetaUnlockLevel + 2})
                  </h4>
                  <p className="text-[10px] font-mono text-purple-300/80">
                    Expands {activeCategory} catalog with advanced permanent tactical upgrades.
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onBuyWorkshopUpgrade(metaUnlockKey)}
              disabled={gameState.cosmicShards < nextMetaUnlockCost}
              className={`w-full py-3 rounded-xl border font-mono font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                gameState.cosmicShards >= nextMetaUnlockCost
                  ? 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-purple-600 border-purple-400 text-white shadow-[0_0_16px_rgba(168,85,247,0.4)] hover:brightness-110 active:scale-98'
                  : 'bg-zinc-800/80 border-zinc-700 text-zinc-500 cursor-not-allowed'
              }`}
            >
              <span>UNLOCK PROTOCOLS FOR</span>
              <span className="text-purple-200">✦ {nextMetaUnlockCost.toLocaleString()}</span>
            </button>
          </div>
        </div>
      )}

      {/* 7. PREVIEW OF LOCKED TIER UPGRADES */}
      {lockedUpgrades.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 px-1">
            <Lock className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
              Locked Upgrades Awaiting Protocol Unlock ({lockedUpgrades.length})
            </span>
          </div>

          <div className="space-y-1.5 opacity-60">
            {lockedUpgrades.map(cfg => {
              const visual = getUpgradeIcon(cfg.id);
              const IconComponent = visual.icon;
              return (
                <div
                  key={cfg.id}
                  className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between gap-3 text-zinc-500"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shrink-0">
                      <IconComponent className="w-4 h-4" strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-xs text-zinc-400">
                          {cfg.name}
                        </span>
                        <span className="text-[8px] font-mono px-1 rounded bg-zinc-800 text-zinc-500 border border-zinc-700">
                          Tier {(cfg.unlockTier || 0) + 1}
                        </span>
                      </div>
                      <p className="text-[9.5px] font-mono text-zinc-500 leading-snug break-words mt-0.5">
                        {cfg.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 shrink-0">
                    <Lock className="w-3 h-3 text-zinc-600" />
                    <span>Locked</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
