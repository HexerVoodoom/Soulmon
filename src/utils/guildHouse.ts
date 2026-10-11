/**
 * O ITEM NA CASA DA GUILDA — a regra do inventário (guilda-lancamento PR2).
 *
 * Cada pessoa pode pôr UM item do próprio inventário (`ownedFurniture`) no slot dela na casa. Enquanto
 * está lá, o item NÃO pode aparecer no cenário pessoal: sai de `ownedFurniture`, sai de `equippedDecor`
 * e passa a morar em `guildDonatedItem`. Sair do slot (ou da guilda) o devolve. O servidor é a fonte do
 * slot (`casa.mine.slot`); `applyGuildSlot` reconcilia o save a ele e é PURA e idempotente (a 2ª
 * chamada com o mesmo slot devolve a MESMA referência — footgun 6).
 */
import type { SlotId } from './petStage';

export interface GuildHouseSaveSlice {
  ownedFurniture?: string[];
  equippedDecor?: Partial<Record<SlotId, string>>;
  guildDonatedItem?: string | null;
}

export function applyGuildSlot<T extends GuildHouseSaveSlice>(s: T, slot: string | null): T & GuildHouseSaveSlice {
  const cur = s.guildDonatedItem ?? null;
  if (cur === slot) return s;
  let owned = [...(s.ownedFurniture ?? [])];
  // Devolve o que estava na casa (sem duplicar).
  if (cur && !owned.includes(cur)) owned.push(cur);
  let equipped = s.equippedDecor;
  if (slot) {
    owned = owned.filter(id => id !== slot);
    if (equipped && Object.values(equipped).includes(slot)) {
      equipped = Object.fromEntries(Object.entries(equipped).filter(([, v]) => v !== slot)) as typeof equipped;
    }
  }
  return { ...s, ownedFurniture: owned, equippedDecor: equipped, guildDonatedItem: slot };
}

/** Itens que a pessoa pode doar: o que ela tem e não está em uso no cenário pessoal. */
export function donatableItems(s: GuildHouseSaveSlice): string[] {
  const used = new Set(Object.values(s.equippedDecor ?? {}));
  return (s.ownedFurniture ?? []).filter(id => !used.has(id));
}
