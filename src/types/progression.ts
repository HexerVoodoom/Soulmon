// Progressão fixa por forma evolutiva
export const FORM_REQUIREMENTS = {
  digiegg: { required: 1, cap: 2, daysToEvolve: 1 },
  'baby-i': { required: 2, cap: 3, daysToEvolve: 2 },
  'baby-ii': { required: 3, cap: 5, daysToEvolve: 4 },
  rookie: { required: 4, cap: 6, daysToEvolve: 10 },
  champion: { required: 5, cap: 7, daysToEvolve: 20 },
  ultimate: { required: 6, cap: 8, daysToEvolve: 30 },
  mega: { required: 7, cap: 9, daysToEvolve: 30 },
  ultra: { required: 8, cap: 10, daysToEvolve: 999 },
} as const;

// HP máximo por forma (corações)
export const MAX_HP_BY_FORM = {
  digiegg: 1,
  'baby-i': 1,
  'baby-ii': 2,
  rookie: 3,
  champion: 3,
  ultimate: 3,
  mega: 4,
  ultra: 5,
} as const;

// Formas que mostram grid de dias (a partir de Rookie)
export const FORMS_WITH_WEEKDAY_SELECTION = [
  'rookie',
  'tapirmon',
  'kudamon',
  'kamemon',
  'champion',
  'ultimate',
  'mega',
  'ultra',
  // Champion branches
  'monochromon',
  'tuskmon',
  'bakemon',
  // Ultimate branches
  'gigadramon',
  'triceramon',
  'digitamamon',
  // Mega branches
  'gaioumon',
  'ultimatebrachiomon',
  'titamon',
  // Ultra
  'gaioumon-itto',
] as const;

export type EvolutionStage = keyof typeof FORM_REQUIREMENTS;

// Mapeia formas específicas para o nível base para determinar required
export function getStageLevel(stage: string): EvolutionStage {
  if (stage === 'digiegg') return 'digiegg';
  if (stage === 'pichimon') return 'baby-i';
  if (stage === 'pukamon') return 'baby-ii';
  if (stage === 'tapirmon') return 'rookie';
  
  // Champions
  if (['monochromon', 'tuskmon', 'bakemon'].includes(stage)) return 'champion';
  
  // Ultimates
  if (['gigadramon', 'triceramon', 'digitamamon'].includes(stage)) return 'ultimate';
  
  // Megas
  if (['gaioumon', 'ultimatebrachiomon', 'titamon'].includes(stage)) return 'mega';
  
  // Ultra
  if (stage === 'gaioumon-itto') return 'ultra';
  
  return 'digiegg';
}

// Verifica se a forma atual permite seleção de dias da semana
export function canSelectWeekdays(stage: string): boolean {
  return FORMS_WITH_WEEKDAY_SELECTION.includes(stage as any);
}