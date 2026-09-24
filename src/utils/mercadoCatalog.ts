/**
 * A VITRINE DO MERCADO E DA ARENA (minimal-ui F5) — quem decide o que aparece
 * em cada lojinha e em cada aba de moeda.
 *
 * Não é catálogo novo: os itens, preços e moedas continuam sendo de
 * `utils/shop.ts` (`SHOP_ITEMS`/`TOURNAMENT_ITEMS`), e a regra de compra
 * continua sendo do `handleShopBuy` do `App.tsx` + `utils/shopBuy.ts`. Aqui só
 * se REPARTE a vitrine que a `ShopModal` mostrava numa lista só pelas quatro
 * lojinhas do Mercado (Itens, Decoração, Background, Conquistas) e pela loja
 * do Torneio, na Arena.
 *
 * Três regras de produto passam por aqui, e cada uma tem teste
 * (`mercadoCatalog.test.ts`):
 *  · **as moedas não se misturam** — cada aba lista SÓ itens cobrados na moeda
 *    dela (`utils/currencies.ts`);
 *  · **a aba de Emblemas só vende cosmético** (`bg`/`furniture`) — Emblemas
 *    vivem no save do cliente, farmáveis, e só é aceitável enquanto não
 *    comprarem vantagem (CLAUDE.md, 🎖️);
 *  · **o 🌀 da masmorra nunca à venda, Coraçãozinho fora da vitrine** — os dois só
 *    vêm da masmorra (⚰️ 06/09/2026, D7+D15). O filtro é defensivo: se alguém
 *    devolver um deles ao catálogo, a vitrine continua sem eles e o teste
 *    acusa o catálogo.
 */
import { SHOP_ITEMS, TOURNAMENT_ITEMS, GLITCHTAMA_EMOJI, HEART_ITEM_EMOJI, type ShopItem } from './shop';
import type { CurrencyId } from './currencies';

/** As três lojinhas de COMPRA do Mercado (Conquistas é a quarta, e filtra por
 *  categoria — ver `MISSION_CATEGORIES` em `utils/missions.ts`). */
export type MercadoStall = 'itens' | 'decoracao' | 'background';

export const MERCADO_STALLS: readonly MercadoStall[] = ['itens', 'decoracao', 'background'];

/**
 * Abas de moeda de cada lojinha, na ordem em que aparecem. Só entra a moeda
 * que de fato compra alguma coisa ali ("conforme o item pertence"): uma aba
 * que abre sempre vazia é uma promessa que a loja não cumpre.
 *  · Itens: Bits (chips) + Créditos (a troca Créditos → Bits, a única coisa
 *    que Créditos fazem nesta tela). Emblemas NÃO: não há consumível de
 *    Emblemas, e não pode haver (só cosmético).
 *  · Decoração e Background: Bits + Emblemas (os prêmios do Torneio).
 */
export const STALL_CURRENCIES: Record<MercadoStall, readonly CurrencyId[]> = {
  itens: ['bits', 'credits'],
  decoracao: ['bits', 'emblems'],
  background: ['bits', 'emblems'],
};

/** Moeda que cobra o item (sem `currency` = Bits, o padrão de `shop.ts`). */
export function itemCurrency(item: ShopItem): CurrencyId {
  return item.currency === 'emblems' ? 'emblems' : 'bits';
}

/** O que NUNCA vai para a vitrine, venha de onde vier. */
export function isNeverForSale(item: ShopItem): boolean {
  return item.kind === 'heart'
    || item.icon === HEART_ITEM_EMOJI
    || item.icon === GLITCHTAMA_EMOJI;
}

/** Emblemas compram só cosmético. */
export function isCosmetic(item: ShopItem): boolean {
  return item.kind === 'bg' || item.kind === 'furniture';
}

const KINDS: Record<MercadoStall, ShopItem['kind'][]> = {
  itens: ['chip'],
  decoracao: ['furniture'],
  background: ['bg'],
};

/**
 * Os itens de uma lojinha numa moeda. A aba de Créditos não tem item (é a
 * troca) e devolve lista vazia; quem desenha a troca é a tela.
 */
export function stallItems(stall: MercadoStall, currency: CurrencyId): ShopItem[] {
  if (currency === 'credits') return [];
  const source = currency === 'emblems' ? TOURNAMENT_ITEMS : SHOP_ITEMS;
  return source.filter(i =>
    KINDS[stall].includes(i.kind)
    && itemCurrency(i) === currency
    && !isNeverForSale(i)
    && (currency !== 'emblems' || isCosmetic(i)));
}

/** A loja de Emblemas do Torneio (Arena): os prêmios, só cosmético. */
export function tournamentShopItems(): ShopItem[] {
  return TOURNAMENT_ITEMS.filter(i => itemCurrency(i) === 'emblems' && isCosmetic(i) && !isNeverForSale(i));
}
