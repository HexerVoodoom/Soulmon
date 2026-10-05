// cv3-sim6.mjs — Fase 1: spike de VARIÂNCIA (contexto §2.8/§2.9). Base cv3-sim5 (piso 15%). Determinístico (mulberry32). node cv3-sim6.mjs [--n=6000]
import { readFileSync } from 'node:fs';
const N = +(process.argv.find((a) => a.startsWith('--n='))?.slice(4) ?? 6000);
const pc = (x) => (x >= 0 ? '+' : '') + (100 * x).toFixed(1) + '%', f1 = (x) => x.toFixed(1);
const EPS = 1e-9, E = 3, DUR = 4, EN = { dealt: 60, recv: 60, perSec: 2 };
const CAP = [6, 13, 21, 30, 40], K = 8, XMAX = 0.45, MINF = 0.15, MIRROR = 25, HPC = 10, SHORT = 3;
const stageOf = (L) => CAP.findIndex((c) => L <= c);
const lo = (s) => (s ? CAP[s - 1] + 1 : 1);
const LV = [...new Set(CAP.flatMap((c, i) => [lo(i), Math.round((lo(i) + c) / 2), c]))];
const RR = ['atk', 'spd', 'def'];
const capOf = (L) => Math.max(Math.ceil(L / 3), Math.floor(XMAX * L));
function dist(L, w) { const cap = capOf(L), p = { atk: 0, def: 0, spd: 0 };
  for (let i = 0; i < L; i++) { let best = null; for (const a of RR) if (p[a] < cap) { const need = w[a] * (i + 1) - p[a]; if (!best || need > best.n + EPS) best = { a, n: need }; } p[best.a]++; } return p; }
const W = { DIST: { atk: 1 / 3, def: 1 / 3, spd: 1 / 3 }, ATK: { atk: 1, def: 0, spd: 0 }, DEF: { atk: 0, def: 1, spd: 0 }, SPD: { atk: 0, def: 0, spd: 1 } };
function stats(L, w, ex = {}) { const s = stageOf(L), f = 1.5 ** s, b = Math.ceil(f), p = dist(L, w);
  return { atk: b + p.atk, def: b + p.def, spd: b + p.spd, hp: 10 * f * (1 + L / HPC), tal: ex.tal || 1, pts: p.atk + p.def + p.spd }; }
// ---- RNG determinístico: mulberry32 (32 bits, portável p/ TS; servidor sorteia a seed no PvP) ----
function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const subSeed = (seed, side) => (Math.imul(seed ^ 0x9E3779B9, 0x85EBCA6B) + side * 0x632BE59B) | 0; // stream por lado
// variância: mult = U(1−v, 1+v) [× 1,5 com chance CRIT, normalizado ÷(1+0,5·CRIT) p/ média 1]
let VAR = 0, CRIT = 0; const LUTA = process.argv.includes('--luta'); const VS = (process.argv.find((a) => a.startsWith('--vs='))?.slice(5) ?? '0,5,10,15,20,25,30').split(',').map((x) => +x / 100); if (!VS.includes(0)) VS.unshift(0); const NOCRIT = process.argv.includes('--nocrit');
const roll = (r) => { let m = 1 - VAR + 2 * VAR * r(); if (CRIT) m *= (r() < CRIT ? 1.5 : 1) / (1 + 0.5 * CRIT); return m; };
const golpes = (a, d) => d.hp * (1 + d.def / K) / (1 + a.atk / K) / (a.tal || 1) / (a.fm ?? (a.rng ? roll(a.rng) : 1)); // --luta: 1 sorteio por lado por luta
let JANELA = 22.5;
const intervalo = (spd) => JANELA / (9 * (1 + spd / K) / (1 + 1 / K));
const ttk = (a, b) => golpes(a, b) * intervalo(a.spd);
const adv = (A, B) => ttk(B, A) / ttk(A, B) - 1;
const setJ = (L) => { JANELA = 22.5; const D = stats(L, W.DIST); JANELA = 22.5 * MIRROR / ttk(D, D); };
const src = readFileSync(new URL('./cv3-sim3.mjs', import.meta.url), 'utf8');
const fight = eval('(' + src.slice(src.indexOf('function fight('), src.indexOf('const CELLS')) + ')');
const B = ['ATK', 'DEF', 'SPD', 'DIST'], REF = { fam: 'direto', p: 1 };
const mk = (S0, m, seed, side) => { const r = mulberry32(subSeed(seed, side)); const o = { ...S0, hp: S0.hp * m, rng: r }; if (LUTA) o.fm = roll(r); return o; };
// luta com seed: cada lado tem stream próprio; fases sorteadas da seed
function sfight(SA, SB, spA, spB, seed, m = 1) { const ph = mulberry32(seed ^ 0x51ED);
  return fight(mk(SA, m, seed, 1), mk(SB, m, seed, 2), spA, spB, { phA: ph(), phB: ph() }); }
