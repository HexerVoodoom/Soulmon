// Web Push Protocol — RFC 8292 (VAPID) + RFC 8291 (encryption) + RFC 8188 (aes128gcm)
// Runs on Cloudflare Workers (WebCrypto API, no Node.js required)

const enc = new TextEncoder();

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s) {
  const pad = s.length % 4;
  return Uint8Array.from(
    atob(s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(pad ? 4 - pad : 0)),
    c => c.charCodeAt(0)
  );
}

function cat(...arrs) {
  const out = new Uint8Array(arrs.reduce((n, a) => n + a.length, 0));
  let i = 0;
  for (const a of arrs) { out.set(a, i); i += a.length; }
  return out;
}

async function hkdf(ikm, salt, info, len) {
  const k = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  return new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt, info }, k, len * 8)
  );
}

// ── VAPID JWT (ES256) ──────────────────────────────────────────────────────

async function vapidJWT(jwk, audience, contact) {
  const key = await crypto.subtle.importKey(
    'jwk', jwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign']
  );
  const hdr = b64url(enc.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })));
  const pld = b64url(enc.encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: contact,
  })));
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' }, key, enc.encode(`${hdr}.${pld}`)
  );
  return `${hdr}.${pld}.${b64url(sig)}`;
}

// ── RFC 8291 payload encryption ────────────────────────────────────────────

async function encryptPayload(payload, p256dh, auth) {
  const recvPub = await crypto.subtle.importKey(
    'raw', b64urlDecode(p256dh), { name: 'ECDH', namedCurve: 'P-256' }, false, []
  );

  const senderKP = await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']
  );
  const senderPub = new Uint8Array(await crypto.subtle.exportKey('raw', senderKP.publicKey));

  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits({ name: 'ECDH', public: recvPub }, senderKP.privateKey, 256)
  );

  // PRK = HKDF(salt=auth, IKM=sharedSecret, info="WebPush: info\0" || recvPub || senderPub, L=32)
  const prkInfo = cat(enc.encode('WebPush: info\x00'), b64urlDecode(p256dh), senderPub);
  const prk = await hkdf(sharedSecret, b64urlDecode(auth), prkInfo, 32);

  const salt = crypto.getRandomValues(new Uint8Array(16));

  // CEK and NONCE from PRK
  const cek = await hkdf(prk, salt, cat(enc.encode('Content-Encoding: aes128gcm\x00'), new Uint8Array([1])), 16);
  const nonce = await hkdf(prk, salt, cat(enc.encode('Content-Encoding: nonce\x00'), new Uint8Array([1])), 12);

  const aesKey = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, ['encrypt']);
  // Pad with 0x02 (last-record delimiter per RFC 8188)
  const padded = cat(enc.encode(JSON.stringify(payload)), new Uint8Array([2]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, aesKey, padded)
  );

  // RFC 8188 header: salt(16) | record_size(4 BE uint32) | keyid_len(1) | keyid(senderPub)
  const rs = new Uint8Array(4);
  new DataView(rs.buffer).setUint32(0, 4096, false);

  return cat(salt, rs, new Uint8Array([senderPub.length]), senderPub, ciphertext);
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Send a Web Push notification.
 * @param {object} sub  - { endpoint, keys: { p256dh, auth } }
 * @param {object} payload  - notification data ({ title, body, tag, ... })
 * @param {object} vapidJWK - private key as JWK object
 * @param {string} vapidPublicKey - base64url-encoded uncompressed P-256 public key
 * @param {string} contact - "mailto:..." or "https://..." for VAPID sub claim
 * @returns {{ status: number, ok: boolean }}
 */
export async function sendWebPush(sub, payload, vapidJWK, vapidPublicKey, contact) {
  const { protocol, host } = new URL(sub.endpoint);
  const jwt = await vapidJWT(vapidJWK, `${protocol}//${host}`, contact);
  const body = await encryptPayload(payload, sub.keys.p256dh, sub.keys.auth);

  const res = await fetch(sub.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Encoding': 'aes128gcm',
      'TTL': '86400',
      'Urgency': 'normal',
      'Authorization': `vapid t=${jwt},k=${vapidPublicKey}`,
    },
    body,
  });
  return { status: res.status, ok: res.ok };
}
