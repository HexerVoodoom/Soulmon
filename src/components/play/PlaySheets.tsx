import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { ENERGY_ICON } from '../../utils/rewardIcons';
import { EnergyCost } from '../ui/EnergyCost';
import { BitsIcon } from '../ui/BitsIcon';
import type { FunTicketStatus } from '../../utils/funTickets';
import { TicketPanel } from './TicketFan';
import { TicketBuyModal } from './TicketBuyModal';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { RankingPanel } from '../RankingPanel';
import { RankingModal } from '../RankingModal';
import { BotaoEspecial } from '../ui/BotaoEspecial';
import { RIFT_GAME_ID } from '../../utils/endlessRift';
import { ModalInfo, InfoTipSection } from '../ui/InfoTip';
import { clearBonus } from '../../utils/dungeonBase';
import { riftCurrentLayer } from '../../utils/riftMap';
import { DUNGEON_MILESTONE_FLOOR, DUNGEON_ENERGY_PER_LAYER, DUNGEON_MAX_LAYER, sanitizeDepthRecord } from '../../utils/dungeonIdle';
import { useGameStateOptional } from '../../contexts/GameStateContext';
import { useRiftTalents } from '../../contexts/useTalentBonus';
import { MATCH_POINTS, WINS_NEEDED } from '../RPSGame';
import { getDungeonBest, HEART_DROP_CHANCE } from '../../utils/dungeon';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { readNumber } from '../../utils/safeStorage';
import { minigameBitsCap, bitsCategoryCap, minigameBitsCategoryToday, type BitsCategory } from '../../utils/currencies';
import { playerDayKey } from '../../utils/playerDay';
import { BitsAmount } from '../ui/BitsAmount';
import type { Language } from '../../utils/i18n';
import { RewardPreview } from '../ui/RewardPreview';
import { ECO_MAX_BITS } from '../../utils/mente/eco';
import { ZIP_MAX_BITS } from '../../utils/mente/zip';
import { SELO_MAX_BITS } from '../../utils/mente/selo';
import { SupportNote } from '../refugio/SupportNote';
import { GameCard, GameCardGrid } from './GameCard';
import { sheetCard, sheetCardList, sheetCardTitle } from '../nav/sheetKit';
import { PixelIcon } from '../ui/PixelIcon';
// Beta-2 (backlog 9.1): o velociraptor e a tesoura SAIRAM do Salão (o dono não gostou). Reuso de arte que já existe,
// pelada, sem moldura: a bota de caminhada (`ativ-corpo-caminhar`) para a Corrida e o punho de pedra (`hand-rock`,
// o mesmo do jogo) para o Pedra-papel-tesoura. Nenhum asset novo.
import { ACTIVITY_ICON_ART } from '../../assets/soulmon/icones-ui/interacao';
import { iconePpt as iconPpt } from '../../assets/soulmon/icones-ui';
// Elemental Fusion (11/10/2026): o ícone é a gema que já estava no repo (`icons/icon-gem.png`) — nenhuma arte nova.
import iconCombina from '../../assets/soulmon/icons/icon-gem.png';
import { M3_POINTS_PER_BIT } from '../../utils/match3';
import { M3C_MAX_BITS } from '../../utils/match3Combat';
const iconCorrida = ACTIVITY_ICON_ART['corpo-caminhar'];

/**
 * AS FOLHAS DAS ÁREAS DE JOGAR (minimal-ui F5 — Exploração e Jogos).
 *
 * Mocks aprovados: `propostas/exploracao/mock.html` (`#modalMasmorra`,
 * `#modalDino`) e `propostas/jogos/mock.html` (`#modalPPT`). Cada folha é a
 * PORTA de um minijogo que já existia: mostra o que está em jogo e abre o
 * jogo pelo CTA. **Nenhuma regra nasce aqui** — os números vêm das constantes
 * dos donos (`DUNGEON_MILESTONE_FLOOR`/`clearBonus` da `DungeonGame`, `HEART_DROP_CHANCE`
 * de `utils/dungeon`, `MATCH_POINTS`/`WINS_NEEDED` do `RPSGame`), e os placares
 * são lidos das MESMAS chaves que os jogos gravam (`DUNGEON_BEST`,
 * `DUNGEON_DIFFICULTY`, `DINO_BEST`).
 *
 * A Masmorra continua sem gate de entrada e sem cobrar coração: o CTA nunca
 * fica desabilitado, e a nota diz o que se perde (a run), não o que não se
 * perde de verdade.
 *
 * Do mock ficou de fora, de propósito:
 *  - "RUN ATUAL" com andares já vencidos: a run vive só dentro da `DungeonGame`
 *    enquanto ela está aberta — fechou, acabou. Mostrar andar "em curso" seria
 *    inventar um estado que o jogo não guarda. A escada aparece neutra.
 *  - "1º" como posição de ranking: `DUNGEON_BEST` é o melhor placar do
 *    jogador, não uma posição contra outros — mostrar "1º" seria mentira.
 *  - "vitórias hoje" no PPT: o jogo não conta vitórias por dia, e passar a
 *    contar é regra nova, não fatia de UI.
 */

