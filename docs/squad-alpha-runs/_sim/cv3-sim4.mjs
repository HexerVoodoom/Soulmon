// cv3-sim4.mjs — spike L1: level c/ teto por estágio + limite de concentração. Determinístico. node cv3-sim4.mjs
import { readFileSync } from 'node:fs';
const pc = (x) => (x >= 0 ? '+' : '') + (100 * x).toFixed(1) + '%', f1 = (x) => x.toFixed(1);
const EPS = 1e-9, E = 3, DUR = 4, EN = { dealt: 60, recv: 60, perSec: 2 }; // mantidos do sim3
// ---- SUPOSIÇÕES ----
const CAP = process.argv.includes('--cap-code') ? [6, 13, 21, 30, 40] : [10, 20, 30, 40, 50]; // --cap-code: FORM_REQUIREMENTS.cap 6/7/8/9/10 acumulado                 // S-L1 teto de level Rookie/Champion/Ultimate/Mega/Ultra
const XP_NOTE = 'S-L2 ritmo de XP: 1 level por dia completo (66% do XP do bônus de dia completo); teto atingido antes da evolução';
const stageOf = (L) => CAP.findIndex((c) => L <= c);
const LV = [...new Set(CAP.flatMap((c, i) => { const lo = i ? CAP[i - 1] + 1 : 1; return [lo, Math.round((lo + c) / 2), c]; }))];
// pontos = 1 por level; a cada 4º level o ponto vai a HP (S-L3); base do estágio = VAR A do sim3
function stats(build, L, X, ex = {}) {
  const s = stageOf(L), f = 1.5 ** s, nHp = Math.floor(L / 4), n = L - nHp;
  const p = { atk: 0, def: 0, spd: 0 }, rr = ['atk', 'spd', 'def'];
  if (build === 'DIST') for (let i = 0; i < n; i++) p[rr[i % 3]]++;
  else { const m = build.toLowerCase(); p[m] = Math.min(n, Math.floor(X * n)); const o = rr.filter((a) => a !== m); for (let i = 0; i < n - p[m]; i++) p[o[i % 2]]++; }
  const st = { hp: 10 * f + nHp, tal: ex.tal || 1 };
  for (const a of rr) st[a] = Math.ceil(f) + p[a] + (ex.flat?.[a] || 0);
  return st;
}
// ---- curvas ----
let CV = { kind: 'mult', k: 8, round: false };
function golpes(a, d) {
  let x = CV.kind === 'mult' ? d.hp * (1 + d.def / CV.k) / (1 + a.atk / CV.k) : d.hp / Math.max(0.2, 1 + (a.atk - d.def) / CV.k);
  x /= a.tal || 1; return CV.round ? Math.max(1, Math.round(x)) : x;
}
let JANELA = 22.5;
const ritmo = (spd) => (CV.kind === 'mult' ? 9 * (1 + spd / CV.k) / (1 + 1 / CV.k) : 8 + spd);
const intervalo = (spd) => JANELA / ritmo(spd);
const ttk = (a, b) => golpes(a, b) * intervalo(a.spd);
const adv = (A, B) => ttk(B, A) / ttk(A, B) - 1; // + = A vence; 0 = empate (válido)
// reuso literal do motor de luta do sim3 (energia 60/60/2, fantasma, régua ΔTTK)
const src = readFileSync(new URL('./cv3-sim3.mjs', import.meta.url), 'utf8');
const fight = eval('(' + src.slice(src.indexOf('function fight('), src.indexOf('const CELLS')) + ')');
const B = ['ATK', 'DEF', 'SPD', 'DIST'];
function evalCfg(cv, X, ex) {
  CV = cv; let gap = 0, wg = '', mm = Infinity, wm = '', defMax = 0, wd = '';
  for (const L of LV) {
    JANELA = 22.5; const D = stats('DIST', L, X); JANELA = 22.5 * 25 / ttk(D, D);
    const S = Object.fromEntries(B.map((b) => [b, stats(b, L, X)]));
    for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) { const g = adv(S[B[i]], S[B[j]]); if (Math.abs(g) > Math.abs(gap)) { gap = g; wg = `L${L} ${B[i]}×${B[j]}`; } }
    if (L < CAP[CAP.length - 1]) { const m = adv(stats('DIST', L + 1, X), D); if (m < mm) { mm = m; wm = `L${L}→${L + 1}`; } }
    const dd = ttk(S.DEF, S.DEF); if (dd > defMax) { defMax = dd; wd = `L${L}`; }
  }
  return { gap, wg, mm, wm, defMax, wd, ok: Math.abs(gap) <= 0.1 + EPS && mm >= 0.02 && defMax <= 40 };
}
const name = (c) => `${c.kind}${c.kind === 'adit' ? ' k=' + c.k : ' k=8'} ${c.round ? 'round' : 'frac'}`;
console.log(`## Suposições: ${CAP.join('/')} teto de level por estágio · ${XP_NOTE} · 4º level → HP · base estágio ceil(1,5^s), HP 10·1,5^s · janela normalizada p/ espelho DIST = 25 s · DIST = rodízio ATK/SPD/DEF; puro = floor(X·pts) no principal, resto alternado`);
console.log('\n## 1. Varredura: curva × limite X (X=1,00 = sem limite, controle vermelho)');
console.log('curva | X | pior gap (célula) | +1 level mín (célula) | DEF espelho máx | veredito');
const CVS = [{ kind: 'mult', k: 8, round: false }, { kind: 'mult', k: 8, round: true }];
for (const k of [4, 6, 8, 10, 12, 16, 20]) CVS.push({ kind: 'adit', k, round: true }, { kind: 'adit', k, round: false });
const res = [];
for (const cv of CVS) for (const X of (process.argv.includes('--cap-code') ? [0.35, 0.4, 0.45, 0.5, 1.0] : [0.4, 0.45, 0.5, 0.6, 1.0])) { const r = evalCfg(cv, X); res.push({ cv, X, r }); console.log(`${name(cv)} | ${X.toFixed(2)} | ${pc(r.gap)} (${r.wg}) | ${pc(r.mm)} (${r.wm}) | ${f1(r.defMax)}s (${r.wd}) | ${r.ok ? 'FECHA' : 'NÃO'}`); }
const ok = res.filter((x) => x.r.ok && x.X < 1).sort((a, b) => b.X - a.X || Math.abs(a.r.gap) - Math.abs(b.r.gap));
console.log(`\nfecham (X<1): ${ok.length ? ok.map((x) => name(x.cv) + ' X=' + x.X).join('; ') : 'NENHUMA'}`);
const pick = (process.argv.includes('--cap-code') && ok.find((x) => x.cv.kind === 'mult' && !x.cv.round && x.X === 0.45)) || ok[0] || res.filter((x) => x.X < 1).sort((a, b) => Math.abs(a.r.gap) - Math.abs(b.r.gap))[0];
console.log(`ESCOLHA (maior X que fecha; senão menor gap): ${name(pick.cv)} X=${pick.X}`);
const red = res.find((x) => x.cv === pick.cv && x.X === 1.0);
console.log(`PROVA DE VERMELHO: mesma curva sem limite (X=1) -> gap ${pc(red.r.gap)} (${red.r.wg}) -> ${red.r.ok ? 'NÃO REPROVOU' : 'REPROVA'}`);
// ---- 2. variantes ----
CV = pick.cv; const X = pick.X;
console.log(`\n## 2. Variantes sobre a ESCOLHA: gap criado contra o mesmo build sem o bônus (pior entre níveis e builds)`);
const vari = [['talento +5% dano', () => ({ tal: 1.05 })]];
for (const N of [1, 2, 3, 5]) vari.push([`equip +${N} pts no principal`, (b) => ({ flat: { [b === 'DIST' ? 'atk' : b.toLowerCase()]: N } })]);
for (const [nm, mk] of vari) { let w = 0, wc = '', mn = Infinity; for (const L of LV) { const D = stats('DIST', L, X); JANELA = 22.5; JANELA = 22.5 * 25 / ttk(D, D); for (const b of B) { const g = adv(stats(b, L, X, mk(b)), stats(b, L, X)); if (g > w) { w = g; wc = `L${L}/${b}`; } mn = Math.min(mn, g); } } console.log(`${nm} | máx ${pc(w)} (${wc}) · mín ${pc(mn)} | ${w <= 0.1 ? 'dentro de 10%' : 'ESTOURA 10%'}`); }
// ---- 3. energia + régua no motor do sim3 ----
let tot = 0, fired = 0, wD = 0, wDc = '';
for (const L of LV) for (const b of B) { const s = stats(b, L, X), D = stats('DIST', L, X); JANELA = 22.5; JANELA = 22.5 * 25 / ttk(D, D);
  for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { const m = fight(s, s, { fam: 'direto', p: 1 }, { fam: 'direto', p: 1 }, { phA: i / 10, phB: j / 10 }); tot++; if (m.castA && m.castB) fired++; }
  const m = fight(s, s, { fam: 'direto2', p: 1 }, { fam: 'direto', p: 1 }); const d = m.tA / m.tB - 1; if (Math.abs(d) > Math.abs(wD)) { wD = d; wDc = `L${L}/${b}`; } }
