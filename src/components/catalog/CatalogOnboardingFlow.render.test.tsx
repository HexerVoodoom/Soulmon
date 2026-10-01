// @vitest-environment jsdom
/**
 * F3 do plano do catálogo: o convite roda para jogador novo E antigo pelo
 * MESMO mecanismo (fila única de intersticiais). Este teste cobre: (1) o
 * fluxo é curto e, desde 01/10/2026 (C10–C12 do dono), exige escolha em cada
 * passo e só leva o que foi ASSUMIDO; (2) o starter set nasce dos
 * itens não-`optInOnly`; (3) `activitiesFromCatalogChoice` nunca inventa um
 * `catalogId` que não exista no pool, e sempre nível 1.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { CatalogOnboardingFlow, activitiesFromCatalogChoice } from './CatalogOnboardingFlow';
import { ACTIVITY_CATALOG } from '../../data/activityCatalog';

describe('CatalogOnboardingFlow', () => {
  // C11 (01/10/2026): o dono tirou o "pular" — definir meta é o caminho.
  it('não tem "pular" em passo nenhum', () => {
    renderWithCss(<CatalogOnboardingFlow language="pt-BR" onComplete={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /pular/i })).toBeNull();
  });

  // C10: mínimo 1 em cada escolha.
  it('não avança sem ao menos 1 escolha em cada passo', () => {
    renderWithCss(<CatalogOnboardingFlow language="pt-BR" onComplete={vi.fn()} />);
    const continuar = () => screen.getByRole('button', { name: /continuar/i });
    fireEvent.click(continuar());
    expect(screen.getByText(/definir metas/i)).toBeTruthy(); // ficou no 1º passo
    expect(continuar().getAttribute('aria-disabled')).toBe('true');
  });

  // C12: o starter set nasce DESMARCADO; "Assumir" vira caixa marcada; só entra o assumido.
  it('ponto de partida: só entra o que foi assumido, e exige ao menos 1', () => {
    const onComplete = vi.fn();
    renderWithCss(<CatalogOnboardingFlow language="pt-BR" onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sono' }));
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    fireEvent.click(screen.getAllByRole('button').find(b => /começar/i.test(b.textContent ?? ''))!);
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    fireEvent.click(screen.getAllByRole('button').find(b => /disciplina/i.test(b.textContent ?? ''))!);
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    expect(screen.getByText(/ponto de partida/i)).toBeTruthy();
    // Confirmar sem assumir nada não conclui.
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onComplete).not.toHaveBeenCalled();
    const assumir = screen.getAllByRole('button', { name: /^assumir:/i });
    expect(assumir.length).toBeGreaterThan(0);
    fireEvent.click(assumir[0]);
    expect(screen.getAllByRole('checkbox', { checked: true })).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toHaveLength(1);
  });

  it('voltar é a seta no topo (Back padronizado), não botão embaixo', () => {
    const { container } = renderWithCss(<CatalogOnboardingFlow language="pt-BR" onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sono' }));
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    const voltar = container.querySelector('[data-flow-back]')!;
    const titulo = container.querySelector('h2')!;
    expect(voltar.compareDocumentPosition(titulo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(voltar);
    expect(screen.getByText(/definir metas/i)).toBeTruthy();
  });

  it('renderiza em EN sem quebrar', () => {
    renderWithCss(<CatalogOnboardingFlow language="en-US" onComplete={vi.fn()} />);
    expect(screen.getByText(/set goals/i)).toBeTruthy();
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
