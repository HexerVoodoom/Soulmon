// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { ChatActionCard } from './ChatActionCard';
import type { CreateAction } from '../utils/chatActions';

afterEach(cleanup);

const habito: CreateAction = {
  type: 'create_habit',
  habit: { name: 'Beber água', category: 'Health', schedule: { kind: 'weekdays', days: [0, 1, 2, 3, 4, 5, 6] }, time: '09:00' },
};

describe('ChatActionCard — o modelo propõe, a pessoa decide', () => {
  it('mostra a pergunta com nome, cadência e horário, e os botões; NADA é criado ao montar', () => {
    const onConfirm = vi.fn();
    render(<ChatActionCard action={habito} isPt onConfirm={onConfirm} onDismiss={() => {}} />);
    expect(screen.getByText('Criar hábito “Beber água” — todo dia às 09:00?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Criar' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Editar' })).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('Criar chama onConfirm com a ação', () => {
    const onConfirm = vi.fn();
    render(<ChatActionCard action={habito} isPt onConfirm={onConfirm} onDismiss={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }));
    expect(onConfirm).toHaveBeenCalledWith(habito);
  });

  it('Editar troca o nome antes de criar; o nome passa pela validação', () => {
    const onConfirm = vi.fn();
    render(<ChatActionCard action={habito} isPt={false} onConfirm={onConfirm} onDismiss={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Drink <b>water</b>' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save name' }));
    expect(screen.getByText(/Create habit “Drink b water \/b”/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    const enviado = onConfirm.mock.calls[0][0];
    expect(enviado.habit.name).not.toMatch(/[<>]/);
    expect(enviado.habit.schedule).toEqual(habito.type === 'create_habit' && habito.habit.schedule);
  });

  it('Agora não descarta sem criar', () => {
    const onConfirm = vi.fn();
    const onDismiss = vi.fn();
    render(<ChatActionCard action={habito} isPt onConfirm={onConfirm} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Agora não' }));
    expect(onDismiss).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('tarefa: texto próprio', () => {
    render(<ChatActionCard action={{ type: 'create_task', task: { name: 'Pagar luz', category: 'Work', effort: 1, date: '2026-10-12' } }} isPt={false} onConfirm={() => {}} onDismiss={() => {}} />);
    expect(screen.getByText('Create task “Pagar luz” for 2026-10-12?')).toBeTruthy();
  });
});
