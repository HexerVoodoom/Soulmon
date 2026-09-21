import { describe, it, expect } from 'vitest';
import {
  MOOD_OPTIONS, MOOD_LOG_CAP, recordMood, moodFor, recentMoods, moodSummary, getMoodOption,
} from './mood';
import { computeDailyReset } from './dailyReset';

const D = (n: number) => new Date(2026, 7, n).toDateString();

describe('check-in de humor', () => {
  it('as cinco carinhas têm rótulo nos dois idiomas', () => {
    expect(MOOD_OPTIONS).toHaveLength(5);
    for (const m of MOOD_OPTIONS) {
      expect(m.emoji).toBeTruthy();
      expect(m.labelPt).toBeTruthy();
      expect(m.labelEn).toBeTruthy();
    }
  });

  it('registra e lê o humor do dia', () => {
    let log = recordMood([], D(1), 4);
    expect(moodFor(log, D(1))).toBe(4);
    expect(moodFor(log, D(2))).toBeNull();
    // Responder de novo no mesmo dia substitui, não duplica.
    log = recordMood(log, D(1), 2);
    expect(log.filter(e => e.date === D(1))).toHaveLength(1);
    expect(moodFor(log, D(1))).toBe(2);
  });

  it('o histórico tem teto e mantém os mais recentes', () => {
    let log: ReturnType<typeof recordMood> = [];
    for (let i = 1; i <= MOOD_LOG_CAP + 10; i++) log = recordMood(log, D(i), 3);
    expect(log.length).toBe(MOOD_LOG_CAP);
    expect(log[log.length - 1].date).toBe(D(MOOD_LOG_CAP + 10));
  });

  it('não diz nada com menos de três registros', () => {
    let log = recordMood([], D(1), 1);
    log = recordMood(log, D(2), 1);
    expect(moodSummary(log, 'pt-BR')).toBeNull();
  });

  it('acolhe uma semana pesada em vez de cobrar', () => {
    let log: ReturnType<typeof recordMood> = [];
    for (let i = 1; i <= 5; i++) log = recordMood(log, D(i), 1);
    const s = moodSummary(log, 'pt-BR')!;
    expect(s).toMatch(/pesados/i);
    // Reconhece, não manda: nada de imperativo nem de "você deveria".
    expect(s).not.toMatch(/você precisa|tente |faça |deveria|vamos lá/i);
    // L9 (21/09/2026): devolve o que a pessoa REGISTROU, nunca afirma sobre
    // ela ("têm sido pesados" era o app afirmando).
    expect(s).toMatch(/registrados/i);
    expect(s).not.toMatch(/têm sido pesados/i);
  });

  it('não normaliza nem nega (L9 nas duas direções)', () => {
    let misto: ReturnType<typeof recordMood> = [];
    [3, 2, 4, 3, 3].forEach((m, i) => { misto = recordMood(misto, D(i + 1), m as 1 | 2 | 3 | 4 | 5); });
    for (const lang of ['pt-BR', 'en-US'] as const) {
      const s = moodSummary(misto, lang)!;
      expect(s).not.toMatch(/tudo bem|isso passa|não é nada|that's allowed|that’s allowed|it passes|nothing wrong/i);
    }
  });

  it('reconhece dias bons e altos e baixos', () => {
    let bons: ReturnType<typeof recordMood> = [];
    for (let i = 1; i <= 5; i++) bons = recordMood(bons, D(i), 5);
    expect(moodSummary(bons, 'pt-BR')).toMatch(/bons/i);

    let misto: ReturnType<typeof recordMood> = [];
    [3, 2, 4, 3, 3].forEach((m, i) => { misto = recordMood(misto, D(i + 1), m as 1 | 2 | 3 | 4 | 5); });
    expect(moodSummary(misto, 'pt-BR')).toMatch(/altos e baixos/i);
  });

  it('humor NUNCA entra em pontuação — a virada do dia ignora o log', () => {
    // Esta é a regra que protege o dado: se o humor virasse insumo de score, a
    // pessoa passaria a responder o que dá mais ponto em vez do que sente.
    const base = {
      activities: [], tasks: Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true })),
      healthPoints: 3, maxHealthPoints: 3, energyPoints: 10, perfectDays: 0, totalXP: 0,
      virusPoints: 0, dataPoints: 0, vaccinePoints: 0, evolutionStage: 'rookie',
      unlockedEvolutions: ['rookie'], degeneratedByHP: false, currentBranch: 'data' as const,
      lastDayWasPerfect: false, maxActivityCap: 6,
      attributesSinceLastEvolution: { virus: 0, data: 0, vaccine: 0 },
      lastResetDate: new Date('2026-08-04T12:00:00').toDateString(),
    };
    const now = new Date('2026-08-05T12:00:00');
    let triste: ReturnType<typeof recordMood> = [];
    for (let i = 1; i <= 7; i++) triste = recordMood(triste, D(i), 1);

    const semHumor: any = computeDailyReset({ ...base } as any, { now });
    const comHumorRuim: any = computeDailyReset({ ...base, moodLog: triste } as any, { now });

    expect(comHumorRuim.healthPoints).toBe(semHumor.healthPoints);
    expect(comHumorRuim.perfectDays).toBe(semHumor.perfectDays);
    expect(comHumorRuim.lastDayWasPerfect).toBe(semHumor.lastDayWasPerfect);
  });

  it('getMoodOption sempre devolve algo utilizável', () => {
    expect(getMoodOption(1).emoji).toBeTruthy();
    expect(getMoodOption(5).emoji).toBeTruthy();
  });

  it('recentMoods devolve os últimos, em ordem', () => {
    let log: ReturnType<typeof recordMood> = [];
    for (let i = 1; i <= 10; i++) log = recordMood(log, D(i), 3);
    const r = recentMoods(log, 3);
    expect(r).toHaveLength(3);
    expect(r[0].date).toBe(D(8));
    expect(r[2].date).toBe(D(10));
  });
});
