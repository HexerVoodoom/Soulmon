/**
 * O duelo fantasma no núcleo v3 — as regras PURAS de `_duel.js` (combate v3, PR5; contexto §2.19).
 * (A rota — semente, ficha congelada, empate, cota — é de `community.duel.v3.test.js`; a paridade com o app,
 * de `combate.parity.test.js`; a gravação de `metadata.f`, de `save.firstSeen.test.js`.)
 *
 * Medições × metas do PR5 (balanco-motores §9): duração 35–42 s, o mais fraco por 5% vence 25–40% e o de 1 Lv
 * abaixo 10–30%, a torcida no teto contra o fantasma 55–70%, o teto S1 limita sem rejeitar, o empate existe.
 */
import { describe, it, expect } from 'vitest';
import {
  simulateDuel, duelSide, duelCombatant, maxLevelFor, sanitizeTaps, bucketTapTimes, duelCheerEvents, fichaStageOf, duelSeed,
  DUEL_CHEER_BUCKETS, DUEL_TAPS_CAP, DUEL_TAPS_FULL, DUEL_PENDING_MS, DUEL_DAY_MS, PVP_HP_SCALE,
} from './_duel.js';
import {
  CHEER, MAX_LEVEL, REFERENCE_BUILDS, SPECIAL_FAMILIES, STAGE_LEVEL_CAPS, combatantAt, combinedBonus, firstLevelOfStage, specialOf,
} from './_combate.js';

const N = 600;
const BN = ['atk', 'def', 'spd', 'balanced'];
const RULER = [1, 4, 6, 7, 10, 13, 14, 18, 21, 22, 26, 30, 31, 35, 40];
const fam = (i) => SPECIAL_FAMILIES[((i % 7) + 7) % 7];
const side = (L, build = 'balanced', family = 'direct', bonus = 0) => ({ combatant: combatantAt(L, REFERENCE_BUILDS[build], bonus), special: specialOf(family) });
const TETO = Array(DUEL_CHEER_BUCKETS).fill(DUEL_TAPS_CAP);
const mean = (a) => a.reduce((x, y) => x + y, 0) / a.length;
const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
const pct = (x) => `${(100 * x).toFixed(1)}%`;
const log = (...a) => console.log('[PR5]', ...a);

describe('AC3. teto S1: 1 level por dia de servidor desde a 1ª gravação; o valor é LIMITADO, não rejeitado', () => {
  const now = 1_800_000_000_000;
  const forjado = { evolutionStage: 'ultra-power', perfectDays: 999, powerPoints: 50 };

  it('maxLevelFor: 1 + dias de servidor; sem f vale o teto do estágio; relógio no futuro conta 0 dias', () => {
    expect(maxLevelFor(now, now)).toBe(1);
    expect(maxLevelFor(now - 3 * DUEL_DAY_MS, now)).toBe(4);
    expect(maxLevelFor(now - 3 * DUEL_DAY_MS + 1, now)).toBe(3);
    expect(maxLevelFor(now - 400 * DUEL_DAY_MS, now)).toBe(401);
    expect(maxLevelFor(now + 5 * DUEL_DAY_MS, now)).toBe(1);
    for (const lixo of [undefined, null, 0, -1, NaN, 'x', Infinity, {}]) expect(maxLevelFor(lixo, now), String(lixo)).toBe(MAX_LEVEL);
  });

  it('um save com perfectDays 999 e estágio ultra, com f de 3 dias atrás, luta com level ≤ 4 (limitado, não rejeitado)', () => {
    const c = duelCombatant(forjado, { maxLevel: maxLevelFor(now - 3 * DUEL_DAY_MS, now) });
    expect(c.level).toBeLessThanOrEqual(4);
    expect(c.level).toBe(4);
    expect(duelCombatant(forjado).level).toBe(MAX_LEVEL); // sem o teto: o level 40 que o cliente escreveu
  });

  it('um save VÁLIDO passa intacto: abaixo do teto o level é o derivado do save', () => {
    const legit = { evolutionStage: 'champion-power', perfectDays: 3, powerPoints: 4 };
    const sem = duelCombatant(legit);
    expect(duelCombatant(legit, { maxLevel: maxLevelFor(now - 90 * DUEL_DAY_MS, now) })).toEqual(sem);
    expect(sem.level).toBe(firstLevelOfStage(1) + 3);
  });

  it('RED: sem o teto o save forjado vence ≥ 95% contra um par legítimo do dia 4; com o teto fica um espelho', () => {
    const par = side(4);
    const luta = (maxLevel) => {
      let w = 0;
      for (let i = 0; i < 200; i++) {
        const me = { combatant: duelCombatant(forjado, { maxLevel }), special: specialOf('direct') };
        const r = simulateDuel({ me, opp: par, seed: duelSeed('s1', i), taps: [] });
        w += r.winner === 'me' ? 1 : r.winner === 'draw' ? 0.5 : 0;
      }
      return w / 200;
    };
    const sem = luta(undefined);
    const com = luta(maxLevelFor(now - 3 * DUEL_DAY_MS, now));
    log(`S1: forjado SEM teto vence o par do dia 4 em ${pct(sem)} · COM teto ${pct(com)}`);
    expect(sem).toBeGreaterThanOrEqual(0.95);
    expect(com).toBeGreaterThan(0.25);
    expect(com).toBeLessThan(0.75);
  });
});

