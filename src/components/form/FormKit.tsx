import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../ui/Icon';
import { resolveLanguage, type Language } from '../../utils/i18n';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { readLocal } from '../../utils/safeStorage';
import { STORAGE_KEYS } from '../../utils/storageKeys';

/** Texto só para leitor de tela (não existe classe `sr-only` no `index.css`;
 *  o CSS é o do WebAIM, inline de propósito — footgun 1). */
const SR_ONLY: CSSProperties = {
  position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
  overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
};

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
 *
 * CANVAS "SISTEMA" (16/09/2026, `docs/design/wireframes/sistema/identidade/`,
 * `DECISOES-WIREFRAME.md` §18): os primitivos daqui seguem a tabela
 * "FormKit hoje × canvas" dos artboards `Botoes`/`Cards`/`FolhaNav`:
 *  · botão `primary / outline / ghost / quiet`, raio 12, sm 44/14 · md 48/16 ·
 *    lg 56/16; foco 2px `primary-ink` offset 3; pressed `primary-deep`;
 *  · chip TONAL (`surface-2` + `muted`; selecionado `primary-soft` +
 *    `primary-ink` + check) — não mais o fill sólido;
 *  · campo filled com fronteira `muted` 1px (F2: `line` dá 1,3:1), raio 12,
 *    anel por `box-shadow` (código vence no mecanismo), aviso em ÂMBAR;
 *  · `ModalSheet` fica como está — o canvas copiou os literais daqui.
 *
 * Os estados que `style` inline NÃO alcança (`:focus-visible`, `:active`,
 * `::placeholder`, o quadrado do checkbox) vivem nas classes `.sm2-form-*` no
 * fim do `index.css`, mesmo padrão do `.sm2-kit-*` do `PixelKit`. Os 100+
 * chamadores de `sm2Button()` continuam passando só `style`: a variante vai
 * junto como a custom property `--sm2-btn`, e é ela que o CSS lê
 * (`[style*="--sm2-btn:primary"]:active`) para pintar o pressed — a única
 * forma de dar estado de CSS a um primitivo que é só um objeto de estilo,
 * sem tocar em cada chamador.
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

/** Título em Cinzel. `sm2-title` já traz família, cor e entrelinha. */
export const sm2TitleStyle: CSSProperties = {
  fontSize: 'var(--sm2-text-lg)',
  fontWeight: 600,
  margin: 0,
};

export type Sm2ButtonVariant = 'primary' | 'outline' | 'ghost' | 'quiet';
/** sm 44/14 · md 48/16 · lg 56/16 (canvas `Botoes`). */
export type Sm2ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Botão do sistema. Devolve só `style` porque é assim que os chamadores o
 * consomem (`style={{ ...sm2Button('primary'), flex: 1 }}`).
 *
 *  · `primary`  — fill ciano + `on-primary`; pressed `primary-deep`.
 *  · `outline`  — `surface` + fronteira `muted` 1px + `ink` (era o `ghost`
 *                 antigo; renomeado pelo canvas, chamadores migrados).
 *  · `ghost`    — ação leve em ciano, sem borda; pressed `primary-soft`.
 *  · `quiet`    — sair sem peso ("Not now"): `muted`, sem borda.
 *
 * Desativado (qualquer variante): `surface-2` + `muted`, sem borda. O foco
 * visível e o pressed ficam em `.sm2-form-*` no `index.css` (ver cabeçalho).
 */
