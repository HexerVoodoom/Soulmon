// Medição do balanço dos motores com o núcleo REAL (src/utils/combate). Rodar: esbuild → node.
import { writeFileSync } from 'node:fs';
import { fight } from '../src/utils/combate/fight';
import { combatantAt, REFERENCE_BUILDS, REFERENCE_BUILD_NAMES, RULER_LEVELS, STAGE_LEVEL_CAPS, firstLevelOfStage, stageOfLevel } from '../src/utils/combate/level';
import { SPECIAL_FAMILIES, specialOf } from '../src/utils/combate/specials';
import { pairedDelta, rulerBaseline, rulerBounds } from '../src/utils/combate/ruler';
import { hitsToKnockOut, type Combatant } from '../src/utils/combate/curve';
import { mulberry32 } from '../src/utils/combate/rng';
import { fightX, type Side, type Opts } from './fightx';

const P = (x: number) => (100 * x).toFixed(1) + '%';
const q = (a: number[], p: number) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const med = (a: number[]) => q(a, 0.5);
const mean = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
const N = +(process.env.N ?? 300);
const ONLY = process.env.ONLY ?? 'core,weak,pvp,arena,dungeon,night';
const on = (k: string) => ONLY.split(',').includes(k);
const fam = (i: number) => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const out: string[] = [];
const say = (s: string) => { out.push(s); console.log(s); };
const B = REFERENCE_BUILDS, BN = REFERENCE_BUILD_NAMES;

// ───────────────────────── 0. paridade da proposta
{
  let bad = 0;
  for (let s = 0; s < 300; s++) {
    const L = RULER_LEVELS[s % 15];
    const A = { combatant: combatantAt(L, B[BN[s % 4]]), special: specialOf(fam(s)) };
    const C = { combatant: combatantAt(L, B[BN[(s + 1) % 4]]), special: specialOf(fam(s + 3)) };
    const r1 = fight(A, C, { seed: s * 77 }), r2 = fightX(A, C, { seed: s * 77 });
    if (r1.timeA !== r2.timeA || r1.timeB !== r2.timeB || r1.winner !== r2.winner) bad++;
  }
  say(`## 0 fightX (ganchos desligados) reproduz fight(): divergências ${bad}/300`);
}

// ───────────────────────── 1. gates do núcleo
const noVar = (A: Combatant, C: Combatant) => fight({ combatant: A, special: null }, { combatant: C, special: null }, { seed: 1, variance: null, phases: [0, 0] });
if (on('core')) {
  const defP95: number[] = [];
  for (const L of RULER_LEVELS) {
    const t: number[] = [];
    for (let s = 0; s < N; s++) { const c = combatantAt(L, B.def); const r = fight({ combatant: c, special: specialOf('direct') }, { combatant: c, special: specialOf('direct') }, { seed: s + 1 }); t.push(Math.min(r.timeA, r.timeB)); }
    defP95.push(q(t, 0.95));
  }
  say(`## 1a DEF×DEF (com especial direto) P95 máx nos 15 levels: ${Math.max(...defP95).toFixed(1)} s (meta ≤40)`);
  let minG = 9, minL = 0, minB = '';
  for (let L = 2; L <= 40; L++) {
    if (stageOfLevel(L) !== stageOfLevel(L - 1)) continue;
    for (const b of BN) { const r = noVar(combatantAt(L, B[b]), combatantAt(L - 1, B[b])); const g = r.timeA / r.timeB - 1; if (g < minG) { minG = g; minL = L; minB = b; } }
  }
  say(`## 1b +1 Lv (mesmo estágio, sem variância): menor vantagem ${P(minG)} em L${minL} ${minB} (meta ≥2%)`);
  let gap = 0, at = '';
  for (const L of RULER_LEVELS) for (const x of BN) for (const y of BN) {
    if (x >= y) continue; const r = noVar(combatantAt(L, B[x]), combatantAt(L, B[y])); const g = Math.abs(r.timeA / r.timeB - 1);
    if (g > gap) { gap = g; at = `${x}×${y} L${L}`; }
  }
  say(`## 1c gap entre builds (máx |tA/tB−1|, 15 levels × 6 pares): ${P(gap)} em ${at} (meta ≤10%)`);
  let fail = 0; const rows: string[] = [];
  for (const L of [1, 6, 13, 21, 30, 40]) {
    const c = combatantAt(L, B.balanced); const base = rulerBaseline(c, 200, L);
    rows.push(`L${L}: ` + SPECIAL_FAMILIES.map((f) => { const d = pairedDelta(c, specialOf(f), 200, L, base); const [lo, hi] = rulerBounds(f, L); if (d < lo - 1e-12 || d > hi + 1e-12) fail++; return `${f} ${P(d)}`; }).join(' · '));
  }
  say(`## 1d régua pareada (200 seeds, HP×3) — células fora da faixa: ${fail}/42`); rows.forEach((r) => say('    ' + r));
  const w: number[] = [];
  for (const L of RULER_LEVELS) { let win = 0; for (let s = 0; s < N; s++) { const r = fight({ combatant: combatantAt(L, B.balanced, 0.05), special: specialOf('direct') }, { combatant: combatantAt(L, B.balanced), special: specialOf('direct') }, { seed: s + 9 }); win += r.winner === 'A' ? 1 : r.winner === 'draw' ? 0.5 : 0; } w.push(win / N); }
  say(`## 1e teto de bônus 5% (combinedBonus): mais forte vence ${P(mean(w))} (faixa ${P(Math.min(...w))}–${P(Math.max(...w))})`);
}

