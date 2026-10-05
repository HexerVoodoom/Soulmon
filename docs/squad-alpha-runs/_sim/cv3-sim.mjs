// cv3-sim.mjs — simulador standalone do modelo PLANO-COMBATE-V3 §2/§3 (como escrito). Determinístico (seed).
// Uso: node cv3-sim.mjs [--red]
const RED = process.argv.includes('--red');
// ---------- SUPOSIÇÕES (rotuladas) ----------
const BASE_RITMO = 8;
const JANELA = 22.5;          // S1: calibrada p/ luta base 1/1/1/10 espelho = 10 golpes x 2.5s = 25s (PvE 20–29s)
const PISO = 1;               // S2: piso Q3 = 1 (aberto ao dono)
const EVO_DAYS = [7, 21, 45]; // S3: evoluções ao fim dos dias 7, 21, 45
const E = 3;                  // S4: orçamento do especial em golpes
const ENERGY_FULL = 100, ENERGY_MIN = 20, ENERGY_MAX = 30; // S5: +U[20,30] energia por golpe próprio; especial ao encher (~4 golpes)
const N_SEEDS = 300;          // S6: fase inicial aleatória U[0,intervalo) por lutador + energia aleatória
const TOL = 0.05;

// ---------- núcleo ----------
const golpes = (a, d, atkBonus = 0, defMalus = 0) => Math.max(PISO, d.hp + (d.def - defMalus) - (a.atk + atkBonus));
const intervalo = (spd) => JANELA / (BASE_RITMO + spd);
const evo = (s) => ({ atk: Math.ceil(s.atk * 1.5), def: Math.ceil(s.def * 1.5), spd: Math.ceil(s.spd * 1.5), hp: Math.ceil(s.hp * 1.5) });
const ROOKIE = { atk: 1, def: 1, spd: 1, hp: 10 };
function rng(seed) { let s = (Math.imul(seed ^ 0x9e3779b9, 0x85ebca6b) ^ 0xdeadbeef) >>> 0 || 1; for (let i = 0; i < 16; i++) { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; } return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const f2 = (x) => (Math.round(x * 100) / 100).toFixed(2);
const pct = (x) => (x >= 0 ? '+' : '') + (x * 100).toFixed(1) + '%';
const EPS = 1e-9;

// ---------- luta em tempo real (eventos) ----------
// especial: { fam, params } só do jogador A. B ataca básico. hpFrac em [0,1]; golpe tira 1/golpesAtual do HP máx.
function fight(A, B, opts = {}) {
  const r = rng(opts.seed ?? 1);
  const sp = opts.special || null;
  const st = {
    A: { s: A, hp: 1, energy: 0, atkB: 0, spdB: 0, shield: 0, next: 0, healed: 0, wasted: 0 },
    B: { s: B, hp: 1, defM: 0, next: 0 },
  };
  const phase = opts.phase ?? true;
  st.A.next = intervalo(A.spd) * (phase ? r() : 1); st.B.next = intervalo(B.spd) * (phase ? r() : 1);
  const timed = []; // {t, fn}
  let t = 0, overkill = 0, dotWasted = 0;
  const hitB = (amt) => { const before = st.B.hp; st.B.hp -= amt; if (st.B.hp < -EPS) overkill += Math.min(amt, -st.B.hp); return before; };
  for (let guard = 0; guard < 100000; guard++) {
    const tTimed = timed.length ? Math.min(...timed.map((e) => e.t)) : Infinity;
    t = Math.min(st.A.next, st.B.next, tTimed);
    // eventos simultâneos (mesmo tick) aplicados juntos
    const doA = Math.abs(st.A.next - t) < EPS, doB = Math.abs(st.B.next - t) < EPS;
    for (const e of timed.filter((e) => Math.abs(e.t - t) < EPS)) e.fn();
    for (let i = timed.length - 1; i >= 0; i--) if (Math.abs(timed[i].t - t) < EPS) timed.splice(i, 1);
    if (doA) {
      const g = golpes(A, B, st.A.atkB, st.B.defM);
      hitB(1 / g);
      st.A.next = t + intervalo(A.spd + st.A.spdB);
      if (sp) {
        st.A.energy += ENERGY_MIN + r() * (ENERGY_MAX - ENERGY_MIN);
        if (st.A.energy >= ENERGY_FULL) { st.A.energy -= ENERGY_FULL; cast(sp, t); }
      }
    }
    if (doB) {
      const g = golpes(B, A);
      const dmg = 1 / g;
      if (st.A.shield > EPS) { const ab = Math.min(st.A.shield, dmg); st.A.shield -= ab; st.A.hp -= dmg - ab; } else st.A.hp -= dmg;
      st.B.next = t + intervalo(B.spd);
    }
    const aDead = st.A.hp <= EPS, bDead = st.B.hp <= EPS;
    if (aDead || bDead) {
      for (const e of timed) if (e.dot) dotWasted += e.dot;
      return { t, winner: aDead && bDead ? 'tie' : bDead ? 'A' : 'B', hpA: st.A.hp, overkill, dotWasted, healWasted: st.A.wasted, healed: st.A.healed };
    }
  }
  throw new Error('loop');
  function cast(sp, t0) {
    const gE = golpes(A, B, st.A.atkB, st.B.defM);
    const gMe = golpes(B, A);
    switch (sp.fam) {
      case 'direto': hitB(E / gE); break;
      case 'dot': { const k = sp.k, dt = sp.t / k; for (let i = 1; i <= k; i++) { const amt = E / k; timed.push({ t: t0 + dt * i, dot: amt / gE, fn: () => { hitB(amt / golpes(A, B, st.A.atkB, st.B.defM)); } }); } break; }
      case 'cura': { const amt = (sp.E ?? E) / gMe; const room = 1 - st.A.hp; const h = Math.min(amt, room); st.A.hp += h; st.A.healed += h; st.A.wasted += amt - h; break; }
      case 'escudo': st.A.shield += E / gMe; break;
      case 'buffAtk': { st.A.atkB += sp.X; timed.push({ t: t0 + sp.t, fn: () => { st.A.atkB -= sp.X; } }); break; }
      case 'buffSpd': { st.A.spdB += sp.X; timed.push({ t: t0 + sp.t, fn: () => { st.A.spdB -= sp.X; } }); break; }
      case 'debuffDef': { st.B.defM += sp.X; timed.push({ t: t0 + sp.t, fn: () => { st.B.defM -= sp.X; } }); break; }
    }
  }
}

const out = [];
const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };

