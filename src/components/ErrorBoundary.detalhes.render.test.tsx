// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ErrorBoundary } from './ErrorBoundary';
import { APP_VERSION } from './FeedbackLink';

function Explode(): never { throw new Error('boom detalhe'); }

beforeEach(() => {
  localStorage.clear();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.addEventListener('error', e => e.preventDefault());
});

describe('ErrorBoundary — detalhes', () => {
  it('mostra mensagem e versão e leva ao link de feedback', () => {
    renderWithCss(<ErrorBoundary><Explode /></ErrorBoundary>);
    const t = screen.getByTestId('erro-detalhes').textContent ?? '';
    expect(t).toContain('Detalhes');
    expect(t).toContain('boom detalhe');
    expect(t).toContain(`v${APP_VERSION}`);
    const a = screen.getByRole('link', { name: /Falar com quem faz o Soulmon/ }) as HTMLAnchorElement;
    expect(decodeURIComponent(a.getAttribute('href') ?? '')).toContain('boom detalhe');
  });
});
