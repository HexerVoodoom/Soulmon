// @vitest-environment jsdom
/** Forma REAL de `delete-request`/`delete-confirm` (saida do handler de functions/api/account.js) alimentando a tela. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { AccountDataSection } from './AccountDataSection';

vi.mock('../utils/auth', () => ({ authHeaders: async () => ({}), signOut: async () => {}, isAuthConfigured: () => true }));
vi.mock('../../functions/api/_auth.js', () => ({
  requireVerifiedOwner: async () => ({ ok: true, email: 'quem@exemplo.com' }),
  authorizeSaveAccess: async () => ({ ok: true, enforced: false }),
}));
vi.mock('./../../functions/api/_auth.js', () => ({
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

afterEach(() => { vi.unstubAllGlobals(); });

describe('AccountDataSection com a resposta real do servidor', () => {
  it('pedir -> plano aparece -> confirmar -> despedida', async () => {
    // @ts-expect-error JS do servidor
    const { onRequest } = await import('../../functions/api/account.js');
    const env = { DIGIAPP_SAVES: fakeKV({ [ID]: JSON.stringify({ totalXP: 5 }), [`profile:${ID}`]: JSON.stringify({ friends: [] }) }), FIREBASE_PROJECT_ID: 't' };
    vi.stubGlobal('fetch', vi.fn(async (url: string, init: RequestInit) => onRequest({ request: new Request(`https://x${url}`, init), env })));
    renderWithCss(<AccountDataSection language="en" saveId={ID} authAvailable />);
    fireEvent.click(screen.getByRole('button', { name: /Delete my account/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Erase now/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Erase now/i }));
    await waitFor(() => expect(screen.getByText(/Back to start/i)).toBeTruthy(), { timeout: 5000 });
  });
});
