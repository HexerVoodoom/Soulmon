/**
 * Gera um par de chaves VAPID (ECDSA P-256) para o Web Push.
 *
 * ⚠️ RODE NA SUA MÁQUINA. A chave PRIVADA sai no stdout e não deve ser colada
 * em chat, issue, commit ou log — o único destino dela é
 * `wrangler secret put VAPID_JWK`.
 *
 * Por que isto existe: em 07/09/2026 descobriu-se que o worker de push nunca
 * teve o `VAPID_JWK` configurado. Sem ele, `push-scheduler.js` registra
 * "VAPID_JWK not configured — skipping Web Push" e **pula o envio inteiro**.
 * Os dois canais estavam mortos na borda, em silêncio, desde sempre.
 *
 * Trocar o par é seguro enquanto não houver inscrições de push em produção —
 * uma inscrição é criada CONTRA uma chave pública, e muda de chave invalida
 * as existentes. Com zero usuários, o custo é zero.
 *
 * Uso:
 *   node scripts/gerar-vapid.mjs
 */
import { webcrypto } from 'node:crypto';

const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
  { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'],
);

// A chave PÚBLICA no formato que o navegador espera em `applicationServerKey`:
// ponto não comprimido (0x04 || X || Y) em base64url.
const cru = new Uint8Array(await webcrypto.subtle.exportKey('raw', publicKey));
const base64url = Buffer.from(cru).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const jwk = await webcrypto.subtle.exportKey('jwk', privateKey);

console.log('\n=== CHAVE PÚBLICA (base64url) ===');
console.log('Vai nos TRÊS lugares que a fixam — os três têm que ficar iguais,');
console.log('há teste travando (workers/vapid.parity.test.js):');
console.log('  · src/utils/vapid.ts        → VAPID_PUBLIC_KEY');
console.log('  · workers/push-scheduler.js → VAPID_PUBLIC_KEY');
console.log('  · workers/wrangler.toml     → [vars] VAPID_PUBLIC_KEY\n');
console.log(base64url);

console.log('\n=== CHAVE PRIVADA (JWK) — SEGREDO ===');
console.log('Não commite, não cole em chat. Destino único:');
console.log('  cd workers && npx wrangler secret put VAPID_JWK -c wrangler.toml\n');
console.log(JSON.stringify(jwk));
console.log('');
