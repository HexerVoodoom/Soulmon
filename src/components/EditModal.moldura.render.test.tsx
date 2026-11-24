// @vitest-environment jsdom
/** Editar hábito e Editar tarefa: MESMA moldura dono + fundo vazio da Nova tarefa/Novo hábito. */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import { EditModal } from './EditModal';
import { TaskEditModal } from './TaskEditModal';
import { renderWithCss } from '../test/renderEnv';

afterEach(cleanup);

const hab = { name: 'Correr', category: 'Health', emoji: '💪' };
const tar = { id: 't1', name: 'Pagar conta', category: 'Health', emoji: '💪', done: false };

function confere(titulo: string) {
  const m = document.querySelector("[data-moldura-modal]") as HTMLElement;
  expect(m).toBeTruthy();
  expect(m.className).toContain('sm2-moldura-modal--dono');
  expect(m.className).toContain('sm2-moldura-modal--vazio');
  expect(m.className).not.toContain('sm2-moldura-modal--pedra');
  expect(m.getAttribute('data-moldura-fundo')).toBe('vazio');
  expect(m.querySelector('.sm2-moldura-modal__titulo')?.textContent).toBe(titulo);
  expect(m.querySelector('.sm2-moldura-dono__fechar')).toBeTruthy();
  expect(m.querySelector('.sm2-nova-corpo')).toBeTruthy();
}

describe('moldura dono + fundo vazio na edição', () => {
  it('EditModal (Editar atividade)', () => {
    renderWithCss(
      <EditModal isOpen onClose={() => {}} onSave={vi.fn()} onDelete={vi.fn()} initialData={hab as never} language="pt-BR" />,
    );
    confere('Editar atividade');
    expect(document.querySelector('.sm2-nova-corpo')?.getAttribute('data-edit-corpo')).toBe('excluir');
  });
  it('TaskEditModal (Editar tarefa)', () => {
    renderWithCss(
      <TaskEditModal isOpen onClose={() => {}} onSave={vi.fn()} initialData={tar as never} language="pt-BR" />,
    );
    confere('Editar tarefa');
  });
});
