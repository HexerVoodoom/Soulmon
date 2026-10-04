import { createContext, useContext, useState, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { type ActivityCategory } from '../types/attributes';
import { MAX_HP_BY_FORM, getStageLevel, FORM_REQUIREMENTS } from '../types/progression';
import { STORAGE_KEYS } from '../utils/storageKeys';
import type { SeasonProgressState } from '../utils/seasons';
import { cloudSaveComRetry, reagirContaExcluida } from '../utils/cloudSave';
import { pushProfile } from '../utils/community';
import type { CreatureStage, ElementId, AlignmentId, RealmId } from '../utils/oracle';
import type { StageSkills } from '../utils/soulProfile/ficha/skills';
import type { ClassTitle } from '../utils/soulProfile/ficha/classTitle';
import type { CompanheiroVisivel } from '../utils/soulProfile/ficha/companheiro';
import { sanitizeManifestacao, type Manifestacao } from '../utils/soulProfile/ficha/manifestacaoSave';
import type { FichaStage } from '../utils/soulProfile/ficha/types';
import type { SlotId } from '../utils/petStage';
import { ALL_SHOP_ITEMS } from '../utils/shop';
import { rollPetPassive } from '../utils/passives';
import { normalizeConsent, type ConsentRecord } from '../utils/consent';
import { migrateBranchIds } from '../utils/branchMigration';
import { normalizeSpriteLibrary, type SpriteLibrary } from '../utils/spriteLibrary';
import { mergeCareCaps, type CareCaps } from '../utils/careCaps';
import type { BondDailyLedger, BondDailyXP } from '../utils/bond';
import { meetsPvpBond } from '../utils/bond';
import { ACHIEVEMENT_IDS, gatilhoAntigoTasks100, type AchievementId } from '../utils/achievements';
import {
  resolvePlayerDayAnchor, sanitizePlayerDayAnchor, deviceOffsetMs,
  type PlayerDayAnchor,
} from '../utils/playerDay';
import type { Schedule, HabitAnchor, Effort, TaskStatus } from '../types/taskModel';
import type { HabitRhythm } from '../utils/habitRhythm';
import type { RestState } from '../utils/restWindow';
import { createRestState, MAX_NIGHTS } from '../utils/restWindow';
import type { NightmareState } from '../utils/nightmares';
import { createNightmareState } from '../utils/nightmares';
import type { PlayLog } from '../utils/petNeeds';
import type { StepsRecord } from '../utils/steps';
import { resolveLanguage } from '../utils/i18n';
import { soulmonDisplayName } from '../utils/petName';
import { normalizeFirstDay } from '../utils/firstDay';
import { sanitizeReview, type ReviewState } from '../utils/mente/revisao';
import { sanitizeRefugeInvite, type RefugeInviteState } from '../utils/refugio/convite';
import { normalizeCrossings } from '../utils/travessiasSave';
import type { CrossingsState } from '../types/travessias';
import type { WeeklyMissionProgress } from '../utils/weeklyMissions';
import {
  readLocal,
  writeLocal,
  readJson,
  removeLocal,
  onStorageDegraded,
  storageDegradedMessage,
} from '../utils/safeStorage';
import { toast } from 'sonner';
import { onboardingProfileFrom } from '../utils/catalogOnboarding';
import { normalizeEntries, type CadernoEntry } from '../utils/cadernoSave';
import { sanitizeSoulTestAnswers } from '../utils/soulTestAnswers';
import type { Answers } from '../utils/soulProfile/personality/types';

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

/**
 * HÁBITO — contrato de CONSTÂNCIA (ver types/taskModel.ts e utils/habitRhythm.ts).
 *
 * `weekDays` continua existindo e continua sendo escrito: é a interface com o
 * widget Android e com o app de desktop, que não carregam o motor novo. Quem
 * manda de verdade é `schedule`; `normalizeSchedule` lê um a partir do outro,
 * então save antigo (que só tem `weekDays`) funciona sem migração destrutiva.
 */
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
  /** Recorrência flexível: dias da semana, N× por semana, ou a cada N dias
   *  (contando da conclusão — o `every!` do Todoist, que impede acúmulo). */
  schedule?: Schedule;
  /** Implementation intention: "depois do café, na mesa da cozinha". */
  anchor?: HabitAnchor;
  /** Id do item do catálogo (`src/data/activityCatalog.ts`) que originou esta
   *  atividade. OPCIONAL: ausente = legado/custom ("criar do zero"). Save
   *  antigo hidrata sem este campo e continua funcionando exatamente como
   *  antes — nenhuma migração destrutiva (docs/PLANO-CATALOGO-ATIVIDADES.md §1). */
  catalogId?: string;
  /** Nível 1–3 do item do catálogo. Só tem sentido junto de `catalogId`. */
  level?: 1 | 2 | 3;
  /** ISO de quando `level` foi definido (onboarding ou aceite de convite).
   *  Ausente = "não observado" — `catalogLevelSignal` nunca assume tempo que
   *  não foi visto, então sem isto o item nunca sugere SUBIR (CAT-7,
   *  docs/PERGUNTAS-DO-DONO.md). Descer não depende deste campo. */
  catalogLevelSetAt?: string;
  /** ISO da última vez que a pessoa RECUSOU o convite de "deixar mais leve"
   *  para este item — cooldown de `LEVEL_DOWN_COOLDOWN_DAYS` antes de
   *  oferecer de novo (`utils/catalogLevel.ts`). */
  catalogLevelDeclinedAt?: string;
}

/**
 * TAREFA — contrato de EXECUÇÃO (ver utils/taskTriage.ts).
 *
 * Todos os campos novos são OPCIONAIS e têm padrão seguro: uma tarefa de save
 * antigo lê como `effort 1`, `status 'open'`, sem adiamentos e sem idade — ou
 * seja, exatamente o comportamento de antes. Isso é deliberado: se `daysStale`
 * caísse para uma data qualquer, o backlog inteiro de quem já joga apareceria
 * assombrado na primeira abertura depois do update, que é justamente a tela de
 * culpa que este trabalho existe para eliminar.
 */
export interface Task {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completed: boolean;
  deadline?: { date: string; time: string };
  alarm?: { type: '2h' | '1h' | '30min' | 'custom'; time?: string };
  steps?: Step[];
  /** 1 rápida · 2 média · 3 projeto. A recompensa escala com ISTO, nunca com a
   *  quantidade de itens — senão o jogo premia cadastrar tarefa trivial. */
  effort?: Effort;
  /** 'open' | 'someday' (inerte, não cobra) | 'dropped' (Won't Do, reversível). */
  status?: TaskStatus;
  /** Quando pretendo fazer — separado do prazo (Things 3). Só isto traz a
   *  tarefa para o Hoje; prazo distante não polui a tela. */
  startDate?: string;
  /** Contador de adiamentos, exibido na tarefa (Sunsama). Torna a evitação
   *  crônica um dado em vez de um sentimento. */
  postponedCount?: number;
  createdAt?: string;
  lastTouchedAt?: string;
  /** dayKey em que esta tarefa é um dos 3 focos do dia. */
  focusDate?: string;
}

