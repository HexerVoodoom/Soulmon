/**
 * AS PÁGINAS /gm/* NÃO PODEM DEPENDER DO `assets` DO WRANGLER (10/11/2026)
 * ======================================================================
 * `assets.not_found_handling = "single-page-application"` responde o `index.html` a toda NAVEGAÇÃO antes do Worker, então as
 * Functions `functions/gm/*.js` nunca eram alcançadas pelo navegador. Tentar `run_worker_first` derrubou `/api/*` em
 * 09/11/2026 (revertido). A saída segura é gerar as páginas como arquivos estáticos em `dist/gm/` (`scripts/build-gm-pages.mjs`):
 * asset existente é servido ANTES do fallback SPA, sem tocar em `assets`.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
// @ts-ignore módulo .mjs sem tipos
import { PAGINAS, lerVars, gerarPagina, blocoHeaders, hashScript } from '../../scripts/build-gm-pages.mjs';

const RAIZ = resolve(__dirname, '../..');
const wrangler = readFileSync(resolve(RAIZ, 'wrangler.jsonc'), 'utf8');

describe('wrangler.jsonc: assets intocado', () => {
  it('NÃO usa run_worker_first (derrubou /api em 09/11/2026)', () => {
    const semComentarios = wrangler.split('\n').filter((l) => !l.trim().startsWith('//')).join('\n');
    expect(semComentarios).not.toMatch(/run_worker_first/);
  });
  it('o fallback SPA segue como estava', () => {
    expect(wrangler).toMatch(/"not_found_handling":\s*"single-page-application"/);
  });
});

describe('páginas /gm/* estáticas', () => {
  const vars = lerVars(wrangler);
  it('lê a config pública do Firebase do wrangler.jsonc', () => {
    expect(vars.FIREBASE_API_KEY).toMatch(/^AIza/);
    expect(vars.FIREBASE_AUTH_DOMAIN).toMatch(/firebaseapp\.com$/);
    expect(vars.FIREBASE_PROJECT_ID).toBe('soulmon-app');
  });
  it('cobre as quatro páginas que existem em functions/gm', () => {
    expect([...PAGINAS].sort()).toEqual(['carta', 'reviews', 'rift', 'soulmons']);
  });
  for (const nome of ['soulmons', 'rift', 'carta', 'reviews']) {
    it(`/gm/${nome}: sem nonce, CSP por hash de cada script inline, config embutida`, async () => {
      const { html, csp } = await gerarPagina(nome, RAIZ, vars);
      expect(html).not.toMatch(/nonce=/);
      expect(csp).not.toMatch(/nonce-/);
      expect(html).toContain(vars.FIREBASE_API_KEY);
      const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
      expect(inline.length).toBeGreaterThan(0);
      for (const corpo of inline) expect(csp).toContain(hashScript(corpo));
      expect(csp).toContain("frame-ancestors 'none'");
      const bloco = blocoHeaders(nome, csp);
      expect(bloco).toContain(`\n/gm/${nome}\n`);
      expect(bloco).toContain('! Content-Security-Policy');
      expect(bloco).not.toContain('\n/api');
      // `dist/` é COMMITADO: o arquivo e o bloco de cabeçalhos têm que estar em dia com a Function (fonte do HTML).
      expect(readFileSync(resolve(RAIZ, `dist/gm/${nome}.html`), 'utf8')).toBe(html);
      expect(readFileSync(resolve(RAIZ, 'dist/_headers'), 'utf8')).toContain(bloco);
    });
  }
});
