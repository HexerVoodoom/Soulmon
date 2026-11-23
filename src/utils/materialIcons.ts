/**
 * Ícones de MATERIAL em imagem (12/11/2026): slots em `src/assets/soulmon/icons/materiais/<id>.(webp|png)`, resolvidos por
 * `import.meta.glob`. Sem arquivo, vale o emoji de `MATERIALS` (nada quebra). Lista a gerar: `docs/ASSETS-A-GERAR.md` (1ª seção).
 */
const FILES = import.meta.glob('../assets/soulmon/icons/materiais/*.{webp,png}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

const BY_ID: Record<string, string> = {};
for (const [path, url] of Object.entries(FILES)) {
  const id = path.split('/').pop()!.replace(/\.(webp|png)$/, '');
  // .webp ganha do .png quando os dois existem.
  if (!BY_ID[id] || path.endsWith('.webp')) BY_ID[id] = url;
}

/** URL da imagem do material, ou `undefined` (então usa-se o emoji). */
export const materialIconSrc = (id: string): string | undefined => BY_ID[id];
