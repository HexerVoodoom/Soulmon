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
//               "Sobrevive" quer dizer à EXCLUSÃO, não ao tempo: desde a
//               decisão de retenção do dono os dois têm prazo de 5 anos
//               (`_entitlements.js:RETENTION_TTL_SECONDS`). A exclusão não
//               toca na chave `ord:` — nem para apagar, nem para renovar.
//               Motivo técnico, não jurídico: `ord:` é a trava que faz um
//               comprovante valer por UMA conta (`_entitlements.js:claimOrder`).
//               Apagá-lo faz um recibo virar N contas pagas — e, do lado do
//               titular, é o que permite que ele volte e RESTAURE a compra
//               (mesmo e-mail -> mesmo saveId -> o `ord:` reconhece o dono).
//               Apagar aqui destruiria o direito pago junto com o dado.
//               ⚠️ Esta escolha está ENDEREÇADA AO DONO, não decidida aqui.
//               Nenhuma norma é afirmada neste arquivo.
//  APAGA        Assinaturas de push (`push:*`, `fcm:*`, namespace
//  (ÍNDICE)     `PUSH_SUBSCRIPTIONS`) da conta, via índice inverso
//               `pushidx:<saveId>` (`_pushIdentity.js`; decisão #23 do QA
//               GERAL + `03-arquitetura-r1.md` §2). Custo fixo: <= 1 + 16x2 + 1
//               operações. Cada membro é CONFERIDO (`rec.saveId === saveId`)
//               antes de apagar — o índice aponta, não prova. Só quando o
//               índice NÃO EXISTE (conta inscrita antes de 22/09/2026 e que
//               nunca reabriu o app) cai na varredura antiga por prefixo, com
//               teto (`MAX_SCAN_PAGES`) — compat, não caminho principal.
//               ⚠️ Registro SEM `saveId` (gravados até 21/09/2026) fica FORA
//               DO ALCANCE nos dois caminhos: o cliente continua chamando
//               `DELETE /api/subscribe` e `DELETE /api/fcm-subscribe` no
//               aparelho, e a resposta DECLARA isso em vez de deixar a pessoa
//               achar que já foi. Nunca se apaga por palpite (hash de e-mail
//               não está no registro; um `petName` igual não prova nada).
//  APAGA        Sprites gerados por IA: `sprite:img:<saveId>:<formId>` (cache
//               de resultado), `sprite:lock:<saveId>:<formId>` (lock de
//               geração) e os binários `sprite:blob:<token>` que os caches
//               apontam (o token está na URL `/api/sprite-image?k=<token>`
//               gravada no cache — ver `generate-sprite.js`). ⚠️ Blob cujo
//               cache NÃO gravou (falha declarada em `generate-sprite.js`,
//               "falha ao cachear o resultado") fica ÓRFÃO: a chave é token
//               aleatório, sem ligação com a conta, e não há como achá-lo.
//               Declarado em `NOT_INCLUDED`.
//  GRAVA        Lápide `del:done:<saveId>` (30 dias, `_accountTombstone.js`)
//               ANTES da primeira destruição: `save.js` responde 410 a GET e
//               POST enquanto ela viver, para outro aparelho logado não
//               recriar o save 3 s depois (achado 03-arquitetura §2.5).
//
// ## Ordem de `delete-confirm` — o que pode falhar vai primeiro
//
// Princípio (03-arquitetura §2.4): enquanto nada foi destruído, uma falha
// devolve 500 e o titular tenta de novo com o mesmo token (15 min). Depois
// da primeira destruição irreversível, nada mais lança — cada passo é
// `try/catch` que só reporta em `executado.falhou`, e a resposta é 200.
//
//   0. token · 1. `collect` · 2. LÁPIDE · 3. `friends[]` alheios (varredura —
//   pode estourar; ainda reversível, e a lápide é desfeita se estourar) ·
//   4. push por índice · 5. sprites · 6. minimizar `ent:` · 7. `rank:*`,
//   `gifts:`, `pid:`, `profile:` · 8. **o save** · 9. token de confirmação.
//
// O save é o ÚLTIMO a cair: é o que a pessoa mais quer ver sumir, e é também
// o que, apagado cedo, deixava o retry encontrar 404 com o token ainda válido
// e nada mais para apagar.
//
// ## Confirmação — handshake de duas chamadas
//
// Exclusão é irreversível, então uma chamada só não basta (um retry cego de
// cliente apagaria a conta). `action=delete-request` devolve um token efêmero
// (`del:<saveId>`, TTL 15 min) e o INVENTÁRIO do que será apagado;
// `action=delete-confirm` só executa com aquele token. A UI vem depois.

