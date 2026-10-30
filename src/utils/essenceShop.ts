/**
 * CAMBISTA — preço das essências em Créditos (30/10/2026, REGISTRO §205). Só EXIBE: quem cobra é o servidor
 * (`functions/api/_essenceShop.js`, espelho com paridade em `essenceShop.parity.test.js`).
 * Base = 1, par = 2, 3+ bases = 3; pacote de 5 = 10% off arredondado para baixo (4 / 9 / 13).
 */
import { elementComposition } from './elementPotion';

export const ESSENCE_PACK_SIZES = [1, 5] as const;
export type EssencePackSize = (typeof ESSENCE_PACK_SIZES)[number];

export function essenceUnitPrice(id: string): number {
  const n = elementComposition(id)?.length ?? 0;
  return n <= 0 ? 0 : Math.min(3, n);
}

export function essencePackPrice(id: string, qty: number): number {
  const unit = essenceUnitPrice(id);
  if (!unit || !(ESSENCE_PACK_SIZES as readonly number[]).includes(qty)) return 0;
  return qty === 1 ? unit : Math.floor(qty * unit * 0.9);
}