console.log(`\n## 3. Motor sim3: energia 60/60/2 -> especial nos 2 lados em ${fired}/${tot} lutas ${fired === tot ? 'PASS' : 'FATAL'} · régua ΔTTK controle direto2 pior ${pc(wD)} (${wDc}) ${Math.abs(wD) <= 0.05 ? 'PASS' : 'FATAL'}`);
console.log(`\n## VEREDITO: ${ok.length ? 'FECHA com ' + name(pick.cv) + ' X=' + pick.X : 'NÃO FECHA'}`);

// ======== PASSE 1 ========
if (process.argv.includes('--p1')) {
  CV = { kind: 'mult', k: 8, round: false }; const X = 0.45; const R = { fam: 'direto', p: 1 };
  console.log('## P1-1 Isolamento direto2 (L1/DEF, mult k=8 frac)');
  const s = stats('DEF', 1, X), D = stats('DIST', 1, X); JANELA = 22.5; JANELA = 22.5 * 25 / ttk(D, D);
  for (const m of [1, 3, 10, 30]) { const S = { ...s, hp: s.hp * m }; const a = fight(S, S, { fam: 'direto2', p: 1 }, R), b = fight(S, S, R, R);
    console.log(`HP×${m}: golpes ${golpes(S, S).toFixed(1)} · direto2 Δ ${pc(a.tA / a.tB - 1)} (castA ${a.castA}) · espelho direto×direto Δ ${pc(b.tA / b.tB - 1)}`); }
  // teste mínimo: especial com dano total igual, 2ª metade adiantada para o mesmo tick (atraso 0) deve dar Δ=0
  { const S = s; let worst = 0; for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) { const a = fight(S, S, { fam: 'direto2', p: 1 }, R, { phA: i / 20, phB: j / 20 }); worst = Math.min(worst, a.tA / a.tB - 1); }
    let mean = 0; for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) { const a = fight(S, S, { fam: 'direto2', p: 1 }, R, { phA: i / 20, phB: j / 20 }); mean += (a.tA / a.tB - 1) / 400; }
    console.log(`L1/DEF 400 fases: Δ médio ${pc(mean)} · pior ${pc(worst)}`); }
  let w = 0, wc = ''; for (const L of LV) for (const b of B) { const S = stats(b, L, X), DD = stats('DIST', L, X); JANELA = 22.5; JANELA = 22.5 * 25 / ttk(DD, DD); const a = fight(S, S, { fam: 'direto2', p: 1 }, R); const d = a.tA / a.tB - 1; if (Math.abs(d) > Math.abs(w)) { w = d; wc = `L${L}/${b} golpes ${golpes(S, S).toFixed(1)}`; } }
  console.log(`direto2 pior em todos os levels: ${pc(w)} (${wc})`);
  console.log('## P1-3 PvE: Soulmon no level mínimo × teto do MESMO estágio contra inimigo de referência fixo (DIST no level mínimo do estágio)');
  for (let i = 0; i < CAP.length; i++) { const lo = i ? CAP[i - 1] + 1 : 1, hi = CAP[i]; const foe = stats('DIST', lo, X); JANELA = 22.5; JANELA = 22.5 * 25 / ttk(foe, foe);
    for (const b of B) { const a = ttk(stats(b, lo, X), foe), c = ttk(stats(b, hi, X), foe); if (b === 'DIST' || b === 'DEF') console.log(`estágio ${i} L${lo}→L${hi} ${b}: TTK ${f1(a)}s → ${f1(c)}s (${pc(c / a - 1)}) ${Math.abs(c / a - 1) > 0.05 ? '>5%' : '≤5%'}`); } }
}
