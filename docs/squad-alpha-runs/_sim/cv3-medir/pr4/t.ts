import { simulateDungeonRunV3, type DungeonSkill } from '../src/utils/dungeonFight';
import { simulateArenaRunV3, type ArenaRunConfig, type ArenaSkill } from '../src/utils/arena';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from '../src/utils/combate/level';
import { DUNGEON_SLOTS, DUNGEON_FLOOR_GROWTH } from '../src/utils/dungeon';
import { SPECIAL_FAMILIES, CHEER } from '../src/utils/combate/specials';
const PP: number[] | null = process.env.PARAMS ? JSON.parse(process.env.PARAMS) : null;
if (PP) { DUNGEON_SLOTS.forEach((s, k) => { (s as any).hp = PP[k]; (s as any).power = PP[6 + k]; }); (DUNGEON_FLOOR_GROWTH as any).hp = PP[12]; (DUNGEON_FLOOR_GROWTH as any).power = PP[13]; }
const N = +(process.env.N ?? 1200);
const VALS: number[] = JSON.parse(process.env.VALS ?? '[3,4,5,6,8,10,12,16]');
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const P = (x: number) => (100 * x).toFixed(1) + '%';
const fam = (i: number) => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const cell = (s: number) => ({ level: RULER_LEVELS[s % 15], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]], family: fam(s >> 4) });
const acell = (s: number, area: 'single' | 'area'): ArenaRunConfig => ({ ...cell(s), area });
const arenaWin = (skill: ArenaSkill, cheer: 'nenhum' | 'teto') => { let w = 0; for (let s = 0; s < N; s++) w += +simulateArenaRunV3({ ...acell(s, s & 1 ? 'area' : 'single'), cheer }, s, skill).won; return w / N; };
const arenaTtk = (skill: ArenaSkill, cheer: 'nenhum' | 'teto') => { const t: number[] = []; for (let s = 0; s < 800; s++) t.push(...simulateArenaRunV3({ ...acell(s, s & 1 ? 'area' : 'single'), cheer }, s, skill).rounds.slice(0, 3)); return mean(t); };
const dunLadder = (skill: DungeonSkill, cheer: 'nenhum' | 'teto') => { let w = 0, n = 0; for (let s = 0; s < N * 2; s++) { const r = simulateDungeonRunV3({ ...cell(s), cheer }, s, skill, 6); w += r.floorsCleared; n += 6; } return w / n; };
const dunTtk = (skill: DungeonSkill, cheer: 'nenhum' | 'teto') => { const t: number[] = []; for (let s = 0; s < 800; s++) t.push(...simulateDungeonRunV3({ ...cell(s), cheer }, s, skill, 3).timesByFloor.flat()); return mean(t); };
const tapsBase = CHEER.energyPerDischarge;
for (const v of VALS) {
  (CHEER as any).energyPerDischarge = v;
  const aN = arenaWin('nenhuma', 'nenhum'), aB = arenaWin('boa', 'nenhum'), aBT = arenaWin('boa', 'teto'), aNT = arenaWin('nenhuma', 'teto');
  const aT0 = arenaTtk('nenhuma', 'nenhum'), aT1 = arenaTtk('nenhuma', 'teto');
  const dN = dunLadder('nenhuma', 'nenhum'), dB = dunLadder('boa', 'nenhum'), dBT = dunLadder('boa', 'teto'), dNT = dunLadder('nenhuma', 'teto');
  const dT0 = dunTtk('nenhuma', 'nenhum'), dT1 = dunTtk('nenhuma', 'teto');
  console.log(`E/descarga ${v}: ARENA gap(boa-nenhuma) ${(100*(aB-aN)).toFixed(1)}pp · estrito(boa+teto-nenhuma) ${(100*(aBT-aN)).toFixed(1)}pp · ambos teto ${(100*(aBT-aNT)).toFixed(1)}pp · torcida sozinha +${(100*(aNT-aN)).toFixed(1)}pp · TTK teto ${((aT1/aT0-1)*100).toFixed(1)}%`);
  console.log(`            MASMORRA(6 andares) gap ${(100*(dB-dN)).toFixed(1)}pp · estrito ${(100*(dBT-dN)).toFixed(1)}pp · ambos teto ${(100*(dBT-dNT)).toFixed(1)}pp · torcida sozinha +${(100*(dNT-dN)).toFixed(1)}pp · TTK teto ${((dT1/dT0-1)*100).toFixed(1)}%`);
}
