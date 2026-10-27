/**
 * ARTE dos 138 rookies de elemento combinado (M10). `import.meta.glob` EAGER devolve só a URL (o Vite emite o PNG como asset,
 * não como código), então o custo no JS é uma string por arquivo; não é preguiçoso porque a onda da masmorra é montada de
 * forma SÍNCRONA (`buildDungeonWave`). Chave = `NNN-slug` (`RosterEntry.artFile`).
 */
const FILES = import.meta.glob('../assets/soulmon/novos-arquivo/combinados/*.png', { eager: true, import: 'default' }) as Record<string, string>;

export const COMBINADOS_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.png$/, ''), url]),
);

const API_FILES = import.meta.glob('../assets/soulmon/inimigos-api/*.png', { eager: true, import: 'default' }) as Record<string, string>;

/** ARTE dos 20 inimigos da API (27/10/2026). Chave = `<id>-<estágio>` (`RosterEntry.artFile`). */
export const INIMIGOS_API_ART: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(API_FILES).map(([path, url]) => [path.slice(path.lastIndexOf('/') + 1).replace(/\.png$/, ''), url]),
);