import {
  VALID_ID, ENT_PREFIX, ORDER_PREFIX, RETENTION_TTL_SECONDS, readEntitlement,
} from './_entitlements.js';
import { requireVerifiedOwner } from './_auth.js';
import { kv, kvOrThrow } from './_kv.js';
import { lerIndice, chaveDoIndice } from './_pushIdentity.js';
import { writeTombstone, clearTombstone, TOMBSTONE_TTL_SECONDS } from './_accountTombstone.js';

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
 * @param {object} store  a KV a varrer (padrão: a de saves).
 * @returns {Promise<string[]>}
 */
async function listPrefix(env, prefix, store = kvOrThrow(env)) {
  /** @type {string[]} */
  const out = [];
  let cursor;
  for (let page = 0; page < MAX_SCAN_PAGES; page++) {
    const res = await store.list({ prefix, cursor, limit: 1000 });
    for (const k of res.keys || []) out.push(k.name);
    if (res.list_complete || !res.cursor) break;
    cursor = res.cursor;
  }
  return out;
}

/** Os dois prefixos de inscrição de push, um por canal. Ver `subscribe.js`/`fcm-subscribe.js`. */
const PUSH_PREFIXES = ['push:', 'fcm:'];

/**
 * Apaga as inscrições de push do titular — as que o servidor CONSEGUE ligar a
 * ele, ou seja, as que carregam `saveId` no valor. Ver o cabeçalho ("APAGA
 * (VARREDURA)"). Sem o binding `PUSH_SUBSCRIPTIONS`, não há o que varrer: zero,
 * e não erro — a exclusão do resto não pode depender de um namespace que o
 * ambiente de teste ou preview pode não ter.
 *
 * @returns {Promise<{ deleted: number, scanned: number, via: 'index' | 'scan' | 'none' }>}
 */
async function deletePushSubscriptions(env, saveId) {
  const pushStore = env?.PUSH_SUBSCRIPTIONS;
  if (!pushStore || typeof pushStore.get !== 'function') return { deleted: 0, scanned: 0, via: 'none' };
  let deleted = 0;
  let scanned = 0;
  // Melhor-esforço, como no cliente (`accountData.ts:revokePushBeforeDelete`).
  // Se o namespace de push cair no meio (get/delete rejeitando), deixar o erro
  // subir devolvia 500 — e o que sobrou fica declarado em `naoIncluido`.
  //
  // CAMINHO PRINCIPAL: o índice inverso `pushidx:<saveId>`. Custo fixo.
  try {
    const idx = await lerIndice(pushStore, saveId);
    if (idx.existe) {
      for (const key of Object.keys(idx.keys)) {
        scanned++;
        let rec;
        try { rec = JSON.parse((await pushStore.get(key)) || 'null'); } catch { continue; }
        // O índice APONTA, não prova: a mesma igualdade estrita da varredura.
        // Entrada morta (`null`) ou de outra conta é pulada, nunca apagada.
        if (!rec || rec.saveId !== saveId) continue;
        await pushStore.delete(key);
        deleted++;
      }
      await pushStore.delete(chaveDoIndice(saveId));
      return { deleted, scanned, via: 'index' };
    }
  } catch (err) {
    log('account.delete.push-index-failed', saveId, { deleted, scanned, error: String(err?.message || err) });
    return { deleted, scanned, via: 'index' };
  }

  // FALLBACK (compat): sem índice, varredura por prefixo com teto. Só alcança
  // conta que se inscreveu antes do índice existir e nunca mais abriu o app —
  // quem abriu já foi indexado por `gravarSeMudou`. Continua sendo o caminho
  // caro (um `get` por chave do namespace); a saída é a extinção natural.
  if (typeof pushStore.list !== 'function') return { deleted: 0, scanned: 0, via: 'none' };
  try {
    for (const prefix of PUSH_PREFIXES) {
      for (const key of await listPrefix(env, prefix, pushStore)) {
        scanned++;
        let rec;
        try { rec = JSON.parse((await pushStore.get(key)) || 'null'); } catch { continue; }
        // Igualdade ESTRITA com o saveId inteiro. Prefixo, `petName` ou qualquer
        // outro campo não identificam conta — apagar a inscrição de outra pessoa
        // é cortar o push dela em silêncio.
        if (!rec || rec.saveId !== saveId) continue;
        await pushStore.delete(key);
        deleted++;
      }
    }
  } catch (err) {
    log('account.delete.push-scan-failed', saveId, { deleted, scanned, error: String(err?.message || err) });
  }
  return { deleted, scanned, via: 'scan' };
}

