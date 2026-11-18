import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import type { GameState, Task } from '../contexts/GameStateContext';
import { ackWidgetEvents, readWidgetEvents, widgetTaskList, WIDGET_TASK_LIST_MAX } from './SoulmonWidgetPlugin';
import { applyWidgetEvents, sanitizeApplied, sanitizeWidgetEvents, WIDGET_APPLIED_CAP } from '../utils/widgetEvents';
import { applyTaskCompletion } from '../utils/taskCompletionPay';

// ---------------------------------------------------------------------------
// WIDGET GRANDE DA HOME — a fila do check (decisão do dono, 18/11/2026).
// O widget SÓ MARCA; o app paga ao abrir, pela regra do toque na Home, uma vez.
// ---------------------------------------------------------------------------

const AGORA = new Date(2026, 10, 18, 10, 0, 0);
const ISO = AGORA.toISOString();
const EID = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

function tarefa(id: string, over: Partial<Task> = {}): Task {
  return { id, name: `T ${id}`, emoji: '📚', category: 'aprendizado', completed: false, status: 'open', createdAt: ISO, lastTouchedAt: ISO, ...over } as Task;
}
function estado(tasks: Task[], over: Partial<GameState> = {}): GameState {
  return { tasks, completedTasks: [], activityStats: {}, foodInventory: {}, totalXP: 40, activities: [], ...over } as unknown as GameState;
}
const ev = (n: number, ref: string, ts = n) => ({ eid: EID(n), kind: 'task_done', ref, dayKey: '2026-11-18', ts });

describe('drenagem: paga igual ao toque na Home, uma vez', () => {
  it('cada check vira a conclusão da Home (mesmo estado do applyTaskCompletion)', () => {
    const gs = estado([tarefa('a'), tarefa('b')]);
    const r = applyWidgetEvents(gs, [ev(1, 'a')], [], AGORA);
    expect(r.paid.map(p => p.task.id)).toEqual(['a']);
    expect(r.state).toEqual(applyTaskCompletion(gs, 'a', AGORA).state);
    expect(r.handled).toEqual([EID(1)]);
  });

  it('reaplicar o mesmo evento = no-op (registro de aplicados)', () => {
    const gs = estado([tarefa('a')]);
    const um = applyWidgetEvents(gs, [ev(1, 'a')], [], AGORA);
    const dois = applyWidgetEvents(um.state, [ev(1, 'a')], um.applied, AGORA);
    expect(dois.paid).toHaveLength(0);
    expect(dois.state).toBe(um.state);
    expect(dois.handled).toEqual([EID(1)]); // ainda vai no ack
  });

  it('reaplicar SEM o registro (perdeu o localStorage) também não paga: a tarefa já saiu da lista', () => {
    const gs = estado([tarefa('a')]);
    const um = applyWidgetEvents(gs, [ev(1, 'a')], [], AGORA);
    const dois = applyWidgetEvents(um.state, [ev(1, 'a')], [], AGORA);
    expect(dois.paid).toHaveLength(0);
    expect(dois.state).toBe(um.state);
  });

  it('dois eventos para a mesma tarefa pagam uma vez', () => {
    const r = applyWidgetEvents(estado([tarefa('a')]), [ev(1, 'a'), ev(2, 'a')], [], AGORA);
    expect(r.paid).toHaveLength(1);
    expect(r.handled).toEqual([EID(1), EID(2)]);
  });

  it('tarefa já concluída no app (ou noutro aparelho) = ignora, mas sai da fila', () => {
    const gs = estado([tarefa('a', { completed: true })]);
    const r = applyWidgetEvents(gs, [ev(1, 'a'), ev(2, 'sumiu')], [], AGORA);
    expect(r.paid).toHaveLength(0);
    expect(r.state).toBe(gs);
    expect(r.handled).toEqual([EID(1), EID(2)]);
  });

  it('tipo desconhecido é descartado sem pagar', () => {
    const gs = estado([tarefa('a')]);
    const r = applyWidgetEvents(gs, [{ eid: EID(1), kind: 'focus_intent', ref: 'a' }], [], AGORA);
    expect(r.state).toBe(gs);
    expect(r.handled).toEqual([EID(1)]);
  });

  it('aplica na ordem do toque (ts)', () => {
    const r = applyWidgetEvents(estado([tarefa('a'), tarefa('b')]), [ev(2, 'b', 20), ev(1, 'a', 10)], [], AGORA);
    expect(r.paid.map(p => p.task.id)).toEqual(['a', 'b']);
  });

  it('o registro tem teto', () => {
    const muitos = Array.from({ length: WIDGET_APPLIED_CAP }, (_, i) => EID(1000 + i));
    const r = applyWidgetEvents(estado([tarefa('a')]), [ev(1, 'a')], muitos, AGORA);
    expect(r.applied).toHaveLength(WIDGET_APPLIED_CAP);
    expect(r.applied[r.applied.length - 1]).toBe(EID(1));
  });
});

