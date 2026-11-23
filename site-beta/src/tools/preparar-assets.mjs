// Copia e otimiza os assets do repo do jogo para public/ (so leitura em D:\Soulmon\repo)
// e desenha as pecas provisorias. Rodar na pasta site-beta: node src/tools/preparar-assets.mjs
import sharp from 'sharp';
import { copyFileSync, writeFileSync, mkdirSync } from 'node:fs';

const REPO = 'D:/Soulmon/repo';
const NOVOS = `${REPO}/src/assets/soulmon/novos`;
const PUB = 'public';
for (const d of ['provisorio', 'fonts', 'sprites', 'mapa', 'marca']) mkdirSync(`${PUB}/${d}`, { recursive: true });
const lossless = (i, o) => sharp(i).webp({ lossless: true, effort: 6 }).toFile(o);

// Sprites: sem perda, tamanho nativo.
for (const e of ['rookie', 'champion', 'ultimate', 'mega', 'ultra']) await lossless(`${NOVOS}/fogo-${e}.png`, `${PUB}/sprites/fogo-${e}.webp`);
for (const e of ['agua', 'ar', 'planta']) await lossless(`${NOVOS}/${e}-rookie.png`, `${PUB}/sprites/${e}-rookie.webp`);
// Vitrine: todos rookie (grade de 4 px) reduzidos por nearest a 1/2, densidade unica.
for (const e of ['arcano', 'eletricidade', 'espaco', 'luz', 'sombra', 'terra', 'som', 'vida']) {
  await sharp(`${NOVOS}/${e}-rookie.png`).resize(128, 128, { kernel: 'nearest' }).webp({ lossless: true, effort: 6 }).toFile(`${PUB}/sprites/v-${e}.webp`);
}

// Mapa instalado no app. Reduz com suavizacao, nunca pixelated.
const MAPA = `${REPO}/src/assets/soulmon/areas/bg-laboratorio.png`;
// Orcamento do LCP em 4G lento: AVIF 760 ~100 KB, 480 ~65 KB; WebP nunca menor que o AVIF.
const Q = { 480: { avif: 28, webp: 45 }, 760: { avif: 22, webp: 45 } };
for (const w of [480, 760]) {
  await sharp(MAPA).resize({ width: w }).avif({ quality: Q[w].avif, effort: 9 }).toFile(`${PUB}/mapa/laboratorio-${w}.avif`);
  await sharp(MAPA).resize({ width: w }).webp({ quality: Q[w].webp, effort: 6 }).toFile(`${PUB}/mapa/laboratorio-${w}.webp`);
}

// Marca (definitiva, decisao do dono).
const LOGO = `${REPO}/src/assets/brand/final/logo-wordmark.png`;
await sharp(LOGO).resize({ width: 160 }).webp({ quality: 90 }).toFile(`${PUB}/marca/logo-160.webp`);
await sharp(LOGO).resize({ width: 320 }).webp({ quality: 90 }).toFile(`${PUB}/marca/logo-320.webp`);
copyFileSync(`${REPO}/src/assets/brand/final/icon-192.png`, `${PUB}/favicon-192.png`);
await sharp({ create: { width: 1200, height: 630, channels: 4, background: '#071413' } })
  .composite([
    { input: await sharp(LOGO).resize({ width: 480 }).toBuffer(), left: 90, top: 136 },
    { input: await sharp(`${NOVOS}/fogo-ultimate.png`).resize(512, 512, { kernel: 'nearest' }).toBuffer(), left: 640, top: 59 },
  ]).png().toFile(`${PUB}/og.png`);

// Fontes (OFL), as mesmas do app.
for (const f of ['cinzel-latin', 'cinzel-latin-ext', 'rubik-latin', 'rubik-latin-ext']) copyFileSync(`${REPO}/public/fonts/${f}.woff2`, `${PUB}/fonts/${f}.woff2`);
copyFileSync(`${REPO}/dist/assets/silkscreen-latin-400-normal-CtPo2yA5.woff2`, `${PUB}/fonts/silkscreen-latin.woff2`);