// taxa de vitória do lado B (o mais fraco), empate = ½
function wrB(mkA, mkB, n) { let w = 0; for (let s = 1; s <= n; s++) { const c = mkA(s), d = mkB(s); setJ(c.L); const r = sfight(c.st, d.st, REF, REF, s * 7919 + 13);
  if (Math.abs(r.tA - r.tB) < 1e-6) w += 0.5; else if (r.tA < r.tB) w++; } const p = w / n; return { p, ic: 1.96 * Math.sqrt(p * (1 - p) / n) }; }
const fmt = (r) => `${f1(100 * r.p)}±${f1(100 * r.ic)}`;
const BANDS = { baixo: [2, 3, 4, 5, 6], medio: [15, 16, 17, 18, 19, 20, 21], alto: [32, 34, 36, 38, 40] }; // pares (L-1, L) no mesmo estágio
const cellOf = (s, Ls) => ({ L: Ls[s % Ls.length], b: B[Math.floor(s / Ls.length) % 4] });
function measure() {
  const tal = wrB((s) => { const c = cellOf(s, LV); return { L: c.L, st: stats(c.L, W[c.b], { tal: 1.05 }) }; }, (s) => { const c = cellOf(s, LV); return { st: stats(c.L, W[c.b]) }; }, N);
  const lv = {}; for (const [k, Ls] of Object.entries(BANDS)) lv[k] = wrB((s) => { const c = cellOf(s, Ls); return { L: c.L, st: stats(c.L, W[c.b]) }; }, (s) => { const c = cellOf(s, Ls); return { st: stats(c.L - 1, W[c.b]) }; }, N);
  const mir = wrB((s) => { const c = cellOf(s, LV); return { L: c.L, st: stats(c.L, W[c.b]) }; }, (s) => { const c = cellOf(s, LV); return { st: stats(c.L, W[c.b]) }; }, N);
  return { tal, lv, mir }; }
const dist1 = (x, a, z) => (x < a ? a - x : x > z ? x - z : 0);
console.log(`# modo: ${LUTA ? 'LUTA (1 sorteio por lado por luta)' : 'GOLPE (sorteio por golpe)'}`);
console.log(`# cv3-sim6 — variância por golpe U(1−v,1+v), N=${N} seeds por célula de medida, IC95 normal. Constantes sim5 + piso 15%. PRNG mulberry32.`);
console.log('variante | v | (i) 5% talento: fraco vence | (ii) L-1 baixo | médio | alto | (iii) espelho A | dist. às metas (pp)');
const rows = [];
for (const crit of [0, 0.1]) for (const v of VS) { VAR = v; CRIT = crit; const m = measure();
  const d = 100 * (dist1(m.tal.p, 0.25, 0.4) + Object.values(m.lv).reduce((a, r) => a + dist1(r.p, 0.15, 0.35), 0));
  rows.push({ v, crit, d, m }); const mirOk = Math.abs(m.mir.p - 0.5) <= m.mir.ic + 0.005;
  console.log(`${crit ? 'crit 10%×1,5' : 'uniforme'} | ${100 * v}% | ${fmt(m.tal)} | ${fmt(m.lv.baixo)} | ${fmt(m.lv.medio)} | ${fmt(m.lv.alto)} | ${fmt(m.mir)} ${mirOk ? 'OK' : 'FORA'} | ${f1(d)}`); }
