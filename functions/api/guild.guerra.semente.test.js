import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';
import { coopKey } from './_coop.js';
import {
  SEED_REGISTRY_KEY, SEED_TAG, coopWarSeedKey, coopWarResKey, coopWarQKey, coopWarWaitKey,
  gidsDoRegistro, ordemDasSementes,
} from './_guerra.js';

/**
 * RIVAL SEMENTE NA GUERRA (REGISTRO §322): sem rival real na fila do tamanho, a guilda real luta contra uma
 * guilda semente (`seedGuild:v1`). Inerte sem o registro; nunca contra si; uma guerra por semente por vez;
 * o lado semente não ganha nem grava nada; custo de KV pequeno e o registro lido uma vez só quando a fila está vazia.
 */
const DAY = 86_400_000;
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const meta = new Map();
  const gets = [];
  const puts = [];
  return {
    store, meta, gets, puts,
    get: async k => { gets.push(k); return store.get(k) ?? null; },
    getWithMetadata: async k => { gets.push(k); return { value: store.get(k) ?? null, metadata: meta.get(k) ?? null }; },
    put: async (k, v, o) => { puts.push(k); store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async k => { puts.push(`DEL ${k}`); store.delete(k); meta.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const perfil = (id, nome) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, petName: 'p', stage: 'rookie', attrs: {}, friends: [], createdAt: Date.now() });
const saveDe = () => JSON.stringify({ evolutionStage: 'rookie', perfectDays: 3, totalXP: 5000 });
const req = (action, { method = 'POST', body, params = {} } = {}) =>
  new Request(`https://x.dev/api/guild?${new URLSearchParams({ action, ...params })}`, { method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined });
const call = (e, a, o) => onRequest({ request: req(a, o), env: e });
const J = r => r.json();
const mk = (p, n) => Array.from({ length: n }, (_, i) => sid(`${p}${i}`));
const seek = (e, id) => call(e, 'guildWarSeek', { body: { id } }).then(J);

async function mundo(guildas, { semSave = [] } = {}) {
  const seed = {};
  const todos = Object.values(guildas).flat();
  for (const m of todos) { seed[`profile:${m}`] = perfil(m, `N${m.slice(0, 3)}`); if (!semSave.includes(m)) seed[m] = saveDe(); }
  const kv = fakeKV(seed);
  for (const m of todos) kv.meta.set(m, { t: Date.now(), f: Date.now() - 90 * DAY });
  const e = { DIGIAPP_SAVES: kv };
  const out = {};
  for (const [nome, membros] of Object.entries(guildas)) {
    const c = await J(await call(e, 'guildCreate', { body: { id: membros[0], name: nome } }));
    for (const m of membros.slice(1)) await call(e, 'guildJoin', { body: { id: m, code: c.guild.code } });
    out[nome] = { id: c.guild.id, host: membros[0], membros };
  }
  return { e, g: out };
}
/** Marca a guilda como semente, como o script do dono faz (`seed.tag` + `seed.members` = os simulados). */
function semear(e, guilda, { reais = [] } = {}) {
  const blob = JSON.parse(e.DIGIAPP_SAVES.store.get(coopKey(guilda.id)));
  blob.seed = { v: 1, tag: SEED_TAG, slot: 'x', members: guilda.membros.filter(m => !reais.includes(m)), at: 1 };
  e.DIGIAPP_SAVES.store.set(coopKey(guilda.id), JSON.stringify(blob));
}
const registrar = (e, ...guildas) => e.DIGIAPP_SAVES.store.set(SEED_REGISTRY_KEY, JSON.stringify({
  v: 1, tag: SEED_TAG, slots: Object.fromEntries(guildas.map((x, i) => [`s${i}`, { gid: x.id, code: 'ZZZZ2345' }])),
}));
const zerar = e => { e.DIGIAPP_SAVES.gets.length = 0; e.DIGIAPP_SAVES.puts.length = 0; };
const leiturasDe = (e, k) => e.DIGIAPP_SAVES.gets.filter(x => x === k).length;

describe('guerra contra guilda semente (§322)', () => {
  it('INERTE sem o registro: fila vazia = espera, como antes (1 leitura do registro, nada de reserva)', async () => {
    const { e, g } = await mundo({ Alfa: mk('a', 3), Semente: mk('s', 12) });
    semear(e, g.Semente); // o blob marcado sozinho não basta: sem `seedGuild:v1` nada muda
    zerar(e);
    const r = await seek(e, g.Alfa.host);
    expect(r.state).toBe('waiting');
    expect(leiturasDe(e, SEED_REGISTRY_KEY)).toBe(1);
    expect(e.DIGIAPP_SAVES.gets.some(k => k.startsWith('coopWarSeed:'))).toBe(false);
    expect(e.DIGIAPP_SAVES.store.has(coopWarQKey(3))).toBe(true);
  });

  it('fila vazia + semente livre: luta NA HORA, do mesmo tamanho, com o nome da semente no resultado', async () => {
    const { e, g } = await mundo({ Alfa: mk('a', 3), 'Brasa Viva': mk('s', 12) });
    semear(e, g['Brasa Viva']);
    registrar(e, g['Brasa Viva']);
    const r = await seek(e, g.Alfa.host);
    expect(r.state).toBe('done');
    expect(r.war.last.size).toBe(3);
    expect(r.war.last.duels).toHaveLength(3);
    expect(r.war.last.enemy).toBe('Brasa Viva');
    // A vista da guerra mostra o mesmo resultado; ninguém ficou na fila.
    const v = await J(await call(e, 'guildWar', { method: 'GET', params: { id: g.Alfa.host } }));
    expect(v.war).toEqual({ waiting: null, last: r.war.last });
    expect(e.DIGIAPP_SAVES.store.has(coopWarQKey(3))).toBe(false);
    // Uma guerra por dia continua valendo.
    expect((await seek(e, g.Alfa.host)).state).toBe('already');
  });

  it('o lado semente NÃO ganha nada e NÃO grava nada (sem resultado, sem seiva, sem fila); o real recebe a seiva', async () => {
    const { e, g } = await mundo({ Alfa: mk('a', 2), Semente: mk('s', 12) });
    semear(e, g.Semente);
    registrar(e, g.Semente);
    await seek(e, g.Alfa.host);
    const chaves = [...e.DIGIAPP_SAVES.store.keys()];
    expect(chaves.filter(k => k.includes(g.Semente.id) && k !== coopKey(g.Semente.id) && !k.startsWith('coopCode') && !k.startsWith('coopOf') && !k.startsWith('coopMem') && !k.startsWith('coopDir'))).toEqual([coopWarSeedKey(g.Semente.id)]);
    expect(e.DIGIAPP_SAVES.store.has(coopWarResKey(g.Semente.id))).toBe(false);
    expect(chaves.some(k => k.startsWith(`coopCasa:${g.Semente.id}:`))).toBe(false);
    expect(e.DIGIAPP_SAVES.store.has(coopWarWaitKey(g.Semente.id))).toBe(false);
    // Os saves dos simulados não mudam (lutam com o que já têm).
    for (const m of g.Semente.membros) expect(e.DIGIAPP_SAVES.store.get(m)).toBe(saveDe());
    const casa = JSON.parse(e.DIGIAPP_SAVES.store.get(`coopCasa:${g.Alfa.id}:${g.Alfa.host}`));
    expect(casa.pts.guerra).toBeGreaterThan(0);
  });

  it('com rival REAL na fila, pareia com ele e NEM LÊ o registro', async () => {
    const { e, g } = await mundo({ Alfa: mk('a', 3), Beta: mk('b', 3), Semente: mk('s', 12) });
    semear(e, g.Semente);
    // Alfa entra na fila ANTES de existir semente; depois o dono semeia.
    expect((await seek(e, g.Alfa.host)).state).toBe('waiting');
    registrar(e, g.Semente);
    zerar(e);
    const r = await seek(e, g.Beta.host);
    expect(r.state).toBe('done');
    expect(r.war.last.enemy).toBe('Alfa');
    expect(leiturasDe(e, SEED_REGISTRY_KEY)).toBe(0);
    expect(e.DIGIAPP_SAVES.store.has(coopWarSeedKey(g.Semente.id))).toBe(false);
  });

  it('nunca contra si: a guilda semente onde um real buscou não pareia consigo mesma', async () => {
    const { e, g } = await mundo({ Semente: mk('s', 12) });
    semear(e, g.Semente, { reais: [g.Semente.host] });
    registrar(e, g.Semente);
    const r = await seek(e, g.Semente.host);
    expect(r.state).toBe('waiting');
    expect(e.DIGIAPP_SAVES.store.has(coopWarSeedKey(g.Semente.id))).toBe(false);
  });

  it('semente nunca em duas guerras ao mesmo tempo: a reserva manda a 2ª guilda para a próxima semente ou para a fila', async () => {
    const { e, g } = await mundo({ Alfa: mk('a', 2), Beta: mk('b', 2), Gama: mk('c', 2), Semente: mk('s', 12) });
    semear(e, g.Semente);
    registrar(e, g.Semente);
    expect((await seek(e, g.Alfa.host)).state).toBe('done');
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopWarSeedKey(g.Semente.id)))).toMatchObject({ gid: g.Alfa.id });
    // A única semente está reservada: Beta entra na fila…
    expect((await seek(e, g.Beta.host)).state).toBe('waiting');
    // …e a próxima guilda real pareia com Beta pela fila, não com a semente.
    const r = await seek(e, g.Gama.host);
    expect(r.state).toBe('done');
    expect(r.war.last.enemy).toBe('Beta');
    // Duas sementes: a 2ª guilda vai para a outra.
    const dois = await mundo({ X: mk('x', 2), Y: mk('y', 2), S1: mk('s', 12), S2: mk('t', 12) });
    semear(dois.e, dois.g.S1); semear(dois.e, dois.g.S2);
    registrar(dois.e, dois.g.S1, dois.g.S2);
    const rx = await seek(dois.e, dois.g.X.host), ry = await seek(dois.e, dois.g.Y.host);
    expect([rx.war.last.enemy, ry.war.last.enemy].sort()).toEqual(['S1', 'S2']);
  });

  it('só blob MARCADO e só os simulados marcados: sem o marcador, ou sem simulados com ficha do tamanho, não pareia', async () => {
    const { e, g } = await mundo({ Alfa: mk('a', 3), Falsa: mk('f', 12) });
    registrar(e, g.Falsa); // registro aponta para guilda sem `seed.tag`
    expect((await seek(e, g.Alfa.host)).state).toBe('waiting');
    // Semente com só 2 simulados com save: não forma esquadrão de 3 (o real que entrou não luta pelo lado semente).
    const sem = mk('s', 12);
    const w = await mundo({ Beta: mk('b', 3), Semente: sem }, { semSave: sem.slice(3) });
    semear(w.e, w.g.Semente, { reais: [sem[0]] });
    registrar(w.e, w.g.Semente);
    expect((await seek(w.e, w.g.Beta.host)).state).toBe('waiting');
  });

  it('custo de KV do caminho semente: registro 1×, reserva + blob da semente, os saves do esquadrão; 2 escritas + a seiva', async () => {
    const { e, g } = await mundo({ Alfa: mk('a', 2), Semente: mk('s', 12) });
    semear(e, g.Semente);
    registrar(e, g.Semente);
    zerar(e);
    await seek(e, g.Alfa.host);
    const kv = e.DIGIAPP_SAVES;
    expect(leiturasDe(e, SEED_REGISTRY_KEY)).toBe(1);
    expect(leiturasDe(e, coopWarSeedKey(g.Semente.id))).toBe(1);
    expect(leiturasDe(e, coopKey(g.Semente.id))).toBe(1);
    // Só os 2 simulados que lutam são lidos (nunca os 12).
    expect(kv.gets.filter(k => g.Semente.membros.includes(k))).toHaveLength(2);
    const escritasDaGuerra = kv.puts.filter(k => !k.startsWith('coopCasa:') && !k.startsWith('DEL '));
    expect(escritasDaGuerra.sort()).toEqual([coopWarResKey(g.Alfa.id), coopWarSeedKey(g.Semente.id)].sort());
    expect(kv.puts.filter(k => k.startsWith('DEL '))).toEqual([]);
  });
});

describe('registro e ordem das sementes (puros)', () => {
  it('registro ausente/ilegível = nenhuma semente; gids na ordem do slot, sem repetir', () => {
    expect(gidsDoRegistro(null)).toEqual([]);
    expect(gidsDoRegistro({ slots: [] })).toEqual([]);
    expect(gidsDoRegistro({ slots: { b: { gid: 'G2' }, a: { gid: 'G1' }, c: { gid: 'G1' }, d: { gid: 7 } } })).toEqual(['G1', 'G2']);
  });
  it('a própria guilda nunca entra na ordem; a ordem é estável no dia', () => {
    const gids = ['A', 'B', 'C', 'D'];
    const o = ordemDasSementes(gids, 'B', '2026-11-13');
    expect(o).not.toContain('B');
    expect(o.sort()).toEqual(['A', 'C', 'D']);
    expect(ordemDasSementes(gids, 'X', '2026-11-13')).toEqual(ordemDasSementes(gids, 'X', '2026-11-13'));
    expect(ordemDasSementes(['B'], 'B', '2026-11-13')).toEqual([]);
  });
});
