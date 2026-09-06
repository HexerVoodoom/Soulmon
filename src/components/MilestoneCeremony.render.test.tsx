// @vitest-environment jsdom
/**
 * WP2.4 — a cerimônia do marco.
 *
 * Cruzar 7, 21 ou 66 dias de um hábito era um som, um toast e uma fala: três
 * coisas que o app faz o tempo todo por qualquer motivo. O momento mais raro
 * da mecânica de constância era indistinguível de concluir uma tarefa.
 *
 * As duas travas que este teste guarda: ela NÃO pede nada, e ela vai embora.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { MilestoneCeremony, MILESTONE_CEREMONY_MS } from './MilestoneCeremony';

const base = {
  tierIcon: '🌿',
  habitName: 'Ler',
  text: '🌿 7 dias! Este hábito virou broto.',
  language: 'pt-BR' as const,
};

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('MilestoneCeremony — o que ela mostra', () => {
  it('o hábito e a frase do marco', () => {
    renderWithCss(<MilestoneCeremony {...base} onDone={() => {}} />);
    expect(screen.getByText('Ler')).toBeTruthy();
    expect(screen.getByText(base.text)).toBeTruthy();
  });

  it('é anunciada a quem usa leitor de tela', () => {
    const { container } = renderWithCss(<MilestoneCeremony {...base} onDone={() => {}} />);
    expect(container.querySelector('[role="status"]')).not.toBeNull();
  });
});

describe('MilestoneCeremony — ela some sozinha e não pede nada', () => {
  it('some depois de 2,5s sem ninguém tocar', () => {
    vi.useFakeTimers();
    const onDone = vi.fn();
    renderWithCss(<MilestoneCeremony {...base} onDone={onDone} />);
    expect(onDone).not.toHaveBeenCalled();
    vi.advanceTimersByTime(MILESTONE_CEREMONY_MS + 10);
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it('NÃO tem botão de confirmar — marco que exige confirmação vira tarefa', () => {
    const { container } = renderWithCss(<MilestoneCeremony {...base} onDone={() => {}} />);
    expect(container.querySelectorAll('button')).toHaveLength(0);
  });

  it('a duração é curta: pausa para saborear, não interrupção', () => {
    expect(MILESTONE_CEREMONY_MS).toBeLessThanOrEqual(4000);
  });
});

describe('MilestoneCeremony — o háptico é opcional', () => {
  it('onde não existe `vibrate`, nada quebra', () => {
    vi.stubGlobal('navigator', {});
    expect(() => renderWithCss(<MilestoneCeremony {...base} onDone={() => {}} />)).not.toThrow();
  });
});
