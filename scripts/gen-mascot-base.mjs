// ============================================================================
// Forma base do mascote — desenho DETERMINÍSTICO a partir do spec.
// ----------------------------------------------------------------------------
// Uso:  node scripts/gen-mascot-base.mjs docs/mascote
//
// Por que desenhado e não gerado: `platform.higgsfield.ai` está fora da
// allowlist de egresso do ambiente de agente (mesmo bloqueio registrado no
// STATUS.md para a arte de decoração). E, no caso do MASCOTE, determinístico é
// melhor de qualquer jeito: a forma precisa ser idêntica em toda escala e em
// todo redesenho, o que um gerador probabilístico não entrega.
//
// Spec em docs/MASCOTE-PRINCIPAL.md. Resumo do que está desenhado aqui:
//   círculo + dois chifre-orelhas ambíguos + olhos com pálpebra baixa +
//   boca reta (deadpan) + barriga clara + partícula-assinatura. Sem dente,
//   sem garra, sem cauda. Corpo pálido, âncora índigo (a única cor que o
//   sistema de tipos NÃO usa — ver ALIGNMENT_ACCENT em utils/oracle.ts).
//
// Se um dia a rede liberar e você quiser uma variante gerada, o prompt abaixo
// segue o template validado do repo (curto, sem fundo) e NÃO cita franquia
// nenhuma — as três referências do dono (harmonia/benevolência/poder) estão
// traduzidas em traços descritivos, como manda Attributions.md:
//
//   higgsfield generate create nano_banana_2 --wait --prompt \
//   "Retro virtual-pet sprite, 16x16 pixel art, no background, transparent \
//    background: a small round fluffy spirit creature, two soft horn-like \
//    ears, calm half-lidded eyes, pale belly patch. Flat off-white and \
//    lavender colors with indigo accents, no shading, no outlines, no \
//    anti-aliasing."
//
// Sem dependência: PNG escrito à mão (zlib do Node + CRC32).
// ============================================================================
import zlib from 'node:zlib';
import fs from 'node:fs';

const C = {
  none: [0, 0, 0, 0],
  K: [0x2a, 0x23, 0x50, 255],   // contorno + olhos
  W: [0xf2, 0xf0, 0xfa, 255],   // corpo
  S: [0xdf, 0xda, 0xf0, 255],   // sombreado
  P: [0xcb, 0xc3, 0xe6, 255],   // barriga
  I: [0x5b, 0x4f, 0xbf, 255],   // âncora índigo
  J: [0x41, 0x36, 0xa0, 255],   // sombra do chifre
  H: [0xff, 0xff, 0xff, 255],   // brilho
  G: [0x2a, 0x23, 0x50, 38],    // sombra no chão
};

const N = 48;
const BODY = { cx: 24, cy: 26, r: 14 };
const EARS = [
  [[8.5, 2.5], [14.5, 18.0], [24.0, 12.5]],
  [[39.5, 2.5], [33.5, 18.0], [24.0, 12.5]],
];
const EYES = [{ x: 16, y: 23 }, { x: 27, y: 23 }];   // canto sup-esq do bloco 5×6
const NUBS = [{ cx: 9.5, cy: 33.5 }, { cx: 38.5, cy: 33.5 }];
const MOUTH = { y: 33, x0: 21, x1: 26 };
const PARTICLE = { x: 41, y: 11 };

const inTri = (px, py, [a, b, c]) => {
  const s = (p, q, r) => (p[0] - r[0]) * (q[1] - r[1]) - (q[0] - r[0]) * (p[1] - r[1]);
  const d1 = s([px, py], a, b), d2 = s([px, py], b, c), d3 = s([px, py], c, a);
  return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
};

// Tufos: onda QUADRADA no raio (degrau de 2 px), não senóide — em pixel art
// o degrau duro lê como pelo; a senóide lê como bolha amassada.
const TUFTS = 14;
function radiusAt(theta, fluff) {
  if (!fluff) return BODY.r;
  const phase = (((theta + 0.35) * TUFTS) / (2 * Math.PI)) % 1;
  return BODY.r + ((phase + 1) % 1 < 0.5 ? 2.0 : 0);
}

