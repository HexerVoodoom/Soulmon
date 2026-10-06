// Arena com GRUPOS (N×1) medida com o núcleo real + groupFight. Rodar via esbuild → node.
import { writeFileSync } from 'node:fs';
import { combatantAt, REFERENCE_BUILDS as B, REFERENCE_BUILD_NAMES as BN, RULER_LEVELS, stageOfLevel } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES, specialOf } from '../src/utils/combate/specials';
import { mulberry32 } from '../src/utils/combate/rng';
import { fightX } from './fightx';
import { groupFight, AREA_FAMILIES, type Area, type GSide } from './groupfight';
const P = (x: number) => (100 * x).toFixed(1) + '%';
const q = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const N = +(process.env.N ?? 200); const U = 10; const VAR = { rho: 0.9, sigma: 0.08, floor: 0.05 };
const out: string[] = []; const say = (s: string) => { out.push(s); console.log(s); };
const J = (k: string, d: any) => (process.env[k] ? JSON.parse(process.env[k] as string) : d);
const fam = (i: number) => SPECIAL_FAMILIES[((i % 7) + 7) % 7];

// 0. compatibilidade N=1
{ let bad = 0; for (let s = 0; s < 300; s++) { const L = RULER_LEVELS[s % 15]; const a = { combatant: combatantAt(L, B[BN[s % 4]]), special: specialOf(fam(s)) }; const b = { combatant: combatantAt(L, B[BN[(s + 1) % 4]]), special: specialOf(fam(s + 3)) };
  const r1 = fightX(a, b, { seed: s * 77, unitH0: U, variance: VAR }); const r2 = groupFight({ ...a, area: 'area' }, [b], { seed: s * 77, unitH0: U, variance: VAR });
  const t1 = Math.min(r1.timeA, r1.timeB); const w1 = r1.winner === 'A' ? 'player' : r1.winner === 'B' ? 'foes' : 'draw';
  if (Math.abs(t1 - r2.t) > 1e-9 || w1 !== r2.winner) bad++; }
  say(`## 0 groupFight N=1 (área ligada) ≡ fight 1º KO/vencedor: divergências ${bad}/300`); }

