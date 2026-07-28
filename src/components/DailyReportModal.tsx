import { X, ListChecks, Heart, Star, Sun, CloudRain, HeartCrack } from 'lucide-react';
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

  const rows: { Icon: typeof Heart; label: string; value: string; highlight?: 'good' | 'bad' }[] = [
    {
      Icon: ListChecks,
      label: isPt ? 'Tarefas de ontem' : "Yesterday's tasks",
      value: `${report.done}/${report.total}`,
      highlight: report.wasPerfect ? 'good' : undefined,
    },
    {
      Icon: Heart,
      label: isPt ? 'Corações perdidos' : 'Hearts lost',
      value: report.heartsLost > 0 ? `-${report.heartsLost} ❤️` : (isPt ? 'nenhum!' : 'none!'),
      highlight: report.heartsLost > 0 ? 'bad' : 'good',
    },
    {
      Icon: Star,
      label: isPt ? 'Dias perfeitos' : 'Perfect days',
      value: `${report.perfectDays}`,
      highlight: report.wasPerfect ? 'good' : undefined,
    },
  ];

  const HeadIcon = report.degenerated ? HeartCrack : report.wasPerfect ? Star : report.heartsLost > 0 ? CloudRain : Sun;
  const headColor = report.degenerated ? '#e0483e' : report.wasPerfect ? '#d9a441' : report.heartsLost > 0 ? '#6b7280' : '#f0a500';
  const headBg = report.degenerated ? '#fde8e6' : report.wasPerfect ? '#fbf1dd' : report.heartsLost > 0 ? '#eef0f3' : '#fff4e0';

  const headline = report.degenerated
    ? (isPt ? 'Seu Soulmon regrediu...' : 'Your Soulmon degenerated...')
    : report.wasPerfect
      ? (isPt ? 'Dia perfeito!' : 'Perfect day!')
      : report.heartsLost > 0
        ? (isPt ? 'Dia difícil...' : 'Rough day...')
        : (isPt ? 'Novo dia!' : 'New day!');

  if (isWin98 || isGlitch) {
    const palette = isGlitch
      ? { bg: '#0a0a0a', border: '2px solid #00ffff', text: '#00ffff', sub: '#5fbcbc', headBg: '#0a0a0a' }
      : { bg: '#c0c0c0', border: '2px solid #000080', text: '#000000', sub: '#444444', headBg: '#000080' };
    const emojiHeadline = report.degenerated ? `💔 ${headline}` : report.wasPerfect ? `⭐ ${headline}` : report.heartsLost > 0 ? `😟 ${headline}` : `☀️ ${headline}`;
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
        <div style={{ width: '100%', maxWidth: 320, background: palette.bg, border: palette.border, borderRadius: 0, boxShadow: '0 12px 32px rgba(0,0,0,0.4)', overflow: 'hidden' }}>
          <div style={{ position: 'relative', padding: '18px 44px 14px 20px', background: palette.headBg, textAlign: 'center' }}>
            <span style={{ ...mono, fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>{emojiHeadline}</span>
            <button onClick={onClose} aria-label={isPt ? 'Fechar' : 'Close'}
              style={{ ...mono, position: 'absolute', top: 10, right: 10, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>
              ✕
            </button>
          </div>
          <div style={{ padding: '16px 20px 6px' }}>
            {rows.map(r => (
              <div key={r.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0' }}>
                <span style={{ ...mono, fontSize: '0.78rem', color: palette.sub }}>{r.label}</span>
                <span style={{ ...mono, fontSize: '0.88rem', fontWeight: 700, color: r.highlight === 'good' ? '#16a34a' : r.highlight === 'bad' ? '#ef4444' : palette.text }}>
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
                {isPt ? 'Dica: faça carinho (esfregue o pet) para recuperar meio coração.' : 'Tip: rub your pet to restore half a heart.'}
              </p>
            )}
          </div>
          <div style={{ padding: '14px 20px 18px' }}>
            <button onClick={onClose}
              style={{ ...mono, width: '100%', padding: '11px 0', borderRadius: 0, border: '2px outset #ffffff', background: isGlitch ? '#00ffff' : '#c0c0c0', color: isGlitch ? '#0a0a0a' : '#000000', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer' }}>
              OK
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(42,36,64,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="sm-card" style={{ width: '100%', maxWidth: 320, padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ position: 'relative', padding: '24px 20px 16px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            aria-label={isPt ? 'Fechar' : 'Close'}
            style={{ position: 'absolute', top: 12, right: 12, width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--sm-bg)', border: 'none', borderRadius: 999, color: 'var(--sm-muted)', cursor: 'pointer' }}
          >
            <X size={16} strokeWidth={2.2} />
          </button>
          <div style={{ width: 56, height: 56, margin: '0 auto 10px', borderRadius: 18, background: headBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeadIcon size={28} color={headColor} strokeWidth={2} />
          </div>
          <p style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--sm-ink)', margin: 0 }}>{headline}</p>
        </div>

        {/* Rows */}
        <div style={{ padding: '4px 20px 6px' }}>
          {rows.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
              <span style={{ width: 30, height: 30, borderRadius: 10, background: 'var(--sm-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <r.Icon size={16} color="var(--sm-muted)" strokeWidth={2.2} />
              </span>
              <span style={{ flex: 1, fontSize: '0.82rem', color: 'var(--sm-muted)' }}>{r.label}</span>
              <span style={{
                fontSize: '0.92rem', fontWeight: 800,
                color: r.highlight === 'good' ? '#22A900' : r.highlight === 'bad' ? '#e0483e' : 'var(--sm-ink)',
              }}>
                {r.value}
              </span>
            </div>
          ))}
          {report.done >= report.required && report.energyWasFull === false && (
            <p style={{ fontSize: '0.74rem', color: 'var(--sm-muted)', paddingTop: 8, lineHeight: 1.4 }}>
              {isPt
                ? 'Tarefas ok, mas a energia não estava cheia — alimente até encher antes do fim do dia para o dia perfeito!'
                : 'Tasks done, but energy was not full — feed to full before the day ends for a perfect day!'}
            </p>
          )}
          {report.heartsLost > 0 && !report.degenerated && (
            <p style={{ fontSize: '0.74rem', color: 'var(--sm-muted)', paddingTop: 8, lineHeight: 1.4 }}>
              {isPt ? 'Dica: faça carinho (esfregue o pet) para recuperar meio coração.' : 'Tip: rub your pet to restore half a heart.'}
            </p>
          )}
        </div>

        {/* OK */}
        <div style={{ padding: '14px 20px 20px' }}>
          <button onClick={onClose} className="sm-btn" style={{ width: '100%' }}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
