/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Settings, BarChart2, Cpu, Eye, Volume2, VolumeX, RotateCcw, ShieldCheck, TrendingUp } from 'lucide-react';
import { GameState, GameSettings } from '../types';
import { soundEngine } from '../game/sound';
import { formatCurrency } from '../utils/format';
import { useGameStore } from '../store/gameStore';

import { MusicPlayerDeck } from './MusicPlayerDeck';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  onUpdateSettings: (settings: Partial<GameSettings>) => void;
  onResetAllData: () => void;
  onOpenProgressionCurves?: () => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  gameState,
  onUpdateSettings,
  onResetAllData,
  onOpenProgressionCurves,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'gameplay' | 'performance' | 'audio'>('stats');
  const [confirmReset, setConfirmReset] = useState(false);
  const setFireProtocol = useGameStore(state => state.setFireProtocol);

  if (!isOpen) return null;

  const stats = gameState.stats;
  const settings = gameState.settings;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-zinc-950 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-zinc-300" />
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  System Settings
                </h2>
                <p className="text-[10px] text-zinc-400">
                  ID: <span className="font-mono text-purple-400">{stats?.playerId || 'PENT-ALPHA'}</span>
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

          {/* Tab selector */}
          <div className="flex border-b border-zinc-800 bg-zinc-900/30 p-1.5 gap-1 text-xs font-mono font-bold">
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('stats');
              }}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'stats' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Stats
            </button>
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('gameplay');
              }}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'gameplay' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Gameplay
            </button>
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('performance');
              }}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'performance' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Video
            </button>
            <button
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('audio');
              }}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                activeTab === 'audio' ? 'bg-zinc-800 text-white shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Audio
            </button>
          </div>

          {/* Body */}
          <div className="p-4 overflow-y-auto space-y-4 text-xs font-sans text-zinc-300">
            {activeTab === 'stats' && (
              <div className="space-y-2 font-mono text-xs">
                <div className="flex justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-zinc-400">Lifetime Cash Earned</span>
                  <span className="text-emerald-400 font-bold">${formatCurrency(stats?.lifetimeCash || 0, settings?.useLegacyCurrencyFormat)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-zinc-400">Lifetime Cosmic Shards</span>
                  <span className="text-purple-400 font-bold">✦ {formatCurrency(stats?.lifetimeCosmicShards || 0, settings?.useLegacyCurrencyFormat)}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-zinc-400">Total Runs Attempted</span>
                  <span className="text-white font-bold">{stats?.totalRunsStarted || 1}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-zinc-400">Tier 1 Highest Wave</span>
                  <span className="text-sky-400 font-bold">Wave {stats?.highestWavePerTier?.[1] || gameState.highestWaveEver || 1}</span>
                </div>
                <div className="flex justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <span className="text-zinc-400">Enemies Defeated</span>
                  <span className="text-white font-bold">{formatCurrency(stats?.totalEnemiesSlain || 0, settings?.useLegacyCurrencyFormat)}</span>
                </div>

                {onOpenProgressionCurves && (
                  <button
                    onClick={() => {
                      soundEngine.playTabSwitch();
                      onOpenProgressionCurves();
                    }}
                    className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/40 text-purple-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    <TrendingUp className="w-4 h-4 text-purple-400" />
                    Inspect Progression Math & Desmos Curves
                  </button>
                )}
              </div>
            )}

            {activeTab === 'gameplay' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">Legacy Exact Currency Format</h4>
                    <p className="text-[10px] text-zinc-400">Show exact full values (e.g., $1,100) instead of simplified suffixes (1.1k, 1M)</p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ useLegacyCurrencyFormat: !settings.useLegacyCurrencyFormat })}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                      settings.useLegacyCurrencyFormat ? 'bg-amber-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                        settings.useLegacyCurrencyFormat ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">Pause Battle in Menus</h4>
                    <p className="text-[10px] text-zinc-400">Freezes wave simulation while browsing Workshop or Cards</p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ pauseInMenus: !settings.pauseInMenus })}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                      settings.pauseInMenus ? 'bg-purple-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                        settings.pauseInMenus ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">Cash Popups</h4>
                    <p className="text-[10px] text-zinc-400">Show floating cash gains on enemy kills</p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ showCashPopups: !settings.showCashPopups })}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                      settings.showCashPopups ? 'bg-emerald-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                        settings.showCashPopups ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div>
                    <h4 className="font-mono text-xs font-bold text-white">Damage Numbers</h4>
                    <p className="text-[10px] text-zinc-400">Show floating laser damage on hit</p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ showDamageNumbers: !settings.showDamageNumbers })}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${
                      settings.showDamageNumbers ? 'bg-sky-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                        settings.showDamageNumbers ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Tactical Weapon Fire Protocol Selection */}
                <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3 mt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-mono text-xs font-black text-white uppercase tracking-wider">
                        Weapon Fire Protocol
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        Select active firing mode for the central defense battery
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-1.5 pt-1">
                    {[
                      { id: 'standard', name: 'Standard Cannon', desc: 'Sleek, high-precision electric zaps.', color: 'text-sky-400 border-sky-800/60 bg-sky-950/10 hover:bg-sky-950/20' },
                      { id: 'gatling', name: 'Gatling Barrage', desc: 'Rapid needle-fire at 5.5x speed with wide spray.', color: 'text-amber-400 border-amber-800/60 bg-amber-950/10 hover:bg-amber-950/20' },
                      { id: 'plasma_beam', name: 'Sustained Plasma Beam', desc: 'Melts individual targets; triggers pink splash explosions.', color: 'text-fuchsia-400 border-fuchsia-800/60 bg-fuchsia-950/10 hover:bg-fuchsia-950/20' },
                      { id: 'calamity_shell', name: 'Calamity Cluster Shell', desc: 'Heavy high-damage shells that splinter into fire bomblets.', color: 'text-orange-400 border-orange-800/60 bg-orange-950/10 hover:bg-orange-950/20' },
                      { id: 'singularity_vortex', name: 'Singularity Vortex', desc: 'Gravity wells that drag enemies in and implode on collapse.', color: 'text-purple-400 border-purple-800/60 bg-purple-950/10 hover:bg-purple-950/20' },
                    ].map(p => {
                      const isActive = (gameState.fireProtocol || 'standard') === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            soundEngine.playUpgradeSuccess();
                            setFireProtocol(p.id as any);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg border transition-all flex flex-col gap-0.5 cursor-pointer ${
                            isActive
                              ? 'bg-zinc-800 border-zinc-600 text-white shadow-md'
                              : 'bg-zinc-900/40 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className={`font-mono text-xs font-black ${isActive ? 'text-white' : p.color.split(' ')[0]}`}>
                              {p.name}
                            </span>
                            {isActive && (
                              <span className="text-[9px] font-mono font-black bg-zinc-700 text-white px-1.5 py-0.5 rounded uppercase tracking-widest">
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-zinc-400 leading-normal">
                            {p.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2">
                  <h4 className="font-mono text-xs font-bold text-white">Target Frame Rate</h4>
                  <p className="text-[10px] text-zinc-400">
                    Simulation physics are mathematically decoupled from visual rendering FPS.
                  </p>
                  <div className="flex gap-2">
                    {[30, 60, 120].map(fps => (
                      <button
                        key={fps}
                        onClick={() => onUpdateSettings({ targetFps: fps as 30 | 60 | 120 })}
                        className={`flex-1 py-2 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
                          settings.targetFps === fps
                            ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                            : 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60 hover:text-white'
                        }`}
                      >
                        {fps} FPS
                      </button>
                    ))}
                  </div>
                </div>

                {/* High-Density Performance Mode */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="pr-3">
                    <h4 className="font-mono text-xs font-bold text-white">High-Density Mode</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Locks DPR to 1.0 and tightens VFX budgets. Highly recommended for mid-range mobile devices under 500+ enemy hordes.
                    </p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ highPerformanceMode: !settings.highPerformanceMode })}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer ${
                      settings.highPerformanceMode
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {settings.highPerformanceMode ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Adaptive Performance Governor */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="pr-3">
                    <h4 className="font-mono text-xs font-bold text-white">Adaptive Governor</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Monitors rolling frame times. Automatically applies distant enemy LOD staggering if frame time exceeds 18.5 ms to maintain 60 FPS.
                    </p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ adaptivePerformanceMode: settings.adaptivePerformanceMode === false ? true : false })}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer ${
                      settings.adaptivePerformanceMode !== false
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {settings.adaptivePerformanceMode !== false ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Debug Performance HUD */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="pr-3">
                    <h4 className="font-mono text-xs font-bold text-white">Debug Performance HUD</h4>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Renders live FPS, frame latency (ms), active enemy counts, and projectile counts on-screen.
                    </p>
                  </div>
                  <button
                    onClick={() => onUpdateSettings({ showPerformanceHud: !settings.showPerformanceHud })}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer ${
                      settings.showPerformanceHud
                        ? 'bg-purple-950/80 border-purple-500 text-purple-300'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {settings.showPerformanceHud ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'audio' && (
              <div className="space-y-3.5">
                {/* 1. Sound Effects (SFX) Control */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
                  <div className="pr-2">
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      <h4 className="font-mono text-xs font-bold text-white">Sound Effects (SFX)</h4>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      Combat impacts, laser fire, cash pickups, and tactical UI audio
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const next = !settings.soundMuted;
                      soundEngine.setMute(next);
                      onUpdateSettings({ soundMuted: next });
                    }}
                    className={`px-3 py-2 rounded-lg border font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      settings.soundMuted
                        ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                        : 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                    }`}
                  >
                    {settings.soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    <span>{settings.soundMuted ? 'MUTED' : 'ACTIVE'}</span>
                  </button>
                </div>

                {/* 2. Remastered Shuffled Background Music (BGM) Deck */}
                <MusicPlayerDeck 
                  bgmMuted={settings.bgmMuted} 
                  onUpdateSettings={onUpdateSettings} 
                />
              </div>
            )}

            {/* Danger Zone: Hard Reset */}
            <div className="pt-2 border-t border-zinc-800/80">
              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="w-full py-2 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 text-rose-400 font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Game Progression
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onResetAllData();
                      setConfirmReset(false);
                      onClose();
                    }}
                    className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-lg"
                  >
                    Confirm Wipe
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
