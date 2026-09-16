/**
 * Kit de primitivos — VETOR sobre os tokens `--sm2-*`, MESMA API de antes.
 *
 * Reimplementado em 16/09/2026 a partir do canvas "Sistema" da Fase 2
 * (`docs/design/wireframes/sistema/identidade/`, SIS-02 Botões, SIS-03 Cards,
 * SIS-07 Dados; decisão em `docs/design/DECISOES-WIREFRAME.md` §18). O kit
 * anterior desenhava cada peça com 9-slice PNG (`btn-*.png`), chanfro de
 * cobre e Silkscreen — pixel FORA do visor, em 28 arquivos. A direção "O
 * Visor" (`04-IDENTIDADE-VISUAL.md` §1) diz o contrário: pixel só dentro do
 * vidro; fora, superfície limpa. Os PNGs de botão saíram do bundle (foram para
 * `E:\Soulmon\brand-archive\pixel-ui-antigo\`).
 *
 * O que NÃO mudou — e é o que faz esta troca ser segura para os 28 consumidores:
 *   · os nomes exportados e as props (`PixelButton` continua aceitando
 *     `variant="default"|"primary"`, `size="sm"|"md"|"lg"`, `icon` com `src`…);
 *   · os contratos de acessibilidade (`role`, `aria-*`, alvo ≥ 44, par PT/EN);
 *   · a barra segmentada continua DOM (valor real, não decoração).
 *
 * Regras que este arquivo obedece e que valem para quem o estender:
 *   1. Toda cor é token `--sm2-*`; raio só 4/12/20 (+ pílula como FORMA);
 *      espaço no grid de 4 (`--sm2-space-*`); texto nunca abaixo de 12px.
 *   2. Classe nova → `src/index.css`, no FIM (footgun 1: classe fora dele não
 *      aplica nada). Prefixo `sm2-kit-`, para não colidir com `.sm2-meter` /
 *      `.sm2-seg` do HUD do aparelho, que são outra peça (tinta de visor).
 *   3. Ícone é `Icon` (Material) pelado — nunca em box. `icon` (src de imagem)
 *      continua aceito por compatibilidade; prefira `iconName`.
 *   4. Medidor NUNCA é vermelho: `tone="red"` (mantido na API) desenha em
 *      cobre — crítico é leitura, não cobrança (HANDOFF §7, `01-VISAO` §7).
 *   5. `prefers-reduced-motion` corta as transições no bloco canônico do CSS.
 */
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Language } from '../../utils/i18n';
import { Icon } from '../ui/Icon';

export type PixelSize = 'sm' | 'md' | 'lg';

/**
 * Tom de um medidor. `cyan` = progresso (ciano, `--sm2-primary-fill`);
 * `gold` = descanso/marco (cobre, `--sm2-gold-fill`); `red` fica na API
 * por compatibilidade e desenha em COBRE — não existe medidor vermelho.
 */
export type PixelTone = 'cyan' | 'red' | 'gold';

const TONE: Record<PixelTone, string> = {
  cyan: 'var(--sm2-primary-fill)',
  gold: 'var(--sm2-gold-fill)',
  red: 'var(--sm2-gold-fill)',
};

/** Ícone de 20px ao lado de texto (degrau `inline` da escala, `tokens.md` §6.1). */
function InlineIcon({ src, name, fill }: { src?: string; name?: string; fill?: number }) {
  if (name) return <Icon name={name} size={20} fill={fill} />;
  if (src) {
    return (
      <img
        src={src}
        alt=""
        width={20}
        height={20}
        style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }}
      />
    );
  }
  return null;
}

// ───────────────────────────────────────────────────────────────── botão

export interface PixelButtonProps {
  children: ReactNode;
  onClick?: () => void;
  /** sm 44 · md 48 · lg 56 e largura total (CTA de tela). */
  size?: PixelSize;
  /**
   * `primary` = a ação da tela (um por tela — o ciano é a única luz forte).
   * `default` = `outline` (a alternativa). `ghost` = ação leve em ciano sem
   * borda. `quiet` = sair sem peso ("Not now"), em `muted`.
   */
  variant?: 'default' | 'primary' | 'outline' | 'ghost' | 'quiet';
  disabled?: boolean;
  /** Ícone à esquerda por `src` de imagem (compatibilidade). Prefira `iconName`. */
  icon?: string;
  /** Ícone Material à esquerda (20px, pelado). Vence `icon` se os dois vierem. */
  iconName?: string;
  /**
   * Em progresso: ícone `sync` girando no lugar do ícone, botão desativado ao
   * toque, rótulo mantido ("Feeding…"). Sem spinner extra.
   */
  busy?: boolean;
  type?: 'button' | 'submit';
  title?: string;
  ariaLabel?: string;
  style?: CSSProperties;
}

