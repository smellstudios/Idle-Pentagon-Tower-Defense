sed -i '/\/\/ PROCEDURAL BACKGROUND MUSIC (BGM)/,$d' src/game/sound.ts
echo "}" >> src/game/sound.ts
echo "export const soundEngine = new SoundEngine();" >> src/game/sound.ts
