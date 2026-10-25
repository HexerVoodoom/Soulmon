import { lazy, Suspense, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import type { AreaId } from '../../navigation';
import type { Language } from '../../utils/i18n';
import { AreaScene, type AreaLot } from './AreaScene';
import { AreaSheet } from './AreaSheet';
import { mercadoLots, arenaLots, laboratorioLots, hallLots, type MercadoLotId, type LaboratorioLotId } from '../../utils/areaSheetCopy';
import { AREA_BG, MERCADO_LOT_ART, ARENA_LOT_ART, PLAY_AREA_BG, EXPLORACAO_LOT_ART, JOGOS_LOT_ART, LABORATORIO_LOT_ART, HALL_LOT_ART, HALL_BG, LABORATORIO_BG } from '../../assets/soulmon/areas';
import { exploracaoLots, jogosLots } from '../../utils/playAreaLots';
import { RogueDungeonPlaceholder } from '../play/RogueDungeonPlaceholder';
import { RogueDungeon } from '../RogueDungeon';
import type { RogueRun } from '../../utils/rogueDungeon';
import type { Combatant } from '../../utils/combate/curve';
import { buildingGateFor, buildingLockLine, type BuildingId } from '../../utils/gates';
import type { DailyEvent } from '../../utils/dailyMissions';
import { isDemoBlockedLot, isDemoHiddenLot, demoRefusalText } from '../../utils/demoMode';
import { useBackLayer } from '../../utils/backStack';
import type { PlayerDayAnchor } from '../../utils/playerDay';
import type { GuildGoal } from '../../utils/community';
import type { ShopActions, ShopOwnership } from '../mercado/ShopShelf';
import type { MercadoStallProps } from '../mercado/MercadoSheets';
import type { TournamentPage as TournamentPageT } from '../TournamentPage';
import type { GuildSheet as GuildSheetT } from '../guild/GuildSheet';
import type { StageSkills } from '../../utils/soulProfile/ficha/skills';
import type { FichaStage } from '../../utils/soulProfile/ficha/types';
import type { SalaoGame, MenteGame, RefugioGame } from '../play/PlaySheets';
import type { OcupadoAcao } from '../DungeonBusyModal';
import type { ReviewState } from '../../utils/mente/revisao';
import { CROSSINGS_EMPTY, type CrossingsState } from '../../types/travessias';
import type { CadernoEntry } from '../../utils/cadernoSave';
import type { QuestMark } from '../../utils/questMarks';
import type { FocusLootRequest } from '../../utils/focusExpedition';
import type { FocusRewardResult } from '../play/OficinaSheet';
import { ScreenSkeleton } from '../ui/ScreenSkeleton';
import type { PasseioAchado } from '../play/PasseioSheet';
import {
  usePlayPrefetch, loadPlaySheets, loadDungeonGame, loadDinoGame, loadRPSGame, loadMatch3Game, loadEcoGame, loadBolhasGame, loadZipGame, loadPatchesGame,
  loadRespiracaoGame,
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
const ConquistasSheet = lazy(() => import('../mercado/MercadoSheets').then(m => ({ default: m.ConquistasSheet })));
// ⚒️ O Soulsmith (07/10/2026): abre a tela de equipamento do Combate v3 (PR8b), que saiu das Estatísticas. Lazy — a arte dos itens é sob demanda.
const ForgeCard = lazy(() => import('../ForgeCard'));
const TournamentPage = lazy(() => import('../TournamentPage').then(m => ({ default: m.TournamentPage })));
const GuildSheet = lazy(() => import('../guild/GuildSheet').then(m => ({ default: m.GuildSheet })));
const DueloSheet = lazy(() => import('../arena/DueloSheet').then(m => ({ default: m.DueloSheet })));
const ArenaGame = lazy(() => import('../ArenaGame').then(m => ({ default: m.ArenaGame })));
// Exploração + Jogos (F5, ex-PR #118): as folhas-porta e os minijogos de
// sempre (os mesmos que a antiga `ActivitiesPage` abria).
const MasmorraSheet = lazy(() => loadPlaySheets().then(m => ({ default: m.MasmorraSheet })));
// Os três prédios de Jogos (30/09/2026): Salão (livres), Ateliê da Mente e Refúgio.
const SalaoSheet = lazy(() => loadPlaySheets().then(m => ({ default: m.SalaoSheet })));
const MenteSheet = lazy(() => loadPlaySheets().then(m => ({ default: m.MenteSheet })));
const RefugioSheet = lazy(() => loadPlaySheets().then(m => ({ default: m.RefugioSheet })));
// 🧭 O Passeio (30/09/2026): a folha carrega o catálogo das regiões — por isso lazy.
const PrepararFocoSheet = lazy(() => import('../play/PrepararFocoSheet').then(m => ({ default: m.PrepararFocoSheet })));
const OficinaSheet = lazy(() => import('../play/OficinaSheet').then(m => ({ default: m.OficinaSheet })));
const PasseioSheet = lazy(() => import('../play/PasseioSheet').then(m => ({ default: m.PasseioSheet })));
const CadernoSheet = lazy(() => import('../play/CadernoSheet').then(m => ({ default: m.CadernoSheet })));
const Match3Game = lazy(() => loadMatch3Game().then(m => ({ default: m.Match3Game })));
const DungeonGame = lazy(() => loadDungeonGame().then(m => ({ default: m.DungeonGame })));
const DinoGame = lazy(() => loadDinoGame().then(m => ({ default: m.DinoGame })));
const RPSGame = lazy(() => loadRPSGame().then(m => ({ default: m.RPSGame })));
const EcoGame = lazy(() => loadEcoGame().then(m => ({ default: m.EcoGame })));
const BolhasGame = lazy(() => loadBolhasGame().then(m => ({ default: m.BolhasGame })));
const ZipGame = lazy(() => loadZipGame().then(m => ({ default: m.ZipGame })));
const PatchesGame = lazy(() => loadPatchesGame().then(m => ({ default: m.PatchesGame })));
const RespiracaoGame = lazy(() => loadRespiracaoGame().then(m => ({ default: m.RespiracaoGame })));

/** Os handlers dos minijogos da Exploração e de Jogos — prontos no `App`, os
 *  MESMOS que a antiga `ActivitiesPage` repassava. Nenhuma regra nasce aqui:
 *  a Masmorra não tem gate de entrada, nem limite diário, nem cobra coração
 *  ao perder — quem decide isso são `utils/dungeon` e a `DungeonGame`. */
export interface PlayHandlers {
  onDungeonEnter: () => { ok: true; level?: number; best: number };
  onDungeonLose: () => void;
  onDungeonHeartDrop: () => boolean;
  onGlitchtama: () => void;
  onFloorCleared?: () => void;
  /** beta3 A4: a descida terminou com ao menos 1 camada limpa (conta a missão "runs da masmorra"). */
  onRunEnd?: () => void;
  onDungeonEnemyDefeated: (enemyKey?: string) => void;
  /** M10: inimigo visto fora da masmorra (Combina 3) — só o bestiário. */
  onBestiarySeen?: (enemyKey: string) => void;
  onDinoScore: (score: number) => void;
  onSpendBits?: (pts: number) => boolean;
  /** Dia do JOGADOR (`playerDayKey`) — o Picross do dia e a Revisão leem daqui.
   *  Sem ele (testes antigos), cai no dia UTC do aparelho. */
  todayKey?: string;
  /** Tarefas canônicas para o planejamento local da Oficina do Foco. */
  focusTasks?: Array<{ id: string; name: string; completed: boolean; steps?: Array<{ id: string; label: string; completed: boolean }> }>;
  onCompleteFocusTask?: (taskId: string) => void;
  onFocusReward?: (request: FocusLootRequest, completedCycles: number) => FocusRewardResult;
  onPlanReward?: (request: FocusLootRequest) => FocusRewardResult;
  /** beta3 F1: a chave do dia ("Prepare to Focus" concluído) libera a Focus Workshop. Ausente = sem trava (testes antigos). */
  focusKeyActive?: boolean;
  onFocusPrepared?: () => void;
  /** beta3 F1: o timer de foco começou — a masmorra desce em background. */
  onFocusStart?: (focusEndsAt?: number) => 'started' | 'busy' | 'no-hp' | 'no-energy';
  /** Os cartões da Revisão da Malha, que moram no SAVE (`GameState.review`). */
  review?: ReviewState;
  onReviewChange?: (next: ReviewState) => void;
  /** Bits de minijogo já creditados HOJE (`minigameBitsToday`) — as folhas
   *  mostram "X de 150" porque o teto é um só para todos os jogos. */
  minigameBitsToday?: number;
  /** beta3 M7: Calabouço roguelike — incursão no save, gravação e o combatente do pet. Ausente = placeholder. */
  rogue?: { saved?: RogueRun; onChange: (run: RogueRun) => void; combatant: Combatant };
}

/** Os lotes que usam o Soulmon DE VERDADE (ficam fechados com ele na masmorra — REGISTRO §36) e o que o aviso diz que o jogador queria fazer. */
const LOTE_OCUPA_SOULMON: Record<string, OcupadoAcao> = { 'arena.duelo': 'duelo', 'arena.torneio': 'torneio', 'exploracao.passeio': 'passeio' };

export type PlayGame = 'masmorra' | SalaoGame | MenteGame | RefugioGame;
export type LabTab = 'evolution' | 'pet' | 'stats' | 'perfil';

type TournamentProps = ComponentProps<typeof TournamentPageT>;

export interface AreaViewProps {
  area: AreaId;
  /** Acordar o Soulmon (REGISTRO §112): `true` = a ação de jogo ficou parada (o `App` já mostrou o aviso curto + o atalho "Acordar"). Só os JOGOS passam por aqui (`WAKE_BLOCKED_GAMES`); abrir a área e navegar nunca param. */
  wakeGuard?: (action: string) => boolean;
  /** Abre um jogo direto ao montar (o convite ao Refúgio abre a respiração).
   *  One-shot: o `App` limpa pelo `onInitialGameConsumed`. */
  initialGame?: PlayGame;
  onInitialGameConsumed?: () => void;
  /** Abre a folha de um lote ao montar (missão da Home → o lugar dela, ex.:
   *  `'passeio'`, `'torneio'`). One-shot: o `App` limpa pelo `onInitialSheetConsumed`. */
  initialSheet?: string;
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
  /** Avisa se há camada de tela cheia aberta (folha/jogo/duelo). Estável (setState). */
  onLayerChange?: (open: boolean) => void;
  /** Vai ao MAPA (a masmorra sai direto para ele, 14/10/2026). Sem a prop, a masmorra volta à área. */
  onGoToMap?: () => void;
  /** 🏠 O Soulmon na masmorra (REGISTRO §36): `naMasmorra` fecha os lotes que o usam (duelo, torneio, passeio) com o aviso `onBusy`;
   *  `missaoFora` (ele foi investigar pela guilda) impede descer à masmorra. Sem a prop, nada é trancado. */
  ocupado?: { naMasmorra: boolean; missaoFora: boolean; onBusy: (acao: OcupadoAcao) => void };
  /** Posse + progresso de missão — o mesmo objeto para Mercado e Torneio. */
  ownership: ShopOwnership;
  actions: ShopActions;
  points: number;
  emblems: number;
  credits: number;
  onExchangeCredits: (credits: number) => Promise<boolean>;
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
  onEarnPoints: (points: number) => void;
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
  /** Hall (F5, ex-PR #117): a `LibraryPage` embutida, montada no `App` — uma
   *  visão por construção (Biblioteca = diretório, Círculo de Amigos = amigos). */
  hallContent: (view: 'directory' | 'friends') => ReactNode;
  /** A Guilda (o Hall abre o Salão; a Arena abre a Feira — a mesma folha, salas diferentes). */
  guild: {
    saveId: string; metaDoDiaCumprida: boolean; playerDayTz?: PlayerDayAnchor;
    /** Meta como o servidor a confere (Guilda, o fio) e a criatura de quem olha. */
    fioGoal?: GuildGoal; mySprite?: string | null;
    /** Resgate da Feira confirmado (soma Emblemas/Concha no save) e cenários liberados. */
    onClaimed?: (claim: { emblems: number; trophyId: string | null }) => void;
    onScenes?: (ids: string[]) => void;
    /** Sem conta (401): o convite de criar conta (demo) e o caminho até Entrar. */
    accountTier?: 'demo' | 'paid';
    onUnlock?: () => void;
    onLogin?: () => void;
    /** A Casa da guilda (PR2): carteira, inventário e o que mudou. Ver `GuildSheet` › `casa`. */
    casa?: ComponentProps<typeof GuildSheetT>['casa'];
    /** A Missão (PR3): estado da ida do Solmon e o gesto de mandá-lo. */
    missao?: ComponentProps<typeof GuildSheetT>['missao'];
    cla?: ComponentProps<typeof GuildSheetT>['cla'];
  };
}

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
  /** O Soulmon está na masmorra e o lote precisa dele: o toque abre o aviso "Ele está na masmorra" (com o "Retirar") em vez da folha. */
  const busyAcao = (lotId: string | null | undefined): OcupadoAcao | null => (props.ocupado?.naMasmorra && lotId ? LOTE_OCUPA_SOULMON[`${area}.${lotId}`] ?? null : null);
  const busyLot = (l: AreaLot): AreaLot => {
    const acao = busyAcao(l.id);
    return acao ? { ...l, onOpen: () => props.ocupado?.onBusy(acao) } : l;
  };
  const initialDemoBlocked = demoBlocks(props.initialSheet);
  const initialLock = props.initialSheet && !initialDemoBlocked ? lockOf(props.initialSheet) : null;
  const initialBusy = !initialLock && !initialDemoBlocked ? busyAcao(props.initialSheet) : null;
  const [sheet, setSheet] = useState<string | null>(initialLock || initialDemoBlocked || initialBusy ? null : props.initialSheet ?? null);
  useEffect(() => { if (initialBusy) props.ocupado?.onBusy(initialBusy); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [lockNote, setLockNote] = useState<string | null>(
    initialDemoBlocked ? demoRefusalText(language === 'pt-BR')
      : initialLock ? buildingLockLine(initialLock.minBond, language) : null);
  useEffect(() => {
    if (!lockNote) return;
    const t = setTimeout(() => setLockNote(null), 5000);
    return () => clearTimeout(t);
  }, [lockNote]);
  /** Tranca os prédios fechados: arte cinza + cadeado, e o toque só mostra o aviso neutro. */
  const gated = (lots: AreaLot[]): AreaLot[] => lots.map(l => {
    // DEMO: prédio social → toque inerte, com a recusa curta na mesma faixa de aviso.
    if (demoBlocks(l.id)) return { ...l, mark: undefined, onOpen: () => setLockNote(demoRefusalText(language === 'pt-BR')) };
    const g = lockOf(l.id);
    if (!g) return busyLot({ ...l, mark: props.buildingMarks?.[`${area}.${l.id}` as BuildingId] ?? undefined });
    return { ...l, mark: undefined, locked: { minBond: g.minBond }, onOpen: () => setLockNote(buildingLockLine(g.minBond, language)) };
  });
  const [duelOpen, setDuelOpen] = useState(false);
  /** A semente do desafio escolhido na Arena (`DueloSheet`). */
  const [duelSeed, setDuelSeed] = useState<number | undefined>(undefined);
  /** O encaixe do canto do título da folha do Torneio (o indicador da faixa entra por portal). */
  const [tournamentHead, setTournamentHead] = useState<HTMLElement | null>(null);
  const [game, setGame] = useState<PlayGame | null>(props.initialGame ?? null);
  const { onInitialGameConsumed } = props;
  useEffect(() => { if (props.initialGame) onInitialGameConsumed?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { onInitialSheetConsumed } = props;
  useEffect(() => { if (props.initialSheet) { if (!initialLock && !initialDemoBlocked) onVisitBuilding?.(`${area}.${props.initialSheet}` as BuildingId); onInitialSheetConsumed?.(); } }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const closeLabel = language === 'pt-BR' ? 'Fechar' : 'Close';
  /* D-16: capturado na montagem (o `App` limpa o pedido logo depois e a folha do Mercado é `lazy` — ela monta DEPOIS disso).
     Vale só para a primeira abertura: fechar a folha apaga. */
  const [stallKind, setStallKind] = useState(props.initialStallKind);
  const close = () => { setSheet(null); setStallKind(undefined); };
  // R1: qualquer camada de tela cheia (folha, jogo, duelo) avisa o `App`, que
  // esconde o topo sobre a cena — ele não pode competir com o ✕/voltar da camada.
  const layerOpen = sheet !== null || duelOpen || game !== null;
  // J1 (rodada 7): baixa os chunks de jogar ANTES do toque (ver `playPrefetch.ts`).
  usePlayPrefetch(area === 'exploracao' || area === 'jogos', sheet !== null);
  const { onLayerChange } = props;
  useEffect(() => {
    onLayerChange?.(layerOpen);
    return () => onLayerChange?.(false);
  }, [layerOpen, onLayerChange]);
  // O voltar do sistema sai do jogo/duelo em andamento antes de trocar de tela.
  useBackLayer(duelOpen, () => setDuelOpen(false));
  // A masmorra registra o PRÓPRIO voltar (vai direto ao mapa, igual ao ícone do mapa); os outros jogos voltam à área.
  useBackLayer(game !== null && game !== 'masmorra', () => setGame(null));

  if (area === 'mercado') {
    const lots = mercadoLots(language);
    const open = lots.find(l => l.id === sheet) ?? null;
    const stall = open && open.id !== 'conquistas' && open.id !== 'ferreiro' && open.id !== 'restaurante' ? open.id as Exclude<MercadoLotId, 'conquistas' | 'ferreiro' | 'restaurante'> : null;
    return (
      <AreaScene
        areaId={area}
        language={language}
        background={AREA_BG.mercado}
        // O Restaurante em obra (14/10/2026) fica FORA do `gated`: sempre aberto, sem Vínculo mínimo, sem missão (não é `BuildingId`).
        lots={lots.map(l => l.id === 'restaurante'
          ? ({ ...l, art: MERCADO_LOT_ART.restaurante, onOpen: () => setSheet(l.id) } satisfies AreaLot)
          : gated([{ ...l, art: MERCADO_LOT_ART[l.id], onOpen: () => setSheet(l.id) } satisfies AreaLot])[0])}
        notice={lockNote}
      >
        <AreaSheet
          areaId={area}
          lotId={open?.id}
          language={language}
          title={open?.label ?? ''}
          closeLabel={closeLabel}
          open={!!open}
          onClose={close}
        >
          <Suspense fallback={<SheetLoading language={language} />}>
            {stall && (
              <MercadoStallSheet
                key={stall}
                stall={stall}
                language={language}
                points={props.points}
                emblems={props.emblems}
                credits={props.credits}
                onExchangeCredits={props.onExchangeCredits}
                accountTier={props.accountTier}
                onUnlock={props.onUnlock}
                initialKind={stall === 'background' ? stallKind : undefined}
                weekly={props.weekly}
                onClaimWeekly={props.onClaimWeekly}
                {...ownership}
                {...actions}
              />
            )}
            {open?.id === 'conquistas' && (
              <ConquistasSheet language={language} missionProgress={ownership.missionProgress} claimed={ownership.missionClaimed} shop={{ ownedBackgrounds: ownership.ownedBackgrounds, balance: props.points, onBuy: actions.onBuy }} />
            )}
            {open?.id === 'ferreiro' && <ForgeCard language={language} />}
          </Suspense>
        </AreaSheet>
      </AreaScene>
    );
  }

  if (area === 'arena') {
    const lots = arenaLots(language);
    const open = lots.find(l => l.id === sheet) ?? null;
    return (
      <AreaScene
        areaId={area}
        language={language}
        background={AREA_BG.arena}
        lots={gated(lots.map(l => ({ ...l, art: ARENA_LOT_ART[l.id], onOpen: () => enter(l.id) } satisfies AreaLot)))}
        notice={lockNote}
      >
        <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close} headSlotRef={open?.id === 'torneio' ? setTournamentHead : undefined}>
          <Suspense fallback={<SheetLoading language={language} />}>
            {open?.id === 'torneio' && (
              <TournamentPage {...props.tournament} skills={props.skills} headSlot={tournamentHead} />
            )}
            {open?.id === 'duelo' && (
              <DueloSheet
                language={language}
                evolutionStage={props.evolutionStage}
                onStart={(seed) => { setSheet(null); setDuelSeed(seed); setDuelOpen(true); }}
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
              seed={duelSeed}
              evolutionStage={props.evolutionStage}
              demoCharacterId={props.demoCharacterId}
              language={language}
              skills={props.skills}
              petElement={props.petElement}
              onEarnPoints={(pts) => { props.onEarnPoints(pts); props.onDailyEvent?.('arena'); }}
              onExit={() => setDuelOpen(false)}
            />
          </Suspense>
        )}
      </AreaScene>
    );
  }

  if (area === 'exploracao' || area === 'jogos') {
    const start = (g: PlayGame) => { if (props.wakeGuard?.(g)) return; setSheet(null); setGame(g); };
    const exitGame = () => setGame(null);
    const lots: AreaLot[] = gated(area === 'exploracao'
      ? exploracaoLots(language).map(l => ({
        ...l, art: EXPLORACAO_LOT_ART[l.id], onOpen: () => enter(l.id),
      }))
      : jogosLots(language).map(l => ({ ...l, art: JOGOS_LOT_ART[l.id], onOpen: () => enter(l.id) })));
    const open = lots.find(l => l.id === sheet) ?? null;
    const { play } = props;
    const base = {
      evolutionStage: props.evolutionStage,
      demoCharacterId: props.demoCharacterId,
      language,
      onExit: exitGame,
    };
    return (
      <AreaScene areaId={area} language={language} background={PLAY_AREA_BG[area]} lots={lots} notice={lockNote}>
        <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close}>
          <Suspense fallback={<SheetLoading language={language} />}>
            {open?.id === 'passeio' && (
              <PasseioSheet
                language={language}
                crossings={props.passeio?.crossings ?? CROSSINGS_EMPTY}
                onChange={props.passeio?.onChange ?? (() => {})}
                todayKey={play.todayKey}
                seed={props.passeio?.seed}
                achado={props.passeio?.achado}
              />
            )}
            {open?.id === 'preparar' && <PrepararFocoSheet language={language} todayKey={play.todayKey} tasks={play.focusTasks ?? []} keyActive={play.focusKeyActive ?? false} onPrepared={play.onFocusPrepared} />}
            {open?.id === 'oficina' && play.focusKeyActive === false && (
              <p data-oficina-trancada style={{ margin: 0, color: 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-sm, 14px)' }}>
                {language === 'pt-BR' ? 'A Oficina do Foco está trancada. Conclua a preparação no prédio "Preparar o Foco" para ganhar a chave de hoje.' : 'The Focus Workshop is locked. Finish the preparation in the "Prepare to Focus" building to get today\'s key.'}
              </p>
            )}
            {open?.id === 'oficina' && play.focusKeyActive !== false && <OficinaSheet language={language} todayKey={play.todayKey} tasks={play.focusTasks ?? []} onCompleteTask={play.onCompleteFocusTask ?? (() => {})} onFocusReward={play.onFocusReward} onPlanReward={play.onPlanReward} onFocusCycle={() => props.onDailyEvent?.('foco')} planInPrepare={play.focusKeyActive !== undefined} onFocusStart={play.onFocusStart} />}
            {open?.id === 'caderno' && <CadernoSheet language={language} todayKey={play.todayKey} entries={props.caderno?.entries ?? []} onChange={props.caderno?.onChange ?? (() => {})} />}
            {open?.id === 'masmorra' && <MasmorraSheet language={language} bitsToday={play.minigameBitsToday} onStart={() => (props.ocupado?.missaoFora ? props.ocupado.onBusy('masmorra-em-missao') : start('masmorra'))} />}
            {open?.id === 'salao' && <SalaoSheet language={language} bitsToday={play.minigameBitsToday} onStart={start} />}
            {open?.id === 'mente' && <MenteSheet language={language} bitsToday={play.minigameBitsToday} onStart={start} />}
            {open?.id === 'refugio' && <RefugioSheet language={language} onStart={start} />}
            {open?.id === 'dungeon' && (play.rogue
              ? <RogueDungeon language={language} todayKey={play.todayKey ?? new Date().toISOString().slice(0, 10)} saved={play.rogue.saved} onChange={play.rogue.onChange} combatant={play.rogue.combatant} saveId={props.guild.saveId} onEarnPoints={props.onEarnPoints} />
              : <RogueDungeonPlaceholder language={language} />)}
          </Suspense>
        </AreaSheet>
        {game && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 6000 }}>
          <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" label={language === 'pt-BR' ? 'Abrindo' : 'Opening'} />}>
            {game === 'masmorra' && (
              <DungeonGame
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
                onEarnPoints={props.onEarnPoints}
                rankSaveId={props.guild.saveId}
                /* WP4.5 — o sumidouro recorrente: comprar profundidade com Bits. */
                bits={props.points}
                onSpendBits={play.onSpendBits}
                onExit={exitGame}
                onExitToMap={() => { setGame(null); props.onGoToMap?.(); }}
              />
            )}
            {game === 'dino' && (
              <DinoGame
                evolutionStage={props.evolutionStage}
                demoCharacterId={props.demoCharacterId}
                language={language}
                onEarnPoints={(pts) => { props.onEarnPoints(pts); props.onDailyEvent?.('dino'); }}
                onScore={play.onDinoScore}
                rankSaveId={props.guild.saveId}
                onExit={exitGame}
              />
            )}
            {game === 'ppt' && (
              <RPSGame
                evolutionStage={props.evolutionStage}
                demoCharacterId={props.demoCharacterId}
                language={language}
                onEarnPoints={props.onEarnPoints}
                onMatchEnd={() => props.onDailyEvent?.('ppt')}
                rankSaveId={props.guild.saveId}
                onExit={exitGame}
              />
            )}
            {/* Combina 3 (Salão, 11/10/2026): paga pelo MESMO funil (teto diário de minijogo). */}
            {game === 'match3' && <Match3Game {...base} rankSaveId={props.guild.saveId} petName={props.petName} playerLevel={props.playerLevel} onEnemySeen={play.onBestiarySeen} bits={props.points} onSpendBits={play.onSpendBits} onEarnPoints={(pts) => { props.onEarnPoints(pts); props.onDailyEvent?.('match3'); }} />}
            {/* Ateliê da Mente — pagam Bits pelo MESMO funil (teto diário). */}
            {game === 'eco' && <EcoGame {...base} rankSaveId={props.guild.saveId} onEarnPoints={props.onEarnPoints} />}
            {game === 'zip' && <ZipGame {...base} onEarnPoints={props.onEarnPoints} />}
            {game === 'patches' && <PatchesGame {...base} onEarnPoints={props.onEarnPoints} />}
            {/* Refúgio — NÃO recebem `onEarnPoints`: não pagam, não pontuam. */}
            {game === 'respiracao' && <RespiracaoGame {...base} />}
            {game === 'bolhas-calmas' && <BolhasGame {...base} mode="calma" />}
          </Suspense>
          </div>
        )}
      </AreaScene>
    );
  }

  // Laboratório e Hall (29/09/2026): como nas lojas, o mapa aberto tem uma
  // construção por parte — Centro de Evolução / Arquivo / Santuário do Vínculo no
  // Laboratório; Biblioteca / Círculo de Amigos / Salão da Guilda no Hall. As
  // abas e filtros de dentro das folhas saíram; a construção é quem escolhe.
  if (area === 'laboratorio') {
    // D-50 (19/10/2026): a Biblioteca e o Círculo de Amigos moram no Laboratório — a folha deles é a `LibraryPage` (`hallContent`), não a do `labContent`.
    const tabOf: Partial<Record<LaboratorioLotId, LabTab>> = { evolucao: 'evolution', pet: 'pet', stats: 'stats', perfil: 'perfil' };
    const lots = laboratorioLots(language).filter(l => !(props.demo && isDemoHiddenLot('laboratorio', l.id)));
    const open = lots.find(l => l.id === sheet) ?? null;
    return (
      <AreaScene
        areaId={area}
        language={language}
        background={LABORATORIO_BG}
        lots={gated(lots.map(l => ({ ...l, art: LABORATORIO_LOT_ART[l.id], onOpen: () => { const tab = tabOf[l.id]; if (tab) props.onLabTab(tab); enter(l.id); } } satisfies AreaLot)))}
        notice={lockNote}
      >
        <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close}>
          {open?.id === 'biblioteca' || open?.id === 'amigos' ? (
            <Suspense fallback={<SheetLoading language={language} />}>
              {props.hallContent(open.id === 'biblioteca' ? 'directory' : 'friends')}
            </Suspense>
          ) : props.labContent}
        </AreaSheet>
      </AreaScene>
    );
  }

  const lots = hallLots(language);
  const open = lots.find(l => l.id === sheet) ?? null;
  return (
    <AreaScene
      areaId={area}
      language={language}
      background={HALL_BG}
      lots={gated(lots.map(l => ({ ...l, art: HALL_LOT_ART[l.id], onOpen: () => enter(l.id) } satisfies AreaLot)))}
      notice={lockNote}
    >
      <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close}>
        <Suspense fallback={<SheetLoading language={language} />}>
          {open?.id === 'guilda' && (
            <GuildSheet room="salao" language={language} {...props.guild} />
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
