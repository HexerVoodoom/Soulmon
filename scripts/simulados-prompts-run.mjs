// Roda `simulados-prompts.ts`. Empacota antes porque o Oráculo importa `class-system` pelo alias do Vite (`vendor/class-system`).
import { build } from 'esbuild';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const destino = join(raiz, 'node_modules', '.cache', 'simulados-prompts', 'b.mjs');
mkdirSync(dirname(destino), { recursive: true });
await build({
  entryPoints: [join(raiz, 'scripts', 'simulados-prompts.ts')],
  bundle: true, platform: 'node', format: 'esm', outfile: destino, logLevel: 'error',
  alias: { 'class-system': join(raiz, 'vendor', 'class-system', 'index.js') },
  external: ['esbuild', 'sharp'],
  loader: { '.png': 'dataurl', '.webp': 'dataurl', '.jpg': 'dataurl', '.svg': 'dataurl', '.mp3': 'dataurl', '.css': 'empty' },
  define: { 'import.meta.env': '{}' },
});
const { main } = await import(pathToFileURL(destino).href);
await main(process.argv.slice(2));
