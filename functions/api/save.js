// Cloud save do estado do jogo.
//
// IMPORTANTE — modelo de confiança: este endpoint grava o que o CLIENTE mandar.
// Portanto tudo aqui é dado não confiável. Campos que envolvem dinheiro real
// (`accountTier`, `credits`) são REMOVIDOS do que o cliente envia e servidos a
// partir do registro de entitlement (ver _entitlements.js), que só o servidor
// escreve. Sem isso, bastava editar o localStorage para virar assinante ou se
// dar créditos infinitos.

import { VALID_ID, readEntitlement, publicView } from './_entitlements.js';
import { authorizeSaveAccess, authStatus } from './_auth.js';
import { verifiedAdmin, ADMIN_CREDITS_DISPLAY } from './_admin.js';
import { kv, kvOrThrow } from './_kv.js';
import { gateTombstone } from './_accountTombstone.js';
import { bondLevelFor } from './_bond.js';
import { sanitizeTalentPicks } from './_talents.js';
import { sanitizeEquipment, sanitizeBitsOrigin } from './_equipment.js';
import { sanitizeForge } from './_forge.js';
import { sanitizeBuildingQuests } from './_buildingQuests.js';
import { sanitizeFocusLoot } from './_focusLoot.js';
import { sanitizeFichaJornada, enforceImmutableFicha } from './_fichaJornada.js';
import { frameIdOrNull } from './_frames.js';
import { avatarIdOrNull } from './_avatares.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';

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
/** Mesmos tetos de `src/utils/cadernoSave.ts` (há teste de paridade). */
const CADERNO_MAX_ENTRIES = 120;
const CADERNO_MAX_CHARS = 2000;
function clampCaderno(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const e of raw) {
    if (!e || typeof e !== 'object') continue;
    if (typeof e.id !== 'string' || !/^[a-z0-9-]{1,40}$/.test(e.id)) continue;
    if (typeof e.day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(e.day)) continue;
    if (!['tres-coisas', 'gratidao', 'aprendi', 'livre'].includes(e.formato)) continue;
    if (typeof e.text !== 'string' || !e.text.trim() || !Number.isFinite(Number(e.at))) continue;
    out.push({ id: e.id, day: e.day, formato: e.formato, text: e.text.slice(0, CADERNO_MAX_CHARS), at: Number(e.at) });
    if (out.length >= CADERNO_MAX_ENTRIES) break;
  }
  return out;
}

/**
 * Molduras de avatar (R8, 04/10/2026) — COSMÉTICA. O servidor só garante a FORMA: `equippedFrame` é um id
 * do catálogo fechado (`_frames.js`) ou `null`; `ownedFrames` é uma lista de ids no formato, sem repetição, com teto. Nunca valida
 * se o jogador "merece" a moldura (rank/loja/conquista são do cliente e não dão poder algum) e nada daqui
 * entra em economia. Mesmos formato e teto de `src/utils/frames.ts` (há teste de paridade).
 */
const FRAME_ID_RE = /^[a-z0-9-]{1,40}$/;
const FRAMES_MAX_OWNED = 200;
/** Perfil (Tarefa C): a moldura EQUIPADA e a foto so valem se estiverem nas LISTAS FECHADAS (`_frames.js`, `_avatares.js`). */

function clampOwnedFrames(raw) {
  if (!Array.isArray(raw)) return [];
  const out = [];
  for (const v of raw) {
    if (typeof v === 'string' && FRAME_ID_RE.test(v) && !out.includes(v)) out.push(v);
    if (out.length >= FRAMES_MAX_OWNED) break;
  }
  return out;
}

const MAX_STATE_BYTES = 5 * 1024 * 1024;
/**
 * PR13 (MEDIO-6): teto do CORPO, conferido ANTES de ler/parsear. O envelope e o state mais um pouco (id, campos soltos).
 * `Content-Length` acima disso = 413 sem ler nada; sem o header, o texto lido e medido antes do `JSON.parse`.
 */
