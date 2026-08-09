// Opção C — síntese da CAMADA MASCOTE (não a camada monstro da opção B).
// Traços extraídos das criaturas-rosto das franquias vizinhas; nenhum nome
// de franquia entra em código, prompt ou asset.
import zlib from 'node:zlib';
import fs from 'node:fs';

const C = {
  none: [0, 0, 0, 0],
  K: [0x2a, 0x23, 0x50, 255],   // contorno + olhos
  W: [0xf7, 0xf1, 0xe3, 255],   // corpo (creme quente)
  S: [0xe4, 0xda, 0xc4, 255],   // sombreado
  I: [0x6b, 0x5f, 0xcb, 255],   // orelha / cauda (âncora violeta)
  J: [0x4e, 0x42, 0xa8, 255],   // sombra da âncora
  P: [0xf2, 0xa0, 0xb4, 255],   // rosa: orelha interna + bochecha
  H: [0xff, 0xff, 0xff, 255],   // brilho
  G: [0x2a, 0x23, 0x50, 38],    // sombra no chão
};

const S_ = 48;
const buf = Array.from({ length: S_ }, () => Array(S_).fill('none'));
const inB = (x, y) => x >= 0 && y >= 0 && x < S_ && y < S_;

function part(mask, fill, shade = null, dir = [0.55, 0.83]) {
  const m = [];
  for (let y = 0; y < S_; y++) for (let x = 0; x < S_; x++) if (mask(x + 0.5, y + 0.5)) m.push([x, y]);
  for (const [x, y] of m) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
    if (inB(x + dx, y + dy)) buf[y + dy][x + dx] = 'K';
  for (const [x, y] of m) {
    let col = fill;
    if (shade && mask.grad) { const g = mask.grad(x + 0.5, y + 0.5); if (g[0] * dir[0] + g[1] * dir[1] > 0.36) col = shade; }
    buf[y][x] = col;
  }
}
const ell = (cx, cy, rx, ry) => {
  const f = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  f.grad = (x, y) => [(x - cx) / rx, (y - cy) / ry];
  return f;
};
// versão felpuda: raio em onda quadrada (o degrau duro lê como pelo)
const fluffy = (cx, cy, rx, ry, tufts, amp) => {
  const f = (x, y) => {
    const dx = x - cx, dy = y - cy, th = Math.atan2(dy, dx);
    const bump = (((th + 0.35) * tufts) / (2 * Math.PI) % 1 + 1) % 1 < 0.5 ? amp : 0;
    return (dx / (rx + bump)) ** 2 + (dy / (ry + bump)) ** 2 <= 1;
  };
  f.grad = (x, y) => [(x - cx) / rx, (y - cy) / ry];
  return f;
};
const pol = (pts) => (x, y) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

// ------------------------------------------------------ montagem (fundo→frente)
part(fluffy(40, 32.5, 3.6, 3.6, 7, 0.9), 'I', 'J');          // rabinho de tufo
part(ell(13.0, 33.5, 2.7, 2.7), 'W', 'S');                   // bracinhos
part(ell(35.0, 33.5, 2.7, 2.7), 'W', 'S');
part(fluffy(24, 34, 9.5, 6.8, 11, 0.8), 'W', 'S');           // corpo
part(ell(18.5, 40.5, 3.6, 2.6), 'W', 'S');                   // pezinhos
part(ell(29.5, 40.5, 3.6, 2.6), 'W', 'S');
part(fluffy(24, 30.0, 11.2, 4.2, 9, 1.5), 'W', 'S');         // GOLA felpuda

// ORELHAS grandes — o traço nº 1 compartilhado por toda a camada mascote.
// Ponta firme (não pendurada): mantém a ambiguidade orelha/chifre do spec.
part(pol([[16.5, 17], [22, 13.5], [14.5, 2], [9, 5]]), 'I', 'J');
part(pol([[31.5, 17], [26, 13.5], [33.5, 2], [39, 5]]), 'I', 'J');
part(pol([[17.6, 15.4], [20.4, 13.9], [14.9, 5.2], [11.4, 7.2]]), 'P');
part(pol([[30.4, 15.4], [27.6, 13.9], [33.1, 5.2], [36.6, 7.2]]), 'P');

part(fluffy(24, 21, 10.6, 10.2, 15, 0.7), 'W', 'S');         // cabeça (maior que o corpo)

