sed -i "s/import { soundEngine } from '\.\/game\/sound';/import { soundEngine } from '\.\/game\/sound';\nimport { bgmEngine } from '\.\/game\/bgm';/" src/App.tsx
sed -i "s/soundEngine.startBGM();/bgmEngine.startBGM();/" src/App.tsx
