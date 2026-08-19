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
    /* ONDA 2 — a etapa perdeu a MOLDURA.
       Era `sm-px-card` (moldura chanfrada do kit pixel) por etapa: uma caixa
       dentro da caixa do hábito, que já está dentro do painel. Três molduras
       aninhadas para dizer "isto é um subitem". Agora quem diz isso é o recuo e
       o marcador — que é o que a lista de etapas sempre foi. O único sinal de
       CONCLUÍDA que sobra é o do próprio marcador + o texto riscado, e nenhum
       dos dois é cor sozinha. */
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 4px' }}
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
            /* Quadrado, não círculo: casa com o `PixelCheckbox` das linhas
               principais — a etapa é o mesmo gesto, um nível abaixo.
               O estado é PREENCHIMENTO (vazio → cheio), nunca só matiz, e o
               brilho ciano assado (`box-shadow`) saiu: era a terceira maneira
               de dizer "concluída" na mesma linha. */
            width: 20, height: 20, borderRadius: 4, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: completed ? 'var(--sm2-primary-fill)' : 'transparent',
            border: `2px solid ${completed ? 'var(--sm2-primary-fill)' : 'var(--sm2-muted)'}`,
            transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease), border-color var(--sm2-dur-tap) var(--sm2-ease)',
          }}
        >
          {completed && (
            /* Tinta SOBRE o fill: `--sm2-on-primary`, jamais `--sm2-primary-ink`
               (é a regra tinta×fill de `src/styles/tokens.md`). */
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="var(--sm2-on-primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
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
          fontFamily: 'var(--sm2-font-text)',
          fontSize: 'var(--sm2-text-sm)',
          lineHeight: 'var(--sm2-leading-body)',
          color: completed ? 'var(--sm2-muted)' : 'var(--sm2-ink)',
          textDecoration: completed ? 'line-through' : 'none',
        }}
      >
        {label}
      </span>
    </div>
  );
}
