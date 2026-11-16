/**
 * O MODALZINHO DA META DE PASSOS (REGISTRO §413, pedido do dono, 16/11/2026): ao ADOTAR o hábito de caminhar (Walk), pergunta
 * quantos passos por dia — 3 mil, 5 mil, 7 mil ou 10 mil. Escolher grava a meta (`stepGoal`, a mesma das Configurações) e fecha; fechar
 * sem escolher não muda nada (a meta que já estava segue valendo). Sem cobrança: é uma preferência, não uma promessa.
 */
import type { Language } from '../utils/i18n';
import { STEP_GOAL_OPTIONS } from '../utils/steps';
import { sm2Button, sm2Hint, sm2Text } from './form/FormKit';
import { RitualDialog, ritualTitle } from './ritual/RitualKit';

export function StepGoalModal({ language, currentGoal, onPick, onClose }: { language: Language; currentGoal: number; onPick: (goal: number) => void; onClose: () => void }) {
  const isPt = language === 'pt-BR';
  const title = isPt ? 'Quantos passos por dia?' : 'How many steps a day?';
  return (
    <RitualDialog label={title} onClose={onClose} maxWidth={340} closeLabel={isPt ? 'Fechar' : 'Close'} closeOnBackdrop>
      <p style={{ ...ritualTitle, margin: 0 }}>{title}</p>
      <p style={{ ...sm2Text, margin: 0 }}>{isPt ? 'Escolha a meta do seu hábito de caminhar.' : 'Pick the goal for your walking habit.'}</p>
      <div data-step-goal-choice role="group" aria-label={isPt ? 'Meta diária de passos' : 'Daily step goal'} style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {STEP_GOAL_OPTIONS.map(g => (
          <button key={g} type="button" data-step-goal={g} aria-pressed={g === currentGoal} onClick={() => onPick(g)} style={{ ...sm2Button(g === currentGoal ? 'primary' : 'outline'), flex: '1 1 40%' }}>
            {g.toLocaleString(isPt ? 'pt-BR' : 'en-US')}
          </button>
        ))}
      </div>
      <p style={{ ...sm2Hint, margin: 0 }}>{isPt ? 'Você muda isso quando quiser, nas Configurações.' : 'You can change this anytime in Settings.'}</p>
    </RitualDialog>
  );
}
