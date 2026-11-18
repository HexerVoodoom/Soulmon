import { forwardRef, type ButtonHTMLAttributes } from 'react';

/**
 * BOTÃO DE MODO (18/11/2026, pedido do dono): os dois tipos de botão que escolhem COMO jogar. `pve` = Aventura / Amistoso (relaxado);
 * `pvp` = PvP / Ranqueada (competitivo). Mesmo método do `BotaoEspecial`: 3-slice por `border-image`, um arquivo por estado
 * (`assets/soulmon/ui/btn-modo-{pve,pvp}{,-press,-off}.webp`). Dono único do visual: `.sm2-modo` em `index.css`.
 * Sem texto na arte: rótulo e subtítulo vêm como `children` / `hint`.
 */
export interface BotaoModoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant: 'pve' | 'pvp';
  /** Linha de apoio sob o rótulo (opcional). */
  hint?: string;
}

export const BotaoModo = forwardRef<HTMLButtonElement, BotaoModoProps>(function BotaoModo(
  { variant, hint, className, type = 'button', children, disabled, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      data-botao-modo={variant}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      className={['sm2-modo', className].filter(Boolean).join(' ')}
      {...rest}
    >
      <span className="sm2-modo-label">{children}</span>
      {hint ? <span className="sm2-modo-hint">{hint}</span> : null}
    </button>
  );
});
