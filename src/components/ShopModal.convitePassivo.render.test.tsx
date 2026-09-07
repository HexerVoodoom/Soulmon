// @vitest-environment jsdom
/**
 * WP5.1 — o convite de compra na Loja é PASSIVO, e "passivo" tem posição.
 *
 * A primeira versão renderizava o cartão no TOPO do segmento, acima do
 * catálogo. Loja que abre na vitrine paga é loja que não confia no próprio
 * catálogo — e o aceite do pacote diz o contrário: quem veio gastar Bits vê
 * primeiro o que os Bits compram.
 *
 * O screenshot pegou isso uma vez. Screenshot não roda no CI; este teste sim.
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ShopModal } from './ShopModal';

const base = {
  language: 'pt-BR' as const,
  points: 400,
  emblems: 0,
  credits: 0,
  ownedBackgrounds: [] as string[],
  equippedBackground: null,
  ownedFurniture: [] as string[],
  equippedDecor: {},
  onBuy: () => true,
  onExchangeCredits: async () => true,
  onEquip: () => {},
  onEquipFurniture: () => {},
  onClose: () => {},
  missionProgress: {} as Record<string, number>,
};

// `any` local e deliberado: `ShopModal` tem dezenas de props e o objetivo
// aqui é variar TRÊS. Tipar o resto seria copiar a assinatura do componente
// para dentro do teste — outra cópia que diverge em silêncio.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const abrir = (props: Record<string, unknown>) =>
  renderWithCss(<ShopModal {...(base as any)} {...(props as any)} />);

describe('ShopModal — convite passivo', () => {
  it('o convite vem DEPOIS do catálogo, nunca antes', () => {
    abrir({ accountTier: 'demo', onUnlock: () => {} });
    const convite = screen.getByText(/fica aqui sempre que você quiser olhar/i);
    const itens = screen.getByText('Itens');
    // `DOCUMENT_POSITION_FOLLOWING` = o convite aparece depois, na ordem do DOM
    // (que é a ordem de leitura e a ordem do leitor de tela).
    expect(itens.compareDocumentPosition(convite) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('quem já pagou não vê convite nenhum', () => {
    abrir({ accountTier: 'paid', onUnlock: () => {} });
    expect(screen.queryByText(/fica aqui sempre que você quiser olhar/i)).toBeNull();
  });

  it('sem `onUnlock` não há convite — nada de botão que não leva a lugar nenhum', () => {
    abrir({ accountTier: 'demo' });
    expect(screen.queryByText(/fica aqui sempre que você quiser olhar/i)).toBeNull();
  });
});
