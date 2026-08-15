// ---------------------------------------------------------------------------
// Contrato entre as DUAS metades do oráculo (ver docs/ORACULO.md).
//
// A leitura foi trocada (utils/soulProfile/) e a criação não (utils/oracle.ts).
// Este arquivo trava exatamente a costura entre elas — o que quebraria em
// silêncio se alguém mexesse num lado sem olhar o outro:
//
//   1. com perfil de alma, os eixos vêm DELE (e não da leitura legada);
//   2. sem perfil de alma, o caminho legado continua inteiro — é o que mantém
//      o reroll de quem já tinha um perfil salvo antes da troca;
//   3. o perfil sobrevive a JSON, porque é assim que ele é guardado;
//   4. o resultado continua determinístico por (entrada, seed).
// ---------------------------------------------------------------------------

import { describe, expect, it } from 'vitest';
import { generateOracle, ELEMENT_ORDER, REALM_ORDER, ROLE_ORDER, ALIGNMENT_ORDER } from './oracle';
import type { OracleInput } from './oracle';
import { buildSoulProfile } from './soulProfile';
import { items } from './soulProfile/personality/questions';
import type { Answers, LikertValue } from './soulProfile/personality/types';

const SAO_PAULO = {
  placeLabel: 'São Paulo - SP, BR',
  latitude: -23.5505,
  longitude: -46.6333,
  timeZone: 'America/Sao_Paulo',
};

/** Protocolo completo, parametrizado, para gerar perfis diferentes entre si. */
function answersFor(likert: LikertValue, choice: 'a' | 'b', scenario: string): Answers {
  const out: Answers = {};
  for (const item of items) {
    if (item.kind === 'likert' || item.kind === 'frequency') out[item.id] = { kind: 'likert', value: likert };
    else if (item.kind === 'forced-choice') out[item.id] = { kind: 'forced-choice', choice };
    else out[item.id] = { kind: 'scenario', optionId: scenario };
  }
  return out;
}

const onboarding = (over: Partial<Parameters<typeof buildSoulProfile>[0]> = {}) => ({
  fullName: 'Maria Aparecida da Silva',
  birthDate: '1994-07-23',
  birthTime: '14:35',
  timeUnknown: false,
  ...SAO_PAULO,
  ...over,
});

const REFERENCE_DAY = new Date('2026-08-15T12:00:00Z');

function inputWithSoul(answers: Answers, over: Partial<OracleInput> = {}): OracleInput {
  const soulProfile = buildSoulProfile(onboarding(), answers, REFERENCE_DAY);
  return {
    fullName: 'Maria Aparecida da Silva',
    birthDate: '1994-07-23',
    birthTime: '14:35',
    birthPlace: SAO_PAULO.placeLabel,
    soulProfile,
    ...over,
  };
}

