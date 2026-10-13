# High-Density 60 FPS Scaling Blueprint (400–1,200+ Enemies & Dense Projectiles)

A production-grade architectural specification to sustain **60 FPS on mid-range mobile browsers** (Android 2021–2025 and iOS WebKit) under **400–1,200+ active enemies** and **150–400+ simultaneous projectiles** in PixiJS v8 + React 19 + TypeScript + Zustand.

---

## 1. Non-Negotiable Core Principle: 100% Visual Identity Preservation

The transition from `Graphics` to `Sprite` is **strictly an under-the-hood rendering optimization**.
- **Zero Visual Degradation or Simplification:** Every single enemy shape, polygon vertex, stroke weight, inner eye, crown orb, and contour line is preserved with 100% visual parity.
- The procedural texture generator draws the **exact** mathematical geometry currently used in `Simulation.ts` and `Renderer.ts`, baked once into ultra-crisp GPU textures.
- The player will experience zero visual downgrade or altered aesthetic; only a dramatic leap in rendering efficiency and frame-rate stability.

---

## 2. Refined Architecture Details

### A. Enemy Procedural Texture Atlas (`EnemyTextureAtlas`)
- **Consistent Texture Resolution:**
  - Standard entities: Pre-rendered at `128×128` (with crisp sub-pixel anti-aliasing) to maintain razor-sharp contours across high-DPI mobile screens.
  - Boss entities: Pre-rendered at `128×128` to cleanly accommodate the 10-pointed star, outer golden crown ring, and 3 satellite armor nodes.
- **Pure White Fill & Contour Pipeline:**
  - All textures are generated with pure white fills (`0xffffff`) and crisp high-contrast white strokes.
  - Colors are applied at runtime exclusively via WebGL `sprite.tint`:
    - Base enemy colors (`typeColors[type]`)
    - Golden variants (`0xfacc15`)
    - Poisoned state (`0x22c55e`)
    - Freeze / Stun state (`0x38bdf8`)
    - Void / Phase state (`0xc084fc`)
  - This allows a single shared GPU texture per enemy type while supporting unlimited dynamic status effects and color variants.
- **Preserved `enemyPools` Structure:**
  - The existing `enemyPools: Map<string, Entity[]>` remains completely intact without redesign.
  - Only the visual representation swaps from `enemy.graphics: Graphics` to `enemy.sprite: Sprite`, updating `.sprite.tint`, `.sprite.visible`, `.sprite.x`, `.sprite.y`, and `.sprite.rotation`.
  - Zero changes to spawn curves, drops, wave logic, or pool lifecycles.

### B. Relative Simulation LOD (`playerAttackRadius + 90px`)
- **Dynamic Relative Distance Boundary:**
  $$\text{LOD Distance} = \text{playerAttackRadius} + 90\text{px}$$
  - Adapts dynamically as the player purchases Attack Range upgrades.
- **Inner Combat Zone (Full 60 FPS):**
  - Any enemy within `playerAttackRadius + 90px` updates at full 60 FPS with immediate homing physics, obstacle avoidance, full ailment evaluation, and rotation.
  - Ensures responsive, instant reaction as enemies enter weapon engagement range.
- **Outer March Zone (Staggered LOD):**
  - Distant enemies marching inward from the screen borders (beyond `attackRadius + 90px`) update on alternating frames (even indices on frame $A$, odd indices on frame $B$) with a normalized double-delta step ($2 \times \Delta$).
  - Off-screen enemies (`x < -30`, `x > GAME_WIDTH + 30`, `y < -30`, `y > GAME_HEIGHT + 30`) skip matrix updates and set `sprite.visible = false`.

### C. Fully Pre-Warmed 400-Sprite Projectile Pool
- **Strict Pre-Allocation at Boot (Zero Runtime Growth):**
  - Exactly 400 `Sprite` instances are pre-allocated during `Renderer.init()` and attached to `renderer.projectileContainer`.
  - No runtime allocations, no dynamic resizing, and no garbage-collector spikes during bullet-hell barrages.
  - Fast index-stack / free-list pointer for $O(1)$ allocation and recycling.

### D. Multi-Tier Adaptive Governor
- **Rolling Frame-Time Window:**
  - Exponential moving average over 60 frames in `GameManager`.
  - Downgrade trigger: Average frame time $> 18.5\text{ms}$ (< 54 FPS) sustained for 2.0 seconds.
  - Recovery trigger: Average frame time $< 15.0\text{ms}$ (> 66 FPS) sustained for 8.0 seconds.
- **Tier Levels & LOD Coupling:**
  - **Tier 0 (Standard High Fidelity):** Full DPR (up to 2.0), outer enemies at 30 FPS LOD, standard VFX caps.
  - **Tier 1 (Performance):** 1.0 DPR, outer enemies at 30 FPS LOD, tightened VFX concurrency caps.
  - **Tier 2 (Ultra High Density):** 1.0 DPR, aggressive 3-frame LOD for distant outer enemies (20 FPS outer march), strict VFX caps (max 10 explosions, max 12 rockets, simplified particle bursts).

---

