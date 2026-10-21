import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** QA L11-05: na demo o selo "DEMO" (fixo, z 60) cobria o nome do NPC da folha do Restaurante. Some enquanto há folha/diálogo aberto. */
describe('selo DEMO some sobre folhas e diálogos', () => {
  const css = readFileSync(new URL('./index.css', import.meta.url), 'utf8');
  it('regra :has para a folha de lote e para aria-modal', () => {
    expect(css).toContain('body:has([data-area-sheet-backdrop], [aria-modal="true"]) .sm-demo-seal { opacity: 0; }');
  });
  it('o selo continua sem capturar toque', () => {
    const i = css.indexOf('.sm-demo-seal {');
    expect(css.slice(i, i + 600)).toContain('pointer-events: none');
  });
});
