import { isSubscriptionReward, type ShopItem } from './shop';
import type { SlotId } from './petStage';

/**
 * O RESGATE de um item do trimestre da assinatura cosmética (D10).
 *
 * É a ÚNICA porta desses itens: não gasta Bit, Emblema nem Crédito, não toca em
 * cuidado, atributo ou tier. O item entra em `ownedBackgrounds`/`ownedFurniture`
 * e equipa na hora (como uma compra faria) — e a partir daí é POSSE do save:
 * nada neste arquivo remove item, e a assinatura acabar não retira o que foi
 * resgatado (teste: `subscriptionShop.test.ts`).
 *
 * Função pura sobre o `prev`, no molde de `applyShopBuy` — a recusa é reconferida
 * dentro do updater, então dois toques no mesmo lote não duplicam o item.
 * `active` é um booleano entregue por quem chama (a store `utils/subscription.ts`):
 * aqui não se lê vigência nenhuma.
 */

export type SubscriptionClaimRefusal = 'not-a-subscription-item' | 'locked' | 'already-owned';

/** Fatia do GameState que o resgate lê e escreve. */
export interface SubscriptionClaimState {
  ownedBackgrounds?: string[];
  ownedFurniture?: string[];
  equippedBackground?: string | null;
  equippedDecor?: Partial<Record<SlotId, string>>;
}

export function subscriptionClaimRefusal(
  state: SubscriptionClaimState,
  item: ShopItem,
  active: boolean,
): SubscriptionClaimRefusal | undefined {
  if (!isSubscriptionReward(item)) return 'not-a-subscription-item';
  if (item.kind === 'bg' && (state.ownedBackgrounds ?? []).includes(item.id)) return 'already-owned';
  if (item.kind === 'furniture' && (state.ownedFurniture ?? []).includes(item.id)) return 'already-owned';
  if (!active) return 'locked';
  return undefined;
}

export function applySubscriptionClaim<T extends SubscriptionClaimState>(
  prev: T,
  item: ShopItem,
  active: boolean,
): { state: T; refused?: SubscriptionClaimRefusal } {
  const refused = subscriptionClaimRefusal(prev, item, active);
  if (refused) return { state: prev, refused };

  if (item.kind === 'bg') {
    return { state: { ...prev, ownedBackgrounds: [...(prev.ownedBackgrounds ?? []), item.id], equippedBackground: item.id } };
  }
  if (item.kind === 'furniture') {
    return {
      state: {
        ...prev,
        ownedFurniture: [...(prev.ownedFurniture ?? []), item.id],
        ...(item.slot ? { equippedDecor: { ...(prev.equippedDecor ?? {}), [item.slot]: item.id } } : {}),
      },
    };
  }
  return { state: prev, refused: 'not-a-subscription-item' };
}
