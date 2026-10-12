/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { 
  Swords, 
  Gauge, 
  Shield, 
  ShieldCheck, 
  Banknote, 
  Wallet, 
  Coins, 
  CircleDollarSign,
  Heart,
  HeartPlus,
  HeartPulse,
  Crosshair,
  Flame,
  Radio,
  Layers,
  Bolt,
  RotateCcw,
  Skull,
  ChevronsUp,
  Sparkles,
  Dna,
  Tornado,
  Disc,
  Orbit,
  RefreshCcw,
  TrendingUp
} from 'lucide-react';
import {
  CosmicShardBonusIcon,
  CosmicShardsPerRoundIcon,
} from './icons/CosmicShardIcons';
import { Upgrade, GameState } from '../types';
import { formatCurrency } from '../utils/format';
import { getLiveEffectiveUpgradeValue, getLiveEffectiveDelta, formatUpgradeValue } from '../game/constants';

interface Props {
  upgrade: Upgrade;
  allUpgrades?: Upgrade[];
  gameState: GameState;
  onBuy: (id: string) => void;
  calculateCost: (upgrade: Upgrade, level: number, amount: number) => number;
}

export const getUpgradeTileIcon = (id: string) => {
  switch (id) {
    // Attack
    case 'damage_flat':
      return Swords;
    case 'shoot_speed':
      return Gauge;
    case 'crit_chance':
      return Crosshair;
    case 'crit_multiplier':
      return Flame;
    case 'attack_radius':
      return Radio;
    case 'multishot_chance':
      return Layers;
    case 'rapid_fire_chance':
      return Bolt;
    case 'bounce_shot_chance':
      return RotateCcw;
    case 'boss_damage':
      return Skull;
    case 'armor_pierce':
      return ChevronsUp;

    // Defense / Health
    case 'health_max':
      return HeartPlus;
    case 'hp_regen':
      return HeartPulse;
    case 'defense_percent':
      return Shield;
    case 'defense_absolute':
      return ShieldCheck;
    case 'thorns_percent':
      return Sparkles;
    case 'life_steal':
      return Dna;
    case 'knockback_chance':
      return Tornado;
    case 'plasma_barrier_chance':
      return Disc;
    case 'orbiting_orbs':
      return Orbit;

    // Utility
    case 'cash_bonus':
      return Banknote;
    case 'cash_per_wave':
      return Wallet;
    case 'shards_per_kill':
      return CosmicShardBonusIcon;
    case 'shards_per_wave':
      return CosmicShardsPerRoundIcon;
    case 'free_upgrade_chance':
      return RefreshCcw;
    case 'interest_rate':
      return TrendingUp;

    default:
      return Sparkles;
  }
};

