import { StepRow } from './StepRow';
import { Edit2 } from 'lucide-react';
import { Progress } from './ui/progress';
import { Language, useTranslation } from '../utils/i18n';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface ActivityCardProps {
  id: string;
  name: string;
  steps: Step[];
  weekDays?: number[]; // 0-6 (domingo a sábado)
  onUpdateStep: (activityId: string, stepId: string) => void;
  onEditActivity: (activityId: string) => void;
  onToggleCompletion?: (activityId: string) => void; // Para atividades sem etapas
  isExpanded?: boolean;
  isCompleted?: boolean;
  isDisabled?: boolean;
  isSingleExecution?: boolean; // Se é execução única
  theme?: 'default' | 'win98';
  language?: Language;
}

export function ActivityCard({
  id,
  name,
  steps,
  weekDays = [],
  onUpdateStep,
  onEditActivity,
  onToggleCompletion,
  isExpanded = true,
  isCompleted = false,
  isDisabled = false,
  isSingleExecution = false,
  theme = 'default',
  language = 'en-US',
}: ActivityCardProps) {
  const isWin98 = theme === 'win98';
  const t = useTranslation(language);
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
          : isWin98 
            ? 'win98-activity-card'
            : activityComplete 
              ? 'bg-[#f5f5f5] border-[#d1d5dc] shadow-[0px_0px_0px_1px_rgba(229,231,235,0.5),0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]' 
              : 'bg-white border-[#c0c0c0] shadow-[0px_0px_0px_1px_rgba(229,231,235,0.5),0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)]'
      }`}>
        {/* Header row: checkbox + nome + edit button */}
        <div className="flex items-center gap-3 mb-2">
          {/* Checkbox - sempre presente quando NÃO tem steps */}
          {totalSteps === 0 && (
            <div 
              onClick={isDisabled ? undefined : () => onToggleCompletion?.(id)}
              className={`w-6 h-6 rounded-lg border flex items-center justify-center cursor-pointer transition-all flex-shrink-0 ${
                isDisabled
                  ? 'opacity-50 cursor-not-allowed border-[#d1d5dc]'
                  : isCompleted
                  ? 'bg-[#22c55e] border-[#22c55e]'
                  : isWin98
                  ? 'border-[#d1d5dc] bg-white hover:bg-gray-50'
                  : 'border-[#d1d5dc] bg-white hover:bg-gray-50'
              }`}
            >
              {isCompleted && (
                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 14 14">
                  <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="1.16667" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
          )}

          {/* Nome da atividade */}
          <div className="flex-1">
            <h3 className={`${
              activityComplete ? 'text-[#6b7280]' : 'text-[#101828]'
            }`} style={{ fontFamily: 'Consolas, monospace', fontSize: '0.9375rem', fontWeight: '400' }}>
              {name}
            </h3>
            
            {/* Descritor de frequência */}
            <p className={activityComplete ? 'text-[#9ca3af]' : 'text-[#a1a1a1]'} style={{ fontFamily: 'Consolas, monospace', fontSize: '0.75rem' }}>
              {isSingleExecution ? (
                t.main.singleExecution
              ) : (
                <span className="flex gap-2 items-center">
                  {daysLabels.map((label, index) => {
                    const isActive = weekDays.includes(index);
                    return (
                      <span 
                        key={index}
                        className={isActive ? 'text-[#2d2d2d]' : 'text-[#8f8f8f]'}
                        style={{ fontWeight: isActive ? 'bold' : 'normal' }}
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
            className={`p-2 rounded-lg transition-all flex-shrink-0 ${
              isWin98 
                ? 'win98-button'
                : 'bg-[#f3f4f6] hover:bg-gray-200 text-[#4a5565]'
            }`}
            aria-label="Editar atividade"
          >
            <Edit2 size={16} strokeWidth={1.5} color={isWin98 ? '#000000' : undefined} />
          </button>
        </div>

        {/* Steps section */}
        {isExpanded && totalSteps > 0 && (
          <>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex-1">
                <Progress 
                  value={progressPercentage} 
                  className={isWin98 ? 'h-2 bg-[#404040]' : 'h-2 bg-[#f3f4f6]'}
                  indicatorClassName={isWin98 ? 'bg-[#00ff41]' : 'bg-[#101828]'}
                />
              </div>
              <span className={isWin98 ? 'text-[#00ff41]' : 'text-[#6a7282]'} style={{ fontFamily: 'Consolas, monospace', fontSize: '0.8125rem' }}>
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
                  theme={theme}
                  disabled={isDisabled}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
