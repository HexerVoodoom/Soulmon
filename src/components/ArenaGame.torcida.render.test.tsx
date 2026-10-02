// @vitest-environment jsdom
/**
 * O DUELO DA ARENA com TORCIDA por toques (H14, 02/10/2026, REGISTRO §20).
 *
 * O pet golpeia SOZINHO; o dono torce tocando em qualquer lugar; o gauge cheio
 * (8 toques) vira um golpe de torcida gasto pelo pet. A esquiva SAIU
 * (TORC-3): o pet se defende sozinho (`utils/autoDefesa.ts`). O caminho antigo (barra de ataque) está atrás de
 * `ARENA_TIMING_ATTACK_ENABLED` e é coberto por `ArenaGame.render.test.tsx`.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { ArenaGame } from './ArenaGame';
import {
  ARENA_AUTO_ACC, ARENA_TIMING_ATTACK_ENABLED, ARENA_TORCIDA_MULT, playerHitDamage,
} from '../utils/arena';
import { TORCIDA_TAPS_FULL } from '../utils/torcida';

const POOL = [{
  nome: 'irrelevante', elementos: ['fogo'],
  atributos: { forca: 5, inteligencia: 5, velocidade: 5, magia: 5 },
  tamanho: 'medio', hostilidade: 5,
}];

vi.mock('../utils/arena', async importOriginal => {
  const real = await importOriginal<typeof import('../utils/arena')>();
  return {
    ...real,
    loadBestiaryPool: vi.fn(async () => POOL),
    playerHitDamage: vi.fn(real.playerHitDamage),
  };
});
vi.mock('./pixel/TimingBar', () => ({
  TimingBar: ({ label, onStop }: { label: string; onStop: (a: number) => void }) => (
    <button onClick={() => onStop(1)}>{label}</button>
  ),
}));
vi.mock('../utils/sounds', () => ({ playTaskComplete: vi.fn(), playFeed: vi.fn() }));
vi.mock('../utils/sprites', () => ({
  getDungeonEnemySprite: () => ({ sprite: 'x.png', name: 'x', line: 'x' }),
  getSpriteForStage: () => 'pet.png',
}));

async function entrar(language: 'pt-BR' | 'en-US' = 'pt-BR') {
  renderWithCss(<ArenaGame evolutionStage="rookie" language={language} onExit={() => {}} />);
  await act(async () => { await Promise.resolve(); await Promise.resolve(); });
  fireEvent.click(screen.getByRole('button', { name: /Entrar na Arena|Enter the Arena/i }));
}
const camada = () => document.querySelector('[data-torcida-layer]') as HTMLElement;
const gauge = () => document.querySelector('[data-torcida-gauge]') as HTMLElement;
const avancar = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });
const hit = vi.mocked(playerHitDamage);

beforeEach(() => { vi.useFakeTimers(); hit.mockClear(); });
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('Duelo da Arena — o pet golpeia sozinho e a torcida soma', () => {
  it('a barra de ataque está DESLIGADA (flag) e o gauge de torcida aparece na luta', async () => {
    expect(ARENA_TIMING_ATTACK_ENABLED).toBe(false);
    await entrar();
    expect(screen.queryByText('Atacar!')).toBeNull();
    expect(gauge()).not.toBeNull();
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
    expect(screen.getByText(/ataca sozinho/i)).toBeTruthy();
  });

  it('a intro explica a torcida e que o Soulmon se defende sozinho', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    expect(document.querySelector('[data-arena-torcida-legenda]')?.textContent).toMatch(/torce tocando na tela/i);
    expect(document.querySelector('[data-arena-torcida-legenda]')?.textContent).toMatch(/se defende sozinho/i);
  });

  it('sem torcer: o pet ataca sozinho com a precisão fixa, golpe-base (multiplicador 1), e a defesa abre', async () => {
    await entrar();
    avancar(2000);
    expect(hit).toHaveBeenCalledTimes(1);
    const [, acc, , skillMult] = hit.mock.calls[0];
    expect(acc).toBe(ARENA_AUTO_ACC);
    expect(skillMult ?? 1).toBe(1); // a torcida só soma: sem toque, é o golpe de sempre
    // A esquiva por timing saiu (TORC-3): nenhuma barra, o pet se defende sozinho.
    expect(screen.queryByText('Desviar!')).toBeNull();
    expect(document.querySelector('[data-auto-defense]')).not.toBeNull();
  });

  it('a defesa é AUTOMÁTICA: sem nenhum toque, o revide se resolve sozinho e o turno volta para o ataque', async () => {
    await entrar();
    avancar(2000);
    expect(document.querySelector('[data-auto-defense]')).not.toBeNull();
    avancar(1000);
    expect(document.querySelector('[data-auto-defense]')).toBeNull();
    expect(screen.getByText(/ataca sozinho/i)).toBeTruthy();
  });

  it('tocar em qualquer lugar enche o gauge; cheio, o pet GASTA num golpe ×torcida e o gauge zera', async () => {
    await entrar();
    for (let i = 0; i < TORCIDA_TAPS_FULL; i++) fireEvent.pointerDown(camada());
    expect(gauge().getAttribute('data-torcida-full')).toBe('1');
    avancar(2000);
    expect(hit).toHaveBeenCalledTimes(1);
    expect(hit.mock.calls[0][3]).toBe(ARENA_TORCIDA_MULT);
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
    expect(screen.getByText(/Golpe da torcida/i)).toBeTruthy();
  });

  it('toque a mais não rende: 40 toques valem o mesmo golpe que 8, e o excedente não sobra', async () => {
    await entrar();
    for (let i = 0; i < 40; i++) fireEvent.pointerDown(camada());
    avancar(2000);
    expect(hit.mock.calls[0][3]).toBe(ARENA_TORCIDA_MULT);
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
  });

  it('gauge pela metade não vira golpe de torcida e SOBRA para o próximo turno', async () => {
    await entrar();
    for (let i = 0; i < TORCIDA_TAPS_FULL - 3; i++) fireEvent.pointerDown(camada());
    avancar(2000);
    expect(hit.mock.calls[0][3] ?? 1).toBe(1);
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
    // 5 toques ficaram guardados: mais 3 enchem o gauge no turno seguinte.
    avancar(1000); // o Soulmon se defende sozinho e o turno volta
    for (let i = 0; i < 3; i++) fireEvent.pointerDown(camada());
    expect(gauge().getAttribute('data-torcida-full')).toBe('1');
  });

  it('o botão Torcer! torce (teclado e leitor de tela) e o de sair não vira torcida', async () => {
    const onExit = vi.fn();
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={onExit} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    fireEvent.click(screen.getByRole('button', { name: /Entrar na Arena/i }));
    const sair = screen.getByRole('button', { name: /^Sair$/ });
    fireEvent.pointerDown(sair);
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
    const torcer = screen.getByRole('button', { name: 'Torcer pelo seu Soulmon' });
    for (let i = 0; i < TORCIDA_TAPS_FULL; i++) fireEvent.click(torcer);
    expect(gauge().getAttribute('data-torcida-full')).toBe('1');
  });

  it('antes da luta (intro) o toque não vale nada', async () => {
    renderWithCss(<ArenaGame evolutionStage="rookie" language="pt-BR" onExit={() => {}} />);
    await act(async () => { await Promise.resolve(); await Promise.resolve(); });
    for (let i = 0; i < 10; i++) fireEvent.pointerDown(camada());
    fireEvent.click(screen.getByRole('button', { name: /Entrar na Arena/i }));
    expect(gauge().getAttribute('data-torcida-full')).toBe('0');
  });

  it('em inglês: "Cheer!" e nada de português na luta', async () => {
    await entrar('en-US');
    expect(screen.getByRole('button', { name: 'Cheer for your Soulmon' })).toBeTruthy();
    expect(screen.getByText(/strikes on its own/i)).toBeTruthy();
    const texto = document.body.textContent ?? '';
    for (const palavra of ['Torcer', 'torcida', 'sozinho', 'Rodada']) {
      expect(texto.includes(palavra), `"${palavra}" vazou para a tela em inglês`).toBe(false);
    }
  });
});
