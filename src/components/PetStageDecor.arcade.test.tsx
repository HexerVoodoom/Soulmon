// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { PetStageDecor } from './PetStageDecor';
import { PET_BACKGROUNDS } from '../utils/backgrounds';
import { DECOR_SLOTS, SLOT_ORDER, decorFitsSetting } from '../utils/petStage';
import { ALL_SHOP_ITEMS } from '../utils/shop';

const item = ALL_SHOP_ITEMS.find(i => i.id === 'furn-arcade-cab')!;
const bgId = Object.keys(PET_BACKGROUNDS).find(k => {
  const b = PET_BACKGROUNDS[k]; return decorFitsSetting(item.fits ?? 'any', b.setting) && SLOT_ORDER.some(s => b.slots.includes(s));
})!;
const slot = SLOT_ORDER.find(s => PET_BACKGROUNDS[bgId].slots.includes(s) && DECOR_SLOTS[s].anchor !== 'ground-flat')!;

describe('fliperama', () => {
  it('toque abre minigames; sem handler não há botão', () => {
    const fn = vi.fn();
    const { container, rerender } = render(<PetStageDecor equippedDecor={{ [slot]: 'furn-arcade-cab' }} equippedBackground={bgId} trophies={[]} language="pt-BR" onOpenArcade={fn} />);
    const b = container.querySelector('[data-decor-arcade]') as HTMLElement;
    expect(b.getAttribute('aria-label')).toBe('Abrir minigames');
    fireEvent.click(b);
    expect(fn).toHaveBeenCalledOnce();
    rerender(<PetStageDecor equippedDecor={{ [slot]: 'furn-arcade-cab' }} equippedBackground={bgId} trophies={[]} language="en" />);
    expect(container.querySelector('[data-decor-arcade]')).toBeNull();
  });
});
