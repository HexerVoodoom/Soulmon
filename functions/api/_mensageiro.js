// O MENSAGEIRO (NPC 440, Papus; 05/11/2026, §241): fila por jogador de cartas com prêmio, em `mail:<saveId>`.
// Dono único da fila, do prêmio da temporada e da idempotência:
//  · cada carta tem `mid` estável; o mesmo `mid` nunca entra duas vezes, nem depois de confirmado (`done`);
//  · a carta da temporada nasce AQUI, na primeira leitura depois da virada do mês, sem depender de cron;
//  · o cliente só confirma (`ack`) um `mid` que já voltou gravado no save dele (`mailClaimed`), então crédito e fila não divergem;
//  · simulado nunca recebe nada.
// Caixa de cartas (§246): a carta fica na caixa depois de lida/resgatada. O RESGATE é decidido AQUI (`claimMail`): o prêmio sai do registro do
// servidor, não do corpo do pedido, e a transição `não resgatada → resgatada` acontece uma única vez; o cliente ainda deduplica por `mailClaimed`.
// Carta SEM prêmio pendente some sozinha 3 dias depois (`MAIL_TTL_MS`); com prêmio pendente nunca expira nem é apagada sem `force`.
import { isSimuladoId } from './_simulados.js';
import { adminSaveIds } from './_rankAdmin.js';
import { lerIndice, ordenar } from './_rankIndex.js';
import { getProfile } from './_profile.js';
import { cartasGlobaisAtivas } from './_cartasGlobais.js';
import { ehViolacaoDeChave } from './_entitlements.js';

const QUEUE_MAX = 30;
export const MAIL_TTL_MS = 3 * 86400_000;
const DONE_MAX = 100;
const TTL_S = 86400 * 400;
export const MAIL_BITS_MAX = 5000;
export const MAIL_EMBLEMS_MAX = 500;

const texto = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const inteiro = (v, max) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(max, Math.floor(v))) : 0);

/** Lixo → `null`. */
export function sanitizeMail(m) {
  if (!m || typeof m !== 'object') return null;
  const mid = texto(m.mid, 80);
  const bodyPt = texto(m.bodyPt, 400);
  const bodyEn = texto(m.bodyEn, 400);
  if (!mid || !bodyPt || !bodyEn) return null;
  return {
    mid, bodyPt, bodyEn,
    titlePt: texto(m.titlePt, 60) || tituloDe(bodyPt), titleEn: texto(m.titleEn, 60) || tituloDe(bodyEn),
    bits: inteiro(m.bits, MAIL_BITS_MAX), emblems: inteiro(m.emblems, MAIL_EMBLEMS_MAX),
    at: inteiro(m.at, Number.MAX_SAFE_INTEGER),
    read: m.read === true || inteiro(m.claimedAt, Number.MAX_SAFE_INTEGER) > 0,
    claimedAt: inteiro(m.claimedAt, Number.MAX_SAFE_INTEGER),
    // Cartas especiais (§288): o tipo decide os botões e o corpo na caixa. Só valores conhecidos; o resto é carta comum.
    ...(KINDS.has(m.kind) ? { kind: m.kind } : {}),
    ...(m.kind === 'friend-invite' && PID_RE.test(m.fromPid || '') ? { fromPid: m.fromPid } : {}),
    // Convite de clã (§358): só o código, que o corpo da carta já mostra; o botão "Entrar no clã" usa o mesmo `guildJoin` do Salão.
    ...(m.kind === 'guild-invite' && CODE_RE.test(m.guildCode || '') ? { guildCode: m.guildCode } : {}),
    ...(m.kind === 'global' && TUTORIAIS.has(m.tutorial) ? { tutorial: m.tutorial } : {}),
    // NPC remetente (imagem grande na carta). Só o servidor define; jogador remetente = sem NPC.
    ...(m.kind === 'global' && NPCS.has(m.npc) ? { npc: m.npc } : {}),
  };
}
const KINDS = new Set(['gift', 'friend-invite', 'guild-invite', 'global']);
const CODE_RE = /^[A-Z0-9]{4,12}$/;
const TUTORIAIS = new Set(['widget']);
const NPCS = new Set(['mensageiro', 'hexsmith']);
const PID_RE = /^[a-zA-Z0-9_-]{8,64}$/;

