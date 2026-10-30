import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { MindTutorialScreen, MindTutorialLink, useMindTutorial } from './MindTutorial';
import type { EarningGameProps } from './types';
import { sm2Button, sm2Hint } from '../form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, phaseTitle, phaseLine, gameExitConfirm } from '../games/GameKit';
import { BitsAmount } from '../ui/BitsAmount';
import { RankingPanel } from '../RankingPanel';
import { ResultScreen, formatResultTime } from '../games/ResultScreen';
import { TIME_RANK_SIZE } from '../../utils/rankings';
import { usePrefersReducedMotion } from '../ui/Viewport';
import { getSpriteForStage } from '../../utils/sprites';
import { petScaleStyle } from '../../utils/spriteScale';
import { ATELIE_SCENE_SUAVE, MINI_FX } from '../../utils/visorScenes';
import {
  areAdjacent, canStep, validateZip, zipBits, zipForLevel, ZIP_MAX_BITS, type ZipPuzzle,
} from '../../utils/mente/zip';
/* Rodada 4 (N2): o porte reduzido por estágio vale só na Home e nos combates; no minigame o bicho tem o tamanho cheio. */
const PET_SCALE_MINIGAME = 1;

/**
 * TRILHA DO PET (id `zip`) — um caminho só, de 1 até o último número, que
 * passa por TODAS as casas. A regra é de `utils/mente/zip.ts`; aqui só tela.
 *
 * Arraste pela grade (ou toque numa casa vizinha da ponta); tocar numa casa
 * do caminho volta até ela. Sem relógio, sem penalidade. Nasce MUDO.
 * A ponta do caminho é o pet; os números são as pedras do Eco.
 */

const GRID_MAX_W = 348;

