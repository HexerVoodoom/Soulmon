import { FORM_REQUIREMENTS, MANUAL_EVOLUTION, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays, clampBranch } from '../types/progression';
import { CATEGORY_ATTRIBUTES, ActivityCategory } from '../types/attributes';
import { heartLossCap } from './passives';

// Tipos necessários para o reset
interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  steps: { id: string; label: string; completed: boolean; }[];
  weekDays: number[];
  alarm?: { time: string; };
  completedToday?: boolean;
  lastCompletedDate?: string;
}

interface Task {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completed: boolean;
}

export interface GameState {
  activities: Activity[];
  tasks: Task[];
  healthPoints: number;
  maxHealthPoints: number;
  perfectDays: number;
  totalXP: number;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  evolutionStage: string;
  unlockedEvolutions: string[];
  degeneratedByHP: boolean;
  currentBranch: 'virus' | 'data' | 'vaccine';
  lastDayWasPerfect: boolean;
  [key: string]: any;
}

// Calcula se o dia anterior foi perfeito (antes de resetar)
export function wasDayPerfect(prev: GameState): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  const yesterdayWeekDay = yesterday.getDay();
  
  let totalTasks = 0;
  let completedTasks = 0;
  
  // Filtra atividades disponíveis para ontem
  const availableActivities = !canSelectWeekdays(prev.evolutionStage)
    ? prev.activities
    : prev.activities.filter(a => a.weekDays?.includes(yesterdayWeekDay));
  
  availableActivities.forEach(activity => {
    totalTasks++;
    
    let isComplete = false;
    if (activity.steps.length > 0) {
      isComplete = activity.steps.every(s => s.completed);
    } else {
      isComplete = !!activity.completedToday && activity.lastCompletedDate === yesterdayString;
    }
    
    if (isComplete) {
      completedTasks++;
    }
  });
  
  // Adiciona tasks
  totalTasks += prev.tasks.length;
  completedTasks += prev.tasks.filter(t => t.completed).length;
  
  return totalTasks > 0 && completedTasks === totalTasks;
}

// Conta quantas tarefas foram concluídas ontem (para verificar se perdeu HP)
export function countCompletedYesterday(prev: GameState): number {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  const yesterdayWeekDay = yesterday.getDay();
  
  let completed = 0;
  
  const availableActivities = !canSelectWeekdays(prev.evolutionStage)
    ? prev.activities
    : prev.activities.filter(a => a.weekDays?.includes(yesterdayWeekDay));
  
  availableActivities.forEach(activity => {
    let isComplete = false;
    if (activity.steps.length > 0) {
      isComplete = activity.steps.every(s => s.completed);
    } else {
      isComplete = !!activity.completedToday && activity.lastCompletedDate === yesterdayString;
    }
    
    if (isComplete) {
      completed++;
    }
  });
  
  completed += prev.tasks.filter(t => t.completed).length;
  
  return completed;
}

type Attr = 'virus' | 'data' | 'vaccine';
const ALL_ATTRS: Attr[] = ['virus', 'data', 'vaccine'];

// Árvore do Soulmon: id embute nível+branch ('champion-virus', 'rookie',
// 'ultra' — ver types/progression.ts). Cada jogador tem nomes ÚNICOS
// (utils/oracle.ts) então a evolução é pura manipulação de id, sem tabela
// por espécie. O branch usado é sempre o ATRIBUTO DOMINANTE recente (pode
// mudar de uma evolução pra outra, se os pontos recentes mudarem de tipo).
export function getNextEvolution(
  currentStage: string,
  branch: Attr,
  unlockedEvolutions: string[],
): string {
  branch = clampBranch(branch) as Attr;
  const level = getStageLevel(currentStage);
  if (level === 'rookie') return `champion-${branch}`;
  if (level === 'champion') return `ultimate-${branch}`;
  if (level === 'ultimate') return `mega-${branch}`;
  if (level === 'mega') {
    if (ALL_ATTRS.every(a => unlockedEvolutions.includes(`mega-${a}`))) return 'ultra';
    return currentStage;
  }
  return currentStage; // ultra — já no topo
}

