/**
 * O REDIRECIONAMENTO — o que dá para provar sem navegador, e o que não dá.
 *
 * O dono adiou este teste duas vezes, e com razão: a pergunta central
 * ("`signInWithRedirect` conclui no navegador do usuário?") é de
 * INFRAESTRUTURA e não tem resposta em suíte. O `authDomain` é
 * `soulmon-app.firebaseapp.com` e o app roda em
 * `soulmon.mateus-sprnd.workers.dev` — domínios diferentes —, e desde o
 * Firebase JS SDK 9.19 a própria documentação avisa que o redirect para de
 * funcionar em navegador que bloqueia armazenamento de terceiro (Chrome,
 * Safari/ITP, Firefox/ETP) a menos que `/__/auth/handler` seja servido pelo
 * domínio do app. Isso continua registrado em `docs/STATUS.md` e nenhum caso
 * aqui finge resolvê-lo.
 *
 * O que dá para provar, e não estava provado, é o que o CÓDIGO controla:
 *
 *  1. **A ORDEM.** `signInWithRedirect` SAI DA PÁGINA. Se a persistência não
 *     estiver configurada antes, a sessão não sobrevive à ida e volta e a
 *     pessoa retorna deslogada — sem erro nenhum, porque do ponto de vista do
 *     app "não havia login". `auth.popupBloqueado.test.ts` prova que a chamada
 *     acontece; nada provava que ela acontece DEPOIS da persistência.
 *  2. **Quais códigos NÃO redirecionam.** Redirecionar em
 *     `auth/unauthorized-domain` — que é o erro mais provável dado o
 *     `authDomain` diferente — manda a pessoa para o Google e a traz de volta
 *     para a mesma falha, perdendo o que ela tinha digitado.
 *  3. **O código cru sempre chega ao console.** É a única pista que existe
 *     quando o login quebra na máquina de alguém, e o cabeçalho de `auth.ts`
 *     diz que ela vale inclusive em produção.
 *  4. **Como o login se conclui na volta** — e a consequência disso.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const ordem: string[] = [];

const signInWithPopup = vi.fn<(a: unknown, b: unknown) => Promise<unknown>>();
const signInWithRedirect = vi.fn<(a: unknown, b: unknown) => Promise<unknown>>(async () => {
  ordem.push('redirect');
});
const setPersistence = vi.fn<(a: unknown, b: unknown) => Promise<void>>(async () => {
  ordem.push('persistencia');
});

vi.mock('firebase/app', () => ({ initializeApp: () => ({ name: 'test' }), getApps: () => [] }));
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

beforeEach(() => {
  ordem.length = 0;
  signInWithPopup.mockReset();
  signInWithRedirect.mockReset();
  signInWithRedirect.mockImplementation(async () => { ordem.push('redirect'); });
  setPersistence.mockClear();
});

describe('🔴 a persistência é configurada ANTES de a página sair', () => {
  it('persistência vem primeiro, redirecionamento depois', async () => {
    // Esta é a ordem que faz a sessão sobreviver à ida e volta. Invertê-la não
    // dá erro nenhum: a pessoa volta do Google deslogada, e o app conclui que
    // nunca houve login. É o modo de falha mais difícil de diagnosticar de
    // toda a tela de conta.
    signInWithPopup.mockRejectedValue(erro('auth/popup-blocked'));
    const { entrarComGoogle } = await import('./auth');
    await entrarComGoogle();

    expect(ordem).toEqual(['persistencia', 'redirect']);
  });

  /* ⚠️ Aqui havia um caso de "AUTOVERIFICAÇÃO" que reafirmava a mesma lista.
     Ele era ruído duas vezes: dependia do estado deixado pelo teste ANTERIOR
     (e o `beforeEach` limpa `ordem`, então media `[]`), e não acrescentava
     nada — `toEqual(['persistencia', 'redirect'])` acima já reprova tanto a
     lista vazia quanto a ordem trocada, que são as duas formas de o guard
     mentir. Autoverificação serve quando a SONDA pode estar cega; quando a
     própria asserção é exata, ela é só um segundo teste do mesmo fato. */
});

