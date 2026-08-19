/**
 * OS RITUAIS — CHECK-IN, RELATÓRIO SEMANAL E FRESH START
 * ======================================================
 *
 * Parte 2.4 do `docs/PLANO-TAREFAS.md`. O princípio que rege este arquivo
 * inteiro, e que decide cada função abaixo:
 *
 *   **O app não deve otimizar o ato de marcar o check. Deve otimizar o ato de
 *   PLANEJAR.**
 *
 * Masicampo & Baumeister mostraram que a tensão da tarefa inacabada (efeito
 * Zeigarnik) não é aliviada por CONCLUÍ-LA — é aliviada por fazer um PLANO
 * concreto para ela. Ou seja: o alívio que o usuário procura já está disponível
 * antes de qualquer trabalho ser feito, e é barato de entregar. Todo produto
 * que muda comportamento de verdade (Sunsama, Things, Atoms) cobra alguns
 * minutos de planejamento e devolve tranquilidade em troca. Os que otimizam o
 * check (o Karma do Todoist, o streak do Duolingo) produzem teatro: tarefa
 * trivial criada só para pontuar, lição mínima só para não zerar o contador.
 *
 * Por isso nenhuma função daqui recompensa conclusão. Elas montam o plano
 * (`checkInPlan`), devolvem a leitura da semana (`weeklyReport`), sugerem uma
 * âncora (`stackingSuggestion`) e oferecem recomeço (`freshStartOffer`). O que
 * pontua continua vivendo em `careRules.ts` e `dailyReset.ts`.
 *
 * Estilo, igual a `careRules.ts` / `taskTriage.ts` / `habitRhythm.ts`: funções
 * PURAS, sem React, sem localStorage, `now: Date` SEMPRE por parâmetro. Onde se
 * ESCREVE estado, a assinatura é genérica em `<T extends RitualState>` — quem
 * chama passa o `GameState` inteiro e recebe o `GameState` inteiro de volta,
 * sem perder campo nenhum no caminho.
 *
 * Textos em EN e PT-BR, sempre os dois (regra do projeto): o inglês é a base e
 * o PT vem junto pelo padrão `language === 'pt-BR' ? … : …`.
 */

import {
  MAX_DAILY_FOCUS,
  isActive,
  isHaunted,
  isOverdue,
  triageQueue,
  setFocus,
  plannedEffort,
  isOvercommitted,
  weightOf,
  parseDayValue,
  sameDay,
} from './taskTriage';
import type { TriageTask } from './taskTriage';
import { constancy, habitTier, dayKeyOf, weekStart, habitCountsOn } from './habitRhythm';
import type { Schedule } from '../types/taskModel';
import type { HabitRhythm } from './habitRhythm';
import type { RestState } from './restWindow';

export { MAX_DAILY_FOCUS };

// ---------------------------------------------------------------------------
// A fatia do estado que os rituais leem
// ---------------------------------------------------------------------------

/** Hábito, do ponto de vista dos rituais. */
export interface RitualActivity {
  id: string;
  name?: string;
  emoji?: string;
  category?: string;
  weekDays?: number[];
  schedule?: Schedule;
  completedToday?: boolean;
}

/** Tarefa concluída, do ponto de vista dos rituais. */
export interface RitualCompletedTask {
  id: string;
  name?: string;
  category?: string;
  completedAt?: string;
  focusDate?: string;
  effort?: 1 | 2 | 3;
}

/**
 * O recorte do `GameState` que este módulo enxerga.
 *
 * TODOS os campos são opcionais fora de `activities`/`tasks` porque nenhum save
 * existente tem `habitRhythms`, `rest` ou as três datas de ritual — e um save
 * antigo que quebra ao abrir é pior que qualquer ritual que este arquivo
 * entrega (mesma regra de `TriageTask`).
 */
