import { X } from 'lucide-react';

interface FirstTaskCompletedPopupProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'default' | 'win98' | 'glitch';
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
  theme = 'default',
  language = 'en-US',
}: FirstTaskCompletedPopupProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
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
      <div 
        className={`relative w-full max-w-md rounded-2xl p-6 shadow-2xl ${
          isGlitch
            ? 'bg-[#0a0a0a] border-2 border-[#00ffff]'
            : isWin98
              ? 'win98-button bg-[#c0c0c0]'
              : 'bg-white'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className={`absolute right-4 top-4 p-2 rounded-lg transition-all ${
            isGlitch
              ? 'text-[#00ffff] hover:bg-[#00ffff]/10'
              : isWin98
                ? 'text-black hover:bg-gray-300'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
          }`}
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
            className={`text-center ${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-900'
            }`}
            style={{ fontFamily: 'Consolas, monospace', fontSize: '1.125rem', fontWeight: 'bold' }}
          >
            {isPt ? 'Primeira tarefa feita!' : 'First task done!'}
          </h2>

          {/* Message */}
          <p 
            className={`text-center leading-relaxed ${
              isGlitch ? 'text-[#00ffff]/80' : isWin98 ? 'text-black' : 'text-gray-700'
            }`}
            style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem' }}
          >
            {isPt
              ? 'Ele cresceu um pouquinho agora. É assim mesmo: uma coisa de cada vez, no seu ritmo.'
              : 'It grew a little just now. That’s how it works — one thing at a time, at your pace.'}
          </p>

          {/* Button */}
          <button
            onClick={onClose}
            className={`w-full py-3 px-4 rounded-xl transition-all ${
              isGlitch
                ? 'bg-[#00ffff] text-black hover:bg-[#00ffff]/90'
                : isWin98
                  ? 'win98-button bg-[#000080] text-white'
                  : 'bg-[#101828] text-white hover:bg-[#1f2937]'
            }`}
            style={{ fontFamily: 'Consolas, monospace', fontWeight: 'bold' }}
          >
            {isPt ? 'Entendi' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}
