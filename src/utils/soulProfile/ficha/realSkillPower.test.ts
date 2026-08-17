// ---------------------------------------------------------------------------
// `withRealPower` chama o motor de verdade do class-system para dar às
// skills um número que não é só um rótulo baixo/alto fixo por tipo — e o
// contrato mínimo é: a especial (fatia alta da energia, perto do teto) tem
// que render mais poder que a básica (fatia baixa), pro motor real, não só
// no nome.
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { buildFichaESkills } from './fromInput';
import { withRealPower, withRealPowerAllStages } from './realSkillPower';
import { buildSoulProfile } from '../profile';
import { FICHA_STAGE_ORDER } from './types';
import type { OracleInput } from '../../oracle';
import type { Answers } from '../personality/types';

const REFERENCE_DAY = new Date('2026-08-15T12:00:00Z');

function makeInput(nome: string): OracleInput {
  const answers: Answers = {};
  const soulProfile = buildSoulProfile({
    fullName: nome, birthDate: '1991-03-12', birthTime: '08:20', timeUnknown: false,
    placeLabel: 'Curitiba - PR, BR', latitude: -25.4284, longitude: -49.2733, timeZone: 'America/Sao_Paulo',
  }, answers, REFERENCE_DAY);
  return {
    fullName: nome, birthDate: '1991-03-12', birthTime: '08:20', birthPlace: 'Curitiba - PR, BR',
    answers: { grupo: 'protege', objetivo: 'cuidar', pressao: 'firme' }, soulProfile,
  };
}

describe('withRealPower', () => {
  it('preenche `poder` com um número real, especial > básica, para todo estágio', async () => {
    const input = makeInput('Poder Real Teste');
    const { fichaByStage, stageSkills } = buildFichaESkills(input, 'poder-real-1');
    for (const stage of FICHA_STAGE_ORDER) {
      const enriquecida = await withRealPower(fichaByStage[stage], stageSkills[stage]);
      expect(enriquecida.basica.poder).toBeGreaterThan(0);
      expect(enriquecida.especial.poder).toBeGreaterThan(0);
      expect(enriquecida.especial.poder!).toBeGreaterThan(enriquecida.basica.poder!);
      // nome/descrição/elemento originais preservados — só ganhou o número
      expect(enriquecida.basica.nome).toEqual(stageSkills[stage].basica.nome);
    }
  });

  it('withRealPowerAllStages devolve todos os 5 estágios enriquecidos de uma vez', async () => {
    const input = makeInput('Poder Real Teste 2');
    const { fichaByStage, stageSkills } = buildFichaESkills(input, 'poder-real-2');
    const todas = await withRealPowerAllStages(fichaByStage, stageSkills);
    for (const stage of FICHA_STAGE_ORDER) {
      expect(todas[stage].basica.poder).toBeGreaterThan(0);
      expect(todas[stage].especial.poder).toBeGreaterThan(0);
    }
  });

  it('o poder cresce com o estágio — o reajuste por forma pedido pelo dono vem da progressão real', async () => {
    const input = makeInput('Poder Real Teste 3');
    const { fichaByStage, stageSkills } = buildFichaESkills(input, 'poder-real-3');
    const rookie = await withRealPower(fichaByStage.rookie, stageSkills.rookie);
    const ultra = await withRealPower(fichaByStage.ultra, stageSkills.ultra);
    expect(ultra.especial.poder!).toBeGreaterThan(rookie.especial.poder!);
  });
});
