/**
 * ESTAÇÕES — o calendário sem o battle pass
 * =========================================
 *
 * Parte 4 do `docs/PLANO-PRODUTO.md`. Funções PURAS: `now: Date` SEMPRE entra
 * por parâmetro, tabela ESTÁTICA, **sem servidor e sem flag remota**. Um app
 * que precisa de um endpoint para saber que estação é hoje é um app que quebra
 * offline e que morre no dia em que o dev solo parar de operar o backend.
 *
 * POR QUE ESTAÇÕES EXISTEM (o problema medido)
 * --------------------------------------------
 * O `DREAM_CATALOG` tinha 18 sonhos e `rollDream` prefere o não-coletado: um
 * usuário regular fecha o Dex em ~1 mês, e a partir daí toda manhã entrega uma
 * repetição — com o `MorningDream` avisando na cara que não é novo. Era o
 * gerador de repetição nº 1 do produto. Os marcos de hábito terminam no dia 66;
 * as 6 missões são consumidas e acabam. A estação é a resposta: conteúdo novo
 * em cadência, com custo de produção de um fim de semana a cada três meses,
 * porque o pipeline de sprites por IA é o trunfo do dev solo.
 *
 * **Por isso os SONHOS sazonais são o item 1 da estação, não o terceiro:**
 * 3 sonhos por estação sobre 18 é +17% de catálogo por fim de semana de
 * trabalho. É a alavanca de saturação mais barata que existe aqui.
 *
 * AS REGRAS INEGOCIÁVEIS
 * ----------------------
 * 1. **NADA EXPIRA. Nunca.** A pesquisa sobre battle pass fatigue ("second job
 *    feeling") é unânime, e a indústria já corrigiu: Halo Infinite tornou os
 *    passes PERMANENTES, Deep Rock Galactic migra o não-obtido para os sistemas
 *    normais, Helldivers 2 mantém warbonds antigos compráveis. **O valor está
 *    no CALENDÁRIO — um motivo novo para voltar — não na EXPIRAÇÃO — o medo de
 *    perder.** Um item sazonal NUNCA sai do catálogo: durante a estação ele é
 *    mais provável e destacado, depois continua obtenível com peso normal.
 *    FOMO vira "mais fácil agora", jamais "só agora". Há teste travando isso, e
 *    é o teste que separa esta feature de um battle pass.
 * 2. **Janela de DIAS, nunca de horas** — a mesma regra que a Rodada do Torneio
 *    já segue. Evento de 3 horas num horário fixo exclui quem trabalha; foi uma
 *    das queixas mais citadas contra o Pokémon GO. Aqui a janela tem ~13
 *    SEMANAS.
 * 3. **A medalha tem TRÊS CAMINHOS ALTERNATIVOS**, cada um bastando sozinho
 *    (`OU`, nunca `E`). Objetivo único obrigatório transforma a estação em
 *    tarefa de casa e exclui quem não joga a parte do app que o objetivo pede —
 *    quem só cuida de hábitos, quem só joga masmorra, quem só usa a janela de
 *    descanso. Três portas, todas na altura de quem já está jogando do jeito
 *    que já joga.
 * 4. **Nada comprável com dinheiro real que não seja cosmético.** A camada
 *    recorrente da Parte 4 é ~R$ 9,90/trimestre de COSMÉTICO, e o pacote nunca
 *    bloqueia mecânica nem cuidado. Nenhuma função deste arquivo lê ou escreve
 *    entitlement.
 * 5. **A medalha, uma vez ganha, é PARA SEMPRE** (`earnedMedals`), inclusive
 *    depois de a estação virar. É o corolário direto da regra 1.
 *
 * O ANO É CÍCLICO (por que a tabela é estática e mesmo assim nunca acaba)
 * ----------------------------------------------------------------------
 * As datas são guardadas em ISO por legibilidade, mas o ANO nelas é só a
 * PRIMEIRA EDIÇÃO: a comparação é por mês/dia, então a mesma tabela vale em
 * 2026, 2031 e 2040 sem um deploy. Uma tabela com anos literais viraria um app
 * sem estação nenhuma no dia em que o dono parasse de publicar — exatamente o
 * modo de falha que a regra 1 existe para evitar.
 *
 * Os temas são hemisfério-agnósticos de propósito (broto, fogueira, maré,
 * constelação, e não "verão"/"inverno"): a base é BR e EN ao mesmo tempo, e
 * "Summer Season" em junho é errado para metade do mundo.
 */

