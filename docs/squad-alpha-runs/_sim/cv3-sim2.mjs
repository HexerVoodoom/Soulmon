// cv3-sim2.mjs — spike L1 Fase 1 (regras novas do dono, contexto §2.3). Determinístico. Uso: node cv3-sim2.mjs [--red] [--fast]
const RED = process.argv.includes('--red');
const RN = process.argv.includes('--noise-regua') ? 0.25 : 0; // variante: régua medida com camadas ±25% ligadas
// ---------- SUPOSIÇÕES ROTULADAS ----------
const JANELA = 22.5, BASE_RITMO = 8;          // S1 herdada: SPD1 = 2.5 s/ataque
const PISO = 3;                                // F2/Q3 dono
const EVO_DAYS = [7, 21, 45];                  // S3 SUPOSIÇÃO: dias de evolução (regra real no código)
const E = 3;                                   // S4 orçamento em golpes
const EN_MIN = 20, EN_MAX = 30, EN_FULL = 100; // S5 energia como antes (+U[20,30] por golpe próprio)
const N = 1000, NCAL = 300;                    // seeds
const DAYS = [0, 7, 21, 45, 60], BUILDS = { ATK: ['atk'], DEF: ['def'], SPD: ['spd'], DIST: ['atk', 'spd', 'def'] };
const ROOKIE = { atk: 1, def: 1, spd: 1, hp: 10 };
const DOT_TICKS = 3, DOT_GAP = 0.25;           // S7 DoT: 3 ticks a cada 0.25 intervalo próprio (curtos); resto expira
const BUFF_FRAC = 0.25; const BUFF_F = 0.25; // Passe1 S8': buff ATK = meus golpes básicos x1/(1-f); debuff DEF = todo dano recebido pelo alvo x1/(1-f); f=0.25
const EHIT = process.argv.includes('--energy-hit'); // Passe1 (c) VARIANTE: +U[10,15] energia ao receber golpe                        // S8 buff ATK/debuff DEF: X = ceil(25% de (hp+def-atk) do alvo); buff SPD: X = 8+spd (ritmo x2)

const golpes = (a, d, atkB = 0, defM = 0, elem = 0) => Math.max(PISO, d.hp + d.def - defM - a.atk - atkB - elem);
const intervalo = (spd) => JANELA / (BASE_RITMO + spd);
const evo = (s) => ({ atk: Math.ceil(s.atk * 1.5), def: Math.ceil(s.def * 1.5), spd: Math.ceil(s.spd * 1.5), hp: Math.ceil(s.hp * 1.5) });
function grow(build, day) { let s = { ...ROOKIE }, n = 0; for (let d = 1; d <= day; d++) { if (d % 4 === 0) s.hp++; else { s[BUILDS[build][n % BUILDS[build].length]]++; n++; } if (EVO_DAYS.includes(d)) s = evo(s); } return s; }
function rng(seed) { let s = (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ 0xdeadbeef) >>> 0 || 1; const nx = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; for (let i = 0; i < 16; i++) nx(); return nx; }
const EPS = 1e-9;

