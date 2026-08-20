import { CSSProperties, memo, type ReactNode } from 'react';

/**
 * `NavGlyph` — os CINCO ícones PRÓPRIOS da navegação principal
 * ============================================================
 *
 * POR QUE ESTE ARQUIVO EXISTE
 * ---------------------------
 * No teste dos 200×200 (a nav recortada, sem logo e sem contexto) a barra
 * reprovava: Material Symbols Rounded + rótulo Rubik é a nav padrão do
 * Android — `home`/`casino`/`auto_awesome`/`storefront`/`more_horiz` são
 * indistinguíveis de qualquer app Material. E a nav é a **segunda superfície
 * mais vista do app**, atrás só da área do pet.
 *
 * A direção de arte diz que 2–3 glifos proprietários já fazem um conjunto ler
 * como "nosso sistema". A nav é onde esse dinheiro rende mais: são 5 glifos
 * fixos, sempre juntos, sempre na tela. O resto do app **continua em Material**
 * — 90 e tantos ícones desenhados à mão seria trocar um problema de identidade
 * por um problema de qualidade.
 *
 * CONVIVER COM O MATERIAL: A MÉTRICA É A MESMA
 * --------------------------------------------
 * Estes glifos não são "outro estilo", são o MESMO estilo com autoria. Por
 * isso copiam a métrica da Material Symbols Rounded, que é o que faz um ícone
 * próprio parecer parte do conjunto em vez de um adesivo colado:
 *
 *  · **caixa de 24dp** (`viewBox="0 0 24 24"`), mesmo grid do Material;
 *  · **traço 2.1** — o equivalente óptico do eixo `wght` 500 que o resto do
 *    app usa (o 400 do Material mede 2.0 em 24dp; 500 engrossa ~5%);
 *  · **pontas e junções redondas** (`linecap`/`linejoin` = round), que é
 *    literalmente o que "Rounded" quer dizer;
 *  · **o traço escala com o tamanho** (não há `vectorEffect`): em 32px o traço
 *    vira 2.8px, exatamente como o glifo de fonte engrossa junto.
 *
 * A ASSINATURA (o que faz o conjunto ser nosso)
 * ---------------------------------------------
 * Três motivos, repetidos de propósito entre os cinco desenhos:
 *
 *  1. **O ARCO** — a porta do Início e a alça da Loja são o mesmo arco. É o
 *     arco do visor do aparelho, a peça de marca do app.
 *  2. **O NÓ** — círculos cheios: os três da Evolução (galho que se divide, que
 *     é literalmente a mecânica do jogo) e os quatro do Menu.
 *  3. **A CRUZ DIRECIONAL** de Atividades: é o D-pad do v-pet. Um dado
 *     (`casino`) diz "sorte"; a página é dungeon, dino, torneio e minigames —
 *     é o BOTÃO do aparelho, não a aposta.
 *
 * O EIXO FILL, REPRODUZIDO
 * ------------------------
 * O app usa `FILL 0→1` da Material como sistema de estado, e isso não podia
 * quebrar em cinco ícones. Aqui a mesma ideia sem fonte variável: o contorno
 * está SEMPRE desenhado e a camada sólida do MESMO desenho aparece por cima
 * com `opacity = fill`. É um glifo se preenchendo — não são dois ícones
 * trocando de lugar — e aceita valor fracionário igual ao eixo real. A
 * transição usa `--sm2-dur-tap`/`--sm2-ease`, e o bloco global de
 * `prefers-reduced-motion` do `index.css` já zera transição de tudo.
 *
 * ÍCONE NUNCA DENTRO DE BOX
 * -------------------------
 * Nenhum glifo daqui desenha moldura, placa, fundo, halo ou padding, e o
 * componente não aceita prop que faça isso. O alvo de 44px é do BOTÃO. O
 * `<span>` externo reusa a classe `.sm2-icon` porque ela é justamente o
 * contrato do "ícone pelado" (não declara `background`, `border` nem
 * `padding`) e porque é dela que vêm as classes de TINTA (`sm2-icon-primary`
 * etc.) — que os SVGs consomem por `currentColor`. Os eixos de fonte que a
 * classe declara são inertes num SVG; o `--sm2-icon-fill` continua sendo a
 * verdade do estado, agora lido também pelo desenho.
 */

export type NavGlyphName = 'home' | 'activities' | 'evolution' | 'shop' | 'menu';

/** Mesmo vocabulário de tom do `Icon` — todos são tokens de TINTA. */
export type NavGlyphTone = 'ink' | 'muted' | 'primary' | 'inherit';

const TONE_CLASS: Record<NavGlyphTone, string> = {
  ink: 'sm2-icon-ink',
  muted: 'sm2-icon-muted',
  primary: 'sm2-icon-primary',
  inherit: '',
};

/** O equivalente óptico do `wght` 500 do Material em caixa de 24dp. */
const STROKE = 2.1;

/* ── Geometria ────────────────────────────────────────────────────────────
   Cada glifo declara `outline` (o que fica sempre) e `solid` (o que aparece
   conforme o FILL sobe). Coordenadas cravadas no grid de 24; nada é gerado em
   tempo de execução — ícone é desenho, não cálculo. */

/** Casa com porta em ARCO. O telhado tem o ápice arredondado (r 2.2). */
const HOME_BODY =
  'M10.48 4.7A2.2 2.2 0 0 1 13.52 4.7L20.4 10.58A1.5 1.5 0 0 1 21 11.72'
  + 'V19.5A1.5 1.5 0 0 1 19.5 21H4.5A1.5 1.5 0 0 1 3 19.5V11.72'
  + 'a1.5 1.5 0 0 1 .6-1.14Z';