export interface RitualState {
  activities?: RitualActivity[];
  tasks?: TriageTask[];
  completedTasks?: RitualCompletedTask[];
  habitRhythms?: Record<string, HabitRhythm>;
  rest?: RestState;
  /** dayKey (`toDateString`) do último check-in matinal. */
  lastCheckInDate?: string;
  /** dayKey do último relatório semanal mostrado. */
  lastWeeklyReportDate?: string;
  /** dayKey do último fresh start aceito. */
  lastFreshStartDate?: string;
}

export type RitualLanguage = string;

function isPt(language: RitualLanguage): boolean {
  return language === 'pt-BR';
}

const DAY_MS = 86400000;

function midnight(date: Date): Date {
  const d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, n: number): Date {
  const d = midnight(date);
  d.setDate(d.getDate() + n);
  return d;
}

// `parseDayValue`/`sameDay` vêm de `taskTriage` (dono da normalização de
// `startDate`/`focusDate`: ISO ou 'YYYY-MM-DD', o valor cru de um
// `<input type="date">`). Eram uma cópia byte-a-byte aqui — duas
// implementações da mesma comparação, ambas vivas, é o footgun 9 esperando a
// correção que só chega num dos lados.

const WEEKDAY_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_PT = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

// ---------------------------------------------------------------------------
// 1. Check-in matinal — o ritual de ≤20 segundos
// ---------------------------------------------------------------------------

/**
 * Precisa fazer o check-in de hoje?
 *
 * Um por dia civil, e só isso: `lastCheckInDate` não é hoje. Nada de janela de
 * horário — o "matinal" é o convite, não uma tranca. Quem só abre o app à noite
 * também tem direito ao ritual, e um app que recusasse o planejamento fora do
 * horário estaria cobrando pontualidade num produto que existe para reduzir
 * cobrança.
 */
export function needsCheckIn(state: RitualState, now: Date): boolean {
  return !sameDay(state.lastCheckInDate, dayKeyOf(now));
}

export interface CheckInPlan {
  /** Hábitos elegíveis hoje (pelo `weekDays`; sem o campo, vale todo dia). */
  habitsToday: RitualActivity[];
  /** Até `MAX_DAILY_FOCUS` tarefas sugeridas, assombradas/vencidas primeiro. */
  suggestedFocus: TriageTask[];
  /** Pendências de ONTEM — aparecem primeiro na UI. */
  carryOver: TriageTask[];
  overcommitted: boolean;
  plannedEffort: number;
}

/**
 * O plano do dia.
 *
 * `carryOver` vem PRIMEIRO por decisão de produto: é o Shutdown ritual do
 * Sunsama invertido para caber num app mobile. No Sunsama você fecha o dia à
 * noite; aqui, se você não fechou ontem, hoje COMEÇA por ali. A diferença é a
 * mesma em qualquer um dos dois sentidos — **a dívida nunca fica invisível**, e
 * é a dívida invisível (a pilha que cresce enquanto ninguém olha) que produz a
 * falência periódica descrita em `taskTriage.ts`.
 *
 * `suggestedFocus` prioriza o que está assombrado/vencido usando a MESMA fila
 * de `triageQueue` — a ordem de urgência tem um dono só, senão a sugestão do
 * check-in e a tela de triagem discordariam entre si sobre o que é urgente.
 * Depois das assombradas entram as tarefas já planejadas para hoje (startDate),
 * e só então o resto, das mais pesadas para as mais leves.
 *
 * A função SUGERE; ela não escolhe. Quem confirma é o usuário, em
 * `completeCheckIn` — decidir no lugar dele é o defeito pelo qual o Motion é
 * odiado, e `overcommitted` é aviso, nunca bloqueio (ver `isOvercommitted`).
 */
