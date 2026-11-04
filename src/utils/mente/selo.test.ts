import { describe, it, expect } from 'vitest';
import {
  SELO_ATTRS, SELO_MAX_BITS, SELO_MAX_LEVEL, SELO_OPTIONS, SELO_ROUND, samePanel, seededRng, seloBits, seloForLevel,
  seloRuleCount, seloStep, type SeloPanel,
} from './selo';

const LEVELS = Array.from({ length: SELO_MAX_LEVEL }, (_, i) => i + 1);

describe('Selo Faltante: gerador puro', () => {
  it('é determinístico: a mesma seed devolve a mesma matriz', () => {
    for (const l of LEVELS) expect(seloForLevel(l, seededRng(123 + l))).toEqual(seloForLevel(l, seededRng(123 + l)));
  });

  it('exatamente uma opção é a casa que falta; 6 opções, todas diferentes', () => {
    for (const l of LEVELS) for (let s = 0; s < 200; s += 1) {
      const p = seloForLevel(l, seededRng(s * 31 + l));
      expect(p.options).toHaveLength(SELO_OPTIONS);
      expect(p.options.filter(o => samePanel(o, p.grid[8]))).toHaveLength(1);
      expect(samePanel(p.options[p.answer], p.grid[8])).toBe(true);
      const keys = new Set(p.options.map(o => JSON.stringify(o)));
      expect(keys.size).toBe(SELO_OPTIONS);
    }
  });

  it('opções balanceadas: A com 3 valores × 2 cada, B com 2 valores × 3 cada, o resto igual à resposta (não sai por contagem)', () => {
    for (const l of LEVELS) for (let s = 0; s < 200; s += 1) {
      const p = seloForLevel(l, seededRng(s * 7 + l * 1000));
      const [A, B] = p.varied;
      const freq = (k: keyof SeloPanel) => {
        const m = new Map<number, number>();
        for (const o of p.options) m.set(o[k], (m.get(o[k]) ?? 0) + 1);
        return [...m.values()].sort();
      };
      expect(freq(A)).toEqual([2, 2, 2]);
      expect(freq(B)).toEqual([3, 3]);
      for (const k of SELO_ATTRS.filter(x => x !== A && x !== B)) expect(freq(k)).toEqual([6]);
    }
  });

  it('as regras valem em toda linha', () => {
    for (const l of LEVELS) for (let s = 0; s < 100; s += 1) {
      const p = seloForLevel(l, seededRng(s + l * 77));
      for (const a of SELO_ATTRS) for (let r = 0; r < 3; r += 1) {
        const [x, y, z] = [0, 1, 2].map(c => p.grid[r * 3 + c][a]);
        const rule = p.rules[a];
        if (rule === 'const') expect(new Set([x, y, z]).size).toBe(1);
        if (rule === 'distribution') expect(new Set([x, y, z]).size).toBe(3);
        if (rule === 'arith') expect(z === x + y || z === x - y).toBe(true);
        if (rule === 'xor') expect(z).toBe(x ^ y);
      }
    }
  });

  it('regras simultâneas sobem de 1 a 4; aritmética desde o nível 4; XOR desde o 6', () => {
    expect(LEVELS.map(seloRuleCount)).toEqual([1, 2, 2, 3, 3, 4, 4]);
    for (const l of LEVELS) for (let s = 0; s < 50; s += 1) {
      const p = seloForLevel(l, seededRng(s * 13 + l));
      const ruled = SELO_ATTRS.filter(a => p.rules[a] !== 'const');
      expect(ruled.length).toBe(seloRuleCount(l));
      expect(p.rules.count === 'arith').toBe(l >= 4);
      expect(p.rules.marks === 'xor').toBe(l >= 6);
    }
  });
});

describe('Selo Faltante: missão do dia, conquista e servidor', () => {
  it('o Ateliê gira Eco/Trilha/Selo; a Colcha fica só como id válido do save antigo', async () => {
    const { DAILY_EVENTS, DAILY_MISSION_IDS, dailyMissionPool } = await import('../dailyMissions');
    // @ts-expect-error espelho JS do servidor, sem declaração de tipos
    const srv = await import('../../../functions/api/_dailyMissions.js');
    for (const list of [DAILY_EVENTS as readonly string[], srv.DAILY_EVENTS]) expect(list).toEqual(expect.arrayContaining(['selo', 'patches']));
    for (const list of [DAILY_MISSION_IDS, srv.DAILY_MISSION_IDS]) expect(list).toEqual(expect.arrayContaining(['d-selo', 'd-patches']));
    expect(srv.FEAT_KEYS).toEqual(expect.arrayContaining(['seloSolved', 'patchesSolved']));
    expect(dailyMissionPool().map(m => m.id)).not.toContain('d-patches');
  });
  it('a conquista mission-patches-10 soma Colchas antigas + rodadas do Selo', async () => {
    const { MISSIONS } = await import('../missions');
    const m = MISSIONS.find(x => x.id === 'mission-patches-10')!;
    expect(m.bgReward).toBe('bg-mission-colcha');
    expect(m.progress({ feats: { patchesSolved: 4, seloSolved: 3 } } as never)).toBe(7);
  });
});

describe('Selo Faltante: escada e pagamento', () => {
  it('sobe depois de 3 acertos seguidos; desce a cada erro; fica entre 1 e 7', () => {
    let st = { level: 1, streak: 0 };
    st = seloStep(st.level, st.streak, true); st = seloStep(st.level, st.streak, true);
    expect(st).toEqual({ level: 1, streak: 2 });
    st = seloStep(st.level, st.streak, true);
    expect(st).toEqual({ level: 2, streak: 0 });
    expect(seloStep(2, 2, false)).toEqual({ level: 1, streak: 0 });
    expect(seloStep(1, 0, false)).toEqual({ level: 1, streak: 0 });
    expect(seloStep(SELO_MAX_LEVEL, 2, true)).toEqual({ level: SELO_MAX_LEVEL, streak: 0 });
  });

  it('paga floor(acertos × 10 / 8), teto 10', () => {
    expect(Array.from({ length: SELO_ROUND + 1 }, (_, c) => seloBits(c))).toEqual([0, 1, 2, 3, 5, 6, 7, 8, 10]);
    expect(seloBits(99)).toBe(SELO_MAX_BITS);
    expect(seloBits(-3)).toBe(0);
  });
});
