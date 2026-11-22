// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CreateModal } from './CreateModal';
import { activitiesFromCatalogChoice } from '../utils/catalogChoice';
import { migrateCatalogHabitDaily } from '../utils/catalogHabitMigrate';
import { activityBucket } from '../utils/atividadesLista';
import { ACTIVITY_CATALOG, ACTIVITY_CATALOG_BY_ID } from '../data/activityCatalog';

const mk = (language: 'pt-BR' | 'en-US') => render(
  <CreateModal isOpen initialKind="habit" onClose={() => {}} onSaveTask={vi.fn()} onSaveActivity={vi.fn()} language={language} />,
);

afterEach(cleanup);

describe('Novo hábito: tudo visível', () => {
  it('pt: categoria aberta, rótulo Quando, Exemplo, sem Mais opções nem Nome', () => {
    mk('pt-BR');
    expect(screen.queryByRole('button', { name: /Mais opções|Menos opções/ })).toBeNull();
    expect(screen.getByRole('group', { name: 'Categoria' })).toBeTruthy();
    expect(screen.getByText('Quando')).toBeTruthy();
    expect(screen.queryByText(/Horário/)).toBeNull();
    expect((document.getElementById('sm-quick-add') as HTMLInputElement).placeholder).toBe('Exemplo: Deitar às 22h30');
    expect(document.getElementById('sm-create-name')).toBeNull();
    expect(screen.queryByText('Nome')).toBeNull();
  });
  it('en: When, Example, no More options, no Name', () => {
    mk('en-US');
    expect(screen.queryByRole('button', { name: /More options|Fewer options/ })).toBeNull();
    expect(screen.getByRole('group', { name: 'Category' })).toBeTruthy();
    expect(screen.getByText('When')).toBeTruthy();
    expect((document.getElementById('sm-quick-add') as HTMLInputElement).placeholder).toBe('Example: Lights out at 10:30 p.m.');
    expect(document.getElementById('sm-create-name')).toBeNull();
  });
});

describe('Catálogo -> linha de Hábitos', () => {
  it('todo item adicionado do catálogo vira hábito diário (bucket habit)', () => {
    for (const a of activitiesFromCatalogChoice(ACTIVITY_CATALOG, true)) expect(activityBucket(a)).toBe('habit');
  });
  it('migração: save com item do catálogo na agenda padrão vira diário, preserva o resto', () => {
    const item = ACTIVITY_CATALOG.find(i => i.levels[0].defaultSchedule.kind !== 'weekdays')!;
    const velho = { id: 'x', catalogId: item.id, level: 2, schedule: item.levels[0].defaultSchedule, weekDays: [1, 2, 3], completionCount: 9 };
    expect(activityBucket(velho)).toBe('scheduled');
    const novo = migrateCatalogHabitDaily(velho, ACTIVITY_CATALOG_BY_ID);
    expect(activityBucket(novo)).toBe('habit');
    expect(novo).toMatchObject({ id: 'x', level: 2, completionCount: 9 });
    expect(migrateCatalogHabitDaily(novo, ACTIVITY_CATALOG_BY_ID)).toBe(novo); // idempotente
  });
  it('migração não toca agenda editada nem atividade custom', () => {
    const item = ACTIVITY_CATALOG[0];
    const editada = { id: 'y', catalogId: item.id, schedule: { kind: 'everyNDays', n: 5, from: 'schedule' } };
    expect(migrateCatalogHabitDaily(editada, ACTIVITY_CATALOG_BY_ID)).toBe(editada);
    const custom = { id: 'z', schedule: { kind: 'timesPerWeek', target: 3 } };
    expect(migrateCatalogHabitDaily(custom, ACTIVITY_CATALOG_BY_ID)).toBe(custom);
  });
});
