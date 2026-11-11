/**
 * O CONVITE CURTO DOS PASSOS (REGISTRO §283; `utils/stepsInvite.ts`).
 *
 * Intersticial da fila central (`stepsInvite`). Pergunta, em poucas linhas, se a pessoa quer a contagem de passos e deixa escolher a
 * meta; aceitar ativa a missão bônus. As MESMAS três regras do `StepsCard` valem aqui:
 *  1. o diálogo do sistema (Health Connect) só abre DEPOIS desta tela (consentimento antes da permissão);
 *  2. aceitar e recusar têm o MESMO peso (mesmo tamanho, lado a lado): recusa escondida é padrão escuro;
 *  3. passos nunca pontuam sozinhos e não há cobrança: a frase está atrás do "?", e recusar não custa nada.
 * Sem X e sem Esc: as duas saídas SÃO os dois botões (voltar do Android não decide por ninguém).
 */
import { useState } from 'react';
import type { Language } from '../utils/i18n';
import { DEFAULT_STEP_GOAL, STEP_GOAL_OPTIONS, stepsConsentCopy } from '../utils/steps';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { RitualDialog, ritualTitle } from './ritual/RitualKit';
import { InfoTip } from './ui/InfoTip';

export interface StepsInviteModalProps {
  language: Language;
  /** Meta que já estava no save (padrão `DEFAULT_STEP_GOAL`). */
  initialGoal?: number;
  /** Aceitou: o App grava a meta, pede a permissão do sistema e grava o consentimento. */
  onAccept: (goal: number) => void;
  /** Recusou: o App grava `'declined'`. Sem custo, sem confirmação. */
  onDecline: () => void;
}

const noop = () => {};

export function StepsInviteModal({ language, initialGoal = DEFAULT_STEP_GOAL, onAccept, onDecline }: StepsInviteModalProps) {
  const isPt = language === 'pt-BR';
  const locale = isPt ? 'pt-BR' : 'en-US';
  const copy = stepsConsentCopy(language);
  const [goal, setGoal] = useState<number>(initialGoal);
  const [busy, setBusy] = useState(false);

  return (
    <RitualDialog label={copy.title} onClose={noop} maxWidth={360}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
        <p style={{ ...ritualTitle, margin: 0, flex: 1, minWidth: 0 }}>{copy.title}</p>
        <InfoTip language={language} label={isPt ? 'Como os passos contam' : 'How steps count'} align="right">
          {copy.why}
        </InfoTip>
      </div>

      <p data-steps-invite-what="" style={{ ...sm2Text, margin: 0 }}>{copy.what}</p>

      <div data-step-goal-choice="" role="group" aria-label={isPt ? 'Meta diária de passos' : 'Daily step goal'} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <span style={sm2Hint}>{isPt ? 'Meta diária de passos' : 'Daily step goal'}</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {STEP_GOAL_OPTIONS.map(g => (
            <button key={g} type="button" data-step-goal={g} aria-pressed={g === goal} onClick={() => setGoal(g)} style={sm2Button(g === goal ? 'primary' : 'outline', false, 'sm')}>
              {g.toLocaleString(locale)}
            </button>
          ))}
        </div>
      </div>

      <p style={{ ...sm2Hint, margin: 0 }}>{copy.privacy}</p>

      <div className="sm2-conta-two">
        <button type="button" data-steps-invite="decline" disabled={busy} onClick={onDecline} style={sm2Button('outline')}>
          {copy.decline}
        </button>
        <button
          type="button"
          data-steps-invite="accept"
          disabled={busy}
          onClick={() => { setBusy(true); onAccept(goal); }}
          style={sm2Button('primary')}
        >
          {copy.accept}
        </button>
      </div>
    </RitualDialog>
  );
}

export default StepsInviteModal;
