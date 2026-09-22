/**
 * Cliente das rotas de CONTA (`functions/api/account.js`): exportação e
 * exclusão dos dados que o servidor guarda.
 *
 * Este arquivo só TRANSPORTA — o contrato é do servidor e não é redesenhado
 * aqui. Duas coisas dele importam para a UI e por isso viram tipo:
 *
 * 1. **`auth-unavailable` (503) não é falha.** As duas rotas são fail-closed de
 *    propósito: sem login verificado, `delete-confirm` seria "apague a conta de
 *    quem eu souber o e-mail" (o `saveId` é SHA-256 do e-mail, por algoritmo
 *    público). Enquanto o login estiver desligado elas respondem 503. Isso é
 *    um ESTADO do produto, com explicação, e a UI trata como tal — nunca como
 *    erro vermelho, nunca como "tente de novo".
 * 2. **`naoIncluido` viaja junto de tudo.** Quem exporta precisa saber o que
 *    NÃO está no arquivo (psicometria e nascimento nunca saem do aparelho), e
 *    quem apaga precisa saber o que sobrevive. Some do transporte = some da
 *    tela.
 *
 * Os textos do servidor já vêm no par PT-BR + EN; a UI escolhe pelo idioma.
 */

/** Par de idioma como o servidor manda (`COPY`/`NOT_INCLUDED` em account.js). */
export interface Bilingual {
  'pt-BR': string;
  en: string;
}

export interface NotIncludedItem extends Bilingual {
  /** A chave técnica (`soulmon-profile`, `ord:<orderId>`…). */
  what: string;
}

export interface AccountExport {
  format: string;
  generatedAt: string;
  account: { saveId: string; publicId: string };
  aviso: Bilingual;
  data: Record<string, unknown>;
  naoIncluido: NotIncludedItem[];
}

/** O inventário: o coração da tela de exclusão. */
export interface DeletePlan {
  apaga: string[];
  minimiza: string[];
  sobrevive: string[];
}

export interface DeleteRequest {
  confirmToken: string;
  expiresInSeconds: number;
  plano: DeletePlan;
  naoIncluido: NotIncludedItem[];
  aviso: Bilingual;
  prazo: Bilingual;
}

export interface DeleteDone {
  ok: true;
  executado: DeletePlan & { listasDeAmigosLimpas: number };
  naoIncluido: NotIncludedItem[];
  aviso: Bilingual;
}

/**
 * Por que a falha é um UNIÃO fechada e não um `Error`: cada motivo tem uma
 * tela diferente e um texto diferente. Colapsar todos em "deu erro" é
 * exatamente o que faz o 503 virar culpa do usuário.
 */
export type AccountFailure =
  /** 503: a função existe, ainda não está ligada. Não é erro. */
  | { kind: 'unavailable'; aviso?: Bilingual }
  /** 409: token ausente, errado ou vencido (a janela é de 15 min). */
  | { kind: 'expired'; aviso?: Bilingual }
  /** 401/403: o servidor não reconheceu o titular. */
  | { kind: 'denied'; aviso?: Bilingual }
  /** Rede caída, timeout ou resposta ilegível. */
  | { kind: 'network' }
  /** Qualquer outro status. */
  | { kind: 'server'; status: number };

export type AccountResult<T> = { ok: true; value: T } | { ok: false; failure: AccountFailure };

/** A rede é hostil: nenhuma chamada daqui fica pendurada para sempre. */
const TIMEOUT_MS = 15000;

async function call<T>(url: string, init?: RequestInit): Promise<AccountResult<T>> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const { authHeaders } = await import('./auth');
    const res = await fetch(url, {
      ...init,
      signal: ctrl.signal,
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()), ...(init?.headers || {}) },
    });
    const body = await res.json().catch(() => null) as (Partial<T> & { error?: string; aviso?: Bilingual }) | null;
    if (res.ok) {
      if (!body) return { ok: false, failure: { kind: 'network' } };
      return { ok: true, value: body as T };
    }
    if (res.status === 503 || body?.error === 'auth-unavailable') {
      return { ok: false, failure: { kind: 'unavailable', aviso: body?.aviso } };
    }
    if (res.status === 409) return { ok: false, failure: { kind: 'expired', aviso: body?.aviso } };
    if (res.status === 401 || res.status === 403) return { ok: false, failure: { kind: 'denied', aviso: body?.aviso } };
    return { ok: false, failure: { kind: 'server', status: res.status } };
  } catch {
    // AbortError e falha de rede caem no mesmo lugar: para o usuário, os dois
    // são "não chegou". A ação continua disponível para tentar de novo.
    return { ok: false, failure: { kind: 'network' } };
  } finally {
    clearTimeout(timer);
  }
}

