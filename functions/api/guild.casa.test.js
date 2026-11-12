import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';
import { CASA_BITS_POR_DIA, CASA_THRESHOLDS, casaStageFor, normalizarCasa, somarPontos } from './_casa.js';

function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const A = sid('casaA'), B = sid('casaB');
const perfil = (id, nome) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, petName: 'p', stage: 'rookie', attrs: {}, friends: [], createdAt: Date.now() });
const req = (action, { method = 'POST', body, params = {} } = {}) =>
  new Request(`https://x.dev/api/guild?${new URLSearchParams({ action, ...params })}`, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined });
const call = (e, a, o) => onRequest({ request: req(a, o), env: e });

async function setup() {
  const e = { DIGIAPP_SAVES: fakeKV({ [`profile:${A}`]: perfil(A, 'Ana'), [`profile:${B}`]: perfil(B, 'Beto') }) };
  const c = await (await call(e, 'guildCreate', { body: { id: A, name: 'Casa' } })).json();
  await call(e, 'guildJoin', { body: { id: B, code: c.guild.code } });
  return { e, code: c.guild.code, gid: c.guild.id };
}
const vista = async (e, id) => (await (await call(e, 'guild', { method: 'GET', params: { id } })).json()).guild;

describe('a casa da guilda', () => {
  it('doar: UMA vez por dia, só 50 ou 100; a 2ª é recusada (429) e o servidor diz quanto aceitou', async () => {
    const { e } = await setup();
    const r1 = await (await call(e, 'guildDonate', { body: { id: A, bits: 100 } })).json();
    expect(r1.accepted).toBe(100);
    expect(CASA_BITS_POR_DIA).toBe(100);
    for (const bits of [50, 100]) expect((await call(e, 'guildDonate', { body: { id: A, bits } })).status).toBe(429);
    expect((await vista(e, A)).casa.mine.capReached).toBe(true);
    // outra pessoa do clã ainda pode (o limite é por pessoa)
    expect((await (await call(e, 'guildDonate', { body: { id: B, bits: 50 } })).json()).accepted).toBe(50);
  });
  it('só 50 ou 100: qualquer outro valor é recusado (400), sem arredondar', async () => {
    const { e } = await setup();
    for (const bits of [0, -5, 5, 10, 57, 60, 150, 200, NaN, '50', 'abc', null]) expect((await call(e, 'guildDonate', { body: { id: A, bits } })).status).toBe(400);
    expect((await (await call(e, 'guildDonate', { body: { id: A, bits: 50 } })).json()).accepted).toBe(50);
  });
  it('no dia seguinte do jogador a doação volta a valer', async () => {
    const { e } = await setup();
    const doar = (dayKey) => call(e, 'guildDonate', { body: { id: A, bits: 50, dayKey } });
    const hoje = new Date().toISOString().slice(0, 10);
    const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    expect((await doar(hoje)).status).toBe(200);
    expect((await doar(hoje)).status).toBe(429);
    expect((await doar(amanha)).status).toBe(200);
  });
  it('alternar o dayKey (±1 dia) NÃO reabre a doação: dia igual ou anterior ao último doado = 429 (segurança, rodada 1)', async () => {
    const { e } = await setup();
    const hoje = new Date().toISOString().slice(0, 10);
    const ontem = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const amanha = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const doar = (dayKey) => call(e, 'guildDonate', { body: { id: A, bits: 100, dayKey } });
    expect((await doar(hoje)).status).toBe(200);
    expect((await doar(ontem)).status).toBe(429);
    expect((await doar(hoje)).status).toBe(429);
    expect((await doar(amanha)).status).toBe(200);
    for (const d of [ontem, hoje, amanha]) expect((await doar(d)).status).toBe(429);
  });
  it('sem guilda, 404', async () => {
    const e = { DIGIAPP_SAVES: fakeKV({ [`profile:${A}`]: perfil(A, 'Ana') }) };
    expect((await call(e, 'guildDonate', { body: { id: A, bits: 50 } })).status).toBe(404);
    expect((await call(e, 'guildSlot', { body: { id: A, item: 'furn-lamp' } })).status).toBe(404);
  });
  it('a vista nunca carrega pontos, limiares nem doação por pessoa', async () => {
    const { e } = await setup();
    await call(e, 'guildDonate', { body: { id: A, bits: 100 } });
    await call(e, 'guildSlot', { body: { id: A, item: 'furn-lamp' } });
    const txt = JSON.stringify(await vista(e, B));
    for (const proibido of ['pts', 'bitsToday', 'doacao', 'legado', 'total']) expect(txt).not.toContain(proibido);
    const casa = (await vista(e, B)).casa;
    expect(Object.keys(casa).sort()).toEqual(['bitsTotal', 'buffs', 'mine', 'nivel', 'nivelIndex', 'perto', 'slots']);
    expect(casa.slots).toHaveLength(1);
    expect(casa.slots[0]).toMatchObject({ item: 'furn-lamp', euMesmo: false });
    expect(casa.mine.slot).toBeNull(); // o slot do outro não é "meu"
  });
  it('slot: aceita id de decoração e null; recusa o resto', async () => {
    const { e } = await setup();
    for (const item of ['', 'A B', '../x', 'x'.repeat(50), 7]) expect((await call(e, 'guildSlot', { body: { id: A, item } })).status).toBe(400);
    await call(e, 'guildSlot', { body: { id: A, item: 'trophy-concha-mare' } });
    expect((await vista(e, A)).casa.mine.slot).toBe('trophy-concha-mare');
    await call(e, 'guildSlot', { body: { id: A, item: null } });
    expect((await vista(e, A)).casa.mine.slot).toBeNull();
  });
  it('sair NÃO encolhe a casa (os pontos viram legado) e tira o slot', async () => {
    const { e } = await setup();
    // Chega ao estágio 1 só com a doação de A (40 pts = 400 Bits em 2 dias não cabe; uso a fonte missão).
    const g = await vista(e, A);
    await call(e, 'guildSlot', { body: { id: B, item: 'furn-rug' } });
    await call(e, 'guildDonate', { body: { id: B, bits: 100 } }); // 10 pts
    await somarPontos(e, g.id, B, 'missao', 30);                 // +30 = 40 → haste
    await call(e, 'guildCheckin', { body: { id: B } });          // reconstrói o cartão de B
    expect((await vista(e, A)).casa.nivel).toBe('haste');
    await call(e, 'guildLeave', { body: { id: B } });
    const depois = await vista(e, A);
    expect(depois.casa.nivel).toBe('haste');
    expect(depois.casa.slots).toEqual([]);
  });
  it('bitsTotal: soma o que o clã doou (um número do clã) e NÃO encolhe quando quem doou sai', async () => {
    const { e } = await setup();
    expect((await vista(e, A)).casa.bitsTotal).toBe(0);
    await call(e, 'guildDonate', { body: { id: A, bits: 100 } });
    await call(e, 'guildDonate', { body: { id: B, bits: 50 } });
    expect((await vista(e, A)).casa.bitsTotal).toBe(150);
    await call(e, 'guildLeave', { body: { id: B } });
    expect((await vista(e, A)).casa.bitsTotal).toBe(150);
  });
  it('estágio é monótono e derivado dos limiares', () => {
    let ant = -1;
    for (let t = 0; t < 1200; t += 7) { const s = casaStageFor(t).stageIndex; expect(s).toBeGreaterThanOrEqual(ant); ant = s; }
    expect(casaStageFor(CASA_THRESHOLDS[5]).stageIndex).toBe(5);
    expect(casaStageFor(0).stageIndex).toBe(0);
    expect(normalizarCasa({ pts: { doacao: -3, missao: 'x' }, slot: '!!' })).toEqual({ v: 1, day: null, bitsToday: 0, pts: { doacao: 0, missao: 0, guerra: 0 }, desafioBits: 0, desafioDay: null, slot: null });
  });
});

