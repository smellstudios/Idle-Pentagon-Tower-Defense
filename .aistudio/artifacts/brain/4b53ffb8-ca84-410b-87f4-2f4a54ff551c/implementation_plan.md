# Remastered In-Game Popups & Combat Readability Blueprint

A complete visual remaster and performance overhaul for in-game floating popups (Currency, Cosmic Shards, Status Ailments, and Damage Numbers), upgrading them to high-contrast minimalist typography with extended 1.6–2.2 second readability curves, smart multi-hit stacking, and zero-allocation WebGL rendering.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions were confirmed during Phase 1 interactive clarification:
> - **Extended Visibility (1.6s to 2.2s):** Currency gains and status ailments will linger with a graceful glide and decelerated float, resolving the issue where popups vanished prematurely in under 0.3s.
> - **Minimalist Crisp Typography:** Popups will use sharp, unboxed high-contrast typography with clean dual-tone strokes and drop-shadows rather than clunky, distracting background containers.
> - **Smart Stacked Multipliers:** Repeated status triggers (e.g., Poison ticks, Decay stacks, Bleed, Phase shifts) will dynamically group into clean stacked badges with `(x2)`, `(x5)` hit multipliers to keep combat clear and free of screen clutter.

---

## 1. Overview & Core Concept

- **What It Delivers:**
  - Completely re-architected floating popup system in `src/game/popups.ts` and `Simulation.ts`.
  - Removes premature culling and sudden 300ms fade-outs, replacing them with a satisfying 1,800ms lifecycle (fast initial pop $\rightarrow$ smooth buoyant upward glide $\rightarrow$ gentle linear fade in the final 25% of life).
  - Modernizes visual aesthetics with crisp typography, razor-sharp dark contrast strokes, and distinct color-coded domain themes (Emerald for Cash, Amethyst for Shards, Ruby for Player Damage, Neon Amber for Crits, and tailored ailment palettes).
  - Implements high-performance spatial aggregation so high-frequency combat effects (rapid fire, chains, poison miasma) merge smoothly with animated hit-counter pulses instead of spamming 50 overlapping popups.

- **Primary Player Experience Value:**
  - Clear, readable rewards whenever shapes are destroyed without having to squint or pause.
  - Zero frame drops or main-thread hitching even when dozens of entities are eliminated simultaneously.

---

## 2. User Experience & Visual Design

### Visual Identity & Aesthetic Rules
- **Typography:** JetBrains / Space Mono uppercase bold styling with subpixel integer rounding for razor-sharp legibility on high-DPI canvas viewports.
- **Stroke & Contrast Math:** Outer contour stroke width of 2.5px to 3.0px using deep midnight contrast colors (`#000000`, `#064e3b`, `#450a0a`) guaranteeing 100% legibility against bright lasers, particle explosions, and dark space backgrounds alike.
- **Palette Mapping:**
  - **Cash ($ / Stardust):** Emerald Green (`#34d399` text / `#064e3b` outline).
  - **Cosmic Shards (💠):** Electric Amethyst (`#c084fc` text / `#3b0764` outline).
  - **Dual Currency Merge:** Dual-tone gradient gold (`#facc15` text / `#451a03` outline).
  - **Player Contact Damage:** High-voltage Danger Red (`#ef4444` text / `#450a0a` outline).
  - **Status Ailments:**
    - Poison / Miasma: Biohazard Lime (`#22c55e`).
    - Decaying Plague: Toxic Rust (`#f97316`).
    - Shrapnel Bleed: Crimson Gore (`#f43f5e`).
    - EMP / Shock / Deflect: Cyber Cyan (`#06b6d4`).
    - Phasing / Void: Cosmic Purple (`#a855f7`).

