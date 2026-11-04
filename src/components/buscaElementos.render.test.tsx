// @vitest-environment jsdom
/**
 * Busca por elementos base (a mesma do Cambista: `ElementBaseSlots` + regra E) no Drive (Soulmons e Elementos) e nas Essências
 * (Laboratório > Arquivo). Regra pura + um render por tela.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';

vi.mock('../utils/community', async (orig) => {
  const real = await orig<typeof import('../utils/community')>();
  return {
    ...real,
    listPlayers: vi.fn(async () => ({ players: [
      { id: 'p1', name: 'Ana', petName: 'Brasa', element: 'fogo', stage: 'rookie', unlockedStages: ['rookie'], pvpEnabled: false, daysPlaying: 1 },
      { id: 'p2', name: 'Bia', petName: 'Onda', element: 'agua', stage: 'rookie', unlockedStages: ['rookie'], pvpEnabled: false, daysPlaying: 1 },
    ] })),
    getPlayer: vi.fn(async () => ({ found: false })), addFriend: vi.fn(), removeFriend: vi.fn(), sendGift: vi.fn(),
  };
});

import { LibraryPage } from './LibraryPage';
import { EssencesSection } from './EssencesSection';
import { ElementDex } from './ElementDex';
import { compositionHasBases, elementMatchesBases, elementsMatchingBases, selectedBases } from '../utils/elementPotion';
import { ALL_ELEMENT_IDS } from '../utils/elementDex';

const pick = (slot: number, base: string) => {
  fireEvent.click(document.querySelector(`[data-slot="${slot}"]`)!);
  fireEvent.click(document.querySelector(`[data-base="${base}"]`)!);
};

describe('filtro por bases — regra compartilhada', () => {
  it('sem escolha passa tudo; com escolha é E entre as bases', () => {
    expect(selectedBases([null, 'fogo', 'fogo', 'xyz'])).toEqual(['fogo']);
    expect(compositionHasBases(undefined, [null, null])).toBe(true);
    expect(compositionHasBases(undefined, ['fogo'])).toBe(false);
    expect(compositionHasBases(['fogo', 'agua'], ['fogo', 'agua'])).toBe(true);
    expect(compositionHasBases(['fogo'], ['fogo', 'agua'])).toBe(false);
    expect(elementMatchesBases('fogo', ['fogo'])).toBe(true);
    expect(elementMatchesBases('agua', ['fogo'])).toBe(false);
    expect(elementMatchesBases(undefined, ['fogo'])).toBe(false);
    expect(elementMatchesBases('pesadelo', [])).toBe(true);
    expect(ALL_ELEMENT_IDS.filter(id => elementMatchesBases(id, ['fogo']))).toEqual(elementsMatchingBases(['fogo']));
  });
});

describe('Essências (Laboratório > Arquivo)', () => {
  it('filtra pelas bases e mostra vazio PT quando nada bate', () => {
    renderWithCss(<EssencesSection essences={{ fogo: 2, agua: 1 }} language="pt-BR" />);
    expect(document.querySelectorAll('[data-essence]').length).toBe(2);
    pick(0, 'fogo');
    expect([...document.querySelectorAll('[data-essence]')].map(e => e.getAttribute('data-essence'))).toEqual(['fogo']);
    pick(1, 'agua');
    expect(document.querySelectorAll('[data-essence]').length).toBe(0);
    expect(screen.getByText('Nenhuma essência com essas bases.')).toBeTruthy();
  });
});

describe('Drive — Elementos', () => {
  it('com filtro mostra só os destrancados que batem; vazio EN', () => {
    renderWithCss(<ElementDex defeated={['fogo', 'agua']} language="en-US" />);
    pick(0, 'fogo');
    const cells = [...document.querySelectorAll('[data-element-cell]')].map(c => c.getAttribute('data-element-cell'));
    expect(cells).toEqual(['fogo']);
    pick(1, 'agua');
    expect(document.querySelectorAll('[data-element-cell]').length).toBe(0);
    expect(screen.getByText('No element with these bases.')).toBeTruthy();
  });
});

describe('Drive — Soulmons', () => {
  beforeEach(() => { vi.useFakeTimers({ shouldAdvanceTime: true }); });
  it('filtra a grade pelo elemento do Soulmon', async () => {
    renderWithCss(<LibraryPage saveId="s" friends={['p1', 'p2']} onFriendsChange={() => {}} view="directory" embedded language="en-US" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    const names = () => [...document.querySelectorAll('[data-pet-grid] button')].map(b => b.getAttribute('aria-label'));
    expect(names()).toEqual(expect.arrayContaining(['Brasa', 'Onda']));
    pick(0, 'agua');
    expect(names()).toEqual(['Onda']);
    pick(1, 'fogo');
    expect(document.querySelector('[data-pet-grid]')).toBeNull();
    expect(screen.getByText('No Soulmon with these bases.')).toBeTruthy();
  });
});
