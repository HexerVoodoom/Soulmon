// @vitest-environment jsdom
/**
 * BIBLIOTECA EM 4 ABAS (27/10/2026, D-01/D-02/D-05/D-06): Encontrados (a lista de sempre), Selvagem, Desgarrado e Elemento.
 * O dex de elementos começa trancado: "?" sem nome e sem ícone — nem no aria.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act, within } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';

vi.mock('../utils/community', async (orig) => {
  const real = await orig<typeof import('../utils/community')>();
  return { ...real, listPlayers: vi.fn(async () => ({ players: [] })), getPlayer: vi.fn(), addFriend: vi.fn(), removeFriend: vi.fn(), sendGift: vi.fn() };
});

import { LibraryPage } from './LibraryPage';
import { ENEMY_ROSTER } from '../utils/enemyRoster';
import { isStrayFoe } from '../utils/wildFoeLabel';
import { ALL_ELEMENT_IDS } from '../utils/elementDex';

const base = { saveId: 's', friends: [], onFriendsChange: () => {}, view: 'directory' as const, embedded: true };
const render = (over: Partial<Parameters<typeof LibraryPage>[0]> = {}, language: 'pt-BR' | 'en-US' = 'en-US') =>
  renderWithCss(<LibraryPage {...base} language={language} {...over} />);

describe('LibraryPage — abas do Hall', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });

  it('mostra as 3 abas (EN e PT), a primeira ativa, e Encontrados segue com a busca', async () => {
    render();
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    const tabs = screen.getAllByRole('tab');
    expect(tabs.map(t => t.textContent)).toEqual(['Encountered', 'Wild', 'Element']);
    expect(tabs[0].getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('textbox')).toBeTruthy();
  });

  it('PT: Encontrados · Selvagens · Elemento', () => {
    render({}, 'pt-BR');
    expect(screen.getAllByRole('tab').map(t => t.textContent)).toEqual(['Encontrados', 'Selvagens', 'Elemento']);
  });

  it('teclado: seta para a direita troca de aba', () => {
    render();
    fireEvent.keyDown(screen.getByRole('tab', { name: 'Encountered' }), { key: 'ArrowRight' });
    expect(screen.getByRole('tab', { name: 'Wild' }).getAttribute('aria-selected')).toBe('true');
  });

  it('Selvagem × Desgarrado dividem o roster pela regra de estágio, com contagem e silhueta', () => {
    const vistoSelvagem = ENEMY_ROSTER.find(e => !isStrayFoe(e.stage))!;
    render({ bestiary: [vistoSelvagem.key] });
    fireEvent.click(screen.getByRole('tab', { name: 'Wild' }));
    const totalSelvagem = ENEMY_ROSTER.filter(e => !isStrayFoe(e.stage)).length;
    const totalDesgarrado = ENEMY_ROSTER.filter(e => isStrayFoe(e.stage)).length;
    // Selvagem e Desgarrado moram na MESMA aba (28/10/2026): duas seções, cada uma com a sua contagem.
    expect(document.querySelector('[data-bestiary="wild"] [data-bestiary-count]')!.textContent).toBe(`1 / ${totalSelvagem}`);
    expect(document.querySelectorAll('[data-bestiary="wild"] [data-bestiary-cell]').length).toBe(totalSelvagem);
    expect(document.querySelector(`[data-bestiary-cell="${vistoSelvagem.key}"]`)!.getAttribute('data-seen')).toBe('1');
    expect(document.body.textContent).toContain('???');
    expect(document.querySelector('[data-bestiary="stray"] [data-bestiary-count]')!.textContent).toBe(`0 / ${totalDesgarrado}`);
    expect(document.querySelector(`[data-bestiary="stray"] [data-bestiary-cell="${vistoSelvagem.key}"]`)).toBeNull();
    expect(document.body.textContent).not.toMatch(/%|faltam|left to find/i);
  });

  it('Elemento: tudo trancado ("?" sem nome, ícone nem id no DOM) e destranca por defeatedElements', () => {
    render();
    fireEvent.click(screen.getByRole('tab', { name: 'Element' }));
    const painel = document.querySelector('[data-element-dex]') as HTMLElement;
    expect(painel.querySelectorAll('[data-element-cell="locked"]').length).toBe(ALL_ELEMENT_IDS.length);
    expect(painel.querySelector('img')).toBeNull();
    expect(painel.textContent).not.toMatch(/Fire|Water/);
    expect(painel.innerHTML).not.toContain('fogo');
    expect(document.querySelector('[data-element-count]')!.textContent).toBe('0 / 210');
  });

  it('Elemento destrancado abre a ficha com forte/fraco contra, e os trancados ali são "?"', () => {
    render({ defeatedElements: ['fogo', 'lava'] });
    fireEvent.click(screen.getByRole('tab', { name: 'Element' }));
    expect(document.querySelector('[data-element-count]')!.textContent).toBe('2 / 210');
    fireEvent.click(document.querySelector('[data-element-cell="fogo"]')!);
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText('Strong against')).toBeTruthy();
    expect(within(dlg).getByText('Weak against')).toBeTruthy();
    // fogo é forte contra planta e vida (ambos trancados): só "?"
    expect(dlg.querySelectorAll('[data-open="0"]').length).toBe(4);
    expect(dlg.textContent).not.toMatch(/Plant|Life/);
  });

  it('derivado mostra a composição (componentes destrancados aparecem com nome)', () => {
    render({ defeatedElements: ['vapor', 'fogo'] });
    fireEvent.click(screen.getByRole('tab', { name: 'Element' }));
    fireEvent.click(document.querySelector('[data-element-cell="vapor"]')!);
    const dlg = screen.getByRole('dialog');
    expect(within(dlg).getByText('Composition')).toBeTruthy();
    expect(dlg.querySelector('[data-dex-ref="fogo"]')).toBeTruthy();
    expect(dlg.querySelector('[data-dex-ref="agua"]')).toBeNull();
  });
});
