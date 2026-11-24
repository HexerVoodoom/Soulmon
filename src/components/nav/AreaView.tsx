import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import type { BitsExchangeOutcome } from '../../utils/bitsPackCopy';
import { crystalBlocksLot, crystalRefusalText } from '../../utils/evolutionCrystal';
import { useWakeGate } from '../WakeToEnter';
import { lotEntryAsks } from '../../utils/wakeToEnter';
import { emitFeat } from '../../utils/feats';
import type { AreaId } from '../../navigation';
import type { MindGameId, MindGameTutorials } from '../../utils/mente/mindTutorials';
import type { BitsCategory } from '../../utils/currencies';
import type { Language } from '../../utils/i18n';
import { AreaScene, type AreaLot } from './AreaScene';
import { DungeonKeyBadge } from './DungeonKeyBadge';
import { requestGoToBuilding } from '../../utils/blockedAction';
import { useGameStateOptional } from '../../contexts/GameStateContext';
import { rewindToSet, teleportToPortal } from '../../utils/riftMap';
import { RESTAURANT_CHEF_ART } from '../../assets/soulmon/npcs';
import { chefsOn, playerWeekday } from '../../utils/restaurant';
import { restaurantNpcVoice } from '../../utils/restaurantCopy';
import { lotIndicators } from '../../utils/lotIndicators';
import { AreaSheet } from './AreaSheet';
import { ModalSheet } from '../form/FormKit';
import { mercadoLots, arenaLots, laboratorioLots, hallLots, type MercadoLotId, type LaboratorioLotId } from '../../utils/areaSheetCopy';
import { AREA_BG, MERCADO_LOT_ART, ARENA_LOT_ART, PLAY_AREA_BG, EXPLORACAO_LOT_ART, FORJA_LOT_ART, FORJA_BG, JOGOS_LOT_ART, LABORATORIO_LOT_ART, HALL_LOT_ART, HALL_BG, LABORATORIO_BG } from '../../assets/soulmon/areas';
import { exploracaoLots, forjaLots, jogosLots } from '../../utils/playAreaLots';
import { RogueDungeonPlaceholder } from '../play/RogueDungeonPlaceholder';
import { RogueDungeon } from '../RogueDungeon';
import type { RogueRun } from '../../utils/rogueDungeon';
import type { Combatant } from '../../utils/combate/curve';
import { buildingGateFor, buildingLockLine, type BuildingId } from '../../utils/gates';
import type { DailyEvent } from '../../utils/dailyMissions';
import { isDemoBlockedLot, isDemoHiddenLot, demoRefusalText } from '../../utils/demoMode';
import { bbRefusal, bbRefusalText, BB_LOCKED_BUILDINGS } from '../../utils/bbStage';
import { useBackLayer } from '../../utils/backStack';
import { playerDayIso, type PlayerDayAnchor } from '../../utils/playerDay';
import type { GuildGoal } from '../../utils/community';
import type { ShopActions, ShopOwnership } from '../mercado/ShopShelf';
import type { WidgetFramePickerData } from '../../utils/widgetFrames';
import type { MercadoStallProps } from '../mercado/MercadoSheets';
import type { TournamentPage as TournamentPageT } from '../TournamentPage';
import type { GuildSheet as GuildSheetT } from '../guild/GuildSheet';
import type { StageSkills } from '../../utils/soulProfile/ficha/skills';
import type { FichaStage } from '../../utils/soulProfile/ficha/types';
import type { SalaoGame, MenteGame, RefugioGame } from '../play/PlaySheets';
import { MinigameModeGate, type GateRanking } from '../play/MinigameModeGate';
import { Match3Escolha } from '../play/Match3Escolha';
import type { M3Choice } from '../../utils/match3Escolha';
import type { ReviewState } from '../../utils/mente/revisao';
import { CROSSINGS_EMPTY, type CrossingsState } from '../../types/travessias';
import type { CadernoEntry } from '../../utils/cadernoSave';
import type { ArenaReroll } from '../../utils/arenaSorteio';
import type { QuestMark } from '../../utils/questMarks';
import type { FocusLootRequest } from '../../utils/focusExpedition';
import type { JourneyGrants } from '../../utils/focusJourney';
import type { FocusLootItem } from '../../utils/focusExpedition';
export type FocusRewardResult = { accepted: boolean; items: FocusLootItem[]; chancePercent: number };
import { ScreenSkeleton } from '../ui/ScreenSkeleton';
import { isFunGame } from '../../utils/funSession';
import type { FunTicketStatus } from '../../utils/funTickets';
import { FunTicketCostContext, TicketFan } from '../play/TicketFan';
import { conviteDueloFan } from '../arena/conviteDueloArt';
import { setActive, trackMinigame } from '../../utils/usageTime';
import type { PasseioAchado } from '../play/PasseioSheet';
import {
  usePlayPrefetch, loadPlaySheets, loadDungeonGame, loadDinoGame, loadRPSGame, loadMatch3Game, loadEcoGame, loadBolhasGame, loadZipGame, loadSeloGame,
  loadRespiracaoGame,
  loadChamaGame,
} from './playPrefetch';

/**
 * UMA ÁREA DO MAPA, INTEIRA (minimal-ui F4 molde + F5 conteúdo) — a cena
 * (`AreaScene`), o lote aberto (`AreaSheet`) e o que entra dentro dele.
 *
 * Mora fora do `App.tsx` e entra por `lazy()` de propósito: o chunk de entrada
 * está acima do orçamento de bytes (`orcamentoDeBytes.contract.test.ts`,
 * decisão #31), e nada disto é necessário para a Home abrir. O `App` só passa
 * dados e handlers prontos — nenhuma regra nasce aqui: a compra é o
 * `handleShopBuy`, a troca é o `handleExchangeCredits`, a partida é do
 * `TournamentPage`, a luta é da `ArenaGame`.
 *
 * O estado "qual folha está aberta" é LOCAL: o `App` monta este componente com
 * `key` da view, então trocar de área zera a folha (nunca reabre "fantasma"
 * numa área diferente).
 */
const MercadoStallSheet = lazy(() => import('../mercado/MercadoSheets').then(m => ({ default: m.MercadoStallSheet })));
const RestauranteSheet = lazy(() => import('../mercado/RestauranteSheet').then(m => ({ default: m.RestauranteSheet })));
const CambistaSheet = lazy(() => import('../mercado/MercadoSheets').then(m => ({ default: m.CambistaSheet })));
const ConquistasSheet = lazy(() => import('../mercado/MercadoSheets').then(m => ({ default: m.ConquistasSheet })));
// ⚒️ O Soulsmith (07/10/2026): abre a tela de equipamento do Combate v3 (PR8b), que saiu das Estatísticas. Lazy — a arte dos itens é sob demanda.
const ForgeCard = lazy(() => import('../ForgeCard'));
// 09/11/2026: a entrada do Soulsmith (Vitra fala + botão para a Forja de Alma), antes do mapa em tela cheia.
const HexsmithSheet = lazy(() => import('../hex/HexsmithSheet'));
const TournamentPage = lazy(() => import('../TournamentPage').then(m => ({ default: m.TournamentPage })));
const GuildSheet = lazy(() => import('../guild/GuildSheet').then(m => ({ default: m.GuildSheet })));
const DueloSheet = lazy(() => import('../arena/DueloSheet').then(m => ({ default: m.DueloSheet })));
const ArenaGame = lazy(() => import('../ArenaGame').then(m => ({ default: m.ArenaGame })));
// Exploração + Jogos (F5, ex-PR #118): as folhas-porta e os minijogos de
// sempre (os mesmos que a antiga `ActivitiesPage` abria).
const RiftMap = lazy(() => import('../rift/RiftMap').then(m => ({ default: m.RiftMap })));
const MasmorraSheet = lazy(() => loadPlaySheets().then(m => ({ default: m.MasmorraSheet })));
// Os três prédios de Jogos (30/09/2026): Salão (livres), Ateliê da Mente e Refúgio.
const SalaoSheet = lazy(() => loadPlaySheets().then(m => ({ default: m.SalaoSheet })));
const MenteSheet = lazy(() => loadPlaySheets().then(m => ({ default: m.MenteSheet })));
const RefugioSheet = lazy(() => loadPlaySheets().then(m => ({ default: m.RefugioSheet })));
// 🧭 O Passeio (30/09/2026): a folha carrega o catálogo das regiões — por isso lazy.
const RogueKeyGate = lazy(() => import('../play/RogueKeyGate').then(m => ({ default: m.RogueKeyGate })));
import type { Ice } from '../../utils/iceScore';
const FocusBoard = lazy(() => import('../play/FocusBoard').then(m => ({ default: m.FocusBoard })));
const PasseioSheet = lazy(() => import('../play/PasseioSheet').then(m => ({ default: m.PasseioSheet })));
const CadernoSheet = lazy(() => import('../play/CadernoSheet').then(m => ({ default: m.CadernoSheet })));
const Match3Game = lazy(() => loadMatch3Game().then(m => ({ default: m.Match3Game })));
const DungeonGame = lazy(() => loadDungeonGame().then(m => ({ default: m.DungeonGame })));
const DinoGame = lazy(() => loadDinoGame().then(m => ({ default: m.DinoGame })));
const SoulBarrage = lazy(() => import('../SoulBarrage').then(m => ({ default: m.SoulBarrage })));
const RPSGame = lazy(() => loadRPSGame().then(m => ({ default: m.RPSGame })));
const EcoGame = lazy(() => loadEcoGame().then(m => ({ default: m.EcoGame })));
const BolhasGame = lazy(() => loadBolhasGame().then(m => ({ default: m.BolhasGame })));
const ZipGame = lazy(() => loadZipGame().then(m => ({ default: m.ZipGame })));
const SeloGame = lazy(() => loadSeloGame().then(m => ({ default: m.SeloGame })));
const RespiracaoGame = lazy(() => loadRespiracaoGame().then(m => ({ default: m.RespiracaoGame })));
const ChamaGame = lazy(() => loadChamaGame().then(m => ({ default: m.ChamaGame })));

