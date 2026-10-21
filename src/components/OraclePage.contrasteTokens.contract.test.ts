import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * QA L09-02: `#9ca3af` (2,54:1 sobre branco) e `#b45309` (2,46:1 sobre o escuro) em texto de 10–11 px, bem no aviso
 * "teste NÃO validado" e nos avisos de validade. Cor de TEXTO vem dos tokens do tema, que têm par claro/escuro verificado.
 */
describe('OraclePage — texto sem hex fixo de baixo contraste', () => {
  const src = readFileSync(new URL('./OraclePage.tsx', import.meta.url), 'utf8');
  it('os dois hex reprovados saíram', () => {
    expect(src).not.toContain("color: '#9ca3af'");
    expect(src).not.toContain("color: '#b45309'");
  });
  it('o aviso usa --sm2-muted e os avisos de validade --sm2-gold-ink', () => {
    expect(src).toContain("color: 'var(--sm2-muted)'");
    expect(src).toContain("color: 'var(--sm2-gold-ink)'");
  });
});