/** Carta antiga (sem título): a primeira frase, cortada. */
const tituloDe = (corpo) => { const f = corpo.split(/(?<=[.!?])\s/)[0] || corpo; return f.length > 60 ? `${f.slice(0, 57)}...` : f; };

/** Tem prêmio e ainda não foi resgatado. */
export const pendingReward = (m) => (m.bits > 0 || m.emblems > 0) && !m.claimedAt;

/** Sem prêmio pendente e velha demais (contada do envio, ou do resgate se foi depois). */
const expirada = (m, now) => !pendingReward(m) && m.at > 0 && now - Math.max(m.at, m.claimedAt) > MAIL_TTL_MS;

/** Corta a fila no teto sem nunca perder carta com prêmio pendente: sai primeiro a mais antiga SEM prêmio. */
function cortar(q) {
  const out = [...q];
  while (out.length > QUEUE_MAX) {
    const i = out.findIndex(m => !pendingReward(m));
    out.splice(i >= 0 ? i : 0, 1);
  }
  return out;
}

/**
 * Lê a caixa. Falha do `get` PROPAGA (Antislop P6, §378): todo escritor grava o que leu, então "o KV falhou" tratado como
 * "caixa vazia" apagava as cartas com prêmio pendente e o `done` (a carta da temporada renascia). Só o JSON ilegível é tolerado.
 */
async function ler(kv, id) {
  const raw = await kv.get(`mail:${id}`);
  let r = null;
  try { r = JSON.parse(raw || 'null'); } catch (err) {
    console.warn('[mensageiro] mail ilegível no KV; a caixa recomeça vazia', { saveId: id, error: err?.name ?? String(err) });
    r = null;
  }
  return {
    q: Array.isArray(r?.q) ? r.q.map(sanitizeMail).filter(Boolean) : [],
    done: Array.isArray(r?.done) ? r.done.filter(x => typeof x === 'string') : [],
    season: typeof r?.season === 'string' ? r.season : '',
  };
}
/**
 * A carta é MELHOR ESFORÇO onde a ação principal já está gravada (convite de amizade, presente, entrada no clã): a falha dela
 * não derruba a ação, mas também não some calada. `.catch(falhaDaCarta('onde', saveId))`; a caixa existente nunca é
 * sobrescrita, porque `ler()` propaga a falha antes de qualquer gravação.
 */
export const falhaDaCarta = (onde, saveId) => (err) => {
  console.warn(`[mensageiro] carta não processada (${onde}); a ação principal segue valendo`, { saveId, error: err?.message ?? String(err) });
};
const gravar = (kv, id, rec) => kv.put(`mail:${id}`, JSON.stringify(rec), { expirationTtl: TTL_S });

/** Enfileira uma carta. Mesmo `mid` (na fila ou já confirmado) e simulado são no-op.
 *  `recusarSeCheia`: não entra se a fila já está no teto só com prêmio pendente (o corte apagaria um prêmio; quem chama usa o caminho antigo). */
export async function enqueueMail(env, kv, id, raw, { recusarSeCheia = false } = {}) {
  const msg = sanitizeMail(raw);
  if (!msg || isSimuladoId(id)) return false;
  msg.read = false; msg.claimedAt = 0;
  if (!msg.at) msg.at = Date.now();
  const p = await getProfile(env, id);
  if (p?.simulated === true) return false;
  const rec = await ler(kv, id);
  if (rec.done.includes(msg.mid) || rec.q.some(m => m.mid === msg.mid)) return false;
  if (recusarSeCheia && rec.q.length >= QUEUE_MAX && rec.q.every(pendingReward)) return false;
  rec.q = cortar([...rec.q, msg]);
  await gravar(kv, id, rec);
  return true;
}

