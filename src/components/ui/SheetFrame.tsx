import { forwardRef } from 'react';
import { ModalFrame, type ModalFrameProps } from './ModalFrame';

/** Liga/desliga a moldura nas FOLHAS DE BAIXO da Home (`ModalSheet` bottom, Mochila/"Files"). Fácil de desligar. */
export const MOLDURA_HOME_FOLHAS = true;
/** Liga/desliga a moldura nos DIÁLOGOS CENTRADOS da Home (`RitualDialog`, `ModalSheet` com `placement="center"`). */
export const MOLDURA_HOME_DIALOGOS = true;

/**
 * MOLDURA DE FOLHA DE BAIXO (etapa 3 das molduras, 17/11/2026; referência: bottom sheet "Files" da Home). Mesmo método do `ModalFrame`
 * (fatiamento vertical, sem deformar): a haste de cima é o topo da moldura de modal (cantos superiores + cipós + placa de título + (i)) e as
 * laterais descem retas até a borda da tela; NÃO há base (a folha encosta no fundo da tela, onde mora a safe-area). A alça é CSS
 * (provisório: peça própria de alça não existe; ver `.sm2-moldura-sheet::before` em `index.css`). Sem `fundo`, pedra com runas.
 * O quadro é sempre escuro (`data-theme="dark"`): a arte é noturna, então os tokens do miolo seguem o tema escuro mesmo com o app claro.
 */
export const SheetFrame = forwardRef<HTMLDivElement, ModalFrameProps>(function SheetFrame({ className, ...rest }, ref) {
  return <ModalFrame ref={ref} data-moldura-sheet="" data-theme="dark" className={['sm2-moldura-sheet', className].filter(Boolean).join(' ')} {...rest} />;
});
