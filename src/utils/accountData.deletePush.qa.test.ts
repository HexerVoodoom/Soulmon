// @vitest-environment jsdom
/**
 * QA (rodada A, 21/09/2026) — `confirmDelete` / `revokePushBeforeDelete` em
 * ambiente HOSTIL: DELETE devolvendo 500, DELETE que nunca responde (rede
 * pendurada), módulo de notificações que nem carrega. Critério de aceite da
 * decisão #23: "falha de push NÃO bloqueia a exclusão" — inclusive quando a
 * falha é DEMORA, não erro.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';

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
    value: { ready: Promise.resolve({ pushManager: { getSubscription: async () => ({ endpoint: ENDPOINT, unsubscribe }) } }) },
  });
}

const RESPOSTA_DELETE_DONE = {
  ok: true, executado: { apaga: [], minimiza: [], sobrevive: [], listasDeAmigosLimpas: 0, inscricoesDePushApagadas: 0 },
  naoIncluido: [], aviso: { 'pt-BR': '', en: '' },
};

type Chamada = { url: string; method?: string };
const chamadas = (): Chamada[] =>
  (globalThis.fetch as ReturnType<typeof vi.fn>).mock.calls.map(c => ({ url: String(c[0]), method: (c[1] as RequestInit | undefined)?.method }));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.FCM_TOKEN, 'tok-fcm-1');
  installWebPush();
  unsubscribe.mockClear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('confirmDelete — push hostil não bloqueia a exclusão', () => {
  it('DELETE devolve 500 nos dois canais → delete-confirm ainda é chamado, e por último', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') return { ok: false, status: 500, json: async () => ({ error: 'boom' }) };
      return { ok: true, status: 200, json: async () => RESPOSTA_DELETE_DONE };
    }));
    const { confirmDelete } = await import('./accountData');
    const r = await confirmDelete('save1', 'tok');
    expect(r.ok).toBe(true);
    const c = chamadas();
    const deletes = c.filter(x => x.method === 'DELETE').map(x => x.url).sort();
    expect(deletes).toEqual(['/api/fcm-subscribe', '/api/subscribe']);
    // Ordem: os dois DELETE antes do confirm; o confirm é a ÚLTIMA chamada.
    expect(c[c.length - 1].url).toContain('delete-confirm');
    expect(c.findIndex(x => x.url.includes('delete-confirm'))).toBe(2);
    // Web Push: a inscrição local cai mesmo com 500 (o navegador para de entregar).
    expect(unsubscribe).toHaveBeenCalledTimes(1);
    // FCM: o token local FICA quando o servidor não confirma — apagá-lo antes
    // do `res.ok` era o achado #2 do skeptic (o aparelho esquecia que ainda
    // estava inscrito e nunca mais tentava). A exclusão segue mesmo assim.
    expect(localStorage.getItem(STORAGE_KEYS.FCM_TOKEN)).toBe('tok-fcm-1');
  });

  it('REGRESSÃO: DELETE que NUNCA responde (rede pendurada) não segura a exclusão para sempre', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') return new Promise<never>(() => { /* pendurado */ });
      return Promise.resolve({ ok: true, status: 200, json: async () => RESPOSTA_DELETE_DONE });
    }));
    const { confirmDelete } = await import('./accountData');
    let resolvido: unknown = null;
    const p = confirmDelete('save1', 'tok').then(r => { resolvido = r; return r; });
    // 30 s de relógio: qualquer teto razoável já estourou.
    await vi.advanceTimersByTimeAsync(30_000);
    expect(resolvido, 'confirmDelete tem que resolver mesmo com o push pendurado').not.toBeNull();
    const r = await p;
    expect(r.ok).toBe(true);
    expect(chamadas().some(x => x.url.includes('delete-confirm'))).toBe(true);
  });

  it('módulo de notificações que não carrega → revoke devolve {false,false} e a exclusão segue', async () => {
    vi.doMock('./notifications', () => { throw new Error('Capacitor ausente'); });
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, status: 200, json: async () => RESPOSTA_DELETE_DONE })));
    const { confirmDelete, revokePushBeforeDelete } = await import('./accountData');
    expect(await revokePushBeforeDelete()).toEqual({ webPush: false, fcm: false });
    const r = await confirmDelete('save1', 'tok');
    expect(r.ok).toBe(true);
    expect(chamadas().filter(x => x.method === 'DELETE')).toEqual([]);
    vi.doUnmock('./notifications');
  });

  it('delete-confirm falhando (500) devolve ok:false — e o push JÁ foi revogado (irreversível, declarado)', async () => {
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (init?.method === 'DELETE') return { ok: true, status: 200, json: async () => ({ ok: true }) };
      return { ok: false, status: 500, json: async () => ({ error: 'server' }) };
    }));
    const { confirmDelete } = await import('./accountData');
    const r = await confirmDelete('save1', 'tok');
    expect(r.ok).toBe(false);
    // OBSERVADO: a ordem "revoga antes" tem este preço — se o servidor falhar,
    // a pessoa fica sem push e COM conta. É o lado aceito da decisão #23
    // (notificação órfã é pior que push a menos numa conta que pediu para sair).
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
