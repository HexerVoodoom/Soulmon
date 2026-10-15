import { describe, it, expect } from 'vitest';
import {
  sanitizeDayPlan, dayPlanView, isHiddenByPlan, hiddenOnDay, needsDayPlan, dayPlanInvite, migrateDayPlan,
  dayPlanCandidates, showDayPlan, confirmDayPlan, DAY_PLAN_MAX_IDS,
} from './dayPlan';

const HOJE = '2026-10-15';
const TERCA = new Date(2026, 9, 13, 10, 0, 0); // terça
const act = (id: string, name: string, days: number[]) => ({ id, name, steps: [], weekDays: days, schedule: { kind: 'weekdays', days } });
const todos = [0, 1, 2, 3, 4, 5, 6];

describe('REGISTRO §65 — reafirmar o dia: regra pura', () => {
  it('candidatos: hábito diário, agendada que cai hoje e tarefa de hoje; fora o que não cai hoje, o futuro e o já feito', () => {
    const c = dayPlanCandidates({
      activities: [
        act('h', 'Beber água', todos),
        act('ter', 'Aula de terça', [2]),
        act('seg', 'Reunião de segunda', [1]),
        { ...act('feita', 'Já feita', todos), completedToday: true, lastCompletedDate: TERCA.toDateString() },
      ],
      tasks: [
        { id: 't1', name: 'Pagar conta', completed: false },
        { id: 't2', name: 'Futura', completed: false, startDate: '2026-10-20' },
        { id: 't3', name: 'Algum dia', completed: false, status: 'someday' },
      ],
    }, TERCA);
    expect(c.map(x => [x.id, x.kind])).toEqual([['h', 'habit'], ['ter', 'task'], ['t1', 'task']]);
  });

  it('sem duplicar: o mesmo id aparece uma vez', () => {
    const c = dayPlanCandidates({ activities: [act('x', 'A', todos), act('x', 'A', todos)], tasks: [{ id: 'x', name: 'A' }] }, TERCA);
    expect(c).toHaveLength(1);
  });

  it('plano de hoje esconde offered − picked; plano de outro dia esconde tudo; sem plano ou inativo, nada', () => {
    const plano = { day: HOJE, offered: ['a', 'b', 'c'], picked: ['b'], confirmed: true };
    const v = dayPlanView(plano, HOJE, true);
    expect([isHiddenByPlan(v, 'a'), isHiddenByPlan(v, 'b'), isHiddenByPlan(v, 'c')]).toEqual([true, false, true]);
    // nascido depois (não oferecido) aparece sozinho
    expect(isHiddenByPlan(v, 'novo')).toBe(false);
    expect(dayPlanView(plano, '2026-10-16', true).hideAll).toBe(true);
    expect(isHiddenByPlan(dayPlanView(undefined, HOJE, true), 'a')).toBe(false);
    expect(isHiddenByPlan(dayPlanView(plano, '2026-10-16', false), 'a')).toBe(false);
  });

  it('a virada só considera o plano do PRÓPRIO dia julgado', () => {
    const plano = { day: HOJE, offered: ['a', 'b'], picked: ['b'], confirmed: true };
    expect([...hiddenOnDay(plano, HOJE)]).toEqual(['a']);
    expect(hiddenOnDay(plano, '2026-10-14').size).toBe(0);
    expect(hiddenOnDay(undefined, HOJE).size).toBe(0);
  });

  it('pede a reafirmação só quando há plano de outro dia; convite quando não confirmou', () => {
    const ontem = { day: '2026-10-14', offered: [], picked: [], confirmed: true };
    expect(needsDayPlan(ontem, HOJE)).toBe(true);
    expect(needsDayPlan(undefined, HOJE)).toBe(false);
    expect(needsDayPlan({ ...ontem, day: HOJE }, HOJE)).toBe(false);
    expect(dayPlanInvite(ontem, HOJE, true)).toBe(true);
    expect(dayPlanInvite({ day: HOJE, offered: ['a'], picked: [], confirmed: false }, HOJE, true)).toBe(true);
    expect(dayPlanInvite({ day: HOJE, offered: ['a'], picked: ['a'], confirmed: true }, HOJE, true)).toBe(false);
    expect(dayPlanInvite(ontem, HOJE, false)).toBe(false);
  });

  it('migração: save sem plano vira "hoje já reafirmado" (nada escondido); plano existente é mantido', () => {
    const m = migrateDayPlan(undefined, HOJE);
    expect(m).toEqual({ day: HOJE, offered: [], picked: [], confirmed: true });
    expect(dayPlanView(m, HOJE, true).hidden.size).toBe(0);
    const ja = { day: '2026-10-10', offered: ['a'], picked: [], confirmed: true };
    expect(migrateDayPlan(ja, HOJE)).toBe(ja);
  });

  it('mostrar grava "visto" (oferecidos, nada marcado, não confirmado) e reabrir no dia une sem perder o marcado', () => {
    const c = [{ id: 'a', name: 'A', kind: 'habit' as const }, { id: 'b', name: 'B', kind: 'task' as const }];
    const p1 = showDayPlan({ day: '2026-10-14', offered: ['velho'], picked: ['velho'], confirmed: true }, HOJE, c);
    expect(p1).toEqual({ day: HOJE, offered: ['a', 'b'], picked: [], confirmed: false });
    const p2 = showDayPlan({ ...p1, picked: ['a'] }, HOJE, [...c, { id: 'n', name: 'N', kind: 'task' }]);
    expect(p2).toEqual({ day: HOJE, offered: ['a', 'b', 'n'], picked: ['a'], confirmed: false });
  });

  it('confirmar grava o marcado (só entre os oferecidos) e marca confirmado; confirmar sem nada é válido', () => {
    const base = { day: HOJE, offered: ['a', 'b'], picked: [], confirmed: false };
    expect(confirmDayPlan(base, HOJE, ['b'])).toEqual({ day: HOJE, offered: ['a', 'b'], picked: ['b'], confirmed: true });
    const vazio = confirmDayPlan(base, HOJE, []);
    expect(vazio.confirmed).toBe(true);
    expect(dayPlanView(vazio, HOJE, true).hidden.size).toBe(2);
  });

  it('sanitização: lixo vira ausente; ids inválidos/duplicados caem; picked ⊆ offered; teto', () => {
    expect(sanitizeDayPlan(null)).toBeUndefined();
    expect(sanitizeDayPlan({ day: 'Wed Oct 14 2026' })).toBeUndefined();
    expect(sanitizeDayPlan({ day: HOJE, offered: ['a', 'a', 'com espaço', 3], picked: ['a', 'z'], confirmed: 'sim' }))
      .toEqual({ day: HOJE, offered: ['a'], picked: ['a'], confirmed: false });
    expect(sanitizeDayPlan({ day: HOJE, offered: Array.from({ length: 999 }, (_, i) => `i${i}`) })!.offered).toHaveLength(DAY_PLAN_MAX_IDS);
  });
});
