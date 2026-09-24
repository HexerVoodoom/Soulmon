import { useState, type CSSProperties, type ReactNode } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { MAX_FLOORS, clearBonus } from '../DungeonGame';
import { MATCH_POINTS, WINS_NEEDED } from '../RPSGame';
import { getDungeonBest, getDungeonDifficulty, HEART_DROP_CHANCE } from '../../utils/dungeon';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { readNumber } from '../../utils/safeStorage';
import { bitsStyle } from '../../utils/currencies';
import type { Language } from '../../utils/i18n';

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
export function MasmorraSheet({ language, onStart }: { language: Language; onStart: () => void }) {
  const isPt = language === 'pt-BR';
  // Lidos UMA vez ao abrir a folha, pelos mesmos donos que a `DungeonGame`
  // usa (a dificuldade vira a semana sozinha dentro de `getDungeonDifficulty`).
  const [level] = useState(() => getDungeonDifficulty());
  const [best] = useState(() => getDungeonBest());
  const floors = Array.from({ length: MAX_FLOORS }, (_, i) => i + 1);

  return (
    <div data-masmorra style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={sectionHead}>{isPt ? `${MAX_FLOORS} andares por run` : `${MAX_FLOORS} floors per run`}</p>
      <ol
        aria-label={isPt ? 'Andares da run' : 'Run floors'}
        style={{ display: 'flex', gap: 6, listStyle: 'none', margin: 0, padding: 0 }}
      >
        {floors.map(f => (
          <li
            key={f}
            className="sm2-num"
            style={{
              flex: 1, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-sm)',
              backgroundColor: 'var(--sm2-surface-2)',
              ...sm2Text, fontWeight: 600,
            }}
          >
            {f}
          </li>
        ))}
      </ol>
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
      <p style={note}>
        {isPt ? 'Perder custa só a run — nunca os seus corações.' : 'Losing only costs the run — never your hearts.'}
      </p>
      <button type="button" data-masmorra-start onClick={onStart} style={cta}>
        {isPt ? 'Entrar na masmorra' : 'Enter the dungeon'}
      </button>
    </div>
  );
}

// ── Corrida do Dino ─────────────────────────────────────────────────────────
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
      <p style={note}>
        {isPt
          ? `Pule os obstáculos · cada ${DINO_POINTS_PER_BIT} pontos vira 1 Bit`
          : `Jump the obstacles · every ${DINO_POINTS_PER_BIT} points becomes 1 Bit`}
      </p>
      <button type="button" data-dino-start onClick={onStart} style={cta}>
        {isPt ? 'Correr' : 'Run'}
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
      <p style={note}>
        {isPt
          ? `Contra o seu Soulmon — quem vencer ${WINS_NEEDED} rodadas leva a partida`
          : `Against your Soulmon — first to ${WINS_NEEDED} rounds takes the match`}
      </p>
      <button type="button" data-ppt-start onClick={onStart} style={cta}>
        {isPt ? 'Jogar' : 'Play'}
      </button>
    </div>
  );
}
