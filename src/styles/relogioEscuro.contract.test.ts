import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');

describe('indicador do relógio (input type=time) nos dois temas', () => {
  it('claro por padrão e color-scheme dark sob [data-theme="dark"]', () => {
    expect(css).toMatch(/input\[type="time"\]\s*\{\s*color-scheme:\s*light;\s*\}/);
    expect(css).toMatch(/\[data-theme="dark"\]\s+input\[type="time"\]\s*\{\s*color-scheme:\s*dark;\s*\}/);
  });

  it('a regra fica antes do marcador de forja', () => {
    const regra = css.indexOf('[data-theme="dark"] input[type="time"]');
    expect(regra).toBeGreaterThan(0);
    expect(regra).toBeLessThan(css.indexOf('MODAL DE RESULTADO DE FORJA'));
  });
});
