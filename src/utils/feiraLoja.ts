/**
 * A FEIRA DE VERDADE, lado do CLIENTE (pedido do dono, 10/11/2026; servidor em `functions/api/_feiraLoja.js`).
 *
 * Na volta da Missão, com uma chance rara, o Soulmon encontra uma feira: um vendedor com 4 a 6 itens do Mercado (e, raramente,
 * da Hexsmith), 10% a 50% mais baratos, só em Bits e sem ingredientes. O SERVIDOR decide tudo (se há feira, o vendedor, os itens,
 * o desconto de cada um, o limite de 1 por item); o cliente só mostra e debita o preço que a oferta traz.
 *
 * Puro: tipos, sanitizador (dado do servidor nunca é confiável), a compra local e o "já mostrei". Nada de React nem de rede.
 */
import { ALL_SHOP_ITEMS, type ShopItem } from './shop';
import { applyShopBuy, type ShopBuyState } from './shopBuy';
import { spendBits } from './equipment';
import { parseHexItem, sanitizeHexsmith, type HexsmithState } from './hexsmith';

/** Os vendedores que o servidor sorteia HOJE (espelho de `FEIRA_LOJA_VENDEDORES` ativos). Reuso de arte: nada novo; Vesca e Tessaria ficam de fora. */
export const FEIRA_LOJA_VENDORS = ['mercado', 'colheita', 'aranha', 'hexsmith'] as const;
export type FeiraLojaVendor = (typeof FEIRA_LOJA_VENDORS)[number];
export const FEIRA_LOJA_VENDOR_NAMES: Record<FeiraLojaVendor, { pt: string; en: string; linePt: string; lineEn: string }> = {
  mercado: { pt: 'Vendedora de itens', en: 'Item seller', linePt: 'Trouxe tônicos da feira, bem em conta.', lineEn: 'I brought tonics from the fair, nicely priced.' },
  colheita: { pt: 'Vendedora de cenários', en: 'Scenery seller', linePt: 'Cada cenário aqui já viu muita estrada.', lineEn: 'Every scene here has seen plenty of road.' },
  aranha: { pt: 'Fiandeira', en: 'Weaver', linePt: 'Peças feitas à mão para a sua casinha.', lineEn: 'Handmade pieces for your little home.' },
  hexsmith: { pt: 'Ferreira da Hexsmith', en: 'Hexsmith smith', linePt: 'Sem ingredientes hoje, só Bits.', lineEn: 'No ingredients today, just Bits.' },
};

export type FeiraLojaKind = 'chip' | 'furniture' | 'bg' | 'hex';

export interface FeiraLojaItem {
  id: string;
  /** `shop` = item do Mercado (o cliente debita); `hex` = Hexsmith (o servidor cobra e entrega). */
  type: 'shop' | 'hex';
  kind: FeiraLojaKind;
  /** Preço FINAL, inteiro, em Bits (já com o desconto). */
  price: number;
  /** Preço cheio. */
  was: number;
  /** Desconto, 10..50. */
  pct: number;
  bought: boolean;
}

export interface FeiraLoja {
  /** O dia do jogador a que a oferta pertence (ela some quando o dia vira). */
  day: string;
  vendor: FeiraLojaVendor;
  items: FeiraLojaItem[];
}

const ISO_DIA = /^\d{4}-\d{2}-\d{2}$/;
const KINDS: readonly FeiraLojaKind[] = ['chip', 'furniture', 'bg', 'hex'];
const int = (v: unknown, lo: number, hi: number): number => {
  const n = typeof v === 'number' && Number.isFinite(v) ? Math.floor(v) : lo;
  return Math.min(hi, Math.max(lo, n));
};

