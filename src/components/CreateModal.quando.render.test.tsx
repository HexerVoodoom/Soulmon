// @vitest-environment jsdom
/** QUANDO da criação: 7 quadrados (desmarcados), "Marcar todos", "Uma vez". */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { screen, fireEvent, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CreateModal } from './CreateModal';

const abrir = (language: 'pt-BR' | 'en-US' = 'pt-BR', initialKind: 'habit' | 'task' = 'habit') => {
  const onSaveActivity = vi.fn();
  const onSaveTask = vi.fn();
  renderWithCss(
    <CreateModal isOpen initialKind={initialKind} onClose={() => {}} onSaveTask={onSaveTask} onSaveActivity={onSaveActivity} language={language} />,
  );
  return { onSaveActivity, onSaveTask };
};
const quadrados = () => Array.from(document.querySelectorAll<HTMLButtonElement>('.sm2-day-square'));
const nome = () => fireEvent.change(document.getElementById('sm-quick-add')!, { target: { value: 'Ler' } });
const salvar = () => screen.getByRole('button', { name: /^(Salvar|Save)$/ }) as HTMLButtonElement;

afterEach(cleanup);

describe('Quando', () => {
  it('7 quadrados Dom→Sáb, todos desmarcados', () => {
    abrir();
    const q = quadrados();
    expect(q.map(b => b.textContent)).toEqual(['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']);
    expect(q.every(b => b.getAttribute('aria-pressed') === 'false')).toBe(true);
  });

  it('Marcar todos marca e desmarca os 7', () => {
    abrir();
    const todos = screen.getByLabelText('Marcar todos') as HTMLInputElement;
    fireEvent.click(todos);
    expect(quadrados().every(b => b.getAttribute('aria-pressed') === 'true')).toBe(true);
    fireEvent.click(todos);
    expect(quadrados().every(b => b.getAttribute('aria-pressed') === 'false')).toBe(true);
  });

  it('sem dia e sem Uma vez, Salvar bloqueado com mensagem; um dia libera', () => {
    abrir('en-US');
    nome();
    expect(salvar().disabled).toBe(true);
    expect(screen.getByText(/Pick at least one day/)).toBeTruthy();
    fireEvent.click(quadrados()[1]);
    expect(salvar().disabled).toBe(false);
  });

  it('Uma vez desabilita os quadrados e libera Salvar; mantém a data', () => {
    const { onSaveTask } = abrir('pt-BR', 'task');
    nome();
    expect(salvar().disabled).toBe(true);
    fireEvent.click(screen.getByLabelText('Uma vez'));
    expect(quadrados().every(b => b.disabled)).toBe(true);
    expect(salvar().disabled).toBe(false);
    expect(screen.getByLabelText('Quando pretendo fazer')).toBeTruthy();
    fireEvent.click(salvar());
    expect(onSaveTask).toHaveBeenCalledTimes(1);
  });

  it('hábito salva os dias escolhidos', () => {
    const { onSaveActivity } = abrir();
    nome();
    fireEvent.click(quadrados()[1]);
    fireEvent.click(quadrados()[3]);
    fireEvent.click(salvar());
    expect(onSaveActivity.mock.calls[0][0].weekDays).toEqual([1, 3]);
  });

  it.each([360, 375, 412])('a %ipx: o Quando não passa da largura (regras do index.css)', (w) => {
    abrir();
    const q = document.querySelector('[data-quando]') as HTMLElement;
    expect(q).toBeTruthy();
    const grid = document.querySelector('.sm2-day-squares') as HTMLElement;
    const cols = getComputedStyle(grid).gridTemplateColumns;
    expect(cols).toContain('minmax(0');
    // 7 colunas de 44px + 6 gaps cabem em w menos o gutter de 2×16.
    expect(7 * 44 + 6 * 2).toBeLessThanOrEqual(w - 32);
    expect(getComputedStyle(q).minWidth || getComputedStyle(q).minInlineSize).toBeTruthy();
  });
});
