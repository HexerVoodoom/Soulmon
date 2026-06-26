// POST   /api/subscribe  — save a push subscription
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

  const { endpoint, keys, digimonName, language } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const kvKey = `push:${await hashEndpoint(endpoint)}`;
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

  const { endpoint } = body;
  if (!endpoint) {
    return new Response(JSON.stringify({ error: 'Missing endpoint' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const kvKey = `push:${await hashEndpoint(endpoint)}`;
  await env.PUSH_SUBSCRIPTIONS.delete(kvKey);

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

async function hashEndpoint(endpoint) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
