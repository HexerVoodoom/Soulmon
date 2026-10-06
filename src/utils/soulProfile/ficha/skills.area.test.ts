// ---------------------------------------------------------------------------
// Q-AREA (contexto §2.16): a área do golpe vem POR ESCOLA. Conjuração e
// longo alcance recebem círculo de 4 m (raio-base do class-system); as outras
// escolas, alvo único. `realSkillPower` passa a usar `skill.area`.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { buildFichaESkills } from './fromInput';
import { withRealPower } from './realSkillPower';
import { areaDaEscola, ESCOLAS_DE_AREA, RAIO_AREA_BASE_METROS, type StageSkill } from './skills';
import { buildSoulProfile } from '../profile';
import { FICHA_STAGE_ORDER, type EscolaId } from './types';
import type { OracleInput } from '../../oracle';
import type { Answers } from '../personality/types';

const REFERENCE_DAY = new Date('2026-08-15T12:00:00Z');

function makeInput(nome: string, date = '1991-03-12'): OracleInput {
  const answers: Answers = {};
  const soulProfile = buildSoulProfile({
    fullName: nome, birthDate: date, birthTime: '08:20', timeUnknown: false,
    placeLabel: 'Curitiba - PR, BR', latitude: -25.4284, longitude: -49.2733, timeZone: 'America/Sao_Paulo',
  }, answers, REFERENCE_DAY);
  return {
    fullName: nome, birthDate: date, birthTime: '08:20', birthPlace: 'Curitiba - PR, BR',
    answers: { grupo: 'protege', objetivo: 'cuidar', pressao: 'firme' }, soulProfile,
  };
}

const TODAS: EscolaId[] = ['combate_fisico', 'longo_alcance', 'conjuracao', 'benca', 'maldicao', 'evocacao'];

describe('Q-AREA: área por escola', () => {
  it('conjuração e longo alcance: círculo de 4 m; as outras: único', () => {
    expect([...ESCOLAS_DE_AREA].sort()).toEqual(['conjuracao', 'longo_alcance']);
    expect(RAIO_AREA_BASE_METROS).toBe(4);
    for (const e of TODAS) {
      expect(areaDaEscola(e)).toEqual(ESCOLAS_DE_AREA.includes(e) ? { tipo: 'circulo', raioMetros: 4 } : { tipo: 'unico' });
    }
  });

  it('RED: a regra reprova se uma escola de alvo único virar círculo', () => {
    expect(areaDaEscola('benca')).not.toEqual({ tipo: 'circulo', raioMetros: 4 });
    expect(areaDaEscola('combate_fisico').tipo).toBe('unico');
  });

  it('toda skill gerada traz `area` pela regra e é determinística por (ficha, estágio)', () => {
    const vistas = new Set<string>();
    for (const [i, nome] of ['Area Um', 'Area Dois', 'Area Tres', 'Area Quatro', 'Area Cinco', 'Area Seis'].entries()) {
      const input = makeInput(nome, `19${80 + i}-0${1 + i}-1${i}`);
      const a = buildFichaESkills(input, `area-${i}`).stageSkills;
      const b = buildFichaESkills(input, `area-${i}`).stageSkills;
      for (const stage of FICHA_STAGE_ORDER) {
        for (const tipo of ['basica', 'especial'] as const) {
          const s: StageSkill = a[stage][tipo];
          expect(s.area).toEqual(areaDaEscola(s.escolaId));
          expect(s.area).toEqual(b[stage][tipo].area);
          vistas.add(s.escolaId);
        }
      }
    }
    expect(vistas.size).toBeGreaterThan(0);
  });

  it('`realSkillPower` respeita `skill.area`: o círculo muda o poder mostrado', async () => {
    const input = makeInput('Area Poder');
    const { fichaByStage, stageSkills } = buildFichaESkills(input, 'area-poder');
    const base = stageSkills.champion;
    const unico = { ...base, especial: { ...base.especial, area: { tipo: 'unico' } as const } };
    const circulo = { ...base, especial: { ...base.especial, area: { tipo: 'circulo', raioMetros: 4 } as const } };
    const a = await withRealPower(fichaByStage.champion, unico);
    const b = await withRealPower(fichaByStage.champion, circulo);
    expect(a.especial.poder).toBeGreaterThan(0);
    expect(b.especial.poder).not.toBe(a.especial.poder);
  });
});
