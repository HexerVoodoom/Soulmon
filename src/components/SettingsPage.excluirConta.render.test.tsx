// @vitest-environment jsdom
/** Caminho COMPLETO pelas Configuracoes: Seus dados > Delete my account > plano visivel > Erase now > despedida (resposta real do servidor). */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { SettingsPage } from './SettingsPage';
import { ThemeProvider } from '../contexts/ThemeContext';
import { STORAGE_KEYS } from '../utils/storageKeys';

vi.mock('../utils/auth', async (orig) => ({ ...(await orig<Record<string, unknown>>()), authHeaders: async () => ({}), signOut: async () => {}, isAuthConfigured: () => true }));
vi.mock('../../functions/api/_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));

const ID = 'a'.repeat(32);
function fakeKV(seed: Record<string, string>) {
  const store = new Map(Object.entries(seed));
  return {
    get: async (k: string) => store.get(k) ?? null,
    getWithMetadata: async (k: string) => ({ value: store.get(k) ?? null, metadata: {} }),
    put: async (k: string, v: string) => { store.set(k, v); },
    delete: async (k: string) => { store.delete(k); },
    list: async ({ prefix = '' }: { prefix?: string }) => ({ keys: [...store.keys()].filter(k => k.startsWith(prefix)).map(name => ({ name })), list_complete: true }),
  };
}

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: (q: string) => ({ matches: false, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent: () => false }) });
  localStorage.setItem(STORAGE_KEYS.SAVE_ID, ID);
});
afterEach(() => { vi.unstubAllGlobals(); localStorage.clear(); });

describe('Configuracoes > excluir conta, ponta a ponta', () => {
  it('o plano de confirmacao aparece VISIVEL e a despedida vem depois', async () => {
    // @ts-expect-error JS do servidor
    const { onRequest } = await import('../../functions/api/account.js');
    const env = { DIGIAPP_SAVES: fakeKV({ [ID]: JSON.stringify({ totalXP: 5 }), [`profile:${ID}`]: JSON.stringify({ friends: [] }) }), FIREBASE_PROJECT_ID: 't' };
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => (String(url).startsWith('/api/account') ? onRequest({ request: new Request(`https://x${url}`, init), env }) : new Response('{}', { status: 404 }))));
    renderWithCss(<ThemeProvider><SettingsPage useAI={false} onToggleAI={() => {}} language="en-US" onChangeLanguage={() => {}} onOpenGuide={() => {}} onOpenGlossary={() => {}} notificationsEnabled={false} onToggleNotifications={() => {}} onRestoreFromCloud={async () => true} onLoginWithEmail={async () => 'loaded' as const} /></ThemeProvider>);
    document.querySelectorAll<HTMLButtonElement>('[data-group-toggle][aria-expanded="false"]').forEach(b => fireEvent.click(b));
    fireEvent.click(screen.getByRole('button', { name: /Delete my account/i }));
    const erase = await waitFor(() => screen.getByRole('button', { name: /Erase now/i }));
    expect(erase.closest('[hidden]')).toBeNull();
    fireEvent.click(erase);
    await waitFor(() => expect(screen.getByText(/Back to start/i)).toBeTruthy(), { timeout: 5000 });
  });
});
