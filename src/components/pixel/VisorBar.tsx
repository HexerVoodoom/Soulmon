import type { CSSProperties } from 'react';
import { HUD_ART } from '../../utils/hudArt';

/**
 * Barra segmentada PIXEL, dentro do visor (D3, 15/09/2026): moldura 96×8 do
 * kit + um segmento 6×6 repetido por unidade cheia (meia unidade = segmento
 * de 3 px). A barra DOM da Home (`HomeHud`) é do APARELHO e continua lá — esta
 * é a leitura diegética ao lado do pet. `max` define quantos segmentos cabem
 * (até 14 no trilho de 88 px úteis).
 */
export function VisorBar({ value, max, label, style }: { value: number; max: number; label: string; style?: CSSProperties }) {
  const total = Math.max(1, Math.round(max));
  const safe = Math.min(Math.max(0, value), total);
  const cheios = Math.floor(safe);
  const meio = safe - cheios >= 0.25;
  const passo = Math.min(6, Math.floor(88 / total));
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      data-visor-bar
      style={{
        position: 'relative', display: 'block', width: 96, height: 8,
        backgroundImage: `url(${HUD_ART.barFrame})`, backgroundSize: '96px 8px', imageRendering: 'pixelated',
        ...style,
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const cheio = i < cheios, metade = i === cheios && meio;
        if (!cheio && !metade) return null;
        return (
          <span
            key={i}
            style={{
              position: 'absolute', top: 1, left: 4 + i * passo, width: metade ? 3 : 6, height: 6,
              backgroundImage: `url(${HUD_ART.barFill})`, backgroundSize: '6px 6px', backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
        );
      })}
    </span>
  );
}
