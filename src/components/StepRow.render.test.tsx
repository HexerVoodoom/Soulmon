// @vitest-environment jsdom
/**
 * Teste de render do `StepRow`.
 *
 * Motivo de existir: o relatório da UI (`ui/frontend-kit-round1.md` §6.9)
 * mediu 40×40 aqui, abaixo dos 44 do resto do app, e classificou como
 * "regressão silenciosa esperando acontecer". Silenciosa exatamente porque
 * nada travava o número. Agora trava.
 */
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, declaredTargetSize } from '../test/renderEnv';
import { StepRow } from './StepRow';

const base = { id: 's1', label: 'Aquecer', completed: false, onToggle: () => {} };

describe('StepRow', () => {
  it('o alvo da etapa é 44×44 — o mesmo piso das outras ações', () => {
    renderWithCss(<StepRow {...base} />);
    const { w, h } = declaredTargetSize(screen.getByRole('checkbox'));
    expect({ w, h }).toEqual({ w: 44, h: 44 });
  });

  it('marcar dispara com o id da etapa', () => {
    const onToggle = vi.fn();
    renderWithCss(<StepRow {...base} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledWith('s1');
  });

  it('etapa concluída não dispara de novo', () => {
    const onToggle = vi.fn();
    renderWithCss(<StepRow {...base} completed onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe('true');
  });

  it('etapa desabilitada não dispara nem pelo rótulo', () => {
    const onToggle = vi.fn();
    const { container } = renderWithCss(<StepRow {...base} disabled onToggle={onToggle} />);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(container.querySelector('span[aria-hidden="true"].select-none')!);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('o rótulo acessível carrega o texto da etapa nos dois idiomas', () => {
    const en = renderWithCss(<StepRow {...base} language="en-US" />);
    expect(screen.getByRole('checkbox').getAttribute('aria-label')).toBe('Mark step as completed: Aquecer');
    en.unmount();
    renderWithCss(<StepRow {...base} language="pt-BR" />);
    expect(screen.getByRole('checkbox').getAttribute('aria-label')).toBe('Marcar etapa como concluída: Aquecer');
  });

  it('só existe UMA parada de teclado por etapa (o rótulo não duplica o foco)', () => {
    const { container } = renderWithCss(<StepRow {...base} />);
    expect(container.querySelectorAll('button, [tabindex]')).toHaveLength(1);
  });
});