export function sanitizeFeiraLoja(raw: unknown): FeiraLoja | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.day !== 'string' || !ISO_DIA.test(r.day)) return null;
  const vendor = (FEIRA_LOJA_VENDORS as readonly string[]).includes(r.vendor as string) ? (r.vendor as FeiraLojaVendor) : null;
  if (!vendor || !Array.isArray(r.items)) return null;
  const seen = new Set<string>();
  const items: FeiraLojaItem[] = [];
  for (const it of r.items.slice(0, 6)) {
    if (!it || typeof it !== 'object') continue;
    const o = it as Record<string, unknown>;
    const id = typeof o.id === 'string' && o.id.length > 0 && o.id.length <= 60 ? o.id : null;
    const kind = KINDS.find(k => k === o.kind);
    const type = o.type === 'hex' ? 'hex' : o.type === 'shop' ? 'shop' : null;
    if (!id || !kind || !type || seen.has(id)) continue;
    // O cliente só vende o que o CATÁLOGO dele conhece (item de servidor novo, em cliente antigo, não aparece); hex tem de ser um id válido.
    if (type === 'shop' && !ALL_SHOP_ITEMS.some(s => s.id === id)) continue;
    if (type === 'hex' && !parseHexItem(id)) continue;
    const price = int(o.price, 1, 1_000_000);
    const was = int(o.was, price, 1_000_000);
    seen.add(id);
    items.push({ id, type, kind, price, was, pct: int(o.pct, 0, 100), bought: o.bought === true });
  }
  return items.length > 0 ? { day: r.day, vendor, items } : null;
}

/** Ainda tem algo a comprar? (A folha de volta só abre sozinha com a loja aberta.) */
export const feiraLojaAbre = (l: FeiraLoja | null): boolean => !!l && l.items.some(i => !i.bought);

/** Chave do "já mostrei": a mesma oferta no mesmo dia não reabre sozinha (marcada ao MOSTRAR). */
export const feiraLojaShownKey = (l: FeiraLoja): string => `loja:${l.day}`;

/** O item de `shop.ts` com o PREÇO DA OFERTA no lugar do de tabela. */
export function shopItemOnOffer(offer: FeiraLojaItem): ShopItem | null {
  if (offer.type !== 'shop') return null;
  const base = ALL_SHOP_ITEMS.find(s => s.id === offer.id);
  return base ? { ...base, price: offer.price } : null;
}

/**
 * Compra local de um item do Mercado pelo CAMINHO DE SEMPRE (`applyShopBuy`: Bit pago primeiro, recusa por saldo/posse reconferida
 * sobre o `prev`), só que ao preço da oferta. O servidor já conferiu a oferta e o limite de 1.
 */
export function applyFeiraLojaBuy<T extends ShopBuyState>(prev: T, offer: FeiraLojaItem): { state: T; refused?: string } {
  const item = shopItemOnOffer(offer);
  if (!item) return { state: prev, refused: 'not-for-sale' };
  return applyShopBuy(prev, item);
}

/**
 * Aplica no estado LOCAL a compra de um item da Hexsmith que o SERVIDOR já confirmou (`cloudHexFair`): `paid` = o servidor debitou
 * o preço da oferta (sem poção, sem fragmento), então o cliente debita o mesmo (sem recusar: a verdade é a do servidor). Idempotente.
 */
export function applyServerFeiraHex<T extends { hexsmith?: HexsmithState; gamePoints?: number; bitsOrigin?: Parameters<typeof spendBits>[0]['bitsOrigin'] }>(
  prev: T, itemId: string, price: number, paid: boolean,
): T {
  const parsed = parseHexItem(itemId);
  if (!parsed) return prev;
  const hx = sanitizeHexsmith(prev.hexsmith);
  if (hx.owned.includes(itemId)) return prev;
  let next: T = prev;
  if (paid && price > 0) next = spendBits(next, Math.min(next.gamePoints ?? 0, price));
  const equipped = hx.equipped[parsed.slot] ? hx.equipped : { ...hx.equipped, [parsed.slot]: itemId };
  return { ...next, hexsmith: { owned: [...hx.owned, itemId], equipped } };
}
