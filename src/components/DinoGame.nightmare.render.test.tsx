// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DinoGame } from './DinoGame';

beforeEach(() => {
  vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Corrida com obstáculos — visual de Pesadelo', () => {
  it('pode ser ativado antes da corrida e começa desligado', () => {
    render(<DinoGame evolutionStage="rookie" language="pt-BR" onEarnPoints={() => {}} onScore={() => {}} onExit={() => {}} />);
    const toggle = screen.getByRole('button', { name: 'Ativar visual de Pesadelo' });
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(toggle);
    expect(screen.getByRole('button', { name: 'Pesadelo: sombra ativa ✦' }).getAttribute('aria-pressed')).toBe('true');
  });
});
