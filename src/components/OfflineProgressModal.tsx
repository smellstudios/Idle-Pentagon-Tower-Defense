/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Clock, Sparkles, Check } from 'lucide-react';
import { OfflineProgressResult } from '../game/offline';

interface Props {
  report: OfflineProgressResult | null;
  onClaim: () => void;
}

export const OfflineProgressModal: React.FC<Props> = ({ report, onClaim }) => {
  if (!report) return null;

  const hours = Math.floor(report.cappedSeconds / 3600);
  const minutes = Math.floor((report.cappedSeconds % 3600) / 60);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-zinc-950 border border-sky-500/40 rounded-2xl shadow-[0_0_50px_rgba(56,189,248,0.2)] p-5 flex flex-col text-center"
      >
        <div className="mx-auto mb-3 p-3 rounded-2xl bg-sky-950/60 border border-sky-500/40 text-sky-400 shadow-[0_0_20px_rgba(56,189,248,0.3)]">
          <Clock className="w-8 h-8" />
        </div>

        <h2 className="text-base font-black font-mono tracking-wider text-white">
          WELCOME BACK, COMMANDER
        </h2>
        <p className="text-[11px] text-zinc-400 mt-1">
          Your automated tower continued combat operations while you were away.
        </p>

        <div className="my-4 space-y-2 text-left font-mono text-xs">
          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 flex justify-between items-center">
            <span className="text-zinc-400">Simulation Time:</span>
            <span className="text-white font-bold">{hours}h {minutes}m</span>
          </div>

          <div className="p-2.5 rounded-xl bg-zinc-900/60 border border-white/5 flex justify-between items-center">
            <span className="text-zinc-400">Waves Cleared:</span>
            <span className="text-sky-400 font-bold">+{report.wavesCleared} Waves (Now Wave {report.finalWave})</span>
          </div>

          <div className="p-2.5 rounded-xl bg-sky-950/30 border border-sky-500/30 flex justify-between items-center">
            <span className="text-sky-300">Stardust Harvested:</span>
            <span className="text-sky-300 font-black">+{report.stardustEarned} ✦</span>
          </div>

          {report.shardsEarned > 0 && (
            <div className="p-2.5 rounded-xl bg-purple-950/40 border border-purple-500/40 flex justify-between items-center">
              <span className="text-purple-300 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Bonus Cosmic Shards:
              </span>
              <span className="text-purple-300 font-black">+{report.shardsEarned} 💠</span>
            </div>
          )}
        </div>

        <button
          onClick={onClaim}
          className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 active:scale-95 text-white font-mono text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(56,189,248,0.4)] transition-all cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>COLLECT REWARDS</span>
        </button>
      </motion.div>
    </div>
  );
};
