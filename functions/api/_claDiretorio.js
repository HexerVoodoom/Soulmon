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
//   coopDirFull:<dirId>          o MESMO formato, para o clã CHEIO (§322, 13/11/2026): a lista mostra o clã com o selo
//                                "Cheia" e sem botão de pedir. Prefixo PRÓPRIO de propósito: o `list` do KV devolve em
//                                ordem de chave (hash opaco), então num prefixo único um lote de clãs cheios empurraria
//                                clãs com vaga para fora da janela do `list`. Com dois prefixos, a lista de quem tem
//                                vaga nunca disputa lugar com a dos cheios. Ao encher/abrir vaga a entrada MUDA de prefixo.
//                                Por clã (e não um índice único): nada de ler-modificar-gravar
//                                compartilhado entre clãs — o KV não tem CAS.
//   coopReq:<saveId>             o pedido PENDENTE de quem pede: { gid, dirId, at }. UM por pessoa, 7 d.
//   coopReqIn:<gid>:<requestId>  o mesmo pedido, visto pelo clã: { save, name, at }. 7 d.
//                                `requestId` = `idOpacoDoMembro(gid, save)` (A4: id opaco por clã).
// Listagem por prefixo (`list`) só em duas leituras raras e limitadas: o diretório (quem não
// tem clã abre "Procurar clã"; dois `list`, um por prefixo) e a fila do anfitrião. O `list` do KV é eventualmente consistente
// (~60 s): um clã que acabou de encher pode aparecer — a vaga é CONFERIDA de novo no pedido e
// na aprovação, que leem o blob do clã.

import { kvOrThrow } from './_kv.js';

export const DIR_PREFIX = 'coopDir:';
export const coopDirKey = dirId => `${DIR_PREFIX}${dirId}`;
/** Clãs cheios (§322): prefixo próprio — não começa com `coopDir:`, então nunca entra no `list` de quem tem vaga. */
export const DIR_FULL_PREFIX = 'coopDirFull:';
export const coopDirFullKey = dirId => `${DIR_FULL_PREFIX}${dirId}`;
export const coopReqKey = save => `coopReq:${save}`;
export const coopReqInPrefix = gid => `coopReqIn:${gid}:`;
export const coopReqInKey = (gid, rid) => `${coopReqInPrefix(gid)}${rid}`;
/** Pedido vale 7 dias e some sozinho. */
export const PEDIDO_TTL = 86400 * 7;
/** Quantos clãs COM VAGA o diretório mostra (o `list` lê no máximo isso + folga). */
export const DIRETORIO_MAX = 30;
/** Quantos clãs CHEIOS aparecem depois deles (§322): seção própria, nunca toma lugar dos que têm vaga. */
export const DIRETORIO_CHEIOS_MAX = 12;
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
/**
 * `g.dirClosed === true`: o anfitrião desligou "Aceitar pedidos" — o clã sai da lista e fica fora (cheio ou não).
 * Com vaga: `nome|tamanho`. Cheio (§322): `nome|tamanho|cheia` (fica na lista, marcado). Sem membro: `'x'`.
 */
export function assinaturaDoDiretorio(g, max) {
  const size = Array.isArray(g?.members) ? g.members.length : 0;
  if (!(size > 0) || g.dirClosed === true) return 'x';
  return size < max ? `${g.name}|${size}` : `${g.name}|${size}|cheia`;
}

/** O tipo de entrada que uma assinatura descreve: `'aberta'`, `'cheia'` ou `null` (fora da lista / desconhecida). */
export function tipoDaAssinatura(sig) {
  if (typeof sig !== 'string' || sig === 'x' || !sig) return null;
  return sig.endsWith('|cheia') ? 'cheia' : 'aberta';
}

/**
 * Grava a entrada no prefixo certo e apaga a do outro prefixo. `antes` = a assinatura anterior (de `g.dirSig`):
 * quando ela é conhecida, só apaga a chave que de fato existia (no dia a dia, 1 escrita); sem ela (`undefined`),
 * apaga as duas por segurança.
 * @param {*} env @param {*} g @param {number} max
 * @param {{ prazo?: {}, antes?: string | null }} [opts]
 */
