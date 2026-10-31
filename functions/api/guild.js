// Cloudflare Pages Function — a GUILDA (`docs/PLANO-GUILDA.md`, WPG-1/WPG-2).
//
// A Guilda é o cooperativo da Fase 4.3 com teto de 12 (D-G1). O ESTADO continua
// em `_coop.js` (chaves `coop*`, sem migrar para `guild:*` — `05-servidor.md`
// §1.1); esta rota é a dona da RESPOSTA: `vistaDaGuilda` é a ÚNICA função que
// monta o que sai, e as ações `coop*` de `community.js` são ALIASES que chamam
// `handleGuild` daqui até o cliente migrar (WPG-8).
//
// Rotas (`/api/guild?action=…`), todas com `Authorization` do dono do `id`:
//   GET  guild        ?id=&dayKey=         → { guild: Vista | null }
//   POST guildCreate  {id, name}           → { guild }   409 already in a guild · 400 invalid name · 503 try again
//   POST guildJoin    {id, code}           → { guild }   404 invalid code · 409 guild full · 409 join collision · 409 already in a guild
//   POST guildCheckin {id, dayKey}         → { guild }   404 no guild · 400 invalid day
//   POST guildThread  {id, dayKey, kind:'fio', goal?:{done,heart,full}}
//                                          → { guild }   404 no guild · 400 invalid day · 400 invalid kind · 400 goal not met
//   POST guildGesture {id, dayKey, kind:'aceno'|'luz'|'descanso'}
//                                          → { guild }   404 no guild · 400 invalid kind · 429 daily limit
//   POST guildRaidHit {id, dayKey}         → { landed: true, guild }   404 no guild · 429 daily limit · 409 raid closed
//   GET  guildRewards ?id=&dayKey=         → { rewards: { pending[], scenes[], trophyOwned } }
//   POST guildClaim   {id, dayKey, week}   → { claimed: { week, outcome, emblems, trophy, trophyId, receipt } }
//                                            404 nothing to claim · 400 invalid week
//                                            409 already claimed + { receipt, claimed:{…o resgate JÁ registrado} }
//   O direito NÃO exige estar na guilda: quem golpeou e saiu ainda colhe (A-1).
//   POST guildDonate  {id, dayKey, bits}   → { guild, accepted }   404 no guild · 400 invalid bits (múltiplo de 10, ≥10) · 429 daily limit
//   POST guildSlot    {id, dayKey, item|null} → { guild }   404 no guild · 400 invalid item   (a CASA: `_casa.js`)
//   POST guildShopBuy {id, dayKey, itemId, opId} → { guild, repeated }  404 no guild · 400 invalid item/op · 409 not enough bits / already owned / op reuse   (a LOJA: `_lojaCla.js`; cliente nunca manda preço)
//   POST claPracaSlot {id, dayKey, slot:0..3, item|null} → { praca }   404 no guild · 400 invalid slot/item   (a PRAÇA: `_claPraca.js`)
//   GET  claPraca     ?id=&dayKey=         → { praca: { slots[4], gifts[], mine:{sentToday[]} } }   404 no guild
//   POST claPresente  {id, dayKey, to}     → { sent: true, praca }   404 no guild · 400 invalid target · 409 already sent today
//   POST claPresenteClaim {id, dayKey, giftId} → { claimed:{item,receipt}, praca }   404 nothing to claim
//   GET  claPlantio   ?id=&dayKey=         → { plantio }   404 no guild   (o PLANTIO: `_claPlantio.js`)
//   POST claPlantar|claRegar|claProteger|claColher {id, dayKey} → { plantio, fruit? }
//   POST claSortear {id, dayKey} → { plantio, task:'water'|'protect' } (o servidor sorteia a ação do dia; aditivo)
//        409 already planted|already watered|already protected|already harvested|not grown|grown · 404 no plant
//   GET  claMisterio  ?id=&dayKey=         → { misterio }   404 no guild   (o MISTÉRIO: `_claMisterio.js`)
//   POST claMisterioEnviar {id, dayKey}    → { misterio }   409 already sent|reward pending
//   POST claMisterioTarefa {id, dayKey, taskId} → { counted, reason?, misterio }   400 invalid task
//   POST claMisterioClaim  {id, dayKey}    → { claimed:{reward,receipt}, misterio }   404 nothing to claim
//   GET  guildWar     ?id=&dayKey=         → { war: { waiting: {size}|null, last: {day,outcome,duels[],size,enemy}|null } }   404 no guild
//   POST guildWarSeek {id, dayKey}         → { state: 'small'|'already'|'waiting'|'done', war }   404 no guild   (a GUERRA: `_guerra.js`)
//   (A FEIRA: O CHEFE E O DESAFIO — `_feira.js`; DESLIGADA até `FEIRA_CHEFE_DESDE`: antes disso respondem 404 `not available`)
//   GET  guildFeira          ?id=&dayKey=  → { evento }   404 no guild
//   POST guildFeiraAttack    {id, dayKey}  → { landed, attack:{dmg,seed,seconds,log[]}, boss:{bossId,level,bossHpPct,max,dead}, evento }
//                                            404 no guild · 409 no boss|boss dead · 429 daily limit
//   POST guildFeiraClaim     {id, dayKey, k?} → { claimed:{k,level,bossId,receipt,reward:{emblems,bits,sap,trophyId,essences:[],element}} }
//                                            404 nothing to claim · 409 already claimed + { receipt, claimed }   (o direito NÃO exige estar na guilda)
//   POST guildFeiraTrailStart {id, dayKey} → { trail:{k,game,seed,puzzle}, evento }   404 no guild · 409 no trail|already cleared
//   POST guildFeiraTrailDone  {id, dayKey, path|rects|cells|sides|score} → { cleared:true, reward:{emblems,sap}, receipt, evento }
//                                            400 wrong solution|too fast · 409 no trail|not started|already cleared · 429 daily limit
//   `guildRaidHit` ganha `evento?` (ADITIVO: ausente com a Feira desligada, e um erro ao calculá-lo nunca derruba o golpe).
//   POST guildLeave   {id}                 → { ok: true } (sempre; idempotente)
//   POST guildRename  {id, name}           → { guild }   403 not host · 400 invalid name · 404 no guild
//   POST guildNewCode {id}                 → { guild }   403 not host · 503 try again · 404 no guild
//   (PROCURAR CLÃ — `_claDiretorio.js`, REGISTRO §203; o código continua valendo igual)
//   GET  guildDirectory ?id=              → { clans:[{dirId,name,size,max}], pending:{dirId,name}|null }   (com clã: clans=[])
//   POST guildRequest   {id, dirId}        → { pending }   409 already in a guild · 404 invalid clan · 409 guild full
//                                            · 409 request pending (+{pending}: um pedido por vez; o MESMO clã = 200 idempotente) · 429
//   POST guildRequestCancel {id}           → { ok: true } (sempre; idempotente)
//   GET  guildRequests  ?id=               → { requests:[{requestId,name,at}] }   404 no guild · 403 not host
//   POST guildRequestsOpen {id, open}     → { guild }   403 not host · 404 no guild  ("Aceitar pedidos"; OFF tira do diretório,
//                                            recusa pedido novo com 409 requests closed; os pendentes seguem decidíveis; o código vale igual)
//   POST guildRequestDecide {id, requestId, approve} → { guild, result:'approved'|'declined'|'gone' }
//                                            404 no guild · 403 not host · 409 guild full (o pedido fica para depois)
// Não existe expulsão (G7): o código novo é a ferramenta de fechar a porta.
//
// `dayKey` é o DIA DO JOGADOR (`playerDayKey`), aceito a ±1 do dia UTC — o
// override de G6 registrado em `PLANO-GUILDA.md` §0.1.

