/**
 * Auditoria de lançamento (11/10/2026): a entrada do `/api/generate-sprite`.
 * O prompt e as URLs de referência vêm do cliente e iam crus ao provedor pago;
 * as URLs, o Higgsfield BUSCA — SSRF de terceiro em nome da nossa conta.
 */
import { describe, it, expect } from 'vitest';
import { referenciasSeguras, onRequestPost, MAX_PROMPT_CHARS } from './generate-sprite.js';

const req = new Request('https://soulmon.test/api/generate-sprite', { method: 'POST' });
const tok = 'a'.repeat(32);

describe('referenciasSeguras — só a NOSSA arte republicada vira referência', () => {
  it('aceita /api/sprite-image?k=<token> da mesma origem', () => {
    const u = `https://soulmon.test/api/sprite-image?k=${tok}`;
    expect(referenciasSeguras(req, [u])).toEqual([u]);
  });
  it('descarta host externo, metadado de nuvem, http, data:, caminho e token tortos', () => {
    expect(referenciasSeguras(req, [
      'https://evil.example/x.png',
      'http://169.254.169.254/latest/meta-data/',
      `http://soulmon.test/api/sprite-image?k=${tok}`,
      'data:image/png;base64,AAAA',
      `https://soulmon.test/api/save?k=${tok}`,
      'https://soulmon.test/api/sprite-image?k=../x',
      42,
    ])).toBeUndefined();
  });
  it('não-array e excesso: no máximo 4', () => {
    expect(referenciasSeguras(req, 'https://soulmon.test/x')).toBeUndefined();
    const u = `https://soulmon.test/api/sprite-image?k=${tok}`;
    expect(referenciasSeguras(req, Array(10).fill(u))).toHaveLength(4);
  });
});

describe('prompt com teto — antes de qualquer portão ou chamada paga', () => {
  const post = body =>
    onRequestPost({
      request: new Request('https://soulmon.test/api/generate-sprite', { method: 'POST', body: JSON.stringify(body) }),
      env: {},
    });
  it('prompt acima do teto é 400', async () => {
    expect((await post({ prompt: 'x'.repeat(MAX_PROMPT_CHARS + 1), id: 'a'.repeat(32) })).status).toBe(400);
  });
  it('promptFallback acima do teto também', async () => {
    expect((await post({ prompt: 'ok', promptFallback: 'x'.repeat(MAX_PROMPT_CHARS + 1) })).status).toBe(400);
  });
});
