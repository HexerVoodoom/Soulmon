// Trailer (16:9, com música, sem voz). Origem: E:/Soulmon-marketing/site/trailer-60s-{pt,en}.mp4 (reescrito 08/11, 59 s). Reencoda 1280x720, poster = quadro t=31 s.
// Rodar na pasta site-beta: node src/tools/preparar-trailer.mjs. Conferir os quadros antes de manter trailer.ativo:true no midia.json.
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';
const SITE = 'E:/Soulmon-marketing/site';
const FFMPEG = process.env.FFMPEG ?? 'E:/tools/ffmpeg/node_modules/ffmpeg-static/ffmpeg.exe';
const PUB = 'public';
for (const l of ['pt', 'en']) {
  const mp4 = `${PUB}/video/trailer-${l}.mp4`;
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-i', `${SITE}/trailer-60s-${l}.mp4`, '-vf', 'scale=1280:720:flags=lanczos,setsar=1', '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0',
    '-pix_fmt', 'yuv420p', '-crf', '26', '-preset', 'slow', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', mp4]);
  const png = `${PUB}/video/_t-${l}.png`;
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-ss', '31', '-i', `${SITE}/trailer-60s-${l}.mp4`, '-frames:v', '1', '-update', '1', png]);
  for (const w of [640, 1280]) { await sharp(png).resize({ width: w }).webp({ quality: 72 }).toFile(`${PUB}/video/trailer-${l}-poster-${w}.webp`); await sharp(png).resize({ width: w }).avif({ quality: 40 }).toFile(`${PUB}/video/trailer-${l}-poster-${w}.avif`); }
  unlinkSync(png);
}
console.log('ok');
