# Tactical & Combat Overhaul: Universal Live Stat Sync, Cosmic Shards, Dynamic Orbiters & Matrix Deck

Delivers a comprehensive, production-grade technical and game-design specification for Pixel Pentagons. Establishes the permanent Cosmic Shard meta-progression loop, a **Universal Single-Source-of-Truth Live Stat Synchronization Engine** ensuring that any stat upgraded during active play or in the background is immediately and consistently reflected across all UI surfaces and the combat simulation with zero discrepancy, wave-scaled spiraling orbiters, polished 10-wave boss and 5-wave elite cadence, an evolving late-game damage floor against runaway HP, a cyberpunk mobile-first Tactical Matrix Deck, and atomic death latch telemetry guaranteeing zero softlocks.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following core design decisions and higher-tier systems are locked into this plan:
> - **Universal Single-Source-of-Truth Live Stat Synchronization (User Feedback Refinement)**:
>   - **The Core Problem Solved**: Previously, stats upgraded in the background or during active combat could display conflicting numbers between upgrade cards, HUD overviews, and actual bullet damage ("saying one thing then another thing").
>   - **The Unified Engine**: All stat sources (Base + Permanent Shards + Active Run Purchases + Equips / Chips + Synergies + Milestones) pipe through a single deterministic selector: `selectLiveEffectiveStats(state)`.
>   - **Instant Active Sync**: When any stat is upgraded while the game is running, the new value is pushed instantly to both the UI and `Simulation.ts` on the very same frame. If the Damage card shows `24.5 DMG`, the HUD says `24.5 DMG`, and the next projectile fired deals exactly `24.5 DMG`.
>   - **Applies to ALL Stats**: Damage, Fire Rate, Weapon Range, Max Health, Health Regen, Armor / Defense, Critical Strike Chance, Critical Multiplier, Cash Multiplier, and Shard Multiplier.
> - **Subsequent Death Zero-Shard Fix & Guaranteed Loop**:
>   - Resetting `isDeathHandledThisRunRef.current = false` in `App.tsx` and `this.isHandlingDeath = false` in `Simulation.resetRun()` guarantees the "die $\rightarrow$ upgrade permanently $\rightarrow$ restart from Wave 1" loop never locks up or awards 0 shards.
> - **Permanent Meta-Progression (Cosmic Shards)**:
>   - First death awards a **+30 Cosmic Shard Leeway Bonus**, immediately funding 2–3 permanent upgrades (e.g., Hull Integrity, Kinetic Caliber, Cash Minting).
>   - Subsequent deaths follow a predictable, transparent formula:
>     $$\text{Shards}_{\text{death}} = \max\left(12, \text{Base}_{\text{death}} (10) + \lfloor \text{Wave} \times 0.60 \rfloor + \lfloor \text{Kills} \times 0.015 \rfloor + \text{BossKills} \times 2\right)$$
>   - Steady drip: $+1\text{ Shard}$ awarded every even wave cleared, plus guaranteed drops on all non-red enemy shapes (+1 to +5 shards) and bosses (+10 to +25 shards).
> - **Scaled Dynamic Orbiters**:
>   - Circle orbiters maintain $0.75 \times \text{PlayerWeaponRange}$ dynamic orbit radius (minimum $25\text{px}$ standoff), with inward spiral speed scaling by wave number and player DPS to maintain high threat in deep runs.
> - **Boss Cadence & Wave 5 Elite Packs**:
>   - 5 rotating geometric boss archetypes appear every 10 waves (`wave % 10 === 0`).
>   - Harmonic energy shields unlock strictly at Wave 50+.
>   - Wave 5 intervals (`wave % 10 === 5`) spawn Elite Vanguard Packs (2–4 champion units with +75% HP and bonus shard bounties) to eliminate early mid-interval pacing voids.
> - **Evolving Late-Game Damage Floor & 90% Hard Defense Cap**:
>   - Defense capped at $90\%$. Damage floor scales with both raw hit percent and player max HP:
>     $$\text{DamageFloor} = \max\left(1, \lfloor \text{RawDamage} \times 0.10 \rfloor, \lfloor \text{PlayerMaxHP} \times (0.0025 + \text{Wave} \times 0.00015) \rfloor\right)$$
> - **Mobile-First Matrix Deck & Ergonomic HUD**:
>   - Cyberpunk Matrix Deck supports up to 5 skill slots with drag/tap equip/unequip, real-time synergy badge calculations, $\ge 48\text{px}$ touch targets, and full safe-area padding.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Universal Single-Source-of-Truth Live Stat Engine**: Guarantees complete numerical consistency across the entire game. Whether an upgrade is purchased via the bottom dock during combat, triggered by an automated background perk, unlocked by a milestone reward, or slotted into the Matrix Deck, all displays and simulation physics update synchronously to the exact same value.
  2. **Permanent Roguelike Meta-Progression**: Unlocks a multi-tier Ascension Workshop powered by Cosmic Shards. Shards persist permanently across deaths and are spent on lasting stat enhancements, ensuring every run makes the player noticeably stronger from Wave 1.
  3. **Guaranteed Zero-Softlock Defeat Pipeline**: Implements an atomic, telemetry-verified death latch that halts combat physics, purges projectiles, saves progress to IndexedDB, displays the Death Summary within 150ms, and cleanly restarts the arena at Wave 1 with full starting cash and reset latches.
  4. **Dynamic Combat Pressure**: Keeps orbiting circles threatening via wave-scaled inward spiraling, eliminates infinite AFK immortality through an evolving percent-HP damage floor, and establishes a rhythmic 5-wave elite pack / 10-wave geometric boss cadence.
  5. **Mobile-First Cyberpunk Tactical Matrix GUI**: Remasters active skills and synergies into an intuitive matrix-deck dashboard featuring instant slot socketing, automated synergy affinity badges, and touch targets designed for mobile thumb reach.

