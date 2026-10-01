/**
 * LOGIN COM GOOGLE NO APK — roteamento nativo × web de `entrarComGoogle`.
 *
 * Bug do dono (01/10/2026): no APK o popup/redirect do Firebase web levava a
 * pessoa para `accounts.google.com` FORA do app e, ao voltar, a tela ficava
 * BRANCA. A correção é: no nativo, seletor de conta do Android
 * (`@capacitor-firebase/authentication`, `skipNativeAuth`) → `idToken` →
 * `signInWithCredential` no SDK web. O que este arquivo trava:
 *   1. no nativo, popup e redirect NUNCA são chamados (nem quando o nativo falha);
 *   2. o `idToken` do plugin vira a credencial da sessão web;
 *   3. falha do nativo volta como `{ ok: false, erro }` (o portão mostra a
 *      mensagem) e o código cru vai para o console;
 *   4. na web, nada muda: popup, sem tocar no plugin.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const nativo = { valor: false };
vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => nativo.valor },
}));

const signInWithGoogle = vi.fn<(o: unknown) => Promise<unknown>>();
const pluginSignOut = vi.fn<() => Promise<void>>(async () => {});
vi.mock('@capacitor-firebase/authentication', () => ({
  FirebaseAuthentication: {
    signInWithGoogle: (o: unknown) => signInWithGoogle(o),
    signOut: () => pluginSignOut(),
  },
}));

const signInWithPopup = vi.fn<(a: unknown, b: unknown) => Promise<unknown>>();
const signInWithRedirect = vi.fn<(a: unknown, b: unknown) => Promise<unknown>>();
const signInWithCredential = vi.fn<(a: unknown, c: unknown) => Promise<unknown>>();
const credentialFromToken = vi.fn((idToken: string) => ({ providerId: 'google.com', idToken }));

vi.mock('firebase/app', () => ({
  initializeApp: () => ({ name: 'test' }),
  getApps: () => [],
}));

vi.mock('firebase/auth', () => {
  class GoogleAuthProvider {
    static credential(idToken: string) { return credentialFromToken(idToken); }
    addScope() {}
  }
  return {
    getAuth: () => ({ name: 'auth' }),
    GoogleAuthProvider,
    signInWithPopup: (a: unknown, b: unknown) => signInWithPopup(a, b),
    signInWithRedirect: (a: unknown, b: unknown) => signInWithRedirect(a, b),
    signInWithCredential: (a: unknown, c: unknown) => signInWithCredential(a, c),
    setPersistence: async () => {},
    browserLocalPersistence: 'local',
    signOut: async () => {},
  };
});

vi.stubEnv('VITE_FIREBASE_API_KEY', 'chave-de-teste');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'soulmon-app.firebaseapp.com');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'soulmon-app');

describe('entrarComGoogle — APK (nativo)', () => {
  beforeEach(() => {
    nativo.valor = true;
    signInWithGoogle.mockReset();
    signInWithPopup.mockReset();
    signInWithRedirect.mockReset();
    signInWithCredential.mockReset();
    credentialFromToken.mockClear();
    pluginSignOut.mockClear();
  });

  it('usa o seletor nativo e entra no SDK web com o idToken', async () => {
    const { entrarComGoogle } = await import('./auth');
    signInWithGoogle.mockResolvedValue({ user: null, credential: { providerId: 'google.com', idToken: 'tok-123' } });
    signInWithCredential.mockResolvedValue({ user: { email: 'dono@exemplo.com' } });

    const r = await entrarComGoogle();

    expect(r).toEqual({ ok: true, email: 'dono@exemplo.com' });
    expect(signInWithGoogle).toHaveBeenCalledWith({ skipNativeAuth: true });
    expect(credentialFromToken).toHaveBeenCalledWith('tok-123');
    expect(signInWithCredential).toHaveBeenCalledTimes(1);
    expect(signInWithPopup).not.toHaveBeenCalled();
    expect(signInWithRedirect).not.toHaveBeenCalled();
  });

  it('pessoa fechou o seletor: volta ao portão como popup-fechado, sem redirect', async () => {
    const { entrarComGoogle } = await import('./auth');
    signInWithGoogle.mockRejectedValue(new Error('activity is cancelled by the user.'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const r = await entrarComGoogle();

    expect(r).toEqual({ ok: false, erro: 'popup-fechado' });
    expect(signInWithRedirect).not.toHaveBeenCalled();
    expect(signInWithPopup).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      '[auth] entrarComGoogle (nativo) falhou',
      expect.objectContaining({ message: 'activity is cancelled by the user.' }),
    );
    warn.mockRestore();
  });

  it('plugin ausente/quebrado (APK antigo, SHA não cadastrada): erro, nunca tela branca', async () => {
    const { entrarComGoogle } = await import('./auth');
    signInWithGoogle.mockRejectedValue(Object.assign(new Error('not implemented'), { code: 'UNIMPLEMENTED' }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const r = await entrarComGoogle();

    expect(r).toEqual({ ok: false, erro: 'desconhecido' });
    expect(signInWithRedirect).not.toHaveBeenCalled();
    expect(warn).toHaveBeenCalledWith(
      '[auth] entrarComGoogle (nativo) falhou',
      expect.objectContaining({ code: 'UNIMPLEMENTED' }),
    );
    warn.mockRestore();
  });

  it('plugin respondeu sem idToken: erro em vez de sessão inventada', async () => {
    const { entrarComGoogle } = await import('./auth');
    signInWithGoogle.mockResolvedValue({ user: null, credential: null });
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const r = await entrarComGoogle();

    expect(r.ok).toBe(false);
    expect(signInWithCredential).not.toHaveBeenCalled();
  });

  it('o Firebase recusa a credencial: código traduzido como no web', async () => {
    const { entrarComGoogle } = await import('./auth');
    signInWithGoogle.mockResolvedValue({ user: null, credential: { idToken: 'tok' } });
    signInWithCredential.mockRejectedValue(Object.assign(new Error('x'), { code: 'auth/network-request-failed' }));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    expect(await entrarComGoogle()).toEqual({ ok: false, erro: 'rede' });
  });

  it('signOut no APK limpa também o estado nativo', async () => {
    const { signOut } = await import('./auth');
    await signOut();
    expect(pluginSignOut).toHaveBeenCalledTimes(1);
  });
});

describe('entrarComGoogle — navegador (web)', () => {
  beforeEach(() => {
    nativo.valor = false;
    signInWithGoogle.mockReset();
    signInWithPopup.mockReset();
    pluginSignOut.mockClear();
  });

  it('segue no popup e não toca no plugin nativo', async () => {
    const { entrarComGoogle } = await import('./auth');
    signInWithPopup.mockResolvedValue({ user: { email: 'web@exemplo.com' } });

    const r = await entrarComGoogle();

    expect(r).toEqual({ ok: true, email: 'web@exemplo.com' });
    expect(signInWithPopup).toHaveBeenCalledTimes(1);
    expect(signInWithGoogle).not.toHaveBeenCalled();
  });

  it('signOut na web não chama o plugin', async () => {
    const { signOut } = await import('./auth');
    await signOut();
    expect(pluginSignOut).not.toHaveBeenCalled();
  });
});
