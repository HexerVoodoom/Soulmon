import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense, Fragment } from 'react';
import { toast } from 'sonner';
import { useProgressTracking } from './hooks/useProgressTracking';
import { useCareSystem } from './hooks/useCareSystem';
import { useDailyReset } from './hooks/useDailyReset';
import { BottomNav } from './components/BottomNav';
import { CompanionHUD } from './components/CompanionHUD';
import { HomeHud } from './components/pixel/HomeHud';
import { RitualPanel, RitualRow } from './components/pixel/RitualPanel';
import { StepRow } from './components/StepRow';
import { categoryIconImg, categoryLabel } from './types/category-icons';
import iconTarget from './assets/soulmon/icons/icon-target.png';
import { ConfirmDialog } from './components/ConfirmDialog';
import { Toaster } from './components/ui/sonner';
import { GamePopups } from './components/GamePopups';
import { EvolveTaskModal } from './components/EvolveTaskModal';
import { EvolutionCeremony } from './components/EvolutionCeremony';
import { ContentModals } from './components/ContentModals';
import { NotificationManager } from './components/NotificationManager';
import { DailyReportModal } from './components/DailyReportModal';
import { WelcomePromptModal } from './components/WelcomePromptModal';
import { IntroScreen } from './components/IntroScreen';
import { ItemsWindow } from './components/ItemsWindow';
import { HelpModal } from './components/HelpModal';
import { ProtectProgressModal } from './components/ProtectProgressModal';
import { Edit2 } from 'lucide-react';
// Único uso: o aviso de HP baixo. Deixou de ser um triângulo de alerta (ver a
// nota no banner) e passou a ser o ícone de acolhimento.
import iconHeartHandshake from './assets/soulmon/icons/icon-heart-handshake.png';
import { CATEGORY_ATTRIBUTES, type ActivityCategory, XP_THRESHOLDS } from './types/attributes';
import { type CareEvent } from './components/CareSystem';
import { FORM_REQUIREMENTS, getStageLevel, getStageBranch, canSelectWeekdays, getMaxEnergyForStage } from './types/progression';
import { type Language, useTranslation, resolveLanguage } from './utils/i18n';
import { DigiWidget } from './plugins/DigiWidgetPlugin';
import { useGameState, getMaxHPForStage, type GameState, type Activity, type Task, type Step } from './contexts/GameStateContext';
import { STORAGE_KEYS } from './utils/storageKeys';
import {
  readFlag, readJson, readLocal, readNumber, removeLocal, writeFlag, writeJson, writeLocal,
} from './utils/safeStorage';
import { hashString, creatureFormId } from './utils/oracle';
import type { OracleInput, OracleResult } from './utils/oracle';
import { applyDecorEquip, type SlotId } from './utils/petStage';
import { PET_BACKGROUNDS } from './utils/backgrounds';

// Identidades estáveis: CompanionHUD é memo() e um `?? {}` inline cria um
// objeto novo a cada render, anulando a memoização (footgun conhecido).
/** Teto do log de conclusões de atividade — registro de ritmo, não arquivo.
 *  A leitura do ritmo olha 14 dias; 90 entradas cobrem isso com folga sem
 *  inchar o save (localStorage e nuvem). */
const ACTIVITY_LOG_CAP = 90;
const EMPTY_DECOR: Partial<Record<SlotId, string>> = {};
const EMPTY_TROPHIES: Array<{ season: string; place: 1 | 2 | 3 }> = [];
import { getNextEvolution, dailyGoalFor, registeredForDay, tasksToAvoidHeartLoss } from './utils/dailyReset';
import {
  feedFood, rubHeal, rubRefusal, rubHealRecordFor, recentFeeds, completeTask,
  FOOD_LIMIT_PER_HOUR, RUB_HEAL_STEP,
} from './utils/careRules';
import { isMuted, setMuted, playTaskComplete, playFeed, playPoopClean, playEvolve, playDegenerate, playSleep } from './utils/sounds';
import { requestNotificationPermission, showNotification } from './utils/notifications';
import { ALL_SHOP_ITEMS, CHIP_BOOST, HEART_HEAL, SPECIAL_ITEMS, HEART_ITEM_EMOJI, GLITCHTAMA_EMOJI } from './utils/shop';
import { getDungeonDifficulty, getDungeonBest, rollDungeonHeartDrop } from './utils/dungeon';
import { heartDropBonus, rollPetPassive } from './utils/passives';
import { recordMood, moodFor, moodSummary, type MoodValue } from './utils/mood';
import { computeCarePattern, resolveBranch, careHistory } from './utils/carePattern';
import { getMissionProgress, isShopItemUnlocked } from './utils/missions';
import { getGifts, getPendingTrophies } from './utils/community';
import {
  PREMADE_CHARACTERS, getDemoCreatureStages, canCreateDemoTaskToday, recordDemoCreation,
  REROLL_COST_CREDITS, HEART_COST_CREDITS,
  type CreditPack,
} from './utils/monetization';
import { BITS_EXCHANGE } from './utils/currencies';
import { fetchEntitlement, spendCredits, claimAdReward, type Entitlement } from './utils/entitlements';
import { purchase } from './utils/playBilling';

const EVOLVE_SEGMENTS: Record<string, number> = {
  rookie: 7, champion: 9, ultimate: 11, mega: 14, ultra: 999,
};

/** XP alvo do próximo nível, por nível atual (ver getNextLevelXP). */
const XP_BY_LEVEL: Record<string, number> = {
  rookie: XP_THRESHOLDS.champion,
  champion: XP_THRESHOLDS.ultimate,
  ultimate: XP_THRESHOLDS.mega,
  mega: XP_THRESHOLDS.itto,
  ultra: XP_THRESHOLDS.itto,
};
import { CATEGORY_EMOJIS, AI_CATEGORY_MAP, FOOD_BY_CATEGORY } from './constants/labels';
import type { AISettings } from './components/AISettingsModal';
import type { OnboardingCompleteData } from './components/SoulmonOnboarding';
import { UnlockAccountModal, UnlockNudge, type UnlockReason } from './components/UnlockAccountModal';
import { PixelFrame } from './components/PixelFrame';
import { EvoTrail } from './components/EvoTrail';

// ── O MOTOR DE TAREFAS (docs/PLANO-TAREFAS.md) ──────────────────────────────
// As REGRAS moram nos módulos puros (`taskTriage`, `habitRhythm`, `rituals`,
// `restWindow`); aqui embaixo só existe FIAÇÃO — estado de UI, efeitos e a
// tradução de um gesto do usuário em chamada de regra. Nenhuma fórmula é
// reescrita neste arquivo: regra copiada é regra que diverge em silêncio
// (footgun 9 do CLAUDE.md).
import { MorningCheckIn } from './components/MorningCheckIn';
import { TriagePile, type TriageAction } from './components/TriagePile';
import { TaskMeta } from './components/TaskMeta';
import { HabitConstancy } from './components/HabitConstancy';
import { MorningDream } from './components/MorningDream';
import { WeeklyReportCard } from './components/WeeklyReportCard';
import {
  needsCheckIn, checkInPlan, completeCheckIn,
  needsWeeklyReport, weeklyReport, stackingSuggestion,
  freshStartOffer, applyFreshStart,
} from './utils/rituals';
import {
  triageQueue, toOpen, toSomeday, drop, postpone, isHaunted, isActive, restore,
} from './utils/taskTriage';
import {
  completeHabit, emptyRhythm, dayKeyOf, attributeMultiplier, milestoneReached,
} from './utils/habitRhythm';
import { normalizeSchedule } from './types/taskModel';

/**
 * O rótulo de frequência de um hábito na lista.
 *
 * Lê o `schedule` (fonte da verdade da recorrência) e NUNCA o `weekDays`, que
 * para os modos flexíveis é preenchido com a semana inteira só para o widget
 * Android e o app de desktop — que não carregam o motor novo — continuarem
 * enxergando o item. Ler o campo antigo aqui fazia "3× por semana" e "a cada 2
 * dias" aparecerem como "Todo dia": o app anunciava uma cobrança diária que a
 * regra não faz, que é a pior classe de erro possível num app cuja tese é não
 * cobrar demais.
 */
function frequencyLabel(
  activity: { schedule?: any; weekDays?: number[] },
  isPt: boolean,
  diasCurtos: string[],
): string {
  const s = normalizeSchedule(activity);
  if (s.kind === 'timesPerWeek') {
    return isPt ? `${s.target}× por semana` : `${s.target}× per week`;
  }
  if (s.kind === 'everyNDays') {
    const base = isPt ? `A cada ${s.n} dia${s.n > 1 ? 's' : ''}` : `Every ${s.n} day${s.n > 1 ? 's' : ''}`;
    // O sufixo importa: é a diferença entre acumular atrasadas e não acumular.
    return s.from === 'completion'
      ? `${base} ${isPt ? '(após concluir)' : '(after completion)'}`
      : base;
  }
  const dias = s.days;
  if (dias.length === 7) return isPt ? 'Todo dia' : 'Every day';
  if (dias.length === 0) return isPt ? 'Avulsa' : 'One-off';
  return dias.map(d => diasCurtos[d]).join(' · ');
}
import type { Schedule, HabitAnchor, Effort } from './types/taskModel';
import {
  createRestState, recordNight, dreamRarity, rollDream, collectDream, DREAM_CATALOG,
} from './utils/restWindow';
import type { Dream, RestWindow } from './utils/restWindow';

// ── SONO JOGÁVEL, BRINCAR E PASSOS ──────────────────────────────────────────
// Mesma disciplina do bloco acima: as regras moram nos módulos puros
// (`nightmares`, `petNeeds`, `steps`) e aqui só existe fiação.
import { NightmareBattle } from './components/NightmareBattle';
import { PlayCard } from './components/PlayCard';
import { StepsCard } from './components/StepsCard';
import {
  buildNightmareWave, hasPendingNightmare, markFought, nightmareDayKey, nightmaresFor,
  createNightmareState, type NightmareRewards,
} from './utils/nightmares';
import {
  play, canPlay, playedToday, activeBuff, minigameMultiplier, consumeBuff,
  tiredness, tirednessMessage, needsAttention,
} from './utils/petNeeds';
import {
  DEFAULT_STEP_GOAL, isStepsAvailable, hasStepsPermission, requestStepsPermission,
  readStepsToday, stepsDayKey,
} from './utils/steps';

/**
 * Categorias em que um passo pode CONFIRMAR o hábito que o usuário já marcou.
 *
 * O selo é confirmação, nunca pontuação: quem não tem sensor marca o hábito
 * exatamente igual, ganha exatamente a mesma comida e a mesma meta do dia —
 * só não vê o selo. Ver a regra 1 de `utils/steps.ts`.
 */
const STEP_VERIFIABLE: readonly ActivityCategory[] = ['Health', 'Fitness', 'Wellness'];

/**
 * Limiar do selo: METADE da meta de referência, e é DERIVADO dela de propósito
 * (`DEFAULT_STEP_GOAL` é o dono do número) — um limiar inventado aqui viraria
 * uma segunda meta que só quem tem sensor consegue enxergar. Modesto porque o
 * bônus é 1 comida: um limiar alto transformaria o selo numa meta corporal, que
 * é exatamente o que a Parte 3 do plano proíbe.
 */
const STEPS_VERIFIED_MIN = Math.round(DEFAULT_STEP_GOAL / 2);

/** Quanto tempo entre leituras do pedômetro (só com o app em foreground). */
const STEPS_POLL_MS = 5 * 60 * 1000;

/** Ritmo/estado vazios ESTÁVEIS (mesma razão do `EMPTY_RHYTHM`). */
const EMPTY_NIGHTMARES = createNightmareState();

const RestWindowCard = lazy(() => import('./components/RestWindowCard').then(m => ({ default: m.RestWindowCard })));
const DreamDex = lazy(() => import('./components/DreamDex').then(m => ({ default: m.DreamDex })));

/** Ritmo vazio ESTÁVEL para hábito sem histórico — um `emptyRhythm()` inline na
 *  prop cria objeto novo a cada render (mesmo motivo de `EMPTY_DECOR`). */
const EMPTY_RHYTHM = emptyRhythm();

/**
 * Registra a conclusão de um hábito NO MESMO DIA em que ela acontece.
 *
 * A virada do dia (`utils/dailyReset.ts`) já escreve faltas, escudos e a
 * conclusão de ONTEM — isto aqui não duplica aquilo: `completeHabit` é
 * idempotente por dayKey, então quando a virada reprocessar o mesmo dia ela não
 * acha nada para fazer. O que se ganha escrevendo agora é a única coisa que a
 * virada não pode dar: a pessoa marca o hábito e VÊ a constância mexer, em vez
 * de esperar até depois da meia-noite para descobrir se contou.
 *
 * O rendimento de atributo é o BÔNUS de maturidade (`attributeMultiplier`, de
 * `habitRhythm.ts`), e só ele: a base continua vindo da comida, como sempre
 * veio. Um hábito maduro rende MAIS, nunca menos — a "eficiência decrescente"
 * comum em jogos de idle ensinaria a abandonar exatamente o que o app quer
 * preservar. Hábito novo (tier semente) tem multiplicador 1, logo bônus zero:
 * ninguém ganha nada que já não ganhava.
 *
 * Função PURA sobre `prev`, para poder viver dentro de um updater sem violar o
 * footgun 6 (a celebração do marco fica fora, no chamador).
 */
function withHabitCompletion(
  prev: GameState,
  activityId: string,
  category: ActivityCategory,
  todayKey: string,
): GameState {
  const before = prev.habitRhythms?.[activityId] ?? EMPTY_RHYTHM;
  const after = completeHabit(before, todayKey);
  if (after === before) return prev; // já marcado hoje — nada a fazer

  const extra = attributeMultiplier(after.totalDone) - 1;
  const base = CATEGORY_ATTRIBUTES[category] ?? { virus: 0, data: 0, vaccine: 0 };
  const bonus = {
    virus: Math.round(base.virus * extra),
    data: Math.round(base.data * extra),
    vaccine: Math.round(base.vaccine * extra),
  };

  return {
    ...prev,
    habitRhythms: { ...(prev.habitRhythms ?? {}), [activityId]: after },
    virusPoints: prev.virusPoints + bonus.virus,
    dataPoints: prev.dataPoints + bonus.data,
    vaccinePoints: prev.vaccinePoints + bonus.vaccine,
    attributesSinceLastEvolution: {
      virus: (prev.attributesSinceLastEvolution?.virus ?? 0) + bonus.virus,
      data: (prev.attributesSinceLastEvolution?.data ?? 0) + bonus.data,
      vaccine: (prev.attributesSinceLastEvolution?.vaccine ?? 0) + bonus.vaccine,
    },
  };
}

/**
 * O marco (7/21/66 dias) que esta conclusão ACABOU de cruzar, ou `null`.
 *
 * Lido fora do updater, do estado que o handler já tem em mãos: `setGameState`
 * roda 2× no StrictMode, e uma celebração lá dentro tocaria duas vezes.
 */
function habitMilestoneOf(state: GameState, activityId: string, todayKey: string) {
  const before = state.habitRhythms?.[activityId] ?? EMPTY_RHYTHM;
  const after = completeHabit(before, todayKey);
  return milestoneReached(before.totalDone, after.totalDone);
}

const MILESTONE_TEXT: Record<string, { pt: string; en: string }> = {
  sprout: { pt: '🌿 7 dias! Este hábito virou broto.', en: '🌿 7 days! This habit is a sprout now.' },
  sapling: { pt: '🪴 21 dias! Este hábito está criando tronco.', en: '🪴 21 days! This habit is growing a trunk.' },
  tree: { pt: '🌳 66 dias! Este hábito virou parte de quem você é.', en: '🌳 66 days! This habit is part of who you are.' },
};

const EvolutionPath = lazy(() => import('./components/EvolutionPath').then(m => ({ default: m.EvolutionPath })));
const CreditsModal = lazy(() => import('./components/CreditsModal').then(m => ({ default: m.CreditsModal })));
const GameTutorialFlow = lazy(() => import('./components/GameTutorialFlow').then(m => ({ default: m.GameTutorialFlow })));
const CreateModal = lazy(() => import('./components/CreateModal').then(m => ({ default: m.CreateModal })));
const StatsPage = lazy(() => import('./components/StatsPage').then(m => ({ default: m.StatsPage })));
const SettingsPage = lazy(() => import('./components/SettingsPage').then(m => ({ default: m.SettingsPage })));
const ActivitiesPage = lazy(() => import('./components/ActivitiesPage').then(m => ({ default: m.ActivitiesPage })));
const SoulmonOnboarding = lazy(() => import('./components/SoulmonOnboarding').then(m => ({ default: m.SoulmonOnboarding })));
const SettingsModal = lazy(() => import('./components/SettingsModal').then(m => ({ default: m.SettingsModal })));
const EditModal = lazy(() => import('./components/EditModal').then(m => ({ default: m.EditModal })));
const TaskEditModal = lazy(() => import('./components/TaskEditModal').then(m => ({ default: m.TaskEditModal })));
const OraclePage = lazy(() => import('./components/OraclePage').then(m => ({ default: m.OraclePage })));
const TournamentPage = lazy(() => import('./components/TournamentPage').then(m => ({ default: m.TournamentPage })));
const LibraryPage = lazy(() => import('./components/LibraryPage').then(m => ({ default: m.LibraryPage })));
const ShopModal = lazy(() => import('./components/ShopModal').then(m => ({ default: m.ShopModal })));
const PetPage = lazy(() => import('./components/PetPage').then(m => ({ default: m.PetPage })));

type ViewType = 'main' | 'evolution' | 'stats' | 'pet' | 'settings' | 'games' | 'oracle' | 'tournament' | 'library' | 'shop';