- **Target Audience / Persona**:
  - Incremental and tower defense enthusiasts who value transparent math, meaningful permanent upgrades, crisp audio-visual feedback, and zero clunky interface friction on both desktop and mobile.

- **Key Value**:
  - Eliminates player confusion and frustration by guaranteeing that stat displays never say one thing in one place and another elsewhere, while providing guaranteed shard earnings on every single run.

---

## 2. User Experience & Visual Design

### Key User Flows

#### 1. Universal Live Stat Synchronization Flow (Zero Discrepancy)
```
[Player Initiates Stat Upgrade]
(Sources: Bottom Dock Click, Background Auto-Purchase, Matrix Chip Equip, Milestone Reward)
       │
       ▼
[Single Deterministic State Mutation: gameStore.ts]
       │ ──> Updates raw level / multiplier in Zustand store
       │ ──> Synchronously runs selectLiveEffectiveStats(state)
       │
       ├───► React UI Broadcast (Frame 0):
       │     ├──> UpgradeCard Button: Updates display to exact total (e.g., 28.5 DMG)
       │     ├──> Stats Overview Modal: Updates DMG row to exact total (28.5 DMG)
       │     ├──> Matrix Deck Tooltip: Reflects matching modified value (28.5 DMG)
       │     └──> Next Level Preview: Recalculates dynamically (→ 31.2 DMG)
       │
       └───► Canvas Simulation Sync (Frame 0):
             ├──> Calls simulation.syncEffectiveStats(effectiveStats)
             ├──> Immediately updates player.damage, player.attackRange, player.fireRate, etc.
             └──> Very next bullet spawned deals exactly 28.5 damage on impact!
                  (Floating combat number matches Upgrade Card to the decimal point)
```

#### 2. Core Roguelike Meta-Progression Loop
```
[Active Combat Run: Wave N]
       │
       │ Player gathers Cash (temporary) & Cosmic Shards (permanent)
       ▼
[Player Hull Hits 0 HP]
       │
       ▼
[Atomic Defeat Latch: isHandlingDeath = true]
       │ ──> Halts enemy spawns, homing missiles & physics updates
       │ ──> Purges residual arena entities cleanly (residuals = 0)
       │ ──> Calculates Death Shard Settlement:
       │     Shards = Base (10) + Wave * 0.6 + Kills * 0.015 + BossBonus + Leeway
       │ ──> Logs structured telemetry: [DEATH_LATCH_TRIGGERED]
       │ ──> Persists updated currency & lifetime records to IndexedDB
       ▼
[Death Summary Screen Slides In (<150ms)]
       │ ──> Displays: Wave Reached, Total Enemies Slain, Bosses Defeated
       │ ──> Shows Shards Harvested breakdown + First-Death Leeway Badge (if run 1)
       │ ──> Actions: "Enter Ascension Workshop" or "Deploy Sentinel (Restart)"
       ▼
[Ascension Workshop (Permanent Meta-Upgrades)]
       │ ──> Spends Cosmic Shards on permanent node upgrades:
       │     - Kinetic Caliber (+Base Damage)
       │     - Hull Reinforcement (+Base Max HP)
       │     - Rapid Cycling (+Base Fire Rate)
       │     - Astral Resonance (+Shard Drop Multiplier)
       ▼
[Click "Deploy Sentinel"]
       │ ──> isDeathHandledThisRunRef.current = false (Latch reset)
       │ ──> Simulation.resetRun() dispatches { isDead: false, wave: 1, cash: $40 }
       │ ──> Player immediately starts Wave 1 with stronger permanent base stats!
```