function draw({ fluff = true, withNubs = true, withParticle = true, size = N } = {}) {
  const k = size / N;                                   // fator p/ variante 16
  const px = Array.from({ length: size }, () => Array(size).fill('none'));
  const solid = Array.from({ length: size }, () => Array(size).fill(false));
  const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < size && y < size) { px[y][x] = c; solid[y][x] = true; } };

  // corpo + sombreado
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (x + 0.5) / k - BODY.cx, dy = (y + 0.5) / k - BODY.cy;
    if (Math.hypot(dx, dy) <= radiusAt(Math.atan2(dy, dx), fluff))
      put(x, y, (dx * 0.6 + dy * 0.8) > 0.45 * BODY.r ? 'S' : 'W');
  }
  // barriga
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!solid[y][x]) continue;
    const dx = ((x + 0.5) / k - 24) / 8.4, dy = ((y + 0.5) / k - 37.5) / 4.6;
    if (dx * dx + dy * dy <= 1) px[y][x] = 'P';
  }
  // chifre-orelhas (só onde o corpo não está)
  EARS.forEach((tri, i) => {
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (solid[y][x]) continue;
      if (inTri((x + 0.5) / k, (y + 0.5) / k, tri)) {
        const outward = ((x + 0.5) / k - 24) * (i === 0 ? -1 : 1);
        put(x, y, outward > 9 ? 'J' : 'I');
      }
    }
  });
  // arredonda as pontas
  for (let pass = 0; pass < 2; pass++) for (let x = 0; x < size; x++) {
    let top = -1;
    for (let y = 0; y < size; y++) if (solid[y][x]) { top = y; break; }
    if (top >= 0 && top < 5 * k) { px[top][x] = 'none'; solid[top][x] = false; }
  }
  // nubs (sólidos)
  if (withNubs) for (const nb of NUBS) for (let y = 0; y < size; y++) for (let x = 0; x < size; x++)
    if (Math.hypot((x + 0.5) / k - nb.cx, (y + 0.5) / k - nb.cy) <= 3) put(x, y, 'W');

  // contorno
  const out = px.map(r => r.slice());
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (!solid[y][x]) continue;
    if ([[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => {
      const nx = x + a, ny = y + b;
      return nx < 0 || ny < 0 || nx >= size || ny >= size || !solid[ny][nx];
    })) out[y][x] = 'K';
  }

  // rosto — olhos sólidos 5×6 com pálpebra (topo estreitado) e brilho 2×2
  const eyeRows = [[1, 3], [0, 4], [0, 4], [0, 4], [0, 4], [1, 3]];
  for (const e of EYES) for (let r = 0; r < 6; r++) {
    const [a, b] = eyeRows[r];
    for (let c = a; c <= b; c++) {
      const X = Math.round((e.x + c) * k), Y = Math.round((e.y + r) * k);
      for (let sy = 0; sy < Math.max(1, k); sy++) for (let sx = 0; sx < Math.max(1, k); sx++)
        if (out[Y + sy]) out[Y + sy][X + sx] = 'K';
    }
  }
  if (k >= 1) for (const e of EYES) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    const X = Math.round((e.x + 1 + dx) * k), Y = Math.round((e.y + 1 + dy) * k);
    if (out[Y]) out[Y][X] = 'H';
  }
  // boca reta (deadpan)
  for (let x = MOUTH.x0; x <= MOUTH.x1; x++) {
    const X = Math.round(x * k), Y = Math.round(MOUTH.y * k);
    if (out[Y]) out[Y][X] = 'K';
  }

  if (withParticle) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) {
    const X = Math.round(PARTICLE.x * k) + dx, Y = Math.round(PARTICLE.y * k) + dy;
    if (out[Y] && out[Y][X] === 'none') out[Y][X] = 'I';
  }
  // sombra no chão
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    if (out[y][x] !== 'none') continue;
    const dx = ((x + 0.5) / k - 24) / 11, dy = ((y + 0.5) / k - 43.6) / 2.2;
    if (dx * dx + dy * dy <= 1) out[y][x] = 'G';
  }
  return out;
}

// ------------------------------------------------------------------ PNG
function crc32(buf) {
  const t = []; let c;
  for (let n = 0; n < 256; n++) { c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  let crc = 0xffffffff;
  for (const b of buf) crc = t[(crc ^ b) & 0xff] ^ (crc >>> 8);
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
// Autoral, não reduzido: em 16 px a escala destrói olho, boca e pelo. Sobram
// círculo + chifres + olhos + partícula, que é exatamente o teste de redução.
function draw16() {
  const mask = [
    '................',
    '...e........e...',
    '...ee......ee...',
    '...eebbbbbbee...',
    '...ebbbbbbbbe...',
    '....bbbbbbbb....',
    '...bbbbbbbbbb...',
    '...bbbbbbbbbb...',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '..bbbbbbbbbbbb..',
    '...bbbbbbbbbb...',
    '...bbbbbbbbbb...',
    '....bbbbbbbb....',
    '.....bbbbbb.....',
    '................',
  ];
  const S = 16;
  const solid = mask.map(r => [...r].map(c => c !== '.'));
  const out = mask.map(r => [...r].map(c => (c === 'e' ? 'I' : c === 'b' ? 'W' : 'none')));
  // barriga
  for (let y = 11; y <= 13; y++) for (let x = 0; x < S; x++) if (out[y][x] === 'W') out[y][x] = 'P';
  // contorno
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (!solid[y][x]) continue;
    if ([[1,0],[-1,0],[0,1],[0,-1]].some(([a, b]) => {
      const nx = x + a, ny = y + b;
      return nx < 0 || ny < 0 || nx >= S || ny >= S || !solid[ny][nx];
    })) out[y][x] = 'K';
  }
  // olhos 2×2, abaixo do centro. Sem boca — cai na redução.
  for (const ex of [5, 9]) for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) out[8 + dy][ex + dx] = 'K';
  out[8][5] = 'H'; out[8][9] = 'H';
  out[2][14] = 'I';                                   // partícula
  for (let x = 5; x <= 10; x++) out[15][x] = 'G';     // sombra
  return out;
}

const dir = process.argv[2] || '.';
const full = draw();
const icon = draw16();
writePng(`${dir}/mascot-48.png`, full, 1);
writePng(`${dir}/mascot-48@9x.png`, full, 9);
writePng(`${dir}/mascot-16.png`, icon, 1);
writePng(`${dir}/mascot-16@9x.png`, icon, 9);
writePng(`${dir}/mascot-16@9x-grey.png`, icon, 9, true);
console.log('ok');
