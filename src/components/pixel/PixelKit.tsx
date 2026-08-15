/**
 * Kit pixel — primitivos de UI da direção visual das referências v1.2
 * (`docs/ui-refs/SPEC-UI-PIXEL.md`).
 *
 * Por que um arquivo só: a arte 9-slice, as fatias medidas no PNG e as regras
 * de estado moram juntas. Espalhar isso por seis arquivos faz cada tela
 * reinventar a fatia — e fatia errada é moldura esticada, que ninguém percebe
 * até virar screenshot.
 *
 * Decisões que valem registro (detalhe no relatório da rodada):
 *
 * 1. **Só o PNG `normal` é usado como 9-slice.** Os PNGs `hover`/`active` do
 *    kit trazem um halo MAGENTA/ROXO assado na arte — resíduo da paleta antiga
 *    (o reskin de ago/2026 trocou roxo por teal/cobre). Ligar aqueles arquivos
 *    reintroduziria roxo na UI. Hover/active/disabled são derivados por filtro
 *    em cima do `normal`, dentro da paleta. O `disabled` PNG, além disso, tem
 *    enquadramento diferente dos outros (bbox até a borda do canvas), o que
 *    quebraria a fatia.
 * 2. **A arte foi RECORTADA, não redesenhada.** Os PNGs originais têm margem
 *    transparente irregular (17px aqui, 21px ali), e `border-image` fatia o
 *    canvas inteiro — margem transparente dentro da fatia = moldura fina com
 *    folga. `src/assets/soulmon/ui/btn-{sm,md,lg}.png` são os mesmos arquivos
 *    cortados na bbox alfa (via sharp, determinístico).
 * 3. **A barra segmentada é DOM, não PNG.** `bar-hp-segmented-cyan.png` é uma
 *    barra fixa de 9 blocos cheios; não sabe mostrar 3/7. A leitura visual é a
 *    mesma, o valor é real.
 * 4. **Texto sempre nasce em EN com par PT-BR** — os componentes que têm texto
 *    próprio (só o `aria-label` do checkbox) recebem `language`.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { Language } from '../../utils/i18n';
import btnSm from '../../assets/soulmon/ui/btn-sm.png';
import btnMd from '../../assets/soulmon/ui/btn-md.png';
import btnLg from '../../assets/soulmon/ui/btn-lg.png';

/** Fatia (px na arte de origem) medida até onde o preenchimento teal começa. */
const BTN_ART = {
  sm: { src: btnSm, cls: 'sm-px-btn-sm' },
  md: { src: btnMd, cls: 'sm-px-btn-md' },
  lg: { src: btnLg, cls: 'sm-px-btn-lg' },
} as const;

export type PixelSize = 'sm' | 'md' | 'lg';

/** `--sm-px-src` é lido pelas regras `.sm-px-btn` / `.sm-px-panel`. */
function artVar(src: string): CSSProperties {
  return { '--sm-px-src': `url(${src})` } as CSSProperties;
}

// ───────────────────────────────────────────────────────────────── botão

export interface PixelButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** small (44px de alvo) · medium · large (largura total, CTA de tela). */
  size?: PixelSize;
  /** `primary` acende o miolo em ciano — o estado de destaque da referência. */
  variant?: 'default' | 'primary';
  disabled?: boolean;
  /** Ícone à esquerda (variante "com ícone" da folha de referência). */
  icon?: string;
  type?: 'button' | 'submit';
  title?: string;
  ariaLabel?: string;
  style?: CSSProperties;
}

export function PixelButton({
  children, onClick, size = 'md', variant = 'default',
  disabled = false, icon, type = 'button', title, ariaLabel, style,
}: PixelButtonProps) {
  const art = BTN_ART[size];
  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className={`sm-px-btn ${art.cls}${variant === 'primary' ? ' sm-px-btn-primary' : ''}`}
      style={{ ...artVar(art.src), ...style }}
    >
      {/* O conteúdo sobe acima do miolo aceso da variante primary (ver a nota
          sobre `border-image … fill` em .sm-px-btn-primary no index.css). */}
      <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        {icon && (
          <img
            src={icon}
            alt=""
            width={20}
            height={20}
            style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }}
          />
        )}
        {children}
      </span>
    </button>
  );
}

// ───────────────────────────────────────────────────────────────── painel

