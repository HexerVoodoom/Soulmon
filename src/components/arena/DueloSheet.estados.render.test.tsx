// @vitest-environment jsdom
/** QA r4 (item 4) e §384: a escolha de adversários mostra cards vazios de espera enquanto o bestiário carrega, erro com "Try again" quando a
 *  carga falha (antes os cards sumiam calados), a linha "o último adversário dropa em dobro" e a ajuda do "Stray / Desgarrado". */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { ARENA_CHOICES } from '../../utils/arenaSorteio';

const H = vi.hoisted(() => ({ load: null as null | (() => Promise<unknown>) }));
vi.mock('../../utils/arena', async importOriginal => {
  const real = await importOriginal<typeof import('../../utils/arena')>();
  return { ...real, loadBestiaryPool: vi.fn(() => (H.load ? H.load() : real.loadBestiaryPool())) };
});
import { DueloSheet } from './DueloSheet';

const ARENA_PROPS = { dayIso: '2026-10-28', accountKey: 'conta-teste', bits: 100, onReroll: () => true };
afterEach(() => { cleanup(); H.load = null; });

describe('DueloSheet: estados da escolha de adversários', () => {
  it('carregando: placeholders no lugar dos cards (aria-busy), nunca vazio', () => {
    H.load = () => new Promise(() => {});
    const { container } = renderWithCss(<DueloSheet arena={ARENA_PROPS} language="en-US" onStart={() => {}} />);
    const ph = container.querySelector('[data-arena-escolha-carregando]') as HTMLElement;
    expect(ph.getAttribute('aria-busy')).toBe('true');
    expect(ph.querySelectorAll('[data-arena-card-placeholder]')).toHaveLength(ARENA_CHOICES);
  });

  it('falha: frase curta + "Try again", que recarrega e mostra os cards', async () => {
    let n = 0;
    H.load = () => (n++ === 0 ? Promise.reject(new Error('rede')) : Promise.resolve([]));
    const { container } = renderWithCss(<DueloSheet arena={ARENA_PROPS} language="en-US" onStart={() => {}} />);
    await waitFor(() => expect(container.querySelector('[data-arena-escolha-erro]')).not.toBeNull());
    expect(container.querySelector('[data-arena-escolha-erro]')!.textContent).toContain("Couldn't load the opponents right now.");
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Try again' })); });
    await waitFor(() => expect(container.querySelectorAll('[data-arena-card]')).toHaveLength(ARENA_CHOICES));
    expect(container.querySelector('[data-arena-escolha-erro]')).toBeNull();
  });

  it('PT: "Tentar de novo"', async () => {
    H.load = () => Promise.reject(new Error('rede'));
    renderWithCss(<DueloSheet arena={ARENA_PROPS} language="pt-BR" onStart={() => {}} />);
    expect(await screen.findByRole('button', { name: 'Tentar de novo' })).toBeTruthy();
  });

  it('§384: com os cards, uma linha diz que o último adversário dropa em dobro (EN e PT)', async () => {
    H.load = () => Promise.resolve([]);
    const en = renderWithCss(<DueloSheet arena={ARENA_PROPS} language="en-US" onStart={() => {}} />);
    await waitFor(() => expect(en.container.querySelector('[data-arena-ultimo-dobro]')?.textContent).toBe('The last opponent drops 2× its essence.'));
    cleanup();
    const pt = renderWithCss(<DueloSheet arena={ARENA_PROPS} language="pt-BR" onStart={() => {}} />);
    await waitFor(() => expect(pt.container.querySelector('[data-arena-ultimo-dobro]')?.textContent).toBe('O último adversário deixa 2× a essência dele.'));
  });

  it('a ajuda explica o "Stray / Desgarrado"', () => {
    H.load = () => new Promise(() => {});
    renderWithCss(<DueloSheet arena={ARENA_PROPS} language="en-US" onStart={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'How the Arena works' }));
    expect(document.querySelector('[data-duelo-ajuda-stray]')?.textContent).toMatch(/^Stray: /);
  });
});
