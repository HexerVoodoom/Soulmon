// Gera `dist/prefetch-index.json`: o índice do que o pré-download do onboarding baixa (`src/utils/prefetchOnboarding.ts`).
// Sai do que EXISTE em `dist/assets` (nomes com hash de conteúdo), nunca de lista à mão: arte/chunk novo entra sozinho.
//   essencial = todo o código (js/css/fontes) + artes de prédio/NPC/moldura/UI/fundo (por prefixo do nome);
//   resto     = o demais (efeitos, sprites, ícones...), só no Wi-Fi.
import { readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** Prefixos de arte que pesam na 1ª visita a cada tela (prédios, NPCs, molduras, UI, fundos de área). */
export const PREFIXOS_ESSENCIAIS = ['lote', 'npc', 'frame', 'moldura', 'popup', 'placa', 'bg', 'btn', 'icon', 'chip', 'mapa'];
const CODIGO = new Set(['.js', '.css', '.woff', '.woff2']);
const ARTE = new Set(['.webp', '.png', '.jpg', '.jpeg', '.svg']);
const TEM_HASH = /-[A-Za-z0-9_-]{8,}\.[a-z0-9]+$/;

export function ehEssencial(nome) {
  const ext = extname(nome).toLowerCase();
  if (CODIGO.has(ext)) return true;
  if (!ARTE.has(ext)) return false;
  const prefixo = nome.split(/[-_.]/)[0].toLowerCase();
  return PREFIXOS_ESSENCIAIS.includes(prefixo);
}

/** @param {string} dist pasta de build (ou fixture) com `assets/`. */
export function gerarIndice(dist, agora = new Date()) {
  const pasta = resolve(dist, 'assets');
  const essencial = [];
  const resto = [];
  for (const nome of existsSync(pasta) ? readdirSync(pasta).sort() : []) {
    if (!TEM_HASH.test(nome)) continue; // só o que é imutável pode ir ao acervo
    const ext = extname(nome).toLowerCase();
    if (!CODIGO.has(ext) && !ARTE.has(ext)) continue; // vídeo e afins ficam de fora
    const tam = statSync(resolve(pasta, nome)).size;
    (ehEssencial(nome) ? essencial : resto).push([`/assets/${nome}`, tam]);
  }
  // Código primeiro: é o que trava a navegação; depois a arte.
  essencial.sort((a, b) => Number(/\.(js|css)$/.test(b[0])) - Number(/\.(js|css)$/.test(a[0])));
  return { v: 1, built: agora.toISOString(), essencial, resto };
}

const eMain = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (eMain) {
  const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
  const idx = gerarIndice(dist);
  writeFileSync(resolve(dist, 'prefetch-index.json'), JSON.stringify(idx));
  console.log(`prefetch-index: ${idx.essencial.length} essenciais, ${idx.resto.length} no resto`);
}
