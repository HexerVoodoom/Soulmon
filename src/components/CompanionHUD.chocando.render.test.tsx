// @vitest-environment jsdom
/**
 * "CHOCANDO" (20/10/2026, dono): com o Soulmon próprio ainda sendo gerado, o visor mostra o cristal com o ser dentro e a
 * legenda "está chocando" — nunca o inicial de reserva (o Meteoro). Quando o sprite chega, a arte própria assume e a legenda some.
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';
import { PLACEHOLDER_ART } from '../utils/placeholderArt';
import { getSpriteForStage, setOwnSprites } from '../utils/sprites';

const base = {
  companionMood: 'idle' as const, energyLevel: 3, message: 'Oi!', currentStage: 'rookie', evolutionStage: 'rookie',
  healthPoints: 3, maxHealthPoints: 3, dominantBranch: 'balanced' as const, currentXP: 0, nextLevelXP: 10,
  useAI: false, language: 'pt-BR' as const, energyPoints: 4, maxEnergyPoints: 8,
};

beforeAll(async () => { await import('./home/Mochila'); await import('./ChatBox'); });
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste')))); });
afterEach(() => { vi.unstubAllGlobals(); setOwnSprites({}); });

describe('Home com o Soulmon chocando', () => {
  it('mostra o cristal e a legenda, em PT e EN', () => {
    const pt = renderWithCss(<CompanionHUD {...base} chocando />);
    expect(pt.container.querySelector('img[alt="rookie"]')!.getAttribute('src')).toBe(PLACEHOLDER_ART.forming);
    expect(pt.container.querySelector('[data-pet-chocando]')!.textContent).toBe('Seu Soulmon está chocando…');
    pt.unmount();
    const en = renderWithCss(<CompanionHUD {...base} language="en-US" chocando />);
    expect(en.container.querySelector('[data-pet-chocando]')!.textContent).toBe('Your Soulmon is hatching…');
  });
  it('sem chocando não há legenda nem cristal', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    expect(container.querySelector('[data-pet-chocando]')).toBeNull();
    expect(container.querySelector('img[alt="rookie"]')!.getAttribute('src')).not.toBe(PLACEHOLDER_ART.forming);
  });
  it('o sprite próprio que chegou vence o cristal e a legenda continua só enquanto chocando', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} chocando ownSpriteUrl="/assets/meu-peixe.png" />);
    expect(container.querySelector('img[alt="rookie"]')!.getAttribute('src')).toBe('/assets/meu-peixe.png');
  });
});

describe('registro dos sprites próprios (todas as outras telas)', () => {
  it('sem registro, tudo como antes (reserva)', () => {
    expect(getSpriteForStage('rookie')).toBe(getSpriteForStage('rookie', undefined));
  });
  it('o sprite adotado aparece em qualquer tela que chame getSpriteForStage sem linha pronta', () => {
    setOwnSprites({ rookie: '/assets/meu-peixe.png' });
    expect(getSpriteForStage('rookie')).toBe('/assets/meu-peixe.png');
    expect(getSpriteForStage('ROOKIE', undefined, 256)).toBe('/assets/meu-peixe.png');
  });
  it('chocando: sem sprite próprio, o cristal substitui o inicial de reserva', () => {
    setOwnSprites({}, PLACEHOLDER_ART.forming);
    expect(getSpriteForStage('rookie')).toBe(PLACEHOLDER_ART.forming);
  });
  it('quem usa uma linha pronta de masmorra (demo) não é afetado', () => {
    setOwnSprites({ rookie: '/assets/meu-peixe.png' }, PLACEHOLDER_ART.forming);
    expect(getSpriteForStage('rookie', 'kaelen')).not.toBe('/assets/meu-peixe.png');
    expect(getSpriteForStage('rookie', 'kaelen')).not.toBe(PLACEHOLDER_ART.forming);
  });
  it('inicial de reserva: o sprite gerado do jogador vence (dono, 21/10/2026)', () => {
    setOwnSprites({ rookie: '/assets/meu-peixe.png' }, PLACEHOLDER_ART.forming);
    expect(getSpriteForStage('rookie', 'meteoro')).toBe('/assets/meu-peixe.png');
  });
});
