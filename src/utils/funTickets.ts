/**
 * 🎫 TICKETS DOS MINIJOGOS DO SALÃO (pedido do dono, 09/11/2026) — substitui a "sessão" de `funSession.ts`.
 *
 * O jogador paga `FUN_TICKET_COST` (1) de energia e COMPRA `FUN_TICKET_BATCH` (3) tickets. Cada rodada iniciada gasta 1 ticket.
 *   · teto de `FUN_TICKET_MAX` (5) tickets vivos; só compra com `FUN_TICKET_BUY_AT_MOST` (2) ou menos (2 + 3 = 5). Com 3+, bloqueia;
 *   · cada ticket dura `FUN_TICKET_TTL_MS` (24 h). Decisão do dono: a validade é POR LOTE (os 3 de uma compra vencem juntos) e
 *     cada lote mantém o próprio relógio; gasta-se primeiro o lote que vence antes. Vencido some e não conta.
 *
 * Funções PURAS, rodam dentro do updater do `setGameState` e reconferem sobre `prev` (energia já regenerada): recusa devolve a MESMA
 * referência. Espelho no servidor: `functions/api/_funTickets.js` (paridade em `funTickets.parity.test.js`).
 * Save antigo sem `funTickets` = nenhum ticket.
 */
import { setEnergy, settleEnergy, type HungerState } from './hunger';

export const FUN_TICKET_COST = 1;
export const FUN_TICKET_BATCH = 3;
/** Quanto UMA partida gasta (`startFunRound`): 1 ticket, em todo jogo e dificuldade. É o número do "x1" no botão e no modal de compra. */
export const FUN_TICKET_PER_ROUND = 1;
export const FUN_TICKET_MAX = 5;
export const FUN_TICKET_BUY_AT_MOST = FUN_TICKET_MAX - FUN_TICKET_BATCH; // 2
export const FUN_TICKET_TTL_MS = 24 * 60 * 60 * 1000;
/** Quantos lotes o save guarda no máximo (com teto 5 e compra só com ≤2 nunca passa de 2 vivos; folga para lixo). */
export const FUN_TICKET_MAX_BATCHES = 4;

/** Um lote comprado: quando (ms) e quantos tickets ainda restam nele. */
export interface TicketBatch { at: number; left: number }
export interface FunTickets { batches: TicketBatch[] }
export interface FunTicketState extends HungerState { funTickets?: FunTickets }

/** Lixo → `undefined`. Lote com `left` fora de 0..BATCH é descartado; `left: 0` é o TOMBSTONE do lote gasto (persiste na nuvem até vencer); ordena do mais antigo ao mais novo. */
export function sanitizeFunTickets(raw: unknown): FunTickets | undefined {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return undefined;
  const b = (raw as { batches?: unknown }).batches;
  if (!Array.isArray(b)) return undefined;
  const out: TicketBatch[] = [];
  for (const it of b.slice(0, 16)) {
    if (!it || typeof it !== 'object') continue;
    const { at, left } = it as { at?: unknown; left?: unknown };
    if (typeof at !== 'number' || !Number.isFinite(at) || at < 0) continue;
    if (typeof left !== 'number' || !Number.isFinite(left)) continue;
    const l = Math.min(FUN_TICKET_BATCH, Math.floor(left));
    if (l < 0) continue;
    out.push({ at: Math.floor(at), left: l });
  }
  out.sort((x, y) => x.at - y.at);
  return { batches: out.slice(-FUN_TICKET_MAX_BATCHES) };
}

/** Lotes que ainda valem AGORA. Relógio que voltou antes da compra (`now < at`) não vale. */
export function liveBatches(state: { funTickets?: unknown }, nowMs: number): TicketBatch[] {
  const t = sanitizeFunTickets(state.funTickets);
  if (!t) return [];
  return t.batches.filter(x => nowMs >= x.at && nowMs - x.at < FUN_TICKET_TTL_MS);
}

export function ticketCount(state: { funTickets?: unknown }, nowMs: number): number {
  return liveBatches(state, nowMs).reduce((n, x) => n + x.left, 0);
}

/** ms até o lote que vence primeiro (0 sem ticket). */
export function nextExpiryMs(state: { funTickets?: unknown }, nowMs: number): number {
  const l = liveBatches(state, nowMs).filter(x => x.left > 0);
  return l.length ? Math.max(0, l[0].at + FUN_TICKET_TTL_MS - nowMs) : 0;
}

export type TicketBuyRefusal = 'has-tickets' | 'no-energy';

export function ticketBuyRefusal(state: FunTicketState, nowMs: number): TicketBuyRefusal | undefined {
  if (ticketCount(state, nowMs) > FUN_TICKET_BUY_AT_MOST) return 'has-tickets';
  const energy = settleEnergy(state, nowMs).energyPoints;
  if (Math.floor(Number(energy) || 0) < FUN_TICKET_COST) return 'no-energy';
  return undefined;
}

export interface FunTicketStatus {
  count: number;
  /** ms até o lote que vence primeiro. */
  msLeft: number;
  canBuy: boolean;
  buyRefusal?: TicketBuyRefusal;
  /** Dá para começar uma rodada agora (tem ticket). */
  canPlay: boolean;
}

export function funTicketStatus(state: FunTicketState, nowMs: number): FunTicketStatus {
  const count = ticketCount(state, nowMs);
  const buyRefusal = ticketBuyRefusal(state, nowMs);
  return { count, msLeft: nextExpiryMs(state, nowMs), canBuy: !buyRefusal, buyRefusal, canPlay: count > 0 };
}

/** Compra o lote: cobra a energia e junta 3 tickets (lotes vencidos saem). Recusa = mesma referência. */
export function buyFunTickets<T extends FunTicketState>(prev: T, nowMs: number): T {
  if (ticketBuyRefusal(prev, nowMs)) return prev;
  const gasto = setEnergy(prev, nowMs, (cur) => cur - FUN_TICKET_COST);
  const vivos = liveBatches(prev, nowMs);
  return { ...gasto, funTickets: { batches: [...vivos, { at: nowMs, left: FUN_TICKET_BATCH }] } };
}

/** Começa UMA rodada: gasta 1 ticket do lote que vence primeiro. Sem ticket = mesma referência. */
export function startFunRound<T extends FunTicketState>(prev: T, nowMs: number): T {
  const vivos = liveBatches(prev, nowMs);
  const i = vivos.findIndex(x => x.left >= FUN_TICKET_PER_ROUND);
  if (i < 0) return prev;
  // Lote zerado fica com `left: 0` (tombstone): a nuvem só aceita o gasto do último ticket se o zero for gravado.
  const batches = vivos.map((x, j) => (j === i ? { at: x.at, left: x.left - FUN_TICKET_PER_ROUND } : x));
  return { ...prev, funTickets: { batches } };
}

export function formatHms(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
