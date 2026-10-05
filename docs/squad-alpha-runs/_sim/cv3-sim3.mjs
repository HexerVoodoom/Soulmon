// cv3-sim3.mjs — Fase 1 AJUSTAR (contexto §2.4 / PLANO §10). Determinístico. Uso: node cv3-sim3.mjs [--red]
const RED = process.argv.includes('--red');
const out = []; const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };
const f1 = (x) => x.toFixed(1), f2 = (x) => x.toFixed(2), pc = (x) => (x >= 0 ? '+' : '') + (100 * x).toFixed(1) + '%';
const EPS = 1e-9;

// ---------- SUPOSIÇÕES ROTULADAS ----------
let JANELA = 22.5; let ROUND = 'ceil';                        // S1: SPD1 = 9 ataques/janela = 2,5 s
const EVO_AT = [4, 9, 14, 59];              // S3': do CÓDIGO (progression.ts FORM_REQUIREMENTS 4/5/5 + ULTRA_PATIENCE_DAYS 45): evolui no 4º, 9º, 14º e 59º dia que conta
const DAYS = [0, 7, 21, 45, 60];
const BUILDS = { ATK: ['atk'], DEF: ['def'], SPD: ['spd'], DIST: ['atk', 'spd', 'def'] };
const ROOKIE = { atk: 1, def: 1, spd: 1, hp: 10 };
const E = 3;                                // orçamento do especial em golpes
const BUFF_F = 0.25; const DUR = 4; // buffs: duração FIXA de 4 intervalos próprios; o parâmetro calibrado é a MAGNITUDE                        // buff ATK / debuff DEF: ×1/(1−f) (invariante ao build)
// energia (calibrada abaixo): por fração de HP causada, por fração de HP recebida, por segundo
const EN = { dealt: 60, recv: 60, perSec: 2 };

// ---------- curva ----------
let K = 8, SPDMODE = 'lin';
const golpesK = (a, d, k) => { const x = d.hp * (1 + d.def / k) / (1 + a.atk / k); return ROUND === 'none' ? Math.max(1e-6, x) : Math.max(1, ROUND === 'round' ? Math.round(x) : Math.ceil(x - 1e-9)); };
const golpes = (a, d) => golpesK(a, d, K);
const ritmoOf = (spd, k, mode) => (mode === 'lin' ? 8 + spd : 9 * (1 + spd / k) / (1 + 1 / k)); // ataques por janela; ambos = 9 no SPD1
const intervalo = (spd) => JANELA / ritmoOf(spd, K, SPDMODE);
const evo = (s) => ({ atk: Math.ceil(s.atk * 1.5), def: Math.ceil(s.def * 1.5), spd: Math.ceil(s.spd * 1.5), hp: Math.ceil(s.hp * 1.5) });
function grow(build, day) { let s = { ...ROOKIE }, n = 0; for (let d = 1; d <= day; d++) { if (d % 4 === 0) s.hp++; else { s[BUILDS[build][n % BUILDS[build].length]]++; n++; } if (EVO_AT.includes(d)) s = evo(s); } return s; }

if (process.argv.includes('--stage')) { const v = process.argv.find((x) => x.startsWith('--var=')); stageRun(v ? v.slice(6) : 'A'); process.exit(0); }
if (process.argv.includes('--final')) { finalRun(); process.exit(0); }
if (process.argv.includes('--p1')) { passe1(); process.exit(0); }
// ================= 1. curva =================
log('## 1. Curva golpes = ceil(HP×(1+DEF/k)÷(1+ATK/k)) — exemplos do dono no d0 por k');
log('k | base(10) | ATK2(9) | DEF2(11) | exemplos OK');
const kOk = [];
for (let k = 2; k <= 20; k++) { const b = golpesK(ROOKIE, ROOKIE, k), a = golpesK({ ...ROOKIE, atk: 2 }, ROOKIE, k), d = golpesK(ROOKIE, { ...ROOKIE, def: 2 }, k); const n = (b === 10) + (a === 9) + (d === 11); kOk.push(n); log(`${k} | ${b} | ${a} | ${d} | ${n}/3`); }
log('=> ATK2→9 exige k≤8 ((k+1)/(k+2)≤0,9); DEF2→11 exige k≥9 ((k+2)/(k+1)≤1,1). Nenhum k satisfaz os 3 ao mesmo tempo.');

function gaps(k, mode) {
  const sK = K, sM = SPDMODE; K = k; SPDMODE = mode; let worst = 0, wc = '', rows = [];
  for (const d of DAYS) { const D = grow('DIST', d); const row = [];
    for (const b of ['ATK', 'DEF', 'SPD']) { const P = grow(b, d); const mine = golpes(P, D) * intervalo(P.spd), his = golpes(D, P) * intervalo(D.spd); const g = his / mine - 1; row.push({ g, mine, his }); if (Math.abs(g) > Math.abs(worst)) { worst = g; wc = `d${d}/${b}`; } }
    rows.push({ d, row, D }); }
  K = sK; SPDMODE = sM; return { worst, wc, rows };
}
log('\nVarredura k × modo SPD: pior gap de TTK (build puro vs DIST, dias ' + DAYS.join('/') + '; positivo = build puro vence)');
log('k | SPD linear 8+spd | SPD proporcional 9(1+s/k)/(1+1/k)');
let best = null;
for (const k of [2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,30,50,100,200,1000]) { const a = gaps(k, "lin"), b = gaps(k, "prop"); log(`${k} | ${pc(a.worst)} (${a.wc}) | ${pc(b.worst)} (${b.wc})`); for (const [m, r] of [['lin', a], ['prop', b]]) if (!best || Math.abs(r.worst) < Math.abs(best.r.worst)) best = { k, m, r }; }
const argK = process.argv.find((x) => x.startsWith('--k=')), argM = process.argv.find((x) => x.startsWith('--spd='));
if (argK) { const k = +argK.slice(4), m = argM ? argM.slice(6) : 'prop'; best = { k, m, r: gaps(k, m) }; log(`[forçado por argumento] k=${k} SPD=${m}`); }
K = best.k; SPDMODE = best.m;
log(`ESCOLHA: k=${K}, SPD=${SPDMODE} — pior gap ${pc(best.r.worst)} em ${best.r.wc} (meta ≤10%: ${Math.abs(best.r.worst) <= 0.1 ? 'PASS' : 'FAIL'}); exemplos do dono com este k: base ${golpes(ROOKIE, ROOKIE)}, ATK2 ${golpes({ ...ROOKIE, atk: 2 }, ROOKIE)}, DEF2 ${golpes(ROOKIE, { ...ROOKIE, def: 2 })}; valor de +1 ATK no espelho DIST d60: ${pc(golpes({ ...grow('DIST', 60), atk: grow('DIST', 60).atk + 1 }, grow('DIST', 60)) / golpes(grow('DIST', 60), grow('DIST', 60)) - 1)} golpes`);
log('dia | DIST a/d/s/hp | ATK gap (meu TTK s / dele s) | DEF gap | SPD gap | golpes espelho DIST');
for (const { d, row, D } of best.r.rows) log(`${d} | ${D.atk}/${D.def}/${D.spd}/${D.hp} | ${row.map((x) => `${pc(x.g)} (${f1(x.mine)}/${f1(x.his)})`).join(' | ')} | ${golpes(D, D)}`);
log('Duração do espelho por build/dia (s): ' + DAYS.map((d) => `d${d} ` + Object.keys(BUILDS).map((b) => { const s = grow(b, d); return `${b}:${f1(golpes(s, s) * intervalo(s.spd))}`; }).join(',')).join(' | '));

