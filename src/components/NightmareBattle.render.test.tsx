// @vitest-environment jsdom
/**
 * Pesadelo (02/10/2026): o convite mostra uma criatura que já existe (C1) e a
 * luta é de TORCIDA (C2) — o Soulmon golpeia sozinho, o toque em qualquer lugar
 * enche o gauge e o gauge cheio vira o golpe especial.
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, act, fireEvent, cleanup } from '@testing-library/react';
import { NightmareBattle } from './NightmareBattle';
import { DUNGEON_LINE_SPRITES } from '../utils/sprites';
import { TORCIDA_TAPS_FULL } from '../utils/torcida';
import type { DungeonEnemy } from '../utils/dungeon';

afterEach(() => { cleanup(); vi.useRealTimers(); });

const inimigo = (hp: number): DungeonEnemy => ({
  name: 'Sombra', stage: 'rookie', sprite: DUNGEON_LINE_SPRITES.lumel.rookie,
  hp, atk: 1, speed: 1, points: 1, dmgReduction: 0,
});

function montar(wave: DungeonEnemy[]) {
  return render(
    <NightmareBattle
      open wave={wave} rarity="common" petStage="rookie" language="pt-BR"
      onWin={() => {}} onLose={() => {}} onClose={() => {}}
    />,
  );
}

describe('Pesadelo — convite', () => {
  it('C1: usa uma criatura que já existe (linha própria), não a bolha roxa dungeon-spirit', () => {
    const { container } = montar([inimigo(5)]);
    const img = container.querySelector('[data-visor-enemy]') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe(DUNGEON_LINE_SPRITES.ignar.champion);
    expect(img.getAttribute('src') ?? '').not.toMatch(/dungeon-spirit/);
  });
});

describe('Pesadelo — torcida', () => {
  it('não há barra de timing para atacar: o golpe sai sozinho', () => {
    vi.useFakeTimers();
    const { container } = montar([inimigo(40)]);
    fireEvent.click(screen.getByRole('button', { name: 'Ficar na frente dele' }));
    expect(container.querySelector('[data-timing-bar]')).toBeNull();
    expect(container.querySelector('[data-torcida-gauge]')).not.toBeNull();
    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText('O Soulmon golpeia!')).toBeTruthy();
  });

  it('com o gauge cheio por toques, o próximo golpe é o ESPECIAL e o gauge zera', () => {
    vi.useFakeTimers();
    const { container } = montar([inimigo(60)]);
    fireEvent.click(screen.getByRole('button', { name: 'Ficar na frente dele' }));
    const camada = container.querySelector('[data-torcida-layer]') as HTMLElement;
    for (let i = 0; i < TORCIDA_TAPS_FULL; i++) fireEvent.pointerDown(camada);
    expect(container.querySelector('[data-torcida-gauge]')!.getAttribute('data-torcida-full')).toBe('1');
    act(() => { vi.advanceTimersByTime(1400); });
    expect(screen.getByText('Golpe especial da torcida!')).toBeTruthy();
    expect(container.querySelector('[data-torcida-gauge]')!.getAttribute('data-torcida-full')).toBe('0');
  });
});

describe('Pesadelo — defesa automática (TORC-3, 02/10/2026)', () => {
  it('sem barra de esquiva: o Soulmon se defende sozinho e a luta segue sem nenhum toque', () => {
    vi.useFakeTimers();
    const { container } = montar([inimigo(60)]);
    fireEvent.click(screen.getByRole('button', { name: 'Ficar na frente dele' }));
    act(() => { vi.advanceTimersByTime(1400); }); // o golpe sai sozinho
    act(() => { vi.advanceTimersByTime(1300); }); // o popup passa e abre a defesa
    expect(container.querySelector('[data-timing-bar]')).toBeNull();
    expect(container.querySelector('[data-auto-defense]')).not.toBeNull();
    expect(screen.queryByText('Desviar!')).toBeNull();
    act(() => { vi.advanceTimersByTime(1000); }); // a defesa automática resolve
    expect(screen.getByText(/Defendeu|Levou o golpe/)).toBeTruthy();
    act(() => { vi.advanceTimersByTime(1300); }); // e a vez volta para o golpe do Soulmon
    expect(container.querySelector('[data-auto-defense]')).toBeNull();
    expect(screen.getByText(/torça por ele/i)).toBeTruthy();
  });
});
