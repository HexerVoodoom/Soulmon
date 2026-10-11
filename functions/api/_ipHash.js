// HASH DE IP para antiabuso de múltiplas contas (decisão do dono, 11/10/2026;
// `abuso-e-custo.md` §4). O IP NUNCA é gravado: só um HMAC-SHA256 dele com o
// segredo `IP_HASH_SALT` (sem o segredo o hash não é revertível nem comparável
// fora do servidor), truncado em 16 hex, em contadores com TTL de 30 DIAS
// (`IP_HASH_TTL_SECONDS`). Sem `IP_HASH_SALT`, nada é calculado nem gravado
// (os limites por IP simplesmente não valem) — o lado seguro para a privacidade.
//
// Usos: contas NOVAS por ip-hash/dia (`save.js`, primeira gravação) e gerações
// de sprite por ip-hash/dia (`generate-sprite.js`). Privacidade: §6d de
// `public/privacidade.html`; Data Safety: "IDs do dispositivo ou outros IDs".

import { kvOrThrow } from './_kv.js';

export const IP_HASH_TTL_SECONDS = 30 * 24 * 60 * 60;
export const IP_LIMITS = { newAccount: 3, sprite: 4 };
const PREFIX = 'iph:';

const hex = buf => [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');

/** IP do cliente como a Cloudflare o vê (nunca X-Forwarded-For, que o cliente forja). */
export function clientIp(request) {
  return request?.headers?.get?.('CF-Connecting-IP') || '';
}

/** HMAC do IP com o sal, 16 hex; `null` sem sal ou sem IP. */
export async function ipHash(env, request) {
  const salt = env?.IP_HASH_SALT;
  const ip = clientIp(request);
  if (!salt || !ip) return null;
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(String(salt)), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(ip))).slice(0, 16);
}

/**
 * Confere e debita um contador por ip-hash/dia.
 * @param {'newAccount'|'sprite'} kind
 * @returns {Promise<{ ok: true, hash: string|null } | { ok: false, status: 429, reason: string }>}
 */
export async function takeIpQuota(env, request, kind, now = new Date()) {
  const hash = await ipHash(env, request);
  if (!hash) return { ok: true, hash: null };
  const limit = IP_LIMITS[kind];
  const key = `${PREFIX}${kind}:${hash}:${now.toISOString().slice(0, 10)}`;
  const store = kvOrThrow(env);
  const n = Number(await store.get(key)) || 0;
  if (n >= limit) return { ok: false, status: 429, reason: kind === 'sprite' ? 'ip-sprite-limit' : 'ip-new-account-limit' };
  await store.put(key, String(n + 1), { expirationTtl: IP_HASH_TTL_SECONDS });
  return { ok: true, hash };
}