describe('a ficha vem do SAVE, e só números e ids de uma lista fechada saem dela', () => {
  it('estágio hostil (chaves do Object) vira ficha finita de rookie', () => {
    for (const evolutionStage of ['constructor', '__proto__', 'toString', 'hasOwnProperty', 'valueOf', 42, null, {}]) {
      const s = duelSide({ evolutionStage, perfectDays: 5, soulmonSkills: { constructor: { especial: { escolaId: 'benca' } } } });
      for (const k of ['level', 'atk', 'def', 'spd', 'hp', 'bonus']) expect(Number.isFinite(s.combatant[k]), `${String(evolutionStage)} ${k}`).toBe(true);
      expect(s.combatant.level).toBe(6); // rookie: 5 dias perfeitos = level 6, o teto do estágio
      expect(s.special.family).toBe('direct');
      expect(fichaStageOf(evolutionStage)).toBe('rookie');
    }
  });

  it('atributos e galhos hostis não geram stat negativo, NaN ou infinito', () => {
    const s = duelSide({ evolutionStage: 'rookie', perfectDays: 2, powerPoints: -1e9, harmonyPoints: NaN, benevolencePoints: Infinity, attrs: { power: 1e9 } });
    for (const k of ['atk', 'def', 'spd', 'hp']) expect(s.combatant[k]).toBeGreaterThan(0);
    expect(Object.keys(s.combatant).sort()).toEqual(['atk', 'bonus', 'def', 'hp', 'level', 'spd']);
  });

  it('a família do especial vem da ESCOLA da skill especial do estágio atual; desconhecida ou ausente = direct', () => {
    const base = { evolutionStage: 'champion-power', perfectDays: 1 };
    const skills = (escolaId) => ({ champion: { basica: { escolaId: 'combate_fisico' }, especial: { escolaId } } });
    expect(duelSide({ ...base, soulmonSkills: skills('benca') }).special.family).toBe('heal');
    expect(duelSide({ ...base, soulmonSkills: skills('maldicao') }).special.family).toBe('defDebuff');
    expect(duelSide({ ...base, soulmonSkills: skills('hackeada') }).special.family).toBe('direct');
    expect(duelSide({ ...base, soulmonSkills: skills('constructor') }).special.family).toBe('direct');
    expect(duelSide({ ...base, soulmonSkills: { rookie: { especial: { escolaId: 'benca' } } } }).special.family).toBe('direct'); // outro estágio
    expect(duelSide(base).special.family).toBe('direct');
    expect(duelSide(null).combatant.level).toBe(1);
    expect(duelSide({ ...base, soulmonSkills: skills('benca') }).fx).toEqual({ basica: 'combate_fisico', especial: 'benca' });
    expect(duelSide(base).fx).toEqual({ basica: null, especial: null });
  });

  it('o canal do bônus de 5% existe e vale 0 até o PR7/PR8 (combinedBonus com talento e equipamento em 0)', () => {
    expect(duelCombatant({ evolutionStage: 'rookie' }).bonus).toBe(0);
    expect(combinedBonus({ talent: 0, equipment: 0 })).toBe(0);
    expect(combinedBonus({ talent: 0.05, equipment: 0.05 })).toBe(0.05); // quando entrar, o teto é um só
  });
});