const BTN_SIZE: Record<PixelSize, string> = { sm: 'sm2-kit-btn-sm', md: 'sm2-kit-btn-md', lg: 'sm2-kit-btn-lg' };
const BTN_VARIANT: Record<NonNullable<PixelButtonProps['variant']>, string> = {
  default: 'sm2-kit-btn-outline',
  outline: 'sm2-kit-btn-outline',
  primary: 'sm2-kit-btn-primary',
  ghost: 'sm2-kit-btn-ghost',
  quiet: 'sm2-kit-btn-quiet',
};

export function PixelButton({
  children, onClick, size = 'md', variant = 'default',
  disabled = false, icon, iconName, busy = false, type = 'button', title, ariaLabel, style,
}: PixelButtonProps) {
  const off = disabled || busy;
  // Classes por extenso (nada de `sm2-kit-btn-${x}`): o guard de classe
  // fantasma (`index.css.contract.test.ts`) só enxerga literal.
  const cls = ['sm2-kit-btn', BTN_SIZE[size], BTN_VARIANT[variant]];
  if (busy) cls.push('sm2-kit-btn-busy');
  return (
    <button
      type={type}
      onClick={off ? undefined : onClick}
      disabled={off}
      aria-busy={busy || undefined}
      title={title}
      aria-label={ariaLabel}
      className={cls.join(' ')}
      style={style}
    >
      {busy
        ? <Icon name="sync" size={20} className="sm2-kit-spin" />
        : <InlineIcon src={icon} name={iconName} />}
      {children}
    </button>
  );
}

// ───────────────────────────────────────────────────────────────── painel