// ───────────────────────── 2. mais fraco × hpScale
const weaker = (hp: number) => {
  let b5 = 0, l1 = 0, nl = 0; const n = N * 4;
  for (let s = 0; s < n; s++) {
    const L = RULER_LEVELS[s % 15]; const bn = BN[(s >> 4) % 4]; const f = specialOf(fam(s >> 2));
    const r = fight({ combatant: combatantAt(L, B[bn], 0.05), special: f }, { combatant: combatantAt(L, B[bn]), special: f }, { seed: s * 13 + 1, hpScale: hp });
    b5 += r.winner === 'B' ? 1 : r.winner === 'draw' ? 0.5 : 0;
    if (L > 1 && stageOfLevel(L) === stageOfLevel(L - 1)) {
      const r2 = fight({ combatant: combatantAt(L, B[bn]), special: f }, { combatant: combatantAt(L - 1, B[bn]), special: f }, { seed: s * 13 + 5, hpScale: hp });
      l1 += r2.winner === 'B' ? 1 : r2.winner === 'draw' ? 0.5 : 0; nl++;
    }
  }
  return { b5: b5 / n, l1: l1 / nl, n, nl };
};
if (on('weak')) for (const hp of [1, 1.5, 1.6]) {
  const w = weaker(hp);
  say(`## 2 hpScale ${hp}: mais fraco por 5% vence ${P(w.b5)} (n=${w.n}) · 1 Lv abaixo vence ${P(w.l1)} (n=${w.nl}) (metas ~31% / ~19%)`);
}