// ---------- luta simétrica; cada lado pode ter especial ----------
function fight(SA, SB, spA, spB, seed, o = {}) {
  const r = o.det ? () => 0.5 : rng(seed), noise = o.noise || 0; const EH = o.eh ?? EHIT;
  const mk = (s, sp) => ({ s, sp, hp: 1, en: 0, outMul: 1, inMul: 1, tDie: Infinity, atkB: 0, spdB: 0, defM: 0, shield: 0, next: 0, casts: 0, hits: 0 });
  const F = [mk(SA, spA), mk(SB, spB)];
  F[0].next = intervalo(SA.spd) * r(); F[1].next = intervalo(SB.spd) * r();
  const timed = [];
  const dmgTo = (v, amt) => { if (v.shield > EPS) { const ab = Math.min(v.shield, amt); v.shield -= ab; amt -= ab; } v.hp -= amt * v.inMul; };
  const mul = () => (noise ? 1 + noise * (2 * r() - 1) : 1);
  let t = 0;
  for (let g = 0; g < 1e5; g++) {
    let tt = Infinity; for (const e of timed) if (e.t < tt) tt = e.t;
    t = Math.min(F[0].next, F[1].next, tt);
    for (let i = timed.length - 1; i >= 0; i--) if (timed[i].t - t < EPS) { const e = timed.splice(i, 1)[0]; e.fn(); }
    const act = [0, 1].filter((i) => F[i].next - t < EPS);
    for (const i of act) {
      const me = F[i], foe = F[1 - i];
      dmgTo(foe, me.outMul * mul() / golpes(me.s, foe.s, me.atkB, foe.defM, i === 0 ? (o.elemA || 0) : -(o.elemA || 0)));
      me.hits++;
      if (EH && foe.sp) { foe.en += 10 + r() * 5; if (foe.en >= EN_FULL) { foe.en -= EN_FULL; foe.casts++; cast(foe, me, t); } }
      me.next = t + intervalo(me.s.spd + me.spdB);
      if (me.sp) { me.en += EN_MIN + r() * (EN_MAX - EN_MIN); if (me.en >= EN_FULL) { me.en -= EN_FULL; me.casts++; cast(me, foe, t); } }
    }
    if (o.full) { for (const f of F) if (f.hp <= EPS && f.tDie === Infinity) f.tDie = t; if (F[0].tDie < Infinity && F[1].tDie < Infinity) return { tDieA: F[0].tDie, tDieB: F[1].tDie, castA: F[0].casts }; continue; }
    const d0 = F[0].hp <= EPS, d1 = F[1].hp <= EPS;
    if (d0 || d1) {
      let w = d1 && !d0 ? 0 : d0 && !d1 ? 1 : (Math.abs(F[0].hp - F[1].hp) > EPS ? (F[0].hp > F[1].hp ? 0 : 1) : (r() < 0.5 ? 0 : 1));
      return { w, t, hpW: Math.max(0, F[w].hp), castA: F[0].casts, hitsW: F[w].hits, tie: d0 && d1 };
    }
  }
  throw new Error('loop');
  function cast(me, foe, t0) {
    const sp = me.sp, p = sp.p, iv = intervalo(me.s.spd);
    const gFoe = golpes(me.s, foe.s, me.atkB, foe.defM), gMe = golpes(foe.s, me.s, foe.atkB, me.defM);
    const X = Math.ceil(BUFF_FRAC * Math.max(1, foe.s.hp + foe.s.def - me.s.atk));
    switch (sp.fam) {
      case 'direto': dmgTo(foe, (p * E * mul()) / gFoe); break;
      case 'dot': for (let k = 1; k <= DOT_TICKS; k++) timed.push({ t: t0 + DOT_GAP * iv * k, fn: () => { if (foe.hp > EPS && me.hp > EPS) dmgTo(foe, (p * E / DOT_TICKS) * mul() / golpes(me.s, foe.s, me.atkB, foe.defM)); } }); break;
      case 'cura': me.hp += Math.min(1 - me.hp, (p * E * mul()) / gMe); break;
      case 'escudo': me.shield += (p * E * mul()) / gMe; break;
      case 'buffAtk': me.outMul /= 1 - BUFF_F; timed.push({ t: t0 + p * iv, fn: () => { me.outMul *= 1 - BUFF_F; } }); break;
      case 'direto2': dmgTo(foe, (p / 2 * E * mul()) / gFoe); timed.push({ t: t0 + 0.5 * iv, fn: () => { if (foe.hp > EPS) dmgTo(foe, (p / 2 * E * mul()) / golpes(me.s, foe.s, me.atkB, foe.defM)); } }); break;
      case 'debuffDef': foe.inMul /= 1 - BUFF_F; timed.push({ t: t0 + p * iv, fn: () => { foe.inMul *= 1 - BUFF_F; } }); break;
      case 'buffSpd': { const xs = BASE_RITMO + me.s.spd; me.spdB += xs; me.next = t0 + intervalo(me.s.spd + me.spdB); timed.push({ t: t0 + p * iv, fn: () => { me.spdB -= xs; } }); break; }
    }
  }
}

const out = []; const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };
const f1 = (x) => x.toFixed(1), f2 = (x) => x.toFixed(2);
const CELLS = []; for (const d of DAYS) for (const b of Object.keys(BUILDS)) CELLS.push({ d, b, s: grow(b, d) });
const REF = { fam: 'direto', p: 1 };

