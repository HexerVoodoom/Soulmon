import { describe, it, expect } from 'vitest';
import { applyFeat, emitFeat, sanitizeFeats, subscribeFeats, FEAT_CAP } from './feats';

describe('feats', () => {
  it('add soma, max guarda o maior, id estranho e valor ruim devolvem o MESMO objeto', () => {
    let f = applyFeat(undefined, 'zipSolved');
    f = applyFeat(f, 'zipSolved');
    expect(f.zipSolved).toBe(2);
    f = applyFeat(f, 'barrageBest', 800);
    const g = applyFeat(f, 'barrageBest', 300);
    expect(g).toBe(f);
    expect(applyFeat(f, 'barrageBest', 900).barrageBest).toBe(900);
    expect(applyFeat(f, 'nope' as never)).toBe(f);
    expect(applyFeat(f, 'zipSolved', -1)).toBe(f);
    expect(applyFeat({ zipSolved: FEAT_CAP }, 'zipSolved').zipSolved).toBe(FEAT_CAP);
  });
  it('sanitize: lixo vira undefined, chaves fora do catálogo caem, inteiros limitados', () => {
    expect(sanitizeFeats(null)).toBeUndefined();
    expect(sanitizeFeats([1])).toBeUndefined();
    expect(sanitizeFeats({ zipSolved: 3.9, hack: 5, regens: -1, barrageBest: 1e12 })).toEqual({ zipSolved: 3, barrageBest: FEAT_CAP });
  });
  it('o barramento entrega ao assinante e sem assinante é no-op', () => {
    emitFeat('regens');
    const vistos: [string, number][] = [];
    const un = subscribeFeats((k, v) => vistos.push([k, v]));
    emitFeat('regens');
    emitFeat('barrageBest', 70);
    un();
    emitFeat('regens');
    expect(vistos).toEqual([['regens', 1], ['barrageBest', 70]]);
  });
});
