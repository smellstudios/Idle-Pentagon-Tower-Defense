/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GameState } from '../types';
import { X, Trophy, Gem } from 'lucide-react';
import { formatCurrency } from '../utils/format';
import { MilestonesPanel } from './MilestonesPanel';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onClaimMilestone: (tier: number, wave: number) => void;
  onClaimAllMilestones?: (tier?: number) => void;
  initialTier?: number;
  onSetTier?: (tier: number) => void;
}

export const MilestonesModal: React.FC<Props> = ({
  isOpen,
  onClose,
  gameState,
  onClaimMilestone,
  onClaimAllMilestones,
  initialTier = 1,
  onSetTier,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-lg">
        <motion.div
          initial={{ scale: 0.96, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 12 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="bg-zinc-950 border border-white/10 w-full max-w-5xl rounded-2xl shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col max-h-[94vh] sm:max-h-[90vh] overflow-hidden"
        >
          {/* Top Modal Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300 shadow-inner flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-mono font-black text-white tracking-wider uppercase">
                  SECTOR MILESTONES & REWARDS
                </h2>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Browse categorized wave records across sector tiers
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Currency Display */}
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-300 font-mono text-xs font-bold shadow-inner">
                  <span className="text-purple-400 font-black">✦</span>
                  <span>{formatCurrency(gameState.cosmicShards, gameState.settings?.useLegacyCurrencyFormat)}</span>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-sky-950/40 border border-sky-500/30 text-sky-300 font-mono text-xs font-bold shadow-inner">
                  <Gem className="w-3.5 h-3.5 text-sky-400" />
                  <span>{formatCurrency(gameState.gems, gameState.settings?.useLegacyCurrencyFormat)}</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 sm:p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all border border-white/10 cursor-pointer active:scale-95"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 bg-zinc-950/80 custom-scrollbar">
            <MilestonesPanel
              gameState={gameState}
              onClaimMilestone={onClaimMilestone}
              onClaimAllMilestones={onClaimAllMilestones}
              initialTier={initialTier}
              onSetTier={onSetTier}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
