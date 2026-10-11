/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Entity } from '../types';
import { GAME_WIDTH, GAME_HEIGHT } from './constants';

/**
 * High-performance 2D Uniform Spatial Grid Broadphase.
 * Reduces O(P * E) projectile-enemy and enemy-enemy separation checks to O(1) cell queries.
 * Zero-allocation memory design: reuses internal bucket arrays each frame.
 */
export class SpatialGrid {
  private cellSize: number;
  private originX: number;
  private originY: number;
  private cols: number;
  private rows: number;
  private buckets: Entity[][];
  private queryStamp: number = 0;
  private visitedEntities: Set<Entity>;

  constructor(cellSize: number = 60, margin: number = 40) {
    this.cellSize = cellSize;
    this.originX = -margin;
    this.originY = -margin;
    const totalWidth = GAME_WIDTH + margin * 2;
    const totalHeight = GAME_HEIGHT + margin * 2;

    this.cols = Math.ceil(totalWidth / cellSize) + 1;
    this.rows = Math.ceil(totalHeight / cellSize) + 1;

    const totalCells = this.cols * this.rows;
    this.buckets = new Array(totalCells);
    for (let i = 0; i < totalCells; i++) {
      this.buckets[i] = [];
    }

    this.visitedEntities = new Set<Entity>();
  }

  /**
   * Clears all spatial grid buckets without deallocating arrays.
   */
  public clear(): void {
    const total = this.buckets.length;
    for (let i = 0; i < total; i++) {
      this.buckets[i].length = 0;
    }
  }

  private getCellIndex(col: number, row: number): number {
    if (col < 0 || col >= this.cols || row < 0 || row >= this.rows) {
      return -1;
    }
    return row * this.cols + col;
  }

  /**
   * Inserts an entity into the grid based on its bounding box.
   */
  public insert(entity: Entity): void {
    const minCol = Math.max(0, Math.floor((entity.x - entity.radius - this.originX) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((entity.x + entity.radius - this.originX) / this.cellSize));
    const minRow = Math.max(0, Math.floor((entity.y - entity.radius - this.originY) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((entity.y + entity.radius - this.originY) / this.cellSize));

    for (let r = minRow; r <= maxRow; r++) {
      const rowOffset = r * this.cols;
      for (let c = minCol; c <= maxCol; c++) {
        this.buckets[rowOffset + c].push(entity);
      }
    }
  }

  /**
   * Populates the grid with all active enemies in a single fast pass.
   */
  public populate(entities: Entity[]): void {
    this.clear();
    const len = entities.length;
    for (let i = 0; i < len; i++) {
      const e = entities[i];
      if (e.hp > 0) {
        this.insert(e);
      }
    }
  }

  /**
   * Queries entities within a circular area around (x, y).
   * @returns true if query was halted early by callback returning true (for early break/pierce hit)
   */
  public queryRadius(
    x: number,
    y: number,
    radius: number,
    callback: (entity: Entity) => boolean | void
  ): boolean {
    const minCol = Math.max(0, Math.floor((x - radius - this.originX) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((x + radius - this.originX) / this.cellSize));
    const minRow = Math.max(0, Math.floor((y - radius - this.originY) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((y + radius - this.originY) / this.cellSize));

    this.visitedEntities.clear();
    const radiusSq = radius * radius;

    for (let r = minRow; r <= maxRow; r++) {
      const rowOffset = r * this.cols;
      for (let c = minCol; c <= maxCol; c++) {
        const bucket = this.buckets[rowOffset + c];
        const count = bucket.length;

        for (let i = 0; i < count; i++) {
          const entity = bucket[i];
          if (this.visitedEntities.has(entity) || entity.hp <= 0) {
            continue;
          }
          this.visitedEntities.add(entity);

          const dx = entity.x - x;
          const dy = entity.y - y;
          const totalRadius = radius + entity.radius;

          if (dx * dx + dy * dy <= totalRadius * totalRadius) {
            const stop = callback(entity);
            if (stop === true) {
              return true;
            }
          }
        }
      }
    }

    return false;
  }

  /**
   * Queries entities along a continuous line segment (x1, y1) -> (x2, y2).
   * Performs Continuous Collision Detection (CCD) to prevent fast-moving projectiles from tunneling or phasing through enemies.
   * Sorts hits along trajectory to ensure the closest obstacle in line of fire is resolved first.
   */
  public querySegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    radius: number,
    callback: (entity: Entity, hitFraction: number) => boolean | void
  ): boolean {
    const minX = Math.min(x1, x2) - radius;
    const maxX = Math.max(x1, x2) + radius;
    const minY = Math.min(y1, y2) - radius;
    const maxY = Math.max(y1, y2) + radius;

    const minCol = Math.max(0, Math.floor((minX - this.originX) / this.cellSize));
    const maxCol = Math.min(this.cols - 1, Math.floor((maxX - this.originX) / this.cellSize));
    const minRow = Math.max(0, Math.floor((minY - this.originY) / this.cellSize));
    const maxRow = Math.min(this.rows - 1, Math.floor((maxY - this.originY) / this.cellSize));

    this.visitedEntities.clear();

    const vx = x2 - x1;
    const vy = y2 - y1;
    const segLenSq = vx * vx + vy * vy;

    const hits: { entity: Entity; t: number }[] = [];

    for (let r = minRow; r <= maxRow; r++) {
      const rowOffset = r * this.cols;
      for (let c = minCol; c <= maxCol; c++) {
        const bucket = this.buckets[rowOffset + c];
        const count = bucket.length;

        for (let i = 0; i < count; i++) {
          const entity = bucket[i];
          if (this.visitedEntities.has(entity) || entity.hp <= 0) {
            continue;
          }
          this.visitedEntities.add(entity);

          const totalRadius = radius + entity.radius;
          const totalRadiusSq = totalRadius * totalRadius;

          const wx = entity.x - x1;
          const wy = entity.y - y1;

          let t = 0;
          let cx = x1;
          let cy = y1;

          if (segLenSq > 0.0001) {
            t = (wx * vx + wy * vy) / segLenSq;
            t = Math.max(0, Math.min(1, t));
            cx = x1 + t * vx;
            cy = y1 + t * vy;
          }

          const dx = entity.x - cx;
          const dy = entity.y - cy;
          const distSq = dx * dx + dy * dy;

          if (distSq <= totalRadiusSq) {
            hits.push({ entity, t });
          }
        }
      }
    }

    if (hits.length === 0) return false;

    // Sort hits by progression along segment so closest enemy hits first
    if (hits.length > 1) {
      hits.sort((a, b) => a.t - b.t);
    }

    for (let i = 0; i < hits.length; i++) {
      const stop = callback(hits[i].entity, hits[i].t);
      if (stop === true) return true;
    }

    return false;
  }

  /**
   * Fast nearest entity search within maximum radius.
   */
  public findNearest(x: number, y: number, maxRadius: number, filter?: (e: Entity) => boolean): Entity | null {
    let nearest: Entity | null = null;
    let nearestDistSq = maxRadius * maxRadius;

    this.queryRadius(x, y, maxRadius, (entity) => {
      if (filter && !filter(entity)) return;
      const dx = entity.x - x;
      const dy = entity.y - y;
      const distSq = dx * dx + dy * dy;
      if (distSq < nearestDistSq) {
        nearestDistSq = distSq;
        nearest = entity;
      }
    });

    return nearest;
  }
}
