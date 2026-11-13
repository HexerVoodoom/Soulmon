import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';
import { COOP_MAX_MEMBERS } from './_coop.js';
import {
  DIR_PREFIX, DIR_FULL_PREFIX, DIRETORIO_MAX, DIRETORIO_CHEIOS_MAX,
  sincronizarDiretorio, assinaturaDoDiretorio, tipoDaAssinatura, listarDiretorio, lerEntrada, idDoDiretorio,
} from './_claDiretorio.js';

/**
 * CLÃS CHEIOS NO DIRETÓRIO (REGISTRO §322): o clã cheio continua listado, marcado `full: true`, DEPOIS dos que
 * têm vaga e em prefixo próprio — nunca toma lugar dos que têm vaga, nem na janela do `list` nem no teto.
 * Campos públicos de sempre; pedir para entrar num cheio continua 409.
 */
function fakeKV() {
  const store = new Map();
  const meta = new Map();
  const ops = [];
  return {
    store, ops,
    get: async k => store.get(k) ?? null,
    put: async (k, v, o) => { ops.push(`PUT ${k}`); store.set(k, v); if (o?.metadata) meta.set(k, o.metadata); else meta.delete(k); },
    delete: async k => { ops.push(`DEL ${k}`); store.delete(k); meta.delete(k); },
    // Ordem de chave, como o KV de verdade: a janela do `list` corta pelo hash opaco, não pela vaga.
    list: async ({ prefix = '', limit = 1000 }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).sort().slice(0, limit).map(name => ({ name, metadata: meta.get(name) })),
      list_complete: true,
    }),
  };
}
const MAX = COOP_MAX_MEMBERS;
const membros = (p, n) => Array.from({ length: n }, (_, i) => `${p}${String(i).padStart(2, '0')}`.padEnd(32, '0'));
const grupo = (id, name, n, extra = {}) => ({ id: id.padEnd(16, '0'), name, members: membros(id.slice(0, 3), n), code: 'ABCD2345', hostSave: 'h', ...extra });

describe('assinatura e transição de prefixo', () => {
  it('com vaga = nome|n; cheio = nome|n|cheia; vazio ou "Aceitar pedidos" desligado = x', () => {
    expect(assinaturaDoDiretorio(grupo('g1', 'Roda', 3), MAX)).toBe('Roda|3');
    expect(assinaturaDoDiretorio(grupo('g1', 'Roda', MAX), MAX)).toBe(`Roda|${MAX}|cheia`);
    expect(assinaturaDoDiretorio(grupo('g1', 'Roda', 0), MAX)).toBe('x');
    expect(assinaturaDoDiretorio(grupo('g1', 'Roda', MAX, { dirClosed: true }), MAX)).toBe('x');
    expect(tipoDaAssinatura('Roda|3')).toBe('aberta');
    expect(tipoDaAssinatura(`Roda|${MAX}|cheia`)).toBe('cheia');
    expect(tipoDaAssinatura('x')).toBeNull();
    expect(tipoDaAssinatura(undefined)).toBeNull();
  });

  it('encher move a entrada para coopDirFull (put + delete); abrir vaga volta; sem `antes`, apaga os dois', async () => {
    const kv = fakeKV(); const env = { DIGIAPP_SAVES: kv };
    const g = grupo('g1', 'Roda', MAX - 1);
    const dirId = await idDoDiretorio(env, g.id);
    await sincronizarDiretorio(env, g, MAX, { antes: 'x' });
    expect(kv.ops).toEqual([`PUT ${DIR_PREFIX}${dirId}`]);
    kv.ops.length = 0;
    const cheio = { ...g, members: membros('g1', MAX) };
    await sincronizarDiretorio(env, cheio, MAX, { antes: `Roda|${MAX - 1}` });
    expect(kv.ops).toEqual([`PUT ${DIR_FULL_PREFIX}${dirId}`, `DEL ${DIR_PREFIX}${dirId}`]);
    expect(await lerEntrada(env, dirId)).toEqual({ gid: g.id, n: 'Roda', s: MAX, full: true });
    kv.ops.length = 0;
    await sincronizarDiretorio(env, g, MAX, { antes: `Roda|${MAX}|cheia` });
    expect(kv.ops).toEqual([`PUT ${DIR_PREFIX}${dirId}`, `DEL ${DIR_FULL_PREFIX}${dirId}`]);
    kv.ops.length = 0;
    await sincronizarDiretorio(env, { ...g, members: [] }, MAX);
    expect(kv.ops).toEqual([`DEL ${DIR_PREFIX}${dirId}`, `DEL ${DIR_FULL_PREFIX}${dirId}`]);
    expect(kv.store.size).toBe(0);
  });
});

