// Post-build: converte todo PNG de dist/assets/ em WebP, REESCREVE as
// referências na saída (JS/CSS/HTML) para apontar ao .webp e apaga o PNG.
//
// ⚰️ 21/09/2026 (QA GERAL, decisão do dono #32). Até aqui o script mantinha o
// PNG "alongside originals" e confiava no `public/sw.js` para trocar `.png` por
// `.webp` em runtime. Isso deixava 100 MB de PNG em `dist/` (commitado) que o
// SW quase nunca servia — MAS "quase nunca" não é "nunca": o SW é registrado no
// `load` (`index.html`), então na PRIMEIRA visita as `<img>` já pediram o
// `.png` da rede antes de existir um SW para reescrever; e o ramo do SW exige
// `Accept: image/webp`, que um `fetch()` cru não manda. Apagar o PNG sem mais
// quebraria exatamente a primeira visita. Por isso a troca é feita AQUI, no
// build: o bundle passa a pedir `.webp` direto, o ramo `acceptsWebP` do SW
// vira código sem uso (fica: é inofensivo e continua correto para `.png` de
// `public/`, que este script não toca), e o PNG só é apagado depois que a
// conversão E a reescrita deram certo. Se qualquer passo falhar, o PNG fica e o
// build sai com código 1 — nunca um dist/ com referência para arquivo ausente.
//
// Quem prova que fechou: `src/deploy/orcamentoDeBytes.contract.test.ts` exige
// zero `.png` em `dist/assets` e zero referência a `.png` de assets no bundle.
import { readdir, stat, readFile, writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { pathToFileURL } from 'url';
import sharp from 'sharp';

const DIST_DIR = 'dist';
/** Arquivos de texto da saída onde a URL do asset pode aparecer. */
const TEXTO = /\.(js|mjs|css|html|json|webmanifest|map)$/;

async function arquivosDeTexto(dir, saida = []) {
  for (const nome of await readdir(dir)) {
    const p = join(dir, nome);
    if ((await stat(p)).isDirectory()) await arquivosDeTexto(p, saida);
    else if (TEXTO.test(nome)) saida.push(p);
  }
  return saida;
}

/**
 * Conversor padrão: PNG → WebP via sharp. Injetável (`opts.converterUm`) para
 * o teste simular uma conversão que falha sem depender de um PNG corrompido.
 */
async function converterUm(inputPath, outputPath) {
  await sharp(inputPath).webp({ quality: 85, effort: 4 }).toFile(outputPath);
}

/**
 * Faz o trabalho inteiro sobre `distDir` e DEVOLVE o resultado — nunca chama
 * `process.exit` nem escreve no console por conta própria (`log`/`error` são
 * injetáveis). Extraído de `main()` em 21/09/2026 (QA, rodada A) para que o
 * comportamento "referência sobrando → PNG intacto" seja PROVADO por teste em
 * pasta temporária, não lido do código. `npm run build` continua chamando
 * `main()`, que mapeia o resultado para os mesmos códigos de saída.
 *
 * @param {string} distDir
 * @param {{ log?: (s: string) => void, error?: (s: string) => void, converterUm?: typeof converterUm }} [opts]
 * @returns {Promise<{
 *   ok: boolean,
 *   motivo: 'sem-dist' | 'sem-png' | 'sobras' | 'falhas' | null,
 *   convertidos: string[], falhas: string[], sobras: string[],
 *   referencias: number, arquivosReescritos: number, savedBytes: number, total: number,
 * }>}
 */
export async function converter(distDir = DIST_DIR, opts = {}) {
  const log = opts.log ?? console.log;
  const error = opts.error ?? console.error;
  const conv = opts.converterUm ?? converterUm;
  const assetsDir = join(distDir, 'assets');
  const vazio = { convertidos: [], falhas: [], sobras: [], referencias: 0, arquivosReescritos: 0, savedBytes: 0, total: 0 };

  let files;
  try {
    files = await readdir(assetsDir);
  } catch {
    error(`Directory not found: ${assetsDir}. Run "npm run build" first.`);
    return { ok: false, motivo: 'sem-dist', ...vazio };
  }

  const pngs = files.filter((f) => f.endsWith('.png'));
  if (pngs.length === 0) {
    log('No PNG assets found.');
    return { ok: true, motivo: 'sem-png', ...vazio };
  }

  // 1. Converter. Só entra no mapa de reescrita o que converteu de verdade.
  const convertidos = new Map(); // nome.png → nome.webp
  let savedBytes = 0;
  const falhas = [];
  for (const file of pngs) {
    const inputPath = join(assetsDir, file);
    const webpName = file.replace(/\.png$/, '.webp');
    const outputPath = join(assetsDir, webpName);
    const { size: inputSize } = await stat(inputPath);
    try {
      await conv(inputPath, outputPath);
      const { size: outputSize } = await stat(outputPath);
      savedBytes += inputSize - outputSize;
      convertidos.set(file, webpName);
      log(
        `  ✓ ${file.slice(0, 40).padEnd(40)} ${(inputSize / 1024).toFixed(0).padStart(6)} kB → ${(outputSize / 1024).toFixed(0).padStart(5)} kB WebP`
      );
    } catch (err) {
      falhas.push(file);
      error(`  ✗ ${file}: ${err.message}`);
    }
  }

  // 2. Reescrever as referências. O nome com hash é único, e o sufixo `.png`
  //    desambigua — troca textual exata, sem regex sobre o conteúdo.
  let arquivosReescritos = 0;
  let referencias = 0;
  for (const p of await arquivosDeTexto(distDir)) {
    const antes = await readFile(p, 'utf8');
    let depois = antes;
    for (const [png, webp] of convertidos) {
      if (depois.includes(png)) {
        referencias += depois.split(png).length - 1;
        depois = depois.split(png).join(webp);
      }
    }
    if (depois !== antes) {
      await writeFile(p, depois);
      arquivosReescritos++;
    }
  }

  // 3. Apagar o PNG — só o convertido, e só se nenhuma referência sobrou.
  const sobras = [];
  for (const p of await arquivosDeTexto(distDir)) {
    const c = await readFile(p, 'utf8');
    for (const png of convertidos.keys()) if (c.includes(png)) sobras.push(`${p} → ${png}`);
  }
  const base = {
    convertidos: [...convertidos.keys()], falhas, sobras, referencias, arquivosReescritos, savedBytes, total: pngs.length,
  };
  if (sobras.length > 0) {
    error(`\n✗ ${sobras.length} referência(s) a PNG sobraram após a reescrita; PNGs mantidos:\n  ${sobras.join('\n  ')}`);
    return { ok: false, motivo: 'sobras', ...base };
  }
  for (const png of convertidos.keys()) await unlink(join(assetsDir, png));

  const savedMB = (savedBytes / 1024 / 1024).toFixed(2);
  log(
    `\nConverted ${convertidos.size}/${pngs.length} PNGs → WebP (${savedMB} MB a menos), ` +
    `${referencias} referência(s) reescrita(s) em ${arquivosReescritos} arquivo(s), PNGs apagados.`
  );
  if (falhas.length > 0) {
    error(`✗ ${falhas.length} PNG(s) não converteram e ficaram como .png no dist/.`);
    return { ok: false, motivo: 'falhas', ...base };
  }
  return { ok: true, motivo: null, ...base };
}

async function main() {
  const r = await converter(DIST_DIR);
  if (!r.ok) process.exit(1);
}

// Só roda quando invocado direto (`node scripts/convert-to-webp.mjs`); importado
// pelo teste, não faz nada. `process.argv[1]` é o caminho do script executado.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
