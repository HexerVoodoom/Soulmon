/**
 * "Elemento novo" (15/11/2026, dono): a regra PURA do modal que avisa elementos recém-desbloqueados (por evolução, Feira, luta, qualquer via
 * que cresça `defeatedElements`) e o texto dele. Sem React, sem storage. EN primeiro, PT-BR é localização; tom de convite, nunca cobrança.
 */
import { isLibraryElement } from './elementDex';
import { petElementOf } from './starterElements';
import { curatedComponents } from './elementosCurados';
import { DERIVED_ELEMENT_PAIRS } from './soulProfile/derivedElements';

/** Os ids de `lista` que ainda não foram avisados (`vistos`), na ordem em que entraram no dex, só do catálogo, sem repetir. */
export function elementosNovos(lista: readonly string[] | undefined, vistos: ReadonlySet<string>): string[] {
  const out: string[] = [];
  for (const id of lista ?? []) if (isLibraryElement(id) && !vistos.has(id) && !out.includes(id)) out.push(id);
  return out;
}

/** Mais que isto de uma vez não é descoberta, é save adotado da nuvem: o App absorve em silêncio, sem carrossel de 100 páginas. */
export const ELEMENTO_NOVO_MAX_LOTE = 8;

export const ELEMENTO_NOVO_COPY = {
    close: { en: 'Close', pt: 'Fechar' },
  madeOf: { en: 'made of', pt: 'feito de' },
  newElement: { en: 'New element', pt: 'Novo elemento' },
  seeAllFirst: { en: 'See every card to continue', pt: 'Veja todas as cartas para continuar' },
  prev: { en: 'Previous element', pt: 'Elemento anterior' },
  next: { en: 'Next element', pt: 'Próximo elemento' },
  ok: { en: 'OK', pt: 'OK' },
} as const;

/** "1 de 3" / "1 of 3": o nome acessível de cada página do carrossel. */
export const paginaDeTotal = (i: number, n: number, isPt: boolean): string => (isPt ? `${i + 1} de ${n}` : `${i + 1} of ${n}`);

/**
 * Retroativo (15/11/2026, dono): quem já tem o Soulmon evoluído com um elemento ainda não desbloqueado ganha o desbloqueio E o modal na
 * próxima abertura, uma vez só. Devolve o id do elemento do Soulmon ATUAL que falta no dex (no máximo 1, por isso nunca passa do lote
 * que o App absorve em silêncio). Idempotente por construção: depois do desbloqueio o id está no dex e a função devolve `undefined`.
 */
export function elementoRetroativo<T extends Parameters<typeof petElementOf>[0] & { defeatedElements?: string[] }>(s: T): string | undefined {
  const id = petElementOf(s);
  return id && isLibraryElement(id) && !(s.defeatedElements ?? []).includes(id) ? id : undefined;
}

/** Áreas do Mapa que são ATIVIDADE (luta, run, minijogo): o aviso nunca abre dentro delas (dono, 15/11/2026: a carta só abre no FIM da atividade). */
const AREAS_DE_ATIVIDADE: readonly string[] = ['arena', 'exploracao', 'jogos'];
/** A tela atual é uma atividade em andamento (Arena, Masmorra/Pesadelo/Fenda, Torneio, minijogos)? Mapa, Home e páginas do menu nunca são. */
export const emAtividade = (view: string): boolean => view.startsWith('area:') && AREAS_DE_ATIVIDADE.includes(view.slice(5));
/** A navegação principal (onde o jogador "saiu" de qualquer atividade): Home, Mapa e as páginas do menu. */
const naNavegacaoPrincipal = (view: string): boolean => view === 'home' || view === 'map' || view.startsWith('page:');

/**
 * Gate único "estou numa atividade" (15/11/2026, dono). `descobertoEmAtividade` = o elemento veio de dentro de uma atividade (luta etc.):
 * a carta espera a navegação principal (sair da atividade, não só trocar de sala dentro dela). Evolução e Feira abrem onde o jogador está,
 * desde que ele NÃO esteja dentro de uma atividade.
 */
export function elementoNovoPodeAbrir(descobertoEmAtividade: boolean, view: string): boolean {
  return descobertoEmAtividade ? naNavegacaoPrincipal(view) : !emAtividade(view);
}

/** Os elementos que FORMAM o id (nome e ícone de cada um na fileira da carta). Base = `[]`. Curados (2–4) e derivados (par). */
export function componentesDoElemento(id: string): readonly string[] {
  const curado = curatedComponents(id);
  if (curado) return curado;
  const par = DERIVED_ELEMENT_PAIRS.find(d => d.id === id);
  return par ? par.componentes : [];
}

/** O OK libera quando TODAS as páginas já foram a página atual ao menos uma vez. */
export const todasVistas = (vistas: ReadonlySet<number>, n: number): boolean => vistas.size >= n;
