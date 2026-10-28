import { describe, it, expect, afterEach, vi } from 'vitest';
import { onRequest } from './guild.js';
import { onRequest as account } from './account.js';
import {
  feiraEvtKey, feiraHitKey, feiraDeadKey, feiraDoneKey, feiraClaimKey, feiraPartKey, coopKey, coopMemKey,
} from './_coop.js';
import { bossHpFor, ATAQUE_TETO } from './_feira.js';

vi.mock('./_auth.js', async (orig) => ({
  ...(await orig()),
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false, tombstone: { deleted: false, reopened: false } }),
}));

/**
 * A FEIRA DO CHEFE no servidor (F-03, F-04, F-05, F-07): ataque re-simulado, 1/dia, abate idempotente, resgate por
 * participação, descanso, saída sem regressão, vista sem nada por pessoa, e DESLIGADA por padrão.
 */
function fakeKV() {
  const store = new Map();
  const meta = new Map();
  const puts = [];
  return {
    store, meta, puts,
    get: async k => store.get(k) ?? null,
    getWithMetadata: async k => ({ value: store.get(k) ?? null, metadata: meta.get(k) ?? null }),
    put: async (k, v, o) => { puts.push(k); store.set(k, v); if (o?.metadata !== undefined) meta.set(k, o.metadata); },
    delete: async k => { store.delete(k); meta.delete(k); },
    list: async ({ prefix = '' }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}
const sid = r => r.padEnd(32, '0');
const M = 'abcdefghijkl'.split('').map(c => sid(c + c));
const LIGADA = '2000-01-01';
const chamar = (e, action, body, method = 'POST') => onRequest({
  request: new Request(`https://x.dev/api/guild?action=${action}${method === 'GET' ? `&id=${body.id}${body.dayKey ? `&dayKey=${body.dayKey}` : ''}` : ''}`, {
    method, headers: { 'Content-Type': 'application/json' }, body: method === 'POST' ? JSON.stringify(body) : undefined,
  }),
  env: e,
});
const J = r => r.json();
const dia = (d) => vi.setSystemTime(new Date(`${d}T12:00:00Z`));
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

async function roda(n, { ligada = true, inicio = '2026-11-10' } = {}) {
  vi.useFakeTimers({ toFake: ['Date'] });
  dia(inicio);
  vi.spyOn(console, 'warn').mockImplementation(() => {});
  vi.spyOn(console, 'log').mockImplementation(() => {});
  const e = { DIGIAPP_SAVES: fakeKV(), ...(ligada ? { FEIRA_CHEFE_DESDE: LIGADA } : {}) };
  for (const m of M) e.DIGIAPP_SAVES.store.set(`profile:${m}`, JSON.stringify({ name: `N${m[0]}`, pid: `P${m[0]}${'q'.repeat(22)}`, stage: 'champion' }));
  const g = (await J(await chamar(e, 'guildCreate', { id: M[0], name: 'Roda' }))).guild;
  for (const m of M.slice(1, n)) await chamar(e, 'guildJoin', { id: m, code: g.code });
  return { e, gid: g.id, kv: e.DIGIAPP_SAVES };
}
const feira = async (e, id, extra = {}) => (await J(await chamar(e, 'guildFeira', { id, ...extra }, 'GET'))).evento;
const atacar = (e, id, extra = {}) => chamar(e, 'guildFeiraAttack', { id, ...extra });
/** Põe dano na chave do membro como se ele já tivesse batido (o chefe k precisa estar aberto). */
const semeia = (kv, gid, k, membro, dmg, days = ['2026-11-10']) => kv.store.set(feiraHitKey(gid, k, membro), JSON.stringify({ k, days, dmg }));
const evt = (kv, gid) => JSON.parse(kv.store.get(feiraEvtKey(gid)));

describe('DESLIGADA por padrão', () => {
  it('toda ação da Feira responde 404 e NADA é gravado; guildRaidHit sem `evento`; a vista sem `feira`', async () => {
    const { e, kv } = await roda(4, { ligada: false });
    kv.puts.length = 0;
    for (const a of ['guildFeiraAttack', 'guildFeiraClaim', 'guildFeiraTrailStart', 'guildFeiraTrailDone']) {
      const r = await chamar(e, a, { id: M[0] });
      expect(r.status, a).toBe(404);
      expect((await J(r)).error).toBe('not available');
    }
    expect((await chamar(e, 'guildFeira', { id: M[0] }, 'GET')).status).toBe(404);
    const hit = await J(await chamar(e, 'guildRaidHit', { id: M[0] }));
    expect(hit.landed).toBe(true);
    expect('evento' in hit).toBe(false);
    expect('feira' in hit.guild).toBe(false);
    expect([...kv.store.keys()].filter(k => k.startsWith('feira'))).toEqual([]);
  });
  it('a data de liga no futuro também desliga; no passado liga', async () => {
    const { e } = await roda(3, { ligada: false });
    e.FEIRA_CHEFE_DESDE = '2099-01-01';
    expect((await chamar(e, 'guildFeira', { id: M[0] }, 'GET')).status).toBe(404);
    e.FEIRA_CHEFE_DESDE = '2026-11-10';
    expect((await chamar(e, 'guildFeira', { id: M[0] }, 'GET')).status).toBe(200);
  });
});

describe('o mistério 0 e a foto do chefe', () => {
  it('o 1º mistério é SEMPRE chefe, nível 1, com o HP da tabela pelo número de ativos; spawnDay = o dia da 1ª leitura', async () => {
    const { e, kv, gid } = await roda(4);
    const ev = await feira(e, M[0]);
    expect(ev).toMatchObject({ k: 0, kind: 'boss', level: 1, bossHpPct: 100, canAttack: true });
    expect(typeof ev.bossId).toBe('string');
    const foto = evt(kv, gid);
    expect(foto).toMatchObject({ k: 0, kind: 'boss', level: 1, spawnDay: '2026-11-10', hp0: bossHpFor(1, 4) });
    // idempotente: 2ª leitura não muda a foto
    await feira(e, M[1]);
    expect(evt(kv, gid)).toEqual(foto);
  });
  it('o HP é uma FOTO: entrar gente depois do surgimento não muda hp0', async () => {
    const { e, kv, gid } = await roda(4);
    await feira(e, M[0]);
    const antes = evt(kv, gid).hp0;
    const g = (await J(await chamar(e, 'guild', { id: M[0] }, 'GET'))).guild;
    for (const m of M.slice(4, 8)) await chamar(e, 'guildJoin', { id: m, code: g.code });
    await feira(e, M[0]);
    expect(evt(kv, gid).hp0).toBe(antes);
  });
});

describe('F-03 o ataque', () => {
  it('(a) 1 por dia por pessoa: o 2º é 429 `daily limit`; no dia seguinte volta', async () => {
    const { e } = await roda(4);
    const r1 = await atacar(e, M[0]);
    expect(r1.status).toBe(200);
    const r2 = await atacar(e, M[0]);
    expect(r2.status).toBe(429);
    expect((await J(r2)).error).toBe('daily limit');
    expect((await atacar(e, M[1])).status).toBe(200); // outro membro, mesmo dia
    dia('2026-11-11');
    expect((await atacar(e, M[0])).status).toBe(200);
  });
  it('(j) o dano vem da re-simulação com semente do servidor: `dmg`, `seed` e `hp` enviados pelo cliente são ignorados', async () => {
    const { e, kv, gid } = await roda(4);
    const r = await J(await atacar(e, M[0], { dmg: 99999, damage: 99999, seed: 1, hp: 0, bossHpPct: 0, dead: true }));
    expect(r.landed).toBe(true);
    expect(r.attack.dmg).toBeGreaterThanOrEqual(1);
    expect(r.attack.dmg).toBeLessThanOrEqual(ATAQUE_TETO);
    expect(r.attack.seed).not.toBe(1);
    expect(r.attack.seconds).toBe(30);
    expect(r.attack.log.length).toBeGreaterThan(3);
    const guardado = JSON.parse(kv.store.get(feiraHitKey(gid, 0, M[0])));
    expect(guardado.dmg).toBe(r.attack.dmg);
    expect(r.boss.dead).toBe(false);
    expect(r.boss.bossHpPct).toBeLessThan(100);
  });
  it('a semente é do servidor: dois ataques no mesmo estado dão sementes diferentes', async () => {
    const { e } = await roda(4);
    const a = await J(await atacar(e, M[0]));
    const b = await J(await atacar(e, M[1]));
    expect(a.attack.seed).not.toBe(b.attack.seed);
  });
  it('a resposta traz SÓ o agregado do clã + o dano do PRÓPRIO golpe (nada por membro)', async () => {
    const { e, gid } = await roda(4);
    await atacar(e, M[1]);
    const r = await J(await atacar(e, M[0]));
    expect(Object.keys(r).sort()).toEqual(['attack', 'boss', 'evento', 'landed']);
    expect(Object.keys(r.attack).sort()).toEqual(['dmg', 'log', 'seconds', 'seed']);
    expect(Object.keys(r.boss).sort()).toEqual(['bossHpPct', 'bossId', 'dead', 'level', 'max']);
    const txt = JSON.stringify(r);
    for (const m of M) expect(txt).not.toContain(m);
    expect(txt).not.toContain(gid.slice(0, 12));
    expect(txt).not.toMatch(/hitters|contrib|members|memberId|days/);
  });
  it('409 `no boss` quando não há chefe vivo (descanso/trilha); 404 sem guilda', async () => {
    const { e, kv, gid } = await roda(4);
    await feira(e, M[0]);
    kv.store.set(feiraEvtKey(gid), JSON.stringify({ k: 0, kind: 'trail', level: 1, bossId: null, hp0: 0, spawnDay: '2026-11-10' }));
    const r = await atacar(e, M[0]);
    expect(r.status).toBe(409);
    expect((await J(r)).error).toBe('no boss');
    const sem = await chamar(e, 'guildFeiraAttack', { id: sid('zz') });
    expect(sem.status).toBe(404);
  });
  it('atacar o chefe não toca o Bosque (LV-G7) nem a Missão do dia (o golpe do fenômeno segue livre)', async () => {
    const { e, kv, gid } = await roda(4);
    const antes = JSON.parse(kv.store.get(coopKey(gid)));
    await atacar(e, M[0]);
    const depois = JSON.parse(kv.store.get(coopKey(gid)));
    expect(depois.bosqueProgress).toBe(antes.bosqueProgress);
    expect(depois.tideKey).toBe(antes.tideKey);
    expect((await chamar(e, 'guildRaidHit', { id: M[0] })).status).toBe(200);
  });
  it('só escreve chaves da Feira (feira*), o cartão do próprio membro e a casa', async () => {
    const { e, kv } = await roda(4);
    await feira(e, M[0]);
    kv.puts.length = 0;
    await atacar(e, M[0]);
    for (const k of kv.puts) expect(k, k).toMatch(/^(feira(Hit|Part|Right|Evt|Dead|Done):|coopMem:)/);
  });
});

describe('(c)(d)(h) o abate é constante e idempotente; sair não reabre nem regride', () => {
  async function ate_matar() {
    const ctx = await roda(4);
    await feira(ctx.e, M[0]);
    const { hp0 } = evt(ctx.kv, ctx.gid);
    // 3 membros "já bateram" muito; falta o último golpe.
    semeia(ctx.kv, ctx.gid, 0, M[1], Math.floor(hp0 / 2) - 10);
    semeia(ctx.kv, ctx.gid, 0, M[2], Math.floor(hp0 / 2) - 10);
    semeia(ctx.kv, ctx.gid, 0, M[3], 0, []);
    return { ...ctx, hp0 };
  }
  it('(c) duas leituras no mesmo estado gravam o MESMO `feiraDead` e o contador só avança uma vez', async () => {
    const { e, kv, gid } = await ate_matar();
    const r = await J(await atacar(e, M[0]));
    expect(r.boss.dead).toBe(true);
    expect(r.boss.bossHpPct).toBe(0);
    const morte = kv.store.get(feiraDeadKey(gid, 0));
    expect(JSON.parse(morte)).toMatchObject({ day: '2026-11-10', level: 1, kind: 'boss' });
    const done1 = kv.store.get(feiraDoneKey(gid));
    expect(JSON.parse(done1)).toMatchObject({ n: 1, bosses: 1, trails: 0, lastDay: '2026-11-10', lastKind: 'boss' });
    await feira(e, M[1]);
    await feira(e, M[2]);
    expect(kv.store.get(feiraDeadKey(gid, 0))).toBe(morte);
    expect(kv.store.get(feiraDoneKey(gid))).toBe(done1);
  });
  it('(409) com o chefe morto o ataque é `boss dead`', async () => {
    const { e } = await ate_matar();
    await atacar(e, M[0]);
    const r = await atacar(e, M[1]);
    expect(r.status).toBe(409);
    expect((await J(r)).error).toBe('boss dead');
  });
  it('(d) quem bateu e SAI: o dano fica (legado), o chefe não ganha vida e não reabre depois de morto', async () => {
    const { e, kv, gid, hp0 } = await ate_matar();
    await feira(e, M[1]); // o chefe segue vivo
    // M1 sai: seu dano (metade do HP) vira legado do clã
    await chamar(e, 'guildLeave', { id: M[1] });
    const g = JSON.parse(kv.store.get(coopKey(gid)));
    expect(g.feiraLegado).toEqual({ k: 0, dmg: Math.floor(hp0 / 2) - 10 });
    const ev = await feira(e, M[0]);
    expect(ev.bossHpPct).toBeLessThan(75); // ~50% já tirados, não voltou a 100
    // M1 volta e o golpe do dia continua gasto (os dias ficam na chave; o dano foi zerado para não contar em dobro)
    const gcode = (await J(await chamar(e, 'guild', { id: M[0] }, 'GET'))).guild.code;
    await chamar(e, 'guildJoin', { id: M[1], code: gcode });
    const hit = JSON.parse(kv.store.get(feiraHitKey(gid, 0, M[1])));
    expect(hit.dmg).toBe(0);
    expect(hit.days).toContain('2026-11-10');
    expect((await atacar(e, M[1])).status).toBe(429);
    expect((await feira(e, M[0])).bossHpPct).toBe(ev.bossHpPct); // sem contar em dobro
    // mata, depois quem tinha golpeado sai: continua morto
    const r = await J(await atacar(e, M[0]));
    expect(r.boss.dead).toBe(true);
    await chamar(e, 'guildLeave', { id: M[2] });
    expect(kv.store.get(feiraDeadKey(gid, 0))).toBeTruthy();
    expect((await feira(e, M[0])).rest).toBe(true);
  });
});

describe('(g) descanso e o próximo mistério', () => {
  it('matou no dia d: d e d+1 são descanso (sem evento de luta); o mistério 1 abre em d+2, nível 2, HP novo', async () => {
    const { e, kv, gid } = await roda(4);
    await feira(e, M[0]);
    const { hp0 } = evt(kv, gid);
    for (const m of M.slice(1, 4)) semeia(kv, gid, 0, m, hp0);
    await atacar(e, M[0]);
    const ev0 = await feira(e, M[0]);
    expect(ev0).toMatchObject({ kind: 'rest', rest: true, level: 2, k: 1 });
    expect('bossHpPct' in ev0).toBe(false);
    dia('2026-11-11');
    expect((await feira(e, M[0])).rest).toBe(true);
    expect((await atacar(e, M[0])).status).toBe(409);
    dia('2026-11-12');
    const ev2 = await feira(e, M[0]);
    expect(ev2).toMatchObject({ k: 1, level: 2 });
    expect(['boss', 'trail']).toContain(ev2.kind);
    expect(evt(kv, gid)).toMatchObject({ k: 1, spawnDay: '2026-11-12', level: 2 });
  });
  it('a vida do chefe NUNCA regenera entre dias', async () => {
    const { e } = await roda(4);
    await atacar(e, M[0]);
    const p1 = (await feira(e, M[1])).bossHpPct;
    dia('2026-11-11');
    expect((await feira(e, M[1])).bossHpPct).toBe(p1);
    dia('2026-11-15');
    expect((await feira(e, M[1])).bossHpPct).toBe(p1);
  });
  it('(h) determinismo: o mesmo clã e o mesmo k dão o mesmo tipo e o mesmo chefe', async () => {
    const { e, kv, gid } = await roda(3);
    await feira(e, M[0]);
    const foto = evt(kv, gid);
    kv.store.delete(feiraEvtKey(gid));
    await feira(e, M[1]);
    expect(evt(kv, gid)).toEqual(foto);
  });
});

describe('F-04 o resgate do abate', () => {
  async function abatido() {
    const ctx = await roda(4);
    await feira(ctx.e, M[0]);
    const { hp0 } = evt(ctx.kv, ctx.gid);
    // M0 e M1 batem de verdade; M2 só semeia dano alto (sem `feiraPart`).
    await atacar(ctx.e, M[0]);
    await atacar(ctx.e, M[1]);
    semeia(ctx.kv, ctx.gid, 0, M[2], hp0, ['2026-11-10']);
    await atacar(ctx.e, M[3]);
    return ctx;
  }
  it('resgata uma vez: Emblemas, Bits, seiva, troféu do chefe, `essences: []` e `element`; 2º é 409 com o MESMO recibo', async () => {
    const { e, kv, gid } = await abatido();
    const r = await chamar(e, 'guildFeiraClaim', { id: M[0] });
    expect(r.status).toBe(200);
    const c = (await J(r)).claimed;
    expect(Object.keys(c).sort()).toEqual(['bossId', 'k', 'level', 'receipt', 'reward']);
    expect(c.k).toBe(0);
    expect(c.level).toBe(1);
    expect(c.reward).toMatchObject({ emblems: 2, bits: 40, sap: 10, essences: [], trophyId: `trophy-boss-${c.bossId}` });
    expect(typeof c.reward.element).toBe('string');
    expect(Object.keys(c.reward).sort()).toEqual(['bits', 'element', 'emblems', 'essences', 'sap', 'trophyId']);
    expect(kv.store.get(feiraClaimKey(gid, 0, M[0]))).toBeTruthy();
    // a seiva da missão entrou na casa dele
    const casa = JSON.parse(kv.store.get(`coopCasa:${gid}:${M[0]}`));
    expect(casa.pts.missao).toBeGreaterThanOrEqual(10);
    const antes = kv.store.get(`coopCasa:${gid}:${M[0]}`);
    const r2 = await chamar(e, 'guildFeiraClaim', { id: M[0] });
    expect(r2.status).toBe(409);
    const j2 = await J(r2);
    expect(j2.error).toBe('already claimed');
    expect(j2.receipt).toBe(c.receipt);
    expect(j2.claimed.reward.emblems).toBe(2);
    expect(kv.store.get(`coopCasa:${gid}:${M[0]}`)).toBe(antes); // sem seiva em dobro
  });
  it('(e) quem não golpeou (sem feiraPart) não resgata: 404 `nothing to claim`', async () => {
    const { e, kv, gid } = await abatido();
    expect(kv.store.get(feiraPartKey(gid, 0, M[2]))).toBeUndefined();
    const r = await chamar(e, 'guildFeiraClaim', { id: M[2] });
    expect(r.status).toBe(404);
    expect((await J(r)).error).toBe('nothing to claim');
    // entrada tardia: entra depois do abate, também não resgata
    const code = (await J(await chamar(e, 'guild', { id: M[0] }, 'GET'))).guild.code;
    await chamar(e, 'guildJoin', { id: M[9], code });
    expect((await chamar(e, 'guildFeiraClaim', { id: M[9] })).status).toBe(404);
  });
  it('o direito não exige estar no clã: quem bateu e saiu ainda resgata (A-1), sem regar a casa de quem ficou', async () => {
    const { e, kv, gid } = await abatido();
    await chamar(e, 'guildLeave', { id: M[1] });
    const r = await chamar(e, 'guildFeiraClaim', { id: M[1] });
    expect(r.status).toBe(200);
    expect((await J(r)).claimed.reward.emblems).toBe(2);
    expect(kv.store.get(`coopCasa:${gid}:${M[1]}`)).toBeUndefined();
  });
  it('o troféu do chefe sai só no 1º abate daquele chefe', async () => {
    const { e, kv } = await abatido();
    const c = (await J(await chamar(e, 'guildFeiraClaim', { id: M[0] }))).claimed;
    expect(c.reward.trophyId).toBe(`trophy-boss-${c.bossId}`);
    expect(JSON.parse(kv.store.get(`feiraTrophy:${M[0]}`)).ids).toEqual([c.bossId]);
  });
  it('sem nada para resgatar (chefe vivo) é 404', async () => {
    const { e } = await roda(3);
    await atacar(e, M[0]);
    expect((await chamar(e, 'guildFeiraClaim', { id: M[0] })).status).toBe(404);
  });
  it('o `evento` do descanso avisa `claimable` para quem tem o que resgatar (e some depois de resgatar)', async () => {
    const { e } = await abatido();
    const ev = await feira(e, M[0]);
    expect(ev).toMatchObject({ rest: true, claimable: true, claimK: 0 });
    await chamar(e, 'guildFeiraClaim', { id: M[0] });
    expect((await feira(e, M[0])).claimable).toBeUndefined();
    expect((await feira(e, M[2])).claimable).toBeUndefined();
  });
});

describe('F-05 `guildRaidHit.evento` (aditivo)', () => {
  it('LIGADA: o golpe segue idêntico (`landed`, vista) e ganha `evento`; DESLIGADA: igual ao de hoje', async () => {
    const lig = await roda(4);
    const r = await J(await chamar(lig.e, 'guildRaidHit', { id: M[0] }));
    expect(r.landed).toBe(true);
    expect(r.guild.raid.mine).toEqual({ hitToday: true });
    expect(r.evento).toMatchObject({ k: 0, kind: 'boss', level: 1, canAttack: true, bossHpPct: 100 });
    vi.useRealTimers();
    const des = await roda(4, { ligada: false });
    const r2 = await J(await chamar(des.e, 'guildRaidHit', { id: M[0] }));
    expect(Object.keys(r2).sort()).toEqual(['guild', 'landed']);
  });
  it('as regras da Missão não mudam: 429 no 2º golpe do dia, 409 com o fenômeno encerrado; o chefe não interfere', async () => {
    const { e } = await roda(4);
    expect((await chamar(e, 'guildRaidHit', { id: M[0] })).status).toBe(200);
    expect((await chamar(e, 'guildRaidHit', { id: M[0] })).status).toBe(429);
  });
  it('erro ao calcular o evento NUNCA derruba o golpe (try/catch): o golpe é registrado e `evento` é omitido', async () => {
    const { e, kv } = await roda(4);
    const get = kv.get;
    // quebra só a leitura do estado da Feira
    kv.get = async (k) => { if (String(k).startsWith('feiraDone:') || String(k).startsWith('feiraEvt:')) throw new Error('kv fora'); return get(k); };
    const resp = await chamar(e, 'guildRaidHit', { id: M[0] });
    kv.get = get;
    // `montar` também lê a vista (que engole o erro da Feira) — o golpe responde 200
    expect(resp.status).toBe(200);
    const j = await J(resp);
    expect(j.landed).toBe(true);
    expect('evento' in j).toBe(false);
    expect(j.guild.raid.mine).toEqual({ hitToday: true });
  });
  it('clientes antigos: o golpe sem `dayKey` e sem nenhum campo novo continua valendo', async () => {
    const { e } = await roda(3);
    const r = await chamar(e, 'guildRaidHit', { id: M[2] });
    expect(r.status).toBe(200);
  });
});

describe('F-07 a vista segura', () => {
  it('traz `feira` com estado, nível, chefe e %, e NADA por pessoa (dano, golpes, marcas, quem bateu)', async () => {
    const { e, gid } = await roda(5);
    await atacar(e, M[1]);
    await atacar(e, M[2]);
    const v = (await J(await chamar(e, 'guild', { id: M[0] }, 'GET'))).guild;
    expect(v.feira).toMatchObject({ state: 'boss', level: 1 });
    expect(Object.keys(v.feira).sort()).toEqual(['bossHpPct', 'bossId', 'level', 'state']);
    expect(v.feira.bossHpPct).toBeLessThan(100);
    const txt = JSON.stringify(v);
    for (const m of M) expect(txt).not.toContain(m);
    expect(txt).not.toMatch(/"dmg"|hitters|"hits"|feiraHit/);
    expect(v.members.every(m => !('feira' in m) && !('hit' in m))).toBe(true);
    // quem bateu e quem não bateu são indistinguíveis na vista dos outros
    const v2 = (await J(await chamar(e, 'guild', { id: M[3] }, 'GET'))).guild;
    expect(v2.feira).toEqual(v.feira);
    void gid;
  });
  it('a vista não grava nada no blob do clã por causa da Feira (LV-G7)', async () => {
    const { e, kv, gid } = await roda(4);
    const antes = JSON.parse(kv.store.get(coopKey(gid)));
    await chamar(e, 'guild', { id: M[0] }, 'GET');
    const depois = JSON.parse(kv.store.get(coopKey(gid)));
    expect(depois.bosqueProgress).toBe(antes.bosqueProgress);
    expect(Object.keys(depois).sort()).toEqual(Object.keys(antes).sort());
  });
});

describe('conta: exportação e exclusão cobrem as chaves feira*', () => {
  const post = (url, body) => new Request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body ?? {}) });
  async function comAtaques() {
    const ctx = await roda(4);
    await atacar(ctx.e, M[0]);
    await atacar(ctx.e, M[1]);
    ctx.kv.store.set(`feiraGate:${M[0]}`, JSON.stringify({ k: 0, open: true }));
    ctx.kv.store.set(`feiraTrophy:${M[0]}`, JSON.stringify({ ids: ['cinderhorn'] }));
    ctx.kv.store.set(feiraClaimKey(ctx.gid, 0, M[0]), JSON.stringify({ at: 1 }));
    return ctx;
  }
  it('a exclusão apaga o que é da pessoa (hit/part/claim/gate/ponteiro/troféus); o do outro membro fica', async () => {
    const { e, kv, gid } = await comAtaques();
    const chaves = [feiraHitKey(gid, 0, M[0]), feiraPartKey(gid, 0, M[0]), `feiraRight:${M[0]}`, `feiraGate:${M[0]}`, `feiraTrophy:${M[0]}`, feiraClaimKey(gid, 0, M[0])];
    for (const k of chaves) expect(kv.store.has(k), k).toBe(true);
    const pedido = await J(await account({ request: post(`https://x/api/account?action=delete-request&id=${M[0]}`), env: e }));
    const r = await account({ request: post(`https://x/api/account?action=delete-confirm&id=${M[0]}`, { confirmToken: pedido.confirmToken }), env: e });
    expect(r.status).toBe(200);
    expect((await J(r)).executado.falhou).toEqual([]);
    for (const k of chaves) expect(kv.store.has(k), `${k} deveria ter sido apagada`).toBe(false);
    expect([...kv.store.keys()].filter(k => k.startsWith('feira') && k.includes(M[0]))).toEqual([]);
    expect(kv.store.has(feiraHitKey(gid, 0, M[1]))).toBe(true);
    // o dano de quem foi EXCLUÍDO não vira legado (a exclusão apaga; só a saída converte)
    expect(JSON.parse(kv.store.get(coopKey(gid))).feiraLegado).toBeUndefined();
  });
  it('a exportação traz só os PRÓPRIOS dias, resgates e troféus — sem dano e sem nada de outro membro', async () => {
    const { e } = await comAtaques();
    const txt = await (await account({ request: new Request(`https://x/api/account?action=export&id=${M[0]}`), env: e })).text();
    const f = JSON.parse(txt).data.coop.feira;
    expect(f.hitDays).toEqual({ 0: ['2026-11-10'] });
    expect(f.claimedK).toEqual([0]);
    expect(f.defeatedBosses).toEqual(['cinderhorn']);
    expect(f.gateOpen).toBe(true);
    expect(txt).not.toContain(M[1]);
    expect(txt).not.toMatch(/"dmg"/);
  });
  it('sem nada da Feira, a exportação não ganha o campo (comportamento de hoje)', async () => {
    const { e } = await roda(3, { ligada: false });
    const txt = await (await account({ request: new Request(`https://x/api/account?action=export&id=${M[0]}`), env: e })).text();
    expect(JSON.parse(txt).data.coop.feira).toBeUndefined();
  });
});
