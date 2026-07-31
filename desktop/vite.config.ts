import { defineConfig } from 'vite';
import path from 'node:path';
import fs from 'node:fs';

// Renderer do overlay. `base: './'` porque o Electron carrega via file://.
// Sprites 128×128 são pequenos: deixamos o Vite inlinar em base64 (evita
// problemas de caminho relativo dentro do pacote do electron-builder).
//
// O app principal referencia parte dos sprites via alias `figma:asset/<hash>.png`
// (ver vite.config.ts da raiz). O desktop importa `src/utils/sprites.ts` inteiro
// para mostrar exatamente a mesma criatura do celular, então precisa do mesmo
// alias — gerado aqui a partir dos arquivos hash-nomeados em src/assets, pra não
// duplicar a lista enorme.
const assetsDir = path.resolve(__dirname, '..', 'src', 'assets');
const figmaAssetAlias = Object.fromEntries(
  fs.readdirSync(assetsDir)
    .filter(file => /^[0-9a-f]{32,40}\.png$/.test(file))
    .map(file => [`figma:asset/${file}`, path.join(assetsDir, file)]),
);

export default defineConfig({
  root: path.resolve(__dirname, 'renderer'),
  base: './',
  resolve: {
    alias: figmaAssetAlias,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist-renderer'),
    emptyOutDir: true,
    assetsInlineLimit: 65536,
    rollupOptions: {
      input: {
        index: path.resolve(__dirname, 'renderer', 'index.html'),
        menu: path.resolve(__dirname, 'renderer', 'menu.html'),
      },
    },
  },
});
