// O MENSAGEIRO (NPC 440, Papus; 05/11/2026, §241): fila por jogador de cartas com prêmio, em `mail:<saveId>`.
// Dono único da fila, do prêmio da temporada e da idempotência:
//  · cada carta tem `mid` estável; o mesmo `mid` nunca entra duas vezes, nem depois de confirmado (`done`);
//  · a carta da temporada nasce AQUI, na primeira leitura depois da virada do mês, sem depender de cron;
//  · o cliente só confirma (`ack`) um `mid` que já voltou gravado no save dele (`mailClaimed`), então crédito e fila não divergem;
//  · simulado nunca recebe nada.
// Caixa de cartas (§245): a carta fica na caixa depois de lida/resgatada. O RESGATE é decidido AQUI (`claimMail`): o prêmio sai do registro do
// servidor, não do corpo do pedido, e a transição `não resgatada → resgatada` acontece uma única vez; o cliente ainda deduplica por `mailClaimed`.
// Carta SEM prêmio pendente some sozinha 3 dias depois (`MAIL_TTL_MS`); com prêmio pendente nunca expira nem é apagada sem `force`.
import { isSimuladoId } from './_simulados.js';
import { lerIndice, ordenar } from './_rankIndex.js';
import { getProfile } from './_profile.js';

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
  };
}

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

async function ler(kv, id) {
  let r = null;
  try { r = JSON.parse((await kv.get(`mail:${id}`)) || 'null'); } catch { r = null; }
  return {
    q: Array.isArray(r?.q) ? r.q.map(sanitizeMail).filter(Boolean) : [],
    done: Array.isArray(r?.done) ? r.done.filter(x => typeof x === 'string') : [],
    season: typeof r?.season === 'string' ? r.season : '',
  };
}
const gravar = (kv, id, rec) => kv.put(`mail:${id}`, JSON.stringify(rec), { expirationTtl: TTL_S });

/** Enfileira uma carta. Mesmo `mid` (na fila ou já confirmado) e simulado são no-op. */
export async function enqueueMail(env, kv, id, raw) {
  const msg = sanitizeMail(raw);
  if (!msg || isSimuladoId(id)) return false;
  msg.read = false; msg.claimedAt = 0;
  if (!msg.at) msg.at = Date.now();
  const p = await getProfile(env, id);
  if (p?.simulated === true) return false;
  const rec = await ler(kv, id);
  if (rec.done.includes(msg.mid) || rec.q.some(m => m.mid === msg.mid)) return false;
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
      if (p?.simulated !== true) {
        const reais = ordenar(await lerIndice(env, season)).filter(r => !isSimuladoId(r.owner));
        const i = reais.findIndex(r => r.owner === id);
        rec.q = cortar([...rec.q, seasonLetter(season, i >= 0 ? i + 1 : null, now)]);
      }
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

/**
 * Resgata o prêmio das cartas pedidas (`mids`) ou de todas (`mids === null`). A transição acontece UMA vez por carta: a 2ª chamada devolve
 * lista vazia. O prêmio vem do registro do servidor. Marca a carta como lida e resgatada; ela continua na caixa até ser apagada ou expirar.
 */
export async function claimMail(kv, id, mids, now = Date.now()) {
  const rec = await ler(kv, id);
  const alvo = mids === null ? null : alvoDe(mids);
  const granted = [];
  rec.q = rec.q.map(m => {
    if (!pendingReward(m) || (alvo && !alvo.has(m.mid))) return m;
    granted.push({ mid: m.mid, titlePt: m.titlePt, titleEn: m.titleEn, bits: m.bits, emblems: m.emblems });
    return { ...m, read: true, claimedAt: now };
  });
  if (granted.length) await gravar(kv, id, rec);
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

/** Confirma as cartas já creditadas. Idempotente: `mid` desconhecido não faz nada. */
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
