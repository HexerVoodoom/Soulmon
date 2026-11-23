import { describe, it, expect } from 'vitest';
import {
  FUN_TICKET_BATCH, FUN_TICKET_MAX, FUN_TICKET_PER_ROUND, FUN_TICKET_TTL_MS, sanitizeFunTickets, ticketCount, nextExpiryMs,
  funTicketStatus, buyFunTickets, startFunRound, type FunTicketState,
} from './funTickets';

const NOW = Date.UTC(2026, 10, 9, 12, 0, 0);
const H = 3600_000;
/** Energia cheia e fome boa: `settleEnergy` não mexe. */
const base = (extra: Partial<FunTicketState> = {}): FunTicketState => ({ energyPoints: 5, hunger: { v: 100, at: NOW }, ...extra } as FunTicketState);
const com = (...batches: { at: number; left: number }[]) => base({ funTickets: { batches } });

describe('tickets dos minijogos', () => {
  it('constantes do dono: lote de 3, teto 5, 24 h', () => {
    expect(FUN_TICKET_BATCH).toBe(3);
    expect(FUN_TICKET_MAX).toBe(5);
    expect(FUN_TICKET_TTL_MS).toBe(24 * H);
  });

  it('comprar sem ticket: cobra 1 energia e dá 3 tickets', () => {
    const s = buyFunTickets(base(), NOW);
    expect(ticketCount(s, NOW)).toBe(3);
    expect(Number(s.energyPoints)).toBe(4);
  });

  it('limites 2/3/5: com 0, 1 e 2 compra (chega a 3, 4, 5); com 3, 4 e 5 bloqueia', () => {
    for (const [n, ok] of [[0, true], [1, true], [2, true], [3, false], [4, false], [5, false]] as const) {
      const st = n ? com({ at: NOW - H, left: n }) : base();
      const out = buyFunTickets(st, NOW);
      expect(funTicketStatus(st, NOW).canBuy, `n=${n}`).toBe(ok);
      if (ok) { expect(ticketCount(out, NOW)).toBe(n + 3); expect(ticketCount(out, NOW)).toBeLessThanOrEqual(FUN_TICKET_MAX); } else expect(out).toBe(st);
    }
    expect(funTicketStatus(com({ at: NOW, left: 3 }), NOW).buyRefusal).toBe('has-tickets');
  });

  it('sem energia não compra (mesma referência, motivo no-energy)', () => {
    const st = base({ energyPoints: 0 });
    expect(buyFunTickets(st, NOW)).toBe(st);
    expect(funTicketStatus(st, NOW).buyRefusal).toBe('no-energy');
  });

  it('cada lote mantém o próprio relógio e gasta-se primeiro o que vence antes', () => {
    const velho = { at: NOW - 20 * H, left: 2 };
    const s1 = buyFunTickets(com(velho), NOW);
    expect(s1.funTickets!.batches).toEqual([velho, { at: NOW, left: 3 }]);
    expect(nextExpiryMs(s1, NOW)).toBe(4 * H);
    const s2 = startFunRound(s1, NOW);
    expect(s2.funTickets!.batches).toEqual([{ at: velho.at, left: 1 }, { at: NOW, left: 3 }]);
  });

  it('expiração: ticket com 24 h ou mais some e não conta; relógio que voltou também não vale', () => {
    expect(ticketCount(com({ at: NOW - 24 * H + 1, left: 3 }), NOW)).toBe(3);
    expect(ticketCount(com({ at: NOW - 24 * H, left: 3 }), NOW)).toBe(0);
    expect(ticketCount(com({ at: NOW + 1000, left: 3 }), NOW)).toBe(0);
    // vencido libera a compra e sai do save na compra
    const s = buyFunTickets(com({ at: NOW - 30 * H, left: 3 }), NOW);
    expect(s.funTickets!.batches).toEqual([{ at: NOW, left: 3 }]);
  });

  it('gasto: 3 → 2 → 1 → 0, e sem ticket recusa com a MESMA referência', () => {
    let s = buyFunTickets(base(), NOW);
    for (const esperado of [2, 1, 0]) { s = startFunRound(s, NOW); expect(ticketCount(s, NOW)).toBe(esperado); }
    expect(startFunRound(s, NOW)).toBe(s);
    expect(funTicketStatus(s, NOW).canPlay).toBe(false);
  });

  it('o último ticket deixa o lote ZERADO (tombstone left:0) no save, sem contar nem aparecer como validade', () => {
    let s = buyFunTickets(base(), NOW);
    for (let i = 0; i < 3; i++) s = startFunRound(s, NOW);
    expect(s.funTickets!.batches).toEqual([{ at: NOW, left: 0 }]);
    expect(ticketCount(s, NOW)).toBe(0);
    expect(funTicketStatus(s, NOW).msLeft).toBe(0);
  });

  it('gastar ticket não gasta energia', () => {
    const s = buyFunTickets(base(), NOW);
    expect(Number(startFunRound(s, NOW).energyPoints)).toBe(Number(s.energyPoints));
  });

  it('sanitizador: lixo vira undefined/limpo, left é limitado a 3, lote vazio sai', () => {
    for (const x of [null, 3, 'x', [], {}, { batches: 'a' }]) expect(sanitizeFunTickets(x)).toBeUndefined();
    expect(sanitizeFunTickets({ batches: [{ at: 5, left: 99 }, { at: 'x', left: 1 }, { at: 3, left: 0 }, null, { at: 1, left: 2.9 }] }))
      .toEqual({ batches: [{ at: 1, left: 2 }, { at: 3, left: 0 }, { at: 5, left: 3 }] });
  });

  it('uma partida gasta exatamente FUN_TICKET_PER_ROUND (o número do "x1" do modal de compra)', () => {
    const s = com({ at: NOW - 1000, left: 3 });
    expect(ticketCount(s, NOW) - ticketCount(startFunRound(s, NOW), NOW)).toBe(FUN_TICKET_PER_ROUND);
    expect(FUN_TICKET_PER_ROUND).toBe(1);
  });
});
