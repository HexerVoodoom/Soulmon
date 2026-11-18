// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PetStageDecor } from './PetStageDecor';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { DECOR_SLOTS, SLOT_ORDER, decorFitsSetting } from '../utils/petStage';
import { ALL_SHOP_ITEMS } from '../utils/shop';

function cena(id: string, dormindo: boolean) {
  const item = ALL_SHOP_ITEMS.find(i => i.id === id)!;
  const bg = Object.keys(PET_BACKGROUNDS).find(k => decorFitsSetting(item.fits ?? 'any', PET_BACKGROUNDS[k].setting) && SLOT_ORDER.some(s => PET_BACKGROUNDS[k].slots.includes(s) && DECOR_SLOTS[s].anchor !== 'ground-flat'))!;
  const slot = SLOT_ORDER.find(s => PET_BACKGROUNDS[bg].slots.includes(s) && DECOR_SLOTS[s].anchor !== 'ground-flat')!;
  return render(<PetStageDecor equippedDecor={{ [slot]: id }} equippedBackground={bg} trophies={[]} language="pt-BR" isSleeping={dormindo} />).container;
}

describe('fogueira e fliperama', () => {
  it('fogo aceso acordado; dormindo vira brasa', () => {
    const a = cena('furn-campfire', false);
    expect(a.querySelector('.sm-decor-fogo')?.hasAttribute('data-on')).toBe(true);
    expect(a.querySelector('.sm-decor-brasa')?.hasAttribute('data-on')).toBe(false);
    const d = cena('furn-campfire', true);
    expect(d.querySelector('.sm-decor-fogo')?.hasAttribute('data-on')).toBe(false);
    expect(d.querySelector('.sm-decor-brasa')?.hasAttribute('data-on')).toBe(true);
  });
  it('o fliperama tem tela', () => {
    expect(cena('furn-arcade-cab', false).querySelector('[data-decor-tela]')).not.toBeNull();
  });
});