### Motion Choreography (1.8s Total Curve)
```
Lifecycle Timeline (1800ms)
0ms ───[ 140ms Pop & Elastic Settle ]───> 140ms
140ms ─[ 1000ms Buoyant Deceleration Glide (Alpha 1.0) ]─> 1140ms
1140ms [ 660ms Smooth Ease-Out Fade (Alpha 1.0 -> 0.0) ]─> 1800ms (Recycled to Pool)
```

1. **Initial Impulse (0ms – 140ms):** Springs upward with a scale punch ($1.0 \rightarrow 1.25 \rightarrow 1.0$) with zero initial jump so the eye immediately registers the number.
2. **Sustained Readability Phase (140ms – 1140ms):** Glides upward with a slow cubic ease-out float while maintaining **100% full opacity**, ensuring the player has over a full second of clear reading time.
3. **Gentle Fadeout (1140ms – 1800ms):** Smoothly ramps opacity to 0 while gently completing its upward drift, recycling the sprite back into the pre-warmed object pool.

---

## 3. Key Product Decisions & Trade-Offs

| Decision | Chosen Approach | Rationale | Alternatives Considered |
|---|---|---|---|
| **Visual Container** | Minimalist unboxed typography with high-contrast outlines | Keeps the game canvas clean, airy, and arcade-authentic; eliminates clunky dark pill blocks | Rounded container boxes (too visually heavy during intense waves) |
| **Duration Lifecycle** | 1,800ms (with full opacity for 1,140ms) | Solves the user's issue where popups vanished in 0.2s–0.3s; gives ample reading time | 3,000ms (causes clutter during high-density waves) |
| **Status Stacking** | Smart spatial aggregation with `(xN)` multipliers | Merges repeated triggers on nearby enemies into a single punching status tag | Individual popups for each enemy (spams screen and drops FPS) |
| **Object Pooling** | Fixed pre-allocated `PopupItem` pool (120 units) | Zero garbage collection allocations during combat frames | Allocating `new Text()` per spawn (causes GC hitching) |

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                       Simulation.ts                         │
│  (Enemy Kill / Ailment Ticks / Contact Damage / Life Steal) │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                      PopupManager                           │
│  - Spatial Proximity Query (45px radius search)             │
│  - Multi-Hit Aggregation & Stack Multiplier (x2, x3...)     │
│  - Pre-warmed Object Pool (120 items, zero runtime alloc)   │
└──────────────────────────────┬──────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                   PixiJS WebGL Render Tree                  │
│  - Text Sprite + High-Contrast Contrast Stroke              │
│  - 60 FPS Continuous Coordinate & Alpha Interpolation       │
│  - GPU-snapped text positions (roundPixels: true)           │
└──────────────────────────────┴──────────────────────────────┘
```

### Implementation Steps
1. **Extend Constants (`src/game/constants.ts`):**
   - Update `POPUP_CONFIG.cashDurationMs` from 850ms to 1800ms.
   - Update `POPUP_CONFIG.damageDurationMs` from 600ms to 1400ms.
   - Update status text default duration from 850ms to 1800ms.
2. **Remaster `PopupItem` in `src/game/popups.ts`:**
   - Redesign `refreshVisuals()`: Remove dark pill boxes; implement crisp high-contrast text rendering with dynamic theme styling and crisp outlines.
   - Update `update(deltaMs)`: Re-tune the opacity curve so popups maintain 100% opacity for the first 65% of their life before smoothly fading out.
   - Upgrade `aggregateText()` and `aggregateDamage()`: Add clean multiplier formatting (`+12 (x3)`) with an elastic scale pop that refreshes duration without resetting spatial momentum.
3. **Optimize `PopupManager` Spawning & Merging:**
   - Increase pool size from 80 to 120 pre-allocated items to handle extended lingering without pool exhaustion.
   - Prevent premature clearing in `flushPendingCurrency()` so active on-screen popups complete their smooth animation.
4. **Verification & Build Validation:**
   - Execute `compile_applet` and `lint_applet` to verify zero compile or type errors.