describe('listarDiretorio: com vaga primeiro, cheios depois, tetos respeitados', () => {
  it('cheios marcados `full: true` vêm DEPOIS dos com vaga (os com vaga: mais cheios primeiro)', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    await sincronizarDiretorio(env, grupo('a1', 'Zeta Aberta', 2), MAX);
    await sincronizarDiretorio(env, grupo('a2', 'Alfa Aberta', 9), MAX);
    await sincronizarDiretorio(env, grupo('c1', 'Brasa Viva', MAX), MAX);
    await sincronizarDiretorio(env, grupo('c2', 'Aurora', MAX), MAX);
    const lista = await listarDiretorio(env, MAX);
    expect(lista.map(c => [c.name, c.size, c.full === true])).toEqual([
      ['Alfa Aberta', 9, false], ['Zeta Aberta', 2, false], ['Aurora', MAX, true], ['Brasa Viva', MAX, true],
    ]);
    expect(lista.filter(c => !c.full).every(c => !('full' in c))).toBe(true);
  });

  it('cheios em massa NÃO empurram os com vaga para fora: 40 cheios + 35 com vaga = 30 com vaga + 12 cheios', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    for (let i = 0; i < 40; i++) await sincronizarDiretorio(env, grupo(`c${String(i).padStart(2, '0')}`, `Cheio ${i}`, MAX), MAX);
    for (let i = 0; i < 35; i++) await sincronizarDiretorio(env, grupo(`a${String(i).padStart(2, '0')}`, `Aberto ${i}`, 1 + (i % 10)), MAX);
    const lista = await listarDiretorio(env, MAX);
    const abertos = lista.filter(c => !c.full), cheios = lista.filter(c => c.full);
    expect(abertos).toHaveLength(DIRETORIO_MAX);
    expect(cheios).toHaveLength(DIRETORIO_CHEIOS_MAX);
    expect(lista.findIndex(c => c.full)).toBe(DIRETORIO_MAX); // nenhum cheio antes de um com vaga
    // Os 30 com vaga que sobram são os MAIS cheios (ordem do servidor), não os primeiros da janela do `list`.
    expect(Math.min(...abertos.map(c => c.size))).toBeGreaterThanOrEqual(Math.min(...[...Array(35)].map((_, i) => 1 + (i % 10)).sort((a, b) => b - a).slice(0, 30)));
  });

  it('só cheios (o caso das 10 guildas semente): a lista mostra os cheios e nada de vaga', async () => {
    const env = { DIGIAPP_SAVES: fakeKV() };
    for (let i = 0; i < 10; i++) await sincronizarDiretorio(env, grupo(`s${i}`, `Semente ${i}`, MAX), MAX);
    const lista = await listarDiretorio(env, MAX);
    expect(lista).toHaveLength(10);
    expect(lista.every(c => c.full === true && c.size === MAX && c.max === MAX)).toBe(true);
  });
});

describe('rota guildDirectory com clãs cheios', () => {
  const sid = r => r.padEnd(32, '0');
  const chamar = (e, action, body, method = 'POST') => onRequest({
    request: new Request(`https://x.dev/api/guild?action=${action}${method === 'GET' ? `&id=${body.id}` : ''}`, {
      method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined,
    }),
    env: e,
  });
  it('lista o cheio com os mesmos campos públicos (+ full), sem gid/código/saveId; pedir nele = 409', async () => {
    const e = { DIGIAPP_SAVES: fakeKV() };
    const todos = [sid('ana'), sid('bia'), sid('cau'), ...Array.from({ length: MAX - 1 }, (_, i) => sid(`m${i}x`))];
    for (const m of todos) e.DIGIAPP_SAVES.store.set(`profile:${m}`, JSON.stringify({ name: m.slice(0, 3), pid: `P${m.slice(0, 3)}${'q'.repeat(20)}`, stage: 'rookie' }));
    const cheio = (await (await chamar(e, 'guildCreate', { id: sid('ana'), name: 'Brasa Viva' })).json()).guild;
    for (const m of todos.slice(3)) await chamar(e, 'guildJoin', { id: m, code: cheio.code });
    await chamar(e, 'guildCreate', { id: sid('cau'), name: 'Roda' });
    const r = await chamar(e, 'guildDirectory', { id: sid('bia') }, 'GET');
    const body = await r.json();
    expect(body.clans.map(c => [c.name, c.size, c.full === true])).toEqual([['Roda', 1, false], ['Brasa Viva', MAX, true]]);
    const c = body.clans.find(x => x.name === 'Brasa Viva');
    expect(Object.keys(c).sort()).toEqual(['dirId', 'full', 'max', 'name', 'size']);
    expect(c).toMatchObject({ size: MAX, max: MAX, full: true });
    const txt = JSON.stringify(body);
    expect(txt).not.toContain(cheio.id);
    expect(txt).not.toContain(cheio.code);
    for (const m of todos) expect(txt).not.toContain(m);
    const p = await chamar(e, 'guildRequest', { id: sid('bia'), dirId: c.dirId });
    expect(p.status).toBe(409);
    expect((await p.json()).error).toBe('guild full');
  });
});