describe('a torcida por BALDE', () => {
  it('sanitizeTaps: 20 inteiros em [0, 16]; lixo e baldes a mais não rendem', () => {
    expect(DUEL_CHEER_BUCKETS).toBe(20);
    const s = sanitizeTaps([99, -1, 'x', 4, 2.9]);
    expect(s).toHaveLength(20);
    expect(s.slice(0, 5)).toEqual([DUEL_TAPS_CAP, 0, 0, 4, 2]);
    expect(sanitizeTaps(null)).toEqual(Array(20).fill(0));
    expect(sanitizeTaps(Array(200).fill(1e9))).toEqual(TETO);
  });

  it('os toques de um balde valem no FIM dele; 24 toques aceitos = 1 descarga; 16 por balde no máximo', () => {
    expect(bucketTapTimes([2, 0, 1])).toEqual([3, 3, 9]);
    // 16 + 16 = 32 ≥ 24 no fim do balde 1 → uma descarga em t = 6 s
    expect(duelCheerEvents([16, 16])).toEqual([{ t: 6, side: 0 }]);
    // o teto em todos os 20 baldes = 320 toques = 13 descargas (⌊320/24⌋)
    expect(duelCheerEvents(TETO)).toHaveLength(Math.floor((DUEL_CHEER_BUCKETS * DUEL_TAPS_CAP) / DUEL_TAPS_FULL));
    expect(duelCheerEvents(Array(200).fill(1e9))).toEqual(duelCheerEvents(TETO)); // forjar não passa do teto
    expect(duelCheerEvents([DUEL_TAPS_FULL - 1])).toEqual([]);
  });

  it('torcer depois não reescreve o que já aconteceu: os eventos até o fecho do balde são os mesmos', () => {
    const me = side(10, 'atk', 'direct'), opp = side(10, 'def', 'dot');
    const base = simulateDuel({ me, opp, seed: 7, taps: [] }).events;
    const com = simulateDuel({ me, opp, seed: 7, taps: [0, 0, 0, 16, 16, 16, 16, 16] }).events; // 1ª descarga a partir de t = 15 s
    const antes = (evs) => evs.filter((e) => e.t < 12);
    expect(antes(com)).toEqual(antes(base));
  });
});