export const UpgradeTile: React.FC<Props> = ({ 
  upgrade, 
  allUpgrades,
  gameState, 
  onBuy, 
  calculateCost 
}) => {
  const amount = gameState.bulkBuyMode === 'x1' ? 1 : gameState.bulkBuyMode === 'x10' ? 10 : 1;
  const cost = calculateCost(upgrade, upgrade.level, amount);
  const isMax = upgrade.maxLevel !== undefined && upgrade.level >= upgrade.maxLevel;
  const canAfford = !isMax && gameState.cash >= cost;
  
  const upgradesList = allUpgrades || gameState.upgrades || [upgrade];

  // Universal Live Total Effective Value calculation
  const currentEffectiveValue = React.useMemo(() => {
    return getLiveEffectiveUpgradeValue(upgrade.id, upgradesList, gameState);
  }, [upgrade.id, upgradesList, gameState]);

  // Universal Live Effective Delta preview for next level
  const { delta } = React.useMemo(() => {
    return getLiveEffectiveDelta(upgrade.id, amount, upgradesList, gameState, currentEffectiveValue);
  }, [upgrade.id, amount, upgradesList, gameState, currentEffectiveValue]);

  // Track pointer down coordinates to distinguish taps from swipe gestures
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (isMax || !canAfford) return;

    if (dragStartRef.current) {
      const dx = Math.abs(e.clientX - dragStartRef.current.x);
      const dy = Math.abs(e.clientY - dragStartRef.current.y);
      if (dx > 8 || dy > 8) {
        return;
      }
    }

    onBuy(upgrade.id);
  };

  // Clean uppercase card title
  const getCardTitle = (): string => {
    switch (upgrade.id) {
      case 'damage_flat': return 'DAMAGE';
      case 'shoot_speed': return 'ATK SPEED';
      case 'crit_chance': return 'CRIT %';
      case 'crit_multiplier': return 'CRIT DMG';
      case 'attack_radius': return 'RANGE';
      case 'multishot_chance': return 'MULTISHOT';
      case 'rapid_fire_chance': return 'BURST SALVO';
      case 'bounce_shot_chance': return 'BOUNCE SHOT';
      case 'boss_damage': return 'BOSS BUSTER';
      case 'armor_pierce': return 'ARMOR PIERCE';
      case 'health_max': return 'HEALTH';
      case 'hp_regen': return 'REGEN';
      case 'defense_percent': return 'DEFENSE %';
      case 'defense_absolute': return 'ABS DEFENSE';
      case 'thorns_percent': return 'THORNS';
      case 'life_steal': return 'LIFE STEAL';
      case 'knockback_chance': return 'KNOCKBACK';
      case 'plasma_barrier_chance': return 'BARRIER';
      case 'orbiting_orbs': return 'ENERGY ORBS';
      case 'cash_bonus': return 'CASH BONUS';
      case 'cash_per_wave': return 'WAVE SUPPLY';
      case 'shards_per_kill': return 'SHARDS/KILL';
      case 'shards_per_wave': return 'WAVE SHARDS';
      case 'free_upgrade_chance': return 'FREE UPGRADE';
      case 'interest_rate': return 'INTEREST';
      default: return upgrade.name.toUpperCase();
    }
  };

  const formatVal = (val: number) => {
    return formatUpgradeValue(upgrade.id, val);
  };

  // Concise benefit delta (+3 HP, +2.5 DMG, +0.25/s)
  const getBenefitPreview = (): string => {
    if (isMax) return 'MAX';
    if (
      upgrade.id === 'crit_chance' ||
      upgrade.id === 'defense_percent' ||
      upgrade.id === 'thorns_percent' ||
      upgrade.id === 'life_steal' ||
      upgrade.id === 'knockback_chance' ||
      upgrade.id === 'multishot_chance' ||
      upgrade.id === 'rapid_fire_chance' ||
      upgrade.id === 'bounce_shot_chance' ||
      upgrade.id === 'free_upgrade_chance' ||
      upgrade.id === 'plasma_barrier_chance' ||
      upgrade.id === 'armor_pierce' ||
      upgrade.id === 'interest_rate'
    ) {
      return `+${(delta * 100).toFixed(1)}%`;
    }
    if (
      upgrade.id === 'crit_multiplier' ||
      upgrade.id === 'cash_bonus' ||
      upgrade.id === 'shards_per_kill' ||
      upgrade.id === 'boss_damage' ||
      upgrade.id === 'cash_per_wave'
    ) {
      return `+${delta.toFixed(2)}x`;
    }
    if (upgrade.id === 'attack_radius') {
      return `+${delta.toFixed(0)}m`;
    }
    if (upgrade.id === 'shoot_speed' || upgrade.id === 'hp_regen') {
      return `+${delta.toFixed(2)}/s`;
    }
    if (delta >= 1000) {
      return `+${formatCurrency(delta)}`;
    }
    if (delta % 1 === 0) return `+${delta.toFixed(0)}`;
    return `+${delta.toFixed(1)}`;
  };

  // Color theme per category
  const getCategoryStyles = () => {
    if (upgrade.group === 'Health') {
      return {
        cardBorder: canAfford 
          ? 'border-emerald-500/70 hover:border-emerald-400 bg-emerald-950/20' 
          : 'border-emerald-950/40 bg-black/40',
        valueText: 'text-emerald-400',
        iconColor: 'text-emerald-400',
        iconBg: 'bg-emerald-950/60 border-emerald-500/30',
        btnBg: canAfford
          ? 'bg-emerald-500 text-black hover:bg-emerald-400 active:scale-95 shadow-[0_0_8px_rgba(16,185,129,0.35)]'
          : 'bg-zinc-900/90 text-emerald-500/35 border border-emerald-500/20 cursor-not-allowed',
      };
    }
    if (upgrade.group === 'Damage') {
      return {
        cardBorder: canAfford 
          ? 'border-rose-500/70 hover:border-rose-400 bg-rose-950/20' 
          : 'border-rose-950/40 bg-black/40',
        valueText: 'text-rose-400',
        iconColor: 'text-rose-400',
        iconBg: 'bg-rose-950/60 border-rose-500/30',
        btnBg: canAfford
          ? 'bg-rose-500 text-white hover:bg-rose-400 active:scale-95 shadow-[0_0_8px_rgba(244,63,94,0.35)]'
          : 'bg-zinc-900/90 text-rose-500/35 border border-rose-500/20 cursor-not-allowed',
      };
    }
    if (upgrade.id === 'shards_per_kill' || upgrade.id === 'shards_per_wave') {
      return {
        cardBorder: canAfford 
          ? 'border-purple-500/70 hover:border-purple-400 bg-purple-950/20' 
          : 'border-purple-950/40 bg-black/40',
        valueText: 'text-purple-300',
        iconColor: 'text-purple-400',
        iconBg: 'bg-purple-950/60 border-purple-500/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]',
        btnBg: canAfford
          ? 'bg-purple-500 text-white hover:bg-purple-400 active:scale-95 shadow-[0_0_8px_rgba(168,85,247,0.35)]'
          : 'bg-zinc-900/90 text-purple-500/35 border border-purple-500/20 cursor-not-allowed',
      };
    }
    // Utility
    return {
      cardBorder: canAfford 
        ? 'border-cyan-500/70 hover:border-cyan-400 bg-cyan-950/20' 
        : 'border-cyan-950/40 bg-black/40',
      valueText: 'text-cyan-400',
      iconColor: 'text-cyan-400',
      iconBg: 'bg-cyan-950/60 border-cyan-500/30',
      btnBg: canAfford
        ? 'bg-cyan-400 text-black hover:bg-cyan-300 active:scale-95 shadow-[0_0_8px_rgba(6,182,212,0.35)]'
        : 'bg-zinc-900/90 text-cyan-500/35 border border-cyan-500/20 cursor-not-allowed',
    };
  };

  const theme = getCategoryStyles();
  const IconComponent = getUpgradeTileIcon(upgrade.id);

  return (
    <div 
      onPointerDown={handlePointerDown}
      onClick={handleCardClick}
      role="button"
      tabIndex={canAfford && !isMax ? 0 : -1}
      aria-disabled={isMax || !canAfford}
      className={`relative w-full flex flex-col justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl border backdrop-blur-md transition-all select-none overflow-hidden ${theme.cardBorder} ${
        isMax
          ? 'border-amber-500/30 opacity-75 cursor-default'
          : canAfford
          ? 'cursor-pointer active:scale-[0.98]'
          : 'opacity-65 cursor-not-allowed'
      }`}
    >
      {/* 1. Header: Upgrade Icon & Level Badge */}
      <div className="w-full flex items-center justify-between gap-1 leading-none">
        <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${theme.iconBg}`}>
          <IconComponent className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${theme.iconColor}`} strokeWidth={2.2} />
        </div>
        <span className="text-[8px] sm:text-[8.5px] font-mono text-zinc-400 font-bold tabular-nums px-1 py-0.5 rounded bg-zinc-950/60 border border-white/5">
          Lv.{upgrade.level}{upgrade.maxLevel ? `/${upgrade.maxLevel}` : ''}
        </span>
      </div>

      {/* 2. Upgrade Title: Dedicated full-width row with zero truncation */}
      <div className="w-full min-h-[1.65rem] sm:min-h-[1.85rem] flex items-center my-0.5 sm:my-1">
        <span 
          title={upgrade.name}
          className="text-[9.5px] sm:text-[10.5px] font-mono font-black text-white uppercase tracking-tight leading-tight whitespace-normal break-words"
        >
          {getCardTitle()}
        </span>
      </div>

      {/* 3. Middle: Live Total Effective Value & Next Delta */}
      <div className="flex flex-col gap-0.5 my-0.5 leading-none w-full">
        <div className="flex items-baseline justify-between gap-1 w-full">
          <span className="text-[7.5px] sm:text-[8px] font-mono text-zinc-400 uppercase tracking-tight font-semibold shrink-0">
            TOTAL
          </span>
          <span className={`text-[10.5px] sm:text-[11.5px] font-mono font-black tracking-tight tabular-nums text-right truncate ${theme.valueText}`}>
            {formatVal(currentEffectiveValue)}
          </span>
        </div>
        {!isMax && (
          <div className="flex items-baseline justify-between gap-1 text-[8px] sm:text-[8.5px] font-mono text-zinc-400 w-full">
            <span className="text-zinc-500 shrink-0">NEXT</span>
            <span className="text-emerald-400 font-bold tabular-nums text-right shrink-0">
              {getBenefitPreview()}
            </span>
          </div>
        )}
      </div>

      {/* 4. Action Button: Compact & Tactile */}
      <div className="w-full mt-auto pt-1">
        <button
          type="button"
          disabled={isMax || !canAfford}
          onClick={(e) => {
            e.stopPropagation();
            if (canAfford && !isMax) onBuy(upgrade.id);
          }}
          className={`w-full h-6 sm:h-7 rounded-md font-mono font-black text-[10px] sm:text-[10.5px] flex items-center justify-center transition-all cursor-pointer ${
            isMax
              ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 cursor-default'
              : theme.btnBg
          }`}
        >
          {isMax ? (
            <span>MAX</span>
          ) : (
            <div className="flex items-center justify-between w-full px-1.5 leading-none">
              <span className="truncate font-black">${formatCurrency(cost, gameState.settings?.useLegacyCurrencyFormat)}</span>
              <span className="text-[8px] sm:text-[8.5px] opacity-85 shrink-0 ml-1 font-bold tabular-nums">➔{formatVal(currentEffectiveValue + delta)}</span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};


