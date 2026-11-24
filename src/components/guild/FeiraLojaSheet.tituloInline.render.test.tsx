// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { FeiraLojaSheet } from './FeiraLojaSheet';
import type { FeiraLoja } from '../../utils/feiraLoja';

afterEach(cleanup);

describe('FeiraLojaSheet: título inline (sem placa)', () => {
  it('tem [data-popup-titulo] e nenhuma placa', () => {
    const loja = { day: '2026-11-10', vendor: 'morcego', items: [{ id: 'x', type: 'material', kind: 'material', price: 9, was: 15, pct: 40, bought: false }] } as FeiraLoja;
    const ownership = { owned: [], equipped: [], ownedFurniture: [], equippedFurniture: [] } as never;
    render(<FeiraLojaSheet language="en-US" saveId="s" loja={loja} points={500} ownership={ownership} getState={() => ({})} onBuyShop={() => true} onHexBought={() => undefined} onClose={() => undefined} api={{ buy: async () => ({ price: 9 }) }} />);
    expect(document.querySelector('[data-popup-titulo]')).not.toBeNull();
    expect(document.querySelector('.sm2-moldura-modal__titulo')).toBeNull();
  });
});
