# High-Density 60 FPS Engine & Combat Progression System Overhaul

A production-grade implementation plan to overhaul core progression mechanics, settings configuration, post-combat debrief UX, and boss encounter scaling while maintaining the high-density 60 FPS mobile architecture.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> Key design choices confirmed through user direction:
> - **Free Upgrade Trigger:** Rolls occur automatically at the end of every completed wave.
> - **Three Distinct Upgrade Tracks:** Three separate purchaseable and upgradeable stats—**Free Damage** (in Damage / Attack), **Free Defense** (in Defense / Health), and **Free Utilities** (in Utility)—each scaling at **+0.25% per level**.
> - **Transparent Feedback:** The game explicitly announces which specific upgrade was awarded (e.g. `✨ FREE DAMAGE UPGRADE: Range (+1 Lvl)!`).
> - **Settings UI Rework:** Fully modernized settings interface removing the projectile fire protocol debug selector from the Gameplay tab, prioritizing clean player toggles.
> - **Simplified Death Summary ("does UI"):** Streamlined, rock-solid Mission Debrief screen replacing confusing multi-nested hub screens with clean run metrics and instant redeploy actions.
> - **Boss Scaling Rework:** Pure wave and tier progression mathematical formula with **zero player damage rubberbanding**, allowing players with superior builds to genuinely overpower and flex on encounters.

---

## 1. Overview & Core Concept

This release delivers four interconnected game design and engineering upgrades:

1. **Triple-Track Sectional Free Upgrades (+0.25% per level):**
   - Replaces the single generic free upgrade chance with three dedicated in-run (and permanent workshop) upgrade tracks:
     - **Free Damage:** +0.25% chance per wave to randomly grant +1 level to an unmaxed Damage stat.
     - **Free Defense:** +0.25% chance per wave to randomly grant +1 level to an unmaxed Health/Defense stat.
     - **Free Utilities:** +0.25% chance per wave to randomly grant +1 level to an unmaxed Utility stat.
   - At wave completion, each track rolls independently. When triggered, a banner and floating popup clearly announce the specific upgrade acquired (e.g. `✨ FREE DAMAGE UPGRADE: Critical Multiplier!`).

2. **Clean Settings Modal & Fire Protocol Cleanup:**
   - Overhauls `SettingsModal` into a modern, tactile, single-elevation control panel with clear sections: *Gameplay*, *Performance & Video*, *Audio (SFX & Music)*, and *Data Management*.
   - Removes the projectile selection inside weapon fire protocols from the gameplay settings tab, restoring proper game immersion and preventing configuration conflicts.

3. **Simplified, Resilient Death Summary UI ("does UI"):**
   - Re-architects the game over screen (`DeathSummary`) from a cluttered multi-tab sub-hub into a focused, reliable **Combat Mission Debrief**:
     - Prominent sector record, waves cleared, and milestone badges.
     - Exact breakdown of run yields: Cosmic Shards harvested, Death Reserve Cash, Gems, and total kills.
     - Prominent high-contrast **"DEPLOY AGAIN"** action and quick links to permanent Workshop upgrades, eliminating UI confusion.

4. **Pure Wave & Tier Boss Scaling (Zero Rubberbanding):**
   - Strips out artificial rubberband scaling where bosses inflated their HP dynamically based on `playerStats.dps` and bypassed player armor with `playerDefAbs`.
   - Establishes a deterministic, fair, exponential wave & tier formula where bosses are tough milestones of wave difficulty, allowing overpowered builds to legitimately one-shot or melt bosses.

---

## 2. User Experience & Visual Design

### A. Upgrades Panel: Three Dedicated Free Upgrade Tiles
- **Damage Section:** Contains `Free Damage` tile with sword/sparkle icon, base cost $65, increment `+0.25%`, max level 100 (up to 25% max in-run chance).
- **Defense Section:** Contains `Free Defense` tile with shield/sparkle icon, base cost $60, increment `+0.25%`, max level 100.
- **Utility Section:** Contains `Free Utilities` tile with wrench/sparkle icon, base cost $55, increment `+0.25%`, max level 100.
- Visual description explicitly tells the player: `+0.25% chance at wave end to grant a free random Damage upgrade`.

### B. Wave Clear Reward Announcement Sequence
- When a wave completes:
  1. If `Free Damage` rolls successfully: spawns popup `✨ FREE DAMAGE: [Stat Name] (+1)!` in vibrant rose (`#f43f5e`).
  2. If `Free Defense` rolls successfully: spawns popup `✨ FREE DEFENSE: [Stat Name] (+1)!` in emerald mint (`#10b981`).
  3. If `Free Utilities` rolls successfully: spawns popup `✨ FREE UTILITY: [Stat Name] (+1)!` in sky cyan (`#38bdf8`).
  4. If all stats in that category are already maxed out, converts into a scaled Cash & Shard bonus with clear feedback.

