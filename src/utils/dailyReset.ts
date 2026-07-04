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

type EggLine = 'tapirmon' | 'veemon' | 'salamon';
type Attr = 'virus' | 'data' | 'vaccine';

// Determina a próxima evolução para todas as 3 linhas
export function getNextEvolution(
  currentStage: string,
  eggType: EggLine,
  branch: Attr,
  unlockedEvolutions: string[],
): string {
  // Item-digivolution forms (shop): continue the line as if the pet were the
  // branch form the item replaced at that level.
  const ITEM_FORM_LEVEL: Record<string, 'champion' | 'ultimate'> = {
    greymon: 'champion', garurumon: 'champion', meramon: 'champion', devimon: 'champion',
    monzaemon: 'ultimate', etemon: 'ultimate', andromon: 'ultimate',
  };
  if (ITEM_FORM_LEVEL[currentStage]) {
    const NATURAL: Record<EggLine, Record<'champion' | 'ultimate', Record<Attr, string>>> = {
      tapirmon: {
        champion: { virus: 'tuskmon', data: 'monochromon', vaccine: 'bakemon' },
        ultimate: { virus: 'gigadramon', data: 'triceramon', vaccine: 'digitamamon' },
      },
      veemon: {
        champion: { data: 'exveemon', virus: 'veedramon', vaccine: 'flamedramon' },
        ultimate: { data: 'paildramon', virus: 'aeroveedramon', vaccine: 'raidramon' },
      },
      salamon: {
        champion: { vaccine: 'gatomon', virus: 'gatomon-black', data: 'mikemon' },
        ultimate: { vaccine: 'angewomon', virus: 'ladydevimon', data: 'nefertimon' },
      },
    };
    currentStage = NATURAL[eggType][ITEM_FORM_LEVEL[currentStage]][branch];
  }

  // digiegg → baby-i (by line)
  if (currentStage === 'digiegg') {
    if (eggType === 'veemon') return 'chicomon';
    if (eggType === 'salamon') return 'yukimibotamon';
    return 'pichimon';
  }
  // baby-i → baby-ii (by line)
  if (['pichimon', 'chicomon', 'yukimibotamon'].includes(currentStage)) {
    if (eggType === 'veemon') return 'chibimon';
    if (eggType === 'salamon') return 'nyaromon';
    return 'pukamon';
  }
  // baby-ii → rookie (by line)
  if (['pukamon', 'chibimon', 'nyaromon'].includes(currentStage)) {
    if (eggType === 'veemon') return 'veemon';
    if (eggType === 'salamon') return 'plotmon';
    return 'tapirmon';
  }
  // ── Tapirmon line ────────────────────────────────────────────────────
  if (currentStage === 'tapirmon') {
    if (branch === 'virus') return 'tuskmon';
    if (branch === 'vaccine') return 'bakemon';
    return 'monochromon';
  }
  if (['tuskmon', 'monochromon', 'bakemon'].includes(currentStage)) {
    if (branch === 'virus') return 'gigadramon';
    if (branch === 'vaccine') return 'digitamamon';
    return 'triceramon';
  }
  if (['gigadramon', 'triceramon', 'digitamamon'].includes(currentStage)) {
    if (branch === 'virus') return 'gaioumon';
    if (branch === 'vaccine') return 'titamon';
    return 'ultimatebrachiomon';
  }
  if (['gaioumon', 'ultimatebrachiomon', 'titamon'].includes(currentStage)) {
    const allMegas = ['gaioumon', 'ultimatebrachiomon', 'titamon'];
    if (allMegas.every(m => unlockedEvolutions.includes(m))) return 'gaioumon-itto';
    return currentStage;
  }
  // ── Veemon line ──────────────────────────────────────────────────────
  if (currentStage === 'veemon') {
    if (branch === 'data') return 'exveemon';
    if (branch === 'virus') return 'veedramon';
    return 'flamedramon';
  }
  if (['exveemon', 'veedramon', 'flamedramon'].includes(currentStage)) {
    if (branch === 'data') return 'paildramon';
    if (branch === 'virus') return 'aeroveedramon';
    return 'raidramon';
  }
  if (['paildramon', 'aeroveedramon', 'raidramon'].includes(currentStage)) {
    if (branch === 'data') return 'imperialdramon';
    if (branch === 'virus') return 'ulforceveedramon';
    return 'magnamon';
  }
  if (['imperialdramon', 'ulforceveedramon', 'magnamon'].includes(currentStage)) {
    const allMegas = ['imperialdramon', 'ulforceveedramon', 'magnamon'];
    if (allMegas.every(m => unlockedEvolutions.includes(m))) return 'imperialdramon-paladin';
    return currentStage;
  }
  // ── Salamon line ─────────────────────────────────────────────────────
  if (currentStage === 'plotmon') {
    if (branch === 'vaccine') return 'gatomon';
    if (branch === 'virus') return 'gatomon-black';
    return 'mikemon';
  }
  if (['gatomon', 'gatomon-black', 'mikemon'].includes(currentStage)) {
    if (branch === 'vaccine') return 'angewomon';
    if (branch === 'virus') return 'ladydevimon';
    return 'nefertimon';
  }
  if (['angewomon', 'ladydevimon', 'nefertimon'].includes(currentStage)) {
    if (branch === 'vaccine') return 'ophanimon';
    if (branch === 'virus') return 'lilithmon';
    return 'holydramon';
  }
  if (['ophanimon', 'lilithmon', 'holydramon'].includes(currentStage)) {
    const allMegas = ['ophanimon', 'lilithmon', 'holydramon'];
    if (allMegas.every(m => unlockedEvolutions.includes(m))) return 'mastemon';
    return currentStage;
  }
  // Ultra — already at max
  return currentStage;
}

