/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FastForward, Gauge, Minus, Plus, ChevronRight, Pause, Play } from 'lucide-react';
import { soundEngine } from '../game/sound';
import { getMaxGameSpeed, MIN_GAME_SPEED, HARD_LIMIT_GAME_SPEED } from '../game/constants';

interface SpeedIndicatorHUDProps {
  gameSpeed: number;
  labResearchLevels?: Record<string, number>;
  onSetGameSpeed: (speed: number) => void;
  onOpenLab?: () => void;
}

export const SpeedIndicatorHUD: React.FC<SpeedIndicatorHUDProps> = ({
  gameSpeed,
  labResearchLevels = {},
  onSetGameSpeed,
  onOpenLab,
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  // Unlocked maximum speed (1.5x for beginners, +0.5x per Lab level, hard limit 3.0x)
  const maxSpeed = getMaxGameSpeed(labResearchLevels);
  const currentSpeed = gameSpeed !== undefined ? gameSpeed : 1.0;
  
  // Status states
  const isPaused = currentSpeed === 0;
  const isSlowMo = currentSpeed === 0.5;
  const isAccelerated = currentSpeed > 1.0;
  
  // Limit boundaries: can step all the way down to 0.0x and up to maxSpeed (up to 3.0x)
  const isAtMinSpeed = currentSpeed <= MIN_GAME_SPEED + 0.05;
  const isAtMaxSpeed = currentSpeed >= maxSpeed - 0.05;

  const handleDecreaseSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAtMinSpeed) return;
    soundEngine.playTabSwitch();
    // Step down by 0.5 (e.g. 1.0 -> 0.5 -> 0.0)
    const newSpeed = Math.max(MIN_GAME_SPEED, Math.round((currentSpeed - 0.5) * 10) / 10);
    onSetGameSpeed(newSpeed);
  };

  const handleIncreaseSpeed = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAtMaxSpeed) return;
    soundEngine.playTabSwitch();
    // Step up by 0.5 (e.g. 0.0 -> 0.5 -> 1.0 -> 1.5 ...)
    const newSpeed = Math.min(maxSpeed, Math.round((currentSpeed + 0.5) * 10) / 10);
    onSetGameSpeed(newSpeed);
  };

  const speedPercentage = Math.round((currentSpeed - 1.0) * 100);

  return (
    <div className="relative group select-none pointer-events-auto">
      {/* Dynamic aura based on speed state */}
      {isPaused ? (
        <div className="absolute -inset-1 bg-gradient-to-r from-rose-500/25 via-pink-500/15 to-rose-500/25 rounded-xl blur-xs pointer-events-none animate-pulse" />
      ) : isAccelerated ? (
        <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/25 via-yellow-500/15 to-amber-500/25 rounded-xl blur-xs pointer-events-none animate-pulse" />
      ) : isSlowMo ? (
        <div className="absolute -inset-1 bg-gradient-to-r from-sky-500/20 via-cyan-500/10 to-sky-500/20 rounded-xl blur-xs pointer-events-none" />
      ) : null}

      {/* Main Gameplay HUD Speed Control: [-] 1.0x [+] */}
      <div 
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`relative flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2 py-1 rounded-xl backdrop-blur-md border transition-all shadow-md ${
          isPaused
            ? 'bg-gradient-to-r from-black/95 via-rose-950/60 to-black/95 border-rose-500/60 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
            : isAccelerated
            ? 'bg-gradient-to-r from-black/95 via-amber-950/60 to-black/95 border-amber-400/60 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
            : isSlowMo
            ? 'bg-gradient-to-r from-black/95 via-sky-950/60 to-black/95 border-sky-400/50 shadow-[0_0_12px_rgba(56,189,248,0.25)]'
            : 'bg-zinc-950/85 border-cyan-500/30 hover:border-cyan-500/50 text-cyan-300'
        }`}
      >
        {/* Visual Icon: Pause, Gauge, or Fast-Forward */}
        <div 
          onClick={() => {
            soundEngine.playTabSwitch();
            if (isPaused) {
              onSetGameSpeed(1.0);
            } else {
              onSetGameSpeed(0.0);
            }
          }}
          className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-lg shrink-0 cursor-pointer transition-transform active:scale-90 ${
            isPaused
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 shadow-inner animate-pulse'
              : isAccelerated
              ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-inner'
              : isSlowMo
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50 shadow-inner'
              : 'bg-zinc-900 text-cyan-400 border border-white/5'
          }`}
          title={
            isPaused 
              ? "Game Paused (0x) - Click to Resume (1.0x)" 
              : isAccelerated 
              ? `Time Accelerated: ${currentSpeed.toFixed(1)}x - Click to Pause (0x)` 
              : isSlowMo
              ? "Slow-Motion (0.5x) - Click to Pause (0x)"
              : "Normal Speed (1.0x) - Click to Pause (0x)"
          }
        >
          {isPaused ? (
            <Pause className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-rose-400" />
          ) : isAccelerated ? (
            <FastForward className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse text-amber-300" />
          ) : (
            <Gauge className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${isSlowMo ? 'text-sky-300' : 'text-cyan-400'}`} />
          )}
        </div>

        {/* Stepper Button: [-] */}
        <button
          type="button"
          onClick={handleDecreaseSpeed}
          disabled={isAtMinSpeed}
          title={isAtMinSpeed ? "Minimum speed reached (0x Paused)" : "Decrease speed (-0.5x)"}
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs transition-all cursor-pointer ${
            isAtMinSpeed
              ? 'opacity-30 cursor-not-allowed text-zinc-600 bg-zinc-900/40 border border-white/5'
              : isPaused
              ? 'bg-rose-950/70 hover:bg-rose-900 border border-rose-500/40 text-rose-200 active:scale-90'
              : isAccelerated
              ? 'bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 active:scale-90'
              : 'bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 active:scale-90'
          }`}
        >
          <Minus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </button>

        {/* Speed Multiplier Readout & Status Label */}
        <div 
          onClick={() => setShowTooltip(prev => !prev)}
          className="flex flex-col items-center justify-center min-w-[34px] sm:min-w-[38px] px-1 cursor-pointer"
        >
          <span 
            className={`font-mono text-[11px] sm:text-xs font-black tabular-nums leading-none tracking-tight ${
              isPaused
                ? 'text-rose-400 drop-shadow-[0_0_8px_rgba(244,63,94,0.85)]'
                : isAccelerated 
                ? 'text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.85)]' 
                : isSlowMo
                ? 'text-sky-300 drop-shadow-[0_0_8px_rgba(56,189,248,0.7)]'
                : 'text-white'
            }`}
          >
            {currentSpeed.toFixed(1)}x
          </span>

          {isPaused ? (
            <span className="text-[6.5px] sm:text-[7px] font-mono font-black text-rose-400 tracking-widest uppercase leading-none mt-0.5 animate-pulse">
              PAUSE
            </span>
          ) : isAccelerated ? (
            <span className="text-[6.5px] sm:text-[7px] font-mono font-black text-amber-400/90 tracking-widest uppercase leading-none mt-0.5 animate-pulse">
              FAST
            </span>
          ) : isSlowMo ? (
            <span className="text-[6.5px] sm:text-[7px] font-mono font-black text-sky-400 tracking-widest uppercase leading-none mt-0.5">
              SLOW
            </span>
          ) : (
            <span className="text-[6.5px] sm:text-[7px] font-mono font-bold text-zinc-500 uppercase leading-none mt-0.5">
              NORM
            </span>
          )}
        </div>

        {/* Stepper Button: [+] */}
        <button
          type="button"
          onClick={handleIncreaseSpeed}
          disabled={isAtMaxSpeed}
          title={
            isAtMaxSpeed
              ? maxSpeed < HARD_LIMIT_GAME_SPEED
                ? `Max unlocked speed reached (${maxSpeed.toFixed(1)}x). Upgrade "Maximum Game Speed" in Lab (+0.5x, up to 3.0x)!`
                : "Absolute maximum speed reached (3.0x)"
              : isPaused
              ? "Resume simulation (+0.5x)"
              : "Increase speed (+0.5x)"
          }
          className={`w-5 h-5 sm:w-6 sm:h-6 rounded-lg flex items-center justify-center font-mono font-black text-xs transition-all cursor-pointer ${
            isAtMaxSpeed
              ? 'opacity-30 cursor-not-allowed text-zinc-600 bg-zinc-900/40 border border-white/5'
              : isPaused
              ? 'bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-200 active:scale-90 shadow-sm'
              : isAccelerated
              ? 'bg-amber-950/70 hover:bg-amber-900 border border-amber-500/40 text-amber-200 active:scale-90'
              : 'bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-500/30 text-cyan-200 active:scale-90'
          }`}
        >
          <Plus className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
        </button>
      </div>

      {/* Floating Info Tooltip / Inspector */}
      {showTooltip && (
        <div className="absolute top-full left-0 mt-1.5 w-60 sm:w-64 p-2.5 rounded-xl bg-zinc-950/95 border border-amber-400/40 shadow-[0_8px_30px_rgba(0,0,0,0.9)] backdrop-blur-xl text-white font-mono text-[9px] z-50 animate-fade-in pointer-events-auto">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5 mb-1.5">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
              {isPaused ? (
                <>
                  <Pause className="w-3.5 h-3.5 text-rose-400" />
                  <span className="text-rose-400">Game Paused (0x)</span>
                </>
              ) : isAccelerated ? (
                <>
                  <Gauge className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-amber-300">Speed Control HUD</span>
                </>
              ) : isSlowMo ? (
                <>
                  <Gauge className="w-3.5 h-3.5 text-sky-400" />
                  <span className="text-sky-300">Slow-Motion (0.5x)</span>
                </>
              ) : (
                <>
                  <Gauge className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-300">Normal Speed (1.0x)</span>
                </>
              )}
            </div>
            {isPaused ? (
              <span className="px-1 py-0.2 rounded bg-rose-500/20 text-rose-300 font-black border border-rose-500/30">
                Paused
              </span>
            ) : isAccelerated ? (
              <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 font-black border border-amber-500/30">
                +{speedPercentage}% Velocity
              </span>
            ) : isSlowMo ? (
              <span className="px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                -50% Slow-Mo
              </span>
            ) : (
              <span className="px-1 py-0.2 rounded bg-zinc-800 text-zinc-300 font-bold border border-white/10">
                1.0x Normal
              </span>
            )}
          </div>

          <p className="text-zinc-300 leading-relaxed mb-2">
            {isPaused 
              ? 'Combat simulation, projectiles, and enemy waves are completely frozen. Menus and settings remain active.'
              : 'Controls simulation tick rate and combat speed. Menus and user interface maintain consistent 60fps responsiveness.'}
          </p>

          <div className="p-1.5 rounded-lg bg-black/60 border border-white/5 flex items-center justify-between text-[8px] text-zinc-400 mb-2">
            <span>Unlocked Max Speed:</span>
            <span className="font-bold text-white">
              {maxSpeed.toFixed(1)}x {maxSpeed >= HARD_LIMIT_GAME_SPEED ? '(Absolute Limit)' : '(Cap)'}
            </span>
          </div>

          {maxSpeed < HARD_LIMIT_GAME_SPEED && onOpenLab && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                soundEngine.playTabSwitch();
                onOpenLab();
              }}
              className="w-full py-1.5 px-2 rounded-lg bg-gradient-to-r from-teal-950 to-emerald-950 border border-teal-500/50 hover:border-teal-400 text-teal-200 hover:text-white flex items-center justify-center gap-1 text-[8.5px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all shadow-sm"
            >
              <span>Research &ldquo;Maximum Game Speed&rdquo; in Lab (+0.5x)</span>
              <ChevronRight className="w-3 h-3 text-teal-400" />
            </button>
          )}

          <div className="text-[7.5px] text-zinc-500 text-center mt-1.5">
            Click [-] or [+] to adjust • Click icon to toggle Pause (0x)
          </div>
        </div>
      )}
    </div>
  );
};
