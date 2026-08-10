interface DigivolutionProgressProps {
  currentDays: number;
  daysRequired: number;
  language?: 'pt-BR' | 'en-US';
}

export function DigivolutionProgress({
  currentDays,
  daysRequired,
  language = 'en-US',
}: DigivolutionProgressProps) {
  const isPt = language === 'pt-BR';
  const progress = Math.min((currentDays / daysRequired) * 100, 100);

  return (
    <div className="rounded-xl overflow-hidden sm-card">
      <div className="flex flex-col gap-1.5 p-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--sm-ink)' }}>
            {isPt ? 'Evolução' : 'Evolution'}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--sm-muted)', fontWeight: 600 }}>
            {currentDays}/{daysRequired} {isPt ? 'dias' : 'days'}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full rounded-full overflow-hidden" style={{ background: 'var(--sm-line)' }}>
          <div
            className="h-full transition-all duration-500 rounded-full"
            style={{
              width: `${progress}%`,
              background: 'var(--sm-primary)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
