// @vitest-environment jsdom
/** Nova tarefa e Novo hábito: MESMA moldura dono e MESMO fundo vazio (turquesa liso, sem pedra/runas/lote). */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { CreateModal } from './CreateModal';
import { renderWithCss, loadAppCss } from '../test/renderEnv';

afterEach(cleanup);

describe.each(['task', 'habit'] as const)('CreateModal %s: moldura dono + fundo vazio', (kind) => {
  it('mesma classe dono, classe vazio presente, sem textura nem --sm2-moldura-fundo url', () => {
    const { container } = renderWithCss(
      <CreateModal isOpen initialKind={kind} onClose={() => {}} onSaveTask={vi.fn()} onSaveActivity={vi.fn()} language="pt-BR" />,
    );
    const m = container.querySelector('[data-moldura-modal]') as HTMLElement;
    expect(m).toBeTruthy();
    expect(m.className).toContain('sm2-moldura-modal--dono');
    expect(m.className).toContain('sm2-moldura-modal--vazio');
    expect(m.className).not.toContain('sm2-moldura-modal--pedra');
    expect(m.getAttribute('data-moldura-fundo')).toBe('vazio');
    expect(m.style.getPropertyValue('--sm2-moldura-fundo')).toBe('none');
    expect(m.style.getPropertyValue('--sm2-moldura-fundo')).not.toMatch(/url\(/);
    expect(m.querySelector('.sm2-moldura-modal__titulo')?.textContent).toBe(kind === 'task' ? 'Nova tarefa' : 'Novo hábito');
  });
});

it('CSS: .sm2-moldura-modal--vazio pinta turquesa liso opaco, sem imagem', () => {
  const css = loadAppCss();
  const i = css.indexOf('.sm2-moldura-modal--vazio .sm2-moldura-modal__fundo {');
  expect(i).toBeGreaterThan(0);
  const regra = css.slice(css.indexOf('{', i) + 1, css.indexOf('}', i));
  expect(regra).toMatch(/background-image:\s*none/);
  expect(regra).toMatch(/background-color:\s*var\(--sm2-viewport-bg/);
  expect(regra).toMatch(/opacity:\s*1/);
});
