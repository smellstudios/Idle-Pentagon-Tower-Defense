/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Upgrade, GameState } from '../types';
import { 
  Swords, 
  Heart, 
  Shield, 
  ToolCase, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Minus, 
  Plus, 
  Sparkles
} from 'lucide-react';
import { UpgradeTile } from './UpgradeTile';
import { soundEngine } from '../game/sound';
import { calculatePlayerCombatStats } from '../game/constants';
import { formatCurrency } from '../utils/format';

interface Props {
  upgrades: Upgrade[];
  gameState: GameState;
  onBuy: (id: string) => void;
  onStateUpdate: (partial: Partial<GameState>) => void;
  calculateUpgradeCost: (upgrade: Upgrade, level: number, amount: number) => number;
  isOpen?: boolean;
  onToggleOpen?: (explicitVal?: boolean) => void;
}

const CARDS_PER_PAGE = 3;

export const UpgradePanel: React.FC<Props> = ({ 
  upgrades, 
  gameState, 
  onBuy, 
  onStateUpdate,
  calculateUpgradeCost,
  isOpen: externalIsOpen,
  onToggleOpen
}) => {
  // Panel expansion state - defaults to true so upgrades are always open per reference design
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pixel_pentagons_upgrades_open');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return true; // Always open by default!
  });

  const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  // Default to Defense group as showcased in reference design
  const [activeGroup, setActiveGroup] = useState<'Damage' | 'Health' | 'Utility'>('Health');
  const [pageIndex, setPageIndex] = useState<number>(0);

  // Toggle open / closed helper with persistence
  const toggleOpen = useCallback((explicitVal?: boolean) => {
    const next = explicitVal !== undefined ? explicitVal : !isOpen;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pixel_pentagons_upgrades_open', next.toString());
    }
    if (onToggleOpen) {
      onToggleOpen(explicitVal);
    } else {
      setInternalIsOpen(next);
    }
    soundEngine.playTabSwitch();
  }, [isOpen, onToggleOpen]);

  // Keyboard shortcut: Press 'U' to toggle
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'u' || e.key === 'U') {
        e.preventDefault();
        toggleOpen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleOpen]);

  // Handle switching tabs or toggling panel
  const handleTabClick = (group: 'Damage' | 'Health' | 'Utility') => {
    if (!isOpen) {
      // If panel is closed, clicking ANY tab opens it with that group active
      setActiveGroup(group);
      setPageIndex(0);
      toggleOpen(true);
    } else {
      if (activeGroup === group) {
        // Pressing the currently active tab toggles the upgrade panel closed
        toggleOpen(false);
      } else {
        // Switching to another tab while open
        setActiveGroup(group);
        setPageIndex(0);
        soundEngine.playTabSwitch();
      }
    }
  };

  // Filter upgrades for current group
  const filteredUpgrades = useMemo(() => {
    return upgrades.filter(u => u.group === activeGroup);
  }, [upgrades, activeGroup]);

  const unlockKey = `unlock_${activeGroup.toLowerCase()}`;
  const currentUnlockLevel = gameState.workshopUpgrades[unlockKey] || 0;
  const visibleUpgrades = useMemo(() => {
    return filteredUpgrades.filter(u => (u.unlockTier || 0) <= currentUnlockLevel);
  }, [filteredUpgrades, currentUnlockLevel]);

  const hasMoreTiers = useMemo(() => {
    return filteredUpgrades.some(u => (u.unlockTier || 0) > currentUnlockLevel);
  }, [filteredUpgrades, currentUnlockLevel]);

  const nextUnlockCost = currentUnlockLevel === 0 ? 50 : currentUnlockLevel === 1 ? 250 : 1000;

  // Build full list of cards for this category: visible upgrades + Tier Unlock Card (if any)
  type CardItem = { type: 'upgrade'; upgrade: Upgrade } | { type: 'unlock' };
  const allCards = useMemo<CardItem[]>(() => {
    const items: CardItem[] = visibleUpgrades.map(u => ({ type: 'upgrade', upgrade: u }));
    if (hasMoreTiers) {
      items.push({ type: 'unlock' });
    }
    return items;
  }, [visibleUpgrades, hasMoreTiers]);

  const totalPages = Math.max(1, Math.ceil(allCards.length / CARDS_PER_PAGE));
  const currentPageSafe = Math.min(pageIndex, totalPages - 1);
  const displayedCards = allCards.slice(currentPageSafe * CARDS_PER_PAGE, (currentPageSafe + 1) * CARDS_PER_PAGE);

  const handleUnlockTier = () => {
    if (gameState.cosmicShards >= nextUnlockCost) {
      soundEngine.playUpgradeSuccess();
      onStateUpdate({
        cosmicShards: gameState.cosmicShards - nextUnlockCost,
        workshopUpgrades: {
          ...gameState.workshopUpgrades,
          [unlockKey]: currentUnlockLevel + 1
        }
      });
    }
  };

  // Combat Stats for live vitals bar (Health, Damage)
  const combatStats = useMemo(() => {
    return calculatePlayerCombatStats(upgrades || [], gameState || {});
  }, [gameState, upgrades]);

  const maxHp = Math.max(1, combatStats.effectiveMaxHp);
  const currentHp = gameState.isDead ? 0 : Math.max(0, Math.min(maxHp, gameState.playerHp ?? maxHp));
  const hpRatio = Math.max(0, Math.min(1, currentHp / maxHp));


  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 flex flex-col items-center pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      <div className="w-full max-w-md sm:max-w-lg relative flex flex-col pointer-events-auto bg-[#03070f]/95 backdrop-blur-xl border-t border-cyan-500/30 shadow-[0_-8px_30px_rgba(0,0,0,0.85)] rounded-t-xl transition-all duration-200">
        
        {/* Streamlined Utility & Vitals Header Bar */}
        <div className="flex items-center justify-between px-2.5 py-1.5 border-b border-cyan-500/20 bg-black/50 select-none gap-2">
          {/* Left: Compact Health & Damage Indicator */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <div className="flex flex-col flex-1 min-w-0">
              <div className="flex items-center justify-between text-[9.5px] font-mono leading-none mb-1">
                <span className="flex items-center gap-1 text-emerald-400 font-bold whitespace-nowrap">
                  <Heart className="w-2.5 h-2.5 fill-emerald-400 text-emerald-400 shrink-0" />
                  <span>{formatCurrency(currentHp)}/{formatCurrency(maxHp)}</span>
                </span>
                <span className="text-cyan-300/80 text-[8.5px] font-mono shrink-0 pl-1 whitespace-nowrap">
                  DMG {formatCurrency(combatStats.damage)}
                </span>
              </div>

              {/* Slim Health Bar */}
              <div className="w-full h-1 bg-zinc-950 rounded-full border border-emerald-500/30 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-200"
                  style={{ width: `${Math.round(hpRatio * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Center: Sleek Open/Close Toggle */}
          <button
            type="button"
            onClick={() => toggleOpen()}
            title={isOpen ? "Minimize Upgrades (U)" : "Expand Upgrades (U)"}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-[9px] font-black uppercase tracking-wider border transition-all cursor-pointer shrink-0 active:scale-95 ${
              isOpen
                ? 'bg-cyan-950/40 border-cyan-500/30 text-cyan-300 hover:text-white hover:bg-cyan-900/40'
                : 'bg-cyan-500 text-black border-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)] font-black'
            }`}
          >
            {isOpen ? (
              <>
                <ChevronDown className="w-3 h-3 text-cyan-400" />
                <span>Hide</span>
              </>
            ) : (
              <>
                <ChevronUp className="w-3 h-3 text-black" />
                <span>Upgrades</span>
              </>
            )}
          </button>

          {/* Right Controls: Bulk Buy Mode */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Bulk Buy Toggle: 1x / 10x / Max */}
            <div className="flex bg-zinc-900/90 p-0.5 rounded-md border border-white/10">
              {(['x1', 'x10', 'xMax'] as const).map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => {
                    soundEngine.playTabSwitch();
                    onStateUpdate({ bulkBuyMode: mode });
                  }}
                  className={`px-1.5 py-0.5 rounded text-[8px] font-mono font-black transition-all cursor-pointer ${
                    gameState.bulkBuyMode === mode 
                      ? 'bg-cyan-400 text-black shadow-xs font-bold' 
                      : 'text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {mode === 'xMax' ? 'MAX' : mode}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Upgrade Cards Area: Exactly THREE clean cards side-by-side */}
        {isOpen && (
          <div className="w-full flex flex-col bg-black/40 relative">
            {/* Cards Grid: Exactly 3 equal columns */}
            <div className="grid grid-cols-3 gap-1.5 px-2 py-1.5 w-full">
              {displayedCards.map((item, idx) => {
                if (item.type === 'upgrade') {
                  return (
                    <UpgradeTile 
                      key={item.upgrade.id}
                      upgrade={item.upgrade}
                      gameState={gameState}
                      onBuy={onBuy}
                      calculateCost={calculateUpgradeCost}
                    />
                  );
                }

                // Next Tech Locked Card (Compact & Optimized)
                return (
                  <div 
                    key="next-tier-unlock"
                    className="w-full flex flex-col justify-between p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-purple-500/50 bg-[#0e041b]/90 backdrop-blur-md select-none"
                  >
                    {/* 1. Header: Icon & Locked Tag */}
                    <div className="flex items-center justify-between w-full leading-none">
                      <div className="w-4 h-4 rounded flex items-center justify-center border shrink-0 bg-purple-950/60 border-purple-500/40">
                        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                      </div>
                      <span className="text-[7.5px] sm:text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/20">
                        LOCKED
                      </span>
                    </div>

                    {/* 2. Upgrade Title: Full Width */}
                    <div className="w-full min-h-[1.65rem] sm:min-h-[1.85rem] flex items-center my-0.5 sm:my-1">
                      <span className="text-[9.5px] sm:text-[10.5px] font-mono font-black text-purple-200 uppercase tracking-tight leading-tight">
                        TIER {currentUnlockLevel + 1} TECH
                      </span>
                    </div>

                    {/* 3. Middle: Requirement Cost */}
                    <div className="flex items-center justify-between gap-1 my-0.5 leading-none">
                      <span className="text-[9px] font-mono font-bold text-purple-300/70 whitespace-nowrap">
                        Required
                      </span>
                      <div className="flex items-center gap-0.5 text-purple-300 shrink-0">
                        <Sparkles className="w-2.5 h-2.5 text-purple-400" />
                        <span className="text-[9.5px] font-mono font-black">✦{nextUnlockCost}</span>
                      </div>
                    </div>

                    {/* 4. Bottom: UNLOCK button */}
                    <div className="w-full mt-auto pt-1">
                      <button
                        type="button"
                        onClick={handleUnlockTier}
                        disabled={gameState.cosmicShards < nextUnlockCost}
                        className={`w-full h-6 sm:h-7 rounded-md font-mono font-black text-[10px] sm:text-[10.5px] flex items-center justify-center transition-all ${
                          gameState.cosmicShards >= nextUnlockCost
                            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-[0_0_8px_rgba(168,85,247,0.5)] cursor-pointer active:scale-95'
                            : 'bg-zinc-900/90 text-purple-400/40 border border-purple-500/20 cursor-not-allowed'
                        }`}
                      >
                        UNLOCK
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination Controls if more than 3 cards exist (e.g. at higher tiers) */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 pb-1 select-none">
                <button
                  type="button"
                  onClick={() => setPageIndex(p => Math.max(0, p - 1))}
                  disabled={currentPageSafe === 0}
                  className="p-0.5 rounded bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronLeft className="w-2.5 h-2.5" />
                </button>
                <span className="text-[8.5px] font-mono text-zinc-400">
                  {currentPageSafe + 1} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPageIndex(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPageSafe === totalPages - 1}
                  className="p-0.5 rounded bg-zinc-900/80 border border-white/10 text-zinc-400 hover:text-white disabled:opacity-30 cursor-pointer"
                >
                  <ChevronRight className="w-2.5 h-2.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bottom Navigation: Compact 3-tab bar with toggle chevrons */}
        <div className="flex w-full bg-[#02050b] p-1 gap-1 select-none border-t border-white/5">
          {/* Tab 1: Attack */}
          <button
            type="button"
            onClick={() => handleTabClick('Damage')}
            title={
              !isOpen 
                ? "Open Attack Upgrades" 
                : activeGroup === 'Damage' 
                ? "Close Upgrades Panel" 
                : "Switch to Attack Upgrades"
            }
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg font-mono font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer active:scale-98 ${
              activeGroup === 'Damage'
                ? 'bg-rose-600 border border-rose-400 text-white shadow-[0_0_12px_rgba(244,63,94,0.35)]'
                : 'bg-zinc-950/80 border border-rose-950/40 text-rose-400/70 hover:text-rose-300 hover:border-rose-800/50'
            }`}
          >
            <Swords className="w-3 h-3 shrink-0" />
            <span>Attack</span>
            {activeGroup === 'Damage' && (
              isOpen ? <ChevronDown className="w-2.5 h-2.5 opacity-80 shrink-0" /> : <ChevronUp className="w-2.5 h-2.5 opacity-80 shrink-0" />
            )}
          </button>

          {/* Tab 2: Defense */}
          <button
            type="button"
            onClick={() => handleTabClick('Health')}
            title={
              !isOpen 
                ? "Open Defense Upgrades" 
                : activeGroup === 'Health' 
                ? "Close Upgrades Panel" 
                : "Switch to Defense Upgrades"
            }
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg font-mono font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer active:scale-98 ${
              activeGroup === 'Health'
                ? 'bg-emerald-500 border border-emerald-300 text-black shadow-[0_0_12px_rgba(16,185,129,0.4)]'
                : 'bg-zinc-950/80 border border-emerald-950/40 text-emerald-400/70 hover:text-emerald-300 hover:border-emerald-800/50'
            }`}
          >
            <Shield className="w-3 h-3 shrink-0" />
            <span>Defense</span>
            {activeGroup === 'Health' && (
              isOpen ? <ChevronDown className="w-2.5 h-2.5 opacity-80 shrink-0" /> : <ChevronUp className="w-2.5 h-2.5 opacity-80 shrink-0" />
            )}
          </button>

          {/* Tab 3: Utility */}
          <button
            type="button"
            onClick={() => handleTabClick('Utility')}
            title={
              !isOpen 
                ? "Open Utility Upgrades" 
                : activeGroup === 'Utility' 
                ? "Close Upgrades Panel" 
                : "Switch to Utility Upgrades"
            }
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-1.5 rounded-lg font-mono font-black text-[11px] uppercase tracking-wider transition-all cursor-pointer active:scale-98 ${
              activeGroup === 'Utility'
                ? 'bg-cyan-500 border border-cyan-300 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]'
                : 'bg-zinc-950/80 border border-cyan-950/40 text-cyan-400/70 hover:text-cyan-300 hover:border-cyan-800/50'
            }`}
          >
            <ToolCase className="w-3 h-3 shrink-0" />
            <span>Utility</span>
            {activeGroup === 'Utility' && (
              isOpen ? <ChevronDown className="w-2.5 h-2.5 opacity-80 shrink-0" /> : <ChevronUp className="w-2.5 h-2.5 opacity-80 shrink-0" />
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

