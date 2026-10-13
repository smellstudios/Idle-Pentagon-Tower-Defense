/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Renderer } from './Renderer';
import { Simulation } from './Simulation';
import { GameState, Upgrade } from '../types';
import { PERFORMANCE_CONFIG } from './constants';

export class GameManager {
  private renderer: Renderer | null = null;
  private simulation: Simulation | null = null;
  private onStateUpdate: (state: Partial<GameState>) => void;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;
  private state: GameState | null = null;

  // Adaptive Frame-Rate Governor & Performance Tracking
  private emaFrameTimeMs: number = 16.67;
  private downgradeTimeMs: number = 0;
  private recoveryTimeMs: number = 0;
  private isTabHidden: boolean = false;

  constructor(onStateUpdate: (state: Partial<GameState>) => void) {
    this.onStateUpdate = onStateUpdate;
  }

  public setOnStateUpdate(fn: (state: Partial<GameState>) => void) {
    this.onStateUpdate = fn;
  }

  public async init(canvas: HTMLCanvasElement, initialState: GameState, upgrades: Upgrade[]) {
    this.state = initialState;
    this.renderer = new Renderer(canvas);
    await this.renderer.init(canvas, Boolean(initialState.settings?.highPerformanceMode));
    this.simulation = new Simulation(this.renderer, initialState, upgrades);
    this.lastTime = performance.now();

    document.addEventListener('visibilitychange', this.handleVisibilityChange);

    this.loop(this.lastTime);
  }

  private handleVisibilityChange = () => {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      this.isTabHidden = true;
    } else {
      this.isTabHidden = false;
      this.lastTime = performance.now();
    }
  };

  private loop = (currentTime: number) => {
    if (!this.simulation || !this.renderer) return;

    if (this.isTabHidden) {
      this.animationFrameId = requestAnimationFrame(this.loop);
      return;
    }

    const frameDuration = currentTime - this.lastTime;
    this.lastTime = currentTime;

    // Delta normalized to 60fps with strict bounding to prevent skipping/warping on frame drops
    const rawDelta = frameDuration / 16.67;
    const delta = Math.min(Math.max(rawDelta, 0.1), 2.5);

    // Exponential moving average frame time tracker
    this.emaFrameTimeMs = this.emaFrameTimeMs * 0.95 + frameDuration * 0.05;

    // Adaptive Frame-Time Governor (protects 60 FPS under massive hordes)
    if (this.state?.settings?.adaptivePerformanceMode !== false) {
      const currentTier = this.renderer.getQualityTier();
      if (this.emaFrameTimeMs > PERFORMANCE_CONFIG.downgradeFrameTimeMs) {
        this.downgradeTimeMs += frameDuration;
        this.recoveryTimeMs = 0;
        if (this.downgradeTimeMs >= PERFORMANCE_CONFIG.downgradeSustainMs && currentTier < 2) {
          const nextTier = (currentTier + 1) as 1 | 2;
          this.renderer.setQualityTier(nextTier);
          this.downgradeTimeMs = 0;
        }
      } else if (this.emaFrameTimeMs < PERFORMANCE_CONFIG.recoveryFrameTimeMs) {
        this.recoveryTimeMs += frameDuration;
        this.downgradeTimeMs = 0;
        if (this.recoveryTimeMs >= PERFORMANCE_CONFIG.recoverySustainMs && currentTier > 0) {
          if (!this.state?.settings?.highPerformanceMode) {
            const nextTier = (currentTier - 1) as 0 | 1;
            this.renderer.setQualityTier(nextTier);
          }
          this.recoveryTimeMs = 0;
        }
      } else {
        this.downgradeTimeMs = 0;
        this.recoveryTimeMs = 0;
      }
    }

    this.simulation.update(delta, currentTime, this.onStateUpdate);

    // Explicitly render the stage in PixiJS v8
    this.renderer.app.render();

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  public setOnRareDropAcquired(fn: (item: any, type: 'drop' | 'synergy') => void) {
    if (this.simulation) {
      this.simulation.onRareDropAcquired = fn;
    }
  }

  public updateUpgrades(upgrades: Upgrade[]) {
    this.simulation?.updateUpgrades(upgrades);
  }

  public updateState(state: GameState) {
    this.state = state;
    this.simulation?.updateGameState(state);

    if (state.settings?.highPerformanceMode) {
      this.renderer?.setHighPerformanceMode(true);
      if (this.renderer && this.renderer.getQualityTier() === 0) {
        this.renderer.setQualityTier(1);
      }
    } else {
      this.renderer?.setHighPerformanceMode(false);
    }
  }

  public resetRun(maxHp: number, startWave: number = 1) {
    this.simulation?.resetRun(maxHp, startWave);
  }

  public triggerManualDeath() {
    this.simulation?.triggerManualDeath(this.onStateUpdate);
  }

  public getEnemiesDefeated(): number {
    return this.simulation?.enemiesDefeatedInRun ?? 0;
  }

  public getSimulation(): Simulation | null {
    return this.simulation;
  }

  public spawnTestEnemy(x: number, y: number, type: string = 'red_square') {
    return this.simulation?.createEnemyEntity(x, y, type);
  }

  public spawnTestHorde(count: number = 400) {
    this.simulation?.spawnTestHorde(count);
  }

  public getPerformanceMetrics() {
    return {
      fps: Math.round(1000 / Math.max(1, this.emaFrameTimeMs)),
      avgFrameTimeMs: Number(this.emaFrameTimeMs.toFixed(1)),
      activeEnemies: this.simulation?.getEnemies().length ?? 0,
      activeProjectiles: this.simulation?.getProjectiles().length ?? 0,
      activeVfx: (this.simulation?.getActiveExplosionsCount() ?? 0) + (this.simulation?.getActiveRocketsCount() ?? 0),
      qualityTier: this.renderer?.getQualityTier() ?? 0,
    };
  }

  public resize(width: number, height: number) {
    this.renderer?.resize(width, height);
  }

  public destroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.renderer?.destroy();
  }
}
