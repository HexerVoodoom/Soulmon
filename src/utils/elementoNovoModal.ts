/**
 * "Elemento novo" (15/11/2026, dono): a regra PURA do modal que avisa elementos recém-desbloqueados (por evolução, Feira, luta, qualquer via
 * que cresça `defeatedElements`) e o texto dele. Sem React, sem storage. EN primeiro, PT-BR é localização; tom de convite, nunca cobrança.
 */
import { isLibraryElement } from './elementDex';

/** Os ids de `lista` que ainda não foram avisados (`vistos`), na ordem em que entraram no dex, só do catálogo, sem repetir. */
export function elementosNovos(lista: readonly string[] | undefined, vistos: ReadonlySet<string>): string[] {
  const out: string[] = [];
  for (const id of lista ?? []) if (isLibraryElement(id) && !vistos.has(id) && !out.includes(id)) out.push(id);
  return out;
}

/** Mais que isto de uma vez não é descoberta, é save adotado da nuvem: o App absorve em silêncio, sem carrossel de 100 páginas. */
export const ELEMENTO_NOVO_MAX_LOTE = 8;

export const ELEMENTO_NOVO_COPY = {
  title: { en: 'New element', pt: 'Elemento novo' },
  /** Convite curto: o que o desbloqueio abre (a poção do elemento, no Laboratório). */
  invite: { en: 'You can now craft its potion in the Lab, whenever you like.', pt: 'Agora você pode criar a poção desse elemento no Laboratório, quando quiser.' },
  prev: { en: 'Previous element', pt: 'Elemento anterior' },
  next: { en: 'Next element', pt: 'Próximo elemento' },
  ok: { en: 'OK', pt: 'OK' },
} as const;

/** "1 de 3" / "1 of 3": o nome acessível de cada página do carrossel. */
export const paginaDeTotal = (i: number, n: number, isPt: boolean): string => (isPt ? `${i + 1} de ${n}` : `${i + 1} of ${n}`);
