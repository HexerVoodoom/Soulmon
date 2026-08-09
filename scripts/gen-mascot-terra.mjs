// Conceito do dono: dragão fofo, orelhas longas, corpo macio, ARMADURA nas
// costas, garras longas. Elemento terra, amarelo com marrom, muita energia,
// empático e fiel.
import zlib from 'node:zlib';
import fs from 'node:fs';

const C = {
  none: [0, 0, 0, 0],
  K: [0x3a, 0x24, 0x16, 255],   // contorno — marrom escuro, não azul (terra)
  Y: [0xf4, 0xd0, 0x60, 255],   // corpo amarelo
  y: [0xd8, 0xa8, 0x3e, 255],   // sombra do corpo
  L: [0xfa, 0xe8, 0xa6, 255],   // barriga clara
  B: [0x8c, 0x5c, 0x33, 255],   // armadura marrom
  b: [0x68, 0x41, 0x23, 255],   // armadura sombra
  h: [0xac, 0x78, 0x48, 255],   // armadura quina iluminada
  O: [0xef, 0xf0, 0xe6, 255],   // garra / chifre / dente (frio, separa do amarelo)
  P: [0xe8, 0x96, 0x58, 255],   // bochecha
  H: [0xff, 0xff, 0xff, 255],   // brilho
  G: [0x3a, 0x24, 0x16, 38],    // sombra no chão
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
// garra longa: triângulo fino, apontando na direção dada
const claw = (x, y, dx, dy, len, w) =>
  pol([[x - w * dy, y + w * dx], [x + w * dy, y - w * dx], [x + dx * len, y + dy * len]]);

// ------------------------------------------------------ montagem (fundo→frente)
// cauda grossa de dragão, saindo por trás à direita
part(pol([[39, 40], [44.5, 33], [46.5, 35.5], [42, 41.5]]), 'B', 'b');

// ARMADURA DAS COSTAS — um CASCO inteiro atrás do corpo, não placas soltas.
// De frente, "costas" só lê se a armadura fizer a BORDA em volta do corpo
// macio e espetar acima dos ombros.
part(fluffy(24, 33.5, 16.0, 11.5, 9, 1.0), 'B', 'b');
// espinhos só nas diagonais externas — atrás da cabeça eles somem
[[8.5, 30, -0.30], [11.5, 24, -0.22], [39.5, 30, 0.30], [36.5, 24, 0.22]]
  .forEach(([sx, sy, lean], i) => {
    part(pol([[sx - 3.4, sy + 5], [sx + lean * 9, sy - 7], [sx + 3.4, sy + 4.5]]), i % 2 ? 'h' : 'B');
  });
// quinas iluminadas do casco (leitura mineral)
for (const [qx, qy] of [[10, 31], [12, 39], [38, 31], [36, 39]]) {
  if (buf[qy] && buf[qy][qx] === 'B') { buf[qy][qx] = 'h'; buf[qy][qx + 1] = 'h'; }
}

part(fluffy(24, 35, 10.0, 7.2, 11, 0.8), 'Y', 'y');       // corpo macio, POR CIMA
for (let y = 0; y < S_; y++) for (let x = 0; x < S_; x++) {   // barriga clara
  if (!['Y', 'y'].includes(buf[y][x])) continue;
  const dx = (x + 0.5 - 24) / 6.2, dy = (y + 0.5 - 36.5) / 4.6;
  if (dx * dx + dy * dy <= 1) buf[y][x] = 'L';
}

// ORELHAS longas
part(pol([[17, 16], [22, 13], [12.5, 1.5], [7.5, 5]]), 'Y', 'y');
part(pol([[31, 16], [26, 13], [35.5, 1.5], [40.5, 5]]), 'Y', 'y');
part(pol([[18, 14.6], [20.6, 13.2], [13, 4.6], [9.8, 6.8]]), 'P');
part(pol([[30, 14.6], [27.4, 13.2], [35, 4.6], [38.2, 6.8]]), 'P');

part(fluffy(24, 20, 10.4, 9.6, 15, 0.6), 'Y', 'y');       // cabeça
part(ell(24, 27.5, 5.4, 3.4), 'L');                        // focinho de dragão
part(pol([[19.5, 11.5], [21, 5.5], [22.5, 11]]), 'O');     // chifrinhos
part(pol([[25.5, 11], [27, 5.5], [28.5, 11.5]]), 'O');

// braços com GARRAS LONGAS
// pés com garras
part(ell(18, 41, 4.2, 3.0), 'Y', 'y');
part(ell(30, 41, 4.2, 3.0), 'Y', 'y');
[14.6, 18, 21.4, 26.6, 30, 33.4].forEach(fx => part(claw(fx, 43, 0, 1, 3.2, 1.05), 'O'));
// braços com GARRAS LONGAS — desenhados POR ÚLTIMO e apontando para fora da
// silhueta do casco, senão a garra some dentro do marrom (traço do briefing)
part(ell(14.5, 34.0, 3.4, 3.0), 'Y', 'y');
part(ell(33.5, 34.0, 3.4, 3.0), 'Y', 'y');
[[-0.86, 0.51], [-0.66, 0.75], [-0.42, 0.91]].forEach(([dx, dy]) => part(claw(13.6, 35.4, dx, dy, 8.2, 1.15), 'O'));
[[0.86, 0.51], [0.66, 0.75], [0.42, 0.91]].forEach(([dx, dy]) => part(claw(34.4, 35.4, dx, dy, 8.2, 1.15), 'O'));

// ------------------------------------------------------------------- rosto
// olhos GRANDES e abertos — "muita energia" pede pálpebra alta, ao contrário
// do mascote calmo; brilho duplo faz a leitura de caloroso.
for (const ex of [15, 28]) {
  const rows = [[1, 3], [0, 4], [0, 4], [0, 4], [1, 3]];
  rows.forEach(([a, b], r) => { for (let c = a; c <= b; c++) buf[17 + r][ex + c] = 'K'; });
  buf[18][ex + 1] = 'H';                       // brilho principal, 1 px
  buf[20][ex + 3] = 'H';                       // segundo brilho: "vivo/caloroso"
}
// bochechas
for (const cx of [13.5, 34.5]) for (let y = 0; y < S_; y++) for (let x = 0; x < S_; x++)
  if (['Y', 'y'].includes(buf[y][x]) && Math.hypot(x + 0.5 - cx, y + 0.5 - 25.5) <= 2.7) buf[y][x] = 'P';
// boca aberta sorrindo + presinha
for (let x = 22; x <= 26; x++) buf[28][x] = 'K';
buf[29][23] = 'K'; buf[29][24] = 'K'; buf[29][25] = 'K';
buf[29][22] = 'O';
// narinas
buf[26][22] = 'K'; buf[26][26] = 'K';
// sombra no chão
for (let y = 0; y < S_; y++) for (let x = 0; x < S_; x++) {
  if (buf[y][x] !== 'none') continue;
  const dx = (x + 0.5 - 24) / 16, dy = (y + 0.5 - 46.4) / 1.8;
  if (dx * dx + dy * dy <= 1) buf[y][x] = 'G';
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
writePng(`${dir}/terra-48.png`, buf, 1);
writePng(`${dir}/terra-48@9x.png`, buf, 9);
writePng(`${dir}/terra-48@9x-grey.png`, buf, 9, true);
console.log('ok');
