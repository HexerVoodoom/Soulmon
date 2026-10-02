// @vitest-environment jsdom
/**
 * H3 (02/10/2026, BUG do dono): login Google numa conta que JÁ existia não
 * restaurava o save — caía nos termos/onboarding como conta nova. Causa: o
 * login por popup/nativo terminava em `aposAutenticar`, que só ia para os
 * termos; a adoção do save em nuvem estava no fim do onboarding (e no efeito
 * de montagem do App, que não roda após um login feito na tela).
 *
 * Agora: save remoto → adota, religa as flags de onboarding/tutorial e
 * recarrega (pula termos e onboarding). Sem save remoto → termos.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { screen, fireEvent, act, waitFor } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { STORAGE_KEYS } from '../utils/storageKeys';
import { emailToSaveId } from '../utils/cloudSave';

const { nuvem } = vi.hoisted(() => ({
  nuvem: { resposta: { found: false } as { found: boolean; state?: unknown }, status: 200 },
}));

vi.mock('../utils/auth', async () => {
  const real = await vi.importActual<typeof import('../utils/auth')>('../utils/auth');
  return {
    ...real,
    isAuthConfigured: () => true,
    getCurrentEmail: async () => null,
    authHeaders: async () => ({}),
    entrarComGoogle: async () => ({ ok: true, email: 'Antiga@Exemplo.com' }),
  };
});

const recarregar = vi.fn();
const fetchReal = globalThis.fetch;

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(STORAGE_KEYS.LANGUAGE, 'en-US');
  recarregar.mockClear();
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { ...window.location, reload: recarregar },
  });
  nuvem.status = 200;
  globalThis.fetch = vi.fn(async () => new Response(JSON.stringify(nuvem.resposta), { status: nuvem.status })) as typeof fetch;
});
afterEach(() => { globalThis.fetch = fetchReal; });

async function entrarComGoogle() {
  renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
  await act(async () => {});
  await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' })); });
  // Sob carga a cadeia assíncrona (hash + fetch) demora: espera o desfecho.
  await waitFor(() => {
    expect(recarregar.mock.calls.length > 0 || screen.queryByText('Before we start') !== null
      || localStorage.getItem(STORAGE_KEYS.GAME_STATE) !== null).toBe(true);
  });
}

describe('login Google em conta existente', () => {
  it('com save remoto: adota o save, liga as flags e recarrega — sem ir aos termos', async () => {
    nuvem.resposta = {
      found: true,
      state: { soulmonMeta: { baseName: 'Pyraka' }, activities: [{ id: 'a' }], totalXP: 40 },
    };
    await entrarComGoogle();
    expect(recarregar).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem(STORAGE_KEYS.SAVE_ID)).toBe(await emailToSaveId('antiga@exemplo.com'));
    expect(localStorage.getItem(STORAGE_KEYS.USER_EMAIL)).toBe('antiga@exemplo.com');
    expect(JSON.parse(localStorage.getItem(STORAGE_KEYS.GAME_STATE)!).soulmonMeta.baseName).toBe('Pyraka');
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE)).toBe('true');
    expect(localStorage.getItem(STORAGE_KEYS.TUTORIAL_COMPLETE)).toBe('true');
    expect(screen.queryByText('Before we start')).toBeNull();
  });

  it('sem save remoto: não recarrega e segue para os termos', async () => {
    nuvem.resposta = { found: false };
    await entrarComGoogle();
    expect(recarregar).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE)).toBeNull();
    expect(screen.getByText('Before we start')).toBeTruthy();
  });

  it('nuvem fora do ar (5xx): não adota nada e segue como conta nova', async () => {
    nuvem.status = 503;
    await entrarComGoogle();
    expect(recarregar).not.toHaveBeenCalled();
    expect(localStorage.getItem(STORAGE_KEYS.GAME_STATE)).toBeNull();
    expect(screen.getByText('Before we start')).toBeTruthy();
  });

  it('save vazio na nuvem (nasceu antes do fim do onboarding): adota mas NÃO pula o ritual', async () => {
    nuvem.resposta = { found: true, state: { activities: [], completedTasks: [], totalXP: 0 } };
    await entrarComGoogle();
    expect(localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE)).toBeNull();
  });
});
