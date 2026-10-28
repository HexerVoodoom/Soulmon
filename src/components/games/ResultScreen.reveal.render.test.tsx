// @vitest-environment jsdom
/**
 * A REVELAÇÃO DE RECOMPENSA na tela de resultado (dono, 28/10/2026): ícones que estouram um a um, odômetro de Bits, toque pula,
 * movimento reduzido = estado final, selo de recorde, escadas (≤10 + "×N"), poção de cura com a arte e o nome do item.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { ResultScreen, type ResultScreenProps } from './ResultScreen';
import { RECORD_SEAL_ICON, STAIRS_ICON, rewardItemIconSync, rewardItemLabel } from '../../utils/rewardIcons';
import { POP_STAGGER_MS } from '../../utils/rewardReveal';

function reducedMotion(on: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: on && q.includes('prefers-reduced-motion'), media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const rift = (over: Partial<ResultScreenProps> = {}): ResultScreenProps => ({
  language: 'en-US', outcome: 'record', gameName: 'Endless Rift', title: 'Descent over',
  hero: { label: 'Layers cleared', value: 14, big: true, unit: { icon: STAIRS_ICON, count: 14 } },
  deepest: { label: 'Deepest so far', value: 'layer 14' }, recordNote: 'New record!',
  stats: [{ key: 'enemies', label: 'Creatures that stopped holding', value: 6 }],
  ledger: [
    { key: 'bits', kind: 'bits', value: 42 },
    { key: 'hearts', kind: 'item', itemKind: 'heart', label: rewardItemLabel('heart', false), amount: 2 },
    { key: 'glitchtama', kind: 'item', itemKind: 'glitchtama', label: 'Glitchtama (Backpack)', amount: 1 },
  ],
  petSrc: 'pet.png', onPlayAgain: () => {}, onHome: () => {}, homeLabel: 'Back', ...over,
});

const pops = () => [...document.querySelectorAll('.sm-pop')];
/** Avança o relógio em fatias: cada efeito do React (que agenda a próxima leva de timers) precisa rodar entre elas. */
const avancar = (ms: number) => { for (let t = 0; t < ms; t += 50) act(() => { vi.advanceTimersByTime(50); }); };
const on = () => [...document.querySelectorAll('.sm-pop--on')];