const box: CSSProperties = {
  flex: 1, minWidth: 0, padding: '10px 12px', boxSizing: 'border-box',
  border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)',
  backgroundColor: 'var(--sm2-bg)',
  display: 'flex', flexDirection: 'column', gap: 2,
};
const boxValue: CSSProperties = {
  ...sm2Text, fontFamily: 'var(--sm2-font-display)', fontWeight: 600,
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
};
const boxLabel: CSSProperties = {
  ...sm2Hint, fontSize: 'var(--sm2-text-xs)', margin: 0,
};
const sectionHead: CSSProperties = {
  ...sm2Hint, margin: 0, letterSpacing: '0.1em', textTransform: 'uppercase',
  color: 'var(--sm2-gold-ink)', fontWeight: 600, fontSize: 'var(--sm2-text-xs)',
};
const note: CSSProperties = { ...sm2Hint, margin: 0, textAlign: 'center' };
const cta: CSSProperties = { ...sm2Button('primary'), width: '100%' };

/**
 * "Bits de minijogo hoje: X de 150" (decisão do dono, 30/09/2026 —
 * `docs/BALANCO-MINIJOGOS.md` §5). O teto é compartilhado por todos os jogos
 * que pagam; sem esta linha, depois de bater o teto o "até N Bits" de cada
 * jogo vira promessa falsa. Texto neutro: sem barra, sem cor de alerta — o
 * teto não tira nada nem fecha jogo nenhum, só para de somar.
 */
export function BitsHoje({ language, earned, extraCap = 0, category, hideTotal }: { language: Language; earned?: number; /** Salão (18/11/2026): só a linha da categoria; o total geral some. */ hideTotal?: boolean; /** Agulha de bússola (§393): só a Fenda passa; os outros jogos seguem no teto base. */ extraCap?: number; /** §456: a categoria da folha; mostra também "hoje: x de 75 neste tipo de atividade". */ category?: BitsCategory }) {
  const gs = useGameStateOptional()?.gameState;
  if (earned === undefined) return null;
  const isPt = language === 'pt-BR';
  const catCap = bitsCategoryCap(extraCap);
  const catN = gs && category ? Math.min(catCap, minigameBitsCategoryToday(gs, playerDayKey(new Date(), gs.playerDayTz), category)) : undefined;
  const cap = minigameBitsCap(extraCap);
  const n = Math.min(cap, Math.max(0, Math.floor(earned)));
  return (
    <p data-bits-hoje style={{ ...note, margin: 0 }}>
      {!(hideTotal && catN !== undefined) && (
        <span className="sm2-num">
          {isPt ? `Bits de minijogo hoje: ${n} de ${cap}` : `Minigame Bits today: ${n} of ${cap}`}
        </span>
      )}
      {catN !== undefined && (
        <span data-bits-categoria className="sm2-num" style={{ display: 'block' }}>
          {isPt ? 'Hoje: ' : 'Today: '}{catN}{' '}<BitsIcon size={14} label="Bits" />{isPt ? ` de ${catCap}` : ` of ${catCap}`}
        </span>
      )}
    </p>
  );
}

