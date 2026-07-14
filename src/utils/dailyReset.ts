import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays } from '../types/progression';
import { CATEGORY_ATTRIBUTES, ActivityCategory } from '../types/attributes';

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
