// @vitest-environment jsdom
/**
 * 🧬 O gauge compacto da Home (11/10/2026): descreve, nunca cobra; PT e EN.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
afterEach(() => cleanup());
import { EvolutionGaugeMini } from './EvolutionGaugeMini';

describe('EvolutionGaugeMini', () => {
  it('EN: rótulo, contagem, prévia de hoje e progressbar com os números do gauge', () => {
    render(<EvolutionGaugeMini language="en-US" evolutionPoints={12} evolutionStage="rookie" todayWeight={2} />);
    expect(screen.getByText('Soul Fragments gathered')).toBeTruthy();
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuemax')).toBe('30');
    expect(bar.getAttribute('aria-valuenow')).toBe('12');
    expect(document.querySelector('[data-evo-gauge-mini-count]')?.textContent).toBe('12/30 · +2 today');
  });

  it('PT: cheio diz que a forma está pronta (sem número de falta)', () => {
    render(<EvolutionGaugeMini language="pt-BR" evolutionPoints={45} evolutionStage="champion-power" todayWeight={3} />);
    expect(screen.getByText('A próxima forma está pronta')).toBeTruthy();
    expect(document.querySelector('[data-evo-gauge-mini-count]')?.textContent).toBe('45/45');
  });

  it('no topo (ultra) não há barra', () => {
    const { container } = render(<EvolutionGaugeMini language="en-US" evolutionPoints={10} evolutionStage="ultra" todayWeight={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('o texto nunca cobra: sem "only", "left", "faltam", "só"', () => {
    const { container } = render(<EvolutionGaugeMini language="pt-BR" evolutionPoints={1} evolutionStage="rookie" todayWeight={0} />);
    const t = container.textContent ?? '';
    expect(t).not.toMatch(/\bonly\b|\bleft\b|faltam|\bsó\b/i);
  });
});
