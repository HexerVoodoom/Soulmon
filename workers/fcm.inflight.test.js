// Regressão (QA loops 30/10): N chamadas simultâneas com o cache vazio dividem
// UMA troca OAuth, em vez de cada inscrição do lote trocar a sua.
import { describe, it, expect, vi, afterEach } from 'vitest';

async function contaDeServico() {
  const { privateKey } = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const der = new Uint8Array(await crypto.subtle.exportKey('pkcs8', privateKey));
  const b64 = btoa(String.fromCharCode(...der));
  return { client_email: 'x@y.iam', project_id: 'p', private_key: `-----BEGIN PRIVATE KEY-----\n${b64}\n-----END PRIVATE KEY-----` };
}

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('getFcmAccessToken — troca em voo', () => {
  it('10 chamadas paralelas fazem 1 fetch só', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ access_token: 'tok', expires_in: 3600 }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const { getFcmAccessToken } = await import('./fcm.js');
    const sa = await contaDeServico();
    const toks = await Promise.all(Array.from({ length: 10 }, () => getFcmAccessToken(sa)));
    expect(toks.every(t => t === 'tok')).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('falha não fica presa: a próxima chamada tenta de novo', async () => {
    let n = 0;
    vi.stubGlobal('fetch', vi.fn(async () => (++n === 1
      ? new Response('down', { status: 503 })
      : new Response(JSON.stringify({ access_token: 'ok2' }), { status: 200 }))));
    const { getFcmAccessToken } = await import('./fcm.js');
    const sa = await contaDeServico();
    await expect(getFcmAccessToken(sa)).rejects.toThrow(/503/);
    await expect(getFcmAccessToken(sa)).resolves.toBe('ok2');
  });
});
