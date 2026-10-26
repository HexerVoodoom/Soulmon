// @vitest-environment jsdom
/** Soulmon ausente (masmorra/missão) não fala: nem idle, nem toque. Presente, fala. */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent, act, cleanup } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';

const base = {
  companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!',
  currentStage: 'rookie', evolutionStage: 'rookie', healthPoints: 3, maxHealthPoints: 3,
  dominantBranch: 'balanced' as const, currentXP: 0, nextLevelXP: 10,
  useAI: true, language: 'pt-BR' as const, energyPoints: 4, maxEnergyPoints: 4,
};
const bolha = () => (document.querySelector('[role="status"], [aria-live]')?.textContent ?? '').trim();

beforeEach(() => { vi.useFakeTimers(); vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('x')))); });
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('CompanionHUD ausente fica mudo', () => {
  for (const [nome, extra] of [['masmorra', { naMasmorra: true }], ['missão', { missionAway: true }]] as const) {
    it(`${nome}: 10 min de ócio + toques não mostram fala`, async () => {
      renderWithCss(<CompanionHUD {...base} {...extra} />);
      await act(async () => { await vi.advanceTimersByTimeAsync(10 * 60_000); });
      const pet = document.querySelector('img[alt="rookie"]') ?? document.querySelector('[data-pet-sprite]');
      if (pet) for (let i = 0; i < 3; i++) { fireEvent.click(pet); await act(async () => { await vi.advanceTimersByTimeAsync(10); }); }
      expect(bolha()).toBe('');
    });
  }
  it('presente: o ócio de 3 min gera fala (controle)', async () => {
    renderWithCss(<CompanionHUD {...base} />);
    await act(async () => { await vi.advanceTimersByTimeAsync(3 * 60_000 + 100); });
    expect(bolha().length).toBeGreaterThan(0);
  });
});
