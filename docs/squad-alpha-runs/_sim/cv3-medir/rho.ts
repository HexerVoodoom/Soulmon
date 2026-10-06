import { combatantAt, REFERENCE_BUILDS as B, REFERENCE_BUILD_NAMES as BN, STAGE_LEVEL_CAPS, firstLevelOfStage } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES, specialOf } from '../src/utils/combate/specials';
import { fightX } from './fightx';
const P = (x: number) => (100 * x).toFixed(1) + '%'; const N = 400;
for (const [mode, h0, sg] of [['fraction', 10, 0.08], ['fraction', 10, 0.10], ['fraction', 6, 0.10]] as const) for (const hp of [1, 1.55]) {
  const rows: string[] = []; let a5 = 0, a1 = 0, tot = 0;
  for (let st = 0; st < 5; st++) { const lo = firstLevelOfStage(st), hi = STAGE_LEVEL_CAPS[st]; let b5 = 0, l1 = 0;
    for (let s = 0; s < N; s++) { const L = lo + 1 + (s % (hi - lo)); const bn = BN[(s >> 3) % 4]; const f = specialOf(SPECIAL_FAMILIES[(s >> 1) % 7]);
      const o = { seed: s * 17 + 3, hpScale: hp, rhoMode: mode, rhoH0: h0, variance: { rho: 0.9, sigma: sg, floor: 0.05 } } as any;
      const r = fightX({ combatant: combatantAt(L, B[bn], 0.05), special: f }, { combatant: combatantAt(L, B[bn]), special: f }, o); b5 += r.winner === 'B' ? 1 : r.winner === 'draw' ? 0.5 : 0;
      const r2 = fightX({ combatant: combatantAt(L, B[bn]), special: f }, { combatant: combatantAt(L - 1, B[bn]), special: f }, { ...o, seed: s * 17 + 4 }); l1 += r2.winner === 'B' ? 1 : r2.winner === 'draw' ? 0.5 : 0; }
    rows.push(`s${st} ${P(b5 / N)}/${P(l1 / N)}`); a5 += b5; a1 += l1; tot += N; }
  console.log(`${mode} H0=${h0} σ${sg} hp${hp}: média ${P(a5 / tot)}/${P(a1 / tot)} · ${rows.join(' · ')}`);
}