// ───────────────────────── 3. PvP
const PVP_HP = +(process.env.PVP_HP ?? 1.55);
const VX: any = { unitH0: process.env.UNIT ? +process.env.UNIT : undefined, rhoMode: (process.env.RHO as any) ?? 'hit', variance: { rho: 0.9, sigma: +(process.env.SIG ?? 0.15), floor: 0.05 } };
if (on('pvp')) {
  say(`## 3 PvP (hpScale ${PVP_HP}) — 1º KO, builds e famílias variando`);
  for (let st = 0; st < 4; st++) {
    const lo = firstLevelOfStage(st), hi = STAGE_LEVEL_CAPS[st]; const Ls = [lo, Math.round((lo + hi) / 2), hi];
    const t: number[] = []; let zero = 0, draws = 0, casts = 0; const n = N * 2;
    for (let s = 0; s < n; s++) {
      const L = Ls[s % 3];
      const r = fightX({ combatant: combatantAt(L, B[BN[s % 4]]), special: specialOf(fam(s >> 2)) }, { combatant: combatantAt(L, B[BN[(s >> 4) % 4]]), special: specialOf(fam(s >> 5)) }, { ...VX, seed: s * 31 + 7, hpScale: PVP_HP });
      const tEnd = Math.min(r.timeA, r.timeB); t.push(tEnd); if (r.castsA === 0) zero++; if (r.winner === 'draw') draws++; casts += r.castsA;
    }
    say(`    ${['rookie', 'champion', 'ultimate', 'mega'][st]} L${Ls.join('/')}: mediana ${med(t).toFixed(1)} s · P95 ${q(t, 0.95).toFixed(1)} · especiais/lado (até o 2º KO) ${(casts / n).toFixed(2)} · lutas sem especial ${P(zero / n)} · empates ${draws}/${n}`);
  }
  const w = weaker(PVP_HP);
  say(`    mais fraco no PvP: −5% vence ${P(w.b5)} · −1 Lv vence ${P(w.l1)}`);
  for (const ch of [0, 0.5, 1, 1.5, 2]) {
    const ratio: number[] = []; let win = 0;
    for (let s = 0; s < N; s++) {
      const L = RULER_LEVELS[s % 15]; const c = combatantAt(L, B.balanced); const f = specialOf(fam(s));
      const A = { combatant: c, special: f };
      const r = fightX(A, A, { ...VX, seed: s * 3 + 2, hpScale: PVP_HP, cheerPerSecond: [ch, 0] });
      const r0 = fightX(A, A, { ...VX, seed: s * 3 + 2, hpScale: PVP_HP });
      ratio.push(r.timeB / r0.timeB); win += r.winner === 'A' ? 1 : r.winner === 'draw' ? 0.5 : 0;
    }
    say(`    torcida +${ch} energia/s: TTK de quem torce ×${mean(ratio).toFixed(3)} · vence o espelho ${P(win / N)}`);
  }
}

// ───────────────────────── PvE: inimigos
interface FoeShape { hp: number; power: number; special: boolean }
const foeOf = (L: number, sh: FoeShape, hpGrow: number, powGrow: number): Side => {
  const b = combatantAt(L, B.balanced);
  return { combatant: { ...b, hp: b.hp * sh.hp * hpGrow, bonus: sh.power * powGrow - 1 }, special: sh.special ? specialOf('direct') : null };
};
interface Skill { ring: number[]; dodge: number[]; acc: [number, number] }
const SKILL: Record<string, Skill> = {
  nenhuma: { ring: [1, 0, 0], dodge: [1, 0, 0], acc: [0.7, 0.25] },
  media: { ring: [0.25, 0.5, 0.25], dodge: [0.3, 0.4, 0.3], acc: [0.7, 0.25] },
  boa: { ring: [0.1, 0.3, 0.6], dodge: [0.1, 0.3, 0.6], acc: [0.7, 0.25] },
};
const RING: number[] = process.env.RING ? JSON.parse(process.env.RING) : [0.75, 1, 1.35], DODGE: number[] = process.env.DODGE ? JSON.parse(process.env.DODGE) : [0, 0.5, 0.85];
const pick = (r: () => number, p: number[]) => { const x = r(); return x < p[0] ? 0 : x < p[0] + p[1] ? 1 : 2; };
const FAMPOW: Record<string, number> = process.env.FAMPOW ? JSON.parse(process.env.FAMPOW) : {};
interface Mods { hpMul?: number; dmg?: number; defBonus?: number; perfect?: number; counter?: number; incoming?: number; heal?: number }
const OFICIOS: Record<string, Mods> = {
  padrao: {}, ferreiro: { hpMul: 1.15 }, tecelao: { defBonus: 0.05 }, artesao: { dmg: 1.1 }, joalheiro: { perfect: 0.89 },
  alquimista: { counter: 2 }, curtidor: { incoming: 0.9 }, encantador: { dmg: 1.05 }, escriba: { dmg: 1.11 },
  cozinheiro: { heal: 0.35 }, luthier: { defBonus: 0.05 }, cartografo: { defBonus: 0.025 },
};
/** Uma luta PvE com HP carregado. Devolve o tempo até o 1º KO, quem venceu e o HP que sobra. */
function pveFight(pl: Side, foe: Side, hp0: number, seed: number, skill: Skill, m: Mods, counterRaw = false) {
  const r = mulberry32(seed ^ 0x2545);
  let pendingCounter = 0;
  const perfect = m.perfect ?? 0.92;
  const opts: Opts = {
    seed, startHp: [hp0, 1], rhoMode: (process.env.RHO as any) ?? 'hit', variance: { rho: 0.9, sigma: +(process.env.SIG ?? 0.15), floor: 0.05 }, unitH0: process.env.UNIT ? +process.env.UNIT : undefined,
    castScale: (side) => (side === 0 ? RING[pick(r, skill.ring)] * (m.dmg ?? 1) * (FAMPOW[pl.special?.family ?? 'direct'] ?? 1) : 1 - DODGE[pick(r, skill.dodge)] * (m.incoming ? 1 : 1)),
    hitScale: (side) => {
      if (side === 0) { const c = pendingCounter; pendingCounter = 0; return (m.dmg ?? 1) * (1 + c); }
      const acc = Math.min(1, Math.max(0, skill.acc[0] + (m.defBonus ?? 0) + (r() * 2 - 1) * skill.acc[1]));
      if (acc >= perfect) { pendingCounter += counterRaw ? 0.5 * (m.counter ?? 1) : Math.min(0.5 * (m.counter ?? 1), 0.6); return 0; }
      return ((1 - acc) / 0.3) * (m.incoming ?? 1);
    },
    log: [],
  };
  const res = fightX(pl, foe, opts);
  const tEnd = Math.min(res.timeA, res.timeB);
  let hp = hp0; for (const e of opts.log as any[]) if (e.k === 'hit' && e.t <= tEnd + 1e-9) hp = e.hpA;
  return { won: res.winner === 'A', t: tEnd, hp: res.winner === 'A' ? Math.max(0, hp) : 0 };
}
const player = (L: number, bn: string, f: number, m: Mods): Side => {
  const c = combatantAt(L, (B as any)[bn]); return { combatant: { ...c, hp: c.hp * (m.hpMul ?? 1) }, special: specialOf(fam(f)) };
};

