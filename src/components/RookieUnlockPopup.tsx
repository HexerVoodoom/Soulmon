import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';

interface RookieUnlockPopupProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'default' | 'win98' | 'glitch';
}

export function RookieUnlockPopup({ isOpen, onClose, theme = 'default' }: RookieUnlockPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleClose}
    >
      <div 
        className={`max-w-sm w-full transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${
          isWin98 
            ? 'bg-[#c0c0c0] border-4 border-white shadow-[inset_2px_2px_0_rgba(255,255,255,0.8),inset_-2px_-2px_0_rgba(0,0,0,0.8)]' 
            : isGlitch
            ? 'bg-black border-2 border-[#00ffff] shadow-[0_0_20px_rgba(0,255,255,0.5)]'
            : 'bg-white rounded-2xl shadow-2xl'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`p-6 text-center ${
          isWin98 
            ? 'border-b-2 border-gray-400 bg-gradient-to-r from-[#000080] to-[#1084d0]' 
            : isGlitch
            ? 'border-b-2 border-[#00ffff]'
            : 'border-b border-gray-200'
        }`}>
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
            isWin98
              ? 'bg-yellow-400'
              : isGlitch
              ? 'bg-[#00ffff] animate-pulse'
              : 'bg-gradient-to-br from-yellow-400 to-orange-500'
          }`}>
            <Sparkles 
              size={32} 
              className={isWin98 || isGlitch ? 'text-black' : 'text-white'} 
            />
          </div>
          <h2 
            className={`${
              isWin98 
                ? 'text-white' 
                : isGlitch
                ? 'text-[#00ffff]'
                : 'text-gray-900'
            }`} 
            style={{ 
              fontFamily: 'monospace', 
              fontSize: '1.25rem', 
              fontWeight: 'bold',
              textShadow: isGlitch ? '0 0 10px rgba(0,255,255,0.8)' : 'none'
            }}
          >
            🎉 Nova Funcionalidade!
          </h2>
        </div>

        {/* Content */}
        <div className={`p-6 ${
          isWin98 ? 'bg-[#c0c0c0]' : isGlitch ? 'bg-black' : 'bg-white'
        }`}>
          <div className="text-center space-y-4">
            <p 
              className={`${
                isWin98 
                  ? 'text-black' 
                  : isGlitch
                  ? 'text-[#00ff00]'
                  : 'text-gray-700'
              }`}
              style={{ 
                fontFamily: 'monospace', 
                fontSize: '1rem', 
                lineHeight: '1.6',
                textShadow: isGlitch ? '0 0 5px rgba(0,255,0,0.5)' : 'none'
              }}
            >
              <strong>Parabéns pelo progresso!</strong>
            </p>
            <p 
              className={`${
                isWin98 
                  ? 'text-black' 
                  : isGlitch
                  ? 'text-[#00ffff]'
                  : 'text-gray-600'
              }`}
              style={{ 
                fontFamily: 'monospace', 
                fontSize: '0.875rem', 
                lineHeight: '1.6',
                textShadow: isGlitch ? '0 0 5px rgba(0,255,255,0.3)' : 'none'
              }}
            >
              Now you can also <strong>plan activities throughout the week!</strong>
            </p>
            <div className={`p-4 rounded-lg ${
              isWin98
                ? 'bg-white border-2 border-gray-400'
                : isGlitch
                ? 'bg-[#001a1a] border border-[#00ffff]'
                : 'bg-gradient-to-br from-teal-50 to-blue-50 border border-teal-200'
            }`}>
              <p 
                className={`text-xs ${
                  isWin98 
                    ? 'text-black' 
                    : isGlitch
                    ? 'text-[#00ff00]'
                    : 'text-gray-600'
                }`}
                style={{ 
                  fontFamily: 'monospace', 
                  lineHeight: '1.5',
                  textShadow: isGlitch ? '0 0 3px rgba(0,255,0,0.3)' : 'none'
                }}
              >
                📅 When creating or editing activities, you can now choose which days of the week they should be done!
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`p-6 ${
          isWin98 
            ? 'bg-[#c0c0c0] border-t-2 border-gray-400' 
            : isGlitch
            ? 'bg-black border-t-2 border-[#00ffff]'
            : 'bg-white border-t border-gray-200'
        }`}>
          <button
            onClick={handleClose}
            className={`w-full py-3 px-4 rounded-xl transition-all transform active:scale-95 ${
              isWin98
                ? 'bg-[#000080] text-white border-2 border-white shadow-[inset_1px_1px_0_rgba(255,255,255,0.5)] hover:bg-[#000060]'
                : isGlitch
                ? 'bg-[#00ffff] text-black hover:bg-[#00ff00] shadow-[0_0_15px_rgba(0,255,255,0.5)]'
                : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600 shadow-lg'
            }`}
            style={{ 
              fontFamily: 'monospace', 
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            Entendi!
          </button>
        </div>
      </div>
    </div>
  );
}
