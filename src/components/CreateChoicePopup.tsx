import type { Language } from '../utils/i18n';
import { Icon } from './ui/Icon';
import { ESCOLHEDOR_ICON_ART } from '../assets/soulmon/icones-ui/interacao';
import { useDialogA11y } from '../hooks/useDialogA11y';

/**
 * ESCOLHEDOR HÁBITO / TAREFA (dono, 24/11/2026: o popup com moldura foi reprovado): BOTTOM SHEET simples, ancorado na base, sem moldura nem arte,
 * só tokens `--sm2-*` (`.sm2-escolhedor*` em index.css). Os botões ficam NO TOPO do conteúdo. Fecha por toque no véu e Esc (sem arrastar-para-baixo:
 * o projeto não tem esse padrão). `onCommit` (opcional) acrescenta "Comprometer-me", que o App só passa quando há algo ainda não comprometido hoje.
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
  return (
    <div data-modal-backdrop data-create-choice-popup className="sm2-escolhedor-veu sm2-sheet-fade"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-label={pt ? 'Novo hábito ou nova tarefa' : 'New habit or new task'} className="sm2-escolhedor">
        <span className="sm2-escolhedor__alca" aria-hidden="true" />
        <button type="button" data-create-choice="task" className="sm2-escolhedor__op" aria-label={pt ? 'Nova tarefa' : 'New task'} onClick={() => onPick('task')}>
          {ESCOLHEDOR_ICON_ART.tarefa ? <img data-escolhedor-icone="task" src={ESCOLHEDOR_ICON_ART.tarefa} alt="" width={32} height={32} draggable={false} /> : <Icon name="task_alt" size={24} tone="inherit" />}{pt ? 'Nova tarefa' : 'New task'}
        </button>
        <button type="button" data-create-choice="habit" className="sm2-escolhedor__op" aria-label={pt ? 'Novo hábito' : 'New habit'} onClick={() => onPick('habit')}>
          {ESCOLHEDOR_ICON_ART.habito ? <img data-escolhedor-icone="habit" src={ESCOLHEDOR_ICON_ART.habito} alt="" width={32} height={32} draggable={false} /> : <Icon name="event_repeat" size={24} tone="inherit" />}{pt ? 'Novo hábito' : 'New habit'}
        </button>
        {onCommit && (
          <button type="button" data-create-choice="commit" className="sm2-escolhedor__op" aria-label={pt ? 'Comprometer-me' : 'Commit to a task'} onClick={onCommit}>
            {ESCOLHEDOR_ICON_ART.compromisso ? <img data-escolhedor-icone="commit" src={ESCOLHEDOR_ICON_ART.compromisso} alt="" width={32} height={32} draggable={false} /> : <Icon name="flag" size={24} tone="inherit" />}{pt ? 'Comprometer-me' : 'Commit to a task'}
          </button>
        )}
      </div>
    </div>
  );
}
