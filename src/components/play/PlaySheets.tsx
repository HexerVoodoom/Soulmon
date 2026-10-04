import { useState, type CSSProperties, type ReactNode } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { InfoTip, InfoTipSection } from '../ui/InfoTip';
import { MAX_FLOORS, clearBonus } from '../DungeonGame';
import { MATCH_POINTS, WINS_NEEDED } from '../RPSGame';
import { getDungeonBest, getDungeonDifficulty, HEART_DROP_CHANCE } from '../../utils/dungeon';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { readNumber } from '../../utils/safeStorage';
import { bitsStyle, MINIGAME_BITS_PER_DAY } from '../../utils/currencies';
import type { Language } from '../../utils/i18n';
import { ECO_MAX_BITS } from '../../utils/mente/eco';
import { BOLHAS_MAX_BITS } from '../../utils/mente/bolhas';
import { TROCA_MAX_BITS } from '../../utils/mente/troca';
import { PICROSS_MAX_BITS } from '../../utils/mente/picross';
import { SupportNote } from '../refugio/SupportNote';
import { REVIEW_SESSION_BITS } from '../../utils/mente/revisao';
import { sheetCard, sheetCardList, sheetCardTitle } from '../nav/sheetKit';

/**
 * AS FOLHAS DAS ÁREAS DE JOGAR (minimal-ui F5 — Exploração e Jogos).
 *
 * Mocks aprovados: `propostas/exploracao/mock.html` (`#modalMasmorra`,
 * `#modalDino`) e `propostas/jogos/mock.html` (`#modalPPT`). Cada folha é a
 * PORTA de um minijogo que já existia: mostra o que está em jogo e abre o
 * jogo pelo CTA. **Nenhuma regra nasce aqui** — os números vêm das constantes
 * dos donos (`MAX_FLOORS`/`clearBonus` da `DungeonGame`, `HEART_DROP_CHANCE`
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

function DropRow({ label, value }: { label: string; value: string }) {
  return (
    <li style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--sm2-line)' }}>
      <span style={{ ...sm2Text, flex: 1, minWidth: 0 }}>{label}</span>
      <span className="sm2-num" style={{ ...sm2Hint, flexShrink: 0 }}>{value}</span>
    </li>
  );
}

// ── Masmorra ────────────────────────────────────────────────────────────────
export function MasmorraSheet({ language, onStart, bitsToday }: { language: Language; onStart: () => void; bitsToday?: number }) {
  const isPt = language === 'pt-BR';
  // Lidos UMA vez ao abrir a folha, pelos mesmos donos que a `DungeonGame`
  // usa (a dificuldade vira a semana sozinha dentro de `getDungeonDifficulty`).
  const [level] = useState(() => getDungeonDifficulty());
  const [best] = useState(() => getDungeonBest());

  return (
    <div data-masmorra style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* H11 (01/10/2026): a fileira de andares numerados saiu — repetia o
          número da linha de cima e não dizia nada que ela não dissesse. */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <p style={sectionHead}>{isPt ? `${MAX_FLOORS} andares por run` : `${MAX_FLOORS} floors per run`}</p>
        {/* I13: a nota de "perder" saiu da folha e mora atrás do "?". */}
        <InfoTip language={language} label={isPt ? 'Como funciona a masmorra' : 'How the dungeon works'} align="right">
          {isPt ? 'Perder custa só a run — nunca os seus corações.' : 'Losing only costs the run — never your hearts.'}
        </InfoTip>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatBox value={isPt ? `Nível ${level}` : `Level ${level}`} label={isPt ? 'dificuldade da semana' : "this week's difficulty"} />
        <StatBox value={best} label={isPt ? 'seu melhor placar' : 'your best score'} />
      </div>
      <p style={sectionHead}>{isPt ? 'Pode cair' : 'Possible drops'}</p>
      <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        <DropRow
          label={isPt ? 'Bits por inimigo + bônus de andar' : 'Bits per enemy + floor bonus'}
          value={`${clearBonus(1)}→${clearBonus(MAX_FLOORS)}`}
        />
        <DropRow
          label={isPt ? 'Coraçãozinho (raro)' : 'Little heart (rare)'}
          value={`${Math.round(HEART_DROP_CHANCE * 100)}%`}
        />
        <DropRow
          label={isPt ? `Glitchtama ao fechar os ${MAX_FLOORS} andares` : `Glitchtama for clearing all ${MAX_FLOORS} floors`}
          value="1"
        />
      </ul>
      {/* H11: o botão vem ANTES das duas notas — a ação primeiro, o miúdo depois. */}
      <button type="button" data-masmorra-start onClick={onStart} style={cta}>
        {isPt ? 'Entrar na masmorra' : 'Enter the dungeon'}
      </button>
      <BitsHoje language={language} earned={bitsToday} />
    </div>
  );
}

