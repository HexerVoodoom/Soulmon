import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * QA G9 (L05-03/L06-01): "Maximum update depth exceeded" contínuo. O efeito do
 * dreno de cocô listava `poopPenaltyClockAt` nas deps, e `applyPoopDrain`
 * reancora esse relógio em `now` (devolvendo objeto novo) nas carências, no
 * perdão e no sono: cada reancoragem re-disparava o efeito, que reancorava de
 * novo. O relógio é LIDO por ref; o intervalo de 60 s já o relê a cada tick.
 */
describe('efeito do dreno de cocô não depende do relógio que ele mesmo escreve', () => {
  const src = readFileSync(new URL('./App.tsx', import.meta.url), 'utf8');
  const depsLine = src
    .split('\n')
    .find(l => l.includes('setGameState, gameState.poopEventsShown'));

  it('as deps do efeito não listam poopPenaltyClockAt', () => {
    expect(depsLine).toBeTruthy();
    expect(depsLine).not.toContain('poopPenaltyClockAt');
  });

  it('o efeito lê o estado por ref', () => {
    expect(src).toContain('poopDrainStateRef.current');
  });
});
