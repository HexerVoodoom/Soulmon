import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequest } from './guild.js';
import {
  raidHpFor, raidDamageFor, coopHitKey, coopRaidOkKey, coopKey, semanaDoDia, fenomenoDaSemana,
  RAID_PHENOMENA, RAID_HP_PER_MEMBER, GUILD_MIN_RAID_MEMBERS,
  coopMemKey,
} from './_coop.js';

/**
 * A FEIRA (WPG-4, `PLANO-GUILDA.md` §3 linha 🎪, §10): a roda contra um
 * fenômeno. Um golpe por pessoa por dia, semana ISO inteira, dano sorteado no
 * servidor, fechamento na leitura, e NENHUM número sai para o cliente.
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
const M = 'abcdefghijkl'.split('').map(c => sid(c + c));
const chamar = (e, action, body, method = 'POST') => onRequest({
  request: new Request(`https://x.dev/api/guild?action=${action}${method === 'GET' ? `&id=${body.id}` : ''}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined,
  }),
  env: e,
});
const ver = async (e, id) => (await (await chamar(e, 'guild', { id }, 'GET')).json()).guild;
const golpear = (e, id, extra = {}) => chamar(e, 'guildRaidHit', { id, ...extra });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

async function roda(n, { dia = '2026-09-10T12:00:00Z', stage = 'rookie' } = {}) {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(dia));
  const e = { DIGIAPP_SAVES: fakeKV() };
  for (const m of M) e.DIGIAPP_SAVES.store.set(`profile:${m}`, JSON.stringify({ name: `N${m[0]}`, pid: `P${m[0]}${'q'.repeat(22)}`, stage }));
  const g = (await (await chamar(e, 'guildCreate', { id: M[0], name: 'Roda' })).json()).guild;
  for (const m of M.slice(1, n)) await chamar(e, 'guildJoin', { id: m, code: g.code });
  return { e, gid: g.id };
}
const semeiaDano = (e, gid, dia, membro, dmg) => {
  e.DIGIAPP_SAVES.store.set(coopHitKey(gid, semanaDoDia(dia), membro), JSON.stringify({ week: semanaDoDia(dia), days: [dia], dmg }));
  // A chave semeada à mão não passou pela rota: o cartão (resumo derivado, A3)
  // sai de cena e a vista lê as chaves de origem — o caminho "sem cartão".
  e.DIGIAPP_SAVES.store.delete(coopMemKey(gid, membro));
};

/** Toda folha numérica de um objeto (o guarda: nenhum número na Feira). */
const numeros = (o, path = '') => (o && typeof o === 'object')
  ? Object.entries(o).flatMap(([k, v]) => numeros(v, `${path}.${k}`))
  : (typeof o === 'number' ? [path] : []);

describe('constantes e fórmulas', () => {
  it('HP = max(ativos, 3) × 45', () => {
    expect(raidHpFor(0)).toBe(GUILD_MIN_RAID_MEMBERS * RAID_HP_PER_MEMBER);
    expect(raidHpFor(1)).toBe(135);
    expect(raidHpFor(3)).toBe(135);
    expect(raidHpFor(4)).toBe(180);
    expect(raidHpFor(12)).toBe(540);
  });
  it('dano = 10 + 2 × stagePower, ±20% (rookie 10..14, ultra 16..24)', () => {
    expect(raidDamageFor(1, 0)).toBe(10);
    expect(raidDamageFor(1, 0.5)).toBe(12);
    expect(raidDamageFor(1, 0.9999)).toBe(14);
    expect(raidDamageFor(5, 0)).toBe(16);
    expect(raidDamageFor(5, 0.5)).toBe(20);
    expect(raidDamageFor(5, 0.9999)).toBe(24);
    expect(raidDamageFor(99, 0.5)).toBe(20); // estágio fora da escada não passa do ultra
  });
  it('o sorteio é do crypto do servidor, nunca do Math.random', () => {
    const spy = vi.spyOn(globalThis.crypto, 'getRandomValues');
    const mr = vi.spyOn(Math, 'random');
    raidDamageFor(3);
    expect(spy).toHaveBeenCalled();
    expect(mr).not.toHaveBeenCalled();
  });
  it('quatro fenômenos em rotação semanal determinística', () => {
    expect(RAID_PHENOMENA).toEqual(['nevoa', 'mare', 'estatica', 'enxame']);
    const vistos = new Set(['2026-W37', '2026-W38', '2026-W39', '2026-W40'].map(fenomenoDaSemana));
    expect(vistos.size).toBe(4);
    expect(fenomenoDaSemana('2026-W37')).toBe(fenomenoDaSemana('2026-W37'));
  });
});

