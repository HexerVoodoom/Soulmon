// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { installDomGlobals } from '../test/renderEnv';
import { EvolutionRing } from './EvolutionRing';

installDomGlobals();
afterEach(cleanup);

describe('EvolutionRing', () => {
  it('preenche proporcional ao líder e fala o número em texto', () => {
    const { getByTestId } = render(<EvolutionRing value={5} max={10} color="red" label="5 pontos" />);
    const el = getByTestId('sm-anel');
    expect(el.getAttribute('data-frac')).toBe('0.50');
    expect(el.getAttribute('aria-label')).toBe('5 pontos');
    expect(el.getAttribute('role')).toBe('img');
    expect(el.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });
  it('max 0 não quebra (anel vazio)', () => {
    const { getByTestId } = render(<EvolutionRing value={0} max={0} color="red" label="0" />);
    expect(getByTestId('sm-anel').getAttribute('data-frac')).toBe('0.00');
  });
});
