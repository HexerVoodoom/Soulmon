import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  onRequest, resetFeedbackMemory, sanitizeFeedback, cleanMessage, emailSubject, emailText,
  MAX_MESSAGE, FEEDBACK_PREFIX, FEEDBACK_TTL_SECONDS, MAX_WRITES_PER_DAY, MAX_EMAILS_PER_DAY, MAX_BODY_BYTES, rateKey,
} from './feedback.js';
import { resetRateLimits } from './_rateLimit.js';

function fakeKV() {
  const store = new Map();
  const ttls = new Map();
  const kvo = {
    store, ttls, puts: 0,
    get: async (k, o) => { const r = store.get(k) ?? null; return r !== null && o?.type === 'json' ? JSON.parse(r) : r; },
    put: async (k, v, o) => { kvo.puts++; store.set(k, v); ttls.set(k, o?.expirationTtl); },
    list: async ({ prefix, limit }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).slice(0, limit).map(name => ({ name })) }),
  };
  return kvo;
}
const envCom = (extra = {}) => ({ SOULMON_SAVES: fakeKV(), ...extra });
const valido = (over = {}) => ({ type: 'bug', message: 'Travou ao abrir a loja', ver: '1.3.0-beta3', build: 'dev', plat: 'web', lang: 'pt-BR', ...over });
const post = (body, ip = '1.1.1.1') => new Request('https://s/api/feedback', {
  method: 'POST', body: typeof body === 'string' ? body : JSON.stringify(body), headers: { 'CF-Connecting-IP': ip },
});
const call = (req, env, f) => onRequest({ request: req, env }, f);

beforeEach(() => { resetRateLimits(); resetFeedbackMemory(); });

describe('validação', () => {
  it('aceita o corpo válido e devolve só a allowlist', () => {
    expect(sanitizeFeedback(valido())).toEqual(valido());
  });
  it('tipo fora da lista fechada', () => {
    for (const type of ['', 'spam', 'BUG', undefined, 1]) expect(sanitizeFeedback(valido({ type })).error).toBe('invalid-type');
  });
  it('mensagem: 1 a 2000 caracteres, só espaço não conta', () => {
    expect(sanitizeFeedback(valido({ message: '   \n ' })).error).toBe('invalid-message');
    expect(sanitizeFeedback(valido({ message: 5 })).error).toBe('invalid-message');
    expect(sanitizeFeedback(valido({ message: 'a' })).message).toBe('a');
    expect(sanitizeFeedback(valido({ message: 'a'.repeat(MAX_MESSAGE) })).message).toHaveLength(MAX_MESSAGE);
    expect(sanitizeFeedback(valido({ message: 'a'.repeat(MAX_MESSAGE + 1) })).error).toBe('message-too-long');
  });
  it('campo desconhecido (identidade, e-mail, saveId) derruba o corpo', () => {
    expect(sanitizeFeedback(valido({ saveId: 'abc' })).error).toBe('invalid-body');
    expect(sanitizeFeedback(valido({ email: 'a@b.c' })).error).toBe('invalid-body');
    expect(sanitizeFeedback([]).error).toBe('invalid-body');
  });
  it('versão/build/plataforma/idioma fora do formato', () => {
    expect(sanitizeFeedback(valido({ ver: '1.0\nBcc: x@y' })).error).toBe('invalid-body');
    expect(sanitizeFeedback(valido({ plat: 'ios' })).error).toBe('invalid-body');
    expect(sanitizeFeedback(valido({ lang: 'fr' })).error).toBe('invalid-body');
  });
  it('limpa caracteres de controle e de direção, mantém quebra de linha', () => {
    expect(cleanMessage('a\u0000b‮c\r\nd')).toBe('abc\nd');
  });
});

describe('e-mail em texto puro, sem injeção', () => {
  it('assunto numa linha; HTML da mensagem vai literal no corpo texto', () => {
    const r = sanitizeFeedback(valido({ message: '<script>alert(1)</script>\nBcc: x@y.z' }));
    expect(emailSubject(r)).not.toMatch(/[\r\n]/);
    expect(emailText(r, 't')).toContain('<script>alert(1)</script>');
  });
  it('envia só texto (campo text, sem html) ao destino padrão, sem identidade', async () => {
    const f = vi.fn(async () => new Response('{}', { status: 200 }));
    const env = envCom({ RESEND_API_KEY: 'k' });
    const res = await call(post(valido({ message: '<b>oi</b>' })), env, f);
    expect((await res.json()).delivered).toBe('email');
    const [url, init] = f.mock.calls[0];
    expect(url).toBe('https://api.resend.com/emails');
    const sent = JSON.parse(init.body);
    expect(sent.to).toEqual(['soulmon.revisor@gmail.com']);
    expect(sent.html).toBeUndefined();
    expect(sent.text).toContain('Versão: 1.3.0-beta3');
    expect(JSON.stringify(sent)).not.toMatch(/1\.1\.1\.1/);
  });
});