/** Os handlers dos minijogos da Exploração e de Jogos — prontos no `App`, os
 *  MESMOS que a antiga `ActivitiesPage` repassava. Nenhuma regra nasce aqui:
 *  a Masmorra não tem gate de entrada, nem limite diário, nem cobra coração
 *  ao perder — quem decide isso são `utils/dungeon` e a `DungeonGame`. */
export interface PlayHandlers {
  onDungeonEnter: () => { ok: true; level?: number; best: number };
  onDungeonLose: () => void;
  onDungeonHeartDrop: () => boolean;
  onGlitchtama: (m: { runReward: boolean; drop: boolean }) => void;
  onFloorCleared?: () => void;
  /** beta3 A4: a descida terminou com ao menos 1 camada limpa (conta a missão "runs da masmorra"). */
  onRunEnd?: () => void;
  onDungeonEnemyDefeated: (enemyKey?: string) => void;
  /** M10: inimigo visto fora da masmorra (Combina 3) — só o bestiário. */
  onBestiarySeen?: (enemyKey: string) => void;
  /** Refúgio (02/11/2026): uma atividade foi concluída (respiração inteira / 30 bolhas calmas) → energia do dia, 1×/dia (`utils/refugio/energia.ts`). */
  onRefugioComplete?: () => void;
  /** Dex de elementos (27/10/2026): ids de elemento de inimigos identificados VENCIDOS (Combina 3 e Arena). */
  onElementsDefeated?: (ids: readonly string[], drops?: readonly import('../../utils/essences').EssenceDrop[]) => void;
  /** BOSS do Elemental Fusion (03/11/2026): venceu um boss → +1 Fragmento de Boss no save. */
  onBossShard?: () => void;
  /** PVP do Elemental Fusion (§473): a Honra da partida, pelo mesmo caminho da Honra do Torneio. */
  onEarnHonor?: (amount: number) => void;
  /** Tutorial da 1ª abertura dos jogos do Ateliê da Mente (26/10/2026): o que já foi visto (save) e como gravar AO MOSTRAR. */
  mindTutorials?: { seen: MindGameTutorials; onShown: (id: MindGameId) => void };
  onDinoScore: (score: number) => void;
  /** 🎟️ Sessão dos minijogos de diversão (04/11/2026, `utils/funSession.ts`): o estado AGORA e a porta que começa uma rodada
   *  (cobra 1 energia ao abrir sessão; `false` = sem energia). Ausente (testes antigos) = jogos do Salão sem custo. */
  funSession?: { status: (nowMs: number) => FunTicketStatus; onBuy?: () => boolean; onStartRound: () => boolean };
  onSpendBits?: (pts: number) => boolean;
  /** Arena livre (28/10/2026): contador de rerolls do save, dia do jogador e o pedido de reroll (o App desconta Bits e grava). */
  arena?: { invites?: { count: number; max: number; perEnergy: number; canExchange: boolean; onExchange: () => boolean; onBegin: () => boolean }; dayIso: string; reroll?: ArenaReroll; onReroll: () => boolean; runs?: ArenaReroll; ladder?: number; onRunEnd?: (outcome: 'win' | 'loss' | 'draw') => void; };
  /** Dia do JOGADOR (`playerDayKey`) — o Picross do dia e a Revisão leem daqui.
   *  Sem ele (testes antigos), cai no dia UTC do aparelho. */
  todayKey?: string;
  /** Tarefas canônicas para o planejamento local da Oficina do Foco. */
  focusTasks?: Array<{ id: string; name: string; completed: boolean; kind?: 'habit'; ice?: Ice; steps?: Array<{ id: string; label: string; completed: boolean }> }>;
  onCompleteFocusTask?: (taskId: string) => void;
  /** beta12 §J: uma sessão de foco concluída com a tarefa escolhida (`habit:<id>` = hábito): marca o hábito de foco adotado que ela usou. */
  onFocusSessionTask?: (taskId?: string) => void;
  onToggleFocusStep?: (taskId: string, stepId: string) => void;
  /** Prioridades (ICE): grava/limpa as 4 notas na tarefa. */
  onSetFocusIce?: (taskId: string, ice: Ice | null) => void;
  /** Cria uma tarefa a partir do modal de escolha da sessão de foco (§300). `false` = não coube. */
  onCreateFocusTask?: (name: string) => boolean;
  onFocusReward?: (request: FocusLootRequest, completedCycles: number) => FocusRewardResult;
  onPlanReward?: (request: FocusLootRequest) => FocusRewardResult;
  /** beta3 F1: a chave do dia ("Prepare to Focus" concluído) libera a Focus Workshop. Ausente = sem trava (testes antigos). */
  focusKeyActive?: boolean;
  onFocusPrepared?: () => void;
  /** §239: a chave do Calabouço: concluir uma sessão da Oficina abre a dungeon naquele dia. Ausente = sem trava (testes antigos). */
  dungeonKeyActive?: boolean;
  /** §299: a chave existe no save mas passou das 48 h (o portão diz que expirou). */
  dungeonKeyExpired?: boolean;
  /** 13/11/2026 (dono): quando a chave do Calabouço expira (ms, `dungeonKeyExpiresAt`); o mapa da Exploração mostra a chave e o relógio. `null`/ausente = sem chave, nada no mapa. */
  dungeonKeyExpiresAt?: number | null;
  onFocusSessionComplete?: () => void;
  /** §247: recibos pagos pela jornada do foco (o crédito no save é idempotente). */
  onJourneyGrants?: (day: string, grants: JourneyGrants, dungeonKeyDay?: string) => void;
  /** beta3 F1: o timer de foco começou — a masmorra desce em background. */
  onFocusStart?: (focusEndsAt?: number) => 'started' | 'busy' | 'no-hp' | 'no-energy';
  /** O timer de foco foi pausado / continuou (novo fim) / cancelado: a descida do foco acompanha. */
  onFocusPause?: () => void;
  onFocusResume?: (focusEndsAt?: number) => void;
  onFocusCancel?: () => void;
  /** Os cartões da Revisão da Malha, que moram no SAVE (`GameState.review`). */
  review?: ReviewState;
  onReviewChange?: (next: ReviewState) => void;
  /** Bits de minijogo já creditados HOJE (`minigameBitsToday`) — as folhas
   *  mostram "X de 150" porque o teto é um só para todos os jogos. */
  minigameBitsToday?: number;
  /** beta3 M7: Calabouço roguelike — incursão no save, gravação e o combatente do pet. Ausente = placeholder. */
  rogue?: { saved?: RogueRun; onChange: (run: RogueRun) => void; combatant: Combatant };
}

/**
 * Os minijogos com a pergunta do Pipo antes de abrir (30/10/2026): ranking no topo + escolha. `difficulty` = Comum | Avançado
 * (a Corrida com obstáculos, o Pedra·Papel·Tesoura e a Chuva de Almas têm); os demais mostram um único "Jogar". Sem ranking/Refúgio/Fenda: sem a pergunta.
 */
const MINIGAME_GATE: Partial<Record<PlayGame, { name: { pt: string; en: string }; rankings: GateRanking[]; difficulty?: boolean; pveVsPvp?: boolean }>> = {
  dino: { name: { pt: 'Corrida com obstáculos', en: 'Obstacle Run' }, difficulty: true, rankings: [{ game: 'dino-1', label: 'Comum' }, { game: 'dino-2', label: 'Avançado' }] },
  ppt: { name: { pt: 'Pedra · Papel · Tesoura', en: 'Rock · Paper · Scissors' }, difficulty: true, rankings: [{ game: 'ppt' }] },
  barrage: { name: { pt: 'Chuva de Almas', en: 'Soul Barrage' }, difficulty: true, rankings: [{ game: 'soul-barrage', label: 'Comum' }, { game: 'soul-barrage-2', label: 'Avançado' }] },
  match3: { name: { pt: 'Fusão Elemental', en: 'Elemental Fusion' }, pveVsPvp: true, rankings: [{ game: 'match3', label: { pt: 'Aventura', en: 'Adventure' }, period: 'monthly' }, { game: 'match3-pvp', label: { pt: 'PvP', en: 'PvP' }, period: 'monthly' }] },
  eco: { name: { pt: 'Eco do Pet', en: "Pet's Echo" }, rankings: [{ game: 'eco' }] },
  zip: { name: { pt: 'Trilha do Pet', en: 'Pet Trail' }, rankings: [{ game: 'zip' }] },
};

