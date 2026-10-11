// ---------------------------------------------------------------------------
// RELATÓRIO DE FALHA — leve, próprio, sem SDK de terceiro.
//
// Par cliente de `functions/api/crash.js` (leia o cabeçalho de lá: o que o
// servidor guarda, o teto, o TTL de 14 dias). Aqui só se FORMA e se ENVIA o
// relatório mínimo:
//
//   kind   boundary (ErrorBoundary) | error (window.onerror) | rejection
//   msg    mensagem do erro, limpa e ≤200
//   stack  stack limpo e ≤800
//   ver    versão do app (`__APP_VERSION__`)
//   route  caminho SEM query/hash/ids
//   plat   apk | web
//
// NUNCA vai: conteúdo do usuário, saveId/e-mail, estado do jogo, user agent.
// Mensagem de erro pode, por acidente, conter texto do usuário
// ("Unexpected token 'x' in "<texto>""): por isso `scrub` limpa e-mail, URL
// (fica só o caminho), token, ids longos e números longos, e o servidor limpa
// DE NOVO — não confia no cliente.
//
// REGRAS DE CONDUTA (mesmo princípio da telemetria — `utils/telemetry.ts`):
//   · FALHA SILENCIOSA: reportar uma falha NUNCA lança outra, nunca é `await`ado,
//     nunca gera toast. O `catch` é o ponto.
//   · MESMO OPT-OUT da telemetria (`isTelemetryEnabled`): quem desligou
//     estatísticas também não manda diagnóstico.
//   · AMOSTRAGEM: `CRASH_SAMPLE_RATE` (1 no beta: 15 testadores, cada falha
//     vale ouro; baixe quando houver volume) + no máximo `MAX_PER_SESSION`
//     envios por sessão e UM por assinatura — um laço de erro não vira
//     tempestade de rede.
// ---------------------------------------------------------------------------

import { isTelemetryEnabled } from './telemetry';

export const CRASH_ENDPOINT = '/api/crash';
/** Fração de falhas reportadas. 1 = todas (beta). */
export const CRASH_SAMPLE_RATE = 1;
export const MAX_PER_SESSION = 5;
export const MAX_MSG = 200;
export const MAX_STACK = 800;
export const MAX_ROUTE = 80;

export type CrashKind = 'boundary' | 'error' | 'rejection';

export interface CrashReport {
  v: 1;
  kind: CrashKind;
  msg: string;
  stack: string;
  ver: string;
  route: string;
  plat: 'apk' | 'web';
}

