import type { ButtonHTMLAttributes } from 'react';

/**
 * Botão principal do jogo (CTA, 12/11/2026, pedido do dono): moldura turquesa escura com borda de cobre, cristal e folhas nas pontas
 * (arte do site do beta, `assets/soulmon/ui/btn-cta.webp`), esticável sem distorcer (9-slice por `border-image`). Dono único do visual:
 * o CSS é `.sm2-cta` em `index.css` (estados pressed/disabled, foco visível, alvo >= 44, movimento reduzido); aqui só a casca.
 * Tamanho do texto vem do token (`--sm2-text-*`), nunca de número. Use nos CTAs PRINCIPAIS; ações secundárias seguem `sm2-kit-btn`.
 */
export interface CtaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** `full` ocupa a linha inteira (padrão); `auto` só o conteúdo (com largura mínima). */
  width?: 'full' | 'auto';
}

export function CtaButton({ width = 'full', className, type = 'button', children, ...rest }: CtaButtonProps) {
  return (
    <button type={type} data-cta-button data-cta-width={width} className={`sm2-cta${className ? ` ${className}` : ''}`} {...rest}>
      <span className="sm2-cta-label">{children}</span>
    </button>
  );
}
