// @vitest-environment jsdom
/** QA-20: 2º toque na escolha durante a transição preta não repete `onChoice` nem pula quadro. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { SequenciaPlayer } from './SequenciaPlayer';
import type { Quadro } from './types';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const Q: Quadro[] = [
  { tipo: 'escolha', pergunta: { en: 'q', pt: 'q' }, opcoes: [{ id: 'x', rotulo: { en: 'X', pt: 'X' } }] },
  { tipo: 'cena', fundo: 'bg-malha-clara', transicaoPreta: true, fala: { en: 'dois', pt: 'dois' } },
  { tipo: 'cena', fundo: 'bg-malha-clara', fala: { en: 'tres', pt: 'tres' } },
];

describe('SequenciaPlayer: duplo toque na transição preta', () => {
  it('escolha conta uma vez e para no quadro seguinte', () => {
    vi.useFakeTimers();
    const onChoice = vi.fn();
    render(<SequenciaPlayer quadros={Q} language="en-US" onDone={() => {}} onChoice={onChoice} />);
    const b = screen.getByText('X');
    fireEvent.click(b); fireEvent.click(b);
    act(() => { vi.advanceTimersByTime(400); });
    expect(onChoice).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('sequencia-fala').textContent).toBe('dois');
  });
});
