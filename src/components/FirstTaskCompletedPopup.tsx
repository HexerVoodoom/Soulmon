import { X } from 'lucide-react';

interface FirstTaskCompletedPopupProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'pt-BR' | 'en-US';
}

/**
 * Aparece na PRIMEIRA tarefa concluída na vida do jogador — o maior momento de
 * reforço positivo do produto. Antes ele era em inglês e, em vez de celebrar,
 * emitia uma condição ("complete TODAS as atividades do dia"), que além de tudo
 * era falsa: a meta é min(cadastradas, requisito).
 */
export function FirstTaskCompletedPopup({
  isOpen,
  onClose,
  language = 'en-US',
}: FirstTaskCompletedPopupProps) {
  const isPt = language === 'pt-BR';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl p-6 shadow-2xl sm-card">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-lg transition-all"
          style={{ color: 'var(--sm-muted)' }}
          aria-label={isPt ? 'Fechar' : 'Close'}
        >
          <X size={20} />
        </button>

        {/* Content */}
        <div className="space-y-4">
          {/* Icon */}
          <div className="text-center">
            <span className="text-5xl">🌱</span>
          </div>

          {/* Title */}
          <h2
            className="text-center"
            style={{ fontFamily: 'Consolas, monospace', fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--sm-ink)' }}
          >
            {isPt ? 'Primeira tarefa feita!' : 'First task done!'}
          </h2>

          {/* Message */}
          <p
            className="text-center leading-relaxed"
            style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem', color: 'var(--sm-muted)' }}
          >
            {isPt
              ? 'Ele cresceu um pouquinho agora. É assim mesmo: uma coisa de cada vez, no seu ritmo.'
              : 'It grew a little just now. That’s how it works — one thing at a time, at your pace.'}
          </p>

          {/* Button */}
          <button
            onClick={onClose}
            className="sm-btn w-full"
            style={{ fontFamily: 'Consolas, monospace' }}
          >
            {isPt ? 'Entendi' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
