import { CURRENCY_ART } from '../../assets/soulmon/icones-ui';

/** Ícone da Honra (a "B compacta", `icones-ui/icone-honra-B-compacta-64.png`): par do `CreditIcon` e do `BitsIcon` nas pílulas de moeda. Decorativo por padrão. */
export function HonorIcon({ size = 20, label, className, style }: { size?: number; label?: string; className?: string; style?: React.CSSProperties }) {
  return (
    <img
      src={CURRENCY_ART.emblema}
      width={size}
      height={size}
      alt={label ?? ''}
      aria-hidden={label ? undefined : true}
      draggable={false}
      data-honor-icon=""
      className={className}
      style={{ display: 'inline-block', width: size, height: size, objectFit: 'contain', verticalAlign: 'middle', ...style }}
    />
  );
}
