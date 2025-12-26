import { Check, X } from 'lucide-react';

interface TaskCardProps {
  id: string;
  name: string;
  category: string;
  emoji: string;
  completed: boolean;
  onToggleComplete: (id: string) => void;
  onDelete: (id: string) => void;
  theme?: 'default' | 'win98' | 'glitch';
}

export function TaskCard({
  id,
  name,
  category,
  emoji,
  completed,
  onToggleComplete,
  onDelete,
  theme = 'default',
}: TaskCardProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  const getCategoryColor = () => {
    switch(category) {
      case 'Health': return isGlitch ? 'text-[#ff0066]' : 'text-red-600';
      case 'Study': return isGlitch ? 'text-[#00ffff]' : 'text-blue-600';
      case 'Social': return isGlitch ? 'text-[#00ff00]' : 'text-green-600';
      case 'Creativity': return isGlitch ? 'text-[#ff00ff]' : 'text-teal-600';
      default: return 'text-gray-600';
    }
  };

  const getCardClass = () => {
    if (isGlitch) {
      return completed 
        ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30 opacity-60'
        : 'bg-[#0a0a0a] border-2 border-[#00ffff] glitch-border';
    }
    if (isWin98) {
      return completed
        ? 'bg-[#c0c0c0] win98-inset opacity-75'
        : 'bg-[#c0c0c0] win98-button';
    }
    return completed
      ? 'bg-white/60 ring-1 ring-gray-200/50 opacity-70'
      : 'bg-white ring-1 ring-gray-200/50 shadow-sm';
  };

  return (
    <div
      className={`rounded-xl p-4 transition-all ${getCardClass()}`}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <button
          onClick={() => onToggleComplete(id)}
          className={`flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-all ${
            completed
              ? isGlitch
                ? 'bg-[#00ffff] border-2 border-[#00ffff]'
                : isWin98
                ? 'bg-[#000080] border-2 border-[#000080]'
                : 'bg-green-500 border-2 border-green-500'
              : isGlitch
              ? 'border-2 border-[#00ffff]/50'
              : isWin98
              ? 'border-2 border-[#808080]'
              : 'border-2 border-gray-300 hover:border-gray-400'
          }`}
        >
          {completed && (
            <Check
              size={14}
              strokeWidth={3}
              className={isGlitch ? 'text-[#0a0a0a]' : 'text-white'}
            />
          )}
        </button>

        {/* Task Name */}
        <div className="flex-1 min-w-0">
          <p
            className={`truncate transition-all ${
              completed
                ? isGlitch
                  ? 'line-through text-[#00ffff]/50'
                  : isWin98
                  ? 'line-through text-[#808080]'
                  : 'line-through text-gray-400'
                : isGlitch
                ? 'text-[#00ffff]'
                : isWin98
                ? 'text-[#000000]'
                : 'text-gray-900'
            }`}
            style={{ fontFamily: 'monospace', fontSize: '0.9375rem' }}
          >
            {emoji} {name}
          </p>
          <p
            className={`text-xs mt-0.5 ${getCategoryColor()}`}
            style={{ fontFamily: 'monospace' }}
          >
            {category}
          </p>
        </div>

        {/* Delete Button */}
        <button
          onClick={() => onDelete(id)}
          className={`flex-shrink-0 p-1.5 rounded-lg transition-all ${
            isGlitch
              ? 'hover:bg-[#ff0066]/20 text-[#ff0066]'
              : isWin98
              ? 'hover:bg-[#808080]/20 text-[#000000]'
              : 'hover:bg-red-50 text-red-600'
          }`}
          title="Deletar tarefa"
        >
          <X size={18} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}