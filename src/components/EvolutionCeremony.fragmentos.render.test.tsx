/** @vitest-environment jsdom */
// REGISTRO §151: a cerimônia diz, uma vez, que os Fragmentos de Alma foram USADOS — sem número que desce.
import { describe, it, expect, afterEach, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { EvolutionCeremony } from './EvolutionCeremony';

beforeEach(() => {
  window.matchMedia = ((q: string) => ({
    matches: q.includes('reduce'), media: q, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  })) as unknown as typeof window.matchMedia;
});
afterEach(() => cleanup());

const props = { fromStage: 'rookie', toStage: 'champion-power', toName: 'Forma', onEvolved: () => {}, onClose: () => {} };

describe('EvolutionCeremony — Fragmentos de Alma', () => {
  it('EN: ao concluir diz quantos fragmentos foram usados', () => {
    render(<EvolutionCeremony {...props} language="en-US" fragmentsSpent={30} />);
    expect(document.querySelector('[data-cer-fragments]')?.textContent).toBe('30 soul fragments gave shape to this evolution.');
    expect(document.querySelector('[data-soul-fragment-icon]')).toBeTruthy();
  });

  it('PT: plural e texto', () => {
    render(<EvolutionCeremony {...props} language="pt-BR" fragmentsSpent={45} />);
    expect(screen.getByText('45 fragmentos de alma deram forma a esta evolução.')).toBeTruthy();
  });

  it('sem custo informado: a linha não existe', () => {
    render(<EvolutionCeremony {...props} language="pt-BR" />);
    expect(document.querySelector('[data-cer-fragments]')).toBeNull();
  });
});
