import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Language } from '../utils/i18n';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { ModalFrame } from './ui/ModalFrame';
import { Icon } from './ui/Icon';
import { CristalChama } from './ui/CristalChama';

/**
 * MODAL DO RANKING (18/11/2026, pedido do dono; REGISTRO §485): a moldura própria do ranking (`assets/soulmon/ui/ranking/`: ouro envelhecido,
 * faixas vermelhas, medalhas, placa de bronze, diamantes da alma) sobre o `ModalFrame`, como o modal Files. O conteúdo NÃO leva borda interna.
 * Os discos do topo já vêm desenhados na arte: o X (fechar, à esquerda) e o "i" (`ModalFrame info`, à direita) são SÓ glifos, centrados nos discos,
 * com alvo de toque transparente ≥ 44 px e foco visível discreto (sem círculo por cima). Geometria em `.sm2-moldura-modal--ranking` (`index.css`).
 */
export function RankingModal({ open, onClose, language, title, info, children }: {
  open: boolean;
  onClose: () => void;
  language: Language;
  title: string;
  /** Texto do "i" (opcional; sem ele o disco fica decorativo). */
  info?: string;
  children: ReactNode;
}) {
  const isPt = language === 'pt-BR';
  const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose);
  if (!open) return null;
  // No <body>: dentro de uma folha com `transform` (AreaSheet) o `position: fixed` vira relativo a ela e o modal ficava com largura/altura erradas (texto cortado).
  const tela = (
    <div
      className="sm3-ranking-bg sm2-sheet-fade"
      data-ranking-modal-bg=""
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <ModalFrame
        ref={dialogRef}
        role="dialog"
        aria-modal={true}
        aria-label={title}
        title={title}
        className="sm3-ranking sm2-moldura-modal--ranking sm2-sheet-rise"
        data-ranking-modal=""
        fillOpacity={0}
        info={info ? { label: isPt ? 'Sobre o ranking' : 'About the ranking', content: info, language } : undefined}
      >
        {/* O CRISTAL-CHAMA no crescente de louro do topo (decorativo), como nos outros modais. */}
        <CristalChama tamanho={13} topo={-1.8} pulsar />
        <button type="button" className="sm3-ranking-fechar" onClick={onClose} aria-label={isPt ? 'Fechar' : 'Close'}>
          <Icon name="close" size={20} tone="inherit" />
        </button>
        <div className="sm3-ranking-corpo" data-ranking-corpo="">{children}</div>
      </ModalFrame>
    </div>
  );
  return typeof document === 'undefined' ? tela : createPortal(tela, document.body);
}