import { authorizeSaveAccess, authStatus } from './_auth.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { kv, kvOrThrow } from './_kv.js';
import { loadDuelSideWithSprite } from './_duelLoad.js';
import { BB_LOCKED_MESSAGE } from './_velado.js';
import { getProfile, newPid, stagePower } from './_profile.js';
import {
  COOP_MAX_MEMBERS, PRESENCA_NOMINAL_MAX,
  coopKey, coopOfKey, coopCodeKey, semanaDoDia, diaDoJogador, sortearCodigoLivre,
  lerGrupo, gravarGrupo, renovarPrazos, lerCheckins, gravarCheckins, rolarSemana, grupoDe, coopLeave,
  sanitizarNomeDeGuilda,
  STAGE_UNLOCK_DAYS, GUILD_GESTURES, bosqueStageFor, tamanhoDaFloracao, lerFio, gravarFio, firmarFio,
  metaDoFioCumprida, atualizarBosque, lerGestos, coopGestKey, numDia, diaDeNum,
  resolverFeira, lerGolpes, coopHitKey, COOP_HIT_TTL, raidDamageFor, fenomenoDaSemana, semanaAnterior,
  ultimoDiaDaSemana, RAID_EMBLEMS, RAID_EMBLEMS_FLOOR, RAID_TROPHY_EVERY, RAID_TROPHY_ID,
  idOpacoDoMembro, lerCartoes, renovarCartao, fiosDosCartoes, checkinsDoCartao, gestosDoCartao, fioDoCartao, golpesDoCartao,
  coopClaimKey, COOP_CLAIM_TTL, coopShellKey, coopScenesKey, lerConjunto, unirConjunto, cenariosAte,
  marcarParticipacao, lerParticipacao, lerRaidOk, lerDiasCarregados, fioInicialHerdado, membrosAtivos,
} from './_coop.js';
import { buscarGuerra, estadoDaGuerra } from './_guerra.js';
import { vistaDaPraca, definirSlotPraca, enviarPresente, resgatarPresente } from './_claPraca.js';
import { vistaDoPlantio, plantar, regar, proteger, colher, sortear } from './_claPlantio.js';
import { vistaDoMisterio, enviarMisterio, somarTarefa, resgatarMisterio, converterMisterio } from './_claMisterio.js';
import { comprarNaLoja, lerLoja, vistaDaLoja } from './_lojaCla.js';
import {
  feiraLigada, lerEstadoFeira, eventoDaFeira, resumoDaFeira, simularAtaque, fichaDoAtacante, sementeDoServidor,
  gravarGolpe, marcarFeira, resgatarChefe, iniciarTrilha, entregarTrilha, FIGHT_SECONDS,
} from './_feira.js';
import { lerFeiraHit } from './_coop.js';
import {
  listarDiretorio, lerEntrada, idOpacoValido, lerPedido, lerPedidoNoCla, gravarPedido, apagarPedido, listarPedidos,
  tirarDoDiretorio, coopReqInKey, coopDirKey,
} from './_claDiretorio.js';
import { CASA_BITS_POR_DIA, casaStageFor, doarBits, definirSlot, normalizarCasa, totalDaCasa, bitsDaCasa, somarPontos, pontosDeMissao } from './_casa.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};
const VALID_ID = /^[a-zA-Z0-9_-]{8,64}$/;

/** Classe LEVE e única: nenhuma ação varre prefixo do KV (`05-servidor.md` §2.2). */
export const GUILD_LIGHT = { limit: 60, windowMs: 60_000 };

/** Ação antiga (`community.js`) → ação da Guilda. Os aliases respondem no
 *  envelope antigo (`{ group }`) e com as palavras antigas nos erros. */
export const COOP_ALIASES = Object.freeze({
  coop: 'guild',
  coopCreate: 'guildCreate',
  coopJoin: 'guildJoin',
  coopCheckin: 'guildCheckin',
  coopLeave: 'guildLeave',
});

/** Toda ação que esta rota conhece, e o método dela. */
export const GUILD_ACTIONS = Object.freeze({
  guild: 'GET',
  guildCreate: 'POST',
  guildJoin: 'POST',
  guildCheckin: 'POST',
  guildThread: 'POST',
  guildGesture: 'POST',
  guildRaidHit: 'POST',
  guildRewards: 'GET',
  guildClaim: 'POST',
  guildWar: 'GET',
  guildWarSeek: 'POST',
  guildDonate: 'POST',
  guildSlot: 'POST',
  guildShopBuy: 'POST',
  claPraca: 'GET',
  claPracaSlot: 'POST',
  claPresente: 'POST',
  claPresenteClaim: 'POST',
  claPlantio: 'GET',
  claPlantar: 'POST',
  claRegar: 'POST',
  claProteger: 'POST',
  claSortear: 'POST',
  claColher: 'POST',
  claMisterio: 'GET',
  claMisterioEnviar: 'POST',
  claMisterioTarefa: 'POST',
  claMisterioClaim: 'POST',
  guildFeira: 'GET',
  guildFeiraAttack: 'POST',
  guildFeiraClaim: 'POST',
  guildFeiraTrailStart: 'POST',
  guildFeiraTrailDone: 'POST',
  guildLeave: 'POST',
  guildRename: 'POST',
  guildNewCode: 'POST',
  guildDirectory: 'GET',
  guildRequest: 'POST',
  guildRequestCancel: 'POST',
  guildRequests: 'GET',
  guildRequestDecide: 'POST',
  guildRequestsOpen: 'POST',
});

/** Pedir para entrar: no máximo 10 pedidos por hora por pessoa — o anfitrião não vira alvo de spam. */
export const GUILD_REQUEST_LIMIT = { limit: 10, windowMs: 3_600_000 };

/** A classe de rate limit de uma ação desta rota — sempre a LEVE. */
export const limiteDaGuilda = () => GUILD_LIGHT;

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequest(context) {
  const gate = takeToken('guild', clientKey(context.request), limiteDaGuilda());
  if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);
  return handleGuild(context);
}

/** Recibo DETERMINÍSTICO de um resgate: o mesmo em qualquer aparelho/região (M3). */
export async function reciboDoResgate(save, week) {
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`soulmon-guild-claim|${save}|${week}`)));
  return Array.from(h.slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');
}

/** A partir de quantos membros o TIPO do gesto recebido sai (B5). */
export const GESTO_TIPO_MIN_MEMBROS = 3;

/** Uma semana ISO ainda recebe golpe? Até segunda 12:00 UTC da seguinte. */
export function semanaAindaAberta(week, agora = new Date()) {
  const hojeUtc = agora.toISOString().slice(0, 10);
  if (semanaDoDia(hojeUtc) === week) return true;
  const fim = ultimoDiaDaSemana(diaDeNum(numDia(hojeUtc) - 7));
  if (semanaDoDia(fim) !== week) return false; // mais de uma semana atrás
  return agora.getTime() < Date.parse(`${fim}T00:00:00Z`) + 36 * 3600 * 1000;
}

/** Anfitrião de um grupo. Grupo anterior ao campo: o criador é `members[0]`. */
const anfitriaoDe = g => g.hostSave ?? g.members[0] ?? null;

