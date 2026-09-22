/**
 * Adendo 11 (QA rodada A, 21/09/2026): o servidor responde `410
 * {error:'account-deleted'}` em GET/POST `/api/save` depois da exclusão
 * (tombstone de 30 d). O cliente tem que PARAR — não retentar (recriaria o que
 * a pessoa mandou apagar), limpar o save local, deslogar e voltar ao portão
 * com a mensagem PT/EN. Tudo com `fetch` stubado.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS } from './storageKeys';

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn(async () => {}) }));
vi.mock('./auth', () => ({ authHeaders: async () => ({}), signOut }));

import {
  cloudSave, cloudSaveComRetry, cloudLoad, classifyCloudSaveStatus, CLOUD_SAVE_POLICY,
  reagirContaExcluida, mensagemContaExcluida, __resetRetryBudgets, __resetContaExcluida,
} from './cloudSave';

const ID = 'b'.repeat(32);
const memoria = new Map<string, string>();

beforeEach(() => {
  memoria.clear();
  __resetRetryBudgets();
  __resetContaExcluida();
  signOut.mockClear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memoria.get(k) ?? null,
    setItem: (k: string, v: string) => { memoria.set(k, v); },
    removeItem: (k: string) => { memoria.delete(k); },
  });
});
afterEach(() => { vi.unstubAllGlobals(); });

function servidor410() {
  const chamadas: string[] = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    chamadas.push(init?.method ?? 'GET');
    return Response.json({ error: 'account-deleted' }, { status: 410 });
  });
  return chamadas;
}

describe('410 account-deleted — classe `deleted`', () => {
  it('410 é a classe `deleted`, não retentável, que avisa', () => {
    expect(classifyCloudSaveStatus(410)).toBe('deleted');
    expect(CLOUD_SAVE_POLICY.deleted).toEqual({ retentavel: false, avisaJogador: true });
  });

  it('POST: `cloudSave` devolve `deleted` e `cloudSaveComRetry` NÃO retenta (uma chamada só)', async () => {
    const chamadas = servidor410();
    const r = await cloudSave(ID, { x: 1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.kind).toBe('deleted');
    chamadas.length = 0;
    const r2 = await cloudSaveComRetry(ID, { x: 1 }, { esperar: async () => {} });
    expect(r2.ok).toBe(false);
    expect(chamadas).toEqual(['POST']);
    expect(memoria.has(STORAGE_KEYS.LAST_CLOUD_SYNC)).toBe(false);
  });

  it('`reagirContaExcluida`: limpa save + identidade, desloga, grava a mensagem e volta ao portão (reload); idempotente', async () => {
    memoria.set(STORAGE_KEYS.GAME_STATE, '{"a":1}');
    memoria.set(STORAGE_KEYS.SAVE_ID, ID);
    memoria.set(STORAGE_KEYS.LAST_CLOUD_SYNC, 'x');
    memoria.set(STORAGE_KEYS.USER_EMAIL, 'a@b.c');
    memoria.set(STORAGE_KEYS.LANGUAGE, 'pt-BR');
    const recarregar = vi.fn();
    await reagirContaExcluida({ recarregar });
    expect(memoria.has(STORAGE_KEYS.GAME_STATE)).toBe(false);
    expect(memoria.has(STORAGE_KEYS.SAVE_ID)).toBe(false);
    expect(memoria.has(STORAGE_KEYS.LAST_CLOUD_SYNC)).toBe(false);
    expect(memoria.has(STORAGE_KEYS.USER_EMAIL)).toBe(false);
    expect(memoria.get(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE)).toBe('Esta conta foi excluída neste ou em outro aparelho.');
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(recarregar).toHaveBeenCalledTimes(1);
    // Segunda vez (outro POST em voo chegando com 410): no-op — sem loop.
    await reagirContaExcluida({ recarregar });
    expect(recarregar).toHaveBeenCalledTimes(1);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('mensagem em EN quando o idioma não é PT', async () => {
    memoria.set(STORAGE_KEYS.LANGUAGE, 'en-US');
    await reagirContaExcluida({ recarregar: () => {} });
    expect(memoria.get(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE)).toBe('This account was deleted on this or another device.');
    expect(mensagemContaExcluida(true)).not.toBe(mensagemContaExcluida(false));
  });

  it('`signOut` que lança não impede a limpeza nem o retorno ao portão', async () => {
    signOut.mockImplementationOnce(async () => { throw new Error('sem rede'); });
    memoria.set(STORAGE_KEYS.SAVE_ID, ID);
    const recarregar = vi.fn();
    await reagirContaExcluida({ recarregar });
    expect(memoria.has(STORAGE_KEYS.SAVE_ID)).toBe(false);
    expect(recarregar).toHaveBeenCalledTimes(1);
  });

  it('GET: `cloudLoad` com 410 do PRÓPRIO saveId devolve null e dispara a reação; de outro id, só null', async () => {
    servidor410();
    // outro id: é um login/restauração, não "minha conta sumiu"
    memoria.set(STORAGE_KEYS.SAVE_ID, 'c'.repeat(32));
    expect(await cloudLoad(ID)).toBeNull();
    expect(signOut).not.toHaveBeenCalled();
    // o próprio id
    memoria.set(STORAGE_KEYS.SAVE_ID, ID);
    vi.stubGlobal('location', { reload: vi.fn() });
    expect(await cloudLoad(ID)).toBeNull();
    await new Promise(r => setTimeout(r, 0));
    expect(signOut).toHaveBeenCalledTimes(1);
    expect(memoria.has(STORAGE_KEYS.SAVE_ID)).toBe(false);
  });
});
