import { useEffect, useMemo, useState } from 'react';
import { activitiesForWeekDay, dailyGoalFor, tasksCompletedOn } from '../utils/dailyReset';
import { HABIT_WEIGHT, normalizeEffort } from '../types/taskModel';
import { CATEGORY_ATTRIBUTES, ActivityCategory } from '../types/attributes';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface Activity {
  id: string;
  category: ActivityCategory;
  steps: Step[];
  weekDays: number[];
  completedToday?: boolean;
  lastCompletedDate?: string;
}

interface Task {
  id: string;
  completed: boolean;
  /** Peso de esforço (1–3). Ausente em save antigo → `normalizeEffort` dá 1. */
  effort?: unknown;
  /** `someday`/`dropped` não entram na meta nem no feito. */
  status?: string;
}

interface CompletedTask {
  id: string;
  completedAt: string;
  effort?: unknown;
}

interface ProgressState {
  activities: Activity[];
  tasks: Task[];
  completedTasks: CompletedTask[];
  evolutionStage: string;
  /**
   * Escrito por `computeDailyReset` na virada (`now.toDateString()`). É o SINAL
   * de virada de dia que este hook observa — ver `useTodayKey`.
   */
  lastResetDate?: string;
}

/**
 * O DIA DE HOJE, RECALCULADO QUANDO O DIA VIRA.
 *
 * Isto já foi `useMemo(() => new Date().toDateString(), [])` — congelado no
 * mount. Como o `App` nunca remonta, um app deixado aberto das 23h50 às 00h10
 * seguia usando a string e o dia-da-semana de ONTEM: a virada rodava certo, mas
 * daí em diante `lastCompletedDate === today` comparava com ontem (nenhum hábito
 * marcado no dia novo movia a barra), a meta exibida era a do dia da semana
 * errado e, com `progress` preso em 0, o pet ficava `tired` o dia inteiro — e
 * esses mesmos números vão para o widget Android. O jogo não cobrava; a tela
 * cobrava por ele.
 *
 * Três gatilhos, nenhum deles um ticker (footgun documentado: ticker de 1s
 * re-renderiza o app inteiro):
 *  1. `resetSignal` (`gameState.lastResetDate`) — a virada de dia já é checada a
 *     cada 30s por `useDailyReset` e grava esse campo. É o sinal canônico.
 *  2. `visibilitychange` — voltar ao app depois de horas em segundo plano.
 *  3. `focus` — mesma coisa em desktop/PWA com a aba visível mas sem foco.
 *
 * `setToday` devolve `prev` quando nada mudou, então nenhum desses gatilhos
 * causa render à toa.
 */
function useTodayKey(resetSignal?: string): string {
  const [today, setToday] = useState(() => new Date().toDateString());

  useEffect(() => {
    const sync = () => setToday(prev => {
      const agora = new Date().toDateString();
      return prev === agora ? prev : agora;
    });
    sync();
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('focus', sync);
    return () => {
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('focus', sync);
    };
  }, [resetSignal]);

  return today;
}

/**
 * PESO DE ESFORÇO CONCLUÍDO NO DIA — a MESMA unidade da meta (`dailyGoalFor`).
 *
 * Espelha o bloco de `computeDailyReset` (utils/dailyReset.ts): hábito do dia
 * fechado pesa `HABIT_WEIGHT`, tarefa pesa o próprio `effort`. Os dois lados da
 * razão TÊM que usar a mesma unidade — se o feito contasse itens e a meta
 * contasse esforço, quem concluísse uma tarefa `effort:3` veria "1/3" tendo
 * feito 100% da meta (a assimetria que o CLAUDE.md proíbe).
 *
 * Exportada porque o `App` também precisa da resposta (o toast de "uma ação,
 * várias barras") e recontar lá foi exatamente o bug: três divergências em
 * silêncio. Enquanto `dailyReset.ts` não expuser um `doneForDay` próprio, ESTE
 * é o dono único do lado "feito" na camada de UI — quem precisar do número
 * chama aqui, não reconta.
 */
export function doneWeightFor(
  state: ProgressState,
  weekDay: number,
  dayKey: string,
): number {
  let peso = 0;

  // A MESMA lista que o denominador usa (`registeredForDay` → `activitiesForWeekDay`):
  // ler `weekDays` cru aqui deixava o numerador cego para os agendamentos
  // flexíveis (`timesPerWeek`/`everyNDays`) que o denominador já entende.
  activitiesForWeekDay(state as any, weekDay, dayKey).forEach((activity: any) => {
    const isComplete = activity.steps.length > 0
      // Hábito com etapas fecha na ÚLTIMA etapa — `completedToday` nunca é
      // escrito para ele, então quem só usa hábitos em etapas via sempre 0.
      ? activity.steps.every((s: Step) => s.completed)
      : !!activity.completedToday && activity.lastCompletedDate === dayKey;
    if (isComplete) peso += HABIT_WEIGHT;
  });

  // Tarefas marcadas que ainda estão na lista (janela de 3s até saírem) MAIS as
  // que já foram para `completedTasks`. Só as ativas: `someday`/`dropped` são as
  // duas saídas honestas do backlog e não viram cobrança nova.
  peso += state.tasks
    .filter(t => t.completed && (t.status ?? 'open') === 'open')
    .reduce((s, t) => s + normalizeEffort(t.effort), 0);
  peso += tasksCompletedOn(state as any, dayKey);

  return peso;
}

