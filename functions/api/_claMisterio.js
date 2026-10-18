// ---------------------------------------------------------------------------
// O MISTÉRIO DO CLÃ (D-18). Um membro ENVIA um Soulmon investigar (1 envio ativo
// por membro); a BARRA É COLETIVA e cada tarefa do dia a dia concluída por
// qualquer membro soma 1 ponto. Barra cheia (100) -> cada ENVIADO daquela rodada
// resgata uma recompensa que o SERVIDOR sorteia; a barra recomeça.
//
// DERIVAÇÃO (sem escrita compartilhada): cada membro tem a chave própria
// `claMis:<gid>:<save>` com `pts` (vitalício). total = soma dos membros atuais;
// rodada = floor(total / MISTERIO_ALVO); barra = total mod alvo. Para a barra não
// regredir quando alguém sai, `claMisRodada:<gid>` guarda a rodada MÁXIMA já vista
// (max-merge, corrida benigna); com ela, total abaixo do piso mostra barra 0.
//
// ABUSO: teto `MISTERIO_TETO_DIA` (10) pontos por membro por dia do jogador e
// idempotência por `taskId` (ids de hoje e ontem guardados; reenvio = no-op).
// A vista NUNCA devolve pontos por pessoa — só a barra coletiva (0..99).
// G-01: recompensa rara em chip, nenhuma comida.
// ---------------------------------------------------------------------------
import { kvOrThrow } from './_kv.js';
import { rngSeguro, sortearPonderado, PRESENTE_DECOR, PRESENTE_CHIPS } from './_claPraca.js';

export const MISTERIO_TTL = 86400 * 120;
export const MISTERIO_ALVO = 100;
export const MISTERIO_TETO_DIA = 10;
export const MISTERIO_IDS_MAX = 40;
export const TASK_ID_RE = /^[A-Za-z0-9_:.-]{1,64}$/;

/** Pesos da recompensa (soma 1000). Chip 3% raro; sem comida (G-01). */
export const MISTERIO_PESOS = Object.freeze({ bits: 600, decor: 370, chip: 30 });
export const MISTERIO_BITS = Object.freeze([20, 30, 40, 50]);

export const misKey = (gid, save) => `claMis:${gid}:${save}`;
export const misRodadaKey = gid => `claMisRodada:${gid}`;

const DIA_RE = /^\d{4}-\d{2}-\d{2}$/;
const numDia = d => Math.round(Date.parse(`${d}T00:00:00Z`) / 86400000);
const parse = raw => { try { return raw ? JSON.parse(raw) : null; } catch { return null; } };
const int0 = n => (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);

export function normalizarMis(r) {
  return {
    v: 1,
    pts: int0(r?.pts),
    day: typeof r?.day === 'string' && DIA_RE.test(r.day) ? r.day : null,
    dayPts: Math.min(MISTERIO_TETO_DIA, int0(r?.dayPts)),
    ids: (Array.isArray(r?.ids) ? r.ids : []).filter(x => x && typeof x.id === 'string' && DIA_RE.test(x.day)).slice(-MISTERIO_IDS_MAX),
    sentRound: Number.isInteger(r?.sentRound) && r.sentRound >= 0 ? r.sentRound : null,
  };
}

/** Rodada e barra a partir do total e da rodada máxima já vista (PURA). */
export function barraDoMisterio(total, rodadaMax = 0) {
  const t = int0(total);
  const rodada = Math.max(Math.floor(t / MISTERIO_ALVO), int0(rodadaMax));
  const bar = Math.min(MISTERIO_ALVO - 1, Math.max(0, t - rodada * MISTERIO_ALVO));
  return { rodada, bar };
}

/** Sorteia a recompensa (servidor). `rng()` em [0,1). */
export function sortearRecompensaMisterio(rng = rngSeguro) {
  const kind = sortearPonderado(MISTERIO_PESOS, rng());
  if (kind === 'bits') return { kind, amount: MISTERIO_BITS[Math.floor(rng() * MISTERIO_BITS.length) % MISTERIO_BITS.length] };
  if (kind === 'decor') return { kind, id: PRESENTE_DECOR[Math.floor(rng() * PRESENTE_DECOR.length) % PRESENTE_DECOR.length] };
  return { kind: 'chip', id: PRESENTE_CHIPS[Math.floor(rng() * PRESENTE_CHIPS.length) % PRESENTE_CHIPS.length] };
}

