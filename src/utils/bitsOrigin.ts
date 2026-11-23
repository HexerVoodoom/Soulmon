/**
 * Combate v3 / PR8 — a PROCEDÊNCIA dos Bits (dono único).
 *
 * ⚠️ REGISTRO §373 (dono, 14/11/2026): a regra "Bit comprado com dinheiro real não compra equipamento" (§2.26) SAIU. O Bit que
 * veio de Créditos paga TUDO (Soulsmith, Hexsmith, Feira, ticket do Treino, doação do clã), igual ao Bit ganho. O que segura a
 * vantagem paga é o teto ÚNICO de 5% de bônus de combate (`COMBAT_BONUS_CAP`, `combate/bonus.ts`) e o teto de 1.000 Bits/dia da
 * troca, contado NO SERVIDOR (`functions/api/_bitsPacks.js`).
 *
 * O registro continua sendo ESCRITO (compatibilidade do save e telemetria: reverter a decisão não corrompe nada):
 *  · `paidLeft`: quanto do saldo veio de Créditos e ainda não foi gasto. Todo gasto consome o pago primeiro
 *    (`spendBitsPaidFirst`), e ele nunca fica acima do saldo. Não GATEIA mais nada.
 *  · `day` / `free` / `fromCredits`: Bits grátis e Bits de Crédito do DIA do jogador (só conta; o teto da troca é do servidor).
 *
 * Sem campo `bitsOrigin` (save antigo) nada muda: o saldo inteiro paga.
 *
 * Módulo PURO: sem React, sem relógio (o dia entra por parâmetro), sem localStorage.
 */

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

/** Os Bits que pagam qualquer gasto do jogo: o saldo inteiro (§373 — o Bit de Crédito também paga equipamento). */
export function spendableBits(state: BitsOriginState): number {
  return fin(state.gamePoints);
}

/** Registra Bits GRÁTIS ganhos agora (some ao ganho do dia). Devolve o MESMO objeto se não há o que somar. */
export function noteFreeBits<T extends BitsOriginState>(prev: T, amount: number, dayKey: string): T {
  const n = fin(amount);
  if (n <= 0) return prev;
  const o = normalizeOrigin(prev.bitsOrigin, dayKey);
  return { ...prev, bitsOrigin: { ...o, free: o.free + n } };
}

/**
 * Soma ao saldo os Bits de um pacote comprado com Créditos. Só chame com o `bits` que o SERVIDOR confirmou
 * (`buyBitsPack`): o débito dos Créditos e o teto de 1.000/dia são dele. Aqui só se registra a procedência (`fromCredits`,
 * `paidLeft`), sem teto de cliente. Devolve o MESMO objeto se não há o que somar.
 */
export function noteCreditBits<T extends BitsOriginState>(prev: T, bits: number, dayKey: string): T {
  const n = fin(bits);
  if (n <= 0) return prev;
  const o = normalizeOrigin(prev.bitsOrigin, dayKey);
  return {
    ...prev,
    gamePoints: fin(prev.gamePoints) + n,
    bitsOrigin: { ...o, fromCredits: o.fromCredits + n, paidLeft: o.paidLeft + n },
  };
}

/**
 * Todo gasto de Bits consome o Bit PAGO primeiro (só contabilidade desde §373: nada mais depende disto para liberar compra).
 * Chame DEPOIS de debitar `gamePoints` (o `paidLeft` nunca fica acima do saldo que sobrou).
 */
export function spendBitsPaidFirst<T extends BitsOriginState>(prev: T, amount: number): T {
  const n = fin(amount);
  if (n <= 0 || !prev.bitsOrigin) return prev;
  const left = fin(prev.bitsOrigin.paidLeft);
  const paidLeft = Math.min(Math.max(0, left - n), fin(prev.gamePoints));
  return paidLeft === left ? prev : { ...prev, bitsOrigin: { ...prev.bitsOrigin, paidLeft } };
}

/**
 * Debita `amount` de `gamePoints` SE o saldo cobre (senão devolve `prev`: nada muda), gastando o Bit pago primeiro. Usado onde o
 * servidor já decidiu o valor (doação ao clã: o `accepted`). Desde §373 o Bit de Crédito também doa.
 */
export function spendBitsIfCovered<T extends BitsOriginState>(prev: T, amount: number): T {
  const n = Math.floor(fin(amount));
  if (n <= 0 || fin(prev.gamePoints) < n) return prev;
  return spendBitsPaidFirst({ ...prev, gamePoints: fin(prev.gamePoints) - n }, n);
}
