import { useMemo, useRef, useState } from 'react';
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react';
import type { EarningGameProps } from './types';
import { sm2Button, sm2Hint } from '../form/FormKit';
import { GameRoot, GameHeader, GameVisor, VisorSprite, phaseTitle, phaseLine, gameExitConfirm } from '../games/GameKit';
import { BitsAmount } from '../ui/BitsAmount';
import { usePrefersReducedMotion } from '../ui/Viewport';
import { getSpriteForStage } from '../../utils/sprites';
import { usePetScale } from '../../hooks/usePetScale';
import { petScaleStyle } from '../../utils/spriteScale';
import { ATELIE_SCENE_SUAVE, MINI_FX } from '../../utils/visorScenes';
import {
  PATCHES_MAX_BITS, patchesBits, patchesForLevel, placeRect, rectBetween, rectHas, validatePatches,
  type PatchesPuzzle, type Rect,
} from '../../utils/mente/patches';

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

export function PatchesGame({ language, evolutionStage, demoCharacterId, onEarnPoints, onExit }: EarningGameProps) {
  const isPt = language === 'pt-BR';
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
  const moved = useRef(false);

  const pet = getSpriteForStage(evolutionStage, demoCharacterId);
  const petScale = usePetScale(evolutionStage, pet);
  const { size } = puzzle;
  const cell = Math.floor(Math.min(GRID_MAX_W, 52 * size) / size);
  const clueAt = useMemo(() => new Map(puzzle.clues.map(c => [c.cell, c])), [puzzle]);

  const cellFromEvent = (e: ReactPointerEvent): number | null => {
    const el = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const v = el?.closest?.('[data-patch-cell]')?.getAttribute('data-patch-cell');
    return v == null ? null : Number(v);
  };

  const commit = (next: Rect[]) => {
    setRects(next);
    if (validatePatches(puzzle, next)) {
      setSolved(true);
      const bits = patchesBits(size);
      setEarned(bits);
      if (!paid.current) { paid.current = true; onEarnPoints(bits); }
    }
  };

  const onDown = (e: ReactPointerEvent) => {
    if (solved) return;
    const c = cellFromEvent(e);
    if (c == null) return;
    setStarted(true);
    moved.current = false;
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

  const preview = anchor != null && hover != null ? rectBetween(anchor, hover, size) : null;

  const next = () => {
    const l = level + 1;
    paid.current = false;
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
      backgroundColor: inPreview
        ? 'color-mix(in srgb, var(--sm2-ink) 18%, transparent)'
        : idx >= 0
          ? `color-mix(in srgb, ${TINTS[idx % TINTS.length]} 34%, transparent)`
          : 'var(--sm2-surface-2)',
    };
  };

  const shapeWord = (s: 'square' | 'tall' | 'wide') => s === 'square' ? (isPt ? 'quadrado' : 'square') : s === 'tall' ? (isPt ? 'alto' : 'tall') : (isPt ? 'largo' : 'wide');

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
              {isPt ? 'Arraste para desenhar; tocar num retalho o desfaz.' : 'Drag to draw; tapping a patch undoes it.'}
            </span>
            <span style={{ display: 'block', marginTop: 6 }}>
              {isPt ? `Cada colcha pronta paga Bits pelo tamanho, até ${PATCHES_MAX_BITS}.` : `Each finished patchwork pays Bits by size, up to ${PATCHES_MAX_BITS}.`}
            </span>
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
        style={{ display: 'grid', gridTemplateColumns: `repeat(${size}, ${cell}px)`, gap: 2, alignSelf: 'center', touchAction: 'none' }}
      >
        {Array.from({ length: size * size }, (_, c) => {
          const cl = clueAt.get(c);
          return (
            <div key={c} data-patch-cell={c} style={cellStyle(c)}>
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

      <div style={{ display: 'flex', gap: 8 }}>
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
      </div>
    </GameRoot>
  );
}