import type { RestState } from './restWindow';

// ---------------------------------------------------------------------------
// 1. Modelo
// ---------------------------------------------------------------------------

export interface Season {
  id: string;
  /** ISO `YYYY-MM-DD`. O ANO é só a primeira edição — a comparação é mês/dia. */
  startISO: string;
  /** ISO `YYYY-MM-DD`, INCLUSIVO. Pode ser "menor" que o início: cruza o ano. */
  endISO: string;
  namePt: string;
  nameEn: string;
  /** Ids em `DREAM_CATALOG` que esta estação DESTACA (nunca "libera"). */
  dreamIds: readonly string[];
  /** Id da medalha da estação. Ganha uma vez, guardada para sempre. */
  medalId: string;
  themePt: string;
  themeEn: string;
}

/**
 * As quatro estações do ano.
 *
 * ~13 semanas cada, com uma folga curta de **entre-estações** no fim de
 * fevereiro. A folga é de propósito e não é um bug: existe um par de dias por
 * ano em que `currentSeason` devolve `null`, e todo consumidor precisa lidar
 * com isso — se o código só funcionasse dentro de uma estação, a primeira
 * lacuna do calendário viraria tela quebrada. (E, mesmo em entre-estações,
 * absolutamente nada some do catálogo.)
 */
export const SEASONS: readonly Season[] = [
  {
    id: 'season-sprout',
    startISO: '2026-03-01',
    endISO: '2026-05-31',
    namePt: 'Estação do Broto',
    nameEn: 'Sprout Season',
    dreamIds: ['dream-dew-sprout', 'dream-paper-kite', 'dream-mossy-stone'],
    medalId: 'medal-season-sprout',
    themePt: 'Verde novo, orvalho e coisas que estão só começando.',
    themeEn: 'New green, dew, and things that are only just starting.',
  },
  {
    id: 'season-ember',
    startISO: '2026-06-01',
    endISO: '2026-08-31',
    namePt: 'Estação da Fogueira',
    nameEn: 'Ember Season',
    dreamIds: ['dream-quilt-fort', 'dream-ember-circle', 'dream-firefly-jar'],
    medalId: 'medal-season-ember',
    themePt: 'Noite comprida, brasa laranja e cobertor pesado.',
    themeEn: 'Long nights, orange embers and a heavy blanket.',
  },
  {
    id: 'season-tide',
    startISO: '2026-09-01',
    endISO: '2026-11-30',
    namePt: 'Estação da Maré',
    nameEn: 'Tide Season',
    dreamIds: ['dream-paper-umbrella', 'dream-sea-glass', 'dream-storm-lantern'],
    medalId: 'medal-season-tide',
    themePt: 'Chuva morna, vento salgado e azul que não para quieto.',
    themeEn: 'Warm rain, salt wind and a blue that never sits still.',
  },
  {
    id: 'season-starlit',
    startISO: '2026-12-01',
    // Cruza a virada do ano: dezembro a fevereiro é UMA estação só.
    endISO: '2027-02-27',
    namePt: 'Estação da Constelação',
    nameEn: 'Starlit Season',
    dreamIds: ['dream-comet-tail', 'dream-planetarium', 'dream-snowglobe'],
    medalId: 'medal-season-starlit',
    themePt: 'Céu alto, poeira de estrela e madrugada acordada.',
    themeEn: 'High sky, star dust and a wide-awake small hour.',
  },
] as const;

// ---------------------------------------------------------------------------
// 2. Calendário — puro, local, cíclico
// ---------------------------------------------------------------------------

/** `2026-03-01` → 301. Chave mês/dia; o ano é ignorado de propósito. */
function mmdd(month1: number, day: number): number {
  return month1 * 100 + day;
}

