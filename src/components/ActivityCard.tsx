import { memo } from 'react';
import { StepRow } from './StepRow';
import iconEdit from '../assets/soulmon/icons/icon-edit.png';
import { Language } from '../utils/i18n';
import { PixelCheckbox, PixelPanel, PixelSegmentedBar } from './pixel/PixelKit';
import type { ActivityCategory } from '../types/attributes';
import { categoryIconImg } from '../types/category-icons';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface ActivityCardProps {
  id: string;
  name: string;
  /** Emoji gravado na atividade — fallback quando a categoria não tem ícone. */
  emoji?: string;
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
  emoji,
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
  const isPt = language === 'pt-BR';
  // Ícone emoldurado do kit no lugar do emoji do sistema (ver TaskCard).
  const catIcon = categoryIconImg(category);
  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const activityComplete = totalSteps > 0 
    ? completedSteps === totalSteps 
    : isCompleted;

  // Weekday labels — nasce em EN com par PT-BR, como todo texto de UI.
  const daysLabels = isPt
    ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div>
      <PixelPanel style={isDisabled ? { opacity: 0.5 } : activityComplete ? { opacity: 0.72 } : undefined}>
        {/* Header row: checkbox + nome + edit button */}
        <div className="flex items-center gap-4 mb-3">
          {/* Checkbox - sempre presente quando NÃO tem steps */}
          {totalSteps === 0 && (
            /* Quadrado de cobre da referência; o alvo de 44×44 e o
               <button role="checkbox"> continuam dentro do primitivo. */
            <PixelCheckbox
              checked={isCompleted}
              disabled={isDisabled || isCompleted}
              onToggle={() => onToggleCompletion?.(id)}
              language={language}
              labelPt={isCompleted ? 'Atividade concluída' : 'Marcar atividade como concluída'}
              labelEn={isCompleted ? 'Activity completed' : 'Mark activity as completed'}
            />
          )}

          {/* Nome da atividade */}
          <div className="flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: activityComplete ? 'var(--sm-muted)' : 'var(--sm-ink)' }}>
                {catIcon
                  ? <img src={catIcon} alt="" className="sm-px-cat-icon" style={{ display: 'inline-block', marginRight: 8 }} />
                  : emoji ? <>{emoji} </> : null}
                {name}
              </h3>
            </div>

            {/* Descritor de frequência — só aparece pra atividades
                RECORRENTES (chips de dia), que carregam informação nova por
                card. Pra atividades avulsas ("realização única") a rotulagem
                embaixo de CADA card era ruído puro: toda ficha ali tem o
                mesmo texto. */}
            {!isSingleExecution && (
              <div className="flex gap-1 items-center flex-wrap" style={{ marginTop: 4 }}>
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
              </div>
            )}
          </div>

          {/* Edit button */}
          <button
            onClick={() => onEditActivity(id)}
            className="flex items-center justify-center transition-all shrink-0"
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
            <div className="mb-4 flex items-center gap-3">
              {/* Barra SEGMENTADA (um bloco por etapa) no lugar da barra lisa —
                  é a leitura do v-pet da referência, e além de estética ela diz
                  quantas etapas faltam sem precisar ler o "3/5" ao lado. */}
              <div className="flex-1">
                <PixelSegmentedBar
                  value={completedSteps}
                  max={totalSteps}
                  segments={totalSteps}
                  height={12}
                  label={isPt ? 'Progresso das etapas' : 'Step progress'}
                />
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--sm-muted)', fontWeight: 600 }}>
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
      </PixelPanel>
    </div>
  );
});
