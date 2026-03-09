interface StepRowProps {
  id: string;
  label: string;
  completed: boolean;
  onToggle: (id: string) => void;
  theme?: 'default' | 'win98';
  disabled?: boolean;
}

export function StepRow({ id, label, completed, onToggle, theme = 'default', disabled = false }: StepRowProps) {
  const isWin98 = theme === 'win98';
  
  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 rounded-2xl transition-all ${
      isWin98 
        ? `win98-step ${completed ? 'completed' : ''}`
        : completed ? 'bg-[#e8e8e8]' : 'bg-[#f3f4f6] hover:bg-gray-100'
    }`}>
      {/* Custom Checkbox */}
      <div 
        onClick={disabled ? undefined : () => onToggle(id)}
        className={`w-5 h-5 rounded-lg border flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-[#d1d5dc]'
            : completed
            ? 'bg-[#22c55e] border-[#22c55e]'
            : isWin98
            ? 'border-[#d1d5dc] bg-white hover:bg-gray-50'
            : 'border-[#d1d5dc] bg-white hover:bg-gray-50 shadow-[0px_1px_2px_0px_rgba(0,0,0,0.05)]'
        }`}
      >
        {completed && (
          <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 14 14">
            <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <label
        onClick={disabled ? undefined : () => onToggle(id)}
        className={`select-none flex-1 ${
          disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
        } ${
          isWin98 ? 'text-[#4d5461]' : completed ? 'text-[#6b7280]' : 'text-[#4d5461]'
        }`}
        style={{ fontFamily: 'Consolas, monospace', fontSize: '0.875rem' }}
      >
        {label}
      </label>
    </div>
  );
}
