// Loop real (Noturno marca 3 tarefas) e posters. Origem: E:/Soulmon-marketing/site/loop-{pt,en}.mp4 (regravado 08/11, 11 s, 780x1688).
// Reencoda em 768x1664 (multiplos de 16: 780x1688 saia com meia imagem cinza no decodificador do Windows).
// Poster = quadro limpo com o contador em "Missao 2/3" (t=6 s): sem "+10 EXP" flutuante, sem toast NEW, sem selo DEMO.
// Rodar na pasta site-beta: node src/tools/preparar-loop.mjs
import sharp from 'sharp';
import { execFileSync } from 'node:child_process';
import { unlinkSync } from 'node:fs';
const SITE = 'E:/Soulmon-marketing/site';
const FFMPEG = process.env.FFMPEG ?? 'E:/tools/ffmpeg/node_modules/ffmpeg-static/ffmpeg.exe';
const T = process.env.POSTER_T ?? '6';
for (const l of ['pt', 'en']) {
  const mp4 = `public/video/loop-${l}.mp4`;
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-i', `${SITE}/loop-${l}.mp4`, '-an', '-vf', 'scale=768:1664:flags=lanczos,setsar=1',
    '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.0', '-pix_fmt', 'yuv420p', '-crf', '25', '-preset', 'slow', '-movflags', '+faststart', mp4]);
  const png = `public/video/_q-${l}.png`;
  execFileSync(FFMPEG, ['-y', '-v', 'error', '-ss', T, '-i', mp4, '-frames:v', '1', '-update', '1', png]);
  for (const [w, suf] of [[640, ''], [360, '-360']]) {
    await sharp(png).resize({ width: w }).webp({ quality: 70 }).toFile(`public/video/loop-${l}-poster${suf}.webp`);
    await sharp(png).resize({ width: w }).avif({ quality: 45 }).toFile(`public/video/loop-${l}-poster${suf}.avif`);
  }
  unlinkSync(png);
}
console.log('ok');
