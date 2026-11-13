import { describe, it, expect } from 'vitest';
import { closePastMonths, sumMonths } from './purposeAgg';
import { emptyRhythm, dayKeyOf, HISTORY_CAP } from './habitRhythm';
import { sanitizePurpose, emptyPurpose, localDayKey, monthKeyOf, setGoal, togglePriority } from './purpose';

const ALL = { id: 'a', weekDays: [0, 1, 2, 3, 4, 5, 6] };
function daysBetween(a: Date, b: Date): Date[] {
  const out: Date[] = [];
  for (let d = new Date(a); d <= b; d = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1)) out.push(d);
  return out;
}

describe('purposeAgg: fechamento retroativo do mês (E10)', () => {
  it('app fechado 150 dias: fecha todos os meses do vão, sem cobrar os dias fora', () => {
    const r = emptyRhythm();
    r.done = daysBetween(new Date(2026, 2, 1), new Date(2026, 3, 10)).map(dayKeyOf);
    r.totalDone = r.done.length;
    const out = closePastMonths({
      rhythms: { a: r }, activities: [ALL], purpose: undefined,
      today: new Date(2026, 8, 7), lastSeen: dayKeyOf(new Date(2026, 3, 10)),
    });
    const agg = out!.monthlyAgg;
    expect(agg['2026-03']).toEqual({ a: { done: 31, due: 31 } });
    expect(agg['2026-04']).toEqual({ a: { done: 10, due: 10 } });
    for (const mk of ['2026-05', '2026-06', '2026-07', '2026-08']) expect(agg[mk]).toEqual({});
    expect(agg['2026-09']).toBeUndefined(); // o mês corrente nunca fecha
  });

  it('é idempotente: rodar de novo não muda nada e devolve o mesmo objeto', () => {
    const r = emptyRhythm();
    r.done = [dayKeyOf(new Date(2026, 0, 5))];
    const args = { rhythms: { a: r }, activities: [ALL], purpose: undefined, today: new Date(2026, 3, 2) };
    const once = closePastMonths(args);
    const twice = closePastMonths({ ...args, purpose: once });
    expect(twice).toBe(once);
  });

  it('virada de mês por data LOCAL: 31/jan e 1/fev caem cada um no seu mês', () => {
    const r = emptyRhythm();
    r.done = [dayKeyOf(new Date(2026, 0, 31)), dayKeyOf(new Date(2026, 1, 1))];
    const out = closePastMonths({ rhythms: { a: r }, activities: [ALL], purpose: undefined, today: new Date(2026, 2, 3) });
    expect(out!.monthlyAgg['2026-01'].a.done).toBe(1);
    expect(out!.monthlyAgg['2026-02'].a.done).toBe(1);
    expect(monthKeyOf(new Date(2026, 1, 1, 0, 0, 1))).toBe('2026-02');
    expect(localDayKey(new Date(2026, 0, 31, 23, 59))).toBe('2026-01-31');
  });

  it('escudo conta como feito; hábito sem registro no mês não gera célula', () => {
    const r = emptyRhythm();
    r.done = [dayKeyOf(new Date(2026, 4, 4))];
    r.shielded = [dayKeyOf(new Date(2026, 4, 5))];
    r.missed = [dayKeyOf(new Date(2026, 4, 6))];
    const out = closePastMonths({ rhythms: { a: r }, activities: [{ id: 'a', schedule: { kind: 'everyNDays', n: 1, from: 'completion' } as never }], purpose: undefined, today: new Date(2026, 5, 2) });
    expect(out!.monthlyAgg['2026-05'].a).toEqual({ done: 2, due: 3 });
  });

  it('hábito 3x por semana: oportunidades = meta proporcional, done nunca passa de due', () => {
    const r = emptyRhythm();
    r.done = [dayKeyOf(new Date(2026, 5, 2)), dayKeyOf(new Date(2026, 5, 4))];
    const out = closePastMonths({
      rhythms: { a: r }, activities: [{ id: 'a', schedule: { kind: 'timesPerWeek', target: 3 } as never }],
      purpose: undefined, today: new Date(2026, 6, 2),
    });
    const c = out!.monthlyAgg['2026-06'].a;
    expect(c.due).toBeGreaterThanOrEqual(c.done);
    expect(c.done).toBe(2);
  });

  it('o teto de 120 dias do ritmo não derruba mês que já fechou', () => {
    expect(HISTORY_CAP).toBe(120);
    const fechado = { ...emptyPurpose(), monthlyAgg: { '2026-01': { a: { done: 20, due: 25 } } } };
    const r = emptyRhythm();
    r.done = [dayKeyOf(new Date(2026, 5, 1))]; // a poda levou janeiro embora
    const out = closePastMonths({ rhythms: { a: r }, activities: [ALL], purpose: fechado, today: new Date(2026, 7, 2) });
    expect(out!.monthlyAgg['2026-01']).toEqual({ a: { done: 20, due: 25 } });
    expect(sumMonths(out!.monthlyAgg, ['2026-01', '2026-06'], ['a'])).toEqual({ done: 21, due: 55 });
  });
});

describe('purpose: sanitização e edição', () => {
  it('lixo vira ausente; limites valem', () => {
    expect(sanitizePurpose(5)).toBeUndefined();
    expect(sanitizePurpose([1])).toBeUndefined();
    expect(sanitizePurpose(JSON.parse('{"__proto__":{"x":1}}'))).toBeDefined();
    const p = sanitizePurpose({
      goal: { text: 'x'.repeat(500), areas: ['a', 5, null], createdAt: '2026-01-02', status: 'zzz' },
      motive: { key: 'health', phrase: 'y'.repeat(500) }, priorities: ['a', 'b', 'c', 'd', 'a', {}],
      monthlyAgg: { '2026-01': { a: { done: 99, due: 3 }, '../x': { done: 1, due: 1 } }, lixo: {} },
      reviews: [{ id: 'r1', kind: 'month', at: '2026-02-01', obstacles: ['time', 'xx'] }, { kind: 'x' }],
    })!;
    expect(p.goal!.text).toHaveLength(200);
    expect(p.goal!.areas).toEqual(['a']);
    expect(p.motive!.phrase).toHaveLength(120);
    expect(p.priorities).toEqual(['a', 'b', 'c']);
    expect(p.monthlyAgg).toEqual({ '2026-01': { a: { done: 3, due: 3 } } });
    expect(p.reviews).toHaveLength(1);
    expect(p.reviews[0].obstacles).toEqual(['time']);
    expect(p.firstCreatedAt).toBe('2026-01-02');
  });

  it('editar o objetivo guarda histórico e não muda a âncora', () => {
    const a = setGoal(undefined, { text: 'Correr 5 km', areas: [] }, new Date(2026, 0, 10));
    const b = setGoal(a, { text: 'Correr 10 km', areas: ['body'] }, new Date(2026, 5, 10));
    expect(b.history).toHaveLength(1);
    expect(b.history[0].text).toBe('Correr 5 km');
    expect(b.firstCreatedAt).toBe('2026-01-10');
    expect(b.goal!.createdAt).toBe('2026-06-10');
  });

  it('a 4ª prioridade é recusada', () => {
    let p = emptyPurpose();
    for (const id of ['a', 'b', 'c']) p = togglePriority(p, id).purpose;
    const r = togglePriority(p, 'd');
    expect(r.ok).toBe(false);
    expect(r.purpose.priorities).toEqual(['a', 'b', 'c']);
  });
});
