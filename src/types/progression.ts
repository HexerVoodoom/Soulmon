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

export type EvolutionStage = keyof typeof FORM_REQUIREMENTS;

// Estágios agrupados por nível, cobrindo as três linhas (Tapirmon, Veemon, Salamon)
const STAGES_BY_LEVEL: Record<Exclude<EvolutionStage, 'digiegg'>, readonly string[]> = {
  'baby-i': ['pichimon', 'chicomon', 'yukimibotamon'],
  'baby-ii': ['pukamon', 'chibimon', 'nyaromon'],
  rookie: ['tapirmon', 'veemon', 'plotmon'],
  champion: [
    // Tapirmon
    'monochromon', 'tuskmon', 'bakemon',
    // Veemon
    'exveemon', 'veedramon', 'flamedramon',
    // Salamon
    'gatomon', 'gatomon-black', 'mikemon',
    // Item digivolutions (shop) — replace the branch form at this level
    'greymon', 'garurumon', 'meramon',
  ],
  ultimate: [
    'gigadramon', 'triceramon', 'digitamamon',
    'paildramon', 'aeroveedramon', 'raidramon',
    'angewomon', 'ladydevimon', 'nefertimon',
    // Item digivolutions (shop)
    'monzaemon', 'etemon',
  ],
  mega: [
    'gaioumon', 'ultimatebrachiomon', 'titamon',
    'imperialdramon', 'ulforceveedramon', 'magnamon',
    'ophanimon', 'lilithmon', 'holydramon',
  ],
  ultra: ['gaioumon-itto', 'imperialdramon-paladin', 'mastemon'],
};

// Mapeia formas específicas para o nível base para determinar required/HP/cap
export function getStageLevel(stage: string): EvolutionStage {
  if (stage === 'digiegg') return 'digiegg';
  for (const level of Object.keys(STAGES_BY_LEVEL) as Exclude<EvolutionStage, 'digiegg'>[]) {
    if (STAGES_BY_LEVEL[level].includes(stage)) return level;
  }
  return 'digiegg';
}

// Verifica se a forma atual permite seleção de dias da semana (Rookie ou superior)
const WEEKDAY_LEVELS: EvolutionStage[] = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
export function canSelectWeekdays(stage: string): boolean {
  return WEEKDAY_LEVELS.includes(getStageLevel(stage));
}