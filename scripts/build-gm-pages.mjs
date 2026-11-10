// Gera as páginas do GM (`/gm/soulmons`, `/gm/rift`, `/gm/carta`, `/gm/reviews`) como ARQUIVOS ESTÁTICOS em `dist/gm/*.html`.
//
// Por quê: o `assets.not_found_handling = "single-page-application"` do wrangler.jsonc responde o `index.html` a toda NAVEGAÇÃO
// antes do Worker, então a Function `functions/gm/*.js` nunca era alcançada pelo navegador (só por `curl`). Tentar `run_worker_first`
// derrubou `/api/*` em 09/11/2026 (revertido). Arquivo estático em `dist/` é servido ANTES do fallback SPA, sem tocar em
// `assets`/`run_worker_first` — `/api/*` nem entra nessa conta.
//
// A fonte do HTML continua sendo a Function (`onRequestGet`). Como página estática não tem nonce por requisição, os `<script>` inline
// passam a ser autorizados por HASH sha256 na CSP, escrita em `dist/_headers` (bloco `/gm/*`, com `!` para destacar a CSP global).
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const MARCA = '# >>> gm-pages (gerado por scripts/build-gm-pages.mjs; não editar)';
export const PAGINAS = ['soulmons', 'rift', 'carta', 'reviews'];

/** Lê as três chaves PÚBLICAS do Firebase do `vars` do wrangler.jsonc (texto, sem depender de parser JSONC). */
export function lerVars(textoWrangler) {
  const pega = (k) => (textoWrangler.match(new RegExp(`"${k}"[ \\t]*:[ \\t]*"([^"]*)"`)) || [])[1] || '';
  return { FIREBASE_API_KEY: pega('FIREBASE_API_KEY'), FIREBASE_AUTH_DOMAIN: pega('FIREBASE_AUTH_DOMAIN'), FIREBASE_PROJECT_ID: pega('FIREBASE_PROJECT_ID') };
}

/** Hash CSP de um script inline (o navegador normaliza CRLF -> LF antes de hashear). */
export function hashScript(corpo) {
  return `'sha256-${createHash('sha256').update(corpo.replace(/\r\n/g, '\n'), 'utf8').digest('base64')}'`;
}

/** Tira o nonce do HTML e devolve `{ html, hashes }` dos scripts inline. */
export function tornarEstatico(htmlComNonce, nonce) {
  const html = htmlComNonce.split(` nonce="${nonce}"`).join('');
  const hashes = [];
  const re = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html))) hashes.push(hashScript(m[1]));
  return { html, hashes };
}

export async function gerarPagina(nome, raiz, vars) {
  const mod = await import(pathToFileURL(resolve(raiz, `functions/gm/${nome}.js`)).href);
  const res = await mod.onRequestGet({ env: vars });
  const bruto = await res.text();
  const csp = res.headers.get('Content-Security-Policy');
  const nonce = (csp.match(/'nonce-([^']+)'/) || [])[1];
  const { html, hashes } = tornarEstatico(bruto, nonce);
  return { html, csp: csp.replace(`'nonce-${nonce}'`, hashes.join(' ')) };
}

/** Bloco do `_headers` de UMA página (`!` destaca os cabeçalhos globais de `/*`, que são aditivos). */
export function blocoHeaders(nome, csp) {
  return [
    '', `# /gm/${nome} — página do GM estática (scripts/build-gm-pages.mjs); CSP por hash, sem nonce.`,
    `/gm/${nome}`, '  ! X-Frame-Options', '  ! X-Content-Type-Options', '  ! Content-Security-Policy',
    '  X-Frame-Options: DENY', '  X-Content-Type-Options: nosniff', '  X-Robots-Tag: noindex',
    '  Cache-Control: no-store', `  Content-Security-Policy: ${csp}`, '',
  ].join('\n');
}

async function main() {
  const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const dist = resolve(raiz, 'dist');
  const vars = lerVars(readFileSync(resolve(raiz, 'wrangler.jsonc'), 'utf8'));
  if (!vars.FIREBASE_API_KEY) throw new Error('FIREBASE_API_KEY ausente em wrangler.jsonc');
  mkdirSync(resolve(dist, 'gm'), { recursive: true });
  let headers = existsSync(resolve(dist, '_headers')) ? readFileSync(resolve(dist, '_headers'), 'utf8') : '';
  // idempotente: `dist/` é commitado e o script roda de novo a cada build — descarta o bloco da rodada anterior.
  const i = headers.indexOf(MARCA);
  if (i >= 0) headers = headers.slice(0, i);
  headers = headers.trimEnd() + String.fromCharCode(10) + MARCA + String.fromCharCode(10);
  for (const nome of PAGINAS) {
    const r = await gerarPagina(nome, raiz, vars);
    writeFileSync(resolve(dist, 'gm', `${nome}.html`), r.html);
    headers += blocoHeaders(nome, r.csp);
  }
  writeFileSync(resolve(dist, '_headers'), headers);
  console.log(`[gm] ${PAGINAS.length} páginas estáticas em dist/gm`);
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) main();
