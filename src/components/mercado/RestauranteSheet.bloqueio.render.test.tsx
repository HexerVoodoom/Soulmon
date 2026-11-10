// @vitest-environment jsdom
/** Aviso padrão de ação bloqueada no Restaurante (09/11/2026): Cozinhar sem recurso continua tocável e lista o que falta. */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { GameStateProvider } from '../../contexts/GameStateContext';
import { STORAGE_KEYS } from '../../utils/storageKeys';
import { RestauranteSheet } from './RestauranteSheet';

beforeEach(() => { localStorage.clear(); });
afterEach(cleanup);

function abrir(language: 'pt-BR' | 'en-US') {
  localStorage.setItem(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], tasks: [], foodInventory: {}, gamePoints: 0 }));
  render(<GameStateProvider><RestauranteSheet language={language} /></GameStateProvider>);
}

describe('Restaurante › aviso de ação bloqueada', () => {
  it('sem recursos: o Cozinhar fica aria-disabled e o toque abre o aviso com o que falta', () => {
    abrir('pt-BR');
    const btn = document.querySelector<HTMLButtonElement>('[data-dish-cook]')!;
    expect(btn.getAttribute('aria-disabled')).toBe('true');
    expect(btn.disabled).toBe(false);
    act(() => { fireEvent.click(btn); });
    const aviso = document.querySelector('[data-blocked-action="recursos"]')!;
    expect(aviso).not.toBeNull();
    expect(aviso.textContent).toMatch(/tem 0, precisa de/);
    expect(aviso.textContent).toMatch(/Bits: tem 0/);
    expect(document.querySelector('[data-purchase-confirm], [data-shop-confirm]')).toBeNull();
    act(() => { fireEvent.click(document.querySelector('[data-blocked-ok]')!); });
    expect(document.querySelector('[data-blocked-action]')).toBeNull();
  });

  it('inglês', () => {
    abrir('en-US');
    act(() => { fireEvent.click(document.querySelector('[data-dish-cook]')!); });
    expect(document.querySelector('[data-blocked-action]')!.textContent).toMatch(/have 0, need/);
  });
});
