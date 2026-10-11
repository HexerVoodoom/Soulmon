/**
 * O PRIMEIRO DIA CONTA OS TRÊS GESTOS (11/10/2026, bug do dono: "fiz carinho e
 * uma tarefa e não contou"). Lê o FONTE do App: nenhum teste em `node` monta o
 * App inteiro. Cada gesto precisa ter um gatilho ligado no caminho REAL.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { emptyFirstDay, markGesture, shouldShowFirstDay, FIRST_DAY_GESTURES } from './utils/firstDay';

const app = readFileSync(join(__dirname, 'App.tsx'), 'utf8');
function body(startMarker: string, len = 4000): string {
  const i = app.indexOf(startMarker);
  expect(i, `${startMarker} não encontrado`).toBeGreaterThan(-1);
  return app.slice(i, i + len);
}

describe('primeiro dia — gatilhos ligados', () => {
  it('carinho: marca ANTES da recusa (pet novo está com vida cheia e recusa a cura)', () => {
    const h = body('const handlePet = useCallback', 6000);
    const marca = h.indexOf("marcarGestoDoDia('pet')");
    const recusa = h.indexOf('rubDecision(gameState, today)');
    expect(marca).toBeGreaterThan(-1);
    expect(marca).toBeLessThan(recusa);
  });
  it('tarefa: tarefa avulsa, hábito sem etapas e hábito com etapas marcam "task"', () => {
    expect(body('const handleToggleTask', 9000)).toContain("marcarGestoDoDia('task')");
    expect(body('const handleUpdateStep', 7000)).toContain("marcarGestoDoDia('task')");
    expect(body('const handleToggleActivityCompletion', 7000)).toContain("marcarGestoDoDia('task')");
  });
  it('comida: handleFeed marca "feed"', () => {
    expect(body('const handleFeed', 9000)).toContain("marcarGestoDoDia('feed')");
  });
  it('os três gestos completos encerram o cartão', () => {
    let p = emptyFirstDay('d');
    for (const g of FIRST_DAY_GESTURES) { expect(shouldShowFirstDay(p, 'd')).toBe(true); p = markGesture(p, g); }
    expect(shouldShowFirstDay(p, 'd')).toBe(false);
  });
});
