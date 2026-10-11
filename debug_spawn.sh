cat << 'INNER_EOF' > /tmp/debug_spawn.js
const fs = require('fs');
let code = fs.readFileSync('src/game/Simulation.ts', 'utf8');

const target = "      if (this.spawnTimer > baseSpawnInterval) {";
const replacement = "      console.log('SPAWNING TICK:', { timer: this.spawnTimer, interval: baseSpawnInterval, active: this.state.isWaveActive, enemiesLeft: this.state.enemiesRemaining });\n" + target;

code = code.replace(target, replacement);
fs.writeFileSync('src/game/Simulation.ts', code);
INNER_EOF
node /tmp/debug_spawn.js
