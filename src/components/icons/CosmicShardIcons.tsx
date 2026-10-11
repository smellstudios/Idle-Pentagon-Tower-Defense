/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

export interface ShardIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number;
}

/**
 * Cosmic Shard Bonus Icon
 * Symmetrical 4-point faceted crystal star with purple cosmic glow (#A855F7).
 */
export const CosmicShardBonusIcon: React.FC<ShardIconProps> = ({
  size = 24,
  strokeWidth = 2,
  className = '',
  style,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
      style={{
        filter: 'drop-shadow(0 0 4px rgba(168, 85, 247, 0.75))',
        ...style,
      }}
      {...props}
    >
      <defs>
        <linearGradient id="cosmicShardTopLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F3E8FF" />
          <stop offset="100%" stopColor="#D8B4FE" />
        </linearGradient>
        <linearGradient id="cosmicShardTopRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E9D5FF" />
          <stop offset="100%" stopColor="#C084FC" />
        </linearGradient>
        <linearGradient id="cosmicShardRightTop" x1="100%" y1="50%" x2="0%" y2="50%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
        <linearGradient id="cosmicShardRightBottom" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
        <linearGradient id="cosmicShardBottomRight" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#7E22CE" />
          <stop offset="100%" stopColor="#6B21A8" />
        </linearGradient>
        <linearGradient id="cosmicShardBottomLeft" x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#6B21A8" />
          <stop offset="100%" stopColor="#581C87" />
        </linearGradient>
        <linearGradient id="cosmicShardLeftBottom" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#9333EA" />
          <stop offset="100%" stopColor="#7E22CE" />
        </linearGradient>
        <linearGradient id="cosmicShardLeftTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="100%" stopColor="#A855F7" />
        </linearGradient>
      </defs>

      {/* 8 Symmetrical Crystal Facets */}
      <polygon points="12,1.5 9.6,9.6 12,12" fill="url(#cosmicShardTopLeft)" stroke="none" />
      <polygon points="12,1.5 12,12 14.4,9.6" fill="url(#cosmicShardTopRight)" stroke="none" />
      <polygon points="14.4,9.6 12,12 22.5,12" fill="url(#cosmicShardRightTop)" stroke="none" />
      <polygon points="22.5,12 12,12 14.4,14.4" fill="url(#cosmicShardRightBottom)" stroke="none" />
      <polygon points="14.4,14.4 12,12 12,22.5" fill="url(#cosmicShardBottomRight)" stroke="none" />
      <polygon points="12,22.5 12,12 9.6,14.4" fill="url(#cosmicShardBottomLeft)" stroke="none" />
      <polygon points="9.6,14.4 12,12 1.5,12" fill="url(#cosmicShardLeftBottom)" stroke="none" />
      <polygon points="1.5,12 12,12 9.6,9.6" fill="url(#cosmicShardLeftTop)" stroke="none" />

      {/* Internal Facet Ridges */}
      <line x1="12" y1="1.5" x2="12" y2="22.5" stroke="#F3E8FF" strokeWidth="0.8" opacity="0.8" />
      <line x1="1.5" y1="12" x2="22.5" y2="12" stroke="#F3E8FF" strokeWidth="0.8" opacity="0.8" />
      <line x1="9.6" y1="9.6" x2="14.4" y2="14.4" stroke="#F3E8FF" strokeWidth="0.6" opacity="0.5" />
      <line x1="14.4" y1="9.6" x2="9.6" y2="14.4" stroke="#F3E8FF" strokeWidth="0.6" opacity="0.5" />

      {/* Symmetrical 4-point Star Outer Silhouette Outline */}
      <path
        d="M 12 1.5 L 14.4 9.6 L 22.5 12 L 14.4 14.4 L 12 22.5 L 9.6 14.4 L 1.5 12 L 9.6 9.6 Z"
        fill="none"
        stroke="#E9D5FF"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Central Star Specular Sparkle */}
      <circle cx="12" cy="12" r="1.1" fill="#FFFFFF" stroke="none" />
    </svg>
  );
};

/**
 * Cosmic Shards Per Round Icon
 * Same symmetrical 4-point faceted crystal star surrounded by an orbital ring (#8B5CF6).
 */
