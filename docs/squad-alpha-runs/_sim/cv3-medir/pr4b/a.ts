import { simulateArenaRunV3, type ArenaRunConfig, type ArenaSkill } from '../src/utils/arena';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES, CHEER } from '../src/utils/combate/specials';
const N = +(process.env.N ?? 2400);
const VALS: number[] = JSON.parse(process.env.VALS ?? '[3,10,15,20,25,30,40,60]');
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const fam = (i: number) => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const cell = (s: number) => ({ level: RULER_LEVELS[s % 15], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]], family: fam(s >> 4) });
const acell = (s: number): ArenaRunConfig => ({ ...cell(s), area: s & 1 ? 'area' : 'single' } as any);
const win = (skill: ArenaSkill, cheer: 'nenhum' | 'teto') => { let w = 0; for (let s = 0; s < N; s++) w += +simulateArenaRunV3({ ...acell(s), cheer } as any, s, skill).won; return w / N; };
const ttk = (skill: ArenaSkill, cheer: 'nenhum' | 'teto') => { const t: number[] = []; for (let s = 0; s < 800; s++) t.push(...simulateArenaRunV3({ ...acell(s), cheer } as any, s, skill).rounds.slice(0, 3)); return mean(t); };
const pp = (x: number) => (100 * x).toFixed(1);
for (const v of VALS) {
  (CHEER as any).energyPerDischarge = v;
  const mN = win('media','nenhum'), mT = win('media','teto'); console.log('media sem torcida', pp(mN), 'com torcida no teto', pp(mT)); const nN = win('nenhuma', 'nenhum'), nT = win('nenhuma', 'teto'), bN = win('boa', 'nenhum'), bT = win('boa', 'teto');
  const t0 = ttk('nenhuma', 'nenhum'), t1 = ttk('nenhuma', 'teto');
  console.log(`E=${v}: torcida (teto - nenhum) nenhuma +${pp(nT - nN)}pp (${pp(nN)}->${pp(nT)}) · boa +${pp(bT - bN)}pp (${pp(bN)}->${pp(bT)}) · TTK ${((t1 / t0 - 1) * 100).toFixed(1)}%`);
}
