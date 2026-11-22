// Cloudflare Pages Function — comunidade do Soulmon: perfis públicos,
// Tournament (PvP assíncrono) e Biblioteca (diretório + amigos + presentes).
// Usa o MESMO KV dos saves (`kv(env)`, ver `_kv.js`) com prefixos:
//   profile:<saveId>          → perfil público (nome, pet, formas, pvp, amigos…)
//   pid:<pid>                 → índice reverso da identidade pública → saveId
//   rank:<season>:<saveId>    → pontos de rank da season (season = YYYY-MM)
//   gifts:<saveId>            → presentes de bits pendentes para o jogador
//
// Rotas (query ?action=):
// IDENTIDADE: `id` de ENTRADA é sempre o saveId do PRÓPRIO dono (autenticado).
// Alvos de outra pessoa (`friendId`, `opponentId`, e o `?id=` do `player`)
// chegam como **pid público** e são resolvidos aqui pelo índice `pid:<pid>`.
// Nenhuma resposta pública devolve saveId — há teste travando isso.
//
//   POST profile   {id, name, stage, unlockedStages[], pvpEnabled, createdAt?}
//   GET  players   ?search=&limit=      → diretório público
//   GET  evoFeed                        → faixa de evoluções (feed global curto, sem saveId; `_evoFeed.js`)
//   GET  player    ?id=                 → perfil detalhado
//   GET  opponents ?id=                 → 3 oponentes com pvp habilitado
//   POST duelStart {id, opponentId}     → abre o duelo: gasta a partida e sorteia a semente
//   POST match     {id, opponentId, taps?, forfeit?} → resolve a partida no servidor (taps = toques por BALDE de 3 s)
//                                          (forfeit = desistir do duelo aberto = derrota)
//   GET  sparOpponents ?id=             → TREINO (aba Sparring): 5 oponentes por faixa de Vínculo, sem ranking; cada GET sorteia de novo
//   POST sparStart {id, opponentId, zone?, off?} → abre o treino (semente no servidor, ficha congelada); recusa 409 sem ticket
//   POST sparBuyTicket {id, zone?, off?} → ticket EXTRA (+20 partidas sem Honra, 3/dia; o app cobra 30 Bits ganhos)
//   POST sparMatch {id, opponentId, taps?, forfeit?, seed?, zone?, off?} → resolve; não ranqueia; vitória rende 1–2 de Honra (teto 20/dia do jogador)
//   GET  rank      ?season=             → top 50 da season (+ `myPlace`, a posição REAL, só com `&id=` autorizado)
//   GET  seasonResult ?season=          → top 3 (para troféus)
//   GET  seasonHistory ?id=             → colocação do jogador em cada temporada encerrada (+ melhor e a última); só o dono
//                                          (GM/admin fora de todo ranking do Torneio: `_rankAdmin.js`)
//   POST closeSeason {season, adminKey} → fecha a season: dá troféu (top 3)
//   GET  trophies  ?id=&claim=1         → troféus pendentes do jogador (e zera)
//   POST friends   {id, friendId, remove?} → ENVIA convite (a pessoa aceita); remove desfaz nos dois lados. Até 20 amigos (§243)
//   POST friendAccept {id, friendId, decline?} → aceita/recusa convite recebido
//   GET  friendsState ?id=   → amigos, convites, presentes de hoje e histórico (só o dono)
//   POST friendsSeen  {id}   → marca o histórico de presentes como visto
//   POST friendsMigrate {adminKey, cursor?} → espelha amizades antigas (idempotente)
//   POST gift      {id, friendId}      → 20 bits (1x/dia por amigo; grátis; limite contado no servidor)
//   GET  gifts     ?id=&claim=1        → lê (e zera) presentes pendentes (legado, destrutivo)
//   GET  gifts     ?id=&claim=1&ack=1  → entrega SEM apagar; resposta `{ gifts, ack: true }` (L03-01)
//   POST giftsAck  {id, gids[]}        → o cliente confirma o crédito; só aqui o servidor apaga (idempotente)
// COOPERATIVO (Fase 4.3 — `docs/PLANO-COOP.md`) — desde o WPG-1 são ALIASES de
// `guild.js` (`COOP_ALIASES`), respondendo no envelope antigo `{ group }`:
//   POST coopCreate  {id, name}        → cria o grupo e devolve o código de convite
//   POST coopJoin    {id, code}        → entra num grupo com vaga
//   GET  coop        ?id=              → o grupo de quem pergunta (ou null)
//   POST coopCheckin {id}              → "apareci hoje" (idempotente no dia)
//   POST coopLeave   {id}              → sai, sem penalidade e sem confirmação

import { lerIndice, indexarPontos, completarIndice, podarIndice, ordenar } from './_rankIndex.js';
import { adminSaveIds } from './_rankAdmin.js';
import { historicoDoJogador, registrarColocacao } from './_seasonHist.js';
import { authorizeSaveAccess, authStatus } from './_auth.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { bondLevelOf } from './_bond.js';
import { gateFor } from './_gates.js';
import { BB_LOCKED_MESSAGE } from './_velado.js';
import { ehViolacaoDeChave } from './_entitlements.js';
import { kv, kvOrThrow } from './_kv.js';
import {
  PID_PREFIX, legacyPidFor, newPid, ensurePid, indexPublicId,
  getProfile, putProfile, pidSoLeitura, nickKey, claimNick, saveIdForPublicId, nickFoldPrefix, foldNome, saveIdDaChaveDobrada,
} from './_profile.js';
import { secretEquals } from './metrics.js';
import { FRIEND_INVITE_HOURLY, contarConviteDoDia, marcarRecusa, parBloqueado, segundosAteAmanhaUtc } from './_conviteLimite.js';
import { ackMail, claimMail, deleteMail, enqueueInvite, enqueueMail, falhaDaCarta, markRead, readMail, removerConvitesDe } from './_mensageiro.js';
import { agendarSimuladosDia, stripSimulated, isSimuladoId, spriteVivoDoSimulado, petNameDoSimulado, formaVista } from './_simulados.js';
import { COOP_ALIASES, handleGuild } from './guild.js';
import {
  MAX_FRIENDS, MAX_IN, MAX_OUT, GIFT_BITS, lerConvites, gravarConvites, ligarAmizade, desfazerAmizade, espelharAmizades,
  presentesDeHoje, marcarPresenteDeHoje, reivindicarPresenteDoDia, lerNotas, anotarPresente, marcarNotasVistas, tzDe, diaDe, lembrarTz, reservarRecebimento, GIFT_DAILY_CAP,
} from './_amigos.js';
import { duelSide, maxLevelFor, simulateDuel, DUEL_PENDING_MS, DUEL_SAVE_MAX_CHARS } from './_duel.js';
import { HONRA_PONTOS_VITORIA, HONRA_PONTOS_DEFESA, ganhoDePontos, ganhoPorRank } from './_honra.js';
import { sanitizarNomeDeGuilda } from './_coop.js';
import { nomeEspecialValido, ESPECIAL_NOME_COOLDOWN_MS } from './_especialNomeRegra.js';
import { pickRankedOpponents } from './_rankedPick.js';
import { fixarTzTreino, pickSparOpponents, bondELevelOf, grantSparHonor, readSparHonorUsed, readSparTicket, buySparTicket, spendSparMatch, sparTicketStatus, sparPendingKey, sparDoneKey, SPAR_PICKS, SPAR_SCAN_MAX, SPAR_PENDING_TTL_S, TREINO_TICKET_MATCHES } from './_treino.js';
import { loadDuelSide as loadDuelSideShared, loadDuelSideWithSprite } from './_duelLoad.js';
import { avatarIdOrNull } from './_avatares.js';
import { artLineOrNull, spriteUrlOrNull } from './_artLine.js';
import { formsFromSaveState } from './_formHistory.js';
import { frameIdOrNull } from './_frames.js';
import { EVO_FEED_KEY, EVO_FEED_VIEW, EVO_FEED_BLOB_TTL_S, peakOf, parseStage, decideEvo, buildEvent, readFeed, pushEvent, purgeFeedOf, liveFeed, publicEvent } from './_evoFeed.js';
import { flagOn } from './_killSwitch.js';
import { isStrayProfile, strayView, STRAY_POOL_MAX, markStrayIfInactive, strayFieldsOf, strayRecoveryProgress, playerDayOf, STRAY_RECOVERY_DAYS } from './_strays.js';
import { recordMissionEvent } from './_missionEvents.js';
import { nomeDaGuildaDe, campoGuilda, comGuildas } from './_guildaNome.js';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  // `Authorization` é obrigatório nas 6 ações que passam por denyUnlessOwner.
  // Ver comentário igual em save.js: sem isto o preflight cross-origin morre.
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const VALID_ID = /^[a-zA-Z0-9_-]{8,64}$/;
/** PR13 (BAIXO B1): atributo publico = numero FINITO e nao negativo (`Infinity`/`1e999` virava `null` no JSON). */
const attrFinito = (v) => { const n = Number(v); return Number.isFinite(n) && n > 0 ? n : 0; };
const MATCHES_PER_DAY = 5;
/** Prazo da marca `closed:<season>` ("já premiei"). Ver o fechamento de season. */
/** L03-01: validade da trava D1 de um presente entregue em modo ack (10 min). Sem `giftsAck` nesse prazo, outro aparelho pode receber de novo. */
export const GIFT_ACK_LEASE_MS = 10 * 60 * 1000;
export const CLOSED_SEASON_TTL = 86400 * 400;

const json = (obj, status = 200) => Response.json(stripSimulated(obj), { status, headers: CORS });

/**
 * Serializa `duelStart`/`match` POR CONTA (PR13, ALTO-1). Sem isto, 3 `duelStart` em paralelo liam o MESMO
 * `matchesToday`, todos passavam e devolviam 3 sementes por uma cota. A fila encadeia as chamadas da mesma `id` no
 * isolate: a 2a le o rank que a 1a ja gravou (com o duelo aberto) e e recusada.
 * ⚠️ LIMITE HONESTO: e por ISOLATE. O KV nao tem compare-and-set e e eventualmente consistente; cliente que espalhe as
 * chamadas por isolates/colos diferentes ainda abre uma janela. Fecha-la de verdade exige Durable Object por conta
 * (nao provisionado). Esta fila fecha o cenario do relatorio (rajada paralela da mesma conta no mesmo ponto de presenca).
 */
const duelLocks = new Map();
async function withDuelLock(key, fn) {
  const prev = duelLocks.get(key) || Promise.resolve();
  let release = () => {};
  const gate = new Promise(r => { release = () => r(undefined); });
  const tail = prev.then(() => gate);
  duelLocks.set(key, tail);
  await prev;
  try { return await fn(); } finally {
    release();
    if (duelLocks.get(key) === tail) duelLocks.delete(key);
  }
}

// ── Teto de custo ────────────────────────────────────────────────────────────
// Duas classes, porque o custo delas é diferente em uma ordem de grandeza:
// `players`/`opponents`/`rank` varrem até 300 chaves do KV por chamada; as
// demais leem uma ou duas. Ver `_rateLimit.js` para o que este teto NÃO é.
// sparOpponents (Treino, 10/11/2026): lista até 300 chaves e lê até 120 perfis + 120 SAVES inteiros (Vínculo) por chamada, sem cache
// de borda (cada GET sorteia de novo). No teto leve (120/min/IP) eram ~30 mil leituras de KV por minuto por IP. Segurança, rodada 1.
// `names` SAIU daqui (§346, 13/11/2026): é 1 `list` de no máximo 8 chaves + até 16 `get` — custo de ação leve —, e o app a chama a
// cada pausa da digitação no campo "convidar amigo". Contada como varredura, digitar um apelido gastava o teto da busca que o próprio
// "Convidar" faz logo depois.
const HEAVY_ACTIONS = new Set(['players', 'opponents', 'rank', 'seasonResult', 'strays', 'evoFeed', 'sparOpponents']); // evoFeed: até 20 perfis por leitura
const HEAVY_LIMIT = { limit: 20, windowMs: 60_000 };   // 20 varreduras/min/IP
const LIGHT_LIMIT = { limit: 120, windowMs: 60_000 };  // 2/s/IP no resto

// Respostas públicas e iguais para todo mundo — cacheáveis na borda. Cada acerto
// de cache é uma varredura de 300 chaves de KV que NÃO acontece. `opponents` e
// `player` ficam de fora: o primeiro é aleatório por chamada, o segundo é por
// alvo e tem cardinalidade alta demais para valer cache.
const CACHEABLE_ACTIONS = new Set(['players', 'rank', 'seasonResult', 'strays', 'evoFeed']);
const EDGE_TTL_SECONDS = 60;
const today = () => new Date().toISOString().slice(0, 10);
const currentSeason = () => new Date().toISOString().slice(0, 7); // YYYY-MM


// ── Identidade pública ───────────────────────────────────────────────────────
// O `saveId` É A CHAVE DO CLOUD SAVE. Publicá-lo no diretório entregava, sem
// autenticação nenhuma, a chave de leitura e ESCRITA do save de todo mundo:
// `GET /api/save?id=<saveId>` devolvia o save inteiro e `POST` o sobrescrevia.
// Com `Access-Control-Allow-Origin: *`, isso funcionava até de uma página
// aberta no navegador da vítima.
//
// A identidade social passa a ser um `pid` derivado — um caminho só de ida:
// dá para calcular o pid a partir do saveId, nunca o contrário. O mapa reverso
// (`pid:<pid>` → saveId) vive no servidor e é o único jeito de resolver um
// alvo. Nada no cliente precisa saber disso: ele já tratava o id alheio como
// um token opaco que devolve ao servidor.





// `saveIdForPublicId` (pid → saveId) mora em `_profile.js` desde 13/11/2026: o convite do clã (`guild.js`) resolve o alvo pela MESMA régua.

/**
 * pid público de um saveId que NÃO é o autor da requisição (amigo, dono de uma
 * linha do ranking). Só o perfil sabe o pid — não há mais como calcular.
 * `null` quando aquele saveId não tem perfil.
 */
async function pidDeSaveId(env, saveId, { semEscondidos = false } = {}) {
  const p = await getProfile(env, saveId);
  if (semEscondidos && isHidden(p)) return null;
  return p ? await ensurePid(env, p) : null;
}

/**
 * Versão pública de um perfil. É o ÚNICO lugar que monta o que sai daqui —
 * assim não existe rota que devolva o saveId por esquecimento.
 */
/**
 * Vista pública de um perfil. `extra` são campos que só alguns chamadores
 * acrescentam (ranking, amizades), por isso o retorno é aberto.
 * @param {Record<string, any>} [extra]
 * @returns {Promise<Record<string, any>>}
 */
async function publicProfile(env, p, extra = {}) {
  const pid = await ensurePid(env, p);
  const sUrl = spriteUrlOrNull(p.spriteUrl);
  return {
    id: pid,
    name: p.name, petName: petNameDoSimulado(p), stage: p.stage,
    avatarId: avatarIdOrNull(p.avatarId), frameId: frameIdOrNull(p.frameId), artLine: artLineOrNull(p.artLine),
    ...(/^[a-z][a-z0-9_-]{0,31}$/.test(String(p.element ?? '')) ? { element: p.element } : {}),
    ...(sUrl ? { spriteUrl: sUrl } : {}),
    // Nome do especial escolhido pelo jogador: revalidado na SAÍDA (perfil antigo ou KV editado nunca vaza texto fora da regra).
    ...(nomeEspecialValido(p.especialNome) ? { especialNome: nomeEspecialValido(p.especialNome) } : {}),
    unlockedStages: p.unlockedStages, pvpEnabled: p.pvpEnabled,
    // ⚰️ `tasksDone` NÃO sai daqui (WP4.11, exposição E3, proibição #21).
    // "X tarefas feitas" de outro jogador é score de vida real num diretório
    // pesquisável — e como o corte tem de ser no SERVIDOR e não na tela, o
    // campo simplesmente não trafega: uma UI futura não consegue reintroduzi-lo
    // por descuido. `daysPlaying` fica: é duração, só cresce, e não ordena
    // ninguém contra ninguém.
    daysPlaying: Math.max(1, Math.floor((Date.now() - (p.createdAt || Date.now())) / 86400000) + 1),
    ...extra,
  };
}
// (`async function getProfile` e `putProfile` moram em `_profile.js` desde o WPG-1;
// esta linha também delimita o fim de `publicProfile` para `PlayerDetailModal.semMetrica`.)

/**
 * Opt-out da lista PÚBLICA do Torneio (TORC-5, 02/10/2026). `publicHidden` mora
 * no perfil, por conta (saveId), e é decidido pela pessoa em Configurações.
 * Escondido = o apelido, o Soulmon e o resto da vista pública NÃO saem em
 * NENHUMA rota para terceiros: diretório, perfil, oponentes, ranking, presente
 * e amizade. Esta é a ÚNICA régua — rota nova que sirva dado de outra pessoa
 * passa por aqui, ou o teste `community.publicOptOut` reprova.
 */
const isHidden = p => !!p && p.publicHidden === true;

/** Quantas leituras de KV disparar juntas (Torneio: `opponents` e `rank`). Lotes, não tudo de uma vez: o Worker limita conexões simultâneas. */
const LOTE_KV = 25;
function emLotes(itens, n) {
  const out = [];
  for (let i = 0; i < itens.length; i += n) out.push(itens.slice(i, i + n));
  return out;
}

