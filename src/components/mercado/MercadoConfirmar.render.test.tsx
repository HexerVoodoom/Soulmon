// @vitest-environment jsdom
/**
 * D1 + D2 (02/10/2026, navegação do dono) — o Mercado pede CONFIRMAÇÃO antes
 * de gastar, e a lojinha de Decoração diz a regra no topo.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { MercadoStallSheet } from './MercadoSheets';
import { SHOP_ITEMS } from '../../utils/shop';

const base = {
  language: 'en-US' as const,
  points: 260,
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
const sofa = SHOP_ITEMS.find(i => i.id === 'furn-sofa')!;

describe('D1 — confirmar a compra', () => {
  it('o toque abre "Comprar X por N Bits?" com custo e saldo antes/depois, e não gasta', () => {
    const onBuy = vi.fn(() => true);
    abrir({ stall: 'itens', onBuy, points: 260 });
    fireEvent.click(screen.getByRole('button', { name: `${chip.nameEn} — ${chip.price} Bits` }));
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    const dlg = screen.getByRole('dialog', { name: 'Confirm purchase' });
    expect(onBuy).not.toHaveBeenCalled();
    expect(dlg.querySelector('[data-purchase-question]')!.textContent).toBe(`Buy ${chip.nameEn} for ${chip.price} Bits?`);
    expect(dlg.querySelector('[data-purchase-cost]')!.textContent).toBe(`${chip.price} Bits`);
    expect(dlg.querySelector('[data-purchase-after]')!.textContent).toBe(`${260 - chip.price} Bits`);
    // seta de voltar no padrão do app + Cancelar + Confirmar
    expect(dlg.querySelector('[data-back-arrow]')).not.toBeNull();
    expect(within(dlg).getByRole('button', { name: 'Cancel' })).toBeTruthy();
    expect(within(dlg).getByRole('button', { name: 'Confirm' })).toBeTruthy();
  });

  it('Cancelar e a seta de voltar fecham sem comprar; Confirmar compra uma vez e fecha', () => {
    const onBuy = vi.fn(() => true);
    abrir({ stall: 'itens', onBuy });
    const card = () => screen.getByRole('button', { name: `${chip.nameEn} — ${chip.price} Bits` });
    fireEvent.click(card());
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog', { name: 'Confirm purchase' })).toBeNull();
    fireEvent.click(card());
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(screen.queryByRole('dialog', { name: 'Confirm purchase' })).toBeNull();
    expect(onBuy).not.toHaveBeenCalled();
    fireEvent.click(card());
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    expect(onBuy).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: 'Confirm purchase' })).toBeNull();
  });

  it('em PT-BR a pergunta e os botões saem em português', () => {
    abrir({ stall: 'itens', language: 'pt-BR' });
    fireEvent.click(screen.getByRole('button', { name: `${chip.namePt} — ${chip.price} Bits` }));
    fireEvent.click(screen.getByRole('button', { name: 'Comprar' }));
    const dlg = screen.getByRole('dialog', { name: 'Confirmar compra' });
    expect(dlg.querySelector('[data-purchase-question]')!.textContent).toBe(`Comprar ${chip.namePt} por ${chip.price} Bits?`);
    expect(within(dlg).getByRole('button', { name: 'Cancelar' })).toBeTruthy();
  });

  it('sem saldo continua abrindo o "como conseguir", não a confirmação', () => {
    abrir({ stall: 'itens', points: 1 });
    fireEvent.click(screen.getByRole('button', { name: `${chip.nameEn} — ${chip.price} Bits` }));
    fireEvent.click(screen.getByRole('button', { name: 'Buy' }));
    expect(screen.queryByRole('dialog', { name: 'Confirm purchase' })).toBeNull();
    expect(screen.getByRole('dialog', { name: 'How to get Bits' })).toBeTruthy();
  });

  it('a troca de Créditos também confirma antes de gastar', () => {
    const onExchangeCredits = vi.fn(async () => true);
    abrir({ stall: 'itens', onExchangeCredits, credits: 32 });
    fireEvent.click(screen.getByRole('tab', { name: 'Credits' }));
    fireEvent.click(screen.getByRole('button', { name: 'Swap 1 Credit for 10 Bits' }));
    const dlg = screen.getByRole('dialog', { name: 'Confirm purchase' });
    expect(onExchangeCredits).not.toHaveBeenCalled();
    expect(dlg.querySelector('[data-purchase-question]')!.textContent).toBe('Swap 1 Credit for 10 Bits?');
    expect(dlg.querySelector('[data-purchase-after]')!.textContent).toBe('31 Credits');
    fireEvent.click(within(dlg).getByRole('button', { name: 'Confirm' }));
    expect(onExchangeCredits).toHaveBeenCalledWith(1);
  });
});

describe('D2 — a regra da decoração, na tela', () => {
  it('a lojinha de Decoração abre com o limite (1 por espaço, até 5) e onde a peça aparece', () => {
    const { container } = abrir({ stall: 'decoracao' });
    const rule = container.querySelector('[data-decor-rule]')!;
    // I13: a regra mora atrás do "?" — fora da tela até tocar.
    expect(rule.textContent).not.toContain('1 piece per spot');
    fireEvent.click(within(rule as HTMLElement).getByRole('button', { name: 'How decoration works' }));
    const tip = document.querySelector('[data-info-tip-panel]')!;
    expect(tip.textContent).toContain('1 piece per spot');
    expect(tip.textContent).toContain('up to 5 at once');
    expect(tip.textContent).toContain('indoor');
    // só UMA vez (a prateleira não repete)
    expect(container.querySelectorAll('[data-decor-rule]').length).toBe(1);
    // e vem ANTES da prateleira
    const shelf = container.querySelector('[data-shop-shelf]')!;
    expect(rule.compareDocumentPosition(shelf) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('a lojinha de Itens não fala de decoração', () => {
    const { container } = abrir({ stall: 'itens' });
    expect(container.querySelector('[data-decor-rule]')).toBeNull();
  });

  it('peça de interior diante de cenário aberto mostra o MOTIVO no item', () => {
    const { container } = abrir({ stall: 'decoracao', equippedBackground: 'bg-night' });
    const card = container.querySelector(`[data-shop-item="${sofa.id}"]`)!;
    expect(card.querySelector('[data-decor-reason="indoor-only"]')!.textContent).toContain('indoor scenes');
  });

  it('peça compatível não mostra motivo', () => {
    const { container } = abrir({ stall: 'decoracao', equippedBackground: 'bg-room' });
    expect(container.querySelector(`[data-shop-item="${sofa.id}"] [data-decor-reason]`)).toBeNull();
  });
});
