import type { HTMLAttributes, ReactNode } from 'react';
import barra1x from '../../assets/soulmon/evo/barra-evolucao-B.png';
import barra2x from '../../assets/soulmon/evo/barra-evolucao-B@2x.png';

/**
 * A BARRA de evolução (arte B do dono, 24/11/2026): a moldura de cobre em PNG (480×128, @2x 960×256) e o preenchimento DESENHADO EM CÓDIGO
 * dentro do canal (medido no PNG: x 19–456, y 58–68). Uma só para todas as barras de evolução (fragmentos do Centro de Evolução e recap).
 * Dimensiona por LARGURA do contêiner (`aspect-ratio` 480/128), sem largura fixa. Quem chama passa `role="progressbar"` e os `aria-*`
 * (o componente os repassa ao contêiner) e põe o preenchimento em `children` (posição absoluta dentro do canal).
 * Dono do CSS: `.sm2-evo-barra*` em `index.css`.
 */
export function EvoBar({ children, className, ...rest }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={className ? `sm2-evo-barra ${className}` : 'sm2-evo-barra'} {...rest}>
      <img src={barra1x} srcSet={`${barra1x} 1x, ${barra2x} 2x`} alt="" aria-hidden="true" data-evo-barra-moldura className="sm2-evo-barra__moldura" />
      <div aria-hidden="true" className="sm2-evo-barra__canal">{children}</div>
    </div>
  );
}
