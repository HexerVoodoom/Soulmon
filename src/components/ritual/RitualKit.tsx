import { useLayoutEffect, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { SM2_SHADOW_CARD, sm2Hint } from '../form/FormKit';

/**
 * RITUAIS — o kit do diálogo centrado (canvas `docs/design/wireframes/
 * rituais/identidade/`, DECISÕES §21, D-R1…D-R3)
 * ======================================================================
 *
 * Os oito rituais (check-in, relatório, sonho, cerimônia, primeira tarefa,
 * proteger, boas-vindas, semana) partilham TRÊS peças, e é por isso que elas
 * moram num arquivo só (footgun 9: a segunda cópia diverge em silêncio):
 *
 *  · **`RitualDialog`** — o `.dlg` do SIS-06 centrado (`surface`, raio 20,
 *    sombra de card, 16 de padding, gap 12) sobre o **scrim literal do
 *    `ModalSheet`** (`rgba(4,18,20,.55)`). O fundo nunca esmaece por
 *    opacidade — é tinta por cima (Home F1). Trap, Escape e devolução do foco
 *    são do `useDialogA11y`.
 *  · **`RitualGlass`** — o único lugar onde PIXEL entra num ritual (D-R3):
 *    um retângulo `--sm2-viewport-bg` + o reflexo do `Viewport`, sem anel
 *    (como o `MiniGlass` do Pet), e a arte sempre em múltiplo de 0,5× do
 *    nativo — sprite 256² a 64/128, cena de sonho 96² a 96, aventura 96² a
 *    48, emblema 64² a 64. Nunca 0,75× (X1/achado 19).
 *  · **`RitualRow`** — a linha rótulo/valor do relatório: 12 `muted` ·
 *    14/500 `tabular`; o destaque é TINTA `primary-ink`, a perda é peso 400
 *    sem sinal, sem vermelho (D-R2: descrição, nunca veredito).
 *
 * Tudo por `style` inline (footgun 1). O anel de foco dos botões é a regra
 * global `button:focus-visible` do `index.css`.
 */

/** O scrim do `ModalSheet`, literal — o canvas copiou daqui. */
export const RITUAL_SCRIM = 'rgba(4, 18, 20, .55)';

export interface RitualDialogProps {
  /** Nome acessível do diálogo (a manchete). Textos nascem em inglês. */
  label?: string;
  /** Alternativa ao `label`: o id do título dentro do diálogo. */
  labelledBy?: string;
  /** Escape e o × (quando `closeLabel` existe). */
  onClose: () => void;
  /** 200 = intersticial; 300 = cerimônia (acima de tudo). */
  zIndex?: number;
  /** 380 (check-in) · 340 (relatório, cerimônia) · 320 (sonho). */
  maxWidth?: number;
  /** Rótulo do × 44 no canto. Ausente = sem ×. */
  closeLabel?: string;
  /** × por ÚLTIMO na ordem de foco (E9, folhas de gate); padrão = primeiro
   *  (o relatório: "× 44, primeiro focável"). */
  closeLast?: boolean;
  /**
   * Foco inicial no CONTAINER (`tabIndex=-1`), em efeito de LAYOUT: para o
   * diálogo que monta sozinho na abertura do app (check-in), o leitor
   * anuncia o nome e lê do começo; o primeiro Tab entra na lista. Ver a nota
   * longa do `MorningCheckIn`.
   */
  focusContainer?: boolean;
  /** `role="status"` no véu: a cerimônia é anunciada, o diálogo é o trap. */
  veilRole?: 'status';
  children: ReactNode;
  style?: CSSProperties;
  className?: string;
  /** Força o tema do CARTÃO (os tokens `--sm2-*` são redefinidos por
   *  `[data-theme]`, então o atributo no cartão basta). F2 (01/10/2026): o
   *  prêmio da manhã é claro mesmo com o app no escuro. Ausente = segue o app. */
  theme?: 'light' | 'dark';
}

export function RitualDialog({
  label, labelledBy, onClose, zIndex = 200, maxWidth = 340, closeLabel, closeLast = false,
  focusContainer = false, veilRole, children, style, className, theme,
}: RitualDialogProps) {
  const dialogRef = useDialogA11y<HTMLDivElement>(true, onClose);
  const closeButton = closeLabel ? <CloseX onClose={onClose} label={closeLabel} /> : null;

  useLayoutEffect(() => {
    if (!focusContainer) return;
    const node = dialogRef.current;
    if (!node) return;
    if (node.contains(document.activeElement)) return;
    node.focus({ preventScroll: true });
  }, [focusContainer, dialogRef]);

  return (
    <div
      {...(veilRole ? { role: veilRole, 'aria-live': 'polite' as const } : null)}
      style={{
        position: 'fixed', inset: 0, zIndex,
        background: RITUAL_SCRIM,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={className}
        data-theme={theme}
        /* Sem anel no cartão: ele recebe o foco por MONTAGEM, não por
           navegação; os controles continuam com o foco visível de sempre. */
        style={{
          outline: 'none',
          position: 'relative',
          width: '100%', maxWidth, maxHeight: '90vh',
          boxSizing: 'border-box',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 12,
          padding: 16,
          backgroundColor: 'var(--sm2-surface)',
          borderRadius: 'var(--sm2-radius-lg)',
          boxShadow: SM2_SHADOW_CARD,
          ...style,
        }}
      >
        {closeLabel && !closeLast && closeButton}
        {children}
        {closeLabel && closeLast && closeButton}
      </div>
    </div>
  );
}

function CloseX({ onClose, label }: { onClose: () => void; label: string }) {
  /* 44×44 (WCAG 2.2 2.5.8), ícone pelado — ícone nunca dentro de box. */
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      style={{
        position: 'absolute', top: 4, right: 4, zIndex: 2,
        width: 44, height: 44,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'none', border: 'none', cursor: 'pointer',
      }}
    >
      <Icon name="close" size={24} tone="muted" />
    </button>
  );
}

export interface RitualGlassProps {
  width: number;
  height?: number;
  /** `end` = a criatura pousa no chão do vidro (sprite); `center` = cena/arte. */
  align?: 'center' | 'end';
  children?: ReactNode;
  style?: CSSProperties;
}

/**
 * O vidro sem anel. `aria-hidden`: o nome fica FORA, no texto ao lado. Reusa
 * as classes do `Viewport` (`sm2-viewport-screen` + `sm2-viewport-glass`),
 * nenhum CSS novo; raio 12 como o `.screen` do canvas.
 */
export function RitualGlass({ width, height = width, align = 'center', children, style }: RitualGlassProps) {
  return (
    <span
      className="sm2-viewport-screen sm2-visor"
      aria-hidden="true"
      data-ritual-glass
      style={{
        width, height, flex: 'none',
        display: 'flex', alignItems: align === 'end' ? 'flex-end' : 'center', justifyContent: 'center',
        borderRadius: 'var(--sm2-radius-md)',
        ...style,
      }}
    >
      {children}
      <span className="sm2-viewport-glass" />
    </span>
  );
}

/** A criatura num vidro: sprite 256² a 64 (0,25×/0,5× DPR 2) num vidro 96². */
export function SpriteGlass({ spriteUrl, size = 96, sprite = 64 }: { spriteUrl: string; size?: number; sprite?: number }) {
  return (
    <RitualGlass width={size} align="end">
      <img
        src={spriteUrl}
        alt=""
        width={sprite}
        height={sprite}
        style={{ width: sprite, height: sprite, display: 'block', marginBottom: 8, imageRendering: 'pixelated' }}
      />
    </RitualGlass>
  );
}

export type RitualRowTone = 'hi' | 'soft';

/** Linha rótulo/valor: 12 `muted` · 14/500 tabular; `hi` = `primary-ink`, `soft` = peso 400. */
export function RitualRow({ label, value, tone }: { label: string; value: string; tone?: RitualRowTone }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minHeight: 32 }}>
      <span style={{ ...sm2Hint, flex: 1 }}>{label}</span>
      <span
        className="sm2-num"
        style={{
          fontFamily: 'var(--sm2-font-text)',
          fontSize: 'var(--sm2-text-sm)',
          lineHeight: 'var(--sm2-leading-body)',
          fontWeight: tone === 'soft' ? 400 : 500,
          color: tone === 'hi' ? 'var(--sm2-primary-ink)' : 'var(--sm2-ink)',
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Rótulo de seção: Rubik 12/500 caixa alta, `muted` (o `.lab` do canvas). */
export const ritualLabel: CSSProperties = {
  fontFamily: 'var(--sm2-font-text)',
  fontSize: 'var(--sm2-text-xs)',
  fontWeight: 500,
  letterSpacing: '.06em',
  textTransform: 'uppercase',
  color: 'var(--sm2-muted)',
  lineHeight: 'var(--sm2-leading-body)',
  margin: 0,
};

/** Manchete Fredoka 20/600 (o `.h2` do canvas), em `ink`. */
export const ritualTitle: CSSProperties = {
  fontFamily: 'var(--sm2-font-display)',
  fontSize: 'var(--sm2-text-lg)',
  fontWeight: 600,
  lineHeight: 'var(--sm2-leading-title)',
  color: 'var(--sm2-ink)',
  margin: 0,
};