export async function sincronizarDiretorio(env, g, max, { prazo = {}, antes } = {}) {
  const size = Array.isArray(g?.members) ? g.members.length : 0;
  const dirId = await idDoDiretorio(env, g.id);
  const tipo = tipoDaAssinatura(assinaturaDoDiretorio(g, max));
  const tipoAntes = antes === undefined ? '?' : tipoDaAssinatura(antes);
  const kv = kvOrThrow(env);
  const apagar = t => tipoAntes === '?' || tipoAntes === t;
  if (tipo) {
    const valor = JSON.stringify({ gid: g.id, n: g.name, s: size });
    await kv.put(tipo === 'cheia' ? coopDirFullKey(dirId) : coopDirKey(dirId), valor, { ...prazo, metadata: { n: g.name, s: size } });
  }
  if (tipo !== 'aberta' && apagar('aberta')) await kv.delete(coopDirKey(dirId));
  if (tipo !== 'cheia' && apagar('cheia')) await kv.delete(coopDirFullKey(dirId));
}

export async function tirarDoDiretorio(env, gid) {
  const dirId = await idDoDiretorio(env, gid);
  await kvOrThrow(env).delete(coopDirKey(dirId));
  await kvOrThrow(env).delete(coopDirFullKey(dirId));
}

/**
 * A entrada do diretório (`{ gid, n, s }`, com `full: true` quando veio do prefixo dos cheios) ou `null`.
 * Lê primeiro a de quem tem vaga; só quando ela não existe lê a dos cheios (+1 leitura, caminho raro).
 */
export async function lerEntrada(env, dirId) {
  if (!idOpacoValido(dirId)) return null;
  const parse = raw => { try { const e = JSON.parse(raw); return e && typeof e.gid === 'string' ? e : null; } catch { return null; } };
  const aberta = await kvOrThrow(env).get(coopDirKey(dirId));
  if (aberta) return parse(aberta);
  const cheia = await kvOrThrow(env).get(coopDirFullKey(dirId));
  const e = cheia ? parse(cheia) : null;
  return e ? { ...e, full: true } : null;
}

/** Apaga a entrada de `dirId` dos dois prefixos (clã que sumiu). Idempotente. */
export async function apagarEntrada(env, dirId) {
  if (!idOpacoValido(dirId)) return;
  await kvOrThrow(env).delete(coopDirKey(dirId));
  await kvOrThrow(env).delete(coopDirFullKey(dirId));
}

async function listarPrefixo(env, prefixo, teto, aceita) {
  const r = await kvOrThrow(env).list({ prefix: prefixo, limit: teto * 2 });
  const out = [];
  for (const k of r?.keys ?? []) {
    const dirId = String(k.name).slice(prefixo.length);
    if (!idOpacoValido(dirId)) continue;
    let meta = k.metadata;
    if (!meta || typeof meta !== 'object') {
      // Sem metadata (KV local/de teste): cai para o valor — custa uma leitura.
      const raw = await kvOrThrow(env).get(`${prefixo}${dirId}`);
      try { meta = raw ? JSON.parse(raw) : null; } catch { meta = null; }
      if (!meta || typeof meta !== 'object') continue;
    }
    const size = Math.floor(Number(meta.s));
    const name = typeof meta.n === 'string' ? meta.n : '';
    if (!name || !(size > 0) || !aceita(size)) continue;
    out.push({ dirId, name, size });
  }
  return out;
}

/**
 * O diretório (§203 + §322): `[{ dirId, name, size, max, full? }]`, JÁ ORDENADO e com teto.
 *   1. clãs com vaga (até `DIRETORIO_MAX`), os mais cheios primeiro e depois por nome;
 *   2. DEPOIS deles, os cheios (até `DIRETORIO_CHEIOS_MAX`), por nome, com `full: true`.
 * Dois `list` (um por prefixo): os cheios nunca empurram os com vaga para fora da janela nem do teto.
 * Os campos são os mesmos públicos de antes (+ `full`): nada de gid, código nem saveId.
 */
export async function listarDiretorio(env, max) {
  const porNome = (a, b) => a.name.localeCompare(b.name);
  const [abertas, cheias] = await Promise.all([
    listarPrefixo(env, DIR_PREFIX, DIRETORIO_MAX, s => s < max),
    listarPrefixo(env, DIR_FULL_PREFIX, DIRETORIO_CHEIOS_MAX, s => s >= max),
  ]);
  return [
    ...abertas.sort((a, b) => b.size - a.size || porNome(a, b)).slice(0, DIRETORIO_MAX).map(c => ({ ...c, max })),
    ...cheias.sort(porNome).slice(0, DIRETORIO_CHEIOS_MAX).map(c => ({ ...c, size: max, max, full: true })),
  ];
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