// ================= 2. luta determinística (ghost) =================
// TTK de cada lado contra o kit INTEIRO do outro: quem cai continua batendo (só básico, sem especial/cura) até o outro cair.
// Cura/escudo entram como TTK do adversário estendido (A cai mais tarde) — declarado.
function fight(SA, SB, spA, spB, o = {}) {
  const mk = (s, sp, ph) => ({ s, sp, hp: 1, en: 0, outMul: 1, inMul: 1, spdMul: 1, shield: 0, next: intervalo(s.spd) * ph, casts: 0, tDie: Infinity });
  const F = [mk(SA, spA, o.phA ?? 0.5), mk(SB, spB, o.phB ?? 0.5)];
  const timed = []; let t = 0, tPrev = 0;
  const hit = (src, v, frac) => { if (v.tDie < Infinity) return; let amt = frac * v.inMul; if (v.shield > EPS) { const ab = Math.min(v.shield, amt); v.shield -= ab; amt -= ab; } v.hp -= amt; gain(src, frac * v.inMul, 'dealt'); gain(v, frac * v.inMul, 'recv'); };
  const gain = (f, x, kind) => { if (!f.sp || f.tDie < Infinity) return; f.en += EN[kind] * x; };
  const tryCast = (i, tt) => { const me = F[i]; if (me.sp && me.tDie === Infinity && me.en >= 100 - 1e-6) { me.en = Math.max(0, me.en - 100); me.casts++; cast(me, F[1 - i], tt); } };
  for (let g = 0; g < 2e5; g++) {
    let tt = Infinity; for (const e of timed) if (e.t < tt) tt = e.t;
    // energia por tempo: próximo instante em que alguém enche só pelo tempo
    let tEn = Infinity; for (const f of F) if (f.sp && f.tDie === Infinity && EN.perSec > 0) tEn = Math.min(tEn, t + Math.max(0, 100 - f.en) / EN.perSec);
    t = Math.min(F[0].next, F[1].next, tt, tEn);
    for (const f of F) if (f.sp && f.tDie === Infinity) f.en += EN.perSec * (t - tPrev); tPrev = t;
    for (let i = timed.length - 1; i >= 0; i--) if (timed[i].t - t < EPS) { const e = timed.splice(i, 1)[0]; e.fn(); }
    const act = [0, 1].filter((i) => F[i].next - t < EPS);
    for (const i of act) { const me = F[i], foe = F[1 - i];
      let mulN = 1; if (me.nAtk > EPS) { const u = Math.min(1, me.nAtk); mulN += u; me.nAtk -= u; } if (foe.nVuln > EPS) { const u = Math.min(1, foe.nVuln); mulN += u; foe.nVuln -= u; }
      hit(me, foe, mulN * me.outMul / golpes(me.s, foe.s));
      if (me.nSpd > EPS) { const u = Math.min(1, me.nSpd); me.nSpd -= u; me.next = t + intervalo(me.s.spd) / ((1 + u) * me.spdMul); } else me.next = t + intervalo(me.s.spd) / me.spdMul; }
    for (const f of F) if (f.hp <= EPS && f.tDie === Infinity) f.tDie = t;
    if (F[1].tDie < Infinity && F.hpAatB === undefined) F.hpAatB = Math.max(0, F[0].hp);
    tryCast(0, t); tryCast(1, t);
    for (const f of F) if (f.hp <= EPS && f.tDie === Infinity) f.tDie = t;
    for (const i of [0, 1]) if (F[i].tDie < Infinity && F[1 - i].tDie === Infinity && t > 10 * F[i].tDie + 60) F[1 - i].tDie = t; // imortal (cura > dano do fantasma): trunca em 10x
    if (F[0].tDie < Infinity && F[1].tDie < Infinity) return { tA: F[0].tDie, tB: F[1].tDie, castA: F[0].casts, castB: F[1].casts, hpA: F.hpAatB ?? 0 };
  }
  throw new Error("loop t=" + t + " " + JSON.stringify(F.map(f => ({hp:f.hp,en:f.en,next:f.next,tDie:f.tDie,sp:f.sp}))) + " timed=" + timed.length);
  function cast(me, foe, t0) {
    const p = me.sp.p, iv = intervalo(me.s.spd), gF = golpes(me.s, foe.s), gM = golpes(foe.s, me.s);
    switch (me.sp.fam) {
      case 'direto': hit(me, foe, p * E / gF); break;
      case 'direto2': hit(me, foe, p * E / 2 / gF); timed.push({ t: t0 + 0.5 * iv, fn: () => hit(me, foe, p * E / 2 / golpes(me.s, foe.s)) }); break;
      case 'dot': for (let k = 1; k <= 3; k++) timed.push({ t: t0 + 0.25 * iv * k, fn: () => hit(me, foe, p * E / 3 / golpes(me.s, foe.s)) }); break; // respeita DEF; resto expira se o alvo cair
      case 'cura': me.hp += Math.min(1 - me.hp, p * E / gM); break;
      case 'escudo': me.shield += p * E / gM; break;
      case 'buffAtk': me.outMul *= 1 + p; timed.push({ t: t0 + DUR * iv, fn: () => { me.outMul /= 1 + p; } }); break;
      case 'debuffDef': foe.inMul *= 1 + p; timed.push({ t: t0 + DUR * iv, fn: () => { foe.inMul /= 1 + p; } }); break;
      case 'buffAtkN': me.nAtk = (me.nAtk || 0) + p * E; break;
      case 'debuffDefN': foe.nVuln = (foe.nVuln || 0) + p * E; break;
      case 'buffSpdN': me.nSpd = (me.nSpd || 0) + p * E; me.next = Math.min(me.next, t0 + iv / 2); break;
      case 'buffSpd': me.spdMul *= 1 + p; me.next = Math.min(me.next, t0 + iv / (1 + p)); timed.push({ t: t0 + DUR * iv, fn: () => { me.spdMul /= 1 + p; } }); break;
    }
  }
}
const CELLS = []; for (const d of DAYS) for (const b of Object.keys(BUILDS)) CELLS.push({ d, b, s: grow(b, d) });
const REF = { fam: 'direto', p: 1 };

// ================= 3. energia: 1 especial garantido =================
log(`\n## 3. Energia: +${EN.dealt}×(fração de HP causada) +${EN.recv}×(fração recebida) +${EN.perSec}/s; especial a 100`);
{
  let minA = Infinity, worstCell = '', all = 0, fired = 0, tot = 0;
  const fams = ['direto', 'direto2', 'dot', 'cura', 'escudo', 'buffAtk', 'debuffDef', 'buffSpd'];
  for (const c of CELLS) for (const f of fams) for (let i = 0; i < 25; i++) for (let j = 0; j < 25; j++) {
    const m = fight(c.s, c.s, { fam: f, p: 1 }, REF, { phA: i / 25, phB: j / 25 }); tot++;
    const ok = m.castA >= 1 && m.castB >= 1; if (ok) fired++; else if (!worstCell) worstCell = `d${c.d}/${c.b}/${f}`;
    minA = Math.min(minA, Math.min(m.tA, m.tB));
  }
  log(`lutas (20 células × 8 famílias × 625 fases): ${tot}; especial disparou ≥1× nos DOIS lados em ${fired} (${f1(100 * fired / tot)}%) — ${fired === tot ? 'PASS V1' : 'REPROVA V1: primeira célula ' + worstCell}; luta mais curta ${f1(minA)}s`);
}

