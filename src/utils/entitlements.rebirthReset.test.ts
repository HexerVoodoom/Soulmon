/**
 * #62 — a ponta CLIENTE do "rebirth zera `aiLifetime.sprite`".
 *
 * DECISÃO DO DONO #62 (22/09/2026): *"Rebirth: zerar `aiLifetime.sprite` no
 * renascimento"*. O contador vive no servidor (`functions/api/_aiGuard.js`),
 * então o cliente só PEDE — e a coisa que precisa de guard aqui é a garantia
 * de que pedir nunca derruba o renascimento, que acontece uma vez só na vida
 * do save.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resetSpriteLifetimeAfterRebirth } from './entitlements';

// `currentSaveId` é local ao módulo e lê `STORAGE_KEYS.SAVE_ID` do
// `safeStorage` — por isso o mock é do storage, não de um export.
vi.mock('./safeStorage', () => ({ readLocal: () => 'save-abc' }));
vi.mock('./auth', () => ({ authHeaders: async () => ({ Authorization: 'Bearer t' }) }));

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

describe('#62 — resetSpriteLifetimeAfterRebirth', () => {
  it('chama a rota do dono com o saveId e devolve true no sucesso', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true, jaFeito: false }) });
    await expect(resetSpriteLifetimeAfterRebirth()).resolves.toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/entitlements?action=rebirth-reset');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ id: 'save-abc' });
    // Autenticado: a rota é do titular, e quem prova isso é o header.
    expect(init.headers.Authorization).toBe('Bearer t');
  });

  it('`jaFeito` (retry, duplo toque) continua sendo sucesso — a rota é idempotente', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: true, jaFeito: true }) });
    await expect(resetSpriteLifetimeAfterRebirth()).resolves.toBe(true);
  });

  it('erro HTTP devolve false EM SILÊNCIO — nunca lança, para não derrubar o renascimento', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    await expect(resetSpriteLifetimeAfterRebirth()).resolves.toBe(false);
  });

  it('rede caída devolve false EM SILÊNCIO — o renascimento é uma vez só na vida do save', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(resetSpriteLifetimeAfterRebirth()).resolves.toBe(false);
  });

  it('`ok: false` do servidor (ex.: rebirth-not-found) não vira exceção', async () => {
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({ ok: false, reason: 'rebirth-not-found' }) });
    await expect(resetSpriteLifetimeAfterRebirth()).resolves.toBe(false);
  });
});
