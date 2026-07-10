import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { toast } from 'sonner';
import { useProgressTracking } from './hooks/useProgressTracking';
import { useCareSystem } from './hooks/useCareSystem';
import { useDailyReset } from './hooks/useDailyReset';
import { Header } from './components/Header';
import { ActivityCard } from './components/ActivityCard';
import { TaskCard } from './components/TaskCard';
import { CompanionHUD } from './components/CompanionHUD';
import { ConfirmDialog } from './components/ConfirmDialog';
import { AttributeBadges } from './components/AttributeBadges';
import { Toaster } from './components/ui/sonner';
import { GamePopups } from './components/GamePopups';
import { DigivolveTaskModal } from './components/DigivolveTaskModal';
import { ContentModals } from './components/ContentModals';
import { NotificationManager } from './components/NotificationManager';
import { DailyReportModal } from './components/DailyReportModal';
import { ItemsWindow } from './components/ItemsWindow';
import { HelpModal } from './components/HelpModal';
import { Plus, Edit2 } from 'lucide-react';
import { CATEGORY_ATTRIBUTES, type ActivityCategory, XP_THRESHOLDS } from './types/attributes';
import { type CareEvent } from './components/CareSystem';
import { FORM_REQUIREMENTS, getStageLevel, canSelectWeekdays, getMaxEnergyForStage } from './types/progression';
import { type Language, useTranslation } from './utils/i18n';
import { DigiWidget } from './plugins/DigiWidgetPlugin';
import { useGameState, getMaxHPForStage, type GameState, type Activity, type Task, type Step } from './contexts/GameStateContext';
import { STORAGE_KEYS } from './utils/storageKeys';
import { getNextEvolution } from './utils/dailyReset';
import { isMuted, setMuted, playTaskComplete, playFeed, playPoopClean, playDigivolve, playDegenerate, playSleep } from './utils/sounds';
import { requestNotificationPermission, showNotification } from './utils/notifications';
import { SHOP_ITEMS, DROP_EVO_ITEMS, CHIP_BOOST, HEART_HEAL, EVO_ITEMS, SPECIAL_ITEMS, HEART_ITEM_EMOJI, GLITCHTAMA_EMOJI } from './utils/shop';
import { getDungeonDifficulty, getDungeonBest, rollDungeonHeartDrop, rollDungeonDigimental } from './utils/dungeon';
import { getMissionProgress, isShopItemUnlocked } from './utils/missions';

const DIGIVOLVE_SEGMENTS: Record<string, number> = {
  'digiegg': 1, 'baby-i': 2, 'baby-ii': 4,
  rookie: 7, champion: 9, ultimate: 11, mega: 14, ultra: 999,
};
import { CATEGORY_EMOJIS, AI_CATEGORY_MAP, DIGIMON_STAGE_NAMES, DEGENERATION_STAGE_MAP, FOOD_BY_CATEGORY } from './constants/labels';
import type { AISettings } from './components/AISettingsModal';