describe('guildRaidHit', () => {
  it('um golpe por dia: o 2º é 429 daily limit; no dia seguinte volta', async () => {
    const { e } = await roda(3);
    const r1 = await golpear(e, M[0]);
    expect(r1.status).toBe(200);
    expect((await r1.json()).landed).toBe(true);
    const r2 = await golpear(e, M[0]);
    expect(r2.status).toBe(429);
    expect((await r2.json()).error).toBe('daily limit');
    vi.setSystemTime(new Date('2026-09-11T12:00:00Z'));
    expect((await golpear(e, M[0])).status).toBe(200);
  });

  it('12 golpes concorrentes somam 12 (cada um escreve a PRÓPRIA chave)', async () => {
    const { e, gid } = await roda(12);
    const rs = await Promise.all(M.map(m => golpear(e, m)));
    expect(rs.map(r => r.status)).toEqual(Array(12).fill(200));
    const w = semanaDoDia('2026-09-10');
    const regs = M.map(m => JSON.parse(e.DIGIAPP_SAVES.store.get(coopHitKey(gid, w, m))));
    expect(regs.reduce((n, r) => n + r.days.length, 0)).toBe(12);
    expect(regs.every(r => r.dmg >= 10 && r.dmg <= 14)).toBe(true);
  });

  it('o corpo não escolhe o dano nem a semana', async () => {
    const { e, gid } = await roda(1);
    await golpear(e, M[0], { dmg: 9999, week: '2026-W01', damage: 9999 });
    const r = JSON.parse(e.DIGIAPP_SAVES.store.get(coopHitKey(gid, '2026-W37', M[0])));
    expect(r.dmg).toBeLessThanOrEqual(14);
    expect(e.DIGIAPP_SAVES.store.has(coopHitKey(gid, '2026-W01', M[0]))).toBe(false);
  });

  it('o estágio DECLARADO no perfil entra no dano (ultra bate mais)', async () => {
    const { e, gid } = await roda(1, { stage: 'ultra-x' });
    await golpear(e, M[0]);
    const r = JSON.parse(e.DIGIAPP_SAVES.store.get(coopHitKey(gid, '2026-W37', M[0])));
    expect(r.dmg).toBeGreaterThanOrEqual(16);
  });

  it('não exige fio, meta nem Vínculo (G15): perfil sem XP golpeia', async () => {
    const { e } = await roda(2);
    e.DIGIAPP_SAVES.store.set(`profile:${M[1]}`, JSON.stringify({ name: 'Novato', totalXP: 0 }));
    expect((await golpear(e, M[1])).status).toBe(200);
  });

  it('sem guilda: 404', async () => {
    const { e } = await roda(1);
    expect((await golpear(e, M[5])).status).toBe(404);
  });

  it('o golpe não toca o Bosque (LV-G7): o blob do grupo fica byte a byte igual', async () => {
    const { e, gid } = await roda(3);
    await ver(e, M[0]);
    const antes = e.DIGIAPP_SAVES.store.get(coopKey(gid));
    await golpear(e, M[0]);
    await golpear(e, M[1]);
    expect(e.DIGIAPP_SAVES.store.get(coopKey(gid))).toBe(antes);
  });

  it('semana ISO inteira (G11): segunda e domingo aceitam golpe', async () => {
    const { e } = await roda(1, { dia: '2026-09-07T00:30:00Z' }); // segunda
    expect((await golpear(e, M[0])).status).toBe(200);
    vi.setSystemTime(new Date('2026-09-13T23:30:00Z')); // domingo
    expect((await golpear(e, M[0])).status).toBe(200);
  });
});

