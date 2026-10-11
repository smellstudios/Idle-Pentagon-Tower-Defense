/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveRareDrop, ActiveSynergyCard, RarityTier } from '../types';
import { RARITY_CONFIGS } from '../game/constants';
import { Sparkles, Zap } from 'lucide-react';
import { CardIcon } from './Icons';

interface Props {
  activeRareDrops: ActiveRareDrop[];
  activeSynergyCards: ActiveSynergyCard[];
  synergySlots: number;
  onOpenCompendium: () => void;
  isBossActive?: boolean;
}

const getActiveCombos = (drops: ActiveRareDrop[]) => {
  const ids = new Set(drops.map(d => d.id));
  const combos: Array<{ label: string; icon: string; color: string; desc: string }> = [];

  if (ids.has('rockets') && ids.has('poison')) {
    combos.push({ label: 'Toxic Detonation', icon: '☣️', color: '#10b981', desc: 'Rockets detonate poison into large green explosive clouds!' });
  }
  if (ids.has('rockets') && ids.has('lightning_chain')) {
    combos.push({ label: 'Shock Barrage', icon: '⚡', color: '#38bdf8', desc: 'Rockets discharge high-voltage electric zaps on impact!' });
  }
  if (ids.has('laser_sweep') && ids.has('lightning_chain')) {
    combos.push({ label: 'Prismatic Zap', icon: '💫', color: '#00f5ff', desc: 'Laser sweep ignites electric arcs between intercepted shapes!' });
  }
  if (ids.has('mortar_strike') && ids.has('poison')) {
    combos.push({ label: 'Toxic Fallout', icon: '💥', color: '#10b981', desc: 'Mortar strikes spawn persistent toxic acid fallout zones!' });
  }
  if (ids.has('mortar_strike') && ids.has('lightning_chain')) {
    combos.push({ label: 'Electrified Mortar', icon: '⚡', color: '#facc15', desc: 'Mortars trigger EMP shockwaves zapping surrounding foes!' });
  }
  if (ids.has('flow_of_calamity') && drops.length >= 2) {
    combos.push({ label: 'Calamity Overload', icon: '🌀', color: '#a855f7', desc: 'Flow of Calamity triggers cosmic overload explosions & zaps!' });
  }
  if (ids.has('lightning_chain') && ids.has('poison')) {
    combos.push({ label: 'Toxic Conduction', icon: '☣️', color: '#34d399', desc: 'Chain lightning transfers poison to all secondary targets!' });
  }

  return combos;
};

export const ActiveRareDropsHUD: React.FC<Props> = ({
  activeRareDrops,
  activeSynergyCards,
  synergySlots,
  onOpenCompendium,
  isBossActive = false,
}) => {
  const totalSlots = synergySlots;
  const usedSlots = activeRareDrops.length;
  const activeCombos = getActiveCombos(activeRareDrops);

  return (
    <div className={`flex flex-col items-center gap-1.5 bg-zinc-950/85 backdrop-blur-md px-1 py-2 rounded-l-xl border-y border-l transition-all duration-300 shadow-lg w-9 ${
      isBossActive 
        ? 'border-purple-500/30 shadow-[0_4px_20px_rgba(168,85,247,0.15)] bg-zinc-950/90' 
        : 'border-white/10'
    }`}>
      <button
        onClick={onOpenCompendium}
        className="flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:opacity-80 transition-all text-amber-400 font-mono text-[7px] font-black shrink-0 pb-1 border-b border-white/10 w-full"
        title="View Rare Drop Compendium"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span>{usedSlots}/{totalSlots}</span>
      </button>

      <div className="flex flex-col items-center gap-1 overflow-y-auto w-full no-scrollbar max-h-[150px] sm:max-h-[250px]">
        {activeRareDrops.map((drop) => {
          const config = RARITY_CONFIGS[drop.rarity as RarityTier] || RARITY_CONFIGS.common;
          return (
            <div
              key={drop.instanceId}
              className="w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 relative group overflow-hidden"
              style={{
                backgroundColor: `${config.colorHex}15`,
                borderColor: `${config.colorHex}50`,
                color: config.colorHex,
              }}
              title={`${drop.name} (${drop.effectMultiplier.toFixed(1)}x): ${drop.description}`}
            >
              <CardIcon icon={drop.icon} className="w-4 h-4 shrink-0" />
            </div>
          );
        })}

        {activeCombos.map((combo, idx) => (
          <div
            key={idx}
            className="w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 animate-pulse overflow-hidden"
            style={{
              backgroundColor: `${combo.color}20`,
              borderColor: `${combo.color}80`,
              color: combo.color,
            }}
            title={`SYNERGY COMBO: ${combo.label} — ${combo.desc}`}
          >
            <span className="text-[12px] leading-none inline-flex items-center justify-center w-full h-full">{combo.icon}</span>
          </div>
        ))}

        {Array.from({ length: Math.max(0, totalSlots - usedSlots) }).map((_, idx) => (
          <div
            key={idx}
            className="w-6 h-6 rounded-lg border border-dashed border-white/20 bg-white/5 flex items-center justify-center text-[10px] text-zinc-600 font-mono shrink-0"
            title="Empty Rare Drop Slot"
          >
            +
          </div>
        ))}
      </div>
    </div>
  );
};
