import { describe, it, expect } from 'vitest';
import { playerDayIso, playerDayKey } from './playerDay';

/**
 * `playerDayIso` é o MESMO dia de `playerDayKey`, só escrito em ISO — a
 * Revisão da Malha faz conta de dias com ele. As duas formas nunca podem
 * discordar de QUE dia é (footgun 9: duas regras de dia divergiriam em
 * silêncio, e um cartão venceria um dia antes num fuso e depois no outro).
 */
describe('playerDayIso', () => {
  const instantes = [
    new Date('2026-09-30T02:30:00Z'),
    new Date('2026-12-31T23:59:00Z'),
    new Date('2027-01-01T00:01:00Z'),
    new Date('2026-02-28T12:00:00Z'),
  ];
  const ancoras = [
    { zone: 'America/Sao_Paulo' },
    { zone: 'Asia/Tokyo' },
    { offsetMs: 14 * 3600_000 },
  ];

  it('tem formato YYYY-MM-DD', () => {
    expect(playerDayIso(instantes[0], ancoras[0])).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('concorda com playerDayKey sobre qual é o dia, em qualquer âncora', () => {
    for (const now of instantes) {
      for (const a of ancoras) {
        const key = playerDayKey(now, a);
        const iso = playerDayIso(now, a);
        const d = new Date(key);
        const pad = (n: number) => String(n).padStart(2, '0');
        expect(iso, `${now.toISOString()} ${JSON.stringify(a)}`).toBe(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
      }
    }
  });

  it('sem âncora, é o dia local do aparelho (mesmo fallback de playerDayKey)', () => {
    const now = new Date(2026, 8, 30, 10, 0);
    expect(playerDayIso(now, undefined)).toBe('2026-09-30');
  });
});
