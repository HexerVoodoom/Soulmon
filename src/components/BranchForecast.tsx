import { Skull, Database, Shield } from 'lucide-react';

interface BranchForecastProps {
  virusPoints: number;
  dataPoints: number;
  vaccinePoints: number;
  onAddClick?: () => void;
  theme?: 'default' | 'win98' | 'glitch';
}

export function BranchForecast({ virusPoints, dataPoints, vaccinePoints, onAddClick, theme = 'default' }: BranchForecastProps) {
  const total = virusPoints + dataPoints + vaccinePoints;
  const virusPercent = total > 0 ? Math.round((virusPoints / total) * 100) : 33;
  const dataPercent = total > 0 ? Math.round((dataPoints / total) * 100) : 33;
  const vaccinePercent = total > 0 ? Math.round((vaccinePoints / total) * 100) : 33;

  return (
    <div className="flex gap-3 items-center">
      <div className="flex-1 bg-white rounded-2xl p-3 shadow-sm ring-1 ring-gray-200/50">
        {/* Labels */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <span className="text-gray-500" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              Virus
            </span>
            <span className="text-red-600" style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: '600' }}>
              {virusPoints}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-gray-500" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              Data
            </span>
            <span className="text-blue-600" style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: '600' }}>
              {dataPoints}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-gray-500" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              Vaccine
            </span>
            <span className="text-green-600" style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: '600' }}>
              {vaccinePoints}
            </span>
          </div>
        </div>
      </div>
      
      {onAddClick && (
        <button
          onClick={onAddClick}
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            theme === 'glitch' ? 'glitch-button' : theme === 'win98' ? 'win98-button' : 'bg-gradient-to-r from-[#2bff95] to-teal-500 hover:from-[#24e085] hover:to-teal-600 text-black shadow-sm'
          }`}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M4.16667 10H15.8333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
            <path d="M10 4.16667V15.8333" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.25" />
          </svg>
        </button>
      )}
    </div>
  );
}
