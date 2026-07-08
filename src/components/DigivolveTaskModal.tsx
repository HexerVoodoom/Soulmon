interface DigivolveTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: () => void;
  /** Tasks needed per day to guarantee an evolution point (perfect day). */
  requiredTasks: number;
  /** Tasks currently registered by the user. */
  registeredTasks: number;
  /** Display name of the new stage/form. */
  stageName: string;
  theme?: 'default' | 'win98' | 'glitch';
  language?: 'pt-BR' | 'en-US';
}

export function DigivolveTaskModal({
  isOpen,
  onClose,
  onCreateTask,
  requiredTasks,
  registeredTasks,
  stageName,
  theme = 'default',
  language = 'en-US',
}: DigivolveTaskModalProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const isPt = language === 'pt-BR';

  if (!isOpen) return null;

  const hasEnough = registeredTasks >= requiredTasks;
  const missing = Math.max(0, requiredTasks - registeredTasks);

  const title = isPt ? 'Digievolução!' : 'Digivolution!';

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
      <div
        className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl ${
          isGlitch
            ? 'bg-[#0a0a0a] border-2 border-[#00ffff]'
            : isWin98
              ? 'win98-button bg-[#c0c0c0]'
              : 'bg-white'
        }`}
      >
        {/* Content */}
        <div className="space-y-4">
          {/* Icon */}
          <div className="text-center">
            <span className="text-5xl">✨</span>
          </div>

          {/* Title */}
          <h2
            className={`text-center ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-900'
            }`}
            style={{ fontFamily: 'Consolas, monospace', fontSize: '1.125rem', fontWeight: 'bold' }}
          >
            {title}
          </h2>

          {/* Intro */}
          <p
            className={`text-center leading-relaxed ${
              isGlitch ? 'text-[#00ffff]/80' : isWin98 ? 'text-black' : 'text-gray-700'
            }`}
            style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem' }}
          >
            {intro}
          </p>

          {/* Goal */}
          <p
            className={`text-center leading-relaxed ${
              isGlitch ? 'text-[#00ffff]/80' : isWin98 ? 'text-black' : 'text-gray-700'
            }`}
            style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem' }}
          >
            {goal}
          </p>

          {/* Task count status */}
          <p
            className={`text-center leading-relaxed ${
              hasEnough
                ? isGlitch ? 'text-[#00ff9c]' : 'text-emerald-600'
                : isGlitch ? 'text-[#ff5c5c]' : 'text-amber-600'
            }`}
            style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem', fontWeight: 'bold' }}
          >
            {hasEnough ? statusOk : statusMissing}
          </p>

          {/* Buttons */}
          <div className="space-y-2">
            {!hasEnough && (
              <button
                onClick={onCreateTask}
                className={`w-full py-3 px-4 rounded-xl transition-all ${
                  isGlitch
                    ? 'bg-[#00ffff] text-black hover:bg-[#00ffff]/90'
                    : isWin98
                      ? 'win98-button bg-[#000080] text-white'
                      : 'bg-[#101828] text-white hover:bg-[#1f2937]'
                }`}
                style={{ fontFamily: 'Consolas, monospace', fontWeight: 'bold' }}
              >
                Create new task
              </button>
            )}
            <button
              onClick={onClose}
              className={`w-full py-3 px-4 rounded-xl transition-all ${
                hasEnough
                  ? isGlitch
                    ? 'bg-[#00ffff] text-black hover:bg-[#00ffff]/90'
                    : isWin98
                      ? 'win98-button bg-[#000080] text-white'
                      : 'bg-[#101828] text-white hover:bg-[#1f2937]'
                  : isGlitch
                    ? 'border border-[#00ffff]/40 text-[#00ffff] hover:bg-[#00ffff]/10'
                    : isWin98
                      ? 'win98-button bg-[#c0c0c0] text-black'
                      : 'border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
              style={{ fontFamily: 'Consolas, monospace', fontWeight: 'bold' }}
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
