# Tactical & Combat Overhaul: Cosmic Shards, Defeat Flow, Orbiters, Boss Progression & Matrix GUI

Delivers a comprehensive overhaul of core combat, permanent meta-progression, boss cadence, and UI systems in Pixel Pentagons. Guarantees zero defeat freezes via an atomic latch, implements a rewarding Cosmic Shard roguelike progression economy, re-engineers dynamic spiraling orbiters, establishes a 10-wave rotating boss cadence with wave 5 elite packs, and remasters the Tactical Skills & Synergy GUI into a high-octane cyberpunk matrix deck.

### User Review & Critical Decisions

> [!IMPORTANT]
> All core technical decisions and specifications have been solidified and integrated:
> - **Zero Defeat Freezes & Softlocks**: Locked atomic `isHandlingDeath` latch in `Simulation.ts` and direct store dispatching to guarantee instant, seamless display of the Death Summary and Ascension screen without ticker freezes or blank canvases.
> - **Cosmic Shard Roguelike Economy**: Player restarts from Wave 1 upon defeat. Cosmic Shards are the permanent cross-run currency with a generous first-death leeway bonus (~25–30 shards for 2–3 instant upgrades) and balanced subsequent formulas scaling with wave milestones, kills, and wave drips.
> - **Anti-Immortality & Scaled Damage Floor**: Hard 90% defense cap (`Math.min(0.90, defensePercent)`) combined with an evolving late-game damage floor (`Math.max(1, rawDamage * 0.1, playerMaxHp * (0.002 + wave * 0.0001))`) to maintain genuine stakes against runaway HP growth.
> - **Dynamic Scaling Orbiters**: Circle enemies orbit at $0.75 \times$ player weapon range (minimum 25 px standoff), spiraling inward with speed scaling by wave number so they remain high-threat targets at all upgrade stages.
> - **Boss Cadence & Shields on Wave 50+**: Major rotating geometric bosses spawn every 10 waves (`wave % 10 === 0`). Energy shields strictly unlock at Wave 50+. Waves ending in 5 (`wave % 10 === 5`) feature elite vanguard packs to keep the early game engaging.
> - **Mobile-First HUD & Matrix Deck**: Non-overlapping top-bar layout with safe-area insets, elimination of duplicate speed controls, and a remastered Cyberpunk Matrix Deck for skills and synergies with $\ge 48\text{px}$ touch targets.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Permanent Roguelike Meta-Progression**: Establishes Cosmic Shards as the defining cross-run meta-currency. Earned primarily through death settlement, consistent wave drips, and elite/boss bounties. Players restart from Wave 1 every death, spending permanent shards on game-altering upgrades (Core Hull, Kinetic Accelerator, Scrap Converter, Critical Matrix).
  2. **Atomic Defeat Transition & Telemetry**: Replaces fragile callback chains with an atomic latch (`isHandlingDeath`), instantaneously logging settlement telemetry, purging active projectiles and entities, and bringing up the Death Summary without freeze or softlock.
  3. **High-Threat Dynamic Orbiters**: Re-architects circling enemies so their orbit radius adapts in real time to the player's weapon range while steadily closing distance with wave-scaled spiral velocity.
  4. **Geometric Boss Encounters & Elite Cadence**: Introduces 5 signature geometric bosses (Apex Decagon, Pulsar Star, Vortex Hexagon, Prism Colossus, Hyper-Tesseract) appearing every 10 waves, with shields reserved strictly for Wave 50+. Waves ending in 5 deploy elite vanguard mini-packs to maintain combat rhythm.
  5. **Mobile-First Cyberpunk Matrix Deck**: Remasters the Tactical Skills and Synergy HUD into a modular, responsive matrix deck with slot equip/unequip flows, real-time combo calculation, and ergonomic touch targets.

- **Target Audience / Persona**:
  - Incremental and tower defense enthusiasts who value deep theorycrafting, satisfying permanent progression curves, crisp tactile visual feedback, and reliable mobile gameplay without stutter or softlocks.