// ── Sprites gerados por IA ──────────────────────────────────────────────────
// Chaves de `generate-sprite.js`: `sprite:img:<saveId>:<formId>` (cache do
// resultado, valor `{ image, provider, at }`), `sprite:lock:<saveId>:<formId>`
// (TTL 120 s) e `sprite:blob:<token>` (binário republicado; o token só existe
// dentro da URL `image` do cache). Os prefixos são REPETIDOS aqui em vez de
// importados porque `generate-sprite.js` não os exporta e importar a rota
// arrastaria o provedor de IA para dentro da exclusão — há teste de paridade
// travando os três literais contra o fonte de lá.
const SPRITE_IMG_PREFIX = 'sprite:img:';
const SPRITE_LOCK_PREFIX = 'sprite:lock:';
const SPRITE_BLOB_PREFIX = 'sprite:blob:';
const SPRITE_TOKEN = /\/api\/sprite-image\?k=([0-9a-f]{32})\b/;

/**
 * Lista o que é de sprite desta conta: caches, locks e os blobs que os caches
 * apontam. As duas listagens são por prefixo COM o saveId — não varrem o
 * namespace, e não há `get` por chave alheia.
 * @returns {Promise<{ imgs: string[], locks: string[], blobs: string[] }>}
 */
async function collectSprites(env, saveId) {
  const store = kvOrThrow(env);
  const imgs = await listPrefix(env, `${SPRITE_IMG_PREFIX}${saveId}:`);
  const locks = await listPrefix(env, `${SPRITE_LOCK_PREFIX}${saveId}:`);
  const blobs = [];
  for (const k of imgs) {
    let rec = null;
    try { rec = JSON.parse((await store.get(k)) || 'null'); } catch { rec = null; }
    const m = typeof rec?.image === 'string' ? SPRITE_TOKEN.exec(rec.image) : null;
    // Só URL da NOSSA rota carrega token de blob. URL do provedor (Higgsfield)
    // não tem blob aqui — fica declarado em NOT_INCLUDED.
    if (m) blobs.push(`${SPRITE_BLOB_PREFIX}${m[1]}`);
  }
  return { imgs, locks, blobs };
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
    'pt-BR': 'Suas inscrições de notificação são guardadas pelo endereço do aparelho, não pela sua conta. O servidor apaga as que conseguiu ligar à sua conta; as que não carregam essa ligação (inscrições feitas por versões antigas do app) só o aparelho desfaz. O app desfaz a inscrição deste aparelho junto com a exclusão; se você usa o Soulmon em mais de um aparelho, desligue as notificações em cada um.',
    en: 'Your notification subscriptions are stored by device address, not by your account. The server erases the ones it could link to your account; the ones without that link (subscriptions made by older app versions) can only be undone by the device. The app unsubscribes this device along with the deletion; if you use Soulmon on more than one device, turn notifications off on each.',
  },
  {
    what: 'sprite:blob:* órfão / imagem no provedor',
    'pt-BR': 'As imagens da sua criatura geradas por IA são apagadas junto com a conta (cache, lock e o arquivo que o cache aponta). Duas coisas ficam fora do alcance: um arquivo cujo registro de cache falhou na hora de gerar (ele tem um nome aleatório, sem ligação com a sua conta, e não há como achá-lo — ele não tem nada seu além da imagem), e a cópia que o provedor de IA guardou quando a imagem veio pela URL dele. A imagem também pode continuar no cache do seu aparelho até você limpar os dados do app.',
    en: 'The AI-generated images of your creature are erased together with the account (cache, lock and the file the cache points to). Two things are out of reach: a file whose cache record failed to be written at generation time (it has a random name with no link to your account, and there is no way to find it — it holds nothing of yours but the image), and the copy the AI provider kept when the image came from its URL. The image may also remain in your device cache until you clear the app data.',
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
  const store = kvOrThrow(env);
  const pid = await publicIdFor(saveId);

  let state = null;
  try { state = JSON.parse((await store.get(saveId)) || 'null'); } catch { state = null; }

  let profile = null;
  try { profile = JSON.parse((await store.get(`profile:${saveId}`)) || 'null'); } catch { profile = null; }

  let gifts = null;
  try { gifts = JSON.parse((await store.get(`gifts:${saveId}`)) || 'null'); } catch { gifts = null; }

  // `readEntitlement` devolve um registro VAZIO quando não existe — o que é
  // certo para o jogo e errado para exportação. Exportar um entitlement que
  // nunca existiu inventa dado. Por isso a checagem crua antes.
  const entRaw = await store.get(ENT_PREFIX + saveId);
  const entitlement = entRaw ? await readEntitlement(env, saveId) : null;

  const rankKeys = (await listPrefix(env, 'rank:')).filter(k => k.endsWith(`:${saveId}`));
  /** @type {Array<{ season: string, record: any }>} */
  const ranks = [];
  for (const k of rankKeys) {
    try {
      ranks.push({
        season: k.slice('rank:'.length, k.length - saveId.length - 1),
        record: JSON.parse((await store.get(k)) || 'null'),
      });
    } catch { /* registro corrompido não impede a exportação do resto */ }
  }

  const pidIndexed = (await store.get(`pid:${pid}`)) === saveId;

  const sprites = await collectSprites(env, saveId);

  return { pid, state, profile, gifts, entitlement, ranks, rankKeys, pidIndexed, sprites };
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
      // Só as CHAVES: o binário sai pela própria URL (`/api/sprite-image?k=`),
      // que o save já carrega em `soulmonStages`. Listar aqui é o que deixa a
      // exportação conferível contra o inventário da exclusão.
      sprites: [...c.sprites.imgs, ...c.sprites.locks, ...c.sprites.blobs],
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
      ...c.sprites.imgs,
      ...c.sprites.locks,
      ...c.sprites.blobs,
      'menções a você na lista de amigos de outros jogadores',
      'inscrições de notificação (push:*/fcm:*) ligadas à sua conta',
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
  await kvOrThrow(env).put(
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
  const store = kvOrThrow(env);

  let pending = null;
  try { pending = JSON.parse((await store.get(DEL_PREFIX + saveId)) || 'null'); } catch { pending = null; }
  if (!pending || !tokenMatches(pending.token, body?.confirmToken)) {
    log('account.delete.refused', saveId, { reason: 'confirmation-required' });
    return json({ error: 'confirmation-required', aviso: COPY.confirmMissing }, 409);
  }

  // 1) Inventário. Ainda nada foi destruído: qualquer erro daqui até o fim do
  //    passo 3 sobe como 500 e o retry com o mesmo token refaz tudo.
  const c = await collect(env, saveId);
  const executed = plan(c, saveId);

  // 2) LÁPIDE, antes de qualquer destruição. A partir daqui `save.js` responde
  //    410 e nenhum aparelho recria o save no meio do processo.
  await writeTombstone(env, saveId);

  // 3) Menções em perfis de terceiros. O saveId da pessoa mora dentro do
  //    `friends[]` alheio — apagar só o que é "dela" deixaria o identificador
  //    espalhado por aí. Varredura limitada (ver MAX_SCAN_PAGES) — é o único
  //    passo que ainda pode ESTOURAR, por isso vem antes da primeira
  //    destruição. Se estourar, a lápide é desfeita: conta que não foi apagada
  //    não pode ficar 30 dias respondendo 410.
  let scrubbed = 0;
  try {
    for (const key of await listPrefix(env, 'profile:')) {
      if (key === `profile:${saveId}`) continue;
      let p;
      try { p = JSON.parse((await store.get(key)) || 'null'); } catch { continue; }
      if (!p || !Array.isArray(p.friends) || !p.friends.includes(saveId)) continue;
      p.friends = p.friends.filter(f => f !== saveId);
      await store.put(key, JSON.stringify(p), { expirationTtl: 86400 * 365 });
      scrubbed++;
    }
  } catch (err) {
    try { await clearTombstone(env, saveId); } catch { /* a lápide expira sozinha em 30 dias */ }
    log('account.delete.aborted', saveId, { step: 'friends-scrub', error: String(err?.message || err) });
    throw err;
  }

  // ── Daqui em diante NADA lança. Cada passo reporta o que falhou. ──────────
  /** @type {string[]} */
  const falhou = [];
  const tentar = async (rotulo, fn) => {
    try { await fn(); } catch (err) {
      falhou.push(rotulo);
      log('account.delete.step-failed', saveId, { step: rotulo, error: String(err?.message || err) });
    }
  };

  // 4) Inscrições de push ligadas à conta (decisão #23), pelo índice.
  //    Reversível na prática: o aparelho se reinscreve na próxima abertura.
  const push = await deletePushSubscriptions(env, saveId);

  // 5) Sprites: caches, locks e os blobs que os caches apontam. Blob antes do
  //    cache — se o processo cair entre os dois, o cache ainda diz onde o blob
  //    está e o retry o encontra; a ordem inversa deixaria o blob órfão.
  for (const k of c.sprites.blobs) await tentar(k, () => store.delete(k));
  for (const k of c.sprites.imgs) await tentar(k, () => store.delete(k));
  for (const k of c.sprites.locks) await tentar(k, () => store.delete(k));

  // 6) Entitlement: MINIMIZADO, não apagado. Ver o cabeçalho — apagar o
  //    registro de compra destrói o direito pago e a trava anti-fraude junto.
  //    O que sai é USO (não prova nada); o que fica é DINHEIRO.
  if (c.entitlement) {
    const ent = c.entitlement;
    await tentar(`${ENT_PREFIX}${saveId}`, () => store.put(ENT_PREFIX + saveId, JSON.stringify({
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
    }), { expirationTtl: RETENTION_TTL_SECONDS }));
    // ↑ O resíduo mínimo também tem prazo, e este é o único caso em que o prazo
    // corre até o fim de verdade: depois da exclusão nada mais escreve neste
    // registro, então nada mais o renova. Sem o TTL, o único artefato que
    // sobrava de uma conta APAGADA seria justamente o imortal.
  }

  // 7) O que é do titular e só dele — chaves já conhecidas, sem varredura.
  for (const k of c.rankKeys) await tentar(k, () => store.delete(k));
  if (c.gifts) await tentar(`gifts:${saveId}`, () => store.delete(`gifts:${saveId}`));
  if (c.pidIndexed) await tentar(`pid:${c.pid}`, () => store.delete(`pid:${c.pid}`));
  if (c.profile) await tentar(`profile:${saveId}`, () => store.delete(`profile:${saveId}`));

  // 8) O SAVE, por último. É o que a pessoa mais quer ver sumir — e é o que,
  //    apagado cedo, deixava o retry encontrar 404 com o token ainda válido.
  if (c.state) await tentar(`${saveId} (save)`, () => store.delete(saveId));

  // 9) O token de confirmação sai só no fim: se algo acima falhou, o retry
  //    dentro dos 15 min ainda é possível — e `collect` recalcula o que sobrou.
  if (falhou.length === 0) {
    await tentar(`${DEL_PREFIX}${saveId}`, () => store.delete(DEL_PREFIX + saveId));
  }

  log('account.delete.done', saveId, {
    deletedKeys: executed.apaga.length,
    scrubbedFriendLists: scrubbed,
    pushSubscriptionsDeleted: push.deleted,
    pushSubscriptionsScanned: push.scanned,
    pushVia: push.via,
    spritesDeleted: c.sprites.imgs.length + c.sprites.locks.length + c.sprites.blobs.length,
    entitlementMinimized: !!c.entitlement,
    tombstoneTtlSeconds: TOMBSTONE_TTL_SECONDS,
    failedSteps: falhou.length,
  });

  return json({
    ok: true,
    executado: {
      ...executed,
      listasDeAmigosLimpas: scrubbed,
      inscricoesDePushApagadas: push.deleted,
      spritesApagados: c.sprites.imgs.length + c.sprites.locks.length + c.sprites.blobs.length,
      // O que NÃO conseguiu apagar, pelo nome da chave. Vazio é o normal;
      // preenchido, o token continua válido e a pessoa pode confirmar de novo.
      falhou,
    },
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
  if (!kv(env)) {
    return json({ error: 'Storage not bound — add a KV binding named SOULMON_SAVES (or DIGIAPP_SAVES) in the Cloudflare dashboard' }, 500);
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
