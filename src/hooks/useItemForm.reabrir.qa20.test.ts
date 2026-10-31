// @vitest-environment jsdom
/**
 * QA20 L1 — o formulário de edição aberto NÃO volta ao valor salvo quando o estado
 * é reconstruído (virada do dia, adoção da nuvem): o objeto do item muda, o id não.
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useItemForm, useHabitSchedule } from './useItemForm';

const tarefa = (over: Record<string, unknown> = {}) =>
  ({ id: 't1', name: 'Ler', category: 'Study', emoji: '', ...over });

describe('useItemForm — não apaga a digitação ao reconstruir o item', () => {
  it('objeto novo com o MESMO id: mantém o que a pessoa digitou', () => {
    const { result, rerender } = renderHook((p: { data: ReturnType<typeof tarefa> }) =>
      useItemForm({ isOpen: true, initialData: p.data }), { initialProps: { data: tarefa() } });
    expect(result.current.name).toBe('Ler');
    act(() => result.current.setName('Ler 20 páginas'));
    rerender({ data: tarefa() }); // mesmo item, objeto novo
    expect(result.current.name).toBe('Ler 20 páginas');
  });

  it('OUTRO id ou reabrir: recarrega do item', () => {
    const { result, rerender } = renderHook((p: { open: boolean; data: ReturnType<typeof tarefa> }) =>
      useItemForm({ isOpen: p.open, initialData: p.data }), { initialProps: { open: true, data: tarefa() } });
    act(() => result.current.setName('rascunho'));
    rerender({ open: true, data: tarefa({ id: 't2', name: 'Correr' }) });
    expect(result.current.name).toBe('Correr');
    act(() => result.current.setName('rascunho'));
    rerender({ open: false, data: tarefa({ id: 't2', name: 'Correr' }) });
    rerender({ open: true, data: tarefa({ id: 't2', name: 'Correr' }) });
    expect(result.current.name).toBe('Correr');
  });

  it('useHabitSchedule: objeto novo com o mesmo id mantém a âncora digitada', () => {
    const h = () => ({ id: 'h1', weekDays: [1, 3], anchor: { after: 'café', where: '' } });
    const { result, rerender } = renderHook((p: { i: ReturnType<typeof h> }) =>
      useHabitSchedule({ isOpen: true, initial: p.i }), { initialProps: { i: h() } });
    expect(result.current.anchorAfter).toBe('café');
    act(() => result.current.setAnchorAfter('almoço'));
    rerender({ i: h() });
    expect(result.current.anchorAfter).toBe('almoço');
  });
});
