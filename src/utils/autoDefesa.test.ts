import { describe, it, expect } from 'vitest';
import {
  autoDefense, defenseRoll, jeitoDefesaBonus,
  AUTO_DEF_MEAN, AUTO_DEF_SPREAD, AUTO_DEF_PERFECT, TIMING_DODGE_ENABLED,
} from './autoDefesa';
import { JEITO_PADRAO, jeitoDaProfissao } from './profissaoMasmorra';

describe('autoDefense — regra pura e determinística', () => {
  it('a barra de esquiva por timing está desligada', () => {
    expect(TIMING_DODGE_ENABLED).toBe(false);
  });

  it('defenseRoll: mesma (semente, n) = mesmo número; fica em [0,1); n diferente muda', () => {
    expect(defenseRoll(42, 3)).toBe(defenseRoll(42, 3));
    expect(defenseRoll(42, 3)).not.toBe(defenseRoll(42, 4));
    expect(defenseRoll(42, 3)).not.toBe(defenseRoll(43, 3));
    for (let i = 0; i < 2000; i++) {
      const r = defenseRoll(i * 7919, i);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThan(1);
    }
  });

  it('autoDefense: pura, precisão em 0..1, desfecho coerente com os limiares', () => {
    expect(autoDefense(0.3)).toEqual(autoDefense(0.3));
    expect(autoDefense(1).acc).toBeLessThanOrEqual(1);
    expect(autoDefense(0).acc).toBeGreaterThanOrEqual(0);
    expect(autoDefense(1).outcome).toBe('esquiva');
    expect(autoDefense(0).outcome).toBe('cheio');
    expect(autoDefense(0.5).acc).toBeCloseTo(AUTO_DEF_MEAN, 5);
    expect(autoDefense(Number.NaN).acc).toBeCloseTo(AUTO_DEF_MEAN, 5);
    // limiar perfeito do jeito (joalheiro 0,89) vale
    const r = 0.5 + (0.9 - AUTO_DEF_MEAN) / (2 * AUTO_DEF_SPREAD);
    expect(autoDefense(r).outcome).toBe('parcial');
    expect(autoDefense(r, { perfect: 0.89 }).outcome).toBe('esquiva');
  });

  it('paridade com a simulação da Arena: a mesma lei da `sampleAcc` (0,70 ± 0,25 uniforme)', () => {
    for (let i = 0; i <= 100; i++) {
      const r = i / 100;
      const sim = Math.min(1, Math.max(0, 0.7 + (r * 2 - 1) * 0.25));
      expect(autoDefense(r).acc).toBeCloseTo(sim, 10);
    }
  });

  it('jeitoDefesaBonus: ofício sem defesa = 0; luthier e tecelão somam', () => {
    expect(jeitoDefesaBonus(JEITO_PADRAO)).toBe(0);
    expect(jeitoDefesaBonus(jeitoDaProfissao('luthier'))).toBeGreaterThan(0);
    expect(jeitoDefesaBonus(jeitoDaProfissao('tecelao'))).toBeGreaterThan(0);
  });
});

// A simulação da Masmorra e do Pesadelo (e a defesa automática DENTRO delas) mora em `dungeon.v3.test.ts` e
// `nightmares.v3.test.ts`, sobre o núcleo v3 (PR4): as contas do motor antigo (`PLAYER_STATS`, `pveStrikeDamage`) saíram.
