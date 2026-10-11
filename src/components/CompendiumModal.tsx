/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RareDropProgress, RarityTier, ActiveRareDrop, RareDropType } from '../types';
import { RARE_DROPS_DEFINITIONS, RARITY_CONFIGS } from '../game/constants';
import { Sparkles, X, Layers, Shield, Zap, Plus, Check, ArrowUpRight, Flame } from 'lucide-react';
import { CardIcon } from './Icons';
import { soundEngine } from '../game/sound';

interface Props {
  isOpen: boolean;
  rareDropCollection: Record<string, RareDropProgress>;
  activeRareDrops: ActiveRareDrop[];
  synergySlots: number;
  cosmicShards: number;
  gems: number;
  cells: number;
  onSynthesize?: (skillId: RareDropType, currency: 'shards' | 'gems' | 'cells') => boolean;
  onUpgrade?: (skillId: RareDropType, currency: 'shards' | 'gems' | 'copies') => boolean;
  onToggleEquip?: (skillId: RareDropType) => void;
  onExpandSlots?: () => boolean;
  onClose: () => void;
}

export const CompendiumModal: React.FC<Props> = ({
  isOpen,
  rareDropCollection,
  activeRareDrops,
  synergySlots,
  cosmicShards,
  gems,
  cells,
  onSynthesize,
  onUpgrade,
  onToggleEquip,
  onExpandSlots,
  onClose,
}) => {
  const [feedback, setFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const slotExpandCost = synergySlots === 1 ? 40 : synergySlots === 2 ? 80 : synergySlots === 3 ? 150 : 300;
  const canExpandSlots = cosmicShards >= slotExpandCost && synergySlots < 5;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          className="bg-zinc-950 border border-amber-500/35 w-full max-w-2xl rounded-2xl shadow-[0_0_50px_rgba(245,158,11,0.18)] flex flex-col max-h-[88vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-amber-950/60 border border-amber-500/40 text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-mono font-black text-white tracking-wider uppercase">
                  Tactical Skills & Synergy Matrix Forge
                </h2>
                <p className="text-[10px] text-zinc-400 font-mono">
                  Synthesize, upgrade, and equip active tactical skill matrices
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Top Status: Active Slots & Slot Expansion */}
          <div className="px-4 py-3 bg-zinc-900/40 border-b border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-white">
                    Active Combat Synergy Slots:
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-500/50 text-indigo-300 font-mono text-[10px] font-black">
                    {activeRareDrops.length} / {synergySlots} Equipped
                  </span>
                </div>
                <span className="text-[9.5px] font-mono text-zinc-400">
                  Equipped skills fire concurrently during real-time tower combat.
                </span>
              </div>
            </div>

            {/* Expand Slot Button */}
            {synergySlots < 5 && onExpandSlots && (
              <button
                onClick={() => {
                  const ok = onExpandSlots();
                  if (ok) showFeedback('Tactical Synergy Slot Expanded!');
                }}
                disabled={!canExpandSlots}
                className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  canExpandSlots
                    ? 'bg-purple-950/80 border-purple-500/60 text-purple-200 hover:bg-purple-900 active:scale-95 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-60'
                }`}
                title="Expand maximum active skill synergy slots"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Expand Slot (✦ {slotExpandCost})</span>
              </button>
            )}
          </div>

          {feedback && (
            <div className="px-4 py-1.5 bg-amber-950/80 border-b border-amber-500/50 text-amber-300 font-mono text-xs font-bold text-center animate-pulse">
              {feedback}
            </div>
          )}

          {/* Cards Gallery & Forge Grid */}
          <div className="p-4 overflow-y-auto space-y-3 custom-scrollbar flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {RARE_DROPS_DEFINITIONS.map((def) => {
                const progress = rareDropCollection[def.id] || { level: 0, copies: 0, highestRaritySeen: 'common' };
                const highestRarity = RARITY_CONFIGS[progress.highestRaritySeen as RarityTier] || RARITY_CONFIGS.rare;
                const isUnlocked = progress.level > 0 || progress.copies > 0;
                const isEquipped = activeRareDrops.some(d => d.id === def.id);
                const slotsFull = activeRareDrops.length >= synergySlots;

                const SHARD_SYNTH_COST = 40;
                const GEM_SYNTH_COST = 12;
                const CELL_SYNTH_COST = 60;

                const shardUpgradeCost = Math.round(25 * Math.pow(1.25, progress.level || 1));
                const canAffordShardUpgrade = cosmicShards >= shardUpgradeCost && progress.level < 15;
                const canAffordGemUpgrade = gems >= 10 && progress.level < 15;
                const canFreeUpgrade = progress.copies >= 3 && progress.level < 15;

                return (
                  <div
                    key={def.id}
                    className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all select-none relative ${
                      isEquipped
                        ? 'bg-zinc-900/90 border-cyan-500/70 shadow-[0_0_20px_rgba(6,182,212,0.18)]'
                        : isUnlocked
                        ? 'bg-zinc-900/80 border-amber-500/30'
                        : 'bg-zinc-950/70 border-white/5 opacity-75'
                    }`}
                  >
                    <div>
                      {/* Top Bar */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <CardIcon icon={def.icon} className="w-6 h-6" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs font-mono font-bold text-white leading-tight">
                                {def.name}
                              </h3>
                              {isEquipped && (
                                <span className="text-[8px] font-mono font-black uppercase px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/50 text-cyan-300">
                                  ACTIVE
                                </span>
                              )}
                            </div>
                            <span
                              className="text-[9px] font-mono font-black uppercase tracking-wider block mt-0.5"
                              style={{ color: isUnlocked ? highestRarity.colorHex : '#71717a' }}
                            >
                              {isUnlocked ? `${highestRarity.name} • Lv. ${progress.level}` : 'Locked Protocol'}
                            </span>
                          </div>
                        </div>

                        {/* Level & Copy Badge */}
                        <div className="text-right">
                          <span className="text-[10px] font-mono font-black text-amber-400 block">
                            {isUnlocked ? `Lv. ${progress.level}` : 'UNLOCKED: NO'}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-400">
                            {progress.level >= 15 ? 'MAXED' : `${progress.copies}/3 Copies`}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-[9.5px] font-mono text-zinc-400 leading-relaxed bg-zinc-950/80 p-2 rounded-xl border border-white/5">
                        {def.description}
                      </p>

                      {/* Progress Bar for Copies */}
                      {isUnlocked && (
                        <div className="my-2">
                          <div className="flex items-center justify-between text-[8px] font-mono text-zinc-500 mb-0.5">
                            <span>Matrix Synchronization</span>
                            <span>{progress.level >= 15 ? '100%' : `${progress.copies}/3 Copies`}</span>
                          </div>
                          <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-amber-400 h-full transition-all duration-300"
                              style={{
                                width: `${progress.level >= 15 ? 100 : (progress.copies / 3) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                      {isUnlocked ? (
                        <>
                          {/* Equip / Unequip Toggle */}
                          {onToggleEquip && (
                            <button
                              onClick={() => onToggleEquip(def.id as RareDropType)}
                              disabled={!isEquipped && slotsFull}
                              className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                                isEquipped
                                  ? 'bg-cyan-950 border border-cyan-500 text-cyan-300 hover:bg-cyan-900 active:scale-95'
                                  : slotsFull
                                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed'
                                  : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900 active:scale-95'
                              }`}
                            >
                              {isEquipped ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Equipped</span>
                                </>
                              ) : (
                                <span>{slotsFull ? 'Slots Full' : 'Equip'}</span>
                              )}
                            </button>
                          )}

                          {/* Upgrade Options */}
                          {onUpgrade && progress.level < 15 && (
                            <div className="flex items-center gap-1.5">
                              {canFreeUpgrade ? (
                                <button
                                  onClick={() => {
                                    const ok = onUpgrade(def.id as RareDropType, 'copies');
                                    if (ok) showFeedback(`${def.name} Overclocked!`);
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-mono text-[10px] font-black hover:brightness-110 active:scale-95 cursor-pointer shadow-md animate-bounce"
                                >
                                  ⚡ Free Upgrade (3/3)
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      const ok = onUpgrade(def.id as RareDropType, 'shards');
                                      if (ok) showFeedback(`${def.name} Upgraded to Lv. ${progress.level + 1}!`);
                                    }}
                                    disabled={!canAffordShardUpgrade}
                                    className={`px-2 py-1 rounded-lg border font-mono text-[9px] font-bold transition-all cursor-pointer ${
                                      canAffordShardUpgrade
                                        ? 'bg-purple-950/90 border-purple-500/50 text-purple-200 hover:bg-purple-900 active:scale-95'
                                        : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                                    }`}
                                    title={`Upgrade with ${shardUpgradeCost} Cosmic Shards`}
                                  >
                                    ✦ {shardUpgradeCost}
                                  </button>

                                  <button
                                    onClick={() => {
                                      const ok = onUpgrade(def.id as RareDropType, 'gems');
                                      if (ok) showFeedback(`${def.name} Upgraded to Lv. ${progress.level + 1}!`);
                                    }}
                                    disabled={!canAffordGemUpgrade}
                                    className={`px-2 py-1 rounded-lg border font-mono text-[9px] font-bold transition-all cursor-pointer ${
                                      canAffordGemUpgrade
                                        ? 'bg-sky-950/90 border-sky-500/50 text-sky-200 hover:bg-sky-900 active:scale-95'
                                        : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                                    }`}
                                    title="Upgrade with 10 Gems"
                                  >
                                    💎 10
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        /* Synthesis Buttons for Locked Skills */
                        onSynthesize && (
                          <div className="w-full flex items-center justify-between gap-1.5">
                            <span className="text-[9px] font-mono text-zinc-400">
                              Synthesize Protocol:
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  const ok = onSynthesize(def.id as RareDropType, 'shards');
                                  if (ok) showFeedback(`${def.name} Synthesized & Imprinted!`);
                                }}
                                disabled={cosmicShards < SHARD_SYNTH_COST}
                                className={`px-2 py-1 rounded-lg border font-mono text-[9px] font-bold transition-all cursor-pointer ${
                                  cosmicShards >= SHARD_SYNTH_COST
                                    ? 'bg-purple-950 border-purple-500 text-purple-200 hover:bg-purple-900 active:scale-95'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                                }`}
                                title="Synthesize using 40 Cosmic Shards"
                              >
                                ✦ {SHARD_SYNTH_COST}
                              </button>

                              <button
                                onClick={() => {
                                  const ok = onSynthesize(def.id as RareDropType, 'gems');
                                  if (ok) showFeedback(`${def.name} Synthesized & Imprinted!`);
                                }}
                                disabled={gems < GEM_SYNTH_COST}
                                className={`px-2 py-1 rounded-lg border font-mono text-[9px] font-bold transition-all cursor-pointer ${
                                  gems >= GEM_SYNTH_COST
                                    ? 'bg-sky-950 border-sky-500 text-sky-200 hover:bg-sky-900 active:scale-95'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                                }`}
                                title="Synthesize using 12 Gems"
                              >
                                💎 {GEM_SYNTH_COST}
                              </button>

                              <button
                                onClick={() => {
                                  const ok = onSynthesize(def.id as RareDropType, 'cells');
                                  if (ok) showFeedback(`${def.name} Synthesized & Imprinted!`);
                                }}
                                disabled={cells < CELL_SYNTH_COST}
                                className={`px-2 py-1 rounded-lg border font-mono text-[9px] font-bold transition-all cursor-pointer ${
                                  cells >= CELL_SYNTH_COST
                                    ? 'bg-amber-950 border-amber-500 text-amber-200 hover:bg-amber-900 active:scale-95'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                                }`}
                                title="Synthesize using 60 Research Cells"
                              >
                                🧪 {CELL_SYNTH_COST}
                              </button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer Info */}
          <div className="p-3 border-t border-white/10 bg-zinc-900/50 text-center">
            <span className="text-[10px] font-mono text-zinc-400">
              💡 Skills can be acquired via <strong>Synthesis Forge</strong>, <strong>Research Labs</strong>, <strong>Card Packs</strong>, or <strong>Boss Drops</strong>!
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
