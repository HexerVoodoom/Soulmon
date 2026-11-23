/**
 * TREINO ("Sparring"), a 2a aba do Torneio (10/11/2026). O que as rotas travam:
 *  1. o sorteio é por faixa de VÍNCULO (não por ranking): 5 oponentes, sem eu mesmo, sem quem não aceita PvP/oculto, sem número de ranking;
 *  2. a faixa começa em ±3 e AMPLIA quando há menos de 5 candidatos;
 *  3. o "Refresh" é ilimitado: cada GET sorteia de novo, nunca 429;
 *  4. NÃO ranqueia: nenhuma chave `rank:*`, nenhum `lifetimePoints`, nenhuma partida gasta;
 *  5. Honra: 1 a 2 por vitória, teto de 20 por dia do jogador, no servidor; derrota/empate/desistência = 0;
 *  6. reenvio idempotente (sem Honra em dobro); semente e ficha são do servidor.
 */
import { describe, it, expect } from 'vitest';
import { onRequest } from './community.js';
import { xpForLevel } from './_bond.js';
import { DUEL_DAY_MS } from './_duel.js';
import { SPAR_HONOR_MAX as MAX_APP, SPAR_HONOR_DAILY_CAP as CAP_APP } from '../../src/utils/currencies';
import {
  pickSparOpponents, sparHonorRoll, SPAR_PICKS, SPAR_HONOR_MAX, SPAR_BOND_RANGE, SPAR_HONOR_DAILY_CAP, sparHonorKey,
} from './_treino.js';

const ME = 'a'.repeat(32);
const idDe = n => String(n).padStart(2, '0').repeat(16).slice(0, 32).replace(/0/g, 'x');
const pidDe = n => `pp${String(n).padStart(2, '0')}`.padEnd(24, 'z');

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  return {
    store, meta,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, opts) => { store.set(k, v); if (opts?.metadata !== undefined) meta.set(k, opts.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const perfil = (id, pid, over = {}) => JSON.stringify({ id, name: id.slice(0, 3), petName: 'Bicho', stage: 'rookie', pvpEnabled: true, pid, lifetimePoints: 77, ...over });
const save = (bond, over = {}) => JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: xpForLevel(bond), ...over });

/** `bonds`: o Vínculo de cada oponente (índice = n). Eu tenho `meBond`. */
function mkEnv({ meBond = 10, bonds = [], meOver = {}, oppProfile = {}, oppSave = {} } = {}) {
  const f = Date.now() - 90 * DUEL_DAY_MS;
  const kv = fakeKV({ [`profile:${ME}`]: perfil(ME, pidDe(0)), [ME]: save(meBond, meOver) });
  kv.meta.set(ME, { t: Date.now(), f });
  const ids = [];
  bonds.forEach((b, i) => {
    const id = idDe(i + 1);
    const pid = pidDe(i + 1);
    ids.push({ id, pid, bond: b });
    kv.store.set(`profile:${id}`, perfil(id, pid, oppProfile[i] ?? {}));
    kv.store.set(`pid:${pid}`, id);
    kv.store.set(id, save(b, oppSave[i] ?? {}));
    kv.meta.set(id, { t: Date.now(), f });
  });
  return { env: { DIGIAPP_SAVES: kv }, ids, kv };
}
const call = async (env, action, body, method = 'POST') => {
  const res = await onRequest({
    request: new Request(`https://x.dev/api/community?action=${action}&id=${ME}`, {
      method, headers: { 'content-type': 'application/json' }, body: method === 'POST' ? JSON.stringify({ id: ME, ...body }) : undefined,
    }),
    env,
  });
  return { status: res.status, json: await res.json() };
};
const lista = env => call(env, 'sparOpponents', {}, 'GET');
const pids = r => r.json.opponents.map(o => o.id);
/** Eu sou muito mais forte (level alto, save antigo): vitória garantida contra rookie. */
const FORTE = { evolutionStage: 'ultra-power', perfectDays: 999 };
const FRACO = { evolutionStage: 'rookie', perfectDays: 0 };
const OPP_FRACO = { evolutionStage: 'rookie', perfectDays: 0 };