/** As duas linhas de Bits do Rift, na base da folha (dono, 24/11/2026): o teto da Fenda (categoria 'explorar', 75) e o total do dia (180). */
function RiftBitsHoje({ language, earned = 0, extraCap = 0 }: { language: Language; earned?: number; extraCap?: number }) {
  const gs = useGameStateOptional()?.gameState;
  const isPt = language === 'pt-BR';
  const catCap = bitsCategoryCap(extraCap);
  const cap = minigameBitsCap(extraCap);
  const catN = gs ? Math.min(catCap, minigameBitsCategoryToday(gs, playerDayKey(new Date(), gs.playerDayTz), 'explorar')) : 0;
  const total = Math.min(cap, Math.max(0, Math.floor(earned)));
  return (
    <p data-bits-hoje data-rift-bits-hoje style={{ ...note, margin: 0 }}>
      <span data-rift-bits-dungeon className="sm2-num" style={{ display: 'block' }}>{isPt ? `Bits da masmorra hoje: ${catN} de ${catCap}` : `Dungeon Bits today: ${catN} of ${catCap}`}</span>
      <span data-rift-bits-total className="sm2-num" style={{ display: 'block' }}>{isPt ? `Bits totais hoje: ${total} de ${cap}` : `Total Bits today: ${total} of ${cap}`}</span>
    </p>
  );
}

function StatBox({ value, label, valueStyle }: { value: ReactNode; label: string; valueStyle?: CSSProperties }) {
  return (
    <div style={box}>
      <span className="sm2-num" style={{ ...boxValue, ...valueStyle }}>{value}</span>
      <p style={boxLabel}>{label}</p>
    </div>
  );
}

function DropItem({ label, value }: { label: string; value: string }) {
  return <li>{label} — <span className="sm2-num">{value}</span></li>;
}

// ── Masmorra ────────────────────────────────────────────────────────────────
/** A Fenda Sem Fim: DOIS botões (pedido do dono, 16/11/2026): "Entrar no Rift" (retoma direto onde parou) e "Ver o mapa" (secundário, outline). Pedido de 17/11/2026: "Ranking" (outline, negrito sublinhado) à esquerda da linha do título (`headSlot`, o encaixe da moldura; sem ele, entra no topo da folha) e o "i" com o "Drop rate" (os itens e as chances, num tooltip) na frente do título; a nota "Pode cair" saiu do corpo. */
export function MasmorraSheet({ language, onStart, onMap, bitsToday, saveId }: { language: Language; onStart: () => void; /** "Ver o mapa" (§462): abre o mapa de andares. Sem ele, a folha fica só com a entrada. */ onMap?: () => void; bitsToday?: number; /** Conta do jogador: sem ela não há ranking (o botão some). */ saveId?: string; }) {
  const isPt = language === 'pt-BR';
  // O recorde de profundidade mora no save (REGISTRO §31); o placar, no aparelho (`getDungeonBest`).
  const gs = useGameStateOptional()?.gameState;
  const rift = useRiftTalents();
  const deepest = sanitizeDepthRecord(gs?.dungeonDepthRecord);
  const [best] = useState(() => getDungeonBest());
  const currentLayer = riftCurrentLayer(gs);
  const [rankOpen, setRankOpen] = useState(false);
  return (
    <div data-masmorra style={{ display: 'flex', flexDirection: 'column', gap: 'min(12px, 1.1dvh)' }}>
      {saveId && (
        <BotaoEspecial variant="ranking" data-masmorra-ranking aria-haspopup="dialog" onClick={() => setRankOpen(true)}>
          {isPt ? 'Ver ranking' : 'See ranking'}
        </BotaoEspecial>
      )}
      <RankingModal open={rankOpen} onClose={() => setRankOpen(false)} language={language} title={isPt ? 'Ranking' : 'Leaderboard'}>
        <div data-masmorra-ranking-panel>
          <RankingPanel inline game={RIFT_GAME_ID} period="monthly" saveId={saveId} language={language} />
        </div>
      </RankingModal>
      <ModalInfo language={language} label="Drop rate">
        <b data-masmorra-drops-title style={{ display: 'block', fontSize: 'var(--sm2-text-xs)', fontWeight: 600, marginBottom: 4 }}>Drop rate</b>
        <ul data-masmorra-drops style={{ margin: 0, paddingLeft: 18, listStyle: 'disc' }}>
          <DropItem
            label={isPt ? 'Bits por inimigo + bônus de andar' : 'Bits per enemy + floor bonus'}
            value={`${clearBonus(1)}→${clearBonus(DUNGEON_MILESTONE_FLOOR)}`}
          />
          <DropItem
            label={isPt ? 'Coraçãozinho (raro)' : 'Little heart (rare)'}
            value={`${Math.round(HEART_DROP_CHANCE * 100)}%`}
          />
          <DropItem
            label={isPt ? `Glitchtama (raro: a cada marco de ${DUNGEON_MILESTONE_FLOOR} camadas, no máximo 1 por semana)` : `Glitchtama (rare: at each ${DUNGEON_MILESTONE_FLOOR}-layer milestone, at most 1 a week)`}
            value="1%"
          />
          <DropItem
            label={isPt ? 'Fragmentos do Soulsmith nos marcos de profundidade (5, 10, 25, 50…)' : 'Soulsmith fragments at depth milestones (5, 10, 25, 50…)'}
            value="5→100"
          />
        </ul>
      </ModalInfo>
      {/* P3 9.3b (22/11/2026): a camada ATUAL (onde o "Entrar no Rift" retoma) em destaque; o recorde (a mais funda) fica abaixo, discreto. Arte própria da camada: fila de arte (slot com fallback). */}
      <div data-masmorra-current-layer style={{ ...box, flex: 'none', borderColor: 'var(--sm2-primary)', alignItems: 'center', textAlign: 'center', padding: 'min(14px, 1.2dvh) 12px' }}>
        <span className="sm2-num" style={{ ...boxValue, fontSize: 'var(--sm2-text-xl, 28px)', color: 'var(--sm2-primary-ink)' }}>{isPt ? `Camada ${currentLayer}` : `Layer ${currentLayer}`}</span>
        <p style={boxLabel}>{isPt ? 'camada atual' : 'current layer'}</p>
      </div>
      {(deepest > 0 || best > 0) && (
        <div style={{ display: 'flex', gap: 8 }}>
          {deepest > 0 && <StatBox value={isPt ? `Camada ${deepest}` : `Layer ${deepest}`} label={isPt ? 'a mais funda até hoje' : 'deepest so far'} />}
          {best > 0 && <StatBox value={best} label={isPt ? 'seu melhor placar' : 'your best score'} />}
        </div>
      )}
      <BotaoEspecial variant="rift" data-masmorra-start onClick={onStart}>
        {isPt ? 'Entrar no Rift' : 'Enter the Rift'}
        <EnergyCost amount={DUNGEON_ENERGY_PER_LAYER} />
      </BotaoEspecial>
      {onMap && <BotaoEspecial variant="rift-sec" data-masmorra-map onClick={onMap}>{isPt ? 'Ver o mapa' : 'See the map'}</BotaoEspecial>}
      {/* 24/11/2026 (dono): as linhas de Bits ficam na BASE da folha (a parte de cima é só botões e recordes). */}
      <RiftBitsHoje language={language} earned={bitsToday} extraCap={rift.riftBitsCap} />
    </div>
  );
}