export function sm2Button(variant: Sm2ButtonVariant, disabled = false, size: Sm2ButtonSize = 'md'): CSSProperties {
  const metric: CSSProperties = size === 'lg'
    ? { minHeight: 56, padding: '0 24px', fontSize: 'var(--sm2-text-md)' }
    : size === 'sm'
      ? { minHeight: 44, padding: '0 16px', fontSize: 'var(--sm2-text-sm)' }
      : { minHeight: 48, padding: '0 20px', fontSize: 'var(--sm2-text-md)' };
  const base: CSSProperties = {
    ...metric,
    boxSizing: 'border-box',
    borderRadius: 'var(--sm2-radius-md)',
    fontFamily: 'var(--sm2-font-text)',
    fontWeight: 500,
    lineHeight: 'var(--sm2-leading-body)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease), color var(--sm2-dur-tap) var(--sm2-ease)',
    // Marcador lido pelo CSS (`[style*="--sm2-btn:…"]`) para o pressed.
    ['--sm2-btn' as string]: disabled ? 'disabled' : variant,
  };
  if (disabled) {
    if (variant === 'ghost' || variant === 'quiet') {
      return { ...base, border: 'none', background: 'none', color: 'var(--sm2-muted)' };
    }
    return { ...base, border: '1px solid transparent', backgroundColor: 'var(--sm2-surface-2)', color: 'var(--sm2-muted)' };
  }
  if (variant === 'primary') {
    // Texto sobre fill usa `--sm2-on-*`, nunca o `*-ink` do mesmo acento.
    return { ...base, border: '1px solid transparent', backgroundColor: 'var(--sm2-primary-fill)', color: 'var(--sm2-on-primary)' };
  }
  if (variant === 'ghost') {
    return { ...base, border: 'none', background: 'none', color: 'var(--sm2-primary-ink)' };
  }
  if (variant === 'quiet') {
    return { ...base, border: 'none', background: 'none', color: 'var(--sm2-muted)' };
  }
  return { ...base, border: '1px solid var(--sm2-muted)', backgroundColor: 'var(--sm2-surface)', color: 'var(--sm2-ink)' };
}

/**
 * Campo de texto/data/hora. Nativo, e não o `Input` do shadcn: aquele sorteia
 * `id`/`name` a cada montagem (o que quebra `htmlFor`) e traz
 * `--foreground`/`--background`, a raiz documentada do footgun 10.
 *
 * Filled (canvas `Cards`): `surface-2` + fronteira `muted` 1px, raio 12, 16px
 * (também evita o zoom do iOS ao focar). Foco = fronteira + anel 2px
 * `primary-ink` por `box-shadow` (inline, porque `:focus-visible` não existe
 * em style prop — e o código vence no mecanismo). `warn` é AVISO, em âmbar
 * (`gold-ink`), nunca vermelho: o texto ao lado convida ("Dá um nome pra sua
 * criatura poder torcer por ela"), não cobra — HANDOFF §7.
 */
export function Field({ warn = false, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { warn?: boolean }) {
  const [focus, setFocus] = useState(false);
  const { style, onFocus, onBlur, className, ...rest } = props;
  const ring = focus ? 'var(--sm2-primary-ink)' : warn ? 'var(--sm2-gold-ink)' : null;
  return (
    <input
      {...rest}
      className={className ? `sm2-form-field ${className}` : 'sm2-form-field'}
      spellCheck={false}
      onFocus={(e) => { setFocus(true); onFocus?.(e); }}
      onBlur={(e) => { setFocus(false); onBlur?.(e); }}
      style={{
        width: '100%',
        boxSizing: 'border-box',
        minHeight: 44,
        padding: '10px 12px',
        borderRadius: 'var(--sm2-radius-md)',
        border: `1px solid ${ring ?? 'var(--sm2-muted)'}`,
        backgroundColor: 'var(--sm2-surface-2)',
        fontFamily: 'var(--sm2-font-text)',
        fontSize: 'var(--sm2-text-md)',
        lineHeight: 'var(--sm2-leading-body)',
        color: 'var(--sm2-ink)',
        outline: 'none',
        boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
        transition: 'border-color var(--sm2-dur-tap) var(--sm2-ease), box-shadow var(--sm2-dur-tap) var(--sm2-ease)',
        ...style,
      }}
    />
  );
}

/**
 * Aviso de campo: âmbar + convite. Vai logo abaixo do `Field` com `warn`, e o
 * chamador liga os dois por `aria-describedby`/`id`.
 */
export function FieldWarn({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} style={{ ...sm2Hint, color: 'var(--sm2-gold-ink)', marginTop: 4 }}>
      {children}
    </p>
  );
}

