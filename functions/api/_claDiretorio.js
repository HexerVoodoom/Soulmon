// O DIRETÓRIO DE CLÃS E OS PEDIDOS DE ENTRADA (REGISTRO §203, pedido do dono de 30/10/2026).
//
// Quem NÃO tem clã vê os clãs com vaga e pede para entrar; o ANFITRIÃO (`hostSave`) aprova
// ou recusa. Entrar por código continua valendo do mesmo jeito. O pedido aprovado põe a pessoa
// no clã sem código — a aprovação do anfitrião é o consentimento que a regra antiga (só código,
// REGISTRO linha "Entrada só por código") protegia.
//
// CHAVES (KV, todas com prazo; nenhum saveId cru sai para o cliente):
//   coopDir:<dirId>              valor = { gid, n, s }; metadata = { n: nome, s: tamanho }. UMA por clã com vaga.
//                                Some quando o clã enche ou some. `dirId` é OPACO (hash de gid).
//                                Por clã (e não um índice único): nada de ler-modificar-gravar
//                                compartilhado entre clãs — o KV não tem CAS.
//   coopReq:<saveId>             o pedido PENDENTE de quem pede: { gid, dirId, at }. UM por pessoa, 7 d.
//   coopReqIn:<gid>:<requestId>  o mesmo pedido, visto pelo clã: { save, name, at }. 7 d.
//                                `requestId` = `idOpacoDoMembro(gid, save)` (A4: id opaco por clã).
// Listagem por prefixo (`list`) só em duas leituras raras e limitadas: o diretório (quem não
// tem clã abre "Procurar clã") e a fila do anfitrião. O `list` do KV é eventualmente consistente
// (~60 s): um clã que acabou de encher pode aparecer — a vaga é CONFERIDA de novo no pedido e
// na aprovação, que leem o blob do clã.

import { kvOrThrow } from './_kv.js';

export const DIR_PREFIX = 'coopDir:';
export const coopDirKey = dirId => `${DIR_PREFIX}${dirId}`;
export const coopReqKey = save => `coopReq:${save}`;
export const coopReqInPrefix = gid => `coopReqIn:${gid}:`;
export const coopReqInKey = (gid, rid) => `${coopReqInPrefix(gid)}${rid}`;
/** Pedido vale 7 dias e some sozinho. */
export const PEDIDO_TTL = 86400 * 7;
/** Quantos clãs o diretório mostra (o `list` lê no máximo isso + folga). */
export const DIRETORIO_MAX = 30;
/** Fila do anfitrião: até quantos pedidos aparecem de uma vez. */
export const PEDIDOS_MAX = 30;
const VALID_OPACO = /^[0-9a-f]{16}$/;
export const idOpacoValido = s => typeof s === 'string' && VALID_OPACO.test(s);

