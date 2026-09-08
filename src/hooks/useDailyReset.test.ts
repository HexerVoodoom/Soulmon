import { describe, it, expect } from 'vitest';
import { FORM_REQUIREMENTS, MAX_HP_BY_FORM, getStageLevel, getMaxEnergyForStage } from '../types/progression';
import {
  computeDailyReset,
  MAX_HEARTS_LOST_PER_DAY,
  ABSENCE_FORGIVENESS_DAYS,
  WEEKLY_RELIEF_HEARTS,
  DEGENERATION_PERFECT_DAYS_COST,
  NEW_SAVE_GRACE_DAYS,
  RETURN_GRACE_DAYS,
  looksLikeVeteranSave,
  degeneratedPerfectDays, restWeekKeyFor } from '../utils/dailyReset';
import { readFileSync } from 'node:fs';
import path from 'node:path';

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
  // Save VETERANO. Sem esta linha todo estado deste arquivo cairia na carência
  // de começo de vida (`NEW_SAVE_GRACE_DAYS`), que existe para não cobrar
  // coração de quem está na segunda abertura do app — e todo teste de perda de
  // HP daqui passaria a medir a carência, não a regra. O contador de idade do
  // save mora dentro de `lastDayReport` porque é o único objeto que atravessa
  // `hydrateSave` inteiro (ver o bloco "IDADE DO SAVE" em utils/dailyReset.ts).
  lastDayReport: { date: new Date('2026-08-03T12:00:00').toDateString(), saveDay: 90 },
  // P2 — ESTE SAVE JÁ GASTOU A FOLGA DA SEMANA. Sem isto ela absorveria a
  // primeira perda de coração de cada virada, e todo teste de perda daqui
  // mediria a folga em vez da regra. A semana tem de ser a do dia JULGADO: uma
  // semana que não bate é lida pela virada como "a folga estava inteira", que é
  // o certo para save antigo e o oposto do que estes testes precisam.
  restDaysLeft: 0,
  restWeekKey: restWeekKeyFor(new Date('2026-08-04T12:00:00')),
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

describe('computeDailyReset — carência de começo de vida', () => {
  /** O save exato da auditoria: 3 hábitos criados no tutorial, 1 feito no dia 1. */
  const saveRecemNascido = () => {
    const ontem = new Date('2026-08-04T12:00:00').toDateString();
    const ativ = (id: string, feito: boolean) => ({
      id, name: id, category: 'work', emoji: '✨', steps: [], weekDays: [0, 1, 2, 3, 4, 5, 6],
      completedToday: feito, lastCompletedDate: feito ? ontem : undefined,
    });
    return {
      ...baseState(),
      activities: [ativ('a1', true), ativ('a2', false), ativ('a3', false)],
      energyPoints: 1,
      // Save NOVO: nada de `lastDayReport` (nunca houve virada), nenhum ritmo,
      // nenhuma tarefa concluída, nenhuma evolução.
      lastDayReport: undefined,
      unlockedEvolutions: ['rookie'],
    };
  };

  // REGRESSÃO — dailyGoal = min(3, 4) = 3 e dailyDone = 1 dão
  // `floor((1 − 1/3) × 3) = 2`, com teto 1: sem a carência, a SEGUNDA abertura
  // da vida do save tirava um coração de quem ainda não conhece a mecânica de
  // cura, e a única leitura possível era "eu já estou falhando".
  it('a primeira virada da vida do save NÃO tira coração', () => {
    const r = runReset(saveRecemNascido());
    expect(r.lastDayReport.required).toBe(3); // a meta que cobraria
    expect(r.lastDayReport.done).toBe(1);
    expect(r.lastDayReport.heartsLost).toBe(0);
    expect(r.healthPoints).toBe(3);
    expect(r.lastDayReport.forgiven).toBe(true);
  });

  it('a carência tem prazo: acaba em NEW_SAVE_GRACE_DAYS viradas', () => {
    let s: any = saveRecemNascido();
    for (let i = 0; i < NEW_SAVE_GRACE_DAYS; i++) {
      s = runReset(s);
      expect(s.lastDayReport.heartsLost).toBe(0);
      // Cada virada devolve o save ao mesmo estado de "fez 1 de 3".
      s = { ...s, activities: saveRecemNascido().activities, energyPoints: 1, healthPoints: 3 };
    }
    const cobrada = runReset(s);
    expect(cobrada.lastDayReport.forgiven).toBe(false);
    expect(cobrada.lastDayReport.heartsLost).toBe(MAX_HEARTS_LOST_PER_DAY);
  });

  // A metade que protege o save ANTIGO: sem esta regra, todo save do mundo
  // ganharia três viradas sem cobrança no dia do deploy (nenhum deles tem o
  // contador `saveDay`, que nasce agora).
  it('save ANTIGO nunca é tratado como novo, mesmo sem o contador', () => {
    const tasks = Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const semContador = (over: any) => runReset({
      ...baseState(), tasks, healthPoints: 3, lastDayReport: undefined, ...over,
    });

    // Cada sinal de vida pregressa, sozinho, basta.
    expect(semContador({ totalPerfectDays: 4 }).lastDayReport.heartsLost).toBe(1);
    expect(semContador({ perfectDays: 2 }).lastDayReport.heartsLost).toBe(1);
    expect(semContador({ evolutionStage: 'champion-data' }).lastDayReport.heartsLost).toBe(1);
    expect(semContador({ unlockedEvolutions: ['rookie', 'champion-data'] }).lastDayReport.heartsLost).toBe(1);
    expect(semContador({ completedTasks: [{ id: 'c', completedAt: '2026-01-01T10:00:00' }] }).lastDayReport.heartsLost).toBe(1);
    expect(semContador({ activityLog: ['2026-01-01T10:00:00'] }).lastDayReport.heartsLost).toBe(1);
    expect(semContador({ habitRhythms: { h1: { done: ['x'], missed: [], shields: 0, totalDone: 1 } } }).lastDayReport.heartsLost).toBe(1);
    expect(looksLikeVeteranSave({ ...baseState(), totalPerfectDays: 1 })).toBe(true);
  });

  it('a carência não relaxa nenhuma tese: nada zera e o ritmo continua sendo escrito', () => {
    const r = runReset(saveRecemNascido());
    expect(r.perfectDays).toBe(0);
    expect(r.totalPerfectDays ?? 0).toBe(0);
    expect(r.unlockedEvolutions).toEqual(['rookie']);
    // O histórico de constância É escrito durante a carência — a falta entra no
    // denominador da média móvel (que não pune) como em qualquer outro dia.
    expect(Object.keys(r.habitRhythms)).toEqual(['a1', 'a2', 'a3']);
    expect(r.habitRhythms.a1.done).toHaveLength(1);
    expect(r.habitRhythms.a2.missed).toHaveLength(1);
  });
});

