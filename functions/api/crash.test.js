import { describe, it, expect, beforeEach } from 'vitest';
import {
  onRequest, scrub, scrubRoute, sanitizeReport, signatureOf,
  CRASH_PREFIX, CRASH_TTL_SECONDS, MAX_BODY_BYTES, MAX_MSG, MAX_STACK, MAX_SIGNATURES_PER_DAY,
} from './crash.js';
import { resetRateLimits } from './_rateLimit.js';
import { serverDay } from './metrics.js';

function fakeKV() {
  const store = new Map();
  const ttls = new Map();
  return {
    store, ttls,
    get: async (k, opts) => {
      const raw = store.get(k) ?? null;
      return raw !== null && opts?.type === 'json' ? JSON.parse(raw) : raw;
    },
    put: async (k, v, o) => { store.set(k, v); ttls.set(k, o?.expirationTtl); },
    list: async ({ prefix, limit }) => ({
      keys: [...store.keys()].filter(k => k.startsWith(prefix)).slice(0, limit).map(name => ({ name })),
    }),
  };
}

const valido = (over = {}) => ({
  v: 1, kind: 'error', msg: 'x is not a function', stack: 'TypeError: x\n    at foo (/assets/index-abc.js:1:2)',
  ver: '1.1.4', route: '/', plat: 'apk', ...over,
});
const post = (body, ip = '1.1.1.1') => new Request('https://s/api/crash', {
  method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body),
  headers: { 'CF-Connecting-IP': ip },
});

beforeEach(() => resetRateLimits());

describe('scrub: sem PII na mensagem e no stack', () => {
  it('tira e-mail, token, URL com query, ids longos e números longos', () => {
    const t = scrub('falhou para ana@x.com em https://soulmon.workers.dev/save?id=abc#h token eyJhbGciOi.eyJzdWIiOi.sig id 0123456789abcdef0123456789abcdef tel 11987654321', 500);
    expect(t).not.toContain('ana@x.com');
    expect(t).not.toContain('?id=');
    expect(t).not.toContain('#h');
    expect(t).not.toContain('eyJhbGciOi');
    expect(t).not.toContain('0123456789abcdef0123456789abcdef');
    expect(t).not.toContain('11987654321');
    expect(t).toContain('[email]');
    expect(t).toContain('/save');
  });
  it('trunca no teto', () => { expect(scrub('ab '.repeat(1000), MAX_MSG)).toHaveLength(MAX_MSG); });
  it('rota: sem query/hash e id vira :id', () => {
    expect(scrubRoute('/guild/0123456789ab/room?x=1#y')).toBe('/guild/:id/room');
    expect(scrubRoute('/u/42')).toBe('/u/:id');
  });
});

describe('sanitizeReport: allowlist', () => {
  it('aceita o relatório mínimo', () => { expect(sanitizeReport(valido())).toMatchObject({ kind: 'error', plat: 'apk' }); });
  it.each([
    ['campo extra (saveId)', { saveId: 'abc' }],
    ['campo extra (ua)', { ua: 'Mozilla' }],
    ['kind inválido', { kind: 'other' }],
    ['plat inválido', { plat: 'ios' }],
    ['versão com lixo', { ver: '1.0; DROP' }],
    ['msg vazia', { msg: '' }],
    ['v errado', { v: 2 }],
  ])('recusa %s', (_n, over) => { expect(sanitizeReport(valido(over))).toBeNull(); });
  it('trunca msg e stack gigantes', () => {
    const r = sanitizeReport(valido({ msg: 'm'.repeat(5000), stack: 's'.repeat(5000) }));
    expect(r.msg.length).toBeLessThanOrEqual(MAX_MSG);
    expect(r.stack.length).toBeLessThanOrEqual(MAX_STACK);
  });
});

