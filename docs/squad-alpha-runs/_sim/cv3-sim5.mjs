// cv3-sim5.mjs — Fase 1 Prototyper: spike do sistema completo (contexto §2.8, PLANO §11). Determinístico. node cv3-sim5.mjs [--red] [--c=N]
import { readFileSync } from 'node:fs';
const RED = process.argv.includes('--red');
const pc = (x) => (x >= 0 ? '+' : '') + (100 * x).toFixed(1) + '%', f1 = (x) => x.toFixed(1), f2 = (x) => x.toFixed(2);
const EPS = 1e-9, E = 3, DUR = 4, EN = { dealt: 60, recv: 60, perSec: 2 };
// ---- constantes / suposições ----
const CAP = [6, 13, 21, 30, 40];             // FORM_REQUIREMENTS.cap acumulado (progression.ts)
const K = 8, XMAX = +(process.argv.find((a) => a.startsWith('--x='))?.slice(4) ?? 0.45), MIRROR = 25; const MINF = +(process.argv.find((a) => a.startsWith('--min='))?.slice(6) ?? 0); // MINF: piso por atributo floor(MINF·L)       // janela normalizada: espelho DIST = 25 s
const HPC = +(process.argv.find((a) => a.startsWith('--c='))?.slice(4) ?? 10); // HP = 10·1,5^s·(1+L/c)
const SHORT = 3;                             // REGRA DE LUTA CURTA: régua ΔTTK mede com HP×3 nos dois lados
const stageOf = (L) => CAP.findIndex((c) => L <= c);
const lo = (s) => (s ? CAP[s - 1] + 1 : 1);
const LV = [...new Set(CAP.flatMap((c, i) => [lo(i), Math.round((lo(i) + c) / 2), c]))];
const RR = ['atk', 'spd', 'def'];
// distribuição: pesos do caminho (chip) -> pontos inteiros com teto por atributo, determinística em L
const capOf = (L) => Math.max(Math.ceil(L / 3), Math.floor(XMAX * L));
function dist(L, w) {
  const cap = capOf(L), p = { atk: 0, def: 0, spd: 0 };
  for (let i = 0; i < L; i++) { let best = null; for (const a of RR) if (p[a] < cap) { const need = w[a] * (i + 1) - p[a]; if (!best || need > best.n + EPS) best = { a, n: need }; } p[best.a]++; }
  return p;
}
const W = { DIST: { atk: 1 / 3, def: 1 / 3, spd: 1 / 3 }, ATK: { atk: 1, def: 0, spd: 0 }, DEF: { atk: 0, def: 1, spd: 0 }, SPD: { atk: 0, def: 0, spd: 1 } };
function stats(L, w, ex = {}) {
  const s = stageOf(L), f = 1.5 ** s, b = Math.ceil(f), p = dist(L, w);
  return { atk: b + p.atk, def: b + p.def, spd: b + p.spd, hp: 10 * f * (1 + L / HPC), tal: ex.tal || 1, pts: p.atk + p.def + p.spd };
}
// ---- curva ----
let NOISE = null; // (P1-d) rng → golpe vale ×U(0,75;1,25)
const golpes = (a, d) => d.hp * (1 + d.def / K) / (1 + a.atk / K) / (a.tal || 1) / (NOISE ? 0.75 + 0.5 * NOISE() : 1);
let JANELA = 22.5;
const intervalo = (spd) => JANELA / (9 * (1 + spd / K) / (1 + 1 / K));
const ttk = (a, b) => golpes(a, b) * intervalo(a.spd);
const adv = (A, B) => ttk(B, A) / ttk(A, B) - 1;   // + = A vence; 0 = empate válido
const setJ = (L) => { JANELA = 22.5; const D = stats(L, W.DIST); JANELA = 22.5 * MIRROR / ttk(D, D); };
const src = readFileSync(new URL('./cv3-sim3.mjs', import.meta.url), 'utf8');
const fight = eval('(' + src.slice(src.indexOf('function fight('), src.indexOf('const CELLS')) + ')');
const B = ['ATK', 'DEF', 'SPD', 'DIST'];
const V = {};
console.log(`## Constantes: teto ${CAP.join('/')} · X_MAX ${XMAX} · k=${K} · HP = 10·1,5^s·(1+L/${HPC}) · base ATK/DEF/SPD ceil(1,5^s) + pontos · janela p/ espelho DIST=${MIRROR}s · régua com HP×${SHORT}`);
// (1)(2)(3)
let gap = 0, wg = '', mm = Infinity, wm = '', defMax = 0, wd = '';
for (let L = 1; L <= 40; L++) { setJ(L); const S = Object.fromEntries(B.map((b) => [b, stats(L, W[b])]));
  for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const g = adv(S[B[i]], S[B[j]]); if (Math.abs(g) > Math.abs(gap)) { gap = g; wg = `L${L} ${B[i]}×${B[j]}`; } }
  if (L < 40) for (const b of B) { const m = adv(stats(L + 1, W[b]), S[b]); if (m < mm) { mm = m; wm = `L${L}→${L + 1} ${b}`; } }
  const d = ttk(S.DEF, S.DEF); if (d > defMax) { defMax = d; wd = `L${L}`; } }
