/**
 * O cliente da Guilda: erro TIPADO por status (cada um com copy própria), o dia
 * do jogador enviado, e a vista higienizada (LV-G2: presença some com 5+).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('./auth', () => ({ authHeaders: vi.fn(async () => ({ Authorization: 'Bearer t' })) }));
vi.mock('./cloudSave', () => ({ reagirContaExcluida: vi.fn(async () => {}) }));

import {
  getGuild, createGuild, joinGuild, guildCheckin, leaveGuild, renameGuild, newGuildCode,
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
  threadedToday: null, mine: { cameToday: true }, progress: 3, target: 10,
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
      if (!['invalidDay', 'notHost', 'server', 'deleted'].includes(kind)) {
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

  it('lixo vira null ou vazio sem lançar', () => {
    expect(sanitizeGuildView(null)).toBeNull();
    expect(sanitizeGuildView('x')).toBeNull();
    expect(sanitizeGuildView({})!.members).toEqual([]);
  });
});
