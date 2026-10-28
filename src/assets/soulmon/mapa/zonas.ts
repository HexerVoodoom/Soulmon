/**
 * Resolvedor da arte das ZONAS do Mapa que o dono ainda vai gerar (#186, 28/10/2026): `zona-forja.png` nesta pasta assume sozinho
 * no lugar da provisória. Glob ESTREITO de propósito (só o nome-alvo), para não empacotar PNG que fica em disco.
 */
const ZONAS_NOVAS = import.meta.glob('./zona-forja.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

export function resolveMapaZona(nome: string, provisoria: string): string {
  return ZONAS_NOVAS[`./${nome}.png`] ?? provisoria;
}