describe('computeDailyReset — rampa depois do retorno', () => {
  const tarefasNaoFeitas = () => Array.from({ length: 5 }, (_, i) => ({ id: `t${i}`, completed: false }));

  // REGRESSÃO — `welcomeBack` só existia no relatório da virada do retorno; no
  // dia seguinte `wasAway` era false e a cobrança voltava inteira. Quem voltou
  // depois de 5 dias sumido era cobrado na SEGUNDA abertura, que é o momento de
  // maior risco de abandono, não o de menor.
  it('quem voltou não é cobrado na segunda abertura', () => {
    const longAgo = new Date('2026-07-28T12:00:00').toDateString();
    const retorno = runReset({ ...baseState(), tasks: tarefasNaoFeitas(), lastResetDate: longAgo, healthPoints: 3 });
    expect(retorno.lastDayReport.welcomeBack).toBe(true);
    expect(retorno.lastDayReport.heartsLost).toBe(0);

    // Segunda abertura: um dia normal depois do retorno.
    const diaSeguinte = runReset(
      { ...retorno, tasks: tarefasNaoFeitas(), healthPoints: 3 },
      new Date('2026-08-06T12:00:00'),
    );
    expect(diaSeguinte.lastDayReport.welcomeBack).toBe(false);
    expect(diaSeguinte.lastDayReport.heartsLost).toBe(0);
    expect(diaSeguinte.healthPoints).toBe(3);
  });

  it('a rampa dura RETURN_GRACE_DAYS viradas e depois a cobrança volta', () => {
    const longAgo = new Date('2026-07-28T12:00:00').toDateString();
    let s: any = runReset({ ...baseState(), tasks: tarefasNaoFeitas(), lastResetDate: longAgo, healthPoints: 3 });

    for (let i = 1; i <= RETURN_GRACE_DAYS; i++) {
      s = runReset(
        { ...s, tasks: tarefasNaoFeitas(), healthPoints: 3 },
        new Date(`2026-08-0${5 + i}T12:00:00`),
      );
      expect(s.lastDayReport.heartsLost).toBe(0);
    }

    const cobrada = runReset(
      { ...s, tasks: tarefasNaoFeitas(), healthPoints: 3 },
      new Date(`2026-08-0${5 + RETURN_GRACE_DAYS + 1}T12:00:00`),
    );
    expect(cobrada.lastDayReport.heartsLost).toBe(MAX_HEARTS_LOST_PER_DAY);
  });

  it('save antigo que voltou ANTES da regra ganha ao menos a virada seguinte', () => {
    // Só o `welcomeBack` do relatório antigo existe — nenhum contador.
    const antigo = {
      ...baseState(),
      tasks: tarefasNaoFeitas(),
      healthPoints: 3,
      lastDayReport: { date: 'seed', saveDay: 90, welcomeBack: true, daysAway: 5 },
    };
    expect(runReset(antigo).lastDayReport.heartsLost).toBe(0);
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
    const result = runReset({ ...baseState(), tasks, lastResetDate: sunday, healthPoints: 3, restWeekKey: restWeekKeyFor(new Date(sunday)) }, MONDAY);
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
      // A folga da SEMANA DO DOMINGO já foi gasta — senão ela absorve a perda,
      // o HP não zera e não há degeneração para este teste observar.
      restWeekKey: restWeekKeyFor(new Date(sunday)),
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

// ---------------------------------------------------------------------------
// PARIDADE MANUAL × AUTOMÁTICO
//
// Existem DOIS caminhos que degeneram: a virada com HP 0 (`computeDailyReset`,
// acima) e o BOTÃO da página de Evolução (`handleDegenerate`, App.tsx). A
// expressão estava escrita à mão nos dois, e divergiu em silêncio — o footgun
// 9 literal. O automático virou piso + custo fixo; o manual ficou na
// ATRIBUIÇÃO antiga (`= floor(required/2)`), que é ESTRITAMENTE mais dura para
// qualquer jogador acima do piso: um mega com 39 dias perfeitos que descia de
// PROPÓSITO caía para 2, enquanto o mesmo mega que só deixou o HP zerar
// reaparecia com 34. O comentário do App prometia "recuperação mais fácil que
// o descuido" e a linha entregava o oposto.
//
// A regra passou a ter dono único (`degeneratedPerfectDays`), e estes dois
// testes são o que impede a cópia de voltar: o primeiro compara os NÚMEROS dos
// dois caminhos, o segundo lê o FONTE do App e exige que ele chame a função em
// vez de reescrever a expressão.
// ---------------------------------------------------------------------------
describe('degeneração — paridade entre o caminho manual e o automático', () => {
  /** O que `handleDegenerate` (App.tsx) faz hoje, pela função dona da regra. */
  const manual = (prevPerfectDays: number, targetStage: string) =>
    degeneratedPerfectDays(prevPerfectDays, getStageLevel(targetStage));

  const casos: Array<{ de: string; branch: string; para: string; dias: number }> = [
    { de: 'mega-virus', branch: 'virus', para: 'ultimate-virus', dias: 39 },
    { de: 'mega-virus', branch: 'virus', para: 'ultimate-virus', dias: 6 },
    { de: 'mega-virus', branch: 'virus', para: 'ultimate-virus', dias: 0 },
    { de: 'champion-data', branch: 'data', para: 'rookie', dias: 12 },
    { de: 'champion-data', branch: 'data', para: 'rookie', dias: 1 },
    { de: 'ultimate-vaccine', branch: 'vaccine', para: 'champion-vaccine', dias: 25 },
  ];

  it.each(casos)('$de com $dias dias perfeitos: manual == automático', ({ de, branch, para, dias }) => {
    const tasks = Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, completed: false }));
    const auto = runReset({
      ...baseState(), tasks, healthPoints: 1,
      evolutionStage: de, currentBranch: branch, perfectDays: dias,
    });
    // O automático realmente caiu, e caiu para onde o manual mandaria descer.
    expect(auto.degeneratedByHP).toBe(true);
    expect(getStageLevel(auto.evolutionStage)).toBe(getStageLevel(para));
    // E o número é O MESMO. Esta é a asserção inteira do achado.
    expect(auto.perfectDays).toBe(manual(dias, auto.evolutionStage));
  });

  it('a queda deliberada NUNCA é mais dura que o descuido, em nenhum ponto da escada', () => {
    for (let dias = 0; dias <= 60; dias++) {
      const tasks = Array.from({ length: 8 }, (_, i) => ({ id: `t${i}`, completed: false }));
      const auto = runReset({
        ...baseState(), tasks, healthPoints: 1,
        evolutionStage: 'mega-virus', currentBranch: 'virus', perfectDays: dias,
      });
      expect(manual(dias, auto.evolutionStage)).toBeGreaterThanOrEqual(auto.perfectDays);
    }
  });

  it('`handleDegenerate` chama a função dona da regra — nada de expressão à mão', () => {
    const src = readFileSync(path.join(process.cwd(), 'src', 'App.tsx'), 'utf-8');
    const inicio = src.indexOf('const handleDegenerate');
    expect(inicio).toBeGreaterThan(-1);
    const corpo = src.slice(inicio, inicio + 1600);
    expect(corpo).toContain('degeneratedPerfectDays(');
    // A cópia que causou o bug, em qualquer espaçamento.
    expect(corpo).not.toMatch(/Math\.floor\(\s*FORM_REQUIREMENTS\[[^\]]+\]\.required\s*\/\s*2\s*\)/);
  });
});

