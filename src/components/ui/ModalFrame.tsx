import { forwardRef, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';

/**
 * MOLDURA DE MODAL em 9-slice (PROVISÓRIA, aguarda a arte aprovada pelo dono; `docs/PLANO-MOLDURAS-MODAIS.md`).
 * Cantos nunca deformam (`border-image`, slice fixo); o fundo é pedra em tile com opacidade configurável. Trocar a arte = trocar os
 * `.webp` em `assets/soulmon/ui/moldura/` (e `--sm2-moldura-*` em `index.css` se o slice mudar). Dono único do visual: `.sm2-moldura-modal`.
 * Placa de título opcional (`title`, serifa dourada) e slot do botão (i) opcional; o conteúdo vai em `children`.
 * Repassa `data-*`/`aria-*`/`className`/`style` ao contêiner, para servir de casca de folhas existentes.
 */
export interface ModalFrameProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Texto da placa de título (já traduzido por quem chama, PT-BR e EN). Sem ele, não há placa. */
  title?: ReactNode;
  /** Botão (i) à direita da placa (ex.: `ModalInfo`/`InfoTip`). */
  info?: ReactNode;
  /** Opacidade da pedra de fundo, 0..1 (padrão 1). */
  fillOpacity?: number;
  /** Ref-callback do encaixe do (i), quando o filho entra por portal (ex.: `useModalInfoSlot`). */
  infoSlotRef?: (el: HTMLElement | null) => void;
  children?: ReactNode;
}

export const ModalFrame = forwardRef<HTMLDivElement, ModalFrameProps>(function ModalFrame(
  { title, info, fillOpacity = 1, infoSlotRef, className, style, children, ...rest }, ref,
) {
  const op = Math.min(1, Math.max(0, fillOpacity));
  const st = { ...style, '--sm2-moldura-fill-op': String(op) } as CSSProperties;
  return (
    <div ref={ref} data-moldura-modal="" className={['sm2-moldura-modal', className].filter(Boolean).join(' ')} style={st} {...rest}>
      {title != null && (
        <div className="sm2-moldura-modal__placa" data-moldura-placa="">
          <h2 className="sm2-moldura-modal__titulo">{title}</h2>
          {(info != null || infoSlotRef) && (
            <span className="sm2-moldura-modal__info" data-moldura-info="" ref={infoSlotRef}>{info}</span>
          )}
        </div>
      )}
      <div className="sm2-moldura-modal__conteudo" data-moldura-conteudo="">{children}</div>
    </div>
  );
});