V.gap = Math.abs(gap) <= 0.1; V.def40 = defMax <= 40; V.level2 = mm >= 0.02;
console.log(`\n## (1) gap máx ${pc(gap)} (${wg}) ${V.gap ? 'PASS' : 'FATAL'} · (2) DEF puro máx ${f1(defMax)}s (${wd}) ${V.def40 ? 'PASS' : 'FATAL'} · (3) +1 level mín ${pc(mm)} (${wm}) ${V.level2 ? 'PASS' : 'FATAL'}  [L=1..40, 4 builds]`);
// (4) famílias
const cells = []; for (const L of LV) for (const b of B) cells.push({ L, b });
const REF = { fam: 'direto', p: 1 };
const run = (c, sp, o, m = SHORT) => { setJ(c.L); const s0 = stats(c.L, W[c.b]); const s = { ...s0, hp: s0.hp * m }; return fight(s, s, sp, REF, o); };
const BUFFS = ['buffAtkN', 'debuffDefN', 'buffSpdN'];
const tol = (f, c) => (BUFFS.includes(f) && stageOf(c.L) === 0 ? [-0.15, 0.05] : [-0.05, 0.05]);
const pOf = (p, L) => (typeof p === 'object' ? p[stageOf(L)] : p);
function evalF(f, p, only) { let w = 0, wc = '', ok = 0, n = 0, nf = 0, ex = 0;
  for (const c of cells) { if (only !== undefined && stageOf(c.L) !== only) continue; n++; const m = run(c, { fam: f, p: pOf(p, c.L) }); const d = m.tA / m.tB - 1; if (!m.castA) nf++; const [a, z] = tol(f, c); if (d >= a - 1e-9 && d <= z + 1e-9) ok++; else ex = Math.max(ex, d < a ? a - d : d - z); if (Math.abs(d) > Math.abs(w)) { w = d; wc = `L${c.L}/${c.b}`; } }
  return { w, wc, ok, n, nf, ex }; }
function cal(f, a, z, only) { let b = { p: a, s: 9 }; for (let it = 0; it < 4; it++) { const st = (z - a) / 20; for (let p = a; p <= z + EPS; p += st) { const r = evalF(f, p, only); const s = r.ex * 10 + Math.abs(r.w) * 0.01; if (s < b.s) b = { p, s }; } a = Math.max(0.01, b.p - st); z = b.p + st; } return Math.round(b.p * 100) / 100; }
const RANGE = { dot: [0.3, 3], cura: [0.2, 4], escudo: [0.2, 4], buffAtkN: [0.1, 3], debuffDefN: [0.1, 3], buffSpdN: [0.1, 6] };
const PF = { direto: 1, direto2: 1 };
for (const [f, [a, z]] of Object.entries(RANGE)) { const g = cal(f, a, z), rg = evalF(f, g); PF[f] = rg.ok === rg.n ? g : Object.fromEntries(CAP.map((_, s) => [s, cal(f, a, z, s)])); }
console.log(`\n## (4) Régua ΔTTK (HP×${SHORT}, fase 0,5, fantasma; ±5%, buffs −15% no estágio 0) · ${LV.length} levels × 4 builds`);
console.log('família | p (global ou estágio 0/1/2/3/4) | pior Δ (célula) | dentro | veredito');
const fv = {};
for (const [f, p] of Object.entries(PF)) { const r = evalF(f, p); fv[f] = r.ok === r.n && r.nf === 0; console.log(`${f} | ${typeof p === 'object' ? Object.values(p).join('/') : p} | ${pc(r.w)} (${r.wc}) | ${r.ok}/${r.n} | ${fv[f] ? 'PASS' : 'FATAL: família=' + f}`); }
V.familias = Object.values(fv).every(Boolean);
{ let w = 0, wc = ''; for (const c of cells) { const m = run(c, { fam: 'direto2', p: 1 }, {}, 1); const d = m.tA / m.tB - 1; if (Math.abs(d) > Math.abs(w)) { w = d; wc = `L${c.L}/${c.b}`; } }
  console.log(`direto2 sem a regra (HP×1): pior ${pc(w)} (${wc}) · com a regra (HP×${SHORT}): pior ${pc(evalF('direto2', 1).w)}`); }
