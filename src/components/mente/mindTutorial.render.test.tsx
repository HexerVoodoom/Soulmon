// @vitest-environment jsdom
/** Tutorial da 1ª abertura (Eco, Trilha, Colcha): aparece 1×, "Pular"/× também contam, o "i" reabre sem regravar, EN e PT-BR. */
import { describe, it, expect, vi } from 'vitest';
import { fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { EcoGame } from './EcoGame';
import { ZipGame } from './ZipGame';
import { PatchesGame } from './PatchesGame';
import { markMindGameTutorial, sanitizeMindGameTutorials } from '../../utils/mente/mindTutorials';

const base = { evolutionStage: 'rookie', onExit: () => {}, onEarnPoints: () => {} };
const JOGOS = [
  ['eco', EcoGame, '[data-eco-start]'],
  ['zip', ZipGame, '[data-zip-grid]'],
  ['patches', PatchesGame, '[data-patches-grid]'],
] as const;

describe.each(JOGOS)('tutorial de %s', (id, Game, jogoSel) => {
  it('abre na 1ª vez e grava AO MOSTRAR (uma única vez)', () => {
    const onShown = vi.fn();
    const { container } = renderWithCss(<Game {...base} language="en-US" tutorial={{ seen: false, onShown }} />);
    expect(container.querySelector(`[data-mind-tutorial="${id}"]`)).toBeTruthy();
    expect(container.querySelector(jogoSel)).toBeFalsy();
    expect(onShown).toHaveBeenCalledTimes(1);
  });

  it('não aparece na 2ª vez', () => {
    const onShown = vi.fn();
    const { container } = renderWithCss(<Game {...base} language="pt-BR" tutorial={{ seen: true, onShown }} />);
    expect(container.querySelector('[data-mind-tutorial]')).toBeFalsy();
    expect(onShown).not.toHaveBeenCalled();
  });

  it('sem a prop (modo desafio) não abre', () => {
    const { container } = renderWithCss(<Game {...base} language="en-US" />);
    expect(container.querySelector('[data-mind-tutorial]')).toBeFalsy();
  });

  it('Próximo percorre os passos e "Jogar" entrega o jogo; Pular vai direto', () => {
    const a = renderWithCss(<Game {...base} language="en-US" tutorial={{ seen: false, onShown: () => {} }} />);
    const q = (s: string) => a.container.querySelector(s) as HTMLElement | null;
    let n = 0;
    while (q('[data-mind-tutorial-skip]')) { fireEvent.click(q('[data-mind-tutorial-next]')!); n++; }
    expect(n).toBeGreaterThanOrEqual(2);
    expect(q('[data-mind-tutorial-next]')!.textContent).toBe('Got it, play');
    fireEvent.click(q('[data-mind-tutorial-next]')!);
    expect(q('[data-mind-tutorial]')).toBeFalsy();
    expect(q(jogoSel)).toBeTruthy();
    a.unmount();
    const b = renderWithCss(<Game {...base} language="pt-BR" tutorial={{ seen: false, onShown: () => {} }} />);
    expect(b.container.querySelector('[data-mind-tutorial-skip]')!.textContent).toBe('Pular');
    fireEvent.click(b.container.querySelector('[data-mind-tutorial-skip]')!);
    expect(b.container.querySelector('[data-mind-tutorial]')).toBeFalsy();
  });

  it('o × do jogo sai (= pulado) durante o tutorial', () => {
    const onExit = vi.fn();
    const { container } = renderWithCss(<Game {...base} onExit={onExit} language="en-US" tutorial={{ seen: false, onShown: () => {} }} />);
    fireEvent.click(container.querySelector('[data-game-close-start]')!);
    expect(onExit).toHaveBeenCalled();
  });

  it('o "Ver o tutorial" do ajuda reabre sem regravar', () => {
    const onShown = vi.fn();
    const { container } = renderWithCss(<Game {...base} language="pt-BR" tutorial={{ seen: true, onShown }} />);
    const info = container.querySelector('button[aria-label="Como se joga"]') as HTMLElement;
    fireEvent.click(info);
    fireEvent.click(document.querySelector('[data-mind-tutorial-open]')!);
    expect(container.querySelector(`[data-mind-tutorial="${id}"]`)).toBeTruthy();
    expect(onShown).not.toHaveBeenCalled();
  });
});

describe('mindGameTutorials (save)', () => {
  it('leitura tolerante: só true literal de chave conhecida sobrevive', () => {
    expect(sanitizeMindGameTutorials(undefined)).toEqual({});
    expect(sanitizeMindGameTutorials('x')).toEqual({});
    expect(sanitizeMindGameTutorials([true])).toEqual({});
    expect(sanitizeMindGameTutorials({ eco: true, zip: 'sim', patches: 1, outro: true })).toEqual({ eco: true });
  });
  it('marcar é idempotente (mesma referência)', () => {
    const a = markMindGameTutorial({}, 'zip');
    expect(a).toEqual({ zip: true });
    expect(markMindGameTutorial(a, 'zip')).toBe(a);
  });
});
