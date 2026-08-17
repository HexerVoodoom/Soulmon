// ---------------------------------------------------------------------------
// soulProfile — o motor do oráculo do Soulmon.
//
// Origem: repositório `HexerVoodoom/teste-personalidade`, onde ele foi
// prototipado. A partir daqui o Soulmon é a FONTE DA VERDADE deste motor; o
// outro repo segue sendo o laboratório da ponte com o class-system/bestiário.
// Ao mudar uma regra, mude AQUI (footgun 9 do CLAUDE.md: regra copiada é regra
// que diverge em silêncio).
//
// O que ele substitui: a metade "leitura" do `utils/oracle.ts` — signo solar,
// ascendente APROXIMADO pela hora, horóscopo chinês, rashi védico, 4 números e
// 6 perguntas de quiz. No lugar entram:
//
//   • 20 itens psicométricos → Big Five + Honestidade-Humildade (HEXACO),
//     4 eixos junguianos e índices de validade de resposta;
//   • mapa astral REAL (efemérides VSOP87/ELP, eclíptica verdadeira da data,
//     Ascendente/MC por fórmula fechada, casas Placidus, fuso IANA com regras
//     históricas de horário de verão);
//   • numerologia pitagórica completa (8 números + lições cármicas, paixão
//     oculta, desafios, pináculos e dívidas cármicas).
//
// O que ele NÃO toca: a máquina criativa do `oracle.ts` (arquétipo, famílias,
// fusão, as 11 formas, prompts de sprite). Isso continua igual — este módulo
// troca o motor da leitura, não a criatura que sai dela.
//
// **Este módulo é pesado** (puxa a `astronomy-engine`). Ele existe atrás de
// import dinâmico: quem precisa do perfil chama `await import('./soulProfile')`
// e guarda o `SoulProfile` resultante (é JSON puro, serializável, vai pro save).
// O `utils/oracle.ts` importa daqui **só tipos**, que somem na compilação — é
// isso que mantém a engine de efemérides fora do bundle inicial.
// ---------------------------------------------------------------------------

export { buildSoulProfile } from './profile';
export type { SoulOnboardingData, SoulProfile } from './profile';

export { generateOracleAxes } from './axes';
export type { OracleAxesInput } from './axes';

export { items, totalItems, likertItems, forcedChoiceItems, scenarioItems } from './personality/questions';
export { scoreProfile, computeValidity, isComplete, answeredCount } from './personality/scoring';
export { traitLabels, traitLevelLabels, jungAxisLabels, numberMeanings } from './personality/labels';
export type {
  Answer, Answers, Item, LikertItem, LikertValue, ForcedChoiceItem, ScenarioItem,
  PersonalityProfile, TraitDimension, TraitLevel, TraitScore, JungAxis, ValidityIndices,
} from './personality/types';
export { TRAIT_DIMENSIONS, JUNG_AXES } from './personality/types';

export { computeNatalChart, signOf, degreeInSign, formatPosition, localToUtc } from './astrology/chart';
export type { NatalChart, PlacedBody, Sign, BirthData } from './astrology/types';
export { SIGNS, SIGN_ELEMENT, SIGN_MODALITY, SIGN_POLARITY } from './astrology/types';

export { computeNumerology, reduce, normalizeName } from './numerology';
export type { NumerologyMap, NumberResult } from './numerology';

export { CITIES, cityLabel, searchCities } from './cities';
export type { City } from './cities';

export { computeDominantClassElements } from './derivedElements';
export type { DominantElementCandidate } from './derivedElements';

export { CLASS_ELEMENT_ORDER } from './types';
export type { ClassElementId, OracleAxes } from './types';

// --- pipeline completo: ficha + companheiro + bestiário + criatura ---
export { generateOracleComplete } from './pipeline';
export type { OracleComplete } from './pipeline';
export { buildFicha, CLASS_DATA, ROOKIE_BUDGET, STAGE_MULTIPLIER, ELEMENT_ORCAMENTO_BY_STAGE } from './ficha/buildSheet';
export { cascataDosPares, DIVISOR_CASCATA_PAR, LIMIAR_DESTRAVAMENTO_PAR, CUSTO_PONTO_PAR } from './ficha/cascata';
export type { CascataPar } from './ficha/cascata';
export { poderCaptura, avaliarCaptura, capturableCreatures, selectCompanion } from './ficha/capture';
export type { Ficha, FichaStage } from './ficha/types';
export { FICHA_STAGE_ORDER } from './ficha/types';
export { selectBestiaryCreature, selectBestiaryLineage, speciesProximity, BESTIARY_POOL, BESTIARY_PROVENANCE } from './bestiary/select';
export type { BestiaryCreature, BestiaryPick } from './bestiary/select';
export { essenceLabel, baseElementLabel, PROFISSAO_EN } from './essenceLabels';
export { buildStageSkills, buildAllStageSkills } from './ficha/skills';
export type { StageSkill, StageSkills, SkillText } from './ficha/skills';
