import { createContext, forwardRef, useCallback, useContext, useRef, useState, useLayoutEffect, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import { PEDRA_RUNAS_URL } from '../../assets/soulmon/ui/moldura/fundos';
import { ModalInfo, ModalInfoSlotProvider, useModalInfoSlot } from './InfoTip';

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
  /** Informação do modal, atrás do ornamento "i" que a ARTE já traz no canto superior direito (o botão é transparente, ≥ 44 px, exatamente sobre ele).
   *  Atalho declarativo: o mesmo que escrever `<ModalInfo>` em `children`. Qualquer `InfoTip`/`ModalInfo` dentro da moldura se agrupa no MESMO botão do canto
   *  (um painel, uma seção por info); sem nenhuma info o ornamento fica decorativo, sem botão. */
  info?: { label: string; content: ReactNode; language: 'pt-BR' | 'en-US' };
  /** URL do fundo do lote. Sem ela: pedra com runas. */
  fundo?: string;
  /** Opacidade do fundo, 0..1. Padrão 0,15 (fundo do lote) ou 0,6 (pedra com runas). */
  fillOpacity?: number;
  /** `'cristal'`: moldura de POPUP central (fio turquesa + cobre, cristais em 2 cantos, placa de título de bronze). 9-slice por CSS (`.sm2-moldura-modal--cristal`); sem fundo de lote. */
  variante?: 'cristal';
  /** FUNDO VAZIO (24/11/2026, dono): sem pedra/runas nem fundo de lote; só o turquesa escuro LISO (`--sm2-viewport-bg`). Classe `sm2-moldura-modal--vazio` (reutilizável: Nova tarefa, Novo hábito, Missões). Ignora `fundo`. */
  fundoVazio?: boolean;
  children?: ReactNode;
}

/**
 * MIOLO DA MOLDURA (17/11/2026): as sub-folhas (`ModalSheet`: Criar poção, detalhe de item, confirmações...) que abrem de dentro de um modal com
 * moldura NÃO sobem à tela cheia por cima dela — entram neste encaixe, que ocupa só a área útil (entre as peças da moldura, com o mesmo respiro de
 * `--sm2-moldura-pad-*`), abaixo das peças (z 1 × 2) e com rolagem interna. Sem moldura pai o contexto é `null` e o comportamento é o de antes.
 */
const ModalAreaContext = createContext<HTMLElement | null>(null);
export function useModalArea(): HTMLElement | null { return useContext(ModalAreaContext); }

export const ModalFrame = forwardRef<HTMLDivElement, ModalFrameProps>(function ModalFrame(
  { title, info, fundo: fundoProp, fillOpacity, variante, fundoVazio, className, style, children, ...rest }, ref,
) {
  // `--u` (1% da largura) é medido aqui, e NÃO por `container-type`: um contêiner de layout vira o bloco de contenção dos filhos `position: fixed`,
  // e as sub-folhas (ModalSheet, Hexsmith, Criar poção) ficavam presas e cortadas dentro do modal. Sem contenção, elas sobem à tela inteira.
  const own = useRef<HTMLDivElement | null>(null);
  // O encaixe nasce junto com o 1º render (nunca `null` → elemento): uma folha que abre no MESMO quadro que a moldura já entra nele, sem remontar
  // (remontar deixaria o `useDialogA11y` com o nó antigo e o encaixe inertizado). É anexado ao modal em layout effect, antes dos efeitos passivos.
  const [area] = useState<HTMLElement | null>(() => {
    if (typeof document === 'undefined') return null;
    const el = document.createElement('div');
    el.className = 'sm2-moldura-modal__subfolha';
    el.setAttribute('data-moldura-subfolha', '');
    return el;
  });
  const setRef = useCallback((el: HTMLDivElement | null) => {
    own.current = el;
    if (typeof ref === 'function') ref(el); else if (ref) ref.current = el;
  }, [ref]);
  useLayoutEffect(() => {
    const el = own.current;
    if (!el) return;
    if (area) el.appendChild(area);
    const medir = () => { const w = el.getBoundingClientRect().width; if (w > 0) el.style.setProperty('--u', `${w / 100}px`); };
    medir();
    if (typeof ResizeObserver === 'undefined') return () => { area?.remove(); };
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => { ro.disconnect(); area?.remove(); };
  }, [area]);
  const { slot: infoSlot, slotRef: infoSlotRef } = useModalInfoSlot();
  const fundo = fundoVazio ? undefined : fundoProp;
  const op = Math.min(1, Math.max(0, fillOpacity ?? (fundo ? 0.15 : 0.6)));
  const st = {
    ...style,
    '--sm2-moldura-fill-op': String(op),
    '--sm2-moldura-fundo': fundoVazio ? 'none' : fundo ? `url("${fundo}")` : PEDRA_RUNAS_URL ? `url("${PEDRA_RUNAS_URL}")` : 'none',
  } as CSSProperties;
  return (
    <div ref={setRef} data-moldura-modal="" data-moldura-fundo={fundoVazio ? 'vazio' : fundo ? 'lote' : 'pedra'} className={['sm2-moldura-modal', variante === 'cristal' ? 'sm2-moldura-modal--cristal' : fundoVazio ? 'sm2-moldura-modal--vazio' : fundo ? '' : 'sm2-moldura-modal--pedra', className].filter(Boolean).join(' ')} style={st} {...rest}>
      <span className="sm2-moldura-modal__fundo" aria-hidden="true" />
      <span className="sm2-moldura-modal__lado sm2-moldura-modal__lado--e" aria-hidden="true" />
      <span className="sm2-moldura-modal__lado sm2-moldura-modal__lado--d" aria-hidden="true" />
      <span className="sm2-moldura-modal__topo" aria-hidden="true" />
      <span className="sm2-moldura-modal__base" aria-hidden="true" />
      <div className="sm2-moldura-modal__placa" data-moldura-placa="">
        {title != null && <h2 className="sm2-moldura-modal__titulo">{title}</h2>}
      </div>
      {/* O encaixe do botão de informação: EXATAMENTE sobre o ornamento "i" da arte (`--u`). Vazio = não existe (ornamento só decorativo). */}
      <span className="sm2-moldura-modal__info" data-moldura-info="" ref={infoSlotRef} />
      <ModalInfoSlotProvider slot={infoSlot} bare>
        <ModalAreaContext.Provider value={area}>
          <div className="sm2-moldura-modal__conteudo" data-moldura-conteudo="">
            {info && <ModalInfo language={info.language} label={info.label}>{info.content}</ModalInfo>}
            {children}
          </div>
        </ModalAreaContext.Provider>
      </ModalInfoSlotProvider>
    </div>
  );
});
