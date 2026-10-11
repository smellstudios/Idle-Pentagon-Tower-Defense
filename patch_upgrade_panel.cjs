const fs = require('fs');
let code = fs.readFileSync('src/components/UpgradePanel.tsx', 'utf8');

// 1. Remove the downward arrow
code = code.replace(/\{isOpen && \(\s*<button\s*onClick=\{\(\) => setIsOpen\(false\)\}\s*title="Collapse Upgrade Drawer"[\s\S]*?<ChevronDown className="w-3\.5 h-3\.5" \/>\s*<\/button>\s*\)\}/, "");

// 2. Add unlock logic
const unlockLogic = `
  const unlockKey = \`unlock_\${activeGroup.toLowerCase()}\`;
  const currentUnlockLevel = gameState.workshopUpgrades[unlockKey] || 0;
  const visibleUpgrades = filteredUpgrades.filter(u => (u.unlockTier || 0) <= currentUnlockLevel);
  const hasMoreTiers = filteredUpgrades.some(u => (u.unlockTier || 0) > currentUnlockLevel);
  const nextUnlockCost = currentUnlockLevel === 0 ? 50 : currentUnlockLevel === 1 ? 250 : 1000;

  const handleUnlockTier = () => {
    if (gameState.cosmicShards >= nextUnlockCost) {
      soundEngine.playUpgradeSuccess();
      onStateUpdate({
        cosmicShards: gameState.cosmicShards - nextUnlockCost,
        workshopUpgrades: {
          ...gameState.workshopUpgrades,
          [unlockKey]: currentUnlockLevel + 1
        }
      });
    }
  };
`;
code = code.replace("const filteredUpgrades = upgrades.filter(u => u.group === activeGroup);", 
  "const filteredUpgrades = upgrades.filter(u => u.group === activeGroup);\n" + unlockLogic);

// 3. Render visibleUpgrades instead of filteredUpgrades, and add unlock button
const renderLogic = `
                <div className="grid grid-cols-2 gap-2 pb-3">
                  {visibleUpgrades.map(upgrade => (
                    <UpgradeTile 
                      key={upgrade.id}
                      upgrade={upgrade}
                      gameState={gameState}
                      onBuy={onBuy}
                      calculateCost={calculateUpgradeCost}
                    />
                  ))}
                  {hasMoreTiers && (
                    <div className="col-span-2 mt-2">
                      <button
                        onClick={handleUnlockTier}
                        disabled={gameState.cosmicShards < nextUnlockCost}
                        className={\`w-full py-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all \${
                          gameState.cosmicShards >= nextUnlockCost
                            ? 'bg-purple-900/40 border-purple-500/50 hover:bg-purple-800/60 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                            : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 cursor-not-allowed'
                        }\`}
                      >
                        <span className="text-[10px] font-mono font-bold uppercase text-purple-200">
                          Unlock Next Tier
                        </span>
                        <div className="flex items-center gap-1.5 font-bold font-mono text-xs">
                          <span className="text-purple-400">✦</span>
                          <span className={gameState.cosmicShards >= nextUnlockCost ? 'text-white' : 'text-zinc-500'}>
                            {nextUnlockCost.toLocaleString()}
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
`;
code = code.replace(/<div className="grid grid-cols-2 gap-2 pb-3">[\s\S]*?<\/div>/, renderLogic);

fs.writeFileSync('src/components/UpgradePanel.tsx', code);
