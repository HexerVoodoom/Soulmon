import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import cristalUrl from '../../assets/soulmon/ui/cristal-chama.webp';
import { usePrefersReducedMotion } from './Viewport';

export interface CristalChamaProps {
  /** Largura em `u` (1% da largura da moldura/modal, `--u`). Padrão 17. */
  tamanho?: number;
  /** Distância do topo do pai em `u` (negativo = sobe para fora, sobreposto ao encaixe). Padrão -14. */
  topo?: number;
  /** Brilho pulsante da chama. Parado com movimento reduzido e pausado fora da tela. Padrão false. */
  pulsar?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * O CRISTAL-CHAMA turquesa (arte aprovada 18/11/2026): puxador/ornamento de TOPO das molduras e modais.
 * Posição absoluta, topo-centro, sobreposto ao encaixe; o pai precisa ser `position: relative` e definir `--u`.
 * Decorativo (`aria-hidden`, sem `alt`). Só UI/moldura (REGRA-IDENTIDADE-SOULMON): não usar em criatura/FX.
 */
export function CristalChama({ tamanho = 17, topo = -14, pulsar = false, className, style }: CristalChamaProps) {
  const ref = useRef<HTMLImageElement>(null);
  const reduzido = usePrefersReducedMotion();
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    const el = ref.current;
    if (!pulsar || !el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, [pulsar]);

  const vars = { '--cristal-w': tamanho, '--cristal-top': topo, ...style } as CSSProperties;
  return (
    <img
      ref={ref}
      className={['sm2-cristal-chama', className].filter(Boolean).join(' ')}
      src={cristalUrl}
      alt=""
      aria-hidden="true"
      draggable={false}
      data-pulsar={pulsar && !reduzido ? 'true' : undefined}
      data-pausado={pulsar && !visivel ? 'true' : undefined}
      style={vars}
    />
  );
}

export default CristalChama;
