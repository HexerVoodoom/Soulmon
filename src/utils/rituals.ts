/**
 * OS RITUAIS — CHECK-IN E FRESH START
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
 * (`checkInPlan`) e oferecem recomeço (`freshStartOffer`). O que
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
import { dayKeyOf, habitCountsOn, needsIntervention } from './habitRhythm';
import type { Schedule } from '../types/taskModel';
import type { HabitRhythm } from './habitRhythm';
import type { RestState } from './restWindow';
import { playerDayKey, type PlayerDayAnchor } from './playerDay';

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
  /** Fuso FIXO do dia do jogador; só `lastCheckInDate` o consome aqui. Os
   *  demais dayKeys deste arquivo (semana, fresh start) seguem em `dayKeyOf`,
   *  que NÃO pode mudar — ver o cabeçalho de `playerDay.ts`. */
  playerDayTz?: PlayerDayAnchor;
  /**
   * Chave do DIA DO JOGADOR (`utils/playerDay.ts`) do último check-in matinal.
   *
   * ⚠️ Este campo mora no SAVE de propósito — "o ritual é do jogador, não do
   * aparelho", diz o comentário do efeito que o abre no `App.tsx`. Só que ele
   * era gravado com o dia do APARELHO, e a frase virava mentira na prática:
   * quem plantava o check-in às 23h no Brasil abria o app em Tóquio (mesmo
   * instante, 11h do dia seguinte lá) e o ritual reaparecia — planejamento
   * virando interrupção, que é exatamente o que o campo existe para evitar.
   */
  lastCheckInDate?: string;
  /** dayKey do último fresh start aceito. */
  lastFreshStartDate?: string;
}

export type RitualLanguage = string;

function isPt(language: RitualLanguage): boolean {
  return language === 'pt-BR';
}

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
  // `playerDayKey` e não `dayKeyOf`: sem âncora no save as duas devolvem a
  // MESMA string, então isto não muda nada para quem ainda não migrou — e com
  // âncora os dois aparelhos passam a concordar sobre qual dia é hoje.
  return !sameDay(state.lastCheckInDate, playerDayKey(now, state.playerDayTz));
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
  /**
   * Ids dos hábitos de hoje que faltaram DUAS vezes seguidas e por isso ganham
   * a oferta reduzida ("hoje, só 5 minutos?") — a regra never-miss-twice.
   *
   * Vem como lista de ids e não como campo dentro de cada hábito de propósito:
   * `habitsToday` é a atividade do save, e pendurar nela um estado de UI faria
   * a fatia do save carregar julgamento sobre a pessoa.
   */
  tinyOffer: string[];
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
  /* WP2.10 — a primeira falta não gera NADA visível; a segunda gera uma oferta.
     `needsIntervention` existia com teste e 40 linhas de comentário e nenhum
     componente o chamava: o guia e o `CLAUDE.md` prometiam que "o pet oferece
     uma versão bem menor do hábito" e o pet nunca ofereceu nada. */
  const tinyOffer = habitsToday
    .filter(a => rhythms[a.id] && needsIntervention(rhythms[a.id], now))
    .map(a => a.id);

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
    tinyOffer,
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
export function isFreshStartDay(now: Date, state?: RitualState): boolean {
  if (now.getDay() !== 1 && now.getDate() !== 1) return false;
  // O calendário é condição NECESSÁRIA, não suficiente (ver
  // `freshStartHasSomethingToClear`). O parâmetro é opcional para quem só
  // pergunta "hoje é um marco?" — a pergunta de calendário continua tendo
  // resposta de calendário.
  return state ? freshStartHasSomethingToClear(state) : true;
}

/**
 * Existe COBRANÇA PENDENTE para o recomeço limpar?
 *
 * O fresh start é perdão de dívida, e perdão de dívida oferecido a quem não deve
 * nada não é neutro: ele APRESENTA a dívida. Caso medido: quem instala o app no
 * sábado ou no domingo cai numa segunda-feira na sessão seguinte e recebe "um
 * recomeço limpo: as cobranças pendentes zeram" antes de ter adiado uma única
 * tarefa. A mensagem ensina ao usuário novo que ele já acumulou alguma coisa
 * errada — exatamente o enquadramento que este app existe para não fazer.
 *
 * O critério é o que `applyFreshStart` de fato faz: zerar `postponedCount` das
 * tarefas ativas. Sem nenhuma tarefa ativa adiada, aceitar o convite seria um
 * no-op — o ritual não teria nem o que perdoar. Nenhum progresso entra nesta
 * conta, pela mesma razão de sempre: o fresh start não olha para progresso.
 */
export function freshStartHasSomethingToClear(state: RitualState): boolean {
  return (state.tasks ?? []).some(t => isActive(t) && (t.postponedCount ?? 0) > 0);
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
  if (!isFreshStartDay(now, state)) return null;
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
