const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const VALID_ID = /^[a-zA-Z0-9_-]{8,64}$/;

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const saveId = url.searchParams.get('id');

  if (!saveId || !VALID_ID.test(saveId)) {
    return Response.json({ error: 'Invalid save ID' }, { status: 400, headers: CORS });
  }

  if (!env.DIGIAPP_SAVES) {
    return Response.json({ error: 'Storage not bound — add KV binding DIGIAPP_SAVES in Cloudflare dashboard' }, { status: 500, headers: CORS });
  }

  if (request.method === 'GET') {
    const raw = await env.DIGIAPP_SAVES.get(saveId);
    if (!raw) return Response.json({ found: false }, { headers: CORS });
    return Response.json({ found: true, state: JSON.parse(raw) }, { headers: CORS });
  }

  if (request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body?.state) return Response.json({ error: 'Missing state' }, { status: 400, headers: CORS });
    await env.DIGIAPP_SAVES.put(saveId, JSON.stringify(body.state), { expirationTtl: 86400 * 365 });
    return Response.json({ ok: true }, { headers: CORS });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS });
}
