import { lazy, Suspense } from 'react';
import { ActivityCategory } from '../types/attributes';
import { Language } from '../utils/i18n';

const StatsModal = lazy(() => import('./StatsModal').then(m => ({ default: m.StatsModal })));
const GuideModal = lazy(() => import('./GuideModal').then(m => ({ default: m.GuideModal })));

interface CompletedTask {
  id: string;
  name: string;
  category: ActivityCategory;
  emoji: string;
  completedAt: string;
}

interface ActivityStats {
  [activityId: string]: {
    name: string;
    emoji: string;
    category: ActivityCategory;
    completionCount: number;
  };
}

interface ContentModalsProps {
  statsModalOpen: boolean;
  onCloseStats: () => void;
  completedTasks: CompletedTask[];
  activityStats: ActivityStats;
  guideModalOpen: boolean;
  onCloseGuide: () => void;
  theme: 'default' | 'win98' | 'glitch';
  language: Language;
}

export function ContentModals({
  statsModalOpen,
  onCloseStats,
  completedTasks,
  activityStats,
  guideModalOpen,
  onCloseGuide,
  theme,
  language,
}: ContentModalsProps) {
  return (
    <>
      {/* Stats Modal */}
      {statsModalOpen && (
        <Suspense fallback={null}>
          <StatsModal
            isOpen={statsModalOpen}
            onClose={onCloseStats}
            completedTasks={completedTasks}
            activityStats={activityStats}
            theme={theme}
            language={language}
          />
        </Suspense>
      )}

      {/* Guide Modal */}
      {guideModalOpen && (
        <Suspense fallback={null}>
          <GuideModal
            isOpen={guideModalOpen}
            onClose={onCloseGuide}
            theme={theme}
          />
        </Suspense>
      )}
    </>
  );
}
