import { createContext, useContext, useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { type ActivityCategory } from '../types/attributes';
import { MAX_HP_BY_FORM, getStageLevel, FORM_REQUIREMENTS } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { cloudSave } from '../utils/cloudSave';
import { pushProfile } from '../utils/community';
import type { CreatureStage, ElementId, AlignmentId, RealmId } from '../utils/oracle';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';
import type { ClassTitle } from '../utils/soulProfile/ficha/classTitle';
import type { FichaStage } from '../utils/soulProfile/ficha/types';
import type { SlotId } from '../utils/petStage';
import { ALL_SHOP_ITEMS } from '../utils/shop';
import { rollPetPassive } from '../utils/passives';
import { resolveLanguage } from '../utils/i18n';
import {
  readLocal,
  writeLocal,
  onStorageDegraded,
  storageDegradedMessage,
} from '../utils/safeStorage';
import { toast } from 'sonner';

/**
 * Save antigo guardava UMA decoração (`equippedFurniture`) que aparecia como
 * badge no canto. Agora cada decoração ocupa um espaço do palco. A migração
 * coloca o item antigo no espaço que ele declara — quem tinha um sofá continua
 * com o sofá, agora apoiado no chão.
 *
 * Roda uma vez, no load. O campo antigo é APAGADO do estado logo em seguida
 * (ver o `equippedFurniture: undefined` abaixo), senão ele fica no save para
 * sempre e a migração reaparece.
 *
 * A checagem é pela PRESENÇA de `equippedDecor`, não por ele estar cheio: um
 * mapa vazio é uma decisão do jogador ("desequipei tudo"), não ausência de
 * migração. Confundir os dois foi um bug real — quem tinha save antigo
 * desequipava o item, recarregava e ele voltava sozinho.
 */
export function migrateDecor(loaded: Partial<GameState>): Partial<Record<SlotId, string>> {
  if (loaded.equippedDecor !== undefined) return loaded.equippedDecor;
  const legacy = loaded.equippedFurniture;
  if (!legacy) return {};
  const item = ALL_SHOP_ITEMS.find(i => i.id === legacy);
  if (!item?.slot) return {};
  return { [item.slot]: legacy };
}

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
  /** Id da forma atual na árvore do Soulmon: 'rookie' | '{champion|ultimate|mega}-{virus|data|vaccine}' | 'ultra'
   *  (ver types/progression.ts). Único por jogador — o NOME de exibição vem de soulmonStages. */
  evolutionStage: string;
  digivolutionSegments: number;
  digivolutionSegmentsNeeded: number;
  poopEventsScheduled: number[];
  poopEventsCompleted: number[];
  unlockedEvolutions: string[];
  degeneratedByHP: boolean;
  currentBranch: 'virus' | 'data' | 'vaccine';
  lastDayWasPerfect: boolean;
  maxActivityCap: number;
  /** Não é mais escolha do jogador (era o "tipo de ovo") — hoje é a linha de
   *  sprite GENÉRICO sorteada uma vez no onboarding (utils/sprites.ts), usada
   *  como visual provisório até a Fase 2 (imagem gerada por IA) assumir. */
  eggType?: 'tapirmon' | 'veemon' | 'salamon';
  /** A árvore de 11 formas ÚNICA do jogador, gerada pelo oráculo no onboarding
   *  (utils/oracle.ts generateOracle().creature.stages) e congelada — nomes,
   *  descrições e prompts de imagem de cada forma. */
  soulmonStages?: CreatureStage[];
  /** As duas skills de cada estágio. Persistidas junto das formas porque o
   *  perfil do oráculo (`soulmon-profile`) vive só no localStorage e NÃO vai
   *  na nuvem: num aparelho novo a página do Pet perdia metade do conteúdo
   *  em silêncio. Determinísticas — recomputáveis, mas não a partir de nada. */
  soulmonSkills?: Record<FichaStage, StageSkills>;
  /** A classe de cada estágio — arquétipo REAL do class-system (emergido da
   *  ficha, nunca escolhido), mesmo motivo de cache que `soulmonSkills`. */
  soulmonClassTitles?: Record<FichaStage, ClassTitle>;
  /** Metadados do oráculo usados fora da árvore (fallback de sprite genérico,
   *  telas de perfil etc.). */
  soulmonMeta?: {
    seed?: number;
    baseName: string;
    dominantElement?: ElementId;
    dominantAlignment?: AlignmentId;
    dominantRealm?: RealmId;
  };
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
  /** Emblemas: moeda do Torneio (utils/currencies.ts). Só compra itens da aba
   *  de torneio da loja — não se mistura com Bits nem Créditos. */
  emblems?: number;
  /** Shop: pet-box backgrounds owned (ids from utils/shop.ts). */
  ownedBackgrounds: string[];
  /** Shop: equipped pet-box background id, or null for the default. */
  equippedBackground: string | null;
  /** Shop: furniture (kind:'furniture') owned — purely cosmetic decoration for the pet box. */
  ownedFurniture?: string[];
  /**
   * Decoração equipada, UM item por espaço do palco (utils/petStage.ts):
   * `{ 'floor-left': 'furn-sofa', trophy: 'furniture-podium', … }`.
   * Substituiu `equippedFurniture` (um item só, num badge de canto); saves
   * antigos são migrados no load — ver `migrateDecor`.
   */
  equippedDecor?: Partial<Record<SlotId, string>>;
  /** @deprecated Só sobrevive para migrar saves antigos. Use `equippedDecor`. */
  equippedFurniture?: string | null;
  /** Evolution lock (padlock on the Evolution page): while true the pet never evolves at the day turn. */
  evolutionLocked?: boolean;
  /** Tournament: opt-in para PvP assíncrono (aparece como oponente pra outros e pode desafiar). */
  pvpEnabled?: boolean;
  /** Troféus de season do Tournament (top 3 no fim de cada season). */
  trophies?: Array<{ season: string; place: 1 | 2 | 3 }>;
  /** Amigos aceitos (até 5) — ids de perfil público (mesmo id do cloud save). */
  friends?: string[];
  /** Mission counters (lifetime, cloud-synced) — see utils/missions.ts. */
  dungeonKills?: number;
  dungeonRunsCompleted?: number;
  dinoBest?: number;
  totalPerfectDays?: number;
  /** Shop item ids that have EVER dropped — unlocks their purchase (utils/shop.ts unlock:'drop'). */
  droppedItems?: string[];
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
    /** Voltou depois de ≥ABSENCE_FORGIVENESS_DAYS fora: relatório em modo acolhida. */
    welcomeBack?: boolean;
    daysAway?: number;
    /** Virada de segunda: ganhou o meio coração do alívio semanal. */
    weeklyRelief?: boolean;
    /** Já usou o "esqueci de marcar" deste relatório (1× por dia). */
    heartsRecovered?: boolean;
  };
  /**
   * O "porquê" do usuário, respondido no onboarding ANTES de qualquer mecânica
   * de jogo (Goal-Setting Theory + autonomia da SDT: a razão para mudar precisa
   * vir da pessoa, não do app). O pet devolve isso em momentos-chave, que é o
   * que separa "app que mede" de "avatar que acompanha".
   */
  soulGoal?: string;
  soulStruggle?: string;
  /**
   * Check-in de humor, opcional e curto. Só o histórico recente é guardado —
   * é registro de acompanhamento, NUNCA insumo de pontuação ou de penalidade.
   */
  moodLog?: Array<{ date: string; mood: 1 | 2 | 3 | 4 | 5 }>;
  /**
   * Timestamps ISO das ATIVIDADES concluídas. Existe porque `completedTasks` só
   * recebe tarefas avulsas — atividades recorrentes guardam `completedToday` e
   * `lastCompletedDate`, que somem na virada do dia. Sem isto, o ritmo de
   * cuidado (utils/carePattern.ts) ficava cego justamente para o mecanismo
   * principal de hábito do app.
   */
  activityLog?: string[];
  /**
   * Traço único sorteado no nascimento do pet (utils/passives.ts). É o que
   * transforma "meu bichinho" em *o meu* bichinho — dois Soulmon do mesmo
   * estágio se comportam de um jeito ligeiramente diferente.
   */
  petPassive?: string;
  /** Monetização (utils/monetization.ts) — 'demo': personagem pré-pronto,
   *  1 atividade nova/dia; 'paid': jogo completo (compra única). Saves
   *  antigos (antes desse campo existir) são adotados como 'paid'. */
  accountTier?: 'demo' | 'paid';
  /** Modo demo: qual personagem pré-pronto foi escolhido (utils/monetization.ts). */
  demoCharacterId?: 'kaelen' | 'orrin' | 'thalindra';
  /** Créditos (moeda premium, dinheiro real) — reroll de personagem, cura
   *  instantânea de coração, itens/cenários da loja. */
  credits?: number;
}

