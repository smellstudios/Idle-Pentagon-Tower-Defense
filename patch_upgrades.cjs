const fs = require('fs');
let code = fs.readFileSync('src/game/constants.ts', 'utf8');

// We will add unlockTier to each UPGRADES_CONFIG item
const lines = code.split('\n');
let attackCount = 0;
let healthCount = 0;
let utilityCount = 0;

let inConfig = false;
let group = '';

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('export const UPGRADES_CONFIG = [')) {
    inConfig = true;
  }
  if (inConfig && lines[i].includes('group: \'Damage\'')) {
    let tier = 0;
    if (attackCount >= 4 && attackCount < 6) tier = 1;
    if (attackCount >= 6) tier = 2;
    lines[i] = lines[i] + `\n    unlockTier: ${tier},`;
    attackCount++;
  }
  if (inConfig && lines[i].includes('group: \'Health\'')) {
    let tier = 0;
    if (healthCount >= 2 && healthCount < 4) tier = 1;
    if (healthCount >= 4 && healthCount < 6) tier = 2;
    if (healthCount >= 6) tier = 3;
    lines[i] = lines[i] + `\n    unlockTier: ${tier},`;
    healthCount++;
  }
  if (inConfig && lines[i].includes('group: \'Utility\'')) {
    let tier = 0;
    if (utilityCount >= 2 && utilityCount < 4) tier = 1;
    if (utilityCount >= 4) tier = 2;
    lines[i] = lines[i] + `\n    unlockTier: ${tier},`;
    utilityCount++;
  }
  if (inConfig && lines[i] === '];') {
    inConfig = false;
  }
}

fs.writeFileSync('src/game/constants.ts', lines.join('\n'));
