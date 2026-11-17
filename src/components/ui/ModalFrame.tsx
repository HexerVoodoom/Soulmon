import { forwardRef, useCallback, useRef, useLayoutEffect, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { PEDRA_RUNAS_URL } from '../../assets/soulmon/ui/moldura/fundos';

/**
 * MOLDURA DE MODAL (arte aprovada pelo dono, 17/11/2026; `docs/PLANO-MOLDURAS-MODAIS.md`). NÃO é `border-image` nem uma imagem esticada:
 * é FATIAMENTO VERTICAL com largura fixa. O topo (cantos + cipós + placa de título + (i)) e a base (cantos + cipós) são imagens de
 * proporção fixa e as laterais são uma faixa reta de madeira repetida em Y; assim a altura varia à vontade sem deformar os cantos.
 * Por baixo de tudo: base turquesa escura SÓLIDA (`--sm2-viewport-bg`) + o fundo do lote (`fundo`, URL) na opacidade `fillOpacity` (padrão 15%) cobrindo toda a área; sem `fundo`, pedra com runas.
 * A MOLDURA (topo, base, laterais, centro vazado, sem toque) fica POR CIMA e o conteúdo rola por baixo; `--sm2-moldura-pad-t/b/x` é o respiro de quem rola.
 * Dono único do visual: `.sm2-moldura-modal` em `index.css`. O conteúdo vai em `children`; `title` é o texto da placa (serifa dourada).
 * Repassa `data-*`/`aria-*`/`className`/`style`/`ref` ao contêiner, para servir de casca de folhas existentes.
 */
export interface ModalFrameProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /** Texto da placa de título (já traduzido por quem chama, PT-BR e EN). Sem ele, a placa fica vazia. */
  title?: ReactNode;
  /** Botão (i) sobre o disco do canto superior direito (ex.: `ModalInfo`/`InfoTip`). */
  info?: ReactNode;
  /** Ref-callback do encaixe do (i), quando o filho entra por portal (ex.: `useModalInfoSlot`). */
  infoSlotRef?: (el: HTMLElement | null) => void;
  /** URL do fundo do lote. Sem ela: pedra com runas. */
  fundo?: string;
  /** Opacidade do fundo, 0..1. Padrão 0,15 (fundo do lote) ou 0,6 (pedra com runas). */
  fillOpacity?: number;
  children?: ReactNode;
}

export const ModalFrame = forwardRef<HTMLDivElement, ModalFrameProps>(function ModalFrame(
  { title, info, infoSlotRef, fundo, fillOpacity, className, style, children, ...rest }, ref,
) {
  // `--u` (1% da largura) é medido aqui, e NÃO por `container-type`: um contêiner de layout vira o bloco de contenção dos filhos `position: fixed`,
  // e as sub-folhas (ModalSheet, Hexsmith, Criar poção) ficavam presas e cortadas dentro do modal. Sem contenção, elas sobem à tela inteira.
  const own = useRef<HTMLDivElement | null>(null);
  const setRef = useCallback((el: HTMLDivElement | null) => {
    own.current = el;
    if (typeof ref === 'function') ref(el); else if (ref) ref.current = el;
  }, [ref]);
  useLayoutEffect(() => {
    const el = own.current;
    if (!el) return;
    const medir = () => { const w = el.getBoundingClientRect().width; if (w > 0) el.style.setProperty('--u', `${w / 100}px`); };
    medir();
    if (typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const op = Math.min(1, Math.max(0, fillOpacity ?? (fundo ? 0.15 : 0.6)));
  const st = {
    ...style,
    '--sm2-moldura-fill-op': String(op),
    '--sm2-moldura-fundo': fundo ? `url("${fundo}")` : PEDRA_RUNAS_URL ? `url("${PEDRA_RUNAS_URL}")` : 'none',
  } as CSSProperties;
  return (
    <div ref={setRef} data-moldura-modal="" data-moldura-fundo={fundo ? 'lote' : 'pedra'} className={['sm2-moldura-modal', fundo ? '' : 'sm2-moldura-modal--pedra', className].filter(Boolean).join(' ')} style={st} {...rest}>
      <span className="sm2-moldura-modal__fundo" aria-hidden="true" />
      <span className="sm2-moldura-modal__lado sm2-moldura-modal__lado--e" aria-hidden="true" />
      <span className="sm2-moldura-modal__lado sm2-moldura-modal__lado--d" aria-hidden="true" />
      <span className="sm2-moldura-modal__topo" aria-hidden="true" />
      <span className="sm2-moldura-modal__base" aria-hidden="true" />
      <div className="sm2-moldura-modal__placa" data-moldura-placa="">
        {title != null && <h2 className="sm2-moldura-modal__titulo">{title}</h2>}
      </div>
      {(info != null || infoSlotRef) && (
        <span className="sm2-moldura-modal__info" data-moldura-info="" ref={infoSlotRef}>{info}</span>
      )}
      <div className="sm2-moldura-modal__conteudo" data-moldura-conteudo="">{children}</div>
    </div>
  );
});
