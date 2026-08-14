import type { Language } from '../utils/i18n';

interface StepRowProps {
  id: string;
  label: string;
  completed: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean;
  language?: Language;
}

export function StepRow({ id, label, completed, onToggle, disabled = false, language = 'en-US' }: StepRowProps) {
  const isPt = language === 'pt-BR';

  return (
    <div
      className="flex items-center gap-3 py-3 px-3 rounded-2xl transition-all"
      style={{ background: completed ? 'var(--sm-primary-soft)' : 'var(--sm-bg)' }}
    >
      {/* Checkbox de etapa — <button> e não <div>, para receber foco de teclado
          e ser anunciado por leitor de tela. */}
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        aria-label={`${isPt ? (completed ? 'Etapa concluída' : 'Marcar etapa como concluída') : (completed ? 'Step completed' : 'Mark step as completed')}: ${label}`}
        disabled={disabled || completed}
        onClick={disabled || completed ? undefined : () => onToggle(id)}
        /* 44×44 de toque com o quadrado de 22px dentro. A etapa é item
           secundário, mas o alvo segue o mesmo piso das outras ações do app
           — 40 passava no WCAG AA (24px) e ficava abaixo do padrão daqui. */
        style={{ width: 44, height: 44, padding: 11, background: 'none', border: 'none', opacity: disabled ? 0.5 : 1 }}
        className="flex items-center justify-center shrink-0"
      >
        <span
          aria-hidden="true"
          style={{
            /* Quadrado, não círculo: casa com o checkbox de cobre da
               referência e com o PixelCheckbox das linhas principais. */
            width: 22, height: 22, borderRadius: 4, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            background: 'var(--sm-surface)',
            border: `2px solid ${completed ? 'var(--sm-primary)' : 'var(--sm-gold)'}`,
            boxShadow: completed ? '0 0 6px color-mix(in srgb, var(--sm-primary) 65%, transparent)' : 'none',
            transition: 'box-shadow .15s ease, border-color .15s ease',
          }}
        >
          {completed && (
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="var(--sm-primary)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </span>
      </button>

      {/* O rótulo também dispara: alvo de toque maior. Sem foco próprio para
          não duplicar a parada de teclado — o botão acima já é o alvo. */}
      <span
        onClick={disabled || completed ? undefined : () => onToggle(id)}
        aria-hidden="true"
        className={`select-none flex-1 ${
          disabled ? 'cursor-not-allowed opacity-50' : completed ? 'cursor-default' : 'cursor-pointer'
        }`}
        style={{
          fontSize: '0.875rem',
          color: completed ? 'var(--sm-muted)' : 'var(--sm-ink)',
          textDecoration: completed ? 'line-through' : 'none',
        }}
      >
        {label}
      </span>
    </div>
  );
}
