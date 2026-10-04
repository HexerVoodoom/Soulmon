import { describe, it, expect } from 'vitest';
import { shouldShowRestSetup, isMorning, REST_SETUP_DAY } from './restSetup';

describe('shouldShowRestSetup (G8)', () => {
  it('no dia do nascimento (dia 1) NÃO mostra', () => {
    expect(shouldShowRestSetup({ shown: false, bornAt: '2026-10-01', todayKey: '2026-10-01' })).toBe(false);
  });

  it('na primeira abertura do 2º dia mostra', () => {
    expect(REST_SETUP_DAY).toBe(2);
    expect(shouldShowRestSetup({ shown: false, bornAt: '2026-10-01', todayKey: '2026-10-02' })).toBe(true);
  });

  it('quem só volta depois (dia 5) vê no dia 5 — é o 2º dia de USO', () => {
    expect(shouldShowRestSetup({ shown: false, bornAt: '2026-10-01', todayKey: '2026-10-05' })).toBe(true);
  });

  it('uma vez só: com a flag gravada, nunca mais', () => {
    expect(shouldShowRestSetup({ shown: true, bornAt: '2026-10-01', todayKey: '2026-10-02' })).toBe(false);
  });

  it('sem nascimento legível, ou relógio que voltou, não mostra (silêncio, não palpite)', () => {
    expect(shouldShowRestSetup({ shown: false, bornAt: undefined, todayKey: '2026-10-02' })).toBe(false);
    expect(shouldShowRestSetup({ shown: false, bornAt: 'lixo', todayKey: '2026-10-02' })).toBe(false);
    expect(shouldShowRestSetup({ shown: false, bornAt: '2026-10-05', todayKey: '2026-10-02' })).toBe(false);
  });

  it('save sem `bornAt` usa a 1ª abertura do aparelho como nascimento (auditoria 02/10/2026)', () => {
    expect(shouldShowRestSetup({ shown: false, bornAt: undefined, firstOpenKey: '2026-10-01', todayKey: '2026-10-01' })).toBe(false);
    expect(shouldShowRestSetup({ shown: false, bornAt: undefined, firstOpenKey: '2026-10-01', todayKey: '2026-10-02' })).toBe(true);
    // o `bornAt` real manda quando existe
    expect(shouldShowRestSetup({ shown: false, bornAt: '2026-10-02', firstOpenKey: '2026-09-01', todayKey: '2026-10-02' })).toBe(false);
  });

  it('a hora não decide se aparece — só o texto (manhã antes das 12h)', () => {
    expect(isMorning(new Date(2026, 9, 2, 8, 0))).toBe(true);
    expect(isMorning(new Date(2026, 9, 2, 11, 59))).toBe(true);
    expect(isMorning(new Date(2026, 9, 2, 12, 0))).toBe(false);
    expect(isMorning(new Date(2026, 9, 2, 21, 0))).toBe(false);
  });
});