beforeEach(() => { vi.useFakeTimers(); reducedMotion(false); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('revelação de recompensa', () => {
  it('o valor final está no DOM no primeiro quadro (Bits, herói, itens), mesmo com tudo ainda escondido', () => {
    render(<ResultScreen {...rift()} />);
    expect(document.querySelector('[data-rolling-final]')!.textContent).toBe('+42');
    expect(document.querySelector('[data-result-final]')!.textContent).toBe('14');
    expect(document.querySelector('[data-result-row="item"]')!.textContent).toMatch(/Healing item/);
    expect(on().length).toBe(0); // nada estourou ainda
    expect(pops().length).toBeGreaterThan(10);
  });

  it('os ícones estouram um depois do outro, na ordem (escadas → selo → livro), ~250 ms entre as linhas', () => {
    render(<ResultScreen {...rift()} />);
    avancar(300 + 100);
    const n1 = on().length;
    expect(n1).toBeGreaterThanOrEqual(1);
    avancar(POP_STAGGER_MS * 3);
    expect(on().length).toBeGreaterThan(n1);
    avancar(12_000);
    expect(on().length).toBe(pops().length); // tudo estourou
  });

  it('o odômetro: a moeda de Bits mostra colunas de dígitos que rolam e, ao pousar, o número fixo', () => {
    render(<ResultScreen {...rift()} />);
    expect(document.querySelector('[data-rolling-count="reel"]')).not.toBeNull();
    avancar(12_000);
    expect(document.querySelector('[data-rolling-count="reel"]')).toBeNull();
    expect(document.querySelector('[data-rolling-count="final"]')!.textContent).toBe('+42');
  });

  it('um toque em qualquer lugar pula: tudo vira o estado final de uma vez', () => {
    render(<ResultScreen {...rift()} />);
    expect(on().length).toBe(0);
    fireEvent.click(document.querySelector('[data-result-screen]')!);
    expect(on().length).toBe(pops().length);
    expect(document.querySelector('[data-rolling-count="reel"]')).toBeNull();
    expect(document.querySelector('[data-rolling-count="final"]')!.textContent).toBe('+42');
  });

  it('prefers-reduced-motion: tudo já no primeiro quadro, sem animação (`sm-pop--still`) e sem colunas', () => {
    reducedMotion(true);
    render(<ResultScreen {...rift()} />);
    expect(on().length).toBe(pops().length);
    expect(document.querySelectorAll('.sm-pop--still').length).toBe(pops().length);
    expect(document.querySelector('[data-rolling-count="reel"]')).toBeNull();
    expect(document.querySelector('[data-rolling-count="final"]')!.textContent).toBe('+42');
  });

  it('o resumo para leitor de tela sai UMA vez, completo, na região viva', () => {
    render(<ResultScreen {...rift()} />);
    const live = document.querySelector('[role="status"][data-result-live]')!;
    expect(live.textContent).toBe('');
    avancar(160);
    const t = live.textContent!;
    expect(t).toMatch(/Layers cleared: 14/);
    expect(t).toMatch(/Deepest so far: layer 14/);
    expect(t).toMatch(/New record!/);
    expect(t).toMatch(/42 Bits/);
    expect(t).toMatch(/Healing item ×2/);
    avancar(12_000);
    expect(live.textContent).toBe(t); // não muda enquanto a animação roda
  });

  it('selo de recorde: o ícone (provisório, uma constante) + o texto; sem recorde não há selo', () => {
    const { unmount } = render(<ResultScreen {...rift({ instant: true })} />);
    const seal = document.querySelector('[data-result-seal] img') as HTMLImageElement;
    expect(seal.getAttribute('src')).toBe(RECORD_SEAL_ICON);
    expect(document.querySelector('[data-result-record]')!.textContent).toBe('New record!');
    unmount();
    render(<ResultScreen {...rift({ outcome: 'calm', instant: true })} />);
    expect(document.querySelector('[data-result-seal]')).toBeNull();
  });

  it('mais de 10 camadas: 10 escadas + "×N" ao lado; até 10, uma por camada e sem "×"', () => {
    const { unmount } = render(<ResultScreen {...rift({ instant: true })} />);
    expect(document.querySelectorAll('[data-result-unit]').length).toBe(10);
    expect(document.querySelector('[data-result-units-more]')!.textContent).toBe('×14');
    expect((document.querySelector('[data-result-unit] img') as HTMLImageElement).getAttribute('src')).toBe(STAIRS_ICON);
    unmount();
    render(<ResultScreen {...rift({ instant: true, hero: { label: 'Layers cleared', value: 3, unit: { icon: STAIRS_ICON, count: 3 } } })} />);
    expect(document.querySelectorAll('[data-result-unit]').length).toBe(3);
    expect(document.querySelector('[data-result-units-more]')).toBeNull();
  });

  it('o item de recuperar vida mostra a arte do coração e o nome canônico (EN e PT); outros itens têm a própria arte', () => {
    expect(rewardItemLabel('heart', false)).toBe('Healing item');
    expect(rewardItemLabel('heart', true)).toBe('Item de recuperar vida');
    render(<ResultScreen {...rift({ instant: true })} />);
    const icons = [...document.querySelectorAll('[data-result-item-icon] img')] as HTMLImageElement[];
    expect(icons[0].getAttribute('src')).toBe(rewardItemIconSync('heart'));
    expect(icons[1].getAttribute('src')).toBe(rewardItemIconSync('glitchtama'));
    expect(rewardItemIconSync('heart')).not.toBe(rewardItemIconSync('glitchtama'));
  });

  it('"Energy used" leva o ícone de energia e "Mais fundo" aparece uma vez', () => {
    render(<ResultScreen {...rift({ instant: true, stats: [{ key: 'energy', label: 'Energy used', value: 3, icon: 'energia.png' }] })} />);
    expect(document.querySelector('[data-result-stat="energy"] img')!.getAttribute('src')).toBe('energia.png');
    expect((document.body.textContent!.match(/Deepest so far/g) ?? []).length).toBe(1);
  });

  it('o selo de recorde também aparece nas outras telas que marcam `record` (sem texto próprio usa o padrão)', () => {
    render(<ResultScreen {...rift({ instant: true, hero: { label: 'Score', value: 900 }, deepest: undefined, stats: [], recordNote: undefined })} />);
    expect(document.querySelector('[data-result-seal]')).not.toBeNull();
    expect(document.querySelector('[data-result-record]')!.textContent).toBe('New record!');
  });
});