export function useProgressTracking(gameState: ProgressState) {
  const today = useTodayKey(gameState.lastResetDate);
  // Derivado de `today` (uma fonte só) — se os dois fossem calculados em
  // separado, eles poderiam discordar exatamente na virada.
  const todayWeekDay = useMemo(() => new Date(today).getDay(), [today]);

  // DENOMINADOR EXIBIDO = META DO DIA, e nunca o cadastro cru.
  //
  // Era `availableActivities.length + tasks.length + tasksCompletedToday.length`
  // — o cadastro inteiro. Esse número vai para o widget Android (App.tsx →
  // SoulmonWidgetPlugin → WidgetRenderer: "$completedTasks/$totalTasks" e a
  // mensagem contextual). Um mega com meta 6 e 9 itens cadastrados que fizesse
  // 6 CUMPRIU a meta, não perde nada e ganha o dia perfeito — e mesmo assim via
  // "6/9" e "💪 Quase lá!" na tela de bloqueio o dia inteiro. O jogo não cobra;
  // a tela cobrava por ele, no canal que o usuário nem pediu para abrir.
  //
  // A meta vem do dono da regra (`dailyGoalFor`), NUNCA de uma cópia da fórmula.
  const dailyTotal = useMemo(
    () => dailyGoalFor(gameState as any, todayWeekDay, today),
    [gameState, todayWeekDay, today],
  );

  const dailyDoneRaw = useMemo(
    () => doneWeightFor(gameState, todayWeekDay, today),
    [gameState, todayWeekDay, today],
  );

  // Concluídas, com TETO NA META. Quem fez 8 de uma meta 6 fez a meta — não
  // existe "mais que 100%", e o widget não deve exibir "8/6".
  //
  // NOTA: aqui vivia `isDayPerfect = dailyTotal > 0 && dailyDone === dailyTotal`
  // — uma SEGUNDA definição de dia perfeito, que exigia fazer TUDO o que estava
  // cadastrado, dormindo no repositório sem um único consumidor. A regra real
  // vive em `computeDailyReset` e a resposta pronta em `lastDayReport.wasPerfect`.
  // Não recrie: duas definições da mesma regra divergem em silêncio (footgun 9).
  const dailyDone = useMemo(
    () => Math.min(dailyDoneRaw, dailyTotal),
    [dailyDoneRaw, dailyTotal],
  );

  // BARRA/HUMOR DO PET = a mesma meta que o jogo cobra.
  //
  // Antes o denominador daqui era cru E contava SUB-PASSOS: uma atividade
  // quebrada em 5 passos valia 5 no denominador da barra e 1 na meta. Efeito
  // medido: quem quebra tarefa grande em passos pequenos — a técnica de mudança
  // de comportamento que o app tem componente próprio para suportar (StepRow) —
  // via o pet ficar `tired` (progress <= 15) por MAIS tempo que quem não quebra.
  // O app punia visualmente exatamente a prática que deveria premiar.
  //
  // Passo agora conta como o resto do jogo já contava (`dailyDone`): a atividade
  // vale 1 quando TODOS os passos fecham. Avanço parcial de passos, se um dia
  // for exibido, é barra secundária dentro do card — nunca o humor do pet.
  const progress = useMemo(
    () => (dailyTotal > 0 ? Math.round(Math.min(1, dailyDone / dailyTotal) * 100) : 0),
    [dailyDone, dailyTotal],
  );

  const todayAttributes = useMemo(() => {
    let power = 0;
    let harmony = 0;
    let benevolence = 0;

    gameState.activities.forEach(activity => {
      const isComplete =
        activity.steps.length > 0
          ? activity.steps.every(s => s.completed)
          : !!activity.completedToday && activity.lastCompletedDate === today;

      if (isComplete) {
        const attrs = CATEGORY_ATTRIBUTES[activity.category];
        power += attrs.power;
        harmony += attrs.harmony;
        benevolence += attrs.benevolence;
      }
    });

    return { power, harmony, benevolence };
  }, [gameState.activities, today]);

  return { dailyTotal, dailyDone, progress, todayAttributes };
}