export function checkInPlan(state: RitualState, now: Date): CheckInPlan {
  const dayKey = dayKeyOf(now);
  const yesterdayKey = dayKeyOf(addDays(now, -1));

  const activities = state.activities ?? [];
  const tasks = state.tasks ?? [];
  const rhythms = state.habitRhythms ?? {};

  // Elegibilidade vem do DONO (`habitCountsOn`, utils/habitRhythm.ts), não de
  // `a.weekDays` cru. A leitura antiga era a segunda das três cópias da mesma
  // pergunta e concordava com a virada do dia só por acidente: o CreateModal
  // escreve `weekDays: [0..6]` para schedule flexível por compatibilidade com o
  // widget Android. O check-in mostrava um `everyNDays` todo dia como se fosse
  // devido — e a virada, corretamente, não o cobrava.
  const habitsToday = activities.filter(a => habitCountsOn(a, rhythms[a.id], now));

  const live = tasks.filter(t => isActive(t) && !t.completed);

  const carryOver = live.filter(
    t => sameDay(t.startDate, yesterdayKey) || sameDay(t.focusDate, yesterdayKey),
  );

  // Ordem da sugestão: (1) assombradas/vencidas, na ordem canônica da triagem;
  // (2) o que já estava planejado para hoje; (3) o resto, mais pesado primeiro
  // (o peso é o esforço — a tarefa difícil é justamente a que o jogador evita).
  const seen = new Set<string>();
  const ordered: TriageTask[] = [];
  const push = (t: TriageTask) => {
    if (seen.has(t.id)) return;
    seen.add(t.id);
    ordered.push(t);
  };

  for (const t of triageQueue(live, now)) push(t);
  for (const t of carryOver) push(t);
  for (const t of live.filter(x => sameDay(x.startDate, dayKey) || sameDay(x.focusDate, dayKey))) {
    push(t);
  }
  for (const t of live.slice().sort((a, b) => weightOf(b) - weightOf(a))) push(t);

  const suggestedFocus = ordered.slice(0, MAX_DAILY_FOCUS);

  const effort = plannedEffort(tasks, habitsToday, dayKey, rhythms);

  return {
    habitsToday,
    suggestedFocus,
    carryOver,
    overcommitted: isOvercommitted(effort),
    plannedEffort: effort,
  };
}

/**
 * Fecha o check-in: grava os focos escolhidos e a data do ritual.
 *
 * O corte em `MAX_DAILY_FOCUS` e a limpeza dos focos antigos são de `setFocus`
 * — este módulo não reimplementa a regra do foco, ele a chama. Regra copiada é
 * regra que diverge em silêncio (footgun 9 do CLAUDE.md).
 *
 * `lastCheckInDate` é o que faz `needsCheckIn` calar pelo resto do dia: o
 * ritual é diário, e reabri-lo a cada volta ao app transformaria planejamento
 * em interrupção.
 */
export function completeCheckIn<T extends RitualState>(
  state: T,
  focusIds: string[],
  dayKey: string,
): T {
  return {
    ...state,
    tasks: setFocus(state.tasks ?? [], focusIds, dayKey),
    lastCheckInDate: dayKey,
  };
}

// ---------------------------------------------------------------------------
// 2. Relatório semanal — domingo
// ---------------------------------------------------------------------------

/**
 * É domingo e o relatório desta semana ainda não foi mostrado?
 *
 * Uma vez por semana, e a checagem é pela SEMANA (domingo como início, igual a
 * `weekStart` em `habitRhythm.ts`) e não pelo dia: assim reabrir o app no mesmo
 * domingo não repete o ritual, e um domingo pulado não faz o relatório da
 * semana passada aparecer atrasado na segunda.
 */
export function needsWeeklyReport(state: RitualState, now: Date): boolean {
  if (now.getDay() !== 0) return false;
  const last = state.lastWeeklyReportDate;
  if (!last) return true;
  const lastDate = parseDayValue(last);
  if (!lastDate) return true;
  return weekStart(lastDate).getTime() !== weekStart(now).getTime();
}

