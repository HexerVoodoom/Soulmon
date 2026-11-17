import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';

/**
 * MOLDURA DE CARD (arte aprovada pelo dono, 17/11/2026; `docs/PLANO-MOLDURAS-MODAIS.md`). Mesmo método do `ModalFrame`: FATIAMENTO VERTICAL de
 * largura fixa. O topo (cantos com gema + cipós) e a base (cipós + placa de nome + pergaminho, opacos) são imagens de proporção fixa; as
 * laterais de pedra repetem em Y; o vão da arte é transparente e cresce com a altura. Os textos já chegam traduzidos (PT-BR e EN).
 * Dono único do visual: `.sm2-moldura-card` em `index.css`. A pílula de recompensa é CSS (a arte dela não veio com a moldura final).
 */
export interface CardFrameProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Conteúdo do vão de arte (um `<img>` ou ícone; ícone NUNCA dentro de box extra). */
  art?: ReactNode;
  /** Nome na placa dourada. */
  name?: ReactNode;
  /** Descrição no pergaminho. */
  description?: ReactNode;
  /** Recompensa na pílula, sobre a base do vão da arte (texto + ícone já montados por quem chama). */
  reward?: ReactNode;
}

export const CardFrame = forwardRef<HTMLDivElement, CardFrameProps>(function CardFrame(
  { art, name, description, reward, className, children, ...rest }, ref,
) {
  return (
    <div ref={ref} data-moldura-card="" className={['sm2-moldura-card', className].filter(Boolean).join(' ')} {...rest}>
      <span className="sm2-moldura-card__lado sm2-moldura-card__lado--e" aria-hidden="true" />
      <span className="sm2-moldura-card__lado sm2-moldura-card__lado--d" aria-hidden="true" />
      <div className="sm2-moldura-card__arte" data-moldura-arte="">{art}</div>
      <span className="sm2-moldura-card__topo" aria-hidden="true" />
      <span className="sm2-moldura-card__base" aria-hidden="true" />
      {reward != null && <div className="sm2-moldura-card__recompensa" data-moldura-recompensa="">{reward}</div>}
      {name != null && <div className="sm2-moldura-card__nome" data-moldura-nome="">{name}</div>}
      {description != null && <div className="sm2-moldura-card__desc" data-moldura-desc="">{description}</div>}
      {children}
    </div>
  );
});
