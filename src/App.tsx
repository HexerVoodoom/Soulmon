import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
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
import { ContentModals } from './components/ContentModals';
import { NotificationManager } from './components/NotificationManager';
import { Plus, Edit2 } from 'lucide-react';
import { CATEGORY_ATTRIBUTES, type ActivityCategory, XP_THRESHOLDS } from './types/attributes';
import { type CareEvent } from './components/CareSystem';
import { FORM_REQUIREMENTS, getStageLevel, canSelectWeekdays } from './types/progression';
import { type Language, useTranslation } from './utils/i18n';
import { DigiWidget } from './plugins/DigiWidgetPlugin';
import { useGameState, getMaxHPForStage, type GameState, type Activity, type Task, type Step } from './contexts/GameStateContext';
import { STORAGE_KEYS } from './utils/storageKeys';
import { CATEGORY_EMOJIS, AI_CATEGORY_MAP, DIGIMON_STAGE_NAMES } from './constants/labels';
import type { AISettings } from './components/AISettingsModal';

const EvolutionPath = lazy(() => import('./components/EvolutionPath').then(m => ({ default: m.EvolutionPath })));
const CreateModal = lazy(() => import('./components/CreateModal').then(m => ({ default: m.CreateModal })));
const StatsPage = lazy(() => import('./components/StatsPage').then(m => ({ default: m.StatsPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const OnboardingScreen = lazy(() => import('./components/OnboardingScreen').then(m => ({ default: m.OnboardingScreen })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const EditModal = lazy(() => import('./components/EditModal').then(m => ({ default: m.EditModal })));
const TaskEditModal = lazy(() => import('./components/TaskEditModal').then(m => ({ default: m.TaskEditModal })));

type ViewType = 'main' | 'evolution' | 'stats' | 'settings';

export default function App() {
  const { gameState, setGameState } = useGameState();
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
  const [resetOnboardingOpen, setResetOnboardingOpen] = useState(false);
  const [hpBannerDismissed, setHpBannerDismissed] = useState(false);
  const [messageTrigger, setMessageTrigger] = useState(0);
  const [careEvent, setCareEvent] = useState<CareEvent | null>(null);
  const [showEvolutionChoice, setShowEvolutionChoice] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [useAI, setUseAI] = useState(true);
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
    return localStorage.getItem(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN) === 'true';
  });
  const [showRookieUnlockPopup, setShowRookieUnlockPopup] = useState(false);
  const [hasShownRookiePopup, setHasShownRookiePopup] = useState(() => {
    return localStorage.getItem(STORAGE_KEYS.ROOKIE_POPUP_SHOWN) === 'true';
  });
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

  const { getCompanionMessageWithCare: _careMessageFn } = useCareSystem({
    gameState,
    careEvent,
    setCareEvent,
    setMessageTrigger,
    setGameState,
    language,
  });

  const { timeUntilReset } = useDailyReset({
    gameState,
    setGameState,
    hasShownRookiePopup,
    setShowRookieUnlockPopup,
    setHasShownRookiePopup,
  });

  const { dailyTotal, dailyDone, progress } = useProgressTracking(gameState);

  const t = useTranslation(language);

  // Sync game state to Android home screen widget
  useEffect(() => {
    const digimonName = gameState.evolutionStage.charAt(0).toUpperCase() + gameState.evolutionStage.slice(1);
    DigiWidget.updateWidgetData({
      digimonName,
      currentStage: gameState.evolutionStage,
      eggType: gameState.eggType ?? 'agumon',
      branchType: gameState.currentBranch,
      completedTasks: dailyDone,
      totalTasks: dailyTotal,
      hp: Math.round((gameState.healthPoints / gameState.maxHealthPoints) * 100),
    }).catch(() => {});
  }, [gameState.evolutionStage, gameState.currentBranch, gameState.eggType,
      gameState.healthPoints, gameState.maxHealthPoints, dailyDone, dailyTotal]);

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
          localStorage.setItem(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, 'true');
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
        localStorage.setItem(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, 'true');
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
          localStorage.setItem(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, 'true');
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
        // Ultra requires all three Mega forms to be previously unlocked
        const hasAllMegas = ['gaioumon', 'ultimatebrachiomon', 'titamon'].every(m =>
          prev.unlockedEvolutions.includes(m)
        );
        if (hasAllMegas) {
          newEvolutionStage = 'gaioumon-itto';
          newSegmentsNeeded = 999;
        }
      }

      newHP = getMaxHPForStage(newEvolutionStage);

      return {
        ...prev,
        evolutionStage: newEvolutionStage,
        currentBranch: newCurrentBranch,
        healthPoints: newHP,
        maxHealthPoints: getMaxHPForStage(newEvolutionStage),
        digivolutionSegments: 0,
        digivolutionSegmentsNeeded: newSegmentsNeeded,
      };
    });
    setMessageTrigger(prev => prev + 1);
  }, []);

  const handleCareEventComplete = useCallback(() => {
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
  }, [careEvent]);

  const handleDegenerate = useCallback((targetStage: string) => {
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
    setMessageTrigger(prev => prev + 1);
  }, []);

  const handleEvolveToUnlocked = useCallback((targetStage: string) => {
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
    eggType: 'agumon' | 'veemon' | 'salamon';
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
      // Request permission when enabling
      const { requestNotificationPermission } = await import('./utils/notifications');
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
              eggType={gameState.eggType}
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
            /></Suspense>
          )}
        </div>

        {/* HP risk banner — dismissible strip above companion */}
        {gameState.healthPoints === 1 && dailyDone < Math.ceil(FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required / 2) && !hpBannerDismissed && (
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
            onOpenAISettings={handleOpenAISettings}
            onCreateActivity={handleAICreateActivity}
            language={language}
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
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, activityId: '', stepId: '' })}
        onConfirm={handleConfirmUncheck}
        title={t.main.uncheckTask}
        message={t.main.uncheckTaskMessage}
      />

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

      {/* Notification Manager */}
      <NotificationManager
        activities={gameState.activities}
        tasks={gameState.tasks}
        userName={userName}
        language={language}
        enabled={notificationsEnabled}
        healthPoints={gameState.healthPoints}
        maxHealthPoints={gameState.maxHealthPoints}
        completedSteps={dailyDone}
        totalRequired={FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required}
      />
      <Toaster richColors position="top-right" />
    </div>
  );
}