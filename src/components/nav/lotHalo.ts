/**
 * O HALO PRETO DOS PRÉDIOS (20/10/2026, dono: "usa o mesmo efeito da exploração, um outer glow preto, em todos os prédios;
 * tem alguns que estão sem") — UM ponto só para o filtro da arte de todo lote de todo mapa.
 *
 * Antes cada lugar montava a própria string (AreaScene, MapPage) e só uma sombra solta, que num fundo escuro (Arena,
 * Laboratório, Hall) some. Agora: um contorno preto justo (`0 0 3px`, o "outer glow") + a sombra de chão que já existia.
 * Dois `drop-shadow` num elemento só (a `<img>` do sprite, já composta) — não são filtros por área nem por estado.
 * O lote trancado (`locked`) mantém o cinza e leva o mesmo halo. `LOT_HALO_ACCENT` = halo claro extra de um lote que some
 * no fundo teal (o Caderno).
 */
export const LOT_HALO_BLACK = 'drop-shadow(0 0 3px rgba(0,0,0,.92)) drop-shadow(0 6px 6px rgba(0,0,0,.55))';
export const LOT_HALO_ACCENT = 'drop-shadow(0 0 4px rgba(150,255,238,.85)) drop-shadow(0 0 10px rgba(95,243,224,.45))';
export const LOT_LOCKED_FILTER = 'grayscale(1) brightness(.72)';

/** O `filter` da arte de um lote: [cinza se trancado] [halo claro se for o caso] + o halo preto padrão. */
export function lotArtFilter(opts: { locked?: boolean; accent?: boolean } = {}): string {
  return [opts.locked ? LOT_LOCKED_FILTER : '', !opts.locked && opts.accent ? LOT_HALO_ACCENT : '', LOT_HALO_BLACK].filter(Boolean).join(' ');
}
