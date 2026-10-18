/**
 * O CRÉDITO DOS PRÉDIOS DO CLÃ NO SAVE — presente da Praça, fruto do Plantio, recompensa do Mistério.
 *
 * O servidor sorteia e devolve `{ recompensa, receipt }`; quem escreve no save é ESTA função, PURA e
 * idempotente por `receipt`: o recibo aplicado vai para `claReceipts` (os últimos `CLA_RECEIPTS_MAX`), e uma
 * 2ª chamada com o mesmo recibo devolve a MESMA referência (footgun 6 — roda dentro de updater, 2× em StrictMode;
 * e o KV é eventualmente consistente, então o mesmo recibo pode chegar de dois aparelhos).
 *
 * O que cada tipo vira (decisão do ditado, sem vantagem paga):
 *  · bits  -> moeda (`gamePoints`, contada como Bit GRÁTIS em `bitsOrigin`);
 *  · decor -> inventário de decoração (`ownedFurniture`, sem duplicar o que já existe ou está na casa);
 *  · chip  -> pastinha de itens (`foodInventory`) com o emoji do chip (`CHIP_EMOJI`);
 *  · food  -> UMA comida comum (a da categoria `Study`, 🍎), que não conta no limite de comida por hora.
 */
import { CHIP_EMOJI, type Attr } from './shop';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { noteFreeBits, type BitsOriginState } from './bitsOrigin';
import { migrarEspecie } from './plantSpecies';
import type { ClaReward } from './claApi';

export const CLA_RECEIPTS_MAX = 50;

/** O pedaço do save que o crédito toca. */
export interface ClaSaveSlice extends BitsOriginState {
  foodInventory: Record<string, number>;
  ownedFurniture?: string[];
  guildDonatedItem?: string | null;
  claReceipts?: string[];
}

/** O fruto de cada espécie vira UMA decoração já existente na loja (cosmético, sem duplicar). Peça única de troca. */
export const FRUTO_DECOR: Record<string, string> = {
  cerejeira: 'furn-plant',
  cacto: 'furn-food-bowl',
  abobora: 'furn-lantern',
  pinheiro: 'furn-campfire',
};

const CHIP_ATTR: Record<string, Attr> = { 'chip-power': 'power', 'chip-harmony': 'harmony', 'chip-benevolence': 'benevolence' };

/** Higieniza a lista de recibos vinda do save (dado não confiável). */
export function sanitizeClaReceipts(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((r): r is string => typeof r === 'string' && r.length > 0 && r.length <= 120).slice(-CLA_RECEIPTS_MAX);
}

const FOOD_EMOJI = FOOD_BY_CATEGORY.Study.emoji;

function creditOne<T extends ClaSaveSlice>(s: T, r: ClaReward, dayKey: string): T {
  switch (r.kind) {
    case 'bits': {
      const n = Math.max(0, Math.floor(r.amount));
      return n > 0 ? noteFreeBits({ ...s, gamePoints: (s.gamePoints ?? 0) + n }, n, dayKey) : s;
    }
    case 'decor': {
      const owned = s.ownedFurniture ?? [];
      if (owned.includes(r.id) || s.guildDonatedItem === r.id) return s;
      return { ...s, ownedFurniture: [...owned, r.id] };
    }
    case 'chip': {
      const emoji = CHIP_EMOJI[CHIP_ATTR[r.id]];
      return emoji ? { ...s, foodInventory: { ...s.foodInventory, [emoji]: (s.foodInventory[emoji] ?? 0) + 1 } } : s;
    }
    case 'food':
      return { ...s, foodInventory: { ...s.foodInventory, [FOOD_EMOJI]: (s.foodInventory[FOOD_EMOJI] ?? 0) + 1 } };
  }
}

/**
 * Credita `rewards` UMA vez por `receipt`. Recibo já aplicado (ou vazio) devolve o MESMO objeto.
 * Vários prêmios sob um recibo só (o fruto: Bits + decoração) entram ou não entram juntos.
 */
export function applyClaRewards<T extends ClaSaveSlice>(prev: T, receipt: string, rewards: ClaReward[], dayKey: string): T {
  if (!receipt || prev.claReceipts?.includes(receipt)) return prev;
  let next: T = prev;
  for (const r of rewards) next = creditOne(next, r, dayKey);
  const receipts = [...(prev.claReceipts ?? []), receipt].slice(-CLA_RECEIPTS_MAX);
  return { ...next, claReceipts: receipts };
}

/** Os prêmios de um fruto colhido: os Bits do servidor e a decoração da espécie. */
export function fruitRewards(fruitId: string, bits: number): ClaReward[] {
  // Fruto antigo (`fruto-girassol-t1`, guardado no servidor) cai na espécie nova da mesma estação.
  const especie = String(migrarEspecie(/^fruto-([a-z]+)-t\d+$/.exec(fruitId)?.[1] ?? ''));
  const decor = FRUTO_DECOR[especie];
  return [{ kind: 'bits', amount: bits }, ...(decor ? [{ kind: 'decor', id: decor } as ClaReward] : [])];
}
