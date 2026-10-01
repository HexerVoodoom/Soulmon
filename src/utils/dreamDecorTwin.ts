/**
 * O SONHO DÁ O ITEM (F2, navegação do dono 01/10/2026).
 *
 * O dono leu o sonho "Esparramado no sofá" como "ganhei um sofá" e pediu um
 * botão "Equipar" ao lado do "Bom dia!". Um SONHO é uma cena do Dex
 * (`utils/restWindow.ts`), sem espaço no palco; o que existe de equipável é a
 * DECORAÇÃO da loja — e algumas cenas têm um gêmeo óbvio nela.
 *
 * Decisão do dono (01/10/2026, `docs/REGISTRO-DE-DECISOES.md`, economia e
 * decoração): quando a cena da manhã tem gêmeo, o jogador GANHA a decoração —
 * ela entra em `ownedFurniture` no mesmo updater que guarda o sonho — e o
 * "Equipar" aparece SEMPRE nesse caso, equipando na hora. A alternativa que
 * perdeu era a primeira versão deste arquivo: "só equipar se já tiver".
 *
 * Idempotente: sonhar de novo com o sofá não duplica o sofá (a lista é de
 * posse, não de quantidade). Funções PURAS: sem React, sem save; quem grava e
 * quem equipa é o App.
 */
import type { SlotId } from './petStage';
import { ALL_SHOP_ITEMS, type ShopItem } from './shop';

/** Cena do Dex → decoração da loja que é a mesma coisa. Só pares óbvios. */
export const DREAM_DECOR_TWIN: Readonly<Record<string, string>> = {
  'dream-old-couch': 'furn-sofa',
  'dream-campfire': 'furn-campfire',
  'dream-quiet-library': 'furn-books',
  'dream-rainy-window': 'furn-window',
  'dream-lantern-river': 'furn-lantern',
  'dream-mossy-stone': 'furn-rock',
};

export interface DreamTwin {
  decorId: string;
  slot: SlotId;
  item: ShopItem;
}

/**
 * A decoração gêmea da cena — ou `null` quando não há sonho, quando a cena não
 * tem gêmeo, ou quando o gêmeo não está na loja como decoração com espaço.
 */
export function dreamTwin(dreamId: string | null | undefined): DreamTwin | null {
  if (!dreamId) return null;
  const decorId = DREAM_DECOR_TWIN[dreamId];
  if (!decorId) return null;
  const item = ALL_SHOP_ITEMS.find(i => i.id === decorId);
  if (!item || item.kind !== 'furniture' || !item.slot) return null;
  return { decorId, slot: item.slot, item };
}

/**
 * A posse depois do sonho: a lista com o gêmeo, se a cena tiver um. Devolve a
 * MESMA referência quando não há nada a dar ou o jogador já o possui — o
 * updater do App pode comparar por identidade e não regravar à toa.
 */
export function grantDreamTwin(
  ownedFurniture: string[] | undefined,
  dreamId: string | null | undefined,
): string[] | undefined {
  const twin = dreamTwin(dreamId);
  if (!twin) return ownedFurniture;
  const owned: readonly string[] = ownedFurniture ?? [];
  if (owned.includes(twin.decorId)) return ownedFurniture;
  return [...owned, twin.decorId];
}
