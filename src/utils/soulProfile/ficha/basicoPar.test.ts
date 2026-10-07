// ---------------------------------------------------------------------------
// PR17 (§2.35): o NOME do golpe básico segue o elemento dominante (base OU par); a VANTAGEM elemental do par é
// decidida pela BASE DOMINANTE do par (o `elementoId` da básica, lido pela Arena, é sempre uma das 17 bases).
// ---------------------------------------------------------------------------
import { describe, expect, it } from 'vitest';
import { buildStageSkills } from './skills';
import { baseDominanteDoElemento, elementoNomeDe } from './elementoNome';
import { fighterIdentity } from '../../fighterIdentity';
import { COUNTERS, elementAdvantage } from '../../arena';
import { DERIVED_ELEMENT_PAIRS } from '../derivedElements';
import type { Ficha } from './types';

const fichaCom = (elementos: Ficha['elementos']): Ficha => ({
  nome: 'T', elementos, escolas: { combate_fisico: 5 }, recursos: { furia: 1 }, talentos: {}, profissoes: {},
  totals: { elementos: 0, escolas: 0, recursos: 0, talentos: 0, profissoes: 0 },
} as unknown as Ficha);

describe('baseDominanteDoElemento', () => {
  it('base -> ela mesma; par -> o componente de maior peso; empate/sem pesos -> o primeiro da receita', () => {
    expect(baseDominanteDoElemento('fogo')).toBe('fogo');
    expect(baseDominanteDoElemento('vapor', { fogo: 2, agua: 5 })).toBe('agua');
    expect(baseDominanteDoElemento('vapor', { fogo: 5, agua: 2 })).toBe('fogo');
    expect(baseDominanteDoElemento('vapor', { fogo: 3, agua: 3 })).toBe('fogo');
    expect(baseDominanteDoElemento('vapor')).toBe('fogo');
    expect(baseDominanteDoElemento('desconhecido')).toBe('desconhecido');
  });
  it('todo par resolve para uma base que a tabela de vantagem conhece', () => {
    for (const d of DERIVED_ELEMENT_PAIRS) {
      expect(COUNTERS[baseDominanteDoElemento(d.id, { [d.componentes[1]]: 9 })]).toBeDefined();
      expect(d.componentes).toContain(baseDominanteDoElemento(d.id));
    }
  });
});

describe('golpe básico com par dominante', () => {
  const ficha = fichaCom({ fogo: 2, agua: 4, terra: 1, vapor: 4 }); // par pesa x CUSTO_PONTO_PAR: 4 x 3 > agua 4
  it('o nome segue o par; o elementoId (vantagem) é a base dominante do par', () => {
    const s = buildStageSkills(ficha, 'champion' as never, 'seed-pr17');
    const dom = s.elementoDominante!.id;
    expect(dom).toBe('vapor');
    expect(s.basica.elementoId).toBe('agua'); // vantagem pela base dominante do par (agua 4 > fogo 2)
    const par = elementoNomeDe(dom);
    expect(s.basica.nome.en).toContain(par.en);
    expect(s.basica.nome.pt).toContain(par.pt);
    expect(s.basica.elementoId).toBe(baseDominanteDoElemento(dom, ficha.elementos));
    expect(COUNTERS[s.basica.elementoId]).toBeDefined();
  });
  it('base dominante: nome e elementoId continuam a própria base (como antes)', () => {
    const s = buildStageSkills(fichaCom({ fogo: 5, agua: 1 }), 'rookie' as never, 'seed-pr17');
    expect(s.elementoDominante!.id).toBe('fogo');
    expect(s.basica.elementoId).toBe('fogo');
    expect(s.basica.nome.en).toContain(elementoNomeDe('fogo').en);
  });
  it('a identidade de combate e a vantagem concordam: fx = par, vantagem = base do par', () => {
    const s = buildStageSkills(ficha, 'champion' as never, 'seed-pr17');
    const id = fighterIdentity(s);
    expect(id.basico.elemento).toBe(s.elementoDominante!.id);
    expect(elementAdvantage(s.basica.elementoId, ['terra'])).toBe(elementAdvantage(baseDominanteDoElemento(s.elementoDominante!.id, ficha.elementos), ['terra']));
  });
});
