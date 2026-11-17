import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

/**
 * MOLDURA DE CARD em 9-slice (PROVISÓRIA, aguarda a arte aprovada pelo dono; `docs/PLANO-MOLDURAS-MODAIS.md`).
 * Vão de arte (`art`) no topo, placa de nome (hexágono dourado), pergaminho de descrição e pílula de recompensa, todos opcionais.
 * Os textos já chegam traduzidos (PT-BR e EN) de quem chama. Dono único do visual: `.sm2-moldura-card` em `index.css`.
 */
export interface CardFrameProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Conteúdo do vão de arte (um `<img>` ou ícone; ícone NUNCA dentro de box extra). */
  art?: ReactNode;
  /** Nome na placa dourada. */
  name?: ReactNode;
  /** Descrição no pergaminho. */
  description?: ReactNode;
  /** Recompensa na pílula (texto + ícone já montados por quem chama). */
  reward?: ReactNode;
}

export const CardFrame = forwardRef<HTMLDivElement, CardFrameProps>(function CardFrame(
  { art, name, description, reward, className, children, ...rest }, ref,
) {
  return (
    <div ref={ref} data-moldura-card="" className={['sm2-moldura-card', className].filter(Boolean).join(' ')} {...rest}>
      <div className="sm2-moldura-card__arte" data-moldura-arte="">{art}</div>
      {name != null && <div className="sm2-moldura-card__nome" data-moldura-nome="">{name}</div>}
      {description != null && <div className="sm2-moldura-card__desc" data-moldura-desc="">{description}</div>}
      {reward != null && <div className="sm2-moldura-card__recompensa" data-moldura-recompensa="">{reward}</div>}
      {children}
    </div>
  );
});
