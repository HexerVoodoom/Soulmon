// ---------------------------------------------------------------------------
// ACESSO DEFENSIVO AO localStorage
//
// `localStorage` é a única dependência de plataforma que o app trata como se
// fosse memória — e ela não é. Três modos de falha REAIS, todos medidos:
//
//   1. `setItem` lança `QuotaExceededError` quando o storage enche. A origem é
//      da ORIGEM (⚠️ este comentário dizia "COMPARTILHADA com o DigiApp,
//      mesmo `pages.dev`" — a URL de produção é própria desde a migração, e
//      `localStorage` é por origem), então o orçamento não é
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

/**
 * Opções de gravação.
 *
 * `silent: true` = **a falha é cosmética**. O valor continua sendo registrado no
 * console (quem depura precisa ver), mas NÃO gasta o único aviso ao usuário.
 * O aviso é um recurso escasso de propósito (`notified` é global e só dispara
 * uma vez); se um toggle de tema queimasse esse aviso, a falha que realmente
 * importa — o save, o progresso, a compra — chegaria em silêncio depois.
 *
 * Critério usado na migração:
 *  - **avisa** (padrão): save/estado do jogo, identidade (`SAVE_ID`/`USER_EMAIL`),
 *    progresso e limites que valem dinheiro ou tempo (placares, recordes,
 *    limites diários, inventário, dia perfeito).
 *  - **silent**: preferência cosmética ou de conveniência — tema, idioma, mudo,
 *    dispensar banner, "já mostrei essa dica", horário do sono automático,
 *    rascunho de formulário. Falhar aqui degrada configuração, não progresso.
 */
export interface WriteOptions {
  silent?: boolean;
}

function report(
  kind: StorageFailureKind,
  key: string,
  err: unknown,
  opts?: WriteOptions,
): void {
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
  if (opts?.silent) return;
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
export function writeLocal(key: string, value: string, opts?: WriteOptions): boolean {
  try {
    globalThis.localStorage?.setItem(key, value);
    return true;
  } catch (err) {
    report(isQuota(err) ? 'quota' : 'write', key, err, opts);
    return false;
  }
}

/** Apaga. Devolve `false` quando não deu — nunca lança. */
export function removeLocal(key: string, opts?: WriteOptions): boolean {
  try {
    globalThis.localStorage?.removeItem(key);
    return true;
  } catch (err) {
    report('write', key, err, opts);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Formas derivadas.
//
// Elas existem porque, sem elas, cada call site reimplementaria o try/catch em
// volta do `JSON.parse` — e foi assim que 122 chamadas cruas de `localStorage`
// sobreviveram à criação desta camada: a API só cobria o caso mais simples.
// Se um dia faltar uma forma aqui, ESTENDA — não volte à chamada crua.
// ---------------------------------------------------------------------------

/**
 * Lê JSON. Devolve `fallback` quando não há valor, quando o storage falha **ou
 * quando o conteúdo está corrompido** — nunca lança.
 *
 * JSON inválido NÃO é falha de plataforma: registra no console, mas não gasta o
 * aviso ao usuário (não há nada que ele possa fazer sobre bytes tortos).
 */
export function readJson<T>(key: string, fallback: T): T {
  const raw = readLocal(key);
  if (raw === null) return fallback;
  try {
    const parsed = JSON.parse(raw) as T;
    return parsed === null || parsed === undefined ? fallback : parsed;
  } catch (err) {
    const tag = `parse:${key}`;
    if (!warned.has(tag)) {
      warned.add(tag);
      console.warn('[safeStorage] JSON inválido no localStorage', {
        key,
        error: (err as { name?: string } | null)?.name ?? String(err),
      });
    }
    return fallback;
  }
}

/** Grava JSON. Devolve `false` quando não deu — nunca lança. */
export function writeJson(key: string, value: unknown, opts?: WriteOptions): boolean {
  let raw: string;
  try {
    raw = JSON.stringify(value);
  } catch {
    // Ciclo/BigInt: erro de programação, não de storage. Não vira aviso.
    console.warn('[safeStorage] valor não serializável', { key });
    return false;
  }
  return writeLocal(key, raw, opts);
}

/** Lê um booleano no formato do app (`'true'`/qualquer outra coisa). */
export function readFlag(key: string): boolean {
  return readLocal(key) === 'true';
}

/** Grava um booleano no formato do app. */
export function writeFlag(key: string, on: boolean, opts?: WriteOptions): boolean {
  return writeLocal(key, on ? 'true' : 'false', opts);
}

/** Lê um número. `fallback` quando ausente, ilegível ou não numérico. */
export function readNumber(key: string, fallback = 0): number {
  const raw = readLocal(key);
  if (raw === null || raw.trim() === '') return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
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
