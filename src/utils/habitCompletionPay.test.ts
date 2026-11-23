import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { GameState, Activity } from '../contexts/GameStateContext';
import { applyHabitCompletion, withHabitCompletion, ACTIVITY_LOG_CAP } from './habitCompletionPay';
import { settlePendingRollover } from './dailyReset';
import { playerDayKey } from './playerDay';
import { FOOD_BY_CATEGORY } from '../constants/labels';
import { emptyRhythm, completeHabit } from './habitRhythm';
import { applyWidgetEvents, localIsoDay } from './widgetEvents';
import { widgetTaskList } from '../plugins/SoulmonWidgetPlugin';

const AGORA = new Date(2026, 10, 18, 10, 0, 0);
const HOJE = AGORA.toDateString();
const DIARIO = [0, 1, 2, 3, 4, 5, 6];
const EID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function habito(id: string, over: Partial<Activity> = {}): Activity {
  return { id, name: `H ${id}`, emoji: '🏃', category: 'corpo', steps: [], weekDays: DIARIO, completedToday: false, ...over } as unknown as Activity;
}
function estado(activities: Activity[], over: Partial<GameState> = {}): GameState {
  return {
    tasks: [], completedTasks: [], activities, activityStats: {}, foodInventory: {}, activityLog: [], totalXP: 40,
    powerPoints: 10, harmonyPoints: 10, benevolencePoints: 10, habitRhythms: {}, lastResetDate: HOJE, fundadorUltimoDia: '2026-11-18', fundadorPremios: [], ...over, // Fundador já contado hoje (paridade com o toque ANTIGO; gancho novo em fundador.test.ts)
  } as unknown as GameState;
}

/** REFERÊNCIA: o updater de `handleToggleActivityCompletion` ANTES da extração (main 1f36f3d35), ao pé da letra. */
function toqueAntigo(prevRaw: GameState, activityId: string, now: Date, today: string): GameState {
  const prev = settlePendingRollover(prevRaw, now);
  const activity = prev.activities.find(a => a.id === activityId);
  if (!activity) return prev;
  const isCurrentlyCompleted = activity.completedToday && activity.lastCompletedDate === today;
  const newCompletedState = !isCurrentlyCompleted;
  const updatedActivities = prev.activities.map(act => act.id === activityId
    ? { ...act, completedToday: newCompletedState, lastCompletedDate: newCompletedState ? today : act.lastCompletedDate } : act);
  let newActivityStats = prev.activityStats;
  if (newCompletedState && activity) {
    const activityKey = `activity-${activity.id}`;
    const currentStats = prev.activityStats[activityKey] || { name: activity.name, emoji: activity.emoji, category: activity.category, completionCount: 0 };
    newActivityStats = { ...prev.activityStats, [activityKey]: { ...currentStats, completionCount: currentStats.completionCount + 1 } };
  }
  let newFoodInventory = prev.foodInventory;
  let newActivityLog = prev.activityLog ?? [];
  if (newCompletedState && activity) {
    const food = FOOD_BY_CATEGORY[activity.category as keyof typeof FOOD_BY_CATEGORY];
    if (food) newFoodInventory = { ...prev.foodInventory, [food.emoji]: (prev.foodInventory[food.emoji] ?? 0) + 1 };
    newActivityLog = [...newActivityLog, now.toISOString()].slice(-ACTIVITY_LOG_CAP);
  }
  const next: GameState = { ...prev, activities: updatedActivities, activityStats: newActivityStats, foodInventory: newFoodInventory, activityLog: newActivityLog };
  return newCompletedState ? withHabitCompletion(next, activityId, activity.category, today, playerDayKey(now, prev.playerDayTz)) : next;
}

/** Ritmo com 6 dias seguidos antes de hoje: a conclusão de hoje cruza o marco de 7. */
function seisDias() {
  let r = emptyRhythm();
  for (let d = 6; d >= 1; d--) r = completeHabit(r, new Date(2026, 10, 18 - d, 10).toDateString());
  return r;
}

describe('paridade: hábito do widget = toque no hábito da Home', () => {
  const casos: Array<[string, GameState]> = [
    ['hábito comum', estado([habito('h1'), habito('h2')])],
    ['hábito no marco de 7 dias (Vínculo do marco + bônus de maturidade)', estado([habito('h1')], { habitRhythms: { h1: seisDias() } } as Partial<GameState>)],
    ['hábito de outra categoria com estatística prévia', estado([habito('h1', { category: 'mente' } as Partial<Activity>)], { activityStats: { 'activity-h1': { name: 'H h1', emoji: '🏃', category: 'mente', completionCount: 4 } } } as Partial<GameState>)],
    ['hábito feito ontem (lastCompletedDate antigo)', estado([habito('h1', { completedToday: true, lastCompletedDate: new Date(2026, 10, 17).toDateString() } as Partial<Activity>)])],
  ];
  for (const [nome, gs] of casos) {
    it(nome, () => {
      expect(applyHabitCompletion(gs, 'h1', AGORA, HOJE)).toEqual(toqueAntigo(gs, 'h1', AGORA, HOJE));
    });
  }

  it('a drenagem do widget dá o mesmo estado do toque', () => {
    const gs = estado([habito('h1')]);
    const r = applyWidgetEvents(gs, [{ eid: EID(1), kind: 'habit_done', ref: 'h1', dayKey: localIsoDay(AGORA), ts: 1 }], [], AGORA);
    expect(r.paid.map(p => [p.kind, p.id])).toEqual([['habit', 'h1']]);
    expect(r.state).toEqual(toqueAntigo(gs, 'h1', AGORA, HOJE));
  });
});