export interface WeeklyHabitLine {
  id: string;
  name: string;
  emoji: string;
  /** Dias feitos na janela de constância (escudo conta como feito). */
  done: number;
  /** Denominador: dias em que o hábito era devido. */
  window: number;
  ratio: number;
  tier: ReturnType<typeof habitTier>;
}

export interface WeeklyReport {
  perHabit: WeeklyHabitLine[];
  /** O hábito mais constante da semana, ou `null` se não houver hábito. */
  bestHabitId: string | null;
  /** Categoria com mais conclusões na semana, ou `null` sem histórico. */
  dominantCategory: string | null;
  tasksDone: number;
  /** Esforço concluído — a métrica honesta. Contagem premiaria item trivial. */
  effortDone: number;
  /** Sonhos coletados até aqui (barra de coleção, nunca de desempenho). */
  dreams: number;
}

/**
 * A leitura da semana.
 *
 * Tudo aqui é DESCRIÇÃO, nunca veredito: constância por hábito, o hábito que
 * foi melhor, a categoria dominante, esforço concluído e o Dex de sonhos.
 * Nenhum número deste relatório pode diminuir por castigo — um relatório
 * semanal que cobrasse seria a tela que o usuário aprende a fechar sem ler, e
 * levaria junto a única parte do app que se apresenta como conselho.
 *
 * `effortDone` soma ESFORÇO e não itens, pelo motivo de sempre (`weightOf`):
 * medir por contagem ensina a cadastrar cinco coisas triviais.
 *
 * Histórico vazio devolve zeros e `null`s — nunca lança. Este relatório é a
 * primeira coisa que um usuário novo vê num domingo.
 */
export function weeklyReport(state: RitualState, now: Date): WeeklyReport {
  const activities = state.activities ?? [];
  const rhythms = state.habitRhythms ?? {};

  const perHabit: WeeklyHabitLine[] = activities.map(a => {
    const rhythm = rhythms[a.id];
    const c = rhythm
      ? constancy(rhythm, now)
      : { done: 0, window: 0, ratio: 1 };
    return {
      id: a.id,
      name: a.name ?? '',
      emoji: a.emoji ?? '✨',
      done: c.done,
      window: c.window,
      ratio: c.ratio,
      tier: habitTier(rhythm?.totalDone ?? 0),
    };
  });

  // Melhor hábito: maior razão e, no empate, quem fez mais dias — a razão
  // sozinha coroaria um hábito com um único dia devido (ratio 1) por cima de
  // quem manteve seis dos sete.
  let bestHabitId: string | null = null;
  let best: WeeklyHabitLine | null = null;
  for (const line of perHabit) {
    if (line.window === 0) continue;
    if (!best || line.ratio > best.ratio || (line.ratio === best.ratio && line.done > best.done)) {
      best = line;
      bestHabitId = line.id;
    }
  }

  // A janela é a das ÚLTIMAS 7 manhãs (a semana que acabou de passar), e não do
  // domingo em diante: o relatório aparece NO domingo, e uma janela que
  // começasse ali resumiria um dia só — o próprio. É a mesma janela de
  // `constancy`, o que mantém os hábitos e as tarefas falando do mesmo período.
  const start = addDays(now, -6).getTime();
  const end = midnight(now).getTime() + DAY_MS;
  const doneThisWeek = (state.completedTasks ?? []).filter(t => {
    if (!t.completedAt) return false;
    const at = new Date(t.completedAt).getTime();
    return !Number.isNaN(at) && at >= start && at < end;
  });

  const byCategory = new Map<string, number>();
  for (const t of doneThisWeek) {
    if (!t.category) continue;
    byCategory.set(t.category, (byCategory.get(t.category) ?? 0) + 1);
  }
  let dominantCategory: string | null = null;
  let bestCount = 0;
  for (const [cat, count] of byCategory) {
    if (count > bestCount) {
      bestCount = count;
      dominantCategory = cat;
    }
  }

  const effortDone = doneThisWeek.reduce((sum, t) => sum + weightOf({ id: t.id, effort: t.effort }), 0);

  return {
    perHabit,
    bestHabitId,
    dominantCategory,
    tasksDone: doneThisWeek.length,
    effortDone,
    dreams: state.rest?.dreams?.length ?? 0,
  };
}

