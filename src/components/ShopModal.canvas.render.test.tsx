// @vitest-environment jsdom
/**
 * ShopModal — o canvas Loja (DECISÕES §26, D-L1…D-L11) em código.
 *
 * O que trava aqui é o que a CRITICA.md reprovaria de novo: opacidade como
 * estado, `danger` na recusa, `disabled` nativo no travado, `aria-label` num
 * `<span>` para o saldo, e as três moedas se parecendo.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ShopModal } from './ShopModal';
import { SHOP_ITEMS } from '../utils/shop';

const base = {
  language: 'en' as const,
  points: 260,
  emblems: 12,
  credits: 32,
  ownedBackgrounds: ['bg-room'] as string[],
  equippedBackground: 'bg-room',
  ownedFurniture: [] as string[],
  equippedDecor: {},
  onBuy: () => true,
  onExchangeCredits: async () => true,
  onEquip: () => {},
  onEquipFurniture: () => {},
  onClose: () => {},
  missionProgress: {} as Record<string, number>,
  asPage: true,
};

const abrir = (props: Record<string, unknown> = {}) =>
  renderWithCss(<ShopModal {...(base as any)} {...(props as any)} />);

const locked = SHOP_ITEMS.find(i => i.unlock)!;
const bits = SHOP_ITEMS.find(i => i.kind === 'bg' && !i.unlock && i.id !== 'bg-room')!;

describe('ShopModal — canvas Loja', () => {
  it('o saldo é texto num <p> ("260 Bits"), sem aria-label em span; o segmento ativo é tonal', () => {
    const { container } = abrir();
    expect(container.querySelector('[aria-label^="Bits:"]')).toBeNull();
    const p = Array.from(container.querySelectorAll('p')).find(el => el.textContent === '260Bits');
    expect(p, 'saldo "260 Bits" num <p>').toBeTruthy();
    const on = screen.getByRole('radio', { name: 'Shop' });
    expect(on.getAttribute('aria-checked')).toBe('true');
    expect(on.style.backgroundColor).toBe('var(--sm2-primary-soft)');
    expect(on.style.color).toBe('var(--sm2-primary-ink)');
    // Uma região `status` só.
    expect(container.querySelectorAll('[role="status"]').length).toBe(1);
  });

  it('a arte vive dentro de um mini-visor (nenhum <img> fora do vidro)', () => {
    const { container } = abrir();
    const imgs = Array.from(container.querySelectorAll('img'));
    expect(imgs.length).toBeGreaterThan(0);
    for (const img of imgs) expect(img.closest('[data-mini-glass]'), img.getAttribute('src') ?? '').not.toBeNull();
  });

  it('equipado = anel por fora do vidro + tag check_circle na coluna de texto; o nome não quebra', () => {
    const { container } = abrir();
    const card = screen.getByRole('button', { name: 'Bedroom — Equipped' });
    const glass = card.querySelector('[data-mini-glass]') as HTMLElement;
    expect(glass.style.boxShadow).toContain('var(--sm2-primary-ink)');
    expect(card.textContent).toContain('Equipped');
    const name = Array.from(card.querySelectorAll('span')).find(s => s.textContent === 'Bedroom') as HTMLElement;
    expect(name.style.whiteSpace).toBe('nowrap');
    expect(name.style.textOverflow).toBe('ellipsis');
    // Nenhuma opacidade < 1 em nó nenhum do aparelho (o FILL 0/1 do `Icon` é
    // mecanismo interno do SVG, não estado de superfície).
    const fraca = Array.from(container.querySelectorAll<HTMLElement>('[style*="opacity"]'))
      .filter(el => !el.closest('svg') && el.style.opacity !== '' && Number(el.style.opacity) < 1);
    expect(fraca).toEqual([]);
  });

  it('travado = aria-disabled (não disabled nativo), fora do Tab, tracejado, véu no vidro, cadeado na tag', () => {
    abrir();
    const card = screen.getByRole('button', { name: new RegExp(`^${locked.nameEn} — locked:`) });
    expect(card.hasAttribute('disabled')).toBe(false);
    expect(card.getAttribute('aria-disabled')).toBe('true');
    expect(card.getAttribute('tabindex')).toBe('-1');
    expect(card.style.border).toContain('dashed');
    expect(card.querySelector('.sm2-shop-veil')).not.toBeNull();
    expect(card.textContent).toContain('locked');
  });

  it('sem saldo: o preço esmaece por TINTA e a recusa é âmbar (filete + região), nunca danger', () => {
    vi.useFakeTimers();
    const { container } = abrir({ points: 10, onBuy: () => false });
    const card = screen.getByRole('button', { name: `${bits.nameEn} — ${bits.price} Bits` });
    const price = card.querySelector('.sm2-num') as HTMLElement;
    expect(price.style.color).toBe('var(--sm2-muted)');
    expect(price.style.opacity).toBe('');
    act(() => { fireEvent.click(card); });
    expect(card.style.boxShadow).toContain('var(--sm2-gold-ink)');
    const status = container.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent).toBe(`Not enough to buy ${bits.nameEn}.`);
    expect(status.style.color).toBe('var(--sm2-gold-ink)');
    expect(container.innerHTML).not.toContain('danger');
    act(() => { vi.advanceTimersByTime(2700); });
    expect(card.style.boxShadow).toBe('none');
    vi.useRealTimers();
  });

  it('as três moedas: Bits mono primary-ink sem ícone; Emblemas serifa gold; Créditos diamond credit-ink', () => {
    const { container } = abrir();
    const bitsEl = Array.from(container.querySelectorAll('.sm2-num')).find(el => el.textContent === '260Bits') as HTMLElement;
    expect(bitsEl.style.fontFamily).toBe('var(--sm2-font-mono)');
    expect(bitsEl.style.color).toBe('var(--sm2-primary-ink)');
    expect(bitsEl.querySelector('.sm2-icon, .material-symbols-rounded')).toBeNull();
    const diamond = container.querySelector('[style*="--sm2-credit-ink"]');
    expect(diamond, 'diamond em credit-ink na troca').not.toBeNull();
    // Os degraus da troca: outline, valor em mono.
    const swap = screen.getByRole('button', { name: 'Swap 10 Credits for 100 Bits' });
    expect(swap.hasAttribute('disabled')).toBe(false);
    expect((swap.querySelector('[style*="font-mono"]') as HTMLElement).textContent).toBe('100 Bits');
    expect(screen.getByRole('button', { name: 'Swap 60 Credits for 600 Bits' }).hasAttribute('disabled')).toBe(true);

    fireEvent.click(screen.getByRole('radio', { name: 'Tournament' }));
    const emb = Array.from(container.querySelectorAll('.sm2-num')).find(el => el.textContent === '12') as HTMLElement;
    expect(emb.style.fontFamily).toBe('var(--sm2-font-serif)');
    expect(emb.style.color).toBe('var(--sm2-gold-ink)');
  });
});
