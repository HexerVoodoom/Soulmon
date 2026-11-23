// @vitest-environment jsdom
/**
 * §439: "adiciono um amigo e logo depois ele some". A lista local (`gameState.friends`) só mudava com a resposta de uma ação;
 * o servidor é a fonte (aceite do outro lado liga os dois, perfil regravado). A tela agora adota a lista do servidor ao
 * ler o estado social: amigo ligado fora daqui aparece, e amigo que o servidor já não tem some em vez de ficar de fantasma.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { screen, waitFor, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import type { PlayerDetail } from '../utils/community';

vi.mock('../utils/community', async (orig) => {
  const real = await orig<typeof import('../utils/community')>();
  return { ...real, listPlayers: vi.fn(), getPlayer: vi.fn(), getFriendsState: vi.fn(), getFriendForms: vi.fn(async () => ({ forms: [] })), markFriendsSeen: vi.fn(async () => ({ ok: true })) };
});

import { LibraryPage } from './LibraryPage';
import { listPlayers, getPlayer, getFriendsState, type FriendsState } from '../utils/community';

const estado = (over: Partial<FriendsState> = {}): FriendsState => ({ friends: [], incoming: [], outgoing: [], sentToday: [], notes: [], unseen: 0, limit: 20, ...over });
const perfil = (id: string, name: string): PlayerDetail => ({ id, name, petName: 'Bicho', stage: 'rookie', unlockedStages: ['rookie'], pvpEnabled: true, daysPlaying: 3, friends: [], wins: 0, losses: 0 });

/** Dono do estado como o App: a lista vive fora da tela e sobrevive a ela. */
function Casca({ inicial }: { inicial: string[] }) {
  const [friends, setFriends] = useState(inicial);
  return <LibraryPage saveId="save-1" friends={friends} onFriendsChange={setFriends} language="pt-BR" />;
}
const linhas = () => screen.queryAllByRole('button', { name: /Ver o perfil de/ });

describe('lista de amigos acompanha o servidor', () => {
  beforeEach(() => {
    vi.mocked(getFriendsState).mockReset();
    vi.mocked(listPlayers).mockReset().mockResolvedValue({ players: [] });
    vi.mocked(getPlayer).mockReset().mockImplementation(async (id: string) => ({ found: true, player: perfil(id, id === 'pid-bia' ? 'Bia' : 'Caio') }));
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  it('amigo ligado pelo aceite do outro lado aparece sem nenhuma ação desta tela', async () => {
    vi.mocked(getFriendsState).mockResolvedValue(estado({ friends: ['pid-bia'] }));
    renderWithCss(<Casca inicial={[]} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    fireEvent.click(screen.getByRole('tab', { name: /Amigos/ }));
    await waitFor(() => expect(linhas().length).toBe(1));
    expect(screen.getByText('Bia')).toBeTruthy();
  });

  it('amigo que o servidor já não tem não fica de fantasma na lista local', async () => {
    vi.mocked(getFriendsState).mockResolvedValue(estado({ friends: ['pid-bia'] }));
    renderWithCss(<Casca inicial={['pid-bia', 'pid-caio']} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    fireEvent.click(screen.getByRole('tab', { name: /Amigos/ }));
    await waitFor(() => expect(linhas().length).toBe(1));
    expect(screen.queryByText('Caio')).toBeNull();
  });

  it('lista igual à do servidor continua igual (sem loop nem piscada)', async () => {
    vi.mocked(getFriendsState).mockResolvedValue(estado({ friends: ['pid-bia'] }));
    renderWithCss(<Casca inicial={['pid-bia']} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    fireEvent.click(screen.getByRole('tab', { name: /Amigos/ }));
    await waitFor(() => expect(linhas().length).toBe(1));
    expect(vi.mocked(getFriendsState)).toHaveBeenCalledTimes(1);
  });
});
