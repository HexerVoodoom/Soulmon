import { describe, it, expect, beforeEach } from 'vitest';
import {
  RANKED_GAMES, cleanScore, isoWeekKey, monthKey, periodKey, tierFor, payablePlacements,
  submitScore, readBoard, MAX_SCORE, RANK_FAKE_TETO, FAKE_BRUTO_MAX_FATOR, escalaFake, semanasDoMes, TIER_CUTS,
} from './_rankings.js';
import { SIMULADOS } from './_simulados.data.js';
import { scoresDoDia } from './_simulados.js';
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

// §473, adendo 18/11/2026: teto dos simulados no Elemental Fusion e legado semanal do mês da troca.
describe('teto dos simulados (RANK_FAKE_TETO) e legado semanal do match3', () => {
  const SIM_DIAS = Array.from({ length: 120 }, (_, i) => new Date(Date.UTC(2026, 9, 25) + i * 86400000).toISOString().slice(0, 10));

  it('teto documentado: abaixo dos placares reais de referência (Aventura 1166, PvP 440)', () => {
    expect(RANK_FAKE_TETO.match3).toBeLessThan(1166);
    expect(RANK_FAKE_TETO['match3-pvp']).toBeLessThan(440);
  });

  it('nenhum simulado, em nenhum dia, aparece com placar >= teto; a escala preserva a ordem', () => {
    for (const game of Object.keys(RANK_FAKE_TETO)) {
      const brutos = [];
      for (const p of SIMULADOS) for (const d of SIM_DIAS) for (const s of scoresDoDia(p, d)) if (s.game === game) brutos.push(s.score);
      // Inclui o máximo bruto teórico e os placares já gravados em novembro (até 2687).
      brutos.push(Math.ceil(TIER_CUTS[game].at(-1) * FAKE_BRUTO_MAX_FATOR), 2687, 100_000);
      const vistos = brutos.map((b) => escalaFake(game, b));
      expect(Math.max(...vistos)).toBeLessThan(RANK_FAKE_TETO[game]);
      const ord = [...brutos].sort((a, b) => a - b);
      for (let i = 1; i < ord.length; i++) expect(escalaFake(game, ord[i])).toBeGreaterThanOrEqual(escalaFake(game, ord[i - 1]));
    }
    expect(escalaFake('dino', 2687)).toBe(2687); // jogo sem teto: intacto
  });

  it('readBoard: real fica acima de todos os simulados, mesmo com placar bruto menor', async () => {
    const env = mkEnv();
    const kvs = env.SOULMON_SAVES;
    const now = new Date('2026-12-05T12:00:00Z');
    const put = (id, s, sim) => kvs.put(`rk:match3-pvp:2026-12:${String(MAX_SCORE - s).padStart(10, '0')}:${id}`, '', { metadata: { s, n: id, sim } });
    await put('sim_0001', 650, true);
    await put('sim_0002', 500, true);
    await put('real-a', 440, false);
    await kvs.put('rkme:match3-pvp:2026-12:real-a', '440');
    const b = await readBoard(env, { game: 'match3-pvp', period: 'monthly', saveId: 'real-a', now });
    expect(b.top.map((r) => r.name)).toEqual(['real-a', 'sim_0001', 'sim_0002']);
    expect(b.top[0].score).toBe(440);
    expect(b.top[1].score).toBeLessThan(RANK_FAKE_TETO['match3-pvp']);
    expect(b.top[1].score).toBeGreaterThan(b.top[2].score);
    expect(b.me).toEqual({ score: 440, tier: tierFor('match3-pvp', 440), rank: 1 });
  });

  it('match3 mensal de 2026-11 junta as semanas do mês (quinta no mês), o melhor por jogador', async () => {
    expect(semanasDoMes('2026-11')).toEqual(['2026-W45', '2026-W46', '2026-W47', '2026-W48']);
    const env = mkEnv();
    const kvs = env.SOULMON_SAVES;
    const put = (pk, id, s, sim) => kvs.put(`rk:match3:${pk}:${String(MAX_SCORE - s).padStart(10, '0')}:${id}`, '', { metadata: { s, n: id, sim } });
    await put('2026-11', 'sim_0003', 2687, true);
    await put('2026-11', 'real-b', 1597, false);
    await put('2026-W45', 'real-m', 1166, false);
    await put('2026-W46', 'real-m', 958, false);
    await put('2026-W44', 'real-m', 1224, false); // quinta em outubro: fora de novembro
    const b = await readBoard(env, { game: 'match3', period: 'monthly', saveId: 'real-m', now: new Date('2026-11-18T12:00:00Z') });
    expect(b.top.map((r) => [r.name, r.score])).toEqual([['real-b', 1597], ['real-m', 1166], ['sim_0003', escalaFake('match3', 2687)]]);
    expect(b.me?.rank).toBe(2);
    // Fora do mês da troca não há leitura das semanais.
    const dez = await readBoard(env, { game: 'match3', period: 'monthly', saveId: 'real-m', now: new Date('2026-12-02T12:00:00Z') });
    expect(dez.top).toEqual([]);
  });
});
