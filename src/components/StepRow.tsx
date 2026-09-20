import type { Language } from '../utils/i18n';
import { Icon } from './ui/Icon';

interface StepRowProps {
  id: string;
  label: string;
  completed: boolean;
  onToggle: (id: string) => void;
  disabled?: boolean;
  language?: Language;
}

/**
 * Uma etapa do hábito, aberta sob a linha (canvas Atividades,
 * `LinhaHabitoEstados` "passos abertos"): checkbox 24 (raio 4, `muted` 2px;
 * marcado = `primary-fill` + `check` em `on-primary`) num alvo de 44, rótulo
 * Rubik 14. Sem moldura — quem diz "subitem" é o recuo. Inerte (fora do dia)
 * = caixa TRACEJADA + `aria-disabled`, rótulo em `muted`: por FORMA e TINTA,
 * nunca por `opacity` (D-A3).
 */
export function StepRow({ id, label, completed, onToggle, disabled = false, language = 'en-US' }: StepRowProps) {
  const isPt = language === 'pt-BR';
  const inert = disabled || completed;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 44 }}>
      {/* Checkbox de etapa — <button> e não <div>, para receber foco de teclado
          e ser anunciado por leitor de tela. */}
      <button
        type="button"
        role="checkbox"
        aria-checked={completed}
        aria-disabled={inert || undefined}
        aria-label={`${isPt ? (completed ? 'Etapa concluída' : 'Marcar etapa como concluída') : (completed ? 'Step completed' : 'Mark step as completed')}: ${label}`}
        disabled={inert}
        onClick={inert ? undefined : () => onToggle(id)}
        style={{
          width: 44, height: 44, padding: 0, flexShrink: 0, background: 'none', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: inert ? 'default' : 'pointer',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 24, height: 24, borderRadius: 'var(--sm2-radius-sm)', boxSizing: 'border-box',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            backgroundColor: completed ? 'var(--sm2-primary-fill)' : 'transparent',
            border: `2px ${disabled && !completed ? 'dashed' : 'solid'} ${completed ? 'var(--sm2-primary-fill)' : 'var(--sm2-muted)'}`,
            color: 'var(--sm2-on-primary)',
            transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease), border-color var(--sm2-dur-tap) var(--sm2-ease)',
          }}
        >
          {completed && <Icon name="check" size={20} fill={1} weight={700} />}
        </span>
      </button>

      {/* O rótulo também dispara: alvo de toque maior. Sem foco próprio para
          não duplicar a parada de teclado — o botão acima já é o alvo. */}
      <span
        onClick={inert ? undefined : () => onToggle(id)}
        aria-hidden="true"
        style={{
          flex: 1,
          minWidth: 0,
          userSelect: 'none',
          cursor: inert ? 'default' : 'pointer',
          fontFamily: 'var(--sm2-font-text)',
          fontSize: 'var(--sm2-text-sm)',
          lineHeight: 'var(--sm2-leading-body)',
          color: (completed || disabled) ? 'var(--sm2-muted)' : 'var(--sm2-ink)',
          textDecoration: completed ? 'line-through' : 'none',
        }}
      >
        {label}
      </span>
    </div>
  );
}
