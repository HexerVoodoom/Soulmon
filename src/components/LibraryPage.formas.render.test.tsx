// @vitest-environment jsdom
/** Pedido do dono (31/10/2026): tocar num Soulmon da Biblioteca mostra TODAS as formas ja vistas, a atual marcada. */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import type { DirectoryPlayer } from '../utils/community';

vi.mock('../utils/community', async (orig) => {
  const real = await orig<typeof import('../utils/community')>();
  return { ...real, listPlayers: vi.fn(), getPlayer: vi.fn(), getFriendForms: vi.fn(), addFriend: vi.fn(), removeFriend: vi.fn(), sendGift: vi.fn() };
});
import { LibraryPage } from './LibraryPage';
import { listPlayers, getPlayer, getFriendForms } from '../utils/community';

const OK = 'https://images.higgs.ai/';
const AMIGO = { id: 'pid-amigo', name: 'Ami', petName: 'Brasinha', stage: 'mega-power', element: 'fogo', spriteUrl: OK + 'mega.png', unlockedStages: [], pvpEnabled: true, daysPlaying: 9 } as DirectoryPlayer;
const props = { saveId: 'save-1', friends: ['pid-amigo'], onFriendsChange: () => {}, language: 'pt-BR' as const, embedded: true, view: 'directory' as const };

describe('Biblioteca — formas ja vistas', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.mocked(listPlayers).mockReset().mockResolvedValue({ players: [AMIGO] });
    vi.mocked(getFriendForms).mockReset();
    vi.mocked(getPlayer).mockReset().mockResolvedValue({ found: true, player: { ...AMIGO, friends: [], wins: 0, losses: 0 } });
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('amigo: o modal lista as formas do servidor + a atual, ordenadas, sem duplicar, com a atual marcada', async () => {
    vi.mocked(getFriendForms).mockResolvedValue({ forms: [
      { stage: 'rookie', spriteUrl: OK + 'r.png', element: 'fogo', date: 1 },
      { stage: 'champion-power', spriteUrl: OK + 'c.png', element: 'fogo', date: 2 },
      { stage: 'mega-power', spriteUrl: OK + 'mega.png', element: 'fogo', date: 3 },
      { stage: 'ultra', spriteUrl: 'https://atacante.example/u.png', element: 'fogo', date: 4 },
    ] });
    renderWithCss(<LibraryPage {...props} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    const botao = await screen.findByRole('button', { name: 'Brasinha' });
    await waitFor(() => expect(vi.mocked(getFriendForms)).toHaveBeenCalledWith('save-1', 'pid-amigo'));
    await act(async () => { await vi.advanceTimersByTimeAsync(50); });
    fireEvent.click(botao);
    await waitFor(() => expect(document.querySelectorAll('[data-pet-form]').length).toBe(4));
    const itens = Array.from(document.querySelectorAll('[data-pet-form]'));
    expect(itens.map(i => i.getAttribute('data-pet-form'))).toEqual(['rookie', 'champion-power', 'mega-power', 'ultra']);
    expect(itens.filter(i => i.getAttribute('data-current') === '1').map(i => i.getAttribute('data-pet-form'))).toEqual(['mega-power']);
    expect(screen.getByText('Forma atual')).toBeTruthy();
    expect(screen.getByText('Campeão · Poder')).toBeTruthy();
    const srcs = Array.from(document.querySelectorAll('[data-pet-form] > img')).map(i => i.getAttribute('src') ?? '');
    expect(srcs.some(s => s.includes('atacante'))).toBe(false);
  });

  it('sem historico do servidor: so a forma atual (forma nao vista nao aparece)', async () => {
    vi.mocked(getFriendForms).mockRejectedValue(new Error('403'));
    renderWithCss(<LibraryPage {...props} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    fireEvent.click(await screen.findByRole('button', { name: 'Brasinha' }));
    await waitFor(() => expect(document.querySelectorAll('[data-pet-form]').length).toBe(1));
    expect(document.querySelector('[data-pet-form]')!.getAttribute('data-current')).toBe('1');
  });

  it('ingles: rotulos em EN', async () => {
    vi.mocked(getFriendForms).mockResolvedValue({ forms: [] });
    renderWithCss(<LibraryPage {...props} language="en-US" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    fireEvent.click(await screen.findByRole('button', { name: 'Brasinha' }));
    expect(await screen.findByText('Current form')).toBeTruthy();
    expect(screen.getByText('Mega · Power')).toBeTruthy();
  });
});
