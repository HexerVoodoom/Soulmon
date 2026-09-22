// @vitest-environment jsdom
/**
 * QA rodada 2 (01-seguranca §2 / skeptic #2): o servidor só indexa
 * `pushidx:<saveId>` para saveId AUTENTICADO. Sem `Authorization`, 17 POSTs
 * anônimos com o saveId da vítima expulsavam a inscrição real do índice
 * (`PUSHIDX_MAX`). Os POSTs de inscrição (Web Push e FCM) mandam o Bearer
 * quando há sessão; sem sessão, nenhum header — a inscrição segue anônima.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { sessao } = vi.hoisted(() => ({ sessao: { token: 'tok' as string | null } }));
vi.mock('./auth', () => ({
  authHeaders: async () => (sessao.token ? { Authorization: `Bearer ${sessao.token}` } : {}),
}));

let registrationCb: ((t: { value: string }) => void) | null = null;
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true },
  registerPlugin: () => ({}),
}));
vi.mock('@capacitor/push-notifications', () => ({
  PushNotifications: {
    checkPermissions: async () => ({ receive: 'granted' }),
    requestPermissions: async () => ({ receive: 'granted' }),
    addListener: (ev: string, cb: (t: { value: string }) => void) => { if (ev === 'registration') registrationCb = cb; },
    register: async () => {},
  },
}));

function installWebPush() {
  Object.defineProperty(window, 'PushManager', { configurable: true, value: class {} });
  Object.defineProperty(window, 'Notification', { configurable: true, value: { permission: 'granted' } });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      ready: Promise.resolve({
        pushManager: {
          getSubscription: async () => ({ endpoint: 'https://push.example/e', toJSON: () => ({ endpoint: 'https://push.example/e', keys: { p256dh: 'a', auth: 'b' } }) }),
        },
      }),
    },
  });
}

const chamadas = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls
  .map(c => ({ url: String(c[0]), headers: ((c[1] as RequestInit).headers ?? {}) as Record<string, string>, method: (c[1] as RequestInit).method }));

beforeEach(() => {
  installWebPush();
  sessao.token = 'tok';
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Authorization nos POSTs de inscrição', () => {
  it('Web Push: com sessão manda Bearer; sem sessão, nenhum Authorization', async () => {
    const { subscribeToPush } = await import('./notifications');
    await subscribeToPush('Serah', 'pt-BR', '2026-09-01', 'abc123');
    sessao.token = null;
    await subscribeToPush('Serah', 'pt-BR', '2026-09-01', 'abc123');
    const [com, sem] = chamadas();
    expect(com.url).toBe('/api/subscribe');
    expect(com.method).toBe('POST');
    expect(com.headers.Authorization).toBe('Bearer tok');
    expect(com.headers['Content-Type']).toBe('application/json');
    expect('Authorization' in sem.headers).toBe(false);
  });

  it('FCM: o upload do token leva o mesmo Bearer', async () => {
    const { registerForPushNotifications } = await import('./notifications');
    await registerForPushNotifications('Serah', 'pt-BR', undefined, 'abc123');
    expect(registrationCb).not.toBeNull();
    registrationCb!({ value: 'fcm-token' });
    await new Promise(r => setTimeout(r, 0));
    const fcm = chamadas().find(c => c.url === '/api/fcm-subscribe');
    expect(fcm).toBeDefined();
    expect(fcm!.headers.Authorization).toBe('Bearer tok');
  });
});
