import { fight } from '../src/utils/combate/fight';
import { combatantAt, REFERENCE_BUILDS as B, REFERENCE_BUILD_NAMES as BN, STAGE_LEVEL_CAPS, firstLevelOfStage, stageOfLevel } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES, specialOf } from '../src/utils/combate/specials';
const N = 1200; const HP = 1.7;
const fam = (i: number) => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const P = (x: number) => (100 * x).toFixed(1);
for (const mode of ['cruza', 'piso-estagio'] as const) for (const GAP of [1, 2, 3]) {
  const row: string[] = [];
  for (let st = 0; st < 5; st++) {
    const lo = firstLevelOfStage(st), hi = STAGE_LEVEL_CAPS[st]; let w = 0;
    for (let s = 0; s < N; s++) {
      const L = lo + (s % (hi - lo + 1));
      const nl = mode === 'cruza' ? Math.max(1, L - GAP) : Math.max(lo, L - GAP);
      const r = fight({ combatant: combatantAt(L, B[BN[s % 4]]), special: specialOf(fam(s >> 2)) }, { combatant: combatantAt(nl, B.balanced), special: specialOf('direct') }, { seed: s * 17 + 3, hpScale: HP });
      w += r.winner === 'A' ? 1 : r.winner === 'draw' ? 0.5 : 0;
    }
    row.push(P(w / N));
  }
  console.log(`${mode} gap ${GAP}: ${row.join(' · ')}`);
}
