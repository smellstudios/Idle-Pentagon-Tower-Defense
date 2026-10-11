/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RareDropProgress, RarityTier, ActiveRareDrop, RareDropType } from '../types';
import { RARE_DROPS_DEFINITIONS, RARITY_CONFIGS } from '../game/constants';
import { Sparkles, X, Cpu, Layers, Plus, Check, Zap, Flame, Shield, ArrowUpRight } from 'lucide-react';
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

interface SynergyCombo {
  id: string;
  name: string;
  icon: string;
  color: string;
  desc: string;
  requires: [string, string];
  isActive: boolean;
  isPartial: boolean;
}

const ALL_SYNERGY_COMBOS: Omit<SynergyCombo, 'isActive' | 'isPartial'>[] = [
  {
    id: 'toxic_detonation',
    name: 'Toxic Detonation',
    icon: '☣️',
    color: '#10b981',
    desc: 'Rockets detonate poison into massive caustic burst clouds.',
    requires: ['rockets', 'poison'],
  },
  {
    id: 'shock_barrage',
    name: 'Shock Barrage',
    icon: '⚡',
    color: '#38bdf8',
    desc: 'Rockets discharge high-voltage chained arcs upon impact.',
    requires: ['rockets', 'lightning_chain'],
  },
  {
    id: 'prismatic_zap',
    name: 'Prismatic Zap',
    icon: '💫',
    color: '#06b6d4',
    desc: 'Laser sweeps jump electric arcs across all intercepted foes.',
    requires: ['laser_sweep', 'lightning_chain'],
  },
  {
    id: 'toxic_fallout',
    name: 'Toxic Fallout',
    icon: '💥',
    color: '#34d399',
    desc: 'Heavy mortar strikes create lingering radioactive acid pools.',
    requires: ['mortar_strike', 'poison'],
  },
  {
    id: 'electrified_mortar',
    name: 'Electrified Mortar',
    icon: '⚡',
    color: '#facc15',
    desc: 'Mortar impacts unleash expanding EMP shockwaves.',
    requires: ['mortar_strike', 'lightning_chain'],
  },
  {
    id: 'toxic_conduction',
    name: 'Toxic Conduction',
    icon: '☣️',
    color: '#14b8a6',
    desc: 'Chain lightning conducts lethal venom to secondary targets.',
    requires: ['lightning_chain', 'poison'],
  },
];

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
  const [activeTab, setActiveTab] = useState<'matrix' | 'synergies'>('matrix');

  if (!isOpen) return null;

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 2500);
  };

  const slotExpandCost = synergySlots === 1 ? 40 : synergySlots === 2 ? 80 : synergySlots === 3 ? 150 : 300;
  const canExpandSlots = cosmicShards >= slotExpandCost && synergySlots < 5;
  const equippedIds = new Set(activeRareDrops.map(d => d.id));

  // Compute Active & Partial combos
  const comboStatuses: SynergyCombo[] = ALL_SYNERGY_COMBOS.map(combo => {
    const has0 = equippedIds.has(combo.requires[0]);
    const has1 = equippedIds.has(combo.requires[1]);
    const isActive = has0 && has1;
    const isPartial = (has0 || has1) && !isActive;
    return {
      ...combo,
      isActive,
      isPartial,
    };
  });

  const activeComboCount = comboStatuses.filter(c => c.isActive).length;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md font-mono select-none">
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="bg-[#050811] border border-cyan-500/40 w-full max-w-3xl rounded-2xl shadow-[0_0_60px_rgba(6,182,212,0.18)] flex flex-col max-h-[90vh] overflow-hidden relative"
        >
          {/* Cyberpunk Grid Background Overlay */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1e2e_1px,transparent_1px),linear-gradient(to_bottom,#0e1e2e_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-25 pointer-events-none" />

          {/* 1. CYBERPUNK HEADER */}
          <header className="px-3.5 py-3 border-b border-cyan-500/20 bg-zinc-950/80 backdrop-blur-md flex items-center justify-between z-10 gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_12px_rgba(6,182,212,0.35)]">
                <Cpu className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-xs sm:text-sm font-black text-white tracking-widest uppercase">
                    TACTICAL MATRIX DECK
                  </h2>
                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold">
                    ONLINE
                  </span>
                </div>
                <p className="text-[9px] text-zinc-400 truncate">
                  Real-time Skill Protocols · Synergy Resonance Architecture
                </p>
              </div>
            </div>

            {/* Currency Chips Strip */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-300 text-[10px] font-bold">
                <span>✦</span>
                <span className="text-white font-black">{cosmicShards.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-950/60 border border-sky-500/40 text-sky-300 text-[10px] font-bold">
                <span>💎</span>
                <span className="text-white font-black">{gems.toLocaleString()}</span>
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-950/60 border border-teal-500/40 text-teal-300 text-[10px] font-bold">
                <span>🧪</span>
                <span className="text-white font-black">{cells.toLocaleString()}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playTabSwitch();
                  onClose();
                }}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer border border-white/10 ml-1"
                title="Close Matrix Deck"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* 2. SUB-BAR: MATRIX SLOTS STRIP & TAB TOGGLE */}
          <div className="px-3.5 py-2 bg-[#090d19]/90 border-b border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 z-10">
            {/* Visual Socket Slots Bar */}
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto no-scrollbar">
              <span className="text-[9.5px] font-bold text-zinc-400 uppercase tracking-wider shrink-0 mr-1">
                SLOTS ({activeRareDrops.length}/{synergySlots}):
              </span>
              
              {/* Equipped Sockets */}
              {activeRareDrops.map(drop => {
                const conf = RARITY_CONFIGS[drop.rarity as RarityTier] || RARITY_CONFIGS.common;
                return (
                  <div
                    key={drop.instanceId}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg border bg-zinc-950/80 shrink-0 transition-all group"
                    style={{ borderColor: `${conf.colorHex}60` }}
                    title={`${drop.name}: Active during real-time combat`}
                  >
                    <CardIcon icon={drop.icon} className="w-3.5 h-3.5" style={{ color: conf.colorHex }} />
                    <span className="text-[9px] font-bold text-white whitespace-nowrap">{drop.name}</span>
                    {onToggleEquip && (
                      <button
                        type="button"
                        onClick={() => onToggleEquip(drop.id as RareDropType)}
                        className="ml-0.5 text-zinc-500 hover:text-rose-400 cursor-pointer text-[10px] leading-none"
                        title="Unequip skill"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Empty Sockets */}
              {Array.from({ length: Math.max(0, synergySlots - activeRareDrops.length) }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="px-2 py-1 rounded-lg border border-dashed border-cyan-500/30 bg-cyan-950/20 text-cyan-400/60 text-[9px] font-bold shrink-0"
                >
                  EMPTY SOCKET
                </div>
              ))}

              {/* Expand Slot Button */}
              {synergySlots < 5 && onExpandSlots && (
                <button
                  type="button"
                  onClick={() => {
                    const ok = onExpandSlots();
                    if (ok) showFeedback('Tactical Matrix Socket Expanded!');
                  }}
                  disabled={!canExpandSlots}
                  className={`px-2 py-1 rounded-lg border text-[9px] font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                    canExpandSlots
                      ? 'bg-purple-950/80 border-purple-500/60 text-purple-200 hover:bg-purple-900 active:scale-95 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-60'
                  }`}
                  title="Expand Matrix Socket capacity (Max 5)"
                >
                  <Plus className="w-3 h-3" />
                  <span>+ SOCKET (✦ {slotExpandCost})</span>
                </button>
              )}
            </div>

            {/* Quick Mode Pill Toggles: Protocols vs Active Synergies */}
            <div className="flex items-center gap-1 bg-black/60 p-0.5 rounded-lg border border-white/10 shrink-0 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTabSwitch();
                  setActiveTab('matrix');
                }}
                className={`px-2.5 py-1 rounded-md text-[9.5px] font-bold uppercase transition-all cursor-pointer ${
                  activeTab === 'matrix'
                    ? 'bg-cyan-500 text-black font-black shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Protocols ({RARE_DROPS_DEFINITIONS.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playTabSwitch();
                  setActiveTab('synergies');
                }}
                className={`px-2.5 py-1 rounded-md text-[9.5px] font-bold uppercase transition-all cursor-pointer flex items-center gap-1 ${
                  activeTab === 'synergies'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-black shadow-xs'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Synergies</span>
                {activeComboCount > 0 && (
                  <span className="px-1 py-0.2 rounded-full bg-emerald-400 text-black text-[8px] font-black">
                    {activeComboCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Feedback Toast Banner */}
          {feedback && (
            <div className="px-3.5 py-1.5 bg-cyan-950/90 border-b border-cyan-500/60 text-cyan-300 font-bold text-xs text-center z-10 animate-pulse">
              ⚡ {feedback}
            </div>
          )}

          {/* 3. MAIN BODY */}
          <main className="flex-1 overflow-y-auto p-3 sm:p-4 z-10 custom-scrollbar">
            {activeTab === 'matrix' ? (
              /* COMPACT SKILL MATRIX CARDS GRID */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {RARE_DROPS_DEFINITIONS.map(def => {
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
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all relative overflow-hidden ${
                        isEquipped
                          ? 'bg-gradient-to-br from-cyan-950/40 via-zinc-950/90 to-zinc-950 border-cyan-500 shadow-[0_0_18px_rgba(6,182,212,0.22)]'
                          : isUnlocked
                          ? 'bg-zinc-950/85 border-white/10 hover:border-white/20'
                          : 'bg-black/60 border-white/5 opacity-70'
                      }`}
                    >
                      {/* Top Row: Icon + Protocol Name + Badges */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div 
                              className="w-8 h-8 rounded-lg border flex items-center justify-center shrink-0"
                              style={{ 
                                backgroundColor: `${highestRarity.colorHex}15`,
                                borderColor: `${highestRarity.colorHex}60`
                              }}
                            >
                              <CardIcon icon={def.icon} className="w-4 h-4" style={{ color: highestRarity.colorHex }} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="text-xs font-black text-white leading-tight uppercase tracking-wider truncate">
                                  {def.name}
                                </h3>
                                {isEquipped && (
                                  <span className="text-[7.5px] px-1 py-0.2 rounded bg-cyan-500/25 border border-cyan-400 text-cyan-300 font-black uppercase">
                                    ACTIVE
                                  </span>
                                )}
                              </div>
                              <span
                                className="text-[8.5px] font-bold uppercase tracking-wider block mt-0.5"
                                style={{ color: isUnlocked ? highestRarity.colorHex : '#71717a' }}
                              >
                                {isUnlocked ? `${highestRarity.name} · Lv. ${progress.level}` : 'LOCKED PROTOCOL'}
                              </span>
                            </div>
                          </div>

                          {/* Matrix Sync Status Badge */}
                          <div className="text-right shrink-0">
                            <span className="text-[9.5px] font-black text-white block">
                              {isUnlocked ? `Lv. ${progress.level}` : 'LOCK'}
                            </span>
                            <span className="text-[8.5px] text-zinc-400 font-bold">
                              {progress.level >= 15 ? 'MAXED' : `${progress.copies}/3 COPIES`}
                            </span>
                          </div>
                        </div>

                        {/* Description Box */}
                        <p className="text-[9px] text-zinc-300 leading-snug bg-black/50 p-2 rounded-lg border border-white/5 mb-2">
                          {def.description}
                        </p>

                        {/* Matrix Sync Progress Bar */}
                        {isUnlocked && (
                          <div className="mb-2.5">
                            <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden border border-white/5">
                              <div
                                className="h-full transition-all duration-300"
                                style={{
                                  backgroundColor: highestRarity.colorHex,
                                  width: `${progress.level >= 15 ? 100 : (progress.copies / 3) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-1.5 flex-wrap">
                        {isUnlocked ? (
                          <>
                            {/* Equip/Unequip Action */}
                            {onToggleEquip && (
                              <button
                                type="button"
                                onClick={() => {
                                  soundEngine.playTabSwitch();
                                  onToggleEquip(def.id as RareDropType);
                                }}
                                disabled={!isEquipped && slotsFull}
                                className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                                  isEquipped
                                    ? 'bg-cyan-500 text-black shadow-[0_0_10px_rgba(6,182,212,0.4)] active:scale-95'
                                    : slotsFull
                                    ? 'bg-zinc-900 border border-zinc-800 text-zinc-600 cursor-not-allowed'
                                    : 'bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 hover:bg-emerald-900 active:scale-95'
                                }`}
                              >
                                {isEquipped ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>EQUIPPED</span>
                                  </>
                                ) : (
                                  <span>{slotsFull ? 'FULL' : 'EQUIP'}</span>
                                )}
                              </button>
                            )}

                            {/* Upgrade Options */}
                            {onUpgrade && progress.level < 15 && (
                              <div className="flex items-center gap-1">
                                {canFreeUpgrade ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      soundEngine.playUpgradeSuccess();
                                      const ok = onUpgrade(def.id as RareDropType, 'copies');
                                      if (ok) showFeedback(`${def.name} Overclocked!`);
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-400 to-yellow-300 text-black text-[9px] font-black hover:brightness-110 active:scale-95 cursor-pointer shadow-md animate-pulse"
                                  >
                                    ⚡ OVERCLOCK (FREE)
                                  </button>
                                ) : (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        soundEngine.playUpgradeSuccess();
                                        const ok = onUpgrade(def.id as RareDropType, 'shards');
                                        if (ok) showFeedback(`${def.name} Upgraded!`);
                                      }}
                                      disabled={!canAffordShardUpgrade}
                                      className={`px-2 py-0.5 rounded-md border text-[8.5px] font-black transition-all cursor-pointer ${
                                        canAffordShardUpgrade
                                          ? 'bg-purple-950/90 border-purple-500/50 text-purple-200 hover:bg-purple-900 active:scale-95'
                                          : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                                      }`}
                                      title={`Upgrade with ${shardUpgradeCost} Cosmic Shards`}
                                    >
                                      ✦ {shardUpgradeCost}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => {
                                        soundEngine.playUpgradeSuccess();
                                        const ok = onUpgrade(def.id as RareDropType, 'gems');
                                        if (ok) showFeedback(`${def.name} Upgraded!`);
                                      }}
                                      disabled={!canAffordGemUpgrade}
                                      className={`px-2 py-0.5 rounded-md border text-[8.5px] font-black transition-all cursor-pointer ${
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
                          /* Locked State: Synthesis Options */
                          onSynthesize && (
                            <div className="w-full flex items-center justify-between gap-1.5 flex-wrap">
                              <span className="text-[8.5px] text-zinc-400 font-bold uppercase">
                                SYNTHESIZE:
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    soundEngine.playUpgradeSuccess();
                                    const ok = onSynthesize(def.id as RareDropType, 'shards');
                                    if (ok) showFeedback(`${def.name} Synthesized!`);
                                  }}
                                  disabled={cosmicShards < SHARD_SYNTH_COST}
                                  className={`px-2 py-0.5 rounded-md border text-[8.5px] font-black transition-all cursor-pointer ${
                                    cosmicShards >= SHARD_SYNTH_COST
                                      ? 'bg-purple-950 border-purple-500 text-purple-200 hover:bg-purple-900 active:scale-95'
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                                  }`}
                                  title="Synthesize using 40 Cosmic Shards"
                                >
                                  ✦ {SHARD_SYNTH_COST}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    soundEngine.playUpgradeSuccess();
                                    const ok = onSynthesize(def.id as RareDropType, 'gems');
                                    if (ok) showFeedback(`${def.name} Synthesized!`);
                                  }}
                                  disabled={gems < GEM_SYNTH_COST}
                                  className={`px-2 py-0.5 rounded-md border text-[8.5px] font-black transition-all cursor-pointer ${
                                    gems >= GEM_SYNTH_COST
                                      ? 'bg-sky-950 border-sky-500 text-sky-200 hover:bg-sky-900 active:scale-95'
                                      : 'bg-zinc-900 border-zinc-800 text-zinc-600 cursor-not-allowed opacity-50'
                                  }`}
                                  title="Synthesize using 12 Gems"
                                >
                                  💎 {GEM_SYNTH_COST}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    soundEngine.playUpgradeSuccess();
                                    const ok = onSynthesize(def.id as RareDropType, 'cells');
                                    if (ok) showFeedback(`${def.name} Synthesized!`);
                                  }}
                                  disabled={cells < CELL_SYNTH_COST}
                                  className={`px-2 py-0.5 rounded-md border text-[8.5px] font-black transition-all cursor-pointer ${
                                    cells >= CELL_SYNTH_COST
                                      ? 'bg-teal-950 border-teal-500 text-teal-200 hover:bg-teal-900 active:scale-95'
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
            ) : (
              /* SYNERGY COMBOS DECK VIEW */
              <div className="space-y-2.5">
                <div className="p-3 bg-zinc-950/90 border border-emerald-500/30 rounded-xl mb-3 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">
                      Resonance Synergy Combinations
                    </h3>
                    <p className="text-[9px] text-zinc-400 mt-0.5">
                      Equipping matching skill protocols triggers amplified dual-tactical effects simultaneously.
                    </p>
                  </div>
                  <div className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-black shrink-0">
                    {activeComboCount} Active
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {comboStatuses.map(combo => (
                    <div
                      key={combo.id}
                      className={`p-3 rounded-xl border flex flex-col justify-between transition-all ${
                        combo.isActive
                          ? 'bg-emerald-950/30 border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)]'
                          : combo.isPartial
                          ? 'bg-zinc-950/80 border-amber-500/40 opacity-90'
                          : 'bg-black/50 border-white/5 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-base">{combo.icon}</span>
                            <h4 className="text-xs font-black text-white uppercase tracking-wider">
                              {combo.name}
                            </h4>
                          </div>

                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border uppercase ${
                            combo.isActive
                              ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                              : combo.isPartial
                              ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                              : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                          }`}>
                            {combo.isActive ? 'ACTIVE RESONANCE' : combo.isPartial ? '1/2 EQUIPPED' : 'INACTIVE'}
                          </span>
                        </div>

                        <p className="text-[9px] text-zinc-300 bg-black/40 p-2 rounded-lg border border-white/5 mb-2 leading-relaxed">
                          {combo.desc}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 text-[8.5px] font-bold text-zinc-400">
                        <span>Requires:</span>
                        {combo.requires.map(reqId => {
                          const isReqEquipped = equippedIds.has(reqId);
                          const reqDef = RARE_DROPS_DEFINITIONS.find(d => d.id === reqId);
                          return (
                            <span
                              key={reqId}
                              className={`px-1.5 py-0.5 rounded border ${
                                isReqEquipped
                                  ? 'bg-emerald-950/80 border-emerald-500/60 text-emerald-300 font-black'
                                  : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                              }`}
                            >
                              {reqDef?.name || reqId}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>

          {/* 4. FOOTER */}
          <footer className="px-3.5 py-2.5 border-t border-cyan-500/20 bg-zinc-950/80 text-center z-10 flex items-center justify-between">
            <span className="text-[9px] text-zinc-400">
              💡 Skills drop from <strong>Boss Waves</strong> (every 10 waves) & can be upgraded in the Matrix Deck.
            </span>
            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                onClose();
              }}
              className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-bold cursor-pointer"
            >
              Close Deck
            </button>
          </footer>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