const EvolutionPath = lazy(() => import('./components/EvolutionPath').then(m => ({ default: m.EvolutionPath })));
const CreateModal = lazy(() => import('./components/CreateModal').then(m => ({ default: m.CreateModal })));
const StatsPage = lazy(() => import('./components/StatsPage').then(m => ({ default: m.StatsPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ActivitiesPage = lazy(() => import('./components/ActivitiesPage').then(m => ({ default: m.ActivitiesPage })));
const OnboardingScreen = lazy(() => import('./components/OnboardingScreen').then(m => ({ default: m.OnboardingScreen })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const EditModal = lazy(() => import('./components/EditModal').then(m => ({ default: m.EditModal })));
const TaskEditModal = lazy(() => import('./components/TaskEditModal').then(m => ({ default: m.TaskEditModal })));
const OraclePage = lazy(() => import('./components/OraclePage').then(m => ({ default: m.OraclePage })));

type ViewType = 'main' | 'evolution' | 'stats' | 'settings' | 'games' | 'oracle';

export default function App() {
  const { gameState, setGameState } = useGameState();
  const [currentView, setCurrentView] = useState<ViewType>('main');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [digivolveModalStage, setDigivolveModalStage] = useState<string | null>(null);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [resetOnboardingOpen, setResetOnboardingOpen] = useState(false);
  const [hpBannerDismissed, setHpBannerDismissed] = useState(false);
  const [messageTrigger, setMessageTrigger] = useState(0);
  const [feedAnim, setFeedAnim] = useState<{ emoji: string; n: number } | null>(null);
  const [careEvent, setCareEvent] = useState<CareEvent | null>(null);
  const [showEvolutionChoice, setShowEvolutionChoice] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [useAI, setUseAI] = useState(true);
  const [soundMuted, setSoundMuted] = useState(() => isMuted());
  const [evolutionFlash, setEvolutionFlash] = useState(false);
  const [showItemsWindow, setShowItemsWindow] = useState(false);
  const [newItemsReady, setNewItemsReady] = useState(false);
  // Sleep state persists across app close/reopen — the pet stays asleep until woken.
  const [isSleeping, setIsSleeping] = useState(() => localStorage.getItem(STORAGE_KEYS.IS_SLEEPING) === 'true');
  // Feeding is limited to 5 per rolling hour; timestamps persist across app close.
  const feedTimesRef = useRef<number[]>(
    (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEYS.FOOD_FEED_TIMES) || '[]'); } catch { return []; } })()
  );
  // Bumped when a feed is refused for being full → pet says it's full.
  const [fullSignal, setFullSignal] = useState(0);
  // Daily report: shown once per day, on the first open after the reset ran.
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.AI_SETTINGS);
    return saved ? JSON.parse(saved) : {
      tone: 'casual',
      emojiIntensity: 'medium',
      motivationStyle: 'balanced',
      customKeywords: '',
      temperature: 0.85
    };
  });
  const [theme, setTheme] = useState<'default' | 'win98' | 'glitch'>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME);
    return (saved as 'default' | 'win98' | 'glitch') || 'default';
  });
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
    return saved === 'pt-BR' ? 'pt-BR' : 'en-US';
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
  });
  const [userName, setUserName] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.USER_NAME) || '';
  });
  const [showFirstTaskPopup, setShowFirstTaskPopup] = useState(false);
  const [hasShownFirstTaskPopup, setHasShownFirstTaskPopup] = useState(() => {
    if (localStorage.getItem(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN) === 'true') return true;
    // Auto-mark for established users (have completed-task history or activity stats)
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
      if (raw) {
        const s = JSON.parse(raw);
        if ((s.completedTasks?.length ?? 0) > 0 || Object.keys(s.activityStats ?? {}).length > 0 || (s.perfectDays ?? 0) > 0) {
          localStorage.setItem(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, 'true');
          return true;
        }
      }
    } catch { /* ignore */ }
    return false;
  });
  const [showRookieUnlockPopup, setShowRookieUnlockPopup] = useState(false);
  const [hasShownRookiePopup, setHasShownRookiePopup] = useState(() => {
    if (localStorage.getItem(STORAGE_KEYS.ROOKIE_POPUP_SHOWN) === 'true') return true;
    // Auto-mark for users already past baby stage
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
      if (raw) {
        const s = JSON.parse(raw);
        const babyStages = new Set(['digiegg', 'pichimon', 'pukamon', 'chicomon', 'chibimon', 'yukimibotamon', 'nyaromon']);
        if (!babyStages.has(s.evolutionStage ?? 'digiegg')) {
          localStorage.setItem(STORAGE_KEYS.ROOKIE_POPUP_SHOWN, 'true');
          return true;
        }
      }
    } catch { /* ignore */ }
    return false;
  });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED) === 'true';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(aiSettings));
  }, [aiSettings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS_ENABLED, notificationsEnabled ? 'true' : 'false');
  }, [notificationsEnabled]);

  // Detect when food items are added to inventory
  const prevInventoryTotalRef = useRef(
    Object.values(gameState.foodInventory).reduce((s, n) => s + n, 0)
  );
  useEffect(() => {
    const total = Object.values(gameState.foodInventory).reduce((s, n) => s + n, 0);
    if (total > prevInventoryTotalRef.current) setNewItemsReady(true);
    prevInventoryTotalRef.current = total;
  }, [gameState.foodInventory]);

  const { getCompanionMessageWithCare: _careMessageFn } = useCareSystem({
    gameState,
    careEvent,
    setCareEvent,
    setMessageTrigger,
    setGameState,
    language,
    isSleeping,
  });

  useDailyReset({
    gameState,
    setGameState,
    hasShownRookiePopup,
    setShowRookieUnlockPopup,
    setHasShownRookiePopup,
  });

  const { dailyTotal, dailyDone, progress } = useProgressTracking(gameState);

  const t = useTranslation(language);

  // Detect a digivolution (level up) to show the task-goal modal. We track the
  // previous stage LEVEL so branch swaps at the same level don't trigger it, and
  // degeneration (level down) never does. FORM_REQUIREMENTS.required increases
  // monotonically per level, so a higher requirement means a higher stage.
  const prevStageLevelRef = useRef(getStageLevel(gameState.evolutionStage));
  useEffect(() => {
    const currentLevel = getStageLevel(gameState.evolutionStage);
    const prevLevel = prevStageLevelRef.current;
    if (currentLevel !== prevLevel) {
      const leveledUp =
        FORM_REQUIREMENTS[currentLevel].required > FORM_REQUIREMENTS[prevLevel].required;
      prevStageLevelRef.current = currentLevel;
      if (leveledUp) setDigivolveModalStage(gameState.evolutionStage);
    }
  }, [gameState.evolutionStage]);

  // Sync game state to Android home screen widget
  useEffect(() => {
    const digimonName = gameState.evolutionStage.charAt(0).toUpperCase() + gameState.evolutionStage.slice(1);
    DigiWidget.updateWidgetData({
      digimonName,
      currentStage: gameState.evolutionStage,
      eggType: gameState.eggType ?? 'tapirmon',
      branchType: gameState.currentBranch,
      completedTasks: dailyDone,
      totalTasks: dailyTotal,
      hp: Math.round((gameState.healthPoints / gameState.maxHealthPoints) * 100),
      healthPoints: Math.floor(gameState.healthPoints),
      maxHealthPoints: gameState.maxHealthPoints,
      energyPoints: gameState.energyPoints ?? 0,
      hasPoop: (gameState.poopEventsShown || []).some(i => !(gameState.poopEventsCompleted || []).includes(i)),
    }).catch(() => {});
  }, [gameState.evolutionStage, gameState.currentBranch, gameState.eggType,
      gameState.healthPoints, gameState.maxHealthPoints, gameState.energyPoints,
      gameState.poopEventsShown, gameState.poopEventsCompleted, dailyDone, dailyTotal]);

  // Determine companion mood based on progress
  const getCompanionMood = (): 'idle' | 'happy' | 'tired' => {
    if (progress >= 60) return 'happy'; // Fica feliz mais fácil
    if (progress <= 15) return 'tired'; // Só fica cansado se MUITO baixo (antes era 30%)
    return 'idle';
  };

  // Get companion message based on progress and HP
  const getCompanionMessage = (): string => {
    if (gameState.healthPoints <= 1) {
      return t.main.companionNeedHelp;
    }
    if (progress >= 70) return t.main.companionAmazing;
    if (progress >= 40) return t.main.companionGoodProgress;
    if (progress >= 20) return t.main.companionYouGotThis;
    return t.main.companionBelieve;
  };

  // Get current day
  const getCurrentDay = () => {
    const days = [
      t.main.daySunday,
      t.main.dayMonday,
      t.main.dayTuesday,
      t.main.dayWednesday,
      t.main.dayThursday,
      t.main.dayFriday,
      t.main.daySaturday,
    ];
    return days[new Date().getDay()];
  };

  const getCurrentStageName = (): string =>
    DIGIMON_STAGE_NAMES[gameState.evolutionStage] ?? 'DigiEgg';

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

    // Completed steps cannot be unchecked — only daily reset restores them
    if (step?.completed) return;

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

        // Version B: early stages gain energy directly; baby-ii+ generate food
        let newFoodInventory = prev.foodInventory;
        let energyGain = 0;
        if (isFullyCompleted && updatedActivity) {
          if (['digiegg', 'baby-i'].includes(getStageLevel(prev.evolutionStage))) {
            energyGain = 1;
          } else {
            const food = FOOD_BY_CATEGORY[updatedActivity.category as keyof typeof FOOD_BY_CATEGORY];
            if (food) {
              newFoodInventory = {
                ...prev.foodInventory,
                [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1,
              };
            }
          }
        }

        return {
          ...prev,
          activities: updatedActivities,
          activityStats: newActivityStats,
          foodInventory: newFoodInventory,
          ...(energyGain > 0 && { energyPoints: Math.min((prev.energyPoints ?? 0) + energyGain, getMaxEnergyForStage(prev.evolutionStage)) }),
        };
      });

      playTaskComplete();

      // Check if this is the first task/step ever completed and show popup
      if (!hasShownFirstTaskPopup) {
        // Check if ANY step has been completed before this one
        const anyStepCompleted = gameState.activities.some(a =>
          a.steps.some(s => s.completed && s.id !== stepId)
        ) || gameState.tasks.some(t => t.completed);

        if (!anyStepCompleted) {
          setShowFirstTaskPopup(true);
          setHasShownFirstTaskPopup(true);
          localStorage.setItem(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, 'true');
        }
      }

      // If there's an active care event, complete it
      if (careEvent) {
        handleCareEventComplete();
      }
  };

  // Handler para atividades sem etapas
  const handleToggleActivityCompletion = (activityId: string) => {
    const today = new Date().toDateString();
    const activity = gameState.activities.find(a => a.id === activityId);
    // Completed activities cannot be unchecked — only daily reset restores them
    if (activity?.completedToday && activity?.lastCompletedDate === today) return;

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

      // Version B: early stages gain energy directly; baby-ii+ generate food
      let newFoodInventory = prev.foodInventory;
      let energyGain = 0;
      if (newCompletedState && activity) {
        if (['digiegg', 'baby-i'].includes(getStageLevel(prev.evolutionStage))) {
          energyGain = 1;
        } else {
          const food = FOOD_BY_CATEGORY[activity.category as keyof typeof FOOD_BY_CATEGORY];
          if (food) {
            newFoodInventory = {
              ...prev.foodInventory,
              [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1,
            };
          }
        }
      }

      return {
        ...prev,
        activities: updatedActivities,
        activityStats: newActivityStats,
        foodInventory: newFoodInventory,
        ...(energyGain > 0 && { energyPoints: Math.min((prev.energyPoints ?? 0) + energyGain, getMaxEnergyForStage(prev.evolutionStage)) }),
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
        localStorage.setItem(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, 'true');
      }
    }

    // If there's an active care event, complete it
    if (careEvent) {
      handleCareEventComplete();
    }
  };

  const handleEditActivity = useCallback((activityId: string) => {
    setEditingActivity(activityId);
    setEditModalOpen(true);
  }, []);

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

  const handleDeleteActivity = useCallback((activityId: string) => {
    setGameState(prev => ({
      ...prev,
      activities: prev.activities.filter(activity => activity.id !== activityId),
    }));
    setEditModalOpen(false);
    setEditingActivity(null);
  }, []);

  const handleAICreateActivity = useCallback((activity: {
    name: string;
    category: string;
    points: { virus: number; data: number; vaccine: number };
  }) => {
    if (import.meta.env.DEV) console.log('AI creating activity:', activity);

    const category = AI_CATEGORY_MAP[activity.category] || 'Study';
    const emoji = CATEGORY_EMOJIS[category] || '✨';

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

    if (import.meta.env.DEV) console.log('Activity created successfully:', newActivity);
  }, []);

  const handleAddNewTask = useCallback(() => {
    setEditingTask(null);
    setTaskEditModalOpen(true);
  }, []);

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
    if (!task || task.completed) return; // completed tasks cannot be unchecked

    if (!task.completed) {
      playTaskComplete();

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
          localStorage.setItem(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, 'true');
        }
      }

      // After 3 seconds, save to history, remove from list, and generate food
      // Version B: attribute points come from feeding, not from task completion
      setTimeout(() => {
        setGameState(prev => {
          const activityKey = `task-${task.name}-${task.category}`;
          const currentStats = prev.activityStats[activityKey] || {
            name: task.name,
            emoji: task.emoji,
            category: task.category,
            completionCount: 0,
          };

          const isEarlyStage = ['digiegg', 'baby-i'].includes(getStageLevel(prev.evolutionStage));
          let newFoodInventory = prev.foodInventory;
          let energyGain = 0;
          if (isEarlyStage) {
            energyGain = 1;
          } else {
            const food = FOOD_BY_CATEGORY[task.category as keyof typeof FOOD_BY_CATEGORY];
            if (food) {
              newFoodInventory = { ...prev.foodInventory, [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1 };
            }
          }

          return {
            ...prev,
            tasks: prev.tasks.filter(t => t.id !== taskId),
            // Keep only the most recent 200 — the UI shows at most the last 50,
            // and an unbounded list bloats every localStorage/cloud save.
            completedTasks: [
              ...prev.completedTasks,
              {
                id: taskId,
                name: task.name,
                category: task.category,
                emoji: task.emoji,
                completedAt: new Date().toISOString(),
              },
            ].slice(-200),
            activityStats: {
              ...prev.activityStats,
              [activityKey]: { ...currentStats, completionCount: currentStats.completionCount + 1 },
            },
            foodInventory: newFoodInventory,
            ...(energyGain > 0 && { energyPoints: Math.min((prev.energyPoints ?? 0) + energyGain, getMaxEnergyForStage(prev.evolutionStage)) }),
          };
        });
      }, 3000);
    }
  };

  const handleDeleteTask = useCallback((taskId: string) => {
    setGameState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  }, []);

  const handleEditTask = useCallback((taskId: string) => {
    setEditingTask(taskId);
    setTaskEditModalOpen(true);
  }, []);

  const handleAddNewActivity = useCallback(() => {
    setEditingActivity(null);
    setEditModalOpen(true);
  }, []);

  const handleDigivolve = useCallback(() => {
    setGameState(prev => {
      // Evolution padlock (Evolution page): while locked, never evolve.
      if (prev.evolutionLocked) return prev;
      let newEvolutionStage = prev.evolutionStage;
      let newHP = prev.healthPoints;
      let newSegmentsNeeded = prev.digivolutionSegmentsNeeded;

      // Determine evolution based on current stage and dominant attribute
      const dominantAttr = Math.max(prev.virusPoints, prev.dataPoints, prev.vaccinePoints);
      const isVirus = prev.virusPoints === dominantAttr && prev.virusPoints > 0;
      const isData = prev.dataPoints === dominantAttr && prev.dataPoints > 0;
      const isVaccine = prev.vaccinePoints === dominantAttr && prev.vaccinePoints > 0;

      // Determine new branch for state persistence
      let newCurrentBranch: 'virus' | 'data' | 'vaccine' = prev.currentBranch;
      if (isVirus) newCurrentBranch = 'virus';
      else if (isVaccine) newCurrentBranch = 'vaccine';
      else if (isData) newCurrentBranch = 'data';

      newEvolutionStage = getNextEvolution(
        prev.evolutionStage,
        prev.eggType ?? 'tapirmon',
        newCurrentBranch,
        prev.unlockedEvolutions,
      ) as typeof newEvolutionStage;
      // Item digivolution (shop): replaces the branch form at the item's level.
      let usedEvoItem = false;
      const evoItem = prev.equippedEvoItem ? EVO_ITEMS[prev.equippedEvoItem] : null;
      if (evoItem?.evoTarget && getStageLevel(newEvolutionStage) === evoItem.evoLevel && newEvolutionStage !== prev.evolutionStage) {
        newEvolutionStage = evoItem.evoTarget as typeof newEvolutionStage;
        usedEvoItem = true;
      }
      newSegmentsNeeded = DIGIVOLVE_SEGMENTS[getStageLevel(newEvolutionStage)] ?? newSegmentsNeeded;
      newHP = getMaxHPForStage(newEvolutionStage);

      // Digimentals are never consumed — after the evolution they go back to
      // the Items folder (frees the single equip slot for other items).
      const returnEmoji = usedEvoItem && evoItem?.consumedOnEvolve === false ? evoItem.inventoryEmoji : null;

      return {
        ...prev,
        evolutionStage: newEvolutionStage,
        currentBranch: newCurrentBranch,
        healthPoints: newHP,
        maxHealthPoints: getMaxHPForStage(newEvolutionStage),
        digivolutionSegments: 0,
        digivolutionSegmentsNeeded: newSegmentsNeeded,
        equippedEvoItem: usedEvoItem ? null : (prev.equippedEvoItem ?? null),
        ...(returnEmoji && {
          foodInventory: { ...prev.foodInventory, [returnEmoji]: (prev.foodInventory[returnEmoji] ?? 0) + 1 },
        }),
      };
    });
    playDigivolve();
    setEvolutionFlash(true);
    setTimeout(() => setEvolutionFlash(false), 2000);
    setMessageTrigger(prev => prev + 1);
  }, []);

  const handleCareEventComplete = useCallback(() => {
    if (!careEvent) return;

    setGameState(prev => {
      // Only poop care events exist now (scheduled food events were removed).
      if (careEvent.type !== 'poop') return prev;
      const poopIndex = (prev.poopEventsScheduled || []).findIndex(t => t === careEvent.requestTime);
      // Guard against -1 (e.g. a daily reset cleared the schedule mid-event).
      if (poopIndex < 0) return prev;
      return {
        ...prev,
        poopEventsCompleted: [...(prev.poopEventsCompleted || []), poopIndex],
        poopPenaltyClockAt: 0, // stop the 6h heart-drain clock
      };
    });

    if (careEvent.type === 'poop') playPoopClean();
    setCareEvent(null);
    setMessageTrigger(prev => prev + 1);
  }, [careEvent]);

  // Consume one food item → energy + attribute points (NOT HP; HP is only healed
  // via "carinho"). Limited to 5 feedings per rolling hour; once full, the pet
  // just says it's full (no other feedback).
  const handleFeed = useCallback((foodEmoji: string) => {
    // No item in stock → nothing happens (don't burn a feed slot or animate).
    if ((gameState.foodInventory[foodEmoji] ?? 0) <= 0) return;

    // Special items (shop consumables) behave differently from food: chips only
    // grant attribute points (no energy) and the heart item only heals HP.
    // Neither counts against the 5-feeds-per-hour food limit.
    const special = SPECIAL_ITEMS[foodEmoji];
    if (special) {
      // 🌀 Glitchtama: using it grants 1 perfect day (evolution point).
      if (special.kind === 'glitchtama') {
        playDigivolve();
        setGameState(prev => {
          const count = prev.foodInventory[foodEmoji] ?? 0;
          if (count <= 0) return prev;
          const newInventory = { ...prev.foodInventory, [foodEmoji]: count - 1 };
          if (newInventory[foodEmoji] === 0) delete newInventory[foodEmoji];
          return {
            ...prev,
            foodInventory: newInventory,
            perfectDays: prev.perfectDays + 1,
            totalPerfectDays: (prev.totalPerfectDays ?? 0) + 1,
          };
        });
        setFeedAnim(prev => ({ emoji: foodEmoji, n: (prev?.n ?? 0) + 1 }));
        toast(language === 'pt-BR' ? '🌀 Glitchtama! +1 dia perfeito' : '🌀 Glitchtama! +1 perfect day');
        return;
      }
      // Digimentals / rookie items: USING equips it as THE evolution item (one
      // slot, same rule as the shop). Digimentals return here after evolving.
      if (special.kind === 'evo-equip') {
        if (gameState.equippedEvoItem) {
          toast(language === 'pt-BR'
            ? 'Já há um item de digievolução equipado!'
            : 'A digivolution item is already equipped!');
          return;
        }
        playFeed();
        setGameState(prev => {
          if (prev.equippedEvoItem) return prev;
          const count = prev.foodInventory[foodEmoji] ?? 0;
          if (count <= 0) return prev;
          const newInventory = { ...prev.foodInventory, [foodEmoji]: count - 1 };
          if (newInventory[foodEmoji] === 0) delete newInventory[foodEmoji];
          return { ...prev, foodInventory: newInventory, equippedEvoItem: special.evoItemId! };
        });
        toast(language === 'pt-BR'
          ? `${foodEmoji} Equipado — aguardando a próxima digievolução!`
          : `${foodEmoji} Equipped — waiting for the next digivolution!`);
        return;
      }
      if (special.kind === 'heart') {
        // The heart item is the only buyable HP heal. Refuse (keep it) if full.
        if (gameState.healthPoints >= gameState.maxHealthPoints) {
          setHealCapSignal(n => n + 1);
          return;
        }
        playTaskComplete();
        setGameState(prev => {
          const count = prev.foodInventory[foodEmoji] ?? 0;
          if (count <= 0) return prev;
          const newInventory = { ...prev.foodInventory, [foodEmoji]: count - 1 };
          if (newInventory[foodEmoji] === 0) delete newInventory[foodEmoji];
          return {
            ...prev,
            foodInventory: newInventory,
            healthPoints: Math.min(prev.maxHealthPoints, prev.healthPoints + HEART_HEAL),
          };
        });
        setFeedAnim(prev => ({ emoji: foodEmoji, n: (prev?.n ?? 0) + 1 }));
        return;
      }
      // Chip: attribute points only, no energy.
      playFeed();
      setGameState(prev => {
        const count = prev.foodInventory[foodEmoji] ?? 0;
        if (count <= 0) return prev;
        const newInventory = { ...prev.foodInventory, [foodEmoji]: count - 1 };
        if (newInventory[foodEmoji] === 0) delete newInventory[foodEmoji];
        const attr = special.attr!;
        const key = `${attr}Points` as 'virusPoints' | 'dataPoints' | 'vaccinePoints';
        return {
          ...prev,
          foodInventory: newInventory,
          [key]: prev[key] + CHIP_BOOST,
          totalXP: prev.totalXP + CHIP_BOOST * 10,
          attributesSinceLastEvolution: {
            ...prev.attributesSinceLastEvolution,
            [attr]: (prev.attributesSinceLastEvolution?.[attr] ?? 0) + CHIP_BOOST,
          },
        };
      });
      setFeedAnim(prev => ({ emoji: foodEmoji, n: (prev?.n ?? 0) + 1 }));
      return;
    }

    const now = Date.now();
    const recent = feedTimesRef.current.filter(t => now - t < 3600000);
    if (recent.length >= 5) {
      setFullSignal(n => n + 1); // pet says "I'm full"
      return;
    }
    const nextTimes = [...recent, now];
    feedTimesRef.current = nextTimes;
    localStorage.setItem(STORAGE_KEYS.FOOD_FEED_TIMES, JSON.stringify(nextTimes));

    playFeed();
    setGameState(prev => {
      const count = prev.foodInventory[foodEmoji] ?? 0;
      if (count <= 0) return prev;

      const newInventory = { ...prev.foodInventory, [foodEmoji]: count - 1 };
      if (newInventory[foodEmoji] === 0) delete newInventory[foodEmoji];

      // Resolve category → attribute points from the food emoji
      const foodDef = Object.values(FOOD_BY_CATEGORY).find(f => f.emoji === foodEmoji);
      const attrs = foodDef ? CATEGORY_ATTRIBUTES[foodDef.category] : { virus: 0, data: 0, vaccine: 0 };

      return {
        ...prev,
        // Energy gauge fills only by feeding, capped at the stage's energy bars
        energyPoints: Math.min(getMaxEnergyForStage(prev.evolutionStage), (prev.energyPoints ?? 0) + 1),
        foodInventory: newInventory,
        virusPoints: prev.virusPoints + attrs.virus,
        dataPoints: prev.dataPoints + attrs.data,
        vaccinePoints: prev.vaccinePoints + attrs.vaccine,
        totalXP: prev.totalXP + (attrs.virus + attrs.data + attrs.vaccine) * 10,
        attributesSinceLastEvolution: {
          virus: (prev.attributesSinceLastEvolution?.virus ?? 0) + attrs.virus,
          data: (prev.attributesSinceLastEvolution?.data ?? 0) + attrs.data,
          vaccine: (prev.attributesSinceLastEvolution?.vaccine ?? 0) + attrs.vaccine,
        },
      };
    });
    setFeedAnim(prev => ({ emoji: foodEmoji, n: (prev?.n ?? 0) + 1 }));
  }, [gameState.foodInventory, gameState.healthPoints, gameState.maxHealthPoints, gameState.equippedEvoItem, language]);

  // Shower: cosmetic wash (no energy cost). Also properly completes an active poop event.
  const handleShower = useCallback(() => {
    if (careEvent?.type === 'poop') {
      handleCareEventComplete();
    }
  }, [careEvent, handleCareEventComplete]);

  // Uncleaned poop drains 1 heart every 6 hours (paused while sleeping). The
  // clock starts when a poop is on screen and stops the moment it's cleaned.
  const poopDrainWarnedAtRef = useRef(0);
  useEffect(() => {
    const SIX_HOURS = 6 * 3600000;
    const drain = () => {
      // Warn ~30min before a drain tick so the user can react (bath) in time.
      {
        const shown = gameState.poopEventsShown || [];
        const cleaned = gameState.poopEventsCompleted || [];
        const clock = gameState.poopPenaltyClockAt ?? 0;
        if (!isSleeping && clock !== 0 && shown.some(i => !cleaned.includes(i))) {
          const now = Date.now();
          const periodStart = clock + Math.floor((now - clock) / SIX_HOURS) * SIX_HOURS;
          const msToNextTick = periodStart + SIX_HOURS - now;
          if (msToNextTick <= 30 * 60000 && poopDrainWarnedAtRef.current !== periodStart) {
            poopDrainWarnedAtRef.current = periodStart;
            const ispt = language === 'pt-BR';
            showNotification(
              ispt ? '🚽 Seu Digimon está na sujeira!' : '🚽 Your Digimon is in a mess!',
              {
                body: ispt
                  ? 'Cocô não limpo tira 1 coração em breve. Dê um banho!'
                  : 'Uncleaned poop will drain 1 heart soon. Give it a bath!',
                tag: 'poop-drain-warning',
              },
            );
          }
        }
      }
      setGameState(prev => {
        const shown = prev.poopEventsShown || [];
        const cleaned = prev.poopEventsCompleted || [];
        const hasUncleanPoop = shown.some(i => !cleaned.includes(i));
        const clock = prev.poopPenaltyClockAt ?? 0;
        if (!hasUncleanPoop) {
          return clock === 0 ? prev : { ...prev, poopPenaltyClockAt: 0 };
        }
        const now = Date.now();
        // Sleeping pauses the clock. Only persist the bump every ≥5 min so we
        // don't write state (and trigger a cloud save) every 60s all night.
        if (isSleeping) {
          if (clock !== 0 && now - clock < 5 * 60000) return prev;
          return { ...prev, poopPenaltyClockAt: now };
        }
        if (clock === 0) return { ...prev, poopPenaltyClockAt: now };
        const periods = Math.floor((now - clock) / SIX_HOURS);
        if (periods <= 0) return prev;
        return {
          ...prev,
          healthPoints: Math.max(0, prev.healthPoints - periods),
          poopPenaltyClockAt: clock + periods * SIX_HOURS,
        };
      });
    };
    drain();
    const id = setInterval(drain, 60000);
    return () => clearInterval(id);
  }, [isSleeping, setGameState, gameState.poopEventsShown, gameState.poopEventsCompleted, gameState.poopPenaltyClockAt, language]);

  const handleSleep = useCallback(() => {
    setIsSleeping(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEYS.IS_SLEEPING, next ? 'true' : 'false');
      return next;
    });
    playSleep();
  }, []);

  // Dungeon: no daily cap — entry is blocked only at ≤1 heart (a loss costs a
  // real heart, so the player must be able to afford it). As long as HP allows,
  // they can go as often as they like. Returns the monthly difficulty + best.
  const handleDungeonEnter = useCallback((): { ok: true; level: number; best: number } | { ok: false; reason: 'hp' } => {
    if (gameState.healthPoints <= 1) return { ok: false, reason: 'hp' };
    return { ok: true, level: getDungeonDifficulty(), best: getDungeonBest() };
  }, [gameState.healthPoints]);

  // Losing the dungeon costs one real heart. (Score/difficulty bookkeeping lives
  // in the game component via utils/dungeon.)
  const handleDungeonLose = useCallback(() => {
    setGameState(prev => ({ ...prev, healthPoints: Math.max(0, prev.healthPoints - 1) }));
  }, []);

  // Heart item can drop in the dungeon (capped per day). Adds it to the Items
  // folder and returns whether one dropped. The dungeon no longer drops food.
  const handleDungeonHeartDrop = useCallback((): boolean => {
    if (!rollDungeonHeartDrop()) return false;
    setGameState(prev => ({
      ...prev,
      foodInventory: { ...prev.foodInventory, [HEART_ITEM_EMOJI]: (prev.foodInventory[HEART_ITEM_EMOJI] ?? 0) + 1 },
    }));
    return true;
  }, []);

  // Records a drop-gated item id so its shop purchase unlocks (idempotent).
  const recordDrop = (prev: GameState, itemId: string): string[] => {
    const dropped = prev.droppedItems ?? [];
    return dropped.includes(itemId) ? dropped : [...dropped, itemId];
  };

  // ✨ Digimental drop (dungeon, 0.1%/enemy): adds it to the Items folder and
  // returns its display name for the reward line, or null when nothing dropped.
  const handleDungeonDigimental = useCallback((): string | null => {
    const id = rollDungeonDigimental();
    if (!id) return null;
    const item = EVO_ITEMS[id];
    const emoji = item.inventoryEmoji!;
    setGameState(prev => ({
      ...prev,
      foodInventory: { ...prev.foodInventory, [emoji]: (prev.foodInventory[emoji] ?? 0) + 1 },
      droppedItems: recordDrop(prev, id),
    }));
    return language === 'pt-BR' ? item.namePt : item.nameEn;
  }, [language]);

  // 🌀 Glitchtama — guaranteed reward for clearing all 5 dungeon floors.
  // Also counts a completed run for the missions.
  const handleGlitchtama = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      foodInventory: { ...prev.foodInventory, [GLITCHTAMA_EMOJI]: (prev.foodInventory[GLITCHTAMA_EMOJI] ?? 0) + 1 },
      dungeonRunsCompleted: (prev.dungeonRunsCompleted ?? 0) + 1,
    }));
  }, []);

  // 🏅 Mission counters
  const handleDungeonEnemyDefeated = useCallback(() => {
    setGameState(prev => ({ ...prev, dungeonKills: (prev.dungeonKills ?? 0) + 1 }));
  }, []);

  const handleDinoScore = useCallback((score: number) => {
    setGameState(prev => (score > (prev.dinoBest ?? 0) ? { ...prev, dinoBest: score } : prev));
  }, []);

  // Mission progress — derived from GameState counters. Dino's best also reads
  // the pre-existing localStorage record so old feats keep counting.
  const missionState = {
    evolutionStage: gameState.evolutionStage,
    unlockedEvolutions: gameState.unlockedEvolutions,
    dungeonKills: gameState.dungeonKills ?? 0,
    dungeonRunsCompleted: gameState.dungeonRunsCompleted ?? 0,
    dinoBest: Math.max(gameState.dinoBest ?? 0, Number(localStorage.getItem(STORAGE_KEYS.DINO_BEST)) || 0),
    totalPerfectDays: gameState.totalPerfectDays ?? 0,
  };
  const missionProgress = getMissionProgress(missionState);

  // Rookie evolution items dropped by the minigames (Dino Run / RPS). Adds the
  // item to the Items folder and returns its display name for the drop line.
  const handleMinigameItemDrop = useCallback((emoji: string): string => {
    const special = SPECIAL_ITEMS[emoji];
    setGameState(prev => ({
      ...prev,
      foodInventory: { ...prev.foodInventory, [emoji]: (prev.foodInventory[emoji] ?? 0) + 1 },
      ...(special?.evoItemId && { droppedItems: recordDrop(prev, special.evoItemId) }),
    }));
    return special ? (language === 'pt-BR' ? special.namePt : special.nameEn) : emoji;
  }, [language]);

  // 🪙 Bits — minigame currency; accumulates in GameState (cloud-synced), spent in the shop.
  const handleEarnGamePoints = useCallback((pts: number) => {
    if (pts <= 0) return;
    setGameState(prev => ({ ...prev, gamePoints: (prev.gamePoints ?? 0) + pts }));
  }, []);

  // 🛒 Shop purchase — charges points and applies the item's effect. Items can
  // be locked behind a mission or a first-drop (utils/shop.ts `unlock`).
  const handleShopBuy = useCallback((itemId: string): boolean => {
    const item = [...SHOP_ITEMS, ...DROP_EVO_ITEMS].find(i => i.id === itemId);
    if (!item) return false;
    if (!isShopItemUnlocked(item, gameState.droppedItems ?? [], missionProgress)) return false;
    if ((gameState.gamePoints ?? 0) < item.price) return false;
    if (item.kind === 'bg' && (gameState.ownedBackgrounds ?? []).includes(item.id)) return false;
    // Only one digivolution item can be EQUIPPED at a time (avoid wasted
    // points) — inventory-based evo items (digimentals/rookie) aren't equipped
    // on purchase, so they skip this gate.
    if (item.kind === 'evo' && !item.inventoryEmoji && gameState.equippedEvoItem) return false;

    setGameState(prev => {
      const next = { ...prev, gamePoints: (prev.gamePoints ?? 0) - item.price };
      if (item.kind === 'chip' || item.kind === 'heart') {
        // Consumables go to the Items folder; their effect is applied on USE.
        next.foodInventory = {
          ...prev.foodInventory,
          [item.icon]: (prev.foodInventory[item.icon] ?? 0) + 1,
        };
      } else if (item.kind === 'bg') {
        next.ownedBackgrounds = [...(prev.ownedBackgrounds ?? []), item.id];
        next.equippedBackground = item.id; // equip right away
      } else if (item.kind === 'evo' && item.inventoryEmoji) {
        // Digimentals / rookie items go to the Items folder (equip via Items)
        next.foodInventory = {
          ...prev.foodInventory,
          [item.inventoryEmoji]: (prev.foodInventory[item.inventoryEmoji] ?? 0) + 1,
        };
      } else if (item.kind === 'evo') {
        next.equippedEvoItem = item.id;
      }
      return next;
    });
    playFeed();
    return true;
  }, [gameState.gamePoints, gameState.ownedBackgrounds, gameState.equippedEvoItem,
      gameState.droppedItems, missionProgress]);

  const handleEquipBackground = useCallback((id: string | null) => {
    setGameState(prev => ({ ...prev, equippedBackground: id }));
  }, []);

  // 🔒 Evolution padlock (Evolution page): tapping the current Digimon toggles
  // it. While locked, the pet never evolves at the day turn; unlocking lets the
  // (already met) criteria trigger the evolution on the NEXT day turn.
  const handleToggleEvolutionLock = useCallback(() => {
    setGameState(prev => ({ ...prev, evolutionLocked: !(prev.evolutionLocked ?? false) }));
  }, []);

  // Stable identity so CompanionHUD's memo() isn't defeated by an inline lambda.
  const handleOpenItems = useCallback(() => {
    setShowItemsWindow(prev => !prev);
    setNewItemsReady(false);
  }, []);

  // Show the daily report once when a fresh reset summary exists.
  useEffect(() => {
    const report = gameState.lastDayReport;
    if (!report) return;
    if (localStorage.getItem(STORAGE_KEYS.DAILY_REPORT_SHOWN) === report.date) return;
    setShowDailyReport(true);
  }, [gameState.lastDayReport]);

  const handleCloseDailyReport = useCallback(() => {
    if (gameState.lastDayReport) {
      localStorage.setItem(STORAGE_KEYS.DAILY_REPORT_SHOWN, gameState.lastDayReport.date);
    }
    setShowDailyReport(false);
  }, [gameState.lastDayReport]);

  // Optional auto-sleep schedule: puts the pet to sleep when entering the
  // configured window and wakes it when leaving. Only acts on window EDGES, so
  // a manual wake/sleep inside the window isn't fought by the automation.
  const autoSleepPrevInWindowRef = useRef<boolean | null>(null);
  useEffect(() => {
    const parseHM = (s: string | null, fallback: string) => {
      const m = /^(\d{1,2}):(\d{2})$/.exec(s || fallback);
      return m ? Number(m[1]) * 60 + Number(m[2]) : 0;
    };
    const check = () => {
      if (localStorage.getItem(STORAGE_KEYS.AUTO_SLEEP_ENABLED) !== 'true') {
        autoSleepPrevInWindowRef.current = null;
        return;
      }
      const start = parseHM(localStorage.getItem(STORAGE_KEYS.AUTO_SLEEP_START), '23:00');
      const end = parseHM(localStorage.getItem(STORAGE_KEYS.AUTO_SLEEP_END), '07:00');
      const nowD = new Date();
      const cur = nowD.getHours() * 60 + nowD.getMinutes();
      // Window may cross midnight (e.g. 23:00–07:00)
      const inWindow = start <= end ? cur >= start && cur < end : cur >= start || cur < end;
      const prev = autoSleepPrevInWindowRef.current;
      autoSleepPrevInWindowRef.current = inWindow;
      // Act on window transitions, plus on the very first check when already
      // inside the window (app opened after bedtime → pet goes to sleep).
      const shouldAct = prev === null ? inWindow : prev !== inWindow;
      if (!shouldAct) return;
      setIsSleeping(sleeping => {
        if (inWindow === sleeping) return sleeping;
        localStorage.setItem(STORAGE_KEYS.IS_SLEEPING, inWindow ? 'true' : 'false');
        return inWindow;
      });
    };
    check();
    const id = setInterval(check, 60000);
    return () => clearInterval(id);
  }, []);

  // Carinho: the ONLY way to heal HP. Called by CompanionHUD after every ~2s of
  // rubbing — each grant restores half a heart, capped at 1 full heart PER DAY
  // (so rubbing can't trivialize the daily heart loss). Animation always plays.
  const RUB_HEAL_CAP = 1; // hearts per day
  const rubHealRef = useRef<{ date: string; healed: number }>(
    (() => {
      try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEYS.RUB_HEAL_DAY) || 'null');
        if (saved && saved.date === new Date().toDateString()) return saved;
      } catch { /* fall through */ }
      return { date: new Date().toDateString(), healed: 0 };
    })()
  );
  // Bumped when rubbing can't heal because today's cap was reached → pet comments.
  const [healCapSignal, setHealCapSignal] = useState(0);

  const handlePet = useCallback(() => {
    if (gameState.healthPoints >= gameState.maxHealthPoints) return;
    const today = new Date().toDateString();
    if (rubHealRef.current.date !== today) rubHealRef.current = { date: today, healed: 0 };
    if (rubHealRef.current.healed >= RUB_HEAL_CAP) {
      setHealCapSignal(n => n + 1);
      return;
    }
    rubHealRef.current = { date: today, healed: rubHealRef.current.healed + 0.5 };
    localStorage.setItem(STORAGE_KEYS.RUB_HEAL_DAY, JSON.stringify(rubHealRef.current));
    playFeed();
    setGameState(prev => ({
      ...prev,
      healthPoints: Math.min(prev.maxHealthPoints, prev.healthPoints + 0.5),
    }));
  }, [gameState.healthPoints, gameState.maxHealthPoints]);

  const handleDegenerate = useCallback((targetStage: string) => {
    setGameState(prev => {
      const newStage = DEGENERATION_STAGE_MAP[targetStage] as GameState['evolutionStage'];
      if (!newStage) return prev;

      const newHP = getMaxHPForStage(newStage);
      const newStageLevel = getStageLevel(newStage);
      // Intentional degen: head start at half the requirement (easier recovery than neglect)
      const newPerfectDays = Math.floor(FORM_REQUIREMENTS[newStageLevel].required / 2);

      return {
        ...prev,
        evolutionStage: newStage,
        healthPoints: newHP,
        maxHealthPoints: newHP,
        digivolutionSegments: 0,
        perfectDays: newPerfectDays,
        degeneratedByHP: false,
        // Reset recent branch window — next evolution reflects habits going forward
        attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
      };
    });
    playDegenerate();
    setMessageTrigger(prev => prev + 1);
  }, []);

  const handleEvolveToUnlocked = useCallback((targetStage: string) => {
    setGameState(prev => {
      const newStage = DEGENERATION_STAGE_MAP[targetStage] as GameState['evolutionStage'];
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
  }, []);

  const handleOpenAISettings = useCallback(() => setSettingsOpen(true), []);

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
    eggType: 'tapirmon' | 'veemon' | 'salamon';
    initialActivities: Array<{ name: string; category: ActivityCategory; emoji: string }>;
  }) => {
    localStorage.setItem(STORAGE_KEYS.USER_NAME, data.userName);
    localStorage.setItem(STORAGE_KEYS.EGG_TYPE, data.eggType);
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
    setUserName(data.userName);
    setHasCompletedOnboarding(true);

    const newActivities: Activity[] = data.initialActivities.map((item, i) => ({
      id: `${Date.now() + i}`,
      name: item.name,
      category: item.category,
      emoji: item.emoji,
      steps: [],
      weekDays: [0, 1, 2, 3, 4, 5, 6],
    }));

    setGameState(prev => ({
      ...prev,
      activities: newActivities,
      tasks: [],
      eggType: data.eggType,
    }));
  };



  // Handle reset onboarding (DEBUG ONLY)
  const handleResetOnboarding = () => setResetOnboardingOpen(true);
  const handleConfirmResetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    localStorage.removeItem(STORAGE_KEYS.USER_NAME);
    localStorage.removeItem(STORAGE_KEYS.EGG_TYPE);
    window.location.reload();
  };

  // Handle toggle notifications
  const handleToggleNotifications = async () => {
    if (!notificationsEnabled) {
      // Request permission when enabling.
      // NOTE: requestNotificationPermission is imported statically (not via dynamic
      // import) so the browser permission prompt stays inside the user-gesture and
      // actually shows up. A dynamic import here loses the user-activation context.
      const granted = await requestNotificationPermission();
      if (granted) {
        setNotificationsEnabled(true);
      } else {
        // User denied permission - guide them to browser settings
        toast.warning(
          language === 'pt-BR' ? '🔔 Permissão Negada' : '🔔 Permission Denied',
          {
            description: language === 'pt-BR'
              ? 'Clique no cadeado 🔒 na barra de endereço → Notificações → Permitir, depois recarregue.'
              : 'Click the lock 🔒 in the address bar → Notifications → Allow, then reload the page.',
            duration: 8000,
          }
        );
      }
    } else {
      // Disable notifications
      setNotificationsEnabled(false);
    }
  };

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return <Suspense fallback={null}><OnboardingScreen onComplete={handleCompleteOnboarding} /></Suspense>;
  }

  return (
    <div className={`fixed inset-0 overflow-hidden flex flex-col ${theme === 'default' ? 'bg-gradient-to-br from-teal-50/60 via-cyan-50/50 to-emerald-50/60' : getOuterContainerClass()} ${theme === 'default' ? 'bg-gray-50' : getContainerClass()
      }`}>
        {/* Help Modal */}
        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          language={language}
          theme={theme}
        />

        {/* Floating Items Window */}
        {showItemsWindow && (
          <ItemsWindow
            foodInventory={gameState.foodInventory}
            onFeed={handleFeed}
            onClose={() => setShowItemsWindow(false)}
            language={language}
          />
        )}

        {/* Fixed Header */}
        <div className="flex-shrink-0">
          <Header
            currentView={currentView}
            onNavigate={setCurrentView}
            theme={theme}
            onResetOnboarding={handleResetOnboarding}
          />
        </div>

        {/* Scrollable Content - com padding bottom para não ficar atrás do companion */}
        <div className={`flex-1 overflow-y-auto ${theme === 'win98' ? 'bg-[#c0c0c0] px-6 pt-3' : 'px-6 pt-3'} pb-4`}>
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
                    {t.main.noActivityRegistered}
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

                    if (allActivities.length === 0 && gameState.tasks.length > 0) {
                      return (
                        <div key="no-activities" className="flex flex-col items-center justify-center py-8 gap-2">
                          <p className={`text-sm ${theme === 'glitch' ? 'text-[#00ffff]/50' : 'text-gray-400'}`}
                            style={{ fontFamily: 'monospace' }}>
                            {t.main.noActivityRegistered}
                          </p>
                          <button
                            onClick={handleAddNewActivity}
                            className={`text-xs px-3 py-1 rounded-lg transition-colors ${theme === 'glitch' ? 'text-[#00ffff] border border-[#00ffff]/40 hover:bg-[#00ffff]/10' : theme === 'win98' ? 'win98-button text-black' : 'text-teal-600 border border-teal-200 hover:bg-teal-50'}`}
                            style={{ fontFamily: 'monospace' }}>
                            + {t.activities.addNew}
                          </button>
                        </div>
                      );
                    }

                    return allActivities.map(activity => {
                      const isAvailable = activity.weekDays?.includes(today);

                      return (
                        <ActivityCard
                          key={activity.id}
                          id={activity.id}
                          name={`${activity.emoji} ${activity.name}`}
                          category={activity.category as ActivityCategory}
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
                          language={language}
                        />
                      );
                    });
                  })()}
                </>
              )}
            </div>
          )}

          {currentView === 'evolution' && (
            <Suspense fallback={null}><EvolutionPath
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
              dailyDone={dailyDone}
              dailyTotal={dailyTotal}
              dailyRequired={FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required}
              activitiesCount={gameState.activities.length}
              evolutionStage={gameState.evolutionStage}
              perfectDays={gameState.perfectDays}
              unlockedEvolutions={gameState.unlockedEvolutions}
              eggType={gameState.eggType}
              evolutionLocked={gameState.evolutionLocked ?? false}
              onToggleEvolutionLock={handleToggleEvolutionLock}
              language={language}
            /></Suspense>
          )}

          {currentView === 'stats' && (
            <Suspense fallback={null}><StatsPage
              completedTasks={gameState.completedTasks}
              activityStats={gameState.activityStats}
              theme={theme}
              language={language}
            /></Suspense>
          )}

          {currentView === 'settings' && (
            <Suspense fallback={null}><SettingsPage
              useAI={useAI}
              onToggleAI={() => setUseAI(!useAI)}
              aiSettings={aiSettings}
              onSaveAISettings={(settings) => {
                setAiSettings(settings);
              }}
              theme={theme}
              onChangeTheme={setTheme}
              language={language}
              onChangeLanguage={(lang) => {
                setLanguage(lang);
                localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
              }}
              onOpenGuide={() => setGuideModalOpen(true)}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
              onRestoreFromCloud={async (id) => {
                const { cloudLoad } = await import('./utils/cloudSave');
                const state = await cloudLoad(id);
                if (!state) return false;
                localStorage.setItem(STORAGE_KEYS.SAVE_ID, id);
                localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(state));
                window.location.reload();
                return true;
              }}
              onLoginWithEmail={async (email) => {
                const { emailToSaveId, cloudLoad, cloudSave } = await import('./utils/cloudSave');
                const id = await emailToSaveId(email);
                const state = await cloudLoad(id);
                localStorage.setItem(STORAGE_KEYS.SAVE_ID, id);
                localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email.trim().toLowerCase());
                if (state) {
                  // Existing account on this email — adopt its cloud progress
                  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(state));
                } else {
                  // First login for this email — claim it with the current progress
                  await cloudSave(id, gameState);
                }
                window.location.reload();
                return state ? 'loaded' : 'created';
              }}
            /></Suspense>
          )}

          {currentView === 'oracle' && (
            <Suspense fallback={null}>
              <OraclePage theme={theme} language={language} />
            </Suspense>
          )}

          {currentView === 'games' && (
            <Suspense fallback={null}>
              <ActivitiesPage
                evolutionStage={gameState.evolutionStage}
                language={language}
                theme={theme}
                totalPoints={gameState.gamePoints ?? 0}
                ownedBackgrounds={gameState.ownedBackgrounds ?? []}
                equippedBackground={gameState.equippedBackground ?? null}
                equippedEvoItem={gameState.equippedEvoItem ?? null}
                onDungeonEnter={handleDungeonEnter}
                onDungeonLose={handleDungeonLose}
                onDungeonHeartDrop={handleDungeonHeartDrop}
                onDungeonDigimental={handleDungeonDigimental}
                onGlitchtama={handleGlitchtama}
                onDungeonEnemyDefeated={handleDungeonEnemyDefeated}
                onDinoScore={handleDinoScore}
                onItemDrop={handleMinigameItemDrop}
                missionProgress={missionProgress}
                droppedItems={gameState.droppedItems ?? []}
                onEarnPoints={handleEarnGamePoints}
                onShopBuy={handleShopBuy}
                onEquipBackground={handleEquipBackground}
              />
            </Suspense>
          )}
        </div>

        {/* HP risk banner — dismissible strip above companion */}
        {gameState.healthPoints <= 1 && gameState.healthPoints > 0 && dailyDone < Math.ceil(FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required / 2) && !hpBannerDismissed && (
          <div className={`flex-shrink-0 flex items-center gap-2 px-4 py-1.5 animate-pulse ${
            theme === 'win98'
              ? 'bg-[#800000] border-t border-[#ff0000] text-white'
              : theme === 'glitch'
              ? 'bg-[#200000] border-t border-[#ff0066]/60'
              : 'bg-red-950 border-t border-red-500/50'
          }`}>
            <span style={{ fontSize: '0.75rem' }}>⚠️</span>
            <p className="text-red-300 flex-1 text-xs" style={{ fontFamily: 'monospace', lineHeight: '1.3' }}>
              {language === 'pt-BR'
                ? `1 HP restante — complete ao menos ${Math.ceil(FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required / 2)} item(s) hoje para não regredir!`
                : `1 HP left — complete at least ${Math.ceil(FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required / 2)} item(s) today to avoid degeneration!`}
            </p>
            <button
              onClick={() => setHpBannerDismissed(true)}
              className="text-red-400 hover:text-red-200 flex-shrink-0 px-1 text-sm leading-none"
              aria-label="Dismiss"
            >
              ✕
            </button>
          </div>
        )}

        {/* Companion HUD - fixo no rodapé como parte do flex */}
        <div className={`flex-shrink-0 ${theme === 'win98' ? 'bg-[#c0c0c0] border-t-2 border-white px-6 pb-3 pt-3' : 'bg-gray-50 px-6 pb-3 pt-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]'}`}>
          <CompanionHUD
            companionMood={getCompanionMood()}
            energyLevel={progress}
            message={_careMessageFn(getCompanionMessage())}
            currentStage={getCurrentStageName()}
            evolutionStage={gameState.evolutionStage}
            healthPoints={gameState.healthPoints}
            maxHealthPoints={gameState.maxHealthPoints}
            dominantBranch={getDominantBranch()}
            currentXP={gameState.totalXP}
            nextLevelXP={getNextLevelXP()}
            triggerMessage={messageTrigger}
            energyPoints={gameState.energyPoints}
            maxEnergyPoints={getMaxEnergyForStage(gameState.evolutionStage)}
            fullSignal={fullSignal}
            digivolutionSegments={gameState.digivolutionSegments}
            theme={theme}
            digivolutionSegmentsNeeded={gameState.digivolutionSegmentsNeeded}
            perfectDays={gameState.perfectDays}
            requiredDays={FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required}
            onDigivolve={handleDigivolve}
            careEvent={careEvent}
            onCareEventComplete={handleCareEventComplete}
            foodInventory={gameState.foodInventory}
            onFeed={handleFeed}
            onShower={handleShower}
            hasNewItems={newItemsReady}
            onOpenItems={handleOpenItems}
            onSleep={handleSleep}
            isSleeping={isSleeping}
            onPet={handlePet}
            healCapSignal={healCapSignal}
            equippedBackground={gameState.equippedBackground ?? null}
            useAI={useAI}
            aiSettings={aiSettings}
            onOpenAISettings={handleOpenAISettings}
            onCreateActivity={handleAICreateActivity}
            language={language}
            evolutionFlash={evolutionFlash}
            feedAnim={feedAnim}
          />
        </div>

      {editModalOpen && (
        <Suspense fallback={null}>
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
        </Suspense>
      )}

      {taskEditModalOpen && (
        <Suspense fallback={null}>
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
            title={editingTask ? t.main.editTask : t.main.newTask}
            theme={theme}
          />
        </Suspense>
      )}

      {createModalOpen && (
        <Suspense fallback={null}><CreateModal
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
        /></Suspense>
      )}

      <ConfirmDialog
        isOpen={resetOnboardingOpen}
        onClose={() => setResetOnboardingOpen(false)}
        onConfirm={handleConfirmResetOnboarding}
        title="Reset Onboarding"
        message="This will clear your name and egg choice. Continue?"
      />

      {settingsOpen && (
        <Suspense fallback={null}>
          <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            useAI={useAI}
            onToggleAI={() => setUseAI(!useAI)}
            soundMuted={soundMuted}
            onToggleSound={() => { setMuted(!soundMuted); setSoundMuted(!soundMuted); }}
            aiSettings={aiSettings}
            onSaveAISettings={(settings) => {
              setAiSettings(settings);
            }}
            theme={theme}
          />
        </Suspense>
      )}

      <ContentModals
        statsModalOpen={statsModalOpen}
        onCloseStats={() => setStatsModalOpen(false)}
        completedTasks={gameState.completedTasks}
        activityStats={gameState.activityStats}
        guideModalOpen={guideModalOpen}
        onCloseGuide={() => setGuideModalOpen(false)}
        theme={theme}
        language={language}
      />

      <GamePopups
        showFirstTaskPopup={showFirstTaskPopup}
        onCloseFirstTaskPopup={() => setShowFirstTaskPopup(false)}
        showRookieUnlockPopup={showRookieUnlockPopup}
        onCloseRookieUnlockPopup={() => setShowRookieUnlockPopup(false)}
        theme={theme}
      />

      <DigivolveTaskModal
        isOpen={digivolveModalStage !== null}
        onClose={() => setDigivolveModalStage(null)}
        onCreateTask={() => { setDigivolveModalStage(null); setCreateModalOpen(true); }}
        requiredTasks={FORM_REQUIREMENTS[getStageLevel(digivolveModalStage ?? gameState.evolutionStage)].required}
        registeredTasks={gameState.activities.length + gameState.tasks.length}
        stageName={digivolveModalStage ? (DIGIMON_STAGE_NAMES[digivolveModalStage] ?? getCurrentStageName()) : ''}
        theme={theme}
        language={language}
      />

      {/* Notification Manager */}
      <NotificationManager
        activities={gameState.activities}
        tasks={gameState.tasks}
        userName={userName}
        digimonName={getCurrentStageName()}
        language={language}
        enabled={notificationsEnabled}
        healthPoints={gameState.healthPoints}
        maxHealthPoints={gameState.maxHealthPoints}
        completedSteps={dailyDone}
        totalRequired={FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required}
      />
      {showDailyReport && gameState.lastDayReport && (
        <DailyReportModal
          report={gameState.lastDayReport}
          onClose={handleCloseDailyReport}
          language={language}
          theme={theme}
        />
      )}
      <Toaster richColors position="top-right" />
    </div>
  );
}