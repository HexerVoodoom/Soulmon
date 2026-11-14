/**
 * 🎫 TICKETS DO TREINO (aba Sparring do Torneio; dono, 10/11/2026). Todo DIA DO JOGADOR dá 1 ticket GRÁTIS = `TREINO_TICKET_MATCHES` (20)
 * partidas COM Honra (1–2 por vitória, teto de Honra do dia em `SPAR_HONOR_DAILY_CAP`). Passou das 20, só jogando com ticket EXTRA:
 * `TREINO_EXTRA_TICKET_BITS` (30) Bits = +20 partidas SEM Honra, no máximo `TREINO_EXTRA_TICKETS_MAX` (3) por dia (documentado: evita farm).
 * Paga com Bits do saldo (desde §373 o Bit vindo de Crédito também paga, gasto primeiro); Créditos nunca pagam direto.
 * O CONTADOR mora no SERVIDOR (`functions/api/_treino.js`, KV `sparTicket:<id>:<dia do jogador>`); o app só cobra os Bits depois do ok
 * do servidor. O Treino nunca ranqueia. Constantes espelhadas do servidor (paridade em `treino.parity.test.js`).
 */
import { spendableBits, spendBitsIfCovered, type BitsOriginState } from './bitsOrigin';

export const TREINO_TICKET_MATCHES = 20;
export const TREINO_EXTRA_TICKET_BITS = 30;
export const TREINO_EXTRA_TICKETS_MAX = 3;

/** O que o servidor devolve em `tickets` (sparOpponents/sparMatch/sparBuyTicket). */
export interface TreinoTickets { played: number; extra: number; capacity: number; honorLeft: number; left: number; canBuy: boolean }

/** Resposta de lixo/antiga (servidor sem tickets) = `undefined`: a aba some com o contador e segue como era. */
export function sanitizeTreinoTickets(raw: unknown): TreinoTickets | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  const n = (v: unknown, max: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : undefined);
  const extra = n(o.extra, TREINO_EXTRA_TICKETS_MAX);
  const played = n(o.played, TREINO_TICKET_MATCHES * (1 + TREINO_EXTRA_TICKETS_MAX));
  if (extra === undefined || played === undefined) return undefined;
  const capacity = TREINO_TICKET_MATCHES * (1 + extra);
  return { played, extra, capacity, honorLeft: Math.max(0, TREINO_TICKET_MATCHES - played), left: Math.max(0, capacity - played), canBuy: extra < TREINO_EXTRA_TICKETS_MAX };
}

export type TreinoBuyRefusal = 'max-extras' | 'no-bits';

/** Recusa suave da compra do extra (nada é cobrado). */
export function treinoBuyRefusal(t: TreinoTickets, state: BitsOriginState): TreinoBuyRefusal | undefined {
  if (!t.canBuy) return 'max-extras';
  if (spendableBits(state) < TREINO_EXTRA_TICKET_BITS) return 'no-bits';
  return undefined;
}

/** Cobra os 30 Bits (reconfere sobre `prev`: dois toques no mesmo lote não compram com o saldo de um). Recusa devolve o MESMO objeto. */
export function chargeTreinoTicket<T extends BitsOriginState>(prev: T): T {
  return spendBitsIfCovered(prev, TREINO_EXTRA_TICKET_BITS);
}
