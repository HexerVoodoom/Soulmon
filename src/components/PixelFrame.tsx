/**
 * PixelFrame — a moldura decorativa da tela (referência: kit "SOUL MON").
 *
 * Canos de cobre com juntas aparafusadas nos cantos, trepadeira cruzando o
 * cano e um nó de cristal ciano aceso no cotovelo — desenhados como PIXEL ART
 * DE VERDADE: um grid de caracteres vira <rect>s de 1×1 num SVG com
 * `shape-rendering: crispEdges`, então o traço é nítido em qualquer DPI e o
 * bundle não carrega nenhum PNG novo.
 *
 * É um overlay `position: fixed` com `pointer-events: none` (classe
 * `.sm-screen-frame` no index.css): NUNCA captura toque. As linhas finas das
 * bordas longas são `box-shadow: inset` na própria classe; este componente só
 * desenha os 4 cantos (o mesmo desenho, espelhado por transform).
 *
 * Fica FORA do fluxo e não participa de layout — remove-se sem efeito
 * colateral. Nada de `transform`/`filter` no elemento raiz (footgun do bloco
 * contenedor, ver `.sm-pet-sticky`); os transforms ficam nos <g> internos do
 * SVG, que não criam bloco contenedor pra ninguém.
 */

// Paleta do canto (mesmos tons do kit; ver tokens --sm-px-* no index.css).
const INK: Record<string, string> = {
  O: '#241507', // contorno escuro do cano
  C: '#c68642', // cobre (== --sm-px-copper)
  H: '#eec27f', // brilho do cobre
  S: '#8a5230', // sombra do cobre
  B: '#5a3419', // banda da junta (cobre escuro)
  G: '#4c9a3f', // folha
  g: '#2f6b33', // folha escura
  Y: '#5df0e0', // cristal ciano (== --sm-px-cyan)
  y: '#2a9c92', // ciano apagado
};

const SIZE = 24;

/** Constrói o canto superior-esquerdo uma vez (module-level, custo zero por render). */
function buildCorner(): { x: number; y: number; c: string }[] {
  // grid começa vazio
  const px: string[][] = Array.from({ length: SIZE }, () => Array(SIZE).fill(''));

  // Cano horizontal (y 0..5, x 0..23) — outline/brilho/cobre/sombra/outline
  for (let x = 0; x < SIZE; x++) {
    px[0][x] = 'O'; px[1][x] = 'H'; px[2][x] = 'C'; px[3][x] = 'C'; px[4][x] = 'S'; px[5][x] = 'O';
  }
  // Cano vertical (x 0..5, y 0..23)
  for (let y = 0; y < SIZE; y++) {
    px[y][0] = 'O'; px[y][1] = 'H'; px[y][2] = 'C'; px[y][3] = 'C'; px[y][4] = 'S'; px[y][5] = 'O';
  }
  // Canto externo: fecha o contorno do cotovelo
  px[0][0] = 'O'; px[1][1] = 'H';

  // Junta aparafusada no braço horizontal (x 16..18)
  for (let y = 1; y <= 4; y++) for (let x = 16; x <= 18; x++) px[y][x] = 'B';
  px[1][17] = 'H'; px[4][17] = 'O'; // parafusos
  // Junta no braço vertical (y 16..18)
  for (let x = 1; x <= 4; x++) for (let y = 16; y <= 18; y++) px[y][x] = 'B';
  px[17][1] = 'H'; px[17][4] = 'O';

  // Nó de cristal ciano no cotovelo (diamante 5×5 em (6..10, 6..10))
  const d = [
    '..Y..',
    '.YYY.',
    'YYyYY',
    '.YyY.',
    '..y..',
  ];
  for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
    if (d[r][c] !== '.') px[6 + r][6 + c] = d[r][c];
  }

  // Trepadeira cruzando o cano horizontal (x 10..14) + folhas
  px[6][11] = 'g'; px[6][12] = 'G';
  px[7][12] = 'g'; px[7][13] = 'G'; px[6][14] = 'G';
  // brotinho por cima do cano
  px[1][12] = 'G'; px[0][13] = 'g';
  // Trepadeira no cano vertical
  px[11][6] = 'g'; px[12][6] = 'G'; px[12][7] = 'g'; px[13][7] = 'G';
  px[12][1] = 'G'; px[13][0] = 'g';

  const out: { x: number; y: number; c: string }[] = [];
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
    if (px[y][x]) out.push({ x, y, c: INK[px[y][x]] });
  }
  return out;
}

const CORNER = buildCorner();

function Corner({ flipX, flipY }: { flipX?: boolean; flipY?: boolean }) {
  const sx = flipX ? -1 : 1;
  const sy = flipY ? -1 : 1;
  const tx = flipX ? -SIZE : 0;
  const ty = flipY ? -SIZE : 0;
  return (
    <g transform={`scale(${sx} ${sy}) translate(${tx} ${ty})`}>
      {CORNER.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={1} height={1} fill={p.c} />
      ))}
    </g>
  );
}

/** Mapa de LITERAIS (não template): o contract test do index.css só enxerga
 *  classe estática, e um `sm-screen-frame-${pos}` deixava o sufixo invisível
 *  pra ele — o teste acusou o prefixo como classe fantasma. */
const POS_CLASS = {
  tl: 'sm-screen-frame-corner sm-screen-frame-tl',
  tr: 'sm-screen-frame-corner sm-screen-frame-tr',
  bl: 'sm-screen-frame-corner sm-screen-frame-bl',
  br: 'sm-screen-frame-corner sm-screen-frame-br',
} as const;

/** Um canto renderizado como SVG independente, posicionado pela classe. */
function CornerSvg({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  return (
    <svg
      className={POS_CLASS[pos]}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      aria-hidden="true"
      style={{ shapeRendering: 'crispEdges' }}
    >
      <Corner flipX={pos === 'tr' || pos === 'br'} flipY={pos === 'bl' || pos === 'br'} />
    </svg>
  );
}

export function PixelFrame() {
  return (
    <div className="sm-screen-frame" aria-hidden="true">
      <CornerSvg pos="tl" />
      <CornerSvg pos="tr" />
      <CornerSvg pos="bl" />
      <CornerSvg pos="br" />
    </div>
  );
}