#### 3. Matrix Deck Skill Equip & Synergy Flow
```
[Open Matrix Deck (Tactical GUI)]
       │
       ▼
[Matrix Header: 5 Tactical Sockets (Unlocked based on Wave / Progression)]
  Socket 1: [Overclock (Kinetic)]     Socket 2: [Plasma Core (Energy)]
  Socket 3: [Nanite Swarm (Tech)]     Socket 4: [EMPTY - Tap to Socket]
  Socket 5: [LOCKED - Unlocks W50]
       │
       ├──> Tap Empty Socket 4
       │    └──> Opens filtered chip repository: lists available tactical chips
       │    └──> Shows matching synergy tags: "Kinetic", "Energy", "Tech"
       │
       ├──> Select "Gauss Rail" (Kinetic Chip)
       │    └──> Sockets into Slot 4 with tactile snap sound
       │    └──> Synergy Evaluator trips: Kinetic count = 2 (Gauss + Overclock)
       │    └──> [KINETIC HYPER-DRIVE SYNERGY ACTIVATED] (+25% Projectile Velocity & Pierce)
       │    └──> Live Synergy Badge lights up neon cyan with pulse ring
       │    └──> All affected upgrade buttons update live values instantly!
       │
       └──> Tap Active Socket 1
            └──> Opens contextual modal: "Unequip Chip" or "Swap Chip"
```

---

### Non-Red Enemy & Boss Shard Bounty Table

| Enemy Shape | Archetype | Spawn Wave | Cash Bounty | Cosmic Shard Drop | Visual FX & Audio |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Red Square** | Baseline Grunt | Wave 1+ | $2 – $4 | **0** (Cash Only) | Yellow cash popup · Soft tick |
| **Orange Triangle**| Speedster | Wave 3+ | $3 – $5 | **+1 ✦** | Violet shard popup · Glass chime |
| **Circle** | Spiraling Orbiter | Wave 6+ | $4 – $6 | **+1 ✦** | Violet shard popup · Pulse ring |
| **Purple Pentagon**| Heavy Soldier | Wave 8+ | $5 – $8 | **+2 ✦** | Astral violet popup · Resonant ping |
| **Emerald Diamond**| Agile Striker | Wave 12+ | $6 – $9 | **+2 ✦** | Violet shard popup · Snap click |
| **Big Square** | Armored Tank | Wave 11+ | $8 – $12 | **+3 ✦** | Large violet bloom · Deep thud |
| **Gold Hexagon** | Elite Defender | Wave 16+ | $10 – $15 | **+4 ✦** | Gilded nova burst · Harmonic ping |
| **Elite Vanguard** | Wave 5 Mini-Boss | Wave 5, 15... | $25 – $40 | **+3 to +5 ✦** | Gold starburst · Heavy chime |
| **Apex Decagon** | Boss Archetype 1 | Wave 10, 60 | $60 + $10/Tier | **+10 ✦** | Astral shockwave · Boss fanfare |
| **Pulsar Star** | Boss Archetype 2 | Wave 20, 70 | $90 + $15/Tier | **+12 ✦** | Solar flare pulse · Pulse alarm |
| **Vortex Hexagon** | Boss Archetype 3 | Wave 30, 80 | $120 + $20/Tier | **+15 ✦** | Void vortex ripple · Heavy sweep |
| **Prism Colossus** | Boss Archetype 4 | Wave 40, 90 | $160 + $25/Tier | **+18 ✦** | Prismatic refraction · Laser blast |
| **Hyper-Tesseract**| Boss Archetype 5 | Wave 50, 100| $220 + $35/Tier | **+25 ✦** | Quantum collapse · Dimensional rip |

---

### Visual Identity & Theme Tokens

- **Aesthetic Direction**: High-Tech Cyberpunk Void Minimalist. Deep obsidian background canvases with high-contrast geometric vector silhouettes, bright neon accent borders, and strict anti-slop zero-pill typography.
- **Color Palette & Theme Tokens**:
  - `Canvas / Void`: `#05070b` (Deep Obsidian)
  - `Panel Surface`: `#0b0f17` (`bg-slate-950/90 border border-slate-800/80`)
  - `Accent Primary (Tech / Kinetic)`: `#06b6d4` (Neon Cyan)
  - `Accent Meta (Cosmic Shards)`: `#a855f7` (Astral Violet)
  - `Accent Economy (Cash)`: `#eab308` (Cyberpunk Amber / Gold)
  - `Accent Danger (Boss / Lethal)`: `#f43f5e` (Crimson Laser)
  - `Accent Shield / Barrier`: `#3b82f6` (Cobalt Forcefield)
- **Typography & Formatting**:
  - Primary UI & Headers: `Plus Jakarta Sans` or `Outfit` (Bold / SemiBold, tracking-tight).
  - Numerical Values, Stats & Live Totals: `JetBrains Mono` or `IBM Plex Mono` with `tabular-nums` for rock-solid layout alignment without character jitter.
- **Mobile-First Dimensions & Ergonomics**:
  - Safe-area insets applied via `pt-[env(safe-area-inset-top)]` and `pb-[env(safe-area-inset-bottom)]`.
  - All interactive buttons and cards conform to a minimum touch target size of **$48\text{px} \times 48\text{px}$** with $\ge 8\text{px}$ tap margins to prevent misclicks.

---

## 3. Key Product Decisions & Deep Systems Design

### Decision 1: Universal Single-Source-of-Truth Live Stat Synchronization