const x15 = (p) => (typeof p === 'object' ? Object.fromEntries(Object.entries(p).map(([k, v]) => [k, Math.round(v * 150) / 100])) : Math.round(p * 150) / 100);
{ const redF = 'dot', rr = evalF(redF, x15(PF[redF])); V.vermelho = fv[redF] && rr.ok < rr.n;
  console.log(`PROVA DE VERMELHO: ${redF} p×1,5 -> ${rr.ok}/${rr.n}, pior ${pc(rr.w)} (${rr.wc}) -> ${rr.ok < rr.n ? 'REPROVA: família=' + redF : 'NÃO REPROVOU'}`); }
if (RED) { const r = evalF('buffSpdN', x15(PF.buffSpdN)); console.log(`[--red] buffSpdN ×1,5 -> ${r.ok}/${r.n} ${r.ok < r.n ? 'REPROVA: família=buffSpdN' : 'NÃO REPROVOU'}`); }
// energia (HP real)
let tot = 0, fired = 0, first = '';
for (const c of cells) for (const f of Object.keys(PF)) for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) { const m = run(c, { fam: f, p: pOf(PF[f], c.L) }, { phA: i / 6, phB: j / 6 }, 1); tot++; if (m.castA && m.castB) fired++; else if (!first) first = `L${c.L}/${c.b}/${f}`; }
V.energia = fired === tot; console.log(`energia 60/60/2 (HP real, 36 fases): especial nos 2 lados ${fired}/${tot} ${V.energia ? 'PASS' : 'FATAL ' + first}`);
// (5) PvP talento/equip 5%
console.log('\n## (5) PvP: 5% (talento+equipamento, dano ×1,05) × 0%, mesmo level e build');
let g5min = 9, g5max = -9, wins = 0, ties = 0, n5 = 0, dmean = 0; const eq = [];
for (const L of LV) { setJ(L); for (const b of B) { const A = stats(L, W[b], { tal: 1.05 }), Bb = stats(L, W[b]); const g = adv(A, Bb); g5min = Math.min(g5min, g); g5max = Math.max(g5max, g);
  for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { const m = fight(A, Bb, REF, REF, { phA: i / 10, phB: j / 10 }); n5++; dmean += m.tA / m.tB - 1; if (Math.abs(m.tA - m.tB) < 1e-6) ties++; else if (m.tB < m.tA) wins++; } }
  if (L < 40) { const x = adv(stats(L, W.DIST, { tal: 1.05 }), stats(L, W.DIST)) / adv(stats(L + 1, W.DIST), stats(L, W.DIST)); eq.push(`L${L}:${f1(x)}`); } }
