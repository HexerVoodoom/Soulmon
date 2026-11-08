// Prepara a mídia da reconstrução v3 (PLANO-DESIGN v3). Só lê as origens; escreve em public/.
// Rodar na pasta site-beta: node src/tools/preparar-v3.mjs
// Origens: mapas instalados no app (mapas-main, NUNCA mercado/forja), sprites de soulmon/novos,
// loop e prints reais de E:/Soulmon-marketing/site/.
import sharp from 'sharp';
import { mkdirSync, existsSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const MAPAS = process.env.MAPAS_DIR ?? 'E:/tmp/claude/b5f03034d35be1a5/3e00f769-6e4b-4482-9866-bd58d75f44a7/scratchpad/mapas-main';
const NOVOS = 'D:/Soulmon/repo/src/assets/soulmon/novos';
const SITE = 'E:/Soulmon-marketing/site';
const FFMPEG = process.env.FFMPEG ?? 'E:/tools/ffmpeg/node_modules/ffmpeg-static/ffmpeg.exe';
const PUB = 'public';
for (const d of ['mapa', 'sprites', 'video', 'print']) mkdirSync(`${PUB}/${d}`, { recursive: true });

// ---------- Mapas ----------
// Celular: retrato inteiro (480 e 820; o arquivo tem ~821 de largura, nunca ampliar).
// Desktop: recorte paisagem na largura nativa, em volta do foco medido (y0 = topo do recorte, em % da altura).
const RECORTES = {
  exploracao: [{ nome: 'exploracao-d', y0: 0.20, h: 600 }, { nome: 'exploracao-base-d', y0: 0.58, h: 600 }],
  laboratorio: [{ nome: 'laboratorio-d', y0: 0.12, h: 600 }],
  jogos: [{ nome: 'jogos-d', y0: 0.08, h: 600 }],
  hall: [{ nome: 'hall-d', y0: 0.40, h: 600 }],
  arena: [{ nome: 'arena-d', y0: 0.30, h: 560 }],
  guilda: [{ nome: 'guilda-fecho-d', y0: 0.30, h: 640 }], // fecho (seção 10): praça do cristal
};
for (const [id, cortes] of Object.entries(RECORTES)) {
  const src = `${MAPAS}/bg-${id}.png`;
  const { width: W, height: H } = await sharp(src).metadata();
  for (const w of [480, 820]) {
    const r = sharp(src).resize({ width: Math.min(w, W) });
    // O 480 da Exploração é a imagem LCP do celular: qualidade menor para caber no orçamento de 2,5 s.
    await r.clone().avif({ quality: w === 480 ? (id === 'exploracao' ? 24 : 30) : 34, effort: 9 }).toFile(`${PUB}/mapa/${id}-${w}.avif`);
    await r.clone().webp({ quality: 50, effort: 6 }).toFile(`${PUB}/mapa/${id}-${w}.webp`);
  }
  for (const c of cortes) {
    const top = Math.round(c.y0 * H); const h = Math.min(c.h, H - top);
    const r = sharp(src).extract({ left: 0, top, width: W, height: h });
    await r.clone().avif({ quality: 36, effort: 9 }).toFile(`${PUB}/mapa/${c.nome}.avif`);
    await r.clone().webp({ quality: 55, effort: 6 }).toFile(`${PUB}/mapa/${c.nome}.webp`);
    console.log(c.nome, W, h);
  }
}

// ---------- Sprites (só novos/; nada da DEMO; fogo só no ultimate) ----------
const SPRITES = [
  'fogo-ultimate', 'agua-ultimate', 'ar-champion', 'fada-champion', 'luz-rookie', 'espaco-ultra', 'vida-rookie',
  'agua-mega', 'ar-ultra', 'luz-ultimate', 'fada-ultra', 'tempo-ultimate', 'eletricidade-ultra', 'espaco-ultimate', 'vida-ultra',
  'marcial-ultimate', 'vigor-mega', 'luz-mega', 'som-champion', 'terra-champion', 'industrial-rookie', 'agua-rookie', 'arcano-mega', 'gravidade-rookie',
  'planta-rookie', 'planta-champion', 'planta-ultimate', 'planta-mega', 'planta-ultra',
];
for (const s of SPRITES) {
  if (/^fogo-(rookie|champion|mega|ultra)$/.test(s)) throw new Error(`vetado: ${s}`);
  // O arquivo tem milhares de cores de ruído; 256 sem pontilhado é invisível na escala do site e corta ~50% (LCP).
  const pal = await sharp(`${NOVOS}/${s}.png`).png({ palette: true, colors: 256, dither: 0, effort: 10 }).toBuffer();
  await sharp(pal).webp({ lossless: true, effort: 6 }).toFile(`${PUB}/sprites/${s}.webp`);
}

// ---------- Loop real e posters: movidos para src/tools/preparar-loop.mjs (regerar com ele; poster = quadro do contador 2/3) ----------

// Trailer: DESLIGADO (midia.json trailer.ativo=false). O arquivo de 06/11 mostra ROOKIE..ULTRA e "ciência do comportamento".
// Só reencode quando o trailer novo chegar: TRAILER=1 node src/tools/preparar-v3.mjs
if (process.env.TRAILER === '1') {
// ---------- Trailer de 60 s (16:9, com música, sem voz): web 1280x720, capa = quadro dos distritos (31 s), WebP + AVIF ----------
for (const l of ['pt', 'en']) {
  const mp4 = `${PUB}/video/trailer-${l}.mp4`;
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-i', `${SITE}/trailer-60s-${l}.mp4`, '-vf', 'scale=1280:720:flags=lanczos,setsar=1', '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0',
    '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', mp4]);
  const png = `${PUB}/video/_t-${l}.png`;
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-ss', '31', '-i', `${SITE}/trailer-60s-${l}.mp4`, '-frames:v', '1', '-update', '1', png]);
  for (const w of [640, 1280]) { await sharp(png).resize({ width: w }).webp({ quality: 72 }).toFile(`${PUB}/video/trailer-${l}-poster-${w}.webp`); await sharp(png).resize({ width: w }).avif({ quality: 40 }).toFile(`${PUB}/video/trailer-${l}-poster-${w}.avif`); }
  unlinkSync(png);
}
}

// ---------- Prints reais (1170x2532) por largura de tela ----------
for (const n of ['combate', 'rift', 'hall', 'jogos']) for (const l of ['pt', 'en']) {
  const src = `${SITE}/print-${n}-${l}.png`;
  if (!existsSync(src)) throw new Error(src);
  for (const w of [240, 480, 720]) {
    const r = sharp(src).resize({ width: w });
    await r.clone().avif({ quality: 36, effort: 9 }).toFile(`${PUB}/print/${n}-${l}-${w}.avif`);
    await r.clone().webp({ quality: 72, effort: 6 }).toFile(`${PUB}/print/${n}-${l}-${w}.webp`);
  }
}
// Logo do hero no celular (176 CSS px em DPR 1,75 a 2): 320 de largura.
await sharp(`${PUB}/site/logo-completo-alfa.webp`).resize({ width: 320 }).webp({ quality: 66 }).toFile(`${PUB}/site/logo-320.webp`);
console.log('ok');