// ================= 4. régua ΔTTK =================
const delta = (c, sp) => { const m = fight(c.s, c.s, sp, REF); return { d: m.tA / m.tB - 1, fired: m.castA > 0 }; };
function worstOf(sp) { let w = 0, wc = ''; for (const c of CELLS) { const r = delta(c, sp); if (Math.abs(r.d) > Math.abs(w)) { w = r.d; wc = `d${c.d}/${c.b}`; } } return { w, wc }; }
function calib(fam, lo, hi) { let best = { p: lo, w: 9 }; for (let it = 0; it < 4; it++) { const st = (hi - lo) / 20; for (let p = lo; p <= hi + EPS; p += st) { const { w } = worstOf({ fam, p }); if (Math.abs(w) < best.w) best = { p, w: Math.abs(w) }; } lo = Math.max(0.01, best.p - st); hi = best.p + st; } return Math.round(best.p * 100) / 100; }
log('\n## 4. Régua oficial ΔTTK no espelho (determinística, fase 0,5 nos dois; empate é válido). Δ = t(A cai)/t(B cai) − 1; PASS se |Δ| ≤ 5%');
log('cura/escudo entram como TTK do adversário estendido (A cai mais tarde); buff/debuff/DoT encurtam t(B cai).');
const RANGES = { dot: [0.3, 3], cura: [0.2, 4], escudo: [0.2, 4], buffAtk: [0.05, 6], debuffDef: [0.05, 6], buffSpd: [0.05, 8] };
const P = { direto: 1, direto2: 1 };
for (const [f, [lo, hi]] of Object.entries(RANGES)) P[f] = calib(f, lo, hi);
if (RED) { P.dot = Math.round(P.dot * 1.5 * 100) / 100; log(`[--red] dot descalibrado ×1,5 -> p=${P.dot}`); }
log('família | parâmetro | p | pior Δ (célula) | PASS/20 | t médio p/ A derrubar B (s) | HP de A quando B cai (média) | veredito');
const verd = {};
for (const [f, p] of Object.entries(P)) {
  let w = 0, wc = '', ok = 0, tB = 0, hp = 0, nf = 0;
  for (const c of CELLS) { const m = fight(c.s, c.s, { fam: f, p }, REF); const d = m.tA / m.tB - 1; if (m.castA === 0) nf++; if (Math.abs(d) <= 0.05) ok++; if (Math.abs(d) > Math.abs(w)) { w = d; wc = `d${c.d}/${c.b}`; } tB += m.tB; hp += Math.max(0, m.hpA); }
  const pass = Math.abs(w) <= 0.05 && nf === 0; verd[f] = pass;
  const par = { direto: '× E', direto2: '× E (2 metades)', dot: '× E total, 3 ticks', cura: '× E golpes do inimigo', escudo: '× E golpes do inimigo', buffAtk: 'magnitude: meu dano ×(1+p) por 4 intervalos', debuffDef: 'magnitude: dano recebido pelo alvo ×(1+p) por 4 intervalos', buffSpd: 'magnitude: ritmo ×(1+p) por 4 intervalos' }[f];
  log(`${f} | ${par} | ${p} | ${pc(w)} (${wc || '-'}) | ${ok}/20 | ${f1(tB / 20)} | ${f2(hp / 20)} | ${pass ? 'PASS' : 'REPROVA: família=' + f}${nf ? ' (NÃO MEDIDO em ' + nf + ' células)' : ''}`);
}
log('Detalhe por célula (Δ%): família | ' + CELLS.map((c) => `d${c.d}${c.b[0]}`).join(' '));
for (const [f, p] of Object.entries(P)) log(`${f} | ` + CELLS.map((c) => (100 * delta(c, { fam: f, p }).d).toFixed(1)).join(' '));
// robustez: fases aleatórias (informativo)
log('\nInformativo: pior Δ médio sobre 100 pares de fase (não é a régua)');
for (const [f, p] of Object.entries(P)) { let w = 0; for (const c of CELLS) { let s = 0; for (let i = 0; i < 10; i++) for (let j = 0; j < 10; j++) { const m = fight(c.s, c.s, { fam: f, p }, REF, { phA: i / 10, phB: j / 10 }); s += m.tA / m.tB - 1; } s /= 100; if (Math.abs(s) > Math.abs(w)) w = s; } log(`  ${f}: ${pc(w)}`); }

