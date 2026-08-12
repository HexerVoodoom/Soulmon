// Opção B do mascote — o "encouraçado". Síntese dos 12 favoritos do dono,
// traduzidos em TRAÇOS (nenhum nome de franquia sai daqui).
//
// Técnica: cada PEÇA carrega o próprio contorno. Empilhar formas cheias sem
// contorno funde tudo num blob — foi o erro das duas primeiras tentativas.
import zlib from 'node:zlib';
import fs from 'node:fs';

const C = {
  none: [0, 0, 0, 0],
  K: [0x1b, 0x1f, 0x33, 255],   // contorno
  L: [0x93, 0x9d, 0xb4, 255],   // placa clara
  M: [0x66, 0x71, 0x8d, 255],   // placa média
  D: [0x44, 0x4c, 0x6a, 255],   // placa escura
  B: [0xc6, 0xb6, 0x95, 255],   // núcleo mole
  N: [0xa4, 0x94, 0x76, 255],   // sombra do núcleo
  O: [0xe8, 0xe3, 0xd0, 255],   // osso
  A: [0xf0, 0xad, 0x3e, 255],   // âmbar
  G: [0x1b, 0x1f, 0x33, 40],    // sombra no chão
};

const S = 48;
const buf = Array.from({ length: S }, () => Array(S).fill('none'));
const inB = (x, y) => x >= 0 && y >= 0 && x < S && y < S;

// Desenha uma peça COM contorno próprio: dilata a máscara em K, depois preenche.
function part(mask, fill, shade = null, shadeDir = [0.55, 0.83]) {
  const m = [];
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (mask(x + 0.5, y + 0.5)) m.push([x, y]);
  for (const [x, y] of m) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
    if (inB(x + dx, y + dy)) buf[y + dy][x + dx] = 'K';
  for (const [x, y] of m) {
    let col = fill;
    if (shade) {
      const g = mask.grad ? mask.grad(x + 0.5, y + 0.5) : [0, 0];
      if (g[0] * shadeDir[0] + g[1] * shadeDir[1] > 0.34) col = shade;
    }
    buf[y][x] = col;
  }
}
const ell = (cx, cy, rx, ry) => {
  const f = (x, y) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
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
const union = (...fs) => { const f = (x, y) => fs.some(g => g(x, y)); return f; };

// ---------------------------------------------------- montagem (fundo → frente)
// cauda segmentada, grossa na base (serpente de ferro / escaravelho)
const tailSegs = [[17, 30, 5.2], [12.5, 33, 4.4], [8.5, 36.5, 3.5], [5.5, 40, 2.6], [3.5, 43, 1.8]];
part(union(...tailSegs.map(([x, y, r]) => ell(x, y, r, r))), 'M');
for (const [x, y, r] of tailSegs.slice(1)) part(ell(x, y, r, r), 'D');   // anéis

part(ell(19, 36, 5.0, 7.8), 'D');                              // perna de trás
part(pol([[13, 45], [14.2, 39], [21, 39], [22.2, 45]]), 'D');  // pé de trás

// espinhos dorsais — bases ENTERRADAS no corpo, pontas bem acima da silhueta
[[15, 22], [20, 19.5], [25, 17], [30, 15.5]].forEach(([sx, sy], i) => {
  part(pol([[sx - 4.2, sy + 6], [sx - 0.8, sy - 6], [sx + 4.2, sy + 5.5]]), i % 2 ? 'M' : 'L');
});
part(pol([[27, 19], [24, 7.5], [31, 14]]), 'M');               // placas do colar
part(pol([[31, 17], [30, 6], [36, 12.5]]), 'L');

part(ell(21, 29, 9.5, 9.0), 'L', 'M');                         // quadril
part(ell(28, 24.5, 9.2, 8.6), 'L', 'M');                       // peito
// núcleo mole: SEM contorno próprio, é região interna
for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
  if (!['L', 'M'].includes(buf[y][x])) continue;
  const dx = (x + 0.5 - 25.0) / 8.0, dy = (y + 0.5 - 31.0) / 5.8;
  if (dx * dx + dy * dy <= 1) buf[y][x] = dy > 0.3 ? 'N' : 'B';
}
part(ell(29.5, 36.5, 5.4, 7.2), 'M');                          // perna da frente
part(pol([[24.5, 45], [25.7, 39], [33, 39], [34.2, 45]]), 'M');
part(ell(32, 27.5, 3.6, 2.8), 'D');                            // braço curto

part(ell(35.5, 19.5, 7.6, 6.6), 'L', 'M');                     // crânio
part(ell(41.5, 23.5, 5.2, 4.2), 'M');                          // focinho
part(pol([[33, 17], [38.5, 2.5], [42, 15.5]]), 'O');           // chifre grosso
part(pol([[39.5, 27], [40.9, 20.5], [42.3, 27]]), 'O');        // presas
part(pol([[43, 27], [44.2, 22], [45.4, 27]]), 'O');
[[15.5, 45], [20, 45], [27, 45], [31.5, 45]].forEach(([cx, cy]) =>
  part(pol([[cx - 2.2, cy], [cx, cy - 3.6], [cx + 2.2, cy]]), 'O'));   // garras

// ROSTO — a parte que mais decide o personagem, então é feita à mão.
// placa-elmo: PARA antes da base do chifre (x≥35), senão corta o chifre em dois
for (let x = 28; x <= 34; x++) { buf[16][x] = 'K'; buf[15][x] = 'D'; }
// órbita afundada: mancha escura para o âmbar ter contra o que brilhar
for (let y = 18; y <= 22; y++) for (let x = 32; x <= 38; x++) buf[y][x] = 'D';
for (let x = 31; x <= 39; x++) buf[17][x] = 'K';
// olho âmbar 3×2 com contorno — único ponto quente do sprite
for (let x = 34; x <= 36; x++) { buf[19][x] = 'A'; buf[20][x] = 'A'; }
for (let x = 33; x <= 37; x++) { buf[18][x] = 'K'; buf[21][x] = 'K'; }
buf[19][33] = 'K'; buf[20][33] = 'K'; buf[19][37] = 'K'; buf[20][37] = 'K';
// linha da mandíbula: separa focinho de crânio
for (let x = 39; x <= 45; x++) if (buf[25][x] !== 'none') buf[25][x] = 'K';
// realce âmbar nas quinas das placas do colar
buf[9][26] = 'A'; buf[10][27] = 'A'; buf[8][31] = 'A'; buf[9][32] = 'A';
// sombra no chão
for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
  if (buf[y][x] !== 'none') continue;
  const dx = (x + 0.5 - 23) / 19, dy = (y + 0.5 - 46.4) / 2.0;
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
const dir = process.argv[2] || '.';
writePng(`${dir}/brute-48.png`, buf, 1);
writePng(`${dir}/brute-48@9x.png`, buf, 9);
writePng(`${dir}/brute-48@9x-grey.png`, buf, 9, true);
console.log('ok');