describe('entrega e fallback', () => {
  it('grava na KV com TTL ANTES do e-mail com UM put só', async () => {
    const env = envCom({ RESEND_API_KEY: 'k' });
    await call(post(valido()), env, async () => new Response('{}', { status: 200 }));
    expect(env.SOULMON_SAVES.store.size).toBe(1);
    expect(env.SOULMON_SAVES.puts).toBe(1);
    const [k] = [...env.SOULMON_SAVES.store.keys()];
    expect(k.startsWith(FEEDBACK_PREFIX)).toBe(true);
    expect(env.SOULMON_SAVES.ttls.get(k)).toBe(FEEDBACK_TTL_SECONDS);
    expect(JSON.parse(env.SOULMON_SAVES.store.get(k))).toMatchObject({ type: 'bug' });
  });
  it('sem RESEND_API_KEY: guarda e responde ok/stored', async () => {
    const env = envCom();
    const res = await call(post(valido()), env);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, delivered: 'stored' });
    expect(env.SOULMON_SAVES.puts).toBe(1);
  });
  it('e-mail falha: mensagem continua guardada e a resposta é ok', async () => {
    const env = envCom({ RESEND_API_KEY: 'k' });
    const res = await call(post(valido()), env, async () => { throw new Error('rede'); });
    expect((await res.json()).delivered).toBe('stored');
    expect(env.SOULMON_SAVES.store.size).toBe(1);
  });
  it('KV indisponível: 503 (o cliente mantém o texto)', async () => {
    expect((await call(post(valido()), {})).status).toBe(503);
  });
  it('kill-switch FEEDBACK_DISABLED', async () => {
    expect((await call(post(valido()), envCom({ FEEDBACK_DISABLED: '1' }))).status).toBe(503);
  });
  it('corpo inválido: 400, nada gravado', async () => {
    const env = envCom();
    expect((await call(post('{nao json'), env)).status).toBe(400);
    expect((await call(post(valido({ type: 'x' })), env)).status).toBe(400);
    expect(env.SOULMON_SAVES.store.size).toBe(0);
  });
});

describe('limite de taxa', () => {
  it('6ª mensagem do mesmo IP em 10 min = 429 com Retry-After; outro IP passa', async () => {
    const env = envCom();
    for (let i = 0; i < 5; i++) expect((await call(post(valido(), '9.9.9.9'), env)).status).toBe(200);
    const r = await call(post(valido(), '9.9.9.9'), env);
    expect(r.status).toBe(429);
    expect(Number(r.headers.get('Retry-After'))).toBeGreaterThan(0);
    expect((await call(post(valido(), '8.8.8.8'), env)).status).toBe(200);
  });
  it('teto diário de gravações do isolate', async () => {
    const env = envCom();
    let ultimo = 200;
    for (let i = 0; i <= MAX_WRITES_PER_DAY; i++) {
      resetRateLimits();
      ultimo = (await call(post(valido()), env)).status;
    }
    expect(ultimo).toBe(429);
  });
});

describe('endurecimento (auditoria 04/11)', () => {
  it('tetos: 50 gravações por dia e e-mail no máximo igual', () => {
    expect(MAX_WRITES_PER_DAY).toBe(50);
    expect(MAX_EMAILS_PER_DAY).toBeLessThanOrEqual(MAX_WRITES_PER_DAY);
  });
  it('depois de 50 mensagens o e-mail não passa de 50 e a 51ª é 429', async () => {
    const env = envCom({ RESEND_API_KEY: 'k' });
    const f = vi.fn(async () => new Response('{}', { status: 200 }));
    let ultimo = 0;
    for (let i = 0; i <= MAX_WRITES_PER_DAY; i++) { resetRateLimits(); ultimo = (await call(post(valido()), env, f)).status; }
    expect(ultimo).toBe(429);
    expect(f.mock.calls.length).toBeLessThanOrEqual(MAX_EMAILS_PER_DAY);
  });
  it('IPv6 do mesmo /64 divide o balde; /64 diferente e IPv4 não', async () => {
    expect(rateKey('2001:db8:1:2:aaaa::1')).toBe(rateKey('2001:DB8:1:2:0:0:0:ffff'));
    expect(rateKey('2001:db8:1:3::1')).not.toBe(rateKey('2001:db8:1:2::1'));
    expect(rateKey('1.2.3.4')).toBe('1.2.3.4');
    expect(rateKey('::ffff:1.2.3.4')).toBe('1.2.3.4');
    expect(rateKey(null)).toBe(null);
    const env = envCom();
    for (let i = 0; i < 5; i++) expect((await call(post(valido(), `2001:db8:1:2:${i}::${i}`), env)).status).toBe(200);
    expect((await call(post(valido(), '2001:db8:1:2:ffff::9'), env)).status).toBe(429);
    expect((await call(post(valido(), '2001:db8:1:9::1'), env)).status).toBe(200);
  });
  it('Content-Length acima do limite é recusado sem ler o corpo', async () => {
    const env = envCom();
    const req = new Request('https://s/api/feedback', { method: 'POST', body: JSON.stringify(valido()), headers: { 'CF-Connecting-IP': '3.3.3.3', 'Content-Length': String(MAX_BODY_BYTES + 1) } });
    const spy = vi.spyOn(req, 'text');
    const res = await call(req, env);
    expect(res.status).toBe(413);
    expect(spy).not.toHaveBeenCalled();
    expect(env.SOULMON_SAVES.store.size).toBe(0);
  });
});

describe('leitura do dono', () => {
  it('sem METRICS_ADMIN_KEY = 404; chave errada = 401; certa lista', async () => {
    const env = envCom({ METRICS_ADMIN_KEY: 'segredo' });
    await call(post(valido()), env);
    const get = key => call(new Request('https://s/api/feedback', { headers: key ? { 'X-Metrics-Key': key } : {} }), env);
    expect((await call(new Request('https://s/api/feedback'), envCom())).status).toBe(404);
    expect((await get('errada')).status).toBe(401);
    const ok = await (await get('segredo')).json();
    expect(ok.count).toBe(1);
  });
});
