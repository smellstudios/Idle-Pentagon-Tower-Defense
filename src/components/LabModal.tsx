/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FlaskConical, X, Lock } from 'lucide-react';
import { GameState } from '../types';
import { LabPanel } from './LabPanel';
import { soundEngine } from '../game/sound';

interface Props {
  isOpen: boolean;
  gameState: GameState;
  onClose: () => void;
  onStartLabResearch: (slotIndex: number, researchId: string) => void;
  onRushLabResearch: (slotIndex: number) => void;
  onCollectLab: (slotIndex: number) => void;
  onBuyLabAttribute: (researchId: string, currency: 'shards' | 'gems' | 'cells') => boolean;
  onConvertCurrencyToCells: (fromCurrency: 'shards' | 'gems', amount: number) => boolean;
  onUnlockLabSlot: () => boolean;
  onOpenSkillTree?: () => void;
}

export const LabModal: React.FC<Props> = ({
  isOpen,
  gameState,
  onClose,
  onStartLabResearch,
  onRushLabResearch,
  onCollectLab,
  onBuyLabAttribute,
  onConvertCurrencyToCells,
  onUnlockLabSlot,
  onOpenSkillTree,
}) => {
  if (!isOpen) return null;

  const isLabUnlocked = Boolean(gameState.unlockedSystems?.labs) || (gameState.highestWaveEver || 0) >= 30;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 12 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="bg-zinc-950 border border-teal-500/40 w-full max-w-5xl rounded-3xl shadow-[0_0_60px_rgba(20,184,166,0.2)] flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 sm:px-6 py-3.5 border-b border-white/10 flex items-center justify-between bg-zinc-900/80 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-teal-950/80 border border-teal-500/50 text-teal-300 shadow-[0_0_15px_rgba(20,184,166,0.25)]">
                {isLabUnlocked ? (
                  <FlaskConical className="w-5 h-5 animate-pulse" />
                ) : (
                  <span className="font-mono text-base font-black text-teal-300">?</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-mono font-black text-white tracking-wider uppercase">
                    {isLabUnlocked ? 'RESEARCH SYNTHESIS LABORATORY' : '?'}
                  </h2>
                  <span className="hidden sm:inline-block text-[9px] font-mono px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40 font-bold">
                    {isLabUnlocked ? 'CYBERNETIC MATRIX' : 'LOCKED'}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 font-mono">
                  {isLabUnlocked
                    ? 'Synthesize persistent base buffs & unlock active tactical skill matrices'
                    : 'Unlocked at wave 30'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenSkillTree && (
                <button
                  onClick={() => {
                    soundEngine.playTabSwitch();
                    onClose();
                    onOpenSkillTree();
                  }}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-purple-950/70 border border-purple-500/50 text-purple-300 font-mono text-xs font-bold hover:bg-purple-900 transition-all cursor-pointer shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                >
                  <span>⚡ SKILL TREE</span>
                </button>
              )}

              <button
                onClick={() => {
                  soundEngine.playTabSwitch();
                  onClose();
                }}
                className="p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all cursor-pointer select-none active:scale-95"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-3.5 sm:p-5 overflow-y-auto custom-scrollbar flex-1 bg-zinc-950">
            {!isLabUnlocked ? (
              <div className="py-12 px-4 max-w-lg mx-auto flex flex-col items-center justify-center text-center space-y-6">
                <div className="relative flex items-center justify-center w-24 h-24 rounded-3xl bg-zinc-900/90 border-2 border-dashed border-teal-500/40 shadow-[0_0_30px_rgba(20,184,166,0.2)]">
                  <span className="font-mono text-5xl font-black text-teal-400 drop-shadow-[0_0_15px_rgba(20,184,166,0.8)]">
                    ?
                  </span>
                  <div className="absolute -bottom-2 -right-2 p-2 rounded-xl bg-teal-950 border border-teal-500 text-teal-300">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-2xl font-mono font-black text-white tracking-wider">
                    ?
                  </h3>
                  <p className="text-base font-mono font-bold text-teal-300 tracking-wide">
                    Unlocked at wave 30
                  </p>
                  <p className="text-xs font-mono text-zinc-400 max-w-xs leading-relaxed">
                    Survive and conquer Sector Wave 30 to discover the Cybernetic Research Laboratory and research persistent overclock matrices.
                  </p>
                </div>

                {/* Wave Progress Bar */}
                <div className="w-full max-w-xs space-y-2 bg-zinc-900/80 p-4 rounded-2xl border border-teal-900/40 shadow-inner">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-zinc-400">Sector Progress</span>
                    <span className="font-bold text-teal-300">
                      Wave {gameState.highestWaveEver || 1} / 30
                    </span>
                  </div>
                  <div className="w-full bg-zinc-950 rounded-full h-3 border border-zinc-800 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-teal-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, Math.round(((gameState.highestWaveEver || 1) / 30) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <LabPanel
                gameState={gameState}
                onStartLabResearch={onStartLabResearch}
                onRushLabResearch={onRushLabResearch}
                onCollectLab={onCollectLab}
                onBuyLabAttribute={onBuyLabAttribute}
                onConvertCurrencyToCells={onConvertCurrencyToCells}
                onUnlockLabSlot={onUnlockLabSlot}
              />
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
