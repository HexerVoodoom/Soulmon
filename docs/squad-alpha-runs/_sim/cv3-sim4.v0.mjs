// cv3-sim4.mjs — spike level c/ teto por estágio + limite de concentração. Determinístico. node cv3-sim4.mjs [--red]
const RED = process.argv.includes('--red');
const pc = (x) => (x >= 0 ? '+' : '') + (100 * x).toFixed(1) + '%', f1 = (x) => x.toFixed(1);
// SUPOSIÇÕES
const JANELA = 22.5;                       // SPD1 = 9 ataques/janela (sim3)
const CAP = [10, 20, 30, 40];              // S-L1: teto de level por estágio Rookie/Champion/Ultimate/Mega
const LEVELS = [5, 10, 15, 20, 25, 30, 35, 40];
const stageOf = (L) => CAP.findIndex((c) => L <= c);
const EVO = 1.5;                           // ×1,5 por evolução (sim3), fracionário
const BASE = { atk: 1, def: 1, spd: 1 };
const hpOf = (L) => (10 + Math.floor(L / 4)) * EVO ** stageOf(L); // HP cresce 1/4 level (como d%4 do sim3)
const ORDER = { ATK: 'atk', DEF: 'def', SPD: 'spd' };
function stats(build, L, X, extra = {}) {
  const p = { atk: 0, def: 0, spd: 0 };
  if (build === 'DIST') { for (let i = 0; i < L; i++) p[['atk', 'spd', 'def'][i % 3]]++; }
  else { const m = ORDER[build], lim = Math.floor(X * L); p[m] = Math.min(L, lim); const rest = ['atk', 'spd', 'def'].filter((a) => a !== m); for (let i = 0; i < L - p[m]; i++) p[rest[i % 2]]++; }
  const s = {}, mul = EVO ** stageOf(L);
  for (const a of ['atk', 'def', 'spd']) s[a] = (BASE[a] + p[a] + (extra.flat?.[a] || 0)) * mul * (extra.tal?.[a] || 1);
  s.hp = hpOf(L); return s;
}
// curvas (dano fracionário: golpes NÃO arredondados, exceto na variante 'round')
const CURVES = {
  'mult k=8': (a, d) => d.hp * (1 + d.def / 8) / (1 + a.atk / 8),
  'adit k=10 none': (a, d) => d.hp / Math.max(0.5, 10 / 10 + (a.atk - d.def) / 10) / 1, // dano/golpe = 1+(ATK−DEF)/k, piso 0,5
  'adit k=10 round': (a, d) => Math.max(1, Math.round(d.hp / Math.max(0.5, 1 + (a.atk - d.def) / 10))),
};
const inter = (spd) => JANELA / (8 + spd);
const ttk = (cv, A, B) => CURVES[cv](A, B) * inter(A.spd);          // tempo de A derrubar B
const gap = (cv, P, D) => ttk(cv, D, P) / ttk(cv, P, D) - 1;        // + = P vence; empate (0) é válido
function evalCfg(cv, X) {
  let wg = 0, wgc = '', minPt = 9, minPtc = '', minLv = 9, maxDef = 0;
  for (const L of LEVELS) {
    const D = stats('DIST', L, X);
    for (const b of ['ATK', 'DEF', 'SPD']) { const g = gap(cv, stats(b, L, X), D); if (Math.abs(g) > Math.abs(wg)) { wg = g; wgc = `L${L}/${b}`; } }
    // +1 ponto: pior atributo no espelho DIST (ΔTTK absoluto da luta)
    for (const a of ['atk', 'def', 'spd']) { const D1 = stats('DIST', L, X, { flat: { [a]: 1 } }); const v = Math.abs(gap(cv, D1, D)); if (v < minPt) { minPt = v; minPtc = `L${L}/${a}`; } }
    if (L < 40 && stageOf(L + 1) === stageOf(L)) { const v = Math.abs(gap(cv, stats('DIST', L + 1, X), D)); if (v < minLv) minLv = v; }
    const Dd = stats('DEF', L, X); maxDef = Math.max(maxDef, ttk(cv, Dd, Dd));
  }
  return { wg, wgc, minPt, minPtc, minLv, maxDef, ok: Math.abs(wg) <= 0.10 && minPt >= 0.02 && minLv >= 0.02 && maxDef <= 40 };
}
console.log('## Varredura curva × X (limite de concentração). Metas: |gap|≤10%, +1 ponto ≥2%, +1 level ≥2%, DEF espelho ≤40 s');
console.log('curva | X | pior gap (célula) | +1 ponto mín (célula) | +1 level mín | DEF×DEF máx s | veredito');
const Xs = RED ? [1.0] : [0.4, 0.5, 0.6, 1.0];
const pass = [];
for (const cv of Object.keys(CURVES)) for (const X of Xs) { const r = evalCfg(cv, X); if (r.ok) pass.push([cv, X]);
  console.log(`${cv} | ${X * 100}% | ${pc(r.wg)} (${r.wgc}) | ${pc(r.minPt)} (${r.minPtc}) | ${pc(r.minLv)} | ${f1(r.maxDef)} | ${r.ok ? 'PASS' : 'FAIL'}`); }
console.log('Fecham: ' + (pass.length ? pass.map((p) => p[0] + ' X=' + p[1] * 100 + '%').join('; ') : 'NENHUMA'));
// detalhe puro-limitado × DIST no mesmo level (mult k=8, X=50%)
console.log('\n## Detalhe mult k=8 X=50%: level | DIST a/d/s/hp | gap ATK | DEF | SPD | DEF×DEF s');
for (const L of LEVELS) { const D = stats('DIST', L, 0.5), r = ['ATK', 'DEF', 'SPD'].map((b) => pc(gap('mult k=8', stats(b, L, 0.5), D))); const Dd = stats('DEF', L, 0.5);
  console.log(`L${L} | ${[D.atk, D.def, D.spd, D.hp].map(f1).join('/')} | ${r.join(' | ')} | ${f1(ttk('mult k=8', Dd, Dd))}`); }
console.log('\n## Talento +5% e equipamento (+N planos em ATK) sobre DIST vs DIST puro, mult k=8 / adit none — pior |gap| em L5..40');
for (const cv of ['mult k=8', 'adit k=10 none']) for (const [nm, ex] of [['talento +5% ATK', { tal: { atk: 1.05 } }], ['talento +5% SPD', { tal: { spd: 1.05 } }], ['equip +1', { flat: { atk: 1 } }], ['equip +2', { flat: { atk: 2 } }], ['equip +4', { flat: { atk: 4 } }], ['equip +2 em DEF', { flat: { def: 2 } }]]) {
  let w = 0, wc = '', mn = 9; for (const L of LEVELS) { const D = stats('DIST', L, 0.5), g = gap(cv, stats('DIST', L, 0.5, ex), D); if (Math.abs(g) > Math.abs(w)) { w = g; wc = 'L' + L; } mn = Math.min(mn, Math.abs(g)); }
  console.log(`${cv} | ${nm} | máx ${pc(w)} (${wc}) | mín ${pc(mn)}`); }
