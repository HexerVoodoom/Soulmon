/**
 * O "EQUIPAR" DO PRÊMIO DA MANHÃ (F2, navegação do dono 01/10/2026).
 *
 * O dono leu o sonho "Esparramado no sofá" como "ganhei um sofá" e pediu um
 * botão "Equipar" ao lado do "Bom dia!". Um SONHO não é item: é uma cena do
 * Dex (`utils/restWindow.ts`), sem espaço no palco. O que existe de equipável
 * é a DECORAÇÃO da loja — e algumas cenas têm um gêmeo óbvio nela.
 *
 * Decisão conservadora (dar o item de graça é economia, e economia é do
 * dono): o botão só existe quando o sonho tem gêmeo E o jogador JÁ POSSUI esse
 * gêmeo. Aí "Equipar" põe a peça no espaço dela — nada é criado, nada é
 * vendido. Função PURA: sem React, sem save; quem equipa é o App.
 */
import type { SlotId } from './petStage';
import { ALL_SHOP_ITEMS } from './shop';

/** Cena do Dex → decoração da loja que é a mesma coisa. Só pares óbvios. */
export const DREAM_DECOR_TWIN: Readonly<Record<string, string>> = {
  'dream-old-couch': 'furn-sofa',
  'dream-campfire': 'furn-campfire',
  'dream-quiet-library': 'furn-books',
  'dream-rainy-window': 'furn-window',
  'dream-lantern-river': 'furn-lantern',
  'dream-mossy-stone': 'furn-rock',
};

export interface EquipTwin {
  decorId: string;
  slot: SlotId;
}

/**
 * O que o "Equipar" do sonho equiparia — ou `null` (sem botão). `null` quando
 * não há sonho, quando a cena não tem gêmeo, quando o gêmeo não está na loja
 * com espaço declarado, ou quando o jogador ainda não o possui.
 */
export function equippableTwin(
  dreamId: string | null | undefined,
  ownedFurniture: readonly string[] | null | undefined,
): EquipTwin | null {
  if (!dreamId) return null;
  const decorId = DREAM_DECOR_TWIN[dreamId];
  if (!decorId) return null;
  if (!(ownedFurniture ?? []).includes(decorId)) return null;
  const item = ALL_SHOP_ITEMS.find(i => i.id === decorId);
  if (!item || item.kind !== 'furniture' || !item.slot) return null;
  return { decorId, slot: item.slot };
}
