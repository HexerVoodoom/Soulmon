// @vitest-environment jsdom
/**
 * BOSS FIGHT SCREEN — replay do chefe da Feira + resultado `kind: 'boss'`.
 * Só AGREGADO: a barra é a do pool do clã e a única cifra é o dano do próprio jogador.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { BossFightScreen } from './BossFightScreen';
import type { FightEvent } from '../../utils/combate/fight';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const ev = (kind: FightEvent['kind'], t: number, side: 0 | 1, frac: number, hp: [number, number] = [1, 1]): FightEvent => ({ kind, t, side, frac, hp, energy: [0, 0] });
const events: FightEvent[] = [
  ev('attack', 1, 0, 0.02), ev('attack', 2, 1, 0.1, [0.9, 1]), ev('cast', 3, 0, 0), ev('attack', 3, 0, 0.06), ev('attack', 4, 0, 0.02),
];
const base = {
  language: 'en-US' as const, bossId: 'arauto-do-fim', level: 15, poolPctBefore: 62, poolPctAfter: 55, myDamage: 1000, events,
  me: { sprite: 'me.png', name: 'Igni', element: 'fogo' }, onDone: () => {},
};

describe('BossFightScreen', () => {
  it('toca o replay no modo boss (pool agregado) e abre o resultado ao fim', () => {
    vi.useFakeTimers();
    const { container } = render(<BossFightScreen {...base} />);
    expect(container.querySelector('[data-boss-fight]')).not.toBeNull();
    const bar = () => container.querySelector('[data-stage-boss-bar]')!;
    expect(bar().getAttribute('data-stage-boss-pct')).toBe('62');
    expect(bar().textContent).toContain('Herald of the End');
    expect(bar().textContent).toContain('Lv 15');
    act(() => { vi.advanceTimersByTime(2200); });
    expect(Number(bar().getAttribute('data-stage-boss-pct'))).toBeLessThan(62);
    act(() => { vi.advanceTimersByTime(6000); });
    expect(container.querySelector('[data-result-kind="boss"]')).not.toBeNull();
    expect(screen.getByText('You dealt 1000 damage.')).toBeTruthy();
  });

  it('resultado: o chefe foge (nunca "falhou"), só o dano do próprio jogador e o pool', () => {
    const { container } = render(<BossFightScreen {...base} skipReplay />);
    expect(container.querySelector('[data-result-title]')!.textContent).toBe('Herald of the End fled, for now');
    expect(container.querySelector('[data-result-pool-pct]')).not.toBeNull();
    expect(container.querySelector('[data-result-row]')).toBeNull(); // sem recompensa fora do abate
    expect(container.textContent!.toLowerCase()).not.toMatch(/fail|falh/);
  });

  it('abate em PT: "O caminho abriu" com seiva da Casa e Emblemas', () => {
    const { container } = render(<BossFightScreen {...base} language="pt-BR" poolPctAfter={0} rewards={{ sap: 40, emblems: 3 }} skipReplay />);
    expect(container.querySelector('[data-result-title]')!.textContent).toBe('O caminho abriu');
    expect(screen.getByText('Seiva da Casa')).toBeTruthy();
    expect(container.querySelector('[data-result-sap]')!.textContent).toBe('+40');
    expect(container.querySelector('[data-result-honor]')!.textContent).toBe('+3');
    expect(screen.getByText('Você causou 1000 de dano.')).toBeTruthy();
  });
});
