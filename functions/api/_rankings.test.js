import { describe, it, expect, beforeEach } from 'vitest';
import {
  RANKED_GAMES, cleanScore, isoWeekKey, monthKey, periodKey, tierFor, payablePlacements,
  submitScore, readBoard, MAX_SCORE,
} from './_rankings.js';
import { onRequest, LIMIT_SUBMIT } from './rankings.js';
import { resetRateLimits } from './_rateLimit.js';

/** KV falso com `list` ordenado, `limit`, cursor ausente e `metadata`. */
function fakeKV() {
  const store = new Map();
  return {
    store,
    get: async k => (store.has(k) ? store.get(k).v : null),
    put: async (k, v, o) => { store.set(k, { v, m: o?.metadata }); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '', limit = 1000 }) => {
      const names = [...store.keys()].filter(k => k.startsWith(prefix)).sort().slice(0, limit);
      return { keys: names.map(name => ({ name, metadata: store.get(name).m })), list_complete: true };
    },
  };
}
const mkEnv = () => ({ SOULMON_SAVES: fakeKV() });
const A = 'player-aaaaaaaa';
const B = 'player-bbbbbbbb';
const NOW = new Date('2026-10-25T12:00:00Z');

describe('períodos (UTC fixo)', () => {
  it('semana ISO e mês', () => {
    expect(isoWeekKey(new Date('2026-10-25T12:00:00Z'))).toBe('2026-W43'); // domingo
    expect(isoWeekKey(new Date('2026-10-26T00:00:00Z'))).toBe('2026-W44'); // segunda 00:00 UTC
    expect(isoWeekKey(new Date('2027-01-01T00:00:00Z'))).toBe('2026-W53');
    expect(monthKey(NOW)).toBe('2026-10');
    expect(periodKey('monthly', NOW)).toBe('2026-10');
    expect(periodKey('weekly', NOW)).toBe('2026-W43');
  });
});

describe('score e faixa', () => {
  it('cleanScore valida', () => {
    expect(cleanScore(12.9)).toBe(12);
    expect(cleanScore(-1)).toBeNull();
    expect(cleanScore('9')).toBeNull();
    expect(cleanScore(NaN)).toBeNull();
    expect(cleanScore(MAX_SCORE + 1)).toBeNull();
  });
  it('a faixa só sobe com o score', () => {
    const ids = [0, 100, 500, 900, 2000, 3000, 9999].map(s => tierFor('dino', s));
    expect(ids[0]).toBe('madeira');
    expect(ids.at(-1)).toBe('diamante');
    const order = ['madeira', 'bronze', 'prata', 'ouro', 'platina', 'diamante'];
    for (let i = 1; i < ids.length; i++) expect(order.indexOf(ids[i])).toBeGreaterThanOrEqual(order.indexOf(ids[i - 1]));
  });
});

describe('melhor score por período', () => {
  it('guarda só o melhor e reordena o top', async () => {
    const env = mkEnv();
    const base = { game: 'dino', period: 'weekly', now: NOW };
    expect((await submitScore(env, { ...base, saveId: A, score: 500 })).improved).toBe(true);
    expect((await submitScore(env, { ...base, saveId: A, score: 300 })).improved).toBe(false);
    expect((await submitScore(env, { ...base, saveId: A, score: 800 })).best).toBe(800);
    await submitScore(env, { ...base, saveId: B, score: 600 });
    const board = await readBoard(env, { ...base, saveId: B });
    expect(board.top.map(r => r.score)).toEqual([800, 600]);
    expect(board.top.filter(r => r.me)).toHaveLength(1);
    expect(board.me).toMatchObject({ score: 600, rank: 2, tier: 'bronze' });
    // uma chave por jogador no placar (a antiga foi apagada)
    expect([...env.SOULMON_SAVES.store.keys()].filter(k => k.startsWith('rk:dino:')).length).toBe(2);
  });
  it('períodos e jogos são independentes', async () => {
    const env = mkEnv();
    await submitScore(env, { game: 'dino', period: 'weekly', saveId: A, score: 10, now: NOW });
    expect((await readBoard(env, { game: 'dino', period: 'monthly', saveId: A, now: NOW })).top).toEqual([]);
    expect((await readBoard(env, { game: 'eco', period: 'weekly', saveId: A, now: NOW })).me).toBeNull();
    const nextWeek = new Date('2026-10-27T00:00:00Z');
    expect((await readBoard(env, { game: 'dino', period: 'weekly', saveId: A, now: nextWeek })).top).toEqual([]);
  });
});

