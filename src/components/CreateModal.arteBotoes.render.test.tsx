// @vitest-environment jsdom
/** Arte dos botões sm2: o CreateModal liga o escopo `.sm2-btn-arte` e o `sm2Button` marca variante e altura no style. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { CreateModal } from './CreateModal';
import { sm2Button } from './form/FormKit';

afterEach(cleanup);
const mk = () => render(
  <CreateModal isOpen initialKind="habit" onClose={() => {}} onSaveTask={vi.fn()} onSaveActivity={vi.fn()} language="en-US" />,
);

describe('CreateModal: arte dos botões sm2', () => {
  it('Cancel/Save trazem os marcadores de variante e altura, dentro do escopo .sm2-btn-arte', () => {
    mk();
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    const save = screen.getByRole('button', { name: 'Save' });
    expect(cancel.getAttribute('style')).toMatch(/--sm2-btn-kind:\s*outline/);
    expect(save.getAttribute('style')).toMatch(/--sm2-btn-kind:\s*primary/);
    expect(cancel.getAttribute('style')).toMatch(/--sm2-btn-h:\s*48px/);
    expect(cancel.closest('.sm2-btn-arte')).not.toBeNull();
    expect(save.closest('.sm2-btn-arte')).not.toBeNull();
    expect(document.querySelector('.sm2-nova-corpo.sm2-btn-arte')).not.toBeNull();
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
