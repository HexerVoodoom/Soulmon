import { combatantAt, REFERENCE_BUILDS as B, REFERENCE_BUILD_NAMES as BN, STAGE_LEVEL_CAPS, firstLevelOfStage, RULER_LEVELS } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES, specialOf, BUFF_FAMILIES } from '../src/utils/combate/specials';
import { rulerSeed } from '../src/utils/combate/ruler';
import { fight } from '../src/utils/combate/fight';
import { fightX } from './fightx';
const P = (x: number) => (100 * x).toFixed(1) + '%'; const N = 400;
const q = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(p * s.length)]; };
const U = 10;
// a) paridade em L1..6? (u≈1 no L1)
// b) régua pareada com golpe normalizado
let fails = 0; for (const L of [1, 6, 13, 21, 30, 40]) { const c = combatantAt(L, B.balanced); const ref = specialOf('direct'); const row: string[] = [];
  const base: number[] = []; for (let i = 0; i < 200; i++) { const m = fightX({ combatant: c, special: ref }, { combatant: c, special: ref }, { seed: rulerSeed(i, L), hpScale: 3, unitH0: U }); base.push(m.timeA / m.timeB); }
  for (const f of SPECIAL_FAMILIES) { let s = 0; for (let i = 0; i < 200; i++) { const m = fightX({ combatant: c, special: specialOf(f) }, { combatant: c, special: ref }, { seed: rulerSeed(i, L), hpScale: 3, unitH0: U }); s += m.timeA / m.timeB - base[i]; } const d = s / 200; const lo = BUFF_FAMILIES.includes(f) && L <= 6 ? -0.15 : -0.05; if (d < lo || d > 0.05) fails++; row.push(`${f} ${P(d)}`); }
  console.log(`régua golpe normalizado L${L}: ${row.join(' · ')}`); }
console.log(`fora da faixa: ${fails}/42`);
// c) peso do especial por estágio: TTK com/sem especial
for (const L of [1, 13, 21, 40]) { const c = combatantAt(L, B.balanced); let a = 0, b = 0; for (let i = 0; i < 200; i++) { const r1 = fightX({ combatant: c, special: specialOf('direct') }, { combatant: c, special: null }, { seed: i, unitH0: U }); const r0 = fight({ combatant: c, special: specialOf('direct') }, { combatant: c, special: null }, { seed: i }); a += r1.timeB; b += r0.timeB; }
  const ref = fightX({ combatant: c, special: null }, { combatant: c, special: null }, { seed: 1, variance: null, phases: [0, 0], unitH0: U }).timeB; const ref0 = fight({ combatant: c, special: null }, { combatant: c, special: null }, { seed: 1, variance: null, phases: [0, 0] }).timeB;
  console.log(`L${L}: especial direto encurta o TTK em ${P(1 - a / 200 / ref)} (normalizado) vs ${P(1 - b / 200 / ref0)} (main)`); }
// d) mais fraco por estágio com golpe normalizado
for (const sg of [0.15, 0.1, 0.08]) for (const hp of [1, 1.55]) { const rows: string[] = []; let t5 = 0, t1 = 0, n = 0;
  for (let st = 0; st < 5; st++) { const lo = firstLevelOfStage(st), hi = STAGE_LEVEL_CAPS[st]; let b5 = 0, l1 = 0;
    for (let s = 0; s < N; s++) { const L = lo + 1 + (s % (hi - lo)); const bn = BN[(s >> 3) % 4]; const f = specialOf(SPECIAL_FAMILIES[(s >> 1) % 7]); const o = { seed: s * 17 + 3, hpScale: hp, unitH0: U, variance: { rho: 0.9, sigma: sg, floor: 0.05 } };
      const r = fightX({ combatant: combatantAt(L, B[bn], 0.05), special: f }, { combatant: combatantAt(L, B[bn]), special: f }, o); b5 += r.winner === 'B' ? 1 : r.winner === 'draw' ? 0.5 : 0;
      const r2 = fightX({ combatant: combatantAt(L, B[bn]), special: f }, { combatant: combatantAt(L - 1, B[bn]), special: f }, { ...o, seed: s * 17 + 4 }); l1 += r2.winner === 'B' ? 1 : r2.winner === 'draw' ? 0.5 : 0; }
    rows.push(`s${st} ${P(b5 / N)}/${P(l1 / N)}`); t5 += b5; t1 += l1; n += N; }
  console.log(`normalizado σ${sg} hp${hp}: média ${P(t5 / n)}/${P(t1 / n)} · ${rows.join(' · ')}`); }
// e) DEF P95 e TTK PvP
for (const hp of [1, 1.55]) { const t: number[] = []; let dmax = 0; for (const L of RULER_LEVELS) { const td: number[] = []; for (let s = 0; s < 200; s++) { const c = combatantAt(L, B.def); const r = fightX({ combatant: c, special: specialOf('direct') }, { combatant: c, special: specialOf('direct') }, { seed: s + 1, unitH0: U, hpScale: hp, variance: { rho: 0.9, sigma: 0.1, floor: 0.05 } }); td.push(Math.min(r.timeA, r.timeB)); const cb = combatantAt(L, B.balanced); const r2 = fightX({ combatant: cb, special: specialOf(SPECIAL_FAMILIES[s % 7]) }, { combatant: cb, special: specialOf(SPECIAL_FAMILIES[(s + 3) % 7]) }, { seed: s + 1, unitH0: U, hpScale: hp, variance: { rho: 0.9, sigma: 0.1, floor: 0.05 } }); t.push(Math.min(r2.timeA, r2.timeB)); } dmax = Math.max(dmax, q(td, 0.95)); }
  console.log(`normalizado σ0.10 hp${hp}: DEF×DEF P95 máx ${dmax.toFixed(1)} s · espelho balanced mediana ${q(t, 0.5).toFixed(1)} P95 ${q(t, 0.95).toFixed(1)}`); }
