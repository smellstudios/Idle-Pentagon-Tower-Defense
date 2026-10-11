const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');

code = code.replace("baseCost: number; // Cash cost", "baseCost: number; // Cash cost\n  unlockTier?: number;");

fs.writeFileSync('src/types.ts', code);
