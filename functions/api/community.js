// Cloudflare Pages Function — comunidade do Soulmon: perfis públicos,
// Tournament (PvP assíncrono) e Biblioteca (diretório + amigos + presentes).
// Usa o MESMO KV dos saves (DIGIAPP_SAVES) com prefixos:
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
//   GET  player    ?id=                 → perfil detalhado
//   GET  opponents ?id=                 → 3 oponentes com pvp habilitado
//   POST match     {id, opponentId}     → resolve a partida no servidor
//   GET  rank      ?season=             → top 50 da season
//   GET  seasonResult ?season=          → top 3 (para troféus)
//   POST closeSeason {season, adminKey} → fecha a season: dá troféu (top 3)
//   GET  trophies  ?id=&claim=1         → troféus pendentes do jogador (e zera)
//   POST friends   {id, friendId, remove?} → até 5 amigos
//   POST gift      {id, friendId}      → 20 bits (1x/dia por amigo; grátis)
//   GET  gifts     ?id=&claim=1        → lê (e zera) presentes pendentes

import { authorizeSaveAccess } from './_auth.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { bondLevelOf, BOND_PVP_MIN_LEVEL } from './_bond.js';
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  // `Authorization` é obrigatório nas 6 ações que passam por denyUnlessOwner.
  // Ver comentário igual em save.js: sem isto o preflight cross-origin morre.
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const VALID_ID = /^[a-zA-Z0-9_-]{8,64}$/;
const MATCHES_PER_DAY = 5;

const json = (obj, status = 200) => Response.json(obj, { status, headers: CORS });

// ── Teto de custo ────────────────────────────────────────────────────────────
// Duas classes, porque o custo delas é diferente em uma ordem de grandeza:
// `players`/`opponents`/`rank` varrem até 300 chaves do KV por chamada; as
// demais leem uma ou duas. Ver `_rateLimit.js` para o que este teto NÃO é.
const HEAVY_ACTIONS = new Set(['players', 'opponents', 'rank', 'seasonResult']);
const HEAVY_LIMIT = { limit: 20, windowMs: 60_000 };   // 20 varreduras/min/IP
const LIGHT_LIMIT = { limit: 120, windowMs: 60_000 };  // 2/s/IP no resto

// Respostas públicas e iguais para todo mundo — cacheáveis na borda. Cada acerto
// de cache é uma varredura de 300 chaves de KV que NÃO acontece. `opponents` e
// `player` ficam de fora: o primeiro é aleatório por chamada, o segundo é por
// alvo e tem cardinalidade alta demais para valer cache.
const CACHEABLE_ACTIONS = new Set(['players', 'rank', 'seasonResult']);
const EDGE_TTL_SECONDS = 60;
const today = () => new Date().toISOString().slice(0, 10);
const currentSeason = () => new Date().toISOString().slice(0, 7); // YYYY-MM

// Nível numérico de uma forma pelo prefixo do id (rookie=1 … ultra=5)
function stagePower(stage) {
  if (!stage) return 1;
  const p = String(stage).split('-')[0];
  return { rookie: 1, champion: 2, ultimate: 3, mega: 4, ultra: 5 }[p] ?? 1;
}

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
const PID_PREFIX = 'pid:';

/**
 * DERIVAÇÃO ANTIGA do pid — mantida SÓ para reconhecer e aposentar os pids
 * velhos. **Não use para gerar identidade nova.**
 *
 * Ela era `SHA-256("soulmon-pub:" + saveId)`, sem segredo nenhum. O caminho
 * pid → saveId é de mão única, e por isso ela parecia suficiente. Mas o
 * caminho que importa para o atacante é o INVERSO e ele estava aberto:
 * `saveId` é `SHA-256("soulmon:" + e-mail)`, algoritmo igualmente público, e
 * as duas derivações se encadeiam. De um e-mail qualquer saía, offline,
 * o pid da conta daquela pessoa — e daí "esse e-mail tem conta?" era só
 * perguntar (`action=player`) ou procurar na listagem pública do diretório.
 * Ver `community.playerOracle.test.js` (N-3 / item B3 da auditoria).
 */
