// POST   /api/fcm-subscribe  — save a native Android FCM device token
// DELETE /api/fcm-subscribe  — remove a device token
//
// Mirrors /api/subscribe.js (Web Push), but for native Android's Firebase
// Cloud Messaging tokens — the Capacitor WebView has no Web Push support, so
// the native app registers here instead. Shares the same KV namespace,
// prefixed `fcm:` instead of `push:` so workers/push-scheduler.js can send to
// both from one cron run.
//
// ⚠️ "Mirrors" era mentira até 09/09/2026. Esta rota nasceu como cópia da
// irmã e ficou parada enquanto a irmã ganhava teto de apelido, lista fechada
// de idioma, validação de chave, limite de taxa e escrita-só-quando-muda —
// footgun 9 entre duas rotas que escrevem no MESMO namespace e são lidas pelo
// MESMO cron. O que as duas compartilham mora agora em `_pushIdentity.js`, com
// um dono só; o que é deste canal (o formato do token) fica aqui.

import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import {
  nomeDePet, idiomaDePush, dataDeNascimento, ehTokenFcm, gravarSeMudou,
  LIMITE_INSCRICAO,
} from './_pushIdentity.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const json = (corpo, status) => new Response(JSON.stringify(corpo), {
  status,
  headers: { 'Content-Type': 'application/json', ...CORS },
});

// Rota ANÔNIMA que escreve na KV com TTL de um ano, e cada linha escrita vira
// alvo de entrega do cron três vezes por dia. Sem teto, um laço com tokens
// aleatórios compra armazenamento e tráfego de saída pagos por nós — o mesmo
// raciocínio do `subscribe.js`. Ver `_rateLimit.js` para o que este teto não é.
function costGate(request) {
  const gate = takeToken('fcm-subscribe', clientKey(request), LIMITE_INSCRICAO);
  if (gate.ok) return null;
  console.warn('[fcm-subscribe] rate limited', { retryAfter: gate.retryAfter });
  return tooManyRequests(gate.retryAfter, CORS);
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

async function corpoDe(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

export async function onRequestPost({ request, env }) {
  const limited = costGate(request);
  if (limited) return limited;

  const body = await corpoDe(request);
  if (!body) return json({ error: 'Invalid JSON' }, 400);

  const { token, petName, language, bornAt } = body;
  if (!token) return json({ error: 'Missing token' }, 400);
  // Recusar AQUI é o que impede `{token: []}` (que passava, porque `[]` é
  // truthy) e um megabyte de lixo virarem uma linha de um ano que o cron tenta
  // entregar 3×/dia. O FCM devolveria `INVALID_ARGUMENT` para sempre.
  if (!ehTokenFcm(token)) return json({ error: 'Invalid token' }, 400);

  const registro = {
    token,
    petName: nomeDePet(petName),
    language: idiomaDePush(language),
    bornAt: dataDeNascimento(bornAt),
  };

  await gravarSeMudou(env.PUSH_SUBSCRIPTIONS, `fcm:${await hashToken(token)}`, registro);

  return json({ ok: true }, 201);
}

export async function onRequestDelete({ request, env }) {
  const limited = costGate(request);
  if (limited) return limited;

  const body = await corpoDe(request);
  if (!body) return json({ error: 'Invalid JSON' }, 400);

  const { token } = body;
  if (!token) return json({ error: 'Missing token' }, 400);
  // O DELETE aceita qualquer forma de token de propósito: apagar é a operação
  // segura, e recusar aqui deixaria órfã justamente a linha torta que entrou
  // antes desta validação existir.
  if (typeof token !== 'string') return json({ error: 'Invalid token' }, 400);

  await env.PUSH_SUBSCRIPTIONS.delete(`fcm:${await hashToken(token)}`);

  return json({ ok: true }, 200);
}

async function hashToken(token) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
