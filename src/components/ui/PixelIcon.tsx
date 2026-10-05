import type { CSSProperties } from 'react';
import { UI_ICON_ART, type UiIconArt } from '../../assets/soulmon/icones-ui';

/**
 * Ícone de UI em pixel art (set do squad de arte, `assets/soulmon/icones-ui`).
 * Decorativo: o nome acessível é SEMPRE do botão que o contém (`aria-label`),
 * então a imagem sai com `alt=""` + `aria-hidden`. Caixa quadrada de `size`
 * px com `object-fit: contain` — a arte não é quadrada e não pode esticar.
 * Sem fundo, sem moldura: a regra "ícone nunca dentro de box" é de quem
 * chama (só os cuidados têm a exceção D1).
 */
export function PixelIcon({ name, src, size, style }: {
  /** Ícone do set `UI_ICON_ART`… */
  name?: UiIconArt;
  /** …ou a URL de uma arte de outro mapa (quest, interação — 04/10/2026). A escala continua a mesma. */
  src?: string;
  size: number;
  style?: CSSProperties;
}) {
  return (
    <img
      src={src ?? (name ? UI_ICON_ART[name] : undefined)}
      alt=""
      aria-hidden="true"
      draggable={false}
      data-pixel-icon={name ?? 'art'}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', pointerEvents: 'none', ...style }}
    />
  );
}
