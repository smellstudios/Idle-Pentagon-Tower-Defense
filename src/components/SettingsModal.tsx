/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Settings, 
  Cpu, 
  Volume2, 
  VolumeX, 
  RotateCcw, 
  Gamepad2, 
  TrendingUp, 
  Activity, 
  Coins, 
  Flame, 
  PauseCircle, 
  Sparkles,
  BarChart2
} from 'lucide-react';
import { GameState, GameSettings } from '../types';
import { soundEngine } from '../game/sound';
import { formatCurrency } from '../utils/format';
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
  const [activeTab, setActiveTab] = useState<'gameplay' | 'performance' | 'audio' | 'stats'>('gameplay');
  const [confirmReset, setConfirmReset] = useState(false);

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
          className="bg-zinc-950 border border-zinc-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[88vh] overflow-hidden"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-950/60 border border-purple-500/40 text-purple-300">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                  Settings & Performance
                </h2>
                <p className="text-[10px] text-zinc-400">
                  Player ID: <span className="font-mono text-purple-400">{stats?.playerId || 'PENT-ALPHA'}</span>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Clean Segmented Tab Navigation */}
          <div className="flex border-b border-zinc-800/80 bg-zinc-900/30 p-1.5 gap-1 text-xs font-mono font-bold select-none">
            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('gameplay');
              }}
              className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'gameplay' 
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              <span>Gameplay</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('performance');
              }}
              className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'performance' 
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Video & FX</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('audio');
              }}
              className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'audio' 
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>Audio</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playTabSwitch();
                setActiveTab('stats');
              }}
              className={`flex-1 py-1.5 rounded-lg text-center flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'stats' 
                  ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700' 
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Data</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 overflow-y-auto space-y-3.5 text-xs font-sans text-zinc-300 custom-scrollbar">
            {/* TAB 1: GAMEPLAY */}
            {activeTab === 'gameplay' && (
              <div className="space-y-2.5">
                {/* 1. Pause in Menus */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="pr-3">
                    <div className="flex items-center gap-1.5">
                      <PauseCircle className="w-3.5 h-3.5 text-purple-400" />
                      <h4 className="font-mono text-xs font-bold text-white">Pause Battle in Menus</h4>
                    </div>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      Freezes wave simulation while browsing Workshop, Lab, or Cards
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ pauseInMenus: !settings.pauseInMenus })}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer shrink-0 ${
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

                {/* 2. Floating Damage Numbers */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="pr-3">
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-rose-400" />
                      <h4 className="font-mono text-xs font-bold text-white">Damage Popups</h4>
                    </div>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      Show floating hit indicators, crits, and elemental ailments
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ showDamageNumbers: !settings.showDamageNumbers })}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer shrink-0 ${
                      settings.showDamageNumbers ? 'bg-rose-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                        settings.showDamageNumbers ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Floating Cash Popups */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="pr-3">
                    <div className="flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-emerald-400" />
                      <h4 className="font-mono text-xs font-bold text-white">Cash Popups</h4>
                    </div>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      Display floating cash gains on enemy kills and wave milestones
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ showCashPopups: !settings.showCashPopups })}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer shrink-0 ${
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

                {/* 4. Floating Cosmic Shard Popups */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="pr-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <h4 className="font-mono text-xs font-bold text-white">Shard & Rare Drop Popups</h4>
                    </div>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      Show floating notifications when harvesting Cosmic Shards and Rare Drops
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ showShardPopups: !settings.showShardPopups })}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer shrink-0 ${
                      settings.showShardPopups ? 'bg-purple-600' : 'bg-zinc-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                        settings.showShardPopups ? 'left-6' : 'left-1'
                      }`}
                    />
                  </button>
                </div>

                {/* 5. Legacy Exact Currency Format */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="pr-3">
                    <h4 className="font-mono text-xs font-bold text-white">Exact Numeric Format</h4>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      Show exact full values ($1,250) instead of simplified metric suffixes ($1.25k)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ useLegacyCurrencyFormat: !settings.useLegacyCurrencyFormat })}
                    className={`w-11 h-6 rounded-full transition-all relative cursor-pointer shrink-0 ${
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
              </div>
            )}

            {/* TAB 2: VIDEO & PERFORMANCE */}
            {activeTab === 'performance' && (
              <div className="space-y-3">
                {/* Target Frame Rate */}
                <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-mono text-xs font-bold text-white">Target Frame Rate</h4>
                    <span className="text-[10px] font-mono text-purple-400 font-bold">{settings.targetFps || 60} FPS</span>
                  </div>
                  <p className="text-[10.5px] text-zinc-400">
                    Physics simulation is mathematically decoupled from GPU render cycles.
                  </p>
                  <div className="flex gap-2 pt-1">
                    {[30, 60, 120].map(fps => (
                      <button
                        key={fps}
                        type="button"
                        onClick={() => {
                          soundEngine.playTabSwitch();
                          onUpdateSettings({ targetFps: fps as 30 | 60 | 120 });
                        }}
                        className={`flex-1 py-1.5 rounded-lg font-mono text-xs font-bold border transition-all cursor-pointer ${
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

                {/* High-Density Mode */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="pr-3">
                    <h4 className="font-mono text-xs font-bold text-white">High-Density Mode</h4>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      Locks DPR to 1.0 and tightens VFX budgets. Recommended for mid-range mobile browsers under 500+ enemy hordes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playTabSwitch();
                      onUpdateSettings({ highPerformanceMode: !settings.highPerformanceMode });
                    }}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      settings.highPerformanceMode
                        ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {settings.highPerformanceMode ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Adaptive Governor */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="pr-3">
                    <h4 className="font-mono text-xs font-bold text-white">Adaptive Governor</h4>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      Monitors rolling frame times. Automatically applies distant enemy LOD staggering if frame time exceeds 18.5 ms to maintain 60 FPS.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playTabSwitch();
                      onUpdateSettings({ adaptivePerformanceMode: settings.adaptivePerformanceMode === false ? true : false });
                    }}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      settings.adaptivePerformanceMode !== false
                        ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                        : 'bg-zinc-800/80 border-zinc-700 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {settings.adaptivePerformanceMode !== false ? 'ON' : 'OFF'}
                  </button>
                </div>

                {/* Debug Performance HUD */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="pr-3">
                    <h4 className="font-mono text-xs font-bold text-white">Debug Performance HUD</h4>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      Renders live FPS, frame latency (ms), active enemy counts, and projectile counts on-screen.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playTabSwitch();
                      onUpdateSettings({ showPerformanceHud: !settings.showPerformanceHud });
                    }}
                    className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold transition-all cursor-pointer shrink-0 ${
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

            {/* TAB 3: AUDIO */}
            {activeTab === 'audio' && (
              <div className="space-y-3.5">
                {/* SFX Control */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                  <div className="pr-2">
                    <div className="flex items-center gap-1.5">
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      <h4 className="font-mono text-xs font-bold text-white">Sound Effects (SFX)</h4>
                    </div>
                    <p className="text-[10.5px] text-zinc-400 mt-0.5">
                      Combat impacts, laser fire, cash pickups, and tactical UI audio
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const next = !settings.soundMuted;
                      soundEngine.setMute(next);
                      if (!next) soundEngine.playZap();
                      onUpdateSettings({ soundMuted: next });
                    }}
                    className={`px-3 py-2 rounded-lg border font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                      settings.soundMuted
                        ? 'bg-rose-950/80 border-rose-600 text-rose-300'
                        : 'bg-emerald-950/80 border-emerald-600 text-emerald-300'
                    }`}
                  >
                    {settings.soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    <span>{settings.soundMuted ? 'MUTED' : 'ACTIVE'}</span>
                  </button>
                </div>

                {/* Background Music (BGM) Deck */}
                <MusicPlayerDeck 
                  bgmMuted={settings.bgmMuted} 
                  onUpdateSettings={onUpdateSettings} 
                />
              </div>
            )}

            {/* TAB 4: DATA & STATS */}
            {activeTab === 'stats' && (
              <div className="space-y-3">
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-zinc-400">Lifetime Cash Earned</span>
                    <span className="text-emerald-400 font-bold">${formatCurrency(stats?.lifetimeCash || 0, settings?.useLegacyCurrencyFormat)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-zinc-400">Lifetime Cosmic Shards</span>
                    <span className="text-purple-400 font-bold">✦ {formatCurrency(stats?.lifetimeCosmicShards || 0, settings?.useLegacyCurrencyFormat)}</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-800/80">
                    <span className="text-zinc-400">Total Runs Started</span>
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
                </div>

                {onOpenProgressionCurves && (
                  <button
                    type="button"
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

                {/* Safe Progression Reset */}
                <div className="pt-2 border-t border-zinc-800/80">
                  {!confirmReset ? (
                    <button
                      type="button"
                      onClick={() => setConfirmReset(true)}
                      className="w-full py-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/40 text-rose-400 font-mono text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Game Progression
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          onResetAllData();
                          setConfirmReset(false);
                          onClose();
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-lg"
                      >
                        Confirm Wipe
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmReset(false)}
                        className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
