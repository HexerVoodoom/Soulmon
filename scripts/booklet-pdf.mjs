// Gera `docs/BOOKLET-UNIVERSO.pdf` a partir de `docs/BOOKLET-UNIVERSO.md`.
//
// MOBILE FIRST, e isso é a decisão de formato, não um adjetivo: a página do PDF
// tem 390 × 844 pt — a caixa de um telefone —, então quem abre no celular lê a
// 100% de zoom, sem pinçar e sem rolagem horizontal. Em A4 o mesmo arquivo
// ficaria com linha de ~95 caracteres e a pessoa leria no telefone a 40%.
//
// Por que um conversor de Markdown escrito à mão em vez de uma dependência:
// este arquivo converte UM documento conhecido, e acrescentar `marked`/
// `markdown-it` ao `package.json` para um PDF de documentação colocaria uma
// dependência nova no caminho de build de um app que não renderiza Markdown em
// lugar nenhum. O subconjunto coberto é exatamente o que o livrinho usa —
// título, parágrafo, tabela, citação, lista, régua, ênfase, código, link — mais
// o bloco de HTML cru, que passa intacto porque as figuras JÁ são HTML.
//
// As imagens são REAMOSTRADAS por `sharp` antes de entrar no PDF. Sem isso o
// Chromium embute o PNG inteiro: só as duas cenas de fenda são 6,2 MB para
// aparecer com 200–260 px de largura, e o arquivo final passava de 15 MB —
// tamanho que é uma barreira real para baixar no celular, que é justamente o
// aparelho para o qual isto foi feito. O alvo é 2× a largura de exibição
// (retina) e `kernel: 'nearest'`, porque reamostrar pixel art com Lanczos
// borra a grade — e a grade É a estética do visor.
//
// Uso: `npm run booklet:pdf` (o livrinho) ou
//      `node scripts/booklet-pdf.mjs docs/<outro>.md` para qualquer doc da
//      mesma família — a história de prólogo usa o MESMO gerador de propósito:
//      dois renderizadores dariam dois PDFs com tipografia diferente para o
//      mesmo universo, e a divergência apareceria só no telefone de quem lê.

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** O `.md` de entrada vem por argumento; sem argumento, o livrinho. O PDF sai
 *  ao lado dele, com o mesmo nome. */
const ENTRADA = process.argv[2] ?? 'docs/BOOKLET-UNIVERSO.md';
const MD = path.resolve(RAIZ, ENTRADA);
const PDF = MD.replace(/\.md$/, '.pdf');
const TMP = path.join(RAIZ, '.booklet-pdf-tmp');

/** Os caminhos de imagem no `.md` são relativos AO DOC, não à raiz, então um
 *  doc numa subpasta (`docs/historias/`) usa `../../src/assets/…`. É daqui que
 *  sai quantos `../` o regex precisa aceitar. */
const PREFIXO = path
  .relative(path.dirname(MD), path.join(RAIZ, 'src/assets'))
  .replace(/\\/g, '/')
  .replace(/src\/assets$/, '');

/** Página do PDF, em pontos. 390 × 844 é a caixa de telefone que o resto do
 *  projeto já usa como referência (os artboards da squad-design são 390×844). */
const PAGINA = { width: '390px', height: '844px' };

// ─────────────────────────────── Markdown ───────────────────────────────

