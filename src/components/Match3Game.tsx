import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import type { EarningGameProps } from './mente/types';
import { sm2Button, sm2Text } from './form/FormKit';
import { GameRoot, GameHeader, StatTag, phaseTitle, phaseLine, gameExitConfirm } from './games/GameKit';
import { usePrefersReducedMotion } from './ui/Viewport';
import { elementIcon } from '../utils/elementIconArt';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { readNumber, writeLocal } from '../utils/safeStorage';
import {
  M3_COLS, M3_MOVES, M3_ROWS, M3_TILE_ELEMENTS, M3_TILE_NAMES, M3_POINTS_PER_BIT, M3_MAX_BITS,
  bestMove, match3Bits, newRound, trySwap, type Board, type Pos, type Rng, type Step, type Tile,
} from '../utils/match3';
import { mulberry32 } from '../utils/combate/rng';

/**
 * COMBINA 3 — o jogo de combinar peças do Salão de Jogos (pedido do dono, 11/10/2026, REGISTRO §36). Regras e conta em
 * `utils/match3.ts` (puro, com semente); aqui só a TELA: tocar/arrastar para trocar, a cascata animada passo a passo, o teclado.
 *
 * Peças: os ícones de ELEMENTO que já existem no repo (`utils/elementIconArt`) — nada de arte nova. Nasce MUDO (R-NOVA).
 * Troca que não forma linha volta e NÃO gasta movimento ("essa não forma linha — tente outra", sem vermelho nem "errou").
 * Os Bits saem UMA vez, no fim da rodada, pelo funil único do `App` (`onEarnPoints` → teto diário de minijogo).
 *
 * Acessível: tabuleiro `role="grid"` com foco rotativo (setas movem, Enter/Espaço seleciona e troca), nome acessível por peça
 * ("Fogo, linha 2, coluna 3"), avisos em `aria-live`, alvos ≥ 44 px na largura de um celular comum, formas distintas (ícones de
 * elemento: a cor nunca é a única pista). Movimento reduzido: sem deslize, tremida nem queda — só o estado novo, passo a passo.
 */

const SWIPE_PX = 22;
const T_SWAP = 170;
const T_CLEAR = 280;
const T_FALL = 240;
const HINT_MS = 2600;

const key = (p: Pos) => p.r * M3_COLS + p.c;
const same = (a: Pos | null, b: Pos | null) => !!a && !!b && a.r === b.r && a.c === b.c;
const adjacent = (a: Pos, b: Pos) => Math.abs(a.r - b.r) + Math.abs(a.c - b.c) === 1;

export interface Match3Props extends EarningGameProps {
  /** Semente da rodada (testes). Sem ela, sorteada ao abrir/reabrir. */
  seed?: number;
}

function freshSeed(): number { return Math.floor(Math.random() * 2 ** 31); }

