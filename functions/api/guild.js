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
//   POST guildClaim   {id, dayKey, week}   → { claimed: { week, outcome, emblems, trophy } }
//                                            404 nothing to claim · 409 already claimed · 400 invalid week
//   POST guildLeave   {id}                 → { ok: true } (sempre; idempotente)
//   POST guildRename  {id, name}           → { guild }   403 not host · 400 invalid name · 404 no guild
//   POST guildNewCode {id}                 → { guild }   403 not host · 503 try again · 404 no guild
// Não existe expulsão (G7): o código novo é a ferramenta de fechar a porta.
//
// `dayKey` é o DIA DO JOGADOR (`playerDayKey`), aceito a ±1 do dia UTC — o
// override de G6 registrado em `PLANO-GUILDA.md` §0.1.

import { authorizeSaveAccess, authStatus } from './_auth.js';
import { clientKey, takeToken, tooManyRequests } from './_rateLimit.js';
import { kv, kvOrThrow } from './_kv.js';
import { getProfile, newPid, stagePower } from './_profile.js';
import {
  COOP_MAX_MEMBERS, COOP_CHECKINS_POR_MEMBRO, PRESENCA_NOMINAL_MAX,
  coopKey, coopOfKey, coopCodeKey, semanaDoDia, diaDoJogador, sortearCodigoLivre,
  lerGrupo, gravarGrupo, renovarPrazos, lerCheckins, gravarCheckins, rolarSemana, grupoDe, coopLeave,
  sanitizarNomeDeGuilda,
  STAGE_UNLOCK_DAYS, GUILD_GESTURES, bosqueStageFor, tamanhoDaFloracao, lerFio, gravarFio, firmarFio,
  metaDoFioCumprida, atualizarBosque, lerGestos, coopGestKey, numDia, diaDeNum,
  resolverFeira, lerGolpes, coopHitKey, COOP_HIT_TTL, raidDamageFor, fenomenoDaSemana, semanaAnterior,
  ultimoDiaDaSemana, RAID_EMBLEMS, RAID_EMBLEMS_FLOOR, RAID_TROPHY_EVERY, RAID_TROPHY_ID,
  idOpacoDoMembro, coopClaimKey, COOP_CLAIM_TTL, coopShellKey, coopScenesKey, lerConjunto, unirConjunto, cenariosAte,
} from './_coop.js';

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
  guildLeave: 'POST',
  guildRename: 'POST',
  guildNewCode: 'POST',
});

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
 * `members[].id`/`apareceuHoje`/`progress`/`target` são o contrato do cliente
 * atual (`CoopPanel`); ficam enquanto os aliases existirem.
 */
