import { describe, it, expect } from 'vitest';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, getMaxEnergyForStage } from '../types/progression';
import {
  computeDailyReset,
  MAX_HEARTS_LOST_PER_DAY,
  ABSENCE_FORGIVENESS_DAYS,
  WEEKLY_RELIEF_HEARTS,
} from '../utils/dailyReset';

// Estes testes exercitam O MESMO computeDailyReset que o hook usa em produção.
// Antes este arquivo reimplementava a virada do dia numa cópia local, então
// podia passar com o app quebrado — o footgun de "regra copiada" que o
// CLAUDE.md alerta. Se precisar de um novo cenário, monte o estado e chame
// runReset; não recrie a lógica aqui.

// Quarta-feira: fora do alívio semanal de segunda, para os testes de tarefa não
// dependerem do dia em que a suíte roda.
const WEDNESDAY = new Date('2026-08-05T12:00:00');
const MONDAY = new Date('2026-08-03T12:00:00');

const runReset = (prev: any, now: Date = WEDNESDAY) => computeDailyReset(prev, { now });

const baseState = () => ({
  activities: [],
  tasks: [],
  healthPoints: 3,
  maxHealthPoints: 3,
  energyPoints: 10, // full by default (≥ any stage requirement) so task-focused tests aren't affected
  perfectDays: 0,
  totalXP: 0,
  virusPoints: 0,
  dataPoints: 0,
  vaccinePoints: 0,
  evolutionStage: 'rookie',
  unlockedEvolutions: ['rookie'],
  currentBranch: 'data' as const,
  maxActivityCap: 6,
  // Terça — véspera do WEDNESDAY usado nos testes: virada normal de 1 dia.
  lastResetDate: new Date('2026-08-04T12:00:00').toDateString(),
});

describe('performDailyReset — proportional HP loss', () => {
  it('no penalty when there were no tasks to do', () => {
    const result = runReset({ ...baseState(), healthPoints: 3 });
    expect(result.healthPoints).toBe(3);
    expect(result.lastDayWasPerfect).toBe(false);
  });

  it('no penalty when all tasks were completed', () => {
    const tasks = [{ id: 't1', completed: true }, { id: 't2', completed: true }];
    const result = runReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(3);
  });

  it('meeting the stage requirement is safe even with many registered tasks', () => {
    // rookie requires 4; 10 registered but 4 done → goal met → no loss
    const tasks = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, completed: i < 4 }));
    const result = runReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(3);
  });

  it('doing 1 of the required 4 loses only 1 heart (teto diário)', () => {
    // A proporção diria floor(0.75*3) = 2, mas o teto diário limita a 1.
    const tasks = Array.from({ length: 10 }, (_, i) => ({ id: `t${i}`, completed: i < 1 }));
    const result = runReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(3 - MAX_HEARTS_LOST_PER_DAY);
    expect(result.lastDayWasPerfect).toBe(false);
  });

  it('50% done with 3 hearts loses 1 heart (floor(0.5*3))', () => {
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: i < 2 }));
    const result = runReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.healthPoints).toBe(2);
  });

  it('increments perfectDays and awards XP on a perfect day', () => {
    // rookie requires 4; give 4 completed tasks + full energy (baseState)
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const result = runReset({ ...baseState(), tasks });
    expect(result.lastDayWasPerfect).toBe(true);
    expect(result.perfectDays).toBeGreaterThanOrEqual(1);
  });

  it('doing ALL registered tasks (fewer than the requirement) + full energy = perfect day', () => {
    // rookie requires 4, but only 3 registered — all 3 done, energy full
    const tasks = Array.from({ length: 3 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const result = runReset({ ...baseState(), tasks });
    expect(result.lastDayWasPerfect).toBe(true);
    expect(result.healthPoints).toBe(3);
  });

  it('tasks met but energy NOT full → day is not perfect', () => {
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const result = runReset({ ...baseState(), tasks, energyPoints: 1 });
    expect(result.lastDayWasPerfect).toBe(false);
    // No heart loss either — tasks were all done
    expect(result.healthPoints).toBe(3);
  });

  it('resets activities and tasks to incomplete', () => {
    const tasks = [{ id: 't1', completed: true }];
    const acts = [{ id: 'a1', category: 'Health', steps: [{ id: 's1', label: 'x', completed: true }], weekDays: [0,1,2,3,4,5,6] }];
    const result = runReset({ ...baseState(), tasks, activities: acts });
    expect(result.tasks[0].completed).toBe(false);
    expect(result.activities[0].steps[0].completed).toBe(false);
  });
});

