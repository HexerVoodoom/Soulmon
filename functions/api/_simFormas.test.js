import { describe, it, expect, vi, afterEach } from 'vitest';
import { enfileirarForma, passoFormas, chaveDoPrompt, chaveDaFila, chaveDaForma, FORMAS_DIA_MAX, FORMA_TENTATIVAS_MAX } from './_simFormas.js';
import { SIMULADOS } from './_simulados.data.js';
import { spriteVivoDoSimulado } from './_simulados.js';

function fakeKV() {
  const s = new Map(); const k = { s, ops: 0,
    get: async (x) => { k.ops++; return s.has(x) ? s.get(x).v : null; },
    getWithMetadata: async (x) => { k.ops++; return { value: s.get(x)?.v ?? null, metadata: s.get(x)?.m ?? null }; },
    put: async (x, v, o) => { k.ops++; s.set(x, { v, m: o?.metadata }); },
    delete: async (x) => { k.ops++; s.delete(x); },
    list: async ({ prefix, limit }) => { k.ops++; return { keys: [...s.keys()].filter((n) => n.startsWith(prefix)).sort().slice(0, limit).map((name) => ({ name })), list_complete: true }; } };
  return k;
}
const ligado = (extra = {}) => ({ SOULMON_SAVES: fakeKV(), SIMULADOS_FORMAS_ON: '1', HF_CREDENTIALS: 'a:b', ...extra });
const P = SIMULADOS[0]; const FORMA = 'champion-power';
const NOW = new Date('2026-11-20T10:00:00Z');
const comPrompt = (env, prompt = 'oraculo #00FF00', fallback = 'reserva #00FF00') => { env.SOULMON_SAVES.s.set(chaveDoPrompt(P.id, FORMA), { v: JSON.stringify({ prompt, fallback }) }); return env; };
const corpoDoEnvio = (f) => JSON.parse(f.mock.calls[0][1].body);
afterEach(() => vi.unstubAllGlobals());

describe('formas sob demanda: desligado por padrão', () => {
  it('sem SIMULADOS_FORMAS_ON: nenhuma operação de KV nem fetch', async () => {
    const f = vi.fn(); vi.stubGlobal('fetch', f);
    const env = { SOULMON_SAVES: fakeKV(), HF_CREDENTIALS: 'a:b' };
    expect(await enfileirarForma(env, P.id, FORMA)).toBe(false);
    expect(await passoFormas(env)).toEqual({ status: 'off' });
    expect(env.SOULMON_SAVES.ops).toBe(0); expect(f).not.toHaveBeenCalled();
  });
  it('SPRITE_DISABLED também para', async () => {
    const env = ligado({ SPRITE_DISABLED: '1' });
    expect(await enfileirarForma(env, P.id, FORMA)).toBe(false);
    expect(env.SOULMON_SAVES.ops).toBe(0);
  });
});

