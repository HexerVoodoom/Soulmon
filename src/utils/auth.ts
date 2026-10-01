import { Capacitor } from '@capacitor/core';
import { STORAGE_KEYS } from './storageKeys';
import { writeLocal, readLocal, removeLocal } from './safeStorage';

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
 * PERSISTÊNCIA DA SESSÃO — "não refazer login toda vez".
 *
 * O Firebase já usa `browserLocalPersistence` por padrão, mas "por padrão" é
 * exatamente o tipo de coisa que muda numa atualização de SDK sem ninguém
 * notar, e o sintoma seria o pior possível: o jogador perde o acesso ao save
 * a cada abertura. Declarado explicitamente e travado por teste.
 */
async function garantirPersistencia(
  auth: import('firebase/auth').Auth,
  authMod: typeof import('firebase/auth'),
): Promise<void> {
  try {
    await authMod.setPersistence(auth, authMod.browserLocalPersistence);
  } catch {
    /* Aba privada/storage bloqueado: a sessão vira de memória. Melhor logar
       nesta sessão do que recusar o login. */
  }
}

/** Traduz o código do Firebase para algo que a interface possa dizer. */
export type AuthErro =
  | 'email-invalido' | 'senha-fraca' | 'credencial-invalida'
  | 'email-em-uso' | 'nao-encontrado' | 'muitas-tentativas'
  | 'rede' | 'popup-fechado' | 'popup-bloqueado' | 'dominio-nao-autorizado'
  | 'provedor-desligado' | 'desconhecido'
  /**
   * A rede de segurança do pop-up do Google estourou o prazo
   * (`GOOGLE_SEM_RESPOSTA_MS`). **NÃO vem do Firebase** — nenhum `code` mapeia
   * para cá; quem o produz é a interface, quando decide liberar o botão em vez
   * de esperar para sempre. A mensagem tem de servir para os DOIS casos, porque
   * daqui não se sabe qual é: a janela pode ter sido fechada, ou pode estar
   * aberta e a pessoa ainda digitando.
   */
  | 'sem-resposta';

export function traduzErroAuth(code: string): AuthErro {
  switch (code) {
    case 'auth/invalid-email': return 'email-invalido';
    case 'auth/weak-password': return 'senha-fraca';
    // O Firebase moderno colapsa "senha errada" e "usuário inexistente" no
    // mesmo código DE PROPÓSITO: distinguir os dois entrega ao atacante uma
    // sonda de "este e-mail tem conta aqui". Não desfazemos isso na UI.
    case 'auth/wrong-password':
    case 'auth/invalid-credential': return 'credencial-invalida';
    case 'auth/email-already-in-use': return 'email-em-uso';
    case 'auth/user-not-found': return 'nao-encontrado';
    case 'auth/too-many-requests': return 'muitas-tentativas';
    case 'auth/network-request-failed': return 'rede';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request': return 'popup-fechado';
    // O navegador recusou abrir a janela. Não é erro da pessoa, e sobretudo
    // não é "tente de novo em instantes": tentar de novo dá no mesmo. Ganhou
    // código próprio para virar uma saída de verdade — o redirecionamento.
    case 'auth/popup-blocked': return 'popup-bloqueado';
    case 'auth/unauthorized-domain': return 'dominio-nao-autorizado';
    case 'auth/operation-not-allowed': return 'provedor-desligado';
    default: return 'desconhecido';
  }
}

export interface ResultadoAuth { ok: boolean; email?: string; erro?: AuthErro }

/** Entrar com e-mail e senha numa conta que já existe. */
export async function entrarComSenha(email: string, senha: string): Promise<ResultadoAuth> {
  if (!isAuthConfigured()) return { ok: false, erro: 'desconhecido' };
  try {
    const { auth, authMod } = await getAuth();
    await garantirPersistencia(auth, authMod);
    const cred = await authMod.signInWithEmailAndPassword(auth, email.trim().toLowerCase(), senha);
    return { ok: true, email: cred.user.email ?? undefined };
  } catch (err) {
    return { ok: false, erro: traduzErroAuth(String((err as { code?: string })?.code ?? '')) };
  }
}

/** Criar conta nova com e-mail e senha. */
export async function criarContaComSenha(email: string, senha: string): Promise<ResultadoAuth> {
  if (!isAuthConfigured()) return { ok: false, erro: 'desconhecido' };
  try {
    const { auth, authMod } = await getAuth();
    await garantirPersistencia(auth, authMod);
    const cred = await authMod.createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), senha);
    return { ok: true, email: cred.user.email ?? undefined };
  } catch (err) {
    return { ok: false, erro: traduzErroAuth(String((err as { code?: string })?.code ?? '')) };
  }
}

