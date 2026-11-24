import { Icon } from './ui/Icon';

/** Setas anterior/próximo dos pop-ups de detalhe do Drive (24/11/2026). Alvo 44 px; desabilitadas no primeiro/último. */
export function DriveNavArrows({ isPt, hasPrev, hasNext, onPrev, onNext }: { isPt: boolean; hasPrev: boolean; hasNext: boolean; onPrev: () => void; onNext: () => void }) {
  return (
    <div className="sm2-drive-nav" data-drive-nav>
      <button type="button" className="sm2-drive-nav-btn" data-drive-prev disabled={!hasPrev} aria-disabled={!hasPrev} aria-label={isPt ? 'Anterior' : 'Previous'} onClick={onPrev}>
        <Icon name="chevron_left" size={24} tone="inherit" />
      </button>
      <button type="button" className="sm2-drive-nav-btn" data-drive-next disabled={!hasNext} aria-disabled={!hasNext} aria-label={isPt ? 'Próximo' : 'Next'} onClick={onNext}>
        <Icon name="chevron_right" size={24} tone="inherit" />
      </button>
    </div>
  );
}
