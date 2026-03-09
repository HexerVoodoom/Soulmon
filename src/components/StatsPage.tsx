import { ActivityCategory } from '../types/attributes';

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

interface StatsPageProps {
  completedTasks: CompletedTask[];
  activityStats: ActivityStats;
  theme?: 'default' | 'win98' | 'glitch';
}

export function StatsPage({
  completedTasks,
  activityStats,
  theme = 'default',
}: StatsPageProps) {
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
    switch(category) {
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

    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* Activity Completions */}
      <div>
        <h3
          className={`mb-3 ${
            isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
          }`}
          style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
        >
          🎯 Atividades Completadas
        </h3>
        {sortedActivityStats.length === 0 ? (
          <p
            className={`text-center py-8 ${
              isGlitch ? 'text-[#00ffff]/50' : isWin98 ? 'text-[#808080]' : 'text-gray-400'
            }`}
            style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
          >
            Nenhuma atividade completada ainda
          </p>
        ) : (
          <div className="space-y-2">
            {sortedActivityStats.map(([key, stat]) => (
              <div
                key={key}
                className={`p-4 rounded-xl flex items-center justify-between ${
                  isGlitch
                    ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30'
                    : isWin98
                    ? 'win98-button bg-white'
                    : 'bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.5rem' }}>{stat.emoji}</span>
                  <div>
                    <p
                      className={`${
                        isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
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
                  className={`px-4 py-2 rounded-lg ${
                    isGlitch
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
          className={`mb-3 ${
            isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
          }`}
          style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
        >
          ✅ Tarefas Únicas Completadas
        </h3>
        {sortedTaskStats.length === 0 ? (
          <p
            className={`text-center py-8 ${
              isGlitch ? 'text-[#00ffff]/50' : isWin98 ? 'text-[#808080]' : 'text-gray-400'
            }`}
            style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
          >
            Nenhuma tarefa completada ainda
          </p>
        ) : (
          <div className="space-y-2">
            {sortedTaskStats.map(([key, stat]) => (
              <div
                key={key}
                className={`p-4 rounded-xl flex items-center justify-between ${
                  isGlitch
                    ? 'bg-[#0a0a0a] border-2 border-[#00ffff]/30'
                    : isWin98
                    ? 'win98-button bg-white'
                    : 'bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.5rem' }}>{stat.emoji}</span>
                  <div>
                    <p
                      className={`${
                        isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
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
                  className={`px-4 py-2 rounded-lg ${
                    isGlitch
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
          className={`mb-3 ${
            isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
          }`}
          style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500' }}
        >
          🕒 Recent History (last 50)
        </h3>
        {completedTasks.length === 0 ? (
          <p
            className={`text-center py-8 ${
              isGlitch ? 'text-[#00ffff]/50' : isWin98 ? 'text-[#808080]' : 'text-gray-400'
            }`}
            style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
          >
            Nenhuma tarefa no histórico
          </p>
        ) : (
          <div className="space-y-2">
            {completedTasks.slice(-50).reverse().map((task) => (
              <div
                key={task.id}
                className={`p-3 rounded-xl flex items-center justify-between ${
                  isGlitch
                    ? 'bg-[#0a0a0a] border border-[#00ffff]/20'
                    : isWin98
                    ? 'win98-inset bg-white'
                    : 'bg-white border border-gray-100'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span style={{ fontSize: '1.25rem' }}>{task.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`truncate ${
                        isGlitch ? 'text-[#00ffff]' : isWin98 ? 'text-[#000000]' : 'text-gray-900'
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
                  className={`text-xs ml-3 whitespace-nowrap ${
                    isGlitch ? 'text-[#00ffff]/60' : isWin98 ? 'text-[#808080]' : 'text-gray-400'
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
  );
}