/**
 * Opção de escolha única em LINHA inteira (o `.sm-px-choice` de antes, agora
 * vetor — canvas Conta §29): 44 de piso, `surface` + fronteira `line`;
 * selecionada = `primary-fill` + `on-primary`. `CityPicker` e `SoulTestItem`
 * a usam quando o chamador não passa a sua.
 */
export function choiceStyle(selected: boolean): CSSProperties {
  return {
    width: '100%', boxSizing: 'border-box', textAlign: 'left',
    minHeight: 44, padding: '12px 14px', marginBottom: 8, borderRadius: 'var(--sm2-radius-md)',
    fontFamily: 'var(--sm2-font-text)',
    fontSize: 'var(--sm2-text-sm)',
    lineHeight: 'var(--sm2-leading-body)',
    fontWeight: selected ? 500 : 400,
    cursor: 'pointer',
    border: selected ? '1px solid transparent' : '1px solid var(--sm2-line)',
    backgroundColor: selected ? 'var(--sm2-primary-fill)' : 'var(--sm2-surface)',
    color: selected ? 'var(--sm2-on-primary)' : 'var(--sm2-ink)',
    transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease)',
  };
}

/**
 * Chip de escolha, TONAL (canvas `Cards`, M3 filter chip): não selecionado =
 * `surface-2` + fronteira `muted`; selecionado = `primary-soft` + fronteira e
 * tinta `primary-ink` + check 20 (pista de forma além da cor; 18 é só dentro
 * de checkbox 24 — `iconScale.contract`). Alvo 44. Foco com
 * `outline-offset: 2` em `.sm2-form-chip`.
 */
export function Chip({
  selected, onToggle, children, ariaLabel, title, style, disabled = false,
}: {
  selected: boolean;
  onToggle: () => void;
  children: ReactNode;
  ariaLabel?: string;
  title?: string;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className="sm2-form-chip"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={selected}
      aria-label={ariaLabel}
      title={title}
      style={{
        boxSizing: 'border-box',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        minHeight: 44,
        padding: '0 14px',
        borderRadius: 999,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'var(--sm2-font-text)',
        fontSize: 'var(--sm2-text-sm)',
        fontWeight: 500,
        lineHeight: 'var(--sm2-leading-body)',
        /* Inerte = fronteira `line` + tinta `muted` (Home E7) — nunca `opacity`,
           que derruba o contraste do rótulo inteiro (canvas Atividades, D-A3). */
        border: `1px solid ${disabled ? 'var(--sm2-line)' : selected ? 'var(--sm2-primary-ink)' : 'var(--sm2-muted)'}`,
        backgroundColor: selected && !disabled ? 'var(--sm2-primary-soft)' : 'var(--sm2-surface-2)',
        color: disabled ? 'var(--sm2-muted)' : selected ? 'var(--sm2-primary-ink)' : 'var(--sm2-ink)',
        transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease), border-color var(--sm2-dur-tap) var(--sm2-ease), color var(--sm2-dur-tap) var(--sm2-ease)',
        ...style,
      }}
    >
      {selected && <Icon name="check" size={20} fill={1} tone="inherit" />}
      {children}
    </button>
  );
}

/**
 * Um segmento de controle segmentado (radiogroup). Sólido (canvas `Dados`:
 * "segmento sólido como o `FormKit.Segment`"): não selecionado `surface-2` +
 * `muted`; selecionado fill + `on-primary`. Raio 12. O sublinhado ciano é das
 * TABS/nav, não do segmento.
 */
