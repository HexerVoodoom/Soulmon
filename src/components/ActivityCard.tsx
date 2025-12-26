import { StepRow } from './StepRow';
import { Edit2 } from 'lucide-react';
import { Progress } from './ui/progress';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface ActivityCardProps {
  id: string;
  name: string;
  steps: Step[];
  onUpdateStep: (activityId: string, stepId: string) => void;
  onEditActivity: (activityId: string) => void;
  isExpanded?: boolean;
  isCompleted?: boolean;
  theme?: 'default' | 'win98' | 'glitch';
}

export function ActivityCard({ 
  id, 
  name, 
  steps, 
  onUpdateStep,
  onEditActivity,
  isExpanded = true,
  isCompleted = false,
  theme = 'default',
}: ActivityCardProps) {
  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';
  const completedSteps = steps.filter(s => s.completed).length;
  const totalSteps = steps.length;
  const progressPercentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
  const activityComplete = totalSteps > 0 && completedSteps === totalSteps;

  return (
    <div className="mb-6">
      <div className={`rounded-2xl p-5 transition-all ${
        isGlitch
          ? 'glitch-activity-card'
          : isWin98 
            ? 'win98-activity-card'
            : activityComplete 
              ? 'bg-white shadow-sm ring-1 ring-gray-200/50 opacity-60' 
              : 'bg-white shadow-sm ring-1 ring-gray-200/50'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {activityComplete && !isGlitch && !isWin98 && (
              <div className="rounded-full w-7 h-7 flex items-center justify-center bg-gray-900 text-white flex-shrink-0">
                ✓
              </div>
            )}
            {activityComplete && isGlitch && (
              <div className="rounded-full w-7 h-7 flex items-center justify-center bg-[#00ffff] text-black flex-shrink-0">
                ✓
              </div>
            )}
            {activityComplete && isWin98 && (
              <div className="rounded-full w-7 h-7 flex items-center justify-center bg-[#000080] text-white flex-shrink-0">
                ✓
              </div>
            )}
            <h3 className={`${
              isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000080]' : activityComplete ? 'text-gray-500' : 'text-gray-900'
            }`} style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}>
              {name}
            </h3>
          </div>
          <button
            onClick={() => onEditActivity(id)}
            className={`p-2 rounded-lg transition-all flex-shrink-0 ${
              isGlitch
                ? 'glitch-button'
                : isWin98 
                  ? 'win98-button'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
            }`}
            aria-label="Edit activity"
          >
            <Edit2 size={16} strokeWidth={1.5} color={isGlitch ? '#00ffff' : isWin98 ? '#000000' : undefined} />
          </button>
        </div>

        {isExpanded && (
          <>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex-1">
                <Progress 
                  value={progressPercentage} 
                  className={isWin98 ? 'h-2 bg-[#404040]' : isGlitch ? 'h-2 bg-gray-700' : 'h-2 bg-gray-100'}
                  indicatorClassName={isWin98 ? 'bg-[#00ff41]' : isGlitch ? 'bg-[#00ffff]' : 'bg-gray-900'}
                />
              </div>
              <span className={isWin98 ? 'text-[#00ff41]' : isGlitch ? 'text-[#00ffff]' : 'text-gray-500'} style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>
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
                  onToggle={(stepId) => onUpdateStep(id, stepId)}
                  theme={theme}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
