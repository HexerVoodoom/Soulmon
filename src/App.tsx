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
import { SettingsModal } from './components/SettingsModal';
import { AISettingsModal, type AISettings } from './components/AISettingsModal';
import { Plus, Edit2 } from 'lucide-react';
import { CATEGORY_ATTRIBUTES, ActivityCategory, XP_THRESHOLDS } from './types/attributes';
import { CareEvent, getCareMessage } from './components/CareSystem';

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
}

interface Task {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completed: boolean;
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
  totalXP: number;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  lastResetDate: string;
  evolutionStage: 'digiegg' | 'pichimon' | 'pukamon' | 'tapirmon' | 'tuskmon' | 'monochromon' | 'bakemon' | 'gigadramon' | 'triceramon' | 'digitamamon' | 'gaioumon' | 'ultimatebrachiomon' | 'titamon' | 'gaioumon-itto';
  digivolutionSegments: number;
  digivolutionSegmentsNeeded: number;
  poopEventScheduled: number | null;
  foodEventsScheduled: number[];
  poopEventCompleted: boolean;
  foodEventsCompleted: number[];
  unlockedEvolutions: string[]; // Track all unlocked evolution stages
  degeneratedByHP: boolean; // Track if current stage was reached by HP loss degeneration
  currentBranch: 'virus' | 'data' | 'vaccine'; // Track selected evolution branch
}

