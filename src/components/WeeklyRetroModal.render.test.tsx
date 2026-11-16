// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { StrictMode } from 'react';
import { WeeklyRetroModal, RETRO_FILL_MS } from './WeeklyRetroModal';
import { FILL_REST_MS } from './ui/CtaButton';
import { useDialogA11y } from '../hooks/useDialogA11y';
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
    expect(screen.getByText('Boa semana, a chama segue acesa')).toBeTruthy();
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

  it('semana ruim não lista hábito com 0 vezes (tom encorajador)', () => {
    render(<WeeklyRetroModal {...base} retro={withHabits(line('Correr', 0, 5), line('Ler', 1, 5))} />);
    expect(screen.queryByText(/Você fez Correr/)).toBeNull();
    expect(screen.getByText(/Você fez Ler/)).toBeTruthy();
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

  describe('CTA: toque único preenche e fecha', () => {
    const cta = () => document.querySelector('[data-cta-button][data-cta-fill]') as HTMLButtonElement;
    const setup = () => { vi.useFakeTimers(); const onClose = vi.fn(); render(<WeeklyRetroModal {...base} onClose={onClose} />); return onClose; };
    afterEach(() => { vi.useRealTimers(); });

    it('texto novo; o toque inicia o preenchimento e só fecha ao fim', () => {
      const onClose = setup();
      expect(screen.getByText('Vamos começar a semana')).toBeTruthy();
      expect(cta().getAttribute('data-cta-filling')).toBeNull();
      fireEvent.click(cta());
      expect(cta().getAttribute('data-cta-filling')).toBe('true');
      act(() => { vi.advanceTimersByTime(RETRO_FILL_MS + FILL_REST_MS - 1); });
      expect(onClose).not.toHaveBeenCalled();
      act(() => { vi.advanceTimersByTime(2); });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('toque duplo (ou repetido) durante o preenchimento não dispara duas vezes', () => {
      const onClose = setup();
      fireEvent.click(cta());
      act(() => { vi.advanceTimersByTime(300); });
      fireEvent.click(cta());
      fireEvent.click(cta());
      act(() => { vi.advanceTimersByTime((RETRO_FILL_MS + FILL_REST_MS) * 3); });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('teclado: Enter e Espaço são o clique nativo do botão (mesmo comportamento)', () => {
      const onClose = setup();
      cta().focus();
      // o navegador transforma Enter/Espaço em `click` num <button>; o jsdom não, então simulamos esse clique
      fireEvent.keyDown(cta(), { key: 'Enter' });
      fireEvent.click(cta());
      act(() => { vi.advanceTimersByTime(RETRO_FILL_MS + FILL_REST_MS + 5); });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('movimento reduzido: sem animação de preenchimento, fecha direto', () => {
      const orig = window.matchMedia;
      window.matchMedia = ((q: string) => ({ matches: /reduce/.test(q), media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false })) as unknown as typeof window.matchMedia;
      try {
        const onClose = setup();
        fireEvent.click(cta());
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(cta().getAttribute('data-cta-filling')).toBeNull();
        const css = readFileSync(resolve(__dirname, '../index.css'), 'utf8');
        expect(css).toMatch(/prefers-reduced-motion: reduce\) \{ \.sm2-cta-fill \{ display: none; \} \}/);
      } finally { window.matchMedia = orig; }
    });
  });

  describe('instância única e fundo', () => {
    it('duas montagens ao mesmo tempo desenham UM só diálogo, mesmo com re-render', () => {
      const { rerender } = render(<><WeeklyRetroModal {...base} /><WeeklyRetroModal {...base} /></>);
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
      rerender(<><WeeklyRetroModal {...base} /><WeeklyRetroModal {...base} /></>);
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
    });

    it('StrictMode (efeito duplo) também fica com um só', () => {
      render(<StrictMode><WeeklyRetroModal {...base} /></StrictMode>);
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
    });

    it('fechar e reabrir libera a vaga', () => {
      const { unmount } = render(<WeeklyRetroModal {...base} />);
      unmount();
      render(<WeeklyRetroModal {...base} />);
      expect(screen.getAllByRole('dialog')).toHaveLength(1);
    });

    it('um diálogo que monta DEPOIS não torna a retrospectiva inerte (senão ela trava sem scroll e sem CTA)', () => {
      function Outro() {
        const ref = useDialogA11y<HTMLDivElement>(true, () => {});
        return <div ref={ref} role="dialog" aria-modal="true" aria-label="outro">x</div>;
      }
      const host = document.createElement('div');
      document.body.appendChild(host);
      render(<WeeklyRetroModal {...base} />);
      const { unmount } = render(<Outro />, { container: host });
      const retroRoot = document.querySelector('[data-retro-dialog]') as HTMLElement;
      expect((retroRoot as HTMLElement & { inert?: boolean }).inert).not.toBe(true);
      expect(retroRoot.hasAttribute('data-sm2-inert')).toBe(false);
      unmount();
      host.remove();
    });

    it('o conteúdo rola dentro do modal e o CTA fica fora da área rolável (nada atrás dele)', () => {
      render(<WeeklyRetroModal {...base} />);
      const scroll = document.querySelector('[data-retro-scroll]') as HTMLElement;
      const dock = document.querySelector('[data-retro-dock]') as HTMLElement;
      expect(scroll.contains(document.querySelector('[data-retro-card]'))).toBe(true);
      expect(scroll.contains(dock)).toBe(false);
      expect(dock.querySelector('[data-cta-button]')).toBeTruthy();
      const css = document.querySelector('style')?.textContent ?? '';
      expect(css).toMatch(/\.rt-scroll\{[^}]*overflow-y:auto/);
      expect(css).toMatch(/\.rt-root\{position:fixed;top:0;right:0;bottom:0;left:0;height:100vh;height:100dvh/);
    });
  });
});
