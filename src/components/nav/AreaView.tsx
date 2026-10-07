import { lazy, Suspense, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import type { AreaId } from '../../navigation';
import type { Language } from '../../utils/i18n';
import { AreaScene, type AreaLot } from './AreaScene';
import { AreaSheet } from './AreaSheet';
import { mercadoLots, arenaLots, laboratorioLots, hallLots, type MercadoLotId, type LaboratorioLotId } from '../../utils/areaSheetCopy';
import { AREA_BG, MERCADO_LOT_ART, ARENA_LOT_ART, PLAY_AREA_BG, EXPLORACAO_LOT_ART, JOGOS_LOT_ART, LABORATORIO_LOT_ART, HALL_LOT_ART, HALL_BG, LABORATORIO_BG } from '../../assets/soulmon/areas';
import { exploracaoLots, jogosLots } from '../../utils/playAreaLots';
import { buildingGateFor, buildingLockLine, type BuildingId } from '../../utils/gates';
import { sm2Hint } from '../form/FormKit';
import { useBackLayer } from '../../utils/backStack';
import type { PlayerDayAnchor } from '../../utils/playerDay';
import type { GuildGoal } from '../../utils/community';
import type { ShopActions, ShopOwnership } from '../mercado/ShopShelf';
import type { TournamentPage as TournamentPageT } from '../TournamentPage';
import type { StageSkills } from '../../utils/soulProfile/ficha/skills';
import type { FichaStage } from '../../utils/soulProfile/ficha/types';
import type { SalaoGame, MenteGame, RefugioGame } from '../play/PlaySheets';
import { REVIEW_EMPTY, dueCards, type ReviewState } from '../../utils/mente/revisao';
import { CROSSINGS_EMPTY, type CrossingsState } from '../../types/travessias';
import { missionMark } from '../../utils/travessiasSave';
import { questMarks } from '../../utils/questMarks';
import type { CadernoEntry } from '../../utils/cadernoSave';
import { ScreenSkeleton } from '../ui/ScreenSkeleton';
import {
  usePlayPrefetch, loadPlaySheets, loadDungeonGame, loadDinoGame, loadRPSGame, loadEcoGame, loadBolhasGame,
  loadTrocaGame, loadPicrossGame, loadRevisaoGame, loadRespiracaoGame,
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
// ⚒️ O Ferreiro (07/10/2026): abre a tela de equipamento do Combate v3 (PR8b), que saiu das Estatísticas. Lazy — a arte dos itens é sob demanda.
const EquipmentCard = lazy(() => import('../EquipmentCard'));
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
const OficinaSheet = lazy(() => import('../play/OficinaSheet').then(m => ({ default: m.OficinaSheet })));
const CadernoSheet = lazy(() => import('../play/CadernoSheet').then(m => ({ default: m.CadernoSheet })));
const PasseioSheet = lazy(() => import('../play/PasseioSheet').then(m => ({ default: m.PasseioSheet })));
const DungeonGame = lazy(() => loadDungeonGame().then(m => ({ default: m.DungeonGame })));
const DinoGame = lazy(() => loadDinoGame().then(m => ({ default: m.DinoGame })));
const RPSGame = lazy(() => loadRPSGame().then(m => ({ default: m.RPSGame })));
const EcoGame = lazy(() => loadEcoGame().then(m => ({ default: m.EcoGame })));
const BolhasGame = lazy(() => loadBolhasGame().then(m => ({ default: m.BolhasGame })));
const TrocaGame = lazy(() => loadTrocaGame().then(m => ({ default: m.TrocaGame })));
const PicrossGame = lazy(() => loadPicrossGame().then(m => ({ default: m.PicrossGame })));
const RevisaoGame = lazy(() => loadRevisaoGame().then(m => ({ default: m.RevisaoGame })));
const RespiracaoGame = lazy(() => loadRespiracaoGame().then(m => ({ default: m.RespiracaoGame })));

/** Os handlers dos minijogos da Exploração e de Jogos — prontos no `App`, os
 *  MESMOS que a antiga `ActivitiesPage` repassava. Nenhuma regra nasce aqui:
 *  a Masmorra não tem gate de entrada, nem limite diário, nem cobra coração
 *  ao perder — quem decide isso são `utils/dungeon` e a `DungeonGame`. */
export interface PlayHandlers {
  onDungeonEnter: () => { ok: true; level: number; best: number };
  onDungeonLose: () => void;
  onDungeonHeartDrop: () => boolean;
  onGlitchtama: () => void;
  onFloorCleared?: () => void;
  onDungeonEnemyDefeated: (enemyKey?: string) => void;
  onDinoScore: (score: number) => void;
  onSpendBits?: (pts: number) => boolean;
  /** Dia do JOGADOR (`playerDayKey`) — o Picross do dia e a Revisão leem daqui.
   *  Sem ele (testes antigos), cai no dia UTC do aparelho. */
  todayKey?: string;
  /** Os cartões da Revisão da Malha, que moram no SAVE (`GameState.review`). */
  review?: ReviewState;
  onReviewChange?: (next: ReviewState) => void;
  /** Bits de minijogo já creditados HOJE (`minigameBitsToday`) — as folhas
   *  mostram "X de 150" porque o teto é um só para todos os jogos. */
  minigameBitsToday?: number;
}

export type PlayGame = 'masmorra' | SalaoGame | MenteGame | RefugioGame;
export type LabTab = 'evolution' | 'pet' | 'stats';

type TournamentProps = Omit<ComponentProps<typeof TournamentPageT>, 'shop'>;

export interface AreaViewProps {
  area: AreaId;
  /** Abre um jogo direto ao montar (o convite ao Refúgio abre a respiração).
   *  One-shot: o `App` limpa pelo `onInitialGameConsumed`. */
  initialGame?: PlayGame;
  onInitialGameConsumed?: () => void;
  /** Abre a folha de um lote ao montar (missão da Home → o lugar dela, ex.:
   *  `'passeio'`, `'torneio'`). One-shot: o `App` limpa pelo `onInitialSheetConsumed`. */
  initialSheet?: string;
  onInitialSheetConsumed?: () => void;
  language: Language;
  /** O Vínculo do usuário (`bondLevelFor(totalXP)`): decide quais prédios abrem (`BUILDING_GATES`). Sem ele, nada é trancado. */
  bondLevel?: number;
  /** Avisa se há camada de tela cheia aberta (folha/jogo/duelo). Estável (setState). */
  onLayerChange?: (open: boolean) => void;
  /** Posse + progresso de missão — o mesmo objeto para Mercado e Torneio. */
  ownership: ShopOwnership;
  actions: ShopActions;
  points: number;
  emblems: number;
  credits: number;
  onExchangeCredits: (credits: number) => Promise<boolean>;
  accountTier?: 'demo' | 'paid';
  onUnlock?: () => void;
  /** As props do Torneio, prontas no `App` (partida, missões da semana…). */
  tournament: TournamentProps;
  /** Duelo → `ArenaGame`. */
  evolutionStage: string;
  demoCharacterId?: string;
  skills?: Partial<Record<FichaStage, StageSkills>>;
  /** Fase 3 do Oráculo — a profissão da ficha (`ficha/manifestacao.ts`), o
   *  jeito de agir na fenda (`utils/profissaoMasmorra.ts`). Só a masmorra lê. */
  profissao?: string | null;
  profissaoNome?: { pt: string; en: string } | null;
  /** Elemento dominante do Soulmon (`soulmonMeta.dominantElement`): a arte dos golpes da Masmorra. */
  petElement?: string;
  onEarnPoints: (points: number) => void;
  /** Exploração + Jogos (F5). */
  play: PlayHandlers;
  /** 🧭 Passeio + Travessias (30/09/2026): o estado do save e o único caminho de
   *  escrita — uma função PURA de `utils/travessias` aplicada sobre `prev` no `App`. */
  /** 📓 Caderno (04/10/2026): as anotações (do save) e o único caminho de escrita. */
  caderno?: {
    entries: CadernoEntry[];
    onChange: (f: (c: CadernoEntry[]) => CadernoEntry[]) => void;
  };
  passeio?: {
    crossings: CrossingsState;
    onChange: (f: (c: CrossingsState) => CrossingsState) => void;
    /** A semente do sorteio das missões do dia (o id do save). */
    seed?: string;
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
  };
}

/** Espera curta dentro da folha — o conteúdo é `lazy`, e a folha já está
 *  aberta: nunca um branco sem explicação. */
function SheetLoading({ language }: { language: Language }) {
  return (
    <p role="status" style={{ ...sm2Hint, textAlign: 'center', padding: '24px 0', margin: 0 }}>
      {language === 'pt-BR' ? 'Abrindo…' : 'Opening…'}
    </p>
  );
}

export function AreaView(props: AreaViewProps) {
  const { area, language, ownership, actions } = props;
  /** Prédio trancado neste Vínculo? (`null` = aberto, ou sem `bondLevel`). O gate vale na ENTRADA do prédio. */
  const lockOf = (lotId: string) => {
    if (props.bondLevel === undefined) return null;
    const g = buildingGateFor(`${area}.${lotId}` as BuildingId, props.bondLevel);
    return g.open ? null : g;
  };
  const initialLock = props.initialSheet ? lockOf(props.initialSheet) : null;
  const [sheet, setSheet] = useState<string | null>(initialLock ? null : props.initialSheet ?? null);
  const [lockNote, setLockNote] = useState<string | null>(initialLock ? buildingLockLine(initialLock.minBond, language) : null);
  useEffect(() => {
    if (!lockNote) return;
    const t = setTimeout(() => setLockNote(null), 5000);
    return () => clearTimeout(t);
  }, [lockNote]);
  /** Tranca os prédios fechados: arte cinza + cadeado, e o toque só mostra o aviso neutro. */
  const gated = (lots: AreaLot[]): AreaLot[] => lots.map(l => {
    const g = lockOf(l.id);
    if (!g) return l;
    return { ...l, mark: undefined, locked: { minBond: g.minBond }, onOpen: () => setLockNote(buildingLockLine(g.minBond, language)) };
  });
  const [duelOpen, setDuelOpen] = useState(false);
  /** O encaixe do canto do título da folha do Torneio (o indicador da faixa entra por portal). */
  const [tournamentHead, setTournamentHead] = useState<HTMLElement | null>(null);
  const [game, setGame] = useState<PlayGame | null>(props.initialGame ?? null);
  const { onInitialGameConsumed } = props;
  useEffect(() => { if (props.initialGame) onInitialGameConsumed?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const { onInitialSheetConsumed } = props;
  useEffect(() => { if (props.initialSheet) onInitialSheetConsumed?.(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const marcas = questMarks({
    passeio: missionMark(props.passeio?.crossings ?? CROSSINGS_EMPTY, props.play?.todayKey ?? new Date().toISOString().slice(0, 10), Date.now()),
    weekly: props.tournament?.weeklyMissions ?? [],
    missionProgress: ownership?.missionProgress ?? {},
    ownedBackgrounds: ownership?.ownedBackgrounds ?? [],
  });
  const closeLabel = language === 'pt-BR' ? 'Fechar' : 'Close';
  const close = () => setSheet(null);
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
  useBackLayer(game !== null, () => setGame(null));

  if (area === 'mercado') {
    const lots = mercadoLots(language);
    const open = lots.find(l => l.id === sheet) ?? null;
    const stall = open && open.id !== 'conquistas' && open.id !== 'ferreiro' ? open.id as Exclude<MercadoLotId, 'conquistas' | 'ferreiro'> : null;
    return (
      <AreaScene
        areaId={area}
        language={language}
        background={AREA_BG.mercado}
        lots={gated(lots.map(l => ({ ...l, ...(l.id === 'conquistas' ? { mark: marcas.conquistas } : {}), art: MERCADO_LOT_ART[l.id], onOpen: () => setSheet(l.id) } satisfies AreaLot)))}
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
                {...ownership}
                {...actions}
              />
            )}
            {open?.id === 'conquistas' && (
              <ConquistasSheet language={language} missionProgress={ownership.missionProgress} />
            )}
            {open?.id === 'ferreiro' && <EquipmentCard language={language} />}
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
        lots={gated(lots.map(l => ({ ...l, ...(l.id === 'torneio' ? { mark: marcas.torneio } : {}), art: ARENA_LOT_ART[l.id], onOpen: () => setSheet(l.id) } satisfies AreaLot)))}
        notice={lockNote}
      >
        <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close} headSlotRef={open?.id === 'torneio' ? setTournamentHead : undefined}>
          <Suspense fallback={<SheetLoading language={language} />}>
            {open?.id === 'torneio' && (
              <TournamentPage {...props.tournament} skills={props.skills} shop={{ ownership, actions }} headSlot={tournamentHead} />
            )}
            {open?.id === 'feira' && (
              <GuildSheet room="feira" language={language} {...props.guild} />
            )}
            {open?.id === 'duelo' && (
              <DueloSheet
                language={language}
                evolutionStage={props.evolutionStage}
                skills={props.skills}
                petElement={props.petElement}
                onStart={() => { setSheet(null); setDuelOpen(true); }}
              />
            )}
          </Suspense>
        </AreaSheet>
        {duelOpen && (
          <Suspense fallback={<SheetLoading language={language} />}>
            <ArenaGame
              evolutionStage={props.evolutionStage}
              demoCharacterId={props.demoCharacterId}
              language={language}
              skills={props.skills}
              petElement={props.petElement}
              onEarnPoints={props.onEarnPoints}
              onExit={() => setDuelOpen(false)}
            />
          </Suspense>
        )}
      </AreaScene>
    );
  }

  if (area === 'exploracao' || area === 'jogos') {
    const start = (g: PlayGame) => { setSheet(null); setGame(g); };
    const exitGame = () => setGame(null);
    const lots: AreaLot[] = gated(area === 'exploracao'
      ? exploracaoLots(language).map(l => ({
        ...l, art: EXPLORACAO_LOT_ART[l.id], onOpen: () => setSheet(l.id),
        // "!" / "?" sobre o Passeio (`utils/questMarks.ts`): missão do dia disponível.
        ...(l.id === 'passeio' ? { mark: marcas.passeio } : {}),
      }))
      : jogosLots(language).map(l => ({ ...l, art: JOGOS_LOT_ART[l.id], onOpen: () => setSheet(l.id) })));
    const open = lots.find(l => l.id === sheet) ?? null;
    const { play } = props;
    const todayKey = play.todayKey ?? new Date().toISOString().slice(0, 10);
    const review = play.review ?? REVIEW_EMPTY;
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
              />
            )}
            {open?.id === 'oficina' && <OficinaSheet language={language} todayKey={play.todayKey} />}
            {open?.id === 'caderno' && <CadernoSheet language={language} todayKey={play.todayKey} entries={props.caderno?.entries ?? []} onChange={props.caderno?.onChange ?? (() => {})} />}
            {open?.id === 'masmorra' && <MasmorraSheet language={language} bitsToday={play.minigameBitsToday} onStart={() => start('masmorra')} />}
            {open?.id === 'salao' && <SalaoSheet language={language} bitsToday={play.minigameBitsToday} onStart={start} />}
            {open?.id === 'mente' && <MenteSheet language={language} bitsToday={play.minigameBitsToday} reviewDue={dueCards(review, todayKey).length} onStart={start} />}
            {open?.id === 'refugio' && <RefugioSheet language={language} onStart={start} />}
          </Suspense>
        </AreaSheet>
        {game && (
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
                onEnemyDefeated={play.onDungeonEnemyDefeated}
                onEarnPoints={props.onEarnPoints}
                /* WP4.5 — o sumidouro recorrente: comprar profundidade com Bits. */
                bits={props.points}
                onSpendBits={play.onSpendBits}
                onExit={exitGame}
              />
            )}
            {game === 'dino' && (
              <DinoGame
                evolutionStage={props.evolutionStage}
                demoCharacterId={props.demoCharacterId}
                language={language}
                onEarnPoints={props.onEarnPoints}
                onScore={play.onDinoScore}
                onExit={exitGame}
              />
            )}
            {game === 'ppt' && (
              <RPSGame
                evolutionStage={props.evolutionStage}
                demoCharacterId={props.demoCharacterId}
                language={language}
                onEarnPoints={props.onEarnPoints}
                onExit={exitGame}
              />
            )}
            {/* Ateliê da Mente — pagam Bits pelo MESMO funil (teto diário). */}
            {game === 'eco' && <EcoGame {...base} onEarnPoints={props.onEarnPoints} />}
            {game === 'bolhas' && <BolhasGame {...base} mode="foco" onEarnPoints={props.onEarnPoints} />}
            {game === 'troca' && <TrocaGame {...base} onEarnPoints={props.onEarnPoints} />}
            {game === 'picross' && <PicrossGame {...base} todayKey={todayKey} onEarnPoints={props.onEarnPoints} />}
            {game === 'revisao' && (
              <RevisaoGame
                {...base}
                todayKey={todayKey}
                review={review}
                onReviewChange={next => play.onReviewChange?.(next)}
                onEarnPoints={props.onEarnPoints}
              />
            )}
            {/* Refúgio — NÃO recebem `onEarnPoints`: não pagam, não pontuam. */}
            {game === 'respiracao' && <RespiracaoGame {...base} />}
            {game === 'bolhas-calmas' && <BolhasGame {...base} mode="calma" />}
          </Suspense>
        )}
      </AreaScene>
    );
  }

  // Laboratório e Hall (29/09/2026): como nas lojas, o mapa aberto tem uma
  // construção por parte — Centro de Evolução / Arquivo / Santuário do Vínculo no
  // Laboratório; Biblioteca / Círculo de Amigos / Salão da Guilda no Hall. As
  // abas e filtros de dentro das folhas saíram; a construção é quem escolhe.
  if (area === 'laboratorio') {
    const tabOf: Record<LaboratorioLotId, LabTab> = { evolucao: 'evolution', pet: 'pet', stats: 'stats' };
    const lots = laboratorioLots(language);
    const open = lots.find(l => l.id === sheet) ?? null;
    return (
      <AreaScene
        areaId={area}
        language={language}
        background={LABORATORIO_BG}
        lots={gated(lots.map(l => ({ ...l, art: LABORATORIO_LOT_ART[l.id], onOpen: () => { props.onLabTab(tabOf[l.id]); setSheet(l.id); } } satisfies AreaLot)))}
        notice={lockNote}
      >
        <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close}>
          {props.labContent}
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
      lots={gated(lots.map(l => ({ ...l, art: HALL_LOT_ART[l.id], onOpen: () => setSheet(l.id) } satisfies AreaLot)))}
      notice={lockNote}
    >
      <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close}>
        <Suspense fallback={<SheetLoading language={language} />}>
          {open?.id === 'biblioteca' && props.hallContent('directory')}
          {open?.id === 'amigos' && props.hallContent('friends')}
          {open?.id === 'guilda' && (
            <GuildSheet room="salao" language={language} {...props.guild} />
          )}
        </Suspense>
      </AreaSheet>
    </AreaScene>
  );
}
