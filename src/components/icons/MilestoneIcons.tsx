/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Shield, Skull, Target, Layers, Castle, Gem, CalendarCheck, Crosshair, 
  Compass, Trophy, Sparkles, Award, ShieldAlert, FlaskConical, Satellite, 
  Gauge, Activity, Star, ShieldCheck, Medal, Crown, Anchor, Zap, Radar, 
  Key, Flame, Radio, Atom, Disc, Telescope, CircleDot, Eclipse, Hexagon, 
  SunMedium, Timer, Infinity as InfinityIcon
} from 'lucide-react';
import { MilestoneDef } from '../../types';
import { CosmicShardBonusIcon } from './CosmicShardIcons';

export interface MilestoneVisualConfig {
  icon: React.ComponentType<{ className?: string; size?: number | string; strokeWidth?: number }>;
  color: string;
  bgColor: string;
  borderColor: string;
  glow: string;
}

/**
 * Custom Accretion Disk / Event Horizon SVG Icon
 * Used for deep cosmic singularity milestones.
 */
export const AccretionDiskIcon: React.FC<{ className?: string; size?: number | string }> = ({
  className = 'w-5 h-5',
  size = 20,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="accretionGrad" x1="2" y1="12" x2="22" y2="12" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#C084FC" />
        <stop offset="50%" stopColor="#38BDF8" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
    </defs>
    {/* Warped Relativistic Outer Orbit */}
    <ellipse cx="12" cy="12" rx="10" ry="4.5" transform="rotate(-25 12 12)" stroke="url(#accretionGrad)" strokeWidth="1.75" strokeDasharray="3 2" opacity="0.8" />
    {/* Inner Accretion Lensing Ring */}
    <circle cx="12" cy="12" r="6" stroke="#C084FC" strokeWidth="1.5" opacity="0.9" />
    {/* Event Horizon Black Hole Core */}
    <circle cx="12" cy="12" r="3.5" fill="#09090B" stroke="#F43F5E" strokeWidth="1.25" />
  </svg>
);

/**
 * Custom Transcendent Crown SVG Icon
 * Used for the culminating Tier 5 Wave 200 Transcendent God milestone.
 */
export const TranscendentCrownIcon: React.FC<{ className?: string; size?: number | string }> = ({
  className = 'w-5 h-5',
  size = 20,
}) => (
  <svg
    viewBox="0 0 24 24"
    width={size}
    height={size}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <defs>
      <linearGradient id="transCrownGrad" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#EC4899" />
        <stop offset="100%" stopColor="#A855F7" />
      </linearGradient>
    </defs>
    {/* Halo Aura Ring */}
    <ellipse cx="12" cy="6" rx="9" ry="2.5" stroke="#FDE047" strokeWidth="1" strokeDasharray="2 2" opacity="0.75" />
    {/* Crown Base Silhouette */}
    <path
      d="M3 18L4.5 9L9 13.5L12 6L15 13.5L19.5 9L21 18H3Z"
      stroke="url(#transCrownGrad)"
      strokeWidth="1.75"
      strokeLinejoin="round"
      fill="#581C87"
      fillOpacity="0.4"
    />
    {/* Base Rim */}
    <path d="M3 18H21V20.5H3V18Z" fill="#FACC15" stroke="#EAB308" strokeWidth="1" />
    {/* Inset Gemstones */}
    <circle cx="12" cy="10" r="1.5" fill="#38BDF8" />
    <circle cx="7" cy="14" r="1.2" fill="#F43F5E" />
    <circle cx="17" cy="14" r="1.2" fill="#F43F5E" />
    {/* Apex Star Node */}
    <circle cx="12" cy="6" r="1.2" fill="#FFFFFF" />
  </svg>
);

/**
 * Maps every actual milestone from INITIAL_MILESTONES to its verified visual styling & inline SVG icon.
 */
export function getMilestoneVisual(m: MilestoneDef): MilestoneVisualConfig {
  const key = `${m.tier}_${m.wave}`;

  switch (key) {
    // ========================================================
    // TIER 1: ORBITAL STATION (CADET & ROOKIE)
    // ========================================================
    case '1_3':
      return { 
        icon: Shield, 
        color: 'text-sky-400', 
        bgColor: 'bg-sky-950/60', 
        borderColor: 'border-sky-500/40', 
        glow: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]' 
      };
    case '1_5':
      return { 
        icon: Skull, 
        color: 'text-rose-400', 
        bgColor: 'bg-rose-950/60', 
        borderColor: 'border-rose-500/40', 
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
      };
    case '1_10':
      return { 
        icon: Target, 
        color: 'text-teal-400', 
        bgColor: 'bg-teal-950/60', 
        borderColor: 'border-teal-500/40', 
        glow: 'shadow-[0_0_12px_rgba(45,212,191,0.3)]' 
      };
    case '1_15':
      return { 
        icon: Layers, 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/50', 
        glow: 'shadow-[0_0_14px_rgba(251,191,36,0.35)]' 
      };
    case '1_20':
      return { 
        icon: Castle, 
        color: 'text-emerald-400', 
        bgColor: 'bg-emerald-950/60', 
        borderColor: 'border-emerald-500/40', 
        glow: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]' 
      };
    case '1_25':
      return { 
        icon: Gem, 
        color: 'text-sky-400', 
        bgColor: 'bg-sky-950/60', 
        borderColor: 'border-sky-500/40', 
        glow: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]' 
      };
    case '1_30':
      return { 
        icon: CalendarCheck, 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/50', 
        glow: 'shadow-[0_0_14px_rgba(251,191,36,0.35)]' 
      };
    case '1_40':
      return { 
        icon: Crosshair, 
        color: 'text-rose-400', 
        bgColor: 'bg-rose-950/60', 
        borderColor: 'border-rose-500/40', 
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
      };
    case '1_50':
      return { 
        icon: Compass, 
        color: 'text-cyan-400', 
        bgColor: 'bg-cyan-950/60', 
        borderColor: 'border-cyan-500/40', 
        glow: 'shadow-[0_0_12px_rgba(34,211,238,0.3)]' 
      };
    case '1_60':
      return { 
        icon: Trophy, 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/50', 
        glow: 'shadow-[0_0_14px_rgba(251,191,36,0.35)]' 
      };
    case '1_70':
      return { 
        icon: Sparkles, 
        color: 'text-purple-400', 
        bgColor: 'bg-purple-950/60', 
        borderColor: 'border-purple-500/50', 
        glow: 'shadow-[0_0_14px_rgba(168,85,247,0.35)]' 
      };
    case '1_75':
      return { 
        icon: Award, 
        color: 'text-amber-300', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/40', 
        glow: 'shadow-[0_0_12px_rgba(251,191,36,0.3)]' 
      };
    case '1_85':
      return { 
        icon: ShieldAlert, 
        color: 'text-orange-400', 
        bgColor: 'bg-orange-950/60', 
        borderColor: 'border-orange-500/40', 
        glow: 'shadow-[0_0_12px_rgba(251,146,60,0.3)]' 
      };
    case '1_100':
      return { 
        icon: FlaskConical, 
        color: 'text-emerald-400', 
        bgColor: 'bg-emerald-950/60', 
        borderColor: 'border-emerald-500/60', 
        glow: 'shadow-[0_0_16px_rgba(52,211,153,0.4)]' 
      };
    case '1_150':
      return { 
        icon: Satellite, 
        color: 'text-sky-300', 
        bgColor: 'bg-sky-950/60', 
        borderColor: 'border-sky-500/40', 
        glow: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]' 
      };
    case '1_200':
      return { 
        icon: Gauge, 
        color: 'text-cyan-400', 
        bgColor: 'bg-cyan-950/60', 
        borderColor: 'border-cyan-500/40', 
        glow: 'shadow-[0_0_12px_rgba(34,211,238,0.3)]' 
      };
    case '1_350':
      return { 
        icon: Activity, 
        color: 'text-rose-400', 
        bgColor: 'bg-rose-950/60', 
        borderColor: 'border-rose-500/40', 
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
      };
    case '1_500':
      return { 
        icon: Star, 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/40', 
        glow: 'shadow-[0_0_12px_rgba(251,191,36,0.3)]' 
      };
    case '1_750':
      return { 
        icon: ShieldCheck, 
        color: 'text-emerald-400', 
        bgColor: 'bg-emerald-950/60', 
        borderColor: 'border-emerald-500/50', 
        glow: 'shadow-[0_0_14px_rgba(52,211,153,0.35)]' 
      };
    case '1_831':
      return { 
        icon: Medal, 
        color: 'text-amber-300', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/60', 
        glow: 'shadow-[0_0_16px_rgba(251,191,36,0.4)]' 
      };
    case '1_1000':
      return { 
        icon: Crown, 
        color: 'text-yellow-400', 
        bgColor: 'bg-yellow-950/60', 
        borderColor: 'border-yellow-500/60', 
        glow: 'shadow-[0_0_18px_rgba(234,179,8,0.45)]' 
      };

    // ========================================================
    // TIER 2: ASTEROID BELT (MID-GAME VETERAN)
    // ========================================================
    case '2_10':
      return { 
        icon: Anchor, 
        color: 'text-blue-400', 
        bgColor: 'bg-blue-950/60', 
        borderColor: 'border-blue-500/40', 
        glow: 'shadow-[0_0_12px_rgba(96,165,250,0.3)]' 
      };
    case '2_20':
      return { 
        icon: Zap, 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/40', 
        glow: 'shadow-[0_0_12px_rgba(251,191,36,0.3)]' 
      };
    case '2_25':
      return { 
        icon: Crosshair, 
        color: 'text-sky-400', 
        bgColor: 'bg-sky-950/60', 
        borderColor: 'border-sky-500/40', 
        glow: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]' 
      };
    case '2_35':
      return { 
        icon: Radar, 
        color: 'text-teal-400', 
        bgColor: 'bg-teal-950/60', 
        borderColor: 'border-teal-500/40', 
        glow: 'shadow-[0_0_12px_rgba(45,212,191,0.3)]' 
      };
    case '2_50':
      return { 
        icon: ShieldCheck, 
        color: 'text-emerald-400', 
        bgColor: 'bg-emerald-950/60', 
        borderColor: 'border-emerald-500/40', 
        glow: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]' 
      };
    case '2_75':
      return { 
        icon: Skull, 
        color: 'text-rose-400', 
        bgColor: 'bg-rose-950/60', 
        borderColor: 'border-rose-500/40', 
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
      };
    case '2_100':
      return { 
        icon: Key, 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/50', 
        glow: 'shadow-[0_0_14px_rgba(251,191,36,0.35)]' 
      };
    case '2_125':
      return { 
        icon: Layers, 
        color: 'text-purple-400', 
        bgColor: 'bg-purple-950/60', 
        borderColor: 'border-purple-500/40', 
        glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' 
      };
    case '2_150':
      return { 
        icon: Flame, 
        color: 'text-orange-400', 
        bgColor: 'bg-orange-950/60', 
        borderColor: 'border-orange-500/40', 
        glow: 'shadow-[0_0_12px_rgba(251,146,60,0.3)]' 
      };
    case '2_200':
      return { 
        icon: Castle, 
        color: 'text-emerald-400', 
        bgColor: 'bg-emerald-950/60', 
        borderColor: 'border-emerald-500/40', 
        glow: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]' 
      };
    case '2_250':
      return { 
        icon: Skull, 
        color: 'text-rose-400', 
        bgColor: 'bg-rose-950/60', 
        borderColor: 'border-rose-500/50', 
        glow: 'shadow-[0_0_14px_rgba(244,63,94,0.35)]' 
      };
    case '2_300':
      return { 
        icon: Sparkles, 
        color: 'text-purple-300', 
        bgColor: 'bg-purple-950/60', 
        borderColor: 'border-purple-500/40', 
        glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' 
      };
    case '2_400':
      return { 
        icon: Crosshair, 
        color: 'text-red-400', 
        bgColor: 'bg-red-950/60', 
        borderColor: 'border-red-500/50', 
        glow: 'shadow-[0_0_14px_rgba(239,68,68,0.35)]' 
      };
    case '2_500':
      return { 
        icon: Crown, 
        color: 'text-emerald-400', 
        bgColor: 'bg-emerald-950/60', 
        borderColor: 'border-emerald-500/60', 
        glow: 'shadow-[0_0_16px_rgba(52,211,153,0.4)]' 
      };

    // ========================================================
    // TIER 3: DEEP NEBULA (NIGHTMARE FRONTIERS)
    // ========================================================
    case '3_10':
      return { 
        icon: Activity, 
        color: 'text-rose-400', 
        bgColor: 'bg-rose-950/60', 
        borderColor: 'border-rose-500/40', 
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
      };
    case '3_20':
      return { 
        icon: Disc, 
        color: 'text-purple-400', 
        bgColor: 'bg-purple-950/60', 
        borderColor: 'border-purple-500/40', 
        glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' 
      };
    case '3_25':
      return { 
        icon: Flame, 
        color: 'text-rose-400', 
        bgColor: 'bg-rose-950/60', 
        borderColor: 'border-rose-500/40', 
        glow: 'shadow-[0_0_12px_rgba(244,63,94,0.3)]' 
      };
    case '3_35':
      return { 
        icon: Radio, 
        color: 'text-cyan-400', 
        bgColor: 'bg-cyan-950/60', 
        borderColor: 'border-cyan-500/40', 
        glow: 'shadow-[0_0_12px_rgba(34,211,238,0.3)]' 
      };
    case '3_50':
      return { 
        icon: Skull, 
        color: 'text-purple-400', 
        bgColor: 'bg-purple-950/60', 
        borderColor: 'border-purple-500/50', 
        glow: 'shadow-[0_0_14px_rgba(168,85,247,0.35)]' 
      };
    case '3_75':
      return { 
        icon: Atom, 
        color: 'text-sky-400', 
        bgColor: 'bg-sky-950/60', 
        borderColor: 'border-sky-500/40', 
        glow: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]' 
      };
    case '3_100':
      return { 
        icon: Key, 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/50', 
        glow: 'shadow-[0_0_14px_rgba(251,191,36,0.35)]' 
      };
    case '3_150':
      return { 
        icon: AccretionDiskIcon, 
        color: 'text-purple-300', 
        bgColor: 'bg-purple-950/60', 
        borderColor: 'border-purple-500/50', 
        glow: 'shadow-[0_0_14px_rgba(168,85,247,0.35)]' 
      };
    case '3_200':
      return { 
        icon: Award, 
        color: 'text-purple-400', 
        bgColor: 'bg-purple-950/60', 
        borderColor: 'border-purple-500/50', 
        glow: 'shadow-[0_0_14px_rgba(168,85,247,0.35)]' 
      };
    case '3_300':
      return { 
        icon: Telescope, 
        color: 'text-teal-400', 
        bgColor: 'bg-teal-950/60', 
        borderColor: 'border-teal-500/40', 
        glow: 'shadow-[0_0_12px_rgba(45,212,191,0.3)]' 
      };
    case '3_500':
      return { 
        icon: Crown, 
        color: 'text-purple-400', 
        bgColor: 'bg-purple-950/60', 
        borderColor: 'border-purple-500/60', 
        glow: 'shadow-[0_0_16px_rgba(168,85,247,0.4)]' 
      };

    // ========================================================
    // TIER 4: VOID RIFT SECTOR
    // ========================================================
    case '4_10':
      return { 
        icon: Disc, 
        color: 'text-indigo-400', 
        bgColor: 'bg-indigo-950/60', 
        borderColor: 'border-indigo-500/40', 
        glow: 'shadow-[0_0_12px_rgba(129,140,248,0.3)]' 
      };
    case '4_20':
      return { 
        icon: CircleDot, 
        color: 'text-purple-400', 
        bgColor: 'bg-purple-950/60', 
        borderColor: 'border-purple-500/40', 
        glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' 
      };
    case '4_25':
      return { 
        icon: ShieldCheck, 
        color: 'text-emerald-400', 
        bgColor: 'bg-emerald-950/60', 
        borderColor: 'border-emerald-500/40', 
        glow: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]' 
      };
    case '4_35':
      return { 
        icon: Eclipse, 
        color: 'text-rose-400', 
        bgColor: 'bg-rose-950/60', 
        borderColor: 'border-rose-500/50', 
        glow: 'shadow-[0_0_14px_rgba(244,63,94,0.35)]' 
      };
    case '4_50':
      return { 
        icon: Castle, 
        color: 'text-sky-400', 
        bgColor: 'bg-sky-950/60', 
        borderColor: 'border-sky-500/40', 
        glow: 'shadow-[0_0_12px_rgba(56,189,248,0.3)]' 
      };
    case '4_75':
      return { 
        icon: Hexagon, 
        color: 'text-indigo-300', 
        bgColor: 'bg-indigo-950/60', 
        borderColor: 'border-indigo-500/40', 
        glow: 'shadow-[0_0_12px_rgba(129,140,248,0.3)]' 
      };
    case '4_100':
      return { 
        icon: Key, 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/50', 
        glow: 'shadow-[0_0_14px_rgba(251,191,36,0.35)]' 
      };
    case '4_150':
      return { 
        icon: SunMedium, 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/50', 
        glow: 'shadow-[0_0_14px_rgba(251,191,36,0.35)]' 
      };
    case '4_200':
      return { 
        icon: Crown, 
        color: 'text-rose-400', 
        bgColor: 'bg-rose-950/60', 
        borderColor: 'border-rose-500/60', 
        glow: 'shadow-[0_0_16px_rgba(244,63,94,0.4)]' 
      };
    case '4_300':
      return { 
        icon: Zap, 
        color: 'text-cyan-400', 
        bgColor: 'bg-cyan-950/60', 
        borderColor: 'border-cyan-500/50', 
        glow: 'shadow-[0_0_14px_rgba(34,211,238,0.35)]' 
      };

    // ========================================================
    // TIER 5: CELESTIAL CORE (ENDGAME TRANSCENDENCE)
    // ========================================================
    case '5_10':
      return { 
        icon: AccretionDiskIcon, 
        color: 'text-fuchsia-400', 
        bgColor: 'bg-fuchsia-950/60', 
        borderColor: 'border-fuchsia-500/40', 
        glow: 'shadow-[0_0_12px_rgba(232,121,249,0.3)]' 
      };
    case '5_20':
      return { 
        icon: Eclipse, 
        color: 'text-purple-400', 
        bgColor: 'bg-purple-950/60', 
        borderColor: 'border-purple-500/40', 
        glow: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]' 
      };
    case '5_25':
      return { 
        icon: Zap, 
        color: 'text-rose-400', 
        bgColor: 'bg-rose-950/60', 
        borderColor: 'border-rose-500/50', 
        glow: 'shadow-[0_0_14px_rgba(244,63,94,0.35)]' 
      };
    case '5_35':
      return { 
        icon: Timer, 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/40', 
        glow: 'shadow-[0_0_12px_rgba(251,191,36,0.3)]' 
      };
    case '5_50':
      return { 
        icon: Castle, 
        color: 'text-teal-400', 
        bgColor: 'bg-teal-950/60', 
        borderColor: 'border-teal-500/40', 
        glow: 'shadow-[0_0_12px_rgba(45,212,191,0.3)]' 
      };
    case '5_75':
      return { 
        icon: SunMedium, 
        color: 'text-amber-300', 
        bgColor: 'bg-amber-950/60', 
        borderColor: 'border-amber-500/50', 
        glow: 'shadow-[0_0_14px_rgba(251,191,36,0.35)]' 
      };
    case '5_100':
      return { 
        icon: Medal, 
        color: 'text-purple-300', 
        bgColor: 'bg-purple-950/60', 
        borderColor: 'border-purple-500/50', 
        glow: 'shadow-[0_0_14px_rgba(168,85,247,0.35)]' 
      };
    case '5_150':
      return { 
        icon: InfinityIcon, 
        color: 'text-cyan-400', 
        bgColor: 'bg-cyan-950/60', 
        borderColor: 'border-cyan-500/60', 
        glow: 'shadow-[0_0_16px_rgba(34,211,238,0.4)]' 
      };
    case '5_200':
      return { 
        icon: TranscendentCrownIcon, 
        color: 'text-fuchsia-300', 
        bgColor: 'bg-fuchsia-950/70', 
        borderColor: 'border-fuchsia-500/70', 
        glow: 'shadow-[0_0_20px_rgba(232,121,249,0.5)]' 
      };

    default:
      if (m.rewardType === 'gems') {
        return { 
          icon: Gem, 
          color: 'text-sky-400', 
          bgColor: 'bg-sky-950/50', 
          borderColor: 'border-sky-500/40', 
          glow: 'shadow-[0_0_10px_rgba(56,189,248,0.2)]' 
        };
      }
      if (m.rewardType === 'shards') {
        return { 
          icon: CosmicShardBonusIcon, 
          color: 'text-purple-400', 
          bgColor: 'bg-purple-950/50', 
          borderColor: 'border-purple-500/40', 
          glow: 'shadow-[0_0_10px_rgba(168,85,247,0.2)]' 
        };
      }
      return { 
        icon: Key, 
        color: 'text-amber-400', 
        bgColor: 'bg-amber-950/50', 
        borderColor: 'border-amber-500/40', 
        glow: 'shadow-[0_0_10px_rgba(251,191,36,0.2)]' 
      };
  }
}
