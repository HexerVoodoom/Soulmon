import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// QA3 — `verifyIdToken` com tokens HOSTIS. Cada caso é um ataque clássico a validação de JWT; todos devem dar
// `null` (e nunca lançar). O caso feliz (controle) prova que o harness gera um token realmente aceito.

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

const agora = () => Math.floor(Date.now() / 1000);
const claimsOk = (over = {}) => ({
  aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`,
  exp: agora() + 3600, iat: agora() - 5, auth_time: agora() - 5, email: 'a@b.com', email_verified: true, ...over,
});

async function assinar(chave, header, payload) {
  const h = b64json(header); const p = b64json(payload);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', chave.priv, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(sig)}`;
}

let chave;
beforeEach(async () => {
  vi.resetModules();
  chave = await novaChave('k1');
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ keys: [chave.jwk] }), { status: 200, headers: { 'cache-control': 'max-age=3600' } })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

async function verificar(tok, ...resto) {
  const { verifyIdToken } = await import('./_auth.js');
  return verifyIdToken(tok, resto.length ? resto[0] : PROJECT);
}

describe('verifyIdToken — ataques a JWT', () => {
  it('CONTROLE: token válido passa (e o e-mail sai normalizado)', async () => {
    const t = await assinar(chave, { alg: 'RS256', kid: 'k1' }, claimsOk({ email: '  A@B.com ' }));
    expect((await verificar(t))?.email).toBe('a@b.com');
  });

  it('alg "none" sem assinatura', async () => {
    const t = `${b64json({ alg: 'none', kid: 'k1' })}.${b64json(claimsOk())}.`;
    expect(await verificar(t)).toBeNull();
  });

  it('alg HS256 (confusão de algoritmo: assinar com a chave pública como segredo)', async () => {
    const h = b64json({ alg: 'HS256', kid: 'k1' }); const p = b64json(claimsOk());
    const segredo = new TextEncoder().encode(JSON.stringify(chave.jwk));
    const k = await crypto.subtle.importKey('raw', segredo, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(`${h}.${p}`));
    expect(await verificar(`${h}.${p}.${b64url(sig)}`)).toBeNull();
  });

  it('payload adulterado depois de assinado (troca o e-mail)', async () => {
    const t = await assinar(chave, { alg: 'RS256', kid: 'k1' }, claimsOk());
    const [h, , s] = t.split('.');
    expect(await verificar(`${h}.${b64json(claimsOk({ email: 'vitima@x.com' }))}.${s}`)).toBeNull();
  });

  it('sem kid, kid de outra chave, kid inventado', async () => {
    expect(await verificar(await assinar(chave, { alg: 'RS256' }, claimsOk()))).toBeNull();
    expect(await verificar(await assinar(chave, { alg: 'RS256', kid: 'outro' }, claimsOk()))).toBeNull();
  });

  const CLAIMS_RUINS = [
    ['aud de outro projeto', { aud: 'outro-projeto' }],
    ['aud como lista', { aud: [PROJECT] }],
    ['iss errado', { iss: 'https://accounts.google.com' }],
    ['iss com barra extra', { iss: `https://securetoken.google.com/${PROJECT}/` }],
    ['exp vencido', { exp: agora() - 1 }],
    ['exp como string', { exp: String(agora() + 3600) }],
    ['exp ausente', { exp: undefined }],
    ['iat no futuro (+10 min)', { iat: agora() + 600 }],
    ['iat como string', { iat: String(agora()) }],
    ['e-mail não verificado', { email_verified: false }],
    ['email_verified como string "true"', { email_verified: 'true' }],
    ['sem e-mail', { email: undefined }],
    ['e-mail vazio', { email: '' }],
  ];
  for (const [nome, over] of CLAIMS_RUINS) {
    it(`claim ruim: ${nome}`, async () => {
      const t = await assinar(chave, { alg: 'RS256', kid: 'k1' }, claimsOk(over));
      expect(await verificar(t)).toBeNull();
    });
  }

  it('lixo estrutural nunca lança: partes demais/de menos, base64 inválido, JSON inválido, tipos errados', async () => {
    const lixos = ['', 'a', 'a.b', 'a.b.c.d', '....', 'é.é.é', '%%%.%%%.%%%', `${b64json([])}.${b64json([])}.x`, `${b64json('x')}.${b64json(null)}.x`, `${b64url('{')}.${b64url('{')}.x`, `${b64json({ alg: 'RS256', kid: 'k1' })}.${b64json(null)}.x`, 'x'.repeat(200000), '.'.repeat(5000)];
    for (const l of lixos) expect(await verificar(l), l.slice(0, 20)).toBeNull();
    expect(await verificar(undefined)).toBeNull();
    expect(await verificar(null)).toBeNull();
    expect(await verificar(12345)).toBeNull();
    expect(await verificar({})).toBeNull();
  });

  it('sem projectId configurado: nada é aceito por esta função', async () => {
    const t = await assinar(chave, { alg: 'RS256', kid: 'k1' }, claimsOk());
    expect(await verificar(t, undefined)).toBeNull();
    expect(await verificar(t, '')).toBeNull();
  });

  it('o JWKS devolve lixo (corpo não-JSON / sem keys / chave sem n,e): null, não exceção', async () => {
    const t = await assinar(chave, { alg: 'RS256', kid: 'k1' }, claimsOk());
    for (const corpo of ['<html>', '{}', '{"keys":[{"kid":"k1"}]}', '{"keys":"x"}', 'null']) {
      vi.resetModules();
      vi.stubGlobal('fetch', vi.fn(async () => new Response(corpo, { status: 200 })));
      expect(await verificar(t), corpo).toBeNull();
    }
  });
});
