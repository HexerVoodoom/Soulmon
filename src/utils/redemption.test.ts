/**
 * WP4.19 — a rota de redenção.
 *
 * Cair por HP 0 marcava o save (`degeneratedByHP`) e subir de novo não
 * marcava nada: o produto registrava o tombo e não registrava o levantar, ou
 * seja, escolhia qual metade da história contar. `applyRedemption` fecha o
 * arco — e as três travas abaixo são o que impede a marca de virar o oposto
 * do que ela é.
 */
import { describe, it, expect } from 'vitest';
import { applyRedemption } from './dailyReset';

describe('applyRedemption — o arco fecha', () => {
  it('evoluir depois de uma queda apaga a marca da queda e acende a da volta', () => {
    const depois = applyRedemption({ degeneratedByHP: true, redeemed: false }, true);
    expect(depois.redeemed).toBe(true);
    expect(depois.degeneratedByHP).toBe(false);
  });

  it('evoluir sem ter caído não inventa redenção', () => {
    // Marca de volta em quem nunca caiu é enfeite sem história — e o resto do
    // app leria como "houve queda", que é exatamente o que não pode.
    const antes = { degeneratedByHP: false };
    expect(applyRedemption(antes, true)).toBe(antes);
  });

  it('cair e NÃO evoluir não marca nada', () => {
    const antes = { degeneratedByHP: true };
    expect(applyRedemption(antes, false)).toBe(antes);
  });

  it('é idempotente: a segunda passada não muda nada (footgun 6)', () => {
    const um = applyRedemption({ degeneratedByHP: true, redeemed: false }, true);
    const dois = applyRedemption(um, true);
    expect(dois).toBe(um);
  });

  it('não toca em mais nada do save', () => {
    const antes = {
      degeneratedByHP: true, perfectDays: 9, gamePoints: 700,
      unlockedEvolutions: ['rookie', 'champion-data'],
    };
    const depois = applyRedemption(antes, true);
    expect(depois.perfectDays).toBe(9);
    expect(depois.gamePoints).toBe(700);
    expect(depois.unlockedEvolutions).toBe(antes.unlockedEvolutions);
  });
});
