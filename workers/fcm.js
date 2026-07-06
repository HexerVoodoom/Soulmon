// Firebase Cloud Messaging (HTTP v1 API) — Cloudflare Workers (WebCrypto API,
// no firebase-admin / Node.js required). Used to push to the native Android
// app, since Android WebView (Capacitor) has no Web Push support — see
// webpush.js for the browser/PWA equivalent.

const enc = new TextEncoder();

function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');
  const raw = atob(b64);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

async function importPrivateKey(pem) {
  return crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(pem),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
}

// Module-scope cache — a single OAuth2 access token is valid for every
// message in a batch (unlike VAPID JWTs, it isn't per-recipient), so signing
// once per cron run (not once per device) is enough. Reused across requests
// within the same warm isolate; a cold start just re-signs.
let cachedToken = null;
let cachedExpiry = 0;

/**
 * Exchange a Firebase service account for a short-lived OAuth2 access token
 * (JWT-bearer grant, RFC 7523) via Web Crypto RS256 signing.
 * @param {{client_email: string, private_key: string, project_id: string}} serviceAccount
 */
export async function getFcmAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && now < cachedExpiry - 60) return cachedToken;

  const header = b64url(enc.encode(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const claims = b64url(enc.encode(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  })));

  const key = await importPrivateKey(serviceAccount.private_key);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key, enc.encode(`${header}.${claims}`),
  );
  const jwt = `${header}.${claims}.${b64url(sig)}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    throw new Error(`FCM token exchange failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  cachedToken = data.access_token;
  cachedExpiry = now + (data.expires_in || 3600);
  return cachedToken;
}

/**
 * Send one FCM push to a device token.
 * @param {string} token - the device's FCM registration token
 * @param {{title: string, body: string, tag?: string}} notif
 * @param {string} projectId - Firebase project_id (from the service account)
 * @param {string} accessToken - from getFcmAccessToken()
 * @returns {{ status: number, ok: boolean, error?: string }}
 */
export async function sendFcmPush(token, notif, projectId, accessToken) {
  const res = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title: notif.title, body: notif.body },
          android: {
            priority: 'high',
            notification: { channel_id: 'digiapp_push', tag: notif.tag },
          },
        },
      }),
    },
  );

  if (res.ok) return { status: res.status, ok: true };

  const body = await res.json().catch(() => null);
  return { status: res.status, ok: false, error: body?.error?.status };
}
