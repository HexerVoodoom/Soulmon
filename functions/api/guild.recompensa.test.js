import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequest } from './guild.js';
import {
  coopHitKey, coopClaimKey, coopKey, coopFioKey, coopScenesKey, semanaDoDia,
  RAID_EMBLEMS, RAID_EMBLEMS_FLOOR, RAID_TROPHY_EVERY, RAID_TROPHY_ID,
} from './_coop.js';

/**
 * RECOMPENSAS da Guilda (WPG-5, `PLANO-GUILDA.md` §7): o servidor registra o
 * direito e o resgate (`coopClaim:<save>:<week>`); os Emblemas vão para o save
 * pelo caminho do Torneio. Só cosmético e Emblemas (LV-G6).
 */
function fakeKV() {
  const store = new Map();
  return {
    store,
    get: async k => store.get(k) ?? null,
    put: async (k, v) => { store.set(k, v); },
    delete: async k => { store.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const M = ['aa', 'bb', 'cc'].map(sid);
const chamar = (e, action, body, method = 'POST') => onRequest({
  request: new Request(`https://x.dev/api/guild?action=${action}${method === 'GET' ? `&id=${body.id}` : ''}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined,
  }),
  env: e,
});
const premios = async (e, id) => (await (await chamar(e, 'guildRewards', { id }, 'GET')).json()).rewards;
const resgatar = (e, id, week) => chamar(e, 'guildClaim', { id, week });
afterEach(() => { vi.useRealTimers(); });

async function roda(n = 3, dia = '2026-09-10T12:00:00Z') {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(dia));
  const e = { DIGIAPP_SAVES: fakeKV() };
  for (const m of M) e.DIGIAPP_SAVES.store.set(`profile:${m}`, JSON.stringify({ name: 'N', pid: `P${m[0]}${'q'.repeat(22)}`, stage: 'rookie' }));
  const g = (await (await chamar(e, 'guildCreate', { id: M[0], name: 'Roda' })).json()).guild;
  for (const m of M.slice(1, n)) await chamar(e, 'guildJoin', { id: m, code: g.code });
  return { e, gid: g.id };
}
const golpeSemeado = (e, gid, dia, membro, dmg) =>
  e.DIGIAPP_SAVES.store.set(coopHitKey(gid, semanaDoDia(dia), membro), JSON.stringify({ week: semanaDoDia(dia), days: [dia], dmg }));

describe('guildClaim — Emblemas', () => {
  it('dissipada: 4 Emblemas a quem golpeou; o 2º resgate é 409 already claimed', async () => {
    const { e, gid } = await roda();
    golpeSemeado(e, gid, '2026-09-09', M[0], 140);
    expect((await premios(e, M[0])).pending).toEqual([{ week: '2026-W37', outcome: 'dissipada', emblems: RAID_EMBLEMS }]);
    const r = await resgatar(e, M[0], '2026-W37');
    expect(r.status).toBe(200);
    const { claimed } = await r.json();
    expect(claimed).toMatchObject({ week: '2026-W37', outcome: 'dissipada', emblems: 4, trophy: false });
    expect(RAID_EMBLEMS).toBe(4);
    const r2 = await resgatar(e, M[0], '2026-W37');
    expect(r2.status).toBe(409);
    expect((await r2.json()).error).toBe('already claimed');
    expect((await premios(e, M[0])).pending).toEqual([]);
  });

  it('dois aparelhos ao mesmo tempo: exatamente UM resgate vale', async () => {
    const { e, gid } = await roda();
    golpeSemeado(e, gid, '2026-09-09', M[0], 140);
    const rs = await Promise.all([resgatar(e, M[0], '2026-W37'), resgatar(e, M[0], '2026-W37'), resgatar(e, M[0], '2026-W37')]);
    expect(rs.filter(r => r.status === 200)).toHaveLength(1);
    expect(rs.filter(r => r.status === 409)).toHaveLength(2);
  });

  it('recuou: piso de 2, só depois que a semana termina', async () => {
    const { e, gid } = await roda();
    golpeSemeado(e, gid, '2026-09-09', M[0], 20);
    expect((await resgatar(e, M[0], '2026-W37')).status).toBe(404); // aberta: ainda sem desfecho
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));
    const r = await resgatar(e, M[0], '2026-W37');
    expect(r.status).toBe(200);
    expect((await r.json()).claimed).toMatchObject({ outcome: 'recuou', emblems: RAID_EMBLEMS_FLOOR });
    expect(RAID_EMBLEMS_FLOOR).toBe(2);
  });

  it('só quem deu ≥ 1 golpe: quem não golpeou não tem direito (404) e não perde nada', async () => {
    const { e, gid } = await roda();
    golpeSemeado(e, gid, '2026-09-09', M[0], 140);
    expect((await premios(e, M[1])).pending).toEqual([]);
    const r = await resgatar(e, M[1], '2026-W37');
    expect(r.status).toBe(404);
    expect((await r.json()).error).toBe('nothing to claim');
  });

  it('semana fora da janela é 400 invalid week', async () => {
    const { e } = await roda();
    expect((await resgatar(e, M[0], '2026-W01')).status).toBe(400);
    expect((await resgatar(e, M[0], 'qualquer')).status).toBe(400);
  });

  it('o resgate só entrega Emblemas e cosmético: nenhum coração, Crédito, energia, perfectDay, Glitchtama', async () => {
    const { e, gid } = await roda();
    golpeSemeado(e, gid, '2026-09-09', M[0], 140);
    const { claimed } = await (await resgatar(e, M[0], '2026-W37')).json();
    expect(Object.keys(claimed).sort()).toEqual(['emblems', 'outcome', 'trophy', 'trophyId', 'week']);
    expect(JSON.stringify(claimed)).not.toMatch(/heart|cora|credit|energ|perfect|glitch/i);
    expect(e.DIGIAPP_SAVES.store.has(coopClaimKey(M[0], '2026-W37'))).toBe(true);
  });

  it('o resgate não toca o Bosque', async () => {
    const { e, gid } = await roda();
    golpeSemeado(e, gid, '2026-09-09', M[0], 140);
    await premios(e, M[0]);
    const antes = e.DIGIAPP_SAVES.store.get(coopKey(gid));
    await resgatar(e, M[0], '2026-W37');
    expect(e.DIGIAPP_SAVES.store.get(coopKey(gid))).toBe(antes);
  });
});

describe('Concha da Maré — uma a cada 4 Feiras dissipadas com participação', () => {
  it('a 4ª e a 8ª dão troféu; as outras não; recuo não conta', async () => {
    const { e, gid } = await roda();
    const trofeus = [];
    // oito semanas seguidas, de W37 a W44, cada uma dissipada e resgatada na hora
    for (let k = 0; k < 9; k++) {
      const n = Date.parse('2026-09-09T12:00:00Z') + k * 7 * 86400000;
      const dia = new Date(n).toISOString().slice(0, 10);
      vi.setSystemTime(new Date(n));
      if (k === 2) { // uma semana que recua: resgata na seguinte, não soma concha
        golpeSemeado(e, gid, dia, M[0], 10);
        continue;
      }
      if (k === 3) {
        const r = await (await resgatar(e, M[0], semanaDoDia(new Date(n - 7 * 86400000).toISOString().slice(0, 10)))).json();
        expect(r.claimed.outcome).toBe('recuou');
        expect(r.claimed.trophy).toBe(false);
      }
      golpeSemeado(e, gid, dia, M[0], 140);
      const r = await (await resgatar(e, M[0], semanaDoDia(dia))).json();
      trofeus.push(r.claimed.trophy);
      if (r.claimed.trophy) expect(r.claimed.trophyId).toBe(RAID_TROPHY_ID);
    }
    expect(RAID_TROPHY_EVERY).toBe(4);
    expect(trofeus).toEqual([false, false, false, true, false, false, false, true]);
    expect((await premios(e, M[0])).trophyOwned).toBe(true);
  });
});

describe('Concha — defesa contra registro de resgate perdido', () => {
  it('reapresentar uma semana que já está no conjunto não dá uma Concha a mais', async () => {
    const { e, gid } = await roda();
    golpeSemeado(e, gid, '2026-09-09', M[0], 140);
    // Quatro semanas já contadas, a corrente entre elas (ex.: o coopClaim sumiu).
    e.DIGIAPP_SAVES.store.set(`coopShell:${M[0]}`, JSON.stringify({ ids: ['2026-W34', '2026-W35', '2026-W36', '2026-W37'] }));
    const { claimed } = await (await resgatar(e, M[0], '2026-W37')).json();
    expect(claimed.trophy).toBe(false);
  });
});

describe('cenários bg-guild-* (LV-G9, G12)', () => {
  const semear = (e, gid, dias, progresso) => {
    e.DIGIAPP_SAVES.store.set(coopFioKey(gid, M[0]), JSON.stringify({ lastDay: dias.at(-1), distinctDays: dias.length, days: dias }));
    const g = JSON.parse(e.DIGIAPP_SAVES.store.get(coopKey(gid)));
    g.bosqueProgress = progresso;
    g.progressDay = '2026-09-09';
    e.DIGIAPP_SAVES.store.set(coopKey(gid), JSON.stringify(g));
  };
  // Sete dias DISTINTOS e NÃO seguidos (LV-G9).
  const SETE = ['2026-08-20', '2026-08-23', '2026-08-26', '2026-08-29', '2026-09-01', '2026-09-04', '2026-09-08'];

  it('com 6 dias distintos: nada; com 7 (não seguidos): até o estágio atual', async () => {
    const { e, gid } = await roda();
    semear(e, gid, SETE.slice(0, 6), 12);
    expect((await premios(e, M[0])).scenes).toEqual([]);
    semear(e, gid, SETE, 12);
    expect((await premios(e, M[0])).scenes).toEqual(['bg-guild-clareira', 'bg-guild-ramagem']);
  });

  it('os cenários FICAM com quem sai (G12)', async () => {
    const { e, gid } = await roda();
    semear(e, gid, SETE, 30);
    const antes = (await premios(e, M[0])).scenes;
    expect(antes).toEqual(['bg-guild-clareira', 'bg-guild-copa', 'bg-guild-ramagem']);
    await chamar(e, 'guildLeave', { id: M[0] });
    expect((await premios(e, M[0])).scenes).toEqual(antes);
    expect(e.DIGIAPP_SAVES.store.has(coopScenesKey(M[0]))).toBe(true);
  });

  it('sem guilda e sem nada liberado: resposta vazia, sem erro', async () => {
    const { e } = await roda(1);
    const r = await premios(e, M[2]);
    expect(r).toMatchObject({ pending: [], scenes: [], trophyOwned: false });
  });
});
