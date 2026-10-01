/**
 * O OVERLAY COPIA OS TOKENS — e a cópia tem régua.
 *
 * `desktop/renderer/src/tokens.css` repete os hex do bloco `--sm2-*` de
 * `src/index.css` porque o renderer do desktop não carrega o CSS do app (outro
 * bundle, outro processo). Cópia é o footgun 9 do CLAUDE.md: a segunda cópia
 * diverge em silêncio — o overlay carregou a paleta ROXA do DigiApp por mais de
 * um mês depois de o app ter virado verde-água, e nada ficou vermelho.
 *
 * Este teste compara token a token, nos DOIS temas. Mudou no `index.css`,
 * aponta aqui. O precedente é `cloudSync.test.ts` (o `saveId`) e
 * `brandFlame.parity.test.ts` (a chama).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('../..', import.meta.url));
const ler = (p: string) => readFileSync(new URL(p, `file:///${RAIZ.replace(/\\/g, '/')}`), 'utf8').replace(/\r\n/g, '\n');

/** `--sm2-x: valor;` dentro de um bloco de CSS → { x: valor } (sem comentários). */
function tokens(bloco: string): Record<string, string> {
  const semComentarios = bloco.replace(/\/\*[\s\S]*?\*\//g, '');
  const out: Record<string, string> = {};
  for (const m of semComentarios.matchAll(/--sm2-([a-z0-9-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const semComentarios = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/** O corpo do primeiro bloco cujo seletor casa com `seletor` E declara `--sm2-bg`
 *  (o index.css tem outros blocos `[data-theme="dark"]` antes dos tokens). */
function bloco(css: string, seletor: RegExp): string {
  const re = new RegExp(`${seletor.source}\\s*\\{([^}]*)\\}`, 'g');
  for (const m of semComentarios(css).matchAll(re)) if (m[1].includes('--sm2-bg:')) return m[1];
  throw new Error(`bloco de tokens ${seletor} não encontrado`);
}

const app = ler('src/index.css');
const overlay = ler('desktop/renderer/src/tokens.css');

// No app o escuro é `[data-theme="dark"]` e o claro é `:root, [data-theme="light"]`;
// no overlay o escuro é o `:root` e o claro vive em `@media (prefers-color-scheme: light)`.
const appEscuro = tokens(bloco(app, /\[data-theme="dark"\]/));
const appClaro = tokens(bloco(app, /:root, \[data-theme="light"\]/));
const overlayEscuro = tokens(bloco(overlay, /\n:root/));
const overlayClaro = tokens(bloco(overlay.slice(overlay.indexOf('@media (prefers-color-scheme: light)')), /:root/));

describe('paridade dos tokens do overlay com o index.css', () => {
  it('o overlay declara tokens de cor nos dois temas', () => {
    expect(Object.keys(overlayEscuro).length).toBeGreaterThan(10);
    expect(Object.keys(overlayClaro).length).toBeGreaterThan(10);
    expect(Object.keys(overlayEscuro).sort()).toEqual(Object.keys(overlayClaro).sort());
  });

  it('todo token de cor do overlay tem o MESMO valor do app — tema escuro', () => {
    for (const [nome, valor] of Object.entries(overlayEscuro)) {
      if (nome === 'icon-grad') continue; // métrica, declarada à parte no app
      expect(appEscuro[nome], `--sm2-${nome} não existe no [data-theme="dark"] do index.css`).toBeDefined();
      expect(valor.toUpperCase(), `--sm2-${nome} (escuro)`).toBe(appEscuro[nome].toUpperCase());
    }
  });

  it('todo token de cor do overlay tem o MESMO valor do app — tema claro', () => {
    for (const [nome, valor] of Object.entries(overlayClaro)) {
      if (nome === 'icon-grad') continue;
      expect(appClaro[nome], `--sm2-${nome} não existe no bloco claro do index.css`).toBeDefined();
      expect(valor.toUpperCase(), `--sm2-${nome} (claro)`).toBe(appClaro[nome].toUpperCase());
    }
  });

  it('o GRAD do ícone acompanha o tema (−25 no escuro, 0 no claro)', () => {
    expect(overlayEscuro['icon-grad']).toBe('-25');
    expect(overlayClaro['icon-grad']).toBe('0');
  });

  it('a paleta roxa do DigiApp saiu do overlay (era `--sm-primary:#6d5bd0`)', () => {
    for (const arquivo of ['desktop/renderer/src/style.css', 'desktop/renderer/src/menu.css']) {
      const css = semComentarios(ler(arquivo));
      expect(css, arquivo).not.toMatch(/#6d5bd0|#f7f6fb|#3a5ba0|--sm-primary|--accent/i);
      // Nada de alfa para "dormindo" nem cor de perigo: o overlay esmaece por filtro.
      expect(css, arquivo).not.toMatch(/opacity\s*:\s*0?\.\d/);
      expect(css, arquivo).not.toMatch(/--danger/);
    }
  });

  it('as três fontes entram no build do desktop (X8)', () => {
    for (const fonte of ['cinzel-latin.woff2', 'rubik-latin.woff2', 'material-symbols-rounded.woff2']) {
      expect(overlay).toContain(`public/fonts/${fonte}`);
    }
  });
});