export function ZipGame({ language, evolutionStage, demoCharacterId, onEarnPoints, onExit, rankSaveId, challenge, tutorial }: EarningGameProps) {
  const isPt = language === 'pt-BR';
  const tut = useMindTutorial(tutorial);
  const reduced = usePrefersReducedMotion();
  const [level, setLevel] = useState(1);
  const [puzzle, setPuzzle] = useState<ZipPuzzle>(() => zipForLevel(1, Math.random));
  const [path, setPath] = useState<number[]>([]);
  const [solved, setSolved] = useState(false);
  const [earned, setEarned] = useState(0);
  const [started, setStarted] = useState(false);
  const drag = useRef(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const paid = useRef(false);
  /** Relógio do ranking semanal por TEMPO (decisão do dono 5): da 1ª jogada à trilha completa; reinicia a cada trilha nova. */
  const t0 = useRef<number | null>(null);
  const [solveMs, setSolveMs] = useState(0);

  const pet = getSpriteForStage(evolutionStage, demoCharacterId);
  const petScale = PET_SCALE_MINIGAME;
  const { size } = puzzle;
  // Alvo de toque ≥44px também na 8×8 (sem gap; a grade centrada pode vazar pelo padding de 16px, nunca da tela a 360px).
  const cell = Math.max(44, Math.floor(Math.min(GRID_MAX_W, 52 * size) / size));
  const gap = size >= 8 ? 0 : 2;
  const numberAt = useMemo(() => {
    const m = new Map<number, number>();
    puzzle.numbers.forEach((c, i) => m.set(c, i + 1));
    return m;
  }, [puzzle]);
  const order = useMemo(() => {
    const m = new Map<number, number>();
    path.forEach((c, i) => m.set(c, i));
    return m;
  }, [path]);

  // Caminho completo e válido = trilha feita. Paga uma vez (trava em `paid`, à prova de StrictMode).
  useEffect(() => {
    if (solved || path.length !== size * size || !validateZip(puzzle, path)) return;
    setSolved(true);
    setSolveMs(t0.current != null ? Math.max(0, Date.now() - t0.current) : 0);
    const bits = zipBits(size);
    setEarned(bits);
    if (!paid.current) { paid.current = true; if (challenge) challenge.onResult(true); else onEarnPoints(bits); }
  }, [path, solved, puzzle, size, onEarnPoints, challenge]);

  /** Entra numa casa: começa, estende, desfaz até ela ou volta um passo. */
  const enter = (c: number) => {
    if (solved) return;
    setStarted(true);
    if (t0.current == null) t0.current = Date.now();
    setPath(prev => {
      const at = prev.indexOf(c);
      if (at >= 0) return at === prev.length - 1 ? prev : prev.slice(0, at + 1);
      if (!canStep(puzzle, prev, c)) return prev;
      return [...prev, c];
    });
  };

  const cellFromEvent = (e: ReactPointerEvent): number | null => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const v = el?.closest?.('[data-zip-cell]')?.getAttribute('data-zip-cell');
    return v == null ? null : Number(v);
  };

  const onDown = (e: ReactPointerEvent) => {
    const c = cellFromEvent(e);
    if (c == null) return;
    drag.current = true;
    try { gridRef.current?.releasePointerCapture?.(e.pointerId); } catch { /* noop */ }
    enter(c);
  };
  const onMove = (e: ReactPointerEvent) => {
    if (!drag.current) return;
    const c = cellFromEvent(e);
    if (c != null) enter(c);
  };
  const stop = () => { drag.current = false; };

  /** Teclado: setas movem a ponta (a 1ª seta entra no número 1); mover para a casa anterior volta um passo; Backspace desfaz. */
  const onKey = (e: ReactKeyboardEvent) => {
    if (solved) return;
    const d = e.key === 'ArrowUp' ? [-1, 0] : e.key === 'ArrowDown' ? [1, 0] : e.key === 'ArrowLeft' ? [0, -1] : e.key === 'ArrowRight' ? [0, 1] : null;
    if (e.key === 'Backspace') { e.preventDefault(); setPath(p => p.slice(0, -1)); return; }
    if (!d) return;
    e.preventDefault();
    if (path.length === 0) { enter(puzzle.numbers[0]); return; }
    const h = path[path.length - 1];
    const r = Math.floor(h / size) + d[0];
    const c = (h % size) + d[1];
    if (r < 0 || c < 0 || r >= size || c >= size) return;
    enter(r * size + c);
  };
  const cellLabel = (c: number): string => {
    const n = numberAt.get(c);
    const pos = isPt ? `Linha ${Math.floor(c / size) + 1}, coluna ${(c % size) + 1}` : `Row ${Math.floor(c / size) + 1}, column ${(c % size) + 1}`;
    const num = n != null ? (isPt ? `, número ${n}` : `, number ${n}`) : '';
    const st = head === c ? (isPt ? ', ponta do caminho' : ', path end') : order.has(c) ? (isPt ? ', no caminho' : ', on the path') : (isPt ? ', livre' : ', empty');
    return pos + num + st;
  };

  const next = () => {
    const l = level + 1;
    paid.current = false;
    t0.current = null;
    setLevel(l);
    setPuzzle(zipForLevel(l, Math.random));
    setPath([]);
    setSolved(false);
    setEarned(0);
  };
  const restart = () => { setPath([]); };
  const undo = () => { setPath(p => p.slice(0, -1)); };

  const head = path.length > 0 ? path[path.length - 1] : null;
  const title = isPt ? 'Trilha do Pet' : 'Pet Trail';
  const status = solved
    ? (isPt ? `Trilha completa · nível ${level}` : `Trail complete · level ${level}`)
    : (isPt ? `Nível ${level} · ${path.length}/${size * size}` : `Level ${level} · ${path.length}/${size * size}`);

  const pathColor = 'color-mix(in srgb, var(--sm2-primary-fill) 38%, transparent)';
  const cellStyle = (c: number): CSSProperties => ({
    position: 'relative', width: cell, height: cell, boxSizing: 'border-box',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid var(--sm2-muted)', borderRadius: 6,
    backgroundColor: order.has(c) ? pathColor : 'var(--sm2-surface-2)',
    outline: head === c ? '2px solid var(--sm2-primary-ink)' : 'none',
    touchAction: 'none', userSelect: 'none',
  });

  if (tut.open) return <MindTutorialScreen game="zip" title={title} language={language} evolutionStage={evolutionStage} demoCharacterId={demoCharacterId} onExit={onExit} onDone={tut.hide} />;

  return (
    <GameRoot>
      <GameHeader
        title={title}
        language={language}
        infoLabel={isPt ? 'Como se joga' : 'How to play'}
        info={(
          <>
            <span style={{ display: 'block' }}>
              {isPt
                ? 'Trace UM caminho que passe pelos números em ordem, do 1 ao último, e preencha todas as casas, sem cruzar.'
                : 'Trace ONE path through the numbers in order, from 1 to the last, filling every cell without crossing.'}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? 'Arraste, toque numa casa vizinha ou use as setas do teclado. Tocar numa casa do caminho volta até ela.' : 'Drag, tap a neighbouring cell or use the arrow keys. Tapping a cell on the path steps back to it.'}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? `Cada trilha resolvida paga Bits pelo tamanho, até ${ZIP_MAX_BITS}.` : `Each solved trail pays Bits by size, up to ${ZIP_MAX_BITS}.`}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? `Ranking da semana: seu tempo nas trilhas ${TIME_RANK_SIZE}×${TIME_RANK_SIZE} (menor é melhor).` : `Weekly ranking: your time on ${TIME_RANK_SIZE}×${TIME_RANK_SIZE} trails (lower is better).`}
            </span>
            <MindTutorialLink language={language} onClick={tut.show} />
          </>
        )}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
        exitConfirm={started && !solved ? gameExitConfirm(isPt, 'do jogo') : undefined}
      />

      <GameVisor height={80} scene={ATELIE_SCENE_SUAVE} label={isPt ? 'O pet segue a trilha' : 'Your pet follows the trail'}>
        <VisorSprite
          src={pet}
          data-visor-pet
          idle={!reduced}
          hop={path.length}
          style={{ left: 110, top: 24, ...petScaleStyle(petScale, 'center') }}
        />
      </GameVisor>

      <p role="status" className="sm2-num" style={phaseTitle} data-zip-status>{status}</p>
      {solved && (
        <p style={phaseLine} data-zip-done>
          {isPt ? 'Seu pet percorreu a trilha inteira.' : 'Your pet walked the whole trail.'} <BitsAmount value={earned} sign="+" />
        </p>
      )}

      <div
        ref={gridRef}
        data-zip-grid
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={stop}
        onPointerCancel={stop}
        onPointerLeave={stop}
        onKeyDown={onKey}
        tabIndex={0}
        role="group"
        aria-label={isPt ? `Grade ${size} por ${size}. Use as setas para traçar o caminho; Backspace volta um passo.` : `${size} by ${size} grid. Use the arrow keys to trace the path; Backspace steps back.`}
        style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cell}px)`, gap, alignSelf: 'center', touchAction: 'none', flex: 'none' }}
      >
        {Array.from({ length: size * size }, (_, c) => {
          const n = numberAt.get(c);
          const reachable = head != null && areAdjacent(head, c, size) && !order.has(c);
          return (
            <div key={c} role="img" aria-label={cellLabel(c)} data-zip-cell={c} data-zip-on={order.has(c) ? '' : undefined} data-zip-reach={reachable ? '' : undefined} style={cellStyle(c)}>
              {n != null && (
                <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1 }}>
                  <img src={MINI_FX.pedras[(n - 1) % 4]} alt="" aria-hidden="true" draggable={false} width={cell * 0.55} height={cell * 0.55} style={{ display: 'block', width: cell * 0.55, height: cell * 0.55 }} />
                  <span className="sm2-num" data-zip-number={n} style={{ ...sm2Hint, color: 'var(--sm2-ink)', fontWeight: 700 }}>{n}</span>
                </span>
              )}
              {n == null && head === c && (
                <img src={pet} alt="" aria-hidden="true" draggable={false} style={{ width: cell * 0.8, height: cell * 0.8, objectFit: 'contain' }} />
              )}
            </div>
          );
        })}
      </div>

      {solved && !challenge && (
        <ResultScreen
          language={language}
          outcome="win"
          gameName={title}
          title={isPt ? 'Trilha completa' : 'Trail complete'}
          line={isPt ? 'Seu pet percorreu a trilha inteira.' : 'Your pet walked the whole trail.'}
          hero={solveMs > 0
            ? { label: isPt ? 'Tempo' : 'Time', value: formatResultTime(solveMs) }
            : { label: isPt ? 'Nível' : 'Level', value: level }}
          strip={[{ key: 'level', label: isPt ? 'Nível' : 'Level', value: level }, { key: 'size', label: isPt ? 'Grade' : 'Grid', value: `${size}×${size}` }]}
          ledger={[{ key: 'bits', kind: 'bits', value: earned }]}
          petSrc={pet}
          playAgainLabel={isPt ? 'Próxima trilha' : 'Next trail'}
          againAttrs={{ 'data-zip-next': true }}
          onPlayAgain={next}
          homeLabel={isPt ? 'Sair' : 'Exit'}
          onHome={onExit}
          below={rankSaveId && size === TIME_RANK_SIZE && solveMs > 0
            ? <RankingPanel key={`${level}-${solveMs}`} game="zip" saveId={rankSaveId} language={language} score={solveMs} />
            : undefined}
        />
      )}

      {!(solved && !challenge) && <div style={{ display: 'flex', gap: 8 }}>
        {solved ? (
          <>
            <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Sair' : 'Exit'}
            </button>
            <button type="button" onClick={next} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }} data-zip-next>
              {isPt ? 'Próxima trilha' : 'Next trail'}
            </button>
          </>
        ) : (
          <>
            <button type="button" onClick={undo} disabled={path.length === 0} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }} data-zip-undo>
              {isPt ? 'Voltar um passo' : 'Step back'}
            </button>
            <button type="button" onClick={restart} disabled={path.length === 0} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }} data-zip-restart>
              {isPt ? 'Recomeçar' : 'Restart'}
            </button>
          </>
        )}
      </div>}
    </GameRoot>
  );
}
