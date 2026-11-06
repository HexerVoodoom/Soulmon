import { describe, it, expect } from 'vitest';
import { buildSeasonHistoryView, placeLabel, prevSeasonKey, seasonMonthLabel } from './seasonHistoryView';
import type { SeasonHistory } from './community';

const hist = (over: Partial<SeasonHistory> = {}): SeasonHistory => ({ seasons: [], best: null, last: null, lastSeason: '2026-10', ...over });

describe('seasonHistoryView', () => {
  it('ordinal PT e EN', () => {
    expect(placeLabel(1, 'pt-BR')).toBe('1º');
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23, 101, 111].map(n => placeLabel(n, 'en-US')))
      .toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '23rd', '101st', '111th']);
  });

  it('mês da temporada em UTC, nos dois idiomas', () => {
    expect(seasonMonthLabel('2026-10', 'en-US')).toBe('October 2026');
    expect(seasonMonthLabel('2026-10', 'pt-BR')).toBe('Outubro de 2026');
    expect(seasonMonthLabel('2026-01', 'en-US')).toBe('January 2026');
  });

  it('prevSeasonKey vira o ano', () => {
    expect(prevSeasonKey(new Date(Date.UTC(2026, 10, 6)))).toBe('2026-10');
    expect(prevSeasonKey(new Date(Date.UTC(2027, 0, 1)))).toBe('2026-12');
  });

  it('nunca jogou: sem lista, sem melhor, última = null (a pílula mostra "—")', () => {
    const v = buildSeasonHistoryView(hist(), [], '2026-10');
    expect(v).toEqual({ seasons: [], best: null, lastPlace: null });
  });

  it('ordena do mais recente, acha a melhor e a última', () => {
    const v = buildSeasonHistoryView(hist({ seasons: [
      { season: '2026-10', place: 12, points: 40 }, { season: '2026-08', place: 2, points: 90 }, { season: '2026-09', place: 7, points: 60 },
    ] }), [], '2026-10');
    expect(v.seasons.map(s => s.season)).toEqual(['2026-10', '2026-09', '2026-08']);
    expect(v.best).toEqual({ season: '2026-08', place: 2 });
    expect(v.lastPlace).toBe(12);
  });

  it('o troféu do save completa o que o servidor já esqueceu; o servidor vence no conflito', () => {
    const v = buildSeasonHistoryView(hist({ seasons: [{ season: '2026-10', place: 5, points: 10 }] }),
      [{ season: '2026-05', place: 1 }, { season: '2026-10', place: 3 }], '2026-10');
    expect(v.seasons.map(s => [s.season, s.place])).toEqual([['2026-10', 5], ['2026-05', 1]]);
    expect(v.best).toEqual({ season: '2026-05', place: 1 });
  });

  it('offline (sem histórico do servidor): vale o troféu do save', () => {
    const v = buildSeasonHistoryView(null, [{ season: '2026-10', place: 2 }], '2026-10');
    expect(v.lastPlace).toBe(2);
  });

  it('GM/admin: nada aparece, nem troféu antigo', () => {
    const v = buildSeasonHistoryView(hist({ excluded: true }), [{ season: '2026-10', place: 1 }], '2026-10');
    expect(v).toEqual({ seasons: [], best: null, lastPlace: null });
  });
});
