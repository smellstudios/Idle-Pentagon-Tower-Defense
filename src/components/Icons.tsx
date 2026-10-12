/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Sparkles, 
  Scale, 
  Shield, 
  Zap, 
  ShieldAlert, 
  Hexagon, 
  FastForward, 
  TrendingUp,
  Coins, 
  Radio, 
  HeartPulse,
  Skull,
  Fan,
  Biohazard,
  Disc,
  RotateCcw,
  Target,
  Activity,
  Atom,
  Battery,
  Bolt,
  Box,
  CircleDot,
  CloudLightning,
  Crosshair,
  Cpu,
  Cylinder,
  Dna,
  Flame,
  Gauge,
  Grip,
  Hammer,
  Infinity,
  Layers,
  Magnet,
  Microscope,
  Move,
  Orbit,
  Pickaxe,
  Plus,
  Recycle,
  RefreshCcw,
  Rocket,
  Scan,
  Search,
  Send,
  ShieldCheck,
  Thermometer,
  Timer,
  Trophy,
  Waves,
  Wrench, Swords, ChevronsUp, Tornado, ScanLine, Bomb,
  Sword, Heart, ToolCase,
  Crown, CloudFog, CloudRain, Gem, Boxes, Radiation
} from 'lucide-react';

/**
 * Redesigned category icons:
 * - Damage: Sword
 * - Health: Heart
 * - Utility: Toolbox (ToolCase)
 */
export const DamageIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <Sword className={className} />
);

export const HealthIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <Heart className={className} />
);

export const UtilityIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <ToolCase className={className} />
);

/**
 * Shared rarity colors for cards and drops.
 */
export const getRarityColor = (rarity: string = 'common'): { 
  text: string; 
  bg: string; 
  border: string; 
  glow: string; 
  from: string; 
  to: string;
  badge: string;
} => {
  switch (rarity.toLowerCase()) {
    case 'common':
      return { 
        text: 'text-zinc-400', 
        bg: 'bg-zinc-900/80', 
        border: 'border-zinc-800', 
        glow: 'shadow-[0_0_10px_rgba(161,161,170,0.15)]',
        from: 'from-zinc-900/90',
        to: 'to-zinc-950/80',
        badge: 'bg-zinc-800 text-zinc-400 border-zinc-700'
      };
    case 'uncommon':
      return { 
        text: 'text-sky-400', 
        bg: 'bg-sky-950/40', 
        border: 'border-sky-500/40', 
        glow: 'shadow-[0_0_12px_rgba(56,189,248,0.25)]',
        from: 'from-sky-950/60',
        to: 'to-sky-950/20',
        badge: 'bg-sky-900/80 text-sky-200 border-sky-400/40'
      };
    case 'rare':
      return { 
        text: 'text-emerald-400', 
        bg: 'bg-emerald-950/40', 
        border: 'border-emerald-500/40', 
        glow: 'shadow-[0_0_15px_rgba(16,185,129,0.3)]',
        from: 'from-emerald-950/60',
        to: 'to-emerald-950/20',
        badge: 'bg-emerald-900/80 text-emerald-200 border-emerald-400/40'
      };
    case 'epic':
      return { 
        text: 'text-purple-400', 
        bg: 'bg-purple-950/40', 
        border: 'border-purple-500/40', 
        glow: 'shadow-[0_0_20px_rgba(168,85,247,0.35)]',
        from: 'from-purple-950/70',
        to: 'to-purple-950/20',
        badge: 'bg-purple-900/80 text-purple-200 border-purple-400/40'
      };
    case 'legendary':
      return { 
        text: 'text-amber-400', 
        bg: 'bg-amber-950/40', 
        border: 'border-amber-500/40', 
        glow: 'shadow-[0_0_25px_rgba(245,158,11,0.4)]',
        from: 'from-amber-950/70',
        to: 'to-amber-950/20',
        badge: 'bg-amber-900/80 text-amber-200 border-amber-400/40'
      };
    default:
      return { 
        text: 'text-zinc-400', 
        bg: 'bg-zinc-900/80', 
        border: 'border-zinc-800', 
        glow: 'shadow-none',
        from: 'from-zinc-900/90',
        to: 'to-zinc-950/80',
        badge: 'bg-zinc-800 text-zinc-400 border-zinc-700'
      };
  }
};

export interface EquippedCardStyle {
  cardBg: string;
  borderColor: string;
  borderClass: string;
  glow: string;
  ring: string;
  badge: string;
  artBg: string;
  descBg: string;
  text: string;
  subtext: string;
  headerBg: string;
  accentText: string;
  indicator: string;
}

