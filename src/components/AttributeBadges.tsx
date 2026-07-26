import { Language, useTranslation } from '../utils/i18n';
import { Plus, Gem, Zap, Flame } from 'lucide-react';

interface AttributeBadgesProps {
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  gamePoints?: number;
  totalXP?: number;
  streakDays?: number;
  onNewActivity: () => void;
  theme?: 'default' | 'win98' | 'glitch';
  language: Language;
}

export function AttributeBadges({
  virusPoints, dataPoints, vaccinePoints,
  gamePoints = 0, totalXP = 0, streakDays = 0,
  onNewActivity, theme = 'default', language,
}: AttributeBadgesProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const t = useTranslation(language);
  const isPt = language === 'pt-BR';

  if (!isWin98 && !isGlitch) {
    // Default theme: stats card (Bits/XP/Streak) + Nova Atividade, no padrão
    // da referência — atributos (Virus/Data/Vaccine) numa linha secundária.
    return (
      <div className="space-y-2 w-full">
        <div className="sm-card flex items-stretch gap-3 px-4 py-3">
          <div className="flex-1 min-w-0 flex flex-col gap-2 justify-center">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <Gem size={16} color="var(--sm-primary)" strokeWidth={2.2} />
                <span className="text-xs font-semibold" style={{ color: 'var(--sm-muted)' }}>Bits</span>
                <span className="text-sm font-bold" style={{ color: 'var(--sm-ink)' }}>{gamePoints}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Zap size={16} color="#22A900" strokeWidth={2.2} />
                <span className="text-xs font-semibold" style={{ color: 'var(--sm-muted)' }}>XP</span>
                <span className="text-sm font-bold" style={{ color: 'var(--sm-ink)' }}>{totalXP}</span>
              </span>
            </div>
            <span className="flex items-center gap-1.5">
              <Flame size={16} color="var(--sm-gold)" strokeWidth={2.2} />
              <span className="text-xs font-semibold" style={{ color: 'var(--sm-muted)' }}>
                {isPt ? 'Sequência (dias)' : 'Streak (Days)'}
              </span>
              <span className="text-sm font-bold" style={{ color: 'var(--sm-ink)' }}>{streakDays}</span>
            </span>
          </div>
          <button onClick={onNewActivity} className="sm-btn flex-shrink-0" style={{ alignSelf: 'center' }}>
            <Plus size={16} strokeWidth={3} />
            <span className="text-sm whitespace-nowrap">{t.activities.addNew}</span>
          </button>
        </div>

        <div className="sm-card flex items-center justify-between gap-2 flex-wrap px-3 py-1.5">
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs" style={{ color: 'var(--sm-muted)' }}>Virus</span>
            <span className="text-xs font-bold" style={{ color: '#22A900' }}>{virusPoints}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs" style={{ color: 'var(--sm-muted)' }}>Data</span>
            <span className="text-xs font-bold" style={{ color: '#009ED8' }}>{dataPoints}</span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className="text-xs" style={{ color: 'var(--sm-muted)' }}>Vaccine</span>
            <span className="text-xs font-bold" style={{ color: '#E69600' }}>{vaccinePoints}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-stretch w-full">
      {/* Badges Container - Hug content */}
      <div className={`flex-1 min-w-0 rounded-2xl px-3 py-2 ${isGlitch ? 'glitch-activity-card' : 'win98-activity-card'}`}>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Virus Badge */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-xs ${isWin98 ? 'text-black' : 'text-[#00ff00]'}`} style={{ fontFamily: 'Consolas, monospace' }}>
              Virus
            </span>
            <span className="text-[#22A900] text-xs font-bold" style={{ fontFamily: 'Consolas, monospace' }}>
              {virusPoints}
            </span>
          </div>

          {/* Data Badge */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-xs ${isWin98 ? 'text-black' : 'text-[#00ffff]'}`} style={{ fontFamily: 'Consolas, monospace' }}>
              Data
            </span>
            <span className="text-[#009ED8] text-xs font-bold" style={{ fontFamily: 'Consolas, monospace' }}>
              {dataPoints}
            </span>
          </div>

          {/* Vaccine Badge */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <span className={`text-xs ${isWin98 ? 'text-black' : 'text-[#ff00ff]'}`} style={{ fontFamily: 'Consolas, monospace' }}>
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
            : 'bg-[#c0c0c0] border-2 border-white hover:bg-[#d0d0d0] text-black'
        }`}
      >
        <span style={{ fontFamily: 'Consolas, monospace' }}>+ {t.activities.addNew}</span>
      </button>
    </div>
  );
}
