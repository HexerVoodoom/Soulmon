import { lazy, Suspense } from 'react';
import { Language } from '../utils/i18n';

const GuideModal = lazy(() => import('./GuideModal').then(m => ({ default: m.GuideModal })));

interface ContentModalsProps {
  guideModalOpen: boolean;
  onCloseGuide: () => void;
  theme: 'default' | 'win98' | 'glitch';
  language: Language;
}

export function ContentModals({
  guideModalOpen,
  onCloseGuide,
  theme,
  language,
}: ContentModalsProps) {
  return (
    <>
      {/* Guide Modal */}
      {guideModalOpen && (
        <Suspense fallback={null}>
          <GuideModal
            isOpen={guideModalOpen}
            onClose={onCloseGuide}
            theme={theme}
            language={language}
          />
        </Suspense>
      )}
    </>
  );
}