export const getEquippedCardStyle = (rarity: string = 'common'): EquippedCardStyle => {
  switch (rarity.toLowerCase()) {
    case 'common':
      return {
        cardBg: 'bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950',
        borderColor: '#94a3b8',
        borderClass: 'border-slate-400/90',
        glow: 'shadow-[0_0_22px_rgba(148,163,184,0.35)]',
        ring: 'ring-2 ring-slate-400/60 ring-inset',
        badge: 'bg-slate-700/90 text-slate-100 border-slate-400/80',
        artBg: 'bg-slate-900/90 border-slate-400/50 text-slate-200',
        descBg: 'bg-slate-950/85 border-slate-600/40 text-slate-200',
        text: 'text-slate-100',
        subtext: 'text-slate-300',
        headerBg: 'bg-slate-800/80',
        accentText: 'text-slate-300',
        indicator: 'bg-slate-400',
      };
    case 'uncommon':
      return {
        cardBg: 'bg-gradient-to-b from-sky-900/95 via-sky-950 to-blue-950',
        borderColor: '#38bdf8',
        borderClass: 'border-sky-400',
        glow: 'shadow-[0_0_25px_rgba(56,189,248,0.45)]',
        ring: 'ring-2 ring-sky-400/80 ring-inset',
        badge: 'bg-sky-600 text-white border-sky-300 font-black',
        artBg: 'bg-sky-950/90 border-sky-400/60 text-sky-200 shadow-[0_0_12px_rgba(56,189,248,0.3)]',
        descBg: 'bg-sky-950/90 border-sky-500/40 text-sky-100',
        text: 'text-sky-50',
        subtext: 'text-sky-200',
        headerBg: 'bg-sky-900/60',
        accentText: 'text-sky-300',
        indicator: 'bg-sky-400',
      };
    case 'rare':
      return {
        cardBg: 'bg-gradient-to-b from-emerald-900/95 via-emerald-950 to-teal-950',
        borderColor: '#34d399',
        borderClass: 'border-emerald-400',
        glow: 'shadow-[0_0_28px_rgba(16,185,129,0.5)]',
        ring: 'ring-2 ring-emerald-400/80 ring-inset',
        badge: 'bg-emerald-600 text-white border-emerald-300 font-black',
        artBg: 'bg-emerald-950/90 border-emerald-400/60 text-emerald-200 shadow-[0_0_14px_rgba(16,185,129,0.35)]',
        descBg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100',
        text: 'text-emerald-50',
        subtext: 'text-emerald-200',
        headerBg: 'bg-emerald-900/60',
        accentText: 'text-emerald-300',
        indicator: 'bg-emerald-400',
      };
    case 'epic':
      return {
        cardBg: 'bg-gradient-to-b from-purple-900/95 via-purple-950 to-indigo-950',
        borderColor: '#c084fc',
        borderClass: 'border-purple-400',
        glow: 'shadow-[0_0_30px_rgba(168,85,247,0.55)]',
        ring: 'ring-2 ring-purple-400/80 ring-inset',
        badge: 'bg-purple-600 text-white border-purple-300 font-black',
        artBg: 'bg-purple-950/90 border-purple-400/60 text-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.4)]',
        descBg: 'bg-purple-950/90 border-purple-500/40 text-purple-100',
        text: 'text-purple-50',
        subtext: 'text-purple-200',
        headerBg: 'bg-purple-900/60',
        accentText: 'text-purple-300',
        indicator: 'bg-purple-400',
      };
    case 'legendary':
      return {
        cardBg: 'bg-gradient-to-b from-amber-900/95 via-amber-950 to-yellow-950',
        borderColor: '#fbbf24',
        borderClass: 'border-amber-400',
        glow: 'shadow-[0_0_35px_rgba(245,158,11,0.6)]',
        ring: 'ring-2 ring-amber-400/80 ring-inset',
        badge: 'bg-amber-600 text-white border-amber-300 font-black',
        artBg: 'bg-amber-950/90 border-amber-400/60 text-amber-200 shadow-[0_0_18px_rgba(245,158,11,0.45)]',
        descBg: 'bg-amber-950/90 border-amber-500/40 text-amber-100',
        text: 'text-amber-50',
        subtext: 'text-amber-200',
        headerBg: 'bg-amber-900/60',
        accentText: 'text-amber-300',
        indicator: 'bg-amber-400',
      };
    default:
      return getEquippedCardStyle('common');
  }
};

/**
 * Shared Lucide icon mapper for Cards and Rare Drops.
 * Prevents duplication of icon switch logic across components.
 */
