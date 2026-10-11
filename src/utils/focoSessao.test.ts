import { describe, it, expect } from 'vitest';
import {
  MAX_TWO_MIN, STEP_ORDER, buildPlan, canCompleteSession, canSave, completeSession, doneToday, dumpRemaining, emptyDraft,
  markDone, matrixOrder, nextStep, normalizeHistory, normalizeSession, prevStep, recordDone, saveSession, setFrog,
  setQuadrant, skipStep, startDump, toggleTwoMin, type PlanTask, type SessionDraft,
} from './focoSessao';

const T = (id: string, completed = false): PlanTask => ({ id, name: `Tarefa ${id}`, completed });
const tasks = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(id => T(id));
const ids = (p: Array<{ id: string }>) => p.map(x => x.id);
const ready = (d: Partial<SessionDraft> = {}): SessionDraft => ({ ...emptyDraft(), name: 'Manhã', environment: 'forest', ...d });

describe('focoSessao — etapas', () => {
  it('a ordem é a do dono: ritmo (pomodoro) → dois minutos → Eisenhower → sapo → se-então → brain dump → lista', () => {
    expect([...STEP_ORDER]).toEqual(['preparar', 'ritmo', 'dois-minutos', 'eisenhower', 'sapo', 'se-entao', 'esvaziar', 'revisar']);
  });
  it('avançar/voltar têm teto nas pontas e skip não toca no rascunho', () => {
    expect(nextStep('revisar')).toBe('revisar');
    expect(prevStep('preparar')).toBe('preparar');
    expect(skipStep('dois-minutos')).toBe('eisenhower');
    const d = toggleTwoMin(emptyDraft(), 'a');
    skipStep('dois-minutos');
    expect(d.twoMin).toEqual(['a']);
  });
});

describe('focoSessao — escolhas', () => {
  it('dois minutos: toca marca e desmarca, teto de MAX_TWO_MIN e o toque a mais é ignorado', () => {
    let d = emptyDraft();
    for (const t of tasks) d = toggleTwoMin(d, t.id);
    expect(d.twoMin.length).toBe(MAX_TWO_MIN);
    expect(toggleTwoMin(d, 'g')).toBe(d);
    expect(toggleTwoMin(d, 'a').twoMin).not.toContain('a');
  });
  it('Eisenhower ordena por quadrante e, no empate, pela ordem da lista; limpar tira da ordem', () => {
    let d = emptyDraft();
    d = setQuadrant(d, 'c', 'delegate'); d = setQuadrant(d, 'a', 'do'); d = setQuadrant(d, 'e', 'do'); d = setQuadrant(d, 'b', 'schedule');
    expect(ids(matrixOrder(d, tasks))).toEqual(['a', 'e', 'b', 'c']);
    expect(ids(matrixOrder(setQuadrant(d, 'a', null), tasks))).toEqual(['e', 'b', 'c']);
  });
  it('sapo: um só; tocar de novo solta', () => {
    const d = setFrog(setFrog(emptyDraft(), 'a'), 'b');
    expect(d.frog).toBe('b');
    expect(setFrog(d, 'b').frog).toBe('');
  });
});

describe('focoSessao — a lista organizada', () => {
  it('dois minutos primeiro (ordem do toque), depois o sapo, depois quadrantes; sem duplicar e juntando etiquetas', () => {
    let d = ready();
    d = toggleTwoMin(toggleTwoMin(d, 'd'), 'a');
    d = setFrog(d, 'b');
    d = setQuadrant(setQuadrant(setQuadrant(d, 'c', 'schedule'), 'a', 'do'), 'e', 'delegate');
    const plan = buildPlan(d, tasks);
    expect(ids(plan)).toEqual(['d', 'a', 'b', 'c', 'e']);
    expect(plan.find(p => p.id === 'a')!.tags).toEqual(['quick', 'do']);
  });
  it('"deixar de lado" sai da lista, a menos que a pessoa tenha tocado nela como sapo/2 min', () => {
    let d = setQuadrant(setQuadrant(ready(), 'a', 'drop'), 'b', 'drop');
    d = setFrog(d, 'b');
    expect(ids(buildPlan(d, tasks))).toEqual(['b']);
  });
  it('tarefa concluída na Home não entra; a ordem das tarefas recebidas não é mutada', () => {
    const list = [T('a', true), T('b')];
    const copy = JSON.stringify(list);
    const d = toggleTwoMin(toggleTwoMin(ready(), 'a'), 'b');
    expect(ids(buildPlan(d, list))).toEqual(['b']);
    expect(JSON.stringify(list)).toBe(copy);
  });
});