/** Constância a partir da qual um hábito serve de ÂNCORA (o forte). */
export const STACKING_STRONG_RATIO = 0.8;
/** Constância abaixo da qual um hábito é candidato a ser ancorado (o fraco). */
export const STACKING_WEAK_RATIO = 0.5;
/** Dias registrados mínimos para a leitura valer alguma coisa. */
export const STACKING_MIN_WINDOW = 4;

/**
 * A sugestão de HABIT STACKING — "depois de X, faça Y".
 *
 * Acha um hábito com constância ALTA e um com constância BAIXA e propõe ancorar
 * o fraco logo depois do forte. É a implementation intention do Gollwitzer
 * aplicada ao que o app já sabe sobre a pessoa, e é a coisa mais próxima de "o
 * app melhorou minha vida" que dá para entregar sem IA nenhuma.
 *
 * **Sem dados suficientes, devolve `null` — e isso é a metade importante da
 * função.** Uma sugestão inventada em cima de dois ou três registros destrói a
 * confiança na única parte do app que se apresenta como CONSELHO, e conselho
 * desacreditado não volta a ser acreditado depois. O silêncio é a resposta
 * certa até a leitura existir; é o mesmo critério de `carePattern.ts`, que se
 * declara não-confiável e não desempata com pouco histórico.
 */
export function stackingSuggestion(
  state: RitualState,
  now: Date,
  language: RitualLanguage,
): string | null {
  const activities = state.activities ?? [];
  const rhythms = state.habitRhythms ?? {};

  type Line = { activity: RitualActivity; ratio: number; window: number; day: number };
  const lines: Line[] = [];

  for (const a of activities) {
    const rhythm = rhythms[a.id];
    if (!rhythm) continue;
    const c = constancy(rhythm, now);
    if (c.window < STACKING_MIN_WINDOW) continue;
    // O dia da semana mais frequente entre as conclusões — é ele que vira o
    // "às terças" da frase. Sem conclusão nenhuma, o hábito não pode ser âncora.
    const counts = new Map<number, number>();
    for (const key of rhythm.done) {
      const d = new Date(key);
      if (Number.isNaN(d.getTime())) continue;
      counts.set(d.getDay(), (counts.get(d.getDay()) ?? 0) + 1);
    }
    let day = -1;
    let top = 0;
    for (const [wd, n] of counts) {
      if (n > top) {
        top = n;
        day = wd;
      }
    }
    lines.push({ activity: a, ratio: c.ratio, window: c.window, day });
  }

  if (lines.length < 2) return null;

  const strong = lines
    .filter(l => l.ratio >= STACKING_STRONG_RATIO && l.day >= 0)
    .sort((a, b) => b.ratio - a.ratio)[0];
  const weak = lines
    .filter(l => l.ratio <= STACKING_WEAK_RATIO && l.activity.id !== strong?.activity.id)
    .sort((a, b) => a.ratio - b.ratio)[0];

  if (!strong || !weak) return null;

  const strongName = strong.activity.name ?? '';
  const weakName = weak.activity.name ?? '';
  if (!strongName || !weakName) return null;

  return isPt(language)
    ? `Você quase nunca falha em ${strongName} às ${WEEKDAY_PT[strong.day]}. Que tal fazer ${weakName} logo depois?`
    : `You almost never miss ${strongName} on ${WEEKDAY_EN[strong.day]}. How about doing ${weakName} right after?`;
}

// ---------------------------------------------------------------------------
// 3. Fresh start — o efeito de marco temporal
// ---------------------------------------------------------------------------

