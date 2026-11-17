/**
 * Incidente 17/11/2026 — cliente: nuvem "mais nova" SEM progresso nunca vence um local COM progresso, e o 409 `regression`
 * do servidor não vira conflito, retry nem loop.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  emailToSaveId, reconcileSaveId, cloudSave, cloudSaveComRetry, classifyCloudSaveStatus, lerRevisao, gravarRevisao, __resetRetryBudgets,
} from './cloudSave';
import { reconciliarComNuvem } from './saveReconcileRun';
import { __resetSessaoEncerrando } from './sessionReset';
import { lerAnel } from './backupRing';
import { STORAGE_KEYS } from './storageKeys';

const EMAIL = 'dono@exemplo.com';
const UUID = '3f1c2b8a-77aa-4d1e-9f0b-5c6d7e8f9a01';
const SID = 'z'.repeat(32);
const REAL = { soulmonMeta: { baseName: 'Corvo' }, evolutionStage: 'ultimate-power', totalXP: 10532, activities: [{ id: 1 }] };
const VAZIO = { evolutionStage: 'rookie', totalXP: 0, activities: [], completedTasks: [] };
const memoria = new Map<string, string>();

interface Chamada { url: string; method: string; body?: { state: unknown; baseRevision?: number } }
let chamadas: Chamada[] = [];
let nuvem: Record<string, { state: unknown; revision: number }> = {};
let postStatus = 200;
let postBody: unknown = { ok: true, revision: 99 };

beforeEach(() => {
  memoria.clear(); chamadas = []; nuvem = {}; postStatus = 200; postBody = { ok: true, revision: 99 };
  __resetRetryBudgets(); __resetSessaoEncerrando();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memoria.get(k) ?? null,
    setItem: (k: string, v: string) => { memoria.set(k, v); },
    removeItem: (k: string) => { memoria.delete(k); },
  });
  vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
    const u = new URL(url, 'https://x');
    const id = u.searchParams.get('id')!;
    if (init?.method === 'POST') {
      chamadas.push({ url, method: 'POST', body: JSON.parse(String(init.body)) });
      return new Response(JSON.stringify(postBody), { status: postStatus });
    }
    chamadas.push({ url, method: 'GET' });
    return id in nuvem ? Response.json({ found: true, state: nuvem[id].state, revision: nuvem[id].revision }) : Response.json({ found: false });
  });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('cloudSave — 409 regression', () => {
  it('vira kind "regression": não retentável, não avisa, e não é "conflict"', async () => {
    postStatus = 409; postBody = { error: 'regression', revision: 4 };
    const r = await cloudSave('a'.repeat(32), VAZIO);
    expect(r).toMatchObject({ ok: false, kind: 'regression', status: 409, retentavel: false, avisaJogador: false, revision: 4 });
  });

  it('cloudSaveComRetry NÃO reenvia (um único POST)', async () => {
    postStatus = 409; postBody = { error: 'regression' };
    const r = await cloudSaveComRetry('a'.repeat(32), VAZIO, { esperar: async () => {} });
    expect(r.ok).toBe(false);
    expect(chamadas.filter(c => c.method === 'POST')).toHaveLength(1);
  });

  it('409 comum continua sendo "conflict"', async () => {
    postStatus = 409; postBody = { error: 'conflict', revision: 7 };
    expect(await cloudSave('a'.repeat(32), REAL)).toMatchObject({ kind: 'conflict', revision: 7 });
    expect(classifyCloudSaveStatus(409)).toBe('conflict');
  });

  it('a intenção explícita vai na query; sem intenção, não vai', async () => {
    await cloudSave('a'.repeat(32), REAL, { allowRegression: 'restore' });
    await cloudSave('a'.repeat(32), REAL);
    expect(chamadas[0].url).toContain('&allowRegression=restore');
    expect(chamadas[1].url).not.toContain('allowRegression');
  });
});

describe('reconcileSaveId — nuvem derivada sem progresso, local com progresso', () => {
  it('o LOCAL vence: não adota o vazio, reaponta a identidade e sobe o local com a revisão da nuvem como base', async () => {
    memoria.set('soulmon-save-id', UUID);
    const derivado = await emailToSaveId(EMAIL);
    nuvem[derivado] = { state: VAZIO, revision: 4877 };

    const r = await reconcileSaveId(EMAIL, REAL);

    expect(r).toMatchObject({ estado: 'migrado', saveId: derivado, anterior: UUID });
    expect(memoria.get('soulmon-save-id')).toBe(derivado);
    const posts = chamadas.filter(c => c.method === 'POST');
    expect(posts).toHaveLength(1);
    expect(posts[0].body).toMatchObject({ state: REAL, baseRevision: 4877 });
    expect(lerAnel().some(c => c.motivo === 'nuvem-vazia-local-vence')).toBe(true);
  });

  it('nuvem COM progresso continua sendo adotada (comportamento antigo intacto)', async () => {
    memoria.set('soulmon-save-id', UUID);
    const derivado = await emailToSaveId(EMAIL);
    nuvem[derivado] = { state: { ...REAL, totalXP: 500 }, revision: 3 };
    expect((await reconcileSaveId(EMAIL, { ...REAL, totalXP: 1 })).estado).toBe('adotado');
    expect(chamadas.filter(c => c.method === 'POST')).toHaveLength(0);
  });

  it('nuvem sem progresso E local sem progresso: segue o caminho antigo (adota)', async () => {
    memoria.set('soulmon-save-id', UUID);
    const derivado = await emailToSaveId(EMAIL);
    nuvem[derivado] = { state: VAZIO, revision: 2 };
    expect((await reconcileSaveId(EMAIL, VAZIO)).estado).toBe('adotado');
  });
});

describe('reconciliarComNuvem — o cenário do F5 do incidente', () => {
  function ctx(local: unknown, motivo: 'boot' | '409' | 'visivel') {
    const aplicado: unknown[] = [];
    return {
      aplicado,
      c: {
        motivo,
        estadoAtual: () => local as never,
        hidratar: (n: Record<string, unknown>) => n as never,
        aplicar: (n: unknown) => { aplicado.push(n); },
        rajada: { current: null },
        montado: { current: true },
        reconciliando: { current: true },
        avisoSemEspacoDado: { current: false },
      },
    };
  }

  it.each(['boot', '409', 'visivel'] as const)('%s: nuvem vazia mais nova + local com progresso => local vence, nada é aplicado, local sobe', async (motivo) => {
    memoria.set(STORAGE_KEYS.SAVE_ID, SID);
    gravarRevisao(SID, 10);
    nuvem[SID] = { state: VAZIO, revision: 4877 };
    const { c, aplicado } = ctx(REAL, motivo);

    const final = await reconciliarComNuvem(c);

    expect(final).toBe(true);
    expect(aplicado).toHaveLength(0);
    expect(c.reconciliando.current).toBe(false);
    await vi.waitFor(() => expect(chamadas.some(x => x.method === 'POST')).toBe(true));
    const post = chamadas.find(x => x.method === 'POST')!;
    expect(post.body?.state).toEqual(REAL);
    expect(post.body?.baseRevision).toBe(4877);
    expect(lerAnel().some(x => x.motivo === 'nuvem-vazia-local-vence')).toBe(true);
    expect(lerRevisao(SID)).not.toBeNull();
  });

  it('nuvem mais nova COM progresso continua sendo adotada', async () => {
    memoria.set(STORAGE_KEYS.SAVE_ID, SID);
    gravarRevisao(SID, 3);
    nuvem[SID] = { state: { ...REAL, totalXP: 20000 }, revision: 12 };
    const { c, aplicado } = ctx(REAL, 'boot');
    expect(await reconciliarComNuvem(c)).toBe(true);
    expect(aplicado).toHaveLength(1);
    expect(chamadas.some(x => x.method === 'POST')).toBe(false);
  });
});