const escapar = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Ênfase, código, link. Roda DEPOIS do escape, sobre texto já seguro. */
function inline(txt) {
  return txt
    .replace(/`([^`]+)`/g, (_, c) => `<code>${c}</code>`)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
}

/** Uma linha de tabela já vem com `|` nas bordas; devolve as células. */
const celulas = (linha) =>
  linha.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

const separador = (linha) => /^\|[\s:|-]+\|$/.test(linha.trim());

function markdownParaHtml(md) {
  const linhas = md.split('\n');
  const out = [];
  let i = 0;
  let paragrafo = [];

  const fecharParagrafo = () => {
    if (paragrafo.length) {
      out.push(`<p>${inline(escapar(paragrafo.join(' ')))}</p>`);
      paragrafo = [];
    }
  };

  while (i < linhas.length) {
    const l = linhas[i];

    // Bloco de HTML cru (as figuras). Passa intacto até fechar a tag de topo.
    if (/^<(p|div|img|table|figure)\b/.test(l.trim())) {
      fecharParagrafo();
      const abre = l.trim().match(/^<(\w+)/)[1];
      const bloco = [l];
      if (!l.trim().endsWith(`</${abre}>`) && !l.trim().endsWith('/>')) {
        while (++i < linhas.length) {
          bloco.push(linhas[i]);
          if (linhas[i].trim().endsWith(`</${abre}>`)) break;
        }
      }
      out.push(bloco.join('\n'));
      i++;
      continue;
    }

    if (!l.trim()) { fecharParagrafo(); i++; continue; }

    if (/^---+\s*$/.test(l)) { fecharParagrafo(); out.push('<hr>'); i++; continue; }

    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      fecharParagrafo();
      const n = h[1].length;
      out.push(`<h${n}>${inline(escapar(h[2]))}</h${n}>`);
      i++;
      continue;
    }

    // Tabela: uma linha de cabeçalho, uma de separador, N de corpo.
    if (l.trim().startsWith('|') && separador(linhas[i + 1] || '')) {
      fecharParagrafo();
      const cab = celulas(l);
      i += 2;
      const corpo = [];
      while (i < linhas.length && linhas[i].trim().startsWith('|')) {
        corpo.push(celulas(linhas[i]));
        i++;
      }
      // Uma célula que é só uma <img> não passa por escape: é figura, não texto.
      const cel = (c, tag) =>
        `<${tag}>${/^<img\b/.test(c) ? c : inline(escapar(c))}</${tag}>`;
      const temCabecalho = cab.some((c) => c !== '');
      out.push(
        '<table>' +
          (temCabecalho ? `<thead><tr>${cab.map((c) => cel(c, 'th')).join('')}</tr></thead>` : '') +
          `<tbody>${corpo.map((r) => `<tr>${r.map((c) => cel(c, 'td')).join('')}</tr>`).join('')}</tbody>` +
          '</table>'
      );
      continue;
    }

    // Citação (`>`), incluindo as de várias linhas.
    if (l.trimStart().startsWith('>')) {
      fecharParagrafo();
      const dentro = [];
      while (i < linhas.length && linhas[i].trimStart().startsWith('>')) {
        dentro.push(linhas[i].replace(/^\s*>\s?/, ''));
        i++;
      }
      out.push(`<blockquote>${markdownParaHtml(dentro.join('\n'))}</blockquote>`);
      continue;
    }

    // Lista (`-` ou `1.`), com continuação indentada.
    const item = l.match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
    if (item) {
      fecharParagrafo();
      const ordenada = /\d/.test(item[2]);
      const itens = [];
      while (i < linhas.length) {
        const m = linhas[i].match(/^(\s*)([-*]|\d+\.)\s+(.*)$/);
        if (!m) {
          // continuação: linha indentada logo abaixo de um item
          if (itens.length && /^\s+\S/.test(linhas[i]) && linhas[i].trim()) {
            itens[itens.length - 1] += ' ' + linhas[i].trim();
            i++;
            continue;
          }
          break;
        }
        itens.push(m[3]);
        i++;
      }
      const tag = ordenada ? 'ol' : 'ul';
      out.push(`<${tag}>${itens.map((t) => `<li>${inline(escapar(t))}</li>`).join('')}</${tag}>`);
      continue;
    }

    paragrafo.push(l.trim());
    i++;
  }
  fecharParagrafo();
  return out.join('\n');
}

// ─────────────────────────────── Imagens ───────────────────────────────

/** Reamostra cada imagem para 2× a largura com que ela aparece e devolve o
 *  mapa `src original → arquivo temporário`. Pixel art usa `nearest`. */
async function reamostrar(md) {
  await rm(TMP, { recursive: true, force: true });
  await mkdir(TMP, { recursive: true });

  const escapado = PREFIXO.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const refs = [...md.matchAll(new RegExp(`<img\\s+src="${escapado}([^"]+)"[^>]*?width="(\\d+)"`, 'g'))];
  const maior = new Map();
  for (const [, rel, w] of refs) {
    maior.set(rel, Math.max(maior.get(rel) ?? 0, Number(w)));
  }

  const mapa = new Map();
  let antes = 0;
  let depois = 0;
  for (const [rel, largura] of maior) {
    const origem = path.join(RAIZ, rel);
    const img = sharp(origem);
    const meta = await img.metadata();
    const alvo = Math.min(meta.width, largura * 2);
    const nome = createHash('sha1').update(rel).digest('hex').slice(0, 12) + '.png';
    const destino = path.join(TMP, nome);
    await img
      .resize({ width: alvo, kernel: 'nearest', withoutEnlargement: true })
      .png({ compressionLevel: 9, palette: true })
      .toFile(destino);
    const [a, d] = await Promise.all([
      sharp(origem).metadata().then(() => import('node:fs/promises').then((f) => f.stat(origem))),
      import('node:fs/promises').then((f) => f.stat(destino)),
    ]);
    antes += a.size;
    depois += d.size;
    mapa.set(rel, pathToFileURL(destino).href);
  }
  console.log(
    `imagens: ${mapa.size} únicas — ${(antes / 1e6).toFixed(1)} MB → ${(depois / 1e6).toFixed(1)} MB`
  );
  return mapa;
}

