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
          ? 'sm-card opacity-70'
          : 'sm-card'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Checkbox */}
        {/* Marcar como concluída é a AÇÃO CENTRAL do app. Era uma <div> com
            onClick: não recebia foco de teclado nem era anunciada por leitor de
            tela, ou seja, quem não usa o toque simplesmente não conseguia usar
            o app. Agora é um <button> com role de checkbox. */}
        <button
          type="button"
          role="checkbox"
          aria-checked={completed}
          aria-label={completed ? 'Tarefa concluída' : 'Marcar tarefa como concluída'}
          disabled={completed}
          onClick={() => { if (!completed) onToggleComplete(id); }}
          /* 44×44 de área de toque com o círculo de 28px desenhado dentro.
             w-7/h-7 NÃO existem no index.css pré-compilado — o alvo vinha
             saindo com 2px, praticamente invisível e impossível de acertar. */
          style={{ width: 44, height: 44, padding: 8, background: 'none', border: 'none' }}
          className="flex items-center justify-center flex-shrink-0 cursor-pointer"
        >
          <span
            aria-hidden="true"
            style={{
              width: 28, height: 28, borderRadius: 999, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              background: completed ? '#22c55e' : '#ffffff',
              border: `1px solid ${completed ? '#22c55e' : '#d1d5dc'}`,
            }}
          >
            {completed && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        </button>
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
          className={`flex items-center justify-center rounded-lg transition-all flex-shrink-0 ${
            isWin98
              ? 'win98-button'
              : 'bg-[#f3f4f6] hover:bg-gray-200 text-[#4a5565]'
          }`}
          aria-label="Editar tarefa"
          /* 44×44 é o alvo de toque mínimo confortável; o padding do Tailwind
             dava 32×32. Inline porque min-w-11 não existe no index.css
             pré-compilado (footgun 1). */
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <Edit2 size={16} strokeWidth={1.5} color={isWin98 ? '#000000' : undefined} />
        </button>
      </div>
    </div>
  );
});
