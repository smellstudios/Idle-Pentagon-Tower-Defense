cat << 'INNER_EOF' > /tmp/fix_lint.js
const fs = require('fs');

// Fix sound.ts
let soundCode = fs.readFileSync('src/game/sound.ts', 'utf8');
soundCode = soundCode.replace(/if \(\!this\.isMuted && \!this\.bgmPlaying\) \{\s*this\.startBGM\(\);\s*\}/g, "");
fs.writeFileSync('src/game/sound.ts', soundCode);

// Fix DeathSummary.tsx imports
let dsCode = fs.readFileSync('src/components/DeathSummary.tsx', 'utf8');
const lines = dsCode.split('\n');
let lockCount = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('Lock')) {
    lockCount++;
    if (lockCount > 1 && lines[i].trim() === 'Lock,') {
      lines[i] = '';
    } else if (lockCount > 1 && lines[i].trim() === 'Lock') {
      lines[i] = '';
    }
  }
}
fs.writeFileSync('src/components/DeathSummary.tsx', lines.join('\n'));
INNER_EOF
node /tmp/fix_lint.js