describe('sorteio por faixa de Vínculo (puro)', () => {
  const rng = () => 0.3;
  const mk = bonds => bonds.map((bond, i) => ({ bond, i }));
  it('só entra quem está a ±3 níveis quando há 5 ou mais na faixa', () => {
    const r = pickSparOpponents(mk([7, 8, 9, 10, 11, 12, 13, 14, 30, 1]), 10, rng);
    expect(r.length).toBe(7);
    expect(r.every(p => Math.abs(p.bond - 10) <= SPAR_BOND_RANGE)).toBe(true);
  });
  it('amplia a faixa quando há menos de 5 candidatos', () => {
    const r = pickSparOpponents(mk([10, 11, 16, 17, 18, 40]), 10, rng);
    expect(r.length).toBeGreaterThanOrEqual(SPAR_PICKS);
    expect(r.some(p => p.bond === 16)).toBe(true);
  });
  it('pool menor que 5: devolve todos; pool vazio: nada', () => {
    expect(pickSparOpponents(mk([1, 50]), 10, rng).length).toBe(2);
    expect(pickSparOpponents([], 10, rng)).toEqual([]);
  });
  it('rng diferente muda a ordem (o refresh sorteia de novo)', () => {
    const pool = mk([8, 9, 10, 11, 12, 13, 9, 10, 11, 12]);
    const seq = (seed) => { let x = seed; return () => (x = (x * 16807) % 2147483647) / 2147483647; };
    const a = pickSparOpponents(pool, 10, seq(1)).map(p => p.i).join();
    const b = pickSparOpponents(pool, 10, seq(99)).map(p => p.i).join();
    expect(a).not.toBe(b);
  });
  it('Honra por vitória é 1 ou 2', () => {
    expect(sparHonorRoll(() => 0)).toBe(1);
    expect(sparHonorRoll(() => 0.99)).toBe(2);
  });
});

describe('paridade app x servidor (só a prévia da tela)', () => {
  it('SPAR_HONOR_MAX e o teto diário do app espelham os do servidor', () => {
    expect(MAX_APP).toBe(SPAR_HONOR_MAX);
    expect(CAP_APP).toBe(SPAR_HONOR_DAILY_CAP);
  });
});

describe('GET sparOpponents', () => {
  it('devolve 5 oponentes de um pool grande, sem número de ranking, só o level de luta', async () => {
    const { env } = mkEnv({ bonds: [8, 9, 10, 11, 12, 9, 10, 11, 12, 13] });
    const r = await lista(env);
    expect(r.status).toBe(200);
    expect(r.json.opponents.length).toBe(5);
    expect(new Set(pids(r)).size).toBe(5);
    for (const o of r.json.opponents) {
      expect(o.duel).toEqual({ level: expect.any(Number) });
      expect(JSON.stringify(o)).not.toMatch(/score|rank|points|lifetime|seed|atk|spd|special|fx/i);
    }
    expect(JSON.stringify(r.json)).not.toMatch(/"(points|rank|place|myPlace|matchesLeft)"/);
  });

  it('respeita a faixa de Vínculo: quem está longe fica de fora quando a faixa tem 5 ou mais', async () => {
    // Quem está longe de Vínculo E de nível fica de fora (quem é de nível similar entra mesmo com Vínculo distante: Sparring por nível, 11/11/2026).
    const longe6 = { evolutionStage: 'ultra-power', perfectDays: 999 };
    const { env, ids } = mkEnv({ meBond: 10, bonds: [9, 10, 11, 12, 8, 9, 40, 41, 1], oppSave: { 6: longe6, 7: longe6, 8: longe6 } });
    for (let i = 0; i < 15; i++) {
      const r = await lista(env);
      const longe = new Set(ids.filter(x => Math.abs(x.bond - 10) > 3).map(x => x.pid));
      expect(pids(r).some(p => longe.has(p))).toBe(false);
      expect(r.json.opponents.length).toBe(5);
    }
  });

  it('amplia a faixa quando há menos de 5 na vizinhança', async () => {
    const { env } = mkEnv({ meBond: 10, bonds: [10, 11, 17, 18, 19, 45] });
    const r = await lista(env);
    expect(r.json.opponents.length).toBeGreaterThanOrEqual(5);
  });

  it('exclui eu mesmo, quem não aceita PvP e quem está oculto da lista pública', async () => {
    const { env, ids } = mkEnv({ bonds: [10, 10, 10, 10, 10, 10, 10, 10], oppProfile: { 0: { pvpEnabled: false }, 1: { publicHidden: true } } });
    const vistos = new Set();
    for (let i = 0; i < 20; i++) (await lista(env)).json.opponents.forEach(o => vistos.add(o.id));
    expect(vistos.has(ids[0].pid)).toBe(false);
    expect(vistos.has(ids[1].pid)).toBe(false);
    expect(vistos.has(pidDe(0))).toBe(false);
    expect(vistos.size).toBe(6);
  });

  it('REFRESH ilimitado: 25 pedidos seguidos, nunca 429, e a amostra muda', async () => {
    const { env } = mkEnv({ bonds: Array(12).fill(10) });
    const amostras = new Set();
    const vistos = new Set();
    for (let i = 0; i < 25; i++) {
      const r = await lista(env);
      expect(r.status).toBe(200);
      amostras.add(pids(r).slice().sort().join());
      pids(r).forEach(p => vistos.add(p));
    }
    expect(amostras.size).toBeGreaterThan(3);
    expect(vistos.size).toBeGreaterThan(SPAR_PICKS);
  });

  it('não grava nada (nem rank, nem contador): só lê (a única chave nova é a âncora do fuso, `sparTz:`, gravada uma vez)', async () => {
    const { env, kv } = mkEnv({ bonds: [10, 10, 10, 10, 10] });
    const antes = [...kv.store.keys()].sort().join();
    await lista(env);
    expect([...kv.store.keys()].filter(k => !k.startsWith('sparTz:')).sort().join()).toBe(antes);
    const ancora = kv.store.get(`sparTz:${ME}`);
    await lista(env);
    expect(kv.store.get(`sparTz:${ME}`)).toBe(ancora); // 2ª leitura não regrava
  });
});

