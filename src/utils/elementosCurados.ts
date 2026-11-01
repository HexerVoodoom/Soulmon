/**
 * ELEMENTOS CURADOS NA BIBLIOTECA (01/11/2026, pergunta do dono "os novos elementos e Soulmon foram adicionados na Biblioteca?").
 * Os 50 elementos dos lotes 1–3 (números 212–261, `elementosLote{1,2,3}.data.ts`) já tinham Soulmon no roster (aba Selvagem),
 * mas NÃO estavam no dex de elementos (`elementDex.ts` só conhecia 20 base + 190 derivados). Aqui eles entram no dex da
 * Biblioteca, mais o `neutro` (o corvo, §211). Ficam FORA de `ALL_ELEMENT_IDS` de propósito: aquela lista também é o catálogo
 * da Loja de Essências e da Poção (com espelho no servidor), e esses dois não mudam com esta entrada.
 * Dados puros; o nome sai do slug (o class-system não tem nome PT/EN próprio para eles).
 */
import { COMBINADOS_LOTE1_DATA } from './elementosLote1.data';
import { COMBINADOS_LOTE2_DATA } from './elementosLote2.data';
import { COMBINADOS_LOTE3_DATA } from './elementosLote3.data';

export interface ElementoCurado { num: string; id: string; componentes: readonly string[] }

export const ELEMENTOS_CURADOS: readonly ElementoCurado[] = [...COMBINADOS_LOTE1_DATA, ...COMBINADOS_LOTE2_DATA, ...COMBINADOS_LOTE3_DATA]
  .map(([num, id, , ...componentes]) => ({ num, id, componentes }))
  .sort((a, b) => Number(a.num) - Number(b.num));

/** Os 50 curados (212–261) e, por último, o neutro do corvo. */
export const CURATED_ELEMENT_IDS: readonly string[] = [...ELEMENTOS_CURADOS.map(e => e.id), 'neutro'];

const CURADO = new Map(ELEMENTOS_CURADOS.map(e => [e.id, e]));
export const isCuratedElement = (id: unknown): id is string => typeof id === 'string' && (CURADO.has(id) || id === 'neutro');
export const curatedComponents = (id: string): readonly string[] | undefined => CURADO.get(id)?.componentes;

/** Nome exibido: o slug com espaço e inicial maiúscula (`relampago_seco` → "Relampago seco"); neutro tem nome próprio. */
export function curatedElementName(id: string, isPt: boolean): string {
  if (id === 'neutro') return isPt ? 'Neutro' : 'Neutral';
  const s = id.replace(/_/g, ' ');
  return s.charAt(0).toUpperCase() + s.slice(1);
}
