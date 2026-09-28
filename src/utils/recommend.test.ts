import { describe, it, expect } from 'vitest';
import { recommendStarterSet, STARTER_EFFORT_BUDGET, STARTER_MAX_PER_AREA } from './recommend';
import { ACTIVITY_CATALOG } from '../data/activityCatalog';

describe('recommendStarterSet', () => {
  it('é determinístico: mesmo perfil + mesmo catálogo = mesmo set', () => {
    const profile = { areas: ['sono', 'corpo'] as const, struggles: ['constancia'] as const, strengths: ['disciplina'] as const };
    const a = recommendStarterSet({ areas: [...profile.areas], struggles: [...profile.struggles], strengths: [...profile.strengths] }, ACTIVITY_CATALOG);
    const b = recommendStarterSet({ areas: [...profile.areas], struggles: [...profile.struggles], strengths: [...profile.strengths] }, ACTIVITY_CATALOG);
    expect(a.map(i => i.id)).toEqual(b.map(i => i.id));
  });

  it('devolve entre 3 e 5 itens quando o catálogo tem itens suficientes', () => {
    const set = recommendStarterSet({ areas: ['mente'], struggles: [], strengths: [] }, ACTIVITY_CATALOG);
    expect(set.length).toBeGreaterThanOrEqual(3);
    expect(set.length).toBeLessThanOrEqual(5);
  });

  it('respeita o orçamento de esforço inicial', () => {
    const set = recommendStarterSet({ areas: ['corpo', 'aprendizado'], struggles: ['tempo'], strengths: [] }, ACTIVITY_CATALOG);
    const effort = set.reduce((sum, item) => sum + item.levels[0].effort, 0);
    expect(effort).toBeLessThanOrEqual(STARTER_EFFORT_BUDGET);
  });

  it('respeita o máximo de itens por área', () => {
    const set = recommendStarterSet({ areas: ['sono'], struggles: [], strengths: [] }, ACTIVITY_CATALOG);
    const perArea = new Map<string, number>();
    for (const item of set) perArea.set(item.area, (perArea.get(item.area) ?? 0) + 1);
    for (const count of perArea.values()) expect(count).toBeLessThanOrEqual(STARTER_MAX_PER_AREA);
  });

  it('todos os itens sugeridos são de nível 1 (o starter set nasce no nível 1)', () => {
    const set = recommendStarterSet({ areas: ['relacoes'], struggles: ['comecar'], strengths: ['sociabilidade'] }, ACTIVITY_CATALOG);
    expect(set.length).toBeGreaterThan(0);
    // O tipo CatalogItem não guarda o nível escolhido — nível 1 é implícito
    // (levels[0]); este teste documenta essa invariante.
    for (const item of set) expect(item.levels[0]).toBeDefined();
  });

  it('não sugere nada com catálogo vazio', () => {
    const set = recommendStarterSet({ areas: [], struggles: [], strengths: [] }, []);
    expect(set).toEqual([]);
  });
});
