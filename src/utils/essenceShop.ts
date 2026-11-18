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

/** Teto de essências por COMPRA (§479); espelho de `ESSENCE_MAX_PER_BUY` do servidor. */
export const ESSENCE_MAX_PER_BUY = 100;

/**
 * Preço total de N essências (1..ESSENCE_MAX_PER_BUY); 0 = inválido. Cada grupo completo de 5 sai com 10% off
 * (arredondado para baixo), o resto paga o unitário. N=1 e N=5 dão os preços de sempre (§205).
 */
export function essencePackPrice(id: string, qty: number): number {
  const unit = essenceUnitPrice(id);
  if (!unit || !Number.isInteger(qty) || qty < 1 || qty > ESSENCE_MAX_PER_BUY) return 0;
  const packs = Math.floor(qty / 5);
  return packs * Math.floor(5 * unit * 0.9) + (qty - packs * 5) * unit;
}

export type EssenceBuyLimit = 'ok' | 'cap' | 'credits';

/**
 * Quantas essências a pessoa pode comprar AGORA: min(teto por compra, teto de estoque − posse, o que o saldo paga).
 * `reason` só vale quando `max` = 0 (estoque cheio / Créditos insuficientes). O servidor reconfere tudo.
 */
export function essenceMaxBuy(id: string, credits: number, owned: number, cap: number): { max: number; reason: EssenceBuyLimit } {
  const room = Math.max(0, cap - Math.max(0, owned));
  if (room <= 0) return { max: 0, reason: 'cap' };
  const limit = Math.min(ESSENCE_MAX_PER_BUY, room);
  let max = 0;
  for (let n = 1; n <= limit; n++) { if (essencePackPrice(id, n) > credits) break; max = n; }
  return max === 0 ? { max: 0, reason: 'credits' } : { max, reason: 'ok' };
}