// ---------- Pecas provisorias em grade de pixel ----------
function svg(w, h, s, px) {
  const r = px.map(([x, y, c, ww = 1, hh = 1]) => `<rect x="${x}" y="${y}" width="${ww}" height="${hh}" fill="${c}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * s}" height="${h * s}" shape-rendering="crispEdges">${r}</svg>\n`;
}
const C = { esc: '#8A5A2B', anel: '#C68642', med: '#D9A05B', cla: '#EBBE84' };

function cristal(estado) {
  const pal = {
    apagado: { a: '#2A5A57', b: '#1B4240', c: '#12302F', d: '#3B716D' },
    acendendo: { a: '#29C9B8', b: '#178A80', c: '#0F5F59', d: '#5FF3E0' },
    aceso: { a: '#5FF3E0', b: '#29C9B8', c: '#178A80', d: '#E9FFFB' },
  }[estado];
  const px = [];
  const larg = [1, 2, 3, 4, 5, 6, 6, 7, 7, 7, 7, 7, 7, 7, 7, 7, 7, 6, 6, 5, 4, 3]; // meia-largura por linha
  const cx = 12;
  larg.forEach((m, i) => {
    const y = i + 1;
    px.push([cx - m - 1, y, '#071413'], [cx + m, y, '#071413']);
    for (let x = -m; x < m; x++) {
      let c = pal.b;
      if (x < -m + 2) c = pal.a;
      else if (x >= m - 2) c = pal.c;
      else if (x === -1 && i < 8) c = pal.d;
      px.push([cx + x, y, c]);
    }
  });
  const chama = estado === 'apagado' ? [[12, 15, '#3B716D', 1, 2]] : estado === 'acendendo'
    ? [[11, 14, '#E9FFFB', 2, 3], [12, 12, '#E9FFFB', 1, 2], [10, 15, '#5FF3E0', 1, 2], [13, 15, '#5FF3E0', 1, 2]]
    : [[11, 9, '#FFFFFF', 2, 2], [10, 11, '#FFFFFF', 4, 5], [12, 7, '#FFFFFF', 1, 2], [9, 13, '#E9FFFB', 1, 3], [14, 13, '#E9FFFB', 1, 3], [11, 16, '#FFFFFF', 2, 2], [14, 9, '#E9FFFB', 1, 2]];
  px.push(...chama);
  if (estado === 'aceso') px.push([3, 5, '#5FF3E0'], [21, 8, '#5FF3E0'], [2, 12, '#29C9B8'], [22, 3, '#29C9B8']);
  // berco de cobre e folhinhas
  px.push([6, 23, C.cla, 12, 1], [5, 24, C.med, 14, 1], [6, 25, C.anel, 12, 1], [8, 26, C.esc, 8, 1], [11, 27, C.anel, 2, 3]);
  px.push([3, 22, '#3FA45B', 2, 1], [2, 21, '#57C876', 2, 1], [4, 23, '#2C7A44', 2, 1], [19, 22, '#3FA45B', 2, 1], [20, 21, '#57C876', 2, 1], [18, 23, '#2C7A44', 2, 1]);
  return svg(24, 30, 4, px);
}
for (const e of ['apagado', 'acendendo', 'aceso']) writeFileSync(`${PUB}/provisorio/cristal-${e}.svg`, cristal(e));

writeFileSync(`${PUB}/provisorio/chama.svg`, svg(6, 8, 4, [
  [2, 0, '#5FF3E0'], [2, 1, '#5FF3E0', 2, 1], [1, 2, '#5FF3E0', 3, 1], [4, 2, '#29C9B8'], [1, 3, '#29C9B8'], [2, 3, '#E9FFFB', 2, 1], [4, 3, '#5FF3E0'],
  [0, 4, '#29C9B8'], [1, 4, '#5FF3E0'], [2, 4, '#FFFFFF', 2, 2], [4, 4, '#5FF3E0'], [5, 4, '#29C9B8'], [0, 5, '#29C9B8'], [1, 5, '#5FF3E0'], [4, 5, '#5FF3E0'], [5, 5, '#29C9B8'],
  [1, 6, '#29C9B8'], [2, 6, '#5FF3E0', 2, 1], [4, 6, '#29C9B8'], [2, 7, '#29C9B8', 2, 1],
]));

// Anel do visor, cor #C68642, sem dentes (nao pode lembrar engrenagem).
const G = 72; const anel = [];
for (let y = 0; y < G; y++) for (let x = 0; x < G; x++) {
  const d = Math.hypot(x + 0.5 - G / 2, y + 0.5 - G / 2);
  if (d > G / 2) continue;
  if (d > G / 2 - 1) anel.push([x, y, C.esc]);
  else if (d > G / 2 - 3) anel.push([x, y, (x + y < G - 8) ? C.cla : C.anel]);
  else if (d > G / 2 - 4) anel.push([x, y, C.anel]);
  else if (d > G / 2 - 5) anel.push([x, y, '#071413']);
  else anel.push([x, y, '#0F2A29']);
}
for (const [x, y, w, h] of [[12, 40, 14, 1], [26, 40, 1, 12], [46, 22, 14, 1], [46, 22, 1, 10], [20, 16, 1, 8], [52, 48, 8, 1]]) anel.push([x, y, '#163735', w, h]);
writeFileSync(`${PUB}/provisorio/visor.svg`, svg(G, G, 4, anel));

// Trecho repetivel do cabo: 36x320, com no de circuito e broto de folha.
const t = [];
t.push([1, 0, C.cla, 1, 80], [2, 0, C.anel, 1, 80], [3, 0, C.esc, 1, 80]);
t.push([0, 20, C.cla, 5, 3], [1, 21, '#5FF3E0', 3, 1]);
t.push([4, 58, '#2C7A44'], [5, 57, '#3FA45B'], [6, 56, '#57C876', 2, 1], [5, 55, '#57C876'], [7, 57, '#3FA45B']);
writeFileSync(`${PUB}/provisorio/cabo.svg`, svg(9, 80, 4, t));
