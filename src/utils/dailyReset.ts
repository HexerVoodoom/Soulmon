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
      isComplete = activity.completedToday && activity.lastCompletedDate === yesterdayString;
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
      isComplete = activity.completedToday && activity.lastCompletedDate === yesterdayString;
    }
    
    if (isComplete) {
      completed++;
    }
  });
  
  completed += prev.tasks.filter(t => t.completed).length;
  
  return completed;
}

// Determina a próxima evolução baseada no estágio atual e branch
export function getNextEvolution(currentStage: string, branch: 'virus' | 'data' | 'vaccine', unlockedEvolutions: string[]): string {
  // Digiegg -> Baby I
  if (currentStage === 'digiegg') {
    return 'koromon';
  }
  
  // Baby I -> Baby II
  if (currentStage === 'koromon') {
    // Baseado no branch escolhido
    if (branch === 'virus') return 'tsunomon';
    if (branch === 'vaccine') return 'pagumon';
    return 'tsunomon'; // Default
  }
  
  // Baby II -> Rookie
  if (['tsunomon', 'pagumon'].includes(currentStage)) {
    if (branch === 'virus') return 'tapirmon';
    if (branch === 'data') return 'kudamon';
    if (branch === 'vaccine') return 'kamemon';
    return 'kudamon'; // Default
  }
  
  // Rookie -> Champion
  if (['tapirmon', 'kudamon', 'kamemon'].includes(currentStage)) {
    if (branch === 'virus') {
      return ['monochromon', 'tyrannomon', 'ogremon'][Math.floor(Math.random() * 3)];
    }
    if (branch === 'data') {
      return ['meramon', 'leomon', 'ikkakumon'][Math.floor(Math.random() * 3)];
    }
    if (branch === 'vaccine') {
      return ['geremon', 'bakemon', 'devimon'][Math.floor(Math.random() * 3)];
    }
    return 'leomon';
  }
  
  // Champion -> Ultimate
  if ([
    'monochromon', 'tyrannomon', 'ogremon',
    'meramon', 'leomon', 'ikkakumon',
    'geremon', 'bakemon', 'devimon'
  ].includes(currentStage)) {
    if (branch === 'virus') return 'megadramon';
    if (branch === 'data') return 'gigadramon';
    if (branch === 'vaccine') return 'triceramon';
    return 'gigadramon';
  }
  
  // Ultimate -> Mega
  if (['megadramon', 'gigadramon', 'triceramon', 'digitamamon'].includes(currentStage)) {
    if (branch === 'virus') return 'gaioumon';
    if (branch === 'data') return 'ultimatebrachiomon';
    if (branch === 'vaccine') return 'titamon';
    return 'ultimatebrachiomon';
  }
  
  // Mega -> Ultra (só se tiver desbloqueado os 3 megas)
  if (['gaioumon', 'ultimatebrachiomon', 'titamon'].includes(currentStage)) {
    const hasAllMegas = ['gaioumon', 'ultimatebrachiomon', 'titamon'].every(m => 
      unlockedEvolutions.includes(m)
    );
    
    if (hasAllMegas) {
      return 'gaioumon-itto';
    }
  }
  
  return currentStage; // Sem evolução
}

// Determina a forma anterior para degeneração
export function getPreviousForm(currentStage: string): string {
  if (currentStage === 'gaioumon-itto') return 'gaioumon';
  
  if (['gaioumon', 'ultimatebrachiomon', 'titamon'].includes(currentStage)) {
    // Devolve para um Ultimate aleatório
    return ['megadramon', 'gigadramon', 'triceramon'][Math.floor(Math.random() * 3)];
  }
  
  if (['megadramon', 'gigadramon', 'triceramon', 'digitamamon'].includes(currentStage)) {
    // Devolve para um Champion aleatório
    return ['monochromon', 'tyrannomon', 'ogremon', 'meramon', 'leomon', 'ikkakumon'][Math.floor(Math.random() * 6)];
  }
  
  if ([
    'monochromon', 'tyrannomon', 'ogremon',
    'meramon', 'leomon', 'ikkakumon',
    'geremon', 'bakemon', 'devimon'
  ].includes(currentStage)) {
    return ['tapirmon', 'kudamon', 'kamemon'][Math.floor(Math.random() * 3)];
  }
  
  if (['tapirmon', 'kudamon', 'kamemon'].includes(currentStage)) {
    return ['tsunomon', 'pagumon'][Math.floor(Math.random() * 2)];
  }
  
  if (['tsunomon', 'pagumon'].includes(currentStage)) {
    return 'koromon';
  }
  
  if (currentStage === 'koromon') {
    return 'digiegg';
  }
  
  return 'digiegg'; // Fallback
}
