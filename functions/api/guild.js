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
import { ensurePid, pidSoLeitura, getProfile, newPid } from './_profile.js';
import {
  COOP_MAX_MEMBERS, COOP_CHECKINS_POR_MEMBRO, PRESENCA_NOMINAL_MAX,
  coopKey, coopOfKey, coopCodeKey, semanaDoDia, diaDoJogador, sortearCodigoLivre,
  lerGrupo, gravarGrupo, renovarPrazos, lerCheckins, gravarCheckins, rolarSemana, grupoDe, coopLeave,
  sanitizarNomeDeGuilda,
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
  const veio = dias.map(d => d.includes(hoje));
  const membros = await Promise.all(g.members.map(async (m, i) => {
    const perfil = await getProfile(env, m);
    // Só o PRÓPRIO chamador pode ter o perfil migrado (ensurePid grava); o dos
    // outros é lido sem escrita (L1-codigo ALTO-3).
    const pid = perfil ? (m === euSave ? await ensurePid(env, perfil) : await pidSoLeitura(perfil)) : null;
    return {
      id: pid,
      pid,
      name: perfil?.name ?? null,
      euMesmo: m === euSave,
      ...(nominal ? { apareceuHoje: veio[i] } : {}),
    };
  }));
  const target = size * COOP_CHECKINS_POR_MEMBRO;
  const feitos = dias.reduce((n, d) => n + d.length, 0);
  const eu = g.members.indexOf(euSave);
  return {
    id: g.id,
    name: g.name,
    weekKey: semana,
    code: g.code,
    isHost: anfitriaoDe(g) === euSave,
    size,
    full: size >= COOP_MAX_MEMBERS,
    members: membros,
    presence: nominal ? membros.map(m => ({ pid: m.pid, cameToday: m.apareceuHoje })) : null,
    threadedToday: !nominal && veio.some(Boolean) ? true : null,
    mine: { cameToday: eu >= 0 ? veio[eu] : false },
    progress: Math.min(feitos, target),
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
    return vista(g ? await vistaDaGuilda(env, g, id, hoje) : null);
  }

  if (action === 'guildCreate') {
    // Um coletivo por pessoa (D-G1).
    const ja = await grupoDe(env, id, semana);
    if (ja) return erro('already in a {g}', 409, { [chave]: await vistaDaGuilda(env, ja, id, hoje) });
    const nome = sanitizarNomeDeGuilda(body.name);
    if (!nome) return erro('invalid name', 400);
    const codigo = await sortearCodigoLivre(env);
    if (!codigo) return erro('try again', 503);
    const g = {
      id: newPid(), name: nome, code: codigo, createdAt: Date.now(),
      members: [id], hostSave: id, weekKey: semana, checkins: {},
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
      return erro('already in a {g}', 409, { [chave]: outro ? await vistaDaGuilda(env, outro, id, hoje) : null });
    }
    return vista(await vistaDaGuilda(env, g, id, hoje));
  }

  if (action === 'guildJoin') {
    if (await grupoDe(env, id, semana)) return erro('already in a {g}', 409);
    // Entra-se SÓ por código: `body.groupId` (ou qualquer outro campo) é
    // ignorado. Guilda achável é raide de estranho, e o diretório respeita
    // consentimento (N-4).
    const code = String(body.code ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const groupId = code ? await kvOrThrow(env).get(coopCodeKey(code)) : null;
    const g = groupId ? await lerGrupo(env, groupId) : null;
    if (!g) return erro('invalid code', 404);
    rolarSemana(g, semana);
    if (g.members.includes(id)) return vista(await vistaDaGuilda(env, g, id, hoje));
    if (g.members.length >= COOP_MAX_MEMBERS) return erro('{g} full', 409);
    g.members.push(id);
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
      await gravarGrupo(env, confirmado);
      confirmado = await lerGrupo(env, g.id);
    }
    if (!confirmado || !confirmado.members.includes(id)) {
      await kvOrThrow(env).delete(coopOfKey(id));
      return erro('join collision', 409);
    }
    return vista(await vistaDaGuilda(env, rolarSemana(confirmado, semana), id, hoje));
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
    return vista(await vistaDaGuilda(env, g, id, hoje));
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
    return vista(await vistaDaGuilda(env, rolarSemana(fresco, semana), id, hoje));
  }

  return json({ error: 'unknown action' }, 400);
}
