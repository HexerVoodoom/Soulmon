// Conta do titular — EXPORTAÇÃO e EXCLUSÃO dos dados guardados no servidor.
//
// Por que este arquivo existe: até aqui não havia nenhum caminho para o
// jogador levar embora ou apagar o que o servidor guarda dele. `save.js`
// respondia 405 a DELETE e não existia rota de exportação. O inventário de
// dados do run 01 lista o que está em jogo — e parte é texto livre sobre a
// vida da pessoa (`soulGoal`/`soulStruggle`).
//
// ## Modelo de confiança — leia antes de mexer
//
// As duas rotas usam `requireVerifiedOwner` (`_auth.js`), que é **FAIL-CLOSED**,
// e NÃO o `authorizeSaveAccess` fail-open que o resto do app usa. O `saveId` é
// SHA-256 do e-mail por algoritmo público: com fail-open, `delete-confirm` seria
// "apague a conta de qualquer um cujo e-mail eu conheça". Enquanto
// `FIREBASE_PROJECT_ID` estiver desligado, as duas rotas respondem 503
// `auth-unavailable`. É deliberado: **indisponível é melhor que perigosa.**
//
// ## Exclusão — o desenho, e o que sobrevive
//
//  APAGA        save (`<saveId>`), `profile:<saveId>`, `pid:<pid>`,
//               `rank:<season>:<saveId>` (todas as seasons), `gifts:<saveId>`,
//               e a menção ao usuário na lista de amigos de terceiros.
//  MINIMIZA     `ent:<saveId>` — some o que é USO (`aiLifetime`, `adDate`,
//               `adCount`) e ficam os campos de DINHEIRO.
//  SOBREVIVE    `ord:<orderId> -> saveId` e o `orderDetails` do entitlement.
//               Motivo técnico, não jurídico: `ord:` é a trava que faz um
//               comprovante valer por UMA conta (`_entitlements.js:claimOrder`).
//               Apagá-lo faz um recibo virar N contas pagas — e, do lado do
//               titular, é o que permite que ele volte e RESTAURE a compra
//               (mesmo e-mail -> mesmo saveId -> o `ord:` reconhece o dono).
//               Apagar aqui destruiria o direito pago junto com o dado.
//               ⚠️ Esta escolha está ENDEREÇADA AO DONO, não decidida aqui.
//               Nenhuma norma é afirmada neste arquivo.
//  FORA DO      Assinaturas de push (`push:*`, `fcm:*`): a chave é hash do
//  ALCANCE      endpoint/token e o registro NÃO guarda o saveId, então o
//               servidor não consegue achar as do titular a partir dele. O
//               cliente tem que chamar `DELETE /api/subscribe` e
//               `DELETE /api/fcm-subscribe`. A resposta DECLARA isso em vez de
//               deixar a pessoa achar que já foi.
//
// ## Confirmação — handshake de duas chamadas
//
// Exclusão é irreversível, então uma chamada só não basta (um retry cego de
// cliente apagaria a conta). `action=delete-request` devolve um token efêmero
// (`del:<saveId>`, TTL 15 min) e o INVENTÁRIO do que será apagado;
// `action=delete-confirm` só executa com aquele token. A UI vem depois.

import { VALID_ID, ENT_PREFIX, ORDER_PREFIX, readEntitlement } from './_entitlements.js';
import { requireVerifiedOwner } from './_auth.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

const DEL_PREFIX = 'del:';
/** Janela do token de confirmação. */
const CONFIRM_TTL_SECONDS = 15 * 60;
/** Teto de páginas varridas por prefixo. Varredura não é infinita. */
const MAX_SCAN_PAGES = 20;

const json = (data, status = 200) => Response.json(data, { status, headers: CORS });

