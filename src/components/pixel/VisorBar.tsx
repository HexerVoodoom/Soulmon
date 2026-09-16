import type { CSSProperties } from 'react';
import { HUD_ART } from '../../utils/hudArt';

/**
 * Barra segmentada PIXEL, dentro do visor (D3, 15/09/2026): moldura do kit +
 * um segmento 6×6 por unidade cheia (meia unidade = segmento de 3 px). É a
 * ÚNICA leitura de HP/energia da Home desde 16/09/2026 (a barra DOM do
 * `HomeHud` saiu — canvas Home, achado 1 / DECISÕES §19).
 *
 * **A MOLDURA É RECORTADA AO `max`** (canvas Home, D-H2 / X4 — confirmado
 * pelo crítico: "Tamagotchi mostra `max` corações, nunca um trilho maior que
 * o máximo"; com a moldura fixa de 96, HP 3/3 lia como "⅓ cheio"). Fórmula
 * ÚNICA, a 1×, e é a mesma do README, do rodapé do `Main` e do CSS do canvas:
 *
 *     largura = cap 6 + 7·max + cap 6
 *     segmento i em `left = 6 + 7·i`, largura 6 (meio = 3), `top = 1`
 *
 * A moldura é FATIADA do `bar-frame-96x8`: a arte ancorada à esquerda até
 * `w − 6` (cap + trilho reais) e o cap direito (6 px) da ponta direita —
 * transição declarada: o PNG é sombreado (495 cores), então a costura do cap
 * direito não casa perfeitamente com o trilho. `max` ≤ 12 cabe nos 96. A
 * `squad-arte` entrega `bar-cap-l-6x8` / `bar-mid-1x8` /
 * `bar-cap-r-6x8` em grade limpa; quando chegarem, só `hudArt.ts` e as duas
 * `backgroundImage` abaixo mudam — a fórmula fica.
 *
 * **Desenha a 1× e é o `scale` do Viewport que leva a 2×/3×** (canvas Sistema
 * SIS-05, R7): toda medida é em px LÓGICOS e multiplicada por `scale` na
 * saída — INTEIRO, o mesmo do `Viewport` que a contém, para a barra ficar na
 * mesma grade de pixel do sprite. Sem o prop ela continua a 1×.
 */
export const VISOR_BAR_CAP = 6;
export const VISOR_BAR_STEP = 7;
export const VISOR_BAR_SEG = 6;
const FRAME_W = 96;
const FRAME_H = 8;

/** Largura lógica (1×) da barra para um `max`. */
export function visorBarWidth(max: number): number {
  const total = Math.max(1, Math.round(max));
  return VISOR_BAR_CAP + VISOR_BAR_STEP * total + VISOR_BAR_CAP;
}

export function VisorBar({ value, max, label, scale = 1, style }: { value: number; max: number; label: string; scale?: number; style?: CSSProperties }) {
  const total = Math.max(1, Math.round(max));
  const safe = Math.min(Math.max(0, value), total);
  const cheios = Math.floor(safe);
  const meio = safe - cheios >= 0.25;
  const s = Math.max(1, Math.round(scale));
  const w = visorBarWidth(total);
  const frame: CSSProperties = {
    position: 'absolute', top: 0, bottom: 0,
    backgroundImage: `url(${HUD_ART.barFrame})`,
    backgroundSize: `${FRAME_W * s}px ${FRAME_H * s}px`,
    imageRendering: 'pixelated',
  };
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
        position: 'relative', display: 'block', width: w * s, height: FRAME_H * s,
        imageRendering: 'pixelated',
        ...style,
      }}
    >
      {/* A moldura recortada ao `max`, como o canvas desenha: a arte
          ancorada à ESQUERDA até `w − cap` (cap esquerdo + trilho, os pixels
          reais do PNG) e o cap DIREITO fatiado da ponta direita. Uma coluna
          repetida ficava diferente do trilho desenhado (a arte é sombreada). */}
      <span aria-hidden="true" data-visor-cap="l" style={{ ...frame, left: 0, right: VISOR_BAR_CAP * s, backgroundPosition: '0 0', backgroundRepeat: 'no-repeat' }} />
      <span aria-hidden="true" data-visor-cap="r" style={{ ...frame, right: 0, width: VISOR_BAR_CAP * s, backgroundPosition: '100% 0', backgroundRepeat: 'no-repeat' }} />
      {Array.from({ length: total }, (_, i) => {
        const cheio = i < cheios, metade = i === cheios && meio;
        if (!cheio && !metade) return null;
        return (
          <span
            key={i}
            data-visor-seg
            style={{
              position: 'absolute', top: 1 * s, left: (VISOR_BAR_CAP + i * VISOR_BAR_STEP) * s, width: (metade ? VISOR_BAR_SEG / 2 : VISOR_BAR_SEG) * s, height: VISOR_BAR_SEG * s,
              backgroundImage: `url(${HUD_ART.barFill})`, backgroundSize: `${VISOR_BAR_SEG * s}px ${VISOR_BAR_SEG * s}px`, backgroundRepeat: 'no-repeat',
              imageRendering: 'pixelated',
            }}
          />
        );
      })}
    </span>
  );
}