describe('treino: luta, não ranqueia, Honra', () => {
  const lutar = async (env, ids, taps = []) => {
    const o = ids[0];
    const s = await call(env, 'sparStart', { opponentId: o.pid });
    expect(s.status).toBe(200);
    return call(env, 'sparMatch', { opponentId: o.pid, taps, seed: s.json.seed, zone: 'UTC' });
  };

  it('a semente e a ficha nascem em sparStart; nada de partida gasta nem de rank', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    const s = await call(env, 'sparStart', { opponentId: ids[0].pid });
    expect(typeof s.json.seed).toBe('number');
    expect(s.json.me.combatant.level).toBeGreaterThan(s.json.opp.combatant.level);
    expect(s.json.matchesLeft).toBeUndefined();
    expect([...kv.store.keys()].some(k => k.startsWith('rank:'))).toBe(false);
  });

  it('vitória rende 1 a 2 de Honra e NÃO toca ranking, perfil nem lifetimePoints', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    const perfilAntes = kv.store.get(`profile:${ME}`);
    const perfilOppAntes = kv.store.get(`profile:${ids[0].id}`);
    const r = await lutar(env, ids);
    expect(r.status).toBe(200);
    expect(r.json.outcome).toBe('win');
    expect(r.json.honor).toBeGreaterThanOrEqual(1);
    expect(r.json.honor).toBeLessThanOrEqual(2);
    expect([...kv.store.keys()].some(k => k.startsWith('rank:'))).toBe(false);
    expect(kv.store.get(`profile:${ME}`)).toBe(perfilAntes);
    expect(kv.store.get(`profile:${ids[0].id}`)).toBe(perfilOppAntes);
    expect(JSON.stringify(r.json)).not.toMatch(/"(points|gain|matchesLeft|honorFactor)"/);
  });

  it('derrota não dá nada de ruim nem Honra', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FRACO, oppSave: [FORTE] });
    const r = await lutar(env, ids);
    expect(r.json.outcome).toBe('loss');
    expect(r.json.honor).toBe(0);
    expect([...kv.store.keys()].some(k => k.startsWith('rank:') || k.startsWith('sparHonor:'))).toBe(false);
  });

  it('teto de 20 de Honra por dia: com 19 já pagos, a vitória rende no máximo 1; com 20, zero e honorCapped', async () => {
    const dia = new Date().toISOString().slice(0, 10);
    const a = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    a.kv.store.set(sparHonorKey(ME, dia), String(SPAR_HONOR_DAILY_CAP - 1));
    const ra = await lutar(a.env, a.ids);
    expect(ra.json.honor).toBe(1);
    expect(a.kv.store.get(sparHonorKey(ME, dia))).toBe('20');
    const b = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    b.kv.store.set(sparHonorKey(ME, dia), '20');
    const rb = await lutar(b.env, b.ids);
    expect(rb.json.outcome).toBe('win');
    expect(rb.json.honor).toBe(0);
    expect(rb.json.honorCapped).toBe(true);
    expect(b.kv.store.get(sparHonorKey(ME, dia))).toBe('20');
  });

  it('o teto soma ao longo das lutas do dia e nunca passa de 20 (20 vitórias = o ticket grátis do dia)', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    let total = 0;
    for (let i = 0; i < 20; i++) total += (await lutar(env, ids)).json.honor; // o ticket grátis do dia são 20 partidas
    expect(total).toBeLessThanOrEqual(SPAR_HONOR_DAILY_CAP);
    expect(total).toBeGreaterThanOrEqual(SPAR_HONOR_DAILY_CAP); // 20 vitórias de 1–2 enchem o teto (mínimo 20 × 1)
    const dia = new Date().toISOString().slice(0, 10);
    expect(Number(kv.store.get(sparHonorKey(ME, dia)))).toBe(SPAR_HONOR_DAILY_CAP);
  });

  it('o dia é o do JOGADOR: o contador do dia seguinte começa de novo (contas com fusos extremos; o dia vem do start)', async () => {
    const dia = new Date().toISOString().slice(0, 10);
    let honra = 0;
    for (const off of [14 * 3600e3, -14 * 3600e3]) {
      const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
      kv.store.set(sparHonorKey(ME, dia), '20');
      const o = ids[0];
      const s = await call(env, 'sparStart', { opponentId: o.pid, off });
      const r = await call(env, 'sparMatch', { opponentId: o.pid, seed: s.json.seed, off });
      honra += r.json.honor;
    }
    // +14 h pode já ser o dia seguinte; -14 h pode ser o anterior (contador intocado). Um dos dois NÃO é o dia cheio.
    expect(honra).toBeGreaterThan(0);
  });

  it('fuso ±14 h NÃO vira dois dias: a âncora da conta é presa e a 2ª luta usa o MESMO dia/contador', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    const o = ids[0];
    for (const off of [14 * 3600e3, -14 * 3600e3, 14 * 3600e3, -14 * 3600e3]) {
      const s = await call(env, 'sparStart', { opponentId: o.pid, off });
      expect(s.status).toBe(200);
      await call(env, 'sparMatch', { opponentId: o.pid, seed: s.json.seed, off });
    }
    const dias = [...kv.store.keys()].filter(k => k.startsWith('sparTicket:'));
    expect(dias).toHaveLength(1); // um único "dia" de ticket, não 2-3
    expect(JSON.parse(kv.store.get(dias[0])).played).toBe(4);
    expect(JSON.parse(kv.store.get(`sparTz:${ME}`)).offsetMs).toBe(14 * 3600e3); // o primeiro valor ficou
  });

  it('a âncora presa só troca depois de 24 h (viagem real)', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    kv.store.set(`sparTz:${ME}`, JSON.stringify({ offsetMs: 14 * 3600e3, at: Date.now() - 25 * 3600e3 }));
    const s = await call(env, 'sparStart', { opponentId: ids[0].pid, off: -14 * 3600e3 });
    expect(s.status).toBe(200);
    expect(JSON.parse(kv.store.get(`sparTz:${ME}`)).offsetMs).toBe(-14 * 3600e3);
  });

  it('reenvio do mesmo resultado devolve o mesmo e NÃO paga Honra em dobro', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    const o = ids[0];
    const s = await call(env, 'sparStart', { opponentId: o.pid });
    const a = await call(env, 'sparMatch', { opponentId: o.pid, seed: s.json.seed });
    const b = await call(env, 'sparMatch', { opponentId: o.pid, seed: s.json.seed });
    expect(b.json.replayed).toBe(true);
    expect(b.json.honor).toBe(a.json.honor);
    const dia = new Date().toISOString().slice(0, 10);
    expect(Number(kv.store.get(sparHonorKey(ME, dia)))).toBe(a.json.honor);
  });

  it('sparMatch sem sparStart = 409; desistir = derrota sem Honra e sem custo', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    const o = ids[0];
    expect((await call(env, 'sparMatch', { opponentId: o.pid })).status).toBe(409);
    await call(env, 'sparStart', { opponentId: o.pid });
    const r = await call(env, 'sparMatch', { opponentId: o.pid, forfeit: true });
    expect(r.json.forfeit).toBe(true);
    expect(r.json.honor).toBe(0);
    expect([...kv.store.keys()].some(k => k.startsWith('rank:'))).toBe(false);
  });

  it('não luta contra si mesmo nem contra quem não aceita PvP', async () => {
    const { env, ids } = mkEnv({ bonds: [10], oppProfile: { 0: { pvpEnabled: false } } });
    expect((await call(env, 'sparStart', { opponentId: ids[0].pid })).status).toBe(404);
    expect((await call(env, 'sparStart', { opponentId: pidDe(0) })).status).toBe(404);
  });

  it('o ranqueado segue intocado: a cota de partidas e o rank só mudam pelo `match`', async () => {
    const { env, ids, kv } = mkEnv({ bonds: [10], meOver: FORTE, oppSave: [OPP_FRACO] });
    await lutar(env, ids);
    const r = await call(env, 'opponents', {}, 'GET');
    expect(r.json.matchesLeft).toBe(5);
    expect([...kv.store.keys()].some(k => k.startsWith('rank:') && k.includes(ME) && JSON.parse(kv.store.get(k)).points > 0)).toBe(false);
  });
});
