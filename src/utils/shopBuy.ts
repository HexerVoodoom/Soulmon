import { isGuildReward, type ShopItem } from './shop';
import type { SlotId } from './petStage';
import { spendBitsPaidFirst, type BitsOrigin } from './bitsOrigin';

/**
 * A COMPRA na loja, aplicada sobre o `prev` — extraída do updater inline de
 * `handleShopBuy` no `App.tsx`.
 *
 * ⚠️ Família X-6, terceira varredura, instância 2. O defeito era de
 * PROCEDÊNCIA: a recusa por saldo e a recusa por item já possuído eram lidas
 * do `gameState` de FORA do `setGameState`, e o updater subtraía o preço
 * INCONDICIONALMENTE. Com saldo exatamente igual ao preço, dois cliques no
 * mesmo lote do React liam o mesmo `gameState` (saldo == preço, passa duas
 * vezes) e o segundo levava o saldo a NEGATIVO. Pior em `bg`/`furniture`: o
 * `id` entrava DUAS vezes em `ownedBackgrounds`/`ownedFurniture`, cobrando
 * dobrado por um cenário só — e a lista de posse é o que o guarda-roupa
 * desenha, então o item aparecia duplicado para sempre.
 *
 * Nada disso quebrava o TypeScript, que é por que a família sobreviveu a
 * fatias inteiras.
 *
 * Aqui a recusa é RECONFERIDA sobre o `prev`: a segunda passada já enxerga o
 * saldo que a primeira debitou e a posse que a primeira escreveu, e devolve o
 * `prev` intacto. A checagem de fora CONTINUA existindo no `App.tsx` — ela é o
 * que decide se o som de compra toca e se o botão devolve `true`, e efeito
 * colateral não entra em updater (roda 2× no StrictMode).
 *
 * ⚠️ NENHUM número mudou. Preço, moeda, quantidade de consumível (+1), equipar
 * na hora — tudo aritmeticamente idêntico ao que estava inline. O conserto
 * tira o DUPLO, não muda a economia.
 *
 * O que NÃO entra aqui: `isShopItemUnlocked`. O desbloqueio depende do
 * progresso de missões, que comprar não altera — não há janela de lote a
 * fechar, e trazer o progresso de missão para dentro do updater só alargaria a
 * fatia de estado que esta função precisa conhecer.
 */

export type ShopBuyRefusal = 'no-funds' | 'already-owned' | 'not-for-sale';

/** Fatia do GameState que uma compra lê e escreve. */
export interface ShopBuyState {
  gamePoints?: number;
  /** PR8: o gasto de Bits aqui NÃO é equipamento, então gasta o Bit pago (de Crédito) primeiro. */
  bitsOrigin?: BitsOrigin;
  emblems?: number;
  foodInventory: Record<string, number>;
  ownedBackgrounds?: string[];
  ownedFurniture?: string[];
  equippedBackground?: string | null;
  equippedDecor?: Partial<Record<SlotId, string>>;
}

/** O saldo NA MOEDA do item. Emblemas e Bits não se substituem (currencies.ts). */
export function shopBalanceFor(state: ShopBuyState, item: ShopItem): number {
  return item.currency === 'emblems' ? (state.emblems ?? 0) : (state.gamePoints ?? 0);
}

/**
 * A compra seria recusada? Separada de `applyShopBuy` pelo mesmo motivo de
 * `specialRefusal`: quem chama de fora precisa da resposta para não tocar o som
 * e para devolver `false` ao botão.
 */
export function shopBuyRefusal(state: ShopBuyState, item: ShopItem): ShopBuyRefusal | undefined {
  // Conquista da Guilda (`GUILD_ITEMS`, preço 0): só o resgate da Feira a concede — nunca a compra.
  if (isGuildReward(item)) return 'not-for-sale';
  if (shopBalanceFor(state, item) < item.price) return 'no-funds';
  if (item.kind === 'bg' && (state.ownedBackgrounds ?? []).includes(item.id)) return 'already-owned';
  if (item.kind === 'furniture' && (state.ownedFurniture ?? []).includes(item.id)) return 'already-owned';
  return undefined;
}

/** Uma compra aplicada ao `prev`. Recusa reconferida sobre o `prev`. */
export function applyShopBuy<T extends ShopBuyState>(
  prev: T,
  item: ShopItem,
): { state: T; refused?: ShopBuyRefusal } {
  const refused = shopBuyRefusal(prev, item);
  if (refused) return { state: prev, refused };

  const paysWithEmblems = item.currency === 'emblems';
  const next: T = paysWithEmblems
    ? { ...prev, emblems: (prev.emblems ?? 0) - item.price }
    : spendBitsPaidFirst({ ...prev, gamePoints: (prev.gamePoints ?? 0) - item.price }, item.price);

  if (item.kind === 'chip' || item.kind === 'heart') {
    // Consumível vai para a pastinha; o efeito é aplicado no USO
    // (specialItemUse.ts).
    next.foodInventory = {
      ...prev.foodInventory,
      [item.icon]: (prev.foodInventory[item.icon] ?? 0) + 1,
    };
  } else if (item.kind === 'bg') {
    next.ownedBackgrounds = [...(prev.ownedBackgrounds ?? []), item.id];
    next.equippedBackground = item.id; // equipa na hora
  } else if (item.kind === 'furniture') {
    next.ownedFurniture = [...(prev.ownedFurniture ?? []), item.id];
    // Equipa na hora, no espaço do palco que o item declara — o que estava ali
    // sai (um espaço, um item; ver utils/petStage.ts).
    if (item.slot) next.equippedDecor = { ...(prev.equippedDecor ?? {}), [item.slot]: item.id };
  }
  return { state: next };
}
