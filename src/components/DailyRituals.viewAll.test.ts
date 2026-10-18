import { describe, expect, it } from 'vitest';
import { filterAndSortLines, type AllLine } from './DailyRituals';

const mk = (name: string, kind: 'task' | 'habit'): AllLine => ({ key: name, kind, name, preview: '', onEdit: () => {} });
const L = [mk('Zebra', 'task'), mk('água', 'habit'), mk('Alongar', 'habit')];

describe('View all: busca/filtro/ordem (A4)', () => {
  it('busca ignora acento e caixa', () => {
    expect(filterAndSortLines(L, 'AGUA', 'all', 'default', 'pt-BR').map(l => l.name)).toEqual(['água']);
  });
  it('filtra por tipo', () => {
    expect(filterAndSortLines(L, '', 'habits', 'default', 'pt-BR')).toHaveLength(2);
    expect(filterAndSortLines(L, '', 'tasks', 'default', 'pt-BR')).toHaveLength(1);
  });
  it('ordena A-Z', () => {
    expect(filterAndSortLines(L, '', 'all', 'az', 'pt-BR').map(l => l.name)).toEqual(['água', 'Alongar', 'Zebra']);
  });
});