// ------------------------------------------------------------------- rosto
// olhos 4×5, topo estreitado = pálpebra baixa ("não se assusta")
for (const ex of [17, 27]) {
  const rows = [[1, 2], [0, 3], [0, 3], [0, 3], [1, 2]];
  rows.forEach(([a, b], r) => { for (let c = a; c <= b; c++) buf[20 + r][ex + c] = 'K'; });
  buf[21][ex + 1] = 'H';
}
// bochechas rosa
for (const cx of [14.0, 34.0]) for (let y = 0; y < S_; y++) for (let x = 0; x < S_; x++)
  if (['W', 'S'].includes(buf[y][x]) && Math.hypot(x + 0.5 - cx, y + 0.5 - 26.5) <= 2.6) buf[y][x] = 'P';
// boca pequena
buf[26][22] = 'K'; buf[26][25] = 'K'; buf[27][23] = 'K'; buf[27][24] = 'K';
// partícula-assinatura, canto superior direito
buf[8][43] = 'I'; buf[8][44] = 'I'; buf[9][43] = 'I'; buf[9][44] = 'I';
// sombra no chão
for (let y = 0; y < S_; y++) for (let x = 0; x < S_; x++) {
  if (buf[y][x] !== 'none') continue;
  const dx = (x + 0.5 - 24) / 13, dy = (y + 0.5 - 44.6) / 1.9;
  if (dx * dx + dy * dy <= 1) buf[y][x] = 'G';
}

// ------------------------------------------------------------------- PNG
function crc32(b) {
  const t = []; let c;
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let crc = 0xffffffff;
  for (const v of b) crc = t[(crc ^ v) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
};
function writePng(file, grid, scale, grey = false) {
  const h = grid.length, w = grid[0].length, W = w * scale, H = h * scale;
  const raw = Buffer.alloc((W * 4 + 1) * H); let o = 0;
  for (let y = 0; y < H; y++) {
    raw[o++] = 0;
    for (let x = 0; x < W; x++) {
      let [r, g, b, a] = C[grid[(y / scale) | 0][(x / scale) | 0]];
      if (grey) { const v = Math.round(0.299 * r + 0.587 * g + 0.114 * b); r = g = b = v; }
      raw[o++] = r; raw[o++] = g; raw[o++] = b; raw[o++] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ]));
}
// ---------------------------------------------------------------- 16 px
// Autoral, não reduzido. Sobrevivem: cabeça, orelhas, olhos, partícula.
// Caem: gola, patas, cauda, boca, bochecha — é o teste de redução do spec.
function icon16() {
  const mask = [
    '................',
    '..II........II..',
    '..II........II..',
    '...II......II...',
    '..IIIbbbbbbIII..',
    '...bbbbbbbbbb...',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '...bbbbbbbbbb...',
    '....bbbbbbbb....',
    '.....bbbbbb.....',
    '................',
  ];
  const Z = 16;
  const solid = mask.map(r => [...r].map(c => c !== '.'));
  const g = mask.map(r => [...r].map(c => (c === 'I' ? 'I' : c === 'b' ? 'W' : 'none')));
  for (const [ex, ey] of [[3, 1], [12, 1]]) { g[ey][ex] = 'P'; g[ey + 1][ex] = 'P'; }
  for (let y = 0; y < Z; y++) for (let x = 0; x < Z; x++) {
    if (!solid[y][x]) continue;
    if ([[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => {
      const nx = x + a, ny = y + b;
      return nx < 0 || ny < 0 || nx >= Z || ny >= Z || !solid[ny][nx];
    })) g[y][x] = 'K';
  }
  for (const ex of [5, 9]) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) g[8 + dy][ex + dx] = 'K';
  g[8][5] = 'H'; g[8][9] = 'H';
  g[2][14] = 'I';
  for (let x = 5; x <= 10; x++) g[15][x] = 'G';
  return g;
}

const dir = process.argv[2] || '.';
const ic = icon16();
writePng(`${dir}/cub-16.png`, ic, 1);
writePng(`${dir}/cub-16@9x.png`, ic, 9);
writePng(`${dir}/cub-16@9x-grey.png`, ic, 9, true);
writePng(`${dir}/cub-48.png`, buf, 1);
writePng(`${dir}/cub-48@9x.png`, buf, 9);
writePng(`${dir}/cub-48@9x-grey.png`, buf, 9, true);
console.log('ok');
