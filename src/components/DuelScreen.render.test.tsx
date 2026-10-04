// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { DuelScreen, cheerQuality } from './DuelScreen';
import { duelStats, simulateDuel, DUEL_TAPS_FULL, DUEL_TAPS_CAP, DUEL_CHEER_WINDOWS, TIMING_CHEER_ENABLED } from '../../functions/api/_duel.js';
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
  for (let i = 0; i < 400 && !onDone.mock.calls.length; i++) { act(() => { vi.advanceTimersByTime(300); }); t += 300; }
  return t;
};
const gauge = () => document.querySelector('[data-torcida-gauge]') as HTMLElement;
const ratio = () => parseFloat(gauge().getAttribute('data-torcida-ratio') ?? 'NaN');

describe('DuelScreen — a cena em tela cheia', () => {
  it('é a CENA do combate: lutadores, HP E ENERGIA em cima de cada um, X no canto, mascote da torcida, sem texto explicativo', () => {
    vi.useFakeTimers();
    montar();
    expect(document.querySelector('[data-battle-stage]')).not.toBeNull();
    expect(document.querySelector('[data-stage-plate="me"]')?.textContent).toContain('Pet');
    expect(document.querySelector('[data-stage-plate="foe"]')?.textContent).toContain('Rival');
    expect(document.querySelectorAll('[data-stage-energy]').length).toBe(2); // a energia de cada lutador
    expect(document.querySelector('[data-stage-close]')).not.toBeNull();
    expect(document.querySelector('[data-cheer-mascot]')).not.toBeNull();
    expect(screen.queryByText(/lutam sozinhos/i)).toBeNull();
    expect(document.querySelector('[data-info-tip]')).not.toBeNull();
  });

  it('a luta é LONGA: ~35–45 s (era ~17 s, e ~10,6 s antes) e o relógio respeita o passo', () => {
    vi.useFakeTimers();
    const { onDone } = montar();
    act(() => { vi.advanceTimersByTime(DUEL_STEP_MS - 800); });
    // Antes do 1º golpe chegar nada caiu: as duas barras estão cheias.
    expect(document.querySelector('[data-stage-plate="foe"]')?.textContent).toContain(`${duelStats({ stage: 'rookie' }).hp}/`);
    const gasto = correr(onDone);
    expect(onDone).toHaveBeenCalledTimes(1);
    expect(gasto + DUEL_STEP_MS - 800).toBeGreaterThan(30000);
    expect(gasto + DUEL_STEP_MS - 800).toBeLessThan(48000);
  });

  it('o golpe é desenhado com a arte do ELEMENTO de quem ataca', () => {
    vi.useFakeTimers();
    montar();
    act(() => { vi.advanceTimersByTime(DUEL_STEP_MS); });
    const fx = [...document.querySelectorAll('[data-stage-fx] img')].map(i => i.getAttribute('src') ?? '');
    expect(fx.length).toBeGreaterThan(0);
    for (const src of fx) expect(src).toMatch(/fx-(fogo|agua)-(cast|aura|slash|impact|defended|orb)/);
  });

  it('a energia sobe na barra de cada um (dado + sofrido): depois dos dois primeiros golpes as barras não estão vazias', () => {
    vi.useFakeTimers();
    montar();
    act(() => { vi.advanceTimersByTime(DUEL_STEP_MS * 2 + 400); });
    const barras = [...document.querySelectorAll('[data-stage-energy]')].map(b => Number(b.getAttribute('aria-valuenow')));
    expect(barras.every(v => v > 0)).toBe(true);
  });

  it('PvP: o ESPECIAL sai DIRETO — sem anel, sem janela de esquiva, sem botão nenhum de mecânica', () => {
    vi.useFakeTimers();
    const { onDone } = montar();
    let viuEspecial = false;
    for (let i = 0; i < 400 && !onDone.mock.calls.length; i++) {
      act(() => { vi.advanceTimersByTime(200); });
      if (document.querySelector('[data-stage-fx="sm-bs-pop"] img[src*="aura"]')) viuEspecial = true;
      expect(document.querySelector('[data-stage-ring]')).toBeNull();
      expect(document.querySelector('[data-dodge-button]')).toBeNull();
    }
    expect(viuEspecial).toBe(true); // o fantasma e o pet soltaram o especial (aura), sem nenhuma mecânica
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

  it('sem tocar: luta sozinha e entrega as janelas vazias (a torcida só soma)', () => {
    vi.useFakeTimers();
    const { onDone } = montar();
    correr(onDone);
    expect(onDone).toHaveBeenCalledTimes(1);
    const taps = onDone.mock.calls[0][0] as number[];
    expect(taps).toHaveLength(DUEL_CHEER_WINDOWS);
    expect(taps.every(n => n === 0)).toBe(true);
  });

  it('tocar em qualquer lugar enche a barra de cheer e vira toques na 1ª janela, com teto', () => {
    vi.useFakeTimers();
    const { onDone, camada } = montar();
    for (let i = 0; i < 40; i++) fireEvent.pointerDown(camada());
    expect(ratio()).toBeCloseTo(DUEL_TAPS_CAP / DUEL_TAPS_FULL, 1); // o teto por janela limita o que conta (16 de 24)
    correr(onDone);
    const taps = onDone.mock.calls[0][0] as number[];
    expect(taps).toHaveLength(DUEL_CHEER_WINDOWS);
    expect(taps[0]).toBe(DUEL_TAPS_CAP); // 40 toques, mas o teto por janela vale
  });

  it('a barra de cheer é LENTA: 24 toques para encher (16 numa janela não enchem)', () => {
    vi.useFakeTimers();
    const { camada } = montar();
    for (let i = 0; i < DUEL_TAPS_CAP; i++) fireEvent.pointerDown(camada());
    expect(ratio()).toBeLessThan(1);
    expect(DUEL_TAPS_FULL).toBe(24);
  });

  it('o MASCOTE também torce (teclado e leitor de tela) e grita com o balão', () => {
    vi.useFakeTimers();
    montar();
    const btn = screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' }) as HTMLButtonElement;
    fireEvent.click(btn);
    expect(ratio()).toBeGreaterThan(0);
    expect(document.querySelector('[data-cheer-bubble]')?.textContent).toBe('VAI!');
  });

  it('o que a tela manda é o que o servidor recalcula: as mesmas janelas dão a mesma luta, e a tela termina no HP dela', () => {
    vi.useFakeTimers();
    const { onDone, camada } = montar();
    for (let i = 0; i < 14; i++) fireEvent.pointerDown(camada());
    correr(onDone);
    const taps = onDone.mock.calls[0][0] as number[];
    const s = duelStats({ stage: 'rookie' });
    const servidor = simulateDuel({ me: s, opp: s, seed: 123, cheers: taps });
    expect(servidor.events.length).toBeGreaterThan(10);
    const ultimo = servidor.events[servidor.events.length - 1];
    expect(document.querySelector('[data-stage-plate="me"]')?.textContent).toContain(`${ultimo.hpMe}/`);
    // o caído perde a barra (e fica apagado); quem segue de pé mostra o HP final
    const foePlate = document.querySelector('[data-stage-plate="foe"]');
    if (ultimo.hpOpp > 0) expect(foePlate?.textContent).toContain(`${ultimo.hpOpp}/`);
    else expect(foePlate).toBeNull();
  });

  it('o botão de sair não vira torcida: o toque é dele — e sair pede CONFIRMAÇÃO (conta como derrota)', () => {
    vi.useFakeTimers();
    const { onClose } = montar();
    const sair = screen.getByRole('button', { name: 'Sair do duelo' });
    fireEvent.pointerDown(sair);
    fireEvent.click(sair);
    expect(onClose).not.toHaveBeenCalled();
    expect(ratio()).toBe(0);
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
