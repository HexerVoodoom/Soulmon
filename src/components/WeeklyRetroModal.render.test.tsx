// @vitest-environment jsdom
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { WeeklyRetroModal } from './WeeklyRetroModal';
import type { WeeklyRetro } from '../utils/weeklyRetro';

afterEach(cleanup);
const retro: WeeklyRetro = {
  weekFrom: '', weekTo: '',
  habits: [
    { id: 'a', name: 'Ler', emoji: '', done: 4, due: 5, rate: 0.8 },
    { id: 'b', name: 'Correr', emoji: '', done: 1, due: 5, rate: 0.2 },
  ],
  totalHabitDone: 5, tasks: [{ id: 't1', name: 'Pagar conta' }], tasksDone: 1,
  hardest: { id: 'b', name: 'Correr', emoji: '', done: 1, due: 5, rate: 0.2 },
};
const base = { language: 'pt-BR' as const, retro, spriteNow: 'now.png', spritePrev: null, onClose: () => {} };

describe('WeeklyRetroModal', () => {
  it('mostra contagens, accordion fechado e o cartão do bônus', () => {
    render(<WeeklyRetroModal {...base} />);
    expect(screen.getByText(/Você fez Ler/)).toBeTruthy();
    expect(screen.getByText('4 vezes')).toBeTruthy();
    const acc = screen.getByRole('button', { name: /1 tarefa pontual/ });
    expect(acc.getAttribute('aria-expanded')).toBe('false');
    expect(screen.queryByText('Pagar conta')).toBeNull();
    fireEvent.click(acc);
    expect(screen.getByText('Pagar conta')).toBeTruthy();
    expect(screen.getByText(/Você teve mais dificuldade em Correr\. Vamos dar um bônus nela para te incentivar esta semana\./)).toBeTruthy();
    expect(document.body.textContent).not.toMatch(/atrapalha/i);
  });

  it('sem hábito difícil não há cartão de bônus, e não há travessão longo', () => {
    render(<WeeklyRetroModal {...base} retro={{ ...retro, hardest: null }} />);
    expect(document.querySelector('[data-weekly-bonus]')).toBeNull();
    expect(document.body.textContent).not.toMatch(/—/);
  });

  it('EN', () => {
    render(<WeeklyRetroModal {...base} language="en-US" />);
    expect(screen.getByText(/You had a harder time with Correr/)).toBeTruthy();
  });

  it('sem evolução a etapa não aparece; com evolução o toque troca a forma', async () => {
    const { unmount } = render(<WeeklyRetroModal {...base} />);
    expect(screen.queryByText('Essa semana eu evoluí!')).toBeNull();
    unmount();
    render(<WeeklyRetroModal {...base} spritePrev="prev.png" />);
    expect(screen.getByText('Essa semana eu evoluí!')).toBeTruthy();
    expect(document.querySelector('img')?.getAttribute('src')).toBe('prev.png');
    fireEvent.click(screen.getByText('Toque para ver'));
    await waitFor(() => expect(document.querySelector('img')?.getAttribute('src')).toBe('now.png'));
    fireEvent.click(screen.getByText('Continuar'));
    expect(screen.getByText('Que semana!')).toBeTruthy();
  });

  it('o CTA fecha', () => {
    let closed = 0;
    render(<WeeklyRetroModal {...base} onClose={() => { closed++; }} />);
    fireEvent.click(screen.getByText('Bora para a semana'));
    expect(closed).toBe(1);
  });
});
