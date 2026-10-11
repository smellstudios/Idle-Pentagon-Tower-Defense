# Pixel Pentagons: Upgrade & Waves System

## State Model
- **React Authority**: React maintains the authoritative state for upgrades, cash, gems, and wave progression.
- **Pixi Consumption**: The simulation consumes state updates via `onStateUpdate` and `updateUpgrades`.
- **Bulk Buy Mode**: Supported modes are `x1`, `x10`, and `xMax`.

## Component Architecture
- `UpgradePanel`: Slide-up interface managing category tabs and bulk-buy selection.
- `UpgradeTile`: Quarter-grid (2x2) layout for individual upgrades.
- `WavesUI`: Informational strip anchored to the upgrade panel, providing real-time combat stats.

## Math
- **Cost Formula**: `cost = baseCost * costGrowth ^ level`
- **Bulk Cost**: Iterative calculation for precision, capped at 1000 levels for `xMax` safety.
- **Stat Growth**: Linear increments based on `baseValue + level * increment`.

## Performance
- Expensive bulk calculations are computed only on interaction.
- Simulation uses a separate loop from React renders.