export function Match3Game({ language, onEarnPoints, onExit, seed }: Match3Props) {
  const isPt = language === 'pt-BR';
  const reduced = usePrefersReducedMotion();
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;

  const first = useMemo(() => newRound(seed ?? freshSeed()), [seed]);
  const [board, setBoard] = useState<Board>(first.board);
  const boardRef = useRef(first.board);
  const rngRef = useRef<Rng>(first.rng);
  const [moves, setMoves] = useState(M3_MOVES);
  const movesRef = useRef(M3_MOVES);
  const [score, setScore] = useState(0);
  const scoreRef = useRef(0);
  const [sel, setSelState] = useState<Pos | null>(null);
  const selRef = useRef<Pos | null>(null);
  const setSel = useCallback((p: Pos | null) => { selRef.current = p; setSelState(p); }, []);
  const [cursor, setCursor] = useState<Pos>({ r: 0, c: 0 });
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [clearing, setClearing] = useState<ReadonlySet<number>>(new Set());
  const [fresh, setFresh] = useState<{ id: number; cells: ReadonlySet<number> }>({ id: 0, cells: new Set() });
  const [shake, setShake] = useState<{ id: number; cells: ReadonlySet<number> }>({ id: 0, cells: new Set() });
  const [hint, setHint] = useState<{ a: Pos; b: Pos } | null>(null);
  const [chain, setChain] = useState(0);
  const [note, setNote] = useState('');
  const [over, setOver] = useState(false);
  const [earned, setEarned] = useState(0);
  const [best, setBest] = useState(() => readNumber(STORAGE_KEYS.MATCH3_BEST, 0));
  const [newBest, setNewBest] = useState(false);

  const alive = useRef(true);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const overRef = useRef(false);
  const btnRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const swipe = useRef<{ x: number; y: number; pos: Pos } | null>(null);
  const swiped = useRef(false);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintRng = useRef(mulberry32(7));

  useEffect(() => {
    alive.current = true;
    const t = timers.current;
    return () => { alive.current = false; t.forEach(clearTimeout); t.clear(); if (hintTimer.current) clearTimeout(hintTimer.current); };
  }, []);

  /** Espera `ms` (0 em movimento reduzido); some se a tela saiu. */
  const wait = useCallback((ms: number) => new Promise<void>(resolve => {
    const id = setTimeout(() => { timers.current.delete(id); resolve(); }, reducedRef.current ? 0 : ms);
    timers.current.add(id);
  }), []);

  // Fecha a rodada UMA vez e paga UMA vez (fora de updater — footgun 6).
  const finish = useCallback(() => {
    if (overRef.current) return;
    overRef.current = true;
    const final = scoreRef.current;
    const bits = match3Bits(final);
    setEarned(bits);
    const prevBest = readNumber(STORAGE_KEYS.MATCH3_BEST, 0);
    if (final > prevBest) { writeLocal(STORAGE_KEYS.MATCH3_BEST, String(final)); setBest(final); setNewBest(prevBest > 0); }
    setOver(true);
    if (bits > 0) onEarnPoints(bits);
  }, [onEarnPoints]);

  const say = useCallback((pt: string, en: string) => setNote(isPt ? pt : en), [isPt]);

  const clearHint = useCallback(() => {
    if (hintTimer.current) clearTimeout(hintTimer.current);
    setHint(null);
  }, []);

  /** O que cai: as colunas dos que sumiram, de cima até a linha mais baixa que sumiu (peça nova ou que desceu). */
  const dropCells = (st: Step): Set<number> => {
    const out = new Set<number>();
    const low = new Map<number, number>();
    for (const p of st.cleared) low.set(p.c, Math.max(low.get(p.c) ?? -1, p.r));
    low.forEach((r, c) => { for (let i = 0; i <= r; i++) out.add(i * M3_COLS + c); });
    return out;
  };

  const play = useCallback(async (a: Pos, d: Pos) => {
    if (busyRef.current || overRef.current || movesRef.current <= 0) return;
    clearHint();
    const res = trySwap(boardRef.current, a, d, rngRef.current);
    if (!res.ok) {
      setSel(null);
      if (res.reason === 'nomatch') {
        setShake(s => ({ id: s.id + 1, cells: new Set([key(a), key(d)]) }));
        say('Essa troca não forma linha — tente outra.', "That swap doesn't make a line — try another.");
      }
      return;
    }
    busyRef.current = true;
    setBusy(true);
    setSel(null);
    movesRef.current -= 1;
    setMoves(movesRef.current);
    say('', '');
    setBoard(res.swapped);
    await wait(T_SWAP);
    for (const st of res.steps) {
      if (!alive.current) return;
      setClearing(new Set(st.cleared.map(key)));
      setChain(st.chain);
      await wait(T_CLEAR);
      if (!alive.current) return;
      setClearing(new Set());
      boardRef.current = st.after;
      setBoard(st.after);
      scoreRef.current += st.gained;
      setScore(scoreRef.current);
      setFresh(f => ({ id: f.id + 1, cells: dropCells(st) }));
      await wait(T_FALL);
    }
    if (!alive.current) return;
    boardRef.current = res.board;
    setBoard(res.board);
    setChain(0);
    if (res.reshuffled) {
      setFresh(f => ({ id: f.id + 1, cells: new Set(Array.from({ length: M3_ROWS * M3_COLS }, (_, i) => i)) }));
      say('Sem jogadas: embaralhei as peças para você.', 'No moves left: I shuffled the tiles for you.');
    }
    busyRef.current = false;
    setBusy(false);
    if (movesRef.current <= 0) finish();
  }, [clearHint, finish, say, setSel, wait]);

  const pick = useCallback((p: Pos) => {
    if (busyRef.current || overRef.current) return;
    setCursor(p);
    const cur = selRef.current;
    if (!cur) { setSel(p); return; }
    if (same(cur, p)) { setSel(null); return; }
    if (adjacent(cur, p)) { setSel(null); void play(cur, p); return; }
    setSel(p);
  }, [play, setSel]);

  const onKey = (e: ReactKeyboardEvent) => {
    const d: Record<string, [number, number]> = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] };
    if (d[e.key]) {
      e.preventDefault();
      const n = { r: Math.min(M3_ROWS - 1, Math.max(0, cursor.r + d[e.key][0])), c: Math.min(M3_COLS - 1, Math.max(0, cursor.c + d[e.key][1])) };
      setCursor(n);
      btnRefs.current[key(n)]?.focus();
    } else if (e.key === 'Escape') {
      setSel(null);
    }
  };

  const onPointerDown = (e: ReactPointerEvent, pos: Pos) => { swipe.current = { x: e.clientX, y: e.clientY, pos }; swiped.current = false; };
  const onPointerUp = (e: ReactPointerEvent) => {
    const s = swipe.current;
    swipe.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_PX) return;
    swiped.current = true;
    const to: Pos = Math.abs(dx) > Math.abs(dy)
      ? { r: s.pos.r, c: s.pos.c + (dx > 0 ? 1 : -1) }
      : { r: s.pos.r + (dy > 0 ? 1 : -1), c: s.pos.c };
    setCursor(s.pos);
    void play(s.pos, to);
  };

  const showHint = () => {
    if (busyRef.current || overRef.current) return;
    const m = bestMove(boardRef.current, hintRng.current);
    if (!m) return;
    setSel(null);
    setHint({ a: m.a, b: m.b });
    say('Dica: troque as duas peças marcadas.', 'Hint: swap the two marked tiles.');
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHint(null), HINT_MS);
  };

  const restart = () => {
    timers.current.forEach(clearTimeout);
    timers.current.clear();
    const r = newRound(seed === undefined ? freshSeed() : seed + 1);
    boardRef.current = r.board;
    rngRef.current = r.rng;
    movesRef.current = M3_MOVES;
    scoreRef.current = 0;
    overRef.current = false;
    busyRef.current = false;
    setBoard(r.board); setMoves(M3_MOVES); setScore(0); setSel(null); setCursor({ r: 0, c: 0 });
    setBusy(false); setClearing(new Set()); setHint(null); setChain(0); setNote(''); setOver(false); setEarned(0); setNewBest(false);
  };

  const nextBitAt = (Math.floor(score / M3_POINTS_PER_BIT) + 1) * M3_POINTS_PER_BIT;
  const bitsNow = match3Bits(score);

  const cellLabel = (t: Tile, r: number, c: number) => {
    const nome = M3_TILE_NAMES[t.k];
    const esp = t.sp === 'row' ? (isPt ? ', limpa a linha' : ', clears the row') : t.sp === 'col' ? (isPt ? ', limpa a coluna' : ', clears the column') : '';
    return isPt ? `${nome.pt}${esp}, linha ${r + 1}, coluna ${c + 1}` : `${nome.en}${esp}, row ${r + 1}, column ${c + 1}`;
  };

  const boardStyle: CSSProperties = {
    display: 'grid', gridTemplateColumns: `repeat(${M3_COLS}, minmax(0, 1fr))`, gap: 4, padding: 6, boxSizing: 'border-box',
    width: '100%', maxWidth: 360, alignSelf: 'center', touchAction: 'none', userSelect: 'none',
    backgroundColor: 'var(--sm2-surface-2)', border: '1px solid var(--sm2-line)', borderRadius: 'var(--sm2-radius-md)',
  };

  return (
    <GameRoot>
      <GameHeader
        title={isPt ? 'Combina 3' : 'Match 3'}
        language={language}
        infoLabel={isPt ? 'Como se joga' : 'How to play'}
        info={(
          <>
            <span style={{ display: 'block' }}>{isPt ? `Troque duas peças vizinhas para formar uma linha de 3 ou mais iguais. Você tem ${M3_MOVES} movimentos.` : `Swap two neighbouring tiles to line up 3 or more alike. You have ${M3_MOVES} moves.`}</span>
            <span style={{ display: 'block', marginTop: 6 }}>{isPt ? 'Uma linha de 4 deixa uma peça com setas: quando ela entra numa combinação, limpa a linha (ou a coluna) inteira.' : 'A line of 4 leaves a tile with arrows: when it joins a match, it clears its whole row (or column).'}</span>
            <span style={{ display: 'block', marginTop: 6 }}>{isPt ? 'Toque numa peça e depois numa vizinha, ou arraste. Teclado: setas e Enter.' : 'Tap a tile, then a neighbour, or swipe. Keyboard: arrows and Enter.'}</span>
            <span style={{ display: 'block', marginTop: 6 }}>{isPt ? `Cada ${M3_POINTS_PER_BIT} pontos viram 1 Bit, até ${M3_MAX_BITS}.` : `Every ${M3_POINTS_PER_BIT} points becomes 1 Bit, up to ${M3_MAX_BITS}.`}</span>
          </>
        )}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
        exitConfirm={over ? undefined : gameExitConfirm(isPt, 'da rodada')}
      />

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
        <StatTag label={isPt ? 'Movimentos' : 'Moves'} value={<span data-m3-moves={moves}>{moves}</span>} />
        <StatTag label={isPt ? 'Pontos' : 'Score'} value={<span data-m3-score={score}>{score}</span>} />
        <StatTag label="Bits" value={<span data-m3-bits={bitsNow}>{bitsNow}</span>} />
      </div>

      {/* o aviso vivo: troca sem linha, dica, embaralhada. Sem vermelho; fica fora da área do tabuleiro. */}
      <p role="status" aria-live="polite" data-m3-note style={{ ...phaseLine, minHeight: 20, margin: 0 }}>
        {note || (chain > 1 ? (isPt ? `Cascata ×${chain}!` : `Cascade ×${chain}!`) : '')}
      </p>

      {over ? (
        <>
          <p role="status" style={phaseTitle} data-m3-end>
            {isPt ? `Você fez ${score} pontos` : `You scored ${score} points`}
          </p>
          <p style={phaseLine}>
            {earned > 0 ? `+${earned} Bits` : (isPt ? 'Rodada leve, sem Bits desta vez.' : 'A light round, no Bits this time.')}
          </p>
          <p className="sm2-num" style={phaseLine}>
            {isPt ? `Seu recorde: ${best}` : `Your best: ${best}`}{newBest ? (isPt ? ' · novo recorde' : ' · new best') : ''}
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={restart} data-m3-again style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'De novo' : 'Again'}
            </button>
            <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Sair' : 'Exit'}
            </button>
          </div>
        </>
      ) : (
        <>
          <div
            role="grid"
            aria-label={isPt ? 'Tabuleiro do Combina 3' : 'Match 3 board'}
            aria-rowcount={M3_ROWS}
            aria-colcount={M3_COLS}
            aria-busy={busy}
            data-m3-board
            onKeyDown={onKey}
            style={boardStyle}
          >
            {board.map((row, r) => row.map((t, c) => {
              const p = { r, c };
              const k = key(p);
              const isSel = same(sel, p);
              const isHint = !!hint && (same(hint.a, p) || same(hint.b, p));
              return (
                <div key={k} role="gridcell" aria-colindex={c + 1} aria-rowindex={r + 1} aria-selected={isSel} style={{ display: 'contents' }}>
                  <TileButton
                    ref={el => { btnRefs.current[k] = el; }}
                    tile={t}
                    label={t ? cellLabel(t, r, c) : ''}
                    pos={p}
                    focusable={same(cursor, p)}
                    selected={isSel}
                    hint={isHint}
                    clearing={clearing.has(k)}
                    fresh={fresh.cells.has(k) ? fresh.id : 0}
                    shake={shake.cells.has(k) ? shake.id : 0}
                    reduced={reduced}
                    disabled={busy}
                    onPick={() => { if (swiped.current) { swiped.current = false; return; } pick(p); }}
                    onPointerDown={e => onPointerDown(e, p)}
                    onPointerUp={onPointerUp}
                  />
                </div>
              );
            }))}
          </div>

          <p style={{ ...phaseLine, margin: 0 }} data-m3-next>
            {bitsNow >= M3_MAX_BITS
              ? (isPt ? 'Você chegou ao máximo de Bits desta rodada.' : 'You reached the Bits maximum for this round.')
              : (isPt ? `Próximo Bit com ${nextBitAt} pontos.` : `Next Bit at ${nextBitAt} points.`)}
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={showHint} disabled={busy} data-m3-hint-button style={{ ...sm2Button('outline', busy), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Dica' : 'Hint'}
            </button>
          </div>
        </>
      )}
    </GameRoot>
  );
}

