import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';
import { COOP_MAX_MEMBERS, coopOfKey, coopKey, lerGrupo } from './_coop.js';
import { DIR_PREFIX, coopReqKey, coopReqInPrefix } from './_claDiretorio.js';

/**
 * PROCURAR CLÃ (REGISTRO §203): diretório de clãs com vaga + pedido de entrada aprovado pelo anfitrião.
 * Diretório coerente em criar/entrar/sair/renomear/encher/esvaziar; ciclo de vida do pedido;
 * autorização (só o anfitrião decide); vaga conferida na aprovação; idempotência; sem saveId cru.
 */
function fakeKV() {
  const store = new Map();
  const meta = new Map();
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v, o) => { store.set(k, v); if (o?.metadata) meta.set(k, o.metadata); else meta.delete(k); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix = '', limit = 1000 }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).slice(0, limit).map(name => ({ name, metadata: meta.get(name) })),
      list_complete: true,
    }),
  };
}
const sid = r => r.padEnd(32, '0');
const ANA = sid('ana'), BIA = sid('bia'), CAU = sid('cau'), DUDA = sid('duda');
function novoEnv() {
  const e = { DIGIAPP_SAVES: fakeKV() };
  for (const [m, n] of [[ANA, 'Ana'], [BIA, 'Bia'], [CAU, 'Cau'], [DUDA, 'Duda']]) {
    e.DIGIAPP_SAVES.store.set(`profile:${m}`, JSON.stringify({ name: n, pid: `P${m.slice(0, 3)}${'q'.repeat(20)}`, stage: 'rookie' }));
  }
  return e;
}
const chamar = (e, action, body, method = 'POST') => onRequest({
  request: new Request(`https://x.dev/api/guild?action=${action}${method === 'GET' ? `&id=${body.id}` : ''}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined,
  }),
  env: e,
});
const j = async r => ({ status: r.status, body: await r.json() });
const dir = async (e, id) => (await j(await chamar(e, 'guildDirectory', { id }, 'GET'))).body;
const criar = async (e, id, name = 'Roda') => (await (await chamar(e, 'guildCreate', { id, name })).json()).guild;
const pedir = async (e, id, dirId) => j(await chamar(e, 'guildRequest', { id, dirId }));
const fila = async (e, id) => j(await chamar(e, 'guildRequests', { id }, 'GET'));
const decidir = async (e, id, requestId, approve) => j(await chamar(e, 'guildRequestDecide', { id, requestId, approve }));
const dirKeys = e => [...e.DIGIAPP_SAVES.store.keys()].filter(k => k.startsWith(DIR_PREFIX));

describe('diretório: coerente com o clã', () => {
  it('criar lista o clã; renomear atualiza; quem tem clã vê lista vazia; nunca sai gid nem saveId', async () => {
    const e = novoEnv();
    const g = await criar(e, ANA);
    const d = await dir(e, BIA);
    expect(d.clans).toEqual([{ dirId: expect.stringMatching(/^[0-9a-f]{16}$/), name: 'Roda', size: 1, max: COOP_MAX_MEMBERS }]);
    expect(d.pending).toBeNull();
    const texto = JSON.stringify(d);
    expect(texto).not.toContain(g.id);
    expect(texto).not.toContain(ANA);
    expect(texto).not.toContain(g.code);
    await chamar(e, 'guildRename', { id: ANA, name: 'Bosque' });
    expect((await dir(e, BIA)).clans[0].name).toBe('Bosque');
    expect((await dir(e, ANA)).clans).toEqual([]);
  });

  it('entrar por código sobe o tamanho; clã cheio sai do diretório; vaga aberta volta', async () => {
    const e = novoEnv();
    const g = await criar(e, ANA);
    await chamar(e, 'guildJoin', { id: BIA, code: g.code });
    expect((await dir(e, CAU)).clans[0].size).toBe(2);
    const outros = Array.from({ length: COOP_MAX_MEMBERS - 2 }, (_, i) => sid(`m${i}x`));
    for (const m of outros) await chamar(e, 'guildJoin', { id: m, code: g.code });
    expect((await lerGrupo(e, g.id)).members).toHaveLength(COOP_MAX_MEMBERS);
    expect((await dir(e, CAU)).clans).toEqual([]);
    expect(dirKeys(e)).toHaveLength(0);
    await chamar(e, 'guildLeave', { id: BIA });
    expect((await dir(e, CAU)).clans[0].size).toBe(COOP_MAX_MEMBERS - 1);
  });

  it('o último sair apaga o clã E a entrada do diretório', async () => {
    const e = novoEnv();
    await criar(e, ANA);
    expect(dirKeys(e)).toHaveLength(1);
    await chamar(e, 'guildLeave', { id: ANA });
    expect(dirKeys(e)).toHaveLength(0);
    expect((await dir(e, BIA)).clans).toEqual([]);
  });
});

describe('pedido de entrada: ciclo de vida', () => {
  it('pedir → anfitrião vê (sem saveId) → aprova → entra sem código; o pedido some dos dois lados', async () => {
    const e = novoEnv();
    const g = await criar(e, ANA);
    const { clans } = await dir(e, BIA);
    const r = await pedir(e, BIA, clans[0].dirId);
    expect(r.status).toBe(200);
    expect(r.body.pending).toEqual({ dirId: clans[0].dirId, name: 'Roda' });
    expect((await dir(e, BIA)).pending).toEqual({ dirId: clans[0].dirId, name: 'Roda' });
    const f = await fila(e, ANA);
    expect(f.status).toBe(200);
    expect(f.body.requests).toEqual([{ requestId: expect.stringMatching(/^[0-9a-f]{16}$/), name: 'Bia', at: expect.any(Number) }]);
    expect(JSON.stringify(f.body)).not.toContain(BIA);
    const a = await decidir(e, ANA, f.body.requests[0].requestId, true);
    expect(a.status).toBe(200);
    expect(a.body.result).toBe('approved');
    expect(a.body.guild.size).toBe(2);
    expect(e.DIGIAPP_SAVES.store.get(coopOfKey(BIA))).toBe(g.id);
    expect(e.DIGIAPP_SAVES.store.has(coopReqKey(BIA))).toBe(false);
    expect([...e.DIGIAPP_SAVES.store.keys()].some(k => k.startsWith(coopReqInPrefix(g.id)))).toBe(false);
    // Na próxima carga a Bia já está no clã.
    const v = await j(await chamar(e, 'guild', { id: BIA }, 'GET'));
    expect(v.body.guild.id).toBe(g.id);
    // Aprovar de novo: idempotente (o pedido já não existe → 'gone', ninguém duplica).
    const de_novo = await decidir(e, ANA, f.body.requests[0].requestId, true);
    expect(de_novo.body.result).toBe('gone');
    expect((await lerGrupo(e, g.id)).members.filter(m => m === BIA)).toHaveLength(1);
  });

  it('recusar apaga o pedido; quem pediu volta a ver o diretório sem pendência', async () => {
    const e = novoEnv();
    await criar(e, ANA);
    const { clans } = await dir(e, BIA);
    await pedir(e, BIA, clans[0].dirId);
    const rid = (await fila(e, ANA)).body.requests[0].requestId;
    const r = await decidir(e, ANA, rid, false);
    expect(r.body.result).toBe('declined');
    expect((await dir(e, BIA)).pending).toBeNull();
    expect((await fila(e, ANA)).body.requests).toEqual([]);
    expect(e.DIGIAPP_SAVES.store.get(coopOfKey(BIA)) ?? null).toBeNull();
  });

  it('cancelar some da fila do anfitrião; cancelar sem pedido é 200', async () => {
    const e = novoEnv();
    await criar(e, ANA);
    const { clans } = await dir(e, BIA);
    await pedir(e, BIA, clans[0].dirId);
    expect((await j(await chamar(e, 'guildRequestCancel', { id: BIA }))).status).toBe(200);
    expect((await j(await chamar(e, 'guildRequestCancel', { id: BIA }))).status).toBe(200);
    expect((await fila(e, ANA)).body.requests).toEqual([]);
    expect((await dir(e, BIA)).pending).toBeNull();
  });

  it('um pedido por vez: mesmo clã = idempotente, outro clã = 409 com o pendente', async () => {
    const e = novoEnv();
    await criar(e, ANA, 'Um');
    await criar(e, CAU, 'Dois');
    const { clans } = await dir(e, BIA);
    const [x, y] = clans;
    expect((await pedir(e, BIA, x.dirId)).status).toBe(200);
    expect((await pedir(e, BIA, x.dirId)).status).toBe(200);
    const r = await pedir(e, BIA, y.dirId);
    expect(r.status).toBe(409);
    expect(r.body.error).toBe('request pending');
    expect(r.body.pending.dirId).toBe(x.dirId);
  });

  it('entrar em outro clã por código invalida o pedido; aprovação tardia não move a pessoa', async () => {
    const e = novoEnv();
    await criar(e, ANA, 'Um');
    const g2 = await criar(e, CAU, 'Dois');
    const um = (await dir(e, BIA)).clans.find(c => c.name === 'Um');
    await pedir(e, BIA, um.dirId);
    const rid = (await fila(e, ANA)).body.requests[0].requestId;
    await chamar(e, 'guildJoin', { id: BIA, code: g2.code });
    expect(e.DIGIAPP_SAVES.store.has(coopReqKey(BIA))).toBe(false);
    const r = await decidir(e, ANA, rid, true);
    expect(r.body.result).toBe('gone');
    expect(e.DIGIAPP_SAVES.store.get(coopOfKey(BIA))).toBe(g2.id);
  });

  it('quem já tem clã não pede; clã inexistente/dirId inválido = 404', async () => {
    const e = novoEnv();
    await criar(e, ANA);
    const { clans } = await dir(e, BIA);
    expect((await pedir(e, ANA, clans[0].dirId)).status).toBe(409);
    expect((await pedir(e, BIA, 'nao-e-hex')).status).toBe(404);
    expect((await pedir(e, BIA, '0123456789abcdef')).status).toBe(404);
  });
});

describe('autorização e vaga', () => {
  it('só o anfitrião lista e decide; membro comum = 403; sem clã = 404', async () => {
    const e = novoEnv();
    const g = await criar(e, ANA);
    await chamar(e, 'guildJoin', { id: CAU, code: g.code });
    const { clans } = await dir(e, BIA);
    await pedir(e, BIA, clans[0].dirId);
    const rid = (await fila(e, ANA)).body.requests[0].requestId;
    expect((await fila(e, CAU)).status).toBe(403);
    expect((await decidir(e, CAU, rid, true)).status).toBe(403);
    expect((await fila(e, DUDA)).status).toBe(404);
    expect((await decidir(e, DUDA, rid, true)).status).toBe(404);
    expect(e.DIGIAPP_SAVES.store.get(coopOfKey(BIA)) ?? null).toBeNull();
  });

  it('requestId de outro clã não serve: o anfitrião só decide pedidos do PRÓPRIO clã', async () => {
    const e = novoEnv();
    await criar(e, ANA, 'Um');
    await criar(e, CAU, 'Dois');
    const um = (await dir(e, BIA)).clans.find(c => c.name === 'Um');
    await pedir(e, BIA, um.dirId);
    const rid = (await fila(e, ANA)).body.requests[0].requestId;
    const r = await decidir(e, CAU, rid, true);
    expect(r.body.result).toBe('gone');
    expect(e.DIGIAPP_SAVES.store.get(coopOfKey(BIA)) ?? null).toBeNull();
    expect((await fila(e, ANA)).body.requests).toHaveLength(1);
  });

  it('a vaga é conferida na APROVAÇÃO: clã que encheu depois do pedido = 409 full e o pedido fica', async () => {
    const e = novoEnv();
    const g = await criar(e, ANA);
    const { clans } = await dir(e, BIA);
    await pedir(e, BIA, clans[0].dirId);
    for (let i = 0; i < COOP_MAX_MEMBERS - 1; i++) await chamar(e, 'guildJoin', { id: sid(`m${i}x`), code: g.code });
    const rid = (await fila(e, ANA)).body.requests[0].requestId;
    const r = await decidir(e, ANA, rid, true);
    expect(r.status).toBe(409);
    expect(r.body.error).toBe('guild full');
    expect((await lerGrupo(e, g.id)).members).toHaveLength(COOP_MAX_MEMBERS);
    expect(e.DIGIAPP_SAVES.store.has(coopReqKey(BIA))).toBe(true);
  });

  it('corrida na última vaga: duas aprovações ao mesmo tempo nunca passam do teto', async () => {
    const e = novoEnv();
    const g = await criar(e, ANA);
    for (let i = 0; i < COOP_MAX_MEMBERS - 2; i++) await chamar(e, 'guildJoin', { id: sid(`m${i}x`), code: g.code });
    const { clans } = await dir(e, BIA);
    await pedir(e, BIA, clans[0].dirId);
    await pedir(e, CAU, clans[0].dirId);
    const reqs = (await fila(e, ANA)).body.requests;
    expect(reqs).toHaveLength(2);
    const rs = await Promise.all(reqs.map(q => decidir(e, ANA, q.requestId, true)));
    const membros = (await lerGrupo(e, g.id)).members;
    expect(membros.length).toBeLessThanOrEqual(COOP_MAX_MEMBERS);
    expect(rs.filter(r => r.status === 200 && r.body.result === 'approved').length).toBe(membros.length - (COOP_MAX_MEMBERS - 1));
    expect(e.DIGIAPP_SAVES.store.has(coopKey(g.id))).toBe(true);
  });

  it('pedido em clã cheio é recusado na hora (409 full)', async () => {
    const e = novoEnv();
    const g = await criar(e, ANA);
    const dirId = (await dir(e, BIA)).clans[0].dirId;
    for (let i = 0; i < COOP_MAX_MEMBERS - 1; i++) await chamar(e, 'guildJoin', { id: sid(`m${i}x`), code: g.code });
    // A entrada do diretório já sumiu: o dirId antigo vira 404 (clã não está mais listado).
    expect([404, 409]).toContain((await pedir(e, BIA, dirId)).status);
  });
});

describe('"Aceitar pedidos" (emenda do dono à §203)', () => {
  const abrir = async (e, id, open) => j(await chamar(e, 'guildRequestsOpen', { id, open }));
  it('padrão ligado; desligar tira do diretório, recusa pedido novo, mantém o pendente decidível e o código', async () => {
    const e = novoEnv();
    const g = await criar(e, ANA);
    expect(g.requestsOpen).toBe(true);
    const dirId = (await dir(e, BIA)).clans[0].dirId;
    await pedir(e, BIA, dirId);
    const r = await abrir(e, ANA, false);
    expect(r.status).toBe(200);
    expect(r.body.guild.requestsOpen).toBe(false);
    expect(dirKeys(e)).toHaveLength(0);
    expect((await dir(e, CAU)).clans).toEqual([]);
    // Sem a entrada, o dirId some (404); com a entrada ainda visível (list eventual), o servidor recusa com 409.
    expect((await pedir(e, CAU, dirId)).status).toBe(404);
    e.DIGIAPP_SAVES.store.set(`${DIR_PREFIX}${dirId}`, JSON.stringify({ gid: g.id, n: 'Roda', s: 1 }));
    const novo = await pedir(e, CAU, dirId);
    expect(novo.status).toBe(409);
    expect(novo.body.error).toBe('requests closed');
    e.DIGIAPP_SAVES.store.delete(`${DIR_PREFIX}${dirId}`);
    // Fica fora nas gravações seguintes (entrada por código muda o tamanho).
    await chamar(e, 'guildJoin', { id: DUDA, code: g.code });
    expect(dirKeys(e)).toHaveLength(0);
    // O pendente segue visível e aprovável.
    const fl = (await fila(e, ANA)).body.requests;
    expect(fl).toHaveLength(1);
    expect((await decidir(e, ANA, fl[0].requestId, true)).body.result).toBe('approved');
    // Religar volta à lista.
    expect((await abrir(e, ANA, true)).body.guild.requestsOpen).toBe(true);
    expect((await dir(e, CAU)).clans).toHaveLength(1);
  });

  it('só o anfitrião alterna (403); sem clã = 404', async () => {
    const e = novoEnv();
    const g = await criar(e, ANA);
    await chamar(e, 'guildJoin', { id: BIA, code: g.code });
    expect((await abrir(e, BIA, false)).status).toBe(403);
    expect((await abrir(e, CAU, false)).status).toBe(404);
    expect(dirKeys(e)).toHaveLength(1);
  });
});
