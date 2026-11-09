// Instala a linha "Noturno" (corvinho roxo do dono) no site: lê uma pasta com um PNG por forma
// (o nome do arquivo precisa conter rookie, champion, ultimate, mega ou ultra) e grava
// public/sprites/noturno-<forma>.webp (256) e noturno-<forma>-128.webp. Com os 5, o build liga a linha
// na árvore e na demo do scroll sozinho (Landing.astro, NOTURNO).
// Uso: node src/tools/instalar-noturno.mjs E:/Soulmon-assets/site-corvo
import sharp from 'sharp'; import fs from 'node:fs'; import path from 'node:path';
const dir = process.argv[2]; if (!dir) { console.error('informe a pasta'); process.exit(1); }
const FORMAS = ['rookie', 'champion', 'ultimate', 'mega', 'ultra'];
const arqs = fs.readdirSync(dir).filter((f) => /\.(png|webp)$/i.test(f));
let ok = 0;
for (const fm of FORMAS) {
  const a = arqs.find((f) => f.toLowerCase().includes(fm));
  if (!a) { console.log(`FALTA: ${fm}`); continue; }
  const src = path.join(dir, a);
  const base = sharp(src).trim();
  const buf = await base.png().toBuffer();
  for (const [w, suf] of [[256, ''], [128, '-128']]) {
    await sharp(buf).resize(w, w, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 }, kernel: 'nearest' }).webp({ lossless: true }).toFile(`public/sprites/noturno-${fm}${suf}.webp`);
  }
  console.log(`ok ${fm} <- ${a}`); ok++;
}
console.log(ok === 5 ? 'Linha completa: rode npm run build.' : `Só ${ok}/5: a linha fica desligada até ter as 5.`);
