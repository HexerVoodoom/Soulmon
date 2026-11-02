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

vi.mock('../../../utils/musica', () => ({ entrarNaSuperficie: vi.fn(() => vi.fn()) }));
import * as musica from '../../../utils/musica';
import { definirMusicaLigada } from '../../../utils/audioBus';

describe('trilha da intro (nasce ligada por decisão do dono)', () => {
  it('nasce ligada: pede a superfície ao montar; o botão desliga e religa e a saída limpa', () => {
    definirMusicaLigada(true);
    const sair = vi.fn();
    vi.mocked(musica.entrarNaSuperficie).mockClear().mockReturnValue(sair);
    const { unmount } = render(<IntroCinematica language="pt-BR" onDone={() => {}} />);
    expect(musica.entrarNaSuperficie).toHaveBeenCalledWith('intro');
    const b = screen.getByTestId('intro-som');
    expect(b.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(b);
    expect(sair).toHaveBeenCalledTimes(1);
    expect(b.getAttribute('aria-pressed')).toBe('false');
    fireEvent.click(b);
    expect(b.getAttribute('aria-pressed')).toBe('true');
    unmount();
    expect(sair).toHaveBeenCalledTimes(2);
  });
  it('interruptor global de música desligado: sem botão', () => {
    definirMusicaLigada(false);
    vi.mocked(musica.entrarNaSuperficie).mockClear();
    render(<IntroCinematica language="en-US" onDone={() => {}} />);
    expect(screen.queryByTestId('intro-som')).toBeNull();
    expect(musica.entrarNaSuperficie).not.toHaveBeenCalled();
  });
});

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

  it('tempos batem com o vídeo v2: 72,85 s e início de cada plano', () => {
    expect(PLANOS_INTRO.reduce((a, p) => a + p.s, 0)).toBeCloseTo(72.85, 2);
    const inicios: number[] = []; let acc = 0;
    for (const p of PLANOS_INTRO) { inicios.push(acc); acc += p.s; }
    expect(inicios.map((x) => Math.round(x * 100) / 100)).toEqual([0, 5.98, 11.96, 23.84, 29.91, 41.79, 47.77, 59.73, 65.71]);
  });

  it('com vídeo, a legenda segue o currentTime', () => {
    const { container } = render(<IntroCinematica language="en-US" onDone={() => {}} videoSrc="x.mp4" />);
    const v = container.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(v, 'currentTime', { value: 30, configurable: true });
    fireEvent.timeUpdate(v);
    expect(screen.getByTestId('intro-legenda').getAttribute('data-plano')).toBe('5');
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
