cat << 'INNER_EOF' > /tmp/ds_patch.js
const fs = require('fs');
let code = fs.readFileSync('src/components/DeathSummary.tsx', 'utf8');

// Add popup state
code = code.replace("const isLabUnlocked = gameState.highestWaveEver >= 30;", 
  "const isLabUnlocked = gameState.highestWaveEver >= 20;\n  const [showLabUnlockPopup, setShowLabUnlockPopup] = useState(false);\n  \n  React.useEffect(() => {\n    if (isLabUnlocked && !localStorage.getItem('pixel_lab_unlocked')) {\n      localStorage.setItem('pixel_lab_unlocked', 'true');\n      setShowLabUnlockPopup(true);\n      setTimeout(() => setShowLabUnlockPopup(false), 5000);\n    }\n  }, [isLabUnlocked]);");

// Make sure we have the AnimatePresence for the popup
const popupCode = `
      {/* Lab Unlock Popup */}
      <AnimatePresence>
        {showLabUnlockPopup && (
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="absolute top-20 right-4 bg-emerald-900/90 border border-emerald-500/50 p-3 rounded-xl shadow-2xl z-50 flex items-center gap-3 max-w-[200px]"
          >
            <FlaskConical className="w-8 h-8 text-emerald-400 shrink-0" />
            <div>
              <h4 className="text-white font-bold text-xs font-mono">Achievement!</h4>
              <p className="text-emerald-200 text-[10px]">Congrats! Check out the lab now.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
`;

code = code.replace("{/* 3. MAIN TAB CONTENT AREA */}", popupCode + "\n      {/* 3. MAIN TAB CONTENT AREA */}");

// Add tooltip/hint for locked lab
code = code.replace("!isLabUnlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'",
"!isLabUnlocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'\n          }\n          title={!isLabUnlocked ? 'Defeat a Wave 20 boss to unlock' : ''");

fs.writeFileSync('src/components/DeathSummary.tsx', code);
INNER_EOF
node /tmp/ds_patch.js
