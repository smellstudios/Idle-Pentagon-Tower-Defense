/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ActiveRareDrop, ActiveSynergyCard, RarityTier } from '../types';
import { RARITY_CONFIGS } from '../game/constants';
import { Sparkles, Zap, Shield, Layers, Check } from 'lucide-react';
import { CardIcon } from './Icons';

interface Props {
  item: ActiveRareDrop | ActiveSynergyCard | null;
  type: 'drop' | 'synergy';
  activeSlots: number;
  currentActiveCount: number;
  onEquip: (item: ActiveRareDrop | ActiveSynergyCard) => void;
  onDismiss: () => void;
}

export const RareDropNotificationModal: React.FC<Props> = ({
  item,
  type,
  activeSlots,
  currentActiveCount,
  onEquip,
  onDismiss,
}) => {
  if (!item) return null;

  const rarityConfig = RARITY_CONFIGS[item.rarity as RarityTier] || RARITY_CONFIGS.common;
  const isSynergy = type === 'synergy';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="relative w-full max-w-sm rounded-2xl p-6 border shadow-2xl flex flex-col items-center text-center overflow-hidden"
          style={{
            backgroundColor: '#09090b',
            borderColor: rarityConfig.colorHex,
            boxShadow: `0 0 40px ${rarityConfig.colorHex}40`,
          }}
        >
          {/* Background Ambient Glow */}
          <div
            className="absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundColor: rarityConfig.colorHex }}
          />
          <div
            className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-30 pointer-events-none"
            style={{ backgroundColor: rarityConfig.colorHex }}
          />

          {/* Rarity Header Badge */}
          <div
            className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-widest mb-4 flex items-center gap-1.5 shadow-md"
            style={{
              backgroundColor: `${rarityConfig.colorHex}20`,
              color: rarityConfig.colorHex,
              border: `1px solid ${rarityConfig.colorHex}60`,
            }}
          >
            <Sparkles className="w-3 h-3" />
            <span>{rarityConfig.name} {isSynergy ? 'Synergy Card' : 'Rare Drop'}</span>
          </div>

          {/* Icon Badge */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-4 border shadow-inner"
            style={{
              backgroundColor: `${rarityConfig.colorHex}15`,
              borderColor: `${rarityConfig.colorHex}50`,
            }}
          >
            <CardIcon icon={'icon' in item ? item.icon : '🔮'} className="w-10 h-10" />
          </motion.div>

          {/* Title & Description */}
          <h2 className="text-xl font-mono font-black text-white tracking-wide mb-1">
            {item.name}
          </h2>
          
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-xs font-mono font-bold"
              style={{ color: rarityConfig.colorHex }}
            >
              Multiplier: {item.effectMultiplier.toFixed(1)}x
            </span>
            <span className="text-zinc-600 font-mono text-xs">•</span>
            <span className="text-xs font-mono text-zinc-400">
              Slots: {currentActiveCount}/{activeSlots}
            </span>
          </div>

          <p className="text-xs font-mono text-zinc-300 leading-relaxed mb-6 px-2 bg-zinc-900/60 p-3 rounded-xl border border-white/5">
            {item.description}
          </p>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 w-full">
            <button
              onClick={onDismiss}
              className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              Decline
            </button>
            <button
              onClick={() => onEquip(item)}
              className="flex-1 py-3 rounded-xl font-mono text-xs font-black text-black tracking-wider uppercase flex items-center justify-center gap-1.5 transition-all shadow-lg cursor-pointer active:scale-95"
              style={{
                backgroundColor: rarityConfig.colorHex,
                boxShadow: `0 0 15px ${rarityConfig.colorHex}60`,
              }}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Equip Slot</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