describe('getMaxEnergyForStage — energy bars = task requirement', () => {
  it('matches the stage requirement for each form', () => {
    expect(getMaxEnergyForStage('rookie')).toBe(FORM_REQUIREMENTS.rookie.required);           // 4
    expect(getMaxEnergyForStage('champion-virus')).toBe(FORM_REQUIREMENTS.champion.required);  // 5
    expect(getMaxEnergyForStage('ultra')).toBe(FORM_REQUIREMENTS.ultra.required);               // 8
  });

  it('can differ from the stage max HP (rookie: 4 energy bars, 3 hearts)', () => {
    expect(getMaxEnergyForStage('rookie')).toBe(4);
    expect(MAX_HP_BY_FORM.rookie).toBe(3);
  });
});

describe('computeDailyReset — evolução é MANUAL', () => {
  // MANUAL_EVOLUTION = true: a virada do dia nunca evolui sozinha; quem dispara
  // é o jogador, na cerimônia de evolução. O teste antigo afirmava que a virada
  // evoluía o pet — afirmação que só passava porque ele exercitava uma CÓPIA da
  // lógica que não checava a flag. Este é o comportamento real.
  it('acumula dias perfeitos além do requisito sem evoluir sozinho', () => {
    let state: any = { ...baseState() };
    for (let i = 0; i < FORM_REQUIREMENTS.rookie.required + 2; i++) {
      const tasks = Array.from({ length: 4 }, (_, j) => ({ id: `t${i}-${j}`, completed: true }));
      // A energia zera em toda virada e volta ao comer — reabastecer aqui é o
      // equivalente a ter alimentado o pet ao longo do dia.
      state = runReset({ ...state, tasks, energyPoints: 10 });
    }
    expect(state.evolutionStage).toBe('rookie');
    expect(state.perfectDays).toBeGreaterThanOrEqual(FORM_REQUIREMENTS.rookie.required);
  });
});

describe('performDailyReset — degeneration', () => {
  it('degenerates a champion form back to rookie when HP drops to 0', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const result = runReset({ ...baseState(), tasks, healthPoints: 1, evolutionStage: 'champion-virus', currentBranch: 'virus' });
    expect(result.degeneratedByHP).toBe(true);
    expect(result.evolutionStage).toBe('rookie');
  });

  it('grants a half-requirement head start when degenerating by HP (recovery discount)', () => {
    // champion-virus with 1 HP, tasks all undone → loses the heart →
    // degenerates back to rookie. The discount gives floor(required/2) perfect
    // days for free. Non-cumulative — always floor(required/2) of the new
    // (lower) stage, so a second degeneration gets the same discount again.
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const result = runReset({
      ...baseState(),
      tasks,
      healthPoints: 1,
      evolutionStage: 'champion-virus',
      currentBranch: 'virus',
    });
    expect(result.degeneratedByHP).toBe(true);
    expect(result.evolutionStage).toBe('rookie');
    expect(result.perfectDays).toBe(Math.floor(FORM_REQUIREMENTS.rookie.required / 2));
  });
});

