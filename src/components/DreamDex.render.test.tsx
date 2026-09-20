// @vitest-environment jsdom
/**
 * O Dex de Sonhos — canvas Pet (DECISÕES §8 P1/P2, §22 D-P7).
 *
 *  1. **Vazio (P1)**: sem `progressbar` em 0% e sem as frações em zero; o
 *     dígito "0 of 30 · dreams discovered" FICA, como texto quieto (13.7/A6).
 *     As frações voltam assim que UMA raridade sai do zero (guarda 1c).
 *  2. **"#NN · data" (P2)** só no obtido: `#NN` global no `DREAM_CATALOG`; save
 *     antigo sem `dreamDates` mostra só o "#NN" — nunca data inventada.
 *  3. **Célula = mini-visor 64² sem anel**, cena a 48; a silhueta é
 *     `mask-image` do PNG numa tinta `color-mix` sem alpha — nada de
 *     `opacity()`/`grayscale` em `filter`.
 *  4. **"???" + `aria-label`** no não obtido; contagem de coleção sem "%".
 */
import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithCss } from '../test/renderEnv';
import { DreamDex } from './DreamDex';
import { createRestState, DREAM_CATALOG, DREAMS_BY_RARITY } from '../utils/restWindow';

const C0 = DREAM_CATALOG[0];               // #01, common
const R0 = DREAMS_BY_RARITY.rare[0];       // #09 — o catálogo intercala (os raros começam em #09, como no canvas)
const numeroDe = (id: string) => `#${String(DREAM_CATALOG.findIndex(d => d.id === id) + 1).padStart(2, '0')}`;

describe('Dex vazio (P1)', () => {
  it('sem barra, sem frações; "0 of 30 · dreams discovered" como texto quieto', () => {
    renderWithCss(<DreamDex rest={createRestState()} language="en-US" />);
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(document.querySelector('[data-dex-count]')!.textContent).toBe(`0 of ${DREAM_CATALOG.length} · dreams discovered`);
    expect(document.querySelectorAll('[data-rarity-count]')).toHaveLength(0);
    // todas as 30 células existem, todas silhueta + "???"
    expect(document.querySelectorAll('[data-silhouette]')).toHaveLength(DREAM_CATALOG.length);
    expect(screen.getAllByText('???')).toHaveLength(DREAM_CATALOG.length);
  });
});

describe('Dex parcial (P2, D-P7)', () => {
  const rest = { ...createRestState(), dreams: [C0.id, R0.id], dreamDates: { [C0.id]: '2026-09-12' } };

  it('barra + frações por raridade (inclusive "0 of 8" — guarda 1c); contagem sem %', () => {
    const { container } = renderWithCss(<DreamDex rest={rest} language="en-US" />);
    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuenow')).toBe('2');
    expect(document.querySelector('[data-dex-count]')!.textContent).toBe(`2 of ${DREAM_CATALOG.length}`);
    const fracoes = Array.from(document.querySelectorAll('[data-rarity-count]')).map(e => e.textContent);
    expect(fracoes).toEqual([`1 of ${DREAMS_BY_RARITY.common.length}`, `1 of ${DREAMS_BY_RARITY.rare.length}`, `0 of ${DREAMS_BY_RARITY.legendary.length}`]);
    expect(container.textContent).not.toMatch(/%|left|remaining|faltam/i);
  });

  it('"#NN · data" no obtido com data; só "#NN" sem data; nada no não obtido', () => {
    renderWithCss(<DreamDex rest={rest} language="en-US" />);
    const c0 = document.querySelector(`[data-dream="${C0.id}"] [data-dream-date]`)!;
    expect(c0.textContent).toBe(`${numeroDe(C0.id)} · Sep 12`);
    expect(numeroDe(C0.id)).toBe('#01');
    const r0 = document.querySelector(`[data-dream="${R0.id}"] [data-dream-date]`)!;
    expect(r0.textContent).toBe(numeroDe(R0.id));
    expect(numeroDe(R0.id)).toBe('#09');
    expect((r0 as HTMLElement).style.marginTop).toBe('auto');
    const naoObtida = document.querySelector(`[data-dream="${DREAM_CATALOG[1].id}"]`)!;
    expect(naoObtida.querySelector('[data-dream-date]')).toBeNull();
  });

  it('PT-BR: "#01 · 12/09"', () => {
    renderWithCss(<DreamDex rest={rest} language="pt-BR" />);
    expect(document.querySelector(`[data-dream="${C0.id}"] [data-dream-date]`)!.textContent).toBe('#01 · 12/09');
  });

  it('célula obtida: mini-visor 64² sem anel com a cena a 48', () => {
    renderWithCss(<DreamDex rest={rest} language="en-US" />);
    const cel = document.querySelector(`[data-dream="${C0.id}"]`)!;
    const vidro = cel.querySelector<HTMLElement>('[data-mini-glass]')!;
    expect(vidro.style.width).toBe('64px');
    expect(vidro.classList.contains('sm2-viewport-screen')).toBe(true);
    expect(vidro.closest('.sm2-viewport')).toBeNull();
    const img = vidro.querySelector('img')!;
    expect(img.getAttribute('width')).toBe('48');
    expect(cel.getAttribute('aria-label')).toBe(C0.labelEn);
  });

  it('não obtido: silhueta por mask-image em tinta color-mix, sem filter/opacity; "???" + aria-label', () => {
    renderWithCss(<DreamDex rest={rest} language="en-US" />);
    const cel = document.querySelector<HTMLElement>(`[data-dream="${DREAM_CATALOG[1].id}"]`)!;
    expect(cel.getAttribute('aria-label')).toBe('Dream not discovered yet');
    expect(cel.textContent).toContain('???');
    const sil = cel.querySelector<HTMLElement>('[data-silhouette]')!;
    const css = sil.getAttribute('style') ?? '';
    expect(css).toMatch(/mask-image:\s*url\(/);
    expect(sil.style.backgroundColor || css).toMatch(/color-mix\(in srgb, var\(--sm2-viewport-bg\) 58%, var\(--sm2-viewport-ink\)\)/);
    expect(sil.style.width).toBe('48px');
    expect(css).not.toMatch(/opacity|grayscale|filter/);
    expect(cel.querySelector('img')).toBeNull();
  });
});