### C. Modernized Settings Modal
- Tabbed layout with four streamlined views:
  - **Gameplay:** Exact/abbreviated currency format, Pause in menus, Floating damage numbers, Floating cash popups. (Weapon fire protocol projectile controls cleanly removed).
  - **Video & Performance:** Target FPS (30 / 60 / 120), High-Density Mode toggle, Adaptive Governor toggle, Debug Performance HUD toggle.
  - **Audio Deck:** Master SFX toggle with volume preview, BGM background music track selector & shuffle controls.
  - **Data:** Cloud save status, lifetime stats breakdown, and safe reset confirmation.

### D. Simplified Death Summary Screen
- Pure mission debrief presentation:
  - Header: Sector Tier indicator and Defeat / Hull Breached status.
  - Central Stat Grid: Wave reached, highest wave record badge, enemies defeated, cosmic shards earned, and cash reserve banked.
  - Immediate Action: Full-width neon **DEPLOY AGAIN (SPACE / ENTER)** button that instantly starts the next run without friction.
  - Secondary drawer: Direct access to permanent Workshop upgrades without duplicating the entire desktop applet.

---

## 3. Key Product Decisions & Trade-Offs

### 1. Independent Rolling for All Three Free Upgrade Tracks
- **Decision:** Roll Damage, Defense, and Utilities as three independent chances rather than a single combined roll.
- **Why:** Allows players to specialize their economy. A player can invest heavily in Free Damage to snowball attack stats while leaving Utilities untouched, or invest in all three to trigger multiple free upgrades per wave.

### 2. Elimination of Dynamic Player DPS Rubberbanding on Bosses
- **Decision:** Remove `playerDpsBonus` and `playerDefensePenetration` from `getEnemyWaveStats()`.
- **Why:** In idle and tower defense games, rubberbanding punishes player progression. If upgrading damage makes the boss proportionally tankier, upgrades feel meaningless. Pure wave-and-tier scaling rewards good builds and lets players experience satisfying power spikes.

### 3. Removal of Projectile Selection in Settings
- **Decision:** Remove the projectile weapon protocol toggle from the settings modal gameplay tab.
- **Why:** Combat firing modes should not be arbitrary user preferences toggled in a settings dialog; game settings should govern audio, accessibility, visual quality, and UI preferences.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                         Simulation & Wave Cycle                        │
│                                                                        │
│  Wave Complete ──► Roll Free Damage (0.25% * Lvl)   ──► +1 Lvl Damage  │
│                ──► Roll Free Defense (0.25% * Lvl)  ──► +1 Lvl Defense │
│                ──► Roll Free Utility (0.25% * Lvl)  ──► +1 Lvl Utility │
│                ──► Broadcast Specific Upgrade Banners & SFX            │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                    Enemy Wave Stats (Pure Scaling)                     │
│                                                                        │
│  Base Boss HP (280) * StageHpMult(wave) * TierHpMult(tier)             │
│  [No playerDpsBonus, No playerHpRatio, No artificial rubberbanding]   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
┌───────────────────────────────────▼────────────────────────────────────┐
│                  Simplified Death Summary ("does UI")                  │
│                                                                        │
│  Run Stats ──► High Wave / Shards / Reserve Cash ──► [DEPLOY AGAIN]   │
└────────────────────────────────────────────────────────────────────────┘
```

### Affected Files & Core Changes
1. **`src/types.ts` & `src/game/constants.ts`:**
   - Define `free_damage_chance` (Damage group), `free_defense_chance` (Health group), and `free_utility_chance` (Utility group) in `UPGRADES_CONFIG`.
   - Set increment to `0.0025` (+0.25%), base cost to 60, cost growth 1.22, max level 100.
   - Update `getEnemyWaveStats()`: Remove `playerDpsBonus` and `playerDefensePenetration` so boss and wave HP rely strictly on `stageHpMult * tierHpMult`.
2. **`src/game/Simulation.ts`:**
   - In wave completion handler (`advanceWave`), replace the single free upgrade check with three distinct rolls for Damage, Defense, and Utility.
   - For each track, filter eligible upgrades in that specific `group`, increment level, play sound, and spawn distinct text notification naming the exact upgrade rewarded.
3. **`src/components/SettingsModal.tsx`:**
   - Redesign tabs and layout with clean visual hierarchy.
   - Remove the weapon fire protocol selector from the Gameplay tab.
4. **`src/components/DeathSummary.tsx`:**
   - Streamline into a clean, single-screen Battle Debrief modal focusing on run metrics, rewards, and a high-contrast Deploy Again button.
5. **`src/components/UpgradeTile.tsx`:**
   - Add specialized badges, icon styling, and description formatters for the three free upgrade types.
