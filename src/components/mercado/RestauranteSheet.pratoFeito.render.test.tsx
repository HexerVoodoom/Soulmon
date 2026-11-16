// @vitest-environment jsdom
/**
 * Restaurante → "Prato feito" (16/11/2026, pedido do dono): cozinhar GUARDA o prato na pastinha (não serve na hora) e abre o modal
 * igual ao da poção criada; dois pratos seguidos agrupam em UM modal; usar da pastinha respeita a regra única (`specialItemUse`).
 */
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, fireEvent, screen, act } from '@testing-library/react';

import { installDomGlobals } from '../../test/renderEnv';
import type { CookState } from '../../utils/restaurant';
import { dishKey } from '../../utils/dishItems';
import { hungerAt } from '../../utils/hunger';

const MON = new Date('2026-11-02T12:00:00').getTime();
const seed = (): CookState => ({
  energyPoints: 0, evolutionStage: 'rookie',
  foodInventory: { '🥗': 9, '🧃': 9 }, gamePoints: 500, essences: { planta: 9 },
  hunger: { v: 10, at: MON - 1000 },
} as CookState);

let holder: { state: CookState } | null = null;
vi.mock('../../contexts/GameStateContext', async (orig) => {
  const real = await orig<typeof import('../../contexts/GameStateContext')>();
  return { ...real, useGameStateOptional: () => holder && ({ gameState: holder.state, setGameState: (fn: (p: CookState) => CookState) => { holder!.state = fn(holder!.state); } }) };
});
import { RestauranteSheet } from './RestauranteSheet';
import { PratoFeito } from '../PratoFeito';


beforeEach(() => { installDomGlobals(); vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(MON); holder = { state: seed() }; });
afterEach(() => { cleanup(); vi.useRealTimers(); holder = null; });

const cook = async (id: string) => {
  fireEvent.click(document.querySelector(`[data-dish-cook="${id}"]`)!);
  fireEvent.click(document.querySelector('[data-purchase-ok]')!);
  await act(async () => { await Promise.resolve(); });
};

describe('Restaurante: fazer um prato', () => {
  it('guarda na pastinha, NÃO serve na hora, e abre o modal "Done!" uma vez', async () => {
    const { rerender } = render(<RestauranteSheet language="en-US" />);
    await cook('salada-viva');
    rerender(<RestauranteSheet language="en-US" />);
    expect(holder!.state.foodInventory[dishKey('salada-viva')]).toBe(1);
    expect(hungerAt(holder!.state.hunger, MON)).toBeLessThan(11);
    expect(holder!.state.gamePoints).toBe(480);
    const modais = document.querySelectorAll('[data-prato-feito]');
    expect(modais).toHaveLength(1);
    expect(modais[0].getAttribute('aria-modal')).toBe('true');
    expect(document.querySelector('[data-prato-texto]')!.textContent).toBe('Done! Living Salad');
    expect(document.querySelector('[data-prato-guardado]')!.textContent).toContain('you have 1');
  });
  it('fazer o mesmo prato de novo com o modal aberto NÃO empilha: agrupa (×2) e conta a pastinha', async () => {
    const { rerender } = render(<RestauranteSheet language="en-US" />);
    await cook('salada-viva');
    rerender(<RestauranteSheet language="en-US" />);
    await cook('salada-viva');
    rerender(<RestauranteSheet language="en-US" />);
    expect(document.querySelectorAll('[data-prato-feito]')).toHaveLength(1);
    expect(document.querySelector('[data-prato-texto]')!.textContent).toBe('Done! Living Salad ×2');
    expect(document.querySelector('[data-prato-guardado]')!.textContent).toContain('you have 2');
  });
  it('recusa (falta ingrediente): nada gasto e nenhum modal', async () => {
    holder!.state = { ...seed(), essences: {} } as CookState;
    const { rerender } = render(<RestauranteSheet language="en-US" />);
    const btn = document.querySelector('[data-dish-cook="salada-viva"]') as HTMLButtonElement;
    expect(btn.disabled || btn.getAttribute('aria-disabled') === 'true').toBe(true);
    fireEvent.click(btn);
    rerender(<RestauranteSheet language="en-US" />);
    expect(holder!.state.gamePoints).toBe(500);
    expect(document.querySelector('[data-prato-feito]')).toBeNull();
  });
});

describe('PratoFeito (molde da poção criada)', () => {
  it('PT: "Feito!" + "Guardado na pastinha"; OK fecha e recebe o foco', () => {
    const onClose = vi.fn();
    render(<PratoFeito language="pt-BR" dishId="pao-de-faisca" made={1} inFolder={3} onClose={onClose} />);
    expect(document.querySelector('[data-prato-texto]')!.textContent).toBe('Feito! Pão de Faísca');
    expect(document.querySelector('[data-prato-guardado]')!.textContent).toBe('Guardado na pastinha · você tem 3');
    const ok = document.querySelector('[data-prato-ok]') as HTMLButtonElement;
    expect(document.activeElement).toBe(ok);
    fireEvent.click(ok);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('dialog').getAttribute('aria-label')).toBe('Feito! Pão de Faísca');
  });
  it('prato desconhecido não renderiza nada', () => {
    render(<PratoFeito language="en-US" dishId="nao-existe" made={1} inFolder={0} onClose={() => {}} />);
    expect(document.querySelector('[data-prato-feito]')).toBeNull();
  });
});
