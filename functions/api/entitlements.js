// Entitlements — endpoint público de leitura/gasto de créditos.
// A lógica e as regras de confiança estão em _entitlements.js (leia o cabeçalho
// de lá antes de mexer aqui). Este arquivo só expõe as operações.
//
// Rotas (query ?action=):
//   GET  /api/entitlements?id=<saveId>          → { tier, credits, adsLeft }
//   POST /api/entitlements?action=spend         { id, amount, reason }
//   POST /api/entitlements?action=ad            { id }
//   POST /api/entitlements?action=grant         { saveId }   ← CORTESIA (admin)
//   POST /api/entitlements?action=rebirth-reset { id }       ← RENASCIMENTO (#62)
//
// SOBRE A CORTESIA (action=grant): é a única rota que concede tier pago sem
// loja, e por isso não usa `authorizeSaveAccess` (que autentica o DONO DO
// SAVE — e o dono do save é justamente quem não pode se dar o tier). Ela exige
// `Authorization: Bearer <ENTITLEMENTS_ADMIN_KEY>`, e é FAIL-CLOSED no mesmo
// padrão de `METRICS_ADMIN_KEY` em `metrics.js`: sem a variável, a rota NÃO
// EXISTE (404, não 401 — 401 confirma o endpoint a quem sonda; e a ação
// DESCONHECIDA também responde 404, senão a diferença 404/400 a confirmaria
// do mesmo jeito). O teto, a
// idempotência e o "nunca crédito" moram em `_entitlements.js:grantCourtesy`.
//
// SOBRE O ANÚNCIO RECOMPENSADO (action=ad): um endpoint aberto que dá crédito
// só porque o cliente pediu é farmável com um `curl` — o jogador ganharia a
// moeda sem gerar receita de anúncio, que é justamente o que deveria pagar a
// conta. Por isso ele fica DESLIGADO por padrão e só responde quando
// ADMOB_SSV_ENABLED === 'true'.
//
// Para ligar de verdade é preciso Server-Side Verification do AdMob: o próprio
// Google chama uma URL nossa assinada quando o anúncio termina, e só essa
// chamada (verificada por assinatura) pode conceder crédito. Enquanto isso não
// existir, a UI esconde a opção (o GET devolve `adsEnabled: false`) em vez de
// mostrar um botão que não deveria funcionar.

// SOBRE O RENASCIMENTO (action=rebirth-reset, decisão do dono **#62**,
// 22/09/2026): o renascimento zera `aiLifetime.sprite`. O rebirth em si é
// **de cliente** — mora no save (`src/utils/rebirth.ts`, `GameState.rebirth`)
// e o servidor nunca o grava. Mas o contador vitalício de sprite mora em
// `ent:<saveId>`, que **só o servidor escreve** (é o único limite de IA que o
// cliente não alcança). Daí esta rota: o cliente AVISA que renasceu, e o
// servidor CONFERE antes de zerar. Três travas, porque um reset de teto
// vitalício é dinheiro (26 gerações × ~R$ 0,10):
//   1. `authorizeSaveAccess` — só o dono do save, como `spend`;
//   2. **prova no save**: o servidor lê `<saveId>` na KV e exige
//      `state.rebirth` com `at`/`fromStage`. Sem isso a rota seria um botão de
//      "zere meu teto" para qualquer dono de conta;
//   3. **uma vez só**: `rebirthSpriteResetAt` no próprio entitlement
//      (`resetSpriteLifetimeOnRebirth`) — o renascimento é um por save.
// A 2ª trava é falsificável por um cliente adulterado (ele escreve o próprio
// save), e isso é ACEITO: o dano máximo é **um** reset por conta, que é
// exatamente o que a decisão concede. O que ela fecha é o caminho de `curl`
// sem save renascido, e o acidente de um cliente chamar na hora errada.

import {
  VALID_ID, publicView, spendCredits, grantAdReward, auditRefunds,
  grantCourtesy, COURTESY_PROVIDER, resetSpriteLifetimeOnRebirth,
} from './_entitlements.js';
import { authorizeSaveAccess, authStatus } from './_auth.js';
import { isPlayPurchaseVoided, isSteamPurchaseVoided, isSteamOwnershipVoided } from './_billing.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { kv } from './_kv.js';

