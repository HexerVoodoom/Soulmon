// @vitest-environment jsdom
/**
 * AUTOVERIFICAÇÃO do ambiente de render.
 *
 * Um guard que não prova que enxerga passa sempre — pelo motivo errado. Estes
 * casos existem para que, no dia em que o `index.css` mudar de formato, o
 * `@layer` virar outra coisa ou o jsdom parar de resolver a cascata, o
 * PRIMEIRO teste a cair seja este, e não silenciosamente todos os testes de
 * componente virarem verdes vazios.
 */
import { describe, it, expect } from 'vitest';
import { loadAppCss, unwrapLayers, installAppCss, computed } from './renderEnv';

function probe(className: string, prop: string): string {
  installAppCss();
  const el = document.createElement('div');
  el.className = className;
  document.body.appendChild(el);
  const v = computed(el, prop);
  el.remove();
  return v;
}

describe('ambiente de render — autoverificação', () => {
  it('leu o index.css de verdade (não um arquivo vazio nem um mock)', () => {
    const css = loadAppCss();
    expect(css.length).toBeGreaterThan(50_000);
    expect(css).toContain('.sm-px-check');
  });

  it('o desembrulho de @layer preserva as regras de dentro', () => {
    const out = unwrapLayers('@layer a{.x{color:red}}\n.y{color:blue}');
    expect(out).toContain('.x{color:red}');
    expect(out).toContain('.y{color:blue}');
    expect(out).not.toContain('@layer');
  });

  it('o desembrulho apaga a declaração de ordem `@layer a, b;`', () => {
    expect(unwrapLayers('@layer a, b;\n.z{color:red}')).not.toContain('@layer');
  });

  it('ENXERGA uma classe utilitária PRESENTE (`shrink-0`, dentro de @layer)', () => {
    // Sem o desembrulho isto devolvia "1" (jsdom ignora @layer) — foi medido.
    expect(probe('shrink-0', 'flex-shrink')).toBe('0');
  });

  it('ENXERGA uma classe fora de layer (`sm-px-check` = 44px de alvo)', () => {
    expect(probe('sm-px-check', 'width')).toBe('44px');
  });

  it('ENXERGA a AUSÊNCIA de `w-7`/`h-7` — as classes exatas do bug de 2px', () => {
    // `w-7`/`h-7` são Tailwind v3; o index.css v4 pré-compilado não as contém.
    // Elemento com essas classes não recebe largura nenhuma (fica em `auto`) —
    // é a causa mecânica do checkbox ter renderizado com 2px em produção.
    expect(probe('w-7 h-7', 'width')).toBe('auto');
    expect(probe('w-7 h-7', 'height')).toBe('auto');
    // e a versão que EXISTE devolve valor, provando que a diferença é a classe
    expect(probe('w-11', 'width')).not.toBe('auto');
    expect(probe('w-11', 'width')).not.toBe('');
  });

  it('ENXERGA a ausência de uma classe inventada (controle negativo)', () => {
    expect(probe('sm-classe-que-nao-existe-xyz', 'gap')).toBe('');
    // `gap-4` foi acrescentado ao index.css na rodada 1 do sweeper; se sumir de
    // novo, o espaço checkbox↔texto do TaskCard colapsa em silêncio.
    expect(probe('gap-4', 'gap')).not.toBe('');
  });
});
