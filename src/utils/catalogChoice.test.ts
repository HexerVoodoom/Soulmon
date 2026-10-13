import { describe, it, expect } from 'vitest';
import { withoutExisting } from './catalogChoice';

describe('withoutExisting — "sem duplicar" na seleção de metas (beta-2, 7.3)', () => {
  const itens = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('tira o que já está na lista pelo catalogId, preservando a ordem do resto', () => {
    expect(withoutExisting(itens, [{ catalogId: 'b' }])).toEqual([{ id: 'a' }, { id: 'c' }]);
  });
  it('sem atividades existentes (ou sem catalogId, as criadas à mão), nada sai', () => {
    expect(withoutExisting(itens, undefined)).toEqual(itens);
    expect(withoutExisting(itens, [{}, { catalogId: null }, { catalogId: '' }])).toEqual(itens);
  });
  it('o mesmo item repetido na própria escolha entra uma vez só', () => {
    expect(withoutExisting([{ id: 'a' }, { id: 'a' }], [])).toEqual([{ id: 'a' }]);
  });
});