export function getMaxHPForStage(stage: GameState['evolutionStage']): number {
  return MAX_HP_BY_FORM[getStageLevel(stage)];
}

interface GameStateContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameStateContext = createContext<GameStateContextType | null>(null);

/**
 * `?? padrão` só corrige AUSÊNCIA. O save vem do localStorage E da nuvem, e
 * `/api/save` valida apenas que `state` é um objeto — o TIPO de cada campo é
 * dado não confiável. Um `tasks: {}` ou um `activities: 3` passa direto por
 * `??` e só explode lá na frente, dentro do updater da virada do dia (que roda
 * no mount): a árvore do React desmonta e o usuário fica na tela branca
 * PERMANENTE, porque toda carga seguinte lê o mesmo save.
 *
 * Estes dois helpers fazem o que o `??` não faz: garantem o TIPO.
 */
const arr = <T,>(v: unknown, fallback: T[] = []): T[] => (Array.isArray(v) ? (v as T[]) : fallback);
const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);

/**
 * Migra/completa um save carregado. Isolada da leitura de propósito: o
 * inicializador precisa poder cair para o estado novo se QUALQUER coisa aqui
 * lançar, e para isso o corpo tem que ser uma expressão que ele possa embrulhar.
 *
 * ATENÇÃO: todo campo NÃO-opcional de `GameState` precisa de linha aqui. Faltou
 * `activities` e `healthPoints` por muito tempo, e o resultado era literalmente
 * a tela branca acima para qualquer save que não os trouxesse — inclusive um
 * `{}` adotado da nuvem (`adoptCloudSave` grava qualquer objeto simples).
 * Há guard travando isso em `GameStateContext.hydrate.fuzz.test.tsx`.
 */
