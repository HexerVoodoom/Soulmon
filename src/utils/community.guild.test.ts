/**
 * O cliente da Guilda: erro TIPADO por status (cada um com copy própria), o dia
 * do jogador enviado, e a vista higienizada (LV-G2: presença some com 5+).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./auth', () => ({ authHeaders: vi.fn(async () => ({ Authorization: 'Bearer t' })) }));
vi.mock('./cloudSave', () => ({ reagirContaExcluida: vi.fn(async () => {}) }));

import {
  getGuild, createGuild, joinGuild, guildCheckin, guildThread, guildGesture, leaveGuild, renameGuild, newGuildCode,
  hitGuildRaid, getGuildRewards, claimGuildReward, sanitizeGuildView, GuildError, type GuildErrorKind,
} from './community';
import { reagirContaExcluida } from './cloudSave';
import { GUILD_ERROR_KEY, GUILD_COPY } from './guildCopy';
import { playerDayKey } from './playerDay';

const resp = (status: number, body: unknown) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
const view = (over: Record<string, unknown> = {}) => ({
  id: 'g1', name: 'Roda', weekKey: '2026-W40', code: 'ABCD2345', isHost: false, size: 2, full: false,
  members: [
    { id: 'a1b2c3d4e5f6a701', memberId: 'a1b2c3d4e5f6a701', name: 'Ana', euMesmo: true, apareceuHoje: true },
    { id: 'a1b2c3d4e5f6a702', memberId: 'a1b2c3d4e5f6a702', name: 'Bia', euMesmo: false, apareceuHoje: false },
  ],
  presence: [{ memberId: 'a1b2c3d4e5f6a701', cameToday: true }, { memberId: 'a1b2c3d4e5f6a702', cameToday: false }],
  threadedToday: null, mine: { cameToday: true, threadToday: true, groveScenes: false, gesturesSent: [] }, progress: 3, target: 10,
  bosque: { stage: 'ramagem', stageIndex: 2, perto: true, tide: { key: 'T1', size: 'petala' }, ornaments: [] }, gestures: [],
  ...over,
});

const fetchMock = vi.fn();
beforeEach(() => { fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock); });
afterEach(() => vi.unstubAllGlobals());

async function erroDe(p: Promise<unknown>): Promise<GuildError> {
  try { await p; } catch (e) { return e as GuildError; }
  throw new Error('esperava falha');
}

describe('erros tipados', () => {
  const casos: Array<[number, unknown, GuildErrorKind]> = [
    [401, { error: 'unauthenticated' }, 'login'],
    [403, { error: 'forbidden' }, 'login'],
    [400, { error: 'invalid id' }, 'login'],
    [404, { error: 'invalid code' }, 'invalidCode'],
    [404, { error: 'no guild' }, 'noGuild'],
    [409, { error: 'already in a guild' }, 'alreadyIn'],
    [409, { error: 'guild full' }, 'full'],
    [409, { error: 'raid closed' }, 'raidClosed'],
    [409, { error: 'already claimed' }, 'alreadyClaimed'],
    [404, { error: 'nothing to claim' }, 'nothingToClaim'],
    [400, { error: 'invalid week' }, 'nothingToClaim'],
    [409, { error: 'join collision' }, 'collision'],
    [400, { error: 'invalid name' }, 'invalidName'],
    [400, { error: 'invalid day' }, 'invalidDay'],
    [400, { error: 'goal not met' }, 'goalNotMet'],
    [400, { error: 'invalid kind' }, 'invalidKind'],
    [429, { error: 'daily limit' }, 'dailyLimit'],
    [403, { error: 'not host' }, 'notHost'],
    [429, { error: 'rate limited' }, 'rateLimit'],
    [503, { error: 'try again' }, 'unavailable'],
    [500, { error: 'boom' }, 'server'],
    [418, { error: 'x' }, 'server'],
  ];
  it.each(casos)('HTTP %i %j → %s', async (status, body, kind) => {
    fetchMock.mockResolvedValue(resp(status, body));
    const e = await erroDe(joinGuild('save-12345', 'ABCD2345'));
    expect(e).toBeInstanceOf(GuildError);
    expect(e.kind).toBe(kind);
  });

  it('todo tipo de erro tem chave de copy PRÓPRIA existente (nada de frase genérica onde há texto)', () => {
    const chaves = new Set<string>();
    for (const [kind, key] of Object.entries(GUILD_ERROR_KEY)) {
      expect(GUILD_COPY[key]).toBeTruthy();
      // `goalNotMet`/`invalidKind`/`dailyLimit` (B1) e `raidClosed`/`alreadyClaimed`/`nothingToClaim` (B2, a Feira) nunca viram alerta: a folha recarrega ou fica em silêncio.
      if (!['invalidDay', 'notHost', 'server', 'deleted', 'goalNotMet', 'invalidKind', 'dailyLimit', 'raidClosed', 'alreadyClaimed', 'nothingToClaim'].includes(kind)) {
        expect(key).not.toBe('guild.erro.generico');
        chaves.add(key);
      }
    }
    // login, invalidCode, noGuild, alreadyIn, full, collision, invalidName, rateLimit, unavailable
    expect(chaves.size).toBe(9);
  });

  it('fetch que rejeita (offline) é `unavailable`, sem status', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const e = await erroDe(getGuild('save-12345'));
    expect(e.kind).toBe('unavailable');
    expect(e.status).toBe(0);
  });

  it('200 com HTML (portal cativo) é falha, não "sem roda"', async () => {
    fetchMock.mockResolvedValue(resp(200, '<html>login do wifi</html>'));
    const e = await erroDe(getGuild('save-12345'));
    expect(e.kind).toBe('server');
  });

  it('502 ilegível é `unavailable`', async () => {
    fetchMock.mockResolvedValue(resp(502, 'Bad gateway'));
    expect((await erroDe(getGuild('save-12345'))).kind).toBe('unavailable');
  });

  it('409 already in a guild COM a vista devolve a roda no erro', async () => {
    fetchMock.mockResolvedValue(resp(409, { error: 'already in a guild', guild: view({ name: 'A que já tenho' }) }));
    const e = await erroDe(createGuild('save-12345', 'Nova'));
    expect(e.kind).toBe('alreadyIn');
    expect(e.guild?.name).toBe('A que já tenho');
  });

  it('410 dispara o portão da conta excluída e lança `deleted`', async () => {
    fetchMock.mockResolvedValue(resp(410, { error: 'account-deleted', deletedAt: 123 }));
    const e = await erroDe(getGuild('save-12345'));
    expect(e.kind).toBe('deleted');
    expect(reagirContaExcluida).toHaveBeenCalledWith({ excluidaEm: 123 });
  });
});

describe('o dia do jogador vai para o servidor', () => {
  it('GET leva dayKey na query, e POST no corpo — com a âncora do save', async () => {
    const tz = { tz: 'America/Sao_Paulo', offsetMs: -3 * 3600_000 } as never;
    const esperado = playerDayKey(new Date(), tz);
    fetchMock.mockImplementation(async () => resp(200, { guild: null, ok: true }));
    await getGuild('save-12345', tz);
    expect(new URL(fetchMock.mock.calls[0][0], 'http://x').searchParams.get('dayKey')).toBe(esperado);
    for (const [fn, args] of [
      [createGuild, ['save-12345', 'N', tz]], [joinGuild, ['save-12345', 'ABCD2345', tz]],
      [guildCheckin, ['save-12345', tz]], [renameGuild, ['save-12345', 'N', tz]], [newGuildCode, ['save-12345', tz]],
    ] as const) {
      fetchMock.mockClear();
      await (fn as (...a: unknown[]) => Promise<unknown>)(...args);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toMatch(/^\/api\/guild\?action=guild/);
      expect(JSON.parse(init.body).dayKey).toBe(esperado);
    }
  });

  it('o FIO e os GESTOS levam o dia do jogador, o tipo e (o fio) a meta em peso de esforço', async () => {
    const tz = { tz: 'America/Sao_Paulo', offsetMs: -3 * 3600_000 } as never;
    const esperado = playerDayKey(new Date(), tz);
    fetchMock.mockImplementation(async () => resp(200, { guild: view() }));
    await guildThread('save-12345', { done: 2, heart: 2, full: 4 }, tz);
    let [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/guild?action=guildThread');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ id: 'save-12345', dayKey: esperado, kind: 'fio', goal: { done: 2, heart: 2, full: 4 } });
    fetchMock.mockClear();
    await guildThread('save-12345', undefined, tz);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ id: 'save-12345', dayKey: esperado, kind: 'fio' });
    fetchMock.mockClear();
    await guildGesture('save-12345', 'luz', tz);
    [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/guild?action=guildGesture');
    expect(JSON.parse(init.body)).toEqual({ id: 'save-12345', dayKey: esperado, kind: 'luz' });
  });

  it('sair não manda dia (idempotente) e responde ok', async () => {
    fetchMock.mockResolvedValue(resp(200, { ok: true }));
    await expect(leaveGuild('save-12345')).resolves.toEqual({ ok: true });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ id: 'save-12345' });
  });
});

describe('sanitizeGuildView — a vista é dado não confiável', () => {
  it('descarta progress/target (a barra da semana não existe)', () => {
    const v = sanitizeGuildView(view()) as unknown as Record<string, unknown>;
    expect('progress' in v).toBe(false);
    expect('target' in v).toBe(false);
  });

  it('com 5+ membros corta a presença por pessoa mesmo que o servidor a mande', () => {
    const membros = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, name: `N${i}`, euMesmo: i === 0, apareceuHoje: i < 2 }));
    const v = sanitizeGuildView(view({ size: 5, members: membros, presence: [{ memberId: 'a1b2c3d4e5f6a700', cameToday: true }], threadedToday: true }))!;
    expect(v.members.every(m => !('apareceuHoje' in m))).toBe(true);
    expect(v.threadedToday).toBe(true);
  });

  it('presença: null do servidor apaga a presença nominal', () => {
    const v = sanitizeGuildView(view({ presence: null }))!;
    expect(v.members.every(m => !('apareceuHoje' in m))).toBe(true);
  });

  it('threadedToday só passa como `true` com 5+; número vira null', () => {
    expect(sanitizeGuildView(view({ threadedToday: true }))!.threadedToday).toBeNull(); // ≤4 nunca tem agregado
    const cinco = Array.from({ length: 5 }, (_, i) => ({ id: `p${i}`, name: 'x', euMesmo: false }));
    expect(sanitizeGuildView(view({ size: 5, members: cinco, threadedToday: 3 }))!.threadedToday).toBeNull();
    expect(sanitizeGuildView(view({ size: 5, members: cinco, threadedToday: true }))!.threadedToday).toBe(true);
  });

  it('mantém a ORDEM de chegada e não vaza campo extra (saveId, stage, hp)', () => {
    const v = sanitizeGuildView(view({ members: [
      { id: 'b', name: 'Bia', euMesmo: false, apareceuHoje: false, saveId: 'segredo', stage: 'mega', hp: 3 },
      { id: 'a', name: 'Ana', euMesmo: true, apareceuHoje: true },
    ] }))!;
    expect(v.members.map(m => m.name)).toEqual(['Bia', 'Ana']);
    expect(JSON.stringify(v)).not.toMatch(/segredo|mega|"hp"/);
  });

  it('o Bosque chega estreito: estágio pelo ÍNDICE, `perto` binário e só quando há próximo', () => {
    const v = sanitizeGuildView(view())!;
    expect(v.bosque).toEqual({ stage: 'ramagem', stageIndex: 2, perto: true, ornaments: [] });
    expect(sanitizeGuildView(view({ bosque: { stageIndex: 5, stage: 'bosque-antigo', perto: true } }))!.bosque.perto).toBe(false);
    expect(sanitizeGuildView(view({ bosque: { stageIndex: 0, stage: null, perto: 'sim' } }))!.bosque).toEqual({ stage: null, stageIndex: 0, perto: false, ornaments: [] });
    expect(sanitizeGuildView(view({ bosque: undefined }))!.bosque.stageIndex).toBe(0);
  });

  it('o Bosque não tem onde carregar progresso cru, razão nem "faltam N" — o que o servidor mandar a mais é descartado', () => {
    const v = sanitizeGuildView(view({ bosque: { stageIndex: 2, perto: true, progress: 41.5, faltam: 3, ratio: 0.4, tide: { key: 'T1', size: 'corola', bloom: 7 } } }))!;
    expect(JSON.stringify(v.bosque)).not.toMatch(/41|faltam|ratio|bloom|tide/);
    expect(Object.keys(v.bosque).sort()).toEqual(['ornaments', 'perto', 'stage', 'stageIndex']);
  });

  it('`mine` e `gestures` só carregam os tipos conhecidos; peça de maré exige tamanho e dia válidos', () => {
    const v = sanitizeGuildView(view({
      mine: { cameToday: true, threadToday: 'x', groveScenes: 1, gesturesSent: ['luz', 'soco', 'luz'] },
      gestures: ['descanso', 'grito', 'aceno'],
      bosque: { stageIndex: 1, ornaments: [{ tide: 'T1', size: 'petala', day: '2026-08-10' }, { tide: 'T2', size: 'gigante', day: '2026-08-17' }, { size: 'corola' }, null] },
    }))!;
    expect(v.mine).toEqual({ cameToday: true, threadToday: false, groveScenes: false, gesturesSent: ['luz'] });
    expect(v.gestures).toEqual(['aceno', 'descanso']); // na ordem da tela, sem duplicar
    expect(v.bosque.ornaments).toEqual([{ tide: 'T1', size: 'petala', day: '2026-08-10' }]);
  });

  it('contrato do loop 2: `progress` null (5+), `presence` por memberId e nenhum `pid` — nada disso chega à UI', () => {
    const v = sanitizeGuildView(view({ progress: null, target: null, members: [{ id: 'a1b2c3d4e5f6a701', memberId: 'a1b2c3d4e5f6a701', name: 'Ana', euMesmo: true }] }))!;
    expect(v.members).toEqual([{ id: 'a1b2c3d4e5f6a701', name: 'Ana', euMesmo: true, apareceuHoje: false }]);
    expect(JSON.stringify(v)).not.toMatch(/pid|memberId|progress|target|presence/);
  });

  it('`gestureReceived` é booleano: só `true` passa (roda de 2 manda o fato, não o tipo — B5)', () => {
    expect(sanitizeGuildView(view({ gestures: [], gestureReceived: true }))!.gestureReceived).toBe(true);
    expect(sanitizeGuildView(view({ gestureReceived: 3 }))!.gestureReceived).toBe(false);
    expect(sanitizeGuildView(view({ gestureReceived: null }))!.gestureReceived).toBe(false);
    expect(sanitizeGuildView(view())!.gestureReceived).toBe(false);
  });

  it('lixo vira null ou vazio sem lançar', () => {
    expect(sanitizeGuildView(null)).toBeNull();
    expect(sanitizeGuildView('x')).toBeNull();
    expect(sanitizeGuildView({})!.members).toEqual([]);
  });
});

// ── A Feira (B2): a vista traz o tipo e os três estados, NUNCA um número ────
describe('a Feira na vista (sanitizeGuildView)', () => {
  const raid = (over: Record<string, unknown> = {}) => ({ weekKey: '2026-W40', phenomenon: 'mare', state: 'aberta', ferido: true, lastWeek: 'recuou', mine: { hitToday: true }, ...over });

  it('lê tipo, estado, `ferido`, `lastWeek` e `hitToday` — e mais nada', () => {
    const r = sanitizeGuildView(view({ raid: raid({ hp: 540, dmg: 300, hitters: 7, hpBand: 4 }) }))!.raid!;
    expect(r).toEqual({ weekKey: '2026-W40', phenomenon: 'mare', state: 'aberta', ferido: true, lastWeek: 'recuou', hitToday: true });
    expect(Object.keys(r).sort()).toEqual(['ferido', 'hitToday', 'lastWeek', 'phenomenon', 'state', 'weekKey']);
  });

  it('dissipada nunca é "ferida"; `ferido` só passa como `true`', () => {
    expect(sanitizeGuildView(view({ raid: raid({ state: 'dissipada', ferido: true }) }))!.raid!.ferido).toBe(false);
    expect(sanitizeGuildView(view({ raid: raid({ ferido: 1 }) }))!.raid!.ferido).toBe(false);
    expect(sanitizeGuildView(view({ raid: raid({ state: 'recuou' }) }))!.raid!.state).toBe('aberta');
  });

  it('tipo fora da lista fechada, `lastWeek` inventado e ausência de Feira: sem Feira / sem desfecho', () => {
    expect(sanitizeGuildView(view({ raid: raid({ phenomenon: 'boss' }) }))!.raid).toBeNull();
    expect(sanitizeGuildView(view({ raid: raid({ lastWeek: 'venceu' }) }))!.raid!.lastWeek).toBeNull();
    expect(sanitizeGuildView(view())!.raid).toBeNull();
    expect(sanitizeGuildView(view({ raid: 'x' }))!.raid).toBeNull();
    expect(sanitizeGuildView(view({ raid: raid({ mine: undefined }) }))!.raid!.hitToday).toBe(false);
  });
});

describe('a rodada, o direito e o resgate (chamadas)', () => {
  const dia = () => playerDayKey(new Date(), undefined);

  it('hitGuildRaid: POST guildRaidHit com id e o dia do jogador; devolve a vista, sem número de dano', async () => {
    fetchMock.mockResolvedValue(resp(200, { landed: true, guild: view({ raid: { weekKey: '2026-W40', phenomenon: 'nevoa', state: 'aberta', ferido: false, mine: { hitToday: true } } }) }));
    const v = await hitGuildRaid('save-12345');
    expect(v!.raid!.hitToday).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain('action=guildRaidHit');
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ id: 'save-12345', dayKey: dia() });
  });

  it.each([
    [429, { error: 'daily limit' }, 'dailyLimit'],
    [409, { error: 'raid closed' }, 'raidClosed'],
    [404, { error: 'no guild' }, 'noGuild'],
    [400, { error: 'invalid day' }, 'invalidDay'],
  ] as const)('golpe: HTTP %i %j → %s', async (status, body, kind) => {
    fetchMock.mockResolvedValue(resp(status, body));
    expect((await erroDe(hitGuildRaid('save-12345'))).kind).toBe(kind);
  });

  it('getGuildRewards: GET com id e dia; higieniza (semana, desfecho, quantia e cenário só do Bosque)', async () => {
    fetchMock.mockResolvedValue(resp(200, { rewards: {
      pending: [{ week: '2026-W39', outcome: 'dissipada', emblems: 4, hp: 999 }, { week: 'x', outcome: 'venceu', emblems: 4 }, { outcome: 'recuou' }],
      scenes: ['bg-guild-clareira', 'bg-mission-abyss', 42], trophyOwned: true, trophyId: 'trophy-concha-mare',
    } }));
    const r = await getGuildRewards('save-12345');
    expect(r).toEqual({ pending: [{ week: '2026-W39', outcome: 'dissipada', emblems: 4 }], scenes: ['bg-guild-clareira'], trophyOwned: true, trophyId: 'trophy-concha-mare' });
    expect(fetchMock.mock.calls[0][0]).toContain('action=guildRewards');
    expect(fetchMock.mock.calls[0][0]).toContain('id=save-12345');
  });

  it('claimGuildReward: POST com a semana; devolve o recibo; 200 sem recibo ou de outra semana é FALHA (nunca credita)', async () => {
    fetchMock.mockResolvedValue(resp(200, { claimed: { week: '2026-W39', outcome: 'dissipada', emblems: 4, trophy: true, trophyId: 'trophy-concha-mare', receipt: 'abc123' } }));
    const c = await claimGuildReward('save-12345', '2026-W39');
    expect(c).toEqual({ week: '2026-W39', outcome: 'dissipada', emblems: 4, trophy: true, trophyId: 'trophy-concha-mare', receipt: 'abc123' });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ id: 'save-12345', dayKey: dia(), week: '2026-W39' });
    fetchMock.mockResolvedValue(resp(200, { claimed: { week: '2026-W39', outcome: 'dissipada', emblems: 4 } }));
    expect((await erroDe(claimGuildReward('save-12345', '2026-W39'))).kind).toBe('server');
    fetchMock.mockResolvedValue(resp(200, { claimed: { week: '2026-W38', outcome: 'dissipada', emblems: 4, receipt: 'z' } }));
    expect((await erroDe(claimGuildReward('save-12345', '2026-W39'))).kind).toBe('server');
  });

  it.each([
    [409, { error: 'already claimed', receipt: 'abc' }, 'alreadyClaimed'],
    [404, { error: 'nothing to claim' }, 'nothingToClaim'],
    [400, { error: 'invalid week' }, 'nothingToClaim'],
  ] as const)('resgate: HTTP %i %j → %s', async (status, body, kind) => {
    fetchMock.mockResolvedValue(resp(status, body));
    expect((await erroDe(claimGuildReward('save-12345', '2026-W39'))).kind).toBe(kind);
  });

  it('a quantia nunca passa de um teto sensato (dado não confiável) nem vira negativa', async () => {
    fetchMock.mockResolvedValue(resp(200, { claimed: { week: 'w', outcome: 'dissipada', emblems: 9_999_999, receipt: 'r' } }));
    expect((await claimGuildReward('save-12345', 'w')).emblems).toBe(20);
    fetchMock.mockResolvedValue(resp(200, { claimed: { week: 'w', outcome: 'dissipada', emblems: -5, receipt: 'r' } }));
    expect((await claimGuildReward('save-12345', 'w')).emblems).toBe(0);
  });
});

describe('rodada L3: o contrato novo do servidor (marcas só existem quando `true`; 409 traz o resgate)', () => {
  it('409 already claimed devolve o `claimed` HIGIENIZADO em `error.claim` (a resposta do 200 se perdeu — A1)', async () => {
    fetchMock.mockResolvedValue(resp(409, {
      error: 'already claimed', receipt: 'rc-9',
      claimed: { week: '2026-W39', outcome: 'dissipada', emblems: 9_999, trophy: true, trophyId: 'trophy-concha-mare', receipt: 'rc-9' },
    }));
    const e = await erroDe(claimGuildReward('save-12345', '2026-W39'));
    expect(e.kind).toBe('alreadyClaimed');
    expect(e.claim).toEqual({ week: '2026-W39', outcome: 'dissipada', emblems: 20, trophy: true, trophyId: 'trophy-concha-mare', receipt: 'rc-9' });
  });

  it('409 com `claimed: null` (o registro sumiu entre as duas leituras) ou sem recibo: `claim` nulo — nada a creditar', async () => {
    fetchMock.mockResolvedValue(resp(409, { error: 'already claimed', receipt: 'rc-9', claimed: null }));
    expect((await erroDe(claimGuildReward('save-12345', 'w'))).claim).toBeNull();
    fetchMock.mockResolvedValue(resp(409, { error: 'already claimed', claimed: { week: 'w', outcome: 'dissipada', emblems: 4 } }));
    expect((await erroDe(claimGuildReward('save-12345', 'w'))).claim).toBeNull();
  });

  it('só o 409 de resgate carrega `claim`: outros erros (e o 409 de guilda cheia) não', async () => {
    fetchMock.mockResolvedValue(resp(409, { error: 'guild full', claimed: { week: 'w', outcome: 'dissipada', emblems: 4, receipt: 'r' } }));
    const e = await erroDe(joinGuild('save-12345', 'ABCD2345'));
    expect(e.kind).toBe('full');
    expect(e.claim).toBeUndefined();
  });

  it('vista do servidor SEM as marcas falsas: ausente = false, e nada de `progress`/`target` no tipo higienizado', () => {
    const v = sanitizeGuildView({
      id: 'g1', name: 'Roda', weekKey: '2026-W40', code: 'ABCD2345', isHost: true, size: 3, full: false,
      members: [{ id: 'a1', name: 'Ana', euMesmo: true, apareceuHoje: true }, { id: 'a2', name: 'Bia', euMesmo: false }, { id: 'a3', name: 'Caio', euMesmo: false }],
      presence: [{ memberId: 'a1', cameToday: true }, { memberId: 'a2' }, { memberId: 'a3' }],
      mine: {}, bosque: { stage: 'copa', stageIndex: 3, perto: false, ornaments: [] }, gestures: [],
      raid: { weekKey: '2026-W40', phenomenon: 'nevoa', state: 'aberta', ferido: false, lastWeek: null, mine: {} },
    })!;
    expect(v.members.map(m => m.apareceuHoje)).toEqual([true, false, false]);
    expect(v.mine).toEqual({ cameToday: false, threadToday: false, groveScenes: false, gesturesSent: [] });
    expect(v.raid?.hitToday).toBe(false);
    expect(Object.keys(v)).not.toContain('progress');
    expect(Object.keys(v)).not.toContain('target');
    // `raid.mine` ausente também não derruba
    expect(sanitizeGuildView({ ...view(), raid: { phenomenon: 'mare', state: 'aberta' } })!.raid?.hitToday).toBe(false);
  });

  it('`progress`/`target` que um servidor antigo ainda mande são DESCARTADOS (nunca chegam à UI)', () => {
    const v = sanitizeGuildView(view({ progress: 3, target: 10 })) as unknown as Record<string, unknown>;
    expect(v.progress).toBeUndefined();
    expect(v.target).toBeUndefined();
  });
});