describe('computeDailyReset — teto de perda diária', () => {
  it('nunca tira mais que MAX_HEARTS_LOST_PER_DAY, mesmo zerando o dia', () => {
    // mega tem 4 corações: a proporção diria 4, o teto diz 1.
    const tasks = Array.from({ length: 7 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const result = runReset({
      ...baseState(), tasks,
      evolutionStage: 'mega-data', healthPoints: 4, maxHealthPoints: 4,
    });
    expect(result.healthPoints).toBe(4 - MAX_HEARTS_LOST_PER_DAY);
    expect(result.degeneratedByHP).toBe(false);
  });

  it('um único dia ruim nunca degenera um pet de vida cheia', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const result = runReset({
      ...baseState(), tasks,
      evolutionStage: 'champion-virus', healthPoints: 3, maxHealthPoints: 3,
    });
    expect(result.degeneratedByHP).toBe(false);
    expect(result.evolutionStage).toBe('champion-virus');
  });
});

describe('computeDailyReset — perdão de ausência', () => {
  it('quem some por vários dias não perde HP ao voltar', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const longAgo = new Date('2026-07-28T12:00:00').toDateString(); // 8 dias antes
    const result = runReset({ ...baseState(), tasks, lastResetDate: longAgo, healthPoints: 3 });
    expect(result.healthPoints).toBe(3);
    expect(result.lastDayReport.heartsLost).toBe(0);
    expect(result.lastDayReport.welcomeBack).toBe(true);
    expect(result.lastDayReport.daysAway).toBeGreaterThanOrEqual(ABSENCE_FORGIVENESS_DAYS);
  });

  it('a virada normal de 1 dia continua cobrando', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const result = runReset({ ...baseState(), tasks, healthPoints: 3 });
    expect(result.lastDayReport.heartsLost).toBe(MAX_HEARTS_LOST_PER_DAY);
    expect(result.lastDayReport.welcomeBack).toBe(false);
  });

  it('voltar depois de sumir nunca degenera', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const longAgo = new Date('2026-07-20T12:00:00').toDateString();
    const result = runReset({
      ...baseState(), tasks, lastResetDate: longAgo,
      healthPoints: 1, evolutionStage: 'champion-virus',
    });
    expect(result.degeneratedByHP).toBe(false);
    expect(result.evolutionStage).toBe('champion-virus');
  });
});

describe('computeDailyReset — perfectDays acumulam', () => {
  it('um dia não-perfeito NÃO tira dias perfeitos já conquistados', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const result = runReset({ ...baseState(), tasks, perfectDays: 2 });
    expect(result.lastDayWasPerfect).toBe(false);
    expect(result.perfectDays).toBe(2);
  });

  it('dias perfeitos acumulados sobrevivem a um dia ruim', () => {
    const bad = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const result = runReset({ ...baseState(), tasks: bad, perfectDays: 6 });
    expect(result.perfectDays).toBe(6);
  });
});

describe('computeDailyReset — alívio semanal de segunda', () => {
  it('devolve meio coração na virada de segunda', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const sunday = new Date('2026-08-02T12:00:00').toDateString();
    const result = runReset({ ...baseState(), tasks, lastResetDate: sunday, healthPoints: 3 }, MONDAY);
    // Perde 1 pelo dia zerado e recebe 0.5 de volta pela semana nova.
    expect(result.healthPoints).toBe(3 - MAX_HEARTS_LOST_PER_DAY + WEEKLY_RELIEF_HEARTS);
    expect(result.lastDayReport.weeklyRelief).toBe(true);
  });

  it('não estoura o máximo do estágio', () => {
    const sunday = new Date('2026-08-02T12:00:00').toDateString();
    const result = runReset({ ...baseState(), lastResetDate: sunday, healthPoints: 3 }, MONDAY);
    expect(result.healthPoints).toBe(3);
  });

  it('não acontece nos outros dias', () => {
    const result = runReset({ ...baseState(), healthPoints: 2 });
    expect(result.healthPoints).toBe(2);
    expect(result.lastDayReport.weeklyRelief).toBe(false);
  });
});
