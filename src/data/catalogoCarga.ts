/**
 * Porta do catálogo de atividades (`activityCatalog.ts`, ~31 KB de copy e
 * evidência) para o código que roda no chunk de ENTRADA.
 *
 * Rodada 6 (04/10/2026, perf): o catálogo saiu do `index-*.js` — só o
 * onboarding/navegador do catálogo e o convite de nível precisam dos itens, e
 * eles carregam por `import()`. O que o caminho CRÍTICO precisa sem esperar:
 *  - `CATALOG_OPT_IN_ONLY_IDS`: a regra de proteção psicológica (item `optInOnly`
 *    pesa 0 na meta do dia — `dailyReset.ts`) tem de valer no 1º render, então
 *    mora aqui, síncrona. `catalogoCarga.contract.test.ts` prova que a lista é
 *    EXATAMENTE os itens `optInOnly: true` do catálogo (o dado não pode derivar).
 *  - `loadCatalog()` / `catalogIfLoaded()`: o índice por id, com cache em módulo.
 *
 * Nunca importe `activityCatalog.ts` estaticamente do caminho crítico
 * (`orcamentoDeBytes.contract.test.ts` cobra o tamanho).
 */
import type { CatalogItem } from '../types/activityCatalog';

/** Ids dos itens `optInOnly` (protocolos de TCC — nunca custam coração). */
export const CATALOG_OPT_IN_ONLY_IDS: ReadonlySet<string> = new Set([
  'mente-registro-pensamentos',
  'mente-exposicao-leve',
]);

let porId: Record<string, CatalogItem> | null = null;
let emVoo: Promise<Record<string, CatalogItem>> | null = null;

/** Carrega o catálogo (uma vez; chamadas concorrentes dividem a mesma promessa). */
export function loadCatalog(): Promise<Record<string, CatalogItem>> {
  if (porId) return Promise.resolve(porId);
  emVoo ??= import('./activityCatalog').then(m => (porId = m.ACTIVITY_CATALOG_BY_ID));
  return emVoo;
}

/** O índice por id, ou `null` enquanto o `import()` não terminou. */
export function catalogIfLoaded(): Record<string, CatalogItem> | null {
  return porId;
}
