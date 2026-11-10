import { describe, it, expect } from 'vitest';
import {
  GLITCHTAMA_JANELA_MS, aplicarBuffGlitchtama, glitchtamaBuffAtivo, glitchtamaDiasRestantes, glitchtamaExpiraEm,
  sanitizeGlitchtamaCarry, sanitizeGlitchtamaUsadoEm,
} from './glitchtamaBuff';

const T0 = Date.parse('2026-11-10T12:00:00Z');
const DIA = 86_400_000;

describe('janela de 7 dias', () => {
  it('buff ativo de usadoEm até usadoEm + 7d (exclusivo); expira e libera', () => {
    expect(GLITCHTAMA_JANELA_MS).toBe(7 * DIA);
    expect(glitchtamaBuffAtivo(T0, T0)).toBe(true);
    expect(glitchtamaBuffAtivo(T0, T0 + 7 * DIA - 1)).toBe(true);
    expect(glitchtamaBuffAtivo(T0, T0 + 7 * DIA)).toBe(false);
    expect(glitchtamaBuffAtivo(undefined, T0)).toBe(false);
    expect(glitchtamaExpiraEm(T0)).toBe(T0 + 7 * DIA);
  });
  it('relógio que volta continua dentro da janela', () => {
    expect(glitchtamaBuffAtivo(T0, T0 - 3 * DIA)).toBe(true);
  });
  it('dias restantes: 7 no primeiro instante, 1 no último, 0 depois', () => {
    expect(glitchtamaDiasRestantes(T0, T0)).toBe(7);
    expect(glitchtamaDiasRestantes(T0, T0 + 6.5 * DIA)).toBe(1);
    expect(glitchtamaDiasRestantes(T0, T0 + 7 * DIA)).toBe(0);
    expect(glitchtamaDiasRestantes(undefined, T0)).toBe(0);
  });
});

describe('saneamento do save', () => {
  it('lixo some; futuro absurdo vira "agora"; válido passa', () => {
    for (const v of [undefined, null, 'x', NaN, Infinity, -5, 0, {}]) expect(sanitizeGlitchtamaUsadoEm(v, T0)).toBeUndefined();
    expect(sanitizeGlitchtamaUsadoEm(T0 - DIA, T0)).toBe(T0 - DIA);
    expect(sanitizeGlitchtamaUsadoEm(T0 + 400 * DIA, T0)).toBe(T0);
    expect(sanitizeGlitchtamaCarry(5)).toBeLessThan(1);
    expect(sanitizeGlitchtamaCarry(-1)).toBe(0);
    expect(sanitizeGlitchtamaCarry('x')).toBe(0);
  });
});

describe('+10% sobre o ganho', () => {
  it('inativo: ganho igual, carry intocado', () => {
    expect(aplicarBuffGlitchtama(5, 0.3, false)).toEqual({ ganho: 5, carry: 0.3 });
  });
  it('ativo: ganho 5 -> 5 e carry 0.5; segundo dia -> 6 e carry 0', () => {
    const a = aplicarBuffGlitchtama(5, 0, true);
    expect(a.ganho).toBe(5);
    expect(a.carry).toBeCloseTo(0.5, 9);
    const b = aplicarBuffGlitchtama(5, a.carry, true);
    expect(b.ganho).toBe(6);
    expect(b.carry).toBeCloseTo(0, 9);
  });
  it('ganho grande rende o bônus inteiro (60 -> +6)', () => {
    expect(aplicarBuffGlitchtama(60, 0, true).ganho).toBe(66);
  });
  it('ganho zero não rende nada', () => {
    expect(aplicarBuffGlitchtama(0, 0.9, true)).toEqual({ ganho: 0, carry: 0.9 });
  });
});
