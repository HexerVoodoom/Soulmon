import { describe, it, expect } from 'vitest';
import { applyFrameBuy, frameBuyRefusal } from './frameBuy';
import { FRAMES } from './frames';

const loja = FRAMES.find(f => f.origin === 'shop')!;
const rank = FRAMES.find(f => f.origin === 'rank')!;

describe('compra de moldura (C3)', () => {
  it('debita o preço em Bits e põe a moldura na posse', () => {
    const { state, refused } = applyFrameBuy({ gamePoints: loja.price! + 5, ownedFrames: [] }, loja.id);
    expect(refused).toBeUndefined();
    expect(state.gamePoints).toBe(5);
    expect(state.ownedFrames).toEqual([loja.id]);
  });
  it('recusa: sem saldo, já tem, e moldura que não é de loja (rank/evento) nunca se compra', () => {
    expect(frameBuyRefusal({ gamePoints: 1 }, loja.id)).toBe('no-funds');
    expect(frameBuyRefusal({ gamePoints: 9999, ownedFrames: [loja.id] }, loja.id)).toBe('already-owned');
    expect(frameBuyRefusal({ gamePoints: 9999 }, rank.id)).toBe('not-for-sale');
    expect(frameBuyRefusal({ gamePoints: 9999 }, 'nao-existe')).toBe('not-for-sale');
  });
  it('dois toques no mesmo lote com saldo == preço: a segunda passada devolve o prev (sem cobrar nem duplicar)', () => {
    const um = applyFrameBuy({ gamePoints: loja.price!, ownedFrames: [] }, loja.id).state;
    const dois = applyFrameBuy(um, loja.id);
    expect(dois.refused).toBeTruthy();
    expect(dois.state).toBe(um);
    expect(um.gamePoints).toBe(0);
  });
});
