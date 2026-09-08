/**
 * POPUP BLOQUEADO — a única saída que existe, e ela não tinha teste nenhum.
 *
 * `src/utils/auth.ts` não tinha UM arquivo de teste antes desta sessão de QA.
 * O caminho coberto aqui é o mais caro de todos os que faltavam: bloqueio de
 * popup é decisão do navegador, não muda tentando de novo, e o portão de conta
 * é a PRIMEIRA tela do app — quem não atravessa não usa o Soulmon. Se o
 * `catch` do popup parar de cair no redirecionamento, o sintoma é "não deu para
 * entrar agora" para sempre, e nada fica vermelho.
 *
 * ⚠️ O QUE ESTE TESTE **NÃO** PROVA, e está registrado em `docs/STATUS.md`:
 * que o redirecionamento FUNCIONA no navegador do usuário. O `authDomain` é
 * `soulmon-app.firebaseapp.com` e o app roda em `soulmon.mateus-sprnd.workers.dev`
 * — domínios diferentes. Desde o Firebase JS SDK 9.19 a própria documentação
 * avisa que `signInWithRedirect` deixa de funcionar em navegador que bloqueia
 * armazenamento de terceiros (Chrome, Safari/ITP, Firefox/ETP), a menos que o
 * handler `/__/auth/handler` seja servido pelo domínio do próprio app. Aqui se
 * prova que a CHAMADA acontece; se ela conclui é uma pergunta de infraestrutura.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const signInWithPopup = vi.fn<(a: unknown, b: unknown) => Promise<unknown>>();
const signInWithRedirect = vi.fn<(a: unknown, b: unknown) => Promise<unknown>>();
const setPersistence = vi.fn<(a: unknown, b: unknown) => Promise<void>>(async () => {});

vi.mock('firebase/app', () => ({
  initializeApp: () => ({ name: 'test' }),
  getApps: () => [],
}));

vi.mock('firebase/auth', () => ({
  getAuth: () => ({ name: 'auth' }),
  GoogleAuthProvider: class { addScope() {} },
  signInWithPopup: (a: unknown, b: unknown) => signInWithPopup(a, b),
  signInWithRedirect: (a: unknown, b: unknown) => signInWithRedirect(a, b),
  setPersistence: (a: unknown, b: unknown) => setPersistence(a, b),
  browserLocalPersistence: 'local',
  indexedDBLocalPersistence: 'idb',
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  sendSignInLinkToEmail: vi.fn(),
  isSignInWithEmailLink: () => false,
  signInWithEmailLink: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

vi.stubEnv('VITE_FIREBASE_API_KEY', 'chave-de-teste');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'soulmon-app.firebaseapp.com');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'soulmon-app');

const erro = (code: string) => Object.assign(new Error(code), { code });

describe('entrarComGoogle — quando o navegador bloqueia o popup', () => {
  beforeEach(() => {
    signInWithPopup.mockReset();
    signInWithRedirect.mockReset();
  });

  it('cai no redirecionamento em vez de devolver "tente de novo"', async () => {
    const { entrarComGoogle } = await import('./auth');
    signInWithPopup.mockRejectedValue(erro('auth/popup-blocked'));
    signInWithRedirect.mockResolvedValue(undefined);

    const r = await entrarComGoogle();

    expect(signInWithRedirect).toHaveBeenCalledTimes(1);
    // A página está saindo: o retorno é o motivo, não um sucesso inventado.
    expect(r).toEqual({ ok: false, erro: 'popup-bloqueado' });
  });

  it('se nem o redirecionamento vai, a mensagem do popup bloqueado é a verdade', async () => {
    const { entrarComGoogle } = await import('./auth');
    signInWithPopup.mockRejectedValue(erro('auth/popup-blocked'));
    signInWithRedirect.mockRejectedValue(erro('auth/operation-not-supported'));

    const r = await entrarComGoogle();
    expect(r.ok).toBe(false);
    expect(r.erro).toBe('popup-bloqueado');
  });

  it('fechar o popup na mão NÃO dispara redirecionamento — foi decisão da pessoa', async () => {
    // A diferença importa: bloqueio é o navegador decidindo, e aí a saída é
    // outra porta; fechar a janela é a pessoa desistindo, e arrastá-la para um
    // redirecionamento que ela não pediu seria o app insistindo.
    const { entrarComGoogle } = await import('./auth');
    signInWithPopup.mockRejectedValue(erro('auth/popup-closed-by-user'));

    const r = await entrarComGoogle();
    expect(signInWithRedirect).not.toHaveBeenCalled();
    expect(r.ok).toBe(false);
  });

  it('erro de rede também não vira redirecionamento', async () => {
    const { entrarComGoogle } = await import('./auth');
    signInWithPopup.mockRejectedValue(erro('auth/network-request-failed'));

    const r = await entrarComGoogle();
    expect(signInWithRedirect).not.toHaveBeenCalled();
    expect(r.ok).toBe(false);
  });

  it('o caminho feliz não passa nem perto do redirecionamento', async () => {
    const { entrarComGoogle } = await import('./auth');
    signInWithPopup.mockResolvedValue({ user: { email: 'Alguem@Exemplo.com' } });

    const r = await entrarComGoogle();
    expect(signInWithRedirect).not.toHaveBeenCalled();
    expect(r).toEqual({ ok: true, email: 'Alguem@Exemplo.com' });
  });
});
