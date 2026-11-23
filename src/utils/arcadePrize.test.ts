import { describe, it, expect } from 'vitest';
import { grantGuildTrophy } from './guildClaimLocal';
import { ALL_SHOP_ITEMS, SHOP_ITEMS, isGuildReward } from './shop';
import { shopBuyRefusal } from './shopBuy';
import { applyGrants, applyMail, hasPendingReward, rewardText, sumGrants, type MailItem } from './mensageiro';

const carta: MailItem = { mid: 'arcade:2026-10:match3', bodyPt: 'a', bodyEn: 'b', bits: 0, emblems: 0, item: 'furn-arcade-cab' };

describe('Fliperama de Canto é prêmio, não item de loja (REGISTRO §482)', () => {
  it('sumiu da loja, segue resolvível pelo palco e nunca é comprável', () => {
    expect(SHOP_ITEMS.some(i => i.id === 'furn-arcade-cab')).toBe(false);
    const item = ALL_SHOP_ITEMS.find(i => i.id === 'furn-arcade-cab');
    expect(item?.slot).toBe('floor-left');
    expect(isGuildReward({ id: 'furn-arcade-cab' })).toBe(true);
    expect(shopBuyRefusal({ ownedFurniture: [], ownedBackgrounds: [], gamePoints: 999999, emblems: 999999 } as never, item!)).toBe('not-for-sale');
  });
  it('o item do correio entra no save uma vez só (ids fora da lista não passam)', () => {
    const a = grantGuildTrophy({ ownedFurniture: [] as string[] }, 'furn-arcade-cab');
    expect(a.ownedFurniture).toEqual(['furn-arcade-cab']);
    expect(grantGuildTrophy(a, 'furn-arcade-cab')).toBe(a);
    expect(grantGuildTrophy(a, 'furn-sofa')).toBe(a);
  });
  it('a carta com anexo conta como prêmio pendente e o resgate põe o item no save', () => {
    expect(hasPendingReward(carta)).toBe(true);
    expect(hasPendingReward({ ...carta, claimedAt: 5 })).toBe(false);
    const s = applyMail({ ownedFurniture: [] as string[], mailClaimed: [] as string[] }, carta);
    expect(s.ownedFurniture).toEqual(['furn-arcade-cab']);
    expect(s.mailClaimed).toEqual([carta.mid]);
    expect(applyMail(s, carta)).toBe(s);
    const g = applyGrants({ ownedFurniture: [] as string[] }, [{ mid: 'm2', bits: 0, emblems: 0, item: 'furn-arcade-cab' }]);
    expect(g.ownedFurniture).toEqual(['furn-arcade-cab']);
  });
  it('o texto do resgate nomeia o item', () => {
    expect(rewardText(sumGrants([{ bits: 0, emblems: 0, item: 'furn-arcade-cab' }]), true)).toBe('Fliperama de Canto');
    expect(rewardText({ bits: 10, emblems: 0, item: 'furn-arcade-cab' }, false)).toBe('Corner Arcade and 10 Bits');
  });
});
