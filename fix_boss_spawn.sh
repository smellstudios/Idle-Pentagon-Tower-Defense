cat << 'INNER_EOF' > /tmp/boss_patch.js
const fs = require('fs');
let code = fs.readFileSync('src/game/Simulation.ts', 'utf8');

const oldBlock = `      if (isBossWave) {
        if (this.state.enemiesRemaining > 0) {
          this.spawnEnemy(true);
          this.state.enemiesRemaining = 0;
        }
      } else {
        if (this.spawnTimer > baseSpawnInterval) {
          this.spawnEnemy(false);
          this.spawnTimer = 0;
        }
      }`;

const newBlock = `      if (this.spawnTimer > baseSpawnInterval) {
        this.spawnEnemy(false);
        this.spawnTimer = 0;
      }
      
      if (isBossWave && this.state.enemiesRemaining > 0) {
        this.spawnEnemy(true);
        this.state.enemiesRemaining = 0;
      }`;

code = code.replace(oldBlock, newBlock);
fs.writeFileSync('src/game/Simulation.ts', code);
INNER_EOF
node /tmp/boss_patch.js
