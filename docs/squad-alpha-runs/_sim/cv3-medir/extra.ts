import { writeFileSync } from 'node:fs';
import { fight, windowSeconds } from '../src/utils/combate/fight';
import { combatantAt, REFERENCE_BUILDS as B, REFERENCE_BUILD_NAMES as BN, STAGE_LEVEL_CAPS, firstLevelOfStage, stageOfLevel } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES, specialOf } from '../src/utils/combate/specials';
import { attacksPerWindow, hitsToKnockOut } from '../src/utils/combate/curve';
import { fightX } from './fightx';
const P = (x: number) => (100 * x).toFixed(1) + '%';
const N = +(process.env.N ?? 300); const out: string[] = []; const say = (s: string) => { out.push(s); console.log(s); };
const fam = (i: number) => SPECIAL_FAMILIES[i % 7];
// golpes e intervalo por estágio
for (const L of [1, 6, 7, 13, 14, 21, 22, 30, 31, 40]) {
  const d = combatantAt(L, B.balanced); const h = hitsToKnockOut(d, d); const iv = windowSeconds(L) / attacksPerWindow(d.spd);
  const s = combatantAt(L, B.spd); const ivs = windowSeconds(L) / attacksPerWindow(s.spd);
  say(`L${L}: golpes no espelho ${h.toFixed(1)} · intervalo balanced ${iv.toFixed(2)} s · SPD puro ${ivs.toFixed(2)} s · ataques/s (2 lados) ${(2 / iv).toFixed(1)}`);
}
// mais fraco por estágio (1v1), hp 1 e 1.55
for (const hp of [1, 1.55]) {
  const rows: string[] = [];
  for (let st = 0; st < 5; st++) {
    const lo = firstLevelOfStage(st), hi = STAGE_LEVEL_CAPS[st]; let b5 = 0, l1 = 0, nl = 0;
    for (let s = 0; s < N * 2; s++) {
      const L = lo + 1 + (s % (hi - lo)); const bn = BN[(s >> 3) % 4]; const f = specialOf(fam(s >> 1));
      const r = fight({ combatant: combatantAt(L, B[bn], 0.05), special: f }, { combatant: combatantAt(L, B[bn]), special: f }, { seed: s * 17 + 3, hpScale: hp });
      b5 += r.winner === 'B' ? 1 : r.winner === 'draw' ? 0.5 : 0;
      const r2 = fight({ combatant: combatantAt(L, B[bn]), special: f }, { combatant: combatantAt(L - 1, B[bn]), special: f }, { seed: s * 17 + 4, hpScale: hp });
      l1 += r2.winner === 'B' ? 1 : r2.winner === 'draw' ? 0.5 : 0; nl++;
    }
    rows.push(`s${st} −5% ${P(b5 / (N * 2))} / −1Lv ${P(l1 / nl)}`);
  }
  say(`mais fraco por estágio, hpScale ${hp}: ${rows.join(' · ')}`);
}
// torcida fina
for (const ch of [0.5, 1, 1.5]) {
  let win = 0; for (let s = 0; s < N; s++) { const L = [1, 6, 13, 21, 30][s % 5]; const c = combatantAt(L, B.balanced); const A = { combatant: c, special: specialOf(fam(s)) }; const r = fightX(A, A, { seed: s * 3 + 2, hpScale: 1.55, cheerPerAttack: [ch, 0] }); win += r.winner === 'A' ? 1 : r.winner === 'draw' ? 0.5 : 0; }
  say(`torcida +${ch}/golpe no PvP: vence o espelho ${P(win / N)}`);
}
writeFileSync('extra-out.txt', out.join('\n') + '\n');