export interface CompletedTask {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completedAt: string;
  /** Carregado da tarefa para o histórico: a meta do dia é ponderada por
   *  esforço e `completeTask` REMOVE a tarefa da lista — sem guardar o peso
   *  aqui, concluir uma tarefa de projeto derrubaria o total do dia de 3 para
   *  1 e a virada cobraria coração de quem fez tudo. */
  effort?: Effort;
  /** Era uma tarefa assombrada quando foi concluída (bônus de alívio). */
  wasHaunted?: boolean;
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
  /** 🔗 Vínculo — as recompensas COSMÉTICAS da escada (`utils/bond.ts`) já
   *  entregues. É a única coisa que a escada persiste: o NÍVEL nunca vai para
   *  o save (invariante 4 do módulo), é sempre `bondLevelFor(totalXP)`. */
  bondRewardsClaimed?: string[];
  /** 🔗 Ledger do teto diário SUAVE das fontes repetíveis (masmorra/torneio).
   *  Zera na virada como a energia — e o que zera é o TETO, nunca o `totalXP`.
   *  `day` é o dia do JOGADOR (`utils/playerDay.ts`), não o do aparelho. */
  bondDaily?: BondDailyLedger;
  powerPoints: number;
  harmonyPoints: number;
  benevolencePoints: number;
  lastResetDate: string;
  /** Id da forma atual na árvore do Soulmon: 'rookie' | '{champion|ultimate|mega}-{power|harmony|benevolence}' | 'ultra'
   *  (ver types/progression.ts). Único por jogador — o NOME de exibição vem de soulmonStages. */
  evolutionStage: string;
  /* ⚰️ `digivolutionSegments` e `digivolutionSegmentsNeeded` saíram em
     06/09/2026 (D5/WP4.1). Eram escritos em todo save e lidos por ninguém —
     o único consumidor era um par de props do `CompanionHUD` que o componente
     nunca desenhava. A chave continua no `localStorage` de quem já jogou; ela
     é órfã inofensiva, e está registrada aqui para ninguém reaproveitar o nome
     achando que herda um número vivo. O gate de evolução é
     `FORM_REQUIREMENTS[…].required` × `perfectDays`. */
  poopEventsScheduled: number[];
  poopEventsCompleted: number[];
  unlockedEvolutions: string[];
  degeneratedByHP: boolean;
  /**
   * WP1.12 — MICRO-POSSE NO DEMO.
   *
   * Quem entra pelo caminho grátis recebe um personagem PRÉ-PRONTO: os três
   * são iguais para todo mundo, e "meu bichinho" começa sendo o bichinho de
   * todo mundo. O tint é a menor coisa que transforma um personagem
   * emprestado em algo escolhido — e é COSMÉTICO, zero mecânica: nenhuma
   * regra, nenhum atributo e nenhum preço olham para ele.
   *
   * 0 = sem tint (o original). 1..3 = as três tonalidades.
   */
  demoTint?: number;
  /** WP4.8 — marcos de memória (30/90) já mostrados. Um "momento" que
   *  acontece duas vezes deixa de ser um momento. */
  memoriesShown?: number[];
  /** WP5.1 — semana ISO em que a oferta do value moment foi mostrada. O cap é
   *  sobre ter OFERECIDO, não sobre ter comprado. */
  offerShownWeek?: string;
  /** WP5.1 — o jogador dispensou o convite PARA SEMPRE (o `×` do card). É
   *  terminal de propósito: um "não" que o app pergunta de novo não era um
   *  não. Só o canal PROATIVO obedece; o card permanente da Loja fica, porque
   *  ele é a porta de descoberta VOLUNTÁRIA e ninguém tropeça nela. */
  offerDismissed?: boolean;
  /** WP4.10 — quando cada FORMA foi alcançada (dia do jogador). Insumo do
   *  álbum: a coleção deixa de ser lista e vira história. Save antigo não
   *  tem, e aí a forma aparece sem data — nunca com uma data inventada. */
  formReachedAt?: Record<string, string>;
  /** WP4.6 — inimigos da masmorra já enfrentados. Só cresce. */
  bestiary?: string[];
  /**
   * WP4.29 — A INCUBAÇÃO (D-G8b/D-G8c, 22/09/2026). `formId` → instante em que
   * aquela forma começou a incubar. Ficar apto abre a espera de
   * `INCUBATION_MIN_MS`; o gesto de evoluir só completa depois dela.
   *
   * **É "apto desde X", não "gerando desde X"** — não tem relação com o acervo
   * de sprites, de propósito (ver o efeito no `App.tsx` e a trava 2 de
   * `utils/spriteTrigger.ts`). E **o `since` de uma forma nunca é apagado
   * enquanto a criatura for a mesma**: degenerar e re-subir reaproveita o
   * relógio que já correu, senão o HP — única punição sancionada — passaria a
   * cobrar tempo sobre progresso (parecer R-L).
   *
   * Ausente = save anterior a esta versão, e `incubationReady` responde `true`
   * para forma sem registro: quem já estava apto não ganha um relógio novo.
   */
  incubation?: import('../utils/spriteTrigger').Incubation;
  /** WP1.3 — os três gestos do primeiro dia (`utils/firstDay.ts`). Some
   *  sozinho na virada; nunca vira lista de pendências. */
  firstDay?: import('../utils/firstDay').FirstDayProgress | null;
  /** WP4.19 — o pet já caiu por HP 0 e SUBIU de novo. É cosmético e só existe
   *  no sentido positivo: nada no app lê isto como "já caiu". */
  redeemed?: boolean;
  /** WP4.19 — exibir a marca da volta é escolha do jogador (padrão: não).
   *  O app não decide contar isso por ninguém. */
  showRedeemed?: boolean;
  /** TORC-5 (02/10/2026) — opt-out da lista PÚBLICA do Torneio (apelido +
   *  Soulmon). `true` = a pessoa saiu. O padrão é APARECER (ausente = false):
   *  o sistema inteiro assume PvP automático, e quem quiser sai em
   *  Configurações → Seus dados. O servidor é quem faz valer (`publicHidden`). */
  hideFromPublicList?: boolean;
  currentBranch: 'power' | 'harmony' | 'benevolence';
  lastDayWasPerfect: boolean;
  maxActivityCap: number;
  /** Não é mais escolha do jogador (era o "tipo de ovo") — hoje é a linha de
   *  sprite GENÉRICO sorteada uma vez no onboarding (utils/sprites.ts), usada
   *  como visual provisório até a Fase 2 (imagem gerada por IA) assumir. */
  eggType?: 'ignar' | 'lumel' | 'serah';
  /** A árvore de 11 formas ÚNICA do jogador, gerada pelo oráculo no onboarding
   *  (utils/oracle.ts generateOracle().creature.stages) e congelada — nomes,
   *  descrições e prompts de imagem de cada forma. */
  soulmonStages?: CreatureStage[];
  /** Acervo de sprites GERADOS por forma + estado da adoção do visor
   *  (`utils/spriteLibrary.ts`, spec `soulmon-02/spec-geracao-incremental.md`).
   *  Guarda **só a URL** de cada forma (~120 bytes): base64 aqui iria ao
   *  localStorage e subiria à KV a cada
   *  debounce de 3 s (`custo-geracao-sprite.md` §4). */
  spriteLibrary?: SpriteLibrary;
  /** As duas skills de cada estágio. Persistidas junto das formas porque o
   *  perfil do oráculo (`soulmon-profile`) vive só no localStorage e NÃO vai
   *  na nuvem: num aparelho novo a página do Pet perdia metade do conteúdo
   *  em silêncio. Determinísticas — recomputáveis, mas não a partir de nada. */
  soulmonSkills?: Record<FichaStage, StageSkills>;
  /** A classe de cada estágio — arquétipo REAL do class-system (emergido da
   *  ficha, nunca escolhido), mesmo motivo de cache que `soulmonSkills`. */
  soulmonClassTitles?: Record<FichaStage, ClassTitle>;
  /** O companheiro capturado pela ficha (`ficha/capture.ts`, mecânica real do
   *  class-system), reduzido ao que se MOSTRA — id e nome PT+EN, nunca poder
   *  nem afinidade (`ficha/companheiro.ts`). Mesmo motivo de cache que
   *  `soulmonSkills`: determinístico pela identidade, recomputável só de um
   *  perfil que não vai à nuvem. Decisão 2 do PLANO-ORACULO.md §9. */
  soulmonCompanheiro?: CompanheiroVisivel;
  /** Talento e profissão da ficha por estágio (`ficha/manifestacao.ts`) — o
   *  que o class-system MANIFESTA (fala do pet, jeito na masmorra) sem que a
   *  ficha apareça. Cache pelo mesmo motivo de `soulmonSkills`; preenchido
   *  pelo `App` a partir do perfil local na primeira abertura. */
  soulmonManifestacao?: Manifestacao;
  /** Metadados do oráculo usados fora da árvore (fallback de sprite genérico,
   *  telas de perfil etc.). */
  soulmonMeta?: {
    seed?: number;
    baseName: string;
    /** O nome que o JOGADOR deu à criatura no cadastro (`utils/petName.ts`).
     *  Ausente nos saves antigos e em quem manteve a sugestão — quem lê usa
     *  `soulmonDisplayName`, que cai no `baseName`. Nunca sobrescreve o
     *  `baseName`: a bio, a linhagem e a página do Oráculo continuam falando
     *  do nome da espécie. */
    petName?: string;
    dominantElement?: ElementId;
    dominantAlignment?: AlignmentId;
    dominantRealm?: RealmId;
    /** Criatura de arte fixa adotada no lugar da gerada. Hoje só existe o
     *  corvinho do administrador (`utils/corvoPet.ts` › `adoptCorvo`);
     *  qualquer outro valor é descartado no load. */
    creature?: 'corvo';
  };
  /**
   * O DIA em que esta criatura nasceu — dia do JOGADOR (`utils/playerDay.ts`),
   * gravado UMA vez no fim do onboarding (WP1.16).
   *
   * Ausente nos saves anteriores a 06/09/2026, e nesses **nunca é inferido**:
   * "há 40 dias" calculado de uma data que não é a do nascimento é pior que
   * não dizer nada, e o app não tem como saber. Sem `bornAt` não há cartão de
   * nascimento e não há aniversário — e isso é aceitável, porque o campo só
   * alimenta coisas que ninguém sente falta de não ter.
   *
   * **O upgrade NÃO reescreve este campo** (decisão D17: "trocou de pele",
   * não "nasceu de novo"): quem joga há 40 dias continua tendo 40 dias juntos
   * depois de comprar. É o único número do produto que só sobe, e comprar não
   * pode zerá-lo.
   */
  bornAt?: string;
  /** Attribute points accumulated since the last evolution — drives branch selection */
  attributesSinceLastEvolution: { power: number; harmony: number; benevolence: number };
  /** Version B: food stockpile keyed by food emoji */
  foodInventory: Record<string, number>;
  /** Indices of scheduled poop events that actually appeared on screen (so sleep-skipped ones don't penalize). */
  poopEventsShown: number[];
  /** Epoch ms clock for the "uncleaned poop drains 1 heart / 6h" penalty (0 = inactive). */
  poopPenaltyClockAt: number;
  /** Quanto o dreno de cocô já cobrou no dia civil — é o que faz o teto ser
   *  DIÁRIO (regra em `utils/poopDrain.ts`). */
  poopDrainCharge?: { day: string; hearts: number };
  /** Quantos 🌀 Glitchtama foram usados no DIA DO JOGADOR — o teto que impede
   *  a masmorra de comprar a escada de evolução (`utils/specialItemUse.ts`). */
  glitchtamaUse?: { day: string; used: number };
  /** Bits de MINIJOGO já creditados no DIA DO JOGADOR — o teto que a decisão
   *  #61/#63 pede (`utils/currencies.ts` › `MINIGAME_BITS_PER_DAY`). Os Bits do
   *  dia completo NÃO passam por aqui. */
  minigameBits?: { day: string; earned: number };
  /**
   * P2 — a folga da semana (`REST_DAYS_PER_WEEK`, `utils/dailyReset.ts`).
   *
   * Opcionais porque save antigo não os tem, e a ausência tem de significar
   * "folga inteira", nunca "folga já gasta": quem já jogava não pode herdar uma
   * dívida retroativa de um mecanismo que nem existia.
   */
  restDaysLeft?: number;
  /** A semana (segunda, `AAAA-MM-DD`) a que `restDaysLeft` pertence. */
  restWeekKey?: string;
  /**
   * O diário de aventuras (`utils/adventure.ts`) — o que a criatura trouxe de
   * cada noite, com a data da PRIMEIRA vez. É coleção narrativa e **não paga
   * nada**: nenhum Bit, item ou atributo depende deste campo, e nada no jogo o
   * lê para conceder recompensa. Se um dia alguém amarrar economia aqui, terá
   * transformado o relatório noturno num lugar onde a pessoa perde coisa por
   * não abrir.
   */
  adventures?: Array<{ id: string; day: string }>;
  /**
   * Tetos de cuidado — comida por hora e carinho por dia (`utils/careCaps.ts`).
   *
   * Moravam no `localStorage`, ou seja, UM contador por APARELHO: com PWA e APK
   * o mesmo jogador tinha 2 corações/dia e 12 comidas/hora em vez de 1 e 6. No
   * save eles são um contador por JOGADOR. As regras seguem em
   * `utils/careRules.ts` — aqui só mudou de onde o estado vem.
   */
  careCaps?: CareCaps;
  /** Bits (🪙): minigame currency earned in the Activities games, spent in the shop. */
  gamePoints: number;
  /** Emblemas: moeda do Torneio (utils/currencies.ts). Só compra itens da aba
   *  de torneio da loja — não se mistura com Bits nem Créditos. */
  emblems?: number;
  /** WP4.7 — progresso das 3 missões da semana (`utils/weeklyMissions.ts`).
   *  Semana nova zera sozinha na leitura (`forWeek`), então não há migração. */
  weeklyMissions?: WeeklyMissionProgress;
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
  /** Tournament: PvP assíncrono (aparece como oponente pra outros e pode desafiar).
   *  ⚠️ Desde 02/10/2026 (H13) NÃO é mais interruptor: todo personagem nasce com
   *  `true` e o load força `true` (REGISTRO §20.6). O que decide se a pessoa
   *  entra de fato no diretório é o gate de Vínculo 5, do SERVIDOR. O campo
   *  fica no save/no tipo para o servidor e os testes seguirem lendo-o. */
  pvpEnabled?: boolean;
  /** Troféus de season do Tournament (top 3 no fim de cada season). */
  trophies?: Array<{ season: string; place: 1 | 2 | 3 }>;
  /** Amigos aceitos (até 5) — ids de perfil público (mesmo id do cloud save). */
  friends?: string[];
  /** Mission counters (lifetime, cloud-synced) — see utils/missions.ts. */
  dungeonKills?: number;
  dungeonRunsCompleted?: number;
  dinoBest?: number;
  /** 🧠 Revisão da Malha (Ateliê da Mente, 30/09/2026): os cartões que o
   *  jogador escreve e a caixa de Leitner de cada um. Dono único da regra e da
   *  higienização: `utils/mente/revisao.ts`. Mora no save (e não no aparelho)
   *  porque é conteúdo da pessoa — perder ao trocar de celular seria perder
   *  o que ela escreveu. */
  review?: ReviewState;
  /** 🫧 Convite ao Refúgio (30/09/2026): só DATAS e a contagem de dispensas —
   *  nunca o humor que o disparou (dado sensível). Dono: `utils/refugio/convite.ts`. */
  refugeInvite?: RefugeInviteState;
  /** 🧭 Passeio e Travessias (30/09/2026, `docs/REGISTRO-DE-DECISOES.md` §5.6):
   *  regiões abertas, a Travessia escolhida, os "Fiz" guardados, o destino do
   *  Passeio e o interruptor. Só ids, enum e `dayKey` — nada de texto livre,
   *  lugar ou foto (parecer 04 R-4). Dono: `utils/travessias.ts`. **Nenhum
   *  sistema do núcleo lê este campo** (meta, HP, `perfectDays`, evolução,
   *  Vínculo, missões, Bits, Emblemas) — há contrato. Leitura: `?? CROSSINGS_EMPTY`. */
  crossings?: CrossingsState;
  /** 📓 O CADERNO (04/10/2026, decisão do dono: vai para o save na nuvem do titular). As anotações de
   *  journaling — texto livre, até 120 entradas de 2000 caracteres. ⚠️ **DADO SENSÍVEL**: nunca entra
   *  em payload de IA/chat, telemetria, métricas, perfil público ou guilda (contrato
   *  `cadernoSensivel.contract.test.ts`); entra na exportação e some com a exclusão da conta. Nada
   *  rende (sem Bits/XP/selo). Dono: `utils/cadernoSave.ts`. Leitura: `?? []`. */
  caderno?: CadernoEntry[];
  /** Dias completos REAIS (virada). ⚠️ Desde a decisão #41/#60 (22/09/2026) o
   *  🌀 Glitchtama NÃO entra aqui — é ele que `utils/achievements.ts` lê. */
  totalPerfectDays?: number;
  /** Dias completos para a MISSÃO `mission-perfect-30`: reais + 🌀 (#41/#60).
   *  Chave NOVA — linha vermelha #20 (save só ACRESCENTA). */
  missionPerfectDays?: number;
  /** Conquistas abertas por um gatilho que NÃO existe mais, gravadas UMA vez na
   *  migração do load (`hydrateSave`) para quem já as tinha. Hoje só
   *  `'dias-completos-30'` (ex-`tasks-100`, decisão #30, 21/09/2026). É a única
   *  conquista persistida — todas as outras são derivadas (`utils/achievements.ts`). */
  conquistasHerdadas?: AchievementId[];
  /** Estado da estação corrente (`utils/seasons.ts`). Fiado em 06/09/2026
   *  (WP4.16): o módulo existia inteiro e nunca era chamado por ninguém. */
  season?: SeasonProgressState;
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
    /** Escudos de descanso consumidos na virada (WP2.15). */
    shieldsSpent?: number;
    daysAway?: number;
    /** Virada de segunda: ganhou o meio coração do alívio semanal. */
    weeklyRelief?: boolean;
    /** Já usou o "esqueci de marcar" deste relatório (1× por dia). */
    heartsRecovered?: boolean;
    /** P2 — a folga da semana absorveu a perda desta virada. A UI CONTA isso:
     *  perdão que a pessoa não soube que recebeu não acalma, e faz a cobrança
     *  da semana seguinte parecer arbitrária. */
    restDayUsed?: boolean;
    /** Folgas restantes na semana, depois desta virada. */
    restDaysLeft?: number;
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
   * 01/10/2026 — as FORÇAS e o que ATRAPALHA escolhidos no onboarding, como
   * ids do catálogo (`types/activityCatalog.ts`). Lido por `derivePersonality`
   * (a personalidade do Soulmon). Opcional: save de antes do onboarding novo
   * não tem, e o upgrade não pergunta. Dono do formato:
   * `onboardingProfileFrom` (`utils/catalogOnboarding.ts`).
   */
  onboardingProfile?: { strengths: string[]; struggles: string[] };
  /**
   * 01/10/2026 (decisão do dono) — as 20 respostas do teste longo, gravadas
   * nos DOIS caminhos (no grátis eram descartadas). Formato `Answers`, o mesmo
   * que o ritual pago entrega a `buildSoulProfile`. Lido pelo ritual de
   * upgrade, que pula o teste quando as 20 existem. Opcional: save anterior
   * não tem. Dono do formato: `utils/soulTestAnswers.ts`. Declarado em
   * `public/privacidade.html`.
   */
  soulTestAnswers?: Answers;
  /**
   * Prova do consentimento aceito no onboarding: quando (ISO) e QUAL versão de
   * cada documento. Um booleano não diz a que texto a pessoa disse sim.
   * **Opcional de propósito**: save anterior aos Termos não tem o campo, e
   * ausência aqui nunca pode virar bloqueio (utils/consent.ts).
   */
  consent?: ConsentRecord;
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
  /** Renascimento (utils/rebirth.ts). Existe UMA vez por save e nunca é
   *  apagado: é o próprio registro que impede a segunda vez. Ausente =
   *  jamais renasceu (nunca inferido de estágio nem de nada). */
  rebirth?: import('../utils/rebirth').RebirthRecord | null;
  /** Modo demo: qual personagem pré-pronto foi escolhido (utils/monetization.ts). */
  demoCharacterId?: 'kaelen' | 'orrin' | 'thalindra' | 'igni' | 'nautilu' | 'astrase';
  /** Créditos (moeda premium, dinheiro real) — reroll de personagem, cura
   *  instantânea de coração, itens/cenários da loja. */
  credits?: number;
  /**
   * Histórico de constância por hábito (utils/habitRhythm.ts), chaveado pelo id
   * da Activity. Fica SEPARADO da `Activity` de propósito: a virada do dia
   * reescreve o array inteiro de atividades (`resetActivities`), e um histórico
   * morando lá dentro seria reconstruído a cada dia sob risco de perder o
   * acumulado — que é justamente o único dado que não pode se perder, porque é
   * o que sustenta os 66 dias de maturidade.
   */
  habitRhythms?: Record<string, HabitRhythm>;
  /**
   * Janela de Descanso + coleção de Sonhos (utils/restWindow.ts). Guarda só
   * agregados por noite (deitou/acordou/entrou na janela) — nunca série bruta
   * de sensor. Isso mantém o app fora do escopo de dado sensível da LGPD e
   * fora das exigências de health app do Google Play.
   */
  rest?: RestState;
  /**
   * O FUSO FIXO em que o dia do jogador é contado (`utils/playerDay.ts`).
   *
   * Gravado uma vez, no primeiro load, e daí em diante ESTÁVEL: é a estabilidade
   * que faz dois aparelhos concordarem sobre qual dia é hoje. Consumido só pelos
   * quatro registros diários que moram no save e têm teto — `careCaps.rubHeal`,
   * `lastCheckInDate`, `moodLog` e `poopDrainCharge`. O motor de hábitos, a
   * streak e a virada continuam em `dayKeyOf`, que NÃO pode mudar.
   */
  playerDayTz?: PlayerDayAnchor;
  /** dayKey do último check-in matinal concluído (evita repetir no mesmo dia). */
  lastCheckInDate?: string;
  /** dayKey do último relatório semanal mostrado. */
  lastWeeklyReportDate?: string;
  /** dayKey do último "recomeço" (fresh start) proposto e aceito. */
  lastFreshStartDate?: string;
  /**
   * Combate a pesadelos (utils/nightmares.ts) — a face JOGÁVEL da noite, ao
   * lado do sonho, que é a coleção. Guarda só as manhãs já combatidas (teto de
   * 30): pesadelo não combatido EXPIRA sem custo, então não há fila, dívida nem
   * contador que zera para persistir.
   */
  nightmares?: NightmareState;
  /**
   * Brincar (utils/petNeeds.ts): a data da última brincadeira e o buff de Bits
   * do próximo minijogo. NUNCA pode ser lido por dia perfeito, HP ou evolução —
   * no instante em que for, a oferta vira obrigação diária.
   */
  playLog?: PlayLog;
  /**
   * Passos (utils/steps.ts). SÓ o agregado do dia (`{date, baseline, today}`) —
   * nunca a série bruta, nunca horário, nunca localização. Passo não pontua
   * sozinho: ele só confirma um hábito de saúde já marcado como feito.
   */
  steps?: StepsRecord;
  /**
   * Resposta do usuário à tela de consentimento de passos. `'declined'` é
   * PERMANENTE de propósito: sem esta marca o app perguntaria de novo a cada
   * abertura para quem já recusou, o que é assédio — e uma recusa que não é
   * respeitada não é uma recusa.
   */
  stepsConsent?: 'granted' | 'declined';
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
/** Mapa simples (nunca array, nunca null) — mesma defesa do `arr` para records. */
const obj = <T,>(v: unknown): Record<string, T> =>
  (v && typeof v === 'object' && !Array.isArray(v)) ? (v as Record<string, T>) : {};

/**
 * Pesadelos: `fought` PRECISA ser array de string — `hasPendingNightmare` faz
 * `.includes` nele já no primeiro render da manhã, e um `fought: {}` vindo da
 * nuvem derrubaria a árvore antes de qualquer tela aparecer.
 */
function hydrateNightmares(v: unknown): NightmareState {
  const base = createNightmareState();
  const raw = obj<unknown>(v);
  const fought = arr<unknown>(raw.fought).filter((x): x is string => typeof x === 'string');
  const pending = typeof raw.pending === 'string' ? raw.pending : undefined;
  return pending ? { fought, pending } : { ...base, fought };
}

/**
 * Brincar: sem `date` válido não existe registro (o campo é obrigatório em
 * `PlayLog`, e um log sem data faria `playedToday` mentir nos dois sentidos).
 * Buff com `expiresAt` inválido é descartado — `activeBuff` já trata isso, mas
 * um multiplicador não-numérico multiplicaria Bits por `NaN`.
 */
function hydratePlayLog(v: unknown): PlayLog | undefined {
  const raw = obj<unknown>(v);
  if (typeof raw.date !== 'string' || !raw.date) return undefined;
  const b = obj<unknown>(raw.buff);
  const okBuff = b.kind === 'minigame'
    && typeof b.expiresAt === 'string'
    && typeof b.multiplier === 'number' && Number.isFinite(b.multiplier)
    && (b.attribute === 'power' || b.attribute === 'harmony' || b.attribute === 'benevolence');
  return okBuff
    ? { date: raw.date, buff: b as unknown as NonNullable<PlayLog['buff']> }
    : { date: raw.date };
}

/** String opcional: qualquer outra coisa vira `undefined` (= "não tem"). */
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

/** Lista de strings — descarta silenciosamente item que não é string. */
const strArr = (v: unknown): string[] =>
  arr<unknown>(v).filter((x): x is string => typeof x === 'string');

/**
 * 🔗 O ledger do teto diário do Vínculo, higienizado.
 *
 * Tudo que não for número finito e positivo vira ZERO — nunca `NaN` e nunca
 * negativo. O sentido é assimétrico de propósito: teto gasto que o save não
 * consegue provar é teto NÃO gasto. Um `spent` corrompido que virasse `NaN`
 * faria `applyBondXP` devolver `room = NaN` e o jogador perderia o XP do dia
 * inteiro por causa de um campo torto — o oposto de um teto suave.
 *
 * Fonte desconhecida no `spent` é descartada: o ledger guarda SÓ as fontes com
 * teto, e é isso que o impede de virar histórico (nada de streak aqui).
 */
const hydrateBondDaily = (v: unknown): BondDailyLedger => {
  const raw = obj<unknown>(v);
  const spentRaw = obj<unknown>(raw.spent);
  const spent: BondDailyXP = {};
  for (const fonte of ['dungeon', 'tournament'] as const) {
    const n = num(spentRaw[fonte], 0);
    if (n > 0) spent[fonte] = n;
  }
  return { day: typeof raw.day === 'string' ? raw.day : '', spent };
};

/**
 * Um passo de checklist. `completed` só é `true` quando o save diz `true` —
 * `activity.steps.every(s => s.completed)` decide conclusão de hábito, então
 * inventar `true` a partir de lixo daria dia perfeito de graça.
 */
function hydrateStep(v: unknown, i: number): Step {
  const raw = obj<unknown>(v);
  return {
    id: str(raw.id) ?? `step-${i}`,
    label: str(raw.label) ?? '',
    completed: raw.completed === true,
  };
}

/**
 * Uma ATIVIDADE do save.
 *
 * `computeDailyReset` faz `activity.steps.length` e `activity.steps.map(...)`
 * na virada — uma atividade sem `steps` (save de cliente antigo, que é
 * literalmente uma das fixtures do fuzz) lança DENTRO do updater, no mount:
 * mesma tela branca permanente dos outros dois buracos. Item sem `id` string é
 * DESCARTADO — sem id ele não pode ser marcado, editado nem apagado pela UI, e
 * `habitRhythms` não teria chave para ele.
 */
function hydrateActivity(v: unknown): Activity | null {
  const raw = obj<unknown>(v);
  const id = str(raw.id);
  if (!id) return null;
  return {
    ...(raw as object),
    id,
    name: str(raw.name) ?? '',
    category: raw.category as ActivityCategory,
    emoji: str(raw.emoji) ?? '⭐',
    steps: arr<unknown>(raw.steps).map(hydrateStep),
    // A ponte com o widget Android e o desktop lê `weekDays` direto.
    weekDays: numArr(raw.weekDays),
    completedToday: raw.completedToday === true,
    lastCompletedDate: str(raw.lastCompletedDate),
  } as Activity;
}

/** Uma TAREFA. Mesmo motivo: `steps` é percorrido sem checagem na UI. */
function hydrateTask(v: unknown): Task | null {
  const raw = obj<unknown>(v);
  const id = str(raw.id);
  if (!id) return null;
  return {
    ...(raw as object),
    id,
    name: str(raw.name) ?? '',
    category: raw.category as ActivityCategory,
    emoji: str(raw.emoji) ?? '⭐',
    completed: raw.completed === true,
    ...(raw.steps !== undefined ? { steps: arr<unknown>(raw.steps).map(hydrateStep) } : {}),
  } as Task;
}

/**
 * Histórico de tarefas concluídas — alimenta `carePattern`, o foco do dia e a
 * contagem do ranking público.
 *
 * Aqui a régua é DELIBERADAMENTE mais frouxa que a de `activities`/`tasks`:
 * este array é HISTÓRICO, e histórico descartado não volta. Saves antigos
 * guardavam entradas com formatos diferentes (até só o id) e nenhum consumidor
 * lança em cima delas — ler `.completedAt` de uma string devolve `undefined`,
 * não um erro. Só o que é NULLISH é removido, porque só isso lança de fato
 * (`null.completedAt`).
 */
function hydrateCompletedTask(v: unknown): unknown {
  if (v === null || v === undefined) return null;
  if (typeof v !== 'object' || Array.isArray(v)) return v;
  const raw = v as Record<string, unknown>;
  return {
    ...raw,
    ...(str(raw.emoji) === undefined ? { emoji: '⭐' } : {}),
    ...(str(raw.name) === undefined ? { name: '' } : {}),
  };
}

/** Lista de números finitos — descarta o resto (índices, ids numéricos). */
const numArr = (v: unknown): number[] =>
  arr<unknown>(v).filter((x): x is number => typeof x === 'number' && Number.isFinite(x));

/** Decoração equipada: um id de item (string) por espaço do palco. */
function hydrateDecor(v: unknown): Partial<Record<SlotId, string>> {
  const out: Partial<Record<SlotId, string>> = {};
  for (const [slot, id] of Object.entries(obj<unknown>(v))) {
    if (typeof id === 'string') out[slot as SlotId] = id;
  }
  return out;
}

/**
 * Descanso: `nights`, `dreams` e `window` PRECISAM existir com o tipo certo.
 *
 * Um `rest: {}` vindo da nuvem (ou de um cliente antigo) passava pelo teste de
 * "é objeto" e explodia no PRIMEIRO render: `restConstancy` faz
 * `state.nights.filter(...)` e roda a cada render via `tiredness`;
 * `hasPendingNightmare` faz `rest.nights.find(...)` já no efeito da manhã. Como
 * `hydrateSave` não lança nesse caminho, o try/catch do inicializador não
 * resgata — a árvore desmonta no render e toda carga seguinte lê o mesmo save,
 * que é a tela branca PERMANENTE deste arquivo.
 *
 * Noite malformada é DESCARTADA (item sem `date` string não é registro de nada);
 * `onTime` inválido vira `false`, que é o valor NEUTRO — jamais inventar um
 * "dormiu no horário" que não aconteceu.
 */
function hydrateRest(v: unknown, anchor?: PlayerDayAnchor): RestState {
  const base = createRestState();
  const raw = obj<unknown>(v);

  const w = obj<unknown>(raw.window);
  const window = (typeof w.start === 'string' && typeof w.end === 'string')
    ? { start: w.start, end: w.end }
    : base.window;

  const nights = arr<unknown>(raw.nights)
    .map((n) => obj<unknown>(n))
    .filter((n) => typeof n.date === 'string' && n.date)
    .map((n) => ({
      date: n.date as string,
      ...(typeof n.sleptAt === 'string' ? { sleptAt: n.sleptAt } : {}),
      ...(typeof n.wokeAt === 'string' ? { wokeAt: n.wokeAt } : {}),
      onTime: n.onTime === true,
    }))
    .slice(-MAX_NIGHTS);

  return {
    window,
    nights,
    dreams: strArr(raw.dreams),
    // ⚠️ `dreamDates` (WP4.10, a PRIMEIRA data de cada sonho) era descartado
    // AQUI a cada load: `rollDream` carimbava, o save gravava, e a próxima
    // abertura do app apagava — a coleção inteira voltava a "sem data"
    // (achado em 20/09/2026, ao ligar o "#NN · data" do Dex). Só entradas
    // string→string; o resto some, nunca vira data inventada.
    ...(() => {
      const d = Object.fromEntries(Object.entries(obj<unknown>(raw.dreamDates))
        .filter((e): e is [string, string] => typeof e[1] === 'string' && e[1].length > 0));
      return Object.keys(d).length ? { dreamDates: d } : {};
    })(),
    // `hideMetrics` é switch de apresentação: só o `true` explícito o liga.
    ...(raw.hideMetrics === true ? { hideMetrics: true } : {}),
    // A âncora do load VENCE a que veio no save do `rest`: a do `GameState` é a
    // resolvida (e é ela que persiste), e ter duas discordando dentro do mesmo
    // save seria pior que não ter nenhuma.
    ...(anchor ? { playerDayTz: anchor } : {}),
  };
}

/**
 * Uma entrada de `habitRhythms`.
 *
 * `obj()` validava só o CONTÊINER, então `{ "a": {} }` ou `{ "a": 5 }` passavam
 * inteiros. `computeDailyReset` faz `rhythms[id] ?? emptyRhythm()` — e `{}` não
 * é nullish, logo flui direto para `applyMissedDay`, que faz
 * `rhythm.done.includes(...)` e lança DENTRO do updater da virada, no mount.
 * Mesma tela branca. Aqui cada campo é normalizado; entrada que não é objeto
 * simples vira ritmo vazio (nunca é propagada).
 */
function hydrateRhythm(v: unknown): HabitRhythm {
  const raw = obj<unknown>(v);
  const done = strArr(raw.done);
  return {
    done,
    missed: strArr(raw.missed),
    shielded: strArr(raw.shielded),
    shields: Math.max(0, Math.floor(num(raw.shields, 0))),
    // Nunca menor que o histórico visível: `totalDone` alimenta os marcos e a
    // poda dos 120 dias só pode fazê-lo crescer em relação a `done`.
    totalDone: Math.max(done.length, Math.floor(Math.max(0, num(raw.totalDone, 0)))),
    ...(typeof raw.lastCompletedDate === 'string' ? { lastCompletedDate: raw.lastCompletedDate } : {}),
  };
}

function hydrateRhythms(v: unknown): Record<string, HabitRhythm> {
  const out: Record<string, HabitRhythm> = {};
  for (const [id, r] of Object.entries(obj<unknown>(v))) out[id] = hydrateRhythm(r);
  return out;
}

/**
 * O fuso IANA que o onboarding já colheu — a cidade de NASCIMENTO declarada no
 * ritual, que o mapa astral consome (`SoulOnboardingData.timeZone`).
 *
 * Reuso deliberado: é o único fuso que o jogador já declarou explicitamente, ele
 * sabe de horário de verão, e não custa nenhuma pergunta nova. O perfil mora no
 * `localStorage` deste aparelho, mas o que sai daqui vai para o SAVE — é a
 * PRIMEIRA leitura que importa; da segunda em diante o save manda.
 *
 * Todo o corpo é defensivo porque o perfil é JSON de disco: ausente, de versão
 * antiga, ou de quem pulou o caminho pago (`birthCity` indefinido → sem
 * `soulProfile`). Nesses casos devolve `undefined` e a âncora cai no offset do
 * aparelho, que é o fallback previsto.
 */
function onboardingTimeZone(): string | undefined {
  try {
    const saved = readJson<unknown>(STORAGE_KEYS.SOULMON_PROFILE, undefined);
    const perfil = obj<unknown>(obj<unknown>(saved).soulProfile);
    const tz = obj<unknown>(perfil.onboarding).timeZone;
    return typeof tz === 'string' && tz.length > 0 ? tz : undefined;
  } catch {
    return undefined;
  }
}

/** Passos: só o agregado do dia, e só com os três campos no tipo certo. */
function hydrateSteps(v: unknown): StepsRecord | undefined {
  const raw = obj<unknown>(v);
  if (typeof raw.date !== 'string' || !raw.date) return undefined;
  return {
    date: raw.date,
    baseline: Math.max(0, num(raw.baseline, 0)),
    today: Math.max(0, num(raw.today, 0)),
  };
}

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
function hydrateSave(rawState: Partial<GameState>): GameState {
  // Ids de caminho antigos (29/09/2026) → novos. Porta única do load: o
  // localStorage e a nuvem passam os dois por aqui.
  const loadedState = migrateBranchIds(rawState);
  const savedEggType = readLocal(STORAGE_KEYS.EGG_TYPE) as GameState['eggType'] | null;
  const maxHP = getMaxHPForStage(loadedState.evolutionStage ?? 'rookie');
  // A âncora é resolvida UMA vez e distribuída — ver a nota longa em
  // `playerDayTz`, abaixo. `rest` recebe a MESMA referência de propósito: duas
  // âncoras resolvidas em pontos diferentes do load poderiam divergir (basta o
  // relógio virar entre as duas linhas) e passariam a nomear a mesma noite de
  // dois jeitos, que é exatamente o defeito que esta família fecha.
  const ancoraDoDia = resolvePlayerDayAnchor(
    sanitizePlayerDayAnchor(loadedState.playerDayTz),
    onboardingTimeZone(),
    new Date(),
  );
  return {
        ...loadedState,
        // Não basta ser array: cada ITEM é percorrido sem checagem (a virada faz
        // `activity.steps.length`). Item irrecuperável é DESCARTADO.
        activities: arr<unknown>(loadedState.activities)
          .map(hydrateActivity).filter((a): a is Activity => a !== null),
        tasks: arr<unknown>(loadedState.tasks)
          .map(hydrateTask).filter((t): t is Task => t !== null),
        completedTasks: arr<unknown>(loadedState.completedTasks)
          .map(hydrateCompletedTask).filter((t) => t !== null) as CompletedTask[],
        // Só a entrada NULLISH sai (`null.completionCount` lança); o resto é
        // completado, nunca descartado. Uma forma antiga guardava um NÚMERO
        // cru por atividade (`{a1: 12}`); a leitura defensiva fica porque save
        // é dado NÃO CONFIÁVEL (vem da nuvem, pode ter sido editado à mão),
        // e ninguém lança lendo `.completionCount` de um número.
        // ⚠️ A justificativa antiga era "perder histórico de quem já joga" —
        // não havia quem (07/09/2026). O motivo que sobra é robustez, e ele
        // basta.
        activityStats: Object.fromEntries(
          Object.entries(obj<unknown>(loadedState.activityStats))
            .filter(([, s]) => s !== null && s !== undefined)
            .map(([id, s]) => {
              if (typeof s !== 'object' || Array.isArray(s)) return [id, s];
              const e = s as Record<string, unknown>;
              return [id, {
                ...e,
                name: str(e.name) ?? id,
                emoji: str(e.emoji) ?? '⭐',
                completionCount: Math.max(0, num(e.completionCount, 0)),
              }];
            }),
        ) as ActivityStats,
        maxHealthPoints: maxHP,
        // Save sem HP é save corrompido, não save de quem estava mal: começa
        // cheio. O oposto (0) degeneraria o pet na primeira virada por causa de
        // um campo ausente.
        healthPoints: Math.min(maxHP, Math.max(0, num(loadedState.healthPoints, maxHP))),
        totalXP: num(loadedState.totalXP, 0),
        // 🔗 Vínculo. Padrão `?? vazio` — save de quem já joga não pode chegar
        // com recompensa marcada como entregue nem com o teto do dia já gasto.
        // `bondLevel` é apagado de propósito: se um save (ou um cliente
        // adulterado) trouxer o nível gravado, ele NÃO entra no estado — nível
        // é derivado, sempre (footgun 9).
        bondRewardsClaimed: strArr(loadedState.bondRewardsClaimed),
        bondDaily: hydrateBondDaily(loadedState.bondDaily),
        bondLevel: undefined,
        powerPoints: num(loadedState.powerPoints, 0),
        harmonyPoints: num(loadedState.harmonyPoints, 0),
        benevolencePoints: num(loadedState.benevolencePoints, 0),
        lastResetDate: typeof loadedState.lastResetDate === 'string'
          ? loadedState.lastResetDate : new Date().toDateString(),
        evolutionStage: typeof loadedState.evolutionStage === 'string'
          ? loadedState.evolutionStage : 'rookie',
        energyPoints: num(loadedState.energyPoints, 0),
        perfectDays: num(loadedState.perfectDays, 0),
        lastDayWasPerfect: loadedState.lastDayWasPerfect === true,
        // Índices de evento: só números finitos. Um `'x'` aqui vira `NaN` em
        // toda comparação de agendamento e o cocô nunca mais aparece.
        poopEventsScheduled: numArr(loadedState.poopEventsScheduled),
        poopEventsCompleted: numArr(loadedState.poopEventsCompleted),
        unlockedEvolutions: (() => {
          const u = strArr(loadedState.unlockedEvolutions);
          return u.length > 0 ? u : ['rookie'];
        })(),
        degeneratedByHP: loadedState.degeneratedByHP === true,
        firstDay: normalizeFirstDay(loadedState.firstDay) ?? undefined,
        // WP4.10/WP4.6 — coleções novas. `?? {}` / `?? []` porque save antigo
        // não tem: ausência é "ainda não", nunca erro.
        formReachedAt: (loadedState.formReachedAt as Record<string, string>) ?? {},
        bestiary: strArr(loadedState.bestiary),
        offerShownWeek: typeof loadedState.offerShownWeek === 'string' ? loadedState.offerShownWeek : undefined,
        offerDismissed: loadedState.offerDismissed === true,
        demoTint: num(loadedState.demoTint, 0),
        memoriesShown: Array.isArray(loadedState.memoriesShown)
          ? loadedState.memoriesShown.filter((n: unknown) => typeof n === 'number')
          : [],
        redeemed: loadedState.redeemed === true,
        showRedeemed: loadedState.showRedeemed === true,
        // Só `true` literal esconde: string "false", 1 ou lixo não podem tirar
        // alguém da lista nem, pior, deixar a pessoa achando que saiu.
        hideFromPublicList: loadedState.hideFromPublicList === true,
        // Enum de 3 valores: qualquer outra coisa cairia em `getStageLevel`/
        // sprites como galho inexistente.
        currentBranch: (loadedState.currentBranch === 'power' || loadedState.currentBranch === 'harmony'
          || loadedState.currentBranch === 'benevolence') ? loadedState.currentBranch : 'harmony',
        maxActivityCap: num(
          loadedState.maxActivityCap,
          FORM_REQUIREMENTS[getStageLevel(typeof loadedState.evolutionStage === 'string' ? loadedState.evolutionStage : 'rookie')].cap,
        ),
        /* ⚠️ Havia aqui uma migração de um id de espécie de outra franquia
           para a linha genérica, apagada em 07/09/2026: os três ids de linha
           também ERAM nomes de franquia, então o migrador traduzia um nome
           proibido em outro. Hoje as linhas são as nossas (`ignar`/`lumel`/
           `serah`, de `DUNGEON_LINE_SPRITES`) e não há save de terceiro para
           migrar — ninguém nunca usou o app em produção. Um id que a arte não
           conheça cai em `fallbackSpriteForStage`, que responde com arte
           NOSSA por hash do id. */
        eggType: loadedState.eggType ?? savedEggType ?? 'ignar',
        attributesSinceLastEvolution: {
          power: num(loadedState.attributesSinceLastEvolution?.power, 0),
          harmony: num(loadedState.attributesSinceLastEvolution?.harmony, 0),
          benevolence: num(loadedState.attributesSinceLastEvolution?.benevolence, 0),
        },
        // Contagem por emoji: valor não-numérico vira `NaN` no primeiro `-1` e
        // a pastinha exibe item fantasma que nunca acaba.
        foodInventory: Object.fromEntries(
          Object.entries(obj<unknown>(loadedState.foodInventory))
            .map(([k, v]) => [k, Math.max(0, Math.floor(num(v, 0)))])
            .filter(([, v]) => (v as number) > 0),
        ) as Record<string, number>,
        poopEventsShown: numArr(loadedState.poopEventsShown),
        // O relógio do dreno NÃO sobrevive ao save: é um timestamp absoluto,
        // então restaurá-lo cru fazia o dreno da montagem cobrar as horas em
        // que a pessoa não estava lá — exatamente o que
        // `ABSENCE_FORGIVENESS_DAYS` existe para impedir. Zerar aqui também
        // elimina a corrida com a virada (`dailyReset.ts`, que só zera quando
        // roda). O relógio recomeça sozinho no primeiro tick com cocô na tela.
        poopPenaltyClockAt: 0,
        // Quanto o dreno já cobrou HOJE (utils/poopDrain.ts). Persiste para o
        // teto diário não ser zerado por um reload.
        poopDrainCharge: (() => {
          const c = obj<unknown>(loadedState.poopDrainCharge);
          return typeof c.day === 'string' ? { day: c.day, hearts: num(c.hearts, 0) } : undefined;
        })(),
        // Teto diário do Glitchtama. Save antigo não tem o campo e entra como
        // `undefined`, que `glitchtamaUsedToday` lê como zero — quem já jogava
        // ganha o dia de hoje inteiro, nunca uma dívida retroativa.
        glitchtamaUse: (() => {
          const g = obj<unknown>(loadedState.glitchtamaUse);
          return typeof g.day === 'string' ? { day: g.day, used: num(g.used, 0) } : undefined;
        })(),
        // Teto diário de Bits de minijogo (#61/#63). Mesmo argumento do
        // Glitchtama: save antigo entra `undefined` e ganha o dia inteiro.
        minigameBits: (() => {
          const m = obj<unknown>(loadedState.minigameBits);
          return typeof m.day === 'string' ? { day: m.day, earned: num(m.earned, 0) } : undefined;
        })(),
        // Folga da semana (P2). `undefined` é o certo para save antigo: a
        // virada lê isso como "a folga daquela semana estava inteira".
        restDaysLeft: typeof loadedState.restDaysLeft === 'number'
          ? Math.max(0, num(loadedState.restDaysLeft, 0)) : undefined,
        restWeekKey: str(loadedState.restWeekKey) ?? undefined,
        // Diário de aventuras. Entrada malformada é DESCARTADA em vez de
        // derrubar o load: é coleção, e perder uma linha vale infinitamente
        // menos que perder o save.
        adventures: arr<unknown>(loadedState.adventures)
          .map(e => (e ?? {}) as { id?: unknown; day?: unknown })
          .filter((e): e is { id: string; day: string } =>
            typeof e.id === 'string' && typeof e.day === 'string'),
        // Migração dos tetos de cuidado (D-33): o que sobrou no localStorage
        // deste aparelho é fundido com o que já está no save. `mergeCareCaps` é
        // idempotente, então rodar aqui no save local E de novo quando a nuvem
        // for adotada dá o mesmo resultado — é o que permite apagar as chaves
        // antigas logo abaixo sem criar ponto de não retorno.
        careCaps: (() => {
          // O `now` da higienização é o relógio DESTE aparelho no instante do
          // load: é ele que `recentFeeds` vai usar depois para medir a janela
          // de 1h, e é o único relógio confiável aqui. Timestamp de comida no
          // FUTURO (relógio adiantado do outro aparelho, que agora viaja no
          // save) some na fusão — senão travaria a comida por horas. Ver
          // `utils/careCaps.ts`, `sanitizeFeedTimes` (achado X-5).
          const merged = mergeCareCaps(loadedState.careCaps, {
            feedTimes: readJson<unknown>(STORAGE_KEYS.FOOD_FEED_TIMES, undefined),
            rubHeal: readJson<unknown>(STORAGE_KEYS.RUB_HEAL_DAY, undefined),
          }, Date.now());
          removeLocal(STORAGE_KEYS.FOOD_FEED_TIMES);
          removeLocal(STORAGE_KEYS.RUB_HEAL_DAY);
          return merged;
        })(),
        gamePoints: num(loadedState.gamePoints, 0),
        emblems: num(loadedState.emblems, 0),
        // Higienização mínima: se a semana não for string o registro inteiro
        // cai fora, e `forWeek` devolve uma semana vazia na leitura seguinte.
        weeklyMissions: (() => {
          const w = obj<unknown>(loadedState.weeklyMissions);
          if (typeof w.week !== 'string') return undefined;
          return {
            week: w.week,
            counts: obj<number>(w.counts) as WeeklyMissionProgress['counts'],
            claimed: Array.isArray(w.claimed) ? (w.claimed.filter(x => typeof x === 'string') as WeeklyMissionProgress['claimed']) : [],
          };
        })(),
        // H13 (02/10/2026): o personagem JÁ NASCE no PvP e o interruptor saiu da
        // tela. Quem tem `false` gravado (save antigo, ou quem desligou antes)
        // passa a ligado — migração segura: o que de fato publica o perfil é o
        // gate de Vínculo 5 (`publicarPerfil`, e o servidor confere de novo).
        pvpEnabled: true,
        // `PetStageDecor` lê `.place`/`.season` de cada troféu para desenhar
        // 🥇🥈🥉 — item que não é objeto vira medalha fantasma.
        trophies: arr<unknown>(loadedState.trophies).filter(
          (t): t is { season: string; place: 1 | 2 | 3 } => {
            const e = obj<unknown>(t);
            return typeof e.season === 'string' && (e.place === 1 || e.place === 2 || e.place === 3);
          },
        ),
        friends: strArr(loadedState.friends),
        // 'bg-room' is free — always owned, even for saves from before it existed.
        // `arr()` e não `?? []`: um `ownedBackgrounds` NÃO-array fazia o spread
        // LANÇAR, o try/catch do inicializador caía para `freshGameState()` e o
        // jogador perdia o save inteiro em silêncio.
        ownedBackgrounds: Array.from(new Set([...strArr(loadedState.ownedBackgrounds), 'bg-room'])),
        equippedBackground: str(loadedState.equippedBackground) ?? null,
        ownedFurniture: strArr(loadedState.ownedFurniture),
        // `migrateDecor` devolve `loaded.equippedDecor` CRU quando ele existe —
        // um array ou um número passaria. O palco indexa por espaço e espera id
        // de item (string) em cada um.
        equippedDecor: hydrateDecor(migrateDecor(loadedState)),
        // Campos novos: saves antigos não os têm, então o fallback é obrigatório.
        // Sem `?? padrão` de valor: aqui o padrão É a ausência. Save antigo
        // continua sem consentimento registrado — e continua jogando.
        consent: normalizeConsent(loadedState.consent),
        // `soulmonDisplayName` faz `.trim()` em `petName`/`baseName` em TODO
        // render (HUD, widget, aniversário). Um `petName: 5` vindo da nuvem
        // era `TypeError` no primeiro render — tela branca permanente
        // (achado do fuzz de 89 campos, QA rodada 2, 22/09/2026). Campo
        // não-string sai; o objeto só sobrevive se for objeto.
        soulmonMeta: (() => {
          const m = loadedState.soulmonMeta;
          if (!m || typeof m !== 'object' || Array.isArray(m)) return undefined;
          const e = m as Record<string, unknown>;
          return {
            ...e,
            baseName: str(e.baseName) ?? '',
            petName: str(e.petName),
            creature: e.creature === 'corvo' ? 'corvo' : undefined,
          } as GameState['soulmonMeta'];
        })(),
        // 04-dados R2 §2: os quatro campos que passavam pelo spread cru.
        // `soulmonMeta` está acima; os três abaixo têm forma própria:
        // objeto (não array) ou ausente — é o `?? padrão` do CLAUDE.md, e o
        // mesmo padrão que já produziu tela branca quando faltou.
        soulmonSkills: (() => {
          const v = loadedState.soulmonSkills;
          return v && typeof v === 'object' && !Array.isArray(v) ? v as GameState['soulmonSkills'] : undefined;
        })(),
        soulmonClassTitles: (() => {
          const v = loadedState.soulmonClassTitles;
          return v && typeof v === 'object' && !Array.isArray(v) ? v as GameState['soulmonClassTitles'] : undefined;
        })(),
        soulmonCompanheiro: (() => {
          const v = loadedState.soulmonCompanheiro as { id?: unknown; nome?: { pt?: unknown; en?: unknown } } | undefined;
          if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
          if (typeof v.id !== 'string' || typeof v.nome?.pt !== 'string' || typeof v.nome?.en !== 'string') return undefined;
          return { id: v.id, nome: { pt: v.nome.pt, en: v.nome.en } };
        })(),
        soulmonManifestacao: sanitizeManifestacao(loadedState.soulmonManifestacao),
        evolutionLocked: loadedState.evolutionLocked === true,
        incubation: (() => {
          const v = loadedState.incubation as { v?: unknown; since?: unknown } | undefined;
          if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
          const since = v.since;
          if (!since || typeof since !== 'object' || Array.isArray(since)) return undefined;
          // Higieniza o que vem da nuvem: só par forma→string sobrevive. Data
          // inválida não é filtrada aqui de propósito — `incubationReady` já
          // responde `true` para relógio corrompido, e um relógio quebrado
          // nunca pode prender ninguém fora da evolução.
          const limpo: Record<string, string> = {};
          for (const [k, val] of Object.entries(since as Record<string, unknown>)) {
            if (typeof val === 'string') limpo[k] = val;
          }
          // `notified` NÃO é copiado de propósito (⚰️ 27/09/2026 — ver a lápide
          // em `utils/spriteTrigger.ts`): o aviso é marcador PERSISTENTE, não
          // one-shot. Save antigo que ainda tenha a chave a perde aqui, em
          // silêncio, que é o certo — ela nunca foi lida por ninguém.
          return { v: 1 as const, since: limpo };
        })(),
        soulGoal: str(loadedState.soulGoal) ?? '',
        soulStruggle: str(loadedState.soulStruggle) ?? '',
        // Vem da nuvem também: só listas de texto passam, e sem o campo ele
        // continua AUSENTE (nunca um perfil vazio inventado).
        onboardingProfile: loadedState.onboardingProfile
          ? onboardingProfileFrom(obj<unknown[]>(loadedState.onboardingProfile))
          : undefined,
        // As 20 do teste (01/10/2026): só resposta bem formada passa; sem o
        // campo, continua ausente.
        soulTestAnswers: sanitizeSoulTestAnswers(loadedState.soulTestAnswers),
        moodLog: arr<unknown>(loadedState.moodLog).filter(
          (m): m is { date: string; mood: 1 | 2 | 3 | 4 | 5 } => {
            const e = obj<unknown>(m);
            return typeof e.date === 'string' && typeof e.mood === 'number';
          },
        ),
        // `carePattern` faz `new Date(iso)` em cada item: um número ou objeto
        // aqui não lança, mas envenena o ritmo com `Invalid Date`.
        activityLog: strArr(loadedState.activityLog),
        petPassive: str(loadedState.petPassive) ?? rollPetPassive(),
        // Campo antigo some do save no próximo gravar (JSON.stringify descarta
        // undefined). Sem isto ele sobreviveria para sempre e voltaria a
        // reequipar o item toda vez que o jogador desequipasse tudo.
        equippedFurniture: undefined,
        // Saves from before accountTier existed are grandfathered as 'paid' —
        // they already have a real oracle character and full functionality,
        // so they must never be retroactively downgraded to demo.
        accountTier: loadedState.accountTier === 'demo' ? 'demo' : 'paid',
        // Sem validação de forma aqui de propósito: `applyRebirth` já recusa
        // escolha fora do catálogo na ENTRADA, e um registro presente só
        // pode ter saído dele. O que importa no load é a PRESENÇA — é ela
        // que trava a segunda vez.
        rebirth: (loadedState.rebirth as GameState['rebirth']) ?? undefined,
        demoCharacterId: (['kaelen', 'orrin', 'thalindra', 'igni', 'nautilu', 'astrase'] as const).find(id => id === loadedState.demoCharacterId),
        credits: num(loadedState.credits, 0),
        // Sistema de missões: contadores LIFETIME. `Math.max(prev ?? 0, x)` e a
        // aritmética de incremento em `App.tsx` transformam um valor não-numérico
        // em `NaN` permanente no save — a missão fica impossível para sempre.
        dungeonKills: num(loadedState.dungeonKills, 0),
        dungeonRunsCompleted: num(loadedState.dungeonRunsCompleted, 0),
        dinoBest: num(loadedState.dinoBest, 0),
        // Cartão malformado é DESCARTADO pelo dono (`sanitizeReview`), nunca
        // derruba o load; save sem o campo entra vazio.
        review: sanitizeReview(loadedState.review),
        refugeInvite: sanitizeRefugeInvite(loadedState.refugeInvite),
        // Travessias: lixo é descartado pelo dono (`normalizeCrossings`), nunca derruba o load.
        crossings: normalizeCrossings(loadedState.crossings),
        // Caderno: lixo é descartado, teto de 120 × 2000 (`normalizeEntries`); nunca derruba o load.
        caderno: normalizeEntries(loadedState.caderno),
        totalPerfectDays: num(loadedState.totalPerfectDays, 0),
        // #41/#60: save anterior à decisão não tem o campo, e o vitalício antigo
        // JÁ somava os 🌀 — herdar `totalPerfectDays` é o que impede a missão de
        // andar para trás para quem já usou o item.
        missionPerfectDays: num(loadedState.missionPerfectDays, num(loadedState.totalPerfectDays, 0)),
        // Migração #30 (21/09/2026): `tasks-100` virou `dias-completos-30`. Save
        // que JÁ tem o campo mantém (mesmo `[]`); save sem o campo ganha a
        // conquista se o gatilho antigo estava batido — e só nessa hora, porque
        // `activityLog`/`completedTasks` são podados e a leitura derivada fecharia.
        conquistasHerdadas: Array.isArray(loadedState.conquistasHerdadas)
          ? loadedState.conquistasHerdadas.filter((id): id is AchievementId => (ACHIEVEMENT_IDS as readonly string[]).includes(id))
          : (gatilhoAntigoTasks100(loadedState) ? ['dias-completos-30'] : []),
        // `?? undefined`: save antigo simplesmente não tem estação, e a
        // primeira virada tira a foto. Nada a migrar.
        season: (loadedState as { season?: SeasonProgressState }).season ?? undefined,
        // `?? undefined` e NUNCA um fallback calculado: ver o comentário do campo.
        bornAt: typeof (loadedState as { bornAt?: unknown }).bornAt === 'string'
          ? (loadedState as { bornAt: string }).bornAt : undefined,
        droppedItems: strArr(loadedState.droppedItems),
        // A árvore do oráculo: cada forma é lida por `creatureFormId(s)`, que
        // acessa campos do objeto — um item primitivo aqui derruba a tela do Pet.
        // Acervo de sprites: o save vem do localStorage E da nuvem, os dois são
        // dado não confiável. `normalizeSpriteLibrary` devolve acervo vazio para
        // qualquer coisa estranha — e acervo vazio é a arte de RESERVA, que
        // nunca é erro (Invariante nº 1 da spec).
        spriteLibrary: normalizeSpriteLibrary(loadedState.spriteLibrary),
        soulmonStages: Array.isArray(loadedState.soulmonStages)
          ? (loadedState.soulmonStages as unknown[]).filter(
              (s): s is CreatureStage => !!s && typeof s === 'object' && !Array.isArray(s),
            )
          : undefined,
        // Relatório do dia: só sobrevive como OBJETO com data. Lixo aqui é
        // truthy e abriria o modal do relatório com campos vazios.
        lastDayReport: (() => {
          const r = obj<unknown>(loadedState.lastDayReport);
          return typeof r.date === 'string'
            ? (loadedState.lastDayReport as GameState['lastDayReport'])
            : undefined;
        })(),
        // Motor de tarefas (docs/PLANO-TAREFAS.md). Todos opcionais, mas com
        // linha aqui por regra: campo sem linha em `hydrateSave` já produziu a
        // tela branca permanente.
        // `obj()` valida só o CONTÊINER — cada ENTRADA também precisa de tipo,
        // senão `{a:{}}` chega em `applyMissedDay` e lança na virada (ver
        // `hydrateRhythm`).
        habitRhythms: hydrateRhythms(loadedState.habitRhythms),
        // A Janela de Descanso leva a âncora DENTRO dela: `recordNight`,
        // `restConstancy` e `nightmares.ts` leem `rest.playerDayTz` do ESTADO,
        // nunca por parâmetro (ver a nota em `RestState`). Sem esta linha a
        // âncora existiria no save e não chegaria a quem nomeia a noite — o bug
        // de FIAÇÃO de sempre, e há guard de AST travando esta linha.
        rest: hydrateRest(loadedState.rest, ancoraDoDia),
        // A ÂNCORA DO DIA DO JOGADOR, resolvida no load e gravada no save.
        //
        // A que já está no save VENCE — recalcular a cada load faria o dia do
        // jogador andar junto com o avião de quem viaja, que é o bug com mais
        // código. Save sem âncora (todos os existentes) ganha a dele agora:
        // primeiro o fuso IANA da cidade de nascimento do onboarding, que o mapa
        // astral já consome e que sabe de horário de verão; sem perfil, o offset
        // DESTE aparelho, congelado.
        //
        // MIGRAÇÃO: no aparelho do fuso de casa a chave sai IDÊNTICA à que já
        // estava gravada — nenhum teto devolvido, nenhum ritual reaberto,
        // migração invisível. Fora dele, o pior caso é UM teto extra concedido
        // uma única vez, no primeiro load. Forçar zero pediria carimbar o
        // instante nos quatro registros e migrá-los; complexidade que só serviria
        // para não presentear um coração a quem trocou de continente.
        // Idempotente por construção — "a que já está VENCE" é o primeiro
        // degrau de `resolvePlayerDayAnchor`, então isto devolve `ancoraDoDia`
        // (a MESMA referência) sem resolver nada de novo. A chamada fica
        // escrita aqui de propósito: o guard de AST de
        // `playerDay.contract.test.ts` pergunta ao campo, não ao arquivo, e um
        // save que perdesse esta linha nunca mais ganharia âncora.
        playerDayTz: resolvePlayerDayAnchor(ancoraDoDia, onboardingTimeZone(), new Date()),
        lastCheckInDate: str(loadedState.lastCheckInDate),
        lastWeeklyReportDate: str(loadedState.lastWeeklyReportDate),
        lastFreshStartDate: str(loadedState.lastFreshStartDate),
        // Sono jogável, brincar e passos. Mesma regra dos campos acima: TODO
        // campo novo tem linha aqui, mesmo sendo opcional — campo sem linha em
        // `hydrateSave` já produziu a tela branca permanente.
        nightmares: hydrateNightmares(loadedState.nightmares),
        playLog: hydratePlayLog(loadedState.playLog),
        steps: hydrateSteps(loadedState.steps),
        // Só os dois valores conhecidos sobrevivem: qualquer outra coisa vira
        // "ainda não perguntei", que é o estado seguro (perguntar de novo é
        // recuperável; tratar lixo como 'granted' leria sensor sem consentimento).
        stepsConsent: loadedState.stepsConsent === 'granted' || loadedState.stepsConsent === 'declined'
          ? loadedState.stepsConsent
          : undefined,
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
      // Derivado do estagio, nunca literal. Nascia 1/1 enquanto rookie vale 3:
      // quem fechava o app no meio do onboarding voltava com 1/3 e nao tinha
      // como saber por que. O onboarding ainda grava a vida cheia ao terminar
      // (o nascimento e ritual), mas o estado inicial deixa de MENTIR enquanto
      // ele nao termina. Decisao do dono em 07/09/2026.
      healthPoints: getMaxHPForStage('rookie'),
      maxHealthPoints: getMaxHPForStage('rookie'),
      energyPoints: 0,
      perfectDays: 0,
      totalXP: 0,
      bondRewardsClaimed: [],
      bondDaily: { day: '', spent: {} },
      powerPoints: 0,
      harmonyPoints: 0,
      benevolencePoints: 0,
      lastResetDate: new Date().toDateString(),
      evolutionStage: 'rookie',
      poopEventsScheduled: [],
      poopEventsCompleted: [],
      unlockedEvolutions: ['rookie'],
      degeneratedByHP: false,
      currentBranch: 'harmony',
      lastDayWasPerfect: false,
      maxActivityCap: FORM_REQUIREMENTS.rookie.cap,
      eggType: savedEggType ?? 'ignar',
      attributesSinceLastEvolution: { power: 0, harmony: 0, benevolence: 0 },
      foodInventory: {},
      poopEventsShown: [],
      poopPenaltyClockAt: 0,
      careCaps: {},
      // Save novo já nasce ancorado. Sem perfil ainda (o onboarding vem depois),
      // o offset deste aparelho é o melhor palpite sobre onde o jogador vive.
      playerDayTz: { offsetMs: deviceOffsetMs(new Date()) },
      gamePoints: 0,
      emblems: 0,
      pvpEnabled: true,
      trophies: [],
      friends: [],
      ownedBackgrounds: ['bg-room'],
      equippedBackground: null,
      ownedFurniture: [],
      equippedDecor: {},
      soulGoal: '',
      soulStruggle: '',
      consent: undefined,
      moodLog: [],
      activityLog: [],
      petPassive: rollPetPassive(),
      // Fresh installs start in demo — the onboarding gate (SoulmonOnboarding)
      // upgrades this to 'paid' once the (currently placeholder) one-time
      // purchase completes.
      accountTier: 'demo',
      credits: 0,
      habitRhythms: {},
      // Save novo já nasce com a noite ancorada, pela mesma razão do
      // `playerDayTz` logo abaixo: quem nomeia a noite é `rest.playerDayTz`.
      rest: { ...createRestState(), playerDayTz: { offsetMs: deviceOffsetMs(new Date()) } },
      // Instalação nova: nenhuma noite combatida, nenhuma brincadeira, nenhum
      // passo e nenhuma resposta sobre passos ainda (`stepsConsent` ausente é o
      // "ainda não perguntei" — só o `declined` é definitivo).
      nightmares: createNightmareState(),
  };
}

/**
 * Debounce de CAUDA do cloud save. Continua 3 s, e isso agora é DECISÃO, não
 * detalhe: o preparo da fatia 1 (§A.3.2) mediu que é este amortecedor que
 * impede a densidade de gesto de virar densidade de escrita — as ~23 mutações
 * de uma sessão cheia colapsam em ~14 POSTs. Reduzi-lo "para encurtar a janela
 * de conflito" PIORA o 409 e o custo. Não otimize isto sem refazer a conta.
 */
export const CLOUD_SAVE_DEBOUNCE_MS = 3000;

/**
 * R-4 — teto absoluto de espera. Ver o comentário longo no efeito de save: sem
 * ele, um fluxo sustentado de mutações a menos de 3 s adia o POST para sempre
 * e o cloud save para em silêncio. 15 s é 5× o debounce — longe o bastante
 * para nunca atrapalhar a rajada normal, curto o bastante para o jogador não
 * perder uma sessão inteira.
 */
export const CLOUD_SAVE_MAX_WAIT_MS = 15000;

/**
 * Aviso por CLASSE de falha, PT + EN. Só chega ao jogador o que ele pode
 * entender ou resolver — 5xx e offline se resolvem sozinhos e não aparecem
 * (ver `CLOUD_SAVE_POLICY.avisaJogador`).
 *
 * A copy final é do `alpha-redator-ux` (item 0.4 do roteiro de corte). Estes
 * textos são funcionais e existem para o caminho não nascer mudo.
 */
function cloudSaveWarning(kind: string, pt: boolean): string {
  switch (kind) {
    case 'identity':
      return pt
        ? 'Este aparelho está apontando para outra conta. Entre com seu e-mail para religar o progresso à nuvem.'
        : 'This device is pointing at another account. Sign in with your email to reconnect your progress to the cloud.';
    case 'auth':
      return pt
        ? 'Sua sessão expirou e o progresso não está indo para a nuvem. Entre de novo com seu e-mail.'
        : 'Your session expired and progress is not reaching the cloud. Sign in again with your email.';
    case 'too-large':
      return pt
        ? 'Seu save ficou grande demais para a nuvem. O progresso continua salvo neste aparelho.'
        : 'Your save is too large for the cloud. Progress is still saved on this device.';
    default:
      return pt
        ? 'Não consegui salvar na nuvem. O progresso continua neste aparelho.'
        : "Couldn't save to the cloud. Progress is still on this device.";
  }
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
  /**
   * R-4 — quando a rajada de mutações COMEÇOU. `null` = não há POST pendente.
   * É o que impede a inanição do debounce (ver a constante abaixo).
   */
  const rajadaComecouEm = useRef<number | null>(null);
  /**
   * R-3 — a última classe de falha já avisada ao jogador. Um 403 permanente
   * dispara a cada gesto; avisar a cada gesto vira ruído que ensina a ignorar
   * o aviso. Um aviso por classe, por sessão.
   */
  const falhaJaAvisada = useRef<string | null>(null);

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

    // R-4 — INVARIANTE CONTRA INANIÇÃO DO DEBOUNCE.
    //
    // O `clearTimeout` do retorno faz deste um debounce de CAUDA: ele reinicia
    // a cada mutação. A propriedade que ninguém tinha escrito é que um fluxo
    // SUSTENTADO de mutações a menos de 3 s de distância **nunca dispara o
    // POST** — o save fica só em memória e no localStorage, e a nuvem para de
    // receber em silêncio, indefinidamente, enquanto o fluxo durar.
    //
    // Hoje isso não acontece, mas por ACIDENTE: o único gesto com cadência de
    // ~2 s é o carinho, e ele tem teto de 2 concessões por dia
    // (`careRules.ts`). No dia em que esse teto mudar — é discussão viva de
    // produto — o cloud save para de disparar sem ninguém ver.
    //
    // O teto de espera fecha isso por DESENHO: por mais que a rajada continue,
    // o POST sai no máximo `CLOUD_SAVE_MAX_WAIT_MS` depois da PRIMEIRA mutação
    // pendente. E o amortecedor continua inteiro — a rajada curta ainda
    // colapsa num POST só, que é o que impede a densidade de gesto de virar
    // densidade de escrita.
    if (rajadaComecouEm.current === null) rajadaComecouEm.current = Date.now();
    const esperando = Date.now() - rajadaComecouEm.current;
    const espera = Math.max(0, Math.min(CLOUD_SAVE_DEBOUNCE_MS, CLOUD_SAVE_MAX_WAIT_MS - esperando));

    const timer = setTimeout(() => {
      rajadaComecouEm.current = null;
      // R-3 — o retorno é LIDO. Antes este `false` era jogado fora: o servidor
      // podia recusar o dia inteiro e a única pista era um `console.warn`.
      //
      // ⚠️ R-1 — NADA neste callback pode chamar `setGameState`. Este efeito
      // depende de `[gameState]`; tocar o estado aqui reiniciaria o debounce e
      // reagendaria o POST que acabou de falhar, e **cada gesto do jogador
      // aceleraria o ciclo**. Vale em especial para o 409 que a fatia 1 vai
      // introduzir: a reconciliação de conflito precisa de uma via própria,
      // fora deste efeito. Avisar por `toast` é seguro (não é estado do jogo).
      void cloudSaveComRetry(saveId!, gameState).then(resultado => {
        if (resultado.ok) { falhaJaAvisada.current = null; publicarPerfil(); return; }
        // 410: a conta foi excluída. Não é aviso — é parada: limpa, desloga e
        // volta ao portão (não toca em `setGameState`, R-1 respeitado).
        if (resultado.kind === 'deleted') { void reagirContaExcluida(); return; }
        if (!resultado.avisaJogador) return;
        if (falhaJaAvisada.current === resultado.kind) return;
        falhaJaAvisada.current = resultado.kind;
        const pt = resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)) === 'pt-BR';
        toast.warning(cloudSaveWarning(resultado.kind, pt), { duration: 10000 });
      });
      // O perfil público só vai para a nuvem com os recursos sociais LIGADOS.
      // Sem este gate, quem nunca ativou o PvP tinha nome, pet e atributos
      // publicados no diretório assim mesmo — `pvpEnabled: false` no corpo não
      // impede a publicação, só descreve o estado.
      //
      // E só DEPOIS do save confirmado (QA rodada 2, segurança §1.3 / dados
      // §0): em paralelo, o `pushProfile` regravava `profile:`/`pid:` no mesmo
      // tick em que o save tomava 410 — o diretório público renascia 3 s
      // depois da exclusão. Save recusado = perfil não sobe.
      function publicarPerfil() {
      if (!gameState.pvpEnabled) return;
      // H13: sem interruptor, o que segura a publicação é o Vínculo. Abaixo do
      // nível 5 o servidor recusaria de qualquer jeito — não vale mandar nome e
      // pet de quem ainda não está no Torneio nem gastar a leitura do save.
      if (!meetsPvpBond(gameState.totalXP ?? 0)) return;
      pushProfile({
        id: saveId!,
        // O nome vai para o ranking da COMUNIDADE, onde outros jogadores leem.
        // O padrão precisa do par EN/PT como todo texto de UI: em inglês,
        // "Anônimo" aparecia para quem nunca escolheu português.
        name: readLocal(STORAGE_KEYS.USER_NAME)
          || (resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE)) === 'pt-BR' ? 'Anônimo' : 'Anonymous'),
        // É o nome ESCOLHIDO que vai para o diretório público, com o nome
        // sugerido como padrão de quem nunca batizou nada.
        petName: soulmonDisplayName(gameState.soulmonMeta),
        stage: gameState.evolutionStage,
        unlockedStages: gameState.unlockedEvolutions,
        pvpEnabled: !!gameState.pvpEnabled,
        // Sempre enviado (inclusive `false`): é assim que o servidor RETIRA ou
        // devolve o registro público na hora da troca (TORC-5).
        publicHidden: gameState.hideFromPublicList === true,
        attrs: { power: gameState.powerPoints, harmony: gameState.harmonyPoints, benevolence: gameState.benevolencePoints },
        tasksDone: gameState.completedTasks?.length ?? 0,
      }).then(resposta => {
        // ── H13 (02/10/2026): a recusa NÃO desliga mais nada nem avisa ────────
        // Sem interruptor, `pvpEnabled` é sempre `true` e "ligar" não é um gesto
        // da pessoa — então não há o que desfazer nem o que avisar aqui (o aviso
        // dizia "o PvP não foi ligado" a quem nunca pediu nada). A recusa só
        // acontece quando o XP local já cruzou o nível 5 mas o save na NUVEM
        // ainda está atrás; o próximo cloud save reenvia o perfil e o servidor
        // aceita. Quem explica ao jogador o que falta é o Torneio
        // (`TournamentPage`, aba Desafiar), que lê o mesmo `totalXP`.
        // Nenhum `setGameState` aqui: nada reagenda o efeito (nota R-1).
        void resposta;
      }).catch(() => {});
      }
    }, espera);
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