/** Honra da temporada: por participar e por colocação. A Honra só compra prêmios do Torneio, então não mexe na economia de Bits. */
export function seasonPrize(place) {
  if (place === 1) return 120;
  if (place === 2) return 90;
  if (place === 3) return 60;
  if (place !== null && place <= 20) return 30;
  if (place !== null && place <= 100) return 15;
  return 6;
}

export function seasonLetter(season, place, now) {
  const emblems = seasonPrize(place);
  const lugarPt = place !== null && place <= 100 ? `Você terminou em ${place}º lugar.` : 'Você lutou até o fim.';
  const lugarEn = place !== null && place <= 100 ? `You finished in place ${place}.` : 'You fought it through.';
  return {
    mid: `season:${season}`,
    titlePt: `Temporada ${season}`, titleEn: `Season ${season}`,
    bodyPt: `A temporada ${season} do Torneio terminou. ${lugarPt} Trouxe isto para vocês.`,
    bodyEn: `Tournament season ${season} is over. ${lugarEn} I brought this for you two.`,
    bits: 0, emblems, at: now,
  };
}

const mesAnterior = (now) => {
  const d = new Date(now);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
};

/** Tira as expiradas (vão para `done`, então a carta da temporada não renasce). Devolve se mexeu. */
function varrer(rec, now) {
  const velhas = rec.q.filter(m => expirada(m, now));
  if (!velhas.length) return false;
  rec.q = rec.q.filter(m => !expirada(m, now));
  rec.done = [...rec.done, ...velhas.map(m => m.mid)].slice(-DONE_MAX);
  return true;
}

/** Lê a caixa. Na 1ª leitura de cada mês, quem jogou a temporada anterior ganha a carta dela (uma vez). Cartas expiradas somem aqui. */
export async function readMail(env, kv, id, now = Date.now()) {
  const rec = await ler(kv, id);
  let sujo = varrer(rec, now);
  const season = mesAnterior(now);
  if (rec.season !== season && !isSimuladoId(id)) {
    sujo = true;
    rec.season = season;
    const jogou = await kv.get(`rank:${season}:${id}`);
    const mid = `season:${season}`;
    if (jogou && !rec.done.includes(mid) && !rec.q.some(m => m.mid === mid)) {
      const p = await getProfile(env, id);
      // GM/admin não participa do ranking do Torneio: sem carta de colocação nem Honra (`_rankAdmin.js`).
      const admins = await adminSaveIds(env);
      if (p?.simulated !== true && !admins.has(id)) {
        const reais = ordenar((await lerIndice(env, season)).p).filter(r => !isSimuladoId(r.owner) && !admins.has(r.owner));
        const i = reais.findIndex(r => r.owner === id);
        rec.q = cortar([...rec.q, seasonLetter(season, i >= 0 ? i + 1 : null, now)]);
      }
    }
  }
  // Cartas globais vigentes: entram UMA vez por conta (apagada/expirada vira `done` e não renasce).
  if (!isSimuladoId(id)) {
    for (const g of cartasGlobaisAtivas(now)) {
      if (rec.done.includes(g.mid) || rec.q.some(m => m.mid === g.mid)) continue;
      const msg = sanitizeMail({ ...g, at: now });
      if (!msg) continue;
      msg.read = false; msg.claimedAt = 0;
      rec.q = cortar([...rec.q, msg]);
      sujo = true;
    }
  }
  if (sujo) await gravar(kv, id, rec);
  return rec.q;
}

const alvoDe = (mids) => new Set(Array.isArray(mids) ? mids : []);

/** Marca como lidas. Idempotente. */
export async function markRead(kv, id, mids) {
  const rec = await ler(kv, id);
  const alvo = alvoDe(mids);
  let n = 0;
  rec.q = rec.q.map(m => (alvo.has(m.mid) && !m.read ? (n++, { ...m, read: true }) : m));
  if (n) await gravar(kv, id, rec);
  return n;
}

