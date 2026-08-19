import { useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import type { Language } from '../../utils/i18n';
import { useDialogA11y } from '../../hooks/useDialogA11y';

/**
 * ONDA 5 — O FORMULÁRIO SAI DO FLIPERAMA
 * ======================================
 *
 * O kit `sm-px-*` (9-slice, chanfro, borda de cobre) recuou de formulário,
 * lista, modal, loja e configurações: ele fica dentro do visor e nas telas de
 * arcade. Aqui é superfície limpa sobre os tokens `--sm2-*` — raio 12 em card,
 * 20 no topo do bottom sheet, e as duas sombras do sistema.
 *
 * Estas primitivas moram num arquivo só porque SEIS superfícies desenham os
 * mesmos campos, chips e botões. Uma segunda cópia divergiria em silêncio
 * (footgun 9), e é exatamente assim que um app volta a ter duas linguagens.
 *
 * Tudo por `style` inline e nada por classe utilitária: o Tailwind daqui é
 * pré-compilado, então classe que não existe no `index.css` não aplica nada e
 * não avisa (footgun 1).
 */

/** As duas sombras do sistema: card (elevação curta) e sheet (vem de baixo). */
export const SM2_SHADOW_CARD = '0 1px 2px rgba(4, 18, 20, .10), 0 4px 12px rgba(4, 18, 20, .10)';
export const SM2_SHADOW_SHEET = '0 -2px 8px rgba(4, 18, 20, .12), 0 -12px 32px rgba(4, 18, 20, .22)';

export const sm2Text: CSSProperties = {
  fontFamily: 'var(--sm2-font-text)',
  fontSize: 'var(--sm2-text-sm)',
  lineHeight: 'var(--sm2-leading-body)',
  color: 'var(--sm2-ink)',
};

/** Legenda. Piso de 12px — não existe texto menor no app. */
export const sm2Hint: CSSProperties = {
  fontFamily: 'var(--sm2-font-text)',
  fontSize: 'var(--sm2-text-xs)',
  lineHeight: 'var(--sm2-leading-body)',
  color: 'var(--sm2-muted)',
  margin: 0,
};

export const sm2Label: CSSProperties = {
  ...sm2Hint,
  display: 'block',
  marginBottom: 6,
  fontWeight: 500,
};

/** Título em Fredoka. `sm2-title` já traz família, cor e entrelinha. */
export const sm2TitleStyle: CSSProperties = {
  fontSize: 'var(--sm2-text-lg)',
  fontWeight: 600,
  margin: 0,
};

export function sm2Button(variant: 'primary' | 'ghost' | 'quiet', disabled = false): CSSProperties {
  const base: CSSProperties = {
    minHeight: 44,
    padding: '10px 16px',
    borderRadius: 10,
    fontFamily: 'var(--sm2-font-text)',
    fontSize: 'var(--sm2-text-sm)',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease)',
  };
  if (disabled) {
    return { ...base, border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface-2)', color: 'var(--sm2-muted)' };
  }
  if (variant === 'primary') {
    // Texto sobre fill usa `--sm2-on-*`, nunca o `*-ink` do mesmo acento.
    return { ...base, border: '1px solid transparent', backgroundColor: 'var(--sm2-primary-fill)', color: 'var(--sm2-on-primary)' };
  }
  if (variant === 'quiet') {
    return { ...base, border: 'none', background: 'none', color: 'var(--sm2-muted)' };
  }
  return { ...base, border: '1px solid var(--sm2-line)', backgroundColor: 'var(--sm2-surface)', color: 'var(--sm2-ink)' };
}

/**
 * Campo de texto/data/hora. Nativo, e não o `Input` do shadcn: aquele sorteia
 * `id`/`name` a cada montagem (o que quebra `htmlFor`) e traz
 * `--foreground`/`--background`, a raiz documentada do footgun 10.
 * O anel de foco é inline porque `:focus-visible` não existe em style prop.
 */
