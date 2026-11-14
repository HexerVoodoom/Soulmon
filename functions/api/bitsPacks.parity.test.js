/**
 * PARIDADE dos PACOTES DE BITS (§373): o app (`src/utils/currencies.ts`) mostra e o servidor (`_bitsPacks.js`) cobra. Os dois têm
 * de dizer os MESMOS pacotes, preços e teto — senão a tela promete um câmbio e o servidor cobra outro.
 */
import { it, expect } from 'vitest';
import * as server from './_bitsPacks.js';
import * as app from '../../src/utils/currencies';

it('pacotes (id, Bits, Créditos) e teto do dia idênticos no app e no servidor', () => {
  expect(server.BITS_PACKS).toEqual(app.BITS_PACKS.map(p => ({ ...p })));
  expect(server.BITS_PACK_DAILY_CAP).toBe(app.BITS_PACK_DAILY_CAP);
});

it('o câmbio antigo saiu dos dois lados (CREDIT_TO_BITS / BITS_EXCHANGE)', () => {
  expect('CREDIT_TO_BITS' in app).toBe(false);
  expect('BITS_EXCHANGE' in app).toBe(false);
});
