import { STORAGE_KEYS } from './storageKeys';

// Login por link de e-mail (Firebase Auth).
//
// Por que existe: o `saveId` é o hash do e-mail. Sem provar que a pessoa é dona
// daquele e-mail, quem o conhecesse poderia ler e sobrescrever o save alheio.
// Com o login, o cliente passa a mandar um ID token assinado pelo Google em
// toda operação de save/dinheiro, e o servidor confere (functions/api/_auth.js).
//
// Fluxo (sem senha):
//   1. usuário digita o e-mail → sendLoginLink()
//   2. Google manda um link; o usuário abre no mesmo aparelho
//   3. o app detecta o link ao carregar → completeLoginFromLink()
//   4. a partir daí getIdToken() devolve o token pras chamadas de API
//
// Config: vem das variáveis VITE_FIREBASE_* (ver docs/BILLING-SETUP.md). Se
// não estiverem definidas, `isAuthConfigured()` é false e o app continua
// funcionando como antes — sem login e sem proteção. É proposital para não
// derrubar quem já usa durante a migração.

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY as string | undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID as string | undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID as string | undefined,
};

export function isAuthConfigured(): boolean {
  return !!(cfg.apiKey && cfg.authDomain && cfg.projectId);
}

/** Carrega o SDK sob demanda — não pesa no bundle de quem nunca faz login. */
async function getAuth() {
  const [{ initializeApp, getApps }, authMod] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ]);
  const app = getApps().length
    ? getApps()[0]
    : initializeApp({
      apiKey: cfg.apiKey!,
      authDomain: cfg.authDomain!,
      projectId: cfg.projectId!,
      appId: cfg.appId,
    });
  return { auth: authMod.getAuth(app), authMod };
}

/**
 * Manda o link de acesso para o e-mail. O e-mail fica guardado localmente
 * porque o Firebase exige confirmá-lo ao completar o login (proteção contra
 * alguém interceptar o link).
 */
export async function sendLoginLink(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!isAuthConfigured()) return { ok: false, error: 'not-configured' };
  try {
    const { auth, authMod } = await getAuth();
    await authMod.sendSignInLinkToEmail(auth, email, {
      url: window.location.origin,
      handleCodeInApp: true,
    });
    localStorage.setItem(STORAGE_KEYS.PENDING_LOGIN_EMAIL, email.trim().toLowerCase());
    return { ok: true };
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[auth] sendLoginLink failed:', err);
    return { ok: false, error: String((err as { code?: string })?.code ?? 'unknown') };
  }
}

/** true se a URL atual é um link de login do Firebase esperando conclusão. */
export async function isPendingLoginLink(): Promise<boolean> {
  if (!isAuthConfigured()) return false;
  try {
    const { auth, authMod } = await getAuth();
    return authMod.isSignInWithEmailLink(auth, window.location.href);
  } catch {
    return false;
  }
}

/** Conclui o login quando o app abre a partir do link do e-mail. */
export async function completeLoginFromLink(): Promise<{ ok: boolean; email?: string; error?: string }> {
  if (!isAuthConfigured()) return { ok: false, error: 'not-configured' };
  try {
    const { auth, authMod } = await getAuth();
    if (!authMod.isSignInWithEmailLink(auth, window.location.href)) {
      return { ok: false, error: 'not-a-link' };
    }
    const email = localStorage.getItem(STORAGE_KEYS.PENDING_LOGIN_EMAIL);
    if (!email) return { ok: false, error: 'missing-email' };

    const result = await authMod.signInWithEmailLink(auth, email, window.location.href);
    localStorage.removeItem(STORAGE_KEYS.PENDING_LOGIN_EMAIL);
    // Limpa os parâmetros do link da barra de endereço.
    window.history.replaceState({}, '', window.location.origin + window.location.pathname);
    return { ok: true, email: result.user.email ?? email };
  } catch (err) {
    if (import.meta.env.DEV) console.warn('[auth] completeLogin failed:', err);
    return { ok: false, error: String((err as { code?: string })?.code ?? 'unknown') };
  }
}

/** E-mail autenticado no momento, ou null. */
export async function getCurrentEmail(): Promise<string | null> {
  if (!isAuthConfigured()) return null;
  try {
    const { auth } = await getAuth();
    return auth.currentUser?.email ?? null;
  } catch {
    return null;
  }
}

/**
 * ID token para mandar nas chamadas de API. Null quando não há login — as
 * rotas do servidor recusam nesse caso (se FIREBASE_PROJECT_ID estiver ligado).
 */
export async function getIdToken(): Promise<string | null> {
  if (!isAuthConfigured()) return null;
  try {
    const { auth } = await getAuth();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/** Cabeçalho Authorization pronto — vazio quando não há login. */
export async function authHeaders(): Promise<Record<string, string>> {
  const token = await getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function signOut(): Promise<void> {
  if (!isAuthConfigured()) return;
  try {
    const { auth, authMod } = await getAuth();
    await authMod.signOut(auth);
  } catch { /* noop */ }
}

// ---------------------------------------------------------------- desktop

interface DesktopAuthBridge {
  isDesktop: true;
  publish(payload: { token: string | null; email?: string | null; expiresAt?: number }): void;
}

/** A ponte só existe quando esta página roda dentro do Electron do desktop. */
function desktopBridge(): DesktopAuthBridge | undefined {
  return (window as unknown as { soulmonDesktopAuth?: DesktopAuthBridge }).soulmonDesktopAuth;
}

/**
 * Repassa o ID token para o app de desktop (overlay na barra de tarefas).
 *
 * O overlay é um processo Electron separado, sem SDK de auth: ele depende
 * deste app para se autenticar (ver desktop/electron/auth-preload.js e
 * docs/PLANO-DESKTOP-STEAM.md, fase 2c). `onIdTokenChanged` cobre login,
 * logout **e** a renovação automática de hora em hora — sem ele o overlay
 * pararia de sincronizar sozinho depois de 1h.
 *
 * No navegador comum não faz absolutamente nada.
 */
export async function startDesktopAuthBridge(): Promise<void> {
  const bridge = desktopBridge();
  if (!bridge || !isAuthConfigured()) return;
  try {
    const { auth, authMod } = await getAuth();
    authMod.onIdTokenChanged(auth, async user => {
      if (!user) {
        bridge.publish({ token: null });
        return;
      }
      try {
        const result = await user.getIdTokenResult();
        bridge.publish({
          token: result.token,
          email: user.email,
          expiresAt: Date.parse(result.expirationTime),
        });
      } catch {
        bridge.publish({ token: null });
      }
    });
  } catch { /* noop */ }
}
