/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { GameManager } from '../game/GameManager';

interface Props {
  gameManager: GameManager | null;
}

export const GameCanvas: React.FC<Props> = ({ gameManager }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-zinc-900">
      <canvas id="game-canvas" ref={canvasRef} className="block mx-auto" />
    </div>
  );
};
