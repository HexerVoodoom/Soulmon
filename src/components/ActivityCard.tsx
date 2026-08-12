import { memo } from 'react';
import { StepRow } from './StepRow';
import iconEdit from '../assets/soulmon/icons/icon-edit.png';
import { Progress } from './ui/progress';
import { Language, useTranslation } from '../utils/i18n';
import type { ActivityCategory } from '../types/attributes';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface ActivityCardProps {
  id: string;
  name: string;
  category?: ActivityCategory;
  steps: Step[];
  weekDays?: number[]; // 0-6 (domingo a sábado)
  onUpdateStep: (activityId: string, stepId: string) => void;
  onEditActivity: (activityId: string) => void;
  onToggleCompletion?: (activityId: string) => void; // Para atividades sem etapas
  isExpanded?: boolean;
  isCompleted?: boolean;
  isDisabled?: boolean;
  isSingleExecution?: boolean; // Se é execução única
  language?: Language;
}

export const ActivityCard = memo(function ActivityCard({
  id,
  name,
  category,
  steps,
  weekDays = [],
  onUpdateStep,
  onEditActivity,
  onToggleCompletion,
  isExpanded = true,
  isCompleted = false,
  isDisabled = false,
  isSingleExecution = false,
  language = 'en-US',
}: ActivityCardProps) {
  const t = useTranslation(language);
  const isPt = language === 'pt-BR';
  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const activityComplete = totalSteps > 0 
    ? completedSteps === totalSteps 
    : isCompleted;

  // Weekday labels
  const daysLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <div className={`rounded-2xl p-4 transition-all w-full overflow-hidden border ${
        isDisabled
          ? 'bg-gray-100 border-gray-300 opacity-50'
          : activityComplete
            ? 'sm-card opacity-70'
            : 'sm-card'
      }`}>
        {/* Header row: checkbox + nome + edit button */}
        <div className="flex items-center gap-3 mb-2">
          {/* Checkbox - sempre presente quando NÃO tem steps */}
          {totalSteps === 0 && (
            <button
              type="button"
              role="checkbox"
              aria-checked={isCompleted}
              aria-label={isPt ? (isCompleted ? 'Atividade concluída' : 'Marcar atividade como concluída') : (isCompleted ? 'Activity completed' : 'Mark activity as completed')}
              disabled={isDisabled || isCompleted}
              onClick={isDisabled || isCompleted ? undefined : () => onToggleCompletion?.(id)}
              /* 44×44 de toque, círculo de 28px dentro. As classes w-7/h-7 não
                 existem no index.css pré-compilado e o alvo saía com 2px. */
              style={{ width: 44, height: 44, padding: 8, background: 'none', border: 'none', opacity: isDisabled ? 0.5 : 1 }}
              className="flex items-center justify-center flex-shrink-0"
            >
              <span
                aria-hidden="true"
                style={{
                  width: 28, height: 28, borderRadius: 999, display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  background: 'var(--sm-surface)',
                  border: `2px solid ${isCompleted ? 'var(--sm-primary)' : 'var(--sm-gold)'}`,
                  boxShadow: isCompleted ? '0 0 8px color-mix(in srgb, var(--sm-primary) 65%, transparent), 0 0 2px var(--sm-primary)' : 'none',
                  transition: 'box-shadow .15s ease, border-color .15s ease',
                }}
              >
                {isCompleted && (
                  <svg width="16" height="16" viewBox="0 0 14 14" fill="none">
                    <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="var(--sm-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </span>
            </button>
          )}

          {/* Nome da atividade */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className={`${
                activityComplete ? 'text-[#6b7280]' : 'text-[#101828]'
              }`} style={{ fontFamily: 'Consolas, monospace', fontSize: '0.9375rem', fontWeight: '400' }}>
                {name}
              </h3>
            </div>

            {/* Descritor de frequência */}
            <p className={activityComplete ? 'text-[#9ca3af]' : 'text-[#a1a1a1]'} style={{ fontFamily: 'Consolas, monospace', fontSize: '0.75rem' }}>
              {isSingleExecution ? (
                t.main.singleExecution
              ) : (
                <span className="flex gap-1 items-center flex-wrap">
                  {daysLabels.map((label, index) => {
                    const isActive = weekDays.includes(index);
                    return (
                      <span
                        key={index}
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: 8,
                          background: isActive ? 'var(--sm-primary-soft)' : 'transparent',
                          color: isActive ? 'var(--sm-primary)' : 'var(--sm-muted)',
                        }}
                      >
                        {label}
                      </span>
                    );
                  })}
                </span>
              )}
            </p>
          </div>

          {/* Edit button */}
          <button
            onClick={() => onEditActivity(id)}
            className="flex items-center justify-center transition-all flex-shrink-0"
            aria-label={isPt ? 'Editar atividade' : 'Edit activity'}
            /* 44×44: alvo de toque mínimo. Inline porque a classe utilitária
               correspondente não existe no index.css pré-compilado. */
            style={{ minWidth: 44, minHeight: 44, background: 'none', border: 'none' }}
          >
            <img src={iconEdit} alt="" width={26} height={26} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          </button>
        </div>

        {/* Steps section */}
        {isExpanded && totalSteps > 0 && (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex-1">
                <Progress
                  value={progressPercentage}
                  className="h-2 bg-[#f3f4f6]"
                  indicatorClassName="bg-[#101828]"
                />
              </div>
              <span className="text-[#6a7282]" style={{ fontFamily: 'Consolas, monospace', fontSize: '0.8125rem' }}>
                {completedSteps}/{totalSteps}
              </span>
            </div>

            <div className="space-y-2">
              {steps.map((step) => (
                <StepRow
                  key={step.id}
                  id={step.id}
                  label={step.label}
                  completed={step.completed}
                  onToggle={isDisabled ? () => {} : (stepId) => onUpdateStep(id, stepId)}
                  disabled={isDisabled}
                  language={language}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
});
