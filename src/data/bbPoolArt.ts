// Arte do pool de BBs (D30): chave do arquivo (`bb-<elemento>-01`) -> URL. Glob eager na fronteira,
// como `lineFullArt.ts`; `bbPool.ts` continua puro. O build converte PNG -> WebP.
const modules = import.meta.glob('../assets/soulmon/bb/*.png', { eager: true, import: 'default' }) as Record<string, string>;

export const BB_POOL_ART: Record<string, string> = {};
for (const [path, url] of Object.entries(modules)) {
  const m = /\/(bb-[a-z_]+-\d+)\.png$/.exec(path);
  if (m) BB_POOL_ART[m[1]] = url;
}
