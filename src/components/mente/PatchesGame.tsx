import { useMemo, useRef, useState } from 'react';
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
  PATCHES_MAX_BITS, patchesBits, patchesForLevel, placeRect, rectBetween, rectHas, validatePatches,
  type PatchesPuzzle, type Rect,
} from '../../utils/mente/patches';
/* Rodada 4 (N2): o porte reduzido por estágio vale só na Home e nos combates; no minigame o bicho tem o tamanho cheio. */
const PET_SCALE_MINIGAME = 1;

/**
 * COLCHA (id `patches`) — divida a grade em retângulos; cada um leva UMA
 * pista, e a pista é a área dele (a pedra diz a forma: quadrada = quadrado,
 * triângulo = alto, losango = largo). A regra é de `utils/mente/patches.ts`.
 *
 * Arraste de uma casa a outra para desenhar um retângulo (o que ele cobre
 * sai); tocar numa casa já coberta desfaz aquele retângulo. Sem relógio,
 * sem penalidade. Nasce MUDO.
 */

const GRID_MAX_W = 348;
const TINTS = ['var(--sm2-primary-fill)', 'var(--sm2-gold-fill)', 'var(--sm2-credit-ink)', 'var(--sm2-ink)'];
/** Pedra do Eco que lembra a forma: quadrado (2), alto (1, triângulo), largo (3, losango); sem dica = círculo (0). */
const SHAPE_STONE = { any: 0, tall: 1, square: 2, wide: 3 } as const;

