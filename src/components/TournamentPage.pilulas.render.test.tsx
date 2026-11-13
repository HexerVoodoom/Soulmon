// @vitest-environment jsdom
/** Torneio (11/11/2026): "Temporada atual" e "Última temporada" são pílulas SEPARADAS (a atual à esquerda). */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup, waitFor } from '@testing-library/react';
import { xpForLevel, BOND_RANKED_MIN_LEVEL } from '../utils/bond';

vi.mock('../utils/community', async importOriginal => {
  const orig = await importOriginal<typeof import('../utils/community')>();
  return {
    ...orig,
    getOpponents: () => Promise.resolve({ opponents: [], me: { duel: { level: 4 } }, matchesLeft: 5, rerolled: false }),
    getSparOpponents: () => Promise.resolve({ opponents: [], me: null }),
    getRank: () => Promise.resolve({ rank: [], me: null }),
    getSeasonHistory: () => Promise.resolve({ seasons: [] }),
  };
});

import { TournamentPage } from './TournamentPage';

const props = {
  saveId: 'a'.repeat(32), petStage: 'rookie', onMatchPlayed: () => {}, trophies: [], emblems: 0,
  onEarnEmblems: () => {}, totalXP: xpForLevel(BOND_RANKED_MIN_LEVEL),
};
afterEach(cleanup);

describe('Torneio: pílulas de temporada separadas', () => {
  it.each([['pt-BR', 'Temporada atual', 'Última temporada'], ['en', 'Current season', 'Last season']])('%s', async (language, atual, ultima) => {
    render(<TournamentPage {...props} language={language} />);
    await waitFor(() => expect(document.querySelector('[data-torneio-posicao-atual]')).toBeTruthy());
    const a = document.querySelector('[data-torneio-posicao-atual]') as HTMLElement;
    const u = document.querySelector('[data-torneio-ultima-temporada]') as HTMLElement;
    expect(a).not.toBe(u);
    expect(a.contains(u) || u.contains(a)).toBe(false);
    expect(a.textContent).toContain(atual);
    expect(a.textContent).toContain('—');
    expect(a.textContent).not.toContain(ultima);
    expect(u.textContent).toContain(ultima);
    expect(u.textContent).not.toContain(atual);
    expect(a.compareDocumentPosition(u) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
