// cv3-sim3.mjs — Fase 1 AJUSTAR (contexto §2.4 / PLANO §10). Determinístico. Uso: node cv3-sim3.mjs [--red]
const RED = process.argv.includes('--red');
const out = []; const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };
const f1 = (x) => x.toFixed(1), f2 = (x) => x.toFixed(2), pc = (x) => (x >= 0 ? '+' : '') + (100 * x).toFixed(1) + '%';
const EPS = 1e-9;

// ---------- SUPOSIÇÕES ROTULADAS ----------
const JANELA = 22.5;                        // S1: SPD1 = 9 ataques/janela = 2,5 s
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
const golpesK = (a, d, k) => Math.max(1, Math.ceil(d.hp * (1 + d.def / k) / (1 + a.atk / k) - 1e-9));
const golpes = (a, d) => golpesK(a, d, K);
const ritmoOf = (spd, k, mode) => (mode === 'lin' ? 8 + spd : 9 * (1 + spd / k) / (1 + 1 / k)); // ataques por janela; ambos = 9 no SPD1
const intervalo = (spd) => JANELA / ritmoOf(spd, K, SPDMODE);
const evo = (s) => ({ atk: Math.ceil(s.atk * 1.5), def: Math.ceil(s.def * 1.5), spd: Math.ceil(s.spd * 1.5), hp: Math.ceil(s.hp * 1.5) });
function grow(build, day) { let s = { ...ROOKIE }, n = 0; for (let d = 1; d <= day; d++) { if (d % 4 === 0) s.hp++; else { s[BUILDS[build][n % BUILDS[build].length]]++; n++; } if (EVO_AT.includes(d)) s = evo(s); } return s; }

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
    for (const i of act) { const me = F[i], foe = F[1 - i]; hit(me, foe, me.outMul / golpes(me.s, foe.s)); me.next = t + intervalo(me.s.spd) / me.spdMul; }
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
