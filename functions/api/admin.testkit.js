// Kit de teste do papel de admin: emite ID tokens do Firebase ASSINADOS de
// verdade (RSA gerada aqui) e serve a JWK por um `fetch` falso — assim a
// verificação REAL de `_auth.js` roda inteira, sem atalho.
import { vi } from 'vitest';

export const PROJECT = 'soulmon-test';
export const ADMIN = 'admin@example.test';
export const OTHER = 'jogador@example.test';

const KID = 'kit-1';
let keysP = null;
function keys() {
  keysP ??= crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  return keysP;
}

const b64u = (bytes) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (o) => b64u(new TextEncoder().encode(JSON.stringify(o)));

/** Instala o `fetch` da JWK (encadeia num `fallback` para outras URLs). */
export async function installJwks(fallback) {
  const { publicKey } = await keys();
  const jwk = { ...(await crypto.subtle.exportKey('jwk', publicKey)), kid: KID, alg: 'RS256', use: 'sig' };
  vi.stubGlobal('fetch', async (url, init) => {
    if (String(url).includes('securetoken@system.gserviceaccount.com')) {
      return new Response(JSON.stringify({ keys: [jwk] }), { headers: { 'cache-control': 'max-age=0' } });
    }
    if (fallback) return fallback(url, init);
    throw new Error(`fetch inesperado: ${url}`);
  });
}

export async function token(email, over = {}) {
  const { privateKey } = await keys();
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    aud: PROJECT, iss: `https://securetoken.google.com/${PROJECT}`,
    iat: now - 10, exp: now + 3600, auth_time: now - 10,
    email, email_verified: true, ...over,
  };
  const head = enc({ alg: 'RS256', kid: KID, typ: 'JWT' });
  const body = enc(payload);
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', privateKey, new TextEncoder().encode(`${head}.${body}`)));
  return `${head}.${body}.${b64u(sig)}`;
}

export function fakeKV(seed = {}) {
  const store = new Map(Object.entries(seed));
  return {
    store,
    get: async (k) => store.get(k) ?? null,
    getWithMetadata: async (k) => ({ value: store.get(k) ?? null, metadata: null }),
    put: async (k, v) => { store.set(k, v); },
    delete: async (k) => { store.delete(k); },
    list: async () => ({ keys: [...store.keys()].map(name => ({ name })), list_complete: true }),
  };
}

export function envWith(extra = {}) {
  return { FIREBASE_PROJECT_ID: PROJECT, ADMIN_EMAILS: ADMIN, DIGIAPP_SAVES: fakeKV(), ...extra };
}

export const reqWith = (tok, url = 'https://x/api', init = {}) => new Request(url, {
  ...init, headers: { 'Content-Type': 'application/json', ...(tok ? { Authorization: `Bearer ${tok}` } : {}), ...(init.headers || {}) },
});
