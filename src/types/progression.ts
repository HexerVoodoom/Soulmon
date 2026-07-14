// Progressão fixa por nível evolutivo. A árvore do Soulmon não tem mais
// ovo/baby (o oráculo do onboarding já É o ritual de nascimento — o pet
// nasce direto Rookie). Cada linha de evolução é ÚNICA por jogador (gerada
// pelo oráculo, ver utils/oracle.ts); o que é fixo aqui é só o NÍVEL.
export const FORM_REQUIREMENTS = {
  rookie: { required: 4, cap: 6, daysToEvolve: 10 },
  champion: { required: 5, cap: 7, daysToEvolve: 20 },
  ultimate: { required: 6, cap: 8, daysToEvolve: 30 },
  mega: { required: 7, cap: 9, daysToEvolve: 30 },
  ultra: { required: 8, cap: 10, daysToEvolve: 999 },
} as const;

// HP máximo por nível (corações)
export const MAX_HP_BY_FORM = {
  rookie: 3,
  champion: 3,
  ultimate: 3,
  mega: 4,
  ultra: 5,
} as const;

export type EvolutionStage = keyof typeof FORM_REQUIREMENTS;

// ---------------------------------------------------------------------------
// Esquema de IDs da árvore do Soulmon (ver utils/oracle.ts + App.tsx):
//   'rookie' | '{champion|ultimate|mega}-{virus|data|vaccine}' | 'ultra'
// getStageLevel lê o NÍVEL direto do prefixo do id — não precisa de nenhuma
// tabela por espécie, porque cada jogador tem nomes únicos.
// ---------------------------------------------------------------------------

// Roster "selvagem" da masmorra (utils/dungeon.ts) + fallback de sprite
// genérico (utils/sprites.ts): nomes ESTÁTICOS antigos, reaproveitados como
// arte/monstros, sem relação com a árvore do jogador atual.
export const LEGACY_FORM_TIERS: Record<Exclude<EvolutionStage, 'ultra'> | 'ultra', readonly string[]> = {
  rookie: [
    'tapirmon', 'veemon', 'plotmon',
    'agumon', 'gabumon', 'piyomon', 'tentomon', 'patamon', 'palmon',
  ],
  champion: [
    'monochromon', 'tuskmon', 'bakemon',
    'exveemon', 'veedramon', 'flamedramon',
    'gatomon', 'gatomon-black', 'mikemon',
    'greymon', 'garurumon', 'meramon', 'devimon',
    'angemon', 'birdramon', 'kabuterimon', 'seadramon',
    'airdramon', 'ogremon', 'kuwagamon', 'numemon',
    'raidramon-armor', 'betamon',
  ],
  ultimate: [
    'gigadramon', 'triceramon', 'digitamamon',
    'paildramon', 'aeroveedramon', 'raidramon',
    'angewomon', 'ladydevimon', 'nefertimon',
    'monzaemon', 'etemon', 'andromon',
    'megadramon', 'vademon', 'nanimon',
  ],
  mega: [
    'gaioumon', 'ultimatebrachiomon', 'titamon',
    'imperialdramon', 'ulforceveedramon', 'magnamon',
    'ophanimon', 'lilithmon', 'holydramon',
  ],
  ultra: ['gaioumon-itto', 'imperialdramon-paladin', 'mastemon'],
};

const LEGACY_LEVEL_OF: Record<string, EvolutionStage> = Object.fromEntries(
  (Object.entries(LEGACY_FORM_TIERS) as Array<[EvolutionStage, readonly string[]]>)
    .flatMap(([level, names]) => names.map(name => [name, level])),
);

/** Nível do estágio: lê o prefixo do id ('champion-virus' → 'champion'),
 *  com fallback pro roster legado (masmorra / sprite genérico). */
export function getStageLevel(stage: string): EvolutionStage {
  if (stage === 'rookie') return 'rookie';
  if (stage === 'ultra') return 'ultra';
  const prefix = stage.split('-')[0];
  if (prefix === 'champion' || prefix === 'ultimate' || prefix === 'mega') return prefix;
  return LEGACY_LEVEL_OF[stage] ?? 'rookie';
}

/** Atributo (virus/data/vaccine) embutido no id, se houver. */
export function getStageBranch(stage: string): 'virus' | 'data' | 'vaccine' | null {
  const [, branch] = stage.split('-');
  return branch === 'virus' || branch === 'data' || branch === 'vaccine' ? branch : null;
}

// Energy bars for a stage = the number of daily tasks required to earn an
// evolution point at that stage (so rookie's 4-task requirement shows 4 bars).
export function getMaxEnergyForStage(stage: string): number {
  return FORM_REQUIREMENTS[getStageLevel(stage)].required;
}

// A árvore do Soulmon nasce direto Rookie — todo nível já permite escolher
// os dias da semana das atividades (não existe mais fase de ovo/baby).
export function canSelectWeekdays(_stage: string): boolean {
  return true;
}