- **The Problem**: In incremental games with multiple subsystems, players get confused when an upgrade is purchased during a run or in the background and one screen says one thing while another says something else (e.g., upgrade button shows base damage, stats modal shows run upgrade, and floating projectile numbers reflect an un-synced simulation state).
- **The Architecture (Single Reactive Source of Truth)**:
  - We define a centralized pure computation function in `src/game/statsCalculator.ts`:
    $$\text{selectLiveEffectiveStats}(\text{state}): \text{EffectivePlayerStats}$$
  - Computes the aggregate value for every player stat using explicit formulas:
    1. **Effective Damage**:
       $$\text{Damage} = (\text{BaseDMG} + \text{PermanentShardDMG} + \text{RunWorkshopDMG}) \times (1 + \text{CardDMGPct} + \text{SkillDMGPct} + \text{SynergyDMGPct})$$
    2. **Effective Max HP**:
       $$\text{MaxHP} = (\text{BaseHP} + \text{PermanentShardHP} + \text{RunWorkshopHP}) \times (1 + \text{CardHPPct} + \text{SynergyHPPct})$$
    3. **Effective Health Regen**:
       $$\text{Regen} = (\text{BaseRegen} + \text{PermanentShardRegen} + \text{RunWorkshopRegen}) \times (1 + \text{CardRegenPct} + \text{SynergyRegenPct})$$
    4. **Effective Fire Rate**:
       $$\text{FireRate} = \text{BaseFireRate} \times (1 + \text{PermanentShardRatePct} + \text{RunWorkshopRatePct} + \text{CardRatePct} + \text{SynergyRatePct})$$
    5. **Effective Weapon Range**:
       $$\text{WeaponRange} = \text{BaseRange} + \text{PermanentShardRange} + \text{RunWorkshopRange} + \text{CardRange}$$
    6. **Effective Defense / Armor**:
       $$\text{Defense} = \min\left(90.0\%, \text{BaseArmor} + \text{PermanentShardArmor} + \text{RunWorkshopArmor} + \text{CardArmor} + \text{SynergyArmor}\right)$$
    7. **Effective Critical Chance**:
       $$\text{CritChance} = \min\left(100.0\%, \text{BaseCrit} + \text{PermanentShardCrit} + \text{RunWorkshopCrit} + \text{CardCrit}\right)$$
    8. **Effective Critical Multiplier**:
       $$\text{CritMultiplier} = \text{BaseCritMulti} + \text{PermanentShardCritMulti} + \text{RunWorkshopCritMulti} + \text{CardCritMulti}$$
- **Immediate Bidirectional Sync**:
  - Whenever any mutation touches state (upgrade button clicked, background auto-buyer fires, milestone claimed, chip equipped):
    1. `gameStore` recalculates `effectiveStats`.
    2. React components bound to `useGameStore(selectLiveEffectiveStats)` re-render instantly on the exact frame.
    3. `GameManager` / `App.tsx` calls `simulation.syncEffectiveStats(effectiveStats)` directly.
    4. `Simulation.ts` updates `this.player.damage`, `this.player.attackRange`, etc., so all active turret aiming, range circles, and projectile damage numbers match the UI numbers identically.
- **Consistency Guarantee**:
  - Zero divergence between what the upgrade button displays, what the stats panel displays, and what damage actually floats over enemy targets.

---

### Decision 2: Cosmic Shard Economy & Meta-Progression Balancing

- **Core Loop Philosophy**:
  - Cosmic Shards are permanent. Cash is run-only.
  - Death always resets the player to **Wave 1**, but the permanent workshop unlocks purchased with Cosmic Shards persist forever, ensuring steady horizontal and vertical power ramps.
- **Death Settlement Formula**:
  $$\text{Shards}_{\text{death}} = \max\left(12, \text{Base}_{\text{death}} (10) + \lfloor \text{Wave} \times 0.60 \rfloor + \lfloor \text{Kills} \times 0.015 \rfloor + (\text{BossesDefeated} \times 2) + \text{Bonus}_{\text{leeway}}\right)$$
  - **First-Ever Death Leeway**: $\text{Bonus}_{\text{leeway}} = 30\text{ Shards}$. On run 1, reaching Wave 5 awards $10 + 3 + 1 + 30 = \mathbf{44\text{ Shards}}$, allowing the player to immediately unlock 2–3 meaningful permanent upgrades.
  - **Subsequent Run Example**: Reaching Wave 25 with 350 kills and 2 bosses awards $10 + 15 + 5 + 4 = \mathbf{34\text{ Shards}}$.
- **In-Run Shard Drip & Kill Bounties**:
  - Wave Clear Drip: $+1\text{ Cosmic Shard}$ credited directly to the player's permanent vault every even wave cleared ($\lfloor \text{Wave} / 2 \rfloor$).
  - Kill Bounties: Every non-red shape drops real-time shards directly into the bank (+1 to +5 shards; Bosses drop +10 to +25 shards).
- **Permanent Meta-Upgrade Tree & Pricing Model**:
  $$\text{Cost}(\text{level}) = \lfloor \text{BaseCost} \times (\text{GrowthRate})^{\text{level} - 1} \rfloor$$

