cat << 'INNER_EOF' > /tmp/fix_dups.js
const fs = require('fs');
let code = fs.readFileSync('src/game/Simulation.ts', 'utf8');

// The script added waveTimeElapsed twice if I ran it twice. Let's clean it up.
// Find all declarations and keep only one.
code = code.replace(/private waveTimeElapsed: number = 0;\n  private readonly WAVE_DURATION_MS = 15000;\n/g, "");
code = code.replace("private prevEnemiesInRangeCount: number = 0;", 
  "private prevEnemiesInRangeCount: number = 0;\n  private waveTimeElapsed: number = 0;\n  private readonly WAVE_DURATION_MS = 15000;");

fs.writeFileSync('src/game/Simulation.ts', code);
INNER_EOF
node /tmp/fix_dups.js
