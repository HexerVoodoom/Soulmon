// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { DuelScreen, cheerQuality } from './DuelScreen';
import { duelStats, DUEL_TAPS_FULL, DUEL_TAPS_CAP, TIMING_CHEER_ENABLED } from '../../functions/api/_duel.js';

afterEach(() => { cleanup(); vi.useRealTimers(); });

function montar(onDone = vi.fn(), onClose = vi.fn()) {
  const s = duelStats({ stage: 'rookie' });
  const r = render(<DuelScreen me={s} opp={s} seed={123} petSprite="" oppSprite="" petName="Pet" oppName="Rival" isPt onDone={onDone} onClose={onClose} />);
  const camada = () => r.container.querySelector('[data-torcida-layer]') as HTMLElement;
  return { onDone, onClose, camada };
}
const correr = (onDone: ReturnType<typeof vi.fn>) => {
  for (let i = 0; i < 80 && !onDone.mock.calls.length; i++) act(() => { vi.advanceTimersByTime(300); });
};

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

  it('o botão Torcer! também torce (teclado e leitor de tela)', () => {
    vi.useFakeTimers();
    montar();
    const btn = screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' }) as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
    for (let i = 0; i < DUEL_TAPS_FULL; i++) fireEvent.click(btn);
    expect((document.querySelector('[data-torcida-gauge]') as HTMLElement).getAttribute('data-torcida-full')).toBe('1');
  });

  it('o botão de sair não vira torcida: o toque é dele', () => {
    vi.useFakeTimers();
    const { onClose } = montar();
    const sair = screen.getByRole('button', { name: 'Sair do duelo' });
    fireEvent.pointerDown(sair);
    fireEvent.click(sair);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect((document.querySelector('[data-torcida-gauge]') as HTMLElement).getAttribute('data-torcida-full')).toBe('0');
  });
});