// ================= 5. Glitchtama / invariante =================
log('\n## 5. Invariante "mesmo estágio = mesmo total de pontos ao evoluir" (Glitchtama dá ponto)');
const REQ = { rookie: 4, champion: 5, ultimate: 5, mega: 6 }, ORDER = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'], COST = 5;
const req = (st) => (st === 'mega' ? 45 : REQ[st]); // S: mega→ultra pela paciência de 45 (ULTRA_PATIENCE_DAYS); simplificação
function rngf(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
function simSave(seed, rule) {
  const r = rngf(seed * 2654435761); let st = 0, pd = 0, hp = 4, pts = 0, ledger = [], fails = [], removed = 0;
  // ledger: pontos do estágio atual (um por pd), para a regra "ponto acompanha pd"
  for (let day = 0; day < 400 && st < 4; day++) {
    const good = r() < 0.55, glitch = r() < 0.25, locked = r() < 0.05;
    const add = (n) => { for (let i = 0; i < n; i++) { if (rule === 'ingênua') pts++; else if (ledger.length < req(ORDER[st])) ledger.push(1); } };
    if (glitch) { pd++; add(1); }                    // specialItemUse: +1 perfectDays (1/dia)
    if (good) { pd++; add(1); } else { hp--; }       // virada: dia perfeito +1; dia ruim perde coração
    if (rule === 'acompanha') while (ledger.length > Math.min(pd, req(ORDER[st]))) { ledger.pop(); removed++; }
    if (!locked && pd >= req(ORDER[st])) {          // evolução: zera pd
      const total = rule === 'ingênua' ? pts : ledger.length;
      fails.push({ st: ORDER[st], total });
      st++; pd = 0; hp = 4; pts = 0; ledger = [];
    } else if (hp <= 0) {
      if (st > 0) { st--; pd = Math.max(Math.floor(REQ[ORDER[st]] / 2), pd - COST); hp = 4; // degeneração (dailyReset.degeneratedPerfectDays)
        if (rule === 'ingênua') pts = pts; else { ledger = new Array(Math.min(pd, req(ORDER[st]))).fill(1); removed++; } }
      else hp = 1;
    }
  }
  return { evos: fails, removed };
}
for (const rule of ['ingênua', 'acompanha']) {
  const byStage = {}; let removed = 0, saves = 0;
  for (let s = 1; s <= 5000; s++) { const { evos, removed: rm } = simSave(s, rule); removed += rm; saves++; for (const e of evos) (byStage[e.st] ||= new Set()).add(e.total); }
  const ok = Object.values(byStage).every((x) => x.size === 1);
  log(`regra "${rule}": totais distintos ao evoluir por estágio: ${Object.entries(byStage).map(([k, v]) => `${k}={${[...v].sort((a, b) => a - b).slice(0, 8).join(',')}${v.size > 8 ? ',…' : ''}}`).join(' ')} -> ${ok ? 'INVARIANTE OK' : 'QUEBRA'}; degenerações que retiraram ponto (5000 saves): ${removed}`);
}
log('regra "ingênua" = +1 ponto por dia que conta e por Glitchtama, nunca retirado. regra "acompanha" = pontos do estágio = min(perfectDays, required): concedido ao subir pd, retirado (LIFO) só quando pd cai (degeneração), recriado do pd ao degenerar.');
log('Dia ruim isolado NÃO muda pd (dailyReset.ts: "Dia não-perfeito NÃO tira perfectDays"), logo NÃO tira ponto; só a degeneração por HP zerado tira, e ela já tira perfectDays hoje (custo 5).');

const famsOk = Object.values(verd).every(Boolean), gapOk = Math.abs(best.r.worst) <= 0.1;
log(`\n## PREMISSA ("com curva proporcional + régua ΔTTK, as 7 famílias fecham ±5% e nenhum build puro passa de 10% de gap"): ${famsOk && gapOk ? 'SIM' : 'NÃO'}`);
log(`  famílias ±5%: ${famsOk ? 'SIM' : 'NÃO (' + Object.entries(verd).filter(([, v]) => !v).map(([k]) => k).join(', ') + ')'} | gap ≤10%: ${gapOk ? 'SIM' : 'NÃO'} (${pc(best.r.worst)} ${best.r.wc}, k=${K}, SPD ${SPDMODE})`);
process.exitCode = famsOk && gapOk ? 0 : 1;

// ======================= PASSE 1 (revisão do skeptic) — node cv3-sim3.mjs --p1 [--red] =======================
function passe1() {
  const ALLB = ['ATK', 'DEF', 'SPD', 'DIST'];
  const lvl = (d) => { const s = grow('DIST', d); return (s.atk + s.def + s.spd) / 3; };
  const kFor = (cfg, d) => (cfg.kmode === 'fix' ? cfg.k : cfg.c * lvl(d));
  const use = (cfg, d) => { ROUND = cfg.round; K = kFor(cfg, d); SPDMODE = cfg.spd; JANELA = 22.5; };
  const ttk = (a, b) => golpes(a, b) * intervalo(a.spd);
  const ex = (cfg) => { use(cfg, 0); return [golpes(ROOKIE, ROOKIE), golpes({ ...ROOKIE, atk: 2 }, ROOKIE), golpes(ROOKIE, { ...ROOKIE, def: 2 })]; };
  function evalCfg(cfg) {
    let gapPD = 0, gapPP = 0, wPD = '', wPP = '', distDom = 0, pureDom = 0, margMin = Infinity, wM = '';
    const margByDay = [];
    for (const d of DAYS) {
      use(cfg, d); const S = Object.fromEntries(ALLB.map((b) => [b, grow(b, d)]));
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) {
        const a = ALLB[i], b = ALLB[j]; const g = ttk(S[b], S[a]) / ttk(S[a], S[b]) - 1; // >0: a vence
        if (b === 'DIST') { const gd = -g; /* >0: DIST vence */ if (Math.abs(gd) > Math.abs(gapPD)) { gapPD = gd; wPD = `d${d} DIST×${a}`; } distDom = Math.max(distDom, gd); pureDom = Math.max(pureDom, -gd); }
        else { if (Math.abs(g) > Math.abs(gapPP)) { gapPP = g; wPP = `d${d} ${a}×${b}`; } pureDom = Math.max(pureDom, Math.abs(g)); }
      }
      const D = S.DIST, base = ttk(D, D);
      const m = { atk: 1 - ttk({ ...D, atk: D.atk + 1 }, D) / base, spd: 1 - ttk({ ...D, spd: D.spd + 1 }, D) / base, def: ttk(D, { ...D, def: D.def + 1 }) / base - 1, hp: ttk(D, { ...D, hp: D.hp + 1 }) / base - 1 };
      const mn = Math.min(...Object.values(m)); margByDay.push({ d, m });
      if (mn < margMin) { margMin = mn; wM = `d${d}/${Object.entries(m).find(([, v]) => v === mn)[0]}`; }
    }
    const e = ex(cfg);
    return { cfg, e, exOk: e[0] === 10 && e[1] === 9 && e[2] === 11, gapPD, wPD, gapPP, wPP, distDom, pureDom, margMin, wM, margByDay };
  }
  const name = (c) => `${c.round}/${c.kmode === 'fix' ? 'k=' + c.k : 'k=' + c.c + '×nível'}/SPD ${c.spd}`;

  log('## P1-a Arredondamento: faixa de k inteiro (2..40) que fecha os 3 exemplos do dono (base 10, ATK2 9, DEF2 11)');
  for (const round of ['ceil', 'round']) { const ok = []; for (let k = 2; k <= 40; k++) { const e = ex({ round, kmode: 'fix', k, spd: 'lin' }); if (e[0] === 10 && e[1] === 9 && e[2] === 11) ok.push(k); } log(`${round}: k ∈ {${ok.join(',') || 'nenhum'}}`); }

  log('\n## P1-b/c/d Varredura: k fixo 2..40 e k = c × nível (nível = média ATK/DEF/SPD do DIST do dia; no d0 nível=1, logo k=c), round/ceil, SPD lin/prop');
  log('critérios: exemplos 3/3 · gap puro×DIST ≤10% · gap puro×puro ≤10% · valor marginal mín ≥2% (+1 em ATK/SPD/DEF/HP do DIST, efeito no TTK do espelho)');
  const all = [];
  for (const round of ['ceil', 'round']) for (const spd of ['lin', 'prop']) {
    for (let k = 2; k <= 40; k++) all.push(evalCfg({ round, kmode: 'fix', k, spd }));
    for (const c of [0.5, 1, 1.5, 2, 3, 4, 5, 6, 7, 8, 10, 12, 15, 17, 20]) all.push(evalCfg({ round, kmode: 'stage', c, spd }));
  }
  const pass = (r) => r.exOk && Math.abs(r.gapPD) <= 0.1 && Math.abs(r.gapPP) <= 0.1 && r.margMin >= 0.02;
  const gapW = (r) => Math.max(Math.abs(r.gapPD), Math.abs(r.gapPP));
  const sc = (r) => gapW(r) + (r.exOk ? 0 : 1) + (r.margMin >= 0.02 ? 0 : 1);
  all.sort((a, b) => sc(a) - sc(b));
  log('config | exemplos | gap puro×DIST pior (+=DIST vence) | gap puro×puro pior | DIST domina máx | algum puro domina máx | marginal mín | veredito');
  for (const r of all.slice(0, 20)) log(`${name(r.cfg)} | ${r.e.join('/')} | ${pc(r.gapPD)} (${r.wPD}) | ${pc(r.gapPP)} (${r.wPP}) | ${pc(r.distDom)} | ${pc(r.pureDom)} | ${pc(r.margMin)} (${r.wM}) | ${pass(r) ? 'PASS' : 'FAIL'}`);
  log(`configs avaliadas: ${all.length}; PASS em todos os critérios: ${all.filter(pass).length}`);
  const a1 = all.filter((r) => r.exOk && r.margMin >= 0.02).sort((a, b) => gapW(a) - gapW(b));
  log(`melhor com exemplos 3/3 + marginal ≥2%: ${a1.length ? name(a1[0].cfg) + ' → gap puro×DIST ' + pc(a1[0].gapPD) + ' (' + a1[0].wPD + '), puro×puro ' + pc(a1[0].gapPP) + ' (' + a1[0].wPP + ')' : 'nenhuma'}`);
  const a2 = all.filter((r) => gapW(r) <= 0.1).sort((a, b) => b.margMin - a.margMin);
  log(`melhor com gap ≤10% (os dois): ${a2.length ? name(a2[0].cfg) + ' → exemplos ' + a2[0].e.join('/') + ', marginal mín ' + pc(a2[0].margMin) + ' (' + a2[0].wM + ')' : 'nenhuma'}`);
  const best = all[0];
  log(`\nESCOLHA (menor pior gap, penalizando exemplos e marginal): ${name(best.cfg)}. Valor marginal por dia (DIST):`);
  for (const { d, m } of best.margByDay) log(`  d${d}: +1 ATK ${pc(m.atk)} · +1 SPD ${pc(m.spd)} · +1 DEF ${pc(m.def)} · +1 HP ${pc(m.hp)}`);
  log('Matriz da ESCOLHA (linha vence coluna por x% = TTK do adversário / meu TTK − 1; ordem ATK DEF SPD DIST):');
  for (const d of DAYS) { use(best.cfg, d); const S = Object.fromEntries(ALLB.map((b) => [b, grow(b, d)])); log(`  d${d}: ` + ALLB.map((a) => a + '[' + ALLB.map((b) => pc(ttk(S[b], S[a]) / ttk(S[a], S[b]) - 1)).join(' ') + ']').join(' ')); }

  log('\n## P1-f Janela normalizada por dia: J tal que o espelho DIST dure 25 s (faixa PvE 20–29 s)');
  const Jday = {};
  for (const d of DAYS) { use(best.cfg, d); const D = grow('DIST', d); Jday[d] = 22.5 * 25 / ttk(D, D); JANELA = Jday[d]; log(`  d${d}: J=${f1(Jday[d])}s · espelhos ` + ALLB.map((b) => { const s = grow(b, d); return `${b} ${f1(ttk(s, s))}s`; }).join(', ')); }

  log('\n## P1-e Buffs em "E golpes equivalentes" (contagem, não tempo): buffAtkN = meus próximos p×E golpes valem ×2; debuffDefN = próximos p×E golpes que o alvo recebe valem ×2; buffSpdN = próximos p×E golpes meus em ritmo ×2. Régua ΔTTK com a ESCOLHA + janela normalizada.');
  const cellsP = []; for (const d of DAYS) for (const b of ALLB) cellsP.push({ d, b });
  const run = (c, sp) => { use(best.cfg, c.d); JANELA = Jday[c.d]; const s = grow(c.b, c.d); return fight(s, s, sp, { fam: 'direto', p: 1 }); };
  const worstP = (sp) => { let w = 0, wc = '', ok = 0, nf = 0; for (const c of cellsP) { const m = run(c, sp); const dd = m.tA / m.tB - 1; if (m.castA === 0) nf++; if (Math.abs(dd) <= 0.05) ok++; if (Math.abs(dd) > Math.abs(w)) { w = dd; wc = `d${c.d}/${c.b}`; } } return { w, wc, ok, nf }; };
  const calP = (fam, lo, hi) => { let b = { p: lo, w: 9 }; for (let it = 0; it < 4; it++) { const st = (hi - lo) / 20; for (let p = lo; p <= hi + EPS; p += st) { const { w } = worstP({ fam, p }); if (Math.abs(w) < b.w) b = { p, w: Math.abs(w) }; } lo = Math.max(0.01, b.p - st); hi = b.p + st; } return Math.round(b.p * 100) / 100; };
  const PP = { direto: 1, direto2: 1, dot: calP('dot', 0.3, 3), cura: calP('cura', 0.2, 4), escudo: calP('escudo', 0.2, 4), buffAtkN: calP('buffAtkN', 0.1, 3), debuffDefN: calP('debuffDefN', 0.1, 3), buffSpdN: calP('buffSpdN', 0.1, 6) };
  if (process.argv.includes('--red')) { PP.buffSpdN = Math.round(PP.buffSpdN * 1.5 * 100) / 100; log(`[--red] buffSpdN descalibrado ×1,5 -> ${PP.buffSpdN}`); }
  log('família | p | pior Δ (célula) | PASS/20 | NÃO MEDIDO | veredito'); const v = {};
  for (const [f, p] of Object.entries(PP)) { const r = worstP({ fam: f, p }); v[f] = Math.abs(r.w) <= 0.05 && r.nf === 0; log(`${f} | ${p} | ${pc(r.w)} (${r.wc || '-'}) | ${r.ok}/20 | ${r.nf} | ${v[f] ? 'PASS' : 'REPROVA: família=' + f}`); }

  log('\n## P1-g Glitchtama. Código: specialItemUse.ts › applySpecialItem → `perfectDays: prev.perfectDays + 1` (teto GLITCHTAMA_PER_DAY = 1).');
  log('Modelo realista: MAX_HP_BY_FORM 3/3/3/4/5 · −1 coração por dia não perfeito (MAX_HEARTS_LOST_PER_DAY=1) · 1 folga/semana (REST_DAYS_PER_WEEK) · +0,5 na segunda (WEEKLY_RELIEF_HEARTS) · queda = degeneratedPerfectDays (max(req/2, pd−5)) · ultra = pd ≥ 45 no mega (ULTRA_PATIENCE_DAYS) · Glitchtama em 30% dos dias · 365 dias × 3000 saves');
  const HPF = [3, 3, 3, 4, 5], REQ2 = [4, 5, 5, 45];
  for (const pGood of [0.6, 0.8, 0.95]) for (const rule of ['ingênua', 'acompanha']) {
    const tot = [new Set(), new Set(), new Set(), new Set()]; let degen = 0, days = 0, ultras = 0, rem = 0;
    for (let seed = 1; seed <= 3000; seed++) {
      const r = rngf(seed * 977 + Math.round(pGood * 100)); let st = 0, pd = 0, hp = 3, pts = 0, led = 0, rest = 1;
      for (let day = 0; day < 365; day++) {
        days++; if (day % 7 === 0) { rest = 1; if (hp > 0) hp = Math.min(HPF[st], hp + 0.5); }
        const good = r() < pGood, glitch = r() < 0.3;
        if (glitch) { pd++; pts++; if (led < REQ2[st]) led++; }
        if (good) { pd++; pts++; if (led < REQ2[st]) led++; } else if (rest > 0) rest--; else hp -= 1;
        if (pd >= REQ2[st]) { tot[st].add(rule === 'ingênua' ? pts : led); st++; if (st === 4) { ultras++; break; } pd = 0; pts = 0; led = 0; hp = HPF[st]; }
        else if (hp <= 0) { if (st > 0) { degen++; st--; pd = Math.max(Math.floor(REQ2[st] / 2), pd - 5); hp = HPF[st]; rem++; led = Math.min(pd, REQ2[st]); } else hp = 1; }
      }
    }
    const fmt = (x) => `{${[...x].sort((a, b) => a - b).slice(0, 10).join(',')}${x.size > 10 ? ',…' : ''}}`;
    log(`  p(dia perfeito)=${pGood} regra ${rule}: rookie${fmt(tot[0])} champion${fmt(tot[1])} ultimate${fmt(tot[2])} mega→ultra${fmt(tot[3])} -> ${tot.every((x) => x.size <= 1) ? 'INVARIANTE OK' : 'QUEBRA'} · ultra em ${ultras}/3000 · degenerações ${f2(30 * degen / days)} por 30 dias${rule === 'acompanha' ? ' · quedas (todas retiram os pontos do estágio perdido) ' + rem : ''}`);
  }
  const famsOk = Object.values(v).every(Boolean), gapOk = gapW(best) <= 0.1, exOk = best.exOk, mOk = best.margMin >= 0.02;
  log(`\n## PREMISSA PASSE 1 (7 famílias ±5% na ΔTTK e nenhum build >10% de gap, com exemplos do dono 3/3 e marginal ≥2%): ${famsOk && gapOk && exOk && mOk ? 'SIM' : 'NÃO'}`);
  log(`  famílias: ${famsOk ? 'SIM' : 'NÃO (' + Object.entries(v).filter(([, x]) => !x).map(([k]) => k).join(', ') + ')'} | gap ≤10%: ${gapOk ? 'SIM' : 'NÃO'} (${pc(gapW(best))}) | exemplos 3/3: ${exOk ? 'SIM' : 'NÃO'} | marginal ≥2%: ${mOk ? 'SIM' : 'NÃO'} (${pc(best.margMin)})`);
}

