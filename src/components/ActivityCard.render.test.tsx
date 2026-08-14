// @vitest-environment jsdom
/**
 * Teste de render do `ActivityCard` — a ficha das atividades recorrentes, que
 * na rodada de UI trocou a barra lisa pela `PixelSegmentedBar`. A barra é o
 * feedback de progresso do hábito; se ela mentir, a leitura do dia mente.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, declaredTargetSize } from '../test/renderEnv';
import { ActivityCard } from './ActivityCard';

const steps = [
  { id: 'a', label: 'Passo 1', completed: true },
  { id: 'b', label: 'Passo 2', completed: true },
  { id: 'c', label: 'Passo 3', completed: false },
  { id: 'd', label: 'Passo 4', completed: false },
];

const base = {
  id: 'act1',
  name: 'Correr',
  steps,
  onUpdateStep: () => {},
  onEditActivity: () => {},
};

describe('ActivityCard com etapas', () => {
  it('a barra segmentada reflete 2 de 4 — número e blocos concordam', () => {
    const { container } = renderWithCss(<ActivityCard {...base} />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
    expect(container.querySelectorAll('.sm-px-bar-seg-on')).toHaveLength(2);
    expect(screen.getByText('2/4')).toBeTruthy();
  });

  it('não mostra checkbox da atividade quando ela tem etapas (dupla contagem)', () => {
    renderWithCss(<ActivityCard {...base} />);
    // 4 checkboxes = 4 etapas; nenhum a mais para a atividade inteira
    expect(screen.getAllByRole('checkbox')).toHaveLength(4);
  });

  it('marcar uma etapa avisa a atividade E a etapa (par de ids)', () => {
    const onUpdateStep = vi.fn();
    renderWithCss(<ActivityCard {...base} onUpdateStep={onUpdateStep} language="en-US" />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mark step as completed: Passo 3' }));
    expect(onUpdateStep).toHaveBeenCalledWith('act1', 'c');
  });

  it('atividade desabilitada não move nenhuma etapa', () => {
    const onUpdateStep = vi.fn();
    renderWithCss(<ActivityCard {...base} isDisabled onUpdateStep={onUpdateStep} language="en-US" />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Mark step as completed: Passo 3' }));
    expect(onUpdateStep).not.toHaveBeenCalled();
  });

  it('recolhida (isExpanded=false) esconde as etapas e a barra', () => {
    renderWithCss(<ActivityCard {...base} isExpanded={false} />);
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
  });
});

describe('ActivityCard sem etapas', () => {
  const noSteps = { ...base, steps: [] };

  it('mostra o checkbox da atividade, com alvo de 44×44', () => {
    renderWithCss(<ActivityCard {...noSteps} onToggleCompletion={() => {}} />);
    const box = screen.getByRole('checkbox');
    expect(declaredTargetSize(box)).toEqual({ w: 44, h: 44 });
  });

  it('concluir dispara com o id da atividade', () => {
    const onToggleCompletion = vi.fn();
    renderWithCss(<ActivityCard {...noSteps} onToggleCompletion={onToggleCompletion} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggleCompletion).toHaveBeenCalledWith('act1');
  });

  it('atividade já concluída não conta de novo', () => {
    const onToggleCompletion = vi.fn();
    renderWithCss(<ActivityCard {...noSteps} isCompleted onToggleCompletion={onToggleCompletion} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggleCompletion).not.toHaveBeenCalled();
  });

  it('sem `onToggleCompletion` o clique não derruba o componente', () => {
    renderWithCss(<ActivityCard {...noSteps} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toBeTruthy();
  });

  it('os dias da semana saem no idioma escolhido, com par PT/EN', () => {
    const en = renderWithCss(<ActivityCard {...noSteps} weekDays={[1, 3]} language="en-US" />);
    expect(screen.getByText('Mon')).toBeTruthy();
    en.unmount();
    renderWithCss(<ActivityCard {...noSteps} weekDays={[1, 3]} language="pt-BR" />);
    expect(screen.getByText('Seg')).toBeTruthy();
    expect(screen.queryByText('Mon')).toBeNull();
  });

  it('execução única não imprime a régua de dias (ruído por card)', () => {
    renderWithCss(<ActivityCard {...noSteps} isSingleExecution language="en-US" />);
    expect(screen.queryByText('Mon')).toBeNull();
  });
});
