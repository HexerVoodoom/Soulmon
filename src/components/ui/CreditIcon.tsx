import { CURRENCY_ART } from '../../assets/soulmon/icones-ui';

/**
 * ÍCONE DOS CRÉDITOS (a moeda comprada com dinheiro de verdade; 18/11/2026, pedido do dono): o diamante turquesa lapidado com a chama
 * da alma (`icones-ui/moeda-creditos.png`, 256², alfa real, pintado no ChatGPT). Substitui o glifo `diamond` nos pontos de Créditos
 * (o glifo `diamond` segue existindo para outros usos). Decorativo por padrão; com `label` vira imagem nomeada.
 */
export function CreditIcon({ size = 20, label, className, style }: { size?: number; label?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={CURRENCY_ART.creditos}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      data-credit-icon=""
      className={className}
      style={{ display: 'inline-block', width: size, height: size, objectFit: 'contain', verticalAlign: 'middle', ...style }}
    />
  );
}