/** ESPELHA `scrub` de `functions/api/crash.js` (teste de paridade por vetores). */
export function scrub(text: unknown, max: number): string {
  let s = typeof text === 'string' ? text : '';
  s = s
    .replace(/[\w.+-]+@[\w-]+(\.[\w-]+)+/g, '[email]')
    .replace(/\beyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]*/g, '[token]')
    .replace(/\bhttps?:\/\/[^\s/?#)'"]+([^\s?#)'"]*)(\?[^\s#)'"]*)?(#[^\s)'"]*)?/g, '$1')
    .replace(/\b[0-9a-fA-F]{24,}\b/g, '[id]')
    .replace(/\b[A-Za-z0-9_-]{32,}\b/g, '[id]')
    .replace(/\d{7,}/g, '[n]');
  return s.slice(0, max);
}

/** ESPELHA `scrubRoute` de `functions/api/crash.js`. */
export function scrubRoute(route: unknown): string {
  const s = typeof route === 'string' ? route : '';
  const path = s.split(/[?#]/)[0] || '/';
  return path
    .split('/')
    .map(seg => (/^[0-9a-f-]{8,}$/i.test(seg) || /^\d+$/.test(seg) ? ':id' : seg))
    .join('/')
    .slice(0, MAX_ROUTE);
}

function appVersion(): string {
  const v = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '0.0.0-dev';
  return /^[0-9A-Za-z.+-]{1,32}$/.test(v) ? v : '0.0.0-dev';
}

function platform(): 'apk' | 'web' {
  try {
    const cap = (globalThis as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    return cap?.isNativePlatform?.() ? 'apk' : 'web';
  } catch {
    return 'web';
  }
}

/** Texto e stack de qualquer coisa que alguém possa dar `throw`. */
function describe(reason: unknown): { msg: string; stack: string } {
  if (reason instanceof Error) return { msg: reason.message || reason.name, stack: reason.stack ?? '' };
  if (typeof reason === 'string') return { msg: reason, stack: '' };
  try {
    const maybe = reason as { message?: unknown; stack?: unknown } | null;
    if (maybe && typeof maybe.message === 'string') {
      return { msg: maybe.message, stack: typeof maybe.stack === 'string' ? maybe.stack : '' };
    }
  } catch {
    /* objeto hostil (getter que lança): cai no genérico */
  }
  return { msg: 'non-error thrown', stack: '' };
}

/** Monta o relatório. Pura exceto por ler versão/plataforma. `null` = nada a dizer. */
export function buildCrashReport(kind: CrashKind, reason: unknown, route: string): CrashReport | null {
  const { msg, stack } = describe(reason);
  const cleanMsg = scrub(msg, MAX_MSG);
  if (!cleanMsg) return null;
  return {
    v: 1,
    kind,
    msg: cleanMsg,
    stack: scrub(stack, MAX_STACK),
    ver: appVersion(),
    route: scrubRoute(route),
    plat: platform(),
  };
}

/** Ruído que não é falha do app: não vale um relatório. */
export function isNoise(msg: string): boolean {
  return (
    /^ResizeObserver loop/.test(msg) ||
    msg === 'Script error.' || // erro de origem cruzada: sem informação nenhuma
    /^Non-Error promise rejection captured/.test(msg)
  );
}

// ---------------------------------------------------------------------------
// Envio
// ---------------------------------------------------------------------------

const sent = new Set<string>();
let sentThisSession = 0;

/** Só para teste. */
export function resetCrashReporterForTest(): void {
  sent.clear();
  sentThisSession = 0;
}

function currentRoute(): string {
  try {
    return globalThis.location?.pathname ?? '/';
  } catch {
    return '/';
  }
}

/**
 * Reporta uma falha. Nunca lança, nunca devolve promessa para esperar.
 * `random` e `send` existem para teste.
 */
export function reportCrash(
  kind: CrashKind,
  reason: unknown,
  opts: { random?: () => number; send?: (body: string) => void } = {},
): boolean {
  try {
    if (!isTelemetryEnabled()) return false;
    const report = buildCrashReport(kind, reason, currentRoute());
    if (!report || isNoise(report.msg)) return false;
    if (sentThisSession >= MAX_PER_SESSION) return false;
    const signature = `${report.kind}|${report.msg}`;
    if (sent.has(signature)) return false;
    if ((opts.random ?? Math.random)() >= CRASH_SAMPLE_RATE) return false;
    sent.add(signature);
    sentThisSession += 1;
    const body = JSON.stringify(report);
    if (opts.send) opts.send(body);
    else {
      // `keepalive`: o relatório sai mesmo se a página estiver sendo descarregada.
      // Sem credenciais e sem cabeçalho de identidade, de propósito.
      void fetch(CRASH_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true,
        credentials: 'omit',
      }).catch(() => undefined);
    }
    return true;
  } catch {
    return false;
  }
}

let installed = false;

/** Liga `window.onerror` e `unhandledrejection`. Idempotente. */
export function installGlobalCrashHandlers(target: Pick<Window, 'addEventListener'> = window): void {
  if (installed) return;
  installed = true;
  target.addEventListener('error', (e: ErrorEvent) => {
    // Falha de CARREGAR recurso (<img>, <script>) não tem `error`/`message`: ignora.
    if (!e.error && !e.message) return;
    reportCrash('error', e.error ?? e.message);
  });
  target.addEventListener('unhandledrejection', (e: PromiseRejectionEvent) => {
    reportCrash('rejection', e.reason);
  });
}

/** Só para teste. */
export function resetInstalledForTest(): void {
  installed = false;
}
