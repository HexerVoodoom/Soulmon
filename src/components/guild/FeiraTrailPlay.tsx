/**
 * O DESAFIO DA FEIRA (F-10, `docs/PLANO-FEIRA-CHEFE.md` §4): desenha a INSTÂNCIA que o servidor entregou e devolve a solução.
 *
 * ⚠️ Renderizadores MÍNIMOS e fiéis, não os minijogos inteiros: os jogos de `components/mente/` misturam a tela com o
 * ciclo do jogo (Bits, ranking, tutorial, fim de rodada), e o desafio vem pronto de fora. A REGRA de cada um segue
 * reaproveitada de `utils/mente/*` (caminho do Zip, colcha, conferência do Picross, lado certo da Troca, a pedra do
 * Eco) — nenhuma lógica foi duplicada; só a casca de tela é nova (toque simples, sem arrastar, sem som).
 *
 * Mudo. Sem tempo na tela (o piso de tempo é do `FeiraEventoSheet`), sem "errou": a conferência é do servidor.
 */
import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactElement } from 'react';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { feiraText } from '../../utils/feiraCopy';
import type { Language } from '../../utils/i18n';
import type { FeiraSolution, FeiraTrail } from '../../utils/feira';
import { canStep, validateZip } from '../../utils/mente/zip';
import { placeRect, rectBetween, rectHas, validatePatches, type Rect } from '../../utils/mente/patches';
import { CROSSED, EMPTY, FILLED, matchesClues, type CellMark } from '../../utils/mente/picross';
import { sideFor, type TrocaSide } from '../../utils/mente/troca';
import { checkTap, growSequence, playbackIntervalMs, seededRng, startSequence, ECO_STONES, type Stone } from '../../utils/mente/eco';

export interface FeiraTrailPlayProps {
  language: Language;
  trail: FeiraTrail;
  /** O jogador pediu para enviar (o botão só acende quando a solução já fecha por conta própria). */
  onSubmit: (solution: FeiraSolution) => void;
  busy?: boolean;
}