// Forma anterior determinística (degeneração): desce pelo MESMO branch da
// forma atual (embutido no id); só o passo ultra→mega não tem branch
// embutido, então usa o branch atual do jogo como critério.
export function getPreviousForm(currentStage: string, branch: Attr = 'data'): string {
  const level = getStageLevel(currentStage);
  const [, ownBranch] = currentStage.split('-');
  const stepBranch: Attr = (ownBranch as Attr) ?? branch;
  if (level === 'ultra') return `mega-${branch}`;
  if (level === 'mega') return `ultimate-${stepBranch}`;
  if (level === 'ultimate') return `champion-${stepBranch}`;
  return 'rookie';
}

// ---------------------------------------------------------------------------
// A VIRADA DO DIA
//
// Esta função é a ÚNICA fonte da regra. O hook (hooks/useDailyReset.ts) chama
// ela dentro do setGameState, e o teste (hooks/useDailyReset.test.ts) importa
// ELA MESMA — antes o teste reimplementava a lógica numa cópia (`simulateReset`)
// e podia passar com o app quebrado. Regra copiada = regra que diverge em
// silêncio; não recrie uma segunda cópia disto em lugar nenhum.
//
// O princípio que rege os números abaixo: o Soulmon é um avatar que evolui COM
// o usuário e o encoraja. A falha existe e tem consequência — mas nunca uma
// consequência que castigue mais forte justamente quem está numa fase pior.
// ---------------------------------------------------------------------------

/**
 * Teto de corações perdidos por virada de dia. A perda continua PROPORCIONAL
 * ao que não foi cumprido; isto só impede que um único dia zerado leve o pet de
 * cheio a degenerado de uma vez. Um dia ruim é um sinal, não uma sentença.
 */
export const MAX_HEARTS_LOST_PER_DAY = 1;

/**
 * A partir de quantos dias sem abrir o app a virada para de cobrar HP. Quem
 * volta depois de sumir encontra o pet com saudade, não uma fatura.
 */
export const ABSENCE_FORGIVENESS_DAYS = 2;

/** Meio coração de volta na virada de domingo→segunda: o teto do estrago é 7 dias. */
export const WEEKLY_RELIEF_HEARTS = 0.5;

/** Quantos dias se passaram desde a última virada. 1 = virada normal de ontem. */
export function daysSinceLastReset(lastResetDate: string | undefined, now: Date): number {
  if (!lastResetDate) return 1;
  const last = new Date(lastResetDate);
  if (Number.isNaN(last.getTime())) return 1;
  const a = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const b = new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
  return Math.max(1, Math.round((a - b) / 86400000));
}

export interface DailyResetOptions {
  /** Injetável para teste; usa a data real por padrão. */
  now?: Date;
}

/**
 * Calcula o estado do dia seguinte. Função PURA — não toca em localStorage nem
 * dispara efeito nenhum (StrictMode invoca updaters 2×).
 */
