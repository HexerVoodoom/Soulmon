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
 * 1. **Cada estado tem seu PNG, e os quatro dividem a MESMA geometria.**
 *    Os `hover`/`active` antigos do kit traziam halo MAGENTA/ROXO assado
 *    (resíduo da paleta anterior ao reskin de ago/2026) e o `disabled` vinha
 *    com enquadramento diferente — por isso só o `normal` era usado, com os
 *    estados derivados por filtro CSS. Substituídos em 18/08/2026 por arte
 *    DERIVADA do próprio `normal` (`E:\Soulmon-assets\gen_button_states.py`):
 *    cada pixel é classificado em cobre/teal pela relação entre os canais e só
 *    então recebe o ajuste, então o contorno e o fio ciano ficam intactos.
 *    Derivar em vez de redesenhar é o que garante que as fatias medidas abaixo
 *    (82/66/43) continuem valendo para os quatro estados — fatia que não bate
 *    faz a moldura PULAR no hover, justamente o frame em que o olho está no
 *    botão. O resíduo ameixa do arquivo de origem foi apagado por inpainting
 *    no caminho: os nove arquivos medem 0,0000% de magenta.
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
import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Language } from '../../utils/i18n';
import btnSm from '../../assets/soulmon/ui/btn-sm.png';
import btnMd from '../../assets/soulmon/ui/btn-md.png';
import btnLg from '../../assets/soulmon/ui/btn-lg.png';
import btnSmHover from '../../assets/soulmon/buttons/button-hover-small.png';
import btnMdHover from '../../assets/soulmon/buttons/button-hover-medium.png';
import btnLgHover from '../../assets/soulmon/buttons/button-hover-large.png';
import btnSmActive from '../../assets/soulmon/buttons/button-active-small.png';
import btnMdActive from '../../assets/soulmon/buttons/button-active-medium.png';
import btnLgActive from '../../assets/soulmon/buttons/button-active-large.png';
import btnSmOff from '../../assets/soulmon/buttons/button-disabled-small.png';
import btnMdOff from '../../assets/soulmon/buttons/button-disabled-medium.png';
import btnLgOff from '../../assets/soulmon/buttons/button-disabled-large.png';

/** Fatia (px na arte de origem) medida até onde o preenchimento teal começa. */
const BTN_ART = {
  sm: { src: btnSm, hover: btnSmHover, active: btnSmActive, off: btnSmOff, cls: 'sm-px-btn-sm' },
  md: { src: btnMd, hover: btnMdHover, active: btnMdActive, off: btnMdOff, cls: 'sm-px-btn-md' },
  lg: { src: btnLg, hover: btnLgHover, active: btnLgActive, off: btnLgOff, cls: 'sm-px-btn-lg' },
} as const;

export type PixelSize = 'sm' | 'md' | 'lg';

/** `--sm-px-src` é lido pelas regras `.sm-px-btn` / `.sm-px-panel`. */
function artVar(src: string): CSSProperties {
  return { '--sm-px-src': `url(${src})` } as CSSProperties;
}

/**
 * As quatro artes do botão. O CSS troca qual delas alimenta `--sm-px-src` em
 * `:hover` / `:active` / `:disabled` — a escolha do estado é do NAVEGADOR, e
 * não de estado do React, senão teclado e toque precisariam de tratamento
 * próprio para chegar no mesmo lugar.
 */
function btnArtVars(a: (typeof BTN_ART)[PixelSize]): CSSProperties {
  return {
    '--sm-px-src': `url(${a.src})`,
    '--sm-px-src-hover': `url(${a.hover})`,
    '--sm-px-src-active': `url(${a.active})`,
    '--sm-px-src-off': `url(${a.off})`,
  } as CSSProperties;
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
      style={{ ...btnArtVars(art), ...style }}
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
      /* RODADA 4 — a quina do painel.
         Era `slice 43 / bw 10px`, e os dois números estavam errados:

         · SLICE. Medido no `btn-lg.png` (amostragem de pixel, borda de cima):
           contorno escuro 0–11, cobre 12–29, contorno interno 30–39, MIOLO
           TEAL a partir de 40. Com slice 43 os 3px de teal do miolo entravam
           na fatia da borda e vazavam como um risco escuro dentro da moldura
           (visível no recorte ampliado do canto). A moldura tem 40 px de arte,
           então a fatia é 40.
         · LARGURA. O ladrilho de QUINA é `slice × slice` e é espremido em
           `bw`: 43px de arte em 10px de tela colapsavam o chanfro do desenho
           num tarugo escuro de ~10px — o "bloco escuro na quina". Em 14px a
           quina desenha o chanfro da arte na proporção certa e FECHA.

         Custo: +4px de moldura por lado. É o preço de a peça de canto existir. */
      style={{ ...artVar(btnLg), '--sm-px-slice': 40, '--sm-px-bw': '14px', ...style } as CSSProperties}
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
  // ── B3 (rodada 3): a fileira SEMPRE rolou; o que faltava era a pista.
  // Na Loja, 2 de 5 abas (Torneio, Missões) ficavam fora da tela e a última
  // aba visível terminava rente à margem — o desenho que Material e HIG
  // proíbem, porque nada distingue "acabou" de "tem mais".
  //
  // O estado tem de ser medido, não presumido: uma máscara fixa esmaeceria a
  // última aba das fileiras que CABEM inteiras (Aparência, Idioma, Torneio,
  // Biblioteca), inventando um corte inexistente. Daí o `data-cut`.
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
    // Reavalia quando o conjunto de abas muda (5 abas da Loja vs. 2 do Idioma).
  }, [items.length]);

  return (
    <div
      ref={ref}
      className="sm-px-tabs"
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
  /**
   * Cápsula CLICÁVEL — a moldura vira o próprio `<button>`.
   *
   * Rodada 3 (B1): a cápsula de Créditos era um `<button>` transparente
   * envolvendo uma cápsula. Funcionava, mas o CONTROLE (o que recebe foco, o
   * que o dedo acerta, o que a métrica lê) era a caixa sem superfície, e a
   * moldura era um filho decorativo. Era o último "controle interativo sem
   * moldura" da Home depois do B1 — e a diferença aparece de verdade no
   * `:focus-visible`, que antes desenhava um anel em volta do nada.
   */
  onClick?: () => void;
  /** Obrigatório quando `onClick` existe: o valor sozinho não diz a ação. */
  ariaLabel?: string;
}

export function PixelChip({ label, value, icon, title, style, onClick, ariaLabel }: PixelChipProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      className={onClick ? 'sm-px-chip sm-px-chip-tap' : 'sm-px-chip'}
      title={title}
      style={style}
      {...(onClick ? { type: 'button' as const, onClick, 'aria-label': ariaLabel } : {})}
    >
      {icon && (
        <img src={icon} alt="" width={22} height={22} style={{ objectFit: 'contain', imageRendering: 'pixelated', flexShrink: 0 }} />
      )}
      <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span className="sm-px-chip-label">{label}</span>
        <span className="sm-px-chip-value">{value}</span>
      </span>
    </Tag>
  );
}
