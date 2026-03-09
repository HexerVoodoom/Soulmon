import { X } from 'lucide-react';
import { ActivityCategory } from '../types/attributes';
import { useTranslation, Language } from '../utils/i18n';

interface CompletedTask {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completedAt: string;
}

interface ActivityStats {
  [key: string]: {
    name: string;
    emoji: string;
    category: ActivityCategory;
    completionCount: number;
  };
}

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedTasks: CompletedTask[];
  activityStats: ActivityStats;
  theme?: 'default' | 'win98' | 'glitch';
  language?: Language;
}

export function StatsModal({
  isOpen,
  onClose,
  completedTasks,
  activityStats,
  theme = 'default',
  language = 'en-US',
}: StatsModalProps) {
  if (!isOpen) return null;

  const t = useTranslation(language);

  const isWin98 = theme === 'win98';
  const isGlitch = theme === 'glitch';

  // Sort activities by completion count
  const sortedActivityStats = Object.entries(activityStats)
    .filter(([key]) => key.startsWith('activity-'))
    .sort((a, b) => b[1].completionCount - a[1].completionCount);

  // Sort tasks by completion count
  const sortedTaskStats = Object.entries(activityStats)
    .filter(([key]) => key.startsWith('task-'))
    .sort((a, b) => b[1].completionCount - a[1].completionCount);

  const getCategoryColor = (category: ActivityCategory) => {
    switch (category) {
      case 'Health': return isGlitch ? 'text-[#ff0066]' : 'text-red-600';
      case 'Study': return isGlitch ? 'text-[#00ffff]' : 'text-blue-600';
      case 'Social': return isGlitch ? 'text-[#00ff00]' : 'text-green-600';
      case 'Creativity': return isGlitch ? 'text-[#ff00ff]' : 'text-teal-600';
      default: return 'text-gray-600';
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t.evolution.just_now;
    if (diffMins < 60) return `${diffMins}${t.evolution.mins_ago}`;
    if (diffHours < 24) return `${diffHours}${t.evolution.hours_ago}`;
    if (diffDays === 1) return t.evolution.yesterday;
    if (diffDays < 7) return `${diffDays}${t.evolution.days_ago}`;
    return date.toLocaleDateString(language, { day: '2-digit', month: 'short' });
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className={`w-full max-w-2xl rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden flex flex-col ${isGlitch
          ? 'bg-[#0a0a0a] border-2 border-[#00ffff]'
          : isWin98
            ? 'bg-[#c0c0c0] win98-window'
            : 'bg-white'
          }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-5 border-b flex-shrink-0 ${isGlitch
            ? 'border-[#00ffff]/30'
            : isWin98
              ? 'bg-gradient-to-r from-[#000080] to-[#1084d0] border-white'
              : 'border-gray-200'
            }`}
        >
          <h2
            className={`${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-white' : 'text-gray-900'
              }`}
            style={{ fontFamily: 'monospace', fontSize: '1.0625rem', fontWeight: '500' }}
          >
            {t.evolution.stats_history}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-all ${isGlitch
              ? 'hover:bg-[#ff0066]/20 text-[#ff0066]'
              : isWin98
                ? 'bg-[#c0c0c0] win98-button text-[#000000]'
                : 'hover:bg-gray-100 text-gray-500'
              }`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Activity Completions */}
          <div>
            <h3
              className={`mb-3 ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
                }`}
              style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
            >
              {t.evolution.completed_activities}
            </h3>
            {sortedActivityStats.length === 0 ? (
              <p
                className={`text-center py-8 ${isGlitch ? 'text-[#00ffff]/50' : isWin98 ? 'text-[#808080]' : 'text-gray-400'
                  }`}
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                {t.evolution.no_activities}
              </p>
            ) : (
              <div className="space-y-2">
                {sortedActivityStats.map(([key, stat]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-xl flex items-center justify-between ${isGlitch
                      ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30'
                      : isWin98
                        ? 'win98-button bg-white'
                        : 'bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '1.5rem' }}>{stat.emoji}</span>
                      <div>
                        <p
                          className={`${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
                            }`}
                          style={{ fontFamily: 'monospace', fontSize: '0.9375rem' }}
                        >
                          {stat.name}
                        </p>
                        <p
                          className={`text-xs ${getCategoryColor(stat.category)}`}
                          style={{ fontFamily: 'monospace' }}
                        >
                          {stat.category}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg ${isGlitch
                        ? 'bg-[#00ffff]/20 text-[#00ffff]'
                        : isWin98
                          ? 'bg-[#000080] text-white'
                          : 'bg-gradient-to-r from-[#2bff95]/20 to-teal-100 text-teal-700'
                        }`}
                      style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '600' }}
                    >
                      {stat.completionCount}×
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Task Completions */}
          <div>
            <h3
              className={`mb-3 ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
                }`}
              style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
            >
              {t.evolution.completed_tasks}
            </h3>
            {sortedTaskStats.length === 0 ? (
              <p
                className={`text-center py-8 ${isGlitch ? 'text-[#00ffff]/50' : isWin98 ? 'text-[#808080]' : 'text-gray-400'
                  }`}
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                {t.evolution.no_tasks}
              </p>
            ) : (
              <div className="space-y-2">
                {sortedTaskStats.map(([key, stat]) => (
                  <div
                    key={key}
                    className={`p-4 rounded-xl flex items-center justify-between ${isGlitch
                      ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30'
                      : isWin98
                        ? 'win98-button bg-white'
                        : 'bg-gray-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <span style={{ fontSize: '1.5rem' }}>{stat.emoji}</span>
                      <div>
                        <p
                          className={`${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
                            }`}
                          style={{ fontFamily: 'monospace', fontSize: '0.9375rem' }}
                        >
                          {stat.name}
                        </p>
                        <p
                          className={`text-xs ${getCategoryColor(stat.category)}`}
                          style={{ fontFamily: 'monospace' }}
                        >
                          {stat.category}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`px-4 py-2 rounded-lg ${isGlitch
                        ? 'bg-[#00ff00]/20 text-[#00ff00]'
                        : isWin98
                          ? 'bg-[#008000] text-white'
                          : 'bg-green-100 text-green-700'
                        }`}
                      style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '600' }}
                    >
                      {stat.completionCount}×
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Completed Tasks History */}
          <div>
            <h3
              className={`mb-3 ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
                }`}
              style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
            >
              {t.evolution.recent_history}
            </h3>
            {completedTasks.length === 0 ? (
              <p
                className={`text-center py-8 ${isGlitch ? 'text-[#00ffff]/50' : isWin98 ? 'text-[#808080]' : 'text-gray-400'
                  }`}
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
              >
                {t.evolution.no_history}
              </p>
            ) : (
              <div className="space-y-2">
                {completedTasks.slice(-50).reverse().map((task) => (
                  <div
                    key={task.id}
                    className={`p-3 rounded-xl flex items-center justify-between ${isGlitch
                      ? 'bg-[#0a0a0a] border border-[#00ffff]/20'
                      : isWin98
                        ? 'win98-inset bg-white'
                        : 'bg-gray-50 border border-gray-100'
                      }`}
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span style={{ fontSize: '1.25rem' }}>{task.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`truncate ${isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
                            }`}
                          style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                        >
                          {task.name}
                        </p>
                        <p
                          className={`text-xs ${getCategoryColor(task.category)}`}
                          style={{ fontFamily: 'monospace' }}
                        >
                          {task.category}
                        </p>
                      </div>
                    </div>
                    <p
                      className={`text-xs ml-3 whitespace-nowrap ${isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-[#808080]' : 'text-gray-400'
                        }`}
                      style={{ fontFamily: 'monospace' }}
                    >
                      {formatDate(task.completedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className={`flex gap-3 p-6 border-t flex-shrink-0 ${isGlitch ? 'border-[#00ffff]/30' : isWin98 ? 'border-white' : 'border-gray-200'
            }`}
        >
          <button
            onClick={onClose}
            className={`flex-1 py-3 px-4 rounded-xl transition-all ${isGlitch
              ? 'bg-[#00ffff] text-[#0a0a0a] hover:bg-[#00ffff]/90 border-2 border-[#00ffff]'
              : isWin98
                ? 'win98-button bg-[#c0c0c0] text-[#000000]'
                : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
            style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
}