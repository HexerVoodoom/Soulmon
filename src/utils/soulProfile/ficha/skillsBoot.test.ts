/**
 * O cache de skills gravado no boot (App.tsx, sem abrir a página do Pet) tem que ser aceito por `skillsTemFamilia`
 * e dar ao selo de combate o NOME do especial, nunca o genérico "ESPECIAL!".
 */
import { describe, it, expect } from 'vitest';
import { buildStageSkills } from './skills';
import { skillsTemFamilia, stageSkillsFor } from './stageSkillsFor';
import { specialLabel, SPECIAL_LABEL } from '../../combatFx';
import type { Ficha } from './types';

const ficha: Ficha = {
  nome: 'T', elementos: { fogo: 3, agua: 2 }, escolas: { combate_fisico: 5 }, recursos: { mana: 2 }, talentos: {}, profissoes: {},
  totals: { elementos: 5, escolas: 5, recursos: 2, talentos: 0, profissoes: 0 },
};

describe('skills do boot -> selo do especial', () => {
  it('a ficha recém-montada é um cache completo e o selo mostra o nome real', () => {
    const rookie = buildStageSkills(ficha, 'rookie', 'seed');
    const skills = { rookie } as never;
    expect(skillsTemFamilia(skills)).toBe(true);
    const par = stageSkillsFor(skills, 'baby1');
    expect(specialLabel(true, par?.especial)).toBe(rookie.especial.nome.pt);
    expect(specialLabel(false, par?.especial)).toBe(rookie.especial.nome.en);
    expect(specialLabel(true, par?.especial)).not.toBe(SPECIAL_LABEL.pt);
  });
  it('sem ficha, cai no genérico', () => {
    expect(specialLabel(true, undefined)).toBe(SPECIAL_LABEL.pt);
    expect(specialLabel(false, null)).toBe(SPECIAL_LABEL.en);
  });
});
