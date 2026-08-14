import { describe, it, expect } from 'vitest';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, getMaxEnergyForStage } from '../types/progression';
import {
  computeDailyReset,
  MAX_HEARTS_LOST_PER_DAY,
  ABSENCE_FORGIVENESS_DAYS,
  WEEKLY_RELIEF_HEARTS,
  DEGENERATION_PERFECT_DAYS_COST,
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

// ---------------------------------------------------------------------------
// ATIVIDADES RECORRENTES NA VIRADA — o buraco que a rodada 7 encontrou.
//
// Todo teste acima monta o dia com `tasks` (tarefas avulsas). O ramo que conta
// ATIVIDADE recorrente concluída (`availableActivities.forEach` em
// `computeDailyReset`) nunca era medido: dava para trocar `isComplete = false`
// por `true`, `steps.length > 0` por `> 1` e o `&&` do ramo sem passos por
// `||` — três mutações, zero testes vermelhos. Atividade recorrente é o
// mecanismo PRINCIPAL de hábito do app (CLAUDE.md), então "o dia foi cumprido?"
// estava sem guard justamente onde mais importa.
// ---------------------------------------------------------------------------
describe('computeDailyReset — atividades recorrentes contam no dia', () => {
  const ONTEM = new Date('2026-08-04T12:00:00'); // terça, véspera de WEDNESDAY
  const ontemStr = ONTEM.toDateString();
  const TODOS_OS_DIAS = [0, 1, 2, 3, 4, 5, 6];

  /** Atividade COM passos: completa quando todos os passos estão marcados. */
  const comPassos = (id: string, passosFeitos: boolean) => ({
    id, category: 'Health', emoji: '🏃', weekDays: TODOS_OS_DIAS,
    steps: [
      { id: `${id}-s1`, label: 'a', completed: passosFeitos },
      { id: `${id}-s2`, label: 'b', completed: passosFeitos },
    ],
  });

  /** Atividade SEM passos: completa via `completedToday` + a data de ontem. */
  const semPassos = (id: string, feita: boolean) => ({
    id, category: 'Health', emoji: '🏃', weekDays: TODOS_OS_DIAS, steps: [],
    completedToday: feita,
    lastCompletedDate: feita ? ontemStr : undefined,
  });

  it('4 atividades COM passos, todas concluídas + energia cheia = dia perfeito', () => {
    const activities = [0, 1, 2, 3].map(i => comPassos(`a${i}`, true));
    const result = runReset({ ...baseState(), activities });
    expect(result.lastDayWasPerfect).toBe(true);
    expect(result.healthPoints).toBe(3);
    expect(result.lastDayReport.done).toBe(4);
  });

  it('atividade com passos PELA METADE não conta como concluída', () => {
    const activities = [
      comPassos('a0', true),
      // um passo marcado, o outro não → incompleta
      { ...comPassos('a1', false), steps: [
        { id: 'a1-s1', label: 'a', completed: true },
        { id: 'a1-s2', label: 'b', completed: false },
      ] },
      comPassos('a2', false),
      comPassos('a3', false),
    ];
    const result = runReset({ ...baseState(), activities, healthPoints: 3 });
    expect(result.lastDayReport.done).toBe(1);
    expect(result.lastDayWasPerfect).toBe(false);
    expect(result.healthPoints).toBe(2); // cobrou o dia
  });

  it('atividade de UM ÚNICO passo usa o ramo dos passos', () => {
    // O ramo é `activity.steps.length > 0`. Trocar por `> 1` manda a atividade
    // de um passo só — a forma mais comum no app — para o ramo do
    // `completedToday`, e o passo marcado deixa de contar.
    const umPasso = {
      id: 'solo', category: 'Health', emoji: '🏃', weekDays: TODOS_OS_DIAS,
      steps: [{ id: 'solo-s1', label: 'único', completed: true }],
      // de propósito SEM completedToday: quem responde tem que ser o passo
      completedToday: false,
    };
    const result = runReset({ ...baseState(), activities: [umPasso], healthPoints: 3 });
    expect(result.lastDayReport.done).toBe(1);
    expect(result.lastDayWasPerfect).toBe(true); // 1 cadastrada, 1 feita, energia cheia
  });

  it('atividade SEM passos exige completedToday E a data de ONTEM', () => {
    // O ramo é `!!completedToday && lastCompletedDate === yesterdayString`.
    // Com `||`, uma atividade marcada há um mês (ou marcada hoje sem data)
    // contaria de novo todo dia — o dia perfeito viraria automático.
    const feitaOntem = semPassos('ok', true);
    const marcadaSemData = { ...semPassos('sem-data', false), completedToday: true };
    const dataVelha = {
      ...semPassos('velha', false),
      completedToday: true,
      lastCompletedDate: new Date('2026-07-01T12:00:00').toDateString(),
    };
    const naoFeita = semPassos('nao', false);

    const result = runReset({
      ...baseState(),
      activities: [feitaOntem, marcadaSemData, dataVelha, naoFeita],
      healthPoints: 3,
    });
    expect(result.lastDayReport.done).toBe(1);   // só a de ontem
    expect(result.lastDayReport.total).toBe(4);
    expect(result.lastDayWasPerfect).toBe(false);
  });

  it('nenhuma atividade concluída não vira dia cumprido por acidente', () => {
    // Guard direto contra `let isComplete = false` virar `true`: com 4
    // atividades cadastradas e ZERO feitas, o dia tem que cobrar.
    const activities = [0, 1, 2, 3].map(i => comPassos(`a${i}`, false));
    const result = runReset({ ...baseState(), activities, healthPoints: 3 });
    expect(result.lastDayReport.done).toBe(0);
    expect(result.lastDayWasPerfect).toBe(false);
    expect(result.healthPoints).toBe(2);
  });

  it('a virada LIMPA completedToday — senão o dia seguinte nasce cumprido', () => {
    const result = runReset({ ...baseState(), activities: [semPassos('a0', true)] });
    expect(result.activities[0].completedToday).toBe(false);
  });

  it('a virada zera o relógio do cocô e as listas do dia', () => {
    // `poopPenaltyClockAt` é o relógio do dreno de −1 coração a cada 6h. Se ele
    // atravessasse a virada, o pet começaria o dia já devendo — e nenhum teste
    // olhava para este campo depois do reset.
    const result = runReset({
      ...baseState(),
      poopPenaltyClockAt: 1_754_000_000_000,
      poopEventsScheduled: [1, 2], poopEventsCompleted: [1], poopEventsShown: [1],
    });
    expect(result.poopPenaltyClockAt).toBe(0);
    expect(result.poopEventsScheduled).toEqual([]);
    expect(result.poopEventsCompleted).toEqual([]);
    expect(result.poopEventsShown).toEqual([]);
  });
});

describe('computeDailyReset — dia perfeito exige pelo menos 1 cadastrada', () => {
  it('UMA única tarefa cadastrada e feita já é dia perfeito', () => {
    // A regra é `totalTasks > 0`. Trocar por `> 1` (rodada 7) só quebra no caso
    // de exatamente uma cadastrada — que nenhum teste usava. Quem tem uma única
    // atividade no app é justamente quem está começando.
    const result = runReset({ ...baseState(), tasks: [{ id: 't1', completed: true }] });
    expect(result.lastDayReport.total).toBe(1);
    expect(result.lastDayWasPerfect).toBe(true);
    expect(result.perfectDays).toBe(1);
  });

  it('dia sem NADA cadastrado não é perfeito (e não cobra)', () => {
    const result = runReset({ ...baseState() });
    expect(result.lastDayReport.total).toBe(0);
    expect(result.lastDayWasPerfect).toBe(false);
    expect(result.healthPoints).toBe(3);
  });
});

describe('computeDailyReset — totalPerfectDays (contador vitalício das missões)', () => {
  it('soma exatamente 1 no dia perfeito e nada no dia ruim', () => {
    // `(prev.totalPerfectDays ?? 0) + (dayWasPerfect ? 1 : 0)`. A missão de
    // "30 dias perfeitos TOTAIS" (utils/missions.ts) depende deste número, e
    // zerar o `1` deixava a missão inalcançável sem quebrar teste nenhum.
    const bons = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const perfeito = runReset({ ...baseState(), tasks: bons, totalPerfectDays: 7 });
    expect(perfeito.totalPerfectDays).toBe(8);

    const ruins = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const ruim = runReset({ ...baseState(), tasks: ruins, totalPerfectDays: 7 });
    expect(ruim.totalPerfectDays).toBe(7);
  });

  it('save antigo SEM o campo começa do zero, não do um', () => {
    const bons = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const semCampo: any = { ...baseState(), tasks: bons };
    delete semCampo.totalPerfectDays;
    expect(runReset(semCampo).totalPerfectDays).toBe(1);
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

  it('a FRONTEIRA exata do perdão: 2 dias perdoa, 1 dia cobra', () => {
    // `wasAway = daysAway >= ABSENCE_FORGIVENESS_DAYS`. Trocar `>=` por `>`
    // (rodada 7) passava despercebido porque o teste de perdão usava 8 dias e o
    // de cobrança usava 1 — ninguém tocava no 2, que é o valor da constante.
    expect(ABSENCE_FORGIVENESS_DAYS).toBe(2);
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));

    // Exatamente 2 dias de ausência (segunda 03/08 → quarta 05/08): PERDOA.
    const doisDias = new Date('2026-08-03T12:00:00').toDateString();
    const naFronteira = runReset({ ...baseState(), tasks, lastResetDate: doisDias, healthPoints: 3 });
    expect(naFronteira.lastDayReport.daysAway).toBe(2);
    expect(naFronteira.lastDayReport.heartsLost).toBe(0);
    expect(naFronteira.healthPoints).toBe(3);

    // Um dia antes da fronteira: COBRA.
    const umDia = new Date('2026-08-04T12:00:00').toDateString();
    const antes = runReset({ ...baseState(), tasks, lastResetDate: umDia, healthPoints: 3 });
    // `daysAway` no relatório é zerado quando NÃO houve ausência (`wasAway ?
    // daysAway : 0`) — quem marca a diferença aqui é `welcomeBack`.
    expect(antes.lastDayReport.welcomeBack).toBe(false);
    expect(antes.lastDayReport.daysAway).toBe(0); // sem ausência, o relatório zera o campo
    expect(antes.lastDayReport.heartsLost).toBe(1);
    expect(antes.healthPoints).toBe(2);
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
    //
    // O NÚMERO É CRU DE PROPÓSITO. Esta linha já foi
    // `toBe(3 - MAX_HEARTS_LOST_PER_DAY + WEEKLY_RELIEF_HEARTS)`, ou seja,
    // calculava a expectativa a partir das MESMAS constantes que ela deveria
    // estar auditando — a doença dos três guards cegos anteriores
    // (`simulateReset`, `cloudSync.test.ts`, `hostile.test.tsx`). Medido na
    // rodada 7: zerar `WEEKLY_RELIEF_HEARTS` deixava os 829 testes verdes, e um
    // teste chamado "devolve meio coração" não afirmava nada sobre meio coração.
    expect(result.healthPoints).toBe(2.5);
    expect(result.lastDayReport.weeklyRelief).toBe(true);
  });

  it('o alívio é de MEIO coração — nem zero, nem um inteiro', () => {
    // Segunda com o dia cumprido: nenhuma perda, só o alívio. Isola o valor.
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: true }));
    const sunday = new Date('2026-08-02T12:00:00').toDateString();
    const result = runReset({ ...baseState(), tasks, lastResetDate: sunday, healthPoints: 2 }, MONDAY);
    expect(result.healthPoints).toBe(2.5);
    expect(WEEKLY_RELIEF_HEARTS).toBe(0.5);
  });

  it('NÃO ressuscita um pet que chegou a zero coração', () => {
    // O guard é `newHP > 0`. Com `>=`, a segunda-feira devolveria meio coração
    // para um pet já degenerado e a degeneração por HP 0 deixaria de acontecer
    // justamente na virada de semana. A rodada 7 trocou `>` por `>=` aqui e
    // nenhum teste reclamou.
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const sunday = new Date('2026-08-02T12:00:00').toDateString();
    const result = runReset({
      ...baseState(), tasks, lastResetDate: sunday,
      healthPoints: 1, evolutionStage: 'champion-virus', currentBranch: 'virus',
    }, MONDAY);
    // Perde o único coração → zera → degenera (e o alívio NÃO impede isso).
    expect(result.degeneratedByHP).toBe(true);
    expect(result.evolutionStage).toBe('rookie');
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

// ---------------------------------------------------------------------------
// BALANCEAMENTO DA DEGENERAÇÃO (decisão do dono, ago/2026)
//
// Duas regras diferentes moravam no mesmo bloco e se confundiam:
//   1. quem CAI de estágio ganha meio requisito de vantagem (misericórdia);
//   2. quem já está na RAIZ não cai — mas recebia a vantagem do mesmo jeito.
// O efeito medido era perverso: rookie que não fazia nada terminava com HP
// cheio e +2 dias perfeitos; o que fazia tudo terminava com HP 1 e 0.
// ---------------------------------------------------------------------------
describe('degeneração — piso, custo e a raiz da árvore', () => {
  it('na RAIZ (rookie) não degenera: 1 coração, sem presente de perfectDays', () => {
    const tasks = Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const r = runReset({ ...baseState(), tasks, healthPoints: 1, evolutionStage: 'rookie', perfectDays: 0 });
    expect(r.degeneratedByHP).toBe(false);
    expect(r.evolutionStage).toBe('rookie');
    expect(r.healthPoints).toBe(1);
    expect(r.perfectDays).toBe(0);
  });

  it('negligenciar NUNCA rende mais que cuidar (a regra que estava invertida)', () => {
    const mk = (feitas: number) => ({
      ...baseState(),
      healthPoints: 1,
      evolutionStage: 'rookie',
      perfectDays: 0,
      tasks: Array.from({ length: 4 }, (_, i) => ({ id: `t${i}`, completed: i < feitas })),
    });
    const naoFez = runReset(mk(0));
    const fezTudo = runReset(mk(4));
    expect(fezTudo.perfectDays).toBeGreaterThanOrEqual(naoFez.perfectDays);
    expect(fezTudo.healthPoints).toBeGreaterThanOrEqual(naoFez.healthPoints);
  });

  it('quem CAI de estágio paga um custo fixo em vez de perder tudo', () => {
    const tasks = Array.from({ length: 6 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const r = runReset({
      ...baseState(), tasks, healthPoints: 1,
      evolutionStage: 'mega-virus', currentBranch: 'virus', perfectDays: 39,
    });
    expect(r.degeneratedByHP).toBe(true);
    // 39 − 5 = 34. Antes desta regra o jogador reaparecia com 2 (perdia 37).
    expect(r.perfectDays).toBe(39 - DEGENERATION_PERFECT_DAYS_COST);
  });

  it('o piso de misericórdia continua valendo para quem tinha pouco', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const r = runReset({
      ...baseState(), tasks, healthPoints: 1,
      evolutionStage: 'champion-virus', currentBranch: 'virus', perfectDays: 0,
    });
    // 0 − 5 seria negativo; o piso é floor(required do rookie / 2) = 2.
    expect(r.perfectDays).toBe(Math.floor(FORM_REQUIREMENTS.rookie.required / 2));
  });
});