// ─────────────────────────────── Página ───────────────────────────────

/** Tokens de `[data-theme="dark"]` em `src/index.css` — a mesma paleta do app:
 *  fundo verde-petróleo, tinta clara, turquesa da fagulha, cobre. */
const CSS = `
@font-face { font-family: 'Fredoka'; font-weight: 300 700; src: url('FONT_FREDOKA') format('woff2'); }
@font-face { font-family: 'Rubik';   font-weight: 300 700; src: url('FONT_RUBIK')   format('woff2'); }
@font-face { font-family: 'Silkscreen'; font-weight: 400;  src: url('FONT_PIXEL')   format('woff2'); }

:root {
  --bg: #0e2323; --surface: #173a37; --ink: #eaf5f2; --muted: #8fb0a8;
  --line: #1f3733; --primary: #2dd4bf; --gold: #d99a5b;
}
@page { size: 390px 844px; margin: 0; }
* { box-sizing: border-box; }
body {
  margin: 0; padding: 26px 20px 30px; background: var(--bg); color: var(--ink);
  font-family: 'Rubik', system-ui, sans-serif; font-size: 12.5px; line-height: 1.62;
  -webkit-font-smoothing: antialiased;
}
/* Nada estoura a largura do telefone: é a regra que faz "mobile first" ser
   verdade em vez de intenção. */
img, table, pre { max-width: 100%; }
img { image-rendering: pixelated; height: auto; vertical-align: middle; }

h1, h2, h3, h4 { font-family: 'Fredoka', system-ui, sans-serif; line-height: 1.25; }
h1 {
  font-family: 'Silkscreen', monospace; font-size: 19px; color: var(--primary);
  letter-spacing: .5px; margin: 0 0 14px; padding-bottom: 10px;
  border-bottom: 2px solid var(--gold); break-before: page;
}
h1:first-of-type { break-before: avoid; }
h2 {
  font-size: 16.5px; color: var(--primary); margin: 26px 0 10px;
  padding-bottom: 5px; border-bottom: 1px solid var(--line); break-after: avoid;
}
h3 { font-size: 13.5px; color: var(--gold); margin: 18px 0 6px; break-after: avoid; }
p { margin: 0 0 10px; }
a { color: var(--primary); text-decoration: none; }
strong { color: #fff; font-weight: 600; }
code {
  font-family: ui-monospace, monospace; font-size: .88em; color: var(--primary);
  background: rgba(45,212,191,.12); padding: 1px 4px; border-radius: 3px;
}
hr { border: 0; border-top: 1px solid var(--line); margin: 20px 0; }
ul, ol { margin: 0 0 10px; padding-left: 20px; }
li { margin-bottom: 5px; }
blockquote {
  margin: 12px 0; padding: 9px 12px; border-left: 3px solid var(--gold);
  background: rgba(217,154,91,.07); color: var(--muted); font-size: 11.5px;
}
blockquote p:last-child { margin-bottom: 0; }

/* Tabela: no telefone não há espaço para borda em tudo, então a leitura é por
   linha (régua horizontal) e não por grade. */
table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 11px; }
th {
  text-align: left; color: var(--gold); font-weight: 600; font-size: 10px;
  text-transform: uppercase; letter-spacing: .4px;
  border-bottom: 1px solid var(--gold); padding: 5px 6px 5px 0;
}
td { padding: 6px 6px 6px 0; border-bottom: 1px solid var(--line); vertical-align: middle; }
td:last-child, th:last-child { padding-right: 0; }
tr { break-inside: avoid; }
td img { display: block; }

/* Figura: nunca partida entre duas páginas — meia ilustração não ilustra. */
p[align="center"] { margin: 14px 0 6px; break-inside: avoid; }
p[align="center"] + p[align="center"] { margin-top: 0; }
p[align="center"] sub { color: var(--muted); font-size: 9.5px; line-height: 1.4; display: block; }

/* A fileira NÃO pode quebrar em várias linhas, e é aqui que mobile deixa de
   ser um detalhe de CSS: a escada de cinco formas tem ~630 px de arte para
   350 px de tela, então no telefone ela caía em 2+2+1 — e uma sequência
   partida em três linhas deixa de ser sequência. O flex-shrink encolhe as
   cinco na MESMA proporção, o que preserva as larguras relativas (que foram
   ajustadas uma a uma no .md justamente para o quarto degrau parecer maior
   que o terceiro). O min-width zero e o que autoriza o encolhimento. */
p[align="center"]:has(img) {
  display: flex; flex-wrap: nowrap; gap: 6px;
  justify-content: center; align-items: flex-end;
}
p[align="center"]:has(img) img { flex: 0 1 auto; min-width: 0; }

/* A marca é opaca e quase preta; sem o raio ela lê como retângulo perdido no
   fundo em vez de emblema. */
p[align="center"] img[alt*="marca" i], p[align="center"] img[alt*="mark" i] { border-radius: 12px; }
`;

