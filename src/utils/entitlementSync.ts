/**
 * A CONSULTA DO ENTITLEMENT (e do papel de admin) — quando ela roda de novo.
 *
 * Antes rodava UMA vez por `saveId`. Se o token do Firebase ainda não existia
 * (login concluído depois da consulta, sessão renovada, `saveId` que não muda ao
 * logar de novo) a resposta era 401/403 → `null` → não-admin, e nada refazia a
 * pergunta: o corvinho nunca era adotado naquela sessão.
 *
 * Regras (sem timer recorrente, sem laço):
 *  - `mount`/`auth` sempre consultam; `auth` = o usuário do Firebase mudou;
 *  - `visible` (app voltou ao primeiro plano) consulta no máximo a cada 30 s;
 *  - resposta `null` vinda de `mount`/`auth` agenda UM retry curto (2,5 s);
 *  - resposta que chega depois de uma consulta mais nova é descartada.
 * Segurança inalterada: quem decide é o servidor; aqui só se repassa a resposta.
 */
export const ENTITLEMENT_VISIBLE_MIN_GAP_MS = 30_000;
export const ENTITLEMENT_RETRY_MS = 2_500;

export type EntitlementSyncReason = 'mount' | 'auth' | 'visible';

export interface EntitlementSyncDeps<T> {
  fetch: () => Promise<T | null>;
  /** Recebe cada resposta (inclusive `null`) da consulta MAIS RECENTE. */
  apply: (ent: T | null) => void;
  now?: () => number;
  setTimer?: (fn: () => void, ms: number) => unknown;
  clearTimer?: (h: unknown) => void;
}

export function createEntitlementSync<T>(deps: EntitlementSyncDeps<T>) {
  const now = deps.now ?? Date.now;
  const setTimer = deps.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
  const clearTimer = deps.clearTimer ?? (h => clearTimeout(h as ReturnType<typeof setTimeout>));
  let lastStart = -Infinity;
  let gen = 0;
  let disposed = false;
  let retry: unknown = null;

  const cancelRetry = () => { if (retry !== null) { clearTimer(retry); retry = null; } };

  async function query(canRetry: boolean): Promise<void> {
    const mine = ++gen;
    lastStart = now();
    const ent = await deps.fetch().catch(() => null);
    if (disposed || mine !== gen) return;
    deps.apply(ent);
    if (ent === null && canRetry) {
      cancelRetry();
      retry = setTimer(() => { retry = null; if (!disposed) void query(false); }, ENTITLEMENT_RETRY_MS);
    }
  }

  return {
    run(reason: EntitlementSyncReason): void {
      if (disposed) return;
      if (reason === 'visible' && now() - lastStart < ENTITLEMENT_VISIBLE_MIN_GAP_MS) return;
      cancelRetry();
      void query(reason !== 'visible');
    },
    dispose(): void { disposed = true; cancelRetry(); },
  };
}
