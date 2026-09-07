// POST   /api/subscribe  — save a push subscription
// DELETE /api/subscribe  — remove a push subscription

import { isAllowedPushEndpoint } from './_pushTargets.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';

// Esta rota ESCREVE em KV sem custo para quem chama, e cada linha gravada vira
// 4 `fetch` por dia no cron por até um ano. Um laço de shell aqui compra
// tráfego de saída pago por nós. Ver `_rateLimit.js` para o que este teto não é.
const SUB_LIMIT = { limit: 10, windowMs: 60_000 };

function costGate(request) {
  const gate = takeToken('subscribe', clientKey(request), SUB_LIMIT);
  if (gate.ok) return null;
  console.warn('[subscribe] rate limited', { retryAfter: gate.retryAfter });
  return tooManyRequests(gate.retryAfter, CORS);
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost({ request, env }) {
  const limited = costGate(request);
  if (limited) return limited;

  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const { endpoint, keys, petName, language, bornAt } = body;
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return new Response(JSON.stringify({ error: 'Missing required fields' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  // Sem esta checagem, o `endpoint` era gravado como veio e o worker de push
  // passava a fazer `fetch()` nele 4×/dia por um ano — um SSRF com JWT VAPID
  // assinado pela chave de produção no cabeçalho.
  if (!isAllowedPushEndpoint(endpoint)) {
    return new Response(JSON.stringify({ error: 'Unsupported push endpoint' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const kvKey = `push:${await hashEndpoint(endpoint)}`;
  const record = {
    endpoint,
    keys,
    petName: petName || 'Soulmon',
    /* WP1.17 — a idade da criatura, para a copy dos dias 1 e 2. É `YYYY-MM-DD`
       e só isso: dia, sem hora e sem fuso, porque a única pergunta é "faz
       quantos dias". Guardado NA SUBSCRIPTION de propósito — cancelar o push
       apaga a idade junto, e não existe registro separado sobrevivendo a
       isso. Formato inválido é DESCARTADO em vez de corrigido: um `bornAt`
       torto viraria dia 1 para sempre. */
    bornAt: /^\d{4}-\d{2}-\d{2}$/.test(String(bornAt ?? '')) ? bornAt : undefined,
    language: language || 'en-US',
  };

  // A chave é o hash do endpoint, então reenviar a MESMA inscrição já era
  // idempotente — mas ainda custava uma ESCRITA de KV por chamada, e o cliente
  // reenvia a cada abertura do app. Escrever só quando mudou troca a escrita
  // (cara) por uma leitura (barata e cacheada na borda).
  //
  // O TTL é de 1 ano e só renova na escrita: se a comparação sozinha decidisse,
  // um jogador ativo com a inscrição inalterada perderia o push exatamente no
  // aniversário dela — silenciosamente, que é o pior modo de falha deste canal.
  // Por isso a gravação também acontece quando o registro está velho.
  const REFRESH_AFTER_MS = 30 * 24 * 60 * 60 * 1000;
  let previous = null;
  try {
    previous = JSON.parse((await env.PUSH_SUBSCRIPTIONS.get(kvKey)) || 'null');
  } catch {
    previous = null;
  }
  const unchanged =
    previous &&
    JSON.stringify({ ...previous, refreshedAt: undefined }) ===
      JSON.stringify({ ...record, refreshedAt: undefined });
  const stale = !previous?.refreshedAt || Date.now() - previous.refreshedAt > REFRESH_AFTER_MS;

  if (!unchanged || stale) {
    await env.PUSH_SUBSCRIPTIONS.put(
      kvKey,
      JSON.stringify({ ...record, refreshedAt: Date.now() }),
      { expirationTtl: 60 * 60 * 24 * 365 },
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export async function onRequestDelete({ request, env }) {
  const limited = costGate(request);
  if (limited) return limited;

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
