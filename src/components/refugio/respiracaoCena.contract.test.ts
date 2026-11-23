import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const ler = (nome: string) => readFileSync(new URL(nome, import.meta.url), 'utf8');

describe('Respiração: regressões vistas no aparelho (04/11/2026)', () => {
  it('a raiz não usa o atalho `background`: ao trocar de tela ele limpava a cor do GameRoot', () => {
    expect(ler('./RespiracaoGame.tsx')).not.toMatch(/<GameRoot style=\{\{ background:/);
  });
  it('as silhuetas SVG têm tamanho próprio: `inset: 0` não estica SVG', () => {
    expect(ler('./CenaSubaquatica.tsx')).not.toMatch(/slice" style=\{\{ \.\.\.camada/);
  });
});
