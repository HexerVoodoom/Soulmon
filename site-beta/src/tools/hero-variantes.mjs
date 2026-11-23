// Gera as variantes AVIF/WebP do hero a partir de hero-arte-{desktop,celular}.png (composição: E:/tmp/heroarte/compor.py).
import sharp from 'sharp';
const A = 'E:/Soulmon-marketing/site-assets';
const L = { desktop: [960, 1440, 1672], celular: [480, 780, 840, 941] };
for (const [k, ws] of Object.entries(L)) for (const w of ws) {
  const r = sharp(`${A}/hero-arte-${k}.png`).resize({ width: w });
  await r.clone().webp({ quality: 70, effort: 6 }).toFile(`public/site/hero-${k}-${w}.webp`);
  await r.clone().avif({ quality: 40, effort: 9 }).toFile(`public/site/hero-${k}-${w}.avif`);
}
console.log('ok');
