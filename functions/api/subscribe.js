// POST   /api/subscribe  — save a push subscription (Web Push or FCM)
// DELETE /api/subscribe  — remove a push subscription

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

  const { endpoint, keys, fcmToken, digimonName, language } = body;

  // FCM token (Android native push)
  if (fcmToken) {
    const kvKey = `fcm:${await hashString(fcmToken)}`;
    await env.PUSH_SUBSCRIPTIONS.put(
      kvKey,
      JSON.stringify({ fcmToken, digimonName: digimonName || 'DigiMon', language: language || 'pt-BR' }),
      { expirationTtl: 60 * 60 * 24 * 365 }, // 1 year
    );
    return new Response(JSON.stringify({ ok: true }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  // Web Push subscription
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const kvKey = `push:${await hashString(endpoint)}`;
  await env.PUSH_SUBSCRIPTIONS.put(
    kvKey,
    JSON.stringify({ endpoint, keys, digimonName: digimonName || 'DigiMon', language: language || 'pt-BR' }),
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

  const { endpoint, fcmToken } = body;

  if (fcmToken) {
    await env.PUSH_SUBSCRIPTIONS.delete(`fcm:${await hashString(fcmToken)}`);
  } else if (endpoint) {
    await env.PUSH_SUBSCRIPTIONS.delete(`push:${await hashString(endpoint)}`);
  } else {
    return new Response(JSON.stringify({ error: 'Missing endpoint or fcmToken' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function hashString(value) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 32);
}