export const CardIcon: React.FC<{ 
  icon: string; 
  className?: string;
  fallback?: React.ComponentType<any>;
}> = ({ icon, className = 'w-4 h-4', fallback: Fallback = Sparkles }) => {
  const IconMap: Record<string, React.ComponentType<any>> = {
    Scale,
    Shield,
    Sparkles,
    Zap,
    ShieldAlert,
    Hexagon,
    FastForward,
    TrendingUp,
    Coins,
    Radio,
    HeartPulse,
    Skull,
    Fan,
    Biohazard,
    Disc,
    RotateCcw,
    Target,
    Activity,
    Atom,
    Battery,
    Bolt,
    Box,
    CircleDot,
    CloudLightning,
    Crosshair,
    Cpu,
    Cylinder,
    Dna,
    Flame,
    Gauge,
    Grip,
    Hammer,
    Infinity,
    Layers,
    Magnet,
    Microscope,
    Move,
    Orbit,
    Pickaxe,
    Plus,
    Recycle,
    RefreshCcw,
    Rocket,
    Scan,
    Search,
    Send,
    ShieldCheck,
    Thermometer,
    Timer,
    Trophy,
    Waves,
    Wrench,
    Swords,
    ChevronsUp,
    Tornado,
    ScanLine,
    Bomb,
    Sword,
    Heart,
    ToolCase,
    Crown,
    CloudFog,
    CloudRain,
    Gem,
    Boxes,
    Radiation,
    Damage: Sword,
    Health: Heart,
    Utility: ToolCase,
    Utilities: ToolCase,
    toolbox: ToolCase,
    sword: Sword,
    heart: Heart,

    // Custom Rare Drop Icons mapped to Lucide (with 'drop_' prefix)
    drop_double_shot: Swords,
    drop_piercing: ChevronsUp,
    drop_rapid_fire: Flame,
    drop_flow_of_calamity: Tornado,
    drop_lightning_chain: CloudLightning,
    drop_poison: Biohazard,
    drop_rockets: Rocket,
    drop_laser_sweep: ScanLine,
    drop_mortar_strike: Bomb,
    drop_poison_linger: CloudFog,
    drop_decaying_plague: Radiation,
    drop_shrapnel_rainfall: CloudRain,

    // Bare ID aliases (without 'drop_' prefix)
    double_shot: Swords,
    piercing: ChevronsUp,
    rapid_fire: Flame,
    flow_of_calamity: Tornado,
    lightning_chain: CloudLightning,
    poison: Biohazard,
    rockets: Rocket,
    laser_sweep: ScanLine,
    mortar_strike: Bomb,
    poison_linger: CloudFog,
    decaying_plague: Radiation,
    shrapnel_rainfall: CloudRain,

    // Boss Synergy Matrix Card & Deck Sockets
    synergy_card_matrix: Layers,
    synergy_matrix: Layers,
    synergy: Layers,
    matrix_chip: Cpu,
    matrix_socket: Boxes,

    // Combo & Emoji fallbacks mapped to crisp SVG vectors
    '☣️': Biohazard,
    '⚡': Zap,
    '💫': Sparkles,
    '💥': Bomb,
    '🌀': Tornado,
    '🔮': Boxes,
    '👑': Crown,
    '💎': Gem,
    '✨': Sparkles,
    '🚀': Rocket,
    '💣': Bomb,
    '💀': Skull,
    '🛡️': Shield,
    '⚠️': ShieldAlert,
  };

  const normalized = (icon || '').trim();
  const IconComponent = IconMap[normalized] || IconMap[normalized.toLowerCase()];
  
  if (IconComponent) {
    return <IconComponent className={className} />;
  }

  // Pure vector fallback — NEVER render raw string text inside icon slots
  return <Fallback className={className} />;
};

/**
 * Renders the custom SVG shapes for enemy types used in the UI.
 * Centralizes the SVG paths to avoid duplication and styling inconsistencies.
 */
