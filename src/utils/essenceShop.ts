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

/**
 * 24/11/2026 (dono): preço em R$ equivalentes. Taxa real do pacote padrão: R$ 9,90 ÷ 150 Créditos = R$ 0,066 por Crédito.
 * Alvo: 100 essências BASE = R$ 50 (R$ 0,50 cada), 50 de 2 elementos = R$ 100 (R$ 2,00), 50 TRIPLAS = R$ 200 (R$ 4,00).
 * Critério: o PACOTE DE 5 é o preço-base, 5 × R$ ÷ 0,066 arredondado ao Crédito inteiro mais próximo (37,9 → 38; 151,5 → 151; 303,0 → 303);
 * o unitário avulso é R$ ÷ 0,066 arredondado ao inteiro mais próximo (7,58 → 8; 30,30 → 30; 60,61 → 61). Lotes do dono: 100 base = 20 × 38 = 760
 * (≈ 757,6); 50 duplas = 10 × 151 = 1.510 (≈ 1.515); 50 triplas = 10 × 303 = 3.030 (≈ 3.030). Espelho: `functions/api/_essenceShop.js`.
 */
const UNIT_BY_BASES: Record<number, number> = { 1: 8, 2: 30, 3: 61 };
const PACK5_BY_BASES: Record<number, number> = { 1: 38, 2: 151, 3: 303 };

export function essenceUnitPrice(id: string): number {
  const n = elementComposition(id)?.length ?? 0;
  return n <= 0 ? 0 : UNIT_BY_BASES[Math.min(3, n)];
}

/**
 * Preço total de N essências (inteiro de 1 até o teto de estoque); 0 = inválido. Cada grupo completo de 5 paga o preço do PACOTE
 * (38 / 151 / 303 Créditos), o resto paga o unitário (8 / 30 / 61); 24/11/2026, em R$ equivalentes (ver acima).
 */
export function essencePackPrice(id: string, qty: number): number {
  const unit = essenceUnitPrice(id);
  if (!unit || !Number.isSafeInteger(qty) || qty < 1 || qty > ESSENCE_STOCK_CAP) return 0;
  const packs = Math.floor(qty / 5);
  return packs * PACK5_BY_BASES[Math.min(3, elementComposition(id)?.length ?? 0)] + (qty - packs * 5) * unit;
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
