import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// QA1 (rodada 6) — duas falhas do cache de chaves públicas do Firebase:
//
//  1. ROTAÇÃO: o Google publica chaves novas e passa a assinar com elas. O
//     `kid` desconhecido devolvia 401 até o cache (max-age) vencer — todo
//     login novo recusado, e o cliente tratava como "sessão expirou".
//  2. FALHA DO ENDPOINT: com o cache vencido, `getJwks` lançava (fetch caiu ou
//     5xx), `verifyIdToken` devolvia null e TODOS os usuários tomavam 401 por
//     causa de um soluço do Google, mesmo com as chaves boas na memória.

const PROJECT = 'soulmon-teste';
const b64url = (buf) => Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64json = (o) => b64url(new TextEncoder().encode(JSON.stringify(o)));

async function novaChave(kid) {
  const par = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const jwk = await crypto.subtle.exportKey('jwk', par.publicKey);
  return { kid, priv: par.privateKey, jwk: { ...jwk, kid, alg: 'RS256', use: 'sig' } };
}

async function token(chave, email = 'a@b.com') {
  const agora = Math.floor(Date.now() / 1000);
  const h = b64json({ alg: 'RS256', kid: chave.kid, typ: 'JWT' });
  const p = b64json({
    aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`,
    exp: agora + 3600, iat: agora - 5, auth_time: agora - 5, email, email_verified: true,
  });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave.priv, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(sig)}`;
}

const jwks = (maxAge, ...chaves) => new Response(JSON.stringify({ keys: chaves.map(c => c.jwk) }), {
  status: 200, headers: { 'cache-control': `public, max-age=${maxAge}` },
});

let relogio;
beforeEach(() => {
  vi.resetModules();
  relogio = 1_800_000_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => relogio);
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('verifyIdToken — cache de chaves', () => {
  it('kid novo (rotação) provoca UMA releitura e passa', async () => {
    const A = await novaChave('kid-a');
    const B = await novaChave('kid-b');
    let chamadas = 0;
    vi.stubGlobal('fetch', vi.fn(async () => (++chamadas === 1 ? jwks(3600, A) : jwks(3600, A, B))));
    const { verifyIdToken } = await import('./_auth.js');
    expect((await verifyIdToken(await token(A), PROJECT))?.email).toBe('a@b.com');
    relogio += 120_000; // passou a folga mínima entre releituras forçadas
    expect((await verifyIdToken(await token(B), PROJECT))?.email).toBe('a@b.com');
  });

  it('kid desconhecido repetido NÃO vira uma busca por requisição (folga mínima)', async () => {
    const A = await novaChave('kid-a');
    const X = await novaChave('kid-x');
    const f = vi.fn(async () => jwks(3600, A));
    vi.stubGlobal('fetch', f);
    const { verifyIdToken } = await import('./_auth.js');
    await verifyIdToken(await token(A), PROJECT);
    const antes = f.mock.calls.length;
    for (let i = 0; i < 5; i++) expect(await verifyIdToken(await token(X), PROJECT)).toBeNull();
    expect(f.mock.calls.length - antes).toBeLessThanOrEqual(1);
  });

  it('endpoint de chaves fora do ar com cache vencido → usa a cópia que já tem', async () => {
    const A = await novaChave('kid-a');
    let chamadas = 0;
    vi.stubGlobal('fetch', vi.fn(async () => (++chamadas === 1 ? jwks(0, A) : new Response('x', { status: 503 }))));
    const { verifyIdToken } = await import('./_auth.js');
    expect(await verifyIdToken(await token(A), PROJECT)).not.toBeNull();
    relogio += 3_600_000; // max-age=0 → vencido
    expect(await verifyIdToken(await token(A), PROJECT)).not.toBeNull();
  });
});