const MAX_BODY_BYTES = MAX_STATE_BYTES + 64 * 1024;
/**
 * Tetos de gravacao (amortecedor de CUSTO, como `_rateLimit.js`: por isolate, nao e controle exato). Por IP (cobrado
 * antes de ler o corpo) e por CONTA (depois da autorizacao). O app grava por debounce, bem abaixo disto.
 */
const SAVE_WRITE_RATE_IP = { limit: 120, windowMs: 60_000 };
const SAVE_WRITE_RATE_ACCOUNT = { limit: 30, windowMs: 60_000 };

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

/**
 * O `f` do metadata (1ª gravação, ms) se for um número positivo e finito; senão `{}` (nunca inventa data).
 * @param {unknown} metadata
 * @returns {{ f?: number }}
 */
function firstSeenMeta(metadata) {
  const f = metadata && typeof metadata === 'object' ? Number(/** @type {any} */ (metadata).f) : NaN;
  return Number.isFinite(f) && f > 0 ? { f } : {};
}
const RENEW_AFTER_SECONDS = 86400 * 30;

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  // Só o POST tem corpo. Lemos antes de resolver o id porque o id pode vir
  // dele (ver abaixo).
  let body = null;
  if (request.method === 'POST') {
    const ipGate = takeToken('save-write-ip', clientKey(request), SAVE_WRITE_RATE_IP);
    if (!ipGate.ok) return tooManyRequests(ipGate.retryAfter, CORS);
    const declared = Number(request.headers.get('content-length'));
    if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
      console.warn('save: POST recusado antes de ler, corpo acima do teto', { bytes: declared });
      return Response.json({ error: 'State too large' }, { status: 413, headers: CORS });
    }
    const text = await request.text().catch(() => '');
    if (text.length > MAX_BODY_BYTES) {
      console.warn('save: POST recusado antes do parse, corpo acima do teto', { chars: text.length });
      return Response.json({ error: 'State too large' }, { status: 413, headers: CORS });
    }
    try { body = JSON.parse(text); } catch { body = null; }
  }

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
    if (auth.reason === 'account-deleted') {
      console.warn('save: recusado, conta apagada (lápide)', { saveIdPrefix: saveId.slice(0, 8), method: request.method });
    }
    return Response.json(auth.reason === 'account-deleted' ? { error: auth.reason, deletedAt: auth.deletedAt } : { error: auth.reason }, { status: authStatus(auth), headers: CORS });
  }

  // CONTA APAGADA → 410, em GET e POST, DEPOIS da autorização (quem não é o
  // dono não descobre daqui que a conta existiu). Sem isto, outro aparelho do
  // titular ainda logado recriava o save 3 s depois da exclusão — ver
  // `_accountTombstone.js`. O POST é recusado ANTES de ler o corpo por
  // tamanho/forma: nada do que vier é gravado sob um saveId com lápide.
  //
  // Desde a QA rodada 2 o portão mora em `authorizeSaveAccess` (toda rota
  // herda). O save confere de novo SÓ quando a autorização não trouxe o
  // veredito (um `authorizeSaveAccess` substituído em teste, por exemplo):
  // este é o endpoint que a lápide existe para proteger, e ele não confia
  // que alguém conferiu por ele. Reabertura por login posterior à exclusão
  // (`auth_time` > `tombstone.at`) segue com a lápide já apagada.
  const tombstone = auth.tombstone ?? await gateTombstone(env, saveId, auth.authTime);
  if (tombstone.deleted) {
    console.warn('save: recusado, conta apagada (lápide)', { saveIdPrefix: saveId.slice(0, 8), method: request.method });
    return Response.json({ error: 'account-deleted', deletedAt: tombstone.at }, { status: 410, headers: CORS });
  }

  if (request.method === 'GET') {
    const { value: raw, metadata } = await kvOrThrow(env).getWithMetadata(saveId);
    if (!raw) return Response.json({ found: false }, { headers: CORS });
    // Renovação preguiçosa do prazo — ver SAVE_TTL_SECONDS. Falha aqui não
    // pode derrubar a leitura: o jogador veio buscar o save, e não conseguir
    // esticar o prazo é um problema de amanhã, não de agora.
    //
    // ⚠️ A renovação REESCREVE O CONTEÚDO — o KV não tem "renovar só o prazo"
    // nem compare-and-set. Um POST que chegue entre o `getWithMetadata` e o
    // `put` daqui é sobrescrito pelo save VELHO, com 200 para os dois lados
    // (`save.concorrencia.qa.test.js`, `04-dados-r2` §3). MITIGAÇÃO, não
    // conserto: reler imediatamente antes do `put` e só renovar se o disco
    // ainda tem o MESMO raw que foi lido. Isso encolhe a janela ao intervalo
    // `get`→`put` (a mesma técnica de `community.js` › `renovarPrazos`); não
    // a fecha. A saída real é a ADR-004 (`revision` + 409), decisão do dono
    // (#52) — e o `it.fails` daquele arquivo continua aberto de propósito.
    const gravadoEm = Number(metadata?.t) || 0;
    if ((Date.now() - gravadoEm) / 1000 > RENEW_AFTER_SECONDS) {
      try {
        const aindaIgual = (await kvOrThrow(env).get(saveId)) === raw;
        if (aindaIgual) {
          await kvOrThrow(env).put(saveId, raw, {
            expirationTtl: SAVE_TTL_SECONDS,
            // `f` (1ª gravação) atravessa a renovação: ela só renova o PRAZO, nunca a data que o teto S1 lê.
            metadata: { t: Date.now(), ...firstSeenMeta(metadata) },
          });
        } else {
          console.info('save: renovação de TTL pulada, conteúdo mudou entre leitura e renovação', { saveIdPrefix: saveId.slice(0, 8) });
        }
      } catch (err) {
        console.warn('save: renovação de TTL falhou, leitura segue', { saveIdPrefix: saveId.slice(0, 8), err: String(err) });
      }
    }
    const state = JSON.parse(raw);
    // Sobrepõe com a verdade do servidor — o que estiver gravado no save é
    // apenas um espelho e pode estar desatualizado (ou ter sido forjado).
    const ent = publicView(await readEntitlement(env, saveId));
    // ADMIN (`_admin.js`): tier efetivo derivado do TOKEN, nunca gravado.
    const { admin } = await verifiedAdmin(env, request, saveId);
    state.accountTier = admin ? 'paid' : ent.tier;
    state.credits = admin ? ADMIN_CREDITS_DISPLAY : ent.credits;
    return Response.json({ found: true, state }, { headers: CORS });
  }

  if (request.method === 'POST') {
    const acctGate = takeToken('save-write', saveId, SAVE_WRITE_RATE_ACCOUNT);
    if (!acctGate.ok) return tooManyRequests(acctGate.retryAfter, CORS);
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
    // Caderno (04/10/2026): dado sensível do titular. O servidor só o ACEITA como lista de entradas no
    // formato do cliente (`utils/cadernoSave.ts`: 120 x 2000 caracteres) e descarta o resto — nunca o
    // lê, interpreta ou envia a IA/métricas. 120 x 2000 (menos de ~1 MB em UTF-8) cabe nos 5 MB.
    if ('caderno' in state) state.caderno = clampCaderno(state.caderno);
    if ('equippedFrame' in state) state.equippedFrame = frameIdOrNull(state.equippedFrame);
    if ('avatarId' in state) state.avatarId = avatarIdOrNull(state.avatarId);
    if ('ownedFrames' in state) state.ownedFrames = clampOwnedFrames(state.ownedFrames);
    // Talentos (Combate v3 / PR7): o vetor e VALIDADO contra o Vinculo do proprio save (`totalXP` -> `bondLevelFor`,
    // o teto de pontos = level). Invalido (id desconhecido, grau a mais, pontos a mais) e DESCARTADO, nunca
    // corrigido. Limite honesto: `totalXP` tambem e escrito pelo cliente (ver `_bond.js`); o teto de 5% do canal
    // de bonus limita o que um XP forjado rende.
    if ('talentPicks' in state) state.talentPicks = sanitizeTalentPicks(state.talentPicks, bondLevelFor(state.totalXP));
    // Equipamento (Combate v3 / PR8): item fora do catalogo, slot forjado e posse repetida sao DESCARTADOS peca a peca; os
    // fragmentos sao clampados. O bonus do duelo e recalculado daqui (`_duel.js`) e o teto de 5% limita um save forjado.
    if ('equipment' in state) state.equipment = sanitizeEquipment(state.equipment);
    if ('forge' in state) state.forge = sanitizeForge(state.forge);
    if ('bitsOrigin' in state) {
      const o = sanitizeBitsOrigin(state.bitsOrigin);
      if (o) state.bitsOrigin = o; else delete state.bitsOrigin;
    }
    // Missao por predio + materiais (07/10/2026): lista fechada de materiais, estoque clampado 0..99, ids de predio so no
    // formato `<area>.<lote>` fora do Mercado. Sem forma = ausente (nunca recusa o save).
    if ('buildingQuests' in state) {
      const q = sanitizeBuildingQuests(state.buildingQuests);
      if (q) state.buildingQuests = q; else delete state.buildingQuests;
    }
    if ('focusLoot' in state) {
      const q = sanitizeFocusLoot(state.focusLoot);
      if (q) state.focusLoot = q; else delete state.focusLoot;
    }
    // `prev` e lido ANTES de serializar: a imutabilidade da ficha da jornada compara com o que ja esta gravado.
    const prev = await kvOrThrow(env).getWithMetadata(saveId);
    // Ficha da jornada (Combate v3 / PR15c): a FORMA e saneada (estagio valido, galhos finitos e com teto, `at` plausivel,
    // `familia` na lista fechada, `plano` recalculado dos galhos) e um estagio JA gravado no servidor nao e sobrescrito.
    // So parseia o gravado quando o campo existe nele (save de 5 MB nao e relido a toa). NUNCA recusa o save: o que nao
    // tem forma vira ausente e o resto do estado segue. Sem o campo no que chegou, nada muda (reset/renascimento o apagam).
    if ('fichaJornada' in state) {
      let guardado;
      if (typeof prev?.value === 'string' && prev.value.includes('"fichaJornada"')) {
        try { guardado = JSON.parse(prev.value).fichaJornada; } catch { guardado = undefined; }
      }
      const { ficha, mexeu } = enforceImmutableFicha(state.fichaJornada, guardado);
      if (mexeu.length) console.warn('save: estagio da fichaJornada ja gravado, mantido o do servidor', { saveId, estagios: mexeu });
      if (ficha) state.fichaJornada = ficha; else delete state.fichaJornada;
    }
    const serialized = JSON.stringify(state);
    // BYTES, nao caracteres (PR13): UTF-8 chega a 3 bytes por caractere. So mede de verdade quando o pior caso poderia estourar.
    const bytes = serialized.length * 3 > MAX_STATE_BYTES ? new TextEncoder().encode(serialized).length : serialized.length;
    if (bytes > MAX_STATE_BYTES) {
      console.warn('save: POST recusado, state acima do teto', { saveId, bytes });
      return Response.json({ error: 'State too large' }, { status: 413, headers: CORS });
    }
    // `f` = a data da 1ª gravação deste save, em ms (teto S1 do duelo, `_duel.js` › `maxLevelFor`). É o ÚNICO
    // relógio que o cliente não toca: o servidor a escreve e a preserva em toda gravação seguinte. Save sem `f`
    // (gravado antes desta regra) recebe `f = agora` aqui. NADA vai para o state: a contagem de campos não muda.
    const f = firstSeenMeta(prev?.metadata).f ?? Date.now();
    await kvOrThrow(env).put(saveId, serialized, {
      expirationTtl: SAVE_TTL_SECONDS,
      metadata: { t: Date.now(), f },
    });
    return Response.json({ ok: true }, { headers: CORS });
  }

  return Response.json({ error: 'Method not allowed' }, { status: 405, headers: CORS });
}
