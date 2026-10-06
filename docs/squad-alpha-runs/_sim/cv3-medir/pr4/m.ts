import { simulateDungeonRunV3, simulateNightmareV3, type DungeonSkill } from '../src/utils/dungeonFight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES } from '../src/utils/combate/specials';
import { PROFISSAO_MASMORRA, jeitoDaProfissao } from '../src/utils/profissaoMasmorra';
import { dungeonFoe, DUNGEON_SLOTS, DUNGEON_FLOOR_GROWTH } from '../src/utils/dungeon';
import { displayHits, hitsToKnockOut } from '../src/utils/combate/curve';
import { hitUnit } from '../src/utils/combate/fight';
import { combatantAt } from '../src/utils/combate/level';

const J = (k: string) => (process.env[k] ? JSON.parse(process.env[k] as string) : null);
if (J('SLOT_HP')) J('SLOT_HP').forEach((v: number, i: number) => { (DUNGEON_SLOTS[i] as any).hp = v; });
if (J('SLOT_POW')) J('SLOT_POW').forEach((v: number, i: number) => { (DUNGEON_SLOTS[i] as any).power = v; });
if (process.env.GHP) (DUNGEON_FLOOR_GROWTH as any).hp = +process.env.GHP;
if (process.env.GPOW) (DUNGEON_FLOOR_GROWTH as any).power = +process.env.GPOW;
const N = +(process.env.N ?? 600);
const ONLY = (process.env.ONLY ?? 'dun,night,jeito,skill').split(',');
const on = (k: string) => ONLY.includes(k);
const P = (x: number) => (100 * x).toFixed(1) + '%';
const q = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const fam = (i: number) => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const cell = (s: number) => ({ level: RULER_LEVELS[s % 15], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]], family: fam(s >> 4) });

if (on('dun')) {
  const reach: number[] = []; const tBy: number[][] = Array.from({ length: 8 }, () => []);
  for (let s = 0; s < N * 2; s++) { const r = simulateDungeonRunV3(cell(s), s, 'media', 8); reach.push(r.floorsCleared); r.timesByFloor.forEach((t, i) => tBy[i].push(...t)); }
  console.log('escada: ' + [1,2,3,4,5,6,7,8].map(n => `${n}:${P(reach.filter(r => r >= n).length / reach.length)}`).join(' '));
  console.log('TTK: ' + tBy.map((t, i) => t.length ? `A${i+1} ${q(t,.5).toFixed(1)}/${q(t,.95).toFixed(1)}` : '').filter(Boolean).join(' · '));
  const L = [1, 21, 40].map(l => { const pl = combatantAt(l, REFERENCE_BUILDS.balanced); return `L${l}: ` + [1,2,3,4,5,6].map(f => displayHits(hitsToKnockOut(pl, dungeonFoe(l,5,f).combatant) / hitUnit(l))).join('/'); });
  console.log('golpes mega: ' + L.join(' · '));
}
if (on('night')) {
  const rows: string[] = [];
  for (let top = 1; top <= 5; top++) {
    let win = 0; const ts: number[] = [];
    for (let s = 0; s < N; s++) { const r = simulateNightmareV3(cell(s), top, s); ts.push(...r.times); win += +r.won; }
    rows.push(`top ${top}: vence ${P(win / N)} TTK ${q(ts,.5).toFixed(1)}/${q(ts,.95).toFixed(1)}`);
  }
  console.log('Pesadelo: ' + rows.join(' · '));
}
if (on('jeito')) {
  const base = (jeito?: any) => { const r: number[] = []; const t: number[] = []; for (let s = 0; s < N; s++) { const x = simulateDungeonRunV3({ ...cell(s), jeito }, s, 'media', 3); r.push(x.floorsCleared); t.push(...x.timesByFloor.flat()); } return { r: mean(r), t: mean(t) }; };
  const b0 = base();
  console.log(`oficios padrao: andares ${b0.r.toFixed(2)} TTK ${b0.t.toFixed(1)}`);
  console.log(Object.keys(PROFISSAO_MASMORRA).map(k => { const b = base(jeitoDaProfissao(k)); return `${k} TTK ${((b.t / b0.t - 1) * 100).toFixed(1)}% andares ${b.r.toFixed(2)}`; }).join(' · '));
}
if (on('skill')) {
  for (const cheer of ['nenhum', 'teto'] as const) {
    const out: string[] = [];
    for (const sk of ['nenhuma', 'media', 'boa'] as DungeonSkill[]) {
      let w = 0; let n = 0;
      for (let s = 0; s < N * 2; s++) { const r = simulateDungeonRunV3({ ...cell(s), cheer }, s, sk, 3); w += r.floorsCleared; n += 3; }
      out.push(`${sk} ${P(w / n)}`);
    }
    console.log(`habilidade (3 andares, cheer ${cheer}): ` + out.join(' · '));
  }
}
if (on('slot')) {
  const T: number[][][] = Array.from({ length: 6 }, () => Array.from({ length: 6 }, () => []));
  for (let s = 0; s < N * 2; s++) { const r = simulateDungeonRunV3(cell(s), s, 'media', 6); r.timesByFloor.forEach((t, f) => t.forEach((x, k) => T[f][k].push(x))); }
  for (let f = 0; f < 6; f++) console.log(`A${f + 1}: ` + T[f].map((t, k) => `s${k} ${t.length ? q(t, .5).toFixed(1) : '-'}`).join(' '));
}
