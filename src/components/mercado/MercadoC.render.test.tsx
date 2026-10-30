// @vitest-environment jsdom
/**
 * Faixa C da revisão 2 (18/10/2026): C2 (Conquistas: cadeado / Comprar + preço) e C3 (lojinha da Panora separada em
 * Molduras / Backgrounds, com Bits / Honra dentro de cada uma).
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent, within } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { MercadoStallSheet, ConquistasSheet } from './MercadoSheets';
import { MISSIONS } from '../../utils/missions';
import { SHOP_ITEMS } from '../../utils/shop';
import { FRAMES } from '../../utils/frames';

const m = MISSIONS.find(x => x.bgReward === 'bg-mission-dinoland')!;
const reward = SHOP_ITEMS.find(i => i.id === m.bgReward)!;

describe('C2 - Conquistas: bloqueado com cadeado, liberado com Comprar + preço', () => {
  const abrir = (over: { progress?: Record<string, number>; claimed?: string[]; owned?: string[]; balance?: number; onBuy?: (id: string) => boolean }) =>
    renderWithCss(
      <ConquistasSheet
        language="en-US"
        missionProgress={over.progress ?? {}}
        claimed={over.claimed ?? []}
        shop={{ ownedBackgrounds: over.owned ?? [], balance: over.balance ?? 1000, onBuy: over.onBuy ?? (() => true) }}
      />,
    );
  const irParaJogos = () => fireEvent.click(screen.getByRole('tab', { name: 'Games' }));

  it('conquista não cumprida: o item mostra o cadeado e NÃO tem botão de comprar', () => {
    abrir({});
    irParaJogos();
    const card = document.querySelector(`[data-mission="${m.id}"]`)!;
    expect(card.querySelector('[data-mission-locked]')).toBeTruthy();
    expect(card.querySelector('[data-mission-buy]')).toBeNull();
  });

  it('cumprida e resgatada: Comprar + preço; dois toques (Comprar, Confirmar) chamam onBuy com o id do cenário', () => {
    const onBuy = vi.fn(() => true);
    abrir({ progress: { [m.id]: m.target }, claimed: [m.id], onBuy });
    irParaJogos();
    const card = document.querySelector(`[data-mission="${m.id}"]`) as HTMLElement;
    const buy = card.querySelector(`[data-mission-buy="${reward.id}"]`) as HTMLElement;
    expect(buy.textContent).toContain(`${reward.price} Bits`);
    expect(card.querySelector('[data-mission-locked]')).toBeNull();
    fireEvent.click(buy);
    expect(onBuy).not.toHaveBeenCalled();
    fireEvent.click(card.querySelector(`[data-mission-buy-confirm="${reward.id}"]`)!);
    expect(onBuy).toHaveBeenCalledWith(reward.id);
    expect(card.querySelector('[data-mission-buy-flash]')!.textContent).toMatch(/purchased/);
  });

  it('cumprida mas NÃO resgatada continua bloqueada (resgatar libera a compra)', () => {
    abrir({ progress: { [m.id]: m.target }, claimed: [] });
    irParaJogos();
    const card = document.querySelector(`[data-mission="${m.id}"]`)!;
    expect(card.querySelector('[data-mission-locked]')).toBeTruthy();
    expect(card.querySelector('[data-mission-buy]')).toBeNull();
  });

  it('sem saldo: avisa e não pede confirmação; já comprado: "Yours", sem botão', () => {
    const r = abrir({ progress: { [m.id]: m.target }, claimed: [m.id], balance: 1 });
    irParaJogos();
    fireEvent.click(document.querySelector(`[data-mission-buy="${reward.id}"]`)!);
    expect(document.querySelector('[data-mission-buy-confirm]')).toBeNull();
    expect(document.querySelector('[data-mission-buy-flash]')!.textContent).toMatch(/Not enough Bits/);
    r.unmount();
    abrir({ progress: { [m.id]: m.target }, claimed: [m.id], owned: [reward.id] });
    irParaJogos();
    expect(document.querySelector('[data-mission-owned]')).toBeTruthy();
    expect(document.querySelector('[data-mission-buy]')).toBeNull();
  });
});

describe('C3 - Panora: Molduras / Backgrounds separados, Bits / Honra dentro', () => {
  const base = {
    language: 'en-US' as const, points: 2000, emblems: 5,
    ownedBackgrounds: ['bg-room'] as string[], equippedBackground: 'bg-room' as string | null,
    ownedFurniture: [] as string[], equippedDecor: {}, missionProgress: {} as Record<string, number>,
    onBuy: () => true, onExchangeCredits: async () => true, onEquip: () => {}, onEquipFurniture: () => {},
  };
  const shopFrame = FRAMES.find(f => f.origin === 'shop')!;

  it('abre em Backgrounds (como antes) e a aba Molduras mostra só molduras de loja, sem item de background', () => {
    renderWithCss(<MercadoStallSheet {...base} stall="background" />);
    expect(document.querySelector('[data-shop-shelf]')).toBeTruthy();
    fireEvent.click(screen.getByRole('tab', { name: 'Frames' }));
    expect(document.querySelector('[data-shop-shelf]')).toBeNull();
    const shelf = document.querySelector('[data-frame-shelf]') as HTMLElement;
    expect(shelf.querySelectorAll('[data-frame-item]').length).toBe(FRAMES.filter(f => f.origin === 'shop').length);
    expect(within(shelf).getByRole('button', { name: new RegExp(`for ${shopFrame.price} Bits`) })).toBeTruthy();
  });

  it('comprar moldura: Comprar -> Confirmar chama onBuyFrame; Honra vem vazia', () => {
    const onBuyFrame = vi.fn(() => true);
    renderWithCss(<MercadoStallSheet {...base} stall="background" onBuyFrame={onBuyFrame} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Frames' }));
    fireEvent.click(document.querySelector(`[data-frame-buy="${shopFrame.id}"]`)!);
    expect(onBuyFrame).not.toHaveBeenCalled();
    fireEvent.click(document.querySelector(`[data-frame-confirm="${shopFrame.id}"]`)!);
    expect(onBuyFrame).toHaveBeenCalledWith(shopFrame.id);
    fireEvent.click(screen.getByRole('tab', { name: 'Honor' }));
    expect(document.querySelector('[data-frame-shelf-empty]')).toBeTruthy();
  });

  it('moldura já tida mostra "Yours"', () => {
    renderWithCss(<MercadoStallSheet {...base} stall="background" ownedFrames={[shopFrame.id]} />);
    fireEvent.click(screen.getByRole('tab', { name: 'Frames' }));
    expect(document.querySelector(`[data-frame-item="${shopFrame.id}"] [data-frame-owned]`)).toBeTruthy();
  });

  it('decoração não tem a aba Frames', () => {
    renderWithCss(<MercadoStallSheet {...base} stall="decoracao" />);
    expect(screen.queryByRole('tab', { name: 'Frames' })).toBeNull();
  });
});
