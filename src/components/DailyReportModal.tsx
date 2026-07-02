import type { GameState } from '../contexts/GameStateContext';
import type { Language } from '../utils/i18n';

interface DailyReportModalProps {
  report: NonNullable<GameState['lastDayReport']>;
  onClose: () => void;
  language: Language;
  theme?: 'default' | 'win98' | 'glitch';
}

/**
 * "Daily report" shown once on the first open after the day rolls over.
 * Explains what happened at the reset (tasks done, hearts lost, streak), so
 * heart loss is never a silent mystery.
 */
export function DailyReportModal({ report, onClose, language, theme = 'default' }: DailyReportModalProps) {
  const isPt = language === 'pt-BR';
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const mono = { fontFamily: 'monospace' as const };

  const rows: { label: string; value: string; highlight?: 'good' | 'bad' }[] = [
    {
      label: isPt ? 'Tarefas de ontem' : "Yesterday's tasks",
      value: `${report.done}/${report.total}`,
      highlight: report.wasPerfect ? 'good' : undefined,
    },
    {
      label: isPt ? 'Corações perdidos' : 'Hearts lost',
      value: report.heartsLost > 0 ? `-${report.heartsLost} ❤️` : (isPt ? 'nenhum!' : 'none!'),
      highlight: report.heartsLost > 0 ? 'bad' : 'good',
    },
    {
      label: isPt ? 'Dias perfeitos' : 'Perfect days',
      value: `${report.perfectDays}`,
      highlight: report.wasPerfect ? 'good' : undefined,
    },
  ];

  const headline = report.degenerated
    ? (isPt ? '💔 Seu Digimon regrediu...' : '💔 Your Digimon degenerated...')
    : report.wasPerfect
      ? (isPt ? '⭐ Dia perfeito!' : '⭐ Perfect day!')
      : report.heartsLost > 0
        ? (isPt ? '😟 Dia difícil...' : '😟 Rough day...')
        : (isPt ? '☀️ Novo dia!' : '☀️ New day!');

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-[200]">
      <div className={`w-full max-w-xs rounded-xl shadow-2xl overflow-hidden ${
        isGlitch ? 'bg-[#0a0a0a] border-2 border-[#00ffff]' : isWin98 ? 'win98-container' : 'bg-white'
      }`}>
        <div className={`px-5 py-4 text-center ${
          isGlitch ? 'text-[#00ffff]' : isWin98 ? 'bg-[#000080] text-white' : 'bg-gray-50 text-gray-900'
        }`} style={{ ...mono, fontSize: '1rem', fontWeight: 700 }}>
          {headline}
        </div>
        <div className={`px-5 py-4 space-y-2 ${isWin98 ? 'bg-[#c0c0c0]' : ''}`}>
          {rows.map(r => (
            <div key={r.label} className="flex items-center justify-between">
              <span className={isGlitch ? 'text-[#7fdede]' : isWin98 ? 'text-black' : 'text-gray-500'}
                    style={{ ...mono, fontSize: '0.78rem' }}>
                {r.label}
              </span>
              <span
                className={
                  r.highlight === 'good' ? 'text-green-600'
                  : r.highlight === 'bad' ? 'text-red-500'
                  : isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-black' : 'text-gray-800'
                }
                style={{ ...mono, fontSize: '0.85rem', fontWeight: 700 }}
              >
                {r.value}
              </span>
            </div>
          ))}
          {report.heartsLost > 0 && !report.degenerated && (
            <p className={`pt-1 ${isGlitch ? 'text-[#5fbcbc]' : 'text-gray-400'}`} style={{ ...mono, fontSize: '0.7rem' }}>
              {isPt
                ? 'Dica: faça carinho (esfregue o pet) para recuperar meio coração.'
                : 'Tip: rub your pet to restore half a heart.'}
            </p>
          )}
        </div>
        <div className={`px-5 pb-4 ${isWin98 ? 'bg-[#c0c0c0]' : ''}`}>
          <button
            onClick={onClose}
            className={`w-full py-2 rounded-md text-sm ${
              isGlitch ? 'glitch-button primary' : isWin98 ? 'win98-button primary' : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
            style={{ ...mono, fontWeight: 700 }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
