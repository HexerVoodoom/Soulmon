interface DigivolutionProgressProps {
  currentDays: number;
  daysRequired: number;
  theme?: 'default' | 'win98' | 'glitch';
}

export function DigivolutionProgress({ 
  currentDays, 
  daysRequired,
  theme = 'default' 
}: DigivolutionProgressProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const progress = Math.min((currentDays / daysRequired) * 100, 100);
  
  return (
    <div 
      className={`rounded-xl overflow-hidden ${
        isGlitch 
          ? 'bg-[#1f2a39] border-2 border-[#00ffff]/30' 
          : isWin98 
            ? 'win98-activity-card bg-[#c0c0c0]' 
            : 'bg-[#1f2a39]'
      }`}
    >
      <div className="flex flex-col gap-1 p-3">
        {/* Header */}
        <div className="flex justify-between items-center">
          <span 
            className={`text-[10px] leading-[15px] ${
              isGlitch ? 'text-[#00ffff]' : 'text-white'
            }`}
            style={{ fontFamily: 'Consolas, monospace', fontWeight: 'bold' }}
          >
            DIGIVOLUTION
          </span>
          <span 
            className={`text-[10px] leading-[15px] ${
              isGlitch ? 'text-[#00ffff]' : 'text-white'
            }`}
            style={{ fontFamily: 'Consolas, monospace' }}
          >
            {currentDays}/{daysRequired} DAYS
          </span>
        </div>
        
        {/* Progress Bar */}
        <div className={`h-3 w-full rounded-sm overflow-hidden ${
          isGlitch ? 'bg-[#00ffff]/20' : 'bg-[#4a5565]'
        }`}>
          <div 
            className={`h-full transition-all duration-500 ${
              isGlitch 
                ? 'bg-[#00ffff]' 
                : isWin98 
                  ? 'bg-[#000080]' 
                  : 'bg-[#2bff95]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