export function computeDailyReset<T extends Record<string, any>>(prev: T, opts: DailyResetOptions = {}): T {
  const now = opts.now ?? new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayString = yesterday.toDateString();
  const yesterdayWeekDay = yesterday.getDay();

  const currentLevel = getStageLevel(prev.evolutionStage);
  const requirements = FORM_REQUIREMENTS[currentLevel];
  const requiredToday = requirements.required;

  let dailyDone = 0;
  const availableActivities = !canSelectWeekdays(prev.evolutionStage)
    ? prev.activities
    : prev.activities.filter((a: any) => a.weekDays?.includes(yesterdayWeekDay));

  availableActivities.forEach((activity: any) => {
    let isComplete = false;
    if (activity.steps.length > 0) {
      isComplete = activity.steps.every((s: any) => s.completed);
    } else {
      isComplete = !!activity.completedToday && activity.lastCompletedDate === yesterdayString;
    }
    if (isComplete) dailyDone++;
  });

  dailyDone += prev.tasks.filter((t: any) => t.completed).length;

  // Meta do dia = min(cadastradas, requisito do estágio). Cumprir o que você
  // mesmo se comprometeu a fazer basta; cadastrar MAIS nunca aumenta o risco.
  // É o análogo exato da fórmula do Vital Bracelet, que mede o esforço pelo
  // delta do SEU próprio batimento de base — o jogo compara você com você.
  const totalTasks = availableActivities.length + prev.tasks.length;
  const dailyGoal = Math.min(totalTasks, requiredToday);

  // Barras de energia = requisito de tarefas do estágio.
  const energyWasFull = (prev.energyPoints ?? 0) >= requiredToday;
  const dayWasPerfect = totalTasks > 0 && dailyDone >= dailyGoal && energyWasFull;

  // Ausência: se o app ficou dias sem abrir, não há o que cobrar — as tarefas
  // daqueles dias nem chegaram a ser registradas. Cobrar aqui puniria o retorno,
  // que é exatamente o momento que precisa ser acolhedor.
  const daysAway = daysSinceLastReset(prev.lastResetDate, now);
  const wasAway = daysAway >= ABSENCE_FORGIVENESS_DAYS;

  let newHP = prev.healthPoints;
  let newPerfectDays = prev.perfectDays;
  let newEvolutionStage = prev.evolutionStage;
  const finalUnlockedEvolutions = [...prev.unlockedEvolutions];
  let wasDegeneratedByHP = false;
  let newMaxActivityCap = prev.maxActivityCap;
  let newCurrentBranch = prev.currentBranch as Attr;
  let newRecentAttrs = {
    virus: prev.attributesSinceLastEvolution?.virus ?? 0,
    data: prev.attributesSinceLastEvolution?.data ?? 0,
    vaccine: prev.attributesSinceLastEvolution?.vaccine ?? 0,
  };

  // Perda de HP: proporcional ao que NÃO foi feito, medido contra a mesma meta,
  // e limitada a MAX_HEARTS_LOST_PER_DAY. Sem tarefas cadastradas, nada a falhar.
  const completionRatio = dailyGoal > 0 ? Math.min(1, dailyDone / dailyGoal) : 1;
  const rawHeartsLost = Math.floor((1 - completionRatio) * prev.maxHealthPoints);
  // Teimoso (utils/passives.ts) aguenta melhor um dia ruim.
  const lossCap = heartLossCap(prev.petPassive, MAX_HEARTS_LOST_PER_DAY);
  const heartsLost = wasAway ? 0 : Math.min(rawHeartsLost, lossCap);
  if (heartsLost > 0) {
    newHP = Math.max(0, prev.healthPoints - heartsLost);
  }

  // Alívio de segunda-feira: meio coração de volta, limitado ao máximo do
  // estágio. Semana nova começa com fôlego (o Snorlax do Pokémon Sleep reinicia
  // toda segunda pelo mesmo motivo).
  const isMonday = now.getDay() === 1;
  if (isMonday && newHP > 0) {
    newHP = Math.min(prev.maxHealthPoints, newHP + WEEKLY_RELIEF_HEARTS);
  }

  if (dayWasPerfect) {
    newPerfectDays++;
  }
  // Dia não-perfeito NÃO tira perfectDays. O contador acumula e só zera ao
  // evoluir — que é o que o CLAUDE.md sempre documentou. Um contador que zera
  // dispara o "já quebrei, quebra tudo" e leva ao abandono.

  // Evolução. O cadeado na página de Evolução bloqueia por completo: os dias
  // perfeitos seguem acumulando e a evolução acontece na virada seguinte ao
  // destravar.
  if (!MANUAL_EVOLUTION && !prev.evolutionLocked && newPerfectDays >= requirements.required) {
    newPerfectDays = 0;

    // Branch = atributo dominante RECENTE (não o total histórico), pra que o
    // hábito atual do jogador ainda mande no rumo da evolução.
    const recentV = newRecentAttrs.virus;
    const recentD = newRecentAttrs.data;
    const recentVac = newRecentAttrs.vaccine;
    const dominantAttr = Math.max(recentV, recentD, recentVac);
    let branch = prev.currentBranch as Attr;
    if (dominantAttr > 0) {
      if (recentV === dominantAttr) branch = 'virus';
      else if (recentD === dominantAttr) branch = 'data';
      else branch = 'vaccine';
    }
    newCurrentBranch = branch;
    newRecentAttrs = { virus: 0, data: 0, vaccine: 0 };

    newEvolutionStage = getNextEvolution(prev.evolutionStage, branch, prev.unlockedEvolutions);
    const naturalNext = newEvolutionStage;

    const newStageLevel = getStageLevel(newEvolutionStage);
    newHP = MAX_HP_BY_FORM[newStageLevel];
    const newCap = FORM_REQUIREMENTS[newStageLevel].cap;
    if (newCap > newMaxActivityCap) newMaxActivityCap = newCap;

    if (!finalUnlockedEvolutions.includes(naturalNext)) {
      finalUnlockedEvolutions.push(naturalNext);
    }
  }

  // Degeneração por HP zerado.
  if (newHP <= 0) {
    wasDegeneratedByHP = true;
    newEvolutionStage = getPreviousForm(prev.evolutionStage, newCurrentBranch);

    const degeneratedLevel = getStageLevel(newEvolutionStage);
    newHP = MAX_HP_BY_FORM[degeneratedLevel];
    // Desconto de recuperação: voltar ao estágio de onde caiu custa metade dos
    // dias perfeitos. Não é cumulativo — é sempre metade do requisito do estágio
    // NOVO (mais baixo), então uma segunda queda ganha o mesmo desconto.
    newPerfectDays = Math.floor(FORM_REQUIREMENTS[degeneratedLevel].required / 2);
    newRecentAttrs = { virus: 0, data: 0, vaccine: 0 };
  }

  const resetActivities = prev.activities.map((activity: any) => ({
    ...activity,
    steps: activity.steps.map((step: any) => ({ ...step, completed: false })),
    completedToday: false,
  }));

  const resetTasks = prev.tasks.map((task: any) => ({ ...task, completed: false }));

  const finalStageLevel = getStageLevel(newEvolutionStage);
  const newMaxHP = MAX_HP_BY_FORM[finalStageLevel];

  return {
    ...prev,
    activities: resetActivities,
    tasks: resetTasks,
    healthPoints: Math.min(newHP, newMaxHP),
    maxHealthPoints: newMaxHP,
    perfectDays: newPerfectDays,
    lastResetDate: now.toDateString(),
    evolutionStage: newEvolutionStage,
    digivolutionSegments: 0,
    digivolutionSegmentsNeeded: 999,
    poopEventsScheduled: [],
    poopEventsCompleted: [],
    poopEventsShown: [],
    poopPenaltyClockAt: 0,
    currentBranch: newCurrentBranch,
    unlockedEvolutions: finalUnlockedEvolutions,
    degeneratedByHP: wasDegeneratedByHP,
    lastDayWasPerfect: dayWasPerfect,
    // Contador vitalício de dias perfeitos (missões) — nunca zera ao evoluir.
    totalPerfectDays: (prev.totalPerfectDays ?? 0) + (dayWasPerfect ? 1 : 0),
    maxActivityCap: newMaxActivityCap,
    attributesSinceLastEvolution: newRecentAttrs,
    energyPoints: 0, // Energia zera todo dia (enche comendo)
    // Resumo de ontem, mostrado 1× como "relatório diário" na próxima abertura.
    lastDayReport: {
      date: yesterdayString,
      done: dailyDone,
      total: totalTasks,
      required: dailyGoal,
      heartsLost,
      wasPerfect: dayWasPerfect,
      energyWasFull,
      perfectDays: newPerfectDays,
      degenerated: wasDegeneratedByHP,
      // Modo boas-vindas: a UI deve receber quem voltou sem nenhuma cobrança.
      welcomeBack: wasAway,
      daysAway: wasAway ? daysAway : 0,
      weeklyRelief: isMonday,
    },
  };
}
