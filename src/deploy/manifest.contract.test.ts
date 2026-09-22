import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * FRONTEIRA: `public/manifest.json` ↔ `index.html` ↔ tokens.
 *
 * O manifesto dizia "Soulmon - Gamified Productivity" com uma descrição em
 * inglês de outra era, enquanto o `index.html` (a fonte que o dono revisou)
 * diz outra coisa em PT (perf-a11y R1 + design, 21/09/2026). O que a pessoa
 * lê ao instalar o PWA tem que ser o mesmo texto da página; e a cor da barra
 * tem que ser o token, não um hex solto.
 */
const ROOT = path.resolve(__dirname, '../..');
const read = (p: string) => fs.readFileSync(path.join(ROOT, p), 'utf8');

describe('manifest.json', () => {
  const m = JSON.parse(read('public/manifest.json')) as Record<string, string>;
  const html = read('index.html');
  const css = read('src/index.css');

  it('name é a marca, sem slogan', () => {
    expect(m.name).toBe('Soulmon');
    expect(m.short_name).toBe('Soulmon');
  });

  it('description == <meta name="description"> do index.html (PT)', () => {
    const meta = /<meta name="description" content="([^"]+)"/.exec(html)?.[1];
    expect(meta).toBeDefined();
    expect(m.description).toBe(meta);
  });

  it('theme_color == --sm-primary do index.css == <meta theme-color> claro', () => {
    const token = /--sm-primary:\s*(#[0-9a-fA-F]{6})/.exec(css)?.[1];
    expect(token).toBeDefined();
    expect(m.theme_color.toLowerCase()).toBe(token!.toLowerCase());
    const metaLight = /<meta name="theme-color" media="\(prefers-color-scheme: light\)" content="(#[0-9a-fA-F]{6})"/.exec(html)?.[1];
    expect(metaLight?.toLowerCase()).toBe(token!.toLowerCase());
  });

  it('lang do manifesto é pt-BR, como a description', () => {
    expect(m.lang).toBe('pt-BR');
  });
});