V.pvp5 = g5min >= 0.045 && g5max <= 0.055;
console.log(`gap TTK ${pc(g5min)}..${pc(g5max)} ${V.pvp5 ? 'PASS (~5%)' : 'FATAL'} · torneio (luta com especial direto, ${LV.length} levels × 4 builds × 100 fases): o de 5% vence ${wins}/${n5} (${f1(100 * wins / n5)}%), empates ${ties}, ΔTTK médio ${pc(dmean / n5)}`);
console.log(`equivale a +X levels (DIST): ${eq.join(' ')}`);
// (6) chips: toda distribuição admissível
console.log('\n## (6) Chips = só distribuição: todas as distribuições inteiras com nenhum atributo > max(ceil(L/3), floor(0,45·L))');
let g6 = 0, w6 = '', totOk = true, nd = 0;
for (const L of LV) { setJ(L); const cap = capOf(L), s = stageOf(L), b = Math.ceil(1.5 ** s), hp = 10 * 1.5 ** s * (1 + L / HPC); const all = [];
  for (let a = 0; a <= cap; a++) for (let d = 0; d <= cap; d++) { const sp = L - a - d; if (sp < 0 || sp > cap || Math.min(a, d, sp) < Math.floor(MINF * L)) continue; all.push({ atk: b + a, def: b + d, spd: b + sp, hp, pts: a + d + sp }); }
  for (const x of all) { if (x.pts !== L) totOk = false; nd++; for (const y of all) { const g = adv(x, y); if (g > g6) { g6 = g; w6 = `L${L} ${x.atk - b}/${x.def - b}/${x.spd - b} × ${y.atk - b}/${y.def - b}/${y.spd - b} (atk/def/spd)`; } } } }
V.chips = totOk && g6 <= 0.1;
console.log(`${nd} distribuições; total = L em todas: ${totOk ? 'SIM' : 'NÃO'}; pior gap entre quaisquer duas ${pc(g6)} (${w6}) ${V.chips ? 'PASS' : 'FATAL'}`);
// (7) degeneração
console.log('\n## (7) Degeneração: level desce -> stats recalculados de (level, caminho) -> recupera');
const key = (s) => [s.atk, s.def, s.spd, f2(s.hp), s.pts].join('/');
let inv = true; const path = [10, 11, 12, 13, 9, 8, 9, 10, 11, 12, 13, 14, 21, 17, 21, 30, 25, 30];
const seen = {}; for (const L of path) for (const b of B) { const s = stats(L, W[b]), k = key(s), id = L + b; if (seen[id] && seen[id] !== k) inv = false; seen[id] = k; if (s.pts !== L) inv = false; }
V.degen = inv;
console.log(`caminho ${path.join('→')} × 4 builds: mesmo level = mesmos stats e total = L: ${inv ? 'PASS' : 'FATAL'} (L13 DIST ${key(stats(13, W.DIST))} → L9 ${key(stats(9, W.DIST))} → L13 ${key(stats(13, W.DIST))}; formato atk/def/spd/hp/pts)`);
// constantes
console.log('\n## Constantes para o núcleo TS');
console.log(`STAGE_LEVEL_CAP | ${CAP.join('/')}\nPOINTS | 1/level em ATK/DEF/SPD; teto por atributo max(ceil(L/3), floor(0,45·L))\nBASE | ATK/DEF/SPD = ceil(1,5^s) + pontos\nHP | 10·1,5^s·(1+L/${HPC})\nCURVA | golpes = HP·(1+DEF/8)/(1+ATK/8)/(1+bônus%), fracionário\nRITMO | 9·(1+SPD/8)/(1+1/8) por janela; janela normalizada p/ espelho DIST = ${MIRROR} s\nE | 3 · ENERGIA 60/60/2, dispara a 100\nRÉGUA | ΔTTK ±5% em lutas com HP×${SHORT}; buffs −15% no estágio 0`);
for (const [f, p] of Object.entries(PF)) console.log(`P_${f} | ${typeof p === 'object' ? Object.entries(p).map(([s, v]) => 's' + s + '=' + v).join(' ') : p}`);
const fatal = Object.entries(V).filter(([, v]) => !v).map(([k]) => k);
console.log(`\n## VEREDITO: ${fatal.length ? 'NÃO — FATAL em: ' + fatal.join(', ') : 'FECHA'}`);
process.exitCode = fatal.length ? 1 : 0;

