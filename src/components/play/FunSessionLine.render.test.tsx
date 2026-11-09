// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { SalaoSheet } from './PlaySheets';
import type { FunTicketStatus } from '../../utils/funTickets';

const st = (o: Partial<FunTicketStatus>): (() => FunTicketStatus) => () => ({ count: 0, msLeft: 0, canBuy: true, canPlay: false, ...o });
const painel = (status: () => FunTicketStatus, language: 'pt-BR' | 'en-US' = 'pt-BR') =>
  render(<SalaoSheet language={language} onStart={() => {}} funStatus={status} onBuyTickets={() => {}} />).container;

afterEach(cleanup);

describe('Salão: o painel de tickets', () => {
  it('sem ticket mostra o custo da compra e o botão de comprar habilitado', () => {
    const c = painel(st({}));
    expect(c.querySelector('[data-fun-tickets-hint]')?.textContent).toBe('1 energia = 3 tickets (valem 24 h)');
    expect((c.querySelector('[data-fun-tickets-buy]') as HTMLButtonElement).disabled).toBe(false);
    expect(c.querySelector('[data-ticket-fan="0"]')).toBeTruthy();
    cleanup();
    expect(painel(st({}), 'en-US').querySelector('[data-fun-tickets-hint]')?.textContent).toBe('1 energy = 3 tickets (good for 24 h)');
  });
  it('com tickets: um bilhete no leque por ticket, contagem e validade do lote que vence primeiro', () => {
    const c = painel(st({ count: 3, canPlay: true, canBuy: false, buyRefusal: 'has-tickets', msLeft: 3_725_000 }));
    expect(c.querySelectorAll('[data-ticket-in-fan]').length).toBe(3);
    expect(c.querySelector('[data-fun-tickets-count]')?.textContent).toContain('3/5');
    expect(c.querySelector('[data-fun-tickets-expiry]')?.textContent).toBe('vence em 01:02:05');
    expect((c.querySelector('[data-fun-tickets-buy]') as HTMLButtonElement).disabled).toBe(true);
  });
  it('sem energia aponta para outras atividades, em PT e EN', () => {
    expect(painel(st({ canBuy: false, buyRefusal: 'no-energy' })).textContent).toContain('Ateliê da Mente');
    cleanup();
    expect(painel(st({ canBuy: false, buyRefusal: 'no-energy' }), 'en-US').textContent).toContain('Mind Atelier');
  });
  it('cada Jogar mostra o ticketzinho com x1 quando há painel de tickets', () => {
    const c = painel(st({ count: 2, canPlay: true }));
    for (const k of ['data-dino-start', 'data-ppt-start', 'data-match3-start', 'data-barrage-open']) {
      expect(c.querySelector(`[${k}] [data-ticket-cost="1"]`)?.textContent, k).toContain('x1');
    }
  });
});