export type PlayGame = 'masmorra' | SalaoGame | MenteGame | RefugioGame;
export type LabTab = 'evolution' | 'pet' | 'stats' | 'perfil';

type TournamentProps = ComponentProps<typeof TournamentPageT>;

export interface AreaViewProps {
  area: AreaId;
  /** O Soulmon JÁ está na descida (`soulmonNaMasmorra`): tocar a Fenda entra direto na tela da descida, sem a folha com o CTA. */
  naMasmorra?: boolean;
  /** 💎 O Soulmon está no CRISTAL da evolução: Masmorra, Fenda, Feira, Grove e Arena recusam com o aviso curto (`utils/evolutionCrystal.ts`). */
  emCristal?: boolean;
  /** Abre um jogo direto ao montar (o convite ao Refúgio abre a respiração).
   *  One-shot: o `App` limpa pelo `onInitialGameConsumed`. */
  initialGame?: PlayGame;
  onInitialGameConsumed?: () => void;
  /** O jogo veio do Fliperama de Canto da Home (§487): ao SAIR dele (voltar, fechar, sem ticket) a pessoa volta DIRETO à Home, sem passar pela área Jogos nem pelo mapa. Só vale junto de `initialGame`. */
  returnHomeOnGameExit?: boolean;
  onReturnHome?: () => void;
  /** Abre a folha de um lote ao montar (missão da Home → o lugar dela, ex.:
   *  `'passeio'`, `'torneio'`). One-shot: o `App` limpa pelo `onInitialSheetConsumed`. */
  initialSheet?: string;
  /** A SEÇÃO dentro do lote aberto por `initialSheet` (#187): `'arquivo'` no Perfil, `'amigos'` no Salão do Clã (atalhos de `BUILDING_HOME`). */
  initialSection?: string;
  onInitialSheetConsumed?: () => void;
  language: Language;
  /** DEMO LOCAL (`utils/demoMode.ts`): os prédios sociais (PvP, ranking, comunidade) ficam inertes. Derivado no `App` por `isDemoMode(gameState)`. */
  demo?: boolean;
  /** O Vínculo do usuário (`bondLevelFor(totalXP)`): decide quais prédios abrem (`BUILDING_GATES`). Sem ele, nada é trancado. */
  bondLevel?: number;
  /** Missão por prédio: só o aviso de que se entrou nele (`utils/buildingQuests.ts`). Só o MARCADOR vive no prédio; recolher a recompensa continua só no menu da Home (D-33/D-34, K-7). */
  onVisitBuilding?: (id: BuildingId) => void;
  /** O marcador da missão de cada prédio hoje (`buildingMarks`): "!" disponível (some ao fazer a missão), "?" pronta (não recolhe aqui). Ausente = nenhum. */
  buildingMarks?: Partial<Record<BuildingId, QuestMark>>;
  /** Recurso disponível agora em cada prédio (`lotCoins`): vira a moeda amarela ao lado do "!". Ausente = nenhuma. */
  buildingCoins?: Partial<Record<BuildingId, readonly string[]>>;
  /** Avisa se há camada de tela cheia aberta (folha/jogo/duelo). Estável (setState). */
  onLayerChange?: (open: boolean) => void;
  /** Há uma ATIVIDADE rodando agora (jogo aberto, duelo, luta do Torneio)? Diferente de `onLayerChange`: uma folha aberta não é atividade. Alimenta o portão da carta "Elemento novo". */
  onActivityChange?: (ativa: boolean | undefined) => void;
  /** Vai ao MAPA (a masmorra sai direto para ele, 14/10/2026). Sem a prop, a masmorra volta à área. */
  onGoToMap?: () => void;
  /** Posse + progresso de missão — o mesmo objeto para Mercado e Torneio. */
  ownership: ShopOwnership;
  actions: ShopActions;
  /** Seletor de moldura do widget V-Pet (aba Widget da lojinha de Background). */
  widgetFrames?: WidgetFramePickerData;
  points: number;
  emblems: number;
  credits: number;
  /** Dex de elementos (Biblioteca): o Cambista mostra "???" no que não foi desbloqueado. */
  unlockedElements?: readonly string[];
  onExchangeCredits: (packId: string) => Promise<boolean | BitsExchangeOutcome>;
  /** §386 (A4c): o atalho "Get Credits" do Cambista abre a compra de Créditos que já existe. */
  onGetCredits?: () => void;
  /** §386: o Cambista aberto reenvia os pacotes de Bits pendentes (rede caiu depois do débito). */
  onRecoverPendingBits?: () => void;
  /** Cambista (§205): compra de essência por Créditos (servidor cobra). Sem a prop, a aba fica só vitrine. */
  onBuyEssence?: (element: string, qty: number) => Promise<boolean>;
  essences?: Record<string, number>;
  accountTier?: 'demo' | 'paid';
  onUnlock?: () => void;
  /** D-16: o Mercado abre a lojinha de Background já na aba Frames (a moldura trancada do Perfil leva até lá). One-shot por montagem. */
  initialStallKind?: 'frames';
  /** D-58: as missões da semana e o Resgatar, no topo da aba Honra do Mercado. */
  weekly?: MercadoStallProps['weekly'];
  onClaimWeekly?: MercadoStallProps['onClaimWeekly'];
  /** As props do Torneio, prontas no `App` (partida, missões da semana…). */
  tournament: TournamentProps;
  /** Duelo → `ArenaGame`. */
  evolutionStage: string;
  demoCharacterId?: string;
  petName?: string;
  /** Level do jogador (`soulLevel`): teto de estágio de ARTE dos inimigos do Combina 3 (`enemyRoster.ts`). */
  playerLevel?: number;
  skills?: Partial<Record<FichaStage, StageSkills>>;
  /** Fase 3 do Oráculo — a profissão da ficha (`ficha/manifestacao.ts`), o
   *  jeito de agir na fenda (`utils/profissaoMasmorra.ts`). Só a masmorra lê. */
  profissao?: string | null;
  profissaoNome?: { pt: string; en: string } | null;
  /** Elemento dominante do Soulmon (`soulmonMeta.dominantElement`): a arte dos golpes da Masmorra. */
  petElement?: string;
  /** §232: a base nº 1 do Soulmon combinado. */
  petBase?: string;
  /** Devolve os Bits REALMENTE creditados (teto diario aplicado); as telas de resultado mostram esse valor. */
  onEarnPoints: (points: number, extraCap?: number, category?: BitsCategory) => number | void;
  /** Evento real de uso de um recurso (minijogo, foco, duelo) para as missões diárias (`utils/dailyMissions.ts`, REGISTRO §52). */
  onDailyEvent?: (event: DailyEvent) => void;
  /** Exploração + Jogos (F5). */
  play: PlayHandlers;
  /** 🧭 Passeio + Travessias (30/09/2026): o estado do save e o único caminho de
   *  escrita — uma função PURA de `utils/travessias` aplicada sobre `prev` no `App`.
   *  O Passeio vive INTEIRO no lote (NPC Lisel); a Home só lista a linha "Take a stroll" (07/10/2026). */
  passeio?: {
    crossings: CrossingsState;
    onChange: (f: (c: CrossingsState) => CrossingsState) => void;
    /** A semente do sorteio das missões do dia (o id do save). */
    seed?: string;
    /** O que o Soulmon encontrou no passeio de ontem (REGISTRO §66): o MESMO achado do resumo do dia, agora também aqui. */
    achado?: PasseioAchado | null;
    /** Concluir o passeio (cena + recompensas na hora, REGISTRO §413). */
    onDone?: () => void;
    /** A missão foi escolhida (o `App` mostra "Tarefa criada"). */
    onPicked?: () => void;
  };
  /** 📓 Caderno (04/10/2026): as anotações (do save) e o único caminho de escrita. */
  caderno?: {
    entries: CadernoEntry[];
    onChange: (f: (c: CadernoEntry[]) => CadernoEntry[]) => void;
  };
  /** Laboratório (F5, ex-PR #117): a aba ativa (estado do `App`, porque ela
   *  também decide o `pane`) e o conteúdo já montado — Evolução/Soulmon/Stats
   *  dependem de dezenas de handlers do `App` (cerimônia, renascimento…), que
   *  continuam donos dele. */
  labTab: LabTab;
  /** Cada construção do Laboratório escolhe a sub-aba (o `App` é dono do estado). */
  onLabTab: (tab: LabTab) => void;
  labContent: ReactNode;
  /** Criar poção (saiu do Centro de Evolução): o `App` monta a folha; o prédio abre por esta escolha de 2 opções. */
  potionContent?: ReactNode;
  onOpenPotion?: () => void;
  /** Hall (F5, ex-PR #117): a `LibraryPage` embutida, montada no `App` — uma
   *  visão por construção (Biblioteca = diretório, Círculo de Amigos = amigos). */
  hallContent: (view: 'directory' | 'friends') => ReactNode;
  /** A Guilda (o Hall abre o Salão; a Arena abre a Feira — a mesma folha, salas diferentes). */
  guild: {
    saveId: string; metaDoDiaCumprida: boolean; playerDayTz?: PlayerDayAnchor;
    /** Meta como o servidor a confere (Guilda, o fio) e a criatura de quem olha. */
    fioGoal?: GuildGoal; pendentesDoDia?: string[]; mySprite?: string | null;
    /** Resgate da Feira confirmado (soma Emblemas/Concha no save) e cenários liberados. */
    onClaimed?: (claim: { emblems: number; trophyId: string | null }) => void;
    onScenes?: (ids: string[]) => void;
    /** Sem conta (401): o convite de criar conta (demo) e o caminho até Entrar. */
    accountTier?: 'demo' | 'paid';
    onUnlock?: () => void;
    onLogin?: () => void;
    /** A Casa da guilda (PR2): carteira, inventário e o que mudou. Ver `GuildSheet` › `casa`. */
    casa?: ComponentProps<typeof GuildSheetT>['casa'];
    /** A Missão (PR3): estado da ida do Soulmon e o gesto de mandá-lo. */
    missao?: ComponentProps<typeof GuildSheetT>['missao'];
    /** Feira do Chefe: reabrir o evento pela sala (só com `guild.feira` na vista). */
    feira?: ComponentProps<typeof GuildSheetT>['feira'];
    cla?: ComponentProps<typeof GuildSheetT>['cla'];
  };
}

