interface DigivolutionProgressProps {
  currentDays: number;
  daysRequired: number;
  theme?: 'default' | 'win98' | 'glitch';
  language?: 'pt-BR' | 'en-US';
}

export function DigivolutionProgress({
  currentDays,
  daysRequired,
  theme = 'default',
  language = 'en-US',
}: DigivolutionProgressProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const isPt = language === 'pt-BR';
  const progress = Math.min((currentDays / daysRequired) * 100, 100);

  return (
    <div
      className={`rounded-xl overflow-hidden ${
        isGlitch
          ? 'bg-[#1f2a39] border-2 border-[#00ffff]/30'
          : isWin98
            ? 'win98-activity-card bg-[#c0c0c0]'
            : 'sm-card'
      }`}
    >
      <div className="flex flex-col gap-1.5 p-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <span
            style={
              isGlitch
                ? { fontFamily: 'Consolas, monospace', fontWeight: 'bold', fontSize: '0.7rem', color: '#00ffff' }
                : isWin98
                  ? { fontFamily: 'Consolas, monospace', fontWeight: 'bold', fontSize: '0.7rem', color: '#000' }
                  : { fontSize: '0.75rem', fontWeight: 700, color: 'var(--sm-ink)' }
            }
          >
            {isPt ? 'Evolução' : 'Evolution'}
          </span>
          <span
            style={
              isGlitch || isWin98
                ? { fontFamily: 'Consolas, monospace', fontSize: '0.7rem', color: isGlitch ? '#00ffff' : '#000' }
                : { fontSize: '0.7rem', color: 'var(--sm-muted)', fontWeight: 600 }
            }
          >
            {currentDays}/{daysRequired} {isPt ? 'dias' : 'days'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className={`h-3 w-full rounded-full overflow-hidden ${isGlitch ? 'bg-[#00ffff]/20' : isWin98 ? 'bg-[#4a5565]' : ''}`}
             style={!isGlitch && !isWin98 ? { background: 'var(--sm-line)' } : undefined}>
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${progress}%`,
              background: isGlitch ? '#00ffff' : isWin98 ? '#000080' : 'var(--sm-primary)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
