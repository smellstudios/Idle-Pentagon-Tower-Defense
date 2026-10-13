/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveBossInfo } from '../types';
import { Skull, ShieldAlert, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/format';

interface Props {
  boss: ActiveBossInfo | null;
  isDead?: boolean;
}

export const BossHealthBar: React.FC<Props> = React.memo(({ boss, isDead }) => {
  if (!boss || isDead) return null;

  const currentHp = Math.max(0, boss.hp);
  const maxHp = Math.max(1, boss.maxHp);
  const pct = Math.max(0, Math.min(100, (currentHp / maxHp) * 100));
  const isExecutePhase = pct <= 25 && pct > 0;

  // Smooth number and ghost damage bar states
  const [displayHp, setDisplayHp] = useState(currentHp);
  const [ghostPct, setGhostPct] = useState(pct);
  const [isHit, setIsHit] = useState(false);

  const prevHpRef = useRef(currentHp);
  const animFrameRef = useRef<number | null>(null);
  const ghostTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hitTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const prevHp = prevHpRef.current;
    prevHpRef.current = currentHp;

    if (currentHp < prevHp - 0.5) {
      setIsHit(true);
      if (hitTimeoutRef.current) clearTimeout(hitTimeoutRef.current);
      hitTimeoutRef.current = setTimeout(() => setIsHit(false), 300);

      // Ghost bar delay for boss damage
      if (ghostTimeoutRef.current) clearTimeout(ghostTimeoutRef.current);
      ghostTimeoutRef.current = setTimeout(() => {
        setGhostPct(pct);
      }, 200);
    } else {
      if (ghostPct < pct) setGhostPct(pct);
    }

    // High performance number interpolation
    const startVal = displayHp;
    const targetVal = currentHp;
    const startTime = performance.now();
    const duration = 140;

    const animateStep = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplayHp(startVal + (targetVal - startVal) * ease);

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animateStep);
      }
    };

    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(animateStep);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [currentHp, pct, maxHp]);

  const formatHp = (num: number): string => {
    if (num >= 100000) return formatCurrency(num);
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    if (num >= 100) return Math.round(num).toString();
    return num.toFixed(1);
  };

  const pctFormatted = pct.toFixed(1);

  return (
    <AnimatePresence>
      <motion.div
        key="boss-health-bar-container"
        initial={{ y: -24, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: -24, opacity: 0, scale: 0.96 }}
        transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        className="w-full max-w-[260px] xs:max-w-[300px] sm:max-w-[340px] md:max-w-md mx-auto pointer-events-none"
      >
        <div className={`bg-zinc-950/95 backdrop-blur-xl border rounded-2xl p-2 sm:p-2.5 shadow-2xl flex flex-col gap-1.5 relative overflow-hidden transition-all duration-300 ${
          isExecutePhase
            ? 'border-rose-500/80 shadow-[0_0_30px_rgba(244,63,94,0.5)]'
            : isHit
            ? 'border-fuchsia-400/90 shadow-[0_0_25px_rgba(217,70,239,0.6)]'
            : 'border-purple-500/60 shadow-[0_4px_25px_rgba(168,85,247,0.45)]'
        }`}>
          {/* Neon Ambient Gradient Glow */}
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-fuchsia-900/20 to-purple-900/20 pointer-events-none" />

          {/* Header row: Boss Info & Digital Percentage */}
          <div className="flex items-center justify-between gap-1.5 z-10">
            {/* Left: Boss Name & Title */}
            <div className="flex items-center gap-1.5 min-w-0">
              <div className={`p-1 rounded-lg border shrink-0 transition-colors ${
                isExecutePhase
                  ? 'bg-rose-950 border-rose-500/80 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.8)]'
                  : 'bg-purple-950 border-purple-500/60 text-purple-300 shadow-[0_0_8px_rgba(168,85,247,0.5)]'
              }`}>
                <Skull className={`w-3.5 h-3.5 ${isExecutePhase ? 'animate-bounce text-rose-300' : 'animate-pulse text-purple-300'}`} />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] sm:text-[11px] font-mono font-black text-white uppercase tracking-wider whitespace-nowrap drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]">
                    {boss.name || `WAVE ${boss.wave} BOSS`}
                  </span>
                  <span className="text-[7.5px] px-1 py-0.2 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono font-bold">
                    W{boss.wave}
                  </span>
                </div>
                {boss.title && (
                  <span className="text-[8px] sm:text-[8.5px] font-mono text-zinc-400 truncate">
                    {boss.title}
                  </span>
                )}
              </div>
            </div>

            {/* Right: Digital HP % Badge */}
            <div className="flex items-center gap-1 shrink-0">
              <div className={`flex items-baseline px-2 py-0.5 rounded-lg border font-mono font-black tracking-tight leading-none shadow-md ${
                isExecutePhase
                  ? 'bg-rose-950/90 border-rose-500/80 text-rose-200 shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                  : 'bg-purple-950/90 border-fuchsia-500/50 text-fuchsia-200 shadow-[0_0_12px_rgba(217,70,239,0.35)]'
              }`}>
                <span className="text-[11px] sm:text-xs">
                  {pctFormatted}
                </span>
                <span className="text-[8px] font-bold opacity-80 ml-0.5">
                  %
                </span>
              </div>
            </div>
          </div>

          {/* Dual Layer Boss Health Bar */}
          <div className="w-full h-2.5 sm:h-3 bg-black/90 rounded-full border border-purple-500/40 p-[1px] overflow-hidden relative shadow-inner z-10">
            {/* Phase Dividers (25%, 50%, 75%) */}
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none z-20 opacity-35">
              <div className="w-[1px] h-full bg-white" style={{ marginLeft: '25%' }} />
              <div className="w-[1px] h-full bg-white" style={{ marginLeft: '50%' }} />
              <div className="w-[1px] h-full bg-white" style={{ marginLeft: '75%' }} />
            </div>

            {/* Trailing Ghost Damage Bar */}
            <motion.div
              className="absolute top-0 bottom-0 left-0 rounded-full bg-gradient-to-r from-rose-500 to-amber-400 opacity-80"
              initial={false}
              animate={{ width: `${ghostPct}%` }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />

            {/* Main Active Fill */}
            <motion.div
              className={`h-full rounded-full bg-gradient-to-r relative overflow-hidden ${
                isExecutePhase
                  ? 'from-rose-600 via-red-500 to-orange-400 shadow-[0_0_20px_rgba(244,63,94,0.9)]'
                  : 'from-purple-600 via-fuchsia-500 to-pink-400 shadow-[0_0_15px_rgba(217,70,239,0.8)]'
              }`}
              initial={{ width: '100%' }}
              animate={{ width: `${pct}%` }}
              transition={{ type: 'spring', damping: 24, stiffness: 260, mass: 0.4 }}
            >
              {/* Shimmer Light Stream */}
              <motion.div
                className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
              />

              {/* Glowing Laser Tip */}
              <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_6px_#fff]" />
            </motion.div>
          </div>

          {/* Harmonic Energy Shield Bar (Strictly Wave 50+ only) */}
          {boss.maxShieldHp !== undefined && boss.maxShieldHp > 0 && (
            <div className="w-full flex flex-col gap-0.5 z-10">
              <div className="flex items-center justify-between text-[7.5px] font-mono text-cyan-300">
                <span className="flex items-center gap-0.5">
                  <ShieldAlert className="w-2 h-2 text-cyan-400" />
                  <span>HARMONIC SHIELD</span>
                </span>
                <span>{Math.max(0, Math.round(boss.shieldHp || 0))}/{boss.maxShieldHp}</span>
              </div>
              <div className="w-full h-1 bg-black/90 rounded-full border border-cyan-500/40 p-[1px] overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-cyan-500 to-sky-300 rounded-full transition-all duration-150"
                  style={{ width: `${Math.max(0, Math.min(100, ((boss.shieldHp || 0) / boss.maxShieldHp) * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* Footer row: Exact numerical HP & Status Warning */}
          <div className="flex items-center justify-between text-[8px] sm:text-[9px] font-mono z-10 px-0.5">
            <span className="text-zinc-400 font-semibold tabular-nums shrink-0 whitespace-nowrap">
              <span className="text-purple-200 font-bold">{formatHp(displayHp)}</span>
              <span className="text-zinc-500">/{formatHp(maxHp)}</span>
            </span>

            {isExecutePhase ? (
              <span className="text-rose-400 font-black uppercase tracking-wider flex items-center gap-1 shrink-0 animate-pulse">
                <Zap className="w-2.5 h-2.5 text-rose-400" />
                EXECUTE PHASE
              </span>
            ) : boss.maxShieldHp && boss.maxShieldHp > 0 && (boss.shieldHp || 0) > 0 ? (
              <span className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                <ShieldAlert className="w-2.5 h-2.5 text-cyan-400" />
                SHIELD ACTIVE
              </span>
            ) : (
              <span className="text-fuchsia-400/90 font-bold uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                <ShieldAlert className="w-2.5 h-2.5 text-fuchsia-400" />
                TARGET LOCKED
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
});

