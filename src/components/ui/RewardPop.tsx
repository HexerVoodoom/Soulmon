import type { CSSProperties, ReactNode } from 'react';
import { ROLL_MS, odometerDigits, reelLoops } from '../../utils/rewardReveal';

/**
 * PEÇAS COMPARTILHADAS DA REVELAÇÃO DE RECOMPENSA (dono, 28/10/2026). Quem sequencia é `hooks/useRewardReveal`; o cronograma
 * puro é `utils/rewardReveal.ts`. Aqui só o desenho:
 *
 *  · `RewardPop` — qualquer coisa que NASCE minúscula, passa um pouco do tamanho e assenta (CSS `sm-pop-in`, fim do `index.css`).
 *    `on=false` = ainda não nasceu (invisível, ocupa o lugar: o layout não pula). `still` = sem animação (estado final direto).
 *  · `RewardIcon` — `RewardPop` + `<img>` pixel-art (ícone PELADO, nunca dentro de caixa).
 *  · `RollingCount` — o odômetro de caça-níquel: colunas de dígitos que rolam de 0 ao valor, na fonte de calculadora do pai.
 *    O valor final está SEMPRE no DOM (`sm2-sr-only`); as colunas são enfeite `aria-hidden` e desenham o dígito por CSS
 *    (`::before { content: attr(data-d) }`), então `textContent` não se polui com 0123456789 repetido.
 */
export function RewardPop({ on, still = false, children, style, className, ...rest }: {
  on: boolean; still?: boolean; children: ReactNode; style?: CSSProperties; className?: string;
} & Record<`data-${string}`, string | number | boolean | undefined>) {
  return (
    <span className={`sm-pop${on ? (still ? ' sm-pop--on sm-pop--still' : ' sm-pop--on') : ''}${className ? ` ${className}` : ''}`} style={style} {...rest}>
      {children}
    </span>
  );
}

export function RewardIcon({ src, size = 24, on, still, style, ...rest }: {
  src: string | null | undefined; size?: number; on: boolean; still?: boolean; style?: CSSProperties;
} & Record<`data-${string}`, string | number | boolean | undefined>) {
  return (
    <RewardPop on={on} still={still} style={{ display: 'inline-flex', width: size, height: size, flexShrink: 0, ...style }} {...rest}>
      {src ? <img src={src} alt="" width={size} height={size} style={{ width: size, height: size, objectFit: 'contain', imageRendering: 'pixelated' }} /> : null}
    </RewardPop>
  );
}

/**
 * `run` = pode girar (a linha já estourou); `still` = mostrar o valor final direto (reduzido/pulado/pousado).
 * Antes de `run` as colunas mostram 0 (o contador "começa em zero").
 */
export function RollingCount({ value, sign = '', run, still, durationMs = ROLL_MS }: {
  value: number; sign?: string; run: boolean; still: boolean; durationMs?: number;
}) {
  const final = `${sign}${value}`;
  if (still) return <span data-rolling-count="final">{final}</span>;
  const digits = odometerDigits(value);
  return (
    <>
      <span className="sm2-sr-only" data-rolling-final>{final}</span>
      <span aria-hidden="true" className="sm-reel" data-rolling-count="reel">
        {sign && <span className="sm-reel-cell sm-reel-sign" data-d={sign} />}
        {digits.map((d, i) => {
          const loops = reelLoops(i, digits.length);
          const cells = loops * 10 + d + 1;
          return (
            <span key={i} className="sm-reel-col">
              <span
                className="sm-reel-strip"
                style={{
                  transform: run ? `translateY(-${loops * 10 + d}em)` : 'translateY(0)',
                  transition: run ? `transform ${durationMs}ms cubic-bezier(.12,.7,.2,1)` : 'none',
                }}
              >
                {Array.from({ length: cells }, (_, k) => <span key={k} className="sm-reel-cell" data-d={k % 10} />)}
              </span>
            </span>
          );
        })}
      </span>
    </>
  );
}
