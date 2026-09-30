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

  it('description == <meta name="description"> do index.html (EN)', () => {
    const meta = /<meta name="description" content="([^"]+)"/.exec(html)?.[1];
    expect(meta).toBeDefined();
    expect(m.description).toBe(meta);
  });

  /**
   * Decisão do dono **#70** (22/09/2026): existe UMA tagline, e ela é
   * "Ela cresce com o seu dia." / "It grows with your day.". Antes havia três
   * frases de abertura diferentes — `meta description`, `og:description` e a
   * ficha da Play cada uma com a sua. A frase de apoio pode variar por
   * superfície (limite de caracteres da loja); a **tagline** não.
   * Canonizada também em `docs/PLAY-FICHA.md` §0b.
   */
  const TAGLINE_PT = 'Grows with your day.';

  it('#70 — `meta description`, `og:description` e o manifesto abrem com a tagline ÚNICA', () => {
    const meta = /<meta name="description" content="([^"]+)"/.exec(html)?.[1];
    const og = /<meta property="og:description" content="([^"]+)"/.exec(html)?.[1];
    expect(og, 'og:description existe — é o que aparece quando o link é colado').toBeDefined();
    for (const [onde, texto] of [['meta description', meta], ['og:description', og], ['manifest.description', m.description]] as const) {
      expect(texto!.startsWith(TAGLINE_PT), `${onde} deveria começar com "${TAGLINE_PT}", e começa com "${texto!.slice(0, 40)}…"`).toBe(true);
    }
  });

  it('#70 — a tagline também está na ficha da Play, para as três não divergirem de novo', () => {
    const ficha = read('docs/PLAY-FICHA.md');
    expect(ficha).toContain(TAGLINE_PT);
    expect(ficha, 'a versão EN da tagline mora na mesma seção').toContain('It grows with your day.');
  });

  it('theme_color == --sm-primary do index.css == <meta theme-color> claro', () => {
    const token = /--sm-primary:\s*(#[0-9a-fA-F]{6})/.exec(css)?.[1];
    expect(token).toBeDefined();
    expect(m.theme_color.toLowerCase()).toBe(token!.toLowerCase());
    const metaLight = /<meta name="theme-color" media="\(prefers-color-scheme: light\)" content="(#[0-9a-fA-F]{6})"/.exec(html)?.[1];
    expect(metaLight?.toLowerCase()).toBe(token!.toLowerCase());
  });

  it('lang do manifesto é en, como a description', () => {
    expect(m.lang).toBe('en');
  });
});
