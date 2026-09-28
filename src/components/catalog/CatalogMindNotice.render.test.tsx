// @vitest-environment jsdom
/**
 * A1 da revisão de psicologia (docs/reviews/2026-09-28-catalogo-psicologia.md):
 * o cartão de aviso dos itens `optInOnly` da área mente. Trava:
 *  1. o disclaimer "não é tratamento" e a linha de crise aparecem sempre;
 *  2. as `contraindications` do item aparecem na tela;
 *  3. "Adicionar" começa DESABILITADO e só libera depois do checkbox "Entendi".
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../../test/renderEnv';
import { CatalogMindNotice } from './CatalogMindNotice';
import { ACTIVITY_CATALOG } from '../../data/activityCatalog';

const item = ACTIVITY_CATALOG.find((i) => i.optInOnly)!;

describe('CatalogMindNotice', () => {
  it('mostra o disclaimer e a linha de crise em PT', () => {
    renderWithCss(<CatalogMindNotice item={item} language="pt-BR" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText(/não tratamento/i)).toBeTruthy();
    expect(screen.getAllByText(/188/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/192/).length).toBeGreaterThan(0);
  });

  it('mostra a linha de crise em EN', () => {
    renderWithCss(<CatalogMindNotice item={item} language="en-US" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByText(/does not replace a psychologist/i)).toBeTruthy();
    expect(screen.getByText(/crisis line/i)).toBeTruthy();
  });

  it('lista as contraindicações do item', () => {
    renderWithCss(<CatalogMindNotice item={item} language="pt-BR" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    for (const c of item.contraindications ?? []) {
      expect(screen.getByText(c)).toBeTruthy();
    }
  });

  it('"Adicionar" começa desabilitado e só libera após marcar "Entendi"', () => {
    renderWithCss(<CatalogMindNotice item={item} language="pt-BR" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    const botao = screen.getByRole('button', { name: /adicionar/i }) as HTMLButtonElement;
    expect(botao.disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(botao.disabled).toBe(false);
  });

  it('só chama onConfirm depois do "Entendi"', () => {
    const onConfirm = vi.fn();
    renderWithCss(<CatalogMindNotice item={item} language="pt-BR" onCancel={vi.fn()} onConfirm={onConfirm} />);
    const botao = screen.getByRole('button', { name: /adicionar/i });
    fireEvent.click(botao);
    expect(onConfirm).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(botao);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
