// @vitest-environment jsdom
/**
 * Beta-2 (frente D) — 8.1 e 8.2.
 *  · 8.1: a descrição do chip é UMA linha: efeito + valor ("+3 Power" / "+3 Poder"); preço, compra e inventário intactos.
 *  · 8.2: a miniatura de TODO item abre a pré-visualização ampliada (a dos cenários): na folha do item (chip/mobília) e nas
 *    prateleiras "Da sua roda" e "Do trimestre" — e abrir a prévia NUNCA equipa, compra nem resgata.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { MercadoStallSheet } from './MercadoSheets';
import { SHOP_ITEMS, SPECIAL_ITEMS, CHIP_BOOST, SUBSCRIPTION_ITEMS } from '../../utils/shop';
import { RAID_TROPHY_ID } from '../../utils/guildRules';

const base = {
  language: 'en-US' as 'en-US' | 'pt-BR', points: 900, emblems: 12, credits: 0,
  ownedBackgrounds: ['bg-room'] as string[], equippedBackground: 'bg-room' as string | null,
  ownedFurniture: [] as string[], equippedDecor: {} as Record<string, string>,
  missionProgress: {} as Record<string, number>,
  onBuy: () => true, onExchangeCredits: async () => true, onEquip: () => {}, onEquipFurniture: () => {},
};
type Props = Parameters<typeof MercadoStallSheet>[0];
const abrir = (props: Partial<Props> & { stall: Props['stall'] }) => renderWithCss(<MercadoStallSheet {...base} {...props} />);

describe('8.1 — descrição do chip: nome, efeito, valor', () => {
  const chips = SHOP_ITEMS.filter(i => i.kind === 'chip' && !i.id.startsWith('chip-big-') && i.id !== 'chip-triple');
  it('os três chips: "+3 Poder/Harmonia/Benevolência" e "+3 Power/Harmony/Benevolence", sem parágrafo', () => {
    expect(chips).toHaveLength(3);
    expect(CHIP_BOOST).toBe(3);
    expect(chips.map(c => c.descEn)).toEqual(['+3 Power', '+3 Harmony', '+3 Benevolence']);
    expect(chips.map(c => c.descPt)).toEqual(['+3 Poder', '+3 Harmonia', '+3 Benevolência']);
    for (const c of chips) expect(c.descEn.length).toBeLessThan(20);
  });
  it('o catálogo de USO (mochila) diz o mesmo; preço e id dos chips não mudaram', () => {
    for (const c of chips) {
      const uso = Object.values(SPECIAL_ITEMS).find(s => s.kind === 'chip' && s.attr === c.attr && !s.boosts)!;
      expect(uso.descEn).toBe(c.descEn);
      expect(uso.descPt).toBe(c.descPt);
      expect(c.price).toBe(360);
    }
    expect(chips.map(c => c.id)).toEqual(['chip-power', 'chip-harmony', 'chip-benevolence']);
  });
  it('na lojinha e na folha do item a linha é "+3 Power"', () => {
    abrir({ stall: 'itens' });
    const card = document.querySelector('[data-shop-item="chip-power"]') as HTMLElement;
    expect(card.textContent).toContain('+3 Power');
    fireEvent.click(card);
    const folha = document.querySelector('[data-item-sheet="chip-power"]') as HTMLElement;
    expect(folha.textContent).toContain('+3 Power');
    expect(folha.textContent).not.toMatch(/Backpack|mochila|lean your path/i);
  });
});

describe('8.2 — a miniatura abre a pré-visualização', () => {
  it('folha do chip: a miniatura (alvo >= 44) abre a prévia ampliada; fechar volta à folha sem comprar', () => {
    const onBuy = vi.fn(() => true);
    abrir({ stall: 'itens', onBuy });
    fireEvent.click(document.querySelector('[data-shop-item="chip-power"]')!);
    const zoom = document.querySelector('[data-item-sheet="chip-power"] [data-item-zoom]') as HTMLElement;
    expect(zoom).not.toBeNull();
    expect(parseInt(zoom.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    expect(parseInt(zoom.style.minWidth, 10)).toBeGreaterThanOrEqual(44);
    fireEvent.click(zoom);
    const lb = document.querySelector('[data-item-lightbox]') as HTMLElement;
    expect(lb).not.toBeNull();
    expect(lb.getAttribute('role')).toBe('dialog');
    expect(lb.querySelector('[data-lightbox-image]')).not.toBeNull();
    fireEvent.click(within(lb).getByRole('button', { name: 'Back' }));
    expect(document.querySelector('[data-item-lightbox]')).toBeNull();
    expect(document.querySelector('[data-item-sheet="chip-power"]')).not.toBeNull();
    expect(onBuy).not.toHaveBeenCalled();
  });

  it('cenário continua com o lightbox de sempre (não virou o de item)', () => {
    abrir({ stall: 'background' });
    const card = [...document.querySelectorAll('[data-shop-item]')].find(el => el.getAttribute('data-shop-item') !== 'bg-room')!;
    fireEvent.click(card);
    const zoom = document.querySelector('[data-item-sheet] [data-item-zoom]') as HTMLElement;
    fireEvent.click(zoom);
    expect(document.querySelector('[data-bg-lightbox]')).not.toBeNull();
    expect(document.querySelector('[data-item-lightbox]')).toBeNull();
  });

  it('"Da sua roda": a miniatura abre a prévia e NÃO equipa; o corpo do card segue equipando', () => {
    const onEquipFurniture = vi.fn();
    abrir({ stall: 'decoracao', ownedFurniture: [RAID_TROPHY_ID], onEquipFurniture });
    const thumb = document.querySelector(`[data-guild-owned="furniture"] [data-thumb-preview="${RAID_TROPHY_ID}"]`) as HTMLElement;
    expect(thumb).not.toBeNull();
    fireEvent.click(thumb);
    expect(onEquipFurniture).not.toHaveBeenCalled();
    expect(document.querySelector('[data-item-lightbox]')).not.toBeNull();
    fireEvent.click(screen.getAllByRole('button', { name: 'Back' }).at(-1)!);
    expect(document.querySelector('[data-item-lightbox]')).toBeNull();
    fireEvent.click(document.querySelector(`[data-guild-owned-item="${RAID_TROPHY_ID}"]`)!);
    expect(onEquipFurniture).toHaveBeenCalledWith(RAID_TROPHY_ID, 'trophy');
  });

  it('"Do trimestre": a miniatura abre a prévia e NÃO resgata nem equipa', () => {
    const onClaim = vi.fn(() => true);
    const sub = SUBSCRIPTION_ITEMS.find(i => i.kind === 'furniture')!;
    abrir({ stall: 'decoracao', subscriptionActive: true, onClaimSubscription: onClaim });
    const thumb = document.querySelector(`[data-subscription-shelf="furniture"] [data-thumb-preview="${sub.id}"]`) as HTMLElement;
    expect(thumb).not.toBeNull();
    fireEvent.click(thumb);
    expect(onClaim).not.toHaveBeenCalled();
    expect(document.querySelector('[data-item-lightbox]')).not.toBeNull();
  });

  it('cenário do trimestre abre o lightbox de cenário', () => {
    const sub = SUBSCRIPTION_ITEMS.find(i => i.kind === 'bg')!;
    abrir({ stall: 'background', subscriptionActive: true, onClaimSubscription: () => true });
    fireEvent.click(document.querySelector(`[data-subscription-shelf="bg"] [data-thumb-preview="${sub.id}"]`)!);
    expect(document.querySelector('[data-bg-lightbox]')).not.toBeNull();
  });
});
