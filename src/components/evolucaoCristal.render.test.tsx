/** @vitest-environment jsdom */
// REGISTRO §208 (31/10/2026): a evolução pelo CRISTAL — cerimônia sem vídeo/sunburst e a fiação do fluxo.
// Revisão visual 03/11/2026 (dono aprovou P1+P2): 6 tempos ancorados no altar do B-bg2, cartão antes→depois.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EvolutionCeremony, PHASE_AT, TOTAL_MS, RESPIRO_MS, SURGE_MS, FORMA_W } from './EvolutionCeremony';
import { EVOLUCAO_ART } from '../utils/criacaoEvolucaoArt';
import { SCENE_BG } from '../utils/fxPackArt';

const mm = (reduce: boolean) => ((q: string) => ({
  matches: reduce && q.includes('reduce'), media: q, onchange: null,
  addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
})) as unknown as typeof window.matchMedia;

const props = {
  fromStage: 'rookie', toStage: 'champion-power', toName: 'Forma', language: 'pt-BR', onClose: () => {},
  fromSpriteUrl: '/antiga.png', toSpriteUrl: '/nova.png',
};

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('cerimônia do cristal — 6 tempos', () => {
  beforeEach(() => { window.matchMedia = mm(false); vi.useFakeTimers(); });

  it('despede → carrega → racha → estilhaça → revela → respiro, e só commita na revelação', () => {
    const onEvolved = vi.fn();
    render(<EvolutionCeremony {...props} onEvolved={onEvolved} />);
    const dlg = () => document.querySelector('[data-evolution-ceremony]')!;
    const q = (s: string) => document.querySelector(s) as HTMLElement | null;
    expect(dlg().getAttribute('data-cer-phase')).toBe('despede');
    expect(q('[data-cer-crystal]')).toBeTruthy();
    expect(q('[data-cer-from-sprite]')!.getAttribute('src')).toBe('/antiga.png');
    act(() => { vi.advanceTimersByTime(PHASE_AT.carrega); });
    expect(dlg().getAttribute('data-cer-phase')).toBe('carrega');
    expect(q('[data-cer-crystal-art]')!.getAttribute('data-tira')).toBe('build');
    expect(q('[data-cer-crystal-art]')!.style.backgroundImage).toContain(EVOLUCAO_ART.build.src);
    expect(q('[data-cer-from-sprite]')).toBeNull();
    act(() => { vi.advanceTimersByTime(PHASE_AT.racha - PHASE_AT.carrega); });
    expect(q('[data-cer-crystal-art]')!.getAttribute('data-tira')).toBe('cracks');
    expect(q('[data-cer-crystal-art]')!.style.backgroundImage).toContain(EVOLUCAO_ART.cracks.src);
    act(() => { vi.advanceTimersByTime(PHASE_AT.estilhaca - PHASE_AT.racha); });
    const cacos = document.querySelectorAll<HTMLElement>('[data-cer-shard]');
    expect(cacos.length).toBeGreaterThan(8);
    expect(cacos[0].style.backgroundImage).toContain(EVOLUCAO_ART.shards.src);
    expect(q('[data-cer-flash]')!.getAttribute('src')).toBe(EVOLUCAO_ART.flash);
    expect(q('[data-cer-crystal]')).toBeNull();
    expect(onEvolved).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(PHASE_AT.revela - PHASE_AT.estilhaca); });
    expect(onEvolved).toHaveBeenCalledTimes(1);
    expect(q('[data-cer-sprite]')!.getAttribute('src')).toBe('/nova.png');
    expect(q('[data-cer-sprite]')!.style.width).toBe(`${FORMA_W}%`);
    expect(q('[data-cer-pedestal]')!.getAttribute('src')).toBe(EVOLUCAO_ART.pedestal);
    expect(q('[data-cer-embers]')!.style.backgroundImage).toContain(EVOLUCAO_ART.embers.src);
    act(() => { vi.advanceTimersByTime(SURGE_MS + RESPIRO_MS - 1); });
    expect(document.body.textContent).not.toContain('Seguimos juntos');
    act(() => { vi.advanceTimersByTime(1); });
    expect(document.body.textContent).toContain('Seguimos juntos');
    expect(TOTAL_MS).toBeGreaterThanOrEqual(5500);
    expect(TOTAL_MS).toBeLessThanOrEqual(6500);
  });

  it('a cena é o B-bg2 num palco 9:16; o título de espera não tem reticências', () => {
    render(<EvolutionCeremony {...props} onEvolved={() => {}} />);
    expect((document.querySelector('[data-cer-stage]') as HTMLElement).style.backgroundImage).toContain(SCENE_BG.evolucao);
    expect(document.querySelector('h1')!.textContent).toBe('Algo está mudando');
    expect(document.body.textContent).not.toContain('…');
  });

  it('sem vídeo e sem sunburst', () => {
    render(<EvolutionCeremony {...props} onEvolved={() => {}} />);
    expect(document.querySelector('video')).toBeNull();
    expect(document.querySelector('canvas')).toBeNull();
  });
});

