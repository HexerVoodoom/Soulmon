/**
 * Regressão F1 (beta-play-01): 'YYYY-MM-DD' lido por `new Date(str)` é meia-noite
 * UTC — em fuso negativo (todo o Brasil) vira o dia ANTERIOR. O teste fixa o fuso
 * por `process.env.TZ` (o Node relê a variável a cada mudança), então roda igual
 * em UTC, no Brasil ou no Japão, em qualquer máquina e no CI.
 */
import { afterAll, describe, expect, it } from 'vitest';
import { dayKeyToDate, weekChip, emptyRhythm } from './habitRhythm';
import { activitiesForWeekDay } from './dailyReset';
import { parseDayKeyLocal } from './dayKeyParse';

const TZ_ORIGINAL = process.env.TZ;
afterAll(() => {
  if (TZ_ORIGINAL === undefined) delete process.env.TZ;
  else process.env.TZ = TZ_ORIGINAL;
});

const FUSOS = ['America/Sao_Paulo', 'America/Los_Angeles', 'UTC', 'Asia/Tokyo', 'Pacific/Kiritimati'];

describe.each(FUSOS)('dayKey ISO no fuso %s', fuso => {
  const usar = () => { process.env.TZ = fuso; };

  it('dayKeyToDate devolve meia-noite LOCAL do mesmo dia (não o anterior)', () => {
    usar();
    const d = dayKeyToDate('2026-10-12');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 12, 0]);
  });

  it('dayKeyToDate continua lendo a chave de toDateString', () => {
    usar();
    const d = dayKeyToDate('Mon Oct 12 2026');
    expect([d.getFullYear(), d.getMonth(), d.getDate(), d.getHours()]).toEqual([2026, 9, 12, 0]);
  });

  it('parseDayKeyLocal: ISO local, toDateString local, lixo vira null', () => {
    usar();
    expect(parseDayKeyLocal('2026-10-12')?.getDate()).toBe(12);
    expect(parseDayKeyLocal('Mon Oct 12 2026')?.getDate()).toBe(12);
    expect(parseDayKeyLocal('2026-02-31')).toBeNull();
    expect(parseDayKeyLocal('nada')).toBeNull();
  });

  it('weekChip conta os dois dias gravados da semana (F1)', () => {
    usar();
    const agora = new Date(2026, 9, 12, 12, 0, 0); // segunda, meio-dia local
    const r = { ...emptyRhythm(), done: ['2026-10-11', '2026-10-12'] };
    expect(weekChip(r, { kind: 'timesPerWeek', target: 3 }, agora)).toEqual({ done: 2, target: 3 });
  });

  it('activitiesForWeekDay/dailyGoalFor aceita o dayKey ISO sem lançar', () => {
    usar();
    const state = { evolutionStage: 'rookie', activities: [] as { id?: string }[] };
    expect(activitiesForWeekDay(state, 1, '2026-10-12')).toEqual([]);
  });
});
