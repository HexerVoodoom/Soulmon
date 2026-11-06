// O MENSAGEIRO (NPC 440, Papus; 05/11/2026, §241): fila por jogador de cartas com prêmio, em `mail:<saveId>`.
// Dono único da fila, do prêmio da temporada e da idempotência:
//  · cada carta tem `mid` estável; o mesmo `mid` nunca entra duas vezes, nem depois de confirmado (`done`);
//  · a carta da temporada nasce AQUI, na primeira leitura depois da virada do mês, sem depender de cron;
//  · o cliente só confirma (`ack`) um `mid` que já voltou gravado no save dele (`mailClaimed`), então crédito e fila não divergem;
//  · simulado nunca recebe nada.
import { isSimuladoId } from './_simulados.js';
import { adminSaveIds } from './_rankAdmin.js';
import { lerIndice, ordenar } from './_rankIndex.js';
import { getProfile } from './_profile.js';

const QUEUE_MAX = 30;
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
  return { mid, bodyPt, bodyEn, bits: inteiro(m.bits, MAIL_BITS_MAX), emblems: inteiro(m.emblems, MAIL_EMBLEMS_MAX), at: inteiro(m.at, Number.MAX_SAFE_INTEGER) };
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
  const p = await getProfile(env, id);
  if (p?.simulated === true) return false;
  const rec = await ler(kv, id);
  if (rec.done.includes(msg.mid) || rec.q.some(m => m.mid === msg.mid)) return false;
  rec.q = [...rec.q, msg].slice(-QUEUE_MAX);
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
    bodyPt: `A temporada ${season} do Torneio terminou. ${lugarPt} Trouxe isto para vocês.`,
    bodyEn: `Tournament season ${season} is over. ${lugarEn} I brought this for you two.`,
    bits: 0, emblems, at: now,
  };
}

const mesAnterior = (now) => {
  const d = new Date(now);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 1)).toISOString().slice(0, 7);
};

/** Lê a fila. Na 1ª leitura de cada mês, quem jogou a temporada anterior ganha a carta dela (uma vez). */
export async function readMail(env, kv, id, now = Date.now()) {
  const rec = await ler(kv, id);
  const season = mesAnterior(now);
  if (rec.season === season || isSimuladoId(id)) return rec.q;
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
      rec.q = [...rec.q, seasonLetter(season, i >= 0 ? i + 1 : null, now)].slice(-QUEUE_MAX);
    }
  }
  await gravar(kv, id, rec);
  return rec.q;
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
