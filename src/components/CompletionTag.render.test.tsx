// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CompletionTag } from './CompletionTag';

afterEach(cleanup);
describe('CompletionTag (tag única de feito + ganho + desfazer, rodapé)', () => {
  it('é role=status, mostra feito, o ganho exato e desfaz no próprio botão (PT)', () => {
    const onUndo = vi.fn();
    const { container } = render(
      <CompletionTag language="pt-BR" name="Ler" items={[{ kind: 'xp', amount: 12 }, { kind: 'bits', amount: 5 }]} onUndo={onUndo} />,
    );
    const tag = screen.getByRole('status');
    expect(tag.textContent).toContain('Ler · feito');
    expect(tag.textContent).toContain('+12');
    expect(tag.textContent).toContain('+5');
    expect(container.querySelector('[data-reward-preview-row="after"]')).not.toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Desfazer a conclusão de Ler' }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });
  it('EN e sem emoji; sem ganho não desenha a linha de recompensa', () => {
    const { container } = render(<CompletionTag language="en-US" name="Read" items={[]} onUndo={() => {}} />);
    expect(screen.getByRole('status').textContent).toContain('Read · done');
    expect(container.querySelector('[data-reward-preview-row]')).toBeNull();
    expect(/\p{Extended_Pictographic}/u.test(container.textContent ?? '')).toBe(false);
  });
});
