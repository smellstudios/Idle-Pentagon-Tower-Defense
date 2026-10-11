/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';

interface Props {
  size?: number | string;
  className?: string;
  animateEyes?: boolean;
  interactive?: boolean;
}

/**
 * Pixel Pentagons In-Game Player Character SVG
 * Matches the exact geometry from src/game/Renderer.ts:
 * - Regular pentagon body in vibrant emerald (#10b981)
 * - Deep emerald inner contour (#064e3b) and protective energy glow (#34d399)
 * - Iconic twin white sclera eyes with dark emerald pupils and glistening catchlights
 * - Interactive gaze and natural idle blink animation
 */
export const PlayerPentagonIcon: React.FC<Props> = ({
  size = 110,
  className = '',
  animateEyes = true,
  interactive = true,
}) => {
  const [pupilOffset, setPupilOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  // Natural idle glancing and blinking
  useEffect(() => {
    if (!animateEyes) return;

    // Periodic natural glance
    const glanceInterval = setInterval(() => {
      // Random subtle shift between -1.5px and 1.5px
      const randomX = (Math.random() - 0.5) * 2.8;
      const randomY = (Math.random() - 0.5) * 1.8;
      setPupilOffset({ x: randomX, y: randomY });
    }, 2800);

    // Periodic blink
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 4500);

    return () => {
      clearInterval(glanceInterval);
      clearInterval(blinkInterval);
    };
  }, [animateEyes]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = (e.clientX - centerX) / (rect.width / 2);
    const dy = (e.clientY - centerY) / (rect.height / 2);
    // Clamp to eye range
    setPupilOffset({
      x: Math.max(-2.2, Math.min(2.2, dx * 2.2)),
      y: Math.max(-1.8, Math.min(1.8, dy * 1.8)),
    });
  };

  const handleMouseLeave = () => {
    if (!interactive) return;
    setPupilOffset({ x: 0, y: 0 });
  };

  // Base eye coordinates
  const eyeY = 44.6;
  const leftEyeX = 39.1;
  const rightEyeX = 60.9;
  const scleraRadius = 6.8;
  const pupilRadius = 3.3;

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible filter drop-shadow-[0_0_18px_rgba(52,211,153,0.7)]"
      >
        <defs>
          {/* Main Emerald Body Gradient */}
          <linearGradient id="playerEmeraldGrad" x1="50" y1="12" x2="50" y2="82" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="40%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>

          {/* Core Energy Shield Highlight */}
          <radialGradient id="playerShieldGlow" cx="50" cy="45" r="40" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a7f3d0" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#10b981" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* 1. Ground Drop Shadow (exact from Renderer.ts ellipse) */}
        <ellipse cx="50" cy="85" rx="30" ry="5.5" fill="#000000" opacity="0.35" />

        {/* 2. Outer Protective Energy Glow Contour */}
        <polygon
          points="50,12 86.14,38.26 72.34,80.74 27.66,80.74 13.86,38.26"
          fill="none"
          stroke="#34d399"
          strokeWidth="4"
          strokeLinejoin="round"
          opacity="0.45"
        />

        {/* 3. Main Pentagon Solid Body */}
        <polygon
          points="50,12 86.14,38.26 72.34,80.74 27.66,80.74 13.86,38.26"
          fill="url(#playerEmeraldGrad)"
          stroke="#064e3b"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* 4. Soft Inner Core Energy Shield */}
        <polygon
          points="50,15 82.5,39 70,78 30,78 17.5,39"
          fill="url(#playerShieldGlow)"
          stroke="#a7f3d0"
          strokeWidth="0.8"
          strokeLinejoin="round"
          opacity="0.6"
        />

        {/* 5. Eyes Subsystem */}
        {!isBlinking ? (
          <g id="player-eyes">
            {/* White Sclera (Left & Right) */}
            <circle cx={leftEyeX} cy={eyeY} r={scleraRadius} fill="#FFFFFF" stroke="#064e3b" strokeWidth="0.75" />
            <circle cx={rightEyeX} cy={eyeY} r={scleraRadius} fill="#FFFFFF" stroke="#064e3b" strokeWidth="0.75" />

            {/* Dark Emerald Pupils (exact color 0x064e3b from Renderer.ts) */}
            <circle
              cx={leftEyeX + pupilOffset.x}
              cy={eyeY + pupilOffset.y}
              r={pupilRadius}
              fill="#064e3b"
            />
            <circle
              cx={rightEyeX + pupilOffset.x}
              cy={eyeY + pupilOffset.y}
              r={pupilRadius}
              fill="#064e3b"
            />

            {/* Catchlight Specular Reflections (Left & Right) */}
            <circle
              cx={leftEyeX + pupilOffset.x - 1.1}
              cy={eyeY + pupilOffset.y - 1.1}
              r={1.05}
              fill="#FFFFFF"
            />
            <circle
              cx={rightEyeX + pupilOffset.x - 1.1}
              cy={eyeY + pupilOffset.y - 1.1}
              r={1.05}
              fill="#FFFFFF"
            />
          </g>
        ) : (
          /* Blink Closed-Eye Curved Slits */
          <g id="player-eyes-blink" stroke="#064e3b" strokeWidth="1.8" strokeLinecap="round" fill="none">
            <path d={`M ${leftEyeX - 4} ${eyeY} Q ${leftEyeX} ${eyeY + 2.5} ${leftEyeX + 4} ${eyeY}`} />
            <path d={`M ${rightEyeX - 4} ${eyeY} Q ${rightEyeX} ${eyeY + 2.5} ${rightEyeX + 4} ${eyeY}`} />
          </g>
        )}
      </svg>
    </div>
  );
};
