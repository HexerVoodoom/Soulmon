import { combatantAt, REFERENCE_BUILDS as B, STAGE_LEVEL_CAPS, firstLevelOfStage } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES, specialOf } from '../src/utils/combate/specials';
import { fightX } from './fightx';
const P = (x: number) => (100 * x).toFixed(1) + '%'; const N = 300;
for (const ch of [0, 0.5, 1, 1.5, 2, 3]) { const rows: string[] = []; let tot = 0, rr = 0;
  for (let st = 0; st < 5; st++) { let w = 0; const ratio: number[] = []; for (let s = 0; s < N; s++) { const L = firstLevelOfStage(st) + (s % (STAGE_LEVEL_CAPS[st] - firstLevelOfStage(st) + 1)); const c = combatantAt(L, B.balanced); const A = { combatant: c, special: specialOf(SPECIAL_FAMILIES[s % 7]) };
    const o = { seed: s * 3 + 2, hpScale: 1.55, rhoMode: 'fraction', variance: { rho: 0.9, sigma: 0.08, floor: 0.05 } } as any;
    const r = fightX(A, A, { ...o, cheerPerSecond: [ch, 0] }); const r0 = fightX(A, A, o); ratio.push(r.timeB / r0.timeB); w += r.winner === 'A' ? 1 : r.winner === 'draw' ? 0.5 : 0; }
    rows.push(`s${st} ${P(w / N)}`); tot += w; rr += ratio.reduce((a, b) => a + b, 0) / N; }
  console.log(`torcida +${ch} energia/s (PvP hp1.55, sorte por fração σ0.08): vence ${P(tot / (5 * N))} · TTK ×${(rr / 5).toFixed(3)} · ${rows.join(' · ')}`); }
