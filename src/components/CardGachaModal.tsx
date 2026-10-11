/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CardDef } from '../types';
import { CARDS_CONFIG } from '../game/constants';
import { useGameStore } from '../store/gameStore';
import { soundEngine } from '../game/sound';
import { CardIcon, getRarityColor, getEquippedCardStyle } from './Icons';
import { 
  Sparkles, 
  Check, 
  Flame, 
  Zap, 
  Shield, 
  Award, 
  RefreshCw,
  Scale,
  ShieldAlert,
  Hexagon,
  FastForward,
  Coins,
  Radio,
  HeartPulse,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  pulledCardDef: CardDef | null;
  pulledLevel: number;
  pulledDupes: number;
  reqDupes: number;
  pulledCards?: { cardDef: CardDef; level: number; duplicates: number; reqDupes: number }[];
  onClose: () => void;
  onEquipNow?: (cardId: string) => void;
  isEquipped?: boolean;
}

export const CardGachaModal: React.FC<Props> = ({
  isOpen,
  pulledCardDef,
  pulledLevel,
  pulledDupes,
  reqDupes,
  pulledCards,
  onClose,
  onEquipNow,
  isEquipped = false,
}) => {
  const [isSpinning, setIsSpinning] = useState(true);
  const [beltItems, setBeltItems] = useState<CardDef[]>([]);
  const [scrollX, setScrollX] = useState(116);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; size: number }[]>([]);
  const [showRarityEffect, setShowRarityEffect] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number>(0);
  const [revealedCount, setRevealedCount] = useState<number>(0);
  const [isSkipped, setIsSkipped] = useState<boolean>(false);

  const stripRef = useRef<HTMLDivElement>(null);
  const skipSpinRef = useRef<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;
    setIsSkipped(false);
    setRevealedCount(0);
    if (pulledCards && pulledCards.length > 0) {
      const bestIdx = pulledCards.findIndex(c => c.cardDef.id === pulledCardDef?.id);
      setSelectedCardIndex(bestIdx >= 0 ? bestIdx : 0);
    } else {
      setSelectedCardIndex(0);
    }
  }, [isOpen, pulledCards, pulledCardDef]);

  // Layout parameters for scroller
  const itemWidth = 80;
  const gap = 8;
  const totalItemWidth = itemWidth + gap; // 88px
  const viewportWidth = 320;
  const pointerPos = viewportWidth / 2; // 160px

  // Sound triggers
  const playTickSound = (velocityRatio: number) => {
    try {
      const ctx = soundEngine.ensureContext();
      if (!ctx || soundEngine.getMuted()) return;
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Descending pitch: starts high and goes down proportionally to progress
      const pitch = 90 + 360 * Math.max(0.05, Math.min(1, velocityRatio));
      osc.frequency.setValueAtTime(pitch, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.045);

      gain.gain.setValueAtTime(0.06, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {
      // Browser audio guard
    }
  };

  const playImpactSound = () => {
    try {
      const ctx = soundEngine.ensureContext();
      if (!ctx || soundEngine.getMuted()) return;
      const t = ctx.currentTime;
      
      // Heavy mechanical impact popup sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(280, t);
      osc.frequency.exponentialRampToValueAtTime(60, t + 0.18);
      
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.19);
      
      // Upgrade chime fanfare
      soundEngine.playUpgradeSuccess(1.15);
    } catch (e) {
      // Browser audio guard
    }
  };

  useEffect(() => {
    if (!isOpen || !pulledCardDef) return;

    if (pulledCards && pulledCards.length > 1) {
      // 🌟 MULTI-PACK OPTIMIZED SOUND & TRANSITION ENGINE
      setIsSpinning(true);
      setRevealedCount(0);
      setParticles([]);
      skipSpinRef.current = false;

      const totalCards = pulledCards.length;
      const intervalTime = 130; // even snappier reveal (1.3s total)
      let sequenceTimer: NodeJS.Timeout;

      // Schedule high-fidelity staggered sound triggers on the GPU/Audio worker threads
      try {
        const ctx = soundEngine.ensureContext();
        if (ctx && !soundEngine.getMuted()) {
          const startTime = ctx.currentTime + 0.25; // 250ms delay
          for (let i = 0; i < totalCards; i++) {
            const delayInSec = (i * intervalTime) / 1000;
            const targetTime = startTime + delayInSec;

            // Generate two synchronized layered chimes for an incredibly rich premium arcade vibe
            const oscPrimary = ctx.createOscillator();
            const oscSub = ctx.createOscillator();
            const gainNode = ctx.createGain();

            oscPrimary.type = 'sine';
            oscPrimary.frequency.setValueAtTime(280 + (i + 1) * 32, targetTime);

            oscSub.type = 'triangle';
            oscSub.frequency.setValueAtTime(140 + (i + 1) * 16, targetTime);

            gainNode.gain.setValueAtTime(0.0, targetTime);
            gainNode.gain.linearRampToValueAtTime(0.035, targetTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, targetTime + 0.14);

            oscPrimary.connect(gainNode);
            oscSub.connect(gainNode);
            gainNode.connect(ctx.destination);

            oscPrimary.start(targetTime);
            oscPrimary.stop(targetTime + 0.15);
            oscSub.start(targetTime);
            oscSub.stop(targetTime + 0.15);
          }
        }
      } catch (e) {}

      // A single robust, low-latency callback to conclude the animations
      sequenceTimer = setTimeout(() => {
        if (!skipSpinRef.current) {
          setRevealedCount(totalCards);
          setIsSpinning(false);
          playImpactSound();
        }
      }, 250 + totalCards * intervalTime + 300);

      return () => {
        clearTimeout(sequenceTimer);
      };
    } else {
      // 🌟 CLASSIC SINGLE REEL CONVEYOR TIMING
      const newBelt: CardDef[] = [];
      const allCards = CARDS_CONFIG;
      const highRarityCards = allCards.filter(c => c.rarity === 'epic' || c.rarity === 'rare');

      for (let i = 0; i < 35; i++) {
        if (i === 30) {
          // The definitive reward card
          newBelt.push(pulledCardDef);
        } else if (i >= 26 && i <= 29) {
          // Near-miss logic: Place high rarity items right before the reward
          const randHigh = highRarityCards[Math.floor(Math.random() * highRarityCards.length)];
          newBelt.push(randHigh);
        } else {
          // High density random items
          const randCard = allCards[Math.floor(Math.random() * allCards.length)];
          newBelt.push(randCard);
        }
      }

      setBeltItems(newBelt);
      setIsSpinning(true);
      setShowRarityEffect(false);
      setParticles([]);
      skipSpinRef.current = false;

      // Setup smooth physics loop
      const startX = pointerPos - (itemWidth / 2); // Center first item under pointer
      const targetX = pointerPos - (30 * totalItemWidth + itemWidth / 2); // Center 30th item (reward)

      setScrollX(startX);
      if (stripRef.current) {
        stripRef.current.style.transform = `translate3d(${startX}px, 0, 0)`;
      }

      const duration = 2200; // Snappy 2.2 seconds instead of 4.2
      const startTime = performance.now();
      const lastPlayedIndex = { current: -1 };

      let animationId: number;

      const tick = (now: number) => {
        const isSkipped = skipSpinRef.current;
        const elapsed = isSkipped ? duration : now - startTime;
        const progress = Math.min(1, elapsed / duration);

        // Decelerate with smooth ease-out quintic curve
        const easeOutQuint = 1 - Math.pow(1 - progress, 5);
        let currentX = startX + (targetX - startX) * easeOutQuint;

        // Subtle final jitter (tactile spring/overshoot bounce at stop index)
        if (progress > 0.90 && !isSkipped) {
          const sub = (progress - 0.90) / 0.10; // 0 to 1
          const spring = Math.sin(sub * Math.PI * 3.0) * 11 * Math.exp(-sub * 3.5);
          currentX += spring;
        }

        // ⚡ OPTIMIZATION: Bypasses state re-renders by mutating style directly on the ref
        if (stripRef.current) {
          stripRef.current.style.transform = `translate3d(${currentX}px, 0, 0)`;
        }

        // Play ticking audio on card crossing boundaries
        const centerIndex = Math.floor((pointerPos - currentX) / totalItemWidth);
        if (centerIndex !== lastPlayedIndex.current && centerIndex >= 0 && centerIndex < 35 && !isSkipped) {
          lastPlayedIndex.current = centerIndex;
          const velocityRatio = 1 - progress;
          playTickSound(velocityRatio);
        }

        if (progress < 1) {
          animationId = requestAnimationFrame(tick);
        } else {
          // Precision alignment on exact finish
          setScrollX(targetX);
          if (stripRef.current) {
            stripRef.current.style.transform = `translate3d(${targetX}px, 0, 0)`;
          }
          setIsSpinning(false);
          setShowRarityEffect(true);
          playImpactSound();

          // Particle explosion for rare/epic pull success
          if (pulledCardDef.rarity === 'epic' || pulledCardDef.rarity === 'rare') {
            const colors = pulledCardDef.rarity === 'epic'
              ? ['#c084fc', '#a855f7', '#d8b4fe', '#ec4899', '#f472b6', '#3b82f6'] // Epic purples, pinks & blues
              : ['#4ade80', '#22c55e', '#a7f3d0', '#6ee7b7', '#fbbf24']; // Rare greens & golds
            
            const particleCount = pulledCardDef.rarity === 'epic' ? 36 : 24;
            
            const newParticles = Array.from({ length: particleCount }).map((_, idx) => {
              const angle = Math.random() * Math.PI * 2;
              const distance = 45 + Math.random() * 95;
              return {
                id: idx,
                x: Math.cos(angle) * distance,
                y: Math.sin(angle) * distance,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 3 + Math.random() * 6,
              };
            });
            setParticles(newParticles);
          }
        }
      };

      animationId = requestAnimationFrame(tick);

      return () => {
        cancelAnimationFrame(animationId);
      };
    }
  }, [isOpen, pulledCardDef, pulledCards]);

  if (!isOpen || !pulledCardDef) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/92 backdrop-blur-lg overflow-hidden select-none">
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.85, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className={`relative w-full min-w-0 max-w-[348px] rounded-3xl p-4.5 border transition-all duration-500 ease-out bg-zinc-950 shadow-[0_0_60px_rgba(168,85,247,0.35)] flex flex-col items-center text-center max-h-[96vh] overflow-hidden ${
            pulledCards && pulledCards.length > 1 && !isSpinning 
              ? 'sm:max-w-2xl border-purple-500/30' 
              : 'sm:max-w-sm border-purple-500/50'
          }`}
        >
          {/* Dynamic keyframes to handle 3D card flips with 0% main-thread CPU overhead */}
          <style dangerouslySetInnerHTML={{ __html: `
            @keyframes cardPackReveal {
              0% { transform: rotateY(0deg) scale(1); }
              50% { transform: rotateY(90deg) scale(1.08); }
              100% { transform: rotateY(180deg) scale(1); }
            }
            .animate-card-gpu-flip {
              animation: cardPackReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
              backface-visibility: hidden;
            }
          `}} />

          {/* Background Ambient Lights */}
          <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-purple-600/25 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 rounded-full bg-sky-500/25 blur-3xl pointer-events-none" />

          {/* Sparkly Gacha Header */}
          <div className="px-3.5 py-1.5 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 font-mono text-[10px] font-black uppercase tracking-widest mb-5 flex items-center gap-1.5 shadow-md z-10">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>
              {pulledCards && pulledCards.length > 1 
                ? `Card Booster Pack Opening (x${pulledCards.length})` 
                : 'Card Booster Pack Opening'}
            </span>
          </div>

          {/* Only show spinner while spinning, or if doing a single draw */}
          {isSpinning || !(pulledCards && pulledCards.length > 1) ? (
            pulledCards && pulledCards.length > 1 ? (
              // Multi-pack gacha sequential 3D flips
              <div className="w-full max-w-lg mx-auto py-3 px-1 z-10 flex flex-col items-center">
                <div className="grid grid-cols-5 gap-2.5 w-full max-h-[220px] overflow-visible">
                  {pulledCards.map((item, idx) => {
                    const rCol = getRarityColor(item.cardDef.rarity);
                    return (
                      <div
                        key={`opening-${item.cardDef.id}-${idx}`}
                        className="relative h-[85px] w-full [perspective:600px] select-none"
                      >
                        <div
                          className="relative w-full h-full [transform-style:preserve-3d] cursor-pointer"
                          style={{
                            transform: isSkipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                            animation: isSkipped ? 'none' : 'cardPackReveal 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                            animationDelay: isSkipped ? '0ms' : `${idx * 130 + 250}ms`
                          }}
                          onClick={() => {
                            if (isSpinning) {
                              skipSpinRef.current = true;
                              setIsSkipped(true);
                              setIsSpinning(false);
                              playImpactSound();
                            }
                          }}
                        >
                          {/* CARD BACK (Mystery pack) */}
                          <div className="absolute inset-0 rounded-xl border border-purple-500/35 bg-gradient-to-b from-purple-950/90 to-zinc-950 flex flex-col items-center justify-center p-1 [backface-visibility:hidden] shadow-[0_0_12px_rgba(168,85,247,0.18)] overflow-hidden">
                            <div className="w-5.5 h-5.5 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center animate-pulse">
                              <Sparkles className="w-3 h-3 text-purple-400 animate-spin" style={{ animationDuration: '6s' }} />
                            </div>
                            <span className="text-[6.5px] font-mono text-purple-400 font-black tracking-wider mt-1.5 uppercase">
                              PK {idx + 1}
                            </span>
                          </div>

                          {/* CARD FRONT (Revealed Card) */}
                          <div 
                            className={`absolute inset-0 rounded-xl border bg-gradient-to-b ${rCol.from} via-zinc-950 ${rCol.to} p-1 flex flex-col items-center justify-between text-center relative overflow-hidden [backface-visibility:hidden] [transform:rotateY(180deg)] ${rCol.border}`}
                          >
                            <div className={`absolute top-1 right-1 w-1.5 h-1.5 rounded-full ${
                              item.cardDef.rarity === 'legendary' ? 'bg-amber-400' :
                              item.cardDef.rarity === 'epic' ? 'bg-purple-400' :
                              item.cardDef.rarity === 'rare' ? 'bg-emerald-400' :
                              item.cardDef.rarity === 'uncommon' ? 'bg-sky-400' : 'bg-zinc-500'
                            }`} />

                            <div className="w-6 h-6 rounded bg-zinc-950/60 flex items-center justify-center border border-white/5 mt-0.5">
                              <CardIcon icon={item.cardDef.icon} className="w-3.5 h-3.5" />
                            </div>

                            {/* Compact Card Title */}
                            <span className="text-[7.5px] font-mono font-black tracking-tight leading-tight uppercase w-full break-words px-0.5 text-zinc-100 mb-0.5">
                              {item.cardDef.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {isSpinning && (
                  <button
                    onClick={() => {
                      skipSpinRef.current = true;
                      setIsSkipped(true);
                      setIsSpinning(false);
                      playImpactSound();
                    }}
                    className="px-4 py-1.5 rounded-full bg-zinc-900 hover:bg-zinc-855 border border-purple-500/25 text-[8.5px] font-mono font-bold text-purple-300 uppercase tracking-widest cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 mt-4.5 z-10"
                  >
                    <FastForward className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span>SKIP REVEALS</span>
                  </button>
                )}
              </div>
            ) : (
              // Classic single reel conveyor belt
              <>
                {/* Conveyor Belt RNG Scroller Box */}
                <div 
                  onClick={() => {
                    if (isSpinning) {
                      skipSpinRef.current = true;
                    }
                  }}
                  className={`relative w-[320px] h-32 rounded-2xl bg-zinc-950 border border-white/10 flex items-center overflow-hidden shadow-inner my-2 select-none z-10 transition-all ${
                    isSpinning 
                      ? 'cursor-pointer hover:border-purple-500/50 active:scale-[0.99] border-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]' 
                      : ''
                  }`}
                  title={isSpinning ? "Tap to instantly reveal card" : undefined}
                >
                  
                  {/* Moving Item Strip */}
                  <div 
                    ref={stripRef}
                    className="flex gap-2 items-center h-full pl-0 will-change-transform"
                    style={{ transform: `translate3d(${scrollX}px, 0, 0)` }}
                  >
                    {beltItems.map((item, idx) => {
                      return (
                        <div
                          key={`${item.id}-${idx}`}
                          className={`flex-shrink-0 w-20 h-[104px] rounded-xl border flex flex-col items-center justify-center p-1.5 text-center relative overflow-hidden bg-gradient-to-b ${getRarityColor(item.rarity).from} to-zinc-950/90 ${
                            getRarityColor(item.rarity).border
                          } ${getRarityColor(item.rarity).text}`}
                        >
                          {/* Item Rarity Badge Accent */}
                          <div className={`absolute top-1 right-1 w-2 h-2 rounded-full border border-white/20 ${
                            item.rarity === 'legendary'
                              ? 'bg-amber-400 shadow-[0_0_8px_#fbbf24]'
                              : item.rarity === 'epic'
                              ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]'
                              : item.rarity === 'rare'
                              ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                              : item.rarity === 'uncommon'
                              ? 'bg-sky-400 shadow-[0_0_8px_#38bdf8]'
                              : 'bg-zinc-600'
                          }`} />

                          {/* Icon Container */}
                          <div className="w-9 h-9 rounded-lg bg-zinc-950/60 flex items-center justify-center mb-1 border border-white/5">
                            <CardIcon icon={item.icon} className="w-5 h-5" />
                          </div>

                          {/* Compact Card Title */}
                          <span className="text-[9px] font-mono font-black tracking-tight leading-tight uppercase w-full break-words px-0.5">
                            {item.name}
                          </span>

                          {/* Small rarity subtitle */}
                          <span className="text-[7px] font-mono opacity-60 uppercase mt-0.5 tracking-wider">
                            {item.rarity}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Static Pointer Markers (Pointing exactly at the center point) */}
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 flex flex-col justify-between items-center pointer-events-none z-10">
                    <ChevronDown className={`w-5 h-5 text-purple-400 drop-shadow-[0_0_5px_#a855f7] ${!isSpinning ? 'animate-bounce' : 'animate-pulse'}`} />
                    <ChevronUp className={`w-5 h-5 text-purple-400 drop-shadow-[0_0_5px_#a855f7] ${!isSpinning ? 'animate-bounce' : 'animate-pulse'}`} />
                  </div>

                  {/* Highlight Frame centered exactly under the pointer */}
                  <div className="absolute left-[120px] top-[12px] w-20 h-[104px] rounded-xl border-2 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.25)] bg-purple-500/5 pointer-events-none z-10" />
                </div>

                {isSpinning && (
                  <div className="text-[9px] font-mono text-purple-400/80 uppercase tracking-widest mt-1.5 mb-1.5 animate-pulse flex items-center justify-center gap-1 z-10">
                    <span>⚡ TAP TO REVEAL INSTANTLY</span>
                  </div>
                )}

                {/* Visual Burst Effects and Particle Explosion on Stop */}
                <div className="relative w-full flex justify-center items-center h-2 overflow-visible z-10">
                  {showRarityEffect && pulledCardDef.rarity === 'epic' && (
                    <motion.div
                      initial={{ scale: 0.5, opacity: 1 }}
                      animate={{ scale: 2.2, opacity: 0 }}
                      transition={{ duration: 1.0, ease: 'easeOut' }}
                      className="absolute w-24 h-24 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-sky-500 blur-xl pointer-events-none z-0"
                    />
                  )}

                  {/* High fidelity particle elements */}
                  {particles.map((p) => (
                    <motion.div
                      key={p.id}
                      initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                      animate={{ x: p.x, y: p.y, scale: 0.1, opacity: 0 }}
                      transition={{ duration: 1.4, ease: 'easeOut' }}
                      className="absolute rounded-full pointer-events-none z-20"
                      style={{
                        backgroundColor: p.color,
                        width: p.size,
                        height: p.size,
                        left: '50%',
                        top: '50%',
                        transform: 'translate(-50%, -50%)',
                      }}
                    />
                  ))}
                </div>
              </>
            )
          ) : null}

          {/* Results Details Block */}
          {!isSpinning ? (
            pulledCards && pulledCards.length > 1 ? (
              // Multi pull results dashboard
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="w-full min-w-0 max-w-full space-y-3 z-10 flex flex-col overflow-hidden"
              >
                {/* Grid Header */}
                <div className="flex flex-col items-center justify-center">
                  <h3 className="text-sm font-mono font-black text-white uppercase tracking-wider flex items-center gap-1.5 leading-none">
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                    BOOSTER REVEAL (x{pulledCards.length})
                  </h3>
                  <p className="text-[9px] text-zinc-400 font-mono mt-1">
                    Tap a card to inspect stats or equip
                  </p>
                </div>

                {/* Desktop View: Grid of 10 Cards */}
                <div className="hidden sm:grid grid-cols-5 gap-2 max-h-[140px] overflow-y-auto p-1 text-left">
                  {pulledCards.map((item, idx) => {
                    const isSelected = selectedCardIndex === idx;
                    const rCol = getRarityColor(item.cardDef.rarity);
                    const isEquippedInDock = useGameStore.getState().equippedCardIds.includes(item.cardDef.id);

                    return (
                      <button
                        key={`desktop-${item.cardDef.id}-${idx}`}
                        onClick={() => {
                          setSelectedCardIndex(idx);
                          try {
                            const ctx = soundEngine.ensureContext();
                            if (ctx && !soundEngine.getMuted()) {
                              const osc = ctx.createOscillator();
                              const gain = ctx.createGain();
                              osc.type = 'sine';
                              osc.frequency.setValueAtTime(320 + idx * 25, ctx.currentTime);
                              gain.gain.setValueAtTime(0.04, ctx.currentTime);
                              gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                              osc.connect(gain);
                              gain.connect(ctx.destination);
                              osc.start();
                              osc.stop(ctx.currentTime + 0.11);
                            }
                          } catch (err) {}
                        }}
                        className={`text-center rounded-xl border bg-gradient-to-b ${rCol.from} via-zinc-950/95 ${rCol.to} p-1.5 flex flex-col items-center justify-between relative overflow-hidden transition-all duration-300 cursor-pointer h-[105px] ${
                          isSelected 
                            ? `${rCol.border} ring-2 ring-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.3)] scale-[1.01]` 
                            : 'border-zinc-850 hover:border-zinc-700 opacity-80 hover:opacity-100'
                        }`}
                      >
                        {/* Equipped Label */}
                        {isEquippedInDock && (
                          <div className={`absolute top-1 left-1.5 ${rCol.badge} text-[5px] font-mono font-black px-1 py-0.2 rounded uppercase tracking-wider scale-85 origin-top-left ring-1 ring-white/30`}>
                            EQ
                          </div>
                        )}

                        {/* Rarity Circle */}
                        <div className={`absolute top-1.5 right-1.5 w-1 h-1 rounded-full ${
                          item.cardDef.rarity === 'legendary' ? 'bg-amber-400' :
                          item.cardDef.rarity === 'epic' ? 'bg-purple-400' :
                          item.cardDef.rarity === 'rare' ? 'bg-emerald-400' :
                          item.cardDef.rarity === 'uncommon' ? 'bg-sky-400' : 'bg-zinc-600'
                        }`} />

                        {/* Icon Container */}
                        <div className="w-7 h-7 rounded bg-zinc-950/60 flex items-center justify-center border border-white/5 mt-1">
                          <CardIcon icon={item.cardDef.icon} className="w-3.5 h-3.5" />
                        </div>

                        {/* Card Title */}
                        <span className="text-[7.5px] font-mono font-black tracking-tight leading-tight uppercase w-full break-words px-0.5 text-zinc-100">
                          {item.cardDef.name}
                        </span>

                        {/* Progress */}
                        <div className="w-full mt-0.5">
                          <div className="flex justify-between text-[6px] font-mono font-bold text-zinc-400 leading-none mb-0.5">
                            <span>LV.{item.level}</span>
                            <span>{item.duplicates}/{item.reqDupes}</span>
                          </div>
                          <div className="w-full h-0.5 rounded-full bg-zinc-950 border border-white/5 overflow-hidden">
                            <div 
                              className={`h-full ${
                                item.duplicates >= item.reqDupes ? 'bg-amber-400' : 'bg-purple-500'
                              }`}
                              style={{ width: `${Math.min(100, (item.duplicates / item.reqDupes) * 100)}%` }}
                            />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Mobile View: Horizontal Swiper Track (Wrapped in layout-isolating block to fix Flexbox centering stretch bug) */}
                <div className="w-full max-w-full overflow-hidden px-1 sm:hidden">
                  <div className="flex gap-2.5 overflow-x-auto pb-3 pt-1 px-1.5 snap-x snap-mandatory scrollbar-none max-w-full">
                    {pulledCards.map((item, idx) => {
                      const isSelected = selectedCardIndex === idx;
                      const rCol = getRarityColor(item.cardDef.rarity);
                      const isEquippedInDock = useGameStore.getState().equippedCardIds.includes(item.cardDef.id);

                      return (
                        <button
                          key={`mobile-${item.cardDef.id}-${idx}`}
                          onClick={() => {
                            setSelectedCardIndex(idx);
                            try {
                              const ctx = soundEngine.ensureContext();
                              if (ctx && !soundEngine.getMuted()) {
                                const osc = ctx.createOscillator();
                                const gain = ctx.createGain();
                                osc.type = 'sine';
                                osc.frequency.setValueAtTime(320 + idx * 25, ctx.currentTime);
                                gain.gain.setValueAtTime(0.04, ctx.currentTime);
                                gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                                osc.connect(gain);
                                gain.connect(ctx.destination);
                                osc.start();
                                osc.stop(ctx.currentTime + 0.11);
                              }
                            } catch (err) {}
                          }}
                          className={`snap-center flex-shrink-0 w-[100px] h-[105px] text-center rounded-xl border bg-gradient-to-b ${rCol.from} via-zinc-950/95 ${rCol.to} p-1.5 flex flex-col items-center justify-between relative overflow-hidden transition-all duration-300 cursor-pointer ${
                            isSelected 
                              ? `${rCol.border} ring-2 ring-purple-500/80 shadow-[0_0_12px_rgba(168,85,247,0.3)] scale-[1.02]` 
                              : 'border-zinc-850 opacity-70 hover:opacity-100'
                          }`}
                        >
                          {/* Equipped Label */}
                          {isEquippedInDock && (
                            <div className="absolute top-1 left-1.5 bg-purple-900/90 border border-purple-400/40 text-purple-200 text-[5px] font-mono font-black px-1 py-0.2 rounded uppercase tracking-wider scale-85 origin-top-left">
                              EQ
                            </div>
                          )}

                          {/* Rarity Circle */}
                          <div className={`absolute top-1.5 right-1.5 w-1 h-1 rounded-full ${
                            item.cardDef.rarity === 'legendary' ? 'bg-amber-400' :
                            item.cardDef.rarity === 'epic' ? 'bg-purple-400' :
                            item.cardDef.rarity === 'rare' ? 'bg-emerald-400' :
                            item.cardDef.rarity === 'uncommon' ? 'bg-sky-400' : 'bg-zinc-600'
                          }`} />

                          {/* Icon Container */}
                          <div className="w-7 h-7 rounded bg-zinc-950/60 flex items-center justify-center border border-white/5 mt-1">
                            <CardIcon icon={item.cardDef.icon} className="w-3.5 h-3.5" />
                          </div>

                          {/* Card Title */}
                          <span className="text-[7.5px] font-mono font-black tracking-tight leading-tight uppercase w-full break-words px-0.5 text-zinc-100">
                            {item.cardDef.name}
                          </span>

                          {/* Progress */}
                          <div className="w-full mt-0.5">
                            <div className="flex justify-between text-[6px] font-mono font-bold text-zinc-400 leading-none mb-0.5">
                              <span>LV.{item.level}</span>
                              <span>{item.duplicates}/{item.reqDupes}</span>
                            </div>
                            <div className="w-full h-0.5 rounded-full bg-zinc-950 border border-white/5 overflow-hidden">
                              <div 
                                className={`h-full ${
                                  item.duplicates >= item.reqDupes ? 'bg-amber-400' : 'bg-purple-500'
                                }`}
                                style={{ width: `${Math.min(100, (item.duplicates / item.reqDupes) * 100)}%` }}
                              />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Card Details Display Panel */}
                {(() => {
                  const selected = pulledCards[selectedCardIndex] || pulledCards[0];
                  const rCol = getRarityColor(selected.cardDef.rarity);
                  const isEquippedInDock = useGameStore.getState().equippedCardIds.includes(selected.cardDef.id);

                  return (
                    <motion.div
                      key={selectedCardIndex}
                      initial={{ y: 8, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                      className="w-full min-w-0 max-w-full p-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 text-left space-y-1.5 z-10 max-h-[175px] overflow-hidden"
                    >
                      <div className="flex justify-between items-center gap-1">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6.5 h-6.5 rounded-lg bg-zinc-950 flex items-center justify-center border border-white/5">
                            <CardIcon icon={selected.cardDef.icon} className="w-3.5 h-3.5 text-purple-300" />
                          </div>
                          <div>
                            <h4 className="font-mono text-[11px] font-black text-white uppercase leading-tight">
                              {selected.cardDef.name}
                            </h4>
                            <span className={`text-[7.5px] font-mono font-bold uppercase ${rCol.text}`}>
                              {selected.cardDef.rarity}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-[7.5px] font-mono text-zinc-400 bg-black/40 px-1.5 py-0.5 rounded border border-white/5">
                          <span className="text-sky-400 font-bold">LVL {selected.level}</span>
                          <span>•</span>
                          <span className="text-amber-400 font-bold">EXP {selected.duplicates}/{selected.reqDupes}</span>
                        </div>
                      </div>

                      <p className="text-[9.5px] font-mono text-zinc-300 leading-normal bg-zinc-950/60 p-2 rounded-xl border border-white/5 max-h-[60px] overflow-y-auto">
                        {selected.cardDef.description}
                      </p>

                      <div className="flex gap-2 pt-0.5 w-full">
                        {onEquipNow && !isEquippedInDock && (
                          <button
                            onClick={() => {
                              onEquipNow(selected.cardDef.id);
                              soundEngine.playUpgradeSuccess();
                            }}
                            className="flex-1 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-[9px] font-black uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(168,85,247,0.3)] cursor-pointer active:scale-95"
                          >
                            Equip Card
                          </button>
                        )}
                        <button
                          onClick={onClose}
                          className="flex-1 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-[9px] font-bold transition-all cursor-pointer active:scale-95 text-center"
                        >
                          Collect All & Close
                        </button>
                      </div>
                    </motion.div>
                  );
                })()}
              </motion.div>
            ) : (
              // Standard single pull details view
              <motion.div
                initial={{ y: 25, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: 'spring', damping: 14 }}
                className="w-full space-y-3.5 mt-4 z-10"
              >
                {/* Rarity Glow Border Presentation */}
                {(() => {
                  const rCol = getRarityColor(pulledCardDef.rarity);
                  return (
                    <div className={`p-4 rounded-2xl border bg-gradient-to-b ${rCol.from} via-zinc-950 ${rCol.to} text-center relative overflow-hidden flex flex-col items-center justify-center transition-all duration-500 ${
                      rCol.border
                    } ${rCol.glow}`}>
                      {/* Micro Rarity Text banner */}
                      <span className={`text-[9px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full mb-2 ${rCol.badge} border`}>
                        {pulledCardDef.rarity} Card Acquired
                      </span>

                      <h3 className={`text-xl font-mono font-black tracking-wide drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] ${rCol.text}`}>
                        {pulledCardDef.name}
                      </h3>
                    </div>
                  );
                })()}

                <div className="flex flex-col items-center justify-center gap-1 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-sky-400 font-black">Level {pulledLevel}</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-amber-400 font-black">EXP: {pulledDupes}/{reqDupes}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-48 h-2 rounded-full bg-zinc-950 border border-white/10 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-500 ${
                        pulledDupes >= reqDupes
                          ? 'bg-gradient-to-r from-amber-400 to-emerald-400 animate-pulse'
                          : 'bg-gradient-to-r from-purple-500 to-sky-400'
                      }`}
                      style={{ width: `${Math.min(100, (pulledDupes / reqDupes) * 100)}%` }}
                    />
                  </div>
                  {pulledDupes >= reqDupes && (
                    <span className="text-[10px] font-mono font-black text-emerald-300 animate-bounce pt-1">
                      ⚡ READY FOR FREE LEVEL UP (3/3+ EXP)!
                    </span>
                  )}
                </div>

                <p className="text-xs font-mono text-zinc-300 bg-zinc-900/50 p-3 rounded-xl border border-white/5 leading-relaxed text-center">
                  {pulledCardDef.description}
                </p>

                <div className="flex gap-2.5 pt-2 w-full">
                  {onEquipNow && !isEquipped && (
                    <button
                      onClick={() => {
                        onEquipNow(pulledCardDef.id);
                        onClose();
                      }}
                      className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-mono text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)] cursor-pointer active:scale-95"
                    >
                      Equip Card
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    Collect & Close
                  </button>
                </div>
              </motion.div>
            )
          ) : (
            <div className="flex items-center gap-2 mt-4 text-xs font-mono text-purple-400 animate-pulse justify-center z-10">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Selecting item strip...</span>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
