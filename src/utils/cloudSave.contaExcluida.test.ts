/**
 * Adendo 11 (QA rodada A, 21/09/2026): o servidor responde `410
 * {error:'account-deleted'}` em GET/POST `/api/save` depois da exclusão
 * (tombstone de 30 d). O cliente tem que PARAR — não retentar (recriaria o que
 * a pessoa mandou apagar), limpar o save local, deslogar e voltar ao portão
 * com a mensagem PT/EN. Tudo com `fetch` stubado.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { STORAGE_KEYS, RECONCILE_KEYS } from './storageKeys';

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn(async () => {}) }));
vi.mock('./auth', () => ({ authHeaders: async () => ({}), signOut }));

import {
  cloudSave, cloudSaveComRetry, cloudLoad, classifyCloudSaveStatus, CLOUD_SAVE_POLICY,
  reagirContaExcluida, mensagemContaExcluida, __resetRetryBudgets, __resetContaExcluida,
  checarContaExcluidaNoLogin, reconcileSaveId, lerNuvem, emailToSaveId,
} from './cloudSave';

const MSG_PT = 'Esta conta foi excluída. O servidor libera o e-mail no próximo login — tente entrar de novo.';
const MSG_EN = 'This account was deleted. The server frees the email on your next sign-in — try signing in again.';

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

function servidor410(deletedAt?: number) {
  const chamadas: string[] = [];
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    chamadas.push(init?.method ?? 'GET');
    return Response.json({ error: 'account-deleted', ...(deletedAt ? { deletedAt } : {}) }, { status: 410 });
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
    expect(memoria.get(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE)).toBe(MSG_PT);
    // 1b (skeptic R2): o save local vai para o backup ANTES de sumir.
    const backup = JSON.parse(memoria.get(RECONCILE_KEYS.CONFLICT_BACKUP)!);
    expect(backup.state).toEqual({ a: 1 });
    expect(backup.saveId).toBe(ID);
    expect(backup.motivo).toBe('account-deleted');
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
    expect(memoria.get(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE)).toBe(MSG_EN);
    expect(mensagemContaExcluida(true)).not.toBe(mensagemContaExcluida(false));
  });

  it('A2: sem LANGUAGE gravada o idioma vem do aparelho (`resolveLanguage`), não cai em EN', async () => {
    vi.stubGlobal('navigator', { language: 'pt-BR' });
    await reagirContaExcluida({ recarregar: () => {} });
    expect(memoria.get(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE)).toBe(MSG_PT);
  });

  it('a data da exclusão (`deletedAt` do 410) entra como DD/MM, nos dois idiomas', () => {
    const em = new Date(2026, 8, 3, 12).getTime(); // 03/09 local
    expect(mensagemContaExcluida(true, em)).toBe('Esta conta foi excluída em 03/09. O servidor libera o e-mail no próximo login — tente entrar de novo.');
    expect(mensagemContaExcluida(false, em)).toBe('This account was deleted on 03/09. The server frees the email on your next sign-in — try signing in again.');
    // sem data / data inválida: sem o " em DD/MM"
    expect(mensagemContaExcluida(true, NaN)).toBe(MSG_PT);
  });

  it('`lerNuvem` lê `deletedAt` do corpo do 410 (contrato com o backend); ausente → undefined', async () => {
    servidor410(1_700_000_000_000);
    expect(await lerNuvem(ID)).toEqual({ estado: 'excluida', excluidaEm: 1_700_000_000_000 });
    servidor410();
    expect(await lerNuvem(ID)).toEqual({ estado: 'excluida', excluidaEm: undefined });
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

describe('F1 (QA rodada 2, FATAL): lápide no LOGIN barra antes do onboarding', () => {
  it('`checarContaExcluidaNoLogin`: 410 na chave derivada → grava o aviso, desloga e devolve a mensagem', async () => {
    servidor410(1_700_000_000_000);
    memoria.set(STORAGE_KEYS.LANGUAGE, 'en-US');
    const r = await checarContaExcluidaNoLogin('Pessoa@Exemplo.com');
    expect(r).not.toBeNull();
    expect(r!.saveId).toBe(await emailToSaveId('pessoa@exemplo.com'));
    expect(r!.mensagem).toMatch(/^This account was deleted on \d\d\/\d\d\. The server frees the email/);
    expect(memoria.get(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE)).toBe(r!.mensagem);
    expect(signOut).toHaveBeenCalledTimes(1);
  });

  it('`checarContaExcluidaNoLogin`: vazio, encontrado e indeterminado → null, sem deslogar (a dúvida não barra o login)', async () => {
    for (const resposta of [
      () => Response.json({ found: false }),
      () => Response.json({ found: true, state: { x: 1 } }),
      () => new Response('', { status: 503 }),
    ]) {
      vi.stubGlobal('fetch', async () => resposta());
      expect(await checarContaExcluidaNoLogin('a@b.c')).toBeNull();
    }
    expect(signOut).not.toHaveBeenCalled();
    expect(memoria.has(STORAGE_KEYS.ACCOUNT_DELETED_NOTICE)).toBe(false);
  });

  it('`reconcileSaveId` com 410 na chave derivada NÃO migra (não sobe o local) — para, faz backup, desloga', async () => {
    const chamadas = servidor410();
    memoria.set(STORAGE_KEYS.SAVE_ID, 'c'.repeat(32)); // id antigo, diferente do derivado
    memoria.set(STORAGE_KEYS.GAME_STATE, '{"hp":3}');
    vi.stubGlobal('location', { reload: vi.fn() });
    const r = await reconcileSaveId('a@b.c', { hp: 3 });
    expect(r.estado).toBe('excluida');
    // Só o GET de leitura — nenhum POST subiu o estado local por cima da lápide.
    expect(chamadas).toEqual(['GET']);
    expect(memoria.has(STORAGE_KEYS.SAVE_ID)).toBe(false);
    expect(JSON.parse(memoria.get(RECONCILE_KEYS.CONFLICT_BACKUP)!).state).toEqual({ hp: 3 });
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