async function fonteDataUrl(rel, tipo = 'woff2') {
  const b = await readFile(path.join(RAIZ, rel));
  return `data:font/${tipo};base64,${b.toString('base64')}`;
}

async function main() {
  const md = await readFile(MD, 'utf8');
  const mapa = await reamostrar(md);

  let corpo = md;
  for (const [rel, url] of mapa) {
    corpo = corpo.split(`"${PREFIXO}${rel}"`).join(`"${url}"`);
  }

  const css = CSS
    .replace('FONT_FREDOKA', await fonteDataUrl('public/fonts/fredoka-latin.woff2'))
    .replace('FONT_RUBIK', await fonteDataUrl('public/fonts/rubik-latin.woff2'))
    .replace('FONT_PIXEL', await fonteDataUrl('node_modules/@fontsource/silkscreen/files/silkscreen-latin-400-normal.woff2'));

  const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>Soulmon — o livrinho da Malha</title><style>${css}</style></head>
<body>${markdownParaHtml(corpo)}</body></html>`;

  const htmlPath = path.join(TMP, 'booklet.html');
  await writeFile(htmlPath, html);

  // O sandbox de dev não tem `playwright` no projeto; o Chromium e o pacote
  // vivem fora dele (footgun 7 do CLAUDE.md). Tenta o normal primeiro.
  let chromium;
  let executablePath;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    const mod = await import('/opt/node22/lib/node_modules/playwright/index.js');
    chromium = (mod.default ?? mod).chromium;
    executablePath = '/opt/pw-browsers/chromium';
  }

  const navegador = await chromium.launch(executablePath ? { executablePath } : {});
  const pagina = await navegador.newPage();
  await pagina.goto(pathToFileURL(htmlPath).href, { waitUntil: 'load' });
  await pagina.evaluate(() => document.fonts.ready);
  await pagina.pdf({ path: PDF, ...PAGINA, printBackground: true });
  await navegador.close();

  // `BOOKLET_KEEP=1` guarda o HTML intermediário em `.booklet-pdf-tmp/` — é
  // como se confere o layout sem PDF viewer no sandbox (screenshot a 390 px).
  if (!process.env.BOOKLET_KEEP) await rm(TMP, { recursive: true, force: true });

  const { size } = await (await import('node:fs/promises')).stat(PDF);
  console.log(`PDF: ${path.relative(RAIZ, PDF)} — ${(size / 1e6).toFixed(1)} MB, página ${PAGINA.width}×${PAGINA.height}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
