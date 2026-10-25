// @vitest-environment jsdom
/**
 * TRILHA DO PET e COLCHA montadas de verdade: o puzzle resolvido pela interface
 * paga UMA vez pelo funil `onEarnPoints`; nasce MUDO; copy sem promessa cognitiva.
 */
import { afterEach, describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../../test/renderEnv';
import { ZipGame } from './ZipGame';
import { PatchesGame } from './PatchesGame';
import { zipBits, zipForLevel, seededRng } from '../../utils/mente/zip';
import { patchesBits, patchesForLevel } from '../../utils/mente/patches';

const base = { evolutionStage: 'rookie', onExit: () => {} };

/** Faz o `elementFromPoint` do jsdom devolver a casa pedida. */
function pointAt(el: Element | null) {
  (document as unknown as { elementFromPoint: () => Element | null }).elementFromPoint = () => el;
}
afterEach(() => { vi.restoreAllMocks(); });

describe('ZipGame', () => {
  it('traçar a solução inteira paga uma vez e mostra a trilha completa', () => {
    vi.spyOn(Math, 'random').mockImplementation(seededRng(42));
    const puzzle = zipForLevel(1, seededRng(42));
    const onEarn = vi.fn();
    const { container } = renderWithCss(<ZipGame {...base} language="en-US" onEarnPoints={onEarn} />);
    const grid = container.querySelector('[data-zip-grid]')!;
    const cellEl = (c: number) => container.querySelector(`[data-zip-cell="${c}"]`)!;
    puzzle.solution.forEach((c, i) => {
      pointAt(cellEl(c));
      fireEvent.pointerDown(grid);
      if (i === 0) return;
    });
    expect(container.querySelector('[data-zip-done]')).toBeTruthy();
    expect(onEarn).toHaveBeenCalledTimes(1);
    expect(onEarn).toHaveBeenCalledWith(zipBits(puzzle.size));
  });

  it('casa fora de vez não entra (número só na ordem) e não paga', () => {
    vi.spyOn(Math, 'random').mockImplementation(seededRng(7));
    const puzzle = zipForLevel(1, seededRng(7));
    const onEarn = vi.fn();
    const { container } = renderWithCss(<ZipGame {...base} language="pt-BR" onEarnPoints={onEarn} />);
    const grid = container.querySelector('[data-zip-grid]')!;
    pointAt(container.querySelector(`[data-zip-cell="${puzzle.numbers[1]}"]`));
    fireEvent.pointerDown(grid);
    expect(container.querySelectorAll('[data-zip-on]').length).toBe(0);
    expect(onEarn).not.toHaveBeenCalled();
  });
});

describe('PatchesGame', () => {
  it('desenhar os retângulos da solução paga uma vez', () => {
    vi.spyOn(Math, 'random').mockImplementation(seededRng(99));
    const puzzle = patchesForLevel(1, seededRng(99));
    const onEarn = vi.fn();
    const { container } = renderWithCss(<PatchesGame {...base} language="en-US" onEarnPoints={onEarn} />);
    const grid = container.querySelector('[data-patches-grid]')!;
    const cellEl = (c: number) => container.querySelector(`[data-patch-cell="${c}"]`)!;
    for (const rc of puzzle.solution) {
      const a = rc.r * puzzle.size + rc.c;
      const b = (rc.r + rc.h - 1) * puzzle.size + rc.c + rc.w - 1;
      pointAt(cellEl(a));
      fireEvent.pointerDown(grid);
      pointAt(cellEl(b));
      fireEvent.pointerMove(grid);
      fireEvent.pointerUp(grid);
    }
    expect(container.querySelector('[data-patches-done]')).toBeTruthy();
    expect(onEarn).toHaveBeenCalledTimes(1);
    expect(onEarn).toHaveBeenCalledWith(patchesBits(puzzle.size));
  });
});

describe('contrato de superfície nova', () => {
  const dir = resolve(__dirname);
  for (const f of ['ZipGame.tsx', 'PatchesGame.tsx']) {
    it(`${f}: nasce mudo e sem promessa cognitiva`, () => {
      const src = readFileSync(resolve(dir, f), 'utf8');
      expect(src).not.toMatch(/utils\/sounds|audioBus|new Audio|AudioContext/);
      expect(src).not.toMatch(/c[ée]rebro|brain|treina|improve|melhora/i);
    });
  }
});
