import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequest } from './guild.js';
import {
  coopHitKey, coopMemKey, coopFioKey, coopKey, coopPartKey, coopDiasKey, coopClaimKey, semanaDoDia,
  apagarClaims, coopLeave, RAID_EMBLEMS, RAID_EMBLEMS_FLOOR, RAID_TROPHY_ID, STAGE_UNLOCK_DAYS,
} from './_coop.js';

/**
 * SAIR É "SEM PERDA" (L3-conformidade A-1 e M-2, LV-G5; L3-codigo A1).
 *
 * - O direito a Emblemas/Concha de uma Feira ainda não colhida sobrevive à
 *   saída: mora em `coopPart:<save>:<week>`, não na guilda nem no `coopHit`.
 * - Os dias distintos de fio sobrevivem à saída: `coopDias:<save>` é herdado
 *   pelo primeiro fio na guilda seguinte.
 * - O 409 `already claimed` devolve o resgate já registrado.
 * - A exclusão de conta apaga as duas chaves novas.
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
const sair = (e, id) => chamar(e, 'guildLeave', { id });
const em = iso => vi.setSystemTime(new Date(iso));
afterEach(() => { vi.useRealTimers(); });

async function roda(n = 3) {
  vi.useFakeTimers({ toFake: ['Date'] });
  em('2026-09-10T12:00:00Z'); // quinta, 2026-W37
  const e = { DIGIAPP_SAVES: fakeKV() };
  for (const m of M) e.DIGIAPP_SAVES.store.set(`profile:${m}`, JSON.stringify({ name: 'N', pid: `P${m[0]}${'q'.repeat(22)}`, stage: 'rookie' }));
  const g = (await (await chamar(e, 'guildCreate', { id: M[0], name: 'Roda' })).json()).guild;
  for (const m of M.slice(1, n)) await chamar(e, 'guildJoin', { id: m, code: g.code });
  return { e, gid: g.id, code: g.code };
}
/** Dano grande semeado na chave (sem passar pela rota): simula a semana em que a roda derrubou o fenômeno. */
const danoSemeado = (e, gid, dia, membro, dmg) => {
  e.DIGIAPP_SAVES.store.set(coopHitKey(gid, semanaDoDia(dia), membro), JSON.stringify({ week: semanaDoDia(dia), days: [dia], dmg }));
  e.DIGIAPP_SAVES.store.delete(coopMemKey(gid, membro));
};

describe('A-1 — sair não descarta Emblemas/troféu ainda não colhidos', () => {
  it('golpeou, a semana fechou (recuou), saiu: ainda colhe o piso', async () => {
    const { e } = await roda();
    const hit = await chamar(e, 'guildRaidHit', { id: M[0] });
    expect(hit.status).toBe(200);
    em('2026-09-15T12:00:00Z'); // terça da semana seguinte: W37 terminou sem dissipar
    const antes = (await premios(e, M[0])).pending;
    expect(antes).toEqual([{ week: '2026-W37', outcome: 'recuou', emblems: RAID_EMBLEMS_FLOOR }]);
    expect((await sair(e, M[0])).status).toBe(200);
    // Sair não muda o direito.
    expect((await premios(e, M[0])).pending).toEqual(antes);
    const r = await resgatar(e, M[0], '2026-W37');
    expect(r.status).toBe(200);
    expect((await r.json()).claimed).toMatchObject({ week: '2026-W37', outcome: 'recuou', emblems: RAID_EMBLEMS_FLOOR });
  });

  it('dissipada na semana corrente, ninguém leu ainda, saiu na hora: 4 Emblemas continuam lá', async () => {
    const { e, gid } = await roda();
    danoSemeado(e, gid, '2026-09-10', M[0], 140); // o golpe dela fechou o fenômeno
    await sair(e, M[0]); // antes de qualquer leitura gravar `coopRaidOk`
    expect((await premios(e, M[0])).pending).toEqual([{ week: '2026-W37', outcome: 'dissipada', emblems: RAID_EMBLEMS }]);
    expect(e.DIGIAPP_SAVES.store.has(coopPartKey(M[0], '2026-W37'))).toBe(true);
  });

  it('a guilda esvaziou (sumiu do KV) e quem golpeou ainda colhe', async () => {
    const { e, gid } = await roda();
    danoSemeado(e, gid, '2026-09-09', M[0], 140);
    for (const m of M) await sair(e, m);
    expect(e.DIGIAPP_SAVES.store.has(coopKey(gid))).toBe(false);
    const r = await resgatar(e, M[0], '2026-W37');
    expect(r.status).toBe(200);
    expect((await r.json()).claimed).toMatchObject({ outcome: 'dissipada', emblems: RAID_EMBLEMS });
    // Quem não golpeou continua sem direito — sair não inventa prêmio.
    expect((await premios(e, M[1])).pending).toEqual([]);
  });

  it('dois aparelhos depois de sair: um 200, o outro 409 com o MESMO resgate e o mesmo recibo', async () => {
    const { e, gid } = await roda();
    danoSemeado(e, gid, '2026-09-09', M[0], 140);
    await sair(e, M[0]);
    const rs = await Promise.all([resgatar(e, M[0], '2026-W37'), resgatar(e, M[0], '2026-W37')]);
    const ok = rs.find(r => r.status === 200);
    const dup = rs.find(r => r.status === 409);
    expect(ok && dup).toBeTruthy();
    const a = (await ok.json()).claimed;
    const b = await dup.json();
    expect(b.error).toBe('already claimed');
    expect(b.receipt).toBe(a.receipt);
    expect(b.claimed).toEqual(a);
  });
});

