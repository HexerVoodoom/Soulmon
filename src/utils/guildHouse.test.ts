import { describe, it, expect } from 'vitest';
import { applyGuildSlot, donatableItems } from './guildHouse';

describe('applyGuildSlot — o item da casa não vale no cenário pessoal', () => {
  const base = { ownedFurniture: ['furn-lamp', 'furn-rug'], equippedDecor: { rug: 'furn-rug' } as never };
  it('doar tira do inventário e do cenário pessoal', () => {
    const r = applyGuildSlot(base, 'furn-rug');
    expect(r.guildDonatedItem).toBe('furn-rug');
    expect(r.ownedFurniture).toEqual(['furn-lamp']);
    expect(Object.values(r.equippedDecor ?? {})).not.toContain('furn-rug');
  });
  it('tirar (ou trocar) devolve o item anterior, sem duplicar', () => {
    const doado = applyGuildSlot(base, 'furn-rug');
    const volta = applyGuildSlot(doado, null);
    expect(volta.guildDonatedItem).toBeNull();
    expect(volta.ownedFurniture?.sort()).toEqual(['furn-lamp', 'furn-rug']);
    const troca = applyGuildSlot(doado, 'furn-lamp');
    expect(troca.ownedFurniture).toEqual(['furn-rug']);
    expect(troca.guildDonatedItem).toBe('furn-lamp');
  });
  it('é idempotente: mesmo slot, mesma referência', () => {
    const doado = applyGuildSlot(base, 'furn-lamp');
    expect(applyGuildSlot(doado, 'furn-lamp')).toBe(doado);
    expect(applyGuildSlot(base, null)).toBe(base);
  });
  it('slot de item que este aparelho não tem não inventa inventário', () => {
    const r = applyGuildSlot({ ownedFurniture: [] }, 'trophy-concha-mare');
    expect(r.ownedFurniture).toEqual([]);
    expect(r.guildDonatedItem).toBe('trophy-concha-mare');
  });
  it('doável = o que tenho e não está equipado', () => {
    expect(donatableItems(base)).toEqual(['furn-lamp']);
  });
});
