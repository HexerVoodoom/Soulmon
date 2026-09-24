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
export function PixelIcon({ name, size, style }: {
  name: UiIconArt;
  size: number;
  style?: CSSProperties;
}) {
  return (
    <img
      src={UI_ICON_ART[name]}
      alt=""
      aria-hidden="true"
      draggable={false}
      data-pixel-icon={name}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain', display: 'block', pointerEvents: 'none', ...style }}
    />
  );
}
