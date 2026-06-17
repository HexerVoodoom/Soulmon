import { FORM_REQUIREMENTS, getStageLevel } from '../types/progression';
import { Language, useTranslation } from '../utils/i18n';

interface ProgressInfoProps {
  dailyDone: number;
  dailyTotal: number;
  dailyRequired: number;
  activitiesCount: number;
  evolutionStage: string;
  perfectDays: number;
  theme?: 'default' | 'win98' | 'glitch';
  language?: Language;
}

export function ProgressInfo({
  dailyDone,
  dailyTotal,
  dailyRequired,
  activitiesCount,
  evolutionStage,
  perfectDays,
  theme = 'default',
  language = 'en-US',
}: ProgressInfoProps) {
  const t = useTranslation(language);
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  
  const currentLevel = getStageLevel(evolutionStage);
  const requirements = FORM_REQUIREMENTS[currentLevel];
  const cap = requirements.cap;
  const required = requirements.required;
  
  const isDayPerfect = dailyDone >= dailyRequired;
  const progressPercentage = required > 0 ? (perfectDays / required) * 100 : 0;

  return (
    <div className={`rounded-2xl p-3 w-full ${
      isGlitch 
        ? 'glitch-activity-card' 
        : isWin98 
          ? 'win98-activity-card' 
          : 'border border-[#e5e6e7] shadow-[0px_0px_0px_1px_rgba(229,231,235,0.5),0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]'
    }`}>
      <div className="space-y-3">
        {/* Progresso do Dia */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs ${isWin98 ? 'text-black' : isGlitch ? 'text-[#00ffff]' : 'text-[#686868]'}`} style={{ fontFamily: 'Consolas, monospace' }}>
              {t.main.dayProgress} {isDayPerfect && '✓'}
            </span>
            <span className={`text-xs ${isDayPerfect ? 'text-[#22A900]' : isWin98 ? 'text-black' : isGlitch ? 'text-[#ff00ff]' : 'text-[#686868]'}`} style={{ fontFamily: 'Consolas, monospace', fontWeight: isDayPerfect ? '600' : 'normal' }}>
              {dailyDone} / {dailyRequired} ({t.main.minimum})
            </span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${
            isWin98 ? 'bg-[#404040]' : isGlitch ? 'bg-gray-700' : 'bg-[#f3f4f6]'
          }`}>
            <div 
              className={`h-full transition-all ${isDayPerfect ? 'bg-[#22A900]' : isWin98 ? 'bg-[#00ff41]' : isGlitch ? 'bg-[#ff00ff]' : 'bg-[#101828]'}`}
              style={{ width: dailyRequired > 0 ? `${Math.min((dailyDone / dailyRequired) * 100, 100)}%` : '0%' }}
            />
          </div>
        </div>
        
        {/* Progresso de Evolução */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs ${isWin98 ? 'text-black' : isGlitch ? 'text-[#00ffff]' : 'text-[#686868]'}`} style={{ fontFamily: 'Consolas, monospace' }}>
              {t.main.evolution}
            </span>
            <span className={`text-xs ${isWin98 ? 'text-black' : isGlitch ? 'text-[#ff00ff]' : 'text-[#686868]'}`} style={{ fontFamily: 'Consolas, monospace' }}>
              {perfectDays} / {required} {t.main.perfectDaysLabel}
            </span>
          </div>
          <div className={`w-full h-1.5 rounded-full overflow-hidden ${
            isWin98 ? 'bg-[#404040]' : isGlitch ? 'bg-gray-700' : 'bg-[#f3f4f6]'
          }`}>
            <div 
              className={`h-full transition-all ${isWin98 ? 'bg-[#0000ff]' : isGlitch ? 'bg-[#00ffff]' : 'bg-[#009ED8]'}`}
              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
            />
          </div>
        </div>
        
        {/* Cap de Atividades */}
        <div className="flex items-center justify-between">
          <span className={`text-xs ${isWin98 ? 'text-black' : isGlitch ? 'text-[#00ffff]' : 'text-[#686868]'}`} style={{ fontFamily: 'Consolas, monospace' }}>
            {t.main.registeredActivities}
          </span>
          <span className={`text-xs ${activitiesCount >= cap ? 'text-[#E69600]' : isWin98 ? 'text-black' : isGlitch ? 'text-[#ff00ff]' : 'text-[#686868]'}`} style={{ fontFamily: 'Consolas, monospace', fontWeight: activitiesCount >= cap ? '600' : 'normal' }}>
            {activitiesCount} / {cap} {activitiesCount >= cap && `(${t.main.maximum})`}
          </span>
        </div>
      </div>
    </div>
  );
}
