/**
 * Convite de Duelo no SERVIDOR (REGISTRO §458; regra no app: `src/utils/duelInvites.ts`, paridade em `duelInvites.parity.test.js`).
 *
 * Mesmo limite honesto de `_funTickets.js`: o save é local-first e o servidor não conhece a energia nem a conta paga na gravação.
 * O que ele LEMBRA, para que editar o JSON ou apagar o save local não encha o estoque:
 *   · gasto só desce: um `n` menor que o gravado passa sempre;
 *   · AUMENTO só entra com um carimbo `at` novo: `at` > `at` gravado + 60 s e no máximo 1 dia à frente do relógio do servidor;
 *     o aumento nunca passa de 7 (teto do estoque);
 *   · campo omitido pelo cliente não zera nem enche: vale o gravado;
 *   · sem nada gravado vale o estoque inicial (7): então só dá para descer.
 * Limite honesto: quem forja JSON válido pode reencher o estoque (no máximo a cada 60 s) sem gastar energia, e a troca é de 3 convites
 * por energia para TODOS (22/11/2026; a diferença 5 x 7 da conta paga foi revogada), valor que o servidor não verifica aqui (o estoque máximo é 7).
 */
export const DUEL_INVITE_MAX = 7;
export const DUEL_INVITE_INITIAL = 7;
export const DUEL_INVITE_MIN_GAP_MS = 60_000;
const DAY_MS = 86_400_000;

/** @param {unknown} raw @returns {{n:number,at:number}|undefined} */
export function sanitizeDuelInvites(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const { n, at } = /** @type {{n?:unknown,at?:unknown}} */ (raw);
  if (typeof n !== 'number' || !Number.isFinite(n)) return undefined;
  const a = typeof at === 'number' && Number.isFinite(at) && at >= 0 ? Math.floor(at) : 0;
  return { n: Math.min(DUEL_INVITE_MAX, Math.max(0, Math.floor(n))), at: a };
}

/**
 * @param {unknown} incoming o que o cliente mandou @param {unknown} stored o que já está gravado @param {number} [nowMs]
 * @returns {{n:number,at:number}|undefined} `undefined` = campo fora do save (estoque inicial)
 */
export function enforceDuelInvites(incoming, stored, nowMs = Date.now()) {
  const inc = sanitizeDuelInvites(incoming);
  const sto = sanitizeDuelInvites(stored);
  if (!inc) return sto;
  const base = sto ?? { n: DUEL_INVITE_INITIAL, at: 0 };
  if (inc.n <= base.n) return { n: inc.n, at: base.at };
  const novo = inc.at > base.at + DUEL_INVITE_MIN_GAP_MS && inc.at <= nowMs + DAY_MS;
  if (!novo) return { n: base.n, at: base.at };
  return { n: Math.min(DUEL_INVITE_MAX, inc.n), at: inc.at };
}
