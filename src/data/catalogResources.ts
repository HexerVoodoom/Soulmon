/**
 * RECURSOS DO JOGO LIGADOS AO CATÁLOGO (beta12 §J, `docs/BACKLOG-BETA12.md`).
 *
 * Mapa LEVE `id do item do catálogo → recurso`, separado de `activityCatalog.ts` de propósito: o catálogo tem os textos longos e vive
 * fora do chunk de entrada (`entradaEnxuta.contract`), e a Home precisa saber o recurso de um hábito sem carregá-lo. Quem manda é o
 * campo `resource` em cada item do catálogo; `catalogResources.contract.test.ts` garante que os dois dizem a mesma coisa (item com
 * recurso sem campo, campo sem entrada aqui ou valor inválido falham). Só se ADICIONA: trocar id quebra hábito já adotado (`catalogId`).
 *
 * Decisões do dono (12/11/2026, Q1–Q9): sono e água NÃO têm link (não há sensor nem contador do jogador); o check automático vale só
 * para hábito ADOTADO; passo nunca pontua sozinho e o check dá o mesmo que o toque manual.
 */
import type { CatalogResource } from '../types/activityCatalog';

export const CATALOG_RESOURCE: Readonly<Record<string, CatalogResource>> = {
  'corpo-caminhar': 'steps',
  'mente-gratidao': 'building:forja.caderno',
  'criatividade-escrita-livre': 'building:forja.caderno',
  'foco-bloco-25min': 'building:forja.oficina',
  'foco-uma-tarefa-por-vez': 'building:forja.oficina',
};

/** O recurso de um hábito (via `catalogId`), ou `undefined` (sem catálogo ou sem link). */
export const resourceOfCatalogId = (catalogId: string | null | undefined): CatalogResource | undefined =>
  catalogId ? CATALOG_RESOURCE[catalogId] : undefined;
