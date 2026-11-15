// @vitest-environment jsdom
/**
 * QA r4 C2 · A4 (REGISTRO §386, decisões do dono 14/11/2026) — a tela dos pacotes de Bits (`CreditExchange`):
 *  (a) pacote desabilitado diz o MOTIVO dentro da célula ("60 Credits short" / "Back tomorrow");
 *  (b) UMA só mensagem por resultado; erro de rede manda tocar no MESMO pacote; recusa definitiva diz que nada foi gasto;
 *  (c) faltando saldo, um atalho "Get Credits" que abre a compra de Créditos que já existe;
 *  (d) estimativa em reais só em PT (não há preço de Crédito em USD no código: EN fica sem estimativa).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, within, act } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { CreditExchange } from './ShopShelf';
import { noteBitsPackLeft } from '../../utils/entitlements';

beforeEach(() => { noteBitsPackLeft(null); });

const celula = (id: string) => document.querySelector(`[data-bits-pack="${id}"]`) as HTMLButtonElement;

async function comprar(id: string) {
  fireEvent.click(celula(id));
  const dlg = screen.getByRole('dialog', { name: /Confirm purchase|Confirmar compra/ });
  await act(async () => { fireEvent.click(within(dlg).getByRole('button', { name: /Confirm|Confirmar/ })); });
}

describe('A4 · CreditExchange', () => {
  it('(a) sem saldo: a célula diz quanto falta (EN e PT)', () => {
    const say = vi.fn();
    const { unmount } = renderWithCss(<CreditExchange language="en-US" credits={400} onExchangeCredits={async () => true} say={say} />);
    expect(celula('bits-1000').disabled).toBe(true);
    expect(celula('bits-1000').querySelector('[data-bits-pack-why]')!.textContent).toBe('400 Credits short');
    expect(celula('bits-500').querySelector('[data-bits-pack-why]')!.textContent).toBe('60 Credits short');
    expect(celula('bits-200').querySelector('[data-bits-pack-why]')).toBeNull();
    unmount();
    renderWithCss(<CreditExchange language="pt-BR" credits={400} onExchangeCredits={async () => true} say={say} />);
    expect(celula('bits-500').querySelector('[data-bits-pack-why]')!.textContent).toBe('Faltam 60 Créditos');
  });

  it('(a) teto do dia: o pacote que não cabe diz "Back tomorrow" / "Volta amanhã"', () => {
    noteBitsPackLeft(300, Date.now() + 3_600_000);
    const { unmount } = renderWithCss(<CreditExchange language="en-US" credits={5000} onExchangeCredits={async () => true} say={vi.fn()} />);
    expect(celula('bits-500').querySelector('[data-bits-pack-why]')!.textContent).toBe('Back tomorrow');
    expect(celula('bits-200').disabled).toBe(false);
    unmount();
    renderWithCss(<CreditExchange language="pt-BR" credits={5000} onExchangeCredits={async () => true} say={vi.fn()} />);
    expect(celula('bits-1000').querySelector('[data-bits-pack-why]')!.textContent).toBe('Volta amanhã');
  });

  it('(b) erro de rede: UMA mensagem, tocar no MESMO pacote', async () => {
    const say = vi.fn();
    renderWithCss(<CreditExchange language="en-US" credits={5000} onExchangeCredits={async () => ({ ok: false, reason: 'network' })} say={say} />);
    await comprar('bits-200');
    expect(say).toHaveBeenCalledTimes(1);
    expect(say.mock.calls[0][2]).toBe("Couldn't confirm. Tap the SAME pack again: it never charges twice.");
  });

  it('(b) recusa definitiva diz que os Créditos não foram gastos (PT)', async () => {
    const say = vi.fn();
    renderWithCss(<CreditExchange language="pt-BR" credits={5000} onExchangeCredits={async () => ({ ok: false, reason: 'daily-cap', leftToday: 0 })} say={say} />);
    await comprar('bits-200');
    expect(say).toHaveBeenCalledTimes(1);
    expect(String(say.mock.calls[0][2])).toMatch(/Créditos não foram gastos/);
  });

  it('(b) recusa já tratada por quem chama (false, ex.: demo): nenhuma mensagem a mais', async () => {
    const say = vi.fn();
    renderWithCss(<CreditExchange language="en-US" credits={5000} onExchangeCredits={async () => false} say={say} />);
    await comprar('bits-200');
    expect(say).not.toHaveBeenCalled();
  });

  it('(c) faltando saldo, o atalho "Get Credits" abre a compra de Créditos; com saldo para tudo, ele não aparece', () => {
    const onGetCredits = vi.fn();
    const { unmount } = renderWithCss(<CreditExchange language="en-US" credits={100} onExchangeCredits={async () => true} onGetCredits={onGetCredits} say={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Get Credits' }));
    expect(onGetCredits).toHaveBeenCalledTimes(1);
    unmount();
    renderWithCss(<CreditExchange language="pt-BR" credits={5000} onExchangeCredits={async () => true} onGetCredits={onGetCredits} say={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'Comprar Créditos' })).toBeNull();
  });

  it('(d) estimativa em reais só em PT; EN sem estimativa (sem preço de Crédito em USD no código)', () => {
    const { unmount } = renderWithCss(<CreditExchange language="pt-BR" credits={5000} onExchangeCredits={async () => true} say={vi.fn()} />);
    expect(celula('bits-200').querySelector('[data-bits-pack-brl]')!.textContent).toBe('cerca de R$ 9,95');
    unmount();
    renderWithCss(<CreditExchange language="en-US" credits={5000} onExchangeCredits={async () => true} say={vi.fn()} />);
    expect(document.querySelector('[data-bits-pack-brl]')).toBeNull();
  });
});
