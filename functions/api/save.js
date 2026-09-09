// Cloud save do estado do jogo.
//
// IMPORTANTE — modelo de confiança: este endpoint grava o que o CLIENTE mandar.
// Portanto tudo aqui é dado não confiável. Campos que envolvem dinheiro real
// (`accountTier`, `credits`) são REMOVIDOS do que o cliente envia e servidos a
// partir do registro de entitlement (ver _entitlements.js), que só o servidor
// escreve. Sem isso, bastava editar o localStorage para virar assinante ou se
// dar créditos infinitos.

import { VALID_ID, readEntitlement, publicView } from './_entitlements.js';
import { authorizeSaveAccess } from './_auth.js';
import { kv, kvOrThrow } from './_kv.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  // `Authorization` PRECISA estar aqui: o cliente manda `Bearer <idToken>` e o
  // overlay Electron chama esta URL de OUTRA origem (`file://`), o que dispara
  // preflight. Sem anunciar o header, o navegador bloqueia a chamada antes de
  // ela sair e a falha chega no app como "erro de rede", não como 401.
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/** Campos que o cliente NUNCA define — sempre vêm do entitlement do servidor. */
const SERVER_OWNED_FIELDS = ['accountTier', 'credits'];

/**
 * Teto do save serializado. O KV aceita 25 MB por chave; sem teto nenhum, um
 * cliente com bug (ou alguém mal-intencionado) enche o namespace de graça.
 * 5 MB é ~50× o maior save real observado e ainda cabe sprite embutido.
 */
const MAX_STATE_BYTES = 5 * 1024 * 1024;

/**
 * Prazo do save na nuvem, RENOVADO A CADA ACESSO (decisão do dono, 07/09/2026).
 *
 * O prazo existia como efeito colateral de um literal no `put`, e só a ESCRITA
 * o renovava. Uma leitura não renovava nada: quem abre o app, olha o bicho e
 * fecha sem gerar escrita ia envelhecendo o próprio save até perdê-lo. Isso
 * colide de frente com o guardrail nº 1 do produto — "quem volta encontra
 * saudade, não fatura".
 *
 * Agora a LEITURA também renova, mas de forma preguiçosa: renovar a cada GET
 * custaria uma escrita de KV por leitura. O `put` grava a data em metadata e o
 * GET só reescreve quando o registro passou de `RENEW_AFTER_SECONDS` — no
 * máximo uma escrita extra por mês por save, e o prazo nunca chega perto de
 * vencer para quem usa o app.
 *
 * Save sem metadata é save gravado ANTES desta mudança: renova na primeira
 * leitura, que é exatamente o comportamento desejado para quem estava perto de
 * expirar.
 */
const SAVE_TTL_SECONDS = 86400 * 365;
const RENEW_AFTER_SECONDS = 86400 * 30;

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  // Só o POST tem corpo. Lemos antes de resolver o id porque o id pode vir
  // dele (ver abaixo).
  const body = request.method === 'POST' ? await request.json().catch(() => null) : null;

  // O contrato canônico é `?id=` no query string. Aceitamos também `body.id` no
  // POST por RETROCOMPATIBILIDADE: existem builds já instaladas (o overlay de
  // desktop, e potencialmente APKs antigos) que mandam o id só no corpo. Um
  // servidor que só conserta o cliente deixa essas builds quebradas até o
  // usuário atualizar — e no desktop/Steam isso é "o app nunca salvou".
  // A superfície não aumenta: o id passa pelo MESMO VALID_ID e pela MESMA
  // autorização; e se vierem os dois divergentes, recusamos em vez de escolher.
  const queryId = url.searchParams.get('id');
  const bodyId = typeof body?.id === 'string' ? body.id : null;
  if (queryId && bodyId && queryId !== bodyId) {
    return Response.json({ error: 'Conflicting save ID' }, { status: 400, headers: CORS });
  }
  const saveId = queryId || bodyId;

  if (!saveId || !VALID_ID.test(saveId)) {
    return Response.json({ error: 'Invalid save ID' }, { status: 400, headers: CORS });
  }

  if (!kv(env)) {
    return Response.json({ error: 'Storage not bound — add a KV binding named SOULMON_SAVES (or DIGIAPP_SAVES) in the Cloudflare dashboard' }, { status: 500, headers: CORS });
  }

  // Só o dono do e-mail que gerou este saveId pode ler ou escrever. Enquanto
  // FIREBASE_PROJECT_ID não estiver configurado isto passa direto (ver _auth.js).
  const auth = await authorizeSaveAccess(request, env, saveId);
  if (!auth.ok) {
    return Response.json({ error: auth.reason }, { status: auth.reason === 'forbidden' ? 403 : 401, headers: CORS });
  }

  if (request.method === 'GET') {
    const { value: raw, metadata } = await kvOrThrow(env).getWithMetadata(saveId);
    if (!raw) return Response.json({ found: false }, { headers: CORS });
    // Renovação preguiçosa do prazo — ver SAVE_TTL_SECONDS. Falha aqui não
    // pode derrubar a leitura: o jogador veio buscar o save, e não conseguir
    // esticar o prazo é um problema de amanhã, não de agora.
    const gravadoEm = Number(metadata?.t) || 0;
    if ((Date.now() - gravadoEm) / 1000 > RENEW_AFTER_SECONDS) {
      try {
        await kvOrThrow(env).put(saveId, raw, {
          expirationTtl: SAVE_TTL_SECONDS,
          metadata: { t: Date.now() },
        });
      } catch (err) {
        console.warn('save: renovação de TTL falhou, leitura segue', { saveId, err: String(err) });
      }
    }
    const state = JSON.parse(raw);
    // Sobrepõe com a verdade do servidor — o que estiver gravado no save é
    // apenas um espelho e pode estar desatualizado (ou ter sido forjado).
    const ent = publicView(await readEntitlement(env, saveId));
    state.accountTier = ent.tier;
    state.credits = ent.credits;
    return Response.json({ found: true, state }, { headers: CORS });
  }

  if (request.method === 'POST') {
    // `!body?.state` só barrava falsy. `state: 1` passava e `{ ...1 }` é `{}`:
    // o save inteiro do jogador (dias perfeitos, árvore, inventário) virava um
    // objeto vazio, sem erro nenhum. `state: "oi"` gravava {"0":"o","1":"i"}.
    // Um save é um OBJETO — array e primitivo são recusados, não convertidos.
    const incoming = body?.state;
    if (typeof incoming !== 'object' || incoming === null || Array.isArray(incoming)) {
      console.warn('save: POST recusado, state não é objeto', { saveId, tipo: Array.isArray(incoming) ? 'array' : typeof incoming });
      return Response.json({ error: 'Missing or invalid state' }, { status: 400, headers: CORS });
    }
    const state = { ...incoming };
    for (const field of SERVER_OWNED_FIELDS) delete state[field];
    const serialized = JSON.stringify(state);
    if (serialized.length > MAX_STATE_BYTES) {
      console.warn('save: POST recusado, state acima do teto', { saveId, bytes: serialized.length });
      return Response.json({ error: 'State too large' }, { status: 413, headers: CORS });
    }
    await kvOrThrow(env).put(saveId, serialized, {
      expirationTtl: SAVE_TTL_SECONDS,
      metadata: { t: Date.now() },
    });
    return Response.json({ ok: true }, { headers: CORS });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS });
}
