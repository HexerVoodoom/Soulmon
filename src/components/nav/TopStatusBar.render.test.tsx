// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { cleanup, fireEvent } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MapPage } from './MapPage';
import { AreaSheet } from './AreaSheet';
import { TopStatusBar, TopStatusBarContext, abreviar, formatEnergia, type TopStatusBarData } from './TopStatusBar';
import { aquecerRender, computed, renderWithCss } from '../../test/renderEnv';

beforeAll(aquecerRender, 60_000);
afterEach(() => { cleanup(); document.documentElement.style.removeProperty('--sm2-topbar-push'); });

const css = readFileSync(join(__dirname, '../../index.css'), 'utf8');
const bloco = (sel: string) => {
  const ini = css.indexOf(`\n${sel} {`);
  if (ini < 0) return '';
  return css.slice(css.indexOf('{', ini) + 1, css.indexOf('}', ini));
};
const token = (nome: string) => Number(new RegExp(`${nome}:\\s*(\\d+)px`).exec(css)![1]);

const dados: TopStatusBarData = { language: 'pt-BR', credits: 99999, emblems: 1234, bits: 5000, energy: 6, maxEnergy: 6 };
const slots = (c: HTMLElement) => Array.from(c.querySelectorAll('[data-topbar] [data-topbar-slot]')) as HTMLElement[];

describe('TopStatusBar: ordem, abreviação e rótulos', () => {
  it('4 slots na ordem do dono: Bits | Energia (esq.), vazio no meio, Honra | Créditos (dir.)', () => {
    const { container } = renderWithCss(<TopStatusBar data={dados} />);
    expect(slots(container).map(s => s.getAttribute('data-topbar-slot'))).toEqual(['bits', 'energia', 'honra', 'credito']);
    const [esq, dir] = Array.from(container.querySelectorAll('.sm2-topbar__grupo'));
    expect(esq.querySelectorAll('[data-topbar-slot]')).toHaveLength(2);
    expect(dir.querySelectorAll('[data-topbar-slot]')).toHaveLength(2);
    expect(container.querySelector('[data-topbar-slot="coracoes"]')).toBeNull();
  });

  it('valores: 99999 → 99k, 1234 → 1,2k (PT), Bits 5.000, energia "6/6"', () => {
    const { container } = renderWithCss(<TopStatusBar data={dados} />);
    expect(slots(container).map(s => s.textContent)).toEqual(['5.000', '6/6', '1,2k', '99k']);
  });

  it('abreviar: 99999 → 99k, 1234 → 1.2k (EN), 999 intacto, Bits só abreviam a partir de 10 mil', () => {
    expect(abreviar(99999, 'en-US')).toBe('99k');
    expect(abreviar(1234, 'en-US')).toBe('1.2k');
    expect(abreviar(1000, 'en-US')).toBe('1k');
    expect(abreviar(999, 'en-US')).toBe('999');
    expect(abreviar(5000, 'pt-BR', 10000)).toBe('5.000'); // `de` ainda existe, mas a barra abreviar Bits desde 1.000 (slot de 70 px a 14 px)
    expect(abreviar(12000, 'pt-BR', 10000)).toBe('12k');
  });

  it('formatEnergia: 6/6 → 6/6; 10/10 → 10; 7/12 → 7', () => {
    expect(formatEnergia(6, 6)).toBe('6/6');
    expect(formatEnergia(10, 10)).toBe('10');
    expect(formatEnergia(7, 12)).toBe('7');
  });

  it('aria-label por slot (PT e EN) e toque >= 44 de altura', () => {
    const pt = renderWithCss(<TopStatusBar data={dados} />);
    const nomes = Array.from(pt.container.querySelectorAll('[data-info-tip]')).map(b => b.getAttribute('aria-label'));
    expect(nomes).toEqual(['5.000 Bits — como conseguir', 'Energia: 6 de 6', '1.234 de Honra — como conseguir', '99.999 Créditos — como conseguir']);
    cleanup();
    const en = renderWithCss(<TopStatusBar data={{ ...dados, language: 'en-US' }} />);
    const names = Array.from(en.container.querySelectorAll('[data-info-tip]')).map(b => b.getAttribute('aria-label'));
    expect(names).toEqual(['5,000 Bits — how to earn', 'Energy: 6 of 6', '1,234 Honor — how to earn', '99,999 Credits — how to get']);
    for (const b of Array.from(en.container.querySelectorAll('[data-info-tip]')) as HTMLElement[]) {
      expect(Number.parseFloat(b.style.minHeight)).toBeGreaterThanOrEqual(44);
    }
  });

  it('toque no slot abre a dica (nota) e a barra publica --sm2-topbar-push na raiz enquanto está montada', () => {
    const { container, unmount } = renderWithCss(<TopStatusBar data={dados} />);
    expect(document.documentElement.style.getPropertyValue('--sm2-topbar-push')).toBe('var(--sm2-topbar-h)');
    fireEvent.click(container.querySelector('[data-info-tip][aria-label^="5.000 Bits"]')!);
    expect(document.querySelector('[role="note"]')!.textContent).toMatch(/minijogos/);
    unmount();
    expect(document.documentElement.style.getPropertyValue('--sm2-topbar-push')).toBe('');
  });

  it('dicas de Bits, Honra e Créditos (PT)', () => {
    const { container } = renderWithCss(<TopStatusBar data={dados} />);
    const dica = (pref: string) => { fireEvent.click(container.querySelector(`[data-info-tip][aria-label^="${pref}"]`)!); const t = document.querySelector('[role="note"]')!.textContent ?? ''; fireEvent.pointerDown(document.body); return t; };
    expect(dica('5.000 Bits')).toMatch(/minijogos/);
    expect(dica('1.234 de Honra')).toMatch(/Torneio/);
    expect(dica('99.999 Créditos')).toMatch(/dinheiro real/);
  });

  it('sem prop e sem contexto não renderiza nada', () => {
    const { container } = renderWithCss(<TopStatusBar />);
    expect(container.querySelector('[data-topbar]')).toBeNull();
  });
});