describe('AC5/AC6/AC7/AC8. o empate, a duração, o mais fraco e a torcida (medidos)', () => {
  it('AC5. `draw` existe: há sementes de espelho que terminam no mesmo instante', () => {
    const me = side(6), opp = side(6);
    let achou = null;
    for (let s = 0; s < 20000 && achou === null; s++) if (simulateDuel({ me, opp, seed: s, taps: [] }).winner === 'draw') achou = s;
    expect(achou).not.toBeNull();
    const r = simulateDuel({ me, opp, seed: achou, taps: [] });
    expect(r.hpMe).toBe(0);
    expect(r.hpOpp).toBe(0);
  });

  it('AC6. duração: mediana entre 35 e 42 s em cada estágio de rookie a mega (N = 600 por estágio, P95 impresso)', () => {
    expect(PVP_HP_SCALE).toBe(1.7);
    const linhas = [];
    for (let st = 0; st < 4; st++) {
      const lo = firstLevelOfStage(st), hi = STAGE_LEVEL_CAPS[st];
      const Ls = [lo, Math.round((lo + hi) / 2), hi];
      const t = [];
      for (let s = 0; s < N; s++) {
        const r = simulateDuel({ me: side(Ls[s % 3], BN[s % 4], fam(s >> 2)), opp: side(Ls[s % 3], BN[(s >> 4) % 4], fam(s >> 5)), seed: s * 31 + 7, taps: [] });
        t.push(Math.min(r.timeMe, r.timeOpp));
      }
      const m = med(t);
      linhas.push(`${['rookie', 'champion', 'ultimate', 'mega'][st]} ${m.toFixed(1)} s (P95 ${[...t].sort((a, b) => a - b)[Math.floor(N * 0.95)].toFixed(1)})`);
      expect(m, `estágio ${st}`).toBeGreaterThanOrEqual(35);
      expect(m, `estágio ${st}`).toBeLessThanOrEqual(42);
    }
    log('duração mediana por estágio:', linhas.join(' · '));
    expect(DUEL_PENDING_MS).toBe(5 * 60 * 1000);
  });

  it('AC7. o mais fraco: -5% de bônus vence 25–40% e -1 Lv vence 10–30%, na média', () => {
    let b5 = 0, l1 = 0, nl = 0;
    const n = N * 4;
    for (let s = 0; s < n; s++) {
      const L = RULER[s % 15], bn = BN[(s >> 4) % 4], f = fam(s >> 2);
      const forte = side(L, bn, f, combinedBonus({ talent: 0.05 })), fraco = side(L, bn, f);
      const r = simulateDuel({ me: forte, opp: fraco, seed: s * 13 + 1, taps: [] });
      b5 += r.winner === 'opp' ? 1 : r.winner === 'draw' ? 0.5 : 0;
      const mesmoEstagio = L > 1 && STAGE_LEVEL_CAPS.findIndex((c) => L <= c) === STAGE_LEVEL_CAPS.findIndex((c) => L - 1 <= c);
      if (mesmoEstagio) {
        const r2 = simulateDuel({ me: side(L, bn, f), opp: side(L - 1, bn, f), seed: s * 13 + 5, taps: [] });
        l1 += r2.winner === 'opp' ? 1 : r2.winner === 'draw' ? 0.5 : 0;
        nl++;
      }
    }
    log(`o mais fraco por 5% vence ${pct(b5 / n)} (25–40) · 1 Lv abaixo vence ${pct(l1 / nl)} (10–30)`);
    expect(b5 / n).toBeGreaterThanOrEqual(0.25);
    expect(b5 / n).toBeLessThanOrEqual(0.40);
    expect(l1 / nl).toBeGreaterThanOrEqual(0.10);
    expect(l1 / nl).toBeLessThanOrEqual(0.30);
  });

  const torcida = (n) => {
    let win = 0;
    const razao = [];
    for (let s = 0; s < n; s++) {
      const L = RULER[s % 15];
      const a = side(L, BN[(s >> 4) % 4], fam(s));
      const r = simulateDuel({ me: a, opp: a, seed: s * 3 + 2, taps: TETO });
      const r0 = simulateDuel({ me: a, opp: a, seed: s * 3 + 2, taps: [] });
      win += r.winner === 'me' ? 1 : r.winner === 'draw' ? 0.5 : 0;
      razao.push(r.timeOpp / r0.timeOpp);
    }
    return { win: win / n, ttk: mean(razao) };
  };

  it('AC8. a torcida no TETO em todos os baldes, contra o fantasma sem torcida: vitória no espelho 55–70% (~65%) e o TTK muda < 25%', () => {
    const { win, ttk } = torcida(N * 4);
    log(`torcida no teto (pvpEnergyPerDischarge ${CHEER.pvpEnergyPerDischarge}): vence o espelho ${pct(win)} (55–70) · TTK de quem torce x${ttk.toFixed(3)}`);
    expect(win).toBeGreaterThanOrEqual(0.55);
    expect(win).toBeLessThanOrEqual(0.70);
    expect(Math.abs(ttk - 1)).toBeLessThan(0.25);
  });

  it('AC8 RED: o rendimento antigo (DUEL_ENERGY_CHEER = 36 por descarga) tira a torcida da faixa', () => {
    const velho = CHEER.pvpEnergyPerDischarge;
    try {
      CHEER.pvpEnergyPerDischarge = 36;
      const { win } = torcida(600);
      log(`RED pvpEnergyPerDischarge 36: vence o espelho ${pct(win)}`);
      expect(win).toBeGreaterThan(0.70);
    } finally { CHEER.pvpEnergyPerDischarge = velho; }
    expect(CHEER.pvpEnergyPerDischarge).toBe(2.5);
  });
});