// Lookup table: each stage's deterministic predecessor (same-attribute tier above)
const PREV_FORM: Record<string, string> = {
  // Tapirmon line
  gaioumon: 'gigadramon', ultimatebrachiomon: 'triceramon', titamon: 'digitamamon',
  gigadramon: 'tuskmon',  triceramon: 'monochromon',        digitamamon: 'bakemon',
  tuskmon: 'tapirmon',    monochromon: 'tapirmon',           bakemon: 'tapirmon',
  tapirmon: 'pukamon', pukamon: 'pichimon', pichimon: 'digiegg',
  // Veemon line
  imperialdramon: 'paildramon', ulforceveedramon: 'aeroveedramon', magnamon: 'raidramon',
  paildramon: 'exveemon',       aeroveedramon: 'veedramon',        raidramon: 'flamedramon',
  exveemon: 'veemon',           veedramon: 'veemon',               flamedramon: 'veemon',
  veemon: 'chibimon', chibimon: 'chicomon', chicomon: 'digiegg',
  // Salamon line
  ophanimon: 'angewomon', lilithmon: 'ladydevimon', holydramon: 'nefertimon',
  angewomon: 'gatomon',   ladydevimon: 'gatomon-black', nefertimon: 'mikemon',
  gatomon: 'plotmon',     'gatomon-black': 'plotmon',  mikemon: 'plotmon',
  plotmon: 'nyaromon', nyaromon: 'yukimibotamon', yukimibotamon: 'digiegg',
};

// For ultra → mega the previous form depends on branch (any mega can reach ultra)
const ULTRA_PREV: Record<string, Record<Attr, string>> = {
  'gaioumon-itto':          { virus: 'gaioumon',       data: 'ultimatebrachiomon', vaccine: 'titamon'   },
  'imperialdramon-paladin': { data: 'imperialdramon',  virus: 'ulforceveedramon',  vaccine: 'magnamon'  },
  mastemon:                 { vaccine: 'ophanimon',     virus: 'lilithmon',         data: 'holydramon'   },
};

// Determina a forma anterior determinística baseada no estágio e branch
export function getPreviousForm(currentStage: string, branch: Attr = 'data'): string {
  if (ULTRA_PREV[currentStage]) return ULTRA_PREV[currentStage][branch] ?? currentStage;
  return PREV_FORM[currentStage] ?? 'digiegg';
}