// ── Corrida com obstáculos ────────────────────────────────────────────────────
/** Bits que um placar rende na Corrida — a mesma conta da `DinoGame` (1 a cada 100). */
const DINO_POINTS_PER_BIT = 100;
import { BARRAGE_POINTS_PER_BIT } from '../../utils/soulBarrage';

/** Um selo pequeno sob a carta (recorde, Bits, ticket): texto neutro, sem cor de alerta. */
function Badge({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return <span className="sm2-num" style={{ whiteSpace: 'nowrap', ...style }}>{children}</span>;
}

/** Ganho de cada jogo do Salão, no pergaminho da carta (só constantes dos donos; nada inventado). */
const ganho = (language: Language) => {
  const isPt = language === 'pt-BR';
  return {
    dino: <><BitsAmount value={1} size={14} /> {isPt ? `a cada ${DINO_POINTS_PER_BIT} pts` : `per ${DINO_POINTS_PER_BIT} pts`}</>,
    ppt: <><BitsAmount value={MATCH_POINTS} size={14} /> {isPt ? 'por vitória' : 'per win'}</>,
    match3: <><RewardPreview mode="before" language={language} items={[{ kind: 'bits', max: M3C_MAX_BITS }]} size={14} /> {isPt ? 'por rodada' : 'per round'}</>,
    barrage: <><BitsAmount value={1} size={14} /> {isPt ? `a cada ${BARRAGE_POINTS_PER_BIT} pts` : `per ${BARRAGE_POINTS_PER_BIT} pts`}</>,
  };
};

/** Selos da Corrida: o recorde (some sem recorde: não há "0 Bits" a mostrar, P10). O custo é sempre 1 ticket e o painel de tickets já informa: não se repete na carta. */
function DinoBadges({ language }: { language: Language }) {
  const isPt = language === 'pt-BR';
  const [best] = useState(() => readNumber(STORAGE_KEYS.DINO_BEST, 0));
  return (
    <>
      {best > 0 && <Badge>{isPt ? 'seu recorde' : 'your best'} {best}</Badge>}
    </>
  );
}

/** Selos do Elemental Fusion: recorde (só se houver) + "até N Bits por rodada" + o ticket. */
function Match3Badges({ language }: { language: Language }) {
  const isPt = language === 'pt-BR';
  const [best] = useState(() => readNumber(STORAGE_KEYS.MATCH3_BEST, 0));
  return (
    <>
      {best > 0 && <Badge>{isPt ? 'seu recorde' : 'your best'} {best}</Badge>}
    </>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// 🏛️ OS TRÊS PRÉDIOS DE JOGOS (30/09/2026, pedido do dono)
//
// Cada prédio é uma folha com VÁRIOS jogos — a porta de cada um é uma linha
// com o que o jogo pede e o CTA. Nenhuma regra nasce aqui: os Bits vêm das
// constantes dos donos (`utils/mente/*`), e o que o jogo exercita é DESCRIÇÃO,
// nunca promessa de efeito (`docs/BENCHMARK-MINIJOGOS.md` §1.2, caso FTC ×
// Lumosity). O Refúgio não paga, não pontua e não mede nada, por desenho.
// ════════════════════════════════════════════════════════════════════════════

export type SalaoGame = 'dino' | 'ppt' | 'match3' | 'barrage';
export type MenteGame = 'eco' | 'zip' | 'selo';
export type RefugioGame = 'respiracao' | 'bolhas-calmas' | 'chama';

/** Salão de Jogos — jogos livres, em CARTAS ilustradas (`GameCard`, como o Refúgio; pedido do dono, 17/11/2026 — em 04/11 ele tinha pedido a lista de volta). */
export function SalaoSheet({ language, onStart: abrir, bitsToday, funStatus, onBuyTickets, refused }: { language: Language; onStart: (g: SalaoGame) => void; bitsToday?: number; funStatus?: (nowMs: number) => FunTicketStatus; /** Compra o lote de tickets (1 energia → 3). */ onBuyTickets?: () => boolean | void; refused?: boolean }) {
  /* Tocar em Jogar sem ticket (ou ficar sem ticket no "jogar de novo", `refused`) abre o modal "quer comprar?" (15/11/2026): comprando, o jogo
     pedido abre assim que o ticket aparece no estado (`pendente`). Recusar não gasta nada. */
  const [buyOpen, setBuyOpen] = useState(!!refused);
  const [pendente, setPendente] = useState<SalaoGame | null>(null);
  const onStart = (g: SalaoGame) => { if (funStatus && !funStatus(Date.now()).canPlay) { setPendente(g); setBuyOpen(true); return; } abrir(g); };
  const canPlayNow = !!funStatus && funStatus(Date.now()).canPlay;
  useEffect(() => { if (pendente && canPlayNow) { const g = pendente; setPendente(null); abrir(g); } }, [pendente, canPlayNow, abrir]);
  const recusarCompra = () => { setBuyOpen(false); setPendente(null); };
  const comprar = (): boolean => !!onBuyTickets && onBuyTickets() !== false;
  const isPt = language === 'pt-BR';
  return (
    <div data-salao style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-4, 16px)' }}>
      {funStatus && <TicketPanel language={language} status={funStatus} onBuy={onBuyTickets} />}
      {funStatus && <TicketBuyModal open={buyOpen} language={language} status={funStatus} onBuy={comprar} onClose={recusarCompra} onBought={() => setBuyOpen(false)} />}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <BitsHoje language={language} earned={bitsToday} category="minigames" hideTotal />
        <ModalInfo language={language} label={isPt ? 'Como funciona o Salão' : 'How the Hall works'} align="right">
          <InfoTipSection title={isPt ? 'Elemental Fusion' : 'Elemental Fusion'}>
            {isPt
              ? `Alinhe 3 ou mais peças: cada linha golpeia o time da fenda · a rodada acaba quando um lado recua · ${M3_POINTS_PER_BIT} pontos = 1 Bit, até ${M3C_MAX_BITS}`
              : `Line up 3+ tiles: each line strikes the rift team · the round ends when one side steps back · ${M3_POINTS_PER_BIT} points = 1 Bit, up to ${M3C_MAX_BITS}`}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Corrida com obstáculos' : 'Obstacle Run'}>
            {isPt
              ? `Pule os obstáculos · cada ${DINO_POINTS_PER_BIT} pontos vira 1 Bit`
              : `Jump the obstacles · every ${DINO_POINTS_PER_BIT} points becomes 1 Bit`}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Pedra, papel e tesoura' : 'Rock, paper, scissors'}>
            {isPt
              ? `Contra o seu Soulmon — quem vencer ${WINS_NEEDED} rodadas leva a partida`
              : `Against your Soulmon — first to ${WINS_NEEDED} rounds takes the match`}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Chuva de Almas' : 'Soul Barrage'} last>
            {isPt
              ? `Arraste (ou use as setas) para desviar dos tiros: o seu Soulmon atira sozinho · cada ${BARRAGE_POINTS_PER_BIT} pontos vira 1 Bit`
              : `Drag (or use the arrow keys) to dodge the shots: your Soulmon fires on its own · every ${BARRAGE_POINTS_PER_BIT} points becomes 1 Bit`}
          </InfoTipSection>
        </ModalInfo>
      </div>
      <GameCardGrid>
        <GameCard
          id="match3" icon={iconCombina} dataAttrs={{ 'data-match3-start': 'true' }}
          title={isPt ? 'Elemental Fusion' : 'Elemental Fusion'}
          reward={ganho(language).match3}
          onPress={() => onStart('match3')}
          badges={<Match3Badges language={language} />}
        />
        <GameCard
          id="dino" icon={iconCorrida} dataAttrs={{ 'data-dino-start': 'true' }}
          title={isPt ? 'Corrida com obstáculos' : 'Obstacle Run'}
          reward={ganho(language).dino}
          onPress={() => onStart('dino')}
          badges={<DinoBadges language={language} />}
        />
        <GameCard
          id="ppt" icon={iconPpt} dataAttrs={{ 'data-ppt-start': 'true' }}
          title={isPt ? 'Pedra, papel e tesoura' : 'Rock, paper, scissors'}
          reward={ganho(language).ppt}
          onPress={() => onStart('ppt')}
        />
        <GameCard
          id="barrage" icon={iconCorrida} dataAttrs={{ 'data-barrage-open': 'true' }}
          title={isPt ? 'Chuva de Almas' : 'Soul Barrage'}
          reward={ganho(language).barrage}
          onPress={() => onStart('barrage')}
        />
      </GameCardGrid>
    </div>
  );
}

/** Ateliê da Mente — o Eco do Pet e os dois jogos de grade (Trilha e Selo Faltante), em cartas ilustradas (`GameCard`; 17/11/2026). */
export function MenteSheet({ language, onStart, bitsToday }: {
  language: Language;
  /** Bits de minijogo já creditados hoje (o teto é compartilhado). */
  bitsToday?: number;
  onStart: (g: MenteGame) => void;
}) {
  const isPt = language === 'pt-BR';
  const upTo = (n: number, size?: number) => <RewardPreview mode="before" language={language} items={[{ kind: 'bits', max: n }]} size={size} />;
  const rows: { id: MenteGame; title: string; asks: string; detail: string; max: number }[] = [
    {
      id: 'eco',
      title: isPt ? 'Eco do Pet' : "Pet's Echo",
      asks: isPt ? 'Pede: lembrar uma sequência' : 'Asks: remember a sequence',
      detail: isPt ? 'Repita a sequência que o seu Soulmon mostra. Ela cresce a cada acerto.' : 'Repeat the sequence your Soulmon shows. It grows with every match.',
      max: ECO_MAX_BITS,
    },
    {
      id: 'zip',
      title: isPt ? 'Trilha do Pet' : 'Pet Trail',
      asks: isPt ? 'Pede: planejar um caminho' : 'Asks: plan a route',
      detail: isPt ? 'Trace um caminho só pelos números, em ordem, passando por todas as casas.' : 'Trace one path through the numbers, in order, covering every cell.',
      max: ZIP_MAX_BITS,
    },
    {
      id: 'selo',
      title: isPt ? 'Selo Faltante' : 'Missing Seal',
      asks: isPt ? 'Pede: achar o padrão' : 'Asks: find the pattern',
      detail: isPt ? 'Descubra o padrão da grade de selos e escolha o que falta. Exercita raciocínio.' : 'Find the pattern in the grid of seals and pick the missing one. It exercises reasoning.',
      max: SELO_MAX_BITS,
    },
  ];
  return (
    <div data-mente style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <BitsHoje language={language} earned={bitsToday} category="minigames" hideTotal />
        <ModalInfo language={language} label={isPt ? 'Como funciona o Ateliê' : 'How the Atelier works'} align="right">
          <InfoTipSection title={isPt ? 'O Ateliê' : 'The Atelier'}>
            {isPt
              ? 'Cada jogo pede uma coisa diferente. Perder só encerra a rodada.'
              : 'Each game asks for something different. Losing only ends the round.'}
          </InfoTipSection>
          {rows.map((r, i) => (
            <InfoTipSection key={r.id} title={r.title} last={i === rows.length - 1}>{r.detail}</InfoTipSection>
          ))}
        </ModalInfo>
      </div>
      <GameCardGrid>
        {rows.map(r => (
          <GameCard
            key={r.id} id={r.id} dataAttrs={{ 'data-mente-start': r.id }}
            title={r.title} reward={upTo(r.max, 14)} hint={r.asks}
            onPress={() => onStart(r.id)}
          />
        ))}
      </GameCardGrid>
    </div>
  );
}

/** Refúgio — para momentos difíceis. Nada aqui pontua ou mede; concluir uma atividade devolve a energia do dia (1×, `utils/refugio/energia.ts`). */
export function RefugioSheet({ language, onStart }: { language: Language; onStart: (g: RefugioGame) => void }) {
  const isPt = language === 'pt-BR';
  return (
    <div data-refugio style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ModalInfo language={language} label={isPt ? 'Sobre o Refúgio' : 'About the Refuge'} align="right">
          <InfoTipSection title={isPt ? 'O Refúgio' : 'The Refuge'}>
            {isPt
              ? 'Um canto para quando o dia pesar. Aqui nada pontua e nada é medido. O primeiro respiro do dia devolve um pouco de energia ao seu Soulmon.'
              : 'A corner for when the day feels heavy. Nothing here scores or measures anything. The first calm moment of the day gives your Soulmon some energy back.'}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Respirar com o Soulmon' : 'Breathe with your Soulmon'}>
            {isPt ? 'Siga uma bolha que enche e esvazia devagar. Seu Soulmon respira junto.' : 'Follow a bubble that slowly fills and empties. Your Soulmon breathes along.'}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Bolhas calmas' : 'Calm bubbles'}>
            {isPt ? 'Só estourar bolhas, no seu ritmo.' : 'Just pop bubbles, at your own pace.'}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Chama' : 'Flame'} last>
            {isPt ? 'Olhe uma chama, feche os olhos e guarde a imagem. Um sino suave guia as trocas.' : 'Gaze at a flame, close your eyes and hold the image. A soft bell guides each change.'}
          </InfoTipSection>
        </ModalInfo>
      <GameCardGrid>
        <GameCard
          id="respiracao" dataAttrs={{ 'data-refugio-start': 'respiracao' }}
          title={isPt ? 'Respirar com o Soulmon' : 'Breathe with your Soulmon'}
          description={isPt ? '1 a 3 minutos' : '1 to 3 minutes'}
          onPress={() => onStart('respiracao')}
        />
        <GameCard
          id="bolhas-calmas" dataAttrs={{ 'data-refugio-start': 'bolhas-calmas' }}
          title={isPt ? 'Bolhas calmas' : 'Calm bubbles'}
          description={isPt ? 'Sem tempo, sem placar' : 'No timer, no score'}
          onPress={() => onStart('bolhas-calmas')}
        />
        <GameCard
          id="chama" dataAttrs={{ 'data-refugio-start': 'chama' }}
          title={isPt ? 'Chama' : 'Flame'}
          description={isPt ? '3, 5 ou 10 minutos' : '3, 5 or 10 minutes'}
          onPress={() => onStart('chama')}
        />
      </GameCardGrid>
      <SupportNote isPt={isPt} data-refugio-ajuda />
    </div>
  );
}
