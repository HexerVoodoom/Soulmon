/**
 * V2 da revisão de psicologia (`docs/reviews/2026-09-28-catalogo-psicologia.md`):
 * um item `optInOnly` do catálogo (protocolos de TCC) NUNCA pode custar
 * coração. Se ele entrasse na meta ponderada, evitar o item — a própria
 * evitação ansiosa, que É o sintoma — faria a criatura perder vida.
 *
 * Prova exigida pela revisão: rodar a virada do dia com o item NÃO feito tem
 * que dar o MESMO HP que rodar sem o item cadastrado. E, por simetria,
 * concluí-lo não pode aumentar `dailyDone` além do que ele valeria sem ele.
 */
import { describe, it, expect } from 'vitest';
import { computeDailyReset, registeredForDay, restWeekKeyFor } from './dailyReset';
import { ACTIVITY_CATALOG } from '../data/activityCatalog';

const QUARTA = new Date('2026-08-05T12:00:00');
const ONTEM = new Date('2026-08-04T12:00:00');

const optInItem = ACTIVITY_CATALOG.find((i) => i.optInOnly)!;
const habitoNormal = { id: 'h-normal', category: 'Wellness', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6], completedToday: false };

function optInHabito(feito: boolean) {
  return {
    id: 'h-optin', category: 'Wellness', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6],
    catalogId: optInItem.id,
    completedToday: feito, lastCompletedDate: feito ? ONTEM.toDateString() : undefined,
  };
}

const estado = (over: Record<string, unknown> = {}) => ({
  activities: [] as unknown[], tasks: [], healthPoints: 3, maxHealthPoints: 3, energyPoints: 10,
  perfectDays: 0, totalXP: 0, powerPoints: 0, harmonyPoints: 0, benevolencePoints: 0,
  evolutionStage: 'rookie', unlockedEvolutions: ['rookie'], currentBranch: 'harmony' as const,
  maxActivityCap: 6,
  lastResetDate: ONTEM.toDateString(),
  lastDayReport: { date: new Date('2026-08-03T12:00:00').toDateString(), saveDay: 90 },
  restDaysLeft: 0,
  restWeekKey: restWeekKeyFor(new Date('2026-08-03T12:00:00')),
  ...over,
});

describe('item optInOnly do catálogo: peso ZERO na meta ponderada', () => {
  it('registeredForDay ignora o item optInOnly (mesmo peso com ou sem ele)', () => {
    const semItem = registeredForDay({ evolutionStage: 'rookie', activities: [habitoNormal], tasks: [] }, 3);
    const comItemNaoFeito = registeredForDay(
      { evolutionStage: 'rookie', activities: [habitoNormal, optInHabito(false)], tasks: [] },
      3,
    );
    expect(comItemNaoFeito).toBe(semItem);
  });

  it('a virada dá o MESMO HP com o item optInOnly não feito e sem o item cadastrado', () => {
    const semItem = estado({ activities: [habitoNormal] });
    const comItemNaoFeito = estado({ activities: [habitoNormal, optInHabito(false)] });

    const s1: any = computeDailyReset(semItem as any, { now: QUARTA } as any);
    const s2: any = computeDailyReset(comItemNaoFeito as any, { now: QUARTA } as any);

    expect(s2.healthPoints).toBe(s1.healthPoints);
  });

  it('concluir o item optInOnly não altera o HP da virada em relação a não tê-lo cadastrado', () => {
    const semItem = estado({ activities: [habitoNormal] });
    const comItemFeito = estado({ activities: [habitoNormal, optInHabito(true)] });

    const s1: any = computeDailyReset(semItem as any, { now: QUARTA } as any);
    const s2: any = computeDailyReset(comItemFeito as any, { now: QUARTA } as any);

    expect(s2.healthPoints).toBe(s1.healthPoints);
  });

  it('faltar no item optInOnly NUNCA gasta nem concede escudo (sem histórico de constância)', () => {
    const prev = estado({ activities: [optInHabito(false)] });
    const s: any = computeDailyReset(prev as any, { now: QUARTA } as any);
    expect(s.habitRhythms?.['h-optin']).toBeUndefined();
  });
});
