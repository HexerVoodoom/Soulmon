import { describe, it, expect } from 'vitest';
import { formatIceScore, iceScore, sanitizeIce, sortByIce, type Ice } from './iceScore';

const I = (recompensa: number, urgencia: number, esforco: number, tempo: number): Ice => ({ recompensa, urgencia, esforco, tempo });

describe('iceScore — (recompensa × urgência) ÷ (esforço × tempo)', () => {
  it('a conta, nos extremos e no meio', () => {
    expect(iceScore(I(5, 5, 1, 1))).toBe(25);
    expect(iceScore(I(1, 1, 5, 5))).toBeCloseTo(0.04, 10);
    expect(iceScore(I(3, 3, 3, 3))).toBe(1);
    expect(iceScore(I(4, 5, 2, 2))).toBe(5);
    expect(iceScore(I(5, 2, 4, 3))).toBeCloseTo(10 / 12, 10);
  });
  it('rende e vence logo e custa pouco sobe: mais recompensa/urgência sobe, mais esforço/tempo desce', () => {
    const base = I(3, 3, 3, 3);
    expect(iceScore({ ...base, recompensa: 4 })).toBeGreaterThan(iceScore(base));
    expect(iceScore({ ...base, urgencia: 4 })).toBeGreaterThan(iceScore(base));
    expect(iceScore({ ...base, esforco: 4 })).toBeLessThan(iceScore(base));
    expect(iceScore({ ...base, tempo: 4 })).toBeLessThan(iceScore(base));
  });
  it('nota fora da faixa é presa em 1..5: nunca NaN nem Infinity', () => {
    expect(Number.isFinite(iceScore(I(0, 0, 0, 0)))).toBe(true);
    expect(iceScore(I(99, 99, -4, NaN))).toBe(25);
  });
  it('formata com vírgula em PT e ponto em EN', () => {
    expect(formatIceScore(12.5, true)).toBe('12,5');
    expect(formatIceScore(12.5, false)).toBe('12.5');
    expect(formatIceScore(4, true)).toBe('4');
    expect(formatIceScore(0.04, true)).toBe('0,04');
    expect(formatIceScore(10 / 12, false)).toBe('0.83');
  });
});

describe('sanitizeIce — lixo vira "não classificada"', () => {
  it('aceita 4 inteiros de 1 a 5; o resto é undefined', () => {
    expect(sanitizeIce({ tempo: 1, esforco: 2, recompensa: 3, urgencia: 5 })).toEqual({ tempo: 1, esforco: 2, recompensa: 3, urgencia: 5 });
    for (const lixo of [null, undefined, 5, 'x', [], {}, { tempo: 1 }, { tempo: 0, esforco: 1, recompensa: 1, urgencia: 1 }, { tempo: 6, esforco: 1, recompensa: 1, urgencia: 1 }, { tempo: 1.5, esforco: 1, recompensa: 1, urgencia: 1 }, { tempo: '2', esforco: 1, recompensa: 1, urgencia: 1 }]) {
      expect(sanitizeIce(lixo)).toBeUndefined();
    }
  });
  it('descarta campo extra', () => {
    expect(sanitizeIce({ tempo: 1, esforco: 1, recompensa: 1, urgencia: 1, x: 9 })).toEqual({ tempo: 1, esforco: 1, recompensa: 1, urgencia: 1 });
  });
});

describe('sortByIce — ordenação e desempate estável', () => {
  const T = (id: string, ice?: Ice) => ({ id, ice });
  const ids = (l: Array<{ id: string }>) => l.map(x => x.id);
  it('maior pontuação no topo; NÃO classificadas no FIM, na ordem de criação', () => {
    const l = [T('sem1'), T('baixa', I(1, 1, 5, 5)), T('sem2'), T('alta', I(5, 5, 1, 1)), T('media', I(3, 3, 3, 3))];
    expect(ids(sortByIce(l))).toEqual(['alta', 'media', 'baixa', 'sem1', 'sem2']);
  });
  it('empate: urgência maior, depois recompensa maior, depois menor esforço, depois ordem de criação', () => {
    // todas valem 4
    const u4 = T('u4', I(2, 4, 2, 1)); // urgência 4
    const r4e2 = T('r4e2', I(4, 2, 2, 1)); // urg 2, rec 4, esf 2
    const r4e1 = T('r4e1', I(4, 2, 1, 2)); // urg 2, rec 4, esf 1
    const u1 = T('u1', I(4, 1, 1, 1)); // urgência 1
    const copia1 = T('copia1', I(4, 2, 1, 2)); // igual a r4e1: decide a ordem de criação
    const out = sortByIce([u1, r4e2, copia1, r4e1, u4]);
    for (const t of out) expect(iceScore(t.ice!)).toBe(4);
    expect(ids(out)).toEqual(['u4', 'copia1', 'r4e1', 'r4e2', 'u1']);
  });
  it('é determinística, não muda a entrada e a ordem de criação é a da entrada', () => {
    const l = [T('x', I(3, 3, 3, 3)), T('y', I(3, 3, 3, 3)), T('z', I(3, 3, 3, 3))];
    const copy = JSON.stringify(l);
    expect(ids(sortByIce(l))).toEqual(['x', 'y', 'z']);
    expect(ids(sortByIce(l))).toEqual(ids(sortByIce(l)));
    expect(JSON.stringify(l)).toBe(copy);
  });
  it('ice quebrado conta como não classificada', () => {
    const l = [T('a', { tempo: 9 } as unknown as Ice), T('b', I(1, 1, 5, 5))];
    expect(ids(sortByIce(l))).toEqual(['b', 'a']);
  });
});
