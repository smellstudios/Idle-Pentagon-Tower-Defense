/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState, Upgrade } from '../types';
import { Heart, Sword, Skull } from 'lucide-react';
import { getEnemyWaveStats, WAVE_CONFIG, calculatePlayerCombatStats } from '../game/constants';
import { EnemyIcon } from './Icons';

interface Props {
  gameState: GameState;
  upgrades?: Upgrade[];
  className?: string;
}

export const EnemyStatsBox: React.FC<Props> = React.memo(({ gameState, upgrades, className = '' }) => {
  const isBossWave = WAVE_CONFIG.isBossWave(gameState.wave);
  const playerCombatStats = calculatePlayerCombatStats(upgrades || [], gameState);
  const playerSummary = {
    effectivePlayerDps: playerCombatStats.dps,
    effectiveMaxHp: playerCombatStats.effectiveMaxHp,
    defenseAbsolute: playerCombatStats.defenseAbsolute,
  };

  // Get stats for basic shape (Red Square) and Boss
  const basicStats = getEnemyWaveStats('red_square', gameState.wave, gameState.tier || 1, playerSummary);
  const bossStats = getEnemyWaveStats('boss', gameState.wave, gameState.tier || 1, playerSummary);

  // Since all standard shapes do identical contact DPS, damage is perfectly universal!
  const dpsVal = isBossWave ? bossStats.dps : basicStats.dps;

  // For HP, we display the standard basic vanguard HP (Red Square, 70% of spawns)
  // which represents the baseline threat accurately.
  const hpVal = isBossWave ? bossStats.hp : basicStats.hp;

  const formatStat = (num: number): string => {
    if (num >= 10000) return `${(num / 1000).toFixed(1)}k`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}k`;
    if (num >= 100) return Math.round(num).toString();
    return (Math.round(num * 10) / 10).toFixed(1);
  };

  const themeBorder = isBossWave ? 'border-purple-500/70' : 'border-zinc-700/80';
  const themeGlow = isBossWave 
    ? 'shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
    : 'shadow-[0_4px_12px_rgba(0,0,0,0.5)]';
  const themeAccentBg = isBossWave ? 'bg-purple-950/60' : 'bg-zinc-950/90';

  return (
    <div 
      className={`select-none pointer-events-none cursor-default ${className}`}
      title="Enemy Threat Intel • Live Wave Scaling Stats"
    >
      {/* Organized & Tidy Threat Intel Card (Static & Universal) */}
      <div className={`w-[98px] rounded-xl ${themeAccentBg} backdrop-blur-md border ${themeBorder} ${themeGlow} flex flex-col p-2 transition-all relative shadow-lg`}>
        
        {/* 1. Header: Enemy Type Badge + Wave Indicator */}
        <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            {isBossWave ? (
              <Skull className="w-3 h-3 text-purple-400 animate-pulse shrink-0" />
            ) : (
              <EnemyIcon type="red_square" size={10} className="shadow-[0_0_6px_rgba(239,68,68,0.5)]" />
            )}
            <span className={`text-[8.5px] font-mono font-black tracking-tight leading-none uppercase ${
              isBossWave ? 'text-purple-300' : 'text-zinc-200'
            }`}>
              {isBossWave ? 'BOSS' : 'FOES'}
            </span>
          </div>

          <span className="text-[8px] font-mono text-zinc-400 font-semibold leading-none">
            W{gameState.wave}
          </span>
        </div>

        {/* 2. Core Stats (Health & Damage) cleanly separated into distinct rows */}
        <div className="flex flex-col gap-1.5">
          {/* Health Row */}
          <div className="flex items-center justify-between bg-black/40 px-1.5 py-1 rounded-md border border-white/5">
            <div className="flex items-center gap-1">
              <Heart className="w-2.5 h-2.5 text-red-400 shrink-0" />
              <span className="text-[8px] font-mono text-zinc-400 uppercase font-bold leading-none">
                HP
              </span>
            </div>
            
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`hp-universal-${gameState.wave}-${isBossWave}`}
                initial={{ scale: 1.1, color: '#f87171' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.2 }}
                className="text-[10px] font-mono font-black tracking-tight leading-none text-right"
              >
                {formatStat(hpVal)}
              </motion.span>
            </AnimatePresence>
          </div>

          {/* Damage Row */}
          <div className="flex items-center justify-between bg-black/40 px-1.5 py-1 rounded-md border border-white/5">
            <div className="flex items-center gap-1">
              <Sword className="w-2.5 h-2.5 text-amber-400 shrink-0" />
              <span className="text-[8px] font-mono text-zinc-400 uppercase font-bold leading-none">
                DMG
              </span>
            </div>

            <AnimatePresence mode="popLayout">
              <motion.span
                key={`dmg-universal-${gameState.wave}-${isBossWave}`}
                initial={{ scale: 1.1, color: '#fb923c' }}
                animate={{ scale: 1, color: isBossWave ? '#d8b4fe' : '#fde047' }}
                transition={{ duration: 0.2 }}
                className="text-[10px] font-mono font-black tracking-tight leading-none text-right"
              >
                {formatStat(dpsVal)}
              </motion.span>
            </AnimatePresence>
          </div>
        </div>

        {/* 3. Bottom Status Label */}
        <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-white/5">
          <span className="text-[7px] font-mono text-zinc-500 font-bold uppercase tracking-wider">
            {isBossWave ? 'THREAT' : 'SCALED'}
          </span>
          <span className={`text-[7px] font-mono font-black uppercase tracking-tight ${
            isBossWave ? 'text-purple-400' : 'text-emerald-400'
          }`}>
            {isBossWave ? 'CRITICAL' : 'LIVE'}
          </span>
        </div>

      </div>
    </div>
  );
});