describe('A1 (L3-codigo) — o 409 devolve o resgate já registrado', () => {
  it('forma exata: { week, outcome, emblems, trophy, trophyId, receipt }', async () => {
    const { e, gid } = await roda();
    danoSemeado(e, gid, '2026-09-09', M[0], 140);
    const primeiro = (await (await resgatar(e, M[0], '2026-W37')).json()).claimed;
    const r = await resgatar(e, M[0], '2026-W37');
    expect(r.status).toBe(409);
    const corpo = await r.json();
    expect(Object.keys(corpo.claimed).sort()).toEqual(['emblems', 'outcome', 'receipt', 'trophy', 'trophyId', 'week']);
    expect(corpo.claimed).toEqual(primeiro);
    expect(corpo.claimed).toMatchObject({ week: '2026-W37', outcome: 'dissipada', emblems: RAID_EMBLEMS, trophy: false, trophyId: null });
  });

  it('a quarta Concha também volta no 409 (o troféu entra no registro)', async () => {
    const { e, gid } = await roda();
    e.DIGIAPP_SAVES.store.set(`coopShell:${M[0]}`, JSON.stringify({ ids: ['2026-W34', '2026-W35', '2026-W36'] }));
    danoSemeado(e, gid, '2026-09-09', M[0], 140);
    const primeiro = (await (await resgatar(e, M[0], '2026-W37')).json()).claimed;
    expect(primeiro.trophy).toBe(true);
    const dup = await (await resgatar(e, M[0], '2026-W37')).json();
    expect(dup.claimed).toMatchObject({ trophy: true, trophyId: RAID_TROPHY_ID, receipt: primeiro.receipt });
  });

  it('a quantia do 409 vem do REGISTRO, não é recalculada', async () => {
    const { e, gid } = await roda();
    danoSemeado(e, gid, '2026-09-09', M[0], 140);
    await resgatar(e, M[0], '2026-W37');
    const k = coopClaimKey(M[0], '2026-W37');
    const rec = JSON.parse(e.DIGIAPP_SAVES.store.get(k));
    e.DIGIAPP_SAVES.store.set(k, JSON.stringify({ ...rec, kind: 'recuou', emblems: RAID_EMBLEMS_FLOOR }));
    const dup = await (await resgatar(e, M[0], '2026-W37')).json();
    expect(dup.claimed).toMatchObject({ outcome: 'recuou', emblems: RAID_EMBLEMS_FLOOR });
  });
});