describe('🔴 quais erros NÃO viram redirecionamento', () => {
  /** Códigos em que sair da página não resolve nada. */
  const NAO_REDIRECIONA = [
    // O mais provável de todos aqui: `authDomain` ≠ domínio do app. Mandar a
    // pessoa ao Google e trazê-la de volta para o MESMO erro custa o que ela
    // digitou e não conserta nada.
    'auth/unauthorized-domain',
    // Provedor desligado no console do Firebase: nenhuma janela ajuda.
    'auth/operation-not-allowed',
    // Decisão da pessoa: fechar o popup não é pedir outra tela.
    'auth/popup-closed-by-user',
    'auth/cancelled-popup-request',
    'auth/network-request-failed',
    'auth/internal-error',
  ];

  it('nenhum deles chama `signInWithRedirect`', async () => {
    const { entrarComGoogle } = await import('./auth');
    for (const code of NAO_REDIRECIONA) {
      signInWithRedirect.mockClear();
      signInWithPopup.mockRejectedValue(erro(code));
      const r = await entrarComGoogle();
      expect(signInWithRedirect, `${code} não pode redirecionar`).not.toHaveBeenCalled();
      expect(r.ok).toBe(false);
    }
  });

  it('e `popup-blocked` chama — senão a lista acima seria vácuo', async () => {
    signInWithRedirect.mockClear();
    signInWithPopup.mockRejectedValue(erro('auth/popup-blocked'));
    const { entrarComGoogle } = await import('./auth');
    await entrarComGoogle();
    expect(signInWithRedirect).toHaveBeenCalledTimes(1);
  });

  it('o redirecionamento recebe o MESMO auth e o MESMO provider do popup', async () => {
    // Provider novo perderia escopo configurado; `auth` diferente escreveria
    // a sessão noutro lugar.
    signInWithPopup.mockRejectedValue(erro('auth/popup-blocked'));
    const { entrarComGoogle } = await import('./auth');
    await entrarComGoogle();

    const [authPopup, provPopup] = signInWithPopup.mock.calls[0];
    const [authRedir, provRedir] = signInWithRedirect.mock.calls[0];
    expect(authRedir).toBe(authPopup);
    expect(provRedir).toBe(provPopup);
  });
});

describe('🔴 o código cru sempre chega ao console', () => {
  it('todo código de erro é registrado — é a única pista quando quebra na máquina de alguém', async () => {
    // O cabeçalho de `auth.ts` conta a história: em 07/09/2026 o login falhou
    // com mensagem genérica e o console ficou LIMPO, então diagnosticar virou
    // adivinhar entre popup bloqueado, domínio não autorizado e provedor
    // desligado — três causas com correções completamente diferentes.
    const espiao = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      const { entrarComGoogle } = await import('./auth');
      for (const code of ['auth/unauthorized-domain', 'auth/popup-blocked', 'auth/internal-error']) {
        espiao.mockClear();
        signInWithPopup.mockRejectedValue(erro(code));
        await entrarComGoogle();
        const registrado = espiao.mock.calls.flat(2).map(String).join(' ')
          + JSON.stringify(espiao.mock.calls);
        expect(registrado, `o código ${code} não chegou ao console`).toContain(code);
      }
    } finally {
      espiao.mockRestore();
    }
  });
});

describe('como o login se conclui na VOLTA do redirecionamento', () => {
  it('⚠️ o app NÃO usa `getRedirectResult` — e isso tem consequência', async () => {
    /* Congelando o fato, com o custo escrito.
     *
     * A volta funciona porque `getCurrentEmail()` espera `authStateReady()`
     * (ver `auth.sessao.test.ts`) e o Firebase restaura a sessão do IndexedDB.
     * Isso cobre o caminho FELIZ.
     *
     * O que não cobre: um redirecionamento que FALHA do lado do Google (a
     * pessoa cancela na tela dele, o domínio é recusado lá) traz a pessoa de
     * volta sem sessão e **sem mensagem nenhuma** — ela reencontra o portão de
     * conta como se nada tivesse acontecido. `getRedirectResult` é o que
     * exporia esse erro.
     *
     * Não foi acrescentado nesta sessão de propósito: é mudança de
     * comportamento no caminho de autenticação, que não dá para verificar em
     * suíte nem no servidor de desenvolvimento (o redirect exige o handler do
     * Firebase). Fica endereçado ao dono em `docs/STATUS.md`; este caso existe
     * para a decisão não se perder, e para quem acrescentar `getRedirectResult`
     * ver o teste falhar e ler este texto. */
    const { readFileSync } = await import('node:fs');
    const { join, resolve } = await import('node:path');
    const src = readFileSync(join(resolve(__dirname, '..'), 'utils/auth.ts'), 'utf8');
    expect(
      src.includes('getRedirectResult'),
      'alguém acrescentou `getRedirectResult`: ótimo — atualize este caso e o docs/STATUS.md, e conte o que passou a ser mostrado quando o redirect falha.',
    ).toBe(false);

    // E a peça em que a volta REALMENTE se apoia continua no lugar.
    expect(src).toContain('authStateReady');
  });
});