// ======================= CONFIRMAÇÃO FINAL (contexto §2.5) — node cv3-sim3.mjs --final =======================
function finalRun() {
  const ALLB = ['ATK', 'DEF', 'SPD', 'DIST'], C = 8;
  const lvl = (d) => { const s = grow('DIST', d); return (s.atk + s.def + s.spd) / 3; };
  const Jday = {};
  const use = (d, disp = false) => { ROUND = disp ? 'round' : 'none'; K = C * lvl(d); SPDMODE = 'prop'; JANELA = Jday[d] ?? 22.5; };
  const ttk = (a, b) => golpes(a, b) * intervalo(a.spd);
  for (const d of DAYS) { use(d); JANELA = 22.5; const D = grow('DIST', d); Jday[d] = 22.5 * 25 / ttk(D, D); }
  const V = {};
  // exemplos (exibição = round)
  use(0, true); const e = [golpes(ROOKIE, ROOKIE), golpes({ ...ROOKIE, atk: 2 }, ROOKIE), golpes(ROOKIE, { ...ROOKIE, def: 2 })];
  V.exemplos = e.join('/') === '10/9/11';
  log(`## F-1 Exemplos do dono no d0 (golpes de exibição = round): ${e.join('/')} (alvo 10/9/11) -> ${V.exemplos ? 'PASS' : 'FATAL'}`);
  // matriz + marginal + duração
  let gap = 0, wg = '', mmin = Infinity, wm = '', defMax = 0;
  log('\n## F-2 Matriz de gap (linha vence coluna; ordem ATK DEF SPD DIST), marginal (+1 no DIST, % do TTK) e duração do espelho (janela normalizada)');
  for (const d of DAYS) {
    use(d); const S = Object.fromEntries(ALLB.map((b) => [b, grow(b, d)]));
    const row = ALLB.map((a) => a + '[' + ALLB.map((b) => { const g = ttk(S[b], S[a]) / ttk(S[a], S[b]) - 1; if (Math.abs(g) > Math.abs(gap)) { gap = g; wg = `d${d} ${a}×${b}`; } return pc(g); }).join(' ') + ']').join(' ');
    const D = S.DIST, base = ttk(D, D);
    const m = { atk: 1 - ttk({ ...D, atk: D.atk + 1 }, D) / base, spd: 1 - ttk({ ...D, spd: D.spd + 1 }, D) / base, def: ttk(D, { ...D, def: D.def + 1 }) / base - 1, hp: ttk(D, { ...D, hp: D.hp + 1 }) / base - 1 };
    for (const [k, v] of Object.entries(m)) if (v < mmin) { mmin = v; wm = `d${d}/${k}`; }
    const dur = Object.fromEntries(ALLB.map((b) => [b, ttk(S[b], S[b])])); defMax = Math.max(defMax, dur.DEF);
    log(`d${d} (k=${f1(K)}, J=${f2(JANELA)}s) ${row}`);
    log(`   marginal: ATK ${pc(m.atk)} · SPD ${pc(m.spd)} · DEF ${pc(m.def)} · HP ${pc(m.hp)} | espelhos: ${ALLB.map((b) => `${b} ${f1(dur[b])}s`).join(', ')}`);
  }
  V.gap = Math.abs(gap) <= 0.1; V.marginal = mmin >= 0.02; V.defDur = defMax <= 40;
  log(`gap máx ${pc(gap)} (${wg}) -> ${V.gap ? 'PASS' : 'FATAL'} · marginal mín ${pc(mmin)} (${wm}) -> ${V.marginal ? 'PASS' : 'FATAL'} · DEF puro máx ${f1(defMax)}s -> ${V.defDur ? 'PASS' : 'FATAL'}`);
  // régua
  const cells = []; for (const d of DAYS) for (const b of ALLB) cells.push({ d, b });
  const REFD = { fam: 'direto', p: 1 };
  const run = (c, sp, o) => { use(c.d); const s = grow(c.b, c.d); return fight(s, s, sp, REFD, o); };
  const BUFFS = ['buffAtkN', 'debuffDefN', 'buffSpdN'];
  const tol = (f, c) => (BUFFS.includes(f) && c.d === 0 ? [-0.15, 0.05] : [-0.05, 0.05]);
  const evalF = (f, p) => { let w = 0, wc = '', ok = 0, nf = 0, excess = 0; for (const c of cells) { const m = run(c, { fam: f, p }); const dd = m.tA / m.tB - 1; if (m.castA === 0) nf++; const [lo, hi] = tol(f, c); if (dd >= lo - 1e-9 && dd <= hi + 1e-9) ok++; else excess = Math.max(excess, dd < lo ? lo - dd : dd - hi); if (Math.abs(dd) > Math.abs(w)) { w = dd; wc = `d${c.d}/${c.b}`; } } return { w, wc, ok, nf, excess }; };
  const cal = (f, lo, hi) => { let b = { p: lo, s: 9 }; for (let it = 0; it < 4; it++) { const st = (hi - lo) / 20; for (let p = lo; p <= hi + EPS; p += st) { const r = evalF(f, p); const s = r.excess * 10 + Math.abs(r.w) * 0.01; if (s < b.s) b = { p, s }; } lo = Math.max(0.01, b.p - st); hi = b.p + st; } return Math.round(b.p * 100) / 100; };
  const PF = { direto: 1, direto2: 1, dot: cal('dot', 0.3, 3), cura: cal('cura', 0.2, 4), escudo: cal('escudo', 0.2, 4), buffAtkN: cal('buffAtkN', 0.1, 3), debuffDefN: cal('debuffDefN', 0.1, 3), buffSpdN: cal('buffSpdN', 0.1, 6) };
  log('\n## F-3 Régua ΔTTK (fracionário, determinística; buffs: tolerância −15%/+5% só no d0, ±5% nos demais)');
  log('família | p | pior Δ (célula) | dentro/20 | sem disparo | veredito');
  const fv = {};
  for (const [f, p] of Object.entries(PF)) { const r = evalF(f, p); fv[f] = r.ok === 20 && r.nf === 0; log(`${f} | ${p} | ${pc(r.w)} (${r.wc || '-'}) | ${r.ok}/20 | ${r.nf} | ${fv[f] ? 'PASS' : 'FATAL: família=' + f}`); }
  V.familias = Object.values(fv).every(Boolean);
  // vermelho válido: escolhe a primeira família não-referência que passou
  const redF = ['dot', 'cura', 'escudo', 'buffAtkN', 'buffSpdN'].find((f) => fv[f]);
  if (redF) { const r0 = evalF(redF, PF[redF]), r1 = evalF(redF, Math.round(PF[redF] * 1.5 * 100) / 100); V.vermelho = r0.ok === 20 && r1.ok < 20; log(`prova de vermelho: ${redF} p=${PF[redF]} -> ${r0.ok}/20 PASS; p×1,5=${Math.round(PF[redF] * 150) / 100} -> ${r1.ok}/20, pior ${pc(r1.w)} (${r1.wc}) -> ${r1.ok < 20 ? 'REPROVA: família=' + redF : 'NÃO REPROVOU'}`); }
  else { V.vermelho = false; log('prova de vermelho: nenhuma família passou para servir de base'); }
  V.direto2 = fv.direto2;
  // energia
  let tot = 0, fired = 0, first = '';
  for (const c of cells) for (const f of Object.keys(PF)) for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) { const m = run(c, { fam: f, p: PF[f] }, { phA: i / 20, phB: j / 20 }); tot++; if (m.castA >= 1 && m.castB >= 1) fired++; else if (!first) first = `d${c.d}/${c.b}/${f}`; }
  V.energia = fired === tot;
  log(`\n## F-4 Energia (+${EN.dealt}×fração causada +${EN.recv}×fração recebida +${EN.perSec}/s, dispara a 100): ${fired}/${tot} lutas com especial nos dois lados -> ${V.energia ? 'PASS' : 'FATAL: ' + first}`);
  // constantes
  log('\n## F-5 Constantes finais (para o núcleo TS)');
  log('constante | valor');
  log(`CURVA | golpes = HP×(1+DEF/k)/(1+ATK/k), fracionário no TTK; exibição = round`);
  log(`K | ${C} × nível, nível = média(ATK,DEF,SPD) do DIST de referência do dia (d0=1 → k=8)`);
  log(`RITMO | 9×(1+SPD/k)/(1+1/k) ataques por janela`);
  log(`JANELA por dia (s) | ${DAYS.map((d) => `d${d}=${f2(Jday[d])}`).join(' ')}`);
  log(`E | 3 golpes`);
  log(`ENERGIA | +${EN.dealt}×fração de HP causada, +${EN.recv}×fração recebida, +${EN.perSec}/s, dispara a 100`);
  for (const [f, p] of Object.entries(PF)) log(`P_${f} | ${p}`);
  log(`CRESCIMENTO | +1/dia que conta no galho; a cada 4º → HP; evo ×1,5 ceil nos 4; pontos do estágio = min(perfectDays, required)`);
  const fatal = Object.entries(V).filter(([, v]) => !v).map(([k]) => k);
  log(`\n## CONFIRMAÇÃO FINAL: ${fatal.length ? 'NÃO — FATAL em: ' + fatal.join(', ') : 'FECHA'}`);
}

