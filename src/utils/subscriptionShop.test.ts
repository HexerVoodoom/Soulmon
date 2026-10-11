/**
 * CONJUNTO DO TRIMESTRE + RESGATE (D10, docs/ASSINATURA-SPEC.md).
 * Cada `it` trava uma linha vermelha da spec; derrubar uma regra derruba o teste.
 */
import { describe, it, expect } from 'vitest';
import { ALL_SHOP_ITEMS, SHOP_ITEMS, TOURNAMENT_ITEMS, GUILD_ITEMS, SUBSCRIPTION_ITEMS, isSubscriptionReward, SUBSCRIPTION_QUARTER } from './shop';
import { applySubscriptionClaim, subscriptionClaimRefusal } from './subscriptionShop';
import { applyShopBuy, shopBuyRefusal, type ShopBuyState } from './shopBuy';
import { isShopItemUnlocked } from './missions';
import { PET_BACKGROUNDS } from './backgrounds';
import { DECOR_ART } from './decorArt';
import { DECOR_SLOTS } from './petStage';
import { stallItems, MERCADO_STALLS, STALL_CURRENCIES } from './mercadoCatalog';

const state = (over: Partial<ShopBuyState> = {}): ShopBuyState => ({ gamePoints: 5000, emblems: 5000, foodInventory: {}, ownedBackgrounds: ['bg-room'], ownedFurniture: [] as string[], ...over });

describe('o catálogo do trimestre', () => {
  it('tem itens, e SÓ bg/furniture (cosmético, como a aba Torneio)', () => {
    expect(SUBSCRIPTION_ITEMS.length).toBeGreaterThanOrEqual(3);
    for (const i of SUBSCRIPTION_ITEMS) expect(['bg', 'furniture'], i.id).toContain(i.kind);
  });

  it('todo item tem unlock.kind === "subscription" do trimestre vigente e preço 0', () => {
    for (const i of SUBSCRIPTION_ITEMS) {
      expect(i.unlock, i.id).toEqual({ kind: 'subscription', quarter: SUBSCRIPTION_QUARTER });
      expect(i.price, i.id).toBe(0);
      expect(i.currency, i.id).toBeUndefined();
    }
  });

  it('anti double-dip: NENHUM item da assinatura está em SHOP_ITEMS nem TOURNAMENT_ITEMS (nem com preço)', () => {
    const vendidos = new Set([...SHOP_ITEMS, ...TOURNAMENT_ITEMS].map(i => i.id));
    for (const i of SUBSCRIPTION_ITEMS) expect(vendidos.has(i.id), i.id).toBe(false);
    // e nenhuma vitrine de nenhuma lojinha/moeda os lista
    const listados = new Set<string>();
    for (const stall of MERCADO_STALLS) for (const cur of STALL_CURRENCIES[stall]) for (const i of stallItems(stall, cur)) listados.add(i.id);
    for (const i of SUBSCRIPTION_ITEMS) expect(listados.has(i.id), i.id).toBe(false);
  });

  it('ids únicos e sem colisão com os outros catálogos', () => {
    const ids = ALL_SHOP_ITEMS.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const i of SUBSCRIPTION_ITEMS) expect([...SHOP_ITEMS, ...TOURNAMENT_ITEMS, ...GUILD_ITEMS].some(o => o.id === i.id)).toBe(false);
  });

  it('nenhum item mexe em nada que não seja enfeite: sem attr, sem texto de cuidado/Créditos', () => {
    for (const i of SUBSCRIPTION_ITEMS) {
      expect(i.attr, i.id).toBeUndefined();
      expect(`${i.namePt} ${i.descPt} ${i.nameEn} ${i.descEn}`, i.id).not.toMatch(/cr[eé]dito|credit|cura|heal|escudo|shield|vida|HP|energia|energy/i);
    }
  });

  it('cada item resolve arte (cenário em PET_BACKGROUNDS, decoração em DECOR_ART com espaço de palco)', () => {
    for (const i of SUBSCRIPTION_ITEMS) {
      if (i.kind === 'bg') expect(PET_BACKGROUNDS[i.id], i.id).toBeTruthy();
      else {
        expect(DECOR_ART[i.id], i.id).toBeTruthy();
        expect(i.slot, i.id).toBeTruthy();
        expect(Object.keys(DECOR_SLOTS)).toContain(i.slot);
      }
    }
  });

  it('isSubscriptionReward reconhece só os do trimestre', () => {
    expect(SUBSCRIPTION_ITEMS.every(isSubscriptionReward)).toBe(true);
    expect(isSubscriptionReward({ id: 'furn-sofa' })).toBe(false);
  });
});

