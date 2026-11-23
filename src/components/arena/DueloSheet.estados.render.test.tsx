// @vitest-environment jsdom
/** QA r4 (item 4) e §384: a escolha de adversários mostra cards vazios de espera enquanto o bestiário carrega, erro com "Try again" quando a
 *  carga falha (antes os cards sumiam calados), a linha "o último adversário dropa em dobro" e a ausencia do rotulo "Stray / Desgarrado" nas linhas. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, cleanup, act, waitFor } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { ARENA_CHOICES, arenaCards, arenaRunIsStray } from '../../utils/arenaSorteio';

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

  it('folha limpa: sem a linha do último adversário nem texto explicativo acima dos cards (EN e PT)', async () => {
    H.load = () => Promise.resolve([]);
    for (const lang of ['en-US', 'pt-BR'] as const) {
      const r = renderWithCss(<DueloSheet arena={ARENA_PROPS} language={lang} onStart={() => {}} />);
      await waitFor(() => expect(r.container.querySelector('[data-arena-escolha]')).not.toBeNull());
      expect(r.container.querySelector('[data-arena-ultimo-dobro]')).toBeNull();
      expect(r.container.querySelector('[data-arena-escolha]')!.querySelector('p:not([data-arena-reroll-faltam])')).toBeNull();
      cleanup();
    }
  });

  it('regressao: a linha do adversario mostra so o elemento, sem "Stray"/"Desgarrado" (mesmo em run stray, EN e PT)', async () => {
    H.load = () => Promise.resolve([]);
    let achouStray = false;
    for (const lang of ['en-US', 'pt-BR'] as const) {
      for (let d = 1; d <= 28; d++) {
        const dayIso = `2026-11-${String(d).padStart(2, '0')}`;
        const seeds = arenaCards(dayIso, 'conta-teste', 0);
        if (seeds.some(sd => arenaRunIsStray(sd, 999))) achouStray = true;
        const { container } = renderWithCss(<DueloSheet arena={{ ...ARENA_PROPS, dayIso, ladder: 999 }} language={lang} onStart={() => {}} />);
        await waitFor(() => expect(container.querySelectorAll('[data-arena-card]')).toHaveLength(ARENA_CHOICES));
        expect(container.querySelector('[data-arena-stray]')).toBeNull();
        container.querySelectorAll('[data-arena-card]').forEach(c => expect(c.textContent).not.toMatch(/stray|desgarrado|·/i));
        cleanup();
      }
    }
    expect(achouStray).toBe(true);
  });

  it('"Comprar convites" é o PRIMEIRO item da folha, mostra o custo (1 energia = N convites) e chama a troca', () => {
    H.load = () => new Promise(() => {});
    const onExchange = vi.fn(() => true);
    const inv = { count: 2, max: 7, perEnergy: 5, canExchange: true, onExchange, onBegin: () => true };
    const { container } = renderWithCss(<DueloSheet arena={{ ...ARENA_PROPS, invites: inv }} language="pt-BR" onStart={() => {}} />);
    const raiz = container.querySelector('[data-duelo]') as HTMLElement;
    const btn = container.querySelector('[data-duelo-comprar]') as HTMLButtonElement;
    expect(raiz.firstElementChild!.contains(btn)).toBe(true);
    expect(btn.textContent).toContain('Comprar convites');
    expect(btn.querySelector('[data-energy-cost="1"]')).toBeTruthy();
    expect(container.querySelector('[data-duelo-convites-count]')!.textContent).toBe('1 energia = 5 convites');
    fireEvent.click(btn);
    expect(onExchange).toHaveBeenCalledTimes(1);
  });

  it('conta paga com 1 convite: o custo mostra 7 convites por energia (EN)', () => {
    H.load = () => new Promise(() => {});
    const inv = { count: 1, max: 7, perEnergy: 7, canExchange: true, onExchange: () => true, onBegin: () => true };
    const { container } = renderWithCss(<DueloSheet arena={{ ...ARENA_PROPS, invites: inv }} language="en-US" onStart={() => {}} />);
    expect(container.querySelector('[data-duelo-convites-count]')!.textContent).toBe('1 energy = 7 invites');
  });

  it.each([0, 1, 2])('com %i convites o botão de comprar APARECE (0 nunca tranca a Arena)', (count) => {
    H.load = () => new Promise(() => {});
    const inv = { count, max: 7, perEnergy: 5, canExchange: true, onExchange: () => true, onBegin: () => true };
    const { container } = renderWithCss(<DueloSheet arena={{ ...ARENA_PROPS, invites: inv }} language="pt-BR" onStart={() => {}} />);
    expect(container.querySelector('[data-duelo-comprar]')).not.toBeNull();
    expect(container.querySelector('[data-duelo-convites-count]')).not.toBeNull();
  });

  it.each([3, 5, 7])('com %i convites o botão e o texto de custo NÃO são renderizados; Lutar segue', async (count) => {
    H.load = () => Promise.resolve([]);
    const inv = { count, max: 7, perEnergy: 5, canExchange: true, onExchange: () => true, onBegin: () => true };
    const { container } = renderWithCss(<DueloSheet arena={{ ...ARENA_PROPS, invites: inv }} language="en-US" onStart={() => {}} />);
    expect(container.querySelector('[data-duelo-comprar]')).toBeNull();
    expect(container.querySelector('[data-duelo-convites]')).toBeNull();
    await waitFor(() => expect(container.querySelectorAll('[data-arena-card-fight]')).toHaveLength(ARENA_CHOICES));
    for (const b of Array.from(container.querySelectorAll<HTMLButtonElement>('[data-arena-card-fight]'))) expect(b.disabled).toBe(false);
  });

  it('§489: cada card é a linha compartilhada (mini-visor + "Fight" 44 px) e o sorteio mantém o custo da Arena', async () => {
    H.load = () => Promise.resolve([]);
    const { container } = renderWithCss(<DueloSheet arena={{ ...ARENA_PROPS, reroll: { day: '2026-10-28', count: 99, hour: new Date().toISOString().slice(0, 13), hcount: 99 } }} language="en-US" onStart={() => {}} />);
    await waitFor(() => expect(container.querySelectorAll('[data-arena-card]')).toHaveLength(ARENA_CHOICES));
    for (const card of container.querySelectorAll('[data-arena-card]')) {
      expect(card.querySelector('[data-mini-glass] img')).not.toBeNull();
      expect(card.querySelector('[data-arena-card-fight]')!.textContent).toBe('Fight');
    }
    expect(container.querySelector('[data-arena-reroll-label]')!.textContent).toMatch(/^Draw again · \d+ Bits$/);
  });
});
