// @vitest-environment jsdom
/**
 * "Sair da conta" (fix/logout-limpa-estado): sincroniza antes; se não der, AVISA
 * (PT/EN, sem culpa), oferece "Exportar backup" e só apaga quando a pessoa
 * escolhe. Sem pendência, sai direto e limpa o estado local da conta.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';

const { signOut, reload } = vi.hoisted(() => ({ signOut: vi.fn(async () => {}), reload: vi.fn() }));
vi.mock('../utils/auth', () => ({
  isAuthConfigured: () => true,
  getCurrentEmail: async () => 'ana@exemplo.com',
  entrarComGoogle: async () => ({ ok: false }),
  authHeaders: async () => ({}),
  signOut,
}));
vi.mock('../utils/accountData', () => ({ revokePushBeforeDelete: async () => ({ webPush: true, fcm: true }) }));
vi.mock('../utils/entitlements', () => ({ fetchEntitlement: async () => null }));
vi.mock('../utils/playBilling', () => ({ isBillingAvailable: () => false }));

import { AccountSection } from './AccountSection';
import { STORAGE_KEYS, RECONCILE_KEYS } from '../utils/storageKeys';
import { marcarMudancaPendente, __resetSessaoEncerrando } from '../utils/sessionReset';

let storage: Storage;
beforeEach(() => {
  storage = installFakeStorage();
  __resetSessaoEncerrando(); signOut.mockClear(); reload.mockClear();
  storage.setItem(STORAGE_KEYS.GAME_STATE, '{"totalXP":321}');
  storage.setItem(STORAGE_KEYS.SAVE_ID, 'a'.repeat(32));
  storage.setItem(STORAGE_KEYS.USER_EMAIL, 'ana@exemplo.com');
  Object.defineProperty(window, 'location', { value: { ...window.location, reload }, configurable: true });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

const botaoSair = (nome: RegExp) => screen.findByRole('button', { name: nome });

describe('Sair da conta', () => {
  it('sem pendência: sai direto, apaga o estado da conta e recarrega', async () => {
    renderWithCss(<AccountSection language="pt-BR" />);
    fireEvent.click(await botaoSair(/^Sair da conta$/));
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(storage.getItem(STORAGE_KEYS.GAME_STATE)).toBeNull();
    expect(storage.getItem(STORAGE_KEYS.SAVE_ID)).toBeNull();
    expect(JSON.parse(storage.getItem(RECONCILE_KEYS.CONFLICT_BACKUP)!).motivo).toBe('logout');
  });

  it('falha de sync (PT): avisa, oferece backup, NÃO apaga nem desloga até a pessoa escolher', async () => {
    marcarMudancaPendente();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    renderWithCss(<AccountSection language="pt-BR" />);
    fireEvent.click(await botaoSair(/^Sair da conta$/));
    const aviso = await screen.findByRole('alert');
    expect(aviso.textContent).toMatch(/ainda não chegou à nuvem/);
    expect(aviso.textContent).toMatch(/internet/);
    expect(screen.getByRole('button', { name: 'Exportar backup' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Tentar enviar de novo' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Ficar na conta' })).toBeTruthy();
    expect(signOut).not.toHaveBeenCalled();
    expect(storage.getItem(STORAGE_KEYS.GAME_STATE)).toBe('{"totalXP":321}');
    // "Ficar na conta" volta ao botão normal, sem perder nada.
    fireEvent.click(screen.getByRole('button', { name: 'Ficar na conta' }));
    expect(await botaoSair(/^Sair da conta$/)).toBeTruthy();
    expect(storage.getItem(STORAGE_KEYS.GAME_STATE)).toBe('{"totalXP":321}');
  });

  it('"Exportar backup" baixa o save local; "Sair e apagar daqui" guarda a cópia e só então apaga', async () => {
    marcarMudancaPendente();
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('offline'); }));
    const baixados: string[] = [];
    const blobs: Blob[] = [];
    URL.createObjectURL = ((b: Blob) => { blobs.push(b); return 'blob:x'; }) as typeof URL.createObjectURL;
    URL.revokeObjectURL = (() => {}) as typeof URL.revokeObjectURL;
    const orig = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { baixados.push(this.download); };
    try {
      renderWithCss(<AccountSection language="pt-BR" />);
      fireEvent.click(await botaoSair(/^Sair da conta$/));
      fireEvent.click(await screen.findByRole('button', { name: 'Exportar backup' }));
      expect(baixados).toHaveLength(1);
      expect(baixados[0]).toMatch(/^soulmon-backup-\d{4}-\d{2}-\d{2}\.json$/);
      expect(JSON.parse(await blobs[0].text()).state).toEqual({ totalXP: 321 });
      expect(signOut).not.toHaveBeenCalled(); // exportar não sai
      fireEvent.click(screen.getByRole('button', { name: 'Sair e apagar daqui' }));
      await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
      expect(storage.getItem(STORAGE_KEYS.GAME_STATE)).toBeNull();
      const copia = JSON.parse(storage.getItem(RECONCILE_KEYS.CONFLICT_BACKUP)!);
      expect(copia.motivo).toBe('logout-sem-sync');
      expect(copia.state).toEqual({ totalXP: 321 });
    } finally {
      HTMLAnchorElement.prototype.click = orig;
    }
  });

  it('falha de sync (EN) e "tentar de novo" com a rede de volta sai normalmente', async () => {
    marcarMudancaPendente();
    const fetchMock = vi.fn(async () => { throw new TypeError('offline'); });
    vi.stubGlobal('fetch', fetchMock);
    renderWithCss(<AccountSection language="en-US" />);
    fireEvent.click(await botaoSair(/^Sign out$/));
    expect((await screen.findByRole('alert')).textContent).toMatch(/hasn't reached the cloud yet/);
    expect(screen.getByRole('button', { name: 'Export backup' })).toBeTruthy();
    fetchMock.mockImplementation((async () => new Response('{}', { status: 200 })) as never);
    fireEvent.click(screen.getByRole('button', { name: 'Try sending again' }));
    await waitFor(() => expect(reload).toHaveBeenCalledTimes(1));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(storage.getItem(STORAGE_KEYS.GAME_STATE)).toBeNull();
  });
});
