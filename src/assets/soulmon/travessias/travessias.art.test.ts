import { describe, it, expect } from 'vitest';
import { REGIONS } from '../../../data/travessiasCatalog';
import { TRAVESSIA_ICON_ART, travessiaIcon } from './index';

describe('ícones das Travessias — ligação por id do desafio', () => {
  const ids = REGIONS.flatMap(r => r.challenges.map(c => c.id));
  it('todo desafio do catálogo tem ícone (21 de 21, incl. trv-c-gelo-2)', () => {
    expect(ids).toHaveLength(21);
    expect(ids.filter(id => !travessiaIcon(id))).toEqual([]);
    expect(travessiaIcon('trv-c-gelo-2')).toBeDefined();
  });
  it('nenhum ícone órfão: toda arte é de um desafio que existe', () => {
    expect(Object.keys(TRAVESSIA_ICON_ART).filter(k => !ids.includes(k))).toEqual([]);
  });
  it('sem arte → undefined (o chamador cai no glifo da área)', () => {
    expect(travessiaIcon('trv-c-nao-existe')).toBeUndefined();
    expect(travessiaIcon(undefined)).toBeUndefined();
  });
});