describe('oráculo: leitura nova (perfil de alma)', () => {
  it('usa os eixos do perfil de alma, não os da leitura legada', () => {
    const input = inputWithSoul(answersFor(5, 'a', 'a'));
    const result = generateOracle(input, 0);
    const axes = input.soulProfile!.oracle;

    // Sem preferências e sem descrição, `combineAxis` é identidade normalizada:
    // a ordem dos eixos tem que ser a MESMA que o motor novo entregou.
    const byScore = <K extends string>(order: K[], scores: Record<K, number>) =>
      [...order].sort((a, b) => scores[b] - scores[a]);

    expect(byScore(ELEMENT_ORDER, result.elementScores)[0]).toBe(axes.dominantElement);
    expect(byScore(ROLE_ORDER, result.roleScores)[0]).toBe(axes.dominantRole);
    expect(byScore(ALIGNMENT_ORDER, result.alignmentScores)[0]).toBe(axes.dominantAlignment);
    expect(byScore(REALM_ORDER, result.realmScores)[0]).toBe(axes.dominantRealm);
  });

  it('o Ascendente vem do mapa REAL quando a hora é conhecida', () => {
    const answers = answersFor(3, 'a', 'b');
    const soulProfile = buildSoulProfile(onboarding(), answers, REFERENCE_DAY);
    const result = generateOracle({
      fullName: 'Maria Aparecida da Silva', birthDate: '1994-07-23', birthTime: '14:35',
      birthPlace: SAO_PAULO.placeLabel, soulProfile,
    }, 0);
    expect(soulProfile.astrology.bigThree.ascendant).toBeTruthy();
    expect(result.western.ascendant.name.pt).toBe(soulProfile.astrology.bigThree.ascendant);
  });

  it('sem hora de nascimento o mapa NÃO inventa Ascendente — cai na aproximação e avisa', () => {
    const answers = answersFor(3, 'a', 'b');
    const soulProfile = buildSoulProfile(onboarding({ timeUnknown: true }), answers, REFERENCE_DAY);
    expect(soulProfile.astrology.bigThree.ascendant).toBeNull();
    expect(soulProfile.astrology.warnings.length).toBeGreaterThan(0);
    // Ainda assim a criatura sai: o resumo de personalidade usa o ascendente
    // aproximado, declarado como aproximado na UI.
    const result = generateOracle({
      fullName: 'Maria Aparecida da Silva', birthDate: '1994-07-23', birthTime: '12:00',
      birthPlace: SAO_PAULO.placeLabel, soulProfile,
    }, 0);
    expect(result.western.ascendant.name.pt).toBeTruthy();
  });

  it('respostas diferentes geram criaturas diferentes com a mesma seed', () => {
    // O ponto de trocar o motor: a leitura antiga não distinguia duas pessoas
    // de mesmo nome/nascimento — só as 6 respostas do quiz separavam. Agora o
    // teste inteiro entra na semente.
    const a = generateOracle(inputWithSoul(answersFor(5, 'a', 'a')), 7);
    const b = generateOracle(inputWithSoul(answersFor(1, 'b', 'd')), 7);
    expect(a.creature.baseName).not.toBe(b.creature.baseName);
  });

  it('é determinístico: mesma entrada e mesma seed = mesma criatura', () => {
    const answers = answersFor(4, 'b', 'c');
    const a = generateOracle(inputWithSoul(answers), 123);
    const b = generateOracle(inputWithSoul(answers), 123);
    expect(a.creature.baseName).toBe(b.creature.baseName);
    expect(a.dominantElement).toBe(b.dominantElement);
    expect(a.creature.stages.map(s => s.name)).toEqual(b.creature.stages.map(s => s.name));
  });

  it('sobrevive a JSON — é assim que o perfil é guardado para o reroll', () => {
    const input = inputWithSoul(answersFor(2, 'a', 'b'));
    const direct = generateOracle(input, 42);
    const roundTripped = generateOracle(JSON.parse(JSON.stringify(input)) as OracleInput, 42);
    expect(roundTripped.creature.baseName).toBe(direct.creature.baseName);
    expect(roundTripped.dominantRealm).toBe(direct.dominantRealm);
  });

  it('as 11 formas continuam saindo — a metade criativa não foi tocada', () => {
    const result = generateOracle(inputWithSoul(answersFor(4, 'a', 'a')), 1);
    expect(result.creature.stages).toHaveLength(11);
    for (const stage of result.creature.stages) {
      expect(stage.imagePrompt.length).toBeGreaterThan(0);
    }
  });
});

