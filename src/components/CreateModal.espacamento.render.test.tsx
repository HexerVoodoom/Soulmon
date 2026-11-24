// @vitest-environment jsdom
/** PR (i): espaçamento do Nova tarefa/Novo hábito, só em tokens `--sm2-space-*`, igual em 360/375/412 px. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { CreateModal } from './CreateModal';
import { renderWithCss, loadAppCss } from '../test/renderEnv';

afterEach(cleanup);

function regra(css: string, seletor: string): string {
  const ini = css.indexOf(`
${seletor} {`);
  if (ini < 0) throw new Error(`regra ausente: ${seletor}`);
  const abre = css.indexOf('{', ini);
  return css.slice(abre + 1, css.indexOf('}', abre));
}

describe.each([360, 375, 412])('Nova tarefa, espaçamento a %i px', (largura) => {
  it('corpo único com topo/rodapé/gap em tokens; chips e energias afastados', () => {
    Object.defineProperty(window, 'innerWidth', { value: largura, configurable: true });
    const { container } = renderWithCss(
      <CreateModal isOpen initialKind="habit" onClose={() => {}} onSaveTask={vi.fn()} onSaveActivity={vi.fn()} language="pt-BR" />,
    );
    const css = loadAppCss();
    const corpo = container.querySelector('.sm2-nova-corpo');
    expect(corpo).toBeTruthy();
    expect(container.querySelector('.sm2-nova-corpo .sm2-nova-form')).toBeTruthy();
    expect(container.querySelector('.sm2-nova-form .sm2-nova-cat [data-testid="category-points"]')).toBeTruthy();

    const c = regra(css, '.sm2-nova-corpo');
    expect(c).toMatch(/padding-top:\s*var\(--sm2-space-5\)/);
    // rodapé fixo (16 + 44 + 16 + safe-area) + folga >= altura do rodapé
    expect(c).toMatch(/--sm2-nova-rodape:\s*calc\(var\(--sm2-space-4\) \+ 44px \+ var\(--sm2-space-4\) \+ env\(safe-area-inset-bottom/);
    expect(c).toMatch(/padding-bottom:\s*calc\(var\(--sm2-nova-rodape\) \+ var\(--sm2-space-4\)\)/);
    expect(c).toMatch(/gap:\s*var\(--sm2-space-4\)/);
    expect(regra(css, '.sm2-nova-form')).toMatch(/gap:\s*var\(--sm2-space-4\)/);
    expect(regra(css, '.sm2-nova-form')).not.toMatch(/margin-top:\s*[1-9]/);
    expect(regra(css, '.sm2-nova-cat [data-testid="category-points"]')).toMatch(/margin-top:\s*var\(--sm2-space-3\)/);

    // nenhuma regra de largura reabre esses valores
    expect(css).not.toMatch(/@media[^{]*\{\s*\.sm2-nova-/);
    // sem valor solto: todo espaço das 4 regras vem de token
    for (const sel of ['.sm2-nova-form', '.sm2-nova-cat', '.sm2-nova-cat [data-testid="category-points"]']) {
      expect(regra(css, sel)).not.toMatch(/(?:gap|margin|padding)[a-z-]*:\s*\d+px/);
    }
  });
});