// ================= 1. Exemplos literais =================
log('## 1. Exemplos literais do dono');
const R = ROOKIE;
log(`golpes(1/1/1/10 vs 1/1/1/10) = ${golpes(R, R)}  (esperado 10)`);
log(`golpes(ATK2 vs base) = ${golpes({ ...R, atk: 2 }, R)}  (esperado 9)`);
log(`golpes(base vs DEF2) = ${golpes(R, { ...R, def: 2 })}  (esperado 11)`);
log(`ataques em 9 intervalos de SPD1 com SPD2 = ${f2(9 * intervalo(1) / intervalo(2))}  (esperado 10); intervalo spd1=${f2(intervalo(1))}s spd2=${f2(intervalo(2))}s`);
{
  const m0 = fight(R, R, { phase: false });
  log(`espelho 1/1/1/10 sem fase aleatória: winner=${m0.winner} t=${f2(m0.t)}s  (EMPATE: ambos a 0 no mesmo tick)`);
  const m1 = fight(R, { ...R, spd: 2 }, { phase: false });
  log(`base vs SPD2 sem fase: winner=${m1.winner} (B=SPD2) t=${f2(m1.t)}s; A precisaria ${f2(10 * intervalo(1))}s`);
  let ties = 0, wA = 0, wB = 0, ts = [];
  for (let s = 1; s <= N_SEEDS; s++) { const m = fight(R, { ...R, spd: 2 }, { seed: s }); ts.push(m.t); if (m.winner === 'tie') ties++; else if (m.winner === 'A') wA++; else wB++; }
  log(`base vs SPD2, ${N_SEEDS} seeds com fase U[0,int): SPD2 vence ${wB}, base vence ${wA}, empates ${ties}; t médio ${f2(ts.reduce((a, b) => a + b) / ts.length)}s, max ${f2(Math.max(...ts))}s`);
  let tm = 0, wm = { A: 0, B: 0, tie: 0 };
  for (let s = 1; s <= N_SEEDS; s++) { const m = fight(R, R, { seed: s }); wm[m.winner]++; }
  log(`espelho base, ${N_SEEDS} seeds com fase: A ${wm.A} / B ${wm.B} / empate ${wm.tie}  -> vencedor = quem começou antes (fase), 50/50 puro`);
}