// ── Corrida com obstáculos ────────────────────────────────────────────────────
/** Bits que um placar rende na Corrida — a mesma conta da `DinoGame` (1 a cada 100). */
const DINO_POINTS_PER_BIT = 100;

export function DinoSheet({ language, onStart }: { language: Language; onStart: () => void }) {
  const isPt = language === 'pt-BR';
  const [best] = useState(() => readNumber(STORAGE_KEYS.DINO_BEST, 0));
  return (
    <div data-dino style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <StatBox value={best} label={isPt ? 'seu recorde' : 'your best'} />
        <StatBox
          value={`${Math.floor(best / DINO_POINTS_PER_BIT)} Bits`}
          label={isPt ? 'no recorde' : 'at your best'}
          valueStyle={bitsStyle}
        />
      </div>
      {/* H13 (01/10/2026): "Jogar"/"Play" nos dois jogos do Salão — "Correr"
          lia como descrição do jogo, não como a ação de abri-lo. */}
      <button type="button" data-dino-start onClick={onStart} style={cta}>
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
        <StatBox value={`${MATCH_POINTS} Bits`} label={isPt ? 'por vitória' : 'per win'} valueStyle={bitsStyle} />
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

export type SalaoGame = 'dino' | 'ppt';
export type MenteGame = 'eco' | 'bolhas' | 'troca' | 'picross' | 'revisao';
export type RefugioGame = 'respiracao' | 'bolhas-calmas';

/** Salão de Jogos — jogos livres: a Corrida com obstáculos e o PPT, as mesmas folhas de sempre.
 *  I2 (01/10/2026): cada jogo é um CARD próprio (`sheetCard`), não mais dois
 *  blocos separados por um filete. */
export function SalaoSheet({ language, onStart, bitsToday }: { language: Language; onStart: (g: SalaoGame) => void; bitsToday?: number }) {
  const isPt = language === 'pt-BR';
  return (
    <div data-salao style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <BitsHoje language={language} earned={bitsToday} />
        <InfoTip language={language} label={isPt ? 'Como funciona o Salão' : 'How the Hall works'} align="right">
          <InfoTipSection title={isPt ? 'Corrida com obstáculos' : 'Obstacle Run'}>
            {isPt
              ? `Pule os obstáculos · cada ${DINO_POINTS_PER_BIT} pontos vira 1 Bit`
              : `Jump the obstacles · every ${DINO_POINTS_PER_BIT} points becomes 1 Bit`}
          </InfoTipSection>
          <InfoTipSection title={isPt ? 'Pedra, papel e tesoura' : 'Rock, paper, scissors'} last>
            {isPt
              ? `Contra o seu Soulmon — quem vencer ${WINS_NEEDED} rodadas leva a partida`
              : `Against your Soulmon — first to ${WINS_NEEDED} rounds takes the match`}
          </InfoTipSection>
        </InfoTip>
      </div>
      <ul style={sheetCardList}>
        <li style={sheetCard}>
          <p style={sheetCardTitle}>{isPt ? 'Corrida com obstáculos' : 'Obstacle Run'}</p>
          <DinoSheet language={language} onStart={() => onStart('dino')} />
        </li>
        <li style={sheetCard}>
          <p style={sheetCardTitle}>{isPt ? 'Pedra, papel e tesoura' : 'Rock, paper, scissors'}</p>
          <PptSheet language={language} onStart={() => onStart('ppt')} />
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

/** Ateliê da Mente — os cinco jogos que exercitam uma função. */
export function MenteSheet({ language, reviewDue, onStart, bitsToday }: {
  language: Language;
  /** Bits de minijogo já creditados hoje (o teto é compartilhado). */
  bitsToday?: number;
  /** Quantos cartões da Revisão estão para hoje (`dueCards`, dono `utils/mente/revisao`). */
  reviewDue: number;
  onStart: (g: MenteGame) => void;
}) {
  const isPt = language === 'pt-BR';
  const upTo = (n: number) => (isPt ? `até ${n} Bits` : `up to ${n} Bits`);
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
      id: 'bolhas',
      title: isPt ? 'Bolhas do Sonho' : 'Dream Bubbles',
      asks: isPt ? 'Pede: segurar o impulso' : 'Asks: hold back the impulse',
      detail: isPt ? 'Estoure os sonhos claros e deixe passar os fiapos escuros.' : 'Pop the bright dreams and let the dark wisps drift by.',
      meta: <span style={bitsStyle}>{upTo(BOLHAS_MAX_BITS)}</span>,
    },
    {
      id: 'troca',
      title: isPt ? 'Troca de Regra' : 'Rule Switch',
      asks: isPt ? 'Pede: mudar de ideia' : 'Asks: change your mind',
      detail: isPt ? 'Separe as criaturas pela regra da vez — e perceba quando ela muda.' : 'Sort the creatures by the current rule — and notice when it changes.',
      meta: <span style={bitsStyle}>{upTo(TROCA_MAX_BITS)}</span>,
    },
    {
      id: 'picross',
      title: isPt ? 'Nonograma da Malha' : 'Mesh Nonogram',
      asks: isPt ? 'Pede: deduzir' : 'Asks: deduce',
      detail: isPt ? 'Pinte a grade pelas pistas e revele um desenho. Um novo a cada dia.' : 'Fill the grid from the clues and reveal a picture. A new one every day.',
      meta: <span style={bitsStyle}>{upTo(PICROSS_MAX_BITS)}</span>,
    },
    {
      id: 'revisao',
      title: isPt ? 'Revisão da Malha' : 'Mesh Review',
      asks: isPt ? 'Pede: lembrar o que você quer aprender' : 'Asks: recall what you want to learn',
      detail: isPt
        ? 'Cartões que VOCÊ escreve, revistos no intervalo certo: o que você lembra volta mais tarde, o que não lembra volta amanhã.'
        : 'Cards YOU write, reviewed at the right interval: what you remember comes back later, what you don’t comes back tomorrow.',
      meta: reviewDue > 0
        ? (isPt ? `${reviewDue} para hoje` : `${reviewDue} for today`)
        : <span style={bitsStyle}>{`${REVIEW_SESSION_BITS} Bits`}</span>,
      cta: isPt ? 'Abrir' : 'Open',
    },
  ];
  return (
    <div data-mente style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <BitsHoje language={language} earned={bitsToday} />
        <InfoTip language={language} label={isPt ? 'Como funciona o Ateliê' : 'How the Atelier works'} align="right">
          <InfoTipSection title={isPt ? 'O Ateliê' : 'The Atelier'}>
            {isPt
              ? 'Cada jogo pede uma coisa diferente. Perder só encerra a rodada.'
              : 'Each game asks for something different. Losing only ends the round.'}
          </InfoTipSection>
          {rows.map((r, i) => (
            <InfoTipSection key={r.id} title={r.title} last={i === rows.length - 1}>{r.detail}</InfoTipSection>
          ))}
        </InfoTip>
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
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <InfoTip language={language} label={isPt ? 'Sobre o Refúgio' : 'About the Refuge'} align="right">
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
        </InfoTip>
      </div>
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