## 3. Sequential 6-Stage Implementation Plan

Each stage is completely modular, allowing verification after each phase:

### Stage 1: Enemy Rendering Architecture (Texture Atlas & Pooled Sprites)
- **Files:** `src/game/constants.ts`, `src/game/Renderer.ts`, `src/game/Simulation.ts`
- **Actions:**
  1. Define `EnemyTextureAtlas` in `Renderer.ts`. During `renderer.init()`, generate 128×128 pure-white base textures for all 15 enemy types:
     - `red_square`, `orange_triangle`, `big_square`, `circle`
     - `purple_pentagon` (5-pointed star + pupil)
     - `gold_hexagon` (dual tech hexagon)
     - `emerald_diamond` (dual shard geometry)
     - `crimson_octagon` (armored octagonal plate)
     - `enraged_trapezium` (armored wedge)
     - `disruptor_emp` (EMP ring + circuit notches)
     - `reflector_prism` (faceted prism)
     - `splitter_cluster` (triad cluster)
     - `cluster_mini` (mini emerald shard)
     - `phase_shifter` (9-pointed quantum star + aperture)
     - `boss` (10-pointed star + crown ring + 3 satellite orbs)
  2. In `Simulation.ts`, update `Entity` interface to use `sprite: Sprite`.
  3. Keep existing `enemyPools` structure intact, only updating pooled object visual instantiation from `Graphics` to `Sprite`.
  4. Ensure sprite anchoring (`anchor.set(0.5, 0.5)`) and color tinting match previous appearance pixel-for-pixel.

### Stage 2: Simulation LOD & Relative Distance Threshold
- **Files:** `src/game/Simulation.ts`, `src/game/constants.ts`
- **Actions:**
  1. Add relative threshold calculation: `const lodThreshold = attackRadius + 90;`.
  2. Implement alternating-frame update loop for enemies where distance from player $> \text{lodThreshold}$.
  3. Add viewport boundary culling (`sprite.visible = false`) for off-screen enemies.
  4. Cap neighbor separation checks to a maximum of 4 neighbors per enemy when total count $> 250$.

### Stage 3: Fully Pre-Warmed 400-Sprite Projectile Pool
- **Files:** `src/game/Renderer.ts`, `src/game/Simulation.ts`
- **Actions:**
  1. Pre-bake laser bolt, bullet, plasma sphere, and enemy projectile textures.
  2. Fully pre-warm 400 `Sprite` instances in `renderer.projectileContainer` on boot (strictly no runtime growth).
  3. Convert player firing routines (`standard`, `gatling`, `plasma_beam`, `calamity_shell`, `singularity_vortex`, `octo_strike`, `double_shot`) and enemy shooting to acquire from the 400-sprite pre-warmed pool.
  4. Enforce $O(1)$ recycling back into the free stack when projectiles expire or exit boundaries.

### Stage 4: Special Effects Concurrency Caps & Quality Tiers
- **Files:** `src/game/Simulation.ts`, `src/game/constants.ts`
- **Actions:**
  1. Implement hard concurrency limits:
     - Max active explosions: 16 (Tier 2: 10)
     - Max active rockets: 24 (Tier 2: 14)
     - Max active lightning arcs: 12 (Tier 2: 8)
     - Max active mortar reticles: 4 (Tier 2: 3)
  2. Recycle or discard lowest-priority excess effects when thresholds are reached.

### Stage 5: Adaptive Frame-Time Governor & Settings UI
- **Files:** `src/game/GameManager.ts`, `src/types.ts`, `src/components/SettingsModal.tsx`
- **Actions:**
  1. Implement rolling EMA frame-time monitor in `GameManager.loop` with 18.5ms downgrade and 15.0ms recovery thresholds.
  2. Couple Tier 2 quality level to enhanced distant enemy LOD staggering (3-frame stagger).
  3. Expose **High-Density Performance Mode**, **Adaptive Scaling Toggle**, and **Debug Performance HUD** in `SettingsModal.tsx` under the **Performance** tab.

### Stage 6: Polish, Tab Sleep & Verification
- **Files:** `src/game/GameManager.ts`, `src/components/GameCanvas.tsx`
- **Actions:**
  1. Add `visibilitychange` listener to sleep simulation and audio when tab is backgrounded.
  2. Add optional debug HUD badge displaying live FPS, Active Enemies, Projectiles, and VFX count.
  3. Validate build via `compile_applet` and `lint_applet`.

---

## 4. Mobile Testing & Benchmarking Plan

1. **Synthetic Spawn Stress Test:**
   - Add testing method `gameManager.spawnTestHorde(count: number)` to test 400, 800, and 1,200 simultaneous enemies on demand.
2. **Visual Parity Audit:**
   - Side-by-side verification of all 15 enemy shapes and boss variants to confirm identical geometry, strokes, and rotation.
3. **Frame-Rate Validation:**
   - Sustained 60 FPS ($\le 16.6\text{ms}$) on mobile browsers at 500+ active enemies and 200+ projectiles.
4. **Zero-Allocation Verification:**
   - Flat memory footprint over 5-minute stress sessions with zero garbage-collection spikes.