// ================= 2. Crescimento =================
log('\n## 2. Crescimento 0..60 dias (evo x1.5 ceil nos dias ' + EVO_DAYS.join(',') + ')');
const BUILDS = { ATK: ['atk'], DEF: ['def'], SPD: ['spd'], DIST: ['atk', 'spd', 'def'] };
function grow(build, day) { let s = { ...ROOKIE }; for (let d = 1; d <= day; d++) { const k = BUILDS[build][(d - 1) % BUILDS[build].length]; s[k]++; if (EVO_DAYS.includes(d)) s = evo(s); } return s; }
const ttw = (a, d) => golpes(a, d) * intervalo(a.spd);
log('dia | build | stats a/d/s/hp | golpes p/ derrubar DIST mesmo dia | TTW(meu) s | TTW(inimigo DIST em mim) s | vence?');
for (const day of [0, 7, 8, 14, 21, 22, 30, 45, 46, 60]) {
  const foe = grow('DIST', day);
  for (const b of ['ATK', 'DEF', 'SPD', 'DIST']) {
    const p = grow(b, day);
    const a = ttw(p, foe), e = ttw(foe, p);
    log(`${String(day).padStart(2)} | ${b.padEnd(4)} | ${p.atk}/${p.def}/${p.spd}/${p.hp} | ${golpes(p, foe)} | ${f2(a)} | ${f2(e)} | ${a < e - EPS ? 'SIM' : a > e + EPS ? 'nao' : 'empate'}`);
  }
}
log('\nValor marginal de +1 ponto (build DIST, contra inimigo DIST do mesmo dia): % de mudança no TTW próprio (ATK,SPD) e no TTW do inimigo (DEF)');
log('dia | +1 ATK (meu TTW) | +1 SPD (meu TTW) | +1 DEF (TTW inimigo) | +1 HP (TTW inimigo)');
for (const day of [0, 7, 21, 45, 60]) {
  const p = grow('DIST', day), foe = grow('DIST', day);
  const b = ttw(p, foe), be = ttw(foe, p);
  log(`${day} (${p.atk}/${p.def}/${p.spd}/${p.hp}, golpes=${golpes(p, foe)}) | ${pct(ttw({ ...p, atk: p.atk + 1 }, foe) / b - 1)} | ${pct(ttw({ ...p, spd: p.spd + 1 }, foe) / b - 1)} | ${pct(ttw(foe, { ...p, def: p.def + 1 }) / be - 1)} | ${pct(ttw(foe, { ...p, hp: p.hp + 1 }) / be - 1)}`);
}
// piso
log('\nPiso Q3: primeiro dia em que golpesParaDerrubar == 1');
for (const b of ['ATK', 'DIST']) for (const vs of ['ROOKIE', 'DIST mesmo dia', 'mesmo build mesmo dia']) {
  let hit = null;
  for (let d = 0; d <= 200 && hit === null; d++) { const p = grow(b, d); const foe = vs === 'ROOKIE' ? ROOKIE : vs.startsWith('DIST') ? grow('DIST', d) : grow(b, d); if (golpes(p, foe) <= 1) hit = d; }
  log(`${b} vs ${vs}: ${hit === null ? 'nao bate ate dia 200' : 'dia ' + hit}`);
}
log('\nLinearidade: golpes que build ATK precisa contra ROOKIE, e queda por dia');
{ let prev = null; const row = []; for (let d = 0; d <= 12; d++) { const g = golpes(grow('ATK', d), ROOKIE); row.push(`d${d}:${g}${prev !== null ? '(' + (g - prev) + ')' : ''}`); prev = g; } log(row.join(' ')); }
{ const row = []; for (const d of [6, 7, 20, 21, 44, 45]) { const p = grow('DIST', d); row.push(`d${d}:${p.atk}/${p.def}/${p.spd}/${p.hp}`); } log('DIST em torno das evos: ' + row.join(' ')); }

