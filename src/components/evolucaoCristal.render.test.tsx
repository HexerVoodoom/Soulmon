/** @vitest-environment jsdom */
// REGISTRO §208 (31/10/2026): a evolução pelo CRISTAL — cerimônia sem vídeo/sunburst e a fiação do fluxo.
import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { render, cleanup, act } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { EvolutionCeremony, PHASE_AT, TOTAL_MS } from './EvolutionCeremony';

const mm = (reduce: boolean) => ((q: string) => ({
  matches: reduce && q.includes('reduce'), media: q, onchange: null,
  addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
})) as unknown as typeof window.matchMedia;

const props = { fromStage: 'rookie', toStage: 'champion-power', toName: 'Forma', language: 'pt-BR', onClose: () => {} };

afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('cerimônia do cristal', () => {
  beforeEach(() => { window.matchMedia = mm(false); vi.useFakeTimers(); });

  it('treme → racha → estilhaça → revela, e só commita na revelação', () => {
    const onEvolved = vi.fn();
    render(<EvolutionCeremony {...props} onEvolved={onEvolved} />);
    const dlg = () => document.querySelector('[data-evolution-ceremony]')!;
    expect(dlg().getAttribute('data-cer-phase')).toBe('treme');
    expect(document.querySelector('[data-cer-crystal]')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(PHASE_AT.racha); });
    expect(dlg().getAttribute('data-cer-phase')).toBe('racha');
    expect(document.querySelectorAll('[data-cer-cracks] path').length).toBeGreaterThan(2);
    act(() => { vi.advanceTimersByTime(PHASE_AT.estilhaca - PHASE_AT.racha); });
    expect(document.querySelectorAll('[data-cer-shard]').length).toBeGreaterThan(8);
    expect(document.querySelector('[data-cer-crystal]')).toBeNull();
    expect(onEvolved).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(PHASE_AT.revela - PHASE_AT.estilhaca); });
    expect(onEvolved).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-cer-sprite]')).toBeTruthy();
    act(() => { vi.advanceTimersByTime(TOTAL_MS); });
    expect(document.body.textContent).toContain('Seguimos juntos');
  });

  it('sem vídeo e sem sunburst', () => {
    render(<EvolutionCeremony {...props} onEvolved={() => {}} />);
    expect(document.querySelector('video')).toBeNull();
    expect(document.querySelector('canvas')).toBeNull();
  });
});

describe('cerimônia — movimento reduzido', () => {
  it('fade simples para a forma nova, commit na montagem', () => {
    window.matchMedia = mm(true);
    const onEvolved = vi.fn();
    render(<EvolutionCeremony {...props} onEvolved={onEvolved} />);
    expect(onEvolved).toHaveBeenCalledTimes(1);
    expect(document.querySelector('[data-cer-sprite]')?.getAttribute('data-reveal')).toBe('fade');
    expect(document.querySelector('[data-cer-shard]')).toBeNull();
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
