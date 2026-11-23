import { describe, it, expect } from 'vitest';
import { markAccepted, markAsked, parsePlayReview, shouldAskReview, storeUrl } from './playReview';

describe('pedido de avaliação na Play', () => {
  it('pergunta a CADA evolução para cima; nunca para baixo nem sem estágio anterior', () => {
    expect(shouldAskReview({}, 0, 1)).toBe(true);
    expect(shouldAskReview(markAsked({}, 5), 1, 2)).toBe(true); // "Agora não" não bloqueia
    expect(shouldAskReview({}, 2, 1)).toBe(false);
    expect(shouldAskReview({}, 1, 1)).toBe(false);
    expect(shouldAskReview({}, -1, 1)).toBe(false);
  });
  it('depois de aceitar, nunca mais', () => {
    expect(shouldAskReview(markAccepted({}, 1), 0, 3)).toBe(false);
  });
  it('lê JSON ruim como vazio e guarda só campos válidos', () => {
    expect(parsePlayReview('lixo')).toEqual({});
    expect(parsePlayReview(null)).toEqual({});
    expect(parsePlayReview('{"accepted":true,"lastAskedAt":"x","extra":1}')).toEqual({ accepted: true });
    expect(parsePlayReview(JSON.stringify(markAccepted({}, 7)))).toEqual({ accepted: true, lastAskedAt: 7 });
  });
  it('link da loja é o pacote do app', () => { expect(storeUrl()).toBe('market://details?id=com.soulmon'); });
});
