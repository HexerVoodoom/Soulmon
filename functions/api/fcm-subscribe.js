// POST   /api/fcm-subscribe  — save a native Android FCM device token
// DELETE /api/fcm-subscribe  — remove a device token
//
// Mirrors /api/subscribe.js (Web Push), but for native Android's Firebase
// Cloud Messaging tokens — the Capacitor WebView has no Web Push support, so
// the native app registers here instead. Shares the same KV namespace,
// prefixed `fcm:` instead of `push:` so workers/push-scheduler.js can send to
// both from one cron run.

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const { token, digimonName, language } = body;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const kvKey = `fcm:${await hashToken(token)}`;
  await env.PUSH_SUBSCRIPTIONS.put(
    kvKey,
    JSON.stringify({ token, digimonName: digimonName || 'DigiMon', language: language || 'pt-BR' }),
    { expirationTtl: 60 * 60 * 24 * 365 },
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequestDelete({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const { token } = body;
  if (!token) {
    return new Response(JSON.stringify({ error: 'Missing token' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const kvKey = `fcm:${await hashToken(token)}`;
  await env.PUSH_SUBSCRIPTIONS.delete(kvKey);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function hashToken(token) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
