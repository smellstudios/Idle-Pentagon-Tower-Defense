const fs = require('fs');
let code = fs.readFileSync('src/components/UpgradePanel.tsx', 'utf8');
code = code.replace("ChevronDown, ", "");
fs.writeFileSync('src/components/UpgradePanel.tsx', code);