function parseISODate(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso ?? '').trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return { y, m: mo, d };
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** A estação cruza a virada do ano (dezembro → fevereiro). */
function wrapsYear(season: Season): boolean {
  const s = parseISODate(season.startISO);
  const e = parseISODate(season.endISO);
  if (!s || !e) return false;
  return mmdd(e.m, e.d) < mmdd(s.m, s.d);
}

function coversDay(season: Season, at: Date): boolean {
  const s = parseISODate(season.startISO);
  const e = parseISODate(season.endISO);
  if (!s || !e) return false;
  const x = mmdd(at.getMonth() + 1, at.getDate());
  const a = mmdd(s.m, s.d);
  const b = mmdd(e.m, e.d);
  return a <= b ? x >= a && x <= b : x >= a || x <= b;
}

/**
 * A estação de hoje, ou `null` no punhado de dias de **entre-estações**.
 *
 * `null` é um resultado legítimo e não é uma falha: fora de estação o app segue
 * inteiro, e todo sonho — sazonal ou não — continua sorteável. É a regra 1 em
 * forma de tipo.
 */
export function currentSeason(now: Date = new Date()): Season | null {
  for (const s of SEASONS) if (coversDay(s, now)) return s;
  return null;
}

export interface SeasonWindow {
  season: Season;
  /** Instante do primeiro dia da edição CORRENTE (00:00 local). */
  start: Date;
  /** Instante do último dia da edição corrente (00:00 local, INCLUSIVO). */
  end: Date;
  /** Total de dias da edição (inclusivo nas duas pontas). */
  totalDays: number;
  /** Dia atual dentro da estação, começando em 1. */
  dayIndex: number;
  /** Dias restantes contando hoje (nunca 0 dentro da estação). */
  daysLeft: number;
  /** `dayIndex / totalDays` — 0..1. Barra de calendário, não de desempenho. */
  ratio: number;
}

/**
 * Onde estamos dentro da estação corrente, com as datas CONCRETAS da edição
 * deste ano (a tabela guarda mês/dia; aqui o ano é resolvido).
 *
 * `null` em entre-estações. Note que `daysLeft` é informação de CALENDÁRIO
 * ("ainda dá pra pegar mais fácil"), nunca uma contagem regressiva de perda —
 * a UI que consumir isso não pode escrever "últimos dias para conseguir".
 */
export function seasonProgress(now: Date = new Date()): SeasonWindow | null {
  const season = currentSeason(now);
  if (!season) return null;
  const s = parseISODate(season.startISO)!;
  const e = parseISODate(season.endISO)!;
  const today = startOfDay(now);
  const x = mmdd(today.getMonth() + 1, today.getDate());

  let startYear = today.getFullYear();
  if (wrapsYear(season) && x <= mmdd(e.m, e.d)) startYear -= 1;
  const start = new Date(startYear, s.m - 1, s.d);
  const end = new Date(startYear + (wrapsYear(season) ? 1 : 0), e.m - 1, e.d);

  const totalDays = Math.round((end.getTime() - start.getTime()) / DAY_MS) + 1;
  const dayIndex = Math.round((today.getTime() - start.getTime()) / DAY_MS) + 1;
  const daysLeft = totalDays - dayIndex + 1;

  return {
    season,
    start,
    end,
    totalDays,
    dayIndex,
    daysLeft,
    ratio: totalDays > 0 ? dayIndex / totalDays : 0,
  };
}

/** A estação que DESTACA este sonho, independente da data. Nunca `undefined`. */
export function seasonOfDream(dreamId: string): Season | null {
  for (const s of SEASONS) if (s.dreamIds.includes(dreamId)) return s;
  return null;
}

/**
 * Este sonho é o destaque da estação de AGORA?
 *
 * **Isto é um adjetivo de destaque, não uma permissão.** `false` NÃO significa
 * "indisponível": significa apenas que este sonho não recebe o peso extra hoje.
 * Nenhum caminho do código pode usar esta função para remover algo de um pool —
 * é a linha exata que separa estação de battle pass, e há teste travando.
 */
export function isSeasonalDream(dreamId: string, now: Date = new Date()): boolean {
  const season = currentSeason(now);
  return !!season && season.dreamIds.includes(dreamId);
}

