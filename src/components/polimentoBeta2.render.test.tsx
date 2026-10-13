// @vitest-environment jsdom
/**
 * Polimento do design-critic beta-2 (13/10/2026): P5 (folha do prédio novo), P6 (contraste da dica do level-up), P7 (cadeado e faísca da
 * evolução), P8 (onde o cocô cai), P11 (vocabulário do Perfil).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { renderWithCss } from '../test/renderEnv';
import { BuildingIntro } from './BuildingIntro';
import { CareSystem, CARE_X_PCT } from './CareSystem';

afterEach(cleanup);
const src = (rel: string) => readFileSync(resolve(__dirname, rel), 'utf8');

describe('P5 — folha do prédio novo', () => {
  it('a ação principal vem primeiro, em largura toda; "Depois/Later" é um botão SECUNDÁRIO (contorno) logo abaixo', () => {
    const { container } = renderWithCss(<BuildingIntro id={'mercado.itens' as never} language="en-US" onGo={vi.fn()} onLater={vi.fn()} />);
    const next = container.querySelector('[data-bi-next], [data-bi-go]') as HTMLElement;
    const later = container.querySelector('[data-bi-later]') as HTMLElement;
    expect(next.compareDocumentPosition(later) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(next.style.width).toBe('100%');
    expect(later.style.width).toBe('100%');
    expect(later.style.getPropertyValue('--sm2-btn')).toBe('outline');
    expect(later.textContent).toBe('Later');
  });
});

describe('P6 — "Tap to continue" do level-up', () => {
  it('usa a tinta `muted` do vidro (#9DBCB4) e o pulso nunca desce de 78% de opacidade', () => {
    const fonte = src('./LevelUpOverlay.tsx');
    expect(fonte).toMatch(/const HINT_INK = '#9DBCB4'/);
    expect(fonte).toMatch(/data-lvup-continue[\s\S]{0,400}color: HINT_INK/);
    expect(fonte).not.toMatch(/data-lvup-continue[\s\S]{0,400}opacity: 0\.85/);
    const css = src('../index.css');
    expect(css).toMatch(/@keyframes sm-lvup-hint \{ 0%, 100% \{ opacity: \.78; \} 50% \{ opacity: 1; \} \}/);
  });
});

describe('P7 — evolução', () => {
  it('o botão "Hold evolution" usa o cadeado FECHADO nos dois estados e a faísca estática (pixels soltos) saiu', () => {
    const fonte = src('./EvolutionPath.tsx');
    expect(fonte).not.toMatch(/name="lock_open"|'lock_open'/);
    expect(fonte).toMatch(/<Icon name="lock" size=\{24\} fill=\{evolutionLocked \? 1 : 0\}/);
    expect(fonte).not.toContain('data-visor-spark');
  });
});

describe('P8 — o cocô/comida não cai sobre a coluna dos cuidados', () => {
  it('x do objeto fica na faixa livre (< 60%, onde os botões de cuidado ainda não chegam)', () => {
    expect(CARE_X_PCT).toBeLessThan(60);
    const { container } = render(<CareSystem careEvent={{ type: 'poop', requestTime: 1, showSprite: true }} onCareEventComplete={() => {}} />);
    expect((container.querySelector('[data-care-poop]') as HTMLElement).style.left).toBe(`${CARE_X_PCT}%`);
  });
});

describe('P11 — vocabulário do Soulsmith', () => {
  it('o Perfil diz "Soulsmith equipment" (EN) e "Equipamento do Soulsmith" (PT) — o termo do Mercado, sem "gear"', () => {
    const fonte = src('./perfil/SoulmonPerfil.tsx');
    expect(fonte).toContain("'Equipamento do Soulsmith' : 'Soulsmith equipment'");
    expect(fonte).not.toMatch(/Soulsmith gear/i);
  });
});
