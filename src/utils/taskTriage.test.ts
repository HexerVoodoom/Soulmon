import { describe, it, expect } from 'vitest';
import {
  HAUNTED_AFTER_DAYS,
  MAX_DAILY_FOCUS,
  POSTPONE_NUDGE_AT,
  OVERCOMMIT_EFFORT,
  HABIT_WEIGHT,
} from '../types/taskModel';
import {
  TriageTask,
  taskStatus,
  isActive,
  effortOf,
  weightOf,
  habitWeight,
  daysStale,
  isHaunted,
  isOverdue,
  postpone,
  needsPostponeNudge,
  shrink,
  drop,
  restore,
  toSomeday,
  toOpen,
  setFocus,
  focusTasks,
  focusComplete,
  plannedEffort,
  isOvercommitted,
  triageQueue,
} from './taskTriage';

const NOW = new Date(2026, 7, 19, 12, 0, 0); // 19/ago/2026, quarta-feira
const dayKey = NOW.toDateString();

function daysAgoIso(n: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function task(over: Partial<TriageTask> = {}): TriageTask {
  return { id: 't', name: 'tarefa', ...over };
}

/** Uma tarefa como os saves existentes a têm: sem NENHUM campo novo. */
function legacyTask(id = 'legacy'): TriageTask {
  return { id, name: 'tarefa antiga', completed: false };
}

describe('saves antigos (sem os campos novos) nunca quebram', () => {
  it('assume open / effort 1 / 0 dias parada / sem nudge', () => {
    const t = legacyTask();
    expect(taskStatus(t)).toBe('open');
    expect(isActive(t)).toBe(true);
    expect(effortOf(t)).toBe(1);
    expect(weightOf(t)).toBe(1);
    expect(daysStale(t, NOW)).toBe(0);
    expect(needsPostponeNudge(t)).toBe(false);
  });

  it('NÃO assombra em massa no primeiro dia depois do update', () => {
    // Sem createdAt nem lastTouchedAt o app não sabe a idade — e assombrar o
    // backlog inteiro de quem só atualizou seria a tela de culpa que este
    // módulo existe para evitar.
    expect(isHaunted(legacyTask(), NOW)).toBe(false);
  });

  it('effort inválido cai no padrão', () => {
    expect(effortOf(task({ effort: 9 as never }))).toBe(1);
    expect(effortOf(task({ effort: 3 }))).toBe(3);
  });

  it('habitWeight() é o HABIT_WEIGHT do contrato', () => {
    expect(habitWeight()).toBe(HABIT_WEIGHT);
  });
});

describe('someday é deliberadamente inerte', () => {
  it('não é ativa', () => {
    expect(isActive(task({ status: 'someday' }))).toBe(false);
    expect(isActive(task({ status: 'dropped' }))).toBe(false);
  });

  it('NUNCA assombra, nem parada há um ano, nem vencida', () => {
    const velha = task({ status: 'someday', createdAt: daysAgoIso(365) });
    expect(isHaunted(velha, NOW)).toBe(false);

    const vencida = task({
      status: 'someday',
      deadline: { date: '2020-01-01', time: '10:00' },
    });
    expect(isHaunted(vencida, NOW)).toBe(false);
  });

  it('não conta na carga do dia nem entra na fila de triagem', () => {
    const t = task({ status: 'someday', effort: 3, startDate: dayKey, createdAt: daysAgoIso(90) });
    expect(plannedEffort([t], [], dayKey)).toBe(0);
    expect(triageQueue([t], NOW)).toHaveLength(0);
  });

  it('toSomeday tira do foco e zera o contador; toOpen devolve sem assombrar', () => {
    const t = task({ postponedCount: 4, focusDate: dayKey });
    const guardada = toSomeday(t, NOW);
    expect(guardada.status).toBe('someday');
    expect(guardada.postponedCount).toBe(0);
    expect(guardada.focusDate).toBeUndefined();

    const devolta = toOpen(guardada, NOW);
    expect(devolta.status).toBe('open');
    expect(isHaunted(devolta, NOW)).toBe(false);
  });
});

describe('assombração (aging)', () => {
  it('deadline vencido assombra na hora', () => {
    const t = task({ deadline: { date: '2026-08-18', time: '23:59' }, lastTouchedAt: daysAgoIso(0) });
    expect(isOverdue(t, NOW)).toBe(true);
    expect(isHaunted(t, NOW)).toBe(true);
  });

  it('deadline futuro não assombra', () => {
    const t = task({ deadline: { date: '2026-12-31', time: '23:59' }, lastTouchedAt: daysAgoIso(0) });
    expect(isOverdue(t, NOW)).toBe(false);
    expect(isHaunted(t, NOW)).toBe(false);
  });

  it('deadline do MESMO dia com hora ainda por vir não está vencido', () => {
    const t = task({ deadline: { date: '2026-08-19', time: '23:59' } });
    expect(isOverdue(t, NOW)).toBe(false);
  });

  it('HAUNTED_AFTER_DAYS é a fronteira exata', () => {
    const quase = task({ lastTouchedAt: daysAgoIso(HAUNTED_AFTER_DAYS - 1) });
    const exata = task({ lastTouchedAt: daysAgoIso(HAUNTED_AFTER_DAYS) });
    expect(daysStale(quase, NOW)).toBe(HAUNTED_AFTER_DAYS - 1);
    expect(isHaunted(quase, NOW)).toBe(false);
    expect(isHaunted(exata, NOW)).toBe(true);
  });

  it('lastTouchedAt manda sobre createdAt', () => {
    const t = task({ createdAt: daysAgoIso(90), lastTouchedAt: daysAgoIso(1) });
    expect(daysStale(t, NOW)).toBe(1);
    expect(isHaunted(t, NOW)).toBe(false);
  });

  it('sem lastTouchedAt, createdAt vale', () => {
    expect(daysStale(task({ createdAt: daysAgoIso(10) }), NOW)).toBe(10);
  });
});

describe('adiamento e o nudge do Sunsama', () => {
  it('postpone incrementa, marca o toque e pode mover o startDate', () => {
    const t = postpone(task(), NOW, '2026-08-20');
    expect(t.postponedCount).toBe(1);
    expect(t.lastTouchedAt).toBe(NOW.toISOString());
    expect(t.startDate).toBe('2026-08-20');

    const t2 = postpone(t, NOW);
    expect(t2.postponedCount).toBe(2);
    expect(t2.startDate).toBe('2026-08-20'); // sem argumento, não mexe
  });

  it('o nudge aparece no terceiro adiamento, e não antes', () => {
    expect(POSTPONE_NUDGE_AT).toBe(3);
    let t = task();
    t = postpone(t, NOW);
    expect(needsPostponeNudge(t)).toBe(false);
    t = postpone(t, NOW);
    expect(needsPostponeNudge(t)).toBe(false);
    t = postpone(t, NOW);
    expect(needsPostponeNudge(t)).toBe(true);
  });

  it('adiar não deixa a tarefa parada (ela assombra pelo contador, não pelo tempo)', () => {
    const velha = task({ createdAt: daysAgoIso(30) });
    expect(isHaunted(velha, NOW)).toBe(true);
    expect(isHaunted(postpone(velha, NOW), NOW)).toBe(false);
  });
});

describe('encolher', () => {
  it('rebaixa o esforço em 1 e ZERA o contador de adiamentos', () => {
    const t = shrink(task({ effort: 3, postponedCount: 3 }));
    expect(t.effort).toBe(2);
    expect(t.postponedCount).toBe(0);
    expect(needsPostponeNudge(t)).toBe(false);
  });

  it('o piso é 1', () => {
    expect(shrink(task({ effort: 1, postponedCount: 5 })).effort).toBe(1);
    expect(shrink(shrink(task({ effort: 2 }))).effort).toBe(1);
  });

  it('com `now`, também conta como toque', () => {
    expect(shrink(task(), NOW).lastTouchedAt).toBe(NOW.toISOString());
  });
});

describe('deixar pra lá tem volta (Won\'t Do do TickTick)', () => {
  it('drop tira do jogo sem apagar a tarefa', () => {
    const t = drop(task({ effort: 3, name: 'declarar imposto' }), NOW);
    expect(t.status).toBe('dropped');
    expect(t.name).toBe('declarar imposto'); // contexto preservado
    expect(isActive(t)).toBe(false);
    expect(isHaunted(t, NOW)).toBe(false);
  });

  it('restore devolve à lista viva', () => {
    const t = restore(drop(task(), NOW), NOW);
    expect(t.status).toBe('open');
    expect(isActive(t)).toBe(true);
  });
});

describe('foco do dia', () => {
  const pool: TriageTask[] = [
    task({ id: 'a' }),
    task({ id: 'b' }),
    task({ id: 'c' }),
    task({ id: 'd' }),
    task({ id: 'e', status: 'someday' }),
  ];

  it('marca no máximo MAX_DAILY_FOCUS, na ordem pedida', () => {
    expect(MAX_DAILY_FOCUS).toBe(3);
    const out = setFocus(pool, ['a', 'b', 'c', 'd'], dayKey);
    expect(focusTasks(out, dayKey).map(t => t.id)).toEqual(['a', 'b', 'c']);
    expect(out.find(t => t.id === 'd')!.focusDate).toBeUndefined();
  });

  it('tarefa someday não pode virar foco', () => {
    const out = setFocus(pool, ['e', 'a'], dayKey);
    expect(focusTasks(out, dayKey).map(t => t.id)).toEqual(['a']);
  });

  it('limpa o foco anterior DO MESMO dia e preserva o de outros dias', () => {
    const ontem = new Date(NOW);
    ontem.setDate(ontem.getDate() - 1);
    const antes = setFocus(pool, ['a', 'b'], dayKey).map(t =>
      t.id === 'd' ? { ...t, focusDate: ontem.toDateString() } : t,
    );
    const depois = setFocus(antes, ['c'], dayKey);
    expect(focusTasks(depois, dayKey).map(t => t.id)).toEqual(['c']);
    expect(depois.find(t => t.id === 'd')!.focusDate).toBe(ontem.toDateString());
  });

  it('focusComplete só é verdadeiro com todos os focos feitos', () => {
    const out = setFocus(pool, ['a', 'b', 'c'], dayKey);
    expect(focusComplete(out, [], dayKey)).toBe(false);

    // `completeTask` REMOVE a tarefa de `tasks` — o foco precisa contar as duas listas.
    const restantes = out.filter(t => t.id !== 'a' && t.id !== 'b');
    const concluidas = [
      { id: 'a', completedAt: NOW.toISOString(), focusDate: dayKey },
      { id: 'b', completedAt: NOW.toISOString(), focusDate: dayKey },
    ];
    expect(focusComplete(restantes, concluidas, dayKey)).toBe(false);

    const todas = restantes.filter(t => t.id !== 'c');
    expect(
      focusComplete(todas, [...concluidas, { id: 'c', completedAt: NOW.toISOString(), focusDate: dayKey }], dayKey),
    ).toBe(true);
  });

  it('sem foco escolhido não existe selo do dia', () => {
    expect(focusComplete(pool, [], dayKey)).toBe(false);
  });
});

describe('carga do dia é PONDERADA, nunca contada', () => {
  it('uma tarefa de esforço 3 pesa como três de esforço 1', () => {
    const pesada = [task({ id: 'p', effort: 3, startDate: dayKey })];
    const leves = [
      task({ id: 'l1', effort: 1, startDate: dayKey }),
      task({ id: 'l2', effort: 1, startDate: dayKey }),
      task({ id: 'l3', effort: 1, startDate: dayKey }),
    ];
    expect(plannedEffort(pesada, [], dayKey)).toBe(3);
    expect(plannedEffort(leves, [], dayKey)).toBe(3);
  });

  it('tarefa de outro dia não entra; foco do dia entra', () => {
    const tasks = [
      task({ id: 'outro', effort: 3, startDate: '2026-09-01' }),
      task({ id: 'foco', effort: 2, focusDate: dayKey }),
    ];
    expect(plannedEffort(tasks, [], dayKey)).toBe(2);
  });

  it('hábitos entram por HABIT_WEIGHT, filtrados pelo dia da semana', () => {
    const weekDay = NOW.getDay(); // 3 (quarta)
    const activities = [
      { weekDays: [weekDay] },
      { weekDays: [(weekDay + 1) % 7] }, // outro dia — não conta
      {}, // sem weekDays = todo dia (save antigo)
    ];
    expect(plannedEffort([], activities, dayKey)).toBe(2 * HABIT_WEIGHT);
  });

  it('tarefa já concluída não pesa mais', () => {
    const t = [task({ effort: 3, startDate: dayKey, completed: true })];
    expect(plannedEffort(t, [], dayKey)).toBe(0);
  });

  it('o aviso de sobrecarga dispara ACIMA de OVERCOMMIT_EFFORT', () => {
    expect(isOvercommitted(OVERCOMMIT_EFFORT)).toBe(false);
    expect(isOvercommitted(OVERCOMMIT_EFFORT + 1)).toBe(true);
  });
});

describe('triageQueue — "Arrumar a pilha"', () => {
  it('vencidas primeiro (a mais antiga na frente), depois as mais paradas', () => {
    const tasks: TriageTask[] = [
      task({ id: 'parada-10', lastTouchedAt: daysAgoIso(10) }),
      task({ id: 'vencida-recente', deadline: { date: '2026-08-18', time: '10:00' }, lastTouchedAt: daysAgoIso(0) }),
      task({ id: 'parada-30', lastTouchedAt: daysAgoIso(30) }),
      task({ id: 'vencida-antiga', deadline: { date: '2026-01-05', time: '10:00' }, lastTouchedAt: daysAgoIso(0) }),
      task({ id: 'em-dia', lastTouchedAt: daysAgoIso(1) }),
      task({ id: 'guardada', status: 'someday', lastTouchedAt: daysAgoIso(90) }),
      task({ id: 'largada', status: 'dropped', lastTouchedAt: daysAgoIso(90) }),
    ];

    expect(triageQueue(tasks, NOW).map(t => t.id)).toEqual([
      'vencida-antiga',
      'vencida-recente',
      'parada-30',
      'parada-10',
    ]);
  });

  it('não devolve tarefas já marcadas como feitas', () => {
    const tasks = [task({ id: 'x', completed: true, lastTouchedAt: daysAgoIso(30) })];
    expect(triageQueue(tasks, NOW)).toHaveLength(0);
  });

  it('a ordem é estável (desempate por id) e a lista original não é mutada', () => {
    const tasks = [
      task({ id: 'z', lastTouchedAt: daysAgoIso(10) }),
      task({ id: 'a', lastTouchedAt: daysAgoIso(10) }),
    ];
    expect(triageQueue(tasks, NOW).map(t => t.id)).toEqual(['a', 'z']);
    expect(tasks.map(t => t.id)).toEqual(['z', 'a']);
  });

  it('a fila esvazia conforme o usuário decide — é isso que evita a falência', () => {
    let tasks: TriageTask[] = [
      task({ id: 'a', lastTouchedAt: daysAgoIso(20) }),
      task({ id: 'b', lastTouchedAt: daysAgoIso(20) }),
    ];
    expect(triageQueue(tasks, NOW)).toHaveLength(2);
    tasks = tasks.map(t => (t.id === 'a' ? toSomeday(t, NOW) : drop(t, NOW)));
    expect(triageQueue(tasks, NOW)).toHaveLength(0);
    // e nada foi apagado
    expect(tasks).toHaveLength(2);
  });
});