// ---------------------------------------------------------------------------
// 3. A medalha de estação — três caminhos, medidos por diff de snapshot
// ---------------------------------------------------------------------------

/**
 * Os contadores LIFETIME que o GameState já mantém.
 *
 * O desenho inteiro depende disto: a estação **não introduz contador novo**.
 * Ela tira uma FOTO (`snapshot`) dos contadores no dia em que começa e mede o
 * DIFF. Contador novo é estado novo para migrar, sincronizar e manter em três
 * clientes (web, Capacitor, desktop) — e é a porta pela qual "regra copiada =
 * regra que diverge em silêncio" entra.
 */
export interface SeasonCounters {
  /** `totalPerfectDays` do GameState. */
  totalPerfectDays: number;
  /** `dungeonRunsCompleted` do GameState. */
  dungeonRunsCompleted: number;
}

/**
 * O estado persistido da estação. **A fiação no GameState é de outro dono** —
 * este arquivo só define a forma e as transições puras.
 */
export interface SeasonProgressState {
  /** Estação a que o `snapshot` pertence. */
  seasonId: string;
  /** Foto dos contadores lifetime no primeiro dia visto desta estação. */
  snapshot: SeasonCounters;
  /** A medalha DESTA estação já foi ganha? */
  medalEarned: boolean;
  /**
   * Todas as medalhas já ganhas, de todas as estações. Existe porque **nada
   * expira**: virar a estação troca o snapshot, e sem esta lista a medalha do
   * trimestre passado sumiria junto — que é exatamente o que um battle pass faz
   * e esta feature não faz.
   */
  earnedMedals?: readonly string[];
}

export type SeasonPathId = 'perfect-days' | 'dungeon-runs' | 'rest-nights';

export interface SeasonPath {
  id: SeasonPathId;
  target: number;
  labelPt: string;
  labelEn: string;
}

/**
 * Os três caminhos. **`OU`, nunca `E`** — qualquer um sozinho dá a medalha.
 *
 * Os alvos são calibrados para ~13 semanas de jogo NORMAL, e de propósito bem
 * abaixo do que um trimestre comporta: a medalha marca presença, não maratona.
 * Um alvo que exige jogar todo dia é um alvo que pune quem teve uma semana
 * ruim — e a semana ruim é o estado em que a maior parte da base instala um app
 * desses.
 */
export const SEASON_PATHS: readonly SeasonPath[] = [
  {
    id: 'perfect-days',
    target: 20,
    labelPt: '20 dias completos na estação',
    labelEn: '20 complete days during the season',
  },
  {
    id: 'dungeon-runs',
    target: 5,
    labelPt: '5 runs completas da masmorra na estação',
    labelEn: '5 full dungeon runs during the season',
  },
  {
    id: 'rest-nights',
    target: 15,
    labelPt: '15 noites dentro da janela de descanso na estação',
    labelEn: '15 nights inside the rest window during the season',
  },
] as const;

/** Começa (ou recomeça) a contagem: a foto é tirada AGORA. */
export function startSeasonProgress(
  season: Season,
  counters: SeasonCounters,
  previous?: SeasonProgressState,
): SeasonProgressState {
  return {
    seasonId: season.id,
    snapshot: { ...counters },
    medalEarned: false,
    earnedMedals: [...(previous?.earnedMedals ?? [])],
  };
}

/**
 * Mantém o estado alinhado com o calendário.
 *
 * - Fora de estação (entre-estações): devolve o estado como está. Não zera
 *   nada, não perde medalha, não "fecha" nada.
 * - Estação nova: tira foto nova, **preservando `earnedMedals`**.
 * - Mesma estação: identidade (nada de objeto novo por render).
 */
export function ensureSeasonProgress(
  state: SeasonProgressState | undefined,
  counters: SeasonCounters,
  now: Date = new Date(),
): SeasonProgressState | undefined {
  const season = currentSeason(now);
  if (!season) return state;
  if (state && state.seasonId === season.id) return state;
  return startSeasonProgress(season, counters, state);
}

export interface SeasonPathStatus extends SeasonPath {
  current: number;
  done: boolean;
}