const best = rows.filter((r) => !(NOCRIT && r.crit)).slice().sort((a, b) => a.d - b.d || a.crit - b.crit || a.v - b.v)[0];
const v0 = rows.find((r) => r.v === 0 && !r.crit);
console.log(`\nESCOLHA: v=${100 * best.v}% ${best.crit ? '+ crit 10%×1,5' : 'uniforme (sem crit)'} (menor distância às metas: ${f1(best.d)} pp${NOCRIT ? '; crit excluído da escolha por --nocrit' : ''})`);
console.log(`PROVA DE VERMELHO (meta): v=0 -> 5% vence-fraco ${fmt(v0.m.tal)} -> ${dist1(v0.m.tal.p, 0.25, 0.4) > 0 ? 'REPROVA: variância=0' : 'NÃO REPROVOU'}`);
VAR = best.v; CRIT = best.crit;
// ---- re-verificação com o v escolhido ----
const V = {}; const S = 200;
let gap = 0, wg = '', mm = Infinity, wm = '', defP = 0, wd = '';
const meanT = (A, Bs, L) => { setJ(L); let a = 0, b = 0; const ts = []; for (let s = 1; s <= S; s++) { const r = sfight(A, Bs, null, null, s * 104729 + L); a += r.tA; b += r.tB; ts.push(r.tA, r.tB); } return { adv: a / b - 1, ts }; };
for (let L = 1; L <= 40; L++) { const St = Object.fromEntries(B.map((b) => [b, stats(L, W[b])]));
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const g = meanT(St[B[i]], St[B[j]], L).adv; if (Math.abs(g) > Math.abs(gap)) { gap = g; wg = `L${L} ${B[i]}×${B[j]}`; } }
  if (L < 40 && stageOf(L) === stageOf(L + 1)) for (const b of B) { const m = meanT(stats(L + 1, W[b]), St[b], L + 1).adv; if (m < mm) { mm = m; wm = `L${L}→${L + 1} ${b}`; } }
  if (L < 40 && stageOf(L) !== stageOf(L + 1)) for (const b of B) { const m = meanT(stats(L + 1, W[b]), St[b], L + 1).adv; if (m < mm) { mm = m; wm = `L${L}→${L + 1} ${b}`; } }
  const ts = meanT(St.DEF, St.DEF, L).ts.sort((x, y) => x - y), p95 = ts[Math.floor(0.95 * ts.length)]; if (p95 > defP) { defP = p95; wd = `L${L}`; } }
V.gap = Math.abs(gap) <= 0.1; V.def40 = defP <= 40; V.level2 = mm >= 0.02;
console.log(`\n## Re-verificação com v=${100 * VAR}%${CRIT ? '+crit' : ''} (${S} seeds por ponto, sem especial, L=1..40)`);
console.log(`gap TTK médio máx ${pc(gap)} (${wg}) ${V.gap ? 'PASS' : 'FATAL'} · DEF×DEF P95 máx ${f1(defP)}s (${wd}) ${V.def40 ? 'PASS' : 'FATAL'} · +1 level mín (média) ${pc(mm)} (${wm}) ${V.level2 ? 'PASS' : 'FATAL'}`);
const cells = []; for (const L of LV) for (const b of B) cells.push({ L, b });
const PF = { direto2: 1, dot: 1, cura: 1, escudo: 1, buffAtkN: 1.01, debuffDefN: 1.01, buffSpdN: 1.82 };
const BUFFS = ['buffAtkN', 'debuffDefN', 'buffSpdN'];
const tol = (f, c) => (BUFFS.includes(f) && stageOf(c.L) === 0 ? [-0.15, 0.05] : [-0.05, 0.05]);
const SF = 150;
function evalF(f, p) { let w = 0, wc = '', ok = 0;
  for (const c of cells) { setJ(c.L); const st = stats(c.L, W[c.b]); let d = 0;
    for (let s = 1; s <= SF; s++) { const sd = s * 31337 + c.L * 101 + B.indexOf(c.b); const m = sfight(st, st, { fam: f, p }, REF, sd, SHORT), m0 = sfight(st, st, REF, REF, sd, SHORT); d += (m.tA / m.tB) - (m0.tA / m0.tB); }
    d /= SF; const [a, z] = tol(f, c); if (d >= a - 1e-9 && d <= z + 1e-9) ok++; if (Math.abs(d) > Math.abs(w)) { w = d; wc = `L${c.L}/${c.b}`; } }
  return { w, wc, ok, n: cells.length }; }