// ================= 3. Especiais =================
log('\n## 3. Especiais, orçamento E=' + E + ' golpes; ' + N_SEEDS + ' seeds; jogador A (com especial) vs B (básico)');
function famsFor(A, B) {
  // calibração "como escrito": X·t para render E golpes extras esperados no matchup DADO
  const g = golpes(A, B), iv = intervalo(A.spd);
  const extraPerHitAtk = g > 1 ? g / (g - 1) - 1 : 0; // fração de golpe extra por golpe com +1 ATK
  const tAtk = extraPerHitAtk > 0 ? (E / extraPerHitAtk) * iv : 0;
  return {
    direto: { fam: 'direto' },
    dot: { fam: 'dot', k: 3, t: 3 * iv },
    dotCurto: { fam: 'dot', k: 3, t: RED ? 3 * iv : 0.3 * iv }, // controle calibrado; --red volta t p/ 3 intervalos
    cura: { fam: 'cura' },
    escudo: { fam: 'escudo' },
    buffAtk: { fam: 'buffAtk', X: 1, t: tAtk },
    buffSpd: { fam: 'buffSpd', X: 1, t: E * JANELA / 1 },
    debuffDef: { fam: 'debuffDef', X: 1, t: tAtk },
  };
}
const SCEN = {
  'S-a base 1/1/1/10 espelho': [ROOKIE, ROOKIE],
  'S-b dia30 DIST espelho': [grow('DIST', 30), grow('DIST', 30)],
  'S-c ATK alto (golpes no piso)': [grow('ATK', 30), grow('DIST', 30)],
  'S-d dia 60 DIST espelho': [grow('DIST', 60), grow('DIST', 60)],
};
const stats = (arr) => ({ mean: arr.reduce((a, b) => a + b, 0) / arr.length, worst: Math.max(...arr) });
const verdicts = [];
for (const [name, [A, B]] of Object.entries(SCEN)) {
  const fams = famsFor(A, B);
  log(`\n### ${name}: A=${A.atk}/${A.def}/${A.spd}/${A.hp} B=${B.atk}/${B.def}/${B.spd}/${B.hp} golpes A->B=${golpes(A, B)} B->A=${golpes(B, A)}`);
  const none = []; for (let s = 1; s <= N_SEEDS; s++) none.push(fight(A, B, { seed: s, special: null }).t);
  log(`sem especial: TTW medio ${f2(stats(none).mean)}s`);
  log('familia | TTW medio s | pior s | vs direto (medio) | vs direto (pior) | win% A | HP A fim medio | overkill medio (golpes-frac) | DoT perdido | cura desperdicada | veredito ±5%');
  let ref = null;
  for (const [fn, sp] of Object.entries(fams)) {
    const ts = [], hp = [], ok = [], dw = [], hw = []; let wins = 0;
    for (let s = 1; s <= N_SEEDS; s++) {
      const m = fight(A, B, { seed: s, special: sp });
      // TTW = tempo até A derrubar B; se A morre, mede o tempo contrafactual sem a morte de A? -> reportamos t e win separado
      ts.push(m.t); hp.push(Math.max(0, m.hpA)); ok.push(m.overkill); dw.push(m.dotWasted); hw.push(m.healWasted); if (m.winner === 'A') wins++;
    }
    const st = stats(ts);
    if (fn === 'direto') ref = st;
    const dm = st.mean / ref.mean - 1, dwst = st.worst / ref.worst - 1;
    const hpm = stats(hp).mean;
    const pass = Math.abs(dm) <= TOL;
    verdicts.push({ scen: name, fam: fn, pass, dm });
    log(`${fn} | ${f2(st.mean)} | ${f2(st.worst)} | ${pct(dm)} | ${pct(dwst)} | ${(100 * wins / N_SEEDS).toFixed(0)}% | ${f2(hpm)} | ${f2(stats(ok).mean)} | ${f2(stats(dw).mean)} | ${f2(stats(hw).mean)} | ${pass ? 'PASS' : 'FAIL'}${sp.t !== undefined ? ' (t=' + f2(sp.t) + 's)' : ''}`);
  }
}
log('\n## Checagem de paridade ±5% (tempo-para-vencer medio vs direto)');
const fails = verdicts.filter((v) => !v.pass);
for (const v of fails) log(`REPROVA: familia=${v.fam} cenario="${v.scen}" desvio=${pct(v.dm)}`);
log(`total: ${verdicts.length - fails.length} PASS / ${fails.length} FAIL ${RED ? '[MODO --red: dotCurto.t 0.3*int -> 3*int]' : ''}`);
process.exitCode = fails.length ? 1 : 0;
