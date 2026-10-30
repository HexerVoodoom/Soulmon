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
import { listPlayers, getPlayer, addFriend, sendGift } from '../utils/community';

const perfil = (over: Partial<PlayerDetail> = {}): PlayerDetail => ({
  id: 'pid-x', name: 'Fulano', petName: 'Bichinho', stage: 'rookie',
  unlockedStages: ['rookie'], pvpEnabled: true, 
  daysPlaying: 3, friends: [], wins: 0, losses: 0,
  ...over,
});

/** O amigo que o `f1ce3848` tirou do diretorio: NUNCA ligou o PvP. */
const RESERVADO = perfil({ id: 'pid-reservado', name: 'Reservado', pvpEnabled: false });

const props = (friends: string[]) => ({
  saveId: 'save-1',
  friends,
  onFriendsChange: () => {},
  language: 'pt-BR' as const,
});

/** Uma linha da lista = um botao "Ver o perfil de X". */
const pets = () => Array.from(document.querySelectorAll('[data-pet-grid] button'));
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
    // E a acao de remover amigo, que prova que a linha e de amigo (o presente saiu da Biblioteca, M4).
    expect(screen.getByRole('button', { name: 'Remover Reservado dos amigos' })).toBeTruthy();
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

describe('H17 (01/10/2026) — a Biblioteca do Hall mostra só os Soulmons já vistos', () => {
  beforeEach(() => {
    vi.mocked(listPlayers).mockReset();
    vi.mocked(getPlayer).mockReset();
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('C6: sem abrir ninguém a lista não mostra desconhecidos; abrir guarda; a lista mostra o nome da CRIATURA, em ordem alfabética, e a busca filtra pelo nome dela', async () => {
    vi.mocked(listPlayers).mockResolvedValue({
      players: [
        perfil({ id: 'pid-z', name: 'Ana', petName: 'Zorro' }) as DirectoryPlayer,
        perfil({ id: 'pid-a', name: 'Bia', petName: 'Abelhudo' }) as DirectoryPlayer,
        perfil({ id: 'pid-nunca', name: 'Caio', petName: 'Nunca' }) as DirectoryPlayer,
      ],
    });
    const r = renderWithCss(<LibraryPage {...props([])} embedded view="directory" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    await waitFor(() => expect(screen.getByText(/ficam guardados nesta lista/)).toBeTruthy());
    expect(linhas()).toHaveLength(0);
    // o servidor foi consultado SEM termo: a busca do Hall é local
    expect(vi.mocked(listPlayers).mock.calls.every(c => !c[0])).toBe(true);

    // Marca dois como vistos, abrindo-os (via localStorage da própria tela: abre pela busca local não existe sem vistos).
    localStorage.setItem('soulmon-library-seen', JSON.stringify(['pid-z', 'pid-a']));
    r.unmount();
    renderWithCss(<LibraryPage {...props([])} embedded view="directory" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    await waitFor(() => expect(pets()).toHaveLength(2));
    expect(pets().map(b => b.getAttribute('aria-label'))).toEqual(['Abelhudo', 'Zorro']);
    fireEvent.click(pets()[1]);
    expect(await screen.findByRole('dialog')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Fechar/ }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.queryByText('Nunca')).toBeNull();

    fireEvent.change(screen.getByRole('textbox', { name: /Buscar Soulmon/ }), { target: { value: 'zor' } });
    await waitFor(() => expect(pets()).toHaveLength(1));
  });
});

describe('C7 — Amigos: adicionar pelo nome', () => {
  beforeEach(() => {
    vi.mocked(listPlayers).mockReset();
    vi.mocked(getPlayer).mockReset();
    vi.mocked(addFriend).mockReset();
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  const digitar = (v: string) => {
    fireEvent.change(screen.getByRole('textbox', { name: /Nome do amigo/ }), { target: { value: v } });
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar' }));
  };

  it('digitar o nome e tocar Adicionar chama addFriend com o id achado e avisa a tela', async () => {
    vi.mocked(getPlayer).mockResolvedValue({ found: true, player: perfil({ id: 'pid-lia', name: 'Lia' }) });
    vi.mocked(listPlayers).mockResolvedValue({ players: [perfil({ id: 'pid-lia', name: 'Lia' }) as DirectoryPlayer] });
    vi.mocked(addFriend).mockResolvedValue({ ok: true, friends: ['pid-lia'] });
    const onFriendsChange = vi.fn();
    renderWithCss(<LibraryPage {...props([])} onFriendsChange={onFriendsChange} embedded view="friends" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    digitar('lia');
    await waitFor(() => expect(addFriend).toHaveBeenCalledWith('save-1', 'pid-lia'));
    await waitFor(() => expect(onFriendsChange).toHaveBeenCalledWith(['pid-lia']));
    expect(document.querySelector('[data-friend-add-msg]')!.textContent).toMatch(/Lia entrou/);
  });

  it('nome que ninguém tem: avisa, sem addFriend', async () => {
    vi.mocked(listPlayers).mockResolvedValue({ players: [] });
    renderWithCss(<LibraryPage {...props([])} embedded view="friends" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    digitar('Fantasma');
    await waitFor(() => expect(document.querySelector('[data-friend-add-msg]')!.textContent).toMatch(/Não achei ninguém/));
    expect(addFriend).not.toHaveBeenCalled();
  });

  it('M4/QA: o presente vive SÓ no Círculo de Amigos (view=friends); a Biblioteca (view=directory) nunca o oferece, nem para amigo', async () => {
    vi.mocked(getPlayer).mockResolvedValue({ found: true, player: perfil({ id: 'pid-lia', name: 'Lia' }) });
    vi.mocked(listPlayers).mockResolvedValue({ players: [] });
    const { unmount } = renderWithCss(<LibraryPage {...props(['pid-lia'])} embedded view="directory" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    const labels = Array.from(document.querySelectorAll('button')).map(b => `${b.getAttribute('aria-label') ?? ''} ${b.textContent}`).join('|');
    expect(labels).not.toMatch(/presente|gift|volunteer_activism|Bits/i);
    unmount();
    renderWithCss(<LibraryPage {...props(['pid-lia'])} canGiftToday embedded view="friends" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    await screen.findByRole('button', { name: /Remover Lia/ });
    expect(screen.getByRole('button', { name: 'Enviar 20 Bits para Lia' })).toBeTruthy();
  });

  it('presente no Círculo: sem a meta do dia fica inerte (aria-disabled) com o motivo; com a meta do dia chama sendGift e marca como já presenteado', async () => {
    vi.mocked(getPlayer).mockResolvedValue({ found: true, player: perfil({ id: 'pid-lia', name: 'Lia' }) });
    vi.mocked(listPlayers).mockResolvedValue({ players: [] });
    vi.mocked(sendGift).mockResolvedValue({} as never);
    const onGiftSent = vi.fn();
    const { unmount } = renderWithCss(<LibraryPage {...props(['pid-lia'])} embedded view="friends" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    const inerte = await screen.findByRole('button', { name: 'Termine as tarefas de hoje para presentear' });
    expect(inerte.getAttribute('aria-disabled')).toBe('true');
    fireEvent.click(inerte);
    expect(sendGift).not.toHaveBeenCalled();
    unmount();
    renderWithCss(<LibraryPage {...props(['pid-lia'])} canGiftToday onGiftSent={onGiftSent} embedded view="friends" />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    fireEvent.click(await screen.findByRole('button', { name: 'Enviar 20 Bits para Lia' }));
    await waitFor(() => expect(sendGift).toHaveBeenCalledWith('save-1', 'pid-lia'));
    await waitFor(() => expect(onGiftSent).toHaveBeenCalledWith('pid-lia'));
    expect(await screen.findByRole('button', { name: 'Já presenteado hoje' })).toBeTruthy();
  });
});