/**
 * A ÚNICA montagem de resposta da Guilda.
 *
 * NUNCA sai daqui: saveId (nem `hostSave` — sai só `isHost` de quem pergunta),
 * estágio/HP de criatura alheia (LV-G10, D-3), qualquer contagem por pessoa
 * (dias, fios, dano), quem faltou. Presença por membro só com até
 * `PRESENCA_NOMINAL_MAX`; a partir de 5, só `threadedToday`, que é `true` ou
 * `null` e NUNCA um número — "N fios" ao lado do tamanho da roda reconstrói
 * "N de M vieram" (guarda da linha vermelha, 29/09/2026, LV-G2).
 *
 * AUSÊNCIA NUNCA É UM ESTADO (M-1, L3-conformidade, LV-G2): com até 4
 * membros, `members[].apareceuHoje` e `presence[].cameToday` só existem
 * quando são `true`; a ausência da chave é o silêncio. Nenhum `false` sobre
 * outra pessoa trafega. `progress`/`target` (a barra semanal do coop antigo,
 * que zera na virada e tinha estado "não bateu") saíram (M-3).
 */
/** @param {Record<string, any> | null} [cartoesProntos] */
export async function vistaDaGuilda(env, g, euSave, hoje = new Date().toISOString().slice(0, 10), cartoesProntos = null) {
  const semana = semanaDoDia(hoje);
  const size = g.members.length;
  const nominal = size <= PRESENCA_NOMINAL_MAX;
  // A3: UMA leitura por membro (o cartão), em vez de ~9. Ver `_coop.js` › cartão.
  const cartoes = await lerCartoes(env, g, new Date(), cartoesProntos ?? {});
  const cart = g.members.map(m => cartoes[m]);
  const loja = await lerLoja(env, g.id);
  const dias = cart.map((c, i) => {
    const proprios = checkinsDoCartao(c, semana);
    return proprios.length > 0 ? proprios : (g.checkins?.[g.members[i]] || []);
  });
  // O fio de hoje também é presença (quem firmou, veio). Nunca sai contagem.
  const fios = cart.map(fioDoCartao);
  const firmou = fios.map(f => !!f?.days?.includes(hoje));
  const veio = dias.map((d, i) => d.includes(hoje) || firmou[i]);
  const membros = await Promise.all(g.members.map(async (m, i) => {
    // A4 (L2-backend): NUNCA o pid público — com ele, `community?action=player`
    // devolvia estágio/rank/amigos de qualquer membro sem token. Sai um id
    // OPACO por guilda, que não abre nada fora dela.
    const memberId = await idOpacoDoMembro(env, g.id, m);
    return {
      id: memberId,
      memberId,
      name: cart[i]?.name ?? null,
      ...(cart[i]?.sprite ? { sprite: cart[i].sprite } : {}),
      euMesmo: m === euSave,
      ...(nominal && veio[i] ? { apareceuHoje: true } : {}),
    };
  }));
  const eu = g.members.indexOf(euSave);
  // O Bosque: estágio DERIVADO na leitura; `perto` é binário. Nunca sai o
  // progresso cru, "faltam N", razão, nem nada por pessoa (§10.3, LV-G1).
  const { stage, stageIndex, perto } = bosqueStageFor(g.bosqueProgress);
  const bloom = tamanhoDaFloracao(Number(g.bosqueProgress ?? 0) - Number(g.tideBase ?? 0));
  // Gestos recebidos HOJE, em lote e anônimos: só os TIPOS, sem quem nem quantos.
  const gestos = cart.map(c => gestosDoCartao(c, hoje));
  const recebidos = new Set(gestos.flatMap((k, i) => (g.members[i] === euSave ? [] : k)));
  const meuFio = eu >= 0 ? fios[eu] : null;
  // A FEIRA (WPG-4): resolvida na leitura. Sai só o ESTADO (e `ferido`, um
  // booleano) — nunca HP, dano, quem golpeou nem quantos golpes (LV-G1).
  const feira = await resolverFeira(env, g, semana, hoje, cartoes);
  const anterior = semanaAnterior(hoje);
  const passada = await resolverFeira(env, g, anterior, ultimoDiaDaSemana(diaDeNum(numDia(hoje) - 7)), cartoes);
  // A FEIRA DO CHEFE (só com a liga ligada; SÓ LEITURA: quem abre o mistério é a volta, o ataque ou `guildFeira`): estado e agregados do CLÃ — nunca dano, golpes nem marcas por pessoa (LV-G1/LV-G10).
  let feiraVista;
  if (feiraLigada(env)) {
    try { feiraVista = resumoDaFeira(await lerEstadoFeira(env, g, hoje, { cartoes, escrever: false })); } catch (err) { console.warn('feira: resumo indisponível', String(err)); feiraVista = undefined; }
  }
  const meusGolpes = eu >= 0 ? (golpesDoCartao(cart[eu], semana) ?? await lerGolpes(env, g.id, semana, euSave)) : { days: [] };
  return {
    id: g.id,
    name: g.name,
    weekKey: semana,
    code: g.code,
    isHost: anfitriaoDe(g) === euSave,
    // §203: "Aceitar pedidos" (padrão ligado). Só o anfitrião lê; um booleano do clã, nada por pessoa.
    requestsOpen: g.dirClosed !== true,
    size,
    full: size >= COOP_MAX_MEMBERS,
    members: membros,
    presence: nominal ? membros.map(m => ({ memberId: m.memberId, ...(m.apareceuHoje ? { cameToday: true } : {}) })) : null,
    // B-2: "o bosque recebeu fios hoje" — só FIO firmado, nunca check-in.
    threadedToday: !nominal && firmou.some(Boolean) ? true : null,
    // M-1: também no `mine` as marcas só existem quando `true` (o cliente lê
    // `=== true`); "não veio"/"não firmou" é a ausência da chave.
    mine: {
      ...(eu >= 0 && veio[eu] ? { cameToday: true } : {}),
      ...(eu >= 0 && firmou[eu] ? { threadToday: true } : {}),
      // Cenários de estágio só depois de 7 dias DISTINTOS de fio (LV-G9).
      // M-2: o fio já traz os dias herdados de guildas anteriores (sair não zera).
      ...((meuFio?.distinctDays ?? 0) >= STAGE_UNLOCK_DAYS ? { groveScenes: true } : {}),
      gesturesSent: eu >= 0 ? GUILD_GESTURES.filter(k => gestos[eu].includes(k)) : [],
    },
    bosque: {
      stage,
      stageIndex,
      perto,
      tide: { key: g.tideKey ?? null, size: bloom },
      ornaments: (Array.isArray(g.ornaments) ? g.ornaments : []).map(o => ({ tide: o.tide, size: o.size, day: o.day })),
    },
    // B5 (L2-backend): com ≤2 membros o "anônimo" é quem sobrou. O TIPO não
    // sai (dizer "luz" contaria o gesto exato de uma pessoa conhecida); sai só
    // o agregado `gestureReceived`, que é `true` ou `null`. Com 3+ sai a lista
    // de tipos, em lote, sem quem nem quantos.
    gestures: size < GESTO_TIPO_MIN_MEMBROS ? [] : GUILD_GESTURES.filter(k => recebidos.has(k)),
    gestureReceived: recebidos.size > 0 ? true : null,
    // A CASA (PR2): só estágio, `perto` e os slots de item. Nunca pontos, limiares nem doação por pessoa.
    casa: {
      ...(({ stage, stageIndex, perto }) => ({ nivel: stage, nivelIndex: stageIndex, perto }))(casaStageFor(totalDaCasa(g, cartoes))),
      // W14b: o TOTAL de Bits doados ao clã (um número do clã, nunca por pessoa).
      bitsTotal: bitsDaCasa(g, cartoes),
      slots: g.members.flatMap((m, i) => {
        const c = cart[i]?.casa ? normalizarCasa(cart[i].casa) : null;
        return c?.slot ? [{ memberId: membros[i].memberId, item: c.slot, euMesmo: m === euSave }] : [];
      }),
      // R5/A: a Loja do clã (campo ADITIVO; cliente antigo ignora). Itens do clã + saldo de Bits do clã.
      loja: vistaDaLoja(loja, g, cartoes),
      mine: (() => {
        const c = eu >= 0 && cart[eu]?.casa ? normalizarCasa(cart[eu].casa) : null;
        return { slot: c?.slot ?? null, capReached: !!c && c.day === hoje && c.bitsToday >= CASA_BITS_POR_DIA };
      })(),
    },
    raid: {
      weekKey: semana,
      phenomenon: fenomenoDaSemana(semana),
      // A semana corrente só pode estar 'aberta' ou 'dissipada': "recuou" é o
      // desfecho de uma semana que TERMINOU, e sai em `lastWeek`.
      state: feira.cleared ? 'dissipada' : 'aberta',
      ferido: !feira.cleared && feira.dmg * 2 >= feira.hp,
      lastWeek: passada.cleared ? 'dissipada' : (passada.hitters.length > 0 ? 'recuou' : null),
      mine: meusGolpes.days.includes(hoje) ? { hitToday: true } : {},
    },
    ...(feiraVista ? { feira: feiraVista } : {}),
    // M-3 (L3-conformidade): `progress`/`target` NÃO trafegam mais, em nenhum
    // tamanho nem pelos aliases `coop*` — o cliente já os descartava
    // (`sanitizeGuildView`) e era um número semanal que zera na virada.
  };
}

