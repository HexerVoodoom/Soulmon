// @vitest-environment jsdom
/**
 * SELO FALTANTE montado de verdade: 8 matrizes, paga UMA vez pelo funil `onEarnPoints` ao fechar a rodada;
 * nasce MUDO; copy sem promessa cognitiva ("exercita raciocínio", nunca "treina o cérebro").
 */
import { afterEach, describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../../test/renderEnv';
import { SeloGame } from './SeloGame';
import { SELO_ROUND, seededRng } from '../../utils/mente/selo';

const base = { evolutionStage: 'rookie', onExit: () => {} };
afterEach(() => { vi.restoreAllMocks(); });

describe('SeloGame', () => {
  it('uma rodada de 8 escolhas paga uma vez e mostra o fim', () => {
    vi.spyOn(Math, 'random').mockImplementation(seededRng(5));
    const onEarn = vi.fn();
    const { container } = renderWithCss(<SeloGame {...base} language="pt-BR" onEarnPoints={onEarn} />);
    fireEvent.click(container.querySelector('[data-selo-start]')!);
    for (let i = 0; i < SELO_ROUND; i += 1) {
      expect(container.querySelectorAll('[data-selo-option]').length).toBe(6);
      expect(container.querySelectorAll('[data-selo-cell]').length).toBe(9);
      fireEvent.click(container.querySelector('[data-selo-option="0"]')!);
      expect(container.querySelector('[data-selo-feedback]')).toBeTruthy();
      fireEvent.click(container.querySelector('[data-selo-next]')!);
    }
    expect(container.querySelector('[data-selo-done]')).toBeTruthy();
    expect(onEarn).toHaveBeenCalledTimes(1);
  });

  it('modo desafio (Calabouço): uma escolha devolve o resultado, sem Bits', () => {
    const onResult = vi.fn();
    const onEarn = vi.fn();
    const { container } = renderWithCss(<SeloGame {...base} language="en-US" onEarnPoints={onEarn} challenge={{ goal: 1, onResult }} />);
    fireEvent.click(container.querySelector('[data-selo-start]')!);
    fireEvent.click(container.querySelector('[data-selo-option="2"]')!);
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onEarn).not.toHaveBeenCalled();
  });
});

describe('contrato de superfície nova', () => {
  for (const f of ['SeloGame.tsx', 'SeloSeal.tsx']) {
    it(`${f}: nasce mudo e sem promessa cognitiva`, () => {
      const src = readFileSync(resolve(__dirname, f), 'utf8');
      expect(src).not.toMatch(/utils\/sounds|audioBus|new Audio|AudioContext/);
      expect(src).not.toMatch(/c[ée]rebro|brain|treina|improve|melhora/i);
    });
  }
});