export function Field(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focus, setFocus] = useState(false);
  const { style, onFocus, onBlur, ...rest } = props;
  return (
    <input
      {...rest}
      spellCheck={false}
      onFocus={(e) => { setFocus(true); onFocus?.(e); }}
      onBlur={(e) => { setFocus(false); onBlur?.(e); }}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        minHeight: 44,
        padding: '10px 12px',
        borderRadius: 10,
        border: '1px solid var(--sm2-line)',
        backgroundColor: 'var(--sm2-surface-2)',
        fontFamily: 'var(--sm2-font-text)',
        fontSize: 'var(--sm2-text-sm)',
        color: 'var(--sm2-ink)',
        outline: 'none',
        boxShadow: focus ? '0 0 0 2px var(--sm2-primary-ink)' : 'none',
        ...style,
      }}
    />
  );
}

/** Chip de escolha. Selecionado = fill; texto por cima usa `--sm2-on-primary`. */
export function Chip({
  selected, onToggle, children, ariaLabel, title, style,
}: {
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
  ariaLabel?: string;
  title?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      aria-label={ariaLabel}
      title={title}
      style={{
        minHeight: 44,
        padding: '8px 14px',
        borderRadius: 999,
        cursor: 'pointer',
        fontFamily: 'var(--sm2-font-text)',
        fontSize: 'var(--sm2-text-xs)',
        fontWeight: 500,
        border: selected ? '1px solid transparent' : '1px solid var(--sm2-line)',
        backgroundColor: selected ? 'var(--sm2-primary-fill)' : 'var(--sm2-surface-2)',
        color: selected ? 'var(--sm2-on-primary)' : 'var(--sm2-ink)',
        transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease)',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

/** Um segmento de controle segmentado (radiogroup). Mesma regra tinta×fill. */
export function Segment({
  selected, onSelect, label, hint, ariaLabel,
}: {
  selected: boolean;
  onSelect: () => void;
  label: ReactNode;
  hint?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
      style={{
        flex: 1,
        minHeight: 44,
        padding: '8px 6px',
        borderRadius: 10,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        fontFamily: 'var(--sm2-font-text)',
        fontSize: 'var(--sm2-text-sm)',
        fontWeight: 500,
        border: selected ? '1px solid transparent' : '1px solid var(--sm2-line)',
        backgroundColor: selected ? 'var(--sm2-primary-fill)' : 'var(--sm2-surface-2)',
        color: selected ? 'var(--sm2-on-primary)' : 'var(--sm2-ink)',
      }}
    >
      <span>{label}</span>
      {hint && <span style={{ fontSize: 'var(--sm2-text-xs)', opacity: .85 }}>{hint}</span>}
    </button>
  );
}

/** Caixa de seleção com rótulo. O rótulo inteiro é o alvo, com 44px de altura. */
export function CheckRow({
  checked, onChange, children,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, minHeight: 44, cursor: 'pointer' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ width: 20, height: 20, accentColor: 'var(--sm2-primary-fill)' }}
      />
      <span style={sm2Text}>{children}</span>
    </label>
  );
}

/**
 * Bottom sheet. Vem de baixo porque o polegar chega lá — o botão primário de um
 * formulário longo no topo da tela é um alvo que ninguém alcança de uma mão.
 * Foco preso, Escape fecha e o foco volta para quem abriu (`useDialogA11y`).
 */
export function ModalSheet({
  open, title, onClose, language, children, footer, maxWidth = 480,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  language: Language;
  children: ReactNode;
  footer?: ReactNode;
  maxWidth?: number;
}) {
  const isPt = language === 'pt-BR';
  const dialogRef = useDialogA11y<HTMLDivElement>(open, onClose);
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 120,
        background: 'rgba(4, 18, 20, .55)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          width: '100%', maxWidth, maxHeight: '92vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          backgroundColor: 'var(--sm2-surface)',
          borderRadius: '20px 20px 0 0',
          boxShadow: SM2_SHADOW_SHEET,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 8px 12px 18px' }}>
          <span className="sm2-title" style={{ ...sm2TitleStyle, flex: 1 }}>{title}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label={isPt ? 'Fechar' : 'Close'}
            style={{
              width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
            }}
          >
            <Icon name="close" size={24} tone="muted" />
          </button>
        </div>

        <div style={{ overflowY: 'auto', padding: '4px 18px 18px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {children}
        </div>

        {footer && <div style={{ padding: 16, borderTop: '1px solid var(--sm2-line)' }}>{footer}</div>}
      </div>
    </div>
  );
}

export default ModalSheet;
