// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  scrub, scrubRoute, buildCrashReport, reportCrash, isNoise, installGlobalCrashHandlers,
  resetCrashReporterForTest, resetInstalledForTest, MAX_PER_SESSION, CRASH_ENDPOINT,
} from './crashReport';
import { setTelemetryEnabled } from './telemetry';
// @ts-expect-error — módulo JS do servidor, sem .d.ts de propósito
import * as servidor from '../../functions/api/crash.js';

beforeEach(() => {
  resetCrashReporterForTest();
  resetInstalledForTest();
  localStorage.clear();
});

describe('paridade cliente/servidor (footgun 9)', () => {
  const vetores = [
    'ana@x.com abriu https://a.b/c/d?q=1#z',
    'token eyJhbGciOiJI.eyJzdWIiOiIx.abc e id 0123456789abcdef0123456789abcdef',
    'cel 11987654321 e AbCdEfGhIjKlMnOpQrStUvWxYz012345_-',
    'texto normal sem nada',
  ];
  it.each(vetores)('scrub igual nos dois lados: %s', v => {
    expect(scrub(v, 200)).toBe(servidor.scrub(v, 200));
  });
  it.each(['/a/0123456789ab?x=1', '/u/42', '/', '/home#x'])('scrubRoute igual: %s', r => {
    expect(scrubRoute(r)).toBe(servidor.scrubRoute(r));
  });
  it('o relatório que o cliente monta passa na allowlist do servidor', () => {
    const r = buildCrashReport('error', new Error('boom'), '/home')!;
    expect(servidor.sanitizeReport(r)).not.toBeNull();
  });
  it('mesmos tetos nos dois lados', () => {
    expect(servidor.MAX_MSG).toBe(200);
    expect(servidor.MAX_STACK).toBe(800);
  });
});

describe('buildCrashReport', () => {
  it('só os campos da allowlist, sem PII e dentro dos tetos', () => {
    const err = new Error('falhou para ana@x.com: ' + 'x'.repeat(500));
    err.stack = 'Error: x\n    at f (https://soulmon.workers.dev/assets/i.js?token=zzz:1:2)\n' + 'y'.repeat(2000);
    const r = buildCrashReport('boundary', err, '/guild/0123456789ab?convite=1')!;
    expect(Object.keys(r).sort()).toEqual(['kind', 'msg', 'plat', 'route', 'stack', 'v', 'ver']);
    expect(r.msg.length).toBeLessThanOrEqual(200);
    expect(r.stack.length).toBeLessThanOrEqual(800);
    expect(JSON.stringify(r)).not.toMatch(/ana@x\.com|token=zzz|convite/);
    expect(r.route).toBe('/guild/:id');
  });
  it('aceita string, objeto e lixo lançado', () => {
    expect(buildCrashReport('rejection', 'só texto', '/')!.msg).toBe('só texto');
    expect(buildCrashReport('rejection', { message: 'obj' }, '/')!.msg).toBe('obj');
    expect(buildCrashReport('rejection', undefined, '/')!.msg).toBe('non-error thrown');
  });
  it('objeto hostil (getter que lança) não derruba', () => {
    const hostil = { get message(): string { throw new Error('x'); } };
    expect(() => buildCrashReport('error', hostil, '/')).not.toThrow();
  });
});

describe('reportCrash: conduta', () => {
  it('envia uma vez por assinatura e no máximo MAX_PER_SESSION por sessão', () => {
    const send = vi.fn();
    expect(reportCrash('error', new Error('a'), { send })).toBe(true);
    expect(reportCrash('error', new Error('a'), { send })).toBe(false);
    for (let i = 0; i < 20; i++) reportCrash('error', new Error(`m${i}`), { send });
    expect(send).toHaveBeenCalledTimes(MAX_PER_SESSION);
  });
  it('respeita o opt-out da telemetria', () => {
    setTelemetryEnabled(false);
    const send = vi.fn();
    expect(reportCrash('error', new Error('a'), { send })).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
  it('amostragem: random acima da taxa descarta', () => {
    const send = vi.fn();
    expect(reportCrash('error', new Error('a'), { send, random: () => 1 })).toBe(false);
    expect(send).not.toHaveBeenCalled();
  });
  it('ruído conhecido não é relatado', () => {
    expect(isNoise('ResizeObserver loop completed with undelivered notifications.')).toBe(true);
    expect(isNoise('Script error.')).toBe(true);
    expect(reportCrash('error', 'Script error.', { send: vi.fn() })).toBe(false);
  });
  it('nunca lança, nem se o envio explodir', () => {
    expect(() => reportCrash('error', new Error('a'), { send: () => { throw new Error('rede'); } })).not.toThrow();
  });
  it('sem send injetado usa fetch same-origin, keepalive, sem credenciais', () => {
    const f = vi.fn(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', f);
    reportCrash('error', new Error('via fetch'));
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe(CRASH_ENDPOINT);
    expect(init).toMatchObject({ method: 'POST', keepalive: true, credentials: 'omit' });
    vi.unstubAllGlobals();
  });
});

describe('handlers globais', () => {
  it('error e unhandledrejection viram relatórios; falha de carregar recurso é ignorada', () => {
    const f = vi.fn(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', f);
    const handlers: Record<string, (e: unknown) => void> = {};
    installGlobalCrashHandlers({ addEventListener: (t: string, h: unknown) => { handlers[t] = h as (e: unknown) => void; } } as never);
    handlers.error({ error: new Error('uncaught'), message: 'uncaught' });
    handlers.error({ error: null, message: '' }); // <img> quebrada
    handlers.unhandledrejection({ reason: new Error('promessa') });
    expect(f).toHaveBeenCalledTimes(2);
    expect(JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string).kind).toBe('error');
    expect(JSON.parse((f.mock.calls[1] as unknown as [string, RequestInit])[1].body as string).kind).toBe('rejection');
    vi.unstubAllGlobals();
  });
});
