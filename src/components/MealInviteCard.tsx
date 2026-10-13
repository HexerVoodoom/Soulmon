import type { Language } from '../utils/i18n';
import { sm2Button, sm2Text } from './form/FormKit';
import { mealInviteCopy } from '../../functions/api/_pushCopy.js';
import type { MealInviteKind, MealKey } from '../utils/mealRhythm';
import type { CheckInSlot } from '../utils/checkIns';

/**
 * O CARTÃO DA REFEIÇÃO — o convite do Soulmon dentro do app, nas três janelas
 * do dia (`utils/mealRhythm.ts`). Entra no slot de avisos da Home (fila única,
 * posição declarada no `App.tsx`), nunca como modal.
 *
 * O TEXTO é o mesmo do push (`mealInviteCopy`, `functions/api/_pushCopy.js`):
 * uma fonte só. Pede UMA coisa pequena, que o jogo já tem — e "Agora não"
 * dispensa a janela inteira sem deixar rastro. Nenhum número, nenhuma sequência,
 * nenhum "faltou": o cartão some sozinho quando a janela fecha.
 */
const CTA: Record<MealInviteKind, { en: string; pt: string }> = {
  snack: { en: 'Open the backpack', pt: 'Abrir a mochila' },
  poop: { en: 'Rinse off', pt: 'Dar um banho' },
  pet: { en: 'Give a pat', pt: 'Dar um carinho' },
  tenSeconds: { en: 'Say hi', pt: 'Dizer oi' },
};

/** O rótulo do check-in de cada janela (beta-2 4.1): o PROPÓSITO da janela, sem número de recompensa na tela. */
const CHECK_IN_LABEL: Record<CheckInSlot, { en: string; pt: string }> = {
  morning: { en: 'Plan the day', pt: 'Preparar o dia' },
  afternoon: { en: 'See how it is going', pt: 'Ver como está indo' },
  night: { en: 'Close the day', pt: 'Encerrar o dia' },
};

export function MealInviteCard({ language, petName, meal, kind, onAct, onSkip, checkIn }: {
  language: Language;
  petName: string;
  meal: MealKey;
  kind: MealInviteKind;
  onAct: (kind: MealInviteKind) => void;
  onSkip: () => void;
  /** Check-in desta janela (`utils/checkIns.ts`), quando ainda não foi resgatado hoje. Ausente = sem botão. */
  checkIn?: { slot: CheckInSlot; onClaim: () => void };
}) {
  const isPt = language === 'pt-BR';
  const copy = mealInviteCopy(meal, kind, petName, isPt ? 'pt-BR' : 'en-US');
  return (
    <section
      data-meal-invite={meal}
      style={{
        padding: 14, borderRadius: 12, marginBottom: 12,
        border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)',
      }}
    >
      <p style={{ ...sm2Text, margin: '0 0 4px', fontWeight: 600 }}>{copy.title}</p>
      <p style={{ ...sm2Text, margin: '0 0 10px' }}>{copy.body}</p>
      {checkIn && (
        <button type="button" data-checkin={checkIn.slot} style={{ ...sm2Button('primary'), width: '100%', marginBottom: 8 }} onClick={checkIn.onClaim}>
          {isPt ? CHECK_IN_LABEL[checkIn.slot].pt : CHECK_IN_LABEL[checkIn.slot].en}
        </button>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" data-meal-invite-act style={{ ...sm2Button('primary'), flex: 1 }} onClick={() => onAct(kind)}>
          {isPt ? CTA[kind].pt : CTA[kind].en}
        </button>
        <button type="button" data-meal-invite-skip style={{ ...sm2Button('outline'), flex: 1 }} onClick={onSkip}>
          {isPt ? 'Agora não' : 'Not now'}
        </button>
      </div>
    </section>
  );
}