// Tabela proposta (PR3/PR4) — env sobrescreve para calibrar.
const J = (k: string, d: any) => (process.env[k] ? JSON.parse(process.env[k] as string) : d);
const ARENA_CLASS: Record<string, FoeShape> = J('ARENA_CLASS', {
  weak: { hp: 0.7, power: 0.14, special: false }, medium: { hp: 0.9, power: 0.24, special: false }, boss: { hp: 1.15, power: 0.5, special: true },
});
const ARENA_COMP = [['medium'], ['weak', 'weak'], ['medium'], ['weak', 'weak', 'weak'], ['boss']];
const ARENA_ROUND_POWER = +(process.env.ARENA_ROUND_POWER ?? 0.13), ARENA_ROUND_HP = +(process.env.ARENA_ROUND_HP ?? 0.04), ARENA_HEAL = 0.3;
function arenaRun(L: number, bn: string, f: number, seed: number, skill: Skill, m: Mods) {
  const pl = player(L, bn, f, m); let hp = 1; const ts: number[] = [];
  for (let r = 0; r < 5; r++) {
    for (let k = 0; k < ARENA_COMP[r].length; k++) {
      const foe = foeOf(L, ARENA_CLASS[ARENA_COMP[r][k]], 1 + ARENA_ROUND_HP * r, 1 + ARENA_ROUND_POWER * r);
      const x = pveFight(pl, foe, hp, seed * 101 + r * 11 + k, skill, m); ts.push(x.t);
      if (!x.won) return { won: false, rounds: r, ts }; hp = x.hp;
    }
    hp = Math.min(1, hp + ARENA_HEAL);
  }
  return { won: true, rounds: 5, ts };
}
if (on('arena')) {
  say(`## 4 Arena (1v1 em sequência, 5 rodadas = 8 inimigos, cura ${ARENA_HEAL} entre rodadas) — tabela ${JSON.stringify(ARENA_CLASS)} rodada +${ARENA_ROUND_POWER} poder/+${ARENA_ROUND_HP} vida`);
  const all: number[] = []; const byB: Record<string, number[]> = {}; const byF: Record<string, number[]> = {}; const bySt: number[][] = [[], [], [], [], []];
  for (let s = 0; s < N * 4; s++) {
    const L = RULER_LEVELS[s % 15], bn = BN[(s >> 2) % 4], f = s >> 4;
    const x = arenaRun(L, bn, f, s, SKILL.media, {}); all.push(...x.ts);
    (byB[bn] ??= []).push(+x.won); (byF[fam(f)] ??= []).push(+x.won); bySt[stageOfLevel(L)].push(+x.won);
  }
  const wb = Object.entries(byB).map(([k, v]) => [k, mean(v)] as const), wf = Object.entries(byF).map(([k, v]) => [k, mean(v)] as const);
  say(`    TTK por inimigo: mediana ${med(all).toFixed(1)} s · P95 ${q(all, 0.95).toFixed(1)} (meta 20–29)`);
  say(`    vitória da run por build: ${wb.map(([k, v]) => `${k} ${P(v)}`).join(' · ')} → spread ${P(Math.max(...wb.map((x) => x[1])) - Math.min(...wb.map((x) => x[1])))}`);
  say(`    por família: ${wf.map(([k, v]) => `${k} ${P(v)}`).join(' · ')} → spread ${P(Math.max(...wf.map((x) => x[1])) - Math.min(...wf.map((x) => x[1])))}`);
  say(`    por estágio: ${bySt.map((v, i) => `s${i} ${P(mean(v))}`).join(' · ')}`);
  for (const sk of ['nenhuma', 'boa']) { let w = 0; for (let s = 0; s < N * 2; s++) w += +arenaRun(RULER_LEVELS[s % 15], BN[(s >> 2) % 4], s >> 4, s, SKILL[sk], {}).won; say(`    habilidade ${sk} (anel/esquiva): vitória ${P(w / (N * 2))}`); }
}

