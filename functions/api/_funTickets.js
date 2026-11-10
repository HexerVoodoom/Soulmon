/**
 * Tickets dos minijogos do Salão no SERVIDOR (09/11/2026; regra no app: `src/utils/funTickets.ts`, paridade em `funTickets.parity.test.js`).
 *
 * Mesmo limite honesto de `_dayCounters.js`: o save é local-first e escrito pelo cliente, o servidor não conhece a energia. O que ele
 * LEMBRA, para que apagar o save local ou editar o JSON não crie ticket:
 *   · gasto é monotônico: num lote já conhecido (mesmo `at`), `left = min(recebido, gravado)` — nunca volta ticket;
 *   · lote ZERADO (`left: 0`) é tombstone: o cliente manda e o servidor grava até o vencimento (senão o último ticket gasto voltaria);
 *   · lote que o servidor já guardava e o cliente omitiu continua valendo (omitir não é jeito de zerar... nem de ganhar);
 *   · lote NOVO só entra se a posse viva gravada for ≤ 2 (regra de compra), com `left` ≤ 3, no máximo UM por gravação, e com `at`
 *     dentro de ±1 dia do relógio do servidor (adiantar o relógio não rende lote de semanas à frente);
 *   · posse viva depois da junção nunca passa de 5; lote vencido (≥ 24 h do relógio do servidor) é descartado.
 */
export const FUN_TICKET_BATCH = 3;
export const FUN_TICKET_MAX = 5;
export const FUN_TICKET_BUY_AT_MOST = FUN_TICKET_MAX - FUN_TICKET_BATCH;
export const FUN_TICKET_TTL_MS = 24 * 60 * 60 * 1000;
export const FUN_TICKET_MAX_BATCHES = 4;
const DAY_MS = 86_400_000;

/** @param {unknown} raw @returns {{batches:{at:number,left:number}[]}|undefined} */
export function sanitizeFunTickets(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const b = /** @type {{batches?:unknown}} */ (raw).batches;
  if (!Array.isArray(b)) return undefined;
  const out = [];
  for (const it of b.slice(0, 16)) {
    if (!it || typeof it !== 'object') continue;
    const { at, left } = /** @type {{at?:unknown,left?:unknown}} */ (it);
    if (typeof at !== 'number' || !Number.isFinite(at) || at < 0) continue;
    if (typeof left !== 'number' || !Number.isFinite(left)) continue;
    const l = Math.min(FUN_TICKET_BATCH, Math.floor(left));
    if (l < 0) continue;
    out.push({ at: Math.floor(at), left: l });
  }
  out.sort((x, y) => x.at - y.at);
  return { batches: out.slice(-FUN_TICKET_MAX_BATCHES) };
}

const vivo = (x, nowMs) => nowMs - x.at < FUN_TICKET_TTL_MS && x.at - nowMs <= DAY_MS;
const soma = (l) => l.reduce((n, x) => n + x.left, 0);

/**
 * @param {unknown} incoming o que o cliente mandou @param {unknown} stored o que já está gravado @param {number} [nowMs]
 * @returns {{batches:{at:number,left:number}[]}|undefined} `undefined` = nenhum ticket (o campo sai do save)
 */
export function enforceFunTickets(incoming, stored, nowMs = Date.now()) {
  const inc = sanitizeFunTickets(incoming)?.batches ?? [];
  const sto = (sanitizeFunTickets(stored)?.batches ?? []).filter((x) => vivo(x, nowMs));
  const porAt = new Map(sto.map((x) => [x.at, x.left]));
  // Lotes conhecidos: o gasto só desce.
  const merged = sto.map((x) => {
    const v = inc.find((i) => i.at === x.at);
    return { at: x.at, left: v ? Math.min(v.left, x.left) : x.left };
  });
  // Lote novo: um por gravação, só com posse viva ≤ 2, no máximo 3 tickets, com `at` plausível.
  const novos = inc.filter((i) => !porAt.has(i.at) && vivo(i, nowMs) && i.at <= nowMs + DAY_MS);
  const novo = novos[novos.length - 1];
  if (novo && novo.left > 0 && soma(merged) <= FUN_TICKET_BUY_AT_MOST && soma(merged) + novo.left <= FUN_TICKET_MAX) merged.push(novo);
  // Lote zerado (left 0) é TOMBSTONE e fica gravado até vencer: sem ele, relogar/outro aparelho recuperaria o ticket gasto.
  const out = merged.sort((a, b) => a.at - b.at).slice(-FUN_TICKET_MAX_BATCHES);
  return out.length ? { batches: out } : undefined;
}