export interface PixelPanelProps {
  children: ReactNode;
  /** Rótulo de seção: Rubik 12/500, caixa alta, `muted`. */
  title?: string;
  /** Ícone do título por `src` (compatibilidade). Prefira `titleIconName`. */
  titleIcon?: string;
  /** Ícone Material do título (20px, pelado). */
  titleIconName?: string;
  /** `false` remove o padding interno (grades que desenham o próprio espaço). */
  padded?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** Card: `surface` + `line` 1px + raio 12. Sem sombra em repouso, sem chanfro. */
export function PixelPanel({ children, title, titleIcon, titleIconName, padded = true, className, style }: PixelPanelProps) {
  return (
    <div className={`sm2-kit-panel${className ? ` ${className}` : ''}`} style={style}>
      {title && (
        <div className="sm2-kit-panel-title">
          <InlineIcon src={titleIcon} name={titleIconName} />
          {title}
        </div>
      )}
      <div className={padded ? 'sm2-kit-panel-body' : undefined}>{children}</div>
    </div>
  );
}

// ──────────────────────────────────────────────────── barra segmentada

export interface PixelSegmentedBarProps {
  value: number;
  max: number;
  /** Nº de blocos. Padrão: um bloco por unidade (até 12). */
  segments?: number;
  tone?: PixelTone;
  height?: number;
  label?: string;
  style?: CSSProperties;
}

/**
 * Medidor segmentado, fora do visor (vetor). Um bloco por unidade; MEIA
 * unidade = metade do bloco (meta ponderada aceita 2,5/4 — arredondar
 * mentiria sobre a regra do jogo). Trilho `surface-2` + `muted` 1px, fill
 * no tom. Dentro do vidro a mesma leitura é a `VisorBar` pixel.
 */
export function PixelSegmentedBar({
  value, max, segments, tone = 'cyan', height = 12, label, style,
}: PixelSegmentedBarProps) {
  const total = Math.max(1, segments ?? Math.min(Math.max(1, Math.round(max)), 12));
  const ratio = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  const units = ratio * total;
  const on = Math.floor(units + 1e-6);
  const half = on < total && units - on >= 0.5 - 1e-6;
  return (
    <div
      className="sm2-kit-segbar"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      style={{ height, '--sm2-kit-tone': TONE[tone], ...style } as CSSProperties}
    >
      {Array.from({ length: total }, (_, i) => {
        const cls = i < on
          ? 'sm2-kit-segbar-seg sm2-kit-segbar-seg-on'
          : (i === on && half ? 'sm2-kit-segbar-seg sm2-kit-segbar-seg-half' : 'sm2-kit-segbar-seg');
        return <div key={i} className={cls} />;
      })}
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

/** Caixa de 24 (raio 4, `muted` 2px; marcada = `primary-fill` + check) num alvo de 44. */
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
      className="sm2-kit-check"
    >
      <span aria-hidden="true" className={checked ? 'sm2-kit-check-box sm2-kit-check-on' : 'sm2-kit-check-box'}>
        {checked && <Icon name="check" size={20} fill={1} weight={700} />}
      </span>
    </button>
  );
}

// ──────────────────────────────────────────────────────────────────── abas

export interface PixelTabItem<K extends string> {
  key: K;
  label: string;
  /** Ícone por `src` (compatibilidade). Prefira `iconName`. */
  icon?: string;
  /** Ícone Material (20px). FILL 1 na aba selecionada. */
  iconName?: string;
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
 * Fileira de abas: 44 de alvo, texto 14/500, seleção = tinta `primary-ink`
 * + SUBLINHADO ciano de 3px — a mesma pista da nav inferior (uma barra não é
 * uma caixa). `role="tablist"`/`role="tab"` + `aria-selected`: o estado
 * existe para quem não vê o sublinhado.
 *
 * A fileira rola quando não cabe (Loja em PT-BR tem 5 abas) e a pista de
 * corte é medida, não presumida (`data-cut`): uma máscara fixa esmaeceria a
 * última aba das fileiras que cabem inteiras.
 */
export function PixelTabs<K extends string>({ items, value, onChange, ariaLabel, style }: PixelTabsProps<K>) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [cut, setCut] = useState<'none' | 'start' | 'end' | 'both'>('none');
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => {
      const inicio = el.scrollLeft > 2;
      const fim = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
      setCut(inicio && fim ? 'both' : fim ? 'end' : inicio ? 'start' : 'none');
    };
    medir();
    el.addEventListener('scroll', medir, { passive: true });
    // `ResizeObserver` e não `window.resize`: a fileira também muda de
    // largura quando o PAI muda (abrir teclado, girar, painel colapsar).
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(medir) : null;
    ro?.observe(el);
    return () => { el.removeEventListener('scroll', medir); ro?.disconnect(); };
  }, [items.length]);

  return (
    <div
      ref={ref}
      className="sm2-kit-tabs"
      role="tablist"
      aria-label={ariaLabel}
      data-cut={cut === 'none' ? undefined : cut}
      style={style}
    >
      {items.map(t => {
        const on = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(t.key)}
            className={on ? 'sm2-kit-tab sm2-kit-tab-on' : 'sm2-kit-tab'}
          >
            <InlineIcon src={t.icon} name={t.iconName} fill={on ? 1 : 0} />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────── chip de escolha

export interface PixelChoiceChipProps {
  children: ReactNode;
  selected: boolean;
  onToggle: () => void;
  /** Ícone por `src` (compatibilidade). Prefira `iconName`. */
  icon?: string;
  /** Ícone Material (20px) à esquerda. */
  iconName?: string;
  /** `day` aperta a caixa a 44×44 — rótulo de 1–3 letras, sem check. */
  shape?: 'default' | 'day';
  disabled?: boolean;
  title?: string;
  ariaLabel?: string;
}

/**
 * Chip de seleção múltipla (dias da semana, categoria). Pílula TONAL (M3
 * filter chip): não selecionado = `surface-2` + `muted` 1px; selecionado =
 * `primary-soft` + borda `primary-ink` + check — pista de forma além da cor.
 * 44 de alvo. `role="checkbox"`: são escolhas independentes.
 */
export function PixelChoiceChip({
  children, selected, onToggle, icon, iconName, shape = 'default', disabled = false, title, ariaLabel,
}: PixelChoiceChipProps) {
  const cls = ['sm2-kit-chip'];
  if (shape === 'day') cls.push('sm2-kit-chip-day');
  if (selected) cls.push('sm2-kit-chip-on');
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
      {selected && shape !== 'day' && <Icon name="check" size={20} fill={1} />}
      <InlineIcon src={icon} name={iconName} fill={selected ? 1 : 0} />
      {children}
    </button>
  );
}

// ────────────────────────────────────────────────────── etiqueta estática

export interface PixelTagProps {
  children: ReactNode;
  /** Etiqueta em tinta primária (`primary-ink` sobre `primary-soft`) — "concluída", "equipado". */
  filled?: boolean;
  title?: string;
  style?: CSSProperties;
}

/** Etiqueta de 24px que só informa (NPC, "5 partidas/dia"). Não é botão: sem hover, sem foco. */
export function PixelTag({ children, filled = false, title, style }: PixelTagProps) {
  return (
    <span className={filled ? 'sm2-kit-tag sm2-kit-tag-on' : 'sm2-kit-tag'} title={title} style={style}>
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────────────────── interruptor

export interface PixelSwitchProps {
  checked: boolean;
  onToggle: () => void;
  /** Obrigatório: um interruptor sem rótulo acessível é um botão mudo. */
  ariaLabel: string;
  disabled?: boolean;
}

/**
 * Chave liga/desliga: trilho 52×32 (`surface-2` + `muted` 2px; ligado =
 * `primary-fill`) dentro de um alvo de 52×44. Quem monta numa linha de
 * configuração faz a LINHA inteira ser o alvo (rótulo clicável).
 */
export function PixelSwitch({ checked, onToggle, ariaLabel, disabled = false }: PixelSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={disabled ? undefined : onToggle}
      className={checked ? 'sm2-kit-switch sm2-kit-switch-on' : 'sm2-kit-switch'}
    >
      <span aria-hidden="true" className="sm2-kit-switch-track">
        <span className="sm2-kit-switch-knob" />
      </span>
    </button>
  );
}

// ─────────────────────────────────────────── trilho de proporção contínua

export interface PixelMeterProps {
  /** 0..1. Proporção CONTÍNUA — para contagem discreta use PixelSegmentedBar. */
  ratio: number;
  tone?: PixelTone;
  height?: number;
  label?: string;
  style?: CSSProperties;
}

/**
 * Medidor contínuo fora do visor: 12px, raio 4, trilho `surface-2` + `muted`
 * 1px, fill no tom. Cor = TOM (ciano progresso, cobre descanso), nunca estado
 * de alarme; quem chama garante que constância nova nasce cheia
 * (`habitRhythm`) — o medidor não acusa.
 */
export function PixelMeter({ ratio, tone = 'cyan', height = 12, label, style }: PixelMeterProps) {
  const pct = Math.round(Math.min(1, Math.max(0, ratio)) * 100);
  return (
    <div
      className="sm2-kit-meter"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      style={{ height, '--sm2-kit-tone': TONE[tone], ...style } as CSSProperties}
    >
      <div className="sm2-kit-meter-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ──────────────────────────────────────────── casa de ícone de item (44px)

export interface PixelSlotProps {
  /** Url de arte (ícone do kit, thumb de cenário, decoração). */
  src?: string;
  /** Fundo CSS puro (thumbnail de cenário) quando não há PNG. */
  background?: string;
  locked?: boolean;
  /** Sobreposição (cadeado, contador). */
  overlay?: ReactNode;
  alt?: string;
}

/**
 * Casa de 44px de um item: `surface-2` + `muted` 1px, raio 12 — um mini-visor
 * sem anel (a arte dentro é pixel; a moldura, não). **O fallback é o quadro
 * vazio, nunca o emoji do sistema**: a casa é desenhada mesmo sem arte porque
 * é ela que alinha a coluna de texto entre as linhas da lista. `locked` = arte
 * a 35% (o toque explica o desbloqueio; a peça nunca some).
 */
export function PixelSlot({ src, background, locked = false, overlay, alt = '' }: PixelSlotProps) {
  return (
    <span className={locked ? 'sm2-kit-slot sm2-kit-slot-locked' : 'sm2-kit-slot'}>
      {background && <span aria-hidden="true" style={{ position: 'absolute', inset: 0, backgroundImage: background, backgroundSize: 'cover', backgroundPosition: 'center' }} />}
      {src && (
        <img src={src} alt={alt} style={{ position: 'relative', width: '76%', height: '76%', objectFit: 'contain', imageRendering: 'pixelated' }} />
      )}
      {overlay}
    </span>
  );
}

// ─────────────────────────────────────────────────── chip de estatística

export interface PixelChipProps {
  label: string;
  /** Nó, não string, porque cada moeda tem estilo próprio obrigatório. */
  value: ReactNode;
  /** Ícone por `src` (compatibilidade). Prefira `iconName`. */
  icon?: string;
  /** Ícone Material (20px). */
  iconName?: string;
  title?: string;
  style?: CSSProperties;
  /**
   * Chip CLICÁVEL — a pílula vira o próprio `<button>` (é ela que recebe
   * foco e o dedo; alvo sobe para 44).
   */
  onClick?: () => void;
  /** Obrigatório quando `onClick` existe: o valor sozinho não diz a ação. */
  ariaLabel?: string;
}

/** Rótulo + valor numa pílula `surface-2` de 32px (moedas do cabeçalho). */
export function PixelChip({ label, value, icon, iconName, title, style, onClick, ariaLabel }: PixelChipProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={onClick ? 'sm2-kit-stat sm2-kit-stat-tap' : 'sm2-kit-stat'}
      title={title}
      style={style}
      {...(onClick ? { type: 'button' as const, onClick, 'aria-label': ariaLabel } : {})}
    >
      <InlineIcon src={icon} name={iconName} />
      <span className="sm2-kit-stat-label">{label}</span>
      <span className="sm2-kit-stat-value sm2-num">{value}</span>
    </Tag>
  );
}