async function legacyPidFor(saveId) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon-pub:${saveId}`));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 24);
}

/**
 * Identidade pública nova: 24 hex ALEATÓRIOS, sem relação com o saveId.
 *
 * Aleatório, e não "hash com segredo", de propósito: um pepper obriga a
 * gerenciar (e um dia rotacionar) um segredo do qual TODA identidade social já
 * publicada depende. O pid já é armazenado no perfil e indexado em `pid:` —
 * derivá-lo nunca foi necessário, só era conveniente.
 */
function newPid() {
  const b = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(b).map(x => x.toString(16).padStart(2, '0')).join('');
}

/**
 * Devolve o pid do perfil, cunhando um novo quando não há — ou quando o que
 * está lá é o pid DERIVADO antigo, que é justamente o que precisa morrer.
 *
 * Escreve no KV durante uma leitura, o que é incomum e é intencional: é uma
 * migração preguiçosa, sem passo de operação e sem janela em que uma conta
 * antiga continue endereçável pelo pid adivinhável. A escrita acontece no
 * máximo uma vez por perfil. O índice velho é apagado aqui, no caminho de
 * escrita — nunca no de leitura do atacante, para não devolver a ele um sinal
 * de tempo ("apagou algo, logo a conta existia").
 */
async function ensurePid(env, p) {
  if (p.pid && p.pid !== await legacyPidFor(p.id)) return p.pid;
  const antigo = p.pid;
  p.pid = newPid();
  await putProfile(env, p.id, p);
  await indexPublicId(env, p.id, p.pid);
  if (antigo) await env.DIGIAPP_SAVES.delete(`${PID_PREFIX}${antigo}`);
  return p.pid;
}

/** Grava o mapa reverso. Idempotente; roda a cada upsert de perfil. */
async function indexPublicId(env, saveId, pid) {
  await env.DIGIAPP_SAVES.put(`${PID_PREFIX}${pid}`, saveId, { expirationTtl: 86400 * 400 });
}

/**
 * pid → saveId. `null` quando o alvo não existe (ou ainda não se registrou).
 *
 * Recusa explicitamente um pid que seja a derivação antiga do saveId ao qual
 * ele aponta: enquanto esses índices existirem no KV, a cadeia
 * e-mail → saveId → pid continuaria resolvendo e o oráculo continuaria vivo.
 * A recusa é imediata e não depende da migração ter passado por aquele perfil.
 *
 * O hash é calculado nos DOIS ramos (com um saveId de mentira do mesmo
 * tamanho quando não há acerto) e não há escrita em ramo nenhum: um KV `get`,
 * um SHA-256, sempre. Sem isso, "pid inexistente" e "pid legado de conta
 * existente" gastariam trabalhos diferentes e o oráculo voltaria pelo relógio.
 */
const PID_PLACEHOLDER = '0'.repeat(32);
async function saveIdForPublicId(env, pid) {
  if (!VALID_ID.test(pid || '')) return null;
  const saveId = await env.DIGIAPP_SAVES.get(`${PID_PREFIX}${pid}`);
  const legado = await legacyPidFor(saveId || PID_PLACEHOLDER);
  if (!saveId || pid === legado) return null;
  return saveId;
}

/**
 * pid público de um saveId que NÃO é o autor da requisição (amigo, dono de uma
 * linha do ranking). Só o perfil sabe o pid — não há mais como calcular.
 * `null` quando aquele saveId não tem perfil.
 */
async function pidDeSaveId(env, saveId) {
  const p = await getProfile(env, saveId);
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
  return {
    id: pid,
    name: p.name, petName: p.petName, stage: p.stage,
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

async function getProfile(env, id) {
  const raw = await env.DIGIAPP_SAVES.get(`profile:${id}`);
  return raw ? JSON.parse(raw) : null;
}
async function putProfile(env, id, profile) {
  await env.DIGIAPP_SAVES.put(`profile:${id}`, JSON.stringify(profile), { expirationTtl: 86400 * 365 });
}
async function getRank(env, season, id) {
  const raw = await env.DIGIAPP_SAVES.get(`rank:${season}:${id}`);
  return raw ? JSON.parse(raw) : { points: 0, wins: 0, losses: 0, day: today(), matchesToday: 0 };
}
async function putRank(env, season, id, rec) {
  await env.DIGIAPP_SAVES.put(`rank:${season}:${id}`, JSON.stringify(rec), { expirationTtl: 86400 * 120 });
}
async function listPrefix(env, prefix, limit = 100) {
  const out = [];
  let cursor;
  do {
    const page = await env.DIGIAPP_SAVES.list({ prefix, cursor, limit: 1000 });
    for (const k of page.keys) {
      out.push(k.name);
      if (out.length >= limit) return out;
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return out;
}

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
    typeof caches !== 'undefined' &&
    caches.default;

  let hit = null;
  if (cacheable) hit = await caches.default.match(request).catch(() => null);

  // Acerto de cache = teto leve; qualquer coisa que chegue ao KV = teto da ação.
  const gate = takeToken(
    'community',
    ip,
    hit ? LIGHT_LIMIT : (HEAVY_ACTIONS.has(action) ? HEAVY_LIMIT : LIGHT_LIMIT),
  );
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

async function handleCommunity({ request, env }) {
  if (!env.DIGIAPP_SAVES) return json({ error: 'Storage not bound' }, 500);
  const url = new URL(request.url);
  const action = url.searchParams.get('action');
  const method = request.method;
  const body = method === 'POST' ? await request.json().catch(() => ({})) : {};
  const id = body.id || url.searchParams.get('id');

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
    return json({ error: auth.reason }, auth.reason === 'forbidden' ? 403 : 401);
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
      if (bondLevel < BOND_PVP_MIN_LEVEL) { pvpEnabled = false; pvpBlocked = true; }
    }
    const profile = {
      id,
      name: String(body.name || prev.name || 'Anônimo').slice(0, 24),
      stage: String(body.stage || prev.stage || 'rookie').slice(0, 40),
      petName: String(body.petName || prev.petName || '').slice(0, 32),
      unlockedStages: Array.isArray(body.unlockedStages) ? body.unlockedStages.slice(0, 16) : (prev.unlockedStages || []),
      pvpEnabled,
      attrs: body.attrs && typeof body.attrs === 'object'
        ? { virus: +body.attrs.virus || 0, data: +body.attrs.data || 0, vaccine: +body.attrs.vaccine || 0 }
        : (prev.attrs || { virus: 0, data: 0, vaccine: 0 }),
      tasksDone: Number.isFinite(+body.tasksDone) ? Math.max(0, +body.tasksDone) : (prev.tasksDone || 0),
      friends: prev.friends || [],
      createdAt: prev.createdAt || Date.now(),
      updatedAt: Date.now(),
      // `friends` guarda saveId internamente (nunca sai daqui assim) — só o
      // mapa reverso conhece a correspondência.
      pid: (pidAntigo && !pidLegado) ? pidAntigo : newPid(),
    };
    await putProfile(env, id, profile);
    await indexPublicId(env, id, profile.pid);
    if (pidLegado) await env.DIGIAPP_SAVES.delete(`${PID_PREFIX}${pidAntigo}`);
    return json({
      ok: true, id: profile.pid, pvpEnabled: profile.pvpEnabled,
      ...(pvpBlocked ? { pvpBlocked: true, bondLevel, minBondLevel: BOND_PVP_MIN_LEVEL } : {}),
    });
  }

  // ── Diretório / busca ─────────────────────────────────────────────────────
  if (action === 'players' && method === 'GET') {
    const search = (url.searchParams.get('search') || '').toLowerCase();
    const keys = await listPrefix(env, 'profile:', 300);
    const season = currentSeason();
    /** @type {Array<{ name?: string }>} */
    const players = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      const p = JSON.parse(raw);
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
      if (!p.pvpEnabled) continue;
      if (search && !String(p.name).toLowerCase().includes(search)) continue;
      players.push(await publicProfile(env, p));
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
    return json({ players });
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
    if (!p) return json({ found: false });
    const rank = await getRank(env, currentSeason(), targetSave);
    // `friends` sai como pid: internamente são saveIds, e devolvê-los cru
    // vazaria a chave do save de até 5 pessoas por consulta.
    // Amigo sem perfil não tem pid e some da lista — antes saía um pid
    // derivado que não resolvia em lugar nenhum.
    const friendPids = (await Promise.all((p.friends || []).map(f => pidDeSaveId(env, f)))).filter(Boolean);
    return json({
      found: true,
      player: await publicProfile(env, p, {
        friends: friendPids,
        rankPoints: rank.points, wins: rank.wins, losses: rank.losses,
      }),
    });
  }

  // ── Tournament ────────────────────────────────────────────────────────────
  if (action === 'opponents' && method === 'GET') {
    const keys = await listPrefix(env, 'profile:', 300);
    const me = id;
    const pool = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      const p = JSON.parse(raw);
      if (!p.pvpEnabled || p.id === me) continue;
      pool.push(await publicProfile(env, p));
    }
    // embaralha e devolve até 3
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const season = currentSeason();
    const myRank = id ? await getRank(env, season, id) : null;
    const matchesLeft = myRank
      ? MATCHES_PER_DAY - (myRank.day === today() ? myRank.matchesToday : 0)
      : MATCHES_PER_DAY;
    return json({ opponents: pool.slice(0, 3), matchesLeft: Math.max(0, matchesLeft) });
  }

  if (action === 'match' && method === 'POST') {
    const { opponentId } = body;
    if (!VALID_ID.test(id || '') || !VALID_ID.test(opponentId || '')) return json({ error: 'invalid id' }, 400);
    // A partida credita OS DOIS lados e consome a cota diária de `id`. Sem
    // autorizar o ator, dava para nomear a vítima como `id` e a si mesmo como
    // oponente: +10 pontos e +1 vitória por chamada, queimando a partida da
    // vítima. Repetido, garante o 1º lugar da season sem jogar.
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    // O oponente chega como pid público — o saveId dele nunca sai daqui.
    const oppSave = await saveIdForPublicId(env, opponentId);
    if (!oppSave) return json({ error: 'opponent unavailable' }, 404);
    if (id === oppSave) return json({ error: 'cannot fight yourself' }, 400);
    const me = await getProfile(env, id);
    const opp = await getProfile(env, oppSave);
    if (!me?.pvpEnabled) return json({ error: 'pvp disabled' }, 403);
    if (!opp?.pvpEnabled) return json({ error: 'opponent unavailable' }, 404);

    const season = currentSeason();
    const myRank = await getRank(env, season, id);
    if (myRank.day !== today()) { myRank.day = today(); myRank.matchesToday = 0; }
    if (myRank.matchesToday >= MATCHES_PER_DAY) {
      // Futuro: liberar partidas extras via anúncio (ads). Hoje: bloqueia.
      return json({ error: 'daily limit', matchesLeft: 0 }, 429);
    }

    // Poder = nível da forma + atributos totais (leve) + sorte
    const power = p =>
      stagePower(p.stage) * 10 +
      Math.min(20, ((p.attrs?.virus || 0) + (p.attrs?.data || 0) + (p.attrs?.vaccine || 0)) / 5) +
      Math.random() * 18;
    const myScore = power(me);
    const oppScore = power(opp);
    const won = myScore >= oppScore;

    myRank.matchesToday += 1;
    myRank.points = Math.max(0, myRank.points + (won ? 20 : -8));
    if (won) myRank.wins += 1; else myRank.losses += 1;
    await putRank(env, season, id, myRank);

    const oppRank = await getRank(env, season, oppSave);
    oppRank.points = Math.max(0, oppRank.points + (won ? -4 : 10));
    if (won) oppRank.losses += 1; else oppRank.wins += 1;
    await putRank(env, season, oppSave, oppRank);

    return json({
      won,
      myScore: Math.round(myScore), oppScore: Math.round(oppScore),
      points: myRank.points,
      matchesLeft: MATCHES_PER_DAY - myRank.matchesToday,
      opponent: { name: opp.name, petName: opp.petName, stage: opp.stage },
    });
  }

  if ((action === 'rank' || action === 'seasonResult') && method === 'GET') {
    const season = url.searchParams.get('season') || currentSeason();
    if (!/^\d{4}-\d{2}$/.test(season)) return json({ error: 'invalid season' }, 400);
    const keys = await listPrefix(env, `rank:${season}:`, 300);
    const rows = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      const rec = JSON.parse(raw);
      // Atenção: a chave do rank é o saveId. Esta variável já se chamou `pid`,
      // o que ajudava a esconder que o ranking publicava a chave do save.
      const ownerSave = k.slice(`rank:${season}:`.length);
      const p = await getProfile(env, ownerSave);
      rows.push({
        // Sem perfil não há identidade pública: a linha do rank existe (o
        // `rank:` dura mais que o `profile:`), mas não é endereçável.
        id: p ? await ensurePid(env, p) : null,
        name: p?.name || 'Anônimo', petName: p?.petName || '', stage: p?.stage || 'rookie',
        points: rec.points, wins: rec.wins, losses: rec.losses,
      });
    }
    rows.sort((a, b) => b.points - a.points);
    if (action === 'seasonResult') return json({ season, top3: rows.slice(0, 3) });
    return json({ season, rank: rows.slice(0, 50) });
  }

  // Fecha uma season: dá troféu (place 1/2/3) aos 3 primeiros do rank. Chamado
  // manualmente ou por um cron (ex.: workers/push-scheduler.js) no 1º dia do
  // mês seguinte. Protegido por SEASON_ADMIN_KEY (secret do wrangler).
  if (action === 'closeSeason' && method === 'POST') {
    const { season, adminKey } = body;
    if (!env.SEASON_ADMIN_KEY || adminKey !== env.SEASON_ADMIN_KEY) return json({ error: 'unauthorized' }, 401);
    if (!/^\d{4}-\d{2}$/.test(season || '')) return json({ error: 'invalid season' }, 400);
    // Idempotência do FECHAMENTO, e ela é do SERVIDOR de propósito: a partir do
    // WP4.18 quem chama é um cron, e cron repete (retry, deploy duplicado, dois
    // triggers no dashboard). Sem esta trava a segunda passada empurraria o
    // MESMO troféu de novo para `pendingTrophies` — o campeão receberia dois
    // 🥇 da mesma season e a vitrine mentiria.
    const closedKey = `closed:${season}`;
    if (await env.DIGIAPP_SAVES.get(closedKey)) {
      return json({ ok: true, season, awarded: 0, already: true });
    }
    const keys = await listPrefix(env, `rank:${season}:`, 300);
    const rows = [];
    for (const k of keys) {
      const raw = await env.DIGIAPP_SAVES.get(k);
      if (!raw) continue;
      rows.push({ id: k.slice(`rank:${season}:`.length), points: JSON.parse(raw).points });
    }
    rows.sort((a, b) => b.points - a.points);
    const top3 = rows.slice(0, 3);
    for (let i = 0; i < top3.length; i++) {
      const p = await getProfile(env, top3[i].id);
      if (!p) continue;
      p.pendingTrophies = p.pendingTrophies || [];
      p.pendingTrophies.push({ season, place: i + 1 });
      await putProfile(env, top3[i].id, p);
    }
    await env.DIGIAPP_SAVES.put(closedKey, JSON.stringify({ at: Date.now(), awarded: top3.length }));
    return json({ ok: true, season, awarded: top3.length });
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
    me.friends = me.friends || [];
    if (remove) {
      me.friends = me.friends.filter(f => f !== friendSave);
    } else if (!me.friends.includes(friendSave)) {
      if (me.friends.length >= 5) return json({ error: 'friend limit (5)' }, 400);
      me.friends.push(friendSave);
    }
    await putProfile(env, id, me);
    // Devolve pids: a lista interna é de saveIds e não pode sair daqui.
    return json({ ok: true, friends: (await Promise.all(me.friends.map(f => pidDeSaveId(env, f)))).filter(Boolean) });
  }

  // ── Presente de bits (grátis; exige energia cheia no cliente; 1x/dia/amigo)
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
    me.giftLog = me.giftLog || {};
    if (me.giftLog[friendSave] === today()) return json({ error: 'already gifted today' }, 429);
    me.giftLog[friendSave] = today();
    await putProfile(env, id, me);

    const raw = await env.DIGIAPP_SAVES.get(`gifts:${friendSave}`);
    const gifts = raw ? JSON.parse(raw) : [];
    gifts.push({ from: me.name, bits: 20, at: Date.now() });
    await env.DIGIAPP_SAVES.put(`gifts:${friendSave}`, JSON.stringify(gifts.slice(-50)), { expirationTtl: 86400 * 60 });
    return json({ ok: true });
  }

  if (action === 'gifts' && method === 'GET') {
    // Mesmo caso do `trophies`: `claim=1` apaga a fila do jogador.
    const denied = await denyUnlessOwner(id);
    if (denied) return denied;
    const raw = await env.DIGIAPP_SAVES.get(`gifts:${id}`);
    const gifts = raw ? JSON.parse(raw) : [];
    if (url.searchParams.get('claim') === '1' && gifts.length) {
      await env.DIGIAPP_SAVES.delete(`gifts:${id}`);
    }
    return json({ gifts });
  }

  return json({ error: 'unknown action' }, 400);
}
