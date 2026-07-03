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
 * Layout uses INLINE styles — several Tailwind utilities (px-5, py-4, max-w-xs)
 * don't exist in the precompiled index.css (see CLAUDE.md footgun #1).
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

  const palette = isGlitch
    ? { bg: '#0a0a0a', border: '2px solid #00ffff', text: '#00ffff', sub: '#5fbcbc', headBg: '#0a0a0a' }
    : isWin98
      ? { bg: '#c0c0c0', border: '2px solid #000080', text: '#000000', sub: '#444444', headBg: '#000080' }
      : { bg: '#ffffff', border: '1px solid #e5e7eb', text: '#111827', sub: '#6b7280', headBg: '#f9fafb' };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 320, background: palette.bg, border: palette.border, borderRadius: isWin98 ? 0 : 14, boxShadow: '0 12px 32px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
        {/* Header with close button */}
        <div style={{ position: 'relative', padding: '18px 44px 14px 20px', background: palette.headBg, textAlign: 'center' }}>
          <span style={{ ...mono, fontSize: '1rem', fontWeight: 700, color: isWin98 ? '#ffffff' : palette.text }}>
            {headline}
          </span>
          <button
            onClick={onClose}
            aria-label={isPt ? 'Fechar' : 'Close'}
            style={{
              ...mono, position: 'absolute', top: 10, right: 10, width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'transparent', border: 'none', cursor: 'pointer',
              fontSize: '1rem', fontWeight: 700, color: isWin98 ? '#ffffff' : palette.sub,
            }}
          >
            ✕
          </button>
        </div>

        {/* Rows */}
        <div style={{ padding: '16px 20px 6px' }}>
          {rows.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' }}>
              <span style={{ ...mono, fontSize: '0.78rem', color: palette.sub }}>{r.label}</span>
              <span style={{
                ...mono, fontSize: '0.88rem', fontWeight: 700,
                color: r.highlight === 'good' ? '#16a34a' : r.highlight === 'bad' ? '#ef4444' : palette.text,
              }}>
                {r.value}
              </span>
            </div>
          ))}
          {report.done >= report.required && report.energyWasFull === false && (
            <p style={{ ...mono, fontSize: '0.7rem', color: palette.sub, paddingTop: 6 }}>
              {isPt
                ? 'Tarefas ok, mas a energia não estava cheia — alimente até encher antes do fim do dia para o dia perfeito!'
                : 'Tasks done, but energy was not full — feed to full before the day ends for a perfect day!'}
            </p>
          )}
          {report.heartsLost > 0 && !report.degenerated && (
            <p style={{ ...mono, fontSize: '0.7rem', color: palette.sub, paddingTop: 6 }}>
              {isPt
                ? 'Dica: faça carinho (esfregue o pet) para recuperar meio coração.'
                : 'Tip: rub your pet to restore half a heart.'}
            </p>
          )}
        </div>

        {/* OK — centered at the bottom */}
        <div style={{ padding: '14px 20px 18px' }}>
          <button
            onClick={onClose}
            style={{
              ...mono, width: '100%', padding: '11px 0', borderRadius: isWin98 ? 0 : 8,
              border: isWin98 ? '2px outset #ffffff' : 'none',
              background: isGlitch ? '#00ffff' : isWin98 ? '#c0c0c0' : '#0d9488',
              color: isGlitch ? '#0a0a0a' : isWin98 ? '#000000' : '#ffffff',
              fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
            }}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
