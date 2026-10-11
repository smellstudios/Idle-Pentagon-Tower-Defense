cat << 'INNER_EOF' > /tmp/fix_ds2.js
const fs = require('fs');
let code = fs.readFileSync('src/components/DeathSummary.tsx', 'utf8');

const regex = /className=\{\`flex flex-col items-center justify-center flex-1 py-1 transition-all relative \$\{[\s\S]*?\}\`\}/m;

// Find the button part
const startIdx = code.indexOf('if (!isLabUnlocked) return;');
const endIdx = code.indexOf('<FlaskConical', startIdx);
const subCode = code.substring(startIdx, endIdx);

// Let's just string replace the exact block
code = code.replace(subCode, 
  "if (!isLabUnlocked) return;\n            soundEngine.playTabSwitch();\n            setActiveTab('lab');\n          }}\n          title={!isLabUnlocked ? 'Defeat a Wave 20 boss to unlock' : undefined}\n          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all relative ${\n            !isLabUnlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'\n          } ${\n            activeTab === 'lab' ? 'text-purple-400 scale-105' : 'text-zinc-500 hover:text-zinc-300'\n          }`}\n        >\n          {isLabUnlocked ? (\n            "
);
fs.writeFileSync('src/components/DeathSummary.tsx', code);
INNER_EOF
node /tmp/fix_ds2.js
