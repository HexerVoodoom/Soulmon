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
