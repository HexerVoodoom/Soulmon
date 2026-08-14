// @vitest-environment jsdom
/**
 * Teste de render do `TaskCard` — a ficha que carrega a AÇÃO CENTRAL do app
 * (marcar tarefa como concluída). É onde o checkbox de 2px viveu em produção.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, declaredTargetSize } from '../test/renderEnv';
import { TaskCard } from './TaskCard';

const base = {
  id: 't1',
  name: 'Beber água',
  category: 'health',
  emoji: '💧',
  completed: false,
  onToggleComplete: () => {},
  onEdit: () => {},
};

describe('TaskCard', () => {
  it('renderiza o nome e o emoji da tarefa', () => {
    renderWithCss(<TaskCard {...base} />);
    expect(screen.getByText(/Beber água/)).toBeTruthy();
  });

  it('TODO alvo de toque da ficha tem ao menos 44×44 (WCAG 2.2 AA folgado)', () => {
    const { container } = renderWithCss(<TaskCard {...base} language="pt-BR" />);
    const targets = Array.from(container.querySelectorAll('button'));
    expect(targets.length).toBe(2); // checkbox + editar
    for (const t of targets) {
      const { w, h } = declaredTargetSize(t);
      expect(`${t.getAttribute('aria-label')} w=${w}`).toBe(`${t.getAttribute('aria-label')} w=44`);
      expect(h).toBeGreaterThanOrEqual(44);
    }
  });

  it('marcar dispara o handler com o id da tarefa (efeito, não intenção)', () => {
    const onToggleComplete = vi.fn();
    renderWithCss(<TaskCard {...base} onToggleComplete={onToggleComplete} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggleComplete).toHaveBeenCalledWith('t1');
  });

  it('tarefa já concluída não pode ser marcada de novo (dupla contagem)', () => {
    const onToggleComplete = vi.fn();
    renderWithCss(<TaskCard {...base} completed onToggleComplete={onToggleComplete} />);
    const box = screen.getByRole('checkbox');
    expect(box.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(box);
    expect(onToggleComplete).not.toHaveBeenCalled();
  });

  it('editar dispara com o id', () => {
    const onEdit = vi.fn();
    renderWithCss(<TaskCard {...base} onEdit={onEdit} language="en-US" />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit task' }));
    expect(onEdit).toHaveBeenCalledWith('t1');
  });

  it('par PT/EN completo: nenhum rótulo acessível fica só em um idioma', () => {
    const en = renderWithCss(<TaskCard {...base} language="en-US" />);
    const enLabels = Array.from(en.container.querySelectorAll('button')).map(b => b.getAttribute('aria-label'));
    expect(enLabels).toEqual(['Mark task as completed', 'Edit task']);
    en.unmount();
    const pt = renderWithCss(<TaskCard {...base} language="pt-BR" />);
    const ptLabels = Array.from(pt.container.querySelectorAll('button')).map(b => b.getAttribute('aria-label'));
    expect(ptLabels).toEqual(['Marcar tarefa como concluída', 'Editar tarefa']);
    // e os dois conjuntos são REALMENTE diferentes — se alguém apagar o ramo EN
    // e deixar PT nos dois, este par cai.
    expect(enLabels).not.toEqual(ptLabels);
  });

  it('nome vazio não quebra a ficha nem some com o checkbox', () => {
    renderWithCss(<TaskCard {...base} name="" emoji="" />);
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });

  it('nome absurdamente longo não remove o botão de editar da árvore', () => {
    renderWithCss(<TaskCard {...base} name={'a'.repeat(5000)} language="en-US" />);
    expect(screen.getByRole('button', { name: 'Edit task' })).toBeTruthy();
  });

  it('o ícone de editar é decorativo (o rótulo está no botão)', () => {
    const { container } = renderWithCss(<TaskCard {...base} />);
    expect(container.querySelector('img')!.getAttribute('alt')).toBe('');
  });
});