describe('cerimônia — movimento reduzido', () => {
  it('estado final direto: forma nova no pedestal, sem animação longa, commit na montagem', () => {
    window.matchMedia = mm(true);
    const onEvolved = vi.fn();
    render(<EvolutionCeremony {...props} onEvolved={onEvolved} />);
    expect(onEvolved).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-cer-sprite]')?.getAttribute('data-reveal')).toBe('fade');
    expect(document.querySelector('[data-cer-pedestal]')).toBeTruthy();
    expect(document.querySelector('[data-cer-shard]')).toBeNull();
    expect(document.querySelector('[data-cer-embers]')).toBeNull();
    expect(document.querySelector('[data-cer-crystal]')).toBeNull();
  });
});

describe('faixa final enxuta + cartão antes→depois', () => {
  it('o cartão leva a forma antiga e a nova nos soquetes; data e fragmentos numa linha; pontos zerados pequeno', () => {
    window.matchMedia = mm(true);
    render(<EvolutionCeremony {...props} fragmentsSpent={30} reachedAt="2026-11-03T12:00:00Z" onEvolved={() => {}} />);
    const card = document.querySelector('[data-cer-card]') as HTMLElement;
    expect(card.style.backgroundImage).toContain(EVOLUCAO_ART.card);
    expect(card.querySelector('[data-cer-card-from]')!.getAttribute('src')).toBe('/antiga.png');
    expect(card.querySelector('[data-cer-card-to]')!.getAttribute('src')).toBe('/nova.png');
    expect(card.querySelector('h1')!.textContent).toBe('Forma');
    const linha = document.querySelector('[data-cer-linha]') as HTMLElement;
    expect(linha.querySelector('[data-cer-date]')).toBeTruthy();
    expect(linha.querySelector('[data-cer-fragments]')).toBeTruthy();
    expect((document.querySelector('[data-cer-points-reset]') as HTMLElement).style.fontSize).toBe('var(--text-xs)');
  });
});

describe('fiação do cristal (contrato no fonte)', () => {
  const APP = readFileSync(resolve(__dirname, '../App.tsx'), 'utf8');
  const AREA = readFileSync(resolve(__dirname, './nav/AreaView.tsx'), 'utf8');
  it('o toque põe no cristal; o lote só parte no cristal; a Home recebe a fase', () => {
    expect(APP).toMatch(/evolutionCrystal: startCrystal\(/);
    expect(APP).toMatch(/crystalFormId: activeCrystal\(gameState\)\?\.to \?\? null/);
    expect(APP).toMatch(/emCristal=\{cristalFase\}/);
    expect(APP).toMatch(/evolutionCrystal: undefined,/);
  });
  it('o AreaView recusa os prédios do cristal com o aviso', () => {
    expect(APP).toMatch(/emCristal=\{!!cristal\}/);
    expect(AREA).toMatch(/cristalBlocks\(l\.id\)\) return \{ \.\.\.l, mark: undefined, onOpen: \(\) => setLockNote\(crystalRefusalText/);
  });
});
