import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequest } from './guild.js';
import { feiraEvtKey, feiraTrailKey, feiraDeadKey, feiraDoneKey, feiraGateKey, feiraHitKey } from './_coop.js';
import { TRAIL_GAMES, solucaoDaTrilha, jogoDaTrilha, TRILHA_TENTATIVAS_DIA, TRAIL_MAX_DAYS } from './_feira.js';

/**
 * A TRILHA (F-06): o desafio pessoal semeado pelo servidor e conferido por SOLUÇÃO. Cumprir abre a porta da PRÓPRIA pessoa e
 * rega a Casa (seiva); NÃO mexe na vida de nenhum chefe (decisão do dono, 28/10/2026: sem -3% de HP, sem quórum).
 */
function fakeKV() {
  const store = new Map();
  const puts = [];
  return {
    store, puts,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { puts.push(k); store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const M = 'abcdefghijkl'.split('').map(c => sid(c + c));
const chamar = (e, action, body, method = 'POST') => onRequest({
  request: new Request(`https://x.dev/api/guild?action=${action}${method === 'GET' ? `&id=${body.id}` : ''}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined,
  }),
  env: e,
});
const J = r => r.json();
const dia = (d, hora = '12:00:00') => vi.setSystemTime(new Date(`${d}T${hora}Z`));
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

/** Um clã com a trilha k=0 aberta (a foto é gravada à mão: o mistério 0 do sorteio é sempre chefe). */
async function roda(n = 4, { inicio = '2026-11-10' } = {}) {
  vi.useFakeTimers({ toFake: ['Date'] });
  dia(inicio);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  const e = { DIGIAPP_SAVES: fakeKV(), FEIRA_CHEFE_DESDE: '2000-01-01' };
  const kv = e.DIGIAPP_SAVES;
  for (const m of M) kv.store.set(`profile:${m}`, JSON.stringify({ name: `N${m[0]}`, pid: `P${m[0]}${'q'.repeat(22)}`, stage: 'rookie' }));
  const g = (await J(await chamar(e, 'guildCreate', { id: M[0], name: 'Roda' }))).guild;
  for (const m of M.slice(1, n)) await chamar(e, 'guildJoin', { id: m, code: g.code });
  kv.store.set(feiraEvtKey(g.id), JSON.stringify({ k: 0, kind: 'trail', level: 1, bossId: null, hp0: 0, spawnDay: inicio }));
  return { e, kv, gid: g.id };
}
const start = (e, id) => chamar(e, 'guildFeiraTrailStart', { id });
const done = (e, id, corpo = {}) => chamar(e, 'guildFeiraTrailDone', { id, ...corpo });
const feira = async (e, id) => (await J(await chamar(e, 'guildFeira', { id }, 'GET'))).evento;

describe('guildFeiraTrailStart', () => {
  it('abre o desafio do dia: jogo da lista fechada, semente e puzzle SEM solução; a mesma semente se reabrir no dia', async () => {
    const { e, kv, gid } = await roda();
    const r = await start(e, M[1]);
    expect(r.status).toBe(200);
    const j = await J(r);
    expect(j.trail.k).toBe(0);
    expect(TRAIL_GAMES).toContain(j.trail.game);
    expect(j.trail.game).toBe(jogoDaTrilha(M[1], '2026-11-10', 0));
    expect(Number.isInteger(j.trail.seed)).toBe(true);
    expect(JSON.stringify(j.trail.puzzle)).not.toMatch(/solution/);
    expect(j.evento).toMatchObject({ kind: 'trail', trail: { pending: true, cleared: false }, gate: 'locked' });
    const outra = await J(await start(e, M[1]));
    expect(outra.trail.seed).toBe(j.trail.seed);
    expect(outra.trail.puzzle).toEqual(j.trail.puzzle);
    // a semente é por pessoa
    const m2 = await J(await start(e, M[2]));
    expect(m2.trail.seed).not.toBe(j.trail.seed);
    expect(kv.store.has(feiraTrailKey(gid, 0, M[1]))).toBe(true);
  });
  it('409 `no trail` com chefe; 404 sem guilda; novo dia, nova semente', async () => {
    const { e, kv, gid } = await roda();
    const s1 = (await J(await start(e, M[1]))).trail.seed;
    dia('2026-11-11');
    const s2 = (await J(await start(e, M[1]))).trail.seed;
    expect(s2).not.toBe(s1);
    kv.store.set(feiraEvtKey(gid), JSON.stringify({ k: 0, kind: 'boss', level: 1, bossId: 'cinderhorn', hp0: 540, spawnDay: '2026-11-10' }));
    const r = await start(e, M[1]);
    expect(r.status).toBe(409);
    expect((await J(r)).error).toBe('no trail');
    expect((await start(e, sid('zz'))).status).toBe(404);
  });
});

describe('guildFeiraTrailDone', () => {
  const resolve = async (e, id) => {
    const t = (await J(await start(e, id))).trail;
    vi.setSystemTime(new Date(Date.now() + 60_000)); // passa o piso de tempo plausível
    return { t, corpo: solucaoDaTrilha(t.game, t.seed) };
  };
  it('cumprir: 200, +3 de seiva na Casa, +1 Emblema (recibo), porta aberta; NENHUM chefe é tocado', async () => {
    const { e, kv, gid } = await roda();
    const { corpo } = await resolve(e, M[1]);
    const r = await done(e, M[1], corpo);
    expect(r.status).toBe(200);
    const j = await J(r);
    expect(j.cleared).toBe(true);
    expect(j.reward).toEqual({ emblems: 1, sap: 3 });
    expect(typeof j.receipt).toBe('string');
    expect(j.evento.trail).toMatchObject({ pending: false, cleared: true });
    expect(j.evento.gate).toBeUndefined();
    expect(JSON.parse(kv.store.get(feiraGateKey(M[1])))).toMatchObject({ k: 0, open: true });
    expect(JSON.parse(kv.store.get(`coopCasa:${gid}:${M[1]}`)).pts.missao).toBe(3);
    // sem efeito na vida de chefe nenhum
    expect([...kv.store.keys()].filter(k => k.startsWith('feiraHit:'))).toEqual([]);
    expect(Object.keys(j).sort()).toEqual(['cleared', 'evento', 'receipt', 'reward']);
  });
  it('é idempotente: o 2º envio é 409 `already cleared` com o MESMO recibo e sem seiva em dobro', async () => {
    const { e, kv, gid } = await roda();
    const { corpo } = await resolve(e, M[1]);
    const r1 = await J(await done(e, M[1], corpo));
    const casa = kv.store.get(`coopCasa:${gid}:${M[1]}`);
    const r2 = await done(e, M[1], corpo);
    expect(r2.status).toBe(409);
    const j2 = await J(r2);
    expect(j2.error).toBe('already cleared');
    expect(j2.receipt).toBe(r1.receipt);
    expect(kv.store.get(`coopCasa:${gid}:${M[1]}`)).toBe(casa);
    expect((await start(e, M[1])).status).toBe(409);
  });
  it('solução inválida: 400 `wrong solution`, nada é cumprido; sem abrir o desafio antes: 409 `not started`', async () => {
    const { e, kv, gid } = await roda();
    expect((await done(e, M[1], { path: [0] })).status).toBe(409);
    const { t } = await resolve(e, M[1]);
    const r = await done(e, M[1], t.game === 'eco' ? { score: 1 } : { path: [1, 2, 3], rects: [], cells: [[1]], sides: ['left'] });
    expect(r.status).toBe(400);
    expect((await J(r)).error).toBe('wrong solution');
    expect(JSON.parse(kv.store.get(feiraTrailKey(gid, 0, M[1]))).clearedDay).toBeNull();
    expect(kv.store.has(feiraGateKey(M[1]))).toBe(false);
  });
  it('rápido demais (antes do piso de tempo plausível): 400 `too fast`, mesmo com a solução certa', async () => {
    const { e } = await roda();
    const t = (await J(await start(e, M[1]))).trail;
    const r = await done(e, M[1], solucaoDaTrilha(t.game, t.seed));
    expect(r.status).toBe(400);
    expect((await J(r)).error).toBe('too fast');
  });
  it('a solução vale para a SEMENTE GUARDADA: a de outra semente não passa', async () => {
    const { e } = await roda();
    const t = (await J(await start(e, M[1]))).trail;
    vi.setSystemTime(new Date(Date.now() + 60_000));
    const outra = solucaoDaTrilha(t.game, (t.seed + 777) >>> 0);
    const r = await done(e, M[1], t.game === 'eco' ? { score: 1 } : outra);
    expect(r.status).toBe(400);
  });
  it('cada jogo da lista cumpre pelo seu verificador (inclusive o reflexo, por `scoreIsPlausible` + alvo modesto)', async () => {
    const { e, kv, gid } = await roda(6);
    for (const [i, game] of TRAIL_GAMES.entries()) {
      const m = M[i + 1];
      const seed = 1000 + i;
      kv.store.set(feiraTrailKey(gid, 0, m), JSON.stringify({ k: 0, day: '2026-11-10', game, seed, startedAt: Date.now() - 120_000, attempts: 0, clearedDay: null }));
      const r = await done(e, m, solucaoDaTrilha(game, seed));
      expect(r.status, game).toBe(200);
    }
    // reflexo: score acima do teto plausível do jogo é recusado
    kv.store.set(feiraTrailKey(gid, 0, M[0]), JSON.stringify({ k: 0, day: '2026-11-10', game: 'eco', seed: 5, startedAt: Date.now() - 120_000, attempts: 0, clearedDay: null }));
    expect((await done(e, M[0], { score: 5000 })).status).toBe(400);
  });
  it('limite de tentativas por dia: 429 `daily limit`', async () => {
    const { e, kv, gid } = await roda();
    const t = (await J(await start(e, M[1]))).trail;
    vi.setSystemTime(new Date(Date.now() + 60_000));
    const reg = JSON.parse(kv.store.get(feiraTrailKey(gid, 0, M[1])));
    kv.store.set(feiraTrailKey(gid, 0, M[1]), JSON.stringify({ ...reg, attempts: TRILHA_TENTATIVAS_DIA }));
    const r = await done(e, M[1], solucaoDaTrilha(t.game, t.seed));
    expect(r.status).toBe(429);
  });
});

describe('a porta (gate) é individual', () => {
  it('cada um tem a sua: quem cumpriu abre a própria; os outros seguem com `gate: locked`', async () => {
    const { e } = await roda();
    const t = (await J(await start(e, M[1]))).trail;
    vi.setSystemTime(new Date(Date.now() + 60_000));
    await done(e, M[1], solucaoDaTrilha(t.game, t.seed));
    expect((await feira(e, M[1])).gate).toBeUndefined();
    expect((await feira(e, M[2])).gate).toBe('locked');
    expect((await feira(e, M[3])).trail).toMatchObject({ pending: true, cleared: false });
  });
  it('a Missão segue livre com a porta travada (o gate é só da camada nova; o servidor nunca bloqueia `guildRaidHit`)', async () => {
    const { e } = await roda();
    const r = await chamar(e, 'guildRaidHit', { id: M[2] });
    expect(r.status).toBe(200);
    const j = await J(r);
    expect(j.landed).toBe(true);
    expect(j.evento).toMatchObject({ kind: 'trail', gate: 'locked' });
  });
});

describe('o fim da Trilha (sem estagnação, LV-G3/G9) e o descanso', () => {
  it('o dia fecha com PELO MENOS 1 cumprimento: o mistério conta, descansa no dia seguinte e o próximo abre em d+2', async () => {
    const { e, kv, gid } = await roda();
    const t = (await J(await start(e, M[1]))).trail;
    vi.setSystemTime(new Date(Date.now() + 60_000));
    await done(e, M[1], solucaoDaTrilha(t.game, t.seed));
    // no próprio dia ainda está aberta (outros podem cumprir)
    expect((await feira(e, M[2])).kind).toBe('trail');
    expect(kv.store.has(feiraDeadKey(gid, 0))).toBe(false);
    dia('2026-11-11');
    const ev = await feira(e, M[2]);
    expect(ev).toMatchObject({ rest: true, kind: 'rest', level: 2, k: 1 });
    expect(JSON.parse(kv.store.get(feiraDeadKey(gid, 0)))).toMatchObject({ kind: 'trail', day: '2026-11-10', marks: 1 });
    expect(JSON.parse(kv.store.get(feiraDoneKey(gid)))).toMatchObject({ n: 1, trails: 1, bosses: 0, lastDay: '2026-11-10', lastKind: 'trail' });
    // quem NÃO cumpriu fica sem porta travada depois que o mistério acaba (sem punição)
    expect((await feira(e, M[2])).gate).toBeUndefined();
    dia('2026-11-12');
    expect(await feira(e, M[2])).toMatchObject({ k: 1, level: 2 });
  });
  it(`ninguém cumpre: a trilha termina sozinha no ${TRAIL_MAX_DAYS}º dia (nunca trava o clã)`, async () => {
    const { e, kv, gid } = await roda();
    dia('2026-11-11');
    expect((await feira(e, M[0])).kind).toBe('trail');
    dia('2026-11-12');
    expect((await feira(e, M[0])).kind).toBe('trail'); // ainda é o 3º dia
    dia('2026-11-13');
    expect((await feira(e, M[0])).rest).toBe(true);
    expect(JSON.parse(kv.store.get(feiraDeadKey(gid, 0)))).toMatchObject({ kind: 'trail', day: '2026-11-12', marks: 0 });
    dia('2026-11-14');
    expect((await feira(e, M[0])).k).toBe(1);
  });
  it('o fim da trilha é constante: sair do clã não o reabre nem muda a marca', async () => {
    const { e, kv, gid } = await roda();
    const t = (await J(await start(e, M[1]))).trail;
    vi.setSystemTime(new Date(Date.now() + 60_000));
    await done(e, M[1], solucaoDaTrilha(t.game, t.seed));
    dia('2026-11-11');
    await feira(e, M[0]);
    const antes = kv.store.get(feiraDeadKey(gid, 0));
    await chamar(e, 'guildLeave', { id: M[1] });
    await feira(e, M[0]);
    expect(kv.store.get(feiraDeadKey(gid, 0))).toBe(antes);
  });
  it('a vista mostra só estado e a contagem agregada de marcas da trilha (nunca quem cumpriu)', async () => {
    const { e } = await roda();
    const t = (await J(await start(e, M[1]))).trail;
    vi.setSystemTime(new Date(Date.now() + 60_000));
    await done(e, M[1], solucaoDaTrilha(t.game, t.seed));
    const v = (await J(await chamar(e, 'guild', { id: M[2] }, 'GET'))).guild;
    expect(v.feira).toEqual({ state: 'trail', level: 1, marks: 1 });
    const txt = JSON.stringify(v);
    for (const m of M) expect(txt).not.toContain(m);
    // o bônus de HP da trilha NÃO existe: o próximo chefe nasce com o HP cheio da tabela
    expect(txt).not.toMatch(/trailBonus|bonus/i);
  });
  it('a Trilha não escreve chave de chefe (feiraHit) e só cria chaves feira*, a casa e o cartão', async () => {
    const { e, kv, gid } = await roda();
    await feira(e, M[0]);
    kv.puts.length = 0;
    const t = (await J(await start(e, M[1]))).trail;
    vi.setSystemTime(new Date(Date.now() + 60_000));
    await done(e, M[1], solucaoDaTrilha(t.game, t.seed));
    for (const k of kv.puts) expect(k, k).toMatch(/^(feira(Trail|Gate|Evt|Dead|Done):|coopCasa:|coopMem:)/);
    expect(kv.store.has(feiraHitKey(gid, 0, M[1]))).toBe(false);
  });
});
