/** 17/11/2026 (dono): nada de Passeio/tutorial abre sozinho no 1o dia. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { needsWelcomeTour, needsMapTutorial } from './welcomeTourGate';

const app = readFileSync('src/App.tsx', 'utf8');

describe('inicio sem Passeio automatico', () => {
  it('tour e tutorial do mapa nunca entram na fila sozinhos', () => {
    for (const shown of [true, false]) for (const j of [true, false]) expect(needsWelcomeTour({ shown, jaConcluiuAlgo: j })).toBe(false);
    for (const seen of [false, true, undefined]) expect(needsMapTutorial({ seen, onMap: true, welcomeTourOpen: false })).toBe(false);
  });
  it('a apresentacao do predio (NPC do Passeio) nao abre na 1a visita', () => {
    expect(app).toContain('const BUILDING_INTRO_AUTO = false');
    expect(app).toMatch(/BUILDING_INTRO_AUTO && vistos !== undefined/);
  });
  it('so gesto abre o Passeio: setStrollNow e a folha do lote so por concluirPasseio/irAoPasseio', () => {
    expect((app.match(/setStrollNow\((?!null)/g) ?? []).length).toBe(1);
    expect((app.match(/lot: 'passeio'/g) ?? []).length).toBe(1);
    expect(app).toContain("passeio: primeiroDiaAtivo ? null :");
  });
});
