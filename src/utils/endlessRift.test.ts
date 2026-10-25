import { describe, it, expect } from 'vitest';
import { applyRiftLayer, currentRiftMonth, riftBestThisMonth, riftMonthKey, sanitizeRiftMonth, RIFT_TIERS, riftTierTotals, type RiftMonthState } from './endlessRift';

const OCT = Date.UTC(2026, 9, 25, 12);
const NOV = Date.UTC(2026, 10, 1, 0, 0, 1);

describe('Endless Rift — score mensal', () => {
  it('chave de mês em UTC', () => {
    expect(riftMonthKey(Date.UTC(2026, 9, 31, 23, 59))).toBe('2026-10');
    expect(riftMonthKey(NOV)).toBe('2026-11');
  });
  it('save antigo sem o campo = score 0 no mês atual; lixo é ignorado', () => {
    expect(riftBestThisMonth({}, OCT)).toBe(0);
    expect(sanitizeRiftMonth({ m: 'x' })).toBeUndefined();
    expect(sanitizeRiftMonth(null)).toBeUndefined();
    expect(sanitizeRiftMonth({ m: '2026-10', best: 99999, claimed: -4 })).toEqual({ m: '2026-10', best: 999, claimed: 0 });
  });
  it('o mês novo reinicia o placar e as faixas', () => {
    let s: RiftMonthState = applyRiftLayer({}, 120, OCT).next;
    expect(s.riftMonth).toEqual({ m: '2026-10', best: 120, claimed: 2 });
    expect(currentRiftMonth(s.riftMonth, NOV)).toEqual({ m: '2026-11', best: 0, claimed: 0 });
    const r = applyRiftLayer(s, 30, NOV);
    expect(r.next.riftMonth).toEqual({ m: '2026-11', best: 30, claimed: 1 });
    expect(r.newTiers.map(t => t.tier)).toEqual([1]);
  });
  it('cada faixa paga UMA vez por mês; repetir a camada não paga de novo (idempotente)', () => {
    const a = applyRiftLayer({}, 25, OCT);
    expect(a.newTiers.map(t => t.tier)).toEqual([1]);
    const b = applyRiftLayer(a.next, 25, OCT);
    expect(b.newTiers).toEqual([]);
    expect(b.next).toBe(a.next);
    const c = applyRiftLayer(a.next, 250, OCT); // pula direto: paga as duas faixas que faltavam
    expect(c.newTiers.map(t => t.tier)).toEqual([2, 3]);
    expect(riftTierTotals(c.newTiers)).toEqual({ fragments: 0, bits: 100 });
  });
  it('camada mais rasa que o melhor do mês não rebaixa nada', () => {
    const a = applyRiftLayer({}, 100, OCT);
    expect(applyRiftLayer(a.next, 3, OCT).next).toBe(a.next);
  });
  it('limiares conservadores e crescentes; Bits só na faixa 2 (pelo funil), nunca Créditos', () => {
    expect(RIFT_TIERS.map(t => t.layer)).toEqual([25, 100, 250]);
    expect(RIFT_TIERS.filter(t => t.bits > 0).map(t => t.tier)).toEqual([2]);
    expect(Object.keys(RIFT_TIERS[0])).not.toContain('credits');
  });
});
