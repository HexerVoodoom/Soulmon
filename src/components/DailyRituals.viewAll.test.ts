import { describe, expect, it } from 'vitest';
import { ALL_SORT_CYCLE, createdStamp, filterAndSortLines, groupLines, nextAllSort, type AllLine } from './DailyRituals';

const mk = (name: string, kind: 'task' | 'habit', created = 0, done = 0): AllLine => ({ key: name, kind, name, preview: '', created, done, onEdit: () => {} });
const L = [mk('Zebra', 'task', 300, 0), mk('água', 'habit', 100, 9), mk('Alongar', 'habit', 200, 3)];

describe('View all: busca/filtro/ordem (A4)', () => {
  it('busca ignora acento e caixa', () => {
    expect(filterAndSortLines(L, 'AGUA', 'all', 'az', 'pt-BR').map(l => l.name)).toEqual(['água']);
  });
  it('filtra por tipo', () => {
    expect(filterAndSortLines(L, '', 'habits', 'az', 'pt-BR')).toHaveLength(2);
    expect(filterAndSortLines(L, '', 'tasks', 'az', 'pt-BR')).toHaveLength(1);
  });
  it('ordena A-Z', () => {
    expect(filterAndSortLines(L, '', 'all', 'az', 'pt-BR').map(l => l.name)).toEqual(['água', 'Alongar', 'Zebra']);
  });
});

describe('View all: ordem cíclica e inversão (D-09, D-10)', () => {
  it('o ciclo é A-Z → criação → mais feito → A-Z', () => {
    expect(ALL_SORT_CYCLE).toEqual(['az', 'created', 'done']);
    expect(nextAllSort('az')).toBe('created');
    expect(nextAllSort('created')).toBe('done');
    expect(nextAllSort('done')).toBe('az');
  });
  it('criação: o mais recente primeiro', () => {
    expect(filterAndSortLines(L, '', 'all', 'created', 'en-US').map(l => l.name)).toEqual(['Zebra', 'Alongar', 'água']);
  });
  it('mais feito: quem foi feito mais vezes primeiro', () => {
    expect(filterAndSortLines(L, '', 'all', 'done', 'en-US').map(l => l.name)).toEqual(['água', 'Alongar', 'Zebra']);
  });
  it('empate cai no nome (a ordem não pula)', () => {
    const E = [mk('B', 'task'), mk('A', 'task'), mk('C', 'task')];
    expect(filterAndSortLines(E, '', 'all', 'done', 'en-US').map(l => l.name)).toEqual(['A', 'B', 'C']);
    expect(filterAndSortLines(E, '', 'all', 'created', 'en-US').map(l => l.name)).toEqual(['A', 'B', 'C']);
  });
  it('a seta inverte cada uma das três ordens', () => {
    for (const o of ALL_SORT_CYCLE) {
      const normal = filterAndSortLines(L, '', 'all', o, 'en-US').map(l => l.name);
      expect(filterAndSortLines(L, '', 'all', o, 'en-US', true).map(l => l.name)).toEqual([...normal].reverse());
    }
  });
  it('createdStamp lê createdAt, o carimbo do id ou devolve 0', () => {
    expect(createdStamp('x', '2026-10-01T00:00:00.000Z')).toBe(Date.parse('2026-10-01T00:00:00.000Z'));
    expect(createdStamp('task-1760000000000')).toBe(1760000000000);
    expect(createdStamp('activity-1760000000001')).toBe(1760000000001);
    expect(createdStamp('d1')).toBe(0);
  });
});

describe('View all: Tasks em cima, Habits embaixo (D-07)', () => {
  it('groupLines separa por tipo e mantém a ordem recebida', () => {
    const g = groupLines(filterAndSortLines(L, '', 'all', 'az', 'pt-BR'));
    expect(g.tasks.map(l => l.name)).toEqual(['Zebra']);
    expect(g.habits.map(l => l.name)).toEqual(['água', 'Alongar']);
  });
});
