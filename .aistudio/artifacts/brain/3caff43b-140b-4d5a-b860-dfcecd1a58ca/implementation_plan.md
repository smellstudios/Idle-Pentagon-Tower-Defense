# Tactical & Combat Overhaul: Shards, Defeat Flow, Orbiters, Boss Progression & GUI Remaster

Fixes cosmic shard awards and resolves the game freeze / softlock on defeat. Completely reworks orbiting shooters so they spiral inside weapon range, eliminates immortality edge-cases and rapid regression glitches, overhauls boss encounters to spawn every 10 waves with shields beginning at wave 50 alongside 5 unique rotating bosses, eliminates HUD speed collisions and duplicate controls, and remasters the Tactical Skills & Synergy GUI into a sleek cyberpunk matrix deck.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions and clarifications are incorporated:
> - **Game Freeze on Defeat Fix**: Guarantee seamless transition into the Death Summary & Ascension view upon reaching 0 HP without softlocking, halting ticker updates, or leaving a blank frozen canvas.
> - **Immortality & Rapid Regression Prevention**: Cap defense reduction safely (max 90%), prevent negative HP floating-point traps, enforce a single atomic death state transition (`isHandlingDeath` latch) to eliminate rapid multi-death regression loops, and ensure instant clean entity purging on respawn so lingering attacks cannot insta-kill a fresh run.
> - **Boss Archetypes**: Rotating geometric archetypes with escalating unique signature attacks every 10 waves. Shields will strictly begin at Wave 50+.
> - **Orbiting Shooters Behavior**: Dynamic orbital radius anchored inside the player's weapon range, spiraling slowly inward over time while adapting seamlessly as the player upgrades attack radius.
> - **Tactical Skills & Synergy GUI**: Sleek cyberpunk matrix deck layout featuring compact skill matrix cards, clear rarity neon accents, and interactive synergy badges.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Defeat Freeze & Cosmic Shard Acquisition**: Eliminates the stale callback softlock that caused the game to freeze on defeat. Ensures the Death Summary and Ascension screen always pop up instantly with fully credited cosmic shards and cash reserves.
  2. **Combat Reliability & Glitch Hardening**: Fixes immortality bugs (hard-capping defense so player always takes damage when hit, fixing HP clamping) and eliminates rapid regression glitches where wave counters or death summaries rapidly re-triggered.
  3. **Orbiting Shooter Combat Rework**: Re-engineers the circle enemy so its orbit radius dynamically calculates from player attack range, spiraling inward over time so it is never untargetable.
  4. **Wave 10 Boss Encounter Cadence**: Updates boss wave timing from every 5 waves to every 10 waves (`wave % 10 === 0`). Removes shields from all bosses under wave 50, and introduces 5 progressive, uniquely designed geometric bosses (Apex Decagon, Pulsar Star, Vortex Hexagon, Prism Colossus, Hyper-Tesseract) with custom silhouettes and attack patterns.
  5. **HUD Clean-Up**: Resolves the positioning conflict between `SpeedIndicatorHUD` and `BossHealthBar`, and removes the redundant speed stepper from `UpgradePanel.tsx`.
  6. **Remastered Tactical Matrix GUI**: Overhauls `CompendiumModal.tsx` and `ActiveRareDropsHUD.tsx` into an elegant cyberpunk matrix deck with high-contrast rarity borders, compact card heights, responsive slot management, and readable synergy indicators.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Defeat & Ascension Flow (No Freezing)**:
   - When player HP reaches 0, a brief satisfying defeat impact / sound plays, the simulation cleanly pauses combat, and the Death Summary modal immediately slides into view.
   - The recap displays earned Cosmic Shards, slain foes, and reserved cash.
   - Clicking "Deploy Sentinel" instantaneously resets the arena cleanly without lingering projectiles or instant double-death loops.
2. **Combat Against Orbiters**:
   - Circle enemies enter orbit at 70–75% of the fortress's current attack radius.
   - Over time, they spiral inward toward a secondary combat perimeter. If the player buys range upgrades in real time, the orbiters smoothly re-anchor inside the newly expanded zone.
3. **Boss Encounters (Waves 10, 20, 30, 40, 50+)**:
   - Every 10 waves, a boss entry banner announces the boss name and geometric title.
   - Bosses between waves 10–40 have no shields, focusing purely on distinct combat abilities (e.g. projectile rings, rotating barriers, gravitational pulls).
   - At wave 50+, the Hyper-Tesseract introduces the first harmonic energy shield with an overshield bar and phased teleports.
   - `BossHealthBar` is centered at the top with responsive padding so it never covers the speed controls or side HUD widgets.
4. **Tactical Skills & Synergy Matrix**:
   - Modernized cyberpunk matrix deck with compact skill tiles showing icon, protocol name, rank, and upgrade cost in shards/gems/copies.
   - High-contrast visual slots for equipped skills (1 to 5 slots) and active combo badges.

### Visual Hierarchy & Palette
- **Arena & Modal Background**: Deep void carbon (`#07090e` / `#0b0f19`) with subtle radial gradients.
- **Rarity Neon Accents**:
  - Common: Steel Cyan (`#38bdf8`)
  - Rare: Emerald Matrix (`#10b981`)
  - Epic: Royal Violet (`#a855f7`)
  - Legendary: Solar Amber (`#f59e0b`)
  - Mythic: Nova Rose (`#f43f5e`)
