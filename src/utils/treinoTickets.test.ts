import { describe, it, expect } from 'vitest';
import { TREINO_TICKET_MATCHES, TREINO_EXTRA_TICKET_BITS, TREINO_EXTRA_TICKETS_MAX, sanitizeTreinoTickets, treinoBuyRefusal, chargeTreinoTicket } from './treinoTickets';

const tk = (played: number, extra: number) => sanitizeTreinoTickets({ played, extra })!;

describe('tickets do Treino (app)', () => {
  it('valores decididos pelo dono: 20 partidas, 30 Bits, 3 extras', () => {
    expect([TREINO_TICKET_MATCHES, TREINO_EXTRA_TICKET_BITS, TREINO_EXTRA_TICKETS_MAX]).toEqual([20, 30, 3]);
  });
  it('contador: grátis 20 com Honra; extra soma 20 sem Honra', () => {
    expect(tk(0, 0)).toMatchObject({ honorLeft: 20, left: 20, capacity: 20, canBuy: true });
    expect(tk(20, 0)).toMatchObject({ honorLeft: 0, left: 0 });
    expect(tk(25, 1)).toMatchObject({ honorLeft: 0, left: 15, capacity: 40 });
    expect(tk(80, 3)).toMatchObject({ left: 0, canBuy: false });
  });
  it('lixo vira undefined ou é limitado', () => {
    expect(sanitizeTreinoTickets(null)).toBeUndefined();
    expect(sanitizeTreinoTickets({ played: 'x', extra: 1 })).toBeUndefined();
    expect(sanitizeTreinoTickets({ played: -3, extra: 99 })).toMatchObject({ played: 0, extra: 3 });
  });
  it('recusa suave: sem teto de extras ou sem saldo (§373: o Bit de Crédito paga)', () => {
    expect(treinoBuyRefusal(tk(20, 3), { gamePoints: 999 })).toBe('max-extras');
    expect(treinoBuyRefusal(tk(20, 0), { gamePoints: 29 })).toBe('no-bits');
    expect(treinoBuyRefusal(tk(20, 0), { gamePoints: 100, bitsOrigin: { day: 'd', free: 0, fromCredits: 100, paidLeft: 80 } })).toBeUndefined();
    expect(treinoBuyRefusal(tk(20, 0), { gamePoints: 30 })).toBeUndefined();
  });
  it('cobra 30 Bits (o pago primeiro); sem saldo devolve o MESMO objeto (nada consumido)', () => {
    expect(chargeTreinoTicket({ gamePoints: 100 }).gamePoints).toBe(70);
    const pobre = { gamePoints: 29, bitsOrigin: { day: 'd', free: 0, fromCredits: 29, paidLeft: 29 } };
    expect(chargeTreinoTicket(pobre)).toBe(pobre);
    const ok = chargeTreinoTicket({ gamePoints: 130, bitsOrigin: { day: 'd', free: 0, fromCredits: 100, paidLeft: 100 } });
    expect(ok.gamePoints).toBe(100);
    expect(ok.bitsOrigin!.paidLeft).toBe(70); // §373: o Bit de Crédito paga, e sai primeiro
  });
});
