/**
 * Combate v3 / PR8 — a PROCEDÊNCIA dos Bits (dono único).
 *
 * Regra do dono (§2.26): equipamento (o que rende % de combate) só se compra com Bits GANHOS jogando; Créditos (dinheiro real)
 * aceleram só o que NÃO é combate, com teto de +25% sobre o ganho grátis do dia. Para isso o saldo `gamePoints` continua UM
 * número só, e este registro guarda o que ele precisa para responder "quanto disto é ganho?":
 *
 *  · `paidLeft`: quanto do saldo veio do câmbio Crédito→Bits e ainda não foi gasto. Tudo o que NÃO é equipamento gasta o pago
 *    primeiro (`spendBitsPaidFirst`); o equipamento só enxerga `earnedBits = gamePoints − paidLeft`.
 *  · `day` / `free` / `fromCredits`: os Bits grátis e os Bits de Crédito do DIA do jogador. O câmbio do dia cabe em
 *    `CREDIT_BITS_CAP_RATIO` (25%) do ganho grátis do dia, com um piso de referência (`CREDIT_CAP_REFERENCE_FREE`) para o dia
 *    em que o jogador ainda não ganhou nada.
 *
 * Limite honesto: o save é escrito pelo cliente (o servidor só sanea a forma), então isto é regra de CLIENTE; o que o servidor
 * pode garantir (e garante, `_equipment.js`) é o teto de 5% e a lista fechada de itens. Sem campo `bitsOrigin` (save antigo) todo
 * Bit conta como ganho.
 *
 * Módulo PURO: sem React, sem relógio (o dia entra por parâmetro), sem localStorage.
 */

/** Fração do ganho grátis do dia que os Créditos podem somar em Bits (decisão do dono, §2.26). */
export const CREDIT_BITS_CAP_RATIO = 0.25;

/** O piso da base do teto: um dia completo (`BITS_PER_COMPLETE_DAY`, 100) — sem ele o 1º câmbio do dia nunca caberia. */
export const CREDIT_CAP_REFERENCE_FREE = 100;

export interface BitsOrigin {
  /** Dia do jogador (`playerDayKey`) a que `free` e `fromCredits` se referem. */
  readonly day: string;
  /** Bits GRÁTIS (minijogo, dia completo, Pesadelo, presente de amigo) creditados neste dia. */
  readonly free: number;
  /** Bits vindos de Créditos neste dia. */
  readonly fromCredits: number;
  /** Bits de Crédito ainda no saldo (nunca passa do saldo). */
  readonly paidLeft: number;
}

export interface BitsOriginState {
  gamePoints?: number;
  bitsOrigin?: BitsOrigin;
}

const fin = (n: unknown): number => (typeof n === 'number' && Number.isFinite(n) && n > 0 ? Math.min(1e9, Math.floor(n)) : 0);

/** Lixo vira "nada registrado". Dia diferente zera o contador do dia e mantém o `paidLeft`. */
export function normalizeOrigin(raw: unknown, dayKey: string): BitsOrigin {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  const sameDay = typeof o.day === 'string' && o.day === dayKey;
  return {
    day: dayKey,
    free: sameDay ? fin(o.free) : 0,
    fromCredits: sameDay ? fin(o.fromCredits) : 0,
    paidLeft: fin(o.paidLeft),
  };
}

/** Sanea o campo do save (forma só; o `day` fica como veio, e o dia certo entra na próxima leitura). */
export function sanitizeBitsOrigin(raw: unknown): BitsOrigin | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  if (typeof o.day !== 'string' || o.day.length === 0 || o.day.length > 40) return undefined;
  return { day: o.day, free: fin(o.free), fromCredits: fin(o.fromCredits), paidLeft: fin(o.paidLeft) };
}

/** Os Bits que podem comprar EQUIPAMENTO: o saldo menos o que veio de Crédito. */
export function earnedBits(state: BitsOriginState): number {
  const bal = fin(state.gamePoints);
  return Math.max(0, bal - Math.min(bal, fin(state.bitsOrigin?.paidLeft)));
}

/** Registra Bits GRÁTIS ganhos agora (some ao ganho do dia). Devolve o MESMO objeto se não há o que somar. */
export function noteFreeBits<T extends BitsOriginState>(prev: T, amount: number, dayKey: string): T {
  const n = fin(amount);
  if (n <= 0) return prev;
  const o = normalizeOrigin(prev.bitsOrigin, dayKey);
  return { ...prev, bitsOrigin: { ...o, free: o.free + n } };
}

/** Quantos Bits o câmbio ainda pode render hoje: `25% × max(grátis do dia, piso) − já trocado hoje`. */
export function creditExchangeRoom(state: BitsOriginState, dayKey: string): number {
  const o = normalizeOrigin(state.bitsOrigin, dayKey);
  const cap = Math.floor(CREDIT_BITS_CAP_RATIO * Math.max(o.free, CREDIT_CAP_REFERENCE_FREE));
  return Math.max(0, cap - o.fromCredits);
}

export type CreditExchangeRefusal = 'over-cap';

/**
 * Soma ao saldo os Bits de um câmbio de Créditos (o gasto do Crédito é do servidor, antes), respeitando o teto do dia.
 * Recusa o pacote INTEIRO que passa do teto (não parte o pacote: o que o jogador pagou chega por inteiro ou não chega).
 */
export function applyCreditExchange<T extends BitsOriginState>(
  prev: T,
  bits: number,
  dayKey: string,
): { ok: true; state: T } | { ok: false; reason: CreditExchangeRefusal; room: number } {
  const n = fin(bits);
  const room = creditExchangeRoom(prev, dayKey);
  if (n <= 0 || n > room) return { ok: false, reason: 'over-cap', room };
  const o = normalizeOrigin(prev.bitsOrigin, dayKey);
  return {
    ok: true,
    state: {
      ...prev,
      gamePoints: fin(prev.gamePoints) + n,
      bitsOrigin: { ...o, fromCredits: o.fromCredits + n, paidLeft: o.paidLeft + n },
    },
  };
}

/**
 * O gasto que NÃO é equipamento (loja, respec, sumidouro): gasta o Bit PAGO primeiro, para o equipamento só ver Bit ganho.
 * Chame DEPOIS de debitar `gamePoints` (o `paidLeft` nunca fica acima do saldo que sobrou).
 */
export function spendBitsPaidFirst<T extends BitsOriginState>(prev: T, amount: number): T {
  const n = fin(amount);
  if (n <= 0 || !prev.bitsOrigin) return prev;
  const left = fin(prev.bitsOrigin.paidLeft);
  const paidLeft = Math.min(Math.max(0, left - n), fin(prev.gamePoints));
  return paidLeft === left ? prev : { ...prev, bitsOrigin: { ...prev.bitsOrigin, paidLeft } };
}
