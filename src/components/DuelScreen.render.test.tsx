// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { DuelScreen, cheerQuality } from './DuelScreen';
import { duelStats, DUEL_TAPS_FULL, DUEL_TAPS_CAP, TIMING_CHEER_ENABLED } from '../../functions/api/_duel.js';
import { DUEL_STEP_MS } from '../utils/combatFx';

afterEach(() => { cleanup(); vi.useRealTimers(); });

function montar(onDone = vi.fn(), onClose = vi.fn()) {
  const s = duelStats({ stage: 'rookie' });
  const r = render(<DuelScreen me={s} opp={s} seed={123} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt petElement="fogo" oppElement="agua" onDone={onDone} onClose={onClose} />);
  const camada = () => r.container.querySelector('[data-torcida-layer]') as HTMLElement;
  return { onDone, onClose, camada };
}
/** Corre o relógio de 300 em 300 ms até a luta terminar; devolve o tempo gasto (ms). */
const correr = (onDone: ReturnType<typeof vi.fn>) => {
  let t = 0;
  for (let i = 0; i < 120 && !onDone.mock.calls.length; i++) { act(() => { vi.advanceTimersByTime(300); }); t += 300; }
  return t;
};

describe('DuelScreen — a cena em tela cheia', () => {
  it('é a CENA do combate: o seu Soulmon e o oponente, HP nos pés de cada um, X no canto, gauge no topo, sem texto explicativo', () => {
    vi.useFakeTimers();
    montar();
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="me"]')?.textContent).toContain('Pet');
    expect(document.querySelector('[data-stage-plate="foe"]')?.textContent).toContain('Rival');
    expect(document.querySelector('[data-stage-close]')).not.toBeNull();
    expect(screen.queryByText(/lutam sozinhos/i)).toBeNull();
    expect(document.querySelector('[data-info-tip]')).not.toBeNull();
  });

  it('a luta é LENTA: ~17 s para os 12 golpes (era ~10,6 s) e o relógio respeita o passo', () => {
    vi.useFakeTimers();
    const { onDone } = montar();
    act(() => { vi.advanceTimersByTime(DUEL_STEP_MS - 800); });
    // Antes do 1º golpe chegar nada caiu: as duas barras estão cheias.
    expect(document.querySelector('[data-stage-plate="foe"]')?.textContent).toContain(`${duelStats({ stage: 'rookie' }).hp}/`);
    const gasto = correr(onDone);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(gasto + DUEL_STEP_MS - 800).toBeGreaterThan(12000);
    expect(gasto + DUEL_STEP_MS - 800).toBeLessThan(22000);
  });

  it('o golpe é desenhado com a arte do ELEMENTO de quem ataca', () => {
    vi.useFakeTimers();
    montar();
    act(() => { vi.advanceTimersByTime(DUEL_STEP_MS); });
    const fx = [...document.querySelectorAll('[data-stage-fx] img')].map(i => i.getAttribute('src') ?? '');
    expect(fx.length).toBeGreaterThan(0);
    for (const src of fx) expect(src).toMatch(/fx-(fogo|agua)-(cast|aura|slash|impact|defended|orb)/);
  });
});

describe('DuelScreen — torcida por toques', () => {
  it('a torcida por TIMING está desligada e o anel não existe mais na tela', () => {
    vi.useFakeTimers();
    expect(TIMING_CHEER_ENABLED).toBe(false);
    // O código antigo continua exportado (reaproveitável), mas sem UI.
    expect(cheerQuality(0)).toBe(1);
    expect(cheerQuality(1000)).toBe(0);
    montar();
    expect(document.querySelector('[data-duel-cheer]')).toBeNull();
  });

  it('sem tocar: luta sozinha e entrega 3 janelas vazias (a torcida só soma)', () => {
    vi.useFakeTimers();
    const { onDone } = montar();
    correr(onDone);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(onDone.mock.calls[0][0]).toEqual([0, 0, 0]);
  });

  it('tocar em qualquer lugar enche o gauge e vira toques na 1ª janela, com teto', () => {
    vi.useFakeTimers();
    const { onDone, camada } = montar();
    for (let i = 0; i < 40; i++) fireEvent.pointerDown(camada());
    const gauge = document.querySelector('[data-torcida-gauge]') as HTMLElement;
    expect(gauge.getAttribute('data-torcida-full')).toBe('1');
    correr(onDone);
    const taps = onDone.mock.calls[0][0] as number[];
    expect(taps).toHaveLength(3);
    expect(taps[0]).toBe(DUEL_TAPS_CAP); // 40 toques, mas o teto por janela vale
    expect(taps[0]).toBeGreaterThanOrEqual(DUEL_TAPS_FULL);
  });

  it('o gauge pede 16 toques: 15 não enchem, o 16º enche', () => {
    vi.useFakeTimers();
    const { camada } = montar();
    const gauge = document.querySelector('[data-torcida-gauge]') as HTMLElement;
    for (let i = 0; i < DUEL_TAPS_FULL - 1; i++) fireEvent.pointerDown(camada());
    expect(gauge.getAttribute('data-torcida-full')).toBe('0');
    fireEvent.pointerDown(camada());
    expect(gauge.getAttribute('data-torcida-full')).toBe('1');
  });

  it('o botão Torcer! também torce (teclado e leitor de tela)', () => {
    vi.useFakeTimers();
    montar();
    const btn = screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    for (let i = 0; i < DUEL_TAPS_FULL; i++) fireEvent.click(btn);
    expect((document.querySelector('[data-torcida-gauge]') as HTMLElement).getAttribute('data-torcida-full')).toBe('1');
  });

  it('o botão de sair não vira torcida: o toque é dele — e sair pede CONFIRMAÇÃO (conta como derrota)', () => {
    vi.useFakeTimers();
    const { onClose } = montar();
    const sair = screen.getByRole('button', { name: 'Sair do duelo' });
    fireEvent.pointerDown(sair);
    fireEvent.click(sair);
    expect(onClose).not.toHaveBeenCalled();
    expect((document.querySelector('[data-torcida-gauge]') as HTMLElement).getAttribute('data-torcida-full')).toBe('0');
    expect(document.querySelector('[data-stage-confirm]')?.textContent).toMatch(/derrota/i);
    fireEvent.click(document.querySelector('[data-stage-confirm-leave]') as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('com a confirmação aberta a luta PAUSA, e "Continuar" a retoma', () => {
    vi.useFakeTimers();
    const { onDone } = montar();
    fireEvent.click(screen.getByRole('button', { name: 'Sair do duelo' }));
    act(() => { vi.advanceTimersByTime(60000); });
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    correr(onDone);
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});