describe('oráculo: caminho de quem responde SÓ as 6 perguntas', () => {
  // É o caminho padrão do ritual — o teste de 20 itens é opt-in. Aqui o perfil
  // de alma existe (mapa astral real + numerologia completa), mas a camada
  // psicométrica está vazia: os traços ficam neutros e quem carrega o sinal de
  // personalidade são as 6 respostas.
  const semTeste = (quiz: Record<string, string>): OracleInput => ({
    fullName: 'Maria Aparecida da Silva',
    birthDate: '1994-07-23',
    birthTime: '14:35',
    birthPlace: SAO_PAULO.placeLabel,
    answers: quiz,
    soulProfile: buildSoulProfile(onboarding(), {}, REFERENCE_DAY),
  });

  it('gera criatura completa sem nenhuma resposta do teste longo', () => {
    const r = generateOracle(semTeste({ grupo: 'protege', objetivo: 'conquistar' }), 3);
    expect(r.creature.stages).toHaveLength(11);
    expect(r.creature.baseName.length).toBeGreaterThan(0);
  });

  it('ainda usa o mapa astral REAL — é o ganho que vale mesmo sem o teste', () => {
    const input = semTeste({ grupo: 'protege' });
    const r = generateOracle(input, 3);
    expect(r.western.ascendant.name.pt).toBe(input.soulProfile!.astrology.bigThree.ascendant);
  });

  it('AS 6 RESPOSTAS MUDAM O RESULTADO — senão o ritual inteiro não conta', () => {
    // Regressão real: ao trocar os eixos pelo motor novo, os efeitos do quiz
    // eram descartados. Para quem não faz o teste longo isso significaria um
    // ritual de 6 perguntas que não influencia nada.
    const protetor = generateOracle(semTeste({
      grupo: 'protege', objetivo: 'cuidar', pressao: 'firme',
    }), 5);
    const agressivo = generateOracle(semTeste({
      grupo: 'ataca', objetivo: 'conquistar', pressao: 'explode',
    }), 5);
    const mudou = protetor.dominantElement !== agressivo.dominantElement
      || protetor.dominantRole !== agressivo.dominantRole
      || protetor.dominantAlignment !== agressivo.dominantAlignment
      || protetor.dominantRealm !== agressivo.dominantRealm;
    expect(mudou).toBe(true);
  });

  it('responder as 20 muda a leitura — é o que a pessoa ganha por responder', () => {
    // O contrato é sobre a LEITURA (os escores), não sobre o vencedor de cada
    // eixo: refinar pode deixar o mesmo elemento no topo e ainda assim mudar o
    // quanto ele domina. Exigir que algum argmax vire seria exigir que o teste
    // CONTRADIGA a pessoa, que não é o que ele existe para fazer.
    const quiz = { grupo: 'protege', objetivo: 'cuidar', pressao: 'firme' };
    const so6 = generateOracle(semTeste(quiz), 5);
    const com20 = generateOracle({
      ...semTeste(quiz),
      soulProfile: buildSoulProfile(onboarding(), answersFor(5, 'a', 'a'), REFERENCE_DAY),
    }, 5);
    expect(ELEMENT_ORDER.map(e => so6.elementScores[e]))
      .not.toEqual(ELEMENT_ORDER.map(e => com20.elementScores[e]));
    expect(ROLE_ORDER.map(r => so6.roleScores[r]))
      .not.toEqual(ROLE_ORDER.map(r => com20.roleScores[r]));
  });

  it('duas pessoas iguais, uma refinando e outra não, não recebem a mesma criatura', () => {
    const quiz = { grupo: 'protege', objetivo: 'cuidar', pressao: 'firme' };
    const so6 = generateOracle(semTeste(quiz), 5);
    const com20 = generateOracle({
      ...semTeste(quiz),
      soulProfile: buildSoulProfile(onboarding(), answersFor(1, 'b', 'd'), REFERENCE_DAY),
    }, 5);
    expect(so6.creature.baseName).not.toBe(com20.creature.baseName);
  });
});

describe('oráculo: caminho legado (sem perfil de alma)', () => {
  // Quem jogou antes da troca tem um `SOULMON_PROFILE` salvo SEM soulProfile.
  // Se este teste cair, o reroll dessas pessoas — que pode ter sido pago em
  // Créditos, ou seja, em dinheiro real — para de funcionar.
  const legacy: OracleInput = {
    fullName: 'Maria Aparecida da Silva',
    birthDate: '1994-07-23',
    birthTime: '14:35',
    birthPlace: 'São Paulo, Brasil',
    answers: { grupo: 'protege', objetivo: 'conquistar', pressao: 'firme' },
  };

  it('gera criatura completa sem perfil de alma', () => {
    const result = generateOracle(legacy, 9);
    expect(result.creature.baseName.length).toBeGreaterThan(0);
    expect(result.creature.stages).toHaveLength(11);
    expect(ELEMENT_ORDER).toContain(result.dominantElement);
  });

  it('continua determinístico', () => {
    expect(generateOracle(legacy, 9).creature.baseName)
      .toBe(generateOracle(legacy, 9).creature.baseName);
  });

  it('usa o ascendente APROXIMADO, já que não há mapa', () => {
    const result = generateOracle(legacy, 9);
    // Não há o que comparar com um mapa real; o contrato é só que o campo
    // exista e venha da tabela de signos do jogo.
    expect(result.western.ascendant.traits.length).toBeGreaterThan(0);
  });
});