/**
 * Entrar com Google.
 *
 * Não depende de e-mail CHEGAR — e isso importa: o link por e-mail deste
 * projeto cai no spam do Gmail (remetente `firebaseapp.com` sem domínio
 * próprio, verificado em 07/09/2026). Um caminho de entrada que não passa por
 * caixa de entrada é o que garante que dá para entrar no app.
 *
 * NO APK O CAMINHO É OUTRO, e não pode cair no do navegador. Bug do dono
 * (01/10/2026): no APK (Capacitor com `server.url` remoto) o popup/redirect do
 * Firebase web manda a pessoa para `accounts.google.com` FORA do app; depois
 * de escolher a conta o retorno cai em
 * `soulmon-app.firebaseapp.com/__/auth/handler`, que não tem como voltar à
 * WebView — tela BRANCA, sem login. Popup e redirect são fluxos de NAVEGADOR.
 * No aparelho o login é o nativo (`entrarComGoogleNativo`), que devolve só o
 * `idToken` do Google; a sessão continua sendo a do SDK web
 * (`signInWithCredential`), a mesma que o servidor confere.
 */
export async function entrarComGoogle(): Promise<ResultadoAuth> {
  if (!isAuthConfigured()) return { ok: false, erro: 'desconhecido' };
  // No APK o caminho é outro (ver o comentário acima) — e a persistência é
  // garantida lá também, por `garantirPersistencia`, antes do `signInWithCredential`.
  if (Capacitor.isNativePlatform()) return entrarComGoogleNativo();
  // Fora do `try` de proposito: o `catch` precisa deles para poder cair no
  // redirecionamento quando o popup e bloqueado.
  const { auth, authMod } = await getAuth();
  const provider = new authMod.GoogleAuthProvider();
  try {
    await garantirPersistencia(auth, authMod);
    const cred = await authMod.signInWithPopup(auth, provider);
    return { ok: true, email: cred.user.email ?? undefined };
  } catch (err) {
    const code = String((err as { code?: string })?.code ?? '');
    // O CÓDIGO CRU VAI PARA O CONSOLE, sempre — inclusive em produção.
    //
    // Em 07/09/2026 o login com Google falhou com a mensagem genérica ("não
    // deu para entrar agora") e não havia como saber por quê: o `catch`
    // engolia o código e o console ficava limpo. Diagnosticar virou adivinhar
    // entre popup bloqueado, domínio não autorizado e provedor desligado —
    // três causas com correções completamente diferentes. Isto não é ruído:
    // é a única pista que existe quando o login quebra na máquina de alguém.
    console.warn('[auth] entrarComGoogle falhou', { code });

    const erro = traduzErroAuth(code);
    // POPUP BLOQUEADO TEM SAÍDA, e ela não é "tente de novo".
    //
    // Bloqueio de popup é decisão do navegador e não muda tentando outra vez.
    // O redirecionamento faz o mesmo login sem abrir janela nenhuma: a página
    // sai para o Google e volta. `App.tsx` já conclui o login no retorno, pelo
    // mesmo caminho do link de e-mail.
    if (erro === 'popup-bloqueado') {
      try {
        await authMod.signInWithRedirect(auth, provider);
        // A página está saindo; nada depois disto roda.
        return { ok: false, erro: 'popup-bloqueado' };
      } catch {
        /* Se nem o redirect vai, a mensagem do popup bloqueado é a verdade. */
      }
    }
    return { ok: false, erro };
  }
}

/**
 * Login com Google no APK — conta escolhida no seletor NATIVO do Android.
 *
 * O plugin é importado DINAMICAMENTE e só aqui: na web este código nunca roda,
 * e o chunk de entrada não carrega um byte do plugin (o orçamento de bytes lê
 * o `dist/`).
 *
 * Qualquer falha — plugin ausente num APK antigo, `google-services.json` sem o
 * app, SHA do certificado não cadastrada, pessoa cancelou — volta como
 * `{ ok: false }` para o portão mostrar a mensagem. NUNCA cai no popup/redirect
 * do navegador: foi exatamente esse caminho que deixava a tela branca.
 */
async function entrarComGoogleNativo(): Promise<ResultadoAuth> {
  try {
    const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
    const nativo = await FirebaseAuthentication.signInWithGoogle({ skipNativeAuth: true });
    const idToken = nativo.credential?.idToken;
    if (!idToken) throw Object.assign(new Error('sem idToken'), { code: 'nativo/sem-id-token' });
    const { auth, authMod } = await getAuth();
    await garantirPersistencia(auth, authMod);
    const cred = await authMod.signInWithCredential(
      auth,
      authMod.GoogleAuthProvider.credential(idToken),
    );
    return { ok: true, email: cred.user.email ?? undefined };
  } catch (err) {
    const e = err as { code?: string; message?: string };
    const code = String(e?.code ?? '');
    const message = String(e?.message ?? '');
    // Mesmo padrão do caminho web: o código CRU vai para o console, sempre.
    // No nativo o plugin rejeita muitas vezes SEM `code` (só a mensagem do
    // Credential Manager), então a mensagem vai junto.
    console.warn('[auth] entrarComGoogle (nativo) falhou', { code, message });
    // O Credential Manager não tem código para "a pessoa fechou o seletor": a
    // exceção é `GetCredentialCancellationException` e chega só como texto.
    if (!code && /cancel/i.test(message)) return { ok: false, erro: 'popup-fechado' };
    return { ok: false, erro: traduzErroAuth(code) };
  }
}

