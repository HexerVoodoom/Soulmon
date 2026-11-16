// @vitest-environment jsdom
/** Botão DEMO escondido pelo interruptor `DEMO_BUTTON_ENABLED` (utils/demoButton.ts). */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { act } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { DEMO_BUTTON_ENABLED } from '../utils/demoButton';
import { STORAGE_KEYS } from '../utils/storageKeys';

vi.mock('../utils/auth', async () => {
  const real = await vi.importActual<typeof import('../utils/auth')>('../utils/auth');
  return { ...real, isAuthConfigured: () => true, getCurrentEmail: async () => null };
});

describe('botão DEMO desligado', () => {
  beforeEach(() => { localStorage.clear(); localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en-US'); });

  it('o interruptor está desligado e o portão não mostra DEMO mesmo com onStartDemo', async () => {
    expect(DEMO_BUTTON_ENABLED).toBe(false);
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} onStartDemo={vi.fn()} />);
    await act(async () => {});
    expect(document.querySelector('[data-demo-button]')).toBeNull();
    expect(document.body.textContent).not.toContain('Saved on this device only.');
  });

  it('sem sessão, nenhum texto/aria "DEMO" no portão', async () => {
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} onStartDemo={vi.fn()} />);
    await act(async () => {});
    expect(document.querySelector('[aria-label^="DEMO"]')).toBeNull();
    expect(Array.from(document.querySelectorAll('button')).some(b => /^\s*demo\s*$/i.test(b.textContent ?? ''))).toBe(false);
  });

  it('o portão continua amarrado ao interruptor (regressão do release #897, §446)', () => {
    const src = readFileSync('src/components/SoulmonOnboarding.tsx', 'utf8');
    expect(src).toMatch(/DEMO_BUTTON_ENABLED\s*&&\s*onStartDemo/);
  });
});
