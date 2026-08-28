import { CSSProperties, memo } from 'react';
import { GlyphSvg, hasGlyph } from './NavGlyphs';

/**
 * `Icon` — o ÚNICO ponto de ícone do app. Dois motores, uma API.
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ **A troca de motor é invisível para quem chama.** `name` continua    │
 * │ sendo o nome Material (`favorite`, `close`, `lock`…). Se existir um  │
 * │ GLIFO PRÓPRIO com esse nome (`NavGlyphs.tsx`), o `Icon` desenha o    │
 * │ nosso SVG; se não existir, cai na ligature da Material Symbols. As   │
 * │ props (`name`, `size`, `fill`, `weight`, `tone`, `label`) são as     │
 * │ mesmas nos dois casos e significam a mesma coisa — `fill` é o eixo   │
 * │ de estado, `weight` vira espessura de traço no SVG. **Nenhum         │
 * │ call-site precisa mudar** para ganhar (ou perder) um glifo próprio:  │
 * │ desenhar o ícone novo em `NavGlyphs.tsx` já troca o app inteiro.     │
 * └──────────────────────────────────────────────────────────────────────┘
 *
 * A casca (`<span class="sm2-icon">`, `fontSize`, as variáveis `--sm2-icon-*`,
 * o tom, o aria) é **a mesma nos dois motores**, e isso é de propósito: é o
 * que garante que trocar um ícone de motor não mude alinhamento, tamanho nem
 * acessibilidade. No motor SVG a ligature continua no DOM (é o `name`, escrito
 * ali) e é o SVG que aparece: o texto é pintado transparente
 * (`-webkit-text-fill-color`, que não mexe em `color` — o SVG precisa dele
 * inteiro para o `currentColor`) e o desenho fica por cima, em posição
 * absoluta, ocupando exatamente a caixa do ícone.
 *
 * Três decisões que valem para todas as ondas seguintes:
 *
 * 1. **Ícone NUNCA dentro de box.** Este componente não desenha moldura,
 *    fundo, borda, chanfro nem padding — nunca, em nenhuma prop. É a regra
 *    visual do dono (CLAUDE.md, "UI: regras visuais") e há teste travando.
 *    Quem precisar de alvo de toque de 44px põe o padding no BOTÃO que
 *    envolve o ícone, não no ícone.
 *
 * 2. **`FILL 0→1` é o sistema de estado** (inativo → ativo), e ele
 *    INTERPOLA. Não existe par "outline/solid" de ícones diferentes: é o
 *    mesmo glifo se preenchendo. Valores fracionários são válidos e úteis
 *    (arrastar, progresso).
 *
 * 3. **`opsz` casado ao tamanho renderizado.** O eixo óptico é o que impede
 *    o traço de afinar em 20px e engrossar em 40px. `weight` padrão 500 —
 *    é o que faz o traço casar com a espessura do pixel do sprite; 400
 *    devolve "biblioteca de ícones padrão".
 *
 * A fonte é um SUBSET de 99 ícones (145 KB). Nome fora do inventário não
 * renderiza glifo nenhum — a lista e o comando de regeração estão em
 * `src/styles/tokens.md`.
 */

/** Tom do glifo. Todos são tokens de TINTA (`*-ink`), nunca de fill. */
export type IconTone = 'ink' | 'muted' | 'primary' | 'gold' | 'danger' | 'viewport' | 'viewport-danger' | 'inherit';

export interface IconProps {
  /** Nome da ligature (ex.: `'favorite'`). Deve estar no inventário. */
  name: string;
  /** Tamanho renderizado em px. `opsz` é casado a ele. Padrão 24. */
  size?: number;
  /** Eixo FILL, 0 (inativo) a 1 (ativo). Interpolável. Padrão 0. */
  fill?: number;
  /** Eixo wght, 100–700. Padrão 500. */
  weight?: number;
  /** Eixo GRAD. Padrão: -25 no tema escuro, 0 no claro (vem do CSS). */
  grade?: number;
  /** Tom. Padrão `'inherit'` (herda o `color` do contexto). */
  tone?: IconTone;
  /**
   * Nome acessível. **Ausente = decorativo**: o ícone recebe
   * `aria-hidden` e some do leitor de tela, que é o certo quando existe um
   * texto ao lado dizendo a mesma coisa. Presente = `role="img"` + label.
   * Texto de UI nasce em inglês; quem chama passa o par PT/EN.
   */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

/**
 * `opsz` da Material Symbols só existe entre 20 e 48. Fora disso o eixo é
 * clampado pelo próprio motor de fonte, mas declarar valor inválido em
 * `font-variation-settings` invalida a declaração INTEIRA em alguns
 * WebViews — aí o ícone perde também o FILL e o wght. Clampar aqui.
 */
const OPSZ_MIN = 20;
const OPSZ_MAX = 48;

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

const TONE_CLASS: Record<IconTone, string> = {
  ink: 'sm2-icon-ink',
  muted: 'sm2-icon-muted',
  primary: 'sm2-icon-primary',
  gold: 'sm2-icon-gold',
  danger: 'sm2-icon-danger',
  // `viewport` → `--sm2-viewport-ink`: tinta CLARA nos dois temas. É o tom de
  // quem fica sobre superfície escura fixa (a tela do aparelho, o corpo do
  // `.sm2-device` com a foto pintada por baixo) — `ink` inverte com o tema e
  // desaparecia ali no tema claro.
  viewport: 'sm2-icon-viewport',
  // `--sm2-danger-ink` é calibrado para superfície CLARA (a `-surface` de
  // cada tema); contra o vidro do visor, sempre escuro, cai perto de 2:1. O
  // alerta de HP crítico dentro do `.sm2-device` precisa da mesma lógica do
  // `viewport` acima, mas em vermelho.
  'viewport-danger': 'sm2-icon-viewport-danger',
  inherit: '',
};

function IconBase({
  name,
  size = 24,
  fill = 0,
  weight = 500,
  grade,
  tone = 'inherit',
  label,
  className,
  style,
}: IconProps) {
  // `--sm2-icon-*` em vez de escrever `font-variation-settings` inteiro por
  // inline: assim o CSS continua dono da string de eixos (e da transição), e
  // o componente só move os números.
  const vars = {
    '--sm2-icon-fill': String(clamp(fill, 0, 1)),
    '--sm2-icon-wght': String(clamp(weight, 100, 700)),
    '--sm2-icon-opsz': String(clamp(size, OPSZ_MIN, OPSZ_MAX)),
    ...(grade === undefined ? null : { '--sm2-icon-grad': String(clamp(grade, -25, 200)) }),
  } as CSSProperties;

  const classes = ['sm2-icon', TONE_CLASS[tone], className].filter(Boolean).join(' ');
  const own = hasGlyph(name);

  return (
    <span
      className={classes}
      // `fontSize` inline e não classe: footgun 1 — o Tailwind aqui é
      // pré-compilado, então `text-[28px]` não aplicaria nada.
      style={{
        fontSize: size,
        width: size,
        height: size,
        ...(own ? { position: 'relative', WebkitTextFillColor: 'transparent' } : null),
        ...vars,
        ...style,
      }}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
      translate="no"
    >
      {own && (
        <GlyphSvg
          name={name}
          size={size}
          fill={clamp(fill, 0, 1)}
          weight={weight}
          style={{ position: 'absolute', left: 0, top: 0 }}
        />
      )}
      {name}
    </span>
  );
}

/**
 * `memo` porque ícone é o componente mais instanciado do app (nav, cada
 * card de tarefa, cada ação do pet) e todas as props são primitivas.
 */
export const Icon = memo(IconBase);
export default Icon;
