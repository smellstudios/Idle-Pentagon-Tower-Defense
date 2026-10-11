/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  BookOpen, 
  Volume2, 
  VolumeX, 
  Target, 
  Lock, 
  FlaskConical, 
  Sparkles, 
  TrendingUp, 
  RotateCcw, 
  Layers, 
  Sword, 
  ChevronDown, 
  ChevronUp, 
  MoreHorizontal, 
  Skull, 
  ChevronRight, 
  X,
  FastForward,
  Pause 
} from 'lucide-react';
import { GameState } from '../types';
import { soundEngine } from '../game/sound';
import { formatCurrency } from '../utils/format';
import { getTierDifficultyMultiplier, getTierCashMultiplier, calculateAscensionShards } from '../game/constants';

interface Props {
  gameState: GameState;
  onOpenSettings?: () => void;
  onOpenCodex?: () => void;
  onOpenMissions?: () => void;
  onOpenLab?: () => void;
  onOpenCompendium?: () => void;
  onOpenProgressionCurves?: () => void;
  onOpenAscension?: () => void;
  onOpenSkillTree?: () => void;
  onToggleUpgrades?: () => void;
  isUpgradesOpen?: boolean;
}

const CurrencyBadge: React.FC<{
  value: number;
  symbol: React.ReactNode;
  colorTheme: 'emerald' | 'purple' | 'sky' | 'amber';
  title: string;
  useLegacyFormat?: boolean;
  multiplier?: string;
}> = ({ value, symbol, colorTheme, title, useLegacyFormat, multiplier }) => {
  const [recentGain, setRecentGain] = useState<number | null>(null);
  const [pulseTrigger, setPulseTrigger] = useState(0);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const delta = value - prevValueRef.current;
    if (delta > 0) {
      setRecentGain(delta);
      setPulseTrigger(p => p + 1);
      const timer = setTimeout(() => {
        setRecentGain(null);
      }, 600);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);

  const themes = {
    emerald: {
      bg: 'bg-zinc-950/90 border-emerald-500/35 shadow-[0_0_8px_rgba(16,185,129,0.12)]',
      text: 'text-emerald-400 font-mono text-[9.5px] sm:text-xs font-black leading-none',
      num: 'font-mono text-[10px] sm:text-xs font-black text-emerald-100 leading-none tabular-nums tracking-tight',
      gain: 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.9)]',
      glow: ['0 0 8px rgba(16,185,129,0.15)', '0 0 16px rgba(52,211,153,0.7)', '0 0 8px rgba(16,185,129,0.15)']
    },
    purple: {
      bg: 'bg-zinc-950/90 border-purple-500/35 shadow-[0_0_8px_rgba(168,85,247,0.15)]',
      text: 'text-purple-400 font-mono text-[9.5px] sm:text-xs font-black leading-none',
      num: 'font-mono text-[10px] sm:text-xs font-black text-purple-100 leading-none tabular-nums tracking-tight',
      gain: 'text-purple-300 drop-shadow-[0_0_8px_rgba(168,85,247,0.9)]',
      glow: ['0 0 8px rgba(168,85,247,0.2)', '0 0 16px rgba(192,132,252,0.7)', '0 0 8px rgba(168,85,247,0.2)']
    },
    sky: {
      bg: 'bg-zinc-950/90 border-sky-500/35 shadow-[0_0_8px_rgba(56,189,248,0.12)]',
      text: 'text-sky-400 font-mono text-[9.5px] sm:text-xs font-black leading-none',
      num: 'font-mono text-[10px] sm:text-xs font-bold text-sky-200 leading-none tabular-nums tracking-tight',
      gain: 'text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.9)]',
      glow: ['0 0 8px rgba(56,189,248,0.15)', '0 0 16px rgba(56,189,248,0.6)', '0 0 8px rgba(56,189,248,0.15)']
    },
    amber: {
      bg: 'bg-zinc-950/90 border-amber-500/35 shadow-sm',
      text: 'text-amber-400 font-mono text-[9.5px] sm:text-xs font-black leading-none',
      num: 'font-mono text-[10px] sm:text-xs font-bold text-amber-200 leading-none tabular-nums tracking-tight',
      gain: 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]',
      glow: ['0 0 8px rgba(251,191,36,0.15)', '0 0 16px rgba(251,191,36,0.6)', '0 0 8px rgba(251,191,36,0.15)']
    }
  }[colorTheme];

  return (
    <div className="relative shrink-0 select-none">
      <motion.div
        animate={pulseTrigger > 0 ? {
          scale: [1, 1.08, 0.98, 1],
          boxShadow: themes.glow,
        } : { scale: 1 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        title={title}
        className={`flex items-center gap-1 sm:gap-1.5 backdrop-blur-md px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg border ${themes.bg} transition-all`}
      >
        <span className={themes.text}>{symbol}</span>
        <span className={themes.num}>
          {formatCurrency(value, useLegacyFormat)}
        </span>
        {multiplier && (
          <span className="hidden xs:inline sm:inline text-[7.5px] font-mono font-black opacity-60 ml-0.5 tracking-tighter">
            {multiplier}
          </span>
        )}
      </motion.div>

      <AnimatePresence>
        {recentGain !== null && (
          <motion.span
            key={pulseTrigger}
            initial={{ opacity: 1, y: 0, scale: 0.8 }}
            animate={{ opacity: 0, y: -12, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={`absolute -top-3.5 right-0 font-mono text-[8.5px] sm:text-[9.5px] font-black pointer-events-none z-20 whitespace-nowrap ${themes.gain}`}
          >
            +{formatCurrency(recentGain, useLegacyFormat)}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};

export const Header: React.FC<Props> = ({
  gameState,
  onOpenSettings,
  onOpenCodex,
  onOpenMissions,
  onOpenLab,
  onOpenCompendium,
  onOpenProgressionCurves,
  onOpenAscension,
  onOpenSkillTree,
  onToggleUpgrades,
  isUpgradesOpen = true,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [isUtilityMenuOpen, setIsUtilityMenuOpen] = useState(false);
  const utilityMenuRef = useRef<HTMLDivElement>(null);

  const handleToggleMute = useCallback(() => {
    const nextMute = soundEngine.toggleMute();
    setIsMuted(nextMute);
  }, []);

  // Close utility menu on outside click or Escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (utilityMenuRef.current && !utilityMenuRef.current.contains(e.target as Node)) {
        setIsUtilityMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUtilityMenuOpen(false);
      }
    };

    if (isUtilityMenuOpen) {
      window.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isUtilityMenuOpen]);

  const currentRunWave = Math.max(gameState.wave || 1, gameState.highestWaveThisRun || 1);
  const liveHarvestableShards = calculateAscensionShards(currentRunWave, 1.0, gameState.tier || 1);

  const isMissionsUnlocked = Boolean(gameState.unlockedSystems?.missions || (gameState.highestWaveEver || 0) >= 30);
  const isLabUnlocked = Boolean(gameState.unlockedSystems?.labs || (gameState.highestWaveEver || 0) >= 30);
  const readyMissions = isMissionsUnlocked
    ? (gameState.missions?.filter(m => m.current >= m.target && !m.isClaimed) || [])
    : [];
  const readyCount = readyMissions.length;
  const activeMissions = gameState.missions?.filter(m => !m.isClaimed) || [];
  const totalMissions = gameState.missions?.length || 3;
  const completedMissions = totalMissions - activeMissions.length;

  return (
    <header className="absolute top-0 left-0 right-0 pt-[max(env(safe-area-inset-top),0.35rem)] px-2 sm:px-3 pb-1 pointer-events-none z-30 select-none overflow-visible flex flex-col gap-1">
      {/* 1. TOP ROW: Currencies on Left, Tactical Utilities & Actions on Right */}
      <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 pointer-events-none">
        
        {/* LEFT: Currencies Deck (Unified Cyber Dock, non-wrapping) */}
        <div className="flex items-center gap-1 sm:gap-1.5 p-0.5 sm:p-1 bg-zinc-950/85 border border-white/10 rounded-xl backdrop-blur-md shadow-md pointer-events-auto shrink-0 z-10">
          {/* In-Run Cash */}
          <CurrencyBadge
            value={gameState.cash}
            symbol="$"
            colorTheme="emerald"
            title={`In-Run Cash ($): Earned from enemy kills & wave bonuses. Current Tier ${gameState.tier || 1} Cash Multiplier: ${getTierCashMultiplier(gameState.tier || 1)}x (+5% per tier). Enemy Difficulty: ${getTierDifficultyMultiplier(gameState.tier || 1)}x.`}
            useLegacyFormat={gameState.settings?.useLegacyCurrencyFormat}
            multiplier={`x${getTierCashMultiplier(gameState.tier || 1)}`}
          />

          {/* Permanent Cosmic Shards */}
          <CurrencyBadge
            value={gameState.cosmicShards}
            symbol="✦"
            colorTheme="purple"
            title="Cosmic Shards (✦): Permanent meta-currency earned on runs/milestones. Spent in Workshop & Tech Matrix."
            useLegacyFormat={gameState.settings?.useLegacyCurrencyFormat}
          />

          {/* Premium Gems */}
          <CurrencyBadge
            value={gameState.gems}
            symbol="💎"
            colorTheme="sky"
            title="Gems (💎): Premium currency earned from daily missions & milestones. Spent on card packs & slots."
            useLegacyFormat={gameState.settings?.useLegacyCurrencyFormat}
          />

          {/* Bio Cell Fuel (Only visible when player holds cells > 0) */}
          {gameState.cells > 0 && (
            <CurrencyBadge
              value={gameState.cells}
              symbol="🧪"
              colorTheme="amber"
              title="Bio Cell Fuel (🧪): Earned from bosses & rare enemies once Lab is unlocked. Used for Lab Research."
              useLegacyFormat={gameState.settings?.useLegacyCurrencyFormat}
            />
          )}
        </div>

        {/* RIGHT: Unified Action Deck (ZERO side-scrolling, high-efficiency responsive layout) */}
        <div className="relative flex items-center gap-1 pointer-events-auto shrink-0 z-10 overflow-visible" ref={utilityMenuRef}>
          
          {/* Missions Action Button */}
          {onOpenMissions && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                onOpenMissions();
              }}
              title={
                !isMissionsUnlocked
                  ? "Daily Missions & Tactical Contracts (Unlocks at Wave 30)"
                  : readyCount > 0
                  ? `${readyCount} Mission Reward${readyCount > 1 ? 's' : ''} Ready to Claim!`
                  : "Daily Missions & Contracts Tracker"
              }
              className={`flex items-center gap-1 px-1.5 sm:px-2 py-1 rounded-lg transition-all active:scale-95 cursor-pointer relative border font-mono text-[9px] sm:text-[10px] shrink-0 ${
                !isMissionsUnlocked
                  ? 'bg-zinc-900/60 border-white/5 text-zinc-500 hover:text-zinc-300'
                  : readyCount > 0
                  ? 'bg-gradient-to-r from-sky-950/90 to-emerald-950/90 border-emerald-500/50 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.3)] animate-pulse'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-sky-500/30 text-sky-200 hover:text-white hover:border-sky-400'
              }`}
            >
              <Target className={`w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0 ${
                !isMissionsUnlocked 
                  ? 'text-zinc-600' 
                  : readyCount > 0 
                  ? 'text-emerald-400 animate-bounce' 
                  : 'text-sky-400'
              }`} />

              <div className="flex items-center gap-0.5 font-bold leading-none">
                <span className="hidden xl:inline font-black tracking-wider uppercase">
                  MISSIONS
                </span>

                {!isMissionsUnlocked ? (
                  <span className="flex items-center gap-0.5 px-0.5 py-0.2 rounded bg-zinc-950 text-zinc-500 text-[7px] sm:text-[8px] font-black border border-white/5">
                    <Lock className="w-1.5 h-1.5" /> W30
                  </span>
                ) : readyCount > 0 ? (
                  <span className="bg-gradient-to-r from-emerald-400 to-teal-300 text-black text-[7.5px] sm:text-[8px] font-black px-1 rounded-full">
                    {readyCount}
                  </span>
                ) : (
                  <span className="hidden sm:inline text-[7.5px] sm:text-[8px] font-bold text-sky-400/95 bg-sky-950/60 px-0.5 py-0.2 rounded border border-sky-500/20">
                    {completedMissions}/{totalMissions}
                  </span>
                )}
              </div>
            </button>
          )}

          {/* In-Run Upgrades Drawer Toggle Button */}
          {onToggleUpgrades && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                onToggleUpgrades();
              }}
              title={isUpgradesOpen ? "Close In-Run Upgrade Panel (Toggle)" : "Open In-Run Upgrade Panel (Toggle)"}
              className={`flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 rounded-lg font-mono text-[9px] sm:text-[10px] font-bold transition-all active:scale-95 cursor-pointer shrink-0 border ${
                isUpgradesOpen
                  ? 'bg-cyan-950/90 border-cyan-500/50 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 border-cyan-500/30 text-cyan-400 hover:text-cyan-200'
              }`}
            >
              <Sword className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-cyan-400 shrink-0" />
              <span className="hidden xl:inline uppercase tracking-wider">UPGRADES</span>
              {isUpgradesOpen ? (
                <ChevronDown className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              ) : (
                <ChevronUp className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
              )}
            </button>
          )}

          {/* Cosmic Ascension (Soft-Reset Prestige) Action Button - only on mobile when shards > 0 */}
          {onOpenAscension && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                onOpenAscension();
              }}
              title={`Cosmic Ascension: Soft-reset to claim +${liveHarvestableShards} Cosmic Shards / Tokens`}
              className={`items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-1 rounded-lg bg-gradient-to-r from-purple-950/90 to-indigo-950/90 hover:from-purple-900 hover:to-indigo-900 border border-purple-500/50 text-purple-200 font-mono text-[9px] sm:text-[10px] font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)] transition-all active:scale-95 cursor-pointer shrink-0 ${
                liveHarvestableShards > 0 ? 'flex' : 'hidden md:flex'
              }`}
            >
              <RotateCcw className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-purple-400 shrink-0" />
              <span className="hidden md:inline uppercase tracking-wider">ASCEND</span>
              <span className="text-[8px] sm:text-[9px] font-black text-purple-300 bg-purple-900/60 px-1 py-0.2 rounded border border-purple-500/30">
                +{liveHarvestableShards}✦
              </span>
            </button>
          )}

          {/* Permanent Skill Tree Matrix Button (Tablet & Desktop, or via Menu on phone) */}
          {onOpenSkillTree && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                onOpenSkillTree();
              }}
              title="Open Permanent Skill Tree & Matrix (Spend Cosmic Shards)"
              className="hidden sm:flex items-center justify-center shrink-0 w-6 h-6 sm:w-7 sm:h-7 bg-purple-950/70 hover:bg-purple-900 border border-purple-500/50 text-purple-300 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
            >
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-purple-400" />
            </button>
          )}

          {/* Research Laboratory Button (Tablet & Desktop, or via Menu on phone) */}
          {onOpenLab && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                onOpenLab();
              }}
              title={isLabUnlocked ? "Open Research Synthesis Laboratory" : "Research Laboratory (Unlocked at Wave 30)"}
              className={`hidden sm:flex items-center justify-center shrink-0 w-6 h-6 sm:w-7 sm:h-7 border rounded-lg transition-all active:scale-90 cursor-pointer relative ${
                isLabUnlocked
                  ? 'bg-teal-950/70 hover:bg-teal-900 border-teal-500/50 text-teal-300 hover:text-white'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 border-teal-500/30 text-teal-400 hover:border-teal-500/60'
              }`}
            >
              {isLabUnlocked ? (
                <FlaskConical className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              ) : (
                <span className="font-mono font-black text-[11px] sm:text-xs text-teal-400">?</span>
              )}
              {isLabUnlocked && gameState.labSlots?.some(s => s.isCompleted) && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              )}
            </button>
          )}

          {/* Direct Shortcuts on Large Screens (lg: / xl:) */}
          <div className="hidden lg:flex items-center gap-1 shrink-0">
            {/* Tactical Skills Matrix */}
            {onOpenCompendium && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTabSwitch();
                  onOpenCompendium();
                }}
                title="Tactical Skills & Synergy Matrix Forge"
                className="flex items-center justify-center shrink-0 w-7 h-7 bg-amber-950/60 hover:bg-amber-900 border border-amber-500/50 text-amber-300 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Codex */}
            {onOpenCodex && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTabSwitch();
                  onOpenCodex();
                }}
                title="Cosmic Codex & Mechanics Guide"
                className="flex items-center justify-center shrink-0 w-7 h-7 bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-300 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Progression Curves */}
            {onOpenProgressionCurves && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTabSwitch();
                  onOpenProgressionCurves();
                }}
                title="Progression Math & Scaling Curves"
                className="flex items-center justify-center shrink-0 w-7 h-7 bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-400 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer"
              >
                <TrendingUp className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Audio Mute */}
            <button
              type="button"
              onClick={handleToggleMute}
              title={isMuted ? "Unmute Audio" : "Mute Audio"}
              className={`flex items-center justify-center shrink-0 w-7 h-7 rounded-lg transition-all active:scale-90 cursor-pointer border ${
                isMuted 
                  ? 'bg-rose-950/60 border-rose-500/40 text-rose-400 hover:text-rose-300' 
                  : 'bg-zinc-900/90 border-sky-500/30 text-sky-400 hover:text-sky-300'
              }`}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Settings */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTabSwitch();
                  onOpenSettings();
                }}
                title="System Settings"
                className="flex items-center justify-center shrink-0 w-7 h-7 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/60 text-zinc-300 hover:text-white rounded-lg transition-all active:scale-90 cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* More / System Utilities Dropdown Button (Available on all screens to eliminate horizontal scrolling) */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playTabSwitch();
              setIsUtilityMenuOpen(prev => !prev);
            }}
            title="More Utilities & System Options"
            aria-expanded={isUtilityMenuOpen}
            className={`flex items-center justify-center shrink-0 w-6 h-6 sm:w-7 sm:h-7 rounded-lg border transition-all active:scale-90 cursor-pointer relative ${
              isUtilityMenuOpen
                ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                : 'bg-zinc-900/80 hover:bg-zinc-800 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Floating Quick Utilities Menu Popover */}
          <AnimatePresence>
            {isUtilityMenuOpen && (
              <>
                {/* Invisible Click-catcher */}
                <div 
                  className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[1px]" 
                  onClick={() => setIsUtilityMenuOpen(false)}
                />

                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -6 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute top-full right-0 mt-1.5 z-50 w-64 sm:w-72 rounded-2xl bg-[#030712]/95 border border-cyan-500/30 p-2 shadow-[0_16px_40px_rgba(0,0,0,0.9)] backdrop-blur-xl flex flex-col gap-1 select-none pointer-events-auto"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-2 py-1 border-b border-white/10 mb-1">
                    <span className="font-mono font-black text-[10px] text-cyan-300 tracking-wider uppercase">
                      SYSTEM UTILITIES
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsUtilityMenuOpen(false)}
                      className="p-0.5 rounded text-zinc-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 1. Audio Mute Toggle */}
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleMute();
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 transition-all text-left cursor-pointer active:scale-98"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg border ${
                        isMuted ? 'bg-rose-950/60 border-rose-500/40 text-rose-400' : 'bg-sky-950/60 border-sky-500/40 text-sky-400'
                      }`}>
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                      </div>
                      <div>
                        <div className="text-[11px] font-mono font-bold text-white leading-tight">Audio & SFX</div>
                        <div className="text-[9px] font-mono text-zinc-400 leading-tight">Master volume control</div>
                      </div>
                    </div>
                    <span className={`text-[8.5px] font-mono font-black px-1.5 py-0.5 rounded border ${
                      isMuted ? 'bg-rose-950 border-rose-500/30 text-rose-300' : 'bg-emerald-950 border-emerald-500/30 text-emerald-300'
                    }`}>
                      {isMuted ? 'MUTED' : 'ACTIVE'}
                    </span>
                  </button>

                  {/* 2. Tactical Skills Matrix (Compendium) */}
                  {onOpenCompendium && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playTabSwitch();
                        setIsUtilityMenuOpen(false);
                        onOpenCompendium();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 transition-all text-left cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-400">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-mono font-bold text-white leading-tight">Tactical Matrix</div>
                          <div className="text-[9px] font-mono text-zinc-400 leading-tight">Active rare skill synthesis</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  )}

                  {/* 3. Cosmic Codex */}
                  {onOpenCodex && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playTabSwitch();
                        setIsUtilityMenuOpen(false);
                        onOpenCodex();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 transition-all text-left cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-400">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-mono font-bold text-white leading-tight">Cosmic Codex</div>
                          <div className="text-[9px] font-mono text-zinc-400 leading-tight">Tower manual & mechanics lore</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  )}

                  {/* 4. Progression Curves Inspector */}
                  {onOpenProgressionCurves && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playTabSwitch();
                        setIsUtilityMenuOpen(false);
                        onOpenProgressionCurves();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 transition-all text-left cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-400">
                          <TrendingUp className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-mono font-bold text-white leading-tight">Progression Curves</div>
                          <div className="text-[9px] font-mono text-zinc-400 leading-tight">Desmos wave math & scaling</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  )}

                  {/* 5. Permanent Skill Tree Matrix */}
                  {onOpenSkillTree && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playTabSwitch();
                        setIsUtilityMenuOpen(false);
                        onOpenSkillTree();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 transition-all text-left cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-400">
                          <Layers className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-mono font-bold text-white leading-tight">Skill Tree Matrix</div>
                          <div className="text-[9px] font-mono text-zinc-400 leading-tight">Permanent perk matrix</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  )}

                  {/* 6. Research Laboratory */}
                  {onOpenLab && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playTabSwitch();
                        setIsUtilityMenuOpen(false);
                        onOpenLab();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 transition-all text-left cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-teal-950/60 border border-teal-500/40 text-teal-400">
                          <FlaskConical className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-mono font-bold text-white leading-tight">
                            Research Lab {!isLabUnlocked && <span className="text-[8px] text-zinc-500">(W30)</span>}
                          </div>
                          <div className="text-[9px] font-mono text-zinc-400 leading-tight">Lab syntheses & attributes</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  )}

                  {/* 7. System Settings */}
                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playTabSwitch();
                        setIsUtilityMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-900/60 hover:bg-zinc-800/80 border border-white/5 transition-all text-left cursor-pointer active:scale-98"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-zinc-800/80 border border-zinc-600/40 text-zinc-300">
                          <Settings className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-[11px] font-mono font-bold text-white leading-tight">System Settings</div>
                          <div className="text-[9px] font-mono text-zinc-400 leading-tight">Graphics, telemetry & reset</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />
                    </button>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 2. DEDICATED WAVE PROGRESSION CAPSULE (Centered on its own tier below - 100% collision-free) */}
      {!gameState.isDead && !gameState.activeBoss && (
        <div className="flex justify-center pointer-events-auto">
          <div className="flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-zinc-950/85 border border-cyan-500/40 shadow-[0_2px_12px_rgba(6,182,212,0.25)] backdrop-blur-md">
            {/* Wave Badge & Tier */}
            <div className="flex items-center gap-1 font-mono font-black text-[10px] sm:text-xs text-white leading-none shrink-0">
              <span className="text-cyan-400 font-extrabold tracking-wide">WAVE</span>
              <span className="text-white tabular-nums">{gameState.wave || 1}</span>
              {gameState.tier && gameState.tier > 1 && (
                <span className="text-[7.5px] sm:text-[8.5px] font-bold text-amber-300 bg-amber-950/80 border border-amber-500/50 px-1 py-0.2 rounded-full">
                  T{gameState.tier}
                </span>
              )}
            </div>

            {/* Glowing Sci-Fi Wave Progress Bar & Percentage */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-16 xs:w-20 sm:w-28 md:w-36 h-1.5 sm:h-2 bg-black/90 rounded-full border border-cyan-500/50 p-[1px] overflow-hidden shadow-inner">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 rounded-full transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.max(0, Math.round((gameState.waveProgress || 0) * 100)))}%` }}
                />
              </div>
              <span className="font-mono text-[8.5px] sm:text-[9.5px] font-bold text-cyan-300 tabular-nums shrink-0">
                {Math.round((gameState.waveProgress || 0) * 100)}%
              </span>
            </div>

            {/* Game Speed Capsule Indicator */}
            {gameState.gameSpeed === 0 ? (
              <div 
                title="Simulation is paused (0x)"
                className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-rose-500/20 border border-rose-400/50 text-rose-300 font-mono text-[8px] font-black shrink-0 animate-pulse"
              >
                <Pause className="w-2.5 h-2.5 text-rose-400 shrink-0" />
                <span>PAUSED (0x)</span>
              </div>
            ) : gameState.gameSpeed === 0.5 ? (
              <div 
                title="Simulation is running at half speed (0.5x slow-mo)"
                className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-sky-500/20 border border-sky-400/50 text-sky-300 font-mono text-[8px] font-black shrink-0"
              >
                <span>0.5x SLOW</span>
              </div>
            ) : gameState.gameSpeed && gameState.gameSpeed > 1.0 ? (
              <div 
                title={`Simulation time is accelerated (${gameState.gameSpeed.toFixed(1)}x speed)`}
                className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 font-mono text-[8px] font-black shrink-0 animate-pulse"
              >
                <FastForward className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                <span>{gameState.gameSpeed.toFixed(1)}x</span>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
};
