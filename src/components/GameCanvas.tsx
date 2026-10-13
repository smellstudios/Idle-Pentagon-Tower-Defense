/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { GameManager } from '../game/GameManager';

interface Props {
  gameManager: GameManager | null;
  showHud?: boolean;
}

export const GameCanvas: React.FC<Props> = ({ gameManager, showHud = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [metrics, setMetrics] = useState({
    fps: 60,
    avgFrameTimeMs: 16.6,
    activeEnemies: 0,
    activeProjectiles: 0,
    activeVfx: 0,
    qualityTier: 0,
  });

  useEffect(() => {
    if (!containerRef.current || !canvasRef.current || !gameManager) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          gameManager.resize(width, height);
        }
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, [gameManager]);

  useEffect(() => {
    if (!showHud || !gameManager) return;
    const interval = setInterval(() => {
      setMetrics(gameManager.getPerformanceMetrics());
    }, 250);
    return () => clearInterval(interval);
  }, [showHud, gameManager]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-zinc-900">
      <canvas id="game-canvas" ref={canvasRef} className="block mx-auto" />
      {showHud && (
        <div className="absolute top-16 left-3 z-30 pointer-events-none bg-black/80 border border-zinc-700/80 rounded-lg p-2 font-mono text-[10px] text-zinc-300 shadow-lg backdrop-blur-xs flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className={`font-bold ${metrics.fps >= 55 ? 'text-emerald-400' : (metrics.fps >= 40 ? 'text-amber-400' : 'text-rose-400')}`}>
              ⚡ {metrics.fps} FPS
            </span>
            <span className="text-zinc-500">({metrics.avgFrameTimeMs}ms)</span>
          </div>
          <div className="text-zinc-400">
            👾 Enemies: <span className="font-bold text-white">{metrics.activeEnemies}</span>
          </div>
          <div className="text-zinc-400">
            🎯 Bullets: <span className="font-bold text-cyan-300">{metrics.activeProjectiles}</span>
          </div>
          <div className="text-zinc-400">
            ✨ VFX: <span className="font-bold text-amber-300">{metrics.activeVfx}</span> | Tier {metrics.qualityTier}
          </div>
        </div>
      )}
    </div>
  );
};