// ======== PASSE 1 (skeptic) — node cv3-sim5.mjs --min=0.15 --p1 ========
if (process.argv.includes('--p1')) {
  console.log('\n# PASSE 1');
  // (a)+(b) holdout: HP×1, levels ímpares 1..39 (nenhum nos 15 da calibração, exceto coincidências), fases 0,13/0,37/0,71/0,89, p congelados
  const HL = []; for (let L = 1; L < 40; L += 2) if (!LV.includes(L)) HL.push(L);
  const PH = [0.13, 0.37, 0.71, 0.89];
  console.log(`## P1-a/b Holdout (p congelados): HP×1, levels ${HL.join(',')} × 4 builds × ${PH.length}×${PH.length} fases; tolerância igual à régua`);
  console.log('família | pior Δ por estágio 0/1/2/3/4 | pior global (célula) | dentro | veredito');
  const hv = {};
  for (const PAIRED of [false, true]) { console.log(PAIRED ? '-- PAREADO: Δ(família) − Δ(direto×direto) nas MESMAS fases (remove a vantagem de quem bate primeiro)' : '-- BRUTO: Δ = tA/tB − 1');
  for (const [f, p] of Object.entries(PF)) { const ws = [0, 0, 0, 0, 0]; let w = 0, wc = '', ok = 0, n = 0;
    for (const L of HL) for (const b of B) for (const a of PH) for (const z of PH) { const c = { L, b }; const m = run(c, { fam: f, p: pOf(p, L) }, { phA: a, phB: z }, 1); const m0 = run(c, REF, { phA: a, phB: z }, 1); const d = PAIRED ? m.tA / m.tB - m0.tA / m0.tB : m.tA / m.tB - 1; const s = stageOf(L); if (Math.abs(d) > Math.abs(ws[s])) ws[s] = d; const [lo2, hi2] = tol(f, c); n++; if (d >= lo2 - 1e-9 && d <= hi2 + 1e-9) ok++; if (Math.abs(d) > Math.abs(w)) { w = d; wc = `L${L}/${b} ph${a}/${z}`; } }
    hv[f] = ok === n; console.log(`${f} | ${ws.map(pc).join(' ')} | ${pc(w)} (${wc}) | ${ok}/${n} | ${hv[f] ? 'PASS' : 'FATAL: família=' + f}`); }
  }
  console.log('critérios 1–3 com HP×1: são razões de TTK em que o HP multiplica os dois lados igualmente; idênticos aos da seção (1) por construção.');
  // (d) PvP com ruído
  let s = 7 >>> 0; const rng = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  let W5 = 0, T5 = 0, N5 = 0; NOISE = rng;
  for (const L of LV) { setJ(L); for (const b of B) { const A = stats(L, W[b], { tal: 1.05 }), Bb = stats(L, W[b]); for (let i = 0; i < 120; i++) { const m = fight(A, Bb, REF, REF, { phA: rng(), phB: rng() }); N5++; if (Math.abs(m.tA - m.tB) < 1e-6) T5++; else if (m.tB < m.tA) W5++; } } }
  NOISE = null; const ph = W5 / N5, ic = 1.96 * Math.sqrt(ph * (1 - ph) / N5);
  console.log(`\n## P1-d PvP com ruído ±25% por golpe (uniforme, seed 7): 5% vence ${W5}/${N5} = ${f1(100 * ph)}% (IC95% ${f1(100 * (ph - ic))}–${f1(100 * (ph + ic))}%), empates ${T5}`);
  // (e) teto global de bônus
  const LVLS = [0, 0.01, 0.025, 0.05]; let gc = 0, gn = 0, wc2 = '';
  for (const t of LVLS) for (const e of LVLS) for (const c of LVLS) for (const r of LVLS) { const sum = t + e + c + r; for (const L of LV) { setJ(L); for (const b of B) { const g1 = adv(stats(L, W[b], { tal: 1 + Math.min(sum, 0.05) }), stats(L, W[b])); const g0 = adv(stats(L, W[b], { tal: 1 + sum }), stats(L, W[b])); if (g1 > gc) { gc = g1; wc2 = `t${t}/e${e}/c${c}/r${r}`; } gn = Math.max(gn, g0); } } }
  console.log(`\n## P1-e Teto global NÃO empilhável: bônus = min(talento+equip+Comércio+Renascimento, 5%); 4^4 combinações (0/1/2,5/5% cada) × 15 levels × 4 builds`);
  console.log(`com cap: gap máx ${pc(gc)} (${wc2}) -> ${gc <= 0.05 + 1e-9 ? 'PASS (≤5%)' : 'FATAL'} · VERMELHO sem cap: gap máx ${pc(gn)} -> ${gn > 0.05 + 1e-9 ? 'REPROVA: bônus empilhado' : 'NÃO REPROVOU'}`);
  console.log(`\n## PASSE 1 holdout: ${Object.values(hv).every(Boolean) ? 'PASS' : 'FATAL em ' + Object.entries(hv).filter(([, v]) => !v).map(([k]) => k).join(', ')}`);
}
