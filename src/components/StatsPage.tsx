import { ActivityCategory } from '../types/attributes';
import { useTranslation, Language } from '../utils/i18n';
import { getPassive } from '../utils/passives';
import type { CarePattern } from '../utils/carePattern';

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
  language?: Language;
  gamePoints?: number;
  totalXP?: number;
  streakDays?: number;
  virusPoints?: number;
  dataPoints?: number;
  vaccinePoints?: number;
  /** Traço de nascimento do pet (utils/passives.ts). */
  petPassive?: string;
  /** Ritmo de cuidado lido do histórico (utils/carePattern.ts). */
  carePattern?: CarePattern | null;
  /** Vitrine da jornada: o que este Soulmon já viveu. */
  journey?: {
    unlockedEvolutions?: string[];
    soulmonStages?: Array<{ name: string; stage: string; branch?: string }>;
    totalPerfectDays?: number;
    dungeonKills?: number;
    dungeonRunsCompleted?: number;
    dinoBest?: number;
    droppedItems?: string[];
    soulGoal?: string;
  };
}

export function StatsPage({
  completedTasks,
  activityStats,
  theme = 'default',
  language = 'en-US',
  gamePoints = 0,
  totalXP = 0,
  streakDays = 0,
  virusPoints = 0,
  dataPoints = 0,
  vaccinePoints = 0,
  petPassive,
  carePattern,
  journey,
}: StatsPageProps) {
  const passive = getPassive(petPassive);
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

  const isPt = language === 'pt-BR';

  // Cartão de identidade/ritmo: mesmo visual para traço e padrão de cuidado.
  const traitCard = (emoji: string, title: string, desc: string) => (
    <div
      key={title}
      style={{
        display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 14px', borderRadius: 14,
        background: isGlitch ? 'rgba(0,255,255,0.08)' : isWin98 ? '#c0c0c0' : 'var(--sm-bg)',
        border: isWin98 ? '2px inset #ffffff' : 'none',
      }}
    >
      <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: isGlitch ? '#00ffff' : isWin98 ? '#000000' : 'var(--sm-ink)' }}>{title}</p>
        <p style={{ margin: '2px 0 0', fontSize: '0.76rem', lineHeight: 1.45, color: isGlitch ? '#5fbcbc' : isWin98 ? '#444444' : 'var(--sm-muted)' }}>{desc}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Identidade: o traço de nascimento e o ritmo de cuidado. Fica ANTES dos
          números porque é quem este Soulmon é, não quanto ele rendeu. */}
      {(passive || carePattern) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {passive && traitCard(passive.emoji, isPt ? passive.namePt : passive.nameEn, isPt ? passive.descPt : passive.descEn)}
          {carePattern && traitCard(
            carePattern.emoji,
            `${isPt ? 'Ritmo: ' : 'Rhythm: '}${isPt ? carePattern.namePt : carePattern.nameEn}`,
            isPt ? carePattern.descPt : carePattern.descEn,
          )}
        </div>
      )}

      {/* A jornada — memória, não placar. Nada aqui vale ponto. */}
      {journey && (
        <div
          className={`rounded-2xl px-4 py-3 ${isGlitch ? 'glitch-activity-card' : isWin98 ? 'win98-activity-card' : 'sm-card'}`}
        >
          <p style={{
            fontSize: '0.72rem', letterSpacing: 1, fontWeight: 800, margin: '0 0 10px',
            color: isGlitch ? '#00ffff' : isWin98 ? '#000080' : 'var(--sm-muted)',
          }}>
            {isPt ? 'A JORNADA DESTE SOULMON' : "THIS SOULMON'S JOURNEY"}
          </p>

          {!!journey.unlockedEvolutions?.length && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {journey.unlockedEvolutions.map(id => {
                const form = journey.soulmonStages?.find(
                  st => (st.branch ? `${st.stage}-${st.branch}` : st.stage) === id,
                );
                return (
                  <span key={id} style={{
                    fontSize: '0.72rem', padding: '4px 9px', borderRadius: 999, fontWeight: 700,
                    background: isGlitch ? 'rgba(0,255,255,0.12)' : isWin98 ? '#ffffff' : 'var(--sm-primary-soft)',
                    color: isGlitch ? '#00ffff' : isWin98 ? '#000000' : 'var(--sm-primary)',
                  }}>
                    {form?.name ?? id}
                  </span>
                );
              })}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))', gap: 8 }}>
            {[
              { label: isPt ? 'Dias perfeitos' : 'Perfect days', value: journey.totalPerfectDays ?? 0 },
              { label: isPt ? 'Inimigos vencidos' : 'Enemies beaten', value: journey.dungeonKills ?? 0 },
              { label: isPt ? 'Runs concluídas' : 'Runs cleared', value: journey.dungeonRunsCompleted ?? 0 },
              { label: isPt ? 'Recorde no Dino' : 'Dino best', value: journey.dinoBest ?? 0 },
              { label: isPt ? 'Itens raros achados' : 'Rare items found', value: journey.droppedItems?.length ?? 0 },
            ].map(row => (
              <div key={row.label} style={{
                padding: '9px 11px', borderRadius: 10,
                background: isGlitch ? 'rgba(0,255,255,0.06)' : isWin98 ? '#c0c0c0' : 'var(--sm-bg)',
                border: isWin98 ? '2px inset #ffffff' : 'none',
              }}>
                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: isGlitch ? '#00ffff' : isWin98 ? '#000000' : 'var(--sm-ink)' }}>
                  {row.value}
                </p>
                <p style={{ margin: 0, fontSize: '0.68rem', lineHeight: 1.3, color: isGlitch ? '#5fbcbc' : isWin98 ? '#444444' : 'var(--sm-muted)' }}>
                  {row.label}
                </p>
              </div>
            ))}
          </div>

          {journey.soulGoal && (
            <p style={{
              margin: '12px 0 0', fontSize: '0.76rem', lineHeight: 1.5, fontStyle: 'italic',
              color: isGlitch ? '#5fbcbc' : isWin98 ? '#444444' : 'var(--sm-muted)',
            }}>
              {isPt ? 'Começou por: ' : 'Started for: '}“{journey.soulGoal}”
            </p>
          )}
        </div>
      )}

      {/* Overview: Bits/XP/Streak + attribute points */}
      <div
        className={`rounded-2xl px-4 py-3 ${
          isGlitch
            ? 'glitch-activity-card'
            : isWin98
              ? 'win98-activity-card'
              : 'sm-card'
        }`}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span style={{ fontSize: '0.9rem' }}>💠</span>
            <span className="text-xs font-semibold" style={{ color: isGlitch ? 'rgba(0,255,255,0.7)' : isWin98 ? '#000' : 'var(--sm-muted)', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>Bits</span>
            <span className="text-sm font-bold" style={{ color: isGlitch ? '#00ffff' : isWin98 ? '#000080' : 'var(--sm-ink)', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>{gamePoints}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ fontSize: '0.9rem' }}>⚡</span>
            <span className="text-xs font-semibold" style={{ color: isGlitch ? 'rgba(0,255,255,0.7)' : isWin98 ? '#000' : 'var(--sm-muted)', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>XP</span>
            <span className="text-sm font-bold" style={{ color: isGlitch ? '#00ffff' : isWin98 ? '#000080' : 'var(--sm-ink)', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>{totalXP}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ fontSize: '0.9rem' }}>🔥</span>
            <span className="text-xs font-semibold" style={{ color: isGlitch ? 'rgba(0,255,255,0.7)' : isWin98 ? '#000' : 'var(--sm-muted)', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>
              {isPt ? 'Sequência (dias)' : 'Streak (Days)'}
            </span>
            <span className="text-sm font-bold" style={{ color: isGlitch ? '#00ffff' : isWin98 ? '#000080' : 'var(--sm-ink)', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>{streakDays}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap mt-2 pt-2" style={{ borderTop: `1px solid ${isGlitch ? 'rgba(0,255,255,0.2)' : isWin98 ? '#808080' : 'var(--sm-line)'}` }}>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: isGlitch ? 'rgba(0,255,255,0.7)' : isWin98 ? '#000' : 'var(--sm-muted)', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>Virus</span>
            <span className="text-xs font-bold" style={{ color: '#22A900', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>{virusPoints}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: isGlitch ? 'rgba(0,255,255,0.7)' : isWin98 ? '#000' : 'var(--sm-muted)', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>Data</span>
            <span className="text-xs font-bold" style={{ color: '#009ED8', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>{dataPoints}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs" style={{ color: isGlitch ? 'rgba(0,255,255,0.7)' : isWin98 ? '#000' : 'var(--sm-muted)', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>Vaccine</span>
            <span className="text-xs font-bold" style={{ color: '#E69600', fontFamily: isGlitch || isWin98 ? 'monospace' : undefined }}>{vaccinePoints}</span>
          </div>
        </div>
      </div>

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
                    : 'bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/50'
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
                    : 'bg-white rounded-2xl shadow-sm ring-1 ring-gray-200/50'
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
                    : 'bg-white border border-gray-100'
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
  );
}
