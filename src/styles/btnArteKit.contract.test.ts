/** Grupo A (fase 4): `.sm2-kit-btn-primary|outline` (md/lg) levam a arte 9-slice só sob `html[data-ui="arte"]`; `-sm` (chip), ghost e quiet ficam sem. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8');

describe('arte nos botões por classe (.sm2-kit-btn)', () => {
  it('primary e outline têm normal/pressed/disabled sob html[data-ui="arte"], sempre excluindo o chip -sm', () => {
    for (const k of ['primary', 'outline']) {
      for (const [estado, arq] of [['', 'normal'], [':active:not(:disabled)', 'pressed'], [':disabled', 'disabled']] as const) {
        expect(css).toContain(`html[data-ui="arte"] .sm2-kit-btn-${k}:not(.sm2-kit-btn-sm)${estado} { --arte: url('./assets/soulmon/ui/sm2/sm2-${k}-${arq}.webp'); }`);
      }
    }
  });
  it('ghost, quiet e -sm não ganham arte; a geometria do 9-slice vem de variáveis num lugar só', () => {
    expect(css).not.toMatch(/\.sm2-kit-btn-(ghost|quiet)[^{]*\{[^}]*--arte/);
    expect(css).toMatch(/html\[data-ui="arte"\] \{[^}]*--sm2-btn-slice: 62;[^}]*--sm2-btn-art-h: 169;/);
    const bloco = css.slice(css.indexOf('Grupo A (fase 4)'), css.indexOf('Drop-down de categoria do CreateModal'));
    expect(bloco).toContain('var(--sm2-btn-slice)');
  });
  it('toda regra do bloco está sob html[data-ui="arte"]', () => {
    const bloco = css.slice(css.indexOf('Grupo A (fase 4)'), css.indexOf('Drop-down de categoria do CreateModal'));
    const linhas = bloco.split('\n').filter(l => /^\S.*[,{]\s*$/.test(l) && !l.startsWith('/*'));
    for (const l of linhas) expect(l.startsWith('html[data-ui="arte"]')).toBe(true);
  });
});