export function requestExport(saveId: string): Promise<AccountResult<AccountExport>> {
  return call<AccountExport>(`/api/account?action=export&id=${encodeURIComponent(saveId)}`);
}

export function requestDelete(saveId: string): Promise<AccountResult<DeleteRequest>> {
  return call<DeleteRequest>(`/api/account?action=delete-request&id=${encodeURIComponent(saveId)}`, {
    method: 'POST',
    body: JSON.stringify({}),
  });
}

/**
 * Revoga o push ANTES de apagar a conta (decisão #23 do QA geral, 21/09/2026).
 *
 * O servidor apaga o save, o perfil e o entitlement, mas a inscrição de push
 * (`push:<endpoint>` do Web Push e `fcm:<token>` do Android) só sai pelas rotas
 * `DELETE /api/subscribe` e `DELETE /api/fcm-subscribe` — e o único que sabe
 * o endpoint/token é o aparelho. Sem esta chamada, a conta sumia e o worker
 * das 22h continuava mandando notificação para quem pediu para sair.
 *
 * Quem conhece o endpoint é `notifications.ts` (`unsubscribeFromPush` e
 * `unregisterFromPushNotifications`); chamar as duas em vez de refazer o
 * fetch aqui é o footgun 9 evitado. Import dinâmico pelo mesmo motivo do
 * `./auth` em `call`: `notifications.ts` arrasta o Capacitor, e este módulo
 * é de transporte.
 *
 * Falha de push NÃO bloqueia a exclusão: `allSettled`, e o resultado é
 * devolvido só para diagnóstico — a pessoa pediu para apagar a conta, e um
 * token que não deu para revogar não é motivo para negar isso. O caso pior é
 * uma notificação órfã, que o worker descarta no primeiro 404/410.
 */
export const REVOKE_PUSH_TIMEOUT_MS = 8_000;

export async function revokePushBeforeDelete(timeoutMs = REVOKE_PUSH_TIMEOUT_MS): Promise<{ webPush: boolean; fcm: boolean }> {
  try {
    const { unsubscribeFromPush, unregisterFromPushNotifications } = await import('./notifications');
    // Teto de tempo: um `fetch` DELETE pendurado (rede que não responde, nem
    // falha) segurava `confirmDelete` PARA SEMPRE — a pessoa via o botão de
    // apagar rodando sem fim. Achado do QA (rodada A, 21/09/2026). Estourar o
    // teto conta como falha do push, que já não bloqueia a exclusão.
    const comTeto = <T,>(p: Promise<T>) => new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('push-revoke-timeout')), timeoutMs);
      p.then(v => { clearTimeout(t); resolve(v); }, e => { clearTimeout(t); reject(e); });
    });
    const [web, fcm] = await Promise.allSettled([comTeto(unsubscribeFromPush()), comTeto(unregisterFromPushNotifications())]);
    return { webPush: web.status === 'fulfilled', fcm: fcm.status === 'fulfilled' };
  } catch {
    // O módulo nem carregou (ambiente sem Capacitor, etc.): a exclusão segue.
    return { webPush: false, fcm: false };
  }
}

export async function confirmDelete(saveId: string, confirmToken: string): Promise<AccountResult<DeleteDone>> {
  await revokePushBeforeDelete();
  return call<DeleteDone>(`/api/account?action=delete-confirm&id=${encodeURIComponent(saveId)}`, {
    method: 'POST',
    body: JSON.stringify({ confirmToken }),
  });
}

/**
 * Entrega o arquivo ao usuário. Exportar sem entregar não é exportação.
 * Devolve `false` quando o ambiente não sabe baixar (jsdom, WebView antigo),
 * para a tela dizer isso em vez de fingir que baixou.
 */
export function downloadExport(payload: AccountExport, now = new Date()): boolean {
  if (typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') return false;
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `soulmon-meus-dados-${now.toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
  return true;
}
