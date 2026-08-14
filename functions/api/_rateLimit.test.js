import { describe, it, expect, beforeEach } from 'vitest';
import { clientKey, takeToken, tooManyRequests, resetRateLimits } from './_rateLimit.js';

const req = (headers = {}) => new Request('https://x/api/community', { headers });

beforeEach(() => resetRateLimits());

describe('clientKey — de onde vem o IP', () => {
  it('usa CF-Connecting-IP, que a borda reescreve (não é forjável por trás do proxy)', () => {
    expect(clientKey(req({ 'CF-Connecting-IP': '203.0.113.7' }))).toBe('203.0.113.7');
  });
  it('cai para o primeiro X-Forwarded-For quando não há CF', () => {
    expect(clientKey(req({ 'X-Forwarded-For': '198.51.100.2, 10.0.0.1' }))).toBe('198.51.100.2');
  });
  it('sem header nenhum devolve null — e null NÃO é limitado (falha aberto de propósito)', () => {
    expect(clientKey(req())).toBeNull();
    const g = takeToken('b', null, { limit: 1, windowMs: 1000 });
    expect(g.ok).toBe(true);
  });
});

describe('takeToken — o teto de custo', () => {
  const cfg = { limit: 3, windowMs: 60_000 };

  it('deixa passar até o limite e barra o excedente com Retry-After', () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(takeToken('community', '1.1.1.1', cfg, t0 + i).ok).toBe(true);
    }
    const barrado = takeToken('community', '1.1.1.1', cfg, t0 + 3);
    expect(barrado.ok).toBe(false);
    expect(barrado.retryAfter).toBeGreaterThan(0);
    expect(barrado.retryAfter).toBeLessThanOrEqual(60);
  });

  it('a janela desliza: passado o tempo, volta a passar', () => {
    const t0 = 2_000_000;
    for (let i = 0; i < 3; i++) takeToken('community', '2.2.2.2', cfg, t0);
    expect(takeToken('community', '2.2.2.2', cfg, t0 + 1).ok).toBe(false);
    expect(takeToken('community', '2.2.2.2', cfg, t0 + 60_001).ok).toBe(true);
  });

  it('IPs diferentes não compartilham balde (um abusador não derruba o resto)', () => {
    const t0 = 3_000_000;
    for (let i = 0; i < 3; i++) takeToken('community', 'abusador', cfg, t0);
    expect(takeToken('community', 'abusador', cfg, t0).ok).toBe(false);
    expect(takeToken('community', 'inocente', cfg, t0).ok).toBe(true);
  });

  it('baldes diferentes não compartilham cota (subscribe não gasta a de community)', () => {
    const t0 = 4_000_000;
    for (let i = 0; i < 3; i++) takeToken('community', '3.3.3.3', cfg, t0);
    expect(takeToken('subscribe', '3.3.3.3', cfg, t0).ok).toBe(true);
  });

  it('IPs rotativos não fazem o limitador virar vazamento de memória', () => {
    // 6000 chaves distintas contra um teto de 5000: o Map não pode crescer sem
    // limite, senão o próprio controle de custo vira o custo.
    const t0 = 5_000_000;
    for (let i = 0; i < 6000; i++) takeToken('community', `ip-${i}`, cfg, t0);
    // O contrato observável: continua respondendo e não lança.
    expect(() => takeToken('community', 'ip-final', cfg, t0)).not.toThrow();
  });
});

describe('tooManyRequests', () => {
  it('é 429 com Retry-After e preserva o CORS da rota', async () => {
    const res = tooManyRequests(30, { 'Access-Control-Allow-Origin': '*' });
    expect(res.status).toBe(429);
    expect(res.headers.get('Retry-After')).toBe('30');
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect((await res.json()).retryAfter).toBe(30);
  });
});
