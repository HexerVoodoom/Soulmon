import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { cloudSave, lerNuvem, adoptCloudSave, lerRevisao, gravarRevisao, esquecerRevisao, __resetRetryBudgets } from './cloudSave';
import { STORAGE_KEYS } from './storageKeys';

const ID = 'a'.repeat(32);
const OUTRO = 'b'.repeat(32);
const memoria = new Map<string, string>();
const log: string[] = [];

type Resp = { status: number; body: unknown };
let proxima: Resp = { status: 200, body: { ok: true } };
let corpos: Array<Record<string, unknown>> = [];

beforeEach(() => {
  memoria.clear(); log.length = 0; corpos = [];
  proxima = { status: 200, body: { ok: true } };
  __resetRetryBudgets();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => memoria.get(k) ?? null,
    setItem: (k: string, v: string) => { log.push(k); memoria.set(k, v); },
    removeItem: (k: string) => { memoria.delete(k); },
  });
  vi.stubGlobal('fetch', vi.fn(async (_u: unknown, init?: RequestInit) => {
    if (init?.method === 'POST') corpos.push(JSON.parse(String(init.body)));
    return new Response(typeof proxima.body === 'string' ? proxima.body : JSON.stringify(proxima.body), { status: proxima.status });
  }));
});
afterEach(() => { vi.unstubAllGlobals(); });

describe('revisão local (SAVE_REVISION)', () => {
  it('só vale para o saveId gravado; JSON inválido = null', () => {
    gravarRevisao(ID, 4);
    expect(lerRevisao(ID)).toBe(4);
    expect(lerRevisao(OUTRO)).toBeNull();
    memoria.set(STORAGE_KEYS.SAVE_REVISION, '{nao-json');
    expect(lerRevisao(ID)).toBeNull();
    memoria.set(STORAGE_KEYS.SAVE_REVISION, JSON.stringify({ saveId: ID, r: -1 }));
    expect(lerRevisao(ID)).toBeNull();
    gravarRevisao(ID, 2); esquecerRevisao();
    expect(lerRevisao(ID)).toBeNull();
  });
});

describe('cloudSave e baseRevision', () => {
  it('sem revisão gravada: corpo cego {state}', async () => {
    await cloudSave(ID, { totalXP: 1 });
    expect(corpos[0]).toEqual({ state: { totalXP: 1 } });
  });

  it('revisão de OUTRO saveId não vaza para o corpo', async () => {
    gravarRevisao(OUTRO, 9);
    await cloudSave(ID, { totalXP: 1 });
    expect(corpos[0]).not.toHaveProperty('baseRevision');
  });

  it('com revisão do mesmo saveId: manda baseRevision; 200 grava a revisão nova', async () => {
    gravarRevisao(ID, 3);
    proxima = { status: 200, body: { ok: true, revision: 4 } };
    const r = await cloudSave(ID, { totalXP: 1 });
    expect(corpos[0]).toEqual({ state: { totalXP: 1 }, baseRevision: 3 });
    expect(r.ok).toBe(true);
    expect(lerRevisao(ID)).toBe(4);
  });

  it('200 sem revision no corpo (ou corpo não-JSON): não grava nada', async () => {
    proxima = { status: 200, body: {} };
    await cloudSave(ID, {});
    proxima = { status: 200, body: 'ok' };
    await cloudSave(ID, {});
    expect(memoria.has(STORAGE_KEYS.SAVE_REVISION)).toBe(false);
  });

  it('primeiro POST cego (transição) passa a ter revisão', async () => {
    proxima = { status: 200, body: { ok: true, revision: 1 } };
    await cloudSave(ID, {});
    expect(lerRevisao(ID)).toBe(1);
  });

  it('409 vira kind conflict, não retentável, com revision; não mexe na revisão local', async () => {
    gravarRevisao(ID, 3);
    proxima = { status: 409, body: { error: 'conflict', revision: 7 } };
    const r = await cloudSave(ID, {});
    expect(r).toMatchObject({ ok: false, kind: 'conflict', status: 409, revision: 7, retentavel: false });
    expect(lerRevisao(ID)).toBe(3);
  });

  it('409 com corpo ilegível: conflict sem revision', async () => {
    proxima = { status: 409, body: 'nada' };
    const r = await cloudSave(ID, {});
    expect(r).toMatchObject({ ok: false, kind: 'conflict' });
    expect((r as { revision?: number }).revision).toBeUndefined();
  });
});

describe('lerNuvem e adoptCloudSave', () => {
  it('lerNuvem devolve revision inteira >= 0; ignora o resto', async () => {
    proxima = { status: 200, body: { found: true, state: { a: 1 }, revision: 7 } };
    expect(await lerNuvem(ID)).toEqual({ estado: 'encontrado', state: { a: 1 }, revision: 7 });
    proxima = { status: 200, body: { found: true, state: { a: 1 }, revision: 1.5 } };
    expect(await lerNuvem(ID)).toEqual({ estado: 'encontrado', state: { a: 1 } });
    proxima = { status: 200, body: { found: true, state: { a: 1 } } };
    expect(await lerNuvem(ID)).toEqual({ estado: 'encontrado', state: { a: 1 } });
  });

  it('adoptCloudSave grava a revisão DEPOIS do dado e da identidade', () => {
    expect(adoptCloudSave(ID, { totalXP: 5 }, undefined, { revision: 7 })).toBe('ok');
    const i = (k: string) => log.indexOf(k);
    expect(i(STORAGE_KEYS.GAME_STATE)).toBeGreaterThanOrEqual(0);
    expect(i(STORAGE_KEYS.SAVE_REVISION)).toBeGreaterThan(i(STORAGE_KEYS.GAME_STATE));
    expect(i(STORAGE_KEYS.SAVE_REVISION)).toBeGreaterThan(i(STORAGE_KEYS.SAVE_ID));
    expect(lerRevisao(ID)).toBe(7);
  });

  it('adoptCloudSave sem opts.revision não escreve revisão', () => {
    adoptCloudSave(ID, { totalXP: 5 });
    expect(memoria.has(STORAGE_KEYS.SAVE_REVISION)).toBe(false);
  });
});