function cell(c, sp, n, o = {}) {
  let wA = 0, fired = 0, tW = 0, nW = 0, hpW = 0, ties = 0;
  for (let s = 1; s <= n; s++) {
    const m = fight(c.s, c.s, sp, REF, s * 7919 + c.d * 31 + c.b.length, o);
    if (m.castA > 0) fired++;
    if (m.tie) ties++;
    if (m.w === 0) { wA++; tW += m.t; nW++; hpW += m.hpW; }
  }
  return { wr: wA / n, fired: fired / n, tWin: nW ? tW / nW : NaN, hpWin: nW ? hpW / nW : NaN, ties: ties / n };
}
// objetivo de calibração: pior |wr-0.5| nas células medidas
function score(sp, n) { let worst = 0, sum = 0, k = 0; for (const c of CELLS) { const r = cell(c, sp, n, { noise: RN }); if (r.fired >= 0.9) { const d = Math.abs(r.wr - 0.5); worst = Math.max(worst, d); sum += d; k++; } } return worst + sum / Math.max(1, k); }
function calibrate(fam, lo, hi) {
  // busca em grade + refino (objetivo não é suave por seeds discretas)
  let best = { p: lo, sc: 9 };
  for (let it = 0; it < 3; it++) {
    const step = (hi - lo) / 12;
    for (let p = lo; p <= hi + EPS; p += step) { const sc = score({ fam, p }, NCAL); if (sc < best.sc) best = { p, sc }; }
    lo = Math.max(0, best.p - step); hi = best.p + step;
  }
  return Math.round(best.p * 100) / 100;
}

// ===== 0. sanidade =====
log('## 0. Sanidade das regras');
log(`golpes base espelho 1/1/1/10 = ${golpes(ROOKIE, ROOKIE)} (10) | ATK13 vs base = ${golpes({ ...ROOKIE, atk: 13 }, ROOKIE)} (piso 3) | vantagem elemental +1: ${golpes(ROOKIE, ROOKIE, 0, 0, 1)} / -1: ${golpes(ROOKIE, ROOKIE, 0, 0, -1)}`);
log('Crescimento (dia 4,8,... -> HP; evo x1.5 ceil nos dias ' + EVO_DAYS.join(',') + ' = SUPOSIÇÃO):');
for (const c of CELLS) log(`  d${String(c.d).padStart(2)} ${c.b.padEnd(4)} atk/def/spd/hp = ${c.s.atk}/${c.s.def}/${c.s.spd}/${c.s.hp}  golpes espelho = ${golpes(c.s, c.s)}  ataques/janela = ${BASE_RITMO + c.s.spd}  luta espelho ~${f1(golpes(c.s, c.s) * intervalo(c.s.spd))}s`);
{ let a = 0; for (let s = 1; s <= N; s++) if (fight(ROOKIE, ROOKIE, null, null, s, { elemA: 1 }).w === 0) a++; log(`vantagem elemental ±1 no espelho base (sem especial): A com vantagem vence ${f1(100 * a / N)}%`); }

// ===== 1. calibração =====
const FAMS = { dot: [0.1, 4], cura: [0.1, 5], escudo: [0.1, 5], buffAtk: [0.1, 40], buffSpd: [0.05, 15], debuffDef: [0.1, 40] };
log('\n## 1. Calibração (grade+refino, ' + NCAL + ' seeds, objetivo = pior |wr-50%| nas células medidas)');
const PARAMS = {};
for (const [f, [lo, hi]] of Object.entries(FAMS)) { PARAMS[f] = calibrate(f, lo, hi); log(`  ${f}: p = ${PARAMS[f]}`); }
if (RED) { PARAMS.cura = Math.round(PARAMS.cura * 3 * 100) / 100; log(`  [--red] cura descalibrada: p x3 -> ${PARAMS.cura}`); }

// ===== 2. verificação =====
log(`\n## 2. Verificação N=${N} seeds/célula — A (família X) vs B (direto), espelho de build`);
log('família | dia | build | win% A | Δpp | disparou% | empate-tick% | t vitória A (s) | HP final vencedor A | veredito');
const fam = {}; let pass = true;
for (const f of Object.keys(FAMS)) {
  fam[f] = { worst: 0, worstCell: '', nm: [], tW: [], hp: [] };
  for (const c of CELLS) {
    const r = cell(c, { fam: f, p: PARAMS[f] }, N, { noise: RN });
    const dpp = 100 * (r.wr - 0.5);
    let v;
    if (r.fired < 0.9) { v = 'NÃO MEDIDO (V1)'; fam[f].nm.push(`d${c.d}/${c.b}(${f1(100 * r.fired)}%)`); }
    else { v = Math.abs(dpp) <= 5 ? 'PASS' : 'FAIL'; if (Math.abs(dpp) > Math.abs(fam[f].worst)) { fam[f].worst = dpp; fam[f].worstCell = `d${c.d}/${c.b}`; } fam[f].tW.push(r.tWin); fam[f].hp.push(r.hpWin); }
    if (v === 'FAIL') pass = false;
    log(`${f} | ${c.d} | ${c.b} | ${f1(100 * r.wr)} | ${dpp >= 0 ? '+' : ''}${f1(dpp)} | ${f1(100 * r.fired)} | ${f1(100 * r.ties)} | ${f1(r.tWin)} | ${f2(r.hpWin)} | ${v}`);
  }
}
// referência direto x direto (controle de ruído do método)
{ let worst = 0; for (const c of CELLS) { const r = cell(c, REF, N, { noise: RN }); if (r.fired >= 0.9) worst = Math.max(worst, Math.abs(100 * (r.wr - 0.5))); } log(`controle direto vs direto: pior |Δ| = ${f1(worst)}pp (ruído do método com N=${N})`); }