export function Segment({
  selected, onSelect, label, hint, ariaLabel, tonal = false,
}: {
  selected: boolean;
  onSelect: () => void;
  label: ReactNode;
  hint?: string;
  ariaLabel?: string;
  /** Ativo TONAL (canvas Loja D-L5 / Pet D-P1): `primary-soft` + `primary-ink`
   *  + borda `primary-ink` — "onde estou" não é ação, a placa cheia é do
   *  primário. O padrão sólido continua sendo o dos formulários. */
  tonal?: boolean;
}) {
  const onColor = tonal ? 'var(--sm2-primary-ink)' : 'var(--sm2-on-primary)';
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
      className="sm2-form-segment"
      style={{
        flex: 1,
        boxSizing: 'border-box',
        minHeight: 44,
        padding: '8px 8px',
        borderRadius: 'var(--sm2-radius-md)',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        fontFamily: 'var(--sm2-font-text)',
        fontSize: 'var(--sm2-text-sm)',
        fontWeight: 500,
        lineHeight: 'var(--sm2-leading-body)',
        border: selected ? `1px solid ${tonal ? 'var(--sm2-primary-ink)' : 'transparent'}` : '1px solid var(--sm2-muted)',
        backgroundColor: selected ? (tonal ? 'var(--sm2-primary-soft)' : 'var(--sm2-primary-fill)') : 'var(--sm2-surface-2)',
        color: selected ? onColor : 'var(--sm2-ink)',
        transition: 'background-color var(--sm2-dur-tap) var(--sm2-ease), border-color var(--sm2-dur-tap) var(--sm2-ease)',
      }}
    >
      <span>{label}</span>
      {/* A pista em TINTA (X5 do canvas Atividades): `muted` no inativo,
          `on-primary` no ativo — nunca `opacity`. */}
      {hint && <span style={{ fontSize: 'var(--sm2-text-xs)', fontWeight: 400, color: selected ? onColor : 'var(--sm2-muted)' }}>{hint}</span>}
    </button>
  );
}

