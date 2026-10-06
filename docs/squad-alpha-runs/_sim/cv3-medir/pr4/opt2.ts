import { simulateDungeonRunV3, simulateNightmareV3 } from '../src/utils/dungeonFight';
import { REFERENCE_BUILD_NAMES, REFERENCE_BUILDS, RULER_LEVELS } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES } from '../src/utils/combate/specials';
import { DUNGEON_SLOTS, DUNGEON_FLOOR_GROWTH } from '../src/utils/dungeon';
const q = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const fam = (i: number) => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const cell = (s: number) => ({ level: RULER_LEVELS[s % 15], build: REFERENCE_BUILDS[REFERENCE_BUILD_NAMES[(s >> 2) % 4]], family: fam(s >> 4) });
type P = number[]; // hp x6, pow x6, ghp, gpow
const apply = (p: P) => {
  DUNGEON_SLOTS.forEach((s, k) => { (s as any).hp = p[k]; (s as any).power = p[6 + k]; });
  (DUNGEON_FLOOR_GROWTH as any).hp = p[12]; (DUNGEON_FLOOR_GROWTH as any).power = p[13];
};
function evalP(p: P, N: number) {
  apply(p);
  const reach: number[] = []; const tBy: number[][] = Array.from({ length: 7 }, () => []);
  for (let s = 0; s < N * 2; s++) { const r = simulateDungeonRunV3(cell(s), s, 'media', 7); reach.push(r.floorsCleared); r.timesByFloor.forEach((t, i) => tBy[i].push(...t)); }
  const e = [1, 2, 3, 4, 5, 6].map(n => reach.filter(r => r >= n).length / reach.length);
  const A = tBy.slice(0, 5).map(t => q(t, .5));
  const nt: number[] = [];
  for (let top = 1; top <= 5; top++) { const ts: number[] = []; for (let s = 0; s < N; s++) ts.push(...simulateNightmareV3(cell(s), top, s).times); nt.push(q(ts, .5)); }
  return { e, A, nt };
}
let p_: number[] = [];
function loss(m: ReturnType<typeof evalP>) {
  let l = 0;
  for (let i = 0; i < 4; i++) l += Math.max(0, 0.985 - m.e[i]) * 50;
  l += Math.max(0, Math.abs(m.e[4] - 0.35) - 0.04) * 30;
  l += Math.max(0, m.e[5] - 0.02) * 30;
  for (const a of m.A) { l += Math.max(0, 20.4 - a) * 4 + Math.max(0, a - 28.3) * 2; }
  m.nt.forEach((t, i) => { l += Math.max(0, t - 21.85) * 4 + Math.max(0, (i < 2 ? 18.2 : 19.5) - t) * 1; });
  for (let k = 1; k < 6; k++) { l += Math.max(0, p_[k - 1] - p_[k]) * 40; l += Math.max(0, p_[6 + k - 1] - p_[6 + k]) * 400; }
  return l;
}
const s0 = JSON.parse(process.env.START ?? '[0.9012,0.9167,0.9322,0.9477,0.9632,0.9787,0.0293,0.0412,0.0531,0.065,0.0769,0.0888,0.122,0.128]');
let best: P = s0;
const N = +(process.env.N ?? 150);
p_ = best; let bl = loss(evalP(best, N));
const step = [0.02, 0.02, 0.02, 0.02, 0.02, 0.02, 0.006, 0.006, 0.006, 0.006, 0.006, 0.006, 0.02, 0.03];
for (let it = 0; it < +(process.env.IT ?? 150); it++) {
  const c = best.map((v, i) => v + (Math.random() * 2 - 1) * step[i] * (Math.random() < 0.35 ? 1 : 0));
  if (c.some(v => v <= 0)) continue;
  p_ = c; const l = loss(evalP(c, N));
  if (l < bl) { bl = l; best = c; console.log(it, bl.toFixed(2), JSON.stringify(best.map(v => +v.toFixed(4)))); }
}
const m = evalP(best, 600);
console.log('FINAL', JSON.stringify(best.map(v => +v.toFixed(4))), 'loss', loss(m).toFixed(2));
console.log('escada', m.e.map(x => (100 * x).toFixed(1)).join('/'), 'A', m.A.map(x => x.toFixed(1)).join('/'), 'night', m.nt.map(x => x.toFixed(1)).join('/'));
