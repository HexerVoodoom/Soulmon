// @vitest-environment jsdom
/**
 * REGISTRO §64 — o modal de reafirmar o dia: caixas DESMARCADAS com o que já está cadastrado; só o marcado vai adiante.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DayGoalsModal } from './DayGoalsModal';

afterEach(cleanup);
const CANDS = [
  { id: 'h1', name: 'Beber água', kind: 'habit' as const },
  { id: 'h2', name: 'Alongar', kind: 'habit' as const },
  { id: 't1', name: 'Pagar conta', kind: 'task' as const },
];

describe('DayGoalsModal', () => {
  it('as caixas nascem DESMARCADAS (substitui "todas marcadas"), com rótulo e alvo de toque de 44px', () => {
    const { container } = renderWithCss(<DayGoalsModal candidates={CANDS} language="pt-BR" onConfirm={vi.fn()} onClose={vi.fn()} />);
    const caixas = screen.getAllByRole('checkbox') as HTMLInputElement[];
    expect(caixas).toHaveLength(3);
    expect(caixas.every(c => !c.checked)).toBe(true);
    // checkbox real, com nome acessível pelo rótulo
    expect(screen.getByRole('checkbox', { name: 'Beber água' })).toBeTruthy();
    const rotulo = caixas[0].closest('label') as HTMLElement;
    expect(rotulo.style.minHeight).toBe('44px');
    // modal centralizado, sem fechar pelo véu
    expect((container.querySelector('[role="dialog"]') as HTMLElement).getAttribute('data-placement')).toBe('center');
    expect(container.querySelector('[data-dismiss-on-backdrop]')!.getAttribute('data-dismiss-on-backdrop')).toBe('false');
  });

  it('agrupa em Hábitos e Tarefas e conta as marcadas', () => {
    renderWithCss(<DayGoalsModal candidates={CANDS} language="pt-BR" onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'Hábitos' })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Tarefas' })).toBeTruthy();
    expect(screen.getByText('0 marcadas')).toBeTruthy();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Alongar' }));
    expect(screen.getByText('1 marcadas')).toBeTruthy();
  });

  it('confirmar devolve só os marcados (na ordem da lista); confirmar sem marcar devolve vazio', () => {
    const onConfirm = vi.fn();
    renderWithCss(<DayGoalsModal candidates={CANDS} language="pt-BR" onConfirm={onConfirm} onClose={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenLastCalledWith([]);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Pagar conta' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Beber água' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }));
    expect(onConfirm).toHaveBeenLastCalledWith(['h1', 't1']);
  });

  it('fechar sem confirmar chama só onClose (sem cobrança) e Esc fecha', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();
    renderWithCss(<DayGoalsModal candidates={CANDS} language="pt-BR" onConfirm={onConfirm} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('EN: título, dica e botão', () => {
    renderWithCss(<DayGoalsModal candidates={CANDS} language="en-US" onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('dialog', { name: "Today's goals" })).toBeTruthy();
    expect(screen.getByRole('region', { name: 'Habits' })).toBeTruthy();
    expect(screen.getByText('0 checked')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeTruthy();
  });

  it('marcados anteriores (reabrir antes de confirmar) voltam marcados', () => {
    renderWithCss(<DayGoalsModal candidates={CANDS} language="pt-BR" initiallyPicked={['h2']} onConfirm={vi.fn()} onClose={vi.fn()} />);
    expect((screen.getByRole('checkbox', { name: 'Alongar' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: 'Beber água' }) as HTMLInputElement).checked).toBe(false);
  });
});