/**
 * Segunda-feira ou dia 1 do mês.
 *
 * Dai, Milkman & Riis (*fresh start effect*): marcos temporais aumentam adesão
 * porque "relegam as imperfeições ao período anterior" — a pessoa passa a ver a
 * si mesma como alguém novo, separado de quem falhou na semana passada. É o
 * antídoto NATIVO à quebra de sequência (o *what-the-hell effect* citado em
 * `taskModel.ts`) e o mecanismo programado de retorno do usuário lapsado, que é
 * exatamente o público que todo tracker perde em silêncio.
 *
 * A segunda-feira já é marco neste app por outro motivo (devolve 0,5 de HP);
 * este ritual é a mesma data ganhando significado explícito.
 */
export function isFreshStartDay(now: Date): boolean {
  return now.getDay() === 1 || now.getDate() === 1;
}

export interface FreshStartOffer {
  title: string;
  body: string;
}

/**
 * O convite de recomeço, ou `null` fora de um marco / se já foi aceito hoje.
 *
 * O texto diz por extenso o que a mecânica faz, e isso é requisito: um
 * "recomeçar" ambíguo faria o usuário temer perder o pet, e o medo de clicar é
 * pior que não oferecer nada.
 */
export function freshStartOffer(
  state: RitualState,
  now: Date,
  language: RitualLanguage,
): FreshStartOffer | null {
  if (!isFreshStartDay(now)) return null;
  if (sameDay(state.lastFreshStartDate, dayKeyOf(now))) return null;

  const monday = now.getDay() === 1;

  return isPt(language)
    ? {
        title: monday ? 'Semana nova' : 'Mês novo',
        body: 'Um recomeço limpo: as cobranças pendentes zeram. Sua evolução, seus marcos de hábito e sua coleção de sonhos continuam inteiros.',
      }
    : {
        title: monday ? 'A new week' : 'A new month',
        body: 'A clean restart: pending nagging is cleared. Your evolution, habit milestones and dream collection all stay exactly as they are.',
      };
}

/**
 * Aceita o recomeço.
 *
 * **FRESH START NUNCA APAGA PROGRESSO.** Mantém 100% da evolução
 * (`evolutionStage`, `perfectDays`, atributos), 100% dos marcos de hábito
 * (`habitRhythms`, incluindo `totalDone`, que é o que alimenta os marcos de
 * 7/21/66 dias) e 100% da coleção de sonhos (`rest.dreams`). Esta função sequer
 * TOCA nesses campos — o spread devolve tudo intacto, e há teste travando isso.
 *
 * Se um recomeço apagasse progresso, ele seria punição disfarçada de recomeço:
 * o usuário que mais precisa do marco temporal é justamente o lapsado, e
 * cobrar-lhe o histórico como pedágio para voltar é o jeito mais eficiente de
 * garantir que ele não volte. Vale também a regra do plano: aversão à perda
 * sobre itens recuperáveis (moedas, escudos), NUNCA sobre identidade ou
 * progresso acumulado.
 *
 * O que ele limpa é só a COBRANÇA pendente: zera `postponedCount` das tarefas
 * ativas, o que desarma o nudge de adiamento e devolve a lista sem o histórico
 * de evitação. A tarefa continua lá — recomeço não é amnésia, é perdão.
 */
export function applyFreshStart<T extends RitualState>(state: T, now: Date): T {
  const tasks = (state.tasks ?? []).map(t =>
    isActive(t) && (t.postponedCount ?? 0) > 0 ? { ...t, postponedCount: 0 } : t,
  );
  return {
    ...state,
    tasks,
    lastFreshStartDate: dayKeyOf(now),
  };
}

// Reexportado para a UI do check-in poder marcar a tarefa assombrada sem
// importar de dois módulos. O dono da regra continua sendo `taskTriage`.
export { isHaunted, isOverdue };
