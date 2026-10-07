// PR15b — o registro da jornada: imutável, idempotente, higienizado; e a derivação lê o GRAVADO.
import { describe, expect, it } from 'vitest';
import { registrarEstagio, sanitizeFichaJornada, completarEstagios, type FichaJornada } from './fichaJornada';
import { buildFichaESkills } from './soulProfile/ficha/fromInput';
import { evoluirFicha, planoDoComportamento, MIN_AMOSTRA } from './soulProfile/ficha/comportamento';
import { buildSoulProfile } from './soulProfile/profile';
import { applyRitualAnswers } from './soulProfile/ritualAnswers';
import { identityKey } from './soulProfile/identity';
import { perfilDaFicha } from './soulProfile/ficha/skills';
import type { OracleInput } from './oracle';

function makeInput(nome: string): OracleInput {
  const soulProfile = buildSoulProfile({
    fullName: nome, birthDate: '1990-04-12', birthTime: '08:20', timeUnknown: false,
    placeLabel: 'Curitiba - PR, BR', latitude: -25.4284, longitude: -49.2733, timeZone: 'America/Sao_Paulo',
  }, {}, new Date('2026-01-01T12:00:00Z'));
  return { fullName: nome, birthDate: '1990-04-12', birthTime: '08:20', birthPlace: 'Curitiba - PR, BR',
    answers: { grupo: 'protege', objetivo: 'cuidar', pressao: 'firme' }, soulProfile } as unknown as OracleInput;
}

const PODER = { power: 90, harmony: 5, benevolence: 5 };

describe('registro da jornada (PR15b)', () => {
  it('grava uma vez e é imutável: reevoluir ao mesmo estágio devolve a MESMA referência', () => {
    const a = registrarEstagio(undefined, 'champion', PODER, '2026-10-07')!;
    expect(a.estagios.champion?.galhos).toEqual(PODER);
    const b = registrarEstagio(a, 'champion', { power: 0, harmony: 99, benevolence: 0 }, '2026-10-20');
    expect(b).toBe(a);
    expect(b!.estagios.champion?.galhos).toEqual(PODER);
  });
  it('rookie não grava; save sem o campo segue sem ele', () => {
    expect(registrarEstagio(undefined, 'rookie', PODER, 'd')).toBeUndefined();
    expect(sanitizeFichaJornada(undefined)).toBeUndefined();
  });
  it('sanitize: lixo vira ausente, números ruins viram 0, estágio desconhecido some', () => {
    for (const lixo of [null, 1, 'x', [], { estagios: [] }, { estagios: {} }, { estagios: { rookie: { galhos: PODER } } }]) {
      expect(sanitizeFichaJornada(lixo)).toBeUndefined();
    }
    const s = sanitizeFichaJornada({ v: 9, estagios: { mega: { galhos: { power: -4, harmony: 'a', benevolence: 7 }, at: 3, familia: 5 } } })!;
    expect(s.estagios.mega).toEqual({ galhos: { power: 0, harmony: 0, benevolence: 7 }, at: '' });
  });
  it('completarEstagios preenche uma vez e depois devolve a mesma referência', () => {
    const a = registrarEstagio(undefined, 'champion', PODER, 'd')!;
    const b = completarEstagios(a, { champion: { plano: { fogo: 1 }, familia: 'x' } })!;
    expect(b.estagios.champion).toMatchObject({ familia: 'x', plano: { fogo: 1 } });
    expect(completarEstagios(b, { champion: { plano: null, familia: 'y' } })).toBe(b);
  });
});

describe('derivação a partir do registro (PR15b)', () => {
  const input = makeInput('Jornada Teste');
  const key = identityKey(input);

  it('sem registro = a ficha de antes, bit a bit (save legado não muda)', () => {
    const base = buildFichaESkills(input, key);
    expect(buildFichaESkills(input, key, undefined).fichaByStage).toEqual(base.fichaByStage);
    expect(buildFichaESkills(input, key, { v: 1, estagios: {} }).fichaByStage).toEqual(base.fichaByStage);
    expect(base.planoByStage).toEqual({});
  });

  it('com registro: só o estágio gravado muda, o orçamento é o mesmo, e é determinístico', () => {
    const j: FichaJornada = registrarEstagio(undefined, 'champion', PODER, 'd')!;
    const base = buildFichaESkills(input, key);
    const com = buildFichaESkills(input, key, j);
    expect(com.fichaByStage.rookie).toEqual(base.fichaByStage.rookie);
    expect(com.fichaByStage.ultimate).toEqual(base.fichaByStage.ultimate);
    expect(com.fichaByStage.champion.elementos).not.toEqual(base.fichaByStage.champion.elementos);
    const soma = (e: Record<string, number>) => Object.values(e).reduce((a, b) => a + b, 0);
    expect(soma(com.fichaByStage.champion.elementos as Record<string, number>)).toBeCloseTo(soma(base.fichaByStage.champion.elementos as Record<string, number>), 6);
    expect(buildFichaESkills(input, key, j).fichaByStage).toEqual(com.fichaByStage);
  });

  it('amostra abaixo do mínimo grava mas não pesa (ficha igual à base)', () => {
    const pouca = { power: Math.floor(MIN_AMOSTRA / 2), harmony: 0, benevolence: 0 };
    const j = registrarEstagio(undefined, 'champion', pouca, 'd')!;
    expect(buildFichaESkills(input, key, j).fichaByStage).toEqual(buildFichaESkills(input, key).fichaByStage);
  });

  it('a ficha do registro == a de `evoluirFicha` (uma só regra, duas portas)', () => {
    const j = registrarEstagio(undefined, 'champion', PODER, 'd')!;
    const { fichaByStage } = buildFichaESkills(input, key, j);
    const oracle = applyRitualAnswers(input.soulProfile!.oracle, input.answers, input.soulProfile!.psychometric.answeredCount > 0 ? 'longo' : 'curto');
    const rookie = fichaByStage.rookie;
    const r = evoluirFicha({
      anterior: { stage: 'rookie', ficha: rookie, familia: buildFichaESkills(input, key).stageSkills.rookie.especial.familia as never, perfil: perfilDaFicha(rookie) },
      janela: PODER, oracle, nome: input.fullName, seedKey: key, stage: 'champion',
    });
    expect(r.ficha).toEqual(fichaByStage.champion);
    expect(planoDoComportamento(PODER)).toEqual(buildFichaESkills(input, key, j).planoByStage.champion);
  });
});
