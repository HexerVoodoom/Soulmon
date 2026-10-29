// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup, act, fireEvent } from '@testing-library/react';
import { EvoRecapModal } from './EvoRecapModal';
import { buildEvoRecap } from '../utils/evoRecap';

afterEach(() => { cleanup(); vi.useRealTimers(); });
const recap = buildEvoRecap({ report: { date: 'd', gaugeGain: 3, evolutionPoints: 15 }, evolutionStage: 'rookie' })!;

describe('EvoRecapModal', () => {
  it('PT: ontem, agora, +N% e falta; a barra sai do valor de ontem e enche', () => {
    vi.useFakeTimers();
    render(<EvoRecapModal recap={recap} language="pt-BR" onClose={() => {}} />);
    const fill = document.querySelector('[data-evo-recap-fill]') as HTMLElement;
    expect(fill.style.width).toBe('40%');
    expect(document.querySelector('[data-evo-recap-before]')?.textContent).toBe('40%');
    expect(document.querySelector('[data-evo-recap-after]')?.textContent).toBe('50%');
    expect(screen.getByText('+10% desde ontem')).toBeTruthy();
    expect(screen.getByText('Faltam 15 para evoluir.')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(400); });
    expect(fill.style.width).toBe('50%');
    expect(fill.className).toContain('sm2-evo-recap-glow');
  });
  it('EN + fechar', () => {
    const onClose = vi.fn();
    render(<EvoRecapModal recap={recap} language="en-US" onClose={onClose} />);
    expect(screen.getByText('+10% since yesterday')).toBeTruthy();
    fireEvent.click(screen.getByText('Continue'));
    expect(onClose).toHaveBeenCalled();
  });
  it('barra cheia: copy de pronta', () => {
    const full = buildEvoRecap({ report: { date: 'd', gaugeGain: 3, evolutionPoints: 30 }, evolutionStage: 'rookie' })!;
    render(<EvoRecapModal recap={full} language="pt-BR" onClose={() => {}} />);
    expect(screen.getAllByText('Barra cheia!').length).toBeGreaterThan(0);
  });
});
