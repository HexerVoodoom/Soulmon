// @vitest-environment jsdom
/**
 * FEIRA DE VERDADE, recusa do app ANTES do servidor (QA 2026-11-11, médios 1 e 2): o servidor marca "comprado" na hora; se o app
 * ia recusar (material no teto; prato sem saldo), a folha NÃO chama o servidor — a oferta continua. §373: o Bit de Crédito paga o prato.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, fireEvent, waitFor } from '@testing-library/react';
import { FeiraLojaSheet } from './FeiraLojaSheet';
import { MATERIAL_CAP } from '../../utils/buildingQuests';
import type { FeiraLoja } from '../../utils/feiraLoja';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const loja = (id: string, type: 'material' | 'dish'): FeiraLoja => ({
  day: '2026-11-10', vendor: 'morcego',
  items: [{ id, type, kind: type, price: 9, was: 15, pct: 40, bought: false }],
} as FeiraLoja);
const ownership = { owned: [], equipped: [], ownedFurniture: [], equippedFurniture: [] } as never;

function montar(l: FeiraLoja, state: unknown, buy = vi.fn(async () => ({ price: 9 })), onBuyShop = vi.fn(() => true)) {
  render(<FeiraLojaSheet language="en-US" saveId="s" loja={l} points={500} ownership={ownership} getState={() => state} onBuyShop={onBuyShop} onHexBought={() => undefined} onClose={() => undefined} api={{ buy }} />);
  return { buy, onBuyShop };
}
const comprar = async (id: string) => {
  fireEvent.click(document.querySelector(`[data-feira-loja-buy="${id}"]`) as HTMLElement);
  const ok = await screen.findAllByRole('button', { name: /^(buy|confirm|comprar|confirmar)/i });
  fireEvent.click(ok[ok.length - 1]);
};

describe('FeiraLojaSheet: o app recusa antes do servidor', () => {
  it('material no teto: não chama o servidor e a oferta continua', async () => {
    const state = { gamePoints: 500, foodInventory: {}, buildingQuests: { day: '', visited: [], claimed: [], materials: { ore: MATERIAL_CAP } } };
    const { buy, onBuyShop } = montar(loja('material:ore', 'material'), state);
    await comprar('material:ore');
    await waitFor(() => expect(screen.getByText(/stock of this one is full/i)).toBeTruthy());
    expect(buy).not.toHaveBeenCalled();
    expect(onBuyShop).not.toHaveBeenCalled();
    expect(document.querySelector('[data-feira-loja-buy="material:ore"]')).toBeTruthy(); // não virou "Yours"
  });

  it('§373: prato de combate com saldo só de Crédito CHAMA o servidor (antes recusava no app)', async () => {
    const state = { gamePoints: 500, foodInventory: {}, bitsOrigin: { day: '', free: 0, fromCredits: 500, paidLeft: 500 } };
    const { buy } = montar(loja('dish:espetinho-de-vinha', 'dish'), state);
    await comprar('dish:espetinho-de-vinha');
    await waitFor(() => expect(buy).toHaveBeenCalledTimes(1));
  });

  it('compra aceita chama o servidor UMA vez mesmo com clique duplo no Confirmar', async () => {
    const state = { gamePoints: 500, foodInventory: {}, buildingQuests: { day: '', visited: [], claimed: [], materials: {} } };
    let solta: (v: { price: number }) => void = () => undefined;
    const buy = vi.fn(() => new Promise<{ price: number }>(r => { solta = r; }));
    const { onBuyShop } = montar(loja('material:ore', 'material'), state, buy as never);
    fireEvent.click(document.querySelector('[data-feira-loja-buy="material:ore"]') as HTMLElement);
    const ok = await screen.findAllByRole('button', { name: /^(buy|confirm)/i });
    const alvo = ok[ok.length - 1];
    fireEvent.click(alvo); fireEvent.click(alvo);
    solta({ price: 9 });
    await waitFor(() => expect(onBuyShop).toHaveBeenCalledTimes(1));
    expect(buy).toHaveBeenCalledTimes(1);
  });

  it('prato comprado (16/11/2026): abre o modal "Bought!" do mesmo componente, com .exe e "Saved in Files"', async () => {
    const state = { gamePoints: 500, foodInventory: { 'dish:cha-de-orvalho': 1 } };
    const { buy } = montar(loja('dish:cha-de-orvalho', 'dish'), state);
    await comprar('dish:cha-de-orvalho');
    await waitFor(() => expect(buy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(document.querySelector('[data-prato-feito]')).toBeTruthy());
    expect(document.querySelector('[data-prato-texto]')!.textContent).toBe('Bought! Dew Tea.exe');
    expect(document.querySelector('[data-prato-guardado]')!.textContent).toBe('Saved in Files · you have 1');
    fireEvent.click(document.querySelector('[data-prato-ok]') as HTMLElement);
    expect(document.querySelector('[data-prato-feito]')).toBeNull();
  });
});
