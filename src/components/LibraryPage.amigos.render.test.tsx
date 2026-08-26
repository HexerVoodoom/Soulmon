// @vitest-environment jsdom
/**
 * REGRESSAO DE `f1ce3848` (N-4) — A ABA AMIGOS DERIVAVA DO DIRETORIO PUBLICO.
 *
 * O caminho da quebra, arquivo a arquivo:
 *   `f1ce3848` poe `if (!p.pvpEnabled) continue;` em `action=players`
 *   (`functions/api/community.js:372`) → `listPlayers` passa a devolver SO quem
 *   consentiu → `LibraryPage` fazia
 *   `friendPlayers = (players ?? []).filter(p => friends.includes(p.id))`.
 *
 * Logo: um amigo JA ADICIONADO que nao ligou o PvP (ou cujo perfil e anterior
 * ao campo, `pvpEnabled: undefined`) sumia da aba Amigos. O vinculo no servidor
 * continuava intacto — so a RENDERIZACAO o perdia. Efeitos: o botao de presente
 * desaparecia, e o contador `Amigos N/5` (que le `friends.length`, o vinculo)
 * continuava contando alguem que a lista nao mostrava.
 *
 * O conserto NAO e reverter o filtro. Amizade e consentimento PROPRIO: quem me
 * adicionou aceitou me mostrar A ELE. Sair do diretorio publico nao e sair da
 * lista de amigos de quem ja me tem. Por isso a aba Amigos passa a resolver por
 * `action=player` (`getPlayer`, resolve por pid, sem gate de `pvpEnabled` —
 * `community.js:382`), e o diretorio segue filtrado.
 *
 * O ultimo teste daqui e o contrapeso: o conserto da regressao NAO pode reabrir
 * o furo que o `f1ce3848` fechou — quem nao consentiu continua fora da aba
 * Todos.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import type { DirectoryPlayer, PlayerDetail } from '../utils/community';

vi.mock('../utils/community', async (orig) => {
  const real = await orig<typeof import('../utils/community')>();
  return {
    ...real,
    listPlayers: vi.fn(), getPlayer: vi.fn(),
    addFriend: vi.fn(), removeFriend: vi.fn(), sendGift: vi.fn(),
  };
});

import { LibraryPage } from './LibraryPage';
import { listPlayers, getPlayer } from '../utils/community';

const perfil = (over: Partial<PlayerDetail> = {}): PlayerDetail => ({
  id: 'pid-x', name: 'Fulano', petName: 'Bichinho', stage: 'rookie',
  unlockedStages: ['rookie'], pvpEnabled: true, rankPoints: 0,
  daysPlaying: 3, tasksDone: 5, friends: [], wins: 0, losses: 0,
  ...over,
});

/** O amigo que o `f1ce3848` tirou do diretorio: NUNCA ligou o PvP. */
const RESERVADO = perfil({ id: 'pid-reservado', name: 'Reservado', pvpEnabled: false });

const props = (friends: string[]) => ({
  saveId: 'save-1',
  friends,
  canGiftToday: true,
  onFriendsChange: () => {},
  onGiftSent: () => {},
  language: 'pt-BR' as const,
});

/** Uma linha da lista = um botao "Ver o perfil de X". */
const linhas = () => screen.queryAllByRole('button', { name: /Ver o perfil de/ });

const abrirAmigos = () => {
  fireEvent.click(screen.getByRole('tab', { name: /Amigos/ }));
};