/** Linha de `order_claims` que prova o resgate de UMA carta (§381); vive o mesmo prazo da caixa. */
const claimRow = (id, mid) => `mailclaim:${id}:${mid}`;

/**
 * Reivindica a carta no D1: só quem ganha o INSERT (PRIMARY KEY) paga. `false` = outro pedido já pagou esta carta.
 * Outro erro do D1 sobe (vira 5xx e retry), nunca "já resgatada".
 */
async function reivindicar(db, id, mid, now) {
  const row = claimRow(id, mid);
  await db.prepare('DELETE FROM order_claims WHERE order_id = ? AND expires_at IS NOT NULL AND expires_at <= ?').bind(row, now).run();
  try {
    await db.prepare('INSERT INTO order_claims (order_id, save_id, claimed_at, expires_at) VALUES (?, ?, ?, ?)')
      .bind(row, id, now, now + TTL_S * 1000).run();
    return true;
  } catch (err) {
    if (!ehViolacaoDeChave(err)) throw err;
    return false;
  }
}

/**
 * Resgata o prêmio das cartas pedidas (`mids`) ou de todas (`mids === null`). A transição acontece UMA vez por carta: a 2ª chamada devolve
 * lista vazia. O prêmio vem do registro do servidor. Marca a carta como lida e resgatada; ela continua na caixa até ser apagada ou expirar.
 * `db` (o D1, `env.DB`): com ele, cada carta é reivindicada por INSERT único (`mailclaim:<id>:<mid>`, §381), e N pedidos paralelos
 * pagam uma vez; carta cuja linha já existe é só marcada como resgatada. Sem D1, a transição depende do KV (janela de corrida de antes).
 */
export async function claimMail(kv, id, mids, now = Date.now(), db = null) {
  const rec = await ler(kv, id);
  const alvo = mids === null ? null : alvoDe(mids);
  const candidatas = rec.q.filter(m => pendingReward(m) && (!alvo || alvo.has(m.mid)));
  if (!candidatas.length) return [];
  const ganhas = new Set();
  for (const m of candidatas) if (!db || await reivindicar(db, id, m.mid, now)) ganhas.add(m.mid);
  const granted = [];
  const resgatadas = new Set(candidatas.map(m => m.mid));
  rec.q = rec.q.map(m => {
    if (!resgatadas.has(m.mid)) return m;
    if (ganhas.has(m.mid)) granted.push({ mid: m.mid, titlePt: m.titlePt, titleEn: m.titleEn, bits: m.bits, emblems: m.emblems });
    return { ...m, read: true, claimedAt: now };
  });
  try {
    await gravar(kv, id, rec);
  } catch (err) {
    // A caixa não gravou: solta as reivindicações desta chamada, senão o retry acharia a linha e o prêmio nunca seria pago.
    if (db) for (const mid of ganhas) await db.prepare('DELETE FROM order_claims WHERE order_id = ?').bind(claimRow(id, mid)).run();
    throw err;
  }
  return granted;
}

/**
 * Apaga cartas. Carta com prêmio pendente só sai com `force` (a confirmação do dono); sem ele volta em `blocked`.
 * `mids === 'read'`: todas as lidas SEM prêmio pendente (as com prêmio pendente ficam e voltam em `blocked`).
 */
export async function deleteMail(kv, id, mids, force = false) {
  const rec = await ler(kv, id);
  const alvo = mids === 'read' ? null : alvoDe(mids);
  const candidatas = rec.q.filter(m => (alvo ? alvo.has(m.mid) : m.read));
  const blocked = [];
  const removidas = [];
  for (const m of candidatas) (pendingReward(m) && !(force && alvo) ? blocked : removidas).push(m.mid);
  if (removidas.length) {
    const fora = new Set(removidas);
    rec.q = rec.q.filter(m => !fora.has(m.mid));
    rec.done = [...rec.done, ...removidas].slice(-DONE_MAX);
    await gravar(kv, id, rec);
  }
  return { removed: removidas.length, blocked };
}

