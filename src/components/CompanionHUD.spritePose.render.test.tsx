// @vitest-environment jsdom
/**
 * HUD x pose do sprite (`utils/spritePose.ts`): flipX inverte a "frente" (e o espelho do
 * passeio), altitude 'air' eleva o sprite (classe + var), a sombra fica no chão.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';

const base = {
  companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!', currentStage: 'rookie',
  evolutionStage: 'rookie', healthPoints: 3, maxHealthPoints: 3, dominantBranch: 'balanced' as const,
  currentXP: 0, nextLevelXP: 10, useAI: false, language: 'pt-BR' as const, energyPoints: 4, maxEnergyPoints: 4,
};
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida')))); });
afterEach(() => { vi.unstubAllGlobals(); });

const sprite = () => document.querySelector<HTMLImageElement>('img[alt="rookie"]')!;
/** O div que carrega o espelho do passeio: ancestral do sprite com `translateX(-50%)`. */
function espelho(): string {
  let el: HTMLElement | null = sprite().parentElement;
  while (el && !/translateX\(-50%\)/.test(el.style.transform)) el = el.parentElement;
  return el!.style.transform;
}

describe('CompanionHUD - pose', () => {
  it('padrão: no chão, sem classe de voo', () => {
    renderWithCss(<CompanionHUD {...base} />);
    expect(sprite().getAttribute('data-pet-altitude')).toBe('ground');
    expect(sprite().className).not.toContain('sm-pet-air');
    expect(espelho()).toMatch(/scaleX\((1|-1)\)/);
  });
  it('flipX inverte o espelho em relação ao padrão', () => {
    const a = renderWithCss(<CompanionHUD {...base} />);
    const sem = espelho();
    a.unmount();
    renderWithCss(<CompanionHUD {...base} spritePose={{ flipX: true }} />);
    expect(espelho()).not.toBe(sem);
  });
  it("altitude 'air': classe de flutuação + elevação; a sombra continua no chão e encolhe", () => {
    renderWithCss(<CompanionHUD {...base} spritePose={{ altitude: 'air' }} />);
    expect(sprite().getAttribute('data-pet-altitude')).toBe('air');
    expect(sprite().className).toContain('sm-pet-air');
    expect(sprite().style.getPropertyValue('--pet-air-lift')).toBe('22px');
    expect(document.querySelector<HTMLElement>('.sm2-pet-shadow')!.style.transform).toContain('scale(.7)');
  });
  it('lixo na pose cai no padrão sem lançar', () => {
    renderWithCss(<CompanionHUD {...base} spritePose={{ flipX: 'x', altitude: 9 } as never} />);
    expect(sprite().getAttribute('data-pet-altitude')).toBe('ground');
  });
  it('movimento reduzido: o CSS corta a flutuação (regra no bloco canônico)', () => {
    const css = readFileSync('src/index.css', 'utf8');
    const bloco = css.slice(css.lastIndexOf('@media (prefers-reduced-motion: reduce)'));
    expect(bloco).toMatch(/\.sm-pet-air\s*\{\s*animation:\s*none\s*!important/);
  });
});
