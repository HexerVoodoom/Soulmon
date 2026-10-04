import { Icon } from './ui/Icon';
import { InfoTip } from './ui/InfoTip';
import { RitualDialog, ritualTitle } from './ritual/RitualKit';
import { sm2Button, sm2Text } from './form/FormKit';

/**
 * EVOLUÇÃO! — o aviso do requisito novo, depois da cerimônia.
 *
 * Canvas Evolução (`EvolveTaskModal.dc.html`, EVO-15): `.dlg` SIS-06 centrado
 * sobre o scrim literal (`RitualDialog`), `auto_awesome` 48 FILL 1 pelado em
 * `primary-ink`, Cinzel 20, corpo 14, o número em 12 `muted` — e **plural
 * real** ("complete 3 tasks per day", X7/S4: "task(s)" era o resíduo). Saiu
 * do kit antigo (Consolas, `sm-card`, botões só em inglês).
 *
 * Fila: monta só com `evolutionCeremony === null` (o `App.tsx` encadeia) —
 * a cerimônia entrega identidade, este modal explica o requisito, nesta
 * ordem. Decisão 13.12 (vira CARD na página) fica registrada: a estrutura do
 * wireframe aprovado é modal, e o canvas a replica.
 */
interface EvolveTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: () => void;
  /** Tasks needed per day to guarantee an evolution point (complete day). */
  requiredTasks: number;
  /** Tasks currently registered by the user. */
  registeredTasks: number;
  /** Display name of the new stage/form. */
  stageName: string;
  language?: 'pt-BR' | 'en-US';
}

/** Plural real, nos dois idiomas. */
const tarefas = (n: number, isPt: boolean) =>
  isPt ? `${n} tarefa${n === 1 ? '' : 's'}` : `${n} task${n === 1 ? '' : 's'}`;

export function EvolveTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  requiredTasks,
  registeredTasks,
  stageName,
  language = 'en-US',
}: EvolveTaskModalProps) {
  const isPt = language === 'pt-BR';

  if (!isOpen) return null;

  const hasEnough = registeredTasks >= requiredTasks;
  const missing = Math.max(0, requiredTasks - registeredTasks);

  const title = isPt ? 'Evolução!' : 'Evolution!';

  const intro = isPt
    ? `Seu parceiro evoluiu para ${stageName}!`
    : `Your partner evolved into ${stageName}!`;

  const goal = isPt
    ? `Nesta nova fase, complete ${tarefas(requiredTasks, true)} por dia (com energia cheia) para garantir um ponto de evolução — o dia completo.`
    : `In this new stage, complete ${tarefas(requiredTasks, false)} per day (with full energy) to guarantee an evolution point — a complete day.`;

  const statusOk = isPt
    ? `Você já tem ${tarefas(registeredTasks, true)} cadastrada${registeredTasks === 1 ? '' : 's'}. Continue assim!`
    : `You already have ${tarefas(registeredTasks, false)} registered. Keep it up!`;

  const statusMissing = isPt
    ? `Você tem só ${tarefas(registeredTasks, true)} cadastrada${registeredTasks === 1 ? '' : 's'}. Cadastre mais ${missing} para garantir o ponto de evolução.`
    : `You only have ${tarefas(registeredTasks, false)} registered. Add ${missing} more to guarantee the evolution point.`;

  return (
    <RitualDialog label={title} onClose={onClose} zIndex={200} maxWidth={340} style={{ alignItems: 'center', textAlign: 'center' }}>
      {/* Ilustração de estado — 48, pelado (ENTRADA 1 do guard de escala). */}
      <Icon name="auto_awesome" size={48} fill={1} tone="primary" />
      <h2 style={ritualTitle}>{title}</h2>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <p style={{ ...sm2Text, margin: 0 }}>{intro}</p>
        {/* K6 (04/10/2026): a regra do dia completo mora atrás do "?". */}
        <InfoTip language={language} label={isPt ? 'Como garantir o ponto de evolução' : 'How to secure the evolution point'} style={{ minHeight: 28 }}>{goal}</InfoTip>
      </div>
      <p style={{ ...sm2Text, margin: 0 }}>{hasEnough ? statusOk : statusMissing}</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
        {!hasEnough && (
          <button type="button" onClick={onCreateTask} style={{ ...sm2Button('primary'), width: '100%' }}>
            {isPt ? 'Criar nova tarefa' : 'Create new task'}
          </button>
        )}
        <button type="button" onClick={onClose} style={{ ...sm2Button(hasEnough ? 'primary' : 'outline'), width: '100%' }}>
          {isPt ? 'Entendi' : 'Got it'}
        </button>
      </div>
    </RitualDialog>
  );
}
