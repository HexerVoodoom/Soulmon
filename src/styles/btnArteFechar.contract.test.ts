/** Grupo C (fase 4): os botões de fechar ✕ levam `sm2-fechar` (normal/pressed/disabled) só sob `html[data-ui="arte"]`; ✕ de busca fica de fora; glifo e aria-label seguem no DOM. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rd = (f: string) => readFileSync(resolve(process.cwd(), f), 'utf8');
const css = rd('src/index.css');
const ini = css.indexOf('Grupo C (fase 4)');
const bloco = css.slice(css.indexOf('*/', ini) + 2, css.indexOf('Drop-down de categoria do CreateModal'));

describe('arte no fechar', () => {
  it('3 variáveis de arte num lugar só; todas as regras sob html[data-ui="arte"]; sem display:none', () => {
    for (const v of ['fechar', 'fechar-press', 'fechar-disabled']) expect(bloco).toContain(`ui/sm2/sm2-${v}.webp`);
    expect(bloco.match(/url\(/g)).toHaveLength(3);
    for (const l of bloco.split('\n').filter(x => /^[^\s}]/.test(x) && !x.startsWith('/*') && !x.startsWith('   '))) expect(l.startsWith('html[data-ui="arte"]')).toBe(true);
    expect(bloco).not.toMatch(/display: none/);
    expect(bloco).toContain(':disabled');
    expect(bloco).toContain('> *');
  });
  it('só botões de ação fechar: popup, BackArrow close e [data-fechar]; nenhum seletor de busca', () => {
    expect(bloco).toContain('.sm2-popup-fechar');
    expect(bloco).toContain('.sm2-ora-back');
    expect(bloco).toContain('[data-fechar]');
    expect(bloco).not.toMatch(/busca|search/i);
    expect(rd('src/components/ritual/RitualKit.tsx')).toContain('data-fechar');
    expect(rd('src/components/form/FormKit.tsx')).toContain('data-fechar');
    expect(rd('src/components/ritual/RitualKit.tsx')).toContain('aria-label={label}');
  });
});
