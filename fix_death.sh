cat << 'INNER_EOF' > /tmp/fix_ds.js
const fs = require('fs');
let code = fs.readFileSync('src/components/DeathSummary.tsx', 'utf8');

code = code.replace(
  "!isLabUnlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'\\n          }\\n          title={!isLabUnlocked ? 'Defeat a Wave 20 boss to unlock' : ''\\n          } ${",
  "!isLabUnlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'\\n          } ${\\n            activeTab === 'lab' ? 'text-purple-400 scale-105' : 'text-zinc-500 hover:text-zinc-300'\\n          }\`}\\n          title={!isLabUnlocked ? 'Defeat a Wave 20 boss to unlock' : ''}"
);
fs.writeFileSync('src/components/DeathSummary.tsx', code);
INNER_EOF
node /tmp/fix_ds.js
