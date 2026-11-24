import type { Language } from '../utils/i18n';
import { ModalFrame } from './ui/ModalFrame';
import { Icon } from './ui/Icon';
import { useDialogA11y } from '../hooks/useDialogA11y';

/**
 * ESCOLHEDOR HÁBITO / TAREFA (spec do dono, 24/11/2026): popup pequeno, SEM barra de título, só as duas opções (ícone + rótulo).
 * Usa a moldura central `cristal` (`ModalFrame`) sem placa. Fecha por toque fora, Esc ou ✕ discreto. `onCommit` (opcional) acrescenta
 * a 3ª opção "Comprometer-me" que o App só passa quando há algo ainda não comprometido hoje.
 */
export interface CreateChoicePopupProps {
  open: boolean;
  language: Language;
  onClose: () => void;
  onPick: (kind: 'habit' | 'task') => void;
  onCommit?: () => void;
}

export function CreateChoicePopup({ open, language, onClose, onPick, onCommit }: CreateChoicePopupProps) {
  const pt = language === 'pt-BR';
  const ref = useDialogA11y<HTMLDivElement>(open, onClose);
  if (!open) return null;
  const rotulo = pt ? 'Novo hábito ou nova tarefa' : 'New habit or new task';
  return (
    <div data-modal-backdrop data-create-choice-popup className="sm2-sheet-fade"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(4, 18, 20, .55)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'calc(16px + env(safe-area-inset-top, 0px)) 16px calc(16px + env(safe-area-inset-bottom, 0px))', boxSizing: 'border-box' }}>
      <ModalFrame ref={ref} role="dialog" aria-modal="true" aria-label={rotulo} variante="cristal" data-theme="dark"
        className="sm2-sheet-fade sm2-moldura-modal--titulo-inline"
        style={{ width: '100%', maxWidth: 300, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div className="sm2-popup-cabeca" style={{ justifyContent: 'flex-end' }}>
          <button type="button" className="sm2-popup-fechar" data-create-choice-close onClick={onClose} aria-label={pt ? 'Fechar' : 'Close'}>
            <Icon name="close" size={24} tone="inherit" />
          </button>
        </div>
        <div style={{ display: 'grid', gap: 10, padding: '0 4px 8px' }}>
          <button type="button" data-create-choice="habit" className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-primary"
            style={{ width: '100%', gap: 8 }} onClick={() => onPick('habit')}>
            <Icon name="event_repeat" size={20} tone="inherit" />{pt ? 'Hábito' : 'Habit'}
          </button>
          <button type="button" data-create-choice="task" className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-outline"
            style={{ width: '100%', gap: 8 }} onClick={() => onPick('task')}>
            <Icon name="task_alt" size={20} tone="inherit" />{pt ? 'Tarefa' : 'Task'}
          </button>
          {onCommit && (
            <button type="button" data-create-choice="commit" className="sm2-kit-btn sm2-kit-btn-md sm2-kit-btn-outline"
              style={{ width: '100%', gap: 8 }} onClick={onCommit}>
              <Icon name="flag" size={20} tone="inherit" />{pt ? 'Comprometer-me' : 'Commit to a task'}
            </button>
          )}
        </div>
      </ModalFrame>
    </div>
  );
}