/** Log estruturado. NUNCA o saveId inteiro (deriva do e-mail) nem o e-mail. */
function log(event, saveId, extra = {}) {
  console.log(JSON.stringify({ event, saveIdPrefix: String(saveId).slice(0, 8), ...extra }));
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

/** pid público — MESMA derivação de community.js. Footgun 9: se mudar lá, muda aqui. */
async function publicIdFor(saveId) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon-pub:${saveId}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

/**
 * Lista chaves por prefixo, com teto de páginas.
 * @returns {Promise<string[]>}
 */
async function listPrefix(env, prefix) {
  /** @type {string[]} */
  const out = [];
  let cursor;
  for (let page = 0; page < MAX_SCAN_PAGES; page++) {
    const res = await env.DIGIAPP_SAVES.list({ prefix, cursor, limit: 1000 });
    for (const k of res.keys || []) out.push(k.name);
    if (res.list_complete || !res.cursor) break;
    cursor = res.cursor;
  }
  return out;
}

/**
 * Mascara o comprovante de compra na EXPORTAÇÃO. O `purchaseToken` é um
 * portador: quem o tem fala com a loja em nome da compra. Exportar o dado da
 * pessoa não é motivo para entregar uma credencial num arquivo que ela vai
 * guardar na pasta de downloads. Fica o suficiente para reconhecer a compra.
 */
function maskOrderDetails(details) {
  if (!Array.isArray(details)) return [];
  return details.map(d => ({
    ...d,
    purchaseToken: typeof d?.purchaseToken === 'string' && d.purchaseToken
      ? `***${d.purchaseToken.slice(-4)}`
      : undefined,
  }));
}

/** Texto do produto, PT-BR + EN. Quem está indo embora não leva sermão junto. */
const COPY = {
  exportNote: {
    'pt-BR': 'Isto é tudo que o Soulmon guarda de você nos servidores dele. O que não está aqui está listado em "naoIncluido" — e a maior parte disso nunca saiu do seu aparelho.',
    en: 'This is everything Soulmon keeps about you on its servers. Whatever is not here is listed under "notIncluded" — and most of it never left your device.',
  },
  deleteReady: {
    'pt-BR': 'Está tudo pronto para apagar. Confirme quando quiser — seu bichinho vai sentir sua falta, e a porta fica aberta se você voltar.',
    en: 'Everything is ready to be erased. Confirm whenever you want — your buddy will miss you, and the door stays open if you come back.',
  },
  deleteDone: {
    'pt-BR': 'Pronto, apagamos. Obrigado pelo tempo que você passou aqui — foi bom cuidar de você por um tempo.',
    en: 'Done, it is erased. Thank you for the time you spent here — it was good to look after you for a while.',
  },
  pending: {
    'pt-BR': 'Sem pressa: este pedido vale por 15 minutos. Se ele expirar, é só pedir de novo.',
    en: 'No rush: this request is valid for 15 minutes. If it expires, just ask again.',
  },
  unavailable: {
    'pt-BR': 'Esta função ainda não está disponível — ela liga junto com o login, porque sem login não temos como ter certeza de que é você. Preferimos deixar indisponível a deixar arriscada.',
    en: 'This feature is not available yet — it turns on together with sign-in, because without sign-in we cannot be sure it is you. We would rather leave it unavailable than leave it risky.',
  },
  confirmMissing: {
    'pt-BR': 'Falta confirmar. Peça um token novo em action=delete-request e confirme com ele — é só para ninguém apagar a conta sem querer.',
    en: 'Confirmation missing. Ask for a fresh token at action=delete-request and confirm with it — this is only so nobody erases an account by accident.',
  },
};

/**
 * O que o servidor NÃO tem — declarado sempre, na exportação e na exclusão.
 * Sem isto a pessoa acha que exportou tudo, e não exportou.
 */
const NOT_INCLUDED = [
  {
    what: 'soulmon-profile (localStorage)',
    'pt-BR': 'Seu perfil psicométrico (as 20 perguntas) e seu nome completo, data, hora e local de nascimento NUNCA são enviados ao servidor — vivem só neste aparelho, na chave "soulmon-profile". Não dá para exportá-los daqui, e apagar a conta não os apaga: limpar os dados do app (ou desinstalar) apaga.',
    en: 'Your psychometric profile (the 20 questions) and your full name, date, time and place of birth are NEVER sent to the server — they live only on this device, under the "soulmon-profile" key. They cannot be exported from here, and deleting your account does not delete them: clearing the app data (or uninstalling) does.',
  },
  {
    what: 'push:* / fcm:*',
    'pt-BR': 'Suas inscrições de notificação são guardadas pelo endereço do aparelho, não pela sua conta — o servidor não consegue achá-las a partir dela. O app desfaz a inscrição deste aparelho junto com a exclusão; se você usa o Soulmon em mais de um aparelho, desligue as notificações em cada um.',
    en: 'Your notification subscriptions are stored by device address, not by your account — the server cannot find them from it. The app unsubscribes this device along with the deletion; if you use Soulmon on more than one device, turn notifications off on each.',
  },
  {
    what: 'ord:<orderId>',
    'pt-BR': 'O vínculo entre um comprovante de compra e a conta que o resgatou NÃO é apagado. É o que impede que um mesmo comprovante vire várias contas pagas — e é o que deixa você restaurar a compra se voltar com o mesmo e-mail.',
    en: 'The link between a purchase receipt and the account that redeemed it is NOT deleted. It is what stops one receipt from becoming several paid accounts — and it is what lets you restore your purchase if you come back with the same email.',
  },
  {
    what: 'terceiros / third parties',
    'pt-BR': 'Mensagens que você mandou para o assistente foram processadas por provedores de IA fora daqui. O Soulmon não guarda essas conversas, então elas não estão nesta exportação e esta exclusão não alcança o que estiver do lado deles.',
    en: 'Messages you sent to the assistant were processed by AI providers outside of here. Soulmon does not store those conversations, so they are not in this export and this deletion does not reach whatever is on their side.',
  },
];

/** Junta tudo que o servidor tem sob este saveId. Fonte única da exportação E do inventário. */
async function collect(env, saveId) {
  const kv = env.DIGIAPP_SAVES;
  const pid = await publicIdFor(saveId);

  let state = null;
  try { state = JSON.parse((await kv.get(saveId)) || 'null'); } catch { state = null; }

  let profile = null;
  try { profile = JSON.parse((await kv.get(`profile:${saveId}`)) || 'null'); } catch { profile = null; }

  let gifts = null;
  try { gifts = JSON.parse((await kv.get(`gifts:${saveId}`)) || 'null'); } catch { gifts = null; }

  // `readEntitlement` devolve um registro VAZIO quando não existe — o que é
  // certo para o jogo e errado para exportação. Exportar um entitlement que
  // nunca existiu inventa dado. Por isso a checagem crua antes.
  const entRaw = await kv.get(ENT_PREFIX + saveId);
  const entitlement = entRaw ? await readEntitlement(env, saveId) : null;

  const rankKeys = (await listPrefix(env, 'rank:')).filter(k => k.endsWith(`:${saveId}`));
  /** @type {Array<{ season: string, record: any }>} */
  const ranks = [];
  for (const k of rankKeys) {
    try {
      ranks.push({
        season: k.slice('rank:'.length, k.length - saveId.length - 1),
        record: JSON.parse((await kv.get(k)) || 'null'),
      });
    } catch { /* registro corrompido não impede a exportação do resto */ }
  }

  const pidIndexed = (await kv.get(`pid:${pid}`)) === saveId;

  return { pid, state, profile, gifts, entitlement, ranks, rankKeys, pidIndexed };
}

async function handleExport(env, saveId) {
  const c = await collect(env, saveId);
  log('account.export', saveId, {
    hasState: !!c.state, hasProfile: !!c.profile, ranks: c.ranks.length, hasEntitlement: !!c.entitlement,
  });
  return json({
    format: 'soulmon.account-export/1',
    generatedAt: new Date().toISOString(),
    // O `saveId` sai porque o titular já provou ser dono dele.
    account: { saveId, publicId: c.pid },
    aviso: COPY.exportNote,
    data: {
      // As chaves do objeto são as PRÓPRIAS chaves do KV, para o arquivo ser
      // auditável contra o servidor sem precisar de um mapa à parte.
      [`${saveId} (save)`]: c.state,
      [`profile:${saveId}`]: c.profile,
      [`pid:${c.pid}`]: c.pidIndexed ? saveId : null,
      [`gifts:${saveId}`]: c.gifts,
      [`${ENT_PREFIX}${saveId}`]: c.entitlement
        ? { ...c.entitlement, orderDetails: maskOrderDetails(c.entitlement.orderDetails) }
        : null,
      ranks: c.ranks,
    },
    naoIncluido: NOT_INCLUDED,
  });
}

/** Inventário legível do que a exclusão vai fazer. Mesma fonte que a execução usa. */
function plan(c, saveId) {
  return {
    apaga: [
      c.state ? `${saveId} (save)` : null,
      c.profile ? `profile:${saveId}` : null,
      c.pidIndexed ? `pid:${c.pid}` : null,
      c.gifts ? `gifts:${saveId}` : null,
      ...c.rankKeys,
      'menções a você na lista de amigos de outros jogadores',
    ].filter(Boolean),
    minimiza: c.entitlement ? [`${ENT_PREFIX}${saveId} — sai o uso (IA, anúncios), ficam os campos de compra`] : [],
    sobrevive: Array.isArray(c.entitlement?.consumedOrders)
      ? c.entitlement.consumedOrders.map(o => `${ORDER_PREFIX}${o}`)
      : [],
  };
}

async function handleDeleteRequest(env, saveId) {
  const c = await collect(env, saveId);
  const token = [...crypto.getRandomValues(new Uint8Array(16))]
    .map(b => b.toString(16).padStart(2, '0')).join('');
  await env.DIGIAPP_SAVES.put(
    DEL_PREFIX + saveId,
    JSON.stringify({ token, createdAt: Date.now() }),
    { expirationTtl: CONFIRM_TTL_SECONDS },
  );
  log('account.delete.request', saveId, { hasState: !!c.state });
  return json({
    confirmToken: token,
    expiresInSeconds: CONFIRM_TTL_SECONDS,
    plano: plan(c, saveId),
    naoIncluido: NOT_INCLUDED,
    aviso: COPY.deleteReady,
    prazo: COPY.pending,
  });
}

/** Tempo constante — o 409 não pode virar oráculo de adivinhação do token. */
function tokenMatches(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length || a.length === 0) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function handleDeleteConfirm(env, saveId, body) {
  const kv = env.DIGIAPP_SAVES;

  let pending = null;
  try { pending = JSON.parse((await kv.get(DEL_PREFIX + saveId)) || 'null'); } catch { pending = null; }
  if (!pending || !tokenMatches(pending.token, body?.confirmToken)) {
    log('account.delete.refused', saveId, { reason: 'confirmation-required' });
    return json({ error: 'confirmation-required', aviso: COPY.confirmMissing }, 409);
  }

  const c = await collect(env, saveId);
  const executed = plan(c, saveId);

  // 1) O que é do titular e só dele.
  if (c.state) await kv.delete(saveId);
  if (c.profile) await kv.delete(`profile:${saveId}`);
  if (c.pidIndexed) await kv.delete(`pid:${c.pid}`);
  if (c.gifts) await kv.delete(`gifts:${saveId}`);
  for (const k of c.rankKeys) await kv.delete(k);

  // 2) Menções em perfis de terceiros. O saveId da pessoa mora dentro do
  //    `friends[]` alheio — apagar só o que é "dela" deixaria o identificador
  //    espalhado por aí. Varredura limitada (ver MAX_SCAN_PAGES).
  let scrubbed = 0;
  for (const key of await listPrefix(env, 'profile:')) {
    if (key === `profile:${saveId}`) continue;
    let p;
    try { p = JSON.parse((await kv.get(key)) || 'null'); } catch { continue; }
    if (!p || !Array.isArray(p.friends) || !p.friends.includes(saveId)) continue;
    p.friends = p.friends.filter(f => f !== saveId);
    await kv.put(key, JSON.stringify(p), { expirationTtl: 86400 * 365 });
    scrubbed++;
  }

  // 3) Entitlement: MINIMIZADO, não apagado. Ver o cabeçalho — apagar o
  //    registro de compra destrói o direito pago e a trava anti-fraude junto.
  //    O que sai é USO (não prova nada); o que fica é DINHEIRO.
  if (c.entitlement) {
    const ent = c.entitlement;
    await kv.put(ENT_PREFIX + saveId, JSON.stringify({
      tier: ent.tier,
      credits: ent.credits,
      consumedOrders: ent.consumedOrders,
      orderDetails: ent.orderDetails,
      auditedAt: ent.auditedAt,
      aiLifetime: {},
      adDate: '1970-01-01',
      adCount: 0,
      accountDeletedAt: Date.now(),
      updatedAt: Date.now(),
    }));
  }

  await kv.delete(DEL_PREFIX + saveId);

  log('account.delete.done', saveId, {
    deletedKeys: executed.apaga.length,
    scrubbedFriendLists: scrubbed,
    entitlementMinimized: !!c.entitlement,
  });

  return json({
    ok: true,
    executado: { ...executed, listasDeAmigosLimpas: scrubbed },
    naoIncluido: NOT_INCLUDED,
    aviso: COPY.deleteDone,
  });
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const method = request.method;
  if (method !== 'GET' && method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const body = method === 'POST' ? await request.json().catch(() => null) : null;
  const action = url.searchParams.get('action') || body?.action || '';
  const saveId = url.searchParams.get('id') || (typeof body?.id === 'string' ? body.id : null);

  if (!saveId || !VALID_ID.test(saveId)) {
    return json({ error: 'Invalid save ID' }, 400);
  }
  if (!env.DIGIAPP_SAVES) {
    return json({ error: 'Storage not bound — add KV binding DIGIAPP_SAVES in Cloudflare dashboard' }, 500);
  }

  // FAIL-CLOSED, e vem ANTES de qualquer leitura do KV — por isso a resposta a
  // quem não é o dono é idêntica para save existente e inexistente: ninguém
  // descobre daqui se uma conta existe.
  const auth = await requireVerifiedOwner(request, env, saveId);
  if (!auth.ok) {
    log('account.denied', saveId, { action, reason: auth.reason });
    return json({
      error: auth.reason,
      ...(auth.reason === 'auth-unavailable' ? { aviso: COPY.unavailable } : {}),
    }, auth.status);
  }

  if (action === 'export') return handleExport(env, saveId);
  if (method === 'POST' && action === 'delete-request') return handleDeleteRequest(env, saveId);
  if (method === 'POST' && action === 'delete-confirm') return handleDeleteConfirm(env, saveId, body);

  return json({ error: 'Unknown action' }, 400);
}
