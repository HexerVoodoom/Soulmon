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

  it('v3 curta: ~35 s no total, nenhum plano passa de 5 s', () => {
    const total = PLANOS_INTRO.reduce((a, p) => a + p.s, 0);
    expect(total).toBeLessThanOrEqual(36);
    expect(Math.max(...PLANOS_INTRO.map(p => p.s))).toBeLessThanOrEqual(5);
  });

  it('cada troca de plano tem a estática de sintonia', () => {
    const { container } = render(<IntroCinematica language="en-US" onDone={() => {}} paineis={['a.webp', 'b.webp']} />);
    expect(container.querySelector('[data-intro-sintonia]')).not.toBeNull();
  });

  it('painéis: um por plano, trocam junto com a legenda; sem vídeo', () => {
    const paineis = PLANOS_INTRO.map((_, k) => `p${k + 1}.webp`);
    const { container } = render(<IntroCinematica language="en-US" onDone={() => {}} paineis={paineis} />);
    expect(container.querySelector('video')).toBeNull();
    expect(screen.getByTestId('intro-painel').querySelector('img')?.getAttribute('src')).toBe('p1.webp');
    act(() => { vi.advanceTimersByTime(PLANOS_INTRO[0].s * 1000); });
    expect(screen.getByTestId('intro-painel').getAttribute('data-plano')).toBe('2');
    expect(screen.getByTestId('intro-painel').querySelector('img')?.getAttribute('src')).toBe('p2.webp');
  });

  it('os painéis existem nos assets', () => {
    const { container } = render(<IntroCinematica language="en-US" onDone={() => {}} />);
    expect(container.querySelector('[data-testid="intro-painel"] img')?.getAttribute('src')).toBeTruthy();
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