describe('LibraryPage — a aba Amigos nao deriva do diretorio publico', () => {
  beforeEach(() => {
    vi.mocked(listPlayers).mockReset();
    vi.mocked(getPlayer).mockReset();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('MOSTRA o amigo que nao consentiu com o diretorio (pvpEnabled: false)', async () => {
    // O servidor ja filtrou: o Reservado NAO vem em `players`.
    vi.mocked(listPlayers).mockResolvedValue({ players: [] });
    vi.mocked(getPlayer).mockResolvedValue({ found: true, player: RESERVADO });

    renderWithCss(<LibraryPage {...props(['pid-reservado'])} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    abrirAmigos();

    await waitFor(() => expect(screen.getByText('Reservado')).toBeTruthy());
    // E o botao de presente, que era o que a pessoa perdia na pratica.
    expect(screen.getByRole('button', { name: 'Enviar 20 Bits para Reservado' })).toBeTruthy();
  });

  it('NAO deixa o contador Amigos N/5 divergir da lista renderizada', async () => {
    vi.mocked(listPlayers).mockResolvedValue({ players: [] });
    vi.mocked(getPlayer).mockImplementation(async (id: string) =>
      ({ found: true, player: perfil({ id, name: `Amigo ${id.slice(-1)}`, pvpEnabled: false }) }));

    renderWithCss(<LibraryPage {...props(['pid-a', 'pid-b'])} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    abrirAmigos();

    await waitFor(() => expect(linhas().length).toBe(2));
    expect(screen.getByRole('tab', { name: /Amigos 2\/5/ })).toBeTruthy();
  });

  it('resolve os N amigos EM PARALELO — nao N requisicoes em serie', async () => {
    vi.mocked(listPlayers).mockResolvedValue({ players: [] });
    /** Segura TODAS as respostas: se fosse serie, so a 1a chamada teria saido. */
    const soltar: Array<() => void> = [];
    vi.mocked(getPlayer).mockImplementation((id: string) =>
      new Promise(res => soltar.push(() => res({ found: true, player: perfil({ id, name: `Amigo ${id.slice(-1)}` }) }))));

    renderWithCss(<LibraryPage {...props(['pid-a', 'pid-b', 'pid-c'])} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    abrirAmigos();

    // Nenhuma resolveu ainda, e as tres ja estao no ar.
    await waitFor(() => expect(vi.mocked(getPlayer)).toHaveBeenCalledTimes(3));
    await act(async () => { soltar.forEach(f => f()); });
    await waitFor(() => expect(linhas().length).toBe(3));
  });

  it('FALHA PARCIAL: um amigo que nao resolve nao pode sumir com a aba inteira', async () => {
    vi.mocked(listPlayers).mockResolvedValue({ players: [] });
    vi.mocked(getPlayer).mockImplementation(async (id: string) => {
      if (id === 'pid-b') throw new Error('502');
      return { found: true, player: perfil({ id, name: `Amigo ${id.slice(-1)}` }) };
    });

    renderWithCss(<LibraryPage {...props(['pid-a', 'pid-b', 'pid-c'])} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    abrirAmigos();

    // Os dois que resolveram aparecem…
    await waitFor(() => expect(screen.getByText('Amigo a')).toBeTruthy());
    expect(screen.getByText('Amigo c')).toBeTruthy();
    // …e o terceiro continua ocupando uma linha, para o contador nao mentir.
    expect(linhas().length).toBe(3);
    expect(screen.getByRole('tab', { name: /Amigos 3\/5/ })).toBeTruthy();
  });

  it('a aba TODOS continua respeitando o filtro do diretorio (N-4 intacto)', async () => {
    // O servidor filtrou o Reservado; o conserto da aba Amigos nao pode
    // re-injeta-lo no diretorio publico.
    vi.mocked(listPlayers).mockResolvedValue({
      players: [perfil({ id: 'pid-publico', name: 'Publico' }) as DirectoryPlayer],
    });
    vi.mocked(getPlayer).mockResolvedValue({ found: true, player: RESERVADO });

    renderWithCss(<LibraryPage {...props(['pid-reservado'])} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });

    await waitFor(() => expect(screen.getByText('Publico')).toBeTruthy());
    expect(screen.queryByText('Reservado')).toBeNull();

    // E ele SEGUE fora do diretorio mesmo depois de a aba Amigos resolve-lo.
    abrirAmigos();
    await waitFor(() => expect(screen.getByText('Reservado')).toBeTruthy());
    fireEvent.click(screen.getByRole('tab', { name: /Todos/ }));
    await waitFor(() => expect(screen.getByText('Publico')).toBeTruthy());
    expect(screen.queryByText('Reservado')).toBeNull();
  });
});