describe('estado da Feira — fechamento na leitura, sem número', () => {
  it('aberta → ferida → dissipada; depois de dissipada, golpe é 409 raid closed', async () => {
    const { e, gid } = await roda(3);
    let v = await ver(e, M[0]);
    expect(v.raid).toMatchObject({ state: 'aberta', ferido: false, lastWeek: null, mine: { hitToday: false } });
    semeiaDano(e, gid, '2026-09-09', M[1], 70); // 70 de 135
    v = await ver(e, M[0]);
    expect(v.raid).toMatchObject({ state: 'aberta', ferido: true });
    semeiaDano(e, gid, '2026-09-09', M[2], 70); // 140 ≥ 135
    v = await ver(e, M[0]);
    expect(v.raid.state).toBe('dissipada');
    expect(v.raid.ferido).toBe(false);
    expect(e.DIGIAPP_SAVES.store.has(coopRaidOkKey(gid, '2026-W37'))).toBe(true);
    const r = await golpear(e, M[0]);
    expect(r.status).toBe(409);
    expect((await r.json()).error).toBe('raid closed');
  });

  it('`cleared` sobrevive à saída: quem saiu leva o dano dele, a semana continua vencida', async () => {
    const { e, gid } = await roda(3);
    semeiaDano(e, gid, '2026-09-09', M[1], 140);
    expect((await ver(e, M[0])).raid.state).toBe('dissipada');
    await chamar(e, 'guildLeave', { id: M[1] });
    expect((await ver(e, M[0])).raid.state).toBe('dissipada');
  });

  it('semana vencida continua vencida: na seguinte, lastWeek = dissipada mesmo sem o dano', async () => {
    const { e, gid } = await roda(3);
    semeiaDano(e, gid, '2026-09-09', M[1], 140);
    await ver(e, M[0]);
    e.DIGIAPP_SAVES.store.delete(coopHitKey(gid, '2026-W37', M[1])); // a chave pessoal expirou
    e.DIGIAPP_SAVES.store.delete(coopMemKey(gid, M[1])); // e o cartão (TTL próprio) também
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));
    const v = await ver(e, M[0]);
    expect(v.raid).toMatchObject({ weekKey: '2026-W38', state: 'aberta', lastWeek: 'dissipada' });
  });

  it('a vitória é resolvida na leitura mesmo se ninguém abriu a Feira até a semana acabar', async () => {
    const { e, gid } = await roda(3);
    semeiaDano(e, gid, '2026-09-12', M[1], 140);
    vi.setSystemTime(new Date('2026-09-16T12:00:00Z'));
    expect((await ver(e, M[0])).raid.lastWeek).toBe('dissipada');
    expect(e.DIGIAPP_SAVES.store.has(coopRaidOkKey(gid, '2026-W37'))).toBe(true);
  });

  it('guilda de 1: rookie golpeando a semana toda recua (HP 135 > 7×14) — "recuou", nunca "falhou"', async () => {
    const { e } = await roda(1, { dia: '2026-09-07T12:00:00Z' });
    for (let d = 7; d <= 13; d++) {
      vi.setSystemTime(new Date(`2026-09-${String(d).padStart(2, '0')}T12:00:00Z`));
      expect((await golpear(e, M[0])).status).toBe(200);
    }
    expect((await ver(e, M[0])).raid.state).toBe('aberta');
    vi.setSystemTime(new Date('2026-09-14T12:00:00Z'));
    const v = await ver(e, M[0]);
    expect(v.raid.lastWeek).toBe('recuou');
    expect(JSON.stringify(v)).not.toMatch(/falh|fail|lost|perd/i);
  });

  it('guilda de 12: HP 540; 12 golpes rookie não dissipam num dia', async () => {
    const { e } = await roda(12);
    await Promise.all(M.map(m => golpear(e, m)));
    const v = await ver(e, M[0]);
    expect(v.raid.state).toBe('aberta');
    expect(v.raid.ferido).toBe(false); // ≤ 168 < 270
  });

  it('semana sem golpe nenhum: lastWeek null (nada a dizer)', async () => {
    const { e } = await roda(3);
    vi.setSystemTime(new Date('2026-09-15T12:00:00Z'));
    expect((await ver(e, M[0])).raid.lastWeek).toBeNull();
  });

  it('nenhuma resposta traz número de dano/HP/por pessoa nem quem golpeou', async () => {
    const { e, gid } = await roda(5);
    semeiaDano(e, gid, '2026-09-09', M[1], 30);
    const hit = await (await golpear(e, M[0])).json();
    const v = await ver(e, M[2]);
    for (const obj of [hit, v]) {
      expect(numeros(obj.raid ?? obj.guild.raid)).toEqual([]);
      const s = JSON.stringify(obj);
      expect(s).not.toMatch(/"(dmg|damage|hp|hpBand|hits|hitters|hitCount|dano)"/);
      for (const m of M) expect(s).not.toContain(m);
    }
    expect(Object.keys(v.raid).sort()).toEqual(['ferido', 'lastWeek', 'mine', 'phenomenon', 'state', 'weekKey']);
    expect(Object.keys(v.raid.mine)).toEqual(['hitToday']);
    expect(Object.keys(hit).sort()).toEqual(['guild', 'landed']);
  });

  it('ausentes não perdem nada: quem não golpeou não tem erro, dívida nem marca', async () => {
    const { e, gid } = await roda(3);
    semeiaDano(e, gid, '2026-09-09', M[1], 140);
    const v = await ver(e, M[2]);
    expect(v.raid).toMatchObject({ state: 'dissipada', mine: { hitToday: false } });
    const antesBlob = JSON.parse(e.DIGIAPP_SAVES.store.get(coopKey(gid)));
    expect(antesBlob.members).toContain(M[2]);
    expect(e.DIGIAPP_SAVES.store.has(coopHitKey(gid, '2026-W37', M[2]))).toBe(false);
  });

  it('hitToday é só do próprio chamador', async () => {
    const { e } = await roda(2);
    await golpear(e, M[0]);
    expect((await ver(e, M[0])).raid.mine.hitToday).toBe(true);
    expect((await ver(e, M[1])).raid.mine.hitToday).toBe(false);
  });
});