- **Key Value**:
  - Turns every failed run into meaningful permanent progression, resolves game-breaking combat bugs and freezes, and elevates visual clarity with mobile-optimized HUD architecture.

---

## 2. User Experience & Visual Design

### Key User Flows

#### 1. The Defeat & Shard Settlement Flow (Zero-Freeze Guarantee)
```
[Player HP reaches 0]
       │
       ▼
[Simulation.ts: isHandlingDeath latch trips (Atomic)]
       │ ──> Halts enemy attacks & projectile collisions
       │ ──> Purges residual entities and projectiles cleanly
       │ ──> Computes shard settlement (Base + Wave + Kills + First-Death Leeway)
       │ ──> Emits structured telemetry log
       ▼
[State Dispatch: handlePlayerDeath]
       │
       ▼
[DeathSummary Modal slides in (<150ms)]
       │ ──> Displays Waves Cleared, Total Enemies Slain, Cosmic Shards Harvested
       │ ──> "Spend Shards" button navigates to Permanent Workshop / Ascension
       │ ──> "Deploy Sentinel" resets arena to Wave 1 with clean state
```

#### 2. Cosmic Shard Permanent Meta-Progression
- **First Death Leeway**: On a player's first defeat, a one-time bonus of **+30 Cosmic Shards** is awarded alongside standard earnings. This immediately unlocks 2–3 meaningful Tier 1 upgrades (e.g., +10% base damage and +15% hull capacity), ensuring newcomers instantly experience tangible power progression.
- **Run-to-Run Flow**:
  - In-run cash and cash upgrades reset upon death.
  - Cosmic Shards, Lab research, Skill matrix levels, and unlocked Card slots persist permanently.
  - Permanent upgrades provide robust, noticeable percentage and flat gains (e.g., +10% base damage, +5% crit chance, +10% scrap conversion), never insulting microscopic increments.

#### 3. Orbiting Shooter Threat Dynamics
- Orbiters spawn on the outer rim and smoothly glide into an orbit radius calculated dynamically:
  $$r_{\text{orbit}} = \min(R_{\text{attack}} \times 0.75, R_{\text{attack}} - 25)$$
- If the player purchases weapon range upgrades mid-run, the orbiters smoothly track and expand to the new perimeter.
- They steadily spiral inward at a wave-scaled rate:
  $$v_{\text{spiral}} = 1.5 \times (1 + \text{Wave} \times 0.015) \text{ px/s}$$
  reaching a minimum standoff radius of $25\text{px}$, forcing the player to prioritize them before they deal point-blank contact damage.

#### 4. Boss & Elite Wave Cadence
- **Waves 1–4, 6–9, 11–14, etc.**: Standard geometric waves (triangles, squares, pentagons, orbiters).
- **Waves 5, 15, 25, 35, 45... (Wave % 10 === 5)**: **Elite Vanguard Waves**. Spawns 2–3 gilded champion enemies with $+50\%$ HP, distinct glowing borders, and guaranteed $+1$ Cosmic Shard drops upon defeat.
- **Waves 10, 20, 30, 40, 50... (Wave % 10 === 0)**: **Major Boss Encounters**.
  - A brief boss entry banner displays archetype and subtitle.
  - Boss health bar renders centered at the top without overlapping side HUD elements.
  - **No shields** exist on bosses prior to Wave 50.
  - **Wave 50+**: The Hyper-Tesseract introduces dual-phase harmonic shields (blue overshield bar).

#### 5. Remastered Tactical Matrix Deck
- Accessible from the main HUD dock via a streamlined "Tactical Matrix" button.
- **Equip / Unequip Flow**:
  - Up to 5 unlocked matrix slots displayed at the top.
  - Tapping an empty slot highlights compatible skills in the inventory.
  - Tapping an equipped skill reveals a modal drawer with details, stats, upgrade cost, and an immediate "Unequip" action.
  - Tapping any inventory skill displays an "Equip to Slot [N]" action button.
