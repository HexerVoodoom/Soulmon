// ---------------------------------------------------------------------------
// Rótulos do teste de personalidade — PT+EN.
// Portado de `teste-personalidade/src/lib/personality/labels.ts`, que era só
// PT. Nenhum número vive aqui: isto é apresentação, a psicometria está em
// `scoring.ts`.
// ---------------------------------------------------------------------------

import type { LText } from '../../oracle';
import type { JungAxis, TraitDimension, TraitLevel } from './types';

export const traitLabels: Record<
  TraitDimension,
  { name: LText; low: LText; high: LText; blurb: LText }
> = {
  openness: {
    name: { pt: 'Abertura à experiência', en: 'Openness to experience' },
    low: { pt: 'concreto, prático', en: 'concrete, practical' },
    high: { pt: 'curioso, imaginativo', en: 'curious, imaginative' },
    blurb: {
      pt: 'Amplitude de interesses, apetite por ideias novas e sensibilidade estética.',
      en: 'Breadth of interests, appetite for new ideas and aesthetic sensitivity.',
    },
  },
  conscientiousness: {
    name: { pt: 'Conscienciosidade', en: 'Conscientiousness' },
    low: { pt: 'espontâneo, flexível', en: 'spontaneous, flexible' },
    high: { pt: 'organizado, persistente', en: 'organized, persistent' },
    blurb: {
      pt: 'Organização, disciplina e cuidado com consequências.',
      en: 'Organization, discipline and care about consequences.',
    },
  },
  extraversion: {
    name: { pt: 'Extroversão', en: 'Extraversion' },
    low: { pt: 'reservado, contido', en: 'reserved, contained' },
    high: { pt: 'sociável, assertivo', en: 'sociable, assertive' },
    blurb: {
      pt: 'Energia direcionada ao mundo social e busca de estímulo.',
      en: 'Energy aimed at the social world and the search for stimulation.',
    },
  },
  agreeableness: {
    name: { pt: 'Amabilidade', en: 'Agreeableness' },
    low: { pt: 'direto, competitivo', en: 'direct, competitive' },
    high: { pt: 'cooperativo, empático', en: 'cooperative, empathetic' },
    blurb: {
      pt: 'Empatia, cooperação e disposição a confiar.',
      en: 'Empathy, cooperation and willingness to trust.',
    },
  },
  neuroticism: {
    name: { pt: 'Neuroticismo', en: 'Neuroticism' },
    low: { pt: 'estável sob pressão', en: 'steady under pressure' },
    high: { pt: 'reativo, sensível', en: 'reactive, sensitive' },
    blurb: {
      pt: 'Frequência e intensidade de emoções negativas sob estresse.',
      en: 'Frequency and intensity of negative emotion under stress.',
    },
  },
  honestyHumility: {
    name: { pt: 'Honestidade-Humildade', en: 'Honesty-Humility' },
    low: { pt: 'estratégico, ambicioso', en: 'strategic, ambitious' },
    high: { pt: 'íntegro, modesto', en: 'principled, modest' },
    blurb: {
      pt: 'Sinceridade, modéstia e desapego a status — o sexto fator do HEXACO.',
      en: 'Sincerity, modesty and detachment from status — the HEXACO sixth factor.',
    },
  },
};

export const traitLevelLabels: Record<TraitLevel, LText> = {
  'very-low': { pt: 'muito baixo', en: 'very low' },
  low: { pt: 'baixo', en: 'low' },
  moderate: { pt: 'moderado', en: 'moderate' },
  high: { pt: 'alto', en: 'high' },
  'very-high': { pt: 'muito alto', en: 'very high' },
};

export const jungAxisLabels: Record<JungAxis, { name: LText; poles: [LText, LText] }> = {
  EI: {
    name: { pt: 'Energia', en: 'Energy' },
    poles: [
      { pt: 'Extroversão (E)', en: 'Extraversion (E)' },
      { pt: 'Introversão (I)', en: 'Introversion (I)' },
    ],
  },
  SN: {
    name: { pt: 'Percepção', en: 'Perception' },
    poles: [
      { pt: 'Sensação (S)', en: 'Sensing (S)' },
      { pt: 'Intuição (N)', en: 'Intuition (N)' },
    ],
  },
  TF: {
    name: { pt: 'Julgamento', en: 'Judgement' },
    poles: [
      { pt: 'Pensamento (T)', en: 'Thinking (T)' },
      { pt: 'Sentimento (F)', en: 'Feeling (F)' },
    ],
  },
  JP: {
    name: { pt: 'Estilo de vida', en: 'Lifestyle' },
    poles: [
      { pt: 'Julgamento (J)', en: 'Judging (J)' },
      { pt: 'Percepção (P)', en: 'Perceiving (P)' },
    ],
  },
};

/** Significado simbólico de cada número da numerologia (inclui os mestres). */
export const numberMeanings: Record<number, LText> = {
  1: { pt: 'iniciativa, liderança, independência', en: 'initiative, leadership, independence' },
  2: { pt: 'cooperação, sensibilidade, diplomacia', en: 'cooperation, sensitivity, diplomacy' },
  3: { pt: 'expressão, criatividade, comunicação', en: 'expression, creativity, communication' },
  4: { pt: 'estrutura, método, construção sólida', en: 'structure, method, solid building' },
  5: { pt: 'liberdade, mudança, versatilidade', en: 'freedom, change, versatility' },
  6: { pt: 'cuidado, responsabilidade, harmonia', en: 'care, responsibility, harmony' },
  7: { pt: 'análise, introspecção, busca de sentido', en: 'analysis, introspection, search for meaning' },
  8: { pt: 'poder, realização material, autoridade', en: 'power, material achievement, authority' },
  9: { pt: 'compaixão, encerramento de ciclos, serviço', en: 'compassion, closing cycles, service' },
  11: { pt: 'intuição elevada, inspiração, sensibilidade extrema', en: 'heightened intuition, inspiration, extreme sensitivity' },
  22: { pt: 'construtor mestre, visão concretizada em larga escala', en: 'master builder, vision realized at scale' },
  33: { pt: 'cura, entrega ao coletivo, mestre do amor', en: 'healing, devotion to the collective, master of love' },
};
