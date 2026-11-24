// @vitest-environment jsdom
/**
 * P2 — filtros de DIA da `View all` (Todos + Dom…Sáb) e o componente `DaySquares`.
 * Régua: filtrar por dia mostra o que OCORRE naquele dia da semana (schedule `weekdays`;
 * `everyNDays`/`timesPerWeek` valem todo dia; tarefa pontual com data só no dia dela);
 * "Todos" limpa; e o filtro NUNCA mexe no schedule salvo.
 */
import { describe, it, expect, afterEach, beforeEach } from 'vitest';
import { useState } from 'react';
import { screen, fireEvent, within, cleanup } from '@testing-library/react';
import { renderWithCss, computed } from '../test/renderEnv';
import { DailyRituals, diasDaTarefa } from './DailyRituals';
import { DaySquares, type WeekDay } from './DaySquares';
import type { Activity, Task } from '../contexts/GameStateContext';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: (q: string) => ({ matches: q.includes('prefers-reduced-motion'), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }),
  });
});
afterEach(cleanup);

const TERCA = new Date(2026, 9, 13, 10, 0, 0);
const noop = () => {};
const base = { category: 'health', emoji: 'x', steps: [] as never[] };
const act = (id: string, name: string, schedule: unknown, weekDays: number[]) => ({ ...base, id, name, weekDays, schedule }) as unknown as Activity;
const ativs: Activity[] = [
  act('d1', 'Beber água', { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] }, [0, 1, 2, 3, 4, 5, 6]),
  act('s1', 'Reunião de segunda', { kind: 'weekdays', days: [1] }, [1]),
  act('s2', 'Aula de terça', { kind: 'weekdays', days: [2] }, [2]),
  act('s3', 'Trocar filtro', { kind: 'everyNDays', n: 30, from: 'schedule' }, [0, 1, 2, 3, 4, 5, 6]),
];
const tarefas: Task[] = [
  { id: 't1', name: 'Pagar conta', category: 'work', completed: false, effort: 1 } as unknown as Task,
  { id: 't2', name: 'Declarar imposto', category: 'work', completed: false, effort: 1, startDate: '2026-10-20' } as unknown as Task, // terça
];
const snapshot = JSON.stringify({ ativs, tarefas });

function Harness({ language }: { language: 'en-US' | 'pt-BR' }) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  return (
    <DailyRituals
      tasks={tarefas} activities={ativs} completedTasks={[]} habitRhythms={{} as never}
      language={language} now={TERCA} expanded={expanded}
      onExpand={(k, open) => setExpanded(p => ({ ...p, [k]: open }))}
      onToggleTask={noop} onToggleTaskStep={noop} onEditTask={noop} onPostponeNudge={noop} onEditActivity={noop}
      onToggleActivity={noop} onUpdateStep={noop} onRestoreTask={noop} onCreate={noop}
      ctaLabel="Add" emptyMessage="empty" variant="home" goal={4}
    />
  );
}
const abrir = (language: 'en-US' | 'pt-BR' = 'en-US') => {
  renderWithCss(<Harness language={language} />);
  fireEvent.click(screen.getByRole('button', { name: /Edit|Editar/ }));
  return document.querySelector('[data-all-activities]') as HTMLElement;
};
const dia = (tela: HTMLElement, d: number) => tela.querySelector(`[data-day="${d}"]`) as HTMLButtonElement;
const nomes = (tela: HTMLElement) => Array.from(tela.querySelectorAll('li.sm2-ritual')).map(li => li.textContent ?? '');
const tem = (tela: HTMLElement, n: string) => nomes(tela).some(t => t.includes(n));

