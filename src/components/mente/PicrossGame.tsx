import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { EarningGameProps } from './types';
import { sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { GameRoot, GameHeader, GameVisor, phaseTitle, phaseLine } from '../games/GameKit';
import { Icon } from '../ui/Icon';
import { readLocal, writeLocal } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { PICROSS_PATTERNS, type PicrossPattern } from '../../utils/mente/picrossPatterns';
import {
  CROSSED, EMPTY, FILLED, cluesOf, dailyPattern, emptyBoard, lineClue, matchesClues,
  parsePattern, picrossBits, type CellMark,
} from '../../utils/mente/picross';

/**
 * PICROSS DA MALHA (benchmark §6.5) — nonograma: as pistas de cada linha e
 * coluna dizem os blocos pintados; resolver revela um desenho no visor.
 *
 * Um desenho do dia (o mesmo para todo mundo, pela chave do dia) e os outros
 * para rejogar em "Outros". Nada é gravado: o estado vive no componente.
 * Sem relógio, sem penalidade, sem contagem do que falta. Nasce MUDO.
 *
 * Alvos: 5×5 e 7×7 com casas de 44; 10×10 com 30 (a grade inteira cabe em
 * 348 sem zoom). Pintar e marcar X existem como BOTÕES de modo (acessível);
 * o toque longo marca X como atalho.
 */

/** Toque longo que marca X (ms). */
const LONG_PRESS_MS = 450;
/** Largura máxima da grade com as pistas (px) — a do visor. */
const GRID_MAX_W = 348;

type Mode = 'fill' | 'cross';

const cellSizeFor = (n: number) => (n <= 7 ? 44 : 30);
const clueColFor = (n: number) => GRID_MAX_W - n * cellSizeFor(n);

export function PicrossGame({ language, onEarnPoints, onExit, todayKey }: EarningGameProps & { todayKey: string }) {
  const isPt = language === 'pt-BR';
  const daily = useMemo(() => dailyPattern(todayKey), [todayKey]);

  const [pattern, setPattern] = useState<PicrossPattern>(daily);
  const [board, setBoard] = useState<CellMark[][]>(() => emptyBoard(daily));
  const [history, setHistory] = useState<CellMark[][][]>([]);
  const [mode, setMode] = useState<Mode>('fill');
  const [solved, setSolved] = useState(false);
  const [earned, setEarned] = useState(0);
  const [picking, setPicking] = useState(false);
  const [focus, setFocus] = useState<[number, number]>([0, 0]);
  // Desenhos resolvidos NESTA visita (não persiste) e se o do dia já pagou.
  const [done, setDone] = useState<Set<string>>(() => new Set());
  const dailyPaid = useRef(false);

  const boardRef = useRef(board);
  boardRef.current = board;
  const solvedRef = useRef(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longFired = useRef(false);
  const gridRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => { if (pressTimer.current) clearTimeout(pressTimer.current); }, []);

  const clues = useMemo(() => cluesOf(parsePattern(pattern.rows)), [pattern]);
  const n = pattern.rows.length;
  const cell = cellSizeFor(n);
  const clueW = clueColFor(n);
  const isDaily = pattern.id === daily.id;

  const load = (p: PicrossPattern) => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    const b = emptyBoard(p);
    boardRef.current = b;
    solvedRef.current = false;
    setPattern(p); setBoard(b); setHistory([]);
    setSolved(false); setEarned(0); setMode('fill'); setFocus([0, 0]); setPicking(false);
  };

  // Aplica uma nova grade: guarda a anterior no desfazer e confere a solução
  // (pagamento fora de updater — footgun 6).
  const commit = (next: CellMark[][]) => {
    if (solvedRef.current) return;
    const prev = boardRef.current;
    boardRef.current = next;
    setHistory(h => [...h, prev]);
    setBoard(next);
    if (matchesClues(next, clues)) {
      solvedRef.current = true;
      // O bônus do dia vale UMA vez por dia do jogador: o ref cobre a tela
      // aberta e a chave local cobre sair e voltar (sem ela, reabrir o jogo
      // repagava o bônus). O teto diário de Bits segue sendo do funil do App.
      const payDaily = isDaily && !dailyPaid.current && readLocal(STORAGE_KEYS.PICROSS_DAILY_PAID) !== todayKey;
      if (payDaily) { dailyPaid.current = true; writeLocal(STORAGE_KEYS.PICROSS_DAILY_PAID, todayKey); }
      const bits = picrossBits(n, payDaily);
      setSolved(true);
      setEarned(bits);
      setDone(s => new Set(s).add(pattern.id));
      onEarnPoints(bits);
    }
  };

  const setCell = (r: number, c: number, as: Mode) => {
    if (solvedRef.current) return;
    const cur = boardRef.current[r][c];
    const v: CellMark = as === 'fill'
      ? (cur === FILLED ? EMPTY : FILLED)
      : (cur === CROSSED ? EMPTY : CROSSED);
    const next = boardRef.current.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row));
    commit(next);
  };

  const undo = () => {
    if (solvedRef.current || history.length === 0) return;
    const prev = history[history.length - 1];
    boardRef.current = prev;
    setBoard(prev);
    setHistory(h => h.slice(0, -1));
  };

  const clear = () => {
    if (solvedRef.current) return;
    if (boardRef.current.every(r => r.every(v => v === EMPTY))) return;
    commit(emptyBoard(pattern));
  };

  // Toque longo = marcar X (atalho; o botão de modo é o caminho acessível).
  const onDown = (r: number, c: number) => {
    longFired.current = false;
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = setTimeout(() => {
      longFired.current = true;
      setCell(r, c, 'cross');
    }, LONG_PRESS_MS);
  };
  const cancelPress = () => { if (pressTimer.current) { clearTimeout(pressTimer.current); pressTimer.current = null; } };
  const onCellClick = (r: number, c: number) => {
    cancelPress();
    setFocus([r, c]);
    if (longFired.current) { longFired.current = false; return; }
    setCell(r, c, mode);
  };

  // Setas movem o foco (tabindex itinerante: um Tab entra, um Tab sai).
  const onGridKey = (e: ReactKeyboardEvent) => {
    const [r, c] = focus;
    let nr = r; let nc = c;
    if (e.key === 'ArrowUp') nr = Math.max(0, r - 1);
    else if (e.key === 'ArrowDown') nr = Math.min(n - 1, r + 1);
    else if (e.key === 'ArrowLeft') nc = Math.max(0, c - 1);
    else if (e.key === 'ArrowRight') nc = Math.min(n - 1, c + 1);
    else return;
    e.preventDefault();
    setFocus([nr, nc]);
    const el = gridRef.current?.querySelector<HTMLButtonElement>(`[data-cell="${nr}-${nc}"]`);
    el?.focus();
  };

  const stateWord = (v: CellMark) => v === FILLED
    ? (isPt ? 'pintada' : 'filled')
    : v === CROSSED ? (isPt ? 'marcada com X' : 'marked X') : (isPt ? 'vazia' : 'empty');

  const lineDone = (line: CellMark[], clue: number[]) => {
    const got = lineClue(line.map(v => v === FILLED));
    return got.length === clue.length && got.every((v, i) => v === clue[i]);
  };

  const clueText: CSSProperties = {
    fontFamily: 'var(--sm2-font-text)', fontSize: 'var(--sm2-text-xs)', lineHeight: 1.15,
    fontVariantNumeric: 'tabular-nums',
  };
  // Linha grossa a cada 5 casas nas grades 10×10 (leitura por blocos).
  const sep = (i: number) => (n === 10 && i === 4 ? 2 : 0);

  const cellStyle = (v: CellMark, r: number, c: number): CSSProperties => ({
    width: cell, height: cell, padding: 0, margin: 0, boxSizing: 'border-box',
    border: '1px solid var(--sm2-line)',
    borderRightWidth: 1 + sep(c), borderBottomWidth: 1 + sep(r),
    borderRadius: 0, cursor: 'pointer',
    backgroundColor: v === FILLED ? 'var(--sm2-primary-fill)' : 'var(--sm2-surface)',
    // X = duas diagonais desenhadas no fundo (marca, não ícone em caixa).
    backgroundImage: v === CROSSED
      ? 'linear-gradient(45deg, transparent 44%, var(--sm2-muted) 44% 56%, transparent 56%), linear-gradient(-45deg, transparent 44%, var(--sm2-muted) 44% 56%, transparent 56%)'
      : undefined,
    backgroundSize: v === CROSSED ? '60% 60%' : undefined,
    backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
    touchAction: 'manipulation', WebkitUserSelect: 'none', userSelect: 'none',
  });

  const modeBtn = (m: Mode, label: string) => (
    <button
      type="button"
      aria-pressed={mode === m}
      onClick={() => setMode(m)}
      data-picross-mode={m}
      style={{ ...sm2Button(mode === m ? 'primary' : 'outline'), flex: 1, minWidth: 0, padding: '0 8px' }}
    >
      {label}
    </button>
  );

  // O desenho revelado em pixel dentro do visor (348×160).
  const px = Math.floor(144 / n);
  const picture = (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)',
        display: 'grid', gridTemplateColumns: `repeat(${n}, ${px}px)`, gridAutoRows: `${px}px`,
      }}
    >
      {pattern.rows.flatMap((row, r) => Array.from(row, (ch, c) => (
        <span key={`${r}-${c}`} style={{ backgroundColor: ch === '#' ? 'var(--sm2-viewport-ink)' : 'transparent' }} />
      )))}
    </div>
  );

  const nameOf = (p: PicrossPattern) => (isPt ? p.namePt : p.nameEn);

  // "Outros": por tamanho; nome só aparece para o que já foi revelado.
  const picker = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} data-picross-picker>
      {[5, 7, 10].map(size => {
        const list = PICROSS_PATTERNS.filter(p => p.rows.length === size);
        return (
          <div key={size} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <p style={{ ...sm2Text, margin: 0, fontWeight: 500 }}>{`${size}×${size}`}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {list.map((p, i) => {
                const seen = done.has(p.id);
                const label = p.id === daily.id
                  ? (isPt ? 'Do dia' : "Today's")
                  : seen ? nameOf(p) : `${isPt ? 'Desenho' : 'Picture'} ${i + 1}`;
                return (
                  <button
                    key={p.id}
                    type="button"
                    data-picross-pick={p.id}
                    onClick={() => load(p)}
                    style={{ ...sm2Button('outline', false, 'sm'), minHeight: 44, padding: '0 12px', gap: 6 }}
                  >
                    {seen && <Icon name="check" size={20} tone="primary" />}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {/* I3 (01/10/2026): o "Voltar" de baixo saiu — é a seta do `GameHeader`. */}
    </div>
  );

  return (
    <GameRoot>
      <GameHeader
        title={isPt ? 'Nonograma da Malha' : 'Mesh Nonogram'}
        sub={isDaily
          ? (isPt ? `Desenho do dia · ${n}×${n}` : `Today's picture · ${n}×${n}`)
          : (isPt ? `Outro desenho · ${n}×${n}` : `Another picture · ${n}×${n}`)}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
        onBack={picking ? () => setPicking(false) : undefined}
        backLabel={isPt ? 'Voltar ao desenho' : 'Back to the picture'}
        language={language}
        infoLabel={isPt ? 'Como se joga' : 'How to play'}
        info={isPt
          ? 'Os números dizem os blocos pintados de cada linha e coluna, em ordem.'
          : 'The numbers give the filled runs of each row and column, in order.'}
      />

      {picking ? picker : solved ? (
        <>
          <GameVisor
            height={80}
            label={isPt ? `Você revelou: ${pattern.namePt}` : `You revealed: ${pattern.nameEn}`}
          >
            {picture}
          </GameVisor>
          <p role="status" style={phaseTitle} data-picross-solved>
            {isPt ? `Você revelou: ${pattern.namePt}` : `You revealed: ${pattern.nameEn}`}
          </p>
          <p style={phaseLine}>{`+${earned} Bits`}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={() => setPicking(true)} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Outros' : 'More'}
            </button>
            <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Sair' : 'Exit'}
            </button>
          </div>
        </>
      ) : (
        <>

          <div style={{ display: 'flex', gap: 8 }}>
            {modeBtn('fill', isPt ? 'Pintar' : 'Fill')}
            {modeBtn('cross', isPt ? 'Marcar X' : 'Mark X')}
          </div>

          {/* A grade com as pistas: coluna de pistas à esquerda, linha em cima. */}
          <div style={{ alignSelf: 'center', width: GRID_MAX_W, flex: 'none' }}>
            <div style={{ display: 'flex' }}>
              <div style={{ width: clueW, flex: 'none' }} />
              {clues.cols.map((cl, c) => (
                <div
                  key={c}
                  aria-hidden="true"
                  style={{
                    ...clueText, width: cell, flex: 'none', boxSizing: 'border-box',
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center',
                    paddingBottom: 4, gap: 1,
                    color: lineDone(board.map(row => row[c]), cl) ? 'var(--sm2-muted)' : 'var(--sm2-ink)',
                  }}
                >
                  {(cl.length ? cl : [0]).map((v, i) => <span key={i}>{v}</span>)}
                </div>
              ))}
            </div>
            <div
              ref={gridRef}
              role="group"
              aria-label={isPt ? `Grade ${n} por ${n}` : `${n} by ${n} grid`}
              onKeyDown={onGridKey}
            >
              {board.map((row, r) => (
                <div key={r} style={{ display: 'flex' }}>
                  <div
                    aria-hidden="true"
                    style={{
                      ...clueText, width: clueW, height: cell, flex: 'none', boxSizing: 'border-box',
                      display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 3, paddingRight: 3,
                      color: lineDone(row, clues.rows[r]) ? 'var(--sm2-muted)' : 'var(--sm2-ink)',
                    }}
                  >
                    {(clues.rows[r].length ? clues.rows[r] : [0]).map((v, i) => <span key={i}>{v}</span>)}
                  </div>
                  {row.map((v, c) => (
                    <button
                      key={c}
                      type="button"
                      data-cell={`${r}-${c}`}
                      data-state={v}
                      tabIndex={focus[0] === r && focus[1] === c ? 0 : -1}
                      aria-label={isPt
                        ? `Linha ${r + 1}, coluna ${c + 1}: ${stateWord(v)}. Pistas ${clues.rows[r].join(' ') || '0'} e ${clues.cols[c].join(' ') || '0'}`
                        : `Row ${r + 1}, column ${c + 1}: ${stateWord(v)}. Clues ${clues.rows[r].join(' ') || '0'} and ${clues.cols[c].join(' ') || '0'}`}
                      onPointerDown={() => onDown(r, c)}
                      onPointerUp={cancelPress}
                      onPointerLeave={cancelPress}
                      onPointerCancel={cancelPress}
                      onContextMenu={e => e.preventDefault()}
                      onClick={() => onCellClick(r, c)}
                      style={cellStyle(v, r, c)}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={undo}
              disabled={history.length === 0}
              data-picross-undo
              style={{ ...sm2Button('outline', history.length === 0), flex: 1, minWidth: 0, padding: '0 8px' }}
            >
              {isPt ? 'Desfazer' : 'Undo'}
            </button>
            <button type="button" onClick={clear} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Limpar' : 'Clear'}
            </button>
            <button type="button" onClick={() => setPicking(true)} style={{ ...sm2Button('ghost'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Outros' : 'More'}
            </button>
          </div>
          <p style={{ ...sm2Hint, textAlign: 'center' }}>
            {isPt ? 'Toque longo numa casa também marca X.' : 'A long press on a square also marks X.'}
          </p>
        </>
      )}
    </GameRoot>
  );
}

export default PicrossGame;
