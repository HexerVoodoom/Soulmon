import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Language } from '../../utils/i18n';
import { FUN_TICKET_BATCH, FUN_TICKET_COST, FUN_TICKET_PER_ROUND, type FunTicketStatus } from '../../utils/funTickets';
import { ModalSheet, sm2Button, sm2Hint, sm2Text } from '../form/FormKit';
import { EnergyCost } from '../ui/EnergyCost';
import { TicketArt, TicketCost } from './TicketFan';

/**
 * 🎫 "Sem ticket, quer comprar?" (pedido do dono, 15/11/2026). Abre quando o jogador toca em jogar um minijogo do Salão (ou tenta jogar de novo)
 * e não tem ticket. É o modal padrão (`ModalSheet`, centralizado); a arte do ticket fica METADE DENTRO, METADE FORA, por cima da borda de
 * cima, centrada, sem box em volta (ícone pelado) — mesmo recurso da prévia da loja (`ShopItemSheet`): portal no `<body>` medindo o topo
 * do diálogo. A regra (preço, lote, custo por partida) vem de `utils/funTickets.ts`; esta folha só mostra e pede.
 * Gesto do jogador: fora da fila de modais (`docs/FILA-DE-MODAIS.md` §4).
 */
export const TICKET_BUY_ART_W = 132;
const ART_H = Math.round(TICKET_BUY_ART_W * (308 / 512));

function FloatingTicket({ anchor }: { anchor: HTMLElement | null }) {
  const [top, setTop] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!anchor) return;
    const dlg = anchor.closest('[role="dialog"]') as HTMLElement | null;
    const measure = () => { if (dlg) setTop(dlg.getBoundingClientRect().top); };
    measure();
    window.addEventListener('resize', measure);
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (ro && dlg) ro.observe(dlg);
    return () => { window.removeEventListener('resize', measure); ro?.disconnect(); };
  }, [anchor]);
  if (top === null) return null;
  return createPortal(
    <div
      aria-hidden="true" data-ticket-buy-art
      style={{ position: 'fixed', left: '50%', top: top - ART_H / 2, transform: 'translateX(-50%)', zIndex: 121, pointerEvents: 'none', filter: 'drop-shadow(0 6px 10px rgba(0,0,0,.5))' }}
    >
      <TicketArt width={TICKET_BUY_ART_W} />
    </div>,
    document.body,
  );
}

export function TicketBuyModal({ open, language, status, onBuy, onClose, onBought }: {
  open: boolean;
  language: Language;
  status: (nowMs: number) => FunTicketStatus;
  /** Compra o lote; `false` = a regra recusou (nada foi cobrado). */
  onBuy: () => boolean;
  /** Fechou sem comprar (Agora não, véu, voltar): nada foi gasto. */
  onClose: () => void;
  /** A compra deu certo (o modal fecha por aqui, não por `onClose`). */
  onBought: () => void;
}) {
  const isPt = language === 'pt-BR';
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  useEffect(() => { if (!open) setAnchor(null); }, [open]);
  const st = status(Date.now());
  const noEnergy = st.buyRefusal === 'no-energy';
  const title = isPt ? 'Sem tickets por agora' : 'Out of tickets';
  const body = noEnergy
    ? (isPt ? 'Sem energia para comprar tickets agora. A energia volta com o tempo; que tal uma tarefa, o Ateliê da Mente ou o Refúgio?' : 'No energy to buy tickets right now. Energy comes back over time; how about a task, the Mind Atelier or the Refuge?')
    : (isPt ? 'Quer pegar um lote para jogar?' : 'Want to pick up a batch to play?');
  return (
    <ModalSheet open={open} title={title} onClose={onClose} language={language} placement="center" sobreTelas maxWidth={360}>
      <div ref={setAnchor} data-ticket-buy-modal style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, textAlign: 'center' }}>
        <p style={{ ...sm2Text, margin: 0 }}>{body}</p>
        <p data-ticket-round-cost style={{ ...sm2Hint, margin: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <span>{isPt ? 'Cada partida gasta' : 'Each round spends'}</span>
          <TicketCost amount={FUN_TICKET_PER_ROUND} size={22} />
          <span className="sm2-sr-only" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>{FUN_TICKET_PER_ROUND} ticket</span>
        </p>
        <button type="button" data-ticket-buy-confirm disabled={!st.canBuy} aria-disabled={!st.canBuy} onClick={() => { if (onBuy()) onBought(); }} style={{ ...sm2Button('primary', !st.canBuy), minHeight: 48, width: '100%' }}>
          {isPt ? `Comprar ${FUN_TICKET_BATCH} tickets` : `Buy ${FUN_TICKET_BATCH} tickets`}
          <EnergyCost amount={FUN_TICKET_COST} />
        </button>
        <button type="button" data-ticket-buy-decline onClick={onClose} style={{ ...sm2Button('outline'), minHeight: 44, width: '100%' }}>
          {isPt ? 'Agora não' : 'Not now'}
        </button>
      </div>
      <FloatingTicket anchor={anchor} />
    </ModalSheet>
  );
}
