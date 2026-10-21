import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { computeDailyReset, restWeekKeyFor, settlePendingRollover } from './dailyReset';

/**
 * QA L02-02: um toque entre a meia-noite e o tick de 30 s da virada gravava
 * `lastCompletedDate = hoje` por cima do crédito de ontem; a virada depois julgava
 * ontem como NÃO feito. `settlePendingRollover` fecha ontem antes de escrever hoje.
 */
const SEG = new Date('2026-10-19T21:00:00');
const TER = new Date('2026-10-20T00:00:10');

const estado = (over: Record<string, any> = {}) => ({
  activities: [{ id: 'a1', name: 'Água', emoji: '💧', category: 'body', steps: [] as any[], completedToday: true, lastCompletedDate: SEG.toDateString() }],
  tasks: [] as any[],
  healthPoints: 3, maxHealthPoints: 3, energyPoints: 10, perfectDays: 0, totalXP: 0,
  powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0,
  evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], currentBranch: 'harmony' as const,
  maxActivityCap: 6,
  lastResetDate: SEG.toDateString(),
  lastDayReport: { date: new Date('2026-10-18T12:00:00').toDateString(), saveDay: 90 } as any,
  restDaysLeft: 0,
  restWeekKey: restWeekKeyFor(SEG),
  ...over,
});

describe('settlePendingRollover', () => {
  it('sem virada pendente devolve o MESMO objeto', () => {
    const s = estado({ lastResetDate: TER.toDateString() });
    expect(settlePendingRollover(s, TER)).toBe(s);
  });

  it('com virada pendente roda a virada: ontem é julgado com o crédito de ontem e hoje nasce zerado', () => {
    const s = estado();
    const r = settlePendingRollover(s, TER);
    expect(r).not.toBe(s);
    expect(r.lastResetDate).toBe(TER.toDateString());
    expect(r.lastDayReport.date).toBe(SEG.toDateString());
    // o crédito de ontem foi lido ANTES de qualquer escrita de hoje
    expect(r.lastDayReport).toEqual(computeDailyReset(s, { now: TER }).lastDayReport);
    expect(r.activities[0].completedToday).toBe(false);
  });

  it('o bug: tocar ANTES de assentar a virada apaga o crédito de ontem; assentando antes, não', () => {
    const s = estado();
    const toque = (st: ReturnType<typeof estado>) => ({
      ...st,
      activities: st.activities.map(a => ({ ...a, completedToday: true, lastCompletedDate: TER.toDateString() })),
    });
    const semAssentar = computeDailyReset(toque(s), { now: TER });
    const assentando = toque(settlePendingRollover(s, TER));
    // sem assentar, a virada julga a segunda com o toque de terça por cima e o dia sai NÃO feito
    expect(semAssentar.lastDayReport.date).toBe(SEG.toDateString());
    const creditoOntem = computeDailyReset(s, { now: TER }).lastDayReport;
    expect(JSON.stringify(semAssentar.lastDayReport)).not.toBe(JSON.stringify(creditoOntem));
    // assentando antes, o relatório de ontem é o do crédito real e o toque vale para terça
    expect(assentando.activities[0].lastCompletedDate).toBe(TER.toDateString());
    expect(assentando.lastDayReport.date).toBe(SEG.toDateString());
  });
});

describe('o handler de marcar atividade assenta a virada pendente primeiro (QA L02-02)', () => {
  it('handleToggleActivityCompletion chama settlePendingRollover dentro do updater', () => {
    const src = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8');
    const i = src.indexOf('const handleToggleActivityCompletion');
    expect(i).toBeGreaterThan(0);
    expect(src.slice(i, i + 1500)).toContain('settlePendingRollover(prevRaw)');
  });
});
