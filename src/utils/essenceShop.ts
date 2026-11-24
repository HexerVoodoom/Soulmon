/**
 * CAMBISTA — preço das essências em Créditos (30/10/2026, REGISTRO §205). Só EXIBE: quem cobra é o servidor
 * (`functions/api/_essenceShop.js`, espelho com paridade em `essenceShop.parity.test.js`).
 * Base = 1, par = 2, 3+ bases = 3; pacote de 5 = 10% off arredondado para baixo (4 / 9 / 13).
 */
import { elementComposition } from './elementPotion';

export const ESSENCE_PACK_SIZES = [1, 5] as const;
export type EssencePackSize = (typeof ESSENCE_PACK_SIZES)[number];

/** Teto de estoque por elemento (espelho de `ESSENCE_MAX_PER_ELEMENT`; também o maior N aceito numa compra). */
const ESSENCE_STOCK_CAP = 1_000_000;

/** 24/11/2026 (dono): TODAS as essências custam 3× o que custavam (3 / 6 / 9 Créditos). Espelho: `functions/api/_essenceShop.js`. */
export const ESSENCE_PRICE_FACTOR = 3;

export function essenceUnitPrice(id: string): number {
  const n = elementComposition(id)?.length ?? 0;
  return n <= 0 ? 0 : Math.min(3, n) * ESSENCE_PRICE_FACTOR;
}

/**
 * Preço total de N essências (inteiro de 1 até o teto de estoque); 0 = inválido. Cada grupo completo de 5 sai com 10% off
 * (arredondado para baixo), o resto paga o unitário. N=1 e N=5 dão os preços de sempre (§205).
 */
export function essencePackPrice(id: string, qty: number): number {
  const unit = essenceUnitPrice(id);
  if (!unit || !Number.isSafeInteger(qty) || qty < 1 || qty > ESSENCE_STOCK_CAP) return 0;
  const packs = Math.floor(qty / 5);
  return packs * Math.floor(5 * unit * 0.9) + (qty - packs * 5) * unit;
}

export type EssenceBuyLimit = 'ok' | 'cap' | 'credits';

/**
 * Quantas essências a pessoa pode comprar AGORA: min(teto de estoque − posse, o que o saldo paga); sem limite por compra.
 * `reason` só vale quando `max` = 0 (estoque cheio / Créditos insuficientes). O servidor reconfere tudo.
 */
export function essenceMaxBuy(id: string, credits: number, owned: number, cap: number): { max: number; reason: EssenceBuyLimit } {
  const room = Math.max(0, cap - Math.max(0, owned));
  if (room <= 0) return { max: 0, reason: 'cap' };
  // O preço é monótono em N: busca binária pelo maior N que o saldo paga (sem laço de 1.000.000 passos).
  let lo = 0, hi = room;
  while (lo < hi) { const mid = Math.ceil((lo + hi) / 2); if (essencePackPrice(id, mid) <= credits) lo = mid; else hi = mid - 1; }
  const max = lo;
  return max === 0 ? { max: 0, reason: 'credits' } : { max, reason: 'ok' };
}