export function PatchesGame({ language, evolutionStage, demoCharacterId, onEarnPoints, onExit, rankSaveId, challenge, tutorial }: EarningGameProps) {
  const isPt = language === 'pt-BR';
  const tut = useMindTutorial(tutorial);
  const reduced = usePrefersReducedMotion();
  const [level, setLevel] = useState(1);
  const [puzzle, setPuzzle] = useState<PatchesPuzzle>(() => patchesForLevel(1, Math.random));
  const [rects, setRects] = useState<Rect[]>([]);
  const [anchor, setAnchor] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [solved, setSolved] = useState(false);
  const [earned, setEarned] = useState(0);
  const [started, setStarted] = useState(false);
  const paid = useRef(false);
  /** Relógio do ranking semanal por TEMPO (decisão do dono 5): da 1ª jogada à colcha pronta; reinicia a cada colcha nova. */
  const t0 = useRef<number | null>(null);
  const [solveMs, setSolveMs] = useState(0);
  const moved = useRef(false);
  /** Cursor do teclado (casa); Espaço/Enter ancora, setas esticam, Espaço/Enter de novo fecha o retângulo, Esc cancela. */
  const [cursor, setCursor] = useState<number | null>(null);
  const [kbAnchor, setKbAnchor] = useState<number | null>(null);

  const pet = getSpriteForStage(evolutionStage, demoCharacterId);
  const petScale = PET_SCALE_MINIGAME;
  const { size } = puzzle;
  // Alvo de toque ≥44px também na 8×8 (sem gap; a grade centrada pode vazar pelo padding de 16px, nunca da tela a 360px).
  const cell = Math.max(44, Math.floor(Math.min(GRID_MAX_W, 52 * size) / size));
  const gap = size >= 8 ? 0 : 2;
  const clueAt = useMemo(() => new Map(puzzle.clues.map(c => [c.cell, c])), [puzzle]);

  /** A casa sob o dedo (30/10/2026, dono: no celular "a caixa não nasce no número"). Por CONTA sobre a caixa da grade
   *  (toque − borda) ÷ (casa + vão), não por `elementFromPoint`, que no toque pode cair no vão ou numa camada por cima e
   *  devolver a casa vizinha. Sem medida (jsdom) volta ao alvo do evento. */
  const cellFromEvent = (e: ReactPointerEvent): number | null => {
    const grid = (e.currentTarget as HTMLElement | null)?.closest?.('[data-patches-grid]') as HTMLElement | null;
    const box = grid?.getBoundingClientRect();
    if (box && box.width > 0 && box.height > 0) {
      const step = cell + gap;
      const col = Math.floor((e.clientX - box.left) / step);
      const row = Math.floor((e.clientY - box.top) / step);
      if (col < 0 || row < 0 || col >= size || row >= size) return null;
      return row * size + col;
    }
    const el = (document.elementFromPoint?.(e.clientX, e.clientY) ?? e.target) as HTMLElement | null;
    const v = el?.closest?.('[data-patch-cell]')?.getAttribute('data-patch-cell');
    return v == null ? null : Number(v);
  };

  const commit = (next: Rect[]) => {
    setRects(next);
    if (validatePatches(puzzle, next)) {
      setSolved(true);
      setSolveMs(t0.current != null ? Math.max(0, Date.now() - t0.current) : 0);
      const bits = patchesBits(size);
      setEarned(bits);
      if (!paid.current) { paid.current = true; if (challenge) challenge.onResult(true); else onEarnPoints(bits); }
    }
  };

  const onDown = (e: ReactPointerEvent) => {
    if (solved) return;
    const c = cellFromEvent(e);
    if (c == null) return;
    setStarted(true);
    if (t0.current == null) t0.current = Date.now();
    moved.current = false;
    // Prende o ponteiro na grade: o arraste segue mesmo se o dedo sair dela, e o navegador não cancela no meio.
    try { (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId); } catch { /* sem suporte */ }
    setAnchor(c);
    setHover(c);
  };
  const onMove = (e: ReactPointerEvent) => {
    if (anchor == null) return;
    const c = cellFromEvent(e);
    if (c != null && c !== hover) { setHover(c); if (c !== anchor) moved.current = true; }
  };
  const onUp = (e: ReactPointerEvent) => {
    if (anchor == null) return;
    const c = cellFromEvent(e) ?? hover ?? anchor;
    const drew = moved.current || c !== anchor;
    const existing = rects.find(rc => rectHas(rc, anchor, size));
    setAnchor(null);
    setHover(null);
    if (!drew && existing) { commit(rects.filter(rc => rc !== existing)); return; }
    commit(placeRect(rects, rectBetween(anchor, c, size)));
  };
  const cancel = () => { setAnchor(null); setHover(null); };

  const onKey = (e: ReactKeyboardEvent) => {
    if (solved) return;
    const d = e.key === 'ArrowUp' ? [-1, 0] : e.key === 'ArrowDown' ? [1, 0] : e.key === 'ArrowLeft' ? [0, -1] : e.key === 'ArrowRight' ? [0, 1] : null;
    const cur = cursor ?? 0;
    if (d) {
      e.preventDefault();
      const r = Math.min(size - 1, Math.max(0, Math.floor(cur / size) + d[0]));
      const c = Math.min(size - 1, Math.max(0, (cur % size) + d[1]));
      setStarted(true);
      if (t0.current == null) t0.current = Date.now();
      setCursor(r * size + c);
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      setStarted(true);
      if (t0.current == null) t0.current = Date.now();
      if (cursor == null) { setCursor(0); return; }
      if (kbAnchor == null) {
        const existing = rects.find(rc => rectHas(rc, cur, size));
        if (existing) { commit(rects.filter(rc => rc !== existing)); return; }
        setKbAnchor(cur);
      } else {
        const from = kbAnchor;
        setKbAnchor(null);
        commit(placeRect(rects, rectBetween(from, cur, size)));
      }
    } else if (e.key === 'Escape' && kbAnchor != null) {
      e.preventDefault();
      e.stopPropagation();
      setKbAnchor(null);
    } else if ((e.key === 'Backspace' || e.key === 'Delete') && cursor != null) {
      e.preventDefault();
      const existing = rects.find(rc => rectHas(rc, cur, size));
      if (existing) commit(rects.filter(rc => rc !== existing));
    }
  };

  const preview = anchor != null && hover != null
    ? rectBetween(anchor, hover, size)
    : kbAnchor != null && cursor != null ? rectBetween(kbAnchor, cursor, size) : null;
  const cellLabel = (c: number): string => {
    const cl = clueAt.get(c);
    const pos = isPt ? `Linha ${Math.floor(c / size) + 1}, coluna ${(c % size) + 1}` : `Row ${Math.floor(c / size) + 1}, column ${(c % size) + 1}`;
    const clue = cl ? (isPt ? `, pista ${cl.area}` : `, clue ${cl.area}`) + (cl.shape !== 'any' ? `, ${shapeWord(cl.shape)}` : '') : '';
    const st = rects.some(rc => rectHas(rc, c, size)) ? (isPt ? ', coberta' : ', covered') : (isPt ? ', livre' : ', empty');
    return pos + clue + st;
  };

  const next = () => {
    const l = level + 1;
    paid.current = false;
    t0.current = null;
    setLevel(l);
    setPuzzle(patchesForLevel(l, Math.random));
    setRects([]);
    setSolved(false);
    setEarned(0);
  };

  const title = isPt ? 'Colcha' : 'Patchwork';
  const status = solved
    ? (isPt ? `Colcha pronta · nível ${level}` : `Patchwork done · level ${level}`)
    : (isPt ? `Nível ${level} · ${rects.length}/${puzzle.clues.length} retalhos` : `Level ${level} · ${rects.length}/${puzzle.clues.length} patches`);

  const cellStyle = (c: number): CSSProperties => {
    const idx = rects.findIndex(rc => rectHas(rc, c, size));
    const inPreview = preview != null && rectHas(preview, c, size);
    return {
      width: cell, height: cell, boxSizing: 'border-box', position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid var(--sm2-muted)', borderRadius: 4, touchAction: 'none', userSelect: 'none',
      // A casa de origem do arraste fica marcada: o retângulo sempre nasce nela.
      outline: cursor === c || anchor === c ? '2px solid var(--sm2-primary-ink)' : 'none', outlineOffset: -2,
      backgroundColor: inPreview
        ? 'color-mix(in srgb, var(--sm2-ink) 18%, transparent)'
        : idx >= 0
          ? `color-mix(in srgb, ${TINTS[idx % TINTS.length]} 34%, transparent)`
          : 'var(--sm2-surface-2)',
    };
  };

  const shapeWord = (s: 'square' | 'tall' | 'wide') => s === 'square' ? (isPt ? 'quadrado' : 'square') : s === 'tall' ? (isPt ? 'alto' : 'tall') : (isPt ? 'largo' : 'wide');

  if (tut.open) return <MindTutorialScreen game="patches" title={title} language={language} evolutionStage={evolutionStage} demoCharacterId={demoCharacterId} onExit={onExit} onDone={tut.hide} />;

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
                ? 'Divida a grade inteira em retângulos. Cada retângulo tem exatamente UM número, e o número é a área dele.'
                : 'Split the whole grid into rectangles. Each rectangle holds exactly ONE number, and the number is its area.'}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? 'A pedra ao lado do número dá a forma: triângulo = alto, losango = largo, quadrada = quadrado.' : 'The stone beside a number hints the shape: triangle = tall, diamond = wide, square = square.'}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? 'Arraste para desenhar; tocar num retalho o desfaz. No teclado: setas movem o cursor, Espaço marca o início e o fim do retângulo, Backspace desfaz.' : 'Drag to draw; tapping a patch undoes it. On the keyboard: arrows move the cursor, Space marks a rectangle\'s start and end, Backspace undoes.'}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? `Cada colcha pronta paga Bits pelo tamanho, até ${PATCHES_MAX_BITS}.` : `Each finished patchwork pays Bits by size, up to ${PATCHES_MAX_BITS}.`}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? `Ranking da semana: seu tempo nas colchas ${TIME_RANK_SIZE}×${TIME_RANK_SIZE} (menor é melhor).` : `Weekly ranking: your time on ${TIME_RANK_SIZE}×${TIME_RANK_SIZE} patchworks (lower is better).`}
            </span>
            <MindTutorialLink language={language} onClick={tut.show} />
          </>
        )}
        closeLabel={isPt ? 'Sair' : 'Exit'}
        onClose={onExit}
        exitConfirm={started && !solved ? gameExitConfirm(isPt, 'do jogo') : undefined}
      />

      <GameVisor height={80} scene={ATELIE_SCENE_SUAVE} label={isPt ? 'O pet cose a colcha' : 'Your pet stitches the patchwork'}>
        <VisorSprite
          src={pet}
          data-visor-pet
          idle={!reduced}
          hop={rects.length}
          style={{ left: 110, top: 24, ...petScaleStyle(petScale, 'center') }}
        />
      </GameVisor>

      <p role="status" className="sm2-num" style={phaseTitle} data-patches-status>{status}</p>
      {solved && (
        <p style={phaseLine} data-patches-done>
          {isPt ? 'Seu pet admira a colcha.' : 'Your pet admires the patchwork.'} <BitsAmount value={earned} sign="+" />
        </p>
      )}

      <div
        data-patches-grid
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={cancel}
        onKeyDown={onKey}
        tabIndex={0}
        role="group"
        aria-label={isPt ? `Grade ${size} por ${size}. Setas movem o cursor; Espaço marca início e fim de um retângulo.` : `${size} by ${size} grid. Arrows move the cursor; Space marks a rectangle's start and end.`}
        style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cell}px)`, gap, alignSelf: 'center', touchAction: 'none', flex: 'none' }}
      >
        {Array.from({ length: size * size }, (_, c) => {
          const cl = clueAt.get(c);
          return (
            <div key={c} role="img" aria-label={cellLabel(c)} data-patch-cell={c} style={cellStyle(c)}>
              {cl && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 1, lineHeight: 1 }}>
                  <img
                    src={MINI_FX.pedras[SHAPE_STONE[cl.shape]]} alt="" aria-hidden="true" draggable={false}
                    width={Math.round(cell * 0.4)} height={Math.round(cell * 0.4)}
                    style={{ display: 'block', width: Math.round(cell * 0.4), height: Math.round(cell * 0.4) }}
                  />
                  <span
                    className="sm2-num" data-patch-clue={cl.area}
                    aria-label={cl.shape === 'any' ? `${cl.area}` : `${cl.area}, ${shapeWord(cl.shape)}`}
                    style={{ ...sm2Hint, color: 'var(--sm2-ink)', fontWeight: 700 }}
                  >
                    {cl.area}
                  </span>
                </span>
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
          title={isPt ? 'Colcha pronta' : 'Patchwork done'}
          line={isPt ? 'Seu pet admira a colcha.' : 'Your pet admires the patchwork.'}
          hero={solveMs > 0
            ? { label: isPt ? 'Tempo' : 'Time', value: formatResultTime(solveMs) }
            : { label: isPt ? 'Nível' : 'Level', value: level }}
          strip={[{ key: 'level', label: isPt ? 'Nível' : 'Level', value: level }, { key: 'size', label: isPt ? 'Grade' : 'Grid', value: `${size}×${size}` }]}
          ledger={[{ key: 'bits', kind: 'bits', value: earned }]}
          petSrc={pet}
          playAgainLabel={isPt ? 'Próxima colcha' : 'Next patchwork'}
          againAttrs={{ 'data-patches-next': true }}
          onPlayAgain={next}
          homeLabel={isPt ? 'Sair' : 'Exit'}
          onHome={onExit}
          below={rankSaveId && size === TIME_RANK_SIZE && solveMs > 0
            ? <RankingPanel key={`${level}-${solveMs}`} game="patches" saveId={rankSaveId} language={language} score={solveMs} />
            : undefined}
        />
      )}

      {!(solved && !challenge) && <div style={{ display: 'flex', gap: 8 }}>
        {solved ? (
          <>
            <button type="button" onClick={next} style={{ ...sm2Button('primary'), flex: 1, minWidth: 0, padding: '0 8px' }} data-patches-next>
              {isPt ? 'Próxima colcha' : 'Next patchwork'}
            </button>
            <button type="button" onClick={onExit} style={{ ...sm2Button('outline'), flex: 1, minWidth: 0, padding: '0 8px' }}>
              {isPt ? 'Sair' : 'Exit'}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => setRects([])} disabled={rects.length === 0} style={{ ...sm2Button('outline'), flex: 1 }} data-patches-clear>
            {isPt ? 'Limpar tudo' : 'Clear all'}
          </button>
        )}
      </div>}
    </GameRoot>
  );
}