function hydrateSave(loadedState: Partial<GameState>): GameState {
  const savedEggType = readLocal(STORAGE_KEYS.EGG_TYPE) as GameState['eggType'] | null;
  const maxHP = getMaxHPForStage(loadedState.evolutionStage ?? 'rookie');
  return {
        ...loadedState,
        activities: arr(loadedState.activities),
        tasks: arr(loadedState.tasks),
        completedTasks: arr(loadedState.completedTasks),
        activityStats: (loadedState.activityStats && typeof loadedState.activityStats === 'object'
          && !Array.isArray(loadedState.activityStats)) ? loadedState.activityStats : {},
        maxHealthPoints: maxHP,
        // Save sem HP é save corrompido, não save de quem estava mal: começa
        // cheio. O oposto (0) degeneraria o pet na primeira virada por causa de
        // um campo ausente.
        healthPoints: Math.min(maxHP, Math.max(0, num(loadedState.healthPoints, maxHP))),
        totalXP: num(loadedState.totalXP, 0),
        virusPoints: num(loadedState.virusPoints, 0),
        dataPoints: num(loadedState.dataPoints, 0),
        vaccinePoints: num(loadedState.vaccinePoints, 0),
        digivolutionSegments: num(loadedState.digivolutionSegments, 0),
        digivolutionSegmentsNeeded: num(loadedState.digivolutionSegmentsNeeded, 999),
        lastResetDate: typeof loadedState.lastResetDate === 'string'
          ? loadedState.lastResetDate : new Date().toDateString(),
        evolutionStage: typeof loadedState.evolutionStage === 'string'
          ? loadedState.evolutionStage : 'rookie',
        energyPoints: num(loadedState.energyPoints, 0),
        perfectDays: num(loadedState.perfectDays, 0),
        lastDayWasPerfect: loadedState.lastDayWasPerfect ?? false,
        poopEventsScheduled: arr(loadedState.poopEventsScheduled),
        poopEventsCompleted: arr(loadedState.poopEventsCompleted),
        unlockedEvolutions: arr(loadedState.unlockedEvolutions, ['rookie']),
        degeneratedByHP: loadedState.degeneratedByHP ?? false,
        currentBranch: loadedState.currentBranch ?? 'data',
        maxActivityCap: loadedState.maxActivityCap ?? FORM_REQUIREMENTS[getStageLevel(loadedState.evolutionStage ?? 'rookie')].cap,
        eggType: (
          (loadedState.eggType as string) === 'agumon' ? 'tapirmon'
          : loadedState.eggType
        ) ?? (
          (savedEggType as string) === 'agumon' ? 'tapirmon'
          : savedEggType
        ) ?? 'tapirmon',
        attributesSinceLastEvolution: {
          virus: num(loadedState.attributesSinceLastEvolution?.virus, 0),
          data: num(loadedState.attributesSinceLastEvolution?.data, 0),
          vaccine: num(loadedState.attributesSinceLastEvolution?.vaccine, 0),
        },
        foodInventory: (loadedState.foodInventory && typeof loadedState.foodInventory === 'object'
          && !Array.isArray(loadedState.foodInventory)) ? loadedState.foodInventory : {},
        poopEventsShown: arr(loadedState.poopEventsShown),
        poopPenaltyClockAt: num(loadedState.poopPenaltyClockAt, 0),
        gamePoints: num(loadedState.gamePoints, 0),
        emblems: num(loadedState.emblems, 0),
        pvpEnabled: loadedState.pvpEnabled ?? false,
        trophies: arr(loadedState.trophies),
        friends: arr(loadedState.friends),
        // 'bg-room' is free — always owned, even for saves from before it existed.
        // `arr()` e não `?? []`: um `ownedBackgrounds` NÃO-array fazia o spread
        // LANÇAR, o try/catch do inicializador caía para `freshGameState()` e o
        // jogador perdia o save inteiro em silêncio.
        ownedBackgrounds: Array.from(new Set([...arr<string>(loadedState.ownedBackgrounds), 'bg-room'])),
        equippedBackground: loadedState.equippedBackground ?? null,
        ownedFurniture: arr(loadedState.ownedFurniture),
        equippedDecor: migrateDecor(loadedState),
        // Campos novos: saves antigos não os têm, então o fallback é obrigatório.
        soulGoal: loadedState.soulGoal ?? '',
        soulStruggle: loadedState.soulStruggle ?? '',
        moodLog: arr(loadedState.moodLog),
        activityLog: arr(loadedState.activityLog),
        petPassive: loadedState.petPassive ?? rollPetPassive(),
        // Campo antigo some do save no próximo gravar (JSON.stringify descarta
        // undefined). Sem isto ele sobreviveria para sempre e voltaria a
        // reequipar o item toda vez que o jogador desequipasse tudo.
        equippedFurniture: undefined,
        // Saves from before accountTier existed are grandfathered as 'paid' —
        // they already have a real oracle character and full functionality,
        // so they must never be retroactively downgraded to demo.
        accountTier: loadedState.accountTier ?? 'paid',
        demoCharacterId: loadedState.demoCharacterId,
        credits: loadedState.credits ?? 0,
      } as GameState;
}

