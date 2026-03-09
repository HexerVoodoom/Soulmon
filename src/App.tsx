import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ActivityCard } from './components/ActivityCard';
import { TaskCard } from './components/TaskCard';
import { CompanionHUD } from './components/CompanionHUD';
import { EvolutionPath } from './components/EvolutionPath';
import { EditModal } from './components/EditModal';
import { TaskEditModal } from './components/TaskEditModal';
import { CreateModal } from './components/CreateModal';
import { StatsModal } from './components/StatsModal';
import { StatsPage } from './components/StatsPage';
import { SettingsPage } from './components/SettingsPage';
import { OnboardingScreen } from './components/OnboardingScreen';
import { WidgetView } from './components/WidgetView';
import { ConfirmDialog } from './components/ConfirmDialog';
import { AttributeBadges } from './components/AttributeBadges';
import { ProgressInfo } from './components/ProgressInfo';
import { GuideModal } from './components/GuideModal';
import { SettingsModal } from './components/SettingsModal';
import { AISettingsModal, type AISettings } from './components/AISettingsModal';
import { FirstTaskCompletedPopup } from './components/FirstTaskCompletedPopup';
import { RookieUnlockPopup } from './components/RookieUnlockPopup';
import { NotificationManager } from './components/NotificationManager';
import { Plus, Edit2 } from 'lucide-react';
import { CATEGORY_ATTRIBUTES, ActivityCategory, XP_THRESHOLDS } from './types/attributes';
import { CareEvent, getCareMessage } from './components/CareSystem';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, canSelectWeekdays } from './types/progression';
import { Language, useTranslation } from './utils/i18n';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  steps: Step[];
  weekDays: number[]; // 0-6 (domingo a sábado)
  alarm?: {
    time: string; // HH:mm
  };
  completedToday?: boolean; // Para atividades sem etapas
  lastCompletedDate?: string; // Data da última conclusão
}

interface Task {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completed: boolean;
  deadline?: {
    date: string; // YYYY-MM-DD
    time: string; // HH:mm
  };
  alarm?: {
    type: '2h' | '1h' | '30min' | 'custom';
    time?: string; // HH:mm (only for custom)
  };
  steps?: Step[]; // Tasks agora também podem ter steps
}

interface CompletedTask {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completedAt: string;
}

interface ActivityStats {
  [activityId: string]: {
    name: string;
    emoji: string;
    category: ActivityCategory;
    completionCount: number;
  };
}

interface GameState {
  activities: Activity[];
  tasks: Task[];
  completedTasks: CompletedTask[];
  activityStats: ActivityStats;
  healthPoints: number;
  maxHealthPoints: number;
  perfectDays: number; // Dias perfeitos acumulados na forma atual
  totalXP: number; // Mantido para compatibilidade
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  lastResetDate: string;
  evolutionStage: 'digiegg' | 'koromon' | 'tsunomon' | 'pagumon' | 'tapirmon' | 'kudamon' | 'kamemon' | 'monochromon' | 'tyrannomon' | 'ogremon' | 'meramon' | 'leomon' | 'ikkakumon' | 'geremon' | 'bakemon' | 'devimon' | 'megadramon' | 'gigadramon' | 'triceramon' | 'digitamamon' | 'gaioumon' | 'ultimatebrachiomon' | 'titamon' | 'gaioumon-itto';
  digivolutionSegments: number;
  digivolutionSegmentsNeeded: number;
  poopEventScheduled: number | null;
  foodEventsScheduled: number[];
  poopEventCompleted: boolean;
  foodEventsCompleted: number[];
  unlockedEvolutions: string[]; // Track all unlocked evolution stages
  degeneratedByHP: boolean; // Track if current stage was reached by HP loss degeneration
  currentBranch: 'virus' | 'data' | 'vaccine'; // Track selected evolution branch
  lastDayWasPerfect: boolean; // Se o último dia foi perfeito (para evitar contar múltiplas vezes)
  maxActivityCap: number; // Cap máximo de atividades desbloqueado (nunca diminui)
  eggType?: 'agumon' | 'veemon' | 'salamon'; // Ovo escolhido no onboarding (permanente)
}

