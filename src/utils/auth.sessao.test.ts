/**
 * A SESSÃO RESTAURADA — o bug de produção que duas linhas consertaram e nada
 * vigiava.
 *
 * O Firebase restaura a sessão do IndexedDB de forma ASSÍNCRONA ao carregar a
 * página: logo depois de um reload, `auth.currentUser` ainda é `null` mesmo
 * para quem está perfeitamente logado. `getCurrentEmail` e `getIdToken` liam
 * direto, e o resultado (07/09/2026, em produção) foi:
 *
 *  · a volta do link de e-mail recomeçava o onboarding do zero, porque o app
 *    perguntava "quem está logado?" antes de o Firebase saber a resposta;
 *  · toda chamada de API feita logo após o carregamento saía SEM token —
 *    com o servidor em modo estrito isso é 401 no primeiro save do dia, e o
 *    app trata como falha de rede.
 *
 * A correção foi `await auth.authStateReady()` nos dois. Um `await` some numa
 * refatoração sem deixar rastro, e o sintoma reaparece longe daqui — por isso
 * o teste força a ORDEM: `currentUser` só existe DEPOIS que a promessa
 * resolve, então ler cedo devolve `null` e o caso fica vermelho.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

/** O estado do "Firebase": `currentUser` só aparece quando a restauração
 *  termina — exatamente como no navegador. */
const fake = {
  restaurado: false,
  usuario: { email: 'dono@exemplo.com', getIdToken: async () => 'token-de-verdade' },
  chamadasDeReady: 0,
};

const auth = {
  get currentUser() { return fake.restaurado ? fake.usuario : null; },
  authStateReady: async () => {
    fake.chamadasDeReady++;
    // Cede o controle ao menos uma vez: quem não esperar lê `null`.
    await Promise.resolve();
    fake.restaurado = true;
  },
};

vi.mock('firebase/app', () => ({ initializeApp: () => ({}), getApps: () => [] }));
vi.mock('firebase/auth', () => ({
  getAuth: () => auth,
  setPersistence: async () => {},
  browserLocalPersistence: 'local',
  indexedDBLocalPersistence: 'idb',
  GoogleAuthProvider: class {},
  signInWithPopup: vi.fn(), signInWithRedirect: vi.fn(),
  signInWithEmailAndPassword: vi.fn(), createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(), sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: () => false, signInWithEmailLink: vi.fn(),
  signOut: vi.fn(), onAuthStateChanged: vi.fn(),
}));

vi.stubEnv('VITE_FIREBASE_API_KEY', 'chave');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'soulmon-app.firebaseapp.com');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'soulmon-app');

beforeEach(() => { fake.restaurado = false; fake.chamadasDeReady = 0; });

describe('🔴 ninguém pergunta o estado de auth antes de o Firebase saber', () => {
  it('`getCurrentEmail` espera a restauração — senão devolve "deslogado"', async () => {
    const { getCurrentEmail } = await import('./auth');
    expect(await getCurrentEmail()).toBe('dono@exemplo.com');
    expect(fake.chamadasDeReady).toBeGreaterThan(0);
  });

  it('`getIdToken` espera a restauração — senão a API sai sem token', async () => {
    const { getIdToken } = await import('./auth');
    expect(await getIdToken()).toBe('token-de-verdade');
    expect(fake.chamadasDeReady).toBeGreaterThan(0);
  });

  it('deslogado de verdade continua sendo null nos dois', async () => {
    const { getCurrentEmail, getIdToken } = await import('./auth');
    const usuario = fake.usuario;
    // @ts-expect-error — simula "não há ninguém logado" depois da restauração
    fake.usuario = null;
    try {
      expect(await getCurrentEmail()).toBeNull();
      expect(await getIdToken()).toBeNull();
    } finally {
      fake.usuario = usuario;
    }
  });
});

describe('sem configuração de Firebase, nada explode', () => {
  it('as duas devolvem null em vez de lançar — é o build de contribuidor', async () => {
    vi.stubEnv('VITE_FIREBASE_API_KEY', '');
    vi.resetModules();
    const { getCurrentEmail, getIdToken } = await import('./auth');
    expect(await getCurrentEmail()).toBeNull();
    expect(await getIdToken()).toBeNull();
    // E nem tentou falar com o Firebase.
    expect(fake.chamadasDeReady).toBe(0);
    vi.stubEnv('VITE_FIREBASE_API_KEY', 'chave');
    vi.resetModules();
  });
});
