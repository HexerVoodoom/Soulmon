/**
 * O cliente da Guilda: erro TIPADO por status (cada um com copy própria), o dia
 * do jogador enviado, e a vista higienizada (LV-G2: presença some com 5+).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./auth', () => ({ authHeaders: vi.fn(async () => ({ Authorization: 'Bearer t' })) }));
vi.mock('./cloudSave', () => ({ reagirContaExcluida: vi.fn(async () => {}) }));

import {
  getGuild, createGuild, joinGuild, guildCheckin, guildThread, guildGesture, leaveGuild, renameGuild, newGuildCode,
  sanitizeGuildView, GuildError, type GuildErrorKind,
} from './community';
import { reagirContaExcluida } from './cloudSave';
import { GUILD_ERROR_KEY, GUILD_COPY } from './guildCopy';
import { playerDayKey } from './playerDay';

const resp = (status: number, body: unknown) => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
const view = (over: Record<string, unknown> = {}) => ({
  id: 'g1', name: 'Roda', weekKey: '2026-W40', code: 'ABCD2345', isHost: false, size: 2, full: false,
  members: [
    { id: 'p1', pid: 'p1', name: 'Ana', euMesmo: true, apareceuHoje: true },
    { id: 'p2', pid: 'p2', name: 'Bia', euMesmo: false, apareceuHoje: false },
  ],
  presence: [{ pid: 'p1', cameToday: true }, { pid: 'p2', cameToday: false }],
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
      // `goalNotMet`/`invalidKind`/`dailyLimit` (fatia B1) nunca viram alerta: a folha recarrega em silêncio.
      if (!['invalidDay', 'notHost', 'server', 'deleted', 'goalNotMet', 'invalidKind', 'dailyLimit'].includes(kind)) {
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
    const v = sanitizeGuildView(view({ size: 5, members: membros, presence: [{ pid: 'p0', cameToday: true }], threadedToday: true }))!;
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

  it('lixo vira null ou vazio sem lançar', () => {
    expect(sanitizeGuildView(null)).toBeNull();
    expect(sanitizeGuildView('x')).toBeNull();
    expect(sanitizeGuildView({})!.members).toEqual([]);
  });
});
