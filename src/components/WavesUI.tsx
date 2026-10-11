/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Upgrade } from '../types';
import { Heart, Sword, Skull, Activity, ShieldAlert, Sparkles } from 'lucide-react';
import { WAVE_CONFIG, calculatePlayerCombatStats } from '../game/constants';
import { formatCurrency } from '../utils/format';

interface Props {
  gameState: GameState;
  upgrades: Upgrade[];
}

export const WavesUI: React.FC<Props> = ({ gameState, upgrades }) => {
  const isBossWave = WAVE_CONFIG.isBossWave(gameState.wave);
  
  // 1. Calculate unified, accurate combat stats (handles all cards, lab, workshop, and in-run upgrades)
  const combatStats = useMemo(() => {
    return calculatePlayerCombatStats(upgrades || [], gameState || {});
  }, [gameState, upgrades]);

  const maxHp = Math.max(1, combatStats.effectiveMaxHp);
  const currentHp = gameState.isDead ? 0 : Math.max(0, Math.min(maxHp, gameState.playerHp ?? maxHp));
  const hpRatio = Math.max(0, Math.min(1, currentHp / maxHp));
  const hpPercent = Math.round(hpRatio * 100);
  const totalHpRegen = Number(combatStats.hpRegen.toFixed(2));
  const isRegenerating = !gameState.isDead && currentHp < maxHp && currentHp > 0 && totalHpRegen > 0;

  // 2. Continuous smooth number ticker without stutter or animation-cancellation bugs
  const [displayHp, setDisplayHp] = useState(currentHp);
  const [ghostHpRatio, setGhostHpRatio] = useState(hpRatio);
  const [damageDelta, setDamageDelta] = useState<number | null>(null);
  const [isTakingDamage, setIsTakingDamage] = useState(false);
  const [isHealingFlash, setIsHealingFlash] = useState(false);

  const prevHpRef = useRef(currentHp);
  const animFrameRef = useRef<number | null>(null);
  const ghostTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync and interpolate displayHp smoothly
  useEffect(() => {
    const prevHp = prevHpRef.current;
    prevHpRef.current = currentHp;

    // Instant snap on death, respawn, or large jumps
    if (gameState.isDead || currentHp === 0 || prevHp === 0 || Math.abs(currentHp - displayHp) > maxHp * 0.5) {
      setDisplayHp(currentHp);
      setGhostHpRatio(hpRatio);
      return;
    }

    // Damage taken event
    if (currentHp < prevHp - 0.1) {
      const lostHp = prevHp - currentHp;
      setDamageDelta(lostHp);
      setIsTakingDamage(true);

      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        setIsTakingDamage(false);
        setDamageDelta(null);
      }, 700);

      // Delay ghost bar drain so player sees the damage chunk
      if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current);
      ghostTimeoutRef.current = setTimeout(() => {
        setGhostHpRatio(hpRatio);
      }, 250);
    } else if (currentHp > prevHp + 0.1) {
      // Healing event
      setGhostHpRatio(hpRatio);
      setIsHealingFlash(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => {
        setIsHealingFlash(false);
      }, 500);
    } else {
      // Steady state catch-up for ghost bar
      if (ghostHpRatio < hpRatio) {
        setGhostHpRatio(hpRatio);
      }
    }

    // High performance exponential smoothing loop for display numbers
    const startVal = displayHp;
    const targetVal = currentHp;
    const startTime = performance.now();
    const duration = 160;

    const animateLoop = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic curve
      const ease = 1 - Math.pow(1 - progress, 3);
      const nextVal = startVal + (targetVal - startVal) * ease;
      setDisplayHp(nextVal);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateLoop);
      }
    };

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
    animFrameRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [currentHp, maxHp, gameState.isDead, hpRatio]);

  // Clean formatters
  const formatHpNumber = (val: number) => {
    if (val >= 100000) {
      return formatCurrency(val, gameState.settings?.useLegacyCurrencyFormat);
    }
    if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'k';
    }
    return val.toFixed(1);
  };

  const displayHpFormatted = formatHpNumber(displayHp);
  const maxHpFormatted = formatHpNumber(maxHp);
  const playerDmgFormatted = formatCurrency(Math.round(combatStats.damage), gameState.settings?.useLegacyCurrencyFormat);

  // Dynamic visual theme based on current health ratio
  const hpTheme = useMemo(() => {
    if (hpRatio <= 0.25) {
      return {
        containerBg: 'bg-gradient-to-b from-rose-950/90 via-zinc-950/95 to-zinc-950/95 border-rose-500/80 shadow-[0_0_25px_rgba(244,63,94,0.4)]',
        barGradient: 'from-rose-600 via-red-500 to-rose-400',
        glowColor: 'shadow-[0_0_12px_rgba(244,63,94,0.8)]',
        badgeBg: 'bg-rose-950/90 border-rose-500/60 text-rose-200',
        heartColor: 'text-rose-400 animate-ping',
        statusLabel: 'CRITICAL',
        statusColor: 'text-rose-300',
      };
    } else if (hpRatio <= 0.55) {
      return {
        containerBg: 'bg-gradient-to-b from-amber-950/70 via-zinc-950/95 to-zinc-950/95 border-amber-500/60 shadow-[0_0_18px_rgba(245,158,11,0.25)]',
        barGradient: 'from-amber-600 via-amber-400 to-yellow-300',
        glowColor: 'shadow-[0_0_10px_rgba(245,158,11,0.6)]',
        badgeBg: 'bg-amber-950/90 border-amber-500/50 text-amber-200',
        heartColor: 'text-amber-400 animate-pulse',
        statusLabel: 'WARNING',
        statusColor: 'text-amber-300',
      };
    }
    return {
      containerBg: 'bg-gradient-to-b from-emerald-950/40 via-zinc-950/95 to-zinc-950/95 border-emerald-500/50 shadow-[0_0_18px_rgba(16,185,129,0.2)]',
      barGradient: 'from-emerald-600 via-teal-400 to-cyan-300',
      glowColor: 'shadow-[0_0_10px_rgba(52,211,153,0.6)]',
      badgeBg: 'bg-emerald-950/90 border-emerald-400/50 text-emerald-200',
      heartColor: 'text-emerald-400 animate-pulse',
      statusLabel: isRegenerating ? 'REPAIRING' : 'STABLE',
      statusColor: 'text-emerald-300',
    };
  }, [hpRatio, isRegenerating]);

  const isFirstRunNoob = (gameState.ascensionCount || gameState.stats?.totalAscensions || 0) === 0 && (gameState.highestWaveEver || 0) < 30;
  const showNoobNudge = isFirstRunNoob && hpRatio < 0.35 && gameState.wave >= 12;
  const isLateGameTechPhase = gameState.wave >= 70;

  return (
    <div className="w-full px-1.5 sm:px-3 py-1.5 sm:py-2 flex flex-col gap-1.5 sm:gap-2 bg-gradient-to-t from-zinc-950 via-zinc-950/95 to-zinc-900/90 border-t border-white/10 shadow-[0_-8px_25px_rgba(0,0,0,0.8)]">
      {/* Contextual Nudges & Assist Badges */}
      {(isFirstRunNoob || isLateGameTechPhase || showNoobNudge) && (
        <div className="flex items-center justify-between gap-1.5 px-1.5 text-[9px] font-mono">
          {isFirstRunNoob && (
            <div className="flex items-center gap-1 text-emerald-300 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              <span>FIRST RUN ASSIST ACTIVE (+{Math.round(Math.max(0, (1.20 - (gameState.wave / 30) * 0.20) - 1.0) * 100)}% PWR)</span>
            </div>
          )}

          {isLateGameTechPhase && (
            <div className="flex items-center gap-1 text-amber-300 bg-amber-950/80 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold ml-auto">
              <span>⚡ STAGE 4: TECH TREE & RARE DROPS DRIVEN</span>
            </div>
          )}

          {showNoobNudge && (
            <div className="w-full text-center text-amber-200 bg-amber-950/90 border border-amber-500/50 px-2.5 py-1 rounded-xl font-bold animate-pulse">
              💡 Enemies outscaling your base tower? Ascend in Workshop for permanent Cosmic Shards & Tech Upgrades!
            </div>
          )}
        </div>
      )}

      {/* Side-by-Side Symmetrical Grid: DMG & Fortress HP on left, Waves & Progress Bar on right */}
      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
        {/* Left: Enhanced Fortress Health & Combat HUD */}
        <motion.div 
          animate={isTakingDamage ? { x: [-2, 2, -1, 1, 0] } : { x: 0 }}
          transition={{ duration: 0.2 }}
          title={`Damage: ${playerDmgFormatted} | Fortress HP: ${displayHpFormatted}/${maxHpFormatted} (${hpPercent}%)`}
          className={`flex flex-col justify-between p-1.5 sm:p-2 px-2 sm:px-3 rounded-2xl border transition-all duration-300 min-w-0 overflow-hidden relative ${hpTheme.containerBg} ${
            isTakingDamage ? 'ring-2 ring-rose-500/80 shadow-[0_0_20px_rgba(244,63,94,0.6)]' : isHealingFlash ? 'ring-1 ring-emerald-400/60' : ''
          }`}
        >
          {/* Subtle Cyber Grid Ambient Glow */}
          <div className="absolute inset-0 bg-radial-at-top from-white/5 via-transparent to-transparent pointer-events-none" />

          {/* Top Line: DMG Stat + HP Number / Live Indicator */}
          <div className="flex items-center justify-between gap-1 mb-1 z-10">
            {/* Left: Weapon DMG Stat */}
            <div className="flex items-center gap-1 min-w-0 shrink">
              <div className="p-0.5 rounded-md bg-amber-950/60 border border-amber-500/40 text-amber-300 shrink-0">
                <Sword className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
              </div>
              <div className="flex flex-col -gap-0.5 min-w-0">
                <span className="text-[6.5px] sm:text-[7px] font-mono text-amber-400/80 font-bold uppercase tracking-wider hidden xs:inline">DMG</span>
                <span className="text-[9px] sm:text-[10px] font-mono font-black text-amber-200 tabular-nums leading-none whitespace-nowrap">
                  {playerDmgFormatted}
                </span>
              </div>
            </div>

            {/* Right: Fortress HP Number & Heart Indicator with Stopwatch Ticking Animation */}
            <div 
              className="flex items-center gap-1 shrink-0 relative"
              title="Fortress Structural Integrity"
            >
              <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 fill-current shrink-0 transition-colors duration-300 ${
                isTakingDamage ? 'text-rose-400 animate-ping' : isRegenerating ? 'text-emerald-400' : hpTheme.heartColor
              }`} />

              <div className="flex items-baseline font-mono tabular-nums whitespace-nowrap">
                <span
                  className={`text-[9px] sm:text-[10px] font-black tracking-tight transition-colors duration-150 ${
                    isTakingDamage
                      ? 'text-rose-300 drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                      : isRegenerating
                      ? 'text-emerald-300 drop-shadow-[0_0_6px_rgba(52,211,153,0.7)]'
                      : 'text-zinc-100'
                  }`}
                >
                  {displayHpFormatted}
                </span>
                <span className="text-zinc-500 font-normal text-[7.5px] sm:text-[8px] ml-0.5">/{maxHpFormatted}</span>
              </div>

              {/* Floating Damage Text Popup Indicator */}
              <AnimatePresence>
                {damageDelta !== null && (
                  <motion.span
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -12, scale: 1 }}
                    exit={{ opacity: 0, y: -18 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="absolute -top-1 right-0 text-[8px] font-mono font-black text-rose-400 pointer-events-none drop-shadow-[0_0_6px_rgba(244,63,94,0.9)]"
                  >
                    -{formatHpNumber(damageDelta)}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* High-Tech Dual Layer Health Bar with Ghost Damage Trail */}
          <div className={`w-full h-2 sm:h-2.5 bg-black/90 rounded-full overflow-hidden border relative p-[0.5px] shadow-inner transition-all duration-300 shrink-0 z-10 ${
            hpRatio <= 0.25 
              ? 'border-rose-500/60 shadow-[0_0_8px_rgba(244,63,94,0.3)]' 
              : isRegenerating 
              ? 'border-emerald-500/60 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
              : 'border-white/20'
          }`}>
            {/* Health Segment Tick Dividers (25%, 50%, 75%) */}
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-20 opacity-30">
              <div className="w-[1px] h-full bg-white/40" style={{ marginLeft: '25%' }} />
              <div className="w-[1px] h-full bg-white/40" style={{ marginLeft: '50%' }} />
              <div className="w-[1px] h-full bg-white/40" style={{ marginLeft: '75%' }} />
            </div>

            {/* Ghost Damage Bar (Trailing Red/Orange Underlayer) */}
            <motion.div
              className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-rose-600 via-amber-500 to-rose-400 opacity-80"
              initial={false}
              animate={{ width: `${Math.max(0, Math.min(100, ghostHpRatio * 100))}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />

            {/* Main Active Health Bar Fill */}
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r ${hpTheme.barGradient} relative overflow-hidden ${hpTheme.glowColor}`}
              initial={false}
              animate={{ width: `${Math.max(0, Math.min(100, hpRatio * 100))}%` }}
              transition={{
                type: 'spring',
                damping: 24,
                stiffness: 260,
                mass: 0.4,
              }}
            >
              {/* Animated Light Sweep Stream during normal combat & active regen */}
              <motion.div
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: isRegenerating ? 1.2 : 2.2, ease: 'linear' }}
              />

              {/* Glowing High-Tech Laser Edge Cap */}
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/90 shadow-[0_0_6px_#fff]" />
            </motion.div>
          </div>

          {/* Bottom Sub-info: HP Regen Rate & Status Badge */}
          <div className="flex items-center justify-between text-[7px] sm:text-[8px] font-mono leading-none mt-1 z-10">
            {totalHpRegen > 0 ? (
              <div 
                title={`Fortress HP Regeneration: +${totalHpRegen}/sec`}
                className={`flex items-center gap-0.5 transition-all duration-200 min-w-0 ${
                  isRegenerating ? 'text-emerald-300' : 'text-emerald-400/80'
                }`}
              >
                <Activity className={`w-2.5 h-2.5 shrink-0 ${isRegenerating ? 'animate-pulse text-emerald-400' : 'text-emerald-500/50'}`} />
                <span className="font-bold tabular-nums whitespace-nowrap">+{totalHpRegen}/s</span>
              </div>
            ) : (
              <div className="flex items-center gap-0.5 text-zinc-500">
                <Sparkles className="w-2 h-2 text-zinc-600" />
                <span className="whitespace-nowrap">{hpTheme.statusLabel}</span>
              </div>
            )}

            {/* Health Percentage & Status Indicator */}
            <div className="flex items-center gap-1 shrink-0">
              <span className={`text-[6.5px] sm:text-[7px] font-black uppercase tracking-wider ${hpTheme.statusColor}`}>
                {hpTheme.statusLabel}
              </span>
              <span className={`px-1.5 py-0.2 rounded-md font-mono tabular-nums text-[7.5px] sm:text-[8px] font-black border ${
                hpRatio <= 0.25
                  ? 'bg-rose-950/90 text-rose-300 border-rose-500/50'
                  : isRegenerating 
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                  : 'bg-zinc-900/90 text-zinc-300 border-white/10'
              }`}>
                {hpPercent}%
              </span>
            </div>
          </div>
        </motion.div>

        {/* Right: Symmetrical Wave & Sector Progress HUD */}
        <div
          title={`Tier ${gameState.tier || 1} | Wave ${gameState.wave} | ${isBossWave ? 'BOSS WAVE' : 'Standard Wave'} | ${Math.round(gameState.waveProgress * 100)}% Complete`}
          className={`flex flex-col justify-between p-1.5 sm:p-2 px-2 sm:px-3 rounded-2xl border transition-all duration-300 min-w-0 overflow-hidden relative ${
            isBossWave
              ? 'bg-gradient-to-b from-rose-950/50 via-zinc-950/95 to-zinc-950/95 border-rose-500/60 shadow-[0_0_20px_rgba(244,63,94,0.3)]'
              : 'bg-gradient-to-b from-sky-950/40 via-zinc-950/95 to-zinc-950/95 border-sky-500/40 shadow-[0_0_18px_rgba(56,189,248,0.15)]'
          }`}
        >
          {/* Subtle Cyber Grid Ambient Glow */}
          <div className="absolute inset-0 bg-radial-at-top from-white/5 via-transparent to-transparent pointer-events-none" />

          {/* Top Line: WAVE Number + Sector Status / Threat Level */}
          <div className="flex items-center justify-between gap-1 mb-1 z-10">
            <div className="flex items-center gap-1 min-w-0 shrink">
              <div className={`p-0.5 rounded-md border shrink-0 ${
                isBossWave 
                  ? 'bg-rose-950/80 border-rose-500/50 text-rose-300 shadow-[0_0_8px_rgba(244,63,94,0.5)]' 
                  : 'bg-sky-950/60 border-sky-500/40 text-sky-300'
              }`}>
                {isBossWave ? (
                  <ShieldAlert className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-rose-400 animate-pulse" />
                ) : (
                  <Skull className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-sky-400" />
                )}
              </div>
              <div className="flex flex-col -gap-0.5 min-w-0">
                <span className="text-[6.5px] sm:text-[7px] font-mono text-sky-500/80 font-black leading-none uppercase tracking-tighter whitespace-nowrap">
                  TIER {gameState.tier || 1}
                </span>
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-[7.5px] sm:text-[8px] font-mono text-sky-400/90 font-bold uppercase tracking-wider hidden xs:inline">WAVE</span>
                  <span className="text-[9px] sm:text-[10px] font-mono font-black text-sky-200 tabular-nums leading-none whitespace-nowrap">
                    {gameState.wave}
                  </span>
                </div>
              </div>
            </div>

            <span className={`text-[7px] sm:text-[7.5px] font-mono font-black px-1.5 py-0.5 rounded-md tracking-wider uppercase shrink-0 whitespace-nowrap border ${
              isBossWave
                ? 'bg-rose-950/90 border-rose-500/60 text-rose-300 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.4)]'
                : 'bg-sky-950/80 border-sky-500/40 text-sky-300'
            }`}>
              {isBossWave ? 'BOSS' : 'SECTOR'}
            </span>
          </div>

          {/* Compact Mini Wave Progress Bar */}
          <div className="w-full h-2 sm:h-2.5 bg-black/90 rounded-full overflow-hidden border border-white/15 relative p-[0.5px] shadow-inner shrink-0 z-10">
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r relative overflow-hidden ${
                isBossWave 
                  ? 'from-rose-500 via-amber-400 to-rose-300 shadow-[0_0_10px_rgba(244,63,94,0.7)]'
                  : 'from-sky-500 via-cyan-400 to-teal-300 shadow-[0_0_8px_rgba(56,189,248,0.5)]'
              }`}
              animate={{ width: `${Math.max(0, Math.min(100, gameState.waveProgress * 100))}%` }}
              transition={{ duration: 0.12, ease: 'linear' }}
            >
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/80" />
            </motion.div>
          </div>

          {/* Bottom Sub-info: Clear Status & Percentage */}
          <div className="flex items-center justify-between text-[7px] sm:text-[8px] font-mono leading-none mt-1 z-10">
            <span className="text-zinc-400 font-semibold tracking-wide whitespace-nowrap pr-1">
              {isBossWave ? 'BOSS THREAT' : 'WAVE PROGRESS'}
            </span>
            <span className="font-mono font-black text-sky-300 shrink-0 tabular-nums">
              {Math.round(gameState.waveProgress * 100)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

