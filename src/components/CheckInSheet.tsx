import type { Language } from '../utils/i18n';
import { ModalSheet, sm2Button, sm2Text } from './form/FormKit';
import type { CheckInSlot, CheckInWindow } from '../utils/checkIns';

/**
 * A FOLHA DOS CHECK-INS (beta-2 4.1). Bottom sheet padrão (`ModalSheet`): as três janelas do dia, o horário de cada uma e o estado
 * (feito · agora · mais tarde · passou). Só a janela em curso e ainda não resgatada tem botão. NÃO mostra número de recompensa, sequência
 * nem "faltou" — "passou" é um rótulo neutro de leitura. Abre mesmo com o ritmo das refeições desligado (os horários são os padrões ou
 * os editados em Configurações).
 */
const LABEL: Record<CheckInSlot, { en: string; pt: string }> = {
  morning: { en: 'Plan the day', pt: 'Preparar o dia' },
  afternoon: { en: 'See how it is going', pt: 'Ver como está indo' },
  night: { en: 'Close the day', pt: 'Encerrar o dia' },
};
const STATE: Record<CheckInWindow['status'], { en: string; pt: string }> = {
  claimed: { en: 'Done', pt: 'Feito' },
  open: { en: 'Open now', pt: 'Aberto agora' },
  upcoming: { en: 'Later', pt: 'Mais tarde' },
  missed: { en: 'Passed', pt: 'Passou' },
};

export function CheckInSheet({ open, language, windows, onClaim, onClose }: {
  open: boolean;
  language: Language;
  windows: CheckInWindow[];
  onClaim: () => void;
  onClose: () => void;
}) {
  const isPt = language === 'pt-BR';
  return (
    <ModalSheet open={open} title={isPt ? 'Check-ins do dia' : 'Daily check-ins'} onClose={onClose} language={language}>
      <ul data-checkin-sheet style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {windows.map(w => (
          <li
            key={w.slot}
            data-checkin-window={w.slot}
            data-status={w.status}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, padding: '8px 12px', borderRadius: 12,
              border: `1px solid ${w.status === 'open' ? 'var(--sm2-gold-fill)' : 'var(--sm2-line)'}`,
              backgroundColor: 'var(--sm2-surface)', opacity: w.status === 'missed' ? 0.6 : 1,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ ...sm2Text, margin: 0, fontWeight: 600 }}>{isPt ? LABEL[w.slot].pt : LABEL[w.slot].en}</p>
              <p style={{ ...sm2Text, margin: 0, fontVariantNumeric: 'tabular-nums', color: 'var(--sm2-muted)' }}>
                {w.to ? `${w.from}–${w.to}` : (isPt ? `${w.from} até o fim do dia` : `${w.from} to end of day`)}
              </p>
            </div>
            {w.status === 'open' ? (
              <button type="button" data-checkin={w.slot} style={{ ...sm2Button('primary'), flexShrink: 0 }} onClick={onClaim}>
                {isPt ? 'Fazer' : 'Check in'}
              </button>
            ) : (
              <span data-checkin-state style={{ ...sm2Text, flexShrink: 0 }}>{isPt ? STATE[w.status].pt : STATE[w.status].en}</span>
            )}
          </li>
        ))}
      </ul>
    </ModalSheet>
  );
}
