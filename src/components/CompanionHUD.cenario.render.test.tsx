// @vitest-environment jsdom
/**
 * Beta-2, frente A — 3.2 (mochila fora do sprite), 3.3 (cenário sem linha
 * divisória, HUD dentro do background, slots de fome/timer) e 2.5 (a estabilidade
 * do layout: o que é a caixa fixa e o que fica de fora do fluxo).
 */
import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { CompanionHUD } from './CompanionHUD';
import { GROUND_Y } from '../utils/petStage';

const base = {
  companionMood: 'idle' as const,
  energyLevel: 3,
  message: 'Oi!',
  currentStage: 'rookie',
  evolutionStage: 'rookie',
  healthPoints: 3,
  maxHealthPoints: 3,
  dominantBranch: 'balanced' as const,
  currentXP: 0,
  nextLevelXP: 10,
  useAI: false,
  language: 'en-US' as const,
  energyPoints: 4,
  maxEnergyPoints: 8,
};

beforeAll(async () => { await import('./home/Mochila'); await import('./ChatBox'); });
beforeEach(() => { vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('rede proibida no teste')))); });
afterEach(() => { vi.unstubAllGlobals(); });

describe('3.2 a mochila não aparece junto do sprite', () => {
  it('passeando: nenhuma mochila dentro do grupo do pet; o ícone vive só no botão da funcionalidade', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} walkingTo="Desert Mind" />);
    const grupo = container.querySelector('[data-pet-group]')!;
    expect(grupo.querySelector('img[src*="mochila"], [data-pet-passeando]')).toBeNull();
    const botao = container.querySelector('[data-cuidado="mochila"]') as HTMLElement;
    expect(botao.querySelector('img, svg, .sm2-icon')).not.toBeNull();
    expect(botao.getAttribute('data-walking')).toBe('true');
    expect(botao.getAttribute('aria-label')).toContain('Desert Mind');
    // sprite preservado
    expect(screen.getByAltText('rookie')).toBeTruthy();
  });
  it('sem passeio o botão é só "Backpack" e não carrega o estado', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const botao = container.querySelector('[data-cuidado="mochila"]') as HTMLElement;
    expect(botao.getAttribute('data-walking')).toBeNull();
    expect(botao.getAttribute('aria-label')).toBe('Folder');
  });
});

describe('3.3 cenário: sem linha divisória, HUD dentro do background', () => {
  it('a arte é uma camada própria mascarada: some em degradê ANTES da linha do chão', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const arte = container.querySelector('[data-cena-arte]') as HTMLElement;
    expect(arte).not.toBeNull();
    const mascara = arte.style.maskImage || arte.style.getPropertyValue('-webkit-mask-image') || (arte.getAttribute('style') ?? '');
    expect(mascara).toContain('linear-gradient');
    expect(mascara).toContain(`transparent ${GROUND_Y - 1}%`);
    expect(arte.getAttribute('aria-hidden')).toBe('true');
    expect(arte.style.pointerEvents).toBe('none');
  });
  it('HP, energia e os 3 cuidados moram DENTRO da janela do cenário (não numa faixa abaixo)', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    const cena = container.querySelector('.sm3-cena') as HTMLElement;
    expect(cena.contains(container.querySelector('.sm3-stats'))).toBe(true);
    expect(cena.contains(container.querySelector('.sm3-cuidar'))).toBe(true);
    expect(container.querySelectorAll('.sm3-cuidar .sm3-cuidado')).toHaveLength(3);
  });
  it('os controles encolhem (36) mas o alvo de toque segue 44 (pseudo-elemento de 4px em volta)', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/index.css', 'utf8');
    const bloco = css.match(/\.sm3-cuidado\s*\{[^}]*\}/)![0];
    expect(bloco).toContain('width: 36px');
    expect(bloco).toContain('height: 36px');
    expect(css).toMatch(/\.sm3-cuidado::after\s*\{[^}]*inset:\s*-4px/);
    // 36 + 2×4 = 44
  });
  it('a divisória sumiu: nada no CSS da cena pinta linha na base e as bordas têm degradê', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/index.css', 'utf8');
    const cena = css.slice(css.indexOf('.sm3-cena::before'), css.indexOf('.sm3-cena::after') + 1200);
    expect(cena).toContain('linear-gradient');
    expect(cena).not.toMatch(/border-(top|bottom)\s*:/);
  });
});

describe('3.3 contrato dos slots da faixa de status (frente B: fome e timer de energia)', () => {
  it('sem slots a faixa é a de sempre (HP e energia, nada a mais)', () => {
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    expect(container.querySelectorAll('.sm3-stats [data-stat]')).toHaveLength(2);
    expect(container.querySelector('[data-slot]')).toBeNull();
  });
  it('com slots: o timer fica logo depois do botão de energia e a fome depois dele, dentro da MESMA faixa', () => {
    const { container } = renderWithCss(
      <CompanionHUD {...base} statsSlots={{ energyTimer: <span>12:30</span>, hunger: <span>Hungry</span> }} />,
    );
    const faixa = container.querySelector('.sm3-stats') as HTMLElement;
    const filhos = Array.from(faixa.children).map(c => c.getAttribute('data-stat') ?? c.getAttribute('data-slot'));
    expect(filhos).toEqual(['hp', 'energy', 'energy-timer', 'hunger']);
    expect(faixa.querySelector('[data-slot="energy-timer"]')!.textContent).toBe('12:30');
    expect(faixa.querySelector('[data-slot="hunger"]')!.textContent).toBe('Hungry');
  });
  it('a faixa tem altura TRAVADA no CSS: encaixar os slots não muda o layout', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/index.css', 'utf8');
    const bloco = css.match(/\.sm3-stats\s*\{[^}]*\}/)![0];
    expect(bloco).toContain('height: 20px');
  });
});

describe('2.5 layout estável: texto não empurra cenário nem sprite', () => {
  it('a janela do cenário tem altura FIXA por token e o balão não é irmão dela', async () => {
    const { readFileSync } = await import('node:fs');
    const css = readFileSync('src/index.css', 'utf8');
    expect(css).toMatch(/\.sm3-home-sticky \.sm3-cena\s*\{\s*height:\s*var\(--sm3-cena-h\);\s*overflow:\s*hidden;/);
    const { container } = renderWithCss(<CompanionHUD {...base} />);
    fireEvent.click(screen.getByAltText('rookie'));
    const balao = container.querySelector('[data-pet-bubble-row]') as HTMLElement;
    expect(balao.closest('.sm3-cena')).not.toBeNull();
  });
});
