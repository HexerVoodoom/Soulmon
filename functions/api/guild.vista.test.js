import { describe, it, expect } from 'vitest';
import { onRequest } from './guild.js';

/**
 * `vistaDaGuilda` — o que sai e o que NUNCA sai (`PLANO-GUILDA.md` §10.3, WPG-1).
 *
 * Com 1 e 4 membros a presença é nominal (G4); com 5 e 12 ela some e fica só
 * `threadedToday`, que é `true` ou `null` e NUNCA número (guarda da linha
 * vermelha, 29/09/2026: "N fios" ao lado do tamanho da roda reconstrói "N de M
 * vieram", LV-G2). Em todos os tamanhos: nenhum saveId, `hostSave`, estágio,
 * atributo ou dano.
 */
function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  const puts = [];
  return {
    store, puts,
    get: async k => store.get(k) ?? null,
    put: async (k, v, opts) => { puts.push({ k, v, opts }); store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
/** Um id de save válido (32 chars) a partir de um rótulo curto. */
const sid = r => r.padEnd(32, '0');
const perfil = (id, nome, extra = {}) => JSON.stringify({ id, name: nome, pid: `P${id.slice(0, 4)}${'q'.repeat(19)}`, petName: 'pet', stage: 'mega-power', attrs: { power: 9, harmony: 9, benevolence: 9 }, friends: [], createdAt: Date.now(), ...extra });
function req(action, { method = 'GET', body, params = {}, ip } = {}) {
  const qs = new URLSearchParams({ action, ...params });
  return new Request(`https://x.dev/api/guild?${qs}`, {
    method,
    headers: { 'Content-Type': 'application/json', ...(ip ? { 'CF-Connecting-IP': ip } : {}) },
    body: method === 'POST' ? JSON.stringify(body ?? {}) : undefined,
  });
}
const MEMBROS = Array.from({ length: 12 }, (_, i) => sid(`m${String(i).padStart(2, '0')}`));
const chamar = (e, action, opts) => onRequest({ request: req(action, opts), env: e });

async function guildaDe(n, { checkins = [], fios = [] } = {}) {
  const seed = {};
  MEMBROS.forEach((m, i) => { seed[`profile:${m}`] = perfil(m, `Nome${i}`); });
  const e = { DIGIAPP_SAVES: fakeKV(seed) };
  const criado = await (await chamar(e, 'guildCreate', { method: 'POST', body: { id: MEMBROS[0], name: 'Roda do Bosque' } })).json();
  for (const m of MEMBROS.slice(1, n)) {
    const r = await chamar(e, 'guildJoin', { method: 'POST', body: { id: m, code: criado.guild.code } });
    expect(r.status).toBe(200);
  }
  for (const i of checkins) await chamar(e, 'guildCheckin', { method: 'POST', body: { id: MEMBROS[i] } });
  for (const i of fios) await chamar(e, 'guildThread', { method: 'POST', body: { id: MEMBROS[i], kind: 'fio' } });
  const r = await chamar(e, 'guild', { params: { id: MEMBROS[0] } });
  const txt = await r.text();
  return { e, txt, g: JSON.parse(txt).guild };
}

function semVazamento(txt) {
  for (const m of MEMBROS) expect(txt).not.toContain(m);
  for (const proibido of ['hostSave', 'mega-power', 'dmg', 'attrs', 'power', 'checkins', 'days', 'bosqueProgress',
    'progressDay', 'fiosAvulsos', 'tideBase', 'desde', 'distinctDays', 'lastDay']) {
    expect(txt, proibido).not.toContain(proibido);
  }
  // `stage` só existe DENTRO de `bosque` (o estágio do Bosque, que é da roda);
  // nenhum membro carrega estágio/HP de criatura (LV-G10, D-3).
  const v = JSON.parse(txt).guild ?? JSON.parse(txt).group;
  if (v) {
    for (const m of v.members) for (const k of ['stage', 'hp', 'line', 'healthPoints']) expect(m, k).not.toHaveProperty(k);
    expect(Object.keys(v.bosque).sort()).toEqual(['ornaments', 'perto', 'stage', 'stageIndex', 'tide']);
    expect(txt.replace(/"bosque":\{.*?"ornaments"/, '')).not.toContain('"stage"');
  }
}

describe('vistaDaGuilda por tamanho', () => {
  it('1 membro: presença nominal, o próprio anfitrião, nada vaza', async () => {
    const { txt, g } = await guildaDe(1, { checkins: [0] });
    semVazamento(txt);
    expect(g.size).toBe(1);
    expect(g.isHost).toBe(true);
    expect(g.presence).toEqual([{ memberId: g.members[0].memberId, cameToday: true }]);
    expect(g.threadedToday).toBeNull();
    expect(g.mine).toEqual({ cameToday: true, gesturesSent: [] }); // M-1: só as marcas `true`
  });

  it('4 membros: presença nominal SÓ de quem veio — ausência não é estado (M-1), threadedToday null', async () => {
    const { txt, g } = await guildaDe(4, { checkins: [1] });
    semVazamento(txt);
    expect(g.presence).toHaveLength(4);
    expect(g.presence.map(p => p.cameToday)).toEqual([undefined, true, undefined, undefined]);
    expect(g.presence.filter(p => 'cameToday' in p)).toHaveLength(1);
    expect(g.members.filter(m => 'apareceuHoje' in m).map(m => m.apareceuHoje)).toEqual([true]);
    // Nenhum `false` sobre OUTRA pessoa trafega (LV-G2).
    expect(txt).not.toContain('"cameToday":false');
    expect(txt).not.toContain('"apareceuHoje":false');
    expect(g.threadedToday).toBeNull();
  });

  it('5 membros: presence null, nenhum membro carrega presença, threadedToday true (nunca número)', async () => {
    const { txt, g } = await guildaDe(5, { fios: [2, 3] });
    semVazamento(txt);
    expect(g.presence).toBeNull();
    for (const m of g.members) {
      expect(m).not.toHaveProperty('apareceuHoje');
      expect(Object.keys(m).sort()).toEqual(['euMesmo', 'id', 'memberId', 'name']);
    }
    expect(g.threadedToday).toBe(true);
    expect(txt).not.toContain('apareceuHoje');
    expect(txt).not.toContain('"cameToday":true,"memberId'); // só o `mine` fala de presença
  });

  it('5 membros sem ninguém hoje: threadedToday null', async () => {
    const { g } = await guildaDe(5);
    expect(g.threadedToday).toBeNull();
    expect(g.presence).toBeNull();
  });

  it('B-2: com 5+, check-in sem fio NÃO acende threadedToday — só fio firmado', async () => {
    const { g } = await guildaDe(5, { checkins: [0, 1, 2, 3, 4] });
    expect(g.threadedToday).toBeNull();
    const { g: g2 } = await guildaDe(5, { checkins: [0, 1], fios: [3] });
    expect(g2.threadedToday).toBe(true);
  });

  it('12 membros: threadedToday é true ou null — com 1, 7 ou 12 fios é SEMPRE true', async () => {
    for (const quantos of [1, 7, 12]) {
      const { txt, g } = await guildaDe(12, { fios: Array.from({ length: quantos }, (_, i) => i) });
      semVazamento(txt);
      expect(g.size).toBe(12);
      expect(g.full).toBe(true);
      expect(g.threadedToday).toBe(true);
      expect(typeof g.threadedToday).not.toBe('number');
      expect(g.presence).toBeNull();
    }
  });

  it('quem não é anfitrião recebe isHost false; o saveId do anfitrião não sai por lado nenhum', async () => {
    const { e } = await guildaDe(3);
    const txt = await (await chamar(e, 'guild', { params: { id: MEMBROS[2] } })).text();
    semVazamento(txt);
    expect(JSON.parse(txt).guild.isHost).toBe(false);
  });

  it('a vista de outro membro NÃO reescreve o perfil dele (pid legado fica intocado)', async () => {
    const { e } = await guildaDe(2);
    // Perfil de m01 com pid ausente (o caso "legado"): a leitura de m00 não grava nada nele.
    const antes = JSON.stringify({ id: MEMBROS[1], name: 'Sem pid', stage: 'rookie' });
    e.DIGIAPP_SAVES.store.set(`profile:${MEMBROS[1]}`, antes);
    const r = await (await chamar(e, 'guild', { params: { id: MEMBROS[0] } })).json();
    expect(e.DIGIAPP_SAVES.store.get(`profile:${MEMBROS[1]}`)).toBe(antes);
    // A4: a vista nunca carrega o pid (nem o legado) — só o id opaco da guilda.
    expect(r.guild.members.find(m => !m.euMesmo)).not.toHaveProperty('pid');
  });
});