/** Abas de SEÇÃO dentro de um lote que absorveu a função de outro prédio (#187): Perfil | Arquivo e Clã | Amigos. Mesmo visual das abas da Biblioteca (`sm2-kit-tab`). */
function SectionTabs<K extends string>({ label, items, active, onPick }: { label: string; items: { key: K; label: string }[]; active: K; onPick: (k: K) => void }) {
  return (
    <div role="tablist" aria-label={label} className="sm2-kit-tabs" data-section-tabs style={{ marginBottom: 12 }}>
      {items.map(it => (
        <button
          key={it.key}
          type="button"
          role="tab"
          aria-selected={it.key === active}
          data-section-tab={it.key}
          onClick={() => onPick(it.key)}
          className={it.key === active ? 'sm2-kit-tab sm2-kit-tab-on' : 'sm2-kit-tab'}
          style={{ flex: '1 0 auto', padding: '0 12px', whiteSpace: 'nowrap' }}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

/** A sub-aba do `App` que cada lote do Laboratório mostra (`'pet'` = a seção Arquivo, dentro do lote Perfil). */
const LAB_TAB_OF: Partial<Record<LaboratorioLotId, LabTab>> = { evolucao: 'evolution', stats: 'stats', perfil: 'perfil' };

/** Espera curta dentro da folha — o conteúdo é `lazy`, e a folha já está
 *  aberta: nunca um branco sem explicação. */
function SheetLoading({ language }: { language: Language }) {
  // beta-2 (9.4): o mesmo esqueleto minimalista do app, na variante dentro da folha (antes, um parágrafo próprio).
  return <ScreenSkeleton language={language} variant="inline" label={language === 'pt-BR' ? 'Abrindo' : 'Opening'} />;
}

export function AreaView(props: AreaViewProps) {
  const { area, language, ownership, actions } = props;
  /** Prédio trancado neste Vínculo? (`null` = aberto, ou sem `bondLevel`). O gate vale na ENTRADA do prédio. */
  const lockOf = (lotId: string) => {
    if (props.bondLevel === undefined) return null;
    const g = buildingGateFor(`${area}.${lotId}` as BuildingId, props.bondLevel);
    return g.open ? null : g;
  };
  /** Entrar no prédio: abre a folha e conta a missão do dia dele (só chega aqui se o prédio abriu; `gated` troca o `onOpen` dos trancados). */
  const { onVisitBuilding } = props;
  const enter = (lotId: string) => { onVisitBuilding?.(`${area}.${lotId}` as BuildingId); setSheet(lotId); };
  /** DEMO: o prédio é social e a demo não entra em PvP/ranking/comunidade. */
  const demoBlocks = (lotId: string | null | undefined) => !!props.demo && !!lotId && isDemoBlockedLot(area, lotId);
  /** Forma BB (D5): Torneio, Duelo e Guilda recusam, com motivo (mesma faixa de aviso do cadeado). */
  const bbBlocks = (lotId: string | null | undefined) =>
    !!lotId && `${area}.${lotId}` in BB_LOCKED_BUILDINGS && bbRefusal({ evolutionStage: props.evolutionStage }) !== null;
  const cristalBlocks = (lotId: string | null | undefined) => !!props.emCristal && crystalBlocksLot(area, lotId);
  /* 💤 Soulmon dormindo (REGISTRO §329, `utils/wakeToEnter.ts`): só o prédio cuja ENTRADA já é a atividade (`SLEEP_BLOCKED_LOTS`, o
     Calabouço) pergunta na porta. As folhas com parte de leitura (Arena, Torneio, Guerra, Fenda, Passeio, Oficina, Feira, Grove —
     `SLEEP_ACTION_LOTS`) entram livres; o botão de lutar/agir lá dentro pergunta na hora do toque. Mapa, lojas e Laboratório, livres. */
  const wakeGate = useWakeGate();
  const sleepEntry = (lotId: string | null | undefined): string | null =>
    lotId && lotEntryAsks(`${area}.${lotId}`) ? `${area}.${lotId}` : null;
  const initialDemoBlocked = demoBlocks(props.initialSheet) || bbBlocks(props.initialSheet) || cristalBlocks(props.initialSheet);
  const initialLock = props.initialSheet && !initialDemoBlocked ? lockOf(props.initialSheet) : null;
  /* Atalho da Home/missão para um prédio de atividade com o Soulmon dormindo: a folha não abre na montagem; a pergunta abre (efeito abaixo). */
  const initialSleepEntry = props.initialSheet && !initialLock && !initialDemoBlocked ? sleepEntry(props.initialSheet) : null;
  const [initialSleepHeld] = useState(() => !!initialSleepEntry && wakeGate.held(initialSleepEntry));
  /* Plaquinha da Home "Ir à Fenda": com o Soulmon lá, `initialSheet: 'fenda'` abre direto a TELA da descida (como o toque no lote), sem a folha de início. */
  const initialFenda = props.area === 'exploracao' && props.initialSheet === 'fenda' && !!props.naMasmorra && !initialLock && !initialDemoBlocked;
  const [sheet, setSheet] = useState<string | null>(initialLock || initialDemoBlocked || initialFenda || initialSleepHeld ? null : props.initialSheet ?? null);
  const [lockNote, setLockNote] = useState<string | null>(
    cristalBlocks(props.initialSheet) ? crystalRefusalText(language === 'pt-BR')
      : bbBlocks(props.initialSheet) ? bbRefusalText(language === 'pt-BR')
      : initialDemoBlocked ? demoRefusalText(language === 'pt-BR')
      : initialLock ? buildingLockLine(initialLock.minBond, language) : null);
  /* O aviso de prédio trancado NÃO some sozinho (dono, 16/11/2026): só pelo X da faixa. */
  const gsCtx = useGameStateOptional();
  const gsForIndicators = gsCtx?.gameState;
  /** O mapa de andares do Rift em tela cheia (REGISTRO §462). */
  const [riftMapOpen, setRiftMapOpen] = useState(false);
  const [labChoice, setLabChoice] = useState(false); // Centro de Evolução: Evolution Center / Create Potion
  /** "Entrar no Rift" na folha: a descida larga SOZINHA do ponto onde parou, sem o lobby nem 2º toque (pedido do dono, 16/11/2026). */
  const [riftAuto, setRiftAuto] = useState(false);
  const lotFlags = useMemo(() => lotIndicators(gsForIndicators), [gsForIndicators]);
  /** Tranca os prédios fechados: arte cinza + cadeado, e o toque só mostra o aviso neutro. */
  const gated = (lots: AreaLot[]): AreaLot[] => lots.map(lote => {
    let l = lote;
    // DEMO: prédio social → toque inerte, com a recusa curta na mesma faixa de aviso.
    if (cristalBlocks(l.id)) return { ...l, mark: undefined, onOpen: () => setLockNote(crystalRefusalText(language === 'pt-BR')) };
    if (bbBlocks(l.id)) return { ...l, mark: undefined, onOpen: () => setLockNote(bbRefusalText(language === 'pt-BR')) };
    if (demoBlocks(l.id)) return { ...l, mark: undefined, onOpen: () => setLockNote(demoRefusalText(language === 'pt-BR')) };
    const g = lockOf(l.id);
    const dormindo = sleepEntry(l.id);
    if (!g && dormindo) {
      const abrir = l.onOpen;
      l = { ...l, onOpen: () => { wakeGate.require(dormindo, abrir); } };
    }
    if (!g) return { ...l, mark: props.buildingMarks?.[`${area}.${l.id}` as BuildingId] ?? undefined, coin: (props.buildingCoins?.[`${area}.${l.id}` as BuildingId]?.length ?? 0) > 0, indicator: lotFlags[`${area}.${l.id}`] };
    return { ...l, mark: undefined, locked: { minBond: g.minBond }, onOpen: () => setLockNote(buildingLockLine(g.minBond, language)) };
  });
  const [duelOpen, setDuelOpen] = useState(false);
  /** A semente do desafio escolhido na Arena (`DueloSheet`). */
  const [duelSeed, setDuelSeed] = useState<number | undefined>(undefined);
  /** O encaixe do canto do título da folha do Torneio (o indicador da faixa entra por portal). */
  const [tournamentHead, setTournamentHead] = useState<HTMLElement | null>(null);
  /** O duelo do Torneio está na tela: o `BattleStage` traz o voltar dele, a folha esconde o seu (uma seta só). */
  const [tournamentDuelOpen, setTournamentDuelOpen] = useState(false);
  const [game, setGame] = useState<PlayGame | null>(props.initialGame ?? (initialFenda ? 'masmorra' : null));
  /** O Pipo perguntou o modo (30/10/2026, `MinigameModeGate`): o jogo só monta depois da resposta; `level` só nos jogos com dificuldade. */
  const [modeChosen, setModeChosen] = useState<{ game: PlayGame; level?: 1 | 2; choice?: M3Choice } | null>(null);
  /* 🎟️ A rodada do Salão é cobrada quando o jogo COMEÇA de fato (depois da pergunta do NPC, se houver): voltar da pergunta
     não gasta rodada. Uma cobrança por abertura (`funChargedRef`); recusa (sem energia) fecha o jogo. */
  const funApi = props.play?.funSession; // `play` é opcional na prática: áreas sem jogos montam sem ele
  const funChargedRef = useRef<string | null>(null);
  /* Sem energia: fecha o jogo e devolve à folha do Salão, com o aviso em destaque. */
  const [funRefused, setFunRefused] = useState(false);
  const refuseFun = () => { setGame(null); setModeChosen(null); setFunRefused(true); setSheet('salao'); };
  const replayRound = () => {
    if (funApi && !funApi.onStartRound()) { refuseFun(); return false; }
    if (game) { endRoundRef.current?.(); endRoundRef.current = trackMinigame(game); } // nova rodada = nova partida nas métricas
    return true;
  };
  const funRunning = !!game && isFunGame(game) && (!MINIGAME_GATE[game] || modeChosen?.game === game);
  const funKey = funRunning ? `${game}:${modeChosen?.level ?? 0}:${modeChosen ? 'm' : 'n'}` : null;
  useEffect(() => {
    if (!funKey) { funChargedRef.current = null; return; }
    if (funChargedRef.current === funKey || !funApi) return;
    funChargedRef.current = funKey;
    if (!funApi.onStartRound()) refuseFun();
  }, [funKey, funApi]);
  /* Métricas de tempo (docs/PLANO-METRICAS.md): o prédio aberto (feature) e o jogo em andamento (minigame). Só agregado; o nome vem do registro. */
  useEffect(() => { setActive('feature', sheet ? `${area}.${sheet}` : null); return () => setActive('feature', null); }, [area, sheet]);
  const endRoundRef = useRef<((o?: 0 | 1 | 2) => void) | null>(null);
  const gameRunning = !!game && (!MINIGAME_GATE[game] || modeChosen?.game === game);
  useEffect(() => {
    if (!gameRunning || !game) return;
    endRoundRef.current = trackMinigame(game);
    setActive('minigame', game);
    return () => { endRoundRef.current?.(); endRoundRef.current = null; setActive('minigame', null); };
  }, [gameRunning, game]);
  /* §487: jogo aberto pelo Fliperama da Home: ao sair dele, volta DIRETO à Home (a decisão vale pela montagem; sair da área não a rearma). */
  const voltaAHomeRef = useRef(!!props.returnHomeOnGameExit && !!props.initialGame);
  const jaTeveJogoRef = useRef(false);
  const { onReturnHome } = props;
  useEffect(() => {
    if (game) { jaTeveJogoRef.current = true; return; }
    if (jaTeveJogoRef.current && voltaAHomeRef.current) { voltaAHomeRef.current = false; onReturnHome?.(); }
  }, [game, onReturnHome]);
  const { onInitialGameConsumed } = props;
  useEffect(() => { if (props.initialGame) onInitialGameConsumed?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { onInitialSheetConsumed } = props;
  useEffect(() => {
    if (!props.initialSheet) return;
    const lote = props.initialSheet;
    if (initialSleepHeld && initialSleepEntry) {
      // 💤 §329: a pergunta abre; "Acordar" entra no prédio pedido (conta a visita só aí), "Agora não" fica na área.
      wakeGate.require(initialSleepEntry, () => { onVisitBuilding?.(`${area}.${lote}` as BuildingId); setSheet(lote); });
    } else if (!initialLock && !initialDemoBlocked) onVisitBuilding?.(`${area}.${lote}` as BuildingId);
    onInitialSheetConsumed?.();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // #187: um atalho a `laboratorio.pet` (Arquivo) abre o Perfil JÁ na seção Arquivo — a visita do prédio do Arquivo conta como antes.
  /* O link do hábito ("Ir ao Caderno") traz o formato em `initialSection`; vale só para a abertura vinda dele. */
  const [cadernoFormatoIni] = useState<'gratidao' | 'livre' | 'importa' | undefined>(() => (props.initialSheet === 'caderno' && (props.initialSection === 'gratidao' || props.initialSection === 'livre' || props.initialSection === 'importa') ? (props.initialSection as 'gratidao' | 'livre' | 'importa') : undefined));
  const [guildaSection, setGuildaSection] = useState<'cla' | 'amigos'>(props.initialSection === 'amigos' && !initialDemoBlocked ? 'amigos' : 'cla');
  useEffect(() => {
    if (area === 'laboratorio' && props.initialSheet && !initialLock) {
      const tab = props.initialSection === 'arquivo' ? 'pet' : LAB_TAB_OF[props.initialSheet as LaboratorioLotId];
      if (tab) props.onLabTab(tab);
      if (props.initialSection === 'arquivo') onVisitBuilding?.('laboratorio.pet');
    }
    if (area === 'hall' && props.initialSheet === 'guilda' && props.initialSection === 'amigos' && !initialLock && !initialDemoBlocked) onVisitBuilding?.('laboratorio.amigos');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const closeLabel = language === 'pt-BR' ? 'Voltar' : 'Back'; // L2: tela cheia nunca diz "Fechar"
  /* D-16: capturado na montagem (o `App` limpa o pedido logo depois e a folha do Mercado é `lazy` — ela monta DEPOIS disso).
     Vale só para a primeira abertura: fechar a folha apaga. */
  const [stallKind, setStallKind] = useState(props.initialStallKind);
  const close = () => { setSheet(null); setStallKind(undefined); };
  // R1: qualquer camada de tela cheia (folha, jogo, duelo) avisa o `App`, que
  // esconde o topo sobre a cena — ele não pode competir com o ✕/voltar da camada.
  const layerOpen = sheet !== null || duelOpen || game !== null;
  // J1 (rodada 7): baixa os chunks de jogar ANTES do toque (ver `playPrefetch.ts`).
  usePlayPrefetch(area === 'exploracao' || area === 'jogos' || area === 'forja', sheet !== null);
  const { onLayerChange } = props;
  useEffect(() => {
    onLayerChange?.(layerOpen);
    return () => onLayerChange?.(false);
  }, [layerOpen, onLayerChange]);
  const emAtividadeAgora = game !== null || duelOpen || tournamentDuelOpen;
  const { onActivityChange } = props;
  useEffect(() => {
    onActivityChange?.(emAtividadeAgora);
    return () => onActivityChange?.(undefined);
  }, [emAtividadeAgora, onActivityChange]);
  // O voltar do sistema sai do jogo/duelo em andamento antes de trocar de tela.
  useBackLayer(duelOpen, () => setDuelOpen(false));
  // A masmorra registra o PRÓPRIO voltar (vai direto ao mapa, igual ao ícone do mapa); os outros jogos voltam à área.
  useBackLayer(game !== null && game !== 'masmorra', () => setGame(null));

  if (area === 'mercado') {
    const lots = mercadoLots(language);
    const open = lots.find(l => l.id === sheet) ?? null;
    // Restaurante: o busto e a fala são os do chef DO DIA (do jogador), e no domingo os dois lado a lado (`chefsOn`); o resto do Mercado segue o NPC do lote.
    const chefsHoje = chefsOn(playerWeekday(new Date(), gsForIndicators?.playerDayTz));
    const restNpc = open?.id === 'restaurante'
      ? { npcArt: RESTAURANT_CHEF_ART[chefsHoje[0]], npcArt2: chefsHoje[1] ? RESTAURANT_CHEF_ART[chefsHoje[1]] : undefined, npcVoice: restaurantNpcVoice(chefsHoje, language === 'pt-BR') }
      : {};
    const stall = open && open.id !== 'conquistas' && open.id !== 'restaurante' && open.id !== 'cambista' ? open.id as Exclude<MercadoLotId, 'conquistas' | 'restaurante' | 'cambista'> : null;
    return (
      <AreaScene
        areaId={area}
        language={language}
        background={AREA_BG.mercado}
        // O Restaurante (aberto em 05/11/2026) e o Cambista (30/10/2026) ficam FORA do `gated`: sempre aberto, sem Vínculo mínimo, sem missão (não é `BuildingId`).
        lots={lots.map(l => l.id === 'restaurante' || l.id === 'cambista'
          ? ({ ...l, art: MERCADO_LOT_ART[l.id], onOpen: () => setSheet(l.id) } satisfies AreaLot)
          : gated([{ ...l, art: MERCADO_LOT_ART[l.id], onOpen: () => setSheet(l.id) } satisfies AreaLot])[0])}
        notice={lockNote} onNoticeClose={() => setLockNote(null)}
      >
        <AreaSheet
          areaId={area}
          lotId={open?.id}
          language={language}
          title={open?.label ?? ''}
          closeLabel={closeLabel}
          open={!!open}
          onClose={close}
          {...restNpc}
        >
          <Suspense fallback={<SheetLoading language={language} />}>
            {stall && (
              <MercadoStallSheet
                key={stall}
                stall={stall}
                language={language}
                points={props.points}
                emblems={props.emblems}
                initialKind={stall === 'background' ? stallKind : undefined}
                weekly={props.weekly}
                onClaimWeekly={props.onClaimWeekly}
                widgetFrames={props.widgetFrames}
                {...ownership}
                {...actions}
              />
            )}
            {open?.id === 'restaurante' && <RestauranteSheet language={language} />}
            {open?.id === 'cambista' && (
              <CambistaSheet language={language} credits={props.credits} onExchangeCredits={props.onExchangeCredits} onRecoverPendingBits={props.onRecoverPendingBits} onGetCredits={props.onGetCredits} accountTier={props.accountTier} onUnlock={props.onUnlock} unlockedElements={props.unlockedElements} essences={props.essences} onBuyEssence={props.onBuyEssence} />
            )}
            {open?.id === 'conquistas' && (
              <ConquistasSheet language={language} missionProgress={ownership.missionProgress} claimed={ownership.missionClaimed} shop={{ ownedBackgrounds: ownership.ownedBackgrounds, balance: props.points, onBuy: id => actions.onBuy(id) === true }} />
            )}
          </Suspense>
        </AreaSheet>
      </AreaScene>
    );
  }

  /* 🎟️ Jogo do Salão: sem sessão nem energia, não abre (a folha mostra a frase). A rodada é cobrada quando o jogo COMEÇA (após a
     pergunta do NPC, se houver) — voltar da pergunta não gasta rodada. */
  const funGate = funApi;
  /* 💤 Jogo com o Soulmon dormindo (§329; antes, §112, era só o aviso curto do início de dia): pergunta e, ao acordar, o jogo abre. */
  const start = (g: PlayGame) => { wakeGate.require(g, () => { setSheet(null); setModeChosen(null); setGame(g); }); };
  /** A porta do Salão: sem sessão nem energia, não abre (a folha já mostra a frase calma). */
  const startSalao = (g: PlayGame) => {
    if (funGate && isFunGame(g) && !funGate.status(Date.now()).canPlay) return;
    setFunRefused(false);
    start(g);
  };
  /** A Fenda Sem Fim (a antiga Masmorra): mora na Exploração (#187, 28/10/2026; esteve na Arena de beta3 N10 até então); o jogo abre em tela cheia sobre a cena da área. */
  const renderMasmorra = () => {
    const { play } = props;
    const exitGame = () => { setRiftAuto(false); setGame(null); };
    return (
            <DungeonGame
              autoStart={riftAuto}
              evolutionStage={props.evolutionStage}
              demoCharacterId={props.demoCharacterId}
              profissao={props.profissao}
              profissaoNome={props.profissaoNome}
              petElement={props.petElement}
              skills={props.skills}
              language={language}
              onEnter={play.onDungeonEnter}
              onLose={play.onDungeonLose}
              onHeartDrop={play.onDungeonHeartDrop}
              onGlitchtama={play.onGlitchtama}
              onFloorCleared={play.onFloorCleared}
              onRunEnd={play.onRunEnd}
              onEnemyDefeated={play.onDungeonEnemyDefeated}
              onEnemySeen={play.onBestiarySeen}
              onEarnPoints={(pts, extra) => props.onEarnPoints(pts, extra, 'explorar')}
              rankSaveId={props.guild.saveId}
              /* WP4.5 — o sumidouro recorrente: comprar profundidade com Bits. */
              bits={props.points}
              onSpendBits={play.onSpendBits}
              onExit={exitGame}
              onExitToMap={() => { setRiftAuto(false); setGame(null); props.onGoToMap?.(); }}
              onOpenRiftMap={() => { setRiftAuto(false); setGame(null); setSheet(null); setRiftMapOpen(true); }}
            />
    );
  };

  if (area === 'arena') {
    const lots = arenaLots(language);
    const open = lots.find(l => l.id === sheet) ?? null;
    const conviteArt = props.play?.arena?.invites ? conviteDueloFan(language, props.play.arena.invites.max) : undefined;
    return (
      <AreaScene
        areaId={area}
        language={language}
        background={AREA_BG.arena}
        lots={gated(lots.map(l => ({ ...l, art: ARENA_LOT_ART[l.id], onOpen: () => enter(l.id) } satisfies AreaLot)))}
        notice={lockNote} onNoticeClose={() => setLockNote(null)}
      >
        <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close} headSlotRef={open?.id === 'torneio' ? setTournamentHead : undefined} hideClose={open?.id === 'torneio' && tournamentDuelOpen}
          npcOverlay={open?.id === 'duelo' && props.play?.arena?.invites && conviteArt ? <TicketFan count={props.play.arena.invites.count} language={language} art={conviteArt} /> : undefined}>
          <Suspense fallback={<SheetLoading language={language} />}>
            {open?.id === 'torneio' && (
              <TournamentPage {...props.tournament} onEnemySeen={props.play.onBestiarySeen} skills={props.skills} headSlot={tournamentHead} onCoverChange={setTournamentDuelOpen} />
            )}
            {open?.id === 'duelo' && (
              <DueloSheet
                language={language}
                evolutionStage={props.evolutionStage}
                arena={{ dayIso: props.play.arena?.dayIso ?? playerDayIso(new Date(), undefined), accountKey: props.guild.saveId ?? 'local', reroll: props.play.arena?.reroll, runs: props.play.arena?.runs, ladder: props.play.arena?.ladder, invites: props.play.arena?.invites, bits: props.points, onReroll: props.play.arena?.onReroll ?? (() => false) }}
                // 💤 §329: a folha é livre (oponentes, sorteio); LUTAR pergunta, no toque (o sono automático pode chegar com ela aberta).
                onStart={(seed) => { wakeGate.require('arena.duelo', () => { setSheet(null); setDuelSeed(seed); setDuelOpen(true); }); }}
              />
            )}
            {open?.id === 'guerra' && (
              <GuildSheet room="guerra" language={language} {...props.guild} />
            )}
          </Suspense>
        </AreaSheet>
        {duelOpen && (
          <Suspense fallback={<SheetLoading language={language} />}>
            <ArenaGame
              petBase={props.petBase}
              seed={duelSeed}
              evolutionStage={props.evolutionStage}
              demoCharacterId={props.demoCharacterId}
              language={language}
              skills={props.skills}
              petElement={props.petElement}
              onElementsDefeated={props.play.onElementsDefeated}
              onEnemySeen={props.play.onBestiarySeen}
              onEarnPoints={(pts, extra) => { const creditado = props.onEarnPoints(pts, extra, 'arena'); props.onDailyEvent?.('arena'); return creditado; }}
              onRunEnd={props.play.arena?.onRunEnd}
              onBeginRun={props.play.arena?.invites?.onBegin}
              ladder={props.play.arena?.ladder}
              onExit={() => setDuelOpen(false)}
            />
          </Suspense>
        )}
      </AreaScene>
    );
  }

  if (area === 'exploracao' || area === 'jogos' || area === 'forja') {
    const exitGame = () => { setModeChosen(null); setGame(null); };
    const lots: AreaLot[] = gated(area === 'exploracao'
      ? exploracaoLots(language).map(l => ({
        // A Fenda Sem Fim abre a folha com as DUAS portas (Descer / Ver o mapa, §462); com o Soulmon JÁ na descida, "Descer" entra direto na tela dela (`naMasmorra`).
        ...l, art: EXPLORACAO_LOT_ART[l.id], onOpen: () => enter(l.id),
      }))
      : area === 'forja'
        ? forjaLots(language).map(l => ({ ...l, art: FORJA_LOT_ART[l.id], onOpen: () => enter(l.id) }))
        : jogosLots(language).map(l => ({ ...l, art: JOGOS_LOT_ART[l.id], onOpen: () => enter(l.id) })));
    const open = lots.find(l => l.id === sheet) ?? null;
    const { play } = props;
    /** O Calabouço (exploracao.dungeon) com a incursão no save abre em TELA CHEIA, sem a folha (N7). */
    const rogueFull = area === 'exploracao' && open?.id === 'dungeon' && !!play.rogue && play.dungeonKeyActive !== false;
    const rogueGate = area === 'exploracao' && open?.id === 'dungeon' && !!play.rogue && play.dungeonKeyActive === false;
    const base = {
      evolutionStage: props.evolutionStage,
      demoCharacterId: props.demoCharacterId,
      language,
      onExit: exitGame,
    };
    const mt = play.mindTutorials;
    const mindTut = (id: MindGameId) => (mt ? { seen: mt.seen[id] === true, onShown: () => mt.onShown(id) } : undefined);
    return (
      <AreaScene areaId={area} language={language} background={area === 'forja' ? FORJA_BG : PLAY_AREA_BG[area]} lots={lots} notice={lockNote} onNoticeClose={() => setLockNote(null)}
        palco={area === 'exploracao' ? <DungeonKeyBadge expiresAt={play.dungeonKeyExpiresAt} language={language} /> : undefined}>
        <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open && !rogueFull && !rogueGate} onClose={close} moldura={area === 'forja' && open?.id === 'hexsmith' ? 'aco' : undefined} npcOverlay={open?.id === 'salao' && play.funSession ? <TicketFan count={play.funSession.status(Date.now()).count} language={language} /> : undefined}>
          <Suspense fallback={<SheetLoading language={language} />}>
            {open?.id === 'passeio' && (
              <PasseioSheet
                language={language}
                crossings={props.passeio?.crossings ?? CROSSINGS_EMPTY}
                onChange={props.passeio?.onChange ?? (() => {})}
                todayKey={play.todayKey}
                seed={props.passeio?.seed}
                achado={props.passeio?.achado}
                onDone={props.passeio?.onDone ? () => { close(); props.passeio?.onDone?.(); } : undefined}
                onPicked={() => { close(); props.passeio?.onPicked?.(); }}
              />
            )}
            {/* beta3 N8 (26/10/2026): a Oficina abre primeiro a etapa 1 (Prepare to Focus); concluída, libera a etapa 2 (workshop/timer). */}
            {/* §247: a Oficina é o quadro de cards + a jornada (substitui o Preparar → chave → timer). */}
            {open?.id === 'oficina' && <FocusBoard language={language} todayKey={play.todayKey ?? playerDayIso(new Date(), undefined)} saveId={props.guild.saveId} tasks={play.focusTasks ?? []} petSprite={props.guild.mySprite ?? undefined} onCompleteTask={play.onCompleteFocusTask ?? (() => {})} onToggleStep={play.onToggleFocusStep ?? (() => {})} onSetIce={play.onSetFocusIce} onCreateTask={play.onCreateFocusTask} onGrants={play.onJourneyGrants ?? (() => {})} onFocusCycle={(taskId) => { props.onDailyEvent?.('foco'); play.onFocusSessionTask?.(taskId); }} />}
            {open?.id === 'caderno' && <CadernoSheet formatoInicial={cadernoFormatoIni} language={language} todayKey={play.todayKey} entries={props.caderno?.entries ?? []} onChange={props.caderno?.onChange ?? (() => {})} />}
            {open?.id === 'fenda' && <MasmorraSheet language={language} saveId={props.guild.saveId} bitsToday={play.minigameBitsToday} onStart={() => { setRiftAuto(true); if (props.naMasmorra) { setSheet(null); setGame('masmorra'); } else start('masmorra'); }} onMap={() => { setSheet(null); setRiftMapOpen(true); }} />}
            {/* 23/11/2026 (dono): a folha do Soulsmith abre COM a Vitra (fala + retrato, como na Hexsmith) e a Forja de Alma (ForgeCard, lista de upar) mora DENTRO dela, rolável; o ✕ é o da folha. */}
            {open?.id === 'ferreiro' && <ForgeCard language={language} view="map" inline />}
            {/* 🔣 A Hexsmith (01/11/2026): o mapa de slots que reescreve o código hex (`components/hex/HexsmithSheet.tsx`, lê/grava o save pelo contexto). */}
            {open?.id === 'hexsmith' && <HexsmithSheet language={language} sprite={props.guild.mySprite} demoCharacterId={props.demoCharacterId} evolutionStage={props.evolutionStage} skills={props.skills} petElement={props.petElement} />}
            {open?.id === 'salao' && <SalaoSheet language={language} bitsToday={play.minigameBitsToday} onStart={startSalao} funStatus={play.funSession?.status} onBuyTickets={play.funSession?.onBuy ? () => play.funSession!.onBuy!() : undefined} refused={funRefused} />}
            {open?.id === 'mente' && <MenteSheet language={language} bitsToday={play.minigameBitsToday} onStart={start} />}
            {open?.id === 'refugio' && <RefugioSheet language={language} onStart={start} />}
            {open?.id === 'dungeon' && !play.rogue && <RogueDungeonPlaceholder language={language} />}
          </Suspense>
        </AreaSheet>
        {riftMapOpen && (
          <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" label={language === 'pt-BR' ? 'Abrindo' : 'Opening'} />}>
            <RiftMap language={language} save={gsCtx?.gameState ?? {}} sprite={props.guild.mySprite} onClose={() => { setRiftMapOpen(false); setSheet('fenda'); }}
              onRewind={(i) => gsCtx?.setGameState(prev => rewindToSet(prev, i))}
              onTeleport={(o) => gsCtx?.setGameState(prev => teleportToPortal(prev, o))} />
          </Suspense>
        )}
        {/* beta3 N7: o Calabouço é um MAPA em tela cheia (não uma folha); fecha de volta à área. */}
        {rogueGate && <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" />}><RogueKeyGate language={language} onClose={close} expired={play.dungeonKeyExpired} onGoToWorkshop={() => { close(); requestGoToBuilding('forja.oficina'); }} /></Suspense>}
        {rogueFull && play.rogue && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 6000 }}>
            <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" label={language === 'pt-BR' ? 'Abrindo' : 'Opening'} />}>
              <RogueDungeon petBase={props.petBase} language={language} todayKey={play.todayKey ?? playerDayIso(new Date(), undefined)} saved={play.rogue.saved} onChange={play.rogue.onChange} combatant={play.rogue.combatant} saveId={props.guild.saveId} onEarnPoints={(pts) => props.onEarnPoints(pts, 0, 'explorar')} evolutionStage={props.evolutionStage} demoCharacterId={props.demoCharacterId} petName={props.petName} petElement={props.petElement} playerLevel={props.playerLevel} skills={props.skills} onClose={close} onEnemySeen={play.onBestiarySeen} />
            </Suspense>
          </div>
        )}
        {game && MINIGAME_GATE[game] && modeChosen?.game !== game && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 6000 }}>
            <MinigameModeGate
              language={language}
              gameName={MINIGAME_GATE[game]!.name[language === 'pt-BR' ? 'pt' : 'en']}
              rankings={MINIGAME_GATE[game]!.rankings}
              saveId={props.guild.saveId}
              tickets={isFunGame(game) ? funApi?.status(Date.now()).count : undefined}
              withDifficulty={!!MINIGAME_GATE[game]!.difficulty}
              pveVsPvp={!!MINIGAME_GATE[game]!.pveVsPvp}
              renderChoices={game === 'match3'
                ? (level: 1 | 2, pick: (c: M3Choice) => void) => <Match3Escolha language={language} mode={level === 2 ? 'pvp' : 'adventure'} saveId={props.guild.saveId} playerLevel={props.playerLevel} onFight={pick} />
                : undefined}
              onPick={(level, choice) => setModeChosen({ game, level, ...(choice ? { choice: choice as M3Choice } : {}) })}
              onBack={exitGame}
            />
          </div>
        )}
        {game && (!MINIGAME_GATE[game] || modeChosen?.game === game) && (
          <FunTicketCostContext.Provider value={!!funApi && isFunGame(game)}>
          <div style={{ position: 'absolute', inset: 0, zIndex: 6000 }}>
          <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" label={language === 'pt-BR' ? 'Abrindo' : 'Opening'} />}>
            {game === 'masmorra' && renderMasmorra()}
            {game === 'dino' && (
              <DinoGame
                evolutionStage={props.evolutionStage}
                demoCharacterId={props.demoCharacterId}
                language={language}
                initialLevel={modeChosen?.level}
                onEarnPoints={(pts) => { const creditado = props.onEarnPoints(pts); props.onDailyEvent?.('dino'); return creditado; }}
                onScore={play.onDinoScore}
                onReplayRound={replayRound}
                petElement={props.petElement}
                rankSaveId={props.guild.saveId}
                onExit={exitGame}
              />
            )}
            {game === 'barrage' && (
              <SoulBarrage
                evolutionStage={props.evolutionStage}
                demoCharacterId={props.demoCharacterId}
                petElement={props.petElement}
                playerLevel={props.playerLevel}
                initialLevel={modeChosen?.level}
                onReplayRound={replayRound}
                specialFamily={props.skills?.[props.evolutionStage as FichaStage]?.especial.familia}
                language={language}
                onEarnPoints={(pts) => { const creditado = props.onEarnPoints(pts); props.onDailyEvent?.('barrage'); return creditado; }}
                rankSaveId={props.guild.saveId}
                onExit={exitGame}
              />
            )}
            {game === 'ppt' && (
              <RPSGame
                evolutionStage={props.evolutionStage}
                demoCharacterId={props.demoCharacterId}
                language={language}
                initialLevel={modeChosen?.level}
                onEarnPoints={props.onEarnPoints}
                onMatchEnd={() => props.onDailyEvent?.('ppt')}
                onReplayRound={replayRound}
                rankSaveId={props.guild.saveId}
                onExit={exitGame}
              />
            )}
            {/* Combina 3 (Salão, 11/10/2026): paga pelo MESMO funil (teto diário de minijogo). */}
            {game === 'match3' && <Match3Game {...base} petBase={props.petBase} onReplayRound={replayRound} initialMode={modeChosen?.level === 2 ? 'pvp' : 'pve'} initialChoice={modeChosen?.choice} rankSaveId={props.guild.saveId} petName={props.petName} petElement={props.petElement} playerLevel={props.playerLevel} onEnemySeen={play.onBestiarySeen} onElementsDefeated={play.onElementsDefeated} onBossShard={play.onBossShard} onEarnHonor={play.onEarnHonor} bits={props.points} onSpendBits={play.onSpendBits} onEarnPoints={(pts) => { const creditado = props.onEarnPoints(pts); props.onDailyEvent?.('match3'); return creditado; }} />}
            {/* Ateliê da Mente — pagam Bits pelo MESMO funil (teto diário). */}
            {game === 'eco' && <EcoGame {...base} tutorial={mindTut('eco')} rankSaveId={props.guild.saveId} onEarnPoints={(pts) => { const creditado = props.onEarnPoints(pts); props.onDailyEvent?.('eco'); return creditado; }} />}
            {game === 'zip' && <ZipGame {...base} tutorial={mindTut('zip')} rankSaveId={props.guild.saveId} onEarnPoints={(pts) => { const creditado = props.onEarnPoints(pts); props.onDailyEvent?.('zip'); emitFeat('zipSolved'); return creditado; }} />}
            {/* Selo Faltante (04/11/2026, substitui a Colcha): sem ranking; a rodada fechada conta a missão do dia e o feito, mesmo com 0 Bits. */}
            {game === 'selo' && <SeloGame {...base} tutorial={mindTut('selo')} onEarnPoints={(pts) => { const creditado = pts > 0 ? props.onEarnPoints(pts) : 0; props.onDailyEvent?.('selo'); emitFeat('seloSolved'); return creditado; }} />}
            {/* Refúgio — NÃO recebem `onEarnPoints`: não pagam Bits nem pontuam. Concluir devolve a energia do dia (`onComplete`, 1×/dia). */}
            {game === 'respiracao' && <RespiracaoGame {...base} onComplete={play.onRefugioComplete} />}
            {game === 'bolhas-calmas' && <BolhasGame {...base} mode="calma" onComplete={play.onRefugioComplete} />}
            {/* Chama (04/11/2026): a exceção do Refúgio que paga — Bits FIXOS da sessão concluída, 1×/dia, pelo mesmo funil. */}
            {game === 'chama' && <ChamaGame {...base} onEarnPoints={props.onEarnPoints} onComplete={play.onRefugioComplete} />}
          </Suspense>
          </div>
          </FunTicketCostContext.Provider>
        )}
      </AreaScene>
    );
  }

  // Laboratório e Hall (29/09/2026): como nas lojas, o mapa aberto tem uma
  // construção por parte — Centro de Evolução / Arquivo / Santuário do Vínculo no
  // Laboratório; Biblioteca / Círculo de Amigos / Salão da Guilda no Hall. As
  // abas e filtros de dentro das folhas saíram; a construção é quem escolhe.
  if (area === 'laboratorio') {
    // D-50 (19/10/2026): a Biblioteca mora no Laboratório — a folha dela é a `LibraryPage` (`hallContent`), não a do `labContent`. #187: o Arquivo é seção do Perfil e o Círculo de Amigos, do Salão do Clã.
    const tabOf = LAB_TAB_OF;
    const lots = laboratorioLots(language).filter(l => !(props.demo && isDemoHiddenLot('laboratorio', l.id)));
    const open = lots.find(l => l.id === sheet) ?? null;
    return (
      <AreaScene
        areaId={area}
        language={language}
        background={LABORATORIO_BG}
        lots={gated(lots.map(l => ({ ...l, art: LABORATORIO_LOT_ART[l.id], onOpen: () => { const tab = tabOf[l.id]; if (tab) props.onLabTab(tab); if (l.id === 'evolucao' && props.onOpenPotion) { setLabChoice(true); return; } enter(l.id); } } satisfies AreaLot)))}
        notice={lockNote} onNoticeClose={() => setLockNote(null)}
      >
        <ModalSheet open={labChoice} title={language === 'pt-BR' ? 'Centro de Evolução' : 'Evolution Center'} onClose={() => setLabChoice(false)} language={language} placement="center" titulo="inline" sobreTelas maxWidth={380}>
          <div data-lab-choice style={{ display: 'grid', gap: 8 }}>
            <button type="button" className="sm2-kit-btn sm2-kit-btn-primary" data-lab-choice-evolution style={{ width: '100%' }}
              onClick={() => { setLabChoice(false); enter('evolucao'); }}>
              {language === 'pt-BR' ? 'Centro de Evolução' : 'Evolution Center'}
            </button>
            <button type="button" className="sm2-kit-btn" data-lab-choice-potion style={{ width: '100%' }}
              onClick={() => { setLabChoice(false); props.onOpenPotion?.(); }}>
              {language === 'pt-BR' ? 'Criar poção' : 'Create Potion'}
            </button>
          </div>
        </ModalSheet>
        {props.potionContent}
        <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close}>
          {open?.id === 'biblioteca' ? (
            <Suspense fallback={<SheetLoading language={language} />}>
              {props.hallContent('directory')}
            </Suspense>
          ) : (
            <>
              {/* #187: o Arquivo (a ficha do Soulmon) é uma SEÇÃO do Perfil — o prédio `laboratorio.pet` segue existindo (missão, material), só sem lote no mapa. */}
              {open?.id === 'perfil' && (
                <SectionTabs
                  label={language === 'pt-BR' ? 'Seções do Perfil' : 'Profile sections'}
                  items={[{ key: 'perfil', label: language === 'pt-BR' ? 'Perfil' : 'Profile' }, { key: 'pet', label: language === 'pt-BR' ? 'Arquivo' : 'Archive' }]}
                  active={props.labTab === 'pet' ? 'pet' : 'perfil'}
                  onPick={(k) => { props.onLabTab(k); if (k === 'pet') onVisitBuilding?.('laboratorio.pet'); }}
                />
              )}
              {props.labContent}
            </>
          )}
        </AreaSheet>
      </AreaScene>
    );
  }

  const lots = hallLots(language);
  const open = lots.find(l => l.id === sheet) ?? null;
  /** CTA "Ver a árvore no Bosque" do Clan Hall: abre o Grove pelas MESMAS recusas do toque no lote (cristal, forma BB, demo, Vínculo). */
  const abrirBosque = () => {
    if (cristalBlocks('grove')) { setSheet(null); setLockNote(crystalRefusalText(language === 'pt-BR')); return; }
    if (bbBlocks('grove')) { setSheet(null); setLockNote(bbRefusalText(language === 'pt-BR')); return; }
    if (demoBlocks('grove')) { setSheet(null); setLockNote(demoRefusalText(language === 'pt-BR')); return; }
    const g = lockOf('grove');
    if (g) { setSheet(null); setLockNote(buildingLockLine(g.minBond, language)); return; }
    enter('grove');
  };
  return (
    <AreaScene
      areaId={area}
      language={language}
      background={HALL_BG}
      lots={gated(lots.map(l => ({ ...l, art: HALL_LOT_ART[l.id], onOpen: () => enter(l.id) } satisfies AreaLot)))}
      notice={lockNote} onNoticeClose={() => setLockNote(null)}
    >
      <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close}>
        <Suspense fallback={<SheetLoading language={language} />}>
          {open?.id === 'guilda' && (
            <>
              {/* #187: o Círculo de Amigos é uma SEÇÃO do Salão do Clã — o prédio `laboratorio.amigos` segue existindo (missão, material), só sem lote no mapa. */}
              <SectionTabs
                label={language === 'pt-BR' ? 'Seções do Salão do Clã' : 'Clan Hall sections'}
                items={[{ key: 'cla', label: language === 'pt-BR' ? 'Clã' : 'Clan' }, { key: 'amigos', label: language === 'pt-BR' ? 'Amigos' : 'Friends' }]}
                active={guildaSection}
                onPick={(k) => { setGuildaSection(k); if (k === 'amigos') onVisitBuilding?.('laboratorio.amigos'); }}
              />
              {guildaSection === 'amigos'
                ? props.hallContent('friends')
                : <GuildSheet room="salao" language={language} {...props.guild} onAbrirBosque={abrirBosque} />}
            </>
          )}
          {open?.id === 'feira' && (
            <GuildSheet room="feira" language={language} {...props.guild} />
          )}
          {/* D-50: o Grove é prédio do Hall — a mesma folha do clã, só a sala do bosque. */}
          {open?.id === 'grove' && (
            <GuildSheet room="grove" language={language} {...props.guild} />
          )}
        </Suspense>
      </AreaSheet>
    </AreaScene>
  );
}