export async function vistaDaGuilda(env, g, euSave, hoje = new Date().toISOString().slice(0, 10)) {
  const semana = semanaDoDia(hoje);
  const size = g.members.length;
  const nominal = size <= PRESENCA_NOMINAL_MAX;
  const dias = await Promise.all(g.members.map(async m => {
    const proprios = await lerCheckins(env, g.id, m, semana);
    return proprios.length > 0 ? proprios : (g.checkins?.[m] || []);
  }));
  // O fio de hoje também é presença (quem firmou, veio). Nunca sai contagem.
  const fios = await Promise.all(g.members.map(m => lerFio(env, g.id, m)));
  const firmou = fios.map(f => !!f?.days?.includes(hoje));
  const veio = dias.map((d, i) => d.includes(hoje) || firmou[i]);
  const membros = await Promise.all(g.members.map(async (m, i) => {
    const perfil = await getProfile(env, m);
    // A4 (L2-backend): NUNCA o pid público — com ele, `community?action=player`
    // devolvia estágio/rank/amigos de qualquer membro sem token. Sai um id
    // OPACO por guilda, que não abre nada fora dela.
    const memberId = await idOpacoDoMembro(env, g.id, m);
    return {
      id: memberId,
      memberId,
      name: perfil?.name ?? null,
      euMesmo: m === euSave,
      ...(nominal ? { apareceuHoje: veio[i] } : {}),
    };
  }));
  const target = size * COOP_CHECKINS_POR_MEMBRO;
  const feitos = dias.reduce((n, d) => n + d.length, 0);
  const eu = g.members.indexOf(euSave);
  // O Bosque: estágio DERIVADO na leitura; `perto` é binário. Nunca sai o
  // progresso cru, "faltam N", razão, nem nada por pessoa (§10.3, LV-G1).
  const { stage, stageIndex, perto } = bosqueStageFor(g.bosqueProgress);
  const bloom = tamanhoDaFloracao(Number(g.bosqueProgress ?? 0) - Number(g.tideBase ?? 0));
  // Gestos recebidos HOJE, em lote e anônimos: só os TIPOS, sem quem nem quantos.
  const gestos = await Promise.all(g.members.map(m => lerGestos(env, g.id, m, hoje)));
  const recebidos = new Set(gestos.flatMap((k, i) => (g.members[i] === euSave ? [] : k)));
  const meuFio = eu >= 0 ? fios[eu] : null;
  // A FEIRA (WPG-4): resolvida na leitura. Sai só o ESTADO (e `ferido`, um
  // booleano) — nunca HP, dano, quem golpeou nem quantos golpes (LV-G1).
  const feira = await resolverFeira(env, g, semana, hoje);
  const anterior = semanaAnterior(hoje);
  const passada = await resolverFeira(env, g, anterior, ultimoDiaDaSemana(diaDeNum(numDia(hoje) - 7)));
  const meusGolpes = eu >= 0 ? await lerGolpes(env, g.id, semana, euSave) : { days: [] };
  return {
    id: g.id,
    name: g.name,
    weekKey: semana,
    code: g.code,
    isHost: anfitriaoDe(g) === euSave,
    size,
    full: size >= COOP_MAX_MEMBERS,
    members: membros,
    presence: nominal ? membros.map(m => ({ memberId: m.memberId, cameToday: m.apareceuHoje })) : null,
    threadedToday: !nominal && veio.some(Boolean) ? true : null,
    mine: {
      cameToday: eu >= 0 ? veio[eu] : false,
      threadToday: eu >= 0 ? firmou[eu] : false,
      // Cenários de estágio só depois de 7 dias DISTINTOS de fio (LV-G9).
      groveScenes: (meuFio?.distinctDays ?? 0) >= STAGE_UNLOCK_DAYS,
      gesturesSent: eu >= 0 ? GUILD_GESTURES.filter(k => gestos[eu].includes(k)) : [],
    },
    bosque: {
      stage,
      stageIndex,
      perto,
      tide: { key: g.tideKey ?? null, size: bloom },
      ornaments: (Array.isArray(g.ornaments) ? g.ornaments : []).map(o => ({ tide: o.tide, size: o.size, day: o.day })),
    },
    gestures: GUILD_GESTURES.filter(k => recebidos.has(k)),
    raid: {
      weekKey: semana,
      phenomenon: fenomenoDaSemana(semana),
      // A semana corrente só pode estar 'aberta' ou 'dissipada': "recuou" é o
      // desfecho de uma semana que TERMINOU, e sai em `lastWeek`.
      state: feira.cleared ? 'dissipada' : 'aberta',
      ferido: !feira.cleared && feira.dmg * 2 >= feira.hp,
      lastWeek: passada.cleared ? 'dissipada' : (passada.hitters.length > 0 ? 'recuou' : null),
      mine: { hitToday: meusGolpes.days.includes(hoje) },
    },
    // M1 (L2-backend, LV-G2): com 5+ membros o número semanal lido de manhã e
    // à noite dá, pela diferença, "quantos vieram hoje" — exatamente o que
    // `threadedToday: true|null` existe para esconder. Acima da presença
    // nominal, `progress` sai `null` (o cliente novo já o descarta em
    // `sanitizeGuildView`); até 4 a presença já é nominal e o número não
    // revela nada que a lista não diga.
    progress: nominal ? Math.min(feitos, target) : null,
    target,
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
  const body = method === 'POST' ? await request.json().catch(() => ({})) : {};
  const id = body.id || url.searchParams.get('id');

  // O envelope e as palavras dos erros seguem quem chamou: o cliente antigo lê
  // `group` e 'no group'; o novo, `guild` e 'no guild'.
  const chave = alias ? 'group' : 'guild';
  const erro = (texto, status, extra = {}) => json({ error: texto.replace('{g}', chave), ...extra }, status);
  const vista = (v) => json({ [chave]: v });
  // Toda resposta com vista fecha antes os dias pendentes do Bosque (§10.5).
  const montar = async (g, eu, dia) => vistaDaGuilda(env, await atualizarBosque(env, g, dia), eu, dia);

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
    await gravarGrupo(env, g);
    // DOIS TOQUES EM "CRIAR" (L1-codigo ALTO-2): as duas requisições passam pelo
    // `grupoDe == null` (o KV não tem CAS). A releitura do PONTEIRO decide quem
    // ficou; quem perdeu desfaz o próprio grupo e responde 409 com a vista do
    // que venceu — idempotente para o cliente, sem órfão de 120 d.
    const vencedor = await kvOrThrow(env).get(coopOfKey(id));
    if (vencedor !== g.id) {
      await kvOrThrow(env).delete(coopKey(g.id));
      await kvOrThrow(env).delete(coopCodeKey(g.code));
      const outro = await grupoDe(env, id, semana);
      return erro('already in a {g}', 409, { [chave]: outro ? await montar(outro, id, hoje) : null });
    }
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
      return erro('invalid code', 404);
    }
    // M2 (L2-backend): RELÊ imediatamente antes de gravar. A cópia lida pelo
    // código podia ser velha — gravá-la ressuscitava quem acabou de sair (ou
    // foi excluído) e recuava o Bosque por um instante.
    const g = (await lerGrupo(env, lido.id)) ?? lido;
    rolarSemana(g, semana);
    if (g.members.includes(id)) return vista(await montar( g, id, hoje));
    if (g.members.length >= COOP_MAX_MEMBERS) return erro('{g} full', 409);
    g.members.push(id);
    g.desde = { ...(g.desde || {}), [id]: hoje };
    await gravarGrupo(env, g);
    // Duas pessoas na última vaga ao mesmo tempo: relê e tenta UMA vez mais;
    // perdendo as duas, erro honesto em vez de "você entrou" falso.
    let confirmado = await lerGrupo(env, g.id);
    if (confirmado && !confirmado.members.includes(id)) {
      if (confirmado.members.length >= COOP_MAX_MEMBERS) {
        await kvOrThrow(env).delete(coopOfKey(id));
        return erro('{g} full', 409);
      }
      confirmado.members.push(id);
      confirmado.desde = { ...(confirmado.desde || {}), [id]: hoje };
      await gravarGrupo(env, confirmado);
      confirmado = await lerGrupo(env, g.id);
    }
    if (!confirmado || !confirmado.members.includes(id)) {
      await kvOrThrow(env).delete(coopOfKey(id));
      return erro('join collision', 409);
    }
    return vista(await montar( rolarSemana(confirmado, semana), id, hoje));
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
      // Único evento diário: renova o prazo das três chaves (com releitura).
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
    const depois = firmarFio(antes, hoje);
    if (!antes || !antes.days.includes(hoje)) await gravarFio(env, g, id, depois);
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
    return vista(await montar(g, id, hoje));
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
    const feira = await resolverFeira(env, g, semana, hoje);
    if (feira.cleared) return erro('raid closed', 409);
    const perfil = await getProfile(env, id);
    const dano = raidDamageFor(stagePower(perfil?.stage));
    await kvOrThrow(env).put(
      coopHitKey(g.id, semana, id),
      JSON.stringify({ week: semana, days: [...antes.days, hoje], dmg: antes.dmg + dano }),
      { expirationTtl: COOP_HIT_TTL },
    );
    return json({ landed: true, [chave]: await montar(g, id, hoje) });
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
    const direito = async (w) => {
      if (!g) return null;
      const meus = await lerGolpes(env, g.id, w, id);
      if (meus.days.length === 0) return null; // só quem deu ≥ 1 golpe
      const ref = w === semana ? hoje : ultimoDiaDaSemana(meus.days[0]);
      const f = await resolverFeira(env, g, w, ref);
      if (w === semana && !f.cleared) return null; // aberta: ainda não há desfecho
      return { week: w, outcome: f.cleared ? 'dissipada' : 'recuou', emblems: f.cleared ? RAID_EMBLEMS : RAID_EMBLEMS_FLOOR };
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
      return json({ rewards: { pending, scenes, trophyOwned: (await conchas()) >= RAID_TROPHY_EVERY, trophyId: RAID_TROPHY_ID } });
    }

    // guildClaim
    const w = String(body.week ?? '');
    if (!candidatas.includes(w)) return erro('invalid week', 400);
    if (await kvOrThrow(env).get(coopClaimKey(id, w))) return erro('already claimed', 409);
    const d = await direito(w);
    if (!d) return erro('nothing to claim', 404);
    // Dois aparelhos ao mesmo tempo (o KV não tem CAS): cada um grava com um
    // selo aleatório e relê; só quem encontra o PRÓPRIO selo resgatou.
    const selo = newPid();
    await kvOrThrow(env).put(coopClaimKey(id, w), JSON.stringify({ at: Date.now(), kind: d.outcome, emblems: d.emblems, selo }), { expirationTtl: COOP_CLAIM_TTL });
    const gravado = JSON.parse((await kvOrThrow(env).get(coopClaimKey(id, w))) ?? '{}');
    if (gravado.selo !== selo) return erro('already claimed', 409);
    let trophy = false;
    if (d.outcome === 'dissipada') {
      const antes = await conchas();
      const depois = (await unirConjunto(env, coopShellKey(id), [w])).length;
      trophy = depois > antes && depois % RAID_TROPHY_EVERY === 0;
    }
    return json({ claimed: { week: w, outcome: d.outcome, emblems: d.emblems, trophy, trophyId: trophy ? RAID_TROPHY_ID : null } });
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
      await gravarGrupo(env, fresco);
      // O código velho deixa de abrir a guilda — é o "fechar a porta" no lugar
      // da expulsão (G7).
      if (velho && velho !== novo) await kvOrThrow(env).delete(coopCodeKey(velho));
    }
    return vista(await montar( rolarSemana(fresco, semana), id, hoje));
  }

  return json({ error: 'unknown action' }, 400);
}