export const CosmicShardsPerRoundIcon: React.FC<ShardIconProps> = ({
  size = 24,
  strokeWidth = 2,
  className = '',
  style,
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
      style={{
        filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.75))',
        ...style,
      }}
      {...props}
    >
      <defs>
        <linearGradient id="cosmicOrbitalTopLeft" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F5F3FF" />
          <stop offset="100%" stopColor="#DDD6FE" />
        </linearGradient>
        <linearGradient id="cosmicOrbitalTopRight" x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#EDE9FE" />
          <stop offset="100%" stopColor="#C4B5FD" />
        </linearGradient>
        <linearGradient id="cosmicOrbitalRightTop" x1="100%" y1="50%" x2="0%" y2="50%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
        <linearGradient id="cosmicOrbitalRightBottom" x1="100%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
        <linearGradient id="cosmicOrbitalBottomRight" x1="50%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="cosmicOrbitalBottomLeft" x1="0%" y1="100%" x2="50%" y2="0%">
          <stop offset="0%" stopColor="#6D28D9" />
          <stop offset="100%" stopColor="#5B21B6" />
        </linearGradient>
        <linearGradient id="cosmicOrbitalLeftBottom" x1="0%" y1="50%" x2="100%" y2="50%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="cosmicOrbitalLeftTop" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#DDD6FE" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>

      {/* Orbital Ring - Back Arc (rendered behind central star) */}
      <path
        d="M 3.2 9.2 C 4.5 5.8, 10.5 4.5, 16.5 6.2 C 19.5 7.1, 21.8 8.6, 22.2 10.3"
        fill="none"
        stroke="#DDD6FE"
        strokeWidth={Math.max(1.2, strokeWidth - 0.4)}
        strokeDasharray="1.5 1.5"
        opacity="0.8"
      />

      {/* Central 4-Point Faceted Crystal Star (Identical geometry proportioned with orbit) */}
      {/* 8 Symmetrical Crystal Facets */}
      <polygon points="12,3.8 10,10 12,12" fill="url(#cosmicOrbitalTopLeft)" stroke="none" />
      <polygon points="12,3.8 12,12 14,10" fill="url(#cosmicOrbitalTopRight)" stroke="none" />
      <polygon points="14,10 12,12 20.2,12" fill="url(#cosmicOrbitalRightTop)" stroke="none" />
      <polygon points="20.2,12 12,12 14,14" fill="url(#cosmicOrbitalRightBottom)" stroke="none" />
      <polygon points="14,14 12,12 12,20.2" fill="url(#cosmicOrbitalBottomRight)" stroke="none" />
      <polygon points="12,20.2 12,12 10,14" fill="url(#cosmicOrbitalBottomLeft)" stroke="none" />
      <polygon points="10,14 12,12 3.8,12" fill="url(#cosmicOrbitalLeftBottom)" stroke="none" />
      <polygon points="3.8,12 12,12 10,10" fill="url(#cosmicOrbitalLeftTop)" stroke="none" />

      {/* Internal Facet Ridges */}
      <line x1="12" y1="3.8" x2="12" y2="20.2" stroke="#EDE9FE" strokeWidth="0.8" opacity="0.8" />
      <line x1="3.8" y1="12" x2="20.2" y2="12" stroke="#EDE9FE" strokeWidth="0.8" opacity="0.8" />
      <line x1="10" y1="10" x2="14" y2="14" stroke="#EDE9FE" strokeWidth="0.5" opacity="0.5" />
      <line x1="14" y1="10" x2="10" y2="14" stroke="#EDE9FE" strokeWidth="0.5" opacity="0.5" />

      {/* Central Star Silhouette Outline */}
      <path
        d="M 12 3.8 L 14 10 L 20.2 12 L 14 14 L 12 20.2 L 10 14 L 3.8 12 L 10 10 Z"
        fill="none"
        stroke="#DDD6FE"
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
      />

      {/* Orbital Ring - Front Arc (sweeps in front across the bottom foreground) */}
      <path
        d="M 22.2 10.3 C 22.6 12.0, 20.2 14.8, 15.5 16.5 C 9.5 18.6, 3.5 17.5, 2.0 14.2 C 1.4 12.8, 1.8 11.2, 3.2 9.2"
        fill="none"
        stroke="#C4B5FD"
        strokeWidth={strokeWidth}
      />

      {/* Orbiting Cosmic Satellite / Pearl Beacon */}
      <circle cx="19.8" cy="8.2" r="1.5" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="1" />

      {/* Central Star Specular Sparkle */}
      <circle cx="12" cy="12" r="0.9" fill="#FFFFFF" stroke="none" />
    </svg>
  );
};

/**
 * Stopwatch Icon (Lucide Stopwatch representation)
 */
export const StopwatchIcon: React.FC<ShardIconProps> = ({
  size = 24,
  strokeWidth = 2,
  className = '',
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`inline-block shrink-0 ${className}`}
      {...props}
    >
      <line x1="10" x2="14" y1="2" y2="2" />
      <line x1="12" x2="12" y1="2" y2="5" />
      <circle cx="12" cy="14" r="8" />
      <polyline points="12 10 12 14 15 14" />
      <line x1="19" x2="20.5" y1="6.5" y2="8" />
    </svg>
  );
};