- **Real-Time Synergy Badges**:
  - Equipping 2 or 3 matching elemental/tactical affinities (e.g., *Overcharge*, *Vortex*, *Cryo*, *Hyper-Kinetic*) illuminates animated neon synergy badges with active multiplicative bonuses (e.g., `+25% Chain Lightning Range`, `+15% Stun Duration`).

### Visual Identity & Theme

- **Aesthetic Direction**: High-contrast Cyberpunk Void Minimalist. Crisp mathematical geometry, clean dark slate containers, glowing neon vector highlights, and strict anti-slop zero-pill typography.
- **Color Palette & Theme Tokens**:
  - Canvas / Void: Deepest obsidian `#05070b`
  - Container / Surface: Obsidian slate `#0b0f17` (`border border-slate-800/80`)
  - Accent Primary (Kinetic / Tech): Neon Cyan `#06b6d4`
  - Accent Secondary (Cosmic Shards): Astral Violet `#a855f7`
  - Accent Danger / Boss: Crimson Laser `#f43f5e`
  - Accent Gold / Elite: Solar Amber `#f59e0b`
- **Typography & Hierarchy**:
  - Display / Headings: `Plus Jakarta Sans` or `Outfit` (Bold / SemiBold, tracking-tight)
  - Data / Counters / Economy: `JetBrains Mono` or `IBM Plex Mono` (`tabular-nums`)
  - Clean unboxed metadata with dot separators (`Wave 42 · 1,420 Kills · Tier 1`)
- **Mobile-First Layout & Touch Targets**:
  - Minimum touch target size: $\ge 44\text{px}$ across all mobile buttons; primary action buttons $\ge 48\text{px}$.
  - Top bar and HUD widgets incorporate `env(safe-area-inset-top)` with `pt-safe`.
  - Bottom upgrade dock incorporates `env(safe-area-inset-bottom)` with `pb-safe`.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Roguelike Economy Balance & Shard Progression Formula
- **Chosen Approach**:
  - Player always restarts at Wave 1 on defeat.
  - Total Cosmic Shards awarded on death:
    $$\text{Shards}_{\text{death}} = \text{Base}_{\text{death}} + \lfloor \text{HighestWave} \times 0.5 \rfloor + \lfloor \text{Kills} \times 0.01 \rfloor + \text{Bonus}_{\text{leeway}}$$
    where $\text{Base}_{\text{death}} = 5$, and $\text{Bonus}_{\text{leeway}} = 30$ (on first death only).
  - Continuous in-run shard drip: $+1$ Cosmic Shard every 2 waves cleared directly credited during run.
  - Elite kill bonus: $+1$ to $+2$ shards on kill.
  - Boss kill bonus: $+5$ shards (Waves 10–40), $+10$ shards (Waves 50+).
  - Permanent upgrade pricing curve:
    - Tier 1 upgrades (Hull Plating, Damage Core, Scrap Harvester): Base 5 shards, cost multiplier $1.35\times$ per level. Grants $+10\%$ flat base attack or $+15\%$ max HP.
    - Tier 2 upgrades (Crit Matrix, Attack Range, Shield Generator): Base 25 shards, cost multiplier $1.45\times$.
    - Tier 3 upgrades (Overdrive Capacitor, Shard Multiplier): Base 100 shards, cost multiplier $1.60\times$.
- **Why**: Eliminates the frustration of ending a run empty-handed, delivers immediate gratification on the first death, and prevents inflation while ensuring upgrades always feel powerful.
- **Alternatives Considered**: Retaining wave checkpointing (e.g. restart at wave 20). *Rejected*: Dilutes the tower defense loop and makes early-game economy upgrades redundant.

### Decision 2: Anti-Immortality Hard Defense Cap & Scaled Damage Floor
- **Chosen Approach**:
  - Defense reduction capped at a hard maximum of $90\%$ (`defensePercent = Math.min(0.90, defensePercent)`).
  - Damage calculation applies an evolving floor:
    $$\text{EffectiveDamage} = \max\left(1, \lfloor \text{RawDamage} \times 0.10 \rfloor, \lfloor \text{PlayerMaxHP} \times (0.002 + \text{Wave} \times 0.0001) \rfloor\right)$$
  - When `playerHp <= 0` or `isDead`, HP regeneration is completely frozen.
