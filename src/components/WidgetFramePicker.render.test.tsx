// @vitest-environment jsdom
/**
 * Seletor de moldura do widget V-Pet: a padrão sempre livre, as de elemento por estado (Em uso / Usar / trancada com a dica),
 * e a compra com dinheiro real que NUNCA mostra preço inventado: sem Play (ou sem o produto no Console) fica "Indisponível".
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';

const billing = vi.hoisted(() => ({ available: false, open: true as boolean | null, price: null as string | null }));
vi.mock('../utils/playBilling', () => ({
  isBillingAvailable: () => billing.available,
  useStoreOpen: () => billing.open,
  getLocalizedPrice: async () => billing.price,
  billingDisabledMessage: () => 'fechada',
}));

import { WidgetFramePicker } from './WidgetFramePicker';
import type { WidgetFramePickerData } from '../utils/widgetFrames';

const data = (over: Partial<WidgetFramePickerData> = {}): WidgetFramePickerData => ({
  owned: ['sombra', 'fogo'], selected: 'sombra', onSelect: vi.fn(), onBuy: vi.fn(async () => ({ ok: true as const })), ...over,
});
const abrir = (d: WidgetFramePickerData) => renderWithCss(<WidgetFramePicker language="pt-BR" data={d} />);
const item = (id: string) => document.querySelector(`[data-widget-frame-item="${id}"]`) as HTMLElement;

beforeEach(() => { billing.available = false; billing.open = true; billing.price = null; });

describe('WidgetFramePicker', () => {
  it('desenha a padrão + os 20 elementos', () => {
    abrir(data());
    expect(document.querySelectorAll('[data-widget-frame-item]')).toHaveLength(21);
  });

  it('em uso, possuída (Usar) e trancada (dica de como destravar)', () => {
    const d = data();
    abrir(d);
    expect(item('sombra').querySelector('[data-widget-frame-inuse]')).not.toBeNull();
    fireEvent.click(item('fogo').querySelector('[data-widget-frame-use]')!);
    expect(d.onSelect).toHaveBeenCalledWith('fogo');
    expect(item('luz').querySelector('[data-widget-frame-hint]')?.textContent).toMatch(/evoluir.*Luz/i);
    expect(item('luz').querySelector('[data-widget-frame-use]')).toBeNull();
  });

  it('a padrão volta com `null`', () => {
    const d = data();
    abrir(d);
    fireEvent.click(item('default').querySelector('[data-widget-frame-use]')!);
    expect(d.onSelect).toHaveBeenCalledWith(null);
  });

  it('sem Play (web) as trancadas ficam Indisponíveis, sem preço', () => {
    abrir(data());
    const btn = item('luz').querySelector('[data-widget-frame-unavailable]') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
    expect(item('luz').textContent).not.toMatch(/R\$/);
  });

  it('com Play mas produto inexistente no Console (preço null): Indisponível', async () => {
    billing.available = true;
    abrir(data());
    await new Promise(r => setTimeout(r, 10));
    expect(item('luz').querySelector('[data-widget-frame-unavailable]')).not.toBeNull();
    expect(item('luz').querySelector('[data-widget-frame-buy]')).toBeNull();
  });

  it('com o produto na Play: Comprar -> Confirmar chama a compra uma vez', async () => {
    billing.available = true;
    billing.price = 'R$ 7,90';
    const d = data();
    abrir(d);
    await waitFor(() => expect(item('luz').querySelector('[data-widget-frame-buy]')).not.toBeNull());
    expect(item('luz').querySelector('[data-widget-frame-buy]')?.textContent).toContain('R$ 7,90');
    fireEvent.click(item('luz').querySelector('[data-widget-frame-buy]')!);
    expect(d.onBuy).not.toHaveBeenCalled();
    fireEvent.click(item('luz').querySelector('[data-widget-frame-confirm]')!);
    await waitFor(() => expect(d.onBuy).toHaveBeenCalledWith('luz'));
    expect(d.onBuy).toHaveBeenCalledTimes(1);
  });

  it('loja fechada (kill-switch): não oferece compra nova', async () => {
    billing.available = true;
    billing.open = false;
    billing.price = 'R$ 7,90';
    abrir(data());
    await new Promise(r => setTimeout(r, 10));
    expect(item('luz').querySelector('[data-widget-frame-buy]')).toBeNull();
  });
});
