import { fight } from '../src/utils/combate/fight';
import { combatantAt, REFERENCE_BUILDS as B, REFERENCE_BUILD_NAMES as BN, RULER_LEVELS, STAGE_LEVEL_CAPS, firstLevelOfStage, stageOfLevel } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES, specialOf, cheerEvents, CHEER } from '../src/utils/combate/specials';
import { combinedBonus } from '../src/utils/combate/bonus';
const N = +(process.env.N ?? 600);
const HP = +(process.env.HP ?? 1.7);
const GAP = +(process.env.GAP ?? 2);
const P = (x: number) => (100 * x).toFixed(1) + '%';
const med = (a: number[]) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const q = (a: number[], p: number) => [...a].sort((x, y) => x - y)[Math.floor(a.length * p)];
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / a.length;
const fam = (i: number) => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const bonus5 = combinedBonus({ talent: 0.05 });
// taps por balde -> eventos (balde fechado: a descarga cai no FIM do balde), igual ao servidor
const bucketEvents = (counts: number[]) => { const taps: number[] = []; counts.forEach((n, b) => { for (let k = 0; k < n; k++) taps.push((b + 1) * CHEER.bucketSeconds); }); return cheerEvents(taps, 0); };
const TETO = bucketEvents(Array.from({ length: 20 }, () => CHEER.tapsCapPerBucket));
const sideOf = (c: ReturnType<typeof combatantAt>, f: ReturnType<typeof fam>) => ({ combatant: c, special: specialOf(f) });
// 1. duração
for (let st = 0; st < 4; st++) {
  const lo = firstLevelOfStage(st), hi = STAGE_LEVEL_CAPS[st]; const Ls = [lo, Math.round((lo + hi) / 2), hi];
  const t: number[] = []; let draws = 0;
  for (let s = 0; s < N; s++) {
    const L = Ls[s % 3];
    const r = fight(sideOf(combatantAt(L, B[BN[s % 4]]), fam(s >> 2)), sideOf(combatantAt(L, B[BN[(s >> 4) % 4]]), fam(s >> 5)), { seed: s * 31 + 7, hpScale: HP });
    t.push(Math.min(r.timeA, r.timeB)); if (r.winner === 'draw') draws++;
  }
  console.log(`duracao ${['rookie', 'champion', 'ultimate', 'mega'][st]} L${Ls.join('/')}: mediana ${med(t).toFixed(1)} s · P95 ${q(t, 0.95).toFixed(1)} · empates ${draws}/${N}`);
}
// 2. mais fraco
{ let b5 = 0, l1 = 0, nl = 0; const n = N * 4;
  for (let s = 0; s < n; s++) {
    const L = RULER_LEVELS[s % 15]; const bn = BN[(s >> 4) % 4]; const f = fam(s >> 2);
    const r = fight(sideOf(combatantAt(L, B[bn], bonus5), f), sideOf(combatantAt(L, B[bn]), f), { seed: s * 13 + 1, hpScale: HP });
    b5 += r.winner === 'B' ? 1 : r.winner === 'draw' ? 0.5 : 0;
    if (L > 1 && stageOfLevel(L) === stageOfLevel(L - 1)) { const r2 = fight(sideOf(combatantAt(L, B[bn]), f), sideOf(combatantAt(L - 1, B[bn]), f), { seed: s * 13 + 5, hpScale: HP }); l1 += r2.winner === 'B' ? 1 : r2.winner === 'draw' ? 0.5 : 0; nl++; }
  }
  console.log(`mais fraco: -5% vence ${P(b5 / n)} (25-40) · -1 Lv vence ${P(l1 / nl)} (10-30)`);
}
// 3. torcida
for (const E of [3]) {
  (CHEER as any).pvpEnergyPerDischarge = E; let win = 0; const ratio: number[] = []; const n = N * 4;
  for (let s = 0; s < n; s++) {
    const L = RULER_LEVELS[s % 15]; const c = combatantAt(L, B[BN[(s >> 4) % 4]]); const A = sideOf(c, fam(s));
    const r = fight(A, A, { seed: s * 3 + 2, hpScale: HP, cheer: TETO }); const r0 = fight(A, A, { seed: s * 3 + 2, hpScale: HP });
    ratio.push(r.timeB / r0.timeB); win += r.winner === 'A' ? 1 : r.winner === 'draw' ? 0.5 : 0;
  }
  console.log(`torcida teto (E=${E}, baldes de 3 s, descarga no fim do balde): vence o espelho ${P(win / n)} (55-70) · TTK de quem torce x${mean(ratio).toFixed(3)} (|d|<25%)`);
}
// 4. NPC
for (let st = 0; st < 5; st++) {
  const lo = firstLevelOfStage(st), hi = STAGE_LEVEL_CAPS[st]; let w = 0; const n = N * 2;
  for (let s = 0; s < n; s++) {
    const L = lo + (s % (hi - lo + 1)); const me = sideOf(combatantAt(L, B[BN[s % 4]]), fam(s >> 2)); const npc = sideOf(combatantAt(Math.max(1, L - GAP), B.balanced), 'direct');
    const r = fight(me, npc, { seed: s * 17 + 3, hpScale: HP }); w += r.winner === 'A' ? 1 : r.winner === 'draw' ? 0.5 : 0;
  }
  console.log(`NPC gap ${GAP} estagio ${st}: jogador vence ${P(w / n)} (75-92)`);
}