export interface PixelPanelProps {
  children: ReactNode;
  /** Título em caixa alta (o "DAILY RITUALS" da referência). */
  title?: string;
  titleIcon?: string;
  /** `false` remove o padding interno (grades que desenham o próprio espaço). */
  padded?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function PixelPanel({ children, title, titleIcon, padded = true, className, style }: PixelPanelProps) {
  return (
    <div
      className={`sm-px-panel${className ? ` ${className}` : ''}`}
      style={{ ...artVar(btnLg), '--sm-px-slice': 43, '--sm-px-bw': '10px', ...style } as CSSProperties}
    >
      {title && (
        <div className="sm-px-panel-title">
          {titleIcon && (
            <img src={titleIcon} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated' }} />
          )}
          {title}
        </div>
      )}
      <div className={padded ? 'sm-px-panel-body' : undefined}>{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────── barra segmentada

export interface PixelSegmentedBarProps {
  value: number;
  max: number;
  /** Nº de blocos. Padrão: um bloco por unidade (até 12), como no v-pet. */
  segments?: number;
  tone?: 'cyan' | 'red' | 'gold';
  height?: number;
  label?: string;
  style?: CSSProperties;
}

const TONE: Record<'cyan' | 'red' | 'gold', string> = {
  cyan: 'var(--sm-px-cyan)',
  red: 'var(--sm-px-red)',
  gold: 'var(--sm-px-copper)',
};

export function PixelSegmentedBar({
  value, max, segments, tone = 'cyan', height = 12, label, style,
}: PixelSegmentedBarProps) {
  const total = Math.max(1, segments ?? Math.min(Math.max(1, Math.round(max)), 12));
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const on = Math.round(ratio * total);
  return (
    <div
      className="sm-px-bar"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      style={{ height, '--sm-px-bar-tone': TONE[tone], ...style } as CSSProperties}
    >
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={i < on ? 'sm-px-bar-seg sm-px-bar-seg-on' : 'sm-px-bar-seg'} />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────── checkbox

export interface PixelCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  disabled?: boolean;
  language?: Language;
  /** Sobrescreve o rótulo acessível (já vem com par PT/EN por padrão). */
  labelPt?: string;
  labelEn?: string;
}

export function PixelCheckbox({
  checked, onToggle, disabled = false, language = 'en-US', labelPt, labelEn,
}: PixelCheckboxProps) {
  const isPt = language === 'pt-BR';
  const fallbackPt = checked ? 'Concluído' : 'Marcar como concluído';
  const fallbackEn = checked ? 'Completed' : 'Mark as completed';
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={isPt ? (labelPt ?? fallbackPt) : (labelEn ?? fallbackEn)}
      disabled={disabled}
      onClick={disabled ? undefined : onToggle}
      className="sm-px-check"
      style={disabled ? { opacity: 0.5 } : undefined}
    >
      <span aria-hidden="true" className={checked ? 'sm-px-check-box sm-px-check-on' : 'sm-px-check-box'}>
        {checked && (
          <svg width="15" height="15" viewBox="0 0 14 14" fill="none">
            <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="var(--sm-primary)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
    </button>
  );
}

// ──────────────────────────────────────────────────────── abas emolduradas

export interface PixelTabItem<K extends string> {
  key: K;
  label: string;
  /** Ícone do kit (url do import). Fallback = sem ícone, NUNCA emoji. */
  icon?: string;
}

export interface PixelTabsProps<K extends string> {
  items: readonly PixelTabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /** Rótulo acessível da fileira (já vem com par PT/EN de quem chama). */
  ariaLabel?: string;
  style?: CSSProperties;
}

/**
 * Fileira de abas — o conserto do **G9**.
 *
 * O que estava errado não era a cor: era *o que carregava a seleção*. Loja e
 * Torneio anunciavam a aba ativa por cor de texto + sublinhado de 2,5px,
 * deixando o preenchimento igual nas cinco. No tema claro, a superfície branca
 * dos itens não-selecionados pesava mais que o texto colorido do selecionado —
 * e quem olhava a tela lia a aba errada como ativa. No escuro invertia.
 *
 * Aqui a seleção é o **fill**, e só ela: hover mexe na borda, foco mexe no
 * outline, desabilitado mexe na opacidade. Nenhum dos outros três estados pode
 * produzir um bloco sólido, então nenhum deles pode ser confundido com o
 * selecionado — em nenhum dos dois temas. Os tokens estão em `index.css`
 * (`--sm-px-sel-*` / `--sm-px-off-*`).
 *
 * `role="tablist"`/`role="tab"` com `aria-selected`: o estado precisa existir
 * para quem não vê o fill, senão trocamos um defeito visual por um de leitor
 * de tela.
 */
export function PixelTabs<K extends string>({ items, value, onChange, ariaLabel, style }: PixelTabsProps<K>) {
  return (
    <div className="sm-px-tabs" role="tablist" aria-label={ariaLabel} style={style}>
      {items.map(t => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={on ? 'sm-px-tab sm-px-tab-on' : 'sm-px-tab'}
          >
            {t.icon && (
              <img src={t.icon} alt="" width={16} height={16} style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
            )}
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────── chip de escolha (G8/G9)

export interface PixelChoiceChipProps {
  children: ReactNode;
  selected: boolean;
  onToggle: () => void;
  /** Ícone do kit à esquerda. */
  icon?: string;
  /** `day` aperta a caixa e usa bitmap — rótulo de 3 letras. */
  shape?: 'default' | 'day';
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
}

/**
 * Chip de seleção múltipla (dias da semana, categoria da tarefa).
 *
 * Era pílula `border-radius: 999px` repetida em quatro arquivos
 * (`CreateModal`, `EditModal`, `TaskEditModal`, `GameTutorialFlow`), cada um
 * com a sua cópia do objeto de estilo. Além da forma errada (T2 conta pílulas),
 * o ativo usava `--sm-primary-soft`, que no tema claro é quase o branco do
 * fundo: a mesma inversão do G9, num controle de formulário.
 *
 * `role="checkbox"` e não `button`: são escolhas independentes, e sem
 * `aria-checked` o estado só existia na cor.
 */
export function PixelChoiceChip({
  children, selected, onToggle, icon, shape = 'default', disabled = false, title, ariaLabel,
}: PixelChoiceChipProps) {
  const cls = ['sm-px-chip-btn'];
  if (shape === 'day') cls.push('sm-px-chip-day');
  if (selected) cls.push('sm-px-chip-on');
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={selected}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={disabled ? undefined : onToggle}
      className={cls.join(' ')}
    >
      {icon && (
        <img src={icon} alt="" width={18} height={18} style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
      )}
      {children}
    </button>
  );
}

// ────────────────────────────────────────────────────── etiqueta estática

export interface PixelTagProps {
  children: ReactNode;
  /** Etiqueta preenchida (mesmo fill da seleção) — use para "concluída". */
  filled?: boolean;
  title?: string;
  style?: CSSProperties;
}

/** Etiqueta que só informa (NPC, "5 partidas/dia"). Não é botão: sem hover. */
export function PixelTag({ children, filled = false, title, style }: PixelTagProps) {
  return (
    <span className={filled ? 'sm-px-tag sm-px-tag-on' : 'sm-px-tag'} title={title} style={style}>
      {children}
    </span>
  );
}

// ───────────────────────────────────────────────── interruptor emoldurado

export interface PixelSwitchProps {
  checked: boolean;
  onToggle: () => void;
  /** Obrigatório: um interruptor sem rótulo acessível é um botão mudo. */
  ariaLabel: string;
  disabled?: boolean;
}

/** Chave liga/desliga na forma do kit (o pill+bolinha era Material puro). */
export function PixelSwitch({ checked, onToggle, ariaLabel, disabled = false }: PixelSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={disabled ? undefined : onToggle}
      className={checked ? 'sm-px-switch sm-px-switch-on' : 'sm-px-switch'}
    >
      <span aria-hidden="true" className="sm-px-switch-knob" />
    </button>
  );
}

// ─────────────────────────────────────────── trilho de proporção contínua

export interface PixelMeterProps {
  /** 0..1. Proporção CONTÍNUA — para contagem discreta use PixelSegmentedBar. */
  ratio: number;
  tone?: 'cyan' | 'red' | 'gold';
  height?: number;
  label?: string;
  style?: CSSProperties;
}

export function PixelMeter({ ratio, tone = 'cyan', height = 12, label, style }: PixelMeterProps) {
  const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div
      className="sm-px-meter"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={{ height, '--sm-px-bar-tone': TONE[tone], ...style } as CSSProperties}
    >
      <div className="sm-px-meter-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ──────────────────────────────────────────── moldura de ícone de item 44px

export interface PixelSlotProps {
  /** Url de arte (ícone do kit, thumb de cenário, decoração). */
  src?: string;
  /** Fundo CSS puro (thumbnail de cenário) quando não há PNG. */
  background?: string;
  locked?: boolean;
  /** Sobreposição (cadeado). */
  overlay?: ReactNode;
  alt?: string;
}

/**
 * Casa de 44px de um item. **O fallback é o quadro vazio, nunca o emoji do
 * sistema** — mesma decisão da rodada 1 (G2). A casa é desenhada mesmo sem
 * arte, porque é ela que alinha a coluna de texto entre as linhas da lista.
 */
export function PixelSlot({ src, background, locked = false, overlay, alt = '' }: PixelSlotProps) {
  return (
    <span className={locked ? 'sm-px-slot sm-px-slot-locked' : 'sm-px-slot'} style={{ position: 'relative' }}>
      {background && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: background, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
      {src && (
        <img src={src} alt={alt} style={{ position: 'relative', width: '76%', height: '76%', objectFit: 'contain', imageRendering: 'pixelated' }} />
      )}
      {overlay}
    </span>
  );
}

// ─────────────────────────────────────────────────────────── cápsula HUD

export interface PixelChipProps {
  label: string;
  /** Nó, não string, porque cada moeda tem estilo próprio obrigatório. */
  value: ReactNode;
  icon?: string;
  title?: string;
  style?: CSSProperties;
}

export function PixelChip({ label, value, icon, title, style }: PixelChipProps) {
  return (
    <div className="sm-px-chip" title={title} style={style}>
      {icon && (
        <img src={icon} alt="" width={22} height={22} style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
      )}
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="sm-px-chip-label">{label}</span>
        <span className="sm-px-chip-value">{value}</span>
      </span>
    </div>
  );
}
