/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Header } from './components/Header';
import { GameCanvas } from './components/GameCanvas';
import { UpgradePanel } from './components/UpgradePanel';
import { EnemyStatsBox } from './components/EnemyStatsBox';
import { BossHealthBar } from './components/BossHealthBar';
import { DeathSummary } from './components/DeathSummary';
import { SettingsModal } from './components/SettingsModal';
import { EncyclopediaModal } from './components/EncyclopediaModal';
import { ActiveRareDropsHUD } from './components/ActiveRareDropsHUD';
import { RareDropNotificationModal } from './components/RareDropNotificationModal';
import { CompendiumModal } from './components/CompendiumModal';
import { SpeedIndicatorHUD } from './components/SpeedIndicatorHUD';
import { LabModal } from './components/LabModal';
import { AscensionModal } from './components/AscensionModal';
import { TechTreeModal } from './components/TechTreeModal';
import { MissionsMilestonesModal } from './components/MissionsMilestonesModal';
import { MilestonesModal } from './components/MilestonesModal';
import { MissionsMilestonesToasts } from './components/MissionsMilestonesToasts';
import { ProgressionCurvesModal } from './components/ProgressionCurvesModal';
import { useGame } from './hooks/useGame';
import { useGameStore } from './store/gameStore';
import { GameManager } from './game/GameManager';
import { soundEngine } from './game/sound';
import { bgmEngine } from './game/bgm';
import { Sparkles, ArrowUpRight, Pause, Play } from 'lucide-react';
import { calculateAscensionShards } from './game/constants';

