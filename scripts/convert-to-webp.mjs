// Post-build script: converts PNG assets in dist/assets/ to WebP alongside originals.
// The service worker (sw.js) transparently serves .webp to browsers that support it.
import { readdir, stat } from 'fs/promises';
import { join } from 'path';
import sharp from 'sharp';

const ASSETS_DIR = 'dist/assets';

async function main() {
  let files;
  try {
    files = await readdir(ASSETS_DIR);
  } catch {
    console.error(`Directory not found: ${ASSETS_DIR}. Run "npm run build" first.`);
    process.exit(1);
  }

  const pngs = files.filter((f) => f.endsWith('.png'));
  if (pngs.length === 0) {
    console.log('No PNG assets found.');
    return;
  }

  let converted = 0;
  let savedBytes = 0;

  for (const file of pngs) {
    const inputPath = join(ASSETS_DIR, file);
    const outputPath = join(ASSETS_DIR, file.replace(/\.png$/, '.webp'));
    const { size: inputSize } = await stat(inputPath);

    try {
      await sharp(inputPath).webp({ quality: 85, effort: 4 }).toFile(outputPath);
      const { size: outputSize } = await stat(outputPath);
      savedBytes += inputSize - outputSize;
      converted++;
      console.log(
        `  ✓ ${file.slice(0, 40).padEnd(40)} ${(inputSize / 1024).toFixed(0).padStart(6)} kB → ${(outputSize / 1024).toFixed(0).padStart(5)} kB WebP`
      );
    } catch (err) {
      console.error(`  ✗ ${file}: ${err.message}`);
    }
  }

  const savedMB = (savedBytes / 1024 / 1024).toFixed(2);
  const pct = pngs.length > 0 ? Math.round((savedBytes / pngs.reduce(async () => 0, 0)) * 100) : 0;
  console.log(`\nConverted ${converted}/${pngs.length} PNGs → WebP, saving ${savedMB} MB total.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