const CELL = 44;
const gridStyle = (cols: number): CSSProperties => ({ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${CELL}px)`, gap: 3, justifyContent: 'center', touchAction: 'manipulation' });
const cellStyle = (on: boolean): CSSProperties => ({
  width: CELL, height: CELL, borderRadius: 8, border: '1px solid var(--sm2-line)', cursor: 'pointer', padding: 0,
  background: on ? 'var(--sm2-primary-fill)' : 'var(--sm2-surface)', color: on ? 'var(--sm2-on-primary)' : 'var(--sm2-ink)', fontFamily: 'var(--sm2-font-text)', fontWeight: 600,
});

export function FeiraTrailPlay({ language, trail, onSubmit, busy }: FeiraTrailPlayProps) {
  const t = (k: Parameters<typeof feiraText>[1], v?: Record<string, string | number>) => feiraText(language, k, v);
  const send = (ok: boolean, solution: () => FeiraSolution, extra?: () => void) => (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 12 }}>
      {extra && <button type="button" onClick={extra} style={sm2Button('outline')} data-trail-reset>{t('trail.reset')}</button>}
      <button type="button" disabled={!ok || busy} aria-disabled={!ok || busy ? true : undefined} onClick={() => onSubmit(solution())} style={sm2Button('primary', !ok || !!busy)} data-trail-send>
        {busy ? t('trail.sending') : t('trail.send')}
      </button>
    </div>
  );
  const rule = (k: Parameters<typeof feiraText>[1]) => <p style={{ ...sm2Hint, textAlign: 'center', margin: '0 0 8px' }} data-trail-rule>{t(k)}</p>;

  if (trail.game === 'zip') return <ZipPlay trail={trail} rule={rule('game.zip')} send={send} t={t} />;
  if (trail.game === 'patches') return <PatchesPlay trail={trail} rule={rule('game.patches')} send={send} />;
  if (trail.game === 'picross') return <PicrossPlay trail={trail} rule={rule('game.picross')} send={send} />;
  if (trail.game === 'troca') return <TrocaPlay trail={trail} rule={rule('game.troca')} send={send} t={t} />;
  return <EcoPlay trail={trail} rule={rule('game.eco')} send={send} t={t} />;
}

type Send = (ok: boolean, solution: () => FeiraSolution, extra?: () => void) => ReactElement;
type T = (k: Parameters<typeof feiraText>[1], v?: Record<string, string | number>) => string;

function ZipPlay({ trail, rule, send }: { trail: Extract<FeiraTrail, { game: 'zip' }>; rule: ReactElement; send: Send; t: T }) {
  const { size, numbers } = trail.puzzle;
  const [path, setPath] = useState<number[]>([]);
  const ok = useMemo(() => validateZip(trail.puzzle, path), [trail.puzzle, path]);
  const tap = (cell: number) => setPath(p => {
    if (p.length > 0 && p[p.length - 1] === cell) return p.slice(0, -1); // toque na ponta desfaz um passo
    return canStep(trail.puzzle, p, cell) ? [...p, cell] : p;
  });
  return (
    <div data-trail-game="zip">
      {rule}
      <div style={gridStyle(size)} role="group">
        {Array.from({ length: size * size }, (_, c) => {
          const n = numbers.indexOf(c);
          const on = path.includes(c);
          return <button key={c} type="button" style={cellStyle(on)} onClick={() => tap(c)} aria-label={n >= 0 ? `${n + 1}` : `${Math.floor(c / size) + 1},${(c % size) + 1}`} aria-pressed={on} data-zip-cell={c}>{n >= 0 ? n + 1 : ''}</button>;
        })}
      </div>
      {send(ok, () => ({ path }), () => setPath([]))}
    </div>
  );
}

function PatchesPlay({ trail, rule, send }: { trail: Extract<FeiraTrail, { game: 'patches' }>; rule: ReactElement; send: Send }) {
  const { size, clues } = trail.puzzle;
  const [rects, setRects] = useState<Rect[]>([]);
  const [anchor, setAnchor] = useState<number | null>(null);
  const ok = useMemo(() => validatePatches(trail.puzzle, rects), [trail.puzzle, rects]);
  const tap = (cell: number) => {
    if (anchor === null) {
      const own = rects.find(r => rectHas(r, cell, size));
      if (own) { setRects(rs => rs.filter(r => r !== own)); return; } // toque numa colcha pronta a desmancha
      setAnchor(cell);
      return;
    }
    setRects(rs => placeRect(rs, rectBetween(anchor, cell, size)));
    setAnchor(null);
  };
  return (
    <div data-trail-game="patches">
      {rule}
      <div style={gridStyle(size)} role="group">
        {Array.from({ length: size * size }, (_, c) => {
          const i = rects.findIndex(r => rectHas(r, c, size));
          const clue = clues.find(x => x.cell === c);
          return (
            <button key={c} type="button" onClick={() => tap(c)} data-patch-cell={c} aria-pressed={i >= 0}
              style={{ ...cellStyle(i >= 0), outline: anchor === c ? '2px solid var(--sm2-ink)' : undefined, opacity: i >= 0 ? 0.5 + ((i % 3) * 0.18) : 1 }}>
              {clue ? `${clue.area}${clue.shape === 'square' ? '□' : clue.shape === 'tall' ? '↕' : clue.shape === 'wide' ? '↔' : ''}` : ''}
            </button>
          );
        })}
      </div>
      {send(ok, () => ({ rects }), () => { setRects([]); setAnchor(null); })}
    </div>
  );
}

function PicrossPlay({ trail, rule, send }: { trail: Extract<FeiraTrail, { game: 'picross' }>; rule: ReactElement; send: Send }) {
  const { size, rows, cols } = trail.puzzle;
  const fresh = () => Array.from({ length: size }, () => Array.from({ length: size }, () => EMPTY as CellMark));
  const [cells, setCells] = useState<CellMark[][]>(fresh);
  const ok = useMemo(() => matchesClues(cells, { rows, cols }), [cells, rows, cols]);
  const tap = (r: number, c: number) => setCells(g => g.map((row, ri) => (ri === r ? row.map((v, ci) => (ci === c ? ((v + 1) % 3) as CellMark : v)) : row)));
  const clueText = (l: number[]) => (l.length ? l.join(' ') : '0');
  return (
    <div data-trail-game="picross">
      {rule}
      <div style={{ display: 'grid', gridTemplateColumns: `auto repeat(${size}, ${CELL}px)`, gap: 3, justifyContent: 'center', alignItems: 'center' }}>
        <span />
        {cols.map((l, c) => <span key={`c${c}`} style={{ ...sm2Hint, textAlign: 'center', whiteSpace: 'pre-line', lineHeight: 1.1 }} data-picross-col={c}>{l.length ? l.join('\n') : '0'}</span>)}
        {cells.map((row, r) => (
          <PicrossRow key={r} r={r} row={row} clue={clueText(rows[r])} onTap={tap} />
        ))}
      </div>
      {send(ok, () => ({ cells: cells.map(row => row.map(v => (v === FILLED ? 1 : 0))) }), () => setCells(fresh()))}
    </div>
  );
}

function PicrossRow({ r, row, clue, onTap }: { r: number; row: CellMark[]; clue: string; onTap: (r: number, c: number) => void }) {
  return (
    <>
      <span style={{ ...sm2Hint, textAlign: 'right', paddingRight: 4 }} data-picross-row={r}>{clue}</span>
      {row.map((v, c) => (
        <button key={c} type="button" style={cellStyle(v === FILLED)} onClick={() => onTap(r, c)} aria-label={`${r + 1},${c + 1}`} aria-pressed={v === FILLED} data-picross-cell={`${r}-${c}`}>{v === CROSSED ? '×' : ''}</button>
      ))}
    </>
  );
}

function TrocaPlay({ trail, rule, send, t }: { trail: Extract<FeiraTrail, { game: 'troca' }>; rule: ReactElement; send: Send; t: T }) {
  const { deck } = trail.puzzle;
  const [sides, setSides] = useState<TrocaSide[]>([]);
  const card = deck[sides.length];
  const answer = (s: TrocaSide) => setSides(a => (a.length < deck.length ? [...a, s] : a));
  return (
    <div data-trail-game="troca">
      {rule}
      {card ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ ...sm2Hint, margin: '0 0 8px' }} data-troca-rule={card.rule}>{t(card.rule === 'forma' ? 'game.troca.forma' : 'game.troca.lugar')}</p>
          <div style={{ ...sm2Text, margin: '8px auto 12px', padding: 16, border: '1px solid var(--sm2-line)', borderRadius: 12, maxWidth: 240, background: 'var(--sm2-surface)' }} data-troca-card={sides.length}>
            <strong>{t(card.forma === 'young' ? 'game.troca.young' : 'game.troca.grown')}</strong> · {t(card.lugar === 'sky' ? 'game.troca.sky' : 'game.troca.cave')}
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button type="button" style={{ ...sm2Button('outline'), minWidth: 110 }} onClick={() => answer('left')} data-troca-left>{t('game.left')}</button>
            <button type="button" style={{ ...sm2Button('outline'), minWidth: 110 }} onClick={() => answer('right')} data-troca-right>{t('game.right')}</button>
          </div>
        </div>
      ) : null}
      {send(sides.length === deck.length, () => ({ sides }), () => setSides([]))}
    </div>
  );
}

/** Exposto para teste: o lado certo de cada carta sob a regra dela. */
export const trocaGabarito = (deck: Extract<FeiraTrail, { game: 'troca' }>['puzzle']['deck']): TrocaSide[] => deck.map(c => sideFor(c, c.rule));

function EcoPlay({ trail, rule, send, t }: { trail: Extract<FeiraTrail, { game: 'eco' }>; rule: ReactElement; send: Send; t: T }) {
  const par = trail.puzzle.par;
  const rng = useRef(seededRng(trail.seed || 1));
  const [seq, setSeq] = useState<Stone[]>(() => startSequence(rng.current));
  const [phase, setPhase] = useState<'show' | 'input'>('show');
  const [lit, setLit] = useState<Stone | null>(null);
  const [input, setInput] = useState<Stone[]>([]);
  const [best, setBest] = useState(0);
  const [slip, setSlip] = useState(false);
  useEffect(() => {
    if (phase !== 'show') return undefined;
    let i = 0;
    let off: ReturnType<typeof setTimeout> | undefined;
    const gap = playbackIntervalMs(seq.length);
    const id = setInterval(() => {
      if (i >= seq.length) { clearInterval(id); setLit(null); setPhase('input'); return; }
      setLit(seq[i]);
      off = setTimeout(() => setLit(null), Math.max(120, gap - 160));
      i++;
    }, gap);
    return () => { clearInterval(id); if (off) clearTimeout(off); };
  }, [phase, seq]);
  const tap = (s: Stone) => {
    if (phase !== 'input') return;
    const r = checkTap(seq, input, s, false);
    if (r === 'miss') { setSlip(true); setInput([]); setSeq(startSequence(rng.current)); setPhase('show'); return; }
    if (r === 'continue') { setInput(a => [...a, s]); return; }
    setSlip(false);
    setBest(b => Math.max(b, seq.length));
    setInput([]);
    setSeq(growSequence(seq, rng.current));
    setPhase('show');
  };
  return (
    <div data-trail-game="eco">
      {rule}
      <p style={{ ...sm2Hint, textAlign: 'center', margin: '0 0 8px' }} data-eco-phase={phase}>{slip && phase === 'show' ? t('game.eco.retry') : phase === 'show' ? t('game.eco.watch') : t('game.eco.repeat')}</p>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        {Array.from({ length: ECO_STONES }, (_, i) => i as Stone).map(s => (
          <button key={s} type="button" disabled={phase !== 'input'} aria-disabled={phase !== 'input' ? true : undefined} onClick={() => tap(s)}
            style={{ ...cellStyle(lit === s), width: 72, height: 56, fontSize: 13 }} data-eco-stone={s}>{t(`game.eco.stone.${s}` as Parameters<typeof feiraText>[1])}</button>
        ))}
      </div>
      {send(best >= par, () => ({ score: best }))}
    </div>
  );
}
