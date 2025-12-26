import { Checkbox } from './ui/checkbox';

interface StepRowProps {
  id: string;
  label: string;
  completed: boolean;
  onToggle: (id: string) => void;
  theme?: 'default' | 'win98' | 'glitch';
}

export function StepRow({ id, label, completed, onToggle, theme = 'default' }: StepRowProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  
  return (
    <div className={`flex items-center gap-3 py-2.5 px-3 rounded-xl transition-all ${
      isGlitch
        ? `glitch-step ${completed ? 'completed' : ''}`
        : isWin98 
          ? `win98-step ${completed ? 'completed' : ''}`
          : completed ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'
    }`}>
      <Checkbox
        id={id}
        checked={completed}
        onCheckedChange={() => onToggle(id)}
        className={
          isGlitch
            ? 'border-[#00ffff] data-[state=checked]:bg-[#00ffff] data-[state=checked]:border-[#00ffff] data-[state=checked]:text-black'
            : isWin98 
              ? 'border-[#000080] data-[state=checked]:bg-[#000080] data-[state=checked]:border-[#000080] data-[state=checked]:text-white'
              : 'border-gray-300 data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900 h-5 w-5 rounded-md'
        }
      />
      <label
        htmlFor={id}
        className={`cursor-pointer select-none flex-1 ${
          isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : completed ? 'text-gray-400 line-through' : 'text-gray-700'
        }`}
        style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
      >
        {label}
      </label>
    </div>
  );
}
