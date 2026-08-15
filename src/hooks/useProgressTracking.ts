import { useMemo } from 'react';
import { canSelectWeekdays } from '../types/progression';
import { dailyGoalFor } from '../utils/dailyReset';
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
}

interface CompletedTask {
  id: string;
  completedAt: string;
}

interface ProgressState {
  activities: Activity[];
  tasks: Task[];
  completedTasks: CompletedTask[];
  evolutionStage: string;
}

export function useProgressTracking(gameState: ProgressState) {
  const today = useMemo(() => new Date().toDateString(), []);
  const todayWeekDay = useMemo(() => new Date().getDay(), []);

  const tasksCompletedToday = useMemo(
    () => gameState.completedTasks.filter(ct => new Date(ct.completedAt).toDateString() === today),
    [gameState.completedTasks, today],
  );

  const availableActivities = useMemo(() => {
    if (!canSelectWeekdays(gameState.evolutionStage)) return gameState.activities;
    return gameState.activities.filter(a => a.weekDays?.includes(todayWeekDay));
  }, [gameState.activities, gameState.evolutionStage, todayWeekDay]);

  // DENOMINADOR EXIBIDO = META DO DIA, e nunca o cadastro cru.
  //
  // Era `availableActivities.length + tasks.length + tasksCompletedToday.length`
  // — o cadastro inteiro. Esse número vai para o widget Android (App.tsx →
  // DigiWidgetPlugin → WidgetRenderer: "$completedTasks/$totalTasks" e a
  // mensagem contextual). Um mega com meta 6 e 9 itens cadastrados que fizesse
  // 6 CUMPRIU a meta, não perde nada e ganha o dia perfeito — e mesmo assim via
  // "6/9" e "💪 Quase lá!" na tela de bloqueio o dia inteiro. O jogo não cobra;
  // a tela cobrava por ele, no canal que o usuário nem pediu para abrir.
  //
  // A meta vem do dono da regra (`dailyGoalFor`), NUNCA de uma cópia da fórmula.
  const dailyTotal = useMemo(
    () => dailyGoalFor(gameState, todayWeekDay, today),
    [gameState, todayWeekDay, today],
  );

  const dailyDoneRaw = useMemo(() => {
    let count = 0;

    availableActivities.forEach(activity => {
      let isComplete = false;
      if (activity.steps.length > 0) {
        isComplete = activity.steps.every(s => s.completed);
      } else {
        isComplete = !!activity.completedToday && activity.lastCompletedDate === today;
      }
      if (isComplete) count++;
    });

    count += gameState.tasks.filter(t => t.completed).length;
    count += tasksCompletedToday.length;
    return count;
  }, [availableActivities, gameState.tasks, tasksCompletedToday, today]);

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
    let virus = 0;
    let data = 0;
    let vaccine = 0;

    gameState.activities.forEach(activity => {
      const isComplete =
        activity.steps.length > 0
          ? activity.steps.every(s => s.completed)
          : !!activity.completedToday && activity.lastCompletedDate === today;

      if (isComplete) {
        const attrs = CATEGORY_ATTRIBUTES[activity.category];
        virus += attrs.virus;
        data += attrs.data;
        vaccine += attrs.vaccine;
      }
    });

    return { virus, data, vaccine };
  }, [gameState.activities, today]);

  return { dailyTotal, dailyDone, progress, todayAttributes };
}