| Permanent Node | Max Level | Base Cost | Growth Rate | Stat Impact Per Level | Impact at Max Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Kinetic Caliber** | 15 | 8 Shards | $1.28\times$ | $+2.0\text{ Flat Base DMG}$ | $+30\text{ Base DMG}$ |
| **Hull Integrity** | 15 | 10 Shards | $1.28\times$ | $+20\text{ Flat Base Max HP}$ | $+300\text{ Base HP}$ |
| **Nanite Matrix** | 10 | 12 Shards | $1.32\times$ | $+0.4\text{ HP/sec Base Regen}$ | $+4.0\text{ HP/sec}$ |
| **Targeting Array** | 10 | 10 Shards | $1.30\times$ | $+8\text{px Base Weapon Range}$ | $+80\text{px Range}$ |
| **Rapid Cycling** | 10 | 15 Shards | $1.35\times$ | $+4\%\text{ Base Fire Rate}$ | $+40\%\text{ Fire Rate}$ |
| **Critical Focus** | 10 | 18 Shards | $1.35\times$ | $+2\%\text{ Base Crit Chance}$ | $+20\%\text{ Crit Chance}$ |
| **Armor Plating** | 10 | 20 Shards | $1.40\times$ | $+1.5\%\text{ Base Armor (Cap 90%)}$ | $+15\%\text{ Armor}$ |
| **Astral Harvester**| 10 | 25 Shards | $1.42\times$ | $+5\%\text{ Cosmic Shards Earned}$| $+50\%\text{ Shard Multi}$ |

*Design Rule Guarantee*: Early levels (1–3) cost 8–18 shards so players immediately feel impactful upgrades after their very first death. High-level upgrades cost 100–300 shards and deliver game-defining advantages rather than microscopic $+0.1\%$ gains.

---

### Decision 3: Orbiter Threat Scaling & Inward Spiral Mechanics

- **Dynamic Radius Anchor**:
  $$R_{\text{target}} = \max\left(25\text{px}, \min(0.75 \times \text{PlayerWeaponRange}, \text{PlayerWeaponRange} - 25\text{px})\right)$$
  - When the player buys Range upgrades mid-combat, orbiters smoothly adjust outward/inward toward the dynamic target radius.
- **Wave & DPS Inward Spiral Speed Scaling**:
  - Orbiters must not become passive target practice in late waves. As the wave number and player DPS rise, orbiters compress their circle inward toward the player hull:
    $$v_{\text{spiral}} = 1.5 + (0.025 \times \text{Wave}) + \left(0.008 \times \min\left(120, \text{PlayerDPS}^{0.32}\right)\right) \text{ px/s}$$
  - Minimum standoff distance: **$25\text{px}$** (orbiters never clip directly into the core hull unless performing a ramming attack).
  - Angular Orbit Velocity:
    $$\omega = 1.20 + (0.010 \times \text{Wave}) \text{ rad/s}$$
- **Combat Behavior**:
  - Orbiters fire concentric plasma darts toward the center while circling. If player DPS is high, the spiral accelerates, forcing the player to prioritize them before they breach close range.

---

### Decision 4: Boss Cadence Polish & Wave 5 Elite Vanguard

- **10-Wave Boss Cadence (`wave % 10 === 0`)**:
  - Features 5 signature geometric bosses in round-robin rotation:
    1. **Apex Decagon** (Waves 10, 60...): 10-sided fortress. Radial 8-way projectile salvos and armored ramming charges.
    2. **Pulsar Star** (Waves 20, 70...): 5-pointed star. Sweeping continuous laser beams and high-velocity photon pulses.
    3. **Vortex Hexagon** (Waves 30, 80...): 6-sided gravity siphon. Kinetic deflection field that deflects player bullets and pulls player drones.
    4. **Prism Colossus** (Waves 40, 90...): Triangular crystal. Refracts incoming attacks into split shards and deploys 4 repair drones.
    5. **Hyper-Tesseract** (Waves 50, 100...): 4D rotating hypercube. **Harmonic Energy Shield** (absorbs 100% damage until depleted), phased micro-teleports, and antimatter beam strikes.
- **Strict Shield Rule**:
  - Boss energy shields are **strictly restricted to Wave 50+**. Waves 10, 20, 30, and 40 bosses rely exclusively on armor, evasion, and mechanics, preventing early-game DPS check walls.
- **Wave 5 Elite Vanguard Mini-Packs (`wave % 10 === 5`)**:
  - At Waves 5, 15, 25, 35, 45, etc., the wave spawn pool replaces standard mobs with an **Elite Vanguard Pack**:
    - Spawns 2–4 Gilded Champion shapes (Triangles, Diamonds, or Octagons).
    - Stats: $+75\%\text{ HP}$, $+25\%\text{ Speed}$, distinct golden vector aura.
    - Guaranteed Rewards: Each champion awards **$25–$40 Cash** and **+3 to +5 Cosmic Shards**.
  - Pacing Benefit: Eliminates the mid-interval void between 10-wave bosses, giving players exciting miniboss checkpoints.

