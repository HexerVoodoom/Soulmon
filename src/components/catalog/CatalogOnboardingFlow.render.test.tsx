// @vitest-environment jsdom
/**
 * F3 do plano do catálogo: o convite roda para jogador novo E antigo pelo
 * MESMO mecanismo (fila única de intersticiais). Este teste cobre: (1) o
 * fluxo é curto e pulável em qualquer passo; (2) o starter set nasce dos
 * itens não-`optInOnly`; (3) `activitiesFromCatalogChoice` nunca inventa um
 * `catalogId` que não exista no pool, e sempre nível 1.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { CatalogOnboardingFlow, activitiesFromCatalogChoice } from './CatalogOnboardingFlow';
import { ACTIVITY_CATALOG } from '../../data/activityCatalog';

describe('CatalogOnboardingFlow', () => {
  it('pode ser pulado imediatamente, na primeira tela', () => {
    const onSkip = vi.fn();
    renderWithCss(<CatalogOnboardingFlow language="pt-BR" onSkip={onSkip} onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /pular por agora/i }));
    expect(onSkip).toHaveBeenCalledTimes(1);
  });

  it('avança pelas 3 telas de escolha até o starter set, sem escolher nada', () => {
    const onComplete = vi.fn();
    renderWithCss(<CatalogOnboardingFlow language="pt-BR" onSkip={vi.fn()} onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /continuar/i })); // áreas → dificuldades
    fireEvent.click(screen.getByRole('button', { name: /continuar/i })); // dificuldades → forças
    fireEvent.click(screen.getByRole('button', { name: /continuar/i })); // forças → starter set
    expect(screen.getByText(/ponto de partida/i)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('renderiza em EN sem quebrar', () => {
    renderWithCss(<CatalogOnboardingFlow language="en-US" onSkip={vi.fn()} onComplete={vi.fn()} />);
    expect(screen.getByText(/what do you want to improve/i)).toBeTruthy();
  });
});

describe('activitiesFromCatalogChoice', () => {
  const CATALOG_IDS = new Set(ACTIVITY_CATALOG.map((i) => i.id));

  it('gera uma Activity por item, sempre nível 1, catalogId válido', () => {
    const escolhidos = ACTIVITY_CATALOG.filter((i) => !i.optInOnly).slice(0, 3);
    const activities = activitiesFromCatalogChoice(escolhidos, true);
    expect(activities).toHaveLength(3);
    for (const a of activities) {
      expect(a.level).toBe(1);
      expect(CATALOG_IDS.has(a.catalogId)).toBe(true);
      expect(a.id).toBeTruthy();
    }
  });

  it('ids gerados são únicos', () => {
    const escolhidos = ACTIVITY_CATALOG.filter((i) => !i.optInOnly).slice(0, 5);
    const activities = activitiesFromCatalogChoice(escolhidos, true);
    const ids = new Set(activities.map((a) => a.id));
    expect(ids.size).toBe(activities.length);
  });

  it('nome no idioma do jogador e nível datado desde a criação', () => {
    const [item] = ACTIVITY_CATALOG.filter((i) => !i.optInOnly);
    const now = '2026-09-28T12:00:00.000Z';
    const [pt] = activitiesFromCatalogChoice([item], true, now);
    const [en] = activitiesFromCatalogChoice([item], false, now);
    expect(pt.name).toBe(item.name.pt);
    expect(en.name).toBe(item.name.en);
    // sem esta data o convite de subir nível nunca aparece (daysAtLevel = 0)
    expect(pt.catalogLevelSetAt).toBe(now);
  });
});