describe('TopStatusBar: geometria nas larguras 360/375/412 (regras lidas do index.css)', () => {
  const margem = token('--sm2-topbar-margem');
  const gap = token('--sm2-topbar-gap');
  const w = token('--sm2-topbar-slot-w');
  const esq = w * 2 + gap;
  const dir = esq;
  for (const [vw, folga] of [[360, 32], [375, 47], [412, 84]] as const) {
    it(`${vw}px: cabe sem rolagem horizontal, sem sobreposição, folga central >= ${folga}`, () => {
      expect(margem).toBe(8);
      expect(gap).toBe(4);
      expect(margem + esq + gap + dir + margem).toBeLessThanOrEqual(vw); // `gap` = vão mínimo entre os dois grupos
      expect(vw - margem * 2 - esq - dir).toBeGreaterThanOrEqual(folga);
      // Créditos colado à direita (margem 8); 4 slots de 76 px, o meio fica vazio
      expect(w).toBe(76);
      expect(vw - margem - w).toBe({ 360: 276, 375: 291, 412: 328 }[vw]);
      expect(vw - margem - dir).toBe({ 360: 196, 375: 211, 412: 248 }[vw]);
    });
  }

  it('o DOM e o CSS: faixa fixa no topo, grupos nas pontas, slots de largura por token, sem rolagem', () => {
    Object.defineProperty(window, 'innerWidth', { value: 360, configurable: true });
    const { container } = renderWithCss(<TopStatusBar data={dados} />);
    const bar = container.querySelector('[data-topbar]') as HTMLElement;
    expect(computed(bar, 'position')).toBe('fixed');
    expect(computed(bar, 'top')).toBe('0px');
    expect(computed(bar, 'justify-content')).toBe('space-between');
    expect(computed(bar, 'overflow')).toBe('hidden');
    const largura = (cls: string) => computed(container.querySelector(`.${cls}`)!, 'width');
    expect(largura('sm2-topbar__slot')).toBe('var(--sm2-topbar-slot-w)');
  });

  it('regras: 9-slice horizontal de bronze, fundo da faixa, tokens, sem all:unset e sem cor solta', () => {
    expect(bloco('.sm2-topbar__in')).toContain("barrinha-slot-bronze.png') 0 20 0 20 fill");
    expect(bloco('.sm2-topbar')).toContain("barrinha-faixa-fundo.png')");
    expect(bloco('.sm2-topbar')).not.toContain('safe-area-inset-top'); // colada no topo físico (ordem do dono, 24/11/2026)
    expect(bloco('.sm2-topbar')).toContain('top: 0')
    expect(bloco('.sm2-topbar__val')).toContain('lining-nums tabular-nums');
    for (const s of ['.sm2-topbar', '.sm2-topbar__grupo', '.sm2-topbar__slot', '.sm2-topbar__in', '.sm2-topbar__val']) {
      expect(bloco(s)).not.toMatch(/all:\s*unset|#[0-9a-f]{3,8}\b/i);
    }
    expect(css.indexOf('.sm2-topbar {')).toBeLessThan(css.indexOf('MODAL DE RESULTADO DE FORJA'));
  });
});

describe('a barrinha no Mapa e nos prédios; as pílulas antigas saíram', () => {
  it('Mapa: a barrinha aparece, com os 4 slots, e não há mais as 3 pílulas do canto inferior direito', () => {
    const { container } = renderWithCss(<MapPage language="pt-BR" onOpenArea={() => {}} bits={5000} emblems={1234} credits={99999} energy={6} maxEnergy={6} />);
    expect(container.querySelector('[data-map-page] [data-topbar]')).not.toBeNull();
    expect(slots(container).map(s => s.textContent)).toEqual(['5.000', '6/6', '1,2k', '99k']);
    expect(container.querySelector('[data-map-currencies]')).toBeNull();
    expect(container.querySelector('.sm2-moeda, .sm2-moeda-hud, [data-map-chip]')).toBeNull();
    expect(css).not.toContain('.sm2-moeda');
  });

  const props = { areaId: 'mercado' as const, lotId: 'itens', language: 'pt-BR' as const, title: 'Itens', closeLabel: 'Fechar', open: true };

  it('prédio: o AreaSheet traz a barrinha pelo contexto; sem contexto (Home) não traz', () => {
    const com = renderWithCss(<TopStatusBarContext.Provider value={dados}><AreaSheet {...props} onClose={() => {}}><p>x</p></AreaSheet></TopStatusBarContext.Provider>);
    expect(com.container.querySelector('[data-area-sheet-frame] [data-topbar]')).not.toBeNull();
    expect(slots(com.container)).toHaveLength(4);
    cleanup();
    const sem = renderWithCss(<AreaSheet {...props} onClose={() => {}}><p>x</p></AreaSheet>);
    expect(sem.container.querySelector('[data-topbar]')).toBeNull();
  });

  it('prédio: tocar na barrinha não fecha a folha (o toque não sobe ao backdrop)', () => {
    let fechou = 0;
    const { container } = renderWithCss(<TopStatusBarContext.Provider value={dados}><AreaSheet {...props} onClose={() => { fechou++; }}><p>x</p></AreaSheet></TopStatusBarContext.Provider>);
    fireEvent.click(container.querySelector('[data-info-tip][aria-label^="5.000 Bits"]')!);
    expect(fechou).toBe(0);
  });
});
