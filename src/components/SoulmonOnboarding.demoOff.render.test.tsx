// @vitest-environment jsdom
/** Botão DEMO escondido pelo interruptor `DEMO_BUTTON_ENABLED` (utils/demoButton.ts). */
import { describe, it, expect, beforeEach, vi } from 'vitest';
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
});