type ViewType = 'main' | 'evolution' | 'stats' | 'settings';

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: '1',
    name: 'Morning Routine',
    category: 'Health',
    emoji: '💪',
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
  const [theme, setTheme] = useState<'default' | 'win98' | 'glitch'>(() => {
    const saved = localStorage.getItem('digiapp-theme');
    return (saved as 'default' | 'win98' | 'glitch') || 'default';
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem('digiapp-onboarding-complete') === 'true';
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem('digiapp-user-name') || '';
  });

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('digiapp-theme', theme);
  }, [theme]);

  // Save AI settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('digiapp-ai-settings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  // Get max HP based on evolution stage
  const getMaxHPForStage = (stage: GameState['evolutionStage']): number => {
    switch (stage) {
      case 'digiegg':
        return 2; // 1 heart × 2 HP each (Egg level)
      case 'pichimon':
        return 4; // 2 hearts × 2 HP each (Baby I level)
      case 'pukamon':
        return 6; // 3 hearts × 2 HP each (Baby II level)
      case 'tapirmon':
        return 6; // 3 hearts × 2 HP each (Rookie level)
      case 'tuskmon':
      case 'monochromon':
      case 'bakemon':
        return 8; // 4 hearts × 2 HP each (Champion level)
      case 'gigadramon':
      case 'triceramon':
      case 'digitamamon':
        return 10; // 5 hearts × 2 HP each (Ultimate level)
      case 'gaioumon':
      case 'ultimatebrachiomon':
      case 'titamon':
        return 12; // 6 hearts × 2 HP each (Mega level)
      case 'gaioumon-itto':
        return 14; // 7 hearts × 2 HP each (Ultimate level)
      default:
        return 6;
    }
  };

  // Get base days needed for evolution at each stage
  const getBaseDaysForStage = (stage: GameState['evolutionStage']): number => {
    switch (stage) {
      case 'digiegg': return 1;
      case 'pichimon': return 2;
      case 'pukamon': return 4;
      case 'tapirmon': return 7;
      case 'tuskmon':
      case 'monochromon':
      case 'bakemon': return 9;
      case 'gigadramon':
      case 'triceramon':
      case 'digitamamon': return 11;
      case 'gaioumon':
      case 'ultimatebrachiomon':
      case 'titamon': return 14;
      case 'gaioumon-itto': return 999;
      default: return 7;
    }
  };

  // Calculate days needed considering if was degenerated by HP (30% reduction)
  const calculateDaysNeeded = (baseDays: number, wasDegenerated: boolean, alreadyUnlocked: boolean): number => {
    if (alreadyUnlocked && wasDegenerated) {
      return Math.ceil(baseDays * 0.3); // 30% of original time
    }
    return baseDays;
  };

  // Load game state from localStorage
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('digiapp_state_v3');
    if (saved) {
      const loadedState = JSON.parse(saved);
      // Ensure maxHealthPoints is correct for the stage and add new fields if missing
      return {
        ...loadedState,
        tasks: loadedState.tasks ?? [],
        completedTasks: loadedState.completedTasks ?? [],
        activityStats: loadedState.activityStats ?? {},
        maxHealthPoints: getMaxHPForStage(loadedState.evolutionStage),
        poopEventScheduled: loadedState.poopEventScheduled ?? null,
        foodEventsScheduled: loadedState.foodEventsScheduled ?? [],
        poopEventCompleted: loadedState.poopEventCompleted ?? false,
        foodEventsCompleted: loadedState.foodEventsCompleted ?? [],
        unlockedEvolutions: loadedState.unlockedEvolutions ?? ['digiegg'],
        degeneratedByHP: loadedState.degeneratedByHP ?? false,
        currentBranch: loadedState.currentBranch ?? 'data',
      };
    }
    return {
      activities: INITIAL_ACTIVITIES,
      tasks: [],
      completedTasks: [],
      activityStats: {},
      healthPoints: 2,
      maxHealthPoints: 2,
      totalXP: 0,
      virusPoints: 0,
      dataPoints: 0,
      vaccinePoints: 0,
      lastResetDate: new Date().toDateString(),
      evolutionStage: 'digiegg' as const,
      digivolutionSegments: 0,
      digivolutionSegmentsNeeded: 1, // 1 day to evolve from egg
      poopEventScheduled: null,
      foodEventsScheduled: [],
      poopEventCompleted: false,
      foodEventsCompleted: [],
      unlockedEvolutions: ['digiegg'],
      degeneratedByHP: false,
      currentBranch: 'data',
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
      // Check if all steps were completed yesterday
      const allSteps = prev.activities.flatMap(a => a.steps);
      const completedSteps = allSteps.filter(s => s.completed);
      const allStepsCompleted = allSteps.length > 0 && completedSteps.length === allSteps.length;

      let newHP = prev.healthPoints;
      let newXP = prev.totalXP;
      let newVirusPoints = prev.virusPoints;
      let newDataPoints = prev.dataPoints;
      let newVaccinePoints = prev.vaccinePoints;
      let newEvolutionStage = prev.evolutionStage;
      let newDigivolutionSegments = prev.digivolutionSegments;
      let newDigivolutionSegmentsNeeded = prev.digivolutionSegmentsNeeded;

      if (allStepsCompleted) {
        // All steps completed - fill one digivolution segment AND recover 1 HP
        newDigivolutionSegments += 1;
        newHP = Math.min(prev.maxHealthPoints, prev.healthPoints + 1);

        // Calculate XP and attribute gains
        let dailyVirus = 0;
        let dailyData = 0;
        let dailyVaccine = 0;

        prev.activities.forEach(activity => {
          const attrs = CATEGORY_ATTRIBUTES[activity.category];
          dailyVirus += attrs.virus;
          dailyData += attrs.data;
          dailyVaccine += attrs.vaccine;
        });

        // Add attribute points
        newVirusPoints += dailyVirus;
        newDataPoints += dailyData;
        newVaccinePoints += dailyVaccine;

        // Calculate XP (total attributes × 10)
        const dailyXP = (dailyVirus + dailyData + dailyVaccine) * 10;
        newXP += dailyXP;

        // Check if ready to evolve based on digivolution segments
        if (newDigivolutionSegments >= newDigivolutionSegmentsNeeded) {
          // Determine evolution based on current stage and dominant attribute
          const dominantAttr = Math.max(newVirusPoints, newDataPoints, newVaccinePoints);
          const isVirus = newVirusPoints === dominantAttr && newVirusPoints > 0;
          const isData = newDataPoints === dominantAttr && newDataPoints > 0;
          const isVaccine = newVaccinePoints === dominantAttr && newVaccinePoints > 0;
          
          // Evolve based on current stage
          if (prev.evolutionStage === 'digiegg') {
            newEvolutionStage = 'pichimon';
            newHP = getMaxHPForStage('pichimon');
            const baseDays = getBaseDaysForStage('pichimon');
            const alreadyUnlocked = prev.unlockedEvolutions.includes('pichimon');
            newDigivolutionSegmentsNeeded = calculateDaysNeeded(baseDays, prev.degeneratedByHP, alreadyUnlocked);
          } else if (prev.evolutionStage === 'pichimon') {
            newEvolutionStage = 'pukamon';
            newHP = getMaxHPForStage('pukamon');
            const baseDays = getBaseDaysForStage('pukamon');
            const alreadyUnlocked = prev.unlockedEvolutions.includes('pukamon');
            newDigivolutionSegmentsNeeded = calculateDaysNeeded(baseDays, prev.degeneratedByHP, alreadyUnlocked);
          } else if (prev.evolutionStage === 'pukamon') {
            newEvolutionStage = 'tapirmon';
            newHP = getMaxHPForStage('tapirmon');
            const baseDays = getBaseDaysForStage('tapirmon');
            const alreadyUnlocked = prev.unlockedEvolutions.includes('tapirmon');
            newDigivolutionSegmentsNeeded = calculateDaysNeeded(baseDays, prev.degeneratedByHP, alreadyUnlocked);
          } else if (prev.evolutionStage === 'tapirmon') {
            // Branch into Champion based on attributes
            if (isVirus) newEvolutionStage = 'tuskmon';
            else if (isVaccine) newEvolutionStage = 'bakemon';
            else newEvolutionStage = 'monochromon'; // Default to Data
            newHP = getMaxHPForStage(newEvolutionStage);
            const baseDays = getBaseDaysForStage(newEvolutionStage);
            const alreadyUnlocked = prev.unlockedEvolutions.includes(newEvolutionStage);
            newDigivolutionSegmentsNeeded = calculateDaysNeeded(baseDays, prev.degeneratedByHP, alreadyUnlocked);
          } else if (['tuskmon', 'monochromon', 'bakemon'].includes(prev.evolutionStage)) {
            // Champion to Ultimate - can cross-digivolve
            if (isVirus) newEvolutionStage = 'gigadramon';
            else if (isVaccine) newEvolutionStage = 'digitamamon';
            else newEvolutionStage = 'triceramon'; // Default to Data
            newHP = getMaxHPForStage(newEvolutionStage);
            const baseDays = getBaseDaysForStage(newEvolutionStage);
            const alreadyUnlocked = prev.unlockedEvolutions.includes(newEvolutionStage);
            newDigivolutionSegmentsNeeded = calculateDaysNeeded(baseDays, prev.degeneratedByHP, alreadyUnlocked);
          } else if (['gigadramon', 'triceramon', 'digitamamon'].includes(prev.evolutionStage)) {
            // Ultimate to Mega - can cross-digivolve
            if (isVirus) newEvolutionStage = 'gaioumon';
            else if (isVaccine) newEvolutionStage = 'titamon';
            else newEvolutionStage = 'ultimatebrachiomon'; // Default to Data
            newHP = getMaxHPForStage(newEvolutionStage);
            const baseDays = getBaseDaysForStage(newEvolutionStage);
            const alreadyUnlocked = prev.unlockedEvolutions.includes(newEvolutionStage);
            newDigivolutionSegmentsNeeded = calculateDaysNeeded(baseDays, prev.degeneratedByHP, alreadyUnlocked);
          } else if (['gaioumon', 'ultimatebrachiomon', 'titamon'].includes(prev.evolutionStage)) {
            // Mega to Itto Mode
            newEvolutionStage = 'gaioumon-itto';
            newHP = getMaxHPForStage('gaioumon-itto');
            newDigivolutionSegmentsNeeded = 999; // No more evolutions
          }
          
          // Reset digivolution segments and add to unlocked evolutions
          newDigivolutionSegments = 0;
          
          // Track unlocked evolutions
          const newUnlockedEvolutions = [...prev.unlockedEvolutions];
          if (!newUnlockedEvolutions.includes(newEvolutionStage)) {
            newUnlockedEvolutions.push(newEvolutionStage);
          }
        }
      } else {
        // Tasks not completed - lose 1 HP
        newHP = Math.max(0, prev.healthPoints - 1);
        
        // If HP reaches 0, devolve
        if (newHP === 0) {
          let degeneratedByHP = true;
          if (prev.evolutionStage === 'gaioumon-itto') {
            // Devolve from Itto to previous Mega (stay in same branch conceptually)
            newEvolutionStage = 'gaioumon';
            newHP = getMaxHPForStage('gaioumon');
          } else if (['gaioumon', 'ultimatebrachiomon', 'titamon'].includes(prev.evolutionStage)) {
            // Devolve from Mega to Ultimate
            if (prev.evolutionStage === 'gaioumon') newEvolutionStage = 'gigadramon';
            else if (prev.evolutionStage === 'titamon') newEvolutionStage = 'digitamamon';
            else newEvolutionStage = 'triceramon';
            newHP = getMaxHPForStage(newEvolutionStage);
          } else if (['gigadramon', 'triceramon', 'digitamamon'].includes(prev.evolutionStage)) {
            // Devolve from Ultimate to Champion
            if (prev.evolutionStage === 'gigadramon') newEvolutionStage = 'tuskmon';
            else if (prev.evolutionStage === 'digitamamon') newEvolutionStage = 'bakemon';
            else newEvolutionStage = 'monochromon';
            newHP = getMaxHPForStage(newEvolutionStage);
          } else if (['tuskmon', 'monochromon', 'bakemon'].includes(prev.evolutionStage)) {
            // Devolve from Champion to Rookie
            newEvolutionStage = 'tapirmon';
            newHP = getMaxHPForStage('tapirmon');
          } else if (prev.evolutionStage === 'tapirmon') {
            // Devolve from Rookie to Baby II
            newEvolutionStage = 'pukamon';
            newHP = getMaxHPForStage('pukamon');
          } else if (prev.evolutionStage === 'pukamon') {
            // Devolve from Baby II to Baby I
            newEvolutionStage = 'pichimon';
            newHP = getMaxHPForStage('pichimon');
          } else if (prev.evolutionStage === 'pichimon') {
            // Devolve from Baby I to Egg
            newEvolutionStage = 'digiegg';
            newHP = getMaxHPForStage('digiegg');
          } else {
            // Already at base form, reset HP
            newHP = getMaxHPForStage(prev.evolutionStage);
          }
          
          // Reset digivolution progress on devolve
          newDigivolutionSegments = 0;
        }
      }

      // Reset all activity checkboxes
      const resetActivities = prev.activities.map(activity => ({
        ...activity,
        steps: activity.steps.map(step => ({ ...step, completed: false })),
      }));

      // Update unlocked evolutions list
      let finalUnlockedEvolutions = prev.unlockedEvolutions;
      if (allStepsCompleted && newEvolutionStage !== prev.evolutionStage) {
        finalUnlockedEvolutions = [...prev.unlockedEvolutions];
        if (!finalUnlockedEvolutions.includes(newEvolutionStage)) {
          finalUnlockedEvolutions.push(newEvolutionStage);
        }
      }

      // Determine if degeneration happened by HP loss
      const wasDegeneratedByHP = !allStepsCompleted && newHP === 0 && newEvolutionStage !== prev.evolutionStage;

      return {
        ...prev,
        activities: resetActivities,
        healthPoints: newHP,
        maxHealthPoints: getMaxHPForStage(newEvolutionStage),
        totalXP: newXP,
        virusPoints: newVirusPoints,
        dataPoints: newDataPoints,
        vaccinePoints: newVaccinePoints,
        lastResetDate: new Date().toDateString(),
        evolutionStage: newEvolutionStage,
        digivolutionSegments: newDigivolutionSegments,
        digivolutionSegmentsNeeded: newDigivolutionSegmentsNeeded,
        poopEventScheduled: null,
        foodEventsScheduled: [],
        poopEventCompleted: false,
        foodEventsCompleted: [],
        unlockedEvolutions: finalUnlockedEvolutions,
        degeneratedByHP: wasDegeneratedByHP,
      };
    });
  };

  // Calculate overall progress for today
  const calculateProgress = () => {
    const allSteps = gameState.activities.flatMap(a => a.steps);
    const completedSteps = allSteps.filter(s => s.completed).length;
    return allSteps.length > 0 ? Math.round((completedSteps / allSteps.length) * 100) : 0;
  };

  // Calculate today's potential attribute gains
  const calculateTodayAttributes = () => {
    let virus = 0;
    let data = 0;
    let vaccine = 0;

    gameState.activities.forEach(activity => {
      const isComplete = activity.steps.length > 0 && activity.steps.every(s => s.completed);
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
    if (progress >= 70) return 'happy';
    if (progress <= 30) return 'tired';
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
      
      // If there's an active care event, complete it
      if (careEvent) {
        handleCareEventComplete();
      }
      
      // Trigger message bubble
      setMessageTrigger(prev => prev + 1);
    }
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
      case 'glitch':
        return 'glitch-outer-container';
      case 'win98':
        return 'win98-outer-container';
      default:
        return 'modern-outer-container';
    }
  };

  const getContainerClass = () => {
    switch (theme) {
      case 'glitch':
        return 'glitch-container rounded-none';
      case 'win98':
        return 'win98-container rounded-none';
      default:
        return 'modern-container rounded-2xl';
    }
  };

  const handleResetOnboarding = () => {
    localStorage.removeItem('digiapp-onboarding-complete');
    localStorage.removeItem('digiapp-user-name');
    window.location.reload();
  };

  const handleCompleteOnboarding = (data: {
    userName: string;
    firstItem: {
      type: 'task' | 'activity';
      name: string;
      category: ActivityCategory;
      emoji: string;
      steps?: Step[];
    };
  }) => {
    // Save user name and onboarding completion
    localStorage.setItem('digiapp-user-name', data.userName);
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
      }));
    } else {
      const newActivity: Activity = {
        id: Date.now().toString(),
        name: data.firstItem.name,
        category: data.firstItem.category,
        emoji: data.firstItem.emoji,
        steps: data.firstItem.steps || [],
      };
      setGameState(prev => ({
        ...prev,
        activities: [newActivity],
        tasks: [], // Start with no default tasks
      }));
    }
  };

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <OnboardingScreen onComplete={handleCompleteOnboarding} />;
  }

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      theme === 'default' ? 'bg-gradient-to-br from-teal-50/60 via-cyan-50/50 to-emerald-50/60' : getOuterContainerClass()
    }`}>
      {/* Glitch Effects */}
      {theme === 'glitch' && (
        <>
          <div className="glitch-line" style={{ top: '10%' }} />
          <div className="glitch-line" style={{ top: '40%', animationDelay: '2s' }} />
          <div className="glitch-line" style={{ top: '75%', animationDelay: '4s' }} />
        </>
      )}
      
      <div className={`w-full max-w-md overflow-hidden flex flex-col h-[90vh] max-h-[900px] relative ${
        theme === 'default' ? 'bg-gray-50 shadow-2xl rounded-3xl' : getContainerClass()
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
            onResetOnboarding={handleResetOnboarding}
            theme={theme}
          />
        </div>

        {/* Scrollable Content */}
        <div className={`flex-1 overflow-y-auto ${theme === 'win98' ? 'bg-[#c0c0c0] p-4' : theme === 'glitch' ? 'bg-[#0a0a0a] p-4' : 'p-6'}`}>
          {currentView === 'main' && (
            <div className="space-y-4">
              <AttributeBadges 
                virusPoints={gameState.virusPoints}
                dataPoints={gameState.dataPoints}
                vaccinePoints={gameState.vaccinePoints}
                onNewActivity={() => setCreateModalOpen(true)}
              />

              {gameState.tasks.map(task => (
                <TaskCard
                  key={task.id}
                  id={task.id}
                  name={task.name}
                  category={task.category}
                  emoji={task.emoji}
                  completed={task.completed}
                  onToggleComplete={handleToggleTask}
                  onDelete={handleDeleteTask}
                  theme={theme}
                />
              ))}

              {gameState.activities.map(activity => {
                const isComplete = activity.steps.length > 0 && activity.steps.every(s => s.completed);
                return (
                  <ActivityCard
                    key={activity.id}
                    id={activity.id}
                    name={`${activity.emoji} ${activity.name}`}
                    steps={activity.steps}
                    onUpdateStep={handleUpdateStep}
                    onEditActivity={handleEditActivity}
                    isExpanded={true}
                    isCompleted={isComplete}
                    theme={theme}
                  />
                );
              })}
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
              onDegenerate={handleDegenerate}
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
            />
          )}
        </div>

        {/* Fixed Companion HUD */}
        <div className={`flex-shrink-0 ${theme === 'glitch' ? 'bg-[#0a0a0a] border-t-2 border-[#00ffff] p-4' : theme === 'win98' ? 'bg-[#c0c0c0] border-t-2 border-white p-4' : 'p-6'}`}>
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
            totalSteps={gameState.activities.flatMap(a => a.steps).length}
            completedSteps={gameState.activities.flatMap(a => a.steps).filter(s => s.completed).length}
            digivolutionSegments={gameState.digivolutionSegments}
            theme={theme}
            digivolutionSegmentsNeeded={gameState.digivolutionSegmentsNeeded}
            onDigivolve={handleDigivolve}
            careEvent={careEvent}
            onCareEventComplete={handleCareEventComplete}
            useAI={useAI}
            aiSettings={aiSettings}
            onOpenAISettings={() => setAiSettingsOpen(true)}
            onCreateActivity={handleAICreateActivity}
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
        title={editingActivity ? 'Edit Activity' : 'New Activity'}
        showSteps={true}
      />

      <TaskEditModal
        isOpen={taskEditModalOpen}
        onClose={() => {
          setTaskEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
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
        onSaveTask={(data) => {
          const newTask: Task = {
            id: `task-${Date.now()}`,
            name: data.name,
            category: data.category as ActivityCategory,
            emoji: data.emoji,
            completed: false,
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
          };
          setGameState(prev => ({
            ...prev,
            activities: [...prev.activities, newActivity],
          }));
        }}
        theme={theme}
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
    </div>
  );
}