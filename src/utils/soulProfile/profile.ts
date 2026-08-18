// ---------------------------------------------------------------------------
// Perfil de alma — junta as três camadas e devolve os eixos do oráculo.
//
// Portado de `teste-personalidade/src/lib/profile.ts`.
//
// As três camadas NÃO têm o mesmo estatuto, e o código diz isso de propósito:
//
//   | Camada        | Base                          | Validade empírica |
//   |---------------|-------------------------------|-------------------|
//   | Psicométrica  | Big Five + HEXACO             | alta              |
//   | Astrológica   | efemérides reais + tropical   | nenhuma (simbólica)|
//   | Numerológica  | numerologia pitagórica        | nenhuma (simbólica)|
//
// Só a psicométrica tem evidência científica. As outras duas são sistemas
// simbólicos: o CÁLCULO astronômico é correto e verificável, a INTERPRETAÇÃO
// astrológica/numerológica não tem poder preditivo demonstrado. Elas estão
// aqui porque geram sabor narrativo denso e determinístico para a criatura —
// não porque digam algo verdadeiro sobre a pessoa. Os coeficientes de `axes.ts`
// pesam de acordo: os traços mandam, os símbolos temperam.
//
// Limite honesto que vale repetir: este teste NÃO é validado. Os itens são
// originais e nunca passaram por análise fatorial, calibração ou normatização
// em amostra. Ele é construído SEGUNDO princípios psicométricos, o que não é a
// mesma coisa que ser um instrumento validado — e nada aqui serve para uso
// clínico, diagnóstico ou seleção. É um gerador de criatura.
// ---------------------------------------------------------------------------

import { computeNatalChart } from './astrology/chart';
import { planetProminence } from './astrology/prominence';
import type { NatalChart } from './astrology/types';
import { computeNumerology, type NumerologyMap } from './numerology';
import { generateOracleAxes } from './axes';
import { scoreProfile } from './personality/scoring';
import type { Answers, PersonalityProfile } from './personality/types';
import type { OracleAxes } from './types';

export interface SoulOnboardingData {
  fullName: string;
  /** 'YYYY-MM-DD' */
  birthDate: string;
  /** 'HH:MM' — ignorado quando `timeUnknown`. */
  birthTime: string;
  timeUnknown: boolean;
  /** Rótulo legível do local ("São Paulo, SP"). */
  placeLabel: string;
  latitude: number;
  longitude: number;
  /** Fuso IANA ("America/Sao_Paulo") — é ele que faz o horário de verão
   *  histórico ser respeitado, e errar isso desloca o Ascendente ~15°. */
  timeZone: string;
}

export interface SoulProfile {
  onboarding: SoulOnboardingData;
  psychometric: PersonalityProfile;
  astrology: NatalChart;
  numerology: NumerologyMap;
  /** Os eixos no vocabulário do jogo — é isto que o `generateOracle` consome. */
  oracle: OracleAxes;
  generatedAt: string;
}

export function buildSoulProfile(
  onboarding: SoulOnboardingData,
  answers: Answers,
  now: Date = new Date()
): SoulProfile {
  const psychometric = scoreProfile(answers);

  const astrology = computeNatalChart({
    date: onboarding.birthDate,
    time: onboarding.birthTime,
    timeZone: onboarding.timeZone,
    latitude: onboarding.latitude,
    longitude: onboarding.longitude,
    placeLabel: onboarding.placeLabel,
    timeUnknown: onboarding.timeUnknown,
  });

  const numerology = computeNumerology(
    onboarding.fullName,
    onboarding.birthDate,
    now.getUTCFullYear()
  );

  const facets: Record<string, number> = {};
  for (const trait of Object.values(psychometric.traits)) {
    for (const f of trait.facets) {
      facets[`${trait.dimension}:${f.facet}`] = f.score;
    }
  }

  const oracle = generateOracleAxes({
    traits: {
      openness: psychometric.traits.openness.score,
      conscientiousness: psychometric.traits.conscientiousness.score,
      extraversion: psychometric.traits.extraversion.score,
      agreeableness: psychometric.traits.agreeableness.score,
      neuroticism: psychometric.traits.neuroticism.score,
      honestyHumility: psychometric.traits.honestyHumility.score,
    },
    facets,
    jung: {
      EI: psychometric.jung.axes.EI.score,
      SN: psychometric.jung.axes.SN.score,
      TF: psychometric.jung.axes.TF.score,
      JP: psychometric.jung.axes.JP.score,
    },
    astrologyElements: astrology.distribution.elements,
    astrologyPolarities: astrology.distribution.polarities,
    planetProminence: planetProminence(astrology),
    numerologyNumbers: [
      numerology.lifePath.value,
      numerology.expression.value,
      numerology.soulUrge.value,
      numerology.personality.value,
      numerology.birthday.value,
      numerology.maturity.value,
    ],
  });

  return {
    onboarding,
    psychometric,
    astrology,
    numerology,
    oracle,
    generatedAt: now.toISOString(),
  };
}
