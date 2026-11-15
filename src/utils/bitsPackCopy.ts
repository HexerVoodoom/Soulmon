/**
 * Textos derivados dos PACOTES DE BITS (§373): a etiqueta de desconto e a ESTIMATIVA em reais. Tudo sai das constantes
 * (`BITS_PACKS` em `currencies.ts`, `CREDIT_PACKS` em `monetization.ts`), nunca de número escrito à mão.
 *
 * A estimativa em R$ é só "cerca de": usa o Crédito mais barato (o maior pacote da loja de Créditos), e o preço que vale é o da
 * Play (pode vir localizado em outra moeda). Por isso ela só aparece em pt-BR e sempre com "cerca de".
 */
import { BITS_PACKS, bitsPackDiscountPct, type BitsPack } from './currencies';
import { CREDIT_PACKS } from './monetization';

/** "R$ 19,90" → 19.9 (rótulo que não é R$ = NaN, e a estimativa some). */
function brl(label: string): number {
  const m = /^R\$\s*(\d+)(?:,(\d{1,2}))?$/.exec(label.trim());
  return m ? Number(`${m[1]}.${m[2] ?? '0'}`) : NaN;
}

/** O menor preço por Crédito entre os pacotes da loja (R$ por Crédito). */
function cheapestCreditBrl(): number {
  const per = CREDIT_PACKS.map(p => brl(p.priceLabel) / p.credits).filter(n => Number.isFinite(n) && n > 0);
  return per.length ? Math.min(...per) : NaN;
}

/** "cerca de R$ 9,95" (pt-BR) ou `null` quando não há estimativa honesta. */
export function bitsPackBrlEstimate(pack: Pick<BitsPack, 'credits'>): string | null {
  const v = pack.credits * cheapestCreditBrl();
  if (!Number.isFinite(v) || v <= 0) return null;
  return `cerca de R$ ${v.toFixed(2).replace('.', ',')}`;
}

/** "~8% off" (a mesma etiqueta em PT e EN, como no pedido do dono), ou `null` para o pacote sem desconto. */
export function bitsPackDiscountLabel(pack: Pick<BitsPack, 'bits' | 'credits'>): string | null {
  const pct = bitsPackDiscountPct(pack);
  return pct > 0 ? `~${pct}% off` : null;
}

/** Nome de loja de cada pacote (tom de vitrine, sem pressa nem escassez). */
export function bitsPackName(pack: Pick<BitsPack, 'id'>, isPt: boolean): string {
  const i = BITS_PACKS.findIndex(p => p.id === pack.id);
  const pt = ['Bolsinha', 'Bolsa', 'Baú'];
  const en = ['Pouch', 'Purse', 'Chest'];
  return (isPt ? pt : en)[i] ?? (isPt ? 'Pacote' : 'Pack');
}

// ── A tela dos pacotes (§386, decisões do dono 14/11/2026) ──────────────────────────────────────────────────────────────────
// A estimativa em dinheiro segue só em pt-BR: o código não tem preço de Crédito em USD (o único `US$` é o do desbloqueio
// completo), e derivar um câmbio dele seria inventar preço. Em inglês a célula fica sem estimativa.

/** O resultado de uma troca, como a tela o lê. `false` = recusa já mostrada por quem chamou (ex.: demo): a tela não fala de novo. */
export type BitsExchangeOutcome = { ok: true; bits: number } | { ok: false; reason: string; leftToday?: number };

/** Por que o pacote está desabilitado, dito DENTRO da célula. `null` = disponível. */
export function bitsPackBlockedLabel(pack: Pick<BitsPack, 'bits' | 'credits'>, credits: number, leftToday: number, isPt: boolean): string | null {
  if (pack.bits > leftToday) return isPt ? 'Volta amanhã' : 'Back tomorrow';
  const falta = pack.credits - Math.max(0, Math.floor(credits));
  if (falta > 0) return isPt ? `Faltam ${falta} Créditos` : `${falta} Credits short`;
  return null;
}

/** Recusas em que o servidor DECIDIU e nada foi cobrado. Todo o resto (rede, 5xx, `busy`, resposta ilegível) é "não deu para confirmar". */
const RECUSA_DEFINITIVA = new Set(['daily-cap', 'insufficient', 'unknown-pack', 'bad-op', 'no-save', 'refused']);

/** A ÚNICA mensagem de uma troca que não entregou Bits. */
export function bitsExchangeFailText(reason: string, isPt: boolean): string {
  if (!RECUSA_DEFINITIVA.has(reason)) {
    return isPt ? 'Não deu para confirmar. Toque no MESMO pacote: não cobra duas vezes.' : "Couldn't confirm. Tap the SAME pack again: it never charges twice.";
  }
  if (reason === 'daily-cap') {
    return isPt ? 'O limite de hoje foi atingido; seus Créditos não foram gastos. Volta amanhã.' : "Today's limit is reached; your Credits were not spent. Back tomorrow.";
  }
  if (reason === 'insufficient') {
    return isPt ? 'Créditos insuficientes; seus Créditos não foram gastos.' : 'Not enough Credits; your Credits were not spent.';
  }
  return isPt ? 'A troca não foi feita; seus Créditos não foram gastos.' : 'The swap did not go through; your Credits were not spent.';
}
