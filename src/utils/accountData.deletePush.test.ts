// @vitest-environment jsdom
/**
 * Decisão #23 do QA geral (21/09/2026): `confirmDelete` revoga o push ANTES
 * de confirmar a exclusão — `DELETE /api/subscribe` (Web Push, pelo endpoint
 * da inscrição) e `DELETE /api/fcm-subscribe` (Android, pelo token guardado).
 * E a falha de push NÃO bloqueia a exclusão.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';

// O Capacitor decide o caminho do FCM por plataforma; aqui é "android" para
// que a revogação do token seja exercitada. `registerPlugin` é o que o
// `SoulmonAlarmPlugin` chama ao importar `notifications.ts`.
vi.mock('@capacitor/core', () => ({
  Capacitor: { getPlatform: () => 'android', isNativePlatform: () => true },
  registerPlugin: () => ({}),
}));
vi.mock('@capacitor/push-notifications', () => ({ PushNotifications: {} }));
vi.mock('./auth', () => ({ authHeaders: async () => ({}) }));

const ENDPOINT = 'https://push.example/abc';
const unsubscribe = vi.fn(async () => true);

function installWebPush() {
  Object.defineProperty(window, 'PushManager', { configurable: true, value: class {} });
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: {
      ready: Promise.resolve({
        pushManager: { getSubscription: async () => ({ endpoint: ENDPOINT, unsubscribe }) },
      }),
    },
  });
}

type Chamada = { url: string; method?: string; body?: string };
function chamadas(): Chamada[] {
  return (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map(c => ({
    url: String(c[0]), method: (c[1] as RequestInit | undefined)?.method, body: (c[1] as RequestInit | undefined)?.body as string | undefined,
  }));
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.FCM_TOKEN, 'tok-fcm-1');
  installWebPush();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('confirmDelete revoga o push antes de apagar', () => {
  it('manda os dois DELETE, com endpoint e token, ANTES do delete-confirm', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string) => ({
      ok: true, status: 200,
      json: async () => (String(url).includes('delete-confirm')
        ? { ok: true, executado: { apaga: [], minimiza: [], sobrevive: [], listasDeAmigosLimpas: 0 }, naoIncluido: [], aviso: { 'pt-BR': '', en: '' } }
        : { ok: true }),
    })));
    const { confirmDelete } = await import('./accountData');
    const r = await confirmDelete('save1', 'tok');
    expect(r.ok).toBe(true);

    const c = chamadas();
    const iWeb = c.findIndex(x => x.url === '/api/subscribe' && x.method === 'DELETE');
    const iFcm = c.findIndex(x => x.url === '/api/fcm-subscribe' && x.method === 'DELETE');
    const iDel = c.findIndex(x => x.url.includes('delete-confirm'));
    expect(iWeb).toBeGreaterThanOrEqual(0);
    expect(iFcm).toBeGreaterThanOrEqual(0);
    expect(iDel).toBeGreaterThan(iWeb);
    expect(iDel).toBeGreaterThan(iFcm);
    expect(JSON.parse(c[iWeb].body ?? '{}').endpoint).toBe(ENDPOINT);
    expect(JSON.parse(c[iFcm].body ?? '{}').token).toBe('tok-fcm-1');
    // A inscrição local também cai, e o token sai do aparelho.
    expect(unsubscribe).toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEYS.FCM_TOKEN)).toBeNull();
  });

  it('push que falha (rede) NÃO bloqueia a exclusão', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') throw new TypeError('rede caída');
      return {
        ok: true, status: 200,
        json: async () => ({ ok: true, executado: { apaga: [], minimiza: [], sobrevive: [], listasDeAmigosLimpas: 0 }, naoIncluido: [], aviso: { 'pt-BR': '', en: '' } }),
      };
    }));
    const { confirmDelete } = await import('./accountData');
    const r = await confirmDelete('save1', 'tok');
    expect(r.ok).toBe(true);
    expect(chamadas().some(x => x.url.includes('delete-confirm'))).toBe(true);
  });
});
