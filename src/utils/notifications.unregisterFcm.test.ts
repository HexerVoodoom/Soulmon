// @vitest-environment jsdom
/**
 * Skeptic #2 (QA rodada A, 21/09/2026): `unregisterFromPushNotifications`
 * apagava o `FCM_TOKEN` local ANTES do DELETE. Se o servidor falhava, o
 * aparelho esquecia que ainda estava inscrito e nunca mais tentava. Agora:
 * o token local só sai após `res.ok`, e a falha é propagada (quem chama —
 * `revokePushBeforeDelete` — já usa `allSettled`).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';

vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true },
  registerPlugin: () => ({}),
}));
vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: { checkPermissions: async () => ({ receive: 'granted' }), requestPermissions: async () => ({ receive: 'granted' }), addListener: () => {}, register: async () => {} },
}));

const KEY = STORAGE_KEYS.FCM_TOKEN;

beforeEach(() => { localStorage.clear(); localStorage.setItem(KEY, 'tok-123'); });
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('unregisterFromPushNotifications', () => {
  it('servidor confirma (200): DELETE leva o token e o local é apagado', async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { unregisterFromPushNotifications } = await import('./notifications');
    await expect(unregisterFromPushNotifications()).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/fcm-subscribe');
    expect(init.method).toBe('DELETE');
    expect(JSON.parse(String(init.body))).toEqual({ token: 'tok-123' });
    expect(localStorage.getItem(KEY)).toBeNull();
  });

  it('servidor recusa (500): rejeita e o token local FICA para a próxima tentativa', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 500 })));
    const { unregisterFromPushNotifications } = await import('./notifications');
    await expect(unregisterFromPushNotifications()).rejects.toThrow(/HTTP 500/);
    expect(localStorage.getItem(KEY)).toBe('tok-123');
  });

  it('rede cai (fetch rejeita): propaga e o token local fica', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const { unregisterFromPushNotifications } = await import('./notifications');
    await expect(unregisterFromPushNotifications()).rejects.toThrow('Failed to fetch');
    expect(localStorage.getItem(KEY)).toBe('tok-123');
  });

  it('sem token local: não chama a rede', async () => {
    localStorage.removeItem(KEY);
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { unregisterFromPushNotifications } = await import('./notifications');
    await unregisterFromPushNotifications();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
