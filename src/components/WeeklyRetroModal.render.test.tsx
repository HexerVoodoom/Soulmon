// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
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
    expect((document.getElementById('rt-tasks') as HTMLElement).hidden).toBe(true);
    fireEvent.click(acc);
    expect((document.getElementById('rt-tasks') as HTMLElement).hidden).toBe(false);
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
    expect(screen.getByText('Boa semana, e dá para mais')).toBeTruthy();
  });

  it('usa o CtaButton padrão e o card liso, sem border-image', () => {
    render(<WeeklyRetroModal {...base} />);
    expect(document.querySelector('[data-cta-button][data-cta-tone="acao"]')).toBeTruthy();
    expect(document.querySelector('[data-retro-card]')).toBeTruthy();
    expect(document.querySelector('[data-retro-flame-art] [data-soul-flame-anim]')).toBeTruthy();
    expect(document.querySelector('[data-retro-frame]')).toBeNull();
  });

  const line = (id: string, done: number, due: number) => ({ id, name: id, emoji: '', done, due, rate: done / due });
  const withHabits = (...h: ReturnType<typeof line>[]) => ({ ...retro, habits: h, totalHabitDone: h.reduce((x, y) => x + y.done, 0), hardest: null });

  it('o título muda por qualidade da semana (PT e EN)', () => {
    const { unmount } = render(<WeeklyRetroModal {...base} retro={withHabits(line('a', 9, 10))} />);
    expect(screen.getByText('A gente arrebentou!')).toBeTruthy();
    expect(document.querySelector('[data-retro-quality="good"]')).toBeTruthy();
    unmount();
    render(<WeeklyRetroModal {...base} retro={withHabits(line('a', 1, 10))} />);
    expect(screen.getByText('Essa semana a gente vai conseguir.')).toBeTruthy();
    expect(document.querySelector('[data-retro-quality="bad"]')).toBeTruthy();
    cleanup();
    render(<WeeklyRetroModal {...base} language="en-US" retro={withHabits(line('a', 9, 10))} />);
    expect(screen.getByText('We crushed it!')).toBeTruthy();
    cleanup();
    render(<WeeklyRetroModal {...base} language="en-US" retro={withHabits(line('a', 1, 10))} />);
    expect(screen.getByText("This week we'll get there.")).toBeTruthy();
    // o texto da semana ruim olha para frente, sem lamentar a anterior
    expect(document.body.textContent).not.toMatch(/—/);
  });

  it('o Soulmon fica à esquerda do bloco de frases, no mesmo hero', () => {
    render(<WeeklyRetroModal {...base} />);
    const hero = document.querySelector('[data-retro-hero]') as HTMLElement;
    expect(hero.firstElementChild?.tagName).toBe('IMG');
    expect(hero.querySelector('.rt-hero-text h2')).toBeTruthy();
  });

  it('contadores com rótulo claro e plural certo', () => {
    const { unmount } = render(<WeeklyRetroModal {...base} />);
    expect(screen.getByText('hábitos cumpridos')).toBeTruthy();
    expect(screen.getByText('tarefa pontual')).toBeTruthy();
    unmount();
    render(<WeeklyRetroModal {...base} retro={{ ...retro, totalHabitDone: 1, tasksDone: 3, tasks: [] }} />);
    expect(screen.getByText('hábito cumprido')).toBeTruthy();
    expect(screen.getByText('tarefas pontuais')).toBeTruthy();
    cleanup();
    render(<WeeklyRetroModal {...base} language="en-US" retro={{ ...retro, totalHabitDone: 1, tasksDone: 2, tasks: [] }} />);
    expect(screen.getByText('habit completed')).toBeTruthy();
    expect(screen.getByText('one-off tasks')).toBeTruthy();
  });

  describe('CTA pressionar e segurar', () => {
    const cta = () => document.querySelector('[data-cta-button][data-cta-hold]') as HTMLButtonElement;
    const setup = () => { vi.useFakeTimers(); const onClose = vi.fn(); render(<WeeklyRetroModal {...base} onClose={onClose} />); return onClose; };
    afterEach(() => { vi.useRealTimers(); });

    it('texto novo, descrição por aria e clique simples não fecha', () => {
      const onClose = setup();
      expect(screen.getByText('Vamos começar a semana')).toBeTruthy();
      const desc = document.getElementById(cta().getAttribute('aria-describedby') as string);
      expect(desc?.textContent).toMatch(/Pressione e segure/);
      fireEvent.click(cta());
      expect(onClose).not.toHaveBeenCalled();
    });

    it('soltar antes de 1,5 s cancela e volta', () => {
      const onClose = setup();
      fireEvent.pointerDown(cta());
      expect(cta().getAttribute('data-cta-holding')).toBe('true');
      act(() => { vi.advanceTimersByTime(1200); });
      fireEvent.pointerUp(cta());
      expect(cta().getAttribute('data-cta-holding')).toBeNull();
      act(() => { vi.advanceTimersByTime(2000); });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('sair do botão segurando também cancela', () => {
      const onClose = setup();
      fireEvent.pointerDown(cta());
      fireEvent.pointerLeave(cta());
      act(() => { vi.advanceTimersByTime(2000); });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('completar o tempo dispara a ação uma vez', () => {
      const onClose = setup();
      fireEvent.pointerDown(cta());
      act(() => { vi.advanceTimersByTime(1499); });
      expect(onClose).not.toHaveBeenCalled();
      act(() => { vi.advanceTimersByTime(2); });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('movimento reduzido: o CSS tira a animação do preenchimento e o JS segue exigindo segurar', () => {
      const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
      expect(css).toMatch(/prefers-reduced-motion: reduce\) \{\s*\.sm2-cta-fill \{ transition: none; \}/);
      const onClose = setup();
      fireEvent.pointerDown(cta());
      act(() => { vi.advanceTimersByTime(500); });
      expect(onClose).not.toHaveBeenCalled();
    });

    it('teclado: segurar Enter ou Espaço completa; soltar antes cancela; repetição do SO não reinicia', () => {
      const onClose = setup();
      fireEvent.keyDown(cta(), { key: 'Enter' });
      act(() => { vi.advanceTimersByTime(800); });
      fireEvent.keyDown(cta(), { key: 'Enter', repeat: true });
      act(() => { vi.advanceTimersByTime(800); });
      expect(onClose).toHaveBeenCalledTimes(1);
      fireEvent.keyDown(cta(), { key: ' ' });
      act(() => { vi.advanceTimersByTime(700); });
      fireEvent.keyUp(cta(), { key: ' ' });
      act(() => { vi.advanceTimersByTime(2000); });
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
