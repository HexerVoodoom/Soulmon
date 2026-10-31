import { describe, it, expect } from 'vitest';
import { tzOffsetMs } from './tzOffset';

describe('tzOffsetMs', () => {
  it('São Paulo é −3h e Tóquio +9h', () => {
    const t = new Date('2026-10-30T12:00:00Z');
    expect(tzOffsetMs(t, 'America/Sao_Paulo')).toBe(-3 * 3600_000);
    expect(tzOffsetMs(t, 'Asia/Tokyo')).toBe(9 * 3600_000);
  });

  it('regressão: instante com milissegundos não entorta o offset', () => {
    const t = new Date('2026-10-30T12:00:00.750Z');
    expect(tzOffsetMs(t, 'America/Sao_Paulo')).toBe(-3 * 3600_000);
    expect(tzOffsetMs(t, 'UTC')).toBe(0);
  });

  it('fuso inválido lança RangeError', () => {
    expect(() => tzOffsetMs(new Date(), 'Nada/Aqui')).toThrow(RangeError);
  });
});
