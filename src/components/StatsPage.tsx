import { ActivityCategory, ATTR_ICON, ATTR_INK, ATTR_LABEL } from '../types/attributes';
import { useTranslation, Language } from '../utils/i18n';
import { getPassive } from '../utils/passives';
import type { CarePattern } from '../utils/carePattern';
import { PixelTag } from './pixel/PixelKit';

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

  // Sort activities by completion count
  const sortedActivityStats = Object.entries(activityStats)
    .filter(([key]) => key.startsWith('activity-'))
    .sort((a, b) => b[1].completionCount - a[1].completionCount);

  // Sort tasks by completion count
  const sortedTaskStats = Object.entries(activityStats)
    .filter(([key]) => key.startsWith('task-'))
    .sort((a, b) => b[1].completionCount - a[1].completionCount);

  // Cores explícitas (não classes Tailwind pré-compiladas): os tons *-600/700
  // do Tailwind são calibrados para tema claro e ficam ilegíveis (baixo
  // contraste) sobre --sm-bg escuro (#0e2323). Usamos hex vibrantes o
  // suficiente para o fundo escuro forçado do app.
  const getCategoryColor = (category: ActivityCategory) => {
    switch (category) {
      case 'Health': return '#ff8a8a';
      case 'Study': return '#7cb0ff';
      case 'Social': return '#4ade80';
      case 'Creativity': return 'var(--sm-primary)';
      default: return 'var(--sm-muted)';
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
        background: 'var(--sm-bg)',
      }}
    >
      <span style={{ fontSize: 26, lineHeight: 1 }}>{emoji}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.9rem', color: 'var(--sm-ink)' }}>{title}</p>
        <p style={{ margin: '2px 0 0', fontSize: '0.76rem', lineHeight: 1.45, color: 'var(--sm-muted)' }}>{desc}</p>
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
        <div className="rounded-2xl px-4 py-3 sm-card">
          <p style={{
            fontSize: '0.72rem', letterSpacing: 1, fontWeight: 800, margin: '0 0 10px',
            color: 'var(--sm-muted)',
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
                  /* Pilula -> etiqueta emoldurada do kit (portao T2). */
                  <PixelTag key={id}>{form?.name ?? id}</PixelTag>
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
                background: 'var(--sm-bg)',
              }}>
                <p style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: 'var(--sm-ink)' }}>
                  {row.value}
                </p>
                <p style={{ margin: 0, fontSize: '0.68rem', lineHeight: 1.3, color: 'var(--sm-muted)' }}>
                  {row.label}
                </p>
              </div>
            ))}
          </div>

          {journey.soulGoal && (
            <p style={{
              margin: '12px 0 0', fontSize: '0.76rem', lineHeight: 1.5, fontStyle: 'italic',
              color: 'var(--sm-muted)',
            }}>
              {isPt ? 'Começou por: ' : 'Started for: '}“{journey.soulGoal}”
            </p>
          )}
        </div>
      )}

      {/* Overview: Bits/XP/Streak + attribute points */}
      <div className="rounded-2xl px-4 py-3 sm-card">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span style={{ fontSize: '0.9rem' }}>💠</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--sm-muted)' }}>Bits</span>
            <span className="text-sm font-bold" style={{ color: 'var(--sm-ink)' }}>{gamePoints}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ fontSize: '0.9rem' }}>⚡</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--sm-muted)' }}>XP</span>
            <span className="text-sm font-bold" style={{ color: 'var(--sm-ink)' }}>{totalXP}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span style={{ fontSize: '0.9rem' }}>⭐</span>
            <span className="text-xs font-semibold" style={{ color: 'var(--sm-muted)' }}>
              {isPt ? 'Dias perfeitos (total)' : 'Perfect days (total)'}
            </span>
            <span className="text-sm font-bold" style={{ color: 'var(--sm-ink)' }}>{streakDays}</span>
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap mt-2 pt-2" style={{ borderTop: '1px solid var(--sm-line)' }}>
          {/* Nomes internos (`virus`/`data`/`vaccine`) NUNCA vão à tela: o
              jogador conhece Poder, Harmonia e Benevolência. Rótulo, cor de
              texto e ícone saem todos de `types/attributes.ts`, que é a fonte
              única — antes esta tela repetia os hex à mão e escrevia os nomes
              internos, em inglês, sem par PT-BR. */}
          {([
            ['virus', virusPoints],
            ['data', dataPoints],
            ['vaccine', vaccinePoints],
          ] as const).map(([attr, pontos]) => (
            <div key={attr} className="flex items-center gap-1.5">
              <img
                src={ATTR_ICON[attr]}
                alt=""
                width={20}
                height={20}
                style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
              />
              <span className="text-xs" style={{ color: 'var(--sm-muted)' }}>
                {isPt ? ATTR_LABEL[attr].pt : ATTR_LABEL[attr].en}
              </span>
              <span className="text-xs font-bold" style={{ color: ATTR_INK[attr] }}>{pontos}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Completions */}
      <div>
        <h3
          className="mb-3"
          style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sm-ink)' }}
        >
          {t.evolution.completed_activities}
        </h3>
        {sortedActivityStats.length === 0 ? (
          <p
            className="text-center py-8"
            style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--sm-muted)' }}
          >
            {t.evolution.no_activities}
          </p>
        ) : (
          <div className="space-y-2">
            {sortedActivityStats.map(([key, stat]) => (
              <div
                key={key}
                className="p-4 rounded-xl flex items-center justify-between sm-card"
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.5rem' }}>{stat.emoji}</span>
                  <div>
                    <p
                      style={{ fontFamily: 'monospace', fontSize: '0.9375rem', color: 'var(--sm-ink)' }}
                    >
                      {stat.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ fontFamily: 'monospace', color: getCategoryColor(stat.category) }}
                    >
                      {stat.category}
                    </p>
                  </div>
                </div>
                <div
                  className="px-4 py-2 rounded-lg"
                  style={{
                    fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '600',
                    background: 'var(--sm-primary-soft)', color: 'var(--sm-primary)',
                  }}
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
          className="mb-3"
          style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sm-ink)' }}
        >
          {t.evolution.completed_tasks}
        </h3>
        {sortedTaskStats.length === 0 ? (
          <p
            className="text-center py-8"
            style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--sm-muted)' }}
          >
            {t.evolution.no_tasks}
          </p>
        ) : (
          <div className="space-y-2">
            {sortedTaskStats.map(([key, stat]) => (
              <div
                key={key}
                className="p-4 rounded-xl flex items-center justify-between sm-card"
              >
                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '1.5rem' }}>{stat.emoji}</span>
                  <div>
                    <p
                      style={{ fontFamily: 'monospace', fontSize: '0.9375rem', color: 'var(--sm-ink)' }}
                    >
                      {stat.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ fontFamily: 'monospace', color: getCategoryColor(stat.category) }}
                    >
                      {stat.category}
                    </p>
                  </div>
                </div>
                <div
                  className="px-4 py-2 rounded-lg"
                  style={{
                    fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: '600',
                    background: 'rgba(74,222,128,0.16)', color: '#4ade80',
                  }}
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
          className="mb-3"
          style={{ fontFamily: 'monospace', fontSize: '0.9375rem', fontWeight: '500', color: 'var(--sm-ink)' }}
        >
          {t.evolution.recent_history}
        </h3>
        {completedTasks.length === 0 ? (
          <p
            className="text-center py-8"
            style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--sm-muted)' }}
          >
            {t.evolution.no_history}
          </p>
        ) : (
          <div className="space-y-2">
            {completedTasks.slice(-50).reverse().map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl flex items-center justify-between sm-card"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span style={{ fontSize: '1.25rem' }}>{task.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p
                      className="truncate"
                      style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--sm-ink)' }}
                    >
                      {task.name}
                    </p>
                    <p
                      className="text-xs"
                      style={{ fontFamily: 'monospace', color: getCategoryColor(task.category) }}
                    >
                      {task.category}
                    </p>
                  </div>
                </div>
                <p
                  className="text-xs ml-3 whitespace-nowrap"
                  style={{ fontFamily: 'monospace', color: 'var(--sm-muted)' }}
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
