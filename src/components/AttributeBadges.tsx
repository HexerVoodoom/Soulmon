import { Language, useTranslation } from '../utils/i18n';
import { Plus } from 'lucide-react';

interface AttributeBadgesProps {
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  onNewActivity: () => void;
  theme?: 'default' | 'win98' | 'glitch';
  language: Language;
}

export function AttributeBadges({ virusPoints, dataPoints, vaccinePoints, onNewActivity, theme = 'default', language }: AttributeBadgesProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const t = useTranslation(language);

  return (
    <div className="flex gap-3 items-stretch w-full">
      {/* Badges Container - Hug content */}
      <div className={`flex-1 min-w-0 rounded-2xl px-3 py-2 ${
        isGlitch 
          ? 'glitch-activity-card' 
          : isWin98 
            ? 'win98-activity-card' 
            : 'sm-card'
      }`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Virus Badge */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-xs ${isWin98 ? 'text-black' : isGlitch ? 'text-[#00ff00]' : 'text-[#686868]'}`} style={{ fontFamily: 'Consolas, monospace' }}>
              Virus
            </span>
            <span className="text-[#22A900] text-xs font-bold" style={{ fontFamily: 'Consolas, monospace' }}>
              {virusPoints}
            </span>
          </div>

          {/* Data Badge */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-xs ${isWin98 ? 'text-black' : isGlitch ? 'text-[#00ffff]' : 'text-[#686868]'}`} style={{ fontFamily: 'Consolas, monospace' }}>
              Data
            </span>
            <span className="text-[#009ED8] text-xs font-bold" style={{ fontFamily: 'Consolas, monospace' }}>
              {dataPoints}
            </span>
          </div>

          {/* Vaccine Badge */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-xs ${isWin98 ? 'text-black' : isGlitch ? 'text-[#ff00ff]' : 'text-[#686868]'}`} style={{ fontFamily: 'Consolas, monospace' }}>
              Vaccine
            </span>
            <span className="text-[#E69600] text-xs font-bold" style={{ fontFamily: 'Consolas, monospace' }}>
              {vaccinePoints}
            </span>
          </div>
        </div>
      </div>

      {/* Nova Atividade Button - Match pill height */}
      <button
        onClick={onNewActivity}
        className={`px-3 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
          isGlitch
            ? 'bg-gradient-to-r from-[#ff00ff] to-[#00ffff] text-black hover:opacity-90'
            : isWin98
              ? 'bg-[#c0c0c0] border-2 border-white hover:bg-[#d0d0d0] text-black'
              : 'sm-btn'
        }`}
      >
        {!isWin98 && !isGlitch && <Plus size={16} strokeWidth={3} />}
        <span className={`text-sm whitespace-nowrap ${isWin98 || isGlitch ? '' : 'text-white'}`} style={isWin98 || isGlitch ? { fontFamily: 'Consolas, monospace' } : undefined}>
          {isWin98 || isGlitch ? `+ ${t.activities.addNew}` : t.activities.addNew}
        </span>
      </button>
    </div>
  );
}
