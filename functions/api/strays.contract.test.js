/**
 * CONTRATO DOS DESGARRADOS DE JOGADORES (01/11/2026, REGISTRO §213): desgarrado = Soulmon de quem está há 90+ dias sem entrar.
 * Regra no servidor (`_strays.js`), pool em `community?action=strays`, último acesso tocado pelo GET do save.
 * + forma dos campos novos do save (`_libraryAck.js`: `libraryAck`, `strayPlayersSeen`).
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { onRequest } from './community.js';
import { resetRateLimits } from './_rateLimit.js';
import { isStrayProfile, lastActiveAt, strayIdOf, touchLastLogin, STRAY_INACTIVE_DAYS, STRAY_INACTIVE_MS, LAST_LOGIN_TOUCH_MS } from './_strays.js';
import { sanitizeLibraryAck, sanitizeStrayPlayersSeen } from './_libraryAck.js';
import { sanitizeLibraryAck as clientAck } from '../../src/utils/libraryNew';
import { sanitizeStrayPlayersSeen as clientSeen, STRAY_SEEN_MAX } from '../../src/utils/strayPlayers';
import * as serverAck from './_libraryAck.js';

const DAY = 86_400_000;
const NOW = Date.UTC(2026, 10, 1);
const A = 'a'.repeat(32), B = 'b'.repeat(32), C = 'c'.repeat(32), D = 'd'.repeat(32);

function mkEnv(profiles) {
  const store = new Map(Object.entries(profiles).map(([id, p]) => [`profile:${id}`, JSON.stringify({ id, ...p })]));
  const kv = {
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
  return { env: { SOULMON_SAVES: kv }, store };
}
const strays = (env) => onRequest({ request: new Request('https://x.dev/api/community?action=strays'), env });

describe('regra: 90 dias sem entrar', () => {
  it('o limiar é 90 dias', () => {
    expect(STRAY_INACTIVE_DAYS).toBe(90);
    expect(STRAY_INACTIVE_MS).toBe(90 * DAY);
  });
  it('89 dias = ativo; 90 = desgarrado', () => {
    expect(isStrayProfile({ id: A, pid: 'p1', lastLoginAt: NOW - 89 * DAY }, NOW)).toBe(false);
    expect(isStrayProfile({ id: A, pid: 'p1', lastLoginAt: NOW - 90 * DAY }, NOW)).toBe(true);
  });
  it('último acesso = o maior entre lastLoginAt e updatedAt (perfil antigo só tem updatedAt)', () => {
    expect(lastActiveAt({ updatedAt: 5, lastLoginAt: 9 })).toBe(9);
    expect(lastActiveAt({ updatedAt: NOW - 100 * DAY })).toBe(NOW - 100 * DAY);
    expect(isStrayProfile({ id: A, pid: 'p', updatedAt: NOW - 100 * DAY, lastLoginAt: NOW - DAY }, NOW)).toBe(false);
  });
  it('sem data nenhuma, escondido, simulado ou sem pid: nunca desgarrado', () => {
    expect(isStrayProfile({ id: A, pid: 'p' }, NOW)).toBe(false);
    expect(isStrayProfile({ id: A, pid: 'p', updatedAt: 1, publicHidden: true }, NOW)).toBe(false);
    expect(isStrayProfile({ id: 'sim_0001', pid: 'p', updatedAt: 1 }, NOW, 'sim_0001')).toBe(false);
    expect(isStrayProfile({ id: A, updatedAt: 1 }, NOW)).toBe(false);
    expect(isStrayProfile(null, NOW)).toBe(false);
  });
});

describe('action=strays', () => {
  beforeEach(() => resetRateLimits());
  it('devolve só os inativos, ANÔNIMOS (sid derivado do pid; sem nome, apelido, pid, saveId, amigos ou datas)', async () => {
    const velho = Date.now() - 120 * DAY;
    const { env } = mkEnv({
      [A]: { pid: 'pidA'.padEnd(24, '0'), name: 'Fulano', petName: 'Bichinho', stage: 'mega', element: 'fogo', updatedAt: velho, lastLoginAt: velho, friends: [B], spriteUrl: 'https://atacante.example/x.png' },
      [B]: { pid: 'pidB'.padEnd(24, '0'), name: 'Ativo', stage: 'rookie', updatedAt: Date.now(), lastLoginAt: Date.now() },
      [C]: { pid: 'pidC'.padEnd(24, '0'), name: 'Escondido', stage: 'rookie', updatedAt: velho, publicHidden: true },
    });
    const r = await strays(env);
    expect(r.status).toBe(200);
    const { strays: list } = await r.json();
    expect(list).toEqual([{ sid: await strayIdOf('pidA'.padEnd(24, '0')), stage: 'mega', element: 'fogo' }]);
    const txt = JSON.stringify(list);
    for (const proibido of ['Fulano', 'Bichinho', 'pidA', A, B, 'friends', 'lastLoginAt', 'atacante']) expect(txt).not.toContain(proibido);
    expect(list[0].sid).toMatch(/^[a-f0-9]{24}$/);
  });
  it('o dono volta (GET do save toca lastLoginAt) → sai do pool na hora', async () => {
    const velho = Date.now() - 200 * DAY;
    const { env, store } = mkEnv({ [D]: { pid: 'pidD'.padEnd(24, '0'), stage: 'champion', updatedAt: velho, lastLoginAt: velho } });
    expect((await (await strays(env)).json()).strays).toHaveLength(1);
    expect(await touchLastLogin(env, D)).toBe(true);
    expect(JSON.parse(store.get(`profile:${D}`)).lastLoginAt).toBeGreaterThan(velho);
    resetRateLimits();
    expect((await (await strays(env)).json()).strays).toEqual([]);
  });
});

describe('touchLastLogin', () => {
  it('no máximo 1 escrita por dia; sem perfil não cria nada', async () => {
    const { env, store } = mkEnv({ [A]: { pid: 'p', lastLoginAt: NOW - 2 * DAY } });
    expect(await touchLastLogin(env, A, NOW)).toBe(true);
    expect(await touchLastLogin(env, A, NOW + LAST_LOGIN_TOUCH_MS - 1)).toBe(false);
    expect(await touchLastLogin(env, A, NOW + LAST_LOGIN_TOUCH_MS)).toBe(true);
    expect(await touchLastLogin(env, B, NOW)).toBe(false);
    expect(store.has(`profile:${B}`)).toBe(false);
  });
  it('falha de KV não derruba quem chamou', async () => {
    const env = { SOULMON_SAVES: { get: async () => { throw new Error('kv'); }, put: async () => {} } };
    expect(await touchLastLogin(env, A, NOW)).toBe(false);
  });
});

describe('campos novos do save: libraryAck e strayPlayersSeen (forma, espelho do cliente)', () => {
  it('libraryAck: só {b,e,s} inteiros 0..100000; lixo = descartado', () => {
    expect(sanitizeLibraryAck({ b: 1, e: 2, s: 0, x: 9 })).toEqual({ b: 1, e: 2, s: 0 });
    expect(sanitizeLibraryAck({ b: -1, e: 2, s: 0 })).toBeUndefined();
    expect(sanitizeLibraryAck('x')).toBeUndefined();
    expect(sanitizeLibraryAck({ b: 100001, e: 0, s: 0 })).toBeUndefined();
    // o cliente aceita o que o servidor aceita (com listas grandes o bastante)
    const lists = { bestiary: Array(5).fill('k'), defeatedElements: Array(5).fill('e'), strayPlayersSeen: [] };
    expect(clientAck({ b: 1, e: 2, s: 0 }, lists)).toEqual({ b: 1, e: 2, s: 0 });
    expect(serverAck.LIBRARY_ACK_MAX).toBe(100_000);
  });
  it('strayPlayersSeen: mesma forma do cliente (sid 24 hex, sem repetir, teto, URL na allowlist)', () => {
    const raw = [
      { sid: 'a'.repeat(24), stage: 'mega', element: 'fogo', at: '2026-11-01', name: 'Fulano' },
      { sid: 'a'.repeat(24), stage: 'rookie', at: '2026-11-01' },
      { sid: 'zz', stage: 'rookie' },
      { sid: 'b'.repeat(24), stage: 'rookie', spriteUrl: 'https://atacante.example/x.png', at: 'x' },
    ];
    expect(sanitizeStrayPlayersSeen(raw)).toEqual(clientSeen(raw));
    expect(sanitizeStrayPlayersSeen(raw)).toEqual([
      { sid: 'a'.repeat(24), stage: 'mega', element: 'fogo', at: '2026-11-01' },
      { sid: 'b'.repeat(24), stage: 'rookie', at: '1970-01-01' },
    ]);
    expect(sanitizeStrayPlayersSeen('x')).toBeUndefined();
    expect(serverAck.STRAY_SEEN_MAX).toBe(STRAY_SEEN_MAX);
  });
});
