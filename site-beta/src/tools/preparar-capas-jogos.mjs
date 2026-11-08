// Capas dos jogos (arte, 4:3): E:/Soulmon-marketing/site-assets/capas-jogos/capa-<id>.png (1600x1200, composta por E:/tmp/heroarte/compor_capas.py)
// -> public/jogos/capa-<id>-{400,800}.{avif,webp}. Ilustracao: reducao suave, sem lossless. Rodar na pasta site-beta.
import sharp from 'sharp';
const ORIGEM = 'E:/Soulmon-marketing/site-assets/capas-jogos';
for (const id of ['ppt', 'combina', 'mente', 'barrage', 'corrida', 'arena', 'rift', 'calabouco']) {
  for (const w of [400, 800]) {
    const s = () => sharp(`${ORIGEM}/capa-${id}.png`).resize({ width: w, kernel: 'lanczos3' });
    await s().avif({ quality: 50, effort: 9 }).toFile(`public/jogos/capa-${id}-${w}.avif`);
    await s().webp({ quality: 80, effort: 6 }).toFile(`public/jogos/capa-${id}-${w}.webp`);
  }
}