describe('payablePlacements', () => {
  it('pula simulados e desce para o próximo real', () => {
    const e = [{ n: 'a' }, { n: 's1', simulated: true }, { n: 'b' }, { n: 's2', sim: true }, { n: 'c' }];
    expect(payablePlacements(e, 3).map(x => x.n)).toEqual(['a', 'b', 'c']);
    expect(payablePlacements(e, 1).map(x => x.n)).toEqual(['a']);
    expect(payablePlacements(null, 3)).toEqual([]);
  });
  it('o simulado aparece no ranking (metadata sim)', async () => {
    const env = mkEnv();
    env.SOULMON_SAVES.store.set(`profile:${A}`, { v: JSON.stringify({ name: 'Bot', simulated: true }) });
    await submitScore(env, { game: 'eco', period: 'weekly', saveId: A, score: 9, now: NOW });
    const k = [...env.SOULMON_SAVES.store.entries()].find(([n]) => n.startsWith('rk:eco:'));
    expect(k[1].m.sim).toBe(true);
    expect((await readBoard(env, { game: 'eco', period: 'weekly', saveId: B, now: NOW })).top).toHaveLength(1);
  });
});

describe('rota /api/rankings', () => {
  beforeEach(() => resetRateLimits());
  const call = (env, method, body, qs = '') => onRequest({
    env,
    request: new Request(`https://x.test/api/rankings${qs}`, {
      method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined,
    }),
  });

  it('allowlist de jogos', async () => {
    expect(RANKED_GAMES).toContain('dino');
    const r = await call(mkEnv(), 'POST', { id: A, game: 'hack', score: 1 });
    expect(r.status).toBe(400);
    expect((await call(mkEnv(), 'GET', null, `?game=nope&id=${A}`)).status).toBe(400);
  });
  it('submete e lê (faixa + top + posição)', async () => {
    const env = mkEnv();
    const r = await call(env, 'POST', { id: A, game: 'dino', score: 1000 });
    const j = await r.json();
    expect(r.status).toBe(200);
    expect(j).toMatchObject({ ok: true, improved: true, best: 1000, period: 'weekly' });
    expect(j.me).toMatchObject({ tier: 'prata', rank: 1 });
    const g = await (await call(env, 'GET', null, `?game=dino&id=${A}`)).json();
    expect(g.top[0].score).toBe(1000);
  });
  it('rejeita score inválido, período inválido e id inválido', async () => {
    expect((await call(mkEnv(), 'POST', { id: A, game: 'dino', score: -5 })).status).toBe(400);
    expect((await call(mkEnv(), 'POST', { id: A, game: 'dino', score: 1, period: 'daily' })).status).toBe(400);
    expect((await call(mkEnv(), 'POST', { id: 'x', game: 'dino', score: 1 })).status).toBe(400);
  });
  it('exige token quando o Firebase está ligado', async () => {
    const env = { ...mkEnv(), FIREBASE_PROJECT_ID: 'soulmon-app' };
    expect((await call(env, 'POST', { id: A, game: 'dino', score: 1 })).status).toBe(401);
  });
  it('limita a taxa de submissões por conta', async () => {
    const env = mkEnv();
    let last;
    for (let i = 0; i <= LIMIT_SUBMIT.limit; i++) last = await call(env, 'POST', { id: A, game: 'dino', score: i });
    expect(last.status).toBe(429);
  });
});