// Masmorra: andar f, 6 slots (baby-i..mega)
const DUN_HP: number[] = J('DUN_HP', [0.8, 0.84, 0.88, 0.92, 0.96, 1.0]);
const DUN_POW: number[] = J('DUN_POW', [0.06, 0.08, 0.1, 0.12, 0.14, 0.18]);
const DUN_FLOOR_HP = +(process.env.DUN_FLOOR_HP ?? 0.11), DUN_FLOOR_POW = +(process.env.DUN_FLOOR_POW ?? 0.25);
const dunFoe = (L: number, slot: number, floor: number) => foeOf(L, { hp: DUN_HP[slot], power: DUN_POW[slot], special: slot === 5 }, 1 + DUN_FLOOR_HP * (floor - 1), 1 + DUN_FLOOR_POW * (floor - 1));
function dungeonRun(L: number, bn: string, f: number, seed: number, skill: Skill, m: Mods, floors = 8, startFloor = 1) {
  const pl = player(L, bn, f, m); let hp = 1; const ts: number[][] = []; const tsFloor: number[] = [];
  for (let fl = startFloor; fl < startFloor + floors; fl++) {
    const t: number[] = []; ts.push(t);
    for (let k = 0; k < 6; k++) {
      const x = pveFight(pl, dunFoe(L, k, fl), hp, seed * 977 + fl * 13 + k, skill, m, true); t.push(x.t);
      if (!x.won) return { reached: fl - startFloor, ts };
      hp = x.hp;
    }
    hp = Math.min(1, hp + (m.heal ?? 0.25));
  }
  return { reached: floors, ts };
}
if (on('dungeon')) {
  say(`## 5 Masmorra — slots hp ${JSON.stringify(DUN_HP)} poder ${JSON.stringify(DUN_POW)}, por andar +${DUN_FLOOR_HP} vida/+${DUN_FLOOR_POW} poder, cura 0,25 entre andares`);
  const hitsF: string[] = [];
  for (const L of [1, 21, 40]) { const pl = combatantAt(L, B.balanced); hitsF.push(`L${L}: ` + [1, 2, 3, 4, 5, 6].map((fl) => hitsToKnockOut(pl, dunFoe(L, 5, fl).combatant).toFixed(1)).join('/')); }
  say(`    golpes p/ derrubar o slot mega por andar 1..6 (balanced): ${hitsF.join(' · ')}`);
  const reach: number[] = [], tByFloor: number[][] = Array.from({ length: 8 }, () => []);
  for (let s = 0; s < N * 2; s++) { const x = dungeonRun(RULER_LEVELS[s % 15], BN[(s >> 2) % 4], s >> 4, s, SKILL.media, {}); reach.push(x.reached); x.ts.forEach((t, i) => tByFloor[i].push(...t)); }
  say(`    TTK por inimigo por andar (mediana/P95): ${tByFloor.map((t, i) => t.length ? `A${i + 1} ${med(t).toFixed(1)}/${q(t, 0.95).toFixed(1)}` : '').filter(Boolean).join(' · ')}`);
  say(`    chega a terminar o andar n (de 8): ${[1, 2, 3, 4, 5, 6, 7, 8].map((n) => `${n}:${P(reach.filter((r) => r >= n).length / reach.length)}`).join(' ')}`);
  const base = (m: Mods, sk = SKILL.media) => { const r: number[] = []; const tt: number[] = []; for (let s = 0; s < N; s++) { const x = dungeonRun(RULER_LEVELS[s % 15], BN[(s >> 2) % 4], s >> 4, s, sk, m, 3); r.push(x.reached); tt.push(...x.ts.flat()); } return { reach: mean(r), t: mean(tt) }; };
  const b0 = base({});
  say(`    ofícios (3 andares, média de andares limpos; padrão ${b0.reach.toFixed(2)}, TTK médio ${b0.t.toFixed(1)} s):`);
  const ofRows: string[] = [];
  for (const [k, m] of Object.entries(OFICIOS)) { if (k === 'padrao') continue; const b = base(m); ofRows.push(`${k} ${(b.reach / b0.reach - 1 >= 0 ? '+' : '')}${P(b.reach / b0.reach - 1)} (TTK ×${(b.t / b0.t).toFixed(3)})`); }
  say('      ' + ofRows.join(' · '));
  // alquimista sem clamp do contra-ataque (prova de vermelho)
  { const r: number[] = []; for (let s = 0; s < N; s++) { const pl = player(RULER_LEVELS[s % 15], BN[(s >> 2) % 4], s >> 4, { counter: 2 }); let ok = 0; let hp = 1; for (let k = 0; k < 6; k++) { const x = pveFight(pl, dunFoe(pl.combatant.level, k, 3), hp, s * 7 + k, SKILL.media, { counter: 2 }, true); if (!x.won) break; hp = x.hp; ok++; } r.push(ok); } say(`    alquimista contra-ataque cru (sem clamp) no andar 3: slots limpos ${mean(r).toFixed(2)}`); }
}
if (on('night')) {
  // Pesadelo: tier top (0..5 = baby-i..mega), onda = slots top-1..top do andar max(1, top-1)
  const rows: string[] = [];
  for (let top = 1; top <= 5; top++) {
    let win = 0; const ts: number[] = []; const floor = 1;
    for (let s = 0; s < N; s++) {
      const pl = player(RULER_LEVELS[s % 15], BN[(s >> 2) % 4], s >> 4, {}); let hp = 1, ok = true;
      for (const slot of [top - 1, top]) { const x = pveFight(pl, dunFoe(pl.combatant.level, slot, floor), hp, s * 31 + slot, SKILL.media, {}, true); ts.push(x.t); if (!x.won) { ok = false; break; } hp = x.hp; }
      win += +ok;
    }
    rows.push(`top ${top}: vence ${P(win / N)} · TTK med ${med(ts).toFixed(1)}/P95 ${q(ts, 0.95).toFixed(1)}`);
  }
  say(`## 6 Pesadelo (2 inimigos = slots top−1..top, andar 1): ${rows.join(' · ')}`);
}
writeFileSync(process.env.OUT ?? 'medir-out.txt', out.join('\n') + '\n');