---

### Decision 5: Anti-Immortality Evolving Damage Floor & Defense Cap

- **The Problem**: Players stacking 90% armor and high HP regen could become completely invincible in late waves, resulting in endless AFK stalemates.
- **Hard Defense Cap**:
  $$\text{EffectiveArmor} = \min(0.90, \text{PlayerArmorRatio})$$
- **Evolving Dynamic Damage Floor**:
  - The minimum damage taken from any enemy hit is bounded by three factors:
    $$\text{DamageFloor} = \max\left(1, \lfloor \text{RawDamage} \times 0.10 \rfloor, \lfloor \text{PlayerMaxHP} \times (0.0025 + \text{Wave} \times 0.00015) \rfloor\right)$$
- **Calculated Examples**:
  - **Early Game (Wave 5, 120 Max HP, 10 Raw Damage)**:
    - Floor: $\max(1, \lfloor 1.0 \rfloor, \lfloor 120 \times 0.00325 \rfloor) = \mathbf{1\text{ DMG}}$.
  - **Mid Game (Wave 30, 2,000 Max HP, 50 Raw Damage, 80% Defense)**:
    - Raw Reduced: $50 \times (1 - 0.80) = 10\text{ DMG}$.
    - Floor: $\max(1, 5, \lfloor 2000 \times 0.0070 \rfloor) = \mathbf{14\text{ DMG}}$.
  - **Deep Endgame (Wave 100, 500,000 Max HP, 200 Raw Damage, 90% Defense)**:
    - Raw Reduced: $200 \times 0.10 = 20\text{ DMG}$.
    - Percent-HP Floor: $\lfloor 500000 \times (0.0025 + 0.015) \rfloor = \mathbf{8,750\text{ DMG}}$.
  - **Regeneration Latch**: If `PlayerHP <= 0`, health regeneration is instantly frozen to 0 to prevent zombie-state resurrection bugs.

---

### Decision 6: Mobile-First Cyberpunk Tactical Matrix GUI

- **Deck Architecture & Socket System**:
  - Sockets available: Up to **5 tactical slots** (Slot 1: Wave 1; Slot 2: Wave 5; Slot 3: Wave 15; Slot 4: Wave 30; Slot 5: Wave 50).
  - Explicit Touch Flow:
    1. **Tap Empty Socket**: Slides open the Chip Inventory drawer with tag filters (`All`, `Kinetic`, `Energy`, `Tech`, `Quantum`).
    2. **Tap Chip**: Displays detailed stats, passive bonuses, and potential synergy activation preview.
    3. **Tap "Socket Chip"**: Snaps chip into the matrix with holographic audio feedback.
    4. **Tap Active Socket**: Opens contextual sheet with `[Swap Chip]`, `[Inspect Details]`, and `[Unequip Chip]`.
- **Real-Time Synergy Badge Engine**:
  - Chips carry 1–2 affinity tags (e.g. `KINETIC`, `ENERGY`, `TECH`, `VOID`, `HARMONIC`).
  - Synergy engine tallies active tags on every deck change:
    - **2x Kinetic**: *Hyper-Ballistics* $\rightarrow$ $+20\%$ bullet speed, $+1$ projectile pierce.
    - **2x Energy**: *Overload Plasma* $\rightarrow$ $+25\%$ crit multiplier, attacks apply burn damage.
    - **2x Tech**: *Nanite Mesh* $\rightarrow$ $+30\%$ health regen, $+5\%$ armor.
    - **3x Void / Quantum**: *Singularity Collapse* $\rightarrow$ Slain enemies have $15\%$ chance to detonate an astral black hole.
  - Active synergies display animated glowing badges above the matrix deck with tooltip breakdowns.
- **Ergonomics & Layout**:
  - Horizontal swipe cards with CSS scroll snap on mobile screens ($<640\text{px}$).
  - Minimum touch targets of $48\text{px} \times 48\text{px}$ across all chips and socket actions.

---

### Decision 7: Defeat Telemetry, Safety Nets & Zero-Softlock Purge

- **Atomic Latch Architecture**:
  - Variable `this.isHandlingDeath = true` trips synchronously inside `Simulation.ts` on the exact frame player HP hits 0.
  - Immediate execution steps:
    1. Cancel all active enemy attack timers and pending projectile spawns.
    2. Synchronously clear `this.projectiles = []` and `this.particles = []`.
    3. Freeze all enemy movement vectors to `(0, 0)`.
    4. Compute final death rewards and emit `[DEATH_LATCH_TRIGGERED]` telemetry.
    5. Trigger `handlePlayerDeath(metrics)` in Zustand store.