console.log(`\n## Régua PAREADA sobre a média de ${SF} seeds/célula (mesma seed: família×direto vs direto×direto), HP×${SHORT}, ${cells.length} células, p congelados do sim5`);
const fv = {}; for (const [f, p] of Object.entries(PF)) { const r = evalF(f, p); fv[f] = r.ok === r.n; console.log(`${f} | p ${p} | pior ${pc(r.w)} (${r.wc}) | ${r.ok}/${r.n} | ${fv[f] ? 'PASS' : 'FATAL: família=' + f}`); }
V.familias = Object.values(fv).every(Boolean);
{ const r = evalF('dot', 1.5); V.vermelho = r.ok < r.n; console.log(`PROVA DE VERMELHO: dot p×1,5 -> ${r.ok}/${r.n}, pior ${pc(r.w)} (${r.wc}) -> ${r.ok < r.n ? 'REPROVA: família=dot' : 'NÃO REPROVOU'}`); }
// teto global 5% (média de seeds)
{ const LVLS = [0, 0.01, 0.025, 0.05]; let gc = 0, gn = 0; const sums = new Set(); for (const a of LVLS) for (const b of LVLS) for (const c of LVLS) for (const d of LVLS) sums.add(+(a + b + c + d).toFixed(4));
  for (const sum of sums) for (const L of [1, 17, 40]) { const b = 'DIST'; const z = meanT(stats(L, W[b]), stats(L, W[b]), L).adv; gc = Math.max(gc, meanT(stats(L, W[b], { tal: 1 + Math.min(sum, 0.05) }), stats(L, W[b]), L).adv - z); gn = Math.max(gn, meanT(stats(L, W[b], { tal: 1 + sum }), stats(L, W[b]), L).adv - z); }
  V.teto = gc <= 0.055; console.log(`\n## Teto global min(soma,5%) PAREADO (mesmas seeds, menos espelho) sobre ${S} seeds: gap máx ${pc(gc)} ${V.teto ? 'PASS' : 'FATAL'} · sem cap ${pc(gn)} -> ${gn > 0.055 ? 'REPROVA: bônus empilhado' : 'NÃO REPROVOU'}`); }
// energia
{ let tot = 0, fired = 0, first = ''; for (const c of cells) { setJ(c.L); const st = stats(c.L, W[c.b]); for (const f of ['direto', ...Object.keys(PF)]) for (let s = 1; s <= 40; s++) { const m = sfight(st, st, { fam: f, p: PF[f] ?? 1 }, { fam: f, p: PF[f] ?? 1 }, s * 977 + c.L, 1); tot++; if (m.castA && m.castB) fired++; else if (!first) first = `L${c.L}/${c.b}/${f}/seed${s}`; } }
  V.energia = fired === tot; console.log(`energia 60/60/2 (HP real, 40 seeds): especial nos 2 lados ${fired}/${tot} ${V.energia ? 'PASS' : 'FATAL ' + first}`); }
// determinismo do PRNG
{ const a = mulberry32(42), b = mulberry32(42); const xa = [a(), a(), a()], xb = [b(), b(), b()]; console.log(`mulberry32(42) 3 primeiros: ${xa.map((x) => x.toFixed(6)).join(' ')} ${xa.every((x, i) => x === xb[i]) ? '(reprodutível)' : 'NÃO REPRODUTÍVEL'}`); }
const fatal = Object.entries(V).filter(([, v]) => !v).map(([k]) => k);
console.log(`\n## VEREDITO: ${fatal.length ? 'NÃO — FATAL em: ' + fatal.join(', ') : 'FECHA'}`);
process.exitCode = fatal.length ? 1 : 0;
