import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
const bloco = (css.match(/\.sm2-moldura-modal--cristal \{\s*--sm2-cristal-canto[^}]*\}/) ?? [''])[0];

describe('popup cristal: espessura da linha por token único', () => {
  it('define --sm2-cristal-linha = 4px no bloco do cristal', () => {
    expect(bloco).toMatch(/--sm2-cristal-linha:\s*4px/);
    expect(css.match(/--sm2-cristal-linha:\s*\d/g)).toHaveLength(1);
  });
  it('a borda do ::after usa o token (sem px solto)', () => {
    const after = css.match(/\.sm2-moldura-modal--cristal::after \{[^}]*\}/)?.[0] ?? '';
    expect(after).toMatch(/border:\s*var\(--sm2-cristal-linha\) solid/);
    expect(after).toMatch(/box-shadow:[^;]*var\(--sm2-cristal-linha\)/);
  });
  it('pads e cabeça derivam do token (conteúdo >= 10 px da linha)', () => {
    expect(bloco).toMatch(/--sm2-cristal-folga:\s*calc\(var\(--sm2-cristal-linha\) \+ 10px\)/);
    expect(bloco).toMatch(/--sm2-moldura-pad-x:\s*calc\(var\(--sm2-cristal-linha\)/);
    expect(css).toMatch(/\.sm2-popup-cabeca \{[^}]*margin:\s*var\(--sm2-cristal-folga\) var\(--sm2-cristal-folga\)/);
  });
});