describe('hábito na fila: idempotência e dia certo', () => {
  const evH = (n: number, ref: string, dayKey = localIsoDay(AGORA)) => ({ eid: EID(n), kind: 'habit_done', ref, dayKey, ts: n });

  it('já feito hoje no app (marcou antes de drenar) = ignora, mas sai da fila', () => {
    const gs = applyHabitCompletion(estado([habito('h1')]), 'h1', AGORA);
    const r = applyWidgetEvents(gs, [evH(1, 'h1')], [], AGORA);
    expect(r.paid).toHaveLength(0);
    expect(r.state).toBe(gs);
    expect(r.handled).toEqual([EID(1)]);
  });

  it('reaplicar o mesmo eid = no-op; dois eventos do mesmo hábito pagam uma vez', () => {
    const gs = estado([habito('h1')]);
    const um = applyWidgetEvents(gs, [evH(1, 'h1'), evH(2, 'h1')], [], AGORA);
    expect(um.paid).toHaveLength(1);
    const dois = applyWidgetEvents(um.state, [evH(1, 'h1')], um.applied, AGORA);
    expect(dois.state).toBe(um.state);
  });

  it('check de ONTEM não conta hoje', () => {
    const gs = estado([habito('h1')]);
    const r = applyWidgetEvents(gs, [evH(1, 'h1', '2026-11-17')], [], AGORA);
    expect(r.paid).toHaveLength(0);
    expect(r.state).toBe(gs);
    expect(r.handled).toEqual([EID(1)]);
  });

  it('hábito inexistente ou com etapas = ignora', () => {
    const gs = estado([habito('etapas', { steps: [{ id: 's', label: 's', completed: false }] } as Partial<Activity>)]);
    const r = applyWidgetEvents(gs, [evH(1, 'sumiu'), evH(2, 'etapas')], [], AGORA);
    expect(r.paid).toHaveLength(0);
    expect(r.state).toBe(gs);
  });

  it('tarefa e hábito com o mesmo id não se confundem', () => {
    const gs = estado([habito('x')], { tasks: [{ id: 'x', name: 'T', emoji: '📚', category: 'aprendizado', completed: false, status: 'open', createdAt: AGORA.toISOString(), lastTouchedAt: AGORA.toISOString() }] } as Partial<GameState>);
    const r = applyWidgetEvents(gs, [evH(1, 'x')], [], AGORA);
    expect(r.state.tasks).toHaveLength(1); // a tarefa segue aberta
    expect(r.state.activities[0].completedToday).toBe(true);
  });
});

describe('widgetTaskList com hábitos, na ordem da Home', () => {
  it('Tarefas (avulsas, agendadas, concluídas hoje) e depois Hábitos (abertos, feitos); etapas = lock', () => {
    const lista = widgetTaskList({
      tasks: [{ id: 't1', name: 'Avulsa', completed: false, status: 'open' }],
      completedTasks: [{ id: 'tz', name: 'Feita', completedAt: AGORA.toISOString() }],
      activities: [
        habito('feito', { completedToday: true, lastCompletedDate: HOJE } as Partial<Activity>),
        habito('aberto'),
        habito('etapas', { steps: [{ id: 's', label: 's', completed: false }] } as Partial<Activity>),
        habito('ag', { weekDays: [AGORA.getDay()] } as Partial<Activity>),
        habito('outroDia', { weekDays: [(AGORA.getDay() + 1) % 7] } as Partial<Activity>),
      ],
    } as never, AGORA);
    expect(lista.map(t => `${t.kind}:${t.id}:${t.done ? 1 : 0}${t.lock ? 'L' : ''}`)).toEqual([
      'task:t1:0', 'habit:ag:0', 'task:tz:1', 'habit:aberto:0', 'habit:etapas:0L', 'habit:feito:1',
    ]);
  });
});

describe('App.tsx usa a regra compartilhada do hábito (contrato)', () => {
  const app = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
  const corpo = app.slice(app.indexOf('const handleToggleActivityCompletion = '), app.indexOf('const toggleHabitRef'));
  it('o toque acerta por applyHabitCompletion e não reimplementa', () => {
    expect(corpo).toMatch(/applyHabitCompletion\(prevRaw, activityId, new Date\(\), today\)/);
    expect(corpo).not.toMatch(/withHabitCompletion\(|FOOD_BY_CATEGORY/);
  });
});
