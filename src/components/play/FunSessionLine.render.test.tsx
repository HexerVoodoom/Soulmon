// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SalaoSheet } from './PlaySheets';
import { TicketFan, TicketCost } from './TicketFan';
import type { FunTicketStatus } from '../../utils/funTickets';

const st = (o: Partial<FunTicketStatus>): (() => FunTicketStatus) => () => ({ count: 0, msLeft: 0, canBuy: true, canPlay: false, ...o });
const painel = (status: () => FunTicketStatus, language: 'pt-BR' | 'en-US' = 'pt-BR') =>
  render(<SalaoSheet language={language} onStart={() => {}} funStatus={status} onBuyTickets={() => {}} />).container;

afterEach(cleanup);

describe('Salão: o painel de tickets', () => {
  it('sem ticket mostra o custo da compra e o botão de comprar habilitado', () => {
    const c = painel(st({}));
    expect(c.querySelector('[data-fun-tickets-hint]')).toBeNull();
    expect((c.querySelector('[data-fun-tickets-buy]') as HTMLButtonElement).disabled).toBe(false);
    expect(c.querySelector('[data-ticket-fan]')).toBeNull(); // o leque mora FORA do modal (sem faixa reservada)
    cleanup();
    expect(painel(st({}), 'en-US').querySelector('[data-fun-tickets-hint]')).toBeNull();
  });
  it('com tickets: contagem e validade do lote que vence primeiro (o leque fica fora do modal)', () => {
    const c = painel(st({ count: 3, canPlay: true, canBuy: false, buyRefusal: 'has-tickets', msLeft: 3_725_000 }));
    expect(c.querySelector('[data-ticket-fan]')).toBeNull();
    expect(c.querySelector('[data-fun-tickets-count]')?.textContent).toContain('3/5');
    expect(c.querySelector('[data-fun-tickets-expiry]')?.textContent).toBe('vence em 01:02:05');
    expect((c.querySelector('[data-fun-tickets-buy]') as HTMLButtonElement).disabled).toBe(true);
  });
  it('sem energia aponta para outras atividades, em PT e EN', () => {
    expect(painel(st({ canBuy: false, buyRefusal: 'no-energy' })).textContent).toContain('Ateliê da Mente');
    cleanup();
    expect(painel(st({ canBuy: false, buyRefusal: 'no-energy' }), 'en-US').textContent).toContain('Mind Atelier');
  });
  it('o custo (sempre 1 ticket) NÃO se repete embaixo de cada carta: o painel de tickets já informa', () => {
    const c = painel(st({ count: 2, canPlay: true }));
    for (const k of ['dino', 'ppt', 'match3', 'barrage']) {
      expect(c.querySelector(`[data-game-card="${k}"] [data-ticket-cost]`), k).toBeNull();
      expect(c.querySelector(`[data-game-card="${k}"] [data-game-card-ganho]`)?.textContent, k).toBeTruthy();
    }
  });
});

describe('leque de tickets (fora do modal, na zona do NPC)', () => {
  it('sem ticket não desenha nada (nenhum vão reservado)', () => {
    const { container } = render(<TicketFan count={0} language="pt-BR" />);
    expect(container.firstChild).toBeNull();
  });
  it('um bilhete por ticket, quase em pé (-90° ± leque) e com tamanho em dvh', () => {
    for (const n of [1, 3, 5]) {
      cleanup();
      const { container } = render(<TicketFan count={n} language="en-US" />);
      const fan = container.querySelector('[data-ticket-fan]') as HTMLElement;
      expect(fan.getAttribute('aria-label')).toBe(`${n} ${n === 1 ? 'ticket' : 'tickets'}`);
      const itens = container.querySelectorAll<HTMLElement>('[data-ticket-in-fan]');
      expect(itens.length).toBe(n);
      expect(itens[0].style.width).toMatch(/dvh$/);
      expect(itens[0].style.transformOrigin).toBe('0% 50%');
    }
  });
  it('o ticketzinho do botão fica inclinado a -45° e mostra a quantidade', () => {
    const { container } = render(<TicketCost amount={1} />);
    expect((container.querySelector('[data-ticket-cost-icon]') as HTMLElement).style.transform).toBe('rotate(-45deg)');
    expect(container.querySelector('[data-ticket-cost]')?.textContent).toContain('x1');
  });
});
