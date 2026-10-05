/** PR1b — B2 (`fighterStrikeForm`, dono único) e N1 (`specialLabel` com nome da skill). */
import { describe, it, expect } from 'vitest';
import { fighterStrikeForm, specialLabel, SPECIAL_LABEL, SCHOOL_STRIKE_FORM, ELEMENT_STRIKE_FORM, elementStrikeForm } from './combatFx';
import type { EscolaId } from './soulProfile/ficha/types';

const ESCOLAS = Object.keys(SCHOOL_STRIKE_FORM) as EscolaId[];
const ELEMENTOS = Object.keys(ELEMENT_STRIKE_FORM);

describe('B2 — fighterStrikeForm', () => {
  it('com ficha a escola decide; sem ficha, o elemento', () => {
    expect(fighterStrikeForm({ skill: { escolaId: 'combate_fisico' }, element: 'fogo' }, 'basica')).toBe('melee');
    expect(fighterStrikeForm({ skill: { escolaId: 'conjuracao' }, element: 'terra' }, 'basica')).toBe('ranged');
    expect(fighterStrikeForm({ skill: { escolaId: 'maldicao' }, element: 'vigor' }, 'basica')).toBe('melee');
    expect(fighterStrikeForm({ skill: { escolaId: 'maldicao' }, element: 'vigor' }, 'especial')).toBe('ranged');
    expect(fighterStrikeForm({ element: 'fogo' }, 'basica')).toBe(elementStrikeForm('fogo', 'basica'));
    expect(fighterStrikeForm({ skill: null, element: 'terra' }, 'basica')).toBe('melee');
  });
  it(`varredura ${ESCOLAS.length} escolas × ${ELEMENTOS.length} elementos: com ficha o resultado não depende do elemento`, () => {
    expect(ESCOLAS.length).toBe(6);
    expect(ELEMENTOS.length).toBe(19);
    for (const escolaId of ESCOLAS) for (const role of ['basica', 'especial'] as const) {
      const set = new Set(ELEMENTOS.map(element => fighterStrikeForm({ skill: { escolaId }, element }, role)));
      expect([...set]).toEqual([SCHOOL_STRIKE_FORM[escolaId][role]]);
    }
  });
});

describe('N1 — specialLabel', () => {
  const skill = { nome: { pt: 'Lâmina do Crepúsculo', en: 'Dusk Blade' } };
  it('o nome próprio da skill vence; sem skill, o fallback', () => {
    expect(specialLabel(true, skill)).toBe('Lâmina do Crepúsculo');
    expect(specialLabel(false, skill)).toBe('Dusk Blade');
    expect(specialLabel(true)).toBe(SPECIAL_LABEL.pt);
    expect(specialLabel(false, null)).toBe(SPECIAL_LABEL.en);
  });
});
