// @vitest-environment jsdom
/** Arte dos botões sm2: a arte dos botões vale no app inteiro sob `html:not([data-ui="minimal"])` (CSS) e o `sm2Button` marca variante e altura no style. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import { CreateModal } from './CreateModal';
import { sm2Button } from './form/FormKit';

afterEach(cleanup);
const mk = () => render(
  <CreateModal isOpen initialKind="habit" onClose={() => {}} onSaveTask={vi.fn()} onSaveActivity={vi.fn()} language="en-US" />,
);

describe('CreateModal: arte dos botões sm2', () => {
  it('Cancel/Save trazem os marcadores de variante e altura (a arte vem do escopo global html:not([data-ui="minimal"]), sem classe no CreateModal)', () => {
    mk();
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const save = screen.getByRole('button', { name: 'Save' });
    expect(cancel.getAttribute('style')).toMatch(/--sm2-btn-kind:\s*outline/);
    expect(save.getAttribute('style')).toMatch(/--sm2-btn-kind:\s*primary/);
    expect(cancel.getAttribute('style')).toMatch(/--sm2-btn-h:\s*48px/);
  });
  it('Save desabilitado segue marcado como primary (arte disabled vem de :disabled)', () => {
    mk();
    const save = screen.getByRole('button', { name: 'Save' }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    expect(save.getAttribute('style')).toMatch(/--sm2-btn:\s*disabled/);
    expect(save.getAttribute('style')).toMatch(/--sm2-btn-kind:\s*primary/);
  });
});

describe('sm2Button: marcadores para a arte', () => {
  it('kind e altura por tamanho; danger existe; o marcador antigo --sm2-btn não muda', () => {
    const k = (s: object, key: string) => (s as Record<string, unknown>)[key];
    expect(k(sm2Button('primary', false, 'sm'), '--sm2-btn-h')).toBe('44px');
    expect(k(sm2Button('outline'), '--sm2-btn-h')).toBe('48px');
    expect(k(sm2Button('danger', false, 'lg'), '--sm2-btn-h')).toBe('56px');
    expect(k(sm2Button('danger'), '--sm2-btn-kind')).toBe('danger');
    expect(k(sm2Button('primary', true), '--sm2-btn')).toBe('disabled');
    expect(k(sm2Button('primary', true), '--sm2-btn-kind')).toBe('primary');
    expect(k(sm2Button('quiet'), '--sm2-btn')).toBe('quiet');
  });
});

describe('CreateModal: drop-down de categoria, moldura dono e ✕ de passo', () => {
  it('campo mostra a categoria atual; abre a lista com todas, seleciona e fecha', () => {
    mk();
    const campo = screen.getByRole('combobox', { name: 'Category' });
    expect(campo.getAttribute('aria-expanded')).toBe('false');
    expect(campo.textContent).toMatch(/Sleep/);
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    fireEvent.click(campo);
    expect(campo.getAttribute('aria-expanded')).toBe('true');
    const opcoes = screen.getAllByRole('option');
    expect(opcoes.length).toBe(10);
    expect(opcoes.filter(o => o.getAttribute('aria-selected') === 'true').length).toBe(1);
    expect(opcoes[0].querySelector('[data-cat-icon]')).not.toBeNull();
    fireEvent.click(screen.getByRole('option', { name: /Body/ }));
    expect(document.querySelector('[role="listbox"]')).toBeNull();
    expect(screen.getByRole('combobox', { name: 'Category' }).textContent).toMatch(/Body/);
  });
  it('teclado: seta abre e move, Enter escolhe, Esc fecha sem fechar a folha', () => {
    mk();
    const campo = screen.getByRole('combobox', { name: 'Category' });
    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    expect(campo.getAttribute('aria-expanded')).toBe('true');
    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    fireEvent.keyDown(campo, { key: 'Enter' });
    expect(campo.getAttribute('aria-expanded')).toBe('false');
    expect(campo.textContent).not.toMatch(/Sleep/);
    fireEvent.keyDown(campo, { key: 'ArrowDown' });
    fireEvent.keyDown(campo, { key: 'Escape' });
    expect(campo.getAttribute('aria-expanded')).toBe('false');
    expect(screen.getByRole('dialog')).not.toBeNull();
  });
  it('toque fora fecha a lista', () => {
    mk();
    fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));
    fireEvent.pointerDown(document.body);
    expect(document.querySelector('[role="listbox"]')).toBeNull();
  });
  it('o selecionado usa o preenchimento sólido (classe da lista); a folha usa a moldura dono', () => {
    mk();
    fireEvent.click(screen.getByRole('combobox', { name: 'Category' }));
    const sel = document.querySelector('[role="option"][aria-selected="true"]')!;
    expect(sel.className).toContain('sm2-cat-select__op');
    expect(document.querySelector('.sm2-moldura-modal--dono')).not.toBeNull();
    expect(document.querySelector('.sm2-moldura-dono__fechar')).not.toBeNull();
  });
  it('✕ de remover passo: glifo simples na cor de perigo, 44x44, sem imagem de arte', () => {
    mk();
    fireEvent.click(screen.getByRole('button', { name: /Add$/ }));
    const x = screen.getByRole('button', { name: 'Remove step 1' });
    expect(x.getAttribute('style')).toMatch(/--sm2-danger-ink/);
    expect(x.getAttribute('style')).toMatch(/width:\s*44px/);
    expect(x.querySelector('img')).toBeNull();
  });
});