export default function App() {
  const { gameState, setGameState } = useGameState();
  const [showIntro, setShowIntro] = useState(true);
  const [currentView, setCurrentView] = useState<ViewType>('main');
  // Id estável de comunidade (Tournament/Biblioteca) — mesmo id do cloud save.
  // Vira o hash do e-mail assim que o onboarding cadastra um (ver
  // handleCompleteOnboarding) — daí o setter, ao contrário do resto do app
  // que troca de identidade via reload.
  const [saveId, setSaveId] = useState(() => {
    let id = readLocal(STORAGE_KEYS.SAVE_ID);
    // Identidade do save: se nao persistir, o jogador vira outra pessoa a cada
    // abertura. E o caso mais grave que existe - a falha AVISA.
    if (!id) { id = crypto.randomUUID(); writeLocal(STORAGE_KEYS.SAVE_ID, id); }
    return id;
  });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [taskEditModalOpen, setTaskEditModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [evolveModalStage, setEvolveModalStage] = useState<string | null>(null);
  // Cerimônia de evolução manual (botão sobre o pet) — {from,to} enquanto aberta
  const [evolutionCeremony, setEvolutionCeremony] = useState<{ from: string; to: string } | null>(null);
  // Leitura do ritmo de cuidado (utils/carePattern.ts): alimenta a vitrine em
  // Estatísticas e desempata o galho na evolução. useMemo porque percorre o
  // histórico e o CompanionHUD é memo().
  const carePatternReading = useMemo(
    // `careHistory` junta tarefas avulsas + atividades recorrentes: sem o log
    // de atividades o ritmo fica cego justamente para o mecanismo principal de
    // hábito do app. É a MESMA função usada pela cerimônia de evolução — a
    // previsão e a decisão não podem ler históricos diferentes.
    () => computeCarePattern(careHistory(gameState)),
    [gameState.completedTasks, gameState.activityLog],
  );
  const [guideModalOpen, setGuideModalOpen] = useState(false);
  // Loja — fica fora do minigame: modal próprio, não uma view (ver BottomNav).
  // Créditos (monetização) — modal próprio, aberto pelo menu sanduíche.
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [resetOnboardingOpen, setResetOnboardingOpen] = useState(false);
  const [hpBannerDismissed, setHpBannerDismissed] = useState(false);
  /* Etapas na Home nascem RECOLHIDAS (G1): uma atividade de 4 etapas ocupava 5
     linhas e comia sozinha a dobra. Estado de VISTA, não de jogo — de propósito
     fora do GameState, para não virar cloud save a cada toque. */
  const [expandedRituals, setExpandedRituals] = useState<Record<string, boolean>>({});
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
  const [isSleeping, setIsSleeping] = useState(() => readFlag(STORAGE_KEYS.IS_SLEEPING));
  // Feeding is limited to 5 per rolling hour; timestamps persist across app close.
  const feedTimesRef = useRef<number[]>(
    readJson<number[]>(STORAGE_KEYS.FOOD_FEED_TIMES, [])
  );
  // Bumped when a feed is refused for being full → pet says it's full.
  const [fullSignal, setFullSignal] = useState(0);
  // Daily report: shown once per day, on the first open after the reset ran.
  const [showDailyReport, setShowDailyReport] = useState(false);

  // ── Os rituais do motor de tarefas (utils/rituals.ts) ─────────────────────
  // Check-in matinal: no MÁXIMO 1× por dia (`lastCheckInDate` no save) e
  // pulável sem culpa. O plano é congelado em estado ao abrir, e não recalculado
  // a cada render, para a lista de sugestões não trocar debaixo do dedo.
  const [checkInPlanData, setCheckInPlanData] = useState<ReturnType<typeof checkInPlan> | null>(null);
  // "Arrumar a pilha": a fila também é congelada ao abrir — ela encolhe a cada
  // decisão, e recalcular ao vivo faria o contador "3 de 8" mentir.
  const [triageTasks, setTriageTasks] = useState<Task[] | null>(null);
  // O sonho da manhã. NUNCA aparece à noite (ver o efeito lá embaixo).
  const [morningDream, setMorningDream] = useState<{ dream: Dream | null; isNew: boolean } | null>(null);
  // Recomeço de segunda/dia 1: cartão discreto, dispensável nesta sessão sem
  // gravar nada — recusar um convite não é uma decisão que mereça memória.
  const [freshStartDismissed, setFreshStartDismissed] = useState(false);
  // O COMBATE do pesadelo: a outra face da mesma noite que rendeu o sonho.
  // Também só de manhã, também nunca à noite (ver o efeito lá embaixo).
  const [nightmareOpen, setNightmareOpen] = useState(false);
  // Passos: `null` = ainda não perguntei ao aparelho. Na PWA vira `false` e
  // nada de passos aparece em lugar nenhum (a camada já degrada sozinha).
  const [stepsAvailable, setStepsAvailable] = useState<boolean | null>(null);
  const [stepsPermission, setStepsPermission] = useState(false);
  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    return readJson<AISettings>(STORAGE_KEYS.AI_SETTINGS, {
      tone: 'casual',
      emojiIntensity: 'medium',
      motivationStyle: 'balanced',
      customKeywords: '',
      temperature: 0.85,
    });
  });
  // Idioma inicial resolvido em utils/i18n.ts (mesma função usada no
  // onboarding, para as duas telas nunca discordarem).
  const [language, setLanguage] = useState<Language>(
    () => resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)),
  );
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(() => {
    return readFlag(STORAGE_KEYS.ONBOARDING_COMPLETE);
  });
  // Segundo onboarding: tutorial do jogo (estilo RPG) + criação obrigatória
  // da 1ª tarefa — mostrado uma vez, logo após o ritual de nascimento.
  const [hasCompletedTutorial, setHasCompletedTutorial] = useState(() => {
    if (readFlag(STORAGE_KEYS.TUTORIAL_COMPLETE)) return true;
    // Adoção automática pra quem já jogava antes desse gate existir — jamais
    // interromper um jogador estabelecido com a tela de "crie sua 1ª tarefa".
    const saveAntigo = readJson<Record<string, any> | null>(STORAGE_KEYS.GAME_STATE, null);
    if (saveAntigo && ((saveAntigo.activities?.length ?? 0) > 0 || (saveAntigo.tasks?.length ?? 0) > 0
      || (saveAntigo.completedTasks?.length ?? 0) > 0 || (saveAntigo.perfectDays ?? 0) > 0)) {
      // Marca de "ja passou pelo tutorial": no pior caso ele reaparece uma vez.
      writeFlag(STORAGE_KEYS.TUTORIAL_COMPLETE, true, { silent: true });
      return true;
    }
    return false;
  });
  const [userName, setUserName] = useState(() => {
    return readLocal(STORAGE_KEYS.USER_NAME) || '';
  });
  const [showFirstTaskPopup, setShowFirstTaskPopup] = useState(false);
  const [hasShownFirstTaskPopup, setHasShownFirstTaskPopup] = useState(() => {
    if (readFlag(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN)) return true;
    // Auto-mark for established users (have completed-task history or activity stats)
    const saveAntigo = readJson<Record<string, any> | null>(STORAGE_KEYS.GAME_STATE, null);
    if (saveAntigo && ((saveAntigo.completedTasks?.length ?? 0) > 0
      || Object.keys(saveAntigo.activityStats ?? {}).length > 0 || (saveAntigo.perfectDays ?? 0) > 0)) {
      writeFlag(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, true, { silent: true });
      return true;
    }
    return false;
  });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(() => {
    return readFlag(STORAGE_KEYS.NOTIFICATIONS_ENABLED);
  });

  // Presentes de amigos (Biblioteca): reivindica bits pendentes ao abrir o app.
  useEffect(() => {
    getGifts(saveId, true).then(({ gifts }) => {
      if (!gifts.length) return;
      const total = gifts.reduce((sum, g) => sum + g.bits, 0);
      setGameState(prev => ({ ...prev, gamePoints: (prev.gamePoints ?? 0) + total }));
      toast.success(
        language === 'pt-BR'
          ? `Você recebeu ${total} Bits de amigos!`
          : `You received ${total} Bits from friends!`,
      );
    }).catch(() => {});
    getPendingTrophies(saveId, true).then(({ trophies }) => {
      if (!trophies.length) return;
      setGameState(prev => ({ ...prev, trophies: [...(prev.trophies ?? []), ...trophies] }));
      const place = trophies[0].place;
      toast.success(
        language === 'pt-BR'
          ? `Torneio: você ficou em ${place}º lugar na season ${trophies[0].season}!`
          : `Tournament: you placed #${place} in season ${trophies[0].season}!`,
      );
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveId]);

  useEffect(() => {
    // Personalidade da IA: preferencia. Falhar reverte ao padrao. Silencioso.
    writeJson(STORAGE_KEYS.AI_SETTINGS, aiSettings, { silent: true });
  }, [aiSettings]);

  useEffect(() => {
    writeFlag(STORAGE_KEYS.NOTIFICATIONS_ENABLED, notificationsEnabled, { silent: true });
  }, [notificationsEnabled]);

  // Retorno do link de acesso por e-mail: se o app abriu a partir dele,
  // conclui o login antes de qualquer chamada de API (as rotas de save e
  // dinheiro passam a exigir o token). Ver src/utils/auth.ts.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const {
        isAuthConfigured, isPendingLoginLink, completeLoginFromLink, startDesktopAuthBridge,
      } = await import('./utils/auth');
      // Quando esta página roda dentro do app de desktop, ela é quem autentica
      // o overlay da barra de tarefas (ver docs/PLANO-DESKTOP-STEAM.md, 2c).
      void startDesktopAuthBridge();
      if (!isAuthConfigured() || !(await isPendingLoginLink())) return;
      const res = await completeLoginFromLink();
      if (cancelled || !res.ok || !res.email) return;
      // O saveId é derivado do e-mail agora COMPROVADO — realinha e recarrega
      // para o estado inteiro vir da conta certa.
      const { emailToSaveId, cloudLoad, adoptCloudSave } = await import('./utils/cloudSave');
      const id = await emailToSaveId(res.email);
      // Se já existe save nesse e-mail, `adoptCloudSave` grava o DADO antes da
      // identidade — a ordem inversa (identidade primeiro) com storage cheio
      // deixava o app apontado para um save que nunca chegou, e o próximo
      // cloud save subia o estado local antigo por cima do save do outro
      // aparelho (rodada 4, §3). Este call site tinha escapado daquele fix.
      const existente = await cloudLoad(id);
      if (cancelled) return;
      if (existente) {
        if (adoptCloudSave(id, existente, res.email) !== 'ok') return;
      } else {
        // Conta nova: o save local é que vai subir. Só troca a identidade se
        // ela realmente persistiu; senão o reload voltaria ao id antigo.
        if (!writeLocal(STORAGE_KEYS.SAVE_ID, id)) return;
        writeLocal(STORAGE_KEYS.USER_EMAIL, res.email);
      }
      window.location.reload();
    })();
    return () => { cancelled = true; };
  }, []);

  // Pedido de e-mail adiado: só aparece quando já existe progresso que doeria
  // perder. Quem não deu e-mail no onboarding joga local — sem isso, uma
  // reinstalação apagaria tudo em silêncio.
  const [protectPrompt, setProtectPrompt] = useState<'evolution' | 'streak' | null>(null);

  // Desbloqueio completo DENTRO do jogo (ver UnlockAccountModal.tsx). Só abre
  // por toque do usuário; `upgradeRitual` é o ritual do oráculo que roda
  // DEPOIS da compra, para quem entrou pelo caminho grátis e agora tem direito
  // à criatura própria.
  const [unlockReason, setUnlockReason] = useState<UnlockReason | null>(null);
  const [upgradeRitual, setUpgradeRitual] = useState(false);
  // Booleanos, e não os arrays: dependendo de `unlockedEvolutions`/
  // `completedTasks` o efeito re-rodava a cada setGameState (a identidade do
  // array muda sempre), reiniciando o timer abaixo antes de ele disparar — o
  // pedido nunca aparecia.
  const jaEvoluiu = (gameState.unlockedEvolutions?.length ?? 0) > 1;
  const jaEngajou = (gameState.completedTasks?.length ?? 0) >= 5;
  useEffect(() => {
    if (!hasCompletedOnboarding || !hasCompletedTutorial) return;
    if (readLocal(STORAGE_KEYS.USER_EMAIL)) return;   // já protegido
    // Um pedido por semana, no máximo: insistir todo dia vira ruído.
    const last = readNumber(STORAGE_KEYS.PROTECT_PROMPT_AT, 0);
    if (Date.now() - last < 7 * 24 * 3600_000) return;
    if (!jaEvoluiu && !jaEngajou) return;

    // Espera o app assentar antes de aparecer. Na abertura já disputam espaço o
    // pedido de notificação e o relatório diário — dois modais empilhados é
    // confuso, e o de cima rouba o clique do de baixo (visto em teste).
    const t = window.setTimeout(() => {
      if (readLocal(STORAGE_KEYS.USER_EMAIL)) return;
      setProtectPrompt(jaEvoluiu ? 'evolution' : 'streak');
    }, 15_000);
    return () => window.clearTimeout(t);
  }, [hasCompletedOnboarding, hasCompletedTutorial, jaEvoluiu, jaEngajou]);

  const dismissProtectPrompt = useCallback(() => {
    // So adia o proximo pedido; falhar faz o pedido voltar antes. Silencioso.
    writeLocal(STORAGE_KEYS.PROTECT_PROMPT_AT, String(Date.now()), { silent: true });
    setProtectPrompt(null);
  }, []);

  /** Passa o save local para a identidade do e-mail e sobe pra nuvem. */
  const handleProtectProgress = useCallback(async (email: string) => {
    const { emailToSaveId, cloudLoad, cloudSave, adoptCloudSave } = await import('./utils/cloudSave');
    const newSaveId = await emailToSaveId(email);

    // Já existe um Soulmon nesse e-mail (outro aparelho): adota em vez de
    // sobrescrever — apagar o save antigo de alguém seria bem pior do que
    // perder o progresso local recente.
    const existing = await cloudLoad(newSaveId);
    if (existing) {
      // `adoptCloudSave` grava o SAVE antes da identidade e nunca lança: com o
      // storage cheio, trocar o id sem o dado faria o próximo cloud save subir
      // o estado local antigo por cima do save do outro aparelho.
      if (adoptCloudSave(newSaveId, existing, email) !== 'ok') {
        toast.error(language === 'pt-BR'
          ? 'Não consegui carregar o progresso deste e-mail neste aparelho. Nada foi alterado.'
          : "Couldn't load this email's progress on this device. Nothing was changed.");
        return;
      }
      writeLocal(STORAGE_KEYS.PROTECT_PROMPT_AT, String(Date.now()));
      window.location.reload();
      return;
    }
    writeLocal(STORAGE_KEYS.USER_EMAIL, email);
    writeLocal(STORAGE_KEYS.SAVE_ID, newSaveId);
    writeLocal(STORAGE_KEYS.PROTECT_PROMPT_AT, String(Date.now()));
    await cloudSave(newSaveId, gameState);
    setSaveId(newSaveId);
    setProtectPrompt(null);
    toast(language === 'pt-BR' ? 'Progresso salvo na nuvem!' : 'Progress saved to the cloud!');
  }, [gameState, language]);

  // Sincroniza tier/créditos com o SERVIDOR ao abrir e ao trocar de save. O
  // que estiver no localStorage é só espelho — se alguém editou à mão, isto
  // sobrescreve com a verdade. Offline mantém o espelho (o servidor recusa
  // qualquer gasto mesmo assim, então não dá pra gastar o que não existe).
  useEffect(() => {
    let cancelled = false;
    fetchEntitlement().then(ent => {
      if (cancelled || !ent) return;
      setGameState(prev => (prev.credits === ent.credits && prev.accountTier === ent.tier)
        ? prev
        : { ...prev, credits: ent.credits, accountTier: ent.tier });
    });
    return () => { cancelled = true; };
  }, [saveId, setGameState]);

  // Detect when food items are added to inventory
  const prevInventoryTotalRef = useRef(
    Object.values(gameState.foodInventory).reduce((s, n) => s + n, 0)
  );
  useEffect(() => {
    const total = Object.values(gameState.foodInventory).reduce((s, n) => s + n, 0);
    if (total > prevInventoryTotalRef.current) setNewItemsReady(true);
    prevInventoryTotalRef.current = total;
  }, [gameState.foodInventory]);

  useCareSystem({
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
  });

  const { dailyTotal, dailyDone, progress } = useProgressTracking(gameState);
  // Quantos itens de HOJE evitam a perda de coração na virada — regra única em
  // `utils/dailyReset.ts`, derivada da própria fórmula da perda.
  const hpSafeToday = tasksToAvoidHeartLoss(gameState, new Date().getDay(), new Date().toDateString());

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
      if (leveledUp) setEvolveModalStage(gameState.evolutionStage);
    }
  }, [gameState.evolutionStage]);

  // Sync game state to Android home screen widget
  useEffect(() => {
    const petName = gameState.evolutionStage.charAt(0).toUpperCase() + gameState.evolutionStage.slice(1);
    DigiWidget.updateWidgetData({
      // Chave do bridge nativo, NÃO renomeada de propósito (mesma lógica das
      // chaves `digiapp_*` do localStorage): o APK instalado lê `digimonName`
      // no Kotlin, e o app carrega a URL de produção — trocar aqui quebraria o
      // widget de quem não atualizasse o APK.
      digimonName: petName,
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

  /**
   * A fatia que `utils/petNeeds.ts` lê. `hasPoop` é DERIVADO (o dono do cocô é
   * o sistema de cuidado), e o resto vem do save como está.
   */
  const petNeedsView = {
    ...gameState,
    hasPoop: (gameState.poopEventsShown || []).some(
      i => !(gameState.poopEventsCompleted || []).includes(i),
    ),
  };

  /**
   * CANSAÇO DERIVADO — e ele é **só cosmético/narrativo**.
   *
   * Nunca reduz recompensa, nunca trava ação, nunca entra em dia perfeito, HP
   * ou evolução: quem aparece 'tired' é exatamente quem trabalhou demais ou
   * dormiu fora de hora, e cobrar dessa pessoa seria punir quem mais precisa de
   * acolhimento. O pet sonolento existe para o dono se VER, não para pagar.
   */
  const tirednessLevel = tiredness(petNeedsView, new Date());

  // Determine companion mood based on progress
  const getCompanionMood = (): 'idle' | 'happy' | 'tired' => {
    // Sonolento é EXPRESSÃO, não estado de jogo — só muda a carinha.
    if (tirednessLevel === 'tired') return 'tired';
    if (progress >= 60) return 'happy'; // Fica feliz mais fácil
    if (progress <= 15) return 'tired'; // Só fica cansado se MUITO baixo (antes era 30%)
    return 'idle';
  };

  // Get companion message based on progress and HP
  const getCompanionMessage = (): string => {
    if (gameState.healthPoints <= 1) {
      return t.main.companionNeedHelp;
    }
    // UMA sugestão de cada vez (`needsAttention` devolve no máximo um item) —
    // nunca um painel de pendências, que é a fatura do Habitica. Nenhuma delas
    // tem contador nem vira penalidade se for ignorada.
    const wish = needsAttention(petNeedsView, new Date())[0];
    if (wish) return language === 'pt-BR' ? wish.pt : wish.en;
    // Sem nada a sugerir, o pet fala do próprio sono. 'tired' é cumplicidade
    // ("a gente descansa junto"), nunca diagnóstico.
    if (tirednessLevel !== 'normal') return tirednessMessage(tirednessLevel, language);
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

  // Nome de exibição de uma forma: procura na árvore ÚNICA do jogador
  // (gameState.soulmonStages, gerada pelo oráculo no onboarding). Sem árvore
  // ainda (save antigo/reset) cai pro nível capitalizado como fallback seguro.
  const getStageNameById = (stageId: string): string => {
    const match = gameState.soulmonStages?.find(s => creatureFormId(s) === stageId);
    if (match) return match.name;
    return stageId.charAt(0).toUpperCase() + stageId.slice(1);
  };

  const getCurrentStageName = (): string => getStageNameById(gameState.evolutionStage);

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

  // Limiar de XP do próximo nível. O switch anterior listava espécies que não
  // existem mais na árvore (a árvore nasce em rookie e os ids carregam o nível
  // no prefixo), então TODO estágio caía no default — a barra mostrava sempre o
  // mesmo alvo. Agora o alvo sai do nível de verdade.
  const getNextLevelXP = (): number => {
    const level = getStageLevel(gameState.evolutionStage);
    return XP_BY_LEVEL[level];
  };

  /**
   * Celebra o marco de maturidade do hábito, se esta conclusão cruzou um.
   *
   * Os cortes são 7/21/66 dias EFETIVOS (Lally et al., 2010 — mediana real de
   * 66 dias até a automaticidade), não os "21 dias" populares, que vêm de um
   * cirurgião plástico de 1960. `milestoneReached` só responde uma vez por
   * corte, então a festa não repete a cada reload.
   */
  const celebrateHabitMilestone = useCallback((activityId: string, name: string, todayKey: string) => {
    const tier = habitMilestoneOf(gameState, activityId, todayKey);
    if (!tier) return;
    const text = MILESTONE_TEXT[tier];
    if (!text) return;
    playEvolve();
    setMessageTrigger(prev => prev + 1);
    toast.success(`${name} — ${language === 'pt-BR' ? text.pt : text.en}`);
  }, [gameState, language]);

  const handleUpdateStep = (activityId: string, stepId: string) => {
    const activity = gameState.activities.find(a => a.id === activityId);
    const step = activity?.steps.find(s => s.id === stepId);

    // Completed steps cannot be unchecked — only daily reset restores them
    if (step?.completed) return;

    // Esta etapa fecha a atividade? Calculado FORA do updater, para o resumo de
    // ganhos não depender de ler estado de dentro dele (StrictMode roda o
    // updater 2×).
    const justFinishedActivity =
      activity && activity.steps.every(s => s.completed || s.id === stepId) ? activity : null;

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

        // Concluir a última etapa rende a comida da categoria. (Ramo morto de
        // "estágio inicial ganha energia" removido — a árvore nasce em rookie.)
        let newFoodInventory = prev.foodInventory;
        let newActivityLog = prev.activityLog ?? [];
        if (isFullyCompleted && updatedActivity) {
          const food = FOOD_BY_CATEGORY[updatedActivity.category as keyof typeof FOOD_BY_CATEGORY];
          if (food) {
            newFoodInventory = {
              ...prev.foodInventory,
              [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1,
            };
          }
          newActivityLog = [...newActivityLog, new Date().toISOString()].slice(-ACTIVITY_LOG_CAP);
        }

        const next: GameState = {
          ...prev,
          activities: updatedActivities,
          activityStats: newActivityStats,
          foodInventory: newFoodInventory,
          activityLog: newActivityLog,
        };

        // Um hábito de etapas fecha na ÚLTIMA etapa — a constância dele precisa
        // ser alimentada aqui também, senão só os hábitos sem etapas contariam.
        return isFullyCompleted && updatedActivity
          ? withHabitCompletion(next, activityId, updatedActivity.category, new Date().toDateString())
          : next;
      });

      playTaskComplete();
      if (justFinishedActivity) {
        queueMicrotask(() => announceTaskGains(gameState, justFinishedActivity.category));
        celebrateHabitMilestone(
          justFinishedActivity.id, justFinishedActivity.name, new Date().toDateString(),
        );
        // Selo de "verificado": o hábito de saúde JÁ contou; os passos só
        // confirmam e rendem uma comida a mais. Sem sensor, nada muda.
        grantStepsVerified(justFinishedActivity.category);
      }

      // Check if this is the first task/step ever completed and show popup
      if (!hasShownFirstTaskPopup) {
        // Check if ANY step has been completed before this one
        const anyStepCompleted = gameState.activities.some(a =>
          a.steps.some(s => s.completed && s.id !== stepId)
        ) || gameState.tasks.some(t => t.completed);

        if (!anyStepCompleted) {
          setShowFirstTaskPopup(true);
          setHasShownFirstTaskPopup(true);
          writeFlag(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, true, { silent: true });
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

      // Concluir atividade rende a comida da categoria. (O ramo antigo de
      // "estágio inicial ganha energia direto" saiu: a árvore nasce em rookie,
      // então getStageLevel nunca devolvia os estágios de ovo/bebê e ele era inalcançável
      // — o mesmo ramo morto que já tinha sido removido do caminho das tarefas.)
      let newFoodInventory = prev.foodInventory;
      let newActivityLog = prev.activityLog ?? [];
      if (newCompletedState && activity) {
        const food = FOOD_BY_CATEGORY[activity.category as keyof typeof FOOD_BY_CATEGORY];
        if (food) {
          newFoodInventory = {
            ...prev.foodInventory,
            [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1,
          };
        }
        // Registra a conclusão para o ritmo de cuidado enxergar atividades —
        // `completedTasks` só recebe tarefas avulsas, e `lastCompletedDate`
        // some na virada do dia.
        newActivityLog = [...newActivityLog, new Date().toISOString()].slice(-ACTIVITY_LOG_CAP);
      }

      const next: GameState = {
        ...prev,
        activities: updatedActivities,
        activityStats: newActivityStats,
        foodInventory: newFoodInventory,
        activityLog: newActivityLog,
      };

      // A constância do hábito é alimentada NO MESMO DIA (ver
      // `withHabitCompletion`), e não só na virada — senão marcar o hábito não
      // move nada visível até depois da meia-noite.
      return newCompletedState
        ? withHabitCompletion(next, activityId, activity.category, today)
        : next;
    });

    // Mesmo resumo das tarefas: uma ação, várias barras. Fora do updater porque
    // efeito colateral dentro de setGameState roda 2× no StrictMode.
    if (activity) queueMicrotask(() => announceTaskGains(gameState, activity.category));

    // Marco de maturidade (7/21/66 dias de Lally et al.) — celebra UMA vez, no
    // dia em que o corte é cruzado. Fora do updater pelo mesmo motivo.
    if (activity && !(activity.completedToday && activity.lastCompletedDate === today)) {
      celebrateHabitMilestone(activity.id, activity.name, today);
      // Ver `grantStepsVerified`: confirmação, nunca pontuação.
      grantStepsVerified(activity.category);
    }

    // Check if this is the first task ever completed and show popup
    if (!hasShownFirstTaskPopup) {
      const anyTaskCompleted = gameState.activities.some(a =>
        a.steps.some(s => s.completed)
      ) || gameState.tasks.some(t => t.completed);

      if (!anyTaskCompleted) {
        setShowFirstTaskPopup(true);
        setHasShownFirstTaskPopup(true);
        writeFlag(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, true, { silent: true });
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

  /**
   * Salva um hábito vindo do `EditModal`.
   *
   * `schedule` e `anchor` são REPASSADOS, e isso é o conserto principal daqui:
   * o modal já perguntava "3× por semana" e "depois do café da manhã", e este
   * handler montava o objeto campo a campo e jogava as respostas fora — o
   * usuário respondia e o app esquecia. `weekDays` continua sendo escrito ao
   * lado de `schedule` porque o widget Android e o app de desktop leem ELE, e
   * nenhum dos dois carrega o motor de recorrência novo.
   */
  const handleSaveActivity = (data: {
    name: string; category: string; emoji: string; steps: Step[];
    weekDays?: number[]; alarm?: { time: string };
    schedule?: Schedule; anchor?: HabitAnchor;
  }) => {
    if (editingActivity) {
      setGameState(prev => ({
        ...prev,
        activities: prev.activities.map(activity =>
          activity.id === editingActivity
            ? {
              ...activity,
              name: data.name,
              category: data.category as ActivityCategory,
              emoji: data.emoji,
              steps: data.steps,
              ...(data.weekDays ? { weekDays: data.weekDays } : {}),
              ...(data.alarm !== undefined ? { alarm: data.alarm } : {}),
              ...(data.schedule ? { schedule: data.schedule } : {}),
              ...(data.anchor !== undefined ? { anchor: data.anchor } : {}),
            }
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
        weekDays: data.weekDays ?? [0, 1, 2, 3, 4, 5, 6], // Available all days by default
        alarm: data.alarm,
        schedule: data.schedule,
        anchor: data.anchor,
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

    // Create the activity with custom points. `schedule` nasce junto de
    // `weekDays` (os dois dizendo a mesma coisa): um hábito criado pela IA sem
    // o campo novo cairia no `normalizeSchedule` de save antigo — funciona,
    // mas a lista mostraria "todo dia" sem que ninguém tenha decidido isso.
    const newActivity: Activity = {
      id: Date.now().toString(),
      name: activity.name,
      category,
      emoji,
      steps,
      weekDays: [0, 1, 2, 3, 4, 5, 6], // Available all days by default
      schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] },
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

  /**
   * Salva uma tarefa vinda do `TaskEditModal` (criação e edição).
   *
   * Os campos do contrato de EXECUÇÃO são repassados inteiros:
   *  - `effort` — a recompensa e a meta do dia escalam com ELE, nunca com a
   *    contagem de itens (é o defeito do Karma do Todoist);
   *  - `startDate` — o "When" do Things 3, separado do prazo: só ele traz a
   *    tarefa para o Hoje;
   *  - `createdAt`/`lastTouchedAt` — a idade da tarefa, que é o que `isHaunted`
   *    lê. Sem eles `daysStale` responde 0 e a tarefa nunca envelhece;
   *  - `status: 'open'` — o padrão explícito de uma tarefa viva.
   *
   * Na EDIÇÃO, `lastTouchedAt` anda: mexer na tarefa é uma decisão real sobre
   * ela, então ela não deve continuar assombrando por tempo parado.
   */
  const handleSaveTask = (data: {
    name: string; category: string; emoji: string;
    steps?: Step[];
    deadline?: { date: string; time: string };
    alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
    effort?: Effort; startDate?: string; lastTouchedAt?: string;
  }) => {
    const nowIso = new Date().toISOString();
    if (editingTask) {
      // Editing existing task
      setGameState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === editingTask
            ? {
              ...task,
              name: data.name,
              category: data.category as ActivityCategory,
              emoji: data.emoji,
              steps: data.steps,
              deadline: data.deadline,
              alarm: data.alarm,
              effort: data.effort ?? task.effort,
              startDate: data.startDate,
              createdAt: task.createdAt ?? nowIso,
              lastTouchedAt: data.lastTouchedAt ?? nowIso,
            }
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
        steps: data.steps,
        deadline: data.deadline,
        alarm: data.alarm,
        effort: data.effort,
        startDate: data.startDate,
        status: 'open',
        createdAt: nowIso,
        lastTouchedAt: data.lastTouchedAt ?? nowIso,
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

      /**
       * BÔNUS DE ALÍVIO — concluir uma tarefa ASSOMBRADA (vencida ou parada há
       * 7 dias, `isHaunted`) comemora mais alto e rende uma comida extra.
       *
       * É a peça mais Soulmon do plano: a pilha de atrasadas é a causa nº1
       * documentada de abandono da categoria, e em vez de pintá-la de vermelho
       * e cobrar, ela vira o conteúdo com a MAIOR recompensa do laço. Nada de
       * moeda nova nem regra nova — a recompensa é o alívio (fala + animação
       * que o app já tem) mais uma comida, que é exatamente o que concluir uma
       * tarefa já dá.
       *
       * Calculado FORA do updater: efeito colateral dentro de setGameState roda
       * 2× no StrictMode (footgun 6) e daria comida em dobro.
       */
      const relief = isHaunted(task, new Date());

      // Mark task as completed first
      setGameState(prev => ({
        ...prev,
        tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
      }));

      if (relief) {
        const food = FOOD_BY_CATEGORY[task.category];
        if (food) {
          setGameState(prev => ({
            ...prev,
            foodInventory: {
              ...prev.foodInventory,
              [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1,
            },
          }));
          setFeedAnim(prev => ({ emoji: food.emoji, n: (prev?.n ?? 0) + 1 }));
        }
        // O mesmo caminho de fala do resto do app — o pet reage, não um banner.
        setMessageTrigger(prev => prev + 1);
        toast(language === 'pt-BR'
          ? '👻 Você enfrentou uma tarefa assombrada! Seu Soulmon comemorou (e ganhou comida extra).'
          : '👻 You faced a haunted task! Your Soulmon cheered (and got extra food).');
      }

      // Check if this is the first task ever completed and show popup
      if (!hasShownFirstTaskPopup) {
        const anyStepCompleted = gameState.activities.some(a =>
          a.steps.some(s => s.completed)
        ) || gameState.tasks.some(t => t.completed && t.id !== taskId);

        if (!anyStepCompleted) {
          setShowFirstTaskPopup(true);
          setHasShownFirstTaskPopup(true);
          writeFlag(STORAGE_KEYS.FIRST_TASK_POPUP_SHOWN, true, { silent: true });
        }
      }

      // Depois de 3s: sai da lista, entra no histórico e vira comida. A
      // transição toda mora em utils/careRules.ts — o app de desktop marca
      // tarefa exatamente igual, e duas implementações divergiriam.
      //
      // (O ramo antigo de "estágio inicial dá energia em vez de comida" saiu:
      // a árvore do Soulmon não tem mais ovo/baby, então getStageLevel nunca
      // devolvia esses níveis e o ramo era inalcançável.)
      setTimeout(() => {
        setGameState(prev => {
          const next = completeTask(prev, taskId) ?? prev;
          if (next !== prev) queueMicrotask(() => announceTaskGains(prev, task.category));
          return next;
        });
      }, 3000);
    }
  };

  /**
   * "Uma ação, várias barras": concluir UMA tarefa avança várias coisas ao mesmo
   * tempo, e o jogador precisa VER isso num lugar só. É o que faz um km no
   * Pokémon GO valer a pena — ele avança ovo, companheiro, missão e recompensa
   * semanal de uma vez, e o jogo mostra tudo junto.
   *
   * Fica fora do updater de propósito: efeito colateral dentro de setGameState
   * roda 2× no StrictMode (footgun 6).
   */
  const announceTaskGains = useCallback((prev: GameState, category: ActivityCategory) => {
    const isPt = language === 'pt-BR';
    // Meta do dia: `dailyGoalFor`, nunca uma cópia da fórmula. Antes era
    // `min(activities.length + tasks.length, required)` — sem o filtro de dia
    // da semana que `computeDailyReset` aplica, então num sábado o toast
    // anunciava "2/4 do dia" para quem já tinha cumprido a meta real (2).
    const goal = dailyGoalFor(prev, new Date().getDay());
    const doneNow = prev.tasks.filter(t => t.completed).length
      + prev.activities.filter(a => a.completedToday).length;

    const food = FOOD_BY_CATEGORY[category];
    const parts = [
      isPt ? `${food?.emoji ?? '🍎'} +1 comida` : `${food?.emoji ?? '🍎'} +1 food`,
    ];
    if (goal > 0) {
      parts.push(isPt ? `📋 ${Math.min(doneNow, goal)}/${goal} do dia` : `📋 ${Math.min(doneNow, goal)}/${goal} today`);
    }
    if (goal > 0 && doneNow >= goal) {
      parts.push(isPt ? '⚡ falta encher a energia' : '⚡ energy left to fill');
    }
    toast(parts.join('  ·  '));
  }, [language]);

  const handleDeleteTask = useCallback((taskId: string) => {
    setGameState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== taskId),
    }));
  }, []);

  /**
   * Tira a tarefa da gaveta e devolve para a lista ativa.
   *
   * `restore` (taskTriage) atualiza o toque junto, senão a tarefa voltaria já
   * assombrada pelo tempo que passou guardada — o que puniria exatamente a
   * decisão saudável de ter guardado em vez de arrastar a culpa.
   */
  const handleRestoreTask = useCallback((taskId: string) => {
    const agoraLocal = new Date();
    setGameState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => (t.id === taskId ? restore(t, agoraLocal) : t)),
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

  const handleEvolve = useCallback(() => {
    setGameState(prev => {
      // Evolution padlock (Evolution page): while locked, never evolve.
      if (prev.evolutionLocked) return prev;
      // Evolução manual: só evolui com a barra de dias perfeitos cheia.
      const req = FORM_REQUIREMENTS[getStageLevel(prev.evolutionStage)].required;
      if (prev.perfectDays < req) return prev;
      let newEvolutionStage = prev.evolutionStage;
      let newHP = prev.healthPoints;
      let newSegmentsNeeded = prev.digivolutionSegmentsNeeded;

      // O galho vem dos atributos (que vêm da comida, e portanto da CATEGORIA
      // das tarefas). No EMPATE, quem decide é o padrão de cuidado do jogador —
      // antes isso era resolvido por uma ordem fixa no código (vírus, vacina,
      // dado), sem significado nenhum. É a ideia dos care mistakes do v-pet de
      // 97: o jeito como você cuidou define quem seu bicho vira, e nenhum jeito
      // é melhor que o outro. Ver utils/carePattern.ts.
      const newCurrentBranch = resolveBranch(
        { virus: prev.virusPoints, data: prev.dataPoints, vaccine: prev.vaccinePoints },
        // `careHistory(prev)`, não `prev.completedTasks`: a página de Evolução
        // prevê o galho com tarefas + activityLog, e ler só as tarefas aqui
        // fazia a cerimônia entregar um galho diferente do prometido.
        computeCarePattern(careHistory(prev)),
        prev.currentBranch,
      );

      newEvolutionStage = getNextEvolution(
        prev.evolutionStage,
        newCurrentBranch,
        prev.unlockedEvolutions,
      );
      newSegmentsNeeded = EVOLVE_SEGMENTS[getStageLevel(newEvolutionStage)] ?? newSegmentsNeeded;
      newHP = getMaxHPForStage(newEvolutionStage);

      return {
        ...prev,
        evolutionStage: newEvolutionStage,
        currentBranch: newCurrentBranch,
        healthPoints: newHP,
        maxHealthPoints: getMaxHPForStage(newEvolutionStage),
        digivolutionSegments: 0,
        digivolutionSegmentsNeeded: newSegmentsNeeded,
        perfectDays: 0,
        attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
        unlockedEvolutions: prev.unlockedEvolutions.includes(newEvolutionStage)
          ? prev.unlockedEvolutions
          : [...prev.unlockedEvolutions, newEvolutionStage],
      };
    });
    playEvolve();
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
        playEvolve();
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

    // Comida comum: a regra mora em utils/careRules.ts, compartilhada com o app
    // de desktop. Aqui ficam só os efeitos (som, animação, fala do pet).
    // Só a decisão de RECUSAR precisa acontecer fora do updater (ela dispara
    // fala/animação, que são efeitos colaterais — e efeito dentro de updater
    // roda 2× no StrictMode). A mutação em si vai no updater, sobre o `prev`.
    const now = Date.now();
    const before = recentFeeds(feedTimesRef.current, now);
    feedTimesRef.current = before;
    if ((gameState.foodInventory[foodEmoji] ?? 0) <= 0) return;
    if (before.length >= FOOD_LIMIT_PER_HOUR) {
      writeJson(STORAGE_KEYS.FOOD_FEED_TIMES, before);
      setFullSignal(n => n + 1); // pet says "I'm full"
      return;
    }
    const nextTimes = [...before, now];
    feedTimesRef.current = nextTimes;
    // Janela de 5 comidas/hora: regra de economia do jogo - a falha AVISA.
    writeJson(STORAGE_KEYS.FOOD_FEED_TIMES, nextTimes);

    playFeed();
    // `before` é a janela ANTES desta comida, então a regra horária aqui chega
    // à mesma conclusão da checagem acima.
    setGameState(prev => feedFood(prev, foodEmoji, before, now).state);
    setFeedAnim(prev => ({ emoji: foodEmoji, n: (prev?.n ?? 0) + 1 }));
  }, [gameState.foodInventory, gameState.healthPoints, gameState.maxHealthPoints, language]);

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
              ispt ? '🚽 Seu Soulmon está na sujeira!' : '🚽 Your Soulmon is in a mess!',
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
      writeFlag(STORAGE_KEYS.IS_SLEEPING, next, { silent: true });
      return next;
    });
    playSleep();
  }, []);

  // Dungeon: no daily cap — entry is blocked only at ≤1 heart (a loss costs a
  // real heart, so the player must be able to afford it). As long as HP allows,
  // they can go as often as they like. Returns the monthly difficulty + best.
  // A masmorra NÃO é mais gated por HP. Antes, perder custava 1 coração real e
  // não dava pra entrar com ≤1 coração — o que trancava fora do conteúdo
  // divertido justamente quem tinha tido uma semana ruim, e cada tentativa
  // aprofundava o buraco. É a mesma estrutura do encarecimento dos Remote Raid
  // Passes que custou jogadores ao Pokémon GO em 2023.
  //
  // O jogo nunca deve cobrar da barra que representa o cuidado que o usuário
  // teve consigo mesmo. O que está em jogo aqui é a própria run: perder custa os
  // bônus de andar, o Glitchtama e o placar. Se farmar Bits virar problema, a
  // alavanca é um custo de ENTRADA em Bits — não o retorno do custo em corações.
  const handleDungeonEnter = useCallback((): { ok: true; level: number; best: number } => {
    return { ok: true, level: getDungeonDifficulty(), best: getDungeonBest() };
  }, []);

  // Perder encerra a run e não toca no HP. (A contabilidade de placar/dificuldade
  // vive no componente do jogo, via utils/dungeon.)
  const handleDungeonLose = useCallback(() => {}, []);

  // Heart item can drop in the dungeon (capped per day). Adds it to the Items
  // folder and returns whether one dropped. The dungeon no longer drops food.
  const handleDungeonHeartDrop = useCallback((): boolean => {
    // Sortudo (utils/passives.ts) acha coraçãozinho com mais frequência.
    if (!rollDungeonHeartDrop(heartDropBonus(gameState.petPassive))) return false;
    setGameState(prev => ({
      ...prev,
      foodInventory: { ...prev.foodInventory, [HEART_ITEM_EMOJI]: (prev.foodInventory[HEART_ITEM_EMOJI] ?? 0) + 1 },
    }));
    return true;
  }, [gameState.petPassive]);

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
    dinoBest: Math.max(gameState.dinoBest ?? 0, readNumber(STORAGE_KEYS.DINO_BEST, 0)),
    totalPerfectDays: gameState.totalPerfectDays ?? 0,
  };
  const missionProgress = getMissionProgress(missionState);

  /**
   * O buff de brincar já foi gasto NESTA sessão de minijogo?
   *
   * Existe porque uma run de Masmorra credita Bits VÁRIAS vezes (por inimigo e
   * por andar) dentro do mesmo tick de render: sem esta trava, `gameState`
   * ainda traria o buff nas chamadas seguintes e o +20% seria aplicado de novo
   * a cada inimigo. Volta a `false` quando uma brincadeira nova concede o buff.
   */
  const playBuffSpentRef = useRef(false);

  // 🪙 Bits — minigame currency; accumulates in GameState (cloud-synced), spent in the shop.
  // O buff de BRINCAR (utils/petNeeds.ts) é consumido AQUI, que é o funil único
  // por onde passam os Bits de Dino, PPT e Masmorra. `minigameMultiplier` é
  // sempre ≥ 1 por construção — este caminho não tem como reduzir ganho.
  const handleEarnGamePoints = useCallback((pts: number) => {
    if (pts <= 0) return;
    const mult = playBuffSpentRef.current ? 1 : minigameMultiplier(gameState, new Date());
    const total = mult > 1 ? Math.round(pts * mult) : pts;
    setGameState(prev => {
      // Gasta o buff junto do crédito: assim ele nunca sobrevive ao minijogo
      // que ele bonificou. `consumeBuff` mantém `playLog.date` (1×/dia segue
      // de pé). O spread vem ANTES do `gamePoints` — invertido, o estado
      // devolvido por `consumeBuff` sobrescreveria os Bits recém-creditados.
      const base = mult > 1 ? consumeBuff(prev) : prev;
      return { ...base, gamePoints: (base.gamePoints ?? 0) + total };
    });
    if (mult > 1) {
      // Fora do updater (footgun 6): no StrictMode ele roda 2×.
      playBuffSpentRef.current = true;
      toast(language === 'pt-BR'
        ? `🎈 A brincadeira rendeu: +${total - pts} Bits extras!`
        : `🎈 Playtime paid off: +${total - pts} bonus Bits!`);
    }
  }, [gameState, language, setGameState]);

  /**
   * BRINCAR — oferta, nunca obrigação (a regra inteira é de `utils/petNeeds.ts`).
   *
   * A recusa (`refused`) é uma frase carinhosa do pet, JAMAIS um erro vermelho:
   * "já brincamos hoje" e "falta energia" não são falhas do usuário, são a
   * oferta não estar de pé agora. Quem não brincou não perdeu nada — brincar
   * não entra em dia perfeito, HP nem evolução.
   */
  const handlePlay = useCallback(() => {
    const now = new Date();
    const todayKey = dayKeyOf(now);
    const preview = play(gameState, todayKey, now);
    if (preview.refused) {
      const isPt = language === 'pt-BR';
      toast(preview.refused === 'already-played'
        ? (isPt ? '🎈 Já brincamos hoje! Amanhã tem mais.' : '🎈 We already played today! More tomorrow.')
        : (isPt ? '🎈 Uma comidinha primeiro, aí a gente brinca.' : '🎈 A snack first, then we play.'));
      setMessageTrigger(prev => prev + 1);
      return;
    }
    setGameState(prev => play(prev, todayKey, now).state);
    playFeed();
    playBuffSpentRef.current = false; // buff novo, pronto para o próximo minijogo
    setMessageTrigger(prev => prev + 1);
  }, [gameState, language, setGameState]);

  // 🛒 Shop purchase — charges points and applies the item's effect. Items can
  // be locked behind a mission (utils/shop.ts `unlock`).
  /**
   * Troca Créditos por Bits. O gasto de Crédito é do SERVIDOR (é dinheiro
   * real); os Bits só entram depois que ele confirma. A troca inversa não
   * existe — ver utils/currencies.ts.
   */
  const handleExchangeCredits = useCallback(async (creditos: number): Promise<boolean> => {
    const pack = BITS_EXCHANGE.find(p => p.credits === creditos);
    if (!pack) return false;
    const ent = await spendCredits(pack.credits, 'exchange-bits');
    if (!ent) {
      toast(language === 'pt-BR' ? 'Créditos insuficientes.' : 'Not enough credits.');
      return false;
    }
    setGameState(prev => ({
      ...prev,
      gamePoints: (prev.gamePoints ?? 0) + pack.bits,
      credits: ent.credits,
      accountTier: ent.tier,
    }));
    toast(language === 'pt-BR' ? `+${pack.bits} Bits!` : `+${pack.bits} Bits!`);
    return true;
  }, [language, setGameState]);

  const handleShopBuy = useCallback((itemId: string): boolean => {
    const item = ALL_SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) return false;
    if (!isShopItemUnlocked(item, missionProgress)) return false;
    // Cada item cobra na SUA moeda — Emblemas (torneio) e Bits (minijogos)
    // não se substituem (ver utils/currencies.ts).
    const paysWithEmblems = item.currency === 'emblems';
    const saldo = paysWithEmblems ? (gameState.emblems ?? 0) : (gameState.gamePoints ?? 0);
    if (saldo < item.price) return false;
    if (item.kind === 'bg' && (gameState.ownedBackgrounds ?? []).includes(item.id)) return false;
    if (item.kind === 'furniture' && (gameState.ownedFurniture ?? []).includes(item.id)) return false;

    setGameState(prev => {
      const next = paysWithEmblems
        ? { ...prev, emblems: (prev.emblems ?? 0) - item.price }
        : { ...prev, gamePoints: (prev.gamePoints ?? 0) - item.price };
      if (item.kind === 'chip' || item.kind === 'heart') {
        // Consumables go to the Items folder; their effect is applied on USE.
        next.foodInventory = {
          ...prev.foodInventory,
          [item.icon]: (prev.foodInventory[item.icon] ?? 0) + 1,
        };
      } else if (item.kind === 'bg') {
        next.ownedBackgrounds = [...(prev.ownedBackgrounds ?? []), item.id];
        next.equippedBackground = item.id; // equip right away
      } else if (item.kind === 'furniture') {
        next.ownedFurniture = [...(prev.ownedFurniture ?? []), item.id];
        // Equipa na hora, no espaço do palco que o item declara — o que
        // estava ali sai (um espaço, um item; ver utils/petStage.ts).
        if (item.slot) next.equippedDecor = { ...(prev.equippedDecor ?? {}), [item.slot]: item.id };
      }
      return next;
    });
    playFeed();
    return true;
  }, [gameState.gamePoints, gameState.ownedBackgrounds, gameState.ownedFurniture, missionProgress]);

  const handleEquipBackground = useCallback((id: string | null) => {
    setGameState(prev => ({ ...prev, equippedBackground: id }));
  }, []);

  /**
   * Equipa/desequipa decoração. `id` null limpa o espaço; caso contrário o item
   * ocupa o SEU espaço, substituindo quem estava lá. Não existe "equipar em
   * outro lugar" — o espaço faz parte da identidade do item, porque a arte é
   * desenhada para aquela caixa (utils/petStage.ts).
   */
  const handleEquipFurniture = useCallback((id: string | null, slot: SlotId) => {
    setGameState(prev => ({ ...prev, equippedDecor: applyDecorEquip(prev.equippedDecor ?? {}, id, slot) }));
  }, []);

  // 💎 Créditos (monetização) — TODA operação de saldo passa pelo SERVIDOR
  // (utils/entitlements.ts). O `credits` do GameState é só espelho pra UI;
  // quem decide é functions/api/_entitlements.js. Nunca aplique o efeito de
  // uma compra sem o servidor ter confirmado.
  const syncEntitlement = useCallback((ent: { tier: 'demo' | 'paid'; credits: number }) => {
    setGameState(prev => ({ ...prev, credits: ent.credits, accountTier: ent.tier }));
  }, []);

  const handleWatchAd = useCallback(async (): Promise<boolean> => {
    const ent = await claimAdReward();
    if (!ent) return false;
    syncEntitlement(ent);
    return true;
  }, [syncEntitlement]);

  const handleBuyCreditPack = useCallback(async (pack: CreditPack): Promise<boolean> => {
    const result = await purchase(pack.id);
    if (!result.ok) return false;
    syncEntitlement(result.ent);
    return true;
  }, [syncEntitlement]);

  const handleInstantHealWithCredits = useCallback(async (): Promise<boolean> => {
    if (gameState.healthPoints >= gameState.maxHealthPoints) return false;
    const ent = await spendCredits(HEART_COST_CREDITS, 'instant-heal');
    if (!ent) return false;
    setGameState(prev => ({
      ...prev,
      credits: ent.credits,
      accountTier: ent.tier,
      healthPoints: Math.min(prev.maxHealthPoints, prev.healthPoints + 1),
    }));
    return true;
  }, [gameState.healthPoints, gameState.maxHealthPoints]);

  // Reroll: regenera o personagem do oráculo com uma seed NOVA (mesmos dados
  // de nascimento salvos no onboarding) — recomeça do Rookie, mantém
  // atividades/tarefas e Bits. Só existe pra contas 'paid' (modo demo não tem
  // perfil de oráculo salvo).
  const handleRerollCharacter = useCallback(async (): Promise<boolean> => {
    const saved = readJson<(OracleInput & { seed: number }) | null>(
      STORAGE_KEYS.SOULMON_PROFILE, null);
    // Confere o perfil ANTES de cobrar — cobrar e depois falhar seria roubo.
    if (!saved) return false;
    const newSeed = Math.floor(Math.random() * 2 ** 31);
    // GERA ANTES DE COBRAR. Conferir só a existência do perfil não bastava: um
    // perfil salvo corrompido (sem `oracle.classElements`, sem `psychometric`,
    // sem `astrology`) faz a geração lançar — e a ordem antiga já tinha
    // debitado os 50 Créditos de DINHEIRO REAL. Cobrar e falhar seria roubo,
    // e o comentário acima só valia para metade dos modos de falha.
    // Perfil novo (tem soulProfile) → pipeline completo: o reroll re-sorteia
    // também a criatura-inspiração do bestiário, não só a parte criativa.
    // Perfil de antes da troca de motor → caminho legado, intacto.
    let result: OracleResult;
    try {
      if (saved.soulProfile) {
        const { generateOracleComplete } = await import('./utils/soulProfile');
        result = (await generateOracleComplete(saved, newSeed)).result;
      } else {
        const { generateOracle } = await import('./utils/oracle');
        result = generateOracle(saved, newSeed);
      }
    } catch {
      return false; // nada foi cobrado
    }
    const ent = await spendCredits(REROLL_COST_CREDITS, 'reroll');
    if (!ent) return false;
    // Reroll JA COBRADO em Creditos (dinheiro real): perder a seed nova e
    // perder o que a pessoa pagou. AVISA.
    writeJson(STORAGE_KEYS.SOULMON_PROFILE, { ...saved, seed: result.seed });
    const GENERIC_LINES = ['tapirmon', 'veemon', 'salamon'] as const;
    const genericLine = GENERIC_LINES[hashString(String(result.seed)) % GENERIC_LINES.length];
    writeLocal(STORAGE_KEYS.EGG_TYPE, genericLine);
    setGameState(prev => ({
      ...prev,
      credits: ent.credits,
      accountTier: ent.tier,
      eggType: genericLine,
      evolutionStage: 'rookie',
      unlockedEvolutions: ['rookie'],
      healthPoints: getMaxHPForStage('rookie'),
      maxHealthPoints: getMaxHPForStage('rookie'),
      maxActivityCap: FORM_REQUIREMENTS.rookie.cap,
      digivolutionSegments: 0,
      perfectDays: 0,
      virusPoints: 0,
      dataPoints: 0,
      vaccinePoints: 0,
      attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
      currentBranch: 'data',
      degeneratedByHP: false,
      soulmonStages: result.creature.stages,
      soulmonMeta: {
        seed: result.seed,
        baseName: result.creature.baseName,
        dominantElement: result.dominantElement,
        dominantAlignment: result.dominantAlignment,
        dominantRealm: result.dominantRealm,
      },
    }));
    return true;
  }, []);

  // Desbloqueio completo comprado NO MEIO do jogo (UnlockAccountModal.tsx).
  // O servidor já confirmou a compra quando isto roda.
  const handleAccountUnlocked = useCallback((ent: Entitlement) => {
    syncEntitlement(ent);
    setUnlockReason(null);
    // A compra promete "uma criatura gerada só pra você" — o ritual do oráculo
    // é o que entrega isso. Sem este passo o jogador pagaria e continuaria com
    // o personagem de demonstração.
    setUpgradeRitual(true);
  }, [syncEntitlement]);

  // Fim do ritual pós-compra: troca SÓ a criatura. Estágio, atividades,
  // tarefas, Bits e histórico continuam de pé — mandar quem acabou de pagar de
  // volta pro Rookie seria punir a compra (diferente do reroll, que é escolha
  // explícita e avisa que reseta).
  const handleUpgradeRevealed = useCallback((result: OracleResult) => {
    setUpgradeRitual(false);
    const GENERIC_LINES = ['tapirmon', 'veemon', 'salamon'] as const;
    const genericLine = GENERIC_LINES[hashString(String(result.seed)) % GENERIC_LINES.length];
    writeLocal(STORAGE_KEYS.EGG_TYPE, genericLine);
    setGameState(prev => ({
      ...prev,
      accountTier: 'paid',
      eggType: genericLine,
      demoCharacterId: undefined,
      soulmonStages: result.creature.stages,
      soulmonMeta: {
        seed: result.seed,
        baseName: result.creature.baseName,
        dominantElement: result.dominantElement,
        dominantAlignment: result.dominantAlignment,
        dominantRealm: result.dominantRealm,
      },
    }));
  }, []);

  // 🔒 Evolution padlock (Evolution page): tapping the current Soulmon toggles
  // it. While locked, the pet never evolves at the day turn; unlocking lets the
  // (already met) criteria trigger the evolution on the NEXT day turn.
  // Cache das skills no save: a página do Pet recomputa do perfil local e
  // devolve aqui, para o conteúdo sobreviver a um aparelho novo (o perfil do
  // oráculo não sobe para a nuvem, as skills agora sim).
  const handleSkillsComputed = useCallback((skills: NonNullable<GameState['soulmonSkills']>) => {
    setGameState(prev => (prev.soulmonSkills ? prev : { ...prev, soulmonSkills: skills }));
  }, [setGameState]);

  const handleClassTitlesComputed = useCallback((titles: NonNullable<GameState['soulmonClassTitles']>) => {
    setGameState(prev => (prev.soulmonClassTitles ? prev : { ...prev, soulmonClassTitles: titles }));
  }, [setGameState]);

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
    if (readLocal(STORAGE_KEYS.DAILY_REPORT_SHOWN) === report.date) return;
    setShowDailyReport(true);
  }, [gameState.lastDayReport]);

  /**
   * "Eu fiz, só esqueci de marcar." Devolve os corações que a virada cobrou —
   * mas NÃO o dia perfeito, que já passou. É o retro-tracking do Pokémon Sleep:
   * recupera o dano, não a glória.
   *
   * Dá para usar isso para não perder coração nunca. É de propósito: num app de
   * produtividade pessoal quem mente só engana a si mesmo, e o atrito de um
   * antifraude custaria mais aos honestos do que o benefício.
   */
  const handleRecoverHearts = useCallback(() => {
    setGameState(prev => {
      const report = prev.lastDayReport;
      if (!report || report.heartsRecovered || report.heartsLost <= 0) return prev;
      return {
        ...prev,
        healthPoints: Math.min(prev.maxHealthPoints, prev.healthPoints + report.heartsLost),
        lastDayReport: { ...report, heartsRecovered: true },
      };
    });
  }, []);

  /**
   * Check-in de humor. É opcional, e o dado NUNCA entra em pontuação — nem em
   * dia perfeito, nem em HP, nem em evolução (há teste travando isso em
   * utils/mood.test.ts). Se virasse insumo de score, a pessoa passaria a
   * responder o que rende mais ponto em vez do que sente.
   */
  const handlePickMood = useCallback((mood: MoodValue) => {
    const today = new Date().toDateString();
    setGameState(prev => ({ ...prev, moodLog: recordMood(prev.moodLog, today, mood) }));
  }, []);

  const handleCloseDailyReport = useCallback(() => {
    if (gameState.lastDayReport) {
      // "ja mostrei o relatorio hoje": no pior caso ele reabre. Silencioso.
      writeLocal(STORAGE_KEYS.DAILY_REPORT_SHOWN, gameState.lastDayReport.date, { silent: true });
    }
    setShowDailyReport(false);
  }, [gameState.lastDayReport]);

  // ═══════════════════════════════════════════════════════════════════════════
  // OS RITUAIS (docs/PLANO-TAREFAS.md §2.4) — check-in, triagem, sono, semana
  // ═══════════════════════════════════════════════════════════════════════════

  /** 'YYYY-MM-DD' local — o formato que os `<input type="date">` do app usam e
   *  que `taskTriage`/`rituals` sabem ler. `toISOString` daria o dia ERRADO em
   *  fuso negativo (é UTC), que é o bug clássico deste campo. */
  const isoDay = (d: Date) => {
    const p = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };

  /**
   * Abre o check-in matinal UMA vez por dia.
   *
   * Mesmo padrão do `DailyReportModal` ("mostrar 1× por dia"), só que a marca
   * mora no save (`lastCheckInDate`) em vez do localStorage: o ritual é do
   * jogador, não do aparelho, e reabri-lo em cada celular seria transformar
   * planejamento em interrupção.
   *
   * O `ref` é o que impede o efeito de reabrir a tela a cada `setGameState` —
   * `gameState` está nas deps porque o plano depende dele, e sem a trava o
   * check-in voltaria sozinho depois de qualquer alteração de estado.
   *
   * Não abre com o plano vazio (usuário sem hábito e sem tarefa): um ritual de
   * planejamento sobre uma lista vazia é só uma tela a mais entre a pessoa e o
   * pet dela.
   */
  const checkInPromptedRef = useRef(false);
  useEffect(() => {
    if (checkInPromptedRef.current) return;
    if (!hasCompletedOnboarding || !hasCompletedTutorial) return;
    if (showDailyReport) return; // dois modais empilhados roubam o clique um do outro
    const now = new Date();
    if (!needsCheckIn(gameState, now)) return;
    const plan = checkInPlan(gameState, now);
    if (plan.habitsToday.length === 0 && plan.suggestedFocus.length === 0 && plan.carryOver.length === 0) return;
    checkInPromptedRef.current = true;
    setCheckInPlanData(plan);
  }, [gameState, hasCompletedOnboarding, hasCompletedTutorial, showDailyReport]);

  /** Fecha o check-in gravando os focos escolhidos (a regra é de `setFocus`). */
  const handleCheckInConfirm = useCallback((focusIds: string[]) => {
    const dayKey = dayKeyOf(new Date());
    setGameState(prev => completeCheckIn(prev, focusIds, dayKey));
    setCheckInPlanData(null);
  }, [setGameState]);

  /**
   * Pular. Marca o dia do mesmo jeito — e isso é de propósito: um ritual que
   * reaparece porque você não quis fazê-lo é cobrança, e o app não cobra.
   */
  const handleCheckInSkip = useCallback(() => {
    const dayKey = dayKeyOf(new Date());
    setGameState(prev => ({ ...prev, lastCheckInDate: dayKey }));
    setCheckInPlanData(null);
  }, [setGameState]);

  /**
   * "Arrumar a pilha" — o Smart Schedule do Todoist com ergonomia de jogo.
   *
   * Cada carta vira uma chamada de `taskTriage`, e nenhuma regra é reescrita
   * aqui: 'today' devolve a tarefa ao Hoje (`toOpen` + `startDate` de hoje),
   * 'week' é um adiamento CONTADO (`postpone`, +7 dias — é o contador do
   * Sunsama que torna evitação crônica um dado), 'someday' é a lista inerte do
   * Things 3 e 'drop' é o Won't Do do TickTick, terminal e reversível.
   */
  const handleOpenTriage = useCallback(() => {
    setTriageTasks(triageQueue(gameState.tasks, new Date()));
  }, [gameState.tasks]);

  const handleTriageResolve = useCallback((taskId: string, action: TriageAction) => {
    const now = new Date();
    const weekAhead = new Date(now.getTime());
    weekAhead.setDate(weekAhead.getDate() + 7);
    setGameState(prev => ({
      ...prev,
      tasks: prev.tasks.map(task => {
        if (task.id !== taskId) return task;
        switch (action) {
          case 'today': return toOpen({ ...task, startDate: isoDay(now) }, now);
          case 'week': return postpone(task, now, isoDay(weekAhead));
          case 'someday': return toSomeday(task, now);
          case 'drop': return drop(task, now);
          default: return task;
        }
      }),
    }));
  }, [setGameState]);

  /**
   * Registra a NOITE quando o pet dorme e quando acorda (`recordNight`).
   *
   * Fica num efeito sobre `isSleeping` — e não dentro do `handleSleep` — porque
   * o sono AUTOMÁTICO (a janela das Configurações) também troca esse estado, e
   * um registro preso ao botão perderia justamente as noites de quem configurou
   * o app para não precisar do botão.
   *
   * O `ref` começa em `null` e a primeira execução só sincroniza: abrir o app
   * com o pet já dormindo não inventa uma noite que não aconteceu (noite sem
   * registro é NEUTRA, nunca uma falha).
   */
  const sleepStateRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (sleepStateRef.current === null) { sleepStateRef.current = isSleeping; return; }
    if (sleepStateRef.current === isSleeping) return;
    sleepStateRef.current = isSleeping;
    const now = new Date();
    if (isSleeping) {
      // Perder isto só custa a hora de deitar da noite em curso. Silencioso.
      writeLocal(STORAGE_KEYS.SLEEP_STARTED_AT, now.toISOString(), { silent: true });
      setGameState(prev => ({ ...prev, rest: recordNight(prev.rest ?? createRestState(), now) }));
      return;
    }
    const startedIso = readLocal(STORAGE_KEYS.SLEEP_STARTED_AT);
    const started = startedIso ? new Date(startedIso) : null;
    if (!started || Number.isNaN(started.getTime())) return;
    // Idempotente por manhã: isto ATUALIZA o registro criado ao deitar.
    setGameState(prev => ({ ...prev, rest: recordNight(prev.rest ?? createRestState(), started, now) }));
    removeLocal(STORAGE_KEYS.SLEEP_STARTED_AT, { silent: true });
  }, [isSleeping, setGameState]);

  /**
   * O SONHO DA MANHÃ — e a palavra "manhã" é a regra, não o enfeite.
   *
   * Todo feedback de sono acontece de manhã, dentro do app, e vem em forma de
   * recompensa colecionável. NUNCA à noite: a ortossonia é ansiedade ANTES de
   * dormir, e um app que comenta seu sono às 23h45 é exatamente o estímulo que
   * atrapalha o sono que ele diz proteger. Nada aqui exibe nota, duração ou
   * veredito — a raridade sai da REGULARIDADE (`dreamRarity`) e o pior
   * resultado possível é um sonho comum.
   *
   * `rollDream` é determinístico pela seed (o dayKey), então recarregar a
   * página de manhã não re-sorteia até achar um lendário.
   */
  const dreamShownRef = useRef(false);
  useEffect(() => {
    if (dreamShownRef.current) return;
    if (isSleeping) return;
    const now = new Date();
    const hour = now.getHours();
    if (hour < 4 || hour >= 12) return; // só de manhã
    const rest = gameState.rest;
    if (!rest) return;
    const key = dayKeyOf(now);
    if (!rest.nights.some(n => n.date === key)) return; // nenhuma noite registrada
    // "já mostrei o sonho desta manhã": no pior caso ele reaparece uma vez.
    if (readLocal(STORAGE_KEYS.MORNING_DREAM_SHOWN) === key) return;

    const dreamId = rollDream(rest, dreamRarity(rest, now), hashString(key));
    const isNew = !rest.dreams.includes(dreamId);
    dreamShownRef.current = true;
    writeLocal(STORAGE_KEYS.MORNING_DREAM_SHOWN, key, { silent: true });
    setGameState(prev => ({ ...prev, rest: collectDream(prev.rest ?? createRestState(), dreamId) }));
    setMorningDream({ dream: DREAM_CATALOG.find(d => d.id === dreamId) ?? null, isNew });
  }, [gameState.rest, isSleeping, setGameState]);

  /**
   * O PESADELO DA MANHÃ — a face jogável da mesma noite que rendeu o sonho.
   *
   * O sonho é a COLETA (passiva, colecionável) e o pesadelo é o COMBATE: as
   * duas metades da noite, e por isso os dois vivem no MESMO momento e sob a
   * MESMA janela de horas do sonho (4h–12h). Nada de sono aparece à noite —
   * ortossonia é ansiedade ANTES de dormir, e um app que às 23h avisa que há
   * uma luta pendente é o estímulo exato que a Janela de Descanso existe para
   * não produzir.
   *
   * Aparece depois do sonho (`!morningDream`) porque dois modais empilhados
   * fazem o de cima roubar o clique do de baixo — já visto em teste.
   */
  useEffect(() => {
    if (nightmareOpen) return;
    if (isSleeping) return;
    const now = new Date();
    const hour = now.getHours();
    if (hour < 4 || hour >= 12) return; // só de manhã
    const rest = gameState.rest;
    if (!rest) return;
    if (!hasPendingNightmare(gameState.nightmares ?? EMPTY_NIGHTMARES, rest, now)) return;
    setNightmareOpen(true);
  }, [gameState.rest, gameState.nightmares, isSleeping, nightmareOpen]);

  /**
   * A onda vem PRONTA de `buildNightmareWave` — o componente não decide inimigo
   * nenhum, e o motor de combate continua sendo o da Masmorra (o módulo delega
   * a `buildDungeonWave`; regra copiada é regra que diverge em silêncio).
   *
   * `nightmareDayKey` nas deps, e não o `Date` inteiro: sem isso a onda seria
   * re-sorteada a cada render e o inimigo trocaria no meio da luta.
   */
  const nightmareKey = nightmareDayKey(new Date());
  const nightmareWave = useMemo(
    () => (nightmareOpen
      ? buildNightmareWave(gameState.rest ?? createRestState(), gameState.evolutionStage, new Date())
      : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nightmareOpen, nightmareKey, gameState.evolutionStage],
  );
  const nightmareRarity = useMemo(
    () => nightmaresFor(gameState.rest ?? createRestState(), new Date(), gameState.evolutionStage).rarity,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nightmareKey, gameState.evolutionStage, gameState.rest],
  );

  /**
   * Fecha a noite. **Sempre** chamado — vitória, derrota ou fechar a tela.
   *
   * Deixar o pesadelo pendente faria a oferta reaparecer na próxima abertura, e
   * uma recompensa que insiste vira cobrança. `markFought` é idempotente por
   * dayKey, então o StrictMode (que roda o updater 2×) não duplica nada.
   */
  const closeNightmare = useCallback(() => {
    const key = nightmareDayKey(new Date());
    setGameState(prev => ({
      ...prev,
      nightmares: markFought(prev.nightmares ?? EMPTY_NIGHTMARES, key),
    }));
    setNightmareOpen(false);
  }, [setGameState]);

  /**
   * Vitória: energia (teto do estágio), meio coração no máximo (teto de
   * `NIGHTMARE_MAX_HEART_CURE`, respeitando `maxHealthPoints`) e Bits.
   *
   * Perder não credita nada — `nightmareRewards(rarity,false)` devolve zeros e
   * este caminho nem é chamado. O som/fala ficam FORA do updater (footgun 6).
   */
  const handleNightmareWin = useCallback((rewards: NightmareRewards) => {
    const key = nightmareDayKey(new Date());
    setGameState(prev => ({
      ...prev,
      healthPoints: Math.min(prev.maxHealthPoints, prev.healthPoints + (rewards.hearts ?? 0)),
      energyPoints: Math.min(
        getMaxEnergyForStage(prev.evolutionStage),
        (prev.energyPoints ?? 0) + (rewards.energy ?? 0),
      ),
      gamePoints: (prev.gamePoints ?? 0) + (rewards.bits ?? 0),
      nightmares: markFought(prev.nightmares ?? EMPTY_NIGHTMARES, key),
    }));
    setMessageTrigger(prev => prev + 1);
  }, [setGameState]);

  /** Aceita o recomeço. NUNCA apaga progresso — ver `applyFreshStart`. */
  const handleFreshStart = useCallback(() => {
    setGameState(prev => applyFreshStart(prev, new Date()));
    setFreshStartDismissed(true);
    toast(language === 'pt-BR'
      ? 'Recomeço aceito. Nada do seu progresso foi tocado.'
      : 'Fresh start taken. None of your progress was touched.');
  }, [language, setGameState]);

  const handleDismissWeeklyReport = useCallback(() => {
    setGameState(prev => ({ ...prev, lastWeeklyReportDate: dayKeyOf(new Date()) }));
  }, [setGameState]);

  /** A Janela de Descanso (Configurações). Só o usuário escolhe os horários. */
  const handleChangeRestWindow = useCallback((window: RestWindow) => {
    setGameState(prev => ({ ...prev, rest: { ...(prev.rest ?? createRestState()), window } }));
  }, [setGameState]);

  /** "Não quero ver métricas": esconde NÚMEROS, preserva RECOMPENSAS. */
  const handleToggleRestMetrics = useCallback((hide: boolean) => {
    setGameState(prev => ({ ...prev, rest: { ...(prev.rest ?? createRestState()), hideMetrics: hide } }));
  }, [setGameState]);

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSOS (utils/steps.ts) — opcional, e a palavra opcional é literal
  // ═══════════════════════════════════════════════════════════════════════════

  // Este aparelho tem contador? Na PWA (a maior parte da base) a resposta é
  // `false` e NADA de passos aparece em lugar nenhum — sem erro, sem medidor
  // vazio, sem "você está perdendo isto".
  useEffect(() => {
    let cancelled = false;
    isStepsAvailable().then(ok => { if (!cancelled) setStepsAvailable(ok); });
    hasStepsPermission().then(ok => { if (!cancelled) setStepsPermission(ok); });
    return () => { cancelled = true; };
  }, []);

  /* O agregado anterior por REF: `readStepsToday` precisa dele para calcular o
     delta, e colocá-lo nas deps do efeito abaixo reiniciaria o polling a cada
     leitura. */
  const stepsRecordRef = useRef(gameState.steps);
  stepsRecordRef.current = gameState.steps;

  /**
   * Lê o pedômetro só com o app EM FOREGROUND e só com consentimento.
   *
   * `null` NÃO é 0: sem sensor, sem permissão ou com leitura falha o registro
   * anterior fica exatamente como está — zerar o dia por uma leitura que não
   * respondeu seria apagar passo que a pessoa deu.
   */
  useEffect(() => {
    if (gameState.stepsConsent !== 'granted') return;
    let cancelled = false;
    const read = () => {
      if (document.hidden) return;
      readStepsToday(new Date(), stepsRecordRef.current).then(record => {
        if (cancelled || !record) return; // null nunca vira 0
        setGameState(prev => {
          const p = prev.steps;
          // Só grava quando algo mudou: todo setGameState agenda cloud save.
          if (p && p.date === record.date && p.today === record.today && p.baseline === record.baseline) return prev;
          return { ...prev, steps: record };
        });
      }).catch(() => {});
    };
    read();
    const id = setInterval(read, STEPS_POLL_MS);
    document.addEventListener('visibilitychange', read);
    return () => {
      cancelled = true;
      clearInterval(id);
      document.removeEventListener('visibilitychange', read);
    };
  }, [gameState.stepsConsent, setGameState]);

  /**
   * Consentimento → diálogo do sistema. NUNCA o contrário: chamar
   * `requestStepsPermission` sem ter mostrado `stepsConsentCopy` (que é o que o
   * `StepsCard` renderiza) é bug de conformidade (política do Play + LGPD).
   */
  const handleStepsRequestPermission = useCallback(async () => {
    const granted = await requestStepsPermission();
    setStepsPermission(granted);
    setGameState(prev => ({ ...prev, stepsConsent: granted ? 'granted' : 'declined' }));
  }, [setGameState]);

  /**
   * Recusar. Grava `'declined'` PARA SEMPRE — sem esta marca o cartão voltaria
   * a cada abertura para quem já disse não, e insistir depois de um "não" é
   * assédio, não onboarding. Não existe custo: quem recusa não perde nada.
   */
  const handleStepsDecline = useCallback(() => {
    setGameState(prev => ({ ...prev, stepsConsent: 'declined' }));
  }, [setGameState]);

  /** Passos de HOJE (0 se o registro é de outro dia — nada é herdado da véspera). */
  const stepsToday = gameState.steps && gameState.steps.date === stepsDayKey(new Date())
    ? gameState.steps.today
    : 0;

  /**
   * SELO DE "VERIFICADO" — declarado pontua, inferido CONFIRMA.
   *
   * O hábito marcado é que vale: ele já rendeu a comida da categoria, já entrou
   * na meta do dia e já alimentou a constância, com ou sem sensor. Isto aqui
   * acrescenta UMA comida e um selo por cima, e só isso. Não existe meta, item
   * ou conquista alcançável apenas com sensor — quem joga na PWA não fica atrás
   * de nada (regra 2 de `utils/steps.ts`).
   *
   * Fora do updater, como todo efeito colateral (footgun 6).
   */
  const grantStepsVerified = useCallback((category: ActivityCategory) => {
    if (!STEP_VERIFIABLE.includes(category)) return;
    if (stepsToday < STEPS_VERIFIED_MIN) return;
    const food = FOOD_BY_CATEGORY[category];
    if (food) {
      setGameState(prev => ({
        ...prev,
        foodInventory: {
          ...prev.foodInventory,
          [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1,
        },
      }));
      setFeedAnim(prev => ({ emoji: food.emoji, n: (prev?.n ?? 0) + 1 }));
    }
    toast(language === 'pt-BR'
      ? `🥾 Verificado pelos seus passos hoje — +1 comida de bônus.`
      : `🥾 Verified by today's steps — +1 bonus food.`);
  }, [stepsToday, language, setGameState]);

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
      if (!readFlag(STORAGE_KEYS.AUTO_SLEEP_ENABLED)) {
        autoSleepPrevInWindowRef.current = null;
        return;
      }
      const start = parseHM(readLocal(STORAGE_KEYS.AUTO_SLEEP_START), '23:00');
      const end = parseHM(readLocal(STORAGE_KEYS.AUTO_SLEEP_END), '07:00');
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
        writeFlag(STORAGE_KEYS.IS_SLEEPING, inWindow, { silent: true });
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
  const rubHealRef = useRef<{ date: string; healed: number }>(
    (() => {
      const saved = readJson<{ date: string; healed: number } | null>(
        STORAGE_KEYS.RUB_HEAL_DAY, null);
      if (saved && saved.date === new Date().toDateString()) return saved;
      return { date: new Date().toDateString(), healed: 0 };
    })()
  );
  // Bumped when rubbing can't heal because today's cap was reached → pet comments.
  const [healCapSignal, setHealCapSignal] = useState(0);

  const handlePet = useCallback(() => {
    // Regra em utils/careRules.ts, compartilhada com o app de desktop. A
    // checagem usa só HP (deps estreitas de propósito: CompanionHUD é memo(),
    // e depender do gameState inteiro anularia o memo — footgun 5).
    const today = new Date().toDateString();
    rubHealRef.current = rubHealRecordFor(rubHealRef.current, today);
    const refused = rubRefusal(
      gameState.healthPoints, gameState.maxHealthPoints, rubHealRef.current, today,
    );
    if (refused) {
      // "Já está cheio" é silencioso; "acabou o carinho de hoje" o pet comenta.
      if (refused === 'daily-cap') setHealCapSignal(n => n + 1);
      return;
    }
    rubHealRef.current = { date: today, healed: rubHealRef.current.healed + RUB_HEAL_STEP };
    // Teto de cura por carinho: sem persistir, o teto do dia some. AVISA.
    writeJson(STORAGE_KEYS.RUB_HEAL_DAY, rubHealRef.current);
    playFeed();
    // O teto do dia já foi conferido acima; aqui só a cura é aplicada.
    setGameState(prev => rubHeal(prev, { date: today, healed: 0 }, today).state);
  }, [gameState.healthPoints, gameState.maxHealthPoints]);

  // targetStage é sempre um ID da árvore ('rookie' | 'champion-virus' | ...),
  // não mais um nome de exibição — a árvore é única por jogador, então não dá
  // pra inverter nome→id globalmente como antes (DEGENERATION_STAGE_MAP).
  const handleDegenerate = useCallback((targetStage: string) => {
    setGameState(prev => {
      const newHP = getMaxHPForStage(targetStage);
      const newStageLevel = getStageLevel(targetStage);
      // Intentional degen: head start at half the requirement (easier recovery than neglect)
      const newPerfectDays = Math.floor(FORM_REQUIREMENTS[newStageLevel].required / 2);

      return {
        ...prev,
        evolutionStage: targetStage,
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
      if (!prev.unlockedEvolutions.includes(targetStage)) return prev;

      const newHP = getMaxHPForStage(targetStage);

      return {
        ...prev,
        evolutionStage: targetStage,
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

  const handleCompleteOnboarding = async (data: OnboardingCompleteData) => {
    // Fim do onboarding: perder isto refaz o ritual do zero. AVISA.
    writeLocal(STORAGE_KEYS.USER_NAME, data.userName);
    writeFlag(STORAGE_KEYS.ONBOARDING_COMPLETE, true);
    setUserName(data.userName);
    setHasCompletedOnboarding(true);

    // E-mail é OPCIONAL no caminho grátis (ver SoulmonOnboarding). Sem ele o
    // jogo roda local, com o saveId aleatório que já existe — e o app pede o
    // e-mail depois, quando houver progresso a perder (ProtectProgressModal).
    const normalizedEmail = data.email.trim().toLowerCase();
    if (!normalizedEmail) {
      setHasCompletedOnboarding(true);
    } else {
      // O e-mail vira a identidade de sync — mesmo mecanismo do login manual em
      // Configurações (saveId = hash do e-mail).
      const { emailToSaveId, cloudLoad, adoptCloudSave } = await import('./utils/cloudSave');
      const newSaveId = await emailToSaveId(normalizedEmail);
      writeLocal(STORAGE_KEYS.USER_EMAIL, normalizedEmail);

      // Esse e-mail já tem um Soulmon salvo na nuvem (reinstalação/outro
      // aparelho) — adota o save existente em vez de sobrescrever com uma
      // criatura nova. Precisa de reload: o gameState inteiro muda de baixo do
      // GameStateProvider, o que setGameState não faz de forma segura.
      const existing = await cloudLoad(newSaveId);
      // Só recarrega se o save da nuvem REALMENTE ficou gravado. Falhou =
      // segue o ritual normal com o progresso local, em vez de recarregar num
      // id que não tem dado nenhum por trás.
      if (existing && adoptCloudSave(newSaveId, existing, normalizedEmail) === 'ok') {
        window.location.reload();
        return;
      }

      writeLocal(STORAGE_KEYS.SAVE_ID, newSaveId);
      setSaveId(newSaveId);
    }

    const newActivities: Activity[] = data.initialActivities.map((item, i) => ({
      id: `${Date.now() + i}`,
      name: item.name,
      category: item.category,
      emoji: item.emoji,
      steps: [],
      weekDays: [0, 1, 2, 3, 4, 5, 6],
    }));

    // Modo demo (utils/monetization.ts): personagem pré-pronto, sem árvore do
    // oráculo — evolui num caminho ÚNICO (getSpriteForStage resolve o sprite
    // via demoCharacterId, ver utils/sprites.ts).
    if (data.mode === 'demo') {
      const premade = PREMADE_CHARACTERS.find(c => c.id === data.demoCharacterId);
      writeLocal(STORAGE_KEYS.EGG_TYPE, 'tapirmon');
      setGameState(prev => ({
        ...prev,
        activities: newActivities,
        tasks: [],
        eggType: 'tapirmon',
        evolutionStage: 'rookie',
        unlockedEvolutions: ['rookie'],
        healthPoints: getMaxHPForStage('rookie'),
        maxHealthPoints: getMaxHPForStage('rookie'),
        maxActivityCap: FORM_REQUIREMENTS.rookie.cap,
        soulmonStages: premade ? getDemoCreatureStages(premade) : [],
        soulmonMeta: premade ? { baseName: premade.name } : undefined,
        accountTier: 'demo',
        demoCharacterId: data.demoCharacterId,
        soulGoal: data.soulGoal,
        soulStruggle: data.soulStruggle,
        petPassive: rollPetPassive(),
      }));
      return;
    }

    // Linha de sprite GENÉRICA (visual provisório até a Fase 2 assumir) —
    // sorteada uma vez, determinística pela seed do oráculo. Não é mais uma
    // escolha do jogador; a árvore de verdade é a de soulmonStages.
    const GENERIC_LINES = ['tapirmon', 'veemon', 'salamon'] as const;
    const genericLine = GENERIC_LINES[hashString(String(data.oracleResult.seed)) % GENERIC_LINES.length];
    writeLocal(STORAGE_KEYS.EGG_TYPE, genericLine);

    // O onboarding É o ritual de nascimento — o pet já nasce Rookie na SUA
    // forma única (sem ovo/baby).
    setGameState(prev => ({
      ...prev,
      activities: newActivities,
      tasks: [],
      eggType: genericLine,
      evolutionStage: 'rookie',
      unlockedEvolutions: ['rookie'],
      healthPoints: getMaxHPForStage('rookie'),
      maxHealthPoints: getMaxHPForStage('rookie'),
      maxActivityCap: FORM_REQUIREMENTS.rookie.cap,
      soulmonStages: data.oracleResult.creature.stages,
      soulmonMeta: {
        seed: data.oracleResult.seed,
        baseName: data.oracleResult.creature.baseName,
        dominantElement: data.oracleResult.dominantElement,
        dominantAlignment: data.oracleResult.dominantAlignment,
        dominantRealm: data.oracleResult.dominantRealm,
      },
      accountTier: 'paid',
      demoCharacterId: undefined,
      soulGoal: data.soulGoal,
      soulStruggle: data.soulStruggle,
      petPassive: rollPetPassive(),
    }));
  };

  // Segundo onboarding (GameTutorialFlow): tarefas escolhidas na criação
  // obrigatória da 1ª tarefa. Chega SEMPRE com >=1 item (o componente não
  // deixa terminar sem selecionar nada).
  const handleCompleteTutorial = (activities: Array<{ name: string; category: ActivityCategory; emoji: string }>) => {
    writeFlag(STORAGE_KEYS.TUTORIAL_COMPLETE, true, { silent: true });
    setHasCompletedTutorial(true);
    const newActivities: Activity[] = activities.map((item, i) => ({
      id: `${Date.now() + i}`,
      name: item.name,
      category: item.category,
      emoji: item.emoji,
      steps: [],
      weekDays: [0, 1, 2, 3, 4, 5, 6],
    }));
    setGameState(prev => ({
      ...prev,
      activities: [...prev.activities, ...newActivities],
    }));
  };


  // Handle reset onboarding (DEBUG ONLY)
  const handleResetOnboarding = () => setResetOnboardingOpen(true);
  const handleConfirmResetOnboarding = () => {
    removeLocal(STORAGE_KEYS.ONBOARDING_COMPLETE);
    removeLocal(STORAGE_KEYS.USER_NAME);
    removeLocal(STORAGE_KEYS.EGG_TYPE);
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

  // Splash de abertura — sempre exibido brevemente antes de tudo o mais.
  if (showIntro) {
    return <IntroScreen onFinish={() => setShowIntro(false)} />;
  }

  // Show onboarding if not completed — Soulmon: quiz da alma no lugar do ovo
  if (!hasCompletedOnboarding) {
    return <Suspense fallback={null}><SoulmonOnboarding onComplete={handleCompleteOnboarding} /></Suspense>;
  }

  // Segundo onboarding: tutorial do jogo + criação obrigatória da 1ª tarefa —
  // mostrado uma vez, depois que o Soulmon já nasceu, antes de liberar o app.
  if (!hasCompletedTutorial) {
    return (
      <Suspense fallback={null}>
        <GameTutorialFlow
          language={language}
          maxActivities={gameState.maxActivityCap}
          existingActivitiesCount={gameState.activities.length}
          onComplete={handleCompleteTutorial}
        />
      </Suspense>
    );
  }

  // Ritual do oráculo pós-compra — ocupa a tela inteira como o onboarding, mas
  // sem intro nem cadastro (ver SoulmonOnboarding mode='upgrade').
  if (upgradeRitual) {
    return (
      <Suspense fallback={null}>
        <SoulmonOnboarding
          mode="upgrade"
          onComplete={handleCompleteOnboarding}
          onRevealed={handleUpgradeRevealed}
          onCancel={() => setUpgradeRitual(false)}
        />
      </Suspense>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col sm-app-bg">
        <PixelFrame />
        {unlockReason && (
          <UnlockAccountModal
            language={language}
            reason={unlockReason}
            onUnlocked={handleAccountUnlocked}
            onClose={() => setUnlockReason(null)}
          />
        )}
        {protectPrompt && (
          <ProtectProgressModal
            language={language}
            reason={protectPrompt}
            onDismiss={dismissProtectPrompt}
            onConfirm={handleProtectProgress}
          />
        )}

        {/* Help Modal */}
        <HelpModal
          isOpen={showHelpModal}
          onClose={() => setShowHelpModal(false)}
          language={language}
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

        {/* Navegação principal — barra fixa no rodapé (abaixo do chat), ícones abertos */}
        <BottomNav
          currentView={currentView}
          onNavigate={setCurrentView}
          onResetOnboarding={handleResetOnboarding}
          onOpenCredits={() => setCreditsOpen(true)}
          language={language}
        />

        {/* Créditos (monetização) — modal próprio, aberto pelo menu sanduíche. */}
        {creditsOpen && (
          <Suspense fallback={null}>
            <CreditsModal
              language={language}
              credits={gameState.credits ?? 0}
              accountTier={gameState.accountTier ?? 'paid'}
              healthPoints={gameState.healthPoints}
              maxHealthPoints={gameState.maxHealthPoints}
              canReroll={!!readLocal(STORAGE_KEYS.SOULMON_PROFILE)}
              onWatchAd={handleWatchAd}
              onBuyPack={handleBuyCreditPack}
              onInstantHeal={handleInstantHealWithCredits}
              onReroll={handleRerollCharacter}
              onClose={() => setCreditsOpen(false)}
            />
          </Suspense>
        )}

        {/* O FAB "Nova Atividade" SAIU da Home (G1/G8). Ele flutuava sobre a
            lista e, em 412×915, cobria exatamente a última linha visível — o
            controle de criar tapava o conteúdo que ele cria. A referência não
            tem FAB: tem CTA largo no fim do painel, que é onde a lista termina
            e onde o gesto de "adicionar mais um" nasce. Ver
            `RitualPanel`/`ctaLabel`. A regra `.sm-px-fab` ficou no index.css
            SEM consumidor — é peça de kit, e apagá-la só criaria trabalho se
            outra tela precisar de um flutuante. */}

        {/* Fundo da Home cheio, atrás de tudo (barra de chat/nav ficam por
            cima) — antes era só um retângulo dentro do CompanionHUD, restrito
            à altura da área do pet. Sem cenário equipado, cai no teal escuro
            do tema (--sm-bg) em vez de um cinza neutro genérico. */}
        {currentView === 'main' && (
          <div
            aria-hidden="true"
            /* G10 (Ref C): sem cenário equipado, o teal padrão ganha a grade
               de circuito ciano tênue. Cenário equipado sobrescreve por style
               inline — a grade só existe no fundo padrão. */
            className={gameState.equippedBackground && PET_BACKGROUNDS[gameState.equippedBackground] ? undefined : 'sm-circuit-bg'}
            style={{
              position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
              backgroundImage: gameState.equippedBackground && PET_BACKGROUNDS[gameState.equippedBackground]
                ? PET_BACKGROUNDS[gameState.equippedBackground].css
                : undefined,
              backgroundColor: 'var(--sm-bg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
        )}

        {/* Scrollable Content - padding bottom pra não ficar atrás da bottom nav (+ chat na home) */}
        <div
          className="flex-1 overflow-y-auto px-6"
          style={{
            position: 'relative', zIndex: 1,
            /* RODADA 4: o `pt-3` virou TOKEN porque a área fixa do pet precisa
               cancelar exatamente este padding no `top` do sticky. Com os dois
               valores cravados em lugares diferentes, sobrava uma fresta de
               12px em que a lista aparecia rolando ACIMA do pet (visto em
               screenshot, 412×700) — e divergiriam na primeira vez que alguém
               mexesse num deles. */
            paddingTop: 'var(--sm-scroll-pt)',
            /* B5: `--sm-chatdock-h` (altura real do dock) + 16px de folga,
               no lugar do `100px` mágico. Ver o token no index.css. */
            paddingBottom: currentView === 'main'
              ? 'calc(var(--sm-bottomnav-h) + env(safe-area-inset-bottom, 0px) + var(--sm-chatdock-h) + 16px)'
              : 'calc(var(--sm-bottomnav-h) + env(safe-area-inset-bottom, 0px) + 16px)',
          }}
        >
          {currentView === 'main' && (
            <div className="space-y-4">
              {/* HUD do topo (Ref C): marca + medidores em cápsula de cobre.
                  Ver components/pixel/HomeHud.tsx para a nota sobre o rótulo
                  da moeda ("SOUL CRYSTAL" da referência vs. Créditos). */}
              <HomeHud
                energyPoints={gameState.energyPoints}
                maxEnergyPoints={getMaxEnergyForStage(gameState.evolutionStage)}
                credits={gameState.credits ?? 0}
                healthPoints={gameState.healthPoints}
                maxHealthPoints={gameState.maxHealthPoints}
                language={language}
                onOpenCredits={() => setCreditsOpen(true)}
              />

              {/* HP risk banner — dismissible strip acima do pet.
                  O número vem de `tasksToAvoidHeartLoss`, dono da regra. Era
                  `ceil(required / 2)`, que prometia que METADE das tarefas
                  evitava a perda — falso: a perda só zera acima de 1 − 1/maxHP
                  da meta (rookie: 3 de 4, não 2). A mesma promessa falsa já
                  tinha sido removida do aviso das 20h e ficou aqui, que é o
                  momento de maior consequência do jogo. */}
              {gameState.healthPoints <= 1 && gameState.healthPoints > 0 && dailyDone < hpSafeToday && !hpBannerDismissed && (
                /* Chanfro do kit em vez do `rounded-2xl` do sistema antigo:
                   era o último raio Material que sobrava na Home (B1). */
                /* `backgroundColor` (nunca o atalho `background`, que zeraria as
                   bandas de quina) e `--sm-cham-line` junto de `borderColor`: quem
                   repinta a moldura de uma peça do kit repinta a QUINA também, senão
                   a quina sai cobre e a borda vermelha. Ver "RODADA 4 — A QUINA
                   FECHA" no index.css. */
                /* ÂMBAR, não `--sm-danger`: o vermelho de alerta somado a
                   contagem regressiva, imperativo, prazo e ponto de exclamação
                   fazia deste o texto mais duro do app — e ele aparece
                   exatamente no dia em que a pessoa está pior. O NÚMERO é o
                   mesmo (`tasksToAvoidHeartLoss`, dono da regra); mudou só o
                   enquadramento, e o perdão (o carinho) vem junto, na mesma
                   frase, em vez de ficar escondido num modal. */
                <div
                  className="flex items-center gap-2 px-4 py-2 sm-px-card"
                  style={{ backgroundColor: '#fbf1dd', borderColor: '#d9a441', '--sm-cham-line': '#d9a441' } as React.CSSProperties}
                >
                  <img src={iconHeartHandshake} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
                  <p className="flex-1 text-xs" style={{ lineHeight: '1.3', color: '#7a5a12' }}>
                    {language === 'pt-BR'
                      ? `Seu Soulmon está com pouco fôlego. ${hpSafeToday} ${hpSafeToday === 1 ? 'item' : 'itens'} hoje já seguram — ou um carinho devolve meio coração.`
                      : `Your Soulmon is short of breath. ${hpSafeToday} ${hpSafeToday === 1 ? 'item' : 'items'} today already holds it — or a rub gives half a heart back.`}
                  </p>
                  <button
                    onClick={() => setHpBannerDismissed(true)}
                    className="shrink-0 text-sm leading-none flex items-center justify-center"
                    /* 44x44 de área de toque (WCAG 2.2 AA 2.5.8); o ✕ continua pequeno. */
                    style={{ width: 44, height: 44, background: 'none', border: 'none', color: '#7a5a12' }}
                    aria-label={language === 'pt-BR' ? 'Dispensar' : 'Dismiss'}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Pet — acima, sem estar contido em uma caixa */}
              <CompanionHUD
                companionMood={getCompanionMood()}
                energyLevel={progress}
                message={getCompanionMessage()}
                currentStage={getCurrentStageName()}
                evolutionStage={gameState.evolutionStage}
                eggType={gameState.eggType}
                demoCharacterId={gameState.demoCharacterId}
                healthPoints={gameState.healthPoints}
                maxHealthPoints={gameState.maxHealthPoints}
                dominantBranch={getDominantBranch()}
                currentXP={gameState.totalXP}
                nextLevelXP={getNextLevelXP()}
                triggerMessage={messageTrigger}
                energyPoints={gameState.energyPoints}
                maxEnergyPoints={getMaxEnergyForStage(gameState.evolutionStage)}
                equippedDecor={gameState.equippedDecor ?? EMPTY_DECOR}
                trophies={gameState.trophies ?? EMPTY_TROPHIES}
                fullSignal={fullSignal}
                digivolutionSegments={gameState.digivolutionSegments}
                digivolutionSegmentsNeeded={gameState.digivolutionSegmentsNeeded}
                perfectDays={gameState.perfectDays}
                requiredDays={FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required}
                onEvolve={handleEvolve}
                canEvolve={(() => {
                  const req = FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].required;
                  if (gameState.evolutionLocked || gameState.perfectDays < req) return false;
                  const b = getDominantBranch();
                  const next = getNextEvolution(gameState.evolutionStage, b === 'balanced' ? 'data' : b, gameState.unlockedEvolutions);
                  return next !== gameState.evolutionStage;
                })()}
                onEvolveRequest={() => {
                  const b = getDominantBranch();
                  const next = getNextEvolution(gameState.evolutionStage, b === 'balanced' ? 'data' : b, gameState.unlockedEvolutions);
                  if (next !== gameState.evolutionStage) setEvolutionCeremony({ from: gameState.evolutionStage, to: next });
                }}
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

              {/* BRINCAR — na área do pet, junto de banho/dormir/itens, porque
                  é um gesto de CUIDADO e não um minijogo. É uma OFERTA: sem
                  barra de diversão, sem contador regressivo, sem badge por não
                  ter brincado. Ver components/PlayCard.tsx. */}
              {(() => {
                const agoraPet = new Date();
                const chavePet = dayKeyOf(agoraPet);
                return (
                  <PlayCard
                    canPlay={canPlay(petNeedsView, chavePet)}
                    playedToday={playedToday(petNeedsView, chavePet)}
                    buff={activeBuff(petNeedsView, agoraPet)}
                    now={agoraPet}
                    language={language}
                    onPlay={handlePlay}
                  />
                );
              })()}

              {/* ── G1: UM painel de rituais, linhas de ~72px ────────────────
                  Antes: um `PixelPanel` de ~200px por item, três estourando a
                  dobra e o quarto cortado pelo dock de chat. A composição e as
                  decisões (coluna única em retrato, truncamento por PT-BR,
                  etapas recolhidas, fallback sem emoji) estão documentadas em
                  components/pixel/RitualPanel.tsx. */}
              {(() => {
                const isPt = language === 'pt-BR';
                const today = new Date().getDay(); // 0 = domingo, 6 = sábado
                const todayString = new Date().toDateString();
                const diasCurtos = isPt
                  ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
                  : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

                // Só as ATIVAS entram na lista. 'someday' e 'dropped' saem de
                // vista de propósito: as duas existem justamente para tirar um
                // item do campo de atenção sem apagá-lo. Deixá-las aqui
                // devolveria a culpa que a decisão acabou de resolver — o
                // usuário disse "isso não é para agora" e o app continuaria
                // mostrando. Elas seguem no save, contáveis e reversíveis pela
                // gaveta abaixo, e ficam fora da meta do dia (dailyReset).
                const tarefas = gameState.tasks
                  .filter(t => isActive(t))
                  .sort((a, b) => Number(a.completed) - Number(b.completed));
                const guardadas = gameState.tasks.filter(t => !isActive(t));

                const atividades = [
                  ...gameState.activities.filter(a => a.weekDays?.includes(today)),
                  ...gameState.activities.filter(a => !a.weekDays?.includes(today)),
                ].map(activity => ({
                  ...activity,
                  isComplete: activity.steps.length > 0
                    ? activity.steps.every(s => s.completed)
                    : !!(activity.completedToday && activity.lastCompletedDate === todayString),
                })).sort((a, b) => Number(a.isComplete) - Number(b.isComplete));

                const total = tarefas.length + atividades.length;
                const feitos = tarefas.filter(t2 => t2.completed).length
                  + atividades.filter(a => a.isComplete).length;

                /* Trilha de evolução na Home (referência: caminho de nós ao
                   lado dos Daily Rituals). O galho é o que o pet JÁ está
                   seguindo; em rookie (sem galho) é o previsto — o MESMO
                   resolveBranch da página de Evolução, nada recalculado. */
                const trailBranch = getStageBranch(gameState.evolutionStage)
                  ?? resolveBranch(
                    { virus: gameState.virusPoints, data: gameState.dataPoints, vaccine: gameState.vaccinePoints },
                    carePatternReading,
                    gameState.currentBranch,
                  );

                const agora = new Date();
                // A fila de "arrumar a pilha": vencidas + assombradas, na ordem
                // canônica de `triageQueue`. O botão só existe quando há pilha —
                // um botão de arrumar sobre uma lista limpa é cobrança gratuita.
                const pilha = triageQueue(gameState.tasks, agora).length;
                const recomeco = freshStartDismissed ? null : freshStartOffer(gameState, agora, language);
                const mostrarSemana = needsWeeklyReport(gameState, agora);

                return (
                  <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {(gameState.soulmonStages?.length ?? 0) > 0 && (
                    <EvoTrail
                      stages={gameState.soulmonStages ?? []}
                      currentStageId={gameState.evolutionStage}
                      unlockedEvolutions={gameState.unlockedEvolutions}
                      branch={trailBranch}
                      demoCharacterId={gameState.demoCharacterId}
                      onOpen={() => setCurrentView('evolution')}
                      language={language}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                  {/* RECOMEÇO (segunda-feira / dia 1) — cartão discreto no topo
                      da lista, JAMAIS um modal que tranca a tela. O *fresh
                      start effect* (Dai, Milkman & Riis) funciona porque
                      "relega as imperfeições ao período anterior"; um convite
                      que bloqueia o app viraria mais uma cobrança de segunda. */}
                  {recomeco && (
                    <div
                      className="sm-px-card"
                      style={{ padding: '10px 12px', marginBottom: 10, backgroundColor: 'var(--sm-surface)' }}
                    >
                      <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--sm-ink)' }}>
                        {recomeco.title}
                      </p>
                      <p style={{ margin: '4px 0 8px', fontSize: '0.75rem', lineHeight: 1.45, color: 'var(--sm-muted)' }}>
                        {recomeco.body}
                      </p>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="sm-btn" style={{ fontSize: '0.72rem', padding: '8px 12px' }} onClick={handleFreshStart}>
                          {isPt ? 'Recomeçar' : 'Start fresh'}
                        </button>
                        <button
                          type="button"
                          className="sm-btn sm-btn-secondary"
                          style={{ fontSize: '0.72rem', padding: '8px 12px' }}
                          onClick={() => setFreshStartDismissed(true)}
                        >
                          {isPt ? 'Agora não' : 'Not now'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* RELATÓRIO SEMANAL (domingo) — bloco próprio, ao lado do
                      relatório diário, que tem outro dono. Ver
                      components/WeeklyReportCard.tsx. */}
                  {mostrarSemana && (
                    <div style={{ marginBottom: 10 }}>
                      <WeeklyReportCard
                        report={weeklyReport(gameState, agora)}
                        suggestion={stackingSuggestion(gameState, agora, language)}
                        language={language}
                        onDismiss={handleDismissWeeklyReport}
                      />
                    </div>
                  )}

                  {/* ARRUMAR A PILHA — 200 itens vermelhos viram uma sequência
                      de decisões de um clique. Só aparece com pilha de verdade. */}
                  {pilha > 0 && (
                    <button
                      type="button"
                      className="sm-btn sm-btn-secondary"
                      style={{ width: '100%', marginBottom: 10, fontSize: '0.75rem', padding: '10px 8px' }}
                      onClick={handleOpenTriage}
                    >
                      {isPt
                        ? `Arrumar a pilha (${pilha})`
                        : `Tidy the pile (${pilha})`}
                    </button>
                  )}

                  <RitualPanel
                    done={feitos}
                    total={total}
                    titleIcon={iconTarget}
                    language={language}
                    ctaLabel={`+ ${t.activities.addNew}`}
                    onCta={handleAddNewActivity}
                    emptyMessage={total === 0 ? t.main.noActivityRegistered : undefined}
                  >
                    {tarefas.map(task => (
                      /* A linha + a fita de metadados abaixo dela. `<li>` e não
                         `<div>`: o pai é uma `<ul>`, e um filho que não é item
                         de lista quebra a semântica que o leitor de tela usa
                         para contar as tarefas. */
                      <Fragment key={task.id}>
                      <RitualRow
                        icon={categoryIconImg(task.category)}
                        name={task.name}
                        subtitle={task.category
                          ? categoryLabel(task.category as ActivityCategory, isPt)
                          : (isPt ? 'Tarefa avulsa' : 'One-off task')}
                        value={task.completed ? 1 : 0}
                        max={1}
                        done={task.completed}
                        onToggle={() => { if (!task.completed) handleToggleTask(task.id); }}
                        onEdit={() => handleEditTask(task.id)}
                        language={language}
                        toggleLabelPt={task.completed ? 'Tarefa concluída' : 'Marcar tarefa como concluída'}
                        toggleLabelEn={task.completed ? 'Task completed' : 'Mark task as completed'}
                      />
                      {!task.completed && (
                        <li style={{ listStyle: 'none', padding: '0 12px 8px 12px' }}>
                          {/* Esforço, prazo, "adiada 4×" e a aura de assombrada
                              — dado honesto, nunca acusação (TaskMeta.tsx). */}
                          <TaskMeta task={task} now={agora} language={language} />
                        </li>
                      )}
                      </Fragment>
                    ))}

                    {atividades.map(activity => {
                      const disponivelHoje = !!activity.weekDays?.includes(today);
                      const etapas = activity.steps ?? [];
                      const feitasEtapas = etapas.filter(s => s.completed).length;
                      // O rótulo sai do `schedule`, não do `weekDays` cru: um
                      // hábito "3× por semana" ou "a cada 2 dias" preenche
                      // `weekDays` com a semana inteira (é assim que o widget
                      // Android e o desktop continuam entendendo o item), então
                      // ler o campo antigo aqui rotulava os dois como "Todo
                      // dia" — o app anunciava uma cobrança diária que a regra
                      // não faz.
                      const freq = frequencyLabel(activity, isPt, diasCurtos);
                      const subtitulo = etapas.length > 0
                        ? `${freq} · ${feitasEtapas}/${etapas.length} ${isPt ? 'etapas' : 'steps'}`
                        : freq;

                      return (
                        <Fragment key={activity.id}>
                        <RitualRow
                          icon={categoryIconImg(activity.category)}
                          name={activity.name}
                          subtitle={subtitulo}
                          value={etapas.length > 0 ? feitasEtapas : (activity.isComplete ? 1 : 0)}
                          max={etapas.length > 0 ? etapas.length : 1}
                          done={activity.isComplete}
                          dimmed={!disponivelHoje}
                          onEdit={() => handleEditActivity(activity.id)}
                          expandable={etapas.length > 0}
                          expanded={!!expandedRituals[activity.id]}
                          onExpand={() => setExpandedRituals(prev => ({
                            ...prev, [activity.id]: !prev[activity.id],
                          }))}
                          onToggle={etapas.length > 0 ? undefined : () => handleToggleActivityCompletion(activity.id)}
                          language={language}
                          toggleLabelPt={activity.isComplete ? 'Atividade concluída' : 'Marcar atividade como concluída'}
                          toggleLabelEn={activity.isComplete ? 'Activity completed' : 'Mark activity as completed'}
                        >
                          {etapas.map(step => (
                            <StepRow
                              key={step.id}
                              id={step.id}
                              label={step.label}
                              completed={step.completed}
                              onToggle={disponivelHoje ? (stepId) => handleUpdateStep(activity.id, stepId) : () => {}}
                              disabled={!disponivelHoje}
                              language={language}
                            />
                          ))}
                        </RitualRow>
                        <li style={{ listStyle: 'none', padding: '0 12px 8px 12px' }}>
                          {/* "5 das últimas 7", escudos e o marco do hábito —
                              média móvel, nunca streak que zera. O ritmo vem do
                              save (`habitRhythms`); sem histórico, o vazio
                              ESTÁVEL, porque um objeto novo por render anula
                              memoização mundo afora. */}
                          <HabitConstancy
                            compact
                            rhythm={gameState.habitRhythms?.[activity.id] ?? EMPTY_RHYTHM}
                            schedule={normalizeSchedule(activity)}
                            now={agora}
                            language={language}
                          />
                        </li>
                        </Fragment>
                      );
                    })}
                  </RitualPanel>

                  {/* GAVETA DO QUE SAIU DE VISTA.
                      'Algum dia' e 'Deixar pra lá' tiram o item da atenção sem
                      apagá-lo — mas some-sem-volta é indistinguível de perda de
                      dado, e um backlog que o usuário não consegue reencontrar
                      deixa de ser uma decisão e vira desconfiança no app. A
                      gaveta fica FECHADA por padrão (o ponto é não pesar) e diz
                      em uma linha que nada ali cobra nada. */}
                  {guardadas.length > 0 && (
                    <details style={{ marginTop: 12, opacity: 0.75 }}>
                      <summary style={{ cursor: 'pointer', fontSize: 12, letterSpacing: '.04em' }}>
                        {isPt
                          ? `Guardadas (${guardadas.length}) — não cobram nada`
                          : `Put aside (${guardadas.length}) — these ask nothing of you`}
                      </summary>
                      <ul style={{ listStyle: 'none', padding: '8px 0 0 0', margin: 0 }}>
                        {guardadas.map(t => (
                          <li
                            key={t.id}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 8,
                              padding: '6px 4px', fontSize: 13,
                            }}
                          >
                            <span aria-hidden="true">{t.emoji}</span>
                            <span style={{ flex: 1, minWidth: 0 }}>{t.name}</span>
                            <span style={{ fontSize: 11, opacity: 0.7 }}>
                              {t.status === 'dropped'
                                ? (isPt ? 'deixada pra lá' : 'let go')
                                : (isPt ? 'algum dia' : 'someday')}
                            </span>
                            <button
                              type="button"
                              className="sm-btn sm-btn-secondary"
                              style={{ padding: '2px 8px', fontSize: 11 }}
                              onClick={() => handleRestoreTask(t.id)}
                            >
                              {isPt ? 'Retomar' : 'Bring back'}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Evolução, Pet e Estatísticas dividem o mesmo ícone da barra
              inferior — alternadas por essas abas em vez de botões separados
              (a barra tem 6 botões travados por teste). A página do Pet é a
              ficha viva: formas desbloqueadas, descrições e habilidades. */}
          {(currentView === 'evolution' || currentView === 'stats' || currentView === 'pet') && (
            <div className="flex gap-2 mb-4">
              {/* `minWidth: 0` + fonte menor são obrigatórios aqui: "Estatísticas"
                  é uma palavra só (min-content ~168px) e `flex:1` com o
                  `min-width:auto` padrão NÃO encolhe — com a chegada do chip
                  "Pet" a fileira passou de 323 para 412px num viewport de 390 e
                  o terceiro rótulo era cortado no meio ("ESTATÍSTIC").
                  A fileira parou de estourar a página, mas o rótulo continuava
                  4px maior que o próprio chip (medido em 390px: scrollWidth 109
                  contra clientWidth 105) e o "S" final morria no chanfro. Os
                  4px vêm do `letter-spacing: .03em` do `.sm-btn` somado a 12px
                  de padding: zerar o espaçamento (a bitmap já tem folga entre
                  glifos) e apertar o padding para 4px devolve ~6px de sobra. */}
              {([
                { view: 'evolution' as const, label: language === 'pt-BR' ? 'Evolução' : 'Evolution' },
                { view: 'pet' as const, label: 'Soulmon' },
                { view: 'stats' as const, label: language === 'pt-BR' ? 'Estatísticas' : 'Stats' },
              ]).map(({ view, label }) => (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  className={`sm-btn ${currentView === view ? '' : 'sm-btn-secondary'}`}
                  style={{ flex: 1, minWidth: 0, fontSize: '0.72rem', padding: '10px 4px', letterSpacing: 0, whiteSpace: 'nowrap' }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Ponto de conversão natural: quem está de frente para a árvore de
              um personagem de demonstração (as 3 linhas iguais) é exatamente
              quem entende o que a própria árvore significa. Só aqui e no
              limite de criação — em nenhum outro lugar do jogo. */}
          {currentView === 'evolution' && gameState.demoCharacterId && (
            <div style={{ padding: '0 4px 10px' }}>
              <UnlockNudge
                language={language}
                reason="evolution"
                variant={gameState.accountTier === 'paid' ? 'reveal' : 'buy'}
                onOpen={() => {
                  if (gameState.accountTier === 'paid') setUpgradeRitual(true);
                  else setUnlockReason('evolution');
                }}
              />
            </div>
          )}

          {currentView === 'evolution' && (
            <Suspense fallback={null}><EvolutionPath
              currentStageId={gameState.evolutionStage}
              currentBranch={getDominantBranch() === 'balanced' ? 'data' : getDominantBranch() as 'virus' | 'data' | 'vaccine'}
              virusPoints={gameState.virusPoints}
              dataPoints={gameState.dataPoints}
              vaccinePoints={gameState.vaccinePoints}
              digivolutionSegments={gameState.perfectDays}
              digivolutionSegmentsNeeded={FORM_REQUIREMENTS[getStageLevel(gameState.evolutionStage)].daysToEvolve}
              onDegenerate={handleDegenerate}
              stages={gameState.soulmonStages ?? []}
              eggType={gameState.eggType}
              demoCharacterId={gameState.demoCharacterId}
              unlockedEvolutions={gameState.unlockedEvolutions}
              evolutionLocked={gameState.evolutionLocked ?? false}
              onToggleEvolutionLock={handleToggleEvolutionLock}
              language={language}
              carePattern={carePatternReading.confident ? carePatternReading.pattern : null}
              forecastBranch={resolveBranch(
                { virus: gameState.virusPoints, data: gameState.dataPoints, vaccine: gameState.vaccinePoints },
                carePatternReading,
                gameState.currentBranch,
              )}
            /></Suspense>
          )}

          {currentView === 'pet' && (
            <Suspense fallback={null}><PetPage
              stages={gameState.soulmonStages ?? []}
              unlockedEvolutions={gameState.unlockedEvolutions}
              currentStageId={gameState.evolutionStage}
              demoCharacterId={gameState.demoCharacterId}
              petName={gameState.soulmonMeta?.baseName}
              savedSkills={gameState.soulmonSkills}
              onSkillsComputed={handleSkillsComputed}
              savedClassTitles={gameState.soulmonClassTitles}
              onClassTitlesComputed={handleClassTitlesComputed}
              language={language}
            /></Suspense>
          )}

          {/* DEX DE SONHOS na página do PET, e não em Configurações: é uma
              COLEÇÃO do bicho — cenas dele dormindo —, então mora onde já vive
              a ficha dele (formas, descrições, habilidades). Em Configurações
              ele leria como um painel de métrica de sono, que é exatamente a
              leitura que a Parte 3 do plano manda evitar. */}
          {currentView === 'pet' && (
            <div style={{ marginTop: 16 }}>
              <Suspense fallback={null}>
                <DreamDex rest={gameState.rest ?? createRestState()} language={language} />
              </Suspense>
            </div>
          )}

          {currentView === 'stats' && (
            <Suspense fallback={null}><StatsPage
              completedTasks={gameState.completedTasks}
              activityStats={gameState.activityStats}
              language={language}
              gamePoints={gameState.gamePoints}
              totalXP={gameState.totalXP}
              streakDays={gameState.totalPerfectDays ?? 0}
              virusPoints={gameState.virusPoints}
              dataPoints={gameState.dataPoints}
              vaccinePoints={gameState.vaccinePoints}
              petPassive={gameState.petPassive}
              carePattern={carePatternReading.confident ? carePatternReading.pattern : null}
              journey={{
                unlockedEvolutions: gameState.unlockedEvolutions,
                soulmonStages: gameState.soulmonStages,
                totalPerfectDays: gameState.totalPerfectDays,
                dungeonKills: gameState.dungeonKills,
                dungeonRunsCompleted: gameState.dungeonRunsCompleted,
                dinoBest: gameState.dinoBest,
                droppedItems: gameState.droppedItems,
                soulGoal: gameState.soulGoal,
              }}
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
              language={language}
              onChangeLanguage={(lang) => {
                setLanguage(lang);
                writeLocal(STORAGE_KEYS.LANGUAGE, lang, { silent: true });
              }}
              onOpenGuide={() => setGuideModalOpen(true)}
              onOpenGlossary={() => setShowHelpModal(true)}
              notificationsEnabled={notificationsEnabled}
              onToggleNotifications={handleToggleNotifications}
              onRestoreFromCloud={async (id) => {
                const { cloudLoad, adoptCloudSave } = await import('./utils/cloudSave');
                const state = await cloudLoad(id);
                if (!state) return false;
                // `false` (e não um reload cego) quando a gravação local falha:
                // a UI já trata isso como "não deu" e o save antigo continua.
                if (adoptCloudSave(id, state) !== 'ok') return false;
                window.location.reload();
                return true;
              }}
              onLoginWithEmail={async (email) => {
                const { emailToSaveId, cloudLoad, cloudSave, adoptCloudSave } = await import('./utils/cloudSave');
                const id = await emailToSaveId(email);
                const state = await cloudLoad(id);
                if (state) {
                  // Existing account on this email — adopt its cloud progress.
                  // Dado primeiro, identidade depois: trocar o `saveId` sem o
                  // save gravado faz o próximo cloud save subir o estado LOCAL
                  // por cima do save do outro aparelho.
                  // Lançar aqui é de propósito: o `catch` do SettingsPage já
                  // mostra o estado de erro, e é melhor do que recarregar num
                  // `saveId` sem save por trás.
                  if (adoptCloudSave(id, state, email) !== 'ok') {
                    throw new Error('adoptCloudSave falhou');
                  }
                } else {
                  writeLocal(STORAGE_KEYS.SAVE_ID, id);
                  writeLocal(STORAGE_KEYS.USER_EMAIL, email.trim().toLowerCase());
                  // First login for this email — claim it with the current progress
                  await cloudSave(id, gameState);
                }
                window.location.reload();
                return state ? 'loaded' : 'created';
              }}
            /></Suspense>
          )}

          {/* JANELA DE DESCANSO em CONFIGURAÇÕES: é uma preferência (os
              horários que combinam com a vida da pessoa) e mora ao lado da
              janela de sono automático, que ela conversa. O switch "não quero
              ver métricas" também é preferência — e esconder números sem tirar
              recompensa é a regra do `restWindow.ts`. */}
          {currentView === 'settings' && (
            <div style={{ marginTop: 16 }}>
              <Suspense fallback={null}>
                <RestWindowCard
                  rest={gameState.rest ?? createRestState()}
                  now={new Date()}
                  language={language}
                  onChangeWindow={handleChangeRestWindow}
                  onToggleMetrics={handleToggleRestMetrics}
                />
              </Suspense>
            </div>
          )}

          {/* PASSOS em CONFIGURAÇÕES, logo abaixo da Janela de Descanso: é uma
              PREFERÊNCIA de privacidade (ligar/desligar um sensor, com o texto
              de consentimento), e não conteúdo de jogo — na Home ou na página
              do Pet ele leria como mais um medidor a administrar, que é
              exatamente o que a Parte 3 do plano proíbe.

              Some por completo quando não há sensor (PWA, a maior parte da
              base) e quando a pessoa já disse não: `'declined'` é definitivo,
              porque insistir depois de um "não" é assédio. */}
          {currentView === 'settings' && stepsAvailable === true && gameState.stepsConsent !== 'declined' && (
            <div style={{ marginTop: 16 }}>
              <StepsCard
                steps={stepsToday}
                available
                hasPermission={gameState.stepsConsent === 'granted' && stepsPermission}
                language={language}
                onRequestPermission={handleStepsRequestPermission}
                onDismiss={handleStepsDecline}
              />
            </div>
          )}

          {currentView === 'oracle' && (
            <Suspense fallback={null}>
              <OraclePage language={language} />
            </Suspense>
          )}

          {currentView === 'tournament' && (
            <Suspense fallback={null}>
              <TournamentPage
                saveId={saveId}
                petStage={gameState.evolutionStage}
                pvpEnabled={!!gameState.pvpEnabled}
                onTogglePvp={(enabled) => setGameState(prev => ({ ...prev, pvpEnabled: enabled }))}
                trophies={gameState.trophies ?? []}
                language={language}
                emblems={gameState.emblems ?? 0}
                onEarnEmblems={amount => setGameState(prev => ({ ...prev, emblems: (prev.emblems ?? 0) + amount }))}
              />
            </Suspense>
          )}

          {currentView === 'library' && (
            <Suspense fallback={null}>
              <LibraryPage
                saveId={saveId}
                friends={gameState.friends ?? []}
                canGiftToday={gameState.energyPoints >= getMaxEnergyForStage(gameState.evolutionStage)}
                onFriendsChange={(friends) => setGameState(prev => ({ ...prev, friends }))}
                onGiftSent={() => {}}
                language={language}
              />
            </Suspense>
          )}

          {currentView === 'shop' && (
            <Suspense fallback={null}>
              <ShopModal
                asPage
                language={language}
                points={gameState.gamePoints ?? 0}
                ownedBackgrounds={gameState.ownedBackgrounds ?? []}
                equippedBackground={gameState.equippedBackground ?? null}
                ownedFurniture={gameState.ownedFurniture ?? []}
                equippedDecor={gameState.equippedDecor ?? EMPTY_DECOR}
                missionProgress={missionProgress}
                emblems={gameState.emblems ?? 0}
                credits={gameState.credits ?? 0}
                onBuy={handleShopBuy}
                onExchangeCredits={handleExchangeCredits}
                onEquip={handleEquipBackground}
                onEquipFurniture={handleEquipFurniture}
                onClose={() => setCurrentView('main')}
              />
            </Suspense>
          )}

          {currentView === 'games' && (
            <Suspense fallback={null}>
              <ActivitiesPage
                evolutionStage={gameState.evolutionStage}
                demoCharacterId={gameState.demoCharacterId}
                language={language}
                totalPoints={gameState.gamePoints ?? 0}
                onDungeonEnter={handleDungeonEnter}
                onDungeonLose={handleDungeonLose}
                onDungeonHeartDrop={handleDungeonHeartDrop}
                onGlitchtama={handleGlitchtama}
                onDungeonEnemyDefeated={handleDungeonEnemyDefeated}
                onDinoScore={handleDinoScore}
                onEarnPoints={handleEarnGamePoints}
                onOpenTournament={() => setCurrentView('tournament')}
              />
            </Suspense>
          )}
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
            language={language}
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
            language={language}
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
          demoLimitReached={gameState.accountTier === 'demo' && !canCreateDemoTaskToday()}
          onUnlock={() => { setCreateModalOpen(false); setUnlockReason('task-limit'); }}
          onSaveTask={(data) => {
            // Esforço, "quando" e idade vêm do modal e são gravados — sem eles
            // a tarefa nasce sem peso (meta do dia contaria item, não esforço)
            // e sem idade (nunca envelheceria, nunca assombraria).
            const newTask: Task = {
              id: `task-${Date.now()}`,
              name: data.name,
              category: data.category as ActivityCategory,
              emoji: data.emoji,
              completed: false,
              deadline: data.deadline,
              alarm: data.alarm,
              steps: data.steps,
              effort: data.effort,
              startDate: data.startDate,
              status: data.status ?? 'open',
              createdAt: data.createdAt ?? new Date().toISOString(),
              lastTouchedAt: data.lastTouchedAt ?? new Date().toISOString(),
            };
            setGameState(prev => ({
              ...prev,
              tasks: [...prev.tasks, newTask],
            }));
            if (gameState.accountTier === 'demo') recordDemoCreation();
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
              // Recorrência flexível + âncora ("depois do café da manhã"): o
              // modal já pergunta as duas coisas, e jogá-las fora aqui era o
              // buraco principal do motor de hábitos.
              schedule: data.schedule,
              anchor: data.anchor,
            };
            setGameState(prev => ({
              ...prev,
              activities: [...prev.activities, newActivity],
            }));
            if (gameState.accountTier === 'demo') recordDemoCreation();
          }}
          language={language}
        /></Suspense>
      )}

      <ConfirmDialog
        isOpen={resetOnboardingOpen}
        onClose={() => setResetOnboardingOpen(false)}
        onConfirm={handleConfirmResetOnboarding}
        /* O botão dizia "Recomeçar do zero", o diálogo falava em inglês de
           "egg choice" (estágio que não existe mais) e o código só limpa nome e
           linha de sprite — o save de jogo continua inteiro. Os três agora
           dizem a mesma coisa, e ela é verdade. */
        title={language === 'pt-BR' ? 'Refazer o ritual' : 'Redo the ritual'}
        message={language === 'pt-BR'
          ? 'Você vai responder o ritual de novo e escolher seu nome outra vez. Seu Soulmon, suas atividades, seus Bits e todo o progresso continuam como estão.'
          : 'You will go through the ritual again and pick your name once more. Your Soulmon, activities, Bits and all progress stay exactly as they are.'}
        confirmLabel={language === 'pt-BR' ? 'Refazer' : 'Redo'}
        cancelLabel={language === 'pt-BR' ? 'Cancelar' : 'Cancel'}
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
          />
        </Suspense>
      )}

      <ContentModals
        guideModalOpen={guideModalOpen}
        onCloseGuide={() => setGuideModalOpen(false)}
        language={language}
      />

      <GamePopups
        showFirstTaskPopup={showFirstTaskPopup}
        onCloseFirstTaskPopup={() => setShowFirstTaskPopup(false)}
        language={language}
      />

      {evolutionCeremony && (
        <EvolutionCeremony
          fromStage={evolutionCeremony.from}
          toStage={evolutionCeremony.to}
          toName={getStageNameById(evolutionCeremony.to)}
          language={language}
          demoCharacterId={gameState.demoCharacterId}
          onEvolved={handleEvolve}
          onClose={() => setEvolutionCeremony(null)}
        />
      )}

      <EvolveTaskModal
        isOpen={evolveModalStage !== null}
        onClose={() => setEvolveModalStage(null)}
        onCreateTask={() => { setEvolveModalStage(null); setCreateModalOpen(true); }}
        requiredTasks={FORM_REQUIREMENTS[getStageLevel(evolveModalStage ?? gameState.evolutionStage)].required}
        /* Cadastradas PARA HOJE (dia da semana + tarefas já concluídas hoje),
           via o dono da regra. Com `activities.length` cru, o modal de evolução
           contava atividades de seg–sex para quem estava olhando aquilo num
           sábado e dizia "você já tem tarefas suficientes" sobre um dia vazio. */
        registeredTasks={registeredForDay(gameState, new Date().getDay(), new Date().toDateString())}
        stageName={evolveModalStage ? getStageNameById(evolveModalStage) : ''}
        language={language}
      />

      {/* Notification Manager */}
      <NotificationManager
        activities={gameState.activities}
        tasks={gameState.tasks}
        userName={userName}
        petName={getCurrentStageName()}
        language={language}
        enabled={notificationsEnabled}
        healthPoints={gameState.healthPoints}
        maxHealthPoints={gameState.maxHealthPoints}
        completedSteps={dailyDone}
        /* A meta é min(cadastradas, requisito do estágio) — a MESMA de
           computeDailyReset, e por isso vem de `dailyGoalFor` em vez de uma
           cópia da fórmula. Passar o requisito puro fazia as notificações
           cobrarem quem já tinha cumprido a própria meta: um rookie com 2
           atividades tem meta 2, mas levava 3 cobranças por dia por "faltar"
           até 4. A correção da época consertou o TETO e deixou a FONTE: com
           `activities.length` cru, uma atividade de seg–sex ainda contava na
           meta de sábado, e a cobrança voltava exatamente no fim de semana. */
        /* Com o `dayKey`: `completedSteps` (dailyDone) JÁ conta as tarefas que
           saíram da lista ao serem concluídas; sem o dayKey aqui o denominador
           ignorava essas mesmas tarefas e as duas props do mesmo componente
           passavam a medir populações diferentes. */
        totalRequired={dailyGoalFor(gameState, new Date().getDay(), new Date().toDateString())}
      />
      {showDailyReport && gameState.lastDayReport && (
        <DailyReportModal
          report={gameState.lastDayReport}
          onClose={handleCloseDailyReport}
          onRecoverHearts={handleRecoverHearts}
          moodToday={moodFor(gameState.moodLog, new Date().toDateString())}
          onPickMood={handlePickMood}
          moodNote={moodSummary(gameState.moodLog, language === 'pt-BR' ? 'pt-BR' : 'en-US')}
          language={language}
          soulGoal={gameState.soulGoal}
        />
      )}
      {/* CHECK-IN MATINAL — o ritual de ≤20s. Só um por dia, pulável sem
          culpa, e nunca por cima do relatório diário (dois modais empilhados
          fazem o de cima roubar o clique do de baixo). */}
      {checkInPlanData && !showDailyReport && (
        <MorningCheckIn
          open
          plan={checkInPlanData}
          language={language}
          onConfirm={handleCheckInConfirm}
          onSkip={handleCheckInSkip}
        />
      )}

      {/* ARRUMAR A PILHA — fila de cartas com quatro saídas grandes. */}
      {triageTasks && (
        <TriagePile
          open
          tasks={triageTasks}
          language={language}
          onResolve={handleTriageResolve}
          onClose={() => setTriageTasks(null)}
        />
      )}

      {/* O SONHO DA MANHÃ — recompensa, nunca veredito. Só de manhã. */}
      {morningDream && (
        <MorningDream
          open
          dream={morningDream.dream}
          isNew={morningDream.isNew}
          language={language}
          onClose={() => setMorningDream(null)}
        />
      )}

      {/* O PESADELO DA MANHÃ — a face jogável da mesma noite do sonho. Entra
          DEPOIS dele (dois modais empilhados roubam o clique um do outro), e
          nunca à noite. Perder não custa nada, e a tela diz isso. */}
      {nightmareOpen && !morningDream && (
        <NightmareBattle
          open
          wave={nightmareWave}
          rarity={nightmareRarity}
          petStage={gameState.evolutionStage}
          demoCharacterId={gameState.demoCharacterId}
          language={language}
          onWin={handleNightmareWin}
          onLose={closeNightmare}
          onClose={closeNightmare}
        />
      )}

      {!showDailyReport && (
        <WelcomePromptModal
          language={language}
          notificationsEnabled={notificationsEnabled}
          onEnableNotifications={handleToggleNotifications}
        />
      )}
      <Toaster richColors position="top-right" />
    </div>
  );
}