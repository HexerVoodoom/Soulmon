// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MapPage } from './MapPage';
import { aquecerRender, computed, renderWithCss } from '../../test/renderEnv';

beforeAll(aquecerRender, 60_000);
afterEach(cleanup);

const css = readFileSync(join(__dirname, '../../index.css'), 'utf8');
const bloco = (sel: string) => {
  const ini = css.indexOf(`\n${sel} {`);
  if (ini < 0) return '';
  return css.slice(css.indexOf('{', ini) + 1, css.indexOf('}', ini));
};

describe('MapPage: as 3 pílulas de moeda são iguais (24/11/2026)', () => {
  for (const vw of [360, 375, 412]) {
    it(`${vw}px: Bits, Honra e Créditos com 99.999 têm a mesma largura fixa e não encolhem`, () => {
      Object.defineProperty(window, 'innerWidth', { value: vw, configurable: true });
      const { container } = renderWithCss(<MapPage language="pt-BR" onOpenArea={() => {}} bits={99999} emblems={99999} credits={99999} />);
      const pills = Array.from(container.querySelectorAll('[data-map-currencies] > [data-info-tip]')) as HTMLElement[];
      expect(pills).toHaveLength(3);
      for (const p of pills) {
        expect(p.classList.contains('sm2-moeda')).toBe(true);
        expect(p.querySelector('.sm2-moeda__val')!.textContent).toBe('99.999');
        expect(p.querySelector('img, svg, [data-bits-kind]')).not.toBeNull();
        expect(p.textContent).toBe('99.999');
        expect(computed(p, 'width')).toBe('var(--sm2-moeda-w)');
        expect(computed(p, 'flex-shrink')).toBe('0');
        expect(computed(p, 'white-space')).toBe('nowrap');
      }
      expect(new Set(pills.map(p => computed(p, 'width'))).size).toBe(1);
      const hud = container.querySelector('[data-map-currencies]') as HTMLElement;
      expect(computed(hud, 'gap')).toBe('var(--sm2-space-3)');
      expect(computed(hud, 'flex-direction')).toBe('column');
    });
  }

  it('regras no index.css: largura fixa por token, flex-shrink 0, gap por token, números tabulares, sem all:unset', () => {
    const pill = bloco('.sm2-moeda');
    expect(pill).toMatch(/width:\s*var\(--sm2-moeda-w\)/);
    expect(pill).toMatch(/min-width:\s*var\(--sm2-moeda-w\)/);
    // `flex-basis` NÃO pode ser a largura: num HUD em coluna o basis vira ALTURA (pílulas de 96px de altura).
    expect(pill).toMatch(/flex:\s*0 0 auto/);
    expect(pill).not.toMatch(/flex:[^;]*var\(--sm2-moeda-w\)/);
    expect(pill).toMatch(/tabular-nums/);
    // fundo translúcido do tema + raio por token (sem moldura nem borda)
    const miolo = bloco('.sm2-moeda__in');
    expect(miolo).toContain('background: var(--sm2-moeda-fundo)');
    expect(miolo).toContain('border-radius: var(--sm2-radius-md)');
    expect(miolo).toContain('min-height: 32px');
    expect(css).toContain('--sm2-moeda-fundo: color-mix(in srgb, var(--sm2-bg) 80%, transparent)');
    expect(bloco('.sm2-moeda-hud')).toMatch(/gap:\s*var\(--sm2-space-3\)/);
    expect(bloco('.sm2-moeda__in')).toMatch(/gap:\s*var\(--sm2-space-1\)/);
    expect(css).toMatch(/--sm2-moeda-w:\s*96px/);
    for (const s of ['.sm2-moeda', '.sm2-moeda-hud', '.sm2-moeda__in', '.sm2-moeda__val']) {
      expect(bloco(s)).not.toMatch(/all:\s*unset|#[0-9a-f]{3,8}\b/i);
    }
  });

  it('valor em EN usa vírgula de milhar e o rótulo acessível segue o idioma', () => {
    const { container } = renderWithCss(<MapPage language="en-US" onOpenArea={() => {}} bits={99999} emblems={5} credits={7} />);
    const labels = Array.from(container.querySelectorAll('[data-map-currencies] > [data-info-tip]')).map(b => b.getAttribute('aria-label'));
    expect(labels[0]).toBe('99,999 Bits — how to earn');
    expect(labels[1]).toBe('5 Honor — how to earn');
    expect(labels[2]).toBe('7 Credits — how to get');
  });
});
