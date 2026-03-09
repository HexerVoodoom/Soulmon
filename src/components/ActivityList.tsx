import { Edit2 } from 'lucide-react';
import { ActivityCard } from './ActivityCard';

interface Step {
  id: string;
  label: string;
  completed: boolean;
}

interface Activity {
  id: string;
  name: string;
  emoji: string;
  steps: Step[];
}

interface ActivityListProps {
  activities: Activity[];
  onUpdateStep: (activityId: string, stepId: string) => void;
  onEditActivity: (activityId: string) => void;
}

export function ActivityList({ activities, onUpdateStep, onEditActivity }: ActivityListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 
          className="text-gray-800"
          style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 'bold' }}
        >
          DAILY ACTIVITIES
        </h2>
        <button
          onClick={() => {
            // This will open a menu to select which activity to edit
            // For now, we'll just show a visual indicator
          }}
          className="p-1.5 rounded transition-colors bg-gray-200 hover:bg-teal-300"
          aria-label="Edit mode"
        >
          <Edit2 size={16} />
        </button>
      </div>

      <div className="space-y-3">
        {activities.map(activity => {
          const isComplete = activity.steps.length > 0 && activity.steps.every(s => s.completed);
          return (
            <div key={activity.id} className="relative group">
              <ActivityCard
                id={activity.id}
                name={`${activity.emoji} ${activity.name}`}
                steps={activity.steps}
                onUpdateStep={onUpdateStep}
                isExpanded={true}
                isCompleted={isComplete}
              />
              <button
                onClick={() => onEditActivity(activity.id)}
                className="absolute top-3 right-3 p-1.5 rounded transition-all bg-gray-300 hover:bg-teal-300 opacity-0 group-hover:opacity-100"
                aria-label="Edit activity"
              >
                <Edit2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
