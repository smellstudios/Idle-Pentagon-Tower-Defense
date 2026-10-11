/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Renderer } from './Renderer';
import { Simulation } from './Simulation';
import { GameState, Upgrade } from '../types';

export class GameManager {
  private renderer: Renderer | null = null;
  private simulation: Simulation | null = null;
  private onStateUpdate: (state: Partial<GameState>) => void;
  private lastTime: number = 0;
  private animationFrameId: number | null = null;

  constructor(onStateUpdate: (state: Partial<GameState>) => void) {
    this.onStateUpdate = onStateUpdate;
  }

  public async init(canvas: HTMLCanvasElement, initialState: GameState, upgrades: Upgrade[]) {
    this.renderer = new Renderer(canvas);
    await this.renderer.init(canvas);
    this.simulation = new Simulation(this.renderer, initialState, upgrades);
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  private loop = (currentTime: number) => {
    if (!this.simulation || !this.renderer) return;
    
    const delta = (currentTime - this.lastTime) / 16.67; // delta normalized to 60fps
    this.lastTime = currentTime;

    this.simulation.update(delta, currentTime, this.onStateUpdate);
    
    // Explicitly render the stage in PixiJS v8 if using manual loop
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
    this.simulation?.updateGameState(state);
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

  public resize(width: number, height: number) {
    this.renderer?.resize(width, height);
  }

  public destroy() {
    if (this.animationFrameId) cancelAnimationFrame(this.animationFrameId);
    this.renderer?.destroy();
  }
}