- **Why**: High-HP or max-armor builds can no longer trivialize deep waves by taking 0 damage, eliminating infinite AFK immortality loops while keeping defense meaningful.

### Decision 3: Dynamic Orbiting Shooters with Inward Spiral
- **Chosen Approach**:
  - Orbiters anchor their trajectory at $75\%$ of the player's weapon range (or $\text{range} - 25\text{px}$, whichever is smaller).
  - Orbit angle updates at constant angular speed ($\omega \approx 1.2 \text{ rad/s}$), while radius decreases by $v_{\text{spiral}} = 1.5 \times (1 + \text{Wave} \times 0.015) \text{ px/s}$ until reaching the $25\text{px}$ standoff limit.
  - When the player purchases range upgrades, the orbiters' maximum outer threshold smoothly expands so they never drift into an untargetable dead zone.
- **Why**: Ensures circle enemies remain interactive targets inside player turrets while creating rising positional tension as they tighten their spiral.

### Decision 4: Boss Wave Cadence & Five Unique Archetypes
- **Chosen Approach**:
  - Major bosses spawn strictly when `wave % 10 === 0`.
  - Waves where `wave % 10 === 5` spawn mini-elite packs (2–3 champion triangles/squares).
  - Shields are strictly disabled for all bosses before Wave 50.
  - **Five Unique Archetypes**:
    1. **Apex Decagon** (Wave 10, 60...): Massive 10-sided juggernaut. Fires 8-way radial projectile rings every 3 seconds.
    2. **Pulsar Star** (Wave 20, 70...): Agile star-shaped boss. Emits periodic sweeping laser bursts and high-velocity pulse darts.
    3. **Vortex Hexagon** (Wave 30, 80...): Rotating hexagon with dual kinetic deflectors and a gravitational aura that pulls stray player bullets.
    4. **Prism Colossus** (Wave 40, 90...): Triangular prism that refracts incoming player fire into split micro-shards and deploys 4 drone escorts.
    5. **Hyper-Tesseract** (Wave 50, 100...): Four-dimensional cube projection with harmonic overshield (blue barrier), phased micro-teleportation, and quantum beam strikes.
- **Why**: Gives each 10-wave milestone a distinct tactical flavor while introducing mechanical complexity gradually.

### Decision 5: Non-Overlapping HUD Layout & Single Speed Control
- **Chosen Approach**:
  - Move `SpeedIndicatorHUD` to top-left (`left-3 top-3`), featuring unified $1\times / 2\times / 3\times$ speed toggle and pause.
  - Remove duplicate speed stepper and pause controls from `UpgradePanel.tsx`.
  - Constrain `BossHealthBar` width to `max-w-[calc(100vw-180px)]` on mobile and `max-w-md` on desktop, centered horizontally at `left-1/2 -translate-x-1/2 top-3 z-30`.
- **Why**: Eliminates button conflicts, prevents boss health bars from obscuring speed buttons, and saves vertical space for touch devices.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              GameManager                               │
│            Manages main animation frame, delta time, audio             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ticks
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             Simulation.ts                              │
│  - SpatialGrid: collision queries, targeting, range calculations       │
│  - Orbiting Shooters: dynamic r = f(weaponRange), inward spiral delta   │
│  - Boss Generator: wave % 10 === 0 (5 archetypes, shields on wave 50+) │
│  - Elite Vanguard: wave % 10 === 5 (mini-packs, shard bounties)        │
│  - Combat Pipeline: 90% hard defense cap, late-game scaled damage floor │
│  - Atomic Death Latch: isHandlingDeath flag + instant entity purge     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ state updates & atomic death events
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Zustand Store (gameStore.ts)                    │
│  - Currency State: cash (run-only), cosmicShards (permanent cross-run) │
│  - handlePlayerDeath: awards base + wave + kill + leeway shards        │
│  - respawnAndReset: resets arena to Wave 1, restores HP, keeps shards  │
│  - IndexedDB Persistence: auto-saves permanent progression             │
└──────────────┬───────────────────────────────────────────┬─────────────┘
               │                                           │
               ▼                                           ▼