/** Estado de instalação nova. Também é o fallback de qualquer falha de carga. */
function freshGameState(): GameState {
  const savedEggType = readLocal(STORAGE_KEYS.EGG_TYPE) as GameState['eggType'] | null;
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
      evolutionStage: 'rookie',
      digivolutionSegments: 0,
      digivolutionSegmentsNeeded: 1,
      poopEventsScheduled: [],
      poopEventsCompleted: [],
      unlockedEvolutions: ['rookie'],
      degeneratedByHP: false,
      currentBranch: 'data',
      lastDayWasPerfect: false,
      maxActivityCap: FORM_REQUIREMENTS.rookie.cap,
      eggType: ((savedEggType as string) === 'agumon' ? 'tapirmon' : savedEggType) ?? 'tapirmon',
      attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
      foodInventory: {},
      poopEventsShown: [],
      poopPenaltyClockAt: 0,
      gamePoints: 0,
      emblems: 0,
      pvpEnabled: false,
      trophies: [],
      friends: [],
      ownedBackgrounds: ['bg-room'],
      equippedBackground: null,
      ownedFurniture: [],
      equippedDecor: {},
      soulGoal: '',
      soulStruggle: '',
      moodLog: [],
      activityLog: [],
      petPassive: rollPetPassive(),
      // Fresh installs start in demo — the onboarding gate (SoulmonOnboarding)
      // upgrades this to 'paid' once the (currently placeholder) one-time
      // purchase completes.
      accountTier: 'demo',
      credits: 0,
  };
}

