/**
 * LIMITES DE CONVITE (amizade e clã) — dono único das constantes (QA r4 C2 · C, REGISTRO §388, decisão do dono 14/11/2026).
 *
 *  · RECUSA BLOQUEIA O PAR por `INVITE_DECLINE_BLOCK_MS` (7 dias): depois que o destinatário recusa, o MESMO remetente (amizade:
 *    a conta; clã: o clã, porque a carta é do clã e qualquer membro convida) não chega a ele de novo nesse prazo. A resposta ao
 *    remetente bloqueado é a MESMA do sucesso: quem convida não fica sabendo da recusa. A marca mora no KV com TTL (vence sozinha).
 *  · TETO DIÁRIO POR REMETENTE no KV (`invday:<tipo>:<id>:<dia UTC>`), que vale entre isolates. Os tetos por hora de antes
 *    (`takeToken` em memória de isolate, 30/h amizade e 20/h clã) continuam como limite adicional.
 * O contador do KV não é transacional (ADR-005): dois pedidos no mesmo instante podem passar juntos. É amortecedor de spam, não
 * dinheiro; a folga máxima é de alguns convites.
 */

export const INVITE_DECLINE_BLOCK_MS = 7 * 86_400_000;
export const FRIEND_INVITE_HOURLY = Object.freeze({ limit: 30, windowMs: 3_600_000 });
export const GUILD_INVITE_HOURLY = Object.freeze({ limit: 20, windowMs: 3_600_000 });
export const FRIEND_INVITE_DAILY_CAP = 60;
export const GUILD_INVITE_DAILY_CAP = 40;

/** @typedef {'f' | 'g'} TipoConvite  `f` = amizade (remetente = saveId), `g` = clã (remetente = id do clã). */

const blkKey = (tipo, de, para) => `invblk:${tipo}:${de}:${para}`;
const diaKey = (tipo, de, nowMs) => `invday:${tipo}:${de}:${new Date(nowMs).toISOString().slice(0, 10)}`;

/** O destinatário recusou: o par fica bloqueado por 7 dias. @param {any} kv @param {TipoConvite} tipo */
export async function marcarRecusa(kv, tipo, de, para, nowMs = Date.now()) {
  await kv.put(blkKey(tipo, de, para), String(nowMs), { expirationTtl: Math.ceil(INVITE_DECLINE_BLOCK_MS / 1000) });
}

/** O par está bloqueado por uma recusa recente? Confere o prazo também (KV de teste não vence por TTL). @param {any} kv @param {TipoConvite} tipo */
export async function parBloqueado(kv, tipo, de, para, nowMs = Date.now()) {
  const raw = await kv.get(blkKey(tipo, de, para));
  if (raw === null || raw === undefined) return false;
  const at = Number(raw);
  return !Number.isFinite(at) || nowMs - at < INVITE_DECLINE_BLOCK_MS;
}

/**
 * Conta UM convite do remetente no dia (UTC do servidor). `false` = o teto do dia já foi atingido (nada é contado).
 * @param {any} kv @param {TipoConvite} tipo
 */
export async function contarConviteDoDia(kv, tipo, de, nowMs = Date.now()) {
  const teto = tipo === 'f' ? FRIEND_INVITE_DAILY_CAP : GUILD_INVITE_DAILY_CAP;
  const k = diaKey(tipo, de, nowMs);
  const n = Math.max(0, Math.floor(Number(await kv.get(k)) || 0));
  if (n >= teto) return false;
  await kv.put(k, String(n + 1), { expirationTtl: 2 * 86_400 });
  return true;
}

/** Segundos até a virada do dia UTC (o `Retry-After` do teto diário). */
export const segundosAteAmanhaUtc = (nowMs = Date.now()) => Math.max(1, Math.ceil(((Math.floor(nowMs / 86_400_000) + 1) * 86_400_000 - nowMs) / 1000));
