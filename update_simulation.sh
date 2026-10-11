cat << 'INNER_EOF' > /tmp/sim_patch.js
const fs = require('fs');
let code = fs.readFileSync('src/game/Simulation.ts', 'utf8');

// Add waveTimeElapsed property
code = code.replace("private prevEnemiesInRangeCount: number = 0;", 
  "private prevEnemiesInRangeCount: number = 0;\n  private waveTimeElapsed: number = 0;\n  private readonly WAVE_DURATION_MS = 15000;");

// Find the wave active block
const blockStart = code.indexOf("if (this.state.isWaveActive) {");
const blockEnd = code.indexOf("} else {\n      // Auto-start next wave if clean");
let waveBlock = code.substring(blockStart, blockEnd);

// Replace the block
let newWaveBlock = `if (this.state.isWaveActive) {
      this.waveTimeElapsed += deltaMs;
      this.spawnTimer += deltaMs;
      
      const isBossWave = WAVE_CONFIG.isBossWave(this.state.wave);
      const enemyBalanceCard = this.getEquippedCardEffect('enemy_balance');
      const baseSpawnInterval = enemyBalanceCard ? 600 : 900;

      if (isBossWave) {
        if (this.state.enemiesRemaining > 0) {
          this.spawnEnemy(true);
          this.state.enemiesRemaining = 0;
        }
      } else {
        if (this.spawnTimer > baseSpawnInterval) {
          this.spawnEnemy(false);
          this.spawnTimer = 0;
        }
      }

      // Wave completed when time is up
      if (this.waveTimeElapsed >= this.WAVE_DURATION_MS) {
        const nextWave = this.state.wave + 1;
        const waveCashBonus = this.getWaveCompletionCashBonus(this.state.wave);
        const waveShardsBonus = this.getWaveCompletionShardsBonus(this.state.wave);

        stateUpdate.isWaveActive = false;
        stateUpdate.wave = nextWave;
        stateUpdate.highestWaveThisRun = Math.max(this.state.highestWaveThisRun || 1, nextWave);
        stateUpdate.highestWaveEver = Math.max(this.state.highestWaveEver || 1, nextWave);
        stateUpdate.cash = this.state.cash + waveCashBonus;
        stateUpdate.cosmicShards = this.state.cosmicShards + waveShardsBonus;

        // Update Lifetime stats
        const currentTier = this.state.tier || 1;
        const highestInTier = Math.max(this.state.stats?.highestWavePerTier?.[currentTier] || 0, nextWave);
        const updatedStats = {
          ...this.state.stats,
          highestWavePerTier: {
            ...(this.state.stats?.highestWavePerTier || {}),
            [currentTier]: highestInTier,
          },
          lifetimeCash: (this.state.stats?.lifetimeCash || 0) + waveCashBonus,
          lifetimeCosmicShards: (this.state.stats?.lifetimeCosmicShards || 0) + waveShardsBonus,
        } as any;
        stateUpdate.stats = updatedStats;

        // Check Milestone Unlocks & Missions
        this.checkWaveMissionsAndMilestones(nextWave, currentTier, stateUpdate);
        
        this.state.isWaveActive = false;
        this.waveTimeElapsed = 0;
      }
    `;

code = code.replace(waveBlock, newWaveBlock);

// Replace auto-start clean block
code = code.replace("if (this.enemies.length === 0 && this.state.enemiesRemaining === 0) {", 
"if (!this.state.isWaveActive) {");

// Change spawnEnemy signature and logic
let spawnEnemyStr = `private spawnEnemy() {
    const wave = this.state.wave;
    const tier = this.state.tier || 1;
    const isBossWave = WAVE_CONFIG.isBossWave(wave);
    const isBossSpawn = isBossWave && this.state.enemiesRemaining === 1;
    const type = isBossSpawn ? 'boss' : this.getRandomEnemyType(wave);`;

let newSpawnEnemyStr = `private spawnEnemy(isBoss: boolean = false) {
    const wave = this.state.wave;
    const tier = this.state.tier || 1;
    const type = isBoss ? 'boss' : this.getRandomEnemyType(wave);`;

code = code.replace(spawnEnemyStr, newSpawnEnemyStr);
code = code.replace("this.state.enemiesRemaining--;", ""); // Remove decrement from here

// Fix startWave
code = code.replace("this.state.enemiesRemaining = WAVE_CONFIG.enemiesPerWave;", "this.state.enemiesRemaining = 1; this.waveTimeElapsed = 0;");

// Fix wave progress visual
let waveProgressStr = `// 8. Update Wave Progress indicator
    const total = this.state.totalEnemiesInWave || WAVE_CONFIG.enemiesPerWave;
    const progress = 1 - (this.state.enemiesRemaining + this.enemies.length) / total;
    stateUpdate.waveProgress = Math.max(0, Math.min(1, progress));`;

let newWaveProgressStr = `// 8. Update Wave Progress indicator
    const progress = this.waveTimeElapsed / this.WAVE_DURATION_MS;
    stateUpdate.waveProgress = Math.max(0, Math.min(1, progress));`;

code = code.replace(waveProgressStr, newWaveProgressStr);

fs.writeFileSync('src/game/Simulation.ts', code);
INNER_EOF
node /tmp/sim_patch.js
