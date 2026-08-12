import { memo } from 'react';
import { Language, useTranslation } from '../utils/i18n';
import iconEdit from '../assets/soulmon/icons/icon-edit.png';

interface TaskCardProps {
  id: string;
  name: string;
  category: string;
  emoji: string;
  completed: boolean;
  onToggleComplete: (id: string) => void;
  onEdit: (id: string) => void;
  language?: Language;
}

export const TaskCard = memo(function TaskCard({
  id,
  name,
  emoji,
  completed,
  onToggleComplete,
  onEdit,
  language = 'en-US',
}: TaskCardProps) {
  const t = useTranslation(language);
  const isPt = language === 'pt-BR';

  return (
    <div
      className={`rounded-2xl p-4 transition-all w-full border ${
        completed ? 'sm-card opacity-70' : 'sm-card'
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
          aria-label={isPt ? (completed ? 'Tarefa concluída' : 'Marcar tarefa como concluída') : (completed ? 'Task completed' : 'Mark task as completed')}
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
              background: completed ? 'var(--sm-surface)' : 'var(--sm-surface)',
              border: `2px solid ${completed ? 'var(--sm-primary)' : 'var(--sm-gold)'}`,
              boxShadow: completed ? '0 0 8px color-mix(in srgb, var(--sm-primary) 65%, transparent), 0 0 2px var(--sm-primary)' : 'none',
              transition: 'box-shadow .15s ease, border-color .15s ease',
            }}
          >
            {completed && (
              <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="var(--sm-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
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
          className="flex items-center justify-center rounded-lg transition-all flex-shrink-0 bg-[#f3f4f6] hover:bg-gray-200 text-[#4a5565]"
          aria-label={isPt ? 'Editar tarefa' : 'Edit task'}
          /* 44×44 é o alvo de toque mínimo confortável; o padding do Tailwind
             dava 32×32. Inline porque min-w-11 não existe no index.css
             pré-compilado (footgun 1). */
          style={{ minWidth: 44, minHeight: 44 }}
        >
          <img src={iconEdit} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
        </button>
      </div>
    </div>
  );
});
