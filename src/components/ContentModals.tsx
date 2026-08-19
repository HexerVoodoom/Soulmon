import { lazy, Suspense } from 'react';
import { Language } from '../utils/i18n';
import { ScreenSkeleton } from './ui/ScreenSkeleton';

const GuideModal = lazy(() => import('./GuideModal').then(m => ({ default: m.GuideModal })));

interface ContentModalsProps {
  guideModalOpen: boolean;
  onCloseGuide: () => void;
  language: Language;
}

export function ContentModals({
  guideModalOpen,
  onCloseGuide,
  language,
}: ContentModalsProps) {
  return (
    <>
      {/* Guide Modal */}
      {/* Era `fallback={null}`: abrir o guia num 3G apagava a tela por meio
          segundo e o toque parecia não ter funcionado. */}
      {guideModalOpen && (
        <Suspense fallback={<ScreenSkeleton language={language} variant="overlay" />}>
          <GuideModal
            isOpen={guideModalOpen}
            onClose={onCloseGuide}
            language={language}
          />
        </Suspense>
      )}
    </>
  );
}