describe('filtros de dia da View all', () => {
  it('Todos + 7 botões Dom→Sáb em PT e Sun→Sat em EN; Todos é o padrão', () => {
    const en = abrir();
    expect(Array.from(en.querySelectorAll('[data-day]')).map(b => b.textContent)).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);
    expect(en.querySelector('[data-all-day="all"]')?.getAttribute('aria-pressed')).toBe('true');
    expect(en.querySelectorAll('[data-day][aria-pressed="true"]')).toHaveLength(0);
    cleanup();
    const pt = abrir('pt-BR');
    expect(Array.from(pt.querySelectorAll('[data-day]')).map(b => b.textContent)).toEqual(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);
    expect(within(pt).getByRole('button', { name: 'Todos' })).toBeTruthy();
    expect(dia(pt, 1).getAttribute('aria-label')).toBe('Segunda-feira');
  });

  it('filtrar por segunda mostra o que ocorre na segunda; terça troca a lista; Todos limpa', () => {
    const tela = abrir();
    fireEvent.click(dia(tela, 1));
    expect(dia(tela, 1).getAttribute('aria-pressed')).toBe('true');
    expect(tem(tela, 'Reunião de segunda')).toBe(true);
    expect(tem(tela, 'Beber água')).toBe(true);
    expect(tem(tela, 'Trocar filtro')).toBe(true);
    expect(tem(tela, 'Pagar conta')).toBe(true);
    expect(tem(tela, 'Aula de terça')).toBe(false);
    expect(tem(tela, 'Declarar imposto')).toBe(false);
    fireEvent.click(dia(tela, 2));
    expect(dia(tela, 1).getAttribute('aria-pressed')).toBe('false');
    expect(tem(tela, 'Aula de terça')).toBe(true);
    expect(tem(tela, 'Declarar imposto')).toBe(true);
    expect(tem(tela, 'Reunião de segunda')).toBe(false);
    fireEvent.click(tela.querySelector('[data-all-day="all"]') as HTMLElement);
    expect(nomes(tela)).toHaveLength(6);
    expect(dia(tela, 2).getAttribute('aria-pressed')).toBe('false');
  });

  it('tocar no dia já ligado limpa o filtro', () => {
    const tela = abrir();
    fireEvent.click(dia(tela, 3));
    expect(tem(tela, 'Reunião de segunda')).toBe(false);
    fireEvent.click(dia(tela, 3));
    expect(nomes(tela)).toHaveLength(6);
  });

  it('filtrar NUNCA altera o schedule salvo', () => {
    const tela = abrir();
    [1, 2, 6, 0].forEach(d => fireEvent.click(dia(tela, d)));
    fireEvent.click(tela.querySelector('[data-all-day="all"]') as HTMLElement);
    expect(JSON.stringify({ ativs, tarefas })).toBe(snapshot);
  });

  it('diasDaTarefa: com data = o dia da semana dela; sem data = qualquer dia', () => {
    expect(diasDaTarefa({ startDate: '2026-10-20' })).toEqual([2]);
    expect(diasDaTarefa({})).toBeNull();
    expect(diasDaTarefa({ startDate: 'lixo' })).toBeNull();
  });
});

describe('DaySquares', () => {
  it.each([360, 375, 412])('em %ipx: 7 colunas iguais cabem na área útil sem rolagem horizontal, alvo ≥ 44px', (w) => {
    const { container } = renderWithCss(<DaySquares mode="single-filter" language="pt-BR" days={[]} onToggle={noop} />);
    const grade = container.querySelector('.sm2-day-squares') as HTMLElement;
    expect(computed(grade, 'display')).toBe('grid');
    expect(computed(grade, 'grid-template-columns')).toContain('repeat(7');
    const util = w - 32; // gutter de 16px de cada lado (.sm3-tudo-corpo)
    expect((util - 6 * 2) / 7).toBeGreaterThanOrEqual(44);
    const q = container.querySelector('.sm2-day-square') as HTMLElement;
    expect(computed(q, 'min-block-size')).toBe('44px');
    expect(container.querySelectorAll('.sm2-day-square')).toHaveLength(7);
  });

  it('multi: aceita vários dias ligados e avisa onToggle com o dia', () => {
    const vistos: WeekDay[] = [];
    const { container } = renderWithCss(<DaySquares mode="multi" language="en-US" days={[1, 3]} onToggle={d => vistos.push(d)} />);
    expect(Array.from(container.querySelectorAll('[aria-pressed="true"]')).map(b => b.textContent)).toEqual(['Mon', 'Wed']);
    fireEvent.click(container.querySelector('[data-day="5"]') as HTMLElement);
    expect(vistos).toEqual([5]);
  });
});