- **Zero-Pill Restraint**: Metadata rendered with clean dot separators (`·`) and high-contrast typography, reserving buttons strictly for clickable actions.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Atomic Defeat Handling & State Lock**:
  - *Chosen Approach*: Implement an atomic `isHandlingDeath` latch in `Simulation.ts` and dispatch directly to `useGameStore.getState().handlePlayerDeath(...)`.
  - *Why*: Prevents the simulation from silently stalling or re-triggering defeat events multiple times, and guarantees cosmic shards are awarded and the Death Summary UI is displayed.
  - *Alternatives Considered*: Depending entirely on React component callback props (rejected: prone to stale closures and timing delays).

- **Decision 2: Immortality Safeguards & Combat Math Sanity**:
  - *Chosen Approach*: Hard-cap `defensePercent` to 0.90 (90%) and enforce a minimum damage floor of `Math.max(1, rawDamage * 0.1)` on incoming hits. Disable HP regeneration when `playerHp <= 0` or `isDead`.
  - *Why*: Prevents invincible builds where incoming damage drops to 0 or negative, while maintaining meaningful defensive scaling.

- **Decision 3: Dynamic Radial Anchoring for Orbiting Enemies**:
  - *Chosen Approach*: Calculate orbiter target radius as `Math.min(playerAttackRadius * 0.75, playerAttackRadius - 25)` with a slow continuous inward spiral of 1.5px/s.
  - *Why*: Guarantees enemies are always well within range whether the player has base range (110px) or max upgraded range (200px+), while preserving the strategic identity of orbiting shooters.

- **Decision 4: Clean HUD Separation & Single Speed Control**:
  - *Chosen Approach*: Keep `SpeedIndicatorHUD` on top-left, constraint `BossHealthBar` width to prevent collision, and remove duplicate speed controls from `UpgradePanel.tsx`.
  - *Why*: Eliminates visual clutter and prevents touch target conflicts.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                      Game Loop                         │
│  (Simulation.ts: update, spatial grid, entity logic)   │
└──────────────┬──────────────────────────┬──────────────┘
               │                          │
               ▼                          ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│       Orbiting Enemies       │ │     Boss Generation          │
│ - dynamic r = f(range)       │ │ - wave % 10 === 0            │
│ - inward spiral delta        │ │ - shields ONLY on wave >= 50 │
│ - threat targeting guarantee │ │ - 5 unique boss archetypes   │
└──────────────┬───────────────┘ └──────────────┬───────────────┘
               │                                │
               ▼                                │
┌───────────────────────────────────────────────▼───────────────┐
│               Global Store (gameStore.ts)                     │
│  - Atomic handlePlayerDeath: awards base + bonus cosmic shards│
│  - Anti-immortality cap & clean respawn reset                 │
│  - IndexedDB async auto-persistence                           │
└──────────────┬────────────────────────────────────────────────┘
               │
               ▼
┌───────────────────────────────────────────────────────────────┐
│                       UI Layer                                │
│  - App.tsx: non-freezing defeat transition, clean HUD layout  │
│  - UpgradePanel.tsx: single clean control dock (no dup speed) │
│  - CompendiumModal.tsx: remastered Cyberpunk Matrix Deck     │
│  - ActiveRareDropsHUD.tsx: compact side synergy widget        │
└───────────────────────────────────────────────────────────────┘
```

### Affected Files & Components
1. `src/game/constants.ts`:
   - Update `WAVE_CONFIG.isBossWave` to `wave => wave % 10 === 0`.
   - Add configuration for 5 unique boss archetypes with signature patterns.
   - Calibrate circle enemy base stats and standoff constraints.
2. `src/game/Simulation.ts`:
   - Implement `isHandlingDeath` latch and atomic defeat trigger to prevent softlocking / game freezing.
   - Add defensive caps (max 90% defense reduction, min damage floor) to eliminate immortality bugs.
   - Re-engineer circle enemy orbit radius dynamically relative to `effectiveRadius` with inward spiral.
   - In `spawnEnemy` & `createEnemyEntity`, implement the 5 unique boss archetypes and guard shields with `wave >= 50`.
3. `src/game/GameManager.ts` & `src/hooks/useGame.ts` & `src/App.tsx`:
   - Ensure defeat dispatching uses live store state without stale closures.
   - Verify `handlePlayerDeath` awards cosmic shards, populates `deathSummary`, and triggers `DeathSummary` modal immediately without freezing.
4. `src/components/BossHealthBar.tsx` & `src/App.tsx`:
   - Adjust styling and bounds of `BossHealthBar` to prevent collision with `SpeedIndicatorHUD`.
   - Display unique boss titles and archetype badges.
5. `src/components/UpgradePanel.tsx`:
   - Remove duplicate speed controls from the header bar.
6. `src/components/CompendiumModal.tsx` & `src/components/ActiveRareDropsHUD.tsx`:
   - Remaster visual layout with cyberpunk matrix aesthetic, streamlined card dimensions, and clean synergy combo visualizers.