/**
 * Recuperar senha. SEM isto, senha vira armadilha: quem esquece perde o save,
 * porque o `saveId` é derivado do e-mail e não há outro caminho de volta.
 */
export async function mandarResetDeSenha(email: string): Promise<ResultadoAuth> {
  if (!isAuthConfigured()) return { ok: false, erro: 'desconhecido' };
  try {
    const { auth, authMod } = await getAuth();
    await authMod.sendPasswordResetEmail(auth, email.trim().toLowerCase());
    return { ok: true };
  } catch (err) {
    return { ok: false, erro: traduzErroAuth(String((err as { code?: string })?.code ?? '')) };
  }
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
    // Grava ANTES de mandar o link: sem o e-mail guardado, o retorno cai em
    // `missing-email` e o link vira um beco sem saída. Mesma lição do
    // `adoptCloudSave` — persistir o que o passo seguinte depende, primeiro.
    if (!writeLocal(STORAGE_KEYS.PENDING_LOGIN_EMAIL, email.trim().toLowerCase())) {
      return { ok: false, error: 'storage' };
    }
    await authMod.sendSignInLinkToEmail(auth, email, {
      url: window.location.origin,
      handleCodeInApp: true,
    });
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
    const email = readLocal(STORAGE_KEYS.PENDING_LOGIN_EMAIL);
    if (!email) return { ok: false, error: 'missing-email' };

    const result = await authMod.signInWithEmailLink(auth, email, window.location.href);
    removeLocal(STORAGE_KEYS.PENDING_LOGIN_EMAIL, { silent: true });
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
    // `authStateReady()` NÃO é opcional aqui. O Firebase restaura a sessão de
    // forma ASSÍNCRONA ao carregar a página: logo depois de um reload,
    // `currentUser` ainda é `null` mesmo para quem está perfeitamente logado.
    // Ler direto devolvia "deslogado" para quem acabara de entrar — foi assim
    // que a volta do link de e-mail recomeçava o onboarding do zero
    // (07/09/2026). Quem pergunta cedo demais recebe a resposta errada.
    await auth.authStateReady();
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
    // Mesmo motivo do `getCurrentEmail`: sem esperar a restauração da sessão,
    // toda chamada de API feita logo após o carregamento saía SEM token. Com
    // o servidor em modo estrito (FIREBASE_PROJECT_ID ligado em 07/09/2026)
    // isso vira 401 no primeiro save do dia, e o app trataria como falha de
    // rede.
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  } catch {
    return null;
  }
}

/**
 * Avisa quando o USUÁRIO do Firebase muda (login, logout, outro uid). O primeiro
 * disparo do SDK é o estado inicial restaurado e é ignorado: quem abre o app já
 * consulta depois de `authStateReady()`. Devolve o cancelamento (síncrono, mesmo
 * que o SDK ainda esteja carregando). Sem Firebase configurado: no-op.
 */
export function subscribeAuthState(cb: () => void): () => void {
  if (!isAuthConfigured()) return () => {};
  let off: (() => void) | null = null;
  let cancelled = false;
  void (async () => {
    try {
      const { auth, authMod } = await getAuth();
      if (cancelled) return;
      let first = true;
      let lastUid: string | null | undefined;
      off = authMod.onAuthStateChanged(auth, user => {
        const uid = user?.uid ?? null;
        if (first) { first = false; lastUid = uid; return; }
        if (uid === lastUid) return;
        lastUid = uid;
        cb();
      });
    } catch { /* sem SDK: a consulta de abertura e a de foco continuam valendo */ }
  })();
  return () => { cancelled = true; off?.(); };
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
  // No APK, limpa também o estado do Credential Manager: sem isto a próxima
  // entrada pode reaproveitar a conta anterior sem a pessoa escolher.
  if (Capacitor.isNativePlatform()) {
    try {
      const { FirebaseAuthentication } = await import('@capacitor-firebase/authentication');
      await FirebaseAuthentication.signOut();
    } catch { /* APK sem o plugin: a sessão web já saiu, que é a que vale */ }
  }
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
