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
import { VALID_ID } from './_entitlements.js';
import { authorizeSaveAccess, authStatus } from './_auth.js';
import {
  nomeDePet, idiomaDePush, dataDeNascimento, ehTokenFcm, gravarSeMudou,
  LIMITE_INSCRICAO, desindexarInscricao,
} from './_pushIdentity.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  // `Authorization` anunciado — mesma regra e mesmo motivo de `subscribe.js`.
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  const { token, petName, language, bornAt, saveId } = body;
  if (!token) return json({ error: 'Missing token' }, 400);
  // Recusar AQUI é o que impede `{token: []}` (que passava, porque `[]` é
  // truthy) e um megabyte de lixo virarem uma linha de um ano que o cron tenta
  // entregar 3×/dia. O FCM devolveria `INVALID_ARGUMENT` para sempre.
  if (!ehTokenFcm(token)) return json({ error: 'Invalid token' }, 400);

  // `saveId` só entra se o dono provou posse — mesma regra de `subscribe.js`
  // (`saveIdAutorizado` de lá; o porquê inteiro está no comentário do campo).
  const dono = await saveIdAutorizado(request, env, saveId);
  if (dono.status) return json({ error: dono.reason }, dono.status);

  const registro = {
    token,
    petName: nomeDePet(petName),
    language: idiomaDePush(language),
    bornAt: dataDeNascimento(bornAt),
    // Decisão #23 — a conta dona, para a exclusão em `account.js` achar esta
    // linha. Opcional, não verificado, inválido descartado: o porquê inteiro
    // está no comentário equivalente de `subscribe.js` (mesma regra, os dois
    // canais são varridos pela mesma função).
    ...(dono.saveId ? { saveId: dono.saveId } : {}),
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

  const kvKey = `fcm:${await hashToken(token)}`;
  // Índice inverso primeiro — mesma regra e mesmo motivo de `subscribe.js`.
  await desindexarInscricao(env.PUSH_SUBSCRIPTIONS, kvKey);
  await env.PUSH_SUBSCRIPTIONS.delete(kvKey);

  return json({ ok: true }, 200);
}

/** Espelho de `subscribe.js` › `saveIdAutorizado`. Ver o comentário de lá. */
async function saveIdAutorizado(request, env, saveId) {
  if (typeof saveId !== 'string' || !VALID_ID.test(saveId)) return { saveId: null };
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (auth.ok) return { saveId };
  if (auth.reason === 'account-deleted') return { saveId: null, status: authStatus(auth), reason: auth.reason };
  console.warn('[fcm-subscribe] saveId sem prova de posse, inscrição gravada sem conta', { reason: auth.reason });
  return { saveId: null };
}

async function hashToken(token) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