describe('POST /api/crash', () => {
  it('grava com TTL de 14 dias, sob o prefixo crash:, e agrupa por assinatura', async () => {
    const kv = fakeKV();
    const env = { SOULMON_SAVES: kv };
    expect((await onRequest({ request: post(valido()), env })).status).toBe(200);
    expect((await onRequest({ request: post(valido({ ver: '1.1.5' })), env })).status).toBe(200);
    expect(kv.store.size).toBe(1);
    const [key, raw] = [...kv.store.entries()][0];
    expect(key.startsWith(`${CRASH_PREFIX}${serverDay()}:`)).toBe(true);
    expect(kv.ttls.get(key)).toBe(CRASH_TTL_SECONDS);
    const v = JSON.parse(raw);
    expect(v.n).toBe(2);
    expect(v.vers).toEqual(['1.1.4', '1.1.5']);
    // nada de identidade no que foi gravado
    expect(Object.keys(v).sort()).toEqual(['first', 'kind', 'last', 'msg', 'n', 'plat', 'route', 'stack', 'vers', 'ver'].sort());
    expect(raw).not.toMatch(/1\.1\.1\.1/);
  });

  it('o servidor limpa de novo: e-mail no msg nunca chega à KV', async () => {
    const kv = fakeKV();
    await onRequest({ request: post(valido({ msg: 'erro com a@b.com' })), env: { SOULMON_SAVES: kv } });
    expect([...kv.store.values()][0]).not.toContain('a@b.com');
  });

  it('rate limit por IP: a 11ª em um minuto leva 429 com Retry-After', async () => {
    const env = { SOULMON_SAVES: fakeKV() };
    let last;
    for (let i = 0; i < 11; i++) last = await onRequest({ request: post(valido({ msg: `m${i}` })), env });
    expect(last.status).toBe(429);
    expect(last.headers.get('Retry-After')).toBeTruthy();
  });

  it('teto diário de assinaturas novas: acima dele descarta, sem erro', async () => {
    const kv = fakeKV();
    for (let i = 0; i < MAX_SIGNATURES_PER_DAY; i++) kv.store.set(`${CRASH_PREFIX}${serverDay()}:${String(i).padStart(16, '0')}`, '{"n":1}');
    const r = await onRequest({ request: post(valido({ msg: 'nova' })), env: { SOULMON_SAVES: kv } });
    expect(r.status).toBe(200);
    expect(kv.store.size).toBe(MAX_SIGNATURES_PER_DAY);
  });

  it('400 em corpo grande, JSON inválido ou fora da allowlist; 503 sem KV; 405 em DELETE', async () => {
    const env = { SOULMON_SAVES: fakeKV() };
    expect((await onRequest({ request: post('x'.repeat(MAX_BODY_BYTES + 1)), env })).status).toBe(400);
    expect((await onRequest({ request: post('{nao json'), env })).status).toBe(400);
    expect((await onRequest({ request: post({ ...valido(), saveId: 'a' }), env })).status).toBe(400);
    expect((await onRequest({ request: post(valido()), env: {} })).status).toBe(503);
    expect((await onRequest({ request: new Request('https://s/api/crash', { method: 'DELETE' }), env })).status).toBe(405);
  });

  it('assinatura é estável e independe de versão/rota', async () => {
    const a = await signatureOf(sanitizeReport(valido()));
    const b = await signatureOf(sanitizeReport(valido({ ver: '9.9.9', route: '/x' })));
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(a).toBe(b);
  });
});

describe('GET /api/crash (leitura do dono)', () => {
  const get = (headers = {}, qs = '') => new Request(`https://s/api/crash${qs}`, { headers: { 'CF-Connecting-IP': '9.9.9.9', ...headers } });

  it('sem METRICS_ADMIN_KEY a rota não existe (404)', async () => {
    expect((await onRequest({ request: get(), env: { SOULMON_SAVES: fakeKV() } })).status).toBe(404);
  });
  it('chave errada: 401', async () => {
    const env = { SOULMON_SAVES: fakeKV(), METRICS_ADMIN_KEY: 'segredo' };
    expect((await onRequest({ request: get({ 'X-Metrics-Key': 'outro!!' }), env })).status).toBe(401);
  });
  it('lista as falhas do dia, as mais frequentes primeiro', async () => {
    const kv = fakeKV();
    const env = { SOULMON_SAVES: kv, METRICS_ADMIN_KEY: 'segredo' };
    await onRequest({ request: post(valido({ msg: 'raro' }), '2.2.2.2'), env });
    await onRequest({ request: post(valido({ msg: 'comum' }), '3.3.3.3'), env });
    await onRequest({ request: post(valido({ msg: 'comum' }), '3.3.3.3'), env });
    const r = await onRequest({ request: get({ 'X-Metrics-Key': 'segredo' }), env });
    const j = await r.json();
    expect(j.count).toBe(2);
    expect(j.crashes[0]).toMatchObject({ msg: 'comum', n: 2 });
  });
  it('janela inválida: 400', async () => {
    const env = { SOULMON_SAVES: fakeKV(), METRICS_ADMIN_KEY: 'segredo' };
    expect((await onRequest({ request: get({ 'X-Metrics-Key': 'segredo' }, '?from=2020-01-01&to=2026-01-01'), env })).status).toBe(400);
  });
});
