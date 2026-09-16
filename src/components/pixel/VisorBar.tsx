import type { CSSProperties } from 'react';
import { HUD_ART } from '../../utils/hudArt';

/**
 * Barra segmentada PIXEL, dentro do visor (D3, 15/09/2026): moldura 96×8 do
 * kit + um segmento 6×6 repetido por unidade cheia (meia unidade = segmento
 * de 3 px). A barra DOM da Home (`HomeHud`) é do APARELHO e continua lá — esta
 * é a leitura diegética ao lado do pet. `max` define quantos segmentos cabem
 * (até 14 no trilho de 88 px úteis).
 *
 * **Desenha a 1× e é o `scale` do Viewport que leva a 2×/3×** (canvas Sistema
 * SIS-05, R7): toda medida abaixo é em px LÓGICOS da arte (96×8, 6×6, passo
 * 6) e é multiplicada por `scale` na saída — INTEIRO, o mesmo do `Viewport`
 * que a contém, para a barra ficar na mesma grade de pixel do sprite. Sem o
 * prop ela continua a 1× (compatível com quem já a chamava).
 */
export function VisorBar({ value, max, label, scale = 1, style }: { value: number; max: number; label: string; scale?: number; style?: CSSProperties }) {
  const total = Math.max(1, Math.round(max));
  const safe = Math.min(Math.max(0, value), total);
  const cheios = Math.floor(safe);
  const meio = safe - cheios >= 0.25;
  const passo = Math.min(6, Math.floor(88 / total));
  const s = Math.max(1, Math.round(scale));
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      data-visor-bar
      data-scale={s}
      style={{
        position: 'relative', display: 'block', width: 96 * s, height: 8 * s,
        backgroundImage: `url(${HUD_ART.barFrame})`, backgroundSize: `${96 * s}px ${8 * s}px`, imageRendering: 'pixelated',
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
              position: 'absolute', top: 1 * s, left: (4 + i * passo) * s, width: (metade ? 3 : 6) * s, height: 6 * s,
              backgroundImage: `url(${HUD_ART.barFill})`, backgroundSize: `${6 * s}px ${6 * s}px`, backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
        );
      })}
    </span>
  );
}
