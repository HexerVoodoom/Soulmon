// @vitest-environment jsdom
/**
 * AVISO "NEW" DA BIBLIOTECA (01/11/2026, pedido do dono): 1 aviso discreto (mesmo para 2+ entradas), selo NEW sobre o ícone
 * do que entrou, e o selo some na abertura seguinte da Biblioteca.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, act, render as rtlRender } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';

const toastMock = vi.fn();
vi.mock('sonner', () => ({ toast: (...a: unknown[]) => toastMock(...a) }));
vi.mock('../utils/community', async (orig) => {
  const real = await orig<typeof import('../utils/community')>();
  return { ...real, listPlayers: vi.fn(async () => ({ players: [] })), getPlayer: vi.fn(), addFriend: vi.fn(), removeFriend: vi.fn(), sendGift: vi.fn() };
});

import { LibraryPage } from './LibraryPage';
import { LIBRARY_NEW_TOAST_ID, LibraryNewNoticeContent, useLibraryNewNotice } from './LibraryNewBadge';
import { ENEMY_ROSTER } from '../utils/enemyRoster';
import { ackLibrary } from '../utils/libraryNew';

const wild = ENEMY_ROSTER.filter(e => e.stage === 'rookie').slice(0, 3).map(e => e.key);
const base = { saveId: 's', friends: [], onFriendsChange: () => {}, view: 'directory' as const, embedded: true, language: 'en-US' as const };

function Probe({ count }: { count: number }) { useLibraryNewNotice(count); return null; }

describe('aviso NEW', () => {
  beforeEach(() => { toastMock.mockClear(); });

  it('texto exato com o ícone NEW', () => {
    rtlRender(<LibraryNewNoticeContent />);
    expect(screen.getByText('A new entry has been recorded to the library')).toBeTruthy();
    expect(screen.getByText('NEW')).toBeTruthy();
  });

  it('abrir com pendências não avisa; subir 1 ou 3 de uma vez = UM aviso, sempre o mesmo id', () => {
    const r = rtlRender(<Probe count={2} />);
    expect(toastMock).not.toHaveBeenCalled();
    r.rerender(<Probe count={5} />);
    expect(toastMock).toHaveBeenCalledTimes(1);
    expect(toastMock.mock.calls[0][1]).toMatchObject({ id: LIBRARY_NEW_TOAST_ID });
    r.rerender(<Probe count={5} />);
    expect(toastMock).toHaveBeenCalledTimes(1);
    r.rerender(<Probe count={0} />);
    r.rerender(<Probe count={1} />);
    expect(toastMock).toHaveBeenCalledTimes(2);
    expect(toastMock.mock.calls[1][1]).toMatchObject({ id: LIBRARY_NEW_TOAST_ID });
  });

  it('selo NEW sobre o recém-registrado; a abertura grava o visto e na próxima o selo some', async () => {
    let state = { bestiary: wild, defeatedElements: ['fogo', 'geiser'], strayPlayersSeen: [], libraryAck: { b: 2, e: 1, s: 0 } };
    const onLibraryOpened = vi.fn(() => { state = ackLibrary(state); });
    const v1 = renderWithCss(<LibraryPage {...base} {...state} onLibraryOpened={onLibraryOpened} />);
    expect(onLibraryOpened).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('tab', { name: 'Wild' }));
    await act(async () => {});
    const cells = wild.map(k => document.querySelector(`[data-bestiary-cell="${k}"]`)!);
    expect(cells[0].querySelector('[data-library-new-badge]')).toBeNull();
    expect(cells[1].querySelector('[data-library-new-badge]')).toBeNull();
    expect(cells[2].querySelector('[data-library-new-badge]')).not.toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Element' }));
    await act(async () => {});
    expect(document.querySelector('[data-element-cell="geiser"] [data-library-new-badge]')).not.toBeNull();
    expect(document.querySelector('[data-element-cell="fogo"] [data-library-new-badge]')).toBeNull();
    v1.unmount();

    expect(state.libraryAck).toEqual({ b: 3, e: 2, s: 0 });
    renderWithCss(<LibraryPage {...base} {...state} onLibraryOpened={onLibraryOpened} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Wild' }));
    await act(async () => {});
    expect(document.querySelectorAll('[data-library-new-badge]').length).toBe(0);
  });
});
