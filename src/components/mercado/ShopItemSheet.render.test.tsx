// @vitest-environment jsdom
/**
 * I5 + I6 (02/10/2026, navegação do dono): tocar num item abre a FOLHA DO
 * ITEM (preview grande, comprar/equipar); cenário tem lightbox; peça de
 * decoração leva a pílula interno/externo/qualquer.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { MercadoStallSheet } from './MercadoSheets';
import { SHOP_ITEMS } from '../../utils/shop';
import { PET_BACKGROUNDS } from '../../utils/backgrounds';

const base = {
  language: 'en-US' as const,
  points: 900,
  emblems: 12,
  credits: 32,
  ownedBackgrounds: ['bg-room'] as string[],
  equippedBackground: 'bg-room' as string | null,
  ownedFurniture: [] as string[],
  equippedDecor: {},
  missionProgress: {} as Record<string, number>,
  onBuy: () => true,
  onExchangeCredits: async () => true,
  onEquip: () => {},
  onEquipFurniture: () => {},
};
type Props = Parameters<typeof MercadoStallSheet>[0];
const abrir = (props: Partial<Props> & { stall: Props['stall'] }) =>
  renderWithCss(<MercadoStallSheet {...base} {...props} />);

const chip = SHOP_ITEMS.find(i => i.kind === 'chip')!;
const painted = SHOP_ITEMS.find(i => i.kind === 'bg' && !i.unlock && !i.currency && i.id !== 'bg-room' && /url\(/.test(PET_BACKGROUNDS[i.id]?.css ?? ''))!;

describe('I5 — a folha do item', () => {
  it('tocar no item NÃO compra: abre a folha com o preview grande SOLTO (sem o quadradinho de vidro)', () => {
    const onBuy = vi.fn(() => true);
    abrir({ stall: 'itens', onBuy });
    fireEvent.click(screen.getByRole('button', { name: `${chip.nameEn} — ${chip.price} Bits` }));
    expect(onBuy).not.toHaveBeenCalled();
    const sheet = screen.getByRole('dialog', { name: chip.nameEn });
    expect(within(sheet).getByRole('button', { name: 'Buy' })).toBeTruthy();
    const prev = document.body.querySelector('[data-item-preview]') as HTMLElement;
    expect(prev).not.toBeNull();
    expect(prev.getAttribute('aria-hidden')).toBe('true');
    expect(prev.style.pointerEvents).toBe('none');
    // solto na área escurecida: nada de MiniGlass/box em volta do ícone
    expect(prev.querySelector('[data-mini-glass], .sm2-viewport-screen')).toBeNull();
    expect(prev.querySelector('img, span')).not.toBeNull();
  });

  it('fechar a folha tira o preview', () => {
    abrir({ stall: 'itens' });
    fireEvent.click(screen.getByRole('button', { name: `${chip.nameEn} — ${chip.price} Bits` }));
    fireEvent.click(within(screen.getByRole('dialog', { name: chip.nameEn })).getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog', { name: chip.nameEn })).toBeNull();
    expect(document.body.querySelector('[data-item-preview]')).toBeNull();
  });

  it('item possuído: o botão da folha é Equipar e equipa', () => {
    const onEquip = vi.fn();
    abrir({ stall: 'background', ownedBackgrounds: ['bg-room', painted.id], onEquip });
    fireEvent.click(screen.getByRole('button', { name: `${painted.nameEn} — Equip` }));
    fireEvent.click(screen.getByRole('button', { name: 'Equip' }));
    expect(onEquip).toHaveBeenCalledWith(painted.id);
  });

  it('cenário: a miniatura abre o LIGHTBOX (✕ no topo ESQUERDO, fecha ao tocar fora); Equipar continua no botão', () => {
    abrir({ stall: 'background' });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${painted.nameEn} — `) }));
    // cenário não leva ícone solto: a miniatura é que é o preview
    expect(document.body.querySelector('[data-item-preview]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: `View ${painted.nameEn} larger` }));
    const box = document.body.querySelector('[data-bg-lightbox]') as HTMLElement;
    expect(box).not.toBeNull();
    expect(box.getAttribute('aria-modal')).toBe('true');
    expect(box.querySelector('[data-lightbox-image]')).not.toBeNull();
    const close = box.querySelector('[data-lightbox-close]') as HTMLElement;
    expect(close.style.left).toBe('8px');
    expect(close.style.right).toBe('');
    // tocar na imagem NÃO fecha; tocar fora (no fundo) fecha
    fireEvent.click(box.querySelector('[data-lightbox-image]')!);
    expect(document.body.querySelector('[data-bg-lightbox]')).not.toBeNull();
    fireEvent.click(box);
    expect(document.body.querySelector('[data-bg-lightbox]')).toBeNull();
  });

  it('o ✕ do lightbox também fecha', () => {
    abrir({ stall: 'background' });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(`^${painted.nameEn} — `) }));
    fireEvent.click(screen.getByRole('button', { name: `View ${painted.nameEn} larger` }));
    fireEvent.click(document.body.querySelector('[data-lightbox-close]')!);
    expect(document.body.querySelector('[data-bg-lightbox]')).toBeNull();
  });
});

describe('I6 — pílula interno / externo / qualquer na decoração', () => {
  it('cada peça leva a pílula do SEU `fits`, em EN e PT, sem ícone', () => {
    const { container } = abrir({ stall: 'decoracao' });
    const furn = SHOP_ITEMS.filter(i => i.kind === 'furniture' && !i.currency && !i.unlock);
    expect(furn.length).toBeGreaterThan(0);
    const seen = new Set<string>();
    for (const f of furn) {
      const tag = container.querySelector(`[data-shop-item="${f.id}"] [data-decor-fit]`) as HTMLElement | null;
      if (!tag) continue; // peça que a vitrine não lista (posse etc.)
      const fit = f.fits ?? 'any';
      expect(tag.getAttribute('data-decor-fit')).toBe(fit);
      expect(tag.textContent).toBe(fit === 'indoor' ? 'Indoor' : fit === 'outdoor' ? 'Outdoor' : 'Any');
      expect(tag.querySelector('svg, img, .sm2-icon')).toBeNull();
      seen.add(fit);
    }
    expect(seen.size).toBeGreaterThanOrEqual(2);
  });

  it('em PT-BR: Interno / Externo / Qualquer', () => {
    const { container } = abrir({ stall: 'decoracao', language: 'pt-BR' });
    const texts = new Set(Array.from(container.querySelectorAll('[data-decor-fit]')).map(e => e.textContent));
    for (const t of texts) expect(['Interno', 'Externo', 'Qualquer']).toContain(t);
    expect(texts.size).toBeGreaterThanOrEqual(2);
  });

  it('itens que não são decoração não levam a pílula', () => {
    const { container } = abrir({ stall: 'itens' });
    expect(container.querySelector('[data-decor-fit]')).toBeNull();
  });
});