export function GameStateProvider({ children }: { children: ReactNode }) {
  // Um aviso por sessão, com par PT/EN. O idioma é lido pelo mesmo caminho
  // defensivo — num storage bloqueado, `readLocal` devolve null e cai no padrão.
  useEffect(() => {
    onStorageDegraded((kind) => {
      const language = resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE));
      toast.warning(storageDegradedMessage(kind, language), { duration: 10000 });
    });
    return () => onStorageDegraded(null);
  }, []);

  const [gameState, setGameState] = useState<GameState>(() => {
    // Nada aqui pode lançar. Um save corrompido, um storage bloqueado
    // (`SecurityError` do Safari em modo privado) ou um campo com tipo hostil
    // vindo da nuvem precisam degradar para estado novo — nunca virar a tela
    // branca permanente que este provider já produziu uma vez.
    let loadedState: Partial<GameState> | null = null;
    const saved = readLocal(STORAGE_KEYS.GAME_STATE);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Save tem que ser um OBJETO. Array/primitivo viram `{...}` vazio e o
        // jogador perde tudo em silêncio — recusar é o comportamento certo.
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          loadedState = parsed as Partial<GameState>;
        } else {
          console.warn('[GameState] save ignorado: não é objeto', { type: typeof parsed });
        }
      } catch (err) {
        console.warn('[GameState] save ilegível, começando do zero', {
          error: (err as Error)?.name,
        });
      }
    }
    if (loadedState) {
      try {
        return hydrateSave(loadedState);
      } catch (err) {
        console.error('[GameState] falha ao migrar o save; caindo para estado novo', {
          error: (err as Error)?.name,
          message: (err as Error)?.message,
        });
      }
    }
    return freshGameState();
  });

  const isFirstRender = useRef(true);

  useEffect(() => {
    // Storage cheio (`QuotaExceededError`) OU bloqueado não pode derrubar a
    // árvore do React: o jogo segue em memória e o usuário é avisado uma vez.
    writeLocal(STORAGE_KEYS.GAME_STATE, JSON.stringify(gameState));

    // Skip cloud backup on first render (initial load from localStorage)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Generate save ID on first use
    let saveId = readLocal(STORAGE_KEYS.SAVE_ID);
    if (!saveId) {
      saveId = crypto.randomUUID();
      // Sem storage, o id vive só nesta sessão: o cloud save ainda acontece,
      // mas na próxima abertura o id é outro. Melhor que não salvar nada.
      writeLocal(STORAGE_KEYS.SAVE_ID, saveId);
    }

    const timer = setTimeout(() => {
      cloudSave(saveId!, gameState);
      pushProfile({
        id: saveId!,
        // O nome vai para o ranking da COMUNIDADE, onde outros jogadores leem.
        // O padrão precisa do par EN/PT como todo texto de UI: em inglês,
        // "Anônimo" aparecia para quem nunca escolheu português.
        name: readLocal(STORAGE_KEYS.USER_NAME)
          || (resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)) === 'pt-BR' ? 'Anônimo' : 'Anonymous'),
        petName: gameState.soulmonMeta?.baseName || '',
        stage: gameState.evolutionStage,
        unlockedStages: gameState.unlockedEvolutions,
        pvpEnabled: !!gameState.pvpEnabled,
        attrs: { virus: gameState.virusPoints, data: gameState.dataPoints, vaccine: gameState.vaccinePoints },
        tasksDone: gameState.completedTasks?.length ?? 0,
      }).catch(() => {});
    }, 3000);
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