// ======================= RE-ESCALA POR ESTÁGIO (contexto §2.6) — node cv3-sim3.mjs --stage [--var=A|B] =======================
// Estágio s = nº de evoluções até o dia (EVO_AT). Pontos do estágio = dias que contam DENTRO do estágio (rodízio: 4º dia do estágio -> HP).
// VAR A (base fixa por estágio): base_s = ceil(1,5^s × rookie) = ATK/DEF/SPD 1,2,3,4,6 · HP 10,15,23,34,51; valor = base_s + pontos do estágio. Os pontos do estágio anterior viram o ×1,5 da base (iguais para todos pelo invariante).
// VAR B (base carregada): base_s = ceil(1,5 × valor final do estágio anterior), por atributo; valor = base_s + pontos do estágio.
// k = 8 fixo. Comparação sempre dentro do mesmo estágio (DIST de referência = mesmo estágio, mesmos dias no estágio).
function stageOf(day) { let s = 0, start = 0; for (const e of EVO_AT) if (day >= e) { s++; start = e; } return { s, start }; }
function growS(build, day, VAR) {
  const { s, start } = stageOf(day);
  let base;
  if (VAR === 'A') { const f = Math.pow(1.5, s); base = { atk: Math.ceil(f), def: Math.ceil(f), spd: Math.ceil(f), hp: Math.ceil(10 * f) }; }
  else { base = { ...ROOKIE }; let prevStart = 0; for (let i = 0; i < s; i++) { const end = EVO_AT[i]; const v = addPts(base, build, end - prevStart); base = evo(v); prevStart = end; } }
  return addPts(base, build, day - start);
}
function addPts(base, build, n) { const v = { ...base }; let m = 0; for (let i = 1; i <= n; i++) { if (i % 4 === 0) v.hp++; else { v[BUILDS[build][m % BUILDS[build].length]]++; m++; } } return v; }
function stageRun(VAR) {
  const ALLB = ['ATK', 'DEF', 'SPD', 'DIST'], C = 8; const grow = (b, d) => growS(b, d, VAR);
  const Jday = {};
  const use = (d, disp = false) => { JANELA = Jfor(d); ROUND = disp ? 'round' : 'none'; K = C; SPDMODE = 'prop'; };
  // JANELA contínua: J(d) = 25 × ritmo(SPD_ref) ÷ golpes(ref, ref), ref = DIST do mesmo estágio e dias no estágio
  const Jfor = (d) => { ROUND = 'none'; K = C; SPDMODE = 'prop'; const D = grow('DIST', d); return 25 * ritmoOf(D.spd, C, 'prop') / golpes(D, D); };
  const ttk = (a, b) => golpes(a, b) * intervalo(a.spd);
  for (let d = 0; d <= 60; d++) Jday[d] = Jfor(d);
  const V = {};
  // exemplos (exibição = round)
  use(0, true); const e = [golpes(ROOKIE, ROOKIE), golpes({ ...ROOKIE, atk: 2 }, ROOKIE), golpes(ROOKIE, { ...ROOKIE, def: 2 })];
  V.exemplos = e.join('/') === '10/9/11';
  log(`## S-1 [VAR ${VAR}] Exemplos do dono no d0 (golpes de exibição = round): ${e.join('/')} (alvo 10/9/11) -> ${V.exemplos ? 'PASS' : 'FATAL'}`);
  // matriz + marginal + duração
  let gap = 0, wg = '', mmin = Infinity, wm = '', defMax = 0;
  log('\n## F-2 Matriz de gap (linha vence coluna; ordem ATK DEF SPD DIST), marginal (+1 no DIST, % do TTK) e duração do espelho (janela normalizada)');
  for (const d of DAYS) {
    use(d); const S = Object.fromEntries(ALLB.map((b) => [b, grow(b, d)]));
    const row = ALLB.map((a) => a + '[' + ALLB.map((b) => { const g = ttk(S[b], S[a]) / ttk(S[a], S[b]) - 1; if (Math.abs(g) > Math.abs(gap)) { gap = g; wg = `d${d} ${a}×${b}`; } return pc(g); }).join(' ') + ']').join(' ');
    const D = S.DIST, base = ttk(D, D);
    const m = { atk: 1 - ttk({ ...D, atk: D.atk + 1 }, D) / base, spd: 1 - ttk({ ...D, spd: D.spd + 1 }, D) / base, def: ttk(D, { ...D, def: D.def + 1 }) / base - 1, hp: ttk(D, { ...D, hp: D.hp + 1 }) / base - 1 };
    for (const [k, v] of Object.entries(m)) if (v < mmin) { mmin = v; wm = `d${d}/${k}`; }
    const dur = Object.fromEntries(ALLB.map((b) => [b, ttk(S[b], S[b])])); defMax = Math.max(defMax, dur.DEF);
    log(`d${d} (k=${f1(K)}, J=${f2(JANELA)}s) ${row}`);
    log(`   marginal: ATK ${pc(m.atk)} · SPD ${pc(m.spd)} · DEF ${pc(m.def)} · HP ${pc(m.hp)} | espelhos: ${ALLB.map((b) => `${b} ${f1(dur[b])}s`).join(', ')}`);
  }
  V.gap = Math.abs(gap) <= 0.1; V.marginal = mmin >= 0.02; V.defDur = defMax <= 40;
  log(`gap máx ${pc(gap)} (${wg}) -> ${V.gap ? 'PASS' : 'FATAL'} · marginal mín ${pc(mmin)} (${wm}) -> ${V.marginal ? 'PASS' : 'FATAL'} · DEF puro máx ${f1(defMax)}s -> ${V.defDur ? 'PASS' : 'FATAL'}`);
  // régua
  const cells = []; for (const d of DAYS) for (const b of ALLB) cells.push({ d, b });
  const REFD = { fam: 'direto', p: 1 };
  const pOf = (p, d) => (typeof p === 'object' ? p[stageOf(d).s] : p);
  const run = (c, sp, o) => { use(c.d); const s = grow(c.b, c.d); return fight(s, s, { fam: sp.fam, p: pOf(sp.p, c.d) }, REFD, o); };
  const BUFFS = ['buffAtkN', 'debuffDefN', 'buffSpdN'];
  const tol = (f, c) => (BUFFS.includes(f) && c.d === 0 ? [-0.15, 0.05] : [-0.05, 0.05]);
  const evalF = (f, p, only) => { let w = 0, wc = '', ok = 0, nf = 0, excess = 0; for (const c of cells.filter((c) => only === undefined || stageOf(c.d).s === only)) { const m = run(c, { fam: f, p }); const dd = m.tA / m.tB - 1; if (m.castA === 0) nf++; const [lo, hi] = tol(f, c); if (dd >= lo - 1e-9 && dd <= hi + 1e-9) ok++; else excess = Math.max(excess, dd < lo ? lo - dd : dd - hi); if (Math.abs(dd) > Math.abs(w)) { w = dd; wc = `d${c.d}/${c.b}`; } } return { w, wc, ok, nf, excess }; };
  const cal = (f, lo, hi, only) => { let b = { p: lo, s: 9 }; for (let it = 0; it < 4; it++) { const st = (hi - lo) / 20; for (let p = lo; p <= hi + EPS; p += st) { const r = evalF(f, p, only); const s = r.excess * 10 + Math.abs(r.w) * 0.01; if (s < b.s) b = { p, s }; } lo = Math.max(0.01, b.p - st); hi = b.p + st; } return Math.round(b.p * 100) / 100; };
  const STG = [...new Set(DAYS.map((d) => stageOf(d).s))];
  const perStage = (f) => Object.fromEntries(STG.map((s) => [s, cal(f, 0.2, 4, s)]));
  const PF = { direto: 1, direto2: 1, dot: cal('dot', 0.3, 3), cura: perStage('cura'), escudo: perStage('escudo'), buffAtkN: cal('buffAtkN', 0.1, 3), debuffDefN: cal('debuffDefN', 0.1, 3), buffSpdN: cal('buffSpdN', 0.1, 6) };
  log('\n## F-3 Régua ΔTTK (fracionário, determinística; buffs: tolerância −15%/+5% só no d0, ±5% nos demais)');
  log('família | p | pior Δ (célula) | dentro/20 | sem disparo | veredito');
  const fv = {};
  for (const [f, p] of Object.entries(PF)) { const r = evalF(f, p); fv[f] = r.ok === 20 && r.nf === 0; log(`${f} | ${typeof p === 'object' ? JSON.stringify(p) : p} | ${pc(r.w)} (${r.wc || '-'}) | ${r.ok}/20 | ${r.nf} | ${fv[f] ? 'PASS' : 'FATAL: família=' + f}`); }
  V.familias = Object.values(fv).every(Boolean);
  // vermelho válido: escolhe a primeira família não-referência que passou
  const redF = ['dot', 'cura', 'escudo', 'buffAtkN', 'buffSpdN'].find((f) => fv[f]);
  if (redF) { const x15 = typeof PF[redF] === 'object' ? Object.fromEntries(Object.entries(PF[redF]).map(([k, v]) => [k, Math.round(v * 150) / 100])) : Math.round(PF[redF] * 150) / 100; const r0 = evalF(redF, PF[redF]), r1 = evalF(redF, x15); V.vermelho = r0.ok === 20 && r1.ok < 20; log(`prova de vermelho: ${redF} p=${PF[redF]} -> ${r0.ok}/20 PASS; p×1,5=${Math.round(PF[redF] * 150) / 100} -> ${r1.ok}/20, pior ${pc(r1.w)} (${r1.wc}) -> ${r1.ok < 20 ? 'REPROVA: família=' + redF : 'NÃO REPROVOU'}`); }
  else { V.vermelho = false; log('prova de vermelho: nenhuma família passou para servir de base'); }
  V.direto2 = fv.direto2;
  // energia
  let tot = 0, fired = 0, first = '';
  for (const c of cells) for (const f of Object.keys(PF)) for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) { const m = run(c, { fam: f, p: PF[f] }, { phA: i / 20, phB: j / 20 }); tot++; if (m.castA >= 1 && m.castB >= 1) fired++; else if (!first) first = `d${c.d}/${c.b}/${f}`; }
  V.energia = fired === tot;
  log(`\n## F-4 Energia (+${EN.dealt}×fração causada +${EN.recv}×fração recebida +${EN.perSec}/s, dispara a 100): ${fired}/${tot} lutas com especial nos dois lados -> ${V.energia ? 'PASS' : 'FATAL: ' + first}`);
  // constantes
  log('\n## F-5 Constantes finais (para o núcleo TS)');
  log('constante | valor');
  log(`CURVA | golpes = HP×(1+DEF/k)/(1+ATK/k), fracionário no TTK; exibição = round`);
  log(`K | ${C} fixo; valores por estágio: VAR ${VAR} (ver cabeçalho)`); log('ESTÁGIO | s = nº de EVO_AT [4,9,14,59] alcançados; base A: ceil(1,5^s) / HP ceil(10·1,5^s)');
  log(`RITMO | 9×(1+SPD/k)/(1+1/k) ataques por janela`);
  log('JANELA | J(d) = 25 × ritmo(SPD_ref) ÷ golpes(ref,ref), ref = DIST do mesmo estágio/dias; contínua por dia:'); log('  ' + Object.entries(Jday).map(([d, j]) => `d${d}=${f2(j)}`).join(' '));
  log(`E | 3 golpes`);
  log(`ENERGIA | +${EN.dealt}×fração de HP causada, +${EN.recv}×fração recebida, +${EN.perSec}/s, dispara a 100`);
  for (const [f, p] of Object.entries(PF)) log(`P_${f} | ${typeof p === 'object' ? Object.entries(p).map(([s, v]) => 'estágio ' + s + '=' + v).join(', ') : p}`);
  log(`CRESCIMENTO | +1/dia que conta no estágio; 4º → HP; evolução: base do estágio seguinte (VAR); pontos = min(perfectDays, required)`);
  const fatal = Object.entries(V).filter(([, v]) => !v).map(([k]) => k);
  log(`\n## RE-ESCALA [VAR ${VAR}]: ${fatal.length ? 'NÃO — FATAL em: ' + fatal.join(', ') : 'FECHA'}`);
}
