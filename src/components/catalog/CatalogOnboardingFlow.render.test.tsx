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
import { screen, fireEvent, cleanup } from '@testing-library/react';
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

  // REGISTRO §66 (dono, 15/10/2026): o starter set nasce DESMARCADO (substitui o "todas marcadas" do beta-2 7.3): a pessoa
  // reafirma o que quer fazer e só entra o que ela marcou. Mudou o contrato, não o código de teste à toa.
  function ate_o_ponto_de_partida(props: Record<string, unknown> = {}) {
    const onComplete = vi.fn();
    renderWithCss(<CatalogOnboardingFlow language="pt-BR" onComplete={onComplete} {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sono' }));
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    fireEvent.click(screen.getAllByRole('button').find(b => /começar/i.test(b.textContent ?? ''))!);
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    fireEvent.click(screen.getAllByRole('button').find(b => /disciplina/i.test(b.textContent ?? ''))!);
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    return onComplete;
  }

  it('ponto de partida: "Adicionar tarefas à lista", TODAS DESMARCADAS por padrão, só entra o marcado', () => {
    const onComplete = ate_o_ponto_de_partida();
    expect(screen.getByRole('dialog', { name: 'Adicionar tarefas à lista' })).toBeTruthy();
    const caixas = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(caixas.length).toBeGreaterThan(1);
    expect(caixas.every(c => !c.checked)).toBe(true);
    // Marca a primeira: só ela entra.
    fireEvent.click(caixas[0]);
    expect((screen.getAllByRole('checkbox') as HTMLInputElement[])[0].checked).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toHaveLength(1);
  });

  it('ponto de partida: sem nada marcado, não conclui (C11: ao menos 1)', () => {
    const onComplete = ate_o_ponto_de_partida();
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete.mock.calls[0][0]).toHaveLength(1);
  });

  it('sem duplicar: o que já está na lista (catalogId) não é oferecido nem entra de novo', () => {
    const onComplete = ate_o_ponto_de_partida();
    const ids = screen.getAllByRole('checkbox').map(c => c.closest('[data-starter-item]')!.getAttribute('data-starter-item')!);
    for (const c of screen.getAllByRole('checkbox')) fireEvent.click(c);
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onComplete.mock.calls[0][0].map((i: { id: string }) => i.id)).toEqual(ids);
    cleanup();
    // Agora com a primeira sugestão já na lista.
    const onComplete2 = ate_o_ponto_de_partida({ existingActivities: [{ catalogId: ids[0] }] });
    const ids2 = screen.getAllByRole('checkbox').map(c => c.closest('[data-starter-item]')!.getAttribute('data-starter-item')!);
    expect(ids2).not.toContain(ids[0]);
    for (const c of screen.getAllByRole('checkbox')) fireEvent.click(c);
    fireEvent.click(screen.getByRole('button', { name: /confirmar/i }));
    expect(onComplete2.mock.calls[0][0].map((i: { id: string }) => i.id)).not.toContain(ids[0]);
  });

  it('EN: "Add tasks to list"', () => {
    const onComplete = vi.fn();
    renderWithCss(<CatalogOnboardingFlow language="en-US" onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /sleep/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getAllByRole('button').find(b => /start/i.test(b.textContent ?? ''))!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    fireEvent.click(screen.getAllByRole('button').find(b => /discipline/i.test(b.textContent ?? ''))!);
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByRole('dialog', { name: 'Add tasks to list' })).toBeTruthy();
  });

  it('voltar é a seta no topo (Back padronizado), não botão embaixo', () => {
    const { container } = renderWithCss(<CatalogOnboardingFlow language="pt-BR" onComplete={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Sono' }));
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    const voltar = container.querySelector('[data-back-arrow] button')!;
    const titulo = container.querySelector('.sm2-title')!;
    expect(voltar.compareDocumentPosition(titulo) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    fireEvent.click(voltar);
    expect(screen.getByText(/definir metas/i)).toBeTruthy();
  });

  it('14/10/2026 (dono): é o modal CENTRALIZADO (ModalSheet placement=center), não folha de baixo; botão no rodapé do painel', () => {
    const { container } = renderWithCss(<CatalogOnboardingFlow language="pt-BR" onComplete={vi.fn()} />);
    expect(container.querySelector('[data-modal-backdrop]')).not.toBeNull();
    const dlg = container.querySelector('[role="dialog"]') as HTMLElement;
    expect(dlg.getAttribute('data-placement')).toBe('center');
    expect(dlg.className).not.toContain('sm2-sheet-rise');
    expect((container.querySelector('[data-modal-backdrop]') as HTMLElement).style.alignItems).toBe('center');
    // C11: sem "pular" — no 1º passo não há fechar nem seta, e o véu não fecha
    expect(container.querySelector('[data-back-arrow]')).toBeNull();
    expect(container.querySelector('[data-dismiss-on-backdrop]')!.getAttribute('data-dismiss-on-backdrop')).toBe('false');
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
