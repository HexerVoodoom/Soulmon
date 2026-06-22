import { memo } from 'react';
import { Edit2 } from 'lucide-react';
import { Language, useTranslation } from '../utils/i18n';

interface TaskCardProps {
  id: string;
  name: string;
  category: string;
  emoji: string;
  completed: boolean;
  onToggleComplete: (id: string) => void;
  onEdit: (id: string) => void;
  theme?: 'default' | 'win98' | 'glitch';
  language?: Language;
}

export const TaskCard = memo(function TaskCard({
  id,
  name,
  emoji,
  completed,
  onToggleComplete,
  onEdit,
  theme = 'default',
  language = 'en-US',
}: TaskCardProps) {
  const isWin98 = theme === 'win98';
  const t = useTranslation(language);

  return (
    <div
      className={`rounded-2xl p-4 transition-all w-full border ${
        isWin98
          ? 'win98-activity-card'
          : completed
          ? 'bg-[#f5f5f5] border-[#d1d5dc] shadow-[0px_0px_0px_1px_rgba(229,231,235,0.5),0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]'
          : 'bg-white border-[#c0c0c0] shadow-[0px_0px_0px_1px_rgba(229,231,235,0.5),0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        <div
          onClick={() => { if (!completed) onToggleComplete(id); }}
          className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all flex-shrink-0 ${
            completed
              ? 'bg-[#22c55e] border-[#22c55e] cursor-default'
              : isWin98
              ? 'border-[#d1d5dc] bg-white hover:bg-gray-50 cursor-pointer'
              : 'border-[#d1d5dc] bg-white hover:bg-gray-50 cursor-pointer'
          }`}
        >
          {completed && (
            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 14 14">
              <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>

        {/* Task content */}
        <div className="flex-1">
          <p
            className={`${
              completed ? 'text-[#6b7280]' : 'text-[#101828]'
            }`}
            style={{ fontFamily: 'Consolas, monospace', fontSize: '0.9375rem', fontWeight: '400' }}
          >
            {emoji} {name}
          </p>
          <p
            className={completed ? 'text-[#9ca3af]' : 'text-[#a1a1a1]'}
            style={{ fontFamily: 'Consolas, monospace', fontSize: '0.75rem' }}
          >
            {t.main.singleExecution}
          </p>
        </div>

        {/* Edit Button */}
        <button
          onClick={() => onEdit(id)}
          className={`p-2 rounded-lg transition-all flex-shrink-0 ${
            isWin98
              ? 'win98-button'
              : 'bg-[#f3f4f6] hover:bg-gray-200 text-[#4a5565]'
          }`}
          aria-label="Editar tarefa"
        >
          <Edit2 size={16} strokeWidth={1.5} color={isWin98 ? '#000000' : undefined} />
        </button>
      </div>
    </div>
  );
});