/** A porta: meio arco de r 2.5, o MESMO da alça da Loja. */
const HOME_DOOR = 'M9.5 21v-4.4a2.5 2.5 0 0 1 5 0V21';

/** D-pad: cruz de braços 6, cantos convexos e CÔNCAVOS de r 2. */
const DPAD =
  'M11 3h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2'
  + 'a2 2 0 0 0-2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2a2 2 0 0 0-2-2H5'
  + 'a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2h2a2 2 0 0 0 2-2V5a2 2 0 0 1 2-2Z';
/**
 * O EIXO do d-pad, e ele não é decoração: a cruz pelada lia como "adicionar"
 * (visto no app rodando, 32px) — o pior mal-entendido possível numa nav, porque
 * "+" é a ação mais comum do app. Com o pino no meio ela vira um botão
 * direcional. No estado cheio o pino é um VAZIO, pelo mesmo motivo da porta.
 */
const DPAD_HUB = 'M14.1 12a2.1 2.1 0 1 0-4.2 0 2.1 2.1 0 1 0 4.2 0Z';

/** Galho que se divide: um nó embaixo, dois em cima. */
const EVO_LINKS = 'M8.11 8.41 12 13l3.89-4.59M12 13v3';
const EVO_NODES: [number, number][] = [[6.5, 6.5], [17.5, 6.5], [12, 18.5]];
const EVO_R = 2.5;

/**
 * Sacola: trapézio de cantos r 1.2 + alça em ARCO de r 3 — o MESMO arco da
 * porta do Início. A boca desceu para y 9.5 (era 8.5) porque com a alça
 * aparecendo só 1.5 acima do corpo o glifo lia como BALDE em 32px.
 */
const SHOP_BAG =
  'M6.2 9.5h11.6a1.2 1.2 0 0 1 1.19 1.33l-1.15 9.11A1.2 1.2 0 0 1 16.65 21'
  + 'H7.35a1.2 1.2 0 0 1-1.19-1.06L5.01 10.83A1.2 1.2 0 0 1 6.2 9.5Z';
const SHOP_HANDLE = 'M9 9.5V7.6a3 3 0 0 1 6 0v1.9';

/** Menu: quatro nós. O mesmo círculo da Evolução, em grade. */
const MENU_NODES: [number, number][] = [[7.6, 7.6], [16.4, 7.6], [7.6, 16.4], [16.4, 16.4]];
const MENU_R = 2.4;

function circles(nodes: [number, number][], r: number) {
  return nodes.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />);
}

const GLYPHS: Record<NavGlyphName, { outline: ReactNode; solid: ReactNode }> = {
  home: {
    outline: <><path d={HOME_BODY} /><path d={HOME_DOOR} /></>,
    // `evenodd` + a porta FECHADA: no estado cheio a casa é sólida e a porta
    // continua sendo um vazio — é o que impede o glifo de virar uma mancha.
    solid: <path fillRule="evenodd" d={`${HOME_BODY}${HOME_DOOR}Z`} />,
  },
  activities: {
    outline: <><path d={DPAD} /><circle cx={12} cy={12} r={2.1} /></>,
    solid: <path fillRule="evenodd" d={`${DPAD}${DPAD_HUB}`} />,
  },
  evolution: {
    outline: <>{circles(EVO_NODES, EVO_R)}<path d={EVO_LINKS} /></>,
    solid: <>{circles(EVO_NODES, EVO_R)}</>,
  },
  shop: {
    outline: <><path d={SHOP_BAG} /><path d={SHOP_HANDLE} /></>,
    solid: <path d={SHOP_BAG} />,
  },
  menu: {
    outline: <>{circles(MENU_NODES, MENU_R)}</>,
    solid: <>{circles(MENU_NODES, MENU_R)}</>,
  },
};

export interface NavGlyphProps {
  name: NavGlyphName;
  /** Tamanho renderizado em px. Padrão 24 (a nav pede 32). */
  size?: number;
  /** Eixo de estado, 0 (contorno) a 1 (preenchido). Interpolável. */
  fill?: number;
  tone?: NavGlyphTone;
  /** Ausente = decorativo (`aria-hidden`), que é o caso da nav: há rótulo. */
  label?: string;
  className?: string;
  style?: CSSProperties;
}

function clamp01(v: number) { return v < 0 ? 0 : v > 1 ? 1 : v; }

function NavGlyphBase({
  name, size = 24, fill = 0, tone = 'inherit', label, className, style,
}: NavGlyphProps) {
  const f = clamp01(fill);
  const glyph = GLYPHS[name];
  const vars = { '--sm2-icon-fill': String(f) } as CSSProperties;
  const classes = ['sm2-icon', TONE_CLASS[tone], className].filter(Boolean).join(' ');

  return (
    <span
      className={classes}
      style={{ fontSize: size, width: size, height: size, ...vars, ...style }}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        focusable="false"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {glyph.outline}
        </g>
        <g
          fill="currentColor"
          style={{
            opacity: f,
            transition: 'opacity var(--sm2-dur-tap) var(--sm2-ease)',
          }}
        >
          {glyph.solid}
        </g>
      </svg>
    </span>
  );
}

/** `memo` pelo mesmo motivo do `Icon`: props primitivas, muitas instâncias. */
export const NavGlyph = memo(NavGlyphBase);
export default NavGlyph;
