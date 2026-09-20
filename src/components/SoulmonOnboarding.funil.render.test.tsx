// @vitest-environment jsdom
/**
 * Canvas Onboarding-funil — identidade (DECISÕES §23, 20/09/2026), o caminho
 * grátis: perguntas abertas puláveis com eco, bifurcação sem empurrão,
 * os 6 personagens num vidro 128² com anel, o cadastro demo com a heroína
 * no vidro 192² e as tonalidades como slots 64.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithCss, installFakeStorage } from '../test/renderEnv';
import { SoulmonOnboarding } from './SoulmonOnboarding';
import { PREMADE_CHARACTERS } from '../utils/monetization';
import { DEMO_TINTS } from '../utils/sprites';

const btn = (nome: string | RegExp) => screen.getByRole('button', { name: nome }) as HTMLButtonElement;
const variante = (b: HTMLElement) => b.style.getPropertyValue('--sm2-btn');

function passarPortao() {
  fireEvent.click(screen.getByText('I have read and agree to the Terms of Use and the Privacy Policy'));
  fireEvent.click(screen.getByText('I am 18 or older'));
  fireEvent.click(btn('Continue'));
}

describe('funil grátis — identidade do canvas', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-20T12:00:00Z'));
    installFakeStorage();
    renderWithCss(<SoulmonOnboarding onComplete={() => {}} />);
    passarPortao();
  });
  afterEach(() => { vi.useRealTimers(); });

  it('Objetivo: justificativa (O2), campo SIS-03, pular é quiet, sem Back', () => {
    expect(screen.getByText('Your Soulmon brings this back on the days that count.')).toBeTruthy();
    const area = screen.getByLabelText('What do you want to improve in your life?') as HTMLTextAreaElement;
    // `autoFocus`: nasce focado — fronteira + anel `primary-ink`; ao sair, `muted`.
    expect(area.getAttribute('style')).toContain('1px solid var(--sm2-primary-ink)');
    fireEvent.blur(area);
    expect(area.getAttribute('style')).toContain('1px solid var(--sm2-muted)');
    expect(area.style.minHeight).toBe('96px');
    expect(variante(btn('Continue'))).toBe('primary');
    expect(variante(btn('I’d rather not say right now'))).toBe('quiet');
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
  });

  it('Atrapalha: eco com check_circle em primary-ink só para quem escreveu; Back quiet volta', () => {
    const area = screen.getByLabelText('What do you want to improve in your life?');
    fireEvent.change(area, { target: { value: 'get back to studying' } });
    fireEvent.click(btn('Continue'));
    const eco = screen.getByText('Noted. Your Soulmon will remember.');
    expect(eco.style.color).toBe('var(--sm2-primary-ink)');
    expect(eco.querySelector('.sm2-icon')).toBeTruthy();
    const back = btn('Back');
    expect(variante(back)).toBe('quiet');
    fireEvent.click(back);
    expect(screen.getByText('What do you want to improve in your life?')).toBeTruthy();
  });

  it('Atrapalha sem objetivo escrito: nenhum eco (a frase viraria mentira)', () => {
    fireEvent.click(btn('I’d rather not say right now'));
    expect(screen.queryByText('Noted. Your Soulmon will remember.')).toBeNull();
  });

  it('Escolha: grátis primário, "Get the full game" outline (não ghost, não quiet, sem dourado), Back quiet', () => {
    fireEvent.click(btn('I’d rather not say right now'));
    fireEvent.click(btn('I’d rather not say right now'));
    expect(variante(btn('Start now — it’s free'))).toBe('primary');
    const pago = btn(/Get the full game/);
    expect(variante(pago)).toBe('outline');
    expect(pago.style.color).toBe('var(--sm2-ink)');
    expect(variante(btn('Back'))).toBe('quiet');
  });

  it('EscolherPersonagem: os 6 de PREMADE_CHARACTERS, cada um num vidro 128² com anel, em grade 2 colunas', () => {
    fireEvent.click(btn('I’d rather not say right now'));
    fireEvent.click(btn('I’d rather not say right now'));
    fireEvent.click(btn('Start now — it’s free'));
    const cards = document.querySelectorAll('button[data-demo-char]');
    expect(cards.length).toBe(PREMADE_CHARACTERS.length);
    expect(cards.length).toBe(6);
    expect((cards[0].parentElement as HTMLElement).style.gridTemplateColumns).toContain('repeat(2');
    for (const c of cards) {
      const anel = c.querySelector('.sm2-viewport')!;
      const vidro = c.querySelector('.sm2-viewport-screen') as HTMLElement;
      expect(anel).toBeTruthy();
      expect(vidro.style.width).toBe('128px');
      expect(vidro.style.height).toBe('128px');
      const img = vidro.querySelector('img') as HTMLImageElement;
      expect(img.width).toBe(128);
      expect(c.getAttribute('aria-label')).toContain(' — ');
    }
  });

  it('CadastroDemo: heroína 128 num vidro 192² `role=img` na tonalidade; 4 slots 64 com hue-rotate; Back volta aos personagens', () => {
    fireEvent.click(btn('I’d rather not say right now'));
    fireEvent.click(btn('I’d rather not say right now'));
    fireEvent.click(btn('Start now — it’s free'));
    fireEvent.click(screen.getByText(PREMADE_CHARACTERS[0].name).closest('button')!);
    const nome = PREMADE_CHARACTERS[0].name;
    const hero = screen.getByRole('img', { name: `${nome}, in tint 1` });
    const vidro = hero.querySelector('.sm2-viewport-screen') as HTMLElement;
    expect(vidro.style.width).toBe('192px');
    const img = vidro.querySelector('img[data-hero]') as HTMLImageElement;
    expect(img.style.width).toBe('128px');
    expect(img.style.filter).toBe('');
    const grupo = screen.getByRole('group', { name: 'Tint' });
    const slots = grupo.querySelectorAll('button');
    expect(slots.length).toBe(DEMO_TINTS.length);
    for (const s of slots) {
      const vidro64 = s.querySelector('.sm2-viewport-screen') as HTMLElement;
      expect(vidro64.style.width).toBe('64px');
      expect((vidro64.querySelector('img') as HTMLImageElement).width).toBe(64);
    }
    expect((slots[0].querySelector('.sm2-viewport-screen') as HTMLElement).style.boxShadow).toContain('var(--sm2-primary-ink)');
    fireEvent.click(slots[1]);
    expect(screen.getByRole('img', { name: `${nome}, in tint 2` })).toBeTruthy();
    expect((document.querySelector('img[data-hero]') as HTMLImageElement).style.filter).toBe(`hue-rotate(${DEMO_TINTS[1]}deg)`);
    expect((slots[1].querySelector('img') as HTMLImageElement).style.filter).toBe(`hue-rotate(${DEMO_TINTS[1]}deg)`);
    expect((slots[0].querySelector('.sm2-viewport-screen') as HTMLElement).style.boxShadow).toBe('');
    // Back `[novo]`: volta à escolha do personagem, nunca a um reveal vazio.
    fireEvent.click(btn('Back'));
    expect(screen.getByText('Choose your Soulmon')).toBeTruthy();
  });
});