describe('M-2 — sair não zera os dias distintos de fio', () => {
  const fio = (e, id, dia) => chamar(e, 'guildThread', { id, kind: 'fio', dayKey: dia });
  const vista = async (e, id) => (await (await chamar(e, 'guild', { id }, 'GET')).json()).guild;

  it('6 dias numa guilda, sair, voltar: o 7º dia já libera os cenários', async () => {
    const { e, code } = await roda(2);
    for (let k = 0; k < STAGE_UNLOCK_DAYS - 1; k++) {
      em(`2026-09-${String(10 + k * 2).padStart(2, '0')}T12:00:00Z`); // dias distintos, não seguidos
      await fio(e, M[1]);
    }
    em('2026-09-22T12:00:00Z');
    await sair(e, M[1]);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopDiasKey(M[1]))).n).toBe(STAGE_UNLOCK_DAYS - 1);
    await chamar(e, 'guildJoin', { id: M[1], code });
    expect((await vista(e, M[1])).mine).not.toHaveProperty('groveScenes');
    em('2026-09-23T12:00:00Z');
    await fio(e, M[1]);
    expect((await vista(e, M[1])).mine.groveScenes).toBe(true);
  });

  it('firmar, sair e voltar no MESMO dia e firmar de novo não conta o dia duas vezes', async () => {
    const { e, gid, code } = await roda(2);
    await fio(e, M[1]);
    await sair(e, M[1]);
    await chamar(e, 'guildJoin', { id: M[1], code });
    await fio(e, M[1]);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopFioKey(gid, M[1]))).distinctDays).toBe(1);
  });

  it('o dia herdado nunca entra no fechamento do Bosque da guilda nova (só o contador vem)', async () => {
    const { e, gid, code } = await roda(2);
    await fio(e, M[1]);
    await sair(e, M[1]);
    em('2026-09-11T12:00:00Z');
    await chamar(e, 'guildJoin', { id: M[1], code });
    await fio(e, M[1]);
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopFioKey(gid, M[1]))).days).toEqual(['2026-09-11']);
  });
});

describe('onde o direito mora', () => {
  it('o golpe já grava a participação do titular (não espera a saída)', async () => {
    const { e, gid } = await roda();
    await chamar(e, 'guildRaidHit', { id: M[0] });
    expect(JSON.parse(e.DIGIAPP_SAVES.store.get(coopPartKey(M[0], '2026-W37')))).toEqual({ gid, day: '2026-09-10' });
  });

  it('a saída da EXCLUSÃO não guarda nada com a pessoa', async () => {
    const { e } = await roda();
    await chamar(e, 'guildThread', { id: M[1], kind: 'fio' });
    e.DIGIAPP_SAVES.store.set(coopHitKey((await e.DIGIAPP_SAVES.get(`coopOf:${M[1]}`)), '2026-W37', M[1]), JSON.stringify({ week: '2026-W37', days: ['2026-09-10'], dmg: 5 }));
    await coopLeave(e, M[1], { exclusao: true });
    expect([...e.DIGIAPP_SAVES.store.keys()].filter(k => k.includes(M[1]) && /^coop(Part|Dias)/.test(k))).toEqual([]);
  });
});

describe('exclusão de conta apaga o que foi guardado com a pessoa', () => {
  it('apagarClaims remove coopPart e coopDias', async () => {
    const { e, gid } = await roda();
    await chamar(e, 'guildRaidHit', { id: M[0] });
    await chamar(e, 'guildThread', { id: M[0], kind: 'fio' });
    await sair(e, M[0]);
    expect(e.DIGIAPP_SAVES.store.has(coopPartKey(M[0], '2026-W37'))).toBe(true);
    expect(e.DIGIAPP_SAVES.store.has(coopDiasKey(M[0]))).toBe(true);
    await apagarClaims(e, M[0], new Date());
    expect(e.DIGIAPP_SAVES.store.has(coopPartKey(M[0], '2026-W37'))).toBe(false);
    expect(e.DIGIAPP_SAVES.store.has(coopDiasKey(M[0]))).toBe(false);
    void gid;
  });
});
