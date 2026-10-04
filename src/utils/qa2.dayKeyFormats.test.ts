/**
 * QA2 (04/10/2026) — a JUNÇÃO entre `playerDayKey` e quem lê a chave de dia.
 *
 * `playerDayKey` devolve `"Sun Oct 04 2026"`, mas `bornAt` (gravado por ele) e o
 * `todayKey` do App eram lidos por módulos que só entendiam `YYYY-MM-DD`:
 * `daysTogether`/`anniversaryOn` devolviam `null` para todo save real, e com
 * eles morriam o convite do sono, o priming de push, a oferta do primeiro dia
 * perfeito, as memórias de 30/90 dias e o "N dias juntos".
 */
import { describe, it, expect } from 'vitest';
import { playerDayKey, dayKeyToIso, dayKeyParts } from './playerDay';
import { daysTogether, anniversaryOn } from './anniversary';
import { shouldShowRestSetup } from './restSetup';
import { normalizeCrossings } from './travessiasSave';

describe('chave de dia do jogador × leitores', () => {
  const anchor = { zone: 'America/Sao_Paulo' };
  const nasc = playerDayKey(new Date('2026-10-01T15:00:00Z'), anchor);   // o que o App grava em bornAt
  const hoje = playerDayKey(new Date('2026-10-03T15:00:00Z'), anchor);   // o todayKey do App

  it('daysTogether lê o formato que o próprio playerDayKey produz', () => {
    expect(daysTogether(nasc, hoje)).toBe(3);
    expect(daysTogether(nasc, nasc)).toBe(1);
  });

  it('daysTogether continua aceitando YYYY-MM-DD, nos dois lados e misturado', () => {
    expect(daysTogether('2026-10-01', '2026-10-03')).toBe(3);
    expect(daysTogether('2026-10-01', hoje)).toBe(3);
    expect(daysTogether(nasc, '2026-10-03')).toBe(3);
  });

  it('anniversaryOn lê o formato do playerDayKey', () => {
    const mes = playerDayKey(new Date('2026-11-01T15:00:00Z'), anchor);
    expect(anniversaryOn(nasc, mes)).toBe('month');
  });

  it('o convite do sono aparece no 2º dia com as chaves REAIS do App', () => {
    expect(shouldShowRestSetup({ shown: false, bornAt: nasc, todayKey: playerDayKey(new Date('2026-10-02T15:00:00Z'), anchor) })).toBe(true);
    expect(shouldShowRestSetup({ shown: false, bornAt: nasc, todayKey: nasc })).toBe(false);
    // save sem bornAt: a 1ª abertura do aparelho (também em playerDayKey)
    expect(shouldShowRestSetup({ shown: false, bornAt: undefined, firstOpenKey: nasc, todayKey: hoje })).toBe(true);
  });

  it('dayKeyToIso converte os dois formatos e recusa lixo', () => {
    expect(dayKeyToIso('Sun Oct 04 2026')).toBe('2026-10-04');
    expect(dayKeyToIso('2026-10-04')).toBe('2026-10-04');
    expect(dayKeyToIso('Foo Xxx 04 2026')).toBeNull();
    expect(dayKeyToIso('ontem')).toBeNull();
    expect(dayKeyToIso(42)).toBeNull();
    expect(dayKeyParts('Sat Jan 01 2000')).toEqual({ y: 2000, m: 1, d: 1 });
  });
});

describe('Travessias: o dia do relatório (toDateString) não pode virar lixo no load', () => {
  it('uma região aberta numa noite com dia em toDateString sobrevive ao normalizeCrossings', () => {
    const n = normalizeCrossings({
      opened: [{ region: 'floresta', day: 'Sat Oct 03 2026' }],
      pending: [],
      doneDay: 'Sat Oct 03 2026',
      trip: { day: 'Sat Oct 03 2026', region: 'floresta' },
    });
    expect(n.opened).toEqual([{ region: 'floresta', day: '2026-10-03' }]);
    expect(n.doneDay).toBe('2026-10-03');
    expect(n.trip).toEqual({ day: '2026-10-03', region: 'floresta' });
  });
});

describe('Travessias: a noite do relatório casa o mapa pelo dia ISO', () => {
  it('passeioFindOfDay acha a região aberta e a viagem usando crossDay, com o diário na chave do relatório', async () => {
    const { settleNight, passeioFindOfDay, markDone, pickCrossing, regionById } = await import('./travessias');
    const { CROSSINGS_EMPTY, HOME_REGION } = await import('../types/travessias');
    const { REGIONS } = await import('../data/travessiasCatalog');
    const R = REGIONS.filter(r => r.id !== HOME_REGION)[0];
    const reportDate = 'Sun Oct 04 2026';              // o `lastDayReport.date` real
    const iso = dayKeyToIso(reportDate)!;
    // missão feita em 04/10 (ISO) e região ainda em névoa → fica guardada
    let c = pickCrossing(CROSSINGS_EMPTY, R.id, R.challenges[0].id, iso);
    c = markDone(c, iso);
    expect(c.trip).toEqual({ day: iso, region: R.id });
    const noite = settleNight(c, iso).state;
    expect(noite.opened).toEqual([{ region: R.id, day: iso }]);
    // sobrevive ao load
    expect(normalizeCrossings(JSON.parse(JSON.stringify(noite))).opened).toEqual(noite.opened);
    const achado = passeioFindOfDay({ crossings: noite, entries: [], feito: 1, meta: 1, dayKey: reportDate, crossDay: iso });
    expect(achado).toBe(regionById(R.id)!.arrival);
  });
});
