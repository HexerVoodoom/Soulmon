import { describe, it, expect } from 'vitest';
import { shouldShowRestSetup, isMorning } from './restSetup';

describe('shouldShowRestSetup — horário de dormir obrigatório (D-24)', () => {
  it('aparece enquanto não confirmado: save novo, save antigo sem o campo e false explícito', () => {
    expect(shouldShowRestSetup({ confirmed: undefined })).toBe(true);
    expect(shouldShowRestSetup({ confirmed: false })).toBe(true);
  });

  it('some só depois de confirmar (true)', () => {
    expect(shouldShowRestSetup({ confirmed: true })).toBe(false);
  });

  it('a hora não decide se aparece — só o texto (manhã antes das 12h)', () => {
    expect(isMorning(new Date(2026, 9, 2, 8, 0))).toBe(true);
    expect(isMorning(new Date(2026, 9, 2, 11, 59))).toBe(true);
    expect(isMorning(new Date(2026, 9, 2, 12, 0))).toBe(false);
    expect(isMorning(new Date(2026, 9, 2, 21, 0))).toBe(false);
  });
});
