sed -i "s/import { soundEngine } from '\.\.\/game\/sound';/import { soundEngine } from '\.\.\/game\/sound';\nimport { bgmEngine } from '\.\.\/game\/bgm';/" src/components/SettingsModal.tsx
sed -i "s/const next = soundEngine.toggleMute();/const next = soundEngine.toggleMute();\n                      bgmEngine.setMute(next);/" src/components/SettingsModal.tsx