type ViewType = 'main' | 'evolution' | 'stats' | 'settings';

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: '1',
    name: 'Morning Routine',
    category: 'Health',
    emoji: '🏥',
    weekDays: [1, 2, 3, 4, 5], // Seg a Sex
    steps: [
      { id: '1-1', label: 'Step 1: Wake up early', completed: false },
      { id: '1-2', label: 'Step 2: Exercise 20min', completed: false },
      { id: '1-3', label: 'Step 3: Healthy breakfast', completed: false },
      { id: '1-4', label: 'Step 4: Meditation', completed: false },
    ],
  },
  {
    id: '2',
    name: 'Study Session',
    category: 'Study',
    emoji: '📚',
    weekDays: [1, 2, 3, 4, 5], // Seg a Sex
    steps: [
      { id: '2-1', label: 'Step 1: Review notes', completed: false },
      { id: '2-2', label: 'Step 2: Complete assignment', completed: false },
    ],
  },
  {
    id: '3',
    name: 'Creative Work',
    category: 'Creativity',
    emoji: '🎨',
    weekDays: [0, 6], // Fim de semana
    steps: [
      { id: '3-1', label: 'Step 1: Brainstorm ideas', completed: false },
      { id: '3-2', label: 'Step 2: Create draft', completed: false },
      { id: '3-3', label: 'Step 3: Review and refine', completed: false },
    ],
  },
];

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ isOpen: boolean; activityId: string; stepId: string }>({
    isOpen: false,
    activityId: '',
    stepId: '',
  });
  const [timeUntilReset, setTimeUntilReset] = useState('');
  const [messageTrigger, setMessageTrigger] = useState(0);
  const [careEvent, setCareEvent] = useState<CareEvent | null>(null);
  const [showEvolutionChoice, setShowEvolutionChoice] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [useAI, setUseAI] = useState(true); // AI chat toggle
  const [aiSettings, setAiSettings] = useState(() => {
    const saved = localStorage.getItem('digiapp-ai-settings');
    return saved ? JSON.parse(saved) : {
      tone: 'casual',
      emojiIntensity: 'medium',
      motivationStyle: 'balanced',
      customKeywords: '',
      temperature: 0.85
    };
  });
  const [theme, setTheme] = useState<'default' | 'win98'>(() => {
    const saved = localStorage.getItem('digiapp-theme');
    return (saved as 'default' | 'win98') || 'default';
  });
  const language: Language = 'en-US';
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('digiapp-onboarding-complete') === 'true';
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('digiapp-user-name') || '';
  });
  const [showFirstTaskPopup, setShowFirstTaskPopup] = useState(false);
  const [hasShownFirstTaskPopup, setHasShownFirstTaskPopup] = useState(() => {
    return localStorage.getItem('digiapp-first-task-popup-shown') === 'true';
  });
  const [showRookieUnlockPopup, setShowRookieUnlockPopup] = useState(false);
  const [hasShownRookiePopup, setHasShownRookiePopup] = useState(() => {
    return localStorage.getItem('digiapp-rookie-popup-shown') === 'true';
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem('digiapp-notifications-enabled') === 'true';
  });

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('digiapp-theme', theme);
  }, [theme]);

  // Save language to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('digiapp-language', language);
  }, [language]);

  // Save AI settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('digiapp-ai-settings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  // Save notifications state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('digiapp-notifications-enabled', notificationsEnabled ? 'true' : 'false');
  }, [notificationsEnabled]);

  // Get max HP based on evolution stage
  const getMaxHPForStage = (stage: GameState['evolutionStage']): number => {
    const stageLevel = getStageLevel(stage);
    return MAX_HP_BY_FORM[stageLevel];
  };

  // Load game state from localStorage
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('digiapp_state_v3');
    if (saved) {
      const loadedState = JSON.parse(saved);
      const savedEggType = localStorage.getItem('digiapp-egg-type') as 'agumon' | 'veemon' | 'salamon' | null;
      // Ensure maxHealthPoints is correct for the stage and add new fields if missing
      return {
        ...loadedState,
        tasks: loadedState.tasks ?? [],
        completedTasks: loadedState.completedTasks ?? [],
        activityStats: loadedState.activityStats ?? {},
        maxHealthPoints: getMaxHPForStage(loadedState.evolutionStage),
        perfectDays: loadedState.perfectDays ?? 0,
        lastDayWasPerfect: loadedState.lastDayWasPerfect ?? false,
        poopEventScheduled: loadedState.poopEventScheduled ?? null,
        foodEventsScheduled: loadedState.foodEventsScheduled ?? [],
        poopEventCompleted: loadedState.poopEventCompleted ?? false,
        foodEventsCompleted: loadedState.foodEventsCompleted ?? [],
        unlockedEvolutions: loadedState.unlockedEvolutions ?? ['digiegg'],
        degeneratedByHP: loadedState.degeneratedByHP ?? false,
        currentBranch: loadedState.currentBranch ?? 'data',
        maxActivityCap: loadedState.maxActivityCap ?? FORM_REQUIREMENTS[getStageLevel(loadedState.evolutionStage)].cap,
        eggType: loadedState.eggType ?? savedEggType ?? 'agumon', // Load from state or localStorage, default to agumon
      };
    }
    const savedEggType = localStorage.getItem('digiapp-egg-type') as 'agumon' | 'veemon' | 'salamon' | null;
    return {
      activities: [],
      tasks: [],
      completedTasks: [],
      activityStats: {},
      healthPoints: 1,
      maxHealthPoints: 1,
      perfectDays: 0,
      totalXP: 0,
      virusPoints: 0,
      dataPoints: 0,
      vaccinePoints: 0,
      lastResetDate: new Date().toDateString(),
      evolutionStage: 'digiegg' as const,
      digivolutionSegments: 0,
      digivolutionSegmentsNeeded: 1,
      poopEventScheduled: null,
      foodEventsScheduled: [],
      poopEventCompleted: false,
      foodEventsCompleted: [],
      unlockedEvolutions: ['digiegg'],
      degeneratedByHP: false,
      currentBranch: 'data',
      lastDayWasPerfect: false,
      maxActivityCap: 2, // Inicia com o cap do digiegg
      eggType: savedEggType ?? 'agumon', // Load from localStorage, default to agumon
    };
  });

  // Save game state to localStorage
  useEffect(() => {
    localStorage.setItem('digiapp_state_v3', JSON.stringify(gameState));
  }, [gameState]);

  // Care system - Schedule poop and food events
  useEffect(() => {
    // Check if there are incomplete tasks
    const allSteps = gameState.activities.flatMap(a => a.steps);
    const hasIncompleteTasks = allSteps.some(s => !s.completed);

    if (!hasIncompleteTasks) {
      return; // Don't schedule care events if all tasks are done
    }

    // Schedule events for today
    const scheduleEvents = () => {
      const now = Date.now();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const startOfDay = today.getTime();
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000;

      // Only schedule if on current day
      if (gameState.lastResetDate !== new Date().toDateString()) {
        return;
      }

      // Schedule poop event (once a day) if not completed
      if (!gameState.poopEventScheduled && !gameState.poopEventCompleted) {
        const poopHour = 8 + Math.random() * 12; // 8 AM to 8 PM
        const poopTime = startOfDay + (poopHour * 60 * 60 * 1000);
        setGameState(prev => ({ ...prev, poopEventScheduled: poopTime }));
      }

      // Schedule food events (twice a day) if not scheduled
      if (!gameState.foodEventsScheduled || gameState.foodEventsScheduled.length === 0) {
        const firstFoodHour = 8 + Math.random() * 6; // 8 AM to 2 PM
        const secondFoodHour = 14 + Math.random() * 6; // 2 PM to 8 PM
        const foodTimes = [
          startOfDay + (firstFoodHour * 60 * 60 * 1000),
          startOfDay + (secondFoodHour * 60 * 60 * 1000),
        ];
        setGameState(prev => ({ ...prev, foodEventsScheduled: foodTimes }));
      }
    };

    scheduleEvents();
  }, [gameState.lastResetDate, gameState.poopEventCompleted, gameState.foodEventsScheduled]);

  // Check for care events and trigger them
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const allSteps = gameState.activities.flatMap(a => a.steps);
      const hasIncompleteTasks = allSteps.some(s => !s.completed);

      if (!hasIncompleteTasks) {
        return; // Don't trigger care events if all tasks are done
      }

      // Check poop event
      if (gameState.poopEventScheduled && !gameState.poopEventCompleted && !careEvent) {
        const timeSinceScheduled = now - gameState.poopEventScheduled;
        
        // Show request message
        if (timeSinceScheduled >= 0 && timeSinceScheduled < 5 * 60 * 1000) {
          if (!careEvent || careEvent.type !== 'poop') {
            setCareEvent({
              type: 'poop',
              requestTime: gameState.poopEventScheduled,
              showSprite: false,
            });
            setMessageTrigger(prev => prev + 1);
          }
        }
        // After 5 minutes, show sprite
        else if (timeSinceScheduled >= 5 * 60 * 1000) {
          setCareEvent({
            type: 'poop',
            requestTime: gameState.poopEventScheduled,
            showSprite: true,
          });
        }
      }

      // Check food events
      if (gameState.foodEventsScheduled && gameState.foodEventsCompleted) {
        gameState.foodEventsScheduled.forEach((foodTime, index) => {
          if (gameState.foodEventsCompleted.includes(index) || careEvent) {
            return;
          }

        const timeSinceScheduled = now - foodTime;
        
        // Show request message
        if (timeSinceScheduled >= 0 && timeSinceScheduled < 5 * 60 * 1000) {
          if (!careEvent || careEvent.type !== 'food') {
            setCareEvent({
              type: 'food',
              requestTime: foodTime,
              showSprite: false,
            });
            setMessageTrigger(prev => prev + 1);
          }
        }
        // After 5 minutes, show sprite and reduce HP
        else if (timeSinceScheduled >= 5 * 60 * 1000 && timeSinceScheduled < 6 * 60 * 1000) {
          setCareEvent({
            type: 'food',
            requestTime: foodTime,
            showSprite: true,
          });
          // Reduce HP by 2 (one full heart)
          setGameState(prev => ({
            ...prev,
            healthPoints: Math.max(0, prev.healthPoints - 2),
            foodEventsCompleted: [...(prev.foodEventsCompleted || []), index],
          }));
        }
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [gameState.poopEventScheduled, gameState.foodEventsScheduled, gameState.poopEventCompleted, gameState.foodEventsCompleted, careEvent]);

  // Update message when care event is active
  const getCompanionMessageWithCare = (): string => {
    if (careEvent && !careEvent.showSprite) {
      return getCareMessage(careEvent.type);
    }
    return getCompanionMessage();
  };

  // Timer and daily reset logic
  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

      // Check if we need to reset
      const currentDate = now.toDateString();
      if (currentDate !== gameState.lastResetDate) {
        performDailyReset();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [gameState.lastResetDate]);

  const performDailyReset = () => {
    setGameState(prev => {
      // === NOVO SISTEMA: REQUIRED POR NÍVEL ===
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayString = yesterday.toDateString();
      const yesterdayWeekDay = yesterday.getDay();
      
      // Get required for current stage
      const currentLevel = getStageLevel(prev.evolutionStage);
      const requirements = FORM_REQUIREMENTS[currentLevel];
      const requiredToday = requirements.required;
      
      // Calcula quantas atividades/tasks foram completas de ONTEM
      let dailyDone = 0;
      
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
        if (isComplete) dailyDone++;
      });
      
      dailyDone += prev.tasks.filter(t => t.completed).length;
      
      // Dia perfeito = completou o required
      const dayWasPerfect = dailyDone >= requiredToday;
      
      let newHP = prev.healthPoints;
      let newPerfectDays = prev.perfectDays;
      let newXP = prev.totalXP;
      let newVirusPoints = prev.virusPoints;
      let newDataPoints = prev.dataPoints;
      let newVaccinePoints = prev.vaccinePoints;
      let newEvolutionStage = prev.evolutionStage;
      let finalUnlockedEvolutions = [...prev.unlockedEvolutions];
      let wasDegeneratedByHP = false;
      let newMaxActivityCap = prev.maxActivityCap;
      
      // Regra de HP: perde 1 HP se não completar nenhuma atividade
      if (dailyDone === 0) {
        newHP = Math.max(0, prev.healthPoints - 1);
      }
      
      // Dia perfeito: ganha 1 ponto de progresso
      if (dayWasPerfect) {
        newPerfectDays++;
        
        // Calcula atributos das atividades completadas
        let dailyVirus = 0;
        let dailyData = 0;
        let dailyVaccine = 0;
        
        availableActivities.forEach(activity => {
          const attrs = CATEGORY_ATTRIBUTES[activity.category];
          dailyVirus += attrs.virus;
          dailyData += attrs.data;
          dailyVaccine += attrs.vaccine;
        });
        
        newVirusPoints += dailyVirus;
        newDataPoints += dailyData;
        newVaccinePoints += dailyVaccine;
        
        const dailyXP = (dailyVirus + dailyData + dailyVaccine) * 10;
        newXP += dailyXP;
      }
      
      // Verifica evolução baseada em perfectDays
      if (newPerfectDays >= requirements.required) {
        // Pronto para evoluir!
        newPerfectDays = 0; // Reset para a próxima forma
        
        // Determina próxima evolução baseada no branch
        const dominantAttr = Math.max(newVirusPoints, newDataPoints, newVaccinePoints);
        let branch = prev.currentBranch;
        if (newVirusPoints === dominantAttr) branch = 'virus';
        else if (newDataPoints === dominantAttr) branch = 'data';
        else if (newVaccinePoints === dominantAttr) branch = 'vaccine';
        
        // Evolução simples baseada na forma atual
        if (prev.evolutionStage === 'digiegg') {
          newEvolutionStage = 'pichimon';
        } else if (prev.evolutionStage === 'pichimon') {
          newEvolutionStage = 'pukamon';
        } else if (prev.evolutionStage === 'pukamon') {
          newEvolutionStage = 'tapirmon';
          // Mostra popup do Rookie na primeira vez
          if (!hasShownRookiePopup) {
            setShowRookieUnlockPopup(true);
            setHasShownRookiePopup(true);
            localStorage.setItem('digiapp-rookie-popup-shown', 'true');
          }
        } else if (prev.evolutionStage === 'tapirmon') {
          if (branch === 'virus') newEvolutionStage = 'tuskmon';
          else if (branch === 'data') newEvolutionStage = 'monochromon';
          else newEvolutionStage = 'bakemon';
        } else if (['tuskmon', 'monochromon', 'bakemon'].includes(prev.evolutionStage)) {
          if (branch === 'virus') newEvolutionStage = 'gigadramon';
          else if (branch === 'data') newEvolutionStage = 'triceramon';
          else newEvolutionStage = 'digitamamon';
        } else if (['gigadramon', 'triceramon', 'digitamamon'].includes(prev.evolutionStage)) {
          if (branch === 'virus') newEvolutionStage = 'gaioumon';
          else if (branch === 'vaccine') newEvolutionStage = 'titamon';
          else newEvolutionStage = 'ultimatebrachiomon';
        } else if (['gaioumon', 'ultimatebrachiomon', 'titamon'].includes(prev.evolutionStage)) {
          // Só evolui para Ultra se tiver os 3 megas
          const hasAllMegas = ['gaioumon', 'ultimatebrachiomon', 'titamon'].every(m => 
            prev.unlockedEvolutions.includes(m)
          );
          if (hasAllMegas) {
            newEvolutionStage = 'gaioumon-itto';
          }
        }
        
        // Atualiza HP para o máximo da nova forma
        const newStageLevel = getStageLevel(newEvolutionStage);
        newHP = MAX_HP_BY_FORM[newStageLevel];
        
        // Atualiza maxActivityCap se o novo nível tem cap maior
        const newCap = FORM_REQUIREMENTS[newStageLevel].cap;
        if (newCap > newMaxActivityCap) {
          newMaxActivityCap = newCap;
        }
        
        // Adiciona aos desbloqueados
        if (!finalUnlockedEvolutions.includes(newEvolutionStage)) {
          finalUnlockedEvolutions.push(newEvolutionStage);
        }
      }
      
      // Degeneração por HP zerado
      if (newHP === 0) {
        wasDegeneratedByHP = true;
        
        // Devolve para forma anterior
        if (prev.evolutionStage === 'gaioumon-itto') {
          newEvolutionStage = ['gaioumon', 'ultimatebrachiomon', 'titamon'][Math.floor(Math.random() * 3)];
        } else if (['gaioumon', 'ultimatebrachiomon', 'titamon'].includes(prev.evolutionStage)) {
          newEvolutionStage = ['gigadramon', 'triceramon', 'digitamamon'][Math.floor(Math.random() * 3)];
        } else if (['gigadramon', 'triceramon', 'digitamamon'].includes(prev.evolutionStage)) {
          newEvolutionStage = ['tuskmon', 'monochromon', 'bakemon'][Math.floor(Math.random() * 3)];
        } else if (['tuskmon', 'monochromon', 'bakemon'].includes(prev.evolutionStage)) {
          newEvolutionStage = 'tapirmon';
        } else if (prev.evolutionStage === 'tapirmon') {
          newEvolutionStage = 'pukamon';
        } else if (prev.evolutionStage === 'pukamon') {
          newEvolutionStage = 'pichimon';
        } else if (prev.evolutionStage === 'pichimon') {
          newEvolutionStage = 'digiegg';
        }
        
        // Restaura HP da nova forma
        const degeneratedStageLevel = getStageLevel(newEvolutionStage);
        newHP = MAX_HP_BY_FORM[degeneratedStageLevel];
        
        // Dá metade dos dias necessários já preenchidos
        const degeneratedRequirements = FORM_REQUIREMENTS[degeneratedStageLevel];
        newPerfectDays = Math.floor(degeneratedRequirements.required / 2);
      }

      // Reset all activity checkboxes and completion status
      const resetActivities = prev.activities.map(activity => ({
        ...activity,
        steps: activity.steps.map(step => ({ ...step, completed: false })),
        completedToday: false,
      }));
      
      // Reset tasks
      const resetTasks = prev.tasks.map(task => ({
        ...task,
        completed: false,
      }));
      
      // Atualiza maxHP baseado na nova forma
      const newStageLevel = getStageLevel(newEvolutionStage);
      const newMaxHP = MAX_HP_BY_FORM[newStageLevel];

      return {
        ...prev,
        activities: resetActivities,
        tasks: resetTasks,
        healthPoints: newHP,
        maxHealthPoints: newMaxHP,
        perfectDays: newPerfectDays,
        totalXP: newXP,
        virusPoints: newVirusPoints,
        dataPoints: newDataPoints,
        vaccinePoints: newVaccinePoints,
        lastResetDate: new Date().toDateString(),
        evolutionStage: newEvolutionStage,
        digivolutionSegments: 0, // Não usado mais, mas mantido
        digivolutionSegmentsNeeded: 999, // Não usado mais
        poopEventScheduled: null,
        foodEventsScheduled: [],
        poopEventCompleted: false,
        foodEventsCompleted: [],
        unlockedEvolutions: finalUnlockedEvolutions,
        degeneratedByHP: wasDegeneratedByHP,
        lastDayWasPerfect: dayWasPerfect,
        maxActivityCap: newMaxActivityCap,
      };
    });
  };

  // Calcula total de tarefas disponíveis para hoje
  const calculateDailyTotal = () => {
    const today = new Date().toDateString();
    const todayWeekDay = new Date().getDay();
    
    // Antes de Rookie: todas as atividades/tasks são diárias (sempre disponíveis)
    if (!canSelectWeekdays(gameState.evolutionStage)) {
      // Inclui tasks históricas completadas hoje
      const tasksCompletedToday = gameState.completedTasks.filter(ct => {
        const completedDate = new Date(ct.completedAt).toDateString();
        return completedDate === today;
      });
      
      return gameState.activities.length + gameState.tasks.length + tasksCompletedToday.length;
    }
    
    // A partir de Rookie: filtra por dia da semana
    const availableActivities = gameState.activities.filter(a => a.weekDays?.includes(todayWeekDay));
    
    // Inclui tasks históricas completadas hoje
    const tasksCompletedToday = gameState.completedTasks.filter(ct => {
      const completedDate = new Date(ct.completedAt).toDateString();
      return completedDate === today;
    });
    
    return availableActivities.length + gameState.tasks.length + tasksCompletedToday.length;
  };

  // Calcula quantas tarefas foram concluídas hoje
  const calculateDailyDone = () => {
    const today = new Date().toDateString();
    const todayWeekDay = new Date().getDay();
    
    let completedCount = 0;
    
    // Filtra atividades disponíveis para hoje
    const availableActivities = !canSelectWeekdays(gameState.evolutionStage)
      ? gameState.activities
      : gameState.activities.filter(a => a.weekDays?.includes(todayWeekDay));
    
    availableActivities.forEach(activity => {
      let isComplete = false;
      
      if (activity.steps.length > 0) {
        isComplete = activity.steps.every(s => s.completed);
      } else {
        isComplete = activity.completedToday && activity.lastCompletedDate === today;
      }
      
      if (isComplete) {
        completedCount++;
      }
    });
    
    // Adiciona tasks completas ATIVAS
    completedCount += gameState.tasks.filter(t => t.completed).length;
    
    // NOVO: Adiciona tasks HISTÓRICAS completadas HOJE
    const tasksCompletedToday = gameState.completedTasks.filter(ct => {
      const completedDate = new Date(ct.completedAt).toDateString();
      return completedDate === today;
    });
    
    completedCount += tasksCompletedToday.length;
    
    return completedCount;
  };

  // Verifica se o dia está 100% completo
  const isDayPerfect = () => {
    const total = calculateDailyTotal();
    const done = calculateDailyDone();
    return total > 0 && done === total;
  };

  // Calculate overall progress for today
  const calculateProgress = () => {
    const today = new Date().toDateString();
    const todayWeekDay = new Date().getDay();
    
    // Filtra apenas atividades programadas para hoje
    const availableActivities = gameState.activities.filter(a => a.weekDays?.includes(todayWeekDay));
    
    let totalItems = 0;
    let completedItems = 0;
    
    availableActivities.forEach(activity => {
      if (activity.steps.length > 0) {
        // Atividade com etapas - conta cada step
        totalItems += activity.steps.length;
        completedItems += activity.steps.filter(s => s.completed).length;
      } else {
        // Atividade sem etapas - conta como 1 item
        totalItems += 1;
        if (activity.completedToday && activity.lastCompletedDate === today) {
          completedItems += 1;
        }
      }
    });
    
    // Adiciona tasks ATIVAS (ainda na lista)
    totalItems += gameState.tasks.length;
    completedItems += gameState.tasks.filter(t => t.completed).length;
    
    // NOVO: Adiciona tasks HISTÓRICAS completadas HOJE (já removidas da lista)
    const tasksCompletedToday = gameState.completedTasks.filter(ct => {
      const completedDate = new Date(ct.completedAt).toDateString();
      return completedDate === today;
    });
    
    totalItems += tasksCompletedToday.length;
    completedItems += tasksCompletedToday.length; // Todas já estão completas
    
    return totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
  };

  // Calculate today's potential attribute gains
  const calculateTodayAttributes = () => {
    const today = new Date().toDateString();
    let virus = 0;
    let data = 0;
    let vaccine = 0;

    gameState.activities.forEach(activity => {
      let isComplete = false;
      
      if (activity.steps.length > 0) {
        // Atividade com etapas
        isComplete = activity.steps.every(s => s.completed);
      } else {
        // Atividade sem etapas
        isComplete = activity.completedToday && activity.lastCompletedDate === today;
      }
      
      if (isComplete) {
        const attrs = CATEGORY_ATTRIBUTES[activity.category];
        virus += attrs.virus;
        data += attrs.data;
        vaccine += attrs.vaccine;
      }
    });

    return { virus, data, vaccine };
  };

  const progress = calculateProgress();
  const todayAttrs = calculateTodayAttributes();

  // Determine companion mood based on progress
  const getCompanionMood = (): 'idle' | 'happy' | 'tired' => {
    if (progress >= 60) return 'happy'; // Fica feliz mais fácil
    if (progress <= 15) return 'tired'; // Só fica cansado se MUITO baixo (antes era 30%)
    return 'idle';
  };

  // Get companion message based on progress and HP
  const getCompanionMessage = (): string => {
    if (gameState.healthPoints <= 1) {
      return "I need your help! Complete tasks to keep me healthy!";
    }
    if (progress >= 70) return "You're doing amazing! Keep it up! 🌟";
    if (progress >= 40) return "Good progress! Let's keep going!";
    if (progress >= 20) return "You've got this! One step at a time!";
    return "I believe in you! Let's start together!";
  };

  // Get current day
  const getCurrentDay = () => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  };

  const getCurrentStageName = (): string => {
    switch (gameState.evolutionStage) {
      case 'digiegg':
        return 'DigiEgg';
      case 'pichimon':
        return 'Pichimon';
      case 'pukamon':
        return 'Pukamon';
      case 'tapirmon':
        return 'Tapirmon';
      case 'tuskmon':
        return 'Tuskmon';
      case 'monochromon':
        return 'Monochromon';
      case 'bakemon':
        return 'Bakemon';
      case 'gigadramon':
        return 'Gigadramon';
      case 'triceramon':
        return 'Triceramon';
      case 'digitamamon':
        return 'Digitamamon';
      case 'gaioumon':
        return 'Gaioumon';
      case 'ultimatebrachiomon':
        return 'UltimateBrachiomon';
      case 'titamon':
        return 'Titamon';
      case 'gaioumon-itto':
        return 'Gaioumon: Itto Mode';
      default:
        return 'DigiEgg';
    }
  };

  const getDominantBranch = (): 'virus' | 'data' | 'vaccine' | 'balanced' => {
    const { virusPoints, dataPoints, vaccinePoints } = gameState;
    const total = virusPoints + dataPoints + vaccinePoints;
    
    if (total === 0) return 'balanced';
    
    const max = Math.max(virusPoints, dataPoints, vaccinePoints);
    if (virusPoints === max && virusPoints > dataPoints && virusPoints > vaccinePoints) return 'virus';
    if (dataPoints === max && dataPoints > virusPoints && dataPoints > vaccinePoints) return 'data';
    if (vaccinePoints === max && vaccinePoints > virusPoints && vaccinePoints > dataPoints) return 'vaccine';
    return 'balanced';
  };

  const getNextLevelXP = (): number => {
    switch (gameState.evolutionStage) {
      case 'digiegg':
        return XP_THRESHOLDS.pichimon;
      case 'pichimon':
        return XP_THRESHOLDS.pukamon;
      case 'pukamon':
        return XP_THRESHOLDS.tapirmon;
      case 'tapirmon':
        return XP_THRESHOLDS.champion;
      case 'tuskmon':
      case 'monochromon':
      case 'bakemon':
        return XP_THRESHOLDS.ultimate;
      case 'gigadramon':
      case 'triceramon':
      case 'digitamamon':
        return XP_THRESHOLDS.mega;
      case 'gaioumon':
      case 'ultimatebrachiomon':
      case 'titamon':
        return XP_THRESHOLDS.itto;
      case 'gaioumon-itto':
        return XP_THRESHOLDS.itto;
      default:
        return XP_THRESHOLDS.tapirmon;
    }
  };

  const handleUpdateStep = (activityId: string, stepId: string) => {
    const activity = gameState.activities.find(a => a.id === activityId);
    const step = activity?.steps.find(s => s.id === stepId);

    // If trying to uncheck, require confirmation
    if (step?.completed) {
      setConfirmDialog({ isOpen: true, activityId, stepId });
    } else {
      // Allow checking without confirmation
      setGameState(prev => {
        const updatedActivities = prev.activities.map(act =>
          act.id === activityId
            ? {
                ...act,
                steps: act.steps.map(s =>
                  s.id === stepId ? { ...s, completed: true } : s
                ),
              }
            : act
        );

        // Check if activity is now fully completed
        const updatedActivity = updatedActivities.find(a => a.id === activityId);
        const isFullyCompleted = updatedActivity?.steps.every(s => s.completed);

        // Update activity stats if fully completed
        let newActivityStats = prev.activityStats;
        if (isFullyCompleted && updatedActivity) {
          const activityKey = `activity-${updatedActivity.id}`;
          const currentStats = prev.activityStats[activityKey] || {
            name: updatedActivity.name,
            emoji: updatedActivity.emoji,
            category: updatedActivity.category,
            completionCount: 0,
          };

          newActivityStats = {
            ...prev.activityStats,
            [activityKey]: {
              ...currentStats,
              completionCount: currentStats.completionCount + 1,
            },
          };
        }

        return {
          ...prev,
          activities: updatedActivities,
          activityStats: newActivityStats,
        };
      });
      
      // Check if this is the first task/step ever completed and show popup
      if (!hasShownFirstTaskPopup) {
        // Check if ANY step has been completed before this one
        const anyStepCompleted = gameState.activities.some(a => 
          a.steps.some(s => s.completed && s.id !== stepId)
        ) || gameState.tasks.some(t => t.completed);
        
        if (!anyStepCompleted) {
          setShowFirstTaskPopup(true);
          setHasShownFirstTaskPopup(true);
          localStorage.setItem('digiapp-first-task-popup-shown', 'true');
        }
      }
      
      // If there's an active care event, complete it
      if (careEvent) {
        handleCareEventComplete();
      }
      
      // Trigger message bubble
      setMessageTrigger(prev => prev + 1);
    }
  };

  // Handler para atividades sem etapas
  const handleToggleActivityCompletion = (activityId: string) => {
    const today = new Date().toDateString();
    
    setGameState(prev => {
      const activity = prev.activities.find(a => a.id === activityId);
      if (!activity) return prev;

      const isCurrentlyCompleted = activity.completedToday && activity.lastCompletedDate === today;
      const newCompletedState = !isCurrentlyCompleted;

      const updatedActivities = prev.activities.map(act =>
        act.id === activityId
          ? {
              ...act,
              completedToday: newCompletedState,
              lastCompletedDate: newCompletedState ? today : act.lastCompletedDate,
            }
          : act
      );

      // Update activity stats if completing
      let newActivityStats = prev.activityStats;
      if (newCompletedState && activity) {
        const activityKey = `activity-${activity.id}`;
        const currentStats = prev.activityStats[activityKey] || {
          name: activity.name,
          emoji: activity.emoji,
          category: activity.category,
          completionCount: 0,
        };

        newActivityStats = {
          ...prev.activityStats,
          [activityKey]: {
            ...currentStats,
            completionCount: currentStats.completionCount + 1,
          },
        };
      }

      return {
        ...prev,
        activities: updatedActivities,
        activityStats: newActivityStats,
      };
    });

    // Check if this is the first task ever completed and show popup
    if (!hasShownFirstTaskPopup) {
      const anyTaskCompleted = gameState.activities.some(a => 
        a.steps.some(s => s.completed)
      ) || gameState.tasks.some(t => t.completed);
      
      if (!anyTaskCompleted) {
        setShowFirstTaskPopup(true);
        setHasShownFirstTaskPopup(true);
        localStorage.setItem('digiapp-first-task-popup-shown', 'true');
      }
    }
    
    // If there's an active care event, complete it
    if (careEvent) {
      handleCareEventComplete();
    }
    
    // Trigger message bubble
    setMessageTrigger(prev => prev + 1);
  };

  const handleConfirmUncheck = () => {
    const { activityId, stepId } = confirmDialog;
    setGameState(prev => ({
      ...prev,
      activities: prev.activities.map(activity =>
        activity.id === activityId
          ? {
              ...activity,
              steps: activity.steps.map(step =>
                step.id === stepId ? { ...step, completed: false } : step
              ),
            }
          : activity
      ),
    }));
    setConfirmDialog({ isOpen: false, activityId: '', stepId: '' });
  };

  const handleEditActivity = (activityId: string) => {
    setEditingActivity(activityId);
    setEditModalOpen(true);
  };

  const handleSaveActivity = (data: { name: string; category: string; emoji: string; steps: Step[] }) => {
    if (editingActivity) {
      setGameState(prev => ({
        ...prev,
        activities: prev.activities.map(activity =>
          activity.id === editingActivity 
            ? { ...activity, name: data.name, category: data.category as ActivityCategory, emoji: data.emoji, steps: data.steps } 
            : activity
        ),
      }));
    } else {
      const newActivity: Activity = {
        id: Date.now().toString(),
        name: data.name,
        category: data.category as ActivityCategory,
        emoji: data.emoji,
        steps: data.steps,
        weekDays: [0, 1, 2, 3, 4, 5, 6], // Available all days by default
      };
      setGameState(prev => ({
        ...prev,
        activities: [...prev.activities, newActivity],
      }));
      // Trigger message bubble for new activity
      setMessageTrigger(prev => prev + 1);
    }
    setEditingActivity(null);
  };

  const handleDeleteActivity = (activityId: string) => {
    setGameState(prev => ({
      ...prev,
      activities: prev.activities.filter(activity => activity.id !== activityId),
    }));
    setEditModalOpen(false);
    setEditingActivity(null);
  };

  // Handle AI-created activity
  const handleAICreateActivity = (activity: {
    name: string;
    category: string;
    points: { virus: number; data: number; vaccine: number };
  }) => {
    console.log('AI creating activity:', activity);
    
    // Map AI category to ActivityCategory
    const categoryMap: { [key: string]: ActivityCategory } = {
      'Physical': 'Health',
      'Mental': 'Study',
      'Social': 'Social',
      'Creative': 'Creativity'
    };
    
    const category = categoryMap[activity.category] || 'Study';
    
    // Get emoji based on category
    const emojiMap: { [key: string]: string } = {
      'Health': '💪',
      'Study': '📚',
      'Social': '👥',
      'Creativity': '🎨'
    };
    
    const emoji = emojiMap[category] || '✨';
    
    // Create auto-generated steps based on category and points
    const steps: Step[] = [
      {
        id: `${Date.now()}-1`,
        label: `Complete ${activity.name}`,
        completed: false
      }
    ];
    
    // Create the activity with custom points
    const newActivity: Activity = {
      id: Date.now().toString(),
      name: activity.name,
      category,
      emoji,
      steps,
      weekDays: [0, 1, 2, 3, 4, 5, 6], // Available all days by default
    };
    
    setGameState(prev => ({
      ...prev,
      activities: [...prev.activities, newActivity],
    }));
    
    // Trigger message bubble
    setMessageTrigger(prev => prev + 1);
    
    console.log('Activity created successfully:', newActivity);
  };

  // Handle creating new task
  const handleAddNewTask = () => {
    setEditingTask(null);
    setTaskEditModalOpen(true);
  };

  // Handle saving task
  const handleSaveTask = (data: { name: string; category: string; emoji: string }) => {
    if (editingTask) {
      // Editing existing task
      setGameState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === editingTask 
            ? { ...task, name: data.name, category: data.category as ActivityCategory, emoji: data.emoji } 
            : task
        ),
      }));
    } else {
      // Creating new task
      const newTask: Task = {
        id: Date.now().toString(),
        name: data.name,
        category: data.category as ActivityCategory,
        emoji: data.emoji,
        completed: false,
      };
      setGameState(prev => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
      }));
    }

    setMessageTrigger(prev => prev + 1);
    setEditingTask(null);
  };

  // Handle toggling task completion
  const handleToggleTask = (taskId: string) => {
    const task = gameState.tasks.find(t => t.id === taskId);
    if (!task) return;

    if (!task.completed) {
      // Mark task as completed first
      setGameState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
      }));

      // Check if this is the first task ever completed and show popup
      if (!hasShownFirstTaskPopup) {
        const anyStepCompleted = gameState.activities.some(a => 
          a.steps.some(s => s.completed)
        ) || gameState.tasks.some(t => t.completed && t.id !== taskId);
        
        if (!anyStepCompleted) {
          setShowFirstTaskPopup(true);
          setHasShownFirstTaskPopup(true);
          localStorage.setItem('digiapp-first-task-popup-shown', 'true');
        }
      }

      // After 3 seconds, add points, save to history, and remove from list
      setTimeout(() => {
        const attrs = CATEGORY_ATTRIBUTES[task.category];
        
        setGameState(prev => {
          // Increment activity stats if activity exists
          const activityKey = `task-${task.name}-${task.category}`;
          const currentStats = prev.activityStats[activityKey] || {
            name: task.name,
            emoji: task.emoji,
            category: task.category,
            completionCount: 0,
          };

          return {
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== taskId),
            completedTasks: [
              ...prev.completedTasks,
              {
                id: taskId,
                name: task.name,
                category: task.category,
                emoji: task.emoji,
                completedAt: new Date().toISOString(),
              },
            ],
            activityStats: {
              ...prev.activityStats,
              [activityKey]: {
                ...currentStats,
                completionCount: currentStats.completionCount + 1,
              },
            },
            virusPoints: prev.virusPoints + attrs.virus,
            dataPoints: prev.dataPoints + attrs.data,
            vaccinePoints: prev.vaccinePoints + attrs.vaccine,
            totalXP: prev.totalXP + (attrs.virus + attrs.data + attrs.vaccine) * 10,
          };
        });

        setMessageTrigger(prev => prev + 1);
      }, 3000);
    }
  };

  // Handle deleting task
  const handleDeleteTask = (taskId: string) => {
    setGameState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  };

  // Handle editing task
  const handleEditTask = (taskId: string) => {
    setEditingTask(taskId);
    setTaskEditModalOpen(true);
  };

  const handleAddNewActivity = () => {
    setEditingActivity(null);
    setEditModalOpen(true);
  };

  const handleDigivolve = () => {
    setGameState(prev => {
      let newEvolutionStage = prev.evolutionStage;
      let newHP = prev.healthPoints;
      let newSegmentsNeeded = prev.digivolutionSegmentsNeeded;
      
      // Determine evolution based on current stage and dominant attribute
      const dominantAttr = Math.max(prev.virusPoints, prev.dataPoints, prev.vaccinePoints);
      const isVirus = prev.virusPoints === dominantAttr && prev.virusPoints > 0;
      const isData = prev.dataPoints === dominantAttr && prev.dataPoints > 0;
      const isVaccine = prev.vaccinePoints === dominantAttr && prev.vaccinePoints > 0;
      
      // Evolve to next stage
      if (prev.evolutionStage === 'digiegg') {
        newEvolutionStage = 'pichimon';
        newSegmentsNeeded = 2;
      } else if (prev.evolutionStage === 'pichimon') {
        newEvolutionStage = 'pukamon';
        newSegmentsNeeded = 4;
      } else if (prev.evolutionStage === 'pukamon') {
        newEvolutionStage = 'tapirmon';
        newSegmentsNeeded = 7;
      } else if (prev.evolutionStage === 'tapirmon') {
        if (isVirus) newEvolutionStage = 'tuskmon';
        else if (isVaccine) newEvolutionStage = 'bakemon';
        else newEvolutionStage = 'monochromon';
        newSegmentsNeeded = 9;
      } else if (['tuskmon', 'monochromon', 'bakemon'].includes(prev.evolutionStage)) {
        if (isVirus) newEvolutionStage = 'gigadramon';
        else if (isVaccine) newEvolutionStage = 'digitamamon';
        else newEvolutionStage = 'triceramon';
        newSegmentsNeeded = 11;
      } else if (['gigadramon', 'triceramon', 'digitamamon'].includes(prev.evolutionStage)) {
        if (isVirus) newEvolutionStage = 'gaioumon';
        else if (isVaccine) newEvolutionStage = 'titamon';
        else newEvolutionStage = 'ultimatebrachiomon';
        newSegmentsNeeded = 14;
      } else if (['gaioumon', 'ultimatebrachiomon', 'titamon'].includes(prev.evolutionStage)) {
        newEvolutionStage = 'gaioumon-itto';
        newSegmentsNeeded = 999;
      }
      
      newHP = getMaxHPForStage(newEvolutionStage);
      
      return {
        ...prev,
        evolutionStage: newEvolutionStage,
        healthPoints: newHP,
        maxHealthPoints: getMaxHPForStage(newEvolutionStage),
        digivolutionSegments: 0,
        digivolutionSegmentsNeeded: newSegmentsNeeded,
      };
    });
    setMessageTrigger(prev => prev + 1);
  };

  const handleCareEventComplete = () => {
    if (!careEvent) return;

    setGameState(prev => {
      if (careEvent.type === 'poop') {
        return { ...prev, poopEventCompleted: true };
      } else {
        const eventIndex = (prev.foodEventsScheduled || []).findIndex(t => t === careEvent.requestTime);
        return { 
          ...prev, 
          foodEventsCompleted: [...(prev.foodEventsCompleted || []), eventIndex] 
        };
      }
    });

    setCareEvent(null);
    setMessageTrigger(prev => prev + 1);
  };

  const handleDegenerate = (targetStage: string) => {
    setGameState(prev => {
      const stageMap: Record<string, GameState['evolutionStage']> = {
        'DigiEgg': 'digiegg',
        'Pichimon': 'pichimon',
        'Pukamon': 'pukamon',
        'Tapirmon': 'tapirmon',
        'Tuskmon': 'tuskmon',
        'Monochromon': 'monochromon',
        'Bakemon': 'bakemon',
        'Gigadramon': 'gigadramon',
        'Triceramon': 'triceramon',
        'Digitamamon': 'digitamamon',
        'Gaioumon': 'gaioumon',
        'UltimateBrachiomon': 'ultimatebrachiomon',
        'Titamon': 'titamon',
        'Gaioumon: Itto Mode': 'gaioumon-itto',
      };

      const newStage = stageMap[targetStage];
      if (!newStage) return prev;

      const newHP = getMaxHPForStage(newStage);
      
      return {
        ...prev,
        evolutionStage: newStage,
        healthPoints: newHP,
        maxHealthPoints: newHP,
        digivolutionSegments: 0,
        degeneratedByHP: false, // Manual degeneration, not by HP loss
      };
    });
    setMessageTrigger(prev => prev + 1);
  };

  // Handle manual evolution to unlocked forms
  const handleEvolveToUnlocked = (targetStage: string) => {
    setGameState(prev => {
      const stageMap: Record<string, GameState['evolutionStage']> = {
        'DigiEgg': 'digiegg',
        'Pichimon': 'pichimon',
        'Pukamon': 'pukamon',
        'Tapirmon': 'tapirmon',
        'Tuskmon': 'tuskmon',
        'Monochromon': 'monochromon',
        'Bakemon': 'bakemon',
        'Gigadramon': 'gigadramon',
        'Triceramon': 'triceramon',
        'Digitamamon': 'digitamamon',
        'Gaioumon': 'gaioumon',
        'UltimateBrachiomon': 'ultimatebrachiomon',
        'Titamon': 'titamon',
        'Gaioumon: Itto Mode': 'gaioumon-itto',
      };

      const newStage = stageMap[targetStage];
      if (!newStage || !prev.unlockedEvolutions.includes(newStage)) return prev;

      // Can only evolve to unlocked forms if at Rookie level or higher
      const isRookieOrHigher = !['digiegg', 'pichimon', 'pukamon'].includes(prev.evolutionStage);
      if (!isRookieOrHigher) return prev;

      const newHP = getMaxHPForStage(newStage);
      
      return {
        ...prev,
        evolutionStage: newStage,
        healthPoints: newHP,
        maxHealthPoints: newHP,
        digivolutionSegments: 0,
        degeneratedByHP: false,
      };
    });
    setMessageTrigger(prev => prev + 1);
    setShowEvolutionChoice(false);
  };

  const getOuterContainerClass = () => {
    switch (theme) {
      case 'win98':
        return 'win98-outer-container';
      default:
        return 'modern-outer-container';
    }
  };

  const getContainerClass = () => {
    switch (theme) {
      case 'win98':
        return 'win98-container rounded-none';
      default:
        return 'modern-container rounded-2xl';
    }
  };

  const handleCompleteOnboarding = (data: {
    userName: string;
    eggType: 'agumon' | 'veemon' | 'salamon';
    firstItem: {
      type: 'task' | 'activity';
      name: string;
      category: ActivityCategory;
      emoji: string;
      steps?: Step[];
    };
  }) => {
    // Save user name, egg type, and onboarding completion
    localStorage.setItem('digiapp-user-name', data.userName);
    localStorage.setItem('digiapp-egg-type', data.eggType);
    localStorage.setItem('digiapp-onboarding-complete', 'true');
    setUserName(data.userName);
    setHasCompletedOnboarding(true);

    // Create the first item
    if (data.firstItem.type === 'task') {
      const newTask: Task = {
        id: Date.now().toString(),
        name: data.firstItem.name,
        category: data.firstItem.category,
        emoji: data.firstItem.emoji,
        completed: false,
      };
      setGameState(prev => ({
        ...prev,
        tasks: [newTask],
        activities: [], // Start with no default activities
        eggType: data.eggType, // Store egg type
      }));
    } else {
      const newActivity: Activity = {
        id: Date.now().toString(),
        name: data.firstItem.name,
        category: data.firstItem.category,
        emoji: data.firstItem.emoji,
        steps: data.firstItem.steps || [],
        weekDays: [0, 1, 2, 3, 4, 5, 6], // Available all days by default
      };
      setGameState(prev => ({
        ...prev,
        activities: [newActivity],
        tasks: [], // Start with no default tasks
        eggType: data.eggType, // Store egg type
      }));
    }
  };



  // Handle reset onboarding (DEBUG ONLY)
  const handleResetOnboarding = () => {
    if (confirm('Reset onboarding? This will clear your name and egg choice.')) {
      localStorage.removeItem('digiapp-onboarding-complete');
      localStorage.removeItem('digiapp-user-name');
      localStorage.removeItem('digiapp-egg-type');
      window.location.reload();
    }
  };

  // Handle toggle notifications
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Request permission when enabling
      const { requestNotificationPermission } = await import('./utils/notifications');
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationsEnabled(true);
      } else {
        // User denied permission - provide detailed instructions
        const message = language === 'pt-BR' 
          ? '🔔 Permissão de Notificações Negada\n\n' +
            'Para habilitar notificações:\n\n' +
            '1. Clique no ícone de cadeado 🔒 (ou ⓘ) na barra de endereço\n' +
            '2. Procure por "Notificações" nas configurações do site\n' +
            '3. Altere para "Permitir"\n' +
            '4. Recarregue a página\n' +
            '5. Volte em Configurações > Notificações e ative novamente\n\n' +
            '💡 Você também pode acessar:\n' +
            'Configurações do navegador > Privacidade e Segurança > Configurações do site > Notificações'
          : '🔔 Notification Permission Denied\n\n' +
            'To enable notifications:\n\n' +
            '1. Click the lock icon 🔒 (or ⓘ) in the address bar\n' +
            '2. Look for "Notifications" in site settings\n' +
            '3. Change to "Allow"\n' +
            '4. Reload the page\n' +
            '5. Go back to Settings > Notifications and enable again\n\n' +
            '💡 You can also access:\n' +
            'Browser settings > Privacy and Security > Site Settings > Notifications';
        
        alert(message);
      }
    } else {
      // Disable notifications
      setNotificationsEnabled(false);
    }
  };

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div className={`min-h-screen ${
      theme === 'default' ? 'bg-gradient-to-br from-teal-50/60 via-cyan-50/50 to-emerald-50/60' : getOuterContainerClass()
    }`}>
      <div className={`w-full h-screen overflow-hidden flex flex-col relative ${
        theme === 'default' ? 'bg-gray-50' : getContainerClass()
      }`}>
        {/* Fixed Header */}
        <div className="flex-shrink-0">
          <Header
            title={
              currentView === 'main' ? 'Home' : 
              currentView === 'evolution' ? 'Digivolution Path' :
              currentView === 'stats' ? 'Statistics' :
              'Settings'
            }
            subtitle={currentView === 'main' ? getCurrentDay() : undefined}
            currentView={currentView}
            onNavigate={setCurrentView}
            theme={theme}
            onResetOnboarding={handleResetOnboarding}
          />
        </div>

        {/* Scrollable Content - com padding bottom para não ficar atrás do companion */}
        <div className={`flex-1 overflow-y-auto ${theme === 'win98' ? 'bg-[#c0c0c0] px-6 pt-3' : 'px-6 pt-3'} pb-[380px]`}>
          {currentView === 'main' && (
            <div className="space-y-3">
              <AttributeBadges 
                virusPoints={gameState.virusPoints}
                dataPoints={gameState.dataPoints}
                vaccinePoints={gameState.vaccinePoints}
                onNewActivity={() => setCreateModalOpen(true)}
                theme={theme}
                language={language}
              />

              {gameState.tasks.length === 0 && gameState.activities.length === 0 ? (
                <div className="flex items-center justify-center" style={{ minHeight: '300px' }}>
                  <p 
                    className="text-gray-400"
                    style={{ fontFamily: 'monospace', fontSize: '1.25rem' }}
                  >
                    No activity registered.
                  </p>
                </div>
              ) : (
                <>
                  {/* Sort tasks: incomplete first, completed last */}
                  {[...gameState.tasks]
                    .sort((a, b) => {
                      if (a.completed === b.completed) return 0;
                      return a.completed ? 1 : -1;
                    })
                    .map(task => (
                      <TaskCard
                        key={task.id}
                        id={task.id}
                        name={task.name}
                        category={task.category}
                        emoji={task.emoji}
                        completed={task.completed}
                        onToggleComplete={handleToggleTask}
                        onEdit={handleEditTask}
                        theme={theme}
                      />
                    ))}

                  {(() => {
                    const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
                    const todayString = new Date().toDateString();
                    const availableActivities = gameState.activities.filter(a => a.weekDays?.includes(today));
                    const unavailableActivities = gameState.activities.filter(a => !a.weekDays?.includes(today));
                    
                    // Combine and sort: incomplete first, completed last
                    const allActivities = [...availableActivities, ...unavailableActivities].map(activity => {
                      const isComplete = activity.steps.length > 0 
                        ? activity.steps.every(s => s.completed)
                        : (activity.completedToday && activity.lastCompletedDate === todayString);
                      return { ...activity, isComplete };
                    }).sort((a, b) => {
                      if (a.isComplete === b.isComplete) return 0;
                      return a.isComplete ? 1 : -1;
                    });

                    return allActivities.map(activity => {
                      const isAvailable = activity.weekDays?.includes(today);
                      
                      return (
                        <ActivityCard
                          key={activity.id}
                          id={activity.id}
                          name={`${activity.emoji} ${activity.name}`}
                          steps={activity.steps}
                          weekDays={activity.weekDays}
                          onUpdateStep={handleUpdateStep}
                          onToggleCompletion={handleToggleActivityCompletion}
                          onEditActivity={handleEditActivity}
                          isExpanded={true}
                          isCompleted={activity.isComplete}
                          isDisabled={!isAvailable}
                          isSingleExecution={!activity.weekDays || activity.weekDays.length === 0}
                          theme={theme}
                        />
                      );
                    });
                  })()}
                </>
              )}
            </div>
          )}

          {currentView === 'evolution' && (
            <EvolutionPath
              currentStage={getCurrentStageName()}
              currentBranch={getDominantBranch() === 'balanced' ? 'data' : getDominantBranch() as 'virus' | 'data' | 'vaccine'}
              currentXP={gameState.totalXP}
              virusPoints={gameState.virusPoints}
              dataPoints={gameState.dataPoints}
              vaccinePoints={gameState.vaccinePoints}
              digivolutionSegments={gameState.perfectDays}
              digivolutionSegmentsNeeded={FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].daysToEvolve}
              onDegenerate={handleDegenerate}
              theme={theme}
              dailyDone={calculateDailyDone()}
              dailyTotal={calculateDailyTotal()}
              dailyRequired={FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required}
              activitiesCount={gameState.activities.length}
              evolutionStage={gameState.evolutionStage}
              perfectDays={gameState.perfectDays}
              eggType={gameState.eggType}
            />
          )}

          {currentView === 'stats' && (
            <StatsPage
              completedTasks={gameState.completedTasks}
              activityStats={gameState.activityStats}
              theme={theme}
            />
          )}

          {currentView === 'settings' && (
            <SettingsPage
              useAI={useAI}
              onToggleAI={() => setUseAI(!useAI)}
              aiSettings={aiSettings}
              onSaveAISettings={(settings) => {
                setAiSettings(settings);
                localStorage.setItem('digiapp-ai-settings', JSON.stringify(settings));
              }}
              theme={theme}
              onChangeTheme={setTheme}
              onOpenGuide={() => setGuideModalOpen(true)}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
            />
          )}
        </div>

        {/* Fixed Companion HUD - Sempre visível na base da tela */}
        <div className={`fixed bottom-3 left-0 right-0 z-10 ${theme === 'win98' ? 'bg-[#c0c0c0] border-t-2 border-white px-6 pb-3 pt-3' : 'bg-gray-50 px-6 pb-3 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]'}`}>
          <CompanionHUD
            companionMood={getCompanionMood()}
            energyLevel={progress}
            message={getCompanionMessageWithCare()}
            currentStage={getCurrentStageName()}
            evolutionStage={gameState.evolutionStage}
            healthPoints={gameState.healthPoints}
            maxHealthPoints={gameState.maxHealthPoints}
            timeUntilReset={timeUntilReset}
            dominantBranch={getDominantBranch()}
            currentXP={gameState.totalXP}
            nextLevelXP={getNextLevelXP()}
            triggerMessage={messageTrigger}
            totalSteps={(() => {
              // Usa o required do nível atual
              const currentLevel = getStageLevel(gameState.evolutionStage);
              return FORM_REQUIREMENTS[currentLevel].required;
            })()}
            completedSteps={(() => {
              // Conta quantas atividades/tasks foram completadas
              const today = new Date().toDateString();
              const todayWeekDay = new Date().getDay();
              const availableActivities = !canSelectWeekdays(gameState.evolutionStage)
                ? gameState.activities
                : gameState.activities.filter(a => a.weekDays?.includes(todayWeekDay));
              const completedActivities = availableActivities.filter(a => {
                if (a.steps.length > 0) {
                  return a.steps.every(s => s.completed);
                } else {
                  return a.completedToday && a.lastCompletedDate === today;
                }
              }).length;
              return completedActivities + gameState.tasks.filter(t => t.completed).length;
            })()}
            digivolutionSegments={gameState.digivolutionSegments}
            theme={theme}
            digivolutionSegmentsNeeded={gameState.digivolutionSegmentsNeeded}
            perfectDays={gameState.perfectDays}
            requiredDays={FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required}
            onDigivolve={handleDigivolve}
            careEvent={careEvent}
            onCareEventComplete={handleCareEventComplete}
            useAI={useAI}
            aiSettings={aiSettings}
            onOpenAISettings={() => setAiSettingsOpen(true)}
            onCreateActivity={handleAICreateActivity}
            language={language}
          />
        </div>
      </div>

      <EditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setEditingActivity(null);
        }}
        onSave={handleSaveActivity}
        onDelete={editingActivity ? () => handleDeleteActivity(editingActivity) : undefined}
        initialData={
          editingActivity
            ? gameState.activities.find(a => a.id === editingActivity)
            : undefined
        }
        canEditWeekdays={canSelectWeekdays(gameState.evolutionStage)}
        theme={theme}
      />

      <TaskEditModal
        isOpen={taskEditModalOpen}
        onClose={() => {
          setTaskEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={editingTask ? () => {
          handleDeleteTask(editingTask);
          setTaskEditModalOpen(false);
          setEditingTask(null);
        } : undefined}
        initialData={
          editingTask
            ? gameState.tasks.find(t => t.id === editingTask)
            : undefined
        }
        title={editingTask ? 'Edit Task' : 'New Task'}
        theme={theme}
      />

      <CreateModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        evolutionStage={gameState.evolutionStage}
        activitiesCount={gameState.activities.length}
        activitiesCap={gameState.maxActivityCap}
        onSaveTask={(data) => {
          const newTask: Task = {
            id: `task-${Date.now()}`,
            name: data.name,
            category: data.category as ActivityCategory,
            emoji: data.emoji,
            completed: false,
            deadline: data.deadline,
            alarm: data.alarm,
            steps: data.steps,
          };
          setGameState(prev => ({
            ...prev,
            tasks: [...prev.tasks, newTask],
          }));
        }}
        onSaveActivity={(data) => {
          const newActivity: Activity = {
            id: `activity-${Date.now()}`,
            name: data.name,
            category: data.category as ActivityCategory,
            emoji: data.emoji,
            steps: data.steps,
            weekDays: data.weekDays,
            alarm: data.alarm,
          };
          setGameState(prev => ({
            ...prev,
            activities: [...prev.activities, newActivity],
          }));
        }}
        theme={theme}
        language={language}
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, activityId: '', stepId: '' })}
        onConfirm={handleConfirmUncheck}
        title="Uncheck Task?"
        message="Are you sure you want to uncheck this task? This action requires confirmation."
      />

      {/* Settings Menu */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        useAI={useAI}
        onToggleAI={() => setUseAI(!useAI)}
        aiSettings={aiSettings}
        onSaveAISettings={(settings) => {
          setAiSettings(settings);
          localStorage.setItem('digiapp-ai-settings', JSON.stringify(settings));
        }}
        theme={theme}
      />

      {/* Stats Modal */}
      <StatsModal
        isOpen={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        completedTasks={gameState.completedTasks}
        activityStats={gameState.activityStats}
        theme={theme}
      />

      {/* First Task Completed Popup */}
      <FirstTaskCompletedPopup
        isOpen={showFirstTaskPopup}
        onClose={() => setShowFirstTaskPopup(false)}
        theme={theme}
      />

      {/* Rookie Feature Unlock Popup */}
      <RookieUnlockPopup
        isOpen={showRookieUnlockPopup}
        onClose={() => setShowRookieUnlockPopup(false)}
        theme={theme}
      />
      
      {/* Guide Modal */}
      <GuideModal
        isOpen={guideModalOpen}
        onClose={() => setGuideModalOpen(false)}
        theme={theme}
      />

      {/* Notification Manager */}
      <NotificationManager
        activities={gameState.activities}
        tasks={gameState.tasks}
        userName={userName}
        language={language}
        enabled={notificationsEnabled}
      />
    </div>
  );
}