/**
 * O roteador da Guilda — chamado por `onRequest` daqui e pelos aliases `coop*`
 * de `community.js` (que já cobraram o rate limit LEVE de lá).
 */
export async function handleGuild({ request, env }) {
  const json = (obj, status = 200) => Response.json(obj, { status, headers: CORS });
  if (!kv(env)) return json({ error: 'Storage not bound' }, 500);
  const url = new URL(request.url);
  const pedida = url.searchParams.get('action') ?? '';
  const alias = Object.prototype.hasOwnProperty.call(COOP_ALIASES, pedida);
  const action = alias ? COOP_ALIASES[pedida] : pedida;
  const method = request.method;
  if (!(action in GUILD_ACTIONS) || GUILD_ACTIONS[action] !== method) return json({ error: 'unknown action' }, 400);
  // `null` no JSON passava do `catch` e dava TypeError em `body.id`: corpo que não é objeto vira `{}`.
  const parsed = method === 'POST' ? await request.json().catch(() => null) : null;
  const body = parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  const id = body.id || url.searchParams.get('id');

  // O envelope e as palavras dos erros seguem quem chamou: o cliente antigo lê
  // `group` e 'no group'; o novo, `guild` e 'no guild'.
  const chave = alias ? 'group' : 'guild';
  const erro = (texto, status, extra = {}) => json({ error: texto.replace('{g}', chave), ...extra }, status);
  const vista = (v) => json({ [chave]: v });
  // Toda resposta com vista fecha antes os dias pendentes do Bosque (§10.5).
  // A3: os cartões são lidos UMA vez e servem ao fechamento e à vista.
  const montar = async (g, eu, dia) => {
    const cartoes = await lerCartoes(env, g);
    const fechado = await atualizarBosque(env, g, dia, new Date(), fiosDosCartoes(g, cartoes));
    return vistaDaGuilda(env, fechado, eu, dia, cartoes);
  };
  // Toda ação do PRÓPRIO membro reconstrói o cartão dele depois de escrever.
  const cartao = (g) => renovarCartao(env, g.id, id);

  // Ator = dono autenticado do `id`. 410 `account-deleted` se há lápide.
  if (!VALID_ID.test(id || '')) return json({ error: 'invalid id' }, 400);
  const auth = await authorizeSaveAccess(request, env, id);
  if (!auth.ok) {
    return json(auth.reason === 'account-deleted' ? { error: auth.reason, deletedAt: auth.deletedAt } : { error: auth.reason }, authStatus(auth));
  }

  // O dia do jogador (G6 revisto). GET lê de `?dayKey=`, POST do corpo.
  const dia = diaDoJogador(method === 'GET' ? url.searchParams.get('dayKey') : body.dayKey);
  if (!dia.ok) return erro('invalid day', 400);
  const hoje = dia.day;
  const semana = semanaDoDia(hoje);

  if (action === 'guild') {
    const g = await grupoDe(env, id, semana);
    return vista(g ? await montar(g, id, hoje) : null);
  }

  /**
   * Põe `quem` no grupo `gid` (o corpo do `guildJoin`, também usado pela APROVAÇÃO de pedido).
   * Relê antes de gravar (M2), confere depois de gravar e tenta UMA vez mais na corrida da
   * última vaga. Devolve `{ g }` (já membro = idempotente) ou `{ erro: '{g} full' | 'join collision' }`.
   */
  async function entrarNoGrupo(gid, quem, lido = null) {
    const g = (await lerGrupo(env, gid)) ?? lido;
    if (!g) return { erro: 'no {g}' };
    rolarSemana(g, semana);
    if (g.members.includes(quem)) { await apagarPedido(env, quem); return { g }; }
    if (g.members.length >= COOP_MAX_MEMBERS) return { erro: '{g} full' };
    g.members.push(quem);
    g.desde = { ...(g.desde || {}), [quem]: hoje };
    await gravarGrupo(env, g, { novosMembros: [quem] });
    // Duas pessoas na última vaga ao mesmo tempo: relê e tenta UMA vez mais;
    // perdendo as duas, erro honesto em vez de "você entrou" falso.
    let confirmado = await lerGrupo(env, g.id);
    if (confirmado && !confirmado.members.includes(quem)) {
      if (confirmado.members.length >= COOP_MAX_MEMBERS) {
        await kvOrThrow(env).delete(coopOfKey(quem));
        return { erro: '{g} full' };
      }
      confirmado.members.push(quem);
      confirmado.desde = { ...(confirmado.desde || {}), [quem]: hoje };
      await gravarGrupo(env, confirmado, { novosMembros: [quem] });
      confirmado = await lerGrupo(env, g.id);
    }
    if (!confirmado || !confirmado.members.includes(quem)) {
      await kvOrThrow(env).delete(coopOfKey(quem));
      return { erro: 'join collision' };
    }
    // Entrou (por código OU aprovação): o pedido pendente, se havia, deixa de existir.
    await apagarPedido(env, quem);
    await renovarCartao(env, confirmado.id, quem);
    return { g: rolarSemana(confirmado, semana) };
  }

  // ── PROCURAR CLÃ (§203) ──
  if (action === 'guildDirectory') {
    if (await grupoDe(env, id, semana)) return json({ clans: [], pending: null });
    const pend = await lerPedido(env, id);
    const pending = pend ? { dirId: pend.dirId, name: (await lerEntrada(env, pend.dirId))?.n ?? null } : null;
    const clans = (await listarDiretorio(env, COOP_MAX_MEMBERS))
      .sort((a, b) => b.size - a.size || a.name.localeCompare(b.name));
    return json({ clans, pending });
  }

  if (action === 'guildRequestCancel') {
    await apagarPedido(env, id);
    return json({ ok: true });
  }

  if (action === 'guildRequest') {
    if (await grupoDe(env, id, semana)) return erro('already in a {g}', 409);
    const dirId = String(body.dirId ?? '');
    const entrada = idOpacoValido(dirId) ? await lerEntrada(env, dirId) : null;
    const g = entrada ? await lerGrupo(env, entrada.gid) : null;
    if (!g) {
      if (entrada) await kvOrThrow(env).delete(coopDirKey(dirId));
      return erro('invalid clan', 404);
    }
    const atual = await lerPedido(env, id);
    if (atual && atual.gid === g.id) return json({ pending: { dirId, name: g.name } });
    if (atual) return erro('request pending', 409, { pending: { dirId: atual.dirId, name: (await lerEntrada(env, atual.dirId))?.n ?? null } });
    if (g.dirClosed === true) return erro('requests closed', 409);
    if (g.members.length >= COOP_MAX_MEMBERS) return erro('{g} full', 409);
    const gate = takeToken('guildRequest', id, GUILD_REQUEST_LIMIT);
    if (!gate.ok) return tooManyRequests(gate.retryAfter, CORS);
    const rid = await idOpacoDoMembro(env, g.id, id);
    const nome = (await getProfile(env, id).catch(() => null))?.name;
    await gravarPedido(env, id, g.id, dirId, rid, typeof nome === 'string' ? nome.slice(0, 40) : null);
    return json({ pending: { dirId, name: g.name } });
  }

  if (action === 'guildRequests' || action === 'guildRequestDecide' || action === 'guildRequestsOpen') {
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    if (anfitriaoDe(g) !== id) return erro('not host', 403);
    if (action === 'guildRequestsOpen') {
      // Releitura antes de gravar (nunca regravar por cima de uma entrada); `gravarGrupo` tira/repõe o diretório.
      const fresco = (await lerGrupo(env, g.id)) ?? g;
      if (body.open === false) fresco.dirClosed = true; else delete fresco.dirClosed;
      await gravarGrupo(env, fresco);
      return vista(await montar(rolarSemana(fresco, semana), id, hoje));
    }
    if (action === 'guildRequests') return json({ requests: await listarPedidos(env, g.id) });
    const rid = String(body.requestId ?? '');
    const pedido = await lerPedidoNoCla(env, g.id, rid);
    const dele = pedido ? await lerPedido(env, pedido.save) : null;
    // Cancelado, expirado ou trocado por outro clã: some daqui e o anfitrião vê a fila nova.
    if (!pedido || !dele || dele.gid !== g.id) {
      if (idOpacoValido(rid)) await kvOrThrow(env).delete(coopReqInKey(g.id, rid));
      return json({ result: 'gone', guild: await montar(g, id, hoje) });
    }
    if (body.approve !== true) {
      await apagarPedido(env, pedido.save);
      return json({ result: 'declined', guild: await montar(g, id, hoje) });
    }
    const ja = await grupoDe(env, pedido.save, semana);
    if (ja) {
      // Já está neste clã (aprovação repetida) ou entrou em outro por código: o pedido acaba aqui.
      await apagarPedido(env, pedido.save);
      return json({ result: ja.id === g.id ? 'approved' : 'gone', guild: await montar(g, id, hoje) });
    }
    const r = await entrarNoGrupo(g.id, pedido.save);
    if (r.erro) return erro(r.erro, 409);
    return json({ result: 'approved', guild: await montar(r.g, id, hoje) });
  }

  // Forma BB (D5): a Guilda é trancada ao BB, com o motivo. O estágio vem do SAVE do servidor (`_velado.js`).
  if ((action === 'guildCreate' || action === 'guildJoin') && (await loadDuelSideWithSprite(env, id)).bbLocked) {
    return erro('bb-locked', 403, { reason: 'bb-locked', ...BB_LOCKED_MESSAGE });
  }

  if (action === 'guildCreate') {
    // Um coletivo por pessoa (D-G1).
    const ja = await grupoDe(env, id, semana);
    if (ja) return erro('already in a {g}', 409, { [chave]: await montar( ja, id, hoje) });
    const nome = sanitizarNomeDeGuilda(body.name);
    if (!nome) return erro('invalid name', 400);
    const codigo = await sortearCodigoLivre(env);
    if (!codigo) return erro('try again', 503);
    const g = {
      id: newPid(), name: nome, code: codigo, createdAt: Date.now(),
      members: [id], hostSave: id, weekKey: semana, checkins: {},
      desde: { [id]: hoje }, bosqueProgress: 0, progressDay: diaDeNum(numDia(hoje) - 1),
    };
    await gravarGrupo(env, g, { novosMembros: [id], codigoNovo: true });
    // DOIS TOQUES EM "CRIAR" (L1-codigo ALTO-2): as duas requisições passam pelo
    // `grupoDe == null` (o KV não tem CAS). A releitura do PONTEIRO decide quem
    // ficou; quem perdeu desfaz o próprio grupo e responde 409 com a vista do
    // que venceu — idempotente para o cliente, sem órfão de 120 d.
    const vencedor = await kvOrThrow(env).get(coopOfKey(id));
    if (vencedor !== g.id) {
      await kvOrThrow(env).delete(coopKey(g.id));
      await kvOrThrow(env).delete(coopCodeKey(g.code));
      await tirarDoDiretorio(env, g.id);
      const outro = await grupoDe(env, id, semana);
      return erro('already in a {g}', 409, { [chave]: outro ? await montar(outro, id, hoje) : null });
    }
    await cartao(g);
    return vista(await montar( g, id, hoje));
  }

  if (action === 'guildJoin') {
    if (await grupoDe(env, id, semana)) return erro('already in a {g}', 409);
    // Entra-se SÓ por código: `body.groupId` (ou qualquer outro campo) é
    // ignorado. Guilda achável é raide de estranho, e o diretório respeita
    // consentimento (N-4).
    const code = String(body.code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const groupId = code ? await kvOrThrow(env).get(coopCodeKey(code)) : null;
    const lido = groupId ? await lerGrupo(env, groupId) : null;
    if (!lido) return erro('invalid code', 404);
    // B4 (L2-backend): grupo ÓRFÃO de uma criação dupla (blob + código sem
    // nenhum ponteiro de volta, nem o do anfitrião) não recebe ninguém: some
    // aqui, no primeiro uso, em vez de reunir gente em volta de um fantasma.
    const host = anfitriaoDe(lido);
    if (host && host !== id && (await kvOrThrow(env).get(coopOfKey(host))) !== lido.id) {
      await kvOrThrow(env).delete(coopKey(lido.id));
      await kvOrThrow(env).delete(coopCodeKey(code));
      await tirarDoDiretorio(env, lido.id);
      return erro('invalid code', 404);
    }
    // M2 (L2-backend): RELÊ imediatamente antes de gravar. A cópia lida pelo
    // código podia ser velha — gravá-la ressuscitava quem acabou de sair (ou
    // foi excluído) e recuava o Bosque por um instante.
    const r = await entrarNoGrupo(lido.id, id, lido);
    if (r.erro) return erro(r.erro, 409);
    return vista(await montar(r.g, id, hoje));
  }

  if (action === 'guildCheckin') {
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    // A ESCRITA É SÓ NA CHAVE DESTE MEMBRO (`coopCk:<gid>:<save>`); o blob não é
    // tocado aqui, e é isso que mata a corrida de dois check-ins na mesma noite.
    const proprios = await lerCheckins(env, g.id, id, semana);
    const meus = proprios.length > 0 ? proprios : (g.checkins?.[id] || []);
    if (!meus.includes(hoje)) {
      await gravarCheckins(env, g.id, id, [...meus, hoje], semana);
      await cartao(g);
      // Renova o prazo das chaves SÓ quando é devido (A3: no dia a dia, nada).
      await renovarPrazos(env, g.id);
    }
    return vista(await montar( g, id, hoje));
  }

  if (action === 'guildThread') {
    // O FIO (WPG-3a). Afirmação do cliente (§10.4); o servidor garante 1 por
    // (dia do jogador, pessoa). Escreve SÓ `coopFio:<gid>:<save>` — nunca o
    // blob — e é o fechamento na leitura que o soma ao Bosque.
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    if ((body.kind ?? 'fio') !== 'fio') return erro('invalid kind', 400);
    if (body.goal !== undefined && !metaDoFioCumprida(body.goal)) return erro('goal not met', 400);
    const antes = await lerFio(env, g.id, id);
    // M-2: o primeiro fio nesta guilda herda o contador de dias distintos.
    const depois = (!antes && fioInicialHerdado(await lerDiasCarregados(env, id), hoje)) || firmarFio(antes, hoje);
    if (!antes || !antes.days.includes(hoje)) { await gravarFio(env, g, id, depois); await cartao(g); }
    return vista(await montar(g, id, hoje));
  }

  if (action === 'guildGesture') {
    // Três gestos fixos, anônimos, para a roda inteira; um de cada por dia.
    // Sem texto livre, sem destinatário, sem push (§4, LV-G4).
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    const kind = String(body.kind ?? '');
    if (!GUILD_GESTURES.includes(kind)) return erro('invalid kind', 400);
    const ja = await lerGestos(env, g.id, id, hoje);
    if (ja.includes(kind)) return erro('daily limit', 429);
    await kvOrThrow(env).put(coopGestKey(g.id, id), JSON.stringify({ day: hoje, kinds: [...ja, kind] }), { expirationTtl: 86400 * 3 });
    await cartao(g);
    return vista(await montar(g, id, hoje));
  }

  if (action === 'guildWar') {
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    return json({ war: await estadoDaGuerra(env, g.id) });
  }

  if (action === 'guildWarSeek') {
    // GUERRA 4×4 (PR4): o servidor monta os esquadrões a partir dos SAVES, pareia por tamanho e resolve com o
    // combate v3. Qualquer membro pode procurar; uma guerra por guilda por dia do jogador. Nada do corpo decide a luta.
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    const r = await buscarGuerra(env, g, id, hoje, gid => lerGrupo(env, gid));
    return json({ state: r.state, war: { waiting: r.waiting, last: r.last } });
  }

  if (action === 'guildDonate') {
    // Doação de Bits para a CASA. O servidor decide quanto cabe no teto do dia e
    // devolve `accepted`: o cliente só desconta isso. Escreve SÓ a chave pessoal.
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    const r = await doarBits(env, g.id, id, hoje, body.bits);
    if (r.invalid) return erro('invalid bits', 400);
    if (r.accepted === 0) return erro('daily limit', 429);
    await cartao(g);
    return json({ accepted: r.accepted, guild: await montar(g, id, hoje) });
  }

  if (action === 'guildShopBuy') {
    // Compra na Loja do clã: o cliente manda SÓ `itemId` + `opId`; preço e saldo são do servidor.
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    const cartoes = await lerCartoes(env, g);
    const r = await comprarNaLoja(env, g, cartoes, body.itemId, body.opId);
    if (!r.ok) {
      if (r.reason === 'invalid-item') return erro('invalid item', 400);
      if (r.reason === 'invalid-op') return erro('invalid op', 400);
      return erro(r.reason === 'insufficient' ? 'not enough bits' : r.reason === 'already-owned' ? 'already owned' : 'op reuse', 409);
    }
    return json({ repeated: r.repeated, guild: await montar(g, id, hoje) });
  }

  if (action === 'guildSlot') {
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    if (body.item !== null && typeof body.item !== 'string') return erro('invalid item', 400);
    const novo = await definirSlot(env, g.id, id, body.item);
    if (novo === undefined) return erro('invalid item', 400);
    await cartao(g);
    return vista(await montar(g, id, hoje));
  }

  if (action.startsWith('cla')) {
    // OS TRÊS PRÉDIOS DO CLÃ (Praça, Plantio, Mistério). Estado em chaves KV próprias, o servidor decide
    // (sorteios, limites, calendário); a vista não traz saveId nem número por pessoa.
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    // TODO limite diario/semanal/de estacao destes predios usa o dia do SERVIDOR (UTC); o `dayKey` do cliente
    // (+-1) so serve para a exibicao das outras rotas - aqui ele deixaria triplicar presente/rega/protecao.
    const hoje = new Date().toISOString().slice(0, 10);
    const ids = {};
    for (const m of g.members) ids[m] = await idOpacoDoMembro(env, g.id, m);
    const salvoDe = opaco => g.members.find(m => ids[m] === opaco);
    const praca = async () => vistaDaPraca(env, g.id, id, g.members, ids, hoje);
    const plantio = async () => vistaDoPlantio(env, g, id, hoje);
    const misterio = async () => vistaDoMisterio(env, g, id, hoje);
    const conflito = r => erro(r.reason.replace(/-/g, ' '), r.reason === 'no-plant' ? 404 : 409);

    if (action === 'claPraca') return json({ praca: await praca() });
    if (action === 'claPracaSlot') {
      if (body.item !== null && typeof body.item !== 'string') return erro('invalid item', 400);
      const r = await definirSlotPraca(env, g.id, id, hoje, body.slot, body.item);
      if (r === undefined) return erro(Number.isInteger(body.slot) && body.slot >= 0 && body.slot < 4 ? 'invalid item' : 'invalid slot', 400);
      return json({ praca: await praca() });
    }
    if (action === 'claPresente') {
      const alvo = typeof body.to === 'string' ? salvoDe(body.to) : undefined;
      if (!alvo || alvo === id) return erro('invalid target', 400);
      const r = await enviarPresente(env, g.id, id, alvo, hoje, undefined, g.members);
      if (!r.ok) return erro('already sent today', 409);
      return json({ sent: true, praca: await praca() });
    }
    if (action === 'claPresenteClaim') {
      const [de, dia] = String(body.giftId ?? '').split('|');
      const origem = salvoDe(de);
      if (!origem || !dia) return erro('nothing to claim', 404);
      const r = await resgatarPresente(env, g.id, id, g.members, origem, dia, hoje, ids);
      if (!r.ok) return erro('nothing to claim', 404);
      return json({ claimed: { item: r.item, receipt: r.receipt }, praca: await praca() });
    }
    if (action === 'claPlantio') return json({ plantio: await plantio() });
    if (action === 'claPlantar') {
      const r = await plantar(env, g.id, id, hoje);
      if (!r.ok) return erro('already planted', 409);
      return json({ plantio: await plantio() });
    }
    if (action === 'claSortear') {
      const r = await sortear(env, g, id, hoje);
      if (!r.ok) return conflito(r);
      return json({ plantio: await plantio(), task: r.kind });
    }
    if (action === 'claRegar' || action === 'claProteger' || action === 'claColher') {
      const r = await (action === 'claRegar' ? regar : action === 'claProteger' ? proteger : colher)(env, g, id, hoje);
      if (!r.ok) return conflito(r);
      return json({ plantio: await plantio(), ...(r.fruit ? { fruit: r.fruit, receipt: r.receipt } : {}) });
    }
    if (action === 'claMisterio') return json({ misterio: await misterio() });
    if (action === 'claMisterioEnviar') {
      const r = await enviarMisterio(env, g, id);
      if (!r.ok) return conflito(r);
      return json({ misterio: await misterio() });
    }
    if (action === 'claMisterioTarefa') {
      const r = await somarTarefa(env, g, id, hoje, body.taskId);
      if (!r.ok) return erro('invalid task', 400);
      return json({ counted: r.counted, ...(r.reason ? { reason: r.reason } : {}), misterio: await misterio() });
    }
    if (action === 'claMisterioClaim') {
      const r = await resgatarMisterio(env, g, id);
      if (!r.ok) return erro('nothing to claim', 404);
      return json({ claimed: { reward: r.reward, receipt: r.receipt }, misterio: await misterio() });
    }
  }

  if (action.startsWith('guildFeira')) {
    // A FEIRA: O CHEFE E O DESAFIO (`_feira.js`). Desligada = a rota não existe (nada é gravado). O servidor decide
    // o dano (re-simulação com semente DELE), o limite diário e o abate; a resposta traz só o agregado do clã (LV-G1).
    if (!feiraLigada(env)) return erro('not available', 404);
    const g = await grupoDe(env, id, semana);
    if (action === 'guildFeiraClaim') {
      // O direito ao resgate mora com a PESSOA (A-1): quem bateu e saiu ainda colhe.
      const pedido = Number.isInteger(body.k) && body.k >= 0 ? body.k : undefined;
      const r = await resgatarChefe(env, g, id, pedido);
      if (r.ok) return json({ claimed: r.claimed });
      if (r.reason === 'claimed') return erro('already claimed', 409, { receipt: r.claimed.receipt, claimed: r.claimed });
      return erro('nothing to claim', 404);
    }
    if (!g) return erro('no {g}', 404);
    const cartoes = await lerCartoes(env, g);
    const estado = await lerEstadoFeira(env, g, hoje, { cartoes });
    if (action === 'guildFeira') return json({ evento: await eventoDaFeira(env, g, id, hoje, estado) });
    if (action === 'guildFeiraAttack') {
      if (estado.phase !== 'boss') return erro(estado.phase === 'rest' && estado.done.lastKind === 'boss' ? 'boss dead' : 'no boss', 409);
      const antes = await lerFeiraHit(env, g.id, estado.k, id);
      if (antes.days.includes(hoje)) return erro('daily limit', 429);
      const perfil = await getProfile(env, id);
      const r = simularAtaque(await fichaDoAtacante(env, id), stagePower(perfil?.stage), sementeDoServidor(), body?.taps);
      await gravarGolpe(env, g.id, estado.k, id, antes, hoje, r.dmg);
      await marcarFeira(env, g.id, estado.k, id, hoje);
      await cartao(g);
      const depois = await lerEstadoFeira(env, g, hoje, { cartoes });
      const morreu = depois.phase !== 'boss';
      return json({
        landed: true,
        attack: { dmg: r.dmg, seed: r.seed, seconds: FIGHT_SECONDS, log: r.log },
        boss: { bossId: estado.bossId, level: estado.level, bossHpPct: morreu ? 0 : depois.hpPct, max: estado.hp0, dead: morreu },
        evento: await eventoDaFeira(env, g, id, hoje, depois),
      });
    }
    if (action === 'guildFeiraTrailStart') {
      const r = await iniciarTrilha(env, g, id, hoje, estado);
      if (!r.ok) return erro(r.reason === 'already-cleared' ? 'already cleared' : 'no trail', 409);
      return json({ trail: r.trail, evento: await eventoDaFeira(env, g, id, hoje, estado) });
    }
    if (action === 'guildFeiraTrailDone') {
      const r = await entregarTrilha(env, g, id, hoje, estado, body);
      if (!r.ok) {
        if (r.reason === 'limit') return erro('daily limit', 429);
        if (r.reason === 'wrong') return erro('wrong solution', 400);
        if (r.reason === 'too-fast') return erro('too fast', 400);
        if (r.reason === 'already-cleared') return erro('already cleared', 409, { receipt: r.receipt });
        return erro(r.reason === 'no-start' ? 'not started' : 'no trail', 409);
      }
      await cartao(g);
      return json({ cleared: true, reward: r.reward, receipt: r.receipt, evento: await eventoDaFeira(env, g, id, hoje, await lerEstadoFeira(env, g, hoje, { cartoes })) });
    }
  }

  if (action === 'guildRaidHit') {
    // A FEIRA (WPG-4). Um golpe por pessoa por dia do jogador, a qualquer hora
    // da semana ISO inteira (G11). NÃO exige fio nem meta (a rodada é gesto),
    // e NÃO há gate de Vínculo (G15) — só o teto diário.
    //
    // O DANO é sorteado AQUI (`crypto`) sobre o ESTÁGIO DECLARADO no perfil
    // (`profile.stage`, que o próprio cliente grava). Um cliente adulterado que
    // se declara `ultra` bate ~20 em vez de ~12: o fenômeno da PRÓPRIA guilda
    // cai um dia antes. Não compra nada que o cliente já não pudesse farmar —
    // o prêmio é cosmético e Emblemas (que vivem no save do cliente) —, não
    // entra em ranking e não toca Bosque, coração, Créditos nem evolução.
    // Aceito (§10.4).
    //
    // Escreve SÓ `coopHit:<gid>:<week>:<save>` (a chave do próprio membro):
    // doze pessoas golpeando ao mesmo tempo escrevem doze chaves e somam doze.
    // Nunca o blob — por isso o golpe não pode tocar o Bosque (LV-G7).
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    // B1 (L2-backend): o ±1 do dia do jogador deixava golpear a semana que já
    // TERMINOU (dayKey = domingo numa segunda UTC) e mudar um desfecho já
    // lido. A semana anterior ao UTC só aceita golpe até segunda 12:00 UTC —
    // é quando o domingo acaba em UTC−12, o último fuso civil.
    if (semana < semanaDoDia(new Date().toISOString().slice(0, 10)) && !semanaAindaAberta(semana)) return erro('raid closed', 409);
    const antes = await lerGolpes(env, g.id, semana, id);
    if (antes.days.includes(hoje)) return erro('daily limit', 429);
    const cartoesDaRoda = await lerCartoes(env, g);
    const feira = await resolverFeira(env, g, semana, hoje, cartoesDaRoda);
    if (feira.cleared) return erro('raid closed', 409);
    const perfil = await getProfile(env, id);
    const dano = raidDamageFor(stagePower(perfil?.stage));
    await kvOrThrow(env).put(
      coopHitKey(g.id, semana, id),
      JSON.stringify({ week: semana, days: [...antes.days, hoje], dmg: antes.dmg + dano }),
      { expirationTtl: COOP_HIT_TTL },
    );
    // A-1: o direito ao resgate mora com a PESSOA, não com a guilda.
    await marcarParticipacao(env, g.id, id, semana, hoje);
    // A MISSÃO também rega a CASA (PR3): seiva que cresce com o level do Soulmon e com o tamanho da roda ativa.
    // Escreve só a chave pessoal da casa; o servidor decide o valor (o cliente nunca manda pontos).
    await somarPontos(env, g.id, id, 'missao', pontosDeMissao(stagePower(perfil?.stage), membrosAtivos(g, fiosDosCartoes(g, cartoesDaRoda), hoje).length));
    await cartao(g);
    // O EVENTO DA VOLTA (Feira: Chefe ou Desafio): calculado DEPOIS de tudo acima, para que a Missão, o fenômeno e a seiva
    // fiquem idênticos; campo ADITIVO (cliente antigo ignora), ausente com a Feira desligada, e falha aqui nunca derruba o golpe.
    let evento;
    if (feiraLigada(env)) {
      try { evento = await eventoDaFeira(env, g, id, hoje, await lerEstadoFeira(env, g, hoje, { cartoes: cartoesDaRoda })); } catch (err) { console.warn('feira: evento indisponível', String(err)); evento = undefined; }
    }
    return json({ landed: true, [chave]: await montar(g, id, hoje), ...(evento ? { evento } : {}) });
  }

  if (action === 'guildRewards' || action === 'guildClaim') {
    // RECOMPENSAS (WPG-5). O servidor registra o DIREITO e o RESGATE; o saldo
    // de Emblemas é do save (o cliente soma pelo mesmo caminho do Torneio,
    // `onEarnEmblems`). Só cosmético e Emblemas: nada de coração, Créditos,
    // energia, perfectDays, Glitchtama nem vantagem de evolução (LV-G6).
    const g = await grupoDe(env, id, semana);
    // Semanas que ainda podem ser resgatadas: a corrente (só se dissipada) e as
    // duas anteriores (o `coopHit` vive 21 d).
    const candidatas = [semana, semanaAnterior(hoje), semanaAnterior(diaDeNum(numDia(hoje) - 7))];
    // A-1 (L3-conformidade, LV-G5): o direito NÃO exige estar na guilda. Quem
    // golpeou e saiu ainda colhe: a participação está em `coopPart:<save>:<week>`
    // (gravada no golpe e, para golpes antigos, na saída) e o desfecho sai de
    // `coopRaidOk:<gid>:<week>` — que não depende do blob nem do `coopHit`.
    const direito = async (w) => {
      let part = await lerParticipacao(env, id, w);
      if (!part && g) {
        const meus = await lerGolpes(env, g.id, w, id);
        if (meus.days.length > 0) part = { gid: g.id, day: meus.days[0] };
      }
      if (!part) return null; // só quem deu ≥ 1 golpe
      const ref = w === semana ? hoje : ultimoDiaDaSemana(part.day);
      let cleared;
      const grupo = g && g.id === part.gid ? g : await lerGrupo(env, part.gid);
      if (grupo) cleared = (await resolverFeira(env, grupo, w, ref)).cleared;
      else cleared = !!(await lerRaidOk(env, part.gid, w)); // guilda que esvaziou
      if (w === semana && !cleared) return null; // aberta: ainda não há desfecho
      return { week: w, outcome: cleared ? 'dissipada' : 'recuou', emblems: cleared ? RAID_EMBLEMS : RAID_EMBLEMS_FLOOR };
    };
    const conchas = async () => (await lerConjunto(env, coopShellKey(id))).length;

    if (action === 'guildRewards') {
      const pending = [];
      for (const w of candidatas) {
        if (await kvOrThrow(env).get(coopClaimKey(id, w))) continue;
        const d = await direito(w);
        if (d) pending.push(d);
      }
      // Cenários de estágio: 7 dias DISTINTOS de fio (LV-G9) libera até o
      // estágio atual do Bosque. Gravados em `coopScenes:<save>` e FICAM com
      // quem sai (G12) — sem guilda, devolve o que já foi liberado.
      let scenes = await lerConjunto(env, coopScenesKey(id));
      if (g) {
        const atual = await atualizarBosque(env, g, hoje);
        const fio = await lerFio(env, g.id, id);
        if ((fio?.distinctDays ?? 0) >= STAGE_UNLOCK_DAYS) {
          const liberados = cenariosAte(bosqueStageFor(atual.bosqueProgress).stageIndex);
          if (liberados.some(s => !scenes.includes(s))) scenes = await unirConjunto(env, coopScenesKey(id), liberados);
        }
      }
      // O MISTÉRIO foi encerrado (27/10/2026): recompensa pendente vira Bits/Honra, uma vez, aqui (por demanda). Falha é silêncio.
      let misterio;
      if (g) { try { misterio = (await converterMisterio(env, g, id)) ?? undefined; } catch { misterio = undefined; } }
      return json({ rewards: { pending, scenes, trophyOwned: (await conchas()) >= RAID_TROPHY_EVERY, trophyId: RAID_TROPHY_ID, ...(misterio ? { misterio } : {}) } });
    }

    // guildClaim
    const w = String(body.week ?? '');
    if (!candidatas.includes(w)) return erro('invalid week', 400);
    // M3 (L2-backend): o KV é eventualmente consistente ENTRE regiões (até
    // 60 s). O selo abaixo resolve dois toques na mesma região; dois aparelhos
    // em POPs diferentes podem, cada um, reler o próprio selo e receber 200.
    // O que torna isso inofensivo é o RECIBO: determinístico por (save,
    // semana), igual nas duas respostas e no 409 — o cliente credita Emblemas
    // UMA vez por recibo, guardado no save. Fechar no servidor exigiria
    // Durable Object (fora desta fatia).
    const recibo = await reciboDoResgate(id, w);
    // A1 (L3-codigo): o 409 traz o resgate JÁ registrado, para o cliente que
    // perdeu a resposta do 200 creditar — uma vez por recibo (o cliente guarda
    // o recibo e ignora o que já conhece). A quantia vem do REGISTRO, nunca é
    // recalculada.
    const jaResgatado = async () => {
      const r = JSON.parse((await kvOrThrow(env).get(coopClaimKey(id, w))) ?? 'null');
      if (!r) return null;
      const outcome = r.kind === 'dissipada' ? 'dissipada' : 'recuou';
      const emblems = r.emblems === RAID_EMBLEMS || r.emblems === RAID_EMBLEMS_FLOOR ? r.emblems : (outcome === 'dissipada' ? RAID_EMBLEMS : RAID_EMBLEMS_FLOOR);
      const trophy = r.trophy === true;
      return { week: w, outcome, emblems, trophy, trophyId: trophy ? RAID_TROPHY_ID : null, receipt: recibo };
    };
    const conflito = async () => erro('already claimed', 409, { receipt: recibo, claimed: await jaResgatado() });
    if (await kvOrThrow(env).get(coopClaimKey(id, w))) return conflito();
    const d = await direito(w);
    if (!d) return erro('nothing to claim', 404);
    // Dois aparelhos ao mesmo tempo (o KV não tem CAS): cada um grava com um
    // selo aleatório e relê; só quem encontra o PRÓPRIO selo resgatou.
    const selo = newPid();
    await kvOrThrow(env).put(coopClaimKey(id, w), JSON.stringify({ at: Date.now(), kind: d.outcome, emblems: d.emblems, selo, receipt: recibo }), { expirationTtl: COOP_CLAIM_TTL });
    const gravado = JSON.parse((await kvOrThrow(env).get(coopClaimKey(id, w))) ?? '{}');
    if (gravado.selo !== selo) return conflito();
    let trophy = false;
    if (d.outcome === 'dissipada') {
      const antes = await conchas();
      const depois = (await unirConjunto(env, coopShellKey(id), [w])).length;
      trophy = depois > antes && depois % RAID_TROPHY_EVERY === 0;
    }
    // O troféu entra no registro para que um 409 posterior o devolva também.
    if (trophy) await kvOrThrow(env).put(coopClaimKey(id, w), JSON.stringify({ ...gravado, trophy }), { expirationTtl: COOP_CLAIM_TTL });
    return json({ claimed: { week: w, outcome: d.outcome, emblems: d.emblems, trophy, trophyId: trophy ? RAID_TROPHY_ID : null, receipt: recibo } });
  }

  if (action === 'guildLeave') {
    // Um toque, sem confirmação e sem penalidade. Anfitrião passa adiante
    // dentro de `coopLeave`.
    await coopLeave(env, id);
    return json({ ok: true });
  }

  if (action === 'guildRename' || action === 'guildNewCode') {
    const g = await grupoDe(env, id, semana);
    if (!g) return erro('no {g}', 404);
    if (anfitriaoDe(g) !== id) return erro('not host', 403);
    // Releitura antes de gravar: nunca regravar por cima de uma entrada.
    const fresco = (await lerGrupo(env, g.id)) ?? g;
    if (!fresco.hostSave) fresco.hostSave = anfitriaoDe(fresco);
    if (action === 'guildRename') {
      const nome = sanitizarNomeDeGuilda(body.name);
      if (!nome) return erro('invalid name', 400);
      fresco.name = nome;
      await gravarGrupo(env, fresco);
    } else {
      const novo = await sortearCodigoLivre(env);
      if (!novo) return erro('try again', 503);
      const velho = fresco.code;
      fresco.code = novo;
      await gravarGrupo(env, fresco, { codigoNovo: true });
      // O código velho deixa de abrir a guilda — é o "fechar a porta" no lugar
      // da expulsão (G7).
      if (velho && velho !== novo) await kvOrThrow(env).delete(coopCodeKey(velho));
    }
    return vista(await montar( rolarSemana(fresco, semana), id, hoje));
  }

  return json({ error: 'unknown action' }, 400);
}
