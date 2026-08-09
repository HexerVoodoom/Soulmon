// FUSÃO das quatro direções (A o Louco · B o encouraçado · C a síntese ·
// D o dragão de terra).
//
// A tese: não são 4 opções, são 2 polos. A→C é a mesma linhagem (macio,
// calmo, orelha-chifre); B e D são a mesma (criatura com placas). E os dois
// polos já diziam a MESMA frase — B tinha "núcleo mole sob a armadura", D
// tinha "corpo macio com armadura nas costas".
//
// Então a fusão é essa frase levada a sério: a criatura de C, carregando a
// armadura de B/D como CONCHA — algo que ela veste, não algo que ela é.
// Isso resolve de quebra a armadilha Mametchi: a concha é proto-armadura,
// ainda sem forma, e o bicho embaixo continua pequeno e macio.
import zlib from 'node:zlib';
import fs from 'node:fs';

const C = {
  none: [0, 0, 0, 0],
  K: [0x2e, 0x27, 0x40, 255],   // contorno (violeta-marrom: faz a ponte)
  W: [0xf7, 0xf1, 0xe3, 255],   // corpo creme            [de C e D]
  S: [0xe4, 0xda, 0xc4, 255],   // sombreado
  I: [0x6b, 0x5f, 0xcb, 255],   // orelha violeta         [de A e C]
  J: [0x4e, 0x42, 0xa8, 255],   // sombra da orelha
  R: [0x7c, 0x6a, 0x96, 255],   // concha mineral         [de B e D]
  r: [0x5c, 0x4e, 0x74, 255],   // concha sombra / vinco
  E: [0x9c, 0x8a, 0xb4, 255],   // concha quina iluminada [de B]
  P: [0xf2, 0xa0, 0xb4, 255],   // rosa: orelha interna + bochecha [de C]
  O: [0xef, 0xef, 0xe4, 255],   // garra / chifre         [de B e D]
  H: [0xff, 0xff, 0xff, 255],
  G: [0x2e, 0x27, 0x40, 38],
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
const claw = (x, y, dx, dy, len, w) =>
  pol([[x - w * dy, y + w * dx], [x + w * dy, y - w * dx], [x + dx * len, y + dy * len]]);

// ------------------------------------------------------ montagem (fundo→frente)
// rabinho de tufo [C] com ponta de placa [D]
part(fluffy(40.5, 31, 3.4, 3.4, 7, 0.9), 'I', 'J');
part(pol([[40, 34], [44.5, 28.5], [46, 31], [42, 35]]), 'R', 'r');

// CONCHA — a armadura como algo VESTIDO. Menor que a de D de propósito:
// o bicho tem que dominar a silhueta, senão vira tanque (armadilha Mametchi).
part(fluffy(24, 32.0, 15.6, 11.6, 9, 0.9), 'R', 'r');
// vincos de placa [de B]: a segmentação é o que faz ler como armadura
for (const ang of [-2.5, -2.0, -1.14, -0.64]) {
  for (let t = 6; t < 11.8; t += 0.3) {
    const x = (24 + Math.cos(ang) * t * 1.34) | 0, y = (32.0 + Math.sin(ang) * t) | 0;
    if (inB(x, y) && ['R', 'E'].includes(buf[y][x])) buf[y][x] = 'r';
  }
}
// espinhos só nas diagonais externas — atrás da cabeça somem [lição de D]
[[8.8, 27.5, -0.30], [12.0, 22.5, -0.22], [39.2, 27.5, 0.30], [36.0, 22.5, 0.22]]
  .forEach(([sx, sy, lean], i) => {
    part(pol([[sx - 3.0, sy + 4.5], [sx + lean * 8, sy - 6], [sx + 3.0, sy + 4]]), i % 2 ? 'E' : 'R');
  });

part(fluffy(24, 34.5, 9.6, 7.0, 11, 0.8), 'W', 'S');       // corpo macio [C]
part(ell(17.5, 41, 3.6, 2.6), 'W', 'S');                   // pezinhos [C]
part(ell(30.5, 41, 3.6, 2.6), 'W', 'S');
[15.2, 17.5, 19.8, 28.2, 30.5, 32.8].forEach(fx => part(claw(fx, 42.6, 0, 1, 2.4, 0.95), 'O'));
part(fluffy(24, 30.0, 11.0, 4.0, 9, 1.4), 'W', 'S');       // GOLA felpuda [C]

// ORELHAS longas [C + D], ponta firme = ambiguidade orelha/chifre [A]
part(pol([[16.8, 16.5], [22, 13], [13, 1.5], [8, 5]]), 'I', 'J');
part(pol([[31.2, 16.5], [26, 13], [35, 1.5], [40, 5]]), 'I', 'J');
part(pol([[17.9, 15.0], [20.6, 13.3], [13.5, 4.7], [10.2, 6.8]]), 'P');
part(pol([[30.1, 15.0], [27.4, 13.3], [34.5, 4.7], [37.8, 6.8]]), 'P');

part(fluffy(24, 20.5, 10.4, 9.8, 15, 0.6), 'W', 'S');      // cabeça > corpo [C]
part(ell(24, 25.6, 4.6, 2.9), 'W');                        // focinho discreto [D]
part(pol([[20.2, 11.6], [21.4, 6.6], [22.6, 11.2]]), 'O'); // chifrinhos [D]
part(pol([[25.4, 11.2], [26.6, 6.6], [27.8, 11.6]]), 'O');

// bracinhos com garras CURTAS e arredondadas: a garra do briefing existe,
// mas encolhida — garra longa é sinal de ameaça e briga com o cargo [A]
part(ell(13.8, 34.5, 3.2, 2.9), 'W', 'S');
part(ell(34.2, 34.5, 3.2, 2.9), 'W', 'S');
[[-0.92, 0.4], [-0.72, 0.7]].forEach(([dx, dy]) => part(claw(13.0, 35.6, dx, dy, 3.6, 1.0), 'O'));
[[0.92, 0.4], [0.72, 0.7]].forEach(([dx, dy]) => part(claw(35.0, 35.6, dx, dy, 3.6, 1.0), 'O'));

// ------------------------------------------------------------------- rosto
// pálpebra BAIXA [A e C], não a alta de D: este é o mascote, e "não se
// assusta com dia ruim" é contrato de tom, não estilo.
for (const ex of [17, 27]) {
  const rows = [[1, 2], [0, 3], [0, 3], [0, 3], [1, 2]];
  rows.forEach(([a, b], r) => { for (let c = a; c <= b; c++) buf[19 + r][ex + c] = 'K'; });
  buf[20][ex + 1] = 'H';
}
for (const cx of [13.5, 34.5]) for (let y = 0; y < S_; y++) for (let x = 0; x < S_; x++)
  if (['W', 'S'].includes(buf[y][x]) && Math.hypot(x + 0.5 - cx, y + 0.5 - 25.5) <= 2.6) buf[y][x] = 'P';
buf[25][22] = 'K'; buf[25][26] = 'K';                       // narinas [D]
buf[26][22] = 'K'; buf[26][25] = 'K'; buf[27][23] = 'K'; buf[27][24] = 'K';   // sorriso [C]
buf[8][43] = 'I'; buf[8][44] = 'I'; buf[9][43] = 'I'; buf[9][44] = 'I';       // partícula [A]
for (let y = 0; y < S_; y++) for (let x = 0; x < S_; x++) {
  if (buf[y][x] !== 'none') continue;
  const dx = (x + 0.5 - 24) / 15, dy = (y + 0.5 - 45.6) / 1.9;
  if (dx * dx + dy * dy <= 1) buf[y][x] = 'G';
}

// ---------------------------------------------------------------- 16 px [A/C]
function icon16() {
  const mask = [
    '................', '..II........II..', '..II........II..', '...II......II...',
    '..IIIbbbbbbIII..', '...bbbbbbbbbb...', '..bbbbbbbbbbbb..', '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..', '..bbbbbbbbbbbb..', '.rbbbbbbbbbbbbr.', '.rrbbbbbbbbbbrr.',
    '.rrrbbbbbbbbrrr.', '..rrrrbbbbrrrr..', '...rrrrrrrrrr...', '................',
  ];
  const Z = 16;
  const solid = mask.map(r => [...r].map(c => c !== '.'));
  const g = mask.map(r => [...r].map(c => (c === 'I' ? 'I' : c === 'r' ? 'R' : c === 'b' ? 'W' : 'none')));
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
  return g;
}

// ------------------------------------------------------------------- PNG
function crc32(bb) {
  const t = []; let c;
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let crc = 0xffffffff;
  for (const v of bb) crc = t[(crc ^ v) & 0xff] ^ (crc >>> 8);
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
const dir = process.argv[2] || '.';
const ic = icon16();
writePng(`${dir}/fusion-48.png`, buf, 1);
writePng(`${dir}/fusion-48@9x.png`, buf, 9);
writePng(`${dir}/fusion-48@9x-grey.png`, buf, 9, true);
writePng(`${dir}/fusion-16.png`, ic, 1);
writePng(`${dir}/fusion-16@9x.png`, ic, 9);
console.log('ok');