// ── uma peça ───────────────────────────────────────────────────────────────────────────────────────────────────────────


interface TileButtonProps {
  tile: Tile | null; label: string; pos: Pos; focusable: boolean; selected: boolean; hint: boolean; clearing: boolean;
  fresh: number; shake: number; reduced: boolean; disabled: boolean;
  onPick: () => void; onPointerDown: (e: ReactPointerEvent) => void; onPointerUp: (e: ReactPointerEvent) => void;
}

const TileButton = forwardRef<HTMLButtonElement, TileButtonProps>(function TileButton(
  { tile, label, pos, focusable, selected, hint, clearing, fresh, shake, reduced, disabled, onPick, onPointerDown, onPointerUp }, ref,
) {
  const inner = useRef<HTMLButtonElement | null>(null);
  const setRefs = (el: HTMLButtonElement | null) => {
    inner.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) (ref as { current: HTMLButtonElement | null }).current = el;
  };
  // queda das peças novas e tremida da troca inválida: Web Animations (sem CSS novo); movimento reduzido ou jsdom: nada.
  useEffect(() => {
    const el = inner.current;
    if (!fresh || reduced || !el || typeof el.animate !== 'function') return;
    el.animate([{ transform: 'translateY(-26px)', opacity: 0.25 }, { transform: 'translateY(0)', opacity: 1 }], { duration: 220, easing: 'ease-out' });
  }, [fresh, reduced]);
  useEffect(() => {
    const el = inner.current;
    if (!shake || reduced || !el || typeof el.animate !== 'function') return;
    el.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-4px)' }, { transform: 'translateX(4px)' }, { transform: 'translateX(0)' }], { duration: 200 });
  }, [shake, reduced]);

  if (!tile) return <span aria-hidden="true" style={{ aspectRatio: '1 / 1' }} />;
  const art = elementIcon(M3_TILE_ELEMENTS[tile.k]);
  const st: CSSProperties = {
    ...sm2Text, position: 'relative', aspectRatio: '1 / 1', minWidth: 0, minHeight: 0, padding: 2, boxSizing: 'border-box', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    backgroundColor: selected ? 'var(--sm2-primary-fill)' : 'var(--sm2-surface)',
    border: `2px solid ${selected ? 'var(--sm2-primary-ink)' : hint ? 'var(--sm2-gold-ink)' : tile.sp ? 'var(--sm2-gold-ink)' : 'var(--sm2-line)'}`,
    borderRadius: 8,
    boxShadow: hint ? '0 0 0 3px var(--sm2-gold-fill)' : undefined,
    opacity: clearing ? 0 : 1,
    transform: clearing && !reduced ? 'scale(0.55)' : 'none',
    transition: reduced ? 'none' : 'opacity 240ms var(--sm2-ease), transform 240ms var(--sm2-ease)',
    touchAction: 'none',
  };
  return (
    <button
      ref={setRefs}
      type="button"
      tabIndex={focusable ? 0 : -1}
      aria-label={label}
      aria-pressed={selected}
      disabled={disabled}
      data-m3-cell={`${pos.r},${pos.c}`}
      data-m3-kind={tile.k}
      data-m3-special={tile.sp ?? ''}
      data-m3-selected={selected ? '1' : '0'}
      data-m3-hint={hint ? '1' : '0'}
      onClick={onPick}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      style={st}
    >
      {art && <img src={art} alt="" aria-hidden="true" draggable={false} style={{ width: '82%', height: '82%', objectFit: 'contain', imageRendering: 'pixelated', pointerEvents: 'none' }} />}
      {tile.sp && (
        // a especial: setas na direção que limpa (a forma, não só a cor, diz o que ela faz)
        <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="55%" height="55%" style={{ position: 'absolute', pointerEvents: 'none', color: 'var(--sm2-gold-ink)', opacity: 0.95 }}>
          {tile.sp === 'row'
            ? <path d="M2 12 L8 7 V10 H16 V7 L22 12 L16 17 V14 H8 V17 Z" fill="currentColor" stroke="var(--sm2-surface)" strokeWidth="1" />
            : <path d="M12 2 L17 8 H14 V16 H17 L12 22 L7 16 H10 V8 H7 Z" fill="currentColor" stroke="var(--sm2-surface)" strokeWidth="1" />}
        </svg>
      )}
    </button>
  );
});

export default Match3Game;