┌─────────────────────────────────────────┐ ┌────────────────────────────┐
│              Combat HUD                 │ │     Tactical Matrix GUI    │
│ - SpeedIndicatorHUD (top-left, no dup)  │ │ - 5-Slot Matrix Deck       │
│ - BossHealthBar (centered, responsive)  │ │ - Live synergy calculation │
│ - DeathSummary (zero-freeze modal)      │ │ - Mobile touch targets     │
│ - UpgradePanel (bottom dock, 48px min)  │ │ - Permanent Workshop view  │
└─────────────────────────────────────────┘ └────────────────────────────┘
```

### Data Model & State Schema

```typescript
// Core Permanent Progression State
interface PermanentUpgrades {
  coreHullLevel: number;        // +15% Max HP per level (Base 5 shards, 1.35x)
  kineticAcceleratorLevel: number; // +10% Base Damage per level (Base 5 shards, 1.35x)
  scrapConverterLevel: number;  // +10% Cash Multiplier per level (Base 8 shards, 1.35x)
  criticalMatrixLevel: number;  // +3% Crit Chance, +15% Crit DMG (Base 25 shards, 1.45x)
  rangeEnhancerLevel: number;   // +8px Weapon Range (Base 20 shards, 1.40x)
  shieldHarmonizerLevel: number;// +2% Global Defense, max 90% cap (Base 50 shards, 1.50x)
}

// Boss Archetype Definition
type BossArchetypeId = 'apex_decagon' | 'pulsar_star' | 'vortex_hexagon' | 'prism_colossus' | 'hyper_tesseract';

interface BossConfig {
  id: BossArchetypeId;
  name: string;
  subtitle: string;
  color: string;
  sides: number;
  hasShield: boolean; // true ONLY if wave >= 50
  attackCooldown: number;
  signatureAbility: (boss: any, sim: any, dt: number) => void;
}

