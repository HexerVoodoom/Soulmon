// @vitest-environment jsdom
/**
 * F4 do plano do catálogo: o navegador substitui a primeira tela do
 * "+" — busca, abas por área, "por que funciona", e o escape hatch "Algo
 * que não está aqui?" que abre o fluxo legado (nunca removido).
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { CatalogBrowserModal } from './CatalogBrowserModal';
import { ACTIVITY_CATALOG } from '../../data/activityCatalog';

describe('CatalogBrowserModal', () => {
  it('lista itens não-optInOnly e adiciona direto ao tocar "Adicionar"', () => {
    const onAdd = vi.fn();
    renderWithCss(
      <CatalogBrowserModal isOpen language="pt-BR" onClose={vi.fn()} onAdd={onAdd} onCreateFromScratch={vi.fn()} />,
    );
    const item = ACTIVITY_CATALOG.find((i) => !i.optInOnly)!;
    const botao = screen.getAllByRole('button', { name: /adicionar/i })[0];
    fireEvent.click(botao);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('item optInOnly NUNCA adiciona direto — abre o aviso primeiro', () => {
    const onAdd = vi.fn();
    renderWithCss(
      <CatalogBrowserModal isOpen language="pt-BR" onClose={vi.fn()} onAdd={onAdd} onCreateFromScratch={vi.fn()} />,
    );
    const optIn = ACTIVITY_CATALOG.find((i) => i.optInOnly)!;
    const card = screen.getByText(new RegExp(optIn.name.pt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    const botao = card.closest('div')!.parentElement!.querySelector('button')!;
    fireEvent.click(botao);
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });

  it('"Algo que não está aqui?" chama onCreateFromScratch', () => {
    const onCreateFromScratch = vi.fn();
    renderWithCss(
      <CatalogBrowserModal isOpen language="pt-BR" onClose={vi.fn()} onAdd={vi.fn()} onCreateFromScratch={onCreateFromScratch} />,
    );
    fireEvent.click(screen.getByRole('button', { name: /algo que não está aqui/i }));
    expect(onCreateFromScratch).toHaveBeenCalledTimes(1);
  });

  it('busca filtra por nome', () => {
    renderWithCss(
      <CatalogBrowserModal isOpen language="pt-BR" onClose={vi.fn()} onAdd={vi.fn()} onCreateFromScratch={vi.fn()} />,
    );
    const target = ACTIVITY_CATALOG.find((i) => !i.optInOnly)!;
    // D4 (01/10/2026): a busca é uma lupa que expande no campo ao toque.
    fireEvent.click(screen.getByRole('button', { name: /buscar no catálogo/i }));
    fireEvent.change(screen.getByRole('textbox', { name: /buscar no catálogo/i }), { target: { value: target.name.pt } });
    expect(screen.getByText(new RegExp(target.name.pt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))).toBeTruthy();
  });

  it('sem emoji como ícone nos cartões (D5)', () => {
    const { container } = renderWithCss(
      <CatalogBrowserModal isOpen language="pt-BR" onClose={vi.fn()} onAdd={vi.fn()} onCreateFromScratch={vi.fn()} />,
    );
    const EMOJI = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u;
    const cards = Array.from(container.querySelectorAll('.sm2-conta-card'));
    expect(cards.length).toBeGreaterThan(0);
    for (const c of cards) expect(EMOJI.test(c.textContent ?? '')).toBe(false);
  });
});