log('\n## 3. Resumo por família (pior caso entre células medidas)');
log('família | p calibrado | pior Δpp (célula) | NÃO MEDIDO | t vitória médio s | HP final médio | veredito');
for (const f of Object.keys(FAMS)) {
  const x = fam[f], mean = (a) => a.reduce((s, v) => s + v, 0) / a.length;
  const ok = Math.abs(x.worst) <= 5;
  if (!ok) log(`REPROVA: família=${f} pior Δ=${f1(x.worst)}pp em ${x.worstCell}`);
  log(`${f} | ${PARAMS[f]} | ${x.worst >= 0 ? '+' : ''}${f1(x.worst)} (${x.worstCell}) | ${x.nm.length ? x.nm.join(' ') : '-'} | ${f1(mean(x.tW))} | ${f2(mean(x.hp))} | ${ok ? 'PASS' : 'FAIL'}`);
}

// ===== 4. dominância =====
log('\n## 4. Dominância: build puro vs DIST do mesmo dia (ambos com dano direto), N=' + N);
log('dia | ATK vs DIST | DEF vs DIST | SPD vs DIST | spread pp (inclui DIST=50) | golpes min no dia | menor nº de golpes do vencedor');
let domOk = true, maxSpread = 0, atkDom = [];
for (const d of DAYS) {
  const D = grow('DIST', d); const row = []; let mn = Infinity, minHits = Infinity;
  for (const b of ['ATK', 'DEF', 'SPD']) {
    const P = grow(b, d); let w = 0;
    for (let s = 1; s <= N; s++) { const m = fight(P, D, REF, REF, s * 13 + d, { noise: RN }); if (m.w === 0) w++; minHits = Math.min(minHits, m.hitsW); }
    row.push(100 * w / N); mn = Math.min(mn, golpes(P, D), golpes(D, P));
  }
  const all = [...row, 50], spread = Math.max(...all) - Math.min(...all);
  maxSpread = Math.max(maxSpread, spread); if (spread > 20) domOk = false; atkDom.push(`d${d}:${f1(row[0])}%`);
  log(`${d} | ${f1(row[0])}% | ${f1(row[1])}% | ${f1(row[2])}% | ${f1(spread)}${spread > 20 ? ' FAIL' : ''} | ${mn} | ${minHits}`);
}
log(`ATK puro vs DIST por dia: ${atkDom.join(' ')}`);

// ===== 5. camadas fora da régua: ruído ±25% =====
log('\n## 5. Variante informativa: ruído multiplicativo ±25% em todo dano/cura/escudo (anel/esquiva/torcida)');
log('família | pior Δpp sem ruído | pior Δpp com ruído | inverte sinal médio?');
for (const f of Object.keys(FAMS)) {
  let worstN = 0, sumA = 0, sumB = 0;
  for (const c of CELLS) { const a = cell(c, { fam: f, p: PARAMS[f] }, N, { noise: 0.25 }); const b0 = cell(c, { fam: f, p: PARAMS[f] }, NCAL); if (a.fired >= 0.9) { if (Math.abs(a.wr - 0.5) > Math.abs(worstN)) worstN = a.wr - 0.5; sumA += a.wr - 0.5; sumB += b0.wr - 0.5; } }
  log(`${f} | ${f1(fam[f].worst)} | ${f1(100 * worstN)} | ${Math.sign(sumA) !== Math.sign(sumB) && Math.abs(sumA) > 0.05 ? 'SIM' : 'não'} (Σ ${f2(sumB)} -> ${f2(sumA)})`);
}