describe('fila', () => {
  it('só id de simulado e forma válida; não repete se já tem arte ou fila', async () => {
    const env = ligado();
    expect(await enfileirarForma(env, 'player-x', FORMA)).toBe(false);
    expect(await enfileirarForma(env, P.id, 'champion-x')).toBe(false);
    expect(await enfileirarForma(env, P.id, FORMA)).toBe(true);
    expect(await enfileirarForma(env, P.id, FORMA)).toBe(false);
    env.SOULMON_SAVES.s.set(chaveDaForma(P.id, 'mega-power'), { v: '/x' });
    expect(await enfileirarForma(env, P.id, 'mega-power')).toBe(false);
  });
  it('antigo acima do teto Champion não entra na fila', async () => {
    const env = ligado();
    expect(await enfileirarForma(env, 'sim_0006', 'champion-harmony')).toBe(false);
  });
  it('sem prompt do Oráculo gravado: não gasta orçamento nem chama o provedor', async () => {
    const env = ligado(); const f = vi.fn(); vi.stubGlobal('fetch', f);
    await enfileirarForma(env, P.id, FORMA);
    await passoFormas(env, { now: NOW });
    expect(f).not.toHaveBeenCalled();
    expect(env.SOULMON_SAVES.s.has('sim:gen:2026-11-20')).toBe(false);
    expect(JSON.parse(env.SOULMON_SAVES.s.get(chaveDaFila(P.id, FORMA)).v)).toMatchObject({ estado: 'falhou', motivo: 'sem-prompt' });
  });
  it('envia exatamente o prompt gravado e guarda o chroma pedido por ele', async () => {
    const env = comPrompt(ligado(), 'criatura verde #FF00FF');
    const f = vi.fn(async () => Response.json({ request_id: 'abc-1' })); vi.stubGlobal('fetch', f);
    await enfileirarForma(env, P.id, FORMA);
    await passoFormas(env, { now: NOW });
    expect(corpoDoEnvio(f).prompt).toBe('criatura verde #FF00FF');
    expect(JSON.parse(env.SOULMON_SAVES.s.get(chaveDaFila(P.id, FORMA)).v).chroma).toBe('magenta');
  });
  it('recusa do provedor: a tentativa seguinte usa o fallback', async () => {
    const env = comPrompt(ligado());
    await enfileirarForma(env, P.id, FORMA);
    env.SOULMON_SAVES.s.set(chaveDaFila(P.id, FORMA), { v: JSON.stringify({ estado: 'enviado', requestId: 'r1', em: NOW.getTime() }) });
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ status: 'nsfw' })));
    await passoFormas(env, { now: NOW });
    const f = vi.fn(async () => Response.json({ request_id: 'r2' })); vi.stubGlobal('fetch', f);
    await passoFormas(env, { now: NOW });
    expect(corpoDoEnvio(f).prompt).toBe('reserva #00FF00');
  });
  it('teto diário: não envia além do limite', async () => {
    const env = comPrompt(ligado()); const f = vi.fn(); vi.stubGlobal('fetch', f);
    await enfileirarForma(env, P.id, FORMA);
    env.SOULMON_SAVES.s.set('sim:gen:2026-11-20', { v: String(FORMAS_DIA_MAX) });
    expect(await passoFormas(env, { now: NOW })).toEqual({ status: 'teto' });
    expect(f).not.toHaveBeenCalled();
  });
  it('falha repetida vira `falhou` e para de gastar; o ponteiro continua o anterior', async () => {
    const env = comPrompt(ligado()); const f = vi.fn(async () => new Response('x', { status: 500 })); vi.stubGlobal('fetch', f);
    env.SOULMON_SAVES.s.set(`sim:sprite:${P.id}`, { v: '/api/sprite-image?k=' + 'a'.repeat(32) });
    await enfileirarForma(env, P.id, FORMA);
    for (let i = 0; i < FORMA_TENTATIVAS_MAX + 2; i++) await passoFormas(env, { now: NOW });
    expect(f).toHaveBeenCalledTimes(FORMA_TENTATIVAS_MAX);
    expect(JSON.parse(env.SOULMON_SAVES.s.get(chaveDaFila(P.id, FORMA)).v).estado).toBe('falhou');
    expect(await spriteVivoDoSimulado(env, P.id)).toBe('/api/sprite-image?k=' + 'a'.repeat(32));
  });
  it('envia e guarda o requestId; a credencial só vai para o provedor', async () => {
    const env = comPrompt(ligado()); const urls = [];
    vi.stubGlobal('fetch', vi.fn(async (u) => { urls.push(String(u)); return Response.json({ request_id: 'abc-1' }); }));
    await enfileirarForma(env, P.id, FORMA);
    await passoFormas(env, { now: NOW });
    expect(JSON.parse(env.SOULMON_SAVES.s.get(chaveDaFila(P.id, FORMA)).v)).toMatchObject({ estado: 'enviado', requestId: 'abc-1' });
    expect(urls.every((u) => u.startsWith('https://api.higgsfield.ai/'))).toBe(true);
  });
});
