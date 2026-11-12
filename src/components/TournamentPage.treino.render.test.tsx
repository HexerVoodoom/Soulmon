// @vitest-environment jsdom
/**
 * TREINO ("Sparring"), a 2a aba do Torneio (10/11/2026), no CLIENTE.
 * A ranqueada segue igual (aba padrão, cota de partidas, refresh de uma vez); o Treino lista 5 oponentes que o SERVIDOR sorteou,
 * sem número de ranking nem cota, e o "Refresh" é ilimitado (cada toque pede uma lista nova).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { xpForLevel, BOND_RANKED_MIN_LEVEL } from '../utils/bond';

const opp = (n: number) => ({ id: `p${n}`, name: `Amigo${n}`, petName: `Bicho${n}`, stage: 'rookie', duel: { level: 4 } });
const getSparOpponents = vi.fn();
const getOpponents = vi.fn();

vi.mock('../utils/community', async importOriginal => {
  const orig = await importOriginal<typeof import('../utils/community')>();
  return {
    ...orig,
    getOpponents: (...a: unknown[]) => getOpponents(...a),
    getSparOpponents: (...a: unknown[]) => getSparOpponents(...a),
    getRank: () => Promise.resolve({ rank: [], me: null }),
    getSeasonHistory: () => Promise.resolve({ seasons: [] }),
  };
});

import { TournamentPage } from './TournamentPage';

const props = {
  saveId: 'a'.repeat(32), petStage: 'rookie', onMatchPlayed: () => {}, trophies: [], language: 'pt-BR', emblems: 0,
  onEarnEmblems: () => {}, totalXP: xpForLevel(BOND_RANKED_MIN_LEVEL),
};

afterEach(() => { cleanup(); getSparOpponents.mockReset(); getOpponents.mockReset(); });

const setup = () => {
  getOpponents.mockResolvedValue({ opponents: [opp(1)], me: { duel: { level: 4 } }, matchesLeft: 5, rerolled: false });
  getSparOpponents.mockResolvedValue({ opponents: [1, 2, 3, 4, 5].map(opp), me: { duel: { level: 4 } } });
};

describe('Torneio: duas abas, Ranqueada e Treino', () => {
  it('a ranqueada é a aba padrão e não chama o Treino', async () => {
    setup();
    render(<TournamentPage {...props} />);
    expect(screen.getByRole('radio', { name: 'Ranqueada' }).getAttribute('aria-checked')).toBe('true');
    await waitFor(() => expect(screen.getByText(/partidas? restantes? hoje/)).toBeTruthy());
    expect(getSparOpponents).not.toHaveBeenCalled();
  });

  it('abaixo do Vínculo da Ranqueada o Treino segue aberto (12/11/2026); só a Ranqueada explica o requisito', () => {
    setup();
    render(<TournamentPage {...props} totalXP={0} />);
    expect(screen.queryByRole('radio', { name: 'Treino' })).not.toBeNull();
    expect(document.querySelector('[data-torneio-requisito]')).not.toBeNull();
  });

  it('o Treino lista os 5 do servidor, sem cota de partidas e sem número de ranking', async () => {
    setup();
    render(<TournamentPage {...props} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Treino' }));
    await waitFor(() => expect(document.querySelectorAll('[data-treino-oponente]').length).toBe(5));
    const treino = document.querySelector('[data-torneio-treino]') as HTMLElement;
    expect(treino.textContent).not.toMatch(/partidas? restantes?/);
    expect(treino.textContent).not.toMatch(/ranking|posição \d|lugar|pts/i);
    expect(treino.textContent).toMatch(/não muda a sua posição/);
  });

  it('Refresh é ilimitado: cada toque pede uma lista nova ao servidor, sem sumir', async () => {
    setup();
    render(<TournamentPage {...props} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Treino' }));
    await waitFor(() => expect(document.querySelectorAll('[data-treino-oponente]').length).toBe(5));
    for (let i = 0; i < 4; i++) {
      const antes = getSparOpponents.mock.calls.length;
      fireEvent.click(document.querySelector('[data-treino-refresh]') as HTMLElement);
      await waitFor(() => expect(getSparOpponents.mock.calls.length).toBe(antes + 1));
      await waitFor(() => expect(document.querySelector('[data-treino-refresh]')).not.toBeNull());
    }
    expect(getSparOpponents.mock.calls.length).toBe(5);
  });

  it('em inglês: Ranked | Sparring', async () => {
    setup();
    render(<TournamentPage {...props} language="en-US" />);
    expect(screen.getByRole('radio', { name: 'Ranked' })).toBeTruthy();
    fireEvent.click(screen.getByRole('radio', { name: 'Sparring' }));
    await waitFor(() => expect(document.querySelectorAll('[data-treino-oponente]').length).toBe(5));
    expect((document.querySelector('[data-torneio-treino]') as HTMLElement).textContent).toMatch(/never changes your rank/);
  });

  it('servidor antigo (erro): mostra o erro suave com tentar de novo, sem quebrar a ranqueada', async () => {
    setup();
    getSparOpponents.mockRejectedValue(new Error('unknown action'));
    render(<TournamentPage {...props} />);
    fireEvent.click(screen.getByRole('radio', { name: 'Treino' }));
    await waitFor(() => expect(screen.getByText(/Não deu para carregar o treino/)).toBeTruthy());
    fireEvent.click(screen.getByRole('radio', { name: 'Ranqueada' }));
    await waitFor(() => expect(screen.getByText(/partidas? restantes? hoje/)).toBeTruthy());
  });
});
