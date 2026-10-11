/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Target } from 'lucide-react';

export interface GameToast {
  id: string;
  title: string;
  subtitle: string;
  type: 'mission' | 'milestone';
}

interface Props {
  toasts: GameToast[];
  onRemove: (id: string) => void;
  onClickToast?: (toast: GameToast) => void;
}

export const MissionsMilestonesToasts: React.FC<Props> = ({
  toasts,
  onRemove,
  onClickToast,
}) => {
  return (
    <div className="fixed bottom-24 sm:bottom-28 right-4 z-40 flex flex-col gap-2.5 max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const isMilestone = toast.type === 'milestone';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 50, scale: 0.95 }}
              transition={{ type: 'spring', damping: 15, stiffness: 120 }}
              onClick={() => {
                if (onClickToast) onClickToast(toast);
                onRemove(toast.id);
              }}
              className={`pointer-events-auto flex items-center gap-3.5 p-3.5 rounded-2xl border cursor-pointer hover:scale-102 transition-all shadow-[0_4px_25px_rgba(0,0,0,0.6)] relative overflow-hidden group select-none min-w-[260px] ${
                isMilestone
                  ? 'bg-purple-950/85 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                  : 'bg-sky-950/85 border-sky-500/50 shadow-[0_0_15px_rgba(14,165,233,0.15)]'
              }`}
            >
              {/* Glossy gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

              {/* Icon Container */}
              <div
                className={`p-2 rounded-xl shrink-0 border ${
                  isMilestone
                    ? 'bg-purple-900/60 border-purple-400/40 text-purple-300'
                    : 'bg-sky-900/60 border-sky-400/40 text-sky-300'
                }`}
              >
                {isMilestone ? (
                  <Trophy className="w-4 h-4 animate-bounce" />
                ) : (
                  <Target className="w-4 h-4 animate-spin-slow" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0 pr-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 block">
                  {toast.title}
                </span>
                <p className="text-xs font-mono font-black text-white leading-tight break-words mt-0.5">
                  {toast.subtitle}
                </p>
                <span className="text-[9px] font-mono text-zinc-500 block mt-1 uppercase">
                  Tap to view & claim rewards ➔
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
