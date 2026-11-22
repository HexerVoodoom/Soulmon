import { fundoDaTela, type TelaMoldura as TelaId } from '../../assets/soulmon/ui/moldura/fundos';

/** Liga/desliga a moldura das telas cheias (Fenda, Calabouço, mapa do Soulsmith, Arena livre). Fácil de desligar. */
export const MOLDURA_TELAS = true;

/**
 * FUNDO + MOLDURA das telas cheias (arte aprovada, 17/11/2026): a mesma moldura do `ModalFrame` (fatiamento vertical), mas só como DECORAÇÃO
 * (`position: fixed`, `pointer-events: none`) para ser solta dentro da raiz de cada tela sem mudar o layout dela. O fundo vai por baixo do
 * conteúdo (15%) e a moldura por cima. Cada raiz decide o espaço: `GameRoot` já soma o respiro (`moldura`), as demais telas têm o próprio HUD.
 */
export function TelaMoldura({ tela, title, infoSlotRef }: { tela: TelaId; title?: string; /** Encaixe do botão de informação, sobre o ornamento "i" da arte (ver `ModalInfoSlotProvider`). */ infoSlotRef?: (el: HTMLElement | null) => void }) {
  if (!MOLDURA_TELAS) return null;
  const fundo = fundoDaTela(tela);
  return (
    <span data-tela-moldura={tela} className="sm2-moldura-modal sm2-moldura-tela" style={{ ['--sm2-moldura-fundo' as string]: fundo ? `url("${fundo}")` : 'none', ['--sm2-moldura-fill-op' as string]: '0.15' }}>
      <span aria-hidden="true" className="sm2-moldura-modal__fundo" />
      <span aria-hidden="true" className="sm2-moldura-modal__lado sm2-moldura-modal__lado--e" />
      <span aria-hidden="true" className="sm2-moldura-modal__lado sm2-moldura-modal__lado--d" />
      <span aria-hidden="true" className="sm2-moldura-modal__topo" />
      <span aria-hidden="true" className="sm2-moldura-modal__base" />
      {infoSlotRef && <span className="sm2-moldura-modal__info" data-moldura-info="" ref={infoSlotRef} />}
      {title != null && <span aria-hidden="true" className="sm2-moldura-modal__placa"><span className="sm2-moldura-modal__titulo">{title}</span></span>}
    </span>
  );
}