export default function App() {
  const { 
    gameState, 
    setGameState,
    upgrades, 
    gameManagerRef,
    buyUpgrade, 
    buyPermanentUpgrade,
    drawCardPack,
    levelUpCard,
    toggleEquipCard,
    unlockCardSlot,
    startLabResearch,
    rushLabResearch,
    collectCompletedLab,
    buyLabAttribute,
    convertCurrencyToCells,
    unlockLabSlot,
    synthesizeSkill,
    upgradeSkill,
    toggleEquipSkill,
    expandSynergySlots,
    claimMissionReward,
    claimAllMissions,
    claimMilestone,
    claimAllMilestones,
    respawnAndReset,
    handlePlayerDeath,
    unlockTechNode,
    softResetAndAscend,
    setBulkBuyMode,
    setGameSpeed,
    updateSettings,
    resetAllData,
  } = useGame();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCodexOpen, setIsCodexOpen] = useState(false);
  const [isCompendiumOpen, setIsCompendiumOpen] = useState(false);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isAscensionOpen, setIsAscensionOpen] = useState(false);
  const [isTechTreeOpen, setIsTechTreeOpen] = useState(false);
  const [isMissionsMilestonesOpen, setIsMissionsMilestonesOpen] = useState(false);
  const [isMilestonesModalOpen, setIsMilestonesModalOpen] = useState(false);
  const [isProgressionCurvesOpen, setIsProgressionCurvesOpen] = useState(false);
  const [missionsModalDefaultTab, setMissionsModalDefaultTab] = useState<'missions' | 'milestones'>('missions');
  const [isUpgradePanelOpen, setIsUpgradePanelOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pixel_pentagons_upgrades_open');
      if (saved !== null) {
        return saved === 'true';
      }
    }
    return true;
  });

  const handleToggleUpgradePanel = useCallback((explicitVal?: boolean) => {
    setIsUpgradePanelOpen(prev => {
      const next = explicitVal !== undefined ? explicitVal : !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('pixel_pentagons_upgrades_open', next.toString());
      }
      return next;
    });
  }, []);

  const [toasts, setToasts] = useState<any[]>([]);

  const completedMissionsRef = useRef<Set<string>>(new Set());
  const completedMilestonesRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const addToast = useCallback((toast: any) => {
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Real-time tracking of missions and milestones for in-game notifications
  useEffect(() => {
    if (!gameState.missions || !gameState.milestones) return;

    const currentMissions = new Set<string>();
    gameState.missions.forEach(m => {
      if (m.current >= m.target) {
        currentMissions.add(m.id);
      }
    });

    const currentMilestones = new Set<string>();
    const highest = gameState.highestWaveEver || 0;
    gameState.milestones.forEach(m => {
      if (highest >= m.wave) {
        currentMilestones.add(`${m.tier}_${m.wave}`);
      }
    });

    if (isFirstLoadRef.current) {
      completedMissionsRef.current = currentMissions;
      completedMilestonesRef.current = currentMilestones;
      isFirstLoadRef.current = false;
      return;
    }

    const isMissionsUnlocked = Boolean(
      gameState.unlockedSystems?.missions || (gameState.highestWaveEver || 0) >= 30
    );

    // Check for newly completed missions ONLY if daily missions are unlocked
    if (isMissionsUnlocked) {
      gameState.missions.forEach(m => {
        if (m.current >= m.target && !completedMissionsRef.current.has(m.id)) {
          completedMissionsRef.current.add(m.id);
          addToast({
            id: `m_${m.id}_${Date.now()}`,
            title: 'Daily Contract Complete! 🎯',
            subtitle: m.title,
            type: 'mission',
          });
          soundEngine.playUpgradeSuccess(1.3);
        }
      });
    } else {
      // If locked, track silently so players aren't notified of locked content
      gameState.missions.forEach(m => {
        if (m.current >= m.target) {
          completedMissionsRef.current.add(m.id);
        }
      });
    }

    // Check for newly achieved milestones
    gameState.milestones.forEach(m => {
      const key = `${m.tier}_${m.wave}`;
      if (highest >= m.wave && !completedMilestonesRef.current.has(key)) {
        completedMilestonesRef.current.add(key);
        addToast({
          id: `ms_${key}_${Date.now()}`,
          title: 'Milestone Synthesized! 🏆',
          subtitle: m.title,
          type: 'milestone',
        });
        soundEngine.playTechUnlock();
      }
    });
  }, [gameState.missions, gameState.highestWaveEver, gameState.milestones, gameState.unlockedSystems?.missions, addToast]);

  const isInitStarted = useRef(false);

  const equipRareDrop = useCallback((item: any) => {
    setGameState(prev => {
      const active = [...prev.activeRareDrops];
      const existingIdx = active.findIndex(d => d.id === item.id);
      if (existingIdx >= 0) {
        active[existingIdx] = item;
      } else if (active.length < prev.synergySlots) {
        active.push(item);
      } else {
        active[0] = item;
      }
      return {
        ...prev,
        activeRareDrops: active,
        latestAcquiredDrop: null,
      };
    });
  }, [setGameState]);

  const dismissDropModal = useCallback(() => {
    setGameState(prev => ({ ...prev, latestAcquiredDrop: null }));
  }, [setGameState]);

  const isDeathHandledThisRunRef = useRef(false);

  const handleRespawn = useCallback(() => {
    isDeathHandledThisRunRef.current = false;
    respawnAndReset();
  }, [respawnAndReset]);

  const handleStateUpdate = useCallback((partial: Partial<typeof gameState>) => {
    // Check for death trigger
    if (partial.isDead && !isDeathHandledThisRunRef.current) {
      isDeathHandledThisRunRef.current = true;
      soundEngine.playDeath();
      soundEngine.startAmbientMenu();
      const currentStore = useGameStore.getState();
      const waveReached = partial.wave ?? currentStore.wave ?? 1;
      const inRunShards = partial.cosmicShards ?? currentStore.cosmicShards;
      const isNewRecord = waveReached > (currentStore.highestWaveEver || 0);
      handlePlayerDeath({
        waveReached,
        enemiesDefeated: gameManagerRef.current?.getEnemiesDefeated() || 0,
        totalShardsEarned: calculateAscensionShards(waveReached, 1.0, currentStore.tier || 1),
        highestWaveEver: Math.max(currentStore.highestWaveEver || 0, waveReached),
        newRecord: isNewRecord,
        ascensionCount: (currentStore.ascensionCount || 0) + 1,
      }, inRunShards);
      // Strip cosmicShards from partial so it does not overwrite the freshly credited balance
      const { cosmicShards: _omitShards, ...safePartial } = partial;
      setGameState({ ...safePartial, isDead: true, playerHp: 0, isWaveActive: false });
      return;
    }

    if (partial.isDead === false) {
      isDeathHandledThisRunRef.current = false;
      const currentStore = useGameStore.getState();
      if (currentStore.isDead) {
        soundEngine.startAmbientBattle();
      }
    }

    setGameState(partial);
  }, [handlePlayerDeath, setGameState, gameManagerRef]);

  useEffect(() => {
    if (gameManagerRef.current) {
      gameManagerRef.current.setOnStateUpdate(handleStateUpdate);
    }
  }, [handleStateUpdate]);

  useEffect(() => {
    if (isInitStarted.current) return;
    
    if (gameState.isDead) {
      soundEngine.startAmbientMenu();
    } else {
      soundEngine.startAmbientBattle();
    }

    const init = async () => {
      const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
      if (canvas && !gameManagerRef.current) {
        isInitStarted.current = true;
        const gm = new GameManager(handleStateUpdate);
        gameManagerRef.current = gm;
        await gm.init(canvas, gameState, upgrades);

        gm.setOnRareDropAcquired((item, type) => {
          soundEngine.playUpgradeSuccess();
          setGameState(prev => {
            const collection = { ...prev.rareDropCollection };
            const current = collection[item.id] || { id: item.id, level: 1, copies: 0, highestRaritySeen: item.rarity };
            let newCopies = current.copies + 1;
            let newLevel = current.level;
            if (newCopies >= 3 && newLevel < 15) {
              newCopies = 0;
              newLevel += 1;
            }
            collection[item.id] = {
              id: item.id,
              level: newLevel,
              copies: newCopies,
              highestRaritySeen: item.rarity,
            };

            let newSynergySlots = prev.synergySlots;
            if (type === 'synergy') {
              newSynergySlots = Math.min(5, prev.synergySlots + 1);
            }

            return {
              ...prev,
              rareDropCollection: collection,
              synergySlots: newSynergySlots,
              latestAcquiredDrop: item,
            };
          });
        });
      }
    };

    setTimeout(init, 100);

    const handleFirstInteraction = () => {
      soundEngine.ensureContext();
      bgmEngine.startBGM();
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };

    window.addEventListener('pointerdown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // Dynamic BGM control based on game progress and boss status
  useEffect(() => {
    bgmEngine.setDeadMode(gameState.isDead);
    bgmEngine.setTier(gameState.tier || 1);
    
    if (!gameState.isDead) {
      const isBossActive = Boolean(gameState.activeBoss);
      bgmEngine.setBossMode(isBossActive);
      
      // Calculate intensity based on wave progress (scales from 0 to 1 over 100 waves)
      const waveIntensity = Math.min(1, (gameState.wave || 0) / 100);
      bgmEngine.setIntensity(waveIntensity);
    } else {
      bgmEngine.setBossMode(false);
      bgmEngine.setIntensity(0);
    }
  }, [gameState.wave, gameState.tier, gameState.activeBoss, gameState.isDead]);

  // Sync Audio mute settings to engines
  useEffect(() => {
    soundEngine.setMute(Boolean(gameState.settings?.soundMuted));
    bgmEngine.setMute(Boolean(gameState.settings?.bgmMuted));
  }, [gameState.settings?.soundMuted, gameState.settings?.bgmMuted]);

  return (
    <div className="fixed inset-0 bg-[#07050e] text-white overflow-hidden select-none touch-none font-sans">
      {/* HUD Header */}
      <Header 
        gameState={gameState} 
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenCodex={() => setIsCodexOpen(true)}
        onOpenMissions={() => {
          setMissionsModalDefaultTab('missions');
          setIsMissionsMilestonesOpen(true);
        }}
        onOpenLab={() => setIsLabOpen(true)}
        onOpenCompendium={() => setIsCompendiumOpen(true)}
        onOpenProgressionCurves={() => setIsProgressionCurvesOpen(true)}
        onOpenAscension={() => setIsAscensionOpen(true)}
        onOpenSkillTree={() => setIsTechTreeOpen(true)}
        onToggleUpgrades={handleToggleUpgradePanel}
        isUpgradesOpen={isUpgradePanelOpen}
      />

      {/* Boss Health Bar (Top Center - Full Row Dedicated to Boss) */}
      {!gameState.isDead && gameState.activeBoss && (
        <div className="absolute top-[48px] sm:top-[52px] left-0 right-0 px-2 sm:px-4 z-20 pointer-events-none flex justify-center animate-fade-in">
          <BossHealthBar boss={gameState.activeBoss} isDead={gameState.isDead} />
        </div>
      )}
      
      {/* Active Rare Drops HUD Banner (Right Edge Side HUD - cleanly above upgrade panel) */}
      {!gameState.isDead && (
        <div className={`absolute right-0 z-20 pointer-events-auto transition-all duration-300 ease-out animate-fade-in ${
          gameState.activeBoss 
            ? 'bottom-[200px] sm:bottom-[210px]' 
            : isUpgradePanelOpen 
            ? 'bottom-[155px] sm:bottom-[165px]' 
            : 'bottom-[45px] sm:bottom-[50px]'
        }`}>
          <ActiveRareDropsHUD
            activeRareDrops={gameState.activeRareDrops || []}
            activeSynergyCards={gameState.activeSynergyCards || []}
            synergySlots={gameState.synergySlots || 1}
            onOpenCompendium={() => setIsCompendiumOpen(true)}
            isBossActive={Boolean(gameState.activeBoss)}
          />
        </div>
      )}

      {/* Threat Intel Scanner (Upper-Right HUD - only during regular waves, positioned cleanly below Header) */}
      {!gameState.isDead && !gameState.activeBoss && (
        <div className="absolute top-[56px] sm:top-[60px] right-2.5 sm:right-3 z-20 pointer-events-auto animate-fade-in">
          <EnemyStatsBox gameState={gameState} upgrades={upgrades} />
        </div>
      )}

      {/* Speed Control & Acceleration Indicator (Main Gameplay HUD: [-] 1.0x [+]) */}
      {!gameState.isDead && (
        <div className={`absolute left-2.5 sm:left-3 z-20 pointer-events-auto transition-all duration-300 animate-fade-in ${
          gameState.activeBoss ? 'top-[112px] sm:top-[116px]' : 'top-[56px] sm:top-[60px]'
        }`}>
          <SpeedIndicatorHUD
            gameSpeed={gameState.gameSpeed !== undefined ? gameState.gameSpeed : 1.0}
            labResearchLevels={gameState.labResearchLevels}
            onSetGameSpeed={setGameSpeed}
            onOpenLab={() => setIsLabOpen(true)}
          />
        </div>
      )}

      {/* 0x Simulation Paused Banner Overlay */}
      {!gameState.isDead && gameState.gameSpeed === 0 && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl bg-black/90 border border-rose-500/50 shadow-[0_0_35px_rgba(244,63,94,0.35)] backdrop-blur-md animate-fade-in select-none">
          <div className="flex items-center gap-2 text-rose-400 font-mono font-black text-xs sm:text-sm tracking-widest uppercase">
            <Pause className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Simulation Paused (0x)</span>
          </div>
          <span className="text-[9.5px] font-mono text-zinc-400 text-center max-w-[200px]">
            Combat frozen. Upgrade stats & prepare defenses.
          </span>
          <button
            type="button"
            onClick={() => {
              soundEngine.playTabSwitch();
              setGameSpeed(1.0);
            }}
            className="mt-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-black font-mono font-black text-[10px] uppercase tracking-wider cursor-pointer hover:brightness-110 active:scale-95 shadow-md flex items-center gap-1.5"
          >
            <Play className="w-3 h-3 fill-black text-black" />
            <span>Resume (1.0x)</span>
          </button>
        </div>
      )}

      {/* Main Canvas Stage */}
      <main className="absolute inset-0 flex flex-col items-center justify-center">
        <GameCanvas gameManager={gameManagerRef.current} showHud={gameState.settings?.showPerformanceHud} />
      </main>

      {/* In-Run Upgrade Panel (Cash Upgrades) */}
      {!gameState.isDead && (
        <UpgradePanel 
          upgrades={upgrades} 
          gameState={gameState} 
          onBuy={buyUpgrade} 
          onStateUpdate={handleStateUpdate}
          isOpen={isUpgradePanelOpen}
          onToggleOpen={handleToggleUpgradePanel}
          calculateUpgradeCost={(upg, lvl, amt) => {
            let total = 0;
            let cur = lvl;
            for (let i = 0; i < amt; i++) {
              total += upg.baseCost * Math.pow(upg.costGrowth, cur);
              cur++;
            }
            return Math.max(1, Math.round(total));
          }}
        />
      )}

      {/* Full-Screen Death & Ascension Screen */}
      <DeathSummary 
        gameState={gameState} 
        onRespawn={handleRespawn}
        onBuyWorkshopUpgrade={buyPermanentUpgrade}
        onDrawCardPack={drawCardPack}
        onToggleEquipCard={toggleEquipCard}
        onLevelUpCard={levelUpCard}
        onUnlockCardSlot={unlockCardSlot}
        onStartLabResearch={startLabResearch}
        onRushLabResearch={rushLabResearch}
        onCollectLab={collectCompletedLab}
        onBuyLabAttribute={buyLabAttribute}
        onConvertCurrencyToCells={convertCurrencyToCells}
        onUnlockLabSlot={unlockLabSlot}
        onOpenCompendium={() => setIsCompendiumOpen(true)}
        onClaimMission={claimMissionReward}
        onClaimAllMissions={claimAllMissions}
        onClaimMilestone={claimMilestone}
        onClaimAllMilestones={claimAllMilestones}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onSetTier={(tier) => setGameState(prev => ({ ...prev, tier }))}
        onOpenTechTree={() => setIsTechTreeOpen(true)}
      />

      {/* Rare Drop / Synergy Card Drop Acquisition Modal */}
      <RareDropNotificationModal
        item={gameState.latestAcquiredDrop}
        type={gameState.latestAcquiredDrop && 'slotsGranted' in gameState.latestAcquiredDrop ? 'synergy' : 'drop'}
        activeSlots={gameState.synergySlots || 1}
        currentActiveCount={(gameState.activeRareDrops || []).length}
        onEquip={equipRareDrop}
        onDismiss={dismissDropModal}
      />

      {/* Compendium Gallery & Tactical Skills Forge Modal */}
      <CompendiumModal
        isOpen={isCompendiumOpen}
        rareDropCollection={gameState.rareDropCollection || {}}
        activeRareDrops={gameState.activeRareDrops || []}
        synergySlots={gameState.synergySlots || 1}
        cosmicShards={gameState.cosmicShards}
        gems={gameState.gems}
        cells={gameState.cells}
        onSynthesize={synthesizeSkill}
        onUpgrade={upgradeSkill}
        onToggleEquip={toggleEquipSkill}
        onExpandSlots={expandSynergySlots}
        onClose={() => setIsCompendiumOpen(false)}
      />

      {/* Research Synthesis Laboratory Modal */}
      <LabModal
        isOpen={isLabOpen}
        gameState={gameState}
        onClose={() => setIsLabOpen(false)}
        onStartLabResearch={startLabResearch}
        onRushLabResearch={rushLabResearch}
        onCollectLab={collectCompletedLab}
        onBuyLabAttribute={buyLabAttribute}
        onConvertCurrencyToCells={convertCurrencyToCells}
        onUnlockLabSlot={unlockLabSlot}
        onOpenSkillTree={() => {
          setIsLabOpen(false);
          setIsTechTreeOpen(true);
        }}
      />

      {/* Permanent Cosmic Ascension & Prestige Soft-Reset Modal */}
      <AscensionModal
        isOpen={isAscensionOpen}
        isDead={gameState.isDead}
        onClose={() => setIsAscensionOpen(false)}
        onConfirmAscension={() => {
          isDeathHandledThisRunRef.current = false;
          softResetAndAscend();
          setIsAscensionOpen(false);
        }}
        onOpenSkillTree={() => {
          setIsAscensionOpen(false);
          setIsTechTreeOpen(true);
        }}
        summary={
          gameState.deathSummary || {
            waveReached: Math.max(gameState.wave || 1, gameState.highestWaveThisRun || 1),
            enemiesDefeated: gameState.stats?.totalEnemiesSlain || 0,
            totalShardsEarned: calculateAscensionShards(Math.max(gameState.wave || 1, gameState.highestWaveThisRun || 1), 1.0, gameState.tier || 1),
            reservedCashGained: gameState.deathSummary?.reservedCashGained,
          }
        }
        ascensionCount={gameState.ascensionCount || 0}
      />

      {/* Permanent Workshop Skill Tree Matrix Modal */}
      <TechTreeModal
        isOpen={isTechTreeOpen}
        onClose={() => setIsTechTreeOpen(false)}
        onOpenLab={() => {
          setIsTechTreeOpen(false);
          setIsLabOpen(true);
        }}
        cosmicShards={gameState.cosmicShards}
        unlockedNodeIds={gameState.unlockedTechNodes || []}
        onUnlockNode={unlockTechNode}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        gameState={gameState}
        onUpdateSettings={updateSettings}
        onResetAllData={resetAllData}
        onOpenProgressionCurves={() => {
          setIsSettingsOpen(false);
          setIsProgressionCurvesOpen(true);
        }}
      />

      {/* Progression Math & Desmos Curves Inspector */}
      <ProgressionCurvesModal
        isOpen={isProgressionCurvesOpen}
        onClose={() => setIsProgressionCurvesOpen(false)}
      />

      {/* Cosmic Codex Encyclopedia */}
      <EncyclopediaModal
        isOpen={isCodexOpen}
        onClose={() => setIsCodexOpen(false)}
        gameState={gameState}
        upgrades={upgrades}
      />


      {/* Real-Time Missions Dashboard */}
      <MissionsMilestonesModal
        isOpen={isMissionsMilestonesOpen}
        onClose={() => setIsMissionsMilestonesOpen(false)}
        gameState={gameState}
        onClaimMission={claimMissionReward}
        onClaimAllMissions={claimAllMissions}
        onClaimMilestone={claimMilestone}
        onClaimAllMilestones={claimAllMilestones}
        defaultTab={missionsModalDefaultTab}
      />

      {/* Remastered Categorized Milestones Modal */}
      <MilestonesModal
        isOpen={isMilestonesModalOpen}
        onClose={() => setIsMilestonesModalOpen(false)}
        gameState={gameState}
        onClaimMilestone={claimMilestone}
        onClaimAllMilestones={claimAllMilestones}
        initialTier={gameState.tier || 1}
        onSetTier={(tier) => setGameState(prev => ({ ...prev, tier }))}
      />

      {/* Real-Time Completion Alerts */}
      <MissionsMilestonesToasts
        toasts={toasts}
        onRemove={removeToast}
        onClickToast={(toast) => {
          if (toast.type === 'milestone') {
            setIsMilestonesModalOpen(true);
          } else {
            setIsMissionsMilestonesOpen(true);
          }
        }}
      />
    </div>
  );
}
