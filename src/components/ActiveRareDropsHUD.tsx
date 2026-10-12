/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ActiveRareDrop, ActiveSynergyCard, RarityTier } from '../types';
import { RARITY_CONFIGS } from '../game/constants';
import { Cpu, Zap } from 'lucide-react';
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
    combos.push({ label: 'Toxic Detonation', icon: 'Biohazard', color: '#10b981', desc: 'Rockets detonate poison into massive green explosive clouds!' });
  }
  if (ids.has('rockets') && ids.has('lightning_chain')) {
    combos.push({ label: 'Shock Barrage', icon: 'Zap', color: '#38bdf8', desc: 'Rockets discharge high-voltage electric zaps on impact!' });
  }
  if (ids.has('laser_sweep') && ids.has('lightning_chain')) {
    combos.push({ label: 'Prismatic Zap', icon: 'Sparkles', color: '#06b6d4', desc: 'Laser sweep ignites electric arcs between intercepted shapes!' });
  }
  if (ids.has('mortar_strike') && ids.has('poison')) {
    combos.push({ label: 'Toxic Fallout', icon: 'Bomb', color: '#34d399', desc: 'Mortar strikes spawn persistent toxic acid fallout zones!' });
  }
  if (ids.has('mortar_strike') && ids.has('lightning_chain')) {
    combos.push({ label: 'Electrified Mortar', icon: 'CloudLightning', color: '#facc15', desc: 'Mortars trigger EMP shockwaves zapping surrounding foes!' });
  }
  if (ids.has('flow_of_calamity') && drops.length >= 2) {
    combos.push({ label: 'Calamity Overload', icon: 'Tornado', color: '#a855f7', desc: 'Flow of Calamity triggers cosmic overload explosions & zaps!' });
  }
  if (ids.has('lightning_chain') && ids.has('poison')) {
    combos.push({ label: 'Toxic Conduction', icon: 'CloudLightning', color: '#14b8a6', desc: 'Chain lightning transfers poison to all secondary targets!' });
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
    <div className={`flex flex-col items-center gap-1.5 bg-[#050811]/90 backdrop-blur-md px-1.5 py-2 rounded-l-2xl border-y border-l transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.8)] select-none ${
      isBossActive 
        ? 'border-purple-500/40 shadow-[0_4px_25px_rgba(168,85,247,0.25)]' 
        : 'border-cyan-500/35 hover:border-cyan-400/60 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
    }`}>
      {/* Matrix Deck Trigger Button */}
      <button
        type="button"
        onClick={onOpenCompendium}
        className="flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:brightness-125 transition-all text-cyan-400 font-mono text-[7.5px] font-black shrink-0 pb-1.5 border-b border-white/10 w-full active:scale-95"
        title="Open Tactical Matrix Deck"
      >
        <Cpu className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[7px] tracking-tight">{usedSlots}/{totalSlots}</span>
      </button>

      {/* Active Skill Icons & Synergies List */}
      <div className="flex flex-col items-center gap-1.5 overflow-y-auto w-full no-scrollbar max-h-[160px] sm:max-h-[260px]">
        {activeRareDrops.map((drop) => {
          const config = RARITY_CONFIGS[drop.rarity as RarityTier] || RARITY_CONFIGS.common;
          return (
            <div
              key={drop.instanceId}
              onClick={onOpenCompendium}
              className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 relative group overflow-hidden cursor-pointer hover:scale-105 transition-transform"
              style={{
                backgroundColor: `${config.colorHex}20`,
                borderColor: `${config.colorHex}70`,
                color: config.colorHex,
                boxShadow: `0 0 10px ${config.colorHex}30`
              }}
              title={`${drop.name}: ${drop.description} (Tap to manage in Matrix Deck)`}
            >
              <CardIcon icon={drop.icon} className="w-4 h-4 shrink-0" />
            </div>
          );
        })}

        {/* Active Synergy Combos */}
        {activeCombos.map((combo, idx) => (
          <div
            key={idx}
            onClick={onOpenCompendium}
            className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 animate-pulse overflow-hidden cursor-pointer hover:scale-105 transition-transform"
            style={{
              backgroundColor: `${combo.color}25`,
              borderColor: `${combo.color}90`,
              color: combo.color,
              boxShadow: `0 0 12px ${combo.color}45`
            }}
            title={`SYNERGY ACTIVE: ${combo.label} — ${combo.desc}`}
          >
            <CardIcon icon={combo.icon} className="w-3.5 h-3.5 shrink-0" />
          </div>
        ))}

        {/* Empty Sockets */}
        {Array.from({ length: Math.max(0, totalSlots - usedSlots) }).map((_, idx) => (
          <div
            key={idx}
            onClick={onOpenCompendium}
            className="w-7 h-7 rounded-xl border border-dashed border-cyan-500/25 bg-cyan-950/10 flex items-center justify-center text-[10px] text-cyan-500/40 font-mono shrink-0 cursor-pointer hover:border-cyan-400 hover:text-cyan-300 transition-colors"
            title="Empty Matrix Socket · Tap to Equip Skill"
          >
            +
          </div>
        ))}
      </div>
    </div>
  );
};
