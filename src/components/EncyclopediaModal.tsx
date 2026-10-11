/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  BookOpen, 
  Shield, 
  Zap, 
  Sparkles, 
  Target, 
  Activity, 
  HelpCircle, 
  Flame, 
  Sliders, 
  Sword, 
  Coins, 
  RefreshCw 
} from 'lucide-react';
import { soundEngine } from '../game/sound';
import { GameState, Upgrade } from '../types';
import { formatCurrency } from '../utils/format';
import { getEnemyWaveStats, getTierDifficultyMultiplier, calculatePlayerCombatStats } from '../game/constants';
import { EnemyIcon } from './Icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState?: GameState;
  upgrades?: Upgrade[];
}

export const EncyclopediaModal: React.FC<Props> = ({ isOpen, onClose, gameState, upgrades }) => {
  const [activeTab, setActiveTab] = useState<'mechanics' | 'turtle' | 'currencies' | 'enemies'>('enemies');

  const activeWave = gameState?.wave || 1;
  const activeTier = gameState?.tier || 1;

  if (!isOpen) return null;

  // Calculation of scaled cash drop range based on chosen wave/tier and active player upgrades/cards
  const getSimulatedCashRange = (type: string, wave: number, tier: number) => {
    const tierRanges: Record<string, { min: number; max: number }> = {
      red_square: { min: 4, max: 12 },
      orange_triangle: { min: 16, max: 38 },
      purple_pentagon: { min: 40, max: 110 },
      emerald_diamond: { min: 35, max: 95 },
      gold_hexagon: { min: 80, max: 240 },
      circle: { min: 30, max: 80 },
      big_square: { min: 65, max: 220 },
      crimson_octagon: { min: 120, max: 350 },
      enraged_trapezium: { min: 50, max: 140 },
      disruptor_emp: { min: 90, max: 260 },
      reflector_prism: { min: 110, max: 300 },
      splitter_cluster: { min: 130, max: 360 },
      phase_shifter: { min: 140, max: 380 },
      boss: { min: 800, max: 4000 },
    };
    const range = tierRanges[type] || tierRanges.red_square;

    const levelMultiplier = 1 + wave * 0.02;
    const difficultyMultiplier = getTierDifficultyMultiplier(tier);

    // Pull modifiers from live upgrades if available
    const cashBonusUpgObj = upgrades?.find(u => u.id === 'cash_bonus');
    const cashBonusLevel = cashBonusUpgObj?.level || 0;
    const cashBonusMultiplier = 1 + cashBonusLevel * 0.05;

    const permCashMultLevel = gameState?.workshopUpgrades?.['perm_cash_mult'] || 0;
    const permCashMultiplier = 1 + permCashMultLevel * 0.10;

    const hasBalanceCard = gameState?.equippedCardIds?.includes('enemy_balance') || false;
    const cardCashMultiplier = hasBalanceCard ? 1.8 : 1.0;

    const combinedMultiplier = levelMultiplier * difficultyMultiplier * cashBonusMultiplier * permCashMultiplier * cardCashMultiplier;

    return {
      min: Math.max(1, Math.round(range.min * combinedMultiplier)),
      max: Math.max(1, Math.round(range.max * combinedMultiplier)),
      multiplier: combinedMultiplier
    };
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 bg-black/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-zinc-950 border border-purple-500/40 w-full max-w-4xl rounded-xl shadow-[0_0_35px_rgba(168,85,247,0.35)] flex flex-col max-h-[92vh] overflow-hidden"
        >
          {/* Header (Slimmer & Compacted) */}
          <div className="px-4 py-2.5 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60 shrink-0">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" />
              <div className="flex items-baseline gap-2">
                <h2 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                  Tactical Almanac & Telemetry
                </h2>
                <span className="text-[9px] text-zinc-500 font-mono hidden sm:inline">
                  | Zero-Scroll High-Density Grid Mode
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                onClose();
              }}
              className="p-1 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Navigation Bar (Thinner & Short-Title format to prevent wrapping cutoffs) */}
          <div className="flex border-b border-zinc-800 bg-zinc-900/30 p-1 gap-1 text-[10px] font-mono font-black shrink-0">
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('enemies');
              }}
              className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                activeTab === 'enemies' ? 'bg-rose-950/80 border border-rose-500/50 text-rose-200' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              👾 Threats
            </button>
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('mechanics');
              }}
              className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                activeTab === 'mechanics' ? 'bg-purple-950/80 border border-purple-500/50 text-purple-200' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              📐 Formulas
            </button>
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('turtle');
              }}
              className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                activeTab === 'turtle' ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🐢 Turtle
            </button>
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('currencies');
              }}
              className={`flex-1 py-1 rounded-md text-center transition-all cursor-pointer ${
                activeTab === 'currencies' ? 'bg-sky-950/80 border border-sky-500/50 text-sky-200' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🪙 Coins
            </button>
          </div>

          {/* High Density Table Body Content */}
          <div className="p-3 overflow-y-auto font-mono text-[10px] text-zinc-300 flex-1">
            {activeTab === 'enemies' && (
              <div className="space-y-2">
                {/* Threat Dossier Grid Table with overflow-x-auto protection and explicit column constraints */}
                <div className="overflow-x-auto border border-zinc-800 rounded-lg">
                  <table className="w-full text-left border-collapse table-auto">
                    <thead>
                      <tr className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold text-[9px] uppercase tracking-wider">
                        <th className="p-2 border-r border-zinc-800 whitespace-nowrap min-w-[110px]">Target Threat</th>
                        <th className="p-2 border-r border-zinc-800 text-center whitespace-nowrap min-w-[80px]">Wave Spawns</th>
                        <th className="p-2 border-r border-zinc-800 text-right whitespace-nowrap min-w-[75px]">Scaled HP</th>
                        <th className="p-2 border-r border-zinc-800 text-right whitespace-nowrap min-w-[75px]">Contact DPS</th>
                        <th className="p-2 border-r border-zinc-800 text-right whitespace-nowrap min-w-[90px]">Cash Drops</th>
                        <th className="p-2 whitespace-normal min-w-[180px]">Tactical Counter / Weakness</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/80 bg-black/40">
                      {[
                        {
                          id: 'red_square',
                          name: 'Red Square',
                          role: 'Standard Vanguard',
                          speedStr: '1.0 Spd',
                          desc: 'Frontline geom scout.',
                          counter: 'Weak to Multishot, Pierce, and Bounce Shot crowd control.',
                          icon: <EnemyIcon type="red_square" />
                        },
                        {
                          id: 'orange_triangle',
                          name: 'Orange Triangle',
                          role: 'Fast Striker',
                          speedStr: '1.8 Spd',
                          desc: 'High velocity light rusher.',
                          counter: 'Requires Octo-Strike, high base Fire Rate, or quick Orbs to shut down.',
                          icon: <EnemyIcon type="orange_triangle" />
                        },
                        {
                          id: 'emerald_diamond',
                          name: 'Emerald Diamond',
                          role: 'Zig-Zag Infiltrator',
                          speedStr: '2.2 Spd',
                          desc: 'Hyper-agile skirmisher that weaves side-to-side to evade incoming projectiles.',
                          counter: 'Use AOE Mortars, Bouncing Lightning, or Rapid Multishots to catch its rapid dynamic vector.',
                          icon: <EnemyIcon type="emerald_diamond" />
                        },
                        {
                          id: 'purple_pentagon',
                          name: 'Shadow Pentagon',
                          role: 'Void Weaver',
                          speedStr: '1.0 Spd',
                          desc: 'Teleports forward via void phase bursts every few seconds.',
                          counter: 'Watch for its 🌀 BLINK teleports; keep continuous perimeter fire or Orbiting Orbs active.',
                          icon: <EnemyIcon type="purple_pentagon" />
                        },
                        {
                          id: 'gold_hexagon',
                          name: 'Gold Hexagon',
                          role: 'Bastion Commander',
                          speedStr: '0.7 Spd',
                          desc: 'Projects a Bastion Shield aura that reduces all incoming damage to surrounding shape allies by 25%.',
                          counter: 'Focus down the Bastion Hexagon first with single-target Crit damage to remove its protection aura.',
                          icon: <EnemyIcon type="gold_hexagon" />
                        },
                        {
                          id: 'circle',
                          name: 'Teal Circle',
                          role: 'Orbiting Sniper',
                          speedStr: '1.1 Spd',
                          desc: 'Infiltrates and orbits your firing perimeter, shooting rapid energy pulses.',
                          counter: 'Extremely dangerous. Upgrading Tower Range pushes their orbit outward, buying reaction time.',
                          icon: <EnemyIcon type="circle" />
                        },
                        {
                          id: 'big_square',
                          name: 'Big Square',
                          role: 'Armored Siege',
                          speedStr: '0.6 Spd',
                          desc: 'Colossal health fortress siege.',
                          counter: 'Thorns reflection % deals massive reciprocal damage. Weak to Knockback.',
                          icon: <EnemyIcon type="big_square" />
                        },
                        {
                          id: 'enraged_trapezium',
                          name: 'Enraged Trapezium',
                          role: 'Berserker',
                          speedStr: '0.85 -> 1.45 Spd',
                          desc: 'Carries a balloon aloft. Popping it triggers ferocious enraged frenzy, +45% speed and +50% contact DPS.',
                          counter: 'Eliminate from extreme range or burst down before its high-speed charge reaches the fortress.',
                          icon: <EnemyIcon type="enraged_trapezium" />
                        },
                        {
                          id: 'disruptor_emp',
                          name: 'Disruptor (EMP)',
                          role: 'Field Suppressor',
                          speedStr: '0.9 Spd',
                          desc: 'Projects an EMP dampening aura slowing player projectiles by 30%. Discharges an ion pulse on death slowing nearby enemies.',
                          counter: 'High priority target. Eliminate first to restore full projectile speed across the horde.',
                          icon: <EnemyIcon type="disruptor_emp" />
                        },
                        {
                          id: 'reflector_prism',
                          name: 'Reflector Prism',
                          role: 'Facet Mirror',
                          speedStr: '0.8 Spd',
                          desc: 'Crystalline diamond prism with faceted mirror plates. 35% chance to deflect incoming kinetic bullets.',
                          counter: 'Overcome with rapid fire rate, AOE explosions, Singularity vortex, or elemental ailments.',
                          icon: <EnemyIcon type="reflector_prism" />
                        },
                        {
                          id: 'splitter_cluster',
                          name: 'Splitter Cluster',
                          role: 'Mitosis Matrix',
                          speedStr: '0.75 Spd',
                          desc: 'Segmented matrix shape that splits into 2-3 fast Mini Shards upon destruction.',
                          counter: 'Keep Octo-Strike, Ricochet, or Bouncing Lightning active to clean up the fractured shards.',
                          icon: <EnemyIcon type="splitter_cluster" />
                        },
                        {
                          id: 'phase_shifter',
                          name: 'Phase Shifter',
                          role: 'Quantum Skirmisher',
                          speedStr: '0.95 Spd',
                          desc: 'Periodically shifts into quantum intangibility, causing player bullets to pass through harmlessly.',
                          counter: 'Time burst damage when it materializes back into physical spacetime.',
                          icon: <EnemyIcon type="phase_shifter" />
                        },
                        {
                          id: 'crimson_octagon',
                          name: 'Crimson Octagon',
                          role: 'Dread Juggernaut',
                          speedStr: '0.5 Spd',
                          desc: 'Heavy armored monolith with massive HP pool. Splits into two fast Orange Triangles upon destruction.',
                          counter: 'Prepare for the 💥 SPLIT burst when defeated; keep multi-target AOE ready.',
                          icon: <EnemyIcon type="crimson_octagon" />
                        },
                        {
                          id: 'boss',
                          name: 'Wave Boss',
                          role: 'Supreme Overlord',
                          speedStr: '0.4 Spd',
                          desc: 'Appears every 5 waves. Equipped with SUPER ARMOR (100% Knockback Immune!).',
                          counter: 'Immune to all knockback and push forces. Focus single target DPS + Crit + Boss Damage mults.',
                          icon: <EnemyIcon type="boss" />
                        }
                      ].map(enemy => {
                        const playerCombatStats = calculatePlayerCombatStats(upgrades || [], gameState || ({} as any));
                        const playerSummary = {
                          effectivePlayerDps: playerCombatStats.dps,
                          effectiveMaxHp: playerCombatStats.effectiveMaxHp,
                          defenseAbsolute: playerCombatStats.defenseAbsolute,
                        };
                        const { hp, dps } = getEnemyWaveStats(enemy.id, activeWave, activeTier, playerSummary);
                        const cashInfo = getSimulatedCashRange(enemy.id, activeWave, activeTier);

                        // Calculate spawn text
                        let spawnStr = '0%';
                        const isBossWave = activeWave % 10 === 0;
                        if (enemy.id === 'boss') {
                          spawnStr = isBossWave ? 'GUARANTEED (100%)' : '0%';
                        } else {
                          const tankWeight = activeWave >= 10 ? 10 + Math.floor(activeWave / 6) : 0;
                          const triangleWeight = activeWave >= 5 ? 20 + Math.floor(activeWave / 10) : 0;
                          const circleWeight = activeWave >= 8 ? 15 + Math.floor(activeWave / 8) : 0;
                          
                          if (isBossWave) {
                            const sumWeights = tankWeight + triangleWeight + circleWeight + 70;
                            const cPct = activeWave >= 8 ? Math.round((circleWeight / sumWeights) * 100) : 0;
                            const tPct = activeWave >= 10 ? Math.round((tankWeight / sumWeights) * 100) : 0;
                            const trPct = activeWave >= 5 ? Math.round((triangleWeight / sumWeights) * 100) : 0;
                            const sPct = 100 - cPct - tPct - trPct;

                            if (enemy.id === 'circle') spawnStr = activeWave >= 8 ? `${cPct}% (Minion)` : '0%';
                            else if (enemy.id === 'big_square') spawnStr = activeWave >= 10 ? `${tPct}% (Minion)` : '0%';
                            else if (enemy.id === 'orange_triangle') spawnStr = activeWave >= 5 ? `${trPct}% (Minion)` : '0%';
                            else spawnStr = `${sPct}% (Minion)`;
                          } else {
                            if (activeWave < 3) {
                              if (enemy.id === 'red_square') spawnStr = '100%';
                              else spawnStr = '0%';
                            } else if (activeWave < 5) {
                              if (enemy.id === 'red_square') spawnStr = '100%';
                              else spawnStr = '0%';
                            } else {
                              const sumWeights = tankWeight + triangleWeight + circleWeight + 70;
                              const cPct = activeWave >= 8 ? Math.round((circleWeight / sumWeights) * 100) : 0;
                              const tPct = activeWave >= 10 ? Math.round((tankWeight / sumWeights) * 100) : 0;
                              const trPct = activeWave >= 5 ? Math.round((triangleWeight / sumWeights) * 100) : 0;
                              const sPct = 100 - cPct - tPct - trPct;

                              if (enemy.id === 'circle') spawnStr = activeWave >= 8 ? `${cPct}%` : '0%';
                              else if (enemy.id === 'big_square') spawnStr = activeWave >= 10 ? `${tPct}%` : '0%';
                              else if (enemy.id === 'orange_triangle') spawnStr = activeWave >= 5 ? `${trPct}%` : '0%';
                              else spawnStr = `${sPct}%`;
                            }
                          }
                        }

                        const isBoss = enemy.id === 'boss';

                        return (
                          <tr 
                            key={enemy.id} 
                            className={`hover:bg-zinc-900/40 transition-colors ${
                              isBoss ? 'bg-purple-950/10 text-purple-200' : ''
                            }`}
                          >
                            {/* Threat name/visual */}
                            <td className="p-2 border-r border-zinc-800/60 font-bold flex items-center gap-2 whitespace-nowrap min-w-[110px]">
                              {enemy.icon}
                              <div className="flex flex-col">
                                <span className="text-white font-bold">{enemy.name}</span>
                                <span className="text-[8px] text-zinc-500 font-medium">{enemy.speedStr}</span>
                              </div>
                            </td>

                            {/* Wave Spawns */}
                            <td className="p-2 border-r border-zinc-800/60 text-center font-bold text-[9.5px] whitespace-nowrap min-w-[80px]">
                              <span className={isBoss ? (isBossWave ? 'text-purple-400 font-extrabold animate-pulse' : 'text-zinc-600') : 'text-zinc-300'}>
                                {spawnStr}
                              </span>
                            </td>

                            {/* Scaled HP */}
                            <td className="p-2 border-r border-zinc-800/60 text-right font-bold text-rose-300 whitespace-nowrap min-w-[75px]">
                              {formatCurrency(hp)}
                            </td>

                            {/* Contact DPS */}
                            <td className="p-2 border-r border-zinc-800/60 text-right font-bold text-orange-300 whitespace-nowrap min-w-[75px]">
                              {formatCurrency(dps)}
                            </td>

                            {/* Cash Drops */}
                            <td className="p-2 border-r border-zinc-800/60 text-right font-bold text-emerald-300 whitespace-nowrap min-w-[90px]">
                              ${formatCurrency(cashInfo.min)}-${formatCurrency(cashInfo.max)}
                            </td>

                            {/* Tactical Counter */}
                            <td className="p-2 text-[9.5px] text-zinc-400 leading-tight whitespace-normal min-w-[180px]">
                              <span className={isBoss ? 'text-purple-300/90' : 'text-zinc-400'}>
                                {enemy.counter}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'mechanics' && (
              <div className="overflow-x-auto border border-zinc-800 rounded-lg">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-purple-400 font-bold text-[9px] uppercase tracking-wider">
                      <th className="p-2 border-r border-zinc-800 whitespace-nowrap min-w-[120px]">Combat System / Metric</th>
                      <th className="p-2 border-r border-zinc-800 whitespace-nowrap min-w-[180px]">Live Mathematical Formula</th>
                      <th className="p-2 whitespace-normal min-w-[200px]">Tactical Summary & Guidelines</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 bg-black/40">
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white flex items-center gap-1.5 whitespace-nowrap min-w-[120px]">
                        <Shield className="w-3 h-3 text-sky-400" /> Defense Mitigation
                      </td>
                      <td className="p-2 border-r border-zinc-800/60 text-emerald-300 whitespace-nowrap min-w-[180px]">
                        Net Dmg = Max(0, (DPS × (1 - Def %)) - Def Absolute)
                      </td>
                      <td className="p-2 text-zinc-400 whitespace-normal min-w-[200px]">
                        Def % reduces raw contact damage proportionally, then Defense Absolute subtracts flat damage. If Absolute exceeds enemy attack, you receive 0 damage!
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white flex items-center gap-1.5 whitespace-nowrap min-w-[120px]">
                        <Flame className="w-3 h-3 text-amber-500" /> Thorn Damage
                      </td>
                      <td className="p-2 border-r border-zinc-800/60 text-amber-300 whitespace-nowrap min-w-[180px]">
                        Damage Reflected = Enemy Max HP × Thorn %
                      </td>
                      <td className="p-2 text-zinc-400 whitespace-normal min-w-[200px]">
                        Reflects raw contact damage based on enemy's max HP pool. Highly effective at instantly vaporizing high-HP non-boss shapes.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white flex items-center gap-1.5 whitespace-nowrap min-w-[120px]">
                        <Flame className="w-3 h-3 text-rose-500" /> Thorns Breakpoints
                      </td>
                      <td className="p-2 border-r border-zinc-800/60 text-purple-300 whitespace-nowrap min-w-[180px]">
                        17% = 6 Hits | 21% = 5 Hits | 26% = 4 Hits | 34% = 3 Hits
                      </td>
                      <td className="p-2 text-zinc-400 whitespace-normal min-w-[200px]">
                        Reaching these key percentages reduces the total enemy contacts required to self-eliminate. Bosses receive 50% reduced Thorn reflection damage.
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white flex items-center gap-1.5 whitespace-nowrap min-w-[120px]">
                        <Zap className="w-3 h-3 text-purple-400" /> Burst Salvo Chance
                      </td>
                      <td className="p-2 border-r border-zinc-800/60 text-emerald-300 whitespace-nowrap min-w-[180px]">
                        Proc Trigger = Shot × Burst % Chance
                      </td>
                      <td className="p-2 text-zinc-400 whitespace-normal min-w-[200px]">
                        Triggers high velocity secondary volleys instantly. Excellent at clearing tight swarms of triangle geometry.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'turtle' && (
              <div className="overflow-x-auto border border-zinc-800 rounded-lg">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-emerald-400 font-bold text-[9px] uppercase tracking-wider">
                      <th className="p-2 border-r border-zinc-800 whitespace-nowrap min-w-[130px]">Primary Core Turtle Stat</th>
                      <th className="p-2 border-r border-zinc-800 text-center whitespace-nowrap min-w-[100px]">Farming Priority</th>
                      <th className="p-2 whitespace-normal min-w-[220px]">In-Run Progression Goal & Strategy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 bg-black/40">
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white whitespace-nowrap min-w-[130px]">1. Defense Absolute</td>
                      <td className="p-2 border-r border-zinc-800/60 text-center font-bold text-emerald-400 whitespace-nowrap min-w-[100px]">S-RANK Priority</td>
                      <td className="p-2 text-zinc-400 whitespace-normal min-w-[220px]">Flat reduction applied last. Keep high enough to reduce Red Square and Triangle DPS to 0.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white whitespace-nowrap min-w-[130px]">2. Thorn Damage %</td>
                      <td className="p-2 border-r border-zinc-800/60 text-center font-bold text-emerald-400 whitespace-nowrap min-w-[100px]">S-RANK Priority</td>
                      <td className="p-2 text-zinc-400 whitespace-normal min-w-[220px]">Aims for 21% or 26% early. Forces attacking shapes to destroy themselves instantly on contact.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white whitespace-nowrap min-w-[130px]">3. Cash Bonus</td>
                      <td className="p-2 border-r border-zinc-800/60 text-center font-bold text-yellow-400 whitespace-nowrap min-w-[100px]">A-RANK Priority</td>
                      <td className="p-2 text-zinc-400 whitespace-normal min-w-[220px]">Increases cash from every enemy pop. Foundational multiplier that accelerates high-tier in-run stats.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white whitespace-nowrap min-w-[130px]">4. Cash Per Wave</td>
                      <td className="p-2 border-r border-zinc-800/60 text-center font-bold text-yellow-400 whitespace-nowrap min-w-[100px]">A-RANK Priority</td>
                      <td className="p-2 text-zinc-400 whitespace-normal min-w-[220px]">Guarantees static cash drop at wave end. Extremely strong during the first 15 waves of a run.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white whitespace-nowrap min-w-[130px]">5. Cosmic Shards Yield</td>
                      <td className="p-2 border-r border-zinc-800/60 text-center font-bold text-purple-400 whitespace-nowrap min-w-[100px]">B-RANK Priority</td>
                      <td className="p-2 text-zinc-400 whitespace-normal min-w-[220px]">Increases shards from bosses and milestones. Supports high-tier permanent workshop upgrades.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white whitespace-nowrap min-w-[130px]">6. Health Regen</td>
                      <td className="p-2 border-r border-zinc-800/60 text-center font-bold text-zinc-400 whitespace-nowrap min-w-[100px]">C-RANK Priority</td>
                      <td className="p-2 text-zinc-400 whitespace-normal min-w-[220px]">Restores small health increments per second. Keeps fortress topped off between heavy shape swarms.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'currencies' && (
              <div className="overflow-x-auto border border-zinc-800 rounded-lg">
                <table className="w-full text-left border-collapse table-auto">
                  <thead>
                    <tr className="bg-zinc-900 border-b border-zinc-800 text-sky-400 font-bold text-[9px] uppercase tracking-wider">
                      <th className="p-2 border-r border-zinc-800 whitespace-nowrap min-w-[100px]">Resource System</th>
                      <th className="p-2 border-r border-zinc-800 text-center whitespace-nowrap min-w-[120px]">Farming Location</th>
                      <th className="p-2 border-r border-zinc-800 whitespace-nowrap min-w-[160px]">Strategic Expense Node</th>
                      <th className="p-2 whitespace-normal min-w-[120px]">Reset Mechanics</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/80 bg-black/40">
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white flex items-center gap-1.5 whitespace-nowrap min-w-[100px]">
                        <span className="text-emerald-400 font-bold">$</span> Cash
                      </td>
                      <td className="p-2 border-r border-zinc-800/60 text-center text-emerald-300 whitespace-nowrap min-w-[120px]">In-run shape pops & waves</td>
                      <td className="p-2 border-r border-zinc-800/60 text-zinc-400 whitespace-nowrap min-w-[160px]">In-run stats (Damage, Health, Defense, Utility)</td>
                      <td className="p-2 text-zinc-500 whitespace-normal min-w-[120px]">Resets back to $0 upon death/rebirth.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white flex items-center gap-1.5 whitespace-nowrap min-w-[100px]">
                        <span className="text-purple-400 font-bold">✦</span> Cosmic Shards
                      </td>
                      <td className="p-2 border-r border-zinc-800/60 text-center text-purple-300 whitespace-nowrap min-w-[120px]">Milestones, bosses, ascension</td>
                      <td className="p-2 border-r border-zinc-800/60 text-zinc-400 whitespace-nowrap min-w-[160px]">Permanent Workshop base levels</td>
                      <td className="p-2 text-emerald-400 font-bold whitespace-normal min-w-[120px]">Permanent (Never resets)</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white flex items-center gap-1.5 whitespace-nowrap min-w-[100px]">
                        <span className="text-sky-400">💎</span> Gems
                      </td>
                      <td className="p-2 border-r border-zinc-800/60 text-center text-sky-300 whitespace-nowrap min-w-[120px]">Daily missions, achievements</td>
                      <td className="p-2 border-r border-zinc-800/60 text-zinc-400 whitespace-nowrap min-w-[160px]">Card pack packs & unlock extra slots</td>
                      <td className="p-2 text-emerald-400 font-bold whitespace-normal min-w-[120px]">Permanent (Never resets)</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-r border-zinc-800/60 font-bold text-white flex items-center gap-1.5 whitespace-nowrap min-w-[100px]">
                        <span className="text-amber-400">🧪</span> Cells
                      </td>
                      <td className="p-2 border-r border-zinc-800/60 text-center text-amber-300 whitespace-nowrap min-w-[120px]">Late runs & Tier 2+ waves</td>
                      <td className="p-2 border-r border-zinc-800/60 text-zinc-400 whitespace-nowrap min-w-[160px]">Research lab projects (Game Speed, absolute multipliers)</td>
                      <td className="p-2 text-emerald-400 font-bold whitespace-normal min-w-[120px]">Permanent (Never resets)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