log('\n## P1-d Régua alternativa INFORMATIVA: ΔTTK determinístico no espelho (fase=0.5, energia=25/golpe; quem cai continua atacando como fantasma até o outro cair = TTK de cada lado contra o kit inteiro do outro)');
log('Δ = t(A cai)/t(B cai) − 1 (positivo = família X sobrevive mais que o direto); PASS se |Δ| ≤ 5%');
log('família | p | pior Δ (célula) | células PASS/medidas');
for (const f of ['direto', 'direto2', ...Object.keys(FAMS)]) { const p = PARAMS[f] ?? 1; let worst = 0, wc = '', ok = 0, k = 0; for (const c of CELLS) { const m = fight(c.s, c.s, { fam: f, p }, REF, 1, { det: true, full: true }); if (m.castA === 0) continue; k++; const d = m.tDieA / m.tDieB - 1; if (Math.abs(d) <= 0.05) ok++; if (Math.abs(d) > Math.abs(worst)) { worst = d; wc = `d${c.d}/${c.b}`; } } log(`${f} | ${p} | ${(100 * worst).toFixed(1)}% (${wc}) | ${ok}/${k}`); }
log('\n## P1-e Controle: "direto2" (2 golpes de p/2, 0.5 intervalo de distância) vs direto na régua win-rate oficial, N=' + N);
{ let worst = 0, wc = '', nm = 0; for (const c of CELLS) { const r = cell(c, { fam: 'direto2', p: 1 }, N, { noise: RN }); if (r.fired < 0.9) { nm++; continue; } if (Math.abs(r.wr - 0.5) > Math.abs(worst)) { worst = r.wr - 0.5; wc = `d${c.d}/${c.b}`; } log(`  d${c.d}/${c.b}: ${f1(100 * r.wr)}%`); } log(`direto2: pior Δ=${f1(100 * worst)}pp em ${wc}; NÃO MEDIDO=${nm} -> ${Math.abs(worst) <= 0.05 ? 'PASS' : 'REPROVA: família=direto2 (mesmo orçamento E) => régua é degrau por construção'}`); }
log('\n## P1-f Gap de TTK (regras do dono, sem especial): TTK(eu derrubo DIST)=golpes×intervalo; gap = TTK(DIST me derruba)/TTK(eu derrubo DIST) − 1 (positivo = build puro vence)');
log('dia | ATK | DEF | SPD');
for (const d of DAYS) { const D = grow('DIST', d); const g = (P) => { const mine = golpes(P, D) * intervalo(P.spd), his = golpes(D, P) * intervalo(D.spd); return `${((his / mine - 1) * 100).toFixed(1)}% (${mine.toFixed(1)}s vs ${his.toFixed(1)}s)`; }; log(`${d} | ${g(grow('ATK', d))} | ${g(grow('DEF', d))} | ${g(grow('SPD', d))}`); }

const famsOk = Object.values(fam).every((x) => Math.abs(x.worst) <= 5);
const anyNM = Object.values(fam).some((x) => x.nm.length);
log(`\n## PREMISSA ("todas as 6 famílias passam ±5pp em todos os níveis e nenhum build domina >20pp"): ${famsOk && domOk && !anyNM ? 'SIM' : 'NÃO'}`);
log(`  famílias ±5pp nas células medidas: ${famsOk ? 'SIM' : 'NÃO'} | células NÃO MEDIDO: ${anyNM ? 'SIM' : 'nenhuma'} | dominância ≤20pp: ${domOk ? 'SIM' : 'NÃO'} (spread máx ${f1(maxSpread)}pp)`);
process.exitCode = famsOk && domOk ? 0 : 1;

// ===== 6. prova de vermelho com baseline verde + forma da curva =====
if (process.argv.includes('--extra')) {
  log('\n## 6. Prova de vermelho: família "direto" vs referência direto (baseline verde), depois descalibrada p=1.3');
  for (const p of [1, 1.3]) { let worst = 0, wc = ''; for (const c of CELLS) { const r = cell(c, { fam: 'direto', p }, N); if (r.fired >= 0.9 && Math.abs(r.wr - 0.5) > Math.abs(worst)) { worst = r.wr - 0.5; wc = `d${c.d}/${c.b}`; } } log(`direto(p=${p}): pior Δ=${f1(100 * worst)}pp em ${wc} -> ${Math.abs(worst) <= 0.05 ? 'PASS' : 'REPROVA: família=direto(p=' + p + ')'}`); }
  log('\n## 7. Forma da curva win%(p) numa célula (d21/DIST, sem ruído e com ±25%) — calibração por célula é possível?');
  const c = CELLS.find((x) => x.d === 21 && x.b === 'DIST');
  for (const f of ['dot', 'cura', 'buffSpd']) { const row = []; const ps = f === 'buffSpd' ? [0.5, 1, 1.5, 2, 3, 4, 6] : [0.6, 0.8, 0.9, 1, 1.1, 1.2, 1.5]; for (const p of ps) row.push(`p${p}:${f1(100 * cell(c, { fam: f, p }, NCAL).wr)}/${f1(100 * cell(c, { fam: f, p }, NCAL, { noise: 0.25 }).wr)}`); log(`${f}: ${row.join(' ')}`); }
}