export interface SeasonMedalStatus {
  season: Season | null;
  paths: SeasonPathStatus[];
  /** Já bateu algum caminho (ou já estava marcada). */
  earned: boolean;
}

/** Quantas noites ON TIME estão registradas DENTRO da janela [start, end]. */
function onTimeNightsInSeason(rest: RestState | undefined, win: SeasonWindow): number {
  if (!rest?.nights?.length) return 0;
  const from = win.start.getTime();
  const to = win.end.getTime() + DAY_MS - 1;
  let n = 0;
  for (const night of rest.nights) {
    if (!night.onTime) continue;
    const t = new Date(night.date).getTime();
    if (Number.isNaN(t)) continue;
    if (t >= from && t <= to) n++;
  }
  return n;
}

/**
 * Onde a pessoa está em cada um dos três caminhos.
 *
 * Os dois primeiros saem de **diff de snapshot** — `agora − foto` — e por isso
 * progresso anterior à estação nunca conta (há teste). O terceiro é filtrado
 * por DATA sobre `rest.nights`, que já é um log datado: filtrar por data é o
 * mesmo diff, feito na única forma honesta possível para um log com poda.
 *
 * `Math.max(0, …)` porque save editado à mão (ou um contador que voltou por
 * merge de cloud save) não pode produzir progresso NEGATIVO — nesta mecânica
 * nenhum número desce, nunca.
 */
export function seasonMedalStatus(
  state: SeasonProgressState | undefined,
  counters: SeasonCounters,
  rest?: RestState,
  now: Date = new Date(),
): SeasonMedalStatus {
  const win = seasonProgress(now);
  const aligned = !!state && !!win && state.seasonId === win.season.id;

  const current: Record<SeasonPathId, number> = {
    'perfect-days':
      aligned ? Math.max(0, counters.totalPerfectDays - state!.snapshot.totalPerfectDays) : 0,
    'dungeon-runs':
      aligned
        ? Math.max(0, counters.dungeonRunsCompleted - state!.snapshot.dungeonRunsCompleted)
        : 0,
    'rest-nights': win ? onTimeNightsInSeason(rest, win) : 0,
  };

  const paths = SEASON_PATHS.map((p) => ({
    ...p,
    current: current[p.id],
    done: current[p.id] >= p.target,
  }));

  return {
    season: win?.season ?? null,
    paths,
    // UM caminho basta. Nunca a conjunção.
    earned: (state?.medalEarned ?? false) || paths.some((p) => p.done),
  };
}

/**
 * Grava a medalha quando um dos caminhos fecha. Idempotente e **monotônico**:
 * `medalEarned` nunca volta para `false` e `earnedMedals` nunca encolhe.
 */
export function applySeasonMedal(
  state: SeasonProgressState | undefined,
  counters: SeasonCounters,
  rest?: RestState,
  now: Date = new Date(),
): SeasonProgressState | undefined {
  if (!state) return state;
  const status = seasonMedalStatus(state, counters, rest, now);
  if (!status.earned || state.medalEarned) return state;
  const season = SEASONS.find((s) => s.id === state.seasonId);
  const medalId = season?.medalId;
  const already = state.earnedMedals ?? [];
  return {
    ...state,
    medalEarned: true,
    earnedMedals: medalId && !already.includes(medalId) ? [...already, medalId] : [...already],
  };
}

/** Frase curta para a UI, nos dois idiomas. Convida; nunca cobra nem ameaça. */
export function seasonLabel(win: SeasonWindow | null, language: 'pt-BR' | 'en-US'): string {
  const isPt = language === 'pt-BR';
  if (!win) {
    return isPt
      ? 'Entre estações. Tudo continua aqui — nada some do catálogo.'
      : 'Between seasons. Everything stays — nothing ever leaves the catalog.';
  }
  return isPt
    ? `${win.season.namePt} — ${win.season.themePt} Os sonhos da estação aparecem mais fácil agora (e continuam aparecendo depois).`
    : `${win.season.nameEn} — ${win.season.themeEn} This season's dreams show up more easily now (and keep showing up later).`;
}
