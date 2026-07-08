import { createContext, useContext, useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { type ActivityCategory } from '../types/attributes';
import { MAX_HP_BY_FORM, getStageLevel, FORM_REQUIREMENTS } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { cloudSave } from '../utils/cloudSave';

export interface Step {
  id: string;
  label: string;
  completed: boolean;
}

export interface Activity {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  steps: Step[];
  weekDays: number[];
  alarm?: { time: string };
  completedToday?: boolean;
  lastCompletedDate?: string;
}

export interface Task {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completed: boolean;
  deadline?: { date: string; time: string };
  alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
  steps?: Step[];
}

export interface CompletedTask {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completedAt: string;
}

export interface ActivityStats {
  [activityId: string]: {
    name: string;
    emoji: string;
    category: ActivityCategory;
    completionCount: number;
  };
}

export interface GameState {
  activities: Activity[];
  tasks: Task[];
  completedTasks: CompletedTask[];
  activityStats: ActivityStats;
  healthPoints: number;
  maxHealthPoints: number;
  /** Version B: energy/satiety gauge — fills only by feeding, caps at maxHealthPoints */
  energyPoints: number;
  perfectDays: number;
  totalXP: number;
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  lastResetDate: string;
  evolutionStage:
    | 'digiegg' | 'pichimon' | 'pukamon' | 'tapirmon'
    | 'monochromon' | 'tuskmon' | 'bakemon'
    | 'gigadramon' | 'triceramon' | 'digitamamon'
    | 'gaioumon' | 'ultimatebrachiomon' | 'titamon'
    | 'chicomon' | 'chibimon' | 'veemon'
    | 'exveemon' | 'veedramon' | 'flamedramon'
    | 'paildramon' | 'aeroveedramon' | 'raidramon'
    | 'imperialdramon' | 'ulforceveedramon' | 'magnamon'
    | 'yukimibotamon' | 'nyaromon' | 'plotmon'
    | 'gatomon' | 'gatomon-black' | 'mikemon'
    | 'angewomon' | 'ladydevimon' | 'nefertimon'
    | 'ophanimon' | 'lilithmon' | 'holydramon'
    | 'gaioumon-itto' | 'imperialdramon-paladin' | 'mastemon'
    | 'greymon' | 'garurumon' | 'meramon' | 'monzaemon' | 'etemon'
    | 'devimon' | 'andromon'
    | 'angemon' | 'birdramon' | 'kabuterimon' | 'seadramon'
    | 'airdramon' | 'ogremon' | 'kuwagamon' | 'numemon'
    | 'megadramon' | 'vademon' | 'nanimon';
  digivolutionSegments: number;
  digivolutionSegmentsNeeded: number;
  poopEventsScheduled: number[];
  poopEventsCompleted: number[];
  unlockedEvolutions: string[];
  degeneratedByHP: boolean;
  currentBranch: 'virus' | 'data' | 'vaccine';
  lastDayWasPerfect: boolean;
  maxActivityCap: number;
  eggType?: 'tapirmon' | 'veemon' | 'salamon';
  /** Attribute points accumulated since the last evolution — drives branch selection */
  attributesSinceLastEvolution: { virus: number; data: number; vaccine: number };
  /** Version B: food stockpile keyed by food emoji */
  foodInventory: Record<string, number>;
  /** Indices of scheduled poop events that actually appeared on screen (so sleep-skipped ones don't penalize). */
  poopEventsShown: number[];
  /** Epoch ms clock for the "uncleaned poop drains 1 heart / 6h" penalty (0 = inactive). */
  poopPenaltyClockAt: number;
  /** Bits (🪙): minigame currency earned in the Activities games, spent in the shop. */
  gamePoints: number;
  /** Shop: pet-box backgrounds owned (ids from utils/shop.ts). */
  ownedBackgrounds: string[];
  /** Shop: equipped pet-box background id, or null for the default. */
  equippedBackground: string | null;
  /** Shop item digivolution: replaces the branch form when the pet evolves to the item's level (consumed on evolve). */
  equippedEvoItem: string | null;
  /** Summary of the previous day, written at the daily reset and shown once as a report. */
  lastDayReport?: {
    date: string;
    done: number;
    total: number;
    required: number;
    heartsLost: number;
    wasPerfect: boolean;
    energyWasFull?: boolean;
    perfectDays: number;
    degenerated: boolean;
  };
}

export function getMaxHPForStage(stage: GameState['evolutionStage']): number {
  return MAX_HP_BY_FORM[getStageLevel(stage)];
}

interface GameStateContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(() => {
    // A corrupted save must never white-screen the app — fall back to a fresh state.
    let loadedState: Partial<GameState> | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.GAME_STATE);
      if (saved) loadedState = JSON.parse(saved) as Partial<GameState>;
    } catch {
      loadedState = null;
    }
    if (loadedState) {
      const savedEggType = localStorage.getItem(STORAGE_KEYS.EGG_TYPE) as GameState['eggType'] | null;
      return {
        ...loadedState,
        tasks: loadedState.tasks ?? [],
        completedTasks: loadedState.completedTasks ?? [],
        activityStats: loadedState.activityStats ?? {},
        maxHealthPoints: getMaxHPForStage(loadedState.evolutionStage ?? 'digiegg'),
        energyPoints: loadedState.energyPoints ?? 0,
        perfectDays: loadedState.perfectDays ?? 0,
        lastDayWasPerfect: loadedState.lastDayWasPerfect ?? false,
        poopEventsScheduled: loadedState.poopEventsScheduled ?? [],
        poopEventsCompleted: loadedState.poopEventsCompleted ?? [],
        unlockedEvolutions: loadedState.unlockedEvolutions ?? ['digiegg'],
        degeneratedByHP: loadedState.degeneratedByHP ?? false,
        currentBranch: loadedState.currentBranch ?? 'data',
        maxActivityCap: loadedState.maxActivityCap ?? FORM_REQUIREMENTS[getStageLevel(loadedState.evolutionStage ?? 'digiegg')].cap,
        eggType: (
          (loadedState.eggType as string) === 'agumon' ? 'tapirmon'
          : loadedState.eggType
        ) ?? (
          (savedEggType as string) === 'agumon' ? 'tapirmon'
          : savedEggType
        ) ?? 'tapirmon',
        attributesSinceLastEvolution: loadedState.attributesSinceLastEvolution ?? { virus: 0, data: 0, vaccine: 0 },
        foodInventory: loadedState.foodInventory ?? {},
        poopEventsShown: loadedState.poopEventsShown ?? [],
        poopPenaltyClockAt: loadedState.poopPenaltyClockAt ?? 0,
        gamePoints: loadedState.gamePoints ?? 0,
        ownedBackgrounds: loadedState.ownedBackgrounds ?? [],
        equippedBackground: loadedState.equippedBackground ?? null,
        equippedEvoItem: loadedState.equippedEvoItem ?? null,
      } as GameState;
    }
    const savedEggType = localStorage.getItem(STORAGE_KEYS.EGG_TYPE) as GameState['eggType'] | null;
    return {
      activities: [],
      tasks: [],
      completedTasks: [],
      activityStats: {},
      healthPoints: 1,
      maxHealthPoints: 1,
      energyPoints: 0,
      perfectDays: 0,
      totalXP: 0,
      virusPoints: 0,
      dataPoints: 0,
      vaccinePoints: 0,
      lastResetDate: new Date().toDateString(),
      evolutionStage: 'digiegg',
      digivolutionSegments: 0,
      digivolutionSegmentsNeeded: 1,
      poopEventsScheduled: [],
      poopEventsCompleted: [],
      unlockedEvolutions: ['digiegg'],
      degeneratedByHP: false,
      currentBranch: 'data',
      lastDayWasPerfect: false,
      maxActivityCap: 2,
      eggType: ((savedEggType as string) === 'agumon' ? 'tapirmon' : savedEggType) ?? 'tapirmon',
      attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
      foodInventory: {},
      poopEventsShown: [],
      poopPenaltyClockAt: 0,
      gamePoints: 0,
      ownedBackgrounds: [],
      equippedBackground: null,
      equippedEvoItem: null,
    };
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify(gameState));

    // Skip cloud backup on first render (initial load from localStorage)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Generate save ID on first use
    let saveId = localStorage.getItem(STORAGE_KEYS.SAVE_ID);
    if (!saveId) {
      saveId = crypto.randomUUID();
      localStorage.setItem(STORAGE_KEYS.SAVE_ID, saveId);
    }

    const timer = setTimeout(() => cloudSave(saveId!, gameState), 3000);
    return () => clearTimeout(timer);
  }, [gameState]);

  const value = useMemo(() => ({ gameState, setGameState }), [gameState]);

  return (
    <GameStateContext.Provider value={value}>
      {children}
    </GameStateContext.Provider>
  );
}

export function useGameState() {
  const ctx = useContext(GameStateContext);
  if (!ctx) throw new Error('useGameState must be used within GameStateProvider');
  return ctx;
}
