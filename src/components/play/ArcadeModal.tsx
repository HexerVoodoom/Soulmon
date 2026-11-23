import { lazy, Suspense } from 'react';
import type { Language } from '../../utils/i18n';
import { ModalSheet } from '../form/FormKit';
import { loadPlaySheets } from '../nav/playPrefetch';
import type { SalaoGame } from './PlaySheets';
import type { FunTicketStatus } from '../../utils/funTickets';

const SalaoSheet = lazy(() => loadPlaySheets().then(m => ({ default: m.SalaoSheet })));

/**
 * O modal de MINIGAMES sobre a própria Home (REGISTRO §486): o Fliperama de Canto abre isto. É o corpo do Salão de jogos (`SalaoSheet`: tickets,
 * compra de tickets e as cartas dos jogos) numa moldura de modal normal, SEM o NPC Pipo e SEM levar o jogador ao mapa. Fechar volta à Home.
 * Jogar fecha o modal e abre o jogo escolhido (o jogo roda na área Jogos, que cobra a rodada e pergunta o modo, como no Salão).
 */
export function ArcadeModal({ open, onClose, language, bitsToday, funStatus, onBuyTickets, onStart }: {
  open: boolean; onClose: () => void; language: Language; bitsToday?: number;
  funStatus?: (nowMs: number) => FunTicketStatus; onBuyTickets?: () => boolean | void; onStart: (g: SalaoGame) => void;
}) {
  if (!open) return null;
  const isPt = language === 'pt-BR';
  return (
    <ModalSheet open onClose={onClose} language={language} placement="center" title={isPt ? 'Minigames' : 'Minigames'} maxWidth={480}>
      <div data-arcade-modal>
        <Suspense fallback={null}>
          <SalaoSheet language={language} bitsToday={bitsToday} funStatus={funStatus} onBuyTickets={onBuyTickets} onStart={onStart} />
        </Suspense>
      </div>
    </ModalSheet>
  );
}
