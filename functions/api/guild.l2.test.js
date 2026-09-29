import { describe, it, expect, afterEach, vi } from 'vitest';
import { lerGrupo, fecharDiasDoBosque, firmarFio, idOpacoDoMembro } from './_coop.js';
import { onRequest as community } from './community.js';
import { onRequest } from './guild.js';

/**
 * Revisão adversarial L2 do backend da Guilda (`docs/reviews/guilda/qa/L2-backend.md`):
 * um teste por achado fechado, pelo comportamento.
 */

/** KV em memória que CONTA leituras/escritas/exclusões (orçamento, A3). */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const puts = [];
  const conta = { get: 0, put: 0, delete: 0 };
  return {
    store, puts, conta,
    zerar() { conta.get = 0; conta.put = 0; conta.delete = 0; puts.length = 0; },
    get: async k => {
      if (Array.isArray(k)) { conta.get += k.length; return new Map(k.map(x => [x, store.get(x) ?? null])); }
      conta.get++; return store.get(k) ?? null;
    },
    put: async (k, v, opts) => { conta.put++; puts.push({ k, v, opts }); store.set(k, v); },
    delete: async k => { conta.delete++; store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const perfil = (id, nome, extra = {}) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, stage: 'rookie', friends: [], ...extra });
function req(action, { method = 'POST', body, params = {} } = {}) {
  const qs = new URLSearchParams({ action, ...params });
  return new Request(`https://x.dev/api/guild?${qs}`, {
    method, headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
}
const chamar = (e, action, opts) => onRequest({ request: req(action, opts), env: e });
const MEMBROS = Array.from({ length: 12 }, (_, i) => sid(`m${String(i).padStart(2, '0')}`));

/** Uma guilda de `n` membros (de `MEMBROS`), criada pelas rotas. */
async function guildaDe(n) {
  const seed = {};
  MEMBROS.forEach((m, i) => { seed[`profile:${m}`] = perfil(m, `Nome${i}`); });
  const e = { DIGIAPP_SAVES: fakeKV(seed) };
  const g = (await (await chamar(e, 'guildCreate', { body: { id: MEMBROS[0], name: 'Roda' } })).json()).guild;
  for (const m of MEMBROS.slice(1, n)) await chamar(e, 'guildJoin', { body: { id: m, code: g.code } });
  return { e, gid: g.id, code: g.code };
}

afterEach(() => vi.useRealTimers());
const em = iso => vi.setSystemTime(new Date(iso));
const [A, B, C] = MEMBROS;

describe('A1 — o dia só fecha quando terminou em todos os fusos', () => {
  it('membro em UTC+9 abrindo depois da meia-noite dele NÃO fecha o dia dos que ainda estão nele', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    em('2026-09-01T10:00:00Z');
    const { e, gid } = await guildaDe(3);
    await chamar(e, 'guildThread', { body: { id: A, kind: 'fio', dayKey: '2026-09-01' } });
    // 20:00 UTC: em UTC+9 já é dia 2. C abre a vista com o dia dele.
    em('2026-09-01T20:00:00Z');
    await chamar(e, 'guild', { method: 'GET', params: { id: C, dayKey: '2026-09-02' } });
    // 02:00 UTC do dia 2 = 23:00 do dia 1 em UTC−3: B firma o dia 1.
    em('2026-09-02T02:00:00Z');
    await chamar(e, 'guildThread', { body: { id: B, kind: 'fio', dayKey: 'Tue Sep 01 2026' } });
    // C volta de manhã (dia 3 dele) — ainda NÃO fecha o dia 1.
    em('2026-09-02T23:30:00Z');
    await chamar(e, 'guild', { method: 'GET', params: { id: C, dayKey: '2026-09-03' } });
    expect((await lerGrupo(e, gid)).bosqueProgress ?? 0).toBe(0);
    em('2026-09-03T12:00:00Z');
    await chamar(e, 'guild', { method: 'GET', params: { id: A } });
    // 2 de 3 no dia 1 — não 1 de 3 (0,083 do PoC era 1 de 12).
    expect((await lerGrupo(e, gid)).bosqueProgress).toBeCloseTo(2 / 3, 9);
  });
});

describe('A4 — a vista não entrega o pid público de ninguém', () => {
  it('nenhum pid sai; o id opaco não abre community?action=player', async () => {
    const { e, gid } = await guildaDe(3);
    const txt = await (await chamar(e, 'guild', { method: 'GET', params: { id: A } })).text();
    const v = JSON.parse(txt).guild;
    for (const m of MEMBROS.slice(0, 3)) {
      const pid = JSON.parse(e.DIGIAPP_SAVES.store.get(`profile:${m}`)).pid;
      expect(txt).not.toContain(pid);
    }
    expect(txt).not.toContain('"pid"');
    for (const m of v.members) {
      expect(m.id).toBe(m.memberId);
      expect(m.memberId).toMatch(/^[0-9a-f]{16}$/);
      const r = await (await community({ request: new Request(`https://x.dev/api/community?action=player&id=${m.memberId}`), env: e })).json();
      expect(JSON.stringify(r)).not.toMatch(/rookie|stage|friends/);
    }
    expect(v.presence.map(p => p.memberId)).toEqual(v.members.map(m => m.memberId));
    // Estável na guilda, diferente entre guildas.
    expect(v.members.find(m => m.euMesmo).memberId).toBe(await idOpacoDoMembro(e, gid, A));
    expect(await idOpacoDoMembro(e, 'outraGuilda', A)).not.toBe(await idOpacoDoMembro(e, gid, A));
  });
});