// ---------------------------------------------------------------------------
// ⚡ ENERGIA DO DIA PERFEITO — medida contra a META DO DIA, não contra o
// requisito cru do estágio.
//
// A linha do `dayWasPerfect` misturava as duas réguas: tarefas contra
// `dailyGoal` (que já é `min(cadastradas, requisito)`) e energia contra
// `FORM_REQUIREMENTS[...].required`. Como comida vem de CONCLUIR tarefa (1 por
// conclusão) e energia só enche comendo, o jogador cuja meta do dia era menor
// que o requisito NÃO TINHA COMO encher a barra — o dia perfeito era negado a
// quem fez 100% do que se comprometeu a fazer, sem uma linha de aviso.
// ---------------------------------------------------------------------------
describe('dia perfeito: a energia é cobrada contra a meta do dia', () => {
  // Domingo de madrugada fecha o dia de SÁBADO (weekDay 6).
  const DOMINGO = new Date('2026-08-16T04:00:00');
  const SABADO_STR = new Date('2026-08-15T12:00:00').toDateString();
  const SEG_A_SEX = [1, 2, 3, 4, 5];

  /** Mega (requisito 6) com a rotina toda em dias úteis e 2 tarefas no sábado. */
  const megaNoSabado = (feitas: number, energia: number) => ({
    ...baseState(),
    evolutionStage: 'mega-data',
    maxHealthPoints: 4,
    healthPoints: 4,
    lastResetDate: SABADO_STR,
    activities: [1, 2, 3, 4].map(i => ({
      id: `a${i}`, category: 'Health', steps: [], weekDays: SEG_A_SEX,
    })),
    tasks: [
      { id: 't1', completed: feitas >= 1 },
      { id: 't2', completed: feitas >= 2 },
    ],
    energyPoints: energia,
  });

  it('mega no sábado com meta 2 faz as 2, ganha 2 comidas e GANHA o dia perfeito', () => {
    // 2 conclusões = 2 comidas = energia máxima possível 2. O requisito do
    // estágio (6) era inalcançável naquele dia por construção.
    const r = runReset(megaNoSabado(2, 2), DOMINGO);
    expect(r.lastDayWasPerfect).toBe(true);
    expect(r.lastDayReport.energyWasFull).toBe(true);
    expect(r.perfectDays).toBe(1);
    expect(r.healthPoints).toBe(4); // e não perdeu coração nenhum
  });

  it('AUTOVERIFICAÇÃO: quem fez a meta e NÃO comeu continua sem dia perfeito', () => {
    // Sem este caso, a energia teria virado decoração — bastaria fazer as
    // tarefas e o "cuidar do bicho" sairia da conta.
    const r = runReset(megaNoSabado(2, 0), DOMINGO);
    expect(r.lastDayWasPerfect).toBe(false);
    expect(r.lastDayReport.energyWasFull).toBe(false);
  });

  it('AUTOVERIFICAÇÃO: quem NÃO fez a meta não ganha o dia por ter energia', () => {
    const r = runReset(megaNoSabado(1, 6), DOMINGO);
    expect(r.lastDayWasPerfect).toBe(false);
  });

  it('num dia cheio nada afrouxou: mega com 6 itens ainda precisa de 6 de energia', () => {
    const seisItens = (energia: number) => ({
      ...baseState(),
      evolutionStage: 'mega-data',
      maxHealthPoints: 4,
      healthPoints: 4,
      tasks: Array.from({ length: 6 }, (_, i) => ({ id: `t${i}`, completed: true })),
      energyPoints: energia,
    });
    expect(runReset(seisItens(5)).lastDayWasPerfect).toBe(false);
    expect(runReset(seisItens(FORM_REQUIREMENTS.mega.required)).lastDayWasPerfect).toBe(true);
  });

  it('a energia exigida NUNCA passa das barras que o estágio tem', () => {
    // Invariante estrutural: a barra cheia é `getMaxEnergyForStage`, e a meta do
    // dia é `min(cadastradas, required)` — logo a exigência é sempre alcançável.
    for (const stage of ['rookie', 'champion-data', 'ultimate-data', 'mega-data', 'ultra']) {
      const nItens = 20; // cadastro grande de propósito: meta = requisito cheio
      const st = {
        ...baseState(),
        evolutionStage: stage,
        tasks: Array.from({ length: nItens }, (_, i) => ({ id: `t${i}`, completed: true })),
        energyPoints: getMaxEnergyForStage(stage),
      };
      expect(`${stage}: ${runReset(st).lastDayWasPerfect}`).toBe(`${stage}: true`);
    }
  });
});
