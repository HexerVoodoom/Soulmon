// @vitest-environment jsdom
/**
 * #23 (QA geral 21/09/2026): a inscrição de push leva o `saveId` quando ele
 * existe — é o que permite ao servidor apagar o push junto com a conta. Sem
 * `saveId`, o body é o de sempre (inscrição anônima). No FCM o listener
 * `registration` é ligado UMA vez, então o valor tem que vir de ref: o segundo
 * `register` com outro `saveId` precisa mandar o novo.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

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

const bodies = () => (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls
  .map(c => ({ url: String(c[0]), body: JSON.parse(String((c[1] as RequestInit).body)) }));

beforeEach(() => {
  installWebPush();
  vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('subscribeToPush (Web Push)', () => {
  it('com saveId: vai no body; sem: o body não ganha a chave', async () => {
    const { subscribeToPush } = await import('./notifications');
    await subscribeToPush('Serah', 'pt-BR', '2026-09-01', 'abc123');
    await subscribeToPush('Serah', 'pt-BR', '2026-09-01');
    const [com, sem] = bodies();
    expect(com.url).toBe('/api/subscribe');
    expect(com.body.saveId).toBe('abc123');
    expect(com.body.petName).toBe('Serah');
    expect('saveId' in sem.body).toBe(false);
  });
});

describe('registerForPushNotifications (FCM)', () => {
  it('o token sobe com o saveId ATUAL, mesmo com o listener ligado uma vez só', async () => {
    const { registerForPushNotifications } = await import('./notifications');
    await registerForPushNotifications('Serah', 'pt-BR', undefined);
    expect(registrationCb).toBeTruthy();
    registrationCb!({ value: 'tok1' });
    // O upload espera `authHeaders()` (QA rodada 2): um tick antes de olhar.
    await new Promise(r => setTimeout(r, 0));
    // Login depois: `saveId` novo, listener antigo.
    await registerForPushNotifications('Serah', 'en-US', undefined, 'abc123');
    registrationCb!({ value: 'tok2' });
    await new Promise(r => setTimeout(r, 0));
    const fcm = bodies().filter(b => b.url === '/api/fcm-subscribe');
    expect(fcm).toHaveLength(2);
    expect('saveId' in fcm[0].body).toBe(false);
    expect(fcm[1].body).toMatchObject({ token: 'tok2', saveId: 'abc123', language: 'en-US' });
  });
});