- **Structured Console Telemetry Schema**:
  ```json
  [DEATH_LATCH_TRIGGERED] {
    "timestamp": 1728695000000,
    "wave": 24,
    "playerHp": 0,
    "totalKills": 348,
    "bossesKilled": 2,
    "runDurationSec": 312.4
  }
  [CLEAN_PURGE_EXECUTED] {
    "projectilesPurged": 42,
    "particlesPurged": 180,
    "residualEntities": 0,
    "audioVoicesReset": true
  }
  [SHARD_SETTLEMENT_CALCULATED] {
    "baseAmount": 10,
    "waveBonus": 14,
    "killBonus": 5,
    "bossBonus": 4,
    "leewayBonus": 0,
    "totalAwarded": 33,
    "newLifetimeBalance": 184
  }
  [RESPAWN_LATCH_CLEARED] {
    "isDeathHandledRef": false,
    "simulationDeathLatch": false,
    "startWave": 1,
    "startingCash": 40
  }
  ```

---

### Decision 8: Mobile-First HUD Collision Avoidance & Safe-Area Rules

- **The Problem**: On narrow mobile screens, `BossHealthBar` overlapped `SpeedIndicatorHUD`, while upgrade cards were cut off by screen cutouts or bottom home bars.
- **Unified Layout Grid**:
  - **Top Bar**:
    - Dedicated padding: `pt-[max(12px,env(safe-area-inset-top))] px-3`.
    - Left Anchor: `SpeedIndicatorHUD` (compact width, $44\text{px}$ touch targets for speed toggles $1\times / 2\times / 4\times$).
    - Center / Offset Anchor: `BossHealthBar` placed on a dedicated sub-layer below the speed controls with a guaranteed top margin of `mt-12` or centered below the wave banner. Zero bounding-box overlap.
    - Right Anchor: Cosmic Shards counter (`✦`) and Cash counter (`$`).
  - **Bottom Dock**:
    - `pb-[max(12px,env(safe-area-inset-bottom))] px-2`.
    - Horizontally scrolling tabbed dock with category chips: `[ATTACK]`, `[DEFENSE]`, `[UTILITY]`, `[MATRIX DECK]`.
    - Minimum button touch targets: $\ge 48\text{px}$ height.

---

## 4. Technical Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────────────────────┐
│                              App.tsx                                   │
│  - Tracks isDeathHandledThisRunRef (resets on respawn)                 │
│  - Synchronizes store effective stats directly into Simulation         │
│  - Mounts CombatCanvas, HUD Overlay, Matrix Deck, Death Summary Modal  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ticks & sync events
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            GameManager.ts                              │
│  - RAF Loop with delta time clamping (max 100ms)                       │
│  - Coordinates live stat push to Simulation on upgrade events          │
│  - SoundEngine coordination (playCrit, playWaveClear, playDefeat)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ticks & stat updates
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                             Simulation.ts                              │
│  - syncEffectiveStats(stats): Ingests live effective stats in Frame 0  │
│  - Combat Entities: SpatialGrid collision acceleration                 │
│  - Spiraling Orbiters: dynamic radius + wave/DPS spiral speed formula  │
│  - Boss Engine: wave % 10 === 0 (5 archetypes; shields wave 50+)       │
│  - Elite Vanguard: wave % 10 === 5 (gilded mini-packs, shard bounties) │
│  - Combat Pipeline: 90% hard defense cap + percent-HP damage floor     │
│  - Non-Red Kill Bounties: real-time cosmic shards with floating popups │
│  - Wave Clear: awards $15 + wave * 5 cash + updates highestWavePerTier │
│  - Atomic Defeat Latch: isHandlingDeath flag + instant purge telemetry │
│  - resetRun: resets isHandlingDeath=false, dispatches isDead=false     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    │ state dispatches & death events
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Zustand Store (gameStore.ts)                    │
│  - Single Pure Selector: selectLiveEffectiveStats(state)               │
│  - Currencies: cash (run-only), cosmicShards (permanent cross-run)     │
│  - Workshop State: permanent upgrade levels & price curve formulas    │
│  - Tactical Matrix Deck: 5 sockets, chip inventory, synergy evaluator │
│  - handlePlayerDeath: executes settlement formula + telemetry          │
│  - respawnAndReset: starts Wave 1 with $40 cash and clean state        │
│  - IndexedDB Persistence: debounced auto-save of permanent meta state  │
└──────────────┬───────────────────────────────────────────┬─────────────┘
               │                                           │
               ▼                                           ▼
