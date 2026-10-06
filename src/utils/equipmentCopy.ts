/**
 * Combate v3 / PR8b — os TEXTOS do equipamento (EN e PT-BR), separados de `equipment.ts` porque só a `EquipmentCard` (`lazy`) os lê
 * e o orçamento de bytes pesa no chunk de entrada. Vocabulário da NARRATIVA: "Vínculo" e "Lv", nunca "nível" para a criatura; sem cobrança,
 * sem contagem que apressa (`copy.semFomo`), sem palavra de sorte.
 */
import type { EquipSlot, EquipAttr, EquipRefusal } from './equipment';

export interface EquipCopy { readonly pt: string; readonly en: string }

export const SLOT_COPY: Readonly<Record<EquipSlot, EquipCopy & { readonly attrPt: string; readonly attrEn: string }>> = {
  nucleo: { pt: 'Núcleo', en: 'Core', attrPt: 'ataque', attrEn: 'attack' },
  carapaca: { pt: 'Carapaça', en: 'Carapace', attrPt: 'defesa', attrEn: 'defense' },
  rastro: { pt: 'Rastro', en: 'Trail', attrPt: 'ritmo', attrEn: 'rhythm' },
};

export const ATTR_COPY: Readonly<Record<EquipAttr, EquipCopy>> = {
  atk: { pt: 'ataque', en: 'attack' },
  def: { pt: 'defesa', en: 'defense' },
  spd: { pt: 'ritmo', en: 'rhythm' },
};

const TIER_PT = { nucleo: ['de cobre', 'polido', 'ornado'], carapaca: ['de cobre', 'polida', 'ornada'], rastro: ['de cobre', 'polido', 'ornado'] } as const;
const TIER_EN = ['Copper', 'Polished', 'Ornate'] as const;

/** Nome do item: lapidação crescente, nunca raridade nem sorte. */
export function itemName(slot: EquipSlot, tier: 1 | 2 | 3, isPt: boolean): string {
  return isPt ? `${SLOT_COPY[slot].pt} ${TIER_PT[slot][tier - 1]}` : `${TIER_EN[tier - 1]} ${SLOT_COPY[slot].en}`;
}

/** O motivo da recusa, neutro (sem culpa, sem pressa). */
export function refusalText(r: EquipRefusal, isPt: boolean): string {
  switch (r) {
    case 'no-funds': return isPt ? 'Ainda faltam Bits. Eles chegam jogando, sem pressa.' : 'Not enough Bits yet. They come from playing, no rush.';
    case 'not-earned': return isPt
      ? 'Equipamento só se compra com Bits que você ganhou jogando. Os Bits vindos de Créditos servem para outras coisas.'
      : 'Equipment is only bought with Bits you earned by playing. Bits that came from Credits are for other things.';
    case 'no-fragments': return isPt ? 'Ainda faltam fragmentos. Eles vêm das runs completas da Masmorra.' : 'Not enough fragments yet. They come from completed Dungeon runs.';
    case 'already-owned': return isPt ? 'Você já tem este.' : 'You already have this one.';
    default: return isPt ? 'Este item não está à venda.' : 'This item is not for sale.';
  }
}
