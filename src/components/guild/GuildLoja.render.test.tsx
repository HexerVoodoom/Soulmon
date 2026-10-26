/** @vitest-environment jsdom */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { GuildLoja } from './GuildLoja';
import type { GuildCasa } from '../../utils/community';
import { LOJA_ITENS } from '../../utils/guildLoja';

const casa = (loja: GuildCasa['loja']): GuildCasa => ({ nivel: 'haste', nivelIndex: 1, perto: false, bitsTotal: 0, slots: [], loja, mine: { slot: null, capReached: false } });
afterEach(cleanup);

describe('GuildLoja', () => {
  it('com saldo, compra manda só o itemId; sem saldo o botão descansa', () => {
    const onComprar = vi.fn();
    const barato = LOJA_ITENS.reduce((a, b) => (b.preco < a.preco ? b : a));
    const { container } = render(<GuildLoja casa={casa({ itens: [], saldo: barato.preco })} language="en-US" ocupado={false} onComprar={onComprar} />);
    fireEvent.click(container.querySelector(`[data-loja-comprar="${barato.id}"]`)!);
    expect(onComprar).toHaveBeenCalledWith(barato.id);
    const caro = LOJA_ITENS.find(i => i.preco > barato.preco)!;
    expect((container.querySelector(`[data-loja-comprar="${caro.id}"]`) as HTMLButtonElement).disabled).toBe(true);
  });
  it('item do clã vai para "Na casa" e sai da vitrine; servidor antigo (saldo nulo) não quebra', () => {
    const { container, rerender } = render(<GuildLoja casa={casa({ itens: ['loja-ampulheta'], saldo: 0 })} language="pt-BR" ocupado={false} onComprar={() => {}} />);
    expect(container.querySelector('[data-loja-dele="loja-ampulheta"]')).toBeTruthy();
    expect(container.querySelector('[data-loja-comprar="loja-ampulheta"]')).toBeNull();
    expect(screen.getByText('Na casa')).toBeTruthy();
    rerender(<GuildLoja casa={casa({ itens: [], saldo: null })} language="pt-BR" ocupado={false} onComprar={() => {}} />);
    expect(container.querySelector('[data-loja-saldo]')).toBeNull();
    expect(container.querySelectorAll('[data-loja-comprar]:not([disabled])').length).toBe(0);
  });
});
