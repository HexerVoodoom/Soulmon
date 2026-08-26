import { describe, it, expect } from 'vitest';
import { applyInstantHeal, instantHealRefusal, type InstantHealState } from './instantHeal';

/**
 * O DOIS-TOQUES da cura por Créditos (X-6, instância 1 — a de dinheiro real).
 *
 * Aqui a segunda aplicação encadeada representa duas coisas ao mesmo tempo: o
 * segundo toque no mesmo lote e a segunda resposta do servidor chegando depois
 * de uma cura já aplicada. Nos dois casos a vida NÃO pode passar do máximo nem
 * consumir uma cura que não existe — e o espelho do saldo tem de continuar
 * dizendo a verdade do servidor.
 */

const base = (over: Partial<InstantHealState> = {}): InstantHealState => ({
  healthPoints: 4,
  maxHealthPoints: 5,
  credits: 100,
  accountTier: 'paid',
  ...over,
});

describe('applyInstantHeal — a recusa é reconferida sobre o prev', () => {
  it('4/5 de vida: duas respostas encadeadas curam UMA vez, não duas', () => {
    const a = applyInstantHeal(base(), { credits: 90, tier: 'paid' });
    const b = applyInstantHeal(a.state, { credits: 80, tier: 'paid' });

    expect(a.refused).toBeUndefined();
    expect(a.state.healthPoints).toBe(5);
    expect(b.refused).toBe('already-full');
    expect(b.state.healthPoints).toBe(5);
  });

  it('mesmo recusando, o espelho do saldo obedece ao servidor — a UI não pode mentir', () => {
    const a = applyInstantHeal(base(), { credits: 90, tier: 'paid' });
    const b = applyInstantHeal(a.state, { credits: 80, tier: 'paid' });
    expect(a.state.credits).toBe(90);
    // O débito ACONTECEU lá fora. Esconder isso seria pior que o débito.
    expect(b.state.credits).toBe(80);
    expect(b.state.accountTier).toBe('paid');
  });

  it('3/5 de vida: duas curas legítimas continuam curando duas vezes', () => {
    const a = applyInstantHeal(base({ healthPoints: 3 }), { credits: 90, tier: 'paid' });
    const b = applyInstantHeal(a.state, { credits: 80, tier: 'paid' });
    expect(a.state.healthPoints).toBe(4);
    expect(b.state.healthPoints).toBe(5);
    expect(b.refused).toBeUndefined();
  });

  it('instantHealRefusal é a MESMA pergunta que a de fora — é ela que evita a COBRANÇA', () => {
    expect(instantHealRefusal(base({ healthPoints: 5 }))).toBe('already-full');
    expect(instantHealRefusal(base({ healthPoints: 4 }))).toBeUndefined();
  });
});
