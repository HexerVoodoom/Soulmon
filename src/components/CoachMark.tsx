import { useState } from 'react';
import { Language } from '../utils/i18n';

interface CoachMarkProps {
  onDismiss: () => void;
  language: Language;
  theme?: 'default' | 'win98' | 'glitch';
}

const TIPS = [
  {
    icon: '❤️',
    en: { title: 'HP & Energy', body: 'Hearts = your Soulmon\'s health. The side bar = energy, filled only by feeding. Full energy unlocks the shower.' },
    pt: { title: 'HP e Energia', body: 'Corações = saúde do seu Soulmon. A barra lateral = energia, carregada só comendo. Energia cheia libera o banho.' },
  },
  {
    icon: '📅',
    en: { title: 'Perfect Days', body: 'Complete your daily activities every day to accumulate "perfect days". Fill the bar below the pet to digivolve!' },
    pt: { title: 'Dias Perfeitos', body: 'Complete suas atividades todos os dias para acumular "dias perfeitos". Encha a barra abaixo do pet para digivolucionar!' },
  },
  {
    icon: '🦠',
    en: { title: 'Attributes', body: 'Each activity category feeds Virus 🦠, Data 💾 or Vaccine 💉 points. The dominant attribute shapes your Soulmon\'s evolution path!' },
    pt: { title: 'Atributos', body: 'Cada categoria de atividade alimenta pontos Vírus 🦠, Dado 💾 ou Vacina 💉. O atributo dominante define o caminho de evolução!' },
  },
];

export function CoachMark({ onDismiss, language, theme = 'default' }: CoachMarkProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const tip = TIPS[tipIndex];
  const isPt = language === 'pt-BR';
  const isLast = tipIndex === TIPS.length - 1;
  const isGlitch = theme === 'glitch';
  const isWin98 = theme === 'win98';

  return (
    <div className="absolute inset-0 z-50 flex items-end justify-center pb-4 px-4 pointer-events-none">
      <div
        className={`w-full max-w-sm pointer-events-auto animate-in slide-in-from-bottom-4 fade-in duration-300 ${
          isGlitch
            ? 'bg-[#0a0a0a] border-2 border-[#00ffff] text-[#00ffff]'
            : isWin98
            ? 'bg-[#c0c0c0] border-2 border-white shadow-[inset_-1px_-1px_0_#808080,inset_1px_1px_0_#ffffff]'
            : 'bg-white rounded-2xl shadow-xl ring-1 ring-gray-200'
        } p-4`}
      >
        {/* Step dots */}
        <div className="flex gap-1 mb-3 justify-center">
          {TIPS.map((_, i) => (
            <span
              key={i}
              className={`block rounded-full transition-all ${
                i === tipIndex
                  ? isGlitch ? 'bg-[#00ffff] w-4 h-2' : 'bg-gray-800 w-4 h-2'
                  : isGlitch ? 'bg-[#00ffff]/30 w-2 h-2' : 'bg-gray-300 w-2 h-2'
              }`}
            />
          ))}
        </div>

        <div className="flex gap-3 items-start mb-4">
          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>{tip.icon}</span>
          <div>
            <p className={`font-bold text-sm mb-1 ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-900'}`} style={{ fontFamily: 'monospace' }}>
              {isPt ? tip.pt.title : tip.en.title}
            </p>
            <p className={`text-xs leading-relaxed ${isGlitch ? 'text-[#ff00ff]' : isWin98 ? 'text-gray-700' : 'text-gray-600'}`} style={{ fontFamily: 'monospace' }}>
              {isPt ? tip.pt.body : tip.en.body}
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onDismiss}
            className={`flex-1 py-2 text-xs rounded-lg transition-colors ${
              isGlitch ? 'text-[#00ffff]/60 hover:text-[#00ffff]' : isWin98 ? 'win98-button' : 'text-gray-400 hover:text-gray-600'
            }`}
            style={{ fontFamily: 'monospace' }}
          >
            {isPt ? 'pular' : 'skip'}
          </button>
          <button
            onClick={() => isLast ? onDismiss() : setTipIndex(i => i + 1)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${
              isGlitch
                ? 'bg-[#00ffff] text-black'
                : isWin98
                ? 'win98-button bg-[#000080] text-white'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
            style={{ fontFamily: 'monospace' }}
          >
            {isLast ? (isPt ? 'entendido ✓' : 'got it ✓') : (isPt ? 'próximo →' : 'next →')}
          </button>
        </div>
      </div>
    </div>
  );
}
