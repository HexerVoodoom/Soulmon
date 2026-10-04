/**
 * QA2 (04/10/2026) — o starter set do onboarding do catálogo escrevia em
 * `activities` por fora do portão (`commitHabitCreate`): o tutorial pode já ter
 * enchido a lista até o teto, e os hábitos escolhidos entravam acima do teto do
 * demo / do estágio, sem `activity_create`. O guard AST de `activityCreate`
 * não via porque a escrita estava num prop JSX. Aqui: só há UMA escrita de
 * `...prev.activities` no App, e é a do portão.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fitHabitCreates } from './utils/habitCreate';

describe('onboarding do catálogo passa pelo portão de criação', () => {
  const app = readFileSync(resolve(process.cwd(), 'src/App.tsx'), 'utf-8');

  it('nenhum outro lugar acrescenta à lista `activities` do save', () => {
    const escritas = app.match(/\.\.\.\(?prev\.activities/g) ?? [];
    expect(escritas).toHaveLength(1); // a do `commitHabitCreate`
    expect(app).not.toMatch(/\.\.\.activitiesFromCatalogChoice/);
  });

  it('o onComplete do fluxo chama commitHabitCreate', () => {
    const i = app.indexOf('<CatalogOnboardingFlow');
    const bloco = app.slice(i, i + 1200);
    expect(bloco).toMatch(/commitHabitCreate\(\s*activitiesFromCatalogChoice/);
  });

  it('o portão corta o lote no teto (demo = teto do rookie)', () => {
    const cheia = { activities: new Array(5).fill(0), maxActivityCap: 6 };
    expect(fitHabitCreates(cheia, ['a', 'b', 'c'], 'demo')).toEqual(['a']);
  });
});
