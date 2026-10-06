/**
 * PR9b — `evocacao` deixou de ser escola de SKILL (decisão do dono, contexto §2.24).
 *
 * A evocação segue só como PONTOS da ficha (captura de companheiro e requisitos de talento do class-system).
 * Nenhuma tabela do combate a tem: skill, forma do golpe, papel da Arena, família padrão e peso de família.
 * Este arquivo prova duas coisas: (1) a ficha, mesmo com evocação altíssima, nunca produz skill de evocação;
 * (2) um save/cache ANTIGO com `escolaId: 'evocacao'` (e lixo parecido) nunca quebra nenhum consumidor — cai na escola
 * padrão — e o cache velho é trocado quando a ficha recalcula.
 */
import { describe, it, expect } from 'vitest';
import { buildAllStageSkills, buildStageSkills, escolaDominante, areaDaEscola } from './skills';
import { SCHOOL_STRIKE_FORM } from './strikeForm';
import { PESO_FAMILIA_ESCOLA } from './nomeEspecial';
import { skillsTemFamilia, type FichaSkills } from './stageSkillsFor';
import { ESCOLAS_SKILL, ESCOLA_SKILL_PADRAO, escolaSkillSegura, FICHA_STAGE_ORDER, type Ficha } from './types';
import { ROLE_SHAPE, ESCOLA_FAMILY_PADRAO, familyOfEscola, familyOfSkill, simulateArenaRunV3 } from '../../arena';
import { skillStrikeForm, fighterStrikeForm, strikeKindForSchool } from '../../combatFx';
import { dungeonFamily } from '../../dungeonFight';
import { REFERENCE_BUILDS } from '../../combate/level';

const fichaComEvocacao = (escolas: Ficha['escolas']): Ficha => ({
  nome: 'T', elementos: { fogo: 4, agua: 2 }, escolas, recursos: { mana: 2 }, talentos: {}, profissoes: {},
  totals: { elementos: 6, escolas: 0, recursos: 2, talentos: 0, profissoes: 0 },
});

describe('a ficha nunca produz skill de evocação', () => {
  it('evocação MUITO maior que todas as outras: a escola da skill continua sendo uma das 5', () => {
    for (const outra of ESCOLAS_SKILL) {
      const f = fichaComEvocacao({ evocacao: 30, [outra]: 1 });
      expect(escolaDominante(f)).toBe(outra);
    }
    expect(ESCOLAS_SKILL).toContain(escolaDominante(fichaComEvocacao({ evocacao: 30 }))); // sem nenhum ponto de skill: a primeira das 5, nunca evocação
  });

  it('as 5 jornadas inteiras (todos os estágios) saem só com escolas de skill, formas e família válidas', () => {
    for (const lider of ESCOLAS_SKILL) {
      const porEstagio = Object.fromEntries(FICHA_STAGE_ORDER.map(s => [s, fichaComEvocacao({ evocacao: 25, [lider]: 6 })]));
      const jornada = buildAllStageSkills(porEstagio as never, `evo-${lider}`, 'fogo');
      for (const s of FICHA_STAGE_ORDER) for (const tipo of ['basica', 'especial'] as const) {
        const sk = jornada[s][tipo];
        expect(sk.escolaId).toBe(lider);
        expect(ESCOLAS_SKILL).toContain(sk.escolaId);
        expect(['melee', 'ranged']).toContain(sk.forma);
      }
    }
  });

  it('nenhuma tabela do combate tem a chave `evocacao`', () => {
    for (const tabela of [SCHOOL_STRIKE_FORM, PESO_FAMILIA_ESCOLA, ROLE_SHAPE, ESCOLA_FAMILY_PADRAO]) {
      expect(Object.keys(tabela).sort()).toEqual([...ESCOLAS_SKILL].sort());
    }
  });
});

describe('save/cache antigo com `escolaId: evocacao` (ou lixo) nunca quebra', () => {
  const LEGADO = ['evocacao', 'Evocacao', '', 'constructor', '__proto__', 'toString', 7, null, undefined, {}];

  it('escolaSkillSegura: o que não é das 5 vira a padrão', () => {
    for (const x of LEGADO) expect(escolaSkillSegura(x), String(x)).toBe(ESCOLA_SKILL_PADRAO);
    for (const e of ESCOLAS_SKILL) expect(escolaSkillSegura(e)).toBe(e);
  });

  it('forma do golpe, família, papel da Arena e área: todos respondem com valor válido', () => {
    for (const x of LEGADO) {
      const id = x as never;
      for (const role of ['basica', 'especial'] as const) {
        expect(['melee', 'ranged'], `${String(x)}/${role}`).toContain(skillStrikeForm({ escolaId: id }, role));
        expect(['melee', 'ranged']).toContain(fighterStrikeForm({ skill: { escolaId: id } }, role));
      }
      expect(['melee', 'ranged']).toContain(strikeKindForSchool(id));
      expect(SPECIALS).toContain(familyOfEscola(id));
      expect(SPECIALS).toContain(familyOfSkill({ escolaId: id }));
      expect(SPECIALS).toContain(dungeonFamily({ escolaId: id }));
      expect(areaDaEscola(id).tipo).toBeDefined();
    }
    // a família salva na skill (cache) vale mesmo com a escola antiga
    expect(familyOfSkill({ escolaId: 'evocacao', familia: 'spdBuff' })).toBe('spdBuff');
  });

  it('a Arena v3 roda com `escolaBasica: evocacao` de save antigo (papel neutro por escola padrão), sem erro e determinística', () => {
    const base = { level: 10, build: REFERENCE_BUILDS.balanced, family: 'direct' as const, area: 'single' as const };
    const cfg = { ...base, escolaBasica: 'evocacao' as never };
    const a = simulateArenaRunV3(cfg, 3, 'media');
    expect(a).toEqual(simulateArenaRunV3(cfg, 3, 'media'));
    const padrao = simulateArenaRunV3({ ...base, escolaBasica: ESCOLA_SKILL_PADRAO }, 3, 'media');
    expect(a).toEqual(padrao); // evocação antiga = a escola padrão, byte a byte
  });

  it('o cache com `evocacao` não conta como atual: a ficha recalcula e o troca (o que já é válido fica)', () => {
    const novo = buildAllStageSkills(
      Object.fromEntries(FICHA_STAGE_ORDER.map(s => [s, fichaComEvocacao({ benca: 5 })])) as never, 'cache', 'fogo',
    ) as FichaSkills;
    expect(skillsTemFamilia(novo)).toBe(true);
    const velho = structuredClone(novo) as FichaSkills;
    (velho.rookie!.especial as { escolaId: string }).escolaId = 'evocacao';
    expect(skillsTemFamilia(velho)).toBe(false);
    const velhoBasica = structuredClone(novo) as FichaSkills;
    (velhoBasica.champion!.basica as { escolaId: string }).escolaId = 'evocacao';
    expect(skillsTemFamilia(velhoBasica)).toBe(false);
    const semLex = structuredClone(novo) as FichaSkills;
    delete (semLex.mega!.especial as { lex?: unknown }).lex;
    expect(skillsTemFamilia(semLex)).toBe(false);
  });

  it('buildStageSkills com a ficha ignora o `evocacao` do estágio (um par estável, mesma seed = mesmo par)', () => {
    const f = fichaComEvocacao({ evocacao: 12, maldicao: 2 });
    expect(buildStageSkills(f, 'ultimate', 's')).toEqual(buildStageSkills(f, 'ultimate', 's'));
  });
});

const SPECIALS = ['direct', 'dot', 'heal', 'shield', 'atkBuff', 'defDebuff', 'spdBuff'];