export const EnemyIcon: React.FC<{ 
  type: string; 
  className?: string;
  size?: number | string;
}> = ({ type, className = '', size = 20 }) => {
  const baseClass = `shrink-0 ${className}`;
  
  switch (type) {
    case 'red_square':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]`}>
          <rect x="5" y="5" width="14" height="14" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" rx="1.5" />
        </svg>
      );
    case 'orange_triangle':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]`}>
          <polygon points="12,4 20,18 4,18" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
        </svg>
      );
    case 'big_square':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_8px_rgba(59,130,246,0.7)]`}>
          <rect x="3" y="3" width="18" height="18" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.9" rx="2" />
          {/* Heavy armored reinforced bulkhead & crossbeams (no ugly text) */}
          <rect x="7" y="7" width="10" height="10" fill="#1d4ed8" stroke="#93c5fd" strokeWidth="1.2" rx="1" />
          <line x1="12" y1="3" x2="12" y2="7" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
          <line x1="12" y1="17" x2="12" y2="21" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
          <line x1="3" y1="12" x2="7" y2="12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
          <line x1="17" y1="12" x2="21" y2="12" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.9" />
          <circle cx="12" cy="12" r="2" fill="#93c5fd" />
        </svg>
      );
    case 'circle':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_6px_rgba(16,185,129,0.6)]`}>
          <circle cx="12" cy="12" r="9" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
        </svg>
      );
    case 'purple_pentagon':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_6px_rgba(168,85,247,0.7)]`}>
          <polygon points="12,3 21,9.5 17.5,19.5 6.5,19.5 3,9.5" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
        </svg>
      );
    case 'gold_hexagon':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_6px_rgba(234,179,8,0.8)]`}>
          <polygon points="12,3 20,7.5 20,16.5 12,21 4,16.5 4,7.5" fill="#eab308" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.9" />
        </svg>
      );
    case 'emerald_diamond':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_6px_rgba(16,185,129,0.7)]`}>
          <polygon points="12,3 19,12 12,21 5,12" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.8" />
        </svg>
      );
    case 'crimson_octagon':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_6px_rgba(220,38,38,0.8)]`}>
          <polygon points="8,3 16,3 21,8 21,16 16,21 8,21 3,16 3,8" fill="#dc2626" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.9" />
        </svg>
      );
    case 'enraged_trapezium':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_6px_rgba(249,115,22,0.8)]`}>
          {/* Balloon on string */}
          <line x1="12" y1="4" x2="12" y2="9" stroke="#fca5a5" strokeWidth="1" strokeDasharray="1,1" />
          <ellipse cx="12" cy="4" rx="3.5" ry="4" fill="#ec4899" stroke="#ffffff" strokeWidth="1" />
          {/* Trapezium body */}
          <polygon points="7,10 17,10 20,21 4,21" fill="#f97316" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.9" />
        </svg>
      );
    case 'disruptor_emp':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_8px_rgba(6,182,212,0.9)]`}>
          <circle cx="12" cy="12" r="10" fill="none" stroke="#22d3ee" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
          <polygon points="12,2 15,7 21,8 17,13 19,19 12,16 5,19 7,13 3,8 9,7" fill="#06b6d4" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      );
    case 'reflector_prism':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]`}>
          <polygon points="12,2 20,9 12,22 4,9" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />
          <line x1="12" y1="2" x2="12" y2="22" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
          <line x1="4" y1="9" x2="20" y2="9" stroke="#ffffff" strokeWidth="1" opacity="0.7" />
        </svg>
      );
    case 'splitter_cluster':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]`}>
          <polygon points="12,2 20,6 22,15 16,21 8,21 2,15 4,6" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.9" />
          <line x1="12" y1="2" x2="12" y2="21" stroke="#6ee7b7" strokeWidth="1.2" strokeDasharray="1,1" />
          <line x1="2" y1="15" x2="22" y2="15" stroke="#6ee7b7" strokeWidth="1.2" strokeDasharray="1,1" />
        </svg>
      );
    case 'cluster_mini':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]`}>
          <polygon points="12,6 18,18 6,18" fill="#10b981" stroke="#ffffff" strokeWidth="1.5" />
        </svg>
      );
    case 'phase_shifter':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_8px_rgba(139,92,246,0.9)]`}>
          <polygon points="12,2 18,5 22,11 20,18 14,22 8,20 2,14 4,7 9,3" fill="#8b5cf6" stroke="#ffffff" strokeWidth="1.5" opacity="0.85" />
          <circle cx="12" cy="12" r="3.5" fill="#e9d5ff" />
        </svg>
      );
    case 'boss':
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" className={`${baseClass} drop-shadow-[0_0_12px_rgba(168,85,247,0.95)]`}>
          <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" fill="#a855f7" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.9" />
          {/* Radiant vector apex crown emblem (crisp vector silhouette, no emoji/text) */}
          <path d="M7 16L6 10.5L9 12.5L12 8.5L15 12.5L18 10.5L17 16H7Z" fill="#fde047" stroke="#ffffff" strokeWidth="0.8" strokeLinejoin="round" />
          <circle cx="12" cy="6.5" r="1.2" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
          <circle cx="6" cy="8.5" r="0.9" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
          <circle cx="18" cy="8.5" r="0.9" fill="#fef08a" stroke="#ca8a04" strokeWidth="0.5" />
        </svg>
      );
    default:
      return <Skull className={className} style={{ width: size, height: size }} />;
  }
};
