// @vitest-environment jsdom
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { OvoCristal, LuzBranca, OVO_TOQUES_PARA_BOTOES, LUZ_COR, nivelDaRachadura } from './OnboardingOvo';
import { CRIACAO_ART } from '../utils/criacaoEvolucaoArt';

afterEach(cleanup);

function movimentoReduzido(reduzido: boolean) {
  window.matchMedia = ((q: string) => ({
    matches: reduzido && q.includes('prefers-reduced-motion'), media: q, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}

const montar = (language: 'pt-BR' | 'en-US', comprado = false) => renderWithCss(
  <OvoCristal language={language} comprado={comprado} ocupado={false} onConhecer={() => {}} onGuia={() => {}} onChocar={() => {}} />,
);
const tocar = (c: HTMLElement, n: number) => { for (let i = 0; i < n; i++) fireEvent.click(c.querySelector('[data-ovo-cristal]') as HTMLElement); };

/** Revisão visual 03/11/2026 (dono aprovou P1+P2): cena, rachaduras progressivas, lascas no lugar do "crack", luz turquesa. */
describe('ovo-cristal — cena e progressão por toque', () => {
  it('o cristal está numa cena pintada (fundo + halo) e usa a folha de rachaduras', () => {
    movimentoReduzido(false);
    const { container } = montar('en-US');
    const cena = container.querySelector('[data-ovo-cena]') as HTMLElement;
    expect(cena.style.backgroundImage).toContain(CRIACAO_ART.bg);
    expect((container.querySelector('[data-ovo-halo]') as HTMLImageElement).getAttribute('src')).toBe(CRIACAO_ART.halo);
    expect((container.querySelector('[data-ovo-rachadura]') as HTMLElement).style.backgroundImage).toContain(CRIACAO_ART.crack.src);
  });

  it('as rachaduras sobem em 3 níveis com os toques (0 → 1 → 2) e o comprado já mostra o nível final', () => {
    movimentoReduzido(false);
    expect([0, 1, 2, 3, 4, 5, 9].map(n => nivelDaRachadura(n))).toEqual([0, 0, 1, 1, 1, 2, 2]);
    expect(nivelDaRachadura(0, true)).toBe(2);
    const { container } = montar('en-US');
    const nivel = () => (container.querySelector('[data-ovo-rachadura]') as HTMLElement).getAttribute('data-ovo-rachadura');
    expect(nivel()).toBe('0');
    tocar(container, 2);
    expect(nivel()).toBe('1');
    tocar(container, OVO_TOQUES_PARA_BOTOES - 2);
    expect(nivel()).toBe('2');
  });

  it('sem a palavra "crack": cada toque solta as lascas (FX de 4 quadros), uma por vez', () => {
    movimentoReduzido(false);
    const { container } = montar('pt-BR');
    expect(container.querySelector('[data-ovo-fx]')).toBeNull();
    tocar(container, 1);
    const fx = container.querySelector('[data-ovo-fx]') as HTMLElement;
    expect(fx.getAttribute('aria-hidden')).toBe('true');
    expect(fx.style.backgroundImage).toContain(CRIACAO_ART.fxTouch.src);
    expect(fx.style.animation).toContain('steps(3)');
    expect(container.textContent).not.toContain('crack');
    tocar(container, OVO_TOQUES_PARA_BOTOES - 1);
    expect(container.querySelectorAll('[data-ovo-fx]').length).toBe(1);
    expect(container.querySelector('[data-ovo-botoes]')).toBeTruthy();
  });

  it('o pulso convida o 1º toque e sai depois dele; movimento reduzido: sem convite, sem lascas, halo parado', () => {
    movimentoReduzido(false);
    const a = montar('en-US');
    const pulso = () => a.container.querySelector('[data-ovo-pulso]') as HTMLElement;
    expect(pulso().style.animation).toContain('sm-ovo-convite');
    tocar(a.container, 1);
    expect(pulso().style.animation).toContain('sm-ovo-balanco');
    a.unmount();
    movimentoReduzido(true);
    const b = montar('en-US');
    expect((b.container.querySelector('[data-ovo-pulso]') as HTMLElement).style.animation).toBe('none');
    expect((b.container.querySelector('[data-ovo-halo]') as HTMLElement).style.animation).toBe('none');
    tocar(b.container, 1);
    expect(b.container.querySelector('[data-ovo-fx]')).toBeNull();
  });

  it('hierarquia: a COMPRA é o primário e aparece ANTES do "Chocar"; o guia é link discreto', () => {
    movimentoReduzido(false);
    const a = montar('pt-BR');
    expect(a.container.querySelector('[data-ovo-chocar]')).toBeNull();
    tocar(a.container, OVO_TOQUES_PARA_BOTOES);
    const conhecer = a.container.querySelector('[data-ovo-conhecer]') as HTMLElement;
    const guia = a.container.querySelector('[data-ovo-guia]') as HTMLElement;
    expect(conhecer.textContent).toBe('Conhecer o seu Soulmon');
    expect(guia.hasAttribute('data-ovo-link')).toBe(true);
    expect(guia.style.textDecoration).toContain('underline');
    expect(parseInt(guia.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    expect(a.container.querySelector('[data-ovo-chocar]')).toBeNull(); // Chocar só depois da compra
    a.unmount();
    const b = montar('pt-BR', true);
    expect(b.container.querySelector('[data-ovo-chocar]')).toBeTruthy();
    expect(b.container.querySelector('[data-ovo-conhecer]')).toBeNull();
  });
});

describe('luz de Chocar — turquesa, não branco puro', () => {
  it('expande com a estrela de luz turquesa; reduzido é fade na mesma cor', () => {
    movimentoReduzido(false);
    const a = renderWithCss(<LuzBranca fase="expande" />);
    const disco = a.container.querySelector('[data-luz-branca] div') as HTMLElement;
    expect(disco.style.background).toContain(CRIACAO_ART.hatchLight);
    expect(LUZ_COR.toUpperCase()).not.toBe('#FFFFFF');
    a.unmount();
    movimentoReduzido(true);
    const b = renderWithCss(<LuzBranca fase="expande" />);
    expect(b.container.querySelector('[data-luz-branca]')!.getAttribute('data-luz-cor')).toBe(LUZ_COR);
  });
});
