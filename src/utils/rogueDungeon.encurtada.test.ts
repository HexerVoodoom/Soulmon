// §457: incursão 3×8 → 3×5 com o MESMO prêmio esperado; migração de saves 3×8 em andamento; Rift intacto.
import { describe, expect, it } from 'vitest';
import { mulberry32 } from './combate/rng';
import {
  ROGUE_FLOORS, ROGUE_LEGACY_STEPS, ROGUE_MAX_SCORE, ROGUE_MAX_STEPS, ROGUE_PER_FLOOR, ROGUE_SAVE_VERSION, emptyRun, floorsCleared, isFinished,
  pathsFor, resolveStep, rogueBits, rogueScore, sanitizeRogueRun,
} from './rogueDungeon';
import { DUNGEON_FIGHTS_PER_FLOOR } from './dungeonIdle';

/** Valor (Bits) que a incursão ANTIGA pagava: 1 por desafio vencido, sobre 24 passos. */
const bitsAntigo = (won: number): number => won;
const scoreAntigo = (won: number, floors: number): number => Math.min(33, won + floors * 3);

/** Uma incursão com taxa de vitória `p` por passo (política: escolhe o 1º caminho). */
function incursao(passos: number, p: number, rng: () => number): { won: number; step: number } {
  let won = 0;
  for (let i = 0; i < passos; i++) if (rng() < p) won++;
  return { won, step: passos };
}

describe('estrutura nova', () => {
  it('3 andares × 5 = 15 passos; combate forçado no 3º e no 5º; 3 opções nos passos livres', () => {
    expect([ROGUE_FLOORS, ROGUE_PER_FLOOR, ROGUE_MAX_STEPS]).toEqual([3, 5, 15]);
    const livres = Array.from({ length: ROGUE_MAX_STEPS }, (_, s) => pathsFor('2026-11-16', s)).filter(p => p.length === 3);
    expect(livres).toHaveLength(9);
    for (let s = 0; s < ROGUE_MAX_STEPS; s++) expect(pathsFor('2026-11-16', s)).toHaveLength(s % ROGUE_PER_FLOOR === 2 || s % ROGUE_PER_FLOOR === 4 ? 1 : 3);
  });
  it('15 vitórias fecham a incursão e pagam/pontuam o mesmo que 24 antes (24 Bits, score 33)', () => {
    let r = emptyRun('2026-11-16');
    for (let i = 0; i < ROGUE_MAX_STEPS; i++) { r = resolveStep(r, 'puzzle', true); r = { ...r, bonusPending: false }; }
    expect(isFinished(r)).toBe(true);
    expect(floorsCleared(r)).toBe(3);
    expect(rogueBits(r)).toBe(bitsAntigo(ROGUE_LEGACY_STEPS));
    expect(rogueScore(r)).toBe(ROGUE_MAX_SCORE);
  });
});

describe('prêmio esperado por incursão: antes = depois (±2%) em 2000 sementes', () => {
  it.each([0.4, 0.7, 0.9])('taxa de vitória por passo %d', (p) => {
    const N = 2000;
    let antes = 0; let depois = 0; let scAntes = 0; let scDepois = 0;
    for (let s = 0; s < N; s++) {
      const a = incursao(ROGUE_LEGACY_STEPS, p, mulberry32(s * 2 + 1));
      const b = incursao(ROGUE_MAX_STEPS, p, mulberry32(s * 2 + 7919));
      antes += bitsAntigo(a.won); depois += rogueBits({ won: b.won });
      scAntes += scoreAntigo(a.won, 3); scDepois += rogueScore({ ...emptyRun('2026-11-16'), won: b.won, step: ROGUE_MAX_STEPS });
    }
    expect(Math.abs(depois / antes - 1)).toBeLessThanOrEqual(0.02);
    expect(Math.abs(scDepois / scAntes - 1)).toBeLessThanOrEqual(0.02);
  });
  it('determinístico: o valor por vitória não tem viés de arredondamento (média sobre todas as contagens)', () => {
    let soma = 0; for (let w = 0; w <= ROGUE_MAX_STEPS; w++) soma += rogueBits({ won: w }) - (w * ROGUE_LEGACY_STEPS) / ROGUE_MAX_STEPS;
    expect(Math.abs(soma)).toBeLessThan(1);
  });
});

describe('incursão 3×8 em andamento (save sem `v`)', () => {
  const D = '2026-11-16';
  const antigo = (o: Record<string, unknown>) => ({ day: D, step: 0, won: 0, over: false, power: 0, vigor: 0, shield: 0, bonusPending: false, paid: false, ...o });
  it('converte proporcional e preserva os andares concluídos', () => {
    for (let step = 0; step <= ROGUE_LEGACY_STEPS; step++) {
      const n = sanitizeRogueRun(antigo({ step, won: step }))!;
      expect(n.v).toBe(ROGUE_SAVE_VERSION);
      expect(n.step).toBeLessThanOrEqual(ROGUE_MAX_STEPS);
      expect(floorsCleared(n)).toBe(Math.floor(step / 8)); // o feito `rogueFloors` já concedido não muda
    }
  });
  it('passo salvo > novo total: finaliza e paga o proporcional (sem perder nem ganhar de graça)', () => {
    const n = sanitizeRogueRun(antigo({ step: 24, won: 20 }))!;
    expect(isFinished(n)).toBe(true);
    expect(Math.abs(rogueBits(n) - 20)).toBeLessThanOrEqual(1);
    const meio = sanitizeRogueRun(antigo({ step: 20, won: 16, paidWon: 10, power: 5, bonusPending: true }))!;
    expect(meio.step).toBeLessThan(ROGUE_MAX_STEPS);
    expect(meio.bonusPending).toBe(true);
    expect(meio.paidWon).toBeLessThanOrEqual(meio.won);
  });
  it('idempotente: reler o já convertido não muda nada; save novo passa intacto', () => {
    const once = sanitizeRogueRun(antigo({ step: 19, won: 14, power: 4, vigor: 3, shield: 2, paidWon: 9 }))!;
    expect(sanitizeRogueRun(JSON.parse(JSON.stringify(once)))).toEqual(once);
    const novo = { ...emptyRun(D), step: 7, won: 5, power: 2 };
    expect(sanitizeRogueRun(novo)).toEqual(novo);
  });
  it('incursão já paga continua paga (nada de pagar de novo)', () => {
    expect(sanitizeRogueRun(antigo({ step: 24, won: 24, paid: true }))!.paid).toBe(true);
  });
});

describe('Rift/Masmorra idle intactos', () => {
  it('lutas por andar da Masmorra seguem as constantes próprias', () => { expect(DUNGEON_FIGHTS_PER_FLOOR).toBeGreaterThan(0); });
});