describe('o que vem do nativo é filtrado', () => {
  it('sanitizeWidgetEvents', () => {
    expect(sanitizeWidgetEvents(null)).toEqual([]);
    expect(sanitizeWidgetEvents([null, 1, { eid: 'x', kind: 'task_done', ref: 'a' }, { eid: EID(1), kind: 'task_done' }])).toEqual([]);
    expect(sanitizeWidgetEvents([{ eid: EID(1), kind: 'task_done', ref: 'a', ts: 5, lixo: 1 }])).toEqual([{ eid: EID(1), kind: 'task_done', ref: 'a', ts: 5 }]);
  });
  it('sanitizeApplied', () => {
    expect(sanitizeApplied('x')).toEqual([]);
    expect(sanitizeApplied(['a', 2, 'b'])).toEqual(['a', 'b']);
  });
});

describe('APK antigo (sem o comando): detecção de recurso', () => {
  it('peek que rejeita = null (sem recurso), nunca lança', async () => {
    await expect(readWidgetEvents({ peekWidgetEvents: () => Promise.reject(new Error('not implemented')) })).resolves.toBeNull();
  });
  it('peek ok = a lista', async () => {
    await expect(readWidgetEvents({ peekWidgetEvents: async () => ({ events: [1] }) })).resolves.toEqual([1]);
    await expect(readWidgetEvents({ peekWidgetEvents: async () => ({ events: 'x' }) })).resolves.toEqual([]);
  });
  it('ack que rejeita não lança; ack vazio nem chama', async () => {
    let chamou = false;
    await expect(ackWidgetEvents(['a'], { ackWidgetEvents: () => Promise.reject(new Error('x')) })).resolves.toBeUndefined();
    await ackWidgetEvents([], { ackWidgetEvents: async () => { chamou = true; } });
    expect(chamou).toBe(false);
  });
});

describe('widgetTaskList: a lista do widget', () => {
  it('abertas de hoje primeiro (foco na frente), feitas hoje depois; adiada fica de fora', () => {
    const lista = widgetTaskList({
      tasks: [
        tarefa('a'),
        tarefa('foco', { focusDate: AGORA.toDateString() } as Partial<Task>),
        tarefa('amanha', { startDate: '2026-11-25' } as Partial<Task>),
        tarefa('marcada', { completed: true }),
      ],
      completedTasks: [{ id: 'z', name: 'Feita hoje', completedAt: ISO }, { id: 'y', name: 'Ontem', completedAt: new Date(2026, 10, 17).toISOString() }],
    } as never, AGORA);
    expect(lista.map(t => [t.id, t.done])).toEqual([['foco', false], ['a', false], ['marcada', true], ['z', true]]);
  });
  it('teto e nome curto', () => {
    const lista = widgetTaskList({ tasks: Array.from({ length: 30 }, (_, i) => tarefa(`t${i}`, { name: `  nome   ${'x'.repeat(80)}` })) } as never, AGORA);
    expect(lista).toHaveLength(WIDGET_TASK_LIST_MAX);
    expect(lista[0].name.startsWith('nome x')).toBe(true);
    expect(lista[0].name.length).toBeLessThanOrEqual(40);
  });
});

describe('fontes (contrato)', () => {
  const app = readFileSync('src/App.tsx', 'utf8');
  const kt = readFileSync('android/app/src/main/java/com/soulmon/plugins/SoulmonWidgetPlugin.kt', 'utf8');
  const fila = readFileSync('android/app/src/main/java/com/soulmon/widget/WidgetEventQueue.kt', 'utf8');

  it('o App manda a lista e drena pela regra compartilhada', () => {
    expect(app).toMatch(/tasksJson:\s*JSON\.stringify\(widgetTaskList\(gameState, new Date\(\)\)\)/);
    expect(app).toMatch(/applyWidgetEvents\(prev, eventos, applied, new Date\(\)\)/);
    expect(app).toMatch(/readWidgetEvents\(\)/);
  });
  it('o ack só depois de gravar: dentro do efeito, depois do setTimeout', () => {
    const i = app.indexOf('const p = widgetAckPendente.current;');
    expect(i).toBeGreaterThan(-1);
    const bloco = app.slice(i, i + 500);
    expect(bloco).toMatch(/setTimeout[\s\S]*writeJson\(STORAGE_KEYS\.WIDGET_EVENTS_APPLIED[\s\S]*ackWidgetEvents\(p\.eids\)/);
  });
  it('o nativo expõe peek + ack (nunca pop) e não paga nada', () => {
    expect(kt).toMatch(/fun peekWidgetEvents\(call: PluginCall\)/);
    expect(kt).toMatch(/fun ackWidgetEvents\(call: PluginCall\)/);
    expect(kt).toMatch(/editor\.putString\("tasks_json"/);
    expect(fila).not.toMatch(/foodInventory|totalXP|gamePoints|awardBond/);
  });
});