describe('o cadeado "subscription" (mesmo molde da missão)', () => {
  it('fechado sem assinatura vigente, aberto com ela', () => {
    const item = SUBSCRIPTION_ITEMS[0];
    expect(isShopItemUnlocked(item, {})).toBe(false);
    expect(isShopItemUnlocked(item, {}, false)).toBe(false);
    expect(isShopItemUnlocked(item, {}, true)).toBe(true);
  });

  it('missão não é afetada pelo terceiro parâmetro', () => {
    const missao = SHOP_ITEMS.find(i => i.unlock?.kind === 'mission')!;
    expect(isShopItemUnlocked(missao, {}, true)).toBe(false);
  });
});

describe('o resgate', () => {
  it('assinatura vigente: item entra na posse, equipa, e NÃO gasta moeda nenhuma', () => {
    const item = SUBSCRIPTION_ITEMS.find(i => i.kind === 'bg')!;
    const prev = state();
    const r = applySubscriptionClaim(prev, item, true);
    expect(r.refused).toBeUndefined();
    expect(r.state.ownedBackgrounds).toContain(item.id);
    expect(r.state.equippedBackground).toBe(item.id);
    expect(r.state.gamePoints).toBe(5000);
    expect(r.state.emblems).toBe(5000);
  });

  it('decoração equipa no espaço que declara', () => {
    const item = SUBSCRIPTION_ITEMS.find(i => i.kind === 'furniture')!;
    const r = applySubscriptionClaim(state(), item, true);
    expect(r.state.ownedFurniture).toContain(item.id);
    expect(r.state.equippedDecor).toEqual({ [item.slot!]: item.id });
  });

  it('sem assinatura vigente: recusa "locked" e o estado volta intacto (mesma referência)', () => {
    const item = SUBSCRIPTION_ITEMS[0];
    const prev = state();
    const r = applySubscriptionClaim(prev, item, false);
    expect(r.refused).toBe('locked');
    expect(r.state).toBe(prev);
  });

  it('duplo toque no mesmo lote não duplica a posse', () => {
    const item = SUBSCRIPTION_ITEMS.find(i => i.kind === 'furniture')!;
    const um = applySubscriptionClaim(state(), item, true).state;
    const dois = applySubscriptionClaim(um, item, true);
    expect(dois.refused).toBe('already-owned');
    expect(dois.state.ownedFurniture!.filter(x => x === item.id)).toHaveLength(1);
  });

  it('item entregue NUNCA é retirado: assinatura acabou, a posse segue e continua "já é seu"', () => {
    const item = SUBSCRIPTION_ITEMS.find(i => i.kind === 'bg')!;
    const resgatado = applySubscriptionClaim(state(), item, true).state;
    // a assinatura expira: nada no módulo remove; reconferir com active=false só recusa NOVO resgate
    expect(subscriptionClaimRefusal(resgatado, item, false)).toBe('already-owned');
    expect(resgatado.ownedBackgrounds).toContain(item.id);
  });

  it('item que não é da assinatura não passa por aqui', () => {
    const sofa = ALL_SHOP_ITEMS.find(i => i.id === 'furn-sofa')!;
    expect(applySubscriptionClaim(state(), sofa, true).refused).toBe('not-a-subscription-item');
  });
});

describe('a loja de Bits/Emblemas nunca vende item da assinatura', () => {
  it('shopBuyRefusal = not-for-sale mesmo com saldo sobrando', () => {
    for (const i of SUBSCRIPTION_ITEMS) expect(shopBuyRefusal(state(), i), i.id).toBe('not-for-sale');
  });
  it('applyShopBuy recusa e não toca em saldo nem posse', () => {
    const item = SUBSCRIPTION_ITEMS[0];
    const prev = state();
    const r = applyShopBuy(prev, item);
    expect(r.refused).toBe('not-for-sale');
    expect(r.state).toBe(prev);
  });
});
