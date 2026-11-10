import { describe, it, expect } from 'vitest';
import {
  GLITCHTAMA_TESTE_ON, GLITCHTAMA_TESTE_COMPRAS_POR_DIA, GLITCHTAMA_TESTE_PRECO_BITS,
  buyGlitchtama, glitchtamaBoughtToday, glitchtamaBuyRefusal, glitchtamaBuysLeft, sanitizeGlitchtamaBuy,
} from './glitchtamaTeste';
import { GLITCHTAMA_EMOJI } from './shop';

const AGORA = new Date('2026-11-10T15:00:00Z');
import type { GlitchtamaBuyState } from './glitchtamaTeste';
const estado = (o: Partial<GlitchtamaBuyState> = {}): GlitchtamaBuyState => ({ gamePoints: 10, foodInventory: {}, ...o });

// A compra do 🌀 no Desfeito é EXCEÇÃO DE TESTE: tudo aqui segue a flag.
describe.skipIf(!GLITCHTAMA_TESTE_ON)('compra do Glitchtama no Desfeito (teste)', () => {
  it('debita o preço, entrega 1 na mochila e registra a compra do dia', () => {
    const { state, refused } = buyGlitchtama(estado(), AGORA);
    expect(refused).toBeUndefined();
    expect(state.gamePoints).toBe(10 - GLITCHTAMA_TESTE_PRECO_BITS);
    expect(state.foodInventory[GLITCHTAMA_EMOJI]).toBe(1);
    expect(glitchtamaBoughtToday(state, AGORA)).toBe(1);
    expect(glitchtamaBuysLeft(state, AGORA)).toBe(GLITCHTAMA_TESTE_COMPRAS_POR_DIA - 1);
  });

  it('a 4ª compra do dia é recusada (daily-cap) sem tocar no saldo nem no estoque', () => {
    let s = estado();
    for (let i = 0; i < GLITCHTAMA_TESTE_COMPRAS_POR_DIA; i++) s = buyGlitchtama(s, AGORA).state;
    const r = buyGlitchtama(s, AGORA);
    expect(r.refused).toBe('daily-cap');
    expect(r.state).toBe(s);
    expect(s.foodInventory[GLITCHTAMA_EMOJI]).toBe(GLITCHTAMA_TESTE_COMPRAS_POR_DIA);
  });

  it('sem Bits recusa (bits); no dia seguinte o direito volta', () => {
    expect(glitchtamaBuyRefusal(estado({ gamePoints: 0 }), AGORA)).toBe('bits');
    let s = estado();
    for (let i = 0; i < GLITCHTAMA_TESTE_COMPRAS_POR_DIA; i++) s = buyGlitchtama(s, AGORA).state;
    const amanha = new Date(AGORA.getTime() + 24 * 60 * 60 * 1000);
    expect(glitchtamaBuyRefusal(s, amanha)).toBeUndefined();
  });

  it('gasta o Bit PAGO primeiro (bitsOrigin.paidLeft nunca acima do saldo)', () => {
    const { state } = buyGlitchtama(estado({ gamePoints: 1, bitsOrigin: { day: 'x', fromCredits: 1, paidLeft: 1, freeToday: 0 } as never }), AGORA);
    expect(state.gamePoints).toBe(0);
    expect(state.bitsOrigin?.paidLeft).toBe(0);
  });
});

describe('sanitizeGlitchtamaBuy', () => {
  it('lixo vira undefined; válido é mantido e limitado', () => {
    expect(sanitizeGlitchtamaBuy(null)).toBeUndefined();
    expect(sanitizeGlitchtamaBuy({ day: 3 })).toBeUndefined();
    expect(sanitizeGlitchtamaBuy({ day: 'd', used: 2 })).toEqual({ day: 'd', used: 2 });
    expect(sanitizeGlitchtamaBuy({ day: 'd', used: 1e9 })).toEqual({ day: 'd', used: 1000 });
  });
});
