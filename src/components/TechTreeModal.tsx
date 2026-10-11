/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Sparkles, 
  Flame, 
  ShieldCheck, 
  Zap, 
  Compass, 
  Lock, 
  CheckCircle2, 
  Layers
} from 'lucide-react';
import { 
  TECH_TREE_BRANCHES, 
  TECH_TREE_NODES, 
  canUnlockTechNode, 
  TechNode 
} from '../game/techTree';
import { soundEngine } from '../game/sound';
import { formatCurrency } from '../utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenLab?: () => void;
  cosmicShards: number;
  unlockedNodeIds: string[];
  onUnlockNode: (nodeId: string) => { success: boolean; reason?: string };
}

export const TechTreeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onOpenLab,
  cosmicShards,
  unlockedNodeIds,
  onUnlockNode,
}) => {
  const [activeBranch, setActiveBranch] = useState<TechNode['branch']>('firepower');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const currentBranchDef = TECH_TREE_BRANCHES.find(b => b.id === activeBranch)!;
  const branchNodes = TECH_TREE_NODES.filter(n => n.branch === activeBranch);

  const handleUnlock = (nodeId: string) => {
    const res = onUnlockNode(nodeId);
    if (!res.success && res.reason) {
      setFeedbackMsg(res.reason);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } else if (res.success) {
      soundEngine.playTechUnlock();
    }
  };

  const getBranchIcon = (branchId: TechNode['branch']) => {
    switch (branchId) {
      case 'firepower': return <Flame className="w-4 h-4" />;
      case 'fortification': return <ShieldCheck className="w-4 h-4" />;
      case 'efficiency': return <Zap className="w-4 h-4" />;
      case 'ascension_mastery': return <Compass className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="w-full max-w-lg bg-zinc-950 border border-purple-500/30 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.2)] flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black font-mono tracking-wider text-white flex items-center gap-1.5">
                WORKSHOP TECH TREE
              </h2>
              <p className="text-[10px] text-zinc-400">Permanent upgrades that persist across all ascensions</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenLab && (
              <button
                onClick={() => {
                  soundEngine.playTabSwitch();
                  onClose();
                  onOpenLab();
                }}
                className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-950/60 border border-teal-500/40 text-teal-300 font-mono text-[10px] font-bold hover:bg-teal-900 transition-all cursor-pointer"
              >
                <span>🔬 LAB</span>
              </button>
            )}

            {/* Cosmic Shards Balance */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 font-mono text-xs font-black shadow-[0_0_12px_rgba(168,85,247,0.3)]">
              <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
              <span>{formatCurrency(cosmicShards)}</span>
              <span className="text-[9px] text-purple-400 font-normal">TOKENS</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Branch Tabs */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-black/40 border-b border-white/5">
          {TECH_TREE_BRANCHES.map(b => {
            const isSelected = activeBranch === b.id;
            const branchNodes = TECH_TREE_NODES.filter(n => n.branch === b.id);
            const unlockedInBranch = branchNodes.filter(n => unlockedNodeIds.includes(n.id)).length;

            return (
              <button
                key={b.id}
                onClick={() => {
                  soundEngine.playTabSwitch();
                  setActiveBranch(b.id);
                }}
                className={`flex flex-col items-center py-2 px-1 rounded-xl transition-all cursor-pointer border text-center ${
                  isSelected
                    ? 'bg-purple-900/30 border-purple-500/60 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    : 'bg-zinc-900/30 border-white/5 text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200'
                }`}
              >
                <div className={isSelected ? 'text-purple-400' : 'text-zinc-500'}>
                  {getBranchIcon(b.id)}
                </div>
                <span className="text-[9.5px] font-bold font-mono mt-1 text-center leading-tight break-words px-0.5">
                  {b.name}
                </span>
                <span className="text-[8px] font-mono text-zinc-500">
                  {unlockedInBranch}/{b.nodeCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Branch Header Description */}
        <div className="px-4 py-2 bg-purple-950/20 border-b border-white/5 flex items-center justify-between text-[11px] text-purple-300">
          <span className="font-mono font-bold">{currentBranchDef.name}:</span>
          <span className="text-zinc-400 text-[10px]">{currentBranchDef.focus}</span>
        </div>

        {/* Feedback Message */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-amber-950/80 border-b border-amber-500/30 text-amber-300 text-xs px-4 py-1.5 font-mono text-center"
            >
              {feedbackMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Nodes List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {branchNodes.map((node, index) => {
            const isUnlocked = unlockedNodeIds.includes(node.id);
            const { canUnlock, reason } = canUnlockTechNode(node.id, unlockedNodeIds);
            const canAfford = cosmicShards >= node.cost;

            return (
              <div
                key={node.id}
                className={`relative rounded-xl p-3 border transition-all flex items-center justify-between gap-3 ${
                  isUnlocked
                    ? 'bg-emerald-950/20 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.1)]'
                    : canUnlock
                    ? 'bg-zinc-900/60 border-purple-500/40 hover:border-purple-500/80 shadow-[0_0_15px_rgba(168,85,247,0.15)]'
                    : 'bg-zinc-950/60 border-white/5 opacity-55'
                } ${node.isCapstone ? 'ring-1 ring-amber-500/40 bg-amber-950/10' : ''}`}
              >
                {/* Node Order Badge & Info */}
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-black shrink-0 border ${
                    isUnlocked
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : canUnlock
                      ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                      : 'bg-zinc-900 border-white/10 text-zinc-600'
                  }`}>
                    {isUnlocked ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : canUnlock ? (
                      index + 1
                    ) : (
                      <Lock className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <h4 className="font-mono text-xs font-black text-white">
                        {node.name}
                      </h4>
                      {node.statType === 'fire_rate_percent' && (
                        <span className="text-[7.5px] px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono font-bold">
                          ⚡ PERM ATTACK SPEED
                        </span>
                      )}
                      {node.statType === 'starting_cash_boost' && (
                        <span className="text-[7.5px] px-1.5 py-0.2 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                          💰 STARTING CASH
                        </span>
                      )}
                      {node.statType === 'auto_battle_speed_mult' && (
                        <span className="text-[7.5px] px-1.5 py-0.2 rounded bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-bold">
                          ⏩ AUTO-BATTLE SPEED
                        </span>
                      )}
                      {node.statType === 'shard_gain_multiplier' && (
                        <span className="text-[7.5px] px-1.5 py-0.2 rounded bg-purple-500/20 border border-purple-500/40 text-purple-300 font-mono font-bold">
                          ✦ TOKEN YIELD
                        </span>
                      )}
                      {node.isCapstone && (
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono font-bold">
                          CAPSTONE
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-300 mt-0.5">
                      {node.description}
                    </p>
                    {!isUnlocked && !canUnlock && reason && (
                      <p className="text-[9px] text-amber-400/80 font-mono mt-0.5">
                        ⚠️ {reason}
                      </p>
                    )}
                  </div>
                </div>

                {/* Purchase / Status Button */}
                <div className="shrink-0">
                  {isUnlocked ? (
                    <div className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold">
                      ACTIVE
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUnlock(node.id)}
                      disabled={!canUnlock || !canAfford}
                      className={`px-3 py-1.5 rounded-xl font-mono text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        canUnlock && canAfford
                          ? 'bg-purple-600 hover:bg-purple-500 active:scale-95 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                          : 'bg-zinc-900 border border-white/10 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      <span className="text-purple-300 font-black text-xs leading-none">✦</span>
                      <span>{node.cost}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="p-2.5 bg-black/50 border-t border-white/5 text-center text-[9px] font-mono text-zinc-500">
          First 10 nodes balanced within a 3-5x price step. Capstones reward branch diversification.
        </div>
      </motion.div>
    </div>
  );
};
