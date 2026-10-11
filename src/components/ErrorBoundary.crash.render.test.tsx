// @vitest-environment jsdom
/**
 * O ErrorBoundary reporta o crash (relatório mínimo para /api/crash) e o main.tsx
 * instala os handlers globais ANTES de montar o app.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../test/renderEnv';
import { ErrorBoundary } from './ErrorBoundary';
import { resetCrashReporterForTest } from '../utils/crashReport';

function Explode(): never {
  throw new Error('boom do boundary para ana@x.com');
}

beforeEach(() => {
  localStorage.clear();
  resetCrashReporterForTest();
  vi.spyOn(console, 'error').mockImplementation(() => {});
  window.addEventListener('error', e => e.preventDefault());
});

describe('ErrorBoundary + crash report', () => {
  it('envia UM relatório kind=boundary, sem PII, e continua mostrando a tela de erro', () => {
    const f = vi.fn(() => Promise.resolve(new Response('{}')));
    vi.stubGlobal('fetch', f);
    renderWithCss(<ErrorBoundary><Explode /></ErrorBoundary>);
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('/api/crash');
    const body = JSON.parse(init.body as string);
    expect(body.kind).toBe('boundary');
    expect(body.msg).toContain('boom do boundary');
    expect(init.body).not.toContain('ana@x.com');
    vi.unstubAllGlobals();
  });

  it('main.tsx instala os handlers globais antes do render', () => {
    const src = readFileSync(resolve(__dirname, '../main.tsx'), 'utf8');
    const instala = src.indexOf('installGlobalCrashHandlers();');
    expect(instala).toBeGreaterThan(-1);
    expect(instala).toBeLessThan(src.indexOf('createRoot('));
  });
});