// Telemetry Payload for Zero-Softlock Auditing
interface DeathTelemetryPayload {
  timestamp: number;
  wave: number;
  highestWaveEver: number;
  totalKills: number;
  shardsEarned: {
    base: number;
    waveBonus: number;
    killBonus: number;
    leewayBonus: number;
    total: number;
  };
  newShardBalance: number;
  clearedEntitiesCount: number;
  isFirstDeath: boolean;
}
```

### Interactive Component & State Mapping

1. **`Simulation.ts`**:
   - `isHandlingDeath` boolean latch initialized to `false`.
   - In `takeDamage(amount)`:
     - Applies `defense = Math.min(0.90, this.playerDefense)`.
     - Applies scaled damage floor: `Math.max(1, rawDamage * 0.1, playerMaxHp * (0.002 + wave * 0.0001))`.
     - When `this.playerHp <= 0`:
       - If `this.isHandlingDeath` is `true`, immediately return (prevents duplicate triggers).
       - Set `this.isHandlingDeath = true`.
       - Stop particle updates, clear enemy projectiles, log telemetry payload.
       - Call `this.onPlayerDeath(...)` to notify store.
   - In `spawnWave()`:
     - Check `if (wave % 10 === 0)` $\rightarrow$ Spawn designated boss archetype from rotation `[(wave / 10 - 1) % 5]`. Set `hasShield = wave >= 50`.
     - Check `if (wave % 10 === 5)` $\rightarrow$ Spawn Elite Vanguard mini-pack (3 elite champions).
   - In `updateOrbiters(dt)`:
     - Compute target radius from `this.playerRange`.
     - Update orbit angle and decrease radius by $v_{\text{spiral}}$.
2. **`useGameStore.ts`**:
   - `handlePlayerDeath()`:
     - Detects `isFirstDeath` flag from state.
     - Calculates shard settlement using locked formulas.
     - Sets `hasDiedOnce: true`.
     - Updates `cosmicShards += totalEarned`.
     - Populates `deathSummary` object and sets `isGameOver: true`.
   - `respawnAndReset()`:
     - Resets `wave = 1`, `cash = 0`, `playerHp = playerMaxHp`.
     - Clears all entities in `simulation`.
     - Resets `simulation.isHandlingDeath = false`.
     - Sets `isGameOver = false`.
3. **`DeathSummary.tsx`**:
   - Displays clear breakdown:
     - Wave Reached
     - Enemies Terminated
     - Cosmic Shards Harvested (with "+30 First Sentinel Leeway!" badge if applicable)
   - "Workshop / Ascension" button opens permanent upgrade deck.
   - "Deploy Sentinel" button triggers `respawnAndReset()`.
4. **`SpeedIndicatorHUD.tsx` & `BossHealthBar.tsx`**:
   - `SpeedIndicatorHUD`: Top-left anchored (`left-3 top-3`), minimal width, standard speed buttons ($1\times, 2\times, 3\times$, pause) with $44\text{px}$ touch targets.
   - `BossHealthBar`: Centered horizontally, fixed max-width with shield meter strictly visible when `boss.hasShield === true`.
5. **`UpgradePanel.tsx`**:
   - Redundant speed buttons removed from header.
   - Clean category tabs (Attack, Defense, Utility).
   - Sticky drawer toggle with safe bottom padding for iOS/Android viewports.
6. **`CompendiumModal.tsx` & `ActiveRareDropsHUD.tsx` (Matrix Deck Remaster)**:
   - Cyberpunk matrix grid with 5 equipped slots at the top.
   - Interactive badge rack calculating active synergies in real-time.
   - Scrollable skill inventory with filter tags and direct equip/unequip drawer.

---

## 5. Verification & Telemetry Plan

1. **Defeat Transition & Zero-Freeze Verification**:
   - Run simulation test forcing `playerHp = 0`.
   - Verify `[DEATH_LATCH]` console log emits within 1 frame.
   - Verify `DeathSummary` modal appears immediately without game canvas freezing or becoming unresponsive.
   - Verify clicking "Deploy Sentinel" resets to Wave 1 without residual enemy projectiles or double deaths.
2. **Cosmic Shard Economy Balancing Verification**:
   - Test first death: Verify $+30$ leeway shards are awarded and can purchase 2–3 Tier 1 upgrades.
   - Test subsequent death at Wave 25 with 500 kills:
     $$\text{Shards} = 5 + \lfloor 25 \times 0.5 \rfloor + \lfloor 500 \times 0.01 \rfloor = 5 + 12 + 5 = 22 \text{ shards}$$
   - Verify shard balance persists across full page reloads via IndexedDB.
3. **Orbiting Shooter Scaling Verification**:
   - Spawn circle orbiter with base range ($110\text{px}$). Verify orbit radius is $\approx 82.5\text{px}$.
   - Upgrade range to $180\text{px}$. Verify orbit radius smoothly moves to $135\text{px}$.
   - Verify orbiter spirals inward at calculated velocity down to the $25\text{px}$ standoff threshold.
4. **Boss Cadence & Shield Verification**:
   - Inspect waves 10, 20, 30, 40: Verify bosses spawn with unique attacks and zero shields.
   - Inspect wave 50: Verify Hyper-Tesseract spawns with blue overshield bar.
   - Inspect waves 5, 15, 25: Verify elite vanguard packs spawn with $+50\%$ HP and shard drop bounties.
5. **Anti-Immortality Verification**:
   - Upgrade defense to maximum. Verify `defensePercent` never exceeds $0.90$.
   - Verify incoming attacks deal at least the computed minimum damage floor, ensuring player can eventually take damage.
6. **HUD & Mobile Layout Verification**:
   - Test viewport at $375\text{px} \times 667\text{px}$ (mobile) and $1440\text{px} \times 900\text{px}$ (desktop).
   - Confirm zero overlap between `SpeedIndicatorHUD` and `BossHealthBar`.
   - Confirm all touch targets meet or exceed $44\text{px}$.
