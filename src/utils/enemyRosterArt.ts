/**
 * ARTE dos 138 rookies de elemento combinado (M10). `import.meta.glob` EAGER devolve só a URL (o Vite emite o PNG como asset,
 * não como código), então o custo no JS é uma string por arquivo; não é preguiçoso porque a onda da masmorra é montada de
 * forma SÍNCRONA (`buildDungeonWave`). Chave = `NNN-slug` (`RosterEntry.artFile`).
 */
import { COMBINADOS_LOTE1_DATA } from './elementosLote1.data';
import { COMBINADOS_LOTE2_DATA } from './elementosLote2.data';

const FILES = import.meta.glob('../assets/soulmon/novos-arquivo/combinados/*.png', { eager: true, import: 'default' }) as Record<string, string>;

const NOVOS_ROOKIE = import.meta.glob('../assets/soulmon/novos/*-rookie.png', { eager: true, import: 'default' }) as Record<string, string>;

const COMBINADOS_PNG: Record<string, string> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.png$/, ''), url]),
);

/** Lote 1 (trios curados) sem PNG próprio: cai para o rookie da criatura base do elemento DOMINANTE (1º componente). PNG próprio vence. */
for (const [num, slug, , dominante] of COMBINADOS_LOTE1_DATA) {
  const key = `${num}-${slug}`;
  const fallback = NOVOS_ROOKIE[`../assets/soulmon/novos/${dominante}-rookie.png`];
  if (!COMBINADOS_PNG[key] && fallback) COMBINADOS_PNG[key] = fallback;
}
/** Lote 2 (trios curados) sem PNG próprio: cai para o rookie da criatura base do elemento DOMINANTE (1º componente). PNG próprio vence. */
for (const [num, slug, , dominante] of COMBINADOS_LOTE2_DATA) {
  const key = `${num}-${slug}`;
  const fallback = NOVOS_ROOKIE[`../assets/soulmon/novos/${dominante}-rookie.png`];
  if (!COMBINADOS_PNG[key] && fallback) COMBINADOS_PNG[key] = fallback;
}

export const COMBINADOS_ART: Readonly<Record<string, string>> = COMBINADOS_PNG;

const API_FILES = import.meta.glob('../assets/soulmon/inimigos-api/*.png', { eager: true, import: 'default' }) as Record<string, string>;

/** ARTE dos 5 inimigos da API "à parte" (27/10/2026). Chave = `<id>-<estágio>` (`RosterEntry.artFile`). */
export const INIMIGOS_API_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(API_FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.png$/, ''), url]),
);
