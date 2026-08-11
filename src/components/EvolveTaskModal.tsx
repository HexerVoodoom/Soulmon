interface EvolveTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: () => void;
  /** Tasks needed per day to guarantee an evolution point (perfect day). */
  requiredTasks: number;
  /** Tasks currently registered by the user. */
  registeredTasks: number;
  /** Display name of the new stage/form. */
  stageName: string;
  language?: 'pt-BR' | 'en-US';
}

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
    ? `Nesta nova fase, complete ${requiredTasks} tarefa(s) por dia (com energia cheia) para garantir um ponto de evolução — o dia perfeito.`
    : `In this new stage, complete ${requiredTasks} task(s) per day (with full energy) to guarantee an evolution point — a perfect day.`;

  const statusOk = isPt
    ? `Você já tem ${registeredTasks} tarefa(s) cadastrada(s). Continue assim!`
    : `You already have ${registeredTasks} task(s) registered. Keep it up!`;

  const statusMissing = isPt
    ? `Você tem só ${registeredTasks} tarefa(s) cadastrada(s). Cadastre mais ${missing} para garantir o ponto de evolução.`
    : `You only have ${registeredTasks} task(s) registered. Add ${missing} more to guarantee the evolution point.`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl sm-card">
        {/* Content */}
        <div className="space-y-4">
          {/* Icon */}
          <div className="text-center">
            <span className="text-5xl">✨</span>
          </div>

          {/* Title */}
          <h2
            className="text-center"
            style={{ fontFamily: 'Consolas, monospace', fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--sm-ink)' }}
          >
            {title}
          </h2>

          {/* Intro */}
          <p
            className="text-center leading-relaxed"
            style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem', color: 'var(--sm-muted)' }}
          >
            {intro}
          </p>

          {/* Goal */}
          <p
            className="text-center leading-relaxed"
            style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem', color: 'var(--sm-muted)' }}
          >
            {goal}
          </p>

          {/* Task count status */}
          <p
            className={`text-center leading-relaxed ${hasEnough ? 'text-emerald-600' : 'text-amber-600'}`}
            style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem', fontWeight: 'bold' }}
          >
            {hasEnough ? statusOk : statusMissing}
          </p>

          {/* Buttons */}
          <div className="space-y-2">
            {!hasEnough && (
              <button
                onClick={onCreateTask}
                className="sm-btn w-full"
                style={{ fontFamily: 'Consolas, monospace' }}
              >
                Create new task
              </button>
            )}
            <button
              onClick={onClose}
              className={`w-full ${hasEnough ? 'sm-btn' : 'sm-btn-secondary sm-btn'}`}
              style={{ fontFamily: 'Consolas, monospace' }}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
