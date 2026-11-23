import { describe, it, expect } from 'vitest';
import { uncommittedCandidates, addToDayPlan, confirmDayPlan, dayPlanView, type DayPlan } from './dayPlan';
import { readFileSync } from 'node:fs';

const C = (id: string) => ({ id, name: id, kind: 'task' as const });
const HOJE = '2026-11-02';
const plano: DayPlan = { day: HOJE, offered: ['a', 'b', 'c'], picked: ['a'], confirmed: true };

describe('Comprometer-me com uma tarefa', () => {
  it('lista só o que não está comprometido hoje; plano de outro dia não compromete ninguém', () => {
    expect(uncommittedCandidates(plano, HOJE, [C('a'), C('b'), C('d')]).map(c => c.id)).toEqual(['b', 'd']);
    expect(uncommittedCandidates({ ...plano, day: '2026-11-01' }, HOJE, [C('a')])).toHaveLength(1);
    expect(uncommittedCandidates(plano, HOJE, [C('a')])).toHaveLength(0); // tudo comprometido => botão some
  });
  it('confirmar ACRESCENTA: nunca remove um compromisso já feito', () => {
    const novo = addToDayPlan(plano, HOJE, ['b']);
    expect(novo.picked.sort()).toEqual(['a', 'b']);
    expect(novo.confirmed).toBe(true);
    expect(addToDayPlan(plano, HOJE, []).picked).toEqual(['a']);
    // contraste: confirmDayPlan substituiria
    expect(confirmDayPlan(plano, HOJE, ['b']).picked).toEqual(['b']);
  });
  it('o que ficou de fora segue escondido; o recém-comprometido aparece', () => {
    const v = dayPlanView(addToDayPlan(plano, HOJE, ['b']), HOJE, true);
    expect(v.hidden.has('c')).toBe(true);
    expect(v.hidden.has('b')).toBe(false);
  });
  it('contrato: a 3ª opção do + existe no App, condicionada a haver não comprometido', () => {
    const app = readFileSync('src/App.tsx', 'utf-8');
    expect(app).toMatch(/data-create-choice="commit"/);
    expect(app).toMatch(/dayPlanActive && uncommittedNow\.length > 0/);
    expect(app).toContain('Commit to a task');
    expect(app).toContain('Comprometer-me com uma tarefa');
  });
});
