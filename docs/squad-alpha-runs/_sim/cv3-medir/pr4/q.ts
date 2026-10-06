import { simulateDungeonRunV3 } from '../src/utils/dungeonFight';
import { simulateArenaRunV3 } from '../src/utils/arena';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES } from '../src/utils/combate/specials';
const cell = (s: number) => ({ level: RULER_LEVELS[s % 15], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]], family: SPECIAL_FAMILIES[(s >> 4) % 7] });
const N = 1200;
for (const cheer of ['nenhum', 'teto'] as const) for (const sk of ['nenhuma', 'media', 'boa'] as const) {
  let c5 = 0, c4 = 0, c6 = 0, aw = 0;
  for (let s = 0; s < N; s++) { const r = simulateDungeonRunV3({ ...cell(s), cheer }, s, sk, 6); c4 += +(r.floorsCleared >= 4); c5 += +(r.floorsCleared >= 5); c6 += +(r.floorsCleared >= 6); aw += +simulateArenaRunV3({ ...cell(s), area: s & 1 ? 'area' : 'single', cheer }, s, sk).won; }
  console.log(`torcida ${cheer} · habilidade ${sk}: Masmorra andar4 ${(100*c4/N).toFixed(1)}% andar5 ${(100*c5/N).toFixed(1)}% andar6 ${(100*c6/N).toFixed(1)}% · Arena run vencida ${(100*aw/N).toFixed(1)}%`);
}