async function getRank(env, season, id) {
  const raw = await kvOrThrow(env).get(`rank:${season}:${id}`);
  return raw ? JSON.parse(raw) : { points: 0, wins: 0, losses: 0, day: today(), matchesToday: 0 };
}
async function putRank(env, season, id, rec) {
  // `metadata.pts` deixa o preenchimento do índice (`_rankIndex.js`) ler os pontos pelo `list`, sem um `get` por linha.
  await kvOrThrow(env).put(`rank:${season}:${id}`, JSON.stringify(rec), { expirationTtl: 86400 * 120, metadata: { pts: Number(rec?.points) || 0 } });
  // GM/admin luta e tem a linha (cota diária), mas NUNCA entra na ordem da season (`_rankAdmin.js`).
  if (!(await adminSaveIds(env)).has(id)) await indexarPontos(env, season, id, rec?.points);
}
/** Reroll dos 3 oponentes (27/10/2026): UM por intervalo entre combates. Chave própria (não toca o `rank:`: não cria linha
 *  no ranking nem corre contra o `putRank` de uma partida). Nasce no reroll, morre em `settleMatch`; TTL de 1 dia por segurança. */
const rerollKey = (id) => `reroll:${id}`;
// Falha do KV PROPAGA (Antislop P1, item 13, §374): tratá-la como "não usado" liberava um 2º reroll entre combates.
const rerollUsado = async (env, id) => !!(await kvOrThrow(env).get(rerollKey(id)));
/** Orçamentos de subrequest do índice da season (`_rankIndex.js`): `get`s de preenchimento por leitura e linhas relidas. */
const RANK_INDEX_BUDGET = 100;
const RANK_SCAN_MAX = 150;
const CLOSE_INDEX_BUDGET = 500;
const CLOSE_SCAN_MAX = 40;
async function listPrefix(env, prefix, limit = 100) {
  const out = [];
  let cursor;
  do {
    const page = await kvOrThrow(env).list({ prefix, cursor, limit: 1000 });
    for (const k of page.keys) {
      out.push(k.name);
      if (out.length >= limit) return out;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out;
}

/** Busca de jogadores (§321): mínimo de caracteres, máximo de resultados, chaves lidas por chamada, teto do termo e teto POR CONTA. */
export const PLAYER_SEARCH_MIN = 2;
export const PLAYER_SEARCH_MAX = 10;
export const PLAYER_SEARCH_SCAN = 30;
export const PLAYER_SEARCH_Q_MAX = 24;
export const PLAYER_SEARCH_LIMIT = { limit: 30, windowMs: 60_000 };
/** Páginas de 1000 nomes de chave lidas por busca (custo de LISTA, sem `get`) e teto de candidatos que viram `get`. */
const NICK_SCAN_PAGES = 10;
const NICK_CANDIDATOS = 120;
const BACKFILL_LOTE = 40;
/** Chaves `nick:` cujo apelido contém o termo (prefixo primeiro). `truncated` = o índice é maior que a varredura permitida. */
async function buscarNicks(env, termo) {
  const inicio = [];
  const meio = [];
  let cursor;
  let paginas = 0;
  let truncated = false;
  do {
    const page = await kvOrThrow(env).list({ prefix: 'nick:', cursor, limit: 1000 });
    paginas++;
    for (const k of page.keys ?? []) {
      let n;
      try { n = decodeURIComponent(String(k.name).slice(5)); } catch { continue; }
      if (!n.includes(termo)) continue;
      (n.startsWith(termo) ? inicio : meio).push(k.name);
    }
    cursor = page.list_complete ? undefined : page.cursor;
    if (cursor && (paginas >= NICK_SCAN_PAGES || inicio.length >= NICK_CANDIDATOS)) { truncated = paginas >= NICK_SCAN_PAGES && inicio.length < NICK_CANDIDATOS; break; }
  } while (cursor);
  return { nickKeys: [...inicio, ...meio].slice(0, NICK_CANDIDATOS), truncated };
}

/**
 * Chaves `nick:` cujo apelido, DOBRADO (`foldNome`: sem acento, sem caixa), COMEÇA com o termo já dobrado. Rede do `playerSearch`
 * (§356) para quem ainda não está no índice `nickf:`. Lê só os NOMES das chaves (sem `get`), no máximo `NICK_SCAN_PAGES` páginas,
 * e devolve no máximo `max` chaves.
 */
async function buscarNicksPorInicioDobrado(env, termoDobrado, max) {
  const out = [];
  let cursor;
  let paginas = 0;
  do {
    const page = await kvOrThrow(env).list({ prefix: 'nick:', cursor, limit: 1000 });
    paginas++;
    for (const k of page.keys ?? []) {
      let n;
      try { n = decodeURIComponent(String(k.name).slice(5)); } catch { continue; }
      if (!foldNome(n).startsWith(termoDobrado)) continue;
      out.push(k.name);
      if (out.length >= max) return out;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor && paginas < NICK_SCAN_PAGES);
  return out;
}

// (`nickKey` e `claimNick` — apelido único — moram em `_profile.js` desde o M11, para o motor dos simulados reservar nicks pela MESMA régua.)

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

/**
 * Portão de custo à frente do roteador. Ordem de propósito:
 *   1. cache de borda — se acertar, a resposta NÃO custa leitura de KV;
 *   2. teto por IP — o teto PESADO só é cobrado de quem vai mesmo varrer o KV;
 *   3. handler real.
 *
 * ⚠️ A ordem já foi a inversa (teto antes do cache) e isso era um falso positivo
 * de graça: um acerto de cache custa ~zero e mesmo assim gastava uma das 20
 * varreduras/min do IP. Sob CGNAT, escola ou empresa — dezenas de jogadores
 * REAIS atrás de um IP só — isso barrava justamente a resposta mais barata que
 * a rota tem (o ranking, igual para todo mundo). Um teto de CUSTO que recusa
 * requisição sem custo só produz dano. Um acerto de cache passa a gastar o teto
 * LEVE, que continua impedindo tráfego infinito.
 *
 * A autorização continua onde estava (dentro do handler): nada aqui autoriza
 * ninguém, e o cache só guarda resposta de ação pública.
 */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  // `?? ''` porque `searchParams.get` devolve `string | null` e os Sets abaixo
  // são de string — `has(null)` e `has('')` são igualmente falsos.
  const action = url.searchParams.get('action') ?? '';

  const ip = clientKey(request);
  const cacheable =
    request.method === 'GET' &&
    CACHEABLE_ACTIONS.has(action) &&
    // `rank&id=` devolve o `me` DA PESSOA (ator autorizado, TORC-5): resposta
    // por pessoa não vai para cache de URL, que serviria o `me` dela a quem
    // repetisse o endereço e pularia a autorização.
    !(action === 'rank' && url.searchParams.has('id')) &&
    // §351: a busca do "Convidar amigo" (`players&lookup=friend`) é autorizada por conta e tira a própria conta da resposta —
    // mesma razão do `rank&id=`: cache de URL serviria a resposta de um a outro e pularia a autorização.
    !(action === 'players' && url.searchParams.get('lookup') === 'friend') &&
    typeof caches !== 'undefined' &&
    caches.default;

  let hit = null;
  if (cacheable) hit = await caches.default.match(request).catch(() => null);

  // Acerto de cache = só o teto leve; varredura que chegue ao KV = teto leve E o teto da varredura, cada um no SEU balde.
  // ⚠️ §346 (13/11/2026): eram um balde só ('community') medido com limites diferentes. A varredura conferia "≤ 20 chamadas de
  // QUALQUER tipo no minuto": abrir a aba Amigos (estado social, perfil e formas de cada amigo) já passava de 20 chamadas leves,
  // e a busca por apelido do "Convidar" respondia 429 — a tela mostrava "Não deu para adicionar agora" quase sempre.
  const pesada = !hit && HEAVY_ACTIONS.has(action);
  let gate = takeToken('community', ip, LIGHT_LIMIT);
  if (gate.ok && pesada) gate = takeToken('community-heavy', ip, HEAVY_LIMIT);
  if (!gate.ok) {
    console.warn('[community] rate limited', { action, cached: !!hit, retryAfter: gate.retryAfter });
    return tooManyRequests(gate.retryAfter, CORS);
  }

  if (hit) return hit;

  const res = await handleCommunity(context);

  if (cacheable && res.status === 200) {
    const cached = new Response(res.body, res);
    cached.headers.set('Cache-Control', `public, max-age=${EDGE_TTL_SECONDS}`);
    const copy = cached.clone();
    const put = caches.default.put(request, cached).catch(() => {});
    if (typeof context.waitUntil === 'function') context.waitUntil(put);
    return copy;
  }
  return res;
}

// ── Cooperativo (Fase 4.3) ────────────────────────────────────────
//
// A restrição que manda neste bloco não é técnica, é a do `docs/PLANO-COOP.md`
// §1: o item 4.2 do `PLANO-EVOLUCAO.md` registra que **31,3% relataram efeito
// psicológico negativo de comparação** em ambiente de leaderboard, e um grupo
// que mostrasse quanto cada membro contribuiu reinventaria o leaderboard entre
// amigos — onde a comparação dói MAIS, porque o outro não é um estranho.
//
// Por isso o que sai daqui é: o progresso do GRUPO (um número só) e, por
// membro, um booleano "apareceu hoje". **Nunca** o quanto cada um fez. Isso é
// invariante de SERVIDOR, e não de tela: `vistaDoGrupo` é o único lugar que
// monta a resposta, então nenhuma rota futura reintroduz a contagem individual
// por descuido — a mesma técnica que `publicProfile` usa para `tasksDone`.
//
// ⚠️ **Fronteira de confiança, declarada:** o check-in é uma AFIRMAÇÃO do
// cliente ("cumpri a minha meta hoje"), não uma verificação do servidor. É
// deliberado: recalcular a meta do dia aqui exigiria uma segunda cópia de
// `dailyGoalFor` no servidor, que é exatamente o footgun 9 (regra copiada
// diverge em silêncio) — e o save inteiro já é escrito pelo cliente, então a
// cópia não compraria confiança nenhuma, só divergência. O que o servidor
// garante é o que ele PODE garantir sozinho: **um check-in por pessoa por
// dia**, e só sobre si mesma. E nada de economia depende disso — bater a meta
// do grupo não paga Bits nem item (§5.2 do plano é decisão do dono, em
// aberto), então não há o que farmar.

// As ações `coop*` são ALIASES da Guilda desde o WPG-1: o estado mora em
// `_coop.js` e a resposta em `guild.js` › `vistaDaGuilda` (continua havendo UMA
// só montagem). Aqui só se roteia, com o teto LEVE desta rota já cobrado.

const SIM_ACTIONS = new Set(['players', 'player', 'opponents', 'rank', 'seasonResult', 'duelStart', 'match', 'sparOpponents', 'sparStart', 'sparMatch', 'sparBuyTicket']);
async function handleCommunity(context) {
  const { request, env } = context;
  if (!kv(env)) return json({ error: 'Storage not bound' }, 500);
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  if (action && Object.prototype.hasOwnProperty.call(COOP_ALIASES, action)) {
    return handleGuild({ request, env });
  }
  const method = request.method;
  // Corpo: teto de 64 KB (um perfil/duelo/presente tem poucas centenas de bytes) e SEMPRE um objeto —
  // `null`, número ou lista no JSON davam TypeError em `body.id` (500).
  let body = {};
  if (method === 'POST') {
    const text = await request.text().catch(() => '');
    if (text.length > 65536) return json({ error: 'payload too large' }, 413);
    try { const parsed = JSON.parse(text); body = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}; } catch { body = {}; }
  }
  const id = body.id || url.searchParams.get('id');
  // M11: diretório, oponentes, ranking e arena enxergam os simulados do dia (preguiçoso, idempotente, nunca lança;
  // no-op sem `SIMULADOS_ON`). Os placares por jogo ficam em `rankings.js`.
  if (SIM_ACTIONS.has(String(action))) await agendarSimuladosDia(context);

  /**
   * Autoriza o ATOR da requisição.
   *
   * Toda ação que lê ou escreve "em nome de `id`" tem que passar por aqui.
   * Durante muito tempo só `action=profile` chamava — e as outras aceitavam o
   * ator direto do corpo da requisição. Dava para: emitir presente em nome de
   * outro jogador, reescrever a lista de amigos dele, forjar partidas do
   * torneio creditando os dois lados, e APAGAR troféus e presentes alheios (o
   * `claim=1` é destrutivo e não tem reemissão). Nada disso fechava ao ligar o
   * `FIREBASE_PROJECT_ID`, porque essas ações não consultavam autenticação em
   * ponto nenhum.
   *
   * Devolve `null` quando está tudo certo, ou a Response de erro pronta.
   */
  const denyUnlessOwner = async (actorId) => {
    if (!VALID_ID.test(actorId || '')) return json({ error: 'invalid id' }, 400);
    const auth = await authorizeSaveAccess(request, env, actorId);
    if (auth.ok) return null;
    // 410 `account-deleted` vem de `authorizeSaveAccess` (lápide) — sem isto o
    // segundo aparelho recriava `profile:`/`pid:` 3 s depois da exclusão.
    return json(auth.reason === 'account-deleted' ? { error: auth.reason, deletedAt: auth.deletedAt } : { error: auth.reason }, authStatus(auth));
  };

  /* Fecha uma partida do Torneio: pontos dos DOIS lados e o contador
     monotônico da faixa (`lifetimePoints`, WP4.13 — só soma, só em ganho, e
     mora no PERFIL para sobreviver à virada da season). Dono único da
     contabilidade: vitória, derrota e desistência passam por aqui, senão a
     desistência viraria um caminho barato que não paga o mesmo que perder. */
  const settleMatch = async ({ id, oppSave, me, opp, myRank, outcome, sides, pts }) => {
    const season = currentSeason();
    // Um combate terminou (vitória, derrota, empate ou desistência): o reroll dos oponentes volta.
    // Best-effort de propósito (Antislop P1, §374): propagar aqui daria 5xx ANTES do `putRank` e um retry de partida já liquidada.
    // Se falhar, a trava fica até o TTL (1 dia) e só o reroll espera; agora com aviso no log.
    await kvOrThrow(env).delete(rerollKey(id)).catch(err => console.warn('[community] reroll unlock failed', { id, err: String(err) }));
    // Resultado sem ganho: o que o cliente usa para NAO pagar Honra de vitoria (`honorFactor`).
    /** @type {{ gain: number, factor: number, reason: 'repeat' | 'rank-up' | 'rank-down' | null }} */
    const nada = { gain: 0, factor: 1, reason: null };
    // EMPATE (combate v3, §2.4/§2.19): resultado válido, a partida conta como jogada (a cota já foi gasta) e
    // NENHUM lado ganha ou perde pontos, vitória, derrota nem Honra.
    if (outcome === 'draw') { await putRank(env, season, id, myRank); return nada; }
    const won = outcome === 'win';
    // PR13 (ALTO-2): rendimento decrescente. Levels da ficha CONGELADA (`sides`), nunca do corpo; sem ficha = fator 1.
    const lvMe = sides?.me?.combatant?.level, lvOpp = sides?.opp?.combatant?.level;
    const pairs = myRank.pairs && typeof myRank.pairs === 'object' ? myRank.pairs : (myRank.pairs = {});
    const par = oppSave ? (pairs[oppSave] && typeof pairs[oppSave] === 'object' ? pairs[oppSave] : (pairs[oppSave] = { w: 0, l: 0 })) : { w: 0, l: 0 };
    // Pontos de FAIXA por RANK (11/11/2026): a distancia vem dos pontos da temporada CONGELADOS em `duelStart` (`pts`);
    // sem congelamento (partida de uma chamada so) le agora, do servidor. A HONRA segue o corte por level (`factor`).
    const oppRank0 = oppSave && opp ? await getRank(env, season, oppSave) : null;
    const ptsMe = Number.isFinite(pts?.me) ? pts.me : myRank.points;
    const ptsOpp = Number.isFinite(pts?.opp) ? pts.opp : (oppRank0 ? oppRank0.points : 0);
    let mine = nada;
    if (won) {
      const honra = ganhoDePontos(HONRA_PONTOS_VITORIA, lvMe, lvOpp, par.w);
      const pr = ganhoPorRank(HONRA_PONTOS_VITORIA, ptsMe, ptsOpp, par.w);
      mine = { gain: pr.gain, factor: honra.factor, reason: pr.reason };
      par.w += 1;
    }
    // Quem defende e vence (o desafiante perdeu) tambem rende por rank e menos contra o mesmo desafiante no dia.
    let theirs = nada;
    if (!won && oppSave && opp) {
      theirs = { gain: ganhoPorRank(HONRA_PONTOS_DEFESA, ptsOpp, ptsMe, par.l).gain, factor: 1, reason: null };
      par.l += 1;
    }
    myRank.points = Math.max(0, myRank.points + (won ? mine.gain : -8));
    if (won) myRank.wins += 1; else myRank.losses += 1;
    await putRank(env, season, id, myRank);
    if (!oppSave || !opp) return mine;
    const oppRank = oppRank0 || await getRank(env, season, oppSave);
    oppRank.points = Math.max(0, oppRank.points + (won ? -4 : theirs.gain));
    if (won) oppRank.losses += 1; else oppRank.wins += 1;
    await putRank(env, season, oppSave, oppRank);
    if (won) { me.lifetimePoints = (me.lifetimePoints || 0) + mine.gain; await putProfile(env, id, me); }
    else { opp.lifetimePoints = (opp.lifetimePoints || 0) + theirs.gain; await putProfile(env, oppSave, opp); }
    return mine;
  };

  /* DESISTÊNCIA = DERROTA. Um duelo aberto (`myRank.pending`) que não chegou ao
     fim — a pessoa saiu da tela, fechou o app ou deixou passar de
     `DUEL_PENDING_MS` — é fechado como derrota na PRÓXIMA chamada autorizada.
     A cota do dia já foi gasta na abertura, então não há como "sair sem
     custo" de um duelo que se prevê perder. */
  /* Devolve a partida gasta na abertura de um duelo que não pôde acontecer (só vale no mesmo dia da abertura). */
  const refundOpenDuel = (myRank, pend) => {
    const dayOf = d => new Date(d).toISOString().slice(0, 10);
    if (pend?.at && myRank.day === today() && dayOf(pend.at) === myRank.day) myRank.matchesToday = Math.max(0, (myRank.matchesToday || 0) - 1);
  };
  const forfeitPending = async ({ id, me, myRank }) => {
    const pend = myRank.pending;
    if (!pend) return false;
    myRank.pending = null;
    const opp = pend.oppSave ? await getProfile(env, pend.oppSave) : null;
    // QA-5: o oponente sumiu (perfil apagado, PvP desligado ou oculto) = a partida cancela SEM custo e ele NÃO ganha pontos.
    if (!opp?.pvpEnabled || isHidden(opp)) { refundOpenDuel(myRank, pend); return true; }
    await settleMatch({ id, oppSave: pend.oppSave, me, opp, myRank, outcome: 'loss', sides: pend.sides, pts: pend.pts });
    return true;
  };

  /* A ficha de luta de um jogador, DERIVADA DO SAVE no KV (combate v3, PR5): o duelo nunca lê o perfil público
     (`profile.stage`/`profile.attrs` são do cliente) nem aceita level, stats ou família do corpo. O level é
     derivado de `evolutionStage` + `perfectDays` e LIMITADO pelo teto S1: no máximo 1 level por dia de servidor
     desde a 1ª gravação do save (`metadata.f`, escrita só pelo `save.js`). Save ausente/ilegível = `null`. */
  const loadDuelSide = (saveId) => loadDuelSideShared(env, saveId);

  /* Os dois lados de uma partida. `{ res }` = a Response de erro (409: o save do próprio jogador some; 404: o do
     oponente some), devolvida ANTES de qualquer partida ser gasta. */
  const loadDuelSides = async (mySave, oppSave) => {
    const [meLoad, oppLoad] = await Promise.all([loadDuelSideWithSprite(env, mySave), loadDuelSideWithSprite(env, oppSave)]);
    // Forma BB (D5): recusa MOTIVADA (`velado.parity.test.js`). Desde o Início BB (17/11/2026) vale sem o interruptor: o estágio do save decide.
    if (meLoad.bbLocked) return { res: json({ error: 'bb-locked', reason: 'bb-locked', ...BB_LOCKED_MESSAGE }, 403) };
    if (oppLoad.bbLocked) return { res: json({ error: 'opponent unavailable' }, 404) };
    const meSide = meLoad.side;
    const oppSide = oppLoad.side;
    if (!meSide) return { res: json({ error: 'save unavailable' }, 409) };
    if (!oppSide) return { res: json({ error: 'opponent unavailable' }, 404) };
    return { me: meSide, opp: oppSide };
  };

  // ── Perfil público (upsert; chamado junto do cloud save) ──────────────────
  if (action === 'profile' && method === 'POST') {
    // Sem isto, qualquer um escreve o perfil público de qualquer conta —
    // trocar o apelido e os atributos alheios na Biblioteca/Torneio.
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const prev = (await getProfile(env, id)) || {};
    // Mantém o pid que a pessoa já tem, EXCETO quando ele é o derivado antigo
    // — esse é aposentado aqui, junto com o índice que o resolvia. Não uso
    // `ensurePid` neste ponto para não gravar um perfil parcial antes do
    // `putProfile` de baixo.
    const pidAntigo = prev.pid;
    const pidLegado = pidAntigo && pidAntigo === await legacyPidFor(id);
    // ── O gate de PvP, do lado que não dá para forjar ───────────────────────
    //
    // Até aqui isto era `!!body.pvpEnabled`, e o perfil é gravado JUNTO do
    // cloud save: bastava um POST com o campo ligado para entrar no diretório
    // público e na fila de oponentes sem investimento nenhum. O nível mínimo é
    // 5 (`_bond.js`, derivação em `level-de-conta.md` §6) e quem decide é o
    // Vínculo derivado do `totalXP` do save que o servidor já guarda.
    //
    // Duas regras do dono, e as duas são sobre não tirar nada de ninguém:
    //  · o gate vale para LIGAR. Quem JÁ estava com `pvpEnabled: true` continua
    //    ligado em qualquer nível — consentimento dado não se revoga por regra
    //    nova (`level-de-conta.md` §7, "PvP retroativo");
    //  · desligar é sempre permitido, em qualquer nível.
    //
    // E o pedido barrado NÃO derruba o resto do perfil: nome, estágio e
    // atributos continuam sendo gravados, e a resposta diz `pvpBlocked` para o
    // app poder explicar em vez de sumir com o botão em silêncio.
    const querLigar = !!body.pvpEnabled;
    const jaEstavaLigado = prev.pvpEnabled === true;
    let pvpEnabled = querLigar;
    let pvpBlocked = false;
    let bondLevel = null;
    if (querLigar && !jaEstavaLigado) {
      bondLevel = await bondLevelOf(env, id);
      if (!gateFor('pvp', bondLevel).open) { pvpEnabled = false; pvpBlocked = true; }
      // Forma BB (D5): não entra no PvP. O estágio vem do SAVE do servidor, não do corpo do perfil.
      else if ((await loadDuelSideWithSprite(env, id)).bbLocked) { pvpEnabled = false; pvpBlocked = true; }
    }
    // Apelido: a mesma régua do nome da guilda (D-1). O perfil é gravado junto
    // do cloud save, então recusar derrubaria a sincronização inteira — o
    // apelido com contato é DESCARTADO (fica o anterior) e a resposta avisa.
    const apelidoPedido = body.name ? sanitizarNomeDeGuilda(body.name) : null;
    let nameRejected = !!body.name && !apelidoPedido;
    // Apelido único: outra conta com o mesmo nome (sem diferenciar maiúsculas) => fica o anterior.
    let nameTaken = false;
    let apelidoFinal = apelidoPedido;
    if (apelidoPedido && !(await claimNick(env, id, apelidoPedido))) { nameTaken = true; apelidoFinal = null; }
    // Indexação preguiçosa (busca de jogadores): perfil anterior ao índice `nick:` entra sozinho ao salvar, sem backfill do dono.
    // Marcador `nickIx` no próprio perfil = já indexado, custo zero. Sem ele, tenta o apelido GRAVADO uma vez (claimNick não rouba
    // apelido alheio e ignora "Anônimo"); só marca em sucesso. Melhor esforço: falha do KV nunca derruba o save.
    // §321: `nickfIx` = também já está no índice DOBRADO (`nickf:`, a busca de jogadores). Perfil marcado só com `nickIx` (anterior a ele)
    // re-reivindica o apelido gravado UMA vez — `claimNick` grava as duas chaves — e passa a carregar os dois marcadores.
    let nickIx = (prev.nickIx === true && prev.nickfIx === true) || (!!apelidoPedido && !nameTaken);
    if (!nickIx) {
      const gravado = sanitizarNomeDeGuilda(prev.name);
      if (gravado && !/^(an[ôo]nimo|anonymous)$/i.test(gravado)) {
        try { if (await claimNick(env, id, gravado)) nickIx = true; } catch { /* tenta no próximo save */ }
      }
    }
    // Opt-out da lista pública. Cliente antigo (sem o campo) NÃO desfaz a
    // escolha feita em outro aparelho: ausência herda o valor gravado.
    // `petName`, `stage` e `unlockedStages` também saem na lista PÚBLICA e eram texto livre: a mesma régua
    // do apelido (D-1) vale aqui — contato é descartado e fica o valor anterior. `stage` é um id de estágio.
    const ID_ESTAGIO = /^[A-Za-z0-9_.-]{1,40}$/;
    const petNameOk = (v) => typeof v === 'string' && v.length > 0 && sanitizarNomeDeGuilda(v) !== null;
    const prevPet = petNameOk(prev.petName) ? String(prev.petName).slice(0, 32) : '';
    const publicHidden = typeof body.publicHidden === 'boolean' ? body.publicHidden : prev.publicHidden === true;
    // Nome do especial (aditivo): ausente no corpo herda o gravado (cliente antigo não apaga). Vazio/`null` volta ao nome padrão
    // e não conta na troca semanal. Inválido (forma, contato ou palavrão PT/EN) cai no padrão e avisa. Trocar por OUTRO nome
    // só a cada ESPECIAL_NOME_COOLDOWN_MS, medido aqui (o relógio do cliente não vale); repetir o nome gravado não gasta nada.
    let especialNome = nomeEspecialValido(prev.especialNome) || '';
    let especialNomeAt = Number(prev.especialNomeAt) > 0 ? Number(prev.especialNomeAt) : 0;
    let especialNomeRejected = false;
    let especialNomeLimit = false;
    if ('especialNome' in body) {
      const pedido = body.especialNome;
      if (pedido === null || (typeof pedido === 'string' && pedido.trim() === '')) {
        especialNome = '';
      } else {
        const novo = typeof pedido === 'string' ? nomeEspecialValido(pedido) : null;
        const sobContato = novo ? sanitizarNomeDeGuilda(novo) : null; // a régua de contato do apelido
        // Recusado NÃO muda nada: fica o nome anterior, a troca semanal não é gasta e a resposta avisa para tentar outro.
        if (!novo || sobContato !== novo) {
          especialNomeRejected = true;
        } else if (novo !== especialNome) {
          if (especialNomeAt && Date.now() - especialNomeAt < ESPECIAL_NOME_COOLDOWN_MS) especialNomeLimit = true;
          else { especialNome = novo; especialNomeAt = Date.now(); }
        }
      }
    }
    const profile = {
      id,
      name: apelidoFinal || sanitizarNomeDeGuilda(prev.name) || 'Anônimo',
      stage: (typeof body.stage === 'string' && ID_ESTAGIO.test(body.stage) ? body.stage : (ID_ESTAGIO.test(String(prev.stage ?? '')) ? prev.stage : 'rookie')),
      petName: petNameOk(body.petName) ? body.petName.slice(0, 32) : prevPet,
      // Foto e moldura (Tarefa C): so IDs das listas fechadas. Ausencia herda o gravado (cliente antigo nao apaga);
      // `null` explicito limpa (volta ao padrao do NPC / sem moldura).
      avatarId: 'avatarId' in body ? avatarIdOrNull(body.avatarId) : avatarIdOrNull(prev.avatarId),
      frameId: 'frameId' in body ? frameIdOrNull(body.frameId) : frameIdOrNull(prev.frameId),
      // Linha de arte (D-60): só id de lista fechada (`_artLine.js`); ausência herda o gravado, `null` limpa.
      artLine: 'artLine' in body ? artLineOrNull(body.artLine) : artLineOrNull(prev.artLine),
      // URL do sprite gerado pelo jogador (`/api/sprite-image?k=...` ou allowlist CDN): ausência herda o gravado, `null` limpa.
      spriteUrl: 'spriteUrl' in body ? spriteUrlOrNull(body.spriteUrl) : spriteUrlOrNull(prev.spriteUrl),
      // Elemento do Oráculo da criatura (id fechado por regex; ausência herda o gravado, cliente antigo não apaga).
      element: typeof body.element === 'string' && /^[a-z][a-z0-9_-]{0,31}$/.test(body.element) ? body.element : (typeof prev.element === 'string' ? prev.element : undefined),
      unlockedStages: Array.isArray(body.unlockedStages)
        ? body.unlockedStages.filter(s => typeof s === 'string' && ID_ESTAGIO.test(s)).slice(0, 16)
        : (prev.unlockedStages || []),
      pvpEnabled,
      publicHidden,
      ...(nickIx ? { nickIx: true, nickfIx: true } : {}),
      ...(especialNome ? { especialNome } : {}),
      ...(especialNomeAt ? { especialNomeAt } : {}),
      // Faixa de evoluções: atravessam a regravação; o bloco abaixo só os faz subir.
      evoPeakRank: peakOf(prev) ?? undefined,
      evoFeedAt: Number(prev.evoFeedAt) > 0 ? Number(prev.evoFeedAt) : undefined,
      attrs: body.attrs && typeof body.attrs === 'object'
        ? { power: attrFinito(body.attrs.power), harmony: attrFinito(body.attrs.harmony), benevolence: attrFinito(body.attrs.benevolence) }
        : (prev.attrs || { power: 0, harmony: 0, benevolence: 0 }),
      tasksDone: Number.isFinite(+body.tasksDone) ? Math.max(0, +body.tasksDone) : (prev.tasksDone || 0),
      friends: prev.friends || [],
      createdAt: prev.createdAt || Date.now(),
      updatedAt: Date.now(),
      // §213: gravar o próprio perfil é acesso do dono (o GET do save também toca, `_strays.js`).
      lastLoginAt: Date.now(),
      // Emenda: a marca de desgarrado e a recuperação atravessam a regravação do perfil (logar não limpa).
      ...strayFieldsOf(markStrayIfInactive(prev, Date.now())),
      // `friends` guarda saveId internamente (nunca sai daqui assim) — só o
      // mapa reverso conhece a correspondência.
      pid: (pidAntigo && !pidLegado) ? pidAntigo : newPid(),
    };
    // Faixa de evoluções (04/11/2026, `_evoFeed.js`): o aviso nasce do estágio do SAVE acima do pico da conta, nunca do corpo do perfil. O pico e o cooldown
    // moram no perfil e sobem antes da gravação: reenviar, alternar estágio ou forjar o corpo não anuncia de novo. Melhor esforço: o feed nunca derruba o perfil.
    const evoNow = Date.now();
    const evoPicoAntes = peakOf(prev);
    let evoEvento = null;
    try {
      // Só lê o save quando o corpo diz que passou do pico (ou no 1º perfil): perfil é gravado o tempo todo.
      if (evoPicoAntes === null || (parseStage(profile.stage)?.rank ?? -1) > evoPicoAntes) {
        const bruto = await kvOrThrow(env).get(id);
        const salvo = typeof bruto === 'string' && bruto.length <= DUEL_SAVE_MAX_CHARS ? JSON.parse(bruto) : null;
        const { peak, announce } = decideEvo({ peak: evoPicoAntes, stage: profile.stage, savedStage: salvo?.evolutionStage, lastAt: prev.evoFeedAt, now: evoNow });
        if (peak !== null) profile.evoPeakRank = peak;
        if (announce && !publicHidden && profile.pvpEnabled === true && !flagOn(env?.EVO_FEED_DISABLED)) {
          evoEvento = buildEvent({ by: id, name: profile.name, petName: profile.petName, stage: profile.stage, now: evoNow });
          if (evoEvento) profile.evoFeedAt = evoNow;
        }
      }
    } catch { evoEvento = null; /* save ilegível: sem aviso */ }
    // §439: `friends` é do servidor (aceite/convite cruzado gravam no perfil), não do corpo. O `prev` foi lido lá em cima, antes de vários awaits:
    // reler a lista aqui, colada na escrita, para não apagar uma amizade ligada nesse intervalo.
    profile.friends = (await getProfile(env, id))?.friends ?? profile.friends;
    await putProfile(env, id, profile);
    await indexPublicId(env, id, profile.pid);
    // Saiu da lista (escondeu-se ou desligou o PvP): limpa o blob. Se esta escrita falhar, o filtro de `evoFeed` na leitura já não mostra a pessoa.
    const evoSaiu = (publicHidden && prev.publicHidden !== true) || (!profile.pvpEnabled && prev.pvpEnabled === true);
    try {
      if (evoEvento || evoSaiu) {
        const atual = readFeed(await kvOrThrow(env).get(EVO_FEED_KEY));
        const feed = evoEvento ? pushEvent(atual, evoEvento, evoNow) : purgeFeedOf(atual, id);
        await kvOrThrow(env).put(EVO_FEED_KEY, JSON.stringify(feed), { expirationTtl: EVO_FEED_BLOB_TTL_S });
      }
    } catch { /* feed é cosmético */ }
    // A escolha mudou: tira da borda, deste ponto de presença, as listas públicas
    // de 60 s que ainda mostrariam a pessoa. Melhor esforço — o cache da borda é
    // por URL e por ponto de presença, então outro ponto pode servir a lista
    // velha até `EDGE_TTL_SECONDS`. O servidor em si já responde certo.
    if ((publicHidden !== (prev.publicHidden === true) || evoSaiu) && typeof caches !== 'undefined' && caches.default) {
      const base = `${url.origin}${url.pathname}?action=`;
      const season = currentSeason();
      await Promise.all([
        `${base}players`, `${base}evoFeed`, `${base}rank`, `${base}rank&season=${season}`, `${base}seasonResult&season=${season}`,
      ].map(u => caches.default.delete(new Request(u)).catch(() => {})));
    }
    if (pidLegado) await kvOrThrow(env).delete(`${PID_PREFIX}${pidAntigo}`);
    return json({
      ok: true, id: profile.pid, pvpEnabled: profile.pvpEnabled, publicHidden,
      ...(nameRejected ? { nameRejected: true } : {}),
      ...(nameTaken ? { nameTaken: true } : {}),
      ...('especialNome' in body || especialNome ? { especialNome, especialNomeAt } : {}),
      ...(especialNomeRejected ? { especialNomeRejected: true } : {}),
      ...(especialNomeLimit ? { especialNomeLimit: true } : {}),
      ...(pvpBlocked ? { pvpBlocked: true, bondLevel, minBondLevel: gateFor('pvp', bondLevel).minBond } : {}),
    });
  }

  // ── Apelido: reserva (o cliente chama ao salvar; 409 = já em uso) ─────────
  if (action === 'nickname' && method === 'POST') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const nome = sanitizarNomeDeGuilda(body.name);
    if (!nome) return json({ error: 'invalid name', nameRejected: true }, 400);
    if (!(await claimNick(env, id, nome))) return json({ error: 'name taken', nameTaken: true }, 409);
    return json({ ok: true, name: nome });
  }

  // ── Sugestões de nome por prefixo (só nomes do diretório público; nunca e-mail/id) ──
  if (action === 'names' && method === 'GET') {
    const prefixo = (url.searchParams.get('prefix') || '').normalize('NFKC').trim().toLowerCase().slice(0, 40);
    // Enumeração: prefixo curto (1 letra) varreria o índice inteiro de apelidos — mínimo 2 caracteres.
    if (prefixo.length < 2) return json({ names: [] });
    // Índice de apelidos (`nick:<minúsculas>`): TODO jogador com apelido entra, com ou sem PvP. Devolve só o apelido.
    const page = await kvOrThrow(env).list({ prefix: nickKey(prefixo).replace(/%[0-9A-F]{0,1}$/, ''), limit: 8 });
    const nomes = [];
    // Teto de chaves lidas por chamada (cada uma custa 2 KV gets): o `limit: 8` acima já é o teto.
    for (const k of page.keys ?? []) {
      let n;
      try { n = decodeURIComponent(String(k.name).slice(5)); } catch { continue; }
      if (!n.toLowerCase().startsWith(prefixo)) continue;
      // O índice guarda minúsculas: a grafia de exibição vem do perfil do dono (se bater); senão vale a minúscula.
      try {
        const dono = await kvOrThrow(env).get(k.name);
        const pr = dono ? await getProfile(env, dono) : null;
        // Quem se escondeu da lista pública (`publicHidden`) não aparece nas sugestões: o índice `nick:` não pode virar enumeração (QA beta3 R1).
        if (pr && isHidden(pr)) continue;
        if (pr && typeof pr.name === 'string' && pr.name.normalize('NFKC').trim().toLowerCase() === n) n = pr.name;
      } catch { /* fica a minúscula */ }
      if (!nomes.includes(n)) nomes.push(n);
    }
    nomes.sort((a, b) => a.localeCompare(b));
    return json({ names: nomes.slice(0, 8) });
  }

  // ── Busca de jogadores por PREFIXO (13/11/2026, REGISTRO §321): o convite do clã e o "Convidar" da aba Amigos ──
  // GET ?action=playerSearch&id=<saveId>&q=<termo> → { players: [{ id: pid, name, guildName?, stage, spriteUrl?, artLine? }] }
  // Guarda-corpos (todos no SERVIDOR, o cliente só repete o mínimo para não gastar chamada):
  //  · só o DONO do `id` pergunta (`denyUnlessOwner`) e o teto é POR CONTA (`PLAYER_SEARCH_LIMIT`), além do teto leve por IP;
  //  · termo de no mínimo `PLAYER_SEARCH_MIN` caracteres DEPOIS de dobrado — vazio/curto é 400, nunca "lista todo mundo";
  //  · casa só o COMEÇO do nome, sem acento e sem caixa ("joa" acha "João"), pelo índice `nickf:` — uma `list` por prefixo, sem varrer perfis;
  //  · no máximo `PLAYER_SEARCH_MAX` resultados, e no máximo `PLAYER_SEARCH_SCAN` chaves lidas por chamada (custo fixo);
  //  · quem saiu da lista pública (`publicHidden`) não aparece; a própria conta não aparece;
  //  · sai SÓ vista pública: pid, apelido, nome do clã, estágio e arte. Nunca saveId, e-mail, aparelho, pontos, amigos ou save.
  if (action === 'playerSearch' && method === 'GET') {
    if (!VALID_ID.test(id || '')) return json({ error: 'invalid id' }, 400);
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const termo = Array.from(foldNome(String(url.searchParams.get('q') || '').slice(0, 80))).slice(0, PLAYER_SEARCH_Q_MAX).join('');
    if (Array.from(termo).length < PLAYER_SEARCH_MIN) return json({ error: 'query too short', min: PLAYER_SEARCH_MIN }, 400);
    const gate = takeToken('player-search', id, PLAYER_SEARCH_LIMIT);
    if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);
    const prefixo = nickFoldPrefix(termo);
    if (!prefixo) return json({ error: 'query too short', min: PLAYER_SEARCH_MIN }, 400);
    const page = await kvOrThrow(env).list({ prefix: prefixo, limit: PLAYER_SEARCH_SCAN });
    const memoGuilda = new Map();
    const vistos = new Set();
    const achados = [];
    // §356 (13/11/2026, bug em produção): o índice `nickf:` só nasce em `claimNick` — perfil salvo DEPOIS do deploy ou
    // `backfillNicks`. Em produção havia 178 chaves `nick:` e 2 `nickf:`, e o perfil só sobe com o PvP LIGADO
    // (`GameStateContext` › `publicarPerfil`): quem está com PvP desligado nunca entraria sozinho. Resultado: o convite do clã e
    // as sugestões da aba Amigos não achavam ninguém, nem pelo nome completo. Por isso o índice dobrado vem PRIMEIRO e, se ele
    // tiver sido lido inteiro (menos chaves que o teto de varredura), completa com o índice `nick:` (o mesmo de `names` e do `lookup=friend`), dobrado aqui na comparação,
    // com o MESMO teto de páginas da busca por apelido (`NICK_SCAN_PAGES`) e de candidatos (`PLAYER_SEARCH_SCAN`). Só leitura.
    const candidatos = (page.keys ?? []).map(k => saveIdDaChaveDobrada(k.name));
    if (candidatos.length < PLAYER_SEARCH_SCAN) {
      const legado = await buscarNicksPorInicioDobrado(env, termo, PLAYER_SEARCH_SCAN);
      for (const chave of legado) {
        // Queda do KV PROPAGA (§381): engolida, a busca respondia "ninguém encontrado" com o jogador existindo.
        const dono = await kvOrThrow(env).get(chave);
        if (typeof dono === 'string' && dono) candidatos.push(dono);
      }
    }
    for (const dono of candidatos) {
      if (achados.length >= PLAYER_SEARCH_MAX) break;
      if (!VALID_ID.test(dono) || dono === id || vistos.has(dono)) continue;
      vistos.add(dono);
      let p = null;
      try { p = await getProfile(env, dono); } catch (err) {
        // Só o JSON ilegível de UM perfil é pulado; falha do KV sobe (§381).
        if (!(err instanceof SyntaxError)) throw err;
        console.warn('[community] perfil ilegível na busca de jogador; pulado', { saveIdPrefix: dono.slice(0, 8) });
        continue;
      }
      if (!p || isHidden(p) || typeof p.name !== 'string') continue;
      // O índice pode ter ficado para trás (renomeou e a chave velha não saiu por falha do KV): vale o nome ATUAL do perfil.
      if (!foldNome(p.name).startsWith(termo)) continue;
      // Leitura de TERCEIRO não escreve (L07-04): perfil ainda com o pid derivado antigo fica de fora até o dono salvar.
      const pid = await pidSoLeitura(p);
      if (!pid) continue;
      const sUrl = spriteUrlOrNull(p.spriteUrl);
      const linha = artLineOrNull(p.artLine);
      achados.push({
        id: pid,
        name: p.name,
        ...campoGuilda(await nomeDaGuildaDe(env, dono, memoGuilda)),
        stage: /^[A-Za-z0-9_.-]{1,40}$/.test(String(p.stage ?? '')) ? p.stage : 'rookie',
        ...(sUrl ? { spriteUrl: sUrl } : {}),
        ...(linha ? { artLine: linha } : {}),
      });
    }
    return json({ players: achados });
  }

  // ── Diretório / busca ─────────────────────────────────────────────────────
  if (action === 'players' && method === 'GET') {
    const search = (url.searchParams.get('search') || '').normalize('NFKC').trim().toLowerCase().slice(0, 40);
    const season = currentSeason();
    // §351 (13/11/2026, DECISÃO DO DONO em modal: "deixar a busca achar quem está com o PvP desligado"):
    // `lookup=friend` = a busca por apelido do "Convidar amigo" (`addByName`). As SUGESTÕES (`names`) já listavam quem está
    // com o PvP desligado, e tocar numa delas terminava em "Não achei ninguém com esse nome". Neste modo:
    //  · vale qualquer jogador VISÍVEL (não `publicHidden`), com PvP ligado OU desligado — mesma régua de `names`;
    //  · a própria conta não volta; por isso só o DONO do `id` pergunta (`denyUnlessOwner`) e a resposta não vai ao cache de URL;
    //  · termo vazio é 400 — este modo nunca vira "lista todo mundo";
    //  · sai SÓ a vista mínima (pid, apelido, estágio, sprite) — nada que o diretório não já mostrasse;
    //  · quem está com PvP desligado não ganha pid por efeito colateral (`pidSoLeitura`, sem escrita; L07-04).
    // O diretório (sem `lookup`, com ou sem `search`), o Torneio (`opponents`/`rank`) e o Treino (`sparOpponents`) seguem
    // exigindo `pvpEnabled`: o consentimento de APARECER na lista e de ser oponente não muda. Escondido e inexistente seguem
    // indistinguíveis (os dois simplesmente não voltam).
    const lookupAmigo = url.searchParams.get('lookup') === 'friend';
    if (lookupAmigo) {
      if (!search) return json({ error: 'search required' }, 400);
      const denied = await denyUnlessOwner(id);
      if (denied) return denied;
    }
    /** @type {Array<{ name?: string, guildName?: string, [k: string]: any }>} */
    const players = [];
    // SEM busca: os primeiros 300 perfis (a lista de apresentação, como sempre). COM busca: o índice de apelidos
    // (`nick:<minúsculas>`, todo jogador com apelido entra), lido em PÁGINAS só pelos NOMES das chaves, sem ler valor;
    // só quem casa custa `get`. Antes a busca olhava os 300 primeiros perfis e quem vinha depois nunca aparecia.
    // Perfil sem entrada no índice (anterior a ele): `action=backfillNicks`, manual do dono.
    let keys;
    let searchTruncated = false;
    if (search) {
      const achado = await buscarNicks(env, search);
      searchTruncated = achado.truncated;
      keys = achado.nickKeys;
    } else {
      keys = await listPrefix(env, 'profile:', 300);
    }
    const vistos = new Set();
    const memoGuilda = new Map();
    for (const k of keys) {
      let profileKey = k;
      if (search) {
        const dono = await kvOrThrow(env).get(k);
        if (!dono) continue;
        profileKey = `profile:${dono}`;
      }
      if (vistos.has(profileKey)) continue;
      vistos.add(profileKey);
      const raw = await kvOrThrow(env).get(profileKey);
      if (!raw) continue;
      let p;
      try { p = JSON.parse(raw); } catch { continue; }
      // N-4: o diretório respeita o MESMO gate que `opponents` — só entra
      // quem ligou o PvP. Antes daqui, o perfil era gravado junto do cloud
      // save e a pessoa entrava no diretório por consequência de salvar, não
      // por escolha: `name` é texto livre e `tasksDone`/`daysPlaying`
      // descrevem hábito. `pvpEnabled` undefined (perfil anterior ao campo)
      // cai no `!` e fica de fora: consentimento não se presume.
      //
      // Este `continue` vem ANTES do `search` e antes de `publicProfile` de
      // propósito: o search é feito no servidor, então filtrar depois dele
      // transformaria a busca por nome em confirmação de existência; e
      // `publicProfile` chama `ensurePid`, que EMITE e indexa identidade
      // social como efeito colateral — não se emite para quem não pediu.
      // §351: na busca do "Convidar amigo" o gate de PvP não vale (decisão do dono); escondido e a própria conta continuam fora.
      if (isHidden(p)) continue;
      if (lookupAmigo ? p.id === id : !p.pvpEnabled) continue;
      if (search && !String(p.name).toLowerCase().includes(search)) continue;
      if (lookupAmigo) {
        // PvP ligado = já está no diretório e já tem pid emitido por ele; PvP desligado = só lê (não emite identidade).
        const pid = p.pvpEnabled ? await ensurePid(env, p) : await pidSoLeitura(p);
        if (!pid) continue;
        const sUrl = spriteUrlOrNull(p.spriteUrl);
        players.push({
          id: pid,
          name: p.name,
          stage: /^[A-Za-z0-9_.-]{1,40}$/.test(String(p.stage ?? '')) ? p.stage : 'rookie',
          ...(sUrl ? { spriteUrl: sUrl } : {}),
        });
        if (players.length >= 50) break;
        continue;
      }
      // §321: o nome do clã vai junto do nome (ausente = sem clã).
      players.push({ ...(await publicProfile(env, p)), ...campoGuilda(await nomeDaGuildaDe(env, p.id, memoGuilda)) });
      if (players.length >= 50) break;
    }
    /* WP4.11 (exposição E3, proibição #21) — o diretório deixou de ser um
       ranking.

       Ele devolvia `rankPoints` de cada pessoa E ordenava por ele. Mesmo sem
       o número na tela, ordenar por desempenho faz da lista um placar: quem
       está no topo é "o melhor", e a leitura acontece sozinha. É a armadilha
       do Mimo, e é o que a #21 fecha.

       A ordem passa a ser por NOME: um diretório é para encontrar alguém, não
       para saber quem ganhou. `getRank` sai daqui junto — o dado não é só
       escondido, ele não é buscado. */
    players.sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
    return json({ players, ...(searchTruncated ? { searchTruncated: true } : {}) });
  }

  // ── Backfill do índice de apelidos (manual, do dono): perfis anteriores ao índice `nick:` ainda não são achados pela busca. ──
  // POST { adminKey, cursor? } com SEASON_ADMIN_KEY. Lê um lote de perfis, reivindica o apelido de cada um SEM roubar (claimNick recusa se
  // outra conta já o tem) e devolve o próximo cursor; repetir até `done: true`. Idempotente.
  if (action === 'backfillNicks' && method === 'POST') {
    if (!env.SEASON_ADMIN_KEY || !secretEquals(body.adminKey, env.SEASON_ADMIN_KEY)) return json({ error: 'unauthorized' }, 401);
    const page = await kvOrThrow(env).list({ prefix: 'profile:', cursor: typeof body.cursor === 'string' && body.cursor ? body.cursor : undefined, limit: BACKFILL_LOTE });
    let indexed = 0, taken = 0, skipped = 0;
    for (const k of page.keys) {
      const saveId = k.name.slice('profile:'.length);
      let p = null;
      try { p = await getProfile(env, saveId); } catch { /* ilegível */ }
      const nome = p && typeof p.name === 'string' ? sanitizarNomeDeGuilda(p.name) : null;
      if (!nome || /^(an[ôo]nimo|anonymous)$/i.test(nome)) { skipped++; continue; }
      if (await claimNick(env, saveId, nome)) indexed++; else taken++;
    }
    return json({ ok: true, scanned: page.keys.length, indexed, taken, skipped, done: !!page.list_complete, ...(page.list_complete ? {} : { cursor: page.cursor }) });
  }

  // ── Desgarrados de jogadores (§213): Soulmon de quem está há 90+ dias sem entrar. Anônimo, público, cache de borda. ──
  // O dono pergunta se o Soulmon DELE está desgarrado e quanto falta (aviso da Home). Só o dono lê.
  if (action === 'strayStatus' && method === 'GET') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const p = await getProfile(env, id);
    const stray = !!p && Number(p.strayedAt) > 0;
    const tz = url.searchParams.get('off');
    const today = playerDayOf(Date.now(), tz !== null && Number.isFinite(Number(tz)) ? { offsetMs: Number(tz) } : null);
    return json({ stray, progress: stray ? strayRecoveryProgress(p, today) : 0, needed: STRAY_RECOVERY_DAYS });
  }

  if (action === 'strays' && method === 'GET') {
    const keys = await listPrefix(env, 'profile:', 300);
    const now = Date.now();
    const strays = [];
    for (const k of keys) {
      const raw = await kvOrThrow(env).get(k);
      if (!raw) continue;
      let p;
      try { p = JSON.parse(raw); } catch { continue; }
      if (!isStrayProfile(p, now, k.slice('profile:'.length))) continue;
      strays.push(await strayView(p));
      if (strays.length >= STRAY_POOL_MAX) break;
    }
    return json({ strays });
  }

  // Faixa de evoluções (04/11/2026): o feed global curto, sem saveId/pid (`_evoFeed.js`). Cache de borda de 60 s como as outras listas públicas.
  // A régua é AQUI, na leitura: quem hoje não está na lista pública não sai, mesmo que a limpeza do blob tenha falhado. Nome e criatura são os atuais.
  if (action === 'evoFeed' && method === 'GET') {
    if (flagOn(env?.EVO_FEED_DISABLED)) return json({ events: [] });
    const events = [];
    for (const ev of liveFeed(readFeed(await kvOrThrow(env).get(EVO_FEED_KEY)), Date.now())) {
      if (events.length >= EVO_FEED_VIEW) break;
      let p = null;
      try { p = await getProfile(env, ev.by); } catch { continue; } // sem como conferir: não publica
      if (!p || !p.pvpEnabled || isHidden(p)) continue;
      const vista = publicEvent(ev, p);
      if (vista) events.push(vista);
    }
    return json({ events });
  }

  if (action === 'player' && method === 'GET') {
    // `id` aqui é SEMPRE um pid. O `|| id` que existia aqui aceitava o saveId
    // cru — o comentário dizia "para o app consultar o próprio perfil", e o
    // motivo era legítimo, mas o efeito era um oráculo: o saveId é derivável
    // do e-mail por algoritmo público, então a rota respondia, sem
    // autenticação nenhuma, "esse e-mail tem conta?" — com o perfil junto.
    //
    // O caso legítimo continua atendido sem o fallback: `action=profile`
    // devolve `{ ok: true, id: <pid> }` ao próprio dono a cada cloud save, que
    // é onde o app aprende o próprio pid. Nenhum chamador passava saveId aqui.
    //
    // Autorizar em vez de remover NÃO serviria: `authorizeSaveAccess` é
    // fail-open enquanto `FIREBASE_PROJECT_ID` estiver desligado (SEC-1), e o
    // oráculo é para ser fechado AGORA, sem depender da fatia 1.
    const targetSave = await saveIdForPublicId(env, id);
    const p = targetSave ? await getProfile(env, targetSave) : null;
    // Escondido responde exatamente como inexistente: não confirma a conta.
    if (!p || isHidden(p)) return json({ found: false });
    const rank = await getRank(env, currentSeason(), targetSave);
    // `friends` sai como pid: internamente são saveIds, e devolvê-los cru
    // vazaria a chave do save de até 5 pessoas por consulta.
    // Amigo sem perfil não tem pid e some da lista — antes saía um pid
    // derivado que não resolvia em lugar nenhum.
    const friendPids = (await Promise.all((p.friends || []).map(f => pidDeSaveId(env, f, { semEscondidos: true })))).filter(Boolean);
    return json({
      found: true,
      player: await publicProfile(env, p, {
        friends: friendPids,
        rankPoints: rank.points, wins: rank.wins, losses: rank.losses,
        ...campoGuilda(await nomeDaGuildaDe(env, targetSave)),
      }),
    });
  }

  // ── Tournament ────────────────────────────────────────────────────────────
  if (action === 'opponents' && method === 'GET') {
    // Com `id` a resposta traz a ficha e a cota DESSA conta: so o dono le (senao e oraculo e-mail->conta, como o `player` era).
    if (id) { const denied = await denyUnlessOwner(id); if (denied) return denied; }
    // Reroll (`reroll=1`, aditivo): sorteia de novo, mas só UMA vez entre combates — a trava vale AQUI, não no cliente.
    const quer = url.searchParams.get('reroll') === '1';
    if (quer && id) {
      if (await rerollUsado(env, id)) return json({ error: 'reroll used', rerolled: true }, 429);
      await kvOrThrow(env).put(rerollKey(id), '1', { expirationTtl: 86400 });
    }
    const keys = await listPrefix(env, 'profile:', 300);
    const me = id;
    const pool = [];
    const adminsOpp = await adminSaveIds(env);
    // Leitura dos perfis em LOTES paralelos (era um `await` por perfil, em série: até 300 round-trips de KV). A ordem de `keys` e o
    // filtro são os mesmos; a vista pública (`publicProfile`, que pode gravar o pid na migração) só é montada para os 3 sorteados, abaixo.
    const candidatas = keys.filter(k => !adminsOpp.has(k.slice('profile:'.length))); // GM/admin não aparece como oponente de ranking
    for (const lote of emLotes(candidatas, LOTE_KV)) {
      const lidos = await Promise.all(lote.map(async k => ({ k, raw: await kvOrThrow(env).get(k) })));
      for (const { k, raw } of lidos) {
        if (!raw) continue;
        const p = JSON.parse(raw);
        if (!p.pvpEnabled || p.id === me || isHidden(p)) continue;
        pool.push({ profile: p, saveId: k.slice('profile:'.length) });
      }
    }
    // TORNEIO = ranqueado: o servidor sorteia (aleatório) dentre quem está MAIS PERTO de quem pede no RANKING
    // DA SEASON (pontos da season, a mesma ordem que a tela mostra). Antes media por `lifetimePoints`
    // (monotônico, só sobe em vitória e nunca cai): o jogador subia de posição e a lista continuava a mesma,
    // porque a vizinhança por pontos de carreira quase não mexe. Desempate: `lifetimePoints`.
    // Pontos alheios NÃO saem na resposta (o payload público de oponente não leva pontos).
    const season = currentSeason();
    const myRank = id ? await getRank(env, season, id) : null;
    const indice = await lerIndice(env, season);
    const pontosDaSeason = async (saveId) => (typeof indice.p[saveId] === 'number'
      ? indice.p[saveId]
      : (await getRank(env, season, saveId)).points ?? 0);
    const myPoints = myRank ? (Number(myRank.points) || 0) : 0;
    const meProfileRaw = me ? await kvOrThrow(env).get(`profile:${me}`) : null;
    const myLifetime = meProfileRaw ? (JSON.parse(meProfileRaw).lifetimePoints ?? 0) : 0;
    const comPontos = await Promise.all(pool.map(async e => ({
      ...e, score: await pontosDaSeason(e.saveId), lifetime: e.profile.lifetimePoints ?? 0, stage: e.profile.stage,
    })));
    const sorted = pickRankedOpponents(
      comPontos,
      { score: myPoints, lifetime: myLifetime },
      () => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] / 4294967296; },
      undefined, undefined, meProfileRaw ? (JSON.parse(meProfileRaw).stage ?? null) : null,
    );
    pool.length = 0; pool.push(...sorted);
    const matchesLeft = myRank
      ? MATCHES_PER_DAY - (myRank.day === today() ? myRank.matchesToday : 0)
      : MATCHES_PER_DAY;
    /* Duelo fantasma (`_duel.js`): cada oponente leva só a ficha de luta dele.
       A SEMENTE não vai aqui — ela nasce em `duelStart`, depois de a partida
       ser gasta, para o cliente não simular os três e escolher. */
    // Combate v3 (PR5): a lista só diz SE e em que level cada um luta (`duel: { level }`); a ficha inteira
    // (stats, família, forma do golpe) só sai em `duelStart`, junto da semente. +1 leitura de KV por oponente.
    const publicDuel = (side) => (side ? { level: side.combatant.level } : null);
    const meSide = id ? await loadDuelSide(id) : null;
    const memoGuilda = new Map();
    const opponents = await Promise.all(pool.slice(0, 3).map(async ({ profile, saveId }) => {
      const pub = await publicProfile(env, profile);
      const { side, spriteUrl, artLine } = await loadDuelSideWithSprite(env, saveId);
      // Simulado: o sprite publicado em `sim:sprite:<id>` vence (o perfil pode estar defasado até o motor rodar).
      const effectiveSprite = (await spriteVivoDoSimulado(env, saveId)) ?? pub.spriteUrl ?? spriteUrl;
      await formaVista(env, saveId);
      return {
        ...pub,
        artLine: pub.artLine ?? artLine,
        ...(effectiveSprite ? { spriteUrl: effectiveSprite } : {}),
        ...campoGuilda(await nomeDaGuildaDe(env, saveId, memoGuilda)),
        duel: publicDuel(side),
      };
    }));
    return json({ opponents, me: { duel: publicDuel(meSide) }, matchesLeft: Math.max(0, matchesLeft), ...(id ? { rerolled: quer || await rerollUsado(env, id) } : {}) });
  }

  /* Valida ator e oponente e devolve o contexto da partida. Compartilhado por
     `duelStart` e `match` — as duas exigem a mesma autorização e o mesmo
     oponente; duas cópias divergiriam em silêncio. */
  const matchContext = async () => {
    const { opponentId } = body;
    if (!VALID_ID.test(id || '') || !VALID_ID.test(opponentId || '')) return { res: json({ error: 'invalid id' }, 400) };
    // A partida credita OS DOIS lados e consome a cota diária de `id`. Sem
    // autorizar o ator, dava para nomear a vítima como `id` e a si mesmo como
    // oponente: +10 pontos e +1 vitória por chamada, queimando a partida da
    // vítima. Repetido, garante o 1º lugar da season sem jogar.
    const denied = await denyUnlessOwner(id);
    if (denied) return { res: denied };
    // O oponente chega como pid público — o saveId dele nunca sai daqui.
    const oppSave = await saveIdForPublicId(env, opponentId);
    if (!oppSave) return { res: json({ error: 'opponent unavailable' }, 404) };
    if (id === oppSave) return { res: json({ error: 'cannot fight yourself' }, 400) };
    const me = await getProfile(env, id);
    const opp = await getProfile(env, oppSave);
    if (!me?.pvpEnabled) return { res: json({ error: 'pvp disabled' }, 403) };
    // Dono 12/11/2026: a Ranqueada é o ÚNICO modo com limite por Vínculo (5). O treino (`sparContext`) não passa por aqui.
    // (Sem save no servidor `bondLevelOf` é 0: o caminho de sempre — 409 "save sumiu" — responde, não este.)
    const meuVinculo = await bondLevelOf(env, id);
    if (meuVinculo > 0 && !gateFor('ranqueada', meuVinculo).open) return { res: json({ error: 'ranked locked', minBondLevel: gateFor('ranqueada', 1).minBond }, 403) };
    if (!opp?.pvpEnabled || isHidden(opp) || (await adminSaveIds(env)).has(oppSave)) return { res: json({ error: 'opponent unavailable' }, 404) };
    const myRank = await getRank(env, currentSeason(), id);
    if (myRank.day !== today()) { myRank.day = today(); myRank.matchesToday = 0; myRank.pairs = {}; }
    return { opponentId, oppSave, me, opp, myRank };
  };

  /* Contexto do treino: a mesma autorização e o mesmo oponente da partida ranqueada, SEM o registro de ranking. */
  const sparContext = async () => {
    const { opponentId } = body;
    if (!VALID_ID.test(id || '') || !VALID_ID.test(opponentId || '')) return { res: json({ error: 'invalid id' }, 400) };
    const denied = await denyUnlessOwner(id);
    if (denied) return { res: denied };
    const oppSave = await saveIdForPublicId(env, opponentId);
    if (!oppSave) return { res: json({ error: 'opponent unavailable' }, 404) };
    if (id === oppSave) return { res: json({ error: 'cannot fight yourself' }, 400) };
    const me = await getProfile(env, id);
    const opp = await getProfile(env, oppSave);
    if (!me?.pvpEnabled) return { res: json({ error: 'pvp disabled' }, 403) };
    if (!opp?.pvpEnabled || isHidden(opp) || (await adminSaveIds(env)).has(oppSave)) return { res: json({ error: 'opponent unavailable' }, 404) };
    return { opponentId, oppSave, me, opp };
  };
  /* Duelo de treino aberto (`spar:<id>`). Falha do KV PROPAGA (Antislop P1, item 5, §374): virar `null` respondia 409
     `no open duel` depois da partida gasta (e, no `sparStart`, abria outro duelo e gastava mais uma). Só o JSON ilegível é
     tolerado, com aviso. */
  const lerJsonKv = async (key, saveId) => {
    const raw = await kvOrThrow(env).get(key);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch {
      console.warn('[community] spar record unreadable', { key: key.split(':')[0], saveId });
      return null;
    }
  };
  const lerSpar = async (saveId) => {
    const v = await lerJsonKv(sparPendingKey(saveId), saveId);
    return v && v.sides?.me && v.sides?.opp ? v : null;
  };

  /* Abre o duelo fantasma (`_duel.js`): consome a cota do dia, guarda o
     oponente e sorteia a SEMENTE — aqui, DEPOIS do compromisso. Se a semente
     viesse na lista de oponentes, um cliente editado simularia os três e
     escolheria o que vence; assim ela só existe depois que a partida já foi
     gasta. Duelo anterior que ficou aberto vira derrota antes de abrir o novo. */
  if (action === 'duelStart' && method === 'POST') return withDuelLock(String(id), async () => {
    const ctx = await matchContext();
    if (ctx.res) return ctx.res;
    const { opponentId, oppSave, me, myRank } = ctx;
    // PR13 (ALTO-1): duelo ABERTO e ainda valido = nao abre outro. Mesmo oponente: devolve o MESMO duelo (idempotente,
    // sem gastar partida nem sortear semente nova). Outro oponente: 409. Passou de `DUEL_PENDING_MS` (ou ficha antiga
    // sem congelamento): cai no caminho de sempre, que fecha o velho como derrota e abre o novo.
    const aberto = myRank.pending;
    if (aberto && aberto.sides?.me && aberto.sides?.opp && Date.now() - (aberto.at || 0) <= DUEL_PENDING_MS) {
      const left = Math.max(0, MATCHES_PER_DAY - myRank.matchesToday);
      if (aberto.opp === opponentId) return json({ seed: aberto.seed, me: aberto.sides.me, opp: aberto.sides.opp, matchesLeft: left });
      return json({ error: 'duel open', matchesLeft: left, retryAfter: Math.max(1, Math.ceil((DUEL_PENDING_MS - (Date.now() - (aberto.at || 0))) / 1000)) }, 409);
    }
    // A ficha dos DOIS lados sai do SAVE e é CONGELADA aqui (`pending.sides`): o `match` luta com ela, não relê o
    // save. Sem o congelamento, com a semente na mão o cliente editaria o save (família do especial, level) entre
    // as duas chamadas até a luta virar vitória. Falhou aqui = nada foi gasto (a cota só cai depois).
    const sides = await loadDuelSides(id, oppSave);
    if (sides.res) return sides.res;
    await forfeitPending({ id, me, myRank });
    if (myRank.matchesToday >= MATCHES_PER_DAY) {
      await putRank(env, currentSeason(), id, myRank);
      return json({ error: 'daily limit', matchesLeft: 0 }, 429);
    }
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    myRank.matchesToday += 1;
    // Pontos da temporada dos dois lados CONGELADOS aqui (pontos por rank): o corpo da requisicao nunca decide o ganho.
    const oppRankAgora = await getRank(env, currentSeason(), oppSave);
    myRank.pending = { opp: opponentId, oppSave, seed, at: Date.now(), sides: { me: sides.me, opp: sides.opp }, pts: { me: myRank.points, opp: oppRankAgora.points } };
    await putRank(env, currentSeason(), id, myRank);
    return json({
      seed,
      me: sides.me, opp: sides.opp,
      matchesLeft: MATCHES_PER_DAY - myRank.matchesToday,
    });
  });

  if (action === 'match' && method === 'POST') return withDuelLock(String(id), async () => {
    const ctx = await matchContext();
    if (ctx.res) {
      // QA-5: oponente sumiu no meio do duelo: cancela sem custo (devolve a partida, ninguém pontua). Aditivo: `cancelled`.
      if (ctx.res.status === 404) {
        const rec = await getRank(env, currentSeason(), id);
        if (rec.pending && rec.pending.opp === body.opponentId) {
          const pend = rec.pending;
          rec.pending = null;
          if (rec.day !== today()) { rec.day = today(); rec.matchesToday = 0; rec.pairs = {}; }
          else refundOpenDuel(rec, pend);
          await putRank(env, currentSeason(), id, rec);
          return json({ error: 'opponent unavailable', cancelled: true, matchesLeft: Math.max(0, MATCHES_PER_DAY - (rec.matchesToday || 0)) }, 404);
        }
      }
      return ctx.res;
    }
    const { opponentId, oppSave, me, opp, myRank } = ctx;
    // QA-4: reenvio do MESMO `match` (a resposta se perdeu na rede): devolve o resultado já liquidado, sem gastar outra partida.
    if (!myRank.pending && myRank.last && body.seed !== undefined && myRank.last.opp === opponentId && myRank.last.seed === body.seed) {
      return json({ ...myRank.last.res, replayed: true });
    }
    const oppSpriteUrl = (await spriteVivoDoSimulado(env, oppSave)) ?? spriteUrlOrNull(opp.spriteUrl);
    const opponent = {
      name: opp.name, petName: petNameDoSimulado(opp), stage: opp.stage,
      avatarId: avatarIdOrNull(opp.avatarId), frameId: frameIdOrNull(opp.frameId), artLine: artLineOrNull(opp.artLine),
      ...(oppSpriteUrl ? { spriteUrl: oppSpriteUrl } : {}),
    };

    // Um duelo aberto contra OUTRO oponente fica para trás: é desistência.
    const pend = myRank.pending;
    if (pend && pend.opp !== opponentId) await forfeitPending({ id, me, myRank });
    const open = myRank.pending && myRank.pending.opp === opponentId ? myRank.pending : null;

    // Desistir (o cliente avisa) ou estourar o prazo do duelo = derrota, sem luta.
    if (open && (body.forfeit === true || Date.now() - (open.at || 0) > DUEL_PENDING_MS)) {
      myRank.pending = null;
      await settleMatch({ id, oppSave, me, opp, myRank, outcome: 'loss', sides: open.sides, pts: open.pts });
      return json({
        won: false, draw: false, outcome: 'loss', forfeit: true, myScore: 0, oppScore: 100,
        points: myRank.points,
        matchesLeft: MATCHES_PER_DAY - myRank.matchesToday,
        opponent,
      });
    }

    let seed;
    let sides;
    const ptsFrozen = open?.pts;
    if (open && open.sides?.me && open.sides?.opp) {
      seed = open.seed;           // a semente é a do SERVIDOR; a do cliente nunca existiu
      sides = open.sides;         // e a ficha é a CONGELADA em `duelStart`
      myRank.pending = null;
    } else {
      // Sem duelo aberto (cliente antigo, que não chama `duelStart`) ou aberto antes do v3 (sem ficha guardada):
      // a partida abre e fecha numa chamada só, com semente sorteada agora e a ficha lida agora. `forfeit` sem
      // duelo aberto não custa nada — não há o que desistir.
      if (!open && body.forfeit === true) return json({ error: 'no open duel' }, 409);
      const lidos = await loadDuelSides(id, oppSave);
      if (lidos.res) return lidos.res;     // 409/404 ANTES de gastar a partida
      sides = { me: lidos.me, opp: lidos.opp };
      if (open) {
        seed = open.seed;
        myRank.pending = null;
      } else {
        if (myRank.matchesToday >= MATCHES_PER_DAY) {
          // Futuro: liberar partidas extras via anúncio (ads). Hoje: bloqueia.
          return json({ error: 'daily limit', matchesLeft: 0 }, 429);
        }
        seed = crypto.getRandomValues(new Uint32Array(1))[0];
        myRank.matchesToday += 1;
      }
    }

    /* Duelo fantasma: os pets lutam sozinhos, a torcida do dono só SOMA (`_duel.js`). NADA do cliente decide o
       resultado: só os toques por balde entram, higienizados e com teto; a ficha e a semente são do servidor. */
    const duel = simulateDuel({ me: sides.me, opp: sides.opp, seed, taps: body.taps ?? body.cheers });
    const outcome = duel.winner === 'me' ? 'win' : duel.winner === 'opp' ? 'loss' : 'draw';
    const settled = await settleMatch({ id, oppSave, me, opp, myRank, outcome, sides, pts: ptsFrozen });

    const resposta = {
      won: outcome === 'win',
      draw: outcome === 'draw',
      outcome,
      myScore: Math.round(100 * duel.hpMe),
      oppScore: Math.round(100 * duel.hpOpp),
      points: myRank.points,
      // PR13: o que a vitoria rendeu de fato e o fator (0..1) que o app aplica a Honra; derrota/empate = 0 e 1.
      gain: settled.gain,
      // Só leitura para a tela: por que a vitória rendeu mais/menos ('rank-up' | 'rank-down' | 'repeat' | null) e os pontos da FAIXA (`lifetimePoints`, só soma).
      gainReason: outcome === 'win' ? (settled.reason ?? null) : null,
      lifetime: me.lifetimePoints || 0,
      honorFactor: outcome === 'win' ? settled.factor : 1,
      matchesLeft: MATCHES_PER_DAY - myRank.matchesToday,
      opponent,
      duel: { events: duel.events, me: sides.me, opp: sides.opp },
    };
    // Guarda o resultado (sem a repetição da luta) para o reenvio idempotente; só vale com `seed` do duelo aberto.
    if (open) {
      const { duel: _d, ...compacto } = resposta;
      myRank.last = { opp: opponentId, seed, res: compacto };
      await putRank(env, currentSeason(), id, myRank);
    }
    return json(resposta);
  });

  // ── TREINO ("Sparring") do Torneio (10/11/2026, `_treino.js`) ─────────────────────────────────────────────────
  // Luta PvP contra outros jogadores que NÃO ranqueia: não toca `rank:*`, placar, faixa, season nem `lifetimePoints`, não gasta
  // a cota de partidas do ranqueado e perder não custa nada. Rende 1–2 de Honra por vitória, teto de 20 por DIA DO JOGADOR
  // (contador no servidor, `sparHonor:<id>:<dia>`). Os oponentes saem de um pool por faixa de VÍNCULO — nunca de ranking.
  if (action === 'sparOpponents' && method === 'GET') {
    if (!VALID_ID.test(id || '')) return json({ error: 'invalid id' }, 400);
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const rng = () => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] / 4294967296; };
    const meProfile = await getProfile(env, id);
    if (!meProfile?.pvpEnabled) return json({ error: 'pvp disabled' }, 403);
    const { bond: myBond, level: myLevel } = await bondELevelOf(env, id);
    const admins = await adminSaveIds(env);
    // Varre os perfis em ORDEM SORTEADA (a cada pedido: é o "Refresh" sem fim) até `SPAR_SCAN_MAX` elegíveis.
    const keys = await listPrefix(env, 'profile:', 300);
    for (let i = keys.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [keys[i], keys[j]] = [keys[j], keys[i]]; }
    const pool = [];
    for (const k of keys) {
      if (pool.length >= SPAR_SCAN_MAX) break;
      const saveId = k.slice('profile:'.length);
      if (saveId === id || admins.has(saveId)) continue;
      const raw = await kvOrThrow(env).get(k);
      if (!raw) continue;
      let p;
      try { p = JSON.parse(raw); } catch { continue; }
      if (!p?.pvpEnabled || isHidden(p) || p.id === id) continue;
      const bl = await bondELevelOf(env, saveId);
      pool.push({ profile: p, saveId, bond: bl.bond, level: bl.level, stage: p.stage });
    }
    const ordered = pickSparOpponents(pool, myBond, rng, SPAR_PICKS, undefined, meProfile.stage ?? null, myLevel);
    const opponents = [];
    for (const { profile, saveId } of ordered) {
      if (opponents.length >= SPAR_PICKS) break;
      const { side, spriteUrl, artLine, bbLocked } = await loadDuelSideWithSprite(env, saveId);
      if (!side || bbLocked) continue; // sem ficha de luta = não luta (o servidor não oferece quem não pode lutar)
      const pub = await publicProfile(env, profile);
      const effectiveSprite = (await spriteVivoDoSimulado(env, saveId)) ?? pub.spriteUrl ?? spriteUrl;
      await formaVista(env, saveId);
      opponents.push({ ...pub, artLine: pub.artLine ?? artLine, ...(effectiveSprite ? { spriteUrl: effectiveSprite } : {}), ...campoGuilda(await nomeDaGuildaDe(env, saveId)), duel: { level: side.combatant.level } });
    }
    const meSide = await loadDuelSide(id);
    const tickets = sparTicketStatus(await readSparTicket(env, id, diaDe(await fixarTzTreino(env, id, tzDe(url.searchParams.get('zone'), url.searchParams.get('off'))))));
    return json({ opponents, tickets, me: { duel: meSide ? { level: meSide.combatant.level } : null } });
  }

  /* Abre o treino: a ficha dos DOIS lados sai do SAVE e é CONGELADA aqui, e a SEMENTE nasce aqui (nunca vai na lista) — o mesmo
     contrato do `duelStart`, só que o estado mora em `spar:<id>` (KV, 1 h) e nenhuma cota é gasta. Mesmo oponente já aberto = o mesmo duelo. */
  if (action === 'sparStart' && method === 'POST') return withDuelLock(`spar:${id}`, async () => {
    const ctx = await sparContext();
    if (ctx.res) return ctx.res;
    const { opponentId, oppSave } = ctx;
    const aberto = await lerSpar(id);
    if (aberto && aberto.opp === opponentId && Date.now() - (aberto.at || 0) <= DUEL_PENDING_MS) {
      return json({ seed: aberto.seed, me: aberto.sides.me, opp: aberto.sides.opp });
    }
    // Ticket do dia (20 grátis com Honra + extras sem Honra): sem partida restante, não abre.
    const diaTk = diaDe(await fixarTzTreino(env, id, tzDe(body.zone, body.off)));
    const tk = sparTicketStatus(await readSparTicket(env, id, diaTk));
    if (tk.left <= 0) return json({ error: 'no tickets', tickets: tk }, 409);
    const sides = await loadDuelSides(id, oppSave);
    if (sides.res) return sides.res;
    const seed = crypto.getRandomValues(new Uint32Array(1))[0];
    // ABRIR A LUTA GASTA 1 PARTIDA do ticket (com ou sem resultado): desistir não é de graça (QA 2026-11-11, médio 5).
    // O dia e o direito à Honra ficam gravados no duelo aberto; o `sparMatch` não gasta de novo.
    const gasto = await spendSparMatch(env, id, diaTk);
    await kvOrThrow(env).put(sparPendingKey(id), JSON.stringify({ opp: opponentId, oppSave, seed, at: Date.now(), spent: true, day: diaTk, withHonor: gasto.withHonor, sides: { me: sides.me, opp: sides.opp } }), { expirationTtl: SPAR_PENDING_TTL_S });
    return json({ seed, me: sides.me, opp: sides.opp, tickets: gasto.status });
  });

  /* Compra de ticket EXTRA (+20 partidas sem Honra). A cobrança em Bits (ganhos) é do app, só depois do ok; o servidor conta e limita (3/dia). */
  if (action === 'sparBuyTicket' && method === 'POST') return withDuelLock(`spar:${id}`, async () => {
    if (!VALID_ID.test(id || '')) return json({ error: 'invalid id' }, 400);
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const phase = body.phase === 'reserve' || body.phase === 'confirm' ? body.phase : undefined;
    const r = await buySparTicket(env, id, diaDe(await fixarTzTreino(env, id, tzDe(body.zone, body.off))), phase);
    if (!r.ok) return json({ error: r.reason === 'no-reserve' ? 'no reserve' : 'extra limit', tickets: r.status }, 409);
    return json({ tickets: r.status, ...(r.reserved ? { reserved: true } : {}) });
  });

  if (action === 'sparMatch' && method === 'POST') return withDuelLock(`spar:${id}`, async () => {
    const ctx = await sparContext();
    if (ctx.res) {
      if (ctx.res.status === 404) await kvOrThrow(env).delete(sparPendingKey(id)).catch(() => {}); // oponente sumiu: cancela. A partida já foi gasta no `sparStart` (#792) e NÃO volta: devolver aqui reabriria a desistência grátis (basta a 2ª conta do próprio jogador desligar o PvP)
      return ctx.res;
    }
    const { opponentId, opp } = ctx;
    // ⚠️ ORDEM (Antislop P1, §374; QA r4, §381): o duelo aberto só é apagado DEPOIS de `sparDone` gravado, como ÚLTIMA escrita.
    // Leitura ou gravação que falha antes disso propaga (5xx → `playSparComRetry` repete com a mesma semente) e o retry ainda acha o
    // duelo aberto; apagá-lo antes fazia o retry cair em 409 `no open duel` e a vitória (e a Honra) se perdiam.
    // Reenvio do MESMO resultado (a resposta se perdeu na rede, ou o `delete` final falhou): devolve o já liquidado, sem Honra nova.
    const feito = await lerJsonKv(sparDoneKey(id), id);
    const aberto = await lerSpar(id);
    if (feito && feito.opp === opponentId && body.seed !== undefined && feito.seed === body.seed && (!aberto || aberto.seed === feito.seed)) {
      if (aberto) await kvOrThrow(env).delete(sparPendingKey(id));
      return json({ ...feito.res, replayed: true });
    }
    if (!aberto || aberto.opp !== opponentId) return json({ error: 'no open duel' }, 409);
    const oppSpriteUrl = (await spriteVivoDoSimulado(env, ctx.oppSave)) ?? spriteUrlOrNull(opp.spriteUrl);
    const opponent = {
      name: opp.name, petName: petNameDoSimulado(opp), stage: opp.stage,
      avatarId: avatarIdOrNull(opp.avatarId), frameId: frameIdOrNull(opp.frameId), artLine: artLineOrNull(opp.artLine),
      ...(oppSpriteUrl ? { spriteUrl: oppSpriteUrl } : {}),
    };
    // Desistir ou estourar o prazo = derrota, sem luta e sem nada a perder.
    if (body.forfeit === true || Date.now() - (aberto.at || 0) > DUEL_PENDING_MS) {
      await kvOrThrow(env).delete(sparPendingKey(id));
      return json({ won: false, draw: false, outcome: 'loss', forfeit: true, myScore: 0, oppScore: 100, honor: 0, opponent });
    }
    const duel = simulateDuel({ me: aberto.sides.me, opp: aberto.sides.opp, seed: aberto.seed, taps: body.taps ?? body.cheers });
    const outcome = duel.winner === 'me' ? 'win' : duel.winner === 'opp' ? 'loss' : 'draw';
    // Duelo aberto por esta versão já gastou a partida no `sparStart` (`spent`) e gravou dia/Honra; registro antigo gasta aqui.
    const diaTk = aberto.spent && aberto.day ? aberto.day : diaDe(await fixarTzTreino(env, id, tzDe(body.zone, body.off)));
    const ticket = await readSparTicket(env, id, diaTk);
    const withHonor = aberto.spent ? aberto.withHonor === true : ticket.played < TREINO_TICKET_MATCHES;
    const honraUsada = outcome === 'win' && withHonor ? await readSparHonorUsed(env, id, diaTk) : 0;
    // ── leituras acabaram: daqui em diante só gravações, e o `delete` do duelo aberto é a última ──
    const gasto = aberto.spent ? { withHonor, status: sparTicketStatus(ticket) } : await spendSparMatch(env, id, diaTk, ticket);
    let honra = { honor: 0, capped: false };
    if (outcome === 'win' && gasto.withHonor) {
      honra = await grantSparHonor(env, id, diaTk, () => { const b = new Uint32Array(1); crypto.getRandomValues(b); return b[0] / 4294967296; }, honraUsada);
    }
    const resposta = {
      won: outcome === 'win', draw: outcome === 'draw', outcome,
      myScore: Math.round(100 * duel.hpMe), oppScore: Math.round(100 * duel.hpOpp),
      honor: honra.honor, ...(honra.capped ? { honorCapped: true } : {}), ...(gasto.withHonor ? {} : { noHonorTicket: true }), tickets: gasto.status,
      opponent,
    };
    await kvOrThrow(env).put(sparDoneKey(id), JSON.stringify({ opp: opponentId, seed: aberto.seed, res: resposta }), { expirationTtl: SPAR_PENDING_TTL_S });
    await kvOrThrow(env).delete(sparPendingKey(id));
    return json({ ...resposta, duel: { events: duel.events, me: aberto.sides.me, opp: aberto.sides.opp } });
  });

  if ((action === 'rank' || action === 'seasonResult') && method === 'GET') {
    const season = url.searchParams.get('season') || currentSeason();
    if (!/^\d{4}-\d{2}$/.test(season)) return json({ error: 'invalid season' }, 400);
    // Índice ordenado (REGISTRO §23, `_rankIndex.js`): com ele completo, a ordem e o `myPlace` vêm da season INTEIRA e
    // só os primeiros colocados são relidos. Enquanto o preenchimento de quem já tinha `rank:` não termina, o caminho
    // antigo (300 chaves em ordem de saveId) segue valendo — cada leitura avança um lote.
    // Consulta anônima só LÊ o índice (L07-04); a autenticada avança o preenchimento. `meId` já passou por
    // `denyUnlessOwner` logo abaixo — a ordem aqui é só porque o índice decide quais chaves ler.
    const meIdIdx = url.searchParams.get('id');
    if (action === 'rank' && meIdIdx) {
      const denied = await denyUnlessOwner(meIdIdx);
      if (denied) return denied;
    }
    const autenticado = action === 'rank' && !!meIdIdx;
    const indice = autenticado ? await completarIndice(env, season, RANK_INDEX_BUDGET) : await lerIndice(env, season);
    // GM/admin fora de TODO ranking (entradas antigas no índice/lista saem aqui na leitura; nada é apagado).
    const admins = await adminSaveIds(env);
    const ordenados = indice.done ? ordenar(indice.p).filter(r => !admins.has(r.owner)) : null;
    const keys = ordenados
      ? ordenados.slice(0, RANK_SCAN_MAX).map(r => `rank:${season}:${r.owner}`)
      : (await listPrefix(env, `rank:${season}:`, 300)).filter(k => !admins.has(k.slice(`rank:${season}:`.length)));
    const semLinha = [];
    const rows = [];
    // `me`: quem optou por sair da lista continua vendo o PRÓPRIO lugar — só
    // ela (ator autorizado), nunca por consulta anônima.
    const meId = meIdIdx;
    let meRow = null;
    // R8 (04/10/2026): Mestre = top 100 e Grão-Mestre = top 20 da season. A posição do PRÓPRIO jogador
    // (`myPlace`) sai de TODAS as linhas lidas — inclusive as ocultas da lista pública, que também
    // ocupam lugar — e só volta a quem passou por `denyUnlessOwner` (nunca em consulta anônima).
    // O limite antigo de 300 chaves em ordem de saveId só vale enquanto o índice ordenado da season
    // (REGISTRO §23, acima) não terminou de ser preenchido.
    const allPoints = [];
    /** §321: linha → saveId dono, para o nome do clã ser lido DEPOIS do corte (só das linhas que saem), sem campo extra na linha. */
    const saveDaLinha = new Map();
    // Linha + perfil lidos em LOTES paralelos (era um round-trip por linha, em série); o processamento segue na ordem do ranking.
    // O lote só adianta LEITURAS: nada é gravado fora do passo sequencial abaixo, e a varredura para na mesma linha de antes.
    const linhasLidas = async (lote) => Promise.all(lote.map(async k => {
      const raw = await kvOrThrow(env).get(k);
      if (!raw) return { k, raw: null, p: null };
      return { k, raw, p: await getProfile(env, k.slice(`rank:${season}:`.length)) };
    }));
    for (const lote of emLotes(keys, LOTE_KV)) {
      // Lista pública cheia: no caminho do índice o resto da varredura não muda nada (só o `me` oculto, abaixo).
      if (ordenados && rows.length >= 50) break;
      for (const { k, raw, p } of await linhasLidas(lote)) {
        if (ordenados && rows.length >= 50) break;
        if (!raw) { semLinha.push(k.slice(`rank:${season}:`.length)); continue; }
        let rec;
        try { rec = JSON.parse(raw); } catch { continue; }
        allPoints.push({ owner: k.slice(`rank:${season}:`.length), points: Number(rec.points) || 0 });
        // Atenção: a chave do rank é o saveId. Esta variável já se chamou `pid`,
        // o que ajudava a esconder que o ranking publicava a chave do save.
        const ownerSave = k.slice(`rank:${season}:`.length);
        if (isHidden(p)) {
          // Fora da lista de TODOS os outros — nem a linha, nem o apelido.
          if (meId && ownerSave === meId) {
            meRow = { id: await ensurePid(env, p), points: rec.points, wins: rec.wins, losses: rec.losses, lifetime: p.lifetimePoints ?? 0, hidden: true };
          }
          continue;
        }
        const rowSpriteUrl = spriteUrlOrNull(p?.spriteUrl);
        const linha = {
          // Sem perfil não há identidade pública: a linha do rank existe (o
          // `rank:` dura mais que o `profile:`), mas não é endereçável.
          // L07-04: leitura de terceiro NÃO escreve. Só a linha do próprio dono
          // autenticado (meId passou por denyUnlessOwner) migra o pid legado.
          id: p ? (meId && ownerSave === meId ? await ensurePid(env, p) : await pidSoLeitura(p)) : null,
          name: p?.name || 'Anônimo', petName: petNameDoSimulado(p) || '', stage: p?.stage || 'rookie',
          avatarId: avatarIdOrNull(p?.avatarId), frameId: frameIdOrNull(p?.frameId), artLine: artLineOrNull(p?.artLine),
          ...(rowSpriteUrl ? { spriteUrl: rowSpriteUrl } : {}),
          points: rec.points, wins: rec.wins, losses: rec.losses,
          // WP4.13: a faixa lê ISTO, não `points` — `points` é da season e cai.
          lifetime: p?.lifetimePoints ?? 0,
        };
        if (p) saveDaLinha.set(linha, ownerSave);
        rows.push(linha);
      }
    }
    rows.sort((a, b) => b.points - a.points);
    const publicas = await comGuildas(env, rows.slice(0, 50), r => saveDaLinha.get(r));
    if (autenticado && semLinha.length) await podarIndice(env, season, semLinha); // conta apagada / linha vencida: sai da ordem
    if (action === 'seasonResult') return json({ season, top3: publicas.slice(0, 3) });
    let myPlace = null;
    if (meId && admins.has(meId)) {
      myPlace = null; // GM/admin não ocupa posição
    } else if (ordenados && meId) {
      const at = ordenados.findIndex(r => r.owner === meId);
      if (at >= 0) myPlace = at + 1;
      // Oculto e fora da faixa varrida: a linha `me` sai da leitura direta, como antes.
      if (!meRow && at >= 0) {
        const p = await getProfile(env, meId);
        if (isHidden(p)) {
          const rec = await getRank(env, season, meId);
          meRow = { id: await ensurePid(env, p), points: rec.points, wins: rec.wins, losses: rec.losses, lifetime: p.lifetimePoints ?? 0, hidden: true };
        }
      }
    } else if (meId) {
      allPoints.sort((a, b) => (b.points - a.points) || (a.owner < b.owner ? -1 : a.owner > b.owner ? 1 : 0));
      const at = allPoints.findIndex(r => r.owner === meId);
      if (at >= 0) myPlace = at + 1;
    }
    return json({ season, rank: publicas, ...(meRow ? { me: meRow } : {}), ...(myPlace ? { myPlace } : {}) });
  }

  // Histórico de temporadas do PRÓPRIO jogador (modal "Última temporada"). Só o dono lê; reconstrói do KV o que falta (`_seasonHist.js`).
  if (action === 'seasonHistory' && method === 'GET') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    return json(await historicoDoJogador(env, id, currentSeason()));
  }

  // Fecha uma season: dá troféu (place 1/2/3) aos 3 primeiros do rank. Chamado
  // manualmente ou por um cron (ex.: workers/push-scheduler.js) no 1º dia do
  // mês seguinte. Protegido por SEASON_ADMIN_KEY (secret do wrangler).
  if (action === 'closeSeason' && method === 'POST') {
    const { season, adminKey } = body;
    if (!env.SEASON_ADMIN_KEY || !secretEquals(adminKey, env.SEASON_ADMIN_KEY)) return json({ error: 'unauthorized' }, 401);
    if (!/^\d{4}-\d{2}$/.test(season || '')) return json({ error: 'invalid season' }, 400);
    // Idempotência do FECHAMENTO, e ela é do SERVIDOR de propósito: a partir do
    // WP4.18 quem chama é um cron, e cron repete (retry, deploy duplicado, dois
    // triggers no dashboard). Sem esta trava a segunda passada empurraria o
    // MESMO troféu de novo para `pendingTrophies` — o campeão receberia dois
    // 🥇 da mesma season e a vitrine mentiria.
    const closedKey = `closed:${season}`;
    if (await kvOrThrow(env).get(closedKey)) {
      return json({ ok: true, season, awarded: 0, already: true });
    }
    // Índice ordenado (REGISTRO §23): o pódio sai da season INTEIRA, não das 300 primeiras chaves por saveId. Os
    // primeiros colocados são RECONFERIDOS na linha `rank:` (o índice é só candidato). Os primeiros colocados são RECONFERIDOS na linha `rank:` (o índice é só candidato).
    const admins = await adminSaveIds(env); // GM/admin nunca leva troféu nem Honra de colocação
    const indice = await completarIndice(env, season, CLOSE_INDEX_BUDGET);
    // Índice ainda incompleto depois do lote: o cron chama UMA vez, então a season fecha mesmo assim, pelo caminho
    // antigo (300 chaves `rank:` em ordem de saveId), com log para o dono saber que o pódio saiu do limite herdado.
    let keys;
    if (indice.done) {
      // Simulado é pulado ANTES da releitura (nunca premia e não gasta subrequest); o teto conta só candidatos reais.
      keys = ordenar(indice.p).filter(r => !isSimuladoId(r.owner) && !admins.has(r.owner)).slice(0, CLOSE_SCAN_MAX).map(r => `rank:${season}:${r.owner}`);
    } else {
      console.warn(JSON.stringify({ event: 'season.close.fallback', season, indexed: Object.keys(indice.p).length }));
      keys = (await listPrefix(env, `rank:${season}:`, 300)).filter(k => !admins.has(k.slice(`rank:${season}:`.length)));
    }
    const rows = [];
    for (const k of keys) {
      const raw = await kvOrThrow(env).get(k);
      if (!raw) continue;
      // Linha ilegível não derruba o fechamento (o cron só tenta no dia 1 e a season ficaria sem pódio), e
      // `points` não numérico vira 0 como no `rank` — `NaN` no `sort` embaralhava o pódio.
      let rec;
      try { rec = JSON.parse(raw); } catch { continue; }
      rows.push({ id: k.slice(`rank:${season}:`.length), points: Number(rec?.points) || 0 });
    }
    rows.sort((a, b) => b.points - a.points);
    // M11: simulado nunca leva prêmio — o troféu desce para o próximo jogador REAL (mesma regra de `payablePlacements`).
    const top3 = [];
    for (const row of rows) {
      if (top3.length >= 3) break;
      if (isSimuladoId(row.id)) continue;
      const p = await getProfile(env, row.id);
      if (p?.simulated === true) continue;
      top3.push({ ...row, p });
    }
    for (let i = 0; i < top3.length; i++) {
      const p = top3[i].p;
      if (!p) continue;
      p.pendingTrophies = p.pendingTrophies || [];
      p.pendingTrophies.push({ season, place: i + 1 });
      await putProfile(env, top3[i].id, p);
      await registrarColocacao(env, top3[i].id, season, i + 1, top3[i].points); // histórico do jogador (modal "Última temporada")
    }
    // TTL de 400 d (QA rodada 2, `04-dados-r2` #12): a marca só precisa
    // sobreviver ao retry do cron e a `rank:<season>:*` (120 d). Sem prazo era
    // a única chave imortal por acidente, crescendo uma por mês.
    await kvOrThrow(env).put(closedKey, JSON.stringify({ at: Date.now(), awarded: top3.length }), { expirationTtl: CLOSED_SEASON_TTL });
    return json({ ok: true, season, awarded: top3.length });
  }

  // ── O Mensageiro (§241): cartas com prêmio. O dono lê e confirma as dele; só o admin envia. ──
  if (action === 'mail' && method === 'GET') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    return json({ mail: await readMail(env, kvOrThrow(env), id) });
  }
  // `mailAck` (Antislop P6, item 11): SEM chamador no app de hoje, mas FICA para o bundle anterior à caixa (§246, #624 de
  // 08/11/2026; APK com assets locais ou service worker velho), que credita a carta no save (`mailClaimed`) e depois confirma
  // aqui. Por isso não tem a guarda de prêmio pendente: para esse cliente a carta pendente no servidor É a que ele já creditou.
  // Só apaga cartas do próprio dono (`denyUnlessOwner`). Remover quando nenhum bundle anterior a 08/11 estiver no ar.
  if (action === 'mailAck' && method === 'POST') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const mids = body.mids;
    if (!Array.isArray(mids) || mids.length > 30 || !mids.every(x => typeof x === 'string' && x.length > 0 && x.length <= 80)) return json({ error: 'invalid mids' }, 400);
    return json({ ok: true, removed: await ackMail(kvOrThrow(env), id, mids) });
  }
  // Caixa de cartas (§246). Todas só do dono (`denyUnlessOwner`); o prêmio vem do registro do servidor, nunca do corpo.
  const midsValidos = (m) => Array.isArray(m) && m.length > 0 && m.length <= 30 && m.every(x => typeof x === 'string' && x.length > 0 && x.length <= 80);
  if (action === 'mailRead' && method === 'POST') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    if (!midsValidos(body.mids)) return json({ error: 'invalid mids' }, 400);
    return json({ ok: true, marked: await markRead(kvOrThrow(env), id, body.mids) });
  }
  // { id, mids[] } ou { id, all: true }. Devolve só o que foi resgatado AGORA; repetir devolve [].
  if (action === 'mailClaim' && method === 'POST') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    if (body.all !== true && !midsValidos(body.mids)) return json({ error: 'invalid mids' }, 400);
    return json({ ok: true, granted: await claimMail(kvOrThrow(env), id, body.all === true ? null : body.mids, Date.now(), env.DB ?? null) });
  }
  // { id, mids[], force? } ou { id, scope: 'read' }. Carta com prêmio pendente só sai com `force: true`.
  if (action === 'mailDelete' && method === 'POST') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    if (body.scope === 'read') return json({ ok: true, ...(await deleteMail(kvOrThrow(env), id, 'read')) });
    if (!midsValidos(body.mids)) return json({ error: 'invalid mids' }, 400);
    const { convitesDeClaRecusados = [], ...apagadas } = await deleteMail(kvOrThrow(env), id, body.mids, body.force === true);
    // §388: recusar o convite de clã (apagar a carta dele) bloqueia o MESMO clã por 7 dias. Melhor esforço: a carta já saiu.
    for (const gid of convitesDeClaRecusados) await marcarRecusa(kvOrThrow(env), 'g', gid, id).catch(falhaDaCarta('mailDelete.recusa', id));
    return json({ ok: true, ...apagadas });
  }
  // Notícia ou compensação: POST { adminKey, ids[], mail: { mid, bodyPt, bodyEn, titlePt?, titleEn?, bits?, emblems? } }. Mesmo `mid` repetido não paga duas vezes.
  if (action === 'mailSend' && method === 'POST') {
    if (!env.SEASON_ADMIN_KEY || !secretEquals(body.adminKey, env.SEASON_ADMIN_KEY)) return json({ error: 'unauthorized' }, 401);
    const ids = body.ids;
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100 || !ids.every(x => typeof x === 'string' && x.length <= 80)) return json({ error: 'invalid ids' }, 400);
    let sent = 0;
    for (const alvo of ids) if (await enqueueMail(env, kvOrThrow(env), alvo, { ...body.mail, at: Date.now() })) sent++;
    return json({ ok: true, sent });
  }

  if (action === 'trophies' && method === 'GET') {
    // `claim=1` é DESTRUTIVO e não tem reemissão: quem lesse o troféu alheio
    // apagava a conquista da pessoa para sempre.
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const p = await getProfile(env, id);
    const trophies = p?.pendingTrophies || [];
    if (url.searchParams.get('claim') === '1' && trophies.length && p) {
      p.pendingTrophies = [];
      await putProfile(env, id, p);
    }
    return json({ trophies });
  }

  // ── Amigos ────────────────────────────────────────────────────────────────
  // ── Formas que o Soulmon de um AMIGO já teve (leitura autenticada, só entre amigos) ─────────────────────────
  // `id` = saveId do chamador (autorizado como dono), `friend` = pid do amigo. 403 se o amigo não está na lista de
  // quem pede (mesmo padrão de `friends`/`gift`); amigo escondido/inexistente responde igual ao não-amigo (não confirma a conta).
  if (action === 'forms' && method === 'GET') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const friendPid = url.searchParams.get('friend') || '';
    const friendSave = VALID_ID.test(friendPid) ? await saveIdForPublicId(env, friendPid) : null;
    const me = await getProfile(env, id);
    const p = friendSave ? await getProfile(env, friendSave) : null;
    if (!friendSave || !me || !(me.friends || []).includes(friendSave) || !p || isHidden(p)) return json({ error: 'not friends' }, 403);
    let state = null;
    try {
      const value = await kvOrThrow(env).get(friendSave);
      if (typeof value === 'string' && value.length <= DUEL_SAVE_MAX_CHARS) state = JSON.parse(value);
    } catch { state = null; }
    return json({ forms: formsFromSaveState(state, p.element).map(({ stage, spriteUrl, element, date }) => ({ stage, spriteUrl, element, date })) });
  }

  // ── Ficha de luta de um AMIGO para o Treino com amigo (17/11/2026, decisão do dono) ─────────────────────────
  // Só entre amigos (mesma régua de `forms`). Devolve APENAS o lado do amigo, o mesmo `DuelSide` que o duelo ranqueado já
  // entrega ao oponente (especial da escola, fx cosmético e, se evocador, `invoca`/`companheiro`): nada de pontos, limiares,
  // save nem pid/saveId. Sem custo, sem ticket, sem cota e sem gravar nada. Falha = 404 e o cliente cai no lado comum.
  if (action === 'friendSide' && method === 'GET') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const friendPid = url.searchParams.get('friend') || '';
    const friendSave = VALID_ID.test(friendPid) ? await saveIdForPublicId(env, friendPid) : null;
    const me = await getProfile(env, id);
    const p = friendSave ? await getProfile(env, friendSave) : null;
    if (!friendSave || !me || !(me.friends || []).includes(friendSave) || !p || isHidden(p)) return json({ error: 'not friends' }, 403);
    const { side, bbLocked } = await loadDuelSideWithSprite(env, friendSave);
    if (!side || bbLocked) return json({ error: 'side unavailable' }, 404);
    return json({ side });
  }

  // ── Amizade por CONVITE (§243) ────────────────────────────────────────────
  // `friends` {add} agora ENVIA convite (a pessoa aceita em `friendAccept`); `friends` {remove} desfaz nos dois lados.
  // Resposta de convite é a mesma para alvo simulado (nada gravado), cheio ou com a caixa lotada: não confirma estado alheio.
  const friendPids = async (saveIds) => (await Promise.all(saveIds.map(f => pidDeSaveId(env, f)))).filter(Boolean);
  if (action === 'friends' && method === 'POST') {
    const { friendId, remove } = body;
    if (!VALID_ID.test(id || '') || !VALID_ID.test(friendId || '')) return json({ error: 'invalid id' }, 400);
    // Escreve o perfil de `id`. Sem autorizar, qualquer um inseria a si mesmo
    // na lista de amigos alheia (passo 1 do roubo de presentes) ou esvaziava
    // a lista da vítima.
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    // O alvo chega como pid público; só o servidor resolve para o saveId.
    const friendSave = await saveIdForPublicId(env, friendId);
    if (!friendSave) return json({ error: 'friend not found' }, 404);
    if (id === friendSave) return json({ error: 'cannot befriend yourself' }, 400);
    const me = await getProfile(env, id);
    if (!me) return json({ error: 'profile not found' }, 404);
    if (remove) {
      // Remover um amigo que se escondeu continua possível; desfaz os dois lados e cancela convite pendente.
      await desfazerAmizade(env, id, friendSave);
      // Convite cancelado: a carta dele some da caixa do outro lado (melhor esforço; o aceite tardio já responde 404).
      await removerConvitesDe(kvOrThrow(env), friendSave, await ensurePid(env, me)).catch(falhaDaCarta('friends.remove', friendSave));
      const depois = await getProfile(env, id);
      return json({ ok: true, friends: await friendPids(depois?.friends || []) });
    }
    // Quem saiu da lista pública também não é convidável: não confirma que a conta existe.
    const alvo = await getProfile(env, friendSave);
    if (!alvo || isHidden(alvo)) return json({ error: 'friend not found' }, 404);
    me.friends = me.friends || [];
    if (me.friends.includes(friendSave)) return json({ ok: true, status: 'friends', friends: await friendPids(me.friends) });
    if (me.friends.length >= MAX_FRIENDS) return json({ error: `friend limit (${MAX_FRIENDS})` }, 400);
    const gate = takeToken('friend-invite', id, FRIEND_INVITE_HOURLY);
    if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);
    // §388: teto DIÁRIO por remetente no KV (vale entre isolates), além do teto por hora acima.
    if (!(await contarConviteDoDia(kvOrThrow(env), 'f', id))) return tooManyRequests(segundosAteAmanhaUtc(), CORS);
    const minha = await lerConvites(env, id);
    // Ele já tinha me convidado: os dois querem, vira amizade na hora.
    if (minha.in.some(r => r.from === friendSave)) {
      const r = await ligarAmizade(env, id, friendSave);
      if (r.erro === 'theirs-full') return json({ ok: true, status: 'pending', friends: await friendPids(me.friends) });
      if (r.erro) return json({ error: 'friend not found' }, 404);
      await gravarConvites(env, id, { in: minha.in.filter(x => x.from !== friendSave), out: minha.out.filter(f => f !== friendSave) });
      const dele = await lerConvites(env, friendSave);
      await gravarConvites(env, friendSave, { in: dele.in.filter(x => x.from !== id), out: dele.out.filter(f => f !== id) });
      await removerConvitesDe(kvOrThrow(env), id, friendId).catch(falhaDaCarta('friendAccept', id));
      return json({ ok: true, status: 'friends', friends: await friendPids((await getProfile(env, id))?.friends || []) });
    }
    if (minha.out.includes(friendSave)) return json({ ok: true, status: 'pending', friends: await friendPids(me.friends) });
    if (minha.out.length >= MAX_OUT) return json({ error: 'too many pending invites' }, 429);
    // Simulado nunca recebe convite: resposta igual à de um convite real, nada gravado.
    if (alvo.simulated === true) return json({ ok: true, status: 'pending', friends: await friendPids(me.friends) });
    // §388: o outro RECUSOU um convite meu há menos de 7 dias: a mesma resposta do sucesso, nada gravado (não revela a recusa).
    if (await parBloqueado(kvOrThrow(env), 'f', id, friendSave)) return json({ ok: true, status: 'pending', friends: await friendPids(me.friends) });
    const dele = await lerConvites(env, friendSave);
    const novo = !dele.in.some(r => r.from === id) && dele.in.length < MAX_IN;
    if (novo) dele.in.push({ from: id, at: Date.now() });
    await gravarConvites(env, friendSave, dele);
    // O convite também chega por CARTA do Papus (§288). Quem se escondeu não aparece nos convites, então não manda carta. Melhor esforço: o convite já está gravado.
    if (novo && !isHidden(me)) {
      try {
        const pid = await ensurePid(env, me);
        const nome = me.name || '';
        // §358: uma carta pendente por par e no máximo 20 convites pendentes na caixa (`enqueueInvite`).
        await enqueueInvite(env, kvOrThrow(env), friendSave, {
          mid: `invite:${pid}:${Date.now().toString(36)}`, kind: 'friend-invite', fromPid: pid,
          titlePt: 'Convite de amizade', titleEn: 'Friend invite',
          bodyPt: `${nome || 'Alguém'} convidou você para ser amigo. Aceitar?`,
          bodyEn: `${nome || 'Someone'} invited you to be friends. Accept?`,
          at: Date.now(),
        }, m => m.kind === 'friend-invite' && m.fromPid === pid);
      } catch (err) { falhaDaCarta('friends.invite', friendSave)(err); /* o convite segue na lista de Amigos */ }
    }
    minha.out.push(friendSave);
    await gravarConvites(env, id, minha);
    return json({ ok: true, status: 'pending', friends: await friendPids(me.friends) });
  }

  // Aceitar (ou recusar) um convite recebido. `friendId` = pid de quem convidou.
  if (action === 'friendAccept' && method === 'POST') {
    const { friendId, decline } = body;
    if (!VALID_ID.test(id || '') || !VALID_ID.test(friendId || '')) return json({ error: 'invalid id' }, 400);
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const quem = await saveIdForPublicId(env, friendId);
    if (!quem || quem === id) return json({ error: 'no invite' }, 404);
    const meus = await lerConvites(env, id);
    if (!meus.in.some(r => r.from === quem)) return json({ error: 'no invite' }, 404);
    const limpar = async () => {
      await gravarConvites(env, id, { in: meus.in.filter(r => r.from !== quem), out: meus.out });
      const dele = await lerConvites(env, quem);
      await gravarConvites(env, quem, { in: dele.in, out: dele.out.filter(f => f !== id) });
      await removerConvitesDe(kvOrThrow(env), id, friendId).catch(falhaDaCarta('friendAccept', id));
    };
    if (decline === true) {
      await limpar();
      // §388: recusou: quem convidou só chega a esta conta de novo depois de 7 dias.
      await marcarRecusa(kvOrThrow(env), 'f', quem, id);
      return json({ ok: true, friends: await friendPids((await getProfile(env, id))?.friends || []) });
    }
    const alvo = await getProfile(env, quem);
    if (!alvo || isHidden(alvo)) { await limpar(); return json({ error: 'no invite' }, 404); }
    const r = await ligarAmizade(env, id, quem);
    if (r.erro === 'mine-full') return json({ error: `friend limit (${MAX_FRIENDS})` }, 400);
    if (r.erro === 'theirs-full') { await limpar(); return json({ error: 'invite expired' }, 409); }
    if (r.erro) { await limpar(); return json({ error: 'no invite' }, 404); }
    await limpar();
    return json({ ok: true, status: 'friends', friends: await friendPids((await getProfile(env, id))?.friends || []) });
  }

  // O estado social de QUEM PERGUNTA, numa leitura só: amigos, convites, presentes de hoje e o histórico de quem presenteou.
  // Só o dono lê. Nunca devolve saveId; nome é o do perfil (já filtrado na gravação) e some se a pessoa se escondeu.
  if (action === 'friendsState' && method === 'GET') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const me = await getProfile(env, id);
    const tz = tzDe(url.searchParams.get('zone'), url.searchParams.get('off'));
    await lembrarTz(env, id, tz).catch(() => {});
    if (!me) return json({ friends: [], incoming: [], outgoing: [], sentToday: [], notes: [], unseen: 0, limit: MAX_FRIENDS, dailyCap: GIFT_DAILY_CAP });
    // Migração preguiçosa e idempotente (a varredura do dono é `friendsMigrate`): uma vez por conta, o que ela já tinha vira mútuo.
    const marca = `gmir:${id}`;
    if (!(await kvOrThrow(env).get(marca))) {
      await espelharAmizades(env, id);
      await kvOrThrow(env).put(marca, '1', { expirationTtl: 86400 * 400 });
    }
    const fresco = (await getProfile(env, id)) || me;
    const convites = await lerConvites(env, id);
    const incoming = [];
    for (const r of convites.in.slice(-MAX_IN).reverse()) {
      const p = await getProfile(env, r.from);
      if (!p || isHidden(p) || p.simulated === true) continue;
      incoming.push({ id: await ensurePid(env, p), name: p.name, ...campoGuilda(await nomeDaGuildaDe(env, r.from)), at: r.at });
      if (incoming.length >= 20) break;
    }
    const outgoing = [];
    for (const f of convites.out) { const pid = await pidDeSaveId(env, f, { semEscondidos: true }); if (pid) outgoing.push(pid); }
    const sentToday = [];
    for (const f of await presentesDeHoje(env, id, diaDe(tz))) { const pid = await pidDeSaveId(env, f); if (pid) sentToday.push(pid); }
    const notas = await lerNotas(env, id);
    const notes = notas.items.slice().reverse().map(n => ({ name: n.name, bits: n.bits, at: n.at, unseen: n.at > notas.seenAt }));
    return json({
      friends: await friendPids(fresco.friends || []),
      incoming, outgoing, sentToday, notes,
      unseen: notes.filter(n => n.unseen).length,
      limit: MAX_FRIENDS,
      dailyCap: GIFT_DAILY_CAP,
    });
  }

  // O jogador abriu o histórico: as notícias de presente deixam de ser novas (convites seguem até alguém decidir).
  if (action === 'friendsSeen' && method === 'POST') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    await marcarNotasVistas(env, id);
    return json({ ok: true });
  }

  // Varredura do dono: espelha as amizades antigas (lote por cursor, repetir até `done`). Idempotente, não apaga nada.
  if (action === 'friendsMigrate' && method === 'POST') {
    if (!env.SEASON_ADMIN_KEY || !secretEquals(body.adminKey, env.SEASON_ADMIN_KEY)) return json({ error: 'unauthorized' }, 401);
    const page = await kvOrThrow(env).list({ prefix: 'profile:', cursor: typeof body.cursor === 'string' && body.cursor ? body.cursor : undefined, limit: 40 });
    let espelhados = 0, pulados = 0;
    for (const k of page.keys) {
      const r = await espelharAmizades(env, k.name.slice('profile:'.length)).catch(() => ({ espelhados: 0, pulados: 0 }));
      espelhados += r.espelhados; pulados += r.pulados;
    }
    return json({ ok: true, scanned: page.keys.length, espelhados, pulados, done: !!page.list_complete, ...(page.list_complete ? {} : { cursor: page.cursor }) });
  }

  // ── Presente de bits (grátis; 20 Bits, 1x/dia/amigo, contado AQUI no servidor) ──
  if (action === 'gift' && method === 'POST') {
    const { friendId } = body;
    if (!VALID_ID.test(id || '') || !VALID_ID.test(friendId || '')) return json({ error: 'invalid id' }, 400);
    // O remetente é `id`. Sem autorizar, dava para emitir presente EM NOME de
    // outro jogador para a própria conta — 20 Bits por vítima por dia.
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const friendSave = await saveIdForPublicId(env, friendId);
    if (!friendSave) return json({ error: 'not a friend' }, 403);
    const me = await getProfile(env, id);
    if (!me) return json({ error: 'profile not found' }, 404);
    if (!(me.friends || []).includes(friendSave)) return json({ error: 'not a friend' }, 403);
    // O "1 por dia" é do dia do REMETENTE (âncora que o cliente manda; sem ela, UTC) e o teto, do dia de QUEM RECEBE.
    const tzMeu = tzDe(body.zone, body.off);
    const diaMeu = diaDe(tzMeu);
    await lembrarTz(env, id, tzMeu).catch(() => {});
    // Fila por par: dois toques em paralelo não passam os dois pelo limite do dia (mesma ressalva honesta do duelo: por isolate).
    return await withDuelLock(`gift:${id}:${friendSave}`, async () => {
      // O registro do dia mora em `gsent:` (o `giftLog` do perfil se perdia a cada regravação do perfil); o legado ainda vale.
      const hoje = await presentesDeHoje(env, id, diaMeu);
      if (hoje.includes(friendSave) || (me.giftLog && me.giftLog[friendSave] === diaMeu)) return json({ error: 'already gifted today' }, 429);
      const reivindicacao = await reivindicarPresenteDoDia(env, id, friendSave, diaMeu);
      if (!reivindicacao.ok) return json({ error: 'already gifted today' }, 429);
      try {
        await marcarPresenteDeHoje(env, id, friendSave, diaMeu);
      } catch (err) {
        await reivindicacao.soltar();
        throw err;
      }
      // Missoes de presente (REGISTRO §309): o presente ACEITO aqui e o evento confirmado da semanal gift-sent e da diaria d-presente. Melhor esforco.
      try { await recordMissionEvent(kvOrThrow(env), id, 'g', diaMeu); } catch { /* o razao das missoes nao pode derrubar o presente */ }

      // M11: presente para um simulado é aceito SEM efeito — nada é gravado e ninguém é debitado ou creditado (a resposta
      // é a mesma de um presente real; o limite diário acima já valeu).
      const alvo = await getProfile(env, friendSave);
      if (alvo?.simulated === true) return json({ ok: true, credited: GIFT_BITS });

      // Teto de recebimento por dia do destinatário: o excedente não credita (a fila só leva o que vale de verdade).
      return await withDuelLock(`gcap:${friendSave}`, async () => {
        const credited = await reservarRecebimento(env, friendSave, GIFT_BITS);
        const quem = isHidden(me) ? '' : me.name;
        // O presente chega por CARTA do Papus, com "Resgatar" (§288). Caixa sem espaço (30 cartas, todas com prêmio): cai na fila antiga `gifts:`,
        // que o cliente ainda resgata, então nenhum presente se perde. Presentes já pendentes na fila antiga continuam sendo entregues por ela.
        const gid = crypto.randomUUID();
        let viaCarta = false;
        if (credited > 0) {
          try {
            viaCarta = await enqueueMail(env, kvOrThrow(env), friendSave, {
              mid: `gift:${gid}`, kind: 'gift',
              titlePt: 'Presente de amigo', titleEn: 'Gift from a friend',
              bodyPt: `${quem || 'Um amigo'} mandou ${credited} Bits para você.`,
              bodyEn: `${quem || 'A friend'} sent you ${credited} Bits.`,
              bits: credited, at: Date.now(),
            }, { recusarSeCheia: true });
          } catch (err) { falhaDaCarta('gift', friendSave)(err); viaCarta = false; /* cai na fila antiga `gifts:` logo abaixo */ }
        }
        if (credited > 0 && !viaCarta) {
          const raw = await kvOrThrow(env).get(`gifts:${friendSave}`);
          // Lista ilegível na KV não pode dar 500 DEPOIS do registro do dia gravado (o presente do dia sumia): recomeça vazia.
          let gifts = [];
          try { const lido = raw ? JSON.parse(raw) : []; gifts = Array.isArray(lido) ? lido : []; } catch { gifts = []; }
          gifts.push({ from: quem, bits: credited, at: Date.now(), gid });
          await kvOrThrow(env).put(`gifts:${friendSave}`, JSON.stringify(gifts.slice(-50)), { expirationTtl: 86400 * 60 });
        }
        // O histórico mostra o valor REAL (0 = o teto do dia já tinha sido atingido). Melhor esforço: o crédito já está na fila.
        try { await anotarPresente(env, friendSave, { name: quem, bits: credited }); } catch { /* o histórico é cosmético */ }
        return json({ ok: true, credited });
      });
    });
  }

  if (action === 'gifts' && method === 'GET') {
    // Mesmo caso do `trophies`: `claim=1` apaga a fila do jogador.
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    // L03-01: id estável por presente (aditivo; legado sem `gid` ganha um derivado na leitura).
    const comGid = (lista) => (Array.isArray(lista) ? lista : [])
      .filter(g => g && typeof g === 'object')
      .map((g, i) => (typeof g.gid === 'string' && g.gid ? g : { ...g, gid: `${g.at}:${g.from}:${g.bits}:${i}` }));
    const lerLista = async () => {
      const raw = await kvOrThrow(env).get(`gifts:${id}`);
      if (!raw) return [];
      try { return comGid(JSON.parse(raw)); } catch { return []; }
    };
    const gifts = await lerLista();
    if (url.searchParams.get('claim') !== '1' || !gifts.length) return json({ gifts });
    const modoAck = url.searchParams.get('ack') === '1';

    // Com D1, só entrega o presente quem ganha o INSERT de `gift:<saveId>:<gid>` (sem dobro em claims concorrentes).
    let entregues = gifts;
    if (env.DB) {
      entregues = [];
      const agora = Date.now();
      for (const g of gifts) {
        const orderId = `gift:${id}:${g.gid}`;
        try {
          await env.DB
            .prepare('INSERT INTO order_claims (order_id, save_id, claimed_at, expires_at) VALUES (?, ?, ?, ?)')
            .bind(orderId, id, agora, agora + 86400 * 90 * 1000)
            .run();
          entregues.push(g);
        } catch (err) {
          if (!ehViolacaoDeChave(err)) throw err; // já entregue por outro claim
          if (!modoAck) continue;
          // Modo ack: a trava só vale por GIFT_ACK_LEASE_MS. Passado o prazo (ack perdido), quem trocar
          // `claimed_at` com UPDATE condicional (1 linha) reentrega; o aparelho que já creditou não recredita.
          const row = await env.DB.prepare('SELECT claimed_at FROM order_claims WHERE order_id = ?').bind(orderId).first();
          const anterior = row && Number(row.claimed_at);
          if (!Number.isFinite(anterior) || agora - anterior <= GIFT_ACK_LEASE_MS) continue;
          const upd = await env.DB
            .prepare('UPDATE order_claims SET claimed_at = ? WHERE order_id = ? AND claimed_at = ?')
            .bind(agora, orderId, anterior)
            .run();
          if ((upd?.meta?.changes ?? upd?.changes ?? 0) === 1) entregues.push(g);
        }
      }
    }
    if (modoAck) return json({ gifts: entregues, ack: true }); // NÃO apaga: `giftsAck` apaga depois da confirmação
    // Releitura: remove SÓ o que foi entregue; presente que chegou no meio fica para o próximo claim.
    const idsEntregues = new Set(entregues.map(g => g.gid));
    const restantes = (await lerLista()).filter(g => !idsEntregues.has(g.gid));
    if (restantes.length) {
      await kvOrThrow(env).put(`gifts:${id}`, JSON.stringify(restantes.slice(-50)), { expirationTtl: 86400 * 60 });
    } else {
      await kvOrThrow(env).delete(`gifts:${id}`);
    }
    // Residual (3) — SÓ do legado (sem `ack=1`): GET destrutivo, resposta perdida perde a entrega. O cliente novo usa `ack=1`.
    // Residuais declarados do modo ack (decisão do dono, 21/10/2026): SEM D1, dois aparelhos que resgatam ao mesmo
    // tempo recebem os mesmos presentes (cada um credita; o conjunto local só deduplica no MESMO aparelho). COM D1, um
    // ack perdido faz o presente voltar para outro aparelho depois de GIFT_ACK_LEASE_MS (o mesmo aparelho não recredita).
    return json({ gifts: entregues });
  }

  if (action === 'giftsAck' && method === 'POST') {
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const gids = body.gids;
    if (!Array.isArray(gids) || gids.length > 50 || !gids.every(x => typeof x === 'string' && x.length > 0 && x.length <= 100)) {
      return json({ error: 'invalid gids' }, 400);
    }
    const alvo = new Set(gids);
    // Releitura (mesma técnica do claim): remove SÓ os gids confirmados; o que chegou no meio fica.
    const raw = await kvOrThrow(env).get(`gifts:${id}`);
    let lista = [];
    try { lista = raw ? JSON.parse(raw) : []; } catch { lista = []; }
    if (!Array.isArray(lista)) lista = [];
    const gidDe = (g, i) => (typeof g.gid === 'string' && g.gid ? g.gid : `${g.at}:${g.from}:${g.bits}:${i}`);
    const validos = lista.filter(g => g && typeof g === 'object');
    const restantes = validos.filter((g, i) => !alvo.has(gidDe(g, i)));
    const removed = validos.length - restantes.length;
    if (removed > 0) {
      if (restantes.length) await kvOrThrow(env).put(`gifts:${id}`, JSON.stringify(restantes.slice(-50)), { expirationTtl: 86400 * 60 });
      else await kvOrThrow(env).delete(`gifts:${id}`);
    }
    return json({ ok: true, removed });
  }

  return json({ error: 'unknown action' }, 400);
}
