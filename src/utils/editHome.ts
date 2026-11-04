import { ALL_SHOP_ITEMS, type ShopItem } from './shop';
import { PET_BACKGROUNDS } from './backgrounds';
import { SLOT_ORDER, decorFitsSetting, applyDecorEquip, type SlotId } from './petStage';

/**
 * EDITAR HOME (dono, 04/11/2026): a lógica pura do editor. O rascunho é um mapa de decoração
 * (`equippedDecor`) que só vira estado do jogo no Salvar — mesma forma e mesmo `applyDecorEquip`
 * da loja, nenhum campo novo no save.
 */
export type DecorMap = Partial<Record<SlotId, string>>;

/** Espaços que o cenário equipado oferece (vazio se não há cenário ou se ele não aceita decoração). */
export function editableSlots(backgroundId: string | null | undefined): SlotId[] {
  const bg = backgroundId ? PET_BACKGROUNDS[backgroundId] : null;
  if (!bg || bg.setting === 'void') return [];
  return SLOT_ORDER.filter(s => bg.slots.includes(s));
}

/** Peças que a pessoa TEM, que ocupam este espaço e que servem neste cenário. */
export function decorOptionsForSlot(
  slot: SlotId, backgroundId: string | null | undefined, ownedFurniture: readonly string[],
): ShopItem[] {
  const bg = backgroundId ? PET_BACKGROUNDS[backgroundId] : null;
  if (!bg || !editableSlots(backgroundId).includes(slot)) return [];
  return ALL_SHOP_ITEMS.filter(i =>
    i.kind === 'furniture' && i.slot === slot && ownedFurniture.includes(i.id)
    && decorFitsSetting(i.fits ?? 'any', bg.setting));
}

/** Quantas peças a pessoa tem que caberiam em algum espaço deste cenário (0 = estado vazio → loja). */
export function ownedFittingCount(backgroundId: string | null | undefined, ownedFurniture: readonly string[]): number {
  return editableSlots(backgroundId).reduce((n, s) => n + decorOptionsForSlot(s, backgroundId, ownedFurniture).length, 0);
}

/** Escolhe (ou, com `null`, esvazia) um espaço no rascunho, sem tocar no original. */
export function pickDecor(draft: DecorMap, slot: SlotId, itemId: string | null): DecorMap {
  return applyDecorEquip(draft, itemId, slot);
}

export function decorEqual(a: DecorMap, b: DecorMap): boolean {
  return SLOT_ORDER.every(s => (a[s] ?? null) === (b[s] ?? null));
}
