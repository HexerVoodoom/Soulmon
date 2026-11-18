// @vitest-environment jsdom
/**
 * O texto do cristal ("chocando", "está no cristal") nao pode herdar o espelho do sprite:
 * o espelho liquido (produto dos scaleX dos ancestrais) tem que ser positivo (17/11/2026).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';

const base = {
  companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!', currentStage: 'rookie',
  evolutionStage: 'rookie', healthPoints: 3, maxHealthPoints: 3, dominantBranch: 'balanced' as const,
  currentXP: 0, nextLevelXP: 10, useAI: false, language: 'pt-BR' as const, energyPoints: 4, maxEnergyPoints: 4,
};
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida')))); });
afterEach(() => { vi.unstubAllGlobals(); });

/** Sinal liquido do espelho horizontal sobre o elemento (-1 = texto ao contrario). */
function sinalDoEspelho(el: HTMLElement): number {
  let sinal = 1;
  for (let n: HTMLElement | null = el; n; n = n.parentElement) {
    const m = n.style.transform.match(/scaleX\((-?\d+(?:\.\d+)?)\)/);
    if (m && Number(m[1]) < 0) sinal *= -1;
  }
  return sinal;
}

describe('CompanionHUD - texto do cristal nao espelha', () => {
  for (const flipX of [false, true]) {
    it(`chocando (flipX=${flipX})`, () => {
      renderWithCss(<CompanionHUD {...base} chocando spritePose={{ flipX }} />);
      const el = document.querySelector<HTMLElement>('[data-pet-chocando]')!;
      expect(el).toBeTruthy();
      expect(sinalDoEspelho(el)).toBe(1);
    });
    it(`cristal (flipX=${flipX})`, () => {
      renderWithCss(<CompanionHUD {...base} emCristal="gerando" spritePose={{ flipX }} />);
      const el = document.querySelector<HTMLElement>('[data-pet-cristal]')!;
      expect(el).toBeTruthy();
      expect(sinalDoEspelho(el)).toBe(1);
    });
  }
});