/** Id público do clã no diretório: opaco, estável, não reabre `coop:<gid>` por fora. */
export async function idDoDiretorio(env, gid) {
  const segredo = typeof env?.GUILD_MEMBER_SECRET === 'string' ? env.GUILD_MEMBER_SECRET : '';
  const bytes = new TextEncoder().encode(`soulmon-guild-dir|${segredo}|${gid}`);
  const h = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  return Array.from(h.slice(0, 8), b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Mantém a entrada do diretório coerente com o blob. Chamado por `gravarGrupo` (todo caminho
 * que muda nome/tamanho grava o blob por ele) e pela saída que apaga o clã vazio.
 * Só escreve quando a assinatura (nome|tamanho) mudou ou o prazo renovou: no dia a dia, zero escrita.
 * O chamador guarda a assinatura em `g.dirSig` (no blob) e escreve a entrada DEPOIS do blob e
 * dos índices — a ordem das gravações do clã não muda (ALTO-2 depende dela).
 */
export function assinaturaDoDiretorio(g, max) {
  const size = Array.isArray(g?.members) ? g.members.length : 0;
  return size > 0 && size < max ? `${g.name}|${size}` : 'x';
}

export async function sincronizarDiretorio(env, g, max, { prazo = {} } = {}) {
  const size = Array.isArray(g?.members) ? g.members.length : 0;
  const dirId = await idDoDiretorio(env, g.id);
  if (assinaturaDoDiretorio(g, max) !== 'x') await kvOrThrow(env).put(coopDirKey(dirId), JSON.stringify({ gid: g.id, n: g.name, s: size }), { ...prazo, metadata: { n: g.name, s: size } });
  else await kvOrThrow(env).delete(coopDirKey(dirId));
}

export async function tirarDoDiretorio(env, gid) {
  await kvOrThrow(env).delete(coopDirKey(await idDoDiretorio(env, gid)));
}

/** A entrada do diretório (`{ gid, n, s }`) ou `null`. */
export async function lerEntrada(env, dirId) {
  if (!idOpacoValido(dirId)) return null;
  const raw = await kvOrThrow(env).get(coopDirKey(dirId));
  if (!raw) return null;
  try { const e = JSON.parse(raw); return e && typeof e.gid === 'string' ? e : null; } catch { return null; }
}

/** Os clãs com vaga: `[{ dirId, name, size, max }]` (a ordem é de quem chama). */
export async function listarDiretorio(env, max) {
  const r = await kvOrThrow(env).list({ prefix: DIR_PREFIX, limit: DIRETORIO_MAX * 2 });
  const out = [];
  for (const k of r?.keys ?? []) {
    const dirId = String(k.name).slice(DIR_PREFIX.length);
    if (!idOpacoValido(dirId)) continue;
    let meta = k.metadata;
    if (!meta || typeof meta !== 'object') {
      // Sem metadata (KV local/de teste): cai para o valor — custa uma leitura.
      meta = await lerEntrada(env, dirId);
      if (!meta) continue;
    }
    const size = Math.floor(Number(meta.s));
    const name = typeof meta.n === 'string' ? meta.n : '';
    if (!name || !(size > 0) || size >= max) continue;
    out.push({ dirId, name, size, max });
  }
  return out;
}

export async function lerPedido(env, save) {
  const raw = await kvOrThrow(env).get(coopReqKey(save));
  if (!raw) return null;
  try { const p = JSON.parse(raw); return p && typeof p.gid === 'string' && idOpacoValido(p.dirId) ? p : null; } catch { return null; }
}

export async function lerPedidoNoCla(env, gid, rid) {
  if (!idOpacoValido(rid)) return null;
  const raw = await kvOrThrow(env).get(coopReqInKey(gid, rid));
  if (!raw) return null;
  try { const p = JSON.parse(raw); return p && typeof p.save === 'string' ? p : null; } catch { return null; }
}

export async function gravarPedido(env, save, gid, dirId, rid, name, agora = Date.now()) {
  await kvOrThrow(env).put(coopReqKey(save), JSON.stringify({ gid, dirId, rid, at: agora }), { expirationTtl: PEDIDO_TTL });
  await kvOrThrow(env).put(coopReqInKey(gid, rid), JSON.stringify({ save, name: name ?? null, at: agora }), { expirationTtl: PEDIDO_TTL, metadata: { at: agora } });
}

/** Apaga o pedido pendente de `save` (os dois lados). Idempotente. */
export async function apagarPedido(env, save) {
  const p = await lerPedido(env, save);
  await kvOrThrow(env).delete(coopReqKey(save));
  if (p?.rid) await kvOrThrow(env).delete(coopReqInKey(p.gid, p.rid));
  return p;
}

/** Os pedidos pendentes de um clã (para o anfitrião): `[{ requestId, name, at }]`, sem saveId. */
export async function listarPedidos(env, gid) {
  const r = await kvOrThrow(env).list({ prefix: coopReqInPrefix(gid), limit: PEDIDOS_MAX * 2 });
  const out = [];
  for (const k of r?.keys ?? []) {
    const rid = String(k.name).slice(coopReqInPrefix(gid).length);
    const p = await lerPedidoNoCla(env, gid, rid);
    if (!p) continue;
    // O lado do requerente é a verdade: cancelou/trocou → o registro do clã é resto e some aqui.
    const meu = await lerPedido(env, p.save);
    if (!meu || meu.gid !== gid) { await kvOrThrow(env).delete(k.name); continue; }
    out.push({ requestId: rid, name: typeof p.name === 'string' ? p.name : null, at: Number(p.at) || 0 });
    if (out.length >= PEDIDOS_MAX) break;
  }
  return out.sort((a, b) => a.at - b.at);
}