export async function lerMis(env, gid, save) { return normalizarMis(parse(await kvOrThrow(env).get(misKey(gid, save)))); }
async function gravarMis(env, gid, save, m) {
  await kvOrThrow(env).put(misKey(gid, save), JSON.stringify(m), { expirationTtl: MISTERIO_TTL });
  return m;
}
async function lerRodadaMax(env, gid) { return int0(parse(await kvOrThrow(env).get(misRodadaKey(gid)))?.rodada); }

/** Estado coletivo: total (membros atuais), rodada, barra. Grava o piso se a rodada subiu. */
async function coletivo(env, g) {
  const lidos = await Promise.all(g.members.map(m => lerMis(env, g.id, m)));
  const total = lidos.reduce((s, m) => s + m.pts, 0);
  const max = await lerRodadaMax(env, g.id);
  const b = barraDoMisterio(total, max);
  if (b.rodada > max) await kvOrThrow(env).put(misRodadaKey(g.id), JSON.stringify({ rodada: b.rodada }), { expirationTtl: MISTERIO_TTL });
  return { membros: Object.fromEntries(g.members.map((m, i) => [m, lidos[i]])), ...b };
}

/** Envia o Soulmon. 'already-sent' (ativo) ou 'reward-pending' (resgate antes de reenviar). */
export async function enviarMisterio(env, g, save) {
  const c = await coletivo(env, g);
  const m = c.membros[save];
  if (m.sentRound !== null) return { ok: false, reason: m.sentRound < c.rodada ? 'reward-pending' : 'already-sent' };
  m.sentRound = c.rodada;
  await gravarMis(env, g.id, save, m);
  return { ok: true };
}

/**
 * Soma 1 ponto por tarefa concluída. Idempotente por `taskId`; teto diário.
 * Devolve `{ ok:false, reason:'invalid-task' }` ou `{ ok:true, counted, reason? }`
 * (`reason`: 'duplicate' | 'daily-cap').
 */
export async function somarTarefa(env, g, save, hoje, taskId) {
  if (typeof taskId !== 'string' || !TASK_ID_RE.test(taskId)) return { ok: false, reason: 'invalid-task' };
  const m = await lerMis(env, g.id, save);
  if (m.ids.some(x => x.id === taskId)) return { ok: true, counted: false, reason: 'duplicate' };
  const hojeN = numDia(hoje);
  const dayPts = m.day === hoje ? m.dayPts : 0;
  if (dayPts >= MISTERIO_TETO_DIA) return { ok: true, counted: false, reason: 'daily-cap' };
  m.ids = [...m.ids.filter(x => hojeN - numDia(x.day) <= 1), { id: taskId, day: hoje }].slice(-MISTERIO_IDS_MAX);
  m.day = hoje;
  m.dayPts = dayPts + 1;
  m.pts += 1;
  await gravarMis(env, g.id, save, m);
  return { ok: true, counted: true };
}

/** Resgate do enviado quando a barra da rodada dele encheu. `reason`: 'nothing-to-claim'. */
export async function resgatarMisterio(env, g, save, rng = rngSeguro) {
  const c = await coletivo(env, g);
  const m = c.membros[save];
  if (m.sentRound === null || m.sentRound >= c.rodada) return { ok: false, reason: 'nothing-to-claim' };
  const reward = sortearRecompensaMisterio(rng);
  const rodada = m.sentRound;
  m.sentRound = null;
  await gravarMis(env, g.id, save, m);
  return { ok: true, reward, receipt: `${g.id}|mis|${rodada}|${save.slice(0, 8)}` };
}

/** A VISTA: barra coletiva 0..99, rodada, quantos investigam; nada por pessoa. */
export async function vistaDoMisterio(env, g, eu, hoje) {
  const c = await coletivo(env, g);
  const m = c.membros[eu] ?? normalizarMis(null);
  const ativos = g.members.filter(x => c.membros[x].sentRound !== null && c.membros[x].sentRound >= c.rodada).length;
  return {
    bar: c.bar,
    round: c.rodada,
    investigating: ativos,
    mine: {
      sent: m.sentRound !== null && m.sentRound >= c.rodada,
      rewardPending: m.sentRound !== null && m.sentRound < c.rodada,
      capReached: m.day === hoje && m.dayPts >= MISTERIO_TETO_DIA,
    },
  };
}
