import { lazy, Suspense, useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import type { AreaId } from '../../navigation';
import type { Language } from '../../utils/i18n';
import { AreaScene, type AreaLot } from './AreaScene';
import { AreaSheet } from './AreaSheet';
import { mercadoLots, arenaLots, laboratorioLots, hallLots, type MercadoLotId, type LaboratorioLotId } from '../../utils/areaSheetCopy';
import { AREA_BG, MERCADO_LOT_ART, ARENA_LOT_ART, PLAY_AREA_BG, EXPLORACAO_LOT_ART, JOGOS_LOT_ART, LABORATORIO_LOT_ART, HALL_LOT_ART } from '../../assets/soulmon/areas';
import { exploracaoLots, jogosLots } from '../../utils/playAreaLots';
import { sm2Hint } from '../form/FormKit';
import { useBackLayer } from '../../utils/backStack';
import type { PlayerDayAnchor } from '../../utils/playerDay';
import type { GuildGoal } from '../../utils/community';
import type { ShopActions, ShopOwnership } from '../mercado/ShopShelf';
import type { TournamentPage as TournamentPageT } from '../TournamentPage';
import type { StageSkills } from '../../utils/soulProfile/ficha/skills';
import type { FichaStage } from '../../utils/soulProfile/ficha/types';

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
const TournamentPage = lazy(() => import('../TournamentPage').then(m => ({ default: m.TournamentPage })));
const GuildSheet = lazy(() => import('../guild/GuildSheet').then(m => ({ default: m.GuildSheet })));
const DueloSheet = lazy(() => import('../arena/DueloSheet').then(m => ({ default: m.DueloSheet })));
const ArenaGame = lazy(() => import('../ArenaGame').then(m => ({ default: m.ArenaGame })));
// Exploração + Jogos (F5, ex-PR #118): as folhas-porta e os minijogos de
// sempre (os mesmos que a antiga `ActivitiesPage` abria).
const MasmorraSheet = lazy(() => import('../play/PlaySheets').then(m => ({ default: m.MasmorraSheet })));
const DinoSheet = lazy(() => import('../play/PlaySheets').then(m => ({ default: m.DinoSheet })));
const PptSheet = lazy(() => import('../play/PlaySheets').then(m => ({ default: m.PptSheet })));
const DungeonGame = lazy(() => import('../DungeonGame').then(m => ({ default: m.DungeonGame })));
const DinoGame = lazy(() => import('../DinoGame').then(m => ({ default: m.DinoGame })));
const RPSGame = lazy(() => import('../RPSGame').then(m => ({ default: m.RPSGame })));

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
}

type PlayGame = 'masmorra' | 'dino' | 'ppt';
export type LabTab = 'evolution' | 'pet' | 'stats';

type TournamentProps = Omit<ComponentProps<typeof TournamentPageT>, 'shop'>;

export interface AreaViewProps {
  area: AreaId;
  language: Language;
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
  onEarnPoints: (points: number) => void;
  /** Exploração + Jogos (F5). */
  play: PlayHandlers;
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
  const [sheet, setSheet] = useState<string | null>(null);
  const [duelOpen, setDuelOpen] = useState(false);
  const [game, setGame] = useState<PlayGame | null>(null);
  const closeLabel = language === 'pt-BR' ? 'Fechar' : 'Close';
  const close = () => setSheet(null);
  // R1: qualquer camada de tela cheia (folha, jogo, duelo) avisa o `App`, que
  // esconde o topo sobre a cena — ele não pode competir com o ✕/voltar da camada.
  const layerOpen = sheet !== null || duelOpen || game !== null;
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
    const stall = open && open.id !== 'conquistas' ? open.id as Exclude<MercadoLotId, 'conquistas'> : null;
    return (
      <AreaScene
        areaId={area}
        language={language}
        background={AREA_BG.mercado}
        lots={lots.map(l => ({ ...l, art: MERCADO_LOT_ART[l.id], onOpen: () => setSheet(l.id) } satisfies AreaLot))}
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
        lots={lots.map(l => ({ ...l, art: ARENA_LOT_ART[l.id], onOpen: () => setSheet(l.id) } satisfies AreaLot))}
      >
        <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close}>
          <Suspense fallback={<SheetLoading language={language} />}>
            {open?.id === 'torneio' && (
              <TournamentPage {...props.tournament} shop={{ ownership, actions }} />
            )}
            {open?.id === 'feira' && (
              <GuildSheet room="feira" language={language} {...props.guild} />
            )}
            {open?.id === 'duelo' && (
              <DueloSheet
                language={language}
                evolutionStage={props.evolutionStage}
                skills={props.skills}
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
    const lots: AreaLot[] = area === 'exploracao'
      ? exploracaoLots(language).map(l => ({ ...l, art: EXPLORACAO_LOT_ART[l.id], onOpen: () => setSheet(l.id) }))
      : jogosLots(language).map(l => ({ ...l, art: JOGOS_LOT_ART[l.id], onOpen: () => setSheet(l.id) }));
    const open = lots.find(l => l.id === sheet) ?? null;
    const { play } = props;
    return (
      <AreaScene areaId={area} language={language} background={PLAY_AREA_BG[area]} lots={lots}>
        <AreaSheet areaId={area} lotId={open?.id} language={language} title={open?.label ?? ''} closeLabel={closeLabel} open={!!open} onClose={close}>
          <Suspense fallback={<SheetLoading language={language} />}>
            {open?.id === 'masmorra' && <MasmorraSheet language={language} onStart={() => start('masmorra')} />}
            {open?.id === 'dino' && <DinoSheet language={language} onStart={() => start('dino')} />}
            {open?.id === 'ppt' && <PptSheet language={language} onStart={() => start('ppt')} />}
          </Suspense>
        </AreaSheet>
        {game && (
          <Suspense fallback={<SheetLoading language={language} />}>
            {game === 'masmorra' && (
              <DungeonGame
                evolutionStage={props.evolutionStage}
                demoCharacterId={props.demoCharacterId}
                profissao={props.profissao}
                profissaoNome={props.profissaoNome}
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
          </Suspense>
        )}
      </AreaScene>
    );
  }

  // Laboratório e Hall (29/09/2026): como nas lojas, o mapa aberto tem uma
  // construção por parte — Árvore da Evolução / Meu Soulmon / Observatório no
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
        lots={lots.map(l => ({ ...l, art: LABORATORIO_LOT_ART[l.id], onOpen: () => { props.onLabTab(tabOf[l.id]); setSheet(l.id); } } satisfies AreaLot))}
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
      lots={lots.map(l => ({ ...l, art: HALL_LOT_ART[l.id], onOpen: () => setSheet(l.id) } satisfies AreaLot))}
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
