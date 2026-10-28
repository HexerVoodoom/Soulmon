/**
 * FEIRA DO CHEFE (cliente): sanitizadores, o mapa log→FightEvent, os wrappers de API (fetch mockado), o crédito UMA vez por recibo
 * e a INÉRCIA com a Feira desligada (404 / campo ausente = tudo como antes).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./auth', () => ({ authHeaders: vi.fn(async () => ({ Authorization: 'Bearer t' })) }));
vi.mock('./cloudSave', () => ({ reagirContaExcluida: vi.fn(async () => {}) }));

import {
  getGuildFeira, attackGuildFeira, claimGuildFeira, startGuildFeiraTrail, doneGuildFeiraTrail, hitGuildRaidEvento, sanitizeGuildView, GuildError,
} from './community';
import {
  sanitizeFeiraEvento, sanitizeFeiraAttack, sanitizeFeiraClaim, sanitizeFeiraTrail, sanitizeFeiraTrailDone, mapFeiraLog, feiraEventoAbre, feiraShownKey,
  FEIRA_TRAIL_MIN_MS, type FeiraLogEntry,
} from './feira';
import { creditFeiraOnce, type FeiraCredit } from './feiraCredit';
import { resetClaimMemoryForTests } from './guildClaimLocal';
import { playerDayKey } from './playerDay';

const mem = new Map<string, string>();
const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); }, removeItem: (k: string) => { mem.delete(k); }, clear: () => mem.clear(), key: () => null, length: 0 };
const resp = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const fetchMock = vi.fn();
beforeEach(() => { fetchMock.mockReset(); mem.clear(); vi.stubGlobal('fetch', fetchMock); vi.stubGlobal('localStorage', storage); resetClaimMemoryForTests(); });
afterEach(() => vi.unstubAllGlobals());

const dia = () => playerDayKey(new Date(), undefined);
const bossEv = { k: 0, kind: 'boss', level: 1, bossId: 'arauto-do-fim', element: 'fogo', bossHpPct: 80, canAttack: true };
const attackBody = {
  landed: true,
  attack: { dmg: 120, seed: 7, seconds: 30, log: [{ k: 'a', t: 2, s: 0, f: 0.1 }, { k: 'c', t: 4, s: 1, f: 0 }, { k: 'a', t: 4, s: 1, f: 0.2 }, { k: 't', t: 6, s: 0, f: 0.05 }] },
  boss: { bossId: 'arauto-do-fim', level: 1, bossHpPct: 70, max: 720, dead: false },
  evento: { ...bossEv, bossHpPct: 70, canAttack: false },
};
const guildBase = { id: 'g1', name: 'Roda', weekKey: '2026-W40', code: 'ABCD2345', isHost: false, size: 1, full: false, members: [], mine: {}, bosque: {} };

describe('sanitizadores', () => {
  it('evento: boss / trail / rest; lixo vira null', () => {
    expect(sanitizeFeiraEvento(bossEv)).toEqual(bossEv);
    expect(sanitizeFeiraEvento({ k: 2, kind: 'trail', level: 3, trail: { pending: true, cleared: false, marks: 2 }, gate: 'locked' })).toEqual({ k: 2, kind: 'trail', level: 3, trail: { pending: true, cleared: false, marks: 2 }, gate: 'locked' });
    expect(sanitizeFeiraEvento({ k: 1, kind: 'rest', rest: true, level: 2, claimable: true, claimK: 0 })).toEqual({ k: 1, kind: 'rest', level: 2, claimable: true, claimK: 0 });
    expect(sanitizeFeiraEvento({ k: 1, kind: 'rest', rest: true, level: 2 })).toMatchObject({ claimable: false, claimK: null });
    for (const lixo of [null, undefined, 3, 'x', [], {}, { kind: 'boss' }, { kind: 'boss', bossId: '../x' }, { kind: 'raio' }]) expect(sanitizeFeiraEvento(lixo)).toBeNull();
    expect(sanitizeFeiraEvento({ ...bossEv, bossHpPct: 900, level: 99 })).toMatchObject({ bossHpPct: 100, level: 20 });
  });

  it('o evento não tem onde carregar dado por membro (LV-G1)', () => {
    const e = sanitizeFeiraEvento({ ...bossEv, hitters: ['ana'], dmg: 5, members: [1] })!;
    expect(Object.keys(e).sort()).toEqual(['bossHpPct', 'bossId', 'canAttack', 'element', 'k', 'kind', 'level']);
  });

  it('feiraEventoAbre: só o que tem o que fazer', () => {
    expect(feiraEventoAbre(null)).toBe(false);
    expect(feiraEventoAbre(sanitizeFeiraEvento(bossEv))).toBe(true);
    expect(feiraEventoAbre(sanitizeFeiraEvento({ ...bossEv, canAttack: false }))).toBe(false);
    expect(feiraEventoAbre(sanitizeFeiraEvento({ k: 1, kind: 'rest', level: 1 }))).toBe(false);
    expect(feiraEventoAbre(sanitizeFeiraEvento({ k: 1, kind: 'rest', level: 1, claimable: true, claimK: 0 }))).toBe(true);
    expect(feiraEventoAbre(sanitizeFeiraEvento({ k: 1, kind: 'trail', level: 1, trail: { pending: false, cleared: true, marks: 1 } }))).toBe(false);
    expect(feiraEventoAbre(sanitizeFeiraEvento({ k: 1, kind: 'trail', level: 1, trail: { pending: true, cleared: false, marks: 0 }, gate: 'locked' }))).toBe(true);
  });

  it('ataque: exige landed, descarta linhas inválidas e limita o registro', () => {
    const a = sanitizeFeiraAttack({ ...attackBody, attack: { ...attackBody.attack, log: [...attackBody.attack.log, { k: 'x', t: 1, s: 0, f: 1 }, { k: 'a', t: 'z', s: 0, f: 1 }, null] } })!;
    expect(a.log).toHaveLength(4);
    expect(a.dmg).toBe(120);
    expect(a.boss).toEqual({ bossId: 'arauto-do-fim', level: 1, bossHpPct: 70, dead: false });
    expect(sanitizeFeiraAttack({ ...attackBody, landed: false })).toBeNull();
    expect(sanitizeFeiraAttack({ landed: true })).toBeNull();
    const longo = sanitizeFeiraAttack({ ...attackBody, attack: { ...attackBody.attack, log: Array.from({ length: 999 }, (_, i) => ({ k: 'a', t: i % 30, s: 0, f: 0.001 })) } })!;
    expect(longo.log.length).toBeLessThanOrEqual(400);
  });

  it('resgate e trilha: formas fechadas', () => {
    expect(sanitizeFeiraClaim({ k: 0, level: 1, bossId: 'arauto-do-fim', receipt: 'r1', reward: { emblems: 3, bits: 40, sap: 10, trophyId: 'trophy-boss-arauto-do-fim', essences: [], element: 'fogo' } }))
      .toMatchObject({ receipt: 'r1', reward: { emblems: 3, bits: 40, sap: 10, trophyId: 'trophy-boss-arauto-do-fim', element: 'fogo' } });
    expect(sanitizeFeiraClaim({ bossId: 'x' })).toBeNull();
    expect(sanitizeFeiraTrailDone({ cleared: true, reward: { emblems: 1, sap: 3 }, receipt: 'r', evento: null })).toMatchObject({ reward: { emblems: 1, sap: 3 } });
    expect(sanitizeFeiraTrailDone({ cleared: false })).toBeNull();
    expect(sanitizeFeiraTrail({ k: 0, game: 'zip', seed: 5, puzzle: { size: 5, numbers: [0, 24] } })).toMatchObject({ game: 'zip' });
    expect(sanitizeFeiraTrail({ k: 0, game: 'zip', seed: 5, puzzle: { size: 5, numbers: [0] } })).toBeNull();
    expect(sanitizeFeiraTrail({ k: 0, game: 'jogo-x', seed: 5, puzzle: {} })).toBeNull();
    expect(sanitizeFeiraTrail({ k: 0, game: 'eco', seed: 5, puzzle: { par: 5 } })).toMatchObject({ puzzle: { par: 5 } });
    expect(FEIRA_TRAIL_MIN_MS).toEqual({ picross: 8000, zip: 4000, patches: 4000, troca: 10000, eco: 6000 });
  });

  it('vista: `feira` só entra quando o servidor manda (desligada = vista idêntica à de hoje)', () => {
    expect('feira' in sanitizeGuildView(guildBase)!).toBe(false);
    expect(sanitizeGuildView({ ...guildBase, feira: { state: 'boss', level: 2, bossId: 'arauto-do-fim', bossHpPct: 55 } })!.feira).toEqual({ state: 'boss', level: 2, bossId: 'arauto-do-fim', bossHpPct: 55 });
    expect(sanitizeGuildView({ ...guildBase, feira: { state: 'trail', level: 2, marks: 3, nomes: ['ana'] } })!.feira).toEqual({ state: 'trail', level: 2, marks: 3 });
    expect('feira' in sanitizeGuildView({ ...guildBase, feira: { state: 'lixo' } })!).toBe(false);
  });
});

describe('o registro do servidor vira FightEvent', () => {
  const log: FeiraLogEntry[] = [{ k: 'a', t: 2, s: 0, f: 0.1 }, { k: 'c', t: 4, s: 1, f: 0 }, { k: 'a', t: 4, s: 1, f: 0.25 }, { k: 't', t: 6, s: 0, f: 0.05 }];
  it('a→attack, c→cast, t→tick; lado e fração preservados; HP do meu bicho desce com o lado 1', () => {
    const ev = mapFeiraLog(log);
    expect(ev.map(e => e.kind)).toEqual(['attack', 'cast', 'attack', 'tick']);
    expect(ev.map(e => e.side)).toEqual([0, 1, 1, 0]);
    expect(ev.map(e => e.frac)).toEqual([0.1, 0, 0.25, 0.05]);
    expect(ev[2].hp[0]).toBeCloseTo(0.75);
    expect(ev[3].hp[1]).toBeCloseTo(0.85);
  });
  it('ordena por tempo, é determinístico e nunca passa de [0,1]', () => {
    const distinto: FeiraLogEntry[] = log.map((e, i) => ({ ...e, t: i + 1 }));
    expect(mapFeiraLog([...distinto].reverse())).toEqual(mapFeiraLog(distinto));
    const matador = mapFeiraLog([{ k: 'a', t: 1, s: 1, f: 0.9 }, { k: 'a', t: 2, s: 1, f: 0.9 }]);
    expect(matador[1].hp[0]).toBe(0);
  });
  it('log vazio = nenhum evento (a tela abre direto no resultado)', () => { expect(mapFeiraLog([])).toEqual([]); });
});

describe('wrappers de API', () => {
  it('getGuildFeira: GET com id e dia; devolve o evento', async () => {
    fetchMock.mockResolvedValue(resp(200, { evento: bossEv }));
    expect(await getGuildFeira('save-12345')).toEqual(bossEv);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('action=guildFeira');
    expect(url).toContain('id=save-12345');
    expect(url).toContain(new URLSearchParams({ dayKey: dia() }).toString());
    expect(init.method).toBe('GET');
  });

  it('DESLIGADA: 404 `not available` em TODA rota = null, nunca erro', async () => {
    fetchMock.mockImplementation(async () => resp(404, { error: 'not available' }));
    expect(await getGuildFeira('save-12345')).toBeNull();
    expect(await attackGuildFeira('save-12345')).toBeNull();
    expect(await claimGuildFeira('save-12345')).toBeNull();
    expect(await startGuildFeiraTrail('save-12345')).toBeNull();
    expect(await doneGuildFeiraTrail('save-12345', { score: 5 })).toBeNull();
  });

  it('guildRaidHit sem `evento` (servidor antigo/desligado): evento null e a vista de sempre', async () => {
    fetchMock.mockResolvedValue(resp(200, { landed: true, guild: guildBase }));
    const r = await hitGuildRaidEvento('save-12345');
    expect(r.evento).toBeNull();
    expect(r.guild).not.toBeNull();
    expect('feira' in r.guild!).toBe(false);
  });

  it('guildRaidHit com `evento`: o sanitizado sobe', async () => {
    fetchMock.mockResolvedValue(resp(200, { landed: true, guild: guildBase, evento: bossEv }));
    expect((await hitGuildRaidEvento('save-12345')).evento).toEqual(bossEv);
  });

  it('attack: POST com id e dia; 429 → dailyLimit; 409 → server (chefe já caiu); sem rede → unavailable', async () => {
    fetchMock.mockResolvedValue(resp(200, attackBody));
    const a = await attackGuildFeira('save-12345');
    expect(a!.dmg).toBe(120);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('action=guildFeiraAttack');
    expect(JSON.parse(init.body)).toEqual({ id: 'save-12345', dayKey: dia() });
    fetchMock.mockResolvedValue(resp(429, { error: 'daily limit' }));
    await expect(attackGuildFeira('save-12345')).rejects.toMatchObject({ kind: 'dailyLimit' });
    fetchMock.mockResolvedValue(resp(409, { error: 'boss dead' }));
    await expect(attackGuildFeira('save-12345')).rejects.toMatchObject({ status: 409 });
    fetchMock.mockRejectedValue(new TypeError('offline'));
    await expect(attackGuildFeira('save-12345')).rejects.toMatchObject({ kind: 'unavailable' });
  });

  it('claim: 200 devolve o resgate; 409 `already claimed` devolve O MESMO recibo (resposta perdida)', async () => {
    const claimed = { k: 0, level: 1, bossId: 'arauto-do-fim', receipt: 'rec-1', reward: { emblems: 3, bits: 40, sap: 10, trophyId: null, essences: [], element: 'fogo' } };
    fetchMock.mockResolvedValue(resp(200, { claimed }));
    expect((await claimGuildFeira('save-12345', 0))!.receipt).toBe('rec-1');
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ id: 'save-12345', dayKey: dia(), k: 0 });
    fetchMock.mockResolvedValue(resp(409, { error: 'already claimed', receipt: 'rec-1', claimed }));
    expect((await claimGuildFeira('save-12345'))!.receipt).toBe('rec-1');
    fetchMock.mockResolvedValue(resp(404, { error: 'nothing to claim' }));
    expect(await claimGuildFeira('save-12345')).toBeNull();
  });

  it('trilha: start devolve a instância; done manda a solução e erros são tipados', async () => {
    fetchMock.mockResolvedValue(resp(200, { trail: { k: 0, game: 'zip', seed: 9, puzzle: { size: 4, numbers: [0, 15] } }, evento: null }));
    expect((await startGuildFeiraTrail('save-12345'))!.game).toBe('zip');
    fetchMock.mockResolvedValue(resp(200, { cleared: true, reward: { emblems: 1, sap: 3 }, receipt: 'tr-1', evento: null }));
    const r = await doneGuildFeiraTrail('save-12345', { path: [0, 1] });
    expect(r!.reward).toEqual({ emblems: 1, sap: 3 });
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({ id: 'save-12345', dayKey: dia(), path: [0, 1] });
    fetchMock.mockResolvedValue(resp(400, { error: 'wrong solution' }));
    const e = await doneGuildFeiraTrail('save-12345', { path: [0] }).catch(x => x as GuildError);
    expect(e).toBeInstanceOf(GuildError);
    expect((e as GuildError).status).toBe(400);
    expect(((e as GuildError).raw as { error: string }).error).toBe('wrong solution');
  });
});

describe('crédito UMA vez por recibo', () => {
  const c: FeiraCredit = { receipt: 'rec-xyz', emblems: 3, bits: 40, trophyId: null };
  it('o 2º com o mesmo recibo (reabrir, 409) não credita de novo', () => {
    const apply = vi.fn();
    expect(creditFeiraOnce(c, apply)).toBe(true);
    expect(creditFeiraOnce(c, apply)).toBe(false);
    expect(creditFeiraOnce({ ...c, receipt: 'rec-outro' }, apply)).toBe(true);
    expect(apply).toHaveBeenCalledTimes(2);
  });
  it('recibo vazio não credita; apply que lança não grava o recibo (tenta de novo)', () => {
    const apply = vi.fn();
    expect(creditFeiraOnce({ ...c, receipt: '' }, apply)).toBe(false);
    expect(apply).not.toHaveBeenCalled();
    expect(() => creditFeiraOnce({ ...c, receipt: 'r-boom' }, () => { throw new Error('x'); })).toThrow();
    expect(creditFeiraOnce({ ...c, receipt: 'r-boom' }, apply)).toBe(true);
  });
  it('a chave do "já mostrei" é por mistério, tipo e dia', () => {
    const e = sanitizeFeiraEvento(bossEv)!;
    expect(feiraShownKey(e, '2026-10-28')).toBe('0:boss:2026-10-28');
    expect(feiraShownKey(e, '2026-10-29')).not.toBe(feiraShownKey(e, '2026-10-28'));
  });
});
