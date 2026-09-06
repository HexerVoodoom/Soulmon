// Progressão fixa por nível evolutivo. A árvore do Soulmon não tem mais
// ovo/baby (o oráculo do onboarding já É o ritual de nascimento — o pet
// nasce direto Rookie). Cada linha de evolução é ÚNICA por jogador (gerada
// pelo oráculo, ver utils/oracle.ts); o que é fixo aqui é só o NÍVEL.
// `required` = tarefas por dia (e barras de energia) **e o gate de evolução**:
// é o número que `handleEvolve` e o `canEvolve` do HUD comparam com
// `perfectDays`. `cap` = teto de atividades cadastradas com que o save nasce.
//
// A escada diária ACHATA no topo de propósito. Antes ela subia 4→5→6→7→8, e a
// exigência diária crescia sem parar junto com a vida do jogador — foi o que fez
// a maioria dos donos de Vital Bracelet parar nos estágios médios: o custo real
// ultrapassa a vontade justamente no terço final.
//
// ⚰️ **`daysToEvolve` (10/20/30/40/999) FOI APAGADO em 06/09/2026** (decisão D5).
// Ele parecia o gate e não era: NENHUMA regra o consultava, e mesmo assim
// enganou três consumidores diferentes, um de cada vez — o gate de geração de
// sprite (o lote de véspera nunca partia), o rótulo da barra da página de
// Evolução, e o guia, que prometia "Rookie→Champion pede 10 dias perfeitos"
// quando o botão acende com 4. Cada engano foi consertado sozinho, sem ninguém
// perguntar por que o campo existia.
//
// **A regra agora tem UMA fonte, e é esta linha.** Se um dia a evolução tiver
// de escalar por semanas em vez de dias (que é o que o Vital Bracelet faz, e o
// que a opção (a) do WP4.1 propunha), o lugar de fazer isso é MUDAR `required`
// ou o que o compara — nunca acrescentar um segundo número ao lado dele.
export const FORM_REQUIREMENTS = {
  rookie: { required: 4, cap: 6 },
  champion: { required: 5, cap: 7 },
  ultimate: { required: 5, cap: 8 },
  mega: { required: 6, cap: 9 },
  ultra: { required: 6, cap: 10 },
} as const;

/**
 * O SEGUNDO CAMINHO PARA O ULTRA (WP4.2 — decisão D6, 06/09/2026).
 *
 * ─── O que havia antes ────────────────────────────────────────────────────
 * O Ultra abria com as TRÊS megas desbloqueadas. Como a árvore sobe por um
 * galho de cada vez, ter as três exigia **descer e subir de novo, duas vezes** —
 * ou seja, o topo do jogo pedia que o jogador machucasse a criatura de
 * propósito. A tela da degeneração manual diz "você vai perder o progresso" e
 * "NÃO pode ser desfeita": um enquadramento de PERDA num passo que era
 * obrigatório.
 *
 * Isso contradizia a tese em dois lugares ao mesmo tempo. A criatura é
 * declaradamente "o que dói perder" (guia I.1.2), e a indústria abandonou perda
 * de nível como mecânica há tempos (GDC, loss aversion). Um jogo de cuidado que
 * exige um ato de descuido para progredir está pedindo a coisa errada.
 *
 * ─── O que existe agora ───────────────────────────────────────────────────
 * DOIS caminhos, e nenhum deles é melhor:
 *  · **coleção** — as três megas, para quem quiser conhecer os três galhos.
 *    Continua valendo, e continua sendo escolha.
 *  · **permanência** — `ULTRA_PATIENCE_DAYS` dias perfeitos acumulados como
 *    mega. É consistência ao longo de semanas, que é o recurso que a pesquisa
 *    de v-pet aponta como o único que não cresce indefinidamente.
 *
 * ─── Por que 45, e por que UM número ──────────────────────────────────────
 * O caminho da coleção custa ~26 dias perfeitos mais duas quedas. 45 dias
 * perfeitos como mega é mais longo em tempo e mais barato em dor — que é
 * exatamente a troca que se quer oferecer. É um número só, tunável, e ele NÃO
 * é uma segunda tabela ao lado de `required`: `required` continua sendo o gate
 * de toda evolução, inclusive esta. Aqui só se responde "existe destino?".
 * (Ver a lápide de `daysToEvolve` acima: a lição foi não pôr um segundo número
 * ao lado do vivo. Este mora sozinho, tem um leitor só, e está testado.)
 */
export const ULTRA_PATIENCE_DAYS = 45;

/**
 * Existe caminho para o Ultra a partir do mega? `perfectDays` são os
 * acumulados DESDE a última evolução (o contador zera ao evoluir).
 */
export function canReachUltra(input: {
  unlockedEvolutions?: readonly string[];
  perfectDays?: number;
}): boolean {
  const desbloqueadas = input.unlockedEvolutions ?? [];
  const colecao = (['virus', 'data', 'vaccine'] as const)
    .every(a => desbloqueadas.includes(`mega-${a}`));
  const permanencia = (input.perfectDays ?? 0) >= ULTRA_PATIENCE_DAYS;
  return colecao || permanencia;
}

// HP máximo por nível (corações)
export const MAX_HP_BY_FORM = {
  rookie: 3,
  champion: 3,
  ultimate: 3,
  mega: 4,
  ultra: 5,
} as const;

export type EvolutionStage = keyof typeof FORM_REQUIREMENTS;

/**
 * O MAIOR requisito diário da escada (hoje 6, de mega/ultra).
 *
 * Existe para que nenhum outro teto do jogo possa ficar ABAIXO do que o jogo
 * pede num dia. O caso concreto que criou esta constante: `FOOD_LIMIT_PER_HOUR`
 * era o literal `5` enquanto mega/ultra pedem 6 tarefas — e como energia só
 * enche comendo e comida só vem de concluir tarefa, quem fechava as 6 numa
 * sessão só de noite conseguia dar 5 comidas e via o **dia perfeito negado
 * tendo feito 100%**. Dois números soltos que precisavam concordar e não
 * concordavam: o footgun 9 do CLAUDE.md em forma de constante.
 *
 * Derive daqui — não escreva o número de novo em lugar nenhum.
 */
export const MAX_STAGE_REQUIREMENT: number = Math.max(
  ...Object.values(FORM_REQUIREMENTS).map(f => f.required),
);

// ---------------------------------------------------------------------------
// Esquema de IDs da árvore do Soulmon (ver utils/oracle.ts + App.tsx):
//   'rookie' | '{champion|ultimate|mega}-{virus|data|vaccine}' | 'ultra'
// getStageLevel lê o NÍVEL direto do prefixo do id — não precisa de nenhuma
// tabela por espécie, porque cada jogador tem nomes únicos.
// ---------------------------------------------------------------------------

// SÓ compatibilidade de save: mapeia id de espécie LEGADA → nível, para um
// save antigo em 'gaioumon' continuar mega em vez de virar rookie
// (`LEGACY_LEVEL_OF`, abaixo — o único consumidor). NÃO é roster de nada:
// a masmorra sorteia de `DUNGEON_LINE_SPRITES` (utils/sprites.ts — 6 linhas
// nossas × 4 artes) e o fallback de sprite é `legacySpriteForStage`. Até
// 02/09/2026 este comentário dizia "roster selvagem da masmorra", e a frase
// contaminou o PLANO-MELHORIAS com um "bestiário de 60 nomes" que não existe
// (WP4.9). Não acrescente nomes aqui (CLAUDE.md, seção "Arte e nomes").
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
