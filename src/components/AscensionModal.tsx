/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowUpRight, Skull, RotateCcw, Layers, Coins } from 'lucide-react';
import { AscensionSummaryData } from '../types';
import { formatCurrency } from '../utils/format';

interface Props {
  isOpen: boolean;
  isDead: boolean;
  onClose: () => void;
  onConfirmAscension: () => void;
  onOpenSkillTree?: () => void;
  summary: AscensionSummaryData;
  ascensionCount: number;
}

export const AscensionModal: React.FC<Props> = ({
  isOpen,
  isDead,
  onClose,
  onConfirmAscension,
  onOpenSkillTree,
  summary,
  ascensionCount,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        className="w-full max-w-sm bg-zinc-950 border border-purple-500/50 rounded-2xl shadow-[0_0_60px_rgba(168,85,247,0.3)] p-5 flex flex-col text-center"
      >
        {/* Icon & Title */}
        <div className="mx-auto mb-3 p-3 rounded-2xl bg-purple-950/70 border border-purple-500/50 text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.35)]">
          {isDead ? (
            <Skull className="w-8 h-8 text-rose-400" />
          ) : (
            <Sparkles className="w-8 h-8 text-purple-400 animate-pulse" />
          )}
        </div>

        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold uppercase tracking-wider">
            Prestige Cycle #{ascensionCount + 1}
          </span>
        </div>

        <h2 className="text-base font-black font-mono tracking-wider text-white mt-1">
          {isDead ? 'FORTRESS BREACHED' : 'COSMIC ASCENSION'}
        </h2>
        <p className="text-[11px] text-zinc-300 mt-1 leading-snug">
          {isDead
            ? 'Your fortress has fallen. Soft-reset to claim permanent tokens and unlock game-changing matrix boosts.'
            : 'Soft-reset in-run wave progress to claim permanent Cosmic Shards & Pentagon Tokens based on wave depth!'}
        </p>

        {/* Shard Reward Highlight Card */}
        <div className="my-3.5 p-3.5 rounded-xl bg-purple-900/25 border border-purple-500/50 flex flex-col items-center justify-center shadow-[0_0_25px_rgba(168,85,247,0.2)]">
          <span className="text-[10px] font-mono text-purple-300 font-bold uppercase tracking-wider flex items-center gap-1">
            <span className="text-xs">✦</span> Cosmic Shards / Pentagon Tokens
          </span>
          <div className="flex items-center gap-2 mt-1">
            <Sparkles className="w-6 h-6 text-purple-400 animate-pulse" />
            <span className="text-3xl font-black font-mono text-white tracking-tight">
              +{formatCurrency(summary.totalShardsEarned)}
            </span>
          </div>
          {summary.techBonusShards !== undefined && summary.techBonusShards > 0 && (
            <span className="text-[9.5px] font-mono text-emerald-400 mt-1 font-semibold">
              Includes +{formatCurrency(summary.techBonusShards)} bonus tokens from Skill Tree!
            </span>
          )}
        </div>

        {/* Run Breakdown Stats */}
        <div className="space-y-1.5 text-[11px] font-mono mb-3 bg-zinc-900/50 p-3 rounded-xl border border-white/5 text-left">
          <div className="flex justify-between text-zinc-400">
            <span>Wave Reached:</span>
            <span className="text-white font-bold">Wave {summary.waveReached}</span>
          </div>
          <div className="flex justify-between text-zinc-400">
            <span>Enemies Defeated:</span>
            <span className="text-white font-bold">{formatCurrency(summary.enemiesDefeated)}</span>
          </div>
          {summary.reservedCashGained !== undefined && (
            <div className="flex justify-between text-emerald-400 pt-1 border-t border-white/5">
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-emerald-400" />
                Starting Cash Next Run:
              </span>
              <span className="font-bold text-emerald-300">${formatCurrency(summary.reservedCashGained)}</span>
            </div>
          )}
        </div>

        <div className="p-2 rounded-lg bg-zinc-900/40 border border-white/5 text-[9.5px] font-mono text-zinc-400 mb-3 text-left">
          ℹ️ <span className="text-zinc-200">Soft-reset:</span> In-run wave & cash reset, but all <span className="text-purple-300 font-bold">Skill Tree, Workshop, Lab</span>, and Cards are <span className="text-emerald-400 font-bold">permanently kept</span>.
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirmAscension}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-mono text-xs font-black tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all cursor-pointer"
          >
            {isDead ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>CLAIM TOKENS & RESTART</span>
              </>
            ) : (
              <>
                <ArrowUpRight className="w-4 h-4" />
                <span>ASCEND NOW (+{summary.totalShardsEarned} TOKENS)</span>
              </>
            )}
          </button>

          {onOpenSkillTree && (
            <button
              onClick={() => {
                onClose();
                onOpenSkillTree();
              }}
              className="w-full py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer border border-purple-500/40 flex items-center justify-center gap-2"
            >
              <Layers className="w-4 h-4 text-purple-400" />
              <span>OPEN PERMANENT SKILL TREE</span>
            </button>
          )}

          {!isDead && (
            <button
              onClick={onClose}
              className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white font-mono text-xs font-bold transition-colors cursor-pointer border border-white/5"
            >
              CONTINUE CURRENT RUN
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};
