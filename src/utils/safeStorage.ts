// ---------------------------------------------------------------------------
// ACESSO DEFENSIVO AO localStorage
//
// `localStorage` é a única dependência de plataforma que o app trata como se
// fosse memória — e ela não é. Três modos de falha REAIS, todos medidos:
//
//   1. `setItem` lança `QuotaExceededError` quando o storage enche. A origem é
//      COMPARTILHADA com o DigiApp (mesmo `pages.dev`), então o orçamento não é
//      só nosso. Sem try/catch dentro de um efeito do React, isso não é "perda
//      silenciosa": a árvore inteira é desmontada e o usuário vê tela branca.
//   2. `getItem` lança `SecurityError` com storage bloqueado — Safari com
//      "bloquear todos os cookies", modo anônimo de alguns navegadores, WebView
//      com storage desabilitado. O app simplesmente não abre.
//   3. `localStorage` pode nem existir (SSR, worker, teste em ambiente node).
//
// A regra desta camada: **nunca lançar**. Quem não consegue persistir continua
// jogando em memória; o jogo degrada, não cai. E o usuário é avisado UMA vez —
// perder progresso em silêncio é pior do que saber que ele não está sendo
// salvo.
// ---------------------------------------------------------------------------

export type StorageFailureKind = 'read' | 'write' | 'quota';

type Listener = (kind: StorageFailureKind) => void;

let listener: Listener | null = null;
let notified = false;
/**
 * A PRIMEIRA falha costuma acontecer antes de existir quem avise: o provider lê
 * o save dentro do inicializador do `useState`, que roda antes de qualquer
 * efeito. Sem esta fila de um item, justamente o caso mais grave (storage
 * bloqueado no boot) sairia sem aviso nenhum.
 */
let pending: StorageFailureKind | null = null;
/** Evita repetir o mesmo aviso no console a cada render (o efeito roda por estado). */
const warned = new Set<string>();

/**
 * Registra quem avisa o usuário. Só o primeiro evento chega: um storage cheio
 * falha em TODA gravação seguinte, e um toast por gravação seria uma segunda
 * falha em cima da primeira.
 */
export function onStorageDegraded(fn: Listener | null): void {
  listener = fn;
  if (fn && pending !== null) {
    const kind = pending;
    pending = null;
    try {
      fn(kind);
    } catch {
      /* idem */
    }
  }
}

/** Só para teste — o estado de "já avisei" é global de propósito. */
export function resetStorageNotice(): void {
  notified = false;
  pending = null;
  warned.clear();
}

/** `true` depois que o usuário já foi avisado nesta sessão. */
export function storageNoticeSent(): boolean {
  return notified;
}

function isQuota(err: unknown): boolean {
  const name = (err as { name?: string } | null)?.name ?? '';
  const msg = String((err as { message?: string } | null)?.message ?? '');
  return /quota/i.test(name) || /quota/i.test(msg) || name === 'NS_ERROR_DOM_QUOTA_REACHED';
}

function report(kind: StorageFailureKind, key: string, err: unknown): void {
  const tag = `${kind}:${key}`;
  if (!warned.has(tag)) {
    warned.add(tag);
    // Log estruturado: quem estiver depurando às 3h precisa saber QUAL chave,
    // QUE tipo de falha e o nome do erro da plataforma.
    console.warn('[safeStorage] localStorage indisponível', {
      kind,
      key,
      error: (err as { name?: string } | null)?.name ?? String(err),
    });
  }
  if (notified) return;
  notified = true;
  if (!listener) {
    pending = kind;
    return;
  }
  try {
    listener(kind);
  } catch {
    /* um aviso que falha não pode derrubar quem tentou gravar */
  }
}

/** Lê. Devolve `null` em qualquer falha — nunca lança. */
export function readLocal(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null;
  } catch (err) {
    report('read', key, err);
    return null;
  }
}

/** Grava. Devolve `false` quando não deu — nunca lança. */
export function writeLocal(key: string, value: string): boolean {
  try {
    globalThis.localStorage?.setItem(key, value);
    return true;
  } catch (err) {
    report(isQuota(err) ? 'quota' : 'write', key, err);
    return false;
  }
}

/** Apaga. Devolve `false` quando não deu — nunca lança. */
export function removeLocal(key: string): boolean {
  try {
    globalThis.localStorage?.removeItem(key);
    return true;
  } catch (err) {
    report('write', key, err);
    return false;
  }
}

/** Mensagem do aviso ao usuário. Par PT/EN como todo texto de UI. */
export function storageDegradedMessage(
  kind: StorageFailureKind,
  language: 'pt-BR' | 'en-US',
): string {
  const isPt = language === 'pt-BR';
  if (kind === 'quota') {
    return isPt
      ? 'A memória do navegador encheu. O jogo continua funcionando, mas o progresso não está sendo salvo neste aparelho.'
      : 'Browser storage is full. The game keeps running, but progress is not being saved on this device.';
  }
  return isPt
    ? 'Este navegador está bloqueando o armazenamento. Dá para jogar, mas o progresso some ao fechar a aba.'
    : 'This browser is blocking storage. You can play, but progress will be lost when you close the tab.';
}
