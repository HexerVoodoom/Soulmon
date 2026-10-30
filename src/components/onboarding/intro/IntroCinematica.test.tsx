// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, act } from '@testing-library/react';
import { IntroCinematica, deveTocarIntro, introVista } from './IntroCinematica';
import { PLANOS_INTRO } from './copy';
import { SLOTS_REAIS } from '../sequencia/slotsReais';
import { SequenciaOnboarding } from '../sequencia/SequenciaOnboarding';
import { SEQUENCIA_VELADO } from '../sequencia/cenas';

beforeEach(() => { localStorage.clear(); vi.useFakeTimers(); });
afterEach(() => { cleanup(); vi.useRealTimers(); localStorage.clear(); });

describe('intro pré-login', () => {
  it('flag desligado: não toca; ligado: toca na 1ª abertura sem onboarding e só uma vez', () => {
    expect(deveTocarIntro(false)).toBe(false);
    localStorage.setItem('soulmon-onboarding-velado', '1');
    expect(deveTocarIntro(false)).toBe(true);
    expect(deveTocarIntro(true)).toBe(false);
    render(<IntroCinematica language="pt-BR" onDone={() => {}} />);
    fireEvent.click(screen.getByTestId('intro-pular'));
    expect(introVista()).toBe(true);
    expect(deveTocarIntro(false)).toBe(false);
  });

  it('9 planos com legenda EN/PT em sequência temporizada, termina com onDone', () => {
    expect(PLANOS_INTRO).toHaveLength(9);
    const onDone = vi.fn();
    render(<IntroCinematica language="en-US" onDone={onDone} />);
    expect(screen.getByTestId('intro-legenda').textContent).toBe(PLANOS_INTRO[0].en);
    act(() => { vi.advanceTimersByTime(PLANOS_INTRO[0].s * 1000); });
    expect(screen.getByTestId('intro-legenda').textContent).toBe(PLANOS_INTRO[1].en);
    for (let i = 1; i < 9; i++) act(() => { vi.advanceTimersByTime(PLANOS_INTRO[i].s * 1000); });
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(introVista()).toBe(true);
  });

  it('Pular chama onDone na hora', () => {
    const onDone = vi.fn();
    render(<IntroCinematica language="pt-BR" onDone={onDone} />);
    fireEvent.click(screen.getByText('Pular'));
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('sequência do onboarding velado', () => {
  it('slots reais cobrem os 3 slots da sequência', () => {
    const usados = SEQUENCIA_VELADO.filter(q => q.tipo === 'slot').map(q => (q as { slot: string }).slot);
    for (const s of new Set(usados)) expect(SLOTS_REAIS[s as 'puzzle']).toBeTypeOf('function');
    expect(Object.keys(SLOTS_REAIS).sort()).toEqual(['duelo', 'puzzle', 'tarefa']);
  });

  it('flag desligado: SequenciaOnboarding não monta nada', () => {
    const { container } = render(<SequenciaOnboarding language="pt-BR" slots={SLOTS_REAIS} onDone={() => {}} />);
    expect(container.innerHTML).toBe('');
  });
});
