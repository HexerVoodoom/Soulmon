// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ErrorBoundary, ErrorBoundaryRecarga } from './ErrorBoundary';

function Chunk(): never { throw new TypeError('Failed to fetch dynamically imported module: https://x/assets/Modal-BR2GV1gM.js'); }

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.addEventListener('error', e => e.preventDefault());
});

describe('ErrorBoundary — chunk faltante', () => {
  it('1º erro: recarrega sem mostrar a tela; 2º: mostra Detalhes', () => {
    const r = vi.fn();
    ErrorBoundaryRecarga.fn = r;
    const a = renderWithCss(<ErrorBoundary><Chunk /></ErrorBoundary>);
    expect(r).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Algo deu errado')).toBeNull();
    a.unmount();
    renderWithCss(<ErrorBoundary><Chunk /></ErrorBoundary>);
    expect(r).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('erro-detalhes').textContent).toContain('Modal-BR2GV1gM');
    ErrorBoundaryRecarga.fn = undefined;
  });
});