/**
 * Caixa de seleção com rótulo. O rótulo inteiro é o alvo, com 44px de altura.
 * A caixa é 24 com raio 4 (canvas `Cards`): `appearance: none` em
 * `.sm2-form-check` — o nativo não aceita raio nem a fronteira `muted` 2px,
 * e marcada vira `primary-fill` com o check em `on-primary`.
 */
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
        className="sm2-form-check"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        /* `flexShrink: 0` NÃO é zelo. O `label` é um flex row, e sem isto a
           caixa é o item que cede quando o rótulo quebra em duas linhas:
           medido no aparelho de 375 px, no portão de conta, a caixa dos Termos
           renderizava 14,95 × 20 e a do 18+ renderizava 20 × 20 — duas caixas de
           tamanhos diferentes, uma achatada, lado a lado, no controle que
           carrega o aceite legal. Em tela de 320 px o esmagamento é maior. */
        style={{ width: 24, height: 24, flexShrink: 0, margin: 0 }}
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
        {/* O GRABBER — a alcinha. É a convenção que diz "isto vem de baixo e
            é uma folha", e sem ela o sheet lê como um card que apareceu do
            nada colado no rodapé. Não é um controle: arrastar-para-fechar não
            existe aqui (fechar é o X e o Escape, os dois já acessíveis), então
            ele é `aria-hidden` — anunciar uma alça que não arrasta seria pior
            que não ter alça nenhuma. */}
        <div
          aria-hidden="true"
          style={{
            width: 36, height: 4, margin: '8px auto 0',
            borderRadius: 2,
            backgroundColor: 'var(--sm2-line)',
            flexShrink: 0,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 8px 12px 18px' }}>
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

        {/* SAFE AREA. O sheet encosta no fundo da tela por definição, e o fundo
            da tela é justamente onde moram a barra de gestos do Android e a
            home indicator do iOS. Sem `env(safe-area-inset-bottom)` o botão
            PRIMÁRIO do formulário fica embaixo da barra do sistema — alvo
            inalcançável exatamente no controle que conclui a tarefa.
            Vale nos dois casos: com rodapé, ele carrega a folga; sem rodapé,
            ela vai para o fim do conteúdo rolável. */}
        <div
          style={{
            overflowY: 'auto',
            padding: footer
              ? '4px 18px 18px'
              : '4px 18px calc(18px + env(safe-area-inset-bottom, 0px))',
            display: 'flex', flexDirection: 'column', gap: 18,
          }}
        >
          {children}
        </div>

        {footer && (
          <div
            style={{
              padding: '16px 16px calc(16px + env(safe-area-inset-bottom, 0px))',
              borderTop: '1px solid var(--sm2-line)',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * CANVAS "CONTA" (20/09/2026, `docs/design/wireframes/conta/identidade/`,
 * `DECISOES-WIREFRAME.md` §29, D-K1). As linhas de ajuste e o card por
 * intenção moravam no `AISettingsModal` e na `SettingsPage`; a `RestWindowCard`
 * e o `StepsCard` (segundo uso real) desenhavam o mesmo card com o kit pixel.
 * Passam para cá — um desenho só. As classes `.sm2-conta-*` vivem no bloco
 * `CONTA (canvas §29)` no fim do `index.css` (footgun 1).
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * O grupo por intenção = card SIS-03 (surface, fronteira `line` 1px, raio 12,
 * padding 12) com o título Cinzel 20 — o `h2` do código. Sem ícone ao lado.
 *
 * G2 (navegação do dono, 01/10/2026): nas Configurações cada grupo vira
 * ACORDEÃO FECHADO por padrão — só o título + `expand_more`. `collapsible`
 * liga o modo; sem ele o card é o de sempre (o GM e quem mais usar o card
 * continuam iguais). O corpo fechado fica MONTADO com `hidden` (não
 * desmontado): o estado interno das seções (busca do plano, região viva,
 * o pedido de exclusão em andamento) sobrevive a fechar e abrir.
 * `open`/`onOpenChange` deixam o dono controlar (o "?" de Seus dados abre o
 * card); `titleAside` é o canto direito da linha do título, FORA do botão
 * (botão dentro de botão é HTML inválido).
 */
export function GroupCard({
  title, children, style, titleAs = 'h2', collapsible = false, defaultOpen = false,
  open: openProp, onOpenChange, titleAside,
}: {
  title: string;
  children: ReactNode;
  style?: CSSProperties;
  titleAs?: 'h2' | 'h3';
  collapsible?: boolean;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  titleAside?: ReactNode;
}) {
  const Title = titleAs;
  const [openState, setOpenState] = useState(defaultOpen);
  const bodyId = useId();
  if (!collapsible) {
    return (
      <section className="sm2-conta-card" style={style}>
        <Title className="sm2-title sm2-conta-h2">{title}</Title>
        {children}
      </section>
    );
  }
  const open = openProp ?? openState;
  const toggle = () => {
    const next = !open;
    if (openProp === undefined) setOpenState(next);
    onOpenChange?.(next);
  };
  return (
    <section className="sm2-conta-card sm2-conta-fold" data-group-open={open ? 'true' : 'false'} style={style}>
      <div className="sm2-conta-head">
        <Title className="sm2-title sm2-conta-h2" style={{ flex: 1, minWidth: 0 }}>
          <button
            type="button"
            className="sm2-conta-head-btn"
            aria-expanded={open}
            aria-controls={bodyId}
            data-group-toggle
            onClick={toggle}
          >
            <span style={{ flex: 1, minWidth: 0 }}>{title}</span>
            <Icon name={open ? 'expand_less' : 'expand_more'} size={24} tone="muted" />
          </button>
        </Title>
        {titleAside}
      </div>
      <div id={bodyId} hidden={!open} className="sm2-conta-body">
        {children}
      </div>
    </section>
  );
}

/**
 * A LINHA DE CONFIGURAÇÃO — o alvo é a linha inteira (`role="switch"`), 44 de
 * piso: rótulo 14/500 em `ink` + linha 12 `muted` + o `.switch` 52×32 (D-K1).
 * Ligado = trilho `primary-fill` + bolinha `on-primary`; desligado = trilho
 * `surface-2` + bolinha `muted` (D-K5: inerte por superfície, nunca alfa).
 * O trilho reusa `.sm2-kit-switch-track/-knob` — o mesmo desenho do kit.
 */
export function SwitchRow({
  checked, onToggle, label, hint, ariaLabel,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  hint?: string;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onToggle}
      className="sm2-conta-swrow"
    >
      <span className="sm2-conta-swrow-tx">
        <span className="sm2-conta-t">{label}</span>
        {hint && <span className="sm2-conta-s">{hint}</span>}
      </span>
      <span aria-hidden="true" className={checked ? 'sm2-conta-switch sm2-kit-switch-on' : 'sm2-conta-switch'}>
        <span className="sm2-kit-switch-track"><span className="sm2-kit-switch-knob" /></span>
      </span>
    </button>
  );
}

/** Linha que LEVA a algum lugar (outro painel, o guia, a política): 44 com
 *  `chevron_right` 24 `muted` pelado. Com `href` é um link na mesma linha. */
export function ActionRow({
  label, hint, onClick, href, language,
}: {
  label: string;
  hint?: string;
  onClick?: () => void;
  href?: string;
  /** Idioma do sufixo acessível "(abre em nova aba)" de `href` externo
   *  (A5, QA rodada 2 — a mesma regra do `TermsUpdateBanner`). Sem ele,
   *  PT só quando o aparelho é PT (`resolveLanguage`). */
  language?: Language;
}) {
  // `_blank` DIZ que abre em aba nova no nome acessível — o texto fica
  // visualmente escondido (mesmo padrão do banner de Termos, A3 de 21/09).
  const externo = !!href && !href.startsWith('mailto:');
  const pt = (language ?? resolveLanguage(readLocal(STORAGE_KEYS.LANGUAGE))) === 'pt-BR';
  const novaAba = pt ? '(abre em nova aba)' : '(opens in a new tab)';
  const inner = (
    <>
      <span className="sm2-conta-swrow-tx">
        <span className="sm2-conta-t">
          {label}
          {externo && <>{' '}<span style={SR_ONLY}>{novaAba}</span></>}
        </span>
        {hint && <span className="sm2-conta-s">{hint}</span>}
      </span>
      {/* `chevron_right` nos dois casos: `open_in_new` NÃO está no inventário
          da fonte subsetada, e nome fora dele não renderiza glifo nenhum e
          não dá erro (o pior modo de falha que existe). */}
      <Icon name="chevron_right" size={24} tone="muted" />
    </>
  );
  if (href) {
    // `mailto:` não abre aba: `_blank` nele deixava uma aba em branco atrás
    // do app de e-mail em alguns navegadores (design-critic B2, 21/09/2026).
    if (href.startsWith('mailto:')) return <a href={href} className="sm2-conta-arow">{inner}</a>;
    return <a href={href} target="_blank" rel="noopener noreferrer" className="sm2-conta-arow">{inner}</a>;
  }
  return <button type="button" onClick={onClick} className="sm2-conta-arow">{inner}</button>;
}

/**
 * Revelação — o que é avançado não fica empilhado. A mesma linha 44, 14/500
 * em `ink`, com `expand_more`/`expand_less` 24 `muted` (abrir para baixo, não
 * navegar). `aria-controls` liga o botão ao corpo.
 */
export function Disclosure({ label, children, defaultOpen = false }: { label: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={id}
        className="sm2-conta-disc"
      >
        <span className="sm2-conta-t" style={{ flex: 1, minWidth: 0 }}>{label}</span>
        <Icon name={open ? 'expand_less' : 'expand_more'} size={24} tone="muted" />
      </button>
      {open && <div id={id} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>}
    </div>
  );
}

/**
 * Campo de HORA (D-K3): `.inp` 44 com `schedule` 20 `muted` + o valor em mono
 * `tabular-nums` 16. O `<input type="time">` nativo fica transparente dentro
 * da casca; o anel de foco é `:focus-within` no CSS.
 */
export function TimeField({ value, onChange, ariaLabel, id }: {
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
  id?: string;
}) {
  return (
    <label className="sm2-conta-time">
      <Icon name="schedule" size={20} tone="muted" />
      <input
        id={id}
        type="time"
        value={value}
        aria-label={ariaLabel}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

/** O `role=alert` da família (D-K7): filete 3px + tinta `gold-ink` 500 — âmbar
 *  de convite, nunca vermelho. */
export function AlertLine({ children, id }: { children: ReactNode; id?: string }) {
  return <p role="alert" id={id} className="sm2-conta-alert">{children}</p>;
}

export default ModalSheet;
