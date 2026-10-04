import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { adoptCloudSave, consultarContaNaNuvem } from './cloudSave';
import { STORAGE_KEYS, RECONCILE_KEYS } from './storageKeys';
import { resetStorageNotice } from './safeStorage';

// QA1 (rodada 6) — domínio conta/save.
//
// BUG 1 (perda de save, ALTA): os call sites de login/adoção do `App.tsx` liam a
// nuvem com `cloudLoad`, que devolve `null` tanto para "esta conta não tem save"
// quanto para "não consegui ler" (offline, 5xx, 401). Rede ruim no instante do
// login = "conta nova": o app apontava para o `saveId` derivado e o POST seguinte
// (`put` cego) SOBRESCREVIA o save do outro aparelho com o estado local.
// `reconcileSaveId` já tratava a dúvida certo ("dúvida não move dado"); os
// outros cinco caminhos, não.
//
// BUG 2 (perda de save, MÉDIA): `adoptCloudSave` trocava o save local pelo da
// nuvem SEM guardar cópia (só `reconcileSaveId` guardava). Quem jogava local e
// entrava com um e-mail que já tinha conta perdia o progresso local sem rastro.

const store = new Map<string, string>();
function installStorage() {
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => { store.set(k, v); },
    removeItem: (k: string) => { store.delete(k); },
  });
}

beforeEach(() => {
  store.clear();
  resetStorageNotice();
  installStorage();
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function mockFetch(impl: () => Promise<unknown> | unknown) {
  vi.stubGlobal('fetch', vi.fn(async () => impl()));
}
const resp = (status: number, body: unknown = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('consultarContaNaNuvem — dúvida NÃO é "conta nova"', () => {
  it('5xx → incerta', async () => {
    mockFetch(() => resp(503, { error: 'x' }));
    expect((await consultarContaNaNuvem('abcdefgh12345678')).estado).toBe('incerta');
  });
  it('rede caiu → incerta', async () => {
    mockFetch(() => { throw new TypeError('Failed to fetch'); });
    expect((await consultarContaNaNuvem('abcdefgh12345678')).estado).toBe('incerta');
  });
  it('401 → incerta', async () => {
    mockFetch(() => resp(401, { error: 'unauthorized' }));
    expect((await consultarContaNaNuvem('abcdefgh12345678')).estado).toBe('incerta');
  });
  it('410 (lápide) → incerta: nada a adotar e nada a subir por cima', async () => {
    mockFetch(() => resp(410, { error: 'account-deleted' }));
    expect((await consultarContaNaNuvem('abcdefgh12345678')).estado).toBe('incerta');
  });
  it('found:false → nova', async () => {
    mockFetch(() => resp(200, { found: false }));
    expect((await consultarContaNaNuvem('abcdefgh12345678')).estado).toBe('nova');
  });
  it('found:true → existente com o state', async () => {
    mockFetch(() => resp(200, { found: true, state: { totalXP: 5 } }));
    const r = await consultarContaNaNuvem('abcdefgh12345678');
    expect(r).toEqual({ estado: 'existente', state: { totalXP: 5 } });
  });
});

describe('os call sites do App.tsx não colapsam "não sei" em "nova"', () => {
  it('cloudLoad só sobrevive no "restaurar por código" (lá null = "não deu", sem escrita)', () => {
    const src = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
    const usos = src.match(/\bcloudLoad\(/g) ?? [];
    expect(usos.length).toBe(1);
    expect(src).toMatch(/onRestoreFromCloud[\s\S]{0,400}cloudLoad\(id\)/);
  });
});

describe('adoptCloudSave — cópia do progresso local que vai ser substituído', () => {
  const LOCAL_REAL = { soulmonMeta: { baseName: 'Luma' }, totalXP: 420, completedTasks: [{ id: 't' }] };

  it('troca de identidade com progresso local real → guarda cópia', () => {
    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify(LOCAL_REAL));
    store.set(STORAGE_KEYS.SAVE_ID, 'id-local-antigo');
    expect(adoptCloudSave('id-da-nuvem', { totalXP: 1 }, 'a@b.com')).toBe('ok');
    const bk = JSON.parse(store.get(RECONCILE_KEYS.CONFLICT_BACKUP)!);
    expect(bk.state.totalXP).toBe(420);
    expect(bk.saveId).toBe('id-local-antigo');
  });

  it('estado local vazio/novo NÃO gasta nem sobrescreve a cópia anterior', () => {
    store.set(RECONCILE_KEYS.CONFLICT_BACKUP, JSON.stringify({ saveId: 'x', state: { totalXP: 999 } }));
    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify({ activities: [], totalXP: 0 }));
    store.set(STORAGE_KEYS.SAVE_ID, 'id-local-antigo');
    adoptCloudSave('id-da-nuvem', { totalXP: 1 });
    expect(JSON.parse(store.get(RECONCILE_KEYS.CONFLICT_BACKUP)!).state.totalXP).toBe(999);
  });

  it('mesma identidade (reidratar o próprio save) não gera cópia', () => {
    store.set(STORAGE_KEYS.GAME_STATE, JSON.stringify(LOCAL_REAL));
    store.set(STORAGE_KEYS.SAVE_ID, 'mesmo-id-aqui');
    adoptCloudSave('mesmo-id-aqui', { totalXP: 1 });
    expect(store.has(RECONCILE_KEYS.CONFLICT_BACKUP)).toBe(false);
  });
});
