// @vitest-environment jsdom
/** Passo Prioridades da Oficina (22/11/2026): o aviso de vazio é DELE (hábito não é tarefa, então não cita hábitos) e só aparece sem tarefa aberta. */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { OficinaPlano } from './OficinaPlano';
import { emptyDraft, type PlanTask } from '../../utils/focoSessao';

afterEach(cleanup);
const montar = (tasks: PlanTask[], language: 'pt-BR' | 'en' = 'pt-BR') => render(
  <OficinaPlano language={language} tasks={tasks} initial={emptyDraft()} onSave={vi.fn()} onCancel={vi.fn()}
    only={{ step: 'eisenhower', onKey: () => true }} />);
const texto = () => document.body.textContent ?? '';
const hab = (id: string): PlanTask => ({ id: `habit:${id}`, name: `Hábito ${id}`, completed: false, kind: 'habit' });
const tar = (id: string, completed = false): PlanTask => ({ id, name: `Tarefa ${id}`, completed });

describe('Oficina — passo Prioridades, estado vazio', () => {
  it('só hábitos: aviso próprio, sem citar hábitos', () => {
    montar([hab('a'), hab('b')]);
    expect(texto()).toContain('Você não tem tarefas abertas hoje. Pode pular esta etapa.');
    expect(texto()).not.toMatch(/hábito/i);
    expect(document.querySelector('[data-oficina-prio]')).toBeNull();
  });
  it('só tarefas concluídas: mesmo aviso', () => {
    montar([tar('x', true)]);
    expect(texto()).toContain('Você não tem tarefas abertas hoje.');
    expect(document.querySelector('[data-oficina-prio]')).toBeNull();
  });
  it('EN: aviso próprio, sem citar habits', () => {
    montar([hab('a')], 'en');
    expect(texto()).toContain('You have no open tasks today. You can skip this step.');
    expect(texto()).not.toMatch(/habit/i);
  });
  it('há tarefa aberta: lista a tarefa e não mostra o aviso', () => {
    montar([hab('a'), tar('t1')]);
    expect(document.querySelector('[data-oficina-prio-row="t1"]')).not.toBeNull();
    expect(texto()).not.toContain('Você não tem tarefas');
  });
  it('muitos hábitos na frente não escondem as tarefas abertas', () => {
    montar([...Array.from({ length: 60 }, (_, i) => hab(String(i))), tar('t1')]);
    expect(document.querySelector('[data-oficina-prio-row="t1"]')).not.toBeNull();
  });
});
