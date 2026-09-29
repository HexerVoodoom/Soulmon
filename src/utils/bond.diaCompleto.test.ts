/**
 * 🔗 Vínculo × virada do dia — a fiação do `perfectDay` (`02-REGRAS` §55).
 *
 * A tabela de XP declara `XP_PERFECT_DAY` = 50 como "⭐ Dia perfeito
 * (utils/dailyReset.ts)". Até 22/09/2026 o evento nunca era emitido: a
 * simulação da QA rodada 2 (`07-simulacao-jogo-r2.md` §2.4) mediu 7 dos 11
 * `BondEvent` mudos, e este era o único cujo dono é `computeDailyReset`.
 *
 * Os outros seis (`restNight`, `dreamNew`, `nightmareCleared`, `dungeonFloor`,
 * `habitMilestone`, `triageCleared`) moram em handlers do `App.tsx` e estão
 * fora deste patch — ver `docs/PERGUNTAS-DO-DONO.md` #59 e os `it.todo` abaixo,
 * que ficam vermelhos de propósito no dia em que alguém os ligar sem vir aqui.
 */
import { describe, it, expect } from 'vitest';
import { computeDailyReset, restWeekKeyFor } from './dailyReset';
import { XP_PERFECT_DAY, bondLevelFor } from './bond';

const WEDNESDAY = new Date('2026-08-05T12:00:00');
const virada = (prev: Record<string, any>) => computeDailyReset(prev, { now: WEDNESDAY }) as Record<string, any>;

const baseState = () => ({
  activities: [],
  tasks: [],
  healthPoints: 3,
  maxHealthPoints: 3,
  energyPoints: 10,
  perfectDays: 0,
  totalXP: 0,
  powerPoints: 0,
  harmonyPoints: 0,
  benevolencePoints: 0,
  evolutionStage: 'rookie',
  unlockedEvolutions: ['rookie'],
  currentBranch: 'harmony' as const,
  maxActivityCap: 6,
  lastResetDate: new Date('2026-08-04T12:00:00').toDateString(),
  lastDayReport: { date: new Date('2026-08-03T12:00:00').toDateString(), saveDay: 90 },
  restDaysLeft: 0,
  restWeekKey: restWeekKeyFor(new Date('2026-08-04T12:00:00')),
});

describe('dia completo → XP_PERFECT_DAY no Vínculo (fiação em computeDailyReset)', () => {
  it('a virada de um dia completo soma exatamente XP_PERFECT_DAY ao totalXP', () => {
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const r = virada({ ...baseState(), tasks });
    expect(r.lastDayWasPerfect).toBe(true);
    expect(r.totalXP).toBe(XP_PERFECT_DAY);
    expect(r.bondDaily?.day).toBeTypeOf('string');
  });

  it('dia NÃO completo não toca o totalXP (nem para cima, nem para baixo)', () => {
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: i < 1 }));
    const r = virada({ ...baseState(), tasks, totalXP: 123 });
    expect(r.lastDayWasPerfect).toBe(false);
    expect(r.totalXP).toBe(123);
  });

  it('o nível continua derivado: nada chamado bondLevel entra no save', () => {
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const r = virada({ ...baseState(), tasks });
    expect('bondLevel' in r).toBe(false);
    expect(bondLevelFor(r.totalXP as number)).toBeGreaterThanOrEqual(1);
  });

  it('a virada NUNCA desce o totalXP — nem no dia de degeneração', () => {
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const r = virada({ ...baseState(), tasks, healthPoints: 0.5, totalXP: 900, evolutionStage: 'champion-harmony', unlockedEvolutions: ['rookie', 'champion-harmony'] });
    expect(r.totalXP).toBeGreaterThanOrEqual(900);
  });

  // ── Fora deste patch (App.tsx) — PERGUNTAS-DO-DONO #59 ──────────────────
  it.todo('habitMilestone: `withHabitCompletion` (App.tsx) emite `{kind:"habitMilestone", days}` quando `milestoneReached` != null');
  it.todo('restNight / dreamNew: `handleSleep`→`recordNight` (App.tsx) emite `restNight` na noite dentro da janela e `dreamNew` quando `dexProgress` cresce');
  it.todo('nightmareCleared / dungeonFloor / triageCleared: handlers do App.tsx emitem os três');
  it.todo('feedFood (careRules.ts) soma totalXP fora de awardBondXP — §55 diz "único caminho"; decisão do dono: entrar na tabela (kind "feed", com teto) ou parar de somar');
});
