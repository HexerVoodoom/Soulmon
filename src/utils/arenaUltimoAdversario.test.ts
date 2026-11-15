/** §384 (dono, 14/11/2026): "Faz o último adversário dropar o dobro e está resolvido". */
import { describe, it, expect } from 'vitest';
import { ARENA_ULTIMO_DROP_MULT, arenaRoundDrops } from './arenaUltimoAdversario';
import { applyEssences } from './essences';

describe('arenaRoundDrops', () => {
  it('o multiplicador é 2', () => { expect(ARENA_ULTIMO_DROP_MULT).toBe(2); });
  it('fora da última rodada: os drops passam iguais, nada dobrado', () => {
    const r = arenaRoundDrops([[{ id: 'fogo', qty: 1 }], [{ id: 'agua', qty: 2 }]], false);
    expect(r).toEqual({ drops: [{ id: 'fogo', qty: 1 }, { id: 'agua', qty: 2 }], dobrados: [] });
  });
  it('na última rodada só o ÚLTIMO adversário dobra (todos os drops dele, inclusive o do sprite curado)', () => {
    const r = arenaRoundDrops([[{ id: 'fogo', qty: 1 }], [{ id: 'trevas', qty: 3 }, { id: 'lua', qty: 3 }]], true);
    expect(r.drops).toEqual([{ id: 'fogo', qty: 1 }, { id: 'trevas', qty: 6 }, { id: 'lua', qty: 6 }]);
    expect(r.dobrados).toEqual([{ id: 'trevas', qty: 6 }, { id: 'lua', qty: 6 }]);
  });
  it('chefe sem elemento identificável: nada a dobrar', () => {
    expect(arenaRoundDrops([[]], true)).toEqual({ drops: [], dobrados: [] });
    expect(arenaRoundDrops([], true)).toEqual({ drops: [], dobrados: [] });
  });
  it('o updater aplica exatamente o vetor mostrado (sem teto diário próprio)', () => {
    const { drops } = arenaRoundDrops([[{ id: 'fogo', qty: 3 }]], true);
    const s = applyEssences({ essences: { fogo: 10 } } as { essences?: Record<string, number> }, drops);
    expect(s.essences?.fogo).toBe(16);
  });
});