/** Retira as cartas de convite de `fromPid` (o convite foi aceito, recusado ou cancelado). Idempotente. */
export async function removerConvitesDe(kv, id, fromPid) {
  const rec = await ler(kv, id);
  const fora = rec.q.filter(m => m.kind === 'friend-invite' && m.fromPid === fromPid).map(m => m.mid);
  if (!fora.length) return 0;
  rec.q = rec.q.filter(m => !fora.includes(m.mid));
  rec.done = [...rec.done, ...fora].slice(-DONE_MAX);
  await gravar(kv, id, rec);
  return fora.length;
}

// ── CARTAS DE CONVITE (§358): amizade e clã. ──
/** Teto de cartas de convite (amizade + clã) PENDENTES na caixa de uma pessoa. Passou disso, o convite novo segue valendo (lista de Amigos /
 *  código do clã), só não vira carta: a caixa não vira mural de spam e as cartas de prêmio nunca são empurradas para fora por convites. */
export const INVITE_PENDING_MAX = 20;
/** Carta de convite de clã: a nova (`kind`) e a de antes do §358 (só o `mid` `ginv:<gid>:<dia>`, sem `kind`). */
const ehConviteDeCla = (m) => m.kind === 'guild-invite' || m.mid.startsWith('ginv:');
export const isInviteLetter = (m) => m.kind === 'friend-invite' || ehConviteDeCla(m);

/**
 * Enfileira uma carta de CONVITE. Além das regras de `enqueueMail` (mesmo `mid` e simulado = no-op):
 *  · no máximo UMA carta pendente por par (`mesmoPar(carta)` decide: mesmo remetente de amizade, ou mesmo clã);
 *  · no máximo `INVITE_PENDING_MAX` cartas de convite pendentes por pessoa.
 * Devolve `'sent' | 'dup' | 'full' | 'skip'` (skip = lixo, simulado ou `mid` já visto). Nunca lança por regra; erro de KV sobe.
 */
export async function enqueueInvite(env, kv, id, raw, mesmoPar) {
  if (isSimuladoId(id)) return 'skip';
  const rec = await ler(kv, id);
  if (rec.q.some(m => isInviteLetter(m) && mesmoPar(m))) return 'dup';
  if (rec.q.filter(isInviteLetter).length >= INVITE_PENDING_MAX) return 'full';
  return (await enqueueMail(env, kv, id, raw)) ? 'sent' : 'skip';
}

/** Entrou num clã (por código, pela carta ou por aprovação): todo convite de clã pendente perde o sentido e sai da caixa. Idempotente. */
export async function removerConvitesDeCla(kv, id) {
  const rec = await ler(kv, id);
  const fora = rec.q.filter(ehConviteDeCla).map(m => m.mid);
  if (!fora.length) return 0;
  rec.q = rec.q.filter(m => !fora.includes(m.mid));
  rec.done = [...rec.done, ...fora].slice(-DONE_MAX);
  await gravar(kv, id, rec);
  return fora.length;
}

/** Confirma as cartas já creditadas (fluxo do app ANTERIOR à caixa §246: crédito no cliente por `mailClaimed`, depois `mailAck`;
 *  ver o comentário da rota em `community.js`). Idempotente: `mid` desconhecido não faz nada. */
export async function ackMail(kv, id, mids) {
  const rec = await ler(kv, id);
  const alvo = new Set(mids);
  const removidas = rec.q.filter(m => alvo.has(m.mid)).map(m => m.mid);
  if (!removidas.length) return 0;
  rec.q = rec.q.filter(m => !alvo.has(m.mid));
  rec.done = [...rec.done, ...removidas].slice(-DONE_MAX);
  await gravar(kv, id, rec);
  return removidas.length;
}
