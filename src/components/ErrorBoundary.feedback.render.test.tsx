// @vitest-environment jsdom
/**
 * A tela de erro tem o canal de feedback ONDE o erro acontece (QA geral
 * 21/09/2026, item 4): link `mailto:` com versão, trecho do código e a
 * mensagem do erro — nunca o stack.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ErrorBoundary } from './ErrorBoundary';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { APP_VERSION } from './FeedbackLink';

function Explode(): never {
  throw new Error('boom de teste');
}

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.SAVE_ID, '0123456789abcdef0123456789abcdef');
  // O React loga o erro capturado e o jsdom o reporta de novo como "uncaught"
  // no `window`; o ruído não é o assunto do teste. `preventDefault` no evento
  // de erro é o que cala o relatório do jsdom.
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.addEventListener('error', e => e.preventDefault());
});

describe('ErrorBoundary — feedback', () => {
  it('PT (padrão sem idioma salvo): link com versão, código curto e mensagem do erro', () => {
    renderWithCss(<ErrorBoundary><Explode /></ErrorBoundary>);
    expect(screen.getByText('Algo deu errado')).toBeTruthy();
    const a = screen.getByRole('link', { name: /Falar com quem faz o Soulmon/ }) as HTMLAnchorElement;
    const body = decodeURIComponent(a.getAttribute('href') ?? '');
    expect(body).toContain(`Versão: ${APP_VERSION}`);
    expect(body).toContain('Código: 01234567');
    expect(body).toContain('Erro: boom de teste');
    expect(body).toContain('Soulmon — erro');
    // Alvo de toque: 44px declarado.
    expect(a.style.minHeight).toBe('44px');
  });

  it('EN: rótulo e corpo em inglês', () => {
    localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en-US');
    renderWithCss(<ErrorBoundary><Explode /></ErrorBoundary>);
    expect(screen.getByText('Something went wrong')).toBeTruthy();
    const a = screen.getByRole('link', { name: /Talk to the people who make Soulmon/ }) as HTMLAnchorElement;
    expect(decodeURIComponent(a.getAttribute('href') ?? '')).toContain(`Version: ${APP_VERSION}`);
  });
});