describe('a missão rega a casa', () => {
  it('pontosDeMissao cresce com o level e com a roda, é inteiro e fica entre 4 e 17', async () => {
    const { pontosDeMissao } = await import('./_casa.js');
    expect(pontosDeMissao(1, 1)).toBe(4);
    expect(pontosDeMissao(5, 12)).toBe(17);
    for (let p = 1; p < 5; p++) expect(pontosDeMissao(p + 1, 4)).toBeGreaterThan(pontosDeMissao(p, 4));
    for (let n = 1; n < 12; n++) expect(pontosDeMissao(3, n + 1)).toBeGreaterThanOrEqual(pontosDeMissao(3, n));
    expect(Number.isInteger(pontosDeMissao(2.7, 5.5))).toBe(true);
    expect(pontosDeMissao(NaN, NaN)).toBe(4);
  });
  it('voltar da missão (guildRaidHit) soma seiva na casa, uma vez por dia', async () => {
    const { e } = await setup();
    // Chega no estágio 1 com 40 pontos: 10 missões não cabem em 1 dia, então injeta 36 por fonte direta e fecha com a missão real.
    const g = await vista(e, A);
    const { somarPontos } = await import('./_casa.js');
    await somarPontos(e, g.id, B, 'missao', 36);
    await call(e, 'guildCheckin', { body: { id: B } });
    expect((await vista(e, A)).casa.nivel).toBe('fagulha');
    const r = await call(e, 'guildRaidHit', { body: { id: A } });
    expect(r.status).toBe(200);
    expect((await vista(e, A)).casa.nivel).toBe('haste');
    expect((await call(e, 'guildRaidHit', { body: { id: A } })).status).toBe(429);
  });
});