/**
 * Teto por IP na cortesia. Amortecedor contra sonda de chave (ver
 * `_rateLimit.js` para o que isto NÃO é) — o dono roda isso 10 vezes numa
 * tarde, não 60 por minuto.
 */
const GRANT_RATE = { limit: 10, windowMs: 60_000 };

/**
 * Compara em tempo (aproximadamente) constante. Cópia consciente de
 * `metrics.js:secretEquals` — a função não é exportada de lá, e importar um
 * handler de rota só para comparar string arrastaria a allowlist de eventos
 * para dentro desta rota. Se virar uma terceira, vai para `_auth.js`.
 */
function secretEquals(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Log estruturado. NUNCA o saveId inteiro (deriva do e-mail) nem a chave. */
function log(event, saveId, extra = {}) {
  console.log(JSON.stringify({ event, saveIdPrefix: String(saveId).slice(0, 8), ...extra }));
}

/**
 * A cortesia. Ordem das checagens é a do fail-closed: existe a rota? → taxa →
 * chave → corpo. O saveId só é lido DEPOIS da chave, para que uma chamada sem
 * chave não descubra nem se o id é válido.
 */
async function handleGrant(request, env) {
  if (!env?.ENTITLEMENTS_ADMIN_KEY) return json({ error: 'Not found' }, 404);

  const gate = takeToken('entitlements-grant', clientKey(request), GRANT_RATE);
  if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);

  const header = request.headers.get('Authorization') ?? '';
  const given = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!secretEquals(given, env.ENTITLEMENTS_ADMIN_KEY)) return json({ error: 'Unauthorized' }, 401);

  if (!kv(env)) return json({ error: 'Storage not bound' }, 500);
  const body = await request.json().catch(() => null);
  const saveId = body?.saveId;
  // `typeof` antes do regex: `RegExp.test` coage o argumento, então `[id]` e
  // `12345678` (array/número) passavam e viravam chave de KV por `String()`.
  // Achado do QA (rodada A, 21/09/2026) — id é string, ou não é id.
  if (typeof saveId !== 'string' || !VALID_ID.test(saveId)) return json({ error: 'Invalid save ID' }, 400);

  const r = await grantCourtesy(env, saveId);
  if (!r.ok) {
    log('entitlements.courtesy.refused', saveId, { reason: r.reason, count: r.count, max: r.max });
    return json({ ok: false, reason: r.reason, count: r.count, max: r.max }, 429);
  }
  log('entitlements.courtesy.granted', saveId, { duplicate: r.duplicate, count: r.count, max: r.max });
  return json({ ok: true, duplicate: r.duplicate, count: r.count, max: r.max, ...publicView(r.ent) });
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  // `Authorization` é obrigatório aqui (authorizeSaveAccess). Sem anunciá-lo, o
  // preflight de qualquer chamada cross-origin (overlay Electron em `file://`)
  // é bloqueado pelo navegador e a falha aparece como erro de rede.
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const json = (obj, status = 200) => Response.json(obj, { status, headers: CORS });

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const saveId = url.searchParams.get('id');
  if (!saveId || !VALID_ID.test(saveId)) return json({ error: 'Invalid save ID' }, 400);
  if (!kv(env)) return json({ error: 'Storage not bound' }, 500);

  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) return json({ error: auth.reason }, authStatus(auth));

  // Conferência de reembolso, no máximo 1×/dia por conta (auditRefunds decide).
  // Fica aqui, e não num cron, porque é o único ponto por onde toda conta ativa
  // passa — e é justamente quem usa o app que precisa perder o benefício
  // reembolsado. Se a loja não responder, o benefício é MANTIDO.
  const { ent } = await auditRefunds(env, saveId, order => {
    // Cortesia não tem loja para perguntar; `false` = válida, mantém. Sem esta
    // linha ela cairia no ramo da Play com `purchaseToken: null`, e a resposta
    // dependeria de como `_billing.js` trata um token que nunca existiu.
    if (order.provider === COURTESY_PROVIDER) return Promise.resolve(false);
    if (order.provider !== 'steam') {
      return isPlayPurchaseVoided(env, { productId: order.productId, purchaseToken: order.purchaseToken });
    }
    // Na Steam há duas origens de benefício, com conferências diferentes:
    // posse do app (tier pago) e microtransação (créditos).
    return String(order.orderId).startsWith('steam:own:')
      ? isSteamOwnershipVoided(env, { orderId: order.orderId })
      : isSteamPurchaseVoided(env, { orderId: order.orderId });
  });

  return json({ ...publicView(ent), adsEnabled: env.ADMOB_SSV_ENABLED === 'true' });
}

