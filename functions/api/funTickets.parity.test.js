import { describe, it, expect } from 'vitest';
import * as srv from './_funTickets.js';
import * as app from '../../src/utils/funTickets';

const NOW = Date.UTC(2026, 10, 9, 12);
const H = 3600_000;

describe('tickets: servidor e app concordam na forma', () => {
  it('mesmas constantes', () => {
    expect(srv.FUN_TICKET_BATCH).toBe(app.FUN_TICKET_BATCH);
    expect(srv.FUN_TICKET_MAX).toBe(app.FUN_TICKET_MAX);
    expect(srv.FUN_TICKET_BUY_AT_MOST).toBe(app.FUN_TICKET_BUY_AT_MOST);
    expect(srv.FUN_TICKET_TTL_MS).toBe(app.FUN_TICKET_TTL_MS);
    expect(srv.FUN_TICKET_MAX_BATCHES).toBe(app.FUN_TICKET_MAX_BATCHES);
  });
  it('mesma saneação em entradas boas e hostis', () => {
    const casos = [null, undefined, 3, 'x', [], {}, { batches: 'a' }, { batches: [{ at: 5, left: 99 }, { at: 'x', left: 1 }, { at: 3, left: 0 }, null, { at: 1, left: 2.9 }, { at: -1, left: 1 }, { at: NaN, left: 1 }] }];
    for (const c of casos) expect(srv.sanitizeFunTickets(c), JSON.stringify(c)).toEqual(app.sanitizeFunTickets(c));
  });
});

describe('servidor: anti-trapaça dos tickets', () => {
  const b = (at, left) => ({ batches: [{ at, left }] });
  it('gasto só desce: voltar o contador no JSON não devolve ticket', () => {
    expect(srv.enforceFunTickets(b(NOW - H, 3), b(NOW - H, 1), NOW)).toEqual(b(NOW - H, 1));
  });
  it('lote ZERADO persiste (tombstone): stored left 1 + incoming left 0 => servidor devolve left 0, e omitir depois não ressuscita', () => {
    const z = srv.enforceFunTickets(b(NOW - H, 0), b(NOW - H, 1), NOW);
    expect(z).toEqual(b(NOW - H, 0));
    expect(srv.enforceFunTickets(undefined, z, NOW)).toEqual(b(NOW - H, 0));
    expect(srv.enforceFunTickets(b(NOW - H, 3), z, NOW)).toEqual(b(NOW - H, 0)); // gasto só desce
    expect(srv.enforceFunTickets(b(NOW - 25 * H, 0), b(NOW - 25 * H, 0), NOW)).toBeUndefined(); // vence e some
    // lote NOVO zerado não entra; e o tombstone não conta como posse viva
    expect(srv.enforceFunTickets(b(NOW, 0), undefined, NOW)).toBeUndefined();
    const compra = srv.enforceFunTickets({ batches: [{ at: NOW - H, left: 0 }, { at: NOW, left: 3 }] }, z, NOW);
    expect(compra.batches.map((x) => x.left)).toEqual([0, 3]);
  });
  it('gasto legítimo passa', () => {
    expect(srv.enforceFunTickets(b(NOW - H, 1), b(NOW - H, 2), NOW)).toEqual(b(NOW - H, 1));
    expect(srv.enforceFunTickets(undefined, b(NOW - H, 2), NOW)).toEqual(b(NOW - H, 2)); // omitir não zera
  });
  it('lote novo só entra com posse viva <= 2; o 3º ticket bloqueia a compra', () => {
    const dois = srv.enforceFunTickets({ batches: [{ at: NOW - H, left: 2 }, { at: NOW, left: 3 }] }, b(NOW - H, 2), NOW);
    expect(dois.batches.map((x) => x.left)).toEqual([2, 3]);
    const tres = srv.enforceFunTickets({ batches: [{ at: NOW - H, left: 3 }, { at: NOW, left: 3 }] }, b(NOW - H, 3), NOW);
    expect(tres).toEqual(b(NOW - H, 3));
  });
  it('conta nova ganha o primeiro lote, mas nunca com mais de 3 tickets e no máximo um por gravação', () => {
    expect(srv.enforceFunTickets(b(NOW, 99), undefined, NOW)).toEqual(b(NOW, 3));
    const dois = srv.enforceFunTickets({ batches: [{ at: NOW - 2 * H, left: 3 }, { at: NOW - H, left: 3 }] }, undefined, NOW);
    expect(dois.batches.length).toBe(1);
  });
  it('lote vencido (24 h do relógio do servidor) some; lote de dias à frente é recusado', () => {
    expect(srv.enforceFunTickets(b(NOW - 25 * H, 3), b(NOW - 25 * H, 3), NOW)).toBeUndefined();
    expect(srv.enforceFunTickets(b(NOW + 5 * 86_400_000, 3), undefined, NOW)).toBeUndefined();
  });
  it('posse viva nunca passa de 5', () => {
    const r = srv.enforceFunTickets({ batches: [{ at: NOW - H, left: 2 }, { at: NOW, left: 3 }] }, b(NOW - H, 2), NOW);
    expect(r.batches.reduce((n, x) => n + x.left, 0)).toBeLessThanOrEqual(5);
  });
});
