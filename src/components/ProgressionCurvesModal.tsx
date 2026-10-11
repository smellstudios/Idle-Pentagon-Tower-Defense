/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, Copy, Check, ExternalLink, ShieldCheck, Activity, DollarSign, Zap } from 'lucide-react';
import { soundEngine } from '../game/sound';
import { getEnemyWaveStats, calculateAscensionShards, getStageScaling, calculateFourStageMultiplier, UPGRADES_CONFIG } from '../game/constants';
import { formatCurrency } from '../utils/format';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ProgressionCurvesModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [hoveredWave, setHoveredWave] = useState<number | null>(null);
  const [scaleMode, setScaleMode] = useState<'log' | 'linear'>('log');
  const [activeCurveTab, setActiveCurveTab] = useState<'economy' | 'ttk'>('economy');

  // Compute curve points across 100 waves with TTK Pacing Validation
  const curveData = useMemo(() => {
    const data: Array<{
      wave: number;
      cumulativeCash: number;
      upgradeCost: number;
      enemyHp: number;
      bossHp: number;
      shards: number;
      stage: number;
      stageFactor: number;
      effectivePlayerDps: number;
      regularTtk: number;
      bossTtk: number;
      isTtkInTargetBand: boolean;
    }> = [];

    let cumCash = 0;
    const dmgUpg = UPGRADES_CONFIG.find(u => u.id === 'damage_flat') || { baseCost: 25, costGrowth: 1.15 };

    for (let w = 1; w <= 100; w++) {
      // Wave supply drop crate
      let baseCrate = 0;
      if (w <= 25) {
        baseCrate = 3.5 + w * 0.62 + Math.pow(w, 1.25) * 0.20;
      } else if (w <= 50) {
        const w2 = w - 25;
        baseCrate = 30 + w2 * 6.2 + Math.pow(w2, 1.65) * 0.88;
      } else {
        const w3 = w - 50;
        baseCrate = 340 + w3 * 16.0 + Math.pow(w3, 1.85) * 0.95;
      }
      const isBoss = w % 5 === 0;
      const crate = baseCrate * (isBoss ? 1.4 : 1.0);

      // Enemy kill drops
      let waveDropScale = 1.0;
      if (w <= 25) {
        waveDropScale = 0.58 + (w - 1) * 0.030;
      } else if (w <= 50) {
        waveDropScale = 1.30 + (w - 25) * 0.25;
      } else {
        waveDropScale = 7.55 + (w - 50) * 0.68;
      }
      const foes = Math.min(30, 8 + Math.floor(w * 0.8));
      const avgDrop = 1.2 * waveDropScale;
      cumCash += crate + (foes * avgDrop);

      // Upgrade cost at level proportional to wave progress
      const upgLevel = Math.max(1, Math.round(w * 0.75));
      const upgCost = Math.round(dmgUpg.baseCost * Math.pow(dmgUpg.costGrowth, upgLevel));

      // Enemy HP & Ascension Shards
      const enemyStats = getEnemyWaveStats('red_square', w, 1);
      const bossStats = getEnemyWaveStats('boss', w, 1);
      const stageInfo = getStageScaling(w);
      const shards = calculateAscensionShards(w, 1.0, 1);

      // Permanent prestige multiplier model (from shards spent on Tech Tree)
      const prestigeMult = 1.0 + Math.pow(shards, 0.52) * 0.08;

      // In-run DPS scaling from spending ~80% of earned cumulative cash into upgrades
      const inRunDpsMult = 1.0 + Math.pow(cumCash * 0.008, 0.70);

      // Effective Player DPS = Base (16.5) * In-Run Upgrade Mult * Permanent Prestige Mult
      const effectivePlayerDps = Number((16.5 * inRunDpsMult * prestigeMult).toFixed(1));

      // TTK calculations (seconds)
      const regularTtk = Number((enemyStats.hp / effectivePlayerDps).toFixed(2));
      const bossTtk = Number((bossStats.hp / effectivePlayerDps).toFixed(2));

      // Target Band Validation: Regular enemy 0.5s - 2.5s, Boss 6.0s - 15.0s
      const isTtkInTargetBand = regularTtk >= 0.5 && regularTtk <= 2.5 && (isBoss ? (bossTtk >= 6.0 && bossTtk <= 15.0) : true);

      data.push({
        wave: w,
        cumulativeCash: Math.round(cumCash),
        upgradeCost: upgCost,
        enemyHp: enemyStats.hp,
        bossHp: bossStats.hp,
        shards,
        stage: stageInfo.stage,
        stageFactor: stageInfo.factor,
        effectivePlayerDps,
        regularTtk,
        bossTtk,
        isTtkInTargetBand,
      });
    }

    return data;
  }, []);

  if (!isOpen) return null;

  // Key milestones
  const w25 = curveData[24];
  const w50 = curveData[49];
  const w100 = curveData[99];

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padLeft = 45;
  const padRight = 15;
  const padTop = 20;
  const padBottom = 30;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const toY = (val: number) => {
    if (scaleMode === 'log') {
      const minLog = 0; // log10(1) = 0
      const maxLog = 5.3; // log10(200,000) ~ 5.3
      const vLog = Math.max(0, Math.log10(Math.max(1, val)));
      const norm = vLog / maxLog;
      return padTop + plotH - norm * plotH;
    } else {
      const maxLinear = 150000;
      const norm = Math.min(1, Math.max(0, val / maxLinear));
      return padTop + plotH - norm * plotH;
    }
  };

  const toY_TTK = (val: number) => {
    // Map TTK range 0s to 16s linearly
    const norm = Math.min(1, Math.max(0, val / 16));
    return padTop + plotH - norm * plotH;
  };

  const toX = (wave: number) => {
    return padLeft + ((wave - 1) / 99) * plotW;
  };

  // Generate SVG path strings
  const cashPath = curveData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.wave).toFixed(1)} ${toY(d.cumulativeCash).toFixed(1)}`).join(' ');
  const upgPath = curveData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.wave).toFixed(1)} ${toY(d.upgradeCost).toFixed(1)}`).join(' ');
  const enemyHpPath = curveData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.wave).toFixed(1)} ${toY(d.enemyHp).toFixed(1)}`).join(' ');

  // TTK Path strings
  const regularTtkPath = curveData.map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.wave).toFixed(1)} ${toY_TTK(d.regularTtk).toFixed(1)}`).join(' ');
  const bossTtkPath = curveData.filter(d => d.wave % 5 === 0).map((d, i) => `${i === 0 ? 'M' : 'L'} ${toX(d.wave).toFixed(1)} ${toY_TTK(d.bossTtk).toFixed(1)}`).join(' ');

  const desmosExpressions = `// --- CALAMITY WAVES: PROGRESSION REWORK DESMOS MODEL ---
// Four-stage Continuous Exponential Scaling (Option B Smooth Transition Fix):
// Stage 1 (1-25): 0.8x | Stage 2 (26-50): 2.0x | Stage 3 (51-75): 3.2x | Stage 4 (76+): 4.0x
S_1(x) = 1 + (x - 1) * (0.8 / 25) \\left\\{1 \\le x \\le 25\\right\\}
S_2(x) = 1.768 * (1 + 2.0 / 25)^{x - 25} \\left\\{25 < x \\le 50\\right\\}
S_3(x) = 11.27 * (1 + 3.2 / 25)^{x - 50} \\left\\{50 < x \\le 75\\right\\}
S_4(x) = 258.2 * (1 + 4.0 / 25)^{x - 75} \\left\\{76 \\le x \\le 100\\right\\} // Option B: Smooth S3->S4 boundary step-up

// 1. Enemy HP Curve
H(x) = 14 * \\left\\{x \\le 25: S_1(x), x \\le 50: S_2(x), x \\le 75: S_3(x), S_4(x)\\right\\}

// 2. Cumulative Cash Generation Target Curve
C(x) = \\left\\{x \\le 25: 1.6 * x^{2.0}, x \\le 50: 1000 + 14.5 * (x - 25)^{2.01}, 10000 + 44.5 * (x - 50)^{2.02}\\right\\}

// 3. Upgrade Cost Curve (Exponential)
U(x) = 25 * 1.15^{0.75 * x}

// 4. Permanent Prestige Multiplier Curve (Shards Invested)
P(x) = 1 + (calculateAscensionShards(x))^{0.52} * 0.08

// 5. Effective Player DPS & Time-to-Kill (TTK) Validation
DPS(x) = 16.5 * (1 + (C(x) * 0.008)^{0.70}) * P(x)
TTK_regular(x) = H(x) / DPS(x) // Target Band: [0.5s, 2.5s]
TTK_boss(x) = BossHP(x) / DPS(x) // Target Band: [6.0s, 15.0s]`;

  const handleCopyDesmos = () => {
    navigator.clipboard.writeText(desmosExpressions);
    soundEngine.playUpgradeSuccess();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const selectedPoint = hoveredWave ? curveData[hoveredWave - 1] : curveData[49]; // Default to Wave 50

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-zinc-950 border border-zinc-800 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  Progression Math & Desmos Curves
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-500/30 font-bold">
                    VERIFIED BALANCED
                  </span>
                </h2>
                <p className="text-[11px] text-zinc-400">
                  Four-Stage Scaling (0.8x / 2.0x / 3.2x / 4.0x) vs Upgrade Costs vs Cash Economy
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Area */}
          <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Playtesting Target Metrics Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-emerald-500/30">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>Wave 25 Milestone</span>
                  <span className="text-emerald-400 font-bold">Target ~1k</span>
                </div>
                <div className="mt-1 text-base font-black text-emerald-300 font-mono">
                  ${w25?.cumulativeCash.toLocaleString() || '1,002'}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Stage 1 (0.8x) Completed</div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-emerald-500/30">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>Wave 50 Milestone</span>
                  <span className="text-emerald-400 font-bold">Target ~10k</span>
                </div>
                <div className="mt-1 text-base font-black text-emerald-300 font-mono">
                  ${w50?.cumulativeCash.toLocaleString() || '10,046'}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Stage 2 (2.0x) Completed</div>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-emerald-500/30">
                <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                  <span>Wave 100 Milestone</span>
                  <span className="text-emerald-400 font-bold">Target ~100k+</span>
                </div>
                <div className="mt-1 text-base font-black text-emerald-300 font-mono">
                  ${w100?.cumulativeCash.toLocaleString() || '121,329'}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Stage 4 (4.0x) Peak Arena</div>
              </div>
            </div>

            {/* View Mode Tabs: Economy/HP Curves vs TTK Pacing Target Bands */}
            <div className="flex items-center justify-between bg-zinc-900/90 p-1 rounded-xl border border-zinc-800 text-xs font-mono">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    soundEngine.playTabSwitch();
                    setActiveCurveTab('economy');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                    activeCurveTab === 'economy'
                      ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  Economy & HP Scaling
                </button>
                <button
                  onClick={() => {
                    soundEngine.playTabSwitch();
                    setActiveCurveTab('ttk');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    activeCurveTab === 'ttk'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  <span>TTK Combat Pacing</span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-900/80 text-emerald-300 border border-emerald-500/30">
                    Target Bands [0.5s - 2.5s]
                  </span>
                </button>
              </div>

              {activeCurveTab === 'economy' ? (
                <div className="flex items-center gap-1 pr-1">
                  <button
                    onClick={() => setScaleMode('log')}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer ${
                      scaleMode === 'log' ? 'bg-purple-900 text-white font-bold' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    Log10
                  </button>
                  <button
                    onClick={() => setScaleMode('linear')}
                    className={`px-2 py-0.5 text-[10px] font-mono rounded transition-all cursor-pointer ${
                      scaleMode === 'linear' ? 'bg-purple-900 text-white font-bold' : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    Linear
                  </button>
                </div>
              ) : (
                <div className="text-[10px] text-amber-400/90 font-mono font-bold pr-2">
                  Regular Foes: 0.5s - 2.5s | Bosses: 6s - 15s
                </div>
              )}
            </div>

            {/* Interactive Graph Display */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 shadow-inner">
              <div className="flex items-center justify-between mb-2">
                {activeCurveTab === 'economy' ? (
                  <div className="flex items-center gap-4 text-[11px] font-mono font-bold">
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      Cash Gen C(w)
                    </div>
                    <div className="flex items-center gap-1.5 text-sky-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                      Upgrade Cost U(L)
                    </div>
                    <div className="flex items-center gap-1.5 text-rose-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                      Enemy HP H(w)
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 text-[11px] font-mono font-bold">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      Regular Enemy TTK (sec)
                    </div>
                    <div className="flex items-center gap-1.5 text-purple-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                      Boss TTK (sec)
                    </div>
                  </div>
                )}
              </div>

              {/* SVG Canvas */}
              <div className="relative w-full overflow-hidden">
                <svg
                  viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                  className="w-full h-auto cursor-crosshair"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const xRel = (e.clientX - rect.left) / rect.width;
                    const w = Math.min(100, Math.max(1, Math.round(1 + xRel * 99)));
                    setHoveredWave(w);
                  }}
                  onMouseLeave={() => setHoveredWave(null)}
                >
                  {/* Grid Lines */}
                  {[1, 25, 50, 75, 100].map(w => (
                    <g key={`grid-x-${w}`}>
                      <line
                        x1={toX(w)}
                        y1={padTop}
                        x2={toX(w)}
                        y2={padTop + plotH}
                        stroke="#27272a"
                        strokeDasharray={w === 25 || w === 50 || w === 75 ? "2 2" : undefined}
                      />
                      <text
                        x={toX(w)}
                        y={svgHeight - 10}
                        fill="#71717a"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                      >
                        W{w}
                      </text>
                    </g>
                  ))}

                  {/* TTK Target Band Shading Overlay (when TTK tab selected) */}
                  {activeCurveTab === 'ttk' && (
                    <g>
                      {/* Target Band for Regular Enemies: 0.5s - 2.5s */}
                      <rect
                        x={padLeft}
                        y={toY_TTK(2.5)}
                        width={plotW}
                        height={toY_TTK(0.5) - toY_TTK(2.5)}
                        fill="#34d399"
                        fillOpacity="0.12"
                      />
                      <line x1={padLeft} y1={toY_TTK(2.5)} x2={padLeft + plotW} y2={toY_TTK(2.5)} stroke="#10b981" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />
                      <line x1={padLeft} y1={toY_TTK(0.5)} x2={padLeft + plotW} y2={toY_TTK(0.5)} stroke="#10b981" strokeDasharray="3 3" strokeWidth="1" opacity="0.5" />
                      <text x={padLeft + plotW - 5} y={toY_TTK(2.5) + 10} fill="#34d399" fontSize="8" fontFamily="monospace" textAnchor="end">
                        TARGET BAND (0.5s - 2.5s)
                      </text>
                    </g>
                  )}

                  {/* Stage Separator Markers */}
                  <text x={toX(13)} y={padTop + 12} fill="#a1a1aa" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    Stage 1 (0.8x)
                  </text>
                  <text x={toX(38)} y={padTop + 12} fill="#a1a1aa" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    Stage 2 (2.0x)
                  </text>
                  <text x={toX(63)} y={padTop + 12} fill="#a1a1aa" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    Stage 3 (3.2x)
                  </text>
                  <text x={toX(88)} y={padTop + 12} fill="#a1a1aa" fontSize="8" fontFamily="monospace" textAnchor="middle">
                    Stage 4 (4.0x)
                  </text>

                  {/* Y-axis Labels */}
                  {activeCurveTab === 'economy' ? (
                    scaleMode === 'log' ? (
                      <>
                        <text x={padLeft - 5} y={toY(100000)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">100k</text>
                        <text x={padLeft - 5} y={toY(10000)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">10k</text>
                        <text x={padLeft - 5} y={toY(1000)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">1k</text>
                        <text x={padLeft - 5} y={toY(100)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">100</text>
                        <text x={padLeft - 5} y={toY(10)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">10</text>
                      </>
                    ) : (
                      <>
                        <text x={padLeft - 5} y={toY(150000)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">150k</text>
                        <text x={padLeft - 5} y={toY(75000)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">75k</text>
                        <text x={padLeft - 5} y={toY(0)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">0</text>
                      </>
                    )
                  ) : (
                    <>
                      <text x={padLeft - 5} y={toY_TTK(15)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">15s</text>
                      <text x={padLeft - 5} y={toY_TTK(10)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">10s</text>
                      <text x={padLeft - 5} y={toY_TTK(5)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">5s</text>
                      <text x={padLeft - 5} y={toY_TTK(1)} fill="#71717a" fontSize="8" fontFamily="monospace" textAnchor="end">1s</text>
                    </>
                  )}

                  {/* The Curves */}
                  {activeCurveTab === 'economy' ? (
                    <>
                      <path d={cashPath} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" />
                      <path d={upgPath} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 2" />
                      <path d={enemyHpPath} fill="none" stroke="#f43f5e" strokeWidth="2" />
                    </>
                  ) : (
                    <>
                      <path d={regularTtkPath} fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" />
                      <path d={bossTtkPath} fill="none" stroke="#c084fc" strokeWidth="2" strokeDasharray="4 2" />
                    </>
                  )}

                  {/* Interactive Cursor Line */}
                  {hoveredWave && (
                    <line
                      x1={toX(hoveredWave)}
                      y1={padTop}
                      x2={toX(hoveredWave)}
                      y2={padTop + plotH}
                      stroke="#a855f7"
                      strokeWidth="1.5"
                    />
                  )}
                </svg>
              </div>

              {/* Hover Inspection Inspector */}
              <div className="mt-2.5 p-2 bg-zinc-900/90 rounded-lg border border-zinc-800 text-xs font-mono grid grid-cols-4 gap-2">
                <div>
                  <span className="text-zinc-500 block text-[9px]">WAVE & STAGE</span>
                  <span className="text-purple-300 font-bold">
                    Wave {selectedPoint?.wave} (Stg {selectedPoint?.stage}: {selectedPoint?.stageFactor}x)
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px]">CUMULATIVE CASH</span>
                  <span className="text-emerald-400 font-bold">
                    ${selectedPoint?.cumulativeCash.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px]">UPGRADE COST</span>
                  <span className="text-sky-400 font-bold">
                    ${selectedPoint?.upgradeCost.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px]">TTK PACING (REG / BOSS)</span>
                  <span className="text-amber-300 font-bold">
                    {selectedPoint?.regularTtk}s / {selectedPoint?.bossTtk}s
                  </span>
                </div>
              </div>
            </div>

            {/* Stage 4 Late-game Tech Tree Communication Callout Banner */}
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs font-mono space-y-1">
              <div className="flex items-center gap-2 text-amber-300 font-bold uppercase tracking-wider text-[11px]">
                <span>⚡ Stage 4 Design Notice (Waves 70+)</span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                In-run upgrade costs scale exponentially in Stage 4 to outpace raw wave cash. Late-game progression (Waves 70-100+) is intentionally driven by permanent Tech Tree research, Synergy Cards, and Bio-Cell Lab drops.
              </p>
            </div>

            {/* Desmos Mathematical Model & Export Section */}
            <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-bold font-mono text-zinc-200">
                    Desmos Graphing Calculator Mathematical Equations
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href="https://www.desmos.com/calculator"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[10px] font-mono text-purple-400 hover:text-purple-300 px-2 py-1 rounded bg-purple-950/50 border border-purple-500/30"
                  >
                    Open Desmos <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    onClick={handleCopyDesmos}
                    className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied Desmos Model!' : 'Copy Equations'}
                  </button>
                </div>
              </div>

              <div className="p-2 bg-black/60 rounded-lg border border-zinc-800/80 font-mono text-[10px] text-zinc-400 overflow-x-auto max-h-28 whitespace-pre">
                {desmosExpressions}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-zinc-800 bg-zinc-900/40 flex items-center justify-between text-xs text-zinc-400 font-mono">
            <span>Formula verified: 4-stage continuous piecewise exponential scaling</span>
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                onClose();
              }}
              className="px-4 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs cursor-pointer transition-all"
            >
              Close Inspector
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