export async function onRequestPost({ request, env }) {
  const url = new URL(request.url);
  const action = url.searchParams.get('action');

  // Antes de tudo — inclusive do 500 de KV: a cortesia autentica o ADMIN, não
  // o dono do save, e sem a chave no ambiente ela não existe. Ver a nota no topo.
  if (action === 'grant') return handleGrant(request, env);

  if (!kv(env)) return json({ error: 'Storage not bound' }, 500);

  const body = await request.json().catch(() => null);
  const saveId = body?.id;
  if (!saveId || !VALID_ID.test(saveId)) return json({ error: 'Invalid save ID' }, 400);

  // Gastar crédito alheio seria vandalismo com custo real pro dono.
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) return json({ error: auth.reason }, authStatus(auth));

  if (action === 'spend') {
    const amount = Number(body?.amount);
    // WP5.3 — `opId` é por GESTO. Repetir o mesmo gesto (retry de rede, dois
    // toques, aba duplicada) devolve o mesmo resultado em vez de cobrar de
    // novo dinheiro real.
    const ent = await spendCredits(env, saveId, amount, body?.opId);
    if (!ent) return json({ ok: false, reason: 'insufficient' }, 402);
    return json({ ok: true, ...publicView(ent) });
  }

  if (action === 'rebirth-reset') {
    // Trava 2: a prova mora no save do próprio titular (ver a nota no topo).
    // `kv(env)` já foi conferido acima (500 se ausente); a variável local é o
    // que deixa o typecheck enxergar isso.
    const store = kv(env);
    let state = null;
    try { state = JSON.parse((await store?.get(saveId)) || 'null'); } catch { state = null; }
    const r = state?.rebirth;
    const renasceu = !!r && typeof r === 'object'
      && typeof r.at === 'string' && r.at.length > 0
      && typeof r.fromStage === 'string' && r.fromStage.length > 0;
    if (!renasceu) return json({ ok: false, reason: 'rebirth-not-found' }, 409);

    const { ent, jaFeito } = await resetSpriteLifetimeOnRebirth(env, saveId);
    // `jaFeito` não é erro: retry de rede e duplo toque respondem 200 igual,
    // como o `opId` de `spend`. O que o corpo diz é se ALGO mudou agora.
    return json({ ok: true, jaFeito, ...publicView(ent) });
  }

  if (action === 'ad') {
    // Desligado enquanto não houver verificação real do AdMob — ver nota no
    // topo. Sem isto, `curl` vira máquina de crédito grátis.
    if (env.ADMOB_SSV_ENABLED !== 'true') {
      return json({ ok: false, reason: 'ads-not-configured' }, 501);
    }
    const ent = await grantAdReward(env, saveId);
    if (!ent) return json({ ok: false, reason: 'daily-cap' }, 429);
    return json({ ok: true, ...publicView(ent) });
  }

  // 404 "Not found", o MESMO corpo e status de `handleGrant` sem chave no
  // ambiente. Quando isto era 400 "Unknown action", uma sonda sem chave
  // distinguia `?action=grant` (404) de `?action=qualquer` (400) — e o 404
  // que existia para esconder a rota passava a confirmá-la (achado B1 da
  // segurança, rodada A). Padrão de `metrics.js`: o que não está configurado
  // e o que não existe respondem igual.
  return json({ error: 'Not found' }, 404);
}
