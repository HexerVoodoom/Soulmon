import { useState, type CSSProperties, type ReactNode } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { ModalInfo, InfoTipSection } from '../ui/InfoTip';
import { clearBonus } from '../DungeonGame';
import { DUNGEON_MILESTONE_FLOOR, DUNGEON_ENERGY_PER_LAYER, DUNGEON_MAX_LAYER, sanitizeDepthRecord } from '../../utils/dungeonIdle';
import { useGameStateOptional } from '../../contexts/GameStateContext';
import { MATCH_POINTS, WINS_NEEDED } from '../RPSGame';
import { getDungeonBest, HEART_DROP_CHANCE } from '../../utils/dungeon';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { readNumber } from '../../utils/safeStorage';
import { bitsStyle, MINIGAME_BITS_PER_DAY } from '../../utils/currencies';
import { BitsAmount } from '../ui/BitsAmount';
import type { Language } from '../../utils/i18n';
import { ECO_MAX_BITS } from '../../utils/mente/eco';
import { ZIP_MAX_BITS } from '../../utils/mente/zip';
import { PATCHES_MAX_BITS } from '../../utils/mente/patches';
import { SupportNote } from '../refugio/SupportNote';
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
export function BitsHoje({ language, earned }: { language: Language; earned?: number }) {
  if (earned === undefined) return null;
  const isPt = language === 'pt-BR';
  const n = Math.min(MINIGAME_BITS_PER_DAY, Math.max(0, Math.floor(earned)));
  const cheio = n >= MINIGAME_BITS_PER_DAY;
  return (
    <p data-bits-hoje style={{ ...note, margin: 0 }}>
      <span className="sm2-num">
        {isPt ? `Bits de minijogo hoje: ${n} de ${MINIGAME_BITS_PER_DAY}` : `Minigame Bits today: ${n} of ${MINIGAME_BITS_PER_DAY}`}
      </span>
      {cheio && (isPt
        ? ' · os jogos seguem abertos; os Bits voltam amanhã.'
        : ' · the games stay open; Bits come back tomorrow.')}
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
export function MasmorraSheet({ language, onStart, bitsToday }: { language: Language; onStart: () => void; bitsToday?: number }) {
  const isPt = language === 'pt-BR';
  // O recorde de profundidade mora no save (REGISTRO §31); o placar, no aparelho (`getDungeonBest`).
  const gs = useGameStateOptional()?.gameState;
  const deepest = sanitizeDepthRecord(gs?.dungeonDepthRecord);
  const [best] = useState(() => getDungeonBest());

  return (
    <div data-masmorra style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* H11 (01/10/2026): a fileira de andares numerados saiu — repetia o
          número da linha de cima e não dizia nada que ela não dissesse. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <p style={sectionHead}>{isPt ? 'Descida automática, sem fim' : 'Automatic descent, no end'}</p>
        {/* I13: a nota de "perder" saiu da folha e mora atrás do "?". */}
        <ModalInfo language={language} label={isPt ? 'Como funciona a Fenda' : 'How the Rift works'} align="right">
          <InfoTipSection title={isPt ? 'Como funciona' : 'How it works'}>
          {isPt
            ? `As lutas vêm sozinhas e o HP volta com o tempo. Cada camada gasta ${DUNGEON_ENERGY_PER_LAYER} de energia (a da Home) até a camada ${DUNGEON_MAX_LAYER}. Perder custa só a descida, nunca os seus corações.`
            : `Fights run on their own and HP returns over time. Each layer costs ${DUNGEON_ENERGY_PER_LAYER} energy (Home energy), down to layer ${DUNGEON_MAX_LAYER}. Losing only costs the descent, never your hearts.`}
          </InfoTipSection>
          {/* Pedido do dono (11/10/2026): "Pode cair" saiu do corpo da folha e
              vive aqui, atrás do "i", como lista. Mesmas constantes de antes. */}
          <InfoTipSection title={isPt ? 'Pode cair' : 'Possible drops'} last>
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
                label={isPt ? `Glitchtama no primeiro marco (a cada ${DUNGEON_MILESTONE_FLOOR} camadas) da descida` : `Glitchtama at the descent's first milestone (every ${DUNGEON_MILESTONE_FLOOR} layers)`}
                value="1"
              />
              <DropItem
                label={isPt ? 'Fragmentos do Soulsmith nos marcos de profundidade (5, 10, 25, 50…)' : 'Soulsmith fragments at depth milestones (5, 10, 25, 50…)'}
                value="5→100"
              />
            </ul>
          </InfoTipSection>
        </ModalInfo>
      </div>
      {/* P10 (beta-2): chip ZERADO não aparece (recorde 0 não diz nada) — a fileira inteira some se nenhum tiver o que dizer. */}
      {(deepest > 0 || best > 0) && (
        <div style={{ display: 'flex', gap: 8 }}>
          {deepest > 0 && <StatBox value={isPt ? `Camada ${deepest}` : `Layer ${deepest}`} label={isPt ? 'a mais funda até hoje' : 'deepest so far'} />}
          {best > 0 && <StatBox value={best} label={isPt ? 'seu melhor placar' : 'your best score'} />}
        </div>
      )}
      {/* H11: o botão vem ANTES das duas notas — a ação primeiro, o miúdo depois. */}
      <button type="button" data-masmorra-start onClick={onStart} style={cta}>
        {isPt ? 'Descer à Fenda' : 'Go down the Rift'}
      </button>
      <BitsHoje language={language} earned={bitsToday} />
    </div>
  );
}

// ── Corrida com obstáculos ────────────────────────────────────────────────────
/** Bits que um placar rende na Corrida — a mesma conta da `DinoGame` (1 a cada 100). */
const DINO_POINTS_PER_BIT = 100;
import { BARRAGE_POINTS_PER_BIT } from '../../utils/soulBarrage';

export function DinoSheet({ language, onStart }: { language: Language; onStart: () => void }) {
  const isPt = language === 'pt-BR';
  const [best] = useState(() => readNumber(STORAGE_KEYS.DINO_BEST, 0));
  return (
    <div data-dino style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* P10 (beta-2): sem recorde (0) os dois chips somem — não há "0 Bits no recorde" para mostrar. */}
      {best > 0 && (
        <div style={{ display: 'flex', gap: 8 }}>
          <StatBox value={best} label={isPt ? 'seu recorde' : 'your best'} />
          <StatBox
            value={<BitsAmount value={Math.floor(best / DINO_POINTS_PER_BIT)} />}
            label={isPt ? 'no recorde' : 'at your best'}
            valueStyle={bitsStyle}
          />
        </div>
      )}
      {/* H13 (01/10/2026): "Jogar"/"Play" nos dois jogos do Salão — "Correr"
          lia como descrição do jogo, não como a ação de abri-lo. */}
      <button type="button" data-dino-start onClick={onStart} style={cta}>
        {isPt ? 'Jogar' : 'Play'}
      </button>
    </div>
  );
}

// ── Elemental Fusion ───────────────────────────────────────────────────────────────
export function Match3Sheet({ language, onStart }: { language: Language; onStart: () => void }) {
  const isPt = language === 'pt-BR';
  const [best] = useState(() => readNumber(STORAGE_KEYS.MATCH3_BEST, 0));
  return (
    <div data-match3 style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        {best > 0 && <StatBox value={best} label={isPt ? 'seu recorde' : 'your best'} />}
        <StatBox value={<>{isPt ? 'até' : 'up to'} <BitsAmount value={M3C_MAX_BITS} /></>} label={isPt ? 'por rodada' : 'per round'} valueStyle={bitsStyle} />
      </div>
      <button type="button" data-match3-start onClick={onStart} style={cta}>
        {isPt ? 'Jogar' : 'Play'}
      </button>
    </div>
  );
}

// ── Pedra, papel e tesoura ──────────────────────────────────────────────────
export function PptSheet({ language, onStart }: { language: Language; onStart: () => void }) {
  const isPt = language === 'pt-BR';
  return (
    <div data-ppt style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatBox value={<BitsAmount value={MATCH_POINTS} />} label={isPt ? 'por vitória' : 'per win'} valueStyle={bitsStyle} />
        <StatBox value={WINS_NEEDED} label={isPt ? 'rodadas para vencer' : 'rounds to win'} />
      </div>
      <button type="button" data-ppt-start onClick={onStart} style={cta}>
        {isPt ? 'Jogar' : 'Play'}
      </button>
    </div>
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
export type MenteGame = 'eco' | 'zip' | 'patches';
export type RefugioGame = 'respiracao' | 'bolhas-calmas';

/** Salão de Jogos — jogos livres: a Corrida com obstáculos e o PPT, as mesmas folhas de sempre.
 *  I2 (01/10/2026): cada jogo é um CARD próprio (`sheetCard`), não mais dois
 *  blocos separados por um filete. */
export function SalaoSheet({ language, onStart, bitsToday }: { language: Language; onStart: (g: SalaoGame) => void; bitsToday?: number }) {
  const isPt = language === 'pt-BR';
  return (
    <div data-salao style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sm2-space-4, 16px)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <BitsHoje language={language} earned={bitsToday} />
        <ModalInfo language={language} label={isPt ? 'Como funciona o Salão' : 'How the Hall works'} align="right">
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
          <InfoTipSection title={isPt ? 'Chuva de Almas' : 'Soul Barrage'}>
            {isPt
              ? `Arraste (ou use as setas) para desviar dos tiros: o seu Soulmon atira sozinho · cada ${BARRAGE_POINTS_PER_BIT} pontos vira 1 Bit`
              : `Drag (or use the arrow keys) to dodge the shots: your Soulmon fires on its own · every ${BARRAGE_POINTS_PER_BIT} points becomes 1 Bit`}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Elemental Fusion' : 'Elemental Fusion'} last>
            {isPt
              ? `Troque peças vizinhas e alinhe 3 ou mais: cada linha golpeia o time da fenda · a rodada acaba quando um lado recua · cada ${M3_POINTS_PER_BIT} pontos viram 1 Bit, até ${M3C_MAX_BITS}`
              : `Swap neighbouring tiles to line up 3+: each line strikes the rift team · the round ends when one side steps back · every ${M3_POINTS_PER_BIT} points become 1 Bit, up to ${M3C_MAX_BITS}`}
          </InfoTipSection>
        </ModalInfo>
      </div>
      <ul style={{ ...sheetCardList, gap: 'var(--sm2-space-4, 16px)' }}>
        <li style={sheetCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PixelIcon src={iconCorrida} size={32} style={{ flexShrink: 0 }} />
            <p style={sheetCardTitle}>{isPt ? 'Corrida com obstáculos' : 'Obstacle Run'}</p>
          </div>
          <DinoSheet language={language} onStart={() => onStart('dino')} />
        </li>
        <li style={sheetCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PixelIcon src={iconPpt} size={32} style={{ flexShrink: 0 }} />
            <p style={sheetCardTitle}>{isPt ? 'Pedra, papel e tesoura' : 'Rock, paper, scissors'}</p>
          </div>
          <PptSheet language={language} onStart={() => onStart('ppt')} />
        </li>
        <li style={sheetCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PixelIcon src={iconCombina} size={32} style={{ flexShrink: 0 }} />
            <p style={sheetCardTitle}>{isPt ? 'Elemental Fusion' : 'Elemental Fusion'}</p>
          </div>
          <Match3Sheet language={language} onStart={() => onStart('match3')} />
        </li>
        <li style={sheetCard}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <PixelIcon src={iconCorrida} size={32} style={{ flexShrink: 0 }} />
            <p style={sheetCardTitle}>{isPt ? 'Chuva de Almas' : 'Soul Barrage'}</p>
          </div>
          <div data-barrage style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button type="button" data-barrage-open onClick={() => onStart('barrage')} style={cta}>
              {isPt ? 'Jogar' : 'Play'}
            </button>
          </div>
        </li>
      </ul>
    </div>
  );
}

/** Um jogo do Ateliê/Refúgio: CARD próprio (I2) com o CTA PRIMÁRIO (H14 — a
 *  ação principal de toda folha é o mesmo botão, padronizado). */
function GameRow({ id, title, asks, meta, cta, onStart, dataKey }: {
  id: string; title: string; asks: string; meta?: ReactNode; cta: string;
  onStart: () => void; dataKey: 'mente' | 'refugio';
}) {
  return (
    <li style={sheetCard}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ ...sheetCardTitle, flex: 1, minWidth: 0 }}>{title}</span>
        {meta !== undefined && <span className="sm2-num" style={{ ...sm2Hint, flexShrink: 0 }}>{meta}</span>}
      </div>
      <p style={{ ...sm2Hint, margin: 0, color: 'var(--sm2-gold-ink)' }}>{asks}</p>
      <button
        type="button"
        {...{ [`data-${dataKey}-start`]: id }}
        onClick={onStart}
        style={{ ...sm2Button('primary'), width: '100%' }}
      >
        {cta}
      </button>
    </li>
  );
}

/** Ateliê da Mente — o Eco do Pet e os dois jogos de grade (Trilha e Colcha). */
export function MenteSheet({ language, onStart, bitsToday }: {
  language: Language;
  /** Bits de minijogo já creditados hoje (o teto é compartilhado). */
  bitsToday?: number;
  onStart: (g: MenteGame) => void;
}) {
  const isPt = language === 'pt-BR';
  const upTo = (n: number) => <>{isPt ? 'até' : 'up to'} <BitsAmount value={n} /></>;
  const cta = isPt ? 'Jogar' : 'Play';
  const rows: { id: MenteGame; title: string; asks: string; detail: string; meta: ReactNode; cta?: string }[] = [
    {
      id: 'eco',
      title: isPt ? 'Eco do Pet' : "Pet's Echo",
      asks: isPt ? 'Pede: lembrar uma sequência' : 'Asks: remember a sequence',
      detail: isPt ? 'Repita a sequência que o seu Soulmon mostra. Ela cresce a cada acerto.' : 'Repeat the sequence your Soulmon shows. It grows with every match.',
      meta: <span style={bitsStyle}>{upTo(ECO_MAX_BITS)}</span>,
    },
    {
      id: 'zip',
      title: isPt ? 'Trilha do Pet' : 'Pet Trail',
      asks: isPt ? 'Pede: planejar um caminho' : 'Asks: plan a route',
      detail: isPt ? 'Trace um caminho só pelos números, em ordem, passando por todas as casas.' : 'Trace one path through the numbers, in order, covering every cell.',
      meta: <span style={bitsStyle}>{upTo(ZIP_MAX_BITS)}</span>,
    },
    {
      id: 'patches',
      title: isPt ? 'Colcha' : 'Patchwork',
      asks: isPt ? 'Pede: dividir pelo espaço' : 'Asks: split the space',
      detail: isPt ? 'Divida a grade em retângulos: cada um leva um número, que é a área dele.' : 'Split the grid into rectangles: each holds one number, which is its area.',
      meta: <span style={bitsStyle}>{upTo(PATCHES_MAX_BITS)}</span>,
    },
  ];
  return (
    <div data-mente style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <BitsHoje language={language} earned={bitsToday} />
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
      <ul style={sheetCardList}>
        {rows.map(r => (
          <GameRow key={r.id} dataKey="mente" id={r.id} title={r.title} asks={r.asks} meta={r.meta} cta={r.cta ?? cta} onStart={() => onStart(r.id)} />
        ))}
      </ul>
    </div>
  );
}

/** Refúgio — para momentos difíceis. Nada aqui pontua, paga ou mede. */
export function RefugioSheet({ language, onStart }: { language: Language; onStart: (g: RefugioGame) => void }) {
  const isPt = language === 'pt-BR';
  return (
    <div data-refugio style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <ModalInfo language={language} label={isPt ? 'Sobre o Refúgio' : 'About the Refuge'} align="right">
          <InfoTipSection title={isPt ? 'O Refúgio' : 'The Refuge'}>
            {isPt
              ? 'Um canto para quando o dia pesar. Aqui nada pontua, nada paga e nada é medido.'
              : 'A corner for when the day feels heavy. Nothing here scores, pays or measures anything.'}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Respirar com o Soulmon' : 'Breathe with your Soulmon'}>
            {isPt ? 'Siga uma bolha que enche e esvazia devagar. Seu Soulmon respira junto.' : 'Follow a bubble that slowly fills and empties. Your Soulmon breathes along.'}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Bolhas calmas' : 'Calm bubbles'} last>
            {isPt ? 'Só estourar bolhas, no seu ritmo.' : 'Just pop bubbles, at your own pace.'}
          </InfoTipSection>
        </ModalInfo>
      <ul style={sheetCardList}>
        <GameRow
          dataKey="refugio" id="respiracao"
          title={isPt ? 'Respirar com o Soulmon' : 'Breathe with your Soulmon'}
          asks={isPt ? '1 a 3 minutos' : '1 to 3 minutes'}
          cta={isPt ? 'Começar' : 'Start'}
          onStart={() => onStart('respiracao')}
        />
        <GameRow
          dataKey="refugio" id="bolhas-calmas"
          title={isPt ? 'Bolhas calmas' : 'Calm bubbles'}
          asks={isPt ? 'Sem tempo, sem placar' : 'No timer, no score'}
          cta={isPt ? 'Começar' : 'Start'}
          onStart={() => onStart('bolhas-calmas')}
        />
      </ul>
      <SupportNote isPt={isPt} data-refugio-ajuda />
    </div>
  );
}