interface Shape { hp: number; power: number; special?: boolean }
const CLS: Record<string, Shape> = J('CLS', { weak: { hp: 0.4, power: 0.1 }, medium: { hp: 0.95, power: 0.21 }, boss: { hp: 1.2, power: 0.445, special: true } });
const COMP = [['medium'], ['weak', 'weak'], ['medium'], ['weak', 'weak', 'weak'], ['boss']];
const GROW = J('GROW', { hp: 0.04, power: 0.13 }); const HEAL = 0.3;
const FAMPOW: Record<string, number> = J('FAMPOW', { direct: 1, dot: 1.1, heal: 0.8, shield: 1, atkBuff: 1.3, defDebuff: 1.3, spdBuff: 1.5 });
const RING: number[] = J('RING', [0.75, 1, 1.35]); const DODGE: number[] = J('DODGE', [0, 0.5, 0.85]);
const AREA_EFF = +(process.env.AREA_EFF ?? 1);
const SK: Record<string, { ring: number[]; dodge: number[] }> = { nenhuma: { ring: [1, 0, 0], dodge: [1, 0, 0] }, media: { ring: [0.25, 0.5, 0.25], dodge: [0.3, 0.4, 0.3] }, boa: { ring: [0.1, 0.3, 0.6], dodge: [0.1, 0.3, 0.6] } };
const pick = (r: () => number, p: number[]) => { const x = r(); return x < p[0] ? 0 : x < p[0] + p[1] ? 1 : 2; };
const foe = (L: number, s: Shape, r: number): GSide => { const b = combatantAt(L, B.balanced); return { combatant: { ...b, hp: b.hp * s.hp * (1 + GROW.hp * r), bonus: s.power * (1 + GROW.power * r) - 1 }, special: s.special ? specialOf('direct') : null }; };
function run(L: number, bn: string, f: string, area: Area, seed: number, sk: string) {
  const pl: GSide = { combatant: combatantAt(L, (B as any)[bn]), special: specialOf(f as any), area };
  let hp = 1, en = 0; const ts: number[] = []; let tot = 0;
  for (let r = 0; r < 5; r++) {
    const rng = mulberry32((seed * 7919 + r) | 0);
    const res = groupFight(pl, COMP[r].map((c) => foe(L, CLS[c], r)), {
      seed: seed * 101 + r, unitH0: U, variance: VAR, startHp: hp, startEnergy: en,
      castScale: (who) => (who === 0 ? RING[pick(rng, SK[sk].ring)] * (FAMPOW[f] ?? 1) * (area === 'area' && AREA_FAMILIES.has(f) ? AREA_EFF : 1) : 1 - DODGE[pick(rng, SK[sk].dodge)]),
      hitScale: (who) => { if (who === 0) return 1; const acc = Math.min(1, Math.max(0, 0.7 + (rng() * 2 - 1) * 0.25)); return acc >= 0.92 ? 0 : (1 - acc) / 0.3; },
    });
    ts.push(res.t); tot += res.t;
    if (res.winner !== 'player') return { won: false, ts, tot };
    hp = Math.min(1, res.hpLeft + HEAL); en = res.energyLeft;
  }
  return { won: true, ts, tot };
}
const cell = (s: number) => ({ L: RULER_LEVELS[s % 15], bn: BN[(s >> 2) % 4], f: fam(s >> 4) });
say(`## Arena N×1 — CLS ${JSON.stringify(CLS)} GROW ${JSON.stringify(GROW)} RING ${JSON.stringify(RING)} DODGE ${JSON.stringify(DODGE)} AREA_EFF ${AREA_EFF}`);
const byRound: number[][] = [[], [], [], [], []]; const byB: Record<string, number[]> = {}; const byF: Record<string, number[]> = {}; const bySt: number[][] = [[], [], [], [], []];
const pair: Record<string, { s: number[]; a: number[]; ts: number[]; ta: number[] }> = {};
for (let s = 0; s < N * 8; s++) {
  const c = cell(s);
  for (const area of ['single', 'area'] as Area[]) {
    const x = run(c.L, c.bn, c.f, area, s, 'media');
    x.ts.forEach((t, i) => byRound[i].push(t));
    (byB[c.bn] ??= []).push(+x.won); (byF[`${c.f}/${area}`] ??= []).push(+x.won); bySt[stageOfLevel(c.L)].push(+x.won);
    const p = (pair[c.f] ??= { s: [], a: [], ts: [], ta: [] }); if (area === 'single') { p.s.push(+x.won); if (x.won) p.ts.push(x.tot); } else { p.a.push(+x.won); if (x.won) p.ta.push(x.tot); }
  }
}
say(`    duração por rodada (mediana/P95): ${byRound.map((t, i) => `R${i + 1}[${COMP[i].length}] ${q(t, 0.5).toFixed(1)}/${q(t, 0.95).toFixed(1)}`).join(' · ')}`);
const spread = (o: Record<string, number[]>) => { const v = Object.values(o).map(mean); return Math.max(...v) - Math.min(...v); };
say(`    vitória por build: ${Object.entries(byB).map(([k, v]) => `${k} ${P(mean(v))}`).join(' · ')} → spread ${P(spread(byB))}`);
say(`    vitória por família/área: ${Object.entries(byF).map(([k, v]) => `${k} ${P(mean(v))}`).join(' · ')} → spread ${P(spread(byF))}`);
say(`    por estágio: ${bySt.map((v, i) => `s${i} ${P(mean(v))}`).join(' · ')} · média ${P(mean(Object.values(byB).flat()))}`);
say(`    régua pareada área×único (mesmas seeds), só famílias de alvo: ${[...AREA_FAMILIES].map((f) => { const p = pair[f]; return `${f}: Δvitória ${(100 * (mean(p.a) - mean(p.s))).toFixed(1)}pp · Δtempo da run vencida ${P(mean(p.ta) / mean(p.ts) - 1)}`; }).join(' · ')}`);
for (const sk of ['nenhuma', 'boa']) { let w = 0, n = 0; for (let s = 0; s < N * 4; s++) { const c = cell(s); w += +run(c.L, c.bn, c.f, (s & 1 ? 'area' : 'single'), s, sk).won; n++; } say(`    habilidade ${sk}: vitória ${P(w / n)}`); }
writeFileSync(process.env.OUT ?? 'grupo-out.txt', out.join('\n') + '\n');
