// Progressão fixa por nível evolutivo. A árvore do Soulmon não tem mais
// ovo/baby (o oráculo do onboarding já É o ritual de nascimento — o pet
// nasce direto Rookie). Cada linha de evolução é ÚNICA por jogador (gerada
// pelo oráculo, ver utils/oracle.ts); o que é fixo aqui é só o NÍVEL.
// `required` = tarefas por dia (e barras de energia). `daysToEvolve` = dias
// perfeitos acumulados até a próxima forma.
//
// A escada diária ACHATA no topo de propósito. Antes ela subia 4→5→6→7→8, e a
// exigência diária crescia sem parar junto com a vida do jogador — foi o que fez
// a maioria dos donos de Vital Bracelet parar nos estágios médios: o custo real
// ultrapassa a vontade justamente no terço final. No topo, o que deve escalar é
// a CONSISTÊNCIA ao longo de semanas (`daysToEvolve`), que é o único recurso que
// não cresce indefinidamente, e não quantas tarefas cabem num dia.
export const FORM_REQUIREMENTS = {
  rookie: { required: 4, cap: 6, daysToEvolve: 10 },
  champion: { required: 5, cap: 7, daysToEvolve: 20 },
  ultimate: { required: 5, cap: 8, daysToEvolve: 30 },
  mega: { required: 6, cap: 9, daysToEvolve: 40 },
  ultra: { required: 6, cap: 10, daysToEvolve: 999 },
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
  // O save vem do localStorage E da nuvem — os dois são dado NÃO confiável, e
  // `/api/save` só valida que `state` é um objeto, não o tipo de cada campo.
  // Um `evolutionStage` que não é string fazia `stage.split` lançar dentro do
  // inicializador do GameStateProvider: tela branca permanente, sem caminho de
  // recuperação pela UI. Cai no estágio inicial em vez de derrubar o app.
  if (typeof stage !== 'string') return 'rookie';
  if (stage === 'rookie') return 'rookie';
  if (stage === 'ultra') return 'ultra';
  const prefix = stage.split('-')[0];
  if (prefix === 'champion' || prefix === 'ultimate' || prefix === 'mega') return prefix;
  return LEGACY_LEVEL_OF[stage] ?? 'rookie';
}

/** Atributo (virus/data/vaccine) embutido no id, se houver. */
export function getStageBranch(stage: string): 'virus' | 'data' | 'vaccine' | null {
  if (typeof stage !== 'string') return null; // mesma razão de getStageLevel
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

// Branches de evolução disponíveis (reduza a lista para restringir).
export const AVAILABLE_BRANCHES = ['virus', 'data', 'vaccine'] as const;
export type AvailableBranch = (typeof AVAILABLE_BRANCHES)[number];
export function clampBranch(b: 'virus' | 'data' | 'vaccine'): 'virus' | 'data' | 'vaccine' {
  return (AVAILABLE_BRANCHES as readonly string[]).includes(b) ? b : AVAILABLE_BRANCHES[0];
}

// Evolução manual: quando true, a virada de dia NUNCA evolui sozinha — o
// jogador dispara pelo botão sobre o pet (tela de cerimônia de evolução).
export const MANUAL_EVOLUTION = true;
