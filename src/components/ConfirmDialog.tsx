import iconClose from '../assets/soulmon/icons/icon-close.png';
import { Button } from './ui/button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  /** Rótulos dos botões. Sem eles o diálogo saía em inglês fixo. */
  confirmLabel?: string;
  cancelLabel?: string;
}

export function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmLabel, cancelLabel }: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="sm-card rounded-lg p-6 max-w-sm w-full relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded transition-colors"
          style={{ color: 'var(--sm-muted)' }}
        >
          <img src={iconClose} alt="" width={20} height={20} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
        </button>

        <h2 className="mb-3" style={{ color: 'var(--sm-ink)' }}>{title}</h2>
        <p className="mb-6" style={{ fontFamily: 'monospace', fontSize: '0.875rem', color: 'var(--sm-muted)' }}>
          {message}
        </p>

        <div className="flex gap-2">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            {cancelLabel ?? 'Cancel'}
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 text-white"
            style={{ background: 'var(--sm-danger)' }}
          >
            {confirmLabel ?? 'Confirm'}
          </Button>
        </div>
      </div>
    </div>
  );
}