describe('focoSessao — salvar e concluir', () => {
  it('salvar exige nome e ambiente válido', () => {
    expect(canSave(emptyDraft())).toBe(false);
    expect(canSave({ ...ready(), environment: '' })).toBe(false);
    expect(saveSession(emptyDraft(), tasks, { id: 'x', day: '2026-10-10' })).toBeNull();
    expect(canSave(ready())).toBe(true);
  });
  it('concluir o processo exige plano (não um número de tarefas) e é idempotente', () => {
    const empty = saveSession(ready(), tasks, { id: 's1', day: '2026-10-10' })!;
    expect(canCompleteSession(empty)).toBe(false);
    expect(completeSession(empty)).toBe(empty);
    const one = saveSession(setFrog(ready(), 'a'), tasks, { id: 's2', day: '2026-10-10' })!;
    expect(canCompleteSession(one)).toBe(true);
    const done = completeSession(one);
    expect(done.status).toBe('completed');
    expect(completeSession(done)).toBe(done);
  });
  it('markDone só marca quem está no plano, sem duplicar', () => {
    const s = saveSession(setFrog(ready(), 'a'), tasks, { id: 's', day: '2026-10-10' })!;
    expect(markDone(s, 'zzz')).toBe(s);
    const m = markDone(s, 'a');
    expect(m.doneIds).toEqual(['a']);
    expect(markDone(m, 'a')).toBe(m);
  });
  it('várias sessões por dia: o registro é idempotente por id e filtra o dia', () => {
    const a = completeSession(saveSession(setFrog(ready({ name: 'A' }), 'a'), tasks, { id: 'a1', day: '2026-10-10' })!);
    const b = completeSession(saveSession(setFrog(ready({ name: 'B' }), 'b'), tasks, { id: 'b1', day: '2026-10-10' })!);
    let h = recordDone([], a); h = recordDone(h, b); h = recordDone(h, a);
    expect(h.map(x => x.name)).toEqual(['A', 'B']);
    expect(doneToday(h, '2026-10-10').length).toBe(2);
    expect(doneToday(h, '2026-10-11').length).toBe(0);
  });
});

describe('focoSessao — brain dump e storage', () => {
  it('o tempo é timestamp: restante nunca fica negativo e sem início é 0', () => {
    const end = startDump(1000, 5);
    expect(end).toBe(1000 + 300_000);
    expect(dumpRemaining(end, 1000 + 299_000)).toBe(1000);
    expect(dumpRemaining(end, end + 5)).toBe(0);
    expect(dumpRemaining(null, 1)).toBe(0);
  });
  it('lixo no storage vira null/limpo, nunca derruba', () => {
    expect(normalizeSession(null)).toBeNull();
    expect(normalizeSession({ id: 1 })).toBeNull();
    expect(normalizeHistory('x')).toEqual([]);
    const s = normalizeSession({ id: 's', name: 'N', day: '2026-10-10', status: 'ready', mode: 'p50', environment: 'nope', matrix: { a: 'do', b: 'zzz' }, twoMin: ['a', 'a', 3], dumpMinutes: 7, plan: [{ id: 'a', name: 'A', tags: ['frog', 'x'] }, 5], completedCycles: 500 })!;
    expect(s.environment).toBe('');
    expect(s.matrix).toEqual({ a: 'do' });
    expect(s.twoMin).toEqual(['a']);
    expect(s.dumpMinutes).toBe(5);
    expect(s.plan).toEqual([{ id: 'a', name: 'A', tags: ['frog'] }]);
    expect(s.completedCycles).toBe(99);
  });
  it('sessão salva no formato antigo (taskIds/quadrant) carrega sem plano', () => {
    const s = normalizeSession({ id: 'o', name: 'Velha', day: '2026-10-09', status: 'ready', mode: 'p25', taskIds: ['a'], quadrant: 'do' })!;
    expect(s.plan).toEqual([]);
  });
});
