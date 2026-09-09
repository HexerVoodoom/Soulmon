// POST   /api/subscribe  — save a push subscription
// DELETE /api/subscribe  — remove a push subscription

import { isAllowedPushEndpoint } from './_pushTargets.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import {
  nomeDePet, idiomaDePush, dataDeNascimento, gravarSeMudou, LIMITE_INSCRICAO,
} from './_pushIdentity.js';

// Esta rota ESCREVE em KV sem custo para quem chama, e cada linha gravada vira
// 4 `fetch` por dia no cron por até um ano. Um laço de shell aqui compra
// tráfego de saída pago por nós. Ver `_rateLimit.js` para o que este teto não é.
// O NÚMERO mora em `_pushIdentity.js` porque tem dois leitores: esta rota e a
// irmã de FCM. Ver o cabeçalho de lá.
const SUB_LIMIT = LIMITE_INSCRICAO;

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

  // As CHAVES de criptografia entram na assinatura do envio, e um par torto
  // grava uma linha que NUNCA vai receber push — o cron tenta, o serviço
  // recusa, e a linha só morre no primeiro 410. Formato exigido em vez de
  // adivinhado: base64url, com teto. O tamanho exato (65 bytes de `p256dh`,
  // 16 de `auth`) NÃO é exigido de propósito — errar isso recusaria navegador
  // legítimo, e o que se quer aqui é barrar lixo, não fiscalizar o padrão.
  if (!ehChaveWebPush(keys.p256dh) || !ehChaveWebPush(keys.auth)) {
    return new Response(JSON.stringify({ error: 'Malformed keys' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...CORS },
    });
  }

  const kvKey = `push:${await hashEndpoint(endpoint)}`;
  const record = {
    endpoint,
    keys,
    // TETO DE 24, o MESMO do resto do projeto: o campo do app tem
    // `maxLength={24}` e o apelido do perfil é cortado em 24 no
    // `community.js`. Aqui era gravado como veio — texto de cliente sem teto,
    // guardado em KV por um ano e interpolado no TÍTULO da notificação. Duas
    // regras diferentes para o mesmo tipo de campo é o footgun 9 em miniatura,
    // e está escrito assim no `community.js`, sobre o nome do grupo.
    petName: nomeDePet(petName),
    /* WP1.17 — a idade da criatura, para a copy dos dias 1 e 2. É `YYYY-MM-DD`
       e só isso: dia, sem hora e sem fuso, porque a única pergunta é "faz
       quantos dias". Guardado NA SUBSCRIPTION de propósito — cancelar o push
       apaga a idade junto, e não existe registro separado sobrevivendo a
       isso. Formato inválido é DESCARTADO em vez de corrigido: um `bornAt`
       torto viraria dia 1 para sempre. */
    bornAt: dataDeNascimento(bornAt),
    // Dois valores possíveis, e só. `_pushCopy.js` só pergunta se é `pt-BR`,
    // então qualquer outra coisa já caía em inglês — mas gravar a string crua
    // guardava texto de cliente sem teto num registro de um ano.
    language: idiomaDePush(language),
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
  await gravarSeMudou(env.PUSH_SUBSCRIPTIONS, kvKey, record);

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

/** Base64url com teto. Ver o comentário no `onRequestPost`. */
function ehChaveWebPush(v) {
  return typeof v === 'string' && v.length >= 16 && v.length <= 256
    && /^[A-Za-z0-9_-]+=*$/.test(v);
}

async function hashEndpoint(endpoint) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(endpoint));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}
