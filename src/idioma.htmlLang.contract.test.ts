import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** QA L09-01: `index.html` nasce `lang="en"`; o app em pt-BR tem que trocar. */
describe('<html lang> acompanha o idioma do app', () => {
  const src = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  it("App.tsx escreve document.documentElement.lang a partir de 'language'", () => {
    expect(src).toMatch(/document\.documentElement\.lang\s*=\s*language === 'pt-BR' \? 'pt-BR' : 'en'/);
  });
});