┌─────────────────────────────────────────┐ ┌────────────────────────────┐
│              Combat HUD                 │ │   Cyberpunk Matrix Deck    │
│ - SpeedIndicatorHUD (top-left, no dup)  │ │ - 5-Slot Tactical Deck     │
│ - BossHealthBar (no overlap with HUD)   │ │ - Live synergy badge engine│
│ - MilestonesPanel (tier-accurate sync)  │ │ - Socket equip/swap drawer │
│ - UpgradePanel (live total values)      │ │ - Mobile scroll snap       │
│ - DeathSummary (zero-softlock modal)    │ │ - Ascension Workshop view  │
└─────────────────────────────────────────┘ └────────────────────────────┘
```

### Component & State Mapping

1. **`statsCalculator.ts` / `gameStore.ts`**:
   - `selectLiveEffectiveStats(state)`: Central deterministic function computing `{ damage, maxHp, regen, fireRate, range, armor, critRate, critMulti, cashMulti, shardMulti }`.
   - Used by every UI component and by the simulation bridge.
2. **`Simulation.ts`**:
   - `syncEffectiveStats(stats)`: Directly updates `this.player.damage`, `this.player.attackRange`, `this.player.fireRate`, `this.player.maxHp`, `this.player.healthRegen`, `this.player.defense` without waiting for wave clear or run restart.
   - Projectile creation uses `this.player.damage`, ensuring floating hit damage numbers in combat match the upgrade card numbers identically.
3. **`UpgradePanel.tsx` & `UpgradeCard.tsx`**:
   - Reads directly from `selectLiveEffectiveStats`.
   - Renders current aggregate stat value in primary bold text, with next level delta preview and detailed breakdown tooltip.
4. **`TacticalMatrixDeck.tsx`**:
   - Equipping or unequipping chips immediately mutates state, triggering `selectLiveEffectiveStats` and updating the active simulation in real time.

---

## 5. Verification & Telemetry Plan

### Comprehensive Verification Checklist

1. **Live Stat Consistency & Background Upgrade Verification**:
   - *Test Step*: Observe Damage Upgrade Card during active Wave 2 (e.g. shows `16.0 DMG`).
   - *Verification*: Confirm floating bullet damage text over enemies shows exactly `16`.
   - *Action*: Purchase Run Damage Upgrade from bottom dock while enemies are actively moving on screen.
   - *Verification*: Confirm Upgrade Card button instantly updates to `18.5 DMG`.
   - *Verification*: Confirm the very next projectile fired deals `18.5 DMG` (matching floating text).
   - *Action*: Socket a chip in the Matrix Deck granting $+20\%$ damage.
   - *Verification*: Confirm Upgrade Card, Stats panel, and floating combat damage update instantly and consistently to `22.2 DMG`. No desync or conflicting values anywhere.
   - *Repeat for Other Stats*: Confirm Health, Health Regen, Attack Range, and Armor update live with identical consistency.

2. **Core Roguelike Loop & Subsequent Death Shard Verification**:
   - *Test Step*: Play Run 1 $\rightarrow$ Die at Wave 4.
   - *Verification*: Confirm `+30 Leeway Shards` are awarded along with base shards ($\ge 42\text{ Shards}$ total).
   - *Action*: Spend shards on permanent Kinetic Caliber and Hull Integrity in the Ascension Workshop.
   - *Test Step*: Click "Deploy Sentinel" $\rightarrow$ Start Run 2 $\rightarrow$ Verify starting at Wave 1 with $40 starting cash and upgraded base stats.
   - *Action*: Die at Wave 7 on Run 2.
   - *Verification*: **Verify shards are awarded again!** (Confirm `[SHARD_SETTLEMENT_CALCULATED]` logs in console, `isDeathHandledThisRunRef` reset cleanly, and shards increment by $\ge 16$).
   - *Repeat*: Verify across 5 consecutive death-restart cycles. Zero freezes, zero zero-shard latch bugs.

3. **Dynamic Orbiter Scaling Verification**:
   - *Test Step*: Spawn Circle orbiters at Wave 6.
   - *Verification*: Confirm orbiters anchor at $0.75 \times \text{WeaponRange}$.
   - *Action*: Buy Range upgrades to double weapon range.
   - *Verification*: Confirm orbiters smoothly shift orbit outward while maintaining dynamic inward spiral velocity ($v_{\text{spiral}}$ scales with wave number).
   - *Verification*: Orbiters strictly stop spiraling at the $25\text{px}$ standoff boundary.

4. **Boss Cadence & Wave 5 Elite Vanguard Verification**:
   - *Wave 5, 15, 25*: Verify Elite Vanguard mini-pack spawns with 2–4 gilded champion units, dropping bonus cash and $+3\text{--}5$ shards each.
   - *Wave 10, 20, 30, 40*: Verify geometric bosses spawn on schedule with NO shields.
   - *Wave 50*: Verify Hyper-Tesseract spawns with active blue Harmonic Energy Shield.

5. **Anti-Immortality Damage Floor Verification**:
   - *Test Step*: Set player defense to $90\%$ and Max HP to $10,000$.
   - *Action*: Take hit from Wave 50 enemy.
   - *Verification*: Confirm damage taken is at least $\lfloor 10000 \times 0.010 \rfloor = 100\text{ DMG}$, preventing 0-damage immortality exploits.

6. **Matrix Deck Mobile Ergonomics & Synergy Verification**:
   - *Test Step*: Socket 2 Kinetic chips in the Tactical Matrix Deck.
   - *Verification*: Confirm *Hyper-Ballistics Synergy* badge illuminates in cyan, granting $+20\%$ bullet speed.
   - *Action*: Inspect touch targets on mobile viewport ($375\text{px} \times 667\text{px}$).
   - *Verification*: All interactive buttons and sockets measure $\ge 48\text{px} \times 48\text{px}$, with no overlaps between `SpeedIndicatorHUD` and `BossHealthBar`.
